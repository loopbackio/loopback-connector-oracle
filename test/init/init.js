// Copyright IBM Corp. 2013,2015. All Rights Reserved.
// Node module: loopback-connector-oracle
// US Government Users Restricted Rights - Use, duplication or disclosure
// restricted by GSA ADP Schedule Contract with IBM Corp.
'use strict';

var DataSource = require('loopback-datasource-juggler').DataSource;

var config = require('rc')('loopback', {test: {oracle: {}}}).test.oracle;
config.maxConn = 64;

var db;

global.getDataSource = global.getSchema = function() {
  if (db) {
    return db;
  }
  db = new DataSource(require('../../'), config);
  db.log = function(a) {
    // console.log(a);
  };
  return db;
};
