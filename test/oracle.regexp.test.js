// Copyright IBM Corp. 2017,2019. All Rights Reserved.
// Node module: loopback-connector-oracle
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';

/* global getDataSource */
const async = require('async');

require('./init/init');
const should = require('should');
let db, User;

describe('regexp', function() {
  db = getDataSource();

  const User = db.define('UserRegExp', {
    seq: {type: Number, index: true},
    name: {type: String, index: true, sort: true},
    email: {type: String, index: true},
  });

  before(seed);

  it('should work when a regex is provided without the regexp operator',
    function(done) {
      User.find({where: {name: /John.*/i}}, function(err, users) {
        should.not.exist(err);
        users.length.should.equal(1);
        users[0].name.should.equal('John Lennon');
        done();
      });
    });

  it('should work when a regex is case insensitive',
    function(done) {
      User.find({where: {name: /JOHN.*/i}}, function(err, users) {
        should.not.exist(err);
        users.length.should.equal(1);
        users[0].name.should.equal('John Lennon');
        done();
      });
    });

  it('should work when a regex is case sensitive',
    function(done) {
      User.find({where: {name: /JOHN.*/}}, function(err, users) {
        should.not.exist(err);
        users.length.should.equal(0);
        done();
      });
    });

  it('should support the regexp operator with regex strings', function(done) {
    User.find({where: {name: {regexp: '^J'}}}, function(err, users) {
      should.not.exist(err);
      users.length.should.equal(1);
      users[0].name.should.equal('John Lennon');
      done();
    });
  });

  it('should support the regexp operator with regex literals', function(done) {
    User.find({where: {name: {regexp: /^J/}}}, function(err, users) {
      should.not.exist(err);
      users.length.should.equal(1);
      users[0].name.should.equal('John Lennon');
      done();
    });
  });

  it('should support the regexp operator with regex objects', function(done) {
    User.find({where: {name: {regexp: new RegExp(/^J/)}}}, function(err,
      users) {
      should.not.exist(err);
      users.length.should.equal(1);
      users[0].name.should.equal('John Lennon');
      done();
    });
  });

  function seed(done) {
    const beatles = [
      {
        seq: 0,
        name: 'John Lennon',
        email: 'john@b3atl3s.co.uk',
      },
      {
        seq: 1,
        name: 'Paul McCartney',
        email: 'paul@b3atl3s.co.uk',
      },
      {seq: 2, name: 'George Harrison'},
      {seq: 3, name: 'Ringo Starr'},
      {seq: 4, name: 'Pete Best'},
      {seq: 5, name: 'Stuart Sutcliffe'},
    ];

    async.series([
      function(cb) {
        db.automigrate('UserRegExp', cb);
      },
      function(cb) {
        async.each(beatles, User.create.bind(User), cb);
      },
    ], done);
  }
});

