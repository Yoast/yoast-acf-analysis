/* global _, jQuery, YoastSEO, YoastReplaceVarPlugin */

var config = require( "./config/config.js" );

var ReplaceVar = YoastReplaceVarPlugin.ReplaceVar;

var supportedTypes = ['email', 'text', 'textarea', 'url', 'wysiwyg'];

var createReplaceVar = function (field) {
    // Remove HTML tags using jQuery in case of a wysiwyg field.
    var content = (field.type === 'wysiwyg') ? jQuery( jQuery.parseHTML( field.content) ).text() : field.content;

    var replaceVar = new ReplaceVar( '%%cf_'+field.name+'%%', content, { source: 'direct' } );
    YoastSEO.wp.replaceVarsPlugin.addReplacement( replaceVar );

    if (config.debug) {
        console.log("Created ReplaceVar for: ", field.name, " with: ", content, replaceVars[field.name]);
    }

    return replaceVar;
}

var createReplaceVars = function (collect) {
    if (ReplaceVar === undefined) {
        if (config.debug) {
            console.log('Replacing ACF variables in the Snippet Window requires the latest version of wordpress-seo.');
        }
        return;
    }

    var fieldData   = _.filter(collect.getFieldData(), function (field) { return _.contains(supportedTypes, field.type) });
    var replaceVars = {}

    _.each(fieldData, function(field) {
        replaceVars[field.name] = createReplaceVar( field );
    });

    return replaceVars;
};

var updateReplaceVars = function (collect, replaceVars) {
    if (ReplaceVar === undefined) {
        if (config.debug) {
            console.log('Replacing ACF variables in the Snippet Window requires the latest version of wordpress-seo.');
        }
        return;
    }

    var fieldData = _.filter(collect.getFieldData(), function (field) { return _.contains(supportedTypes, field.type) });
    _.each(fieldData, function(field) {
        // Remove HTML tags using jQuery in case of a wysiwyg field.
        var content = (field.type === 'wysiwyg') ? jQuery(jQuery.parseHTML(field.content)).text() : field.content;

        if ( replaceVars[field.name] === undefined ) {
            replaceVars[field.name] = createReplaceVar(field);
        }

        replaceVars[field.name].replacement = content;
        if (config.debug) {
            console.log("Updated ReplaceVar for: ", field.name, " with: ", content, replaceVars[field.name]);
        }
    });
};

module.exports = {
    createReplaceVars: createReplaceVars,
    updateReplaceVars: updateReplaceVars
};
