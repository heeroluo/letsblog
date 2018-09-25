const $ = require('lib/dom@1.1');
const ajax = require('lib/ajax@1.3');
const Validator = require('lib/validator@1.1');


new Validator({
	form: $('#login-form'),
	steps: [
		{
			fields: 'username',
			message: '请填写用户名'
		},
		{
			fields: 'password',
			message: '请填写密码'
		},
		{
			fields: 'username',
			message: '用户名必须为2-20个字母、数字或者下划线',
			rule: function(val) { return /^\w{2,20}$/.test(val); }
		}
	],
	submitProxy: function(data, form) {
		ajax.send({
			url: form.prop('action'),
			data: data,
			dataType: 'json',
			method: 'POST'
		}).spread(function(res) {
			if (res.status === 1) {
				const referrer = data.filter(function(d) {
					return d.name == 'referrer';
				})[0];
				window.location.href = referrer.value;
			} else {
				alert(res.message);
			}
		});
	}
});