module.exports = function(){
    var fields = _.map(acf.get_fields(), function(field){

        var field_data = jQuery.extend( true, {}, acf.get_data(jQuery(field)) );
        field_data.$el = jQuery(field);

        return field_data;

    });

    // Transform field names for nested fields.
    _.each(fields, function(inner){

       _.each(fields, function(outer){

           if (jQuery.contains(outer.$el[0], inner.$el[0])) {

               // Types that hold multiple children.
               if (outer.type === 'flexible_content' || outer.type === 'repeater'){

                   outer.children = outer.children || [];
                   outer.children.push(inner);
                   inner.parent = outer;
                   inner.name = outer.name + '_' + (outer.children.length - 1) + '_' + inner.name;

               }

               // Types that hold single children.
               if (outer.type === 'group') {

                   outer.child = inner;
                   inner.parent = outer;
                   inner.name = outer.name + '_' + inner.name;

               }

           }

       });

    });

    return fields;
};
