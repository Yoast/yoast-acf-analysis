<?php
/**
 * ACF Content Analysis for Yoast SEO plugin file.
 *
 * @package YoastACFAnalysis
 */

/**
 * Checks for the required Yoast SEO version.
 */
final class Yoast_ACF_Analysis_Dependency_Yoast_SEO implements Yoast_ACF_Analysis_Dependency {

	public const MINIMAL_REQUIRED_VERSION = '20.8-RC1';

	/**
	 * Checks if this dependency is met.
	 *
	 * @return bool
	 */
	public function is_met() {
		if ( ! defined( 'WPSEO_VERSION' ) ) {
			return false;
		}

		if ( ! $this->has_required_version() ) {
			return false;
		}

		return true;
	}

	/**
	 * Registers the notifications to be shown.
	 *
	 * @return void
	 */
	public function register_notifications() {
		if ( ! defined( 'WPSEO_VERSION' ) ) {
			add_action( 'admin_notices', [ $this, 'message_plugin_not_activated' ] );
			return;
		}

		if ( ! $this->has_required_version() ) {
			add_action( 'admin_notices', [ $this, 'message_minimum_version' ] );
		}
	}

	/**
	 * Notify that we need Yoast SEO for WordPress to be installed and active.
	 *
	 * @return void
	 */
	public function message_plugin_not_activated() {
		$message = sprintf(
			/* translators: %1$s resolves to ACF Content Analysis for Yoast SEO, %2$s resolves to Yoast SEO. */
			__( '%1$s requires %2$s to be installed and activated.', 'acf-content-analysis-for-yoast-seo' ),
			'ACF Content Analysis for Yoast SEO',
			'Yoast SEO'
		);

		printf( '<div class="error"><p>%s</p></div>', esc_html( $message ) );
	}

	/**
	 * Notify that we need Yoast SEO for WordPress to be installed and active.
	 *
	 * @return void
	 */
	public function message_minimum_version() {
		$message = sprintf(
			/* translators: %1$s resolves to Yoast SEO, %2$s resolves to ACF Content Analysis for Yoast SEO. */
			__( 'Please upgrade the %1$s plugin to the latest version to allow the %2$s module to work.', 'acf-content-analysis-for-yoast-seo' ),
			'Yoast SEO',
			'ACF Content Analysis for Yoast SEO'
		);

		printf( '<div class="error"><p>%s</p></div>', esc_html( $message ) );
	}

	/**
	 * Retrieves only the major version of a provided version string.
	 *
	 * @param string $version Version to get the major version of.
	 *
	 * @return string The major version part of the version string.
	 */
	private function get_major_version( $version ) {
		$parts = explode( '.', $version, 3 );
		return implode( '.', array_slice( $parts, 0, 2 ) );
	}

	/**
	 * Determines if the WPSEO_VERSION is at a useful version.
	 *
	 * @return bool
	 */
	private function has_required_version() {
		return version_compare( $this->get_major_version( WPSEO_VERSION ), self::MINIMAL_REQUIRED_VERSION, '>=' );
	}
}
