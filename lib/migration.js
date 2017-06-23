// Copyright IBM Corp. 2015. All Rights Reserved.
// Node module: loopback-connector-oracle
// US Government Users Restricted Rights - Use, duplication or disclosure
// restricted by GSA ADP Schedule Contract with IBM Corp.

'use strict';
var async = require('async');

module.exports = mixinMigration;

function mixinMigration(Oracle) {
  /*!
   * Discover the properties from a table
   * @param {String} model The model name
   * @param {Function} cb The callback function
   */
  Oracle.prototype.getTableStatus = function(model, cb) {
    function decoratedCallback(err, data) {
      if (err) {
        console.error(err);
      }
      if (!err) {
        data.forEach(function(field) {
          field.type = mapOracleDatatypes(field.type);
        });
      }
      cb(err, data);
    }

    this.execute('SELECT column_name AS "column", data_type AS "type",' +
      ' nullable AS "nullable"' + // , data_default AS "Default"'
      ' FROM "SYS"."USER_TAB_COLUMNS" WHERE table_name=\'' +
      this.table(model) + '\'', decoratedCallback);
  };
  /**
   * Perform autoupdate for the given models
   * @param {String[]} [models] A model name or an array of model names. If not
   * present, apply to all models
   * @param {Function} [cb] The callback function
   */
  Oracle.prototype.autoupdate = function(models, cb) {
    var self = this;
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

  /*!
   * Check if the models exist
   * @param {String[]} [models] A model name or an array of model names. If not
   * present, apply to all models
   * @param {Function} [cb] The callback function
   */
  Oracle.prototype.isActual = function(models, cb) {
    var self = this;

    if ((!cb) && ('function' === typeof models)) {
      cb = models;
      models = undefined;
    }
    // First argument is a model name
    if ('string' === typeof models) {
      models = [models];
    }

    models = models || Object.keys(this._models);

    var changes = [];
    async.eachLimit(models, this.parallelLimit, function(model, done) {
      self.getTableStatus(model, function(err, fields) {
        changes = changes.concat(self.getAddModifyColumns(model, fields));
        changes = changes.concat(self.getDropColumns(model, fields));
        done(err);
      });
    }, function done(err) {
      if (err) {
        return cb && cb(err);
      }
      var actual = (changes.length === 0);
      if (cb) cb(null, actual);
    });
  };

  /**
   * Alter the table for the given model
   * @param {String} model The model name
   * @param {Object[]} actualFields Actual columns in the table
   * @param {Function} [cb] The callback function
   */
  Oracle.prototype.alterTable = function(model, actualFields, cb) {
    var self = this;
    var pendingChanges = self.getAddModifyColumns(model, actualFields);
    if (pendingChanges.length > 0) {
      self.applySqlChanges(model, pendingChanges, function(err, results) {
        var dropColumns = self.getDropColumns(model, actualFields);
        if (dropColumns.length > 0) {
          self.applySqlChanges(model, dropColumns, cb);
        } else {
          if (cb) cb(null, actual);
        }
      });
    } else {
      var dropColumns = self.getDropColumns(model, actualFields);
      if (dropColumns.length > 0) {
        self.applySqlChanges(model, dropColumns, cb);
      } else {
        if (cb) process.nextTick(cb.bind(null, null, []));
      }
    }
  };

  Oracle.prototype.getAddModifyColumns = function(model, actualFields) {
    var sql = [];
    var self = this;
    sql = sql.concat(self.getColumnsToAdd(model, actualFields));
    sql = sql.concat(self.getPropertiesToModify(model, actualFields));
    return sql;
  };

  Oracle.prototype.getDropColumns = function(model, actualFields) {
    var sql = [];
    var self = this;
    sql = sql.concat(self.getColumnsToDrop(model, actualFields));
    return sql;
  };

  Oracle.prototype.getColumnsToAdd = function(model, actualFields) {
    var self = this;
    var m = self._models[model];
    var propNames = Object.keys(m.properties);
    var sql = [];
    propNames.forEach(function(propName) {
      if (self.id(model, propName)) {
        return;
      }
      var found = self.searchForPropertyInActual(model,
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

  Oracle.prototype.addPropertyToActual = function(model, propName) {
    var self = this;
    var sqlCommand = self.columnEscaped(model, propName) +
      ' ' + self.columnDataType(model, propName) +
      (self.isNullable(self.getPropertyDefinition(model, propName)) ?
        '' : ' NOT NULL');
    return sqlCommand;
  };

  Oracle.prototype.searchForPropertyInActual =
    function(model, propName, actualFields) {
      var self = this;
      var found = false;
      actualFields.forEach(function(f) {
        if (f.column === self.column(model, propName)) {
          found = f;
          return;
        }
      });
      return found;
    };

  Oracle.prototype.getPropertiesToModify = function(model, actualFields) {
    var self = this;
    var sql = [];
    var m = self._models[model];
    var propNames = Object.keys(m.properties);
    var found;
    propNames.forEach(function(propName) {
      if (self.id(model, propName)) {
        return;
      }
      found = self.searchForPropertyInActual(model, propName, actualFields);
      if (found && self.propertyHasNotBeenDeleted(model, propName)) {
        var column = self.columnEscaped(model, propName);
        var clause = '';
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
      var newSettings = m.properties[propName];
      if (!newSettings) {
        return false;
      }
      return oldSettings.type.toUpperCase() !== self.columnDataType(model, propName);
    }

    function nullabilityChanged(propName, oldSettings) {
      var newSettings = m.properties[propName];
      if (!newSettings) {
        return false;
      }
      var changed = false;
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
    var self = this;
    var sqlCommand = self.columnDataType(model, propName);
    return sqlCommand;
  };

  Oracle.prototype.modifyNullabilityInActual = function(model, propName) {
    var self = this;
    var sqlCommand = '';
    if (self.isNullable(self.getPropertyDefinition(model, propName))) {
      sqlCommand = sqlCommand + 'NULL';
    } else {
      sqlCommand = sqlCommand + 'NOT NULL';
    }
    return sqlCommand;
  };

  Oracle.prototype.getColumnsToDrop = function(model, actualFields) {
    var self = this;
    var sql = [];
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

  Oracle.prototype.applySqlChanges = function(model, pendingChanges, cb) {
    var self = this;
    if (pendingChanges.length) {
      var thisQuery = 'ALTER TABLE ' + self.tableEscaped(model);
      var ranOnce = false;
      pendingChanges.forEach(function(change) {
        if (ranOnce) {
          thisQuery = thisQuery + ' ';
        }
        thisQuery = thisQuery + ' ' + change;
        ranOnce = true;
      });
      self.execute(thisQuery, cb);
    }
  };

  /*!
   * Build a list of columns for the given model
   * @param {String} model The model name
   * @returns {String}
   */
  Oracle.prototype.buildColumnDefinitions = function(model) {
    var self = this;
    var sql = [];
    var pks = this.idNames(model).map(function(i) {
      return self.columnEscaped(model, i);
    });
    Object.keys(this.getModelDefinition(model).properties).
      forEach(function(prop) {
        var colName = self.columnEscaped(model, prop);
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
    var self = this;
    var result = self.columnDataType(model, propName);
    if (!self.isNullable(self.getPropertyDefinition(model, propName))) {
      result = result + ' NOT NULL';
    }
    return result;
  };

  Oracle.prototype._isIdGenerated = function(model) {
    var idNames = this.idNames(model);
    if (!idNames) {
      return false;
    }
    var idName = idNames[0];
    var id = this.getModelDefinition(model).properties[idName];
    var idGenerated = idNames.length > 1 ? false : id && id.generated;
    return idGenerated;
  };

  /**
   * Drop a table for the given model
   * @param {String} model The model name
   * @param {Function} [cb] The callback function
   */
  Oracle.prototype.dropTable = function(model, cb) {
    var self = this;
    var name = self.tableEscaped(model);
    var seqName = self.escapeName(model + '_ID_SEQUENCE');

    var count = 0;
    var dropTableFun = function(callback) {
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

    var tasks = [dropTableFun];
    if (this._isIdGenerated(model)) {
      tasks.push(
        function(callback) {
          self.execute('DROP SEQUENCE ' + seqName, function(err) {
            if (err && err.toString().indexOf('ORA-02289') >= 0) {
              err = null; // Ignore it
            }
            callback(err);
          });
        });
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
    var self = this;
    var name = self.tableEscaped(model);
    var seqName = self.escapeName(model + '_ID_SEQUENCE');
    var triggerName = self.escapeName(model + '_ID_TRIGGER');
    var idName = self.idColumnEscaped(model);

    var tasks = [
      function(callback) {
        self.execute('CREATE TABLE ' + name + ' (\n  ' +
          self.buildColumnDefinitions(model) + '\n)', callback);
      }];

    if (this._isIdGenerated(model)) {
      tasks.push(
        function(callback) {
          self.execute('CREATE SEQUENCE ' + seqName +
            ' START WITH 1 INCREMENT BY 1 CACHE 100', callback);
        });

      tasks.push(
        function(callback) {
          self.execute('CREATE OR REPLACE TRIGGER ' + triggerName +
            ' BEFORE INSERT ON ' + name + ' FOR EACH ROW\n' +
            'WHEN (new.' + idName + ' IS NULL)\n' +
            'BEGIN\n' +
            '  SELECT ' + seqName + '.NEXTVAL INTO :new.' +
            idName + ' FROM dual;\n' +
            'END;', callback);
        });
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
    var columnMetadata = this.columnMetadata(model, property);
    var colType = columnMetadata && columnMetadata.dataType;
    if (colType) {
      colType = colType.toUpperCase();
    }
    var prop = this.getModelDefinition(model).properties[property];
    if (!prop) {
      return null;
    }
    var colLength = columnMetadata && columnMetadata.dataLength || prop.length;
    if (colType) {
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
    //TODO there are a lot of synonymous type names that should go here--
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

  Oracle.prototype.propertyHasNotBeenDeleted = function(model, propName) {
    return !!this.getModelDefinition(model).properties[propName];
  };
}
