<?php

namespace Yoast\WP\ACF\Tests\Dependencies;

use Brain\Monkey;
use PHPUnit\Framework\TestCase;
use Yoast_ACF_Analysis_Dependency_ACF;

/**
 * Class ACF_Dependency_Test.
 *
 * @covers Yoast_ACF_Analysis_Dependency_ACF
 */
class ACF_Dependency_Test extends TestCase {

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
	 * Tests the situation where no ACF class exists.
	 *
	 * @return void
	 */
	public function testNoACFClassExists() {
		$testee = new Yoast_ACF_Analysis_Dependency_ACF();

		$this->assertFalse( $testee->is_met() );
	}

	/**
	 * Tests the situation where the ACF class exists.
	 *
	 * @return void
	 */
	public function testACFClassExists() {
		$testee = new Yoast_ACF_Analysis_Dependency_ACF();

		require_once __DIR__ . \DIRECTORY_SEPARATOR . 'acf.php';

		$this->assertTrue( $testee->is_met() );
	}

	/**
	 * Tests the admin notice.
	 *
	 * @return void
	 */
	public function testAdminNotice() {
		$testee = new Yoast_ACF_Analysis_Dependency_ACF();
		$testee->register_notifications();

		$this->assertTrue( \has_action( 'admin_notices', [ $testee, 'message_plugin_not_activated' ] ) );
	}
}
