/*!
 * LetsBlog
 * Comment component - v1.1 (2017-02-08T01:28:35Z)
 * Released under MIT license
 */


var $ = require('lib/dom@1.1'),
	ajax = require('lib/ajax@1.3'),
	widget = require('lib/widget@1.1'),
	Validator = require('lib/validator@1.1'),
	xTpl = require('common/xtpl/xtpl'),
	currentUser = window.currentUser;


module.exports = widget.create({
	_init: function(options) {
		var t = this, form = options.form;
		t._listWrapper = options.listWrapper;

		// 在列表容器代理页码点击操作
		t._onDOMEvent(t._listWrapper, 'click', function(e) {
			e.preventDefault();
			t.load( this.getAttribute('data-page') );
		}, {
			delegator: '.paginator__item a'
		});

		t.load(options.page);

		// 没表单，仅加载列表
		if (!form.length) { return; }

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
					dataType: 'json'
				}).spread(function(res) {
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
				}).finally(function() {
					btn.prop('disabled', false).val(btnText);
				});
			}
		});
	},

	_destroy: function() {
		this._destroyList();
		this._validator.destroy();
		delete this._validator;
	},

	_destroyList: function() {
		this._listWrapper.empty();
	},

	_renderList: function(commentList, page, totalPages) {
		var t = this, listWrapper = t._listWrapper;

		return xTpl.render(
			require.resolve('./list'), {
				listData: commentList,
				currentPage: page,
				totalPages: totalPages
			}
		).then(function(result) {
			listWrapper.html(result);
		});
	},

	load: function(page) {
		var t = this,
			listWrapper = t._options.listWrapper,
			listTpl = require.resolve('./list');

		t._destroyList();

		xTpl.render(
			listTpl, { tips: '正在加载评论...' }
		).then(function(result) {
			listWrapper.html(result);
		}).then(function() {
			return ajax.send({
				url: '/comment/list/' + t._options.articleId,
				data: { page: page },
				dataType: 'json'
			});
		}).spread(function(res) {
			if (res.status === 1) {
				res = res.data;
				if (!res || !res.totalPages) {
					throw new Error('暂无评论');
				} else {
					return t._renderList(res.commentList, res.page, res.totalPages);
				}
			} else {
				throw new Error(res.message);
			}
		}).catch(function(e) {
			return xTpl.render(
				listTpl, { tips: e.message }
			).then(function(result) {
				listWrapper.html(result);
			});
		});
	}
});