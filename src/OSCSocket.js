/**
 *
 * Copyright (c) 2010 - 2015, https://github.com/hrfm
 * 
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 * 
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 */

// --- import ----------------------------------

var events     = require('events')
  , dgram      = require('dgram')
  , util       = require('util')
  , OSCPacket  = require('./OSCPacket')
  , OSCMessage = require('./OSCMessage')
;

// --- Class ----------------------------------

var OSCSocket = module.exports = function(){
        
        // --- create EventEmitt functions.
        this._emitter = new events.EventEmitter();
        
        // --- init Properties.
        this._bound            = false;
        this._useBroadcast     = false;
        this._addressTree      = {};
        this._objectDictionary = {};
        this._eventObjectCache = {};
        this._regExpCache      = {};

        // --- create DatagramSocket.

        var self = this;
        this._socket  = dgram.createSocket('udp4');
        this._socket.on('listening',function(){ self._onListening.apply( self ); });
        this._socket.on('message',function(msg, rinfo){ self._onMessage.apply( self, [ msg, rinfo ] ); });
        this._socket.on('error',function(err){ self._onError.apply( self, [err] ); });
        this._socket.on('close',function(){ self._onClose.apply(); });
        
    };
    
    // ------- PUBLIC ----------------------------------------------------

    /** ブロードキャストを有効にします. */
    OSCSocket.prototype.setBroadcast = function setBroadcast(flag){
      this._useBroadcast = (flag==true);
      if( this._useBroadcast && this._bound ){
        this._socket.setBroadcast(flag);
      }
    };
    
    /** 接続に利用している DatagramSocket への参照を取得します. */
    OSCSocket.prototype.__defineGetter__('socket',function(){
        return this._socket;
    });

    /** このソケットオブジェクトが現在ローカルのアドレスとポートにバインドされているかどうかを示します。 */
    OSCSocket.prototype.__defineGetter__('bound',function(){
        return this._bound;
    });

    /** ローカルマシン上でこのソケットがバインドされている IP アドレス。 */
    OSCSocket.prototype.__defineGetter__('localAddress',function(){
        return this._socket.address().address;
    });

    /** ローカルマシン上でこのソケットがバインドされているポート。 */
    OSCSocket.prototype.__defineGetter__('localPort',function(){
        return this._socket.address().port;
    });

    /**
     * 指定された方法でソケットをバインドします。
     */
    OSCSocket.prototype.bind = function(){

      var self     = this;
      var options  = {};
      var callback = undefined;

      if( typeof arguments[0] === "function" ){
        callback.push( arguments[0] );
      }else if( typeof arguments[0] === "object" ){
        options = arguments[0];
      }else if( typeof arguments[0] === "number" ){
        options["port"]    = arguments[0];
        options["address"] = arguments[1];
        if( typeof arguments[2] === "function" ){
          callback = arguments[2];
        }
      }

      if( typeof callback !== "undefined" ){
        this._socket.bind( options, callback );
      }else{
        this._socket.bind( options );
      }

      return this._socket;

    }

    /**
     * OSCメッセージを送信します.
     * @param    packet  送信する OSCPacket.
     * @param    port    送信先ポート.
     * @param    address 送信先アドレス.
     * @param    callback
     */
    OSCSocket.prototype.send = function( packet, port, address, callback ) {
      if( typeof address === "undefined" ){ address == "0.0.0.0" }
      var buf = packet.buffer;
      this._socket.send( buf, 0, buf.length, port, address, callback );
    }

    /**
     * OSC メッセージに対するリスナ関数を定義します.
     * @param    type リスナ関数を指定するメッセージを指定します. ex) /a/b/c
     *                また、OSC の仕様に則ったアドレス指定に対応しています.
     *                例えば, /a/b/* と記述すると /a/b/任意の文字 などを一括してとる事が出来ます.
     * @param    listener
     */
    OSCSocket.prototype.on = function( type, listener ){
        if( type.indexOf("/") == 0 ){
            var t = type + "$";
            var address = t.substring( 1, t.length ).split("/");
            this._createAddress( this._addressTree, address );
        }
        //console.log(this._dump(this._addressTree, 3));
        this._emitter.on( type, listener );
    }

    OSCSocket.prototype._hasEventListener = function( type ){

    }

    /**
     * OSC メッセージに対するリスナ関数を削除します.
     * @param    type 
     * @param    listener
     */
    OSCSocket.prototype.off = function( type, listener ){
        this._emitter.off( type, listener );
        if( type.indexOf("/") == 0 ){
            var t = type + "$";
            var address = t.substring( 1, t.length ).split("/");
            this._removeAddress( this._addressTree, address );
        }
    }

    /**
     * ソケットを閉じます。
     */
    OSCSocket.prototype.close = function(){
        try{ this._socket.close(); }catch(e){}
    }

    // ------- PRIVATE ----------------------------------------------------

    // --- Event Callback ---
    
    /**
     * Socket の読み取り中の処理.
     */
    OSCSocket.prototype._onListening = function(){
        var address = this._socket.address();
        this._bound = true;
        this._socket.setBroadcast(this._useBroadcast);
        console.log("OSCSocket listening " + address.address + ":" + address.port);
    }

    /**
     * 通信メッセージを受信した際に実行されるハンドラ.
     * データの 8byte を調べ, bundle かを判断し処理を切り替える.
     * @param    msg
     * @param    rinfo
     */
    OSCSocket.prototype._onMessage = function( msg, rinfo ){
        //console.log( 'onMessage', msg, rinfo );
        if( msg.toString( 'utf8', 0, 7 ) == "#bundle" ){
            this._createBundle( msg, rinfo.address, rinfo.port );
        }else{
            this._execute( this._createDispatchFunction( msg, rinfo ) );
        }
    }

    /**
     * 通信エラーを受信した際に実行されるハンドラ.
     * @param    err
     */
    OSCSocket.prototype._onError = function( err ){
        console.log( "OSCSocket error:\n" + err.stack );
        this._emitter.emit("error",err);
        this._socket.close();
    }
    
    /**
     * 通信エラーを受信した際に実行されるハンドラ.
     * @param    err
     */
    OSCSocket.prototype._onClose = function(){
        console.log( "OSCSocket closed" );
        this._bound = false;
        this._emitter.emit("close");
    }

    // --- Address Mapping ---
    
    /**
     * on 関数で追加された OSC アドレス空間を再起的に生成する.
     * @param    list
     * @param    address
     */
    OSCSocket.prototype._createAddress = function( list, address ){
        if( address.length == 0 ){ return; }
        var part = address.shift();
        if( !list[part] ){ list[part] = []; }
        this._createAddress( list[part], address );
    }

    /**
     * on 関数で追加された OSC アドレス空間を再起的に削除する.
     * @param    list
     * @param    address
     * @param    route
     * @param    key
     */
    OSCSocket.prototype._removeAddress = function( list, address, route, key ){
        var k, len  = 0, part = address.shift();
        // --- check remove target.
        for( k in list ) len++;
        if( !route || 1 < len ){
            route = list;
            key   = part;
        }
        // --- check and remove.
        if( !list[part] ){
            delete route[key];
        }else if( address.length == 0 ){
            len = 0;
            for( k in list[part] ) len++;
            if( len == 0 ) delete route[key];
        }else{
            this._removeAddress( list[part], address, route, key );
        }
    }

    /**
     * on 関数で追加された OSC アドレス空間を再起的に出力する.
     * @param    list
     * @param    tabs
     * @return
     */
    OSCSocket.prototype._dump = function( list, tabs ){
        if( typeof tabs === "undefined" ) tabs = 0;
        var key, tab = "", i = tabs, str = "";
        while( i-- ) tab += " ";
        for( key in list ){
            str += ( tab + key + "\n" + this._dump(list[key], tabs+2 ) );
        }
        return str;
    }

    /**
     * emit を発生させる関数に必要な値を生成し,その値にアクセスするための文字列を返します.
     * 値は _objectDictionary に格納されます.
     * @param    buff
     * @param    srcAddress
     * @param    srcPort
     * @return
     */
    OSCSocket.prototype._createDispatchFunction = function( msg, rinfo ){

        var key = new Date().getTime() + "_" + Math.floor( Math.random() * 10000 );

        var data = OSCPacket.decode( msg );
        data.srcAddress = rinfo.address;
        data.srcPort    = rinfo.port;

        this._objectDictionary[key] = data;

        return key;

    }


    /**
     * _createDispatchFunction で生成された key を引数に, emit すべき情報を再起的に調べ実行します.
     * @param    key
     */
    OSCSocket.prototype._execute = function( key ){

        var obj = this._objectDictionary[key];
        
        if( obj ){
            
            var i, len, tmp;

            var list = [{
                "type"       : "message",
                "srcAddress" : obj.srcAddress,
                "srcPort"    : obj.srcPort,
                "address"    : obj.address,
                "values"     : obj.values
            }];
            
            this._checkEmitList(
                list,
                obj.srcAddress,
                obj.srcPort,
                obj.address.substring( 1, obj.address.length ).split("/"),
                obj.values,
                this._addressTree
            );
            
            for( i = 0, len = list.length; i < len; i++ ){
                tmp = list[i];
                this._emitter.emit( tmp.type, tmp );
            }
            
            list = null;

        }
        
        obj = null;

        this._objectDictionary[key] = null;
        delete this._objectDictionary[key];

    }

    /**
     * on 関数で追加された OSC アドレス空間との整合性を調べ再起的に emit する.
     */
    OSCSocket.prototype._checkEmitList = function( list, srcAddress, srcPort, address, values, node, index, typeStr ){

        if( typeof index === "undefined" ) index = 0;
        if( typeof typeStr === "undefined" ) typeStr = "";

        if( address.length == index ){
            
            if( typeStr.charAt(typeStr.length-1) != "$" ) return;
            
            // 過去に一度も dispatch した事がないイベントの場合は、イベントオブジェクトを生成する
            if( !this._eventObjectCache[typeStr] ){
                this._eventObjectCache[typeStr] = { "type" : typeStr.replace("$","") };
            }
            
            var obj = this._eventObjectCache[typeStr];
            obj.srcAddress = srcAddress;
            obj.srcPort    = srcPort;
            obj.address    = "/"+address.join("/");
            obj.values     = values;

            list.push( obj );

            return;
            
        }else{
            
            for( var key in node ){
                if ( !this._regExpCache[key] ) {
                    this._regExpCache[key] = new RegExp(
                        key.replace(/\*/g,"[^\/]+").replace(/\?/g,".")
                           .replace(/{(.+?)}/g,"($1)").replace(/,/g,"|")
                           .replace(/\[!/g,"^") + "$"
                    );
                }
                if( address[index].match( this._regExpCache[key] ) != null ){
                    this._checkEmitList( list, srcAddress, srcPort, address, values, node[key], index+1, typeStr+"/"+key );
                }
            }
            
        }

    }

    /**
     * Bundle の処理を実行する.
     * @param    msg
     * @param    srcAddress
     * @param    srcPort
     */
    OSCSocket.prototype._createBundle = function( msg, srcAddress, srcPort ){

        console.log("#Bundle is not supported yet.");
        
        //trace("#bundle");
        
        /*
        var sec:int, millisec:int;
        var time:Number;
        var delay:Number;
        var len:int
        var tmp:ByteArray;
        var list:Array;
        
        // Create Time-Tag.
        
        msg.position = 8;
        sec = msg.readInt();
        
        msg.position = 12;
        millisec += msg.readInt();
        
        time = ( sec * 1000 ) + ( millisec / 1000 );
        
        //trace("- sec      : " + sec);
        //trace("- millisec : " + millisec);
        //trace("- time     : " + time);
        //trace("- delay    : " + delay);
        
        delay = time - new Date().time;
        
        if( delay < 0 ){
            
            // Create packet bundle.
            
            msg.position = 16;
            
            while( msg.position < msg.length ){
                
                len = msg.readInt();
                
                _tmpByteArray = new ByteArray();
                _tmpByteArray.writemsg( msg, msg.position, len );
                _tmpByteArray.position = 0;
                
                if ( _tmpByteArray.readUTFmsg(8) == "#bundle" ) {
                    _createBundle( _tmpByteArray, srcAddress, srcPort );
                }else {
                    _execute( _createDispatchFunction( _tmpByteArray, srcAddress, srcPort ) );
                }
                
                msg.position += len;
                
            }
            
        }else{
            
            // Create packet bundle.
            
            msg.position = 16;
            
            while( msg.position < msg.length ){
                
                len = msg.readInt();
                
                _tmpByteArray = new ByteArray();
                _tmpByteArray.writemsg( msg, msg.position, len );
                _tmpByteArray.position = 0;
                
                if ( _tmpByteArray.readUTFmsg(8) == "#bundle" ) {
                    _createBundle( _tmpByteArray, srcAddress, srcPort );
                }else {
                    if( !list ) list = [];
                    list.push( _createDispatchFunction( _tmpByteArray, srcAddress, srcPort ) );
                }
                
                msg.position += len;
                
            }
            
            if( list && 0 < list.length ){
                var timer:Timer = new Timer( delay, 1 );
                timer.addEventListener(TimerEvent.TIMER_COMPLETE, function(e) {
                    while(list.length) _execute( list.shift() );
                });
                timer.start();
            }
            
        }
        */

    }
