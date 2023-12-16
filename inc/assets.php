<?php
/**
 * ACF Content Analysis for Yoast SEO plugin file.
 *
 * @package YoastACFAnalysis
 */

/**
 * Class Yoast_ACF_Analysis_Frontend
 */
class Yoast_ACF_Analysis_Assets {

	/**
	 * Plugin information.
	 *
	 * @var array
	 */
	protected $plugin_data;

	/**
	 * Initialize.
	 *
	 * @return void
	 */
	public function init() {
		$this->plugin_data = get_plugin_data( AC_SEO_ACF_ANALYSIS_PLUGIN_FILE );

		add_action( 'admin_enqueue_scripts', [ $this, 'enqueue_scripts' ], 11 );
	}

	/**
	 * Enqueue JavaScript file to feed data to Yoast Content Analyses.
	 *
	 * @return void
	 */
	public function enqueue_scripts() {
		/**
		 * Yoast ACF plugin configuration.
		 *
		 * @var Yoast_ACF_Analysis_Configuration
		 */
		$config = Yoast_ACF_Analysis_Facade::get_registry()->get( 'config' );

		// Post page enqueue.
		if ( wp_script_is( WPSEO_Admin_Asset_Manager::PREFIX . 'post-edit' )
			|| wp_script_is( WPSEO_Admin_Asset_Manager::PREFIX . 'post-edit-classic' )
		) {
			wp_enqueue_script(
				'yoast-acf-analysis-post',
				plugins_url( '/js/yoast-acf-analysis.js', AC_SEO_ACF_ANALYSIS_PLUGIN_FILE ),
				[ 'jquery', 'underscore' ],
				$this->plugin_data['Version'],
				true
			);

			wp_localize_script( 'yoast-acf-analysis-post', 'YoastACFAnalysisConfig', $config->to_array() );
		}

		// Term page enqueue.
		if ( wp_script_is( WPSEO_Admin_Asset_Manager::PREFIX . 'term-edit' ) ) {
			wp_enqueue_script(
				'yoast-acf-analysis-term',
				plugins_url( '/js/yoast-acf-analysis.js', AC_SEO_ACF_ANALYSIS_PLUGIN_FILE ),
				[ 'jquery', WPSEO_Admin_Asset_Manager::PREFIX . 'term-edit' ],
				$this->plugin_data['Version'],
				true
			);

			wp_localize_script( 'yoast-acf-analysis-term', 'YoastACFAnalysisConfig', $config->to_array() );
		}
	}
}
