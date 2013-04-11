## JugglingDB-Oracle 

Oracle adapter for JugglingDB.

## Installation

You need to install Oracle instance client:

http://www.oracle.com/technetwork/database/features/instant-client/index-097480.html

    export OCI_HOME=<directory where you install Oracle instance client>
    export OCI_LIB_DIR=$OCI_HOME
    export OCI_INCLUDE_DIR=$OCI_HOME/sdk/include

## Usage

To use it you need `jugglingdb@0.2.x`.

1. Setup dependencies in `package.json`:

    ```json
    {
      ...
      "dependencies": {
        "jugglingdb": "0.2.x",
        "jugglingdb-oracle": "latest"
      },
      ...
    }
    ```

2. Use:

    ```javascript
        var Schema = require('jugglingdb').Schema;
        var schema = new Schema('oracle', {
            host: 'localhost',
            port: 1521,
            username: 'oracle',
            password: 'password',
            database: 'XE',
            debug: false
        });
    ```

## Running tests

    npm test


