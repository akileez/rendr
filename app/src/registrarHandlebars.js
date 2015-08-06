// adopted from: https://github.com/shannonmoeller/handlebars-registrar
// Copyright Shannon Moeller <me@shannonmoeller.com> (MIT)

'use strict'

// Requirements
// ///////////////////////////////////////////////////////////////////////////////

var requireGlob = require('./requireGlobFilez')
var pathSepPatterns = /[ \/.-]+/g // matches spaces, forward slashes, dots and hyphens

function extend (target) {
  var arg
  var key
  var len = arguments.length
  var i = 0

  while (++i < len) {
    arg = arguments[i]
    if (!arg) continue

    for (key in arg) {
      if (arg.hasOwnProperty(key)) target[key] = arg[key]
    }
  }
  return target
}

// Utility functions
// ///////////////////////////////////////////////////////////////////////////////

function parseHelperName (file) {
  var shortPath = file && file.shortPath
  return shortPath.replace(pathSepPatterns, '-')
}

function parsePartialName (file) {
  return file && file.shortPath
}

function reducer (obj, file) {
  var handlebars = this.handlebars
  var content = file && file.exports

  if (!content) return obj
  if (typeof content.register === 'function') {
    content.register(handlebars)
    return obj
  }

  switch (typeof content) {
    case 'function' :
      obj[this.keygen(file)] = content
      break
    case 'object'   :
      extend(obj, content)
      break
    // no default
  }
  return obj
}

// Effortless wiring of Handlebars helpers and partials
// ///////////////////////////////////////////////////////////////////////////////

/**
 * @type {Function}
 * @param {Object} [handlebars]                  : Handlebars instance.
 * @param {Object=} [options]                    : Plugin options.
 * @param {Boolean=} [options.bustCache]         : Whether to force the reload of modules by deleting them from the cache.
 * @param {String=} [options.cwd]                : Current working directory. Defaults to `process.cwd()`.
 * @param {Object
 *        |String
 *        |Array.<String>
 *        |Function=} [options.helpers]          : One or more glob strings matching helpers.
 * @param {Function=} [options.parseHelperName]  : Custom name generator for helpers.
 * @param {Function=} [options.helpersReducer]   : Custom reducer for registering helpers.
 * @param {Object
 *        |String
 *        |Array.<String>
 *        |Function=} [options.partials]         : One or more glob strings matching partials.
 * @param {Function=} [options.parsePartialName] : Custom name generator for partials.
 * @param {Function=} [options.partialsReducer]  : Custom reducer for registering partials.
 * @return {Object} Handlebars instance.
 */

function registrar (handlebars, options) {
  options = options || {}

  var helpers = options.helpers
  var partials = options.partials

  // expose handlebars to custom reducers
  options.handlebars = handlebars

  // register helpers
  if (helpers) {
    options.keygen = options.parseHelperName || parseHelperName
    options.reducer = options.helpersReducer || reducer.bind(options)
    helpers = requireGlob.sync(helpers, options)
    handlebars.registerHelper(helpers)
  }

  // register partials
  if (partials) {
    options.keygen = options.parsePartialName || parsePartialName
    options.reducer = options.partialReducer || reducer.bind(options)
    partials = requireGlob.sync(partials, options)
    handlebars.registerPartial(partials)
  }

  return handlebars
}

module.exports = registrar
