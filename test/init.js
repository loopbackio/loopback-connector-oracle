var Schema = require('loopback-datasource-juggler').Schema;

global.getSchema = function() {
    var db = new Schema(require('../'), {
        host:'166.78.158.45',
        database:'XE',
        username:'test',
        password:'str0ng100pjs',
        debug: false
    });
    db.log = function (a) { 
	    // console.log(a); 
    };
    return db;
};
