// adopted from: https://github.com/allbitsnbytes/asset_hash
// Copyright (c) 2015 Maxwell Berkel maxwell@allbitsnbytes.com (MIT)

var crypto = require('crypto')
var fs = require('fs')
var glob = require('glob')
var path = require('path')
var isString = require('toolz/src/lang/isString')
var isUndefined = require('toolz/src/lang/isUndefined')
var interpolate = require('toolz/src/string/interpolate')
var extend = require('toolz/src/object/extend')
var isObjectLike = require('toolz/src/lang/isObjectLike')
var clone = require('toolz/src/lang/clone')
var isArray = require('toolz/src/lang/isArray')

var AssetHash = function () {
  var assets = {}
  var config = {}
  config.hasher = 'md5'
  config.length = 10
  config.replace = true
  config.manifest = 'hash.json'
  config.base = '.'
  config.path = '.'
  config.save = true
  config.template = '{{name}}-{{hash}}.{{ext}}'

  function isFile (file) {
    return !isString(file) && !isUndefined(file.path) && !isUndefined(file.contents)
      ? true
      : false
  }

  function generateHash (contents, hash, length) {
    if (contents) {
      return crypto
        .createHash(hash)
        .update(contents)
        .digest('hex')
        .slice(0, length)
    }
    return ''
  }

  function hashFile (file, options) {
    var contents = ''
    var filePath = ''
    var patterns = []

    if (isFile(file)) {
      contents = Buffer.isBuffer(file.contents) ? file.contents.toString() : file.contents
      filePath = path.relative(options.base, file.path)
    } else {
      contents = fs.readFileSync(file)
      filePath = path.relative(options.base, file)
    }

    var ext = path.extname(filePath)
    var name = path.basename(filePath, ext)
    var dirPath = path.dirname(filePath)
    var hash = generateHash(contents, options.hasher, options.length)
    var result = {
      hashed: false,
      original: filePath,
      hash: hash,
      type: ext.replace('.', '')
    }

    if (hash !== '') {
      result.hashed = true
      result.path = path.relative(options.base, path.join(dirPath, interpolate(options.template, {
        name: name,
        hash: hash,
        ext: ext.replace('.', '')
      })))

      patterns.push(path.join(dirPath, interpolate(options.template, {
        name: name,
        hash: '=HASHREGEX=',
        ext: ext.replace('.', '')
      })).replace('=HASHREGEX=', '[0-9a-zA-Z_-]'))

      hashedOldFiles = glob.sync(patterns.join('|'))

      hashedOldFiles.forEach(function (filePath) {
        fs.unlinkSync(filePath)
      })

      if (options.save) {
        fs.createReadStream(result.original).pipe(fs.createWriteStream(result.path))
      }

      if (options.replace) {
        fs.unlinkSync(result.original)
      }

      assets[result.original] = result
    }

    return result
  }

  return {
    set: function (options) {
      extend(config, options)
    },

    get: function (key) {
      if (isUndefined(key)) return config

      return config.hasOwnProperty(key)
        ? config[key]
        : ''
    },

    hashFiles: function (paths, options) {
      var curConfig = clone(config)
      var results = []

      extend(curConfig, options)

      if (!isArray(paths)) paths = [paths]

      paths.forEach(function (filePaths) {
        if (isString(filePaths)) {
          filePaths = glob.sync(filePaths)

          filePaths.forEach(function (filePath) {
            fileInfo = fs.lstatSync(filePath)

            if (fileInfo.isDirectory()) {
              dirFiles = fs.readdirSync(filePath)

              dirFiles.forEach(function (dirFile) {
                var currPath = path.join(filePath, dirFile)
                var currFileInfo = fs.lstatSync(currPath)

                if (currFileInfo.isDirectory()) {
                  results = results.concat(hashFiles(currPath, options))
                } else if (currFileInfo.isFile()) {
                  results.push(hashFile(currPath, curConfig))
                }
              })
            } else if (fileInfo.isFile()) {
              results.push(hashFile(filePath, curConfig))
            }
          })
        } else {
          results.push(hashFile(filePaths, curConfig))
        }
      })

      return results.length > 1
        ? results
        : results.shift()
    },

    getAssets: function () {
      return assets
    },

    getAssetFile: function (file) {
      return isObjectLike(assets[file])
        ? assets[file.path]
        : file
    },

    updateAsset: function (file, data) {
      if (isObjectLike(assets[file]) && isObjectLike(data)) {
        extend(assets[file], data)
      }
    },

    resetAssets: function () {
      return (assets = {})
    },

    saveManifest: function (options) {
      var curConfig = clone(config)
      extend(curConfig, options)

      if (curConfig.manifest !== false && curConfig.manifest !== null)
        fs.writeFileSync(path.join(curConfig.path, curConfig.manifest), JSON.stringify(assets))
    },

    getHashers: function () {
      return crypto.getHashes()
    }
  }
}

module.exports = AssetHash()
