// Copyright IBM Corp. 2013,2019. All Rights Reserved.
// Node module: loopback-connector-oracle
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';

const g = require('strong-globalize')();

/*!
 * Oracle connector for LoopBack
 */
const oracle = require('oracledb');
const SqlConnector = require('loopback-connector').SqlConnector;
const ParameterizedSQL = SqlConnector.ParameterizedSQL;
const debug = require('debug')('loopback:connector:oracle');
const stream = require('stream');
const async = require('async');

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

  const s = dataSource.settings || {};

  const configProperties = {
    autoCommit: true,
    connectionClass: 'loopback-connector-oracle',
    extendedMetaData: undefined,
    externalAuth: undefined,
    fetchAsString: undefined,
    lobPrefetchSize: undefined,
    maxRows: undefined,
    outFormat: oracle.OBJECT,
    poolIncrement: undefined,
    poolMax: undefined,
    poolMin: undefined,
    poolPingInterval: undefined,
    poolTimeout: undefined,
    prefetchRows: undefined,
    fetchArraySize: undefined,
    Promise: undefined,
    queueRequests: undefined,
    queueTimeout: undefined,
    stmtCacheSize: undefined,
    _enableStats: undefined,
  };

  const oracleSettings = {
    connectString: s.connectString || s.url || s.tns,
    user: s.username || s.user,
    password: s.password,
    debug: s.debug || debug.enabled,
    poolMin: s.poolMin || s.minConn || 1,
    poolMax: s.poolMax || s.maxConn || 10,
    poolIncrement: s.poolIncrement || s.incrConn || 1,
    poolTimeout: s.poolTimeout || s.timeout || 60,
    autoCommit: s.autoCommit || s.isAutoCommit,
    outFormat: oracle.OBJECT,
    maxRows: s.maxRows || 0,
    stmtCacheSize: s.stmtCacheSize || 30,
    _enableStats: s._enableStats || false,
    connectionClass: 'loopback-connector-oracle',
  };

  if (oracleSettings.autoCommit === undefined) {
    oracleSettings.autoCommit = true; // Default to true
  }

  if (!oracleSettings.connectString) {
    const hostname = s.host || s.hostname || 'localhost';
    const port = s.port || 1521;
    const database = s.database || 'XE';
    oracleSettings.connectString = '//' + hostname + ':' + port +
      '/' + database;
  }

  for (const p in s) {
    if (!(p in oracleSettings) && p in configProperties) {
      oracleSettings[p] = s[p];
    }
  }

  dataSource.connector = new Oracle(oracle, oracleSettings);
  dataSource.connector.dataSource = dataSource;
  console.log(oracleSettings);

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
  this.driver = oracle;
  this.pool = null;
  this.parallelLimit = settings.maxConn || settings.poolMax || 16;
  if (settings.debug || debug.enabled) {
    debug('Settings: %j', settings);
  }
  oracle.fetchAsString = settings.fetchAsString || [oracle.CLOB];
  oracle.fetchAsBuffer = settings.fetchAsBuffer || [oracle.BLOB];
  this.executeOptions = {
    autoCommit: settings.autoCommit,
    fetchAsString: settings.fetchAsString || [oracle.CLOB],
    fetchAsBuffer: settings.fetchAsBuffer || [oracle.BLOB],
    lobPrefetchSize: settings.lobPrefetchSize,
    maxRows: settings.maxRows | 0,
    outFormat: oracle.OBJECT,
    fetchArraySize: settings.fetchArraySize || settings.prefetchRows,
  };
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
  const self = this;
  if (this.pool) {
    if (callback) {
      process.nextTick(function() {
        if (callback) callback(null, self.pool);
      });
    }
    return;
  }
  if (this.settings.debug) {
    this.debug('Connecting to ' +
      (this.settings.hostname || this.settings.connectString));
  }
  this.driver.createPool(this.settings, function(err, pool) {
    if (!err) {
      self.pool = pool;
      if (self.settings.debug) {
        self.debug('Connected to ' +
          (self.settings.hostname || self.settings.connectString));
        self.debug('Connection pool ', pool);
      }
    }
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
  const self = this;

  if (self.settings.debug) {
    if (params && params.length > 0) {
      self.debug('SQL: %s \nParameters: %j', sql, params);
    } else {
      self.debug('SQL: %s', sql);
    }
  }

  const executeOptions = {};
  for (const i in this.executeOptions) {
    executeOptions[i] = this.executeOptions[i];
  }
  const transaction = options.transaction;
  if (transaction && transaction.connection &&
    transaction.connector === this) {
    debug('Execute SQL within a transaction');
    executeOptions.autoCommit = false;
    transaction.connection.execute(sql, params, executeOptions,
      function(err, data) {
        if (err && self.settings.debug) {
          self.debug(err);
        }
        if (self.settings.debug && data) {
          self.debug('Result: %j', data);
        }
        if (data && data.rows) {
          data = data.rows;
        }
        callback(err, data);
      });
    return;
  }

  self.pool.getConnection(function(err, connection) {
    if (err) {
      if (callback) callback(err);
      return;
    }
    if (self.settings.debug) {
      self.debug('Connection acquired: ', self.pool);
    }
    connection.clientId = self.settings.clientId || 'LoopBack';
    connection.module = self.settings.module || 'loopback-connector-oracle';
    connection.action = self.settings.action || '';

    executeOptions.autoCommit = true;
    connection.execute(sql, params, executeOptions,
      function(err, data) {
        if (err && self.settings.debug) {
          self.debug(err);
        }

        if (!err && data) {
          if (data.rows) {
            data = data.rows;
            if (self.settings.debug && data) {
              self.debug('Result: %j', data);
            }
          }
        }
        releaseConnectionAndCallback();

        function releaseConnectionAndCallback() {
          connection.release(function(err2) {
            if (err2) {
              self.debug(err2);
            }
            if (self.settings.debug) {
              self.debug('Connection released: ', self.pool);
            }
            callback(err || err2, data);
          });
        }
      });
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
  return info && info.rowsAffected;
};

Oracle.prototype.getInsertedId = function(model, info) {
  return info && info.outBinds && info.outBinds[0][0];
};

Oracle.prototype.buildInsertDefaultValues = function(model, data, options) {
  // Oracle doesn't like empty column/value list
  const idCol = this.idColumnEscaped(model);
  return '(' + idCol + ') VALUES(DEFAULT)';
};

Oracle.prototype.buildInsertReturning = function(model, data, options) {
  const modelDef = this.getModelDefinition(model);
  const type = modelDef.properties[this.idName(model)].type;
  let outParam = null;
  if (type === Number) {
    outParam = {type: oracle.NUMBER, dir: oracle.BIND_OUT};
  } else if (type === Date) {
    outParam = {type: oracle.DATE, dir: oracle.BIND_OUT};
  } else {
    outParam = {type: oracle.STRING, dir: oracle.BIND_OUT};
  }
  const params = [outParam];
  const returningStmt = new ParameterizedSQL('RETURNING ' +
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
  const self = this;
  const stmt = this.buildInsert(model, data, options);
  this.execute(stmt.sql, stmt.params, options, function(err, info) {
    if (err) {
      if (err.toString().indexOf('ORA-00001: unique constraint') >= 0) {
        // Transform the error so that duplicate can be checked using regex
        err = new Error(g.f('%s. Duplicate id detected.', err.toString()));
      }
      callback(err);
    } else {
      const insertedId = self.getInsertedId(model, info);
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

  let dateStr = [
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
      "to_date(?,'yyyy-mm-dd hh24:mi:ss')", [dateStr],
    );
  } else {
    return new ParameterizedSQL(
      "to_timestamp(?,'yyyy-mm-dd hh24:mi:ss.ff3')", [dateStr],
    );
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
  const type = prop && prop.type;
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
  const schemaName = this.schema(model);
  if (schemaName && schemaName !== this.settings.user) {
    return this.escapeName(schemaName) + '.' +
      this.escapeName(this.table(model));
  } else {
    return this.escapeName(this.table(model));
  }
};

Oracle.prototype.buildExpression =
  function(columnName, operator, columnValue, propertyDescriptor) {
    let val = columnValue;
    if (columnValue instanceof RegExp) {
      val = columnValue.source;
      operator = 'regexp';
    }
    switch (operator) {
      case 'like':
        return new ParameterizedSQL({
          sql: columnName + " LIKE ? ESCAPE '\\'",
          params: [val],
        });
      case 'nlike':
        return new ParameterizedSQL({
          sql: columnName + " NOT LIKE ? ESCAPE '\\'",
          params: [val],
        });
      case 'regexp':
        /**
         * match_parameter is a text literal that lets you change the default
         * matching behavior of the function. You can specify one or more of
         * the following values for match_parameter:
         * - 'i' specifies case-insensitive matching.
         * - 'c' specifies case-sensitive matching.
         * - 'n' allows the period (.), which is the match-any-character
         * wildcard character, to match the newline character. If you omit this
         * parameter, the period does not match the newline character.
         * - 'm' treats the source string as multiple lines. Oracle interprets
         * ^ and $ as the start and end, respectively, of any line anywhere in
         * the source string, rather than only at the start or end of the entire
         * source string. If you omit this parameter, Oracle treats the source
         * string as a single line.
         *
         * If you specify multiple contradictory values, Oracle uses the last
         * value. For example, if you specify 'ic', then Oracle uses
         * case-sensitive matching. If you specify a character other than those
         * shown above, then Oracle returns an error.
         *
         * If you omit match_parameter, then:
         * - The default case sensitivity is determined by the value of the NLS_SORT parameter.
         * - A period (.) does not match the newline character.
         * - The source string is treated as a single line.
         */
        let flag = '';
        if (columnValue.ignoreCase) {
          flag += 'i';
        }
        if (columnValue.multiline) {
          flag += 'm';
        }
        if (columnValue.global) {
          g.warn('{{Oracle}} regex syntax does not respect the {{`g`}} flag');
        }

        if (flag) {
          return new ParameterizedSQL({
            sql: 'REGEXP_LIKE(' + columnName + ', ?, ?)',
            params: [val, flag],
          });
        } else {
          return new ParameterizedSQL({
            sql: 'REGEXP_LIKE(' + columnName + ', ?)',
            params: [val],
          });
        }
      default:
        // Invoke the base implementation of `buildExpression`
        const exp = this.invokeSuper('buildExpression',
          columnName, operator, columnValue, propertyDescriptor);
        return exp;
    }
  };

function buildLimit(limit, offset) {
  if (isNaN(offset)) {
    offset = 0;
  }
  let sql = 'OFFSET ' + offset + ' ROWS';
  if (limit >= 0) {
    sql += ' FETCH NEXT ' + limit + ' ROWS ONLY';
  }
  return sql;
}

Oracle.prototype.applyPagination =
  function(model, stmt, filter) {
    const offset = filter.offset || filter.skip || 0;
    if (this.settings.supportsOffsetFetch) {
      // Oracle 12.c or later
      const limitClause =
        buildLimit(filter.limit, filter.offset || filter.skip);
      return stmt.merge(limitClause);
    } else {
      let paginatedSQL = 'SELECT * FROM (' + stmt.sql + ' ' +
        ')' + ' ' + ' WHERE R > ' + offset;

      if (filter.limit !== -1) {
        paginatedSQL += ' AND R <= ' + (offset + filter.limit);
      }

      stmt.sql = paginatedSQL + ' ';
      return stmt;
    }
  };

Oracle.prototype.buildColumnNames = function(model, filter) {
  let columnNames = this.invokeSuper('buildColumnNames', model, filter);
  if (filter.limit || filter.offset || filter.skip) {
    const orderBy = this.buildOrderBy(model, filter.order);
    columnNames += ',ROW_NUMBER() OVER' + ' (' + orderBy + ') R';
  }
  return columnNames;
};

Oracle.prototype.buildSelect = function(model, filter, options) {
  if (!filter.order) {
    const idNames = this.idNames(model);
    if (idNames && idNames.length) {
      filter.order = idNames;
    }
  }

  let selectStmt = new ParameterizedSQL('SELECT ' +
    this.buildColumnNames(model, filter) +
    ' FROM ' + this.tableEscaped(model));

  if (filter) {
    if (filter.where) {
      const whereStmt = this.buildWhere(model, filter.where);
      selectStmt.merge(whereStmt);
    }

    if (filter.limit || filter.skip || filter.offset) {
      selectStmt = this.applyPagination(
        model, selectStmt, filter,
      );
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
  const err = null;
  if (this.pool) {
    if (this.settings.debug) {
      this.debug('Disconnecting from ' +
        (this.settings.hostname || this.settings.connectString));
    }
    const pool = this.pool;
    this.pool = null;
    return pool.terminate(cb);
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

require('./migration')(Oracle, oracle);
require('./discovery')(Oracle, oracle);
require('./transaction')(Oracle, oracle);
