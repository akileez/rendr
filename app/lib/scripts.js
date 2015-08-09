//
//    █████╗ ██╗  ██╗██╗██╗     ███████╗███████╗███████╗
//   ██╔══██╗██║ ██╔╝██║██║     ██╔════╝██╔════╝╚══███╔╝
//   ███████║█████╔╝ ██║██║     █████╗  █████╗    ███╔╝
//   ██╔══██║██╔═██╗ ██║██║     ██╔══╝  ██╔══╝   ███╔╝
//   ██║  ██║██║  ██╗██║███████╗███████╗███████╗███████╗
//   ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚══════╝╚══════╝╚══════╝╚══════╝

// Rendr JS Requirements
// ///////////////////////////////////////////////////////////////////////////////

var writeFile  = require('fs').writeFile
var concat     = require('toolz/src/file/concat')
var assert     = require('assert')
var isEmpty    = require('toolz/src/lang/isEmpty')
var isBoolean  = require('toolz/src/lang/isBoolean')
var iterate    = require('toolz/src/async/iterate')
var values     = require('toolz/src/object/values')
var pick       = require('toolz/src/object/pick')
var union      = require('toolz/src/array/union')
var logger     = require('../util/logger')
var getBaseDir = require('../util/getBaseDir')
var globby     = require('../src/globby')
var rsync      = require('./support').sync

// var modernizr = require('../nodes/customizr');

// JS settings and env variables
// ///////////////////////////////////////////////////////////////////////////////

function scriptz (fp, globals, defaults, cb) {
  var env      = globals.BUILD_ENV
  var stage    = globals.BUILD_STAGE
  var flag
  var src
  var dest
  var ext

  if (env === 'development') {
    if (stage === 'dev') flag = 'none'
    else flag = false

    if (fp) {
      var keys = [getBaseDir(fp)]
      if (keys == 'views') return cb(null, 'views')

      var globFilez = values(pick(defaults.SCRPTfilez, keys))

      if (keys == 'bootstrap') src = globFilez
      else src = globby.sync(globFilez)

      dest = [defaults.paths.js, '/', keys, '.js'].join('')

      concatenate(src, dest, flag, function () {
        rsync('static', 'js', defaults, function () {
          cb(null, 'scriptz')
        })
      })
    } else {
      var series = defaults.SCRPTfilez

      iterate.each(series, function (val, key, done) {
        if (key === 'bootstrap') src = val
        else src = globby.sync(val)

        dest = [defaults.paths.js, '/', key, '.js'].join('')

        concatenate(src, dest, flag, function () {
          done(null, key)
        })
      }, function (err, res) {
        assert.ifError(err)
        rsync('static', 'js', defaults, function () {
          cb(null, 'scriptz')
        })
      })
    }
  } else {
    if (stage === 'test') {
      flag = false
      ext = '.js'
    } else {
      flag = true
      ext = '-min.js'
    }

    src = union(
      defaults.SCRPTfilez.bootstrap,
      globby.sync(defaults.SCRPTfilez.plugins),
      globby.sync(defaults.SCRPTfilez.libs),
      globby.sync(defaults.SCRPTfilez.theme)
    )

    dest = [defaults.paths.js, '/scripts', ext].join('')

    concatenate(src, dest, flag, function () {
      rsync('static', 'js', defaults, function () {
        cb(null, 'scriptz')
      })
    })
  }
}

function concatenate (src, dest, flag, cb) {
  if (isEmpty(src)) return cb()
  if (isBoolean(flag) && flag === true) {
    var ugly = require('uglify-js')

    return writeFile(dest, ugly.minify(concat.sync(src), {
      fromString: true,
      output: {
        comments: false
      }
    }).code, function (err) {
      assert.ifError(err)
      logger.msg(dest, 'generated')
      cb()
    })
  } else {
    return concat.async(src, dest, function (err) {
      assert.ifError(err)
      logger.msg(dest, 'generated')
      cb()
    })
  }
}

module.exports = scriptz

// // Modernizr process
// // ///////////////////////////////////////////////////////////////////////////////

// function modernizr () {
//   modernizr({
//     "cache" : true,
//     "devFile" : 'scripts/views/configs/modernizr-dev.js',
//     "dest" : 'assets/js/modernizr.js',
//     "options" : [
//         "setClasses",
//         "addTest",
//         "html5printshiv",
//         "testProp",
//         "fnBind"
//     ],
//     "uglify" : false,
//     "tests" : [],
//     "excludeTests": [],
//     "crawl" : true,
//     "useBuffers": false,
//     "files" : {
//         "src": [
//             "assets/{js,css}/*.{js,css}",
//             "!assets/js/modernizr.js"
//         ]
//     },
//     "customTests" : []
//   }, function () {
//     // all done!
//   })
// }
