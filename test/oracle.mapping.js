process.env.NODE_ENV = 'test';
require('should');
;
var async = require('async');

var db;

before(function () {

    db = getSchema();

});

describe('Mapping models', function () {
    it('should honor the oracle settings for table/column', function (done) {

        var schema =
        {
            "name": "TestInventory",
            "options": {
                "idInjection": false,
                "oracle": {
                    "schema": "STRONGLOOP", "table": "INVENTORYTEST"
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
        var models = db.buildModels(schema);
        // console.log(models);
        var Model = models['TestInventory'];

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
                    Model.find({fields: ['productId', 'locationId', 'available']}, function (err, results) {
                        // console.log(results);
                        results.should.have.lengthOf(3);
                        results.forEach(function(r) {
                            r.should.have.property('productId');
                            r.should.have.property('locationId');
                            r.should.have.property('available');
                            r.should.not.have.property('total');
                        });
                        callback(null, results);
                    });
                },
                function (callback) {
                    Model.find({fields: {'total' : false}}, function (err, results) {
                        // console.log(results);
                        results.should.have.lengthOf(3);
                        results.forEach(function(r) {
                            r.should.have.property('productId');
                            r.should.have.property('locationId');
                            r.should.have.property('available');
                            r.should.not.have.property('total');
                        });
                        callback(null, results);
                    });
                }
            ], done);
        });


    });
});
