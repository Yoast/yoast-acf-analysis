<?php
/**
 * ACF Content Analysis for Yoast SEO plugin.
 *
 * @package YoastACFAnalysis
 *
 * @wordpress-plugin
 * Plugin Name: ACF Content Analysis for Yoast SEO
 * Plugin URI:  https://wordpress.org/plugins/acf-content-analysis-for-yoast-seo/
 * Description: Ensure that Yoast SEO analyzes all Advanced Custom Fields 5.7+ content including Flexible Content and Repeaters.
 * Version:     3.1
 * Author:      Thomas Kräftner, ViktorFroberg, marol87, pekz0r, angrycreative, Team Yoast
 * Author URI:  https://yoa.st/team-yoast-acf
 * License:     GPL v3
 * Text Domain: acf-content-analysis-for-yoast-seo
 * Domain Path: /languages/
 * Requires at least: 6.1
 * Requires PHP: 7.2.5
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! defined( 'AC_SEO_ACF_ANALYSIS_PLUGIN_PATH' ) ) {
	define( 'AC_SEO_ACF_ANALYSIS_PLUGIN_SLUG', 'ac-yoast-seo-acf-content-analysis' );
	define( 'AC_SEO_ACF_ANALYSIS_PLUGIN_FILE', __FILE__ );
	define( 'AC_SEO_ACF_ANALYSIS_PLUGIN_PATH', plugin_dir_path( __FILE__ ) );
	define( 'AC_SEO_ACF_ANALYSIS_PLUGIN_URL', plugins_url( '', __FILE__ ) . '/' );
	define( 'AC_SEO_ACF_ANALYSIS_PLUGIN_NAME', untrailingslashit( plugin_basename( __FILE__ ) ) );
}

$yoast_acf_autoload_file = '/vendor/autoload.php';

if ( is_file( AC_SEO_ACF_ANALYSIS_PLUGIN_PATH . $yoast_acf_autoload_file ) ) {
	require AC_SEO_ACF_ANALYSIS_PLUGIN_PATH . $yoast_acf_autoload_file;
}

/**
 * Triggers a message whenever the class is missing.
 */
if ( ! class_exists( 'AC_Yoast_SEO_ACF_Content_Analysis' ) ) {
	add_action( 'admin_notices', 'yoast_acf_report_missing_acf' );
}
else {
	$ac_yoast_seo_acf_analysis = new AC_Yoast_SEO_ACF_Content_Analysis();
	$ac_yoast_seo_acf_analysis->init();
}

/**
 * Show admin notice when ACF is missing.
 */
function yoast_acf_report_missing_acf() {
	echo '<div class="error"><p>';
	printf(
		/* translators: %1$s resolves to ACF Content Analysis for Yoast SEO */
		esc_html__( '%1$s could not be loaded because of missing files.', 'acf-content-analysis-for-yoast-seo' ),
		'ACF Content Analysis for Yoast SEO'
	);
	echo '</p></div>';
}

/* ********************* DEPRECATED FUNCTIONS ********************* */

/**
 * Loads translations.
 *
 * @deprecated 2.0.1
 * @codeCoverageIgnore
 */
function yoast_acf_analysis_load_textdomain() {
	// As we require WordPress 4.6 and higher, we don't need to load the translation files manually anymore.
}
