/**
 * Oracle adapter for JugglingDB
 */
var oracle = require('oracle');
var jdb = require('jugglingdb');
var util = require('util');

/**
 * Initialize the adapter
 * 
 * @param schema
 *          The juggling schema
 * @param callback
 *          The callback function
 */
exports.initialize = function initializeSchema(schema, callback) {
    if (!oracle) return;

    var s = schema.settings;
    var oracle_settings = {
        hostname: s.host || 'localhost',
        port: s.port || 1521,
        user: s.username,
        password: s.password,
        database: s.database || 'XE',
        debug: s.debug || false
        
    };
    
    schema.adapter = new Oracle(oracle, oracle_settings);
    schema.adapter.schema = schema;
    
};

/**
 * Oracle adapter constructor
 * 
 * @param oracle
 * @param settings
 * @returns
 */
function Oracle(oracle, settings) {
    this.name = 'oracle';
    this.oracle = oracle;
    this._models = {};
    this.settings = settings;
    this.connection = null;
}

// Inherit from jugglingdb BaseSQL
require('util').inherits(Oracle, jdb.BaseSQL);

/**
 * Connect to oracle
 */
Oracle.prototype.connect = function (callback) {
  var self = this;
      this.oracle.connect(this.settings, function (err, connection) {
        if (!err){
            self.connection = connection;
            callback && callback();
        } else {
            console.error(err);
            throw err;
        }
    });
};

/**
 * Run SQL statements
 */
Oracle.prototype.query = function (sql, params, callback) {
  if (!this.schema.connected) {
    // Not connected yet, set up a listener to run the query once it's connected
    this.schema.on('connected', function () {
        this.query(sql, params, callback);
    }.bind(this));
    
    this.schema.connect();
    return;
  }
  
  if(!callback && typeof params === 'function') {
    callback = params;
    params = [];
  }
  
  params = params || [];
  
    var time = Date.now();
    var log = this.log;
    
    if(params && params.length > 0) {
      console.log('SQL: ' + sql + '\nParameters: ' + params);
    } else {
      console.log('SQL: ' + sql);
    }
    this.connection.execute(sql, params, function (err, data) {
        if(data) console.dir(data);
        // console.log(err);
        if (log) log(sql, time);
        callback(err, data ? data : null);
    });
};

/**
 * Count the table
 */
Oracle.prototype.count = function count(model, callback, filter) {
    this.query('SELECT count("id") as cnt  FROM ' + this.tableEscaped(model) 
        + ' ' + this.toFilter(model, filter && {where: filter}), function (err, data) {
        if (err) return callback(err);
        callback(err, data && data[0] && data[0].cnt);
    }.bind(this));
};

/**
 * Create the data model in Oracle
 */
Oracle.prototype.create = function (model, data, callback) {
    var fields = this.toFields(model, data, true);
    var sql = 'INSERT INTO ' + this.tableEscaped(model) + '';
    if (fields) {
        sql += ' ' + fields;
    } else {
        sql += ' VALUES ()';
    }
    sql += ' RETURNING "id" into :1';
    this.query(sql, [new oracle.OutParam()], function (err, info) {
        if (err) return callback(err);
        callback(err, info && info.returnParam);
    });
};

/**
 * Update or create a data model
 */
Oracle.prototype.updateOrCreate = function (model, data, callback) {
    var oracle = this;
    var fieldsNames = [];
    var fieldValues = [];
    var combined = [];
    var props = this._models[model].properties;
    Object.keys(data).forEach(function (key) {
        if (props[key] || key === 'id') {
            var k = '"' + key + '"';
            var v;
            if (key !== 'id') {
                v = oracle.toDatabase(props[key], data[key]);
            } else {
                v = data[key];
            }
            fieldsNames.push(k);
            fieldValues.push(v);
            if (key !== 'id') combined.push(k + ' = ' + v);
        }
    });

    var sql = 'UPDATE ' + this.tableEscaped(model);
    sql += ' SET ' + combined + ' WHERE "id" = ' + data.id + ';';
    sql += ' INSERT INTO ' + this.tableEscaped(model);
    sql += ' (' + fieldsNames.join(', ') + ')';
    sql += ' SELECT ' + fieldValues.join(', ')
    sql += ' WHERE NOT EXISTS (SELECT 1 FROM ' + this.tableEscaped(model);
    sql += ' WHERE "id" = ' + data.id + ') RETURNING "id" into :1';

    this.query(sql, [new oracle.OutParam()], function (err, info) {
        if (!err && info && info.returnParam) {
            data.id =info.returnParam;
        }
        callback(err, data);
    });
};

