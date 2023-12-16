<?php

namespace Yoast\WP\ACF\Tests\Unit;

use AC_Yoast_SEO_ACF_Content_Analysis;
use Yoast\WPTestUtils\BrainMonkey\TestCase;
use Yoast_ACF_Analysis_Configuration;
use Yoast_ACF_Analysis_Facade;

/**
 * Class Main_Test.
 */
final class Main_Test extends TestCase {

	/**
	 * Tests invalid configurations.
	 *
	 * @covers Yoast_ACF_Analysis_Configuration
	 *
	 * @return void
	 */
	public function testInvalidConfig() {
		$registry = Yoast_ACF_Analysis_Facade::get_registry();

		$registry->add( 'config', 'Invalid Config' );

		$testee = new AC_Yoast_SEO_ACF_Content_Analysis();
		$testee->boot();

		$result = $registry->get( 'config' );

		$this->assertNotSame( 'Invalid Config', $result );
		$this->assertInstanceOf( Yoast_ACF_Analysis_Configuration::class, $result );
	}
}
