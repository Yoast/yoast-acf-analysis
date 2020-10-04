<?php

namespace Yoast\WP\ACF\Tests;

use AC_Yoast_SEO_ACF_Content_Analysis;
use Brain\Monkey;
use PHPUnit\Framework\TestCase;
use Yoast_ACF_Analysis_Configuration;
use Yoast_ACF_Analysis_Facade;

/**
 * Class Main_Test.
 */
class Main_Test extends TestCase {

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
