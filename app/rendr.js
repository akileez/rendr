//
//    █████╗ ██╗  ██╗██╗██╗     ███████╗███████╗███████╗
//   ██╔══██╗██║ ██╔╝██║██║     ██╔════╝██╔════╝╚══███╔╝
//   ███████║█████╔╝ ██║██║     █████╗  █████╗    ███╔╝
//   ██╔══██║██╔═██╗ ██║██║     ██╔══╝  ██╔══╝   ███╔╝
//   ██║  ██║██║  ██╗██║███████╗███████╗███████╗███████╗
//   ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚══════╝╚══════╝╚══════╝╚══════╝

// Rendr Requirements
// ///////////////////////////////////////////////////////////////////////////////

var extend     = require('toolz/src/object/extend')
var omit       = require('toolz/src/object/omit')
var dateFormat = require('toolz/src/date/clockin')
var isNil      = require('toolz/src/lang/isNil')
var iterate    = require('toolz/src/async/iterate')
var concurrent = require('toolz/src/async/concurrent')
var writeFile  = require('toolz/src/file/writeFile')
var segments   = require('toolz/src/path/segments')
var Map        = require('toolz/src/cache/methos')
var layouts    = require('toolz/src/helper/layoutStack')
var parsefm    = require('toolz/src/yaml/parsefm')
var vfo        = require('toolz/src/file/vfo')
var handlebars = require('toolz/src/helper/handlebars')
var resolve    = require('toolz/src/path/resolve')
var prettify   = require('toolz/src/text/js-beautify').html
var logger     = require('./util/logger')
var path       = require('path')
var assert     = require('assert')

var cache      = Map()
var frontin    = Map()
var stackin    = Map()

// Rendr Process
// ///////////////////////////////////////////////////////////////////////////////

function rendr (files, stack, globals, defaults, cb) {
  var fn = defaults.generator === 'concurrent'
    ? concurrent
    : iterate

  fn.each(files, function (page, key, done) {
    var tmpl = {}
    // read file, normalize output
    // console.log(f, ' processing')
    // var page = matter.read(f)
    var meta = page.data || {}
    var text = page.content || ''

    // simulate gulp-draft plugin
    if (meta.draft === true)  return done(null, key)

    // append destination to metadata
    meta.dest = dest(page.path, meta, defaults)

    // check for and assign default layout
    if (isNil(meta.layout) || !stack[meta.layout]) {
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
    return writeFile(meta.dest.bpath, rendrFilez(template(context), defaults), function (err) {
      assert.ifError(err)
      logger.file(meta.dest.bpath, 'rendered')
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
  if (defaults.extension === 'html') {
    return prettify(template, defaults.pretty[defaults.extension])
      .replace(/(<\/(a|span|strong|em|h1|h2|h3|h4|h5|h6)>(?!(,|\.|!|\?|;|:)))/g, "$1")
      .replace(/(\r\n|\n){2,}/g, "\n")
      .replace(/(\s*(?:<!--|\/\*)\s*)(?:(?!.+(\s*(?:<!--|\/\*)\s*)))/g, "\n$1")
  } else if (defaults.extension === 'css') {
    return prettify(template, defaults.pretty[defaults.extension])
      // put future replacements here for further beautifying
  } else if (defaults.extension === 'js') {
    return prettify(template, defaults.pretty[defaults.extension])
      // put future replacements here for further beautifying
  } else {
    return template
  }
}

function dest (page, meta, defaults) {
  // get file information and return (annotated version of frontMatter() )
  // purpose to simulate vinly-fs dest info for appending to metadata
  // of each file. Used to determine relative file path for navigation

  var base = segments.last(page.rel, 2, '-').replace(/\.hbs$/, '')
  if (cache.has(base)) return cache.get(base)

  var pathSeparator = '/'
  var buildDir      = defaults.destination
  var buildFile     = page.base
  var buildExt      = meta.extname || defaults.extension
  var buildFileExt  = buildFile + '.' + buildExt
  var buildPath     = path.dirname(page.rel).replace(defaults.templateRoot, '')
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
    dirname  : buildDir,            // build directory
    bpath    : buildDirPathFileExt, // build path
    spath    : page.rel,            // source path
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
function matter (filenames, reset, defaults, cb) {
  var nsp = {}
  var pathSeparator = '/'
  var fileSeparator = '.'

  iterate.each(filenames, function (f, key, done) {
    var baseName = key
    var chkReset

    // this logic is not complete but this is
    // the basics of what I am looking for.
    if (reset) chkReset = key
    else chkReset = reset

    if (frontin.has(baseName) && key !== chkReset) {
      return done(null, key)
    }

    var metadata = extend({}, omit(f.data, 'dest'))

    var build = {}
    if (metadata.pubDate) build.iso8601Date = dateFormat(metadata.pubDate, 'iso')
    // set regex to remove path items which will not translate
    // to the build directory in the options
    build.dir = path.dirname(f.path.rel).replace(defaults.templateRoot, '')

    if (build.dir) {
      build.dirFileExt = build.dir
        + pathSeparator
        + f.path.base
        + fileSeparator
        + defaults.extension
    } else {
      build.dirFileExt = pathSeparator
        + f.path.base
        + fileSeparator
        + defaults.extension
    }

    build.fileExt = f.path.base + fileSeparator + defaults.extension
    build.ext     = defaults.extension
    build.file    = f.path.base
    build.path    = defaults.destination + build.dir
    build.dest    = defaults.destination + build.dirFileExt


    metadata.path = f.path
    metadata.build = build

    nsp[baseName] = metadata

    // reset internal cache
    frontin.set(baseName, nsp[baseName])

    done(null, key)
  }, function (err, result) {
    assert.ifError(err)
    cb(null, frontin.get())
  })
}

// readFile
// ///////////////////////////////////////////////////////////////////////////////
function readFile (fp, opt) {
  // create namespaced object to return
  // contents of filepath (fp) processed from
  // fixed function parsefm.sync (front-matter-extractor)
  var nsp = {}
  var key

  // build the key
  if (opt) key = segments.last(fp).replace(/\.hbs$/, '')
  else key = segments.last(fp, 2, '-').replace(/\.hbs$/, '')

  // assign virtual file object to key
  nsp[key] = vfo.stats(fp, parsefm.sync)

  // return namespaced object
  return nsp
}

// Expose API
// ///////////////////////////////////////////////////////////////////////////////

exports.rendr = rendr
exports.matter = matter
exports.buildLayoutStack = buildLayoutStack
exports.readFile = readFile
