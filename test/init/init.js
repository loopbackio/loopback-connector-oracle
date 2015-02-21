var DataSource = require('loopback-datasource-juggler').DataSource;

var config = require('rc')('loopback', {test: {oracle: {}}}).test.oracle;

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
