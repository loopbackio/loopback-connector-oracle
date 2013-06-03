var DataSource = require('jugglingdb').DataSource;

var ds = new DataSource(require('../'), {
    host: '127.0.0.1',
    database: 'XE',
    username: 'strongloop',
    password: 'password',
    debug: true
});

var results = ds.adapter.querySync('SELECT * from PRODUCT');
console.log(results);

results = ds.discoverModelsSync({views: true, limit: 20});
console.log(results);

results = ds.discoverModelPropertiesSync(null, 'PRODUCT');
console.log(results);

results = ds.discoverModelPropertiesSync('STRONGLOOP', 'INVENTORY_VIEW');
console.log(results);

results = ds.discoverPrimaryKeysSync(null, 'INVENTORY');
console.log(results);

results = ds.discoverForeignKeysSync(null, 'INVENTORY');
console.log(results);

results = ds.discoverForeignKeysSync(null, 'INVENTORY');
console.log(results);

results = ds.discoverExportedForeignKeysSync(null, 'PRODUCT');
console.log(results);


var models = ds.discoverAndBuildModelsSync('STRONGLOOP', 'INVENTORY', {visited: {}, associations: true});

function show(err, models) {
    if (err) {
        console.error(err);
    } else {
        models.forEach(function(m) {
            console.dir(m);
        });
    }
}

for (var m in models) {
    models[m].all(show);
}
