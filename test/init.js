var Schema = require('jugglingdb').Schema;

global.getSchema = function() {
    var db = new Schema(require('../'), {
        host:'166.78.158.45',
        database:'XE',
        username:'strongloop',
        password:'str0ng100pjs',
        debug: true
    });
    db.log = function (a) { console.log(a); };
    return db;
};
