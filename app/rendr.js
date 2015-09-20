//
//    █████╗ ██╗  ██╗██╗██╗     ███████╗███████╗███████╗
//   ██╔══██╗██║ ██╔╝██║██║     ██╔════╝██╔════╝╚══███╔╝
//   ███████║█████╔╝ ██║██║     █████╗  █████╗    ███╔╝
//   ██╔══██║██╔═██╗ ██║██║     ██╔══╝  ██╔══╝   ███╔╝
//   ██║  ██║██║  ██╗██║███████╗███████╗███████╗███████╗
//   ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚══════╝╚══════╝╚══════╝╚══════╝

// Rendr Requirements
// ///////////////////////////////////////////////////////////////////////////////

var extend        = require('toolz/src/object/extend')
var dateFormat    = require('toolz/src/date/dateFormat')
var isNullOrUndef = require('toolz/src/lang/isNullOrUndef')
var iterate       = require('toolz/src/async/iterate')
var concurrent    = require('toolz/src/async/concurrent')
var writeFile     = require('toolz/src/file/writeFile')
var segments      = require('toolz/src/path/segments')
var Map           = require('toolz/src/cache/map')
var layouts       = require('./src/layouts')
var parsefm       = require('parse-yuf')
var handlebars    = require('handlebars')
var resolve       = require('resolve')
var prettify      = require(resolve.sync('js-beautify', {basedir: '/usr/local/lib/node_modules'})).html
var path          = require('path')
var assert        = require('assert')
var logger        = require('./util/logger')

var cache         = new Map()
var frontin       = new Map()
var stackin       = new Map()

// Rendr Process
// ///////////////////////////////////////////////////////////////////////////////

function rendr (files, stack, globals, defaults, cb) {
  iterate.each(files, function (page, key, done) {
    var tmpl = {}
    // read file, normalize output
    // console.log(f, ' processing')
    // var page = matter.read(f)
    var meta = page.data || {}
    var text = page.content || ''

    // simulate gulp-draft plugin
    if (meta.draft === true)  return done(null, key)

    // append destination to metadata
    meta.dest = dest(page.rel, meta, defaults)

    // check for and assign default layout
    if (isNullOrUndef(meta.layout) || !stack[meta.layout]) {
      meta.layout = defaults.defaultLayout
    }

    // namespace metadata for primarily for navigation but
    // other uses as well.
    tmpl.tmpl = meta
    // merge context
    var context = extend({}, globals, stack[meta.layout].locals, meta, tmpl)

    // apply layouts to content
    text = layouts(text, meta.layout, stack, {
      layoutDelims: ['{{=', '}}'],
      defaultLayout: [null]
    }).result

    // compile template
    var template = handlebars.compile(text, {
      noEscape: true,
      preventIndent: true,
      assumeObjects: true
    })

    // mkdir if non-existant, write file to dest and prettify rendered template
    return writeFile(meta.dest.fpath, rendrFilez(template(context), defaults), function (err) {
      assert.ifError(err)
      logger.file(meta.dest.fpath, 'rendered')
      done(null, key)
    })
  }, function (err, result) {
    // callback for iterate.each
    assert.ifError(err)
    cb()
  })
}

function rendrFilez (template, defaults) {
  // if (meta.extname === 'xml') return template
  // built for js-beautify and custom enhancements
  if (defaults.engine === 'html') {
    return prettify(template, defaults.pretty[defaults.engine])
      .replace(/(<\/(a|span|strong|em|h1|h2|h3|h4|h5|h6)>(?!(,|\.|!|\?|;|:)))/g, "$1 ")
      .replace(/(\r\n|\n){2,}/g, "\n")
      .replace(/(\s*(?:<!--|\/\*)\s*)(?:(?!.+(\s*(?:<!--|\/\*)\s*)))/g, "\n$1")
  } else if (defaults.engine === 'css') {
    return prettify(template, defaults.pretty[defaults.engine])
      // put future replacements here for further beautifying
  } else if (defaults.engine === 'js') {
    return prettify(template, defaults.pretty[defaults.engine])
      // put future replacements here for further beautifying
  } else {
    return template
  }
}

