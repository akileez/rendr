var resolve  = require('toolz/src/path/resolve')
var favicons = require(resolve.sync('favicons', {basedir: '/usr/local/lib/node_modules'}))

// Image Optimization
// ///////////////////////////////////////////////////////////////////////////////
function makeICO (image, dest, cb) {
  favicons({
    files: {
        // Path(s) for file to produce the favicons. `string` or `object`
        src: image,
        // Path for writing the favicons to. `string`
        dest: [dest, '/'].join(''),
        // Path(s) for HTML file to write or append metadata. `string` or `array`
        html: null,
        // Path for overriding default icons path. `string`
        iconsPath: null,
        // Path for an existing android_chrome_manifest.json. `string`
        androidManifest: null,
        // Path for an existing browserconfig.xml. `string`
        browserConfig: null,
        // Path for an existing manifest.webapp. `string`
        firefoxManifest: null,
        // Path for an existing yandex-browser-manifest.json. `string`
        yandexManifest: null
    },
    icons: {
        // Create Android homescreen icon. `boolean`
        android: false,
        // Create Apple touch icons. `boolean`
        appleIcon: true,
        // Create Apple startup images. `boolean`
        appleStartup: false,
        // Create Opera Coast icon. `boolean`
        coast: false,
        // Create regular favicons. `boolean`
        favicons: true,
        // Create Firefox OS icons. `boolean`
        firefox: false,
        // Create Facebook OpenGraph. `boolean`
        opengraph: true,
        // Create Windows 8 tiles. `boolean`
        windows: false,
        // Create Yandex browser icon. `boolean`
        yandex: false
    },
    settings: {
        // Your application's name. `string`
        appName: null,
        // Your application's description. `string`
        appDescription: null,
        // Your (or your developer's) name. `string`
        developer: null,
        // Your (or your developer's) URL. `string`
        developerURL: null,
        // Your application's version number. `number`
        version: 1.0,
        // Background colour for flattened icons. `string`
        background: null,
        // Path for the initial page on the site. `string`
        index: null,
        // URL for your website. `string`
        url: null,
        // Turn the logo into a white silhouette for Windows 8. `boolean`
        silhouette: false,
        // Print logs to console? `boolean`
        logging: true
    },
    // Complete JSON overwrite for the favicon_generation object. `object`
    favicon_generation: null,
  }, function (err, metadata) {
    if (err) console.log(err)
    // console.log(metadata)
    cb()
  })
}

module.exports = makeICO
