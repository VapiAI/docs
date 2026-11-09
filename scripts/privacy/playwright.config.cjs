const { defineConfig } = require('@playwright/test');
const path = require('node:path');
module.exports = defineConfig({
  testDir: __dirname,
  testMatch: 'privacy.browser.cjs',
  workers: 1,
  timeout: 60000,
  reporter: 'list',
  outputDir: process.env.DOCS_PRIVACY_OUTPUT_DIR || (process.env.RUNNER_TEMP ? `${process.env.RUNNER_TEMP}/docs-privacy-results` : '/private/tmp/docs-privacy-results'),
  use: { baseURL: process.env.DOCS_CONSENT_URL || 'http://localhost:3212', headless: true },
  webServer: process.env.DOCS_CONSENT_URL ? undefined : {
    cwd: path.resolve(__dirname, '../..'),
    command: 'node scripts/fern/run.cjs docs dev --port 3212 --backend-port 3213 --skip-api --skip-validation',
    url: 'http://localhost:3212',
    reuseExistingServer: !process.env.CI,
    timeout: 120000
  }
});
