/**
 * @author: A. Lepe
 * @url : https://gitlab.com/lepe/m2d2/
 * @since: May, 2018
 * 
 * This is an extension to use propertes to set style in elements
 */
m2d2.ext({
	color : function(value) { return { style : "color:"+value }; },
	bgcolor : function(value) { return { style : "background-color:"+value }; },
	css	  : function(value) { return { 'class' : value }; }
});
