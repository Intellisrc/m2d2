/**
 * @author: A. Lepe
 * @url : https://gitlab.com/lepe/m2d2/
 * @since: May, 2018
 * 
 * This is an extension to use propertes to set style in elements
 */
m2d2.ext({
    // Set css "color" for text. It accepts any supported CSS value
	color   : function(value, elem) { elem.style.color = value; },
	// Set css "background-color".
	bgcolor : function(value, elem) { elem.style.backgroundColor = value; },
	// Set className. It will replace all classes
	css	    : function(value)       { return { 'class' : value }; },
	// Remove specific class from element
	"-css"  : function(value, elem) { elem.classList.remove(value); },
	// Add class to element
	"+css"  : function(value, elem) { elem.classList.add(value); }
});