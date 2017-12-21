var simpleField = require('../../helpers/simpleField');
var Logger = require('nightwatch/lib/util/logger.js');

module.exports = {
    tags: ['acf4', 'acf5', 'cpt'],

    before: function (browser) {
        var page = browser.page.WordPressHelper();
        page.newPost('test_non_public_cpt');
    },

    beforeEach: function (browser) {
    },

    'Custom Post Type (non public->no metabox)' : function (browser) {
        browser.getLog('browser', function(logEntriesArray) {

            var errors = logEntriesArray.filter(function(log){
                return log.level === 'SEVERE';
            });

            browser.assert.ok( errors.length === 0, "No JS errors thrown." )

            var warnings = logEntriesArray.filter(function(log){
                return log.level === 'WARNING';
            });

            warnings.forEach(function(log){
                console.log(Logger.colors.light_purple('   WARNING: ' + log.message));
            });

        });
    },

    after : function(browser) {
        browser.end();
    }
};
