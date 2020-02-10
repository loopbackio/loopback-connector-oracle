// Copyright IBM Corp. 2013,2019. All Rights Reserved.
// Node module: loopback-connector-oracle
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';

/* global getDataSource */
process.env.NODE_ENV = 'test';
require('should');

const async = require('async');

const DataSource = require('loopback-datasource-juggler').DataSource;
let db, config;

before(function() {
  config = require('rc')('loopback', {dev: {oracle: {}}}).dev.oracle;
});

after(function() {
  db = null;
});

describe('Oracle connector', function() {
  it('should create connection pool', function(done) {
    db = new DataSource(require('../'), config);
    db.connect(function() {
      const info = db.connector.pool;
      info.should.have.property('connectionsOpen', 1);
      info.should.have.property('connectionsInUse', 0);
      info.should.have.property('poolMax', 10);
      info.should.have.property('poolMin', 1);
      info.should.have.property('poolIncrement', 1);
      info.should.have.property('poolTimeout', 60);
      db.disconnect(done);
    });
  });

  it('should create connection pool with config', function(done) {
    config.minConn = 2;
    config.maxConn = 4;
    config.incrConn = 2;
    config.timeout = 5;
    db = new DataSource(require('../'), config);
    db.connect(function() {
      const info = db.connector.pool;
      info.should.have.property('connectionsOpen', 2);
      info.should.have.property('connectionsInUse', 0);
      info.should.have.property('poolMax', 4);
      info.should.have.property('poolMin', 2);
      info.should.have.property('poolIncrement', 2);
      info.should.have.property('poolTimeout', 5);

      const tasks = [];
      for (let i = 0; i < 3; i++) {
        tasks.push(db.connector.pool.getConnection.bind(db.connector.pool));
      }
      async.parallel(tasks, function(err, connections) {
        connections.should.have.property('length', 3);
        async.each(connections, function(c, done) {
          c.release(done);
        }, function(err) {
          // var info = db.connector.pool;
          // console.log(info);
          db.disconnect(done);
        });
      });
    });
  });

  it('should close connection pool gracefully', function(done) {
    db = new DataSource(require('../'), config);
    db.connect(function() {
      // Call ping to acquire/release a connection from the pool
      db.ping(function(err) {
        if (err) return done(err);
        // It should disconnect gracefully
        db.disconnect(done);
      });
    });
  });
});
