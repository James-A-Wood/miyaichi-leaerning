/*
 *
 *      Contains 3 pieces of code:
 *
 *      1.  TouchPunch
 *
 *      2.  Generic test for ECMAScript5 compatibility
 *
 *      3.  iOS zoom bug fix
 *
 *
 */



define(
        [
            "jquery",
            "jqueryui"
        ],
    function($) {


        // NEW TEST making log a global function
        window.log = console.log;


        // https://tc39.github.io/ecma262/#sec-array.prototype.find
        if (!Array.prototype.find) {
            Object.defineProperty(Array.prototype, 'find', {
                value: function(predicate) {
                    // 1. Let O be ? ToObject(this value).
                    if (this == null) {
                        throw TypeError('"this" is null or not defined');
                    }

                    var o = Object(this);

                    // 2. Let len be ? ToLength(? Get(O, "length")).
                    var len = o.length >>> 0;

                    // 3. If IsCallable(predicate) is false, throw a TypeError exception.
                    if (typeof predicate !== 'function') {
                        throw TypeError('predicate must be a function');
                    }

                    // 4. If thisArg was supplied, let T be thisArg; else let T be undefined.
                    var thisArg = arguments[1];

                    // 5. Let k be 0.
                    var k = 0;

                    // 6. Repeat, while k < len
                    while (k < len) {
                        // a. Let Pk be ! ToString(k).
                        // b. Let kValue be ? Get(O, Pk).
                        // c. Let testResult be ToBoolean(? Call(predicate, T, « kValue, k, O »)).
                        // d. If testResult is true, return kValue.
                        var kValue = o[k];
                        if (predicate.call(thisArg, kValue, k, o)) {
                            return kValue;
                        }
                        // e. Increase k by 1.
                        k++;
                    }

                    // 7. Return undefined.
                    return undefined;
                },
                configurable: true,
                writable: true
            });
        }


        // jQuery UI Touch Punch Improved 0.3.1
        (function($) {

            var pointerEnabled = window.navigator.pointerEnabled || window.navigator.msPointerEnabled;

            // Detect touch support
            $.support.touch = "ontouchend" in document || pointerEnabled;

            // Ignore browsers without touch support or mouse support
            if (!$.support.touch || !$.ui.mouse) {
                return;
            }

            var mouseProto = $.ui.mouse.prototype,
                _mouseInit = mouseProto._mouseInit,
                touchHandled;

            // see http://stackoverflow.com/a/12714084/220825
            function fixTouch(touch) {
                var winPageX = window.pageXOffset,
                    winPageY = window.pageYOffset,
                    x = touch.clientX,
                    y = touch.clientY;

                if (touch.pageY === 0 && Math.floor(y) > Math.floor(touch.pageY) || touch.pageX === 0 && Math.floor(x) > Math.floor(touch.pageX)) {
                    // iOS4 clientX/clientY have the value that should have been
                    // in pageX/pageY. While pageX/page/ have the value 0
                    x = x - winPageX;
                    y = y - winPageY;
                } else if (y < (touch.pageY - winPageY) || x < (touch.pageX - winPageX)) {
                    // Some Android browsers have totally bogus values for clientX/Y
                    // when scrolling/zooming a page. Detectable since clientX/clientY
                    // should never be smaller than pageX/pageY minus page scroll
                    x = touch.pageX - winPageX;
                    y = touch.pageY - winPageY;
                }

                return {
                    clientX: x,
                    clientY: y
                };
            }

            /**
             * Simulate a mouse event based on a corresponding touch event
             * @param {Object} event A touch event
             * @param {String} simulatedType The corresponding mouse event
             */
            function simulateMouseEvent(event, simulatedType) {
                // Ignore multi-touch events
                if ((!pointerEnabled && event.originalEvent.touches.length > 1) || (pointerEnabled && !event.isPrimary)) {
                    return;
                }

                var touch = pointerEnabled ? event.originalEvent : event.originalEvent.changedTouches[0],
                    simulatedEvent = document.createEvent("MouseEvents"),
                    coord = fixTouch(touch);

                // Check if element is an input or a textarea
                if ($(touch.target).is("input") || $(touch.target).is("textarea")) {
                    event.stopPropagation();
                } else {
                    event.preventDefault();
                }

                // Initialize the simulated mouse event using the touch event's coordinates
                simulatedEvent.initMouseEvent(
                    simulatedType, // type
                    true, // bubbles
                    true, // cancelable
                    window, // view
                    1, // detail
                    event.screenX || touch.screenX, // screenX
                    event.screenY || touch.screenY, // screenY
                    event.clientX || coord.clientX, // clientX
                    event.clientY || coord.clientY, // clientY
                    false, // ctrlKey
                    false, // altKey
                    false, // shiftKey
                    false, // metaKey
                    0, // button
                    null // relatedTarget
                );

                // Dispatch the simulated event to the target element
                event.target.dispatchEvent(simulatedEvent);
            }

            /**
             * Handle the jQuery UI widget's touchstart events
             * @param {Object} event The widget element's touchstart event
             */
            mouseProto._touchStart = function(event) {
                var self = this;

                // Ignore the event if another widget is already being handled
                if (touchHandled || (!pointerEnabled && !self._mouseCapture(event.originalEvent.changedTouches[0]))) {
                    return;
                }

                // Set the flag to prevent other widgets from inheriting the touch event
                touchHandled = true;

                // Track movement to determine if interaction was a click
                self._touchMoved = false;

                // Simulate the mouseover event
                simulateMouseEvent(event, "mouseover");

                // Simulate the mousemove event
                simulateMouseEvent(event, "mousemove");

                // Simulate the mousedown event
                simulateMouseEvent(event, "mousedown");
            };

            /**
             * Handle the jQuery UI widget's touchmove events
             * @param {Object} event The document's touchmove event
             */
            mouseProto._touchMove = function(event) {
                // Ignore event if not handled
                if (!touchHandled) {
                    return;
                }

                // Interaction was not a click
                this._touchMoved = true;

                // Simulate the mousemove event
                simulateMouseEvent(event, "mousemove");
            };

            /**
             * Handle the jQuery UI widget's touchend events
             * @param {Object} event The document's touchend event
             */
            mouseProto._touchEnd = function(event) {
                // Ignore event if not handled
                if (!touchHandled) {
                    return;
                }

                // Simulate the mouseup event
                simulateMouseEvent(event, "mouseup");

                // Simulate the mouseout event
                simulateMouseEvent(event, "mouseout");

                // If the touch interaction did not move, it should trigger a click
                if (!this._touchMoved) {
                    // Simulate the click event
                    simulateMouseEvent(event, "click");
                }

                // Unset the flag to allow other widgets to inherit the touch event
                touchHandled = false;
            };

            /**
             * A duck punch of the $.ui.mouse _mouseInit method to support touch events.
             * This method extends the widget with bound touch event handlers that
             * translate touch events to mouse events and pass them to the widget's
             * original mouse event handling methods.
             */
            mouseProto._mouseInit = function() {
                var self = this;

                self.element.on({
                    'touchstart': $.proxy(self, '_touchStart'),
                    'touchmove': $.proxy(self, '_touchMove'),
                    'touchend': $.proxy(self, '_touchEnd'),
                    'pointerDown': $.proxy(self, '_touchStart'),
                    'pointerMove': $.proxy(self, '_touchMove'),
                    'pointerUp': $.proxy(self, '_touchEnd'),
                    'MSPointerDown': $.proxy(self, '_touchStart'),
                    'MSPointerMove': $.proxy(self, '_touchMove'),
                    'MSPointerUp': $.proxy(self, '_touchEnd')
                });

                // Call the original $.ui.mouse init method
                _mouseInit.call(self);
            };


        })($);



        // generic test for ECMAScript 5 compatibility!
        (function() {

            if (typeof new Array().forEach !== "function") {
                setTimeout(function() {
                    alert("このサイトを利用するには、Internet Explorer 9 以上のブラウザを使いましょう！");
                }, 1000);
            }

            // var is_firefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
            // if (is_firefox) {
            //     setTimeout(function() {
            //         alert("FireFox を使っているみたいですね。\n\nFireFox は非対応です！（正確に MP3 ファイルが非対応ですが。）\n\n出来れば Internet Explorer か Google Chrome を使いましょう！\n\n - by Wood");
            //     }, 1000);
            // }
        }());





        /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
         *
         *
         *      　! A fix for the iOS orientationchange zoom bug.
         *          Script by @scottjehl, rebound by @wilto.MIT / GPLv2 License.
         *
         *
         * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

        (function(a) {
            var b = navigator.userAgent;
            if (!(/iPhone|iPad|iPod/.test(navigator.platform) && /OS [1-5]_[0-9_]* like Mac OS X/i.test(b) && b.indexOf("AppleWebKit") > -1))
                return;
            var c = a.document;
            if (!c.querySelector)
                return;
            var d = c.querySelector("meta[name=viewport]"),
                e = d && d.getAttribute("content"),
                f = e + ",maximum-scale=1",
                g = e + ",maximum-scale=10",
                h = !0,
                i, j, k, l;
            if (!d)
                return;
            a.addEventListener("orientationchange", m, !1), a.addEventListener("devicemotion", o, !1);

            function m() {
                d.setAttribute("content", g), h = !0;
            }

            function n() {
                d.setAttribute("content", f), h = !1;
            }

            function o(b) {
                l = b.accelerationIncludingGravity, i = Math.abs(l.x), j = Math.abs(l.y), k = Math.abs(l.z), (!a.orientation || a.orientation === 180) && (i > 7 || (k > 6 && j < 8 || k < 8 && j > 6) && i > 5) ? h && n() : h || m();
            }
        })(this);



        // Avoid `console` errors in browsers that lack a console, i.e. IE9
        (function() {
            var method;
            var noop = function() {
                //
            };
            var methods = [
                    "assert", "clear", "count", "debug", "dir", "dirxml", "error",
                    "exception", "group", "groupCollapsed", "groupEnd", "info", "log",
                    "markTimeline", "profile", "profileEnd", "table", "time", "timeEnd",
                    "timeStamp", "trace", "warn"
                ];
            var length = methods.length;
            var console = (window.console = window.console || {});

            while (length--) {
                method = methods[length];

                // Only stub undefined methods.
                if (!console[method]) {
                    console[method] = noop;
                }
            }
        }());


        // A FIX FOR requestAnimationFrame on IE9<
        (function() {

            var lastTime = 0,
                vendors = ['ms', 'moz', 'webkit', 'o'],
                length,
                currTime,
                timeToCall;


            for (var x = 0, length = vendors.length; x < length && !window.requestAnimationFrame; ++x) {
                window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
                window.cancelAnimationFrame =
                    window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame'];
            }


            if (!window.requestAnimationFrame)
                window.requestAnimationFrame = function(callback, element) {
                    currTime = new Date().getTime();
                    timeToCall = Math.max(0, 16 - (currTime - lastTime));
                    lastTime = currTime + timeToCall;
                    return window.setTimeout(function() {
                            callback(currTime + timeToCall);
                        },
                        timeToCall);
                };


            if (!window.cancelAnimationFrame) {
                window.cancelAnimationFrame = function(id) {
                    clearTimeout(id);
                };
            }
        }());

    }
);