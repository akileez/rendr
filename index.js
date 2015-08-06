//
//    █████╗ ██╗  ██╗██╗██╗     ███████╗███████╗███████╗
//   ██╔══██╗██║ ██╔╝██║██║     ██╔════╝██╔════╝╚══███╔╝
//   ███████║█████╔╝ ██║██║     █████╗  █████╗    ███╔╝
//   ██╔══██║██╔═██╗ ██║██║     ██╔══╝  ██╔══╝   ███╔╝
//   ██║  ██║██║  ██╗██║███████╗███████╗███████╗███████╗
//   ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚══════╝╚══════╝╚══════╝╚══════╝
//
//   rendr <https://github.com/akileez/rendr>
//   Copyright (c) 2015 Keith Williams. Licensed under the ISC license.

// Rendr Requirements
// ///////////////////////////////////////////////////////////////////////////////

'use strict'

var argv             = require('argh').argv
var resolve          = require('resolve')
var handlebars       = require(resolve.sync('handlebars', {basedir: __dirname, moduleDirectory: '../'}))
var globby           = require('./app/src/globby')
var registrar        = require('./app/src/registrarHandlebars')
var rendr            = require('./app/rendr').rendr
var frontMatter      = require('./app/rendr').frontMatter
var buildLayoutStack = require('./app/rendr').buildLayoutStack
var readFile         = require('./app/rendr').readFile
var Config           = require('toolz/src/cache/config')
var iterate          = require('toolz/src/async/iterate')
var concurrent       = require('toolz/src/async/concurrent')
var contains         = require('toolz/src/array/contains')
var keys             = require('toolz/src/object/keys')
var values           = require('toolz/src/object/values')
var union            = require('toolz/src/array/union')
var wrap             = require('toolz/src/async/wrap')
var getBaseDir       = require('./app/util/getBaseDir')
var logger           = require('./app/util/logger')
var ftree            = require('./app/util/fileTree')
var parseCSON        = require('./app/util/parseCSON')
var jcolz            = require('json-colorz')
var path             = require('path')
var assert           = require('assert')

var config           = new Config()
var opts             = new Config()
var stack            = new Config()
var map              = new Config()

var registrarhbs     = wrap(registrar)

