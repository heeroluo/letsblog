/*!
 * LetsBlog
 * Header - v1.0.0 (2017-02-03T08:36:53Z)
 * Released under MIT license
 */


var base = require('lib/base@1.1'),
	$ = require('lib/dom@1.1'),
	ajax = require('lib/ajax@1.3'),
	currentUser = window.currentUser;


var header = $('#header');


// 菜单开关类
var Toggle = base.createClass(function(wrapper, toggleClass, layerClass) {
	var t = this;
	t._toggle = wrapper.find('.' + toggleClass).click(function() {
		if (t._on) {
			t.hide();
		} else {
			t.show();
		}
	});
	t._layer = wrapper.find('.' + layerClass);
	t._toggleOnClass = toggleClass + '--on';
	t._layerOnClass = layerClass + '--on';

	var isClickInWrapper;
	wrapper.click(function() { isClickInWrapper = true; });
	$('body').click(function() {
		if (!isClickInWrapper) { t.hide(); }
		isClickInWrapper = false;
	});
}, {
	show: function() {
		var t = this;
		t._toggle.addClass(t._toggleOnClass);
		t._layer.addClass(t._layerOnClass);
		t._on = true;
	},

	hide: function() {
		var t = this;
		t._toggle.removeClass(t._toggleOnClass);
		t._layer.removeClass(t._layerOnClass);
		t._on = false;
	}
});

new Toggle(
	header.find('.header__nav'),
	'header__nav__toggle',
	'header__nav__list'
);
new Toggle(
	header.find('.header__user-panel'),
	'header__user-panel__toggle',
	'header__user-panel__menu'
);


if (currentUser && currentUser.group.perm_manage_comment) {
	var getTotalPendingViews = function() {
		ajax.send({
			url: '/admin/comment/totalpendingreviews',
			dataType: 'json',
			onsuccess: function(res) {
				var element = header.find('.header__user-panel__menu__item__admin__pending-reviews');
				if (res.status === 1 && res.data.total > 0) {
					element.find('em').text(res.data.total);
					element.show();
				} else {
					element.hide();
				}
				setTimeout(getTotalPendingViews, 60000);
			}
		});
	}
	getTotalPendingViews();
}