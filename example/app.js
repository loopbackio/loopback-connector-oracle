var DataSource = require('jugglingdb').DataSource;

var ds = new DataSource(require('../'), {
  host : '127.0.0.1',
  database : 'XE',
  username : 'strongloop',
  password : 'password',
  debug : true
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

/*
ds.discoverModelDefinitions({views: true, limit: 20}, show);

ds.discoverModelProperties(null, 'PRODUCT', show);

ds.discoverModelProperties('STRONGLOOP', 'INVENTORY_VIEW', show);

ds.discoverPrimaryKeys(null, 'INVENTORY',  show);
ds.discoverForeignKeys(null, 'INVENTORY',  show);

ds.discoverExportedForeignKeys(null, 'PRODUCT',  show);

*/


var table = (process.argv.length > 2) ? process.argv[2] : 'INVENTORY_VIEW';

/*
ds.discoverSchema('STRONGLOOP', table, function(err, schema) {
    var model = ds.define(schema.name, schema.properties, schema.options);
    // console.log(model);
    model.all(show);
});
*/

ds.discoverAndBuildModels('STRONGLOOP', 'INVENTORY', {visited: {}, associations: true}, function (err, models) {

    for(var m in models) {
        models[m].all(show);
    };

    models.Inventory.findOne({}, function(err, inv) {
       console.log("\nInventory: ", inv);
       inv.product(function(err, prod) {
           console.log("\nProduct: ", prod);
           ds.disconnect();
       });
    });
});



