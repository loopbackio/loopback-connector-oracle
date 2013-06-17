var DataSource = require('jugglingdb').DataSource;

var ds = new DataSource(require('../'), {
    host: '166.78.158.45',
    database: 'XE',
    username: 'strongloop',
    password: 'str0ng100pjs',
    debug: true
});

var results = ds.adapter.querySync('SELECT * from PRODUCT');
console.log(results);

results = ds.discoverModelDefinitionsSync({views: true, limit: 20});
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
