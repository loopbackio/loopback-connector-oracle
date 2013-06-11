process.env.NODE_ENV = 'test';
require('should');

var assert = require('assert');

var Schema = require('jugglingdb').Schema;
var db;

before(function () {

    db = new Schema(require('../'), {
        host: '127.0.0.1',
        database: 'XE',
        username: 'strongloop',
        password: 'password',
        debug: true
    });

});

describe('discoverModels', function () {
    describe('Discover models including views', function () {
        it('should return an array of tables and views', function () {

            var models = db.discoverModelsSync({
                views: true,
                limit: 3
            });

            var views = false;
            models.forEach(function (m) {
                console.dir(m);
                if (m.type === 'view') {
                    views = true;
                }
            });
            assert(views, 'Should have views');

        });
    });

    describe('Discover models excluding views', function () {
        it('should return an array of only tables', function () {

            var models = db.discoverModelsSync({
                views: false,
                limit: 3
            });
            var views = false;
            models.forEach(function (m) {
                console.dir(m);
                if (m.type === 'view') {
                    views = true;
                }
            });
            models.should.have.length(3);
            assert(!views, 'Should not have views');

        });
    });


    describe('Discover models including other users', function () {
        it('should return an array of all tables and views', function () {

            var models = db.discoverModelsSync({
                all: true,
                limit: 3
            });
            var others = false;
            models.forEach(function (m) {
                console.dir(m);
                if (m.owner !== 'STRONGLOOP') {
                    others = true;
                }
            });
            assert(others, 'Should have tables/views owned by others');

        });
    });

    describe('Discover model properties', function () {
        describe('Discover a named model', function () {
            it('should return an array of columns for PRODUCT', function () {
                var models = db.discoverModelPropertiesSync(null, 'PRODUCT');
                models.forEach(function (m) {
                    console.dir(m);
                    assert(m.tableName === 'PRODUCT');
                });

            });
        });
    });


    describe('Discover model primary keys', function () {
        it('should return an array of primary keys for PRODUCT', function () {
            var models = db.discoverPrimaryKeysSync(null, 'PRODUCT');
            models.forEach(function (m) {
                console.dir(m);
                assert(m.tableName === 'PRODUCT');
            });

        });

        it('should return an array of primary keys for STRONGLOOP.PRODUCT', function () {
            var models = db.discoverPrimaryKeysSync('STRONGLOOP', 'PRODUCT');
            models.forEach(function (m) {
                console.dir(m);
                assert(m.tableName === 'PRODUCT');
            });

        });
    });


    describe('Discover model foreign keys', function () {
        it('should return an array of foreign keys for INVENTORY', function () {
            var models = db.discoverForeignKeysSync(null, 'INVENTORY');
            models.forEach(function (m) {
                console.dir(m);
                assert(m.fkTableName === 'INVENTORY');
            });

        });


        it('should return an array of foreign keys for STRONGLOOP.INVENTORY', function () {
            var models = db.discoverForeignKeysSync('STRONGLOOP', 'INVENTORY');
            models.forEach(function (m) {
                console.dir(m);
                assert(m.fkTableName === 'INVENTORY');
            });
        });

    });

    describe('Discover ADL schema from a table', function () {
        it('should return an ADL schema for INVENTORY', function () {
            var schema = db.discoverSchemasSync('STRONGLOOP', "INVENTORY", {visitted: {}})['STRONGLOOP.INVENTORY'];
            console.log('%j', schema);
            assert(schema.name === 'Inventory');
            assert(schema.options.oracle.schema === 'STRONGLOOP');
            assert(schema.options.oracle.table === 'INVENTORY');
            assert(schema.properties.productId);
            assert(schema.properties.productId.type === 'String');
            assert(schema.properties.productId.oracle.columnName === 'PRODUCT_ID');
            assert(schema.properties.locationId);
            assert(schema.properties.locationId.type === 'String');
            assert(schema.properties.locationId.oracle.columnName === 'LOCATION_ID');
            assert(schema.properties.available);
            assert(schema.properties.available.type === 'Number');
            assert(schema.properties.total);
            assert(schema.properties.total.type === 'Number');

        });
    });
});