function Rendr (initialConfig) {

  logger.datetime()

  // Application Switches
  // ///////////////////////////////////////////////////////////////////////////////

  // Build Environment : [development, production]
  // Build Stage       : [dev, test, prod]

  config.set({
    BUILD_ENV   : 'development',
    BUILD_STAGE : 'dev',
  })

  if (argv.test) {
    config.set('BUILD_STAGE', 'test')
    // opts.set('destination', 'dist') This test worked.
  }

  if (argv.stage) {
    config.set('BUILD_ENV', 'production')
    config.set('BUILD_STAGE', 'test')
  }

  if (argv.prod) {
    config.set('BUILD_ENV', 'production')
    config.set('BUILD_STAGE', 'prod')
  }

  if (argv.dist) {
    config.set('BUILD_ENV', 'production')
    config.set('BUILD_STAGE', 'prod')
    argv.d = true   // distribution
    argv.x = true   // extensions
    argv.y = true   // first run true
    argv.f = true   // favicons
    argv.w = false  // watch process
    argv.z = true   // clean build/stage
    argv.u = true   // uncss
    argv.v = true   // asset revision
  }

  // if no task name given, set default task name to `rendr`
  if (argv.argv === undefined ) {
    argv.r = true
    argv.argv = 'rendr'
  }

  // display summary of environment variables
  logger.infoDisplay(config.get(), argv)

  // Environment(env), Global(config) and Defaults(opts) configuration
  // ///////////////////////////////////////////////////////////////////////////////

  // initialize app with settings
  if (initialConfig) {
    logger.ready('Reading', 'configuration')
    config.set(initialConfig.globals)
    opts.set(initialConfig.defaults)
  } else {
    logger.ready('Reading', 'RENDR.cson')
    parseCSON('./RENDR.cson', {type: 'CS'}, function (res) {
      config.set(res.globals)
      opts.set(res.defaults)
    })
  }

  if (argv.argv == 'jobs') {
    logger.jobsDisplay()
  }

  if (argv.x) {
    var styles  = require('./app/lib/styles')
    var scripts = require('./app/lib/scripts')
    var rsync   = require('./app/lib/support').sync
    var clean   = require('./app/lib/support').clean
  }

  // Rendr Tasks
  // ///////////////////////////////////////////////////////////////////////////////
  if (argv.argv == 'rendr') {
    var opsRendr = [
      wipe,
      register,
      configOptions,
      configContext,
      makeFavicon,
      rsyncSupport,
      reStylez,
      reScriptz,
      rsyncStatic,
      loadTemplates,
      loadMatter,
      buildFileTree,
      layoutStack,
      rendrTemplates,
      minifyCSS,
      fileRevision,
      watch
    ]

    iterate.series(opsRendr, function (err) {
      assert.ifError(err)
    })
  }

  // get initial settings read in from the initialConfig/RENDR.cson file
  if (argv.argv == 'globals') {
    logger.ready('displaying', 'globals')
    jcolz(config.get())
  }

  if (argv.argv == 'defaults') {
    logger.ready('displaying', 'defaults')
    jcolz(opts.get())
  }

  // get initial settings, user and app configs
  if (argv.argv == 'config') {
    if (argv.type == 'defaults') {
      logger.ready('displaying', 'defaults')
      var opsConfig = [configOptions]
      return iterate.series(opsConfig, function (err) {
        assert.ifError(err)
        jcolz(opts.get())
      })
    }
    if (argv.type == 'globals') {
      logger.ready('displaying', 'globals')
      var opsConfig = [configContext]
      return iterate.series(opsConfig, function (err) {
        assert.ifError(err)
        jcolz(config.get())
      })
    }
  }

  // generate favicons
  if (argv.argv == 'favicons') {
    argv.f = true
    var opsRun = [makeFavicon]
    iterate.series(opsRun, function (err) {
      assert.ifError(err)
    })
  }

  // remove items from stage/build directories
  if (argv.argv == 'clean') {
    var clean = require('./app/lib/support').clean

    if (argv.del) {
      var opsClean = [del]
      return iterate.series(opsClean, function (err) {
        assert.ifError(err)
      })
    }

    argv.z = true
    var opsClean = [wipe]
    iterate.series(opsClean, function (err) {
      assert.ifError(err)
    })
  }

  // sync stage to build
  if (argv.argv == 'sync') {
    var rsync = require('./app/lib/support').sync
    var series = ['img',  'ico', 'fonts', 'pdf', 'css', 'js']
    iterate.each(series, function (val, key, done) {
        rsync('static', val, opts.get(), function () {
          done(null, key)
        })
      }, function (err, res) {
        assert.ifError(err)
      })
  }

  // minify css
  if (argv.argv == 'uncss') {
    argv.u = true
    var opsUncss = [configOptions, minifyCSS]
    iterate.series(opsUncss, function (err) {
      assert.ifError(err)
    })
  }

  // image processing: rendr crush --png 3
  if (argv.argv == 'crush') {
    argv.c = true
    var crush = require('./app/lib/images')

    if (argv.png) {
      crush.png(argv.png, function () {
        logger.done('All Done.')
      })
    }

    if (argv.jpg) {
      crush.jpg(argv.jpg, function () {
        logger.done('All Done.')
      })
    }

    if (argv.svg) {
      crush.svg(function () {
        logger.done('All Done.')
      })
    }

    if (argv.all) {
      crush.all(function () {
        logger.done('All Done.')
      })
    }
  }

  // Core Functions
  // ///////////////////////////////////////////////////////////////////////////////

  function wipe (cb) {
    if (argv.z) {
      iterate.each(values(opts.get('static')), function (val, key, done) {
        clean(val, function () {
          logger.done(val, 'removed items:')
          done(null, key)
        })
      }, function (err, res) {
        assert.ifError(err)
        logger.ready('removed', 'static')

        iterate.each(globby.sync(opts.get('build')), function (val, key, done) {
          clean(val, function () {
            logger.done(val, 'removed item:')
            done(null, key)
          })
        }, function (err, res) {
          assert.ifError(err)
          logger.ready('removed', 'build')
          cb(null, 'wipe')
        })
      })
    } else {
      cb(null, 'wipe')
    }
  }

  // rendr clean --del ico
  function del (cb) {
    var del
    // remove any static asset group
    if (contains(keys(opts.get('static')), argv.del))
      del = opts.get('static.' + argv.del)

    // remove all html files in build directory
    else if (argv.del == 'html') del = opts.get('html')

    // remove source files in build directory (txt, php, xml, etc)
    else if (argv.del == 'other')
      del = ['build/**/*.*', '!build/assets/**/*', '!build/**/*.html']

    if (del === undefined || del === null) {
      logger.ready('removed', 'nothing')
      return cb()
    }

    iterate.each(globby.sync(del), function (val, key, done) {
      clean(val, function () {
        logger.done(val, 'removed item:')
        done(null, key)
      })
    }, function (err, res) {
      assert.ifError(err)
      logger.ready('removed', del)
    })
  }

  // Register Handlebars Helpers and Partials
  function register (cb) {
    registrarhbs(handlebars, {
      bustCache: true,
      // parsePartialName: function (file) {
      //   return path.basename(file.shortPath)
      // },
      partials: [
        opts.get('partials')
      ],
      helpers: [
        opts.get('helpers')
      ]
    }, function () {
      cb(null, 'registrar')
    })
  }

  function configOptions (cb) {
    var configFilez = __dirname + '/app/cfg/*.cson'
    iterate.each(globby.sync(configFilez), function (val, key, done) {
      parseCSON(val, {type: 'CS', namespaced: true}, function (res) {
        opts.set(res)
        opts.set('csscomb', __dirname + '/app/cfg/csscomb.json')
        done(null, key)
      })
    }, function (err, res) {
      assert.ifError(err)
      // jcolz(opts.get())
      cb(null, 'reconfigOptions')
    })
  }

  function configContext (cb) {
    iterate.each(globby.sync(opts.get('context')), function (val, key, done) {
      parseCSON(val, {namespaced: false}, function (res) {
        config.set(res)
        done(null, key)
      })
    }, function (err, res) {
      assert.ifError(err)
      // jcolz(config.get())
      cb(null, 'reData')
    })
  }

  function makeFavicon (cb) {
    if (argv.f) {
      logger.info('Generating Favicons.')

      var defs = opts.get()
      var favicons = require('./app/lib/favicons')

      favicons(defs.icoIMG, defs.paths.ico, function () {
        if (!argv.y) {
          ftree(globby.sync(defs.ico), 'ico', function (err, res) {
            config.set(res)
            logger.done('favicons', 'generated:')
            return cb(null, 'ico')
          })
        } else {
          logger.done('favicons', 'generated:')
          return cb(null, 'ico')
        }
      })
    } else {
      cb(null, 'ico')
    }
  }

  function rsyncSupport (cb) {
    if (argv.x && argv.y) {
      var keys = ['fonts', 'img', 'pdf', 'js']

      iterate.each(keys, function (val, key, done) {
        rsync('support', val, opts.get(), function () {
          done(null, key)
        })
      }, function (err, res) {
        assert.ifError(err)
        cb(null, 'syncSupport')
      })
    } else {
      cb(null, 'syncSupport')
    }
  }

  function reStylez (cb) {
    if (argv.x && argv.y) {
      styles(false, config.get(), opts.get(), function () {
        cb(null, 'reStylesz')
      })
    } else {
      cb(null, 'reStylesz')
    }
  }

  function reScriptz (cb) {
    if (argv.x && argv.y) {
      scripts(false, config.get(), opts.get(), function () {
        cb(null, 'reScriptz')
      })
    } else {
      cb(null, 'reScriptz')
    }
  }

  function rsyncStatic (cb) {
    if (argv.x && argv.y) {
      var series = ['img',  'ico', 'fonts', 'pdf']

      iterate.each(series, function (val, key, done) {
        rsync('static', val, opts.get(), function () {
          done(null, key)
        })
      }, function (err, res) {
        assert.ifError(err)
        cb(null, 'rstatic')
      })
    } else {
      cb(null, 'rstatic')
    }
  }

  // Normalized file object of Template Views and Sources
  function loadTemplates (cb) {
    // map.del()
    iterate.each(globby.sync(opts.get('templates')), function (val, key, done) {
      map.set(readFile(val))
      done(null, key)
    }, function (err, res) {
      assert.ifError(err)
      if (argv.d) {
        iterate.each(globby.sync(opts.get('sources')), function (val, key, done) {
          map.set(readFile(val))
          done(null, key)
        }, function (err, res) {
          assert.ifError(err)
          cb(null, 'loadTemplates')
        })
      } else {
        cb(null, 'loadTemplates')
      }
    })
  }

  // Map frontMatter (YAML/CSON) to normalized object for each template rendered
  // Not to be confused with loadTemplates which generates a file map object for
  // each template. This object is attached to Global Data.
  function loadMatter (cb) {
    var fmap = {} //file map of YFM
    frontMatter(globby.sync(opts.get('templates')), opts.get(), function (err, res) {
      fmap.map = res
      config.set(fmap)
      cb(null, 'fmap')
    })
  }

  // Generated a filepath object of static assets and attach to global data (`this`).
  // helpers use this object for lookup, navigation and relative path calculation.
  function buildFileTree (cb) {
    var items = {
      // glob of filenames and namespace for ftree
      templates : 'tmpls', // just for testing. remove later
      modules   : 'page',
      css       : 'css',
      js        : 'js',
      code      : 'code',
      ico       : 'ico',
      img       : 'img',
      pdf       : 'pdf'
    }

    iterate.each(items, function (val, key, done) {
      ftree(globby.sync(opts.get(key)), val, function (err, res) {
        config.set(res)
        done(null, key)
      })
    }, function (err, res) {
      assert.ifError(err)
      cb(null, 'ftree')
    })
  }

  // Build the layout stack
  function layoutStack (cb) {
    stack.del()
    buildLayoutStack(globby.sync(opts.get('layouts')), function (err, res) {
      stack.set(res)
      cb(null, 'refresh')
    })
  }

  // Rendr templates using caches
  // map    -- normalized template/source object
  // stack  -- normalized layout object
  // config -- global data (context)
  // opts   -- default options
  function rendrTemplates (cb) {
    if (argv.r) {
      logger.info('Begin', 'rendering')
      rendr(map.get(), stack.get(), config.get(), opts.get(), function () {
        logger.done('rendered', 'Templates')
        cb(null, 'rendrTemplates')
      })
    } else {
      cb(null, 'rendrTemplates')
    }
  }

  function minifyCSS (cb) {
    var stage = config.get('BUILD_STAGE')

    if (argv.u && (stage === 'test' || stage === 'prod')) {
      var uncss = require('./app/lib/uncss')

      logger.info('Begin UNCSS process.')

      var globHTML = globby.sync(opts.get('html'))
      var uncssOpts = opts.get('uncss')
      var dest
      var lineBreaks

      if (stage === 'test') {
        dest = 'build/assets/css/styles.css'
        lineBreaks = true
      } else {
        dest = 'build/assets/css/styles-min.css'
        lineBreaks = false
      }

      uncss(globHTML, dest, uncssOpts, lineBreaks, function () {
        logger.done(dest,'Processed:')
        cb(null, 'uncss')
      })
    } else {
      cb(null, 'uncss')
    }
  }

  function fileRevision (cb) {
    if (argv.v && argv.d) {
      logger.info('Begin file revision')

      var hashAssets = require('./app/lib/hashAssets')
      var hashReplace = require('./app/lib/hashRev')
      var defs = opts.get()

      var src = union(
        globby.sync(defs.destination + '/' + defs.static.img),
        globby.sync(defs.destination + '/' + defs.static.css),
        globby.sync(defs.destination + '/' + defs.static.js)
      )

      var dest = globby.sync(defs.html)

      iterate.each(src, function (val, key, done) {
        hashAssets.hashFiles(val)
        done(null, key)
      }, function (err, res) {
        assert.ifError(err)
        // logger.info('Begin file revision')
        hashReplace(dest, hashAssets.getAssets())
        logger.done('revisioned', 'Files')
        cb(null, 'fileRevision')
      })
    } else {
      cb(null, 'fileRevision')
    }
  }

  // Chokidar Watch Files
  // ///////////////////////////////////////////////////////////////////////////////

  // Large section of code which could use a consolidation of sorts into a plain function with
  // parameters passed to it for configuration. Still working on that part. Main logic of program
  // presented here running under bach. Using flags via argh.argv to filter whether or not
  // watch will run.
  function watch (cb) {
    if (argv.w) {
      argv.r = true
      var chokidar = require('chokidar')
      var watchOpts = {
        ignored: /[\/\\]\./,
        ignoreInitial: true,
        persistent: true,
        useFsEvents: false
      }

      var rndrSingleFile = function (path, cb) {
        map.del()
        path = readFile(path)

        rendr(path, stack.get(), config.get(), opts.get(), function () {
          logger.done('rendered', 'Template')
          cb(null, 'rndr')
        })
      }

      var modTree = function (cb) {
        ftree(globby.sync(opts.get('modules')), 'filez', function (err, res) {
          config.set(res)
          cb(null, 'modTree')
        })
      }

      var watch = {
        // Watch Templates Views.
        // /////////////////////////////////////////////////////////////////////////////////
        // This process will generate a YFM Map of all templates, re-generate only the file
        // which changed, and re-populate the file cache with a fresh copy. All other watch
        // processes will call this cache to re-generate files upon a change in their
        // respective operations.
        templates: chokidar.watch(opts.get('templates'), watchOpts)
          .on('change', function(path) {
            logger.changed(path)

            function rndrFilez (cb) {
              rndrSingleFile(path, function () {
                cb(null, 'rndr')
              })
            }

            var opsTemplates = [buildFileTree, loadMatter, rndrFilez, loadTemplates]
            iterate.series(opsTemplates, function(err, res) {
              assert.ifError(err)
            })
          })
          .on('ready', function() {
            logger.ready('Watching:', 'templates')
          }),

        // Watch Templates Source.
        // /////////////////////////////////////////////////////////////////////////////////
        // This process will re-generate only the file which changed, and re-populate
        // the file cache with a fresh copy. All other watch processes will call this
        // newly created cache to re-generate files upon a change in their
        // respective operations.
        sources: chokidar.watch(opts.get('sources'), watchOpts)
          .on('change', function(path) {
            logger.changed(path)

            function rndrFilez (cb) {
              rndrSingleFile(path, function () {
                cb(null, 'rndr')
              })
            }

            var opsTemplates = [rndrFilez, loadTemplates]
            iterate.series(opsTemplates, function(err, res) {
              assert.ifError(err)
            })
          }),

        // Watch Layouts.
        // /////////////////////////////////////////////////////////////////////////////////
        layouts: chokidar.watch(opts.get('layouts'), watchOpts)
          .on('change', function(path) {
            logger.changed(path)

            function donemsg (cb) {
              logger.done('initialized', 'Stack')
              cb(null, 'doneMsg')
            }

            function rndrFilez (cb) {
              var fn = 'layouts/templates/src/sitemap.hbs'
              rndrSingleFile(fn, function () {
                cb(null, 'rndr')
              })
            }

            if (getBaseDir(path, 'self') === 'layout-sitemap') {
              var opsLayouts = [layoutStack, donemsg, rndrFilez, loadTemplates]
              iterate.series(opsLayouts, function (err, res) {
                assert.ifError(err)
              })
            } else {
              var opsLayouts = [layoutStack, donemsg, rendrTemplates]
              iterate.series(opsLayouts, function (err, res) {
                assert.ifError(err)
              })
            }
          })
          .on('ready', function() {
            logger.ready('Watching:', 'layouts')
          }),

        // Watch Helpers..
        // /////////////////////////////////////////////////////////////////////////////////
        helpers: chokidar.watch(opts.get('helpers'), watchOpts)
          .on('change', function(path) {
            logger.changed(path)

            // Register just the helpers
            function registerHelpers (cb) {
              registrarhbs(handlebars, {
                bustCache: true,
                helpers: [
                  opts.get('helpers')
                ]
              }, function () {
                logger.done('reloaded', 'Helpers')
                cb(null, 'helpers')
              })
            }

            var opsHelpers = [registerHelpers, rendrTemplates]
            iterate.series(opsHelpers, function (err, res) {
              assert.ifError(err)
            })
          })
          .on('ready', function() {
            logger.ready('Watching:', 'helpers')
          }),

        // Watch Partials.
        // /////////////////////////////////////////////////////////////////////////////////
        partials: chokidar.watch(opts.get('partials'), watchOpts)
          .on('change', function(path) {
            logger.changed(path)

            // Register just the partials
            function registerPartials (cb) {
              registrarhbs(handlebars, {
                bustCache: true,
                partials: [
                  opts.get('partials')
                ]
              }, function () {
                logger.done('reloaded', 'Partials')
                cb(null, 'partials')
              })
            }

            var opsPartials = [registerPartials, rendrTemplates]
            iterate.series(opsPartials, function (err, res) {
              assert.ifError(err)
            })
          })
          .on('ready', function() {
            logger.ready('Watching:', 'partials')
          }),

        // Watch Modules.
        // /////////////////////////////////////////////////////////////////////////////////
        modules: chokidar.watch(opts.get('modules'), watchOpts)
          .on('change', function(path) {
            logger.changed(path)

            var opsMods = [rendrTemplates]
            iterate.series(opsMods, function(err, res) {
              assert.ifError(err)
            })
          })
          .on('add', function(fp) {
            logger.event('File', fp, 'has been added.')

            var opsMods = [modTree]
            iterate.series(opsMods, function (err, res) {
              assert.ifError(err)
            })
          })
          .on('unlink', function(fp) {
            logger.event('File', fp, 'has been removed.')

            var opsMods = [modTree, rendrTemplates]
            iterate.series(opsMods, function (err, res) {
              assert.ifError(err)
            })
          })
          .on('ready', function() {
            logger.ready('Watching:', 'modules')
          }),

        // Watch Configs.
        // /////////////////////////////////////////////////////////////////////////////////
        configuration: chokidar.watch(opts.get('configs'), watchOpts)
          .on('change', function(fp) {
            logger.changed(fp)

            function reConfigs (cb) {
              parseCSON(fp, {type: 'CS', namespaced: true}, function (res) {
                opts.set(res)
                // jcolz(opts.get())
                logger.done('reloaded', 'Configs')
                cb(null, 'configs')
              })
            }

            var opsPartials = [reConfigs, rendrTemplates]
            iterate.series(opsPartials, function (err, res) {
              assert.ifError(err)
            })
          }),

        // Watch Globals.
        // /////////////////////////////////////////////////////////////////////////////////
        globaldata: chokidar.watch(opts.get('context'), watchOpts)
          .on('change', function(fp) {
            logger.changed(fp)

            function reGdata (cb) {
              parseCSON(fp, {namespaced: false}, function (res) {
                config.set(res)
                logger.done('changed', 'Global context')
                cb(null, 'gdata')
              })
            }

            var opsGdata = [reGdata, rendrTemplates]
            iterate.series(opsGdata, function (err, res) {
              assert.ifError(err)
            })
          })
          .on('unlink', function(fp) {
            logger.event('File', fp, 'has been removed.')

            function delGdata (cb) {
              config.del(path.basename(fp, path.extname(fp)))
              jcolz(config.get())
              cb(null, 'delGdata')
            }

            var opsGdata = [delGdata, rendrTemplates]
            iterate.series(opsGdata, function (err, res) {
              assert.ifError(err)
            })
          })
      }

      if (argv.x) var watchfe = {
        // Watch Scrips.
        // /////////////////////////////////////////////////////////////////////////////////
        scripts: chokidar.watch(opts.get('scripts'), watchOpts)
          .on('change', function(fp) {
            logger.changed(fp)

            function reScriptz (cb) {
              scripts(fp, config.get(), opts.get(), function () {
                cb(null, 'reScriptz')
              })
            }

            var opsScripts = [reScriptz, buildFileTree, rendrTemplates]
            iterate.series(opsScripts, function (err, res) {
              assert.ifError(err)
            })
          })
          .on('ready', function() {
            logger.ready('Watching:', 'scripts')
          }),

        // Watch Styles.
        // /////////////////////////////////////////////////////////////////////////////////
        styles: chokidar.watch(opts.get('styles'), watchOpts)
          .on('change', function(fp) {
            logger.changed(fp)

            function reStylez (cb) {
              styles(fp, config.get(), opts.get(), function () {
                cb(null, 'reScriptz')
              })
            }

            var opsStyles = [reStylez, buildFileTree, rendrTemplates]
            iterate.series(opsStyles, function(err, res) {
              assert.ifError(err)
            })
          })
          .on('ready', function() {
            logger.ready('Watching:', 'styles')
          }),

        // Watch Support (images).
        // /////////////////////////////////////////////////////////////////////////////////
        support: chokidar.watch(opts.get('support'), watchOpts)
          .on('all', function(event, path) {
            if (event == 'change')
              logger.changed(path)

            if (event == 'add')
              logger.event('File', path, 'has been added')

            if (event == 'unlink')
              logger.event('File', path, 'has been removed')

            rsync('support', getBaseDir(path), opts.get(), function () {
              // no operation
            })
          })
          .on('ready', function() {
            logger.ready('Watching:', 'assets')
          }),

        // Watch Stage (images).
        // /////////////////////////////////////////////////////////////////////////////////
        stage: chokidar.watch(opts.get('stage'), watchOpts)
          .on('change', function(fp) {
            logger.changed(fp)

            logger.done('re-generated.', 'File Tree')

            function syncStatic (cb) {
              rsync('static', getBaseDir(fp), opts.get(), function () {
                return cb(null, 'staticsync')
              })
            }

            var opsAssets = [buildFileTree, syncStatic, rendrTemplates]
            iterate.series(opsAssets, function(err, res) {
              assert.ifError(err)
            })
          })
      }
    }

    cb(null, 'watch')
  }
}

module.exports = Rendr
module.exports.matter = require('./app/src/matter')

