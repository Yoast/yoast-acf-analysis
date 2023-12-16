<?php

namespace Yoast\WP\ACF\Tests\Unit\Doubles;

use Yoast_ACF_Analysis_Dependency;

/**
 * Class Failing_Dependency_Mock.
 */
final class Failing_Dependency_Mock implements Yoast_ACF_Analysis_Dependency {

	/**
	 * Checks if this dependency is met.
	 *
	 * @return bool True when met, false when not met.
	 */
	public function is_met() {
		return false;
	}

	/**
	 * Registers the notifications to communicate the dependency is not met.
	 *
	 * @return void
	 */
	public function register_notifications() {
	}
}
