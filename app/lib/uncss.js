var resolve  = require('resolve')
var uncss    = require(resolve.sync('uncss', {basedir: '/usr/local/lib/node_modules'}))
var fs       = require('fs')
var assert   = require('assert')
var CleanCSS = require('clean-css')

// Uncss
// ///////////////////////////////////////////////////////////////////////////////
function reduceCSS (files, dest, options, lineBreaks, cb) {
  uncss(files, options, function (err, res) {

    var minified = new CleanCSS({
      advanced: false,
      keepBreaks: lineBreaks
    }).minify(res).styles

    // can use saveFile here instead.
    fs.writeFile(dest, minified, function (err) {
      assert.ifError(err)
      return cb()
    })
  })
}

module.exports = reduceCSS
