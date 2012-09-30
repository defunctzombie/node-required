# required [![Build Status](https://secure.travis-ci.org/shtylman/node-required.png)](http://travis-ci.org/shtylman/node-required)

identifies you what modules/files your script is using

## example

```javascript
var required = require('required');

require('/path/to/entry/source/file/js', function(err, deps) {
    // deps is an array of dependency objects
    // see the api section below for a description of the object
});
```

## api

### required(filename, cb)

Read filename and traverse all of dependencies.

The return result to callback is (err, details) where details is the array of dependencies for your entry file.

Each object in the array takes the following form:

```javascript
{
    // the local name of the require
    // i.e. the string in your "require" statement
    id: 'local-require-name',

    native: // true if a native module (i.e. events, cryto, etc)

    // full path to the entry file for the module
    // doesn't exist for native modules
    filename: '/path/to/require/from/project/file.js',

    // an array of the dependencies for the file
    // each object is of the same form as described above
    // doesn't exist for native modules
    deps: [
        ...
    ]
},
```

## install

```shell
npm install required
```

