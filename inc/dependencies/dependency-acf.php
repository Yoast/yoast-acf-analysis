<?php
/**
 * ACF Content Analysis for Yoast SEO plugin file.
 *
 * @package YoastACFAnalysis
 */

/**
 * Checks whether ACF is installed.
 */
final class Yoast_ACF_Analysis_Dependency_ACF implements Yoast_ACF_Analysis_Dependency {

	const MINIMAL_REQUIRED_ACF_VERSION = '6.0.0';

	/**
	 * Checks if ACF is active.
	 *
	 * @return bool
	 */
	public function is_met() {
		if ( ! class_exists( 'acf' ) ) {
			return false;
		}

		if ( defined( 'ACF_VERSION' ) && version_compare( ACF_VERSION, self::MINIMAL_REQUIRED_ACF_VERSION, '<' ) ) {
			return false;
		}

		return true;
	}

	/**
	 * Registers the notification to show when the conditions are not met.
	 */
	public function register_notifications() {
		add_action( 'admin_notices', [ $this, 'message_plugin_not_activated' ] );
	}

	/**
	 * Notify that we need ACF to be installed and active.
	 */
	public function message_plugin_not_activated() {
		$message = sprintf(
			/* translators: %1$s resolves to ACF Content Analysis for Yoast SEO, %2$s resolves to Advanced Custom Fields, %3$s resolves to the minimum required ACF version. */
			__( '%1$s requires %2$s (free or pro) %3$s or higher to be installed and activated.', 'acf-content-analysis-for-yoast-seo' ),
			'ACF Content Analysis for Yoast SEO',
			'Advanced Custom Fields',
			self::MINIMAL_REQUIRED_ACF_VERSION
		);

		printf( '<div class="error"><p>%s</p></div>', esc_html( $message ) );
	}
}
