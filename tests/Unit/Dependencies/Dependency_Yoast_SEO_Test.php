<?php

namespace Yoast\WP\ACF\Tests\Unit\Dependencies;

use Yoast\WPTestUtils\BrainMonkey\TestCase;
use Yoast_ACF_Analysis_Dependency_Yoast_SEO;

/**
 * Class Dependency_Yoast_SEO_Test.
 *
 * @covers Yoast_ACF_Analysis_Dependency_Yoast_SEO
 *
 * @runTestsInSeparateProcesses
 */
final class Dependency_Yoast_SEO_Test extends TestCase {

	/**
	 * Tests that requirements are not met when Yoast SEO can't be found.
	 *
	 * @return void
	 */
	public function testFail() {
		$testee = new Yoast_ACF_Analysis_Dependency_Yoast_SEO();

		$this->assertFalse( $testee->is_met() );
	}

	/**
	 * Tests that requirements are met when Yoast SEO can be found, based on the existence of a version number.
	 *
	 * @return void
	 */
	public function testPass() {
		\define( 'WPSEO_VERSION', '24.6' );

		$testee = new Yoast_ACF_Analysis_Dependency_Yoast_SEO();
		$this->assertTrue( $testee->is_met() );
	}

	/**
	 * Tests that requirements are not met when an old and incompatible version Yoast SEO is installed.
	 *
	 * @return void
	 */
	public function testOldVersion() {
		\define( 'WPSEO_VERSION', '24.5' );

		$testee = new Yoast_ACF_Analysis_Dependency_Yoast_SEO();
		$this->assertFalse( $testee->is_met() );
	}

	/**
	 * Tests the appearance of the admin notice when requirements are not met.
	 *
	 * @return void
	 */
	public function testAdminNotice() {
		$testee = new Yoast_ACF_Analysis_Dependency_Yoast_SEO();
		$testee->register_notifications();

		$this->assertSame( 10, \has_action( 'admin_notices', [ $testee, 'message_plugin_not_activated' ] ) );
	}

	/**
	 * Tests the appearance of the admin notice when minimum version requirements are not met.
	 *
	 * @return void
	 */
	public function testAdminNoticeMinimumVersion() {
		\define( 'WPSEO_VERSION', '24.5' );

		$testee = new Yoast_ACF_Analysis_Dependency_Yoast_SEO();
		$testee->register_notifications();

		$this->assertSame( 10, \has_action( 'admin_notices', [ $testee, 'message_minimum_version' ] ) );
	}
}
