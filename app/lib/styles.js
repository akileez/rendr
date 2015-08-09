//
//    █████╗ ██╗  ██╗██╗██╗     ███████╗███████╗███████╗
//   ██╔══██╗██║ ██╔╝██║██║     ██╔════╝██╔════╝╚══███╔╝
//   ███████║█████╔╝ ██║██║     █████╗  █████╗    ███╔╝
//   ██╔══██║██╔═██╗ ██║██║     ██╔══╝  ██╔══╝   ███╔╝
//   ██║  ██║██║  ██╗██║███████╗███████╗███████╗███████╗
//   ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚══════╝╚══════╝╚══════╝╚══════╝

// Rendr Requirements
// ///////////////////////////////////////////////////////////////////////////////

var writeFile          = require('fs').writeFile
var readFileSync       = require('fs').readFileSync
var path               = require('path')
var resolve            = require('resolve')
var Less               = require(resolve.sync('less', {basedir: '/usr/local/lib/node_modules'}))
var lessPlugAutoPrefix = require(resolve.sync('less-plugin-autoprefix', {basedir: '/usr/local/lib/node_modules'}))
var lessPlugCssComb    = require(resolve.sync('less-plugin-csscomb', {basedir: '/usr/local/lib/node_modules'}))
var assert             = require('assert')
var isBoolean          = require('toolz/src/lang/isBoolean')
var iterate            = require('toolz/src/async/iterate')
var concurrent         = require('toolz/src/async/concurrent')
var values             = require('toolz/src/object/values')
var pick               = require('toolz/src/object/pick')
var logger             = require('../util/logger')
var getBaseDir         = require('../util/getBaseDir')
var rsync              = require('./support').sync

// LESS engine
// ///////////////////////////////////////////////////////////////////////////////

function stylez (fp, globals, defaults, cb) {
  var ext
  var lineBreaks

  // LESS build configuration
  var env      = globals.BUILD_ENV
  var stage    = globals.BUILD_STAGE

  if (env === 'development') {
    ext = '.css'

    if (stage === 'dev') lineBreaks = 'none'
    else lineBreaks = true

    if (fp) {
      var keys = [getBaseDir(fp)]
    } else {
      var keys = ['development', 'theme', 'vendor', 'bootstrap']
    }

    var files = pick(defaults.LESSfilez, keys)

    // iterate.each(files, function (val, key, done) {
    //   engineLess(val, ext, lineBreaks, defaults.csscomb, function () {
    //     done(null, key)
    //   })
    // }, function (err, res) {
    //   assert.ifError(err)
    //   rsync('static', 'css', defaults, function () {
    //     cb(null, 'stylez')
    //   })
    // })
  } else {
    // For the production environment. Only difference is
    // the extension we use. module handles everything
    // else.
    if (stage === 'test') {
      ext = '.css'
      lineBreaks = true
    } else {
      ext = '-min.css'
      lineBreaks = false
    }

    var files = values(pick(defaults.LESSfilez, 'styles'))


    // engineLess(files, ext, lineBreaks, defaults.csscomb, function () {
    //   rsync('static', 'css', defaults, function () {
    //     cb(null, 'stylez')
    //   })
    // })
  }

  concurrent.each(files, function (val, key, done) {
    engineLess(val, ext, lineBreaks, defaults.csscomb, function () {
      done(null, key)
    })
  }, function (err, res) {
    assert.ifError(err)
    rsync('static', 'css', defaults, function () {
      cb(null, 'stylez')
    })
  })
}

function engineLess (files, ext, lineBreaks, cssCombDefaults, cb) {
  var PLUGINS

  // Autoprefix variables
  var AUTOPREFIXER_BROWSERS = [
    'ie >= 10',
    'ie_mob >= 10',
    'ff >= 30',
    'chrome >= 34',
    'safari >= 7',
    'opera >= 23',
    'ios >= 7',
    'android >= 4.4',
    'bb >= 10'
  ]

  // LESS plugins configuration
  var autoprefix = new lessPlugAutoPrefix({
    browsers: AUTOPREFIXER_BROWSERS
  })

  var ccomb = new lessPlugCssComb(cssCombDefaults)

  PLUGINS = [autoprefix, ccomb]

  files = Array.isArray(files) ? files : [files]

  files.forEach(function (f) {
    var fn = path.basename(f, path.extname(f)) // fn = filename
    var fc = readFileSync(f, 'utf8')        // fc = file content
    Less.render(fc, {
      plugins: PLUGINS
    }, function (err, res) {
      assert.ifError(err)

      if (isBoolean(lineBreaks)) {
        var CleanCSS = require('clean-css')
        var minified = new CleanCSS({
          advanced: false,
          keepBreaks: lineBreaks
        }).minify(res.css).styles

        saveFile(minified, fn, ext, function () {
          return cb()
        })
      } else {
        saveFile(res.css, fn, ext, function () {
          return cb()
        })
      }
    })
  })
}

// write to said destination
function saveFile (io, fn, xx, cb) { // io = input/output fn = filename xx = extension
  return writeFile('assets/css/' + fn + xx, io, function (err) {
    assert.ifError(err)
    logger.msg('assets/css/' + fn + xx, 'generated')
    cb()
  })
}

module.exports = stylez
