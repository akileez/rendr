var forEach   = require('toolz/src/array/forEach')
var writeFile = require('toolz/src/file/writeFile')
var resolve   = require('toolz/src/path/resolve')
var favicons  = require(resolve.sync('favicons', {basedir: '/usr/local/lib/node_modules'}))

// Image Optimization
// ///////////////////////////////////////////////////////////////////////////////
function makeICO (image, dest, cb) {
  var source = image
  var config = {
    appName: null,                  // Your application's name. `string`
    appDescription: null,           // Your application's description. `string`
    developerName: null,            // Your (or your developer's) name. `string`
    developerURL: null,             // Your (or your developer's) URL. `string`
    background: "#fff",             // Background colour for flattened icons. `string`
    path: [dest, '/'].join(''),     // Path for overriding default icons path. `string`
    url: "/",                       // Absolute URL for OpenGraph image. `string`
    display: "standalone",          // Android display: "browser" or "standalone". `string`
    orientation: "portrait",        // Android orientation: "portrait" or "landscape". `string`
    version: "1.0",                 // Your application's version number. `number`
    logging: false,                  // Print logs to console? `boolean`
    online: false,                  // Use RealFaviconGenerator to create favicons? `boolean`
    icons: {
      android: false,              // Create Android homescreen icon. `boolean`
      appleIcon: true,            // Create Apple touch icons. `boolean`
      appleStartup: false,         // Create Apple startup images. `boolean`
      coast: false,                // Create Opera Coast icon. `boolean`
      favicons: true,             // Create regular favicons. `boolean`
      firefox: false,              // Create Firefox OS icons. `boolean`
      opengraph: true,            // Create Facebook OpenGraph image. `boolean`
      twitter: true,              // Create Twitter Summary Card image. `boolean`
      windows: false,              // Create Windows 8 tile icons. `boolean`
      yandex: false                // Create Yandex browser icon. `boolean`
    }
  }
  var callback = function (error, response) {
    if (error) {
        console.log(error.status);  // HTTP error code (e.g. `200`) or `null`
        console.log(error.name);    // Error name e.g. "API Error"
        console.log(error.message); // Error description e.g. "An unknown error has occurred"
    }
    // console.log(response.images);   // Array of { name: string, contents: <buffer> }
    // console.log(response.files);    // Array of { name: string, contents: <string> }
    // console.log(response.html);     // Array of strings (html elements)
    forEach(response.images, (file) => {
      writeFile([dest, '/', file.name].join(''), file.contents)
    })
    cb()
  }

  favicons(source, config, callback)
}

module.exports = makeICO
