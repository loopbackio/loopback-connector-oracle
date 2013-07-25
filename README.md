## Loopback Oracle Connector

Connect Loopback to Oracle

## Installation

You need to download and install Oracle instant client from following links:

http://www.oracle.com/technetwork/database/features/instant-client/index-097480.html

1. Instant Client Package - Basic: All files required to run OCI, OCCI, and JDBC-OCI applications
2. Instant Client Package - SDK: Additional header files and an example makefile for developing Oracle applications with Instant Client

For Windows, please make sure 12_1 version is used.

<ul>
<li>Please make sure you download the correct packages for your system architecture, such as 64 bit vs 32 bit
<li>Unzip the files 1 and 2 into the same directory, such as /opt/instantclient_11_2 or c:\instantclient_12_1
</ul>


On MacOS or Linux:

1. Set up the following environment variables

MacOS/Linux:

    export OCI_HOME=<directory of Oracle instant client>
    export OCI_LIB_DIR=$OCI_HOME
    export OCI_INCLUDE_DIR=$OCI_HOME/sdk/include

2. Create the following symbolic links

MacOS:

    cd $OCI_LIB_DIR
    ln -s libclntsh.dylib.11.1 libclntsh.dylib
    ln -s libocci.dylib.11.1 libocci.dylib

Linux:

    cd $OCI_LIB_DIR
    ln -s libclntsh.so.11.1 libclntsh.so 
    ln -s libocci.so.11.1 libocci.so 

3. Configure the dynamic library path

MacOS:

    export DYLD_LIBRARY_PATH=$OCI_LIB_DIR

On Windows, you need to set the environment variables:

If you have VisualStudio 2012 installed,

    OCI_INCLUDE_DIR=C:\instantclient_12_1\sdk\include
    OCI_LIB_DIR=C:\instantclient_12_1\sdk\lib\msvc\vc11
    Path=...;c:\instantclient_12_1\vc11;c:\instantclient_12_1

**Please make sure c:\instantclient_12_1\vc11 comes before c:\instantclient_12_1**

If you have VisualStudio 2010 installed,

    OCI_INCLUDE_DIR=C:\instantclient_12_1\sdk\include
    OCI_LIB_DIR=C:\instantclient_12_1\sdk\lib\msvc\vc10
    Path=...;c:\instantclient_12_1\vc10;c:\instantclient_12_1

**Please make sure c:\instantclient_12_1\vc10 comes before c:\instantclient_12_1**

## Connector settings

The connector can be configured using the following settings from the data source.

* host or hostname (default to 'localhost'): The host name or ip address of the Oracle DB server
* port (default to 1521): The port number of the Oracle DB server
* username or user: The user name to connect to the Oracle DB
* password: The password
* database (default to 'XE'): The Oracle DB listener name
* debug (default to false)

## Discovering Models

