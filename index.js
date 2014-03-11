
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

    var requires = (opt.detective || detective)(source);
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

        var native = natives[id];

        var resolve = opt.resolve(req, parent, function(err, full_path, ignore) {
            if (err) {
                return cb(err);
            }

            if (!full_path) {
                // if resolver ignored the native
                // we just push it manually
                if (native) {
                    result.push({
                        id: id,
                        core: true,
                        // native is deprecated in favor of `core`
                        // kept here for backwards compat
                        native: true
                    });

                    return next();
                }

                // skip the dependency if we can't find it
                if (ignore_missing) {
                    if (typeof ignore_missing === 'function') {
                        ignore_missing(req, parent.filename)
                    }
                    return next();
                }

                return cb(new Error('Cannot find module: \'' + req + '\' ' +
                                    'required from ' + parent.filename));
            }

            // ignore indicates we should not process dependencies for this file
            // this is useful if we don't care about certain files being handled further
            // we still want the dependency added to the deps of the file we processed
            // but do not process this file or it's deps
            if (ignore) {
                result.push({
                    id: id,
                    filename: full_path
                });
                return next();
            }

            var paths = parent.paths.concat(node_module_paths(full_path));

            var new_parent = {
                id: id,
                filename: full_path,
                paths: paths
            }

            from_filename(full_path, new_parent, opt, function(err, deps, src) {
                if (err) {
                    return cb(err);
                }

                var res = {
                    id: id,
                    filename: full_path,
                    deps: deps
                };
                if (opt.includeSource) {
                    res.source = src;
                }
                result.push(res);

                next();
            });
        });
    })();
}

function from_filename(filename, parent, opt, cb) {

    var cache = opt.cache;

    // wtf is this cache?
    // appears to be the list of dependencies for this filename
    // what it really should be is the info
    var cached = cache[filename];
    if (cached) {
        return cb(null, cached.deps, cached.src);
    }

    fs.readFile(filename, 'utf8', function(err, content) {
        if (err) {
            return cb(err);
        }

        // must be set before the compile call to handle circular references
        var result = cache[filename] = { deps: [] };

        try {
            from_source(content, parent, opt, function(err, deps) {
                if (err) {
                    return cb(err);
                }

                result.deps = deps;

                // only cache source if caller will want the source
                if (opt.includeSource) {
                    result.src = content;
                }

                return cb(err, deps, content);
            });
        } catch (err) {
            err.message = filename + ': ' + err.message;
            throw err;
        };
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

    opt = opt || {};
    if (typeof opt === 'function') {
        cb = opt;
        opt = {};
    }

    // add the cache storage
    opt.cache = opt.cache || {};

    // default resolver if none specified just resolves as node would
    opt.resolve = opt.resolve || function(id, parent, cb) {
        // TODO(shtylman) async
        cb(null, lookup_path(id, parent));
    };

    var paths = node_module_paths(filename);

    // entry parent specifies the base node modules path
    var entry_parent = {
        id: filename,
        filename: filename,
        paths: paths
    };

    from_filename(filename, entry_parent, opt, cb);
};

