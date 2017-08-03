/* global _, jQuery, YoastSEO, YoastReplaceVarPlugin */

var config = require( "./config/config.js" );

var ReplaceVar = YoastReplaceVarPlugin.ReplaceVar;

var createReplaceVars = function (collect) {
    if (ReplaceVar === undefined) {
        if (config.debug) {
            console.log('Replacing ACF variables in the Snippet Window requires the latest version of wordpress-seo.');
        }
        return;
    }

    fieldData   = collect.getFieldData();
    replaceVars = {}

    _.each(fieldData, function(field) {
        // Remove HTML tags using jQuery in case of a wysiwyg field.
        var content = (field.type === 'wysiwyg') ? jQuery( jQuery.parseHTML( field.content) ).text() : field.content;

        replaceVars[field.name] = new ReplaceVar( '%%cf_'+field.name+'%%', content, { source: 'direct' } );
        YoastSEO.wp.replaceVarsPlugin.addReplacement( replaceVars[field.name] );
        console.log("Created ReplaceVar for: ", field.name, " with: ", content, replaceVars[field.name]);
    });

    return replaceVars;
};

var updateReplaceVars = function (collect, replace_vars) {
    if (ReplaceVar === undefined) {
        if (config.debug) {
            console.log('Replacing ACF variables in the Snippet Window requires the latest version of wordpress-seo.');
        }
        return;
    }

    fieldData   = collect.getFieldData();
    _.each(fieldData, function(field) {
        // Remove HTML tags using jQuery in case of a wysiwyg field.
        var content = (field.type === 'wysiwyg') ? jQuery(jQuery.parseHTML(field.content)).text() : field.content;

        replaceVars[field.name].replacement = content;
        console.log("Updated ReplaceVar for: ", field.name, " with: ", content, replaceVars[field.name]);
    });
};

module.exports = {
    createReplaceVars: createReplaceVars,
    updateReplaceVars: updateReplaceVars
};