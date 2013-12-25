var assert = require('assert');
var required = require('../');

suite('ignore missing');

test('basic', function(done) {
    var opt = {
        ignoreMissing: true
    };

    var entry = __dirname + '/fixtures/lib/has_missing_dep.js';

    required(entry, opt, function(err, deps) {
        assert.ifError(err);
        assert.equal(deps.length, 0);
        done();
    });
});


test('with function', function(done) {
    var entry = __dirname + '/fixtures/lib/has_missing_dep.js';

    var called = false;
    function ignoreMissing (req, parent) {
        assert.equal(req, 'hoarders');
        assert.equal(parent, entry);
        called = true;
    }

    var opt = {
        ignoreMissing: ignoreMissing
    };

    required(entry, opt, function(err, deps) {
        assert.ifError(err);
        assert.equal(deps.length, 0);
        assert.equal(called, true);
        done();
    });
});
