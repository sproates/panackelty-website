import base from './preview.playwright.config.mjs';
export default {...base,testMatch:'website.browser.mjs',testDir:'tests',timeout:60000};
