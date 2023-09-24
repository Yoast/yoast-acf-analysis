<?php
/**
 * ACF Content Analysis for Yoast SEO plugin file.
 *
 * @package YoastACFAnalysis
 */

/**
 * Class Yoast_ACF_Analysis_Configuration_Default
 */
class Yoast_ACF_Analysis_Configuration {

	/**
	 * The blacklist type.
	 *
	 * @var Yoast_ACF_Analysis_String_Store
	 */
	protected $blacklist_type;

	/**
	 * The blacklist's name.
	 *
	 * @var Yoast_ACF_Analysis_String_Store
	 */
	protected $blacklist_name;

	/**
	 * The field selectors for usage in ACF4.
	 *
	 * @var Yoast_ACF_Analysis_String_Store
	 */
	protected $field_selectors;

	/**
	 * Refresh rate to use.
	 *
	 * @var int
	 */
	protected $refresh_rate = 1000;

	/**
	 * Scraper configuration.
	 *
	 * @var array
	 */
	protected $scraper_config = [];

	/**
	 * Yoast_ACF_Analysis_Configuration constructor.
	 *
	 * @param Yoast_ACF_Analysis_String_Store $blacklist_type  Blacklist Type Configuration Object.
	 * @param Yoast_ACF_Analysis_String_Store $blacklist_name  Blacklist Name Configuration Object.
	 * @param Yoast_ACF_Analysis_String_Store $field_selectors Field Selectors Configuration Object.
	 */
	public function __construct(
		Yoast_ACF_Analysis_String_Store $blacklist_type,
		Yoast_ACF_Analysis_String_Store $blacklist_name,
		Yoast_ACF_Analysis_String_Store $field_selectors
	) {
		$this->blacklist_type  = $blacklist_type;
		$this->blacklist_name  = $blacklist_name;
		$this->field_selectors = $field_selectors;
	}

	/**
	 * Retrieves the ACF version.
	 *
	 * @return string The ACF version.
	 */
	public function get_acf_version() {
		// ACF 5 introduces `acf_get_setting`, so this might not always be available.
		if ( function_exists( 'acf_get_setting' ) ) {
			return acf_get_setting( 'version' );
		}

		// Fall back on filter use.
		// phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals -- ACF hook.
		return apply_filters( 'acf/get_info', 'version' );
	}

	/**
	 * Retrieves the blacklist type store.
	 *
	 * @return Yoast_ACF_Analysis_String_Store The blacklist type store.
	 */
	public function get_blacklist_type() {

		/**
		 * Filters the fields to ignore based on field type.
		 *
		 * @since      2.0.0
		 * @deprecated 2.4.0. Use the {@see 'Yoast\WP\ACF\blacklist_type'} filter instead.
		 *
		 * @param Yoast_ACF_Analysis_String_Store $blacklist_type Store instance of ignored field types
		 */
		$blacklist_type = apply_filters_deprecated(
			'yoast-acf-analysis/blacklist_type',
			[ $this->blacklist_type ],
			'YoastSEO ACF 2.4.0',
			'Yoast\WP\ACF\blacklist_type'
		);

		/**
		 * Filters the fields to ignore based on field type.
		 *
		 * You can add or remove field types to be analysed.
		 * Be aware that when adding types this will only have an effect if there is a scraper for the type.
		 *
		 * @since 2.4.0
		 *
		 * @param Yoast_ACF_Analysis_String_Store $blacklist_type Store instance of ignored field types
		 */
		$blacklist_type = apply_filters(
			'Yoast\WP\ACF\blacklist_type',
			$blacklist_type
		);

		if ( $blacklist_type instanceof Yoast_ACF_Analysis_String_Store ) {
			return $blacklist_type;
		}

		return $this->blacklist_type;
	}

