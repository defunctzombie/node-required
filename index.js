
// builtin
var priv_module = require('module');
var natives = process.binding('natives');
var path = require('path');
var fs = require('fs');

// 3rd party
var detective = require('detective');

var cache = {};

function deps(filename, parent, cb) {

    var cached = cache[filename];
    if (cached) {
        return cb(null, cached);
    }

    fs.readFile(filename, 'utf8', function(err, content) {
        if (err) {
            return cb(err);
        }

        var requires = detective(content);
        var result = [];

        cache[filename] = result;

        (function next(err) {
            var req = requires.shift();
            if (!req) {
                return cb(null, result);
            }

            // short require name
            var id = req;

            // for now we just insert the native module into the tree
            // and mark it as 'native'
            // allow for whomever uses us to deal with natives as they wish
            if (is_native(id)) {
                result.push({
                    id: id,
                    native: true
                });

                return next();
            };

            var full_path = lookup_path(req, parent);

            var new_parent = {
                id: id,
                filename: full_path,
                paths: parent.paths
            }

            deps(full_path, new_parent, function(err, details) {
                if (err) {
                    return cb(err);
                }

                result.push({
                    id: id,
                    filename: full_path,
                    deps: details
                });

                next();
            });
        })();
    });
}

/// process filename and callback with tree of dependencies
/// the tree does have circular references when a child requires a parent
module.exports.requires = function(filename, cb) {

    // entry parent specifies the base node modules path
    var entry_parent = {
        paths: priv_module.Module._nodeModulePaths(path.dirname(filename))
    }

    deps(filename, entry_parent, function(err, details) {
        // clear the global cache
        cache = {};
        cb(err, details);
    });
}

/// private
function is_native(name) {
    return natives[name];
}

/// lookup the full path to our module with local name 'name'
function lookup_path(name, parent) {
    var resolved_module = priv_module.Module._resolveLookupPaths(name, parent);
    var paths = resolved_module[1];

    return priv_module.Module._findPath(name, paths);
}
