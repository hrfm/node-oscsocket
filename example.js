var osc = require('./index.js');

var bindPort = 10000;
var bindAddr = 'localhost'

var sendPort = 10000;
var sendAddr = 'localhost'

// ===================================
// Create Listener.

var oscSocket = new osc.OSCSocket( bindPort, bindAddr );

// ===================================
// Receive /test address osc messages.

oscSocket.on("/test/a",function(msg){
	console.log("[ /test/a ]",msg);
});

// ===================================
// Receive using any(*) address osc messages.

oscSocket.on("/*/*",function(msg){
	console.log("[ /*/* ]",msg);
});

oscSocket.on("/*/a",function(msg){
	console.log("[ /*/a ]",msg);
});

oscSocket.on("/test/*",function(msg){
	console.log("[ /test/* ]",msg);
});

// ===================================
// Send OSC Message after 3 seconds.

setTimeout(function(){
	console.log( "Send Osc[ /test ,i 100 ] to " + sendAddr + ":" + sendPort );
	var oscMsg = new osc.OSCMessage();
	oscMsg.address = "/test/a";
	oscMsg.addArgument("i", 100 );
	oscSocket.send( oscMsg, sendAddr, sendPort );
},3000);