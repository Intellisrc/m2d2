/**
 * @author: A. Lepe
 * @url : https://gitlab.com/lepe/m2d2/
 * @since: May, 2018
 *
 * This is an extension to use the property "show" to hide/show elements
 * It will keep previous "display" property value and restore it upon "show".
 * If there is not "previous" display property will search for "data-display"
 * attribute or will set the default for the specified element tag.
 */
M2D2.extend({
	show : function(show, node) {
		const cssDisplay = function () {
			return getComputedStyle(node, null).display;
		};
		const defaultDisplay = function () {
			const b = document.getElementsByTagName("body")[0];
			const t = document.createElement("template");
			const n = document.createElement(node.tagName);
			t.appendChild(n);
			b.appendChild(t);
			const display = getComputedStyle(n, null).display;
			t.remove();
			return display;
		};
		if(show) {
			if(cssDisplay() === "none") {
				if(node.dataset._m2d2_display) {
					node.style.display = node.dataset._m2d2_display;
				} else {
					node.style.removeProperty("display");
					if(cssDisplay() === "none") {
						const defaultShow = defaultDisplay();
						node.style.display = node.dataset.display || (defaultShow !== "none" ? defaultShow : "block");
					}
				}
			}
		} else {
			const stored = node.style.display !== "none" ? node.style.display : cssDisplay();
			if(stored !== "none") {
				node.dataset._m2d2_display = stored;
			}
			node.style.display = "none"
		}
	}
});
