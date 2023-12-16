<?php

namespace Yoast\WP\ACF\Tests\Unit\Dependencies;

use Yoast\WPTestUtils\BrainMonkey\TestCase;
use Yoast_ACF_Analysis_Dependency_ACF;

/**
 * Class Dependency_ACF_Test.
 *
 * @covers Yoast_ACF_Analysis_Dependency_ACF
 */
final class Dependency_ACF_Test extends TestCase {

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

		require_once \dirname( __DIR__ ) . '/Doubles/acf.php';

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

		$this->assertSame( 10, \has_action( 'admin_notices', [ $testee, 'message_plugin_not_activated' ] ) );
	}
}
