process.env.NODE_ENV = 'test';
require('should');

var assert = require('assert');
var async = require('async');

var DataSource = require('jugglingdb').DataSource;
var db;

before(function () {

    db = new DataSource(require('../'), {
        host: '166.78.158.45',
        database: 'XE',
        username: 'strongloop',
        password: 'str0ng100pjs',
        debug: true
    });

});

describe('Mapping models', function () {
    it('should honor the oracle settings for table/column', function (done) {

        var schema =
        {
            "name": "InventoryTest",
            "options": {
                "idInjection": false,
                "oracle": {
                    "schema": "STRONGLOOP", "table": "INVENTORY_TEST"
                }
            },
            "properties": {
                /*
                "id": {
                    "type": "String", "required": true, "length": 20, "id": 1, "oracle": {
                        "columnName": "INVENTORY_ID", "dataType": "VARCHAR2", "nullable": "N"
                    }
                },
                */
                "productId": {
                    "type": "String", "required": true, "length": 20, "id": 1, "oracle": {
                        "columnName": "PRODUCT_ID", "dataType": "VARCHAR2", "nullable": "N"
                    }
                },
                "locationId": {
                    "type": "String", "required": true, "length": 20, "id": 2, "oracle": {
                        "columnName": "LOCATION_ID", "dataType": "VARCHAR2", "nullable": "N"
                    }
                },
                "available": {
                    "type": "Number", "required": false, "length": 22, "oracle": {
                        "columnName": "AVAILABLE", "dataType": "NUMBER", "nullable": "Y"
                    }
                },
                "total": {
                    "type": "Number", "required": false, "length": 22, "oracle": {
                        "columnName": "TOTAL", "dataType": "NUMBER", "nullable": "Y"
                    }
                }
            }
        };
        var models = DataSource.buildModels(db, schema);
        console.log(models);
        var Model = models['inventorytest'];

        db.automigrate(function (err, data) {
            async.series([
                function (callback) {
                    Model.destroyAll(callback);
                },
                function (callback) {
                    Model.create({productId: 'p001', locationId: 'l001', available: 10, total: 50}, callback);
                },
                function (callback) {
                    Model.create({productId: 'p001', locationId: 'l002', available: 30, total: 40}, callback);
                },
                function (callback) {
                    Model.create({productId: 'p002', locationId: 'l001', available: 15, total: 30}, callback);
                },
                function (callback) {
                    Model.all(function (err, results) {
                        console.log(results);
                        results.should.have.lengthOf(3);
                        results.forEach(function(r) {
                            r.should.have.property('productId');
                            r.should.have.property('locationId');
                        });
                        callback(null, results);
                    });
                }], done);
        });


    });
});
