var PORT = process.env.PORT || 8080

var http = require('http');

var KneeSock = function(opts, connectionHandler) {

	var $this = this
	
	//websockets/ws boilerplate setup
	var WebSocketServer = require('ws').Server


	console.log("kneesock: wrapping websocket server")

	if(opts.app) {

		console.log("kneesock: recognized and wrapping express app")

		$this.server = {
			http: http.createServer(opts.app)
			 // bind websocket server to server object
		}
		$this.server.ws = new WebSocketServer({server: $this.server.http})

		//$this.server.http.on('request', opts.app)

	}
	else{

		console.log("kneesock: wrapping default generic server")

		$this.server = { ws: new WebSocketServer({ port: opts.port || PORT }) };
	}

	//init channel hash
	$this.channels = {}

	//handle when a client establishs a connection
	$this.server.ws.on("connection", function onConnection(client) {

		var clientSpace = new ClientSpace({client:client})
		
		//handle when a client closes a connnection
		clientSpace.client.on("close", function onClose() {

			//clean up after client after they leave
			$this.unsubscribe(clientSpace);
		
		})

		//parametized connection handler
		connectionHandler(clientSpace)
		
	})
}

KneeSock.prototype.getChannel = function(channel_id) {
	return this.channels[channel_id]
}


KneeSock.prototype.hasChannel = function(channel_id) {
	return this.channels[channel_id] === undefined
}
 

KneeSock.prototype.safeChannel = function(channel_id) {
	var channel = this.channels[channel_id]
	if(channel === undefined) {
		channel = this.channels[channel_id] = new Channel()
	}
	return channel

}


KneeSock.prototype.createChannel = function(channel_id, data) {

	this.channels[channel_id] = new Channel({data: data})

	console.log("kneesock: " + channel_id + " up.");
}


KneeSock.prototype.removeChannel = function(channel_id) {
	
	delete this.channels[channel_id]

	console.log("kneesock: " + channel_id + ' down.')

}


KneeSock.prototype.setChannelData = function(channel_id, data) {
	this.channels[channel_id].data = data
}


KneeSock.prototype.subscribe = function(channel_id, clientSpace) {

	this.unsubscribe(clientSpace) //remove client from current channel

	var channel = this.safeChannel(channel_id)
	channel.clientSpaces.push(clientSpace)
	clientSpace.channel_id = channel_id

	console.log("kneesock: " + channel_id + " : clientSpace subscribed");

}


KneeSock.prototype.unsubscribe = function(clientSpace) {
	//console.log(this.channels)

	var channel = this.getChannel(clientSpace.channel_id)
	if (channel) {
		var index = channel.clientSpaces.indexOf(clientSpace);
		if (index > -1) {
			if (channel.clientSpaces.length == 1) {
				this.removeChannel(clientSpace.channel_id); //last one out has to close the door		
			} else {
				channel.clientSpaces.splice(index, 1);
				console.log("kneesock: " + clientSpace.channel_id + " : clientSpace removed");
			}				
			clientSpace.channel_id = undefined;
		} else {
			throw new Error("kneesock error: clientSpace's channel is undefined")
		} //for some reason its not there.
	} else {
		clientSpace.channel_id = undefined;
	}
}

KneeSock.prototype.publish = function(channel_id,obj,opts) {
	if(opts===undefined) opts = {}
	var channel = this.channels[channel_id];
			
	if(channel) {
		console.log("kneesock: " + channel_id + " : publishing to " + channel.clientSpaces.length + " connected clientSpaces");
		for (var i in channel.clientSpaces) {

			channel.clientSpaces[i].client.send(JSON.stringify(obj));
			console.log("kneesock: " + channel_id + " : data sent to client " + i);

			if(opts.last) channel.clientSpaces[i].channel_id = undefined; //auto-unsub client from channel on 'last' option, kinda of a hack
		}

		if(opts.last) this.removeChannel(channel_id); //auto-remove the channel on 'last' option
	}else{
		console.log("kneesock: WARNING, publishing to non-existant channel")
	}

}


// relationship: a channel has many clientSpaces, and a clientSpace can belong to a channel

var Channel = function() {
	this.clientSpaces = []
	this.data = {}
}

var ClientSpace = function(opts) {
	this.client = opts.client
	this.channel_id = undefined
	this.data = {}

	//clientSpace pointer for client
	//this.client.clientSpace = this
}

module.exports = KneeSock