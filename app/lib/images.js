var exec       = require('child_process').exec
var assert     = require('assert')
var logger     = require('../util/logger')
var iterate    = require('toolz/src/async/iterate')
var isNumber   = require('toolz/src/lang/isNumber')

// Image Compression
// ///////////////////////////////////////////////////////////////////////////////

function crushpng (num, cb) {
  if (!isNumber(num)) num = 1

  logger.info('Starting pngquant ... crushing png images')

  var cmd = ['pngquant -f --ext .png --speed 1 --quality 70-95 *.png']

  iterate.times(num, function (n, done) {
    exec(cmd, {cwd: 'build/assets/img'}, function (err, stdout) {
      assert.ifError(err)
      logger.info('pngquant', 'run done')
      done(null, n)
    })
  }, function (err, res) {
    assert.ifError(err)
    logger.done('pngquant process completed ' + num + ' times.')
    cb(null, 'crushpng')
  })
}

function crushjpg (num, cb) {
  if (!isNumber(num)) num = 1
  // var cmd = ['parallel adept ::: *.jpg', 'parallel adept ::: *.jpeg']

  iterate.times(num, function (n, done) {
    logger.info('Starting jpegoptim ... crushing jpg images')

    var cmd = 'jpegoptim --max=83 --totals --strip-all --all-normal -P *.{jpeg,jpg}'

    exec(cmd, {cwd: 'build/assets/img'}, function (err, stdout) {
      assert.ifError(err)
      console.log(stdout)
      logger.done('Finished jpegoptim')
      done(null, n)
    })
  }, function (err, res) {
    assert.ifError(err)
    logger.done('jpegoptim process completed ' + num + ' times.')
    cb(null, 'crushjpg')
  })
}

function crushsvg (cb) {
  var cmd = 'svgo -f svg'
  exec(cmd, {cwd: 'build/assets/img'}, function (err, stdout) {
    assert.ifError(err)
    console.log(stdout)
    cb(null, 'crushsvg')
  })
}

function crush (cb) {
  logger.info('Starting ImageOptim ... final processing')

  var cmd = ['open -a ImageOptim .']

  exec(cmd, {cwd: 'build/assets/img'}, function (err, stdout) {
    assert.ifError(err)
    console.log(stdout)
    logger.done('Background processing started.')
    cb(null, 'crush')
  })
}

module.exports = {
  png: crushpng,
  jpg: crushjpg,
  svg: crushsvg,
  all: crush
}
