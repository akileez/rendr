# rendr
[![experimental][stability-image]][stability-url]
[![ISC license][license-img]][license-url]

WIP.  
see [sample output](https://github.com/akileez/rendr/wiki/sample-output) of earlier working version.  

rendr is a selfish project. It is my personal workflow for static site development. [This](https://github.com/akileez/rendr-demo) is not my **[main](https://github.com/akileez/assemblefile)** workflow. For that I use [Assemble](https://github.com/assemble/assemble). 

rendr is an educational excursion as most of my projects are. It is being posted on github because I wish to share. 
I have no intention on ever publishing this to npm. A side project of this, [hard](https://github.com/akileez/hard), will be published
eventually. Actually, rendr started off as hard. When the initial goals and requirements were coded, I got the crazy thought of attempting to convert my assemblefile
into a workflow mini app. Four weeks later rendr was born.

There is no guarentee rendr will work for you as there are too many processes custom to my 
environment. Its not impossible to get this working, its just that I am not
going to change **this** repo so that it may work for you. See, selfish.

Anyways, I use globally install npm modules in this project to cut down the size of any individual 
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

## Installation
```bash
$ npm install akileez\rendr
```

## Usage
```js

```

## API
```js

```

## Why?


## See Also
-

## License
[ISC](https://github.com/akileez/rendr/blob/master/LICENSE)

[stability-image]: https://img.shields.io/badge/stability-experimental-orange.svg?style=flat-square
[stability-url]: https://github.com/akileez/rendr
[license-img]: https://img.shields.io/badge/license-ISC-blue.svg?style=flat-square
[license-url]: https://github.com/akileez/rendr/blob/master/license.md
