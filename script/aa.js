/*global window, console, document, navigator, setTimeout, setInterval, clearInterval, soundManager */
/*jslint nomen: true, plusplus: true, todo: true, vars: true, white: true */

(function armorAlley(window) {

"use strict";

/*

	   MMM   MMMM?MN   ZMMMM  MMMMM  MMMM  MMMMMMMM       MMM   MMMMMM   MMMMMM   MMMM MMM MMMM MMMM       
	  MMMM   DMMM+MMM  $MMMM  MMMM MMMMMMMD MMMM MMM      MMMM   MMMM     MMMM     MMM NMM MMMM DMN        
	  MMMM    MMM MMM:  MMMM  MMMM MMM  MMM MMMM MMM     MMMMM   MMMM     MMMM     MMM  MM  MMM =M         
	  MMMMM   MMM MMMM  MMMMMMMMMM MMM  MMM MMMM MMM     MNMMM   MMMM     MMMM     MMM      MMMM~M         
	  MMMMM   MMM MMM:  MMMMMMMMMM MMM  MMM MMMM MMM     M7MMM   MMMM     MMMM     MMM MM    MMMM          
	 MM MMM   MMM?MM    MMMMN MMMM MMM  MMM MMMM MM     8M MMM   MMMM     MMMM     MMMMMM    MMMM          
	 MM MMMN  MMM?MMM   MMMM  MMMM MMM  MMM MMMMMMMM    MM MMMM  MMMM     MMMM     MMM MM    MMMM          
	 M MMMMN  MMM MMMM  MMMM  MMMM MMM  MMM MMMM MMM    MMNMMMM  MMMM   M MMMM   M MMM       MMMM          
	8M  MMMM  MMM MMMM  MMMM  MMMM MMM  MMM MMMM MMM    M  MMMM  MMMM  MM MMMM  MM MMM  MM   MMMM          
	MM  MMMM DMMM7MMMMM MMMM  MMMM  MMMMMM  MMMM MMMM  DMD MMMMM MMMMNMMM MMMMNMMM MMM MMM   MMMM          
	MM  MMMM MMMM$ MMM  MMMM  MMMM    MM    MMMM  MN   MMM MMMMM MMMMMMM  MMMMMMM MMMM MMM   MMMM          

	A browser-based interpretation of the MS-DOS release of Armor Alley.

	Original game Copyright (C) 1989 - 1991 Information Access Technologies.
	http://en.wikipedia.org/wiki/Armor_alley

	Images, text and other portions of the original game used with permission under an ISC license.
	Original sound effects could not be re-licensed; modern replacements used from freesound.org.

	http://www.schillmania.com/armor-alley/
	http://www.schillmania.com/content/entries/2013/armor-alley-web-prototype/
	http://github.com/scottschiller/ArmorAlley/

	General disclaimer: This is a fun personal side project. The code could be tightened up a bit.

  Changelog / Revision History

  + 09/2015

   + "Extreme" game mode
    • Higher enemy convoy production rate.
    • Turrets fire at a faster rate.
    • Twin enemy turrets near mid-field.
    • Turrets fire at ground vehicles and smart missiles. Infantry and engineers are not targeted, but can be hit.
    • Owning all bunkers does not halt enemy production.
    
   + Miscellaneous
    • Fix for "negative look-ahead" case - enemy Super Bunker now fires at helicopter on both sides.
    • `Math.abs()` checks on distance for missile launchers
    • Fixed Bunker and Super Bunker vertical alignment / collision detection with helicopter
    • Infantry will not be picked up when the helicopter is on a landing pad and repairing.
    • Shrapnel shows on radar.
    • Background color fixed on bullet and missile "spark" graphic.

  + 08/2014

   + Sound events / sound effects
    • Wrench and related sounds on helicopter repair/refuel, balloon repair, turret claiming/rebuilding/repair
    • Violin notes for friendly capture events: bunker, turret etc. (C5). Enemy note is C4.
    • "Pop" / "vacuum" sounds for infantry pick up + deployment, and turret restoration
    • Door close for passing infantry entering bunkers
    • Splat for infantry and engineer kills
    • Crash-and-glass for bunker explosions
    • Heavy/light impact sounds for bullets hitting metal (tanks) and other structures (bunkers)
    • Turrets audibly "break" when destroyed.

   + Game logic / rules
    • Turret gunfire can now hit infantry, regular bunkers and Super Bunkers. However, only tank gunfire can hit Super Bunkers for damage.
    • For "easy" game mode, turrets now fire at half the previous rate.

   + UI / design
    • Arrows on bunkers now animate to the right/left when claimed by friendly/enemy infantry.

   + Miscellaneous
    • Sound arrays (i.e., 5 bullet/metal sounds) shuffle on each rotation, reducing chance of repetitiveness.
    • Upped turret gunfire sound array, possibly reduce cloning of Audio() in heavy fire cases.
    • Infantry build "faster" now, so they are more closely grouped together (in units of five.)
    • Shrapnel now rotates using CSS animations, rotation direction determined randomly.
    • In tutorial mode, disarm user-armed Super Bunker so it doesn't accidentally kill Missile Launchers that later show up.
    • Fixed enemy infantry + engineer die animation to be bottom-aligned.

  + 07/2014

   • Safari 7.1 and 8 (OS X 10.10/Yosemite preview) still have HTML5 audio jank bug, thus prefer Flash. https://bugs.webkit.org/show_bug.cgi?id=116145
   • Opacity fade on edge of game tips.
   • Font legibility tweaks.
   
  + 04/2014
  
   • "Hard" game option, comparable to original game's level 9.
   • Gunfire and shrapnel now shows up on radar.
   • Enemy unit production halts when all bunkers are friendly / player-owned.
   • Heat-seeking rubber chickens (launched with C key.)
   • Turret gunfire can hit tanks, vans and missile launchers in "hard" mode. Protip: Don't approach turrets from low angles.

	+ 03/2014
	
   • Added "Super Bunkers" (pillbox bunkers) http://en.wikipedia.org/wiki/Armor_alley#Terrain_elements

	Original release: Version 1.0.20131031

*/

  var game, utils, common;

  // TODO: revisit why precision sucks in FPS targeting (eg., 24 doesn't work - ends up being 20 or 30?)

  var FPS = 30;
  var FPS_IDEAL = 30;

  var FRAMERATE = 1000/FPS;

  var winloc = window.location.href.toString();

  var ua = navigator.userAgent;

  // just in case...
  var console = (window.console || { log: function(){ return; } });

  var noJamming = winloc.match(/nojam/i);

  // IE 9 doesn't like some of the bigger transforms, for some reason.
  var noTransform = (winloc.match(/notransform/i) || (ua.match(/msie 9|opera/i) && !winloc.match(/usetransform/i)));

  /**
   * Evil tricks needed because Safari 6 (and Webkit nightly)
   * scale text after rasterization - thus, there's an option
   * to use document.body.style.zoom vs. transform: scale3d()
   * which renders text cleanly. Both have minor quirks.
   * force-enable transform under Safari 6 w/ #forcescaling=1
   */

  var isWebkit = ua.match(/webkit/i);
  var isChrome = (isWebkit && ua.match(/chrome/i));
  var isFirefox = ua.match(/firefox/i);
  var isSafari = (isWebkit && !isChrome && ua.match(/safari/i));
  var isOldIE = (navigator.userAgent.match(/MSIE [6-8]/i));

  var useParallax = winloc.match(/parallax/i);

  var trackEnemy = winloc.match(/trackenemy/i);

  var debug = winloc.match(/debug/i);

  var showHealth = winloc.match(/health/i);

  // whether to always "upgrade" Smart Missiles...
  var forceRubberChicken = winloc.match(/chicken/i);

  var deg2Rad = 180/Math.PI;

  // used for various measurements in the game
  var worldHeight = 380;

  var battleOver = false;

  var productionHalted = false;

  var canHideLogo = false;

  var logoHidden = false;

  var keyboardMonitor;

  var features;

  var getAnimationFrame;

  // TODO: move into view
  var screenScale = 1;

  var forceScaling = !!(winloc.match(/forcescal/i));

  var disableScaling = !!(!forceScaling && winloc.match(/noscal/i));

  var userDisabledScaling = false;

  var userDisabledSound = false;

  var tutorialMode = !!(winloc.match(/tutorial/i));

  var gameType;

  var convoyParam = winloc.toLowerCase().indexOf('convoydelay');

  // how often the enemy attempts to build convoys
  var convoyDelay = 60;

  var Tutorial;

  var TutorialStep;

  var FrameTimeout;

  var Queue;

  var Tank, Van, Infantry, ParachuteInfantry, Engineer, MissileLauncher, SmartMissile, Helicopter, Bunker, EndBunker, SuperBunker, Balloon, Chain, Base, Cloud, LandingPad, Turret, Smoke, Shrapnel, GunFire, Bomb, Radar, Inventory;

  var shrapnelExplosion;

  var GameLoop;

  var View;

  var prefs;

  var sounds;

  var stats;

  function statsStructure() {
    return {
      'bullet': 0,
      'balloon': 0,
      'bunker': 0,
      'missile-launcher': 0,
      'gunfire': 0,
      'tank': 0,
      'van': 0,
      'infantry': 0,
      'engineer': 0,
      'helicopter': 0,
      'smart-missile': 0,
      'bomb': 0,
      'shrapnel': 0,
      'turret': 0
    };
  }

  function Stats() {
    
    var dom, data, dirty, exports;

    function normalizeObj(obj) {
      if (obj && !obj.data && obj.oParent) {
        obj = obj.oParent;
      }
      return obj;      
    }

    function normalizeType(obj) {
      var type = obj.data.type;
      // special case: infantry -> engineer
      if (obj.data.type === 'infantry' && obj.data.role) {
        type = 'engineer';
      }
      return type;
    }

    function create(obj) {
      var dataObj, type;
      obj = normalizeObj(obj);
      type = normalizeType(obj);
      dataObj = data[obj.data.isEnemy ? 'enemy' : 'player'].created;
      if (dataObj[type] !== undefined) {
        dataObj[type]++;
        dirty = true;
        refreshStats();
      }
    }
    
    function destroy(obj) {
      // there might be no data, so go up the chain.
      var dataObj, type;
      obj = normalizeObj(obj);
      type = normalizeType(obj);
      dataObj = data[obj.data.isEnemy ? 'enemy' : 'player'].destroyed;
      if (dataObj[type] !== undefined) {
        dataObj[type]++;
        dirty = true;
        refreshStats();
      }
    }

    function markEnd() {
      data.time.end = new Date();
    }

    function showStats() {
      var stats = document.getElementById('stats');
    }

    function refreshStats() {
      if (!dirty) {
        return;
      }
      var i, j, items, count, cols, type, percent;
      items = document.getElementById('stats').getElementsByClassName('item');
      for (i=0, j=items.length; i<j; i++) {
        type = items[i].getAttribute('data-type');
        if (type) {
          cols = items[i].getElementsByClassName('count');
          if (cols[0]) {
            count = Math.max(0, data.player.created[type] - data.player.destroyed[type]) || 0;
            // cols[0].childNodes[0].innerHTML = (data.player.destroyed[type] && count ? '<span class="of-count">' + count + ' / </span>' : '') + data.player.created[type];
            // count = Math.max(0, data.player.created[type]);
            cols[0].childNodes[0].textContent = count;
          }
          if (cols[1]) {
            count = Math.max(0, data.enemy.created[type] - data.enemy.destroyed[type]) || 0;
            // cols[1].childNodes[0].innerHTML = (data.enemy.destroyed[type] && count ? '<span class="of-count">' + count + ' / </span>' : '') + data.enemy.created[type];
            // count = Math.max(0, data.enemy.created[type]);
            cols[1].childNodes[0].textContent = count;
          }
          if (cols[0] && (data.player.created[type] || data.player.destroyed[type])) {
            percent = (data.player.destroyed[type] / data.player.created[type]) * 100;
            cols[0].getElementsByClassName('bar')[0].style.width = (100 - percent) + '%';
          }
          if (cols[1] && (data.enemy.created[type] || data.enemy.destroyed[type])) {
            percent = (data.enemy.destroyed[type] / data.enemy.created[type]) * 100;
            cols[1].getElementsByClassName('bar')[0].style.width = (100 - percent) + '%';
          }
        }
      }
      dirty = false;
    }

    function displayEndGameStats() {
      var i, j, k, items, count, cols, type, percent, offset, dataSource;
      items = document.getElementById('stats-endgame').getElementsByTagName('tr');
      // data sources
      dataSource = [data.player.destroyed, data.enemy.destroyed];
      offset = 1;
      for (i=0, j=items.length; i<j; i++) {
        type = items[i].getAttribute('data-type');
        if (type) {
          cols = items[i].getElementsByTagName('td');
          for (k=0; k<2; k++) {
            if (cols[k+offset]) {
              cols[k+offset].childNodes[0].textContent = dataSource[k][type];
            }
          }
        }
      }
      document.getElementById('stats-endgame').style.display = 'block';
    }

    function initStats() {
      var stats = document.getElementById('stats');
      var i, j, counts;
      counts = stats.getElementsByClassName('count');
      for (i=0, j=counts.length; i<j; i++) {
        // counts[i].appendChild(div.cloneNode(true));
        counts[i].innerHTML = '<span class="count-wrapper">' + counts[i].innerHTML + '</span><div class="bar"></div>';
      }
      // window.setInterval(refreshStats, 1000);
    }

    data = {
      time: {
        start: new Date(),
        end: null
      },
      player: {
        created: statsStructure(),
        destroyed: statsStructure()
      },
      enemy: {
        created: statsStructure(),
        destroyed: statsStructure()
      }
    };
    
    dom = {
      barTemplate: document.createElement('div'),
      bars: []
    };

    dom.barTemplate.className = 'bar';

    exports = {
      data: data,
      create: create,
      destroy: destroy,
      markEnd: markEnd,
      refreshStats: refreshStats,
      displayEndGameStats: displayEndGameStats
    };

    initStats();
  
    return exports;

  };

  function updateScreenScale() {

    if (disableScaling) {

      return false;

    }

    if (userDisabledScaling) {

      screenScale = 1;

    } else {

      screenScale = (isOldIE ? 1 : window.innerHeight / 460);

    }

  }

  function applyScreenScale() {

    if (disableScaling) {

      return false;

    }

    // Safari 6.0.5 (as of 10/2013) scales text after rasterizing via transform: scale3d(), thus it looks crap. Using document.body.zoom is OK, however.
    // Force-enable transform-based scaling with #forcescaling=1

    if (features.transform.prop && (!isSafari || forceScaling)) {

      // newer browsers can do this.

      // TODO: dom.worldWrapper
      document.getElementById('world-wrapper').style.marginTop = -((384 / 2) * screenScale) + 'px';
      document.getElementById('world-wrapper').style.width = Math.floor((window.innerWidth || document.body.clientWidth) * (1/screenScale)) + 'px';
      document.getElementById('world-wrapper').style[features.transform.prop + 'Origin'] = '0px 0px';
      document.getElementById('world-wrapper').style[features.transform.prop] = 'scale3d(' + screenScale + ', ' + screenScale + ', 1)';

      // TODO: Sort out + resolve Chrome "blurry font" (rasterization?) issue. Text generally re-renders OK when resizing smaller.

    } else if (!isOldIE) {

      // Safari 6 + Webkit nightlies (as of 10/2013) scale text after rasterizing, so it looks bad. This method is hackish, but text scales nicely.
      // Additional note: this won't work in Firefox.
      document.body.style.zoom = parseInt(screenScale * 100, 10) + '%';

    }

  }

  utils = {

    array: (function() {

      function compare(property) {

        var result;

        return function(a, b) {

          if (a[property] < b[property]) {
            result = -1;
          } else if (a[property] > b[property]) {
            result = 1;
          } else {
            result = 0;
          }
          return result;
        };

      }

      function shuffle(array) {

        // Fisher-Yates shuffle algo

        var i, j, temp;

        for (i = array.length - 1; i > 0; i--) {
          j = Math.floor(Math.random() * (i+1));
          temp = array[i];
          array[i] = array[j];
          array[j] = temp;
        }

        return array;

      }

      return {
        compare: compare,
        shuffle: shuffle
      };

    }()),

    css: (function() {

      function hasClass(o, cStr) {

        return (o.className !== undefined ? new RegExp('(^|\\s)' + cStr + '(\\s|$)').test(o.className) : false);

      }

      function addClass(o, cStr) {

        if (!o || !cStr || hasClass(o, cStr)) {
          return false; // safety net
        }
        o.className = (o.className ? o.className + ' ' : '') + cStr;

      }

      function removeClass(o, cStr) {

        if (!o || !cStr || !hasClass(o, cStr)) {
          return false;
        }
        o.className = o.className.replace(new RegExp('( ' + cStr + ')|(' + cStr + ')', 'g'), '');

      }

      function swapClass(o, cStr1, cStr2) {

        var tmpClass = {
          className: o.className
        };

        removeClass(tmpClass, cStr1);
        addClass(tmpClass, cStr2);

        o.className = tmpClass.className;

      }

      function toggleClass(o, cStr) {

        (hasClass(o, cStr) ? removeClass : addClass)(o, cStr);

      }

      return {
        has: hasClass,
        add: addClass,
        remove: removeClass,
        swap: swapClass,
        toggle: toggleClass
      };

    }()),

    events: (function() {

      var add, remove, preventDefault;

      add = (window.addEventListener !== undefined ? function(o, evtName, evtHandler) {
        return o.addEventListener(evtName, evtHandler, false);
      } : function(o, evtName, evtHandler) {
        o.attachEvent('on' + evtName, evtHandler);
      });

      remove = (window.removeEventListener !== undefined ? function(o, evtName, evtHandler) {
        return o.removeEventListener(evtName, evtHandler, false);
      } : function(o, evtName, evtHandler) {
        return o.detachEvent('on' + evtName, evtHandler);
      });

      preventDefault = function(e) {
        if (e.preventDefault) {
          e.preventDefault();
        } else {
          e.returnValue = false;
          e.cancelBubble = true;
        }
      };

      return {
        add: add,
        preventDefault: preventDefault,
        remove: remove
      };

    }()),

    storage: (function() {

      var exports,
          data,
          localStorage;

      data = {};

      // try ... catch because even referencing localStorage can cause a security exception.

      try {
        localStorage = window.localStorage || null;
      } catch(e) {
        console.log('localStorage not present, or denied');
        localStorage = null;
      }

      function get(name) {

        if (!localStorage) {
          return;
        }

        try {
          data[name] = localStorage.getItem(name);
        } catch(ignore) {
          // oh well
        }

        return data[name];

      }

      function set(name, value) {

        data[name] = value;

        if (!localStorage) {
          return;
        }

        try {
          localStorage.setItem(name, value);
        } catch(err) {
          // oh well
          return false;
        }

        return true;

      }

      function remove(name) {

        delete data[name];

        if (!localStorage) {
          return;
        }

        try {
          localStorage.removeItem(name);
        } catch(ignore) {
          // oh well
        }

      }

      // sanity check: try to read a value.
      try {
        get('testLocalStorage');
      } catch(e) {
        console.log('localStorage read test failed. Disabling.');
        localStorage = null;
      }

      exports = {
        get: get,
        set: set,
        remove: remove        
      };

      return exports;
        
    }())


  };

  function removeNode(node) {

    // hide immediately
    node.style.display = 'none';

    game.objects.queue.add(function() {
      node.parentNode.removeChild(node);
      node = null;
    });

  }

  function removeNodeArray(nodeArray) {

    var i, j;

    for (i=0; i<j; i++) {
      nodeArray[i].style.display = 'none';
    }

    game.objects.queue.add(function() {

      // this is going to invalidate layout, and that's expensive. set display: none first, maybe minimize damage.
      // TODO: Put these in a queue, and do own "GC" of nodes every few seconds or something.

      j = nodeArray.length;

      // separate loop to hide first?
      /*
      for (i=0; i<j; i++) {
        nodeArray[i].style.display = 'none';
      }
      */

      for (i=0; i<j; i++) {
        // TESTING: Does manually-removing transform before node removal help with GC? (apparently not.)
        // Chrome issue: https://code.google.com/p/chromium/issues/detail?id=304689
        // nodeArray[i].style[features.transform.prop] = 'none';
        nodeArray[i].parentNode.removeChild(nodeArray[i]);
        nodeArray[i] = null;
      }

    });

  }

  function removeNodes(dom) {

    // remove all nodes in a structure
    var item;

    for (item in dom) {
      if (dom.hasOwnProperty(item) && dom[item]) {
        // node reference, or array of nodes?
        if (dom[item] instanceof Array) {
          removeNodeArray(dom[item]);
        } else {
          // display: none - possibly prevent layout invalidation before removal?
          // dom[item].style.display = 'none';
          // undo transform?
          /*
          if (features.transform.prop) {
            dom[item].style[features.transform.prop] = 'none';
          }
          */
          /*
          // reset className?
          dom[item].className = '';
          */
          removeNode(dom[item]);
          // dom[item].parentNode.removeChild(dom[item]);
        }
        dom[item] = null;
      }
    }

  }

  function mixin(oMain, oAdd) {

    // non-destructive merge
    var o1 = (oMain || {}), o2, o;

    // if unspecified, o2 is the default options object
    o2 = (oAdd === undefined ? {} : oAdd);

    for (o in o2) {

      if (o2.hasOwnProperty(o)) {

        if (typeof o2[o] !== 'object' || o2[o] === null || o2[o] === undefined || o2[o] instanceof Array) {

          // assign directly
          o1[o] = o2[o];

        } else {

          // recurse through o2
          o1[o] = mixin(o1[o], o2[o]);

        }

      }

    }

    o2 = null;

    return o1;

  }

  function stopEvent(e) {

    var evt = e || window.event;

    if (evt.preventDefault !== undefined) {

      evt.preventDefault();

    } else {

      evt.cancelBubble = true;

    }

    return false;

  }

  var testDiv = document.createElement('div');

  features = (function() {

    var _getAnimationFrame;

    /**
     * hat tip: paul irish
     * http://paulirish.com/2011/requestanimationframe-for-smart-animating/
     * https://gist.github.com/838785
     */

    var _animationFrame = (window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        null);

    // apply to window, avoid "illegal invocation" errors in Chrome
    _getAnimationFrame = _animationFrame ? function() {
      return _animationFrame.apply(window, arguments);
    } : null;

    if (_getAnimationFrame) {
      if (winloc.match(/noraf=1/i)) {
        _getAnimationFrame = null;
        console.log('preferring setInterval for game loop');
      } else {
        console.log('preferring requestAnimationFrame for game loop');
      }
    }

    var transform, styles, prop;

    function has(prop) {

      // test for feature support
      var result = testDiv.style[prop];
      return (result !== undefined ? prop : null);

    }

    // note local scope.
    var localFeatures = {

      transform: {
        ie:  has('-ms-transform'),
        moz: has('MozTransform'),
        opera: has('OTransform'),
        webkit: has('webkitTransform'),
        w3: has('transform'),
        prop: null // the normalized property value
      },

      rotate: {
        has3D: false,
        prop: null
      },

      getAnimationFrame: _getAnimationFrame

    };

    localFeatures.transform.prop = (
      localFeatures.transform.w3 || 
      localFeatures.transform.moz ||
      localFeatures.transform.webkit ||
      localFeatures.transform.ie ||
      localFeatures.transform.opera
    );

    function attempt(style) {

      try {
        testDiv.style[transform] = style;
      } catch(e) {
        // that *definitely* didn't work.
        return false;
      }
      // if we can read back the style, it should be cool.
      return !!testDiv.style[transform];

    }

    if (localFeatures.transform.prop) {

      // try to derive the rotate/3D support.
      transform = localFeatures.transform.prop;
      styles = {
        css_2d: 'rotate(0deg)',
        css_3d: 'rotate3d(0,0,0,0deg)'
      };

      if (attempt(styles.css_3d)) {
        localFeatures.rotate.has3D = true;
        prop = 'rotate3d';
      } else if (attempt(styles.css_2d)) {
        prop = 'rotate';
      }

      localFeatures.rotate.prop = prop;

    }

    console.log('user agent feature test:', localFeatures);

    console.log('requestAnimationFrame() is' + (localFeatures.getAnimationFrame ? '' : ' not') + ' enabled');

    if (localFeatures.transform.prop) {
      if (noTransform) {
        console.log('transform support present, disabling via URL parameter');
        localFeatures.transform.prop = null;
      } else {
        console.log('using transforms for parallax, rotation and some positioning.');
      }
    }

    testDiv = null;

    return localFeatures;

  }());

  getAnimationFrame = features.getAnimationFrame || function(callback) {
    callback();
  };

  function updateEnergy(object) {

    if (!showHealth) {
      return false;
    }

    var nodes,
        node,
        energy;

    if (document.querySelectorAll && object.dom && object.dom.o) {
      nodes = object.dom.o.querySelectorAll('.energy');
    }

    if (nodes && nodes.length) {
      node = nodes[0];
    }

    if (node) {
      energy = (object.data.energy / object.data.energyMax) * 100;
      if (!isNaN(energy)) {
        node.style.opacity = (energy < 100 ? 1 : 0);
        if (energy > 66) {
          node.style.backgroundColor = '#33cc33';
        } else if (energy > 33) {
          node.style.backgroundColor = '#cccc33';
        } else {
          node.style.backgroundColor = '#cc3333';
        }
        node.style.width = (energy+ '%');
      }
    }

  }

  common = {

    defaultCSS: {
      dead: 'dead',
      enemy: 'enemy',
      exploding: 'exploding'
    },

    setX: function(exports, x) {

      if (exports && exports.dom) {
        exports.dom.o.style.left = (x + 'px');
      }

    },

    setY: function(exports, y) {

      if (exports && exports.dom) {
        exports.dom.o.style.top = (y + 'px');
      }

    },

    setXY: function(exports, x, y) {

      if (exports && exports.dom) {
        exports.dom.o.style.left = (x + 'px');
        exports.dom.o.style.top = (y + 'px');
      }

    },

    setBalloonXY: function(exports, bottomY) {

      if (exports && exports.dom) {

        if (features.transform.prop) {

          // top-based Y offset, including bunker / balloon offset
          common.setTransformXY(exports.dom.o, exports.data.x + 'px', worldHeight - (280 * bottomY / 100) - 12 + 'px');

        } else {

          common.setBottomY(exports, bottomY);

        }

      }

    },

    setBottomY: function(exports, bottomY) {

      if (exports && exports.dom) {
        exports.dom.o.style.bottom = ((280 * bottomY / 100) + 'px');
      }

    },

    setBottomYPixels: function(exports, bottomY) {

      if (exports && exports.dom) {
        exports.dom.o.style.bottom = (bottomY + 'px');
      }

    },

    setTransformXY: function(o, x, y) {

      if (o) {
        if (features.transform.prop) {
          o.style[features.transform.prop] = 'translate3d(' + x + ', ' + y +', 0px)';
        } else {
          o.style.left = x;
          o.style.top = y;
        }
      }
    },

    hit: function(target, hitPoints, attacker) {

      if (!target.data.dead) {

        /**
         * special case: super-bunkers can only be damaged by tank gunfire.
         * other things can hit super-bunkers, but we don't want damage done in this case.
         */

        if (target.data.type === 'super-bunker') {
          if (!attacker || !attacker.data || !attacker.data.parentType || attacker.data.parentType !== 'tank') {
            return false;
          }
        }

        hitPoints = hitPoints || 1;

        target.data.energy = Math.max(0, target.data.energy - hitPoints);

        // special cases for updating state
        if (target.updateHealth) {
          target.updateHealth();
        }

        // for debugging / fun
        updateEnergy(target);

        if (target.data.energy <= 0) {

          target.data.energy = 0;

          if (target.die) {
            target.die();
          }

        }

      }

    }

  };

  function bottomAlignedY(y) {

    // correct bottom-aligned Y value
    return 370 - 2 - (y || 0);

  }

  function makeSprite(options) {

    var o, o2, frag;

    o = document.createElement('div');

    o.className = 'sprite ' + options.className;

    if (debug) {
      o.innerHTML = options.className.replace(/sub\-sprite/i, '');
      o.style.fontSize = 6 + (1/screenScale) + 'px';
    }

    if (showHealth && options.className.match(/missilelauncher|tank|van|infantry|engineer|balloon|helicopter|bunker|turret/i)) {

      frag = document.createDocumentFragment();

      o2 = document.createElement('div');
      o2.className = 'energy-status energy-bg';
      frag.appendChild(o2);

      o2 = document.createElement('div');
      o2.className = 'energy-status energy';

      frag.appendChild(o2);

      o.appendChild(frag);

    }

    return o;

  }

  function makeSubSprite(extraClass) {

    return makeSprite({
      className: 'sub-sprite' + (extraClass ? ' ' + extraClass : '')
    });

  }

  function addItem(className, x) {

    var node = makeSprite({
      className: className
    });

    if (x) {

      if (features.transform.prop) {
        // MOAR GPU
        common.setTransformXY(node, x + 'px', '0px');
      } else {
        node.style.left = x + 'px';
      }

    }

    game.dom.world.appendChild(node);

    return node;

  }

  function inheritCSS(options) {

    // var defaults;

    options = options || {};

    if (options.dead === undefined) {
      options.dead = common.defaultCSS.dead;
    }

    if (options.enemy === undefined) {
      options.enemy = common.defaultCSS.enemy;
    }

    if (options.exploding === undefined) {
      options.exploding = common.defaultCSS.exploding;
    }

    return options;

  }

  function inheritData(data, options) {

    // mixin defaults, and apply common options

    options = options || {};

    // trying for memory / GC optimizations ...

    /*

    var defaultData;

    defaultData = {
      isEnemy: (options.isEnemy || false),
      bottomY: (options.bottomY || 0),
      dead: false,
      x: options.x || 0,
      y: options.y || 0,
      vX: options.vX || 0,
      vY: options.vY || 0
    };

    return mixin(defaultData, data);

    */

    // correct y data, if the object is bottom-aligned
    if (data.bottomAligned) {
      data.y = bottomAlignedY(options.bottomY || 0);
    }

    // TODO: revise to if (options.x !== undefined), apply then.

    if (data.isEnemy === undefined) {
      data.isEnemy = (options.isEnemy || false);
    }

    if (data.bottomY === undefined) {
      data.bottomY = (options.bottomY || 0);
    }

    if (data.dead === undefined) {
      data.dead = false;
    }

    if (data.x === undefined) {
      data.x = (options.x || 0);
    }

    if (data.y === undefined) {
      data.y = (options.y || 0);
    }

    if (data.vX === undefined) {
      data.vX = (options.vX || 0);
    }

    if (data.vY === undefined) {
      data.vY = (options.vY || 0);
    }

    if (options.fireModulus !== undefined) {
      data.fireModulus = options.fireModulus;
    }

    return data;

    // return mixin(defaultData, data);

  }

  /**
   * collision detection and related logic
   */

  function collisionCheck(point1, point2, point1XLookAhead) {

    /**
     * given x, y, width and height, determine if one object is overlapping another.
     * additional hacky param: X-axis offset for object. Used for cases where tanks etc. need to know when objects are nearby.
     * provided as an override because live objects are passed directly and can't be modified (eg., options.source.data.x += ...).
     * cloning these objects via mixin() works, but then lot of temporary objects are created, leading to increased garbage collection.
     */

    if (!point1 || !point2) {
      return null;
    }

    // presume each object has x, y, width, height - otherwise, all hell will break loose.

    // given two boxes, check for intersects.
    var result;

    if (point2.x >= point1.x + point1XLookAhead) {

      // point 2 is to the right.

      if (point1.x + point1XLookAhead + point1.width >= point2.x) {

        // point 1 overlaps point 2 on x.

        // width = point2.x - (point1.x + point1XLookAhead + point1.width);

        if (point1.y < point2.y) {

          // point 1 is above point 2.

          if (point1.y + point1.height >= point2.y) {

            // point 1 overlaps point 2 on y.
            result = true;

            // height = point2.y - (point1.y + point1.h);

          }

        } else {

          result = (point1.y < point2.y + point2.height);

          // height = (point2.y + point2.height) - point1.y;

        }

      }

    } else {

      // point 1 is to the right.

      if (point2.x + point2.width >= point1.x + point1XLookAhead) {

        // point 2 overlaps point 1 on x.

        // width = point1.x - (point2.x + point1XLookAhead + point2.width);

        if (point2.y < point1.y) {

          // point 2 is above point 1.
          result = (point2.y + point2.height >= point1.y);

          // height = point1.y - (point2.height + point2.y);

        } else {

          // point 2 is below point 1.
          result = (point1.y + point1.height >= point2.y);

          // height = point2.y - (point1.y + point1.height);

        }

      } else {

        // no overlap?
        result = false;

      }

    }

    return result;

  }

  function collisionCheckArray(options) {

    /**
     * options = {
     *   source: object (eg., game.objects.gunfire[0]);
     *   targets: array (eg., game.objects.tanks)
     * }
     */

    var item, xLookAhead, foundHit;

    if (!options) {
      return false;
    }

    // don't check if the object is dead. If it's expired, only allow the object if it's also "hostile" (can still hit things)
    if (options.source.data.dead || (options.source.data.expired && !options.source.data.hostile)) {
      return false;
    }

    // is this a "lookahead" (nearby) case? buffer the x value, if so. Armed vehicles use this.

    if (options.useLookAhead) {

      // friendly things move further right, enemies move further left.

      xLookAhead = (Math.min(16, options.source.data.xLookAhead || (options.source.data.width * 0.33)) * (options.source.data.isEnemy ? -1 : 1));

    } else {

      xLookAhead = 0;

    }

    for (item in options.targets) {

      // non-standard formatting, lengthy logic check here...
      if (

        options.targets.hasOwnProperty(item)

        // don't compare the object against itself
        && options.targets[item] !== options.source

        // ignore dead options.targets (unless a turret, which can be reclaimed / repaired by engineers)
        && (!options.targets[item].data.dead || (options.targets[item].data.type === 'turret' && options.source.data.type === 'infantry' && options.source.data.role))

        // more non-standard formatting....
        && (

          // don't check against friendly units
          (options.targets[item].data.isEnemy !== options.source.data.isEnemy)

          // unless infantry vs. bunker, end-bunker, super-bunker or helicopter
          || (options.source.data.type === 'infantry' && options.targets[item].data.type === 'bunker')
          || (options.source.data.type === 'end-bunker' && options.targets[item].data.type === 'infantry' && !options.targets[item].data.role)
          || (options.source.data.type === 'super-bunker' && options.targets[item].data.type === 'infantry' && !options.targets[item].data.role)

          || (options.source.data.type === 'helicopter' && options.targets[item].data.type === 'infantry')

          // OR engineer vs. turret
          || (options.source.data.type === 'infantry' && options.source.data.role && options.targets[item].data.type === 'turret')

          // OR we're dealing with a hostile or neutral object
          || (options.source.data.hostile || options.targets[item].data.hostile)
          || (options.source.data.isNeutral || options.targets[item].data.isNeutral)

        )

        // ignore if both objects are hostile, i.e., free-floating balloons (or missiles)
        && ((!options.source.data.hostile || !options.targets[item].data.hostile) || (options.source.data.hostile !== options.targets[item].data.hostile))

      ) {

        // note special Super Bunker "negative look-ahead" case - detects helicopter on both sides.
        if (
          collisionCheck(options.source.data, options.targets[item].data, xLookAhead)
          || (options.targets[item].data.type === 'helicopter' && collisionCheck(options.source.data, options.targets[item].data, -xLookAhead))
        ) {

          foundHit = true;

          if (options.hit) {
            options.hit(options.targets[item]);
            // update energy?
            updateEnergy(options.targets[item]);
          }

        }

      }

    }

    return foundHit;

  }

  function collisionTest(collision, exports) {

    var i, j;

    // hack: first-time run fix, as exports is initially undefined
    if (!collision.options.source) {
      collision.options.source = exports;
    }

    // loop through relevant game object arrays
    for (i=0, j=collision.items.length; i<j; i++) {

      // eliminated mixin() here, perhaps reduce object creation / GC?

      // assign current targets...
      collision.options.targets = game.objects[collision.items[i]];

      // ... and check them
      collisionCheckArray(collision.options);

    }

    // restore to original state
    collision.targets = null;

  }

  function collisionCheckMidPoint(obj1, obj2) {

    // infantry-at-midpoint (bunker or helicopter) case
    return collisionCheck(obj1.data.midPoint, obj2.data, 0);

  }

  function trackObject(source, target, options) {

    // given a source object (the helicopter) and a target, return the relevant vX / vY delta to get progressively closer to the target.

    var deltaX, deltaY, result;

    options = options || {};

    deltaX = (target.data.x + target.data.halfWidth) - (source.data.x + source.data.halfWidth);

    // by default, offset target to one side of a balloon.

    if (target.data.type === 'tank') {

      // hack: bomb from high up.
      deltaY = (40 + target.data.halfHeight) - (source.data.y + source.data.halfHeight);

    } else {

      deltaY = (target.data.y + target.data.halfHeight) - (source.data.y + source.data.halfHeight);

    }

    result = {
      deltaX: deltaX,
      deltaY: deltaY
    };

    return result;

  }

  function getNearestObject(source, options) {

    // given a source object (the helicopter), find the nearest enemy in front of the source - dependent on X axis + facing direction.

    var i, j, k, l, objects, itemArray, items, localObjects, result, targetData, preferGround, isInFront, useInFront, totalDistance;

    options = options || {};

    objects = game.objects;

    useInFront = (options.useInFront || null);

    // should a smart missile be able to target another smart missile? ... why not.
    items = (options.items || ['tanks', 'vans', 'missileLaunchers', 'helicopters', 'bunkers', 'balloons', 'smartMissiles', 'turrets']);

    localObjects = [];

    // if the source object isn't near the ground, be biased toward airborne items.
    if (source.data.type === 'helicopter' && source.data.y > game.objects.view.data.world.height - 100) {
      preferGround = true;
    }

    for (i=0, j=items.length; i<j; i++) {

      itemArray = objects[items[i]];

      for (k=0, l=itemArray.length; k<l; k++) {

        // potential target: not dead, and an enemy
        if (!itemArray[k].data.dead && itemArray[k].data.isEnemy !== source.data.isEnemy) {

          // is the target in front of the source?
          isInFront = (itemArray[k].data.x >= source.data.x);

          // [revised] - is the target within an acceptable range?
          // isInFront = (itemArray[k].data.x >= source.data.x || itemArray[k].data.x - source.data.x > -100);

          // additionally: is the helicopter pointed at the thing, and is it "in front" of the helicopter?
          if (!useInFront || (useInFront && ((!source.data.rotated && isInFront) || (source.data.rotated && !isInFront)))) {

            targetData = itemArray[k].data;

            if ((preferGround && targetData.bottomAligned && targetData.type !== 'balloon') || (!preferGround && (!targetData.bottomAligned || targetData.type === 'balloon'))) {

              totalDistance = Math.abs(Math.abs(targetData.x) - Math.abs(source.data.x));

              if (totalDistance < 4096) {

                localObjects.push({
                  obj: itemArray[k],
                  totalDistance: totalDistance
                });

              }

            }

          }

        }

      }

    }

    // sort by distance
    localObjects.sort(utils.array.compare('totalDistance'));

    if (localObjects.length) {

      // TODO: review and remove ugly hack here - enemy helicopter gets reverse-order logic.
      result = localObjects[source.data.type === 'helicopter' && source.data.isEnemy ? localObjects.length-1 : 0].obj;

    } else {

      result = null;

    }

    return result;

  }

  function objectInView(data, options) {

    // unrelated to other nearby functions: test if an object is on-screen (or slightly off-screen).

    var i, j, items, deltaX, result;

    options = options || {};

    // by default...
    options.triggerDistance = options.triggerDistance || (game.objects.view.data.browser.width * 2/3);

    // by default, take helicopters if nothing else.
    items = game.objects[(options.items || 'helicopters')];

    for (i=0, j=items.length; i<j; i++) {

      // how far away is the target?
      deltaX = (items[i].data.x > data.x ? items[i].data.x - data.x : data.x - items[i].data.x);

      if (!items[i].data.dead && !items[i].data.cloaked && deltaX < options.triggerDistance && (data.isEnemy !== items[i].data.isEnemy || items[i].data.isNeutral)) {

        result = items[i];

        break;

      }

    }

    return result;

  }

  function isOnScreen(target) {

    // is the target within the range of screen coordinates?
    return (target && target.data && target.data.x >= game.objects.view.data.battleField.scrollLeft && target.data.x < (game.objects.view.data.battleField.scrollLeft + game.objects.view.data.browser.width));

  }

  function initNearby(nearby, exports) {

    // map options.source -> exports
    nearby.options.source = exports;

  }

  function nearbyTest(nearby) {

    var i, j, foundHit;

    // loop through relevant game object arrays
    // TODO: revisit for object creation / garbage collection improvements
    for (i=0, j=nearby.items.length; i<j; i++) {

      // assign current targets...
      nearby.options.targets = game.objects[nearby.items[i]];

      // ... and check them
      if (collisionCheckArray(nearby.options)) {
        foundHit = true;
        break;
      }

    }

    // reset
    nearby.options.targets = null;

    // callback for no-hit case, too
    if (!foundHit && nearby.options.miss) {
      nearby.options.miss(nearby.options.source);
    }

  }

  function enemyNearby(data, targets, triggerDistance) {

    var i, j, k, l, targetData, results;

    results = [];

    // "targets" is an array of class types, e.g., tank, missileLauncher etc.

    for (i=0, j=targets.length; i<j; i++) {

      for (k=0, l=game.objects[targets[i]].length; k<l; k++) {

        targetData = game.objects[targets[i]][k].data;

        // non-friendly, not dead, and nearby?
        if (targetData.isEnemy !== data.isEnemy && !targetData.dead) {

          if (targetData.x > data.x) {
            if (targetData.x - data.x < triggerDistance) {
              results.push(game.objects[targets[i]][k]);
            }
          } else if (data.x - targetData.x < triggerDistance) {
            results.push(game.objects[targets[i]][k]);
          }

        }

      }

    }

    return results;

  }

  function enemyHelicopterNearby(data, triggerDistance) {

    var i, j, deltaX, result;

    // by default
    triggerDistance = triggerDistance || game.objects.view.data.browser.twoThirdsWidth;

    for (i=0, j=game.objects.helicopters.length; i<j; i++) {

      // not cloaked, not dead, and an enemy?
      if (!game.objects.helicopters[i].data.cloaked && !game.objects.helicopters[i].data.dead && data.isEnemy !== game.objects.helicopters[i].data.isEnemy) {

        // how far away is the target?
        deltaX = Math.abs(game.objects.helicopters[i].data.x - data.x);

        if (deltaX < triggerDistance) {

          result = game.objects.helicopters[i];

          break;

        }

      }

    }

    return result;

  }

  function getDoorCoords(obj) {

    // for special collision check case with bunkers

    var door, result;

    door = {
      width: 5,
      height: obj.data.height, // HACK: should be ~9px, figure out why true height does not work.
      halfWidth: 2.5
    };

    result = {
      width: door.width,
      height: door.height,
      // slight offset on X, don't subtract door half-width
      x: parseInt(obj.data.x + obj.data.halfWidth + door.halfWidth + 2, 10),
      y: parseInt(obj.data.y + obj.data.height - door.height, 10)
    };

    return result;

  }

  function countSides(objectType, includeDead) {

    var i, j, result;

    result = {
      friendly: 0,
      enemy: 0
    };

    if (game.objects[objectType]) {

      for (i=0, j=game.objects[objectType].length; i<j; i++) {

        if (!game.objects[objectType][i].data.dead) {

          if (game.objects[objectType][i].data.isEnemy || game.objects[objectType][i].data.hostile) {

            result.enemy++;

          } else {

            result.friendly++;

          }

        } else if (includeDead) {

          // things that are dead are considered harmless - therefore, friendly.
          result.friendly++;

        }

      }

    }

    return result;

  }

  function countFriendly(objectType, includeDead) {

    includeDead = (includeDead || false);

    return countSides(objectType, includeDead).friendly;

  }

  function playerOwnsBunkers() {

    // has the player captured (or destroyed) all bunkers? this affects enemy convoy production.

    var owned,
        total;

    owned = countFriendly('bunkers', true) + countFriendly('superBunkers', true);
    total = game.objects.bunkers.length + game.objects.superBunkers.length;

    return (owned >= total);

  }

  function checkProduction() {

    var bunkersOwned;

    // playing extreme mode? this benefit would practically be cheating! ;)
    if (gameType === 'extreme') {
      return;
    }

    bunkersOwned = playerOwnsBunkers();

    if (!productionHalted && bunkersOwned) {

      // player is doing well; reward them for their efforts.
      game.objects.view.setAnnouncement('You have captured all bunkers. Enemy convoy production has been halted.');
      productionHalted = true;

    } else if (productionHalted && !bunkersOwned) {

      // CPU has regained control of a bunker.
      game.objects.view.setAnnouncement('You no longer control all bunkers. Enemy convoy production is resuming.');
      productionHalted = false;

    }

  }

  function getSound(soundReference) {

    // common sound wrapper, options for positioning and muting etc.
    var soundObject;

    // multiple sound case
    if (soundReference instanceof Array) {

      // tack on a counter for multiple sounds
      if (soundReference.soundOffset === undefined) {
        soundReference.soundOffset = 0;
      }

      // mark this object
      soundObject = soundReference[soundReference.soundOffset];

      // increase, and reset the counter as necessary

      soundReference.soundOffset++;

      if (soundReference.soundOffset >= soundReference.length) {

        // re-shuffle the array, randomize a little
        soundReference = utils.array.shuffle(soundReference);

        soundReference.soundOffset = 0;

      }

    } else {

      soundObject = soundReference;

    }

    return soundObject;

  }

  function playSound(soundReference, target, soundOptions) {

    var soundObject = getSound(soundReference),
        localOptions,
        onScreen;

    if (!userDisabledSound && soundObject) {

      onScreen = (!target || isOnScreen(target));

      localOptions = soundObject.soundOptions[onScreen ? 'onScreen' : 'offScreen'];

      if (soundOptions) {
        localOptions = mixin(localOptions, soundOptions);
      }

      soundObject.sound.play(localOptions);

      // TODO: Determine why setVolume() call is needed when playing or re-playing actively-playing HTML5 sounds instead of options. Possible SM2 bug.
      // ex: actively-firing turret offscreen, moves on-screen - sound volume does not change.
      soundObject.sound.setVolume(localOptions.volume);

    }

    return soundObject ? soundObject.sound : null;

  }

  function playSoundWithDelay() {

    var args, delay;

    args = Array.prototype.slice.call(arguments);

    // modify args, and store last argument if it looks like a number.
    if (!isNaN(args[args.length-1])) {
      delay = args.pop();
    }

    if (!delay || isNaN(delay)) {
      delay = 500;
    }

    window.setTimeout(function() {
      playSound.apply(this, args);
    }, delay);

  }

  function playRepairingWrench(isRepairing, exports) {

    var args = arguments;

    if (!isRepairing()) {
      return false;
    }

    // slightly hackish: dynamic property on exports.
    if (!exports.repairingWrenchTimer) {

      // flag immediately, so subsequent immediate calls only trigger once
      exports.repairingWrenchTimer = true;

      playSound(sounds.repairingWrench, exports, {
        onfinish: function() {
          exports.repairingWrenchTimer = window.setTimeout(function() {
            exports.repairingWrenchTimer = null;
            if (isRepairing()) {
              playRepairingWrench.apply(this, args);
            }
          }, 1000 + parseInt(Math.random() * 2000, 10));
        }
      });

    }

  }

  function playImpactWrench(isRepairing, exports) {

    var args = arguments;

    if (!isRepairing()) {
      return false;
    }

    // slightly hackish: dynamic property on exports.
    if (!exports.impactWrenchTimer) {

      // flag immediately, so subsequent immediate calls only trigger once
      exports.impactWrenchTimer = true;

      playSound(sounds.impactWrench, exports, {
        onfinish: function() {
          exports.impactWrenchTimer = window.setTimeout(function() {
            exports.impactWrenchTimer = null;
            if (isRepairing()) {
              playImpactWrench.apply(this, args);
            }
          }, 500 + parseInt(Math.random() * 2000, 10));
        }
      });

    }

  }

  function playTinkerWrench(isRepairing, exports) {

    var args = arguments;

    playSound(sounds.tinkerWrench, exports, {
      position: parseInt(Math.random() * 8000, 10),
      onfinish: function() {
        if (isRepairing()) {
          playTinkerWrench.apply(this, args);
        }
      }
    });

  }

  /**
   * sound effects
   */

  sounds = {
    helicopter: {
      bomb: null,
      engine: null,
      engineVolume: 25,
      rotate: null
    },
    inventory: {
      begin: null,
      end: null
    },
    shrapnel: {
      counter: 0,
      counterMax: 4,
      hit0: null,
      hit1: null,
      hit2: null,
      hit3: null
    },
    chainSnapping: null,
    infantryGunFire: null,
    balloonExplosion: null,
    genericBoom: null,
    genericExplosion2: null,
    explosionLarge: null,
    genericGunFire: null,
    missileLaunch: null,
    repairing: null,
    rubberChicken: {
      launch: null,
      expire: null,
      die: null
    },
    parachuteOpen: null,
    impactWrench: null,
    repairingWrench: null,
    tinkerWrench: null,
    friendlyClaim: null,
    enemyClaim: null,
    popSound: null,
    popSound2: null,
    crashAndGlass: null,
    genericSplat: null,
    turretGunFire: null,
    wilhemScream: null
  };

  soundManager.onready(function() {

    var i;

    function getURL(file) {

      // SM2 will determine the appropriate format to play, based on client support.
      // URL pattern -> array of .ogg and .mp3 URLs
      return ['audio/ogg/' + file + '.ogg', 'audio/mp3/' + file + '.mp3', 'audio/wav/' + file + '.wav'];

    }

    function addSound(options) {

      var result = {
        sound: soundManager.createSound(options),
        soundOptions: {
          onScreen: {
            volume: options.volume || 100
          },
          offScreen: {
            // off-screen sounds are more quiet.
            volume: parseInt((options.volume || 100) / 3, 10)
          }
        }
      };

      return result;

    }

    sounds.impactWrench = [];

    sounds.impactWrench.push(addSound({
      // http://freesound.org/people/andrewgnau2/sounds/71534/
      url: getURL('impact-wrench-1'),
      volume: 10
    }));

    sounds.impactWrench.push(addSound({
      url: getURL('impact-wrench-2'),
      volume: 10
    }));

    sounds.impactWrench.push(addSound({
      url: getURL('impact-wrench-3'),
      volume: 10
    }));

    sounds.repairingWrench = [];

    // http://freesound.org/people/TheGertz/sounds/131200/
    sounds.repairingWrench.push(addSound({
      url: getURL('socket-wrench-1'),
      volume: 10
    }));

    // http://freesound.org/people/xxqmanxx/sounds/147018/
    sounds.repairingWrench.push(addSound({
      url: getURL('socket-wrench-2'),
      volume: 10
    }));

    sounds.repairingWrench.push(addSound({
      url: getURL('socket-wrench-3'),
      volume: 10
    }));

    sounds.tinkerWrench = addSound({
      // http://freesound.org/people/klankbeeld/sounds/198299/
      url: getURL('tinker-wrench'),
      multiShot: false,
      volume: 20
    });

    sounds.friendlyClaim = addSound({
      // http://freesound.org/people/Carlos_Vaquero/sounds/153616/
      url: getURL('violin-c5-pizzicato-non-vibrato'),
      volume: 8
    });

    sounds.enemyClaim = addSound({
      // http://freesound.org/people/Carlos_Vaquero/sounds/153611/
      url: getURL('violin-g4-pizzicato-non-vibrato'),
      volume: 8
    });

    sounds.popSound = addSound({
      // used when picking up infantry + engineers, and restoring turrets
      // http://freesound.org/people/SunnySideSound/sounds/67095/
      url: getURL('popsound1'),
      volume: 10
    });

    sounds.popSound2 = addSound({
      // used when deploying parachute infantry
      // http://freesound.org/people/runirasmussen/sounds/178446/
      url: getURL('popsound2'),
      volume: 10
    });

    sounds.crashAndGlass = addSound({
      // http://freesound.org/people/Rock%20Savage/sounds/59263/
      url: getURL('crash-glass')
    });

    sounds.balloonExplosion = addSound({
      url: getURL('balloon-explosion'),
      volume: 20
    });

    sounds.genericSplat = [];
    
    // http://freesound.org/people/FreqMan/sounds/42962/
    for (i=0; i<2; i++) {
      sounds.genericSplat.push(addSound({
        url: getURL('splat1'),
        volume: 15
      }));
      sounds.genericSplat.push(addSound({
        url: getURL('splat2'),
        volume: 15
      }));
      sounds.genericSplat.push(addSound({
        url: getURL('splat3'),
        volume: 15
      }));
    }

    sounds.genericSplat = utils.array.shuffle(sounds.genericSplat);

    sounds.genericBoom = [];

    for (i=0; i<4; i++) {
      sounds.genericBoom.push(addSound({
        url: getURL('generic-boom'),
        volume: 20
      }));
    }

    sounds.genericExplosion = addSound({
      url: getURL('generic-explosion'),
      volume: 18
    });

    sounds.genericExplosion2 = addSound({
      url: getURL('generic-explosion-2'),
      volume: 18
    });

    sounds.genericGunFire = [];

    for (i=0; i<8; i++) {
      sounds.genericGunFire.push(addSound({
        url: getURL('generic-gunfire'),
        // multiShot: isChrome,
        volume: 25
      }));
    }

    sounds.infantryGunFire = [
      addSound({
        url: getURL('infantry-gunfire'),
        volume: 20
      }),
      addSound({
        url: getURL('infantry-gunfire'),
        volume: 20
      })
    ];

    sounds.turretGunFire = [];

    for (i=0; i<8; i++) {
      sounds.turretGunFire.push(addSound({
        url: getURL('turret-gunfire'),
        volume: 60
      }));
    }

    // http://freesound.org/people/ceberation/sounds/235513/
    sounds.doorClose = addSound({
      url: getURL('door-closing'),
      volume: 12
    });

    // http://freesound.org/people/Tiger_v15/sounds/211015/
    sounds.metalHitBreak = addSound({
      url: getURL('metal-hit-break'),
      volume: 12
    });

    sounds.metalHit = [];

    sounds.metalHitLight = [];

    for (i=0; i<4; i++) {

      // http://freesound.org/people/Tiger_v15/sounds/211015/
      sounds.metalHit.push(addSound({
        url: getURL('metal-hit-1'),
        volume: 4
      }));

      sounds.metalHit.push(addSound({
        url: getURL('metal-hit-2'),
        volume: 4
      }));

      sounds.metalHit.push(addSound({
        url: getURL('metal-hit-3'),
        volume: 4
      }));

      sounds.metalHit.push(addSound({
        url: getURL('metal-hit-4'),
        volume: 4
      }));

      sounds.metalHit.push(addSound({
        url: getURL('metal-hit-5'),
        volume: 4
      }));

      // http://freesound.org/people/dheming/sounds/197398/
      sounds.metalHitLight.push(addSound({
        url: getURL('metal-hit-light-1'),
        volume: 8
      }));

      sounds.metalHitLight.push(addSound({
        url: getURL('metal-hit-light-2'),
        volume: 8
      }));

      sounds.metalHitLight.push(addSound({
        url: getURL('metal-hit-light-3'),
        volume: 8
      }));

      sounds.metalHitLight.push(addSound({
        url: getURL('metal-hit-light-4'),
        volume: 8
      }));

      sounds.metalHitLight.push(addSound({
        url: getURL('metal-hit-light-5'),
        volume: 8
      }));

    }

    sounds.explosionLarge = addSound({
      url: getURL('explosion-large'),
      // will result in GC, but perhaps an exception for this special case
      multiShot: true,
      volume: 60
    });

    sounds.chainSnapping = addSound({
      url: getURL('chain-snapping'),
      volume: 15
    });

    sounds.wilhemScream = addSound({
      url: getURL('wilhem-scream'),
      volume: 20
    });

    sounds.helicopter.engine = addSound({
      url: getURL('helicopter-engine'),
      volume: 25,
      loops: 999
    });

    sounds.helicopter.rotate = addSound({
      url: getURL('helicopter-rotate'),
      volume: 10
    });

    sounds.inventory.denied = addSound({
      url: getURL('order-denied')
    });

    sounds.inventory.begin = addSound({
      url: getURL('order-start'),
      volume: 40
    });

    sounds.inventory.end = addSound({
      url: getURL('order-complete'),
      volume: 15
    });

    sounds.missileLaunch = addSound({
      url: getURL('missile-launch')
    });

    sounds.parachuteOpen = addSound({
      url: getURL('parachute-open'),
      volume: 25
    });

    sounds.shrapnel.hit0 = addSound({
      url: getURL('shrapnel-hit'),
      volume: 7
    });

    sounds.shrapnel.hit1 = addSound({
      url: getURL('shrapnel-hit-2'),
      volume: 7
    });

    sounds.shrapnel.hit2 = addSound({
      url: getURL('shrapnel-hit-3'),
      volume: 7
    });

    sounds.shrapnel.hit3 = addSound({
      url: getURL('shrapnel-hit-4'),
      volume: 7
    });

    sounds.splat = addSound({
      url: getURL('splat'),
      volume: 25
    });

    sounds.radarJamming = addSound({
      url: getURL('radar-jamming'),
      volume: 20
    });

    sounds.repairing = addSound({
      url: getURL('repairing'),
      volume: 75,
      loops: 999
    });

    sounds.rubberChicken.launch = [];

    sounds.rubberChicken.launch.push(addSound({
      url: getURL('rubber-chicken-launch-1'),
      volume: 20
    }));

    sounds.rubberChicken.launch.push(addSound({
      url: getURL('rubber-chicken-launch-2'),
      volume: 20
    }));

    sounds.rubberChicken.launch.push(addSound({
      url: getURL('rubber-chicken-launch-3'),
      volume: 20
    }));

    // randomize order a little
    sounds.rubberChicken.launch = utils.array.shuffle(sounds.rubberChicken.launch);

    sounds.rubberChicken.expire = addSound({
      url: getURL('rubber-chicken-expire'),
      volume: 30
    });

    sounds.rubberChicken.die = [];

    sounds.rubberChicken.die.push(addSound({
      url: getURL('rubber-chicken-hit-1'),
      volume: 20
    }));

    sounds.rubberChicken.die.push(addSound({
      url: getURL('rubber-chicken-hit-2'),
      volume: 20
    }));

    sounds.rubberChicken.die.push(addSound({
      url: getURL('rubber-chicken-hit-3'),
      volume: 20
    }));

    sounds.rubberChicken.die.push(addSound({
      url: getURL('rubber-chicken-hit-4'),
      volume: 20
    }));

    // randomize order a little
    sounds.rubberChicken.die = utils.array.shuffle(sounds.rubberChicken.die);


  });

  View = function() {

    var css, data, dom, events, exports;

    function setLeftScroll(x) {

      // scroll the battlefield by relative amount.
      data.battleField.scrollLeftVX = x;
      data.battleField.scrollLeft = Math.max(-512, Math.min(data.battleField.width - (data.browser.width/2), data.battleField.scrollLeft + x));

      if (features.transform.prop) {
        // aim for GPU-based scrolling...
        dom.battleField.style[features.transform.prop] = 'translate3d(' + (parseInt(data.battleField.scrollLeft, 10) * -1) + 'px, 0px, 0px)';
        // ... and parallax.
        if (!tutorialMode || (tutorialMode && (!isFirefox || useParallax))) {
          // firefox text rendering really doesn't look nice when translating the stars.
          dom.stars.style[features.transform.prop] = 'translate3d(' + parseInt(-data.battleField.scrollLeft * data.battleField.parallaxRate, 10) + 'px, 0px, 0px)';
        }
      } else {
        // move via margin + background position
        dom.battleField.style.marginLeft = -parseInt(data.battleField.scrollLeft, 10) + 'px';
        dom.stars.style.backgroundPosition = parseInt(-data.battleField.scrollLeft * data.battleField.parallaxRate, 10) + 'px 0px';
      }

    }

    function refreshCoords() {

      updateScreenScale();

      applyScreenScale();

      data.browser.width = (window.innerWidth || document.body.clientWidth) / screenScale;
      data.browser.height = (window.innerHeight || document.body.clientHeight) / screenScale;

      data.browser.fractionWidth = data.browser.width / 3;
      data.browser.halfWidth = data.browser.width / 2;
      data.browser.twoThirdsWidth = data.browser.width * 2/3;

      data.world.width = dom.worldWrapper.offsetWidth;
      data.world.height = dom.worldWrapper.offsetHeight;

      data.world.x = 0;
      data.world.y = dom.worldWrapper.offsetTop / screenScale;

      if (!data.battleField.width) {
        // dimensions assumed to be static, can be grabbed once
        data.battleField.width = dom.battleField.offsetWidth;
        data.battleField.height = dom.battleField.offsetHeight;
        data.topBar.height = dom.topBar.offsetHeight;
      }

      if (dom.stars && features.transform.prop) {
        // GPU case: Be wide enough to cover parallax scroll effect. browser width + (world width * 0.1)
        dom.stars.style.width = data.browser.width + (data.battleField.width * 0.1) + 'px';
      }

    }

    function setTipsActive(active) {
       if (data.gameTips.active !== active) {
         utils.css[active ? 'add' : 'remove'](dom.gameTips, css.gameTips.active);
       }
    }

    function shuffleTips() {

      var i, j, elements, fragment;

      // TODO: this doesn't work in Firefox, barfs with "TypeError: Argument 1 of Node.appendChild is not an object." - likely due to live DOM list being returned.
      try {

        elements = dom.gameTips.getElementsByTagName('span');

        fragment = document.createDocumentFragment();

        elements = utils.array.shuffle(elements);

        for (i=0, j=elements.length; i<j; i++) {
          fragment.appendChild(elements[i]);
        }

        // re-append in new order
        dom.gameTipsList.appendChild(fragment);

      } catch(e) {

        if (console && console.warn) {
          console.warn('Warning: Exception while shuffling game tips. TODO: Review/fix.', e);
        }

      }

    }

    function setAnnouncement(text, delay) {

      if (text !== data.gameTips.lastAnnouncement && ((!data.gameTips.hasAnnouncement && text) || (data.gameTips.hasAnnouncement && !text))) {

        utils.css[text ? 'add' : 'remove'](dom.gameTips, css.gameTips.hasAnnouncement);

        // dom.gameAnnouncements.textContent = text;

        dom.gameAnnouncements.innerHTML = text;

        data.gameTips.lastAnnouncement = text;

        if (data.gameTips.announcementTimer) {
          window.clearTimeout(data.gameTips.announcementTimer);
        }

        if (text) {
          // clear after an amount of time, if not -1
          if ((delay === undefined || delay !== -1)) {
            data.gameTips.announcementTimer = window.setTimeout(setAnnouncement, delay || 5000);
          }
        }

        data.gameTips.hasAnnouncement = !!text;

      }

    }

    function animate() {

      var scrollAmount, mouseDelta;

      // don't scroll if the helicopter isn't moving.
      if (game.objects.helicopters[0].data.vX !== 0) {

        // is the mouse to the right, or left?
        mouseDelta = (data.mouse.x - data.browser.halfWidth);

        // how much...
        scrollAmount = mouseDelta / data.browser.halfWidth;

        // and scale
        setLeftScroll(scrollAmount * data.maxScroll);

      }

      if (!data.gameTips.hasAnnouncement) {

        if (data.frameCount % data.marqueeModulus === 0) {

          // move the marquee.
          common.setTransformXY(dom.gameTipsList, (data.gameTips.scrollOffset * -2) + 'px', 0);

        }

        data.gameTips.scrollOffset++;

      }

      data.frameCount++;

    }

    function addEvents() {

      utils.events.add(window, 'resize', events.resize);
      utils.events.add(document, 'mousemove', events.mousemove);

      if (!isOldIE) {
        utils.events.add(window, 'focus', events.focus);
        utils.events.add(window, 'blur', events.blur);
      }

    }

    function initDOM() {

      dom.worldWrapper = document.getElementById('world-wrapper');
      dom.battleField = document.getElementById('battlefield');
      dom.stars = document.getElementById('stars');
      dom.topBar = document.getElementById('top-bar');
      dom.gameTips = document.getElementById('game-tips');
      dom.gameTipsList = document.getElementById('game-tips-list');
      dom.gameAnnouncements = document.getElementById('game-announcements');

    }

    function init() {

      initDOM();

      addEvents();

      refreshCoords();

      setLeftScroll(0);

      shuffleTips();

      setTipsActive(true);

    }

    css = {
      gameTips: {
        active: 'active',
        hasAnnouncement: 'has-announcement'
      }
    };

    data = {
      frameCount: 0,
      ignoreMouseEvents: false,
      browser: {
        width: 0,
        fractionWidth: 0,
        halfWidth: 0,
        twoThirdsWidth: 0,
        height: 0
      },
      mouse: {
        x: 0,
        y: 0
      },
      world: {
        width: 0,
        height: 0,
        x: 0,
        y: 0
      },
      battleField: {
        width: 0,
        height: 0,
        scrollLeft: 0,
        scrollLeftVX: 0,
        parallaxRate: 0.1
      },
      topBar: {
        height: 0
      },
      gameTips: {
        announcementTimer: null,
        active: false,
        hasAnnouncement: false,
        lastText: null,
        scrollOffset: 0
      },
      marqueeModulus: 1,
      maxScroll: 6
    };

    dom = {
      battleField: null,
      stars: null,
      topBar: null,
      gameTips: null,
      gameTipsList: null,
      gameAnnouncements: null
    };

    events = {

      blur: function() {

        game.pause();

      },

      focus: function() {

        game.resume();

      },

      mousemove: function(e) {
        if (!data.ignoreMouseEvents) {
          data.mouse.x = parseInt((e || window.event).clientX / screenScale, 10);
          data.mouse.y = parseInt((e || window.event).clientY / screenScale, 10);
        }
      },

      resize: function() {
        // throttle?
        refreshCoords();
        game.objects.gameLoop.resetFPS();
      }

    };

    init();

    exports = {
      animate: animate,
      data: data,
      dom: dom,
      events: events,
      setAnnouncement: setAnnouncement,
      setLeftScroll: setLeftScroll
    };

    return exports;

  };

  Inventory = function() {

    var css, data, dom, objects, exports;

    function createObject(typeData, options) {

      // create and append a new (something) to its appropriate array.

      var orderObject;

      orderObject = new typeData[1](options);

      // ignore if this is the stub object case
      if (!options.noInit) {

        typeData[0].push(orderObject);

        utils.css.add(orderObject.dom.o, css.building);

        window.setTimeout(function() {
          utils.css.add(orderObject.dom.o, css.ordering);
          /*
          window.setTimeout(function() {
            // undo
            utils.css.swap(orderObject.dom.o, css.ordered);
          }, 1200);
          */
        }, 1);

      }

      return orderObject;

    }

    function order(type, options) {

      var typeData, orderObject, orderSize, cost;

      options = options || {};

      orderSize = 1;

      options.x = -72; // default off-screen setting

      if (!data.building) {

        // let's build something - provided you have the $$$, that is.

        data.frameCount = 0;

        typeData = data.types[type];

        // infantry or engineer? handle those specially.

        if (type === 'infantry') {

          orderSize = 5;

        } else if (type === 'engineer') {

          orderSize = 2;

        }

        // Hack: make a temporary object, so we can get the relevant data for the actual order.
        if (!options.isEnemy) {
          options.noInit = true;
        }

        orderObject = createObject(typeData, options);

        // do we have enough funds for this?
        cost = orderObject.data.inventory.cost;

        if (game.objects.endBunkers[0].data.funds >= cost) {

          game.objects.endBunkers[0].data.funds -= cost;

          if (!data.isEnemy) {
            game.objects.helicopters[0].updateStatusUI();
          }

        } else if (!data.isEnemy) {

          // Insufficient funds. "We require more vespene gas."
          if (sounds.inventory.denied) {
            playSound(sounds.inventory.denied);
          }

          return false;

        }

        // and now, remove that for the real build.
        options.noInit = false;

        data.building = true;

        objects.order = {
          data: orderObject.data,
          completeDelay: orderObject.data.inventory.orderCompleteDelay || 0, // how long to wait after last item before "complete" (for buffering space)
          typeData: typeData,
          options: options,
          size: orderSize
        };

        // reset the frame count, and re-enable building when it surpasses this object's "build time"
        // TODO: Don't play sounds if options.enemy set.
        // data.frameCount = orderObject.data.inventory.frameCount * -1 * (orderSize > 1 ? orderSize + 1 : orderSize);

        if (!options.isEnemy) {

          // update the UI
          utils.css.add(dom.gameStatusBar, css.building);

          if (sounds.inventory.begin) {
            playSound(sounds.inventory.begin);
          }

        }

      } else {

        // busy.
        if (sounds.inventory.denied) {
          playSound(sounds.inventory.denied);
        }

      }

      // HACK
      if (options.isEnemy) {
        data.building = false;
      }

    }

    function animate() {

      if (data.building) {

        if (data.frameCount % objects.order.data.inventory.frameCount === 0) {

          if (objects.order.size) {

            // make an object.

            createObject(objects.order.typeData, objects.order.options);

            objects.order.size--;

          } else {

            // wait some amount of time after build completion? (fix spacing when infantry / engineers ordered, followed by a tank.)

            if (objects.order.completeDelay) {

              objects.order.completeDelay--;

            } else {

              // "Construction complete."

              utils.css.remove(dom.gameStatusBar, css.building);

              data.building = false;

              // play sound?
              if (sounds.inventory.end) {
                playSound(sounds.inventory.end);
              }

            }

          }

        }

      }

      data.frameCount++;

    }

    function init() {
      dom.gameStatusBar = document.getElementById('game-status-bar');
    }

    css = {
      building: 'building',
      ordering: 'ordering'
    };

    data = {
      frameCount: 0,
      // quick type-to-object/constructor array
      types: {
        tank: [game.objects.tanks, Tank],
        van: [game.objects.vans, Van],
        missileLauncher: [game.objects.missileLaunchers, MissileLauncher],
        infantry: [game.objects.infantry, Infantry],
        engineer: [game.objects.engineers, Engineer]
      },
      building: false
    };

    objects = {
      order: null
    };

    dom = {
      gameStatusBar: null
    };

    exports = {
      animate: animate,
      data: data,
      dom: dom,
      createObject: createObject,
      order: order
    };

    init();

    return exports;

  };

  function RadarItem(options) {

    var css, data, dom, oParent, exports;

    function dieComplete() {

      game.objects.radar.removeItem(exports);
      dom.o = null;
      options.o = null;

    }

    function die(dieOptions) {

      if (!data.dead) {

        if (!dieOptions || !dieOptions.silent) {
          utils.css.add(dom.o, css.dying);
        }

        stats.destroy(exports);

        data.dead = true;

        if (!options.canRespawn) {

          // permanent removal
          if (dieOptions && dieOptions.silent) {

            // bye bye! (next scheduled frame)
            features.getAnimationFrame(dieComplete);

          } else {

            window.setTimeout(dieComplete, 2000);

          }

        } else {

          // balloon, etc.
          window.setTimeout(function() {
            utils.css.add(dom.o, css.dead);
          }, 1000);

        }

      }

    }

    function reset() {
      if (data.dead) {
        utils.css.remove(dom.o, css.dying);
        utils.css.remove(dom.o, css.dead);
        data.dead = false;
        // reset is the same as creating a new object.
        stats.create(exports);
      }
    }

    function init() {
      utils.css.add(dom.o, css.radarItem + ' ' + options.className);
    }

    css = {
      radarItem: 'radar-item',
      dying: 'dying',
      dead: 'dead'
    };

    data = {
      dead: false
    };

    dom = {
      o: options.o
    };

    oParent = options.oParent;

    init();

    exports = {
      dom: dom,
      die: die,
      oParent: oParent,
      reset: reset
    };

    return exports;

  }

  Radar = function() {

    var data, css, dom, maybeJam, exports, objects;

    function setIncomingMissile(incoming) {

      if (data.incomingMissile !== incoming) {

        utils.css[incoming ? 'add' : 'remove'](game.objects.view.dom.worldWrapper, css.incomingSmartMissile);

        data.incomingMissile = incoming;

      }

    }

    function addRadarItem(item, className, canRespawn) {

      var itemObject;

      itemObject = new RadarItem({
        o: document.createElement('div'),
        className: className,
        oParent: item,
        canRespawn: (canRespawn || false)
      });

      objects.items.push(itemObject);

      itemObject.dom.o.style.left = '0px';

      if (item.data.bottomAligned) {
        itemObject.dom.o.style.top = 'auto';
        itemObject.dom.o.style.bottom = '0px';
      } else {
        itemObject.dom.o.style.top = '0px';
        itemObject.dom.o.style.bottom = 'auto';
      }

      dom.radar.appendChild(itemObject.dom.o);

      stats.create(item);

      return itemObject;

    }

    function startJamming(isJamming) {

      // [ obligatory Bob Marley reference goes here ]

      if (!data.jammingTimer) {
        data.jammingTimer = window.setTimeout(maybeJam, 250 + parseInt(Math.random() * (isJamming ? 1000 : 500), 10));
      }

    }

    function stopJamming() {

      if (data.jammingTimer) {
        window.clearTimeout(data.jammingTimer);
        data.jammingTimer = null;
        utils.css.remove(dom.radar, css.jammed);
        if (sounds.radarJamming && sounds.radarJamming.sound) {
          sounds.radarJamming.sound.stop();
        }
      }

    }

    function removeRadarItem(item) {

      // look up item
      var i, j;

      // find and remove from DOM + array
      for (i=objects.items.length-1, j=0; i>=j; i--) {
        if (objects.items[i] === item) {
          removeNodes(objects.items[i].dom);
          objects.items.splice(i, 1);
          break;
        }
      }

    }

    function animate() {

      var i, j, left, top, battleFieldWidth, hasEnemyMissile;

      hasEnemyMissile = false;

      if (data.frameCount % data.animateModulus === 0) {

        // move all radar items

        battleFieldWidth = game.objects.view.data.battleField.width;

        if (features.transform.prop) {

          for (i=0, j=objects.items.length; i<j; i++) {

            left = (parseInt((objects.items[i].oParent.data.x / battleFieldWidth) * game.objects.view.data.browser.width, 10)) + 'px';

            if ((!objects.items[i].oParent.data.bottomAligned && objects.items[i].oParent.data.y > 0) || objects.items[i].oParent.data.type === 'balloon') {

              top = parseInt((objects.items[i].oParent.data.type === 'balloon' ? -32 : 0) + Math.min(1, (objects.items[i].oParent.data.y / (game.objects.view.data.battleField.height + objects.items[i].oParent.data.height))) * 35, 10) + 'px';

            } else {

              top = '0px';

            }

            common.setTransformXY(objects.items[i].dom.o, left, top);

          }

        } else {

          for (i=0, j=objects.items.length; i<j; i++) {

            // TODO: optimize

            objects.items[i].dom.o.style.left = (((objects.items[i].oParent.data.x) / battleFieldWidth) * 100) + '%';

            if ((!objects.items[i].oParent.data.bottomAligned && objects.items[i].oParent.data.y > 0) || objects.items[i].oParent.data.type === 'balloon') {

              objects.items[i].dom.o.style.top = ((objects.items[i].oParent.data.y / game.objects.view.data.battleField.height) * 100) + '%';

            }

          }


        }

        // any active smart missiles?

        if (game.objects.smartMissiles.length !== data.lastMissileCount) {

          // change state?

          for (i=0, j=game.objects.smartMissiles.length; i<j; i++) {

            // is this missile not dead, not expired/hostile, and an enemy?

            if (!game.objects.smartMissiles[i].data.dead && !game.objects.smartMissiles[i].data.hostile && game.objects.smartMissiles[i].data.isEnemy !== game.objects.helicopters[0].data.isEnemy) {

              hasEnemyMissile = true;

              break;  

            }
          
          }

          data.lastMissileCount = game.objects.smartMissiles.length;

          setIncomingMissile(hasEnemyMissile);

        }

      }

      data.frameCount++;

    }

    function init() {

      dom.radar = document.getElementById('radar');

    }

    maybeJam = function() {

      var jam = (Math.random() > 0.25);

      // TODO: prevent excessive DOM I/O
      if (!noJamming) {

        if (jam) {
          utils.css.add(dom.radar, css.jammed);
        } else {
          utils.css.remove(dom.radar, css.jammed);
        }

        // dom.radar.style.visibility = (jam ? 'hidden' : 'visible');

        if (jam) {

          if (!userDisabledSound && sounds.radarJamming && sounds.radarJamming.sound) {
            if (!sounds.radarJamming.sound.playState) {
              sounds.radarJamming.sound.play({
                // position: parseInt(Math.random() * sounds.radarJamming.sound.duration, 10),
                loops: 999
              });
            }
          }

        } else {

          if (sounds.radarJamming && sounds.radarJamming.sound) {
            sounds.radarJamming.sound.stop();
          }

        }

      }

      data.jammingTimer = null;

      // and do this again.
      startJamming(jam);

    };

    css = {
      incomingSmartMissile: 'incoming-smart-missile',
      jammed: 'jammed'
    };

    objects = {
      items: []
    };

    data = {
      frameCount: 0,
      animateModulus: 1, // TODO: review
      // jammingModulus: 12,
      jammingTimer: null,
      lastMissileCount: 0,
      incomingMissile: false
    };

    dom = {
      radar: null,
      radarItem: null
    };

    init();

    exports = {
      addItem: addRadarItem,
      animate: animate,
      data: data,
      dom: dom,
      removeItem: removeRadarItem,
      startJamming: startJamming,
      stopJamming: stopJamming
    };

    return exports;

  };

  GameLoop = function() {

    var data, exports;

    function animate() {

      // loop through all objects, animate.
      var item, i;
      var gameObjects = game.objects;

      data.frameCount++;

      if (battleOver) {
         // hack: only animate shrapnel.
        gameObjects = game.objects.shrapnel;
      }

      for (item in gameObjects) {

        if (gameObjects.hasOwnProperty(item) && gameObjects[item]) {

          // single object case
          if (gameObjects[item].animate && gameObjects[item].animate()) {

            // object is dead - take it out.
            gameObjects[item] = null;

          } else {

            // array case
            for (i = gameObjects[item].length-1; i >= 0; i--) {

              if (gameObjects[item][i].animate && gameObjects[item][i].animate()) {
                // object is dead - take it out.
                gameObjects[item].splice(i, 1);
              }

            }

          }

        }

      }

    }

    function animateRAF() {

      // TODO: increase fpsInterval and eventually disable in "failure" case, when hardware can't handle desired framerate.

      var now, fps, fpsMultiplier;

      if (data.timer) {

        now = Date.now();

        // target ideal frame rate
        if (now - data.lastExec >= FRAMERATE) {

          data.elapsedTime += (now - data.lastExec);

          data.lastExec = now;

          animate();

          data.frames++;

          // try to adjust timer, to target ~30 FPS.
          // when target fps hit, disable this check.
          if (data.elapsedTime >= data.fpsInterval) {

            // estimated FPS
            fps = data.frames * (1000 / data.fpsInterval);

            // interestingly, Chrome rAF performance suffers when logging FPS results during testing (and the console is open)?
            if (data.fpsLocked) {
              console.log('fps', fps);
            }

            document.getElementById('fps-count').textContent = fps;

            // window.performance.memory?

            if (!data.fpsLocked) {

              if (fps !== FPS_IDEAL) {

                data.targetFPSHit = 0;

                // when adjusting, note that rate is non-linear.

                if (fps > FPS_IDEAL) {

                  // over target frame rate. slow down a little.
                  fpsMultiplier = 0.9;

                } else {

                  // faster!
                  fpsMultiplier = 1.1;

                }

                FRAMERATE = 1000/(FPS * fpsMultiplier);

              } else {

                // we've met the target.
                data.targetFPSHit++;

                // once stable for "long enough", disable this function.
                if (data.targetFPSHit >= data.stableFPSCount) {

                  console.log('locking in at ' + FRAMERATE);

                  data.targetFPSHit = 0;
                  data.fpsLocked = true;
                  data.fpsInterval = 1000;

                }

              }

            }

            data.frames = 0;
            data.elapsedTime = 0;

          }

        } 

        // regardless, queue the next available frame
        features.getAnimationFrame(animateRAF);

      }

    }

    function start() {

      if (!data.timer) {

        if (features.getAnimationFrame) {

          data.timer = true;
          animateRAF();

        } else {

          data.timer = window.setInterval(animate, FRAMERATE);

        }

      }

    }

    function stop() {

      if (data.timer) {

        if (!utils.getAnimationFrame) {
          window.clearInterval(data.timer);
        }

        data.timer = null;

      }

    }

    function resetFPS() {

      // re-measure FPS timings.
      data.lastExec = (isOldIE ? new Date().getTime() : Date.now());
      data.frames = 0;
      data.fpsLocked = false;
      data.fpsIntervalDefault = 100;
      data.targetFPSHit = 0;

    }

    function init() {

      start();

    }

    data = {
      frameCount: 0,
      lastExec: 0,
      elapsedTime: 0,
      frames: 0,
      fpsInterval: 100,
      fpsIntervalDefault: 100,
      fpsLocked: false,
      targetFPSHit: 0,
      stableFPSCount: 3
    };

    exports = {
      data: data,
      init: init,
      resetFPS: resetFPS,
      stop: stop,
      start: start
    };

    return exports;

  };

  function gameOver(youWon) {

    // somebody's base is about to get blown up.

    var yourBase, enemyBase;

    if (!battleOver) {

      yourBase = game.objects.bases[0];
      enemyBase = game.objects.bases[1];

      if (!youWon) {

        // sorry, better luck next time.
        yourBase.die();

      } else {

        enemyBase.die();

      }

      battleOver = true;

      stats.displayEndGameStats();

    }

  }

  Balloon = function(options) {

    var css, data, dom, objects, radarItem, reset, exports;

    function moveTo(x, bottomY) {

      if (x !== undefined && data.x !== x) {
        common.setTransformXY(dom.o, x + 'px', data.y + 'px');
        data.x = x;
      }

      if (bottomY !== undefined) {

        // if detached, don't go all the way to the bottom.
        bottomY = Math.min(100, Math.max(data.detached ? 10 : -data.bottomYOffset, bottomY));

        if (data.bottomY !== bottomY) {

          common.setBalloonXY(exports, bottomY);

          data.bottomY = bottomY;

          // special handling for balloon case
          // TODO: fix this
          data.y = game.objects.view.data.battleField.height - data.height - (280 * (bottomY / 100));

        }

      }

    }

    function checkRespawn() {

      // odd edge case - data not always defined if destroyed at the right time?
      if (data && data.canRespawn && data.dead && objects.bunker && objects.bunker.data && !objects.bunker.data.dead) {
        reset();
      }

    }

    function setEnemy(isEnemy) {

      data.isEnemy = isEnemy;

      if (isEnemy) {
        utils.css.remove(dom.o, css.friendly);
        utils.css.add(dom.o, css.enemy);
      } else {
        utils.css.remove(dom.o, css.enemy);
        utils.css.add(dom.o, css.friendly);
      }

    }

    function detach() {

      if (!data.detached) {

        data.detached = true;

        // and become hostile.
        data.hostile = true;

        // disconnect bunker <-> balloon references
        if (objects.bunker) {
          objects.bunker.nullifyBalloon();
          objects.bunker = null;
        }

      }

    }

    function dead() {

      if (data.dead && dom.o) {
        // hide the balloon
        utils.css.swap(dom.o, css.exploding, css.dead);
      }
      if (data.deadTimer) {
        data.deadTimer = null;
      }

    }

    function die() {

      // pop!
      if (!data.dead) {
        utils.css.add(dom.o, css.exploding);
        if (sounds.balloonExplosion) {
          playSound(sounds.balloonExplosion, exports);
        }
        radarItem.die();
        data.deadTimer = new FrameTimeout(FPS * 0.55, function() {
          dead();
          data.deadTimer = null;
        });
        data.dead = true;
      }

    }

    function animate() {

      if (!data.dead) {

        if (!data.detached) {

          if ((data.bottomY >= 100 && data.verticalDirection > 0) || (data.bottomY <= 0 && data.verticalDirection < 0)) {
            data.verticalDirection *= -1;
          }

          moveTo(data.x, data.bottomY + data.verticalDirection);

        } else {

          data.frameCount++;

          if (data.frameCount % data.windModulus === 0) {

            // TODO: improve, limit on axes

            data.windOffsetX += Math.random() > 0.5 ? -0.5 : 0.5;

            data.windOffsetX = Math.max(-3, Math.min(3, data.windOffsetX));

            if (data.windOffsetX > 0 && data.direction !== 1) {

              // heading right
              utils.css.remove(dom.o, css.facingLeft);
              utils.css.add(dom.o, css.facingRight);

              data.direction = 1;

            } else if (data.windOffsetX < 0 && data.direction !== -1) {

              // heading left

              utils.css.remove(dom.o, css.facingRight);
              utils.css.add(dom.o, css.facingLeft);

              data.direction = -1;

            }

            data.windOffsetY += Math.random() > 0.5 ? -0.1 : 0.1;

            data.windOffsetY = Math.max(-0.5, Math.min(0.5, data.windOffsetY));

            // and randomize
            data.windModulus = 16 + parseInt(Math.random() * 16, 10);

          }

          moveTo(data.x + data.windOffsetX, data.bottomY + data.windOffsetY);

        }

      } else {

        if (data.deadTimer) {
          data.deadTimer.animate();
        }

        if (data.bottomY > 0) {

          // dead, but chain has not retracted yet. Make sure it's moving down.
          if (data.verticalDirection > 0) {
            data.verticalDirection *= -1;
          }

          moveTo(data.x, data.bottomY + data.verticalDirection);

        }

        checkRespawn();

      }

    }

    reset = function() {

      // respawn can actually happen now

      data.energy = data.energyMax;

      // restore default vertical
      data.verticalDirection = data.verticalDirectionDefault;

      // look ma, no longer dead!
      data.dead = false;

      // reset position, too
      data.bottomY = -data.bottomYOffset;
      data.y = bottomAlignedY(data.bottomY);

      radarItem.reset();

      data.canRespawn = false;

      if (data.deadTimer) {
        window.clearTimeout(data.deadTimer);
        data.deadTimer = null;
      }

      // update UI, right away?
      animate();

      utils.css.remove(dom.o, css.exploding);
      utils.css.remove(dom.o, css.dead);

      updateEnergy(exports);

      // presumably, triggered by an infantry.
      playSound(sounds.repairingWrench, exports);

    };

    function init() {

      dom.o = makeSprite({
        className: css.className
      });

      if (data.isEnemy) {
        utils.css.add(dom.o, css.enemy);
      }

      dom.o.style.marginLeft = (data.leftMargin + 'px');

      // TODO: review when balloon gets separated from bunker
      // data.x = options.x; // (objects.bunker ? objects.bunker.data.x : 0);

      // if bottomY is 0, subtract a few percent so the balloon rises from the depths.
      if (data.bottomY === 0) {
        data.bottomY = -data.bottomYOffset;
      }

      moveTo(data.x, data.bottomY);

      // assign .style.left only if not doing a transform
      if (!features.transform.prop) {
        common.setX(exports, data.x);
      }

      common.setBalloonXY(exports, data.bottomY);

      if (!objects.bunker) {
        detach();
      }

      game.dom.world.appendChild(dom.o);

      // TODO: review hacky "can respawn" parameter
      radarItem = game.objects.radar.addItem(exports, dom.o.className, true);

    }

    options = options || {};

    css = inheritCSS({
      className: 'balloon',
      friendly: 'facing-right',
      enemy: 'facing-left',
      facingLeft: 'facing-left',
      facingRight: 'facing-right'
    });

    data = inheritData({
      type: 'balloon',
      bottomAligned: true, // TODO: review/remove
      canRespawn: false,
      frameCount: 0,
      windModulus: 16,
      windOffsetX: 0,
      windOffsetY: 0,
      energy: 3,
      energyMax: 3,
      direction: 0,
      detached: false,
      hostile: false, // dangerous when detached
      verticalDirection: 0.33,
      verticalDirectionDefault: 0.33,
      leftMargin: options.leftMargin || 0,
      width: 38,
      height: 16,
      halfWidth: 19,
      halfHeight: 8,
      deadTimer: null,
      // relative % to pull down when rising from the ground...
      bottomYOffset: 6
    }, options);

    dom = {
      o: null
    };

    objects = {
      bunker: options.bunker || null
    };

    exports = {
      animate: animate,
      data: data,
      detach: detach,
      die: die,
      dom: dom,
      reset: reset,
      setEnemy: setEnemy
    };

    init();

    return exports;

  };

  Bunker = function(options) {

    var css, data, dom, objects, radarItem, exports;

    function createBalloon(useRandomY) {

      if (!objects.balloon) {

        objects.balloon = new Balloon({
          bunker: exports,
          leftMargin: 7,
          isEnemy: data.isEnemy,
          x: data.x,
          // if 0, balloon will "rise from the depths".
          bottomY: (useRandomY ? parseInt(Math.random() * 100, 10) : 0)
        });

        // push onto the larger array
        game.objects.balloons.push(objects.balloon);

      }

      if (!objects.chain) {

        // create a chain, linking the base and the balloon
        objects.chain = new Chain({
          x: data.x + data.halfWidth - 1,
          y: data.y,
          height: data.y - objects.balloon.data.y,
          balloon: objects.balloon,
          bunker: exports
        });

        game.objects.chains.push(objects.chain);

      }

    }

    function capture(isEnemy) {

      if (isEnemy) {

        utils.css.add(dom.o, css.enemy);
        utils.css.add(radarItem.dom.o, css.enemy);

        playSoundWithDelay(sounds.enemyClaim, exports, 500);

      } else {

        utils.css.remove(dom.o, css.enemy);
        utils.css.remove(radarItem.dom.o, css.enemy);

        playSoundWithDelay(sounds.friendlyClaim, exports, 500);

      }

      data.isEnemy = isEnemy;

      // and the balloon, too.
      if (objects.balloon) {
        objects.balloon.setEnemy(isEnemy);
      }

      playSound(sounds.doorClose, exports);

      // check if enemy convoy production should stop or start
      checkProduction();

    }

    function repair() {

      // fix the balloon, if it's broken - or, rather, flag it for respawn.
      if (objects.balloon) {

        if (objects.balloon.data.dead) {
          objects.balloon.data.canRespawn = true;
        }

      } else {

        // make a new one
        createBalloon();

      }

    }

    function nullifyChain() {
      objects.chain = null;
    }

    function nullifyBalloon() {
      objects.balloon = null;
    }

    function detachBalloon() {

      if (objects.balloon) {
        objects.balloon.detach();
        nullifyBalloon();
      }

    }

    function die() {

      if (data.dead) {
        return false;
      }

      utils.css.add(dom.o, css.exploding);

      // detach balloon?
      detachBalloon();

      // timeout?
      window.setTimeout(function() {

        utils.css.swap(dom.o, css.exploding, css.burning);

        window.setTimeout(function() {
          utils.css.swap(dom.o, css.burning, css.dead);
          // nothing else to do here - drop the node reference.
          dom.o = null;
        }, 10000);

      }, 1100);

      data.energy = 0;

      data.dead = true;

      if (sounds.explosionLarge) {
        playSound(sounds.crashAndGlass, exports);
        playSound(sounds.explosionLarge, exports);
      }

      // check if enemy convoy production should stop or start
      checkProduction();

      radarItem.die();

    }

    function infantryHit(target) {

      // an infantry unit has made contact with a bunker.

      if (target.data.isEnemy === data.isEnemy) {

        // a friendly passer-by.

        repair();

      } else {

        // non-friendly, kill the infantry - but let them capture the bunker first.

        if (collisionCheckMidPoint(exports, target)) {

          capture(target.data.isEnemy);
          target.die();

        }

      }

    }

    function init() {

      dom.o = makeSprite({
        className: css.className
      });

      dom.oSubSprite = makeSubSprite();

      dom.oSubSpriteArrow = makeSubSprite(css.arrow);

      dom.o.appendChild(dom.oSubSprite);
      dom.o.appendChild(dom.oSubSpriteArrow);

      if (data.isEnemy) {
        utils.css.add(dom.o, css.enemy);
      }

      // first time, create at random Y location.
      createBalloon(true);

      common.setX(exports, data.x);

      data.midPoint = getDoorCoords(exports);

      game.dom.world.appendChild(dom.o);

      radarItem = game.objects.radar.addItem(exports, dom.o.className);

    }

    options = options || {};

    css = inheritCSS({
      className: 'bunker',
      arrow: 'arrow',
      burning: 'burning'
    });

    data = inheritData({
      type: 'bunker',
      y: worldHeight - 25 + 3, // override to fix helicopter / bunker vertical crash case
      energy: 50,
      energyMax: 50,
      width: 51,
      halfWidth: 25,
      height: 25,
      midPoint: null
    }, options);

    dom = {
      o: null,
      oSubSprite: null,
      oSubSpriteArrow: null
    };

    objects = {
      balloon: null,
      chain: null,
      helicopter: null
    };

    exports = {
      capture: capture,
      objects: objects,
      data: data,
      die: die,
      dom: dom,
      infantryHit: infantryHit,
      nullifyChain: nullifyChain,
      nullifyBalloon: nullifyBalloon,
      init: init,
      repair: repair
    };

    init();

    return exports;

  };

  EndBunker = function(options) {

    var css, dom, data, objects, nearby, exports;

    function setFiring(state) {

      if (state && data.energy) {
        data.firing = state;
      } else {
        data.firing = false;
      }

    }

    function hit(points, target) {

      // only tank gunfire counts against end bunkers.
      if (target && target.data.type === 'gunfire' && target.data.parentType && target.data.parentType === 'tank') {
        data.energy = Math.max(0, data.energy - points);
        updateEnergy(exports);
      }

    }

    function fire() {

      var fireOptions;

      if (data.firing && data.energy && data.frameCount % data.fireModulus === 0) {

        fireOptions = {
          parentType: data.type,
          isEnemy: data.isEnemy,
          collisionItems: nearby.items,
          x: data.x + (data.width + 1),
          y: game.objects.view.data.world.height - data.gunYOffset, // half of height
          vX: 2,
          vY: 0
        };

        objects.gunfire.push(new GunFire(fireOptions));

        // other side
        fireOptions.x = (data.x - 1);

        // and reverse direction
        fireOptions.vX = -2;

        objects.gunfire.push(new GunFire(fireOptions));

        if (sounds.genericGunFire) {
          playSound(sounds.genericGunFire, exports);
        }

      }

    }

    function captureFunds(target) {

      var maxFunds, capturedFunds;

      // you only get to steal so much at a time.
      maxFunds = 20;

      if (data.funds) {

        capturedFunds = Math.min(data.funds, maxFunds);

        if (!tutorialMode) {
          if (data.isEnemy) {
            game.objects.view.setAnnouncement(capturedFunds + ' enemy ' + (capturedFunds > 1 ? 'funds' : 'fund') + ' captured!');
          } else {
            game.objects.view.setAnnouncement('The enemy captured ' + capturedFunds + ' of your funds');
          }
        }

        // who gets the loot?
        if (data.isEnemy) {
          // local player
          game.objects.endBunkers[0].data.funds += capturedFunds;
        } else {
          // CPU
          game.objects.endBunkers[1].data.funds += capturedFunds;
        }

        data.funds -= capturedFunds;

        if (target) {
          target.die(true);
          playSound(sounds.doorClose, exports);
        }

        // force update of the local helicopter
        // TODO: yeah, this is a bit hackish.
        game.objects.helicopters[0].updateStatusUI();

      }

    }

    function animate() {

      var i, offset, earnedFunds;

      data.frameCount++;

      for (i = objects.gunfire.length-1; i >= 0; i--) {
        if (objects.gunfire[i].animate()) {
          // object is dead - take it out.
          objects.gunfire.splice(i, 1);
        }
      }

      nearbyTest(nearby);

      fire();

      if (data.frameCount % data.fundsModulus === 0) {

        if (!objects.helicopter) {
          objects.helicopter = game.objects.helicopters[(data.isEnemy ? 1 : 0)];
        }

        // edge case: tutorial mode, and no enemy chopper present yet
        if (!objects.helicopter) {
          return false;
        }

        // figure out what region the chopper is in, and award funds accordingly. closer to enemy space = more reward.
        offset = objects.helicopter.data.x / game.objects.view.data.battleField.width;

        if (data.isEnemy) {
          offset = 1 - (objects.helicopter.data.x / objects.helicopter.data.x);
        }

        if (offset < 0.33) {
          earnedFunds = 1;
        } else if (offset >= 0.33 && offset < 0.66) {
          earnedFunds = 2;
        } else {
          earnedFunds = 3;
        }

        data.funds += earnedFunds;

        /*
        if (data.isEnemy) {
          console.log('the enemy now has ' + data.funds + ' funds.');
        }
        */

        objects.helicopter.updateStatusUI();

      }

      // note: end bunkers never die, but leaving this in anyway.
      return (data.dead && !dom.o && !objects.gunfire.length);

    }

    function init() {

      dom.o = makeSprite({
        className: css.className
      });

      if (data.isEnemy) {
        utils.css.add(dom.o, css.enemy);
      }

      common.setX(exports, data.x);
      common.setBottomY(exports, data.bottomY);

      game.dom.world.appendChild(dom.o);

      game.objects.radar.addItem(exports, dom.o.className);

    }

    options = options || {};

    css = inheritCSS({
      className: 'end-bunker'
    });

    data = inheritData({
      type: 'end-bunker',
      bottomAligned: true,
      frameCount: 0,
      energy: 0,
      energyMax: 10,
      x: (options.x || (options.isEnemy ? 8192 - 48 : 8)),
      width: 39,
      halfWidth: 19,
      height: 17,
      funds: (!options.isEnemy ? 32 : 0),
      firing: false,
      gunYOffset: 10,
      fireModulus: 4,
      fundsModulus: FPS * 10,
      midPoint: null
    }, options);

    data.midPoint = {
      x: data.x + data.halfWidth + 5,
      y: data.y,
      width: 5,
      height: data.height
    };

    dom = {
      o: null
    };

    objects = {
      gunfire: []
    };

    exports = {
      animate: animate,
      data: data,
      dom: dom,
      hit: hit
    };

    nearby = {
      options: {
        source: exports, // initially undefined
        targets: undefined,
        useLookAhead: true,
        // TODO: rename to something generic?
        hit: function(target) {
          var isFriendly = (target.data.isEnemy === data.isEnemy);
          if (!isFriendly && data.energy) {
            // nearby enemy, and defenses activated? let 'em have it.
            setFiring(true);
          }
          // nearby infantry?
          if (target.data.type === 'infantry') {
            // enemy at door, and funds to steal?
            if (!isFriendly) {
              if (data.funds && collisionCheckMidPoint(exports, target)) {
                captureFunds(target);
              }
            } else if (!data.energy && isFriendly && collisionCheckMidPoint(exports, target)) {
              // end bunker isn't "staffed" / manned by infantry, guns are inoperable.
              // claim infantry, enable guns.
              data.energy = data.energyMax;
              updateEnergy(exports);
              target.die(true);
              playSound(sounds.doorClose, exports);
            }
          }
        },
        miss: function() {
          setFiring(false);
        }
      },
      // who gets fired at?
      items: ['infantry', 'engineers', 'helicopters'],
      targets: []
    };

    init();

    return exports;

  };

  SuperBunker = function(options) {

    var css, dom, data, objects, nearby, radarItem, exports;

    function updateFireModulus() {

      // firing speed increases with # of infantry
      data.fireModulus = 8 - data.energy;

    }

    function capture(isEnemy) {

      if (isEnemy) {

        data.isEnemy = true;

        utils.css.remove(radarItem.dom.o, css.friendly);
        utils.css.add(radarItem.dom.o, css.enemy);

        playSoundWithDelay(sounds.enemyClaim, exports, 500);

      } else {

        data.isEnemy = false;

        utils.css.remove(radarItem.dom.o, css.enemy);
        utils.css.add(dom.o, css.friendly);

        playSoundWithDelay(sounds.friendlyClaim, exports, 500);

      }

      // check if enemy convoy production should stop or start
      checkProduction();

    }

    function setFiring(state) {

      if (state && data.energy) {
        data.firing = state;
      } else {
        data.firing = false;
      }

    }

    function hit(points, target) {

      // only tank gunfire counts against super bunkers.
      if (target && target.data.type === 'gunfire' && target.data.parentType && target.data.parentType === 'tank') {
        data.energy = Math.max(0, data.energy - points);
        updateFireModulus();
        updateEnergy(exports);
      }

    }

    function die() {

      if (data.dead) {
        return false;
      }

      // gunfire from both sides should now hit this element.

      data.energy = 0;
      updateFireModulus();

      // this object, in fact, never actually dies because it only becomes neutral/hostile and can still be hit.
      data.dead = false;

      data.hostile = true;

      updateEnergy(exports);

      // check if enemy convoy production should stop or start
      checkProduction();

    }

    function fire() {

      var fireOptions;

      if (data.firing && data.energy !== 0 && data.frameCount % data.fireModulus === 0) {

        fireOptions = {
          parentType: data.type,
          isEnemy: data.isEnemy,
          collisionItems: nearby.items,
          x: data.x + (data.width + 1),
          y: game.objects.view.data.world.height - data.gunYOffset, // half of height
          vX: 2,
          vY: 0
        };

        objects.gunfire.push(new GunFire(fireOptions));

        // other side
        fireOptions.x = (data.x - 1);

        // and reverse direction
        fireOptions.vX = -2;

        objects.gunfire.push(new GunFire(fireOptions));

        if (sounds.genericGunFire) {
          playSound(sounds.genericGunFire, exports);
        }

      }

    }

    function animate() {

      var i;

      data.frameCount++;

      for (i = objects.gunfire.length-1; i >= 0; i--) {
        if (objects.gunfire[i].animate()) {
          // object is dead - take it out.
          objects.gunfire.splice(i, 1);
        }
      }

      // start, or stop firing?
      nearbyTest(nearby);

      fire();

      // note: super bunkers never die, but leaving this in anyway.
      return (!dom.o && !objects.gunfire.length);

    }

    function init() {

      dom.o = makeSprite({
        className: css.className
      });

      if (data.isEnemy) {
        utils.css.add(dom.o, css.enemy);
      }

      common.setX(exports, data.x);
      common.setBottomY(exports, data.bottomY);

      game.dom.world.appendChild(dom.o);

      radarItem = game.objects.radar.addItem(exports, dom.o.className);

    }

    options = options || {};

    css = inheritCSS({
      className: 'super-bunker',
      friendly: 'friendly'
    });

    data = inheritData({
      type: 'super-bunker',
      y: 358,
      frameCount: 0,
      energy: (options.energy || 0),
      energyMax: 5, // note: +/- depending on friendly vs. enemy infantry
      isEnemy: (options.isEnemy || false),
      width: 66,
      halfWidth: 33,
      height: 28,
      firing: false,
      gunYOffset: 9,
      // fire speed relative to # of infantry arming it
      fireModulus: 8 - (options.energy || 0),
      fundsModulus: FPS * 10,
      hostile: false,
      midPoint: null
    }, options);

    if (data.energy === 0) {
      // initially neutral/hostile only if 0 energy
      data.hostile = true;
    }

    data.midPoint = {
      x: data.x + data.halfWidth + 5,
      y: data.y,
      width: 5,
      height: data.height
    };

    dom = {
      o: null
    };

    objects = {
      gunfire: []
    };

    exports = {
      animate: animate,
      capture: capture,
      data: data,
      die: die,
      dom: dom,
      hit: hit
    };

    nearby = {

      options: {

        source: exports, // initially undefined
        targets: undefined,
        useLookAhead: true,

        hit: function(target) {

          var isFriendly = (target.data.isEnemy === data.isEnemy);

          if (!isFriendly && data.energy > 0) {
            // nearby enemy, and defenses activated? let 'em have it.
            setFiring(true);
          }

          // gunfire from a tank? decrement energy until dead.

          if (target.data.type === 'gunfire' && target.data.parentType && target.data.parentType === 'tank') {

            // limit to +/- range.
            data.energy = Math.min(data.energyMax, data.energy-1);

            // small detail: firing speed relative to # of infantry
            updateFireModulus();

            if (data.energy === 0) {

              // un-manned, but dangerous to helicopters on both sides.
              data.hostile = true;

            }

          } else if (target.data.type === 'infantry') {

            // super bunkers can hold up to five men. only interact if not full (and friendly), OR an opposing, non-friendly infantry.

            if (data.energy < data.energyMax || !isFriendly) {

              // infantry at door? contribute to capture, or arm base, depending.

              if (collisionCheckMidPoint(exports, target)) {

                // claim infantry, change "alignment" depending on friendliness.

                if (data.energy === 0) {

                  // claimed by infantry, switching sides from neutral/hostile.
                  data.hostile = false;

                  // ensure that if we were dead, we aren't any more.
                  data.dead = false;

                  // super bunker can be enemy, hostile or friendly. for now, we only care about enemy / friendly.
                  if (target.data.isEnemy) {

                    capture(true);

                  } else {

                    capture(false);

                  }

                }

                // add or subtract energy, depending on alignment.
                // explicitly-verbose check, for legibility.

                if (data.isEnemy) {

                  // enemy-owned....
                  if (target.data.isEnemy) {
                    // friendly passer-by.
                    data.energy++;
                  } else {
                    data.energy--;
                  }

                } else {

                  // player-owned...
                  if (!target.data.isEnemy) {
                    data.energy++;
                  } else {
                    data.energy--;
                  }

                }

                // limit to +/- range.
                data.energy = Math.min(data.energyMax, data.energy);

                // small detail: firing speed relative to # of infantry
                updateFireModulus();

                if (data.energy === 0) {

                  // un-manned, but dangerous to helicopters on both sides.
                  data.hostile = true;

                  utils.css.remove(radarItem.dom.o, css.friendly);
                  utils.css.add(radarItem.dom.o, css.enemy);

                }

                // "claim" the infantry, kill if enemy and man the bunker if friendly.
                target.die(true);

                playSound(sounds.doorClose, target.data.exports);

                updateEnergy(exports);

              }

            }

          }

        },

        miss: function() {
          setFiring(false);
        }

      },

      // who gets fired at?
      items: ['infantry', 'engineers', 'missileLaunchers', 'vans', 'helicopters'],
      targets: []

    };

    init();

    return exports;

  };

  Turret = function(options) {

    var css, data, dom, objects, radarItem, collisionItems, targets, exports;

    function okToMove() {

      // guns scan and fire 100% of the time, OR a random percent bias based on the amount of damage they've sustained. No less than 25% of the time.

      if (data.energy === 0) {
        return false;
      }

      return (data.energy === data.energyMax || (1 - Math.random() < (Math.max(0.25, data.energy / data.energyMax))));

    }

    function setAngle(angle) {

      if (features.transform.prop) {
        dom.oSubSprite.style[features.transform.prop] = 'rotate(' + angle + 'deg)';
      }

    }

    function scan() {

      if (features.transform.prop && okToMove()) {
        data.angle += data.scanIncrement;
        if (data.angle > data.maxAngle || data.angle < -data.maxAngle) {
          data.scanIncrement *= -1;
        }
        setAngle(data.angle);
      }

    }

    function fire() {

      var deltaX, deltaY, deltaXGretzky, deltaYGretzky, angle, otherTargets, target, moveOK;

      target = enemyHelicopterNearby(data, game.objects.view.data.browser.fractionWidth);

      // alternate target(s) within range?
      if (!target && targets) {

        otherTargets = enemyNearby(data, targets, game.objects.view.data.browser.fractionWidth);

        if (otherTargets.length) {

          // take first target as closest?
          // TODO: sort by closest distance?
          target = otherTargets[0];

        }

      }

      if (target) {

        data.firing = true;

        deltaX = target.data.x - data.x;
        deltaY = target.data.y - data.y;

        // Gretzky: "Skate where the puck is going to be".
        deltaXGretzky = target.data.vX;
        deltaYGretzky = target.data.vY;

        // turret angle
        angle = (Math.atan2(deltaY, deltaX) * deg2Rad) + 90;
        angle = Math.max(-data.maxAngle, Math.min(data.maxAngle, angle));

        // hack: target directly to left, on ground of turret: correct 90 to -90 degrees.
        if (deltaX < 0 && angle === 90) {
          angle = -90;
        }

        moveOK = okToMove();

        if (data.frameCount % data.fireModulus === 0 && moveOK) {

          objects.gunfire.push(new GunFire({
            parentType: data.type,
            isEnemy: data.isEnemy,
            // turret gunfire mostly hits airborne things.
            collisionItems: collisionItems,
            x: data.x + data.width + 2 + (deltaX * 0.05),
            y: bottomAlignedY() + 8 + (deltaY * 0.05),
            vX: deltaX * 0.05 + deltaXGretzky,
            vY: Math.min(0, deltaY * 0.05 + deltaYGretzky)
          }));

          if (sounds.turretGunFire) {
            playSound(sounds.turretGunFire, exports);
          }

        }

        // target the enemy
        data.angle = angle;
        if (moveOK) {
          setAngle(angle);
        }

      } else {

        data.firing = false;

      }

    }

    function die(silent) {

      if (data.dead) {
        return false;
      }

      // reset rotation
      data.angle = 0;
      setAngle(0);

      utils.css.add(dom.o, css.destroyed);
      utils.css.add(radarItem.dom.o, css.destroyed);

      data.energy = 0;

      data.dead = true;

      updateEnergy(exports);

      if (!silent) {
        playSound(sounds.metalHitBreak, exports);
      }

    }

    function restore() {

      // restore visual, but don't re-activate gun yet
      if (data.dead && data.energy === 0) {

        utils.css.remove(dom.o, css.destroyed);
        utils.css.remove(radarItem.dom.o, css.destroyed);

        playSound(sounds.popSound, exports);

      }

    }

    function isEngineerInteracting() {

      return (data.engineerInteracting && data.energy < data.energyMax);

    }

    function repair(complete) {

      var result = false;

      if (data.energy < data.energyMax) {

        if (data.frameCount % data.repairModulus === 0 || complete) {

          restore();

          data.lastEnergy = data.energy;

          data.energy = (complete ? data.energyMax : Math.min(data.energyMax, data.energy + 1));

          if (data.dead && data.energy > data.energyMax * 0.25) {
            // restore to life at 25%
            data.dead = false;
          }

          updateEnergy(exports);

        }

        result = true;

      } else {

        // only stop sound once, when repair finishes
        if (data.lastEnergy < data.energy) {
          sounds.tinkerWrench.sound.stop();
          data.lastEnergy = data.energy;
        }

      }

      return result;

    }

    function setEnemy(isEnemy) {

      if (data.isEnemy !== isEnemy) {

        data.isEnemy = isEnemy;

        utils.css[isEnemy ? 'add' : 'remove'](dom.o, css.enemy);

        playSoundWithDelay((isEnemy ? sounds.enemyClaim : sounds.friendlyClaim), exports, 500);

      }

    }

    function claim(isEnemy) {

      if (data.frameCount % data.claimModulus === 0) {

        data.claimPoints++;

        if (data.claimPoints >= data.claimPointsMax) {
          // change sides.
          setEnemy(isEnemy);
          data.claimPoints = 0;
        }

      }

    }

    function engineerHit(target) {

      // target is an engineer; either repairing, or claiming.

      data.engineerInteracting = true;

      if (data.isEnemy !== target.data.isEnemy) {
        
        // gradual take-over.
        claim(target.data.isEnemy);

      } else {

        repair();

      }

      // play repair sounds?
      playRepairingWrench(isEngineerInteracting, exports);

      // playImpactWrench(isEngineerInteracting, exports);

      playTinkerWrench(isEngineerInteracting, exports);

    }

    function engineerCanInteract(isEnemy) {

      // passing engineers should only stop if they have work to do.
      return (data.isEnemy !== isEnemy || data.energy < data.energyMax);

    }

    function animate() {

      var i;

      data.frameCount++;

      if (data.frameCount % data.scanModulus === 0) {
        if (!data.dead) {
          fire();
        }
        // workaround: allow scanning while being repaired
        if (!data.firing || data.energy > 0) {
          scan();
        }
      }

      if (data.energy > 0 && data.energy < data.energyMax && data.frameCount % data.smokeModulus === 0) {

        // smoke relative to damage

        if (Math.random() > 1 - ((data.energyMax-data.energy)/data.energyMax)) {

          game.objects.smoke.push(new Smoke({
            x: data.x + data.halfWidth + (parseInt(Math.random() * data.halfWidth * 0.5 * (Math.random() > 0.5 ? -1 : 1), 10)),
            y: data.y + data.halfHeight + (parseInt(Math.random() * data.halfHeight * 0.5 * (Math.random() > 0.5 ? -1 : 1), 10))
          }));

        }

        // randomize next one a bit
        data.smokeModulus = 2 + parseInt(Math.random() * FPS, 10);

      }

      if (!data.dead && data.energy > 0 && data.frameCount % data.repairModulus === 0) {
        // self-repair
        repair();
      }

      // engineer interaction flag
      if (data.engineerInteracting) {
        data.engineerInteracting = false;
      }

      for (i = objects.gunfire.length-1; i >= 0; i--) {
        if (objects.gunfire[i].animate()) {
          // object is dead - take it out.
          objects.gunfire.splice(i, 1);
        }
      }

    }

    function init() {

      dom.o = makeSprite({
        className: css.className
      });

      dom.oSubSprite = makeSubSprite();
      dom.o.appendChild(dom.oSubSprite);

      common.setX(exports, data.x);
      common.setY(exports, data.y);

      if (data.isEnemy) {
        utils.css.add(dom.o, css.enemy);
      }

      game.dom.world.appendChild(dom.o);

      radarItem = game.objects.radar.addItem(exports, dom.o.className);

    }

    collisionItems = ['helicopters', 'balloons', 'parachuteInfantry'];

    if (gameType === 'hard' || gameType === 'extreme') {
      // additional challenge: make turret gunfire dangerous to some ground units, too.
      collisionItems = collisionItems.concat(['tanks', 'vans', 'infantry', 'missileLaunchers', 'bunkers', 'superBunkers']);
    }

    if (gameType === 'extreme') {
      // additional challenge: make turret go after ground vehicles, as well. also, just to be extra-mean: smart missiles.
      targets = ['tanks', 'vans', 'missileLaunchers', 'smartMissiles'];
      // also: engineers will not be targeted, but can be hit.
      collisionItems = collisionItems.concat(['engineers', 'smartmissiles']);
    }

    options = options || {};

    css = inheritCSS({
      className: 'turret',
      destroyed: 'destroyed'
    });

    data = inheritData({
      type: 'turret',
      bottomAligned: true,
      dead: false,
      energy: 50,
      energyMax: 50,
      lastEnergy: 50,
      firing: false,
      frameCount: 2 * game.objects.turrets.length, // stagger so sound effects interleave nicely
      fireModulus: (tutorialMode ? 12 : (gameType === 'extreme' ? 2 : (gameType === 'hard' ? 3 : 6))), // a little easier in tutorial mode vs. hard vs. easy modes
      scanModulus: 1,
      claimModulus: 8,
      repairModulus: FPS,
      smokeModulus: 2,
      claimPoints: 0,
      claimPointsMax: 50,
      engineerInteracting: false,
      y: 0,
      width: 6,
      height: 15,
      // hacks
      halfWidth: 7,
      halfHeight: 7,
      angle: 0,
      maxAngle: 90,
      scanIncrement: 0
    }, options);

    // how fast to "scan" (left -> right, and back)
    data.scanIncrement = (90 * data.scanModulus/FPS);

    dom = {
      o: null,
      oSubSprite: null
    };

    objects = {
      gunfire: []
    };

    exports = {
      animate: animate,
      data: data,
      die: die,
      dom: dom,
      engineerCanInteract: engineerCanInteract,
      engineerHit: engineerHit,
      restore: restore,
      repair: repair
    };

    init();

    // "dead on arrival"
    if (options.DOA) {
      die(true);
    }

    return exports;

  };

  Base = function(options) {

    var css, data, dom, exports;

    function fire() {

      var targetHelicopter = enemyHelicopterNearby(data, game.objects.view.data.browser.fractionWidth);

      if (targetHelicopter) {

        game.objects.smartMissiles.push(new SmartMissile({
          parentType: data.type,
          isEnemy: data.isEnemy,
          isRubberChicken: true, // because why not, it's a special case anyway
          x: data.x + data.width/2,
          y: bottomAlignedY() - data.height/2,
          target: targetHelicopter
        }));

      }

    }

    function die() {

      var counter = 0, counterMax = 30;

      data.dead = true;

      // move to the target
      // TODO: transition
      game.objects.view.setLeftScroll(game.objects.view.data.battleField.width * (data.isEnemy ? 1 : -1));

      // disable view + helicopter events?
      // TODO: make this a method; cleaner, etc.
      game.objects.view.data.ignoreMouseEvents = true;
      game.objects.helicopters[0].data.ignoreMouseEvents = true;

      function randomCount() {
        return (15 + parseInt(Math.random() * 15, 10));
      }

      function randomVelocity() {
        return (5 + parseInt(Math.random() * 10, 10));
      }

      function boom() {

        shrapnelExplosion(data, {
          count: randomCount(),
          velocity: randomVelocity(),
          randomX: true
        });

        // make a noise?
        if (sounds.genericExplosion) {
          playSound(sounds.genericExplosion, exports);
        }

        counter++;

        if (counter >= counterMax) {

          // HUGE boom, why not.
          window.setTimeout(function() {

            if (sounds.genericExplosion) {
              playSound(sounds.genericExplosion, exports);
              playSound(sounds.genericExplosion, exports);
              playSound(sounds.genericExplosion, exports);
            }

            window.setTimeout(function() {

              var i;

              for (i=0; i<7; i++) {

                shrapnelExplosion(data, {
                  count: 60,
                  velocity: 20,
                  randomX: true
                });

              }

            }, 25);

          }, 3500);

        } else {

          // big boom
          window.setTimeout(boom, 20 + parseInt(Math.random() * 350, 10));

        }

      }

      document.getElementById('game-tips-list').innerHTML = '';

      boom();

    }

    function animate() {

      if (!data.dead) {

        if (data.frameCount % data.fireModulus === 0) {
          fire();
        }

        data.frameCount++;

      }

    }

    function init() {

      dom.o = makeSprite({
        className: css.className
      });

      if (data.isEnemy) {
        utils.css.add(dom.o, css.enemy);
      }

      common.setX(exports, data.x);
      common.setBottomY(exports, data.bottomY);

      game.dom.world.appendChild(dom.o);

      game.objects.radar.addItem(exports, dom.o.className);

    }

    options = options || {};

    css = inheritCSS({
      className: 'base'
    });

    data = inheritData({
      type: 'base',
      bottomAligned: true,
      dead: false,
      frameCount: 0,
      fireModulus: tutorialMode ? FPS * 5 : FPS * 2,
      // left side, or right side (roughly)
      x: (options.x || (options.isEnemy ? 8192 - 192: 64)),
      y: 0,
      bottomY: (options.bottomY || 0),
      width: 125,
      height: 34,
      halfWidth: 62,
      halfHeight: 17,
      // bases don't move, but these are for explosions.
      vX: 0,
      vY: 0
    }, options);

    dom = {
      o: null
    };

    exports = {
      animate: animate,
      data: data,
      dom: dom,
      die: die
    };

    init();

    return exports;

  };

  Chain = function(options) {

    var css, data, dom, objects, exports;

    function setHeight(height) {
      if (height >= 0) {
        dom.o.style.height = (height + 'px');
      }
    }

    function moveTo(x, y, height) {

      if (x !== undefined && data.x !== x) {
        common.setX(exports, x);
        data.x = x;
      }

      if (y !== undefined && data.y !== y) {
        common.setY(exports, y);
        data.y = y;
      }

      if (height !== undefined && data.height !== height) {
        setHeight(height);
        data.height = height;
      }

    }

    function die() {

      if (data.dead) {
        return false;
      }

      removeNodes(dom);

      data.energy = 0;

      data.dead = true;

      // detach balloon, if applicable
      if (objects.balloon) {
        objects.balloon.detach();
        objects.balloon = null;
      }

      // remove bunker reference, too
      if (objects.bunker) {
        objects.bunker.nullifyChain();
        objects.bunker = null;
      }

    }

    function animate() {

      var x, y, height;

      x = data.x;
      y = data.y;

      height = data.height;

      // special case: animate every frame if detached from bunker and attached to balloon.

      // (!objects.bunker || objects.bunker.data.dead) && objects.balloon)

        // move if attached, fall if not

      if (objects.bunker && !objects.bunker.data.dead) {

        // bunker

        data.isEnemy = objects.bunker.data.isEnemy;

        if (objects.balloon) {

          // + balloon

          y = objects.balloon.data.y + objects.balloon.data.height;

          height = worldHeight - y - objects.bunker.data.height + 4;

        } else {

          // - balloon

          y = worldHeight - data.height;

        }

      } else {

        // no bunker

        data.hostile = true;

        if (objects.balloon && !objects.balloon.data.dead) {

          x = objects.balloon.data.x + objects.balloon.data.halfWidth + 5;

          y = objects.balloon.data.y + objects.balloon.data.height;

        } else {

          // free-falling chain
          y = data.y;

          y += 2;

          if (y >= worldHeight + 2) {
            die();
          }

        }

      }

      if (dom.o) {

        moveTo(x, y, height);

      }

      data.frameCount++;

      return (data.dead && !data.o);

    }

    function init() {

      dom.o = makeSprite({
        className: css.className
      });

      if (data.isEnemy) {
        utils.css.add(dom.o, css.enemy);
      }

      common.setX(exports, data.x);
      common.setY(exports, data.y);

      setHeight(data.height);

      game.dom.world.appendChild(dom.o);

    }

    options = options || {};

    css = inheritCSS({
      className: 'chain'
    });

    data = inheritData({
      type: 'chain',
      energy: 1,
      hostile: false, // applies when detached from base or balloon
      width: 1,
      height: 0,
      frameCount: 0,
      damagePoints: 6
    }, options);

    dom = {
      o: null
    };

    objects = {
      bunker: options.bunker || null,
      balloon: options.balloon || null
    };

    exports = {
      animate: animate,
      data: data,
      dom: dom,
      die: die
    };

    init();

    return exports;

  };

  MissileLauncher = function(options) {

    var css, data, dom, radarItem, exports;

    function moveTo(x, bottomY) {

      if (x !== undefined && data.x !== x) {
        common.setX(exports, x);
        data.x = x;
      }

      if (bottomY !== undefined && data.bottomY !== bottomY) {
        common.setBottomY(bottomY);
        data.bottomY = bottomY;
        data.y = bottomAlignedY(bottomY);
      }

    }

    function die() {

      if (data.dead) {
        return false;
      }

      utils.css.add(dom.o, css.exploding);

      // timeout?
      window.setTimeout(function() {
        removeNodes(dom);
      }, 1000);

      data.energy = 0;

      data.dead = true;

      radarItem.die();

      if (sounds.genericExplosion) {
        playSound(sounds.genericExplosion, exports);
      }

    }

    function fire() {

      var i, j, similarMissileCount, targetHelicopter;

      if (data.frameCount % data.fireModulus === 0) {

        // is an enemy helicopter nearby?

        targetHelicopter = enemyHelicopterNearby(data);

        if (targetHelicopter) {

          // we have a possible target.

          // any missiles already chasing the target?
          similarMissileCount = 0;

          for (i=0, j=game.objects.smartMissiles.length; i<j; i++) {

            if (game.objects.smartMissiles[i].objects.target === targetHelicopter) {
              similarMissileCount++;
            }

          }

          if (!similarMissileCount) {

            // self-destruct, FIRE ZE MISSILE
            die();

            game.objects.smartMissiles.push(new SmartMissile({
              parentType: data.type,
              isEnemy: data.isEnemy,
              x: data.x + data.width/2,
              y: bottomAlignedY(),
              target: targetHelicopter
            }));

          }

        }

      }

    }

    function animate() {

      data.frameCount++;

      if (data.frameTimeout) {
        data.frameTimeout.animate();
      }

      if (!data.dead) {

        moveTo(data.x + data.vX, data.bottomY);

        if (data.orderComplete) {

          // regular timer or back wheel bump
          if (data.frameCount % data.stateModulus === 0) {

            data.state++;

            if (data.state > data.stateMax) {
              data.state = 0;
            }

            // reset frameCount (timer)
            data.frameCount = 0;

            // first wheel, delay, then a few frames until we animate the next two.
            if (data.state === 1 || data.state === 3) {
              data.stateModulus = 36;
            } else {
              data.stateModulus = 4;
            }

            data.frameCount = 0;

            dom.o.style.backgroundPosition = '0px ' + (data.height * data.state * -1) + 'px';

          } else if (data.frameCount % data.stateModulus === 2) {

            // next frame - reset.
            dom.o.style.backgroundPosition = '0px 0px';

          }

        }

        // (maybe) fire?
        fire();

      }

      return (data.dead && !dom.o);

    }

    function init() {

      dom.o = makeSprite({
        className: css.className
      });

      if (data.isEnemy) {
        utils.css.add(dom.o, css.enemy);
      }

      common.setX(exports, data.x);
      common.setBottomY(exports, data.bottomY);

      data.frameTimeout = new FrameTimeout(FPS * 2, function() {

        // hackish redraw fix for Chrome, where backgroundPosition otherwise doesn't take effect.
        if (dom.o && features.transform.prop) {
          dom.o.style.left = data.x + 'px';
          dom.o.style.top = (data.y-2) + 'px';
        }

        data.orderComplete = true;
        data.frameTimeout = null;

      });

      game.dom.world.appendChild(dom.o);

      radarItem = game.objects.radar.addItem(exports, dom.o.className);

    }

    options = options || {};

    css = inheritCSS({
      className: 'missile-launcher'
    });

    data = inheritData({
      type: 'missile-launcher',
      bottomAligned: true,
      energy: 3,
      energyMax: 3,
      direction: 0,
      vX: (options.isEnemy ? -1 : 1),
      frameCount: 0,
      frameTimeout: null,
      fireModulus: FPS, // check every second or so
      width: 54,
      height: 18,
      orderComplete: false,
      state: 0,
      stateMax: 3,
      stateModulus: 38,
      inventory: {
        frameCount: 60,
        cost: 3
      }
    }, options);

    dom = {
      o: null
    };

    exports = {
      animate: animate,
      data: data,
      dom: dom,
      die: die
    };

    if (!options.noInit) {
      init();
    }

    return exports;

  };

  GunFire = function(options) {

    var css, data, dom, collision, exports, frameTimeout, radarItem;

    options = options || {};

    function randomDistance() {
      return ((parseInt(Math.random() * 10, 10) * Math.random() > 0.5 ? -1 : 1) + 'px');
    }

    function spark() {

      utils.css.add(dom.o, css.spark);

      // randomize a little

      if (Math.random() > 0.5) {
        dom.o.style.marginLeft = randomDistance();
      }

      if (Math.random() > 0.5) {
        dom.o.style.marginTop = randomDistance();
      }

    }

    function die() {

      // aieee!

      if (!dom.o) {
        return false;
      }

      removeNodes(dom);

      data.dead = true;

      radarItem.die({
        silent: true
      });

    }

    function sparkAndDie(target) {

      // TODO: reduce timers
      spark();

      // hack: no more animation.
      // data.dead = true;

      utils.css.add(dom.o, css.dead);

      if (target) {

        // special case: tanks hit turrets for a lot of damage.
        if (data.parentType === 'tank' && target.data.type === 'turret') {
          data.damagePoints = 5;
        }

        // special case: tanks are impervious to infantry gunfire, end-bunkers and super-bunkers are impervious to helicopter gunfire.
        if (!(data.parentType === 'infantry' && target.data.type === 'tank') && !(data.parentType === 'helicopter' && (target.data.type === 'end-bunker' || target.data.type === 'super-bunker'))) {
          common.hit(target, data.damagePoints, exports);
        }

        // play a sound for certain targets and source -> target combinations
        if (
          target.data.type === 'tank'
          || target.data.type === 'helicopter'
          || target.data.type === 'van'
          || target.data.type === 'bunker'
          || target.data.type === 'end-bunker'
          || target.data.type === 'super-bunker'
          // helicopter -> turret
          || (data.parentType === 'helicopter' && target.data.type === 'turret')
        ) {

          playSound(sounds.metalHit, exports);

        } else if (
          target.data.type === 'balloon'
          || target.data.type === 'turret'
        ) {

          playSound(sounds.metalHitLight, exports);

        }

      }

      // and cleanup shortly.
      frameTimeout = new FrameTimeout(FPS * 0.25, function() {
        die();
        frameTimeout = null;
      });

    }

    function moveTo(x, y) {

      if (x !== undefined && data.x !== x) {
        data.x = x;
      }

      if (y !== undefined && data.y !== y) {
        data.y = y;
      }

      common.setTransformXY(dom.o, x + 'px', y + 'px');

    }

    function animate() {

      if (frameTimeout) {
        // pending die()
        frameTimeout.animate();
        return false;
      }

      if (data.dead) {
        return true;
      }

      if (!data.expired && data.frameCount > data.expireFrameCount) {
        utils.css.add(dom.o, css.expired);
        utils.css.add(radarItem.dom.o, css.expired);
        data.expired = true;
      }

      if (data.expired) {
        data.gravity *= 1.1;
      }

      moveTo(data.x + data.vX, data.y + data.vY + (data.expired ? data.gravity : 0));

      data.frameCount++;

      if (data.frameCount >= data.dieFrameCount) {
        die();
      }

      // bottom?
      if (data.y > game.objects.view.data.battleField.height) {
        die();
      }

      collisionTest(collision, exports);

      // notify caller if now dead and can be removed.
      return (data.dead && !dom.o);

    }

    function init() {

      dom.o = makeSprite({
        className: css.className
      });

      common.setTransformXY(dom.o, data.x + 'px', data.y + 'px');

      // hack?
      if (features.transform.prop) {
        dom.o.style.left = dom.o.style.top = '0px';
      }

      dom.o = game.dom.world.appendChild(dom.o);

      radarItem = game.objects.radar.addItem(exports, dom.o.className);

      if (data.isEnemy) {
        utils.css.add(radarItem.dom.o, css.enemy);
      }

    }

    css = inheritCSS({
      className: 'gunfire',
      expired: 'expired',
      spark: 'spark'
    });

    data = inheritData({
      type: 'gunfire',
      parentType: options.parentType || null,
      isEnemy: options.isEnemy,
      expired: false,
      frameCount: 0,
      expireFrameCount: options.expireFrameCount || 25,
      dieFrameCount: options.dieFrameCount || 75, // live up to N frames, then die?
      width: 2,
      height: 1,
      gravity: 1,
      damagePoints: options.damagePoints || 1
    }, options);

    dom = {
      o: null
    };

    collision = {
      options: {
        source: exports, // initially undefined
        targets: undefined,
        hit: function(target) {
          // special case: let tank gunfire pass thru if 0 energy, or friendly.
          if (!(data.parentType === 'tank' && target.data.type === 'end-bunker' && (target.data.energy === 0 || target.data.isEnemy === data.isEnemy))) {
            sparkAndDie(target);
          }
        }
      },
      // if unspecified, use default list of items which bullets can hit.
      items: options.collisionItems || ['tanks', 'vans', 'bunkers', 'missileLaunchers', 'infantry', 'parachuteInfantry', 'engineers', 'helicopters', 'balloons', 'smartMissiles', 'endBunkers', 'superBunkers', 'turrets']
    };

    exports = {
      animate: animate,
      data: data,
      die: die
    };

    init();

    return exports;

  };

  Bomb = function(options) {

    var css, data, dom, collision, radarItem, exports;

    function moveTo(x, y) {

      if (x !== undefined && data.x !== x) {
        common.setX(exports, x);
        data.x = x;
      }

      if (y !== undefined && data.y !== y) {
        common.setY(exports, y);
        data.y = y;
      }

    }

    function die(options) {

      // aieee!

      var className;

      if (data.dead) {
        return false;
      }

      options = options || {};

      // possible hit, blowing something up.

      if (!options.omitSound && sounds.genericBoom) {
        playSound(sounds.genericBoom, exports);
      }

      // bombs blow up big on the ground, and "spark" on other things.
      className = (!options.spark ? css.explosionLarge : css.spark);

      if (options.bottomAlign) {

        // stick this explosion to the bottom.
        className += ' bottom-align';

      } else if (options.extraY) {

        // move bomb spark a few pixels down so it's in the body of the target. applies mostly to tanks.
        data.y += 3 + parseInt(Math.random() * 3, 10);
        moveTo(data.x + data.vX, data.y + data.vY + data.gravity);

      }

      if (dom.o) {
        utils.css.add(dom.o, className);
        data.deadTimer = new FrameTimeout(FPS * 0.5, function() {
          removeNodes(dom);
          data.deadTimer = null;
        });
      }

      data.dead = true;

      if (radarItem) {
        radarItem.die({
          silent: true
        });
      }

    }

    function bombHitTarget(target) {

      var isSpark,
          damagePoints;

      // assume default
      damagePoints = data.damagePoints;

      if (target.data.type && target.data.type === 'balloon') {

        die({
          omitSound: true,
          spark: true
        });

      } else {

        // certain targets should get a spark vs. a large explosion
        isSpark = target.data.type && target.data.type.match(/balloon|helicopter|tank|van|missileLauncher|parachuteInfantry|bunker|turret/i);

        die({
          spark: isSpark,
          bottomAlign: !isSpark,
          // and a few extra pixels down, for tanks (visual correction vs. boxy collision math)
          extraY: (target.data.type && target.data.type.match(/tank/i) ? 3 + parseInt(Math.random() * 3, 10) : 0)
        });

      }

      // special cases for bomb -> target interactions
      if (target.data.type) {

        if (target.data.type === 'helicopter') {

          // one bomb kills a helicopter.
          damagePoints = target.data.energyMax;

        } else if (target.data.type === 'turret') {

          // bombs do more damage on turrets.
          damagePoints = 10;

        }

      }

      common.hit(target, damagePoints);

    }

    function animate() {

      if (!data.dead) {

        if (data.firstFrame) {
          // trigger CSS animation on first frame
          utils.css.add(dom.o, css.dropping);
          data.firstFrame = false;
        }

        data.gravity *= 1.1;

        moveTo(data.x + data.vX, data.y + data.vY + data.gravity);

        // collision check?

        // hit bottom?
        if (data.y - data.height > game.objects.view.data.battleField.height) {
          die({
            bottomAlign: true
          });
        }

        collisionTest(collision, exports);

      } else if (data.deadTimer) {

        data.deadTimer.animate();

      }

      // notify caller if dead, and node has been removed.
      return (data.dead && !data.deadTimer && !dom.o);

    }

    function init() {

      dom.o = makeSprite({
        className: css.className
      });

      common.setX(exports, data.x);
      common.setY(exports, data.y);

      // hack?
      if (features.transform.prop) {
        dom.o.style.left = data.x + 'px';
        dom.o.style.top = data.y + 'px';
        // dom.o.style.left = dom.o.style.top = '0px';
      }

      game.dom.world.appendChild(dom.o);

      // TODO: don't create radar items for bombs from enemy helicopter when cloaked
      radarItem = game.objects.radar.addItem(exports, dom.o.className);

      if (data.isEnemy) {
        utils.css.add(radarItem.dom.o, css.enemy);
      }

    }

    options = options || {};

    css = inheritCSS({
      className: 'bomb',
      dropping: 'dropping',
      explosionLarge: 'explosion-large',
      spark: 'spark'
    });

    data = inheritData({
      type: 'bomb',
      deadTimer: null,
      firstFrame: true,
      width: 13,
      height: 12,
      gravity: 1,
      damagePoints: 3,
      vX: (options.vX || 0)
    }, options);

    dom = {
      o: null
    };

    collision = {
      options: {
        source: exports, // initially undefined
        targets: undefined,
        hit: function(target) {
          bombHitTarget(target);
        }
      },
      items: ['balloons', 'tanks', 'vans', 'missileLaunchers', 'infantry', 'parachuteInfantry', 'engineers', 'bunkers', 'superBunkers', 'helicopters', 'turrets']
    };

    exports = {
      animate: animate,
      data: data,
      die: die,
      dom: dom
    };

    init();

    return exports;

  };

  Cloud = function(options) {

    var css, dom, data, exports;

    function moveTo(x, y) {

      if (x !== undefined && data.x !== x) {
        data.x = x;
      }

      if (y !== undefined && data.y !== y) {
        data.y = y;
      }

      common.setTransformXY(dom.o, data.x + 'px', data.y + 'px');

    }

    function animate() {

      data.frameCount++;

      if (data.frameCount % data.windModulus === 0) {

        // TODO: improve, limit on axes

        data.windOffsetX += (data.x < 0 || Math.random() > 0.5 ? 0.5 : -0.5);

        data.windOffsetX = Math.max(-3, Math.min(3, data.windOffsetX));

        data.windOffsetY += (data.y < 72 || Math.random() > 0.5 ? 0.1 : -0.1);

        data.windOffsetY = Math.max(-0.5, Math.min(0.5, data.windOffsetY));

        // and randomize
        data.windModulus = 16 + parseInt(Math.random() * 16, 10);

      }

      if ((data.x > 8192 && data.windOffsetX) || (data.x < 0 && !data.windOffsetX)) {

        // reverse gears
        data.windOffsetX *= -1;

      }

      if ((data.windOffsetY > 0 && worldHeight - data.y - 32 < 64) || (data.windOffsetY < 0 && data.y < 64)) {

        // reverse gears
        data.windOffsetY *= -1;

      }

      moveTo(data.x + data.windOffsetX, data.y + data.windOffsetY);

    }

    function init() {

      dom.o = makeSprite({
        className: css.className
      });

      common.setTransformXY(dom.o, data.x + 'px', data.y + 'px');

      game.dom.world.appendChild(dom.o);

    }

    options = options || {};

    css = inheritCSS({
      className: 'cloud' + (Math.random() > 0.5 ? 2 : 1)
    });

    data = inheritData({
      type: 'cloud',
      isNeutral: true,
      frameCount: 0,
      windModulus: 16,
      windOffsetX: 0,
      windOffsetY: 0,
      verticalDirection: 0.33,
      verticalDirectionDefault: 0.33,
      y: options.y || (96 + parseInt((worldHeight - 96 - 128) * Math.random(), 10)),
      width: 102,
      halfWidth: 51,
      height: 29,
      halfHeight: 14
    }, options);

    dom = {
      o: null
    };

    exports = {
      animate: animate,
      data: data,
      dom: dom
    };

    init();

    return exports;

  };

  SmartMissile = function(options) {

    /**
     * I am so smart!
     * I am so smart!
     * S-MRT,
     * I mean, S-MAR-T...
     *  -- Homer Simpson
     */

    var css, dom, data, radarItem, objects, collision, launchSound, exports;

    function moveTo(x, y) {

      var hitBottom = false;

      if (x !== undefined && data.x !== x) {
        common.setX(exports, x);
        data.x = x;
      }

      // prevent from "crashing", only if not expiring and target is still alive
      if (!data.expired && !objects.target.data.dead && y >= data.yMax) {
        y = data.yMax;
        hitBottom = true;
      }

      if (y !== undefined && data.y !== y) {
        common.setY(exports, y);
        data.y = y;
      }

      // push x/y to history arrays, maintain size

      data.xHistory.push(data.x);
      data.yHistory.push(data.y);

      if (data.xHistory.length > data.trailerCount + 1) {
        data.xHistory.shift();
      }

      if (data.yHistory.length > data.trailerCount + 1) {
        data.yHistory.shift();
      }

      return hitBottom;

    }

    function moveTrailers() {

      var i, j;

      for (i=0, j=data.trailerCount; i<j; i++) {

        // if previous X value exists, apply it
        if (data.xHistory[i]) {
          dom.trailers[i].style.left = data.xHistory[i] + (data.width/2) + 'px';
          dom.trailers[i].style.top = data.yHistory[i] + (data.height/2) + 'px';
        }

      }

    }

    function hideTrailers() {

      var i, j;

      for (i=0, j=data.trailerCount; i<j; i++) {

        // if previous X value exists, apply it
        if (data.xHistory[i]) {
          dom.trailers[i].style.display = 'none';
        }

      }

    }

    function spark() {
      utils.css.add(dom.o, css.spark);
    }

    function die(excludeShrapnel) {

      var dieSound;

      if (!data.deadTimer) {

        utils.css.add(dom.o, css.spark);

        if (sounds.genericBoom) {
          playSound(sounds.genericBoom, exports);
        }

        if (!excludeShrapnel) {
          shrapnelExplosion(data, {
            count: 3,
            velocity: 2
          });
        }

        // timeout?
        data.deadTimer = window.setTimeout(function() {
          hideTrailers();
          removeNodes(dom);
        }, 250);

        data.energy = 0;

        radarItem.die();

        if (data.isRubberChicken && sounds.rubberChicken.die) {

          // don't "die" again if the chicken has already moaned, i.e., from expiring.
          if (!data.expired) {

            dieSound = playSound(sounds.rubberChicken.die, exports);

          }

          if (launchSound) {

            launchSound.stop();

            if (!data.expired && dieSound) {
              // hackish: apply launch sound volume to die sound
              dieSound.setVolume(launchSound.volume);
            }

          }

        }

      }

      data.dead = true;

    }

    function sparkAndDie(target) {

      // TODO: reduce timers
      spark();

      // hack: no more animation.
      data.dead = true;

      if (target) {
        common.hit(target, data.damagePoints);
      }

      die();

    }

    function animate() {

      var deltaX, deltaY, targetData, angle, hitBottom, targetHalfWidth, targetHeightOffset;

      if (!data.dead) {

        targetData = objects.target.data;

        targetHalfWidth = targetData.width / 2;
        targetHeightOffset = (targetData.type === 'balloon' ? 0 : targetData.height / 2);

        // delta of x/y between this and target
        deltaX = (targetData.x + targetHalfWidth) - data.x;

        // TODO: hack full height for balloon?
        deltaY = (targetData.y + (targetData.bottomAligned ? targetHeightOffset : -targetHeightOffset)) - data.y;

        if (!data.expired && (data.frameCount > data.expireFrameCount || (!objects.target || objects.target.data.dead))) {

          utils.css.add(dom.o, css.expired);
          utils.css.add(radarItem.dom.o, css.expired);

          data.expired = true;
          data.hostile = true;

          // burst of thrust when the missile expires?
          data.vX *= 1.5;
          data.vY *= 1.5;

          if (data.isRubberChicken && sounds.rubberChicken.expire) {

            playSound(sounds.rubberChicken.expire, exports);

            if (launchSound) {
              // hackish: apply launch sound volume, for consistency
              sounds.rubberChicken.expire.sound.setVolume(launchSound.volume);
            }

          }

        }

        if (data.expired) {

          // fall...
          data.gravity *= 1.1;

          // ... and decelerate on X-axis.
          data.vX *= 0.95;

        } else {

          // x-axis

          // data.vX += (deltaX >= 0 ? data.thrust : -data.thrust);

          // if changing directions, cut in half.
          data.vX += deltaX * 0.0065;

          // y-axis

          if (deltaY <= targetData.height && deltaY >= -targetData.height) {

            // lock on target.

            if (data.vY >= 0 && data.vY >= 0.25) {
              data.vY *= 0.8;
            } else if (data.vY <= 0 && data.vY < -0.25) {
              data.vY *= 0.8;
            }
 
          } else {

            // relative to target at all times
            // data.vY += deltaY * 0.0125;

            data.vY += (deltaY >= 0 ? data.thrust : -data.thrust);

          }

        }

        // and throttle
        data.vX = Math.max(data.vXMax * -1, Math.min(data.vXMax, data.vX));
        data.vY = Math.max(data.vYMax * -1, Math.min(data.vYMax, data.vY));

        if (Math.random() >= 0.99) {

          game.objects.smoke.push(new Smoke({
            x: data.x,
            y: data.y,
            spriteFrame: 3
          }));

        }

        hitBottom = moveTo(data.x + data.vX, data.y + data.vY + (data.expired ? data.gravity : 0));

        if (!hitBottom) {

          // hack deltas for angle

          if (deltaX > 360) {
            deltaX = (deltaX % 180);
          }

          angle = Math.atan2(deltaY, deltaX) * deg2Rad;

        } else {

          // bottom-aligned. Heading left, or right?

          if (data.vX > 0) {
            angle = 0;
          } else {
            angle = 180;
          }

        }

        if (features.transform.prop) {
          dom.o.style[features.transform.prop] = 'rotate(' + angle + 'deg)';
        }

        moveTrailers();

        data.frameCount++;

        if (data.frameCount >= data.dieFrameCount) {
          die();
          // but don't fall too fast?
          data.vYMax *= 0.5;
        }

        // hit bottom?
        if (data.y > game.objects.view.data.battleField.height) {
          data.y = game.objects.view.data.battleField.height;
          die(true);
        }

        collisionTest(collision, exports);

      }

      // notify caller if now dead and can be removed.
      return (data.dead && !dom.o);

    }

    function init() {

      var i, trailerConfig, fragment;

      fragment = document.createDocumentFragment();

      dom.o = makeSprite({
        className: css.className
      });

      trailerConfig = {
        className: css.trailer
      };

      for (i=0; i<data.trailerCount; i++) {
        dom.trailers.push(makeSprite(trailerConfig));
        // TODO: clone, optimize etc.
        fragment.appendChild(dom.trailers[i]);
      }

      // (literal) smoke test
      dom.oSubSprite = makeSubSprite();
      dom.o.appendChild(dom.oSubSprite);

      if (data.isEnemy) {
        utils.css.add(dom.o, css.enemy);
      }

      data.yMax = (game.objects.view.data.battleField.height - data.height);

      common.setX(exports, data.x);
      common.setY(exports, data.y);

      game.dom.world.appendChild(fragment);

      game.dom.world.appendChild(dom.o);

      // findTarget();

      radarItem = game.objects.radar.addItem(exports, dom.o.className);

      if (data.isRubberChicken && sounds.rubberChicken.launch) {

        // special case: enemy missile launchers should always play at full volume - they're close enough.
        launchSound = playSound(sounds.rubberChicken.launch, (data.parentType === 'missile-launcher' && data.isEnemy ? null : exports));

      } else if (sounds.missileLaunch) {

        playSound(sounds.missileLaunch, exports);

      }

    }

    options = options || {};

    if (forceRubberChicken) {
      options.isRubberChicken = true;
    }

    css = inheritCSS({
      className: 'smart-missile',
      trailer: 'smart-missile-trailer',
      expired: 'expired',
      spark: 'spark'
    });

    // special case
    if (options.isRubberChicken) {
      css.className += ' rubber-chicken';
    }

    data = inheritData({
      type: 'smart-missile',
      parentType: options.parentType || null,
      energy: 1,
      energyMax: 1,
      expired: false,
      hostile: false, // when expiring/falling, this object is dangerous to both friendly and enemy units.
      frameCount: 0,
      expireFrameCount: options.expireFrameCount || 256,
      dieFrameCount: options.dieFrameCount || 640, // 640 frames ought to be enough for anybody.
      width: (options.isRubberChicken ? 24 : 14),
      height: 15,
      gravity: 1,
      damagePoints: 25,
      isRubberChicken: options.isRubberChicken || false,
      vX: 2,
      vY: 2,
      vXMax: 12,
      vYMax: 12,
      thrust: 0.75,
      deadTimer: null,
      trailerCount: 5,
      xHistory: [],
      yHistory: [],
      yMax: null
    }, options);

    dom = {
      o: null,
      trailers: []
    };

    objects = {
      target: options.target
    };

    collision = {
      options: {
        source: exports, // initially undefined
        targets: undefined,
        hit: function(target) {
          sparkAndDie(target);
        }
      },
      items: ['tanks', 'vans', 'missileLaunchers', 'infantry', 'parachuteInfantry', 'engineers', 'helicopters', 'bunkers', 'superBunkers', 'balloons', 'smartMissiles', 'turrets']
    };

    exports = {
      animate: animate,
      data: data,
      dom: dom,
      die: die,
      objects: objects
    };

    init();

    return exports;

  };

  Helicopter = function(options) {

    var css, data, dom, events, objects, collision, radarItem, exports, lastTarget;

    function cloak() {

      if (!data.cloaked) {

        utils.css.add(dom.o, css.cloaked);
        utils.css.add(radarItem.dom.o, css.cloaked);

        if (!data.isEnemy && sounds.helicopter.engine) {
          sounds.helicopter.engine.sound.setVolume(sounds.helicopter.engineVolume/2.5);
        }

      }

      // hackish: mark and/or update the current frame when this happened.
      data.cloaked = game.objects.gameLoop.data.frameCount;

    }

    function uncloak() {

      // hackish: uncloak if a frame or more has passed and we aren't in a cloud.
      if (data.cloaked && data.cloaked !== game.objects.gameLoop.data.frameCount) {

        utils.css.remove(dom.o, css.cloaked);
        utils.css.remove(radarItem.dom.o, css.cloaked);

        if (!data.isEnemy && sounds.helicopter.engine) {
          sounds.helicopter.engine.sound.setVolume(sounds.helicopter.engineVolume);
        }


        data.cloaked = false;

      }

    }

    function centerView() {

      // hack: center on enemy helicopter at all times.

      if (trackEnemy) {
        game.objects.view.dom.battleField.style[features.transform.prop] = 'translate3d(' + (parseInt(data.x - game.objects.view.data.browser.halfWidth, 10) * -1) + 'px, 0px, 0px)'; 
      }

    }

    function updateFuelUI() {

      if (!data.isEnemy) {

        common.setTransformXY(dom.fuelLine, -100 + data.fuel + '%', '0px');

        // hackish: show announcements across 1% of fuel burn process.
        if (!data.repairing && !tutorialMode) {

          if (data.fuel < 33 && data.fuel > 32) {

            game.objects.view.setAnnouncement('Low fuel');

          } else if (data.fuel < 12.5 && data.fuel > 11.5) {

            game.objects.view.setAnnouncement('Fuel critical');

          } else if (data.fuel <= 0) {

            game.objects.view.setAnnouncement('No fuel');

          }

        }

      }

    }

    function burnFuel() {

      var frameCount, modulus;

      if (data.dead || data.repairing) {
        // don't burn fuel in these cases
        return false;
      }

      frameCount = game.objects.gameLoop.data.frameCount;

      modulus = (data.landed ? data.fuelModulus : data.fuelModulusFlying);

      if (frameCount % modulus === 0 && data.fuel > 0) {

        // burn!

        data.fuel = Math.max(0, data.fuel - 0.1);

        // update UI

        updateFuelUI();

      }

    }

    function repairInProgress() {
      return (data.repairing && !data.repairComplete);
    }

    function startRepairing() {

      if (!data.repairing) {

        data.repairing = true;

        if (!data.isEnemy) {

          document.getElementById('spinner').style.display = 'block';

          playSound(sounds.repairing);

          window.setTimeout(function() {
            playRepairingWrench(repairInProgress, exports);
          }, 500 + Math.random() * 1500);

          window.setTimeout(function() {
            playImpactWrench(repairInProgress, exports);
          }, 500 + Math.random() * 1500);

        }

      }

    }

    function stopRepairing() {

      if (data.repairing) {

        data.repairing = false;

        if (!data.isEnemy) {

          document.getElementById('spinner').style.display = 'none';

          if (sounds.repairing) {
            sounds.repairing.sound.stop();
          }

        }

        if (data.repairComplete) {

          data.repairComplete = false;

          if (!data.isEnemy) {

            document.getElementById('repair-complete').style.display = 'none';

          }

        }

      }

    }

    function applyStatusUI() {

        dom.statusBar.infantryCount.innerHTML = data.parachutes;
        dom.statusBar.ammoCount.innerHTML = data.ammo;
        dom.statusBar.bombCount.innerHTML = data.bombs;
        dom.statusBar.missileCount.innerHTML = data.smartMissiles;

        // hackish, fix endBunkers reference
        dom.statusBar.fundsCount.innerHTML = game.objects.endBunkers[0].data.funds;

    }

    function updateStatusUI() {

      if (!data.isEnemy) {

        // TODO: optimize

        getAnimationFrame(applyStatusUI);

      }

      // fully-repaired?
      if (data.repairing && !data.repairComplete && data.fuel === data.maxFuel && data.ammo === data.maxAmmo && data.energy === data.energyMax && data.bombs === data.maxBombs && data.smartMissiles === data.maxSmartMissiles) {

        data.repairComplete = true;

        if (!data.isEnemy) {

          document.getElementById('spinner').style.display = 'none';
          document.getElementById('repair-complete').style.display = 'block';

          if (sounds.repairing) {
            sounds.repairing.sound.stop();
          }

          if (sounds.inventory.end) {
            playSound(sounds.inventory.end);
          }

        }

      }

    }

    function repair() {

      var hasUpdate;

      data.repairFrames++;

      data.fuel = Math.min(data.maxFuel, data.fuel + 0.4);

      if (data.repairFrames % 2 === 0) {

        data.ammo = Math.min(data.maxAmmo, data.ammo + 1);
        hasUpdate = 1;

      }

      if (data.repairFrames % 5 === 0) {

        // fix damage
        data.energy = Math.min(data.energyMax, data.energy + 1);

      }

      if (data.repairFrames % 10 === 0) {

        data.bombs = Math.min(data.maxBombs, data.bombs + 1);
        hasUpdate = 1;

      }

      if (data.repairFrames % 200 === 0) {

        data.smartMissiles = Math.min(data.maxSmartMissiles, data.smartMissiles + 1);
        hasUpdate = 1;

      }

      updateFuelUI();

      if (hasUpdate) {

        updateStatusUI();

        updateEnergy(exports);

      }

    }

    function setFiring(state) {

      if (state !== undefined && (!data.onLandingPad || (!state && data.isEnemy))) {
        data.firing = state;
      }

    }

    function setBombing(state) {

      if (state !== undefined && (!data.onLandingPad || (!state && data.isEnemy))) {
        data.bombing = state;
      }

    }

    function setMissileLaunching(state, isRubberChicken) {

      if (data.missileLaunching !== state) {
         data.missileLaunching = state;
         data.rubberChickenLaunching = !!isRubberChicken;
      }

    }

    function setParachuting(state) {

      if (data.parachuting !== state) {
        data.parachuting = state;
      }

    }

    function rotate(force) {

      // flip the helicopter so it's pointing R-L instead of the default R/L (toggle behaviour)

      // if not dead or landed, that is.
      if (!force && (data.dead || data.y <= 0 || data.landed)) {
        return false;
      }

      if (data.rotated) {
        // going back to L->R
        utils.css.remove(dom.o, css.facingLeft);
        utils.css.remove(dom.o, css.rotatedLeft);
      } else {
        utils.css.remove(dom.o, css.facingRight);
        utils.css.remove(dom.o, css.rotatedRight);
      }

      data.rotated = !data.rotated;

      utils.css.add(dom.o, data.rotated ? css.rotatedLeft : css.rotatedRight);

      if (!data.rotateTimer) {
        data.rotateTimer = window.setTimeout(function() {
          utils.css.remove(dom.o, (data.rotated ? css.rotatedLeft : css.rotatedRight));
          utils.css.add(dom.o, (data.rotated ? css.facingLeft : css.facingRight));
          data.rotateTimer = null;
        }, 333);
      }

      if (!data.isEnemy && !data.autoRotate && sounds.helicopter.rotate) {
        playSound(sounds.helicopter.rotate);
      }

    }

    function applyTilt() {

      // L -> R / R -> L + forward / backward

      var angle;

      // auto-rotate feature
      if (data.autoRotate && ((data.vX > 0 && data.lastVX < 0) || (data.vX < 0 && data.lastVX > 0))) {
        rotate();
      }

      if (features.transform.prop) {

        angle = (data.vX / data.vXMax) * 12.5;

        // rotate by angle.
        dom.o.style[features.transform.prop] = (angle !== 0 ? 'rotate(' + angle + 'deg)' : '');

        // TODO: clean up, improve
        return false;

      }

      if (data.tilt === null) {

        // new tilt

        if (data.vX > data.vXMax/4) {

          // L -> R
          utils.css.add(dom.o, css.tilt);

          utils.css.add(dom.o, css.movingRight);

          data.tilt = 1;

        } else if (data.vX < data.vXMax/4 * -1) {

          // R -> L
          utils.css.add(dom.o, css.tilt);

          utils.css.add(dom.o, css.movingLeft);

          data.tilt = -1;

        }

      } else {

        if (data.tilt === 1 && data.vX < data.vXMax/4) {

          // leaving L -> R tilt

          utils.css.remove(dom.o, css.tilt);
          utils.css.remove(dom.o, css.movingRight);

          data.tilt = null;

        } else if (data.tilt === -1 && data.vX > data.vXMax/4 * -1) {

          // leaving R -> L tilt

          utils.css.remove(dom.o, css.tilt);
          utils.css.remove(dom.o, css.movingLeft);

          data.tilt = null;

        }

      }

    }

    function onLandingPad(state) {

      data.onLandingPad = state;

      if (state) {

        // edge case: stop firing, etc.
        setFiring(false);
        setBombing(false);

        startRepairing();

      } else {

        stopRepairing();

      }

    }

    function refreshCoords() {

      var view = game.objects.view;

      // determine max X and Y coords
      data.xMax = view.data.battleField.width - data.width;
      data.yMax = view.data.world.height - data.height - 2; // including border

      // haaaack
      if (!data.yMin) {
        data.yMin = document.getElementById('game-status-bar').offsetHeight;
      }

      updateScreenScale();
      applyScreenScale();

    }

    function moveTo(x, y) {

      // Hack: limit enemy helicopter to visible screen
      if (data.isEnemy) {
        x = Math.min(8192, Math.max(0, x));
      }

      if (x !== undefined) {
        x = Math.min(data.xMax, x);
        if (x && data.x !== x) {
          common.setX(exports, x);
          data.x = x;
          data.midPoint.x = data.x + data.halfWidth;
        }
      }

      if (y !== undefined) {
        y = Math.max(data.yMin, Math.min(data.yMax - (data.repairing ? 3 : 0), y));
        if (data.y !== y) {
          common.setY(exports, y);
          data.y = y;
          // TODO: redundant?
          data.midPoint.y = data.y;
        }
      }

    }

    function updateHealth() {
      // smouldering, etc.
      // TODO: optimize class swapping
      if (data.energy < 4) {
        utils.css.add(dom.o, css.hit2);
        utils.css.remove(dom.o, css.hit1);
      } else if (data.energy < 7) {
        utils.css.add(dom.o, css.hit1);
        utils.css.remove(dom.o, css.hit2);
      } else {
        // TODO: optimize
        utils.css.remove(dom.o, css.hit1);
        utils.css.remove(dom.o, css.hit2);
      }
    }

    function reset() {

      data.fuel = data.maxFuel;
      data.energy = data.energyMax;
      data.parachutes = 1;
      data.smartMissiles = data.maxSmartMissiles;
      data.ammo = data.maxAmmo;
      data.bombs = data.maxBombs;

      if (!data.isEnemy) {

        data.vX = 0;
        data.vY = 0;
        data.lastVX = 0;

        if (!tutorialMode) {
          game.objects.view.setAnnouncement();
        }

        if (sounds.helicopter.engine) {
          sounds.helicopter.engine.sound.setVolume(sounds.helicopter.engineVolume);
        }

      } else {

        lastTarget = null;

        data.y = 64;
        data.vX = -8;
        data.lastVX = 0;
        data.vY = 0;

        if (data.rotated) {
          rotate();
        }

      }

      // reset any queued firing actions
      data.bombing = false;
      data.firing = false;
      data.missileLaunching = false;
      data.rubberChickenLaunching = false;
      data.parachuting = false;

      updateHealth();

      if (data.isEnemy) {

        // todo: clean up
        data.x = game.objects.landingPads[game.objects.landingPads.length-1].data.x + game.objects.landingPads[game.objects.landingPads.length-1].data.width/2 - data.halfWidth + 10;

      } else {

        // todo: clean up
        data.x = game.objects.landingPads[0].data.x + game.objects.landingPads[0].data.width/2 - data.halfWidth + 10;

      }

      data.y = game.objects.view.data.world.height - 20;

      common.setX(exports, data.x);
      common.setY(exports, data.y);

      utils.css.remove(dom.o, css.exploding);
      utils.css.remove(dom.o, css.dead);

      // look ma, no longer dead!
      data.dead = false;
      data.pilot = true;

      radarItem.reset();

      updateStatusUI();

      updateEnergy(exports);

    }

    function respawn() {

      if (battleOver) {
        // exit if game is over.
        return false;
      }

      // helicopter died. move view, and reset.

      reset();

      // local player? move the view back to zero.

      if (!data.isEnemy) {

        // hackish: hard reset battlefield scroll
        game.objects.view.data.battleField.scrollLeft = 0;

        // and update scroll view
        game.objects.view.setLeftScroll(0);

        // reposition chopper on landing pad
        data.x = game.objects.landingPads[0].data.x + game.objects.landingPads[0].data.width/2 - data.halfWidth - 10;

        common.setX(exports, data.x);

        // chopper should not be moving
        data.vX = 0;
        data.vY = 0;

      }

    }

    function die() {

      if (data.dead) {
        return false;
      }

      // reset animations
      data.frameCount = 0;

      utils.css.add(dom.o, css.exploding);

      shrapnelExplosion(data, {
        count: 20,
        velocity: 5
      });

      // drop infantry?
      if ((data.isEnemy && (gameType === 'hard' || gameType === 'extreme' ? Math.random() > 0.25 : Math.random() > 0.5)) || Math.random() > 0.66) {
        game.objects.parachuteInfantry.push(new ParachuteInfantry({
          isEnemy: data.isEnemy,
          x: data.x + data.halfWidth,
          y: data.y + data.height - 11,
          ignoreShrapnel: true
        }));
      }

      // timeout?
      window.setTimeout(function() {
        utils.css.add(dom.o, css.dead);
        // undo rotate
        if (data.rotated) {
          rotate(true);
        }
      }, 1200);

      data.energy = 0;

      data.dead = true;

      radarItem.die();

      if (sounds.explosionLarge) {
          playSound(sounds.explosionLarge, exports);
      }

      if (!data.isEnemy && sounds.helicopter.engine) {
        sounds.helicopter.engine.sound.setVolume(0);
      }

      // don't respawn the enemy chopper during tutorial mode.
      if (!data.isEnemy || !tutorialMode) {
        window.setTimeout(respawn, (data.isEnemy ? 8000 : 3000));
      }

    }

    function fire() {

      var tiltOffset, frameCount, missileTarget, hasUpdate, soundObject;

      frameCount = game.objects.gameLoop.data.frameCount;

      if (!data.firing && !data.bombing && !data.missileLaunching && !data.parachuting) {
        return false;
      }

      if (data.firing && frameCount % data.fireModulus === 0) {

        if (data.ammo > 0) {

          tiltOffset = (data.tilt !== null ? data.tiltYOffset * data.tilt * (data.rotated ? -1 : 1) : 0);

          objects.gunfire.push(new GunFire({
            parentType: data.type,
            isEnemy: data.isEnemy,
            x: data.x + (data.rotated ? 0 : data.width) - 8,
            y: data.y + data.halfHeight + (data.tilt !== null ? tiltOffset + 2 : 0),
            vX: data.vX + 8 * (data.rotated ? -1 : 1) * (data.isEnemy ? -1 : 1),
            vY: (data.y > data.yMin ? data.vY + tiltOffset : 0)
          }));

          if (sounds.genericGunFire) {
            if (!data.isEnemy) {
              // local? play quiet only if cloaked.
              if (!userDisabledSound) {
                soundObject = getSound(sounds.genericGunFire);
                soundObject.sound.play(soundObject.soundOptions[data.cloaked ? 'offScreen' : 'onScreen']);
              }
            } else if (!userDisabledSound) {
              // play with volume based on visibility.
              playSound(sounds.genericGunFire, exports);
            }
          }

          // TODO: CPU

          data.ammo = Math.max(0, data.ammo - 1);

          if (!data.isEnemy) {

            hasUpdate = 1;

          }

        } else {

          // player is out of ammo.
          if (!data.isEnemy && sounds.inventory.denied) {
            playSound(sounds.inventory.denied);
          }

        }

        // SHIFT key still down?
        if (!data.isEnemy && !keyboardMonitor.isDown('shift')) {
          data.firing = false;
        }

      }

      if (data.bombing && frameCount % data.bombModulus === 0) {

        if (data.bombs > 0) {

          objects.bombs.push(new Bomb({
            isEnemy: data.isEnemy,
            x: data.x + data.halfWidth,
            y: data.y + data.height - 6,
            vX: data.vX
          }));

          data.bombs = Math.max(0, data.bombs - 1);

          if (!data.isEnemy) {

            hasUpdate = 1;

          }

        } else {

          // player is out of ammo.
          if (!data.isEnemy && sounds.inventory.denied) {
            playSound(sounds.inventory.denied);
          }

        }

        // CTRL key still down?
        if (!data.isEnemy && !keyboardMonitor.isDown('ctrl')) {
          data.bombing = false;
        }

      }

      if (data.missileLaunching && frameCount % data.missileModulus === 0) {

        if (data.smartMissiles > 0) {

          missileTarget = getNearestObject(exports, { useInFront: true });

          if (missileTarget && !missileTarget.data.cloaked) {

            objects.smartMissiles.push(new SmartMissile({
              parentType: data.type,
              isEnemy: data.isEnemy,
              x: data.x + (data.rotated ? 0 : data.width) - 8,
              y: data.y + data.halfHeight, // + (data.tilt !== null ? tiltOffset + 2 : 0),
              target: missileTarget,
              // a special variant of the smart missile. ;)
              isRubberChicken: data.rubberChickenLaunching
              // vX: data.vX + 8 * (data.rotated ? -1 : 1)
            }));

            data.smartMissiles = Math.max(0, data.smartMissiles - 1);

            hasUpdate = 1;

         }

       }

       if (!data.isEnemy && (!data.smartMissiles || !missileTarget)) {

          // out of ammo / no available targets
          if (sounds.inventory.denied) {
            playSound(sounds.inventory.denied);
          }

       }

      }

      if (data.parachuting && frameCount % data.parachuteModulus === 0) {

        if (data.parachutes > 0) {

          // helicopter landed? Just create an infantry.
          if (data.landed) {

            game.objects.infantry.push(new Infantry({
              isEnemy: data.isEnemy,
              // don't create at half-width, will be immediately recaptured (picked up) by helicopter.
              x: data.x + (data.width * 0.75),
              y: data.y + data.height - 11
            }));

          } else {

            game.objects.parachuteInfantry.push(new ParachuteInfantry({
              isEnemy: data.isEnemy,
              x: data.x + data.halfWidth,
              y: data.y + data.height - 11
            }));

          }

          data.parachutes = Math.max(0, data.parachutes - 1);

          hasUpdate = 1;

          playSound(sounds.popSound2, exports);

        } else {

          if (!data.isEnemy && sounds.inventory.denied) {
            playSound(sounds.inventory.denied);
          }

        }

      }

      if (hasUpdate) {

        updateStatusUI();

      }

    }

    function eject() {

      // bail!
      if (!data.dead && data.pilot) {

        game.objects.parachuteInfantry.push(new ParachuteInfantry({
          x: data.x + data.halfWidth,
          y: data.y + data.height - 11
        }));

        if (!tutorialMode) {
          game.objects.view.setAnnouncement('No pilot');
        }

        data.pilot = false;

      }

    }

    function ai() {

      /**
       * Rudimentary, dumb smarts. To call this "AI" would be an insult to the AI community. ;)
       * Rule-based logic: Detect, target and destroy enemy targets, hide in clouds, return to base as needed and so forth.
       */

      var deltaX, deltaY, target, result, altTarget, desiredVX, desiredVY, deltaVX, deltaVY, maxY;

      maxY = 320;

      if (data.fuel <= 0) {
        return false;
      }

      // low fuel means low fuel. or ammo. or bombs.

      if (data.energy > 0 && !data.landed && !data.repairing && (data.fuel < 30 || data.energy < 2 || (!data.ammo && !data.bombs))) {

        setFiring(false);
        setBombing(false);

        /**
         * fly toward closest landing pad.
         * rightmost 25% of the battlefield? use own base.
         * otherwise, use "neutral" mid-level base.
         * if you're there and the enemy decides to land,
         * you're going to find yourself in trouble. ;)
         */

        target = game.objects.landingPads[game.objects.landingPads.length - (data.x > 6144 ? 1 : 2)];

        // aim for landing pad

        deltaX = target.data.x - data.x;
        deltaY = -4;

        data.vX = deltaX;
        data.vY = deltaY;

        data.vX = Math.max(data.vXMax * -1, Math.min(data.vXMax, data.vX));
        data.vY = Math.max(data.vYMax * -1, Math.min(data.vYMax, data.vY));

        data.lastVX = data.vX;
        data.lastVY = data.vY;

        // are we over the landing pad?

        if (data.x >= target.data.x && data.x + data.width <= target.data.x + target.data.width) {

          data.vX = 0;
          data.vY = 4;

        }

        // only for #trackEnemy case
        centerView();

        return false;

      }

      if (data.landed) {

        if (data.repairComplete) {

          // repair has completed. go go go!
          data.vY = -4;
          data.vX = -data.vxMax;

          // reset target, too
          lastTarget = null;

        } else {

          // still repairing. don't move.

          data.vX = 0;
          data.vY = 0;

          return false;

        }

      }

      if (lastTarget) {

        // toast?

        if (lastTarget.data.dead) {

          // was it a tank? reset tank-seeking mode until next interval.
          if (lastTarget.data.type === 'tank') {
            console.log('AI killed tank. Disabling tank targeting mode.');
            data.targeting.tanks = false;
          }

          lastTarget = null;

        } else if ((lastTarget.data.type === 'balloon' || lastTarget.data.type === 'tank') && lastTarget.data.y > maxY) {

          // flying too low?
          lastTarget = null;

        } else if (lastTarget.data.cloaked) {

          // did the player go behind a cloud?
          lastTarget = null;

        }

      }

      if (!lastTarget) {

        if (data.targeting.clouds) {

          lastTarget = objectInView(data, { items: 'clouds' });

          // hack: only go after clouds in the player's half of the field.
          if (lastTarget && lastTarget.data.x > 4096) {
            lastTarget = null;
          }

        }

        if (!lastTarget && data.targeting.balloons && data.ammo) {
          lastTarget = objectInView(data, { items: 'balloons' });
        }

        if (!lastTarget && data.targeting.tanks && data.bombs) {
          lastTarget = objectInView(data, { items: 'tanks' });
        }

        if (!lastTarget && data.targeting.helicopters && data.ammo) {
          lastTarget = objectInView(data, { items: 'helicopters' });
        }

        // is the new target too low?
        if (lastTarget && (lastTarget.data.type === 'balloon' || lastTarget.data.type === 'helicopter') && lastTarget.data.y > maxY) {
          lastTarget = null;
        }

        if (lastTarget && lastTarget.data.cloaked) {
          lastTarget = null;
        }

      } else if (lastTarget.data.type === 'cloud') {

        // we already have a target - can we get a more interesting one?
        if (data.targeting.balloons && data.ammo) {
          altTarget = objectInView(data, { items: 'balloons', triggerDistance: game.objects.view.data.browser.halfWidth });
        }

        if (!altTarget && data.targeting.tanks && data.bombs) {
          altTarget = objectInView(data, { items: ['tanks'], triggerDistance: game.objects.view.data.browser.width });
        }

        if (!altTarget && data.targeting.helicopters && data.ammo) {
          altTarget = objectInView(data, { items: ['helicopters'], triggerDistance: game.objects.view.data.browser.width });
        }

        // better - go for that.
        if (altTarget && !altTarget.data.dead) {
          lastTarget = altTarget;
        }

      }

      if (lastTarget && lastTarget.data.dead) {
        lastTarget = null;
      }

      if (lastTarget && lastTarget.data.type === 'tank' && data.bombs <= 0) {
        lastTarget = null;
      }

      if (lastTarget &&  (lastTarget.data.type === 'balloon' || lastTarget.data.type === 'helicopter') && (lastTarget.data.y > maxY || data.ammo <= 0)) {
        lastTarget = null;
      }

      if (lastTarget && lastTarget.data.cloaked) {
        lastTarget = null;
      }

      /**
       * sanity check: if after all this, there is no target / nothing to do,
       * clouds aren't being targeted and there's a nearby cloud, go for that.
       */

      if (!lastTarget && !data.targeting.clouds) {

        lastTarget = objectInView(data, { items: 'clouds' });

        // hack: only go after clouds in the player's half of the field, plus one screen width
        if (lastTarget && lastTarget.data.x > 4096 + game.objects.view.data.browser.width) {
          lastTarget = null;
        }

      }

      // now go after the target.

      target = lastTarget;

      data.lastVX = parseFloat(data.vX);

      if (target && !target.data.dead) {

        // go go go!

        result = trackObject(exports, target);

        if (target.data.type !== 'balloon') {

          if (target.data.type === 'landing-pad') {
            result.deltaY = 0;
          }

          /*
          // hack: if target is not a balloon and is bottom-aligned (i.e., a tank), stay at current position.
          if (target.data.bottomAligned) {
            result.deltaY = 0;
          }
          */

        } else {

          setBombing(false);

        }

        // enforce distance limits?
        if (target.data.type === 'balloon' || target.data.type === 'helicopter') {

          if (Math.abs(result.deltaX) < 200) {
            result.deltaX = 0;
          }

        }

        desiredVX = result.deltaX;
        desiredVY = result.deltaY;

        deltaVX = Math.abs(data.vX - result.deltaX);

        if (Math.abs(deltaVX) > 1) {
          if (data.vX < desiredVX) {
            data.vX += 1;
          } else {
            data.vX -= 1;
          }
        } else {
          data.vX = 0;
        }

        deltaVY = Math.abs(data.vY - result.deltaY);

        if (Math.abs(deltaVY) > 1) {
          if (data.vY < desiredVY) {
            data.vY += 1;
          } else {
            data.vY -= 1;
          }
        } else {
          data.vY = 0;
        }

        // throttle

        data.vX = Math.max(data.vXMax * -1, Math.min(data.vXMax, data.vX));
        data.vY = Math.max(data.vYMax * -1, Math.min(data.vYMax, data.vY));

        // within firing range?
        if (target.data.type === 'balloon' || target.data.type === 'helicopter') {

          if (target.data.type === 'balloon') {

            if (Math.abs(result.deltaX) < 100 && Math.abs(result.deltaY) < 48) {
              setFiring(true);
            } else {
              setFiring(false);
            }

          } else {

            // shoot at the player
            if (Math.abs(result.deltaX) < 100) {

              if (Math.abs(result.deltaY) < 48) {

                setFiring(true);
                setBombing(false);

              } else {

                setFiring(false);

                // bomb the player?
                // TODO: verify that deltaY is not negative.
                if (Math.abs(result.deltaX) < 50 && result.deltaY > 48) {

                  setBombing(true);

                } else {

                  setBombing(false);

                }

              }

            }

          }

        } else if (target.data.type === 'tank') {

          if (Math.abs(result.deltaX) < target.data.halfWidth && Math.abs(data.vX) < 3) {
            // over a tank?
            setBombing(true);
          } else {
            setBombing(false);
          }

        } else {

          // safety case: don't fire or bomb.
          setFiring(false);
          setBombing(false);

        }

      } else {

        // default: go left
        data.vX -= 0.25;
        // and up
        data.vY -= 0.1;

        // edge case: data.vX sometimes becomes NaN - perhaps when CPU dies and resets??
        if (isNaN(data.vX)) {
          console.log('caught CPU edge case: data.vX NaN case. resetting to 0.');
          data.vX = 0;
        }

        // and throttle
        data.vX = Math.max(data.vXMax * -1, Math.min(data.vXMax, data.vX));
        data.vY = Math.max(data.vYMax * -1, Math.min(data.vYMax, data.vY));

      }

      /**
       * bonus: cloud-based "stealth bombing" mode
       * if in a cloud and cloaked, not actively targeting tanks/helicopters
       * but targets are passing underneath, bomb away.
       */

      if (data.targeting.clouds && !data.targeting.tanks && data.cloaked && data.bombs) {

        // for once, literally, "in the cloud."

        // is a tank very close by?

        altTarget = objectInView(data, { items: ['tanks'], triggerDistance: game.objects.view.data.browser.fractionWidth });

        if (altTarget) {

          result = trackObject(exports, altTarget);

          if (Math.abs(result.deltaX) < 50 && Math.abs(data.vX) < 4) {

            // RELEASE ZE BOMBS

            setBombing(true);

          } else {

            setBombing(false);

          }

        } else {

          setBombing(false);

        }

      }

      // sanity check
      if (!lastTarget || lastTarget.data.dead || lastTarget.data.type === 'cloud' || lastTarget.data.type === 'landing-pad') {
        // no need to be firing...
        setFiring(false);
      }

      if (data.vY > 0 && data.y > maxY && (!lastTarget || lastTarget.data.type !== 'landing-pad')) {
        // hack: flying too low. limit.
        data.y = maxY;
        data.vY -= 0.25;
      }

      // flip helicopter to point in the right direction?
      if (data.vX < 0 && data.rotated) {
        rotate();
      } else if (data.vX > 0 && !data.rotated) {
        rotate();
      }

      centerView();

    }

    function animate() {

      // move according to delta between helicopter x/y and mouse, up to a max.

      var i, j, view, mouse, jamming, newX, yLimit;

      jamming = 0;

      view = game.objects.view;

      if (!data.isEnemy && (data.pilot && data.fuel > 0)) {

        mouse = view.data.mouse;

        // only allow X-axis if not on ground...
        if (mouse.x) {
          // accelerate scroll vX, so chopper nearly matches mouse when scrolling
          data.lastVX = parseFloat(data.vX);
          data.vX = (view.data.battleField.scrollLeft + (view.data.battleField.scrollLeftVX * 9.5) + mouse.x - data.x - data.halfWidth) * 0.1;
          // and limit
          data.vX = Math.max(data.vXMax * -1, Math.min(data.vXMax, data.vX));
        }

        if (mouse.y) {
          data.vY = (mouse.y - data.y - view.data.world.y - data.halfHeight) * 0.1;
          // and limit
          data.vY = Math.max(data.vYMax * -1, Math.min(data.vYMax, data.vY));
        }

      }

      yLimit = 369 - (data.onLandingPad ? 3 : 0);

      // slight offset when on landing pad
      // hack for Safari, which sometimes confuses the bottom coordinate by a pixel or two. odd.
      if (data.y >= yLimit - (isSafari ? 1 : 0)) {

        data.vX = 0;

        if (data.vY > 0) {
          data.vY = 0;
        }

        if (!data.landed) {
          data.landed = true;
        }

      } else {

        data.landed = false;
        onLandingPad(false);

        // hack: fade logo on first take-off.
        if (!data.isEnemy && (tutorialMode || canHideLogo) && !logoHidden) {

          logoHidden = true;

          window.setTimeout(function() {

            var overlay = document.getElementById('world-overlay');

            utils.css.add(overlay, 'fade-out');

            utils.css.add(document.getElementById('world'), 'no-blur');

            // remove from the DOM eventually
            window.setTimeout(function() {

              overlay.parentNode.removeChild(overlay);
              overlay = null;

              // and reset FPS timings, as this may affect peformance.
              game.objects.gameLoop.resetFPS();

            }, (isOldIE ? 1 : 2000));

          }, 1);

        }

      }

      // no fuel?
      if (data.fuel <= 0 || !data.pilot) {

        // gravity until dead.
        if (data.vY < 0.5) {
          data.vY += 0.5;
        } else {
          data.vY *= 1.1;
        }

        if (data.landed) {
          die();
        }

      }

      // safety valve: don't move if ignoreMouseEvents
      if (data.ignoreMouseEvents) {
        data.vX = 0;
        data.vY = 0;
      }

      if (!data.dead) {

        newX = data.x + data.vX;

        // is this near the edge of the screen? limit to near screen width if helicopter is ahead of the scrolling screen.

        if (!data.isEnemy) {
          newX = Math.max(view.data.battleField.scrollLeft + (data.width/2) , Math.min(view.data.browser.width + view.data.battleField.scrollLeft - (data.width * 1.5), newX));
        }

        moveTo(newX, data.y + data.vY);

        applyTilt();

        collisionTest(collision, exports);

        // repairing?
        if (data.repairing) {
          repair();
        }

      }

      // animate child objects, too

      // TODO: for ... in

      for (i = objects.gunfire.length-1; i >= 0; i--) {
        if (objects.gunfire[i] && objects.gunfire[i].animate()) {
          // object is dead - take it out.
          objects.gunfire[i] = null;
          objects.gunfire.splice(i, 1);
        }
      }

      for (i = objects.bombs.length-1; i >= 0; i--) {
        if (objects.bombs[i].animate()) {
          // object is dead - take it out.
          objects.bombs.splice(i, 1);
        }
      }

      for (i = objects.smartMissiles.length-1; i >= 0; i--) {
        if (objects.smartMissiles[i].animate()) {
          // object is dead - take it out.
          objects.smartMissiles.splice(i, 1);
        }
      }

      // should we be firing, also?

      if (!data.dead) {
        fire();
      }

      if (!data.dead && !data.isEnemy) {

        // any enemy vans that are jamming our radar?
        for (i = 0, j = game.objects.vans.length; i<j; i++) {

          if (!game.objects.vans[i].data.dead && game.objects.vans[i].data.isEnemy !== data.isEnemy && game.objects.vans[i].data.jamming) {

            jamming++;

          }

        }

        if (jamming && !data.radarJamming) {

          data.radarJamming = jamming;
          game.objects.radar.startJamming();

        } else if (!jamming && data.radarJamming) {

          data.radarJamming = jamming;
          game.objects.radar.stopJamming();

        }

      }

      // trailer history

      if (game.objects.gameLoop.data.frameCount % data.smokeModulus === 0) {

        // smoke relative to damage

        if (!data.dead && Math.random() > 1 - ((10-data.energy)/10)) {

          game.objects.smoke.push(new Smoke({
            x: data.x + data.halfWidth + (parseInt(Math.random() * data.halfWidth * 0.5 * (Math.random() > 0.5 ? -1 : 1), 10)),
            y: data.y + data.halfHeight + (parseInt(Math.random() * data.halfHeight * 0.5 * (Math.random() > 0.5 ? -1 : 1), 10))
          }));

        }

      }

      burnFuel();

      // TODO: isCPU

      if (data.isEnemy) {

        ai();

        if (game.objects.gameLoop.data.frameCount % data.targetingModulus === 0) {

          // should we target tanks?
          data.targeting.tanks = (Math.random() > 0.65);

          // should we target clouds?
          data.targeting.clouds = (Math.random() > 0.5);

          data.targeting.helicopters = (Math.random() > 0.25 || tutorialMode);

          if (winloc.match(/clouds/i)) {
            // hack/testing: cloud-only targeting mode
            data.targeting.balloons = false;
            data.targeting.tanks = false;
            data.targeting.helicopters = false;
            data.targeting.clouds = true;
          }

          console.log('AI tank targeting mode: ' + data.targeting.tanks + ', clouds: ' + data.targeting.clouds + ', helicopters: ' + data.targeting.helicopters);

        }

      }

      // uncloak if not in a cloud?
      uncloak();

    }

    function init() {

      var i, trailerConfig, fragment;

      if (data.isEnemy) {
        // offset fire modulus by half, to offset sound
        data.frameCount = Math.floor(data.fireModulus / 2);
      }

      fragment = document.createDocumentFragment();

      trailerConfig = {
        className: css.trailer
      };

      for (i=0; i<data.trailerCount; i++) {
        dom.trailers.push(makeSprite(trailerConfig));
        // TODO: clone, optimize etc.
        fragment.appendChild(dom.trailers[i]);
      }

      game.dom.world.appendChild(fragment);

      dom.o = makeSprite({
        className: css.className + (data.isEnemy ? ' ' + css.enemy : '')
      });

      dom.oSubSprite = makeSubSprite();

      dom.o.appendChild(dom.oSubSprite);

      dom.fuelLine = document.getElementById('fuel-line');

      common.setX(exports, data.x);
      common.setY(exports, data.y);

      game.dom.world.appendChild(dom.o);

      // attach events?

      if (options.attachEvents) {

        utils.events.add(game.dom.world, 'mousedown', events.mousedown);
        utils.events.add(game.dom.world, 'dblclick', events.dblclick);

      }

      refreshCoords();

      // if not enemy, force-update status bar UI
      if (!data.isEnemy) {
        updateStatusUI();
      }

      // note final true param, for respawn purposes
      radarItem = game.objects.radar.addItem(exports, dom.o.className, true);

    }

    options = options || {};

    css = inheritCSS({
      className: 'helicopter',
      facingLeft: 'facing-left',
      facingRight: 'facing-right',
      rotatedLeft: 'rotated-left',
      rotatedRight: 'rotated-right',
      cloaked: 'cloaked',
      movingLeft: 'moving-left',
      movingRight: 'moving-right',
      tilt: 'tilt',
      hit1: 'smouldering-phase-1',
      hit2: 'smouldering-phase-2',
      inventory: {
        frameCount: 0,
        cost: 20
      }
    });

    data = inheritData({
      type: 'helicopter',
      bombing: false,
      firing: false,
      missileLaunching: false,
      rubberChickenLaunching: false,
      parachuting: false,
      ignoreMouseEvents: false,
      fuel: 100,
      maxFuel: 100,
      fireModulus: 2,
      bombModulus: 6,
      fuelModulus: (tutorialMode ? 24 : 8),
      fuelModulusFlying: (tutorialMode ? 9 : 3),
      missileModulus: 12,
      parachuteModulus: 4,
      repairModulus: 2,
      smokeModulus: 2,
      radarJamming: 0,
      repairComplete: false,
      landed: true,
      onLandingPad: true,
      cloaked: false,
      rotated: false,
      rotateTimer: null,
      autoRotate: (options.isEnemy || false),
      repairing: false,
      repairFrames: 0,
      energy: 10,
      energyMax: 10,
      direction: 0,
      pilot: true,
      xMin: 0,
      xMax: null,
      yMin: 0,
      yMax: null,
      vX: 0,
      vXMax: (options.isEnemy ? 8 : 12),
      vYMax: (options.isEnemy ? 8 : 10),
      lastVX: 0,
      vY: 0,
      vyMin: 0,
      width: 48,
      height: 15,
      halfWidth: 24,
      halfHeight: 7,
      tilt: null,
      lastTiltCSS: null,
      tiltYOffset: 2,
      ammo: (tutorialMode && !options.isEnemy) ? 128 : 64,
      maxAmmo: (tutorialMode && !options.isEnemy) ? 128 : 64,
      bombs: (tutorialMode && !options.isEnemy) ? 30 : 10,
      maxBombs: (tutorialMode && !options.isEnemy) ? 30 : 10,
      parachutes: 1,
      maxParachutes: 5,
      smartMissiles: 2,
      maxSmartMissiles: 2,
      midPoint: null,
      // for AI
      targeting: {
        balloons: true,
        clouds: true,
        helicopters: true,
        tanks: true
      },
      targetingModulus: FPS * 30
    }, options);

    data.midPoint = {
      x: data.x + data.halfWidth + 10,
      y: data.y,
      width: 5,
      height: data.height
    };

    dom = {
      o: null,
      fuelLine: null,
      subSprite: null,
      // hackish
      statusBar: {
        infantryCount: document.getElementById('infantry-count'),
        ammoCount: document.getElementById('ammo-count'),
        bombCount: document.getElementById('bomb-count'),
        missileCount: document.getElementById('missile-count'),
        fundsCount: document.getElementById('funds-count')
      }
    };

    events = {

      resize: function() {
        refreshCoords();
      },

      mousedown: function(e) {
        if (!data.ignoreMouseEvents && !data.isEnemy && data.fuel > 0) {
          if (e.button === 0) {
            // disable auto-rotate
            // data.autoRotate = false;
            rotate();
          }
        }
      },

      dblclick: function(e) {
        if (!data.ignoreMouseEvents && !data.isEnemy && data.fuel > 0) {
          if (e.button === 0) {
            // revert to normal setting
            if (data.rotated) {
              rotate();
            }
            // toggle auto-rotate
            data.autoRotate = !data.autoRotate;
          }
        }
      }

    };

    objects = {
      bombs: [],
      gunfire: [],
      smartMissiles: []
    };

    collision = {
      options: {
        source: exports, // initially undefined
        targets: undefined,
        hit: function(target) {
          if (target.data.type === 'chain') {
            // special case: chains do damage, but don't kill.
            common.hit(exports, target.data.damagePoints);
            // and make noise.
            if (sounds.chainSnapping) {
              playSound(sounds.chainSnapping, target);
            }
            // should the target die, too? ... probably so.
            common.hit(target, 999);
          } else if (target.data.type === 'infantry') {
            // helicopter landed, not repairing, and friendly, landed infantry (or engineer)?
            if (data.landed && !data.onLandingPad && data.parachutes < data.maxParachutes && target.data.isEnemy === data.isEnemy) {
              // check if it's at the helicopter "door".
              if (collisionCheckMidPoint(exports, target)) {
                // pick up infantry (silently)
                target.die(true);
                playSound(sounds.popSound, exports);
                data.parachutes = Math.min(data.maxParachutes, data.parachutes + 1);
                updateStatusUI();
              }
            }
          } else if (target.data.type === 'cloud') {
            cloak();
          } else {
            // hit something else. boom!
            die();
            // should the target die, too? ... probably so.
            common.hit(target, 999);
          }
        }
      },
      items: ['balloons', 'tanks', 'vans', 'missileLaunchers', 'bunkers', 'superBunkers', 'helicopters', 'chains', 'infantry', 'engineers', 'clouds']
    };

    exports = {
      animate: animate,
      data: data,
      dom: dom,
      die: die,
      eject: eject,
      fire: fire,
      objects: objects,
      onLandingPad: onLandingPad,
      startRepairing: startRepairing,
      reset: reset,
      rotate: rotate,
      setBombing: setBombing,
      setFiring: setFiring,
      setMissileLaunching: setMissileLaunching,
      setParachuting: setParachuting,
      updateHealth: updateHealth,
      updateStatusUI: updateStatusUI
    };

    init();

    return exports;

  };

  Tank = function(options) {

    var css, data, dom, radarItem, objects, nearby, exports;

    function fire() {

      if (data.frameCount % data.fireModulus === 0) {

        objects.gunfire.push(new GunFire({
          parentType: data.type,
          isEnemy: data.isEnemy,
          collisionItems: nearby.items.concat('bunkers'), // special case: tanks don't stop to shoot bunkers, but their gunfire can damage them.
          x: data.x + ((data.width + 1) * (data.isEnemy ? 0 : 1)),
          y: game.objects.view.data.world.height - data.gunYOffset, // half of tank height
          vX: data.vX * 2,
          vY: 0
        }));

        if (sounds.genericGunFire) {
          playSound(sounds.genericGunFire, exports);
        }

      }

    }

    function moveTo(x, bottomY) {

      if (x !== undefined && data.x !== x) {
        common.setX(exports, x);
        data.x = x;
      }

      if (bottomY !== undefined && data.bottomY !== bottomY) {
        common.setBottomYPixels(exports, bottomY);
        data.bottomY = bottomY;
        data.y = bottomAlignedY(bottomY);
      }

    }

    function updateHealth() {

      // smouldering, etc.
      // TODO: optimize class swapping

      if (data.energy <= 3) {

        utils.css.add(dom.o, css.hit2);
        utils.css.remove(dom.o, css.hit1);

      } else if (data.energy < 6) {

        utils.css.add(dom.o, css.hit1);
        utils.css.remove(dom.o, css.hit2);

      } else {

        // TODO: optimize
        utils.css.remove(dom.o, css.hit1);
        utils.css.remove(dom.o, css.hit2);

      }

      updateEnergy(exports);

    }

    function repair() {

      if (data.frameCount % data.repairModulus === 0) {
        if (data.energy < data.energyMax) {
          data.energy++;
          updateHealth();
        }
      }

    }

    function die() {

      if (data.dead) {
        return false;
      }

      utils.css.add(dom.o, css.exploding);

      shrapnelExplosion(data);

      // timeout?
      data.deadTimer = new FrameTimeout(FPS, function() {
        removeNodes(dom);
        data.deadTimer = null;
      });

      data.energy = 0;

      data.dead = true;

      if (sounds.genericExplosion) {
        playSound(sounds.genericExplosion, exports);
      }

      radarItem.die();

    }

    function stop() {

      if (!data.stopped) {
        utils.css.add(dom.o, css.stopped);
        data.stopped = true;
      }

    }

    function resume() {

      if (data.stopped) {
        utils.css.remove(dom.o, css.stopped);
        data.stopped = false;
      }

    }

    function animate() {

      var i;

      data.frameCount++;

      for (i = objects.gunfire.length-1; i >= 0; i--) {
        if (objects.gunfire[i].animate()) {
          // object is dead - take it out.
          objects.gunfire.splice(i, 1);
        }
      }

      if (!data.dead) {

        repair();

        if (!data.stopped) {

          moveTo(data.x + data.vX, data.bottomY);

        } else {

          // only fire (i.e., GunFire objects) when stopped
          fire();

        }

        // start, or stop firing?
        nearbyTest(nearby);

      } else if (data.deadTimer) {

        data.deadTimer.animate();

      }

      return (data.dead && !data.deadTimer && !dom.o && !objects.gunfire.length);

    }

    function init() {

      dom.o = makeSprite({
        className: css.className
      });

      if (data.isEnemy) {
        utils.css.add(dom.o, css.enemy);
      }

      dom.oSubSprite = makeSubSprite();

      dom.o.appendChild(dom.oSubSprite);

      // for testing
      if (options.extraClass) {
        utils.css.add(dom.o, options.extraClass);
      }

      common.setX(exports, data.x);
      common.setBottomYPixels(exports, data.bottomY);

      game.dom.world.appendChild(dom.o);

      radarItem = game.objects.radar.addItem(exports, dom.o.className);

      initNearby(nearby, exports);

    }

    options = options || {};

    css = inheritCSS({
      className: 'tank',
      hit1: 'smouldering-phase-1',
      hit2: 'smouldering-phase-2',
      stopped: 'stopped'
    });

    data = inheritData({
      type: 'tank',
      bottomAligned: true,
      deadTimer: null,
      energy: 8,
      energyMax: 8,
      frameCount: 0,
      repairModulus: 50,
      // enemy tanks shoot a little faster
      fireModulus: (options.isEnemy ? 5 : 6),
      vX: (options.isEnemy ? -1 : 1),
      width: 57,
      height: 18,
      halfWidth: 28,
      halfHeight: 9,
      gunYOffset: 15,
      stopped: false,
      inventory: {
        frameCount: 60,
        cost: 4
      }
    }, options);

    dom = {
      o: null,
      oSubSprite: null
    };

    objects = {
      gunfire: []
    };

    nearby = {
      options: {
        source: exports, // initially undefined
        targets: undefined,
        useLookAhead: true,
        // TODO: rename to something generic?
        hit: function(target) {
          // stop moving, start firing.
          // special case: only fire at EndBunker and SuperBunker if they have energy.
          if (((target.data.type === 'end-bunker' || target.data.type === 'super-bunker') && target.data.energy !== 0) || (target.data.type !== 'end-bunker' && target.data.type !== 'super-bunker')) {
            stop();
          } else {
            resume();
          }
        },
        miss: function() {
          // resume moving, stop firing.
          resume();
        }
      },
      // who gets fired at?
      items: ['tanks', 'vans', 'missileLaunchers', 'infantry', 'engineers', 'turrets', 'helicopters', 'endBunkers', 'superBunkers'],
      targets: []
    };

    exports = {
      animate: animate,
      data: data,
      dom: dom,
      die: die,
      stop: stop,
      resume: resume,
      updateHealth: updateHealth
    };

    if (!options.noInit) {
      init();
    }

    return exports;

  };

  Van = function(options) {

    var css, dom, data, radarItem, exports;

    function stop() {

      data.stopped = true;

    }

    function moveTo(x, bottomY) {

      if (features.transform.prop) {

        if (x !== undefined && data.x !== x) {
          data.x = x;
        }

        if (bottomY !== undefined && data.bottomY !== bottomY) {
          data.bottomY = bottomY;
          data.y = bottomAlignedY(bottomY);
        }

        common.setTransformXY(dom.o, data.x + 'px', '0px');

      } else {

        if (x !== undefined && data.x !== x) {
          common.setX(exports, x);
          data.x = x;
        }

        if (bottomY !== undefined && data.bottomY !== bottomY) {
          common.setBottomYPixels(exports, bottomY);
          data.bottomY = bottomY;
          data.y = bottomAlignedY(bottomY);
        }

      }

    }

    function die() {

      if (data.dead) {
        return false;
      }

      utils.css.add(dom.o, css.exploding);

      // revert to CSS rules, prevent first frame of explosion from sticking
      dom.o.style.backgroundPosition = '0px -384px';

      shrapnelExplosion(data);

      // timeout?
      data.deadTimer = new FrameTimeout(FPS, function() {
        removeNodes(dom);
        data.deadTimer = null;
      });

      data.energy = 0;

      data.jamming = false;

      data.dead = true;

      if (radarItem) {
        radarItem.die();
      } else {
        stats.destroy(exports);
      }

      if (sounds.genericExplosion2) {
        playSound(sounds.genericExplosion2, exports);
      }

    }

    function animate() {

      var enemyHelicopter;

      if (!data.dead && !data.stopped) {

        moveTo(data.x + data.vX, data.bottomY);

        if (data.isEnemy && data.x <= data.xGameOver) {

          stop();

          // Game over, man, game over! (Enemy wins.)

          // hack: clear any existing.
          game.objects.view.setAnnouncement();

          game.objects.view.setAnnouncement('The enemy has won the battle.', -1);

          gameOver();

        } else if (!data.isEnemy && data.x >= data.xGameOver) {

          stop();

          // player wins

          // hack: clear any existing.
          game.objects.view.setAnnouncement();

          game.objects.view.setAnnouncement('You have won the battle.', -1);

          gameOver(true);

        } else {

          // bounce wheels after the first few seconds

          if (data.frameCount > FPS * 2) {

            if (data.frameCount % data.stateModulus === 0) {

              data.state++;

              if (data.state > data.stateMax) {
                data.state = 0;
              }

              dom.o.style.backgroundPosition = '0px ' + (data.height * data.state * -1) + 'px';

            } else if (data.frameCount % data.stateModulus === 2) {

              // next frame - reset.
              dom.o.style.backgroundPosition = '0px 0px';

            }

          }

          if (data.frameCount % data.radarJammerModulus === 0) {

            // look for nearby bad guys
            enemyHelicopter = enemyHelicopterNearby(data, game.objects.view.data.browser.width);

            if (!data.jamming && enemyHelicopter) {

              data.jamming = true;

            } else if (data.jamming && !enemyHelicopter) {

              data.jamming = false;

            }

          }

        }

        data.frameCount++;

      } else if (data.dead && data.deadTimer) {

        data.deadTimer.animate();

      }

      return (data.dead && !data.deadTimer);

    }

    function init() {

      dom.o = makeSprite({
        className: css.className
      });

      if (data.isEnemy) {
        utils.css.add(dom.o, css.enemy);
      }

      common.setX(exports, data.x);
      common.setBottomYPixels(exports, data.bottomY);

      if (features.transform.prop) {
        // transform origin
        dom.o.style.left = '0px';
      }

      game.dom.world.appendChild(dom.o);

      // enemy vans are so sneaky, they don't even appear on the radar.
      if (tutorialMode || !options.isEnemy) {
        radarItem = game.objects.radar.addItem(exports, dom.o.className);
      } else {
        stats.create(exports);
      }

    }

    options = options || {};

    css = inheritCSS({
      className: 'van'
    });

    data = inheritData({
      type: 'van',
      bottomAligned: true,
      deadTimer: null,
      frameCount: 0,
      radarJammerModulus: 50,
      jamming: false,
      energy: 2,
      energyMax: 2,
      direction: 0,
      stopped: false,
      vX: (options.isEnemy ? -1 : 1),
      width: 38,
      height: 16,
      state: 0,
      stateMax: 2,
      stateModulus: 30,
      inventory: {
        frameCount: 60,
        cost: 2
      },
      // if the van reaches the enemy base (near the landing pad), it's game over.
      xGameOver: (options.isEnemy ? game.objects.landingPads[0].data.x + 128 : game.objects.landingPads[game.objects.landingPads.length-1].data.x - 40)
    }, options);

    dom = {
      o: null
    };

    exports = {
      animate: animate,
      data: data,
      dom: dom,
      die: die
    };

    if (!options.noInit) {
      init();
    }

    return exports;

  };

  ParachuteInfantry = function(options) {

    var css, dom, data, radarItem, exports;

    function openParachute() {

      if (data.parachuteOpen) {
        return false;
      }

      // undo manual assignment from free-fall animation
      dom.o.style.backgroundPosition = '';

      utils.css.add(dom.o, css.parachuteOpen);

      data.vY = 0.5;

      // make the noise
      if (sounds.parachuteOpen) {
        playSound(sounds.parachuteOpen, exports);
      }

      data.parachuteOpen = true;

    }

    function moveTo(x, y) {

      if (x !== undefined && data.x !== x) {
        common.setX(exports, x);
        data.x = x;
      }

      if (y !== undefined && data.y !== y) {
        common.setY(exports, y);
        data.y = y;
      }

    }

    function dieComplete() {

      removeNodes(dom);

    }

    function die(silent) {

      if (data.dead) {
        return false;
      }

      if (!silent) {

        utils.css.add(dom.o, css.exploding);

        // timeout?
        data.deadTimer = new FrameTimeout(FPS * 1.2, function() {
          data.deadTimer = null;
          dieComplete();
        });

      } else {

        // no explosion, remove right away.
        dieComplete();

      }

      data.energy = 0;

      data.dead = true;

      radarItem.die({
        silent: true
      });

    }

    function hit(hitPoints, target) {

      // special case: helicopter explosion resulting in a parachute infantry - make parachute invincible to shrapnel.
      if (target && target.data && target.data.type === 'shrapnel' && data.ignoreShrapnel) {
        return false;
      }

      return common.hit(exports, hitPoints);

    }

    function animate() {

      var randomWind, windMod, bgY;

      if (!data.dead) {

        // falling?

        moveTo(data.x + data.vX, data.y + data.vY);

        if (!data.parachuteOpen) {

          if (data.y >= data.parachuteOpensAtY) {

            openParachute();

          } else {

            // like Tom Petty, free fallin'.
            if (data.frameCount % data.panicModulus === 0) {

              dom.o.style.backgroundPosition = '0px ' + -(60 + (data.frameHeight * data.panicFrame)) + 'px';

              // alternate between 0/1
              data.panicFrame = !data.panicFrame;

            }

          }

        } else {

          // (potentially) gone with the wind.

          windMod = data.frameCount % data.windModulus;

          if (windMod === 0) {

            // choose a random direction?
            if (Math.random() > 0.66) {

              // -1, 0, 1
              randomWind = parseInt(Math.random() * 3, 10) - 1;

              data.vX = randomWind * 0.5;

              if (randomWind === -1) {

                // moving left
                bgY = -20;

              } else if (randomWind === 1) {

                // moving right
                bgY = -40;

              } else {

                // not moving!
                bgY = 0;

              }

              dom.o.style.backgroundPosition = ('0px ' + bgY + 'px');

              // choose a new wind modulus, too.
              data.windModulus = 16 + parseInt(Math.random() * 16, 10);

            } else {

              // reset wind effect

              data.vX = 0;

              dom.o.style.backgroundPosition = '0px 0px';

            }

          }

        }

        if (data.parachuteOpen && data.y >= 370) {

          if (data.parachuteOpen) {

            // touchdown! die "quietly", and transition into new infantry.
            die(true);

            game.objects.infantry.push(new Infantry({
              x: data.x,
              isEnemy: data.isEnemy
            }));

          }

        } else if (!data.parachuteOpen) {

          if (data.parachuteOpensAtY > 370 && data.y > 300) {

            // It's not looking good for our friend. Call up our buddy Wilhem.
            // http://archive.org/details/WilhelmScreamSample

            if (!data.didScream) {

              if (sounds.wilhemScream) {
                playSound(sounds.wilhemScream, exports);
              }

              data.didScream = true;

            }

          }

          if (data.y - data.height + 4 >= 370) {

            // hit ground, and no parachute. gravity is a cruel mistress.

            // reposition, first
            moveTo(data.x, 370);

            // balloon-on-skin "splat" sound
            if (sounds.splat) {
              playSound(sounds.splat, exports);
            }

            die();

          }

        }

        data.frameCount++;

      } else if (data.deadTimer) {

        data.deadTimer.animate();

      }

      return (data.dead && !data.deadTimer && !dom.o);

    }

    function init() {

      dom.o = makeSprite({
        className: css.className
      });

      if (data.isEnemy) {
        utils.css.add(dom.o, css.enemy);
      }

      common.setX(exports, data.x);
      common.setY(exports, data.y);

      game.dom.world.appendChild(dom.o);

      radarItem = game.objects.radar.addItem(exports, dom.o.className);

    }

    css = inheritCSS({
      className: 'parachute-infantry',
      parachuteOpen: 'parachute-open'
    });

    data = inheritData({
      type: 'parachute-infantry',
      frameCount: 0,
      panicModulus: 3,
      windModulus: 16 + parseInt(Math.random() * 16, 10),
      panicFrame: 0,
      energy: 2,
      energyMax: 2,
      parachuteOpen: false,
      // "most of the time", a parachute will open. no idea what the original game did. 10% failure rate.
      parachuteOpensAtY: options.y + (Math.random() * (370 - options.y)) + (!tutorialMode  && Math.random() > 0.9? 999 : 0),
      direction: 0,
      width: 10,
      height: 11, // 19 when parachute opens
      frameHeight: 20, // each sprite frame
      ignoreShrapnel: options.ignoreShrapnel || false,
      didScream: false,
      vX: 0, // wind?
      vY: 3
    }, options);

    dom = {
      o: null
    };

    exports = {
      animate: animate,
      data: data,
      dom: dom,
      die: die,
      hit: hit
    };

    init();

    return exports;

  };

  Infantry = function(options) {

    var css, dom, data, objects, radarItem, nearby, collision, exports;

    function fire() {

      if (!data.noFire && data.frameCount % data.fireModulus === 0) {

        objects.gunfire.push(new GunFire({
          parentType: data.type,
          isEnemy: data.isEnemy,
          collisionItems: nearby.items.concat('bunkers'), // special case: infantry + engineers don't stop to shoot bunkers, but their gunfire can damage them.
          x: data.x + ((data.width + 1) * (data.isEnemy ? 0 : 1)),
          y: game.objects.view.data.world.height - data.gunYOffset, // half of infantry height
          vX: data.vX, // same velocity
          vY: 0
        }));

        if (sounds.infantryGunFire) {
          playSound(sounds.infantryGunFire, exports);
        }

      }

    }

    function moveTo(x, bottomY) {

      if (x !== undefined && data.x !== x) {
        common.setX(exports, x);
        data.x = x;
      }

      if (bottomY !== undefined && data.bottomY !== bottomY) {
        common.setBottomYPixels(exports, bottomY);
        data.bottomY = bottomY;
        data.y = bottomAlignedY(bottomY);
      }

    }

    function stop(noFire) {

      if (!data.stopped) {
        utils.css.add(dom.o, css.stopped);
        data.stopped = true;
        data.noFire = !!noFire;
      }

    }

    function resume() {

      if (data.stopped) {
        utils.css.remove(dom.o, css.stopped);
        data.stopped = false;
        data.noFire = false;
      }

    }

    function setRole(role, force) {
      // TODO: minimize CSS thrashing, track lastClass etc.
      if (data.role !== role || force) {
        utils.css.remove(dom.o, css[data.roles[0]]);
        utils.css.remove(dom.o, css[data.roles[1]]);
        // role
        data.role = role;
        css.className = css[data.roles[data.role]];
        if (dom.o) {
          utils.css.add(dom.o, css.className);
        }
      }
    }

    function dieComplete() {
      removeNodes(dom);
    }

    function die(silent) {

      if (data.dead) {
        return false;
      }

      if (!silent) {

        // HACK: remove "stopped" on exploding, fix a stupid display issue where enemy display gets screwed up if stopped + exploding classes are applied together.
        if (data.stopped) {
          utils.css.remove(dom.o, css.stopped);
        }

        utils.css.add(dom.o, css.exploding);

        playSound(sounds.genericSplat, exports);

        // timeout?
        data.deadTimer = new FrameTimeout(FPS * 1.2, function() {
          dieComplete();
          data.deadTimer = null;
        });

      } else {

        dieComplete();

      }

      data.energy = 0;

      data.dead = true;

      radarItem.die();

    }

    function animate() {

      var i;

      if (data.deadTimer) {
        data.deadTimer.animate();
      }

      if (!data.dead) {

        if (!data.stopped) {

          moveTo(data.x + data.vX, data.bottomY);

        } else {

          // firing, or reclaiming/repairing?

          // only fire (i.e., GunFire objects) when stopped
          if (!data.noFire) {
            fire();
          }

        }

        collisionTest(collision, exports);

        // start, or stop firing?
        nearbyTest(nearby);

      }

      for (i = objects.gunfire.length-1; i >= 0; i--) {
        if (objects.gunfire[i].animate()) {
          // object is dead - take it out.
          objects.gunfire.splice(i, 1);
        }
      }

      data.frameCount++;

      return (data.dead && !data.deadTimer && !dom.o && !objects.gunfire.length);

    }

    function init() {

      // infantry, or engineer?
      setRole(data.role, true);

      dom.o = makeSprite({
        className: css.className
      });

      if (data.isEnemy) {
        utils.css.add(dom.o, css.enemy);
      }

      common.setX(exports, data.x);
      common.setBottomYPixels(exports, data.bottomY);

      game.dom.world.appendChild(dom.o);

      radarItem = game.objects.radar.addItem(exports, dom.o.className);

      initNearby(nearby, exports);

    }

    options = options || {};

    css = inheritCSS({
      className: null,
      infantry: 'infantry',
      engineer: 'engineer',
      stopped: 'stopped'
    });

    data = inheritData({
      type: 'infantry',
      deadTimer: null,
      frameCount: Math.random() > 0.5 ? 5 : 0,
      bottomAligned: true,
      energy: 2,
      energyMax: 2,
      role: options.role || 0,
      roles: ['infantry', 'engineer'],
      stopped: false,
      noFire: false,
      direction: 0,
      width: 10,
      height: 11,
      gunYOffset: 9,
      fireModulus: 10,
      vX: (options.isEnemy ? -1 : 1),
      xLookAhead: (options.xLookAhead !== undefined ? options.xLookAhead : 16),
      inventory: {
        frameCount: 12,
        cost: 5,
        orderCompleteDelay: 5 // last-item-in-order delay (decrements every frameCount animation loop), so tank doesn't overlap if ordered immediately afterward.
      }
    }, options);

    dom = {
      o: null
    };

    objects = {
      gunfire: []
    };

    nearby = {
      options: {
        source: exports, // initially undefined
        targets: undefined,
        useLookAhead: true,
        // TODO: rename to something generic?
        hit: function(target) {
          // engineer + turret case? reclaim or repair.
          if (data.role && target.data.type === 'turret') {
            // is there work to do?
            if (target.engineerCanInteract(data.isEnemy)) {
              stop(true);
              target.engineerHit(exports);
            } else {
              // nothing to see here.
              resume();
            }
          } else if (target.data.isEnemy !== data.isEnemy) {
            // stop moving, start firing if not a friendly unit.
            stop();
          }
        },
        miss: function() {
          // resume moving, stop firing.
          resume();
        }
      },
      // who gets fired at?
      items: ['tanks', 'vans', 'missileLaunchers', 'infantry', 'engineers', 'helicopters', 'turrets'],
      targets: []
    };

    collision = {
      options: {
        source: exports, // initially undefined
        targets: undefined,
        hit: function(target) {
          /**
           * bunkers and other objects infantry can interact with have an infantryHit() method.
           * if no infantryHit(), just die.
           * this is sort of an edge case, to prevent parachuting infantry landing in the middle of a tank.
           * this would normally cause both objects to stop and fire, but unable to hit one another due to the overlap.
           */
          if (!data.role && target.infantryHit) {
            // infantry hit bunker or other object
            target.infantryHit(exports);
          } else if (target.data.type !== 'bunker' && target.data.type !== 'end-bunker') {
            // probably a tank.
            die();
          }
        }
      },
      items: ['bunkers', 'tanks']
    };

    exports = {
      animate: animate,
      data: data,
      dom: dom,
      die: die
    };

    if (!options.noInit) {
      init();
    }

    return exports;

  };

  Engineer = function(options) {

    var object;

    options = options || {};

    // flag as an engineer
    options.role = 1;

    // hack: -ve lookahead offset allowing engineers to be basically atop turrets
    options.xLookAhead = (options.isEnemy ? 4 : -8);

    object = new Infantry(options);

    // selective override: shorter delay on engineers
    object.data.inventory.orderCompleteDelay = 5;

    return object;

  };

  LandingPad = function(options) {

    var css, dom, data, collision, exports;

    function animate() {

      if (data.frameCount % data.repairModulus === 0) {

        collisionTest(collision, exports);

      }

      data.frameCount++;

    }

    function init() {

      dom.o = makeSprite({
        className: css.className
      });

      common.setX(exports, data.x);
      common.setY(exports, data.y);

      game.dom.world.appendChild(dom.o);

    }

    options = options || {};

    css = inheritCSS({
      className: 'landing-pad'
    });

    data = inheritData({
      type: 'landing-pad',
      isNeutral: true,
      frameCount: 0,
      energy: 2,
      width: 81,
      height: 4,
      repairModulus: 5,
      y: worldHeight - 4
    }, options);

    dom = {
      o: null
    };

    collision = {
      options: {
        source: exports,
        targets: undefined,
        hit: function(target) {
          if (target.onLandingPad) {
            target.onLandingPad(true);
          }
        }
      },
      items: ['helicopters']
    };

    exports = {
      animate: animate,
      data: data,
      dom: dom
    };

    init();

    return exports;
    
  };

  shrapnelExplosion = function(options, shrapnelOptions) {

    var localOptions, halfWidth;

    var vectorX, vectorY, i, angle, shrapnelCount, angleIncrement, explosionVelocity, explosionVelocityMax;

    shrapnelOptions = shrapnelOptions || {};

    localOptions = mixin({}, options);

    halfWidth = localOptions.width/2;

    // randomize X?
    if (shrapnelOptions.randomX) {
      localOptions.x += parseInt(Math.random() * localOptions.width, 10);
    } else {
      // center?
      localOptions.x += halfWidth;
    }

    angle = 0;

    explosionVelocityMax = shrapnelOptions.velocity || 4;

    shrapnelCount = shrapnelOptions.count || 8;

    angleIncrement = 180 / (shrapnelCount-1);

    for (i=0; i<shrapnelCount; i++) {

      explosionVelocity = Math.random() * explosionVelocityMax;

      vectorX = -explosionVelocity * Math.cos(angle * deg2Rad);
      vectorY = -explosionVelocity * Math.sin(angle * deg2Rad);

      localOptions.vX = (localOptions.vX * 0.5) + vectorX;
      localOptions.vY += vectorY;

      // bottom-aligned object? explode "up".
      if (localOptions.vY > 0 && options.bottomAligned) {
        localOptions.vY *= -1;
      }

      // have first and last make noise
      localOptions.hasSound = (i === 0 || (shrapnelCount > 4 && i === shrapnelCount - 1));

      game.objects.shrapnel.push(new Shrapnel(localOptions));

      angle += angleIncrement;

    }
    
  };

  Shrapnel = function(options) {

    var css, dom, data, collision, radarItem, exports;

    function moveTo(x, y) {

      if (x !== undefined && data.x !== x) {
        data.x = x;
      }

      if (y !== undefined && data.y !== y) {
        data.y = y;
      }

      // common.setTransformXY(dom.o, data.x + 'px', data.y + 'px');

      common.setXY(exports, data.x, data.y);

    }

    function shrapnelNoise() {

      var i;

      if (data.hasSound) {

        i = 'hit' + sounds.shrapnel.counter;

        sounds.shrapnel.counter += (sounds.shrapnel.counter === 0 && Math.random() > 0.5 ? 2 : 1);

        if (sounds.shrapnel.counter >= sounds.shrapnel.counterMax) {
          sounds.shrapnel.counter = 0;
        }

        if (sounds.shrapnel[i]) {
          playSound(sounds.shrapnel[i], exports);
        }

      }

    }

    function die() {

      if (data.dead) {
        return false;
      }

      shrapnelNoise();

      utils.css.add(dom.o, css.stopped);

      data.deadTimer = new FrameTimeout(FPS * 0.75, function() {
        removeNodes(dom);
        data.deadTimer = null;
      });

      data.energy = 0;

      data.dead = true;

      if (radarItem) {
        radarItem.die({
          silent: true
        });
      }

    }

    function hitAndDie(target) {

      if (target) {
        common.hit(target, data.damagePoints);
      }

      die();

    }

    function animate() {

      if (!data.dead) {

        if (data.frameCount % data.animationModulus === 0) {

          data.spriteFrame++;

          if (data.spriteFrame > data.spriteFrames) {
            data.spriteFrame = 0;
          }

          // old frameCount-based sprite animation (used if no CSS animation)
          if (noTransform) {
            dom.o.style.backgroundPosition = (data.spriteType * -data.width) + 'px ' + (data.spriteFrame * -data.height) + 'px';
          }

          // TODO: use sub-sprite (double # of elements, bad?) and transform: translate3d(). May be faster.
          // dom.o.style[features.transform.prop] = 'translate3d(' + (data.spriteType * -data.width) + 'px ' + (data.spriteFrame * -data.height) + 'px, 0px, 0px)';

        }

        moveTo(data.x + data.vX, data.y + (Math.min(data.maxVY, data.vY + data.gravity)));


        data.gravity *= 1.1;

        if (data.y - data.height >= worldHeight) {
          moveTo(data.x + data.vX, worldHeight);
          die();
        }

        // collision check
        collisionTest(collision, exports);

        data.frameCount++;

      } else if (data.deadTimer) {

        data.deadTimer.animate();

      }

      return (data.dead && !data.deadTimer && !dom.o);

    }

    function init() {

      dom.o = makeSprite({
        className: css.className + (Math.random() > 0.5 ? ' ' + css.reverse : '')
      });

      // common.setTransformXY(dom.o, data.x + 'px', data.y + 'px');

      common.setXY(exports, data.x, data.y);

      dom.o.style.backgroundPosition = (data.spriteType * -data.width) + 'px ' + (data.spriteFrame * -data.height) + 'px';

      game.dom.world.appendChild(dom.o);

      radarItem = game.objects.radar.addItem(exports, dom.o.className);

      if (data.isEnemy) {
        utils.css.add(radarItem.dom.o, css.enemy);
      }

      shrapnelNoise();

    }

    options = options || {};

    css = inheritCSS({
      className: 'shrapnel',
      reverse: 'reverse',
      stopped: 'stopped'
    });

    data = inheritData({
      type: 'shrapnel',
      frameCount: 0,
      animationModulus: 2,
      spriteType: parseInt(Math.random() * 4, 10),
      spriteFrame: 0,
      spriteFrames: 3,
      direction: 0,
      // sometimes zero / non-moving?
      vX: options.vX || 0,
      vY: options.vY || 0,
      maxVY: 48,
      gravity: 1,
      width: 12,
      height: 12,
      hostile: true,
      damagePoints: 0.5,
      hasSound: !!options.hasSound
    }, options);

    dom = {
      o: null
    };

    exports = {
      animate: animate,
      data: data,
      dom: dom,
      die: die
    };

    collision = {
      options: {
        source: exports,
        targets: undefined,
        hit: function(target) {
          hitAndDie(target);
        }
      },
      items: ['tanks', 'vans', 'missileLaunchers', 'infantry', 'parachuteInfantry', 'engineers', 'helicopters', 'smartMissiles', 'bunkers', 'superBunkers', 'balloons', 'turrets']
    };

    init();

    return exports;

  };

  Smoke = function(options) {

    var css, dom, data, exports;

    function die() {

      if (data.dead) {
        return false;
      }

      removeNodes(dom);

      data.dead = true;

    }

    function animate() {

      if (data.frameCount % data.animateModulus === 0) {

        data.spriteFrame++;

        // advance smoke sprite
        dom.o.style.backgroundPosition = '0px -' + (data.height * data.spriteFrame) + 'px';

        if (data.spriteFrame > data.spriteFrames) {

          // animation finished
          die();

        }

      }

      data.frameCount++;

      return (data.dead && !dom.o);

    }

    function init() {

      dom.o = makeSprite({
        className: css.className
      });

      common.setX(exports, data.x);
      common.setY(exports, data.y);

      game.dom.world.appendChild(dom.o);

    }

    options = options || {};

    css = inheritCSS({
      className: 'smoke'
    });

    data = inheritData({
      type: 'smoke',
      frameCount: 0,
      animateModulus: 2,
      spriteFrame: 0,
      spriteFrames: 10,
      direction: 0,
      width: 9,
      height: 10
    }, options);

    dom = {
      o: null
    };

    exports = {
      animate: animate,
      data: data,
      dom: dom,
      die: die
    };

    init();

    return exports;

  };

  TutorialStep = function(options) {

    var data, exports;

    data = {
      activated: false,
      completed: false
    };

    function animate() {

      if (!data.activated) {

        if (options.activate) {
          options.activate();
        }

        data.activated = true;

      } else if (!data.completed) {

        if (options.animate()) {

          if (options.complete) {

            options.complete();

          }

          data.completed = true;

        }

      }

    }

    exports = {
      animate: animate
    };

    return exports;

  };

  Tutorial = function() {

    var config, css, data, dom, exports;

    function addStep(options) {

      config.steps.push(new TutorialStep(options));

    }

    function initDOM() {

      dom.o = document.getElementById('tutorial');
      dom.oList = document.getElementById('tutorial-list').getElementsByTagName('li');
      data.steps = dom.oList.length;
      utils.css.add(document.getElementById('world'), 'tutorial-mode');

    }

    function selectItem(i) {

      dom.lastItem = dom.oList[i];

      data.step = i;

      game.objects.view.setAnnouncement();

      game.objects.view.setAnnouncement(dom.lastItem.innerHTML, -1, true);

      // animate immediately, twice; first to activate, second to check for completion. useful if this step has already been passed, etc.
      if (data.step > 0 && config.steps[data.step]) {
        config.steps[data.step].animate();
        config.steps[data.step].animate();
      }

    }

    function nextItem() {

      selectItem(data.step + 1);

    }

    function animate() {

      // "runtime" for tutorial
      if (data.frameCount % data.animateModulus === 0 && data.step !== null && config.steps[data.step]) {

        config.steps[data.step].animate();

      }

      data.frameCount++;

    }

    function init() {

      var temp;

      initDOM();

      utils.css.add(dom.o, css.active);

      addStep({

        // introduction

        animate: function() {

          // the player's helicopter.
          var chopper = game.objects.helicopters[0],
              chopperData = chopper.data;

          if (chopperData.ammo < chopperData.maxAmmo && chopperData.bombs < chopperData.maxBombs && !chopper.objects.bombs.length && !chopper.objects.gunfire.length) {

            // off to a good start.

            return true;

          }

        },

        complete: function() {

          nextItem();

        }

      });

      addStep({

        // helicopter refuel/repair

        animate: function() {

          var chopper;

          chopper = game.objects.helicopters[0];

          // player either landed and refueled, or died. ;)
          if (chopper.data.repairComplete) {
            return true;
          }

        },

        complete: function() {

          nextItem();

        }

      });

      addStep({

        // look, ma! bad guys!

        activate: function() {

          game.addObject('tank', {
            x: 1536,
            isEnemy: true
          });

          game.addObject('tank', {
            x: 1536 + 70,
            isEnemy: true
          });

          game.addObject('tank', {
            x: 1536 + 140,
            isEnemy: true
          });

          game.addObject('van', {
            x: 1536 + 210,
            isEnemy: true
          });

        },

        animate: function() {

          var counts = [countSides('tanks'), countSides('vans')];

          if (!counts[0].enemy && !counts[1].enemy) {

            return true;

          }

        },

        complete: function() {

          nextItem();

        }

      });

      addStep({

        // pick up a full load of infantry

        animate: function() {

          return (game.objects.helicopters[0].data.parachutes >= game.objects.helicopters[0].data.maxParachutes);

        },

        complete: function() {

          nextItem();

        }

      });

      addStep({

        // claim a nearby enemy bunker

        activate: function() {

          var targetBunker,
              i, j;

          for (i=0, j=game.objects.bunkers.length; i<j; i++) {

             if (!game.objects.bunkers[i].data.dead) {
               targetBunker = game.objects.bunkers[i];
               break;
             }

          }

          if (targetBunker) {

            // ensure the first bunker is an enemy one.
            targetBunker.capture(true);

            // ... and has a balloon
            targetBunker.repair();

            // keep track of original bunker states
            temp = countSides('bunkers');

          } else {

            // edge case: bunker has already been blown up, etc. bail.
            temp = countSides('bunkers');

            // next animate() call will pick this up and move to next step.
            temp.enemy++;

          }

        },

        animate: function() {

          var bunkers;

          bunkers = countSides('bunkers');

          if (bunkers.enemy < temp.enemy) {

            // a bunker was blown up, or claimed.

            return true;

          }

        },

        complete: function() {

          nextItem();

        }

      });

      addStep({

        // claim a nearby enemy Super Bunker

        activate: function() {

          var targetSuperBunker;

          targetSuperBunker = game.objects.superBunkers[0];

          if (targetSuperBunker) {

            // make it an enemy unit, if not already.
            targetSuperBunker.capture(true);

            // and arm it with infantry, such that 3 infantry will claim it.
            targetSuperBunker.data.energy = 2;

            // keep track of original bunker states
            temp = countSides('superBunkers');

          } else {

            // edge case: bunker has already been blown up, etc. bail.
            temp = countSides('superBunkers');

            // next animate() call will pick this up and move to next step.
            temp.enemy++;

          }

        },

        animate: function() {

          var superBunkers;

          superBunkers = countSides('superBunkers');

          if (superBunkers.enemy < temp.enemy) {

            // a Super Bunker was claimed.

            return true;

          }

        },

        complete: function() {

          nextItem();

        }

      });

      addStep({

        // order a Missile launcher, Tank, Van

        animate: function() {

          var item, counts, isComplete;

          // innocent until proven guilty.
          isComplete = true;

          counts = {

            missileLaunchers: countFriendly('missileLaunchers'),
            tanks: countFriendly('tanks'),
            vans: countFriendly('vans')

          };

          for (item in counts) {

            if (counts.hasOwnProperty(item)) {

              if (!counts[item]) {

                isComplete = false;

              }

            }

          }

          return isComplete;

        },

        complete: function() {

          nextItem();

        }

      });

      addStep({

        // destroy the enemy chopper!

        activate: function() {

          // make sure enemy helicopter is present

          if (game.objects.helicopters.length < 2) {

            // two screenfuls away, OR end of battlefield - whichever is less
            game.addObject('helicopter', {
              x: Math.min(game.objects.helicopters[0].data.x + game.objects.view.data.browser.width * 2, game.objects.view.data.battleField.width - 64),
              y: 72,
              isEnemy: true,
              // give the player a serious advantage, here.
              fireModulus: FPS/3,
              vX: 0
            });

          }

        },

        animate: function() {

          return game.objects.helicopters[1].data.dead;

        },

        complete: function() {

          nextItem();

        }

      });

      addStep({

        // defeat an incoming smart missile

        activate: function() {

          var missileX;

          // dis-arm superBunker so it doesn't kill incoming missile launchers, etc.
          game.objects.superBunkers[0].data.energy = 0;

          missileX = Math.min(game.objects.helicopters[0].data.x + game.objects.view.data.browser.width * 2, game.objects.view.data.battleField.width - 64);

          // make ze missile launcher
          game.addObject('missileLauncher', {
            x: missileX,
            isEnemy: true
          });

          game.addObject('missileLauncher', {
            x: missileX + 64,
            isEnemy: true
          });

        },

        animate: function() {

          return (countSides('missileLaunchers').enemy === 0 && countSides('smartMissiles').enemy === 0);

        },

        complete: function() {

          nextItem();

        }

      });

      addStep({

        // rebuild the first friendly, dead turret

        animate: function() {

          return (!game.objects.turrets[0].data.isEnemy && !game.objects.turrets[0].data.dead && game.objects.turrets[0].data.energy === game.objects.turrets[0].data.energyMax);

        },

        complete: function() {

          nextItem();

        }

      });

      addStep({

        // destroy (or claim) the first enemy turret

        activate: function() {

          var turrets = game.objects.turrets;

          // bring the mid-level turrets[1] and [2] to life.
          turrets[1].repair(true);
          turrets[2].repair(true);

        },

        animate: function() {

          return (!game.objects.turrets[1].data.isEnemy || game.objects.turrets[1].data.dead || !game.objects.turrets[2].data.isEnemy || game.objects.turrets[2].data.dead);

        },

        complete: function() {

          nextItem();

        }

      });

      addStep({

        // earn 50 funds

        animate: function() {

          return (game.objects.endBunkers[0].data.funds >= 50);

        },

        complete: function() {

          nextItem();

        }

      });

      // and begin
      selectItem(0);

    }

    config = {
      steps: []
    };

    css = {
      active: 'active'
    };

    data = {
      frameCount: 0,
      animateModulus: FPS/2,
      step: 0,
      steps: 0
    };

    dom = {
      o: null,
      oList: null,
      lastItem: null
    };

    exports = {
      animate: animate,
      selectItem: selectItem
    };

    init();

    return exports;

  };

  Queue = function() {

    var data, exports;

    data = {
      frameCount: 0,
      processInterval: FPS * 3,
      queue: [],
      queueMax: 128
    };

    function process() {

      // process all items in queue
      var i, j;

      for (i=0, j=data.queue.length; i<j; i++) {
        data.queue[i]();
      }

      // reset the queue + counter
      data.queue = [];
      data.frameCount = 0;

    }

    function add(callback) {

      // reset frameCount on add?
      data.frameCount = 0;
      data.queue.push(callback);

      if (data.queue.length >= data.queueMax) {
        // flush the queue
        process();
      }

    }

    function animate() {

      data.frameCount++;

      if (data.frameCount % data.processInterval === 0) {
        process();
      }

    }

    exports = {
      add: add,
      animate: animate,
      process: process
    };

    return exports;

  };

  FrameTimeout = function(frameInterval, callback) {

    /**
     * basic frame-based counter / "in X frames, do something"
     * cleaner alternate to setTimeout() / setInterval trickery
     * that conveniently uses existing frame-based animation.
     */

    var data, exports;

    data = {
      frameCount: 0,
      frameInterval: parseInt(frameInterval, 10),
      callbackFired: false
    };

    function animate() {

      data.frameCount++;

      if (data.frameCount >= data.frameInterval && !data.callbackFired) {

        callback();

        data.callbackFired = true;

        return true;

      }

      return false;

    }

    function reset() {

      data.frameCount = 0;
      data.callbackFired = false;

    }

    exports = {
      animate: animate,
      data: data,
      reset: reset
    };

    return exports;

  };

  // recycled from survivor.js

  keyboardMonitor = (function() {

    var keys,
        events,

       // hash for keys being pressed
       downKeys = {},

       // meaningful labels for key values
       keyMap = {
         'shift': 16,
         'ctrl': 17,
         'space': 32,
         'left': 37,
         'up': 38,
         'right': 39,
         'down': 40,
         'missileLauncher': 77,
         'tank': 84,
         'van': 86,
         'infantry': 73,
         'engineer': 69
         // 'helicopter': 72
       };

    events = {

      keydown: function(e) {

        // console.log(e.keyCode);

        if (!e.metaKey && keys[e.keyCode] && keys[e.keyCode].down) {
          if (downKeys[e.keyCode] === undefined) {
            downKeys[e.keyCode] = true;
            keys[e.keyCode].down(e);
          }
          if (keys[e.keyCode].allowEvent === undefined) {
            return stopEvent(e);
          }
        }

      },

      keyup: function(e) {

        if (!e.metaKey && downKeys[e.keyCode] !== undefined && keys[e.keyCode]) {
          delete downKeys[e.keyCode];
          if (keys[e.keyCode].up) {
            keys[e.keyCode].up(e);
          }
          if (keys[e.keyCode].allowEvent === undefined) {
            return stopEvent(e);
          }
        }

      }

    };

    keys = {

      // NOTE: Each function gets an (e) event argument.

      // shift
      '13': {

        allowEvent: true, // don't use stopEvent()

        down: function() {

          game.objects.helicopters[0].eject();

        }

      },

      // shift
      '16': {

        allowEvent: true, // don't use stopEvent()

        down: function() {

          game.objects.helicopters[0].setFiring(true);

        }

      },

      // ctrl (alternate for shift key)
      '17': {

        allowEvent: true, // don't use stopEvent()

        down: function() {

          game.objects.helicopters[0].setBombing(true);

        }

      },

      // space bar
      '32': {

        down: function() {

          game.objects.helicopters[0].setParachuting(true);

        },

        up: function() {

          game.objects.helicopters[0].setParachuting(false);

        }

      },

      // "m"
      '77': {

        down: function() {

          game.objects.inventory.order('missileLauncher');

        }

      },

      // "t"
      '84': {

        down: function() {

          game.objects.inventory.order('tank');

        }

      },

      // "v"
      '86': {

        down: function() {

          game.objects.inventory.order('van');

        }

      },

      // "c" (rubber chicken)
      '67': {

        down: function() {

          game.objects.helicopters[0].setMissileLaunching(true, true);

        },

        up: function() {

          game.objects.helicopters[0].setMissileLaunching(false);

        }

      },

      // "x"
      '88': {

        down: function() {

          game.objects.helicopters[0].setMissileLaunching(true);

        },

        up: function() {

          game.objects.helicopters[0].setMissileLaunching(false);

        }

      },

      // "e"
      '69': {

        down: function() {

          game.objects.inventory.order('engineer');

        }

      },

      // "i"
      '73': {

        down: function() {

          game.objects.inventory.order('infantry');

        }

      }

    };

    function isDown(labelOrCode) {

      // check for a pressed key based on '37' or 'left', etc.
      return (keyMap[labelOrCode] !== undefined ? downKeys[keyMap[labelOrCode]] : downKeys[labelOrCode]);

    }

    function releaseAll() {

      // reset all pressed key states.
      var item;
      for (item in downKeys) {
        if (downKeys.hasOwnProperty(item)) {
          // simulate the keyup event
          events.keyup({
            keyCode: item
          });
        }
      }

    }

    function attachEvents() {

      utils.events.add(document, 'keydown', events.keydown);
      utils.events.add(document, 'keyup', events.keyup);

    }

    // init?

    function init() {

      attachEvents();

    }

    return {

      init: init,
      isDown: isDown,
      releaseAll: releaseAll

    };

  }());

  game = (function() {

    var data, dom, objects, objectConstructors, exports;

    function addObject(type, options) {

      // given type of 'van', create object and append to respective array.

      var object, objectArray;

      // 'van' -> game.objects['vans'], etc.
      objectArray = game.objects[type + (type === 'infantry' ? '' : 's')];

      options = options || {};

      // create and push an instance object onto its relevant array by type (e.g., 'van' -> game.objects['vans'])
      if (objectConstructors[type]) {
        object = new objectConstructors[type](options);
      } else {
        console.warn('No constructor of type ' + type);
      }

      objectArray.push(object);

      return object;

    }

    function createObjects() {

      var i, x;

      stats = new Stats();

      objects.gameLoop = new GameLoop();

      objects.queue = new Queue();

      objects.view = new View();

      objects.radar = new Radar();

      objects.inventory = new Inventory();

      // tutorial?

      if (tutorialMode) {

        objects.tutorial = new Tutorial();

        utils.css.add(document.getElementById('help'), 'active');

      } else {

        utils.css.add(document.getElementById('help'), 'inactive');

      }

      // player's landing pad

      addObject('landingPad', {
        x: 300
      });

      addObject('base', {
        x: 160
      });

      addObject('base', {
        x: 8000,
        isEnemy: true
      });

      // local, and enemy base end bunkers

      addObject('endBunker');

      addObject('endBunker', {
        isEnemy: true
      });

      if (gameType === 'hard' || gameType === 'extreme') {

        // level 9

        // mid and end-level landing pad. create up-front, since vans rely on it for xGameOver.

        addObject('landingPad', {
          x: 3944
        });

        addObject('landingPad', {
          x: 7800
        });

        // twin enemy turrets, mid-field - good luck.
        if (gameType === 'extreme') {
          addObject('turret', {
            x: 3800,
            isEnemy: true
          });
          addObject('turret', {
            x: 4145,
            isEnemy: true
          });
        }

        addItem('right-arrow-sign', 550);

        x = 630;

        addObject('bunker', {
          x: x,
          isEnemy: true
        });

        x += 230;

        addItem('grave-cross', x);

        x += 12;

        addItem('cactus2', x);

        x += 92;

        addObject('turret', {
          x: x,
          isEnemy: true,
          DOA: false
        });

        x += 175;

        addObject('bunker', {
          x: x,
          isEnemy: true
        });

        x += 100;

        addObject('tank', {
          x: x,
          isEnemy: true
        });

        addItem('grave-cross', x);

        x += 40;

        addItem('cactus', x);

        x += 250;

        addObject('tank', {
          x: x,
          isEnemy: true
        });

        x += 50;

        addObject('tank', {
          x: x,
          isEnemy: true
        });

        x += 80;

        for (i=0; i<10; i++) {

          addObject('infantry', {
            x: x + (i * 11),
            isEnemy: true
          });

        }

        addObject('van', {
          x: x + 210,
          isEnemy: true
        });

        addItem('gravestone', x);

        x += 110;

        addObject('superBunker', {
          x: x,
          isEnemy: true,
          energy: 5
        });

        x += 120;

        addObject('turret', {
          x: x,
          isEnemy: true,
          DOA: false
        });

        x += 640;

        addItem('gravestone', x);

        addObject('van', {
          x: x,
          isEnemy: true
        });

        for (i=0; i<5; i++) {

          addObject('infantry', {
            x: (x + 50) + (i * 11),
            isEnemy: true
          });

        }

        x += 80;

        addItem('sand-dunes', x);

        addObject('tank', {
          x: x + 75,
          isEnemy: true
        });

        for (i=0; i<5; i++) {

          addObject('infantry', {
            x: (x + 75) + (i * 11),
            isEnemy: true
          });

        }

        addObject('tank', {
          x: x + 240,
          isEnemy: true
        });

        x += 540;

        addObject('tank', {
          x: x,
          isEnemy: true
        });

        addObject('tank', {
          x: x + 240,
          isEnemy: true
        });

        for (i=0; i<5; i++) {

          addObject('infantry', {
            x: (x + 240 + 75) + (i * 11),
            isEnemy: true
          });

        }

        addObject('van', {
          x: x + 240 + 215,
          isEnemy: true
        });

        addObject('bunker', {
          x: x,
          isEnemy: true
        });

        x += 135;

        addItem('gravestone', x);

        x += 25;

        addItem('cactus2', x);

        x += 260;

        addItem('sand-dune', x);

        x -= 40;

        addItem('grave-cross', x);

        x += 150;

        addItem('sand-dunes', x);

        x += 150;

        addObject('bunker', {
          x: x,
          isEnemy: true
        });

        x += 115;

        // landing pad is logically added here.

        x += 88;

        // gravestone sits behind...

        x += 10;

        addItem('gravestone', x);

        x -= 10;

        // now, stack on top

        addItem('sand-dune', x);

        addItem('grave-cross', x);

        x += 54;

        addObject('bunker', {
          x: x,
          isEnemy: true
        });

        x -= 6;

        addItem('checkmark-grass', x);

        x += 90;

        addItem('cactus', x);

        x += 305;

        addItem('gravestone', x);

        x += 32;

        addItem('grave-cross', x);

        x += 80;

        addItem('sand-dune', x);

        x += 115;

        addItem('grave-cross', x);

        x += 175;

        addItem('gravestone', x);

        x += 55;

        addItem('cactus2', x);

        x += 85;

        addItem('gravestone', x);

        x += 25;

        addItem('grave-cross', x);

        x += 70;

        addObject('bunker', {
          x: x,
          isEnemy: true
        });

        x += 5;

        addItem('gravestone', x);

        x += 85;

        addItem('gravestone', x);

        x += 192;

        addItem('gravestone', x);

        x += 96;

        addItem('gravestone', x);

        x += 150;

        addItem('grave-cross', x);

        x += 50;

        addItem('gravestone', x);

        x += 260;

        addItem('gravestone', x);

        x += 45;

        addItem('sand-dunes', x);

        x += 215;

        addItem('cactus2', x);

        x += 60;

        addObject('superBunker', {
          x: x,
          isEnemy: true,
          energy: 5
        });

        x += 125;

        addObject('turret', {
          x: x,
          isEnemy: true,
          DOA: false
        });

        x += 145;

        addObject('bunker', {
          x: x,
          isEnemy: true
        });

        x += 128;

        addObject('bunker', {
          x: x,
          isEnemy: true
        });

        x += 20;

        addItem('grave-cross', x);

        x += 64;

        addItem('cactus2', x);

        x += 50;

        addItem('gravestone', x);

        x += 200;

        addItem('gravestone', x);

        x += 115;

        addItem('cactus', x);

        x += 42;

        addItem('grave-cross', x);

        x += 140;

        addItem('cactus2', x);

        x += 12;

        addItem('cactus2', x);

        x += 100;

        addItem('gravestone', x);

        x += 145;

        // ideally, this should be between the right post sign now.

        addItem('grave-cross', x);

      } else {
        
        // level 1

        // mid and end-level landing pads (affects van objects' xGameOver property, so create this ahead of vans.)

        addObject('landingPad', {
          x: 4096 - 290
        });

        addObject('landingPad', {
          x: 7800
        });

        addObject('turret', {
          x: 475,
          DOA: true
        });

        addObject('bunker', {
          x: 1024,
          isEnemy: true
        });

        addItem('right-arrow-sign', 550);

        addItem('tree', 660);

        addItem('palm-tree', 860);

        addItem('barb-wire', 918);

        addItem('palm-tree', 1120);

        addItem('rock2', 1280);

        addItem('palm-tree', 1390);

        addObject('bunker', {
          x: 1536
        });

        addItem('palm-tree', 1565);

        addItem('flower', 1850);

        addObject('bunker', {
          x: 2048
        });

        addItem('tree', 2110);

        addItem('gravestone', 2150);

        addItem('palm-tree', 2260);

        addItem('tree', 2460);

        addObject('bunker', {
          x: 2560
        });

        addItem('tree', 2700);

        addObject('bunker', {
          x: 3072
        });

        addItem('palm-tree', 3400);

        addItem('palm-tree', 3490);

        addItem('checkmark-grass', 4120);

        addItem('palm-tree', 4550);

        addObject('bunker', {
          x: 4608,
          isEnemy: true
        });

        addItem('tree', 4608);

        addItem('tree', 4820);

        addItem('palm-tree', 4850);

        addItem('grave-cross', 4970);

        addObject('bunker', {
          x: 5120,
          isEnemy: true
        });

        addItem('tree', 5110);

        addItem('barb-wire', 5200);

        addItem('grave-cross', 5275);

        addObject('bunker', {
          x: 5632,
          isEnemy: true
        });

        // near-end / enemy territory

        addItem('palm-tree', 3932 + 32);

        addItem('tree', 3932 + 85);

        addItem('palm-tree', 3932 + 85 + 230);

        addItem('tree', 3932 + 85 + 230 + 90);

        addObject('bunker', {
          x: 6656,
          isEnemy: true
        });

        addItem('tree', 6736);

        addItem('tree', 6800);

        addItem('palm-tree', 6888);

        addItem('gravestone', 7038);

        addItem('tree', 7070);

        addItem('gravestone', 7160);

        addItem('palm-tree', 7310);

        addItem('tree', 7325);

        addItem('flower', 7500);

        // enemy base sign

        addItem('left-arrow-sign', 7700);

        // more mid-level stuff

        addObject('superBunker', {
          x: 4096 - 640 - 128,
          isEnemy: true,
          energy: 5
        });

        addObject('turret', {
          x: 4096 - 640, // width of landing pad
          isEnemy: true,
          DOA: !!tutorialMode
        });

        addObject('turret', {
          x: 4096 + 120, // width of landing pad
          isEnemy: true,
          DOA: !!tutorialMode
        });

        // vehicles!

        if (!winloc.match(/novehicles/i) && !tutorialMode) {

          // friendly units

          addObject('van', {
            x: 192
          });

          for (i=0; i<5; i++) {

            addObject('infantry', {
              x: 600 + (i * 20)
            });

          }

          addObject('van', {
            x: 716
          });

          addObject('tank', {
            x: 780
          });

          addObject('tank', {
            x: 845
          });

          // first enemy convoy

          addObject('tank', {
            x: 1536,
            isEnemy: true
          });

          addObject('tank', {
            x: 1536 + 70,
            isEnemy: true
          });

          addObject('tank', {
            x: 1536 + 140,
            isEnemy: true
          });

          addObject('van', {
            x: 1536 + 210,
            isEnemy: true
          });

          addObject('tank', {
            x: 2048 + 256,
            isEnemy: true
          });

          addObject('tank', {
            x: 4608 + 256,
            isEnemy: true
          });

          for (i=0; i<5; i++) {

            // enemy infantry, way out there
            addObject('infantry', {
              x: 5120 + (i * 20),
              isEnemy: true
            });

          }

        }

      }

      // happy little clouds!

      addObject('cloud', {
        x: 512
      });

      addObject('cloud', {
        x: 4096 - 256
      });

      addObject('cloud', {
        x: 4096 + 256
      });

      addObject('cloud', {
        x: 4096 + 512
      });

      addObject('cloud', {
        x: 4096 + 768
      });

      // a few rogue balloons

      addObject('balloon', {
        x: 4096 - 256
      });

      addObject('balloon', {
        x: 4096 + 256
      });

      addObject('balloon', {
        x: 4096 + 512
      });

      addObject('balloon', {
        x: 4096 + 768
      });

      // player + enemy helicopters

      addObject('helicopter', {
        x: 310,
        y: game.objects.view.data.world.height - 20,
        attachEvents: true
      });

      if (!tutorialMode) {

        addObject('helicopter', {
          x: 8192 - 64,
          y: 72,
          isEnemy: true,
          vX: -8
        });

      }

    }

    function pause() {

      if (!data.paused) {
        objects.gameLoop.stop();
        soundManager.mute();
        data.paused = true;
      }

    }

    function resume() {

      if (data.paused) {
        objects.gameLoop.start();
        if (!userDisabledSound) {
          soundManager.unmute();
        }
        data.paused = false;
      }
  
    }

    function init() {

      dom.world = document.getElementById('battlefield');

      if (convoyParam) {

        // for example, ?convoydelay=30
        convoyDelay = parseInt(winloc.substr(convoyParam + 12), 10);

        if (!isNaN(convoyDelay)) {
          console.log('applying custom enemy convoy delay of ' + convoyDelay);
        } else {
          convoyDelay = (gameType === 'extreme' ? 20 : (gameType === 'hard' ? 30 : 60));
        }

      }

      // create objects?
      createObjects();

      objects.gameLoop.init();

      if (sounds.helicopter.engine && !userDisabledSound) {

        sounds.helicopter.engine.sound.play();

      }

      (function() {

        // basic enemy ordering crap
        var enemyOrders = ['missileLauncher', 'tank', 'van', 'infantry', 'infantry', 'infantry', 'infantry', 'infantry', 'engineer', 'engineer'];
        var enemyDelays = [4, 4, 3, 0.4, 0.4, 0.4, 0.4, 1, 0.45, convoyDelay];
        var i = 0;

        function orderNextItem() {

          var options;

          if (!battleOver && !data.paused) {

            options = {
              isEnemy: true,
              x: 8192 + 64
            };

            if (!productionHalted) {
              game.objects.inventory.createObject(game.objects.inventory.data.types[enemyOrders[i]], options);
            }

            window.setTimeout(orderNextItem, enemyDelays[i] * 1000);

            i++;

            if (i >= enemyOrders.length) {
              i = 0;
            }

          }

        }

        // and begin
        if (!tutorialMode) {
          window.setTimeout(orderNextItem, 5000);
        }

      }());

    }

    data = {
      paused: false
    };

    dom = {
      world: null
    };

    objects = {
      gameLoop: null,
      view: null,
      chains: [],
      balloons: [],
      bunkers: [],
      endBunkers: [],
      engineers: [],
      infantry: [],
      parachuteInfantry: [],
      missileLaunchers: [],
      superBunkers: [],
      tanks: [],
      vans: [],
      helicopters: [],
      smartMissiles: [],
      bases: [],
      clouds: [],
      landingPads: [],
      turrets: [],
      shrapnel: [],
      smoke: [],
      radar: null,
      inventory: null,
      tutorial: null,
      queue: null
    };

    objectConstructors = {
      'balloon': Balloon,
      'base': Base,
      'bunker': Bunker,
      'cloud': Cloud,
      'endBunker': EndBunker,
      'engineer': Engineer,
      'helicopter': Helicopter,
      'infantry': Infantry,
      'landingPad': LandingPad,
      'missileLauncher': MissileLauncher,
      'superBunker': SuperBunker,
      'turret': Turret,
      'tank': Tank,
      'van': Van
    };

    exports = {
      addObject: addObject,
      dom: dom,
      init: init,
      objects: objects,
      pause: pause,
      resume: resume
    };

    return exports;

  }());

  function startGame() {

    // should scaling be disabled, per user preference?
    if (utils.storage.get(prefs.noScaling)) {
      userDisabledScaling = true;
    }

    if (utils.storage.get(prefs.noSound)) {
      userDisabledSound = true;
    }

    // updateScreenScale();
    // applyScreenScale();

    if (forceRubberChicken) {
      utils.css.add(document.getElementById('world'), 'rubber-chicken-mode');
    }

    game.init();

    keyboardMonitor.init();

/*
    function updateStats() {

      var c1, c2;

      c1 = document.getElementById('top-bar').querySelectorAll('.sprite').length;
      c2 = document.getElementById('battlefield').querySelectorAll('.sprite').length;

      window.setTimeout(updateStats, 5000);

    }

    if (window.location.toString().match(/profil/i)) {

      updateStats();

    }
*/

  }

  function init() {

    // late addition: tutorial vs. regular game mode

    // hackish: no-trasform CSS tweak
    if (noTransform) {
      utils.css.add(document.body, 'no-transform');
    }

    var menu,
        description = document.getElementById('game-description'),
        defaultDescription = description.innerHTML,
        lastHTML = defaultDescription;

    function menuUpdate(e) {

      var target = (e.target || window.event.sourceElement),
          title;

      if (target && target.className.match(/cta/i)) {
        title = target.title;
        if (title) {
          target.setAttribute('data-title', title);
          target.title = '';
        } else {
          title = target.getAttribute('data-title');
        }
        if (lastHTML !== title) {
          description.innerHTML = title;
          lastHTML = title;
        }
      } else {
        resetMenu();
      }

    }

    function resetMenu() {
      if (lastHTML != defaultDescription) {
        description.innerHTML = defaultDescription;
        lastHTML = defaultDescription;
      }
    }

    function menuClick(e) {

      // infer game type from link, eg., #tutorial

      var target = (e.target || window.event.sourceElement),
          storedOK,
          param;

      if (target && target.href) {

        // cleanup
        utils.events.remove(menu, 'click', menuClick);
        utils.events.remove(menu, 'mouseover', menuUpdate);
        utils.events.remove(menu, 'mouseout', menuUpdate);
        menu = null;

        param = target.href.substr(target.href.indexOf('#')+1);

        if (param === 'easy') {

          // window.location.hash = param;

          // set local storage value, and continue
          storedOK = utils.storage.set(prefs.gameType, 'easy');

          // stoage failed? use hash, then.
          if (!storedOK) {
            window.location.hash = param;
          }

          if (gameType === 'hard' || gameType === 'extreme') {

            // reload, since we're switching to easy
            window.location.reload();

          }

        } else if (param === 'hard' || param === 'extreme') {

          // set local storage value, and continue
          storedOK = utils.storage.set(prefs.gameType, param);

          // stoage failed? use hash, then.
          if (!storedOK) {
            window.location.hash = param;
          }

          window.location.reload();

        } else {

          window.location.hash = 'tutorial';

          window.location.reload();

        }

      }

      utils.events.preventDefault(e);

      canHideLogo = true;

      return false;

    }

    winloc = window.location.href.toString();

    // should we show the menu?

    gameType = (winloc.match(/easy|hard|extreme|tutorial/i) || utils.storage.get(prefs.gameType));

    if (gameType instanceof Array) {
      gameType = gameType[0];
    }

    // safety check
    if (gameType && !gameType.match(/easy|hard|extreme|tutorial/i)) {
      gameType = null;
    }

    if (!gameType) {

      menu = document.getElementById('game-menu');

      if (menu) {

        utils.css.add(document.getElementById('world'), 'blurred');

        utils.css.add(menu, 'visible');

        utils.events.add(menu, 'click', menuClick);

        utils.events.add(menu, 'mouseover', menuUpdate);

        utils.events.add(menu, 'mouseout', menuUpdate);

      }

    } else {

      // prference set or game type in URL - start immediately.

      // TODO: cleaner DOM reference
      if (gameType.match(/easy|hard|extreme/i)) {
        utils.css.add(document.getElementById('world'), 'regular-mode');
      }

      canHideLogo = true;

    }

    startGame();

  }

  window.aa = {

    init: init,

    startGame: startGame,

    toggleScaling: function(savePref) {

      var prefName = prefs.noScaling;

      userDisabledScaling = !userDisabledScaling;

      updateScreenScale();

      applyScreenScale();

      game.objects.view.events.resize();

      if (savePref) {

        if (userDisabledScaling) {
          utils.storage.set(prefName, true);
        } else {
          utils.storage.remove(prefName);
        }

      }

      return false;

    },

    startTutorial: function() {

      utils.storage.remove(prefs.gameType);

      window.location.hash = 'tutorial';

      window.setTimeout(function() {
        window.location.reload();
      }, 1);

      return false;

    },

    exit: function() {

      // delete stored preference
      utils.storage.remove(prefs.gameType);

      window.location.hash = '';

      window.setTimeout(function() {
        window.location.reload();
      }, 1);

      return false;

    },

    toggleSound: function() {

      userDisabledSound = !userDisabledSound;

      if (userDisabledSound) {
        utils.storage.set(prefs.noSound, true);
        soundManager.mute();
      } else {
        utils.storage.remove(prefs.noSound);
        soundManager.unmute();
      }

      return false;

    }

  };

  prefs = {
    gameType: 'gameType',
    noScaling: 'noScaling',
    noSound: 'noSound'
  };

  // OGG is available, so MP3 is not required.
  soundManager.audioFormats.mp3.required = false;

  var preferFlash = false;

  if (isSafari && navigator.userAgent.match(/Version\/[7|8]/i) && !window.location.toString().match(/html5audio/i)) {
    // https://bugs.webkit.org/show_bug.cgi?id=116145
    // looks like it will be fixed in a future release. try #html5audio=1 in URL to override/test.
    console.log('Preferring Flash for audio due to Safari 7 + 8 HTML5 audio performance bug. https://bugs.webkit.org/show_bug.cgi?id=116145');
    preferFlash = true;
    // workaround for SM2, which will ignore preferFlash if MP3 + MP4 are not required.
    soundManager.audioFormats.mp3.required = true;
    // needed for good performance in Safari, otherwise multiShot lags a bit.
    soundManager.setup({
      useHighPerformance: true,
      onready: function() {
        if (soundManager.html5Only) {
          // no flash or blocked etc., fell back to HTML5 anyway - this is bad. disable sound entirely.
          console.log('SM2 fell back to HTML5 audio, which doesn\'t work here; disabling sound entirely.');
          soundManager.disable();
        }
      }
    });
  }

  soundManager.setup({
    flashVersion: 9,
    preferFlash: preferFlash,
    url: './swf/',
    debugMode: false,
    defaultOptions: {
      volume: 25,
      multiShot: true, // !!(winloc.match(/multishot/i)),
      // TODO: move to sound sprites, etc.
      autoLoad: true
    }
  });

  if (window.location.toString().match(/mute/i)) {
    soundManager.disable();
  }

  setTimeout(window.aa.init, 20);

}(window));