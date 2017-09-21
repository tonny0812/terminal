var http = require('http');
var https = require('https');
var path = require('path');
var pty = require('pty.js');
var fs = require('fs');
var socketio = require('socket.io');

function run(httpserv, opts) {
    var port = 22;
    var host = 'localhost';
    var sshauth = 'password';
    var globalsshuser = '';

    if (opts.port) {
        port = opts.port;
    }

    if (opts.host) {
        host = opts.host;
    }

    if (opts.sshauth) {
        sshauth = opts.sshauth
    }

    if (opts.sshuser) {
        globalsshuser = opts.sshuser;
    }

    var io = socketio(httpserv,{path: '/wetty/socket.io'});
    io.on('connection', function(socket){
        var sshuser = '';
        var request = socket.request;
        console.log((new Date()) + ' Connection accepted.');
        
        var term;
        
        var protocol = "default";
        
        if(match = request.headers.referer.match('/wetty/ssh/[_a-zA-Z][_a-zA-Z0-9]*/\\d+\\.\\d+\\.\\d+\\.\\d+/[\\d]{2,5}$')) {
            protocol = "ssh";
               
            var user_host_port =  match[0].replace('/wetty/ssh/', '');
            user_host_port = user_host_port.split("/");
            sshuser = user_host_port[0] + '@';
            host = user_host_port[1];
            port = user_host_port[2];

            console.log('connection host ' + host + ' as '+ sshuser + " through ssh.");
        }
        else if(match = request.headers.referer.match('/wetty/telnet/\\d+\\.\\d+\\.\\d+\\.\\d+/[\\d]{2,5}$') ){
            protocol = "telnet";
            
            var host_port =  match[0].replace('/wetty/telnet/', '');
            host_port = host_port.split("/");
            host = host_port[0];
            port = host_port[1];
            console.log('connection host ' + host + ' through telnet.');
        }
        else if (globalsshuser) {
            sshuser = globalsshuser + '@';
        }

        if(protocol=="telnet"){
            term = pty.spawn('telnet', [host, port], {
                name: 'xterm-256color',
                cols: 80,
                rows: 30
            });
        }else
        if(protocol=="ssh"){
            
            term = pty.spawn('ssh', [sshuser + host, '-p', port, '-o', 'PreferredAuthentications=' + sshauth], {
                name: 'xterm-256color',
                cols: 80,
                rows: 30
            });
        }else{
            if (process.getuid() == 0) {
                  console.log('connection to localhost');
                  term = pty.spawn('/bin/login', [], {
                            name: 'xterm-256color',
                            cols: 80,
                            rows: 30
                  });
            }
        }

        term.on('data', function(data) {
            socket.emit('output', data);
        });
        term.on('exit', function(code) {
            console.log((new Date()) + " PID=" + term.pid + " ENDED")
        });
        socket.on('resize', function(data) {
            term.resize(data.col, data.row);
        });
        socket.on('input', function(data) {
            term.write(data);
        });
        socket.on('disconnect', function() {
            term.end();
        });
    });
    return io;
};

module.exports = function(httpserv, opts) {
    return run(httpserv, opts);
}