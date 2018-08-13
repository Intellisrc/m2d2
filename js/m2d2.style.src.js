/**
 * @author: A. Lepe
 * @url : https://gitlab.com/lepe/m2d2/
 * @since: May, 2018
 * 
 * This is an extension to use propertes to set style in elements
 */
m2d2.ext({
	color   : function(value, elem) { this.style.color = value; },
	bgcolor : function(value, elem) { this.style.backgroundColor = value; },
	css	    : function(value)       { return { 'class' : value }; }
});
