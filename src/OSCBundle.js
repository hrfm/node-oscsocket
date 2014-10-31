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

var util       = require('util'),
	OSCMessage = require('./OSCMessage');

// --- Class ----------------------------------

var OSCBundle = module.exports = function(){
        OSCMessage.call(this);
        this._time    = 0;
        this._packets = [];
   	}

	util.inherits( OSCBundle, OSCMessage );

	// ------- PUBLIC ---------------------------------------------------

    /**
     * Set milliseconds TimeTag.
     * @param    time
     */
    OSCBundle.prototype.setTimeTag = function( time ){
        this._time = time;
    }
    
    /**
     * Set milliseconds TimeTag.
     * now + offset.
     * @param    offset milliseconds
     */
    OSCBundle.prototype.setTimeTagOffset = function( offset ){
        _time = (new Date().getTime()) + offset;
    }
	
    /**
     * Add bundle OSC Message.
     * @param    type
     * @param    value
     */
    OSCBundle.prototype.addPacket = function( packet ){
        this._packets.push( packet );
    }
    
    /** Get bundle packet bytes. */

    /** Message Buffer (override). */
    OSCBundle.prototype.__defineGetter__( 'buffer', function(){

        var i, len = this._packets.length, size = 16, pointer = 0;

        // --- Check packet total length.
        
        for( i = 0; i < len; i++ ){
            // +4 is length data for this packet.
            size += this._packets[i].buffer.length + 4;
        }

        var buff = new Buffer( size );

        // --- Write #bundle.
        
        pointer = this._string( buff, "#bundle", pointer );

        // --- Write time-tag.
        
        if( this._time == 0 ){
            pointer += 4;
            pointer = this._int32( buff, 1, pointer );
        }else{
            var sec = this._time / 1000 >> 0;
            pointer = this._int32( buff, sec, pointer );
            pointer = this._int32( buff, ( _time - sec * 1000 ) * 1000, pointer );
        }
        
        // --- Write Packets.

        for ( i = 0; i < len; i++ ) {
            
            var tmp = _packets[i].buffer;
            
            // --- Write Packet length.

            pointer = this._int32( buff, tmp.length, pointer );

            // --- Write Packet.

            buff.copy( tmp, 0, pointer, pointer + tmp.length );
            pointer += tmp.length;

        }
        
        return buff;

    });

    // ------- PROTECTED ---------------------------------------------------
    