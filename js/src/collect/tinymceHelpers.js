/* global tinyMCE */

/**
 * Returns whether or not the tinyMCE script is available on the page.
 *
 * @returns {boolean} True when tinyMCE is loaded.
 */
function isTinyMCELoaded() {
	return (
		typeof tinyMCE !== "undefined" &&
		typeof tinyMCE.editors !== "undefined" &&
		tinyMCE.editors.length !== 0
	);
}

/**
 * Returns whether or not a tinyMCE editor with the given ID is available.
 *
 * @param {string} editorID The ID of the tinyMCE editor.
 *
 * @returns {void}
 */
function isTinyMCEAvailable( editorID ) {
	if ( ! isTinyMCELoaded() ) {
		return false;
	}

	const editor = tinyMCE.get( editorID );

	return (
		editor !== null && ! editor.isHidden()
	);
}

module.exports = isTinyMCEAvailable;
