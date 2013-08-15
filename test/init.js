var Schema = require('loopback-datasource-juggler').Schema;

global.getSchema = function() {
    var db = new Schema(require('../'), {
        host:'127.0.0.1',
        database:'XE',
        username:'test',
        password:'password',
        debug: false
    });
    db.log = function (a) { 
	    // console.log(a); 
    };
    return db;
};
