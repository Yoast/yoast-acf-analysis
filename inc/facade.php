<?php
/**
 * ACF Content Analysis for Yoast SEO plugin file.
 *
 * @package YoastACFAnalysis
 */

/**
 * Class Yoast_ACF_Analysis_Facade
 */
class Yoast_ACF_Analysis_Facade {

	/**
	 * Returns the identifier of the plugin.
	 *
	 * @return string The identifier of the plugin.
	 */
	public static function get_plugin_name() {
		return 'yoast-acf-analysis';
	}

	/**
	 * Retrieves the registry to use.
	 *
	 * @return Yoast_ACF_Analysis_Registry
	 */
	public static function get_registry() {
		static $registry = null;

		$registry ??= new Yoast_ACF_Analysis_Registry();

		return $registry;
	}

	/**
	 * Wraps the notification with an unique identifier.
	 *
	 * @deprecated 2.4.0 Use hard-coded filter names instead.
	 * @codeCoverageIgnore
	 *
	 * @param string $filter_name Filter to wrap.
	 *
	 * @return string Full filter name to use.
	 */
	public static function get_filter_name( $filter_name ) {
		// Example: yoast-acf-analysis/refresh_rate.
		return sprintf( '%1$s/%2$s', self::get_plugin_name(), ltrim( $filter_name, '/' ) );
	}
}
