/* global _, jQuery, YoastSEO, YoastReplaceVarPlugin */

var config = require( "./config/config.js" );

var ReplaceVar = YoastReplaceVarPlugin.ReplaceVar;

var supportedTypes = ['email', 'text', 'textarea', 'url', 'wysiwyg'];

var replaceVars = {};

var replaceVarPluginAvailable = function(){
    if (ReplaceVar === undefined) {
        if (config.debug) {
            console.log('Replacing ACF variables in the Snippet Window requires Yoast SEO >= 5.3.');
        }
        return false;
    }
    return true;
};

var updateReplaceVars = function (collect) {
    if (!replaceVarPluginAvailable()) {
        return;
    }

    var fieldData = _.filter(collect.getFieldData(), function (field) { return _.contains(supportedTypes, field.type) });

    _.each(fieldData, function(field) {
        // Remove HTML tags using jQuery in case of a wysiwyg field.
        var content = (field.type === 'wysiwyg') ? jQuery(jQuery.parseHTML(field.content)).text() : field.content;

        if(replaceVars[field.name]===undefined){

            replaceVars[field.name] = new ReplaceVar( '%%cf_'+field.name+'%%', content, { source: 'direct' } );
            YoastSEO.wp.replaceVarsPlugin.addReplacement( replaceVars[field.name] );

            if (config.debug) {
                console.log("Created ReplaceVar for: ", field.name, " with: ", content, replaceVars[field.name]);
            }

        }else{

            replaceVars[field.name].replacement = content;

            if (config.debug) {
                console.log("Updated ReplaceVar for: ", field.name, " with: ", content, replaceVars[field.name]);
            }

        }

    });
};

module.exports = {
    updateReplaceVars: updateReplaceVars
};
