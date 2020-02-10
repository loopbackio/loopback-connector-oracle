// Copyright IBM Corp. 2013,2019. All Rights Reserved.
// Node module: loopback-connector-oracle
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';

const g = require('strong-globalize')();
const DataSource = require('loopback-datasource-juggler').DataSource;
const config = require('rc')('loopback', {dev: {oracle: {}}}).dev.oracle;

const ds = new DataSource(require('../'), config);

function show(err, models) {
  if (err) {
    console.error(err);
  } else {
    models.forEach(function(m) {
      console.log(m);
    });
  }
}

/*
ds.discoverModelDefinitions({views: true, limit: 20}, show);

ds.discoverModelProperties('PRODUCT', show);

// ds.discoverModelProperties('INVENTORY_VIEW', {owner: 'STRONGLOOP'}, show);

ds.discoverPrimaryKeys('INVENTORY',  show);
ds.discoverForeignKeys('INVENTORY',  show);

ds.discoverExportedForeignKeys('PRODUCT',  show);
*/

const table = (process.argv.length > 2) ? process.argv[2] : 'INVENTORY_VIEW';

ds.discoverSchema(table, {owner: 'STRONGLOOP'}, function(err, schema) {
  console.log(JSON.stringify(schema));
  const model = ds.define(schema.name, schema.properties, schema.options);
  // console.log(model);
  model.all(show);
});

ds.discoverAndBuildModels(
  'INVENTORY',
  {owner: 'STRONGLOOP',
    visited: {},
    associations: true},
  function(err, models) {
    for (const m in models) {
      models[m].all(show);
    }

    models.Inventory.findOne({}, function(err, inv) {
      console.log(g.f('\nInventory: %s', inv));
      inv.product(function(err, prod) {
        console.log(g.f('\nProduct: %s', prod));
        console.log('\n ------------- ');
        // ds.disconnect(); // This will crash node-oracle as the connection is disconnected while other statements are still running
      });
    });
  },
);