/**
 * Get a list of fields
 */
Oracle.prototype.toFields = function (model, data, forCreate) {
    var fields = [];
    var props = this._models[model].properties;
    
    if(forCreate){
      var columns = [];
      Object.keys(data).forEach(function (key) {
          if (props[key]) {
              if (key !== 'id') {
                columns.push('"' + key + '"');
                fields.push(this.toDatabase(props[key], data[key]));
              }
          }
      }.bind(this));
      return '(' + columns.join(',') + ') VALUES ('+fields.join(',')+')';
    }else{
      Object.keys(data).forEach(function (key) {
          if (props[key]) {
              fields.push('"' + key + '" = ' + this.toDatabase(props[key], data[key]));
          }
      }.bind(this));
      return fields.join(',');
    }
};

function dateToOracle(val) {
    return [
        val.getUTCFullYear(),
        fz(val.getUTCMonth() + 1),
        fz(val.getUTCDate())
    ].join('-') + ' ' + [
        fz(val.getUTCHours()),
        fz(val.getUTCMinutes()),
        fz(val.getUTCSeconds())
    ].join(':');

    function fz(v) {
        return v < 10 ? '0' + v : v;
    }
}

/**
 * Convert name/value to database value
 */
Oracle.prototype.toDatabase = function (prop, val) {
    if (val === null || val === undefined) {
		// Oracle complains with NULLs in not null columns
		// If we have an autoincrement value, return DEFAULT instead
        if( prop.autoIncrement ) {
            return 'DEFAULT';
        }
        else {
            return 'NULL';
	    }
    }
    if (val.constructor.name === 'Object') {
        var operator = Object.keys(val)[0]
        val = val[operator];
        if (operator === 'between') {
            return this.toDatabase(prop, val[0]) + ' AND ' + this.toDatabase(prop, val[1]);
        }
        if (operator === 'inq' || operator === 'nin') {
            for (var i = 0; i < val.length; i++) {
                val[i] = escape(val[i]);
            }
            return val.join(',');
        }
    }
    if (prop.type.name === 'Number') {
      if (!val && val!==0) {
          if( prop.autoIncrement ) {
              return 'DEFAULT';
          }
          else {
              return 'NULL';
          }
      }
      return val
    };

    if (prop.type.name === 'Date') {
        if (!val) {
            if( prop.autoIncrement ) {
                return 'DEFAULT';
            }
            else {
                return 'NULL';
            }
        }
        if (!val.toUTCString) {
            val = new Date(val);
        }
        return escape(dateToOracle(val));
    }
    return escape(val.toString());

};

/**
 * Get the data from database
 */
Oracle.prototype.fromDatabase = function (model, data) {
    if (!data) return null;
    var props = this._models[model].properties;
    Object.keys(data).forEach(function (key) {
        var val = data[key];
        data[key] = val;
    });
    return data;
};

Oracle.prototype.escapeName = function (name) {
    return '"' + name.replace(/\./g, '"."') + '"';
};

Oracle.prototype.getColumns = function(model){
    return '"' + Object.keys(this._models[model].properties).join('", "') + '"';
}   


Oracle.prototype.all = function all(model, filter, callback) {
    this.query('SELECT ' + this.getColumns(model) +  '  FROM ' + this.tableEscaped(model) + ' ' + this.toFilter(model, filter), function (err, data) {
        if (err) {
            return callback(err, []);
        }
        if (filter && filter.include) {
            this._models[model].model.include(data, filter.include, callback);
        } else {
            callback(null, data);
        }
    }.bind(this));
};

