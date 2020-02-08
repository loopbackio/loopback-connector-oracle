// Copyright IBM Corp. 2013,2019. All Rights Reserved.
// Node module: loopback-connector-oracle
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';

/* global getDataSource */
const juggler = require('loopback-datasource-juggler');
const CreateDS = juggler.DataSource;

require('./init/init');
const should = require('should');
let Post, db;

describe('oracle connector', function() {
  before(function() {
    db = getDataSource();

    Post = db.define('PostWithBoolean', {
      title: {type: String, length: 255, index: true},
      content: {type: String},
      approved: Boolean,
    });
  });

  it('should run migration', function(done) {
    db.automigrate('PostWithBoolean', function() {
      done();
    });
  });

  let post;
  it('should support boolean types with true value', function(done) {
    Post.create({title: 'T1', content: 'C1', approved: true}, function(err, p) {
      should.not.exists(err);
      post = p;
      Post.findById(p.id, function(err, p) {
        should.not.exists(err);
        p.should.have.property('approved', true);
        done();
      });
    });
  });

  it('should support updating boolean types with false value', function(done) {
    Post.update({id: post.id}, {approved: false}, function(err) {
      should.not.exists(err);
      Post.findById(post.id, function(err, p) {
        should.not.exists(err);
        p.should.have.property('approved', false);
        done();
      });
    });
  });

  it('should support boolean types with false value', function(done) {
    Post.create({title: 'T2', content: 'C2', approved: false},
      function(err, p) {
        should.not.exists(err);
        post = p;
        Post.findById(p.id, function(err, p) {
          should.not.exists(err);
          p.should.have.property('approved', false);
          done();
        });
      });
  });

  it('should return the model instance for upsert', function(done) {
    Post.upsert({id: post.id, title: 'T2_new', content: 'C2_new',
      approved: true}, function(err, p) {
      p.should.have.property('id', post.id);
      p.should.have.property('title', 'T2_new');
      p.should.have.property('content', 'C2_new');
      p.should.have.property('approved', true);
      done();
    });
  });

  it('should return the model instance for upsert when id is not present',
    function(done) {
      Post.upsert({title: 'T2_new', content: 'C2_new', approved: true},
        function(err, p) {
          p.should.have.property('id');
          p.should.have.property('title', 'T2_new');
          p.should.have.property('content', 'C2_new');
          p.should.have.property('approved', true);
          done();
        });
    });

  it('should escape number values to defect SQL injection in findById',
    function(done) {
      Post.findById('(SELECT 1+1)', function(err, p) {
        should.exists(err);
        done();
      });
    });

  it('should escape number values to defect SQL injection in find',
    function(done) {
      Post.find({where: {id: '(SELECT 1+1)'}}, function(err, p) {
        should.exists(err);
        done();
      });
    });

  it('should escape number values to defect SQL injection in find with gt',
    function(done) {
      Post.find({where: {id: {gt: '(SELECT 1+1)'}}}, function(err, p) {
        should.exists(err);
        done();
      });
    });

  it('should escape number values to defect SQL injection in find ',
    function(done) {
      Post.find({limit: '(SELECT 1+1)'}, function(err, p) {
        should.exists(err);
        done();
      });
    });

  it('should escape number values to defect SQL injection in find with inq',
    function(done) {
      Post.find({where: {id: {inq: ['(SELECT 1+1)']}}}, function(err, p) {
        should.exists(err);
        done();
      });
    });
});

describe('lazyConnect', function() {
  it('should skip connect phase (lazyConnect = true)', function(done) {
    const dsConfig = {
      host: '127.0.0.1',
      port: 4,
      lazyConnect: true,
      debug: false,
    };
    const ds = getDS(dsConfig);

    const errTimeout = setTimeout(function() {
      done();
    }, 2000);
    ds.on('error', function(err) {
      clearTimeout(errTimeout);
      done(err);
    });
  });

  it('should report connection error (lazyConnect = false)', function(done) {
    const dsConfig = {
      host: '127.0.0.1',
      port: 4,
      lazyConnect: false,
      debug: false,
      username: 'user',
    };
    const ds = getDS(dsConfig);

    ds.on('error', function(err) {
      err.message.should.containEql('TNS');
      done();
    });
  });

  const getDS = function(config) {
    const db = new CreateDS(require('../'), config);
    return db;
  };
});

