/**
 * @author: A. Lepe
 * @url : https://gitlab.com/lepe/m2d2/
 * @since: May, 2018
 *
 * This is an extension to use propertes to set style in elements
 */
M2D2.extend({
	// Set css "color" for text. It accepts any supported CSS value
	color   : function(value, elem) { elem.style.color = value; },
	// Set css "background-color".
	bgcolor : function(value, elem) { elem.style.backgroundColor = value; },
	// Set className. It will replace all classes
	css	    : function(value, elem) { elem.className = value; },
	// Remove specific class from element
	"-css"  : function(value, elem) {
		let styles = Utils.isArray(value) ? value : value.split(" ");
		for(let s in styles) { elem.classList.remove(styles[s]) };
	},
	// Add class to element
	"+css"  : function(value, elem) {
		let styles = Utils.isArray(value) ? value : value.split(" ");
		for(let s in styles) { elem.classList.add(styles[s]) };
	}
});