<?php
/**
 * ACF Content Analysis for Yoast SEO plugin file.
 *
 * @package YoastACFAnalysis
 */

/**
 * Adds ACF data to the content analyses of WordPress SEO.
 */
class AC_Yoast_SEO_ACF_Content_Analysis {

	/**
	 * Yoast_ACF_Analysis init.
	 *
	 * Add hooks and filters.
	 *
	 * @return void
	 */
	public function init() {
		add_action( 'admin_init', [ $this, 'admin_init' ] );
	}

	/**
	 * Check if all requirements are met and boot plugin if so.
	 *
	 * @return void
	 */
	public function admin_init() {
		$dependencies = new Yoast_ACF_Analysis_Requirements();
		$dependencies->add_dependency( new Yoast_ACF_Analysis_Dependency_Yoast_SEO() );
		$dependencies->add_dependency( new Yoast_ACF_Analysis_Dependency_ACF() );

		if ( ! $dependencies->are_met() ) {
			return;
		}

		$this->boot();

		$this->register_config_filters();

		$assets = new Yoast_ACF_Analysis_Assets();
		$assets->init();
	}

	/**
	 * Boots the plugin.
	 *
	 * @return void
	 */
	public function boot() {
		$registry = Yoast_ACF_Analysis_Facade::get_registry();

		$configuration = $registry->get( 'config' );

		if ( $configuration !== null && $configuration instanceof Yoast_ACF_Analysis_Configuration ) {
			return;
		}

		$configuration = new Yoast_ACF_Analysis_Configuration(
			$this->get_blacklist_type(),
			$this->get_blacklist_name(),
			$this->get_field_selectors()
		);

		/**
		 * Filters the plugin configuration instance.
		 *
		 * You can replace the whole plugin configuration with a custom instance.
		 * Only use this as a last resort as there are multiple more specific filters in the default configuration.
		 *
		 * @see Yoast_ACF_Analysis_Configuration
		 *
		 * @since      2.0.0
		 * @deprecated 2.4.0. Use the {@see 'Yoast\WP\ACF\config'} filter instead.
		 *
		 * @param Yoast_ACF_Analysis_Configuration $configuration Plugin configuration instance
		 */
		$custom_configuration = apply_filters_deprecated(
			'yoast-acf-analysis/config',
			[ $configuration ],
			'YoastSEO ACF 2.4.0',
			'Yoast\WP\ACF\config'
		);

		/**
		 * Filters the plugin configuration instance.
		 *
		 * You can replace the whole plugin configuration with a custom instance.
		 * Only use this as a last resort as there are multiple more specific filters in the default configuration.
		 *
		 * @see Yoast_ACF_Analysis_Configuration
		 *
		 * @since 2.4.0
		 *
		 * @param Yoast_ACF_Analysis_Configuration $configuration Plugin configuration instance
		 */
		$custom_configuration = apply_filters( 'Yoast\WP\ACF\config', $custom_configuration );

		if ( $custom_configuration instanceof Yoast_ACF_Analysis_Configuration ) {
			$configuration = $custom_configuration;
		}

		$registry->add( 'config', $configuration );
	}

	/**
	 * Filters the Scraper Configuration to add the headlines configuration for the text scraper.
	 *
	 * @return void
	 */
	protected function register_config_filters() {
		add_filter(
			'Yoast\WP\ACF\scraper_config',
			[ $this, 'filter_scraper_config' ]
		);
	}

	/**
	 * Enhances the scraper config with headlines configuration.
	 *
	 * @param array $scraper_config The scraper configuration.
	 *
	 * @return array The enhanced scraper config.
	 */
	public function filter_scraper_config( $scraper_config ) {
		/**
		 * Filters which ACF text fields are to be treated as a headline by the text scraper.
		 *
		 * @since      2.0.0
		 * @deprecated 2.4.0. Use the {@see 'Yoast\WP\ACF\headlines'} filter instead.
		 *
		 * @param array $headlines_config {
		 *      @type string $field_name     Name of the ACF field
		 *      @type int    $headline_level Headline level 1 to 6
		 * }
		 */
		$headline = apply_filters_deprecated(
			'yoast-acf-analysis/headlines',
			[ [] ],
			'YoastSEO ACF 2.4.0',
			'Yoast\WP\ACF\headlines'
		);

		/**
		 * Filters which ACF text fields are to be treated as a headline by the text scraper.
		 *
		 * The array has the ACF field key as the array key and the value should be an integer from 1 to 6
		 * that corresponds to the 6 possible HTML tags <h1> to <h6>.
		 *
		 * So this is how to make the field with the key "field_591eb45f2be86" a <h3>:
		 *
		 *     $headlines_config = array(
		 *          'field_591eb45f2be86' => 3
		 *     );
		 *
		 * @since 2.4.0
		 *
		 * @param array $headlines_config {
		 *      @type string $field_name     Name of the ACF field
		 *      @type int    $headline_level Headline level 1 to 6
		 * }
		 */
		$headline = apply_filters( 'Yoast\WP\ACF\headlines', $headline );

		$scraper_config['text'] = [
			'headlines' => $headline,
		];

		return $scraper_config;
	}

	/**
	 * Retrieves the default field selectors for ACF4.
	 *
	 * @return Yoast_ACF_Analysis_String_Store The blacklist string store.
	 */
	protected function get_field_selectors() {
		$field_selectors = new Yoast_ACF_Analysis_String_Store();

		$default_field_selectors = [
			// Text.
			'input[type=text][id^=acf]',

			// Textarea.
			'textarea[id^=acf]',

			// Email.
			'input[type=email][id^=acf]',

			// URL.
			'input[type=url][id^=acf]',

			// WYSIWYG.
			'textarea[id^=wysiwyg-acf]',

			// Image.
			'input[type=hidden].acf-image-value',

			// Taxonomy.
			'.acf-taxonomy-field',
		];

		foreach ( $default_field_selectors as $field_selector ) {
			$field_selectors->add( $field_selector );
		}

		return $field_selectors;
	}

	/**
	 * Retrieves the default blacklist.
	 *
	 * @return Yoast_ACF_Analysis_String_Store The blacklist string store.
	 */
	protected function get_blacklist_type() {

		$blacklist = new Yoast_ACF_Analysis_String_Store();

		$default_blacklist = [
			'number',
			'password',

			'file',

			'select',
			'checkbox',
			'radio',
			'true_false',

			'post_object',
			'page_link',
			'relationship',
			'user',

			'date_picker',
			'color_picker',

			'message',
			'tab',
			'repeater',
			'flexible_content',
			'group',

			'url',
			'email',
		];

		foreach ( $default_blacklist as $type ) {
			$blacklist->add( $type );
		}

		/**
		 * Disable Pro fields for anything but ACF 5 pro.
		 *
		 * - ACF v5 FREE does not support these fields.
		 */
		if ( ! defined( 'ACF_PRO' ) || ! ACF_PRO ) {

			$blacklist->remove( 'gallery' );
			$blacklist->remove( 'repeater' );
			$blacklist->remove( 'flexible_content' );
		}

		return $blacklist;
	}

	/**
	 * Gets a new string store.
	 *
	 * @return Yoast_ACF_Analysis_String_Store A new blacklist string store.
	 */
	protected function get_blacklist_name() {
		return new Yoast_ACF_Analysis_String_Store();
	}
}
