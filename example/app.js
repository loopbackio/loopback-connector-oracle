var DataSource = require('jugglingdb').DataSource;

var ds = new DataSource(require('../'), {
  host : '127.0.0.1',
  database : 'XE',
  username : 'strongloop',
  password : 'password',
  debug : false
});

function show(err, models) {
    if (err) {
        console.error(err);
    } else {
        models.forEach(function(m) {
            console.dir(m);
        });
    }
}

ds.discoverModels({views: true, limit: 20}, show);

ds.discoverModelProperties(null, 'PRODUCT', show);

ds.discoverModelProperties('STRONGLOOP', 'INVENTORY_VIEW', show);

ds.discoverPrimaryKeys(null, 'INVENTORY',  show);
ds.discoverForeignKeys(null, 'INVENTORY',  show);


var table = (process.argv.length > 2) ? process.argv[2] : 'INVENTORY';

ds.discoverSchema('STRONGLOOP', table, function (err, schema) {
    console.log('%j', schema);

    var model = ds.define(schema.name, schema.properties, schema.options);
    console.log(model);
    model.all(show);
});
