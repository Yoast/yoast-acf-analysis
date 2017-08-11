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
