var MESSAGE_DELAY = process.env.MESSAGE_DELAY || 100

var path = require('path')
	, express = require('express')
	, app = express()
	, port = 4080

app.set('view engine', 'ejs');

app.get('/', function (req, res) {
	//res.send({ msg: "hello" });
	res.render(path.join(__dirname, 'chatroom.ejs'));
});


//var KneeSock = require('kneesock')
var KneeSock = require('../index.js')
var kneesock = new KneeSock({app:app, port:port}, function onConnect(clientSpace) {

	var time = process.hrtime();
	clientSpace.data.nick = 'anon' + time[0] + time[1]

	kneesock.subscribe('chatroom', clientSpace);

	kneesock.publish('chatroom',{ msg: clientSpace.data.nick + " has joined." })

	clientSpace.client.on('message', function incoming(message) {
		console.log('received: %s', message);

		if(message.startsWith('/nick ')){

			//set nickname command
			clientSpace.data.nick = message.substring(6)
			kneesock.publish('chatroom',{ msg: clientSpace.data.nick + " has joined." })

		}else{

			//delayed message
			setTimeout(function(){
			kneesock.publish('chatroom',{ nick: clientSpace.data.nick, msg: message })
			}, MESSAGE_DELAY )
	}
	});

});


kneesock.server.http.listen(port, function () { console.log('Listening on ' + port) });
