/**
 * @author: A. Lepe
 * @url : https://gitlab.com/lepe/m2d2/
 * @since: May, 2018
 * 
 * This is an extension to use the property "show" to hide/show elements
 * It will keep previous "display" property value and restore it upon "show".
 */
m2d2.ext({
	show : function(show, node) { 
		if(show) {
		    if(node.dataset._m2d2_display) {
    			node.style.display = node.dataset._m2d2_display;
    	    } else {
    	        node.style.removeProperty("display");
    	    }
		} else {
		    node.dataset._m2d2_display = node.style.display != "none" ? node.style.display : "";
			node.style.display = "none"
		}
	}
});
