/**
 * @author: A. Lepe
 * @url : https://gitlab.com/lepe/m2d2/
 * @since: May, 2018
 * 
 * This is an extension to use the property "show" to hide/show elements
 */
m2d2.ext({
	show : function(show, $node) { 
		if(show) { 
			$node.show(); 
		} else { 
			$node.hide();
		} 
	}
});
