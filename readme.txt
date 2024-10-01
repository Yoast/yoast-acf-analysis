=== ACF Content Analysis for Yoast SEO ===
Contributors: yoast, angrycreative, kraftner, marcusforsberg, viktorfroberg, joostdevalk, atimmer, jipmoors, theorboman
Tags: Yoast, SEO, ACF, Advanced Custom Fields, analysis, Search Engine Optimization
Requires at least: 6.5
Tested up to: 6.6
License: GPLv3
License URI: http://www.gnu.org/licenses/gpl.html
Stable tag: 3.1
Requires PHP: 7.2.5

WordPress plugin that adds the content of all ACF fields to the Yoast SEO score analysis.

== Description ==

This plugin ensures that Yoast SEO analyzes all ACF content including Flexible Content and Repeaters.

[Yoast SEO for WordPress](https://yoast.com/wordpress/plugins/) content and SEO analysis does not take in to account the content of a post's [Advanced Custom Fields](http://www.advancedcustomfields.com/). This plugin uses the plugin system of Yoast SEO for WordPress to hook into the analyser in order to add ACF content to the SEO analysis.

This had previously been done by the [WordPress SEO ACF Content Analysis](https://wordpress.org/plugins/wp-seo-acf-content-analysis/) plugin but that no longer works with Yoast 3.0. Kudos to [ryuheixys](https://profiles.wordpress.org/ryuheixys/), the author of that plugin, for the original idea.

This Plugin is compatible with the free ACF 4 Version as well as with the PRO Version 5. Please be aware that it ignores Pro Add-Ons for Version 4. In that case please upgrade to ACF PRO Version 5.

> If you have issues, please [submit them on GitHub](https://github.com/Yoast/yoast-acf-analysis/issues)

Previously called Yoast ACF Analysis.

== Filters ==

= Remove specific field from scoring =
`add_filter( 'Yoast\WP\ACF\blacklist_name', function ( $blacklist_name ) {
    $blacklist_name->add( 'my-field-name' );
    return $blacklist_name;
});`

= Remove field type from scoring =
`add_filter( 'Yoast\WP\ACF\blacklist_type', function ( $blacklist_type ) {
    // text, image etc
    $blacklist_type->add( 'text' );
    $blacklist_type->add( 'image' );
    return $blacklist_type;
});`

= Define custom field a specific heading value =
`add_filter( 'Yoast\WP\ACF\headlines', function ( $headlines ) {
    // value from 1-6, 1=h1, 6=h6
    $headlines['field_591eb45f2be86'] = 3;
    return $headlines;
});`

= Change refresh rate =
`add_filter( 'Yoast\WP\ACF\refresh_rate', function () {
    // Refresh rates in milliseconds
    return 1000;
});`

== Changelog ==

= 3.1 =

Released May 23rd, 2023

Enhancements:

* Improves the analysis by excluding content from the URL and email fields.

Bugfixes:

* Fixes a bug where the content in ACF fields was not included in the analysis in Classic editor when WordProof plugin was activated.

Other:

* Sets the minimum required Yoast SEO version to 20.8.
* Sets the minimum required ACF version to 6.0.0.
* Sets the minimum supported WordPress version to 6.1 and "Tested up to" to 6.2.
* Drops compatibility with PHP 5.6, 7.0 and 7.1.

= 3.0.1 =

Released December 10th, 2020

Bugfixes:

* Fixes a bug where ACF Analysis would fail on term pages when using WordPress 5.6.

= 3.0.0 =

Released September 29th, 2020

Bugfixes:

* Fixes a bug where the content of ACF fields wouldn't be included in the SEO and readability analysis when using the Classic Editor plugin.
* Fixes a bug where changes to the content of ACF fields wouldn't trigger a live refresh of the SEO and readability analysis.

Other:

* No longer supports ACF versions below 5.7.

= 2.7.0 =

Released September 1st, 2020

Other:

* Compatibility with Yoast SEO 14.9.


= 2.6.0 =

Released August 4th, 2020

Bugfixes:

* Fixes a bug where the content of ACF blocks in 'auto' mode was not taken into account when the block (automatically) switched to preview mode. Props to [TimVevida](https://github.com/TimVevida).

= 2.5.0 =

Released July 21st, 2020

Other:

* Makes the plugin compatible with JavaScript changes introduced in Yoast SEO 14.6. We used to depend on JavaScript files which aren't there anymore. We now depend on `post-edit.js` or `term-edit.js`.
* Sets the minimum supported Yoast SEO version to 14.6.

= 2.4.1 =

Released June 10th, 2020

Bugfixes:

* Fixes a bug where an error would be thrown when using the Classic Editor plugin.
* Fixes a bug where custom fields were no longer analyzed when using the Classic Editor plugin.

= 2.4.0 =

Released June 4th, 2020

Enhancements:

* Add support for ACF blocks. Props to [TimVevida](https://github.com/TimVevida).

Other:

* Fixes a couple of typos in the code documentation. Props to [akkspros](https://github.com/akkspros).
* Deprecates `Yoast_ACF_Analysis_Facade::get_filter_name()`. Use hard-coded hook names instead.
* Deprecates the  yoast-acf-analysis/config` filter hook in favor of the `Yoast\WP\ACF\config` hook.
* Deprecates the `yoast-acf-analysis/headlines` filter hook in favor of the `Yoast\WP\ACF\headlines` hook.
* Deprecates the `yoast-acf-analysis/blacklist_type` filter hook in favor of the `Yoast\WP\ACF\blacklist_type` hook.
* Deprecates the `yoast-acf-analysis/blacklist_name` filter hook in favor of the `Yoast\WP\ACF\blacklist_name` hook.
* Deprecates the `yoast-acf-analysis/scraper_config` filter hook in favor of the `Yoast\WP\ACF\scraper_config` hook.
* Deprecates the `yoast-acf-analysis/refresh_rate` filter hook in favor of the `Yoast\WP\ACF\refresh_rate` hook.
* Deprecates the `yoast-acf-analysis/field_selectors` filter hook in favor of the `Yoast\WP\ACF\field_selectors` hook.
* Deprecates the `yoast-acf-analysis/field_order` filter hook in favor of the `Yoast\WP\ACF\field_order` hook.

= 2.3.0 =

Released May 15th, 2019

Enhancements:

* ACF URL fields are now analyzed as links. Props to [t49tran](https://github.com/t49tran).

= 2.2.0 =

Released January 22nd, 2019

Bugfixes:

* Fixes a bug where textarea and non-headline text content would not be wrapped in paragraphs for the analysis. Props [skaeser](https://github.com/skaeser).

Enhancements:

 * Introduces the 'yoast-acf-analysis/field_order' filter which allows for adjusting the ACF field order. This also adds the possibility to prepend field content to WordPress' post_content using a negative field order. Props [skaeser](https://github.com/skaeser).

= 2.1.0 =

Released July 10th, 2018

Bugfixes:
 * Fixes a bug where attempting to get the ACF version, wouldn't always be reliable. This would lead the plugin to think that a newer version was installed than what was actually present.
 * Fixes potential conflicts with other plugins due to generic variable naming.
 * Fixes a bug where the YoastSEO ACF Content analysis would attempted to be loaded, although it wasn't available.

Other:
 * Adds filter examples to the readme.

= 2.0.1 =

Released October 19th, 2017

Bugfixes:
	* Fixes the mismatch in textdomain according to the plugin slug.
	* Fixes using an incorrect path when loading plugin data.
	* Fixes a bug with flexible content and repeaters, in combination with ACF 5, causing JavaScript errors.
	* Fixes a bug with short array notation which is a problem on sites running on PHP 5.3 or lower.
	* Fixes a bug where assets are loaded without checking for required dependencies.

= 2.0.0 =

Released August 22th, 2017

Changes:
	* Complete rewrite, including full support for ACF 4 and 5.

= 1.2.1 =

Released July 24th, 2017

Bugfixes:
	* Fixes Yoast SEO Premium social sharing tabs not showing any content when this plugin is active, props [Matt McAchran](https://github.com/mmcachran).

= 1.2.0 =

Released June 30th, 2016

* Bugfixes:
	* Fixes an incompatibility issue with Yoast SEO version 3.2+ where the assets are registered with a new prefix.

* Internationalization:
	* Improved text in notifications when dependencies are missing.
