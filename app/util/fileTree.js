var path = require('path')
var iterate = require('toolz/src/async/iterate')

// create directory locator for reading in files via helper
function ftree (filenames, namespace, cb) {
  var parsed = {}
  var nsp = {}

  iterate.each(filenames, function (val, key, done) {
    var bname = path.basename(val, path.extname(val))

    parsed[bname] = val
    done(null, key)
  }, function (err, res) {
    nsp[namespace] = parsed
    // config.set(nsp)
    cb(null, nsp)
  })
}

module.exports = ftree
