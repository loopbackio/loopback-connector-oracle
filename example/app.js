var Schema = require('jugglingdb').Schema;

var db = new Schema(require('../'), {
  host : '166.78.158.45',
  database : 'XE',
  username : 'strongloop',
  password : 'str0ng100pjs',
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

db.discoverModels({views: true, limit: 20}, show);

db.discoverModelProperties(null, 'PRODUCT', show);

db.discoverModelProperties('STRONGLOOP', 'INVENTORY_VIEW', show);

db.discoverPrimaryKeys(null, 'INVENTORY',  show);
db.discoverForeignKeys(null, 'INVENTORY',  show);

db.discoverSchema('STRONGLOOP', 'INVENTORY_VIEW', function (err, schema) {
    console.log('%j', schema);
});
