/* global _ */
require( "../scraper-store.js" );

var Scraper = function() {};

/**
 * Scraper for the page link field type.
 *
 * @param {Object} fields Fields to parse.
 *
 * @returns {Object} Mapped list of fields.
 */
Scraper.prototype.scrape = function( fields ) {
	/**
	 * Set content for all page link fields as a-tag with title, url and target.
	 * Return the fields object containing all fields.
	 */
	return _.map( fields, function( field ) {
		if ( field.type !== "page_link" ) {
			return field;
		}

		var title = field.$el.find( "select option:selected" ).text(),
			postId = field.$el.find("select option:selected").val()

		if (title && postId) {
			field.content = "<a href=\"/?p=" + url + "\">" + title + "</a>";
		}

		return field;
	} );
};

module.exports = Scraper;