	/**
	 * Retrieves the blacklist name store.
	 *
	 * @return Yoast_ACF_Analysis_String_Store The blacklist name store.
	 */
	public function get_blacklist_name() {

		/**
		 * Filters the fields to ignore based on field name.
		 *
		 * @since      1.0.0
		 * @deprecated 2.0.0 Use the {@see 'Yoast\WP\ACF\blacklist_name'} filter instead.
		 *
		 * @param array $legacy_names Array with field names
		 */
		$legacy_names = apply_filters_deprecated(
			'ysacf_exclude_fields',
			[ [] ],
			'YoastSEO ACF 2.0.0',
			'Yoast\WP\ACF\blacklist_name'
		);

		if ( is_array( $legacy_names ) && ! empty( $legacy_names ) ) {
			foreach ( $legacy_names as $legacy_name ) {
				$this->blacklist_name->add( $legacy_name );
			}
		}

		/**
		 * Filters the fields to ignore based on field name.
		 *
		 * @since      2.0.0
		 * @deprecated 2.4.0 Use the {@see 'Yoast\WP\ACF\blacklist_name'} filter instead.
		 *
		 * @param Yoast_ACF_Analysis_String_Store $blacklist_name Store instance of ignored field names
		 */
		$blacklist_name = apply_filters_deprecated(
			'yoast-acf-analysis/blacklist_name',
			[ $this->blacklist_name ],
			'YoastSEO ACF 2.4.0',
			'Yoast\WP\ACF\blacklist_name'
		);

		/**
		 * Filters the fields to ignore based on field name.
		 *
		 * You can add or remove fields to be analysed based on the field name.
		 *
		 * @since 2.4.0
		 *
		 * @param Yoast_ACF_Analysis_String_Store $blacklist_name Store instance of ignored field names
		 */
		$blacklist_name = apply_filters(
			'Yoast\WP\ACF\blacklist_name',
			$blacklist_name
		);

		if ( $blacklist_name instanceof Yoast_ACF_Analysis_String_Store ) {
			return $blacklist_name;
		}

		return $this->blacklist_name;
	}

	/**
	 * Determines if debug mode is enabled.
	 *
	 * @return bool True if debug mode is enabled. False otherwise.
	 */
	public function is_debug() {
		return ( defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG === true );
	}

	/**
	 * Retrieves the scraper configuration.
	 *
	 * @return array The scraper configuration.
	 */
	public function get_scraper_config() {
		/**
		 * Filters the scraper configuration.
		 *
		 * @since      2.0.0
		 * @deprecated 2.4.0 Use the {@see 'Yoast\WP\ACF\scraper_config'} filter instead.
		 *
		 * @param array $scraper_config Nested array of scraper configuration
		 */
		$scraper_config = apply_filters_deprecated(
			'yoast-acf-analysis/scraper_config',
			[ $this->scraper_config ],
			'YoastSEO ACF 2.4.0',
			'Yoast\WP\ACF\scraper_config'
		);

		/**
		 * Filters the scraper configuration.
		 *
		 * This nested array holds configuration specific to certain scrapers (for specific field types)
		 * Before using this filter see if there isn't a more specific one like {@see 'Yoast\WP\ACF\headlines'}.
		 *
		 * @since 2.4.0
		 *
		 * @param array $scraper_config Nested array of scraper configuration
		 */
		$scraper_config = apply_filters(
			'Yoast\WP\ACF\scraper_config',
			$scraper_config
		);

		if ( is_array( $scraper_config ) ) {
			return $scraper_config;
		}

		return [];
	}

	/**
	 * Retrieves the refresh rate to be used.
	 *
	 * @return int The number of milliseconds between scrape runs.
	 */
	public function get_refresh_rate() {
		/**
		 * Refresh rate for changes to ACF fields
		 *
		 * @since      2.0.0
		 * @deprecated 2.4.0 Use the {@see 'Yoast\WP\ACF\refresh_rate'} filter instead.
		 *
		 * @param int $refresh_rate Refresh rates in milliseconds
		 */
		$refresh_rate = apply_filters_deprecated(
			'yoast-acf-analysis/refresh_rate',
			[ $this->refresh_rate ],
			'YoastSEO ACF 2.4.0',
			'Yoast\WP\ACF\refresh_rate'
		);

		/**
		 * Refresh rate for changes to ACF fields
		 *
		 * This plugin limits the rate at which changes to ACF fields are reported to Yoast SEO.
		 * By default it will only report changes to Yoast SEO after no changes have happened for 1000 milliseconds.
		 * This filter allows to change this to any value above 200 milliseconds.
		 *
		 * @since 2.4.0
		 *
		 * @param int $refresh_rate Refresh rates in milliseconds
		 */
		$refresh_rate = apply_filters( 'Yoast\WP\ACF\refresh_rate', $refresh_rate );
		$refresh_rate = intval( $refresh_rate, 10 );

		// Make sure the refresh rate is not too low, this will introduce problems in the browser of the user.
		return max( 200, $refresh_rate );
	}

