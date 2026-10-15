import base from './playwright.config.mjs';
const port = Number(process.env.PLAYGROUND_TEST_PORT || 4174);
const quote = value => "'" + value.replaceAll("'", "'\\''") + "'";
if (!process.env.PANACK_PREVIEW_SCRIPT || !process.env.PLAYGROUND_SITE_DIR) {
  throw new Error('Set PANACK_PREVIEW_SCRIPT and PLAYGROUND_SITE_DIR for preview acceptance');
}
export default {
  ...base,
  webServer: {
    command: `node ${quote(process.env.PANACK_PREVIEW_SCRIPT)} serve ${quote(process.env.PLAYGROUND_SITE_DIR)} ${port}`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: false,
    gracefulShutdown: {signal:'SIGTERM', timeout:5000}
  }
};
