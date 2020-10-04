<?php

namespace Yoast\WP\ACF\Tests\Dependencies;

use Brain\Monkey;
use PHPUnit\Framework\TestCase;
use Yoast_ACF_Analysis_Dependency_Yoast_SEO;

/**
 * Class Yoast_SEO_Dependency_Test.
 *
 * @covers Yoast_ACF_Analysis_Dependency_Yoast_SEO
 */
class Yoast_SEO_Dependency_Test extends TestCase {

	/**
	 * Whether or not to preserve the global state.
	 *
	 * @var bool
	 */
	protected $preserveGlobalState = false;

	/**
	 * Whether or not to run each test in a separate process.
	 *
	 * @var bool
	 */
	protected $runTestInSeparateProcess = true;

	/**
	 * Sets up test fixtures.
	 *
	 * @before
	 *
	 * @return void
	 */
	protected function setUpFixtures() {
		parent::setUp();
		Monkey\setUp();
	}

	/**
	 * Tears down test fixtures previously setup.
	 *
	 * @after
	 *
	 * @return void
	 */
	protected function tearDownFixtures() {
		Monkey\tearDown();
		parent::tearDown();
	}

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
		\define( 'WPSEO_VERSION', '14.9.0' );

		$testee = new Yoast_ACF_Analysis_Dependency_Yoast_SEO();
		$this->assertTrue( $testee->is_met() );
	}

	/**
	 * Tests that requirements are not met when an old and incompatible version Yoast SEO is installed.
	 *
	 * @return void
	 */
	public function testOldVersion() {
		\define( 'WPSEO_VERSION', '14.5.0' );

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

		$this->assertTrue( \has_action( 'admin_notices', [ $testee, 'message_plugin_not_activated' ] ) );
	}

	/**
	 * Tests the appearance of the admin notice when minimum version requirements are not met.
	 *
	 * @return void
	 */
	public function testAdminNoticeMinimumVersion() {
		\define( 'WPSEO_VERSION', '2.0.0' );

		$testee = new Yoast_ACF_Analysis_Dependency_Yoast_SEO();
		$testee->register_notifications();

		$this->assertTrue( \has_action( 'admin_notices', [ $testee, 'message_minimum_version' ] ) );
	}
}
