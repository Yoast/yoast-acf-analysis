<?php

namespace Yoast\WP\ACF\Tests;

use Brain\Monkey;
use Brain\Monkey\Functions;
use PHPUnit\Framework\TestCase;
use Yoast\WP\ACF\Tests\Doubles\Failing_Dependency;
use Yoast\WP\ACF\Tests\Doubles\Passing_Dependency;
use Yoast_ACF_Analysis_Requirements;

/**
 * Class Requirements_Test.
 */
class Requirements_Test extends TestCase {

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

		Functions\expect( 'current_user_can' )->andReturn( true );
	}

	/**
	 * Tears down test fixtures previously set up.
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
	 * Tests the situation where there are no dependencies.
	 *
	 * @covers Yoast_ACF_Analysis_Requirements::are_met
	 *
	 * @return void
	 */
	public function testNoDependencies() {
		$testee = new Yoast_ACF_Analysis_Requirements();
		$this->assertTrue( $testee->are_met() );
	}

	/**
	 * Tests that requirements are met when a valid dependency is added.
	 *
	 * @covers Yoast_ACF_Analysis_Requirements::add_dependency
	 * @covers Yoast_ACF_Analysis_Requirements::are_met
	 *
	 * @return void
	 */
	public function testPassingDependency() {
		$testee = new Yoast_ACF_Analysis_Requirements();
		$testee->add_dependency( new Passing_Dependency() );

		$this->assertTrue( $testee->are_met() );
	}

	/**
	 * Tests that requirements are not met when an invalid dependency is added.
	 *
	 * @covers Yoast_ACF_Analysis_Requirements::add_dependency
	 * @covers Yoast_ACF_Analysis_Requirements::are_met
	 *
	 * @return void
	 */
	public function testFailingDependency() {
		$testee = new Yoast_ACF_Analysis_Requirements();
		$testee->add_dependency( new Failing_Dependency() );

		$this->assertFalse( $testee->are_met() );
	}

	/**
	 * Tests that requirements are not met when a mix of valid and invalid dependencies are added.
	 *
	 * @covers Yoast_ACF_Analysis_Requirements::add_dependency
	 * @covers Yoast_ACF_Analysis_Requirements::are_met
	 *
	 * @return void
	 */
	public function testMixedDependencies() {
		$testee = new Yoast_ACF_Analysis_Requirements();
		$testee->add_dependency( new Failing_Dependency() );
		$testee->add_dependency( new Passing_Dependency() );

		$this->assertFalse( $testee->are_met() );
	}
}
