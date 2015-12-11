node-oscsocket
==============

Getting started
-----

You can install this module from npm.

    npm install oscsocket

Usage
-----

### 1. Create OSCSocket instance.

Require oscsocket and create OscSocket instance.

```javascript
var osc = require('oscsocket');
var sock = new osc.OscSocket();
```

### 2. Create OSCMessage.

```javascript
var msg = new osc.OSCMessage();
msg.address = "/osc/message/address";
msg.addArgument("i", 100 );
msg.addArgument("s", "String value." );
```

or

```javascript
var msg = new osc.OSCMessage("/osc/message/address ,is 100 TextValue";
```

### 3. Send

```javascript
sock.send( msg, 10000, "127.0.0.1" );
```

### 4. Receive

Bind receive address:port.

```javascript
sock.bind( 10000, "127.0.0.1" );
```

Add listener by address.

```javascript
oscSocket.on( "/osc/message/address", function(message){
  console.log(message);
});
```

or use *.

```javascript
oscSocket.on( "/osc/message/*", function(message){
  console.log(message);
});
```

### 5. Broadcast

```javascript
var osc = require('oscsocket');
var sock = new osc.OscSocket();
sock.useBroadcast();
sock.bind();
sock.send( msg, "127.0.0.1", 10000 );
```

API
-----

## OSCSocket

### OSCSocket.bind( [port] [,address] [,callback] );

Bind and listen OSC messages on address:port.

#### port
Type: `Number`

Listen port.

#### address
Type: `String`

Listen address.  
ex) `127.0.0.1`, `localhost`

#### callback
Type: `Function`

### OSCSocket.bind( [options] [,callback] );

#### options
Type: `Object`

```javascript
{
	'port'    : 1000
	'address' : '0.0.0.0'
}
```

### OSCSocket.useBroadcast();

### OSCSocket.send( packet, port [,address] [,callback] );

Send OSC message to address:port.

#### packet
Type: `OSCMessage`

OSC Packet.

#### port
Type: `Number`

Send port.

#### address
Type: `String`

Send address.  
ex) `127.0.0.1`, `localhost`


### OSCSocket.on( type, listener );

Add listener by type.

#### type
Type: `String`

Listening address.  
And you can use wildcard * on this type. 

For example...

`/*` => `/address`, `/a`, `/hoge`  
`/*/*` => `/a/b`, `/address/a`, `/hoge/hoge`  
`/hoge/*` => `/hoge/a`, `/hoge/hoge`, `/hoge/1`  
`/*/a` => `/hoge/a`, `/a/a`, `/any/a`

#### listener
Type: `Function`

Callbak.

### OSCSocket.off( type, listener );

Remove listener by type.

#### type
Type: `String`

Listening address.  

#### listener
Type: `Function`


### OSCSocket.close();

Close socket.

## OSCMessage

### OSCMessage.addArgument( type, value );

#### type
Type: `String`

Value type.  

`i`:int32
`d`:double
`s`:String

#### value
Type: `Any`