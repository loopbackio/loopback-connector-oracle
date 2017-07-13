// Copyright IBM Corp. 2013,2015. All Rights Reserved.
// Node module: loopback-connector-oracle
// US Government Users Restricted Rights - Use, duplication or disclosure
// restricted by GSA ADP Schedule Contract with IBM Corp.
'use strict';

/* global getDataSource */
var assert = require('assert');
var should = require('should');
require('./init/init');
var ds;

before(function() {
  ds = getDataSource();
});

describe('Oracle connector', function() {
  it('should auto migrate/update tables', function(done) {
    var schema_v1 = // eslint-disable-line camelcase
      {
        name: 'CustomerTest',
        options: {
          idInjection: false,
          oracle: {
            schema: 'TEST',
            table: 'CUSTOMER_TEST',
          },
        },
        properties: {
          id: {
            type: 'String',
            length: 20,
            id: 1,
          },
          name: {
            type: 'String',
            required: false,
            length: 40,
          },
          email: {
            type: 'String',
            required: true,
            length: 40,
          },
          age: {
            type: 'Number',
            required: false,
          },
        },
      };

    var schema_v2 = // eslint-disable-line camelcase
      {
        name: 'CustomerTest',
        options: {
          idInjection: false,
          oracle: {
            schema: 'TEST',
            table: 'CUSTOMER_TEST',
          },
        },
        properties: {
          id: {
            type: 'String',
            length: 20,
            id: 1,
          },
          email: {
            type: 'String',
            required: false,
            length: 60,
            oracle: {
              columnName: 'EMAIL',
              dataType: 'VARCHAR',
              dataLength: 60,
              nullable: 'Y',
            },
          },
          firstName: {
            type: 'String',
            required: false,
            length: 40,
          },
          lastName: {
            type: 'String',
            required: false,
            length: 40,
          },
        },
      };

    ds.createModel(schema_v1.name, schema_v1.properties, schema_v1.options); // eslint-disable-line camelcase

    ds.automigrate(function(err) {
      if (err) return done(err);

      ds.discoverModelProperties('CUSTOMER_TEST', function(err, props) {
        if (err) return done(err);
        assert.equal(props.length, 4);
        var columns = {};
        props.forEach(function(p) {
          columns[p.columnName] = p.nullable;
        });
        columns.should.be.eql({
          AGE: 'Y',
          EMAIL: 'N',
          NAME: 'Y',
          ID: 'N',
        });

        ds.createModel(schema_v2.name, schema_v2.properties, schema_v2.options); // eslint-disable-line camelcase

        ds.autoupdate(function(err, result) {
          ds.discoverModelProperties('CUSTOMER_TEST', function(err, props) {
            assert.equal(props.length, 4);
            var columns = {};
            props.forEach(function(p) {
              columns[p.columnName] = p.nullable;
            });
            columns.should.be.eql({
              LASTNAME: 'Y',
              FIRSTNAME: 'Y',
              EMAIL: 'Y',
              ID: 'N',
            });
            done(err, result);
          });
        });
      });
    });
  });

  it('should report errors for automigrate', function() {
    ds.automigrate('XYZ', function(err) {
      assert(err);
    });
  });

  it('should report errors for autoupdate', function() {
    ds.autoupdate('XYZ', function(err) {
      assert(err);
    });
  });
});
