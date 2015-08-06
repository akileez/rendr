// adopted from: https://github.com/doowb/layouts
// Copyright (c) 2014-2015, Jon Schlinkert, Brian Woodward. (MIT)

var get = require('toolz/src/object/get')
var isFalsey = require('toolz/src/lang/isFalsey')
var delims = require('toolz/src/regex/delimiterRegex')

function layouts (str, key, templates, opts, fn) {
  if (typeof str !== 'string') throw new TypeError('layouts expects a string')
  if (typeof opts === 'function') {
    fn = opts
    opts = {}
  }

  opts = opts || {}
  var template = {}
  var prev
  var i = 0
  var res = {options: {}, stack: []}

  while (key && (prev !== key) && (template = templates[key])) {
    var delims = opts.layoutDelims

    // `context` is passed to `interpolate` to resolve templates
    // to the values on the context object.
    var context = {}
    context[opts.tag || 'body'] = str

    // get the context for the layout and push it onto 'stack'
    var obj = {}
    obj.layout = template
    obj.layout.key = key
    obj.before = str
    obj.depth = i++

    str = interpolate(template.content, context, delims)
    obj.after = str

    if (typeof fn === 'function') fn(obj, res, i)

    res.stack.push(obj)
    prev = key
    key = assertLayout(template.layout, opts.defaultLayout)
  }

  res.options = opts
  res.result = str
  return res
}

function assertLayout (value, defaultLayout) {
  if (value === false || (value && isFalsey(value))) return null
  else if (!value || value === true) return defaultLayout || null
  else return value
}

/**
 * Cache compiled regexps to prevent runtime
 * compilation for the same delimiter strings
 * multiple times (this trick can be used for
 * any compiled regex)
 */

var cache = {}

// resolve template strings to the values on the given 'context' object

function interpolate (content, context, syntax) {
  var re = makeDelimiterRegex(syntax)
  return toString(content).replace(re, function(_, $1) {
    if ($1.indexOf('.') !== -1) {
      return toString(get(context, $1.trim()))
    }
    return context[$1.trim()]
  })
}

// Make delimiter regex.

function makeDelimiterRegex (syntax) {
  if (!syntax) return /\{% ([^{}]+?) %}/g
  if (syntax instanceof RegExp) return syntax
  if (typeof syntax === 'string') return new RegExp(syntax, 'g')

  var key = syntax.toString()
  if (cache.hasOwnProperty(key)) return cache[key]
  if (Array.isArray(syntax)) return (cache[syntax] = delims(syntax))
}

function toString (val) {
  return val == null ? '' : val.toString()
}

module.exports = layouts
