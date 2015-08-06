// adopted from: https://github.com/sindresorhus/globby
// Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (sindresorhus.com) (MIT)

'use strict'

var union = require('toolz/src/array/union')
var extend = require('toolz/src/object/extend')
var toArray = require('toolz/src/lang/toArray')
var concurrent = require('toolz/src/async/concurrent')
var glob = require('glob')

function sortPatterns (patterns) {
  patterns = toArray(patterns)

  var positives = []
  var negatives = []

  patterns.forEach(function (pattern, index) {
    var isNegative = pattern[0] === '!';

    (isNegative ? negatives : positives).push({
      index: index,
      pattern: isNegative ? pattern.slice(1) : pattern
    })
  })

  return {
    positives: positives,
    negatives: negatives
  }
}

function setIgnore (opts, negatives, positiveIndex) {
  opts = extend({}, opts)

  var negativePatterns = negatives
    .filter(function (negative) {
      return negative.index > positiveIndex
    })
    .map(function (negative) {
      return negative.pattern
    })

  opts.ignore = (opts.ignore || []).concat(negativePatterns)
  return opts
}

module.exports = function (patterns, opts, cb) {
  var sortedPatterns = sortPatterns(patterns)

  if (typeof opts === 'function') {
    cb = opts
    opts = {}
  }

  if (sortedPatterns.positives.length === 0) {
    cb(null, [])
    return
  }

  concurrent.parallel(sortedPatterns.positives.map(function (positive) {
    return function (cb2) {
      glob(positive.pattern, setIgnore(opts, sortedPatterns.negatives, positive.index), function (err, paths) {
        if (err) {
          cb2(err)
          return
        }

        cb2(null, paths)
      })
    }
  }), function (err, paths) {
    if (err) {
      cb(err)
      return
    }

    cb(null, union.apply(null, paths))
  })
};

module.exports.sync = function (patterns, opts) {
  var sortedPatterns = sortPatterns(patterns)

  if (sortedPatterns.positives.length === 0) {
    return []
  }

  return sortedPatterns.positives.reduce(function (ret, positive) {
    return union(ret, glob.sync(positive.pattern, setIgnore(opts, sortedPatterns.negatives, positive.index)))
  }, [])
}
