var Schema = require('jugglingdb').Schema;

var db = new Schema(require('../'), {
  host : '166.78.158.45',
  database : 'XE',
  username : 'strongloop',
  password : 'str0ng100pjs',
  debug : true
});


db.discoverModels({views: true, limit: 3}, function(err, models) {
  if (err) {
    console.error(err);
  } else {
    models.forEach(function(m) {
      console.dir(m);
    });
  }
});


db.discoverModelProperties({model: 'PRODUCT'}, function(err, models) {
  if (err) {
    console.error(err);
  } else {
    models.forEach(function(m) {
      console.dir(m);
    });
  }
});
