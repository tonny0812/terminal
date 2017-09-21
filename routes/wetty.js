var express = require('express');
var router = express.Router();

router.get('/', function(req, res) {
	res.render('wetty');
});

router.get('/ssh/:user/:hostname/:port', function(req, res) {
    res.render('wetty');
});

router.get('/telnet/:hostname/:port', function(req, res) {
    res.render('wetty');
});

module.exports = router;