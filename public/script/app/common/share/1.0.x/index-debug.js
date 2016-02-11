/*!
 * LetsBlog
 * SNS share - v1.0.1 (2016-02-11T15:29:34+0800)
 * Released under MIT license
 */
define(function(require, exports, module) { 'use strict';

var qs = require('querystring/1.0.x/'),
	$ = require('dom/1.1.x/'),
	QRCode = require('/common/qrcode/1.0.x/');


var shareTypes = {
	weibo: function(params) {
		window.open(
			qs.append('http://service.weibo.com/share/share.php', {
				title: params.title,
				url: params.url
			})
		);
	},
	wechat: function(params) {
		var overlayer = $('<div class="overlayer overlayer--visible"></div>').appendTo('body');

		var layer;
		if ( /MicroMessenger/.test(window.navigator.userAgent) ) {
			layer = $(
				'<div class="share-wechat--inwechat clearfix">' +
					'<div class="share-wechat--inwechat__text">点击右上角按钮进行分享<br />(点击任意位置关闭提示)</div>' +
					'<div class="share-wechat--inwechat__arrow">' +
						'<span class="share-wechat--inwechat__arrow__triangle"></span>' +
						'<span class="share-wechat--inwechat__arrow__rectangle"></span>' +
					'</div>' +
				'</div>'
			);
		} else {
			layer = $(
				'<div class="share-wechat">' +
					'<p>扫一扫，分享到微信</p>' +
					'<p class="share-wechat__qrcode"></p>' +
					'<p class="share-wechat__close">点击任意位置关闭</p>' +
				'</div>'
			);

			var qrcode = new QRCode(layer.find('.share-wechat__qrcode').get(0), {
				text: params.url,
				width: 128,
				height: 128,
				colorDark : '#000000',
				colorLight : '#ffffff'
			});
		}

		layer.appendTo('body');

		function hide() {
			layer.remove();
			overlayer.remove();
		}

		overlayer.on('click', hide);
		layer.on('click', hide);
	}
};


exports.to = function(type, params) {
	return shareTypes[type](params);
};

});