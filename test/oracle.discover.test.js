process.env.NODE_ENV = 'test';
require('should');

var assert = require('assert');

var Schema = require('jugglingdb').Schema;
var db;

before(function() {

  db = new Schema(require('../'), {
    host : '166.78.158.45',
    database : 'XE',
    username : 'strongloop',
    password : 'str0ng100pjs',
    debug : true
  });

});

describe('discoverModels', function() {
  describe('Discover models including views', function() {
    it('should return an array of tables and views', function(done) {

      db.discoverModels({
        views : true,
        limit : 3
      }, function(err, models) {
        if (err) {
          console.error(err);
          done(err);
        } else {
          var views = false;
          models.forEach(function(m) {
            console.dir(m);
            if (m.type === 'view') {
              views = true;
            }
          });
          assert(views, 'Should have views');
          done(null, models);
        }
      });
    });
  });

  describe('Discover models excluding views', function() {
    it('should return an array of only tables', function(done) {

      db.discoverModels({
        views : false,
        limit : 3
      }, function(err, models) {
        if (err) {
          console.error(err);
          done(err);
        } else {
          var views = false;
          models.forEach(function(m) {
            console.dir(m);
            if (m.type === 'view') {
              views = true;
            }
          });
          models.should.have.length(3);
          assert(!views, 'Should not have views');
          done(null, models);
        }
      });
    });
  });
});

describe('Discover models including other users', function() {
  it('should return an array of all tables and views', function(done) {

    db.discoverModels({
      all : true,
      limit : 3
    }, function(err, models) {
      if (err) {
        console.error(err);
        done(err);
      } else {
        var others = false;
        models.forEach(function(m) {
          console.dir(m);
          if (m.owner !== 'STRONGLOOP') {
            others = true;
          }
        });
        assert(others, 'Should have tables/views owned by others');
        done(null, models);
      }
    });
  });
});

describe('Discover model properties', function() {
  describe('Discover a named model', function() {
    it('should return an array of columns for PRODUCT', function(done) {
      db.discoverModelProperties({
        model : 'PRODUCT'
      }, function(err, models) {
        if (err) {
          console.error(err);
          done(err);
        } else {
          models.forEach(function(m) {
            console.dir(m);
            assert(m.tableName === 'PRODUCT');
          });
          done(null, models);
        }
      });
    });
  });
  
  describe('Discover all models', function() {
    it('should return an array of columns for PRODUCT', function(done) {
      db.discoverModelProperties({
        limit: 5
      }, function(err, models) {
        if (err) {
          console.error(err);
          done(err);
        } else {
          var others = false;
          models.forEach(function(m) {
            console.dir(m);
            if(m.tableName !== 'PRODUCT') {
              others = true;
            }
          });
          assert(others);
          done(null, models);
        }
      });
    });
  });  
});

describe('Discover model primary keys', function () {
    it('should return an array of primary keys for PRODUCT', function (done) {
        db.discoverPrimaryKeys(null, 'PRODUCT',function (err, models) {
            if (err) {
                console.error(err);
                done(err);
            } else {
                models.forEach(function (m) {
                    console.dir(m);
                    assert(m.TABLE_NAME === 'PRODUCT');
                });
                done(null, models);
            }
        });
    });

    it('should return an array of primary keys for STRONGLOOP.PRODUCT', function (done) {
        db.discoverPrimaryKeys('STRONGLOOP', 'PRODUCT',function (err, models) {
            if (err) {
                console.error(err);
                done(err);
            } else {
                models.forEach(function (m) {
                    console.dir(m);
                    assert(m.TABLE_NAME === 'PRODUCT');
                });
                done(null, models);
            }
        });
    });
});

describe('Discover model foreign keys', function () {
    it('should return an array of foreign keys for INVENTORY', function (done) {
        db.discoverForeignKeys(null, 'INVENTORY',function (err, models) {
            if (err) {
                console.error(err);
                done(err);
            } else {
                models.forEach(function (m) {
                    console.dir(m);
                    assert(m.PKTABLE_NAME === 'INVENTORY');
                });
                done(null, models);
            }
        });
    });
    it('should return an array of foreign keys for STRONGLOOP.INVENTORY', function (done) {
        db.discoverForeignKeys('STRONGLOOP', 'INVENTORY',function (err, models) {
            if (err) {
                console.error(err);
                done(err);
            } else {
                models.forEach(function (m) {
                    console.dir(m);
                    assert(m.PKTABLE_NAME === 'INVENTORY');
                });
                done(null, models);
            }
        });
    });
});