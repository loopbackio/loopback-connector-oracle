var DataSource = require('jugglingdb').DataSource;

var ds = new DataSource(require('../'), {
    host : '127.0.0.1',
    database : 'XE',
    username : 'strongloop',
    password : 'password',
    debug : true
});

var results = ds.adapter.querySync('SELECT * from PRODUCT');
console.log(results);

ds.adapter.connection.close();
