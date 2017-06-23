// Copyright IBM Corp. 2013,2016. All Rights Reserved.
// Node module: loopback-connector-oracle
// US Government Users Restricted Rights - Use, duplication or disclosure
// restricted by GSA ADP Schedule Contract with IBM Corp.
'use strict';
/*!
 * Oracle connector for LoopBack
 */
var oracle = null;
try {
  oracle = require('strong-oracle');
} catch (err) {
  try {
    oracle = require('oracle');
  } catch (err1) {
    throw err;
  }
}
var SqlConnector = require('loopback-connector').SqlConnector;
var ParameterizedSQL = SqlConnector.ParameterizedSQL;
var util = require('util');
var async = require('async');
var debug = require('debug')('loopback:connector:oracle');
var debugConnection = require('debug')('loopback:connector:oracle:connection');

/*!
 * @module loopback-connector-oracle
 *
 * Initialize the Oracle connector against the given data source
 *
 * @param {DataSource} dataSource The loopback-datasource-juggler dataSource
 * @param {Function} [callback] The callback function
 */
exports.initialize = function initializeDataSource(dataSource, callback) {
  if (!oracle) {
    return;
  }

  var s = dataSource.settings;
  var oracle_settings = {
    hostname: s.host || s.hostname || 'localhost',
    port: s.port || 1521,
    user: s.username || s.user,
    password: s.password,
    database: s.database || 'XE',
    debug: s.debug || debug.enabled,
    minConn: s.minConn || 1,
    maxConn: s.maxConn || 10,
    incrConn: s.incrConn || 1,
    timeout: s.timeout || 10,
  };
  if (s.tns) {
    oracle_settings.tns = s.tns;
  }

  dataSource.connector = new Oracle(oracle, oracle_settings);
  dataSource.connector.dataSource = dataSource;

  if (callback) {
    if (s.lazyConnect) {
      process.nextTick(function() {
        callback();
      });
    } else {
      dataSource.connector.connect(callback);
    }
  }
};

exports.Oracle = Oracle;

/**
 * Oracle connector constructor
 *
 *
 * @param {object} driver Oracle node.js binding
 * @options {Object} settings Options specifying data source settings; see below.
 * @prop {String} hostname The host name or ip address of the Oracle DB server
 * @prop {Number} port The port number of the Oracle DB Server
 * @prop {String} user The user name
 * @prop {String} password The password
 * @prop {String} database The database name (TNS listener name)
 * @prop {Boolean|Number} debug If true, print debug messages. If Number, ?
 * @class
 */
function Oracle(oracle, settings) {
  this.constructor.super_.call(this, 'oracle', settings);
  if (typeof oracle === 'function') {
    // The version of strong-oracle returns a function
    this.driver = oracle(settings);
  } else {
    this.driver = oracle;
  }
  this.pool = null;
  this.parallelLimit = settings.maxConn;
  if (settings.debug || debug.enabled) {
    debug('Settings: %j', settings);
  }
}

// Inherit from loopback-datasource-juggler BaseSQL
require('util').inherits(Oracle, SqlConnector);

Oracle.prototype.debug = function() {
  if (this.settings.debug || debug.enabled) {
    debug.apply(null, arguments);
  }
};

/**
 * Connect to Oracle
 * @param {Function} [callback] The callback after the connection is established
 */
Oracle.prototype.connect = function(callback) {
  var self = this;
  if (this.pool) {
    if (callback) {
      process.nextTick(function() {
        if (callback) callback(null, self.pool);
      });
    }
    return;
  }
  if (this.settings.debug) {
    this.debug('Connecting to ' + this.settings.hostname);
  }
  this.driver.createConnectionPool(this.settings, function(err, pool) {
    if (!err) {
      self.pool = pool;
      if (self.settings.debug) {
        self.debug('Connected to ' + self.settings.hostname);
        self.debug('Connection pool ', self.pool.getInfo());
      }
    };
    if (callback) callback(err, pool);
  });
};

/**
 * Execute the SQL statement.
 *
 * @param {String} sql The SQL statement.
 * @param {String[]} params The parameter values for the SQL statement.
 * @param {Function} [callback] The callback after the SQL statement is executed.
 */
