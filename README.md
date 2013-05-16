## JugglingDB-Oracle 

Oracle adapter for JugglingDB.

## Installation

You need to download and install Oracle instant client from the following link:

http://www.oracle.com/technetwork/database/features/instant-client/index-097480.html

Two packages are required:

* Instant Client Package - Basic: All files required to run OCI, OCCI, and JDBC-OCI applications 
* Instant Client Package - SDK: Additional header files and an example makefile for developing Oracle applications with Instant Client

On MacOS or Linux:

    export OCI_HOME=<directory of Oracle instance client>
    export OCI_LIB_DIR=$OCI_HOME
    export OCI_INCLUDE_DIR=$OCI_HOME/sdk/include

On MacOS, you need to create the following symbolic links:

    cd $OCI_LIB_DIR
    ln -s libclntsh.dylib.11.1 libclntsh.dylib
    ln -s libocci.dylib.11.1 libocci.dylib

After that, you will see the links below:

    libclntsh.dylib -> libclntsh.dylib.11.1
    libocci.dylib -> libocci.dylib.11.1


On Windows, you need to set the environment variables:

    OCI_INCLUDE_DIR=<instclient_11_2>\sdk\include
    OCI_LIB_DIR=<instantclient_11_2>\sdk\lib\msvc

And append the OCI path to the PATH environment variable:
    Path=...;<instantclient_11_2>


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


