var assert = require('assert');
var ds, Note;

before(function (done) {
  ds = getDataSource();
  var schema =
  {
    "name": "ClobTest",
    "options": {
      "oracle": {
        "schema": "TEST",
        "table": "CLOB_TEST"
      }
    },
    "properties": {
      "note": {
        "type": "String",
        oracle: {
          "dataType": "CLOB"
        }
      }
    }
  };

  Note = ds.createModel(schema.name, schema.properties, schema.options);
  ds.automigrate(done);
});

function generateString(size, char) {
  var str = '';
  for (var i = 0; i < size; i++) {
    str += (char || 'A');
  }
  return str;
}

describe('Oracle connector', function () {
  it('should support clob size < 4000 chars', function (done) {

    var clob = generateString(1000, 'A');
    Note.create({note: clob}, function (err, note) {
      assert(!err);
      Note.findById(note.id, function (err, note) {
        assert(!err);
        assert.equal(note.note, clob);
        done(err);
      });
    });
  });

  it('should support clob size < 32k chars', function (done) {

    var clob = generateString(32000, 'B');
    Note.create({note: clob}, function (err, note) {
      assert(!err);
      Note.findById(note.id, function (err, note) {
        assert(!err);
        assert.equal(note.note, clob);
        done(err);
      });
    });
  });

  it('should support clob size > 32k chars', function (done) {

    var clob = generateString(50000, 'C');
    Note.create({note: clob}, function (err, note) {
      assert(!err);
      Note.findById(note.id, function (err, note) {
        assert(!err);
        assert.equal(note.note, clob);
        done(err);
      });
    });
  });

});

