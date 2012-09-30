// builtin
var fs = require('fs');
var assert = require('assert');

var cycle = require('cycle');

// local
var required = require('..');

function fix_path(key, value) {
    if (key !== 'filename') {
        return value;
    }

    return value.replace(__dirname + '/fixtures/', '');
}

function add_test(filename) {
    test(filename, function(done) {

        var entry_path = __dirname + '/fixtures/' + filename;
        var dep_path = __dirname + '/fixtures/' + filename + '.dep';

        required(entry_path, function(err, actual) {
            assert.ok(!err, err);

            // decycle for json stringification
            actual = cycle.decycle(actual);

            if (process.env.GENERATE) {
                fs.writeFileSync(dep_path, JSON.stringify(actual, fix_path, '    '), 'utf8');
                return done();
            }

            var expected = JSON.parse(fs.readFileSync(dep_path, 'utf8'));

            // to normalize all paths
            actual = JSON.parse(JSON.stringify(actual, fix_path));

            assert.deepEqual(actual, expected);
            done();
        });
    });
}

fs.readdirSync(__dirname + '/fixtures').forEach(function(fixture) {
    // skip directories and vim swap files
    if (fixture.indexOf('.js') < 0 || fixture.indexOf('.swp') >= 0) {
        return;
    }

    if (fixture.indexOf('.dep') >= 0) {
        return;
    }

    add_test(fixture);
});

