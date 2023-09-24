<?php

namespace Yoast\WP\ACF\Tests\Unit;

use Yoast\PHPUnitPolyfills\TestCases\TestCase;
use Yoast_ACF_Analysis_Configuration;
use Yoast_ACF_Analysis_Facade;
use Yoast_ACF_Analysis_Registry;
use Yoast_ACF_Analysis_String_Store;

/**
 * Class Registry_Test.
 *
 * @covers Yoast_ACF_Analysis_Registry
 */
final class Registry_Test extends TestCase {

	/**
	 * Tests that the singleton instance is properly set and that every call to the registry, is the same instance.
	 *
	 * Also checks that the content is the same when adding items to the registry and calling the instance.
	 *
	 * @return void
	 */
	public function testSingleton() {

		$first  = Yoast_ACF_Analysis_Facade::get_registry();
		$second = Yoast_ACF_Analysis_Facade::get_registry();

		$this->assertSame( $first, $second );

		$first->add(
			'id',
			new Yoast_ACF_Analysis_Configuration(
				new Yoast_ACF_Analysis_String_Store(),
				new Yoast_ACF_Analysis_String_Store(),
				new Yoast_ACF_Analysis_String_Store()
			)
		);

		$this->assertSame( $first, $second );
	}

	/**
	 * Tests that adding a non-existing item to the registry, succeeds and that the item can be found based on its ID.
	 *
	 * @return void
	 */
	public function testAdd() {

		$id      = 'add';
		$content = 'something';

		$registry = new Yoast_ACF_Analysis_Registry();

		$this->assertNull( $registry->get( $id ) );

		$registry->add( $id, $content );

		$this->assertSame( $content, $registry->get( $id ) );
	}
}
