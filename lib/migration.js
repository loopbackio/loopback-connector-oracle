// Copyright IBM Corp. 2015,2019. All Rights Reserved.
// Node module: loopback-connector-oracle
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';

const async = require('async');

module.exports = mixinMigration;

function mixinMigration(Oracle) {
  Oracle.prototype.showFields = function(model, cb) {
    const sql = 'SELECT column_name AS "column", data_type AS "type",' +
      ' data_length AS "length", nullable AS "nullable"' + // , data_default AS "Default"'
      ' FROM "SYS"."USER_TAB_COLUMNS" WHERE table_name=\'' +
      this.table(model) + '\'';
    this.execute(sql, function(err, fields) {
      if (err)
        return cb(err);
      else {
        fields.forEach(function(field) {
          field.type = mapOracleDatatypes(field.type);
        });
        cb(err, fields);
      }
    });
  };

  /*!
   * Discover the properties from a table
   * @param {String} model The model name
   * @param {Function} cb The callback function
   */
  Oracle.prototype.getTableStatus = function(model, cb) {
    let fields;
    const self = this;

    this.showFields(model, function(err, data) {
      if (err) return cb(err);
      fields = data;

      if (fields)
        return cb(null, fields);
    });
  };

  /**
  * Perform autoupdate for the given models
  * @param {String[]} [models] A model name or an array of model names. If not
  * present, apply to all models
  * @param {Function} [cb] The callback function
  */
  Oracle.prototype.autoupdate = function(models, cb) {
    const self = this;
    if ((!cb) && ('function' === typeof models)) {
      cb = models;
      models = undefined;
    }
    // First argument is a model name
    if ('string' === typeof models) {
      models = [models];
    }

    models = models || Object.keys(this._models);

    async.eachLimit(models, this.parallelLimit, function(model, done) {
      if (!(model in self._models)) {
        return process.nextTick(function() {
          done(new Error('Model not found: ' + model));
        });
      }
      self.getTableStatus(model, function(err, fields) {
        if (!err && fields.length) {
          self.alterTable(model, fields, done);
        } else {
          self.createTable(model, done);
        }
      });
    }, cb);
  };

  /**
   * Alter the table for the given model
   * @param {String} model The model name
   * @param {Object[]} actualFields Actual columns in the table
   * @param {Function} [cb] The callback function
   */
  Oracle.prototype.alterTable = function(model, actualFields, cb) {
    const self = this;
    const pendingChanges = self.getAddModifyColumns(model, actualFields);
    if (pendingChanges.length > 0) {
      self.applySqlChanges(model, pendingChanges, function(err, results) {
        const dropColumns = self.getDropColumns(model, actualFields);
        if (dropColumns.length > 0) {
          self.applySqlChanges(model, dropColumns, cb);
        } else {
          if (cb) cb(err, results);
        }
      });
    } else {
      const dropColumns = self.getDropColumns(model, actualFields);
      if (dropColumns.length > 0) {
        self.applySqlChanges(model, dropColumns, cb);
      } else {
        if (cb) process.nextTick(cb.bind(null, null, []));
      }
    }
  };

  Oracle.prototype.getAddModifyColumns = function(model, actualFields) {
    let sql = [];
    const self = this;
    sql = sql.concat(self.getColumnsToAdd(model, actualFields));
    sql = sql.concat(self.getPropertiesToModify(model, actualFields));
    return sql;
  };

  Oracle.prototype.getColumnsToAdd = function(model, actualFields) {
    const self = this;
    const m = self._models[model];
    const propNames = Object.keys(m.properties);
    let sql = [];
    propNames.forEach(function(propName) {
      if (self.id(model, propName)) {
        return;
      }
      const found = self.searchForPropertyInActual(model,
        self.column(model, propName), actualFields);
      if (!found && self.propertyHasNotBeenDeleted(model, propName)) {
        sql.push(self.addPropertyToActual(model, propName));
      }
    });
    if (sql.length > 0) {
      sql = ['ADD', '(' + sql.join(',') + ')'];
    }
    return sql;
  };

  Oracle.prototype.getPropertiesToModify = function(model, actualFields) {
    const self = this;
    let sql = [];
    const m = self._models[model];
    const propNames = Object.keys(m.properties);
    let found;
    propNames.forEach(function(propName) {
      if (self.id(model, propName)) {
        return;
      }
      found = self.searchForPropertyInActual(model, propName, actualFields);
      if (found && self.propertyHasNotBeenDeleted(model, propName)) {
        const column = self.columnEscaped(model, propName);
        let clause = '';
        if (datatypeChanged(propName, found)) {
          clause = column + ' ' +
            self.modifyDatatypeInActual(model, propName);
        }
        if (nullabilityChanged(propName, found)) {
          if (!clause) {
            clause = column;
          }
          clause = clause + ' ' +
            self.modifyNullabilityInActual(model, propName);
        }
        if (clause) {
          sql.push(clause);
        }
      }
    });

    if (sql.length > 0) {
      sql = ['MODIFY', '(' + sql.join(',') + ')'];
    }
    return sql;

    function datatypeChanged(propName, oldSettings) {
      const newSettings = m.properties[propName];
      if (!newSettings) {
        return false;
      }

      let oldType;
      if (hasLength(self.columnDataType(model, propName))) {
        oldType = oldSettings.type.toUpperCase() +
          '(' + oldSettings.length + ')';
      } else {
        oldType = oldSettings.type.toUpperCase();
      }

      return oldType !== self.columnDataType(model, propName);

      function hasLength(type) {
        const hasLengthRegex = new RegExp(/^[A-Z0-9]*\([0-9]*\)$/);
        return hasLengthRegex.test(type);
      }
    }

    function nullabilityChanged(propName, oldSettings) {
      const newSettings = m.properties[propName];
      if (!newSettings) {
        return false;
      }
      let changed = false;
      if (oldSettings.nullable === 'Y' && !self.isNullable(newSettings)) {
        changed = true;
      }
      if (oldSettings.nullable === 'N' && self.isNullable(newSettings)) {
        changed = true;
      }
      return changed;
    }
  };

  Oracle.prototype.modifyDatatypeInActual = function(model, propName) {
    const self = this;
    const sqlCommand = self.columnDataType(model, propName);
    return sqlCommand;
  };

  Oracle.prototype.modifyNullabilityInActual = function(model, propName) {
    const self = this;
    let sqlCommand = '';
    if (self.isNullable(self.getPropertyDefinition(model, propName))) {
      sqlCommand = sqlCommand + 'NULL';
    } else {
      sqlCommand = sqlCommand + 'NOT NULL';
    }
    return sqlCommand;
  };

  Oracle.prototype.getColumnsToDrop = function(model, actualFields) {
    const self = this;
    let sql = [];
    actualFields.forEach(function(actualField) {
      if (self.idColumn(model) === actualField.column) {
        return;
      }
      if (actualFieldNotPresentInModel(actualField, model)) {
        sql.push(self.escapeName(actualField.column));
      }
    });
    if (sql.length > 0) {
      sql = ['DROP', '(' + sql.join(',') + ')'];
    }
    return sql;

    function actualFieldNotPresentInModel(actualField, model) {
      return !(self.propertyName(model, actualField.column));
    }
  };

  /*!
   * Build a list of columns for the given model
   * @param {String} model The model name
   * @returns {String}
   */
  Oracle.prototype.buildColumnDefinitions = function(model) {
    const self = this;
    const sql = [];
    const pks = this.idNames(model).map(function(i) {
      return self.columnEscaped(model, i);
    });
    Object.keys(this.getModelDefinition(model).properties).
      forEach(function(prop) {
        const colName = self.columnEscaped(model, prop);
        sql.push(colName + ' ' + self.buildColumnDefinition(model, prop));
      });
    if (pks.length > 0) {
      sql.push('PRIMARY KEY(' + pks.join(',') + ')');
    }
    return sql.join(',\n  ');
  };

  /*!
   * Build settings for the model property
   * @param {String} model The model name
   * @param {String} propName The property name
   * @returns {*|string}
   */
  Oracle.prototype.buildColumnDefinition = function(model, propName) {
    const self = this;
    let result = self.columnDataType(model, propName);
    if (!self.isNullable(self.getPropertyDefinition(model, propName))) {
      result = result + ' NOT NULL';
    }
    return result;
  };

  Oracle.prototype._isIdGenerated = function(model) {
    const idNames = this.idNames(model);
    if (!idNames) {
      return false;
    }
    const idName = idNames[0];
    const id = this.getModelDefinition(model).properties[idName];
    const idGenerated = idNames.length > 1 ? false : id && id.generated;
    return idGenerated;
  };

  /**
   * Drop a table for the given model
   * @param {String} model The model name
   * @param {Function} [cb] The callback function
   */
  Oracle.prototype.dropTable = function(model, cb) {
    const self = this;
    const name = self.tableEscaped(model);
    const seqName = self.escapeName(model + '_ID_SEQUENCE');

    let count = 0;
    const dropTableFun = function(callback) {
      self.execute('DROP TABLE ' + name, function(err, data) {
        if (err && err.toString().indexOf('ORA-00054') >= 0) {
          count++;
          if (count <= 5) {
            self.debug('Retrying ' + count + ': ' + err);
            // Resource busy, try again
            setTimeout(dropTableFun, 200 * Math.pow(count, 2));
            return;
          }
        }
        if (err && err.toString().indexOf('ORA-00942') >= 0) {
          err = null; // Ignore it
        }
        callback(err, data);
      });
    };

    const tasks = [dropTableFun];
    if (this._isIdGenerated(model)) {
      tasks.push(
        function(callback) {
          self.execute('DROP SEQUENCE ' + seqName, function(err) {
            if (err && err.toString().indexOf('ORA-02289') >= 0) {
              err = null; // Ignore it
            }
            callback(err);
          });
        },
      );
      // Triggers will be dropped as part the drop table
    }
    async.series(tasks, cb);
  };

  /**
   * Create a table for the given model
   * @param {String} model The model name
   * @param {Function} [cb] The callback function
   */
  Oracle.prototype.createTable = function(model, cb) {
    const self = this;
    const name = self.tableEscaped(model);
    const seqName = self.escapeName(model + '_ID_SEQUENCE');
    const triggerName = self.escapeName(model + '_ID_TRIGGER');
    const idName = self.idColumnEscaped(model);

    const tasks = [
      function(callback) {
        self.execute('CREATE TABLE ' + name + ' (\n  ' +
          self.buildColumnDefinitions(model) + '\n)', callback);
      }];

    if (this._isIdGenerated(model)) {
      tasks.push(
        function(callback) {
          self.execute('CREATE SEQUENCE ' + seqName +
            ' START WITH 1 INCREMENT BY 1 CACHE 100', callback);
        },
      );

      tasks.push(
        function(callback) {
          self.execute('CREATE OR REPLACE TRIGGER ' + triggerName +
            ' BEFORE INSERT ON ' + name + ' FOR EACH ROW\n' +
            'WHEN (new.' + idName + ' IS NULL)\n' +
            'BEGIN\n' +
            '  SELECT ' + seqName + '.NEXTVAL INTO :new.' +
            idName + ' FROM dual;\n' +
            'END;', callback);
        },
      );
    }

    async.series(tasks, cb);
  };

  /*!
   * Find the column type for a given model property
   *
   * @param {String} model The model name
   * @param {String} property The property name
   * @returns {String} The column type
   */
  Oracle.prototype.columnDataType = function(model, property) {
    const columnMetadata = this.columnMetadata(model, property);
    let colType = columnMetadata && columnMetadata.dataType;
    if (colType) {
      colType = colType.toUpperCase();
    }
    const prop = this.getModelDefinition(model).properties[property];
    if (!prop) {
      return null;
    }
    const colLength = columnMetadata && columnMetadata.dataLength ||
                      prop.length;
    if (colType) {
      if (colType === 'CLOB' || colType === 'BLOB') {
        return colType;
      }
      return colType + (colLength ? '(' + colLength + ')' : '');
    }

    switch (prop.type.name) {
      default:
      case 'String':
      case 'JSON':
        return 'VARCHAR2' + (colLength ? '(' + colLength + ')' : '(1024)');
      case 'Text':
        return 'VARCHAR2' + (colLength ? '(' + colLength + ')' : '(1024)');
      case 'Number':
        return 'NUMBER';
      case 'Date':
        return 'DATE';
      case 'Timestamp':
        return 'TIMESTAMP(3)';
      case 'Boolean':
        return 'CHAR(1)'; // Oracle doesn't have built-in boolean
    }
  };

  function mapOracleDatatypes(typeName) {
    // TODO there are a lot of synonymous type names that should go here--
    // this is just what i've run into so far
    switch (typeName) {
      case 'int4':
        return 'NUMBER';
      case 'bool':
        return 'CHAR(1)';
      default:
        return typeName;
    }
  }
}
