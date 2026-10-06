import base from './playwright.config.mjs';
export default {...base,testMatch:'website.browser.mjs',testDir:'tests',timeout:60000};
