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

### 3. Send

```javascript
oscSocket.send( msg, "127.0.0.1", 10000 );
```

### 4. Receive

Bind receive address:port.

```javascript
oscSocket.bind( 10000, "127.0.0.1" );
```

Add listener by address.

```javascript
oscSocket.on( "/osc/message/address", function(message){
  console.log(message);
});
```

API
-----

## OSCSocket

### OSCSocket.bind( port, address );

Bind and listen OSC messages on address:port.

#### port
Type: `Number`

Listen port.

#### address
Type: `String`

Listen address.  
ex) `127.0.0.1`, `localhost`

### OSCSocket.send( packet, address, port );

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


LICENSE
-------

(MIT License)

Copyright (c) 2014 [ Hirofumi Kawakita ] https://github.com/hrfm

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
