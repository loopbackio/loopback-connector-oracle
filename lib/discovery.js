// Copyright IBM Corp. 2015,2019. All Rights Reserved.
// Node module: loopback-connector-oracle
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';
const g = require('strong-globalize')();
const async = require('async');

module.exports = mixinDiscovery;

function mixinDiscovery(Oracle) {
  function getPagination(filter) {
    const pagination = [];
    if (filter && (filter.limit || filter.offset || filter.skip)) {
      let offset = Number(filter.offset);
      if (!offset) {
        offset = Number(filter.skip);
      }
      if (offset) {
        pagination.push('R >= ' + (offset + 1));
      } else {
        offset = 0;
      }
      const limit = Number(filter.limit);
      if (limit) {
        pagination.push('R <= ' + (offset + limit));
      }
    }
    return pagination;
  }

  Oracle.prototype.buildQuerySchemas = function(options) {
    const sql = 'select username from SYS.all_users';
    return this.paginateSQL(sql, 'username', options);
  };

  /*!
   * Create a SQL statement that supports pagination
   * @param {String} sql The SELECT statement that supports pagination
   * @param {String} orderBy The 'order by' columns
   * @param {Object} options options
   * @returns {String} The SQL statement
   */
  Oracle.prototype.paginateSQL = function(sql, orderBy, options) {
    const pagination = getPagination(options);
    orderBy = orderBy || '1';
    if (pagination.length) {
      return 'SELECT * FROM (SELECT ROW_NUMBER() OVER (ORDER BY ' + orderBy +
        ') R, ' + sql.substring(7) + ') WHERE ' + pagination.join(' AND ');
    } else {
      return sql;
    }
  };

  /*!
   * Build sql for listing tables
   * @param {Object} options {all: for all owners, owner: for a given owner}
   * @returns {String} The sql statement
   */
  Oracle.prototype.buildQueryTables = function(options) {
    let sqlTables = null;
    const owner = options.owner || options.schema;

    if (options.all && !owner) {
      sqlTables = this.paginateSQL('SELECT \'table\' AS "type", ' +
        'table_name AS "name", ' +
        'owner AS "owner" FROM all_tables', 'owner, table_name', options);
    } else if (owner) {
      sqlTables = this.paginateSQL('SELECT \'table\' AS "type", ' +
        'table_name AS "name", ' +
        'owner AS "owner" FROM all_tables WHERE owner=\'' + owner + '\'',
      'owner, table_name', options);
    } else {
      sqlTables = this.paginateSQL('SELECT \'table\' AS "type", ' +
        'table_name AS "name", SYS_CONTEXT(\'USERENV\',' +
        ' \'SESSION_USER\') AS "owner" FROM user_tables',
      'table_name', options);
    }
    return sqlTables;
  };

  /*!
   * Build sql for listing views
   * @param {Object} options {all: for all owners, owner: for a given owner}
   * @returns {String} The sql statement
   */
  Oracle.prototype.buildQueryViews = function(options) {
    let sqlViews = null;
    if (options.views) {
      const owner = options.owner || options.schema;

      if (options.all && !owner) {
        sqlViews = this.paginateSQL('SELECT \'view\' AS "type", ' +
          'view_name AS "name", owner AS "owner" FROM all_views',
        'owner, view_name', options);
      } else if (owner) {
        sqlViews = this.paginateSQL('SELECT \'view\' AS "type", ' +
          'view_name AS "name", owner AS "owner" FROM all_views ' +
          'WHERE owner=\'' + owner + '\'',
        'owner, view_name', options);
      } else {
        sqlViews = this.paginateSQL('SELECT \'view\' AS "type", ' +
          'view_name AS "name", SYS_CONTEXT(\'USERENV\', \'SESSION_USER\')' +
          ' AS "owner" FROM user_views', 'view_name', options);
      }
    }
    return sqlViews;
  };

  /**
   * Discover model definitions.
   * Example of callback function return value:
   * ```js
   * {type: 'table', name: 'INVENTORY', owner: 'STRONGLOOP' }
   * {type: 'table', name: 'LOCATION', owner: 'STRONGLOOP' }
   * {type: 'view', name: 'INVENTORY_VIEW', owner: 'STRONGLOOP' }
   *```
   * @options {Object} options Options for discovery; see below.
   * @prop {Boolean} all If true, include tables/views from all schemas/owners.
   * @prop {String} owner/schema The schema/owner name.  QUESTION:  What is the actual name of this property: 'owner' or 'schema'?  Or can it be either?
   * @prop {Boolean} views If true, include views.
   * @prop {Number} limit Maximimum number of results to return.  NOTE: This was not in .md doc, but is included in tests.
   * @param {Function} [cb] The callback function.
   * @private
   */

  /**
   * Discover the model definitions synchronously.
   *
   * @options {Object} options Options for discovery; see below.
   * @prop {Boolean} all If true, include tables/views from all schemas/owners.
   * @prop {String} owner/schema The schema/owner name.  QUESTION:  What is the actual name of this property: 'owner' or 'schema'?  Or can it be either?
   * @prop {Boolean} views If true, include views.
   * @prop {Number} limit Maximimum number of results to return.  NOTE: This was not in .md doc, but is included in tests.
   * @private
   */
  Oracle.prototype.discoverModelDefinitionsSync = function(options) {
    options = options || {};
    const sqlTables = this.buildQueryTables(options);
    let tables = this.querySync(sqlTables);
    const sqlViews = this.buildQueryViews(options);
    if (sqlViews) {
      const views = this.querySync(sqlViews);
      tables = tables.concat(views);
    }
    return tables;
  };

  /*!
   * Normalize the arguments
   * @param {String} table The table name
   * @param {Object} [options] The options object
   * @param {Function} [cb] The callback function
   */
  Oracle.prototype.getArgs = function(table, options, cb) {
    if ('string' !== typeof table || !table) {
      throw new Error(g.f('{{table}} is a required string argument: %s',
        table));
    }
    options = options || {};
    if (!cb && 'function' === typeof options) {
      cb = options;
      options = {};
    }
    if (typeof options !== 'object') {
      throw new Error(g.f('{{options}} must be an {{object}}: %s', options));
    }
    return {
      owner: options.owner || options.schema,
      // Base connector expects `schema`
      schema: options.owner || options.schema,
      table: table,
      options: options,
      cb: cb,
    };
  };

  /*!
   * Build the sql statement to query columns for a given table
   * @param {String} owner The DB owner/schema name
   * @param {String} table The table name
   * @returns {String} The sql statement
   */
  Oracle.prototype.buildQueryColumns = function(owner, table) {
    let sql = null;
    if (owner) {
      sql = this.paginateSQL('SELECT owner AS "owner", table_name AS ' +
        ' "tableName", column_name AS "columnName", data_type AS "dataType",' +
        ' data_length AS "dataLength", data_precision AS "dataPrecision",' +
        ' data_scale AS "dataScale", nullable AS "nullable"' +
        ' FROM all_tab_columns' +
        ' WHERE owner=\'' + owner + '\'' +
        (table ? ' AND table_name=\'' + table + '\'' : ''),
      'table_name, column_id', {});
    } else {
      sql = this.paginateSQL('SELECT' +
        ' SYS_CONTEXT(\'USERENV\', \'SESSION_USER\') ' +
        ' AS "owner", table_name AS "tableName", column_name AS "columnName",' +
        ' data_type AS "dataType",' +
        ' data_length AS "dataLength", data_precision AS "dataPrecision",' +
        ' data_scale AS "dataScale", nullable AS "nullable"' +
        ' FROM user_tab_columns' +
        (table ? ' WHERE table_name=\'' + table + '\'' : ''), +
      'table_name, column_id', {});
    }
    sql += ' ORDER BY column_id';
    return sql;
  };

  /**
   * Discover model properties from a table.  Returns an array of columns for the specified table.
   *
   * @param {String} table The table name
   * @options {Object} options Options for discovery; see below.
   * @prop {Boolean} all If true, include tables/views from all schemas/owners.
   * @prop {String} owner/schema The schema/owner name.  QUESTION:  What is the actual name of this property: 'owner' or 'schema'?  Or can it be either?
   * @prop {Boolean} views If true, include views.
   * @prop {Number} limit Maximimum number of results to return.  NOTE: This was not in .md doc, but is included in tests.
   * @param {Function} [cb] The callback function
   *
   * ```js
   * { owner: 'STRONGLOOP',
 *   tableName: 'PRODUCT',
 *   columnName: 'ID',
 *   dataType: 'VARCHAR2',
 *   dataLength: 20,
 *   nullable: 'N',
 *   type: 'String'
 * }
   * { owner: 'STRONGLOOP',
 *   tableName: 'PRODUCT',
 *   columnName: 'NAME',
 *   dataType: 'VARCHAR2',
 *   dataLength: 64,
 *   nullable: 'Y',
 *   type: 'String'
 * }
   *```
   * @private
   */

  /**
   * Discover model properties from a table synchronously.  See example return value for discoverModelProperties().
   *
   * @param {String} table The table name
   * @options {Object} options Options for discovery; see below.
   * @prop {Boolean} all If true, include tables/views from all schemas/owners.
   * @prop {String} owner/schema The schema/owner name.  QUESTION:  What is the actual name of this property: 'owner' or 'schema'?  Or can it be either?
   * @prop {Boolean} views If true, include views.
   * @prop {Number} limit Maximimum number of results to return.  NOTE: This was not in .md doc, but is included in tests.
   * @private
   *
   */
  Oracle.prototype.discoverModelPropertiesSync = function(table, options) {
    const self = this;
    const args = this.getArgs(table, options);
    const owner = args.owner;
    table = args.table;
    options = args.options;

    const sql = this.buildQueryColumns(owner, table);
    const results = this.querySync(sql);
    results.map(function(r) {
      r.type = self.buildPropertyType(r.dataType, r.dataLength);
    });
    return results;
  };

  /*!
   * Build the sql statement for querying primary keys of a given table
   * @param owner
   * @param table
   * @returns {String}
   */
  // http://docs.oracle.com/javase/6/docs/api/java/sql/DatabaseMetaData.html#
  // getPrimaryKeys(java.lang.String, java.lang.String, java.lang.String)
  Oracle.prototype.buildQueryPrimaryKeys = function(owner, table) {
    let sql = 'SELECT uc.owner AS "owner", ' +
      'uc.table_name AS "tableName", col.column_name AS "columnName",' +
      ' col.position AS "keySeq", uc.constraint_name AS "pkName" FROM' +
      (owner ?
        ' ALL_CONSTRAINTS uc, ALL_CONS_COLUMNS col' :
        ' USER_CONSTRAINTS uc, USER_CONS_COLUMNS col') +
      ' WHERE uc.constraint_type=\'P\' AND ' +
      'uc.constraint_name=col.constraint_name';

    if (owner) {
      sql += ' AND uc.owner=\'' + owner + '\'';
    }
    if (table) {
      sql += ' AND uc.table_name=\'' + table + '\'';
    }
    sql += ' ORDER BY uc.owner, col.constraint_name, uc.table_name, ' +
      'col.position';
    return sql;
  };

  /**
   * Discover primary keys for specified table. Returns an array of primary keys for the specified table.
   * Example return value:
   * ```js
   *         { owner: 'STRONGLOOP',
 *           tableName: 'INVENTORY',
 *           columnName: 'PRODUCT_ID',
 *           keySeq: 1,
 *           pkName: 'ID_PK' }
   *         { owner: 'STRONGLOOP',
 *           tableName: 'INVENTORY',
 *           columnName: 'LOCATION_ID',
 *           keySeq: 2,
 *          pkName: 'ID_PK' }
   *```
   *
   * @param {String} table The table name
   * @options {Object} options Options for discovery; see below.
   * @prop {Boolean} all If true, include tables/views from all schemas/owners.
   * @prop {String} owner/schema The schema/owner name.  QUESTION:  What is the actual name of this property: 'owner' or 'schema'?  Or can it be either?
   * @prop {Boolean} views If true, include views.
   * @prop {Number} limit Maximimum number of results to return.  NOTE: This was not in .md doc, but is included in tests.
   * @param {Function} [cb] The callback function
   * @private
   */

  /**
   * Discover primary keys synchronously for specified table.  See example return value for discoverPrimaryKeys().
   *
   * @param {String} table
   * @options {Object} options Options for discovery; see below.
   * @prop {Boolean} all If true, include tables/views from all schemas/owners.
   * @prop {String} owner/schema The schema/owner name.  QUESTION:  What is the actual name of this property: 'owner' or 'schema'?  Or can it be either?
   * @prop {Boolean} views If true, include views.
   * @prop {Number} limit Maximimum number of results to return.  NOTE: This was not in .md doc, but is included in tests.
   * @private
   */
  Oracle.prototype.discoverPrimaryKeysSync = function(table, options) {
    const args = this.getArgs(table, options);
    const owner = args.owner;
    table = args.table;
    options = args.options;

    const sql = this.buildQueryPrimaryKeys(owner, table);
    return this.querySync(sql);
  };

  /*!
   * Build the sql statement for querying foreign keys of a given table
   * @param {String} owner The DB owner/schema name
   * @param {String} table The table name
   * @returns {String} The SQL statement to find foreign keys
   */
  Oracle.prototype.buildQueryForeignKeys = function(owner, table) {
    let sql =
      'SELECT a.owner AS "fkOwner", a.constraint_name AS "fkName", ' +
      'a.table_name AS "fkTableName", a.column_name AS "fkColumnName", ' +
      'a.position AS "keySeq", jcol.owner AS "pkOwner", ' +
      'jcol.constraint_name AS "pkName", jcol.table_name AS "pkTableName", ' +
      'jcol.column_name AS "pkColumnName"' +
      ' FROM' +
      ' (SELECT' +
      ' uc.owner, uc.table_name, uc.constraint_name, uc.r_constraint_name, ' +
      'col.column_name, col.position' +
      ' FROM' +
      (owner ?
        ' ALL_CONSTRAINTS uc, ALL_CONS_COLUMNS col' :
        ' USER_CONSTRAINTS uc, USER_CONS_COLUMNS col') +
      ' WHERE' +
      ' uc.constraint_type=\'R\' and uc.constraint_name=col.constraint_name';
    if (owner) {
      sql += ' AND uc.owner=\'' + owner + '\'';
    }
    if (table) {
      sql += ' AND uc.table_name=\'' + table + '\'';
    }
    sql += ' ) a' +
      ' INNER JOIN' +
      ' USER_CONS_COLUMNS jcol' +
      ' ON' +
      ' a.r_constraint_name=jcol.constraint_name';
    return sql;
  };

  /**
   * Discover foreign keys for specified table.  Example return value:
   * ```js
   * { fkOwner: 'STRONGLOOP',
 *   fkName: 'PRODUCT_FK',
 *   fkTableName: 'INVENTORY',
 *   fkColumnName: 'PRODUCT_ID',
 *   keySeq: 1,
 *   pkOwner: 'STRONGLOOP',
 *   pkName: 'PRODUCT_PK',
 *   pkTableName: 'PRODUCT',
 *   pkColumnName: 'ID' }
   * ```
   *
   * @param {String} table The table name
   * @options {Object} options Options for discovery; see below.
   * @prop {Boolean} all If true, include tables/views from all schemas/owners.
   * @prop {String} owner/schema The schema/owner name.  QUESTION:  What is the actual name of this property: 'owner' or 'schema'?  Or can it be either?
   * @prop {Boolean} views If true, include views.
   * @prop {Number} limit Maximimum number of results to return.  NOTE: This was not in .md doc, but is included in tests.
   * @param {Function} [cb] The callback function
   * @private
   */

  /**
   * Discover foreign keys synchronously for a given table.  See example return value for discoverForeignKeys().
   *
   * @param {String} table The table name
   * @options {Object} options Options for discovery; see below.
   * @prop {Boolean} all If true, include tables/views from all schemas/owners.
   * @prop {String} owner/schema The schema/owner name.  QUESTION:  What is the actual name of this property: 'owner' or 'schema'?  Or can it be either?
   * @prop {Boolean} views If true, include views.
   * @prop {Number} limit Maximimum number of results to return.  NOTE: This was not in .md doc, but is included in tests.
   * @private
   */
  Oracle.prototype.discoverForeignKeysSync = function(table, options) {
    const args = this.getArgs(table, options);
    const owner = args.owner;
    table = args.table;
    options = args.options;

    const sql = this.buildQueryForeignKeys(owner, table);
    return this.querySync(sql);
  };

  /*!
   * Retrieves a description of the foreign key columns that reference the given
   * table's primary key columns (the foreign keys exported by a table).
   * They are ordered by fkTableOwner, fkTableName, and keySeq.
   * @param {String} owner The DB owner/schema name
   * @param {String} table The table name
   * @returns {String} The SQL statement
   */
  Oracle.prototype.buildQueryExportedForeignKeys = function(owner, table) {
    let sql = 'SELECT a.constraint_name AS "fkName", a.owner AS "fkOwner", ' +
      'a.table_name AS "fkTableName",' +
      ' a.column_name AS "fkColumnName", a.position AS "keySeq",' +
      ' jcol.constraint_name AS "pkName", jcol.owner AS "pkOwner",' +
      ' jcol.table_name AS "pkTableName", jcol.column_name AS "pkColumnName"' +
      ' FROM' +
      ' (SELECT' +
      ' uc1.table_name, uc1.constraint_name, uc1.r_constraint_name, ' +
      'col.column_name, col.position, col.owner' +
      ' FROM' +
      (owner ?
        ' ALL_CONSTRAINTS uc, ALL_CONSTRAINTS uc1, ALL_CONS_COLUMNS col' :
        ' USER_CONSTRAINTS uc, USER_CONSTRAINTS uc1, USER_CONS_COLUMNS col') +
      ' WHERE' +
      ' uc.constraint_type=\'P\' and' +
      ' uc1.r_constraint_name = uc.constraint_name and' +
      ' uc1.constraint_type = \'R\' and' +
      ' uc1.constraint_name=col.constraint_name';
    if (owner) {
      sql += ' and col.owner=\'' + owner + '\'';
    }
    if (table) {
      sql += ' and uc.table_Name=\'' + table + '\'';
    }
    sql += ' ) a' +
      ' INNER JOIN' +
      ' USER_CONS_COLUMNS jcol' +
      ' ON' +
      ' a.r_constraint_name=jcol.constraint_name' +
      ' order by a.owner, a.table_name, a.position';

    return sql;
  };

  /**
   * Discover foreign keys that reference to the primary key of this table.
   * Example return value:
   * ```js
   * { fkName: 'PRODUCT_FK',
 *   fkOwner: 'STRONGLOOP',
 *   fkTableName: 'INVENTORY',
 *   fkColumnName: 'PRODUCT_ID',
 *   keySeq: 1,
 *   pkName: 'PRODUCT_PK',
 *   pkOwner: 'STRONGLOOP',
 *   pkTableName: 'PRODUCT',
 *   pkColumnName: 'ID' }
   *   ````
   * @param {String} table The table name
   * @options {Object} options The options for discovery
   * @prop {Boolean} all If true, include tables/views from all schemas/owners.
   * @prop {String} owner/schema The schema/owner name.  QUESTION:  What is the actual name of this property: 'owner' or 'schema'?  Or can it be either?
   * @prop {Boolean} views If true, include views.
   * @param {Function} [cb] The callback function
   * @private
   */

  /**
   * Discover foreign keys synchronously for a given table; see example return value for discoverExportedForeignKeys().
   * @param {String} owner The DB owner/schema name
   * @options {Object} options The options for discovery; see below.
   * @prop {Boolean} all If true, include tables/views from all schemas/owners.
   * @prop {String} owner/schema The schema/owner name.  QUESTION:  What is the actual name of this property: 'owner' or 'schema'?  Or can it be either?
   * @prop {Boolean} views If true, include views.
   * @returns {*}
   * @private
   */
  Oracle.prototype.discoverExportedForeignKeysSync = function(table, options) {
    const args = this.getArgs(table, options);
    const owner = args.owner;
    table = args.table;
    options = args.options;

    const sql = this.buildQueryExportedForeignKeys(owner, table);
    return this.querySync(sql);
  };

  /*!
   * Map oracle data types to json types
   * @param {String} oracleType
   * @param {Number} dataLength
   * @returns {String}
   */
  Oracle.prototype.buildPropertyType = function(columnDefinition, options) {
    const oracleType = columnDefinition.dataType;
    const dataLength = columnDefinition.dataLength;
    const type = oracleType.toUpperCase();
    switch (type) {
      case 'CHAR':
        if (dataLength === 1) {
          // Treat char(1) as boolean
          return 'Boolean';
        } else {
          return 'String';
        }
        break;
      case 'VARCHAR':
      case 'VARCHAR2':
      case 'LONG VARCHAR':
      case 'NCHAR':
      case 'NVARCHAR2':
        return 'String';
      case 'LONG':
      case 'BLOB':
      case 'CLOB':
      case 'NCLOB':
        return 'Binary';
      case 'NUMBER':
      case 'INTEGER':
      case 'DECIMAL':
      case 'DOUBLE':
      case 'FLOAT':
      case 'BIGINT':
      case 'SMALLINT':
      case 'REAL':
      case 'NUMERIC':
      case 'BINARY_FLOAT':
      case 'BINARY_DOUBLE':
      case 'UROWID':
      case 'ROWID':
        return 'Number';
      case 'DATE':
      case 'TIMESTAMP':
        return 'Date';
      default:
        return 'String';
    }
  };

  Oracle.prototype.setDefaultOptions = function(options) {
  };

  Oracle.prototype.setNullableProperty = function(property) {
  };

  Oracle.prototype.getDefaultSchema = function() {
    return '';
  };
}
