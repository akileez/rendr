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
var Map           = require('toolz/src/cache/map')
var matter        = require('./src/matter')
var layouts       = require('./src/layouts')
var handlebars    = require('handlebars')
var prettify      = require('js-beautify').html
var mkdirp        = require('mkdirp')
var fs            = require('fs')
var path          = require('path')
var assert        = require('assert')
var logger        = require('./util/logger')

var cache         = new Map()

// Rendr Process
// ///////////////////////////////////////////////////////////////////////////////

function rendr (files, stack, globals, defaults, cb) {
  iterate.each(files, function (page, key, done) {
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
    if (isNullOrUndef(meta.layout) || !stack[meta.layout]) {
      meta.layout = defaults.defaultLayout
    }
    // merge context
    var context = extend({}, globals, stack[meta.layout].locals, meta)

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
    return mkdirp(meta.dest.bpath, function (err) {
      // callback for mkdirp
      assert.ifError(err)
      fs.writeFile(meta.dest.fpath, rendrFilez(template(context), defaults), function (err) {
        // callback for fs.writeFile
        assert.ifError(err)
        logger.file(meta.dest.fpath, 'rendered')
        done(null, key)
      })
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

  if (cache.has(file)) return cache.get(file)

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

  cache.set(file, results)
  // console.log(cache.get())
  return results
}

// Stack Object
// ///////////////////////////////////////////////////////////////////////////////

function buildLayoutStack (files, cb) {
  // build an array of layouts for use in wrapping templates
  var stack = {}
  iterate.each(files, function(f, key, done) {
    var namespace = path.basename(f, path.extname(f))
    var page = matter.read(f)
    var meta = page.data || {}
    var text = page.content || ''

    stack[namespace] = {
      content: text,
      locals: meta,
      layout: meta.layout || ''
    }
    done(null, key)
  }, function (err, results) {
    assert.ifError(err)
    cb(null, stack)
  })
}

// frontMatter
// ///////////////////////////////////////////////////////////////////////////////

function frontMatter (filenames, defaults, cb) {
  // build an object of all templates' yaml-front-matter and append file path
  // metadata to each key. Used for navigation, collections, sitemaps, sorting
  // and many other things.
  var parsed = {}
  var fileSeparator = '-'
  var pathSeparator = '/'
  var autolink = '..'

  iterate.each(filenames, function (f, key, done) {
    var baseName = path.dirname(f)
      .split(path.sep)
      .slice(-1)[0]
      + fileSeparator
      + path.basename(f, path.extname(f))

    var metadata = matter.read(f).data

    metadata.STRT = '---------------------------------------------'

    if (metadata.pubDate) metadata.iso8601Date = dateFormat(metadata.pubDate, 'iso')
    else metadata.iso8601Date = dateFormat('iso')

    metadata.parentPath = path.dirname(f)
      + pathSeparator
      + f.split(path.sep)
      .slice( -1 )[0]
      .replace(/hbs$/, defaults.engine)

    metadata.parentDir = path.dirname(f).split(path.sep).slice( 3 )[0]

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
    metadata.buildDest    = defaults.destination + metadata.buildDirFileExt
    metadata.buildPath    = defaults.destination + metadata.buildDir
    metadata.buildSlug    = metadata.slug
    metadata.buildTitle   = metadata.navTitle
    metadata.autolink     = autolink + metadata.buildDirFileExt

    metadata.END = '----------------------------------------------'

    parsed[baseName] = metadata;
    done(null, key)
  }, function (err, result) { // callback for eachAsync
    assert.ifError(err)
    cb(null, parsed)
  })
}

// readFile
// ///////////////////////////////////////////////////////////////////////////////

function readFile (fn) { // fn = filename;
  var page = {}
  var fileSeparator = '-'
  var basename = path.dirname(fn)
    .split(path.sep)
    .slice(-1)[0]
    + fileSeparator
    + path.basename(fn, path.extname(fn))
  page[basename] = matter.read(fn)
  return page
}

// Expose API
// ///////////////////////////////////////////////////////////////////////////////

exports.rendr = rendr
exports.frontMatter = frontMatter
exports.buildLayoutStack = buildLayoutStack
exports.readFile = readFile
