var DataSource = require('loopback-datasource-juggler').DataSource;

var config = require('rc')('loopback', {dev: {oracle: {}}}).dev.oracle;
config.maxConn = 32;

var ds = new DataSource(require('../'), config);
var model = ds.createModel('XYZ', {
  name: String
});

ds.automigrate('XYZ', function(err) {
  console.log(err);
  for (var i = 0; i < 200; i++) {
    model.create({name: 'x' + i}, console.log);
  }
});
