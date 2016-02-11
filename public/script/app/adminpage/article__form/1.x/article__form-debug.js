/*!
 * LetsBlog
 * Article form - v1.1 (2016-02-11T15:50:08+0800)
 * Released under MIT license
 */
define(function(require, exports, module) { 'use strict';

var base = require('base/1.1.x/'),
	$ = require('dom/1.1.x/'),
	ajax = require('ajax/1.2.x/'),
	Tmpl = require('tmpl/2.1.x/'),
	Validator = require('validator/1.1.x/'),
	CKEDITOR = window.CKEDITOR;


// 防止误刷新页面
window.onbeforeunload = function() { return '确定要离开此页面？'; };


// 页面类型: true表示编辑文章页面, false表示创建文章页面
var isUpdatePage = Number($('input[name=articleid]').val()) > 0;


new Validator({
	form: $('#article-form'),
	steps: [
		{ fields: 'title', message: '请填写标题' },
		{
			fields: 'title_en',
			message: '英文标题只能包含英文、数字和中划线',
			rule: function(val) { return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(val); },
			required: false
		},
		{ fields: 'categoryid', message: '请选择分类' }
	],
	events: base.extend({
		beforesubmit: function() {
			// 提交前把编辑器数据写入到表单字段
			$('textarea[name=content]').val(CKEDITOR.instances.content.getData());
		}
	}, Validator.defaultOptions.events),
	// AJAX提交
	submitProxy: function(data, form) {
		var submitBtn = $('#submit-btn'), btnText = submitBtn.val();
		submitBtn.prop('disabled', true).val('提交中...');
		ajax.send({
			url: form.attr('action'),
			data: data,
			dataType: 'json',
			method: 'POST',
			onsuccess: function(res) {
				if (res.status === 1) {
					if (isUpdatePage) {
						alert('保存成功');
					} else {
						// 创建成功，进入编辑文章状态
						isUpdatePage = true;
						$('input[name=articleid]').val(res.data.articleid);
						// 修改提交地址
						form.attr('action', '/admin/article/update/' + res.data.articleid + '/post');
						// 显示“更新发布时间”选项
						$('#form-item-update-pubtime').show();
						alert('发布成功，您可以继续编辑文章');
					}
				} else {
					alert(res.message);
				}
			},
			onerror: function() { alert('发布失败'); },
			oncomplete: function() {
				// 恢复按钮状态
				submitBtn.prop('disabled', false).val(btnText);
			}
		});
	}
});


// 上传相关模版
var tmpl = new Tmpl({
	UPLOADING:
'<p data-taskid="<%=taskId%>">正在上传 <%=fileName%> ... <a href="#" class="upload-cancel">取消</a></p>',

	UPLOAD_FAIL:
'<%=fileName%> 上传失败：<em class="upload-result-message"><%=message%></em>',

	UPLOAD_SUCCESS:
'<%=fileName%> 已被上传到<em class="upload-result-path"><%=path%></em>' +
'(<a href="#" class="upload-result-insertlink">插入为链接</a>' +
'<% if (isImage) { %> <a href="#" class="upload-result-insertimg">插入为图片</a><% } %>)',

	INSERT_LINK:
'<a href="<%=path%>" target="_blank"><%=text%></a>',

	INSERT_IMG:
'<img src="<%=path%>" alt="<%=alt%>" />'
});


var uploadPanel = $('#upload-panel'),
	uploadControl = uploadPanel.find('input[type=file]'),
	uploadResult = uploadPanel.find('.upload-result'),
	uploadTasks = [ ];

// 中断上传
function cancelUpload(taskId) {
	var task = uploadTasks[taskId];
	if (task) {
		task.abort();
		uploadTasks[taskId] = null;
	}
}

// 取消上传
uploadResult.on('click', function(e) {
	e.preventDefault();

	var self = $(this), confirmTimer = self.data('confirmTimer');
	// 点击两次以确认取消
	if (confirmTimer) {
		clearTimeout(confirmTimer);
		var parent = self.parent();
		cancelUpload(parent.attr('data-taskid'));
		parent.remove();
	} else {
		self.text('确定？');
		self.data( 'confirmTimer', setTimeout(function() {
			// 如果没有进一步操作，则恢复原来的文字
			self.text('取消').removeData('confirmTimer');
		}, 3000) );
	}
}, {
	delegator: '.upload-cancel'
});

// 插入链接
uploadResult.on('click', function(e) {
	e.preventDefault();
	var text = window.prompt('请输入链接文字');
	if (text) {
		CKEDITOR.instances.content.insertHtml(
			tmpl.render('INSERT_LINK', {
				text: text,
				path: $(this).siblings().filter('.upload-result-path').text()
			})
		);
	}
}, {
	delegator: '.upload-result-insertlink'
});

// 插入图片
uploadResult.on('click', function(e) {
	e.preventDefault();
	CKEDITOR.instances.content.insertHtml(
		tmpl.render('INSERT_IMG', {
			alt: window.prompt('请输入图片说明') || '',
			path: $(this).siblings().filter('.upload-result-path').text()
		})
	);
}, {
	delegator: '.upload-result-insertimg'
});

// 上传控件
uploadControl.change(function(e) {
	if (!this.files.length) { return; }

	var file = this.files[0];
	if (!file.size) {
		alert('不能上传空文件');
		return;
	}

	if (file.size > 5 * 1024 * 1024) {
		alert('文件不能大于5MB');
		return;
	}

	// 获取文件全名和扩展名
	var fileName = file.name,
		fileNameSegments = fileName.split('.'),
		extName = fileNameSegments.length > 1 ?
			fileNameSegments[fileNameSegments.length - 1].toLowerCase() : null;

	var formData = new FormData();
	formData.append('file', file);

	var xhr = new XMLHttpRequest(), taskId = uploadTasks.push(xhr) - 1;
	xhr.open('POST', '/admin/article/attachment/upload');
	xhr.onreadystatechange = function() {
		if (this.readyState == 4) {
			uploadTasks[taskId] = null;

			var errMsg;
			if (this.status == 200) {
				var res = JSON.parse(this.responseText);
				if (res.status !== 1) { errMsg = res.message; }
			} else {
				errMsg = '状态码' + this.status;
			}

			var taskElement = uploadResult.find('p[data-taskid=' + taskId + ']').empty();
			if (errMsg) {
				taskElement.html(
					tmpl.render('UPLOAD_FAIL', {
						fileName: fileName,
						message: errMsg
					})
				);
			} else {
				taskElement.html(
					tmpl.render('UPLOAD_SUCCESS', {
						fileName: fileName,
						path: res.data.path,
						isImage: ['jpg', 'jpeg', 'png', 'gif', 'bmp'].indexOf(extName) !== -1
					})
				);
			}
		}
	};
	xhr.send(formData);

	uploadResult.append(
		tmpl.render('UPLOADING', { fileName: fileName, taskId: taskId })
	);
});

uploadPanel.find('input.upload-button').click(function() {
	uploadControl.click();
});

});