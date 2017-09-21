var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');


var http = require('http');
var https = require('https');
var pty = require('pty.js');
var fs = require('fs');

var routes = require('./routes');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public/images', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//route config
routes(app);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

// app.set('port', process.env.PORT || 3000);

var opts = require('optimist')
        .options({
            sslkey: {
                demand: false,
                description: 'path to SSL key'
            },
            sslcert: {
                demand: false,
                description: 'path to SSL certificate'
            },
            host: {
                demand: false,
                description: 'ssh or telnet server host'
            },
            port: {
                demand: false,
                description: 'ssh or telnet server port'
            },
            sshuser: {
                demand: false,
                description: 'ssh user'
            },
            sshauth: {
                demand: false,
                description: 'defaults to "password", you can use "publickey,password" instead'
            },
            sever_port: {
                demand: false,
                alias: 'p',
                description: 'listen port'
            },
        }).boolean('allow_discovery').argv;

var runhttps = false;

if (opts.sslkey && opts.sslcert) {
        runhttps = true;
        opts['ssl'] = {};
        opts.ssl['key'] = fs.readFileSync(path.resolve(opts.sslkey));
        opts.ssl['cert'] = fs.readFileSync(path.resolve(opts.sslcert));
}

process.on('uncaughtException', function(e) {
    console.error('Error: ' + e);
});

var httpserv;

var listen_port = 2000;
if(opts.sever_port)
    listen_port = opts.sever_port;

if (runhttps) {
    httpserv = https.createServer(opts.ssl, app).listen(listen_port, function() {
        console.log('https on  port ' + listen_port);
    });
} else {
    httpserv = http.createServer(app).listen(listen_port, function() {
        console.log('http on port ' + listen_port);
    });
}

require('./server/wettysocketio')(httpserv, opts);
//require('./server/mstsc')(httpserv);

