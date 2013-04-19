process.env.NODE_ENV = 'test';
require('should');

var assert = require('assert');

var Schema = require('jugglingdb').Schema;
var db;

before(function() {

  db = new Schema(require('../'), {
    host : '127.0.0.1',
    database : 'XE',
    username : 'strongloop',
    password : 'password',
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
