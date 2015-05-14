var debug = require('debug')('loopback:connector:oracle:transaction');
var Transaction = require('loopback-connector').Transaction;

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
      var err = new Error('Invalid isolationLevel: ' + isolationLevel);
      err.statusCode = 400;
      return process.nextTick(function() {
        cb(err);
      });
    }
    this.pool.getConnection(function(err, connection) {
      if (err) return cb(err);
      connection.setAutoCommit(false);
      if (isolationLevel) {
        var sql = 'SET TRANSACTION ISOLATION LEVEL ' + isolationLevel;
        connection.execute(sql, [], function(err) {
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
      connection.setAutoCommit(true);
      connection.close(cb);
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
      connection.setAutoCommit(true);
      connection.close(cb);
    });
  };
}
