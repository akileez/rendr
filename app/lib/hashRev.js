var writeFile     = require('toolz/src/file/writeFile')
var readFile      = require('toolz/src/file/readFile')
var path          = require('path')
var logger        = require('../util/logger')

function hashRev (files, manifest) {
  files = Array.isArray(files) ? files : [files]

  return files.forEach(function (file) {
    var revision
    var matches
    var original

    revision = readFile(file, 'utf8')
    original = revision

    matches = revision.match(/url\(\s*['"]?([^'"\)]+)['"]?\s*\)/g)
      || revision.match(/(?:src|href)="(\S+)"/g)

    if (!matches) return

    matches.forEach(function (item) {
      var key
      var results = []

      for (key in manifest) {
        // keyName = newKeys(key)
        // mani = newKeys(manifest[key].path)

        results.push(revision = revision.replace(rkey(key), rkey(manifest[key].path)))
      }
      return results
    })

    if (original !== revision) {
      logger.readyEvent('Hash', 'revised', file, '✔')
      // logger.event('Hash', '✔ ' + file, 'changed')
      return writeFile(file, revision)
    }
  })
}

function rkey (fn) {
  return fn.replace('build/', '')
}

module.exports = hashRev
