const http = require('http');
const express = require('express');
const path = require('path');
const morgan = require('morgan');
const timeout = require('connect-timeout')
const WebSocket = require('ws');
const fs = require('fs');
var spawn = require('child_process').spawn
   

const {PORT = 3000} = process.env

// create express app, set up json parsing and logging
const app = express();
app.use(timeout('55s'));
app.use(express.json());
app.use(morgan('dev'));


app.use(express.static(path.join(__dirname, 'static')));
const {getWHMeta,whCommand} = require('./routes/api/wh');

app.get('/', (req,res) => {
    res.sendFile(path.join(__dirname+'/views/index.html'));
});

app.get('/art', (req,res) => {
    ls    = spawn('artillery', ['run','scripts/load_tests/'+req.query.sc ]);

    ls.stdout.on('data', function (data) {
        wss.broadcast(data.toString());
    });
    
    ls.stderr.on('data', function (data) {
        wss.broadcast(data.toString());
    });
    
    ls.on('exit', function (code) {
        wss.broadcast("END");
    });

    res.send('ok')
});

app.get('/script', (req,res) => {
    var ret=[]
    fs.readdirSync("scripts/load_tests").forEach(file => {
        ret.push({value:file,text:file})
      });
    res.send(ret)
});

app.get('/wh', getWHMeta);
app.get('/whcmd', whCommand);

const server = http.createServer(app);
server.listen(PORT);

const wss = new WebSocket.Server({ server: server });
wss.broadcast = function broadcast(msg){
    wss.clients.forEach(function each(client){
      client.send(msg);
    });
  };


console.debug('...server listening on port ' + PORT);
