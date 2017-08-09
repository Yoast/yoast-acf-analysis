(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/* global YoastSEO */
var config = require( "./config/config.js" );
var helper = require( "./helper.js" );
var collect = require( "./collect/collect.js" );
var replaceVars = require( "./replacevars.js" );

var analysisTimeout = 0;

var App = function(){

    YoastSEO.app.registerPlugin(config.pluginName, {status: 'ready'});

    YoastSEO.app.registerModification('content', collect.append.bind(collect), config.pluginName);

    this.bindListeners();
};

App.prototype.bindListeners = function(){

    if(helper.acf_version >= 5){
        this.replaceVars = replaceVars.createReplaceVars(collect);
        acf.add_action('change remove append sortstop', this.maybeRefresh);
        acf.add_action('change remove append sortstop', replaceVars.updateReplaceVars.bind(this, collect, this.replaceVars));
    }else{
        var fieldSelectors = config.fieldSelectors.slice(0);

        // Ignore Wysiwyg fields because they trigger a refresh in Yoast SEO itself
        fieldSelectors = _.without(fieldSelectors, 'textarea[id^=wysiwyg-acf]');

        var _self = this;

        jQuery(document).on('acf/setup_fields', function(){
            this.replaceVars = replaceVars.createReplaceVars(collect);
            var fields = jQuery('#post-body, #edittag').find(fieldSelectors.join(','));
            //This would cause faster updates while typing
            //fields.on('change input', _self.maybeRefresh.bind(_self) );
            fields.on('change', _self.maybeRefresh.bind(_self) );
            fields.on('change', replaceVars.updateReplaceVars.bind(_self, collect, _self.replaceVars));

            //Also refresh on media close as attachment data might have changed
            wp.media.frame.on('close', _self.maybeRefresh.bind(_self) );
        });
    }

}

App.prototype.maybeRefresh = function(){

    if ( analysisTimeout ) {
        window.clearTimeout(analysisTimeout);
    }

    analysisTimeout = window.setTimeout( function() {

        if(config.debug){
            console.log('Recalculate...' + new Date() + '(Internal)');
        }

        YoastSEO.app.pluginReloaded(config.pluginName);
    }, config.refreshRate );

};

module.exports = App;
},{"./collect/collect.js":6,"./config/config.js":7,"./helper.js":8,"./replacevars.js":10}],2:[function(require,module,exports){
/* global _ */
var cache = require( "./cache.js" );

var refresh = function(attachment_ids){

    var uncached = cache.getUncached(attachment_ids, 'attachment');

    if (uncached.length === 0){
        return;
    }

    window.wp.ajax.post('query-attachments', {
        'query': {
            'post__in': uncached
        }
    }).done(function (attachments) {

        _.each(attachments, function (attachment) {
            cache.set(attachment.id, attachment, 'attachment');
            YoastACFAnalysis.maybeRefresh();
        });

    });

};

var get = function( id ){

    var attachment = cache.get(id, 'attachment');

    if(!attachment) return false;

    var changedAttachment = wp.media.attachment( id );

    if( changedAttachment.has('alt') ){
        attachment.alt = changedAttachment.get('alt');
    }

    if( changedAttachment.has('title') ){
        attachment.title = changedAttachment.get('title');
    }

    return attachment;
};

module.exports = {
    refresh: refresh,
    get: get
};
},{"./cache.js":3}],3:[function(require,module,exports){
/* global _ */
var Cache = function() {
    this.clear('all');
};

var _cache;

Cache.prototype.set = function( id, value, store ) {

    store = typeof store !== 'undefined' ? store : 'default';

    if( !(store in _cache) ){
        _cache[store] = {};
    }

    _cache[ store ][ id ] = value;
};

Cache.prototype.get =  function( id, store ){

    store = typeof store !== 'undefined' ? store : 'default';

    if ( store in _cache && id in _cache[ store ] ) {
        return _cache[ store ][ id ];
    }else{
        return false;
    }

};

Cache.prototype.getUncached =  function(ids, store){

    store = typeof store !== 'undefined' ? store : 'default';

    var that = this;

    ids = _.uniq(ids);

    return ids.filter(function(id){
        var value = that.get(id, store);
        return value === false;
    });

};

Cache.prototype.clear =  function(store){

    store = typeof store !== 'undefined' ? store : 'default';

    if(store === 'all'){
        _cache = {};
    }else{
        _cache[store] = {};
    }

};

module.exports = new Cache();
},{}],4:[function(require,module,exports){
var config = require( "./../config/config.js" );
var fieldSelectors = config.fieldSelectors;

var field_data = [];

var fields = jQuery('#post-body, #edittag').find(fieldSelectors.join(','));

fields.each(function() {

    var $el = jQuery(this).parents('.field').last();

    field_data.push({
        $el     : $el,
        key     : $el.data('field_key'),
        name    : $el.data('field_name'),
        type    : $el.data('field_type')
    });

});

module.exports = field_data;
},{"./../config/config.js":7}],5:[function(require,module,exports){
module.exports = function(){
    return _.map(acf.get_fields(), function(field){

        var field_data = jQuery.extend( true, {}, acf.get_data(jQuery(field)) );
        field_data.$el = jQuery(field);
        return field_data;

    });
};
},{}],6:[function(require,module,exports){
/* global acf, _ */

var config = require( "./../config/config.js" );
var helper = require( "./../helper.js" );
var scraper_store = require( "./../scraper-store.js" );

var Collect = function(){

};

Collect.prototype.getFieldData = function () {
    var field_data = this.filterBroken(this.filterBlacklist(this.getData()));

    var used_types = _.uniq(_.pluck(field_data, 'type'));

    _.each(used_types, function(type){
        field_data = scraper_store.getScraper(type).scrape(field_data);
    });

    return field_data
};

Collect.prototype.append = function(data){

    if(config.debug){
        console.log('Recalculate...' + new Date());
    }

    var field_data = this.getFieldData();

    _.each(field_data, function(field){

        if(typeof field.content !== 'undefined' && field.content !== ''){
            data += '\n' + field.content;
        }

    });

    if(config.debug){

        console.log('Used types:')
        console.log(used_types);

        console.log('Field data:')
        console.table(field_data);

        console.log('Data:')
        console.log(data);

    }

    return data;

};

Collect.prototype.getData = function(){

    if(helper.acf_version >= 5){
        return require( "./collect-v5.js" )();
    }else{
        return require( "./collect-v4.js" );
    }

};

Collect.prototype.filterBlacklist = function(field_data){
    return _.filter(field_data, function(field){
        return !_.contains(config.blacklist, field.type);
    });
};

Collect.prototype.filterBroken = function(field_data){
    return _.filter(field_data, function(field){
        return ('key' in field);
    });
};

module.exports = new Collect();
},{"./../config/config.js":7,"./../helper.js":8,"./../scraper-store.js":11,"./collect-v4.js":4,"./collect-v5.js":5}],7:[function(require,module,exports){
module.exports = YoastACFAnalysisConfig;
},{}],8:[function(require,module,exports){
var config = require( "./config/config.js" );

module.exports = {
    acf_version: parseInt(config.acfVersion, 10)
};
},{"./config/config.js":7}],9:[function(require,module,exports){
/* global jQuery, YoastACFAnalysis: true */

var App = require( "./app.js" );

(function($) {

    $(document).ready(function() {

        if( "undefined" !== typeof YoastSEO){

            YoastACFAnalysis = new App();

        }

    });

}(jQuery));
},{"./app.js":1}],10:[function(require,module,exports){
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
},{"./config/config.js":7}],11:[function(require,module,exports){
/* global _ */
var config = require( "./config/config.js" );

var scraperObjects = {

    //Basic
    'text':         require( "./scraper/scraper.text.js" ),
    'textarea':     require( "./scraper/scraper.textarea.js" ),
    'email':        require( "./scraper/scraper.email.js" ),
    'url':          require( "./scraper/scraper.url.js" ),

    //Content
    'wysiwyg':      require( "./scraper/scraper.wysiwyg.js" ),
    //TODO: Add oembed handler
    'image':        require( "./scraper/scraper.image.js" ),
    'gallery':      require( "./scraper/scraper.gallery.js" ),

    //Choice
    //TODO: select, checkbox, radio

    //Relational
    'taxonomy':     require( "./scraper/scraper.taxonomy.js" )

    //jQuery
    //TODO: google_map, date_picker, color_picker

};

var scrapers = {};

/**
 * Set a scraper object on the store. Existing scrapers will be overwritten.
 *
 * @param {Object} scraper
 * @param {string} type
 */
var setScraper = function(scraper, type){

    if(config.debug && hasScraper(type)){
        console.warn('Scraper for "' + type + '" already exists and will be overwritten.' );
    }

    scrapers[type] = scraper;

    return scraper;
};

/**
 * Returns the scraper object for a field type.
 * If there is no scraper object for this field type a no-op scraper is returned.
 *
 * @param {string} type
 * @returns {Object}
 */
var getScraper = function(type){

    if(hasScraper(type)){
        return scrapers[type];
    }else if(type in scraperObjects){
        return setScraper(new scraperObjects[type](), type);
    }else{
        //If we do not have a scraper just pass the fields through so it will be filtered out by the app.
        return {
            scrape: function(fields){
                if(config.debug){
                    console.warn('No Scraper for field type: ' + type );
                }
                return fields;
            }
        };
    }
}

/**
 * Checks if there already is a scraper for a field type in the store.
 *
 * @param {string} type
 * @returns {boolean}
 */
var hasScraper = function(type){

    return (type in scrapers);

};

module.exports = {

    setScraper: setScraper,
    getScraper: getScraper

};
},{"./config/config.js":7,"./scraper/scraper.email.js":12,"./scraper/scraper.gallery.js":13,"./scraper/scraper.image.js":14,"./scraper/scraper.taxonomy.js":15,"./scraper/scraper.text.js":16,"./scraper/scraper.textarea.js":17,"./scraper/scraper.url.js":18,"./scraper/scraper.wysiwyg.js":19}],12:[function(require,module,exports){
var scrapers = require( "./../scraper-store.js" );

var Scraper = function() {};

Scraper.prototype.scrape = function(fields){

    var that = this;

    fields = _.map(fields, function(field){

        if(field.type !== 'email'){
            return field;
        }

        field.content = field.$el.find('input[type=email][id^=acf]').val();

        return field;
    });

    return fields;

};

module.exports = Scraper;
},{"./../scraper-store.js":11}],13:[function(require,module,exports){
var attachmentCache = require( "./../cache/cache.attachments.js" );
var scrapers = require( "./../scraper-store.js" );

var Scraper = function() {};

Scraper.prototype.scrape = function(fields){

    var that = this;

    var attachment_ids = [];

    fields = _.map(fields, function(field){

        if(field.type !== 'gallery'){
            return field;
        }

        field.content = '';

        field.$el.find('.acf-gallery-attachment input[type=hidden]').each( function (index, element){

            //TODO: Is this the best way to get the attachment id?
            var attachment_id = jQuery( this ).val();

            //Collect all attachment ids for cache refresh
            attachment_ids.push(attachment_id);

            //If we have the attachment data in the cache we can return a useful value
            if(attachmentCache.get(attachment_id, 'attachment')){

                var attachment = attachmentCache.get(attachment_id, 'attachment');

                field.content += '<img src="' + attachment.url + '" alt="' + attachment.alt + '" title="' + attachment.title + '">';

            }

        });

        return field;
    });

    attachmentCache.refresh(attachment_ids);

    return fields;

};

module.exports = Scraper;
},{"./../cache/cache.attachments.js":2,"./../scraper-store.js":11}],14:[function(require,module,exports){
var attachmentCache = require( "./../cache/cache.attachments.js" );
var scrapers = require( "./../scraper-store.js" );

var Scraper = function() {};

Scraper.prototype.scrape = function(fields){

    var that = this;

    var attachment_ids = [];

    fields = _.map(fields, function(field){

        if(field.type !== 'image'){
            return field;
        }

        field.content = '';

        var attachment_id = field.$el.find('input[type=hidden]').val();

        attachment_ids.push(attachment_id);

        if(attachmentCache.get(attachment_id, 'attachment')){

            var attachment = attachmentCache.get(attachment_id, 'attachment');

            field.content += '<img src="' + attachment.url + '" alt="' + attachment.alt + '" title="' + attachment.title + '">';

        }


        return field;
    });

    attachmentCache.refresh(attachment_ids);

    return fields;

};

module.exports = Scraper;
},{"./../cache/cache.attachments.js":2,"./../scraper-store.js":11}],15:[function(require,module,exports){
var scrapers = require( "./../scraper-store.js" );

var Scraper = function() {};

Scraper.prototype.scrape = function(fields){

    var that = this;

    fields = _.map(fields, function(field){

        if(field.type !== 'taxonomy'){
            return field;
        }

        var terms = [];

        if( field.$el.find('.acf-taxonomy-field[data-type="multi_select"]').length > 0 ){

            terms = _.pluck(
                field.$el.find('.acf-taxonomy-field[data-type="multi_select"] select')
                    .select2('data')
                , 'text'
            );

        }else if( field.$el.find('.acf-taxonomy-field[data-type="checkbox"]').length > 0 ){

            terms = _.pluck(
                field.$el.find('.acf-taxonomy-field[data-type="checkbox"] input[type="checkbox"]:checked')
                    .next(),
                'textContent'
            );

        }else if( field.$el.find('input[type=checkbox]:checked').length > 0 ){

            terms = _.pluck(
                field.$el.find('input[type=checkbox]:checked')
                    .parent(),
                'textContent'
            );

        }else if( field.$el.find('select option:checked').length > 0 ){

            terms = _.pluck(
                field.$el.find('select option:checked'),
                'textContent'
            );

        }

        terms = _.map( terms, function(term){ return term.trim(); } );

        if(terms.length>0){
            field.content = '<ul>\n<li>' + terms.join('</li>\n<li>') + '</li>\n</ul>';
        }

        return field;
    });

    return fields;

};

module.exports = Scraper;

},{"./../scraper-store.js":11}],16:[function(require,module,exports){
var config = require( "./../config/config.js" );
var scrapers = require( "./../scraper-store.js" );

var Scraper = function() {};

Scraper.prototype.scrape = function(fields){

    var that = this;

    fields = _.map(fields, function(field){

        if(field.type !== 'text'){
            return field;
        }

        field.content = field.$el.find('input[type=text][id^=acf]').val();

        field = that.wrapInHeadline(field);

        return field;
    });

    return fields;

};

Scraper.prototype.wrapInHeadline = function(field){

    var level = this.isHeadline(field);
    if(level){
        field.content = '<h' + level + '>' + field.content + '</h' + level + '>';
    }

    return field;
};

Scraper.prototype.isHeadline = function(field){

    var level = false;

    var level = _.find(config.scraper.text.headlines, function(value, key){
        return field.key === key;
    });

    //It has to be an integer
    if(level){
        level = parseInt(level, 10);
    }

    //Headlines only exist from h1 to h6
    if(level<1 || level>6){
        level = false;
    }

    return level;

};

module.exports = Scraper;
},{"./../config/config.js":7,"./../scraper-store.js":11}],17:[function(require,module,exports){
var scrapers = require( "./../scraper-store.js" );

var Scraper = function() {};

Scraper.prototype.scrape = function(fields){

    var that = this;

    fields = _.map(fields, function(field){

        if(field.type !== 'textarea'){
            return field;
        }

        field.content = field.$el.find('textarea[id^=acf]').val();

        return field;
    });

    return fields;

};

module.exports = Scraper;
},{"./../scraper-store.js":11}],18:[function(require,module,exports){
var scrapers = require( "./../scraper-store.js" );

var Scraper = function() {};

Scraper.prototype.scrape = function(fields){

    var that = this;

    fields = _.map(fields, function(field){

        if(field.type !== 'url'){
            return field;
        }

        field.content = field.$el.find('input[type=url][id^=acf]').val();

        return field;
    });

    return fields;

};

module.exports = Scraper;
},{"./../scraper-store.js":11}],19:[function(require,module,exports){
var scrapers = require( "./../scraper-store.js" );

var Scraper = function() {};

Scraper.prototype.scrape = function(fields){

    var that = this;

    fields = _.map(fields, function(field){

        if(field.type !== 'wysiwyg'){
            return field;
        }

        field.content = getContentTinyMCE(field);

        return field;
    });

    return fields;

};

/**
 * Adapted from wp-seo-shortcode-plugin-305.js:115-126
 *
 * @returns {string}
 */
var getContentTinyMCE = function(field) {
    var textarea = field.$el.find('textarea')[0];

    var editorID = textarea.id;

    var val = textarea.value;

    if ( isTinyMCEAvailable(editorID) ) {
        val = tinyMCE.get( editorID ) && tinyMCE.get( editorID ).getContent() || '';
    }

    return val;
};

/**
 * Adapted from wp-seo-post-scraper-plugin-310.js:196-210
 *
 *
 * @param editorID
 * @returns {boolean}
 */
var isTinyMCEAvailable = function(editorID) {
    if ( typeof tinyMCE === 'undefined' ||
        typeof tinyMCE.editors === 'undefined' ||
        tinyMCE.editors.length === 0 ||
        tinyMCE.get( editorID ) === null ||
        tinyMCE.get( editorID ).isHidden() ) {
        return false;
    }

    return true;
};

module.exports = Scraper;
},{"./../scraper-store.js":11}]},{},[9])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJqcy9zcmMvYXBwLmpzIiwianMvc3JjL2NhY2hlL2NhY2hlLmF0dGFjaG1lbnRzLmpzIiwianMvc3JjL2NhY2hlL2NhY2hlLmpzIiwianMvc3JjL2NvbGxlY3QvY29sbGVjdC12NC5qcyIsImpzL3NyYy9jb2xsZWN0L2NvbGxlY3QtdjUuanMiLCJqcy9zcmMvY29sbGVjdC9jb2xsZWN0LmpzIiwianMvc3JjL2NvbmZpZy9jb25maWcuanMiLCJqcy9zcmMvaGVscGVyLmpzIiwianMvc3JjL21haW4uanMiLCJqcy9zcmMvcmVwbGFjZXZhcnMuanMiLCJqcy9zcmMvc2NyYXBlci1zdG9yZS5qcyIsImpzL3NyYy9zY3JhcGVyL3NjcmFwZXIuZW1haWwuanMiLCJqcy9zcmMvc2NyYXBlci9zY3JhcGVyLmdhbGxlcnkuanMiLCJqcy9zcmMvc2NyYXBlci9zY3JhcGVyLmltYWdlLmpzIiwianMvc3JjL3NjcmFwZXIvc2NyYXBlci50YXhvbm9teS5qcyIsImpzL3NyYy9zY3JhcGVyL3NjcmFwZXIudGV4dC5qcyIsImpzL3NyYy9zY3JhcGVyL3NjcmFwZXIudGV4dGFyZWEuanMiLCJqcy9zcmMvc2NyYXBlci9zY3JhcGVyLnVybC5qcyIsImpzL3NyYy9zY3JhcGVyL3NjcmFwZXIud3lzaXd5Zy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEZBOztBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyogZ2xvYmFsIFlvYXN0U0VPICovXG52YXIgY29uZmlnID0gcmVxdWlyZSggXCIuL2NvbmZpZy9jb25maWcuanNcIiApO1xudmFyIGhlbHBlciA9IHJlcXVpcmUoIFwiLi9oZWxwZXIuanNcIiApO1xudmFyIGNvbGxlY3QgPSByZXF1aXJlKCBcIi4vY29sbGVjdC9jb2xsZWN0LmpzXCIgKTtcbnZhciByZXBsYWNlVmFycyA9IHJlcXVpcmUoIFwiLi9yZXBsYWNldmFycy5qc1wiICk7XG5cbnZhciBhbmFseXNpc1RpbWVvdXQgPSAwO1xuXG52YXIgQXBwID0gZnVuY3Rpb24oKXtcblxuICAgIFlvYXN0U0VPLmFwcC5yZWdpc3RlclBsdWdpbihjb25maWcucGx1Z2luTmFtZSwge3N0YXR1czogJ3JlYWR5J30pO1xuXG4gICAgWW9hc3RTRU8uYXBwLnJlZ2lzdGVyTW9kaWZpY2F0aW9uKCdjb250ZW50JywgY29sbGVjdC5hcHBlbmQuYmluZChjb2xsZWN0KSwgY29uZmlnLnBsdWdpbk5hbWUpO1xuXG4gICAgdGhpcy5iaW5kTGlzdGVuZXJzKCk7XG59O1xuXG5BcHAucHJvdG90eXBlLmJpbmRMaXN0ZW5lcnMgPSBmdW5jdGlvbigpe1xuXG4gICAgaWYoaGVscGVyLmFjZl92ZXJzaW9uID49IDUpe1xuICAgICAgICB0aGlzLnJlcGxhY2VWYXJzID0gcmVwbGFjZVZhcnMuY3JlYXRlUmVwbGFjZVZhcnMoY29sbGVjdCk7XG4gICAgICAgIGFjZi5hZGRfYWN0aW9uKCdjaGFuZ2UgcmVtb3ZlIGFwcGVuZCBzb3J0c3RvcCcsIHRoaXMubWF5YmVSZWZyZXNoKTtcbiAgICAgICAgYWNmLmFkZF9hY3Rpb24oJ2NoYW5nZSByZW1vdmUgYXBwZW5kIHNvcnRzdG9wJywgcmVwbGFjZVZhcnMudXBkYXRlUmVwbGFjZVZhcnMuYmluZCh0aGlzLCBjb2xsZWN0LCB0aGlzLnJlcGxhY2VWYXJzKSk7XG4gICAgfWVsc2V7XG4gICAgICAgIHZhciBmaWVsZFNlbGVjdG9ycyA9IGNvbmZpZy5maWVsZFNlbGVjdG9ycy5zbGljZSgwKTtcblxuICAgICAgICAvLyBJZ25vcmUgV3lzaXd5ZyBmaWVsZHMgYmVjYXVzZSB0aGV5IHRyaWdnZXIgYSByZWZyZXNoIGluIFlvYXN0IFNFTyBpdHNlbGZcbiAgICAgICAgZmllbGRTZWxlY3RvcnMgPSBfLndpdGhvdXQoZmllbGRTZWxlY3RvcnMsICd0ZXh0YXJlYVtpZF49d3lzaXd5Zy1hY2ZdJyk7XG5cbiAgICAgICAgdmFyIF9zZWxmID0gdGhpcztcblxuICAgICAgICBqUXVlcnkoZG9jdW1lbnQpLm9uKCdhY2Yvc2V0dXBfZmllbGRzJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHRoaXMucmVwbGFjZVZhcnMgPSByZXBsYWNlVmFycy5jcmVhdGVSZXBsYWNlVmFycyhjb2xsZWN0KTtcbiAgICAgICAgICAgIHZhciBmaWVsZHMgPSBqUXVlcnkoJyNwb3N0LWJvZHksICNlZGl0dGFnJykuZmluZChmaWVsZFNlbGVjdG9ycy5qb2luKCcsJykpO1xuICAgICAgICAgICAgLy9UaGlzIHdvdWxkIGNhdXNlIGZhc3RlciB1cGRhdGVzIHdoaWxlIHR5cGluZ1xuICAgICAgICAgICAgLy9maWVsZHMub24oJ2NoYW5nZSBpbnB1dCcsIF9zZWxmLm1heWJlUmVmcmVzaC5iaW5kKF9zZWxmKSApO1xuICAgICAgICAgICAgZmllbGRzLm9uKCdjaGFuZ2UnLCBfc2VsZi5tYXliZVJlZnJlc2guYmluZChfc2VsZikgKTtcbiAgICAgICAgICAgIGZpZWxkcy5vbignY2hhbmdlJywgcmVwbGFjZVZhcnMudXBkYXRlUmVwbGFjZVZhcnMuYmluZChfc2VsZiwgY29sbGVjdCwgX3NlbGYucmVwbGFjZVZhcnMpKTtcblxuICAgICAgICAgICAgLy8gRG8gbm90IGlnbm9yZSBXeXNpd3lnIGZpZWxkcyBmb3IgdGhlIHB1cnBvc2Ugb2YgUmVwbGFjZSBWYXJzLlxuICAgICAgICAgICAgalF1ZXJ5KCd0ZXh0YXJlYVtpZF49d3lzaXd5Zy1hY2ZdJykub24oJ2NoYW5nZScsIHJlcGxhY2VWYXJzLnVwZGF0ZVJlcGxhY2VWYXJzLmJpbmQoX3NlbGYsIGNvbGxlY3QsIF9zZWxmLnJlcGxhY2VWYXJzKSk7XG4gICAgICAgICAgICBpZiAoWW9hc3RTRU8ud3AuX3RpbnlNQ0VIZWxwZXIpIHtcbiAgICAgICAgICAgICAgICBqUXVlcnkoJ3RleHRhcmVhW2lkXj13eXNpd3lnLWFjZl0nKS5lYWNoKCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIFlvYXN0U0VPLndwLl90aW55TUNFSGVscGVyLmFkZEV2ZW50SGFuZGxlcih0aGlzLmlkLCBbICdpbnB1dCcsICdjaGFuZ2UnLCAnY3V0JywgJ3Bhc3RlJyBdLFxuICAgICAgICAgICAgICAgICAgICAgICAgcmVwbGFjZVZhcnMudXBkYXRlUmVwbGFjZVZhcnMuYmluZChfc2VsZiwgY29sbGVjdCwgX3NlbGYucmVwbGFjZVZhcnMpKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cblxuXG4gICAgICAgICAgICAvL0Fsc28gcmVmcmVzaCBvbiBtZWRpYSBjbG9zZSBhcyBhdHRhY2htZW50IGRhdGEgbWlnaHQgaGF2ZSBjaGFuZ2VkXG4gICAgICAgICAgICB3cC5tZWRpYS5mcmFtZS5vbignY2xvc2UnLCBfc2VsZi5tYXliZVJlZnJlc2guYmluZChfc2VsZikgKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG59XG5cbkFwcC5wcm90b3R5cGUubWF5YmVSZWZyZXNoID0gZnVuY3Rpb24oKXtcblxuICAgIGlmICggYW5hbHlzaXNUaW1lb3V0ICkge1xuICAgICAgICB3aW5kb3cuY2xlYXJUaW1lb3V0KGFuYWx5c2lzVGltZW91dCk7XG4gICAgfVxuXG4gICAgYW5hbHlzaXNUaW1lb3V0ID0gd2luZG93LnNldFRpbWVvdXQoIGZ1bmN0aW9uKCkge1xuXG4gICAgICAgIGlmKGNvbmZpZy5kZWJ1Zyl7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnUmVjYWxjdWxhdGUuLi4nICsgbmV3IERhdGUoKSArICcoSW50ZXJuYWwpJyk7XG4gICAgICAgIH1cblxuICAgICAgICBZb2FzdFNFTy5hcHAucGx1Z2luUmVsb2FkZWQoY29uZmlnLnBsdWdpbk5hbWUpO1xuICAgIH0sIGNvbmZpZy5yZWZyZXNoUmF0ZSApO1xuXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEFwcDtcbiIsIi8qIGdsb2JhbCBfICovXG52YXIgY2FjaGUgPSByZXF1aXJlKCBcIi4vY2FjaGUuanNcIiApO1xuXG52YXIgcmVmcmVzaCA9IGZ1bmN0aW9uKGF0dGFjaG1lbnRfaWRzKXtcblxuICAgIHZhciB1bmNhY2hlZCA9IGNhY2hlLmdldFVuY2FjaGVkKGF0dGFjaG1lbnRfaWRzLCAnYXR0YWNobWVudCcpO1xuXG4gICAgaWYgKHVuY2FjaGVkLmxlbmd0aCA9PT0gMCl7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB3aW5kb3cud3AuYWpheC5wb3N0KCdxdWVyeS1hdHRhY2htZW50cycsIHtcbiAgICAgICAgJ3F1ZXJ5Jzoge1xuICAgICAgICAgICAgJ3Bvc3RfX2luJzogdW5jYWNoZWRcbiAgICAgICAgfVxuICAgIH0pLmRvbmUoZnVuY3Rpb24gKGF0dGFjaG1lbnRzKSB7XG5cbiAgICAgICAgXy5lYWNoKGF0dGFjaG1lbnRzLCBmdW5jdGlvbiAoYXR0YWNobWVudCkge1xuICAgICAgICAgICAgY2FjaGUuc2V0KGF0dGFjaG1lbnQuaWQsIGF0dGFjaG1lbnQsICdhdHRhY2htZW50Jyk7XG4gICAgICAgICAgICBZb2FzdEFDRkFuYWx5c2lzLm1heWJlUmVmcmVzaCgpO1xuICAgICAgICB9KTtcblxuICAgIH0pO1xuXG59O1xuXG52YXIgZ2V0ID0gZnVuY3Rpb24oIGlkICl7XG5cbiAgICB2YXIgYXR0YWNobWVudCA9IGNhY2hlLmdldChpZCwgJ2F0dGFjaG1lbnQnKTtcblxuICAgIGlmKCFhdHRhY2htZW50KSByZXR1cm4gZmFsc2U7XG5cbiAgICB2YXIgY2hhbmdlZEF0dGFjaG1lbnQgPSB3cC5tZWRpYS5hdHRhY2htZW50KCBpZCApO1xuXG4gICAgaWYoIGNoYW5nZWRBdHRhY2htZW50LmhhcygnYWx0JykgKXtcbiAgICAgICAgYXR0YWNobWVudC5hbHQgPSBjaGFuZ2VkQXR0YWNobWVudC5nZXQoJ2FsdCcpO1xuICAgIH1cblxuICAgIGlmKCBjaGFuZ2VkQXR0YWNobWVudC5oYXMoJ3RpdGxlJykgKXtcbiAgICAgICAgYXR0YWNobWVudC50aXRsZSA9IGNoYW5nZWRBdHRhY2htZW50LmdldCgndGl0bGUnKTtcbiAgICB9XG5cbiAgICByZXR1cm4gYXR0YWNobWVudDtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIHJlZnJlc2g6IHJlZnJlc2gsXG4gICAgZ2V0OiBnZXRcbn07IiwiLyogZ2xvYmFsIF8gKi9cbnZhciBDYWNoZSA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuY2xlYXIoJ2FsbCcpO1xufTtcblxudmFyIF9jYWNoZTtcblxuQ2FjaGUucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uKCBpZCwgdmFsdWUsIHN0b3JlICkge1xuXG4gICAgc3RvcmUgPSB0eXBlb2Ygc3RvcmUgIT09ICd1bmRlZmluZWQnID8gc3RvcmUgOiAnZGVmYXVsdCc7XG5cbiAgICBpZiggIShzdG9yZSBpbiBfY2FjaGUpICl7XG4gICAgICAgIF9jYWNoZVtzdG9yZV0gPSB7fTtcbiAgICB9XG5cbiAgICBfY2FjaGVbIHN0b3JlIF1bIGlkIF0gPSB2YWx1ZTtcbn07XG5cbkNhY2hlLnByb3RvdHlwZS5nZXQgPSAgZnVuY3Rpb24oIGlkLCBzdG9yZSApe1xuXG4gICAgc3RvcmUgPSB0eXBlb2Ygc3RvcmUgIT09ICd1bmRlZmluZWQnID8gc3RvcmUgOiAnZGVmYXVsdCc7XG5cbiAgICBpZiAoIHN0b3JlIGluIF9jYWNoZSAmJiBpZCBpbiBfY2FjaGVbIHN0b3JlIF0gKSB7XG4gICAgICAgIHJldHVybiBfY2FjaGVbIHN0b3JlIF1bIGlkIF07XG4gICAgfWVsc2V7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbn07XG5cbkNhY2hlLnByb3RvdHlwZS5nZXRVbmNhY2hlZCA9ICBmdW5jdGlvbihpZHMsIHN0b3JlKXtcblxuICAgIHN0b3JlID0gdHlwZW9mIHN0b3JlICE9PSAndW5kZWZpbmVkJyA/IHN0b3JlIDogJ2RlZmF1bHQnO1xuXG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuXG4gICAgaWRzID0gXy51bmlxKGlkcyk7XG5cbiAgICByZXR1cm4gaWRzLmZpbHRlcihmdW5jdGlvbihpZCl7XG4gICAgICAgIHZhciB2YWx1ZSA9IHRoYXQuZ2V0KGlkLCBzdG9yZSk7XG4gICAgICAgIHJldHVybiB2YWx1ZSA9PT0gZmFsc2U7XG4gICAgfSk7XG5cbn07XG5cbkNhY2hlLnByb3RvdHlwZS5jbGVhciA9ICBmdW5jdGlvbihzdG9yZSl7XG5cbiAgICBzdG9yZSA9IHR5cGVvZiBzdG9yZSAhPT0gJ3VuZGVmaW5lZCcgPyBzdG9yZSA6ICdkZWZhdWx0JztcblxuICAgIGlmKHN0b3JlID09PSAnYWxsJyl7XG4gICAgICAgIF9jYWNoZSA9IHt9O1xuICAgIH1lbHNle1xuICAgICAgICBfY2FjaGVbc3RvcmVdID0ge307XG4gICAgfVxuXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBDYWNoZSgpOyIsInZhciBjb25maWcgPSByZXF1aXJlKCBcIi4vLi4vY29uZmlnL2NvbmZpZy5qc1wiICk7XG52YXIgZmllbGRTZWxlY3RvcnMgPSBjb25maWcuZmllbGRTZWxlY3RvcnM7XG5cbnZhciBmaWVsZF9kYXRhID0gW107XG5cbnZhciBmaWVsZHMgPSBqUXVlcnkoJyNwb3N0LWJvZHksICNlZGl0dGFnJykuZmluZChmaWVsZFNlbGVjdG9ycy5qb2luKCcsJykpO1xuXG5maWVsZHMuZWFjaChmdW5jdGlvbigpIHtcblxuICAgIHZhciAkZWwgPSBqUXVlcnkodGhpcykucGFyZW50cygnLmZpZWxkJykubGFzdCgpO1xuXG4gICAgZmllbGRfZGF0YS5wdXNoKHtcbiAgICAgICAgJGVsICAgICA6ICRlbCxcbiAgICAgICAga2V5ICAgICA6ICRlbC5kYXRhKCdmaWVsZF9rZXknKSxcbiAgICAgICAgbmFtZSAgICA6ICRlbC5kYXRhKCdmaWVsZF9uYW1lJyksXG4gICAgICAgIHR5cGUgICAgOiAkZWwuZGF0YSgnZmllbGRfdHlwZScpXG4gICAgfSk7XG5cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZpZWxkX2RhdGE7IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigpe1xuICAgIHJldHVybiBfLm1hcChhY2YuZ2V0X2ZpZWxkcygpLCBmdW5jdGlvbihmaWVsZCl7XG5cbiAgICAgICAgdmFyIGZpZWxkX2RhdGEgPSBqUXVlcnkuZXh0ZW5kKCB0cnVlLCB7fSwgYWNmLmdldF9kYXRhKGpRdWVyeShmaWVsZCkpICk7XG4gICAgICAgIGZpZWxkX2RhdGEuJGVsID0galF1ZXJ5KGZpZWxkKTtcbiAgICAgICAgcmV0dXJuIGZpZWxkX2RhdGE7XG5cbiAgICB9KTtcbn07IiwiLyogZ2xvYmFsIGFjZiwgXyAqL1xuXG52YXIgY29uZmlnID0gcmVxdWlyZSggXCIuLy4uL2NvbmZpZy9jb25maWcuanNcIiApO1xudmFyIGhlbHBlciA9IHJlcXVpcmUoIFwiLi8uLi9oZWxwZXIuanNcIiApO1xudmFyIHNjcmFwZXJfc3RvcmUgPSByZXF1aXJlKCBcIi4vLi4vc2NyYXBlci1zdG9yZS5qc1wiICk7XG5cbnZhciBDb2xsZWN0ID0gZnVuY3Rpb24oKXtcblxufTtcblxuQ29sbGVjdC5wcm90b3R5cGUuZ2V0RmllbGREYXRhID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBmaWVsZF9kYXRhID0gdGhpcy5maWx0ZXJFeGNsdWRlZEZpZWxkcyh0aGlzLmZpbHRlckJyb2tlbih0aGlzLmZpbHRlckJsYWNrbGlzdCh0aGlzLmdldERhdGEoKSkpKTtcblxuICAgIHZhciB1c2VkX3R5cGVzID0gXy51bmlxKF8ucGx1Y2soZmllbGRfZGF0YSwgJ3R5cGUnKSk7XG5cbiAgICBpZihjb25maWcuZGVidWcpIHtcblxuICAgICAgICBjb25zb2xlLmxvZygnVXNlZCB0eXBlczonKVxuICAgICAgICBjb25zb2xlLmxvZyh1c2VkX3R5cGVzKTtcblxuICAgIH1cblxuICAgIF8uZWFjaCh1c2VkX3R5cGVzLCBmdW5jdGlvbih0eXBlKXtcbiAgICAgICAgZmllbGRfZGF0YSA9IHNjcmFwZXJfc3RvcmUuZ2V0U2NyYXBlcih0eXBlKS5zY3JhcGUoZmllbGRfZGF0YSk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gZmllbGRfZGF0YTtcbn07XG5cbkNvbGxlY3QucHJvdG90eXBlLmFwcGVuZCA9IGZ1bmN0aW9uKGRhdGEpe1xuXG4gICAgaWYoY29uZmlnLmRlYnVnKXtcbiAgICAgICAgY29uc29sZS5sb2coJ1JlY2FsY3VsYXRlLi4uJyArIG5ldyBEYXRlKCkpO1xuICAgIH1cblxuICAgIHZhciBmaWVsZF9kYXRhID0gdGhpcy5nZXRGaWVsZERhdGEoKTtcblxuICAgIF8uZWFjaChmaWVsZF9kYXRhLCBmdW5jdGlvbihmaWVsZCl7XG5cbiAgICAgICAgaWYodHlwZW9mIGZpZWxkLmNvbnRlbnQgIT09ICd1bmRlZmluZWQnICYmIGZpZWxkLmNvbnRlbnQgIT09ICcnKXtcbiAgICAgICAgICAgIGRhdGEgKz0gJ1xcbicgKyBmaWVsZC5jb250ZW50O1xuICAgICAgICB9XG5cbiAgICB9KTtcblxuICAgIGlmKGNvbmZpZy5kZWJ1Zyl7XG4gICAgICAgIGNvbnNvbGUubG9nKCdGaWVsZCBkYXRhOicpXG4gICAgICAgIGNvbnNvbGUudGFibGUoZmllbGRfZGF0YSk7XG5cbiAgICAgICAgY29uc29sZS5sb2coJ0RhdGE6JylcbiAgICAgICAgY29uc29sZS5sb2coZGF0YSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGRhdGE7XG5cbn07XG5cbkNvbGxlY3QucHJvdG90eXBlLmdldERhdGEgPSBmdW5jdGlvbigpe1xuXG4gICAgaWYoaGVscGVyLmFjZl92ZXJzaW9uID49IDUpe1xuICAgICAgICByZXR1cm4gcmVxdWlyZSggXCIuL2NvbGxlY3QtdjUuanNcIiApKCk7XG4gICAgfWVsc2V7XG4gICAgICAgIHJldHVybiByZXF1aXJlKCBcIi4vY29sbGVjdC12NC5qc1wiICk7XG4gICAgfVxuXG59O1xuXG5Db2xsZWN0LnByb3RvdHlwZS5maWx0ZXJCbGFja2xpc3QgPSBmdW5jdGlvbihmaWVsZF9kYXRhKXtcbiAgICByZXR1cm4gXy5maWx0ZXIoZmllbGRfZGF0YSwgZnVuY3Rpb24oZmllbGQpe1xuICAgICAgICByZXR1cm4gIV8uY29udGFpbnMoY29uZmlnLmJsYWNrbGlzdCwgZmllbGQudHlwZSk7XG4gICAgfSk7XG59O1xuXG5Db2xsZWN0LnByb3RvdHlwZS5maWx0ZXJFeGNsdWRlZEZpZWxkcyA9IGZ1bmN0aW9uKGZpZWxkX2RhdGEpe1xuICAgIHJldHVybiBfLmZpbHRlcihmaWVsZF9kYXRhLCBmdW5jdGlvbihmaWVsZCl7XG4gICAgICAgIHJldHVybiAhXy5jb250YWlucyhjb25maWcuZXhjbHVkZWRGaWVsZHMsIGZpZWxkLm5hbWUpO1xuICAgIH0pO1xufTtcblxuQ29sbGVjdC5wcm90b3R5cGUuZmlsdGVyQnJva2VuID0gZnVuY3Rpb24oZmllbGRfZGF0YSl7XG4gICAgcmV0dXJuIF8uZmlsdGVyKGZpZWxkX2RhdGEsIGZ1bmN0aW9uKGZpZWxkKXtcbiAgICAgICAgcmV0dXJuICgna2V5JyBpbiBmaWVsZCk7XG4gICAgfSk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBDb2xsZWN0KCk7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IFlvYXN0QUNGQW5hbHlzaXNDb25maWc7IiwidmFyIGNvbmZpZyA9IHJlcXVpcmUoIFwiLi9jb25maWcvY29uZmlnLmpzXCIgKTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgYWNmX3ZlcnNpb246IHBhcnNlSW50KGNvbmZpZy5hY2ZWZXJzaW9uLCAxMClcbn07IiwiLyogZ2xvYmFsIGpRdWVyeSwgWW9hc3RBQ0ZBbmFseXNpczogdHJ1ZSAqL1xuXG52YXIgQXBwID0gcmVxdWlyZSggXCIuL2FwcC5qc1wiICk7XG5cbihmdW5jdGlvbigkKSB7XG5cbiAgICAkKGRvY3VtZW50KS5yZWFkeShmdW5jdGlvbigpIHtcblxuICAgICAgICBpZiggXCJ1bmRlZmluZWRcIiAhPT0gdHlwZW9mIFlvYXN0U0VPKXtcblxuICAgICAgICAgICAgWW9hc3RBQ0ZBbmFseXNpcyA9IG5ldyBBcHAoKTtcblxuICAgICAgICB9XG5cbiAgICB9KTtcblxufShqUXVlcnkpKTsiLCIvKiBnbG9iYWwgXywgalF1ZXJ5LCBZb2FzdFNFTywgWW9hc3RSZXBsYWNlVmFyUGx1Z2luICovXG5cbnZhciBjb25maWcgPSByZXF1aXJlKCBcIi4vY29uZmlnL2NvbmZpZy5qc1wiICk7XG5cbnZhciBSZXBsYWNlVmFyID0gWW9hc3RSZXBsYWNlVmFyUGx1Z2luLlJlcGxhY2VWYXI7XG5cbnZhciBzdXBwb3J0ZWRUeXBlcyA9IFsnZW1haWwnLCAndGV4dCcsICd0ZXh0YXJlYScsICd1cmwnLCAnd3lzaXd5ZyddO1xuXG52YXIgY3JlYXRlUmVwbGFjZVZhcnMgPSBmdW5jdGlvbiAoY29sbGVjdCkge1xuICAgIGlmIChSZXBsYWNlVmFyID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgaWYgKGNvbmZpZy5kZWJ1Zykge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ1JlcGxhY2luZyBBQ0YgdmFyaWFibGVzIGluIHRoZSBTbmlwcGV0IFdpbmRvdyByZXF1aXJlcyB0aGUgbGF0ZXN0IHZlcnNpb24gb2Ygd29yZHByZXNzLXNlby4nKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgZmllbGREYXRhICAgPSBfLmZpbHRlcihjb2xsZWN0LmdldEZpZWxkRGF0YSgpLCBmdW5jdGlvbiAoZmllbGQpIHsgcmV0dXJuIF8uY29udGFpbnMoc3VwcG9ydGVkVHlwZXMsIGZpZWxkLnR5cGUpIH0pO1xuICAgIHJlcGxhY2VWYXJzID0ge31cblxuICAgIF8uZWFjaChmaWVsZERhdGEsIGZ1bmN0aW9uKGZpZWxkKSB7XG4gICAgICAgIC8vIFJlbW92ZSBIVE1MIHRhZ3MgdXNpbmcgalF1ZXJ5IGluIGNhc2Ugb2YgYSB3eXNpd3lnIGZpZWxkLlxuICAgICAgICB2YXIgY29udGVudCA9IChmaWVsZC50eXBlID09PSAnd3lzaXd5ZycpID8galF1ZXJ5KCBqUXVlcnkucGFyc2VIVE1MKCBmaWVsZC5jb250ZW50KSApLnRleHQoKSA6IGZpZWxkLmNvbnRlbnQ7XG5cbiAgICAgICAgcmVwbGFjZVZhcnNbZmllbGQubmFtZV0gPSBuZXcgUmVwbGFjZVZhciggJyUlY2ZfJytmaWVsZC5uYW1lKyclJScsIGNvbnRlbnQsIHsgc291cmNlOiAnZGlyZWN0JyB9ICk7XG4gICAgICAgIFlvYXN0U0VPLndwLnJlcGxhY2VWYXJzUGx1Z2luLmFkZFJlcGxhY2VtZW50KCByZXBsYWNlVmFyc1tmaWVsZC5uYW1lXSApO1xuICAgICAgICBpZiAoY29uZmlnLmRlYnVnKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIkNyZWF0ZWQgUmVwbGFjZVZhciBmb3I6IFwiLCBmaWVsZC5uYW1lLCBcIiB3aXRoOiBcIiwgY29udGVudCwgcmVwbGFjZVZhcnNbZmllbGQubmFtZV0pO1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICByZXR1cm4gcmVwbGFjZVZhcnM7XG59O1xuXG52YXIgdXBkYXRlUmVwbGFjZVZhcnMgPSBmdW5jdGlvbiAoY29sbGVjdCwgcmVwbGFjZV92YXJzKSB7XG4gICAgaWYgKFJlcGxhY2VWYXIgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBpZiAoY29uZmlnLmRlYnVnKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnUmVwbGFjaW5nIEFDRiB2YXJpYWJsZXMgaW4gdGhlIFNuaXBwZXQgV2luZG93IHJlcXVpcmVzIHRoZSBsYXRlc3QgdmVyc2lvbiBvZiB3b3JkcHJlc3Mtc2VvLicpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBmaWVsZERhdGEgPSBfLmZpbHRlcihjb2xsZWN0LmdldEZpZWxkRGF0YSgpLCBmdW5jdGlvbiAoZmllbGQpIHsgcmV0dXJuIF8uY29udGFpbnMoc3VwcG9ydGVkVHlwZXMsIGZpZWxkLnR5cGUpIH0pO1xuICAgIF8uZWFjaChmaWVsZERhdGEsIGZ1bmN0aW9uKGZpZWxkKSB7XG4gICAgICAgIC8vIFJlbW92ZSBIVE1MIHRhZ3MgdXNpbmcgalF1ZXJ5IGluIGNhc2Ugb2YgYSB3eXNpd3lnIGZpZWxkLlxuICAgICAgICB2YXIgY29udGVudCA9IChmaWVsZC50eXBlID09PSAnd3lzaXd5ZycpID8galF1ZXJ5KGpRdWVyeS5wYXJzZUhUTUwoZmllbGQuY29udGVudCkpLnRleHQoKSA6IGZpZWxkLmNvbnRlbnQ7XG5cbiAgICAgICAgcmVwbGFjZVZhcnNbZmllbGQubmFtZV0ucmVwbGFjZW1lbnQgPSBjb250ZW50O1xuICAgICAgICBpZiAoY29uZmlnLmRlYnVnKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIlVwZGF0ZWQgUmVwbGFjZVZhciBmb3I6IFwiLCBmaWVsZC5uYW1lLCBcIiB3aXRoOiBcIiwgY29udGVudCwgcmVwbGFjZVZhcnNbZmllbGQubmFtZV0pO1xuICAgICAgICB9XG4gICAgfSk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjcmVhdGVSZXBsYWNlVmFyczogY3JlYXRlUmVwbGFjZVZhcnMsXG4gICAgdXBkYXRlUmVwbGFjZVZhcnM6IHVwZGF0ZVJlcGxhY2VWYXJzXG59O1xuIiwiLyogZ2xvYmFsIF8gKi9cbnZhciBjb25maWcgPSByZXF1aXJlKCBcIi4vY29uZmlnL2NvbmZpZy5qc1wiICk7XG5cbnZhciBzY3JhcGVyT2JqZWN0cyA9IHtcblxuICAgIC8vQmFzaWNcbiAgICAndGV4dCc6ICAgICAgICAgcmVxdWlyZSggXCIuL3NjcmFwZXIvc2NyYXBlci50ZXh0LmpzXCIgKSxcbiAgICAndGV4dGFyZWEnOiAgICAgcmVxdWlyZSggXCIuL3NjcmFwZXIvc2NyYXBlci50ZXh0YXJlYS5qc1wiICksXG4gICAgJ2VtYWlsJzogICAgICAgIHJlcXVpcmUoIFwiLi9zY3JhcGVyL3NjcmFwZXIuZW1haWwuanNcIiApLFxuICAgICd1cmwnOiAgICAgICAgICByZXF1aXJlKCBcIi4vc2NyYXBlci9zY3JhcGVyLnVybC5qc1wiICksXG5cbiAgICAvL0NvbnRlbnRcbiAgICAnd3lzaXd5Zyc6ICAgICAgcmVxdWlyZSggXCIuL3NjcmFwZXIvc2NyYXBlci53eXNpd3lnLmpzXCIgKSxcbiAgICAvL1RPRE86IEFkZCBvZW1iZWQgaGFuZGxlclxuICAgICdpbWFnZSc6ICAgICAgICByZXF1aXJlKCBcIi4vc2NyYXBlci9zY3JhcGVyLmltYWdlLmpzXCIgKSxcbiAgICAnZ2FsbGVyeSc6ICAgICAgcmVxdWlyZSggXCIuL3NjcmFwZXIvc2NyYXBlci5nYWxsZXJ5LmpzXCIgKSxcblxuICAgIC8vQ2hvaWNlXG4gICAgLy9UT0RPOiBzZWxlY3QsIGNoZWNrYm94LCByYWRpb1xuXG4gICAgLy9SZWxhdGlvbmFsXG4gICAgJ3RheG9ub215JzogICAgIHJlcXVpcmUoIFwiLi9zY3JhcGVyL3NjcmFwZXIudGF4b25vbXkuanNcIiApXG5cbiAgICAvL2pRdWVyeVxuICAgIC8vVE9ETzogZ29vZ2xlX21hcCwgZGF0ZV9waWNrZXIsIGNvbG9yX3BpY2tlclxuXG59O1xuXG52YXIgc2NyYXBlcnMgPSB7fTtcblxuLyoqXG4gKiBTZXQgYSBzY3JhcGVyIG9iamVjdCBvbiB0aGUgc3RvcmUuIEV4aXN0aW5nIHNjcmFwZXJzIHdpbGwgYmUgb3ZlcndyaXR0ZW4uXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IHNjcmFwZXJcbiAqIEBwYXJhbSB7c3RyaW5nfSB0eXBlXG4gKi9cbnZhciBzZXRTY3JhcGVyID0gZnVuY3Rpb24oc2NyYXBlciwgdHlwZSl7XG5cbiAgICBpZihjb25maWcuZGVidWcgJiYgaGFzU2NyYXBlcih0eXBlKSl7XG4gICAgICAgIGNvbnNvbGUud2FybignU2NyYXBlciBmb3IgXCInICsgdHlwZSArICdcIiBhbHJlYWR5IGV4aXN0cyBhbmQgd2lsbCBiZSBvdmVyd3JpdHRlbi4nICk7XG4gICAgfVxuXG4gICAgc2NyYXBlcnNbdHlwZV0gPSBzY3JhcGVyO1xuXG4gICAgcmV0dXJuIHNjcmFwZXI7XG59O1xuXG4vKipcbiAqIFJldHVybnMgdGhlIHNjcmFwZXIgb2JqZWN0IGZvciBhIGZpZWxkIHR5cGUuXG4gKiBJZiB0aGVyZSBpcyBubyBzY3JhcGVyIG9iamVjdCBmb3IgdGhpcyBmaWVsZCB0eXBlIGEgbm8tb3Agc2NyYXBlciBpcyByZXR1cm5lZC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gdHlwZVxuICogQHJldHVybnMge09iamVjdH1cbiAqL1xudmFyIGdldFNjcmFwZXIgPSBmdW5jdGlvbih0eXBlKXtcblxuICAgIGlmKGhhc1NjcmFwZXIodHlwZSkpe1xuICAgICAgICByZXR1cm4gc2NyYXBlcnNbdHlwZV07XG4gICAgfWVsc2UgaWYodHlwZSBpbiBzY3JhcGVyT2JqZWN0cyl7XG4gICAgICAgIHJldHVybiBzZXRTY3JhcGVyKG5ldyBzY3JhcGVyT2JqZWN0c1t0eXBlXSgpLCB0eXBlKTtcbiAgICB9ZWxzZXtcbiAgICAgICAgLy9JZiB3ZSBkbyBub3QgaGF2ZSBhIHNjcmFwZXIganVzdCBwYXNzIHRoZSBmaWVsZHMgdGhyb3VnaCBzbyBpdCB3aWxsIGJlIGZpbHRlcmVkIG91dCBieSB0aGUgYXBwLlxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc2NyYXBlOiBmdW5jdGlvbihmaWVsZHMpe1xuICAgICAgICAgICAgICAgIGlmKGNvbmZpZy5kZWJ1Zyl7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybignTm8gU2NyYXBlciBmb3IgZmllbGQgdHlwZTogJyArIHR5cGUgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZpZWxkcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG59XG5cbi8qKlxuICogQ2hlY2tzIGlmIHRoZXJlIGFscmVhZHkgaXMgYSBzY3JhcGVyIGZvciBhIGZpZWxkIHR5cGUgaW4gdGhlIHN0b3JlLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSB0eXBlXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAqL1xudmFyIGhhc1NjcmFwZXIgPSBmdW5jdGlvbih0eXBlKXtcblxuICAgIHJldHVybiAodHlwZSBpbiBzY3JhcGVycyk7XG5cbn07XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuXG4gICAgc2V0U2NyYXBlcjogc2V0U2NyYXBlcixcbiAgICBnZXRTY3JhcGVyOiBnZXRTY3JhcGVyXG5cbn07IiwidmFyIHNjcmFwZXJzID0gcmVxdWlyZSggXCIuLy4uL3NjcmFwZXItc3RvcmUuanNcIiApO1xuXG52YXIgU2NyYXBlciA9IGZ1bmN0aW9uKCkge307XG5cblNjcmFwZXIucHJvdG90eXBlLnNjcmFwZSA9IGZ1bmN0aW9uKGZpZWxkcyl7XG5cbiAgICB2YXIgdGhhdCA9IHRoaXM7XG5cbiAgICBmaWVsZHMgPSBfLm1hcChmaWVsZHMsIGZ1bmN0aW9uKGZpZWxkKXtcblxuICAgICAgICBpZihmaWVsZC50eXBlICE9PSAnZW1haWwnKXtcbiAgICAgICAgICAgIHJldHVybiBmaWVsZDtcbiAgICAgICAgfVxuXG4gICAgICAgIGZpZWxkLmNvbnRlbnQgPSBmaWVsZC4kZWwuZmluZCgnaW5wdXRbdHlwZT1lbWFpbF1baWRePWFjZl0nKS52YWwoKTtcblxuICAgICAgICByZXR1cm4gZmllbGQ7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gZmllbGRzO1xuXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNjcmFwZXI7IiwidmFyIGF0dGFjaG1lbnRDYWNoZSA9IHJlcXVpcmUoIFwiLi8uLi9jYWNoZS9jYWNoZS5hdHRhY2htZW50cy5qc1wiICk7XG52YXIgc2NyYXBlcnMgPSByZXF1aXJlKCBcIi4vLi4vc2NyYXBlci1zdG9yZS5qc1wiICk7XG5cbnZhciBTY3JhcGVyID0gZnVuY3Rpb24oKSB7fTtcblxuU2NyYXBlci5wcm90b3R5cGUuc2NyYXBlID0gZnVuY3Rpb24oZmllbGRzKXtcblxuICAgIHZhciB0aGF0ID0gdGhpcztcblxuICAgIHZhciBhdHRhY2htZW50X2lkcyA9IFtdO1xuXG4gICAgZmllbGRzID0gXy5tYXAoZmllbGRzLCBmdW5jdGlvbihmaWVsZCl7XG5cbiAgICAgICAgaWYoZmllbGQudHlwZSAhPT0gJ2dhbGxlcnknKXtcbiAgICAgICAgICAgIHJldHVybiBmaWVsZDtcbiAgICAgICAgfVxuXG4gICAgICAgIGZpZWxkLmNvbnRlbnQgPSAnJztcblxuICAgICAgICBmaWVsZC4kZWwuZmluZCgnLmFjZi1nYWxsZXJ5LWF0dGFjaG1lbnQgaW5wdXRbdHlwZT1oaWRkZW5dJykuZWFjaCggZnVuY3Rpb24gKGluZGV4LCBlbGVtZW50KXtcblxuICAgICAgICAgICAgLy9UT0RPOiBJcyB0aGlzIHRoZSBiZXN0IHdheSB0byBnZXQgdGhlIGF0dGFjaG1lbnQgaWQ/XG4gICAgICAgICAgICB2YXIgYXR0YWNobWVudF9pZCA9IGpRdWVyeSggdGhpcyApLnZhbCgpO1xuXG4gICAgICAgICAgICAvL0NvbGxlY3QgYWxsIGF0dGFjaG1lbnQgaWRzIGZvciBjYWNoZSByZWZyZXNoXG4gICAgICAgICAgICBhdHRhY2htZW50X2lkcy5wdXNoKGF0dGFjaG1lbnRfaWQpO1xuXG4gICAgICAgICAgICAvL0lmIHdlIGhhdmUgdGhlIGF0dGFjaG1lbnQgZGF0YSBpbiB0aGUgY2FjaGUgd2UgY2FuIHJldHVybiBhIHVzZWZ1bCB2YWx1ZVxuICAgICAgICAgICAgaWYoYXR0YWNobWVudENhY2hlLmdldChhdHRhY2htZW50X2lkLCAnYXR0YWNobWVudCcpKXtcblxuICAgICAgICAgICAgICAgIHZhciBhdHRhY2htZW50ID0gYXR0YWNobWVudENhY2hlLmdldChhdHRhY2htZW50X2lkLCAnYXR0YWNobWVudCcpO1xuXG4gICAgICAgICAgICAgICAgZmllbGQuY29udGVudCArPSAnPGltZyBzcmM9XCInICsgYXR0YWNobWVudC51cmwgKyAnXCIgYWx0PVwiJyArIGF0dGFjaG1lbnQuYWx0ICsgJ1wiIHRpdGxlPVwiJyArIGF0dGFjaG1lbnQudGl0bGUgKyAnXCI+JztcblxuICAgICAgICAgICAgfVxuXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBmaWVsZDtcbiAgICB9KTtcblxuICAgIGF0dGFjaG1lbnRDYWNoZS5yZWZyZXNoKGF0dGFjaG1lbnRfaWRzKTtcblxuICAgIHJldHVybiBmaWVsZHM7XG5cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gU2NyYXBlcjsiLCJ2YXIgYXR0YWNobWVudENhY2hlID0gcmVxdWlyZSggXCIuLy4uL2NhY2hlL2NhY2hlLmF0dGFjaG1lbnRzLmpzXCIgKTtcbnZhciBzY3JhcGVycyA9IHJlcXVpcmUoIFwiLi8uLi9zY3JhcGVyLXN0b3JlLmpzXCIgKTtcblxudmFyIFNjcmFwZXIgPSBmdW5jdGlvbigpIHt9O1xuXG5TY3JhcGVyLnByb3RvdHlwZS5zY3JhcGUgPSBmdW5jdGlvbihmaWVsZHMpe1xuXG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuXG4gICAgdmFyIGF0dGFjaG1lbnRfaWRzID0gW107XG5cbiAgICBmaWVsZHMgPSBfLm1hcChmaWVsZHMsIGZ1bmN0aW9uKGZpZWxkKXtcblxuICAgICAgICBpZihmaWVsZC50eXBlICE9PSAnaW1hZ2UnKXtcbiAgICAgICAgICAgIHJldHVybiBmaWVsZDtcbiAgICAgICAgfVxuXG4gICAgICAgIGZpZWxkLmNvbnRlbnQgPSAnJztcblxuICAgICAgICB2YXIgYXR0YWNobWVudF9pZCA9IGZpZWxkLiRlbC5maW5kKCdpbnB1dFt0eXBlPWhpZGRlbl0nKS52YWwoKTtcblxuICAgICAgICBhdHRhY2htZW50X2lkcy5wdXNoKGF0dGFjaG1lbnRfaWQpO1xuXG4gICAgICAgIGlmKGF0dGFjaG1lbnRDYWNoZS5nZXQoYXR0YWNobWVudF9pZCwgJ2F0dGFjaG1lbnQnKSl7XG5cbiAgICAgICAgICAgIHZhciBhdHRhY2htZW50ID0gYXR0YWNobWVudENhY2hlLmdldChhdHRhY2htZW50X2lkLCAnYXR0YWNobWVudCcpO1xuXG4gICAgICAgICAgICBmaWVsZC5jb250ZW50ICs9ICc8aW1nIHNyYz1cIicgKyBhdHRhY2htZW50LnVybCArICdcIiBhbHQ9XCInICsgYXR0YWNobWVudC5hbHQgKyAnXCIgdGl0bGU9XCInICsgYXR0YWNobWVudC50aXRsZSArICdcIj4nO1xuXG4gICAgICAgIH1cblxuXG4gICAgICAgIHJldHVybiBmaWVsZDtcbiAgICB9KTtcblxuICAgIGF0dGFjaG1lbnRDYWNoZS5yZWZyZXNoKGF0dGFjaG1lbnRfaWRzKTtcblxuICAgIHJldHVybiBmaWVsZHM7XG5cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gU2NyYXBlcjsiLCJ2YXIgc2NyYXBlcnMgPSByZXF1aXJlKCBcIi4vLi4vc2NyYXBlci1zdG9yZS5qc1wiICk7XG5cbnZhciBTY3JhcGVyID0gZnVuY3Rpb24oKSB7fTtcblxuU2NyYXBlci5wcm90b3R5cGUuc2NyYXBlID0gZnVuY3Rpb24oZmllbGRzKXtcblxuICAgIHZhciB0aGF0ID0gdGhpcztcblxuICAgIGZpZWxkcyA9IF8ubWFwKGZpZWxkcywgZnVuY3Rpb24oZmllbGQpe1xuXG4gICAgICAgIGlmKGZpZWxkLnR5cGUgIT09ICd0YXhvbm9teScpe1xuICAgICAgICAgICAgcmV0dXJuIGZpZWxkO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHRlcm1zID0gW107XG5cbiAgICAgICAgaWYoIGZpZWxkLiRlbC5maW5kKCcuYWNmLXRheG9ub215LWZpZWxkW2RhdGEtdHlwZT1cIm11bHRpX3NlbGVjdFwiXScpLmxlbmd0aCA+IDAgKXtcblxuICAgICAgICAgICAgdGVybXMgPSBfLnBsdWNrKFxuICAgICAgICAgICAgICAgIGZpZWxkLiRlbC5maW5kKCcuYWNmLXRheG9ub215LWZpZWxkW2RhdGEtdHlwZT1cIm11bHRpX3NlbGVjdFwiXSBzZWxlY3QnKVxuICAgICAgICAgICAgICAgICAgICAuc2VsZWN0MignZGF0YScpXG4gICAgICAgICAgICAgICAgLCAndGV4dCdcbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgfWVsc2UgaWYoIGZpZWxkLiRlbC5maW5kKCcuYWNmLXRheG9ub215LWZpZWxkW2RhdGEtdHlwZT1cImNoZWNrYm94XCJdJykubGVuZ3RoID4gMCApe1xuXG4gICAgICAgICAgICB0ZXJtcyA9IF8ucGx1Y2soXG4gICAgICAgICAgICAgICAgZmllbGQuJGVsLmZpbmQoJy5hY2YtdGF4b25vbXktZmllbGRbZGF0YS10eXBlPVwiY2hlY2tib3hcIl0gaW5wdXRbdHlwZT1cImNoZWNrYm94XCJdOmNoZWNrZWQnKVxuICAgICAgICAgICAgICAgICAgICAubmV4dCgpLFxuICAgICAgICAgICAgICAgICd0ZXh0Q29udGVudCdcbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgfWVsc2UgaWYoIGZpZWxkLiRlbC5maW5kKCdpbnB1dFt0eXBlPWNoZWNrYm94XTpjaGVja2VkJykubGVuZ3RoID4gMCApe1xuXG4gICAgICAgICAgICB0ZXJtcyA9IF8ucGx1Y2soXG4gICAgICAgICAgICAgICAgZmllbGQuJGVsLmZpbmQoJ2lucHV0W3R5cGU9Y2hlY2tib3hdOmNoZWNrZWQnKVxuICAgICAgICAgICAgICAgICAgICAucGFyZW50KCksXG4gICAgICAgICAgICAgICAgJ3RleHRDb250ZW50J1xuICAgICAgICAgICAgKTtcblxuICAgICAgICB9ZWxzZSBpZiggZmllbGQuJGVsLmZpbmQoJ3NlbGVjdCBvcHRpb246Y2hlY2tlZCcpLmxlbmd0aCA+IDAgKXtcblxuICAgICAgICAgICAgdGVybXMgPSBfLnBsdWNrKFxuICAgICAgICAgICAgICAgIGZpZWxkLiRlbC5maW5kKCdzZWxlY3Qgb3B0aW9uOmNoZWNrZWQnKSxcbiAgICAgICAgICAgICAgICAndGV4dENvbnRlbnQnXG4gICAgICAgICAgICApO1xuXG4gICAgICAgIH1cblxuICAgICAgICB0ZXJtcyA9IF8ubWFwKCB0ZXJtcywgZnVuY3Rpb24odGVybSl7IHJldHVybiB0ZXJtLnRyaW0oKTsgfSApO1xuXG4gICAgICAgIGlmKHRlcm1zLmxlbmd0aD4wKXtcbiAgICAgICAgICAgIGZpZWxkLmNvbnRlbnQgPSAnPHVsPlxcbjxsaT4nICsgdGVybXMuam9pbignPC9saT5cXG48bGk+JykgKyAnPC9saT5cXG48L3VsPic7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZmllbGQ7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gZmllbGRzO1xuXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNjcmFwZXI7XG4iLCJ2YXIgY29uZmlnID0gcmVxdWlyZSggXCIuLy4uL2NvbmZpZy9jb25maWcuanNcIiApO1xudmFyIHNjcmFwZXJzID0gcmVxdWlyZSggXCIuLy4uL3NjcmFwZXItc3RvcmUuanNcIiApO1xuXG52YXIgU2NyYXBlciA9IGZ1bmN0aW9uKCkge307XG5cblNjcmFwZXIucHJvdG90eXBlLnNjcmFwZSA9IGZ1bmN0aW9uKGZpZWxkcyl7XG5cbiAgICB2YXIgdGhhdCA9IHRoaXM7XG5cbiAgICBmaWVsZHMgPSBfLm1hcChmaWVsZHMsIGZ1bmN0aW9uKGZpZWxkKXtcblxuICAgICAgICBpZihmaWVsZC50eXBlICE9PSAndGV4dCcpe1xuICAgICAgICAgICAgcmV0dXJuIGZpZWxkO1xuICAgICAgICB9XG5cbiAgICAgICAgZmllbGQuY29udGVudCA9IGZpZWxkLiRlbC5maW5kKCdpbnB1dFt0eXBlPXRleHRdW2lkXj1hY2ZdJykudmFsKCk7XG5cbiAgICAgICAgZmllbGQgPSB0aGF0LndyYXBJbkhlYWRsaW5lKGZpZWxkKTtcblxuICAgICAgICByZXR1cm4gZmllbGQ7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gZmllbGRzO1xuXG59O1xuXG5TY3JhcGVyLnByb3RvdHlwZS53cmFwSW5IZWFkbGluZSA9IGZ1bmN0aW9uKGZpZWxkKXtcblxuICAgIHZhciBsZXZlbCA9IHRoaXMuaXNIZWFkbGluZShmaWVsZCk7XG4gICAgaWYobGV2ZWwpe1xuICAgICAgICBmaWVsZC5jb250ZW50ID0gJzxoJyArIGxldmVsICsgJz4nICsgZmllbGQuY29udGVudCArICc8L2gnICsgbGV2ZWwgKyAnPic7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZpZWxkO1xufTtcblxuU2NyYXBlci5wcm90b3R5cGUuaXNIZWFkbGluZSA9IGZ1bmN0aW9uKGZpZWxkKXtcblxuICAgIHZhciBsZXZlbCA9IGZhbHNlO1xuXG4gICAgdmFyIGxldmVsID0gXy5maW5kKGNvbmZpZy5zY3JhcGVyLnRleHQuaGVhZGxpbmVzLCBmdW5jdGlvbih2YWx1ZSwga2V5KXtcbiAgICAgICAgcmV0dXJuIGZpZWxkLmtleSA9PT0ga2V5O1xuICAgIH0pO1xuXG4gICAgLy9JdCBoYXMgdG8gYmUgYW4gaW50ZWdlclxuICAgIGlmKGxldmVsKXtcbiAgICAgICAgbGV2ZWwgPSBwYXJzZUludChsZXZlbCwgMTApO1xuICAgIH1cblxuICAgIC8vSGVhZGxpbmVzIG9ubHkgZXhpc3QgZnJvbSBoMSB0byBoNlxuICAgIGlmKGxldmVsPDEgfHwgbGV2ZWw+Nil7XG4gICAgICAgIGxldmVsID0gZmFsc2U7XG4gICAgfVxuXG4gICAgcmV0dXJuIGxldmVsO1xuXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNjcmFwZXI7IiwidmFyIHNjcmFwZXJzID0gcmVxdWlyZSggXCIuLy4uL3NjcmFwZXItc3RvcmUuanNcIiApO1xuXG52YXIgU2NyYXBlciA9IGZ1bmN0aW9uKCkge307XG5cblNjcmFwZXIucHJvdG90eXBlLnNjcmFwZSA9IGZ1bmN0aW9uKGZpZWxkcyl7XG5cbiAgICB2YXIgdGhhdCA9IHRoaXM7XG5cbiAgICBmaWVsZHMgPSBfLm1hcChmaWVsZHMsIGZ1bmN0aW9uKGZpZWxkKXtcblxuICAgICAgICBpZihmaWVsZC50eXBlICE9PSAndGV4dGFyZWEnKXtcbiAgICAgICAgICAgIHJldHVybiBmaWVsZDtcbiAgICAgICAgfVxuXG4gICAgICAgIGZpZWxkLmNvbnRlbnQgPSBmaWVsZC4kZWwuZmluZCgndGV4dGFyZWFbaWRePWFjZl0nKS52YWwoKTtcblxuICAgICAgICByZXR1cm4gZmllbGQ7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gZmllbGRzO1xuXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNjcmFwZXI7IiwidmFyIHNjcmFwZXJzID0gcmVxdWlyZSggXCIuLy4uL3NjcmFwZXItc3RvcmUuanNcIiApO1xuXG52YXIgU2NyYXBlciA9IGZ1bmN0aW9uKCkge307XG5cblNjcmFwZXIucHJvdG90eXBlLnNjcmFwZSA9IGZ1bmN0aW9uKGZpZWxkcyl7XG5cbiAgICB2YXIgdGhhdCA9IHRoaXM7XG5cbiAgICBmaWVsZHMgPSBfLm1hcChmaWVsZHMsIGZ1bmN0aW9uKGZpZWxkKXtcblxuICAgICAgICBpZihmaWVsZC50eXBlICE9PSAndXJsJyl7XG4gICAgICAgICAgICByZXR1cm4gZmllbGQ7XG4gICAgICAgIH1cblxuICAgICAgICBmaWVsZC5jb250ZW50ID0gZmllbGQuJGVsLmZpbmQoJ2lucHV0W3R5cGU9dXJsXVtpZF49YWNmXScpLnZhbCgpO1xuXG4gICAgICAgIHJldHVybiBmaWVsZDtcbiAgICB9KTtcblxuICAgIHJldHVybiBmaWVsZHM7XG5cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gU2NyYXBlcjsiLCJ2YXIgc2NyYXBlcnMgPSByZXF1aXJlKCBcIi4vLi4vc2NyYXBlci1zdG9yZS5qc1wiICk7XG5cbnZhciBTY3JhcGVyID0gZnVuY3Rpb24oKSB7fTtcblxuU2NyYXBlci5wcm90b3R5cGUuc2NyYXBlID0gZnVuY3Rpb24oZmllbGRzKXtcblxuICAgIHZhciB0aGF0ID0gdGhpcztcblxuICAgIGZpZWxkcyA9IF8ubWFwKGZpZWxkcywgZnVuY3Rpb24oZmllbGQpe1xuXG4gICAgICAgIGlmKGZpZWxkLnR5cGUgIT09ICd3eXNpd3lnJyl7XG4gICAgICAgICAgICByZXR1cm4gZmllbGQ7XG4gICAgICAgIH1cblxuICAgICAgICBmaWVsZC5jb250ZW50ID0gZ2V0Q29udGVudFRpbnlNQ0UoZmllbGQpO1xuXG4gICAgICAgIHJldHVybiBmaWVsZDtcbiAgICB9KTtcblxuICAgIHJldHVybiBmaWVsZHM7XG5cbn07XG5cbi8qKlxuICogQWRhcHRlZCBmcm9tIHdwLXNlby1zaG9ydGNvZGUtcGx1Z2luLTMwNS5qczoxMTUtMTI2XG4gKlxuICogQHJldHVybnMge3N0cmluZ31cbiAqL1xudmFyIGdldENvbnRlbnRUaW55TUNFID0gZnVuY3Rpb24oZmllbGQpIHtcbiAgICB2YXIgdGV4dGFyZWEgPSBmaWVsZC4kZWwuZmluZCgndGV4dGFyZWEnKVswXTtcblxuICAgIHZhciBlZGl0b3JJRCA9IHRleHRhcmVhLmlkO1xuXG4gICAgdmFyIHZhbCA9IHRleHRhcmVhLnZhbHVlO1xuXG4gICAgaWYgKCBpc1RpbnlNQ0VBdmFpbGFibGUoZWRpdG9ySUQpICkge1xuICAgICAgICB2YWwgPSB0aW55TUNFLmdldCggZWRpdG9ySUQgKSAmJiB0aW55TUNFLmdldCggZWRpdG9ySUQgKS5nZXRDb250ZW50KCkgfHwgJyc7XG4gICAgfVxuXG4gICAgcmV0dXJuIHZhbDtcbn07XG5cbi8qKlxuICogQWRhcHRlZCBmcm9tIHdwLXNlby1wb3N0LXNjcmFwZXItcGx1Z2luLTMxMC5qczoxOTYtMjEwXG4gKlxuICpcbiAqIEBwYXJhbSBlZGl0b3JJRFxuICogQHJldHVybnMge2Jvb2xlYW59XG4gKi9cbnZhciBpc1RpbnlNQ0VBdmFpbGFibGUgPSBmdW5jdGlvbihlZGl0b3JJRCkge1xuICAgIGlmICggdHlwZW9mIHRpbnlNQ0UgPT09ICd1bmRlZmluZWQnIHx8XG4gICAgICAgIHR5cGVvZiB0aW55TUNFLmVkaXRvcnMgPT09ICd1bmRlZmluZWQnIHx8XG4gICAgICAgIHRpbnlNQ0UuZWRpdG9ycy5sZW5ndGggPT09IDAgfHxcbiAgICAgICAgdGlueU1DRS5nZXQoIGVkaXRvcklEICkgPT09IG51bGwgfHxcbiAgICAgICAgdGlueU1DRS5nZXQoIGVkaXRvcklEICkuaXNIaWRkZW4oKSApIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHJldHVybiB0cnVlO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBTY3JhcGVyOyJdfQ==