Oracle.prototype.toFilter = function (model, filter) {
    if (filter && typeof filter.where === 'function') {
      return filter();
    }
    if (!filter) return '';
    var props = this._models[model].properties;
    var out = '';
    if (filter.where) {
        var fields = [];
        var conds = filter.where;
        if (typeof conds === 'string') {
            fields.push(conds);
        } else if (util.isArray(conds)) {
            var query = conds.shift().replace(/\?/g, function (s) {
                return escape(conds.shift());
            });
            fields.push(query);
        } else {
            Object.keys(conds).forEach(function (key) {
                if (filter.where[key] && filter.where[key].constructor.name === 'RegExp') {
                    var regex = filter.where[key];
                    var sqlCond = '"' + key + '"';

                    if (regex.ignoreCase) {
                        sqlCond += ' ~* ';
                    } else {
                        sqlCond += ' ~ ';
                    }

                    sqlCond += "'"+regex.source+"'";

                    fields.push(sqlCond);

                    return;
                }
                if (props[key]) {
                    var filterValue = this.toDatabase(props[key], filter.where[key]);
                    if (filterValue === 'NULL') {
                        fields.push('"' + key + '" IS ' + filterValue);
                    } else if (conds[key].constructor.name === 'Object') {
                        var condType = Object.keys(conds[key])[0];
                        var sqlCond = '"' + key + '"';
                        if ((condType == 'inq' || condType == 'nin') && filterValue.length == 0) {
                            fields.push(condType == 'inq' ? 'FALSE' : 'TRUE');
                            return true;
                        }
                        switch (condType) {
                            case 'gt':
                                sqlCond += ' > ';
                                break;
                            case 'gte':
                                sqlCond += ' >= ';
                                break;
                            case 'lt':
                                sqlCond += ' < ';
                                break;
                            case 'lte':
                                sqlCond += ' <= ';
                                break;
                            case 'between':
                                sqlCond += ' BETWEEN ';
                                break;
                            case 'inq':
                                sqlCond += ' IN ';
                                break;
                            case 'nin':
                                sqlCond += ' NOT IN ';
                                break;
                            case 'neq':
                                sqlCond += ' != ';
                                break;
                            case 'like':
                                sqlCond += ' LIKE ';
                                break;
                            case 'nlike':
                                sqlCond += ' NOT LIKE ';
                                break;
                            default:
                                sqlCond += ' ' + condType + ' ';
                                break;
                        }
                        sqlCond += (condType == 'inq' || condType == 'nin') ? '(' + filterValue + ')' : filterValue;
                        fields.push(sqlCond);
                    } else {
                        fields.push('"' + key + '" = ' + filterValue);
                    }
                }
            }.bind(this));
        }
        
        if (filter.limit) {
          var offset = Number(filter.offset) || 0;
          var limit = Number(filter.limit);
          if(limit) {
            fields.push('ROWNUM < ' + (offset + limit));
          }
          fields.push('ROWNUM >= ' + offset);
      }

        if (fields.length) {
            out += ' WHERE ' + fields.join(' AND ');
        }
    }

    if (filter.order) {
        var t = filter.order.split(/\s+/);
        filter.order = [];
        t.forEach(function(token) {
            if (token.match(/ASC|DESC/i)) {
                filter.order[filter.order.length - 1] += ' ' + token;
            } else {
                filter.order.push('"' + token + '"');
            }
        });
        out += ' ORDER BY ' + filter.order.join(',');
    }



    return out;
};

Oracle.prototype.exists = function (model, id, callback) {
  var sql = 'SELECT 1 FROM ' +
      this.tableEscaped(model) + ' WHERE "id" = ' + id + ' AND ROWNUM <= 1';

  this.query(sql, function (err, data) {
      if (err) return callback(err);
      callback(null, data.length === 1);
  });
};

Oracle.prototype.find = function find(model, id, callback) {
  var sql = 'SELECT * FROM ' +
      this.tableEscaped(model);
  
  if(id) {
    sql += ' WHERE "id" = ' + id + ' AND ROWNUM <= 1';
  }
  else {
    sql += ' WHERE "id" IS NULL AND ROWNUM <= 1';    
  }

  this.query(sql, function (err, data) {
      if (data && data.length === 1) {
          data[0].id = id;
      } else {
          data = [null];
      }
      callback(err, this.fromDatabase(model, data[0]));
  }.bind(this));
};

function getTableStatus(model, cb){
    function decoratedCallback(err, data){
        data.forEach(function(field){
            field.Type = mapOracleDatatypes(field.Type);
        });
        cb(err, data);
    };
    this.query('SELECT column_name as "Field", udt_name as "Type", is_nullable as "Null", column_default as "Default" FROM information_schema.COLUMNS WHERE table_name = \'' + this.table(model) + '\'', decoratedCallback);
};

