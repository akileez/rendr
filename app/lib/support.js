//
//    █████╗ ██╗  ██╗██╗██╗     ███████╗███████╗███████╗
//   ██╔══██╗██║ ██╔╝██║██║     ██╔════╝██╔════╝╚══███╔╝
//   ███████║█████╔╝ ██║██║     █████╗  █████╗    ███╔╝
//   ██╔══██║██╔═██╗ ██║██║     ██╔══╝  ██╔══╝   ███╔╝
//   ██║  ██║██║  ██╗██║███████╗███████╗███████╗███████╗
//   ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚══════╝╚══════╝╚══════╝╚══════╝

// Rendr Support Requirements
// ///////////////////////////////////////////////////////////////////////////////

var exec     = require('child_process').exec
var assert   = require('assert')
var mkdirp   = require('mkdirp')
var rimraf   = require('rimraf')
var logger   = require('../util/logger')

// Rsync assets ==> stage to build dir
// ///////////////////////////////////////////////////////////////////////////////

// Rsync - folder syncs between asset staging and asset build directories
// i.e., 'rsync assets/img/ build/assets/img --recursive --delete-before --verbose --update --prune-empty-dirs --exclude=".DS_Store"'

function rsync (src, dest, cb) {
  var rsyncopts =
    '--recursive --delete-before --verbose --update --prune-empty-dirs --exclude=".DS_Store"'

  var cmd = ['rsync', src, dest, rsyncopts].join(' ')

  return mkdirp(dest, function (err) {
    assert.ifError(err)
    exec(cmd, function (err, stdout) {
      assert.ifError(err)
      logger.stage(src, dest)
      console.log(stdout)
      cb(src, dest)
    })
  })
}

function sync (type, key, defs, cb) {
  if (type === 'static') {
    var src = [defs.paths[key], '/'].join('')
    var dest = [defs.destination, '/', defs.paths[key]].join('')
  }

  if (type === 'support') {
    var src = [defs.staticAssets, '/', key, '/'].join('')
    var dest = defs.paths[key]
  }

  rsync(src, dest, function (src, dest) {
    logger.sync('Rsync', 'to', src, dest)
    cb()
  })
}

// Remove Files
// ///////////////////////////////////////////////////////////////////////////////

function clean (files, cb) {
  rimraf(files, function (err) {
    assert.ifError(err)
    // say something
    cb()
  })
}

// Gzip File Compression
// ///////////////////////////////////////////////////////////////////////////////

function compress (cb) {
  var cmd = [
    '/usr/bin/gzip -nkv *.html',
    '/usr/bin/gzip -nkv **/*.{html,css,js}'
  ]
  exec(cmd.join(' && '), {
    cwd: 'build',
    shell: '/usr/local/bin/zsh'
  }, function (err, stdout) {
    assert.ifError(err)
    console.log(stdout)
    cb(null, 'compress')
  })
}

exports.clean = clean
exports.sync = sync
