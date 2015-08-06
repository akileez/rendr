// adopted from: https://github.com/jonschlinkert/gray-matter
// Copyright (c) 2014-2015, Jon Schlinkert (MIT)

var extend = require('toolz/src/object/extend')
var clrz = require('colorz')

var parser = module.exports
parser.requires = {}

parser.yaml = function (str, opts) {
  var options = extend({strict: false, safeLoad: false}, opts)
  try {
    var YAML = parser.requires.yaml || (parser.requires.yaml = require('./js-yaml'))
    return options.safeLoad ? YAML.safeLoad(str, opts) : YAML.load(str, opts)
  } catch (err) {
    if (options.strict) throw new SyntaxError(msg('js-yaml', err))
    else return {}
  }
}

parser.json = function (str, opts) {
  var options = extend({strict: false}, opts)
  try {
    return JSON.parse(str)
  } catch (err) {
    if (options.strict) throw new SyntaxError(msg('JSON', err))
    else return {}
  }
}

parser.javascript = function (str, opts) {
  var options = extend({wrapped: true, eval: false, strict: false}, opts)
  if (options.eval) {
    if (options.wrapped) str = 'function data() {return {' + str + '} } data()'
    try {
      return eval(str)
    } catch (err) {
      throw new SyntaxError(msg('javascript', err))
    }
    return {}
  } else {
    if (options.strict) throw new Error(evalError('javascript'))
    else console.error(evalError('javascript', true))
  }
}

parser.js = parser.javascript

function msg (lang, err) {
  return 'matter parser [' + lang + ']: ' + err
}

function evalError (lang, color) {
  var msg = '[matter]: to parse ' + lang + ' set `options.eval` to `true`'
  return color ? clrz.red(msg) : msg
}
