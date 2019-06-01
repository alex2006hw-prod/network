"use strict";

function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; subClass.__proto__ = superClass; }

// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

/*<replacement>*/
var bufferShim = require('safe-buffer').Buffer;
/*</replacement>*/


require('../common');

var assert = require('assert/');

var stream = require('../../');

var passed = false;

var TestStream =
/*#__PURE__*/
function (_stream$Transform) {
  _inheritsLoose(TestStream, _stream$Transform);

  function TestStream() {
    return _stream$Transform.apply(this, arguments) || this;
  }

  var _proto = TestStream.prototype;

  _proto._transform = function _transform(chunk, encoding, done) {
    if (!passed) {
      // Char 'a' only exists in the last write
      passed = chunk.toString().includes('a');
    }

    done();
  };

  return TestStream;
}(stream.Transform);

var s1 = new stream.PassThrough();
var s2 = new stream.PassThrough();
var s3 = new TestStream();
s1.pipe(s3); // Don't let s2 auto close which may close s3

s2.pipe(s3, {
  end: false
}); // We must write a buffer larger than highWaterMark

var big = bufferShim.alloc(s1.writableHighWaterMark + 1, 'x'); // Since big is larger than highWaterMark, it will be buffered internally.

assert(!s1.write(big)); // 'tiny' is small enough to pass through internal buffer.

assert(s2.write('tiny')); // Write some small data in next IO loop, which will never be written to s3
// Because 'drain' event is not emitted from s1 and s1 is still paused

setImmediate(s1.write.bind(s1), 'later'); // Assert after two IO loops when all operations have been done.

process.on('exit', function () {
  assert(passed, 'Large buffer is not handled properly by Writable Stream');
});

function indexOf(xs, x) {
  for (var i = 0, l = xs.length; i < l; i++) {
    if (xs[i] === x) return i;
  }

  return -1;
}

;

(function () {
  var t = require('tap');

  t.pass('sync run');
})();

var _list = process.listeners('uncaughtException');

process.removeAllListeners('uncaughtException');

_list.pop();

_list.forEach(function (e) {
  return process.on('uncaughtException', e);
});