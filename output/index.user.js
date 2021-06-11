// ==UserScript==
// @name        sane-twitch-chat
// @version     1.0.296
// @author      wilx
// @description Twitch chat sanitizer.
// @homepage    https://github.com/wilx/sane-twitch-chat
// @supportURL  https://github.com/wilx/sane-twitch-chat/issues
// @match       https://www.twitch.tv/*
// @namespace   https://github.com/wilx/sane-twitch-chat
// @downloadURL https://github.com/wilx/sane-twitch-chat/raw/master/output/index.user.js
// @run-at      document-end
// @grant       none
// ==/UserScript==

/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 640:
/***/ (() => {

/*globals jQuery,Window,HTMLElement,HTMLDocument,HTMLCollection,NodeList,MutationObserver */
/*exported Arrive*/
/*jshint latedef:false */

/*
 * arrive.js
 * v2.4.1
 * https://github.com/uzairfarooq/arrive
 * MIT licensed
 *
 * Copyright (c) 2014-2017 Uzair Farooq
 */
var Arrive = (function(window, $, undefined) {

  "use strict";

  if(!window.MutationObserver || typeof HTMLElement === 'undefined'){
    return; //for unsupported browsers
  }

  var arriveUniqueId = 0;

  var utils = (function() {
    var matches = HTMLElement.prototype.matches || HTMLElement.prototype.webkitMatchesSelector || HTMLElement.prototype.mozMatchesSelector
                  || HTMLElement.prototype.msMatchesSelector;

    return {
      matchesSelector: function(elem, selector) {
        return elem instanceof HTMLElement && matches.call(elem, selector);
      },
      // to enable function overloading - By John Resig (MIT Licensed)
      addMethod: function (object, name, fn) {
        var old = object[ name ];
        object[ name ] = function(){
          if ( fn.length == arguments.length ) {
            return fn.apply( this, arguments );
          }
          else if ( typeof old == 'function' ) {
            return old.apply( this, arguments );
          }
        };
      },
      callCallbacks: function(callbacksToBeCalled, registrationData) {
        if (registrationData && registrationData.options.onceOnly && registrationData.firedElems.length == 1) {
          // as onlyOnce param is true, make sure we fire the event for only one item
          callbacksToBeCalled = [callbacksToBeCalled[0]];
        }

        for (var i = 0, cb; (cb = callbacksToBeCalled[i]); i++) {
          if (cb && cb.callback) {
            cb.callback.call(cb.elem, cb.elem);
          }
        }

        if (registrationData && registrationData.options.onceOnly && registrationData.firedElems.length == 1) {
          // unbind event after first callback as onceOnly is true.
          registrationData.me.unbindEventWithSelectorAndCallback.call(
            registrationData.target, registrationData.selector, registrationData.callback);
        }
      },
      // traverse through all descendants of a node to check if event should be fired for any descendant
      checkChildNodesRecursively: function(nodes, registrationData, matchFunc, callbacksToBeCalled) {
        // check each new node if it matches the selector
        for (var i=0, node; (node = nodes[i]); i++) {
          if (matchFunc(node, registrationData, callbacksToBeCalled)) {
            callbacksToBeCalled.push({ callback: registrationData.callback, elem: node });
          }

          if (node.childNodes.length > 0) {
            utils.checkChildNodesRecursively(node.childNodes, registrationData, matchFunc, callbacksToBeCalled);
          }
        }
      },
      mergeArrays: function(firstArr, secondArr){
        // Overwrites default options with user-defined options.
        var options = {},
            attrName;
        for (attrName in firstArr) {
          if (firstArr.hasOwnProperty(attrName)) {
            options[attrName] = firstArr[attrName];
          }
        }
        for (attrName in secondArr) {
          if (secondArr.hasOwnProperty(attrName)) {
            options[attrName] = secondArr[attrName];
          }
        }
        return options;
      },
      toElementsArray: function (elements) {
        // check if object is an array (or array like object)
        // Note: window object has .length property but it's not array of elements so don't consider it an array
        if (typeof elements !== "undefined" && (typeof elements.length !== "number" || elements === window)) {
          elements = [elements];
        }
        return elements;
      }
    };
  })();


  // Class to maintain state of all registered events of a single type
  var EventsBucket = (function() {
    var EventsBucket = function() {
      // holds all the events

      this._eventsBucket    = [];
      // function to be called while adding an event, the function should do the event initialization/registration
      this._beforeAdding    = null;
      // function to be called while removing an event, the function should do the event destruction
      this._beforeRemoving  = null;
    };

    EventsBucket.prototype.addEvent = function(target, selector, options, callback) {
      var newEvent = {
        target:             target,
        selector:           selector,
        options:            options,
        callback:           callback,
        firedElems:         []
      };

      if (this._beforeAdding) {
        this._beforeAdding(newEvent);
      }

      this._eventsBucket.push(newEvent);
      return newEvent;
    };

    EventsBucket.prototype.removeEvent = function(compareFunction) {
      for (var i=this._eventsBucket.length - 1, registeredEvent; (registeredEvent = this._eventsBucket[i]); i--) {
        if (compareFunction(registeredEvent)) {
          if (this._beforeRemoving) {
              this._beforeRemoving(registeredEvent);
          }

          // mark callback as null so that even if an event mutation was already triggered it does not call callback
          var removedEvents = this._eventsBucket.splice(i, 1);
          if (removedEvents && removedEvents.length) {
            removedEvents[0].callback = null;
          }
        }
      }
    };

    EventsBucket.prototype.beforeAdding = function(beforeAdding) {
      this._beforeAdding = beforeAdding;
    };

    EventsBucket.prototype.beforeRemoving = function(beforeRemoving) {
      this._beforeRemoving = beforeRemoving;
    };

    return EventsBucket;
  })();


  /**
   * @constructor
   * General class for binding/unbinding arrive and leave events
   */
  var MutationEvents = function(getObserverConfig, onMutation) {
    var eventsBucket    = new EventsBucket(),
        me              = this;

    var defaultOptions = {
      fireOnAttributesModification: false
    };

    // actual event registration before adding it to bucket
    eventsBucket.beforeAdding(function(registrationData) {
      var
        target    = registrationData.target,
        observer;

      // mutation observer does not work on window or document
      if (target === window.document || target === window) {
        target = document.getElementsByTagName("html")[0];
      }

      // Create an observer instance
      observer = new MutationObserver(function(e) {
        onMutation.call(this, e, registrationData);
      });

      var config = getObserverConfig(registrationData.options);

      observer.observe(target, config);

      registrationData.observer = observer;
      registrationData.me = me;
    });

    // cleanup/unregister before removing an event
    eventsBucket.beforeRemoving(function (eventData) {
      eventData.observer.disconnect();
    });

    this.bindEvent = function(selector, options, callback) {
      options = utils.mergeArrays(defaultOptions, options);

      var elements = utils.toElementsArray(this);

      for (var i = 0; i < elements.length; i++) {
        eventsBucket.addEvent(elements[i], selector, options, callback);
      }
    };

    this.unbindEvent = function() {
      var elements = utils.toElementsArray(this);
      eventsBucket.removeEvent(function(eventObj) {
        for (var i = 0; i < elements.length; i++) {
          if (this === undefined || eventObj.target === elements[i]) {
            return true;
          }
        }
        return false;
      });
    };

    this.unbindEventWithSelectorOrCallback = function(selector) {
      var elements = utils.toElementsArray(this),
          callback = selector,
          compareFunction;

      if (typeof selector === "function") {
        compareFunction = function(eventObj) {
          for (var i = 0; i < elements.length; i++) {
            if ((this === undefined || eventObj.target === elements[i]) && eventObj.callback === callback) {
              return true;
            }
          }
          return false;
        };
      }
      else {
        compareFunction = function(eventObj) {
          for (var i = 0; i < elements.length; i++) {
            if ((this === undefined || eventObj.target === elements[i]) && eventObj.selector === selector) {
              return true;
            }
          }
          return false;
        };
      }
      eventsBucket.removeEvent(compareFunction);
    };

    this.unbindEventWithSelectorAndCallback = function(selector, callback) {
      var elements = utils.toElementsArray(this);
      eventsBucket.removeEvent(function(eventObj) {
          for (var i = 0; i < elements.length; i++) {
            if ((this === undefined || eventObj.target === elements[i]) && eventObj.selector === selector && eventObj.callback === callback) {
              return true;
            }
          }
          return false;
      });
    };

    return this;
  };


  /**
   * @constructor
   * Processes 'arrive' events
   */
  var ArriveEvents = function() {
    // Default options for 'arrive' event
    var arriveDefaultOptions = {
      fireOnAttributesModification: false,
      onceOnly: false,
      existing: false
    };

    function getArriveObserverConfig(options) {
      var config = {
        attributes: false,
        childList: true,
        subtree: true
      };

      if (options.fireOnAttributesModification) {
        config.attributes = true;
      }

      return config;
    }

    function onArriveMutation(mutations, registrationData) {
      mutations.forEach(function( mutation ) {
        var newNodes    = mutation.addedNodes,
            targetNode = mutation.target,
            callbacksToBeCalled = [],
            node;

        // If new nodes are added
        if( newNodes !== null && newNodes.length > 0 ) {
          utils.checkChildNodesRecursively(newNodes, registrationData, nodeMatchFunc, callbacksToBeCalled);
        }
        else if (mutation.type === "attributes") {
          if (nodeMatchFunc(targetNode, registrationData, callbacksToBeCalled)) {
            callbacksToBeCalled.push({ callback: registrationData.callback, elem: targetNode });
          }
        }

        utils.callCallbacks(callbacksToBeCalled, registrationData);
      });
    }

    function nodeMatchFunc(node, registrationData, callbacksToBeCalled) {
      // check a single node to see if it matches the selector
      if (utils.matchesSelector(node, registrationData.selector)) {
        if(node._id === undefined) {
          node._id = arriveUniqueId++;
        }
        // make sure the arrive event is not already fired for the element
        if (registrationData.firedElems.indexOf(node._id) == -1) {
          registrationData.firedElems.push(node._id);

          return true;
        }
      }

      return false;
    }

    arriveEvents = new MutationEvents(getArriveObserverConfig, onArriveMutation);

    var mutationBindEvent = arriveEvents.bindEvent;

    // override bindEvent function
    arriveEvents.bindEvent = function(selector, options, callback) {

      if (typeof callback === "undefined") {
        callback = options;
        options = arriveDefaultOptions;
      } else {
        options = utils.mergeArrays(arriveDefaultOptions, options);
      }

      var elements = utils.toElementsArray(this);

      if (options.existing) {
        var existing = [];

        for (var i = 0; i < elements.length; i++) {
          var nodes = elements[i].querySelectorAll(selector);
          for (var j = 0; j < nodes.length; j++) {
            existing.push({ callback: callback, elem: nodes[j] });
          }
        }

        // no need to bind event if the callback has to be fired only once and we have already found the element
        if (options.onceOnly && existing.length) {
          return callback.call(existing[0].elem, existing[0].elem);
        }

        setTimeout(utils.callCallbacks, 1, existing);
      }

      mutationBindEvent.call(this, selector, options, callback);
    };

    return arriveEvents;
  };


  /**
   * @constructor
   * Processes 'leave' events
   */
  var LeaveEvents = function() {
    // Default options for 'leave' event
    var leaveDefaultOptions = {};

    function getLeaveObserverConfig() {
      var config = {
        childList: true,
        subtree: true
      };

      return config;
    }

    function onLeaveMutation(mutations, registrationData) {
      mutations.forEach(function( mutation ) {
        var removedNodes  = mutation.removedNodes,
            callbacksToBeCalled = [];

        if( removedNodes !== null && removedNodes.length > 0 ) {
          utils.checkChildNodesRecursively(removedNodes, registrationData, nodeMatchFunc, callbacksToBeCalled);
        }

        utils.callCallbacks(callbacksToBeCalled, registrationData);
      });
    }

    function nodeMatchFunc(node, registrationData) {
      return utils.matchesSelector(node, registrationData.selector);
    }

    leaveEvents = new MutationEvents(getLeaveObserverConfig, onLeaveMutation);

    var mutationBindEvent = leaveEvents.bindEvent;

    // override bindEvent function
    leaveEvents.bindEvent = function(selector, options, callback) {

      if (typeof callback === "undefined") {
        callback = options;
        options = leaveDefaultOptions;
      } else {
        options = utils.mergeArrays(leaveDefaultOptions, options);
      }

      mutationBindEvent.call(this, selector, options, callback);
    };

    return leaveEvents;
  };


  var arriveEvents = new ArriveEvents(),
      leaveEvents  = new LeaveEvents();

  function exposeUnbindApi(eventObj, exposeTo, funcName) {
    // expose unbind function with function overriding
    utils.addMethod(exposeTo, funcName, eventObj.unbindEvent);
    utils.addMethod(exposeTo, funcName, eventObj.unbindEventWithSelectorOrCallback);
    utils.addMethod(exposeTo, funcName, eventObj.unbindEventWithSelectorAndCallback);
  }

  /*** expose APIs ***/
  function exposeApi(exposeTo) {
    exposeTo.arrive = arriveEvents.bindEvent;
    exposeUnbindApi(arriveEvents, exposeTo, "unbindArrive");

    exposeTo.leave = leaveEvents.bindEvent;
    exposeUnbindApi(leaveEvents, exposeTo, "unbindLeave");
  }

  if ($) {
    exposeApi($.fn);
  }
  exposeApi(HTMLElement.prototype);
  exposeApi(NodeList.prototype);
  exposeApi(HTMLCollection.prototype);
  exposeApi(HTMLDocument.prototype);
  exposeApi(Window.prototype);

  var Arrive = {};
  // expose functions to unbind all arrive/leave events
  exposeUnbindApi(arriveEvents, Arrive, "unbindAllArrive");
  exposeUnbindApi(leaveEvents, Arrive, "unbindAllLeave");

  return Arrive;

})(window, typeof jQuery === 'undefined' ? null : jQuery, undefined);

/***/ }),

/***/ 553:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
const boundaries_1 = __webpack_require__(658);
const GraphemerHelper_1 = __importDefault(__webpack_require__(257));
const GraphemerIterator_1 = __importDefault(__webpack_require__(670));
class Graphemer {
    /**
     * Returns the next grapheme break in the string after the given index
     * @param string {string}
     * @param index {number}
     * @returns {number}
     */
    static nextBreak(string, index) {
        if (index === undefined) {
            index = 0;
        }
        if (index < 0) {
            return 0;
        }
        if (index >= string.length - 1) {
            return string.length;
        }
        const prevCP = GraphemerHelper_1.default.codePointAt(string, index);
        const prev = Graphemer.getGraphemeBreakProperty(prevCP);
        const prevEmoji = Graphemer.getEmojiProperty(prevCP);
        const mid = [];
        const midEmoji = [];
        for (let i = index + 1; i < string.length; i++) {
            // check for already processed low surrogates
            if (GraphemerHelper_1.default.isSurrogate(string, i - 1)) {
                continue;
            }
            const nextCP = GraphemerHelper_1.default.codePointAt(string, i);
            const next = Graphemer.getGraphemeBreakProperty(nextCP);
            const nextEmoji = Graphemer.getEmojiProperty(nextCP);
            if (GraphemerHelper_1.default.shouldBreak(prev, mid, next, prevEmoji, midEmoji, nextEmoji)) {
                return i;
            }
            mid.push(next);
            midEmoji.push(nextEmoji);
        }
        return string.length;
    }
    /**
     * Breaks the given string into an array of grapheme clusters
     * @param str {string}
     * @returns {string[]}
     */
    splitGraphemes(str) {
        const res = [];
        let index = 0;
        let brk;
        while ((brk = Graphemer.nextBreak(str, index)) < str.length) {
            res.push(str.slice(index, brk));
            index = brk;
        }
        if (index < str.length) {
            res.push(str.slice(index));
        }
        return res;
    }
    /**
     * Returns an iterator of grapheme clusters in the given string
     * @param str {string}
     * @returns {GraphemerIterator}
     */
    iterateGraphemes(str) {
        return new GraphemerIterator_1.default(str);
    }
    /**
     * Returns the number of grapheme clusters in the given string
     * @param str {string}
     * @returns {number}
     */
    countGraphemes(str) {
        let count = 0;
        let index = 0;
        let brk;
        while ((brk = Graphemer.nextBreak(str, index)) < str.length) {
            index = brk;
            count++;
        }
        if (index < str.length) {
            count++;
        }
        return count;
    }
    /**
     * Given a Unicode code point, determines this symbol's grapheme break property
     * @param code {number} Unicode code point
     * @returns {number}
     */
    static getGraphemeBreakProperty(code) {
        // Grapheme break property taken from:
        // https://www.unicode.org/Public/UCD/latest/ucd/auxiliary/GraphemeBreakProperty.txt
        // and generated by
        // node ./scripts/generate-grapheme-break.js
        if (code < 0xbeb4) {
            if (code < 0xac54) {
                if (code < 0x1031) {
                    if (code < 0xb3c) {
                        if (code < 0x93e) {
                            if (code < 0x6df) {
                                if (code < 0x5bf) {
                                    if (code < 0x7f) {
                                        if (code < 0xb) {
                                            if (code < 0xa) {
                                                // Cc  [10] <control-0000>..<control-0009>
                                                if (0x0 <= code && code <= 0x9) {
                                                    return boundaries_1.CLUSTER_BREAK.CONTROL;
                                                }
                                            }
                                            else {
                                                // Cc       <control-000A>
                                                if (0xa === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LF;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xd) {
                                                // Cc   [2] <control-000B>..<control-000C>
                                                if (0xb <= code && code <= 0xc) {
                                                    return boundaries_1.CLUSTER_BREAK.CONTROL;
                                                }
                                            }
                                            else {
                                                if (code < 0xe) {
                                                    // Cc       <control-000D>
                                                    if (0xd === code) {
                                                        return boundaries_1.CLUSTER_BREAK.CR;
                                                    }
                                                }
                                                else {
                                                    // Cc  [18] <control-000E>..<control-001F>
                                                    if (0xe <= code && code <= 0x1f) {
                                                        return boundaries_1.CLUSTER_BREAK.CONTROL;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0x300) {
                                            if (code < 0xad) {
                                                // Cc  [33] <control-007F>..<control-009F>
                                                if (0x7f <= code && code <= 0x9f) {
                                                    return boundaries_1.CLUSTER_BREAK.CONTROL;
                                                }
                                            }
                                            else {
                                                // Cf       SOFT HYPHEN
                                                if (0xad === code) {
                                                    return boundaries_1.CLUSTER_BREAK.CONTROL;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0x483) {
                                                // Mn [112] COMBINING GRAVE ACCENT..COMBINING LATIN SMALL LETTER X
                                                if (0x300 <= code && code <= 0x36f) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                if (code < 0x591) {
                                                    // Mn   [5] COMBINING CYRILLIC TITLO..COMBINING CYRILLIC POKRYTIE
                                                    // Me   [2] COMBINING CYRILLIC HUNDRED THOUSANDS SIGN..COMBINING CYRILLIC MILLIONS SIGN
                                                    if (0x483 <= code && code <= 0x489) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                                else {
                                                    // Mn  [45] HEBREW ACCENT ETNAHTA..HEBREW POINT METEG
                                                    if (0x591 <= code && code <= 0x5bd) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                else {
                                    if (code < 0x610) {
                                        if (code < 0x5c4) {
                                            if (code < 0x5c1) {
                                                // Mn       HEBREW POINT RAFE
                                                if (0x5bf === code) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                // Mn   [2] HEBREW POINT SHIN DOT..HEBREW POINT SIN DOT
                                                if (0x5c1 <= code && code <= 0x5c2) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0x5c7) {
                                                // Mn   [2] HEBREW MARK UPPER DOT..HEBREW MARK LOWER DOT
                                                if (0x5c4 <= code && code <= 0x5c5) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                if (code < 0x600) {
                                                    // Mn       HEBREW POINT QAMATS QATAN
                                                    if (0x5c7 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                                else {
                                                    // Cf   [6] ARABIC NUMBER SIGN..ARABIC NUMBER MARK ABOVE
                                                    if (0x600 <= code && code <= 0x605) {
                                                        return boundaries_1.CLUSTER_BREAK.PREPEND;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0x670) {
                                            if (code < 0x61c) {
                                                // Mn  [11] ARABIC SIGN SALLALLAHOU ALAYHE WASSALLAM..ARABIC SMALL KASRA
                                                if (0x610 <= code && code <= 0x61a) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                if (code < 0x64b) {
                                                    // Cf       ARABIC LETTER MARK
                                                    if (0x61c === code) {
                                                        return boundaries_1.CLUSTER_BREAK.CONTROL;
                                                    }
                                                }
                                                else {
                                                    // Mn  [21] ARABIC FATHATAN..ARABIC WAVY HAMZA BELOW
                                                    if (0x64b <= code && code <= 0x65f) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0x6d6) {
                                                // Mn       ARABIC LETTER SUPERSCRIPT ALEF
                                                if (0x670 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                if (code < 0x6dd) {
                                                    // Mn   [7] ARABIC SMALL HIGH LIGATURE SAD WITH LAM WITH ALEF MAKSURA..ARABIC SMALL HIGH SEEN
                                                    if (0x6d6 <= code && code <= 0x6dc) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                                else {
                                                    // Cf       ARABIC END OF AYAH
                                                    if (0x6dd === code) {
                                                        return boundaries_1.CLUSTER_BREAK.PREPEND;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            else {
                                if (code < 0x81b) {
                                    if (code < 0x730) {
                                        if (code < 0x6ea) {
                                            if (code < 0x6e7) {
                                                // Mn   [6] ARABIC SMALL HIGH ROUNDED ZERO..ARABIC SMALL HIGH MADDA
                                                if (0x6df <= code && code <= 0x6e4) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                // Mn   [2] ARABIC SMALL HIGH YEH..ARABIC SMALL HIGH NOON
                                                if (0x6e7 <= code && code <= 0x6e8) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0x70f) {
                                                // Mn   [4] ARABIC EMPTY CENTRE LOW STOP..ARABIC SMALL LOW MEEM
                                                if (0x6ea <= code && code <= 0x6ed) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                // Cf       SYRIAC ABBREVIATION MARK
                                                if (0x70f === code) {
                                                    return boundaries_1.CLUSTER_BREAK.PREPEND;
                                                }
                                                // Mn       SYRIAC LETTER SUPERSCRIPT ALAPH
                                                if (0x711 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0x7eb) {
                                            if (code < 0x7a6) {
                                                // Mn  [27] SYRIAC PTHAHA ABOVE..SYRIAC BARREKH
                                                if (0x730 <= code && code <= 0x74a) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                // Mn  [11] THAANA ABAFILI..THAANA SUKUN
                                                if (0x7a6 <= code && code <= 0x7b0) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0x7fd) {
                                                // Mn   [9] NKO COMBINING SHORT HIGH TONE..NKO COMBINING DOUBLE DOT ABOVE
                                                if (0x7eb <= code && code <= 0x7f3) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                if (code < 0x816) {
                                                    // Mn       NKO DANTAYALAN
                                                    if (0x7fd === code) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                                else {
                                                    // Mn   [4] SAMARITAN MARK IN..SAMARITAN MARK DAGESH
                                                    if (0x816 <= code && code <= 0x819) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                else {
                                    if (code < 0x8e2) {
                                        if (code < 0x829) {
                                            if (code < 0x825) {
                                                // Mn   [9] SAMARITAN MARK EPENTHETIC YUT..SAMARITAN VOWEL SIGN A
                                                if (0x81b <= code && code <= 0x823) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                // Mn   [3] SAMARITAN VOWEL SIGN SHORT A..SAMARITAN VOWEL SIGN U
                                                if (0x825 <= code && code <= 0x827) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0x859) {
                                                // Mn   [5] SAMARITAN VOWEL SIGN LONG I..SAMARITAN MARK NEQUDAA
                                                if (0x829 <= code && code <= 0x82d) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                if (code < 0x8d3) {
                                                    // Mn   [3] MANDAIC AFFRICATION MARK..MANDAIC GEMINATION MARK
                                                    if (0x859 <= code && code <= 0x85b) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                                else {
                                                    // Mn  [15] ARABIC SMALL LOW WAW..ARABIC SMALL HIGH SIGN SAFHA
                                                    if (0x8d3 <= code && code <= 0x8e1) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0x93a) {
                                            if (code < 0x8e3) {
                                                // Cf       ARABIC DISPUTED END OF AYAH
                                                if (0x8e2 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.PREPEND;
                                                }
                                            }
                                            else {
                                                if (code < 0x903) {
                                                    // Mn  [32] ARABIC TURNED DAMMA BELOW..DEVANAGARI SIGN ANUSVARA
                                                    if (0x8e3 <= code && code <= 0x902) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                                else {
                                                    // Mc       DEVANAGARI SIGN VISARGA
                                                    if (0x903 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                    }
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0x93b) {
                                                // Mn       DEVANAGARI VOWEL SIGN OE
                                                if (0x93a === code) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                // Mc       DEVANAGARI VOWEL SIGN OOE
                                                if (0x93b === code) {
                                                    return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                }
                                                // Mn       DEVANAGARI SIGN NUKTA
                                                if (0x93c === code) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        else {
                            if (code < 0xa3c) {
                                if (code < 0x9be) {
                                    if (code < 0x951) {
                                        if (code < 0x949) {
                                            if (code < 0x941) {
                                                // Mc   [3] DEVANAGARI VOWEL SIGN AA..DEVANAGARI VOWEL SIGN II
                                                if (0x93e <= code && code <= 0x940) {
                                                    return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                }
                                            }
                                            else {
                                                // Mn   [8] DEVANAGARI VOWEL SIGN U..DEVANAGARI VOWEL SIGN AI
                                                if (0x941 <= code && code <= 0x948) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0x94d) {
                                                // Mc   [4] DEVANAGARI VOWEL SIGN CANDRA O..DEVANAGARI VOWEL SIGN AU
                                                if (0x949 <= code && code <= 0x94c) {
                                                    return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                }
                                            }
                                            else {
                                                if (code < 0x94e) {
                                                    // Mn       DEVANAGARI SIGN VIRAMA
                                                    if (0x94d === code) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                                else {
                                                    // Mc   [2] DEVANAGARI VOWEL SIGN PRISHTHAMATRA E..DEVANAGARI VOWEL SIGN AW
                                                    if (0x94e <= code && code <= 0x94f) {
                                                        return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0x981) {
                                            if (code < 0x962) {
                                                // Mn   [7] DEVANAGARI STRESS SIGN UDATTA..DEVANAGARI VOWEL SIGN UUE
                                                if (0x951 <= code && code <= 0x957) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                // Mn   [2] DEVANAGARI VOWEL SIGN VOCALIC L..DEVANAGARI VOWEL SIGN VOCALIC LL
                                                if (0x962 <= code && code <= 0x963) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0x982) {
                                                // Mn       BENGALI SIGN CANDRABINDU
                                                if (0x981 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                if (code < 0x9bc) {
                                                    // Mc   [2] BENGALI SIGN ANUSVARA..BENGALI SIGN VISARGA
                                                    if (0x982 <= code && code <= 0x983) {
                                                        return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                    }
                                                }
                                                else {
                                                    // Mn       BENGALI SIGN NUKTA
                                                    if (0x9bc === code) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                else {
                                    if (code < 0x9cd) {
                                        if (code < 0x9c1) {
                                            if (code < 0x9bf) {
                                                // Mc       BENGALI VOWEL SIGN AA
                                                if (0x9be === code) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                // Mc   [2] BENGALI VOWEL SIGN I..BENGALI VOWEL SIGN II
                                                if (0x9bf <= code && code <= 0x9c0) {
                                                    return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0x9c7) {
                                                // Mn   [4] BENGALI VOWEL SIGN U..BENGALI VOWEL SIGN VOCALIC RR
                                                if (0x9c1 <= code && code <= 0x9c4) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                if (code < 0x9cb) {
                                                    // Mc   [2] BENGALI VOWEL SIGN E..BENGALI VOWEL SIGN AI
                                                    if (0x9c7 <= code && code <= 0x9c8) {
                                                        return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                    }
                                                }
                                                else {
                                                    // Mc   [2] BENGALI VOWEL SIGN O..BENGALI VOWEL SIGN AU
                                                    if (0x9cb <= code && code <= 0x9cc) {
                                                        return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0x9fe) {
                                            if (code < 0x9d7) {
                                                // Mn       BENGALI SIGN VIRAMA
                                                if (0x9cd === code) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                if (code < 0x9e2) {
                                                    // Mc       BENGALI AU LENGTH MARK
                                                    if (0x9d7 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                                else {
                                                    // Mn   [2] BENGALI VOWEL SIGN VOCALIC L..BENGALI VOWEL SIGN VOCALIC LL
                                                    if (0x9e2 <= code && code <= 0x9e3) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xa01) {
                                                // Mn       BENGALI SANDHI MARK
                                                if (0x9fe === code) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                if (code < 0xa03) {
                                                    // Mn   [2] GURMUKHI SIGN ADAK BINDI..GURMUKHI SIGN BINDI
                                                    if (0xa01 <= code && code <= 0xa02) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                                else {
                                                    // Mc       GURMUKHI SIGN VISARGA
                                                    if (0xa03 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            else {
                                if (code < 0xabc) {
                                    if (code < 0xa51) {
                                        if (code < 0xa41) {
                                            if (code < 0xa3e) {
                                                // Mn       GURMUKHI SIGN NUKTA
                                                if (0xa3c === code) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                // Mc   [3] GURMUKHI VOWEL SIGN AA..GURMUKHI VOWEL SIGN II
                                                if (0xa3e <= code && code <= 0xa40) {
                                                    return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xa47) {
                                                // Mn   [2] GURMUKHI VOWEL SIGN U..GURMUKHI VOWEL SIGN UU
                                                if (0xa41 <= code && code <= 0xa42) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                if (code < 0xa4b) {
                                                    // Mn   [2] GURMUKHI VOWEL SIGN EE..GURMUKHI VOWEL SIGN AI
                                                    if (0xa47 <= code && code <= 0xa48) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                                else {
                                                    // Mn   [3] GURMUKHI VOWEL SIGN OO..GURMUKHI SIGN VIRAMA
                                                    if (0xa4b <= code && code <= 0xa4d) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0xa75) {
                                            if (code < 0xa70) {
                                                // Mn       GURMUKHI SIGN UDAAT
                                                if (0xa51 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                // Mn   [2] GURMUKHI TIPPI..GURMUKHI ADDAK
                                                if (0xa70 <= code && code <= 0xa71) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xa81) {
                                                // Mn       GURMUKHI SIGN YAKASH
                                                if (0xa75 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                if (code < 0xa83) {
                                                    // Mn   [2] GUJARATI SIGN CANDRABINDU..GUJARATI SIGN ANUSVARA
                                                    if (0xa81 <= code && code <= 0xa82) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                                else {
                                                    // Mc       GUJARATI SIGN VISARGA
                                                    if (0xa83 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                else {
                                    if (code < 0xacb) {
                                        if (code < 0xac1) {
                                            if (code < 0xabe) {
                                                // Mn       GUJARATI SIGN NUKTA
                                                if (0xabc === code) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                // Mc   [3] GUJARATI VOWEL SIGN AA..GUJARATI VOWEL SIGN II
                                                if (0xabe <= code && code <= 0xac0) {
                                                    return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xac7) {
                                                // Mn   [5] GUJARATI VOWEL SIGN U..GUJARATI VOWEL SIGN CANDRA E
                                                if (0xac1 <= code && code <= 0xac5) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                if (code < 0xac9) {
                                                    // Mn   [2] GUJARATI VOWEL SIGN E..GUJARATI VOWEL SIGN AI
                                                    if (0xac7 <= code && code <= 0xac8) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                                else {
                                                    // Mc       GUJARATI VOWEL SIGN CANDRA O
                                                    if (0xac9 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0xafa) {
                                            if (code < 0xacd) {
                                                // Mc   [2] GUJARATI VOWEL SIGN O..GUJARATI VOWEL SIGN AU
                                                if (0xacb <= code && code <= 0xacc) {
                                                    return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                }
                                            }
                                            else {
                                                if (code < 0xae2) {
                                                    // Mn       GUJARATI SIGN VIRAMA
                                                    if (0xacd === code) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                                else {
                                                    // Mn   [2] GUJARATI VOWEL SIGN VOCALIC L..GUJARATI VOWEL SIGN VOCALIC LL
                                                    if (0xae2 <= code && code <= 0xae3) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xb01) {
                                                // Mn   [6] GUJARATI SIGN SUKUN..GUJARATI SIGN TWO-CIRCLE NUKTA ABOVE
                                                if (0xafa <= code && code <= 0xaff) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                if (code < 0xb02) {
                                                    // Mn       ORIYA SIGN CANDRABINDU
                                                    if (0xb01 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                                else {
                                                    // Mc   [2] ORIYA SIGN ANUSVARA..ORIYA SIGN VISARGA
                                                    if (0xb02 <= code && code <= 0xb03) {
                                                        return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                    else {
                        if (code < 0xd02) {
                            if (code < 0xc3e) {
                                if (code < 0xbbe) {
                                    if (code < 0xb4b) {
                                        if (code < 0xb40) {
                                            if (code < 0xb3e) {
                                                // Mn       ORIYA SIGN NUKTA
                                                if (0xb3c === code) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                // Mc       ORIYA VOWEL SIGN AA
                                                // Mn       ORIYA VOWEL SIGN I
                                                if (0xb3e <= code && code <= 0xb3f) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xb41) {
                                                // Mc       ORIYA VOWEL SIGN II
                                                if (0xb40 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                }
                                            }
                                            else {
                                                if (code < 0xb47) {
                                                    // Mn   [4] ORIYA VOWEL SIGN U..ORIYA VOWEL SIGN VOCALIC RR
                                                    if (0xb41 <= code && code <= 0xb44) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                                else {
                                                    // Mc   [2] ORIYA VOWEL SIGN E..ORIYA VOWEL SIGN AI
                                                    if (0xb47 <= code && code <= 0xb48) {
                                                        return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0xb55) {
                                            if (code < 0xb4d) {
                                                // Mc   [2] ORIYA VOWEL SIGN O..ORIYA VOWEL SIGN AU
                                                if (0xb4b <= code && code <= 0xb4c) {
                                                    return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                }
                                            }
                                            else {
                                                // Mn       ORIYA SIGN VIRAMA
                                                if (0xb4d === code) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xb62) {
                                                // Mn   [2] ORIYA SIGN OVERLINE..ORIYA AI LENGTH MARK
                                                // Mc       ORIYA AU LENGTH MARK
                                                if (0xb55 <= code && code <= 0xb57) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                if (code < 0xb82) {
                                                    // Mn   [2] ORIYA VOWEL SIGN VOCALIC L..ORIYA VOWEL SIGN VOCALIC LL
                                                    if (0xb62 <= code && code <= 0xb63) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                                else {
                                                    // Mn       TAMIL SIGN ANUSVARA
                                                    if (0xb82 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                else {
                                    if (code < 0xbca) {
                                        if (code < 0xbc0) {
                                            // Mc       TAMIL VOWEL SIGN AA
                                            if (0xbbe === code) {
                                                return boundaries_1.CLUSTER_BREAK.EXTEND;
                                            }
                                            // Mc       TAMIL VOWEL SIGN I
                                            if (0xbbf === code) {
                                                return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                            }
                                        }
                                        else {
                                            if (code < 0xbc1) {
                                                // Mn       TAMIL VOWEL SIGN II
                                                if (0xbc0 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                if (code < 0xbc6) {
                                                    // Mc   [2] TAMIL VOWEL SIGN U..TAMIL VOWEL SIGN UU
                                                    if (0xbc1 <= code && code <= 0xbc2) {
                                                        return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                    }
                                                }
                                                else {
                                                    // Mc   [3] TAMIL VOWEL SIGN E..TAMIL VOWEL SIGN AI
                                                    if (0xbc6 <= code && code <= 0xbc8) {
                                                        return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0xc00) {
                                            if (code < 0xbcd) {
                                                // Mc   [3] TAMIL VOWEL SIGN O..TAMIL VOWEL SIGN AU
                                                if (0xbca <= code && code <= 0xbcc) {
                                                    return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                }
                                            }
                                            else {
                                                // Mn       TAMIL SIGN VIRAMA
                                                if (0xbcd === code) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                                // Mc       TAMIL AU LENGTH MARK
                                                if (0xbd7 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xc01) {
                                                // Mn       TELUGU SIGN COMBINING CANDRABINDU ABOVE
                                                if (0xc00 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                if (code < 0xc04) {
                                                    // Mc   [3] TELUGU SIGN CANDRABINDU..TELUGU SIGN VISARGA
                                                    if (0xc01 <= code && code <= 0xc03) {
                                                        return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                    }
                                                }
                                                else {
                                                    // Mn       TELUGU SIGN COMBINING ANUSVARA ABOVE
                                                    if (0xc04 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            else {
                                if (code < 0xcbf) {
                                    if (code < 0xc62) {
                                        if (code < 0xc46) {
                                            if (code < 0xc41) {
                                                // Mn   [3] TELUGU VOWEL SIGN AA..TELUGU VOWEL SIGN II
                                                if (0xc3e <= code && code <= 0xc40) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                // Mc   [4] TELUGU VOWEL SIGN U..TELUGU VOWEL SIGN VOCALIC RR
                                                if (0xc41 <= code && code <= 0xc44) {
                                                    return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xc4a) {
                                                // Mn   [3] TELUGU VOWEL SIGN E..TELUGU VOWEL SIGN AI
                                                if (0xc46 <= code && code <= 0xc48) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                if (code < 0xc55) {
                                                    // Mn   [4] TELUGU VOWEL SIGN O..TELUGU SIGN VIRAMA
                                                    if (0xc4a <= code && code <= 0xc4d) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                                else {
                                                    // Mn   [2] TELUGU LENGTH MARK..TELUGU AI LENGTH MARK
                                                    if (0xc55 <= code && code <= 0xc56) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0xc82) {
                                            if (code < 0xc81) {
                                                // Mn   [2] TELUGU VOWEL SIGN VOCALIC L..TELUGU VOWEL SIGN VOCALIC LL
                                                if (0xc62 <= code && code <= 0xc63) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                // Mn       KANNADA SIGN CANDRABINDU
                                                if (0xc81 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xcbc) {
                                                // Mc   [2] KANNADA SIGN ANUSVARA..KANNADA SIGN VISARGA
                                                if (0xc82 <= code && code <= 0xc83) {
                                                    return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                }
                                            }
                                            else {
                                                // Mn       KANNADA SIGN NUKTA
                                                if (0xcbc === code) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                                // Mc       KANNADA VOWEL SIGN AA
                                                if (0xcbe === code) {
                                                    return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                }
                                            }
                                        }
                                    }
                                }
                                else {
                                    if (code < 0xcc7) {
                                        if (code < 0xcc2) {
                                            if (code < 0xcc0) {
                                                // Mn       KANNADA VOWEL SIGN I
                                                if (0xcbf === code) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                // Mc   [2] KANNADA VOWEL SIGN II..KANNADA VOWEL SIGN U
                                                if (0xcc0 <= code && code <= 0xcc1) {
                                                    return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xcc3) {
                                                // Mc       KANNADA VOWEL SIGN UU
                                                if (0xcc2 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                if (code < 0xcc6) {
                                                    // Mc   [2] KANNADA VOWEL SIGN VOCALIC R..KANNADA VOWEL SIGN VOCALIC RR
                                                    if (0xcc3 <= code && code <= 0xcc4) {
                                                        return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                    }
                                                }
                                                else {
                                                    // Mn       KANNADA VOWEL SIGN E
                                                    if (0xcc6 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0xcd5) {
                                            if (code < 0xcca) {
                                                // Mc   [2] KANNADA VOWEL SIGN EE..KANNADA VOWEL SIGN AI
                                                if (0xcc7 <= code && code <= 0xcc8) {
                                                    return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                }
                                            }
                                            else {
                                                if (code < 0xccc) {
                                                    // Mc   [2] KANNADA VOWEL SIGN O..KANNADA VOWEL SIGN OO
                                                    if (0xcca <= code && code <= 0xccb) {
                                                        return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                    }
                                                }
                                                else {
                                                    // Mn   [2] KANNADA VOWEL SIGN AU..KANNADA SIGN VIRAMA
                                                    if (0xccc <= code && code <= 0xccd) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xce2) {
                                                // Mc   [2] KANNADA LENGTH MARK..KANNADA AI LENGTH MARK
                                                if (0xcd5 <= code && code <= 0xcd6) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                if (code < 0xd00) {
                                                    // Mn   [2] KANNADA VOWEL SIGN VOCALIC L..KANNADA VOWEL SIGN VOCALIC LL
                                                    if (0xce2 <= code && code <= 0xce3) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                                else {
                                                    // Mn   [2] MALAYALAM SIGN COMBINING ANUSVARA ABOVE..MALAYALAM SIGN CANDRABINDU
                                                    if (0xd00 <= code && code <= 0xd01) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        else {
                            if (code < 0xe31) {
                                if (code < 0xd62) {
                                    if (code < 0xd46) {
                                        if (code < 0xd3e) {
                                            if (code < 0xd3b) {
                                                // Mc   [2] MALAYALAM SIGN ANUSVARA..MALAYALAM SIGN VISARGA
                                                if (0xd02 <= code && code <= 0xd03) {
                                                    return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                }
                                            }
                                            else {
                                                // Mn   [2] MALAYALAM SIGN VERTICAL BAR VIRAMA..MALAYALAM SIGN CIRCULAR VIRAMA
                                                if (0xd3b <= code && code <= 0xd3c) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xd3f) {
                                                // Mc       MALAYALAM VOWEL SIGN AA
                                                if (0xd3e === code) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                if (code < 0xd41) {
                                                    // Mc   [2] MALAYALAM VOWEL SIGN I..MALAYALAM VOWEL SIGN II
                                                    if (0xd3f <= code && code <= 0xd40) {
                                                        return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                    }
                                                }
                                                else {
                                                    // Mn   [4] MALAYALAM VOWEL SIGN U..MALAYALAM VOWEL SIGN VOCALIC RR
                                                    if (0xd41 <= code && code <= 0xd44) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0xd4d) {
                                            if (code < 0xd4a) {
                                                // Mc   [3] MALAYALAM VOWEL SIGN E..MALAYALAM VOWEL SIGN AI
                                                if (0xd46 <= code && code <= 0xd48) {
                                                    return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                }
                                            }
                                            else {
                                                // Mc   [3] MALAYALAM VOWEL SIGN O..MALAYALAM VOWEL SIGN AU
                                                if (0xd4a <= code && code <= 0xd4c) {
                                                    return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xd4e) {
                                                // Mn       MALAYALAM SIGN VIRAMA
                                                if (0xd4d === code) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                // Lo       MALAYALAM LETTER DOT REPH
                                                if (0xd4e === code) {
                                                    return boundaries_1.CLUSTER_BREAK.PREPEND;
                                                }
                                                // Mc       MALAYALAM AU LENGTH MARK
                                                if (0xd57 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                        }
                                    }
                                }
                                else {
                                    if (code < 0xdd0) {
                                        if (code < 0xd82) {
                                            if (code < 0xd81) {
                                                // Mn   [2] MALAYALAM VOWEL SIGN VOCALIC L..MALAYALAM VOWEL SIGN VOCALIC LL
                                                if (0xd62 <= code && code <= 0xd63) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                // Mn       SINHALA SIGN CANDRABINDU
                                                if (0xd81 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xdca) {
                                                // Mc   [2] SINHALA SIGN ANUSVARAYA..SINHALA SIGN VISARGAYA
                                                if (0xd82 <= code && code <= 0xd83) {
                                                    return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                }
                                            }
                                            else {
                                                // Mn       SINHALA SIGN AL-LAKUNA
                                                if (0xdca === code) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                                // Mc       SINHALA VOWEL SIGN AELA-PILLA
                                                if (0xdcf === code) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0xdd8) {
                                            if (code < 0xdd2) {
                                                // Mc   [2] SINHALA VOWEL SIGN KETTI AEDA-PILLA..SINHALA VOWEL SIGN DIGA AEDA-PILLA
                                                if (0xdd0 <= code && code <= 0xdd1) {
                                                    return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                }
                                            }
                                            else {
                                                if (code < 0xdd6) {
                                                    // Mn   [3] SINHALA VOWEL SIGN KETTI IS-PILLA..SINHALA VOWEL SIGN KETTI PAA-PILLA
                                                    if (0xdd2 <= code && code <= 0xdd4) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                                else {
                                                    // Mn       SINHALA VOWEL SIGN DIGA PAA-PILLA
                                                    if (0xdd6 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xddf) {
                                                // Mc   [7] SINHALA VOWEL SIGN GAETTA-PILLA..SINHALA VOWEL SIGN KOMBUVA HAA GAYANUKITTA
                                                if (0xdd8 <= code && code <= 0xdde) {
                                                    return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                }
                                            }
                                            else {
                                                if (code < 0xdf2) {
                                                    // Mc       SINHALA VOWEL SIGN GAYANUKITTA
                                                    if (0xddf === code) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                                else {
                                                    // Mc   [2] SINHALA VOWEL SIGN DIGA GAETTA-PILLA..SINHALA VOWEL SIGN DIGA GAYANUKITTA
                                                    if (0xdf2 <= code && code <= 0xdf3) {
                                                        return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            else {
                                if (code < 0xf37) {
                                    if (code < 0xeb3) {
                                        if (code < 0xe34) {
                                            // Mn       THAI CHARACTER MAI HAN-AKAT
                                            if (0xe31 === code) {
                                                return boundaries_1.CLUSTER_BREAK.EXTEND;
                                            }
                                            // Lo       THAI CHARACTER SARA AM
                                            if (0xe33 === code) {
                                                return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                            }
                                        }
                                        else {
                                            if (code < 0xe47) {
                                                // Mn   [7] THAI CHARACTER SARA I..THAI CHARACTER PHINTHU
                                                if (0xe34 <= code && code <= 0xe3a) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                if (code < 0xeb1) {
                                                    // Mn   [8] THAI CHARACTER MAITAIKHU..THAI CHARACTER YAMAKKAN
                                                    if (0xe47 <= code && code <= 0xe4e) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                                else {
                                                    // Mn       LAO VOWEL SIGN MAI KAN
                                                    if (0xeb1 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0xec8) {
                                            if (code < 0xeb4) {
                                                // Lo       LAO VOWEL SIGN AM
                                                if (0xeb3 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                }
                                            }
                                            else {
                                                // Mn   [9] LAO VOWEL SIGN I..LAO SEMIVOWEL SIGN LO
                                                if (0xeb4 <= code && code <= 0xebc) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xf18) {
                                                // Mn   [6] LAO TONE MAI EK..LAO NIGGAHITA
                                                if (0xec8 <= code && code <= 0xecd) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                if (code < 0xf35) {
                                                    // Mn   [2] TIBETAN ASTROLOGICAL SIGN -KHYUD PA..TIBETAN ASTROLOGICAL SIGN SDONG TSHUGS
                                                    if (0xf18 <= code && code <= 0xf19) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                                else {
                                                    // Mn       TIBETAN MARK NGAS BZUNG NYI ZLA
                                                    if (0xf35 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                else {
                                    if (code < 0xf80) {
                                        if (code < 0xf3e) {
                                            // Mn       TIBETAN MARK NGAS BZUNG SGOR RTAGS
                                            if (0xf37 === code) {
                                                return boundaries_1.CLUSTER_BREAK.EXTEND;
                                            }
                                            // Mn       TIBETAN MARK TSA -PHRU
                                            if (0xf39 === code) {
                                                return boundaries_1.CLUSTER_BREAK.EXTEND;
                                            }
                                        }
                                        else {
                                            if (code < 0xf71) {
                                                // Mc   [2] TIBETAN SIGN YAR TSHES..TIBETAN SIGN MAR TSHES
                                                if (0xf3e <= code && code <= 0xf3f) {
                                                    return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                }
                                            }
                                            else {
                                                if (code < 0xf7f) {
                                                    // Mn  [14] TIBETAN VOWEL SIGN AA..TIBETAN SIGN RJES SU NGA RO
                                                    if (0xf71 <= code && code <= 0xf7e) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                                else {
                                                    // Mc       TIBETAN SIGN RNAM BCAD
                                                    if (0xf7f === code) {
                                                        return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0xf99) {
                                            if (code < 0xf86) {
                                                // Mn   [5] TIBETAN VOWEL SIGN REVERSED I..TIBETAN MARK HALANTA
                                                if (0xf80 <= code && code <= 0xf84) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                if (code < 0xf8d) {
                                                    // Mn   [2] TIBETAN SIGN LCI RTAGS..TIBETAN SIGN YANG RTAGS
                                                    if (0xf86 <= code && code <= 0xf87) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                                else {
                                                    // Mn  [11] TIBETAN SUBJOINED SIGN LCE TSA CAN..TIBETAN SUBJOINED LETTER JA
                                                    if (0xf8d <= code && code <= 0xf97) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xfc6) {
                                                // Mn  [36] TIBETAN SUBJOINED LETTER NYA..TIBETAN SUBJOINED LETTER FIXED-FORM RA
                                                if (0xf99 <= code && code <= 0xfbc) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                if (code < 0x102d) {
                                                    // Mn       TIBETAN SYMBOL PADMA GDAN
                                                    if (0xfc6 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                                else {
                                                    // Mn   [4] MYANMAR VOWEL SIGN I..MYANMAR VOWEL SIGN UU
                                                    if (0x102d <= code && code <= 0x1030) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                else {
                    if (code < 0x1c36) {
                        if (code < 0x1a17) {
                            if (code < 0x1772) {
                                if (code < 0x1084) {
                                    if (code < 0x1056) {
                                        if (code < 0x1039) {
                                            if (code < 0x1032) {
                                                // Mc       MYANMAR VOWEL SIGN E
                                                if (0x1031 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                }
                                            }
                                            else {
                                                // Mn   [6] MYANMAR VOWEL SIGN AI..MYANMAR SIGN DOT BELOW
                                                if (0x1032 <= code && code <= 0x1037) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0x103b) {
                                                // Mn   [2] MYANMAR SIGN VIRAMA..MYANMAR SIGN ASAT
                                                if (0x1039 <= code && code <= 0x103a) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                if (code < 0x103d) {
                                                    // Mc   [2] MYANMAR CONSONANT SIGN MEDIAL YA..MYANMAR CONSONANT SIGN MEDIAL RA
                                                    if (0x103b <= code && code <= 0x103c) {
                                                        return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                    }
                                                }
                                                else {
                                                    // Mn   [2] MYANMAR CONSONANT SIGN MEDIAL WA..MYANMAR CONSONANT SIGN MEDIAL HA
                                                    if (0x103d <= code && code <= 0x103e) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0x105e) {
                                            if (code < 0x1058) {
                                                // Mc   [2] MYANMAR VOWEL SIGN VOCALIC R..MYANMAR VOWEL SIGN VOCALIC RR
                                                if (0x1056 <= code && code <= 0x1057) {
                                                    return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                }
                                            }
                                            else {
                                                // Mn   [2] MYANMAR VOWEL SIGN VOCALIC L..MYANMAR VOWEL SIGN VOCALIC LL
                                                if (0x1058 <= code && code <= 0x1059) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0x1071) {
                                                // Mn   [3] MYANMAR CONSONANT SIGN MON MEDIAL NA..MYANMAR CONSONANT SIGN MON MEDIAL LA
                                                if (0x105e <= code && code <= 0x1060) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                if (code < 0x1082) {
                                                    // Mn   [4] MYANMAR VOWEL SIGN GEBA KAREN I..MYANMAR VOWEL SIGN KAYAH EE
                                                    if (0x1071 <= code && code <= 0x1074) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                                else {
                                                    // Mn       MYANMAR CONSONANT SIGN SHAN MEDIAL WA
                                                    if (0x1082 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                else {
                                    if (code < 0x1160) {
                                        if (code < 0x108d) {
                                            if (code < 0x1085) {
                                                // Mc       MYANMAR VOWEL SIGN SHAN E
                                                if (0x1084 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                }
                                            }
                                            else {
                                                // Mn   [2] MYANMAR VOWEL SIGN SHAN E ABOVE..MYANMAR VOWEL SIGN SHAN FINAL Y
                                                if (0x1085 <= code && code <= 0x1086) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0x109d) {
                                                // Mn       MYANMAR SIGN SHAN COUNCIL EMPHATIC TONE
                                                if (0x108d === code) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                if (code < 0x1100) {
                                                    // Mn       MYANMAR VOWEL SIGN AITON AI
                                                    if (0x109d === code) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                                else {
                                                    // Lo  [96] HANGUL CHOSEONG KIYEOK..HANGUL CHOSEONG FILLER
                                                    if (0x1100 <= code && code <= 0x115f) {
                                                        return boundaries_1.CLUSTER_BREAK.L;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0x1712) {
                                            if (code < 0x11a8) {
                                                // Lo  [72] HANGUL JUNGSEONG FILLER..HANGUL JUNGSEONG O-YAE
                                                if (0x1160 <= code && code <= 0x11a7) {
                                                    return boundaries_1.CLUSTER_BREAK.V;
                                                }
                                            }
                                            else {
                                                if (code < 0x135d) {
                                                    // Lo  [88] HANGUL JONGSEONG KIYEOK..HANGUL JONGSEONG SSANGNIEUN
                                                    if (0x11a8 <= code && code <= 0x11ff) {
                                                        return boundaries_1.CLUSTER_BREAK.T;
                                                    }
                                                }
                                                else {
                                                    // Mn   [3] ETHIOPIC COMBINING GEMINATION AND VOWEL LENGTH MARK..ETHIOPIC COMBINING GEMINATION MARK
                                                    if (0x135d <= code && code <= 0x135f) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0x1732) {
                                                // Mn   [3] TAGALOG VOWEL SIGN I..TAGALOG SIGN VIRAMA
                                                if (0x1712 <= code && code <= 0x1714) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                if (code < 0x1752) {
                                                    // Mn   [3] HANUNOO VOWEL SIGN I..HANUNOO SIGN PAMUDPOD
                                                    if (0x1732 <= code && code <= 0x1734) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                                else {
                                                    // Mn   [2] BUHID VOWEL SIGN I..BUHID VOWEL SIGN U
                                                    if (0x1752 <= code && code <= 0x1753) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            else {
                                if (code < 0x180e) {
                                    if (code < 0x17c6) {
                                        if (code < 0x17b6) {
                                            if (code < 0x17b4) {
                                                // Mn   [2] TAGBANWA VOWEL SIGN I..TAGBANWA VOWEL SIGN U
                                                if (0x1772 <= code && code <= 0x1773) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                // Mn   [2] KHMER VOWEL INHERENT AQ..KHMER VOWEL INHERENT AA
                                                if (0x17b4 <= code && code <= 0x17b5) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0x17b7) {
                                                // Mc       KHMER VOWEL SIGN AA
                                                if (0x17b6 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                }
                                            }
                                            else {
                                                if (code < 0x17be) {
                                                    // Mn   [7] KHMER VOWEL SIGN I..KHMER VOWEL SIGN UA
                                                    if (0x17b7 <= code && code <= 0x17bd) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                                else {
                                                    // Mc   [8] KHMER VOWEL SIGN OE..KHMER VOWEL SIGN AU
                                                    if (0x17be <= code && code <= 0x17c5) {
                                                        return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0x17c9) {
                                            if (code < 0x17c7) {
                                                // Mn       KHMER SIGN NIKAHIT
                                                if (0x17c6 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                // Mc   [2] KHMER SIGN REAHMUK..KHMER SIGN YUUKALEAPINTU
                                                if (0x17c7 <= code && code <= 0x17c8) {
                                                    return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0x17dd) {
                                                // Mn  [11] KHMER SIGN MUUSIKATOAN..KHMER SIGN BATHAMASAT
                                                if (0x17c9 <= code && code <= 0x17d3) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                if (code < 0x180b) {
                                                    // Mn       KHMER SIGN ATTHACAN
                                                    if (0x17dd === code) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                                else {
                                                    // Mn   [3] MONGOLIAN FREE VARIATION SELECTOR ONE..MONGOLIAN FREE VARIATION SELECTOR THREE
                                                    if (0x180b <= code && code <= 0x180d) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                else {
                                    if (code < 0x1927) {
                                        if (code < 0x18a9) {
                                            if (code < 0x1885) {
                                                // Cf       MONGOLIAN VOWEL SEPARATOR
                                                if (0x180e === code) {
                                                    return boundaries_1.CLUSTER_BREAK.CONTROL;
                                                }
                                            }
                                            else {
                                                // Mn   [2] MONGOLIAN LETTER ALI GALI BALUDA..MONGOLIAN LETTER ALI GALI THREE BALUDA
                                                if (0x1885 <= code && code <= 0x1886) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0x1920) {
                                                // Mn       MONGOLIAN LETTER ALI GALI DAGALGA
                                                if (0x18a9 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                if (code < 0x1923) {
                                                    // Mn   [3] LIMBU VOWEL SIGN A..LIMBU VOWEL SIGN U
                                                    if (0x1920 <= code && code <= 0x1922) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                                else {
                                                    // Mc   [4] LIMBU VOWEL SIGN EE..LIMBU VOWEL SIGN AU
                                                    if (0x1923 <= code && code <= 0x1926) {
                                                        return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0x1932) {
                                            if (code < 0x1929) {
                                                // Mn   [2] LIMBU VOWEL SIGN E..LIMBU VOWEL SIGN O
                                                if (0x1927 <= code && code <= 0x1928) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                if (code < 0x1930) {
                                                    // Mc   [3] LIMBU SUBJOINED LETTER YA..LIMBU SUBJOINED LETTER WA
                                                    if (0x1929 <= code && code <= 0x192b) {
                                                        return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                    }
                                                }
                                                else {
                                                    // Mc   [2] LIMBU SMALL LETTER KA..LIMBU SMALL LETTER NGA
                                                    if (0x1930 <= code && code <= 0x1931) {
                                                        return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                    }
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0x1933) {
                                                // Mn       LIMBU SMALL LETTER ANUSVARA
                                                if (0x1932 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                if (code < 0x1939) {
                                                    // Mc   [6] LIMBU SMALL LETTER TA..LIMBU SMALL LETTER LA
                                                    if (0x1933 <= code && code <= 0x1938) {
                                                        return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                    }
                                                }
                                                else {
                                                    // Mn   [3] LIMBU SIGN MUKPHRENG..LIMBU SIGN SA-I
                                                    if (0x1939 <= code && code <= 0x193b) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        else {
                            if (code < 0x1b43) {
                                if (code < 0x1a6d) {
                                    if (code < 0x1a57) {
                                        if (code < 0x1a1b) {
                                            if (code < 0x1a19) {
                                                // Mn   [2] BUGINESE VOWEL SIGN I..BUGINESE VOWEL SIGN U
                                                if (0x1a17 <= code && code <= 0x1a18) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                // Mc   [2] BUGINESE VOWEL SIGN E..BUGINESE VOWEL SIGN O
                                                if (0x1a19 <= code && code <= 0x1a1a) {
                                                    return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0x1a55) {
                                                // Mn       BUGINESE VOWEL SIGN AE
                                                if (0x1a1b === code) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                // Mc       TAI THAM CONSONANT SIGN MEDIAL RA
                                                if (0x1a55 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                }
                                                // Mn       TAI THAM CONSONANT SIGN MEDIAL LA
                                                if (0x1a56 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0x1a60) {
                                            if (code < 0x1a58) {
                                                // Mc       TAI THAM CONSONANT SIGN LA TANG LAI
                                                if (0x1a57 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                }
                                            }
                                            else {
                                                // Mn   [7] TAI THAM SIGN MAI KANG LAI..TAI THAM CONSONANT SIGN SA
                                                if (0x1a58 <= code && code <= 0x1a5e) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0x1a62) {
                                                // Mn       TAI THAM SIGN SAKOT
                                                if (0x1a60 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                if (code < 0x1a65) {
                                                    // Mn       TAI THAM VOWEL SIGN MAI SAT
                                                    if (0x1a62 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                                else {
                                                    // Mn   [8] TAI THAM VOWEL SIGN I..TAI THAM VOWEL SIGN OA BELOW
                                                    if (0x1a65 <= code && code <= 0x1a6c) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                else {
                                    if (code < 0x1b04) {
                                        if (code < 0x1a7f) {
                                            if (code < 0x1a73) {
                                                // Mc   [6] TAI THAM VOWEL SIGN OY..TAI THAM VOWEL SIGN THAM AI
                                                if (0x1a6d <= code && code <= 0x1a72) {
                                                    return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                }
                                            }
                                            else {
                                                // Mn  [10] TAI THAM VOWEL SIGN OA ABOVE..TAI THAM SIGN KHUEN-LUE KARAN
                                                if (0x1a73 <= code && code <= 0x1a7c) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0x1ab0) {
                                                // Mn       TAI THAM COMBINING CRYPTOGRAMMIC DOT
                                                if (0x1a7f === code) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                if (code < 0x1b00) {
                                                    // Mn  [14] COMBINING DOUBLED CIRCUMFLEX ACCENT..COMBINING PARENTHESES BELOW
                                                    // Me       COMBINING PARENTHESES OVERLAY
                                                    // Mn   [2] COMBINING LATIN SMALL LETTER W BELOW..COMBINING LATIN SMALL LETTER TURNED W BELOW
                                                    if (0x1ab0 <= code && code <= 0x1ac0) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                                else {
                                                    // Mn   [4] BALINESE SIGN ULU RICEM..BALINESE SIGN SURANG
                                                    if (0x1b00 <= code && code <= 0x1b03) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0x1b3c) {
                                            if (code < 0x1b34) {
                                                // Mc       BALINESE SIGN BISAH
                                                if (0x1b04 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                }
                                            }
                                            else {
                                                if (code < 0x1b3b) {
                                                    // Mn       BALINESE SIGN REREKAN
                                                    // Mc       BALINESE VOWEL SIGN TEDUNG
                                                    // Mn   [5] BALINESE VOWEL SIGN ULU..BALINESE VOWEL SIGN RA REPA
                                                    if (0x1b34 <= code && code <= 0x1b3a) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                                else {
                                                    // Mc       BALINESE VOWEL SIGN RA REPA TEDUNG
                                                    if (0x1b3b === code) {
                                                        return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                    }
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0x1b3d) {
                                                // Mn       BALINESE VOWEL SIGN LA LENGA
                                                if (0x1b3c === code) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                if (code < 0x1b42) {
                                                    // Mc   [5] BALINESE VOWEL SIGN LA LENGA TEDUNG..BALINESE VOWEL SIGN TALING REPA TEDUNG
                                                    if (0x1b3d <= code && code <= 0x1b41) {
                                                        return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                    }
                                                }
                                                else {
                                                    // Mn       BALINESE VOWEL SIGN PEPET
                                                    if (0x1b42 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            else {
                                if (code < 0x1be6) {
                                    if (code < 0x1ba2) {
                                        if (code < 0x1b80) {
                                            if (code < 0x1b6b) {
                                                // Mc   [2] BALINESE VOWEL SIGN PEPET TEDUNG..BALINESE ADEG ADEG
                                                if (0x1b43 <= code && code <= 0x1b44) {
                                                    return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                }
                                            }
                                            else {
                                                // Mn   [9] BALINESE MUSICAL SYMBOL COMBINING TEGEH..BALINESE MUSICAL SYMBOL COMBINING GONG
                                                if (0x1b6b <= code && code <= 0x1b73) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0x1b82) {
                                                // Mn   [2] SUNDANESE SIGN PANYECEK..SUNDANESE SIGN PANGLAYAR
                                                if (0x1b80 <= code && code <= 0x1b81) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                // Mc       SUNDANESE SIGN PANGWISAD
                                                if (0x1b82 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                }
                                                // Mc       SUNDANESE CONSONANT SIGN PAMINGKAL
                                                if (0x1ba1 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0x1ba8) {
                                            if (code < 0x1ba6) {
                                                // Mn   [4] SUNDANESE CONSONANT SIGN PANYAKRA..SUNDANESE VOWEL SIGN PANYUKU
                                                if (0x1ba2 <= code && code <= 0x1ba5) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                // Mc   [2] SUNDANESE VOWEL SIGN PANAELAENG..SUNDANESE VOWEL SIGN PANOLONG
                                                if (0x1ba6 <= code && code <= 0x1ba7) {
                                                    return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0x1baa) {
                                                // Mn   [2] SUNDANESE VOWEL SIGN PAMEPET..SUNDANESE VOWEL SIGN PANEULEUNG
                                                if (0x1ba8 <= code && code <= 0x1ba9) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                if (code < 0x1bab) {
                                                    // Mc       SUNDANESE SIGN PAMAAEH
                                                    if (0x1baa === code) {
                                                        return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                    }
                                                }
                                                else {
                                                    // Mn   [3] SUNDANESE SIGN VIRAMA..SUNDANESE CONSONANT SIGN PASANGAN WA
                                                    if (0x1bab <= code && code <= 0x1bad) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                else {
                                    if (code < 0x1bee) {
                                        if (code < 0x1be8) {
                                            // Mn       BATAK SIGN TOMPI
                                            if (0x1be6 === code) {
                                                return boundaries_1.CLUSTER_BREAK.EXTEND;
                                            }
                                            // Mc       BATAK VOWEL SIGN E
                                            if (0x1be7 === code) {
                                                return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                            }
                                        }
                                        else {
                                            if (code < 0x1bea) {
                                                // Mn   [2] BATAK VOWEL SIGN PAKPAK E..BATAK VOWEL SIGN EE
                                                if (0x1be8 <= code && code <= 0x1be9) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                if (code < 0x1bed) {
                                                    // Mc   [3] BATAK VOWEL SIGN I..BATAK VOWEL SIGN O
                                                    if (0x1bea <= code && code <= 0x1bec) {
                                                        return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                    }
                                                }
                                                else {
                                                    // Mn       BATAK VOWEL SIGN KARO O
                                                    if (0x1bed === code) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0x1c24) {
                                            if (code < 0x1bef) {
                                                // Mc       BATAK VOWEL SIGN U
                                                if (0x1bee === code) {
                                                    return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                }
                                            }
                                            else {
                                                if (code < 0x1bf2) {
                                                    // Mn   [3] BATAK VOWEL SIGN U FOR SIMALUNGUN SA..BATAK CONSONANT SIGN H
                                                    if (0x1bef <= code && code <= 0x1bf1) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                                else {
                                                    // Mc   [2] BATAK PANGOLAT..BATAK PANONGONAN
                                                    if (0x1bf2 <= code && code <= 0x1bf3) {
                                                        return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                    }
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0x1c2c) {
                                                // Mc   [8] LEPCHA SUBJOINED LETTER YA..LEPCHA VOWEL SIGN UU
                                                if (0x1c24 <= code && code <= 0x1c2b) {
                                                    return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                }
                                            }
                                            else {
                                                if (code < 0x1c34) {
                                                    // Mn   [8] LEPCHA VOWEL SIGN E..LEPCHA CONSONANT SIGN T
                                                    if (0x1c2c <= code && code <= 0x1c33) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                                else {
                                                    // Mc   [2] LEPCHA CONSONANT SIGN NYIN-DO..LEPCHA CONSONANT SIGN KANG
                                                    if (0x1c34 <= code && code <= 0x1c35) {
                                                        return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                    else {
                        if (code < 0xa960) {
                            if (code < 0x302a) {
                                if (code < 0x1dfb) {
                                    if (code < 0x1ced) {
                                        if (code < 0x1cd4) {
                                            if (code < 0x1cd0) {
                                                // Mn   [2] LEPCHA SIGN RAN..LEPCHA SIGN NUKTA
                                                if (0x1c36 <= code && code <= 0x1c37) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                // Mn   [3] VEDIC TONE KARSHANA..VEDIC TONE PRENKHA
                                                if (0x1cd0 <= code && code <= 0x1cd2) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0x1ce1) {
                                                // Mn  [13] VEDIC SIGN YAJURVEDIC MIDLINE SVARITA..VEDIC TONE RIGVEDIC KASHMIRI INDEPENDENT SVARITA
                                                if (0x1cd4 <= code && code <= 0x1ce0) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                if (code < 0x1ce2) {
                                                    // Mc       VEDIC TONE ATHARVAVEDIC INDEPENDENT SVARITA
                                                    if (0x1ce1 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                    }
                                                }
                                                else {
                                                    // Mn   [7] VEDIC SIGN VISARGA SVARITA..VEDIC SIGN VISARGA ANUDATTA WITH TAIL
                                                    if (0x1ce2 <= code && code <= 0x1ce8) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0x1cf7) {
                                            // Mn       VEDIC SIGN TIRYAK
                                            if (0x1ced === code) {
                                                return boundaries_1.CLUSTER_BREAK.EXTEND;
                                            }
                                            // Mn       VEDIC TONE CANDRA ABOVE
                                            if (0x1cf4 === code) {
                                                return boundaries_1.CLUSTER_BREAK.EXTEND;
                                            }
                                        }
                                        else {
                                            if (code < 0x1cf8) {
                                                // Mc       VEDIC SIGN ATIKRAMA
                                                if (0x1cf7 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                }
                                            }
                                            else {
                                                if (code < 0x1dc0) {
                                                    // Mn   [2] VEDIC TONE RING ABOVE..VEDIC TONE DOUBLE RING ABOVE
                                                    if (0x1cf8 <= code && code <= 0x1cf9) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                                else {
                                                    // Mn  [58] COMBINING DOTTED GRAVE ACCENT..COMBINING WIDE INVERTED BRIDGE BELOW
                                                    if (0x1dc0 <= code && code <= 0x1df9) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                else {
                                    if (code < 0x2028) {
                                        if (code < 0x200c) {
                                            if (code < 0x200b) {
                                                // Mn   [5] COMBINING DELETION MARK..COMBINING RIGHT ARROWHEAD AND DOWN ARROWHEAD BELOW
                                                if (0x1dfb <= code && code <= 0x1dff) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                // Cf       ZERO WIDTH SPACE
                                                if (0x200b === code) {
                                                    return boundaries_1.CLUSTER_BREAK.CONTROL;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0x200d) {
                                                // Cf       ZERO WIDTH NON-JOINER
                                                if (0x200c === code) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                if (code < 0x200e) {
                                                    // Cf       ZERO WIDTH JOINER
                                                    if (0x200d === code) {
                                                        return boundaries_1.CLUSTER_BREAK.ZWJ;
                                                    }
                                                }
                                                else {
                                                    // Cf   [2] LEFT-TO-RIGHT MARK..RIGHT-TO-LEFT MARK
                                                    if (0x200e <= code && code <= 0x200f) {
                                                        return boundaries_1.CLUSTER_BREAK.CONTROL;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0x2cef) {
                                            if (code < 0x2060) {
                                                // Zl       LINE SEPARATOR
                                                // Zp       PARAGRAPH SEPARATOR
                                                // Cf   [5] LEFT-TO-RIGHT EMBEDDING..RIGHT-TO-LEFT OVERRIDE
                                                if (0x2028 <= code && code <= 0x202e) {
                                                    return boundaries_1.CLUSTER_BREAK.CONTROL;
                                                }
                                            }
                                            else {
                                                if (code < 0x20d0) {
                                                    // Cf   [5] WORD JOINER..INVISIBLE PLUS
                                                    // Cn       <reserved-2065>
                                                    // Cf  [10] LEFT-TO-RIGHT ISOLATE..NOMINAL DIGIT SHAPES
                                                    if (0x2060 <= code && code <= 0x206f) {
                                                        return boundaries_1.CLUSTER_BREAK.CONTROL;
                                                    }
                                                }
                                                else {
                                                    // Mn  [13] COMBINING LEFT HARPOON ABOVE..COMBINING FOUR DOTS ABOVE
                                                    // Me   [4] COMBINING ENCLOSING CIRCLE..COMBINING ENCLOSING CIRCLE BACKSLASH
                                                    // Mn       COMBINING LEFT RIGHT ARROW ABOVE
                                                    // Me   [3] COMBINING ENCLOSING SCREEN..COMBINING ENCLOSING UPWARD POINTING TRIANGLE
                                                    // Mn  [12] COMBINING REVERSE SOLIDUS OVERLAY..COMBINING ASTERISK ABOVE
                                                    if (0x20d0 <= code && code <= 0x20f0) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0x2d7f) {
                                                // Mn   [3] COPTIC COMBINING NI ABOVE..COPTIC COMBINING SPIRITUS LENIS
                                                if (0x2cef <= code && code <= 0x2cf1) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                if (code < 0x2de0) {
                                                    // Mn       TIFINAGH CONSONANT JOINER
                                                    if (0x2d7f === code) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                                else {
                                                    // Mn  [32] COMBINING CYRILLIC LETTER BE..COMBINING CYRILLIC LETTER IOTIFIED BIG YUS
                                                    if (0x2de0 <= code && code <= 0x2dff) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            else {
                                if (code < 0xa825) {
                                    if (code < 0xa6f0) {
                                        if (code < 0xa66f) {
                                            if (code < 0x3099) {
                                                // Mn   [4] IDEOGRAPHIC LEVEL TONE MARK..IDEOGRAPHIC ENTERING TONE MARK
                                                // Mc   [2] HANGUL SINGLE DOT TONE MARK..HANGUL DOUBLE DOT TONE MARK
                                                if (0x302a <= code && code <= 0x302f) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                // Mn   [2] COMBINING KATAKANA-HIRAGANA VOICED SOUND MARK..COMBINING KATAKANA-HIRAGANA SEMI-VOICED SOUND MARK
                                                if (0x3099 <= code && code <= 0x309a) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xa674) {
                                                // Mn       COMBINING CYRILLIC VZMET
                                                // Me   [3] COMBINING CYRILLIC TEN MILLIONS SIGN..COMBINING CYRILLIC THOUSAND MILLIONS SIGN
                                                if (0xa66f <= code && code <= 0xa672) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                if (code < 0xa69e) {
                                                    // Mn  [10] COMBINING CYRILLIC LETTER UKRAINIAN IE..COMBINING CYRILLIC PAYEROK
                                                    if (0xa674 <= code && code <= 0xa67d) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                                else {
                                                    // Mn   [2] COMBINING CYRILLIC LETTER EF..COMBINING CYRILLIC LETTER IOTIFIED E
                                                    if (0xa69e <= code && code <= 0xa69f) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0xa806) {
                                            if (code < 0xa802) {
                                                // Mn   [2] BAMUM COMBINING MARK KOQNDON..BAMUM COMBINING MARK TUKWENTIS
                                                if (0xa6f0 <= code && code <= 0xa6f1) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                // Mn       SYLOTI NAGRI SIGN DVISVARA
                                                if (0xa802 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xa80b) {
                                                // Mn       SYLOTI NAGRI SIGN HASANTA
                                                if (0xa806 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                if (code < 0xa823) {
                                                    // Mn       SYLOTI NAGRI SIGN ANUSVARA
                                                    if (0xa80b === code) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                                else {
                                                    // Mc   [2] SYLOTI NAGRI VOWEL SIGN A..SYLOTI NAGRI VOWEL SIGN I
                                                    if (0xa823 <= code && code <= 0xa824) {
                                                        return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                else {
                                    if (code < 0xa8c4) {
                                        if (code < 0xa82c) {
                                            if (code < 0xa827) {
                                                // Mn   [2] SYLOTI NAGRI VOWEL SIGN U..SYLOTI NAGRI VOWEL SIGN E
                                                if (0xa825 <= code && code <= 0xa826) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                // Mc       SYLOTI NAGRI VOWEL SIGN OO
                                                if (0xa827 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xa880) {
                                                // Mn       SYLOTI NAGRI SIGN ALTERNATE HASANTA
                                                if (0xa82c === code) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                if (code < 0xa8b4) {
                                                    // Mc   [2] SAURASHTRA SIGN ANUSVARA..SAURASHTRA SIGN VISARGA
                                                    if (0xa880 <= code && code <= 0xa881) {
                                                        return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                    }
                                                }
                                                else {
                                                    // Mc  [16] SAURASHTRA CONSONANT SIGN HAARU..SAURASHTRA VOWEL SIGN AU
                                                    if (0xa8b4 <= code && code <= 0xa8c3) {
                                                        return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0xa926) {
                                            if (code < 0xa8e0) {
                                                // Mn   [2] SAURASHTRA SIGN VIRAMA..SAURASHTRA SIGN CANDRABINDU
                                                if (0xa8c4 <= code && code <= 0xa8c5) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                if (code < 0xa8ff) {
                                                    // Mn  [18] COMBINING DEVANAGARI DIGIT ZERO..COMBINING DEVANAGARI SIGN AVAGRAHA
                                                    if (0xa8e0 <= code && code <= 0xa8f1) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                                else {
                                                    // Mn       DEVANAGARI VOWEL SIGN AY
                                                    if (0xa8ff === code) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xa947) {
                                                // Mn   [8] KAYAH LI VOWEL UE..KAYAH LI TONE CALYA PLOPHU
                                                if (0xa926 <= code && code <= 0xa92d) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                if (code < 0xa952) {
                                                    // Mn  [11] REJANG VOWEL SIGN I..REJANG CONSONANT SIGN R
                                                    if (0xa947 <= code && code <= 0xa951) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                                else {
                                                    // Mc   [2] REJANG CONSONANT SIGN H..REJANG VIRAMA
                                                    if (0xa952 <= code && code <= 0xa953) {
                                                        return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        else {
                            if (code < 0xaab7) {
                                if (code < 0xaa29) {
                                    if (code < 0xa9b6) {
                                        if (code < 0xa983) {
                                            if (code < 0xa980) {
                                                // Lo  [29] HANGUL CHOSEONG TIKEUT-MIEUM..HANGUL CHOSEONG SSANGYEORINHIEUH
                                                if (0xa960 <= code && code <= 0xa97c) {
                                                    return boundaries_1.CLUSTER_BREAK.L;
                                                }
                                            }
                                            else {
                                                // Mn   [3] JAVANESE SIGN PANYANGGA..JAVANESE SIGN LAYAR
                                                if (0xa980 <= code && code <= 0xa982) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xa9b3) {
                                                // Mc       JAVANESE SIGN WIGNYAN
                                                if (0xa983 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                }
                                            }
                                            else {
                                                if (code < 0xa9b4) {
                                                    // Mn       JAVANESE SIGN CECAK TELU
                                                    if (0xa9b3 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                                else {
                                                    // Mc   [2] JAVANESE VOWEL SIGN TARUNG..JAVANESE VOWEL SIGN TOLONG
                                                    if (0xa9b4 <= code && code <= 0xa9b5) {
                                                        return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0xa9bc) {
                                            if (code < 0xa9ba) {
                                                // Mn   [4] JAVANESE VOWEL SIGN WULU..JAVANESE VOWEL SIGN SUKU MENDUT
                                                if (0xa9b6 <= code && code <= 0xa9b9) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                // Mc   [2] JAVANESE VOWEL SIGN TALING..JAVANESE VOWEL SIGN DIRGA MURE
                                                if (0xa9ba <= code && code <= 0xa9bb) {
                                                    return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xa9be) {
                                                // Mn   [2] JAVANESE VOWEL SIGN PEPET..JAVANESE CONSONANT SIGN KERET
                                                if (0xa9bc <= code && code <= 0xa9bd) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                if (code < 0xa9e5) {
                                                    // Mc   [3] JAVANESE CONSONANT SIGN PENGKAL..JAVANESE PANGKON
                                                    if (0xa9be <= code && code <= 0xa9c0) {
                                                        return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                    }
                                                }
                                                else {
                                                    // Mn       MYANMAR SIGN SHAN SAW
                                                    if (0xa9e5 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                else {
                                    if (code < 0xaa43) {
                                        if (code < 0xaa31) {
                                            if (code < 0xaa2f) {
                                                // Mn   [6] CHAM VOWEL SIGN AA..CHAM VOWEL SIGN OE
                                                if (0xaa29 <= code && code <= 0xaa2e) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                // Mc   [2] CHAM VOWEL SIGN O..CHAM VOWEL SIGN AI
                                                if (0xaa2f <= code && code <= 0xaa30) {
                                                    return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xaa33) {
                                                // Mn   [2] CHAM VOWEL SIGN AU..CHAM VOWEL SIGN UE
                                                if (0xaa31 <= code && code <= 0xaa32) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                if (code < 0xaa35) {
                                                    // Mc   [2] CHAM CONSONANT SIGN YA..CHAM CONSONANT SIGN RA
                                                    if (0xaa33 <= code && code <= 0xaa34) {
                                                        return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                    }
                                                }
                                                else {
                                                    // Mn   [2] CHAM CONSONANT SIGN LA..CHAM CONSONANT SIGN WA
                                                    if (0xaa35 <= code && code <= 0xaa36) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0xaa7c) {
                                            if (code < 0xaa4c) {
                                                // Mn       CHAM CONSONANT SIGN FINAL NG
                                                if (0xaa43 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                // Mn       CHAM CONSONANT SIGN FINAL M
                                                if (0xaa4c === code) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                                // Mc       CHAM CONSONANT SIGN FINAL H
                                                if (0xaa4d === code) {
                                                    return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xaab0) {
                                                // Mn       MYANMAR SIGN TAI LAING TONE-2
                                                if (0xaa7c === code) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                if (code < 0xaab2) {
                                                    // Mn       TAI VIET MAI KANG
                                                    if (0xaab0 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                                else {
                                                    // Mn   [3] TAI VIET VOWEL I..TAI VIET VOWEL U
                                                    if (0xaab2 <= code && code <= 0xaab4) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            else {
                                if (code < 0xabe6) {
                                    if (code < 0xaaee) {
                                        if (code < 0xaac1) {
                                            if (code < 0xaabe) {
                                                // Mn   [2] TAI VIET MAI KHIT..TAI VIET VOWEL IA
                                                if (0xaab7 <= code && code <= 0xaab8) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                // Mn   [2] TAI VIET VOWEL AM..TAI VIET TONE MAI EK
                                                if (0xaabe <= code && code <= 0xaabf) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xaaeb) {
                                                // Mn       TAI VIET TONE MAI THO
                                                if (0xaac1 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                if (code < 0xaaec) {
                                                    // Mc       MEETEI MAYEK VOWEL SIGN II
                                                    if (0xaaeb === code) {
                                                        return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                    }
                                                }
                                                else {
                                                    // Mn   [2] MEETEI MAYEK VOWEL SIGN UU..MEETEI MAYEK VOWEL SIGN AAI
                                                    if (0xaaec <= code && code <= 0xaaed) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0xaaf6) {
                                            if (code < 0xaaf5) {
                                                // Mc   [2] MEETEI MAYEK VOWEL SIGN AU..MEETEI MAYEK VOWEL SIGN AAU
                                                if (0xaaee <= code && code <= 0xaaef) {
                                                    return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                }
                                            }
                                            else {
                                                // Mc       MEETEI MAYEK VOWEL SIGN VISARGA
                                                if (0xaaf5 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xabe3) {
                                                // Mn       MEETEI MAYEK VIRAMA
                                                if (0xaaf6 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                if (code < 0xabe5) {
                                                    // Mc   [2] MEETEI MAYEK VOWEL SIGN ONAP..MEETEI MAYEK VOWEL SIGN INAP
                                                    if (0xabe3 <= code && code <= 0xabe4) {
                                                        return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                    }
                                                }
                                                else {
                                                    // Mn       MEETEI MAYEK VOWEL SIGN ANAP
                                                    if (0xabe5 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                else {
                                    if (code < 0xac00) {
                                        if (code < 0xabe9) {
                                            if (code < 0xabe8) {
                                                // Mc   [2] MEETEI MAYEK VOWEL SIGN YENAP..MEETEI MAYEK VOWEL SIGN SOUNAP
                                                if (0xabe6 <= code && code <= 0xabe7) {
                                                    return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                }
                                            }
                                            else {
                                                // Mn       MEETEI MAYEK VOWEL SIGN UNAP
                                                if (0xabe8 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xabec) {
                                                // Mc   [2] MEETEI MAYEK VOWEL SIGN CHEINAP..MEETEI MAYEK VOWEL SIGN NUNG
                                                if (0xabe9 <= code && code <= 0xabea) {
                                                    return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                }
                                            }
                                            else {
                                                // Mc       MEETEI MAYEK LUM IYEK
                                                if (0xabec === code) {
                                                    return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                }
                                                // Mn       MEETEI MAYEK APUN IYEK
                                                if (0xabed === code) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0xac1d) {
                                            if (code < 0xac01) {
                                                // Lo       HANGUL SYLLABLE GA
                                                if (0xac00 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                if (code < 0xac1c) {
                                                    // Lo  [27] HANGUL SYLLABLE GAG..HANGUL SYLLABLE GAH
                                                    if (0xac01 <= code && code <= 0xac1b) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                                else {
                                                    // Lo       HANGUL SYLLABLE GAE
                                                    if (0xac1c === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xac38) {
                                                // Lo  [27] HANGUL SYLLABLE GAEG..HANGUL SYLLABLE GAEH
                                                if (0xac1d <= code && code <= 0xac37) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                if (code < 0xac39) {
                                                    // Lo       HANGUL SYLLABLE GYA
                                                    if (0xac38 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                                else {
                                                    // Lo  [27] HANGUL SYLLABLE GYAG..HANGUL SYLLABLE GYAH
                                                    if (0xac39 <= code && code <= 0xac53) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            else {
                if (code < 0xb584) {
                    if (code < 0xb0ec) {
                        if (code < 0xaea0) {
                            if (code < 0xad6d) {
                                if (code < 0xace0) {
                                    if (code < 0xac8d) {
                                        if (code < 0xac70) {
                                            if (code < 0xac55) {
                                                // Lo       HANGUL SYLLABLE GYAE
                                                if (0xac54 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                // Lo  [27] HANGUL SYLLABLE GYAEG..HANGUL SYLLABLE GYAEH
                                                if (0xac55 <= code && code <= 0xac6f) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xac71) {
                                                // Lo       HANGUL SYLLABLE GEO
                                                if (0xac70 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                if (code < 0xac8c) {
                                                    // Lo  [27] HANGUL SYLLABLE GEOG..HANGUL SYLLABLE GEOH
                                                    if (0xac71 <= code && code <= 0xac8b) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                                else {
                                                    // Lo       HANGUL SYLLABLE GE
                                                    if (0xac8c === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0xaca9) {
                                            if (code < 0xaca8) {
                                                // Lo  [27] HANGUL SYLLABLE GEG..HANGUL SYLLABLE GEH
                                                if (0xac8d <= code && code <= 0xaca7) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                // Lo       HANGUL SYLLABLE GYEO
                                                if (0xaca8 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xacc4) {
                                                // Lo  [27] HANGUL SYLLABLE GYEOG..HANGUL SYLLABLE GYEOH
                                                if (0xaca9 <= code && code <= 0xacc3) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                if (code < 0xacc5) {
                                                    // Lo       HANGUL SYLLABLE GYE
                                                    if (0xacc4 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                                else {
                                                    // Lo  [27] HANGUL SYLLABLE GYEG..HANGUL SYLLABLE GYEH
                                                    if (0xacc5 <= code && code <= 0xacdf) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                else {
                                    if (code < 0xad19) {
                                        if (code < 0xacfc) {
                                            if (code < 0xace1) {
                                                // Lo       HANGUL SYLLABLE GO
                                                if (0xace0 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                // Lo  [27] HANGUL SYLLABLE GOG..HANGUL SYLLABLE GOH
                                                if (0xace1 <= code && code <= 0xacfb) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xacfd) {
                                                // Lo       HANGUL SYLLABLE GWA
                                                if (0xacfc === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                if (code < 0xad18) {
                                                    // Lo  [27] HANGUL SYLLABLE GWAG..HANGUL SYLLABLE GWAH
                                                    if (0xacfd <= code && code <= 0xad17) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                                else {
                                                    // Lo       HANGUL SYLLABLE GWAE
                                                    if (0xad18 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0xad50) {
                                            if (code < 0xad34) {
                                                // Lo  [27] HANGUL SYLLABLE GWAEG..HANGUL SYLLABLE GWAEH
                                                if (0xad19 <= code && code <= 0xad33) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                if (code < 0xad35) {
                                                    // Lo       HANGUL SYLLABLE GOE
                                                    if (0xad34 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                                else {
                                                    // Lo  [27] HANGUL SYLLABLE GOEG..HANGUL SYLLABLE GOEH
                                                    if (0xad35 <= code && code <= 0xad4f) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xad51) {
                                                // Lo       HANGUL SYLLABLE GYO
                                                if (0xad50 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                if (code < 0xad6c) {
                                                    // Lo  [27] HANGUL SYLLABLE GYOG..HANGUL SYLLABLE GYOH
                                                    if (0xad51 <= code && code <= 0xad6b) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                                else {
                                                    // Lo       HANGUL SYLLABLE GU
                                                    if (0xad6c === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            else {
                                if (code < 0xadf9) {
                                    if (code < 0xadc0) {
                                        if (code < 0xad89) {
                                            if (code < 0xad88) {
                                                // Lo  [27] HANGUL SYLLABLE GUG..HANGUL SYLLABLE GUH
                                                if (0xad6d <= code && code <= 0xad87) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                // Lo       HANGUL SYLLABLE GWEO
                                                if (0xad88 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xada4) {
                                                // Lo  [27] HANGUL SYLLABLE GWEOG..HANGUL SYLLABLE GWEOH
                                                if (0xad89 <= code && code <= 0xada3) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                if (code < 0xada5) {
                                                    // Lo       HANGUL SYLLABLE GWE
                                                    if (0xada4 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                                else {
                                                    // Lo  [27] HANGUL SYLLABLE GWEG..HANGUL SYLLABLE GWEH
                                                    if (0xada5 <= code && code <= 0xadbf) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0xaddc) {
                                            if (code < 0xadc1) {
                                                // Lo       HANGUL SYLLABLE GWI
                                                if (0xadc0 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                // Lo  [27] HANGUL SYLLABLE GWIG..HANGUL SYLLABLE GWIH
                                                if (0xadc1 <= code && code <= 0xaddb) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xaddd) {
                                                // Lo       HANGUL SYLLABLE GYU
                                                if (0xaddc === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                if (code < 0xadf8) {
                                                    // Lo  [27] HANGUL SYLLABLE GYUG..HANGUL SYLLABLE GYUH
                                                    if (0xaddd <= code && code <= 0xadf7) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                                else {
                                                    // Lo       HANGUL SYLLABLE GEU
                                                    if (0xadf8 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                else {
                                    if (code < 0xae4c) {
                                        if (code < 0xae15) {
                                            if (code < 0xae14) {
                                                // Lo  [27] HANGUL SYLLABLE GEUG..HANGUL SYLLABLE GEUH
                                                if (0xadf9 <= code && code <= 0xae13) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                // Lo       HANGUL SYLLABLE GYI
                                                if (0xae14 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xae30) {
                                                // Lo  [27] HANGUL SYLLABLE GYIG..HANGUL SYLLABLE GYIH
                                                if (0xae15 <= code && code <= 0xae2f) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                if (code < 0xae31) {
                                                    // Lo       HANGUL SYLLABLE GI
                                                    if (0xae30 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                                else {
                                                    // Lo  [27] HANGUL SYLLABLE GIG..HANGUL SYLLABLE GIH
                                                    if (0xae31 <= code && code <= 0xae4b) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0xae69) {
                                            if (code < 0xae4d) {
                                                // Lo       HANGUL SYLLABLE GGA
                                                if (0xae4c === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                if (code < 0xae68) {
                                                    // Lo  [27] HANGUL SYLLABLE GGAG..HANGUL SYLLABLE GGAH
                                                    if (0xae4d <= code && code <= 0xae67) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                                else {
                                                    // Lo       HANGUL SYLLABLE GGAE
                                                    if (0xae68 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xae84) {
                                                // Lo  [27] HANGUL SYLLABLE GGAEG..HANGUL SYLLABLE GGAEH
                                                if (0xae69 <= code && code <= 0xae83) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                if (code < 0xae85) {
                                                    // Lo       HANGUL SYLLABLE GGYA
                                                    if (0xae84 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                                else {
                                                    // Lo  [27] HANGUL SYLLABLE GGYAG..HANGUL SYLLABLE GGYAH
                                                    if (0xae85 <= code && code <= 0xae9f) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        else {
                            if (code < 0xafb9) {
                                if (code < 0xaf2c) {
                                    if (code < 0xaed9) {
                                        if (code < 0xaebc) {
                                            if (code < 0xaea1) {
                                                // Lo       HANGUL SYLLABLE GGYAE
                                                if (0xaea0 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                // Lo  [27] HANGUL SYLLABLE GGYAEG..HANGUL SYLLABLE GGYAEH
                                                if (0xaea1 <= code && code <= 0xaebb) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xaebd) {
                                                // Lo       HANGUL SYLLABLE GGEO
                                                if (0xaebc === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                if (code < 0xaed8) {
                                                    // Lo  [27] HANGUL SYLLABLE GGEOG..HANGUL SYLLABLE GGEOH
                                                    if (0xaebd <= code && code <= 0xaed7) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                                else {
                                                    // Lo       HANGUL SYLLABLE GGE
                                                    if (0xaed8 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0xaef5) {
                                            if (code < 0xaef4) {
                                                // Lo  [27] HANGUL SYLLABLE GGEG..HANGUL SYLLABLE GGEH
                                                if (0xaed9 <= code && code <= 0xaef3) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                // Lo       HANGUL SYLLABLE GGYEO
                                                if (0xaef4 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xaf10) {
                                                // Lo  [27] HANGUL SYLLABLE GGYEOG..HANGUL SYLLABLE GGYEOH
                                                if (0xaef5 <= code && code <= 0xaf0f) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                if (code < 0xaf11) {
                                                    // Lo       HANGUL SYLLABLE GGYE
                                                    if (0xaf10 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                                else {
                                                    // Lo  [27] HANGUL SYLLABLE GGYEG..HANGUL SYLLABLE GGYEH
                                                    if (0xaf11 <= code && code <= 0xaf2b) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                else {
                                    if (code < 0xaf65) {
                                        if (code < 0xaf48) {
                                            if (code < 0xaf2d) {
                                                // Lo       HANGUL SYLLABLE GGO
                                                if (0xaf2c === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                // Lo  [27] HANGUL SYLLABLE GGOG..HANGUL SYLLABLE GGOH
                                                if (0xaf2d <= code && code <= 0xaf47) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xaf49) {
                                                // Lo       HANGUL SYLLABLE GGWA
                                                if (0xaf48 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                if (code < 0xaf64) {
                                                    // Lo  [27] HANGUL SYLLABLE GGWAG..HANGUL SYLLABLE GGWAH
                                                    if (0xaf49 <= code && code <= 0xaf63) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                                else {
                                                    // Lo       HANGUL SYLLABLE GGWAE
                                                    if (0xaf64 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0xaf9c) {
                                            if (code < 0xaf80) {
                                                // Lo  [27] HANGUL SYLLABLE GGWAEG..HANGUL SYLLABLE GGWAEH
                                                if (0xaf65 <= code && code <= 0xaf7f) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                if (code < 0xaf81) {
                                                    // Lo       HANGUL SYLLABLE GGOE
                                                    if (0xaf80 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                                else {
                                                    // Lo  [27] HANGUL SYLLABLE GGOEG..HANGUL SYLLABLE GGOEH
                                                    if (0xaf81 <= code && code <= 0xaf9b) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xaf9d) {
                                                // Lo       HANGUL SYLLABLE GGYO
                                                if (0xaf9c === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                if (code < 0xafb8) {
                                                    // Lo  [27] HANGUL SYLLABLE GGYOG..HANGUL SYLLABLE GGYOH
                                                    if (0xaf9d <= code && code <= 0xafb7) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                                else {
                                                    // Lo       HANGUL SYLLABLE GGU
                                                    if (0xafb8 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            else {
                                if (code < 0xb045) {
                                    if (code < 0xb00c) {
                                        if (code < 0xafd5) {
                                            if (code < 0xafd4) {
                                                // Lo  [27] HANGUL SYLLABLE GGUG..HANGUL SYLLABLE GGUH
                                                if (0xafb9 <= code && code <= 0xafd3) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                // Lo       HANGUL SYLLABLE GGWEO
                                                if (0xafd4 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xaff0) {
                                                // Lo  [27] HANGUL SYLLABLE GGWEOG..HANGUL SYLLABLE GGWEOH
                                                if (0xafd5 <= code && code <= 0xafef) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                if (code < 0xaff1) {
                                                    // Lo       HANGUL SYLLABLE GGWE
                                                    if (0xaff0 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                                else {
                                                    // Lo  [27] HANGUL SYLLABLE GGWEG..HANGUL SYLLABLE GGWEH
                                                    if (0xaff1 <= code && code <= 0xb00b) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0xb028) {
                                            if (code < 0xb00d) {
                                                // Lo       HANGUL SYLLABLE GGWI
                                                if (0xb00c === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                // Lo  [27] HANGUL SYLLABLE GGWIG..HANGUL SYLLABLE GGWIH
                                                if (0xb00d <= code && code <= 0xb027) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xb029) {
                                                // Lo       HANGUL SYLLABLE GGYU
                                                if (0xb028 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                if (code < 0xb044) {
                                                    // Lo  [27] HANGUL SYLLABLE GGYUG..HANGUL SYLLABLE GGYUH
                                                    if (0xb029 <= code && code <= 0xb043) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                                else {
                                                    // Lo       HANGUL SYLLABLE GGEU
                                                    if (0xb044 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                else {
                                    if (code < 0xb098) {
                                        if (code < 0xb061) {
                                            if (code < 0xb060) {
                                                // Lo  [27] HANGUL SYLLABLE GGEUG..HANGUL SYLLABLE GGEUH
                                                if (0xb045 <= code && code <= 0xb05f) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                // Lo       HANGUL SYLLABLE GGYI
                                                if (0xb060 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xb07c) {
                                                // Lo  [27] HANGUL SYLLABLE GGYIG..HANGUL SYLLABLE GGYIH
                                                if (0xb061 <= code && code <= 0xb07b) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                if (code < 0xb07d) {
                                                    // Lo       HANGUL SYLLABLE GGI
                                                    if (0xb07c === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                                else {
                                                    // Lo  [27] HANGUL SYLLABLE GGIG..HANGUL SYLLABLE GGIH
                                                    if (0xb07d <= code && code <= 0xb097) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0xb0b5) {
                                            if (code < 0xb099) {
                                                // Lo       HANGUL SYLLABLE NA
                                                if (0xb098 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                if (code < 0xb0b4) {
                                                    // Lo  [27] HANGUL SYLLABLE NAG..HANGUL SYLLABLE NAH
                                                    if (0xb099 <= code && code <= 0xb0b3) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                                else {
                                                    // Lo       HANGUL SYLLABLE NAE
                                                    if (0xb0b4 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xb0d0) {
                                                // Lo  [27] HANGUL SYLLABLE NAEG..HANGUL SYLLABLE NAEH
                                                if (0xb0b5 <= code && code <= 0xb0cf) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                if (code < 0xb0d1) {
                                                    // Lo       HANGUL SYLLABLE NYA
                                                    if (0xb0d0 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                                else {
                                                    // Lo  [27] HANGUL SYLLABLE NYAG..HANGUL SYLLABLE NYAH
                                                    if (0xb0d1 <= code && code <= 0xb0eb) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                    else {
                        if (code < 0xb338) {
                            if (code < 0xb205) {
                                if (code < 0xb178) {
                                    if (code < 0xb125) {
                                        if (code < 0xb108) {
                                            if (code < 0xb0ed) {
                                                // Lo       HANGUL SYLLABLE NYAE
                                                if (0xb0ec === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                // Lo  [27] HANGUL SYLLABLE NYAEG..HANGUL SYLLABLE NYAEH
                                                if (0xb0ed <= code && code <= 0xb107) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xb109) {
                                                // Lo       HANGUL SYLLABLE NEO
                                                if (0xb108 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                if (code < 0xb124) {
                                                    // Lo  [27] HANGUL SYLLABLE NEOG..HANGUL SYLLABLE NEOH
                                                    if (0xb109 <= code && code <= 0xb123) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                                else {
                                                    // Lo       HANGUL SYLLABLE NE
                                                    if (0xb124 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0xb141) {
                                            if (code < 0xb140) {
                                                // Lo  [27] HANGUL SYLLABLE NEG..HANGUL SYLLABLE NEH
                                                if (0xb125 <= code && code <= 0xb13f) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                // Lo       HANGUL SYLLABLE NYEO
                                                if (0xb140 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xb15c) {
                                                // Lo  [27] HANGUL SYLLABLE NYEOG..HANGUL SYLLABLE NYEOH
                                                if (0xb141 <= code && code <= 0xb15b) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                if (code < 0xb15d) {
                                                    // Lo       HANGUL SYLLABLE NYE
                                                    if (0xb15c === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                                else {
                                                    // Lo  [27] HANGUL SYLLABLE NYEG..HANGUL SYLLABLE NYEH
                                                    if (0xb15d <= code && code <= 0xb177) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                else {
                                    if (code < 0xb1b1) {
                                        if (code < 0xb194) {
                                            if (code < 0xb179) {
                                                // Lo       HANGUL SYLLABLE NO
                                                if (0xb178 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                // Lo  [27] HANGUL SYLLABLE NOG..HANGUL SYLLABLE NOH
                                                if (0xb179 <= code && code <= 0xb193) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xb195) {
                                                // Lo       HANGUL SYLLABLE NWA
                                                if (0xb194 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                if (code < 0xb1b0) {
                                                    // Lo  [27] HANGUL SYLLABLE NWAG..HANGUL SYLLABLE NWAH
                                                    if (0xb195 <= code && code <= 0xb1af) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                                else {
                                                    // Lo       HANGUL SYLLABLE NWAE
                                                    if (0xb1b0 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0xb1e8) {
                                            if (code < 0xb1cc) {
                                                // Lo  [27] HANGUL SYLLABLE NWAEG..HANGUL SYLLABLE NWAEH
                                                if (0xb1b1 <= code && code <= 0xb1cb) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                if (code < 0xb1cd) {
                                                    // Lo       HANGUL SYLLABLE NOE
                                                    if (0xb1cc === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                                else {
                                                    // Lo  [27] HANGUL SYLLABLE NOEG..HANGUL SYLLABLE NOEH
                                                    if (0xb1cd <= code && code <= 0xb1e7) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xb1e9) {
                                                // Lo       HANGUL SYLLABLE NYO
                                                if (0xb1e8 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                if (code < 0xb204) {
                                                    // Lo  [27] HANGUL SYLLABLE NYOG..HANGUL SYLLABLE NYOH
                                                    if (0xb1e9 <= code && code <= 0xb203) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                                else {
                                                    // Lo       HANGUL SYLLABLE NU
                                                    if (0xb204 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            else {
                                if (code < 0xb291) {
                                    if (code < 0xb258) {
                                        if (code < 0xb221) {
                                            if (code < 0xb220) {
                                                // Lo  [27] HANGUL SYLLABLE NUG..HANGUL SYLLABLE NUH
                                                if (0xb205 <= code && code <= 0xb21f) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                // Lo       HANGUL SYLLABLE NWEO
                                                if (0xb220 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xb23c) {
                                                // Lo  [27] HANGUL SYLLABLE NWEOG..HANGUL SYLLABLE NWEOH
                                                if (0xb221 <= code && code <= 0xb23b) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                if (code < 0xb23d) {
                                                    // Lo       HANGUL SYLLABLE NWE
                                                    if (0xb23c === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                                else {
                                                    // Lo  [27] HANGUL SYLLABLE NWEG..HANGUL SYLLABLE NWEH
                                                    if (0xb23d <= code && code <= 0xb257) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0xb274) {
                                            if (code < 0xb259) {
                                                // Lo       HANGUL SYLLABLE NWI
                                                if (0xb258 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                // Lo  [27] HANGUL SYLLABLE NWIG..HANGUL SYLLABLE NWIH
                                                if (0xb259 <= code && code <= 0xb273) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xb275) {
                                                // Lo       HANGUL SYLLABLE NYU
                                                if (0xb274 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                if (code < 0xb290) {
                                                    // Lo  [27] HANGUL SYLLABLE NYUG..HANGUL SYLLABLE NYUH
                                                    if (0xb275 <= code && code <= 0xb28f) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                                else {
                                                    // Lo       HANGUL SYLLABLE NEU
                                                    if (0xb290 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                else {
                                    if (code < 0xb2e4) {
                                        if (code < 0xb2ad) {
                                            if (code < 0xb2ac) {
                                                // Lo  [27] HANGUL SYLLABLE NEUG..HANGUL SYLLABLE NEUH
                                                if (0xb291 <= code && code <= 0xb2ab) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                // Lo       HANGUL SYLLABLE NYI
                                                if (0xb2ac === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xb2c8) {
                                                // Lo  [27] HANGUL SYLLABLE NYIG..HANGUL SYLLABLE NYIH
                                                if (0xb2ad <= code && code <= 0xb2c7) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                if (code < 0xb2c9) {
                                                    // Lo       HANGUL SYLLABLE NI
                                                    if (0xb2c8 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                                else {
                                                    // Lo  [27] HANGUL SYLLABLE NIG..HANGUL SYLLABLE NIH
                                                    if (0xb2c9 <= code && code <= 0xb2e3) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0xb301) {
                                            if (code < 0xb2e5) {
                                                // Lo       HANGUL SYLLABLE DA
                                                if (0xb2e4 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                if (code < 0xb300) {
                                                    // Lo  [27] HANGUL SYLLABLE DAG..HANGUL SYLLABLE DAH
                                                    if (0xb2e5 <= code && code <= 0xb2ff) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                                else {
                                                    // Lo       HANGUL SYLLABLE DAE
                                                    if (0xb300 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xb31c) {
                                                // Lo  [27] HANGUL SYLLABLE DAEG..HANGUL SYLLABLE DAEH
                                                if (0xb301 <= code && code <= 0xb31b) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                if (code < 0xb31d) {
                                                    // Lo       HANGUL SYLLABLE DYA
                                                    if (0xb31c === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                                else {
                                                    // Lo  [27] HANGUL SYLLABLE DYAG..HANGUL SYLLABLE DYAH
                                                    if (0xb31d <= code && code <= 0xb337) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        else {
                            if (code < 0xb451) {
                                if (code < 0xb3c4) {
                                    if (code < 0xb371) {
                                        if (code < 0xb354) {
                                            if (code < 0xb339) {
                                                // Lo       HANGUL SYLLABLE DYAE
                                                if (0xb338 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                // Lo  [27] HANGUL SYLLABLE DYAEG..HANGUL SYLLABLE DYAEH
                                                if (0xb339 <= code && code <= 0xb353) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xb355) {
                                                // Lo       HANGUL SYLLABLE DEO
                                                if (0xb354 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                if (code < 0xb370) {
                                                    // Lo  [27] HANGUL SYLLABLE DEOG..HANGUL SYLLABLE DEOH
                                                    if (0xb355 <= code && code <= 0xb36f) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                                else {
                                                    // Lo       HANGUL SYLLABLE DE
                                                    if (0xb370 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0xb38d) {
                                            if (code < 0xb38c) {
                                                // Lo  [27] HANGUL SYLLABLE DEG..HANGUL SYLLABLE DEH
                                                if (0xb371 <= code && code <= 0xb38b) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                // Lo       HANGUL SYLLABLE DYEO
                                                if (0xb38c === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xb3a8) {
                                                // Lo  [27] HANGUL SYLLABLE DYEOG..HANGUL SYLLABLE DYEOH
                                                if (0xb38d <= code && code <= 0xb3a7) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                if (code < 0xb3a9) {
                                                    // Lo       HANGUL SYLLABLE DYE
                                                    if (0xb3a8 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                                else {
                                                    // Lo  [27] HANGUL SYLLABLE DYEG..HANGUL SYLLABLE DYEH
                                                    if (0xb3a9 <= code && code <= 0xb3c3) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                else {
                                    if (code < 0xb3fd) {
                                        if (code < 0xb3e0) {
                                            if (code < 0xb3c5) {
                                                // Lo       HANGUL SYLLABLE DO
                                                if (0xb3c4 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                // Lo  [27] HANGUL SYLLABLE DOG..HANGUL SYLLABLE DOH
                                                if (0xb3c5 <= code && code <= 0xb3df) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xb3e1) {
                                                // Lo       HANGUL SYLLABLE DWA
                                                if (0xb3e0 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                if (code < 0xb3fc) {
                                                    // Lo  [27] HANGUL SYLLABLE DWAG..HANGUL SYLLABLE DWAH
                                                    if (0xb3e1 <= code && code <= 0xb3fb) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                                else {
                                                    // Lo       HANGUL SYLLABLE DWAE
                                                    if (0xb3fc === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0xb434) {
                                            if (code < 0xb418) {
                                                // Lo  [27] HANGUL SYLLABLE DWAEG..HANGUL SYLLABLE DWAEH
                                                if (0xb3fd <= code && code <= 0xb417) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                if (code < 0xb419) {
                                                    // Lo       HANGUL SYLLABLE DOE
                                                    if (0xb418 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                                else {
                                                    // Lo  [27] HANGUL SYLLABLE DOEG..HANGUL SYLLABLE DOEH
                                                    if (0xb419 <= code && code <= 0xb433) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xb435) {
                                                // Lo       HANGUL SYLLABLE DYO
                                                if (0xb434 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                if (code < 0xb450) {
                                                    // Lo  [27] HANGUL SYLLABLE DYOG..HANGUL SYLLABLE DYOH
                                                    if (0xb435 <= code && code <= 0xb44f) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                                else {
                                                    // Lo       HANGUL SYLLABLE DU
                                                    if (0xb450 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            else {
                                if (code < 0xb4dd) {
                                    if (code < 0xb4a4) {
                                        if (code < 0xb46d) {
                                            if (code < 0xb46c) {
                                                // Lo  [27] HANGUL SYLLABLE DUG..HANGUL SYLLABLE DUH
                                                if (0xb451 <= code && code <= 0xb46b) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                // Lo       HANGUL SYLLABLE DWEO
                                                if (0xb46c === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xb488) {
                                                // Lo  [27] HANGUL SYLLABLE DWEOG..HANGUL SYLLABLE DWEOH
                                                if (0xb46d <= code && code <= 0xb487) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                if (code < 0xb489) {
                                                    // Lo       HANGUL SYLLABLE DWE
                                                    if (0xb488 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                                else {
                                                    // Lo  [27] HANGUL SYLLABLE DWEG..HANGUL SYLLABLE DWEH
                                                    if (0xb489 <= code && code <= 0xb4a3) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0xb4c0) {
                                            if (code < 0xb4a5) {
                                                // Lo       HANGUL SYLLABLE DWI
                                                if (0xb4a4 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                // Lo  [27] HANGUL SYLLABLE DWIG..HANGUL SYLLABLE DWIH
                                                if (0xb4a5 <= code && code <= 0xb4bf) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xb4c1) {
                                                // Lo       HANGUL SYLLABLE DYU
                                                if (0xb4c0 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                if (code < 0xb4dc) {
                                                    // Lo  [27] HANGUL SYLLABLE DYUG..HANGUL SYLLABLE DYUH
                                                    if (0xb4c1 <= code && code <= 0xb4db) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                                else {
                                                    // Lo       HANGUL SYLLABLE DEU
                                                    if (0xb4dc === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                else {
                                    if (code < 0xb530) {
                                        if (code < 0xb4f9) {
                                            if (code < 0xb4f8) {
                                                // Lo  [27] HANGUL SYLLABLE DEUG..HANGUL SYLLABLE DEUH
                                                if (0xb4dd <= code && code <= 0xb4f7) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                // Lo       HANGUL SYLLABLE DYI
                                                if (0xb4f8 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xb514) {
                                                // Lo  [27] HANGUL SYLLABLE DYIG..HANGUL SYLLABLE DYIH
                                                if (0xb4f9 <= code && code <= 0xb513) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                if (code < 0xb515) {
                                                    // Lo       HANGUL SYLLABLE DI
                                                    if (0xb514 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                                else {
                                                    // Lo  [27] HANGUL SYLLABLE DIG..HANGUL SYLLABLE DIH
                                                    if (0xb515 <= code && code <= 0xb52f) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0xb54d) {
                                            if (code < 0xb531) {
                                                // Lo       HANGUL SYLLABLE DDA
                                                if (0xb530 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                if (code < 0xb54c) {
                                                    // Lo  [27] HANGUL SYLLABLE DDAG..HANGUL SYLLABLE DDAH
                                                    if (0xb531 <= code && code <= 0xb54b) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                                else {
                                                    // Lo       HANGUL SYLLABLE DDAE
                                                    if (0xb54c === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xb568) {
                                                // Lo  [27] HANGUL SYLLABLE DDAEG..HANGUL SYLLABLE DDAEH
                                                if (0xb54d <= code && code <= 0xb567) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                if (code < 0xb569) {
                                                    // Lo       HANGUL SYLLABLE DDYA
                                                    if (0xb568 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                                else {
                                                    // Lo  [27] HANGUL SYLLABLE DDYAG..HANGUL SYLLABLE DDYAH
                                                    if (0xb569 <= code && code <= 0xb583) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                else {
                    if (code < 0xba1c) {
                        if (code < 0xb7d0) {
                            if (code < 0xb69d) {
                                if (code < 0xb610) {
                                    if (code < 0xb5bd) {
                                        if (code < 0xb5a0) {
                                            if (code < 0xb585) {
                                                // Lo       HANGUL SYLLABLE DDYAE
                                                if (0xb584 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                // Lo  [27] HANGUL SYLLABLE DDYAEG..HANGUL SYLLABLE DDYAEH
                                                if (0xb585 <= code && code <= 0xb59f) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xb5a1) {
                                                // Lo       HANGUL SYLLABLE DDEO
                                                if (0xb5a0 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                if (code < 0xb5bc) {
                                                    // Lo  [27] HANGUL SYLLABLE DDEOG..HANGUL SYLLABLE DDEOH
                                                    if (0xb5a1 <= code && code <= 0xb5bb) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                                else {
                                                    // Lo       HANGUL SYLLABLE DDE
                                                    if (0xb5bc === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0xb5d9) {
                                            if (code < 0xb5d8) {
                                                // Lo  [27] HANGUL SYLLABLE DDEG..HANGUL SYLLABLE DDEH
                                                if (0xb5bd <= code && code <= 0xb5d7) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                // Lo       HANGUL SYLLABLE DDYEO
                                                if (0xb5d8 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xb5f4) {
                                                // Lo  [27] HANGUL SYLLABLE DDYEOG..HANGUL SYLLABLE DDYEOH
                                                if (0xb5d9 <= code && code <= 0xb5f3) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                if (code < 0xb5f5) {
                                                    // Lo       HANGUL SYLLABLE DDYE
                                                    if (0xb5f4 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                                else {
                                                    // Lo  [27] HANGUL SYLLABLE DDYEG..HANGUL SYLLABLE DDYEH
                                                    if (0xb5f5 <= code && code <= 0xb60f) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                else {
                                    if (code < 0xb649) {
                                        if (code < 0xb62c) {
                                            if (code < 0xb611) {
                                                // Lo       HANGUL SYLLABLE DDO
                                                if (0xb610 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                // Lo  [27] HANGUL SYLLABLE DDOG..HANGUL SYLLABLE DDOH
                                                if (0xb611 <= code && code <= 0xb62b) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xb62d) {
                                                // Lo       HANGUL SYLLABLE DDWA
                                                if (0xb62c === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                if (code < 0xb648) {
                                                    // Lo  [27] HANGUL SYLLABLE DDWAG..HANGUL SYLLABLE DDWAH
                                                    if (0xb62d <= code && code <= 0xb647) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                                else {
                                                    // Lo       HANGUL SYLLABLE DDWAE
                                                    if (0xb648 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0xb680) {
                                            if (code < 0xb664) {
                                                // Lo  [27] HANGUL SYLLABLE DDWAEG..HANGUL SYLLABLE DDWAEH
                                                if (0xb649 <= code && code <= 0xb663) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                if (code < 0xb665) {
                                                    // Lo       HANGUL SYLLABLE DDOE
                                                    if (0xb664 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                                else {
                                                    // Lo  [27] HANGUL SYLLABLE DDOEG..HANGUL SYLLABLE DDOEH
                                                    if (0xb665 <= code && code <= 0xb67f) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xb681) {
                                                // Lo       HANGUL SYLLABLE DDYO
                                                if (0xb680 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                if (code < 0xb69c) {
                                                    // Lo  [27] HANGUL SYLLABLE DDYOG..HANGUL SYLLABLE DDYOH
                                                    if (0xb681 <= code && code <= 0xb69b) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                                else {
                                                    // Lo       HANGUL SYLLABLE DDU
                                                    if (0xb69c === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            else {
                                if (code < 0xb729) {
                                    if (code < 0xb6f0) {
                                        if (code < 0xb6b9) {
                                            if (code < 0xb6b8) {
                                                // Lo  [27] HANGUL SYLLABLE DDUG..HANGUL SYLLABLE DDUH
                                                if (0xb69d <= code && code <= 0xb6b7) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                // Lo       HANGUL SYLLABLE DDWEO
                                                if (0xb6b8 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xb6d4) {
                                                // Lo  [27] HANGUL SYLLABLE DDWEOG..HANGUL SYLLABLE DDWEOH
                                                if (0xb6b9 <= code && code <= 0xb6d3) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                if (code < 0xb6d5) {
                                                    // Lo       HANGUL SYLLABLE DDWE
                                                    if (0xb6d4 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                                else {
                                                    // Lo  [27] HANGUL SYLLABLE DDWEG..HANGUL SYLLABLE DDWEH
                                                    if (0xb6d5 <= code && code <= 0xb6ef) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0xb70c) {
                                            if (code < 0xb6f1) {
                                                // Lo       HANGUL SYLLABLE DDWI
                                                if (0xb6f0 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                // Lo  [27] HANGUL SYLLABLE DDWIG..HANGUL SYLLABLE DDWIH
                                                if (0xb6f1 <= code && code <= 0xb70b) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xb70d) {
                                                // Lo       HANGUL SYLLABLE DDYU
                                                if (0xb70c === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                if (code < 0xb728) {
                                                    // Lo  [27] HANGUL SYLLABLE DDYUG..HANGUL SYLLABLE DDYUH
                                                    if (0xb70d <= code && code <= 0xb727) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                                else {
                                                    // Lo       HANGUL SYLLABLE DDEU
                                                    if (0xb728 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                else {
                                    if (code < 0xb77c) {
                                        if (code < 0xb745) {
                                            if (code < 0xb744) {
                                                // Lo  [27] HANGUL SYLLABLE DDEUG..HANGUL SYLLABLE DDEUH
                                                if (0xb729 <= code && code <= 0xb743) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                // Lo       HANGUL SYLLABLE DDYI
                                                if (0xb744 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xb760) {
                                                // Lo  [27] HANGUL SYLLABLE DDYIG..HANGUL SYLLABLE DDYIH
                                                if (0xb745 <= code && code <= 0xb75f) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                if (code < 0xb761) {
                                                    // Lo       HANGUL SYLLABLE DDI
                                                    if (0xb760 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                                else {
                                                    // Lo  [27] HANGUL SYLLABLE DDIG..HANGUL SYLLABLE DDIH
                                                    if (0xb761 <= code && code <= 0xb77b) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0xb799) {
                                            if (code < 0xb77d) {
                                                // Lo       HANGUL SYLLABLE RA
                                                if (0xb77c === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                if (code < 0xb798) {
                                                    // Lo  [27] HANGUL SYLLABLE RAG..HANGUL SYLLABLE RAH
                                                    if (0xb77d <= code && code <= 0xb797) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                                else {
                                                    // Lo       HANGUL SYLLABLE RAE
                                                    if (0xb798 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xb7b4) {
                                                // Lo  [27] HANGUL SYLLABLE RAEG..HANGUL SYLLABLE RAEH
                                                if (0xb799 <= code && code <= 0xb7b3) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                if (code < 0xb7b5) {
                                                    // Lo       HANGUL SYLLABLE RYA
                                                    if (0xb7b4 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                                else {
                                                    // Lo  [27] HANGUL SYLLABLE RYAG..HANGUL SYLLABLE RYAH
                                                    if (0xb7b5 <= code && code <= 0xb7cf) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        else {
                            if (code < 0xb8e9) {
                                if (code < 0xb85c) {
                                    if (code < 0xb809) {
                                        if (code < 0xb7ec) {
                                            if (code < 0xb7d1) {
                                                // Lo       HANGUL SYLLABLE RYAE
                                                if (0xb7d0 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                // Lo  [27] HANGUL SYLLABLE RYAEG..HANGUL SYLLABLE RYAEH
                                                if (0xb7d1 <= code && code <= 0xb7eb) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xb7ed) {
                                                // Lo       HANGUL SYLLABLE REO
                                                if (0xb7ec === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                if (code < 0xb808) {
                                                    // Lo  [27] HANGUL SYLLABLE REOG..HANGUL SYLLABLE REOH
                                                    if (0xb7ed <= code && code <= 0xb807) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                                else {
                                                    // Lo       HANGUL SYLLABLE RE
                                                    if (0xb808 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0xb825) {
                                            if (code < 0xb824) {
                                                // Lo  [27] HANGUL SYLLABLE REG..HANGUL SYLLABLE REH
                                                if (0xb809 <= code && code <= 0xb823) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                // Lo       HANGUL SYLLABLE RYEO
                                                if (0xb824 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xb840) {
                                                // Lo  [27] HANGUL SYLLABLE RYEOG..HANGUL SYLLABLE RYEOH
                                                if (0xb825 <= code && code <= 0xb83f) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                if (code < 0xb841) {
                                                    // Lo       HANGUL SYLLABLE RYE
                                                    if (0xb840 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                                else {
                                                    // Lo  [27] HANGUL SYLLABLE RYEG..HANGUL SYLLABLE RYEH
                                                    if (0xb841 <= code && code <= 0xb85b) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                else {
                                    if (code < 0xb895) {
                                        if (code < 0xb878) {
                                            if (code < 0xb85d) {
                                                // Lo       HANGUL SYLLABLE RO
                                                if (0xb85c === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                // Lo  [27] HANGUL SYLLABLE ROG..HANGUL SYLLABLE ROH
                                                if (0xb85d <= code && code <= 0xb877) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xb879) {
                                                // Lo       HANGUL SYLLABLE RWA
                                                if (0xb878 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                if (code < 0xb894) {
                                                    // Lo  [27] HANGUL SYLLABLE RWAG..HANGUL SYLLABLE RWAH
                                                    if (0xb879 <= code && code <= 0xb893) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                                else {
                                                    // Lo       HANGUL SYLLABLE RWAE
                                                    if (0xb894 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0xb8cc) {
                                            if (code < 0xb8b0) {
                                                // Lo  [27] HANGUL SYLLABLE RWAEG..HANGUL SYLLABLE RWAEH
                                                if (0xb895 <= code && code <= 0xb8af) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                if (code < 0xb8b1) {
                                                    // Lo       HANGUL SYLLABLE ROE
                                                    if (0xb8b0 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                                else {
                                                    // Lo  [27] HANGUL SYLLABLE ROEG..HANGUL SYLLABLE ROEH
                                                    if (0xb8b1 <= code && code <= 0xb8cb) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xb8cd) {
                                                // Lo       HANGUL SYLLABLE RYO
                                                if (0xb8cc === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                if (code < 0xb8e8) {
                                                    // Lo  [27] HANGUL SYLLABLE RYOG..HANGUL SYLLABLE RYOH
                                                    if (0xb8cd <= code && code <= 0xb8e7) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                                else {
                                                    // Lo       HANGUL SYLLABLE RU
                                                    if (0xb8e8 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            else {
                                if (code < 0xb975) {
                                    if (code < 0xb93c) {
                                        if (code < 0xb905) {
                                            if (code < 0xb904) {
                                                // Lo  [27] HANGUL SYLLABLE RUG..HANGUL SYLLABLE RUH
                                                if (0xb8e9 <= code && code <= 0xb903) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                // Lo       HANGUL SYLLABLE RWEO
                                                if (0xb904 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xb920) {
                                                // Lo  [27] HANGUL SYLLABLE RWEOG..HANGUL SYLLABLE RWEOH
                                                if (0xb905 <= code && code <= 0xb91f) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                if (code < 0xb921) {
                                                    // Lo       HANGUL SYLLABLE RWE
                                                    if (0xb920 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                                else {
                                                    // Lo  [27] HANGUL SYLLABLE RWEG..HANGUL SYLLABLE RWEH
                                                    if (0xb921 <= code && code <= 0xb93b) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0xb958) {
                                            if (code < 0xb93d) {
                                                // Lo       HANGUL SYLLABLE RWI
                                                if (0xb93c === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                // Lo  [27] HANGUL SYLLABLE RWIG..HANGUL SYLLABLE RWIH
                                                if (0xb93d <= code && code <= 0xb957) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xb959) {
                                                // Lo       HANGUL SYLLABLE RYU
                                                if (0xb958 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                if (code < 0xb974) {
                                                    // Lo  [27] HANGUL SYLLABLE RYUG..HANGUL SYLLABLE RYUH
                                                    if (0xb959 <= code && code <= 0xb973) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                                else {
                                                    // Lo       HANGUL SYLLABLE REU
                                                    if (0xb974 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                else {
                                    if (code < 0xb9c8) {
                                        if (code < 0xb991) {
                                            if (code < 0xb990) {
                                                // Lo  [27] HANGUL SYLLABLE REUG..HANGUL SYLLABLE REUH
                                                if (0xb975 <= code && code <= 0xb98f) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                // Lo       HANGUL SYLLABLE RYI
                                                if (0xb990 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xb9ac) {
                                                // Lo  [27] HANGUL SYLLABLE RYIG..HANGUL SYLLABLE RYIH
                                                if (0xb991 <= code && code <= 0xb9ab) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                if (code < 0xb9ad) {
                                                    // Lo       HANGUL SYLLABLE RI
                                                    if (0xb9ac === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                                else {
                                                    // Lo  [27] HANGUL SYLLABLE RIG..HANGUL SYLLABLE RIH
                                                    if (0xb9ad <= code && code <= 0xb9c7) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0xb9e5) {
                                            if (code < 0xb9c9) {
                                                // Lo       HANGUL SYLLABLE MA
                                                if (0xb9c8 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                if (code < 0xb9e4) {
                                                    // Lo  [27] HANGUL SYLLABLE MAG..HANGUL SYLLABLE MAH
                                                    if (0xb9c9 <= code && code <= 0xb9e3) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                                else {
                                                    // Lo       HANGUL SYLLABLE MAE
                                                    if (0xb9e4 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xba00) {
                                                // Lo  [27] HANGUL SYLLABLE MAEG..HANGUL SYLLABLE MAEH
                                                if (0xb9e5 <= code && code <= 0xb9ff) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                if (code < 0xba01) {
                                                    // Lo       HANGUL SYLLABLE MYA
                                                    if (0xba00 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                                else {
                                                    // Lo  [27] HANGUL SYLLABLE MYAG..HANGUL SYLLABLE MYAH
                                                    if (0xba01 <= code && code <= 0xba1b) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                    else {
                        if (code < 0xbc68) {
                            if (code < 0xbb35) {
                                if (code < 0xbaa8) {
                                    if (code < 0xba55) {
                                        if (code < 0xba38) {
                                            if (code < 0xba1d) {
                                                // Lo       HANGUL SYLLABLE MYAE
                                                if (0xba1c === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                // Lo  [27] HANGUL SYLLABLE MYAEG..HANGUL SYLLABLE MYAEH
                                                if (0xba1d <= code && code <= 0xba37) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xba39) {
                                                // Lo       HANGUL SYLLABLE MEO
                                                if (0xba38 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                if (code < 0xba54) {
                                                    // Lo  [27] HANGUL SYLLABLE MEOG..HANGUL SYLLABLE MEOH
                                                    if (0xba39 <= code && code <= 0xba53) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                                else {
                                                    // Lo       HANGUL SYLLABLE ME
                                                    if (0xba54 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0xba71) {
                                            if (code < 0xba70) {
                                                // Lo  [27] HANGUL SYLLABLE MEG..HANGUL SYLLABLE MEH
                                                if (0xba55 <= code && code <= 0xba6f) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                // Lo       HANGUL SYLLABLE MYEO
                                                if (0xba70 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xba8c) {
                                                // Lo  [27] HANGUL SYLLABLE MYEOG..HANGUL SYLLABLE MYEOH
                                                if (0xba71 <= code && code <= 0xba8b) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                if (code < 0xba8d) {
                                                    // Lo       HANGUL SYLLABLE MYE
                                                    if (0xba8c === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                                else {
                                                    // Lo  [27] HANGUL SYLLABLE MYEG..HANGUL SYLLABLE MYEH
                                                    if (0xba8d <= code && code <= 0xbaa7) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                else {
                                    if (code < 0xbae1) {
                                        if (code < 0xbac4) {
                                            if (code < 0xbaa9) {
                                                // Lo       HANGUL SYLLABLE MO
                                                if (0xbaa8 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                // Lo  [27] HANGUL SYLLABLE MOG..HANGUL SYLLABLE MOH
                                                if (0xbaa9 <= code && code <= 0xbac3) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xbac5) {
                                                // Lo       HANGUL SYLLABLE MWA
                                                if (0xbac4 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                if (code < 0xbae0) {
                                                    // Lo  [27] HANGUL SYLLABLE MWAG..HANGUL SYLLABLE MWAH
                                                    if (0xbac5 <= code && code <= 0xbadf) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                                else {
                                                    // Lo       HANGUL SYLLABLE MWAE
                                                    if (0xbae0 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0xbb18) {
                                            if (code < 0xbafc) {
                                                // Lo  [27] HANGUL SYLLABLE MWAEG..HANGUL SYLLABLE MWAEH
                                                if (0xbae1 <= code && code <= 0xbafb) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                if (code < 0xbafd) {
                                                    // Lo       HANGUL SYLLABLE MOE
                                                    if (0xbafc === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                                else {
                                                    // Lo  [27] HANGUL SYLLABLE MOEG..HANGUL SYLLABLE MOEH
                                                    if (0xbafd <= code && code <= 0xbb17) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xbb19) {
                                                // Lo       HANGUL SYLLABLE MYO
                                                if (0xbb18 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                if (code < 0xbb34) {
                                                    // Lo  [27] HANGUL SYLLABLE MYOG..HANGUL SYLLABLE MYOH
                                                    if (0xbb19 <= code && code <= 0xbb33) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                                else {
                                                    // Lo       HANGUL SYLLABLE MU
                                                    if (0xbb34 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            else {
                                if (code < 0xbbc1) {
                                    if (code < 0xbb88) {
                                        if (code < 0xbb51) {
                                            if (code < 0xbb50) {
                                                // Lo  [27] HANGUL SYLLABLE MUG..HANGUL SYLLABLE MUH
                                                if (0xbb35 <= code && code <= 0xbb4f) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                // Lo       HANGUL SYLLABLE MWEO
                                                if (0xbb50 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xbb6c) {
                                                // Lo  [27] HANGUL SYLLABLE MWEOG..HANGUL SYLLABLE MWEOH
                                                if (0xbb51 <= code && code <= 0xbb6b) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                if (code < 0xbb6d) {
                                                    // Lo       HANGUL SYLLABLE MWE
                                                    if (0xbb6c === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                                else {
                                                    // Lo  [27] HANGUL SYLLABLE MWEG..HANGUL SYLLABLE MWEH
                                                    if (0xbb6d <= code && code <= 0xbb87) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0xbba4) {
                                            if (code < 0xbb89) {
                                                // Lo       HANGUL SYLLABLE MWI
                                                if (0xbb88 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                // Lo  [27] HANGUL SYLLABLE MWIG..HANGUL SYLLABLE MWIH
                                                if (0xbb89 <= code && code <= 0xbba3) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xbba5) {
                                                // Lo       HANGUL SYLLABLE MYU
                                                if (0xbba4 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                if (code < 0xbbc0) {
                                                    // Lo  [27] HANGUL SYLLABLE MYUG..HANGUL SYLLABLE MYUH
                                                    if (0xbba5 <= code && code <= 0xbbbf) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                                else {
                                                    // Lo       HANGUL SYLLABLE MEU
                                                    if (0xbbc0 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                else {
                                    if (code < 0xbc14) {
                                        if (code < 0xbbdd) {
                                            if (code < 0xbbdc) {
                                                // Lo  [27] HANGUL SYLLABLE MEUG..HANGUL SYLLABLE MEUH
                                                if (0xbbc1 <= code && code <= 0xbbdb) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                // Lo       HANGUL SYLLABLE MYI
                                                if (0xbbdc === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xbbf8) {
                                                // Lo  [27] HANGUL SYLLABLE MYIG..HANGUL SYLLABLE MYIH
                                                if (0xbbdd <= code && code <= 0xbbf7) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                if (code < 0xbbf9) {
                                                    // Lo       HANGUL SYLLABLE MI
                                                    if (0xbbf8 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                                else {
                                                    // Lo  [27] HANGUL SYLLABLE MIG..HANGUL SYLLABLE MIH
                                                    if (0xbbf9 <= code && code <= 0xbc13) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0xbc31) {
                                            if (code < 0xbc15) {
                                                // Lo       HANGUL SYLLABLE BA
                                                if (0xbc14 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                if (code < 0xbc30) {
                                                    // Lo  [27] HANGUL SYLLABLE BAG..HANGUL SYLLABLE BAH
                                                    if (0xbc15 <= code && code <= 0xbc2f) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                                else {
                                                    // Lo       HANGUL SYLLABLE BAE
                                                    if (0xbc30 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xbc4c) {
                                                // Lo  [27] HANGUL SYLLABLE BAEG..HANGUL SYLLABLE BAEH
                                                if (0xbc31 <= code && code <= 0xbc4b) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                if (code < 0xbc4d) {
                                                    // Lo       HANGUL SYLLABLE BYA
                                                    if (0xbc4c === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                                else {
                                                    // Lo  [27] HANGUL SYLLABLE BYAG..HANGUL SYLLABLE BYAH
                                                    if (0xbc4d <= code && code <= 0xbc67) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        else {
                            if (code < 0xbd81) {
                                if (code < 0xbcf4) {
                                    if (code < 0xbca1) {
                                        if (code < 0xbc84) {
                                            if (code < 0xbc69) {
                                                // Lo       HANGUL SYLLABLE BYAE
                                                if (0xbc68 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                // Lo  [27] HANGUL SYLLABLE BYAEG..HANGUL SYLLABLE BYAEH
                                                if (0xbc69 <= code && code <= 0xbc83) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xbc85) {
                                                // Lo       HANGUL SYLLABLE BEO
                                                if (0xbc84 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                if (code < 0xbca0) {
                                                    // Lo  [27] HANGUL SYLLABLE BEOG..HANGUL SYLLABLE BEOH
                                                    if (0xbc85 <= code && code <= 0xbc9f) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                                else {
                                                    // Lo       HANGUL SYLLABLE BE
                                                    if (0xbca0 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0xbcbd) {
                                            if (code < 0xbcbc) {
                                                // Lo  [27] HANGUL SYLLABLE BEG..HANGUL SYLLABLE BEH
                                                if (0xbca1 <= code && code <= 0xbcbb) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                // Lo       HANGUL SYLLABLE BYEO
                                                if (0xbcbc === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xbcd8) {
                                                // Lo  [27] HANGUL SYLLABLE BYEOG..HANGUL SYLLABLE BYEOH
                                                if (0xbcbd <= code && code <= 0xbcd7) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                if (code < 0xbcd9) {
                                                    // Lo       HANGUL SYLLABLE BYE
                                                    if (0xbcd8 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                                else {
                                                    // Lo  [27] HANGUL SYLLABLE BYEG..HANGUL SYLLABLE BYEH
                                                    if (0xbcd9 <= code && code <= 0xbcf3) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                else {
                                    if (code < 0xbd2d) {
                                        if (code < 0xbd10) {
                                            if (code < 0xbcf5) {
                                                // Lo       HANGUL SYLLABLE BO
                                                if (0xbcf4 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                // Lo  [27] HANGUL SYLLABLE BOG..HANGUL SYLLABLE BOH
                                                if (0xbcf5 <= code && code <= 0xbd0f) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xbd11) {
                                                // Lo       HANGUL SYLLABLE BWA
                                                if (0xbd10 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                if (code < 0xbd2c) {
                                                    // Lo  [27] HANGUL SYLLABLE BWAG..HANGUL SYLLABLE BWAH
                                                    if (0xbd11 <= code && code <= 0xbd2b) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                                else {
                                                    // Lo       HANGUL SYLLABLE BWAE
                                                    if (0xbd2c === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0xbd64) {
                                            if (code < 0xbd48) {
                                                // Lo  [27] HANGUL SYLLABLE BWAEG..HANGUL SYLLABLE BWAEH
                                                if (0xbd2d <= code && code <= 0xbd47) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                if (code < 0xbd49) {
                                                    // Lo       HANGUL SYLLABLE BOE
                                                    if (0xbd48 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                                else {
                                                    // Lo  [27] HANGUL SYLLABLE BOEG..HANGUL SYLLABLE BOEH
                                                    if (0xbd49 <= code && code <= 0xbd63) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xbd65) {
                                                // Lo       HANGUL SYLLABLE BYO
                                                if (0xbd64 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                if (code < 0xbd80) {
                                                    // Lo  [27] HANGUL SYLLABLE BYOG..HANGUL SYLLABLE BYOH
                                                    if (0xbd65 <= code && code <= 0xbd7f) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                                else {
                                                    // Lo       HANGUL SYLLABLE BU
                                                    if (0xbd80 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            else {
                                if (code < 0xbe0d) {
                                    if (code < 0xbdd4) {
                                        if (code < 0xbd9d) {
                                            if (code < 0xbd9c) {
                                                // Lo  [27] HANGUL SYLLABLE BUG..HANGUL SYLLABLE BUH
                                                if (0xbd81 <= code && code <= 0xbd9b) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                // Lo       HANGUL SYLLABLE BWEO
                                                if (0xbd9c === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xbdb8) {
                                                // Lo  [27] HANGUL SYLLABLE BWEOG..HANGUL SYLLABLE BWEOH
                                                if (0xbd9d <= code && code <= 0xbdb7) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                if (code < 0xbdb9) {
                                                    // Lo       HANGUL SYLLABLE BWE
                                                    if (0xbdb8 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                                else {
                                                    // Lo  [27] HANGUL SYLLABLE BWEG..HANGUL SYLLABLE BWEH
                                                    if (0xbdb9 <= code && code <= 0xbdd3) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0xbdf0) {
                                            if (code < 0xbdd5) {
                                                // Lo       HANGUL SYLLABLE BWI
                                                if (0xbdd4 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                // Lo  [27] HANGUL SYLLABLE BWIG..HANGUL SYLLABLE BWIH
                                                if (0xbdd5 <= code && code <= 0xbdef) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xbdf1) {
                                                // Lo       HANGUL SYLLABLE BYU
                                                if (0xbdf0 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                if (code < 0xbe0c) {
                                                    // Lo  [27] HANGUL SYLLABLE BYUG..HANGUL SYLLABLE BYUH
                                                    if (0xbdf1 <= code && code <= 0xbe0b) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                                else {
                                                    // Lo       HANGUL SYLLABLE BEU
                                                    if (0xbe0c === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                else {
                                    if (code < 0xbe60) {
                                        if (code < 0xbe29) {
                                            if (code < 0xbe28) {
                                                // Lo  [27] HANGUL SYLLABLE BEUG..HANGUL SYLLABLE BEUH
                                                if (0xbe0d <= code && code <= 0xbe27) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                // Lo       HANGUL SYLLABLE BYI
                                                if (0xbe28 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xbe44) {
                                                // Lo  [27] HANGUL SYLLABLE BYIG..HANGUL SYLLABLE BYIH
                                                if (0xbe29 <= code && code <= 0xbe43) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                if (code < 0xbe45) {
                                                    // Lo       HANGUL SYLLABLE BI
                                                    if (0xbe44 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                                else {
                                                    // Lo  [27] HANGUL SYLLABLE BIG..HANGUL SYLLABLE BIH
                                                    if (0xbe45 <= code && code <= 0xbe5f) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0xbe7d) {
                                            if (code < 0xbe61) {
                                                // Lo       HANGUL SYLLABLE BBA
                                                if (0xbe60 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                if (code < 0xbe7c) {
                                                    // Lo  [27] HANGUL SYLLABLE BBAG..HANGUL SYLLABLE BBAH
                                                    if (0xbe61 <= code && code <= 0xbe7b) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                                else {
                                                    // Lo       HANGUL SYLLABLE BBAE
                                                    if (0xbe7c === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xbe98) {
                                                // Lo  [27] HANGUL SYLLABLE BBAEG..HANGUL SYLLABLE BBAEH
                                                if (0xbe7d <= code && code <= 0xbe97) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                if (code < 0xbe99) {
                                                    // Lo       HANGUL SYLLABLE BBYA
                                                    if (0xbe98 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                                else {
                                                    // Lo  [27] HANGUL SYLLABLE BBYAG..HANGUL SYLLABLE BBYAH
                                                    if (0xbe99 <= code && code <= 0xbeb3) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        else {
            if (code < 0xd114) {
                if (code < 0xc7e4) {
                    if (code < 0xc34c) {
                        if (code < 0xc100) {
                            if (code < 0xbfcd) {
                                if (code < 0xbf40) {
                                    if (code < 0xbeed) {
                                        if (code < 0xbed0) {
                                            if (code < 0xbeb5) {
                                                // Lo       HANGUL SYLLABLE BBYAE
                                                if (0xbeb4 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                // Lo  [27] HANGUL SYLLABLE BBYAEG..HANGUL SYLLABLE BBYAEH
                                                if (0xbeb5 <= code && code <= 0xbecf) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xbed1) {
                                                // Lo       HANGUL SYLLABLE BBEO
                                                if (0xbed0 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                if (code < 0xbeec) {
                                                    // Lo  [27] HANGUL SYLLABLE BBEOG..HANGUL SYLLABLE BBEOH
                                                    if (0xbed1 <= code && code <= 0xbeeb) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                                else {
                                                    // Lo       HANGUL SYLLABLE BBE
                                                    if (0xbeec === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0xbf09) {
                                            if (code < 0xbf08) {
                                                // Lo  [27] HANGUL SYLLABLE BBEG..HANGUL SYLLABLE BBEH
                                                if (0xbeed <= code && code <= 0xbf07) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                // Lo       HANGUL SYLLABLE BBYEO
                                                if (0xbf08 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xbf24) {
                                                // Lo  [27] HANGUL SYLLABLE BBYEOG..HANGUL SYLLABLE BBYEOH
                                                if (0xbf09 <= code && code <= 0xbf23) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                if (code < 0xbf25) {
                                                    // Lo       HANGUL SYLLABLE BBYE
                                                    if (0xbf24 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                                else {
                                                    // Lo  [27] HANGUL SYLLABLE BBYEG..HANGUL SYLLABLE BBYEH
                                                    if (0xbf25 <= code && code <= 0xbf3f) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                else {
                                    if (code < 0xbf79) {
                                        if (code < 0xbf5c) {
                                            if (code < 0xbf41) {
                                                // Lo       HANGUL SYLLABLE BBO
                                                if (0xbf40 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                // Lo  [27] HANGUL SYLLABLE BBOG..HANGUL SYLLABLE BBOH
                                                if (0xbf41 <= code && code <= 0xbf5b) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xbf5d) {
                                                // Lo       HANGUL SYLLABLE BBWA
                                                if (0xbf5c === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                if (code < 0xbf78) {
                                                    // Lo  [27] HANGUL SYLLABLE BBWAG..HANGUL SYLLABLE BBWAH
                                                    if (0xbf5d <= code && code <= 0xbf77) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                                else {
                                                    // Lo       HANGUL SYLLABLE BBWAE
                                                    if (0xbf78 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0xbfb0) {
                                            if (code < 0xbf94) {
                                                // Lo  [27] HANGUL SYLLABLE BBWAEG..HANGUL SYLLABLE BBWAEH
                                                if (0xbf79 <= code && code <= 0xbf93) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                if (code < 0xbf95) {
                                                    // Lo       HANGUL SYLLABLE BBOE
                                                    if (0xbf94 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                                else {
                                                    // Lo  [27] HANGUL SYLLABLE BBOEG..HANGUL SYLLABLE BBOEH
                                                    if (0xbf95 <= code && code <= 0xbfaf) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xbfb1) {
                                                // Lo       HANGUL SYLLABLE BBYO
                                                if (0xbfb0 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                if (code < 0xbfcc) {
                                                    // Lo  [27] HANGUL SYLLABLE BBYOG..HANGUL SYLLABLE BBYOH
                                                    if (0xbfb1 <= code && code <= 0xbfcb) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                                else {
                                                    // Lo       HANGUL SYLLABLE BBU
                                                    if (0xbfcc === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            else {
                                if (code < 0xc059) {
                                    if (code < 0xc020) {
                                        if (code < 0xbfe9) {
                                            if (code < 0xbfe8) {
                                                // Lo  [27] HANGUL SYLLABLE BBUG..HANGUL SYLLABLE BBUH
                                                if (0xbfcd <= code && code <= 0xbfe7) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                // Lo       HANGUL SYLLABLE BBWEO
                                                if (0xbfe8 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xc004) {
                                                // Lo  [27] HANGUL SYLLABLE BBWEOG..HANGUL SYLLABLE BBWEOH
                                                if (0xbfe9 <= code && code <= 0xc003) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                if (code < 0xc005) {
                                                    // Lo       HANGUL SYLLABLE BBWE
                                                    if (0xc004 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                                else {
                                                    // Lo  [27] HANGUL SYLLABLE BBWEG..HANGUL SYLLABLE BBWEH
                                                    if (0xc005 <= code && code <= 0xc01f) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0xc03c) {
                                            if (code < 0xc021) {
                                                // Lo       HANGUL SYLLABLE BBWI
                                                if (0xc020 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                // Lo  [27] HANGUL SYLLABLE BBWIG..HANGUL SYLLABLE BBWIH
                                                if (0xc021 <= code && code <= 0xc03b) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xc03d) {
                                                // Lo       HANGUL SYLLABLE BBYU
                                                if (0xc03c === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                if (code < 0xc058) {
                                                    // Lo  [27] HANGUL SYLLABLE BBYUG..HANGUL SYLLABLE BBYUH
                                                    if (0xc03d <= code && code <= 0xc057) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                                else {
                                                    // Lo       HANGUL SYLLABLE BBEU
                                                    if (0xc058 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                else {
                                    if (code < 0xc0ac) {
                                        if (code < 0xc075) {
                                            if (code < 0xc074) {
                                                // Lo  [27] HANGUL SYLLABLE BBEUG..HANGUL SYLLABLE BBEUH
                                                if (0xc059 <= code && code <= 0xc073) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                // Lo       HANGUL SYLLABLE BBYI
                                                if (0xc074 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xc090) {
                                                // Lo  [27] HANGUL SYLLABLE BBYIG..HANGUL SYLLABLE BBYIH
                                                if (0xc075 <= code && code <= 0xc08f) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                if (code < 0xc091) {
                                                    // Lo       HANGUL SYLLABLE BBI
                                                    if (0xc090 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                                else {
                                                    // Lo  [27] HANGUL SYLLABLE BBIG..HANGUL SYLLABLE BBIH
                                                    if (0xc091 <= code && code <= 0xc0ab) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0xc0c9) {
                                            if (code < 0xc0ad) {
                                                // Lo       HANGUL SYLLABLE SA
                                                if (0xc0ac === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                if (code < 0xc0c8) {
                                                    // Lo  [27] HANGUL SYLLABLE SAG..HANGUL SYLLABLE SAH
                                                    if (0xc0ad <= code && code <= 0xc0c7) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                                else {
                                                    // Lo       HANGUL SYLLABLE SAE
                                                    if (0xc0c8 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xc0e4) {
                                                // Lo  [27] HANGUL SYLLABLE SAEG..HANGUL SYLLABLE SAEH
                                                if (0xc0c9 <= code && code <= 0xc0e3) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                if (code < 0xc0e5) {
                                                    // Lo       HANGUL SYLLABLE SYA
                                                    if (0xc0e4 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                                else {
                                                    // Lo  [27] HANGUL SYLLABLE SYAG..HANGUL SYLLABLE SYAH
                                                    if (0xc0e5 <= code && code <= 0xc0ff) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        else {
                            if (code < 0xc219) {
                                if (code < 0xc18c) {
                                    if (code < 0xc139) {
                                        if (code < 0xc11c) {
                                            if (code < 0xc101) {
                                                // Lo       HANGUL SYLLABLE SYAE
                                                if (0xc100 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                // Lo  [27] HANGUL SYLLABLE SYAEG..HANGUL SYLLABLE SYAEH
                                                if (0xc101 <= code && code <= 0xc11b) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xc11d) {
                                                // Lo       HANGUL SYLLABLE SEO
                                                if (0xc11c === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                if (code < 0xc138) {
                                                    // Lo  [27] HANGUL SYLLABLE SEOG..HANGUL SYLLABLE SEOH
                                                    if (0xc11d <= code && code <= 0xc137) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                                else {
                                                    // Lo       HANGUL SYLLABLE SE
                                                    if (0xc138 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0xc155) {
                                            if (code < 0xc154) {
                                                // Lo  [27] HANGUL SYLLABLE SEG..HANGUL SYLLABLE SEH
                                                if (0xc139 <= code && code <= 0xc153) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                // Lo       HANGUL SYLLABLE SYEO
                                                if (0xc154 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xc170) {
                                                // Lo  [27] HANGUL SYLLABLE SYEOG..HANGUL SYLLABLE SYEOH
                                                if (0xc155 <= code && code <= 0xc16f) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                if (code < 0xc171) {
                                                    // Lo       HANGUL SYLLABLE SYE
                                                    if (0xc170 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                                else {
                                                    // Lo  [27] HANGUL SYLLABLE SYEG..HANGUL SYLLABLE SYEH
                                                    if (0xc171 <= code && code <= 0xc18b) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                else {
                                    if (code < 0xc1c5) {
                                        if (code < 0xc1a8) {
                                            if (code < 0xc18d) {
                                                // Lo       HANGUL SYLLABLE SO
                                                if (0xc18c === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                // Lo  [27] HANGUL SYLLABLE SOG..HANGUL SYLLABLE SOH
                                                if (0xc18d <= code && code <= 0xc1a7) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xc1a9) {
                                                // Lo       HANGUL SYLLABLE SWA
                                                if (0xc1a8 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                if (code < 0xc1c4) {
                                                    // Lo  [27] HANGUL SYLLABLE SWAG..HANGUL SYLLABLE SWAH
                                                    if (0xc1a9 <= code && code <= 0xc1c3) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                                else {
                                                    // Lo       HANGUL SYLLABLE SWAE
                                                    if (0xc1c4 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0xc1fc) {
                                            if (code < 0xc1e0) {
                                                // Lo  [27] HANGUL SYLLABLE SWAEG..HANGUL SYLLABLE SWAEH
                                                if (0xc1c5 <= code && code <= 0xc1df) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                if (code < 0xc1e1) {
                                                    // Lo       HANGUL SYLLABLE SOE
                                                    if (0xc1e0 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                                else {
                                                    // Lo  [27] HANGUL SYLLABLE SOEG..HANGUL SYLLABLE SOEH
                                                    if (0xc1e1 <= code && code <= 0xc1fb) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xc1fd) {
                                                // Lo       HANGUL SYLLABLE SYO
                                                if (0xc1fc === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                if (code < 0xc218) {
                                                    // Lo  [27] HANGUL SYLLABLE SYOG..HANGUL SYLLABLE SYOH
                                                    if (0xc1fd <= code && code <= 0xc217) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                                else {
                                                    // Lo       HANGUL SYLLABLE SU
                                                    if (0xc218 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            else {
                                if (code < 0xc2a5) {
                                    if (code < 0xc26c) {
                                        if (code < 0xc235) {
                                            if (code < 0xc234) {
                                                // Lo  [27] HANGUL SYLLABLE SUG..HANGUL SYLLABLE SUH
                                                if (0xc219 <= code && code <= 0xc233) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                // Lo       HANGUL SYLLABLE SWEO
                                                if (0xc234 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xc250) {
                                                // Lo  [27] HANGUL SYLLABLE SWEOG..HANGUL SYLLABLE SWEOH
                                                if (0xc235 <= code && code <= 0xc24f) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                if (code < 0xc251) {
                                                    // Lo       HANGUL SYLLABLE SWE
                                                    if (0xc250 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                                else {
                                                    // Lo  [27] HANGUL SYLLABLE SWEG..HANGUL SYLLABLE SWEH
                                                    if (0xc251 <= code && code <= 0xc26b) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0xc288) {
                                            if (code < 0xc26d) {
                                                // Lo       HANGUL SYLLABLE SWI
                                                if (0xc26c === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                // Lo  [27] HANGUL SYLLABLE SWIG..HANGUL SYLLABLE SWIH
                                                if (0xc26d <= code && code <= 0xc287) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xc289) {
                                                // Lo       HANGUL SYLLABLE SYU
                                                if (0xc288 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                if (code < 0xc2a4) {
                                                    // Lo  [27] HANGUL SYLLABLE SYUG..HANGUL SYLLABLE SYUH
                                                    if (0xc289 <= code && code <= 0xc2a3) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                                else {
                                                    // Lo       HANGUL SYLLABLE SEU
                                                    if (0xc2a4 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                else {
                                    if (code < 0xc2f8) {
                                        if (code < 0xc2c1) {
                                            if (code < 0xc2c0) {
                                                // Lo  [27] HANGUL SYLLABLE SEUG..HANGUL SYLLABLE SEUH
                                                if (0xc2a5 <= code && code <= 0xc2bf) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                // Lo       HANGUL SYLLABLE SYI
                                                if (0xc2c0 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xc2dc) {
                                                // Lo  [27] HANGUL SYLLABLE SYIG..HANGUL SYLLABLE SYIH
                                                if (0xc2c1 <= code && code <= 0xc2db) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                if (code < 0xc2dd) {
                                                    // Lo       HANGUL SYLLABLE SI
                                                    if (0xc2dc === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                                else {
                                                    // Lo  [27] HANGUL SYLLABLE SIG..HANGUL SYLLABLE SIH
                                                    if (0xc2dd <= code && code <= 0xc2f7) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0xc315) {
                                            if (code < 0xc2f9) {
                                                // Lo       HANGUL SYLLABLE SSA
                                                if (0xc2f8 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                if (code < 0xc314) {
                                                    // Lo  [27] HANGUL SYLLABLE SSAG..HANGUL SYLLABLE SSAH
                                                    if (0xc2f9 <= code && code <= 0xc313) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                                else {
                                                    // Lo       HANGUL SYLLABLE SSAE
                                                    if (0xc314 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xc330) {
                                                // Lo  [27] HANGUL SYLLABLE SSAEG..HANGUL SYLLABLE SSAEH
                                                if (0xc315 <= code && code <= 0xc32f) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                if (code < 0xc331) {
                                                    // Lo       HANGUL SYLLABLE SSYA
                                                    if (0xc330 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                                else {
                                                    // Lo  [27] HANGUL SYLLABLE SSYAG..HANGUL SYLLABLE SSYAH
                                                    if (0xc331 <= code && code <= 0xc34b) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                    else {
                        if (code < 0xc598) {
                            if (code < 0xc465) {
                                if (code < 0xc3d8) {
                                    if (code < 0xc385) {
                                        if (code < 0xc368) {
                                            if (code < 0xc34d) {
                                                // Lo       HANGUL SYLLABLE SSYAE
                                                if (0xc34c === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                // Lo  [27] HANGUL SYLLABLE SSYAEG..HANGUL SYLLABLE SSYAEH
                                                if (0xc34d <= code && code <= 0xc367) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xc369) {
                                                // Lo       HANGUL SYLLABLE SSEO
                                                if (0xc368 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                if (code < 0xc384) {
                                                    // Lo  [27] HANGUL SYLLABLE SSEOG..HANGUL SYLLABLE SSEOH
                                                    if (0xc369 <= code && code <= 0xc383) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                                else {
                                                    // Lo       HANGUL SYLLABLE SSE
                                                    if (0xc384 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0xc3a1) {
                                            if (code < 0xc3a0) {
                                                // Lo  [27] HANGUL SYLLABLE SSEG..HANGUL SYLLABLE SSEH
                                                if (0xc385 <= code && code <= 0xc39f) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                // Lo       HANGUL SYLLABLE SSYEO
                                                if (0xc3a0 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xc3bc) {
                                                // Lo  [27] HANGUL SYLLABLE SSYEOG..HANGUL SYLLABLE SSYEOH
                                                if (0xc3a1 <= code && code <= 0xc3bb) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                if (code < 0xc3bd) {
                                                    // Lo       HANGUL SYLLABLE SSYE
                                                    if (0xc3bc === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                                else {
                                                    // Lo  [27] HANGUL SYLLABLE SSYEG..HANGUL SYLLABLE SSYEH
                                                    if (0xc3bd <= code && code <= 0xc3d7) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                else {
                                    if (code < 0xc411) {
                                        if (code < 0xc3f4) {
                                            if (code < 0xc3d9) {
                                                // Lo       HANGUL SYLLABLE SSO
                                                if (0xc3d8 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                // Lo  [27] HANGUL SYLLABLE SSOG..HANGUL SYLLABLE SSOH
                                                if (0xc3d9 <= code && code <= 0xc3f3) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xc3f5) {
                                                // Lo       HANGUL SYLLABLE SSWA
                                                if (0xc3f4 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                if (code < 0xc410) {
                                                    // Lo  [27] HANGUL SYLLABLE SSWAG..HANGUL SYLLABLE SSWAH
                                                    if (0xc3f5 <= code && code <= 0xc40f) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                                else {
                                                    // Lo       HANGUL SYLLABLE SSWAE
                                                    if (0xc410 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0xc448) {
                                            if (code < 0xc42c) {
                                                // Lo  [27] HANGUL SYLLABLE SSWAEG..HANGUL SYLLABLE SSWAEH
                                                if (0xc411 <= code && code <= 0xc42b) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                if (code < 0xc42d) {
                                                    // Lo       HANGUL SYLLABLE SSOE
                                                    if (0xc42c === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                                else {
                                                    // Lo  [27] HANGUL SYLLABLE SSOEG..HANGUL SYLLABLE SSOEH
                                                    if (0xc42d <= code && code <= 0xc447) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xc449) {
                                                // Lo       HANGUL SYLLABLE SSYO
                                                if (0xc448 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                if (code < 0xc464) {
                                                    // Lo  [27] HANGUL SYLLABLE SSYOG..HANGUL SYLLABLE SSYOH
                                                    if (0xc449 <= code && code <= 0xc463) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                                else {
                                                    // Lo       HANGUL SYLLABLE SSU
                                                    if (0xc464 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            else {
                                if (code < 0xc4f1) {
                                    if (code < 0xc4b8) {
                                        if (code < 0xc481) {
                                            if (code < 0xc480) {
                                                // Lo  [27] HANGUL SYLLABLE SSUG..HANGUL SYLLABLE SSUH
                                                if (0xc465 <= code && code <= 0xc47f) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                // Lo       HANGUL SYLLABLE SSWEO
                                                if (0xc480 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xc49c) {
                                                // Lo  [27] HANGUL SYLLABLE SSWEOG..HANGUL SYLLABLE SSWEOH
                                                if (0xc481 <= code && code <= 0xc49b) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                if (code < 0xc49d) {
                                                    // Lo       HANGUL SYLLABLE SSWE
                                                    if (0xc49c === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                                else {
                                                    // Lo  [27] HANGUL SYLLABLE SSWEG..HANGUL SYLLABLE SSWEH
                                                    if (0xc49d <= code && code <= 0xc4b7) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0xc4d4) {
                                            if (code < 0xc4b9) {
                                                // Lo       HANGUL SYLLABLE SSWI
                                                if (0xc4b8 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                // Lo  [27] HANGUL SYLLABLE SSWIG..HANGUL SYLLABLE SSWIH
                                                if (0xc4b9 <= code && code <= 0xc4d3) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xc4d5) {
                                                // Lo       HANGUL SYLLABLE SSYU
                                                if (0xc4d4 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                if (code < 0xc4f0) {
                                                    // Lo  [27] HANGUL SYLLABLE SSYUG..HANGUL SYLLABLE SSYUH
                                                    if (0xc4d5 <= code && code <= 0xc4ef) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                                else {
                                                    // Lo       HANGUL SYLLABLE SSEU
                                                    if (0xc4f0 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                else {
                                    if (code < 0xc544) {
                                        if (code < 0xc50d) {
                                            if (code < 0xc50c) {
                                                // Lo  [27] HANGUL SYLLABLE SSEUG..HANGUL SYLLABLE SSEUH
                                                if (0xc4f1 <= code && code <= 0xc50b) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                // Lo       HANGUL SYLLABLE SSYI
                                                if (0xc50c === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xc528) {
                                                // Lo  [27] HANGUL SYLLABLE SSYIG..HANGUL SYLLABLE SSYIH
                                                if (0xc50d <= code && code <= 0xc527) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                if (code < 0xc529) {
                                                    // Lo       HANGUL SYLLABLE SSI
                                                    if (0xc528 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                                else {
                                                    // Lo  [27] HANGUL SYLLABLE SSIG..HANGUL SYLLABLE SSIH
                                                    if (0xc529 <= code && code <= 0xc543) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0xc561) {
                                            if (code < 0xc545) {
                                                // Lo       HANGUL SYLLABLE A
                                                if (0xc544 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                if (code < 0xc560) {
                                                    // Lo  [27] HANGUL SYLLABLE AG..HANGUL SYLLABLE AH
                                                    if (0xc545 <= code && code <= 0xc55f) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                                else {
                                                    // Lo       HANGUL SYLLABLE AE
                                                    if (0xc560 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xc57c) {
                                                // Lo  [27] HANGUL SYLLABLE AEG..HANGUL SYLLABLE AEH
                                                if (0xc561 <= code && code <= 0xc57b) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                if (code < 0xc57d) {
                                                    // Lo       HANGUL SYLLABLE YA
                                                    if (0xc57c === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                                else {
                                                    // Lo  [27] HANGUL SYLLABLE YAG..HANGUL SYLLABLE YAH
                                                    if (0xc57d <= code && code <= 0xc597) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        else {
                            if (code < 0xc6b1) {
                                if (code < 0xc624) {
                                    if (code < 0xc5d1) {
                                        if (code < 0xc5b4) {
                                            if (code < 0xc599) {
                                                // Lo       HANGUL SYLLABLE YAE
                                                if (0xc598 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                // Lo  [27] HANGUL SYLLABLE YAEG..HANGUL SYLLABLE YAEH
                                                if (0xc599 <= code && code <= 0xc5b3) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xc5b5) {
                                                // Lo       HANGUL SYLLABLE EO
                                                if (0xc5b4 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                if (code < 0xc5d0) {
                                                    // Lo  [27] HANGUL SYLLABLE EOG..HANGUL SYLLABLE EOH
                                                    if (0xc5b5 <= code && code <= 0xc5cf) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                                else {
                                                    // Lo       HANGUL SYLLABLE E
                                                    if (0xc5d0 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0xc5ed) {
                                            if (code < 0xc5ec) {
                                                // Lo  [27] HANGUL SYLLABLE EG..HANGUL SYLLABLE EH
                                                if (0xc5d1 <= code && code <= 0xc5eb) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                // Lo       HANGUL SYLLABLE YEO
                                                if (0xc5ec === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xc608) {
                                                // Lo  [27] HANGUL SYLLABLE YEOG..HANGUL SYLLABLE YEOH
                                                if (0xc5ed <= code && code <= 0xc607) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                if (code < 0xc609) {
                                                    // Lo       HANGUL SYLLABLE YE
                                                    if (0xc608 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                                else {
                                                    // Lo  [27] HANGUL SYLLABLE YEG..HANGUL SYLLABLE YEH
                                                    if (0xc609 <= code && code <= 0xc623) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                else {
                                    if (code < 0xc65d) {
                                        if (code < 0xc640) {
                                            if (code < 0xc625) {
                                                // Lo       HANGUL SYLLABLE O
                                                if (0xc624 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                // Lo  [27] HANGUL SYLLABLE OG..HANGUL SYLLABLE OH
                                                if (0xc625 <= code && code <= 0xc63f) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xc641) {
                                                // Lo       HANGUL SYLLABLE WA
                                                if (0xc640 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                if (code < 0xc65c) {
                                                    // Lo  [27] HANGUL SYLLABLE WAG..HANGUL SYLLABLE WAH
                                                    if (0xc641 <= code && code <= 0xc65b) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                                else {
                                                    // Lo       HANGUL SYLLABLE WAE
                                                    if (0xc65c === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0xc694) {
                                            if (code < 0xc678) {
                                                // Lo  [27] HANGUL SYLLABLE WAEG..HANGUL SYLLABLE WAEH
                                                if (0xc65d <= code && code <= 0xc677) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                if (code < 0xc679) {
                                                    // Lo       HANGUL SYLLABLE OE
                                                    if (0xc678 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                                else {
                                                    // Lo  [27] HANGUL SYLLABLE OEG..HANGUL SYLLABLE OEH
                                                    if (0xc679 <= code && code <= 0xc693) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xc695) {
                                                // Lo       HANGUL SYLLABLE YO
                                                if (0xc694 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                if (code < 0xc6b0) {
                                                    // Lo  [27] HANGUL SYLLABLE YOG..HANGUL SYLLABLE YOH
                                                    if (0xc695 <= code && code <= 0xc6af) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                                else {
                                                    // Lo       HANGUL SYLLABLE U
                                                    if (0xc6b0 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            else {
                                if (code < 0xc73d) {
                                    if (code < 0xc704) {
                                        if (code < 0xc6cd) {
                                            if (code < 0xc6cc) {
                                                // Lo  [27] HANGUL SYLLABLE UG..HANGUL SYLLABLE UH
                                                if (0xc6b1 <= code && code <= 0xc6cb) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                // Lo       HANGUL SYLLABLE WEO
                                                if (0xc6cc === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xc6e8) {
                                                // Lo  [27] HANGUL SYLLABLE WEOG..HANGUL SYLLABLE WEOH
                                                if (0xc6cd <= code && code <= 0xc6e7) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                if (code < 0xc6e9) {
                                                    // Lo       HANGUL SYLLABLE WE
                                                    if (0xc6e8 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                                else {
                                                    // Lo  [27] HANGUL SYLLABLE WEG..HANGUL SYLLABLE WEH
                                                    if (0xc6e9 <= code && code <= 0xc703) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0xc720) {
                                            if (code < 0xc705) {
                                                // Lo       HANGUL SYLLABLE WI
                                                if (0xc704 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                // Lo  [27] HANGUL SYLLABLE WIG..HANGUL SYLLABLE WIH
                                                if (0xc705 <= code && code <= 0xc71f) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xc721) {
                                                // Lo       HANGUL SYLLABLE YU
                                                if (0xc720 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                if (code < 0xc73c) {
                                                    // Lo  [27] HANGUL SYLLABLE YUG..HANGUL SYLLABLE YUH
                                                    if (0xc721 <= code && code <= 0xc73b) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                                else {
                                                    // Lo       HANGUL SYLLABLE EU
                                                    if (0xc73c === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                else {
                                    if (code < 0xc790) {
                                        if (code < 0xc759) {
                                            if (code < 0xc758) {
                                                // Lo  [27] HANGUL SYLLABLE EUG..HANGUL SYLLABLE EUH
                                                if (0xc73d <= code && code <= 0xc757) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                // Lo       HANGUL SYLLABLE YI
                                                if (0xc758 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xc774) {
                                                // Lo  [27] HANGUL SYLLABLE YIG..HANGUL SYLLABLE YIH
                                                if (0xc759 <= code && code <= 0xc773) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                if (code < 0xc775) {
                                                    // Lo       HANGUL SYLLABLE I
                                                    if (0xc774 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                                else {
                                                    // Lo  [27] HANGUL SYLLABLE IG..HANGUL SYLLABLE IH
                                                    if (0xc775 <= code && code <= 0xc78f) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0xc7ad) {
                                            if (code < 0xc791) {
                                                // Lo       HANGUL SYLLABLE JA
                                                if (0xc790 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                if (code < 0xc7ac) {
                                                    // Lo  [27] HANGUL SYLLABLE JAG..HANGUL SYLLABLE JAH
                                                    if (0xc791 <= code && code <= 0xc7ab) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                                else {
                                                    // Lo       HANGUL SYLLABLE JAE
                                                    if (0xc7ac === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xc7c8) {
                                                // Lo  [27] HANGUL SYLLABLE JAEG..HANGUL SYLLABLE JAEH
                                                if (0xc7ad <= code && code <= 0xc7c7) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                if (code < 0xc7c9) {
                                                    // Lo       HANGUL SYLLABLE JYA
                                                    if (0xc7c8 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                                else {
                                                    // Lo  [27] HANGUL SYLLABLE JYAG..HANGUL SYLLABLE JYAH
                                                    if (0xc7c9 <= code && code <= 0xc7e3) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                else {
                    if (code < 0xcc7c) {
                        if (code < 0xca30) {
                            if (code < 0xc8fd) {
                                if (code < 0xc870) {
                                    if (code < 0xc81d) {
                                        if (code < 0xc800) {
                                            if (code < 0xc7e5) {
                                                // Lo       HANGUL SYLLABLE JYAE
                                                if (0xc7e4 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                // Lo  [27] HANGUL SYLLABLE JYAEG..HANGUL SYLLABLE JYAEH
                                                if (0xc7e5 <= code && code <= 0xc7ff) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xc801) {
                                                // Lo       HANGUL SYLLABLE JEO
                                                if (0xc800 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                if (code < 0xc81c) {
                                                    // Lo  [27] HANGUL SYLLABLE JEOG..HANGUL SYLLABLE JEOH
                                                    if (0xc801 <= code && code <= 0xc81b) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                                else {
                                                    // Lo       HANGUL SYLLABLE JE
                                                    if (0xc81c === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0xc839) {
                                            if (code < 0xc838) {
                                                // Lo  [27] HANGUL SYLLABLE JEG..HANGUL SYLLABLE JEH
                                                if (0xc81d <= code && code <= 0xc837) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                // Lo       HANGUL SYLLABLE JYEO
                                                if (0xc838 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xc854) {
                                                // Lo  [27] HANGUL SYLLABLE JYEOG..HANGUL SYLLABLE JYEOH
                                                if (0xc839 <= code && code <= 0xc853) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                if (code < 0xc855) {
                                                    // Lo       HANGUL SYLLABLE JYE
                                                    if (0xc854 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                                else {
                                                    // Lo  [27] HANGUL SYLLABLE JYEG..HANGUL SYLLABLE JYEH
                                                    if (0xc855 <= code && code <= 0xc86f) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                else {
                                    if (code < 0xc8a9) {
                                        if (code < 0xc88c) {
                                            if (code < 0xc871) {
                                                // Lo       HANGUL SYLLABLE JO
                                                if (0xc870 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                // Lo  [27] HANGUL SYLLABLE JOG..HANGUL SYLLABLE JOH
                                                if (0xc871 <= code && code <= 0xc88b) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xc88d) {
                                                // Lo       HANGUL SYLLABLE JWA
                                                if (0xc88c === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                if (code < 0xc8a8) {
                                                    // Lo  [27] HANGUL SYLLABLE JWAG..HANGUL SYLLABLE JWAH
                                                    if (0xc88d <= code && code <= 0xc8a7) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                                else {
                                                    // Lo       HANGUL SYLLABLE JWAE
                                                    if (0xc8a8 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0xc8e0) {
                                            if (code < 0xc8c4) {
                                                // Lo  [27] HANGUL SYLLABLE JWAEG..HANGUL SYLLABLE JWAEH
                                                if (0xc8a9 <= code && code <= 0xc8c3) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                if (code < 0xc8c5) {
                                                    // Lo       HANGUL SYLLABLE JOE
                                                    if (0xc8c4 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                                else {
                                                    // Lo  [27] HANGUL SYLLABLE JOEG..HANGUL SYLLABLE JOEH
                                                    if (0xc8c5 <= code && code <= 0xc8df) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xc8e1) {
                                                // Lo       HANGUL SYLLABLE JYO
                                                if (0xc8e0 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                if (code < 0xc8fc) {
                                                    // Lo  [27] HANGUL SYLLABLE JYOG..HANGUL SYLLABLE JYOH
                                                    if (0xc8e1 <= code && code <= 0xc8fb) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                                else {
                                                    // Lo       HANGUL SYLLABLE JU
                                                    if (0xc8fc === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            else {
                                if (code < 0xc989) {
                                    if (code < 0xc950) {
                                        if (code < 0xc919) {
                                            if (code < 0xc918) {
                                                // Lo  [27] HANGUL SYLLABLE JUG..HANGUL SYLLABLE JUH
                                                if (0xc8fd <= code && code <= 0xc917) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                // Lo       HANGUL SYLLABLE JWEO
                                                if (0xc918 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xc934) {
                                                // Lo  [27] HANGUL SYLLABLE JWEOG..HANGUL SYLLABLE JWEOH
                                                if (0xc919 <= code && code <= 0xc933) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                if (code < 0xc935) {
                                                    // Lo       HANGUL SYLLABLE JWE
                                                    if (0xc934 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                                else {
                                                    // Lo  [27] HANGUL SYLLABLE JWEG..HANGUL SYLLABLE JWEH
                                                    if (0xc935 <= code && code <= 0xc94f) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0xc96c) {
                                            if (code < 0xc951) {
                                                // Lo       HANGUL SYLLABLE JWI
                                                if (0xc950 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                // Lo  [27] HANGUL SYLLABLE JWIG..HANGUL SYLLABLE JWIH
                                                if (0xc951 <= code && code <= 0xc96b) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xc96d) {
                                                // Lo       HANGUL SYLLABLE JYU
                                                if (0xc96c === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                if (code < 0xc988) {
                                                    // Lo  [27] HANGUL SYLLABLE JYUG..HANGUL SYLLABLE JYUH
                                                    if (0xc96d <= code && code <= 0xc987) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                                else {
                                                    // Lo       HANGUL SYLLABLE JEU
                                                    if (0xc988 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                else {
                                    if (code < 0xc9dc) {
                                        if (code < 0xc9a5) {
                                            if (code < 0xc9a4) {
                                                // Lo  [27] HANGUL SYLLABLE JEUG..HANGUL SYLLABLE JEUH
                                                if (0xc989 <= code && code <= 0xc9a3) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                // Lo       HANGUL SYLLABLE JYI
                                                if (0xc9a4 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xc9c0) {
                                                // Lo  [27] HANGUL SYLLABLE JYIG..HANGUL SYLLABLE JYIH
                                                if (0xc9a5 <= code && code <= 0xc9bf) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                if (code < 0xc9c1) {
                                                    // Lo       HANGUL SYLLABLE JI
                                                    if (0xc9c0 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                                else {
                                                    // Lo  [27] HANGUL SYLLABLE JIG..HANGUL SYLLABLE JIH
                                                    if (0xc9c1 <= code && code <= 0xc9db) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0xc9f9) {
                                            if (code < 0xc9dd) {
                                                // Lo       HANGUL SYLLABLE JJA
                                                if (0xc9dc === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                if (code < 0xc9f8) {
                                                    // Lo  [27] HANGUL SYLLABLE JJAG..HANGUL SYLLABLE JJAH
                                                    if (0xc9dd <= code && code <= 0xc9f7) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                                else {
                                                    // Lo       HANGUL SYLLABLE JJAE
                                                    if (0xc9f8 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xca14) {
                                                // Lo  [27] HANGUL SYLLABLE JJAEG..HANGUL SYLLABLE JJAEH
                                                if (0xc9f9 <= code && code <= 0xca13) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                if (code < 0xca15) {
                                                    // Lo       HANGUL SYLLABLE JJYA
                                                    if (0xca14 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                                else {
                                                    // Lo  [27] HANGUL SYLLABLE JJYAG..HANGUL SYLLABLE JJYAH
                                                    if (0xca15 <= code && code <= 0xca2f) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        else {
                            if (code < 0xcb49) {
                                if (code < 0xcabc) {
                                    if (code < 0xca69) {
                                        if (code < 0xca4c) {
                                            if (code < 0xca31) {
                                                // Lo       HANGUL SYLLABLE JJYAE
                                                if (0xca30 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                // Lo  [27] HANGUL SYLLABLE JJYAEG..HANGUL SYLLABLE JJYAEH
                                                if (0xca31 <= code && code <= 0xca4b) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xca4d) {
                                                // Lo       HANGUL SYLLABLE JJEO
                                                if (0xca4c === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                if (code < 0xca68) {
                                                    // Lo  [27] HANGUL SYLLABLE JJEOG..HANGUL SYLLABLE JJEOH
                                                    if (0xca4d <= code && code <= 0xca67) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                                else {
                                                    // Lo       HANGUL SYLLABLE JJE
                                                    if (0xca68 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0xca85) {
                                            if (code < 0xca84) {
                                                // Lo  [27] HANGUL SYLLABLE JJEG..HANGUL SYLLABLE JJEH
                                                if (0xca69 <= code && code <= 0xca83) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                // Lo       HANGUL SYLLABLE JJYEO
                                                if (0xca84 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xcaa0) {
                                                // Lo  [27] HANGUL SYLLABLE JJYEOG..HANGUL SYLLABLE JJYEOH
                                                if (0xca85 <= code && code <= 0xca9f) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                if (code < 0xcaa1) {
                                                    // Lo       HANGUL SYLLABLE JJYE
                                                    if (0xcaa0 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                                else {
                                                    // Lo  [27] HANGUL SYLLABLE JJYEG..HANGUL SYLLABLE JJYEH
                                                    if (0xcaa1 <= code && code <= 0xcabb) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                else {
                                    if (code < 0xcaf5) {
                                        if (code < 0xcad8) {
                                            if (code < 0xcabd) {
                                                // Lo       HANGUL SYLLABLE JJO
                                                if (0xcabc === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                // Lo  [27] HANGUL SYLLABLE JJOG..HANGUL SYLLABLE JJOH
                                                if (0xcabd <= code && code <= 0xcad7) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xcad9) {
                                                // Lo       HANGUL SYLLABLE JJWA
                                                if (0xcad8 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                if (code < 0xcaf4) {
                                                    // Lo  [27] HANGUL SYLLABLE JJWAG..HANGUL SYLLABLE JJWAH
                                                    if (0xcad9 <= code && code <= 0xcaf3) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                                else {
                                                    // Lo       HANGUL SYLLABLE JJWAE
                                                    if (0xcaf4 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0xcb2c) {
                                            if (code < 0xcb10) {
                                                // Lo  [27] HANGUL SYLLABLE JJWAEG..HANGUL SYLLABLE JJWAEH
                                                if (0xcaf5 <= code && code <= 0xcb0f) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                if (code < 0xcb11) {
                                                    // Lo       HANGUL SYLLABLE JJOE
                                                    if (0xcb10 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                                else {
                                                    // Lo  [27] HANGUL SYLLABLE JJOEG..HANGUL SYLLABLE JJOEH
                                                    if (0xcb11 <= code && code <= 0xcb2b) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xcb2d) {
                                                // Lo       HANGUL SYLLABLE JJYO
                                                if (0xcb2c === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                if (code < 0xcb48) {
                                                    // Lo  [27] HANGUL SYLLABLE JJYOG..HANGUL SYLLABLE JJYOH
                                                    if (0xcb2d <= code && code <= 0xcb47) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                                else {
                                                    // Lo       HANGUL SYLLABLE JJU
                                                    if (0xcb48 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            else {
                                if (code < 0xcbd5) {
                                    if (code < 0xcb9c) {
                                        if (code < 0xcb65) {
                                            if (code < 0xcb64) {
                                                // Lo  [27] HANGUL SYLLABLE JJUG..HANGUL SYLLABLE JJUH
                                                if (0xcb49 <= code && code <= 0xcb63) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                // Lo       HANGUL SYLLABLE JJWEO
                                                if (0xcb64 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xcb80) {
                                                // Lo  [27] HANGUL SYLLABLE JJWEOG..HANGUL SYLLABLE JJWEOH
                                                if (0xcb65 <= code && code <= 0xcb7f) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                if (code < 0xcb81) {
                                                    // Lo       HANGUL SYLLABLE JJWE
                                                    if (0xcb80 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                                else {
                                                    // Lo  [27] HANGUL SYLLABLE JJWEG..HANGUL SYLLABLE JJWEH
                                                    if (0xcb81 <= code && code <= 0xcb9b) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0xcbb8) {
                                            if (code < 0xcb9d) {
                                                // Lo       HANGUL SYLLABLE JJWI
                                                if (0xcb9c === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                // Lo  [27] HANGUL SYLLABLE JJWIG..HANGUL SYLLABLE JJWIH
                                                if (0xcb9d <= code && code <= 0xcbb7) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xcbb9) {
                                                // Lo       HANGUL SYLLABLE JJYU
                                                if (0xcbb8 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                if (code < 0xcbd4) {
                                                    // Lo  [27] HANGUL SYLLABLE JJYUG..HANGUL SYLLABLE JJYUH
                                                    if (0xcbb9 <= code && code <= 0xcbd3) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                                else {
                                                    // Lo       HANGUL SYLLABLE JJEU
                                                    if (0xcbd4 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                else {
                                    if (code < 0xcc28) {
                                        if (code < 0xcbf1) {
                                            if (code < 0xcbf0) {
                                                // Lo  [27] HANGUL SYLLABLE JJEUG..HANGUL SYLLABLE JJEUH
                                                if (0xcbd5 <= code && code <= 0xcbef) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                // Lo       HANGUL SYLLABLE JJYI
                                                if (0xcbf0 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xcc0c) {
                                                // Lo  [27] HANGUL SYLLABLE JJYIG..HANGUL SYLLABLE JJYIH
                                                if (0xcbf1 <= code && code <= 0xcc0b) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                if (code < 0xcc0d) {
                                                    // Lo       HANGUL SYLLABLE JJI
                                                    if (0xcc0c === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                                else {
                                                    // Lo  [27] HANGUL SYLLABLE JJIG..HANGUL SYLLABLE JJIH
                                                    if (0xcc0d <= code && code <= 0xcc27) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0xcc45) {
                                            if (code < 0xcc29) {
                                                // Lo       HANGUL SYLLABLE CA
                                                if (0xcc28 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                if (code < 0xcc44) {
                                                    // Lo  [27] HANGUL SYLLABLE CAG..HANGUL SYLLABLE CAH
                                                    if (0xcc29 <= code && code <= 0xcc43) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                                else {
                                                    // Lo       HANGUL SYLLABLE CAE
                                                    if (0xcc44 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xcc60) {
                                                // Lo  [27] HANGUL SYLLABLE CAEG..HANGUL SYLLABLE CAEH
                                                if (0xcc45 <= code && code <= 0xcc5f) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                if (code < 0xcc61) {
                                                    // Lo       HANGUL SYLLABLE CYA
                                                    if (0xcc60 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                                else {
                                                    // Lo  [27] HANGUL SYLLABLE CYAG..HANGUL SYLLABLE CYAH
                                                    if (0xcc61 <= code && code <= 0xcc7b) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                    else {
                        if (code < 0xcec8) {
                            if (code < 0xcd95) {
                                if (code < 0xcd08) {
                                    if (code < 0xccb5) {
                                        if (code < 0xcc98) {
                                            if (code < 0xcc7d) {
                                                // Lo       HANGUL SYLLABLE CYAE
                                                if (0xcc7c === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                // Lo  [27] HANGUL SYLLABLE CYAEG..HANGUL SYLLABLE CYAEH
                                                if (0xcc7d <= code && code <= 0xcc97) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xcc99) {
                                                // Lo       HANGUL SYLLABLE CEO
                                                if (0xcc98 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                if (code < 0xccb4) {
                                                    // Lo  [27] HANGUL SYLLABLE CEOG..HANGUL SYLLABLE CEOH
                                                    if (0xcc99 <= code && code <= 0xccb3) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                                else {
                                                    // Lo       HANGUL SYLLABLE CE
                                                    if (0xccb4 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0xccd1) {
                                            if (code < 0xccd0) {
                                                // Lo  [27] HANGUL SYLLABLE CEG..HANGUL SYLLABLE CEH
                                                if (0xccb5 <= code && code <= 0xcccf) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                // Lo       HANGUL SYLLABLE CYEO
                                                if (0xccd0 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xccec) {
                                                // Lo  [27] HANGUL SYLLABLE CYEOG..HANGUL SYLLABLE CYEOH
                                                if (0xccd1 <= code && code <= 0xcceb) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                if (code < 0xcced) {
                                                    // Lo       HANGUL SYLLABLE CYE
                                                    if (0xccec === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                                else {
                                                    // Lo  [27] HANGUL SYLLABLE CYEG..HANGUL SYLLABLE CYEH
                                                    if (0xcced <= code && code <= 0xcd07) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                else {
                                    if (code < 0xcd41) {
                                        if (code < 0xcd24) {
                                            if (code < 0xcd09) {
                                                // Lo       HANGUL SYLLABLE CO
                                                if (0xcd08 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                // Lo  [27] HANGUL SYLLABLE COG..HANGUL SYLLABLE COH
                                                if (0xcd09 <= code && code <= 0xcd23) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xcd25) {
                                                // Lo       HANGUL SYLLABLE CWA
                                                if (0xcd24 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                if (code < 0xcd40) {
                                                    // Lo  [27] HANGUL SYLLABLE CWAG..HANGUL SYLLABLE CWAH
                                                    if (0xcd25 <= code && code <= 0xcd3f) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                                else {
                                                    // Lo       HANGUL SYLLABLE CWAE
                                                    if (0xcd40 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0xcd78) {
                                            if (code < 0xcd5c) {
                                                // Lo  [27] HANGUL SYLLABLE CWAEG..HANGUL SYLLABLE CWAEH
                                                if (0xcd41 <= code && code <= 0xcd5b) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                if (code < 0xcd5d) {
                                                    // Lo       HANGUL SYLLABLE COE
                                                    if (0xcd5c === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                                else {
                                                    // Lo  [27] HANGUL SYLLABLE COEG..HANGUL SYLLABLE COEH
                                                    if (0xcd5d <= code && code <= 0xcd77) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xcd79) {
                                                // Lo       HANGUL SYLLABLE CYO
                                                if (0xcd78 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                if (code < 0xcd94) {
                                                    // Lo  [27] HANGUL SYLLABLE CYOG..HANGUL SYLLABLE CYOH
                                                    if (0xcd79 <= code && code <= 0xcd93) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                                else {
                                                    // Lo       HANGUL SYLLABLE CU
                                                    if (0xcd94 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            else {
                                if (code < 0xce21) {
                                    if (code < 0xcde8) {
                                        if (code < 0xcdb1) {
                                            if (code < 0xcdb0) {
                                                // Lo  [27] HANGUL SYLLABLE CUG..HANGUL SYLLABLE CUH
                                                if (0xcd95 <= code && code <= 0xcdaf) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                // Lo       HANGUL SYLLABLE CWEO
                                                if (0xcdb0 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xcdcc) {
                                                // Lo  [27] HANGUL SYLLABLE CWEOG..HANGUL SYLLABLE CWEOH
                                                if (0xcdb1 <= code && code <= 0xcdcb) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                if (code < 0xcdcd) {
                                                    // Lo       HANGUL SYLLABLE CWE
                                                    if (0xcdcc === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                                else {
                                                    // Lo  [27] HANGUL SYLLABLE CWEG..HANGUL SYLLABLE CWEH
                                                    if (0xcdcd <= code && code <= 0xcde7) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0xce04) {
                                            if (code < 0xcde9) {
                                                // Lo       HANGUL SYLLABLE CWI
                                                if (0xcde8 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                // Lo  [27] HANGUL SYLLABLE CWIG..HANGUL SYLLABLE CWIH
                                                if (0xcde9 <= code && code <= 0xce03) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xce05) {
                                                // Lo       HANGUL SYLLABLE CYU
                                                if (0xce04 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                if (code < 0xce20) {
                                                    // Lo  [27] HANGUL SYLLABLE CYUG..HANGUL SYLLABLE CYUH
                                                    if (0xce05 <= code && code <= 0xce1f) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                                else {
                                                    // Lo       HANGUL SYLLABLE CEU
                                                    if (0xce20 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                else {
                                    if (code < 0xce74) {
                                        if (code < 0xce3d) {
                                            if (code < 0xce3c) {
                                                // Lo  [27] HANGUL SYLLABLE CEUG..HANGUL SYLLABLE CEUH
                                                if (0xce21 <= code && code <= 0xce3b) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                // Lo       HANGUL SYLLABLE CYI
                                                if (0xce3c === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xce58) {
                                                // Lo  [27] HANGUL SYLLABLE CYIG..HANGUL SYLLABLE CYIH
                                                if (0xce3d <= code && code <= 0xce57) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                if (code < 0xce59) {
                                                    // Lo       HANGUL SYLLABLE CI
                                                    if (0xce58 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                                else {
                                                    // Lo  [27] HANGUL SYLLABLE CIG..HANGUL SYLLABLE CIH
                                                    if (0xce59 <= code && code <= 0xce73) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0xce91) {
                                            if (code < 0xce75) {
                                                // Lo       HANGUL SYLLABLE KA
                                                if (0xce74 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                if (code < 0xce90) {
                                                    // Lo  [27] HANGUL SYLLABLE KAG..HANGUL SYLLABLE KAH
                                                    if (0xce75 <= code && code <= 0xce8f) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                                else {
                                                    // Lo       HANGUL SYLLABLE KAE
                                                    if (0xce90 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xceac) {
                                                // Lo  [27] HANGUL SYLLABLE KAEG..HANGUL SYLLABLE KAEH
                                                if (0xce91 <= code && code <= 0xceab) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                if (code < 0xcead) {
                                                    // Lo       HANGUL SYLLABLE KYA
                                                    if (0xceac === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                                else {
                                                    // Lo  [27] HANGUL SYLLABLE KYAG..HANGUL SYLLABLE KYAH
                                                    if (0xcead <= code && code <= 0xcec7) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        else {
                            if (code < 0xcfe1) {
                                if (code < 0xcf54) {
                                    if (code < 0xcf01) {
                                        if (code < 0xcee4) {
                                            if (code < 0xcec9) {
                                                // Lo       HANGUL SYLLABLE KYAE
                                                if (0xcec8 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                // Lo  [27] HANGUL SYLLABLE KYAEG..HANGUL SYLLABLE KYAEH
                                                if (0xcec9 <= code && code <= 0xcee3) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xcee5) {
                                                // Lo       HANGUL SYLLABLE KEO
                                                if (0xcee4 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                if (code < 0xcf00) {
                                                    // Lo  [27] HANGUL SYLLABLE KEOG..HANGUL SYLLABLE KEOH
                                                    if (0xcee5 <= code && code <= 0xceff) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                                else {
                                                    // Lo       HANGUL SYLLABLE KE
                                                    if (0xcf00 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0xcf1d) {
                                            if (code < 0xcf1c) {
                                                // Lo  [27] HANGUL SYLLABLE KEG..HANGUL SYLLABLE KEH
                                                if (0xcf01 <= code && code <= 0xcf1b) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                // Lo       HANGUL SYLLABLE KYEO
                                                if (0xcf1c === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xcf38) {
                                                // Lo  [27] HANGUL SYLLABLE KYEOG..HANGUL SYLLABLE KYEOH
                                                if (0xcf1d <= code && code <= 0xcf37) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                if (code < 0xcf39) {
                                                    // Lo       HANGUL SYLLABLE KYE
                                                    if (0xcf38 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                                else {
                                                    // Lo  [27] HANGUL SYLLABLE KYEG..HANGUL SYLLABLE KYEH
                                                    if (0xcf39 <= code && code <= 0xcf53) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                else {
                                    if (code < 0xcf8d) {
                                        if (code < 0xcf70) {
                                            if (code < 0xcf55) {
                                                // Lo       HANGUL SYLLABLE KO
                                                if (0xcf54 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                // Lo  [27] HANGUL SYLLABLE KOG..HANGUL SYLLABLE KOH
                                                if (0xcf55 <= code && code <= 0xcf6f) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xcf71) {
                                                // Lo       HANGUL SYLLABLE KWA
                                                if (0xcf70 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                if (code < 0xcf8c) {
                                                    // Lo  [27] HANGUL SYLLABLE KWAG..HANGUL SYLLABLE KWAH
                                                    if (0xcf71 <= code && code <= 0xcf8b) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                                else {
                                                    // Lo       HANGUL SYLLABLE KWAE
                                                    if (0xcf8c === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0xcfc4) {
                                            if (code < 0xcfa8) {
                                                // Lo  [27] HANGUL SYLLABLE KWAEG..HANGUL SYLLABLE KWAEH
                                                if (0xcf8d <= code && code <= 0xcfa7) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                if (code < 0xcfa9) {
                                                    // Lo       HANGUL SYLLABLE KOE
                                                    if (0xcfa8 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                                else {
                                                    // Lo  [27] HANGUL SYLLABLE KOEG..HANGUL SYLLABLE KOEH
                                                    if (0xcfa9 <= code && code <= 0xcfc3) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xcfc5) {
                                                // Lo       HANGUL SYLLABLE KYO
                                                if (0xcfc4 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                if (code < 0xcfe0) {
                                                    // Lo  [27] HANGUL SYLLABLE KYOG..HANGUL SYLLABLE KYOH
                                                    if (0xcfc5 <= code && code <= 0xcfdf) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                                else {
                                                    // Lo       HANGUL SYLLABLE KU
                                                    if (0xcfe0 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            else {
                                if (code < 0xd06d) {
                                    if (code < 0xd034) {
                                        if (code < 0xcffd) {
                                            if (code < 0xcffc) {
                                                // Lo  [27] HANGUL SYLLABLE KUG..HANGUL SYLLABLE KUH
                                                if (0xcfe1 <= code && code <= 0xcffb) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                // Lo       HANGUL SYLLABLE KWEO
                                                if (0xcffc === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xd018) {
                                                // Lo  [27] HANGUL SYLLABLE KWEOG..HANGUL SYLLABLE KWEOH
                                                if (0xcffd <= code && code <= 0xd017) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                if (code < 0xd019) {
                                                    // Lo       HANGUL SYLLABLE KWE
                                                    if (0xd018 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                                else {
                                                    // Lo  [27] HANGUL SYLLABLE KWEG..HANGUL SYLLABLE KWEH
                                                    if (0xd019 <= code && code <= 0xd033) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0xd050) {
                                            if (code < 0xd035) {
                                                // Lo       HANGUL SYLLABLE KWI
                                                if (0xd034 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                // Lo  [27] HANGUL SYLLABLE KWIG..HANGUL SYLLABLE KWIH
                                                if (0xd035 <= code && code <= 0xd04f) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xd051) {
                                                // Lo       HANGUL SYLLABLE KYU
                                                if (0xd050 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                if (code < 0xd06c) {
                                                    // Lo  [27] HANGUL SYLLABLE KYUG..HANGUL SYLLABLE KYUH
                                                    if (0xd051 <= code && code <= 0xd06b) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                                else {
                                                    // Lo       HANGUL SYLLABLE KEU
                                                    if (0xd06c === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                else {
                                    if (code < 0xd0c0) {
                                        if (code < 0xd089) {
                                            if (code < 0xd088) {
                                                // Lo  [27] HANGUL SYLLABLE KEUG..HANGUL SYLLABLE KEUH
                                                if (0xd06d <= code && code <= 0xd087) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                // Lo       HANGUL SYLLABLE KYI
                                                if (0xd088 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xd0a4) {
                                                // Lo  [27] HANGUL SYLLABLE KYIG..HANGUL SYLLABLE KYIH
                                                if (0xd089 <= code && code <= 0xd0a3) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                if (code < 0xd0a5) {
                                                    // Lo       HANGUL SYLLABLE KI
                                                    if (0xd0a4 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                                else {
                                                    // Lo  [27] HANGUL SYLLABLE KIG..HANGUL SYLLABLE KIH
                                                    if (0xd0a5 <= code && code <= 0xd0bf) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0xd0dd) {
                                            if (code < 0xd0c1) {
                                                // Lo       HANGUL SYLLABLE TA
                                                if (0xd0c0 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                if (code < 0xd0dc) {
                                                    // Lo  [27] HANGUL SYLLABLE TAG..HANGUL SYLLABLE TAH
                                                    if (0xd0c1 <= code && code <= 0xd0db) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                                else {
                                                    // Lo       HANGUL SYLLABLE TAE
                                                    if (0xd0dc === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xd0f8) {
                                                // Lo  [27] HANGUL SYLLABLE TAEG..HANGUL SYLLABLE TAEH
                                                if (0xd0dd <= code && code <= 0xd0f7) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                if (code < 0xd0f9) {
                                                    // Lo       HANGUL SYLLABLE TYA
                                                    if (0xd0f8 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                                else {
                                                    // Lo  [27] HANGUL SYLLABLE TYAG..HANGUL SYLLABLE TYAH
                                                    if (0xd0f9 <= code && code <= 0xd113) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            else {
                if (code < 0x1122f) {
                    if (code < 0xd5ac) {
                        if (code < 0xd360) {
                            if (code < 0xd22d) {
                                if (code < 0xd1a0) {
                                    if (code < 0xd14d) {
                                        if (code < 0xd130) {
                                            if (code < 0xd115) {
                                                // Lo       HANGUL SYLLABLE TYAE
                                                if (0xd114 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                // Lo  [27] HANGUL SYLLABLE TYAEG..HANGUL SYLLABLE TYAEH
                                                if (0xd115 <= code && code <= 0xd12f) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xd131) {
                                                // Lo       HANGUL SYLLABLE TEO
                                                if (0xd130 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                if (code < 0xd14c) {
                                                    // Lo  [27] HANGUL SYLLABLE TEOG..HANGUL SYLLABLE TEOH
                                                    if (0xd131 <= code && code <= 0xd14b) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                                else {
                                                    // Lo       HANGUL SYLLABLE TE
                                                    if (0xd14c === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0xd169) {
                                            if (code < 0xd168) {
                                                // Lo  [27] HANGUL SYLLABLE TEG..HANGUL SYLLABLE TEH
                                                if (0xd14d <= code && code <= 0xd167) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                // Lo       HANGUL SYLLABLE TYEO
                                                if (0xd168 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xd184) {
                                                // Lo  [27] HANGUL SYLLABLE TYEOG..HANGUL SYLLABLE TYEOH
                                                if (0xd169 <= code && code <= 0xd183) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                if (code < 0xd185) {
                                                    // Lo       HANGUL SYLLABLE TYE
                                                    if (0xd184 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                                else {
                                                    // Lo  [27] HANGUL SYLLABLE TYEG..HANGUL SYLLABLE TYEH
                                                    if (0xd185 <= code && code <= 0xd19f) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                else {
                                    if (code < 0xd1d9) {
                                        if (code < 0xd1bc) {
                                            if (code < 0xd1a1) {
                                                // Lo       HANGUL SYLLABLE TO
                                                if (0xd1a0 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                // Lo  [27] HANGUL SYLLABLE TOG..HANGUL SYLLABLE TOH
                                                if (0xd1a1 <= code && code <= 0xd1bb) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xd1bd) {
                                                // Lo       HANGUL SYLLABLE TWA
                                                if (0xd1bc === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                if (code < 0xd1d8) {
                                                    // Lo  [27] HANGUL SYLLABLE TWAG..HANGUL SYLLABLE TWAH
                                                    if (0xd1bd <= code && code <= 0xd1d7) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                                else {
                                                    // Lo       HANGUL SYLLABLE TWAE
                                                    if (0xd1d8 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0xd210) {
                                            if (code < 0xd1f4) {
                                                // Lo  [27] HANGUL SYLLABLE TWAEG..HANGUL SYLLABLE TWAEH
                                                if (0xd1d9 <= code && code <= 0xd1f3) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                if (code < 0xd1f5) {
                                                    // Lo       HANGUL SYLLABLE TOE
                                                    if (0xd1f4 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                                else {
                                                    // Lo  [27] HANGUL SYLLABLE TOEG..HANGUL SYLLABLE TOEH
                                                    if (0xd1f5 <= code && code <= 0xd20f) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xd211) {
                                                // Lo       HANGUL SYLLABLE TYO
                                                if (0xd210 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                if (code < 0xd22c) {
                                                    // Lo  [27] HANGUL SYLLABLE TYOG..HANGUL SYLLABLE TYOH
                                                    if (0xd211 <= code && code <= 0xd22b) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                                else {
                                                    // Lo       HANGUL SYLLABLE TU
                                                    if (0xd22c === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            else {
                                if (code < 0xd2b9) {
                                    if (code < 0xd280) {
                                        if (code < 0xd249) {
                                            if (code < 0xd248) {
                                                // Lo  [27] HANGUL SYLLABLE TUG..HANGUL SYLLABLE TUH
                                                if (0xd22d <= code && code <= 0xd247) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                // Lo       HANGUL SYLLABLE TWEO
                                                if (0xd248 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xd264) {
                                                // Lo  [27] HANGUL SYLLABLE TWEOG..HANGUL SYLLABLE TWEOH
                                                if (0xd249 <= code && code <= 0xd263) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                if (code < 0xd265) {
                                                    // Lo       HANGUL SYLLABLE TWE
                                                    if (0xd264 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                                else {
                                                    // Lo  [27] HANGUL SYLLABLE TWEG..HANGUL SYLLABLE TWEH
                                                    if (0xd265 <= code && code <= 0xd27f) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0xd29c) {
                                            if (code < 0xd281) {
                                                // Lo       HANGUL SYLLABLE TWI
                                                if (0xd280 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                // Lo  [27] HANGUL SYLLABLE TWIG..HANGUL SYLLABLE TWIH
                                                if (0xd281 <= code && code <= 0xd29b) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xd29d) {
                                                // Lo       HANGUL SYLLABLE TYU
                                                if (0xd29c === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                if (code < 0xd2b8) {
                                                    // Lo  [27] HANGUL SYLLABLE TYUG..HANGUL SYLLABLE TYUH
                                                    if (0xd29d <= code && code <= 0xd2b7) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                                else {
                                                    // Lo       HANGUL SYLLABLE TEU
                                                    if (0xd2b8 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                else {
                                    if (code < 0xd30c) {
                                        if (code < 0xd2d5) {
                                            if (code < 0xd2d4) {
                                                // Lo  [27] HANGUL SYLLABLE TEUG..HANGUL SYLLABLE TEUH
                                                if (0xd2b9 <= code && code <= 0xd2d3) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                // Lo       HANGUL SYLLABLE TYI
                                                if (0xd2d4 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xd2f0) {
                                                // Lo  [27] HANGUL SYLLABLE TYIG..HANGUL SYLLABLE TYIH
                                                if (0xd2d5 <= code && code <= 0xd2ef) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                if (code < 0xd2f1) {
                                                    // Lo       HANGUL SYLLABLE TI
                                                    if (0xd2f0 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                                else {
                                                    // Lo  [27] HANGUL SYLLABLE TIG..HANGUL SYLLABLE TIH
                                                    if (0xd2f1 <= code && code <= 0xd30b) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0xd329) {
                                            if (code < 0xd30d) {
                                                // Lo       HANGUL SYLLABLE PA
                                                if (0xd30c === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                if (code < 0xd328) {
                                                    // Lo  [27] HANGUL SYLLABLE PAG..HANGUL SYLLABLE PAH
                                                    if (0xd30d <= code && code <= 0xd327) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                                else {
                                                    // Lo       HANGUL SYLLABLE PAE
                                                    if (0xd328 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xd344) {
                                                // Lo  [27] HANGUL SYLLABLE PAEG..HANGUL SYLLABLE PAEH
                                                if (0xd329 <= code && code <= 0xd343) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                if (code < 0xd345) {
                                                    // Lo       HANGUL SYLLABLE PYA
                                                    if (0xd344 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                                else {
                                                    // Lo  [27] HANGUL SYLLABLE PYAG..HANGUL SYLLABLE PYAH
                                                    if (0xd345 <= code && code <= 0xd35f) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        else {
                            if (code < 0xd479) {
                                if (code < 0xd3ec) {
                                    if (code < 0xd399) {
                                        if (code < 0xd37c) {
                                            if (code < 0xd361) {
                                                // Lo       HANGUL SYLLABLE PYAE
                                                if (0xd360 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                // Lo  [27] HANGUL SYLLABLE PYAEG..HANGUL SYLLABLE PYAEH
                                                if (0xd361 <= code && code <= 0xd37b) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xd37d) {
                                                // Lo       HANGUL SYLLABLE PEO
                                                if (0xd37c === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                if (code < 0xd398) {
                                                    // Lo  [27] HANGUL SYLLABLE PEOG..HANGUL SYLLABLE PEOH
                                                    if (0xd37d <= code && code <= 0xd397) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                                else {
                                                    // Lo       HANGUL SYLLABLE PE
                                                    if (0xd398 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0xd3b5) {
                                            if (code < 0xd3b4) {
                                                // Lo  [27] HANGUL SYLLABLE PEG..HANGUL SYLLABLE PEH
                                                if (0xd399 <= code && code <= 0xd3b3) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                // Lo       HANGUL SYLLABLE PYEO
                                                if (0xd3b4 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xd3d0) {
                                                // Lo  [27] HANGUL SYLLABLE PYEOG..HANGUL SYLLABLE PYEOH
                                                if (0xd3b5 <= code && code <= 0xd3cf) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                if (code < 0xd3d1) {
                                                    // Lo       HANGUL SYLLABLE PYE
                                                    if (0xd3d0 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                                else {
                                                    // Lo  [27] HANGUL SYLLABLE PYEG..HANGUL SYLLABLE PYEH
                                                    if (0xd3d1 <= code && code <= 0xd3eb) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                else {
                                    if (code < 0xd425) {
                                        if (code < 0xd408) {
                                            if (code < 0xd3ed) {
                                                // Lo       HANGUL SYLLABLE PO
                                                if (0xd3ec === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                // Lo  [27] HANGUL SYLLABLE POG..HANGUL SYLLABLE POH
                                                if (0xd3ed <= code && code <= 0xd407) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xd409) {
                                                // Lo       HANGUL SYLLABLE PWA
                                                if (0xd408 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                if (code < 0xd424) {
                                                    // Lo  [27] HANGUL SYLLABLE PWAG..HANGUL SYLLABLE PWAH
                                                    if (0xd409 <= code && code <= 0xd423) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                                else {
                                                    // Lo       HANGUL SYLLABLE PWAE
                                                    if (0xd424 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0xd45c) {
                                            if (code < 0xd440) {
                                                // Lo  [27] HANGUL SYLLABLE PWAEG..HANGUL SYLLABLE PWAEH
                                                if (0xd425 <= code && code <= 0xd43f) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                if (code < 0xd441) {
                                                    // Lo       HANGUL SYLLABLE POE
                                                    if (0xd440 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                                else {
                                                    // Lo  [27] HANGUL SYLLABLE POEG..HANGUL SYLLABLE POEH
                                                    if (0xd441 <= code && code <= 0xd45b) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xd45d) {
                                                // Lo       HANGUL SYLLABLE PYO
                                                if (0xd45c === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                if (code < 0xd478) {
                                                    // Lo  [27] HANGUL SYLLABLE PYOG..HANGUL SYLLABLE PYOH
                                                    if (0xd45d <= code && code <= 0xd477) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                                else {
                                                    // Lo       HANGUL SYLLABLE PU
                                                    if (0xd478 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            else {
                                if (code < 0xd505) {
                                    if (code < 0xd4cc) {
                                        if (code < 0xd495) {
                                            if (code < 0xd494) {
                                                // Lo  [27] HANGUL SYLLABLE PUG..HANGUL SYLLABLE PUH
                                                if (0xd479 <= code && code <= 0xd493) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                // Lo       HANGUL SYLLABLE PWEO
                                                if (0xd494 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xd4b0) {
                                                // Lo  [27] HANGUL SYLLABLE PWEOG..HANGUL SYLLABLE PWEOH
                                                if (0xd495 <= code && code <= 0xd4af) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                if (code < 0xd4b1) {
                                                    // Lo       HANGUL SYLLABLE PWE
                                                    if (0xd4b0 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                                else {
                                                    // Lo  [27] HANGUL SYLLABLE PWEG..HANGUL SYLLABLE PWEH
                                                    if (0xd4b1 <= code && code <= 0xd4cb) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0xd4e8) {
                                            if (code < 0xd4cd) {
                                                // Lo       HANGUL SYLLABLE PWI
                                                if (0xd4cc === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                // Lo  [27] HANGUL SYLLABLE PWIG..HANGUL SYLLABLE PWIH
                                                if (0xd4cd <= code && code <= 0xd4e7) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xd4e9) {
                                                // Lo       HANGUL SYLLABLE PYU
                                                if (0xd4e8 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                if (code < 0xd504) {
                                                    // Lo  [27] HANGUL SYLLABLE PYUG..HANGUL SYLLABLE PYUH
                                                    if (0xd4e9 <= code && code <= 0xd503) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                                else {
                                                    // Lo       HANGUL SYLLABLE PEU
                                                    if (0xd504 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                else {
                                    if (code < 0xd558) {
                                        if (code < 0xd521) {
                                            if (code < 0xd520) {
                                                // Lo  [27] HANGUL SYLLABLE PEUG..HANGUL SYLLABLE PEUH
                                                if (0xd505 <= code && code <= 0xd51f) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                // Lo       HANGUL SYLLABLE PYI
                                                if (0xd520 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xd53c) {
                                                // Lo  [27] HANGUL SYLLABLE PYIG..HANGUL SYLLABLE PYIH
                                                if (0xd521 <= code && code <= 0xd53b) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                if (code < 0xd53d) {
                                                    // Lo       HANGUL SYLLABLE PI
                                                    if (0xd53c === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                                else {
                                                    // Lo  [27] HANGUL SYLLABLE PIG..HANGUL SYLLABLE PIH
                                                    if (0xd53d <= code && code <= 0xd557) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0xd575) {
                                            if (code < 0xd559) {
                                                // Lo       HANGUL SYLLABLE HA
                                                if (0xd558 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                if (code < 0xd574) {
                                                    // Lo  [27] HANGUL SYLLABLE HAG..HANGUL SYLLABLE HAH
                                                    if (0xd559 <= code && code <= 0xd573) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                                else {
                                                    // Lo       HANGUL SYLLABLE HAE
                                                    if (0xd574 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xd590) {
                                                // Lo  [27] HANGUL SYLLABLE HAEG..HANGUL SYLLABLE HAEH
                                                if (0xd575 <= code && code <= 0xd58f) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                if (code < 0xd591) {
                                                    // Lo       HANGUL SYLLABLE HYA
                                                    if (0xd590 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                                else {
                                                    // Lo  [27] HANGUL SYLLABLE HYAG..HANGUL SYLLABLE HYAH
                                                    if (0xd591 <= code && code <= 0xd5ab) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                    else {
                        if (code < 0xff9e) {
                            if (code < 0xd6c5) {
                                if (code < 0xd638) {
                                    if (code < 0xd5e5) {
                                        if (code < 0xd5c8) {
                                            if (code < 0xd5ad) {
                                                // Lo       HANGUL SYLLABLE HYAE
                                                if (0xd5ac === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                // Lo  [27] HANGUL SYLLABLE HYAEG..HANGUL SYLLABLE HYAEH
                                                if (0xd5ad <= code && code <= 0xd5c7) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xd5c9) {
                                                // Lo       HANGUL SYLLABLE HEO
                                                if (0xd5c8 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                if (code < 0xd5e4) {
                                                    // Lo  [27] HANGUL SYLLABLE HEOG..HANGUL SYLLABLE HEOH
                                                    if (0xd5c9 <= code && code <= 0xd5e3) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                                else {
                                                    // Lo       HANGUL SYLLABLE HE
                                                    if (0xd5e4 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0xd601) {
                                            if (code < 0xd600) {
                                                // Lo  [27] HANGUL SYLLABLE HEG..HANGUL SYLLABLE HEH
                                                if (0xd5e5 <= code && code <= 0xd5ff) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                // Lo       HANGUL SYLLABLE HYEO
                                                if (0xd600 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xd61c) {
                                                // Lo  [27] HANGUL SYLLABLE HYEOG..HANGUL SYLLABLE HYEOH
                                                if (0xd601 <= code && code <= 0xd61b) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                if (code < 0xd61d) {
                                                    // Lo       HANGUL SYLLABLE HYE
                                                    if (0xd61c === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                                else {
                                                    // Lo  [27] HANGUL SYLLABLE HYEG..HANGUL SYLLABLE HYEH
                                                    if (0xd61d <= code && code <= 0xd637) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                else {
                                    if (code < 0xd671) {
                                        if (code < 0xd654) {
                                            if (code < 0xd639) {
                                                // Lo       HANGUL SYLLABLE HO
                                                if (0xd638 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                // Lo  [27] HANGUL SYLLABLE HOG..HANGUL SYLLABLE HOH
                                                if (0xd639 <= code && code <= 0xd653) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xd655) {
                                                // Lo       HANGUL SYLLABLE HWA
                                                if (0xd654 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                if (code < 0xd670) {
                                                    // Lo  [27] HANGUL SYLLABLE HWAG..HANGUL SYLLABLE HWAH
                                                    if (0xd655 <= code && code <= 0xd66f) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                                else {
                                                    // Lo       HANGUL SYLLABLE HWAE
                                                    if (0xd670 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0xd6a8) {
                                            if (code < 0xd68c) {
                                                // Lo  [27] HANGUL SYLLABLE HWAEG..HANGUL SYLLABLE HWAEH
                                                if (0xd671 <= code && code <= 0xd68b) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                if (code < 0xd68d) {
                                                    // Lo       HANGUL SYLLABLE HOE
                                                    if (0xd68c === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                                else {
                                                    // Lo  [27] HANGUL SYLLABLE HOEG..HANGUL SYLLABLE HOEH
                                                    if (0xd68d <= code && code <= 0xd6a7) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xd6a9) {
                                                // Lo       HANGUL SYLLABLE HYO
                                                if (0xd6a8 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                if (code < 0xd6c4) {
                                                    // Lo  [27] HANGUL SYLLABLE HYOG..HANGUL SYLLABLE HYOH
                                                    if (0xd6a9 <= code && code <= 0xd6c3) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                                else {
                                                    // Lo       HANGUL SYLLABLE HU
                                                    if (0xd6c4 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            else {
                                if (code < 0xd751) {
                                    if (code < 0xd718) {
                                        if (code < 0xd6e1) {
                                            if (code < 0xd6e0) {
                                                // Lo  [27] HANGUL SYLLABLE HUG..HANGUL SYLLABLE HUH
                                                if (0xd6c5 <= code && code <= 0xd6df) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                // Lo       HANGUL SYLLABLE HWEO
                                                if (0xd6e0 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xd6fc) {
                                                // Lo  [27] HANGUL SYLLABLE HWEOG..HANGUL SYLLABLE HWEOH
                                                if (0xd6e1 <= code && code <= 0xd6fb) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                if (code < 0xd6fd) {
                                                    // Lo       HANGUL SYLLABLE HWE
                                                    if (0xd6fc === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                                else {
                                                    // Lo  [27] HANGUL SYLLABLE HWEG..HANGUL SYLLABLE HWEH
                                                    if (0xd6fd <= code && code <= 0xd717) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0xd734) {
                                            if (code < 0xd719) {
                                                // Lo       HANGUL SYLLABLE HWI
                                                if (0xd718 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                // Lo  [27] HANGUL SYLLABLE HWIG..HANGUL SYLLABLE HWIH
                                                if (0xd719 <= code && code <= 0xd733) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xd735) {
                                                // Lo       HANGUL SYLLABLE HYU
                                                if (0xd734 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                            else {
                                                if (code < 0xd750) {
                                                    // Lo  [27] HANGUL SYLLABLE HYUG..HANGUL SYLLABLE HYUH
                                                    if (0xd735 <= code && code <= 0xd74f) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                                else {
                                                    // Lo       HANGUL SYLLABLE HEU
                                                    if (0xd750 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                else {
                                    if (code < 0xd7b0) {
                                        if (code < 0xd76d) {
                                            if (code < 0xd76c) {
                                                // Lo  [27] HANGUL SYLLABLE HEUG..HANGUL SYLLABLE HEUH
                                                if (0xd751 <= code && code <= 0xd76b) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                // Lo       HANGUL SYLLABLE HYI
                                                if (0xd76c === code) {
                                                    return boundaries_1.CLUSTER_BREAK.LV;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xd788) {
                                                // Lo  [27] HANGUL SYLLABLE HYIG..HANGUL SYLLABLE HYIH
                                                if (0xd76d <= code && code <= 0xd787) {
                                                    return boundaries_1.CLUSTER_BREAK.LVT;
                                                }
                                            }
                                            else {
                                                if (code < 0xd789) {
                                                    // Lo       HANGUL SYLLABLE HI
                                                    if (0xd788 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.LV;
                                                    }
                                                }
                                                else {
                                                    // Lo  [27] HANGUL SYLLABLE HIG..HANGUL SYLLABLE HIH
                                                    if (0xd789 <= code && code <= 0xd7a3) {
                                                        return boundaries_1.CLUSTER_BREAK.LVT;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0xfe00) {
                                            if (code < 0xd7cb) {
                                                // Lo  [23] HANGUL JUNGSEONG O-YEO..HANGUL JUNGSEONG ARAEA-E
                                                if (0xd7b0 <= code && code <= 0xd7c6) {
                                                    return boundaries_1.CLUSTER_BREAK.V;
                                                }
                                            }
                                            else {
                                                if (code < 0xfb1e) {
                                                    // Lo  [49] HANGUL JONGSEONG NIEUN-RIEUL..HANGUL JONGSEONG PHIEUPH-THIEUTH
                                                    if (0xd7cb <= code && code <= 0xd7fb) {
                                                        return boundaries_1.CLUSTER_BREAK.T;
                                                    }
                                                }
                                                else {
                                                    // Mn       HEBREW POINT JUDEO-SPANISH VARIKA
                                                    if (0xfb1e === code) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xfe20) {
                                                // Mn  [16] VARIATION SELECTOR-1..VARIATION SELECTOR-16
                                                if (0xfe00 <= code && code <= 0xfe0f) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                if (code < 0xfeff) {
                                                    // Mn  [16] COMBINING LIGATURE LEFT HALF..COMBINING CYRILLIC TITLO RIGHT HALF
                                                    if (0xfe20 <= code && code <= 0xfe2f) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                                else {
                                                    // Cf       ZERO WIDTH NO-BREAK SPACE
                                                    if (0xfeff === code) {
                                                        return boundaries_1.CLUSTER_BREAK.CONTROL;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        else {
                            if (code < 0x110b3) {
                                if (code < 0x10ae5) {
                                    if (code < 0x10a01) {
                                        if (code < 0x101fd) {
                                            if (code < 0xfff0) {
                                                // Lm   [2] HALFWIDTH KATAKANA VOICED SOUND MARK..HALFWIDTH KATAKANA SEMI-VOICED SOUND MARK
                                                if (0xff9e <= code && code <= 0xff9f) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                // Cn   [9] <reserved-FFF0>..<reserved-FFF8>
                                                // Cf   [3] INTERLINEAR ANNOTATION ANCHOR..INTERLINEAR ANNOTATION TERMINATOR
                                                if (0xfff0 <= code && code <= 0xfffb) {
                                                    return boundaries_1.CLUSTER_BREAK.CONTROL;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0x102e0) {
                                                // Mn       PHAISTOS DISC SIGN COMBINING OBLIQUE STROKE
                                                if (0x101fd === code) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                if (code < 0x10376) {
                                                    // Mn       COPTIC EPACT THOUSANDS MARK
                                                    if (0x102e0 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                                else {
                                                    // Mn   [5] COMBINING OLD PERMIC LETTER AN..COMBINING OLD PERMIC LETTER SII
                                                    if (0x10376 <= code && code <= 0x1037a) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0x10a0c) {
                                            if (code < 0x10a05) {
                                                // Mn   [3] KHAROSHTHI VOWEL SIGN I..KHAROSHTHI VOWEL SIGN VOCALIC R
                                                if (0x10a01 <= code && code <= 0x10a03) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                // Mn   [2] KHAROSHTHI VOWEL SIGN E..KHAROSHTHI VOWEL SIGN O
                                                if (0x10a05 <= code && code <= 0x10a06) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0x10a38) {
                                                // Mn   [4] KHAROSHTHI VOWEL LENGTH MARK..KHAROSHTHI SIGN VISARGA
                                                if (0x10a0c <= code && code <= 0x10a0f) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                if (code < 0x10a3f) {
                                                    // Mn   [3] KHAROSHTHI SIGN BAR ABOVE..KHAROSHTHI SIGN DOT BELOW
                                                    if (0x10a38 <= code && code <= 0x10a3a) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                                else {
                                                    // Mn       KHAROSHTHI VIRAMA
                                                    if (0x10a3f === code) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                else {
                                    if (code < 0x11001) {
                                        if (code < 0x10eab) {
                                            if (code < 0x10d24) {
                                                // Mn   [2] MANICHAEAN ABBREVIATION MARK ABOVE..MANICHAEAN ABBREVIATION MARK BELOW
                                                if (0x10ae5 <= code && code <= 0x10ae6) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                // Mn   [4] HANIFI ROHINGYA SIGN HARBAHAY..HANIFI ROHINGYA SIGN TASSI
                                                if (0x10d24 <= code && code <= 0x10d27) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0x10f46) {
                                                // Mn   [2] YEZIDI COMBINING HAMZA MARK..YEZIDI COMBINING MADDA MARK
                                                if (0x10eab <= code && code <= 0x10eac) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                if (code < 0x11000) {
                                                    // Mn  [11] SOGDIAN COMBINING DOT BELOW..SOGDIAN COMBINING STROKE BELOW
                                                    if (0x10f46 <= code && code <= 0x10f50) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                                else {
                                                    // Mc       BRAHMI SIGN CANDRABINDU
                                                    if (0x11000 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0x1107f) {
                                            if (code < 0x11002) {
                                                // Mn       BRAHMI SIGN ANUSVARA
                                                if (0x11001 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                if (code < 0x11038) {
                                                    // Mc       BRAHMI SIGN VISARGA
                                                    if (0x11002 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                    }
                                                }
                                                else {
                                                    // Mn  [15] BRAHMI VOWEL SIGN AA..BRAHMI VIRAMA
                                                    if (0x11038 <= code && code <= 0x11046) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0x11082) {
                                                // Mn   [3] BRAHMI NUMBER JOINER..KAITHI SIGN ANUSVARA
                                                if (0x1107f <= code && code <= 0x11081) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                if (code < 0x110b0) {
                                                    // Mc       KAITHI SIGN VISARGA
                                                    if (0x11082 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                    }
                                                }
                                                else {
                                                    // Mc   [3] KAITHI VOWEL SIGN AA..KAITHI VOWEL SIGN II
                                                    if (0x110b0 <= code && code <= 0x110b2) {
                                                        return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            else {
                                if (code < 0x11173) {
                                    if (code < 0x11100) {
                                        if (code < 0x110b9) {
                                            if (code < 0x110b7) {
                                                // Mn   [4] KAITHI VOWEL SIGN U..KAITHI VOWEL SIGN AI
                                                if (0x110b3 <= code && code <= 0x110b6) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                // Mc   [2] KAITHI VOWEL SIGN O..KAITHI VOWEL SIGN AU
                                                if (0x110b7 <= code && code <= 0x110b8) {
                                                    return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0x110bd) {
                                                // Mn   [2] KAITHI SIGN VIRAMA..KAITHI SIGN NUKTA
                                                if (0x110b9 <= code && code <= 0x110ba) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                // Cf       KAITHI NUMBER SIGN
                                                if (0x110bd === code) {
                                                    return boundaries_1.CLUSTER_BREAK.PREPEND;
                                                }
                                                // Cf       KAITHI NUMBER SIGN ABOVE
                                                if (0x110cd === code) {
                                                    return boundaries_1.CLUSTER_BREAK.PREPEND;
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0x1112c) {
                                            if (code < 0x11127) {
                                                // Mn   [3] CHAKMA SIGN CANDRABINDU..CHAKMA SIGN VISARGA
                                                if (0x11100 <= code && code <= 0x11102) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                // Mn   [5] CHAKMA VOWEL SIGN A..CHAKMA VOWEL SIGN UU
                                                if (0x11127 <= code && code <= 0x1112b) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0x1112d) {
                                                // Mc       CHAKMA VOWEL SIGN E
                                                if (0x1112c === code) {
                                                    return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                }
                                            }
                                            else {
                                                if (code < 0x11145) {
                                                    // Mn   [8] CHAKMA VOWEL SIGN AI..CHAKMA MAAYYAA
                                                    if (0x1112d <= code && code <= 0x11134) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                                else {
                                                    // Mc   [2] CHAKMA VOWEL SIGN AA..CHAKMA VOWEL SIGN EI
                                                    if (0x11145 <= code && code <= 0x11146) {
                                                        return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                else {
                                    if (code < 0x111bf) {
                                        if (code < 0x11182) {
                                            if (code < 0x11180) {
                                                // Mn       MAHAJANI SIGN NUKTA
                                                if (0x11173 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                // Mn   [2] SHARADA SIGN CANDRABINDU..SHARADA SIGN ANUSVARA
                                                if (0x11180 <= code && code <= 0x11181) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0x111b3) {
                                                // Mc       SHARADA SIGN VISARGA
                                                if (0x11182 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                }
                                            }
                                            else {
                                                if (code < 0x111b6) {
                                                    // Mc   [3] SHARADA VOWEL SIGN AA..SHARADA VOWEL SIGN II
                                                    if (0x111b3 <= code && code <= 0x111b5) {
                                                        return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                    }
                                                }
                                                else {
                                                    // Mn   [9] SHARADA VOWEL SIGN U..SHARADA VOWEL SIGN O
                                                    if (0x111b6 <= code && code <= 0x111be) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0x111ce) {
                                            if (code < 0x111c2) {
                                                // Mc   [2] SHARADA VOWEL SIGN AU..SHARADA SIGN VIRAMA
                                                if (0x111bf <= code && code <= 0x111c0) {
                                                    return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                }
                                            }
                                            else {
                                                if (code < 0x111c9) {
                                                    // Lo   [2] SHARADA SIGN JIHVAMULIYA..SHARADA SIGN UPADHMANIYA
                                                    if (0x111c2 <= code && code <= 0x111c3) {
                                                        return boundaries_1.CLUSTER_BREAK.PREPEND;
                                                    }
                                                }
                                                else {
                                                    // Mn   [4] SHARADA SANDHI MARK..SHARADA EXTRA SHORT VOWEL MARK
                                                    if (0x111c9 <= code && code <= 0x111cc) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0x111cf) {
                                                // Mc       SHARADA VOWEL SIGN PRISHTHAMATRA E
                                                if (0x111ce === code) {
                                                    return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                }
                                            }
                                            else {
                                                if (code < 0x1122c) {
                                                    // Mn       SHARADA SIGN INVERTED CANDRABINDU
                                                    if (0x111cf === code) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                                else {
                                                    // Mc   [3] KHOJKI VOWEL SIGN AA..KHOJKI VOWEL SIGN II
                                                    if (0x1122c <= code && code <= 0x1122e) {
                                                        return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                else {
                    if (code < 0x119dc) {
                        if (code < 0x115b2) {
                            if (code < 0x11370) {
                                if (code < 0x11302) {
                                    if (code < 0x1123e) {
                                        if (code < 0x11234) {
                                            if (code < 0x11232) {
                                                // Mn   [3] KHOJKI VOWEL SIGN U..KHOJKI VOWEL SIGN AI
                                                if (0x1122f <= code && code <= 0x11231) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                // Mc   [2] KHOJKI VOWEL SIGN O..KHOJKI VOWEL SIGN AU
                                                if (0x11232 <= code && code <= 0x11233) {
                                                    return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0x11235) {
                                                // Mn       KHOJKI SIGN ANUSVARA
                                                if (0x11234 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                if (code < 0x11236) {
                                                    // Mc       KHOJKI SIGN VIRAMA
                                                    if (0x11235 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                    }
                                                }
                                                else {
                                                    // Mn   [2] KHOJKI SIGN NUKTA..KHOJKI SIGN SHADDA
                                                    if (0x11236 <= code && code <= 0x11237) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0x112e0) {
                                            // Mn       KHOJKI SIGN SUKUN
                                            if (0x1123e === code) {
                                                return boundaries_1.CLUSTER_BREAK.EXTEND;
                                            }
                                            // Mn       KHUDAWADI SIGN ANUSVARA
                                            if (0x112df === code) {
                                                return boundaries_1.CLUSTER_BREAK.EXTEND;
                                            }
                                        }
                                        else {
                                            if (code < 0x112e3) {
                                                // Mc   [3] KHUDAWADI VOWEL SIGN AA..KHUDAWADI VOWEL SIGN II
                                                if (0x112e0 <= code && code <= 0x112e2) {
                                                    return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                }
                                            }
                                            else {
                                                if (code < 0x11300) {
                                                    // Mn   [8] KHUDAWADI VOWEL SIGN U..KHUDAWADI SIGN VIRAMA
                                                    if (0x112e3 <= code && code <= 0x112ea) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                                else {
                                                    // Mn   [2] GRANTHA SIGN COMBINING ANUSVARA ABOVE..GRANTHA SIGN CANDRABINDU
                                                    if (0x11300 <= code && code <= 0x11301) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                else {
                                    if (code < 0x11341) {
                                        if (code < 0x1133e) {
                                            if (code < 0x1133b) {
                                                // Mc   [2] GRANTHA SIGN ANUSVARA..GRANTHA SIGN VISARGA
                                                if (0x11302 <= code && code <= 0x11303) {
                                                    return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                }
                                            }
                                            else {
                                                // Mn   [2] COMBINING BINDU BELOW..GRANTHA SIGN NUKTA
                                                if (0x1133b <= code && code <= 0x1133c) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0x1133f) {
                                                // Mc       GRANTHA VOWEL SIGN AA
                                                if (0x1133e === code) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                // Mc       GRANTHA VOWEL SIGN I
                                                if (0x1133f === code) {
                                                    return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                }
                                                // Mn       GRANTHA VOWEL SIGN II
                                                if (0x11340 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0x11357) {
                                            if (code < 0x11347) {
                                                // Mc   [4] GRANTHA VOWEL SIGN U..GRANTHA VOWEL SIGN VOCALIC RR
                                                if (0x11341 <= code && code <= 0x11344) {
                                                    return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                }
                                            }
                                            else {
                                                if (code < 0x1134b) {
                                                    // Mc   [2] GRANTHA VOWEL SIGN EE..GRANTHA VOWEL SIGN AI
                                                    if (0x11347 <= code && code <= 0x11348) {
                                                        return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                    }
                                                }
                                                else {
                                                    // Mc   [3] GRANTHA VOWEL SIGN OO..GRANTHA SIGN VIRAMA
                                                    if (0x1134b <= code && code <= 0x1134d) {
                                                        return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                    }
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0x11362) {
                                                // Mc       GRANTHA AU LENGTH MARK
                                                if (0x11357 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                if (code < 0x11366) {
                                                    // Mc   [2] GRANTHA VOWEL SIGN VOCALIC L..GRANTHA VOWEL SIGN VOCALIC LL
                                                    if (0x11362 <= code && code <= 0x11363) {
                                                        return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                    }
                                                }
                                                else {
                                                    // Mn   [7] COMBINING GRANTHA DIGIT ZERO..COMBINING GRANTHA DIGIT SIX
                                                    if (0x11366 <= code && code <= 0x1136c) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            else {
                                if (code < 0x114b3) {
                                    if (code < 0x11445) {
                                        if (code < 0x11438) {
                                            if (code < 0x11435) {
                                                // Mn   [5] COMBINING GRANTHA LETTER A..COMBINING GRANTHA LETTER PA
                                                if (0x11370 <= code && code <= 0x11374) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                // Mc   [3] NEWA VOWEL SIGN AA..NEWA VOWEL SIGN II
                                                if (0x11435 <= code && code <= 0x11437) {
                                                    return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0x11440) {
                                                // Mn   [8] NEWA VOWEL SIGN U..NEWA VOWEL SIGN AI
                                                if (0x11438 <= code && code <= 0x1143f) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                if (code < 0x11442) {
                                                    // Mc   [2] NEWA VOWEL SIGN O..NEWA VOWEL SIGN AU
                                                    if (0x11440 <= code && code <= 0x11441) {
                                                        return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                    }
                                                }
                                                else {
                                                    // Mn   [3] NEWA SIGN VIRAMA..NEWA SIGN ANUSVARA
                                                    if (0x11442 <= code && code <= 0x11444) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0x1145e) {
                                            // Mc       NEWA SIGN VISARGA
                                            if (0x11445 === code) {
                                                return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                            }
                                            // Mn       NEWA SIGN NUKTA
                                            if (0x11446 === code) {
                                                return boundaries_1.CLUSTER_BREAK.EXTEND;
                                            }
                                        }
                                        else {
                                            if (code < 0x114b0) {
                                                // Mn       NEWA SANDHI MARK
                                                if (0x1145e === code) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                if (code < 0x114b1) {
                                                    // Mc       TIRHUTA VOWEL SIGN AA
                                                    if (0x114b0 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                                else {
                                                    // Mc   [2] TIRHUTA VOWEL SIGN I..TIRHUTA VOWEL SIGN II
                                                    if (0x114b1 <= code && code <= 0x114b2) {
                                                        return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                else {
                                    if (code < 0x114be) {
                                        if (code < 0x114ba) {
                                            if (code < 0x114b9) {
                                                // Mn   [6] TIRHUTA VOWEL SIGN U..TIRHUTA VOWEL SIGN VOCALIC LL
                                                if (0x114b3 <= code && code <= 0x114b8) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                // Mc       TIRHUTA VOWEL SIGN E
                                                if (0x114b9 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0x114bb) {
                                                // Mn       TIRHUTA VOWEL SIGN SHORT E
                                                if (0x114ba === code) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                if (code < 0x114bd) {
                                                    // Mc   [2] TIRHUTA VOWEL SIGN AI..TIRHUTA VOWEL SIGN O
                                                    if (0x114bb <= code && code <= 0x114bc) {
                                                        return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                    }
                                                }
                                                else {
                                                    // Mc       TIRHUTA VOWEL SIGN SHORT O
                                                    if (0x114bd === code) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0x114c2) {
                                            if (code < 0x114bf) {
                                                // Mc       TIRHUTA VOWEL SIGN AU
                                                if (0x114be === code) {
                                                    return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                }
                                            }
                                            else {
                                                if (code < 0x114c1) {
                                                    // Mn   [2] TIRHUTA SIGN CANDRABINDU..TIRHUTA SIGN ANUSVARA
                                                    if (0x114bf <= code && code <= 0x114c0) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                                else {
                                                    // Mc       TIRHUTA SIGN VISARGA
                                                    if (0x114c1 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                    }
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0x115af) {
                                                // Mn   [2] TIRHUTA SIGN VIRAMA..TIRHUTA SIGN NUKTA
                                                if (0x114c2 <= code && code <= 0x114c3) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                if (code < 0x115b0) {
                                                    // Mc       SIDDHAM VOWEL SIGN AA
                                                    if (0x115af === code) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                                else {
                                                    // Mc   [2] SIDDHAM VOWEL SIGN I..SIDDHAM VOWEL SIGN II
                                                    if (0x115b0 <= code && code <= 0x115b1) {
                                                        return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        else {
                            if (code < 0x11722) {
                                if (code < 0x1163e) {
                                    if (code < 0x115dc) {
                                        if (code < 0x115bc) {
                                            if (code < 0x115b8) {
                                                // Mn   [4] SIDDHAM VOWEL SIGN U..SIDDHAM VOWEL SIGN VOCALIC RR
                                                if (0x115b2 <= code && code <= 0x115b5) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                // Mc   [4] SIDDHAM VOWEL SIGN E..SIDDHAM VOWEL SIGN AU
                                                if (0x115b8 <= code && code <= 0x115bb) {
                                                    return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0x115be) {
                                                // Mn   [2] SIDDHAM SIGN CANDRABINDU..SIDDHAM SIGN ANUSVARA
                                                if (0x115bc <= code && code <= 0x115bd) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                if (code < 0x115bf) {
                                                    // Mc       SIDDHAM SIGN VISARGA
                                                    if (0x115be === code) {
                                                        return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                    }
                                                }
                                                else {
                                                    // Mn   [2] SIDDHAM SIGN VIRAMA..SIDDHAM SIGN NUKTA
                                                    if (0x115bf <= code && code <= 0x115c0) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0x11633) {
                                            if (code < 0x11630) {
                                                // Mn   [2] SIDDHAM VOWEL SIGN ALTERNATE U..SIDDHAM VOWEL SIGN ALTERNATE UU
                                                if (0x115dc <= code && code <= 0x115dd) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                // Mc   [3] MODI VOWEL SIGN AA..MODI VOWEL SIGN II
                                                if (0x11630 <= code && code <= 0x11632) {
                                                    return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0x1163b) {
                                                // Mn   [8] MODI VOWEL SIGN U..MODI VOWEL SIGN AI
                                                if (0x11633 <= code && code <= 0x1163a) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                if (code < 0x1163d) {
                                                    // Mc   [2] MODI VOWEL SIGN O..MODI VOWEL SIGN AU
                                                    if (0x1163b <= code && code <= 0x1163c) {
                                                        return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                    }
                                                }
                                                else {
                                                    // Mn       MODI SIGN ANUSVARA
                                                    if (0x1163d === code) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                else {
                                    if (code < 0x116ae) {
                                        if (code < 0x116ab) {
                                            if (code < 0x1163f) {
                                                // Mc       MODI SIGN VISARGA
                                                if (0x1163e === code) {
                                                    return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                }
                                            }
                                            else {
                                                // Mn   [2] MODI SIGN VIRAMA..MODI SIGN ARDHACANDRA
                                                if (0x1163f <= code && code <= 0x11640) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0x116ac) {
                                                // Mn       TAKRI SIGN ANUSVARA
                                                if (0x116ab === code) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                // Mc       TAKRI SIGN VISARGA
                                                if (0x116ac === code) {
                                                    return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                }
                                                // Mn       TAKRI VOWEL SIGN AA
                                                if (0x116ad === code) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0x116b7) {
                                            if (code < 0x116b0) {
                                                // Mc   [2] TAKRI VOWEL SIGN I..TAKRI VOWEL SIGN II
                                                if (0x116ae <= code && code <= 0x116af) {
                                                    return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                }
                                            }
                                            else {
                                                if (code < 0x116b6) {
                                                    // Mn   [6] TAKRI VOWEL SIGN U..TAKRI VOWEL SIGN AU
                                                    if (0x116b0 <= code && code <= 0x116b5) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                                else {
                                                    // Mc       TAKRI SIGN VIRAMA
                                                    if (0x116b6 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                    }
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0x1171d) {
                                                // Mn       TAKRI SIGN NUKTA
                                                if (0x116b7 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                if (code < 0x11720) {
                                                    // Mn   [3] AHOM CONSONANT SIGN MEDIAL LA..AHOM CONSONANT SIGN MEDIAL LIGATING RA
                                                    if (0x1171d <= code && code <= 0x1171f) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                                else {
                                                    // Mc   [2] AHOM VOWEL SIGN A..AHOM VOWEL SIGN AA
                                                    if (0x11720 <= code && code <= 0x11721) {
                                                        return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            else {
                                if (code < 0x1193b) {
                                    if (code < 0x11838) {
                                        if (code < 0x11727) {
                                            if (code < 0x11726) {
                                                // Mn   [4] AHOM VOWEL SIGN I..AHOM VOWEL SIGN UU
                                                if (0x11722 <= code && code <= 0x11725) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                // Mc       AHOM VOWEL SIGN E
                                                if (0x11726 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0x1182c) {
                                                // Mn   [5] AHOM VOWEL SIGN AW..AHOM SIGN KILLER
                                                if (0x11727 <= code && code <= 0x1172b) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                if (code < 0x1182f) {
                                                    // Mc   [3] DOGRA VOWEL SIGN AA..DOGRA VOWEL SIGN II
                                                    if (0x1182c <= code && code <= 0x1182e) {
                                                        return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                    }
                                                }
                                                else {
                                                    // Mn   [9] DOGRA VOWEL SIGN U..DOGRA SIGN ANUSVARA
                                                    if (0x1182f <= code && code <= 0x11837) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0x11930) {
                                            if (code < 0x11839) {
                                                // Mc       DOGRA SIGN VISARGA
                                                if (0x11838 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                }
                                            }
                                            else {
                                                // Mn   [2] DOGRA SIGN VIRAMA..DOGRA SIGN NUKTA
                                                if (0x11839 <= code && code <= 0x1183a) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0x11931) {
                                                // Mc       DIVES AKURU VOWEL SIGN AA
                                                if (0x11930 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                if (code < 0x11937) {
                                                    // Mc   [5] DIVES AKURU VOWEL SIGN I..DIVES AKURU VOWEL SIGN E
                                                    if (0x11931 <= code && code <= 0x11935) {
                                                        return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                    }
                                                }
                                                else {
                                                    // Mc   [2] DIVES AKURU VOWEL SIGN AI..DIVES AKURU VOWEL SIGN O
                                                    if (0x11937 <= code && code <= 0x11938) {
                                                        return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                else {
                                    if (code < 0x11941) {
                                        if (code < 0x1193e) {
                                            if (code < 0x1193d) {
                                                // Mn   [2] DIVES AKURU SIGN ANUSVARA..DIVES AKURU SIGN CANDRABINDU
                                                if (0x1193b <= code && code <= 0x1193c) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                // Mc       DIVES AKURU SIGN HALANTA
                                                if (0x1193d === code) {
                                                    return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0x1193f) {
                                                // Mn       DIVES AKURU VIRAMA
                                                if (0x1193e === code) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                // Lo       DIVES AKURU PREFIXED NASAL SIGN
                                                if (0x1193f === code) {
                                                    return boundaries_1.CLUSTER_BREAK.PREPEND;
                                                }
                                                // Mc       DIVES AKURU MEDIAL YA
                                                if (0x11940 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0x119d1) {
                                            if (code < 0x11942) {
                                                // Lo       DIVES AKURU INITIAL RA
                                                if (0x11941 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.PREPEND;
                                                }
                                            }
                                            else {
                                                // Mc       DIVES AKURU MEDIAL RA
                                                if (0x11942 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                }
                                                // Mn       DIVES AKURU SIGN NUKTA
                                                if (0x11943 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0x119d4) {
                                                // Mc   [3] NANDINAGARI VOWEL SIGN AA..NANDINAGARI VOWEL SIGN II
                                                if (0x119d1 <= code && code <= 0x119d3) {
                                                    return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                }
                                            }
                                            else {
                                                if (code < 0x119da) {
                                                    // Mn   [4] NANDINAGARI VOWEL SIGN U..NANDINAGARI VOWEL SIGN VOCALIC RR
                                                    if (0x119d4 <= code && code <= 0x119d7) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                                else {
                                                    // Mn   [2] NANDINAGARI VOWEL SIGN E..NANDINAGARI VOWEL SIGN AI
                                                    if (0x119da <= code && code <= 0x119db) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                    else {
                        if (code < 0x13430) {
                            if (code < 0x11c92) {
                                if (code < 0x11a57) {
                                    if (code < 0x11a39) {
                                        if (code < 0x119e4) {
                                            if (code < 0x119e0) {
                                                // Mc   [4] NANDINAGARI VOWEL SIGN O..NANDINAGARI SIGN VISARGA
                                                if (0x119dc <= code && code <= 0x119df) {
                                                    return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                }
                                            }
                                            else {
                                                // Mn       NANDINAGARI SIGN VIRAMA
                                                if (0x119e0 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0x11a01) {
                                                // Mc       NANDINAGARI VOWEL SIGN PRISHTHAMATRA E
                                                if (0x119e4 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                }
                                            }
                                            else {
                                                if (code < 0x11a33) {
                                                    // Mn  [10] ZANABAZAR SQUARE VOWEL SIGN I..ZANABAZAR SQUARE VOWEL LENGTH MARK
                                                    if (0x11a01 <= code && code <= 0x11a0a) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                                else {
                                                    // Mn   [6] ZANABAZAR SQUARE FINAL CONSONANT MARK..ZANABAZAR SQUARE SIGN ANUSVARA
                                                    if (0x11a33 <= code && code <= 0x11a38) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0x11a3b) {
                                            // Mc       ZANABAZAR SQUARE SIGN VISARGA
                                            if (0x11a39 === code) {
                                                return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                            }
                                            // Lo       ZANABAZAR SQUARE CLUSTER-INITIAL LETTER RA
                                            if (0x11a3a === code) {
                                                return boundaries_1.CLUSTER_BREAK.PREPEND;
                                            }
                                        }
                                        else {
                                            if (code < 0x11a47) {
                                                // Mn   [4] ZANABAZAR SQUARE CLUSTER-FINAL LETTER YA..ZANABAZAR SQUARE CLUSTER-FINAL LETTER VA
                                                if (0x11a3b <= code && code <= 0x11a3e) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                if (code < 0x11a51) {
                                                    // Mn       ZANABAZAR SQUARE SUBJOINER
                                                    if (0x11a47 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                                else {
                                                    // Mn   [6] SOYOMBO VOWEL SIGN I..SOYOMBO VOWEL SIGN OE
                                                    if (0x11a51 <= code && code <= 0x11a56) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                else {
                                    if (code < 0x11a98) {
                                        if (code < 0x11a84) {
                                            if (code < 0x11a59) {
                                                // Mc   [2] SOYOMBO VOWEL SIGN AI..SOYOMBO VOWEL SIGN AU
                                                if (0x11a57 <= code && code <= 0x11a58) {
                                                    return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                }
                                            }
                                            else {
                                                // Mn   [3] SOYOMBO VOWEL SIGN VOCALIC R..SOYOMBO VOWEL LENGTH MARK
                                                if (0x11a59 <= code && code <= 0x11a5b) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0x11a8a) {
                                                // Lo   [6] SOYOMBO SIGN JIHVAMULIYA..SOYOMBO CLUSTER-INITIAL LETTER SA
                                                if (0x11a84 <= code && code <= 0x11a89) {
                                                    return boundaries_1.CLUSTER_BREAK.PREPEND;
                                                }
                                            }
                                            else {
                                                if (code < 0x11a97) {
                                                    // Mn  [13] SOYOMBO FINAL CONSONANT SIGN G..SOYOMBO SIGN ANUSVARA
                                                    if (0x11a8a <= code && code <= 0x11a96) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                                else {
                                                    // Mc       SOYOMBO SIGN VISARGA
                                                    if (0x11a97 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0x11c38) {
                                            if (code < 0x11c2f) {
                                                // Mn   [2] SOYOMBO GEMINATION MARK..SOYOMBO SUBJOINER
                                                if (0x11a98 <= code && code <= 0x11a99) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                if (code < 0x11c30) {
                                                    // Mc       BHAIKSUKI VOWEL SIGN AA
                                                    if (0x11c2f === code) {
                                                        return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                    }
                                                }
                                                else {
                                                    // Mn   [7] BHAIKSUKI VOWEL SIGN I..BHAIKSUKI VOWEL SIGN VOCALIC L
                                                    if (0x11c30 <= code && code <= 0x11c36) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0x11c3e) {
                                                // Mn   [6] BHAIKSUKI VOWEL SIGN E..BHAIKSUKI SIGN ANUSVARA
                                                if (0x11c38 <= code && code <= 0x11c3d) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                // Mc       BHAIKSUKI SIGN VISARGA
                                                if (0x11c3e === code) {
                                                    return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                }
                                                // Mn       BHAIKSUKI SIGN VIRAMA
                                                if (0x11c3f === code) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            else {
                                if (code < 0x11d3f) {
                                    if (code < 0x11cb4) {
                                        if (code < 0x11caa) {
                                            if (code < 0x11ca9) {
                                                // Mn  [22] MARCHEN SUBJOINED LETTER KA..MARCHEN SUBJOINED LETTER ZA
                                                if (0x11c92 <= code && code <= 0x11ca7) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                // Mc       MARCHEN SUBJOINED LETTER YA
                                                if (0x11ca9 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0x11cb1) {
                                                // Mn   [7] MARCHEN SUBJOINED LETTER RA..MARCHEN VOWEL SIGN AA
                                                if (0x11caa <= code && code <= 0x11cb0) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                if (code < 0x11cb2) {
                                                    // Mc       MARCHEN VOWEL SIGN I
                                                    if (0x11cb1 === code) {
                                                        return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                    }
                                                }
                                                else {
                                                    // Mn   [2] MARCHEN VOWEL SIGN U..MARCHEN VOWEL SIGN E
                                                    if (0x11cb2 <= code && code <= 0x11cb3) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0x11d31) {
                                            if (code < 0x11cb5) {
                                                // Mc       MARCHEN VOWEL SIGN O
                                                if (0x11cb4 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                }
                                            }
                                            else {
                                                // Mn   [2] MARCHEN SIGN ANUSVARA..MARCHEN SIGN CANDRABINDU
                                                if (0x11cb5 <= code && code <= 0x11cb6) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0x11d3a) {
                                                // Mn   [6] MASARAM GONDI VOWEL SIGN AA..MASARAM GONDI VOWEL SIGN VOCALIC R
                                                if (0x11d31 <= code && code <= 0x11d36) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                if (code < 0x11d3c) {
                                                    // Mn       MASARAM GONDI VOWEL SIGN E
                                                    if (0x11d3a === code) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                                else {
                                                    // Mn   [2] MASARAM GONDI VOWEL SIGN AI..MASARAM GONDI VOWEL SIGN O
                                                    if (0x11d3c <= code && code <= 0x11d3d) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                else {
                                    if (code < 0x11d93) {
                                        if (code < 0x11d47) {
                                            if (code < 0x11d46) {
                                                // Mn   [7] MASARAM GONDI VOWEL SIGN AU..MASARAM GONDI VIRAMA
                                                if (0x11d3f <= code && code <= 0x11d45) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                // Lo       MASARAM GONDI REPHA
                                                if (0x11d46 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.PREPEND;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0x11d8a) {
                                                // Mn       MASARAM GONDI RA-KARA
                                                if (0x11d47 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                if (code < 0x11d90) {
                                                    // Mc   [5] GUNJALA GONDI VOWEL SIGN AA..GUNJALA GONDI VOWEL SIGN UU
                                                    if (0x11d8a <= code && code <= 0x11d8e) {
                                                        return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                    }
                                                }
                                                else {
                                                    // Mn   [2] GUNJALA GONDI VOWEL SIGN EE..GUNJALA GONDI VOWEL SIGN AI
                                                    if (0x11d90 <= code && code <= 0x11d91) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0x11d97) {
                                            if (code < 0x11d95) {
                                                // Mc   [2] GUNJALA GONDI VOWEL SIGN OO..GUNJALA GONDI VOWEL SIGN AU
                                                if (0x11d93 <= code && code <= 0x11d94) {
                                                    return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                }
                                            }
                                            else {
                                                // Mn       GUNJALA GONDI SIGN ANUSVARA
                                                if (0x11d95 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                                // Mc       GUNJALA GONDI SIGN VISARGA
                                                if (0x11d96 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0x11ef3) {
                                                // Mn       GUNJALA GONDI VIRAMA
                                                if (0x11d97 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                if (code < 0x11ef5) {
                                                    // Mn   [2] MAKASAR VOWEL SIGN I..MAKASAR VOWEL SIGN U
                                                    if (0x11ef3 <= code && code <= 0x11ef4) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                                else {
                                                    // Mc   [2] MAKASAR VOWEL SIGN E..MAKASAR VOWEL SIGN O
                                                    if (0x11ef5 <= code && code <= 0x11ef6) {
                                                        return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        else {
                            if (code < 0x1da3b) {
                                if (code < 0x1d165) {
                                    if (code < 0x16f8f) {
                                        if (code < 0x16b30) {
                                            if (code < 0x16af0) {
                                                // Cf   [9] EGYPTIAN HIEROGLYPH VERTICAL JOINER..EGYPTIAN HIEROGLYPH END SEGMENT
                                                if (0x13430 <= code && code <= 0x13438) {
                                                    return boundaries_1.CLUSTER_BREAK.CONTROL;
                                                }
                                            }
                                            else {
                                                // Mn   [5] BASSA VAH COMBINING HIGH TONE..BASSA VAH COMBINING HIGH-LOW TONE
                                                if (0x16af0 <= code && code <= 0x16af4) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0x16f4f) {
                                                // Mn   [7] PAHAWH HMONG MARK CIM TUB..PAHAWH HMONG MARK CIM TAUM
                                                if (0x16b30 <= code && code <= 0x16b36) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                if (code < 0x16f51) {
                                                    // Mn       MIAO SIGN CONSONANT MODIFIER BAR
                                                    if (0x16f4f === code) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                                else {
                                                    // Mc  [55] MIAO SIGN ASPIRATION..MIAO VOWEL SIGN UI
                                                    if (0x16f51 <= code && code <= 0x16f87) {
                                                        return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0x16ff0) {
                                            if (code < 0x16fe4) {
                                                // Mn   [4] MIAO TONE RIGHT..MIAO TONE BELOW
                                                if (0x16f8f <= code && code <= 0x16f92) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                // Mn       KHITAN SMALL SCRIPT FILLER
                                                if (0x16fe4 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0x1bc9d) {
                                                // Mc   [2] VIETNAMESE ALTERNATE READING MARK CA..VIETNAMESE ALTERNATE READING MARK NHAY
                                                if (0x16ff0 <= code && code <= 0x16ff1) {
                                                    return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                }
                                            }
                                            else {
                                                if (code < 0x1bca0) {
                                                    // Mn   [2] DUPLOYAN THICK LETTER SELECTOR..DUPLOYAN DOUBLE MARK
                                                    if (0x1bc9d <= code && code <= 0x1bc9e) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                                else {
                                                    // Cf   [4] SHORTHAND FORMAT LETTER OVERLAP..SHORTHAND FORMAT UP STEP
                                                    if (0x1bca0 <= code && code <= 0x1bca3) {
                                                        return boundaries_1.CLUSTER_BREAK.CONTROL;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                else {
                                    if (code < 0x1d173) {
                                        if (code < 0x1d167) {
                                            // Mc       MUSICAL SYMBOL COMBINING STEM
                                            if (0x1d165 === code) {
                                                return boundaries_1.CLUSTER_BREAK.EXTEND;
                                            }
                                            // Mc       MUSICAL SYMBOL COMBINING SPRECHGESANG STEM
                                            if (0x1d166 === code) {
                                                return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                            }
                                        }
                                        else {
                                            if (code < 0x1d16d) {
                                                // Mn   [3] MUSICAL SYMBOL COMBINING TREMOLO-1..MUSICAL SYMBOL COMBINING TREMOLO-3
                                                if (0x1d167 <= code && code <= 0x1d169) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                if (code < 0x1d16e) {
                                                    // Mc       MUSICAL SYMBOL COMBINING AUGMENTATION DOT
                                                    if (0x1d16d === code) {
                                                        return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
                                                    }
                                                }
                                                else {
                                                    // Mc   [5] MUSICAL SYMBOL COMBINING FLAG-1..MUSICAL SYMBOL COMBINING FLAG-5
                                                    if (0x1d16e <= code && code <= 0x1d172) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0x1d1aa) {
                                            if (code < 0x1d17b) {
                                                // Cf   [8] MUSICAL SYMBOL BEGIN BEAM..MUSICAL SYMBOL END PHRASE
                                                if (0x1d173 <= code && code <= 0x1d17a) {
                                                    return boundaries_1.CLUSTER_BREAK.CONTROL;
                                                }
                                            }
                                            else {
                                                if (code < 0x1d185) {
                                                    // Mn   [8] MUSICAL SYMBOL COMBINING ACCENT..MUSICAL SYMBOL COMBINING LOURE
                                                    if (0x1d17b <= code && code <= 0x1d182) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                                else {
                                                    // Mn   [7] MUSICAL SYMBOL COMBINING DOIT..MUSICAL SYMBOL COMBINING TRIPLE TONGUE
                                                    if (0x1d185 <= code && code <= 0x1d18b) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0x1d242) {
                                                // Mn   [4] MUSICAL SYMBOL COMBINING DOWN BOW..MUSICAL SYMBOL COMBINING SNAP PIZZICATO
                                                if (0x1d1aa <= code && code <= 0x1d1ad) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                if (code < 0x1da00) {
                                                    // Mn   [3] COMBINING GREEK MUSICAL TRISEME..COMBINING GREEK MUSICAL PENTASEME
                                                    if (0x1d242 <= code && code <= 0x1d244) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                                else {
                                                    // Mn  [55] SIGNWRITING HEAD RIM..SIGNWRITING AIR SUCKING IN
                                                    if (0x1da00 <= code && code <= 0x1da36) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            else {
                                if (code < 0x1e130) {
                                    if (code < 0x1e000) {
                                        if (code < 0x1da84) {
                                            if (code < 0x1da75) {
                                                // Mn  [50] SIGNWRITING MOUTH CLOSED NEUTRAL..SIGNWRITING EXCITEMENT
                                                if (0x1da3b <= code && code <= 0x1da6c) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                // Mn       SIGNWRITING UPPER BODY TILTING FROM HIP JOINTS
                                                if (0x1da75 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0x1da9b) {
                                                // Mn       SIGNWRITING LOCATION HEAD NECK
                                                if (0x1da84 === code) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                if (code < 0x1daa1) {
                                                    // Mn   [5] SIGNWRITING FILL MODIFIER-2..SIGNWRITING FILL MODIFIER-6
                                                    if (0x1da9b <= code && code <= 0x1da9f) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                                else {
                                                    // Mn  [15] SIGNWRITING ROTATION MODIFIER-2..SIGNWRITING ROTATION MODIFIER-16
                                                    if (0x1daa1 <= code && code <= 0x1daaf) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0x1e01b) {
                                            if (code < 0x1e008) {
                                                // Mn   [7] COMBINING GLAGOLITIC LETTER AZU..COMBINING GLAGOLITIC LETTER ZHIVETE
                                                if (0x1e000 <= code && code <= 0x1e006) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                // Mn  [17] COMBINING GLAGOLITIC LETTER ZEMLJA..COMBINING GLAGOLITIC LETTER HERU
                                                if (0x1e008 <= code && code <= 0x1e018) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0x1e023) {
                                                // Mn   [7] COMBINING GLAGOLITIC LETTER SHTA..COMBINING GLAGOLITIC LETTER YATI
                                                if (0x1e01b <= code && code <= 0x1e021) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                if (code < 0x1e026) {
                                                    // Mn   [2] COMBINING GLAGOLITIC LETTER YU..COMBINING GLAGOLITIC LETTER SMALL YUS
                                                    if (0x1e023 <= code && code <= 0x1e024) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                                else {
                                                    // Mn   [5] COMBINING GLAGOLITIC LETTER YO..COMBINING GLAGOLITIC LETTER FITA
                                                    if (0x1e026 <= code && code <= 0x1e02a) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                else {
                                    if (code < 0x1f3fb) {
                                        if (code < 0x1e8d0) {
                                            if (code < 0x1e2ec) {
                                                // Mn   [7] NYIAKENG PUACHUE HMONG TONE-B..NYIAKENG PUACHUE HMONG TONE-D
                                                if (0x1e130 <= code && code <= 0x1e136) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                // Mn   [4] WANCHO TONE TUP..WANCHO TONE KOINI
                                                if (0x1e2ec <= code && code <= 0x1e2ef) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0x1e944) {
                                                // Mn   [7] MENDE KIKAKUI COMBINING NUMBER TEENS..MENDE KIKAKUI COMBINING NUMBER MILLIONS
                                                if (0x1e8d0 <= code && code <= 0x1e8d6) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                if (code < 0x1f1e6) {
                                                    // Mn   [7] ADLAM ALIF LENGTHENER..ADLAM NUKTA
                                                    if (0x1e944 <= code && code <= 0x1e94a) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                                else {
                                                    // So  [26] REGIONAL INDICATOR SYMBOL LETTER A..REGIONAL INDICATOR SYMBOL LETTER Z
                                                    if (0x1f1e6 <= code && code <= 0x1f1ff) {
                                                        return boundaries_1.CLUSTER_BREAK.REGIONAL_INDICATOR;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (code < 0xe0080) {
                                            if (code < 0xe0000) {
                                                // Sk   [5] EMOJI MODIFIER FITZPATRICK TYPE-1-2..EMOJI MODIFIER FITZPATRICK TYPE-6
                                                if (0x1f3fb <= code && code <= 0x1f3ff) {
                                                    return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                }
                                            }
                                            else {
                                                if (code < 0xe0020) {
                                                    // Cn       <reserved-E0000>
                                                    // Cf       LANGUAGE TAG
                                                    // Cn  [30] <reserved-E0002>..<reserved-E001F>
                                                    if (0xe0000 <= code && code <= 0xe001f) {
                                                        return boundaries_1.CLUSTER_BREAK.CONTROL;
                                                    }
                                                }
                                                else {
                                                    // Cf  [96] TAG SPACE..CANCEL TAG
                                                    if (0xe0020 <= code && code <= 0xe007f) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                            }
                                        }
                                        else {
                                            if (code < 0xe0100) {
                                                // Cn [128] <reserved-E0080>..<reserved-E00FF>
                                                if (0xe0080 <= code && code <= 0xe00ff) {
                                                    return boundaries_1.CLUSTER_BREAK.CONTROL;
                                                }
                                            }
                                            else {
                                                if (code < 0xe01f0) {
                                                    // Mn [240] VARIATION SELECTOR-17..VARIATION SELECTOR-256
                                                    if (0xe0100 <= code && code <= 0xe01ef) {
                                                        return boundaries_1.CLUSTER_BREAK.EXTEND;
                                                    }
                                                }
                                                else {
                                                    // Cn [3600] <reserved-E01F0>..<reserved-E0FFF>
                                                    if (0xe01f0 <= code && code <= 0xe0fff) {
                                                        return boundaries_1.CLUSTER_BREAK.CONTROL;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        // unlisted code points are treated as a break property of "Other"
        return boundaries_1.CLUSTER_BREAK.OTHER;
    }
    /**
     * Given a Unicode code point, returns if symbol is an extended pictographic or some other break
     * @param code {number} Unicode code point
     * @returns {number}
     */
    static getEmojiProperty(code) {
        // emoji property taken from:
        // https://www.unicode.org/Public/UCD/latest/ucd/emoji/emoji-data.txt
        // and generated by
        // node ./scripts/generate-emoji-extended-pictographic.js
        if (code < 0x27b0) {
            if (code < 0x2600) {
                if (code < 0x2328) {
                    if (code < 0x2122) {
                        if (code < 0x203c) {
                            // E0.6   [1] (©️)       copyright
                            if (0xa9 === code) {
                                return boundaries_1.EXTENDED_PICTOGRAPHIC;
                            }
                            // E0.6   [1] (®️)       registered
                            if (0xae === code) {
                                return boundaries_1.EXTENDED_PICTOGRAPHIC;
                            }
                        }
                        else {
                            // E0.6   [1] (‼️)       double exclamation mark
                            if (0x203c === code) {
                                return boundaries_1.EXTENDED_PICTOGRAPHIC;
                            }
                            // E0.6   [1] (⁉️)       exclamation question mark
                            if (0x2049 === code) {
                                return boundaries_1.EXTENDED_PICTOGRAPHIC;
                            }
                        }
                    }
                    else {
                        if (code < 0x2194) {
                            // E0.6   [1] (™️)       trade mark
                            if (0x2122 === code) {
                                return boundaries_1.EXTENDED_PICTOGRAPHIC;
                            }
                            // E0.6   [1] (ℹ️)       information
                            if (0x2139 === code) {
                                return boundaries_1.EXTENDED_PICTOGRAPHIC;
                            }
                        }
                        else {
                            if (code < 0x21a9) {
                                // E0.6   [6] (↔️..↙️)    left-right arrow..down-left arrow
                                if (0x2194 <= code && code <= 0x2199) {
                                    return boundaries_1.EXTENDED_PICTOGRAPHIC;
                                }
                            }
                            else {
                                if (code < 0x231a) {
                                    // E0.6   [2] (↩️..↪️)    right arrow curving left..left arrow curving right
                                    if (0x21a9 <= code && code <= 0x21aa) {
                                        return boundaries_1.EXTENDED_PICTOGRAPHIC;
                                    }
                                }
                                else {
                                    // E0.6   [2] (⌚..⌛)    watch..hourglass done
                                    if (0x231a <= code && code <= 0x231b) {
                                        return boundaries_1.EXTENDED_PICTOGRAPHIC;
                                    }
                                }
                            }
                        }
                    }
                }
                else {
                    if (code < 0x24c2) {
                        if (code < 0x23cf) {
                            // E1.0   [1] (⌨️)       keyboard
                            if (0x2328 === code) {
                                return boundaries_1.EXTENDED_PICTOGRAPHIC;
                            }
                            // E0.0   [1] (⎈)       HELM SYMBOL
                            if (0x2388 === code) {
                                return boundaries_1.EXTENDED_PICTOGRAPHIC;
                            }
                        }
                        else {
                            if (code < 0x23e9) {
                                // E1.0   [1] (⏏️)       eject button
                                if (0x23cf === code) {
                                    return boundaries_1.EXTENDED_PICTOGRAPHIC;
                                }
                            }
                            else {
                                if (code < 0x23f8) {
                                    // E0.6   [4] (⏩..⏬)    fast-forward button..fast down button
                                    // E0.7   [2] (⏭️..⏮️)    next track button..last track button
                                    // E1.0   [1] (⏯️)       play or pause button
                                    // E0.6   [1] (⏰)       alarm clock
                                    // E1.0   [2] (⏱️..⏲️)    stopwatch..timer clock
                                    // E0.6   [1] (⏳)       hourglass not done
                                    if (0x23e9 <= code && code <= 0x23f3) {
                                        return boundaries_1.EXTENDED_PICTOGRAPHIC;
                                    }
                                }
                                else {
                                    // E0.7   [3] (⏸️..⏺️)    pause button..record button
                                    if (0x23f8 <= code && code <= 0x23fa) {
                                        return boundaries_1.EXTENDED_PICTOGRAPHIC;
                                    }
                                }
                            }
                        }
                    }
                    else {
                        if (code < 0x25b6) {
                            if (code < 0x25aa) {
                                // E0.6   [1] (Ⓜ️)       circled M
                                if (0x24c2 === code) {
                                    return boundaries_1.EXTENDED_PICTOGRAPHIC;
                                }
                            }
                            else {
                                // E0.6   [2] (▪️..▫️)    black small square..white small square
                                if (0x25aa <= code && code <= 0x25ab) {
                                    return boundaries_1.EXTENDED_PICTOGRAPHIC;
                                }
                            }
                        }
                        else {
                            if (code < 0x25c0) {
                                // E0.6   [1] (▶️)       play button
                                if (0x25b6 === code) {
                                    return boundaries_1.EXTENDED_PICTOGRAPHIC;
                                }
                            }
                            else {
                                if (code < 0x25fb) {
                                    // E0.6   [1] (◀️)       reverse button
                                    if (0x25c0 === code) {
                                        return boundaries_1.EXTENDED_PICTOGRAPHIC;
                                    }
                                }
                                else {
                                    // E0.6   [4] (◻️..◾)    white medium square..black medium-small square
                                    if (0x25fb <= code && code <= 0x25fe) {
                                        return boundaries_1.EXTENDED_PICTOGRAPHIC;
                                    }
                                }
                            }
                        }
                    }
                }
            }
            else {
                if (code < 0x2733) {
                    if (code < 0x2714) {
                        if (code < 0x2614) {
                            if (code < 0x2607) {
                                // E0.6   [2] (☀️..☁️)    sun..cloud
                                // E0.7   [2] (☂️..☃️)    umbrella..snowman
                                // E1.0   [1] (☄️)       comet
                                // E0.0   [1] (★)       BLACK STAR
                                if (0x2600 <= code && code <= 0x2605) {
                                    return boundaries_1.EXTENDED_PICTOGRAPHIC;
                                }
                            }
                            else {
                                // E0.0   [7] (☇..☍)    LIGHTNING..OPPOSITION
                                // E0.6   [1] (☎️)       telephone
                                // E0.0   [2] (☏..☐)    WHITE TELEPHONE..BALLOT BOX
                                // E0.6   [1] (☑️)       check box with check
                                // E0.0   [1] (☒)       BALLOT BOX WITH X
                                if (0x2607 <= code && code <= 0x2612) {
                                    return boundaries_1.EXTENDED_PICTOGRAPHIC;
                                }
                            }
                        }
                        else {
                            if (code < 0x2690) {
                                // E0.6   [2] (☔..☕)    umbrella with rain drops..hot beverage
                                // E0.0   [2] (☖..☗)    WHITE SHOGI PIECE..BLACK SHOGI PIECE
                                // E1.0   [1] (☘️)       shamrock
                                // E0.0   [4] (☙..☜)    REVERSED ROTATED FLORAL HEART BULLET..WHITE LEFT POINTING INDEX
                                // E0.6   [1] (☝️)       index pointing up
                                // E0.0   [2] (☞..☟)    WHITE RIGHT POINTING INDEX..WHITE DOWN POINTING INDEX
                                // E1.0   [1] (☠️)       skull and crossbones
                                // E0.0   [1] (☡)       CAUTION SIGN
                                // E1.0   [2] (☢️..☣️)    radioactive..biohazard
                                // E0.0   [2] (☤..☥)    CADUCEUS..ANKH
                                // E1.0   [1] (☦️)       orthodox cross
                                // E0.0   [3] (☧..☩)    CHI RHO..CROSS OF JERUSALEM
                                // E0.7   [1] (☪️)       star and crescent
                                // E0.0   [3] (☫..☭)    FARSI SYMBOL..HAMMER AND SICKLE
                                // E1.0   [1] (☮️)       peace symbol
                                // E0.7   [1] (☯️)       yin yang
                                // E0.0   [8] (☰..☷)    TRIGRAM FOR HEAVEN..TRIGRAM FOR EARTH
                                // E0.7   [2] (☸️..☹️)    wheel of dharma..frowning face
                                // E0.6   [1] (☺️)       smiling face
                                // E0.0   [5] (☻..☿)    BLACK SMILING FACE..MERCURY
                                // E4.0   [1] (♀️)       female sign
                                // E0.0   [1] (♁)       EARTH
                                // E4.0   [1] (♂️)       male sign
                                // E0.0   [5] (♃..♇)    JUPITER..PLUTO
                                // E0.6  [12] (♈..♓)    Aries..Pisces
                                // E0.0  [11] (♔..♞)    WHITE CHESS KING..BLACK CHESS KNIGHT
                                // E11.0  [1] (♟️)       chess pawn
                                // E0.6   [1] (♠️)       spade suit
                                // E0.0   [2] (♡..♢)    WHITE HEART SUIT..WHITE DIAMOND SUIT
                                // E0.6   [1] (♣️)       club suit
                                // E0.0   [1] (♤)       WHITE SPADE SUIT
                                // E0.6   [2] (♥️..♦️)    heart suit..diamond suit
                                // E0.0   [1] (♧)       WHITE CLUB SUIT
                                // E0.6   [1] (♨️)       hot springs
                                // E0.0  [18] (♩..♺)    QUARTER NOTE..RECYCLING SYMBOL FOR GENERIC MATERIALS
                                // E0.6   [1] (♻️)       recycling symbol
                                // E0.0   [2] (♼..♽)    RECYCLED PAPER SYMBOL..PARTIALLY-RECYCLED PAPER SYMBOL
                                // E11.0  [1] (♾️)       infinity
                                // E0.6   [1] (♿)       wheelchair symbol
                                // E0.0   [6] (⚀..⚅)    DIE FACE-1..DIE FACE-6
                                if (0x2614 <= code && code <= 0x2685) {
                                    return boundaries_1.EXTENDED_PICTOGRAPHIC;
                                }
                            }
                            else {
                                if (code < 0x2708) {
                                    // E0.0   [2] (⚐..⚑)    WHITE FLAG..BLACK FLAG
                                    // E1.0   [1] (⚒️)       hammer and pick
                                    // E0.6   [1] (⚓)       anchor
                                    // E1.0   [1] (⚔️)       crossed swords
                                    // E4.0   [1] (⚕️)       medical symbol
                                    // E1.0   [2] (⚖️..⚗️)    balance scale..alembic
                                    // E0.0   [1] (⚘)       FLOWER
                                    // E1.0   [1] (⚙️)       gear
                                    // E0.0   [1] (⚚)       STAFF OF HERMES
                                    // E1.0   [2] (⚛️..⚜️)    atom symbol..fleur-de-lis
                                    // E0.0   [3] (⚝..⚟)    OUTLINED WHITE STAR..THREE LINES CONVERGING LEFT
                                    // E0.6   [2] (⚠️..⚡)    warning..high voltage
                                    // E0.0   [5] (⚢..⚦)    DOUBLED FEMALE SIGN..MALE WITH STROKE SIGN
                                    // E13.0  [1] (⚧️)       transgender symbol
                                    // E0.0   [2] (⚨..⚩)    VERTICAL MALE WITH STROKE SIGN..HORIZONTAL MALE WITH STROKE SIGN
                                    // E0.6   [2] (⚪..⚫)    white circle..black circle
                                    // E0.0   [4] (⚬..⚯)    MEDIUM SMALL WHITE CIRCLE..UNMARRIED PARTNERSHIP SYMBOL
                                    // E1.0   [2] (⚰️..⚱️)    coffin..funeral urn
                                    // E0.0  [11] (⚲..⚼)    NEUTER..SESQUIQUADRATE
                                    // E0.6   [2] (⚽..⚾)    soccer ball..baseball
                                    // E0.0   [5] (⚿..⛃)    SQUARED KEY..BLACK DRAUGHTS KING
                                    // E0.6   [2] (⛄..⛅)    snowman without snow..sun behind cloud
                                    // E0.0   [2] (⛆..⛇)    RAIN..BLACK SNOWMAN
                                    // E0.7   [1] (⛈️)       cloud with lightning and rain
                                    // E0.0   [5] (⛉..⛍)    TURNED WHITE SHOGI PIECE..DISABLED CAR
                                    // E0.6   [1] (⛎)       Ophiuchus
                                    // E0.7   [1] (⛏️)       pick
                                    // E0.0   [1] (⛐)       CAR SLIDING
                                    // E0.7   [1] (⛑️)       rescue worker’s helmet
                                    // E0.0   [1] (⛒)       CIRCLED CROSSING LANES
                                    // E0.7   [1] (⛓️)       chains
                                    // E0.6   [1] (⛔)       no entry
                                    // E0.0  [20] (⛕..⛨)    ALTERNATE ONE-WAY LEFT WAY TRAFFIC..BLACK CROSS ON SHIELD
                                    // E0.7   [1] (⛩️)       shinto shrine
                                    // E0.6   [1] (⛪)       church
                                    // E0.0   [5] (⛫..⛯)    CASTLE..MAP SYMBOL FOR LIGHTHOUSE
                                    // E0.7   [2] (⛰️..⛱️)    mountain..umbrella on ground
                                    // E0.6   [2] (⛲..⛳)    fountain..flag in hole
                                    // E0.7   [1] (⛴️)       ferry
                                    // E0.6   [1] (⛵)       sailboat
                                    // E0.0   [1] (⛶)       SQUARE FOUR CORNERS
                                    // E0.7   [3] (⛷️..⛹️)    skier..person bouncing ball
                                    // E0.6   [1] (⛺)       tent
                                    // E0.0   [2] (⛻..⛼)    JAPANESE BANK SYMBOL..HEADSTONE GRAVEYARD SYMBOL
                                    // E0.6   [1] (⛽)       fuel pump
                                    // E0.0   [4] (⛾..✁)    CUP ON BLACK SQUARE..UPPER BLADE SCISSORS
                                    // E0.6   [1] (✂️)       scissors
                                    // E0.0   [2] (✃..✄)    LOWER BLADE SCISSORS..WHITE SCISSORS
                                    // E0.6   [1] (✅)       check mark button
                                    if (0x2690 <= code && code <= 0x2705) {
                                        return boundaries_1.EXTENDED_PICTOGRAPHIC;
                                    }
                                }
                                else {
                                    // E0.6   [5] (✈️..✌️)    airplane..victory hand
                                    // E0.7   [1] (✍️)       writing hand
                                    // E0.0   [1] (✎)       LOWER RIGHT PENCIL
                                    // E0.6   [1] (✏️)       pencil
                                    // E0.0   [2] (✐..✑)    UPPER RIGHT PENCIL..WHITE NIB
                                    // E0.6   [1] (✒️)       black nib
                                    if (0x2708 <= code && code <= 0x2712) {
                                        return boundaries_1.EXTENDED_PICTOGRAPHIC;
                                    }
                                }
                            }
                        }
                    }
                    else {
                        if (code < 0x271d) {
                            // E0.6   [1] (✔️)       check mark
                            if (0x2714 === code) {
                                return boundaries_1.EXTENDED_PICTOGRAPHIC;
                            }
                            // E0.6   [1] (✖️)       multiply
                            if (0x2716 === code) {
                                return boundaries_1.EXTENDED_PICTOGRAPHIC;
                            }
                        }
                        else {
                            if (code < 0x2721) {
                                // E0.7   [1] (✝️)       latin cross
                                if (0x271d === code) {
                                    return boundaries_1.EXTENDED_PICTOGRAPHIC;
                                }
                            }
                            else {
                                // E0.7   [1] (✡️)       star of David
                                if (0x2721 === code) {
                                    return boundaries_1.EXTENDED_PICTOGRAPHIC;
                                }
                                // E0.6   [1] (✨)       sparkles
                                if (0x2728 === code) {
                                    return boundaries_1.EXTENDED_PICTOGRAPHIC;
                                }
                            }
                        }
                    }
                }
                else {
                    if (code < 0x2753) {
                        if (code < 0x2747) {
                            if (code < 0x2744) {
                                // E0.6   [2] (✳️..✴️)    eight-spoked asterisk..eight-pointed star
                                if (0x2733 <= code && code <= 0x2734) {
                                    return boundaries_1.EXTENDED_PICTOGRAPHIC;
                                }
                            }
                            else {
                                // E0.6   [1] (❄️)       snowflake
                                if (0x2744 === code) {
                                    return boundaries_1.EXTENDED_PICTOGRAPHIC;
                                }
                            }
                        }
                        else {
                            if (code < 0x274c) {
                                // E0.6   [1] (❇️)       sparkle
                                if (0x2747 === code) {
                                    return boundaries_1.EXTENDED_PICTOGRAPHIC;
                                }
                            }
                            else {
                                // E0.6   [1] (❌)       cross mark
                                if (0x274c === code) {
                                    return boundaries_1.EXTENDED_PICTOGRAPHIC;
                                }
                                // E0.6   [1] (❎)       cross mark button
                                if (0x274e === code) {
                                    return boundaries_1.EXTENDED_PICTOGRAPHIC;
                                }
                            }
                        }
                    }
                    else {
                        if (code < 0x2763) {
                            if (code < 0x2757) {
                                // E0.6   [3] (❓..❕)    question mark..white exclamation mark
                                if (0x2753 <= code && code <= 0x2755) {
                                    return boundaries_1.EXTENDED_PICTOGRAPHIC;
                                }
                            }
                            else {
                                // E0.6   [1] (❗)       exclamation mark
                                if (0x2757 === code) {
                                    return boundaries_1.EXTENDED_PICTOGRAPHIC;
                                }
                            }
                        }
                        else {
                            if (code < 0x2795) {
                                // E1.0   [1] (❣️)       heart exclamation
                                // E0.6   [1] (❤️)       red heart
                                // E0.0   [3] (❥..❧)    ROTATED HEAVY BLACK HEART BULLET..ROTATED FLORAL HEART BULLET
                                if (0x2763 <= code && code <= 0x2767) {
                                    return boundaries_1.EXTENDED_PICTOGRAPHIC;
                                }
                            }
                            else {
                                if (code < 0x27a1) {
                                    // E0.6   [3] (➕..➗)    plus..divide
                                    if (0x2795 <= code && code <= 0x2797) {
                                        return boundaries_1.EXTENDED_PICTOGRAPHIC;
                                    }
                                }
                                else {
                                    // E0.6   [1] (➡️)       right arrow
                                    if (0x27a1 === code) {
                                        return boundaries_1.EXTENDED_PICTOGRAPHIC;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        else {
            if (code < 0x1f201) {
                if (code < 0x3297) {
                    if (code < 0x2b1b) {
                        if (code < 0x2934) {
                            // E0.6   [1] (➰)       curly loop
                            if (0x27b0 === code) {
                                return boundaries_1.EXTENDED_PICTOGRAPHIC;
                            }
                            // E1.0   [1] (➿)       double curly loop
                            if (0x27bf === code) {
                                return boundaries_1.EXTENDED_PICTOGRAPHIC;
                            }
                        }
                        else {
                            if (code < 0x2b05) {
                                // E0.6   [2] (⤴️..⤵️)    right arrow curving up..right arrow curving down
                                if (0x2934 <= code && code <= 0x2935) {
                                    return boundaries_1.EXTENDED_PICTOGRAPHIC;
                                }
                            }
                            else {
                                // E0.6   [3] (⬅️..⬇️)    left arrow..down arrow
                                if (0x2b05 <= code && code <= 0x2b07) {
                                    return boundaries_1.EXTENDED_PICTOGRAPHIC;
                                }
                            }
                        }
                    }
                    else {
                        if (code < 0x2b55) {
                            if (code < 0x2b50) {
                                // E0.6   [2] (⬛..⬜)    black large square..white large square
                                if (0x2b1b <= code && code <= 0x2b1c) {
                                    return boundaries_1.EXTENDED_PICTOGRAPHIC;
                                }
                            }
                            else {
                                // E0.6   [1] (⭐)       star
                                if (0x2b50 === code) {
                                    return boundaries_1.EXTENDED_PICTOGRAPHIC;
                                }
                            }
                        }
                        else {
                            if (code < 0x3030) {
                                // E0.6   [1] (⭕)       hollow red circle
                                if (0x2b55 === code) {
                                    return boundaries_1.EXTENDED_PICTOGRAPHIC;
                                }
                            }
                            else {
                                // E0.6   [1] (〰️)       wavy dash
                                if (0x3030 === code) {
                                    return boundaries_1.EXTENDED_PICTOGRAPHIC;
                                }
                                // E0.6   [1] (〽️)       part alternation mark
                                if (0x303d === code) {
                                    return boundaries_1.EXTENDED_PICTOGRAPHIC;
                                }
                            }
                        }
                    }
                }
                else {
                    if (code < 0x1f16c) {
                        if (code < 0x1f000) {
                            // E0.6   [1] (㊗️)       Japanese “congratulations” button
                            if (0x3297 === code) {
                                return boundaries_1.EXTENDED_PICTOGRAPHIC;
                            }
                            // E0.6   [1] (㊙️)       Japanese “secret” button
                            if (0x3299 === code) {
                                return boundaries_1.EXTENDED_PICTOGRAPHIC;
                            }
                        }
                        else {
                            if (code < 0x1f10d) {
                                // E0.0   [4] (🀀..🀃)    MAHJONG TILE EAST WIND..MAHJONG TILE NORTH WIND
                                // E0.6   [1] (🀄)       mahjong red dragon
                                // E0.0 [202] (🀅..🃎)    MAHJONG TILE GREEN DRAGON..PLAYING CARD KING OF DIAMONDS
                                // E0.6   [1] (🃏)       joker
                                // E0.0  [48] (🃐..🃿)    <reserved-1F0D0>..<reserved-1F0FF>
                                if (0x1f000 <= code && code <= 0x1f0ff) {
                                    return boundaries_1.EXTENDED_PICTOGRAPHIC;
                                }
                            }
                            else {
                                if (code < 0x1f12f) {
                                    // E0.0   [3] (🄍..🄏)    CIRCLED ZERO WITH SLASH..CIRCLED DOLLAR SIGN WITH OVERLAID BACKSLASH
                                    if (0x1f10d <= code && code <= 0x1f10f) {
                                        return boundaries_1.EXTENDED_PICTOGRAPHIC;
                                    }
                                }
                                else {
                                    // E0.0   [1] (🄯)       COPYLEFT SYMBOL
                                    if (0x1f12f === code) {
                                        return boundaries_1.EXTENDED_PICTOGRAPHIC;
                                    }
                                }
                            }
                        }
                    }
                    else {
                        if (code < 0x1f18e) {
                            if (code < 0x1f17e) {
                                // E0.0   [4] (🅬..🅯)    RAISED MR SIGN..CIRCLED HUMAN FIGURE
                                // E0.6   [2] (🅰️..🅱️)    A button (blood type)..B button (blood type)
                                if (0x1f16c <= code && code <= 0x1f171) {
                                    return boundaries_1.EXTENDED_PICTOGRAPHIC;
                                }
                            }
                            else {
                                // E0.6   [2] (🅾️..🅿️)    O button (blood type)..P button
                                if (0x1f17e <= code && code <= 0x1f17f) {
                                    return boundaries_1.EXTENDED_PICTOGRAPHIC;
                                }
                            }
                        }
                        else {
                            if (code < 0x1f191) {
                                // E0.6   [1] (🆎)       AB button (blood type)
                                if (0x1f18e === code) {
                                    return boundaries_1.EXTENDED_PICTOGRAPHIC;
                                }
                            }
                            else {
                                if (code < 0x1f1ad) {
                                    // E0.6  [10] (🆑..🆚)    CL button..VS button
                                    if (0x1f191 <= code && code <= 0x1f19a) {
                                        return boundaries_1.EXTENDED_PICTOGRAPHIC;
                                    }
                                }
                                else {
                                    // E0.0  [57] (🆭..🇥)    MASK WORK SYMBOL..<reserved-1F1E5>
                                    if (0x1f1ad <= code && code <= 0x1f1e5) {
                                        return boundaries_1.EXTENDED_PICTOGRAPHIC;
                                    }
                                }
                            }
                        }
                    }
                }
            }
            else {
                if (code < 0x1f7d5) {
                    if (code < 0x1f249) {
                        if (code < 0x1f22f) {
                            if (code < 0x1f21a) {
                                // E0.6   [2] (🈁..🈂️)    Japanese “here” button..Japanese “service charge” button
                                // E0.0  [13] (🈃..🈏)    <reserved-1F203>..<reserved-1F20F>
                                if (0x1f201 <= code && code <= 0x1f20f) {
                                    return boundaries_1.EXTENDED_PICTOGRAPHIC;
                                }
                            }
                            else {
                                // E0.6   [1] (🈚)       Japanese “free of charge” button
                                if (0x1f21a === code) {
                                    return boundaries_1.EXTENDED_PICTOGRAPHIC;
                                }
                            }
                        }
                        else {
                            if (code < 0x1f232) {
                                // E0.6   [1] (🈯)       Japanese “reserved” button
                                if (0x1f22f === code) {
                                    return boundaries_1.EXTENDED_PICTOGRAPHIC;
                                }
                            }
                            else {
                                if (code < 0x1f23c) {
                                    // E0.6   [9] (🈲..🈺)    Japanese “prohibited” button..Japanese “open for business” button
                                    if (0x1f232 <= code && code <= 0x1f23a) {
                                        return boundaries_1.EXTENDED_PICTOGRAPHIC;
                                    }
                                }
                                else {
                                    // E0.0   [4] (🈼..🈿)    <reserved-1F23C>..<reserved-1F23F>
                                    if (0x1f23c <= code && code <= 0x1f23f) {
                                        return boundaries_1.EXTENDED_PICTOGRAPHIC;
                                    }
                                }
                            }
                        }
                    }
                    else {
                        if (code < 0x1f546) {
                            if (code < 0x1f400) {
                                // E0.0   [7] (🉉..🉏)    <reserved-1F249>..<reserved-1F24F>
                                // E0.6   [2] (🉐..🉑)    Japanese “bargain” button..Japanese “acceptable” button
                                // E0.0 [174] (🉒..🋿)    <reserved-1F252>..<reserved-1F2FF>
                                // E0.6  [13] (🌀..🌌)    cyclone..milky way
                                // E0.7   [2] (🌍..🌎)    globe showing Europe-Africa..globe showing Americas
                                // E0.6   [1] (🌏)       globe showing Asia-Australia
                                // E1.0   [1] (🌐)       globe with meridians
                                // E0.6   [1] (🌑)       new moon
                                // E1.0   [1] (🌒)       waxing crescent moon
                                // E0.6   [3] (🌓..🌕)    first quarter moon..full moon
                                // E1.0   [3] (🌖..🌘)    waning gibbous moon..waning crescent moon
                                // E0.6   [1] (🌙)       crescent moon
                                // E1.0   [1] (🌚)       new moon face
                                // E0.6   [1] (🌛)       first quarter moon face
                                // E0.7   [1] (🌜)       last quarter moon face
                                // E1.0   [2] (🌝..🌞)    full moon face..sun with face
                                // E0.6   [2] (🌟..🌠)    glowing star..shooting star
                                // E0.7   [1] (🌡️)       thermometer
                                // E0.0   [2] (🌢..🌣)    BLACK DROPLET..WHITE SUN
                                // E0.7   [9] (🌤️..🌬️)    sun behind small cloud..wind face
                                // E1.0   [3] (🌭..🌯)    hot dog..burrito
                                // E0.6   [2] (🌰..🌱)    chestnut..seedling
                                // E1.0   [2] (🌲..🌳)    evergreen tree..deciduous tree
                                // E0.6   [2] (🌴..🌵)    palm tree..cactus
                                // E0.7   [1] (🌶️)       hot pepper
                                // E0.6  [20] (🌷..🍊)    tulip..tangerine
                                // E1.0   [1] (🍋)       lemon
                                // E0.6   [4] (🍌..🍏)    banana..green apple
                                // E1.0   [1] (🍐)       pear
                                // E0.6  [43] (🍑..🍻)    peach..clinking beer mugs
                                // E1.0   [1] (🍼)       baby bottle
                                // E0.7   [1] (🍽️)       fork and knife with plate
                                // E1.0   [2] (🍾..🍿)    bottle with popping cork..popcorn
                                // E0.6  [20] (🎀..🎓)    ribbon..graduation cap
                                // E0.0   [2] (🎔..🎕)    HEART WITH TIP ON THE LEFT..BOUQUET OF FLOWERS
                                // E0.7   [2] (🎖️..🎗️)    military medal..reminder ribbon
                                // E0.0   [1] (🎘)       MUSICAL KEYBOARD WITH JACKS
                                // E0.7   [3] (🎙️..🎛️)    studio microphone..control knobs
                                // E0.0   [2] (🎜..🎝)    BEAMED ASCENDING MUSICAL NOTES..BEAMED DESCENDING MUSICAL NOTES
                                // E0.7   [2] (🎞️..🎟️)    film frames..admission tickets
                                // E0.6  [37] (🎠..🏄)    carousel horse..person surfing
                                // E1.0   [1] (🏅)       sports medal
                                // E0.6   [1] (🏆)       trophy
                                // E1.0   [1] (🏇)       horse racing
                                // E0.6   [1] (🏈)       american football
                                // E1.0   [1] (🏉)       rugby football
                                // E0.6   [1] (🏊)       person swimming
                                // E0.7   [4] (🏋️..🏎️)    person lifting weights..racing car
                                // E1.0   [5] (🏏..🏓)    cricket game..ping pong
                                // E0.7  [12] (🏔️..🏟️)    snow-capped mountain..stadium
                                // E0.6   [4] (🏠..🏣)    house..Japanese post office
                                // E1.0   [1] (🏤)       post office
                                // E0.6  [12] (🏥..🏰)    hospital..castle
                                // E0.0   [2] (🏱..🏲)    WHITE PENNANT..BLACK PENNANT
                                // E0.7   [1] (🏳️)       white flag
                                // E1.0   [1] (🏴)       black flag
                                // E0.7   [1] (🏵️)       rosette
                                // E0.0   [1] (🏶)       BLACK ROSETTE
                                // E0.7   [1] (🏷️)       label
                                // E1.0   [3] (🏸..🏺)    badminton..amphora
                                if (0x1f249 <= code && code <= 0x1f3fa) {
                                    return boundaries_1.EXTENDED_PICTOGRAPHIC;
                                }
                            }
                            else {
                                // E1.0   [8] (🐀..🐇)    rat..rabbit
                                // E0.7   [1] (🐈)       cat
                                // E1.0   [3] (🐉..🐋)    dragon..whale
                                // E0.6   [3] (🐌..🐎)    snail..horse
                                // E1.0   [2] (🐏..🐐)    ram..goat
                                // E0.6   [2] (🐑..🐒)    ewe..monkey
                                // E1.0   [1] (🐓)       rooster
                                // E0.6   [1] (🐔)       chicken
                                // E0.7   [1] (🐕)       dog
                                // E1.0   [1] (🐖)       pig
                                // E0.6  [19] (🐗..🐩)    boar..poodle
                                // E1.0   [1] (🐪)       camel
                                // E0.6  [20] (🐫..🐾)    two-hump camel..paw prints
                                // E0.7   [1] (🐿️)       chipmunk
                                // E0.6   [1] (👀)       eyes
                                // E0.7   [1] (👁️)       eye
                                // E0.6  [35] (👂..👤)    ear..bust in silhouette
                                // E1.0   [1] (👥)       busts in silhouette
                                // E0.6   [6] (👦..👫)    boy..woman and man holding hands
                                // E1.0   [2] (👬..👭)    men holding hands..women holding hands
                                // E0.6  [63] (👮..💬)    police officer..speech balloon
                                // E1.0   [1] (💭)       thought balloon
                                // E0.6   [8] (💮..💵)    white flower..dollar banknote
                                // E1.0   [2] (💶..💷)    euro banknote..pound banknote
                                // E0.6  [52] (💸..📫)    money with wings..closed mailbox with raised flag
                                // E0.7   [2] (📬..📭)    open mailbox with raised flag..open mailbox with lowered flag
                                // E0.6   [1] (📮)       postbox
                                // E1.0   [1] (📯)       postal horn
                                // E0.6   [5] (📰..📴)    newspaper..mobile phone off
                                // E1.0   [1] (📵)       no mobile phones
                                // E0.6   [2] (📶..📷)    antenna bars..camera
                                // E1.0   [1] (📸)       camera with flash
                                // E0.6   [4] (📹..📼)    video camera..videocassette
                                // E0.7   [1] (📽️)       film projector
                                // E0.0   [1] (📾)       PORTABLE STEREO
                                // E1.0   [4] (📿..🔂)    prayer beads..repeat single button
                                // E0.6   [1] (🔃)       clockwise vertical arrows
                                // E1.0   [4] (🔄..🔇)    counterclockwise arrows button..muted speaker
                                // E0.7   [1] (🔈)       speaker low volume
                                // E1.0   [1] (🔉)       speaker medium volume
                                // E0.6  [11] (🔊..🔔)    speaker high volume..bell
                                // E1.0   [1] (🔕)       bell with slash
                                // E0.6  [22] (🔖..🔫)    bookmark..pistol
                                // E1.0   [2] (🔬..🔭)    microscope..telescope
                                // E0.6  [16] (🔮..🔽)    crystal ball..downwards button
                                if (0x1f400 <= code && code <= 0x1f53d) {
                                    return boundaries_1.EXTENDED_PICTOGRAPHIC;
                                }
                            }
                        }
                        else {
                            if (code < 0x1f680) {
                                // E0.0   [3] (🕆..🕈)    WHITE LATIN CROSS..CELTIC CROSS
                                // E0.7   [2] (🕉️..🕊️)    om..dove
                                // E1.0   [4] (🕋..🕎)    kaaba..menorah
                                // E0.0   [1] (🕏)       BOWL OF HYGIEIA
                                // E0.6  [12] (🕐..🕛)    one o’clock..twelve o’clock
                                // E0.7  [12] (🕜..🕧)    one-thirty..twelve-thirty
                                // E0.0   [7] (🕨..🕮)    RIGHT SPEAKER..BOOK
                                // E0.7   [2] (🕯️..🕰️)    candle..mantelpiece clock
                                // E0.0   [2] (🕱..🕲)    BLACK SKULL AND CROSSBONES..NO PIRACY
                                // E0.7   [7] (🕳️..🕹️)    hole..joystick
                                // E3.0   [1] (🕺)       man dancing
                                // E0.0  [12] (🕻..🖆)    LEFT HAND TELEPHONE RECEIVER..PEN OVER STAMPED ENVELOPE
                                // E0.7   [1] (🖇️)       linked paperclips
                                // E0.0   [2] (🖈..🖉)    BLACK PUSHPIN..LOWER LEFT PENCIL
                                // E0.7   [4] (🖊️..🖍️)    pen..crayon
                                // E0.0   [2] (🖎..🖏)    LEFT WRITING HAND..TURNED OK HAND SIGN
                                // E0.7   [1] (🖐️)       hand with fingers splayed
                                // E0.0   [4] (🖑..🖔)    REVERSED RAISED HAND WITH FINGERS SPLAYED..REVERSED VICTORY HAND
                                // E1.0   [2] (🖕..🖖)    middle finger..vulcan salute
                                // E0.0  [13] (🖗..🖣)    WHITE DOWN POINTING LEFT HAND INDEX..BLACK DOWN POINTING BACKHAND INDEX
                                // E3.0   [1] (🖤)       black heart
                                // E0.7   [1] (🖥️)       desktop computer
                                // E0.0   [2] (🖦..🖧)    KEYBOARD AND MOUSE..THREE NETWORKED COMPUTERS
                                // E0.7   [1] (🖨️)       printer
                                // E0.0   [8] (🖩..🖰)    POCKET CALCULATOR..TWO BUTTON MOUSE
                                // E0.7   [2] (🖱️..🖲️)    computer mouse..trackball
                                // E0.0   [9] (🖳..🖻)    OLD PERSONAL COMPUTER..DOCUMENT WITH PICTURE
                                // E0.7   [1] (🖼️)       framed picture
                                // E0.0   [5] (🖽..🗁)    FRAME WITH TILES..OPEN FOLDER
                                // E0.7   [3] (🗂️..🗄️)    card index dividers..file cabinet
                                // E0.0  [12] (🗅..🗐)    EMPTY NOTE..PAGES
                                // E0.7   [3] (🗑️..🗓️)    wastebasket..spiral calendar
                                // E0.0   [8] (🗔..🗛)    DESKTOP WINDOW..DECREASE FONT SIZE SYMBOL
                                // E0.7   [3] (🗜️..🗞️)    clamp..rolled-up newspaper
                                // E0.0   [2] (🗟..🗠)    PAGE WITH CIRCLED TEXT..STOCK CHART
                                // E0.7   [1] (🗡️)       dagger
                                // E0.0   [1] (🗢)       LIPS
                                // E0.7   [1] (🗣️)       speaking head
                                // E0.0   [4] (🗤..🗧)    THREE RAYS ABOVE..THREE RAYS RIGHT
                                // E2.0   [1] (🗨️)       left speech bubble
                                // E0.0   [6] (🗩..🗮)    RIGHT SPEECH BUBBLE..LEFT ANGER BUBBLE
                                // E0.7   [1] (🗯️)       right anger bubble
                                // E0.0   [3] (🗰..🗲)    MOOD BUBBLE..LIGHTNING MOOD
                                // E0.7   [1] (🗳️)       ballot box with ballot
                                // E0.0   [6] (🗴..🗹)    BALLOT SCRIPT X..BALLOT BOX WITH BOLD CHECK
                                // E0.7   [1] (🗺️)       world map
                                // E0.6   [5] (🗻..🗿)    mount fuji..moai
                                // E1.0   [1] (😀)       grinning face
                                // E0.6   [6] (😁..😆)    beaming face with smiling eyes..grinning squinting face
                                // E1.0   [2] (😇..😈)    smiling face with halo..smiling face with horns
                                // E0.6   [5] (😉..😍)    winking face..smiling face with heart-eyes
                                // E1.0   [1] (😎)       smiling face with sunglasses
                                // E0.6   [1] (😏)       smirking face
                                // E0.7   [1] (😐)       neutral face
                                // E1.0   [1] (😑)       expressionless face
                                // E0.6   [3] (😒..😔)    unamused face..pensive face
                                // E1.0   [1] (😕)       confused face
                                // E0.6   [1] (😖)       confounded face
                                // E1.0   [1] (😗)       kissing face
                                // E0.6   [1] (😘)       face blowing a kiss
                                // E1.0   [1] (😙)       kissing face with smiling eyes
                                // E0.6   [1] (😚)       kissing face with closed eyes
                                // E1.0   [1] (😛)       face with tongue
                                // E0.6   [3] (😜..😞)    winking face with tongue..disappointed face
                                // E1.0   [1] (😟)       worried face
                                // E0.6   [6] (😠..😥)    angry face..sad but relieved face
                                // E1.0   [2] (😦..😧)    frowning face with open mouth..anguished face
                                // E0.6   [4] (😨..😫)    fearful face..tired face
                                // E1.0   [1] (😬)       grimacing face
                                // E0.6   [1] (😭)       loudly crying face
                                // E1.0   [2] (😮..😯)    face with open mouth..hushed face
                                // E0.6   [4] (😰..😳)    anxious face with sweat..flushed face
                                // E1.0   [1] (😴)       sleeping face
                                // E0.6   [1] (😵)       dizzy face
                                // E1.0   [1] (😶)       face without mouth
                                // E0.6  [10] (😷..🙀)    face with medical mask..weary cat
                                // E1.0   [4] (🙁..🙄)    slightly frowning face..face with rolling eyes
                                // E0.6  [11] (🙅..🙏)    person gesturing NO..folded hands
                                if (0x1f546 <= code && code <= 0x1f64f) {
                                    return boundaries_1.EXTENDED_PICTOGRAPHIC;
                                }
                            }
                            else {
                                if (code < 0x1f774) {
                                    // E0.6   [1] (🚀)       rocket
                                    // E1.0   [2] (🚁..🚂)    helicopter..locomotive
                                    // E0.6   [3] (🚃..🚅)    railway car..bullet train
                                    // E1.0   [1] (🚆)       train
                                    // E0.6   [1] (🚇)       metro
                                    // E1.0   [1] (🚈)       light rail
                                    // E0.6   [1] (🚉)       station
                                    // E1.0   [2] (🚊..🚋)    tram..tram car
                                    // E0.6   [1] (🚌)       bus
                                    // E0.7   [1] (🚍)       oncoming bus
                                    // E1.0   [1] (🚎)       trolleybus
                                    // E0.6   [1] (🚏)       bus stop
                                    // E1.0   [1] (🚐)       minibus
                                    // E0.6   [3] (🚑..🚓)    ambulance..police car
                                    // E0.7   [1] (🚔)       oncoming police car
                                    // E0.6   [1] (🚕)       taxi
                                    // E1.0   [1] (🚖)       oncoming taxi
                                    // E0.6   [1] (🚗)       automobile
                                    // E0.7   [1] (🚘)       oncoming automobile
                                    // E0.6   [2] (🚙..🚚)    sport utility vehicle..delivery truck
                                    // E1.0   [7] (🚛..🚡)    articulated lorry..aerial tramway
                                    // E0.6   [1] (🚢)       ship
                                    // E1.0   [1] (🚣)       person rowing boat
                                    // E0.6   [2] (🚤..🚥)    speedboat..horizontal traffic light
                                    // E1.0   [1] (🚦)       vertical traffic light
                                    // E0.6   [7] (🚧..🚭)    construction..no smoking
                                    // E1.0   [4] (🚮..🚱)    litter in bin sign..non-potable water
                                    // E0.6   [1] (🚲)       bicycle
                                    // E1.0   [3] (🚳..🚵)    no bicycles..person mountain biking
                                    // E0.6   [1] (🚶)       person walking
                                    // E1.0   [2] (🚷..🚸)    no pedestrians..children crossing
                                    // E0.6   [6] (🚹..🚾)    men’s room..water closet
                                    // E1.0   [1] (🚿)       shower
                                    // E0.6   [1] (🛀)       person taking bath
                                    // E1.0   [5] (🛁..🛅)    bathtub..left luggage
                                    // E0.0   [5] (🛆..🛊)    TRIANGLE WITH ROUNDED CORNERS..GIRLS SYMBOL
                                    // E0.7   [1] (🛋️)       couch and lamp
                                    // E1.0   [1] (🛌)       person in bed
                                    // E0.7   [3] (🛍️..🛏️)    shopping bags..bed
                                    // E1.0   [1] (🛐)       place of worship
                                    // E3.0   [2] (🛑..🛒)    stop sign..shopping cart
                                    // E0.0   [2] (🛓..🛔)    STUPA..PAGODA
                                    // E12.0  [1] (🛕)       hindu temple
                                    // E13.0  [2] (🛖..🛗)    hut..elevator
                                    // E0.0   [8] (🛘..🛟)    <reserved-1F6D8>..<reserved-1F6DF>
                                    // E0.7   [6] (🛠️..🛥️)    hammer and wrench..motor boat
                                    // E0.0   [3] (🛦..🛨)    UP-POINTING MILITARY AIRPLANE..UP-POINTING SMALL AIRPLANE
                                    // E0.7   [1] (🛩️)       small airplane
                                    // E0.0   [1] (🛪)       NORTHEAST-POINTING AIRPLANE
                                    // E1.0   [2] (🛫..🛬)    airplane departure..airplane arrival
                                    // E0.0   [3] (🛭..🛯)    <reserved-1F6ED>..<reserved-1F6EF>
                                    // E0.7   [1] (🛰️)       satellite
                                    // E0.0   [2] (🛱..🛲)    ONCOMING FIRE ENGINE..DIESEL LOCOMOTIVE
                                    // E0.7   [1] (🛳️)       passenger ship
                                    // E3.0   [3] (🛴..🛶)    kick scooter..canoe
                                    // E5.0   [2] (🛷..🛸)    sled..flying saucer
                                    // E11.0  [1] (🛹)       skateboard
                                    // E12.0  [1] (🛺)       auto rickshaw
                                    // E13.0  [2] (🛻..🛼)    pickup truck..roller skate
                                    // E0.0   [3] (🛽..🛿)    <reserved-1F6FD>..<reserved-1F6FF>
                                    if (0x1f680 <= code && code <= 0x1f6ff) {
                                        return boundaries_1.EXTENDED_PICTOGRAPHIC;
                                    }
                                }
                                else {
                                    // E0.0  [12] (🝴..🝿)    <reserved-1F774>..<reserved-1F77F>
                                    if (0x1f774 <= code && code <= 0x1f77f) {
                                        return boundaries_1.EXTENDED_PICTOGRAPHIC;
                                    }
                                }
                            }
                        }
                    }
                }
                else {
                    if (code < 0x1f8ae) {
                        if (code < 0x1f848) {
                            if (code < 0x1f80c) {
                                // E0.0  [11] (🟕..🟟)    CIRCLED TRIANGLE..<reserved-1F7DF>
                                // E12.0 [12] (🟠..🟫)    orange circle..brown square
                                // E0.0  [20] (🟬..🟿)    <reserved-1F7EC>..<reserved-1F7FF>
                                if (0x1f7d5 <= code && code <= 0x1f7ff) {
                                    return boundaries_1.EXTENDED_PICTOGRAPHIC;
                                }
                            }
                            else {
                                // E0.0   [4] (🠌..🠏)    <reserved-1F80C>..<reserved-1F80F>
                                if (0x1f80c <= code && code <= 0x1f80f) {
                                    return boundaries_1.EXTENDED_PICTOGRAPHIC;
                                }
                            }
                        }
                        else {
                            if (code < 0x1f85a) {
                                // E0.0   [8] (🡈..🡏)    <reserved-1F848>..<reserved-1F84F>
                                if (0x1f848 <= code && code <= 0x1f84f) {
                                    return boundaries_1.EXTENDED_PICTOGRAPHIC;
                                }
                            }
                            else {
                                if (code < 0x1f888) {
                                    // E0.0   [6] (🡚..🡟)    <reserved-1F85A>..<reserved-1F85F>
                                    if (0x1f85a <= code && code <= 0x1f85f) {
                                        return boundaries_1.EXTENDED_PICTOGRAPHIC;
                                    }
                                }
                                else {
                                    // E0.0   [8] (🢈..🢏)    <reserved-1F888>..<reserved-1F88F>
                                    if (0x1f888 <= code && code <= 0x1f88f) {
                                        return boundaries_1.EXTENDED_PICTOGRAPHIC;
                                    }
                                }
                            }
                        }
                    }
                    else {
                        if (code < 0x1f93c) {
                            if (code < 0x1f90c) {
                                // E0.0  [82] (🢮..🣿)    <reserved-1F8AE>..<reserved-1F8FF>
                                if (0x1f8ae <= code && code <= 0x1f8ff) {
                                    return boundaries_1.EXTENDED_PICTOGRAPHIC;
                                }
                            }
                            else {
                                // E13.0  [1] (🤌)       pinched fingers
                                // E12.0  [3] (🤍..🤏)    white heart..pinching hand
                                // E1.0   [9] (🤐..🤘)    zipper-mouth face..sign of the horns
                                // E3.0   [6] (🤙..🤞)    call me hand..crossed fingers
                                // E5.0   [1] (🤟)       love-you gesture
                                // E3.0   [8] (🤠..🤧)    cowboy hat face..sneezing face
                                // E5.0   [8] (🤨..🤯)    face with raised eyebrow..exploding head
                                // E3.0   [1] (🤰)       pregnant woman
                                // E5.0   [2] (🤱..🤲)    breast-feeding..palms up together
                                // E3.0   [8] (🤳..🤺)    selfie..person fencing
                                if (0x1f90c <= code && code <= 0x1f93a) {
                                    return boundaries_1.EXTENDED_PICTOGRAPHIC;
                                }
                            }
                        }
                        else {
                            if (code < 0x1f947) {
                                // E3.0   [3] (🤼..🤾)    people wrestling..person playing handball
                                // E12.0  [1] (🤿)       diving mask
                                // E3.0   [6] (🥀..🥅)    wilted flower..goal net
                                if (0x1f93c <= code && code <= 0x1f945) {
                                    return boundaries_1.EXTENDED_PICTOGRAPHIC;
                                }
                            }
                            else {
                                if (code < 0x1fc00) {
                                    // E3.0   [5] (🥇..🥋)    1st place medal..martial arts uniform
                                    // E5.0   [1] (🥌)       curling stone
                                    // E11.0  [3] (🥍..🥏)    lacrosse..flying disc
                                    // E3.0  [15] (🥐..🥞)    croissant..pancakes
                                    // E5.0  [13] (🥟..🥫)    dumpling..canned food
                                    // E11.0  [5] (🥬..🥰)    leafy green..smiling face with hearts
                                    // E12.0  [1] (🥱)       yawning face
                                    // E13.0  [1] (🥲)       smiling face with tear
                                    // E11.0  [4] (🥳..🥶)    partying face..cold face
                                    // E13.0  [2] (🥷..🥸)    ninja..disguised face
                                    // E0.0   [1] (🥹)       <reserved-1F979>
                                    // E11.0  [1] (🥺)       pleading face
                                    // E12.0  [1] (🥻)       sari
                                    // E11.0  [4] (🥼..🥿)    lab coat..flat shoe
                                    // E1.0   [5] (🦀..🦄)    crab..unicorn
                                    // E3.0  [13] (🦅..🦑)    eagle..squid
                                    // E5.0   [6] (🦒..🦗)    giraffe..cricket
                                    // E11.0 [11] (🦘..🦢)    kangaroo..swan
                                    // E13.0  [2] (🦣..🦤)    mammoth..dodo
                                    // E12.0  [6] (🦥..🦪)    sloth..oyster
                                    // E13.0  [3] (🦫..🦭)    beaver..seal
                                    // E12.0  [2] (🦮..🦯)    guide dog..white cane
                                    // E11.0 [10] (🦰..🦹)    red hair..supervillain
                                    // E12.0  [6] (🦺..🦿)    safety vest..mechanical leg
                                    // E1.0   [1] (🧀)       cheese wedge
                                    // E11.0  [2] (🧁..🧂)    cupcake..salt
                                    // E12.0  [8] (🧃..🧊)    beverage box..ice
                                    // E13.0  [1] (🧋)       bubble tea
                                    // E0.0   [1] (🧌)       <reserved-1F9CC>
                                    // E12.0  [3] (🧍..🧏)    person standing..deaf person
                                    // E5.0  [23] (🧐..🧦)    face with monocle..socks
                                    // E11.0 [25] (🧧..🧿)    red envelope..nazar amulet
                                    // E0.0 [112] (🨀..🩯)    NEUTRAL CHESS KING..<reserved-1FA6F>
                                    // E12.0  [4] (🩰..🩳)    ballet shoes..shorts
                                    // E13.0  [1] (🩴)       thong sandal
                                    // E0.0   [3] (🩵..🩷)    <reserved-1FA75>..<reserved-1FA77>
                                    // E12.0  [3] (🩸..🩺)    drop of blood..stethoscope
                                    // E0.0   [5] (🩻..🩿)    <reserved-1FA7B>..<reserved-1FA7F>
                                    // E12.0  [3] (🪀..🪂)    yo-yo..parachute
                                    // E13.0  [4] (🪃..🪆)    boomerang..nesting dolls
                                    // E0.0   [9] (🪇..🪏)    <reserved-1FA87>..<reserved-1FA8F>
                                    // E12.0  [6] (🪐..🪕)    ringed planet..banjo
                                    // E13.0 [19] (🪖..🪨)    military helmet..rock
                                    // E0.0   [7] (🪩..🪯)    <reserved-1FAA9>..<reserved-1FAAF>
                                    // E13.0  [7] (🪰..🪶)    fly..feather
                                    // E0.0   [9] (🪷..🪿)    <reserved-1FAB7>..<reserved-1FABF>
                                    // E13.0  [3] (🫀..🫂)    anatomical heart..people hugging
                                    // E0.0  [13] (🫃..🫏)    <reserved-1FAC3>..<reserved-1FACF>
                                    // E13.0  [7] (🫐..🫖)    blueberries..teapot
                                    // E0.0  [41] (🫗..🫿)    <reserved-1FAD7>..<reserved-1FAFF>
                                    if (0x1f947 <= code && code <= 0x1faff) {
                                        return boundaries_1.EXTENDED_PICTOGRAPHIC;
                                    }
                                }
                                else {
                                    // E0.0[1022] (🰀..🿽)    <reserved-1FC00>..<reserved-1FFFD>
                                    if (0x1fc00 <= code && code <= 0x1fffd) {
                                        return boundaries_1.EXTENDED_PICTOGRAPHIC;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        // unlisted emoji treated as a break property of "Other"
        return boundaries_1.CLUSTER_BREAK.OTHER;
    }
}
exports.default = Graphemer;


/***/ }),

/***/ 257:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
const boundaries_1 = __webpack_require__(658);
// BreakTypes
// @type {BreakType}
const NotBreak = 0;
const BreakStart = 1;
const Break = 2;
const BreakLastRegional = 3;
const BreakPenultimateRegional = 4;
class GraphemerHelper {
    /**
     * Check if the the character at the position {pos} of the string is surrogate
     * @param str {string}
     * @param pos {number}
     * @returns {boolean}
     */
    static isSurrogate(str, pos) {
        return (0xd800 <= str.charCodeAt(pos) &&
            str.charCodeAt(pos) <= 0xdbff &&
            0xdc00 <= str.charCodeAt(pos + 1) &&
            str.charCodeAt(pos + 1) <= 0xdfff);
    }
    /**
     * The String.prototype.codePointAt polyfill
     * Private function, gets a Unicode code point from a JavaScript UTF-16 string
     * handling surrogate pairs appropriately
     * @param str {string}
     * @param idx {number}
     * @returns {number}
     */
    static codePointAt(str, idx) {
        if (idx === undefined) {
            idx = 0;
        }
        const code = str.charCodeAt(idx);
        // if a high surrogate
        if (0xd800 <= code && code <= 0xdbff && idx < str.length - 1) {
            const hi = code;
            const low = str.charCodeAt(idx + 1);
            if (0xdc00 <= low && low <= 0xdfff) {
                return (hi - 0xd800) * 0x400 + (low - 0xdc00) + 0x10000;
            }
            return hi;
        }
        // if a low surrogate
        if (0xdc00 <= code && code <= 0xdfff && idx >= 1) {
            const hi = str.charCodeAt(idx - 1);
            const low = code;
            if (0xd800 <= hi && hi <= 0xdbff) {
                return (hi - 0xd800) * 0x400 + (low - 0xdc00) + 0x10000;
            }
            return low;
        }
        // just return the char if an unmatched surrogate half or a
        // single-char codepoint
        return code;
    }
    //
    /**
     * Private function, returns whether a break is allowed between the two given grapheme breaking classes
     * Implemented the UAX #29 3.1.1 Grapheme Cluster Boundary Rules on extended grapheme clusters
     * @param start {number}
     * @param mid {Array<number>}
     * @param end {number}
     * @param startEmoji {number}
     * @param midEmoji {Array<number>}
     * @param endEmoji {number}
     * @returns {number}
     */
    static shouldBreak(start, mid, end, startEmoji, midEmoji, endEmoji) {
        const all = [start].concat(mid).concat([end]);
        const allEmoji = [startEmoji].concat(midEmoji).concat([endEmoji]);
        const previous = all[all.length - 2];
        const next = end;
        const nextEmoji = endEmoji;
        // Lookahead terminator for:
        // GB12. ^ (RI RI)* RI ? RI
        // GB13. [^RI] (RI RI)* RI ? RI
        const rIIndex = all.lastIndexOf(boundaries_1.CLUSTER_BREAK.REGIONAL_INDICATOR);
        if (rIIndex > 0 &&
            all.slice(1, rIIndex).every(function (c) {
                return c === boundaries_1.CLUSTER_BREAK.REGIONAL_INDICATOR;
            }) &&
            [boundaries_1.CLUSTER_BREAK.PREPEND, boundaries_1.CLUSTER_BREAK.REGIONAL_INDICATOR].indexOf(previous) === -1) {
            if (all.filter(function (c) {
                return c === boundaries_1.CLUSTER_BREAK.REGIONAL_INDICATOR;
            }).length %
                2 ===
                1) {
                return BreakLastRegional;
            }
            else {
                return BreakPenultimateRegional;
            }
        }
        // GB3. CR × LF
        if (previous === boundaries_1.CLUSTER_BREAK.CR && next === boundaries_1.CLUSTER_BREAK.LF) {
            return NotBreak;
        }
        // GB4. (Control|CR|LF) ÷
        else if (previous === boundaries_1.CLUSTER_BREAK.CONTROL ||
            previous === boundaries_1.CLUSTER_BREAK.CR ||
            previous === boundaries_1.CLUSTER_BREAK.LF) {
            return BreakStart;
        }
        // GB5. ÷ (Control|CR|LF)
        else if (next === boundaries_1.CLUSTER_BREAK.CONTROL ||
            next === boundaries_1.CLUSTER_BREAK.CR ||
            next === boundaries_1.CLUSTER_BREAK.LF) {
            return BreakStart;
        }
        // GB6. L × (L|V|LV|LVT)
        else if (previous === boundaries_1.CLUSTER_BREAK.L &&
            (next === boundaries_1.CLUSTER_BREAK.L ||
                next === boundaries_1.CLUSTER_BREAK.V ||
                next === boundaries_1.CLUSTER_BREAK.LV ||
                next === boundaries_1.CLUSTER_BREAK.LVT)) {
            return NotBreak;
        }
        // GB7. (LV|V) × (V|T)
        else if ((previous === boundaries_1.CLUSTER_BREAK.LV || previous === boundaries_1.CLUSTER_BREAK.V) &&
            (next === boundaries_1.CLUSTER_BREAK.V || next === boundaries_1.CLUSTER_BREAK.T)) {
            return NotBreak;
        }
        // GB8. (LVT|T) × (T)
        else if ((previous === boundaries_1.CLUSTER_BREAK.LVT || previous === boundaries_1.CLUSTER_BREAK.T) &&
            next === boundaries_1.CLUSTER_BREAK.T) {
            return NotBreak;
        }
        // GB9. × (Extend|ZWJ)
        else if (next === boundaries_1.CLUSTER_BREAK.EXTEND || next === boundaries_1.CLUSTER_BREAK.ZWJ) {
            return NotBreak;
        }
        // GB9a. × SpacingMark
        else if (next === boundaries_1.CLUSTER_BREAK.SPACINGMARK) {
            return NotBreak;
        }
        // GB9b. Prepend ×
        else if (previous === boundaries_1.CLUSTER_BREAK.PREPEND) {
            return NotBreak;
        }
        // GB11. \p{Extended_Pictographic} Extend* ZWJ × \p{Extended_Pictographic}
        const previousNonExtendIndex = allEmoji
            .slice(0, -1)
            .lastIndexOf(boundaries_1.EXTENDED_PICTOGRAPHIC);
        if (previousNonExtendIndex !== -1 &&
            allEmoji[previousNonExtendIndex] === boundaries_1.EXTENDED_PICTOGRAPHIC &&
            all.slice(previousNonExtendIndex + 1, -2).every(function (c) {
                return c === boundaries_1.CLUSTER_BREAK.EXTEND;
            }) &&
            previous === boundaries_1.CLUSTER_BREAK.ZWJ &&
            nextEmoji === boundaries_1.EXTENDED_PICTOGRAPHIC) {
            return NotBreak;
        }
        // GB12. ^ (RI RI)* RI × RI
        // GB13. [^RI] (RI RI)* RI × RI
        if (mid.indexOf(boundaries_1.CLUSTER_BREAK.REGIONAL_INDICATOR) !== -1) {
            return Break;
        }
        if (previous === boundaries_1.CLUSTER_BREAK.REGIONAL_INDICATOR &&
            next === boundaries_1.CLUSTER_BREAK.REGIONAL_INDICATOR) {
            return NotBreak;
        }
        // GB999. Any ? Any
        return BreakStart;
    }
}
exports.default = GraphemerHelper;


/***/ }),

/***/ 670:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
const Graphemer_1 = __importDefault(__webpack_require__(553));
/**
 * GraphemerIterator
 *
 * Takes a string and a "BreakHandler" method during initialisation
 * and creates an iterable object that returns individual graphemes.
 *
 * @param str {string}
 * @return GraphemerIterator
 */
class GraphemerIterator {
    constructor(str) {
        this._index = 0;
        this._str = str;
    }
    [Symbol.iterator]() {
        return this;
    }
    next() {
        let brk;
        if ((brk = Graphemer_1.default.nextBreak(this._str, this._index)) < this._str.length) {
            const value = this._str.slice(this._index, brk);
            this._index = brk;
            return { value: value, done: false };
        }
        if (this._index < this._str.length) {
            const value = this._str.slice(this._index);
            this._index = this._str.length;
            return { value: value, done: false };
        }
        return { value: undefined, done: true };
    }
}
exports.default = GraphemerIterator;


/***/ }),

/***/ 658:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

/**
 * The Grapheme_Cluster_Break property value
 * @see https://www.unicode.org/reports/tr29/#Default_Grapheme_Cluster_Table
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.EXTENDED_PICTOGRAPHIC = exports.CLUSTER_BREAK = void 0;
var CLUSTER_BREAK;
(function (CLUSTER_BREAK) {
    CLUSTER_BREAK[CLUSTER_BREAK["CR"] = 0] = "CR";
    CLUSTER_BREAK[CLUSTER_BREAK["LF"] = 1] = "LF";
    CLUSTER_BREAK[CLUSTER_BREAK["CONTROL"] = 2] = "CONTROL";
    CLUSTER_BREAK[CLUSTER_BREAK["EXTEND"] = 3] = "EXTEND";
    CLUSTER_BREAK[CLUSTER_BREAK["REGIONAL_INDICATOR"] = 4] = "REGIONAL_INDICATOR";
    CLUSTER_BREAK[CLUSTER_BREAK["SPACINGMARK"] = 5] = "SPACINGMARK";
    CLUSTER_BREAK[CLUSTER_BREAK["L"] = 6] = "L";
    CLUSTER_BREAK[CLUSTER_BREAK["V"] = 7] = "V";
    CLUSTER_BREAK[CLUSTER_BREAK["T"] = 8] = "T";
    CLUSTER_BREAK[CLUSTER_BREAK["LV"] = 9] = "LV";
    CLUSTER_BREAK[CLUSTER_BREAK["LVT"] = 10] = "LVT";
    CLUSTER_BREAK[CLUSTER_BREAK["OTHER"] = 11] = "OTHER";
    CLUSTER_BREAK[CLUSTER_BREAK["PREPEND"] = 12] = "PREPEND";
    CLUSTER_BREAK[CLUSTER_BREAK["E_BASE"] = 13] = "E_BASE";
    CLUSTER_BREAK[CLUSTER_BREAK["E_MODIFIER"] = 14] = "E_MODIFIER";
    CLUSTER_BREAK[CLUSTER_BREAK["ZWJ"] = 15] = "ZWJ";
    CLUSTER_BREAK[CLUSTER_BREAK["GLUE_AFTER_ZWJ"] = 16] = "GLUE_AFTER_ZWJ";
    CLUSTER_BREAK[CLUSTER_BREAK["E_BASE_GAZ"] = 17] = "E_BASE_GAZ";
})(CLUSTER_BREAK = exports.CLUSTER_BREAK || (exports.CLUSTER_BREAK = {}));
/**
 * The Emoji character property is an extension of UCD but shares the same namespace and structure
 * @see http://www.unicode.org/reports/tr51/tr51-14.html#Emoji_Properties_and_Data_Files
 *
 * Here we model Extended_Pictograhpic only to implement UAX #29 GB11
 * \p{Extended_Pictographic} Extend* ZWJ	×	\p{Extended_Pictographic}
 *
 * The Emoji character property should not be mixed with Grapheme_Cluster_Break since they are not exclusive
 */
exports.EXTENDED_PICTOGRAPHIC = 101;


/***/ }),

/***/ 777:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
const Graphemer_1 = __importDefault(__webpack_require__(553));
exports.default = Graphemer_1.default;


/***/ }),

/***/ 593:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


// A linked list to keep track of recently-used-ness
const Yallist = __webpack_require__(411)

const MAX = Symbol('max')
const LENGTH = Symbol('length')
const LENGTH_CALCULATOR = Symbol('lengthCalculator')
const ALLOW_STALE = Symbol('allowStale')
const MAX_AGE = Symbol('maxAge')
const DISPOSE = Symbol('dispose')
const NO_DISPOSE_ON_SET = Symbol('noDisposeOnSet')
const LRU_LIST = Symbol('lruList')
const CACHE = Symbol('cache')
const UPDATE_AGE_ON_GET = Symbol('updateAgeOnGet')

const naiveLength = () => 1

// lruList is a yallist where the head is the youngest
// item, and the tail is the oldest.  the list contains the Hit
// objects as the entries.
// Each Hit object has a reference to its Yallist.Node.  This
// never changes.
//
// cache is a Map (or PseudoMap) that matches the keys to
// the Yallist.Node object.
class LRUCache {
  constructor (options) {
    if (typeof options === 'number')
      options = { max: options }

    if (!options)
      options = {}

    if (options.max && (typeof options.max !== 'number' || options.max < 0))
      throw new TypeError('max must be a non-negative number')
    // Kind of weird to have a default max of Infinity, but oh well.
    const max = this[MAX] = options.max || Infinity

    const lc = options.length || naiveLength
    this[LENGTH_CALCULATOR] = (typeof lc !== 'function') ? naiveLength : lc
    this[ALLOW_STALE] = options.stale || false
    if (options.maxAge && typeof options.maxAge !== 'number')
      throw new TypeError('maxAge must be a number')
    this[MAX_AGE] = options.maxAge || 0
    this[DISPOSE] = options.dispose
    this[NO_DISPOSE_ON_SET] = options.noDisposeOnSet || false
    this[UPDATE_AGE_ON_GET] = options.updateAgeOnGet || false
    this.reset()
  }

  // resize the cache when the max changes.
  set max (mL) {
    if (typeof mL !== 'number' || mL < 0)
      throw new TypeError('max must be a non-negative number')

    this[MAX] = mL || Infinity
    trim(this)
  }
  get max () {
    return this[MAX]
  }

  set allowStale (allowStale) {
    this[ALLOW_STALE] = !!allowStale
  }
  get allowStale () {
    return this[ALLOW_STALE]
  }

  set maxAge (mA) {
    if (typeof mA !== 'number')
      throw new TypeError('maxAge must be a non-negative number')

    this[MAX_AGE] = mA
    trim(this)
  }
  get maxAge () {
    return this[MAX_AGE]
  }

  // resize the cache when the lengthCalculator changes.
  set lengthCalculator (lC) {
    if (typeof lC !== 'function')
      lC = naiveLength

    if (lC !== this[LENGTH_CALCULATOR]) {
      this[LENGTH_CALCULATOR] = lC
      this[LENGTH] = 0
      this[LRU_LIST].forEach(hit => {
        hit.length = this[LENGTH_CALCULATOR](hit.value, hit.key)
        this[LENGTH] += hit.length
      })
    }
    trim(this)
  }
  get lengthCalculator () { return this[LENGTH_CALCULATOR] }

  get length () { return this[LENGTH] }
  get itemCount () { return this[LRU_LIST].length }

  rforEach (fn, thisp) {
    thisp = thisp || this
    for (let walker = this[LRU_LIST].tail; walker !== null;) {
      const prev = walker.prev
      forEachStep(this, fn, walker, thisp)
      walker = prev
    }
  }

  forEach (fn, thisp) {
    thisp = thisp || this
    for (let walker = this[LRU_LIST].head; walker !== null;) {
      const next = walker.next
      forEachStep(this, fn, walker, thisp)
      walker = next
    }
  }

  keys () {
    return this[LRU_LIST].toArray().map(k => k.key)
  }

  values () {
    return this[LRU_LIST].toArray().map(k => k.value)
  }

  reset () {
    if (this[DISPOSE] &&
        this[LRU_LIST] &&
        this[LRU_LIST].length) {
      this[LRU_LIST].forEach(hit => this[DISPOSE](hit.key, hit.value))
    }

    this[CACHE] = new Map() // hash of items by key
    this[LRU_LIST] = new Yallist() // list of items in order of use recency
    this[LENGTH] = 0 // length of items in the list
  }

  dump () {
    return this[LRU_LIST].map(hit =>
      isStale(this, hit) ? false : {
        k: hit.key,
        v: hit.value,
        e: hit.now + (hit.maxAge || 0)
      }).toArray().filter(h => h)
  }

  dumpLru () {
    return this[LRU_LIST]
  }

  set (key, value, maxAge) {
    maxAge = maxAge || this[MAX_AGE]

    if (maxAge && typeof maxAge !== 'number')
      throw new TypeError('maxAge must be a number')

    const now = maxAge ? Date.now() : 0
    const len = this[LENGTH_CALCULATOR](value, key)

    if (this[CACHE].has(key)) {
      if (len > this[MAX]) {
        del(this, this[CACHE].get(key))
        return false
      }

      const node = this[CACHE].get(key)
      const item = node.value

      // dispose of the old one before overwriting
      // split out into 2 ifs for better coverage tracking
      if (this[DISPOSE]) {
        if (!this[NO_DISPOSE_ON_SET])
          this[DISPOSE](key, item.value)
      }

      item.now = now
      item.maxAge = maxAge
      item.value = value
      this[LENGTH] += len - item.length
      item.length = len
      this.get(key)
      trim(this)
      return true
    }

    const hit = new Entry(key, value, len, now, maxAge)

    // oversized objects fall out of cache automatically.
    if (hit.length > this[MAX]) {
      if (this[DISPOSE])
        this[DISPOSE](key, value)

      return false
    }

    this[LENGTH] += hit.length
    this[LRU_LIST].unshift(hit)
    this[CACHE].set(key, this[LRU_LIST].head)
    trim(this)
    return true
  }

  has (key) {
    if (!this[CACHE].has(key)) return false
    const hit = this[CACHE].get(key).value
    return !isStale(this, hit)
  }

  get (key) {
    return get(this, key, true)
  }

  peek (key) {
    return get(this, key, false)
  }

  pop () {
    const node = this[LRU_LIST].tail
    if (!node)
      return null

    del(this, node)
    return node.value
  }

  del (key) {
    del(this, this[CACHE].get(key))
  }

  load (arr) {
    // reset the cache
    this.reset()

    const now = Date.now()
    // A previous serialized cache has the most recent items first
    for (let l = arr.length - 1; l >= 0; l--) {
      const hit = arr[l]
      const expiresAt = hit.e || 0
      if (expiresAt === 0)
        // the item was created without expiration in a non aged cache
        this.set(hit.k, hit.v)
      else {
        const maxAge = expiresAt - now
        // dont add already expired items
        if (maxAge > 0) {
          this.set(hit.k, hit.v, maxAge)
        }
      }
    }
  }

  prune () {
    this[CACHE].forEach((value, key) => get(this, key, false))
  }
}

const get = (self, key, doUse) => {
  const node = self[CACHE].get(key)
  if (node) {
    const hit = node.value
    if (isStale(self, hit)) {
      del(self, node)
      if (!self[ALLOW_STALE])
        return undefined
    } else {
      if (doUse) {
        if (self[UPDATE_AGE_ON_GET])
          node.value.now = Date.now()
        self[LRU_LIST].unshiftNode(node)
      }
    }
    return hit.value
  }
}

const isStale = (self, hit) => {
  if (!hit || (!hit.maxAge && !self[MAX_AGE]))
    return false

  const diff = Date.now() - hit.now
  return hit.maxAge ? diff > hit.maxAge
    : self[MAX_AGE] && (diff > self[MAX_AGE])
}

const trim = self => {
  if (self[LENGTH] > self[MAX]) {
    for (let walker = self[LRU_LIST].tail;
      self[LENGTH] > self[MAX] && walker !== null;) {
      // We know that we're about to delete this one, and also
      // what the next least recently used key will be, so just
      // go ahead and set it now.
      const prev = walker.prev
      del(self, walker)
      walker = prev
    }
  }
}

const del = (self, node) => {
  if (node) {
    const hit = node.value
    if (self[DISPOSE])
      self[DISPOSE](hit.key, hit.value)

    self[LENGTH] -= hit.length
    self[CACHE].delete(hit.key)
    self[LRU_LIST].removeNode(node)
  }
}

class Entry {
  constructor (key, value, length, now, maxAge) {
    this.key = key
    this.value = value
    this.length = length
    this.now = now
    this.maxAge = maxAge || 0
  }
}

const forEachStep = (self, fn, node, thisp) => {
  let hit = node.value
  if (isStale(self, hit)) {
    del(self, node)
    if (!self[ALLOW_STALE])
      hit = undefined
  }
  if (hit)
    fn.call(thisp, hit.value, hit.key, self)
}

module.exports = LRUCache


/***/ }),

/***/ 602:
/***/ ((module) => {

"use strict";

module.exports = function (Yallist) {
  Yallist.prototype[Symbol.iterator] = function* () {
    for (let walker = this.head; walker; walker = walker.next) {
      yield walker.value
    }
  }
}


/***/ }),

/***/ 411:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

module.exports = Yallist

Yallist.Node = Node
Yallist.create = Yallist

function Yallist (list) {
  var self = this
  if (!(self instanceof Yallist)) {
    self = new Yallist()
  }

  self.tail = null
  self.head = null
  self.length = 0

  if (list && typeof list.forEach === 'function') {
    list.forEach(function (item) {
      self.push(item)
    })
  } else if (arguments.length > 0) {
    for (var i = 0, l = arguments.length; i < l; i++) {
      self.push(arguments[i])
    }
  }

  return self
}

Yallist.prototype.removeNode = function (node) {
  if (node.list !== this) {
    throw new Error('removing node which does not belong to this list')
  }

  var next = node.next
  var prev = node.prev

  if (next) {
    next.prev = prev
  }

  if (prev) {
    prev.next = next
  }

  if (node === this.head) {
    this.head = next
  }
  if (node === this.tail) {
    this.tail = prev
  }

  node.list.length--
  node.next = null
  node.prev = null
  node.list = null

  return next
}

Yallist.prototype.unshiftNode = function (node) {
  if (node === this.head) {
    return
  }

  if (node.list) {
    node.list.removeNode(node)
  }

  var head = this.head
  node.list = this
  node.next = head
  if (head) {
    head.prev = node
  }

  this.head = node
  if (!this.tail) {
    this.tail = node
  }
  this.length++
}

Yallist.prototype.pushNode = function (node) {
  if (node === this.tail) {
    return
  }

  if (node.list) {
    node.list.removeNode(node)
  }

  var tail = this.tail
  node.list = this
  node.prev = tail
  if (tail) {
    tail.next = node
  }

  this.tail = node
  if (!this.head) {
    this.head = node
  }
  this.length++
}

Yallist.prototype.push = function () {
  for (var i = 0, l = arguments.length; i < l; i++) {
    push(this, arguments[i])
  }
  return this.length
}

Yallist.prototype.unshift = function () {
  for (var i = 0, l = arguments.length; i < l; i++) {
    unshift(this, arguments[i])
  }
  return this.length
}

Yallist.prototype.pop = function () {
  if (!this.tail) {
    return undefined
  }

  var res = this.tail.value
  this.tail = this.tail.prev
  if (this.tail) {
    this.tail.next = null
  } else {
    this.head = null
  }
  this.length--
  return res
}

Yallist.prototype.shift = function () {
  if (!this.head) {
    return undefined
  }

  var res = this.head.value
  this.head = this.head.next
  if (this.head) {
    this.head.prev = null
  } else {
    this.tail = null
  }
  this.length--
  return res
}

Yallist.prototype.forEach = function (fn, thisp) {
  thisp = thisp || this
  for (var walker = this.head, i = 0; walker !== null; i++) {
    fn.call(thisp, walker.value, i, this)
    walker = walker.next
  }
}

Yallist.prototype.forEachReverse = function (fn, thisp) {
  thisp = thisp || this
  for (var walker = this.tail, i = this.length - 1; walker !== null; i--) {
    fn.call(thisp, walker.value, i, this)
    walker = walker.prev
  }
}

Yallist.prototype.get = function (n) {
  for (var i = 0, walker = this.head; walker !== null && i < n; i++) {
    // abort out of the list early if we hit a cycle
    walker = walker.next
  }
  if (i === n && walker !== null) {
    return walker.value
  }
}

Yallist.prototype.getReverse = function (n) {
  for (var i = 0, walker = this.tail; walker !== null && i < n; i++) {
    // abort out of the list early if we hit a cycle
    walker = walker.prev
  }
  if (i === n && walker !== null) {
    return walker.value
  }
}

Yallist.prototype.map = function (fn, thisp) {
  thisp = thisp || this
  var res = new Yallist()
  for (var walker = this.head; walker !== null;) {
    res.push(fn.call(thisp, walker.value, this))
    walker = walker.next
  }
  return res
}

Yallist.prototype.mapReverse = function (fn, thisp) {
  thisp = thisp || this
  var res = new Yallist()
  for (var walker = this.tail; walker !== null;) {
    res.push(fn.call(thisp, walker.value, this))
    walker = walker.prev
  }
  return res
}

Yallist.prototype.reduce = function (fn, initial) {
  var acc
  var walker = this.head
  if (arguments.length > 1) {
    acc = initial
  } else if (this.head) {
    walker = this.head.next
    acc = this.head.value
  } else {
    throw new TypeError('Reduce of empty list with no initial value')
  }

  for (var i = 0; walker !== null; i++) {
    acc = fn(acc, walker.value, i)
    walker = walker.next
  }

  return acc
}

Yallist.prototype.reduceReverse = function (fn, initial) {
  var acc
  var walker = this.tail
  if (arguments.length > 1) {
    acc = initial
  } else if (this.tail) {
    walker = this.tail.prev
    acc = this.tail.value
  } else {
    throw new TypeError('Reduce of empty list with no initial value')
  }

  for (var i = this.length - 1; walker !== null; i--) {
    acc = fn(acc, walker.value, i)
    walker = walker.prev
  }

  return acc
}

Yallist.prototype.toArray = function () {
  var arr = new Array(this.length)
  for (var i = 0, walker = this.head; walker !== null; i++) {
    arr[i] = walker.value
    walker = walker.next
  }
  return arr
}

Yallist.prototype.toArrayReverse = function () {
  var arr = new Array(this.length)
  for (var i = 0, walker = this.tail; walker !== null; i++) {
    arr[i] = walker.value
    walker = walker.prev
  }
  return arr
}

Yallist.prototype.slice = function (from, to) {
  to = to || this.length
  if (to < 0) {
    to += this.length
  }
  from = from || 0
  if (from < 0) {
    from += this.length
  }
  var ret = new Yallist()
  if (to < from || to < 0) {
    return ret
  }
  if (from < 0) {
    from = 0
  }
  if (to > this.length) {
    to = this.length
  }
  for (var i = 0, walker = this.head; walker !== null && i < from; i++) {
    walker = walker.next
  }
  for (; walker !== null && i < to; i++, walker = walker.next) {
    ret.push(walker.value)
  }
  return ret
}

Yallist.prototype.sliceReverse = function (from, to) {
  to = to || this.length
  if (to < 0) {
    to += this.length
  }
  from = from || 0
  if (from < 0) {
    from += this.length
  }
  var ret = new Yallist()
  if (to < from || to < 0) {
    return ret
  }
  if (from < 0) {
    from = 0
  }
  if (to > this.length) {
    to = this.length
  }
  for (var i = this.length, walker = this.tail; walker !== null && i > to; i--) {
    walker = walker.prev
  }
  for (; walker !== null && i > from; i--, walker = walker.prev) {
    ret.push(walker.value)
  }
  return ret
}

Yallist.prototype.splice = function (start, deleteCount, ...nodes) {
  if (start > this.length) {
    start = this.length - 1
  }
  if (start < 0) {
    start = this.length + start;
  }

  for (var i = 0, walker = this.head; walker !== null && i < start; i++) {
    walker = walker.next
  }

  var ret = []
  for (var i = 0; walker && i < deleteCount; i++) {
    ret.push(walker.value)
    walker = this.removeNode(walker)
  }
  if (walker === null) {
    walker = this.tail
  }

  if (walker !== this.head && walker !== this.tail) {
    walker = walker.prev
  }

  for (var i = 0; i < nodes.length; i++) {
    walker = insert(this, walker, nodes[i])
  }
  return ret;
}

Yallist.prototype.reverse = function () {
  var head = this.head
  var tail = this.tail
  for (var walker = head; walker !== null; walker = walker.prev) {
    var p = walker.prev
    walker.prev = walker.next
    walker.next = p
  }
  this.head = tail
  this.tail = head
  return this
}

function insert (self, node, value) {
  var inserted = node === self.head ?
    new Node(value, null, node, self) :
    new Node(value, node, node.next, self)

  if (inserted.next === null) {
    self.tail = inserted
  }
  if (inserted.prev === null) {
    self.head = inserted
  }

  self.length++

  return inserted
}

function push (self, item) {
  self.tail = new Node(item, self.tail, null, self)
  if (!self.head) {
    self.head = self.tail
  }
  self.length++
}

function unshift (self, item) {
  self.head = new Node(item, null, self.head, self)
  if (!self.tail) {
    self.tail = self.head
  }
  self.length++
}

function Node (value, prev, next, list) {
  if (!(this instanceof Node)) {
    return new Node(value, prev, next, list)
  }

  this.list = list
  this.value = value

  if (prev) {
    prev.next = this
    this.prev = prev
  } else {
    this.prev = null
  }

  if (next) {
    next.prev = this
    this.next = next
  } else {
    this.next = null
  }
}

try {
  // add if support for Symbol.iterator is present
  __webpack_require__(602)(Yallist)
} catch (er) {}


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be in strict mode.
(() => {
"use strict";
/* harmony import */ var lru_cache__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(593);
/* harmony import */ var lru_cache__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(lru_cache__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var arrive__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(640);
/* harmony import */ var arrive__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(arrive__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var graphemer__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(777);
/* harmony import */ var graphemer__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(graphemer__WEBPACK_IMPORTED_MODULE_2__);
function _classPrivateFieldGet(receiver, privateMap) { var descriptor = _classExtractFieldDescriptor(receiver, privateMap, "get"); return _classApplyDescriptorGet(receiver, descriptor); }

function _classApplyDescriptorGet(receiver, descriptor) { if (descriptor.get) { return descriptor.get.call(receiver); } return descriptor.value; }

function _classPrivateFieldSet(receiver, privateMap, value) { var descriptor = _classExtractFieldDescriptor(receiver, privateMap, "set"); _classApplyDescriptorSet(receiver, descriptor, value); return value; }

function _classExtractFieldDescriptor(receiver, privateMap, action) { if (!privateMap.has(receiver)) { throw new TypeError("attempted to " + action + " private field on non-instance"); } return privateMap.get(receiver); }

function _classApplyDescriptorSet(receiver, descriptor, value) { if (descriptor.set) { descriptor.set.call(receiver, value); } else { if (!descriptor.writable) { throw new TypeError("attempted to set read only private field"); } descriptor.value = value; } }

function _classPrivateMethodGet(receiver, privateSet, fn) { if (!privateSet.has(receiver)) { throw new TypeError("attempted to get private field on non-instance"); } return fn; }




/**
 * This determines timeout of how long will fast chat cache keep recent messages.
 * The default is 1.5 seconds. This defends against all the LULW and Pog avalanches
 * that sometimes happen in large Twitch channel chats.
 */

const FAST_CHAT_CACHE_TIMEOUT = 2_500;
/**
 * Unlimitted cache size for fast messages.
 */

const FAST_CHAT_CACHE_SIZE = 0;
/**
 * This determines timeout of how long will long messages / copy-pastas be kept in cache.
 */

const LONG_CHAT_CACHE_TIMEOUT = 60 * 1_000;
/**
 * Unlimitted cache size for long messages.
 */

const LONG_CHAT_CACHE_SIZE = 0;
/**
 * This determines what is considered a long message / copy-pasta.
 */

const LONG_CHAT_THRESHOLD_LENGTH = 150;
const CHAT_SEL = '.chat-list__list-container, .chat-scrollable-area__message-container';
const CHAT_LINE_SEL = '.chat-line__message';
const SPACE_NORM_RE = /([\s])[\s]+/gu;
const BRAILLE_RE = /^[\u{2800}-\u{28FF}]+$/u; // This RegExp is used to replace text added by BTTV extension with just the emote name.

const STRIP_BTTV_TEXT_RE = /(?:^|\s)(\S+)(?:\r\n?|\n)Channel: \S+(?:\r\n?|\n)\S+ Channel Emotes(?:\r\n?|\n)\1(?:$|\s)/gum;
const HIDE_MESSAGE_KEYFRAMES = [{
  opacity: '1'
}, {
  opacity: '0',
  height: '0'
}];
const HIDE_MESSAGE_ANIM_OPTS = {
  duration: 500,
  fill: 'forwards'
};
const SPLITTER = new (graphemer__WEBPACK_IMPORTED_MODULE_2___default())();
const EMOTE_ANIMATION_STYLE = `
.chat-line__message--emote:hover,
.chat-badge:hover {
    transform: scale(2);
    z-index: 1;
    animation-name: emote-zoom;
    animation-duration: 0.250s;
}
@keyframes emote-zoom {
    from {
        transform: scale(1);
    }
    to {
        transform: scale(2);
    }
}
`;

var _prevMessage = /*#__PURE__*/new WeakMap();

var _fastChatCache = /*#__PURE__*/new WeakMap();

var _longChatCache = /*#__PURE__*/new WeakMap();

var _hideNode = /*#__PURE__*/new WeakSet();

var _evaluateMessage = /*#__PURE__*/new WeakSet();

var _watchChatMessages = /*#__PURE__*/new WeakSet();

var _injectStyleSheet = /*#__PURE__*/new WeakSet();

class SaneTwitchChat {
  constructor() {
    _injectStyleSheet.add(this);

    _watchChatMessages.add(this);

    _evaluateMessage.add(this);

    _hideNode.add(this);

    _prevMessage.set(this, {
      writable: true,
      value: null
    });

    _fastChatCache.set(this, {
      writable: true,
      value: new (lru_cache__WEBPACK_IMPORTED_MODULE_0___default())({
        max: FAST_CHAT_CACHE_SIZE,
        maxAge: FAST_CHAT_CACHE_TIMEOUT,
        length: () => 1
      })
    });

    _longChatCache.set(this, {
      writable: true,
      value: new (lru_cache__WEBPACK_IMPORTED_MODULE_0___default())({
        max: LONG_CHAT_CACHE_SIZE,
        maxAge: LONG_CHAT_CACHE_TIMEOUT,
        length: () => 1
      })
    });

    console.log('Starting Sane chat cleanup');
  }

  init() {
    _classPrivateMethodGet(this, _watchChatMessages, _watchChatMessages2).call(this);

    _classPrivateMethodGet(this, _injectStyleSheet, _injectStyleSheet2).call(this);
  }

}

async function _hideNode2(msgNode) {
  msgNode.style.color = '#ff0000';
  const animEffects = new KeyframeEffect(msgNode, HIDE_MESSAGE_KEYFRAMES, HIDE_MESSAGE_ANIM_OPTS);
  const anim = new Animation(animEffects, document.timeline);

  anim.onfinish = () => {
    msgNode.style.display = 'none';
  };

  anim.play();
}

function _evaluateMessage2(combinedMessage, msgNode) {
  if (!combinedMessage) {
    return;
  } // Filter repeated messages.


  if (combinedMessage === this.prevMessage) {
    console.log(`Hiding repeated message: ${combinedMessage}`);

    _classPrivateMethodGet(this, _hideNode, _hideNode2).call(this, msgNode);

    return;
  }

  _classPrivateFieldSet(this, _prevMessage, combinedMessage); // Filter messages with Braille symbols only.


  if (BRAILLE_RE.test(combinedMessage)) {
    console.log(`Hiding Braille only message: ${combinedMessage}`);

    _classPrivateMethodGet(this, _hideNode, _hideNode2).call(this, msgNode);

    return;
  } // Filter chat messages which repeat the same text in very short time.
  // See FAST_CHAT_CACHE_TIMEOUT.


  const factCachedNode = _classPrivateFieldGet(this, _fastChatCache).get(combinedMessage);

  if (factCachedNode !== undefined) {
    console.log(`Hiding message present in fast chat cache: ${combinedMessage}`);

    _classPrivateMethodGet(this, _hideNode, _hideNode2).call(this, msgNode);

    return;
  }

  _classPrivateFieldGet(this, _fastChatCache).set(combinedMessage, msgNode); // Filter long chat messages which repeat within longer period of time.


  const combinedMessageLength = SPLITTER.countGraphemes(combinedMessage);

  if (combinedMessageLength >= LONG_CHAT_THRESHOLD_LENGTH) {
    const longCachedNode = _classPrivateFieldGet(this, _longChatCache).get(combinedMessage);

    if (longCachedNode !== undefined) {
      console.log(`Hiding long message / copy-pasta present in long chat cache: ${combinedMessage}`);

      _classPrivateMethodGet(this, _hideNode, _hideNode2).call(this, msgNode);

      return;
    }

    _classPrivateFieldGet(this, _longChatCache).set(combinedMessage, msgNode);
  }
}

function _watchChatMessages2() {
  document.arrive(CHAT_SEL, chatNode => {
    console.log('Sane chat cleanup is enabled.');
    chatNode.arrive(CHAT_LINE_SEL, msgNode => {
      const xpathResult = document.evaluate('descendant::div[contains(@class,"chat-line__message--emote-button")]/span//img' + ' | descendant::a[contains(@class,"link-fragment")]' + ' | descendant::span[contains(@class,"text-fragment") or contains(@class,"mention-fragment")]//div[contains(@class,"bttv-emote")]/img' + ' | descendant::span[contains(@class,"text-fragment") or contains(@class,"mention-fragment")]', msgNode, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
      const fragments = [];

      for (let node; node = xpathResult.iterateNext();) {
        if (node.nodeName === 'IMG') {
          const alt = node.getAttribute('alt');

          if (alt) {
            fragments.push(alt);
          }
        } else {
          fragments.push(node.textContent);
        }
      }

      const combinedMessage = fragments.join(' ').trim().replace(SPACE_NORM_RE, '$1').replace(STRIP_BTTV_TEXT_RE, '$1');
      console.log(`combined message: ${combinedMessage}`);

      _classPrivateMethodGet(this, _evaluateMessage, _evaluateMessage2).call(this, combinedMessage, msgNode);
    });
  });
}

function _injectStyleSheet2() {
  // Prepare a node.
  const emoteAnimationStyleNode = document.createElement('style');
  emoteAnimationStyleNode.setAttribute('type', 'text/css');
  emoteAnimationStyleNode.setAttribute('id', 'sane-twitch-chat'); // Fill it with CSS style.

  emoteAnimationStyleNode.textContent = EMOTE_ANIMATION_STYLE; // Append the node to <head>.

  document.head.appendChild(emoteAnimationStyleNode);
}

const saneTwitchChat = new SaneTwitchChat();
saneTwitchChat.init();
})();

/******/ })()
;
//# sourceMappingURL=index.js.map