var express = require('express');
var path = require('path');
var app = express();
var bodyParser = require('body-parser');
var FormData = require('form-data');
var axios = require('axios');
var request = require('request');
var request = request.defaults({jar: true})
var btoa = require('btoa');

function toHex(str) {
  var result = '';
  for (var i=0; i<str.length; i++) {
    result += str.charCodeAt(i).toString(16);

  }
  return result;

}


app.use(express.static('dist'));
app.use(bodyParser.json());

var DEVICES = {};

var APPS = {
  'my-account-integration': 'http://web.static.nowtv.com/service/integration/myaccount/#/passes?_k=kisoow',
  'my-account-e02': 'http://web.static.nowtv.com/service/e02/myaccount#/passes?_k=foxe8r',
  'product-holding-integration': '',
  'product-holding-e02': 'http://web.static.nowtv.com/service/e02/product-holding',
  'order-tracking-integration': '',
  'order-tracking-e02': 'http://web.static.nowtv.com/service/e02/order-tracking'
};

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();

});

app.get('/add-device/:deviceID', function (req, res) {
  if (DEVICES[req.params.deviceID] === undefined) {
    DEVICES[req.params.deviceID] = {};

    res.sendStatus(200);
  } else {
    res.sendStatus(500);
  }
});

app.get('/ui', function (req, res) {

  var html = `
    <h1>Executor UI</h1>
    <br />
    <h2>Devices added</h2>
    <br />
    <ul>
      ${Object.keys(DEVICES).map(device => `<li>${device}</li>`)}
    </ul>
    </br>
    </br>

    <hr />
    <p>Device name</p>
    <input type="text" id="device-name" /><br />

    <hr />

    <h1>Sign in</h1>
    <p>Username</p>
    <input type="text" id="username" /><br />
    <p>Password:</p>
    <input type="text" id="password" /><br />

    <br />
    <select id="env">
      <option>Select an environment</option>
      <option value="integration">integration</option>
      <option value="e02">e02</option>
    </select>

    <select id="app">
      <option>Select an app</option>
        ${Object.keys(APPS).map(app => `<option ="${app}">${app}</option>`)}
    </select>

    <br />
    <br />
    <button onClick="signCustomerIn()">Sign Customer In</button><br />
    <br />
    <br />

    <hr />

    <br />

    <h1>Run command</h1>
    <textarea style="width: 600px; height: 400px;" id="command" placeholder="Write your command here..."></textarea>
    <button onClick="runCommand()">Run</button>


    <script>

      function post(url, data, callback) {
        var xhr = new XMLHttpRequest();
        xhr.open('POST', url, true);
        xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        xhr.onload = callback;
        xhr.send(data);
      }


      function signCustomerIn() {
        var device = document.getElementById('device-name').value;

        var username = document.getElementById('username').value;
        var password = document.getElementById('password').value;

        var env = document.getElementById('env').value;
        var app = document.getElementById('app').value;

        post('http://localhost:3001/execute', JSON.stringify({ username: username, password: password, env: env, app: app, device: device }), function () {
          alert('Done!');
        });
      }

      function run() {
        var device = document.getElementById('device-name').value;
        var command = document.getElementById('command').value;

        post('http://localhost:3001/execute', JSON.stringify({ device: device, command: command }), function () {
          alert('Done!');
        });
      }

    </script>

  `;
  res.send(html);
});

app.post('/execute', function (req, res) {

  if (req.body.username || req.body.password) {

    var skyIDURL;

    if (req.body.env === 'e02') {
      skyIDURL = 'https://e02.id.bskyb.com/signin/nowtv/7b613a27687474703a2f2f7765622e7374617469632e6e6f7774762e636f6d2f736572766963652f6530322f70726f647563742d686f6c64696e67277d';
    }

    if (req.body.env === 'integration') {
      skyIDURL = 'https://demo.id.bskyb.com/signin/nowtv/7b613a27687474703a2f2f7765622e7374617469632e6e6f7774762e636f6d2f736572766963652f696e746567726174696f6e2f6d796163636f756e74232f7061737365733f5f6b3d647461356e71277d';
    }

    var j = request.jar();
    request({ jar: j, method: 'post', url: skyIDURL, followRedirects: false, followRedirect: false, form: {usernameNowTv: req.body.username, password: req.body.password}}, function(err,httpResponse,body){ 

      var cookies = httpResponse.headers['set-cookie'].map(cookie => `document.cookie = "${cookie.replace('bskyb', 'nowtv')}";` );

      var sso = cookies.join(' ').match(/skySSO=((.*?)[;,]|.*$)/)[2];

      var redirect = `http://web.static.nowtv.com/bridge?securessotoken=${toHex(sso)}&successUrl=${encodeURIComponent(APPS[req.body.app])}`;

      DEVICES[req.body.device] = `${cookies.join(' ')} document.location = '${redirect}'`;

    })

  } else {
    DEVICES[req.body.device] = req.body.command;
  }

  res.sendStatus(200);
});

app.get('/execute-for/:deviceName', function (req, res) {
  var command = DEVICES[req.params.deviceName];

  if (command) {
    res.send(command);
  } else {
    res.sendStatus(500);
  }
});

app.listen(3001, function () {
  console.log('listening...')
});
