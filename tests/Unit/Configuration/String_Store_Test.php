<?php

namespace Yoast\WP\ACF\Tests\Unit\Configuration;

use Yoast\PHPUnitPolyfills\TestCases\TestCase;
use Yoast_ACF_Analysis_String_Store;

/**
 * Class String_Store_Test.
 *
 * @covers \Yoast_ACF_Analysis_String_Store
 */
final class String_Store_Test extends TestCase {

	/**
	 * Gets the blacklist string store.
	 *
	 * @return Yoast_ACF_Analysis_String_Store The blacklist string store.
	 */
	protected function getStore() {
		return new Yoast_ACF_Analysis_String_Store();
	}

	/**
	 * Tests for an empty store.
	 *
	 * @return void
	 */
	public function testEmpty() {
		$store  = $this->getStore();
		$result = $store->to_array();

		$this->assertIsArray( $result );
		$this->assertEmpty( $result );
	}

	/**
	 * Tests adding a type to the store.
	 *
	 * @return void
	 */
	public function testAdd() {

		$type = 'test';

		$store = $this->getStore();
		$store->add( $type );

		$this->assertSame( [ $type ], $store->to_array() );
	}

	/**
	 * Tests that when attempting to add a duplicate item to the store, it gets ignored.
	 *
	 * @return void
	 */
	public function testAddSame() {

		$type = 'test';

		$store = $this->getStore();
		$store->add( $type );
		$store->add( $type );

		$this->assertSame( [ $type ], $store->to_array() );
	}

	/**
	 * Tests successfully adding multiple, unique types to the store.
	 *
	 * @return void
	 */
	public function testAddMultiple() {

		$type_a = 'A';
		$type_b = 'B';

		$store = $this->getStore();
		$store->add( $type_a );
		$store->add( $type_b );

		$this->assertSame( [ $type_a, $type_b ], $store->to_array() );
	}

	/**
	 * Tests the sorting (in an alphabetical order) of types in the store, regardless of when they were added.
	 *
	 * @return void
	 */
	public function testAddMultipleSorting() {

		$type_a = 'Z';
		$type_b = 'A';

		$store = $this->getStore();
		$store->add( $type_a );
		$store->add( $type_b );

		$this->assertSame( [ $type_b, $type_a ], $store->to_array() );
	}

	/**
	 * Tests adding a non-string type to the store, which is considered invalid and thus shouldn't be stored.
	 *
	 * @return void
	 */
	public function testAddNonString() {

		$store = $this->getStore();

		$this->assertFalse( $store->add( 999 ) );

		$result = $store->to_array();

		$this->assertIsArray( $result );
		$this->assertEmpty( $result );
	}

	/**
	 * Tests removing an existing type from the store.
	 *
	 * @return void
	 */
	public function testRemove() {

		$type_a = 'A';
		$type_b = 'B';

		$store = $this->getStore();

		$store->add( $type_a );
		$store->add( $type_b );

		$this->assertSame( [ $type_a, $type_b ], $store->to_array() );

		$store->remove( $type_a );

		$this->assertSame( [ $type_b ], $store->to_array() );

		$store->remove( $type_b );

		$result = $store->to_array();

		$this->assertIsArray( $result );
		$this->assertEmpty( $result );
	}

	/**
	 * Tests that non-string type items don't get removed, as they can't be added to begin with.
	 *
	 * @return void
	 */
	public function testRemoveNonString() {

		$store = $this->getStore();
		$store->add( '999' );

		$this->assertFalse( $store->remove( 999 ) );
	}

	/**
	 * Tests removing a non-existent type from the store, resulting in an unsuccessful removal.
	 *
	 * @return void
	 */
	public function testRemoveNonExist() {

		$store = $this->getStore();

		$this->assertFalse( $store->remove( 'test' ) );
	}
}
