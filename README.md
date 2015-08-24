# rendr
[![experimental][stability-image]][stability-url]
[![ISC license][license-img]][license-url]

see [sample output](https://github.com/akileez/rendr/wiki/sample-output) of earlier working version.  

rendr is a selfish project. It is my personal workflow for static site development. [This](https://github.com/akileez/rendr-demo) is not my **[main](https://github.com/akileez/assemblefile)** workflow. For that I use [Assemble](https://github.com/assemble/assemble). 

There is no guarentee rendr will work for you as there are many processes custom to my 
environment. Its not impossible though. Good Luck. See, selfish.

If I had to give myself a grade on this project, it would be `C-` (but an `A` for effort :smile:)

## Installation
```bash
$ npm install akileez\rendr
```

## Usage

See example/index.js for the configuration object.

```js
var rendr = require('rendr')
var config = {
  defaults: {
    //...
  },

  globals: {
    // handlebars contextual stuff can go here
  }
}

rendr(config)
```

## API

#### `rendr ([config])`

@param {Object} config optional configuration object for project settings
WIP!!!

## Setup

I use globally install npm modules in this project to cut down the size of any individual 
web project I may develop. Not a smart move in the long run for sure. But there is a the work-around
to install modules after the fact as storage to sort of "shrinkwrap" the project. Globally install 
modules are the following:

- clean-css
- uglify-js
- js-beautify
- uncss
- less
- less-plugin-autoprefix
- less-plugin-csscomb
- favicons
- chokidar

I also use various command line utilites and/or globally install node modules to effect a 
process.

- rsync
- svgo (npm module)
- gzip
- pngquant
- jpegoptim
- ImageOptim (Mac OS X application)

The following repos have been incorporated into `app/src` which are also key to the functionality
of this repo:

- gray-matter
- globby
- layouts
- require-glob
- handlebars-registrar
- rimraf

## Directory Structure

This is the base directory structure I used when developing `rendr`. You should be able to alter as you see
fit but something will probably catch a snag. There are some hardcoded items within due to me only thinking
of myself. I did not test any alternative structres yet. This project was only an experiment to see if I could do it.

```bash
❯ tree -d -L 2 -I node_modules
.
├── assets (staging area)
│   ├── css
│   ├── fonts
│   ├── ico
│   ├── img
│   ├── js
│   └── pdf
├── build (build directory. Not needed. Will be created at rendr time.)
│   ├── articles
│   └── assets
├── config (handlebars contextual data. app for sitewide, data for specific purposes)
│   ├── app
│   └── data
├── helpers (your handlebars helpers)
├── layouts (how I structure projects)
│   ├── globals (global layouts)
│   ├── regions (sub-layouts filter into the global -- used to structure individual pages/templates)
│   ├── sectors (were I keep partials. I only use partials for the layouts.)
│   └── templates (page templates. I structure a site within this folder)
├── pages (you could call these partials but they are individual modules used to fill in templates
    structure this as you see fit.)
├── scripts (javascript files. rendr extensions dependent on structure here. styles and support included)
│   ├── bootstrap
│   ├── dev
│   ├── libs
│   ├── plugins
│   ├── theme
│   └── views
├── styles (less files)
│   ├── bootstrap
│   ├── development
│   ├── theme
│   └── vendor
└── support (static assests ... like bower)
    ├── fonts
    ├── img
    ├── js
    ├── pdf
    └── php

38 directories
```

## Why?
rendr is an educational excursion as most of my projects are. It is being posted on github because I wish to share. 
I have no intention on ever publishing this to npm. A side project of this, [hard](https://github.com/akileez/hard), will be published
eventually. Actually, rendr started off as hard. When the initial goals and requirements were coded, I got a crazy thought of converting my assemblefile
into a mini application. Four weeks later rendr was born. 



## See Also
-

## License
[ISC](https://github.com/akileez/rendr/blob/master/LICENSE)

[stability-image]: https://img.shields.io/badge/stability-experimental-orange.svg?style=flat-square
[stability-url]: https://github.com/akileez/rendr
[license-img]: https://img.shields.io/badge/license-ISC-blue.svg?style=flat-square
[license-url]: https://github.com/akileez/rendr/blob/master/license.md