	/**
	 * Retrieves the field selectors store.
	 *
	 * @return Yoast_ACF_Analysis_String_Store Field selectors store.
	 */
	public function get_field_selectors() {
		/**
		 * Filters the CSS selectors that are used to find the fields when using ACF4.
		 *
		 * @since      2.0.0
		 * @deprecated 2.4.0 Use the {@see 'Yoast\WP\ACF\field_selectors'} filter instead.
		 *
		 * @param Yoast_ACF_Analysis_String_Store $field_selectors Field selector store instance
		 */
		$field_selectors = apply_filters_deprecated(
			'yoast-acf-analysis/field_selectors',
			[ $this->field_selectors ],
			'YoastSEO ACF 2.4.0',
			'Yoast\WP\ACF\field_selectors'
		);

		/**
		 * Filters the CSS selectors that are used to find the fields when using ACF4.
		 *
		 * This is an advanced filter that should rarely if ever be used, especially because it only affects ACF4.
		 * If you want to exclude certain fields by type or name there are the more specific filters
		 * {@see 'Yoast\WP\ACF\blacklist_type'} and {@see 'Yoast\WP\ACF\blacklist_name'} for these.
		 *
		 * @see get_blacklist_type()
		 * @see get_blacklist_name()
		 *
		 * @since 2.4.0
		 *
		 * @param Yoast_ACF_Analysis_String_Store $field_selectors Field selector store instance
		 */
		$field_selectors = apply_filters(
			'Yoast\WP\ACF\field_selectors',
			$field_selectors
		);

		if ( $field_selectors instanceof Yoast_ACF_Analysis_String_Store ) {
			return $field_selectors;
		}

		return $this->field_selectors;
	}

	/**
	 * Retrieves the field order.
	 *
	 * @return array The field order configuration.
	 */
	public function get_field_order() {
		/**
		 * Filters the order of the ACF fields relative to the post_content.
		 *
		 * @since      2.2.0
		 * @deprecated 2.4.0 Use the {@see 'Yoast\WP\ACF\field_order'} filter instead.
		 *
		 * @param array $order_config {
		 *      @type string $field_name     Name of the ACF field
		 *      @type int    $order          Integer
		 * }
		 */
		$field_order = apply_filters_deprecated(
			'yoast-acf-analysis/field_order',
			[ [] ],
			'YoastSEO ACF 2.4.0',
			'Yoast\WP\ACF\field_order'
		);

		/**
		 * Filters the order of the ACF fields relative to the post_content.
		 *
		 * The array has the ACF field key as the array key and the value should be an integer
		 * where negative values result in the field value being placed before the default post_content.
		 *
		 * This is how to force the field with the key "field_591eb45f2be86" to be placed before the post_content:
		 *
		 *     $order_config = array(
		 *          'field_591eb45f2be86' => -1
		 *     );
		 *
		 * @since 2.4.0
		 *
		 * @param array $order_config {
		 *      @type string $field_name     Name of the ACF field
		 *      @type int    $order          Integer
		 * }
		 */
		return apply_filters( 'Yoast\WP\ACF\field_order', $field_order );
	}

	/**
	 * Retrieves an array representation of the current object.
	 *
	 * @return array<string, mixed>
	 */
	public function to_array() {
		return [
			'pluginName'     => Yoast_ACF_Analysis_Facade::get_plugin_name(),
			'acfVersion'     => $this->get_acf_version(),
			'scraper'        => $this->get_scraper_config(),
			'refreshRate'    => $this->get_refresh_rate(),
			'blacklistType'  => $this->get_blacklist_type()->to_array(),
			'blacklistName'  => $this->get_blacklist_name()->to_array(),
			'fieldSelectors' => $this->get_field_selectors()->to_array(),
			'fieldOrder'     => $this->get_field_order(),
			'debug'          => $this->is_debug(),
		];
	}
}