Oracle.prototype.executeSQL = function(sql, params, options, callback) {
  var self = this;

  if (self.settings.debug) {
    if (params && params.length > 0) {
      self.debug('SQL: %s \nParameters: %j', sql, params);
    } else {
      self.debug('SQL: %s', sql);
    }
  }

  var transaction = options.transaction;
  if (transaction && transaction.connection &&
    transaction.connector === this) {
    debug('Execute SQL within a transaction');
    transaction.connection.execute(sql, params, function(err, data) {
      if (err && self.settings.debug) {
        self.debug(err);
      }
      if (self.settings.debug && data) {
        self.debug('Result: %j', data);
      }
      callback(err, data);
    });
    return;
  }

  /*
  self.pool.getConnection(function (err, connection) {
    if (err) {
      callback && callback(err);
      return;
    }
    console.log('open %d -> %d', open, ++open);
    if (self.settings.debug) {
      debugConnection('Connection acquired: ', self.pool.getInfo());
    }
    connection.execute(sql, params, function (err, data) {
      if (err && self.settings.debug) {
        self.debug(err);
      }
      if (self.settings.debug && data) {
        self.debug("Result: %j", data);
      }
      if (log) {
        log(sql, time);
      }
      connection.close(function(err) {
        if (err) {
          return callback(err);
        }
        console.log('close %d -> %d', open, --open);
        if (self.settings.debug) {
          debugConnection('Connection released: ', self.pool.getInfo());
        }
        callback(null, data);
      });
    });
  });
  */
  self.pool.execute(sql, params, function(err, result) {
    if (err) {
      self.debug('Error: %j, %s', err, sql);
    }
    if (result) {
      self.debug('Result: %j', result);
    }
    callback(err, result);
  });
};

/**
 * Get the place holder in SQL for values, such as :1 or ?
 * @param {String} key Optional key, such as 1 or id
 * @returns {String} The place holder
 */
Oracle.prototype.getPlaceholderForValue = function(key) {
  return ':' + key;
};

Oracle.prototype.getCountForAffectedRows = function(model, info) {
  return info && info.updateCount;
};

Oracle.prototype.getInsertedId = function(model, info) {
  return info && info.returnParam;
};

Oracle.prototype.buildInsertDefaultValues = function(model, data, options) {
  // Oracle doesn't like empty column/value list
  var idCol = this.idColumnEscaped(model);
  return '(' + idCol + ') VALUES(DEFAULT)';
};

Oracle.prototype.buildInsertReturning = function(model, data, options) {
  var modelDef = this.getModelDefinition(model);
  var type = modelDef.properties[this.idName(model)].type;
  var outParam = null;
  if (type === String) {
    outParam = new this.driver.OutParam(this.driver.OCCISTRING);
  } else {
    outParam = new this.driver.OutParam();
  }
  var params = [outParam];
  var returningStmt = new ParameterizedSQL('RETURNING ' +
    this.idColumnEscaped(model) + ' into ?', params);
  return returningStmt;
};

/**
 * Create the data model in Oracle
 *
 * @param {String} model The model name
 * @param {Object} data The model instance data
 * @param {Function} [callback] The callback function
 */
Oracle.prototype.create = function(model, data, options, callback) {
  var self = this;
  var stmt = this.buildInsert(model, data, options);
  this.execute(stmt.sql, stmt.params, options, function(err, info) {
    if (err) {
      if (err.toString().indexOf('ORA-00001: unique constraint') >= 0) {
        // Transform the error so that duplicate can be checked using regex
        err = new Error(err.toString() + '. Duplicate id detected.');
      }
      callback(err);
    } else {
      var insertedId = self.getInsertedId(model, info);
      callback(err, insertedId);
    }
  });
};

function dateToOracle(val, dateOnly) {
  function fz(v) {
    return v < 10 ? '0' + v : v;
  }

  function ms(v) {
    if (v < 10) {
      return '00' + v;
    } else if (v < 100) {
      return '0' + v;
    } else {
      return '' + v;
    }
  }

  var dateStr = [
    val.getUTCFullYear(),
    fz(val.getUTCMonth() + 1),
    fz(val.getUTCDate()),
  ].join('-') + ' ' + [
    fz(val.getUTCHours()),
    fz(val.getUTCMinutes()),
    fz(val.getUTCSeconds()),
  ].join(':');

  if (!dateOnly) {
    dateStr += '.' + ms(val.getMilliseconds());
  }

  if (dateOnly) {
    return new ParameterizedSQL(
      "to_date(?,'yyyy-mm-dd hh24:mi:ss')", [dateStr]);
  } else {
    return new ParameterizedSQL(
      "to_timestamp(?,'yyyy-mm-dd hh24:mi:ss.ff3')", [dateStr]);
  }
}

Oracle.prototype.toColumnValue = function(prop, val) {
  if (val == null) {
    // PostgreSQL complains with NULLs in not null columns
    // If we have an autoincrement value, return DEFAULT instead
    if (prop.autoIncrement || prop.id) {
      return new ParameterizedSQL('DEFAULT');
    } else {
      return null;
    }
  }
  if (prop.type === String) {
    return String(val);
  }
  if (prop.type === Number) {
    if (isNaN(val)) {
      // Map NaN to NULL
      return val;
    }
    return val;
  }

  if (prop.type === Date || prop.type.name === 'Timestamp') {
    return dateToOracle(val, prop.type === Date);
  }

  // Oracle support char(1) Y/N
  if (prop.type === Boolean) {
    if (val) {
      return 'Y';
    } else {
      return 'N';
    }
  }

  return this.serializeObject(val);
};

Oracle.prototype.fromColumnValue = function(prop, val) {
  if (val == null) {
    return val;
  }
  var type = prop && prop.type;
  if (type === Boolean) {
    if (typeof val === 'boolean') {
      return val;
    } else {
      return (val === 'Y' || val === 'y' || val === 'T' ||
      val === 't' || val === '1');
    }
  }
  return val;
};

