var assert = require('assert');
var DataSource = require('loopback-datasource-juggler').DataSource;
var ds;

before(function () {

    ds = getSchema();

});

describe('Oracle connector', function () {
    it('should auto migrate/update tables', function (done) {


        var schema_v1 =
        {
            "name": "CustomerTest",
            "options": {
                "idInjection": false,
                "oracle": {
                    "schema": "TEST",
                    "table": "CUSTOMER_TEST"
                }
            },
            "properties": {
                "id": {
                    "type": "String",
                    "length": 20,
                    "id": 1
                },
                "name": {
                    "type": "String",
                    "required": false,
                    "length": 40
                },
                "email": {
                    "type": "String",
                    "required": false,
                    "length": 40
                },
                "age": {
                    "type": "Number",
                    "required": false
                }
            }
        }


        var schema_v2 =
        {
            "name": "CustomerTest",
            "options": {
                "idInjection": false,
                "oracle": {
                    "schema": "TEST",
                    "table": "CUSTOMER_TEST"
                }
            },
            "properties": {
                "id": {
                    "type": "String",
                    "length": 20,
                    "id": 1
                },
                "email": {
                    "type": "String",
                    "required": false,
                    "length": 60,
                    "oracle": {
                        "columnName": "EMAIL",
                        "dataType": "VARCHAR",
                        "dataLength": 60,
                        "nullable": "Y"
                    }
                },
                "firstName": {
                    "type": "String",
                    "required": false,
                    "length": 40
                },
                "lastName": {
                    "type": "String",
                    "required": false,
                    "length": 40
                }
            }
        }

        ds.createModel(schema_v1.name, schema_v1.properties, schema_v1.options);

        ds.automigrate(function () {

            ds.discoverModelProperties('CUSTOMER_TEST', function (err, props) {
                assert.equal(props.length, 4);
                var names = props.map(function(p) {
                    return p.columnName;
                });
                assert.equal(names[0], 'ID');
                assert.equal(names[1], 'NAME');
                assert.equal(names[2], 'EMAIL');
                assert.equal(names[3], 'AGE');

                ds.createModel(schema_v2.name, schema_v2.properties, schema_v2.options);

                ds.autoupdate(function (err, result) {
                    ds.discoverModelProperties('CUSTOMER_TEST', function (err, props) {
                        assert.equal(props.length, 4);
                        var names = props.map(function(p) {
                            return p.columnName;
                        });
                        assert.equal(names[0], 'ID');
                        assert.equal(names[1], 'EMAIL');
                        assert.equal(names[2], 'FIRSTNAME');
                        assert.equal(names[3], 'LASTNAME');
                        // console.log(err, result);
                        done(err, result);
                    });
                });
            });
        });
    });
});

