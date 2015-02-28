/*!
 * JRaiser 2 Javascript Library
 * dom-offset - v1.1.0 (2014-12-08T11:39:30+0800)
 * http://jraiser.org/ | Released under MIT license
 */
define("dom/1.1.x/dom-offset",["dom/1.1.x/dom-base","dom/1.1.x/dom-style","dom/1.1.x/sizzle",null],function(t){"use strict";function e(t){if(!i.isHTMLElement(t))return{};var e=t.ownerDocument,o=e.documentElement;if(!e||!c.contains(o,t))return{};var n=t.getBoundingClientRect(),r=i.getWindow(e);return{top:n.top+(r.pageYOffset||o.scrollTop)-(o.clientTop||0),left:n.left+(r.pageXOffset||o.scrollLeft)-(o.clientLeft||0)}}function o(t){if(i.isHTMLElement(t)){for(var e=document.documentElement,o=t.offsetParent||e;o&&"HTML"!==o.nodeName&&"static"===f.getStyle(o,"position");)o=o.offsetParent;return o||e}}function n(t){if(!i.isHTMLElement(t))return{};var n,r={top:0,left:0};if("fixed"===f.getStyle(t,"position"))n=t.getBoundingClientRect();else{var l=o(t);n=e(t),"HTML"!==l.nodeName&&(r=e(l)),r.top+=parseFloat(f.getStyle(l,"borderTopWidth"))||0,r.left+=parseFloat(f.getStyle(l,"borderLeftWidth"))||0}return{top:n.top-r.top-(parseFloat(f.getStyle(t,"marginTop"))||0),left:n.left-r.left-(parseFloat(f.getStyle(t,"marginLeft"))||0)}}function r(t){return"scroll"+t.toLowerCase().replace(/^[a-z]/,function(t){return t.toUpperCase()})}function l(t,e){var o=i.getWindow(t);return e=r(e),o&&o===t?a[e]in o?o[a[e]]:o.document.documentElement[e]:t[e]}function s(t,e,o){var n=i.getWindow(t);if(f.rRelNumber.test(o)&&(o=(l(t,e)||0)+parseFloat(RegExp.$1+RegExp.$2,10)),n===t)switch(e.toLowerCase()){case"top":window.scrollTo(l(t,"left"),o);break;case"left":window.scrollTo(o,l(t,"top"))}else t[r(e)]=o}var i=t("./dom-base"),f=t("./dom-style"),c=t("./sizzle"),a={scrollTop:"pageYOffset",scrollLeft:"pageXOffset"};return{getScroll:l,setScroll:s,shortcuts:{offsetParent:function(){var t=o(this[0]);return new this.constructor(t?[t]:null)},offset:function(){return e(this[0])},position:function(){return n(this[0])},scrollTop:function(t){return i.access(this,"top",t,!0,{get:l,set:s})},scrollLeft:function(t){return i.access(this,"left",t,!0,{get:l,set:s})}}}});