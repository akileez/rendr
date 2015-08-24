/*!
 * rendr-demo <https://github.com/akileez/rendr-demo>
 *
 * Copyright (c) 2015 Keith Williams.
 * Licensed under the ISC license.
 */

// require the module
var rendr = require('rendr')

// setup a configuration object or create a RENDR.cson file in root directory
// this of course is all preliminary. Just wanted to get this working.
var configuration = {
  // defaults object aka options
  defaults: {
    // General
    // build directory
    destination   : 'build',
    // asset staging
    stagingArea   : 'assets',
    // where static assets reside
    staticAssets  : 'support',
    // really this is just the extension to use for files. not really an engine.
    engine        : 'html',
    // default layout name
    defaultLayout : 'default',
    // regex to filter out directory structure from build directory so I may
    // calculate relative paths easier. If you have a flat structure this should
    // not be a problem. But I doubt it.
    templateRoot  : /(layouts\/templates\/(views|src))/,


    // Glob Files
    // really a routing system. just glob it all. I tried to iterate over
    // everything.
    layouts   : 'layouts/{globals,regions}/*.hbs',
    templates : 'layouts/templates/views/**/*.hbs',
    sources   : 'layouts/templates/src/*.hbs',
    modules   : 'pages/**/*.hbs',
    partials  : 'layouts/sectors/*.hbs',
    helpers   : 'helpers/*.js',
    styles    : 'styles/**/*.{less,css}',
    scripts   : 'scripts/**/*.js',
    support   : 'support/**/*',
    stage     : 'assets/{img,pdf,fonts}/**/*',
    context   : 'config/**/*.cson',
    html      : 'build/**/*.html',
    build     : ['build/**/*', '!build/assets/**', '!build/assets'],
    // Tree support
    // section is used to build an object of file paths of project assets.
    // I dislike adding strings for filepaths in helpers very very very much.
    css       : 'assets/css/*.css',
    js        : 'assets/js/*.js',
    ico       : 'assets/ico/*.{png,ico}',
    img       : 'assets/img/**/*.*',
    pdf       : 'assets/pdf/*.pdf',
    fonts     : 'assets/fonts/*',
    code      : 'scripts/views/{configs,snippets}/*.js',

    // Less files processing
    // global less files used for aggregating the less development
    // structure within. Only this files will be created. Makes things
    // easy for me.
    LESSfilez: {
      development : 'styles/development.less',
      theme       : 'styles/theme.less',
      vendor      : 'styles/vendor.less',
      framework   : 'styles/framework.less',
      styles      : 'styles/styles.less'
    },

    SCRPTfilez: {
      framework: [
        'scripts/framework/transition.js',
        'scripts/framework/alert.js',
        'scripts/framework/button.js',
        'scripts/framework/carousel.js',
        'scripts/framework/collapse.js',
        'scripts/framework/dropdown.js',
        'scripts/framework/modal.js',
        'scripts/framework/tooltip.js',
        'scripts/framework/popover.js',
        'scripts/framework/scrollspy.js',
        'scripts/framework/tab.js',
        'scripts/framework/affix.js'
      ],
      plugins : 'scripts/plugins/*.js',
      libs    : 'scripts/libs/**/*.js',
      theme   : 'scripts/theme/*.js',
      dev     : 'scripts/dev/*.js'
    },

    static: {
      css   : 'assets/css/*.css',
      js    : 'assets/js/*.js',
      ico   : 'assets/ico/*.{png,ico}',
      img   : 'assets/img/**/*.*',
      pdf   : 'assets/pdf/*.pdf',
      fonts : 'assets/fonts/*'
    },

    // favicon support
    icoIMG: 'support/img/SimFitLogo.png',

    // Static asset paths (rsync)
    paths: {
      img   : 'assets/img',
      pdf   : 'assets/pdf',
      ico   : 'assets/ico',
      fonts : 'assets/fonts',
      js    : 'assets/js',
      css   : 'assets/css'
    }
  },

  globals: {
    // Partial str replacements
    // None of this is needed. Put you handlebars contextual data here
    // or create a .cson file to be read in.
    _html       : 'html',
    head        : 'head',
    body        : 'body',
    main        : 'main',
    HEAD        : '_head',
    SCRIPTS     : 'head-scripts',
    STYLES      : 'head-styles',
    SOCIAL      : 'head-social',
    FOOT        : '_foot',
    PRODUCTION  : 'foot-base',
    DEVELOPMENT : 'foot-dev',
    NAVBAR      : 'navbar',
    NAVLINK     : 'navlink',
    NAVROUTES   : 'navRoutes'
  }
}

rendr(configuration)
