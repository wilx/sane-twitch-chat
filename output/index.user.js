// ==UserScript==
// @name        sane-twitch-chat
// @version     1.0.193
// @author      wilx
// @description Twitch chat sanitizer.
// @homepage    https://github.com/wilx/sane-twitch-chat
// @supportURL  https://github.com/wilx/sane-twitch-chat/issues
// @match       https://www.twitch.tv/*
// @namespace   https://github.com/wilx/sane-twitch-chat
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
        if ((0x0600 <= code && code <= 0x0605) || // Cf   [6] ARABIC NUMBER SIGN..ARABIC NUMBER MARK ABOVE
            0x06dd === code || // Cf       ARABIC END OF AYAH
            0x070f === code || // Cf       SYRIAC ABBREVIATION MARK
            0x08e2 === code || // Cf       ARABIC DISPUTED END OF AYAH
            0x0d4e === code || // Lo       MALAYALAM LETTER DOT REPH
            0x110bd === code || // Cf       KAITHI NUMBER SIGN
            0x110cd === code || // Cf       KAITHI NUMBER SIGN ABOVE
            (0x111c2 <= code && code <= 0x111c3) || // Lo   [2] SHARADA SIGN JIHVAMULIYA..SHARADA SIGN UPADHMANIYA
            0x1193f === code || // Lo       DIVES AKURU PREFIXED NASAL SIGN
            0x11941 === code || // Lo       DIVES AKURU INITIAL RA
            0x11a3a === code || // Lo       ZANABAZAR SQUARE CLUSTER-INITIAL LETTER RA
            (0x11a84 <= code && code <= 0x11a89) || // Lo   [6] SOYOMBO SIGN JIHVAMULIYA..SOYOMBO CLUSTER-INITIAL LETTER SA
            0x11d46 === code // Lo       MASARAM GONDI REPHA
        ) {
            return boundaries_1.CLUSTER_BREAK.PREPEND;
        }
        if (0x000d === code // Cc       <control-000D>
        ) {
            return boundaries_1.CLUSTER_BREAK.CR;
        }
        if (0x000a === code // Cc       <control-000A>
        ) {
            return boundaries_1.CLUSTER_BREAK.LF;
        }
        if ((0x0000 <= code && code <= 0x0009) || // Cc  [10] <control-0000>..<control-0009>
            (0x000b <= code && code <= 0x000c) || // Cc   [2] <control-000B>..<control-000C>
            (0x000e <= code && code <= 0x001f) || // Cc  [18] <control-000E>..<control-001F>
            (0x007f <= code && code <= 0x009f) || // Cc  [33] <control-007F>..<control-009F>
            0x00ad === code || // Cf       SOFT HYPHEN
            0x061c === code || // Cf       ARABIC LETTER MARK
            0x180e === code || // Cf       MONGOLIAN VOWEL SEPARATOR
            0x200b === code || // Cf       ZERO WIDTH SPACE
            (0x200e <= code && code <= 0x200f) || // Cf   [2] LEFT-TO-RIGHT MARK..RIGHT-TO-LEFT MARK
            0x2028 === code || // Zl       LINE SEPARATOR
            0x2029 === code || // Zp       PARAGRAPH SEPARATOR
            (0x202a <= code && code <= 0x202e) || // Cf   [5] LEFT-TO-RIGHT EMBEDDING..RIGHT-TO-LEFT OVERRIDE
            (0x2060 <= code && code <= 0x2064) || // Cf   [5] WORD JOINER..INVISIBLE PLUS
            0x2065 === code || // Cn       <reserved-2065>
            (0x2066 <= code && code <= 0x206f) || // Cf  [10] LEFT-TO-RIGHT ISOLATE..NOMINAL DIGIT SHAPES
            0xfeff === code || // Cf       ZERO WIDTH NO-BREAK SPACE
            (0xfff0 <= code && code <= 0xfff8) || // Cn   [9] <reserved-FFF0>..<reserved-FFF8>
            (0xfff9 <= code && code <= 0xfffb) || // Cf   [3] INTERLINEAR ANNOTATION ANCHOR..INTERLINEAR ANNOTATION TERMINATOR
            (0x13430 <= code && code <= 0x13438) || // Cf   [9] EGYPTIAN HIEROGLYPH VERTICAL JOINER..EGYPTIAN HIEROGLYPH END SEGMENT
            (0x1bca0 <= code && code <= 0x1bca3) || // Cf   [4] SHORTHAND FORMAT LETTER OVERLAP..SHORTHAND FORMAT UP STEP
            (0x1d173 <= code && code <= 0x1d17a) || // Cf   [8] MUSICAL SYMBOL BEGIN BEAM..MUSICAL SYMBOL END PHRASE
            0xe0000 === code || // Cn       <reserved-E0000>
            0xe0001 === code || // Cf       LANGUAGE TAG
            (0xe0002 <= code && code <= 0xe001f) || // Cn  [30] <reserved-E0002>..<reserved-E001F>
            (0xe0080 <= code && code <= 0xe00ff) || // Cn [128] <reserved-E0080>..<reserved-E00FF>
            (0xe01f0 <= code && code <= 0xe0fff) // Cn [3600] <reserved-E01F0>..<reserved-E0FFF>
        ) {
            return boundaries_1.CLUSTER_BREAK.CONTROL;
        }
        if ((0x0300 <= code && code <= 0x036f) || // Mn [112] COMBINING GRAVE ACCENT..COMBINING LATIN SMALL LETTER X
            (0x0483 <= code && code <= 0x0487) || // Mn   [5] COMBINING CYRILLIC TITLO..COMBINING CYRILLIC POKRYTIE
            (0x0488 <= code && code <= 0x0489) || // Me   [2] COMBINING CYRILLIC HUNDRED THOUSANDS SIGN..COMBINING CYRILLIC MILLIONS SIGN
            (0x0591 <= code && code <= 0x05bd) || // Mn  [45] HEBREW ACCENT ETNAHTA..HEBREW POINT METEG
            0x05bf === code || // Mn       HEBREW POINT RAFE
            (0x05c1 <= code && code <= 0x05c2) || // Mn   [2] HEBREW POINT SHIN DOT..HEBREW POINT SIN DOT
            (0x05c4 <= code && code <= 0x05c5) || // Mn   [2] HEBREW MARK UPPER DOT..HEBREW MARK LOWER DOT
            0x05c7 === code || // Mn       HEBREW POINT QAMATS QATAN
            (0x0610 <= code && code <= 0x061a) || // Mn  [11] ARABIC SIGN SALLALLAHOU ALAYHE WASSALLAM..ARABIC SMALL KASRA
            (0x064b <= code && code <= 0x065f) || // Mn  [21] ARABIC FATHATAN..ARABIC WAVY HAMZA BELOW
            0x0670 === code || // Mn       ARABIC LETTER SUPERSCRIPT ALEF
            (0x06d6 <= code && code <= 0x06dc) || // Mn   [7] ARABIC SMALL HIGH LIGATURE SAD WITH LAM WITH ALEF MAKSURA..ARABIC SMALL HIGH SEEN
            (0x06df <= code && code <= 0x06e4) || // Mn   [6] ARABIC SMALL HIGH ROUNDED ZERO..ARABIC SMALL HIGH MADDA
            (0x06e7 <= code && code <= 0x06e8) || // Mn   [2] ARABIC SMALL HIGH YEH..ARABIC SMALL HIGH NOON
            (0x06ea <= code && code <= 0x06ed) || // Mn   [4] ARABIC EMPTY CENTRE LOW STOP..ARABIC SMALL LOW MEEM
            0x0711 === code || // Mn       SYRIAC LETTER SUPERSCRIPT ALAPH
            (0x0730 <= code && code <= 0x074a) || // Mn  [27] SYRIAC PTHAHA ABOVE..SYRIAC BARREKH
            (0x07a6 <= code && code <= 0x07b0) || // Mn  [11] THAANA ABAFILI..THAANA SUKUN
            (0x07eb <= code && code <= 0x07f3) || // Mn   [9] NKO COMBINING SHORT HIGH TONE..NKO COMBINING DOUBLE DOT ABOVE
            0x07fd === code || // Mn       NKO DANTAYALAN
            (0x0816 <= code && code <= 0x0819) || // Mn   [4] SAMARITAN MARK IN..SAMARITAN MARK DAGESH
            (0x081b <= code && code <= 0x0823) || // Mn   [9] SAMARITAN MARK EPENTHETIC YUT..SAMARITAN VOWEL SIGN A
            (0x0825 <= code && code <= 0x0827) || // Mn   [3] SAMARITAN VOWEL SIGN SHORT A..SAMARITAN VOWEL SIGN U
            (0x0829 <= code && code <= 0x082d) || // Mn   [5] SAMARITAN VOWEL SIGN LONG I..SAMARITAN MARK NEQUDAA
            (0x0859 <= code && code <= 0x085b) || // Mn   [3] MANDAIC AFFRICATION MARK..MANDAIC GEMINATION MARK
            (0x08d3 <= code && code <= 0x08e1) || // Mn  [15] ARABIC SMALL LOW WAW..ARABIC SMALL HIGH SIGN SAFHA
            (0x08e3 <= code && code <= 0x0902) || // Mn  [32] ARABIC TURNED DAMMA BELOW..DEVANAGARI SIGN ANUSVARA
            0x093a === code || // Mn       DEVANAGARI VOWEL SIGN OE
            0x093c === code || // Mn       DEVANAGARI SIGN NUKTA
            (0x0941 <= code && code <= 0x0948) || // Mn   [8] DEVANAGARI VOWEL SIGN U..DEVANAGARI VOWEL SIGN AI
            0x094d === code || // Mn       DEVANAGARI SIGN VIRAMA
            (0x0951 <= code && code <= 0x0957) || // Mn   [7] DEVANAGARI STRESS SIGN UDATTA..DEVANAGARI VOWEL SIGN UUE
            (0x0962 <= code && code <= 0x0963) || // Mn   [2] DEVANAGARI VOWEL SIGN VOCALIC L..DEVANAGARI VOWEL SIGN VOCALIC LL
            0x0981 === code || // Mn       BENGALI SIGN CANDRABINDU
            0x09bc === code || // Mn       BENGALI SIGN NUKTA
            0x09be === code || // Mc       BENGALI VOWEL SIGN AA
            (0x09c1 <= code && code <= 0x09c4) || // Mn   [4] BENGALI VOWEL SIGN U..BENGALI VOWEL SIGN VOCALIC RR
            0x09cd === code || // Mn       BENGALI SIGN VIRAMA
            0x09d7 === code || // Mc       BENGALI AU LENGTH MARK
            (0x09e2 <= code && code <= 0x09e3) || // Mn   [2] BENGALI VOWEL SIGN VOCALIC L..BENGALI VOWEL SIGN VOCALIC LL
            0x09fe === code || // Mn       BENGALI SANDHI MARK
            (0x0a01 <= code && code <= 0x0a02) || // Mn   [2] GURMUKHI SIGN ADAK BINDI..GURMUKHI SIGN BINDI
            0x0a3c === code || // Mn       GURMUKHI SIGN NUKTA
            (0x0a41 <= code && code <= 0x0a42) || // Mn   [2] GURMUKHI VOWEL SIGN U..GURMUKHI VOWEL SIGN UU
            (0x0a47 <= code && code <= 0x0a48) || // Mn   [2] GURMUKHI VOWEL SIGN EE..GURMUKHI VOWEL SIGN AI
            (0x0a4b <= code && code <= 0x0a4d) || // Mn   [3] GURMUKHI VOWEL SIGN OO..GURMUKHI SIGN VIRAMA
            0x0a51 === code || // Mn       GURMUKHI SIGN UDAAT
            (0x0a70 <= code && code <= 0x0a71) || // Mn   [2] GURMUKHI TIPPI..GURMUKHI ADDAK
            0x0a75 === code || // Mn       GURMUKHI SIGN YAKASH
            (0x0a81 <= code && code <= 0x0a82) || // Mn   [2] GUJARATI SIGN CANDRABINDU..GUJARATI SIGN ANUSVARA
            0x0abc === code || // Mn       GUJARATI SIGN NUKTA
            (0x0ac1 <= code && code <= 0x0ac5) || // Mn   [5] GUJARATI VOWEL SIGN U..GUJARATI VOWEL SIGN CANDRA E
            (0x0ac7 <= code && code <= 0x0ac8) || // Mn   [2] GUJARATI VOWEL SIGN E..GUJARATI VOWEL SIGN AI
            0x0acd === code || // Mn       GUJARATI SIGN VIRAMA
            (0x0ae2 <= code && code <= 0x0ae3) || // Mn   [2] GUJARATI VOWEL SIGN VOCALIC L..GUJARATI VOWEL SIGN VOCALIC LL
            (0x0afa <= code && code <= 0x0aff) || // Mn   [6] GUJARATI SIGN SUKUN..GUJARATI SIGN TWO-CIRCLE NUKTA ABOVE
            0x0b01 === code || // Mn       ORIYA SIGN CANDRABINDU
            0x0b3c === code || // Mn       ORIYA SIGN NUKTA
            0x0b3e === code || // Mc       ORIYA VOWEL SIGN AA
            0x0b3f === code || // Mn       ORIYA VOWEL SIGN I
            (0x0b41 <= code && code <= 0x0b44) || // Mn   [4] ORIYA VOWEL SIGN U..ORIYA VOWEL SIGN VOCALIC RR
            0x0b4d === code || // Mn       ORIYA SIGN VIRAMA
            (0x0b55 <= code && code <= 0x0b56) || // Mn   [2] ORIYA SIGN OVERLINE..ORIYA AI LENGTH MARK
            0x0b57 === code || // Mc       ORIYA AU LENGTH MARK
            (0x0b62 <= code && code <= 0x0b63) || // Mn   [2] ORIYA VOWEL SIGN VOCALIC L..ORIYA VOWEL SIGN VOCALIC LL
            0x0b82 === code || // Mn       TAMIL SIGN ANUSVARA
            0x0bbe === code || // Mc       TAMIL VOWEL SIGN AA
            0x0bc0 === code || // Mn       TAMIL VOWEL SIGN II
            0x0bcd === code || // Mn       TAMIL SIGN VIRAMA
            0x0bd7 === code || // Mc       TAMIL AU LENGTH MARK
            0x0c00 === code || // Mn       TELUGU SIGN COMBINING CANDRABINDU ABOVE
            0x0c04 === code || // Mn       TELUGU SIGN COMBINING ANUSVARA ABOVE
            (0x0c3e <= code && code <= 0x0c40) || // Mn   [3] TELUGU VOWEL SIGN AA..TELUGU VOWEL SIGN II
            (0x0c46 <= code && code <= 0x0c48) || // Mn   [3] TELUGU VOWEL SIGN E..TELUGU VOWEL SIGN AI
            (0x0c4a <= code && code <= 0x0c4d) || // Mn   [4] TELUGU VOWEL SIGN O..TELUGU SIGN VIRAMA
            (0x0c55 <= code && code <= 0x0c56) || // Mn   [2] TELUGU LENGTH MARK..TELUGU AI LENGTH MARK
            (0x0c62 <= code && code <= 0x0c63) || // Mn   [2] TELUGU VOWEL SIGN VOCALIC L..TELUGU VOWEL SIGN VOCALIC LL
            0x0c81 === code || // Mn       KANNADA SIGN CANDRABINDU
            0x0cbc === code || // Mn       KANNADA SIGN NUKTA
            0x0cbf === code || // Mn       KANNADA VOWEL SIGN I
            0x0cc2 === code || // Mc       KANNADA VOWEL SIGN UU
            0x0cc6 === code || // Mn       KANNADA VOWEL SIGN E
            (0x0ccc <= code && code <= 0x0ccd) || // Mn   [2] KANNADA VOWEL SIGN AU..KANNADA SIGN VIRAMA
            (0x0cd5 <= code && code <= 0x0cd6) || // Mc   [2] KANNADA LENGTH MARK..KANNADA AI LENGTH MARK
            (0x0ce2 <= code && code <= 0x0ce3) || // Mn   [2] KANNADA VOWEL SIGN VOCALIC L..KANNADA VOWEL SIGN VOCALIC LL
            (0x0d00 <= code && code <= 0x0d01) || // Mn   [2] MALAYALAM SIGN COMBINING ANUSVARA ABOVE..MALAYALAM SIGN CANDRABINDU
            (0x0d3b <= code && code <= 0x0d3c) || // Mn   [2] MALAYALAM SIGN VERTICAL BAR VIRAMA..MALAYALAM SIGN CIRCULAR VIRAMA
            0x0d3e === code || // Mc       MALAYALAM VOWEL SIGN AA
            (0x0d41 <= code && code <= 0x0d44) || // Mn   [4] MALAYALAM VOWEL SIGN U..MALAYALAM VOWEL SIGN VOCALIC RR
            0x0d4d === code || // Mn       MALAYALAM SIGN VIRAMA
            0x0d57 === code || // Mc       MALAYALAM AU LENGTH MARK
            (0x0d62 <= code && code <= 0x0d63) || // Mn   [2] MALAYALAM VOWEL SIGN VOCALIC L..MALAYALAM VOWEL SIGN VOCALIC LL
            0x0d81 === code || // Mn       SINHALA SIGN CANDRABINDU
            0x0dca === code || // Mn       SINHALA SIGN AL-LAKUNA
            0x0dcf === code || // Mc       SINHALA VOWEL SIGN AELA-PILLA
            (0x0dd2 <= code && code <= 0x0dd4) || // Mn   [3] SINHALA VOWEL SIGN KETTI IS-PILLA..SINHALA VOWEL SIGN KETTI PAA-PILLA
            0x0dd6 === code || // Mn       SINHALA VOWEL SIGN DIGA PAA-PILLA
            0x0ddf === code || // Mc       SINHALA VOWEL SIGN GAYANUKITTA
            0x0e31 === code || // Mn       THAI CHARACTER MAI HAN-AKAT
            (0x0e34 <= code && code <= 0x0e3a) || // Mn   [7] THAI CHARACTER SARA I..THAI CHARACTER PHINTHU
            (0x0e47 <= code && code <= 0x0e4e) || // Mn   [8] THAI CHARACTER MAITAIKHU..THAI CHARACTER YAMAKKAN
            0x0eb1 === code || // Mn       LAO VOWEL SIGN MAI KAN
            (0x0eb4 <= code && code <= 0x0ebc) || // Mn   [9] LAO VOWEL SIGN I..LAO SEMIVOWEL SIGN LO
            (0x0ec8 <= code && code <= 0x0ecd) || // Mn   [6] LAO TONE MAI EK..LAO NIGGAHITA
            (0x0f18 <= code && code <= 0x0f19) || // Mn   [2] TIBETAN ASTROLOGICAL SIGN -KHYUD PA..TIBETAN ASTROLOGICAL SIGN SDONG TSHUGS
            0x0f35 === code || // Mn       TIBETAN MARK NGAS BZUNG NYI ZLA
            0x0f37 === code || // Mn       TIBETAN MARK NGAS BZUNG SGOR RTAGS
            0x0f39 === code || // Mn       TIBETAN MARK TSA -PHRU
            (0x0f71 <= code && code <= 0x0f7e) || // Mn  [14] TIBETAN VOWEL SIGN AA..TIBETAN SIGN RJES SU NGA RO
            (0x0f80 <= code && code <= 0x0f84) || // Mn   [5] TIBETAN VOWEL SIGN REVERSED I..TIBETAN MARK HALANTA
            (0x0f86 <= code && code <= 0x0f87) || // Mn   [2] TIBETAN SIGN LCI RTAGS..TIBETAN SIGN YANG RTAGS
            (0x0f8d <= code && code <= 0x0f97) || // Mn  [11] TIBETAN SUBJOINED SIGN LCE TSA CAN..TIBETAN SUBJOINED LETTER JA
            (0x0f99 <= code && code <= 0x0fbc) || // Mn  [36] TIBETAN SUBJOINED LETTER NYA..TIBETAN SUBJOINED LETTER FIXED-FORM RA
            0x0fc6 === code || // Mn       TIBETAN SYMBOL PADMA GDAN
            (0x102d <= code && code <= 0x1030) || // Mn   [4] MYANMAR VOWEL SIGN I..MYANMAR VOWEL SIGN UU
            (0x1032 <= code && code <= 0x1037) || // Mn   [6] MYANMAR VOWEL SIGN AI..MYANMAR SIGN DOT BELOW
            (0x1039 <= code && code <= 0x103a) || // Mn   [2] MYANMAR SIGN VIRAMA..MYANMAR SIGN ASAT
            (0x103d <= code && code <= 0x103e) || // Mn   [2] MYANMAR CONSONANT SIGN MEDIAL WA..MYANMAR CONSONANT SIGN MEDIAL HA
            (0x1058 <= code && code <= 0x1059) || // Mn   [2] MYANMAR VOWEL SIGN VOCALIC L..MYANMAR VOWEL SIGN VOCALIC LL
            (0x105e <= code && code <= 0x1060) || // Mn   [3] MYANMAR CONSONANT SIGN MON MEDIAL NA..MYANMAR CONSONANT SIGN MON MEDIAL LA
            (0x1071 <= code && code <= 0x1074) || // Mn   [4] MYANMAR VOWEL SIGN GEBA KAREN I..MYANMAR VOWEL SIGN KAYAH EE
            0x1082 === code || // Mn       MYANMAR CONSONANT SIGN SHAN MEDIAL WA
            (0x1085 <= code && code <= 0x1086) || // Mn   [2] MYANMAR VOWEL SIGN SHAN E ABOVE..MYANMAR VOWEL SIGN SHAN FINAL Y
            0x108d === code || // Mn       MYANMAR SIGN SHAN COUNCIL EMPHATIC TONE
            0x109d === code || // Mn       MYANMAR VOWEL SIGN AITON AI
            (0x135d <= code && code <= 0x135f) || // Mn   [3] ETHIOPIC COMBINING GEMINATION AND VOWEL LENGTH MARK..ETHIOPIC COMBINING GEMINATION MARK
            (0x1712 <= code && code <= 0x1714) || // Mn   [3] TAGALOG VOWEL SIGN I..TAGALOG SIGN VIRAMA
            (0x1732 <= code && code <= 0x1734) || // Mn   [3] HANUNOO VOWEL SIGN I..HANUNOO SIGN PAMUDPOD
            (0x1752 <= code && code <= 0x1753) || // Mn   [2] BUHID VOWEL SIGN I..BUHID VOWEL SIGN U
            (0x1772 <= code && code <= 0x1773) || // Mn   [2] TAGBANWA VOWEL SIGN I..TAGBANWA VOWEL SIGN U
            (0x17b4 <= code && code <= 0x17b5) || // Mn   [2] KHMER VOWEL INHERENT AQ..KHMER VOWEL INHERENT AA
            (0x17b7 <= code && code <= 0x17bd) || // Mn   [7] KHMER VOWEL SIGN I..KHMER VOWEL SIGN UA
            0x17c6 === code || // Mn       KHMER SIGN NIKAHIT
            (0x17c9 <= code && code <= 0x17d3) || // Mn  [11] KHMER SIGN MUUSIKATOAN..KHMER SIGN BATHAMASAT
            0x17dd === code || // Mn       KHMER SIGN ATTHACAN
            (0x180b <= code && code <= 0x180d) || // Mn   [3] MONGOLIAN FREE VARIATION SELECTOR ONE..MONGOLIAN FREE VARIATION SELECTOR THREE
            (0x1885 <= code && code <= 0x1886) || // Mn   [2] MONGOLIAN LETTER ALI GALI BALUDA..MONGOLIAN LETTER ALI GALI THREE BALUDA
            0x18a9 === code || // Mn       MONGOLIAN LETTER ALI GALI DAGALGA
            (0x1920 <= code && code <= 0x1922) || // Mn   [3] LIMBU VOWEL SIGN A..LIMBU VOWEL SIGN U
            (0x1927 <= code && code <= 0x1928) || // Mn   [2] LIMBU VOWEL SIGN E..LIMBU VOWEL SIGN O
            0x1932 === code || // Mn       LIMBU SMALL LETTER ANUSVARA
            (0x1939 <= code && code <= 0x193b) || // Mn   [3] LIMBU SIGN MUKPHRENG..LIMBU SIGN SA-I
            (0x1a17 <= code && code <= 0x1a18) || // Mn   [2] BUGINESE VOWEL SIGN I..BUGINESE VOWEL SIGN U
            0x1a1b === code || // Mn       BUGINESE VOWEL SIGN AE
            0x1a56 === code || // Mn       TAI THAM CONSONANT SIGN MEDIAL LA
            (0x1a58 <= code && code <= 0x1a5e) || // Mn   [7] TAI THAM SIGN MAI KANG LAI..TAI THAM CONSONANT SIGN SA
            0x1a60 === code || // Mn       TAI THAM SIGN SAKOT
            0x1a62 === code || // Mn       TAI THAM VOWEL SIGN MAI SAT
            (0x1a65 <= code && code <= 0x1a6c) || // Mn   [8] TAI THAM VOWEL SIGN I..TAI THAM VOWEL SIGN OA BELOW
            (0x1a73 <= code && code <= 0x1a7c) || // Mn  [10] TAI THAM VOWEL SIGN OA ABOVE..TAI THAM SIGN KHUEN-LUE KARAN
            0x1a7f === code || // Mn       TAI THAM COMBINING CRYPTOGRAMMIC DOT
            (0x1ab0 <= code && code <= 0x1abd) || // Mn  [14] COMBINING DOUBLED CIRCUMFLEX ACCENT..COMBINING PARENTHESES BELOW
            0x1abe === code || // Me       COMBINING PARENTHESES OVERLAY
            (0x1abf <= code && code <= 0x1ac0) || // Mn   [2] COMBINING LATIN SMALL LETTER W BELOW..COMBINING LATIN SMALL LETTER TURNED W BELOW
            (0x1b00 <= code && code <= 0x1b03) || // Mn   [4] BALINESE SIGN ULU RICEM..BALINESE SIGN SURANG
            0x1b34 === code || // Mn       BALINESE SIGN REREKAN
            0x1b35 === code || // Mc       BALINESE VOWEL SIGN TEDUNG
            (0x1b36 <= code && code <= 0x1b3a) || // Mn   [5] BALINESE VOWEL SIGN ULU..BALINESE VOWEL SIGN RA REPA
            0x1b3c === code || // Mn       BALINESE VOWEL SIGN LA LENGA
            0x1b42 === code || // Mn       BALINESE VOWEL SIGN PEPET
            (0x1b6b <= code && code <= 0x1b73) || // Mn   [9] BALINESE MUSICAL SYMBOL COMBINING TEGEH..BALINESE MUSICAL SYMBOL COMBINING GONG
            (0x1b80 <= code && code <= 0x1b81) || // Mn   [2] SUNDANESE SIGN PANYECEK..SUNDANESE SIGN PANGLAYAR
            (0x1ba2 <= code && code <= 0x1ba5) || // Mn   [4] SUNDANESE CONSONANT SIGN PANYAKRA..SUNDANESE VOWEL SIGN PANYUKU
            (0x1ba8 <= code && code <= 0x1ba9) || // Mn   [2] SUNDANESE VOWEL SIGN PAMEPET..SUNDANESE VOWEL SIGN PANEULEUNG
            (0x1bab <= code && code <= 0x1bad) || // Mn   [3] SUNDANESE SIGN VIRAMA..SUNDANESE CONSONANT SIGN PASANGAN WA
            0x1be6 === code || // Mn       BATAK SIGN TOMPI
            (0x1be8 <= code && code <= 0x1be9) || // Mn   [2] BATAK VOWEL SIGN PAKPAK E..BATAK VOWEL SIGN EE
            0x1bed === code || // Mn       BATAK VOWEL SIGN KARO O
            (0x1bef <= code && code <= 0x1bf1) || // Mn   [3] BATAK VOWEL SIGN U FOR SIMALUNGUN SA..BATAK CONSONANT SIGN H
            (0x1c2c <= code && code <= 0x1c33) || // Mn   [8] LEPCHA VOWEL SIGN E..LEPCHA CONSONANT SIGN T
            (0x1c36 <= code && code <= 0x1c37) || // Mn   [2] LEPCHA SIGN RAN..LEPCHA SIGN NUKTA
            (0x1cd0 <= code && code <= 0x1cd2) || // Mn   [3] VEDIC TONE KARSHANA..VEDIC TONE PRENKHA
            (0x1cd4 <= code && code <= 0x1ce0) || // Mn  [13] VEDIC SIGN YAJURVEDIC MIDLINE SVARITA..VEDIC TONE RIGVEDIC KASHMIRI INDEPENDENT SVARITA
            (0x1ce2 <= code && code <= 0x1ce8) || // Mn   [7] VEDIC SIGN VISARGA SVARITA..VEDIC SIGN VISARGA ANUDATTA WITH TAIL
            0x1ced === code || // Mn       VEDIC SIGN TIRYAK
            0x1cf4 === code || // Mn       VEDIC TONE CANDRA ABOVE
            (0x1cf8 <= code && code <= 0x1cf9) || // Mn   [2] VEDIC TONE RING ABOVE..VEDIC TONE DOUBLE RING ABOVE
            (0x1dc0 <= code && code <= 0x1df9) || // Mn  [58] COMBINING DOTTED GRAVE ACCENT..COMBINING WIDE INVERTED BRIDGE BELOW
            (0x1dfb <= code && code <= 0x1dff) || // Mn   [5] COMBINING DELETION MARK..COMBINING RIGHT ARROWHEAD AND DOWN ARROWHEAD BELOW
            0x200c === code || // Cf       ZERO WIDTH NON-JOINER
            (0x20d0 <= code && code <= 0x20dc) || // Mn  [13] COMBINING LEFT HARPOON ABOVE..COMBINING FOUR DOTS ABOVE
            (0x20dd <= code && code <= 0x20e0) || // Me   [4] COMBINING ENCLOSING CIRCLE..COMBINING ENCLOSING CIRCLE BACKSLASH
            0x20e1 === code || // Mn       COMBINING LEFT RIGHT ARROW ABOVE
            (0x20e2 <= code && code <= 0x20e4) || // Me   [3] COMBINING ENCLOSING SCREEN..COMBINING ENCLOSING UPWARD POINTING TRIANGLE
            (0x20e5 <= code && code <= 0x20f0) || // Mn  [12] COMBINING REVERSE SOLIDUS OVERLAY..COMBINING ASTERISK ABOVE
            (0x2cef <= code && code <= 0x2cf1) || // Mn   [3] COPTIC COMBINING NI ABOVE..COPTIC COMBINING SPIRITUS LENIS
            0x2d7f === code || // Mn       TIFINAGH CONSONANT JOINER
            (0x2de0 <= code && code <= 0x2dff) || // Mn  [32] COMBINING CYRILLIC LETTER BE..COMBINING CYRILLIC LETTER IOTIFIED BIG YUS
            (0x302a <= code && code <= 0x302d) || // Mn   [4] IDEOGRAPHIC LEVEL TONE MARK..IDEOGRAPHIC ENTERING TONE MARK
            (0x302e <= code && code <= 0x302f) || // Mc   [2] HANGUL SINGLE DOT TONE MARK..HANGUL DOUBLE DOT TONE MARK
            (0x3099 <= code && code <= 0x309a) || // Mn   [2] COMBINING KATAKANA-HIRAGANA VOICED SOUND MARK..COMBINING KATAKANA-HIRAGANA SEMI-VOICED SOUND MARK
            0xa66f === code || // Mn       COMBINING CYRILLIC VZMET
            (0xa670 <= code && code <= 0xa672) || // Me   [3] COMBINING CYRILLIC TEN MILLIONS SIGN..COMBINING CYRILLIC THOUSAND MILLIONS SIGN
            (0xa674 <= code && code <= 0xa67d) || // Mn  [10] COMBINING CYRILLIC LETTER UKRAINIAN IE..COMBINING CYRILLIC PAYEROK
            (0xa69e <= code && code <= 0xa69f) || // Mn   [2] COMBINING CYRILLIC LETTER EF..COMBINING CYRILLIC LETTER IOTIFIED E
            (0xa6f0 <= code && code <= 0xa6f1) || // Mn   [2] BAMUM COMBINING MARK KOQNDON..BAMUM COMBINING MARK TUKWENTIS
            0xa802 === code || // Mn       SYLOTI NAGRI SIGN DVISVARA
            0xa806 === code || // Mn       SYLOTI NAGRI SIGN HASANTA
            0xa80b === code || // Mn       SYLOTI NAGRI SIGN ANUSVARA
            (0xa825 <= code && code <= 0xa826) || // Mn   [2] SYLOTI NAGRI VOWEL SIGN U..SYLOTI NAGRI VOWEL SIGN E
            0xa82c === code || // Mn       SYLOTI NAGRI SIGN ALTERNATE HASANTA
            (0xa8c4 <= code && code <= 0xa8c5) || // Mn   [2] SAURASHTRA SIGN VIRAMA..SAURASHTRA SIGN CANDRABINDU
            (0xa8e0 <= code && code <= 0xa8f1) || // Mn  [18] COMBINING DEVANAGARI DIGIT ZERO..COMBINING DEVANAGARI SIGN AVAGRAHA
            0xa8ff === code || // Mn       DEVANAGARI VOWEL SIGN AY
            (0xa926 <= code && code <= 0xa92d) || // Mn   [8] KAYAH LI VOWEL UE..KAYAH LI TONE CALYA PLOPHU
            (0xa947 <= code && code <= 0xa951) || // Mn  [11] REJANG VOWEL SIGN I..REJANG CONSONANT SIGN R
            (0xa980 <= code && code <= 0xa982) || // Mn   [3] JAVANESE SIGN PANYANGGA..JAVANESE SIGN LAYAR
            0xa9b3 === code || // Mn       JAVANESE SIGN CECAK TELU
            (0xa9b6 <= code && code <= 0xa9b9) || // Mn   [4] JAVANESE VOWEL SIGN WULU..JAVANESE VOWEL SIGN SUKU MENDUT
            (0xa9bc <= code && code <= 0xa9bd) || // Mn   [2] JAVANESE VOWEL SIGN PEPET..JAVANESE CONSONANT SIGN KERET
            0xa9e5 === code || // Mn       MYANMAR SIGN SHAN SAW
            (0xaa29 <= code && code <= 0xaa2e) || // Mn   [6] CHAM VOWEL SIGN AA..CHAM VOWEL SIGN OE
            (0xaa31 <= code && code <= 0xaa32) || // Mn   [2] CHAM VOWEL SIGN AU..CHAM VOWEL SIGN UE
            (0xaa35 <= code && code <= 0xaa36) || // Mn   [2] CHAM CONSONANT SIGN LA..CHAM CONSONANT SIGN WA
            0xaa43 === code || // Mn       CHAM CONSONANT SIGN FINAL NG
            0xaa4c === code || // Mn       CHAM CONSONANT SIGN FINAL M
            0xaa7c === code || // Mn       MYANMAR SIGN TAI LAING TONE-2
            0xaab0 === code || // Mn       TAI VIET MAI KANG
            (0xaab2 <= code && code <= 0xaab4) || // Mn   [3] TAI VIET VOWEL I..TAI VIET VOWEL U
            (0xaab7 <= code && code <= 0xaab8) || // Mn   [2] TAI VIET MAI KHIT..TAI VIET VOWEL IA
            (0xaabe <= code && code <= 0xaabf) || // Mn   [2] TAI VIET VOWEL AM..TAI VIET TONE MAI EK
            0xaac1 === code || // Mn       TAI VIET TONE MAI THO
            (0xaaec <= code && code <= 0xaaed) || // Mn   [2] MEETEI MAYEK VOWEL SIGN UU..MEETEI MAYEK VOWEL SIGN AAI
            0xaaf6 === code || // Mn       MEETEI MAYEK VIRAMA
            0xabe5 === code || // Mn       MEETEI MAYEK VOWEL SIGN ANAP
            0xabe8 === code || // Mn       MEETEI MAYEK VOWEL SIGN UNAP
            0xabed === code || // Mn       MEETEI MAYEK APUN IYEK
            0xfb1e === code || // Mn       HEBREW POINT JUDEO-SPANISH VARIKA
            (0xfe00 <= code && code <= 0xfe0f) || // Mn  [16] VARIATION SELECTOR-1..VARIATION SELECTOR-16
            (0xfe20 <= code && code <= 0xfe2f) || // Mn  [16] COMBINING LIGATURE LEFT HALF..COMBINING CYRILLIC TITLO RIGHT HALF
            (0xff9e <= code && code <= 0xff9f) || // Lm   [2] HALFWIDTH KATAKANA VOICED SOUND MARK..HALFWIDTH KATAKANA SEMI-VOICED SOUND MARK
            0x101fd === code || // Mn       PHAISTOS DISC SIGN COMBINING OBLIQUE STROKE
            0x102e0 === code || // Mn       COPTIC EPACT THOUSANDS MARK
            (0x10376 <= code && code <= 0x1037a) || // Mn   [5] COMBINING OLD PERMIC LETTER AN..COMBINING OLD PERMIC LETTER SII
            (0x10a01 <= code && code <= 0x10a03) || // Mn   [3] KHAROSHTHI VOWEL SIGN I..KHAROSHTHI VOWEL SIGN VOCALIC R
            (0x10a05 <= code && code <= 0x10a06) || // Mn   [2] KHAROSHTHI VOWEL SIGN E..KHAROSHTHI VOWEL SIGN O
            (0x10a0c <= code && code <= 0x10a0f) || // Mn   [4] KHAROSHTHI VOWEL LENGTH MARK..KHAROSHTHI SIGN VISARGA
            (0x10a38 <= code && code <= 0x10a3a) || // Mn   [3] KHAROSHTHI SIGN BAR ABOVE..KHAROSHTHI SIGN DOT BELOW
            0x10a3f === code || // Mn       KHAROSHTHI VIRAMA
            (0x10ae5 <= code && code <= 0x10ae6) || // Mn   [2] MANICHAEAN ABBREVIATION MARK ABOVE..MANICHAEAN ABBREVIATION MARK BELOW
            (0x10d24 <= code && code <= 0x10d27) || // Mn   [4] HANIFI ROHINGYA SIGN HARBAHAY..HANIFI ROHINGYA SIGN TASSI
            (0x10eab <= code && code <= 0x10eac) || // Mn   [2] YEZIDI COMBINING HAMZA MARK..YEZIDI COMBINING MADDA MARK
            (0x10f46 <= code && code <= 0x10f50) || // Mn  [11] SOGDIAN COMBINING DOT BELOW..SOGDIAN COMBINING STROKE BELOW
            0x11001 === code || // Mn       BRAHMI SIGN ANUSVARA
            (0x11038 <= code && code <= 0x11046) || // Mn  [15] BRAHMI VOWEL SIGN AA..BRAHMI VIRAMA
            (0x1107f <= code && code <= 0x11081) || // Mn   [3] BRAHMI NUMBER JOINER..KAITHI SIGN ANUSVARA
            (0x110b3 <= code && code <= 0x110b6) || // Mn   [4] KAITHI VOWEL SIGN U..KAITHI VOWEL SIGN AI
            (0x110b9 <= code && code <= 0x110ba) || // Mn   [2] KAITHI SIGN VIRAMA..KAITHI SIGN NUKTA
            (0x11100 <= code && code <= 0x11102) || // Mn   [3] CHAKMA SIGN CANDRABINDU..CHAKMA SIGN VISARGA
            (0x11127 <= code && code <= 0x1112b) || // Mn   [5] CHAKMA VOWEL SIGN A..CHAKMA VOWEL SIGN UU
            (0x1112d <= code && code <= 0x11134) || // Mn   [8] CHAKMA VOWEL SIGN AI..CHAKMA MAAYYAA
            0x11173 === code || // Mn       MAHAJANI SIGN NUKTA
            (0x11180 <= code && code <= 0x11181) || // Mn   [2] SHARADA SIGN CANDRABINDU..SHARADA SIGN ANUSVARA
            (0x111b6 <= code && code <= 0x111be) || // Mn   [9] SHARADA VOWEL SIGN U..SHARADA VOWEL SIGN O
            (0x111c9 <= code && code <= 0x111cc) || // Mn   [4] SHARADA SANDHI MARK..SHARADA EXTRA SHORT VOWEL MARK
            0x111cf === code || // Mn       SHARADA SIGN INVERTED CANDRABINDU
            (0x1122f <= code && code <= 0x11231) || // Mn   [3] KHOJKI VOWEL SIGN U..KHOJKI VOWEL SIGN AI
            0x11234 === code || // Mn       KHOJKI SIGN ANUSVARA
            (0x11236 <= code && code <= 0x11237) || // Mn   [2] KHOJKI SIGN NUKTA..KHOJKI SIGN SHADDA
            0x1123e === code || // Mn       KHOJKI SIGN SUKUN
            0x112df === code || // Mn       KHUDAWADI SIGN ANUSVARA
            (0x112e3 <= code && code <= 0x112ea) || // Mn   [8] KHUDAWADI VOWEL SIGN U..KHUDAWADI SIGN VIRAMA
            (0x11300 <= code && code <= 0x11301) || // Mn   [2] GRANTHA SIGN COMBINING ANUSVARA ABOVE..GRANTHA SIGN CANDRABINDU
            (0x1133b <= code && code <= 0x1133c) || // Mn   [2] COMBINING BINDU BELOW..GRANTHA SIGN NUKTA
            0x1133e === code || // Mc       GRANTHA VOWEL SIGN AA
            0x11340 === code || // Mn       GRANTHA VOWEL SIGN II
            0x11357 === code || // Mc       GRANTHA AU LENGTH MARK
            (0x11366 <= code && code <= 0x1136c) || // Mn   [7] COMBINING GRANTHA DIGIT ZERO..COMBINING GRANTHA DIGIT SIX
            (0x11370 <= code && code <= 0x11374) || // Mn   [5] COMBINING GRANTHA LETTER A..COMBINING GRANTHA LETTER PA
            (0x11438 <= code && code <= 0x1143f) || // Mn   [8] NEWA VOWEL SIGN U..NEWA VOWEL SIGN AI
            (0x11442 <= code && code <= 0x11444) || // Mn   [3] NEWA SIGN VIRAMA..NEWA SIGN ANUSVARA
            0x11446 === code || // Mn       NEWA SIGN NUKTA
            0x1145e === code || // Mn       NEWA SANDHI MARK
            0x114b0 === code || // Mc       TIRHUTA VOWEL SIGN AA
            (0x114b3 <= code && code <= 0x114b8) || // Mn   [6] TIRHUTA VOWEL SIGN U..TIRHUTA VOWEL SIGN VOCALIC LL
            0x114ba === code || // Mn       TIRHUTA VOWEL SIGN SHORT E
            0x114bd === code || // Mc       TIRHUTA VOWEL SIGN SHORT O
            (0x114bf <= code && code <= 0x114c0) || // Mn   [2] TIRHUTA SIGN CANDRABINDU..TIRHUTA SIGN ANUSVARA
            (0x114c2 <= code && code <= 0x114c3) || // Mn   [2] TIRHUTA SIGN VIRAMA..TIRHUTA SIGN NUKTA
            0x115af === code || // Mc       SIDDHAM VOWEL SIGN AA
            (0x115b2 <= code && code <= 0x115b5) || // Mn   [4] SIDDHAM VOWEL SIGN U..SIDDHAM VOWEL SIGN VOCALIC RR
            (0x115bc <= code && code <= 0x115bd) || // Mn   [2] SIDDHAM SIGN CANDRABINDU..SIDDHAM SIGN ANUSVARA
            (0x115bf <= code && code <= 0x115c0) || // Mn   [2] SIDDHAM SIGN VIRAMA..SIDDHAM SIGN NUKTA
            (0x115dc <= code && code <= 0x115dd) || // Mn   [2] SIDDHAM VOWEL SIGN ALTERNATE U..SIDDHAM VOWEL SIGN ALTERNATE UU
            (0x11633 <= code && code <= 0x1163a) || // Mn   [8] MODI VOWEL SIGN U..MODI VOWEL SIGN AI
            0x1163d === code || // Mn       MODI SIGN ANUSVARA
            (0x1163f <= code && code <= 0x11640) || // Mn   [2] MODI SIGN VIRAMA..MODI SIGN ARDHACANDRA
            0x116ab === code || // Mn       TAKRI SIGN ANUSVARA
            0x116ad === code || // Mn       TAKRI VOWEL SIGN AA
            (0x116b0 <= code && code <= 0x116b5) || // Mn   [6] TAKRI VOWEL SIGN U..TAKRI VOWEL SIGN AU
            0x116b7 === code || // Mn       TAKRI SIGN NUKTA
            (0x1171d <= code && code <= 0x1171f) || // Mn   [3] AHOM CONSONANT SIGN MEDIAL LA..AHOM CONSONANT SIGN MEDIAL LIGATING RA
            (0x11722 <= code && code <= 0x11725) || // Mn   [4] AHOM VOWEL SIGN I..AHOM VOWEL SIGN UU
            (0x11727 <= code && code <= 0x1172b) || // Mn   [5] AHOM VOWEL SIGN AW..AHOM SIGN KILLER
            (0x1182f <= code && code <= 0x11837) || // Mn   [9] DOGRA VOWEL SIGN U..DOGRA SIGN ANUSVARA
            (0x11839 <= code && code <= 0x1183a) || // Mn   [2] DOGRA SIGN VIRAMA..DOGRA SIGN NUKTA
            0x11930 === code || // Mc       DIVES AKURU VOWEL SIGN AA
            (0x1193b <= code && code <= 0x1193c) || // Mn   [2] DIVES AKURU SIGN ANUSVARA..DIVES AKURU SIGN CANDRABINDU
            0x1193e === code || // Mn       DIVES AKURU VIRAMA
            0x11943 === code || // Mn       DIVES AKURU SIGN NUKTA
            (0x119d4 <= code && code <= 0x119d7) || // Mn   [4] NANDINAGARI VOWEL SIGN U..NANDINAGARI VOWEL SIGN VOCALIC RR
            (0x119da <= code && code <= 0x119db) || // Mn   [2] NANDINAGARI VOWEL SIGN E..NANDINAGARI VOWEL SIGN AI
            0x119e0 === code || // Mn       NANDINAGARI SIGN VIRAMA
            (0x11a01 <= code && code <= 0x11a0a) || // Mn  [10] ZANABAZAR SQUARE VOWEL SIGN I..ZANABAZAR SQUARE VOWEL LENGTH MARK
            (0x11a33 <= code && code <= 0x11a38) || // Mn   [6] ZANABAZAR SQUARE FINAL CONSONANT MARK..ZANABAZAR SQUARE SIGN ANUSVARA
            (0x11a3b <= code && code <= 0x11a3e) || // Mn   [4] ZANABAZAR SQUARE CLUSTER-FINAL LETTER YA..ZANABAZAR SQUARE CLUSTER-FINAL LETTER VA
            0x11a47 === code || // Mn       ZANABAZAR SQUARE SUBJOINER
            (0x11a51 <= code && code <= 0x11a56) || // Mn   [6] SOYOMBO VOWEL SIGN I..SOYOMBO VOWEL SIGN OE
            (0x11a59 <= code && code <= 0x11a5b) || // Mn   [3] SOYOMBO VOWEL SIGN VOCALIC R..SOYOMBO VOWEL LENGTH MARK
            (0x11a8a <= code && code <= 0x11a96) || // Mn  [13] SOYOMBO FINAL CONSONANT SIGN G..SOYOMBO SIGN ANUSVARA
            (0x11a98 <= code && code <= 0x11a99) || // Mn   [2] SOYOMBO GEMINATION MARK..SOYOMBO SUBJOINER
            (0x11c30 <= code && code <= 0x11c36) || // Mn   [7] BHAIKSUKI VOWEL SIGN I..BHAIKSUKI VOWEL SIGN VOCALIC L
            (0x11c38 <= code && code <= 0x11c3d) || // Mn   [6] BHAIKSUKI VOWEL SIGN E..BHAIKSUKI SIGN ANUSVARA
            0x11c3f === code || // Mn       BHAIKSUKI SIGN VIRAMA
            (0x11c92 <= code && code <= 0x11ca7) || // Mn  [22] MARCHEN SUBJOINED LETTER KA..MARCHEN SUBJOINED LETTER ZA
            (0x11caa <= code && code <= 0x11cb0) || // Mn   [7] MARCHEN SUBJOINED LETTER RA..MARCHEN VOWEL SIGN AA
            (0x11cb2 <= code && code <= 0x11cb3) || // Mn   [2] MARCHEN VOWEL SIGN U..MARCHEN VOWEL SIGN E
            (0x11cb5 <= code && code <= 0x11cb6) || // Mn   [2] MARCHEN SIGN ANUSVARA..MARCHEN SIGN CANDRABINDU
            (0x11d31 <= code && code <= 0x11d36) || // Mn   [6] MASARAM GONDI VOWEL SIGN AA..MASARAM GONDI VOWEL SIGN VOCALIC R
            0x11d3a === code || // Mn       MASARAM GONDI VOWEL SIGN E
            (0x11d3c <= code && code <= 0x11d3d) || // Mn   [2] MASARAM GONDI VOWEL SIGN AI..MASARAM GONDI VOWEL SIGN O
            (0x11d3f <= code && code <= 0x11d45) || // Mn   [7] MASARAM GONDI VOWEL SIGN AU..MASARAM GONDI VIRAMA
            0x11d47 === code || // Mn       MASARAM GONDI RA-KARA
            (0x11d90 <= code && code <= 0x11d91) || // Mn   [2] GUNJALA GONDI VOWEL SIGN EE..GUNJALA GONDI VOWEL SIGN AI
            0x11d95 === code || // Mn       GUNJALA GONDI SIGN ANUSVARA
            0x11d97 === code || // Mn       GUNJALA GONDI VIRAMA
            (0x11ef3 <= code && code <= 0x11ef4) || // Mn   [2] MAKASAR VOWEL SIGN I..MAKASAR VOWEL SIGN U
            (0x16af0 <= code && code <= 0x16af4) || // Mn   [5] BASSA VAH COMBINING HIGH TONE..BASSA VAH COMBINING HIGH-LOW TONE
            (0x16b30 <= code && code <= 0x16b36) || // Mn   [7] PAHAWH HMONG MARK CIM TUB..PAHAWH HMONG MARK CIM TAUM
            0x16f4f === code || // Mn       MIAO SIGN CONSONANT MODIFIER BAR
            (0x16f8f <= code && code <= 0x16f92) || // Mn   [4] MIAO TONE RIGHT..MIAO TONE BELOW
            0x16fe4 === code || // Mn       KHITAN SMALL SCRIPT FILLER
            (0x1bc9d <= code && code <= 0x1bc9e) || // Mn   [2] DUPLOYAN THICK LETTER SELECTOR..DUPLOYAN DOUBLE MARK
            0x1d165 === code || // Mc       MUSICAL SYMBOL COMBINING STEM
            (0x1d167 <= code && code <= 0x1d169) || // Mn   [3] MUSICAL SYMBOL COMBINING TREMOLO-1..MUSICAL SYMBOL COMBINING TREMOLO-3
            (0x1d16e <= code && code <= 0x1d172) || // Mc   [5] MUSICAL SYMBOL COMBINING FLAG-1..MUSICAL SYMBOL COMBINING FLAG-5
            (0x1d17b <= code && code <= 0x1d182) || // Mn   [8] MUSICAL SYMBOL COMBINING ACCENT..MUSICAL SYMBOL COMBINING LOURE
            (0x1d185 <= code && code <= 0x1d18b) || // Mn   [7] MUSICAL SYMBOL COMBINING DOIT..MUSICAL SYMBOL COMBINING TRIPLE TONGUE
            (0x1d1aa <= code && code <= 0x1d1ad) || // Mn   [4] MUSICAL SYMBOL COMBINING DOWN BOW..MUSICAL SYMBOL COMBINING SNAP PIZZICATO
            (0x1d242 <= code && code <= 0x1d244) || // Mn   [3] COMBINING GREEK MUSICAL TRISEME..COMBINING GREEK MUSICAL PENTASEME
            (0x1da00 <= code && code <= 0x1da36) || // Mn  [55] SIGNWRITING HEAD RIM..SIGNWRITING AIR SUCKING IN
            (0x1da3b <= code && code <= 0x1da6c) || // Mn  [50] SIGNWRITING MOUTH CLOSED NEUTRAL..SIGNWRITING EXCITEMENT
            0x1da75 === code || // Mn       SIGNWRITING UPPER BODY TILTING FROM HIP JOINTS
            0x1da84 === code || // Mn       SIGNWRITING LOCATION HEAD NECK
            (0x1da9b <= code && code <= 0x1da9f) || // Mn   [5] SIGNWRITING FILL MODIFIER-2..SIGNWRITING FILL MODIFIER-6
            (0x1daa1 <= code && code <= 0x1daaf) || // Mn  [15] SIGNWRITING ROTATION MODIFIER-2..SIGNWRITING ROTATION MODIFIER-16
            (0x1e000 <= code && code <= 0x1e006) || // Mn   [7] COMBINING GLAGOLITIC LETTER AZU..COMBINING GLAGOLITIC LETTER ZHIVETE
            (0x1e008 <= code && code <= 0x1e018) || // Mn  [17] COMBINING GLAGOLITIC LETTER ZEMLJA..COMBINING GLAGOLITIC LETTER HERU
            (0x1e01b <= code && code <= 0x1e021) || // Mn   [7] COMBINING GLAGOLITIC LETTER SHTA..COMBINING GLAGOLITIC LETTER YATI
            (0x1e023 <= code && code <= 0x1e024) || // Mn   [2] COMBINING GLAGOLITIC LETTER YU..COMBINING GLAGOLITIC LETTER SMALL YUS
            (0x1e026 <= code && code <= 0x1e02a) || // Mn   [5] COMBINING GLAGOLITIC LETTER YO..COMBINING GLAGOLITIC LETTER FITA
            (0x1e130 <= code && code <= 0x1e136) || // Mn   [7] NYIAKENG PUACHUE HMONG TONE-B..NYIAKENG PUACHUE HMONG TONE-D
            (0x1e2ec <= code && code <= 0x1e2ef) || // Mn   [4] WANCHO TONE TUP..WANCHO TONE KOINI
            (0x1e8d0 <= code && code <= 0x1e8d6) || // Mn   [7] MENDE KIKAKUI COMBINING NUMBER TEENS..MENDE KIKAKUI COMBINING NUMBER MILLIONS
            (0x1e944 <= code && code <= 0x1e94a) || // Mn   [7] ADLAM ALIF LENGTHENER..ADLAM NUKTA
            (0x1f3fb <= code && code <= 0x1f3ff) || // Sk   [5] EMOJI MODIFIER FITZPATRICK TYPE-1-2..EMOJI MODIFIER FITZPATRICK TYPE-6
            (0xe0020 <= code && code <= 0xe007f) || // Cf  [96] TAG SPACE..CANCEL TAG
            (0xe0100 <= code && code <= 0xe01ef) // Mn [240] VARIATION SELECTOR-17..VARIATION SELECTOR-256
        ) {
            return boundaries_1.CLUSTER_BREAK.EXTEND;
        }
        if (0x1f1e6 <= code &&
            code <= 0x1f1ff // So  [26] REGIONAL INDICATOR SYMBOL LETTER A..REGIONAL INDICATOR SYMBOL LETTER Z
        ) {
            return boundaries_1.CLUSTER_BREAK.REGIONAL_INDICATOR;
        }
        if (0x0903 === code || // Mc       DEVANAGARI SIGN VISARGA
            0x093b === code || // Mc       DEVANAGARI VOWEL SIGN OOE
            (0x093e <= code && code <= 0x0940) || // Mc   [3] DEVANAGARI VOWEL SIGN AA..DEVANAGARI VOWEL SIGN II
            (0x0949 <= code && code <= 0x094c) || // Mc   [4] DEVANAGARI VOWEL SIGN CANDRA O..DEVANAGARI VOWEL SIGN AU
            (0x094e <= code && code <= 0x094f) || // Mc   [2] DEVANAGARI VOWEL SIGN PRISHTHAMATRA E..DEVANAGARI VOWEL SIGN AW
            (0x0982 <= code && code <= 0x0983) || // Mc   [2] BENGALI SIGN ANUSVARA..BENGALI SIGN VISARGA
            (0x09bf <= code && code <= 0x09c0) || // Mc   [2] BENGALI VOWEL SIGN I..BENGALI VOWEL SIGN II
            (0x09c7 <= code && code <= 0x09c8) || // Mc   [2] BENGALI VOWEL SIGN E..BENGALI VOWEL SIGN AI
            (0x09cb <= code && code <= 0x09cc) || // Mc   [2] BENGALI VOWEL SIGN O..BENGALI VOWEL SIGN AU
            0x0a03 === code || // Mc       GURMUKHI SIGN VISARGA
            (0x0a3e <= code && code <= 0x0a40) || // Mc   [3] GURMUKHI VOWEL SIGN AA..GURMUKHI VOWEL SIGN II
            0x0a83 === code || // Mc       GUJARATI SIGN VISARGA
            (0x0abe <= code && code <= 0x0ac0) || // Mc   [3] GUJARATI VOWEL SIGN AA..GUJARATI VOWEL SIGN II
            0x0ac9 === code || // Mc       GUJARATI VOWEL SIGN CANDRA O
            (0x0acb <= code && code <= 0x0acc) || // Mc   [2] GUJARATI VOWEL SIGN O..GUJARATI VOWEL SIGN AU
            (0x0b02 <= code && code <= 0x0b03) || // Mc   [2] ORIYA SIGN ANUSVARA..ORIYA SIGN VISARGA
            0x0b40 === code || // Mc       ORIYA VOWEL SIGN II
            (0x0b47 <= code && code <= 0x0b48) || // Mc   [2] ORIYA VOWEL SIGN E..ORIYA VOWEL SIGN AI
            (0x0b4b <= code && code <= 0x0b4c) || // Mc   [2] ORIYA VOWEL SIGN O..ORIYA VOWEL SIGN AU
            0x0bbf === code || // Mc       TAMIL VOWEL SIGN I
            (0x0bc1 <= code && code <= 0x0bc2) || // Mc   [2] TAMIL VOWEL SIGN U..TAMIL VOWEL SIGN UU
            (0x0bc6 <= code && code <= 0x0bc8) || // Mc   [3] TAMIL VOWEL SIGN E..TAMIL VOWEL SIGN AI
            (0x0bca <= code && code <= 0x0bcc) || // Mc   [3] TAMIL VOWEL SIGN O..TAMIL VOWEL SIGN AU
            (0x0c01 <= code && code <= 0x0c03) || // Mc   [3] TELUGU SIGN CANDRABINDU..TELUGU SIGN VISARGA
            (0x0c41 <= code && code <= 0x0c44) || // Mc   [4] TELUGU VOWEL SIGN U..TELUGU VOWEL SIGN VOCALIC RR
            (0x0c82 <= code && code <= 0x0c83) || // Mc   [2] KANNADA SIGN ANUSVARA..KANNADA SIGN VISARGA
            0x0cbe === code || // Mc       KANNADA VOWEL SIGN AA
            (0x0cc0 <= code && code <= 0x0cc1) || // Mc   [2] KANNADA VOWEL SIGN II..KANNADA VOWEL SIGN U
            (0x0cc3 <= code && code <= 0x0cc4) || // Mc   [2] KANNADA VOWEL SIGN VOCALIC R..KANNADA VOWEL SIGN VOCALIC RR
            (0x0cc7 <= code && code <= 0x0cc8) || // Mc   [2] KANNADA VOWEL SIGN EE..KANNADA VOWEL SIGN AI
            (0x0cca <= code && code <= 0x0ccb) || // Mc   [2] KANNADA VOWEL SIGN O..KANNADA VOWEL SIGN OO
            (0x0d02 <= code && code <= 0x0d03) || // Mc   [2] MALAYALAM SIGN ANUSVARA..MALAYALAM SIGN VISARGA
            (0x0d3f <= code && code <= 0x0d40) || // Mc   [2] MALAYALAM VOWEL SIGN I..MALAYALAM VOWEL SIGN II
            (0x0d46 <= code && code <= 0x0d48) || // Mc   [3] MALAYALAM VOWEL SIGN E..MALAYALAM VOWEL SIGN AI
            (0x0d4a <= code && code <= 0x0d4c) || // Mc   [3] MALAYALAM VOWEL SIGN O..MALAYALAM VOWEL SIGN AU
            (0x0d82 <= code && code <= 0x0d83) || // Mc   [2] SINHALA SIGN ANUSVARAYA..SINHALA SIGN VISARGAYA
            (0x0dd0 <= code && code <= 0x0dd1) || // Mc   [2] SINHALA VOWEL SIGN KETTI AEDA-PILLA..SINHALA VOWEL SIGN DIGA AEDA-PILLA
            (0x0dd8 <= code && code <= 0x0dde) || // Mc   [7] SINHALA VOWEL SIGN GAETTA-PILLA..SINHALA VOWEL SIGN KOMBUVA HAA GAYANUKITTA
            (0x0df2 <= code && code <= 0x0df3) || // Mc   [2] SINHALA VOWEL SIGN DIGA GAETTA-PILLA..SINHALA VOWEL SIGN DIGA GAYANUKITTA
            0x0e33 === code || // Lo       THAI CHARACTER SARA AM
            0x0eb3 === code || // Lo       LAO VOWEL SIGN AM
            (0x0f3e <= code && code <= 0x0f3f) || // Mc   [2] TIBETAN SIGN YAR TSHES..TIBETAN SIGN MAR TSHES
            0x0f7f === code || // Mc       TIBETAN SIGN RNAM BCAD
            0x1031 === code || // Mc       MYANMAR VOWEL SIGN E
            (0x103b <= code && code <= 0x103c) || // Mc   [2] MYANMAR CONSONANT SIGN MEDIAL YA..MYANMAR CONSONANT SIGN MEDIAL RA
            (0x1056 <= code && code <= 0x1057) || // Mc   [2] MYANMAR VOWEL SIGN VOCALIC R..MYANMAR VOWEL SIGN VOCALIC RR
            0x1084 === code || // Mc       MYANMAR VOWEL SIGN SHAN E
            0x17b6 === code || // Mc       KHMER VOWEL SIGN AA
            (0x17be <= code && code <= 0x17c5) || // Mc   [8] KHMER VOWEL SIGN OE..KHMER VOWEL SIGN AU
            (0x17c7 <= code && code <= 0x17c8) || // Mc   [2] KHMER SIGN REAHMUK..KHMER SIGN YUUKALEAPINTU
            (0x1923 <= code && code <= 0x1926) || // Mc   [4] LIMBU VOWEL SIGN EE..LIMBU VOWEL SIGN AU
            (0x1929 <= code && code <= 0x192b) || // Mc   [3] LIMBU SUBJOINED LETTER YA..LIMBU SUBJOINED LETTER WA
            (0x1930 <= code && code <= 0x1931) || // Mc   [2] LIMBU SMALL LETTER KA..LIMBU SMALL LETTER NGA
            (0x1933 <= code && code <= 0x1938) || // Mc   [6] LIMBU SMALL LETTER TA..LIMBU SMALL LETTER LA
            (0x1a19 <= code && code <= 0x1a1a) || // Mc   [2] BUGINESE VOWEL SIGN E..BUGINESE VOWEL SIGN O
            0x1a55 === code || // Mc       TAI THAM CONSONANT SIGN MEDIAL RA
            0x1a57 === code || // Mc       TAI THAM CONSONANT SIGN LA TANG LAI
            (0x1a6d <= code && code <= 0x1a72) || // Mc   [6] TAI THAM VOWEL SIGN OY..TAI THAM VOWEL SIGN THAM AI
            0x1b04 === code || // Mc       BALINESE SIGN BISAH
            0x1b3b === code || // Mc       BALINESE VOWEL SIGN RA REPA TEDUNG
            (0x1b3d <= code && code <= 0x1b41) || // Mc   [5] BALINESE VOWEL SIGN LA LENGA TEDUNG..BALINESE VOWEL SIGN TALING REPA TEDUNG
            (0x1b43 <= code && code <= 0x1b44) || // Mc   [2] BALINESE VOWEL SIGN PEPET TEDUNG..BALINESE ADEG ADEG
            0x1b82 === code || // Mc       SUNDANESE SIGN PANGWISAD
            0x1ba1 === code || // Mc       SUNDANESE CONSONANT SIGN PAMINGKAL
            (0x1ba6 <= code && code <= 0x1ba7) || // Mc   [2] SUNDANESE VOWEL SIGN PANAELAENG..SUNDANESE VOWEL SIGN PANOLONG
            0x1baa === code || // Mc       SUNDANESE SIGN PAMAAEH
            0x1be7 === code || // Mc       BATAK VOWEL SIGN E
            (0x1bea <= code && code <= 0x1bec) || // Mc   [3] BATAK VOWEL SIGN I..BATAK VOWEL SIGN O
            0x1bee === code || // Mc       BATAK VOWEL SIGN U
            (0x1bf2 <= code && code <= 0x1bf3) || // Mc   [2] BATAK PANGOLAT..BATAK PANONGONAN
            (0x1c24 <= code && code <= 0x1c2b) || // Mc   [8] LEPCHA SUBJOINED LETTER YA..LEPCHA VOWEL SIGN UU
            (0x1c34 <= code && code <= 0x1c35) || // Mc   [2] LEPCHA CONSONANT SIGN NYIN-DO..LEPCHA CONSONANT SIGN KANG
            0x1ce1 === code || // Mc       VEDIC TONE ATHARVAVEDIC INDEPENDENT SVARITA
            0x1cf7 === code || // Mc       VEDIC SIGN ATIKRAMA
            (0xa823 <= code && code <= 0xa824) || // Mc   [2] SYLOTI NAGRI VOWEL SIGN A..SYLOTI NAGRI VOWEL SIGN I
            0xa827 === code || // Mc       SYLOTI NAGRI VOWEL SIGN OO
            (0xa880 <= code && code <= 0xa881) || // Mc   [2] SAURASHTRA SIGN ANUSVARA..SAURASHTRA SIGN VISARGA
            (0xa8b4 <= code && code <= 0xa8c3) || // Mc  [16] SAURASHTRA CONSONANT SIGN HAARU..SAURASHTRA VOWEL SIGN AU
            (0xa952 <= code && code <= 0xa953) || // Mc   [2] REJANG CONSONANT SIGN H..REJANG VIRAMA
            0xa983 === code || // Mc       JAVANESE SIGN WIGNYAN
            (0xa9b4 <= code && code <= 0xa9b5) || // Mc   [2] JAVANESE VOWEL SIGN TARUNG..JAVANESE VOWEL SIGN TOLONG
            (0xa9ba <= code && code <= 0xa9bb) || // Mc   [2] JAVANESE VOWEL SIGN TALING..JAVANESE VOWEL SIGN DIRGA MURE
            (0xa9be <= code && code <= 0xa9c0) || // Mc   [3] JAVANESE CONSONANT SIGN PENGKAL..JAVANESE PANGKON
            (0xaa2f <= code && code <= 0xaa30) || // Mc   [2] CHAM VOWEL SIGN O..CHAM VOWEL SIGN AI
            (0xaa33 <= code && code <= 0xaa34) || // Mc   [2] CHAM CONSONANT SIGN YA..CHAM CONSONANT SIGN RA
            0xaa4d === code || // Mc       CHAM CONSONANT SIGN FINAL H
            0xaaeb === code || // Mc       MEETEI MAYEK VOWEL SIGN II
            (0xaaee <= code && code <= 0xaaef) || // Mc   [2] MEETEI MAYEK VOWEL SIGN AU..MEETEI MAYEK VOWEL SIGN AAU
            0xaaf5 === code || // Mc       MEETEI MAYEK VOWEL SIGN VISARGA
            (0xabe3 <= code && code <= 0xabe4) || // Mc   [2] MEETEI MAYEK VOWEL SIGN ONAP..MEETEI MAYEK VOWEL SIGN INAP
            (0xabe6 <= code && code <= 0xabe7) || // Mc   [2] MEETEI MAYEK VOWEL SIGN YENAP..MEETEI MAYEK VOWEL SIGN SOUNAP
            (0xabe9 <= code && code <= 0xabea) || // Mc   [2] MEETEI MAYEK VOWEL SIGN CHEINAP..MEETEI MAYEK VOWEL SIGN NUNG
            0xabec === code || // Mc       MEETEI MAYEK LUM IYEK
            0x11000 === code || // Mc       BRAHMI SIGN CANDRABINDU
            0x11002 === code || // Mc       BRAHMI SIGN VISARGA
            0x11082 === code || // Mc       KAITHI SIGN VISARGA
            (0x110b0 <= code && code <= 0x110b2) || // Mc   [3] KAITHI VOWEL SIGN AA..KAITHI VOWEL SIGN II
            (0x110b7 <= code && code <= 0x110b8) || // Mc   [2] KAITHI VOWEL SIGN O..KAITHI VOWEL SIGN AU
            0x1112c === code || // Mc       CHAKMA VOWEL SIGN E
            (0x11145 <= code && code <= 0x11146) || // Mc   [2] CHAKMA VOWEL SIGN AA..CHAKMA VOWEL SIGN EI
            0x11182 === code || // Mc       SHARADA SIGN VISARGA
            (0x111b3 <= code && code <= 0x111b5) || // Mc   [3] SHARADA VOWEL SIGN AA..SHARADA VOWEL SIGN II
            (0x111bf <= code && code <= 0x111c0) || // Mc   [2] SHARADA VOWEL SIGN AU..SHARADA SIGN VIRAMA
            0x111ce === code || // Mc       SHARADA VOWEL SIGN PRISHTHAMATRA E
            (0x1122c <= code && code <= 0x1122e) || // Mc   [3] KHOJKI VOWEL SIGN AA..KHOJKI VOWEL SIGN II
            (0x11232 <= code && code <= 0x11233) || // Mc   [2] KHOJKI VOWEL SIGN O..KHOJKI VOWEL SIGN AU
            0x11235 === code || // Mc       KHOJKI SIGN VIRAMA
            (0x112e0 <= code && code <= 0x112e2) || // Mc   [3] KHUDAWADI VOWEL SIGN AA..KHUDAWADI VOWEL SIGN II
            (0x11302 <= code && code <= 0x11303) || // Mc   [2] GRANTHA SIGN ANUSVARA..GRANTHA SIGN VISARGA
            0x1133f === code || // Mc       GRANTHA VOWEL SIGN I
            (0x11341 <= code && code <= 0x11344) || // Mc   [4] GRANTHA VOWEL SIGN U..GRANTHA VOWEL SIGN VOCALIC RR
            (0x11347 <= code && code <= 0x11348) || // Mc   [2] GRANTHA VOWEL SIGN EE..GRANTHA VOWEL SIGN AI
            (0x1134b <= code && code <= 0x1134d) || // Mc   [3] GRANTHA VOWEL SIGN OO..GRANTHA SIGN VIRAMA
            (0x11362 <= code && code <= 0x11363) || // Mc   [2] GRANTHA VOWEL SIGN VOCALIC L..GRANTHA VOWEL SIGN VOCALIC LL
            (0x11435 <= code && code <= 0x11437) || // Mc   [3] NEWA VOWEL SIGN AA..NEWA VOWEL SIGN II
            (0x11440 <= code && code <= 0x11441) || // Mc   [2] NEWA VOWEL SIGN O..NEWA VOWEL SIGN AU
            0x11445 === code || // Mc       NEWA SIGN VISARGA
            (0x114b1 <= code && code <= 0x114b2) || // Mc   [2] TIRHUTA VOWEL SIGN I..TIRHUTA VOWEL SIGN II
            0x114b9 === code || // Mc       TIRHUTA VOWEL SIGN E
            (0x114bb <= code && code <= 0x114bc) || // Mc   [2] TIRHUTA VOWEL SIGN AI..TIRHUTA VOWEL SIGN O
            0x114be === code || // Mc       TIRHUTA VOWEL SIGN AU
            0x114c1 === code || // Mc       TIRHUTA SIGN VISARGA
            (0x115b0 <= code && code <= 0x115b1) || // Mc   [2] SIDDHAM VOWEL SIGN I..SIDDHAM VOWEL SIGN II
            (0x115b8 <= code && code <= 0x115bb) || // Mc   [4] SIDDHAM VOWEL SIGN E..SIDDHAM VOWEL SIGN AU
            0x115be === code || // Mc       SIDDHAM SIGN VISARGA
            (0x11630 <= code && code <= 0x11632) || // Mc   [3] MODI VOWEL SIGN AA..MODI VOWEL SIGN II
            (0x1163b <= code && code <= 0x1163c) || // Mc   [2] MODI VOWEL SIGN O..MODI VOWEL SIGN AU
            0x1163e === code || // Mc       MODI SIGN VISARGA
            0x116ac === code || // Mc       TAKRI SIGN VISARGA
            (0x116ae <= code && code <= 0x116af) || // Mc   [2] TAKRI VOWEL SIGN I..TAKRI VOWEL SIGN II
            0x116b6 === code || // Mc       TAKRI SIGN VIRAMA
            (0x11720 <= code && code <= 0x11721) || // Mc   [2] AHOM VOWEL SIGN A..AHOM VOWEL SIGN AA
            0x11726 === code || // Mc       AHOM VOWEL SIGN E
            (0x1182c <= code && code <= 0x1182e) || // Mc   [3] DOGRA VOWEL SIGN AA..DOGRA VOWEL SIGN II
            0x11838 === code || // Mc       DOGRA SIGN VISARGA
            (0x11931 <= code && code <= 0x11935) || // Mc   [5] DIVES AKURU VOWEL SIGN I..DIVES AKURU VOWEL SIGN E
            (0x11937 <= code && code <= 0x11938) || // Mc   [2] DIVES AKURU VOWEL SIGN AI..DIVES AKURU VOWEL SIGN O
            0x1193d === code || // Mc       DIVES AKURU SIGN HALANTA
            0x11940 === code || // Mc       DIVES AKURU MEDIAL YA
            0x11942 === code || // Mc       DIVES AKURU MEDIAL RA
            (0x119d1 <= code && code <= 0x119d3) || // Mc   [3] NANDINAGARI VOWEL SIGN AA..NANDINAGARI VOWEL SIGN II
            (0x119dc <= code && code <= 0x119df) || // Mc   [4] NANDINAGARI VOWEL SIGN O..NANDINAGARI SIGN VISARGA
            0x119e4 === code || // Mc       NANDINAGARI VOWEL SIGN PRISHTHAMATRA E
            0x11a39 === code || // Mc       ZANABAZAR SQUARE SIGN VISARGA
            (0x11a57 <= code && code <= 0x11a58) || // Mc   [2] SOYOMBO VOWEL SIGN AI..SOYOMBO VOWEL SIGN AU
            0x11a97 === code || // Mc       SOYOMBO SIGN VISARGA
            0x11c2f === code || // Mc       BHAIKSUKI VOWEL SIGN AA
            0x11c3e === code || // Mc       BHAIKSUKI SIGN VISARGA
            0x11ca9 === code || // Mc       MARCHEN SUBJOINED LETTER YA
            0x11cb1 === code || // Mc       MARCHEN VOWEL SIGN I
            0x11cb4 === code || // Mc       MARCHEN VOWEL SIGN O
            (0x11d8a <= code && code <= 0x11d8e) || // Mc   [5] GUNJALA GONDI VOWEL SIGN AA..GUNJALA GONDI VOWEL SIGN UU
            (0x11d93 <= code && code <= 0x11d94) || // Mc   [2] GUNJALA GONDI VOWEL SIGN OO..GUNJALA GONDI VOWEL SIGN AU
            0x11d96 === code || // Mc       GUNJALA GONDI SIGN VISARGA
            (0x11ef5 <= code && code <= 0x11ef6) || // Mc   [2] MAKASAR VOWEL SIGN E..MAKASAR VOWEL SIGN O
            (0x16f51 <= code && code <= 0x16f87) || // Mc  [55] MIAO SIGN ASPIRATION..MIAO VOWEL SIGN UI
            (0x16ff0 <= code && code <= 0x16ff1) || // Mc   [2] VIETNAMESE ALTERNATE READING MARK CA..VIETNAMESE ALTERNATE READING MARK NHAY
            0x1d166 === code || // Mc       MUSICAL SYMBOL COMBINING SPRECHGESANG STEM
            0x1d16d === code // Mc       MUSICAL SYMBOL COMBINING AUGMENTATION DOT
        ) {
            return boundaries_1.CLUSTER_BREAK.SPACINGMARK;
        }
        if ((0x1100 <= code && code <= 0x115f) || // Lo  [96] HANGUL CHOSEONG KIYEOK..HANGUL CHOSEONG FILLER
            (0xa960 <= code && code <= 0xa97c) // Lo  [29] HANGUL CHOSEONG TIKEUT-MIEUM..HANGUL CHOSEONG SSANGYEORINHIEUH
        ) {
            return boundaries_1.CLUSTER_BREAK.L;
        }
        if ((0x1160 <= code && code <= 0x11a7) || // Lo  [72] HANGUL JUNGSEONG FILLER..HANGUL JUNGSEONG O-YAE
            (0xd7b0 <= code && code <= 0xd7c6) // Lo  [23] HANGUL JUNGSEONG O-YEO..HANGUL JUNGSEONG ARAEA-E
        ) {
            return boundaries_1.CLUSTER_BREAK.V;
        }
        if ((0x11a8 <= code && code <= 0x11ff) || // Lo  [88] HANGUL JONGSEONG KIYEOK..HANGUL JONGSEONG SSANGNIEUN
            (0xd7cb <= code && code <= 0xd7fb) // Lo  [49] HANGUL JONGSEONG NIEUN-RIEUL..HANGUL JONGSEONG PHIEUPH-THIEUTH
        ) {
            return boundaries_1.CLUSTER_BREAK.T;
        }
        if (0xac00 === code || // Lo       HANGUL SYLLABLE GA
            0xac1c === code || // Lo       HANGUL SYLLABLE GAE
            0xac38 === code || // Lo       HANGUL SYLLABLE GYA
            0xac54 === code || // Lo       HANGUL SYLLABLE GYAE
            0xac70 === code || // Lo       HANGUL SYLLABLE GEO
            0xac8c === code || // Lo       HANGUL SYLLABLE GE
            0xaca8 === code || // Lo       HANGUL SYLLABLE GYEO
            0xacc4 === code || // Lo       HANGUL SYLLABLE GYE
            0xace0 === code || // Lo       HANGUL SYLLABLE GO
            0xacfc === code || // Lo       HANGUL SYLLABLE GWA
            0xad18 === code || // Lo       HANGUL SYLLABLE GWAE
            0xad34 === code || // Lo       HANGUL SYLLABLE GOE
            0xad50 === code || // Lo       HANGUL SYLLABLE GYO
            0xad6c === code || // Lo       HANGUL SYLLABLE GU
            0xad88 === code || // Lo       HANGUL SYLLABLE GWEO
            0xada4 === code || // Lo       HANGUL SYLLABLE GWE
            0xadc0 === code || // Lo       HANGUL SYLLABLE GWI
            0xaddc === code || // Lo       HANGUL SYLLABLE GYU
            0xadf8 === code || // Lo       HANGUL SYLLABLE GEU
            0xae14 === code || // Lo       HANGUL SYLLABLE GYI
            0xae30 === code || // Lo       HANGUL SYLLABLE GI
            0xae4c === code || // Lo       HANGUL SYLLABLE GGA
            0xae68 === code || // Lo       HANGUL SYLLABLE GGAE
            0xae84 === code || // Lo       HANGUL SYLLABLE GGYA
            0xaea0 === code || // Lo       HANGUL SYLLABLE GGYAE
            0xaebc === code || // Lo       HANGUL SYLLABLE GGEO
            0xaed8 === code || // Lo       HANGUL SYLLABLE GGE
            0xaef4 === code || // Lo       HANGUL SYLLABLE GGYEO
            0xaf10 === code || // Lo       HANGUL SYLLABLE GGYE
            0xaf2c === code || // Lo       HANGUL SYLLABLE GGO
            0xaf48 === code || // Lo       HANGUL SYLLABLE GGWA
            0xaf64 === code || // Lo       HANGUL SYLLABLE GGWAE
            0xaf80 === code || // Lo       HANGUL SYLLABLE GGOE
            0xaf9c === code || // Lo       HANGUL SYLLABLE GGYO
            0xafb8 === code || // Lo       HANGUL SYLLABLE GGU
            0xafd4 === code || // Lo       HANGUL SYLLABLE GGWEO
            0xaff0 === code || // Lo       HANGUL SYLLABLE GGWE
            0xb00c === code || // Lo       HANGUL SYLLABLE GGWI
            0xb028 === code || // Lo       HANGUL SYLLABLE GGYU
            0xb044 === code || // Lo       HANGUL SYLLABLE GGEU
            0xb060 === code || // Lo       HANGUL SYLLABLE GGYI
            0xb07c === code || // Lo       HANGUL SYLLABLE GGI
            0xb098 === code || // Lo       HANGUL SYLLABLE NA
            0xb0b4 === code || // Lo       HANGUL SYLLABLE NAE
            0xb0d0 === code || // Lo       HANGUL SYLLABLE NYA
            0xb0ec === code || // Lo       HANGUL SYLLABLE NYAE
            0xb108 === code || // Lo       HANGUL SYLLABLE NEO
            0xb124 === code || // Lo       HANGUL SYLLABLE NE
            0xb140 === code || // Lo       HANGUL SYLLABLE NYEO
            0xb15c === code || // Lo       HANGUL SYLLABLE NYE
            0xb178 === code || // Lo       HANGUL SYLLABLE NO
            0xb194 === code || // Lo       HANGUL SYLLABLE NWA
            0xb1b0 === code || // Lo       HANGUL SYLLABLE NWAE
            0xb1cc === code || // Lo       HANGUL SYLLABLE NOE
            0xb1e8 === code || // Lo       HANGUL SYLLABLE NYO
            0xb204 === code || // Lo       HANGUL SYLLABLE NU
            0xb220 === code || // Lo       HANGUL SYLLABLE NWEO
            0xb23c === code || // Lo       HANGUL SYLLABLE NWE
            0xb258 === code || // Lo       HANGUL SYLLABLE NWI
            0xb274 === code || // Lo       HANGUL SYLLABLE NYU
            0xb290 === code || // Lo       HANGUL SYLLABLE NEU
            0xb2ac === code || // Lo       HANGUL SYLLABLE NYI
            0xb2c8 === code || // Lo       HANGUL SYLLABLE NI
            0xb2e4 === code || // Lo       HANGUL SYLLABLE DA
            0xb300 === code || // Lo       HANGUL SYLLABLE DAE
            0xb31c === code || // Lo       HANGUL SYLLABLE DYA
            0xb338 === code || // Lo       HANGUL SYLLABLE DYAE
            0xb354 === code || // Lo       HANGUL SYLLABLE DEO
            0xb370 === code || // Lo       HANGUL SYLLABLE DE
            0xb38c === code || // Lo       HANGUL SYLLABLE DYEO
            0xb3a8 === code || // Lo       HANGUL SYLLABLE DYE
            0xb3c4 === code || // Lo       HANGUL SYLLABLE DO
            0xb3e0 === code || // Lo       HANGUL SYLLABLE DWA
            0xb3fc === code || // Lo       HANGUL SYLLABLE DWAE
            0xb418 === code || // Lo       HANGUL SYLLABLE DOE
            0xb434 === code || // Lo       HANGUL SYLLABLE DYO
            0xb450 === code || // Lo       HANGUL SYLLABLE DU
            0xb46c === code || // Lo       HANGUL SYLLABLE DWEO
            0xb488 === code || // Lo       HANGUL SYLLABLE DWE
            0xb4a4 === code || // Lo       HANGUL SYLLABLE DWI
            0xb4c0 === code || // Lo       HANGUL SYLLABLE DYU
            0xb4dc === code || // Lo       HANGUL SYLLABLE DEU
            0xb4f8 === code || // Lo       HANGUL SYLLABLE DYI
            0xb514 === code || // Lo       HANGUL SYLLABLE DI
            0xb530 === code || // Lo       HANGUL SYLLABLE DDA
            0xb54c === code || // Lo       HANGUL SYLLABLE DDAE
            0xb568 === code || // Lo       HANGUL SYLLABLE DDYA
            0xb584 === code || // Lo       HANGUL SYLLABLE DDYAE
            0xb5a0 === code || // Lo       HANGUL SYLLABLE DDEO
            0xb5bc === code || // Lo       HANGUL SYLLABLE DDE
            0xb5d8 === code || // Lo       HANGUL SYLLABLE DDYEO
            0xb5f4 === code || // Lo       HANGUL SYLLABLE DDYE
            0xb610 === code || // Lo       HANGUL SYLLABLE DDO
            0xb62c === code || // Lo       HANGUL SYLLABLE DDWA
            0xb648 === code || // Lo       HANGUL SYLLABLE DDWAE
            0xb664 === code || // Lo       HANGUL SYLLABLE DDOE
            0xb680 === code || // Lo       HANGUL SYLLABLE DDYO
            0xb69c === code || // Lo       HANGUL SYLLABLE DDU
            0xb6b8 === code || // Lo       HANGUL SYLLABLE DDWEO
            0xb6d4 === code || // Lo       HANGUL SYLLABLE DDWE
            0xb6f0 === code || // Lo       HANGUL SYLLABLE DDWI
            0xb70c === code || // Lo       HANGUL SYLLABLE DDYU
            0xb728 === code || // Lo       HANGUL SYLLABLE DDEU
            0xb744 === code || // Lo       HANGUL SYLLABLE DDYI
            0xb760 === code || // Lo       HANGUL SYLLABLE DDI
            0xb77c === code || // Lo       HANGUL SYLLABLE RA
            0xb798 === code || // Lo       HANGUL SYLLABLE RAE
            0xb7b4 === code || // Lo       HANGUL SYLLABLE RYA
            0xb7d0 === code || // Lo       HANGUL SYLLABLE RYAE
            0xb7ec === code || // Lo       HANGUL SYLLABLE REO
            0xb808 === code || // Lo       HANGUL SYLLABLE RE
            0xb824 === code || // Lo       HANGUL SYLLABLE RYEO
            0xb840 === code || // Lo       HANGUL SYLLABLE RYE
            0xb85c === code || // Lo       HANGUL SYLLABLE RO
            0xb878 === code || // Lo       HANGUL SYLLABLE RWA
            0xb894 === code || // Lo       HANGUL SYLLABLE RWAE
            0xb8b0 === code || // Lo       HANGUL SYLLABLE ROE
            0xb8cc === code || // Lo       HANGUL SYLLABLE RYO
            0xb8e8 === code || // Lo       HANGUL SYLLABLE RU
            0xb904 === code || // Lo       HANGUL SYLLABLE RWEO
            0xb920 === code || // Lo       HANGUL SYLLABLE RWE
            0xb93c === code || // Lo       HANGUL SYLLABLE RWI
            0xb958 === code || // Lo       HANGUL SYLLABLE RYU
            0xb974 === code || // Lo       HANGUL SYLLABLE REU
            0xb990 === code || // Lo       HANGUL SYLLABLE RYI
            0xb9ac === code || // Lo       HANGUL SYLLABLE RI
            0xb9c8 === code || // Lo       HANGUL SYLLABLE MA
            0xb9e4 === code || // Lo       HANGUL SYLLABLE MAE
            0xba00 === code || // Lo       HANGUL SYLLABLE MYA
            0xba1c === code || // Lo       HANGUL SYLLABLE MYAE
            0xba38 === code || // Lo       HANGUL SYLLABLE MEO
            0xba54 === code || // Lo       HANGUL SYLLABLE ME
            0xba70 === code || // Lo       HANGUL SYLLABLE MYEO
            0xba8c === code || // Lo       HANGUL SYLLABLE MYE
            0xbaa8 === code || // Lo       HANGUL SYLLABLE MO
            0xbac4 === code || // Lo       HANGUL SYLLABLE MWA
            0xbae0 === code || // Lo       HANGUL SYLLABLE MWAE
            0xbafc === code || // Lo       HANGUL SYLLABLE MOE
            0xbb18 === code || // Lo       HANGUL SYLLABLE MYO
            0xbb34 === code || // Lo       HANGUL SYLLABLE MU
            0xbb50 === code || // Lo       HANGUL SYLLABLE MWEO
            0xbb6c === code || // Lo       HANGUL SYLLABLE MWE
            0xbb88 === code || // Lo       HANGUL SYLLABLE MWI
            0xbba4 === code || // Lo       HANGUL SYLLABLE MYU
            0xbbc0 === code || // Lo       HANGUL SYLLABLE MEU
            0xbbdc === code || // Lo       HANGUL SYLLABLE MYI
            0xbbf8 === code || // Lo       HANGUL SYLLABLE MI
            0xbc14 === code || // Lo       HANGUL SYLLABLE BA
            0xbc30 === code || // Lo       HANGUL SYLLABLE BAE
            0xbc4c === code || // Lo       HANGUL SYLLABLE BYA
            0xbc68 === code || // Lo       HANGUL SYLLABLE BYAE
            0xbc84 === code || // Lo       HANGUL SYLLABLE BEO
            0xbca0 === code || // Lo       HANGUL SYLLABLE BE
            0xbcbc === code || // Lo       HANGUL SYLLABLE BYEO
            0xbcd8 === code || // Lo       HANGUL SYLLABLE BYE
            0xbcf4 === code || // Lo       HANGUL SYLLABLE BO
            0xbd10 === code || // Lo       HANGUL SYLLABLE BWA
            0xbd2c === code || // Lo       HANGUL SYLLABLE BWAE
            0xbd48 === code || // Lo       HANGUL SYLLABLE BOE
            0xbd64 === code || // Lo       HANGUL SYLLABLE BYO
            0xbd80 === code || // Lo       HANGUL SYLLABLE BU
            0xbd9c === code || // Lo       HANGUL SYLLABLE BWEO
            0xbdb8 === code || // Lo       HANGUL SYLLABLE BWE
            0xbdd4 === code || // Lo       HANGUL SYLLABLE BWI
            0xbdf0 === code || // Lo       HANGUL SYLLABLE BYU
            0xbe0c === code || // Lo       HANGUL SYLLABLE BEU
            0xbe28 === code || // Lo       HANGUL SYLLABLE BYI
            0xbe44 === code || // Lo       HANGUL SYLLABLE BI
            0xbe60 === code || // Lo       HANGUL SYLLABLE BBA
            0xbe7c === code || // Lo       HANGUL SYLLABLE BBAE
            0xbe98 === code || // Lo       HANGUL SYLLABLE BBYA
            0xbeb4 === code || // Lo       HANGUL SYLLABLE BBYAE
            0xbed0 === code || // Lo       HANGUL SYLLABLE BBEO
            0xbeec === code || // Lo       HANGUL SYLLABLE BBE
            0xbf08 === code || // Lo       HANGUL SYLLABLE BBYEO
            0xbf24 === code || // Lo       HANGUL SYLLABLE BBYE
            0xbf40 === code || // Lo       HANGUL SYLLABLE BBO
            0xbf5c === code || // Lo       HANGUL SYLLABLE BBWA
            0xbf78 === code || // Lo       HANGUL SYLLABLE BBWAE
            0xbf94 === code || // Lo       HANGUL SYLLABLE BBOE
            0xbfb0 === code || // Lo       HANGUL SYLLABLE BBYO
            0xbfcc === code || // Lo       HANGUL SYLLABLE BBU
            0xbfe8 === code || // Lo       HANGUL SYLLABLE BBWEO
            0xc004 === code || // Lo       HANGUL SYLLABLE BBWE
            0xc020 === code || // Lo       HANGUL SYLLABLE BBWI
            0xc03c === code || // Lo       HANGUL SYLLABLE BBYU
            0xc058 === code || // Lo       HANGUL SYLLABLE BBEU
            0xc074 === code || // Lo       HANGUL SYLLABLE BBYI
            0xc090 === code || // Lo       HANGUL SYLLABLE BBI
            0xc0ac === code || // Lo       HANGUL SYLLABLE SA
            0xc0c8 === code || // Lo       HANGUL SYLLABLE SAE
            0xc0e4 === code || // Lo       HANGUL SYLLABLE SYA
            0xc100 === code || // Lo       HANGUL SYLLABLE SYAE
            0xc11c === code || // Lo       HANGUL SYLLABLE SEO
            0xc138 === code || // Lo       HANGUL SYLLABLE SE
            0xc154 === code || // Lo       HANGUL SYLLABLE SYEO
            0xc170 === code || // Lo       HANGUL SYLLABLE SYE
            0xc18c === code || // Lo       HANGUL SYLLABLE SO
            0xc1a8 === code || // Lo       HANGUL SYLLABLE SWA
            0xc1c4 === code || // Lo       HANGUL SYLLABLE SWAE
            0xc1e0 === code || // Lo       HANGUL SYLLABLE SOE
            0xc1fc === code || // Lo       HANGUL SYLLABLE SYO
            0xc218 === code || // Lo       HANGUL SYLLABLE SU
            0xc234 === code || // Lo       HANGUL SYLLABLE SWEO
            0xc250 === code || // Lo       HANGUL SYLLABLE SWE
            0xc26c === code || // Lo       HANGUL SYLLABLE SWI
            0xc288 === code || // Lo       HANGUL SYLLABLE SYU
            0xc2a4 === code || // Lo       HANGUL SYLLABLE SEU
            0xc2c0 === code || // Lo       HANGUL SYLLABLE SYI
            0xc2dc === code || // Lo       HANGUL SYLLABLE SI
            0xc2f8 === code || // Lo       HANGUL SYLLABLE SSA
            0xc314 === code || // Lo       HANGUL SYLLABLE SSAE
            0xc330 === code || // Lo       HANGUL SYLLABLE SSYA
            0xc34c === code || // Lo       HANGUL SYLLABLE SSYAE
            0xc368 === code || // Lo       HANGUL SYLLABLE SSEO
            0xc384 === code || // Lo       HANGUL SYLLABLE SSE
            0xc3a0 === code || // Lo       HANGUL SYLLABLE SSYEO
            0xc3bc === code || // Lo       HANGUL SYLLABLE SSYE
            0xc3d8 === code || // Lo       HANGUL SYLLABLE SSO
            0xc3f4 === code || // Lo       HANGUL SYLLABLE SSWA
            0xc410 === code || // Lo       HANGUL SYLLABLE SSWAE
            0xc42c === code || // Lo       HANGUL SYLLABLE SSOE
            0xc448 === code || // Lo       HANGUL SYLLABLE SSYO
            0xc464 === code || // Lo       HANGUL SYLLABLE SSU
            0xc480 === code || // Lo       HANGUL SYLLABLE SSWEO
            0xc49c === code || // Lo       HANGUL SYLLABLE SSWE
            0xc4b8 === code || // Lo       HANGUL SYLLABLE SSWI
            0xc4d4 === code || // Lo       HANGUL SYLLABLE SSYU
            0xc4f0 === code || // Lo       HANGUL SYLLABLE SSEU
            0xc50c === code || // Lo       HANGUL SYLLABLE SSYI
            0xc528 === code || // Lo       HANGUL SYLLABLE SSI
            0xc544 === code || // Lo       HANGUL SYLLABLE A
            0xc560 === code || // Lo       HANGUL SYLLABLE AE
            0xc57c === code || // Lo       HANGUL SYLLABLE YA
            0xc598 === code || // Lo       HANGUL SYLLABLE YAE
            0xc5b4 === code || // Lo       HANGUL SYLLABLE EO
            0xc5d0 === code || // Lo       HANGUL SYLLABLE E
            0xc5ec === code || // Lo       HANGUL SYLLABLE YEO
            0xc608 === code || // Lo       HANGUL SYLLABLE YE
            0xc624 === code || // Lo       HANGUL SYLLABLE O
            0xc640 === code || // Lo       HANGUL SYLLABLE WA
            0xc65c === code || // Lo       HANGUL SYLLABLE WAE
            0xc678 === code || // Lo       HANGUL SYLLABLE OE
            0xc694 === code || // Lo       HANGUL SYLLABLE YO
            0xc6b0 === code || // Lo       HANGUL SYLLABLE U
            0xc6cc === code || // Lo       HANGUL SYLLABLE WEO
            0xc6e8 === code || // Lo       HANGUL SYLLABLE WE
            0xc704 === code || // Lo       HANGUL SYLLABLE WI
            0xc720 === code || // Lo       HANGUL SYLLABLE YU
            0xc73c === code || // Lo       HANGUL SYLLABLE EU
            0xc758 === code || // Lo       HANGUL SYLLABLE YI
            0xc774 === code || // Lo       HANGUL SYLLABLE I
            0xc790 === code || // Lo       HANGUL SYLLABLE JA
            0xc7ac === code || // Lo       HANGUL SYLLABLE JAE
            0xc7c8 === code || // Lo       HANGUL SYLLABLE JYA
            0xc7e4 === code || // Lo       HANGUL SYLLABLE JYAE
            0xc800 === code || // Lo       HANGUL SYLLABLE JEO
            0xc81c === code || // Lo       HANGUL SYLLABLE JE
            0xc838 === code || // Lo       HANGUL SYLLABLE JYEO
            0xc854 === code || // Lo       HANGUL SYLLABLE JYE
            0xc870 === code || // Lo       HANGUL SYLLABLE JO
            0xc88c === code || // Lo       HANGUL SYLLABLE JWA
            0xc8a8 === code || // Lo       HANGUL SYLLABLE JWAE
            0xc8c4 === code || // Lo       HANGUL SYLLABLE JOE
            0xc8e0 === code || // Lo       HANGUL SYLLABLE JYO
            0xc8fc === code || // Lo       HANGUL SYLLABLE JU
            0xc918 === code || // Lo       HANGUL SYLLABLE JWEO
            0xc934 === code || // Lo       HANGUL SYLLABLE JWE
            0xc950 === code || // Lo       HANGUL SYLLABLE JWI
            0xc96c === code || // Lo       HANGUL SYLLABLE JYU
            0xc988 === code || // Lo       HANGUL SYLLABLE JEU
            0xc9a4 === code || // Lo       HANGUL SYLLABLE JYI
            0xc9c0 === code || // Lo       HANGUL SYLLABLE JI
            0xc9dc === code || // Lo       HANGUL SYLLABLE JJA
            0xc9f8 === code || // Lo       HANGUL SYLLABLE JJAE
            0xca14 === code || // Lo       HANGUL SYLLABLE JJYA
            0xca30 === code || // Lo       HANGUL SYLLABLE JJYAE
            0xca4c === code || // Lo       HANGUL SYLLABLE JJEO
            0xca68 === code || // Lo       HANGUL SYLLABLE JJE
            0xca84 === code || // Lo       HANGUL SYLLABLE JJYEO
            0xcaa0 === code || // Lo       HANGUL SYLLABLE JJYE
            0xcabc === code || // Lo       HANGUL SYLLABLE JJO
            0xcad8 === code || // Lo       HANGUL SYLLABLE JJWA
            0xcaf4 === code || // Lo       HANGUL SYLLABLE JJWAE
            0xcb10 === code || // Lo       HANGUL SYLLABLE JJOE
            0xcb2c === code || // Lo       HANGUL SYLLABLE JJYO
            0xcb48 === code || // Lo       HANGUL SYLLABLE JJU
            0xcb64 === code || // Lo       HANGUL SYLLABLE JJWEO
            0xcb80 === code || // Lo       HANGUL SYLLABLE JJWE
            0xcb9c === code || // Lo       HANGUL SYLLABLE JJWI
            0xcbb8 === code || // Lo       HANGUL SYLLABLE JJYU
            0xcbd4 === code || // Lo       HANGUL SYLLABLE JJEU
            0xcbf0 === code || // Lo       HANGUL SYLLABLE JJYI
            0xcc0c === code || // Lo       HANGUL SYLLABLE JJI
            0xcc28 === code || // Lo       HANGUL SYLLABLE CA
            0xcc44 === code || // Lo       HANGUL SYLLABLE CAE
            0xcc60 === code || // Lo       HANGUL SYLLABLE CYA
            0xcc7c === code || // Lo       HANGUL SYLLABLE CYAE
            0xcc98 === code || // Lo       HANGUL SYLLABLE CEO
            0xccb4 === code || // Lo       HANGUL SYLLABLE CE
            0xccd0 === code || // Lo       HANGUL SYLLABLE CYEO
            0xccec === code || // Lo       HANGUL SYLLABLE CYE
            0xcd08 === code || // Lo       HANGUL SYLLABLE CO
            0xcd24 === code || // Lo       HANGUL SYLLABLE CWA
            0xcd40 === code || // Lo       HANGUL SYLLABLE CWAE
            0xcd5c === code || // Lo       HANGUL SYLLABLE COE
            0xcd78 === code || // Lo       HANGUL SYLLABLE CYO
            0xcd94 === code || // Lo       HANGUL SYLLABLE CU
            0xcdb0 === code || // Lo       HANGUL SYLLABLE CWEO
            0xcdcc === code || // Lo       HANGUL SYLLABLE CWE
            0xcde8 === code || // Lo       HANGUL SYLLABLE CWI
            0xce04 === code || // Lo       HANGUL SYLLABLE CYU
            0xce20 === code || // Lo       HANGUL SYLLABLE CEU
            0xce3c === code || // Lo       HANGUL SYLLABLE CYI
            0xce58 === code || // Lo       HANGUL SYLLABLE CI
            0xce74 === code || // Lo       HANGUL SYLLABLE KA
            0xce90 === code || // Lo       HANGUL SYLLABLE KAE
            0xceac === code || // Lo       HANGUL SYLLABLE KYA
            0xcec8 === code || // Lo       HANGUL SYLLABLE KYAE
            0xcee4 === code || // Lo       HANGUL SYLLABLE KEO
            0xcf00 === code || // Lo       HANGUL SYLLABLE KE
            0xcf1c === code || // Lo       HANGUL SYLLABLE KYEO
            0xcf38 === code || // Lo       HANGUL SYLLABLE KYE
            0xcf54 === code || // Lo       HANGUL SYLLABLE KO
            0xcf70 === code || // Lo       HANGUL SYLLABLE KWA
            0xcf8c === code || // Lo       HANGUL SYLLABLE KWAE
            0xcfa8 === code || // Lo       HANGUL SYLLABLE KOE
            0xcfc4 === code || // Lo       HANGUL SYLLABLE KYO
            0xcfe0 === code || // Lo       HANGUL SYLLABLE KU
            0xcffc === code || // Lo       HANGUL SYLLABLE KWEO
            0xd018 === code || // Lo       HANGUL SYLLABLE KWE
            0xd034 === code || // Lo       HANGUL SYLLABLE KWI
            0xd050 === code || // Lo       HANGUL SYLLABLE KYU
            0xd06c === code || // Lo       HANGUL SYLLABLE KEU
            0xd088 === code || // Lo       HANGUL SYLLABLE KYI
            0xd0a4 === code || // Lo       HANGUL SYLLABLE KI
            0xd0c0 === code || // Lo       HANGUL SYLLABLE TA
            0xd0dc === code || // Lo       HANGUL SYLLABLE TAE
            0xd0f8 === code || // Lo       HANGUL SYLLABLE TYA
            0xd114 === code || // Lo       HANGUL SYLLABLE TYAE
            0xd130 === code || // Lo       HANGUL SYLLABLE TEO
            0xd14c === code || // Lo       HANGUL SYLLABLE TE
            0xd168 === code || // Lo       HANGUL SYLLABLE TYEO
            0xd184 === code || // Lo       HANGUL SYLLABLE TYE
            0xd1a0 === code || // Lo       HANGUL SYLLABLE TO
            0xd1bc === code || // Lo       HANGUL SYLLABLE TWA
            0xd1d8 === code || // Lo       HANGUL SYLLABLE TWAE
            0xd1f4 === code || // Lo       HANGUL SYLLABLE TOE
            0xd210 === code || // Lo       HANGUL SYLLABLE TYO
            0xd22c === code || // Lo       HANGUL SYLLABLE TU
            0xd248 === code || // Lo       HANGUL SYLLABLE TWEO
            0xd264 === code || // Lo       HANGUL SYLLABLE TWE
            0xd280 === code || // Lo       HANGUL SYLLABLE TWI
            0xd29c === code || // Lo       HANGUL SYLLABLE TYU
            0xd2b8 === code || // Lo       HANGUL SYLLABLE TEU
            0xd2d4 === code || // Lo       HANGUL SYLLABLE TYI
            0xd2f0 === code || // Lo       HANGUL SYLLABLE TI
            0xd30c === code || // Lo       HANGUL SYLLABLE PA
            0xd328 === code || // Lo       HANGUL SYLLABLE PAE
            0xd344 === code || // Lo       HANGUL SYLLABLE PYA
            0xd360 === code || // Lo       HANGUL SYLLABLE PYAE
            0xd37c === code || // Lo       HANGUL SYLLABLE PEO
            0xd398 === code || // Lo       HANGUL SYLLABLE PE
            0xd3b4 === code || // Lo       HANGUL SYLLABLE PYEO
            0xd3d0 === code || // Lo       HANGUL SYLLABLE PYE
            0xd3ec === code || // Lo       HANGUL SYLLABLE PO
            0xd408 === code || // Lo       HANGUL SYLLABLE PWA
            0xd424 === code || // Lo       HANGUL SYLLABLE PWAE
            0xd440 === code || // Lo       HANGUL SYLLABLE POE
            0xd45c === code || // Lo       HANGUL SYLLABLE PYO
            0xd478 === code || // Lo       HANGUL SYLLABLE PU
            0xd494 === code || // Lo       HANGUL SYLLABLE PWEO
            0xd4b0 === code || // Lo       HANGUL SYLLABLE PWE
            0xd4cc === code || // Lo       HANGUL SYLLABLE PWI
            0xd4e8 === code || // Lo       HANGUL SYLLABLE PYU
            0xd504 === code || // Lo       HANGUL SYLLABLE PEU
            0xd520 === code || // Lo       HANGUL SYLLABLE PYI
            0xd53c === code || // Lo       HANGUL SYLLABLE PI
            0xd558 === code || // Lo       HANGUL SYLLABLE HA
            0xd574 === code || // Lo       HANGUL SYLLABLE HAE
            0xd590 === code || // Lo       HANGUL SYLLABLE HYA
            0xd5ac === code || // Lo       HANGUL SYLLABLE HYAE
            0xd5c8 === code || // Lo       HANGUL SYLLABLE HEO
            0xd5e4 === code || // Lo       HANGUL SYLLABLE HE
            0xd600 === code || // Lo       HANGUL SYLLABLE HYEO
            0xd61c === code || // Lo       HANGUL SYLLABLE HYE
            0xd638 === code || // Lo       HANGUL SYLLABLE HO
            0xd654 === code || // Lo       HANGUL SYLLABLE HWA
            0xd670 === code || // Lo       HANGUL SYLLABLE HWAE
            0xd68c === code || // Lo       HANGUL SYLLABLE HOE
            0xd6a8 === code || // Lo       HANGUL SYLLABLE HYO
            0xd6c4 === code || // Lo       HANGUL SYLLABLE HU
            0xd6e0 === code || // Lo       HANGUL SYLLABLE HWEO
            0xd6fc === code || // Lo       HANGUL SYLLABLE HWE
            0xd718 === code || // Lo       HANGUL SYLLABLE HWI
            0xd734 === code || // Lo       HANGUL SYLLABLE HYU
            0xd750 === code || // Lo       HANGUL SYLLABLE HEU
            0xd76c === code || // Lo       HANGUL SYLLABLE HYI
            0xd788 === code // Lo       HANGUL SYLLABLE HI
        ) {
            return boundaries_1.CLUSTER_BREAK.LV;
        }
        if ((0xac01 <= code && code <= 0xac1b) || // Lo  [27] HANGUL SYLLABLE GAG..HANGUL SYLLABLE GAH
            (0xac1d <= code && code <= 0xac37) || // Lo  [27] HANGUL SYLLABLE GAEG..HANGUL SYLLABLE GAEH
            (0xac39 <= code && code <= 0xac53) || // Lo  [27] HANGUL SYLLABLE GYAG..HANGUL SYLLABLE GYAH
            (0xac55 <= code && code <= 0xac6f) || // Lo  [27] HANGUL SYLLABLE GYAEG..HANGUL SYLLABLE GYAEH
            (0xac71 <= code && code <= 0xac8b) || // Lo  [27] HANGUL SYLLABLE GEOG..HANGUL SYLLABLE GEOH
            (0xac8d <= code && code <= 0xaca7) || // Lo  [27] HANGUL SYLLABLE GEG..HANGUL SYLLABLE GEH
            (0xaca9 <= code && code <= 0xacc3) || // Lo  [27] HANGUL SYLLABLE GYEOG..HANGUL SYLLABLE GYEOH
            (0xacc5 <= code && code <= 0xacdf) || // Lo  [27] HANGUL SYLLABLE GYEG..HANGUL SYLLABLE GYEH
            (0xace1 <= code && code <= 0xacfb) || // Lo  [27] HANGUL SYLLABLE GOG..HANGUL SYLLABLE GOH
            (0xacfd <= code && code <= 0xad17) || // Lo  [27] HANGUL SYLLABLE GWAG..HANGUL SYLLABLE GWAH
            (0xad19 <= code && code <= 0xad33) || // Lo  [27] HANGUL SYLLABLE GWAEG..HANGUL SYLLABLE GWAEH
            (0xad35 <= code && code <= 0xad4f) || // Lo  [27] HANGUL SYLLABLE GOEG..HANGUL SYLLABLE GOEH
            (0xad51 <= code && code <= 0xad6b) || // Lo  [27] HANGUL SYLLABLE GYOG..HANGUL SYLLABLE GYOH
            (0xad6d <= code && code <= 0xad87) || // Lo  [27] HANGUL SYLLABLE GUG..HANGUL SYLLABLE GUH
            (0xad89 <= code && code <= 0xada3) || // Lo  [27] HANGUL SYLLABLE GWEOG..HANGUL SYLLABLE GWEOH
            (0xada5 <= code && code <= 0xadbf) || // Lo  [27] HANGUL SYLLABLE GWEG..HANGUL SYLLABLE GWEH
            (0xadc1 <= code && code <= 0xaddb) || // Lo  [27] HANGUL SYLLABLE GWIG..HANGUL SYLLABLE GWIH
            (0xaddd <= code && code <= 0xadf7) || // Lo  [27] HANGUL SYLLABLE GYUG..HANGUL SYLLABLE GYUH
            (0xadf9 <= code && code <= 0xae13) || // Lo  [27] HANGUL SYLLABLE GEUG..HANGUL SYLLABLE GEUH
            (0xae15 <= code && code <= 0xae2f) || // Lo  [27] HANGUL SYLLABLE GYIG..HANGUL SYLLABLE GYIH
            (0xae31 <= code && code <= 0xae4b) || // Lo  [27] HANGUL SYLLABLE GIG..HANGUL SYLLABLE GIH
            (0xae4d <= code && code <= 0xae67) || // Lo  [27] HANGUL SYLLABLE GGAG..HANGUL SYLLABLE GGAH
            (0xae69 <= code && code <= 0xae83) || // Lo  [27] HANGUL SYLLABLE GGAEG..HANGUL SYLLABLE GGAEH
            (0xae85 <= code && code <= 0xae9f) || // Lo  [27] HANGUL SYLLABLE GGYAG..HANGUL SYLLABLE GGYAH
            (0xaea1 <= code && code <= 0xaebb) || // Lo  [27] HANGUL SYLLABLE GGYAEG..HANGUL SYLLABLE GGYAEH
            (0xaebd <= code && code <= 0xaed7) || // Lo  [27] HANGUL SYLLABLE GGEOG..HANGUL SYLLABLE GGEOH
            (0xaed9 <= code && code <= 0xaef3) || // Lo  [27] HANGUL SYLLABLE GGEG..HANGUL SYLLABLE GGEH
            (0xaef5 <= code && code <= 0xaf0f) || // Lo  [27] HANGUL SYLLABLE GGYEOG..HANGUL SYLLABLE GGYEOH
            (0xaf11 <= code && code <= 0xaf2b) || // Lo  [27] HANGUL SYLLABLE GGYEG..HANGUL SYLLABLE GGYEH
            (0xaf2d <= code && code <= 0xaf47) || // Lo  [27] HANGUL SYLLABLE GGOG..HANGUL SYLLABLE GGOH
            (0xaf49 <= code && code <= 0xaf63) || // Lo  [27] HANGUL SYLLABLE GGWAG..HANGUL SYLLABLE GGWAH
            (0xaf65 <= code && code <= 0xaf7f) || // Lo  [27] HANGUL SYLLABLE GGWAEG..HANGUL SYLLABLE GGWAEH
            (0xaf81 <= code && code <= 0xaf9b) || // Lo  [27] HANGUL SYLLABLE GGOEG..HANGUL SYLLABLE GGOEH
            (0xaf9d <= code && code <= 0xafb7) || // Lo  [27] HANGUL SYLLABLE GGYOG..HANGUL SYLLABLE GGYOH
            (0xafb9 <= code && code <= 0xafd3) || // Lo  [27] HANGUL SYLLABLE GGUG..HANGUL SYLLABLE GGUH
            (0xafd5 <= code && code <= 0xafef) || // Lo  [27] HANGUL SYLLABLE GGWEOG..HANGUL SYLLABLE GGWEOH
            (0xaff1 <= code && code <= 0xb00b) || // Lo  [27] HANGUL SYLLABLE GGWEG..HANGUL SYLLABLE GGWEH
            (0xb00d <= code && code <= 0xb027) || // Lo  [27] HANGUL SYLLABLE GGWIG..HANGUL SYLLABLE GGWIH
            (0xb029 <= code && code <= 0xb043) || // Lo  [27] HANGUL SYLLABLE GGYUG..HANGUL SYLLABLE GGYUH
            (0xb045 <= code && code <= 0xb05f) || // Lo  [27] HANGUL SYLLABLE GGEUG..HANGUL SYLLABLE GGEUH
            (0xb061 <= code && code <= 0xb07b) || // Lo  [27] HANGUL SYLLABLE GGYIG..HANGUL SYLLABLE GGYIH
            (0xb07d <= code && code <= 0xb097) || // Lo  [27] HANGUL SYLLABLE GGIG..HANGUL SYLLABLE GGIH
            (0xb099 <= code && code <= 0xb0b3) || // Lo  [27] HANGUL SYLLABLE NAG..HANGUL SYLLABLE NAH
            (0xb0b5 <= code && code <= 0xb0cf) || // Lo  [27] HANGUL SYLLABLE NAEG..HANGUL SYLLABLE NAEH
            (0xb0d1 <= code && code <= 0xb0eb) || // Lo  [27] HANGUL SYLLABLE NYAG..HANGUL SYLLABLE NYAH
            (0xb0ed <= code && code <= 0xb107) || // Lo  [27] HANGUL SYLLABLE NYAEG..HANGUL SYLLABLE NYAEH
            (0xb109 <= code && code <= 0xb123) || // Lo  [27] HANGUL SYLLABLE NEOG..HANGUL SYLLABLE NEOH
            (0xb125 <= code && code <= 0xb13f) || // Lo  [27] HANGUL SYLLABLE NEG..HANGUL SYLLABLE NEH
            (0xb141 <= code && code <= 0xb15b) || // Lo  [27] HANGUL SYLLABLE NYEOG..HANGUL SYLLABLE NYEOH
            (0xb15d <= code && code <= 0xb177) || // Lo  [27] HANGUL SYLLABLE NYEG..HANGUL SYLLABLE NYEH
            (0xb179 <= code && code <= 0xb193) || // Lo  [27] HANGUL SYLLABLE NOG..HANGUL SYLLABLE NOH
            (0xb195 <= code && code <= 0xb1af) || // Lo  [27] HANGUL SYLLABLE NWAG..HANGUL SYLLABLE NWAH
            (0xb1b1 <= code && code <= 0xb1cb) || // Lo  [27] HANGUL SYLLABLE NWAEG..HANGUL SYLLABLE NWAEH
            (0xb1cd <= code && code <= 0xb1e7) || // Lo  [27] HANGUL SYLLABLE NOEG..HANGUL SYLLABLE NOEH
            (0xb1e9 <= code && code <= 0xb203) || // Lo  [27] HANGUL SYLLABLE NYOG..HANGUL SYLLABLE NYOH
            (0xb205 <= code && code <= 0xb21f) || // Lo  [27] HANGUL SYLLABLE NUG..HANGUL SYLLABLE NUH
            (0xb221 <= code && code <= 0xb23b) || // Lo  [27] HANGUL SYLLABLE NWEOG..HANGUL SYLLABLE NWEOH
            (0xb23d <= code && code <= 0xb257) || // Lo  [27] HANGUL SYLLABLE NWEG..HANGUL SYLLABLE NWEH
            (0xb259 <= code && code <= 0xb273) || // Lo  [27] HANGUL SYLLABLE NWIG..HANGUL SYLLABLE NWIH
            (0xb275 <= code && code <= 0xb28f) || // Lo  [27] HANGUL SYLLABLE NYUG..HANGUL SYLLABLE NYUH
            (0xb291 <= code && code <= 0xb2ab) || // Lo  [27] HANGUL SYLLABLE NEUG..HANGUL SYLLABLE NEUH
            (0xb2ad <= code && code <= 0xb2c7) || // Lo  [27] HANGUL SYLLABLE NYIG..HANGUL SYLLABLE NYIH
            (0xb2c9 <= code && code <= 0xb2e3) || // Lo  [27] HANGUL SYLLABLE NIG..HANGUL SYLLABLE NIH
            (0xb2e5 <= code && code <= 0xb2ff) || // Lo  [27] HANGUL SYLLABLE DAG..HANGUL SYLLABLE DAH
            (0xb301 <= code && code <= 0xb31b) || // Lo  [27] HANGUL SYLLABLE DAEG..HANGUL SYLLABLE DAEH
            (0xb31d <= code && code <= 0xb337) || // Lo  [27] HANGUL SYLLABLE DYAG..HANGUL SYLLABLE DYAH
            (0xb339 <= code && code <= 0xb353) || // Lo  [27] HANGUL SYLLABLE DYAEG..HANGUL SYLLABLE DYAEH
            (0xb355 <= code && code <= 0xb36f) || // Lo  [27] HANGUL SYLLABLE DEOG..HANGUL SYLLABLE DEOH
            (0xb371 <= code && code <= 0xb38b) || // Lo  [27] HANGUL SYLLABLE DEG..HANGUL SYLLABLE DEH
            (0xb38d <= code && code <= 0xb3a7) || // Lo  [27] HANGUL SYLLABLE DYEOG..HANGUL SYLLABLE DYEOH
            (0xb3a9 <= code && code <= 0xb3c3) || // Lo  [27] HANGUL SYLLABLE DYEG..HANGUL SYLLABLE DYEH
            (0xb3c5 <= code && code <= 0xb3df) || // Lo  [27] HANGUL SYLLABLE DOG..HANGUL SYLLABLE DOH
            (0xb3e1 <= code && code <= 0xb3fb) || // Lo  [27] HANGUL SYLLABLE DWAG..HANGUL SYLLABLE DWAH
            (0xb3fd <= code && code <= 0xb417) || // Lo  [27] HANGUL SYLLABLE DWAEG..HANGUL SYLLABLE DWAEH
            (0xb419 <= code && code <= 0xb433) || // Lo  [27] HANGUL SYLLABLE DOEG..HANGUL SYLLABLE DOEH
            (0xb435 <= code && code <= 0xb44f) || // Lo  [27] HANGUL SYLLABLE DYOG..HANGUL SYLLABLE DYOH
            (0xb451 <= code && code <= 0xb46b) || // Lo  [27] HANGUL SYLLABLE DUG..HANGUL SYLLABLE DUH
            (0xb46d <= code && code <= 0xb487) || // Lo  [27] HANGUL SYLLABLE DWEOG..HANGUL SYLLABLE DWEOH
            (0xb489 <= code && code <= 0xb4a3) || // Lo  [27] HANGUL SYLLABLE DWEG..HANGUL SYLLABLE DWEH
            (0xb4a5 <= code && code <= 0xb4bf) || // Lo  [27] HANGUL SYLLABLE DWIG..HANGUL SYLLABLE DWIH
            (0xb4c1 <= code && code <= 0xb4db) || // Lo  [27] HANGUL SYLLABLE DYUG..HANGUL SYLLABLE DYUH
            (0xb4dd <= code && code <= 0xb4f7) || // Lo  [27] HANGUL SYLLABLE DEUG..HANGUL SYLLABLE DEUH
            (0xb4f9 <= code && code <= 0xb513) || // Lo  [27] HANGUL SYLLABLE DYIG..HANGUL SYLLABLE DYIH
            (0xb515 <= code && code <= 0xb52f) || // Lo  [27] HANGUL SYLLABLE DIG..HANGUL SYLLABLE DIH
            (0xb531 <= code && code <= 0xb54b) || // Lo  [27] HANGUL SYLLABLE DDAG..HANGUL SYLLABLE DDAH
            (0xb54d <= code && code <= 0xb567) || // Lo  [27] HANGUL SYLLABLE DDAEG..HANGUL SYLLABLE DDAEH
            (0xb569 <= code && code <= 0xb583) || // Lo  [27] HANGUL SYLLABLE DDYAG..HANGUL SYLLABLE DDYAH
            (0xb585 <= code && code <= 0xb59f) || // Lo  [27] HANGUL SYLLABLE DDYAEG..HANGUL SYLLABLE DDYAEH
            (0xb5a1 <= code && code <= 0xb5bb) || // Lo  [27] HANGUL SYLLABLE DDEOG..HANGUL SYLLABLE DDEOH
            (0xb5bd <= code && code <= 0xb5d7) || // Lo  [27] HANGUL SYLLABLE DDEG..HANGUL SYLLABLE DDEH
            (0xb5d9 <= code && code <= 0xb5f3) || // Lo  [27] HANGUL SYLLABLE DDYEOG..HANGUL SYLLABLE DDYEOH
            (0xb5f5 <= code && code <= 0xb60f) || // Lo  [27] HANGUL SYLLABLE DDYEG..HANGUL SYLLABLE DDYEH
            (0xb611 <= code && code <= 0xb62b) || // Lo  [27] HANGUL SYLLABLE DDOG..HANGUL SYLLABLE DDOH
            (0xb62d <= code && code <= 0xb647) || // Lo  [27] HANGUL SYLLABLE DDWAG..HANGUL SYLLABLE DDWAH
            (0xb649 <= code && code <= 0xb663) || // Lo  [27] HANGUL SYLLABLE DDWAEG..HANGUL SYLLABLE DDWAEH
            (0xb665 <= code && code <= 0xb67f) || // Lo  [27] HANGUL SYLLABLE DDOEG..HANGUL SYLLABLE DDOEH
            (0xb681 <= code && code <= 0xb69b) || // Lo  [27] HANGUL SYLLABLE DDYOG..HANGUL SYLLABLE DDYOH
            (0xb69d <= code && code <= 0xb6b7) || // Lo  [27] HANGUL SYLLABLE DDUG..HANGUL SYLLABLE DDUH
            (0xb6b9 <= code && code <= 0xb6d3) || // Lo  [27] HANGUL SYLLABLE DDWEOG..HANGUL SYLLABLE DDWEOH
            (0xb6d5 <= code && code <= 0xb6ef) || // Lo  [27] HANGUL SYLLABLE DDWEG..HANGUL SYLLABLE DDWEH
            (0xb6f1 <= code && code <= 0xb70b) || // Lo  [27] HANGUL SYLLABLE DDWIG..HANGUL SYLLABLE DDWIH
            (0xb70d <= code && code <= 0xb727) || // Lo  [27] HANGUL SYLLABLE DDYUG..HANGUL SYLLABLE DDYUH
            (0xb729 <= code && code <= 0xb743) || // Lo  [27] HANGUL SYLLABLE DDEUG..HANGUL SYLLABLE DDEUH
            (0xb745 <= code && code <= 0xb75f) || // Lo  [27] HANGUL SYLLABLE DDYIG..HANGUL SYLLABLE DDYIH
            (0xb761 <= code && code <= 0xb77b) || // Lo  [27] HANGUL SYLLABLE DDIG..HANGUL SYLLABLE DDIH
            (0xb77d <= code && code <= 0xb797) || // Lo  [27] HANGUL SYLLABLE RAG..HANGUL SYLLABLE RAH
            (0xb799 <= code && code <= 0xb7b3) || // Lo  [27] HANGUL SYLLABLE RAEG..HANGUL SYLLABLE RAEH
            (0xb7b5 <= code && code <= 0xb7cf) || // Lo  [27] HANGUL SYLLABLE RYAG..HANGUL SYLLABLE RYAH
            (0xb7d1 <= code && code <= 0xb7eb) || // Lo  [27] HANGUL SYLLABLE RYAEG..HANGUL SYLLABLE RYAEH
            (0xb7ed <= code && code <= 0xb807) || // Lo  [27] HANGUL SYLLABLE REOG..HANGUL SYLLABLE REOH
            (0xb809 <= code && code <= 0xb823) || // Lo  [27] HANGUL SYLLABLE REG..HANGUL SYLLABLE REH
            (0xb825 <= code && code <= 0xb83f) || // Lo  [27] HANGUL SYLLABLE RYEOG..HANGUL SYLLABLE RYEOH
            (0xb841 <= code && code <= 0xb85b) || // Lo  [27] HANGUL SYLLABLE RYEG..HANGUL SYLLABLE RYEH
            (0xb85d <= code && code <= 0xb877) || // Lo  [27] HANGUL SYLLABLE ROG..HANGUL SYLLABLE ROH
            (0xb879 <= code && code <= 0xb893) || // Lo  [27] HANGUL SYLLABLE RWAG..HANGUL SYLLABLE RWAH
            (0xb895 <= code && code <= 0xb8af) || // Lo  [27] HANGUL SYLLABLE RWAEG..HANGUL SYLLABLE RWAEH
            (0xb8b1 <= code && code <= 0xb8cb) || // Lo  [27] HANGUL SYLLABLE ROEG..HANGUL SYLLABLE ROEH
            (0xb8cd <= code && code <= 0xb8e7) || // Lo  [27] HANGUL SYLLABLE RYOG..HANGUL SYLLABLE RYOH
            (0xb8e9 <= code && code <= 0xb903) || // Lo  [27] HANGUL SYLLABLE RUG..HANGUL SYLLABLE RUH
            (0xb905 <= code && code <= 0xb91f) || // Lo  [27] HANGUL SYLLABLE RWEOG..HANGUL SYLLABLE RWEOH
            (0xb921 <= code && code <= 0xb93b) || // Lo  [27] HANGUL SYLLABLE RWEG..HANGUL SYLLABLE RWEH
            (0xb93d <= code && code <= 0xb957) || // Lo  [27] HANGUL SYLLABLE RWIG..HANGUL SYLLABLE RWIH
            (0xb959 <= code && code <= 0xb973) || // Lo  [27] HANGUL SYLLABLE RYUG..HANGUL SYLLABLE RYUH
            (0xb975 <= code && code <= 0xb98f) || // Lo  [27] HANGUL SYLLABLE REUG..HANGUL SYLLABLE REUH
            (0xb991 <= code && code <= 0xb9ab) || // Lo  [27] HANGUL SYLLABLE RYIG..HANGUL SYLLABLE RYIH
            (0xb9ad <= code && code <= 0xb9c7) || // Lo  [27] HANGUL SYLLABLE RIG..HANGUL SYLLABLE RIH
            (0xb9c9 <= code && code <= 0xb9e3) || // Lo  [27] HANGUL SYLLABLE MAG..HANGUL SYLLABLE MAH
            (0xb9e5 <= code && code <= 0xb9ff) || // Lo  [27] HANGUL SYLLABLE MAEG..HANGUL SYLLABLE MAEH
            (0xba01 <= code && code <= 0xba1b) || // Lo  [27] HANGUL SYLLABLE MYAG..HANGUL SYLLABLE MYAH
            (0xba1d <= code && code <= 0xba37) || // Lo  [27] HANGUL SYLLABLE MYAEG..HANGUL SYLLABLE MYAEH
            (0xba39 <= code && code <= 0xba53) || // Lo  [27] HANGUL SYLLABLE MEOG..HANGUL SYLLABLE MEOH
            (0xba55 <= code && code <= 0xba6f) || // Lo  [27] HANGUL SYLLABLE MEG..HANGUL SYLLABLE MEH
            (0xba71 <= code && code <= 0xba8b) || // Lo  [27] HANGUL SYLLABLE MYEOG..HANGUL SYLLABLE MYEOH
            (0xba8d <= code && code <= 0xbaa7) || // Lo  [27] HANGUL SYLLABLE MYEG..HANGUL SYLLABLE MYEH
            (0xbaa9 <= code && code <= 0xbac3) || // Lo  [27] HANGUL SYLLABLE MOG..HANGUL SYLLABLE MOH
            (0xbac5 <= code && code <= 0xbadf) || // Lo  [27] HANGUL SYLLABLE MWAG..HANGUL SYLLABLE MWAH
            (0xbae1 <= code && code <= 0xbafb) || // Lo  [27] HANGUL SYLLABLE MWAEG..HANGUL SYLLABLE MWAEH
            (0xbafd <= code && code <= 0xbb17) || // Lo  [27] HANGUL SYLLABLE MOEG..HANGUL SYLLABLE MOEH
            (0xbb19 <= code && code <= 0xbb33) || // Lo  [27] HANGUL SYLLABLE MYOG..HANGUL SYLLABLE MYOH
            (0xbb35 <= code && code <= 0xbb4f) || // Lo  [27] HANGUL SYLLABLE MUG..HANGUL SYLLABLE MUH
            (0xbb51 <= code && code <= 0xbb6b) || // Lo  [27] HANGUL SYLLABLE MWEOG..HANGUL SYLLABLE MWEOH
            (0xbb6d <= code && code <= 0xbb87) || // Lo  [27] HANGUL SYLLABLE MWEG..HANGUL SYLLABLE MWEH
            (0xbb89 <= code && code <= 0xbba3) || // Lo  [27] HANGUL SYLLABLE MWIG..HANGUL SYLLABLE MWIH
            (0xbba5 <= code && code <= 0xbbbf) || // Lo  [27] HANGUL SYLLABLE MYUG..HANGUL SYLLABLE MYUH
            (0xbbc1 <= code && code <= 0xbbdb) || // Lo  [27] HANGUL SYLLABLE MEUG..HANGUL SYLLABLE MEUH
            (0xbbdd <= code && code <= 0xbbf7) || // Lo  [27] HANGUL SYLLABLE MYIG..HANGUL SYLLABLE MYIH
            (0xbbf9 <= code && code <= 0xbc13) || // Lo  [27] HANGUL SYLLABLE MIG..HANGUL SYLLABLE MIH
            (0xbc15 <= code && code <= 0xbc2f) || // Lo  [27] HANGUL SYLLABLE BAG..HANGUL SYLLABLE BAH
            (0xbc31 <= code && code <= 0xbc4b) || // Lo  [27] HANGUL SYLLABLE BAEG..HANGUL SYLLABLE BAEH
            (0xbc4d <= code && code <= 0xbc67) || // Lo  [27] HANGUL SYLLABLE BYAG..HANGUL SYLLABLE BYAH
            (0xbc69 <= code && code <= 0xbc83) || // Lo  [27] HANGUL SYLLABLE BYAEG..HANGUL SYLLABLE BYAEH
            (0xbc85 <= code && code <= 0xbc9f) || // Lo  [27] HANGUL SYLLABLE BEOG..HANGUL SYLLABLE BEOH
            (0xbca1 <= code && code <= 0xbcbb) || // Lo  [27] HANGUL SYLLABLE BEG..HANGUL SYLLABLE BEH
            (0xbcbd <= code && code <= 0xbcd7) || // Lo  [27] HANGUL SYLLABLE BYEOG..HANGUL SYLLABLE BYEOH
            (0xbcd9 <= code && code <= 0xbcf3) || // Lo  [27] HANGUL SYLLABLE BYEG..HANGUL SYLLABLE BYEH
            (0xbcf5 <= code && code <= 0xbd0f) || // Lo  [27] HANGUL SYLLABLE BOG..HANGUL SYLLABLE BOH
            (0xbd11 <= code && code <= 0xbd2b) || // Lo  [27] HANGUL SYLLABLE BWAG..HANGUL SYLLABLE BWAH
            (0xbd2d <= code && code <= 0xbd47) || // Lo  [27] HANGUL SYLLABLE BWAEG..HANGUL SYLLABLE BWAEH
            (0xbd49 <= code && code <= 0xbd63) || // Lo  [27] HANGUL SYLLABLE BOEG..HANGUL SYLLABLE BOEH
            (0xbd65 <= code && code <= 0xbd7f) || // Lo  [27] HANGUL SYLLABLE BYOG..HANGUL SYLLABLE BYOH
            (0xbd81 <= code && code <= 0xbd9b) || // Lo  [27] HANGUL SYLLABLE BUG..HANGUL SYLLABLE BUH
            (0xbd9d <= code && code <= 0xbdb7) || // Lo  [27] HANGUL SYLLABLE BWEOG..HANGUL SYLLABLE BWEOH
            (0xbdb9 <= code && code <= 0xbdd3) || // Lo  [27] HANGUL SYLLABLE BWEG..HANGUL SYLLABLE BWEH
            (0xbdd5 <= code && code <= 0xbdef) || // Lo  [27] HANGUL SYLLABLE BWIG..HANGUL SYLLABLE BWIH
            (0xbdf1 <= code && code <= 0xbe0b) || // Lo  [27] HANGUL SYLLABLE BYUG..HANGUL SYLLABLE BYUH
            (0xbe0d <= code && code <= 0xbe27) || // Lo  [27] HANGUL SYLLABLE BEUG..HANGUL SYLLABLE BEUH
            (0xbe29 <= code && code <= 0xbe43) || // Lo  [27] HANGUL SYLLABLE BYIG..HANGUL SYLLABLE BYIH
            (0xbe45 <= code && code <= 0xbe5f) || // Lo  [27] HANGUL SYLLABLE BIG..HANGUL SYLLABLE BIH
            (0xbe61 <= code && code <= 0xbe7b) || // Lo  [27] HANGUL SYLLABLE BBAG..HANGUL SYLLABLE BBAH
            (0xbe7d <= code && code <= 0xbe97) || // Lo  [27] HANGUL SYLLABLE BBAEG..HANGUL SYLLABLE BBAEH
            (0xbe99 <= code && code <= 0xbeb3) || // Lo  [27] HANGUL SYLLABLE BBYAG..HANGUL SYLLABLE BBYAH
            (0xbeb5 <= code && code <= 0xbecf) || // Lo  [27] HANGUL SYLLABLE BBYAEG..HANGUL SYLLABLE BBYAEH
            (0xbed1 <= code && code <= 0xbeeb) || // Lo  [27] HANGUL SYLLABLE BBEOG..HANGUL SYLLABLE BBEOH
            (0xbeed <= code && code <= 0xbf07) || // Lo  [27] HANGUL SYLLABLE BBEG..HANGUL SYLLABLE BBEH
            (0xbf09 <= code && code <= 0xbf23) || // Lo  [27] HANGUL SYLLABLE BBYEOG..HANGUL SYLLABLE BBYEOH
            (0xbf25 <= code && code <= 0xbf3f) || // Lo  [27] HANGUL SYLLABLE BBYEG..HANGUL SYLLABLE BBYEH
            (0xbf41 <= code && code <= 0xbf5b) || // Lo  [27] HANGUL SYLLABLE BBOG..HANGUL SYLLABLE BBOH
            (0xbf5d <= code && code <= 0xbf77) || // Lo  [27] HANGUL SYLLABLE BBWAG..HANGUL SYLLABLE BBWAH
            (0xbf79 <= code && code <= 0xbf93) || // Lo  [27] HANGUL SYLLABLE BBWAEG..HANGUL SYLLABLE BBWAEH
            (0xbf95 <= code && code <= 0xbfaf) || // Lo  [27] HANGUL SYLLABLE BBOEG..HANGUL SYLLABLE BBOEH
            (0xbfb1 <= code && code <= 0xbfcb) || // Lo  [27] HANGUL SYLLABLE BBYOG..HANGUL SYLLABLE BBYOH
            (0xbfcd <= code && code <= 0xbfe7) || // Lo  [27] HANGUL SYLLABLE BBUG..HANGUL SYLLABLE BBUH
            (0xbfe9 <= code && code <= 0xc003) || // Lo  [27] HANGUL SYLLABLE BBWEOG..HANGUL SYLLABLE BBWEOH
            (0xc005 <= code && code <= 0xc01f) || // Lo  [27] HANGUL SYLLABLE BBWEG..HANGUL SYLLABLE BBWEH
            (0xc021 <= code && code <= 0xc03b) || // Lo  [27] HANGUL SYLLABLE BBWIG..HANGUL SYLLABLE BBWIH
            (0xc03d <= code && code <= 0xc057) || // Lo  [27] HANGUL SYLLABLE BBYUG..HANGUL SYLLABLE BBYUH
            (0xc059 <= code && code <= 0xc073) || // Lo  [27] HANGUL SYLLABLE BBEUG..HANGUL SYLLABLE BBEUH
            (0xc075 <= code && code <= 0xc08f) || // Lo  [27] HANGUL SYLLABLE BBYIG..HANGUL SYLLABLE BBYIH
            (0xc091 <= code && code <= 0xc0ab) || // Lo  [27] HANGUL SYLLABLE BBIG..HANGUL SYLLABLE BBIH
            (0xc0ad <= code && code <= 0xc0c7) || // Lo  [27] HANGUL SYLLABLE SAG..HANGUL SYLLABLE SAH
            (0xc0c9 <= code && code <= 0xc0e3) || // Lo  [27] HANGUL SYLLABLE SAEG..HANGUL SYLLABLE SAEH
            (0xc0e5 <= code && code <= 0xc0ff) || // Lo  [27] HANGUL SYLLABLE SYAG..HANGUL SYLLABLE SYAH
            (0xc101 <= code && code <= 0xc11b) || // Lo  [27] HANGUL SYLLABLE SYAEG..HANGUL SYLLABLE SYAEH
            (0xc11d <= code && code <= 0xc137) || // Lo  [27] HANGUL SYLLABLE SEOG..HANGUL SYLLABLE SEOH
            (0xc139 <= code && code <= 0xc153) || // Lo  [27] HANGUL SYLLABLE SEG..HANGUL SYLLABLE SEH
            (0xc155 <= code && code <= 0xc16f) || // Lo  [27] HANGUL SYLLABLE SYEOG..HANGUL SYLLABLE SYEOH
            (0xc171 <= code && code <= 0xc18b) || // Lo  [27] HANGUL SYLLABLE SYEG..HANGUL SYLLABLE SYEH
            (0xc18d <= code && code <= 0xc1a7) || // Lo  [27] HANGUL SYLLABLE SOG..HANGUL SYLLABLE SOH
            (0xc1a9 <= code && code <= 0xc1c3) || // Lo  [27] HANGUL SYLLABLE SWAG..HANGUL SYLLABLE SWAH
            (0xc1c5 <= code && code <= 0xc1df) || // Lo  [27] HANGUL SYLLABLE SWAEG..HANGUL SYLLABLE SWAEH
            (0xc1e1 <= code && code <= 0xc1fb) || // Lo  [27] HANGUL SYLLABLE SOEG..HANGUL SYLLABLE SOEH
            (0xc1fd <= code && code <= 0xc217) || // Lo  [27] HANGUL SYLLABLE SYOG..HANGUL SYLLABLE SYOH
            (0xc219 <= code && code <= 0xc233) || // Lo  [27] HANGUL SYLLABLE SUG..HANGUL SYLLABLE SUH
            (0xc235 <= code && code <= 0xc24f) || // Lo  [27] HANGUL SYLLABLE SWEOG..HANGUL SYLLABLE SWEOH
            (0xc251 <= code && code <= 0xc26b) || // Lo  [27] HANGUL SYLLABLE SWEG..HANGUL SYLLABLE SWEH
            (0xc26d <= code && code <= 0xc287) || // Lo  [27] HANGUL SYLLABLE SWIG..HANGUL SYLLABLE SWIH
            (0xc289 <= code && code <= 0xc2a3) || // Lo  [27] HANGUL SYLLABLE SYUG..HANGUL SYLLABLE SYUH
            (0xc2a5 <= code && code <= 0xc2bf) || // Lo  [27] HANGUL SYLLABLE SEUG..HANGUL SYLLABLE SEUH
            (0xc2c1 <= code && code <= 0xc2db) || // Lo  [27] HANGUL SYLLABLE SYIG..HANGUL SYLLABLE SYIH
            (0xc2dd <= code && code <= 0xc2f7) || // Lo  [27] HANGUL SYLLABLE SIG..HANGUL SYLLABLE SIH
            (0xc2f9 <= code && code <= 0xc313) || // Lo  [27] HANGUL SYLLABLE SSAG..HANGUL SYLLABLE SSAH
            (0xc315 <= code && code <= 0xc32f) || // Lo  [27] HANGUL SYLLABLE SSAEG..HANGUL SYLLABLE SSAEH
            (0xc331 <= code && code <= 0xc34b) || // Lo  [27] HANGUL SYLLABLE SSYAG..HANGUL SYLLABLE SSYAH
            (0xc34d <= code && code <= 0xc367) || // Lo  [27] HANGUL SYLLABLE SSYAEG..HANGUL SYLLABLE SSYAEH
            (0xc369 <= code && code <= 0xc383) || // Lo  [27] HANGUL SYLLABLE SSEOG..HANGUL SYLLABLE SSEOH
            (0xc385 <= code && code <= 0xc39f) || // Lo  [27] HANGUL SYLLABLE SSEG..HANGUL SYLLABLE SSEH
            (0xc3a1 <= code && code <= 0xc3bb) || // Lo  [27] HANGUL SYLLABLE SSYEOG..HANGUL SYLLABLE SSYEOH
            (0xc3bd <= code && code <= 0xc3d7) || // Lo  [27] HANGUL SYLLABLE SSYEG..HANGUL SYLLABLE SSYEH
            (0xc3d9 <= code && code <= 0xc3f3) || // Lo  [27] HANGUL SYLLABLE SSOG..HANGUL SYLLABLE SSOH
            (0xc3f5 <= code && code <= 0xc40f) || // Lo  [27] HANGUL SYLLABLE SSWAG..HANGUL SYLLABLE SSWAH
            (0xc411 <= code && code <= 0xc42b) || // Lo  [27] HANGUL SYLLABLE SSWAEG..HANGUL SYLLABLE SSWAEH
            (0xc42d <= code && code <= 0xc447) || // Lo  [27] HANGUL SYLLABLE SSOEG..HANGUL SYLLABLE SSOEH
            (0xc449 <= code && code <= 0xc463) || // Lo  [27] HANGUL SYLLABLE SSYOG..HANGUL SYLLABLE SSYOH
            (0xc465 <= code && code <= 0xc47f) || // Lo  [27] HANGUL SYLLABLE SSUG..HANGUL SYLLABLE SSUH
            (0xc481 <= code && code <= 0xc49b) || // Lo  [27] HANGUL SYLLABLE SSWEOG..HANGUL SYLLABLE SSWEOH
            (0xc49d <= code && code <= 0xc4b7) || // Lo  [27] HANGUL SYLLABLE SSWEG..HANGUL SYLLABLE SSWEH
            (0xc4b9 <= code && code <= 0xc4d3) || // Lo  [27] HANGUL SYLLABLE SSWIG..HANGUL SYLLABLE SSWIH
            (0xc4d5 <= code && code <= 0xc4ef) || // Lo  [27] HANGUL SYLLABLE SSYUG..HANGUL SYLLABLE SSYUH
            (0xc4f1 <= code && code <= 0xc50b) || // Lo  [27] HANGUL SYLLABLE SSEUG..HANGUL SYLLABLE SSEUH
            (0xc50d <= code && code <= 0xc527) || // Lo  [27] HANGUL SYLLABLE SSYIG..HANGUL SYLLABLE SSYIH
            (0xc529 <= code && code <= 0xc543) || // Lo  [27] HANGUL SYLLABLE SSIG..HANGUL SYLLABLE SSIH
            (0xc545 <= code && code <= 0xc55f) || // Lo  [27] HANGUL SYLLABLE AG..HANGUL SYLLABLE AH
            (0xc561 <= code && code <= 0xc57b) || // Lo  [27] HANGUL SYLLABLE AEG..HANGUL SYLLABLE AEH
            (0xc57d <= code && code <= 0xc597) || // Lo  [27] HANGUL SYLLABLE YAG..HANGUL SYLLABLE YAH
            (0xc599 <= code && code <= 0xc5b3) || // Lo  [27] HANGUL SYLLABLE YAEG..HANGUL SYLLABLE YAEH
            (0xc5b5 <= code && code <= 0xc5cf) || // Lo  [27] HANGUL SYLLABLE EOG..HANGUL SYLLABLE EOH
            (0xc5d1 <= code && code <= 0xc5eb) || // Lo  [27] HANGUL SYLLABLE EG..HANGUL SYLLABLE EH
            (0xc5ed <= code && code <= 0xc607) || // Lo  [27] HANGUL SYLLABLE YEOG..HANGUL SYLLABLE YEOH
            (0xc609 <= code && code <= 0xc623) || // Lo  [27] HANGUL SYLLABLE YEG..HANGUL SYLLABLE YEH
            (0xc625 <= code && code <= 0xc63f) || // Lo  [27] HANGUL SYLLABLE OG..HANGUL SYLLABLE OH
            (0xc641 <= code && code <= 0xc65b) || // Lo  [27] HANGUL SYLLABLE WAG..HANGUL SYLLABLE WAH
            (0xc65d <= code && code <= 0xc677) || // Lo  [27] HANGUL SYLLABLE WAEG..HANGUL SYLLABLE WAEH
            (0xc679 <= code && code <= 0xc693) || // Lo  [27] HANGUL SYLLABLE OEG..HANGUL SYLLABLE OEH
            (0xc695 <= code && code <= 0xc6af) || // Lo  [27] HANGUL SYLLABLE YOG..HANGUL SYLLABLE YOH
            (0xc6b1 <= code && code <= 0xc6cb) || // Lo  [27] HANGUL SYLLABLE UG..HANGUL SYLLABLE UH
            (0xc6cd <= code && code <= 0xc6e7) || // Lo  [27] HANGUL SYLLABLE WEOG..HANGUL SYLLABLE WEOH
            (0xc6e9 <= code && code <= 0xc703) || // Lo  [27] HANGUL SYLLABLE WEG..HANGUL SYLLABLE WEH
            (0xc705 <= code && code <= 0xc71f) || // Lo  [27] HANGUL SYLLABLE WIG..HANGUL SYLLABLE WIH
            (0xc721 <= code && code <= 0xc73b) || // Lo  [27] HANGUL SYLLABLE YUG..HANGUL SYLLABLE YUH
            (0xc73d <= code && code <= 0xc757) || // Lo  [27] HANGUL SYLLABLE EUG..HANGUL SYLLABLE EUH
            (0xc759 <= code && code <= 0xc773) || // Lo  [27] HANGUL SYLLABLE YIG..HANGUL SYLLABLE YIH
            (0xc775 <= code && code <= 0xc78f) || // Lo  [27] HANGUL SYLLABLE IG..HANGUL SYLLABLE IH
            (0xc791 <= code && code <= 0xc7ab) || // Lo  [27] HANGUL SYLLABLE JAG..HANGUL SYLLABLE JAH
            (0xc7ad <= code && code <= 0xc7c7) || // Lo  [27] HANGUL SYLLABLE JAEG..HANGUL SYLLABLE JAEH
            (0xc7c9 <= code && code <= 0xc7e3) || // Lo  [27] HANGUL SYLLABLE JYAG..HANGUL SYLLABLE JYAH
            (0xc7e5 <= code && code <= 0xc7ff) || // Lo  [27] HANGUL SYLLABLE JYAEG..HANGUL SYLLABLE JYAEH
            (0xc801 <= code && code <= 0xc81b) || // Lo  [27] HANGUL SYLLABLE JEOG..HANGUL SYLLABLE JEOH
            (0xc81d <= code && code <= 0xc837) || // Lo  [27] HANGUL SYLLABLE JEG..HANGUL SYLLABLE JEH
            (0xc839 <= code && code <= 0xc853) || // Lo  [27] HANGUL SYLLABLE JYEOG..HANGUL SYLLABLE JYEOH
            (0xc855 <= code && code <= 0xc86f) || // Lo  [27] HANGUL SYLLABLE JYEG..HANGUL SYLLABLE JYEH
            (0xc871 <= code && code <= 0xc88b) || // Lo  [27] HANGUL SYLLABLE JOG..HANGUL SYLLABLE JOH
            (0xc88d <= code && code <= 0xc8a7) || // Lo  [27] HANGUL SYLLABLE JWAG..HANGUL SYLLABLE JWAH
            (0xc8a9 <= code && code <= 0xc8c3) || // Lo  [27] HANGUL SYLLABLE JWAEG..HANGUL SYLLABLE JWAEH
            (0xc8c5 <= code && code <= 0xc8df) || // Lo  [27] HANGUL SYLLABLE JOEG..HANGUL SYLLABLE JOEH
            (0xc8e1 <= code && code <= 0xc8fb) || // Lo  [27] HANGUL SYLLABLE JYOG..HANGUL SYLLABLE JYOH
            (0xc8fd <= code && code <= 0xc917) || // Lo  [27] HANGUL SYLLABLE JUG..HANGUL SYLLABLE JUH
            (0xc919 <= code && code <= 0xc933) || // Lo  [27] HANGUL SYLLABLE JWEOG..HANGUL SYLLABLE JWEOH
            (0xc935 <= code && code <= 0xc94f) || // Lo  [27] HANGUL SYLLABLE JWEG..HANGUL SYLLABLE JWEH
            (0xc951 <= code && code <= 0xc96b) || // Lo  [27] HANGUL SYLLABLE JWIG..HANGUL SYLLABLE JWIH
            (0xc96d <= code && code <= 0xc987) || // Lo  [27] HANGUL SYLLABLE JYUG..HANGUL SYLLABLE JYUH
            (0xc989 <= code && code <= 0xc9a3) || // Lo  [27] HANGUL SYLLABLE JEUG..HANGUL SYLLABLE JEUH
            (0xc9a5 <= code && code <= 0xc9bf) || // Lo  [27] HANGUL SYLLABLE JYIG..HANGUL SYLLABLE JYIH
            (0xc9c1 <= code && code <= 0xc9db) || // Lo  [27] HANGUL SYLLABLE JIG..HANGUL SYLLABLE JIH
            (0xc9dd <= code && code <= 0xc9f7) || // Lo  [27] HANGUL SYLLABLE JJAG..HANGUL SYLLABLE JJAH
            (0xc9f9 <= code && code <= 0xca13) || // Lo  [27] HANGUL SYLLABLE JJAEG..HANGUL SYLLABLE JJAEH
            (0xca15 <= code && code <= 0xca2f) || // Lo  [27] HANGUL SYLLABLE JJYAG..HANGUL SYLLABLE JJYAH
            (0xca31 <= code && code <= 0xca4b) || // Lo  [27] HANGUL SYLLABLE JJYAEG..HANGUL SYLLABLE JJYAEH
            (0xca4d <= code && code <= 0xca67) || // Lo  [27] HANGUL SYLLABLE JJEOG..HANGUL SYLLABLE JJEOH
            (0xca69 <= code && code <= 0xca83) || // Lo  [27] HANGUL SYLLABLE JJEG..HANGUL SYLLABLE JJEH
            (0xca85 <= code && code <= 0xca9f) || // Lo  [27] HANGUL SYLLABLE JJYEOG..HANGUL SYLLABLE JJYEOH
            (0xcaa1 <= code && code <= 0xcabb) || // Lo  [27] HANGUL SYLLABLE JJYEG..HANGUL SYLLABLE JJYEH
            (0xcabd <= code && code <= 0xcad7) || // Lo  [27] HANGUL SYLLABLE JJOG..HANGUL SYLLABLE JJOH
            (0xcad9 <= code && code <= 0xcaf3) || // Lo  [27] HANGUL SYLLABLE JJWAG..HANGUL SYLLABLE JJWAH
            (0xcaf5 <= code && code <= 0xcb0f) || // Lo  [27] HANGUL SYLLABLE JJWAEG..HANGUL SYLLABLE JJWAEH
            (0xcb11 <= code && code <= 0xcb2b) || // Lo  [27] HANGUL SYLLABLE JJOEG..HANGUL SYLLABLE JJOEH
            (0xcb2d <= code && code <= 0xcb47) || // Lo  [27] HANGUL SYLLABLE JJYOG..HANGUL SYLLABLE JJYOH
            (0xcb49 <= code && code <= 0xcb63) || // Lo  [27] HANGUL SYLLABLE JJUG..HANGUL SYLLABLE JJUH
            (0xcb65 <= code && code <= 0xcb7f) || // Lo  [27] HANGUL SYLLABLE JJWEOG..HANGUL SYLLABLE JJWEOH
            (0xcb81 <= code && code <= 0xcb9b) || // Lo  [27] HANGUL SYLLABLE JJWEG..HANGUL SYLLABLE JJWEH
            (0xcb9d <= code && code <= 0xcbb7) || // Lo  [27] HANGUL SYLLABLE JJWIG..HANGUL SYLLABLE JJWIH
            (0xcbb9 <= code && code <= 0xcbd3) || // Lo  [27] HANGUL SYLLABLE JJYUG..HANGUL SYLLABLE JJYUH
            (0xcbd5 <= code && code <= 0xcbef) || // Lo  [27] HANGUL SYLLABLE JJEUG..HANGUL SYLLABLE JJEUH
            (0xcbf1 <= code && code <= 0xcc0b) || // Lo  [27] HANGUL SYLLABLE JJYIG..HANGUL SYLLABLE JJYIH
            (0xcc0d <= code && code <= 0xcc27) || // Lo  [27] HANGUL SYLLABLE JJIG..HANGUL SYLLABLE JJIH
            (0xcc29 <= code && code <= 0xcc43) || // Lo  [27] HANGUL SYLLABLE CAG..HANGUL SYLLABLE CAH
            (0xcc45 <= code && code <= 0xcc5f) || // Lo  [27] HANGUL SYLLABLE CAEG..HANGUL SYLLABLE CAEH
            (0xcc61 <= code && code <= 0xcc7b) || // Lo  [27] HANGUL SYLLABLE CYAG..HANGUL SYLLABLE CYAH
            (0xcc7d <= code && code <= 0xcc97) || // Lo  [27] HANGUL SYLLABLE CYAEG..HANGUL SYLLABLE CYAEH
            (0xcc99 <= code && code <= 0xccb3) || // Lo  [27] HANGUL SYLLABLE CEOG..HANGUL SYLLABLE CEOH
            (0xccb5 <= code && code <= 0xcccf) || // Lo  [27] HANGUL SYLLABLE CEG..HANGUL SYLLABLE CEH
            (0xccd1 <= code && code <= 0xcceb) || // Lo  [27] HANGUL SYLLABLE CYEOG..HANGUL SYLLABLE CYEOH
            (0xcced <= code && code <= 0xcd07) || // Lo  [27] HANGUL SYLLABLE CYEG..HANGUL SYLLABLE CYEH
            (0xcd09 <= code && code <= 0xcd23) || // Lo  [27] HANGUL SYLLABLE COG..HANGUL SYLLABLE COH
            (0xcd25 <= code && code <= 0xcd3f) || // Lo  [27] HANGUL SYLLABLE CWAG..HANGUL SYLLABLE CWAH
            (0xcd41 <= code && code <= 0xcd5b) || // Lo  [27] HANGUL SYLLABLE CWAEG..HANGUL SYLLABLE CWAEH
            (0xcd5d <= code && code <= 0xcd77) || // Lo  [27] HANGUL SYLLABLE COEG..HANGUL SYLLABLE COEH
            (0xcd79 <= code && code <= 0xcd93) || // Lo  [27] HANGUL SYLLABLE CYOG..HANGUL SYLLABLE CYOH
            (0xcd95 <= code && code <= 0xcdaf) || // Lo  [27] HANGUL SYLLABLE CUG..HANGUL SYLLABLE CUH
            (0xcdb1 <= code && code <= 0xcdcb) || // Lo  [27] HANGUL SYLLABLE CWEOG..HANGUL SYLLABLE CWEOH
            (0xcdcd <= code && code <= 0xcde7) || // Lo  [27] HANGUL SYLLABLE CWEG..HANGUL SYLLABLE CWEH
            (0xcde9 <= code && code <= 0xce03) || // Lo  [27] HANGUL SYLLABLE CWIG..HANGUL SYLLABLE CWIH
            (0xce05 <= code && code <= 0xce1f) || // Lo  [27] HANGUL SYLLABLE CYUG..HANGUL SYLLABLE CYUH
            (0xce21 <= code && code <= 0xce3b) || // Lo  [27] HANGUL SYLLABLE CEUG..HANGUL SYLLABLE CEUH
            (0xce3d <= code && code <= 0xce57) || // Lo  [27] HANGUL SYLLABLE CYIG..HANGUL SYLLABLE CYIH
            (0xce59 <= code && code <= 0xce73) || // Lo  [27] HANGUL SYLLABLE CIG..HANGUL SYLLABLE CIH
            (0xce75 <= code && code <= 0xce8f) || // Lo  [27] HANGUL SYLLABLE KAG..HANGUL SYLLABLE KAH
            (0xce91 <= code && code <= 0xceab) || // Lo  [27] HANGUL SYLLABLE KAEG..HANGUL SYLLABLE KAEH
            (0xcead <= code && code <= 0xcec7) || // Lo  [27] HANGUL SYLLABLE KYAG..HANGUL SYLLABLE KYAH
            (0xcec9 <= code && code <= 0xcee3) || // Lo  [27] HANGUL SYLLABLE KYAEG..HANGUL SYLLABLE KYAEH
            (0xcee5 <= code && code <= 0xceff) || // Lo  [27] HANGUL SYLLABLE KEOG..HANGUL SYLLABLE KEOH
            (0xcf01 <= code && code <= 0xcf1b) || // Lo  [27] HANGUL SYLLABLE KEG..HANGUL SYLLABLE KEH
            (0xcf1d <= code && code <= 0xcf37) || // Lo  [27] HANGUL SYLLABLE KYEOG..HANGUL SYLLABLE KYEOH
            (0xcf39 <= code && code <= 0xcf53) || // Lo  [27] HANGUL SYLLABLE KYEG..HANGUL SYLLABLE KYEH
            (0xcf55 <= code && code <= 0xcf6f) || // Lo  [27] HANGUL SYLLABLE KOG..HANGUL SYLLABLE KOH
            (0xcf71 <= code && code <= 0xcf8b) || // Lo  [27] HANGUL SYLLABLE KWAG..HANGUL SYLLABLE KWAH
            (0xcf8d <= code && code <= 0xcfa7) || // Lo  [27] HANGUL SYLLABLE KWAEG..HANGUL SYLLABLE KWAEH
            (0xcfa9 <= code && code <= 0xcfc3) || // Lo  [27] HANGUL SYLLABLE KOEG..HANGUL SYLLABLE KOEH
            (0xcfc5 <= code && code <= 0xcfdf) || // Lo  [27] HANGUL SYLLABLE KYOG..HANGUL SYLLABLE KYOH
            (0xcfe1 <= code && code <= 0xcffb) || // Lo  [27] HANGUL SYLLABLE KUG..HANGUL SYLLABLE KUH
            (0xcffd <= code && code <= 0xd017) || // Lo  [27] HANGUL SYLLABLE KWEOG..HANGUL SYLLABLE KWEOH
            (0xd019 <= code && code <= 0xd033) || // Lo  [27] HANGUL SYLLABLE KWEG..HANGUL SYLLABLE KWEH
            (0xd035 <= code && code <= 0xd04f) || // Lo  [27] HANGUL SYLLABLE KWIG..HANGUL SYLLABLE KWIH
            (0xd051 <= code && code <= 0xd06b) || // Lo  [27] HANGUL SYLLABLE KYUG..HANGUL SYLLABLE KYUH
            (0xd06d <= code && code <= 0xd087) || // Lo  [27] HANGUL SYLLABLE KEUG..HANGUL SYLLABLE KEUH
            (0xd089 <= code && code <= 0xd0a3) || // Lo  [27] HANGUL SYLLABLE KYIG..HANGUL SYLLABLE KYIH
            (0xd0a5 <= code && code <= 0xd0bf) || // Lo  [27] HANGUL SYLLABLE KIG..HANGUL SYLLABLE KIH
            (0xd0c1 <= code && code <= 0xd0db) || // Lo  [27] HANGUL SYLLABLE TAG..HANGUL SYLLABLE TAH
            (0xd0dd <= code && code <= 0xd0f7) || // Lo  [27] HANGUL SYLLABLE TAEG..HANGUL SYLLABLE TAEH
            (0xd0f9 <= code && code <= 0xd113) || // Lo  [27] HANGUL SYLLABLE TYAG..HANGUL SYLLABLE TYAH
            (0xd115 <= code && code <= 0xd12f) || // Lo  [27] HANGUL SYLLABLE TYAEG..HANGUL SYLLABLE TYAEH
            (0xd131 <= code && code <= 0xd14b) || // Lo  [27] HANGUL SYLLABLE TEOG..HANGUL SYLLABLE TEOH
            (0xd14d <= code && code <= 0xd167) || // Lo  [27] HANGUL SYLLABLE TEG..HANGUL SYLLABLE TEH
            (0xd169 <= code && code <= 0xd183) || // Lo  [27] HANGUL SYLLABLE TYEOG..HANGUL SYLLABLE TYEOH
            (0xd185 <= code && code <= 0xd19f) || // Lo  [27] HANGUL SYLLABLE TYEG..HANGUL SYLLABLE TYEH
            (0xd1a1 <= code && code <= 0xd1bb) || // Lo  [27] HANGUL SYLLABLE TOG..HANGUL SYLLABLE TOH
            (0xd1bd <= code && code <= 0xd1d7) || // Lo  [27] HANGUL SYLLABLE TWAG..HANGUL SYLLABLE TWAH
            (0xd1d9 <= code && code <= 0xd1f3) || // Lo  [27] HANGUL SYLLABLE TWAEG..HANGUL SYLLABLE TWAEH
            (0xd1f5 <= code && code <= 0xd20f) || // Lo  [27] HANGUL SYLLABLE TOEG..HANGUL SYLLABLE TOEH
            (0xd211 <= code && code <= 0xd22b) || // Lo  [27] HANGUL SYLLABLE TYOG..HANGUL SYLLABLE TYOH
            (0xd22d <= code && code <= 0xd247) || // Lo  [27] HANGUL SYLLABLE TUG..HANGUL SYLLABLE TUH
            (0xd249 <= code && code <= 0xd263) || // Lo  [27] HANGUL SYLLABLE TWEOG..HANGUL SYLLABLE TWEOH
            (0xd265 <= code && code <= 0xd27f) || // Lo  [27] HANGUL SYLLABLE TWEG..HANGUL SYLLABLE TWEH
            (0xd281 <= code && code <= 0xd29b) || // Lo  [27] HANGUL SYLLABLE TWIG..HANGUL SYLLABLE TWIH
            (0xd29d <= code && code <= 0xd2b7) || // Lo  [27] HANGUL SYLLABLE TYUG..HANGUL SYLLABLE TYUH
            (0xd2b9 <= code && code <= 0xd2d3) || // Lo  [27] HANGUL SYLLABLE TEUG..HANGUL SYLLABLE TEUH
            (0xd2d5 <= code && code <= 0xd2ef) || // Lo  [27] HANGUL SYLLABLE TYIG..HANGUL SYLLABLE TYIH
            (0xd2f1 <= code && code <= 0xd30b) || // Lo  [27] HANGUL SYLLABLE TIG..HANGUL SYLLABLE TIH
            (0xd30d <= code && code <= 0xd327) || // Lo  [27] HANGUL SYLLABLE PAG..HANGUL SYLLABLE PAH
            (0xd329 <= code && code <= 0xd343) || // Lo  [27] HANGUL SYLLABLE PAEG..HANGUL SYLLABLE PAEH
            (0xd345 <= code && code <= 0xd35f) || // Lo  [27] HANGUL SYLLABLE PYAG..HANGUL SYLLABLE PYAH
            (0xd361 <= code && code <= 0xd37b) || // Lo  [27] HANGUL SYLLABLE PYAEG..HANGUL SYLLABLE PYAEH
            (0xd37d <= code && code <= 0xd397) || // Lo  [27] HANGUL SYLLABLE PEOG..HANGUL SYLLABLE PEOH
            (0xd399 <= code && code <= 0xd3b3) || // Lo  [27] HANGUL SYLLABLE PEG..HANGUL SYLLABLE PEH
            (0xd3b5 <= code && code <= 0xd3cf) || // Lo  [27] HANGUL SYLLABLE PYEOG..HANGUL SYLLABLE PYEOH
            (0xd3d1 <= code && code <= 0xd3eb) || // Lo  [27] HANGUL SYLLABLE PYEG..HANGUL SYLLABLE PYEH
            (0xd3ed <= code && code <= 0xd407) || // Lo  [27] HANGUL SYLLABLE POG..HANGUL SYLLABLE POH
            (0xd409 <= code && code <= 0xd423) || // Lo  [27] HANGUL SYLLABLE PWAG..HANGUL SYLLABLE PWAH
            (0xd425 <= code && code <= 0xd43f) || // Lo  [27] HANGUL SYLLABLE PWAEG..HANGUL SYLLABLE PWAEH
            (0xd441 <= code && code <= 0xd45b) || // Lo  [27] HANGUL SYLLABLE POEG..HANGUL SYLLABLE POEH
            (0xd45d <= code && code <= 0xd477) || // Lo  [27] HANGUL SYLLABLE PYOG..HANGUL SYLLABLE PYOH
            (0xd479 <= code && code <= 0xd493) || // Lo  [27] HANGUL SYLLABLE PUG..HANGUL SYLLABLE PUH
            (0xd495 <= code && code <= 0xd4af) || // Lo  [27] HANGUL SYLLABLE PWEOG..HANGUL SYLLABLE PWEOH
            (0xd4b1 <= code && code <= 0xd4cb) || // Lo  [27] HANGUL SYLLABLE PWEG..HANGUL SYLLABLE PWEH
            (0xd4cd <= code && code <= 0xd4e7) || // Lo  [27] HANGUL SYLLABLE PWIG..HANGUL SYLLABLE PWIH
            (0xd4e9 <= code && code <= 0xd503) || // Lo  [27] HANGUL SYLLABLE PYUG..HANGUL SYLLABLE PYUH
            (0xd505 <= code && code <= 0xd51f) || // Lo  [27] HANGUL SYLLABLE PEUG..HANGUL SYLLABLE PEUH
            (0xd521 <= code && code <= 0xd53b) || // Lo  [27] HANGUL SYLLABLE PYIG..HANGUL SYLLABLE PYIH
            (0xd53d <= code && code <= 0xd557) || // Lo  [27] HANGUL SYLLABLE PIG..HANGUL SYLLABLE PIH
            (0xd559 <= code && code <= 0xd573) || // Lo  [27] HANGUL SYLLABLE HAG..HANGUL SYLLABLE HAH
            (0xd575 <= code && code <= 0xd58f) || // Lo  [27] HANGUL SYLLABLE HAEG..HANGUL SYLLABLE HAEH
            (0xd591 <= code && code <= 0xd5ab) || // Lo  [27] HANGUL SYLLABLE HYAG..HANGUL SYLLABLE HYAH
            (0xd5ad <= code && code <= 0xd5c7) || // Lo  [27] HANGUL SYLLABLE HYAEG..HANGUL SYLLABLE HYAEH
            (0xd5c9 <= code && code <= 0xd5e3) || // Lo  [27] HANGUL SYLLABLE HEOG..HANGUL SYLLABLE HEOH
            (0xd5e5 <= code && code <= 0xd5ff) || // Lo  [27] HANGUL SYLLABLE HEG..HANGUL SYLLABLE HEH
            (0xd601 <= code && code <= 0xd61b) || // Lo  [27] HANGUL SYLLABLE HYEOG..HANGUL SYLLABLE HYEOH
            (0xd61d <= code && code <= 0xd637) || // Lo  [27] HANGUL SYLLABLE HYEG..HANGUL SYLLABLE HYEH
            (0xd639 <= code && code <= 0xd653) || // Lo  [27] HANGUL SYLLABLE HOG..HANGUL SYLLABLE HOH
            (0xd655 <= code && code <= 0xd66f) || // Lo  [27] HANGUL SYLLABLE HWAG..HANGUL SYLLABLE HWAH
            (0xd671 <= code && code <= 0xd68b) || // Lo  [27] HANGUL SYLLABLE HWAEG..HANGUL SYLLABLE HWAEH
            (0xd68d <= code && code <= 0xd6a7) || // Lo  [27] HANGUL SYLLABLE HOEG..HANGUL SYLLABLE HOEH
            (0xd6a9 <= code && code <= 0xd6c3) || // Lo  [27] HANGUL SYLLABLE HYOG..HANGUL SYLLABLE HYOH
            (0xd6c5 <= code && code <= 0xd6df) || // Lo  [27] HANGUL SYLLABLE HUG..HANGUL SYLLABLE HUH
            (0xd6e1 <= code && code <= 0xd6fb) || // Lo  [27] HANGUL SYLLABLE HWEOG..HANGUL SYLLABLE HWEOH
            (0xd6fd <= code && code <= 0xd717) || // Lo  [27] HANGUL SYLLABLE HWEG..HANGUL SYLLABLE HWEH
            (0xd719 <= code && code <= 0xd733) || // Lo  [27] HANGUL SYLLABLE HWIG..HANGUL SYLLABLE HWIH
            (0xd735 <= code && code <= 0xd74f) || // Lo  [27] HANGUL SYLLABLE HYUG..HANGUL SYLLABLE HYUH
            (0xd751 <= code && code <= 0xd76b) || // Lo  [27] HANGUL SYLLABLE HEUG..HANGUL SYLLABLE HEUH
            (0xd76d <= code && code <= 0xd787) || // Lo  [27] HANGUL SYLLABLE HYIG..HANGUL SYLLABLE HYIH
            (0xd789 <= code && code <= 0xd7a3) // Lo  [27] HANGUL SYLLABLE HIG..HANGUL SYLLABLE HIH
        ) {
            return boundaries_1.CLUSTER_BREAK.LVT;
        }
        if (0x200d === code // Cf       ZERO WIDTH JOINER
        ) {
            return boundaries_1.CLUSTER_BREAK.ZWJ;
        }
        // all unlisted characters have a grapheme break property of "Other"
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
        if (0x00a9 === code || // E0.6   [1] (©️)       copyright
            0x00ae === code || // E0.6   [1] (®️)       registered
            0x203c === code || // E0.6   [1] (‼️)       double exclamation mark
            0x2049 === code || // E0.6   [1] (⁉️)       exclamation question mark
            0x2122 === code || // E0.6   [1] (™️)       trade mark
            0x2139 === code || // E0.6   [1] (ℹ️)       information
            (0x2194 <= code && code <= 0x2199) || // E0.6   [6] (↔️..↙️)    left-right arrow..down-left arrow
            (0x21a9 <= code && code <= 0x21aa) || // E0.6   [2] (↩️..↪️)    right arrow curving left..left arrow curving right
            (0x231a <= code && code <= 0x231b) || // E0.6   [2] (⌚..⌛)    watch..hourglass done
            0x2328 === code || // E1.0   [1] (⌨️)       keyboard
            0x2388 === code || // E0.0   [1] (⎈)       HELM SYMBOL
            0x23cf === code || // E1.0   [1] (⏏️)       eject button
            (0x23e9 <= code && code <= 0x23ec) || // E0.6   [4] (⏩..⏬)    fast-forward button..fast down button
            (0x23ed <= code && code <= 0x23ee) || // E0.7   [2] (⏭️..⏮️)    next track button..last track button
            0x23ef === code || // E1.0   [1] (⏯️)       play or pause button
            0x23f0 === code || // E0.6   [1] (⏰)       alarm clock
            (0x23f1 <= code && code <= 0x23f2) || // E1.0   [2] (⏱️..⏲️)    stopwatch..timer clock
            0x23f3 === code || // E0.6   [1] (⏳)       hourglass not done
            (0x23f8 <= code && code <= 0x23fa) || // E0.7   [3] (⏸️..⏺️)    pause button..record button
            0x24c2 === code || // E0.6   [1] (Ⓜ️)       circled M
            (0x25aa <= code && code <= 0x25ab) || // E0.6   [2] (▪️..▫️)    black small square..white small square
            0x25b6 === code || // E0.6   [1] (▶️)       play button
            0x25c0 === code || // E0.6   [1] (◀️)       reverse button
            (0x25fb <= code && code <= 0x25fe) || // E0.6   [4] (◻️..◾)    white medium square..black medium-small square
            (0x2600 <= code && code <= 0x2601) || // E0.6   [2] (☀️..☁️)    sun..cloud
            (0x2602 <= code && code <= 0x2603) || // E0.7   [2] (☂️..☃️)    umbrella..snowman
            0x2604 === code || // E1.0   [1] (☄️)       comet
            0x2605 === code || // E0.0   [1] (★)       BLACK STAR
            (0x2607 <= code && code <= 0x260d) || // E0.0   [7] (☇..☍)    LIGHTNING..OPPOSITION
            0x260e === code || // E0.6   [1] (☎️)       telephone
            (0x260f <= code && code <= 0x2610) || // E0.0   [2] (☏..☐)    WHITE TELEPHONE..BALLOT BOX
            0x2611 === code || // E0.6   [1] (☑️)       check box with check
            0x2612 === code || // E0.0   [1] (☒)       BALLOT BOX WITH X
            (0x2614 <= code && code <= 0x2615) || // E0.6   [2] (☔..☕)    umbrella with rain drops..hot beverage
            (0x2616 <= code && code <= 0x2617) || // E0.0   [2] (☖..☗)    WHITE SHOGI PIECE..BLACK SHOGI PIECE
            0x2618 === code || // E1.0   [1] (☘️)       shamrock
            (0x2619 <= code && code <= 0x261c) || // E0.0   [4] (☙..☜)    REVERSED ROTATED FLORAL HEART BULLET..WHITE LEFT POINTING INDEX
            0x261d === code || // E0.6   [1] (☝️)       index pointing up
            (0x261e <= code && code <= 0x261f) || // E0.0   [2] (☞..☟)    WHITE RIGHT POINTING INDEX..WHITE DOWN POINTING INDEX
            0x2620 === code || // E1.0   [1] (☠️)       skull and crossbones
            0x2621 === code || // E0.0   [1] (☡)       CAUTION SIGN
            (0x2622 <= code && code <= 0x2623) || // E1.0   [2] (☢️..☣️)    radioactive..biohazard
            (0x2624 <= code && code <= 0x2625) || // E0.0   [2] (☤..☥)    CADUCEUS..ANKH
            0x2626 === code || // E1.0   [1] (☦️)       orthodox cross
            (0x2627 <= code && code <= 0x2629) || // E0.0   [3] (☧..☩)    CHI RHO..CROSS OF JERUSALEM
            0x262a === code || // E0.7   [1] (☪️)       star and crescent
            (0x262b <= code && code <= 0x262d) || // E0.0   [3] (☫..☭)    FARSI SYMBOL..HAMMER AND SICKLE
            0x262e === code || // E1.0   [1] (☮️)       peace symbol
            0x262f === code || // E0.7   [1] (☯️)       yin yang
            (0x2630 <= code && code <= 0x2637) || // E0.0   [8] (☰..☷)    TRIGRAM FOR HEAVEN..TRIGRAM FOR EARTH
            (0x2638 <= code && code <= 0x2639) || // E0.7   [2] (☸️..☹️)    wheel of dharma..frowning face
            0x263a === code || // E0.6   [1] (☺️)       smiling face
            (0x263b <= code && code <= 0x263f) || // E0.0   [5] (☻..☿)    BLACK SMILING FACE..MERCURY
            0x2640 === code || // E4.0   [1] (♀️)       female sign
            0x2641 === code || // E0.0   [1] (♁)       EARTH
            0x2642 === code || // E4.0   [1] (♂️)       male sign
            (0x2643 <= code && code <= 0x2647) || // E0.0   [5] (♃..♇)    JUPITER..PLUTO
            (0x2648 <= code && code <= 0x2653) || // E0.6  [12] (♈..♓)    Aries..Pisces
            (0x2654 <= code && code <= 0x265e) || // E0.0  [11] (♔..♞)    WHITE CHESS KING..BLACK CHESS KNIGHT
            0x265f === code || // E11.0  [1] (♟️)       chess pawn
            0x2660 === code || // E0.6   [1] (♠️)       spade suit
            (0x2661 <= code && code <= 0x2662) || // E0.0   [2] (♡..♢)    WHITE HEART SUIT..WHITE DIAMOND SUIT
            0x2663 === code || // E0.6   [1] (♣️)       club suit
            0x2664 === code || // E0.0   [1] (♤)       WHITE SPADE SUIT
            (0x2665 <= code && code <= 0x2666) || // E0.6   [2] (♥️..♦️)    heart suit..diamond suit
            0x2667 === code || // E0.0   [1] (♧)       WHITE CLUB SUIT
            0x2668 === code || // E0.6   [1] (♨️)       hot springs
            (0x2669 <= code && code <= 0x267a) || // E0.0  [18] (♩..♺)    QUARTER NOTE..RECYCLING SYMBOL FOR GENERIC MATERIALS
            0x267b === code || // E0.6   [1] (♻️)       recycling symbol
            (0x267c <= code && code <= 0x267d) || // E0.0   [2] (♼..♽)    RECYCLED PAPER SYMBOL..PARTIALLY-RECYCLED PAPER SYMBOL
            0x267e === code || // E11.0  [1] (♾️)       infinity
            0x267f === code || // E0.6   [1] (♿)       wheelchair symbol
            (0x2680 <= code && code <= 0x2685) || // E0.0   [6] (⚀..⚅)    DIE FACE-1..DIE FACE-6
            (0x2690 <= code && code <= 0x2691) || // E0.0   [2] (⚐..⚑)    WHITE FLAG..BLACK FLAG
            0x2692 === code || // E1.0   [1] (⚒️)       hammer and pick
            0x2693 === code || // E0.6   [1] (⚓)       anchor
            0x2694 === code || // E1.0   [1] (⚔️)       crossed swords
            0x2695 === code || // E4.0   [1] (⚕️)       medical symbol
            (0x2696 <= code && code <= 0x2697) || // E1.0   [2] (⚖️..⚗️)    balance scale..alembic
            0x2698 === code || // E0.0   [1] (⚘)       FLOWER
            0x2699 === code || // E1.0   [1] (⚙️)       gear
            0x269a === code || // E0.0   [1] (⚚)       STAFF OF HERMES
            (0x269b <= code && code <= 0x269c) || // E1.0   [2] (⚛️..⚜️)    atom symbol..fleur-de-lis
            (0x269d <= code && code <= 0x269f) || // E0.0   [3] (⚝..⚟)    OUTLINED WHITE STAR..THREE LINES CONVERGING LEFT
            (0x26a0 <= code && code <= 0x26a1) || // E0.6   [2] (⚠️..⚡)    warning..high voltage
            (0x26a2 <= code && code <= 0x26a6) || // E0.0   [5] (⚢..⚦)    DOUBLED FEMALE SIGN..MALE WITH STROKE SIGN
            0x26a7 === code || // E13.0  [1] (⚧️)       transgender symbol
            (0x26a8 <= code && code <= 0x26a9) || // E0.0   [2] (⚨..⚩)    VERTICAL MALE WITH STROKE SIGN..HORIZONTAL MALE WITH STROKE SIGN
            (0x26aa <= code && code <= 0x26ab) || // E0.6   [2] (⚪..⚫)    white circle..black circle
            (0x26ac <= code && code <= 0x26af) || // E0.0   [4] (⚬..⚯)    MEDIUM SMALL WHITE CIRCLE..UNMARRIED PARTNERSHIP SYMBOL
            (0x26b0 <= code && code <= 0x26b1) || // E1.0   [2] (⚰️..⚱️)    coffin..funeral urn
            (0x26b2 <= code && code <= 0x26bc) || // E0.0  [11] (⚲..⚼)    NEUTER..SESQUIQUADRATE
            (0x26bd <= code && code <= 0x26be) || // E0.6   [2] (⚽..⚾)    soccer ball..baseball
            (0x26bf <= code && code <= 0x26c3) || // E0.0   [5] (⚿..⛃)    SQUARED KEY..BLACK DRAUGHTS KING
            (0x26c4 <= code && code <= 0x26c5) || // E0.6   [2] (⛄..⛅)    snowman without snow..sun behind cloud
            (0x26c6 <= code && code <= 0x26c7) || // E0.0   [2] (⛆..⛇)    RAIN..BLACK SNOWMAN
            0x26c8 === code || // E0.7   [1] (⛈️)       cloud with lightning and rain
            (0x26c9 <= code && code <= 0x26cd) || // E0.0   [5] (⛉..⛍)    TURNED WHITE SHOGI PIECE..DISABLED CAR
            0x26ce === code || // E0.6   [1] (⛎)       Ophiuchus
            0x26cf === code || // E0.7   [1] (⛏️)       pick
            0x26d0 === code || // E0.0   [1] (⛐)       CAR SLIDING
            0x26d1 === code || // E0.7   [1] (⛑️)       rescue worker’s helmet
            0x26d2 === code || // E0.0   [1] (⛒)       CIRCLED CROSSING LANES
            0x26d3 === code || // E0.7   [1] (⛓️)       chains
            0x26d4 === code || // E0.6   [1] (⛔)       no entry
            (0x26d5 <= code && code <= 0x26e8) || // E0.0  [20] (⛕..⛨)    ALTERNATE ONE-WAY LEFT WAY TRAFFIC..BLACK CROSS ON SHIELD
            0x26e9 === code || // E0.7   [1] (⛩️)       shinto shrine
            0x26ea === code || // E0.6   [1] (⛪)       church
            (0x26eb <= code && code <= 0x26ef) || // E0.0   [5] (⛫..⛯)    CASTLE..MAP SYMBOL FOR LIGHTHOUSE
            (0x26f0 <= code && code <= 0x26f1) || // E0.7   [2] (⛰️..⛱️)    mountain..umbrella on ground
            (0x26f2 <= code && code <= 0x26f3) || // E0.6   [2] (⛲..⛳)    fountain..flag in hole
            0x26f4 === code || // E0.7   [1] (⛴️)       ferry
            0x26f5 === code || // E0.6   [1] (⛵)       sailboat
            0x26f6 === code || // E0.0   [1] (⛶)       SQUARE FOUR CORNERS
            (0x26f7 <= code && code <= 0x26f9) || // E0.7   [3] (⛷️..⛹️)    skier..person bouncing ball
            0x26fa === code || // E0.6   [1] (⛺)       tent
            (0x26fb <= code && code <= 0x26fc) || // E0.0   [2] (⛻..⛼)    JAPANESE BANK SYMBOL..HEADSTONE GRAVEYARD SYMBOL
            0x26fd === code || // E0.6   [1] (⛽)       fuel pump
            (0x26fe <= code && code <= 0x2701) || // E0.0   [4] (⛾..✁)    CUP ON BLACK SQUARE..UPPER BLADE SCISSORS
            0x2702 === code || // E0.6   [1] (✂️)       scissors
            (0x2703 <= code && code <= 0x2704) || // E0.0   [2] (✃..✄)    LOWER BLADE SCISSORS..WHITE SCISSORS
            0x2705 === code || // E0.6   [1] (✅)       check mark button
            (0x2708 <= code && code <= 0x270c) || // E0.6   [5] (✈️..✌️)    airplane..victory hand
            0x270d === code || // E0.7   [1] (✍️)       writing hand
            0x270e === code || // E0.0   [1] (✎)       LOWER RIGHT PENCIL
            0x270f === code || // E0.6   [1] (✏️)       pencil
            (0x2710 <= code && code <= 0x2711) || // E0.0   [2] (✐..✑)    UPPER RIGHT PENCIL..WHITE NIB
            0x2712 === code || // E0.6   [1] (✒️)       black nib
            0x2714 === code || // E0.6   [1] (✔️)       check mark
            0x2716 === code || // E0.6   [1] (✖️)       multiply
            0x271d === code || // E0.7   [1] (✝️)       latin cross
            0x2721 === code || // E0.7   [1] (✡️)       star of David
            0x2728 === code || // E0.6   [1] (✨)       sparkles
            (0x2733 <= code && code <= 0x2734) || // E0.6   [2] (✳️..✴️)    eight-spoked asterisk..eight-pointed star
            0x2744 === code || // E0.6   [1] (❄️)       snowflake
            0x2747 === code || // E0.6   [1] (❇️)       sparkle
            0x274c === code || // E0.6   [1] (❌)       cross mark
            0x274e === code || // E0.6   [1] (❎)       cross mark button
            (0x2753 <= code && code <= 0x2755) || // E0.6   [3] (❓..❕)    question mark..white exclamation mark
            0x2757 === code || // E0.6   [1] (❗)       exclamation mark
            0x2763 === code || // E1.0   [1] (❣️)       heart exclamation
            0x2764 === code || // E0.6   [1] (❤️)       red heart
            (0x2765 <= code && code <= 0x2767) || // E0.0   [3] (❥..❧)    ROTATED HEAVY BLACK HEART BULLET..ROTATED FLORAL HEART BULLET
            (0x2795 <= code && code <= 0x2797) || // E0.6   [3] (➕..➗)    plus..divide
            0x27a1 === code || // E0.6   [1] (➡️)       right arrow
            0x27b0 === code || // E0.6   [1] (➰)       curly loop
            0x27bf === code || // E1.0   [1] (➿)       double curly loop
            (0x2934 <= code && code <= 0x2935) || // E0.6   [2] (⤴️..⤵️)    right arrow curving up..right arrow curving down
            (0x2b05 <= code && code <= 0x2b07) || // E0.6   [3] (⬅️..⬇️)    left arrow..down arrow
            (0x2b1b <= code && code <= 0x2b1c) || // E0.6   [2] (⬛..⬜)    black large square..white large square
            0x2b50 === code || // E0.6   [1] (⭐)       star
            0x2b55 === code || // E0.6   [1] (⭕)       hollow red circle
            0x3030 === code || // E0.6   [1] (〰️)       wavy dash
            0x303d === code || // E0.6   [1] (〽️)       part alternation mark
            0x3297 === code || // E0.6   [1] (㊗️)       Japanese “congratulations” button
            0x3299 === code || // E0.6   [1] (㊙️)       Japanese “secret” button
            (0x1f000 <= code && code <= 0x1f003) || // E0.0   [4] (🀀..🀃)    MAHJONG TILE EAST WIND..MAHJONG TILE NORTH WIND
            0x1f004 === code || // E0.6   [1] (🀄)       mahjong red dragon
            (0x1f005 <= code && code <= 0x1f0ce) || // E0.0 [202] (🀅..🃎)    MAHJONG TILE GREEN DRAGON..PLAYING CARD KING OF DIAMONDS
            0x1f0cf === code || // E0.6   [1] (🃏)       joker
            (0x1f0d0 <= code && code <= 0x1f0ff) || // E0.0  [48] (🃐..🃿)    <reserved-1F0D0>..<reserved-1F0FF>
            (0x1f10d <= code && code <= 0x1f10f) || // E0.0   [3] (🄍..🄏)    CIRCLED ZERO WITH SLASH..CIRCLED DOLLAR SIGN WITH OVERLAID BACKSLASH
            0x1f12f === code || // E0.0   [1] (🄯)       COPYLEFT SYMBOL
            (0x1f16c <= code && code <= 0x1f16f) || // E0.0   [4] (🅬..🅯)    RAISED MR SIGN..CIRCLED HUMAN FIGURE
            (0x1f170 <= code && code <= 0x1f171) || // E0.6   [2] (🅰️..🅱️)    A button (blood type)..B button (blood type)
            (0x1f17e <= code && code <= 0x1f17f) || // E0.6   [2] (🅾️..🅿️)    O button (blood type)..P button
            0x1f18e === code || // E0.6   [1] (🆎)       AB button (blood type)
            (0x1f191 <= code && code <= 0x1f19a) || // E0.6  [10] (🆑..🆚)    CL button..VS button
            (0x1f1ad <= code && code <= 0x1f1e5) || // E0.0  [57] (🆭..🇥)    MASK WORK SYMBOL..<reserved-1F1E5>
            (0x1f201 <= code && code <= 0x1f202) || // E0.6   [2] (🈁..🈂️)    Japanese “here” button..Japanese “service charge” button
            (0x1f203 <= code && code <= 0x1f20f) || // E0.0  [13] (🈃..🈏)    <reserved-1F203>..<reserved-1F20F>
            0x1f21a === code || // E0.6   [1] (🈚)       Japanese “free of charge” button
            0x1f22f === code || // E0.6   [1] (🈯)       Japanese “reserved” button
            (0x1f232 <= code && code <= 0x1f23a) || // E0.6   [9] (🈲..🈺)    Japanese “prohibited” button..Japanese “open for business” button
            (0x1f23c <= code && code <= 0x1f23f) || // E0.0   [4] (🈼..🈿)    <reserved-1F23C>..<reserved-1F23F>
            (0x1f249 <= code && code <= 0x1f24f) || // E0.0   [7] (🉉..🉏)    <reserved-1F249>..<reserved-1F24F>
            (0x1f250 <= code && code <= 0x1f251) || // E0.6   [2] (🉐..🉑)    Japanese “bargain” button..Japanese “acceptable” button
            (0x1f252 <= code && code <= 0x1f2ff) || // E0.0 [174] (🉒..🋿)    <reserved-1F252>..<reserved-1F2FF>
            (0x1f300 <= code && code <= 0x1f30c) || // E0.6  [13] (🌀..🌌)    cyclone..milky way
            (0x1f30d <= code && code <= 0x1f30e) || // E0.7   [2] (🌍..🌎)    globe showing Europe-Africa..globe showing Americas
            0x1f30f === code || // E0.6   [1] (🌏)       globe showing Asia-Australia
            0x1f310 === code || // E1.0   [1] (🌐)       globe with meridians
            0x1f311 === code || // E0.6   [1] (🌑)       new moon
            0x1f312 === code || // E1.0   [1] (🌒)       waxing crescent moon
            (0x1f313 <= code && code <= 0x1f315) || // E0.6   [3] (🌓..🌕)    first quarter moon..full moon
            (0x1f316 <= code && code <= 0x1f318) || // E1.0   [3] (🌖..🌘)    waning gibbous moon..waning crescent moon
            0x1f319 === code || // E0.6   [1] (🌙)       crescent moon
            0x1f31a === code || // E1.0   [1] (🌚)       new moon face
            0x1f31b === code || // E0.6   [1] (🌛)       first quarter moon face
            0x1f31c === code || // E0.7   [1] (🌜)       last quarter moon face
            (0x1f31d <= code && code <= 0x1f31e) || // E1.0   [2] (🌝..🌞)    full moon face..sun with face
            (0x1f31f <= code && code <= 0x1f320) || // E0.6   [2] (🌟..🌠)    glowing star..shooting star
            0x1f321 === code || // E0.7   [1] (🌡️)       thermometer
            (0x1f322 <= code && code <= 0x1f323) || // E0.0   [2] (🌢..🌣)    BLACK DROPLET..WHITE SUN
            (0x1f324 <= code && code <= 0x1f32c) || // E0.7   [9] (🌤️..🌬️)    sun behind small cloud..wind face
            (0x1f32d <= code && code <= 0x1f32f) || // E1.0   [3] (🌭..🌯)    hot dog..burrito
            (0x1f330 <= code && code <= 0x1f331) || // E0.6   [2] (🌰..🌱)    chestnut..seedling
            (0x1f332 <= code && code <= 0x1f333) || // E1.0   [2] (🌲..🌳)    evergreen tree..deciduous tree
            (0x1f334 <= code && code <= 0x1f335) || // E0.6   [2] (🌴..🌵)    palm tree..cactus
            0x1f336 === code || // E0.7   [1] (🌶️)       hot pepper
            (0x1f337 <= code && code <= 0x1f34a) || // E0.6  [20] (🌷..🍊)    tulip..tangerine
            0x1f34b === code || // E1.0   [1] (🍋)       lemon
            (0x1f34c <= code && code <= 0x1f34f) || // E0.6   [4] (🍌..🍏)    banana..green apple
            0x1f350 === code || // E1.0   [1] (🍐)       pear
            (0x1f351 <= code && code <= 0x1f37b) || // E0.6  [43] (🍑..🍻)    peach..clinking beer mugs
            0x1f37c === code || // E1.0   [1] (🍼)       baby bottle
            0x1f37d === code || // E0.7   [1] (🍽️)       fork and knife with plate
            (0x1f37e <= code && code <= 0x1f37f) || // E1.0   [2] (🍾..🍿)    bottle with popping cork..popcorn
            (0x1f380 <= code && code <= 0x1f393) || // E0.6  [20] (🎀..🎓)    ribbon..graduation cap
            (0x1f394 <= code && code <= 0x1f395) || // E0.0   [2] (🎔..🎕)    HEART WITH TIP ON THE LEFT..BOUQUET OF FLOWERS
            (0x1f396 <= code && code <= 0x1f397) || // E0.7   [2] (🎖️..🎗️)    military medal..reminder ribbon
            0x1f398 === code || // E0.0   [1] (🎘)       MUSICAL KEYBOARD WITH JACKS
            (0x1f399 <= code && code <= 0x1f39b) || // E0.7   [3] (🎙️..🎛️)    studio microphone..control knobs
            (0x1f39c <= code && code <= 0x1f39d) || // E0.0   [2] (🎜..🎝)    BEAMED ASCENDING MUSICAL NOTES..BEAMED DESCENDING MUSICAL NOTES
            (0x1f39e <= code && code <= 0x1f39f) || // E0.7   [2] (🎞️..🎟️)    film frames..admission tickets
            (0x1f3a0 <= code && code <= 0x1f3c4) || // E0.6  [37] (🎠..🏄)    carousel horse..person surfing
            0x1f3c5 === code || // E1.0   [1] (🏅)       sports medal
            0x1f3c6 === code || // E0.6   [1] (🏆)       trophy
            0x1f3c7 === code || // E1.0   [1] (🏇)       horse racing
            0x1f3c8 === code || // E0.6   [1] (🏈)       american football
            0x1f3c9 === code || // E1.0   [1] (🏉)       rugby football
            0x1f3ca === code || // E0.6   [1] (🏊)       person swimming
            (0x1f3cb <= code && code <= 0x1f3ce) || // E0.7   [4] (🏋️..🏎️)    person lifting weights..racing car
            (0x1f3cf <= code && code <= 0x1f3d3) || // E1.0   [5] (🏏..🏓)    cricket game..ping pong
            (0x1f3d4 <= code && code <= 0x1f3df) || // E0.7  [12] (🏔️..🏟️)    snow-capped mountain..stadium
            (0x1f3e0 <= code && code <= 0x1f3e3) || // E0.6   [4] (🏠..🏣)    house..Japanese post office
            0x1f3e4 === code || // E1.0   [1] (🏤)       post office
            (0x1f3e5 <= code && code <= 0x1f3f0) || // E0.6  [12] (🏥..🏰)    hospital..castle
            (0x1f3f1 <= code && code <= 0x1f3f2) || // E0.0   [2] (🏱..🏲)    WHITE PENNANT..BLACK PENNANT
            0x1f3f3 === code || // E0.7   [1] (🏳️)       white flag
            0x1f3f4 === code || // E1.0   [1] (🏴)       black flag
            0x1f3f5 === code || // E0.7   [1] (🏵️)       rosette
            0x1f3f6 === code || // E0.0   [1] (🏶)       BLACK ROSETTE
            0x1f3f7 === code || // E0.7   [1] (🏷️)       label
            (0x1f3f8 <= code && code <= 0x1f3fa) || // E1.0   [3] (🏸..🏺)    badminton..amphora
            (0x1f400 <= code && code <= 0x1f407) || // E1.0   [8] (🐀..🐇)    rat..rabbit
            0x1f408 === code || // E0.7   [1] (🐈)       cat
            (0x1f409 <= code && code <= 0x1f40b) || // E1.0   [3] (🐉..🐋)    dragon..whale
            (0x1f40c <= code && code <= 0x1f40e) || // E0.6   [3] (🐌..🐎)    snail..horse
            (0x1f40f <= code && code <= 0x1f410) || // E1.0   [2] (🐏..🐐)    ram..goat
            (0x1f411 <= code && code <= 0x1f412) || // E0.6   [2] (🐑..🐒)    ewe..monkey
            0x1f413 === code || // E1.0   [1] (🐓)       rooster
            0x1f414 === code || // E0.6   [1] (🐔)       chicken
            0x1f415 === code || // E0.7   [1] (🐕)       dog
            0x1f416 === code || // E1.0   [1] (🐖)       pig
            (0x1f417 <= code && code <= 0x1f429) || // E0.6  [19] (🐗..🐩)    boar..poodle
            0x1f42a === code || // E1.0   [1] (🐪)       camel
            (0x1f42b <= code && code <= 0x1f43e) || // E0.6  [20] (🐫..🐾)    two-hump camel..paw prints
            0x1f43f === code || // E0.7   [1] (🐿️)       chipmunk
            0x1f440 === code || // E0.6   [1] (👀)       eyes
            0x1f441 === code || // E0.7   [1] (👁️)       eye
            (0x1f442 <= code && code <= 0x1f464) || // E0.6  [35] (👂..👤)    ear..bust in silhouette
            0x1f465 === code || // E1.0   [1] (👥)       busts in silhouette
            (0x1f466 <= code && code <= 0x1f46b) || // E0.6   [6] (👦..👫)    boy..woman and man holding hands
            (0x1f46c <= code && code <= 0x1f46d) || // E1.0   [2] (👬..👭)    men holding hands..women holding hands
            (0x1f46e <= code && code <= 0x1f4ac) || // E0.6  [63] (👮..💬)    police officer..speech balloon
            0x1f4ad === code || // E1.0   [1] (💭)       thought balloon
            (0x1f4ae <= code && code <= 0x1f4b5) || // E0.6   [8] (💮..💵)    white flower..dollar banknote
            (0x1f4b6 <= code && code <= 0x1f4b7) || // E1.0   [2] (💶..💷)    euro banknote..pound banknote
            (0x1f4b8 <= code && code <= 0x1f4eb) || // E0.6  [52] (💸..📫)    money with wings..closed mailbox with raised flag
            (0x1f4ec <= code && code <= 0x1f4ed) || // E0.7   [2] (📬..📭)    open mailbox with raised flag..open mailbox with lowered flag
            0x1f4ee === code || // E0.6   [1] (📮)       postbox
            0x1f4ef === code || // E1.0   [1] (📯)       postal horn
            (0x1f4f0 <= code && code <= 0x1f4f4) || // E0.6   [5] (📰..📴)    newspaper..mobile phone off
            0x1f4f5 === code || // E1.0   [1] (📵)       no mobile phones
            (0x1f4f6 <= code && code <= 0x1f4f7) || // E0.6   [2] (📶..📷)    antenna bars..camera
            0x1f4f8 === code || // E1.0   [1] (📸)       camera with flash
            (0x1f4f9 <= code && code <= 0x1f4fc) || // E0.6   [4] (📹..📼)    video camera..videocassette
            0x1f4fd === code || // E0.7   [1] (📽️)       film projector
            0x1f4fe === code || // E0.0   [1] (📾)       PORTABLE STEREO
            (0x1f4ff <= code && code <= 0x1f502) || // E1.0   [4] (📿..🔂)    prayer beads..repeat single button
            0x1f503 === code || // E0.6   [1] (🔃)       clockwise vertical arrows
            (0x1f504 <= code && code <= 0x1f507) || // E1.0   [4] (🔄..🔇)    counterclockwise arrows button..muted speaker
            0x1f508 === code || // E0.7   [1] (🔈)       speaker low volume
            0x1f509 === code || // E1.0   [1] (🔉)       speaker medium volume
            (0x1f50a <= code && code <= 0x1f514) || // E0.6  [11] (🔊..🔔)    speaker high volume..bell
            0x1f515 === code || // E1.0   [1] (🔕)       bell with slash
            (0x1f516 <= code && code <= 0x1f52b) || // E0.6  [22] (🔖..🔫)    bookmark..pistol
            (0x1f52c <= code && code <= 0x1f52d) || // E1.0   [2] (🔬..🔭)    microscope..telescope
            (0x1f52e <= code && code <= 0x1f53d) || // E0.6  [16] (🔮..🔽)    crystal ball..downwards button
            (0x1f546 <= code && code <= 0x1f548) || // E0.0   [3] (🕆..🕈)    WHITE LATIN CROSS..CELTIC CROSS
            (0x1f549 <= code && code <= 0x1f54a) || // E0.7   [2] (🕉️..🕊️)    om..dove
            (0x1f54b <= code && code <= 0x1f54e) || // E1.0   [4] (🕋..🕎)    kaaba..menorah
            0x1f54f === code || // E0.0   [1] (🕏)       BOWL OF HYGIEIA
            (0x1f550 <= code && code <= 0x1f55b) || // E0.6  [12] (🕐..🕛)    one o’clock..twelve o’clock
            (0x1f55c <= code && code <= 0x1f567) || // E0.7  [12] (🕜..🕧)    one-thirty..twelve-thirty
            (0x1f568 <= code && code <= 0x1f56e) || // E0.0   [7] (🕨..🕮)    RIGHT SPEAKER..BOOK
            (0x1f56f <= code && code <= 0x1f570) || // E0.7   [2] (🕯️..🕰️)    candle..mantelpiece clock
            (0x1f571 <= code && code <= 0x1f572) || // E0.0   [2] (🕱..🕲)    BLACK SKULL AND CROSSBONES..NO PIRACY
            (0x1f573 <= code && code <= 0x1f579) || // E0.7   [7] (🕳️..🕹️)    hole..joystick
            0x1f57a === code || // E3.0   [1] (🕺)       man dancing
            (0x1f57b <= code && code <= 0x1f586) || // E0.0  [12] (🕻..🖆)    LEFT HAND TELEPHONE RECEIVER..PEN OVER STAMPED ENVELOPE
            0x1f587 === code || // E0.7   [1] (🖇️)       linked paperclips
            (0x1f588 <= code && code <= 0x1f589) || // E0.0   [2] (🖈..🖉)    BLACK PUSHPIN..LOWER LEFT PENCIL
            (0x1f58a <= code && code <= 0x1f58d) || // E0.7   [4] (🖊️..🖍️)    pen..crayon
            (0x1f58e <= code && code <= 0x1f58f) || // E0.0   [2] (🖎..🖏)    LEFT WRITING HAND..TURNED OK HAND SIGN
            0x1f590 === code || // E0.7   [1] (🖐️)       hand with fingers splayed
            (0x1f591 <= code && code <= 0x1f594) || // E0.0   [4] (🖑..🖔)    REVERSED RAISED HAND WITH FINGERS SPLAYED..REVERSED VICTORY HAND
            (0x1f595 <= code && code <= 0x1f596) || // E1.0   [2] (🖕..🖖)    middle finger..vulcan salute
            (0x1f597 <= code && code <= 0x1f5a3) || // E0.0  [13] (🖗..🖣)    WHITE DOWN POINTING LEFT HAND INDEX..BLACK DOWN POINTING BACKHAND INDEX
            0x1f5a4 === code || // E3.0   [1] (🖤)       black heart
            0x1f5a5 === code || // E0.7   [1] (🖥️)       desktop computer
            (0x1f5a6 <= code && code <= 0x1f5a7) || // E0.0   [2] (🖦..🖧)    KEYBOARD AND MOUSE..THREE NETWORKED COMPUTERS
            0x1f5a8 === code || // E0.7   [1] (🖨️)       printer
            (0x1f5a9 <= code && code <= 0x1f5b0) || // E0.0   [8] (🖩..🖰)    POCKET CALCULATOR..TWO BUTTON MOUSE
            (0x1f5b1 <= code && code <= 0x1f5b2) || // E0.7   [2] (🖱️..🖲️)    computer mouse..trackball
            (0x1f5b3 <= code && code <= 0x1f5bb) || // E0.0   [9] (🖳..🖻)    OLD PERSONAL COMPUTER..DOCUMENT WITH PICTURE
            0x1f5bc === code || // E0.7   [1] (🖼️)       framed picture
            (0x1f5bd <= code && code <= 0x1f5c1) || // E0.0   [5] (🖽..🗁)    FRAME WITH TILES..OPEN FOLDER
            (0x1f5c2 <= code && code <= 0x1f5c4) || // E0.7   [3] (🗂️..🗄️)    card index dividers..file cabinet
            (0x1f5c5 <= code && code <= 0x1f5d0) || // E0.0  [12] (🗅..🗐)    EMPTY NOTE..PAGES
            (0x1f5d1 <= code && code <= 0x1f5d3) || // E0.7   [3] (🗑️..🗓️)    wastebasket..spiral calendar
            (0x1f5d4 <= code && code <= 0x1f5db) || // E0.0   [8] (🗔..🗛)    DESKTOP WINDOW..DECREASE FONT SIZE SYMBOL
            (0x1f5dc <= code && code <= 0x1f5de) || // E0.7   [3] (🗜️..🗞️)    clamp..rolled-up newspaper
            (0x1f5df <= code && code <= 0x1f5e0) || // E0.0   [2] (🗟..🗠)    PAGE WITH CIRCLED TEXT..STOCK CHART
            0x1f5e1 === code || // E0.7   [1] (🗡️)       dagger
            0x1f5e2 === code || // E0.0   [1] (🗢)       LIPS
            0x1f5e3 === code || // E0.7   [1] (🗣️)       speaking head
            (0x1f5e4 <= code && code <= 0x1f5e7) || // E0.0   [4] (🗤..🗧)    THREE RAYS ABOVE..THREE RAYS RIGHT
            0x1f5e8 === code || // E2.0   [1] (🗨️)       left speech bubble
            (0x1f5e9 <= code && code <= 0x1f5ee) || // E0.0   [6] (🗩..🗮)    RIGHT SPEECH BUBBLE..LEFT ANGER BUBBLE
            0x1f5ef === code || // E0.7   [1] (🗯️)       right anger bubble
            (0x1f5f0 <= code && code <= 0x1f5f2) || // E0.0   [3] (🗰..🗲)    MOOD BUBBLE..LIGHTNING MOOD
            0x1f5f3 === code || // E0.7   [1] (🗳️)       ballot box with ballot
            (0x1f5f4 <= code && code <= 0x1f5f9) || // E0.0   [6] (🗴..🗹)    BALLOT SCRIPT X..BALLOT BOX WITH BOLD CHECK
            0x1f5fa === code || // E0.7   [1] (🗺️)       world map
            (0x1f5fb <= code && code <= 0x1f5ff) || // E0.6   [5] (🗻..🗿)    mount fuji..moai
            0x1f600 === code || // E1.0   [1] (😀)       grinning face
            (0x1f601 <= code && code <= 0x1f606) || // E0.6   [6] (😁..😆)    beaming face with smiling eyes..grinning squinting face
            (0x1f607 <= code && code <= 0x1f608) || // E1.0   [2] (😇..😈)    smiling face with halo..smiling face with horns
            (0x1f609 <= code && code <= 0x1f60d) || // E0.6   [5] (😉..😍)    winking face..smiling face with heart-eyes
            0x1f60e === code || // E1.0   [1] (😎)       smiling face with sunglasses
            0x1f60f === code || // E0.6   [1] (😏)       smirking face
            0x1f610 === code || // E0.7   [1] (😐)       neutral face
            0x1f611 === code || // E1.0   [1] (😑)       expressionless face
            (0x1f612 <= code && code <= 0x1f614) || // E0.6   [3] (😒..😔)    unamused face..pensive face
            0x1f615 === code || // E1.0   [1] (😕)       confused face
            0x1f616 === code || // E0.6   [1] (😖)       confounded face
            0x1f617 === code || // E1.0   [1] (😗)       kissing face
            0x1f618 === code || // E0.6   [1] (😘)       face blowing a kiss
            0x1f619 === code || // E1.0   [1] (😙)       kissing face with smiling eyes
            0x1f61a === code || // E0.6   [1] (😚)       kissing face with closed eyes
            0x1f61b === code || // E1.0   [1] (😛)       face with tongue
            (0x1f61c <= code && code <= 0x1f61e) || // E0.6   [3] (😜..😞)    winking face with tongue..disappointed face
            0x1f61f === code || // E1.0   [1] (😟)       worried face
            (0x1f620 <= code && code <= 0x1f625) || // E0.6   [6] (😠..😥)    angry face..sad but relieved face
            (0x1f626 <= code && code <= 0x1f627) || // E1.0   [2] (😦..😧)    frowning face with open mouth..anguished face
            (0x1f628 <= code && code <= 0x1f62b) || // E0.6   [4] (😨..😫)    fearful face..tired face
            0x1f62c === code || // E1.0   [1] (😬)       grimacing face
            0x1f62d === code || // E0.6   [1] (😭)       loudly crying face
            (0x1f62e <= code && code <= 0x1f62f) || // E1.0   [2] (😮..😯)    face with open mouth..hushed face
            (0x1f630 <= code && code <= 0x1f633) || // E0.6   [4] (😰..😳)    anxious face with sweat..flushed face
            0x1f634 === code || // E1.0   [1] (😴)       sleeping face
            0x1f635 === code || // E0.6   [1] (😵)       dizzy face
            0x1f636 === code || // E1.0   [1] (😶)       face without mouth
            (0x1f637 <= code && code <= 0x1f640) || // E0.6  [10] (😷..🙀)    face with medical mask..weary cat
            (0x1f641 <= code && code <= 0x1f644) || // E1.0   [4] (🙁..🙄)    slightly frowning face..face with rolling eyes
            (0x1f645 <= code && code <= 0x1f64f) || // E0.6  [11] (🙅..🙏)    person gesturing NO..folded hands
            0x1f680 === code || // E0.6   [1] (🚀)       rocket
            (0x1f681 <= code && code <= 0x1f682) || // E1.0   [2] (🚁..🚂)    helicopter..locomotive
            (0x1f683 <= code && code <= 0x1f685) || // E0.6   [3] (🚃..🚅)    railway car..bullet train
            0x1f686 === code || // E1.0   [1] (🚆)       train
            0x1f687 === code || // E0.6   [1] (🚇)       metro
            0x1f688 === code || // E1.0   [1] (🚈)       light rail
            0x1f689 === code || // E0.6   [1] (🚉)       station
            (0x1f68a <= code && code <= 0x1f68b) || // E1.0   [2] (🚊..🚋)    tram..tram car
            0x1f68c === code || // E0.6   [1] (🚌)       bus
            0x1f68d === code || // E0.7   [1] (🚍)       oncoming bus
            0x1f68e === code || // E1.0   [1] (🚎)       trolleybus
            0x1f68f === code || // E0.6   [1] (🚏)       bus stop
            0x1f690 === code || // E1.0   [1] (🚐)       minibus
            (0x1f691 <= code && code <= 0x1f693) || // E0.6   [3] (🚑..🚓)    ambulance..police car
            0x1f694 === code || // E0.7   [1] (🚔)       oncoming police car
            0x1f695 === code || // E0.6   [1] (🚕)       taxi
            0x1f696 === code || // E1.0   [1] (🚖)       oncoming taxi
            0x1f697 === code || // E0.6   [1] (🚗)       automobile
            0x1f698 === code || // E0.7   [1] (🚘)       oncoming automobile
            (0x1f699 <= code && code <= 0x1f69a) || // E0.6   [2] (🚙..🚚)    sport utility vehicle..delivery truck
            (0x1f69b <= code && code <= 0x1f6a1) || // E1.0   [7] (🚛..🚡)    articulated lorry..aerial tramway
            0x1f6a2 === code || // E0.6   [1] (🚢)       ship
            0x1f6a3 === code || // E1.0   [1] (🚣)       person rowing boat
            (0x1f6a4 <= code && code <= 0x1f6a5) || // E0.6   [2] (🚤..🚥)    speedboat..horizontal traffic light
            0x1f6a6 === code || // E1.0   [1] (🚦)       vertical traffic light
            (0x1f6a7 <= code && code <= 0x1f6ad) || // E0.6   [7] (🚧..🚭)    construction..no smoking
            (0x1f6ae <= code && code <= 0x1f6b1) || // E1.0   [4] (🚮..🚱)    litter in bin sign..non-potable water
            0x1f6b2 === code || // E0.6   [1] (🚲)       bicycle
            (0x1f6b3 <= code && code <= 0x1f6b5) || // E1.0   [3] (🚳..🚵)    no bicycles..person mountain biking
            0x1f6b6 === code || // E0.6   [1] (🚶)       person walking
            (0x1f6b7 <= code && code <= 0x1f6b8) || // E1.0   [2] (🚷..🚸)    no pedestrians..children crossing
            (0x1f6b9 <= code && code <= 0x1f6be) || // E0.6   [6] (🚹..🚾)    men’s room..water closet
            0x1f6bf === code || // E1.0   [1] (🚿)       shower
            0x1f6c0 === code || // E0.6   [1] (🛀)       person taking bath
            (0x1f6c1 <= code && code <= 0x1f6c5) || // E1.0   [5] (🛁..🛅)    bathtub..left luggage
            (0x1f6c6 <= code && code <= 0x1f6ca) || // E0.0   [5] (🛆..🛊)    TRIANGLE WITH ROUNDED CORNERS..GIRLS SYMBOL
            0x1f6cb === code || // E0.7   [1] (🛋️)       couch and lamp
            0x1f6cc === code || // E1.0   [1] (🛌)       person in bed
            (0x1f6cd <= code && code <= 0x1f6cf) || // E0.7   [3] (🛍️..🛏️)    shopping bags..bed
            0x1f6d0 === code || // E1.0   [1] (🛐)       place of worship
            (0x1f6d1 <= code && code <= 0x1f6d2) || // E3.0   [2] (🛑..🛒)    stop sign..shopping cart
            (0x1f6d3 <= code && code <= 0x1f6d4) || // E0.0   [2] (🛓..🛔)    STUPA..PAGODA
            0x1f6d5 === code || // E12.0  [1] (🛕)       hindu temple
            (0x1f6d6 <= code && code <= 0x1f6d7) || // E13.0  [2] (🛖..🛗)    hut..elevator
            (0x1f6d8 <= code && code <= 0x1f6df) || // E0.0   [8] (🛘..🛟)    <reserved-1F6D8>..<reserved-1F6DF>
            (0x1f6e0 <= code && code <= 0x1f6e5) || // E0.7   [6] (🛠️..🛥️)    hammer and wrench..motor boat
            (0x1f6e6 <= code && code <= 0x1f6e8) || // E0.0   [3] (🛦..🛨)    UP-POINTING MILITARY AIRPLANE..UP-POINTING SMALL AIRPLANE
            0x1f6e9 === code || // E0.7   [1] (🛩️)       small airplane
            0x1f6ea === code || // E0.0   [1] (🛪)       NORTHEAST-POINTING AIRPLANE
            (0x1f6eb <= code && code <= 0x1f6ec) || // E1.0   [2] (🛫..🛬)    airplane departure..airplane arrival
            (0x1f6ed <= code && code <= 0x1f6ef) || // E0.0   [3] (🛭..🛯)    <reserved-1F6ED>..<reserved-1F6EF>
            0x1f6f0 === code || // E0.7   [1] (🛰️)       satellite
            (0x1f6f1 <= code && code <= 0x1f6f2) || // E0.0   [2] (🛱..🛲)    ONCOMING FIRE ENGINE..DIESEL LOCOMOTIVE
            0x1f6f3 === code || // E0.7   [1] (🛳️)       passenger ship
            (0x1f6f4 <= code && code <= 0x1f6f6) || // E3.0   [3] (🛴..🛶)    kick scooter..canoe
            (0x1f6f7 <= code && code <= 0x1f6f8) || // E5.0   [2] (🛷..🛸)    sled..flying saucer
            0x1f6f9 === code || // E11.0  [1] (🛹)       skateboard
            0x1f6fa === code || // E12.0  [1] (🛺)       auto rickshaw
            (0x1f6fb <= code && code <= 0x1f6fc) || // E13.0  [2] (🛻..🛼)    pickup truck..roller skate
            (0x1f6fd <= code && code <= 0x1f6ff) || // E0.0   [3] (🛽..🛿)    <reserved-1F6FD>..<reserved-1F6FF>
            (0x1f774 <= code && code <= 0x1f77f) || // E0.0  [12] (🝴..🝿)    <reserved-1F774>..<reserved-1F77F>
            (0x1f7d5 <= code && code <= 0x1f7df) || // E0.0  [11] (🟕..🟟)    CIRCLED TRIANGLE..<reserved-1F7DF>
            (0x1f7e0 <= code && code <= 0x1f7eb) || // E12.0 [12] (🟠..🟫)    orange circle..brown square
            (0x1f7ec <= code && code <= 0x1f7ff) || // E0.0  [20] (🟬..🟿)    <reserved-1F7EC>..<reserved-1F7FF>
            (0x1f80c <= code && code <= 0x1f80f) || // E0.0   [4] (🠌..🠏)    <reserved-1F80C>..<reserved-1F80F>
            (0x1f848 <= code && code <= 0x1f84f) || // E0.0   [8] (🡈..🡏)    <reserved-1F848>..<reserved-1F84F>
            (0x1f85a <= code && code <= 0x1f85f) || // E0.0   [6] (🡚..🡟)    <reserved-1F85A>..<reserved-1F85F>
            (0x1f888 <= code && code <= 0x1f88f) || // E0.0   [8] (🢈..🢏)    <reserved-1F888>..<reserved-1F88F>
            (0x1f8ae <= code && code <= 0x1f8ff) || // E0.0  [82] (🢮..🣿)    <reserved-1F8AE>..<reserved-1F8FF>
            0x1f90c === code || // E13.0  [1] (🤌)       pinched fingers
            (0x1f90d <= code && code <= 0x1f90f) || // E12.0  [3] (🤍..🤏)    white heart..pinching hand
            (0x1f910 <= code && code <= 0x1f918) || // E1.0   [9] (🤐..🤘)    zipper-mouth face..sign of the horns
            (0x1f919 <= code && code <= 0x1f91e) || // E3.0   [6] (🤙..🤞)    call me hand..crossed fingers
            0x1f91f === code || // E5.0   [1] (🤟)       love-you gesture
            (0x1f920 <= code && code <= 0x1f927) || // E3.0   [8] (🤠..🤧)    cowboy hat face..sneezing face
            (0x1f928 <= code && code <= 0x1f92f) || // E5.0   [8] (🤨..🤯)    face with raised eyebrow..exploding head
            0x1f930 === code || // E3.0   [1] (🤰)       pregnant woman
            (0x1f931 <= code && code <= 0x1f932) || // E5.0   [2] (🤱..🤲)    breast-feeding..palms up together
            (0x1f933 <= code && code <= 0x1f93a) || // E3.0   [8] (🤳..🤺)    selfie..person fencing
            (0x1f93c <= code && code <= 0x1f93e) || // E3.0   [3] (🤼..🤾)    people wrestling..person playing handball
            0x1f93f === code || // E12.0  [1] (🤿)       diving mask
            (0x1f940 <= code && code <= 0x1f945) || // E3.0   [6] (🥀..🥅)    wilted flower..goal net
            (0x1f947 <= code && code <= 0x1f94b) || // E3.0   [5] (🥇..🥋)    1st place medal..martial arts uniform
            0x1f94c === code || // E5.0   [1] (🥌)       curling stone
            (0x1f94d <= code && code <= 0x1f94f) || // E11.0  [3] (🥍..🥏)    lacrosse..flying disc
            (0x1f950 <= code && code <= 0x1f95e) || // E3.0  [15] (🥐..🥞)    croissant..pancakes
            (0x1f95f <= code && code <= 0x1f96b) || // E5.0  [13] (🥟..🥫)    dumpling..canned food
            (0x1f96c <= code && code <= 0x1f970) || // E11.0  [5] (🥬..🥰)    leafy green..smiling face with hearts
            0x1f971 === code || // E12.0  [1] (🥱)       yawning face
            0x1f972 === code || // E13.0  [1] (🥲)       smiling face with tear
            (0x1f973 <= code && code <= 0x1f976) || // E11.0  [4] (🥳..🥶)    partying face..cold face
            (0x1f977 <= code && code <= 0x1f978) || // E13.0  [2] (🥷..🥸)    ninja..disguised face
            0x1f979 === code || // E0.0   [1] (🥹)       <reserved-1F979>
            0x1f97a === code || // E11.0  [1] (🥺)       pleading face
            0x1f97b === code || // E12.0  [1] (🥻)       sari
            (0x1f97c <= code && code <= 0x1f97f) || // E11.0  [4] (🥼..🥿)    lab coat..flat shoe
            (0x1f980 <= code && code <= 0x1f984) || // E1.0   [5] (🦀..🦄)    crab..unicorn
            (0x1f985 <= code && code <= 0x1f991) || // E3.0  [13] (🦅..🦑)    eagle..squid
            (0x1f992 <= code && code <= 0x1f997) || // E5.0   [6] (🦒..🦗)    giraffe..cricket
            (0x1f998 <= code && code <= 0x1f9a2) || // E11.0 [11] (🦘..🦢)    kangaroo..swan
            (0x1f9a3 <= code && code <= 0x1f9a4) || // E13.0  [2] (🦣..🦤)    mammoth..dodo
            (0x1f9a5 <= code && code <= 0x1f9aa) || // E12.0  [6] (🦥..🦪)    sloth..oyster
            (0x1f9ab <= code && code <= 0x1f9ad) || // E13.0  [3] (🦫..🦭)    beaver..seal
            (0x1f9ae <= code && code <= 0x1f9af) || // E12.0  [2] (🦮..🦯)    guide dog..white cane
            (0x1f9b0 <= code && code <= 0x1f9b9) || // E11.0 [10] (🦰..🦹)    red hair..supervillain
            (0x1f9ba <= code && code <= 0x1f9bf) || // E12.0  [6] (🦺..🦿)    safety vest..mechanical leg
            0x1f9c0 === code || // E1.0   [1] (🧀)       cheese wedge
            (0x1f9c1 <= code && code <= 0x1f9c2) || // E11.0  [2] (🧁..🧂)    cupcake..salt
            (0x1f9c3 <= code && code <= 0x1f9ca) || // E12.0  [8] (🧃..🧊)    beverage box..ice
            0x1f9cb === code || // E13.0  [1] (🧋)       bubble tea
            0x1f9cc === code || // E0.0   [1] (🧌)       <reserved-1F9CC>
            (0x1f9cd <= code && code <= 0x1f9cf) || // E12.0  [3] (🧍..🧏)    person standing..deaf person
            (0x1f9d0 <= code && code <= 0x1f9e6) || // E5.0  [23] (🧐..🧦)    face with monocle..socks
            (0x1f9e7 <= code && code <= 0x1f9ff) || // E11.0 [25] (🧧..🧿)    red envelope..nazar amulet
            (0x1fa00 <= code && code <= 0x1fa6f) || // E0.0 [112] (🨀..🩯)    NEUTRAL CHESS KING..<reserved-1FA6F>
            (0x1fa70 <= code && code <= 0x1fa73) || // E12.0  [4] (🩰..🩳)    ballet shoes..shorts
            0x1fa74 === code || // E13.0  [1] (🩴)       thong sandal
            (0x1fa75 <= code && code <= 0x1fa77) || // E0.0   [3] (🩵..🩷)    <reserved-1FA75>..<reserved-1FA77>
            (0x1fa78 <= code && code <= 0x1fa7a) || // E12.0  [3] (🩸..🩺)    drop of blood..stethoscope
            (0x1fa7b <= code && code <= 0x1fa7f) || // E0.0   [5] (🩻..🩿)    <reserved-1FA7B>..<reserved-1FA7F>
            (0x1fa80 <= code && code <= 0x1fa82) || // E12.0  [3] (🪀..🪂)    yo-yo..parachute
            (0x1fa83 <= code && code <= 0x1fa86) || // E13.0  [4] (🪃..🪆)    boomerang..nesting dolls
            (0x1fa87 <= code && code <= 0x1fa8f) || // E0.0   [9] (🪇..🪏)    <reserved-1FA87>..<reserved-1FA8F>
            (0x1fa90 <= code && code <= 0x1fa95) || // E12.0  [6] (🪐..🪕)    ringed planet..banjo
            (0x1fa96 <= code && code <= 0x1faa8) || // E13.0 [19] (🪖..🪨)    military helmet..rock
            (0x1faa9 <= code && code <= 0x1faaf) || // E0.0   [7] (🪩..🪯)    <reserved-1FAA9>..<reserved-1FAAF>
            (0x1fab0 <= code && code <= 0x1fab6) || // E13.0  [7] (🪰..🪶)    fly..feather
            (0x1fab7 <= code && code <= 0x1fabf) || // E0.0   [9] (🪷..🪿)    <reserved-1FAB7>..<reserved-1FABF>
            (0x1fac0 <= code && code <= 0x1fac2) || // E13.0  [3] (🫀..🫂)    anatomical heart..people hugging
            (0x1fac3 <= code && code <= 0x1facf) || // E0.0  [13] (🫃..🫏)    <reserved-1FAC3>..<reserved-1FACF>
            (0x1fad0 <= code && code <= 0x1fad6) || // E13.0  [7] (🫐..🫖)    blueberries..teapot
            (0x1fad7 <= code && code <= 0x1faff) || // E0.0  [41] (🫗..🫿)    <reserved-1FAD7>..<reserved-1FAFF>
            (0x1fc00 <= code && code <= 0x1fffd) // E0.0[1022] (🰀..🿽)    <reserved-1FC00>..<reserved-1FFFD>
        ) {
            return boundaries_1.EXTENDED_PICTOGRAPHIC;
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
/******/ 		if(__webpack_module_cache__[moduleId]) {
/******/ 			return __webpack_module_cache__[moduleId].exports;
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
/******/ 				() => module['default'] :
/******/ 				() => module;
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
/******/ 		__webpack_require__.o = (obj, prop) => Object.prototype.hasOwnProperty.call(obj, prop)
/******/ 	})();
/******/ 	
/************************************************************************/
(() => {
"use strict";
/* harmony import */ var lru_cache__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(593);
/* harmony import */ var lru_cache__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(lru_cache__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var arrive__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(640);
/* harmony import */ var arrive__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(arrive__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var graphemer__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(777);
/* harmony import */ var graphemer__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(graphemer__WEBPACK_IMPORTED_MODULE_2__);



/**
 * This determines timeout of how long will fast chat cache keep recent messages.
 * The default is 1.5 seconds. This defends against all the LULW and Pog avalanches
 * that sometimes happen in large Twitch channel chats.
 */

const FAST_CHAT_CACHE_TIMEOUT = 2500;
/**
 * Unlimitted cache size for fast messages.
 */

const FAST_CHAT_CACHE_SIZE = 0;
/**
 * This determines timeout of how long will long messages / copy-pastas be kept in cache.
 */

const LONG_CHAT_CACHE_TIMEOUT = 60000;
/**
 * Unlimitted cache size for long messages.
 */

const LONG_CHAT_CACHE_SIZE = 0;
/**
 * This determines what is considered a long message / copy-pasta.
 */

const LONG_CHAT_THRESHOLD_LENGTH = 150;
console.log('Starting Sane chat cleanup');
const CHAT_SEL = '.chat-list__list-container, .chat-scrollable-area__message-container';
const CHAT_LINE_SEL = '.chat-line__message';
const SPACE_NORM_RE = /([\s])[\s]+/gu;
const BRAILLE_RE = /^[\u{2800}-\u{28FF}]+$/u; // This RegExp is used to replace text added by BTTV extension with just the emote name.

const STRIP_BTTV_TEXT_RE = /(?:^|\s)(\S+)(?:\r\n?|\n)Channel: \S+(?:\r\n?|\n)\S+ Channel Emotes(?:\r\n?|\n)\1(?:$|\s)/gum;
let prevMessage;
const fastChatCache = new (lru_cache__WEBPACK_IMPORTED_MODULE_0___default())({
  max: 0,
  maxAge: 2500,
  length: () => 1
});
const longChatCache = new (lru_cache__WEBPACK_IMPORTED_MODULE_0___default())({
  max: 0,
  maxAge: 60000,
  length: () => 1
});
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

async function hideNode(msgNode) {
  msgNode.style.color = '#ff0000';
  const animEffects = new KeyframeEffect(msgNode, HIDE_MESSAGE_KEYFRAMES, HIDE_MESSAGE_ANIM_OPTS);
  const anim = new Animation(animEffects, document.timeline);

  anim.onfinish = () => {
    msgNode.style.display = 'none';
  };

  anim.play();
}

function evaluateMessage(combinedMessage, msgNode) {
  if (!combinedMessage) {
    return;
  } // Filter repeated messages.


  if (combinedMessage === prevMessage) {
    console.log('Hiding repeated message: ' + combinedMessage);
    hideNode(msgNode);
    return;
  }

  prevMessage = combinedMessage; // Filter messages with Braille symbols only.

  if (BRAILLE_RE.test(combinedMessage)) {
    console.log('Hiding Braille only message: ' + combinedMessage);
    hideNode(msgNode);
    return;
  } // Filter chat messages which repeat the same text in very short time.
  // See FAST_CHAT_CACHE_TIMEOUT.


  const factCachedNode = fastChatCache.get(combinedMessage);

  if (factCachedNode !== undefined) {
    console.log('Hiding message present in fast chat cache: ' + combinedMessage);
    hideNode(msgNode);
    return;
  }

  fastChatCache.set(combinedMessage, msgNode); // Filter long chat messages which repeat within longer period of time.

  const combinedMessageLength = SPLITTER.countGraphemes(combinedMessage);

  if (combinedMessageLength >= LONG_CHAT_THRESHOLD_LENGTH) {
    const longCachedNode = longChatCache.get(combinedMessage);

    if (longCachedNode !== undefined) {
      console.log('Hiding long message / copy-pasta present in long chat cache: ' + combinedMessage);
      hideNode(msgNode);
      return;
    }

    longChatCache.set(combinedMessage, msgNode);
  }
}

document.arrive(".chat-list__list-container, .chat-scrollable-area__message-container", chatNode => {
  console.log('Sane chat cleanup is enabled.');
  chatNode.arrive(CHAT_LINE_SEL, msgNode => {
    const xpathResult = document.evaluate("descendant::div[contains(@class,\"chat-line__message--emote-button\")]/span//img | descendant::a[contains(@class,\"link-fragment\")] | descendant::span[contains(@class,\"text-fragment\") or contains(@class,\"mention-fragment\")]//div[contains(@class,\"bttv-emote\")]/img | descendant::span[contains(@class,\"text-fragment\") or contains(@class,\"mention-fragment\")]", msgNode, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
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
    console.log('combined message: ' + combinedMessage);
    evaluateMessage(combinedMessage, msgNode);
  });
});
})();

/******/ })()
;
//# sourceMappingURL=index.js.map