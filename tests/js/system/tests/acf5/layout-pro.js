var assert = require('assert');
var simpleField = require('../../helpers/simpleField');
var replaceVars = require('../../helpers/replaceVars');

module.exports = {
    tags: ['acf5', 'pro', 'layout'],

    before: function (browser) {

    },

    beforeEach: function (browser) {
        var page = browser.page.WordPressHelper();
        page.newPost();
    },

    'Flexible Content Field': function (browser) {

        var addRowButton = '.acf-field-flexible-content .acf-actions .acf-button';
        var addLayoutPopup = '.acf-fc-popup a[data-layout="yoast_acf_analysis_flexible_content_layout"]';
        var textField = '.acf-field-flexible-content .values .acf-field-text input';

        browser.waitForElementVisible(addRowButton, 10000);
        browser.click(addRowButton);

        browser.waitForElementVisible(addLayoutPopup, 10000);
        browser.click(addLayoutPopup);

        browser.waitForElementVisible(textField, 10000);

        browser.pause( 3000 );

        var value = simpleField(browser, textField);
        replaceVars( browser, 'yoast_acf_analysis_flexible_content_0_yoast_acf_analysis_flexible_content_text', value );

    },

    'Repeater Field': function (browser) {

        var addRowButton = '.acf-field-repeater .acf-actions .acf-button';
        var textField = '.acf-field-repeater .acf-row:not(.acf-clone) .acf-field-text input';

        browser.waitForElementVisible(addRowButton, 10000);
        browser.click(addRowButton);

        browser.waitForElementVisible(textField, 10000);

        browser.pause( 3000 );

        var value = simpleField(browser, textField);
        replaceVars( browser, 'yoast_acf_analysis_repeater_0_yoast_acf_analysis_repeater_text', value );

    },

    after : function(browser) {
        browser.end();
    }
};
