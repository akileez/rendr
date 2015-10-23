var clrz = require('colorz')
var dateFormat = require('toolz/src/date/dateFormat')
var log = require('toolz/src/time/logger')
var clog        = console.log.bind(console)

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
      'File',
      dim(blk(name)),
      action
    )
  },

  msg: function (obj, verb) {
    log(
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
    clog('')
    clog(dim(blk('---------------------------------------')))
    clog(grn('  BUILD_ENV   : '), mag(globals.BUILD_ENV))
    clog(grn('  BUILD_STAGE : '), mag(globals.BUILD_STAGE))
    clog(grn('  RUNNING_JOB : '), mag(argv.argv))
    clog(dim(blk('---------------------------------------')))
    clog('')
  },

  jobsDisplay: function () {
    var arr = [
      [yel('Jobs'), grn('config:'), dim(blk('--type=globals Display initial global configuration'))],
      [yel('Jobs'), grn('config:'), dim(blk('--type=defaults Display initial default options'))],
      [yel('Jobs'), grn('jobs:'), dim(blk('Display listing of all jobs'))],
      [yel('Jobs'), grn('rendr:'), dim(blk('Default job. Render templates. Nothing else'))],
      [yel('Jobs'), grn('init:'), dim(blk('Clean staging and build directories, generate all support files, rendr templates.'))],
      [yel('Jobs'), grn('dist:'), dim(blk('distribution process'))],
      [yel('Jobs'), grn('uncss:'), dim(blk('reduce size of css'))],
      [yel('Jobs'), grn('clean:'), dim(blk('remove files from staging directory'))]
    ]
    arr.forEach(function (key, idx, arr) {
      log(key[0], key[1], '\t', key[2])
    })
  },

  info: function (predicate, subject) {
    if (typeof subject === 'undefined') subject = ''
    log(
      grn('Info'),
      dim(blk(predicate)),
      mag(subject)
    )
  },

  done: function (noun, verb) {
    log(
      red('Done'),
      blu(verb),
      grn(noun)
    )
  },

  stage: function (src, dest) {
    log(
      grn('Info'),
      blu('Staging'),
      gry(src),
      blu('to'),
      gry(dest)
    )
  },

  sync: function (noun, verb, src, dest) {
    log(
      red('Done'),
      blu(noun),
      grn(src),
      blu(verb),
      grn(dest),
      blu('complete')
    )
  },

  changed: function (file) {
    log('File', grn(file), 'has been changed')
  },

  event: function (str1, obj, str2) {
    log(
      str1,
      grn(obj),
      str2
    )
  },

  ready: function (action, task) {
    log(
      yel('Info'),
      dim(blk(action)),
      dim(blk('[')),
      grn(task),
      dim(blk(']'))
    )
  },

  readyEvent: function (msg, action, obj, marker) {
    log(
      yel(msg),
      cyn(marker),
      dim(blk(action)),
      dim(blk('[')),
      grn(obj),
      dim(blk(']'))
    )
  },

  datetime: function (format) {
    clog('');
    clog(blu(dateFormat(format || 'now'))) // .format('dddd, MMMM Do YYYY, h:mm:ss A [GMT]Z')
  }
}
