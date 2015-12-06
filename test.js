var db = require('./dal/_db');

var userBLL = require('./bll/user');

userBLL.login('heerolaw', 'admin888', '127.0.0.1').then(function(result) {
	console.dir(result);
});