function dest (file, meta, defaults) {
  // get file information and return (annotated version of frontMatter() )
  // purpose to simulate vinly-fs dest info for appending to metadata
  // of each file. Used to determine relative file path for navigation

  var base = file.replace(/\.hbs$/, '')
  if (cache.has(base)) return cache.get(base)

  var pathSeparator = '/'
  var buildDir      = defaults.destination
  var buildFileExt  = path.basename(file).replace(/hbs$/, meta.extname || defaults.engine)
  var buildFile     = path.basename(file, path.extname(file))
  var buildExt      = path.extname(file).replace(/hbs$/, meta.extname || defaults.engine)
  var buildPath     = path.dirname(file).replace(defaults.templateRoot, '')
  var buildDirFileExt
  var buildDirPathFileExt
  var results

  if (buildPath) {
    buildDirFileExt     = [buildPath, pathSeparator, buildFileExt].join('')
    buildDirPathFileExt = buildDir + buildDirFileExt
  } else {
    buildDirFileExt     = buildFileExt
    buildDirPathFileExt = [buildDir, pathSeparator, buildDirFileExt].join('')
  }

  results = {
    dirname  : buildDir,
    bpath    : buildDir + buildPath,
    fpath    : buildDirPathFileExt,
    basename : buildFileExt,
    name     : buildFile,
    extname  : buildExt
  }

  cache.set(base, results)
  // console.log(cache.get())
  return results
}

// Stack Object
// ///////////////////////////////////////////////////////////////////////////////

function buildLayoutStack (files, reset, cb) {
  // build an array of layouts for use in wrapping templates
  var stack = {}
  iterate.each(files, function(f, key, done) {
    var namespace = segments.last(f).replace(/\.hbs$/, '')

    if (stackin.has(namespace) && f !== reset) {
      return done(null, key)
    }

    var page = parsefm.sync(f)
    var meta = page.data
    var text = page.content

    stack[namespace] = {
      content: text,
      locals: meta,
      layout: meta.layout || ''
    }

    // reset internal cache
    stackin.set(namespace, stack[namespace])
    done(null, key)
  }, function (err, results) {
    assert.ifError(err)
    cb(null, stackin.get())
  })
}

// frontMatter
// ///////////////////////////////////////////////////////////////////////////////

function frontMatter (filenames, reset, defaults, cb) {
  // build an object of all templates' yaml-front-matter and append file path
  // metadata to each key. Used for navigation, collections, sitemaps, sorting
  // and many other things.
  var parsed = {}
  var pathSeparator = '/'

  iterate.each(filenames, function (f, key, done) {
    var baseName = segments.last(f, 2, '-').replace(/\.hbs$/, '')

    if (frontin.has(baseName) && f !== reset) {
      return done(null, key)
    }

    var metadata = parsefm.sync(f).data

    metadata.buildInfoSTRT = '-----------------------'

    if (metadata.pubDate) metadata.iso8601Date = dateFormat(metadata.pubDate, 'iso')

    // set regex to remove path items which will not translate
    // to the build directory in the options
    metadata.buildDir = path.dirname(f).replace(defaults.templateRoot, '')

    if (metadata.buildDir) {
      metadata.buildDirFileExt = metadata.buildDir
        + pathSeparator
        + path.basename(f)
        .replace(/hbs$/, defaults.engine)
    } else {
      metadata.buildDirFileExt = pathSeparator
        + path.basename(f)
        .replace(/hbs$/, defaults.engine)
    }

    metadata.buildFileExt = path.basename(f).replace(/hbs$/, defaults.engine)
    metadata.buildFile    = path.basename(f, path.extname(f))
    metadata.buildExt     = path.extname(f).replace(/hbs$/, defaults.engine)
    metadata.buildPath    = defaults.destination + metadata.buildDir
    metadata.buildDest    = defaults.destination + metadata.buildDirFileExt

    metadata.buildInfoEND = '------------------------'

    parsed[baseName] = metadata

    // reset internal cache
    frontin.set(baseName, parsed[baseName])

    done(null, key)
  }, function (err, result) {
    assert.ifError(err)
    cb(null, frontin.get())
  })
}

// readFile
// ///////////////////////////////////////////////////////////////////////////////

function readFile (fn, opt) { // fn = filename;
  var page = {}
  var basename

  if (opt) {
    basename = segments.last(fn).replace(/\.hbs$/, '')
  } else {
    basename = segments.last(fn, 2, '-').replace(/\.hbs$/, '')
  }

  page[basename] = parsefm.sync(fn, {extend: true})
  return page
}

// Expose API
// ///////////////////////////////////////////////////////////////////////////////

exports.rendr = rendr
exports.frontMatter = frontMatter
exports.buildLayoutStack = buildLayoutStack
exports.readFile = readFile
