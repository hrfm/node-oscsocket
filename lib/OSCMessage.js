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

var util      = require('util'),
	OSCPacket = require('./OSCPacket');

// --- Class ----------------------------------

var OSCMessage = module.exports = function( oscString ){

		OSCPacket.call(this);
        
		this._address = "";
        this._types   = ",";
        this._values  = [];
        this._argSize = 0;

        this._buffer  = new Buffer(0);
        this._updated = false;
        
        if ( typeof oscString !== "undefined" ){
            this._convert( oscString );
        }

   	}

	util.inherits( OSCMessage, OSCPacket );

	// ------- PUBLIC ---------------------------------------------------

    /** Message Address. */
    OSCMessage.prototype.__defineGetter__('address',function(){
        return this._address;
    });
    OSCMessage.prototype.__defineSetter__('address',function( value ){
        this._address = value;
    });

    /** Message Arguments. */
    OSCMessage.prototype.__defineGetter__('arguments',function(){
        return this._values;
    });

    /** Message Buffer. */
    OSCMessage.prototype.__defineGetter__('buffer',function(){

    	if( this._updated ){

	    	var buff, type,
	    		pointer   = 0,
	    		addrSize  = Math.ceil( (this.address.length+1) / 4.0 ) * 4.0,
	    		typesSize = Math.ceil( (this._types.length+1) / 4.0 ) * 4.0;

	        // --- check buff size

	        buff = new Buffer( addrSize + typesSize + this._argSize );
	        pointer = this._string( buff, this._address, pointer, addrSize );
	        pointer = this._string( buff, this._types, pointer, typesSize );
	        for( var i = 0; i < this._types.length; i++ ){
	        	type = this._types.charAt(i+1);
		        switch( type ) {
		            case "f":
		            	pointer = this._float( buff, this._values[i], pointer );
		            	break;
		            case "d":
		            	pointer = this._double( buff, this._values[i], pointer );
		            	break;
		            case "i":
		            	pointer = this._int32( buff, this._values[i], pointer );
		                break;
		            case "s":
		            	pointer = this._string( buff, this._values[i], pointer );
		                break;
		            case "b":
		            	pointer = this._blob( buff, this._values[i], pointer );
				        break;
		        }
	        }

	        this._buffer  = buff;
	        this._updated = false;

    	}

        return this._buffer;

    });


    /**
     * Add argument to this message.
     * @param	type
     * @param	value
     */
    OSCMessage.prototype.addArgument = function( type, value ){

        var buff;

        type = type.toLocaleLowerCase();

        switch( type ) {
            case "f":
            case "i":
            	this._argSize += 4;
                break;
            case "d":
            	this._argSize += 8;
            	break;
            case "s":
            case "b":
		        this._argSize += Math.ceil( (value.length+1)/4.0 ) * 4.0;
                break;
            default :
                throw new Error( "Invalid Type : " + type );
                return;
        }

        this._types += type;
        this._values.push( value );
        this._updated = true;

    }

	// ------- PROTECTED ---------------------------------------------------

    /**
     * Conver OSC String to OSCMessage properties.
     * @param	oscString
     */
	OSCMessage.prototype._convert = function( oscString ){

        var arr  = oscString.split(" "),
            addr = arr[0],
            type = arr[1],
            vals = arr.splice( 2, arr.length );
        
        this.address = addr;

        for ( var i = 0, len = type.length - 1; i < len; i++ ) {
            this.addArgument( type.charAt(i + 1), vals[i] );
        }

	}
