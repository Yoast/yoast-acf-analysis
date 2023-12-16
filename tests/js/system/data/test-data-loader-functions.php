<?php
/**
 * ACF Content Analysis for Yoast SEO test file.
 *
 * @package YoastACFAnalysis
 */

// Only load data when Plugin API is available because it is not needed in Unit Tests anyway.
if ( function_exists( 'add_action' ) ) {
	add_action( 'admin_init', 'yoast_acf_analysis_test_data_loader', 11 );
}

/**
 * Loads ACF test data for the ACF version being tested.
 *
 * @return void
 */
function yoast_acf_analysis_test_data_loader() {

	if ( ! defined( 'AC_YOAST_ACF_ANALYSIS_ENVIRONMENT' ) || AC_YOAST_ACF_ANALYSIS_ENVIRONMENT !== 'development' ) {
		return;
	}

	$registry      = Yoast_ACF_Analysis_Facade::get_registry();
	$configuration = $registry->get( 'config' );

	$version = 4;
	if ( version_compare( $configuration->get_acf_version(), 5, '>=' ) ) {
		$version = 5;
	}

	require_once AC_SEO_ACF_ANALYSIS_PLUGIN_PATH . '/tests/js/system/data/acf' . $version . '.php';
}
