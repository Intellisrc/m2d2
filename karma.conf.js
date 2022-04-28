module.exports = function(config) {
  config.set({
    frameworks: ['qunit'],
    plugins: [
        'karma-qunit',
        'karma-chrome-launcher'
    ],
    files: [
        'dist/src/m2d2.all.src.js',
        'test/*.js'
    ],

    //port: 9876,  // karma web server port
    colors: true,
    logLevel: config.LOG_INFO,

    //browsers: ['Chrome'],
    //autoWatch: true,

    browsers: ['headlessChrome'],
      customLaunchers : {
      headlessChrome: {
        base: "ChromeHeadless",
        flags: [
          "--no-sandbox",
          "--no-proxy-server",
          "--disable-web-security",
          "--disable-gpu",
          "--js-flags=--max-old-space-size=8196", 
        ]
      }
    },    
    singleRun: true, // Karma captures browsers, runs the tests and exits
    autoWatch: false,

    // client configuration
    // showUI: true needs the clearContext: false option to display correctly in non-debug mode.
    client: {
      clearContext: false,
      qunit: {
        showUI: true,
        testTimeout: 5000
      }
    }
  })
}
