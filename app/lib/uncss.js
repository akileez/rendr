var resolve   = require('toolz/src/path/resolve')
var uncss     = require(resolve.sync('uncss', {basedir: '/usr/local/lib/node_modules'}))
var writeFile = require('toolz/src/file/writeFile')
var assert    = require('assert')
var CleanCSS  = require(resolve.sync('clean-css', {basedir: '/usr/local/lib/node_modules'}))

// Uncss
// ///////////////////////////////////////////////////////////////////////////////
function reduceCSS (files, dest, options, lineBreaks, cb) {
  uncss(files, options, function (err, res) {

    var minified = new CleanCSS({
      advanced: false,
      keepBreaks: lineBreaks
    }).minify(res).styles

    // can use saveFile here instead.
    writeFile(dest, minified, function (err) {
      assert.ifError(err)
      return cb()
    })
  })
}

module.exports = reduceCSS