Oracle.prototype.autoupdate = function (cb) {
    var self = this;
    var wait = 0;
    Object.keys(this._models).forEach(function (model) {
        wait += 1;
        var fields;
        getTableStatus.call(self, model, function(err, fields){
            if (!err && fields.length) {
                self.alterTable(model, fields, done);
            } else {
                self.createTable(model, done);
            }
        });
    });

    function done(err) {
        if (err) {
            console.log(err);
        }
        if (--wait === 0 && cb) {
            cb();
        }
    };
};

Oracle.prototype.isActual = function(cb) {
    var self = this;
    var wait = 0;
    var changes = [];
    Object.keys(this._models).forEach(function (model) {
        wait += 1;
        getTableStatus.call(self, model, function(err, fields){
            changes = changes.concat(getPendingChanges.call(self, model, fields));
            done(err, changes);
        });
    });

    function done(err, fields) {
        if (err) {
            console.log(err);
        }
        if (--wait === 0 && cb) {
            var actual = (changes.length === 0);
            cb(null, actual);
        }
    };
};

Oracle.prototype.alterTable = function (model, actualFields, done) {
  var self = this;
  var pendingChanges = getPendingChanges.call(self, model, actualFields);
  applySqlChanges.call(self, model, pendingChanges, done);
};

function getPendingChanges(model, actualFields){
    var sql = [];
    var self = this;
    sql = sql.concat(getColumnsToAdd.call(self, model, actualFields));
    sql = sql.concat(getPropertiesToModify.call(self, model, actualFields));
    sql = sql.concat(getColumnsToDrop.call(self, model, actualFields));
    return sql;
};

function getColumnsToAdd(model, actualFields){
    var self = this;
    var m = self._models[model];
    var propNames = Object.keys(m.properties);
    var sql = [];
    propNames.forEach(function (propName) {
        if (propName === 'id') return;
        var found = searchForPropertyInActual.call(self, propName, actualFields);
        if(!found && propertyHasNotBeenDeleted.call(self, model, propName)){
            sql.push(addPropertyToActual.call(self, model, propName));
        }
    });
    return sql;
};

function addPropertyToActual(model, propName){
    var self = this;
    var p = self._models[model].properties[propName];
    var sqlCommand = 'ADD COLUMN "' + propName + '" ' + datatype(p) + " " + (propertyCanBeNull.call(self, model, propName) ? "" : " NOT NULL");
    return sqlCommand;
};

function searchForPropertyInActual(propName, actualFields){
    var found = false;
    actualFields.forEach(function (f) {
        if (f.Field === propName) {
            found = f;
            return;
        }
    });
    return found;
};

function getPropertiesToModify(model, actualFields){
    var self = this;
    var sql = [];
    var m = self._models[model];
    var propNames = Object.keys(m.properties);
    var found;
    propNames.forEach(function (propName) {
        if (propName === 'id') return;
        found = searchForPropertyInActual.call(self, propName, actualFields);
        if(found && propertyHasNotBeenDeleted.call(self, model, propName)){
            if (datatypeChanged(propName, found)) {
                sql.push(modifyDatatypeInActual.call(self, model, propName));
            } 
            if (nullabilityChanged(propName, found)){
                sql.push(modifyNullabilityInActual.call(self, model, propName));
            }
        }
    });

    return sql;

    function datatypeChanged(propName, oldSettings){
        var newSettings = m.properties[propName];
        if(!newSettings) return false;
        return oldSettings.Type.toLowerCase() !== datatype(newSettings);
    };

    function nullabilityChanged(propName, oldSettings){
        var newSettings = m.properties[propName];
        if(!newSettings) return false;
        var changed = false;
        if (oldSettings.Null === 'YES' && (newSettings.allowNull === false || newSettings.null === false)) changed = true;
        if (oldSettings.Null === 'NO' && !(newSettings.allowNull === false || newSettings.null === false)) changed = true;
        return changed;
    };
};

function modifyDatatypeInActual(model, propName) {
    var self = this;
    var sqlCommand = 'ALTER COLUMN "' + propName + '"  TYPE ' + datatype(self._models[model].properties[propName]);
    return sqlCommand;
};

function modifyNullabilityInActual(model, propName) {
    var self = this;
    var sqlCommand = 'ALTER COLUMN "' + propName + '" ';
    if(propertyCanBeNull.call(self, model, propName)){
      sqlCommand = sqlCommand + "DROP ";
    } else {
      sqlCommand = sqlCommand + "SET ";
    }
    sqlCommand = sqlCommand + "NOT NULL";
    return sqlCommand;
};

