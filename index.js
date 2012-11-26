
// builtin
var priv_module = require('module');
var natives = process.binding('natives');
var path = require('path');
var fs = require('fs');

// 3rd party
var detective = require('detective');

// inspect the source for dependencies
function from_source(source, parent, opt, cb) {

    var cache = opt.cache;
    var ignore_missing = false || opt.ignoreMissing;

    var requires = detective(source);
    var result = [];

    // deduplicate requires with the same name
    // this avoids trying to process the require twice
    requires = requires.filter(function(elem, idx) {
        return requires.indexOf(elem) === idx;
    });

    (function next() {
        var req = requires.shift();
        if (!req) {
            return cb(null, result);
        }

        // short require name
        var id = req;

        // for now we just insert the native module into the tree
        // and mark it as 'native'
        // allow for whomever uses us to deal with natives as they wish
        var native = natives[id];
        if (native) {

            // natives are cached by id
            if (cache[id]) {
                result.push(cache[id]);
                return next();
            }

            // cache before calling compile to handle circular references
            var res = cache[id] = {
                id: id,
                native: true
            };

            result.push(res);

            from_source(native, parent, opt, function(err, details) {
                if (err) {
                    return cb(err);
                }

                res.deps = details;
                next();
            });

            return;
        };

        var full_path = lookup_path(req, parent);
        if (!full_path) {
            // skip the dependency if we can't find it
            if (ignore_missing) {
                return next();
            }

            return cb(new Error('Cannot find module: \'' + req + '\' ' +
                                'required from ' + parent.filename));
        }

        var paths = parent.paths.concat(node_module_paths(full_path));

        var new_parent = {
            id: id,
            filename: full_path,
            paths: paths
        }

        from_filename(full_path, new_parent, opt, function(err, deps) {
            if (err) {
                return cb(err);
            }

            result.push({
                id: id,
                filename: full_path,
                deps: deps
            });

            next();
        });
    })();
}

function from_filename(filename, parent, opt, cb) {

    var cache = opt.cache;

    var cached = cache[filename];
    if (cached) {
        return cb(null, cached);
    }

    fs.readFile(filename, 'utf8', function(err, content) {
        if (err) {
            return cb(err);
        }

        // must be set before the compile call to handle circular references
        var result = cache[filename] = [];

        from_source(content, parent, opt, function(err, deps) {
            if (err) {
                return cb(err);
            }

            // push onto the result set so circular references are populated
            result.push.apply(result, deps);
            return cb(err, result);
        });
    });
}

/// lookup the full path to our module with local name 'name'
function lookup_path(name, parent) {
    var resolved_module = priv_module.Module._resolveLookupPaths(name, parent);
    var paths = resolved_module[1];

    return priv_module.Module._findPath(name, paths);
}

/// return an array of node_module paths given a filename
function node_module_paths(filename) {
    return priv_module.Module._nodeModulePaths(path.dirname(filename));
}

/// process filename and callback with tree of dependencies
/// the tree does have circular references when a child requires a parent
module.exports = function(filename, opt, cb) {

    if (typeof opt === 'function') {
        cb = opt;
        opt = {};
    }

    // add the cache storage
    opt.cache = {};

    var paths = node_module_paths(filename);

    // entry parent specifies the base node modules path
    var entry_parent = {
        id: filename,
        filename: filename,
        paths: paths
    };

    from_filename(filename, entry_parent, opt, cb);
};