Oracle data sources allow you to discover model definition information from existing oracle databases. See the following APIs:

 - [dataSource.discoverModelDefinitions([username], fn)](https://github.com/strongloop/loopback#datasourcediscovermodeldefinitionsusername-fn)
 - [dataSource.discoverSchema([owner], name, fn)](https://github.com/strongloop/loopback#datasourcediscoverschemaowner-name-fn)

### Asynchronous APIs for discovery

* Oracle.prototype.discoverModelDefinitions = function (options, cb)
  - options:
    - all: {Boolean} To include tables/views from all schemas/owners
    - owner/schema: {String} The schema/owner name
    - views: {Boolean} To include views
  - cb:
    - Get a list of table/view names, for example:

        {type: 'table', name: 'INVENTORY', owner: 'STRONGLOOP' }
        {type: 'table', name: 'LOCATION', owner: 'STRONGLOOP' }
        {type: 'view', name: 'INVENTORY_VIEW', owner: 'STRONGLOOP' }


* Oracle.prototype.discoverModelProperties = function (table, options, cb)
  - table: {String} The name of a table or view
  - options:
    - owner/schema: {String} The schema/owner name
  - cb:
    - Get a list of model property definitions, for example:

          { owner: 'STRONGLOOP',
            tableName: 'PRODUCT',
            columnName: 'ID',
            dataType: 'VARCHAR2',
            dataLength: 20,
            nullable: 'N',
            type: 'String' }
          { owner: 'STRONGLOOP',
            tableName: 'PRODUCT',
            columnName: 'NAME',
            dataType: 'VARCHAR2',
            dataLength: 64,
            nullable: 'Y',
            type: 'String' }


* Oracle.prototype.discoverPrimaryKeys= function(table, options, cb)
  - table: {String} The name of a table or view
  - options:
    - owner/schema: {String} The schema/owner name
  - cb:
    - Get a list of primary key definitions, for example:

        { owner: 'STRONGLOOP',
          tableName: 'INVENTORY',
          columnName: 'PRODUCT_ID',
          keySeq: 1,
          pkName: 'ID_PK' }
        { owner: 'STRONGLOOP',
          tableName: 'INVENTORY',
          columnName: 'LOCATION_ID',
          keySeq: 2,
          pkName: 'ID_PK' }

* Oracle.prototype.discoverForeignKeys= function(table, options, cb)
  - table: {String} The name of a table or view
  - options:
    - owner/schema: {String} The schema/owner name
  - cb:
    - Get a list of foreign key definitions, for example:

        { fkOwner: 'STRONGLOOP',
          fkName: 'PRODUCT_FK',
          fkTableName: 'INVENTORY',
          fkColumnName: 'PRODUCT_ID',
          keySeq: 1,
          pkOwner: 'STRONGLOOP',
          pkName: 'PRODUCT_PK',
          pkTableName: 'PRODUCT',
          pkColumnName: 'ID' }


* Oracle.prototype.discoverExportedForeignKeys= function(table, options, cb)

  - table: {String} The name of a table or view
  - options:
    - owner/schema: {String} The schema/owner name
  - cb:
    - Get a list of foreign key definitions that reference the primary key of the given table, for example:

        { fkName: 'PRODUCT_FK',
          fkOwner: 'STRONGLOOP',
          fkTableName: 'INVENTORY',
          fkColumnName: 'PRODUCT_ID',
          keySeq: 1,
          pkName: 'PRODUCT_PK',
          pkOwner: 'STRONGLOOP',
          pkTableName: 'PRODUCT',
          pkColumnName: 'ID' }


### Synchronous APIs for discovery

* Oracle.prototype.discoverModelDefinitionsSync = function (options)
* Oracle.prototype.discoverModelPropertiesSync = function (table, options)
* Oracle.prototype.discoverPrimaryKeysSync= function(table, options)
* Oracle.prototype.discoverForeignKeysSync= function(table, options)
* Oracle.prototype.discoverExportedForeignKeysSync= function(table, options)

### Discover/build/try the models

The following example uses `discoverAndBuildModels` to discover, build and try the models:

    dataSource.discoverAndBuildModels('INVENTORY', { owner: 'STRONGLOOP', visited: {}, associations: true},
         function (err, models) {
            // Show records from the models
            for(var m in models) {
                models[m].all(show);
            };

            // Find one record for inventory
            models.Inventory.findOne({}, function(err, inv) {
                console.log("\nInventory: ", inv);
                // Follow the foreign key to navigate to the product
                inv.product(function(err, prod) {
                    console.log("\nProduct: ", prod);
                    console.log("\n ------------- ");
                });
        });
    }

## Model definition for Oracle

The model definition consists of the following properties:

* name: Name of the model, by default, it's the camel case of the table
* options: Model level operations and mapping to Oracle schema/table
* properties: Property definitions, including mapping to Oracle column

        {
          "name":"Inventory",
          "options":{
            "idInjection":false,
            "oracle":{
              "schema":"STRONGLOOP",
              "table":"INVENTORY"
            }
          },
          "properties":{
            "productId":{
              "type":"String",
              "required":true,
              "length":20,
              "id":1,
              "oracle":{
                "columnName":"PRODUCT_ID",
                "dataType":"VARCHAR2",
                "dataLength":20,
                "nullable":"N"
              }
            },
            "locationId":{
              "type":"String",
              "required":true,
              "length":20,
              "id":2,
              "oracle":{
                "columnName":"LOCATION_ID",
                "dataType":"VARCHAR2",
                "dataLength":20,
                "nullable":"N"
              }
            },
            "available":{
              "type":"Number",
              "required":false,
              "length":22,
              "oracle":{
                "columnName":"AVAILABLE",
                "dataType":"NUMBER",
                "dataLength":22,
                "nullable":"Y"
              }
            },
            "total":{
              "type":"Number",
              "required":false,
              "length":22,
              "oracle":{
                "columnName":"TOTAL",
                "dataType":"NUMBER",
                "dataLength":22,
                "nullable":"Y"
              }
            }
          }
        }


## Type Mapping

 - Number
 - Boolean
 - String
 - null
 - Object
 - undefined
 - Date
 - Array
 - Buffer

### JSON to Oracle Types

* String|JSON|Text|default: VARCHAR2, default lenght is 1024
* Number: NUMBER
* Date: DATE
* Timestamp: TIMESTAMP(3)
* Boolean: CHAR(1)

### Oracle Types to JSON

* CHAR(1): Boolean
* CHAR(n), VARCHAR, VARCHAR2, LONG VARCHAR, NCHAR, NVARCHAR2: String
* LONG, BLOB, CLOB, NCLOB: Buffer
* NUMBER, INTEGER, DECIMAL, DOUBLE, FLOAT, BIGINT, SMALLINT, REAL, NUMERIC, BINARY_FLOAT, BINARY_DOUBLE, UROWID, ROWID: Number
* DATE, TIMESTAMP: Date
* default: String

## Destroying Models

Destroying models may result in errors due to foreign key integrity. Make sure to delete any related models first before calling delete on model's with relationships.

## Auto Migrate / Auto Update

After making changes to your model properties you must call `Model.automigrate()` or `Model.autoupdate()`. Only call `Model.automigrate()` on new models
as it will drop existing tables.

Loopback Oracle connector creates the following shema objects for a given model:

* A table, for example, PRODUCT
* A sequence for the primary key, for example, PRODUCT_ID_SEQUENCE
* A trigger to generate the primary key from the sequnce, for example, PRODUCT_ID_TRIGGER


## Running examples

* example/app.js: Demonstrate the asynchonous discovery
* example/app-sync.js: Demonstrate the synchronous discovery

## Running tests

    npm test