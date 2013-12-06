## Methods for discovery

***NOTE***: All the following methods are asynchronous.

### discoverModelDefinitions(options, cb)

| Parameter  | Description |
| ----- | ----- | 
| options| Object with properties described below.|
| cb |  Get a list of table/view names; see example below.|

Properties of options parameter:

 * all: {Boolean} To include tables/views from all schemas/owners
 * owner/schema: {String} The schema/owner name
 * views: {Boolean} Whether to include views 

Example of callback function return value:

        {type: 'table', name: 'INVENTORY', owner: 'STRONGLOOP' }
        {type: 'table', name: 'LOCATION', owner: 'STRONGLOOP' }
        {type: 'view', name: 'INVENTORY_VIEW', owner: 'STRONGLOOP' }

### discoverModelProperties(table, options, cb)

| Parameter  | Description |
| ----- | ----- | 
| table: {String}  | The name of a table or view |
| options |  owner/schema: {String} The schema/owner name |
| cb | Get a list of model property definitions; see example below. |

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

### discoverPrimaryKeys(table, options, cb)

| Parameter  | Description |
| ----- | ----- | 
|  table: {String} | Name of a table or view |
| options | owner/schema: {String} The schema/owner name |
| cb | Get a list of primary key definitions; see example below. |

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

### discoverForeignKeys(table, options, cb)

| Parameter  | Description |
| ----- | ----- | 
| table: {String} | Name of a table or view |
| options | owner/schema: {String} The schema/owner name |
| cb | Get a list of foreign key definitions; see example below. |

        { fkOwner: 'STRONGLOOP',
          fkName: 'PRODUCT_FK',
          fkTableName: 'INVENTORY',
          fkColumnName: 'PRODUCT_ID',
          keySeq: 1,
          pkOwner: 'STRONGLOOP',
          pkName: 'PRODUCT_PK',
          pkTableName: 'PRODUCT',
          pkColumnName: 'ID' }

### discoverExportedForeignKeys(table, options, cb)

| Parameter  | Description |
| ----- | ----- | 
| table: {String} | The name of a table or view |
| options |  owner/schema: {String} The schema/owner name
| cb |  Get a list of foreign key definitions that reference the primary key of the given table; see example below. |

        { fkName: 'PRODUCT_FK',
          fkOwner: 'STRONGLOOP',
          fkTableName: 'INVENTORY',
          fkColumnName: 'PRODUCT_ID',
          keySeq: 1,
          pkName: 'PRODUCT_PK',
          pkOwner: 'STRONGLOOP',
          pkTableName: 'PRODUCT',
          pkColumnName: 'ID' }

## Synchronous discovery methods

* Oracle.prototype.discoverModelDefinitionsSync = function (options)
* Oracle.prototype.discoverModelPropertiesSync = function (table, options)
* Oracle.prototype.discoverPrimaryKeysSync= function(table, options)
* Oracle.prototype.discoverForeignKeysSync= function(table, options)
* Oracle.prototype.discoverExportedForeignKeysSync= function(table, options)
