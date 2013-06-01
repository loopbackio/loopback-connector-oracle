var DataSource = require('jugglingdb').DataSource;

var ds = new DataSource(require('../'), {
    host : '166.78.158.45',
    database : 'XE',
    username : 'strongloop',
    password : 'str0ng100pjs',
    debug : true
});

var results = ds.adapter.querySync('SELECT * from PRODUCT');
console.log(results);

ds.adapter.connection.close();
