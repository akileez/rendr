var path = require('path')

function getBaseDir (fn, option) {
  if (option === 'self') return path.basename(fn, path.extname(fn))
  if (option === 'path') return path.dirname(fn).split(path.sep).slice(0, 2).join('/')

  var self = path.dirname(fn).split(path.sep).slice(1)[0]
  return self !== undefined
    ? self
    : path.basename(fn, path.extname(fn))
}

module.exports = getBaseDir
