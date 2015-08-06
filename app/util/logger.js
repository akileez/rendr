var clrz = require('colorz')
var dateFormat = require('toolz/src/date/dateFormat')
var log        = console.log.bind(console)

// clrz settings for colorized output
var blk = clrz.black
var dim = clrz.dim
var blu = process.platform === 'win32' ? clrz.cyan : clrz.blue
var mag = clrz.magenta
var yel = clrz.yellow
var red = clrz.red
var grn = clrz.green
var gry = clrz.grey
var cyn = clrz.cyan


module.exports = {
  file: function (name, action) {
    log(
      mag(dateFormat('logStamp')),
      'File',
      dim(blk(name)),
      action
    )
  },

  msg: function (obj, verb) {
    log(
      mag(dateFormat('logStamp')),
      grn('File'),
      dim(blk(obj)),
      verb
    )
  },

  keys: function (label, obj) {
    obj = obj || {}

    var keys = Object
      .keys(obj)
      .sort()
      .join(' ')

    console.log(
      clrz.magenta(label),
      clrz.grey('->'),
      clrz.green(keys)
    )
  },

  infoDisplay: function (globals, argv) {
    log('')
    log(dim(blk('---------------------------------------')))
    log(grn('  BUILD_ENV   : '), mag(globals.BUILD_ENV))
    log(grn('  BUILD_STAGE : '), mag(globals.BUILD_STAGE))
    log(grn('  RUNNING_JOB : '), mag(argv.argv))
    log(dim(blk('---------------------------------------')))
    log('')
  },

  jobsDisplay: function () {
    log(mag(dateFormat('logStamp')), yel('Jobs'), grn('globals:'), dim(blk('Display initial global configuration')))
    log(mag(dateFormat('logStamp')), yel('Jobs'), grn('defaults:'), dim(blk('Display initial default options')))
    log(mag(dateFormat('logStamp')), yel('Jobs'), grn('jobs:'), dim(blk('Display listing of all jobs')))
    log(mag(dateFormat('logStamp')), yel('Jobs'), grn('rendr:'), dim(blk('Default job. Render templates. Nothing else')))
    log(mag(dateFormat('logStamp')), yel('Jobs'), grn('init:'), dim(blk('Clean staging and build directories, generate all support files, rendr templates.')))
    log(mag(dateFormat('logStamp')), yel('Jobs'), grn('dist:'), dim(blk('distribution process')))
    log(mag(dateFormat('logStamp')), yel('Jobs'), grn('uncss:'), dim(blk('reduce size of css')))
    log(mag(dateFormat('logStamp')), yel('Jobs'), grn('clean:'), dim(blk('remove files from staging directory')))
  },

  info: function (predicate, subject) {
    if (typeof subject === 'undefined') subject = ''
    log(
      mag(dateFormat('logStamp')),
      grn('Info'),
      dim(blk(predicate)),
      mag(subject)
    )
  },

  done: function (noun, verb) {
    log(
      mag(dateFormat('logStamp')),
      red('Done'),
      blu(verb),
      grn(noun)
    )
  },

  stage: function (src, dest) {
    log(
      mag(dateFormat('logStamp')),
      grn('Info'),
      blu('Staging'),
      gry(src),
      blu('to'),
      gry(dest)
    )
  },

  sync: function (noun, verb, src, dest) {
    log(
      mag(dateFormat('logStamp')),
      red('Done'),
      blu(noun),
      grn(src),
      blu(verb),
      grn(dest),
      blu('complete')
    )
  },

  changed: function (file) {
    log(mag(dateFormat('logStamp')), 'File', grn(file), 'has been changed')
  },

  event: function (str1, obj, str2) {
    log(
      mag(dateFormat('logStamp')),
      str1,
      grn(obj),
      str2
    )
  },

  ready: function (action, task) {
    log(
      mag(dateFormat('logStamp')),
      yel('Info'),
      dim(blk(action)),
      dim(blk('[')),
      grn(task),
      dim(blk(']'))
    )
  },

  readyEvent: function (msg, action, obj, marker) {
    log(
      mag(dateFormat('logStamp')),
      yel(msg),
      cyn(marker),
      dim(blk(action)),
      dim(blk('[')),
      grn(obj),
      dim(blk(']'))
    )
  },

  datetime: function (format) {
    log('');
    log(blu(dateFormat(format || 'now'))) // .format('dddd, MMMM Do YYYY, h:mm:ss A [GMT]Z')
  }
}