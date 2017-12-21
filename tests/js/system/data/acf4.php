<?php
if(function_exists("register_field_group"))
{
	register_field_group(array (
		'id' => 'acf_yoast-acf-analysis-test-fields-acf4',
		'title' => 'Yoast ACF Analysis Test Fields ACF4',
		'fields' => array (
			array (
				'key' => 'field_591eb45f2be86',
				'label' => 'Text',
				'name' => 'yoast_acf_analysis_text',
				'type' => 'text',
				'default_value' => '',
				'placeholder' => '',
				'prepend' => '',
				'append' => '',
				'formatting' => 'html',
				'maxlength' => '',
			),
			array (
				'key' => 'field_591eb47e2be87',
				'label' => 'Text Area',
				'name' => 'yoast_acf_analysis_textarea',
				'type' => 'textarea',
				'default_value' => '',
				'placeholder' => '',
				'maxlength' => '',
				'rows' => '',
				'formatting' => 'br',
			),
			array (
				'key' => 'field_591eb4a92be89',
				'label' => 'Email',
				'name' => 'yoast_acf_analysis_email',
				'type' => 'email',
				'default_value' => '',
				'placeholder' => '',
				'prepend' => '',
				'append' => '',
			),
			array (
				'key' => 'field_591eb4da2be8b',
				'label' => 'Wysiwyg',
				'name' => 'yoast_acf_analysis_wysiwyg',
				'type' => 'wysiwyg',
				'default_value' => '',
				'toolbar' => 'full',
				'media_upload' => 'yes',
			),
			array (
				'key' => 'field_591eb4fa2be8c',
				'label' => 'Image',
				'name' => 'yoast_acf_analysis_image',
				'type' => 'image',
				'save_format' => 'object',
				'preview_size' => 'thumbnail',
				'library' => 'all',
			),
			array (
				'key' => 'field_591eb5152be8d',
				'label' => 'Taxonomy Checkbox',
				'name' => 'yoast_acf_analysis_taxonomy_checkbox',
				'type' => 'taxonomy',
				'taxonomy' => 'category',
				'field_type' => 'checkbox',
				'allow_null' => 0,
				'load_save_terms' => 0,
				'return_format' => 'id',
				'multiple' => 0,
			),
			array (
				'key' => 'field_591eb55c2be8e',
				'label' => 'Taxonomy Multi Select',
				'name' => 'yoast_acf_analysis_taxonomy_multiselect',
				'type' => 'taxonomy',
				'taxonomy' => 'category',
				'field_type' => 'multi_select',
				'allow_null' => 0,
				'load_save_terms' => 0,
				'return_format' => 'id',
				'multiple' => 0,
			),
		),
		'location' => array (
			array (
				array (
					'param' => 'post_type',
					'operator' => '==',
					'value' => 'post',
					'order_no' => 0,
					'group_no' => 0,
				),
			),
		),
		'options' => array (
			'position' => 'normal',
			'layout' => 'default',
			'hide_on_screen' => array (
			),
		),
		'menu_order' => 0,
	));

	register_field_group(array (
		'id' => 'acf_non-public-cpt',
		'title' => 'Non Public CPT',
		'fields' => array (
			array (
				'key' => 'field_59e897a8755dc',
				'label' => 'Text',
				'name' => 'yoast_acf_analysis_text',
				'type' => 'text',
				'default_value' => '',
				'placeholder' => '',
				'prepend' => '',
				'append' => '',
				'formatting' => 'html',
				'maxlength' => '',
			),
		),
		'location' => array (
			array (
				array (
					'param' => 'post_type',
					'operator' => '==',
					'value' => 'test_non_public_cpt',
					'order_no' => 0,
					'group_no' => 0,
				),
			),
		),
		'options' => array (
			'position' => 'normal',
			'layout' => 'no_box',
			'hide_on_screen' => array (
			),
		),
		'menu_order' => 0,
	));

}
