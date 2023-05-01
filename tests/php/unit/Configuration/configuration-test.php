<?php

namespace Yoast\WP\ACF\Tests\Configuration;

use Brain\Monkey\Filters;
use Brain\Monkey\Functions;
use Yoast\WPTestUtils\BrainMonkey\TestCase;
use Yoast_ACF_Analysis_Configuration;
use Yoast_ACF_Analysis_Facade;
use Yoast_ACF_Analysis_String_Store;

/**
 * Class Configuration_Test.
 *
 * @covers Yoast_ACF_Analysis_Configuration
 */
class Configuration_Test extends TestCase {

	/**
	 * Tests empty configurations.
	 *
	 * @return void
	 */
	public function testEmpty() {

		$configuration = new Yoast_ACF_Analysis_Configuration(
			new Yoast_ACF_Analysis_String_Store(),
			new Yoast_ACF_Analysis_String_Store(),
			new Yoast_ACF_Analysis_String_Store()
		);

		$this->assertSame(
			[
				'pluginName'     => Yoast_ACF_Analysis_Facade::get_plugin_name(),
				'acfVersion'     => 'version',
				'scraper'        => [],
				'refreshRate'    => 1000,
				'blacklistType'  => [],
				'blacklistName'  => [],
				'fieldSelectors' => [],
				'fieldOrder'     => [],
				'debug'          => false,
			],
			$configuration->to_array()
		);

		$this->assertSame( 1, Filters\applied( 'acf/get_info' ) );
	}

	/**
	 * Tests the ACF version 5 function.
	 *
	 * @return void
	 */
	public function testACF5VersionFunction() {
		$acf_version = '5.0.0';
		Functions\when( 'acf_get_setting' )->justReturn( $acf_version );

		$configuration = new Yoast_ACF_Analysis_Configuration(
			new Yoast_ACF_Analysis_String_Store(),
			new Yoast_ACF_Analysis_String_Store(),
			new Yoast_ACF_Analysis_String_Store()
		);
		$config        = $configuration->to_array();

		$this->assertSame( $acf_version, $config['acfVersion'] );
	}

	/**
	 * Tests a valid blacklist type filter.
	 *
	 * @return void
	 */
	public function testBlacklistTypeFilter() {

		$blacklist_type = new Yoast_ACF_Analysis_String_Store();

		$configuration = new Yoast_ACF_Analysis_Configuration(
			$blacklist_type,
			new Yoast_ACF_Analysis_String_Store(),
			new Yoast_ACF_Analysis_String_Store()
		);

		$blacklist_type2 = new Yoast_ACF_Analysis_String_Store();

		Filters\expectApplied( 'Yoast\WP\ACF\blacklist_type' )
			->once()
			->with( $blacklist_type )
			->andReturn( $blacklist_type2 );

		$this->assertSame( $blacklist_type2, $configuration->get_blacklist_type() );
	}

	/**
	 * Tests an invalid blacklist type filter.
	 *
	 * @return void
	 */
	public function testBlacklistTypeFilterInvalid() {

		$store = new Yoast_ACF_Analysis_String_Store();

		$configuration = new Yoast_ACF_Analysis_Configuration(
			$store,
			new Yoast_ACF_Analysis_String_Store(),
			new Yoast_ACF_Analysis_String_Store()
		);

		Filters\expectApplied( 'Yoast\WP\ACF\blacklist_type' )
			->once()
			->with( $store )
			->andReturn( '' );

		$this->assertSame( $store, $configuration->get_blacklist_type() );
	}

	/**
	 * Tests a valid blacklist name filter.
	 *
	 * @return void
	 */
	public function testBlacklistNameFilter() {

		$blacklist_name = new Yoast_ACF_Analysis_String_Store();

		$configuration = new Yoast_ACF_Analysis_Configuration(
			new Yoast_ACF_Analysis_String_Store(),
			$blacklist_name,
			new Yoast_ACF_Analysis_String_Store()
		);

		$blacklist_name2 = new Yoast_ACF_Analysis_String_Store();

		Filters\expectApplied( 'Yoast\WP\ACF\blacklist_name' )
			->once()
			->with( $blacklist_name )
			->andReturn( $blacklist_name2 );

		$this->assertSame( $blacklist_name2, $configuration->get_blacklist_name() );
	}

	/**
	 * Tests a valid legacy blacklist name filter.
	 *
	 * @return void
	 */
	public function testLegacyBlackistNameFilter() {

		$blacklist_name = new Yoast_ACF_Analysis_String_Store();

		$configuration = new Yoast_ACF_Analysis_Configuration(
			new Yoast_ACF_Analysis_String_Store(),
			$blacklist_name,
			new Yoast_ACF_Analysis_String_Store()
		);

		Filters\expectApplied( 'ysacf_exclude_fields' )
			->once()
			->with( [] )
			->andReturn( [] );

		$this->assertSame( $blacklist_name, $configuration->get_blacklist_name() );


		Filters\expectApplied( 'ysacf_exclude_fields' )
			->once()
			->with( [] )
			->andReturn( [] );

		$this->assertSame( [], $configuration->get_blacklist_name()->to_array() );


		Filters\expectApplied( 'ysacf_exclude_fields' )
			->once()
			->with( [] )
			->andReturn( [ 'some_field_name' ] );

		$this->assertSame( [ 'some_field_name' ], $configuration->get_blacklist_name()->to_array() );
	}

