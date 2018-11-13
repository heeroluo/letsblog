/*!
 * LetsBlog
 * Header - v1.0.0 (2018-11-12T09:27:32Z)
 * Released under MIT license
 */

const base = require('lib/base@1.1');
const $ = require('lib/dom@1.1');
const ajax = require('lib/ajax@1.3');
const currentUser = window.currentUser;


const header = $('#header');


// 菜单开关类
const Toggle = base.createClass(function(wrapper, toggleClass, layerClass) {
	const t = this;
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

	let isClickInWrapper;
	wrapper.click(function() { isClickInWrapper = true; });
	$('body').click(function() {
		if (!isClickInWrapper) { t.hide(); }
		isClickInWrapper = false;
	});
}, {
	show: function() {
		const t = this;
		t._toggle.addClass(t._toggleOnClass);
		t._layer.addClass(t._layerOnClass);
		t._on = true;
	},

	hide: function() {
		const t = this;
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
	header.find('.header__user'),
	'header__user__toggle',
	'header__user__menu'
);


if (currentUser && currentUser.usergroup.perm_manage_comment) {
	const getTotalPendingViews = function() {
		ajax.send({
			url: '/admin/comment/totalpendingreviews',
			dataType: 'json'
		}).spread(function(res) {
			const element = header.find('.header__user__menu__item__admin__pending-reviews');
			if (res.status === 1 && res.data.total > 0) {
				element.find('em').text(res.data.total);
				element.show();
			} else {
				element.hide();
			}
			setTimeout(getTotalPendingViews, 60000);
		});
	};
	getTotalPendingViews();
}