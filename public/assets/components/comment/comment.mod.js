/*!
 * LetsBlog
 * Comment component - v1.1 (2017-02-04T09:11:59Z)
 * Released under MIT license
 */


var $ = require('lib/dom@1.1'),
	ajax = require('lib/ajax@1.3'),
	widget = require('lib/widget@1.1'),
	Validator = require('lib/validator@1.1'),
	currentUser = window.currentUser;


var tmpl = new Tmpl({
	LIST:
'<% data.forEach(function(comment) { %>' +
'<article class="comment__list__item<% if (comment.userid) { %> comment__list__item--isuser<% } %>">' +
	'<header class="comment__list__item__header clearfix">' +
		'<div class="comment__list__item__header__author"><em><%=comment.user_nickname%></em> 说：</div>' +
		'<div class="comment__list__item__header__pubtime">发表于<%=comment.pubtime_formatted%></div>' +
	'</header>' +
	'<div class="comment__list__item__content"><%-comment.content%></div>' +
'</article>' +
'<% }); %>' +
'<% if (totalPages > 1) { %><nav class="comment__list__paginator"></nav><% } %>',

	TIPS:
'<p class="comment__list__tips"><%=tips%></p>'
});


module.exports = widget.create({
	_init: function(options) {
		var t = this, form = options.form;
		t._listWrapper = options.listWrapper;

		// 没表单，仅加载列表
		if (!form.length) {
			t.load(options.page);
			return;
		}

		var steps = [ ];
		if (!currentUser.userid) {
			steps.push(
				{ fields: 'user_nickname', message: '请填写昵称' },
				{
					fields: 'user_nickname',
					rule: function(val) { return val.length >= 2; },
					message: '昵称最少要有两个字'
				},
				{
					fields: 'user_email',
					rule: 'isEmail',
					message: 'Email格式错误',
					required: false
				},
				{
					fields: 'user_qq',
					rule: 'isQQ',
					message: 'QQ号格式错误',
					required: false
				}
			);

			// 从本地存储获取记录的昵称、email和qq
			form.find('input[type=text]').forEach(function(textbox) {
				var value = localStorage.getItem(textbox.name);
				if (value) {
					textbox.value = value;
				}
			});
		}
		steps.push({ fields: 'content', message: '请填写评论内容' });

		t._validator = new Validator({
			form: form,
			steps: steps,
			submitProxy: function(data, form) {
				var btn = form.find('input[type=submit]'), btnText = btn.val();
				btn.prop('disabled', true).val( btn.attr('data-submitingtext') );

				// 记录昵称、email和qq到本地存储
				data.forEach(function(d) {
					if ( /^user_/.test(d.name) ) {
						localStorage.setItem(d.name, d.value);
					}
				});

				ajax.send({
					url: '/comment/create',
					data: data,
					method: 'POST',
					dataType: 'json',
					onsuccess: function(res) {
						if (res.status === 1) {
							res = res.data;
							if (res.lastComment.state) {
								alert('发表成功');

								t._destroyList();
								t._renderList(res.commentList, res.page, res.totalPages);

								// 重定位到最新的那条
								var lastComment = t._listWrapper.find('.comment__list__item').last();
								window.scrollTo(
									$(window).scrollLeft(),
									lastComment.offset().top + lastComment.outerHeight(true) +
										$('#header').innerHeight() - document.documentElement.clientHeight 
								);

								t._trigger('submitsuccess', { result: res });
							} else {
								alert('您发表的评论需经过审核才会显示');
							}

							form.find('textarea[name=content]').val('');
						} else {
							alert(res.message);
						}
					},
					oncomplete: function() {
						btn.prop('disabled', false).val(btnText);
					}
				});
			}
		});

		t.load(options.page);
	},

	_destroy: function() {
		this._destroyList();
		this._validator.destroy();
		delete this._validator;
	},

	_destroyList: function() {
		if (this._paginator) {
			this._paginator.destroy();
			delete this._paginator;
		}
		this._listWrapper.empty();
	},

	_renderList: function(commentList, page, totalPages) {
		var t = this, listWrapper = t._listWrapper;

		commentList.forEach(function(comment) {
			// 编码内容 & 替换换行符
			comment.content = Tmpl.escape(comment.content)
				.replace(/\r?\n/g, '<br />');
		});
		listWrapper.html(
			tmpl.render('LIST', {
				data: commentList,
				totalPages: totalPages
			})
		);
		if (totalPages > 1) {
			t._paginator = new Paginator({
				wrapper: listWrapper.find('.comment__list__paginator'),
				currentPage: page,
				totalPages: totalPages,
				prevText: '',
				nextText: '',
				ellipsisText: '',
				events: {
					click: function(e) {
						t.load(e.page, true);
						window.scrollTo(
							$(window).scrollLeft(),
							listWrapper.parent().offset().top - $('#header').innerHeight()
						);
					}
				}
			});
		}
	},

	load: function(page) {
		var t = this, listWrapper = t._options.listWrapper;

		t._destroyList();

		listWrapper.html( tmpl.render('TIPS', { tips: '正在加载评论...' }) );

		ajax.send({
			url: '/comment/list/' + this._options.articleId,
			data: { page: page },
			dataType: 'json',
			onsuccess: function(res) {
				if (res.status === 1) {
					res = res.data;
					if (!res || !res.totalPages) {
						listWrapper.html( tmpl.render('TIPS', { tips: '暂无评论' }) );
					} else {
						t._renderList(res.commentList, res.page, res.totalPages);
					}
				} else {
					listWrapper.html( tmpl.render('TIPS', { tips: res.message }) );
				}
			}
		});
	}
});