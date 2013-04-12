## JugglingDB-Oracle 

Oracle adapter for JugglingDB.

## Installation

You need to install Oracle instance client:

http://www.oracle.com/technetwork/database/features/instant-client/index-097480.html

On MacOS or Linux:

    export OCI_HOME=<directory of Oracle instance client>
    export OCI_LIB_DIR=$OCI_HOME
    export OCI_INCLUDE_DIR=$OCI_HOME/sdk/include

On Windows, you need to set the environment variables:

    OCI_INCLUDE_DIR=<instclient_11_2>\sdk\include
    OCI_LIB_DIR=<instantclient_11_2>\sdk\lib\msvc

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


