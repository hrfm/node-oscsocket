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

var jspack = require('../lib/jspack/jspack').jspack;

// --- Class ----------------------------------

var OSCPacket = module.exports = function(){
        this._buffer = new Buffer(0);
	}

	// ------- PUBLIC ---------------------------------------------------

    /**
     * パケットが持つバッファを取得します.
     */
    OSCPacket.prototype.__defineGetter__('buffer',function(){
        return this._buffer;
    });
    
    /**
     * decode from dgram message to address, types, and values.
     * @param    msg
     * @return   Object
     */
    OSCPacket.decode = function( msg ){
        
        var address,
            types, type,
            values = [],
            start  = 0, end, offset = 3;

        // --- check address. ---

        while( msg[offset] != 0 ){ offset +=4; }
        end = offset;
        while( msg[end-1] == 0 ){ end--; }
        
        address = msg.toString( 'utf8', start, end );

        // --- check types. ---
        
        start = offset+1;
        offset +=4;

        while( msg[offset] != 0 ){ offset +=4; }
        end = offset;
        while( msg[end-1] == 0 ){ end--; }
        
        types = msg.toString( 'utf8', start+1, end );

        // --- check values.

        offset += 1;
        
        for( var i = 0, len = types.length; i < len; i++ ){
            type = types.charAt(i).toLowerCase();
            switch( type ){
                case "i" :
                    values.push( msg.readInt32BE(offset) );
                    offset += 4;
                    break;
                case "f" :
                    values.push( msg.readFloatBE(offset) );
                    offset += 4;
                    break;
                case "d" :
                    values.push( msg.readDoubleBE(offset) );
                    offset += 8;
                    break;
                case "b" :
                case "s" :
                    start = offset - 1;
                    offset += 3;
                    while( msg[offset] != 0 ){ offset +=4; }
                    end = offset;
                    while( msg[end-1] == 0 ){ end--; }
                    if( type == "s" ){
                        values.push( msg.toString( 'utf8', start+1, end ) );
                    }else{
                        values.push( eval( msg.toString( 'utf8', start+1, end ) ) );
                    }
                    offset += 1;
                    break;
            }
        }

        // --- return decoded value.

        return {
            "address" : address,
            "types"   : types,
            "values"  : values
        };

    }

	// ------- PROTECTED ---------------------------------------------------

    /**
     * String to Buffer.
     * @param    value
     * @return
     */
	OSCPacket.prototype._string = function( buff, value, pointer ){
        var len = Math.ceil( (value.length+1) / 4.0 ) * 4.0;
        jspack.PackTo( '>' + len + 's', buff, pointer, [value] );
        return pointer + len;
	}

    /**
     * Float to Buffer.
     * @param    value
     * @return
     */
	OSCPacket.prototype._float = function( buff, value, pointer ){
		jspack.PackTo('>f', buff, pointer, [value]);
        return pointer + 4;
	}

    /**
     * Double to Buffer.
     * @param    value
     * @return
     */
	OSCPacket.prototype._double = function( buff, value, pointer ){
        jspack.PackTo('>d', buff, pointer, [value]);
        return pointer + 8;
	}

    /**
     * Int32 to Buffer.
     * @param    value
     * @return
     */
	OSCPacket.prototype._int32 = function( buff, value, pointer ){
        jspack.PackTo('>i', buff, pointer, [value] );
        return pointer + 4;
	}

    /**
     * Blob to Buffer.
     * @param    value
     * @return
     */
	OSCPacket.prototype._blob = function( buff, value, pointer ){
		return this._string( buff, value, pointer );
	}
