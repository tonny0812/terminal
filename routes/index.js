module.exports = function(app) {
	app.use('/', require('./users'));
	app.use('/remote', require('./remote'));
	app.use('/wetty', require('./wetty'));
	app.use('/mstsc', require('./mstsc'));
};