/*!
 * Convert to the Database name
 * @param {String} name The name
 * @returns {String} The converted name
 */
Oracle.prototype.dbName = function(name) {
  if (!name) {
    return name;
  }
  return name.toUpperCase();
};

/*!
 * Escape the name for Oracle DB
 * @param {String} name The name
 * @returns {String} The escaped name
 */
Oracle.prototype.escapeName = function(name) {
  if (!name) {
    return name;
  }
  return '"' + name.replace(/\./g, '"."') + '"';
};

Oracle.prototype.tableEscaped = function(model) {
  var schemaName = this.schema(model);
  if (schemaName && schemaName !== this.settings.user) {
    return this.escapeName(schemaName) + '.' +
      this.escapeName(this.table(model));
  } else {
    return this.escapeName(this.table(model));
  }
};

Oracle.prototype.buildExpression =
  function(columnName, operator, columnValue, propertyValue) {
    if (propertyValue instanceof RegExp) {
      columnValue = "'" + propertyValue.source + "'";
      if (propertyValue.ignoreCase) {
        return new ParameterizedSQL(columnName + ' ~* ?', [columnValue]);
      } else {
        return new ParameterizedSQL(columnName + ' ~ ?', [columnValue]);
      }
    }
    switch (operator) {
      case 'like':
        return new ParameterizedSQL({
          sql: columnName + " LIKE ? ESCAPE '\\'",
          params: [columnValue],
        });
      case 'nlike':
        return new ParameterizedSQL({
          sql: columnName + " NOT LIKE ? ESCAPE '\\'",
          params: [columnValue],
        });
      default:
        // Invoke the base implementation of `buildExpression`
        var exp = this.invokeSuper('buildExpression',
          columnName, operator, columnValue, propertyValue);
        return exp;
    }
  };

function buildLimit(limit, offset) {
  if (isNaN(offset)) {
    offset = 0;
  }
  var sql = 'OFFSET ' + offset + ' ROWS';
  if (limit >= 0) {
    sql += ' FETCH NEXT ' + limit + ' ROWS ONLY';
  }
  return sql;
}

Oracle.prototype.applyPagination =
  function(model, stmt, filter) {
    var offset = filter.offset || filter.skip || 0;
    if (this.settings.supportsOffsetFetch) {
      // Oracle 12.c or later
      var limitClause = buildLimit(filter.limit, filter.offset || filter.skip);
      return stmt.merge(limitClause);
    } else {
      var paginatedSQL = 'SELECT * FROM (' + stmt.sql + ' ' +
        ')' + ' ' + ' WHERE R > ' + offset;

      if (filter.limit !== -1) {
        paginatedSQL += ' AND R <= ' + (offset + filter.limit);
      }

      stmt.sql = paginatedSQL + ' ';
      return stmt;
    }
  };

Oracle.prototype.buildColumnNames = function(model, filter) {
  var columnNames = this.invokeSuper('buildColumnNames', model, filter);
  if (filter.limit || filter.offset || filter.skip) {
    var orderBy = this.buildOrderBy(model, filter.order);
    columnNames += ',ROW_NUMBER() OVER' + ' (' + orderBy + ') R';
  }
  return columnNames;
};

Oracle.prototype.buildSelect = function(model, filter, options) {
  if (!filter.order) {
    var idNames = this.idNames(model);
    if (idNames && idNames.length) {
      filter.order = idNames;
    }
  }

  var selectStmt = new ParameterizedSQL('SELECT ' +
    this.buildColumnNames(model, filter) +
    ' FROM ' + this.tableEscaped(model)
  );

  if (filter) {
    if (filter.where) {
      var whereStmt = this.buildWhere(model, filter.where);
      selectStmt.merge(whereStmt);
    }

    if (filter.limit || filter.skip || filter.offset) {
      selectStmt = this.applyPagination(
        model, selectStmt, filter);
    } else {
      if (filter.order) {
        selectStmt.merge(this.buildOrderBy(model, filter.order));
      }
    }
  }
  return this.parameterize(selectStmt);
};

/**
 * Disconnect from Oracle
 * @param {Function} [cb] The callback function
 */
Oracle.prototype.disconnect = function disconnect(cb) {
  var err = null;
  if (this.pool) {
    if (this.settings.debug) {
      this.debug('Disconnecting from ' + this.settings.hostname);
    }
    var pool = this.pool;
    this.pool = null;
    try {
      pool.close();  // This is sync
    } catch (e) {
      err = e;
      this.debug('Fail to disconnect from %s: %j', this.settings.hostname, err);
    }
  }

  if (cb) {
    process.nextTick(function() {
      cb(err);
    });
  }
};

Oracle.prototype.ping = function(cb) {
  this.execute('select count(*) as result from user_tables', [], cb);
};

require('./migration')(Oracle);
require('./discovery')(Oracle);
require('./transaction')(Oracle);
