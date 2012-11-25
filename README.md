# required [![Build Status](https://secure.travis-ci.org/shtylman/node-required.png)](http://travis-ci.org/shtylman/node-required)

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

The return result to callback is (err, details) where details is and array of dependencies for the file.

Each object in the array takes the following form:

```javascript
{
    // the local name of the require
    // i.e. the string in your "require" statement
    id: 'local-require-name',

    native: // true if a native module (i.e. events, cryto, etc)

    // full path to the entry file for the module
    // this does not exist for native modules
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
    // if true, then missing modules will be silently ignored
    // useful if you don't care about some failed requires with native builds
    ignoreMissing: false;
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

