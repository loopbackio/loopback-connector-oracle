require('jugglingdb/test/common.batch.js');
require('jugglingdb/test/include.test.js');

return;

test.it('should not generate malformed SQL for number columns set to empty string', function (test) {
    var Post = schema.define('posts', {
        title: { type: String }
        , userId: { type: Number }
    });
    var post = new Post({title:'no userId', userId:''});

    Post.destroyAll(function () {
        post.save(function (err, post) {
            var id = post.id
            Post.all({where:{title:'no userId'}}, function (err, post) {
                test.ok(!err);
                test.ok(post[0].id == id);
                test.done();
            });
        });
    });
});

test.it('all should support regex', function (test) {
    Post = schema.models.Post;

    Post.destroyAll(function () {
        Post.create({title:'Oracle Test Title'}, function (err, post) {
            var id = post.id
            Post.all({where:{title:/^Oracle/}}, function (err, post) {
                test.ok(!err);
                test.ok(post[0].id == id);
                test.done();
            });
        });
    });
});

test.it('all should support arbitrary expressions', function (test) {
    Post.destroyAll(function () {
        Post.create({title:'Oracle Test Title'}, function (err, post) {
            var id = post.id
            Post.all({where:{title:{ilike:'postgres%'}}}, function (err, post) {
                test.ok(!err);
                test.ok(post[0].id == id);
                test.done();
            });
        });
    });
})

test.it('all should support like operator ', function (test) {
    Post = schema.models.Post;
    Post.destroyAll(function () {
        Post.create({title:'Oracle Test Title'}, function (err, post) {
            var id = post.id
            Post.all({where:{title:{like:'%Test%'}}}, function (err, post) {
                test.ok(!err);
                test.ok(post[0].id == id);
                test.done();
            });
        });
    });
});

test.it('all should support \'not like\' operator ', function (test) {
    Post = schema.models.Post;
    Post.destroyAll(function () {
        Post.create({title:'Oracle Test Title'}, function (err, post) {
            var id = post.id
            Post.all({where:{title:{nlike:'%Test%'}}}, function (err, post) {
                test.ok(!err);
                test.ok(post.length===0);
                test.done();
            });
        });
    });
});

test.it('all should support arbitrary where clauses', function (test) {
    Post = schema.models.Post;
    Post.destroyAll(function () {
        Post.create({title:'Oracle Test Title'}, function (err, post) {
            var id = post.id;
            Post.all({where:"title = 'Oracle Test Title'"}, function (err, post) {
                test.ok(!err);
                test.ok(post[0].id == id);
                test.done();
            });
        });
    });
});

test.it('all should support arbitrary parameterized where clauses', function (test) {
    Post = schema.models.Post;
    Post.destroyAll(function () {
        Post.create({title:'Oracle Test Title'}, function (err, post) {
            var id = post.id;
            Post.all({where:['title = ?', 'Oracle Test Title']}, function (err, post) {
                test.ok(!err);
                test.ok(post[0].id == id);
                test.done();
            });
        });
    });
});
