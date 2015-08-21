// adopted from: https://github.com/jonschlinkert/gray-matter
// Copyright (c) 2014-2015, Jon Schlinkert (MIT)

var fs = require('fs')
var extend = require('toolz/src/object/extend')
var parsers = require('./lib/parsers')


function matter (str, opts) {
  if (typeof str !== 'string') throw new Error('matter expects a string')

  // default results to build
  var res = {
    // orig: str,
    data: {},
    content: str
  }
  if (str === '') return res

  // delimiters
  var delims = toArray((opts && opts.delims) || '---')
  var a = delims[0]

  // strip byte order marks
  str = stripBom(str)

  // if the first delim isn't the first thing, return
  if (!isFirst(str, a)) return res

  var b = '\n' + (delims[1] || delims[0])
  var alen = a.length

  // if the next character after the first delim
  // is a character in the first delim, then just
  // return the default object. it's either a bad
  // delim or not a delimiter at all.
  if (a.indexOf(str.charAt(alen + 1)) !== -1) return res

  var len = str.length

  // find the index of the next delimiter before
  // going any further. If not found, return.
  var end = str.indexOf(b, alen + 1)
  if (end === -1) end = len

  // detect a language, if defined
  var lang = str.slice(alen, str.indexOf('\n'))
  // measure the lang before trimming whitespace
  var start = alen + lang.length

  var options = opts || {}
  options.lang = options.lang || 'yaml'
  lang = (lang && lang.trim()) || options.lang

  // get the front matter (data) string
  var data = str.slice(start, end).trim()
  if (data) {
    // if data exists, see if we have a matching parser
    var fn = options.parser || parsers[lang]
    if (typeof fn === 'function') res.data = fn(data, options)
    else throw new Error('matter cannot find a parser for: ' + str)
  }

  // grab the content from the string, stripping
  // an optional new line after the second delim
  var con = str.substr(end + b.length)
  if (con.charAt(0) === '\n') con = con.substr(1)

  res.content = con
  return res
}

matter.parsers = parsers
var YAML = matter.parsers.requires.yaml || (matter.parsers.requires.yaml = require('./lib/js-yaml'))

// read a file and parse front matter. Returns the same object as matter()
matter.read = function (fp, opts) {
  var str = fs.readFileSync(fp, 'utf8')
  var obj = matter(str, opts)
  return extend(obj, {path: fp})
}

matter.stringify = function (str, data, opts) {
  var delims = toArray(opts && opts.delims || '---')
  var res = ''
  res += delims[0] + '\n'
  res += YAML.safeDump(data, options)
  res += (delims[1] || delims[0]) + '\n'
  res += str + '\n'
  return res
}

matter.test = function (str, opts) {
  var delims = toArray(opts && opts.delims || '---')
  return isFirst(str, delims[0])
}

function isFirst (str, ch) {
  return str.substr(0, ch.length) === ch
}

function stripBom (str) {
  return str.charAt(0) === '\uFEFF'
    ? str.slice(1)
    : str
}

function toArray (val) {
  return !Array.isArray(val)
    ? [val]
    : val
}

module.exports = matter
