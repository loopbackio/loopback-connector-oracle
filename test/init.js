var Schema = require('jugglingdb').Schema;

global.getSchema = function() {
    var db = new Schema(require('../'), {
        host:'127.0.0.1',
        database:'XE',
        username:'strongloop',
        password:'password'
    });
    db.log = function (a) { console.log(a); };
    return db;
};
