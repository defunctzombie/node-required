var assert = require('assert');
var required = require('../');

suite('include source');

test('basic', function(done) {
    var opt = {
        includeSource: true
    };

    var entry = __dirname + '/fixtures/one_local.js';

    required(entry, opt, function(err, deps) {
        assert.ifError(err);
        assert.equal(deps.length, 1);
        var dep = deps[0];

        assert.equal(dep.id, './none');
        assert.deepEqual(dep.deps, []);
        assert.equal(dep.source, '// no dependencies\n');

        done();
    });
});

test('same file twice', function(done) {
    var opt = {
        includeSource: true
    };

    var entry = __dirname + '/fixtures/cache_source.js';

    required(entry, opt, function(err, deps) {
        assert.ifError(err);
        assert.equal(deps.length, 2);
        var dep = deps[0];

        assert.equal(dep.id, './one_local');
        assert.deepEqual(dep.deps[0], deps[1]);
        assert.equal(dep.source, '// single local dependency\nrequire(\'./none\');\n');

        dep = deps[1];
        assert.equal(dep.id, './none');
        assert.deepEqual(dep.deps, []);
        assert.equal(dep.source, '// no dependencies\n');

        done();
    });
});

