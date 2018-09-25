const base = require('lib/base@1.1');
const $ = require('lib/dom@1.1');
const ajax = require('lib/ajax@1.3');
const Validator = require('lib/validator@1.1');
const xTpl = require('xtpl/xtpl');
const CKEDITOR = window.CKEDITOR;


// 防止误刷新页面
window.onbeforeunload = () => { return '确定要离开此页面？'; };


// 页面类型: true表示编辑文章页面, false表示创建文章页面
let isUpdatePage = Number($('input[name=articleid]').val()) > 0;


new Validator({
	form: $('#article-form'),
	steps: [
		{
			fields: 'title',
			message: '请填写标题'
		},
		{
			fields: 'title_en',
			message: '英文标题只能包含英文、数字和中划线',
			rule: function(val) { return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(val); },
			required: false
		},
		{
			fields: 'categoryid',
			message: '请选择分类'
		}
	],
	events: base.extend({
		beforesubmit: function() {
			// 提交前把编辑器数据写入到表单字段
			$('textarea[name=content]').val(CKEDITOR.instances.content.getData());
		}
	}, Validator.defaultOptions.events),
	// AJAX提交
	submitProxy: function(data, form) {
		const submitBtn = $('#submit-btn'), btnText = submitBtn.val();
		submitBtn.prop('disabled', true).val('提交中...');
		ajax.send({
			url: form.attr('action'),
			data: data,
			dataType: 'json',
			method: 'POST'
		}).spread(function(res) {
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
		}).catch(function() {
			alert('发布失败');
		}).finally(function() {
			// 恢复按钮状态
			submitBtn.prop('disabled', false).val(btnText);
		});
	}
});


const uploadPanel = $('#upload-panel');
const uploadControl = uploadPanel.find('input[type=file]');
const uploadResult = uploadPanel.find('.upload-result');
const uploadTasks = [];

// 中断上传
function cancelUpload(taskId) {
	const task = uploadTasks[taskId];
	if (task) {
		task.abort();
		uploadTasks[taskId] = null;
	}
}

// 取消上传
uploadResult.on('click', function(e) {
	e.preventDefault();

	const self = $(this), confirmTimer = self.data('confirmTimer');
	// 点击两次以确认取消
	if (confirmTimer) {
		clearTimeout(confirmTimer);
		const parent = self.parent();
		cancelUpload(parent.attr('data-taskid'));
		parent.remove();
	} else {
		self.text('确定？');
		self.data('confirmTimer', setTimeout(function() {
			// 如果没有进一步操作，则恢复原来的文字
			self.text('取消').removeData('confirmTimer');
		}, 3000));
	}
}, {
	delegator: '.upload-cancel'
});

// 插入链接
uploadResult.on('click', function(e) {
	e.preventDefault();
	const text = window.prompt('请输入链接文字');
	if (text) {
		xTpl.render(_tpl('./insert-link.xtpl'), {
			text: text,
			path: $(this).siblings().filter('.upload-result-path').text()
		}).then(function(html) {
			CKEDITOR.instances.content.insertHtml(html);
		});
	}
}, {
	delegator: '.upload-result-insertlink'
});

// 插入图片
uploadResult.on('click', function(e) {
	e.preventDefault();
	xTpl.render(_tpl('./insert-img.xtpl'), {
		alt: window.prompt('请输入图片说明') || '',
		path: $(this).siblings().filter('.upload-result-path').text()
	}).then(function(html) {
		CKEDITOR.instances.content.insertHtml(html);
	});
}, {
	delegator: '.upload-result-insertimg'
});

// 上传控件
uploadControl.change(function(e) {
	if (!this.files.length) { return; }

	const file = this.files[0];
	if (!file.size) {
		alert('不能上传空文件');
		return;
	}

	if (file.size > 5 * 1024 * 1024) {
		alert('文件不能大于5MB');
		return;
	}

	// 获取文件全名和扩展名
	const fileName = file.name;
	const fileNameSegments = fileName.split('.');
	const extName = fileNameSegments.length > 1 ?
		fileNameSegments[fileNameSegments.length - 1].toLowerCase() : null;

	const formData = new FormData();
	formData.append('file', file);

	const xhr = new XMLHttpRequest(), taskId = uploadTasks.push(xhr) - 1;
	xhr.open('POST', '/admin/article/attachment/upload');
	xhr.onreadystatechange = function() {
		if (this.readyState == 4) {
			uploadTasks[taskId] = null;

			let errMsg, res;
			if (this.status == 200) {
				res = JSON.parse(this.responseText);
				if (res.status !== 1) { errMsg = res.message; }
			} else {
				errMsg = '状态码' + this.status;
			}

			const taskElement = uploadResult.find('p[data-taskid=' + taskId + ']').empty();

			let render;
			if (errMsg) {
				render = xTpl.render(_tpl('./upload-fail.xtpl'), {
					fileName: fileName,
					message: errMsg
				});
			} else {
				render = xTpl.render(_tpl('./upload-success.xtpl'), {
					fileName: fileName,
					path: res.data.path,
					isImage: ['jpg', 'jpeg', 'png', 'gif', 'bmp'].indexOf(extName) !== -1
				});
			}

			render.then(function(html) {
				taskElement.html(html);
			});
		}
	};
	xhr.send(formData);

	xTpl.render(_tpl('./uploading.xtpl'), {
		fileName: fileName,
		taskId: taskId
	}).then(function(html) {
		uploadResult.append(html);
	});
});


uploadPanel.find('input.upload-button').click(function() {
	uploadControl.click();
});