function getColumnsToDrop(model, actualFields){
    var self = this;
    var sql = [];
    actualFields.forEach(function (actualField) {
        if (actualField.Field === 'id') return;
        if (actualFieldNotPresentInModel(actualField, model)) {
            sql.push('DROP COLUMN "' + actualField.Field + '"');
        }
    });
    return sql;

    function actualFieldNotPresentInModel(actualField, model){
        return !(self._models[model].properties[actualField.Field]);
    };
};

function applySqlChanges(model, pendingChanges, done){
    var self = this;
    if (pendingChanges.length) {
       var thisQuery = 'ALTER TABLE ' + self.tableEscaped(model);
       var ranOnce = false;
       pendingChanges.forEach(function(change){
         if(ranOnce) thisQuery = thisQuery + ',';
         thisQuery = thisQuery + ' ' + change;
         ranOnce = true;
       });
       thisQuery = thisQuery + ';';
       self.query(thisQuery, callback);
    }

    function callback(err, data){
      if(err) console.log(err);
    }

    done();
};

Oracle.prototype.propertiesSQL = function (model) {
    var self = this;
    var sql = ['"id" NUMBER PRIMARY KEY'];
    Object.keys(this._models[model].properties).forEach(function (prop) {
        if (prop === 'id') return;
        sql.push('"' + prop + '" ' + self.propertySettingsSQL(model, prop));
    });
    return sql.join(',\n  ');

};

Oracle.prototype.propertySettingsSQL = function (model, propName) {
    var self = this;
    var p = self._models[model].properties[propName];
    var result = datatype(p) + ' '; 
    if(!propertyCanBeNull.call(self, model, propName)) result = result + 'NOT NULL ';
    return result;
};

Oracle.prototype.dropTable = function (model, cb) {
  this.query('DROP TABLE ' + this.tableEscaped(model), cb);
};

Oracle.prototype.createTable = function (model, cb) {
  var self = this;
  var name = self.tableEscaped(model);
  self.query('CREATE TABLE ' + name +
      ' (\n  ' + self.propertiesSQL(model) + '\n)', function(err, data) {
    
  self.query('CREATE SEQUENCE "' + model +'_ID_SEQUENCE"' + 
  ' START WITH 1 INCREMENT BY 1 CACHE 100', function(err, data) {
    
  self.query('CREATE OR REPLACE TRIGGER "' + model+'_ID_TRIGGER"' + 
  ' BEFORE INSERT ON ' + name +  ' FOR EACH ROW \n' + 
  'BEGIN\n' +
  '  SELECT "'+ model+'_ID_SEQUENCE"'+'.NEXTVAL INTO :new."id" FROM dual;\n' +
  'END;', cb);
  });
  });
};

Oracle.prototype.disconnect = function disconnect() {
  if(this.connection) {
    this.connection.close();
  }
};

function propertyCanBeNull(model, propName){
    var p = this._models[model].properties[propName];
    return !(p.allowNull === false || p['null'] === false);
};

function escape(val) {
  if (val === undefined || val === null) {
    return 'NULL';
  }

  switch (typeof val) {
    case 'boolean': return (val) ? 'true' : 'false';
    case 'number': return val+'';
  }

  if (typeof val === 'object') {
    val = (typeof val.toISOString === 'function')
      ? val.toISOString()
      : val.toString();
  }

  val = val.replace(/[\0\n\r\b\t\\\'\"\x1a]/g, function(s) {
    switch(s) {
      case "\0": return "\\0";
      case "\n": return "\\n";
      case "\r": return "\\r";
      case "\b": return "\\b";
      case "\t": return "\\t";
      case "\x1a": return "\\Z";
      default: return "\\"+s;
    }
  });
  // return "q'#"+val+"#'";
  return "'" + val + "'";
};

function datatype(p) {
    switch (p.type.name) {
        default:
        case 'String':
        case 'JSON':
        return 'varchar2(1024)';
        case 'Text':
        return 'text';
        case 'Number':
        return 'integer';
        case 'Date':
        return 'timestamp';
        case 'Boolean':
        return 'char(1)';
    }
};

function mapOracleDatatypes(typeName) {
    //TODO there are a lot of synonymous type names that should go here-- this is just what i've run into so far
    switch (typeName){
        case 'int4':
          return 'integer';
        case 'bool':
          return 'char(1)';
        default:
          return typeName;
    }
};

function propertyHasNotBeenDeleted(model, propName){
    return !!this._models[model].properties[propName];
};
