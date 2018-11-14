const axios = require('axios');
const serverConfig = require('../../../app.config.js').server;


const defaultConfig = {
	timeout: 3000,
	baseURL: `http://${ serverConfig.host }:${ serverConfig.port }/api/`
};

axios.defaults.headers.put['Content-Type'] =
axios.defaults.headers.post['Content-Type'] = 'application/json';

export async function request(url, config) {
	config = Object.assign({
		url
	}, defaultConfig, config);

	const response = (await axios.request(config)).data;
	const status = response.status;
	if ((status >= 200 && status < 300) || status === 304) {
		return response.data;
	} else {
		const error = new Error(response.message);
		error.statusCode = status;
		throw error;
	}
}