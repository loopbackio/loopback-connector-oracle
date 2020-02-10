// Copyright IBM Corp. 2015,2019. All Rights Reserved.
// Node module: loopback-connector-oracle
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';

const g = require('strong-globalize')();
const debug = require('debug')('loopback:connector:oracle:transaction');
const Transaction = require('loopback-connector').Transaction;

module.exports = mixinTransaction;

/*!
 * @param {Oracle} Oracle connector class
 */
function mixinTransaction(Oracle, oracle) {
  /**
   * Begin a new transaction
   * @param isolationLevel
   * @param cb
   */
  Oracle.prototype.beginTransaction = function(isolationLevel, cb) {
    debug('Begin a transaction with isolation level: %s', isolationLevel);
    if (isolationLevel !== Transaction.READ_COMMITTED &&
      isolationLevel !== Transaction.SERIALIZABLE) {
      const err = new Error(g.f('Invalid {{isolationLevel}}: %s',
        isolationLevel));
      err.statusCode = 400;
      return process.nextTick(function() {
        cb(err);
      });
    }
    this.pool.getConnection(function(err, connection) {
      if (err) return cb(err);
      if (isolationLevel) {
        const sql = 'SET TRANSACTION ISOLATION LEVEL ' + isolationLevel;
        connection.execute(sql, [],
          {outFormat: oracle.OBJECT, autoCommit: false}, function(err) {
            cb(err, connection);
          });
      } else {
        cb(err, connection);
      }
    });
  };

  /**
   *
   * @param connection
   * @param cb
   */
  Oracle.prototype.commit = function(connection, cb) {
    debug('Commit a transaction');
    connection.commit(function(err) {
      if (err) return cb(err);
      connection.release(cb);
    });
  };

  /**
   *
   * @param connection
   * @param cb
   */
  Oracle.prototype.rollback = function(connection, cb) {
    debug('Rollback a transaction');
    connection.rollback(function(err) {
      if (err) return cb(err);
      connection.release(cb);
    });
  };
}
