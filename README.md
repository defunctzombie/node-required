# required [![Build Status](https://secure.travis-ci.org/defunctzombie/node-required.png)](http://travis-ci.org/defunctzombie/node-required)

Identifies which modules and files your script is using.

## example

```javascript
var required = require('required');

required('/path/to/entry/source/file/js', function(err, deps) {
    // deps is an array of dependency objects
    // see the api section below for a description of the object
});
```

## api

### required(filename, [opt], cb)

Reads the filename and traverses all the dependencies.

The return result to callback is (err, details) where details is an array of dependencies for the file.

Each object in the array takes the following form:

```javascript
{
    // the local name of the require
    // i.e. the string in your "require" statement
    id: 'local-require-name',

    // true if core module (i.e. events, cryto, etc)
    // core modules will not have any deps
    core: true | false

    // full path to the entry file for the module
    // this does not exist for builtin modules
    filename: '/path/to/require/from/project/file.js',

    // an array of the dependencies for the file
    // each object is of the same form as described above
    deps: [
        ...
    ]
},
```

*opt* is an optional options object with the following defaults
```
{
    // if true, then missing modules will be silently ignored.
    // useful if you don't care about some failed requires with native builds.
    // if you pass a function instead of true, the function will be invoked
    // with this signature: `yourFn(missingModuleName, parentSourceFilePath)`,
    // e.g. `ignoreMissing: function(name, parent) { /* ... */ }`
    ignoreMissing: false,

    // if true, include the source contents for each file in the results
    // in a "source" field
    includeSource: false,

    // optional function for required to use when resolving an id
    // function(id, parent, cb);
    // id is the string for the call to require
    // parent is an object describing the calling file { filename: String, paths: [] }
    // callback (err, '/path/to/resolved/file.js' [, ignore])
    // if ignore is true, required will not try to process the resulting path for deps
    resolve: null,

    // optional replacement for builtin detection of requires
    // called with the file source
    detective: null,
}
```

## install

```shell
npm install required
```

## tests

Run tests with ```npm test```

Rebuild the golden files with ```npm run-script test-generate```

Generate a coverage report (requires cover module) ```npm run-script coverage```

