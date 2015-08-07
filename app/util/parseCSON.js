var resolve = require('resolve')
var cson    = require(resolve.sync('cson', {basedir: '/usr/local/lib/node_modules'}))
var path    = require('path')
var isEmpty = require('toolz/src/lang/isEmpty')
var extend  = require('toolz/src/object/extend')

// configuration data for attaching to options and configuration (global)
function parseCSON (filez, parser, cb) {
  if (typeof parser === 'function') {
    cb = parser
    parser = {}
  }

  var opts = {
    type: 'FILE',
    namespaced: false
  }

  if (!isEmpty(parser)) opts = extend(opts, parser)

  var parsed = {}

  if (opts.namespaced === true) {
    var filename = path.basename(filez, path.extname(filez))

    if (opts.type === 'CS') parsed[filename] = cson.parseCSFile(filez)
    else parsed[filename] = cson.parseFile(filez)

  } else {

    if (opts.type === 'CS') parsed = cson.parseCSFile(filez)
    else parsed = cson.parseFile(filez)
  }

  // opts.set(parsed)
  // jcolz(opts.get())
  return cb(parsed)
}

module.exports = parseCSON