	/**
	 * Tests an invalid legacy blacklist name filter.
	 *
	 * @return void
	 */
	public function testLegacyBlackistNameFilterInvalid() {

		$blacklist_name = new Yoast_ACF_Analysis_String_Store();

		$configuration = new Yoast_ACF_Analysis_Configuration(
			new Yoast_ACF_Analysis_String_Store(),
			$blacklist_name,
			new Yoast_ACF_Analysis_String_Store()
		);

		Filters\expectApplied( 'ysacf_exclude_fields' )
			->once()
			->with( [] )
			->andReturn( 'invalid' );

		$this->assertSame( $blacklist_name, $configuration->get_blacklist_name() );

		Filters\expectApplied( 'ysacf_exclude_fields' )
			->once()
			->with( [] )
			->andReturn( 'invalid' );

		$this->assertSame( [], $configuration->get_blacklist_name()->to_array() );
	}

	/**
	 * Tests an invalid blacklist name filter.
	 *
	 * @return void
	 */
	public function testBlacklistNameFilterInvalid() {

		$store = new Yoast_ACF_Analysis_String_Store();

		$configuration = new Yoast_ACF_Analysis_Configuration(
			new Yoast_ACF_Analysis_String_Store(),
			$store,
			new Yoast_ACF_Analysis_String_Store()
		);

		Filters\expectApplied( 'Yoast\WP\ACF\blacklist_name' )
			->once()
			->with( $store )
			->andReturn( '' );

		$this->assertSame( $store, $configuration->get_blacklist_name() );
	}

	/**
	 * Tests a valid scraper config filter.
	 *
	 * @return void
	 */
	public function testScraperConfigFilter() {
		$config    = [];
		$blacklist = new Yoast_ACF_Analysis_String_Store();

		$configuration = new Yoast_ACF_Analysis_Configuration(
			$blacklist,
			new Yoast_ACF_Analysis_String_Store(),
			new Yoast_ACF_Analysis_String_Store()
		);

		Filters\expectApplied( 'Yoast\WP\ACF\scraper_config' )
			->once()
			->with( [] )
			->andReturn( $config );

		$this->assertSame( $config, $configuration->get_scraper_config() );
	}

	/**
	 * Tests an invalid scraper config filter.
	 *
	 * @return void
	 */
	public function testInvalidScraperConfigFilter() {
		$blacklist = new Yoast_ACF_Analysis_String_Store();

		$configuration = new Yoast_ACF_Analysis_Configuration(
			$blacklist,
			new Yoast_ACF_Analysis_String_Store(),
			new Yoast_ACF_Analysis_String_Store()
		);

		Filters\expectApplied( 'Yoast\WP\ACF\scraper_config' )
			->once()
			->with( [] )
			->andReturn( '' );

		$this->assertSame( [], $configuration->get_scraper_config() );
	}

	/**
	 * Tests the refresh rate filter.
	 *
	 * @return void
	 */
	public function testRefreshRateFilter() {
		Filters\expectApplied( 'Yoast\WP\ACF\refresh_rate' )
			->once()
			->with( 1000 )
			->andReturn( 9999 );

		$configuration = new Yoast_ACF_Analysis_Configuration(
			new Yoast_ACF_Analysis_String_Store(),
			new Yoast_ACF_Analysis_String_Store(),
			new Yoast_ACF_Analysis_String_Store()
		);

		$this->assertSame( 9999, $configuration->get_refresh_rate() );
	}

	/**
	 * Tests the refresh rate minimum value filter.
	 *
	 * @return void
	 */
	public function testRefreshRateMinimumValueFilter() {
		Filters\expectApplied( 'Yoast\WP\ACF\refresh_rate' )
			->once()
			->with( 1000 )
			->andReturn( 1 );

		$configuration = new Yoast_ACF_Analysis_Configuration(
			new Yoast_ACF_Analysis_String_Store(),
			new Yoast_ACF_Analysis_String_Store(),
			new Yoast_ACF_Analysis_String_Store()
		);

		$this->assertSame( 200, $configuration->get_refresh_rate() );
	}

	/**
	 * Tests a valid field selector filter.
	 *
	 * @return void
	 */
	public function testFieldSelectorsFilter() {
		$custom_store   = new Yoast_ACF_Analysis_String_Store();
		$field_selector = new Yoast_ACF_Analysis_String_Store();

		$configuration = new Yoast_ACF_Analysis_Configuration(
			new Yoast_ACF_Analysis_String_Store(),
			new Yoast_ACF_Analysis_String_Store(),
			$field_selector
		);

		Filters\expectApplied( 'Yoast\WP\ACF\field_selectors' )
			->once()
			->with( $field_selector )
			->andReturn( $custom_store );

		$this->assertSame( $custom_store, $configuration->get_field_selectors() );
	}

	/**
	 * Tests an invalid field selector filter.
	 *
	 * @return void
	 */
	public function testFieldSelectorsFilterInvalid() {

		$store = new Yoast_ACF_Analysis_String_Store();

		$configuration = new Yoast_ACF_Analysis_Configuration(
			new Yoast_ACF_Analysis_String_Store(),
			new Yoast_ACF_Analysis_String_Store(),
			$store
		);

		Filters\expectApplied( 'Yoast\WP\ACF\field_selectors' )
			->once()
			->with( $store )
			->andReturn( '' );

		$this->assertSame( $store, $configuration->get_field_selectors() );
	}
}
