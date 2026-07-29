const { join } = require('path');

/**
 * Ensures Puppeteer installs Chrome into project folder .cache/puppeteer
 * so that Render persists Chrome between build and runtime containers.
 */
module.exports = {
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};
