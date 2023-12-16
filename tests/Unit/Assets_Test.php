<?php

namespace Yoast\WP\ACF\Tests\Unit;

use Brain\Monkey\Functions;
use Yoast\WPTestUtils\BrainMonkey\TestCase;
use Yoast_ACF_Analysis_Assets;

/**
 * Class Assets_Test.
 *
 * @covers Yoast_ACF_Analysis_Assets
 *
 * @preserveGlobalState disabled
 * @runTestsInSeparateProcesses
 */
final class Assets_Test extends TestCase {

	/**
	 * Test the init hook and determines whether the proper assets are loaded.
	 *
	 * @return void
	 */
	public function testInitHook() {
		\define( 'AC_SEO_ACF_ANALYSIS_PLUGIN_FILE', '/directory/file' );
		Functions\expect( 'get_plugin_data' )
			->once()
			->with( \AC_SEO_ACF_ANALYSIS_PLUGIN_FILE )
			->andReturn(
				[
					'Version' => '2.0.0',
				]
			);

		$testee = new Yoast_ACF_Analysis_Assets();
		$testee->init();

		$this->assertSame( 11, \has_action( 'admin_enqueue_scripts', [ $testee, 'enqueue_scripts' ] ) );
	}
}
