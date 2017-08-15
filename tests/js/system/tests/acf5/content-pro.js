var assert = require('assert');
var logContains = require('../../helpers/logContains');
var dummyContent = require('../../helpers/dummyContent');

module.exports = {
    tags: ['acf5', 'pro', 'content'],

    before: function (browser) {

    },

    beforeEach: function (browser) {
        var page = browser.page.WordPressHelper();
        page.newPost();
    },

    'Gallery Field': function (browser) {

        var hashTitle = dummyContent.hash();
        var hashAlt = dummyContent.hash();

        //Open Modal
        browser.waitForElementVisible('.acf-field-gallery .acf-gallery-add', 10000);
        browser.click(".acf-field-gallery .acf-gallery-add");

        // Open Media Library
        browser.useXpath();
        browser.waitForElementVisible("//div[contains(@class, 'media-modal')]//a[@class='media-menu-item' and text()='Media Library']", 10000);
        browser.click("//div[contains(@class, 'media-modal')]//a[@class='media-menu-item' and text()='Media Library']");
        browser.useCss();

        // Select Attachment
        browser.waitForElementVisible('.media-modal .attachment', 10000);
        browser.click(".media-modal .attachment");

        // Update Title
        browser.waitForElementVisible('.setting[data-setting="title"] input', 1000);
        browser
            .clearValue( '.setting[data-setting="title"] input')
            .setValue( '.setting[data-setting="title"] input', [ hashTitle , browser.Keys.TAB ] );


        browser.waitForElementNotPresent( '.attachment-details.save-waiting', 10000 );

        // Update Alt
        browser.waitForElementVisible('.setting[data-setting="alt"] input', 1000);
        browser
            .clearValue( '.setting[data-setting="alt"] input')
            .setValue( '.setting[data-setting="alt"] input', [ hashAlt , browser.Keys.TAB ] );

        browser.waitForElementNotPresent( '.attachment-details.save-waiting', 10000 );

        // Insert Attachment (closes Modal)
        browser.click(".media-modal .media-toolbar-primary .media-button-select");

        browser.pause( 15000 );

        logContains( browser, 'alt=\\"' + hashTitle + '\\" title=\\"' + hashAlt + '\\"', browser.assert.ok );

    },

    after : function(browser) {
        browser.end();
    }
};
