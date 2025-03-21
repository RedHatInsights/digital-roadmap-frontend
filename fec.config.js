module.exports = {
  appUrl: '/insights/digital-roadmap',
  debug: true,
  useProxy: true,
  proxyVerbose: true,
  /**
   * Change accordingly to your appname in package.json.
   * The `sassPrefix` attribute is only required if your `appname` includes the dash `-` characters.
   * If the dash character is present, you will have add a camelCase version of it to the sassPrefix.
   * If it does not contain the dash character, remove this configuration.
   */
  sassPrefix: '.digital-roadmap, .digitalRoadmap',
  /**
   * Change to false after your app is registered in configuration files
   */
  interceptChromeConfig: false,

   // NOTE: This is here for local testing purposes
  // remove it when you want to use deployed chrome-service,
  // meaning fed-modules and navigation is updated in chrome-service-backend
  routes: {
    '/api/chrome-service/v1/static': {
      host: 'http://localhost:8090',
    },
    '/api/roadmap/v1': {
      host: 'http://localhost:8000/',
    },
  },

  /**
   * Add additional webpack plugins
   */
  plugins: [],
  _unstableHotReload: process.env.HOT === 'true',
  moduleFederation: {
    exclude: ['react-router-dom'],
    shared: [
      {
        'react-router-dom': {
          singleton: true,
          import: false,
          version: '^6.3.0',
        },
      },
    ],
  },
};
