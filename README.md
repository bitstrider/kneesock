# kneesock
*by Jason Yung - [http://callmejay.com](http://callmejay.com "http://callmejay.com")*

a simple pub sub wrapper for websockets/ws

### Installing

	$ npm install --save kneesock

### Basic Usage

```javascript
var KneeSock = require('kneesock')
var kneesock = new KneeSock({}, function onConnect(clientSpace) {

	kneesock.subscribe('chatroom', clientSpace);

	kneesock.publish('chatroom', "alert to all, a new client has subscribed" })

	clientSpace.client.on('message', function incoming(message) {
		console.log('received: %s', message);

		kneesock.publish('chatroom', message)

	});

});

```


### Using With Express

```javascript
var express = require('express')
	, app = express()
	, port = 4080

app.get('/', function (req, res) {
	res.render('chatroom');
}

var KneeSock = require('kneesock')
var kneesock = new KneeSock({app:app, port:port}, function onConnect(clientSpace) {
	...
});

kneesock.server.http.listen(port, function () { console.log('Listening on ' + port) });

```

### Demos
To check out an example of a basic chatting service, run the command:

	$ cd demo
	$ npm install
	$ node chatroom.js
