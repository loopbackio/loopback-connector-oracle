## JugglingDB-Oracle 

Oracle adapter for JugglingDB.

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
            database: 'myapp_test',
            username: 'oracle'
            // host: 'localhost',
            // port: 1521,
            // password: s.password,
            // database: 'XE',
            // debug: false
        });
    ```

## Running tests

    npm test


