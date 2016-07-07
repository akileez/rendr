var path = require('path')
var iterate = require('toolz/src/async/iterate').each

// create directory locator for reading in files via helper
function ftree (filenames, namespace, done) {
  var parsed = {}
  var nsp = {}

  iterate(filenames, (val, key, next) => {
    var bname = path.basename(val, path.extname(val))

    parsed[bname] = val
    next(null, key)
  }, (err, res) => {
    nsp[namespace] = parsed
    // config.set(nsp)
    done(null, nsp)
  })
}

module.exports = ftree
