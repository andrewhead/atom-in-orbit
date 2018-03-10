'use strict';

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

/** @babel */
var listeners = {};
var handlers = {};

function registerGetterSetter(action) {
  for (var _len = arguments.length, initialValue = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    initialValue[_key - 1] = arguments[_key];
  }

  var value = initialValue;
  handlers['set-' + action] = function () {
    for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      args[_key2] = arguments[_key2];
    }

    value = args;
    dispatch.apply(undefined, ['ipc-helpers-set-' + action + '-response'].concat(_toConsumableArray(value)));
  };
  handlers['get-' + action] = function () {
    for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
      args[_key3] = arguments[_key3];
    }

    value = args;
    dispatch.apply(undefined, ['ipc-helpers-get-' + action + '-response'].concat(_toConsumableArray(value)));
  };
}
function registerMethod(action, value) {
  handlers[action] = function () {
    dispatch('ipc-helpers-' + action + '-response', value);
  };
}

var temporaryWindowState = JSON.stringify({
  version: 1,
  project: {
    deserializer: "Project",
    paths: [],
    buffers: []
  },
  workspace: {
    deserializer: "Workspace",
    paneContainer: {
      deserializer: "PaneContainer",
      version: 1,
      root: {
        deserializer: "Pane",
        id: 3,
        items: []
      }
    },
    packagesWithActiveGrammars: [],
    destroyedItemURIs: []
  },
  fullScreen: false,
  windowDimensions: {
    x: 130,
    y: 45,
    width: 918,
    height: 760,
    maximized: false
  },
  textEditors: {
    editorGrammarOverrides: {}
  }
});

// TODO(mbolin): Figure out how to use the above instead of this opaque string.
temporaryWindowState = '{"version":1,"project":{"deserializer":"Project","paths":[],"buffers":[{"id":"118017ce453321af3b41bd5ece2d8413","text":"","defaultMarkerLayerId":"34","markerLayers":{"1":{"id":"1","maintainHistory":false,"persistent":true,"markersById":{},"version":2},"3":{"id":"3","maintainHistory":true,"persistent":true,"markersById":{"1":{"range":{"start":{"row":0,"column":0},"end":{"row":0,"column":0}},"properties":{},"reversed":false,"tailed":false,"valid":true,"invalidate":"never"}},"version":2},"4":{"id":"4","maintainHistory":false,"persistent":true,"markersById":{},"version":2}},"displayLayers":{"0":{"id":0,"foldsMarkerLayerId":"1"}},"nextMarkerLayerId":40,"nextDisplayLayerId":1,"history":{"version":5,"nextCheckpointId":1,"undoStack":[],"redoStack":[],"maxUndoEntries":10000},"encoding":"utf8","preferredLineEnding":"\\n","nextMarkerId":2}]},"workspace":{"deserializer":"Workspace","paneContainer":{"deserializer":"PaneContainer","version":1,"root":{"deserializer":"Pane","id":3,"items":[{"deserializer":"TextEditor","version":1,"displayBuffer":{"tokenizedBuffer":{"deserializer":"TokenizedBuffer","bufferId":"118017ce453321af3b41bd5ece2d8413","tabLength":2,"largeFileMode":false}},"tokenizedBuffer":{"deserializer":"TokenizedBuffer","bufferId":"118017ce453321af3b41bd5ece2d8413","tabLength":2,"largeFileMode":false},"displayLayerId":0,"selectionsMarkerLayerId":"3","firstVisibleScreenRow":0,"firstVisibleScreenColumn":0,"atomicSoftTabs":true,"softWrapHangingIndentLength":0,"id":4,"softTabs":true,"softWrapped":false,"softWrapAtPreferredLineLength":false,"preferredLineLength":80,"mini":false,"width":881,"largeFileMode":false,"registered":true,"invisibles":{"eol":"¬","space":"·","tab":"»","cr":"¤"},"showInvisibles":false,"showIndentGuide":false,"autoHeight":false}],"itemStackIndices":[0],"activeItemIndex":0,"focused":false,"flexScale":1},"activePaneId":3},"packagesWithActiveGrammars":["language-hyperlink","language-todo"],"destroyedItemURIs":[]},"packageStates":{"bookmarks":{"4":{"markerLayerId":"4"}},"fuzzy-finder":{},"metrics":{"sessionLength":42118},"tree-view":{"directoryExpansionStates":{},"hasFocus":false,"attached":false,"scrollLeft":0,"scrollTop":0,"width":0}},"grammars":{"grammarOverridesByPath":{}},"fullScreen":false,"windowDimensions":{"x":130,"y":45,"width":918,"height":760,"maximized":false},"textEditors":{"editorGrammarOverrides":{}}}';

registerGetterSetter('temporary-window-state', temporaryWindowState);
registerGetterSetter('window-size');
registerGetterSetter('window-position');
registerMethod('window-method');
registerMethod('show-window');
registerMethod('focus-window');

function dispatch(action) {
  for (var _len4 = arguments.length, args = Array(_len4 > 1 ? _len4 - 1 : 0), _key4 = 1; _key4 < _len4; _key4++) {
    args[_key4 - 1] = arguments[_key4];
  }

  (listeners[action] || []).forEach(function (listener) {
    listener.apply(undefined, [action].concat(args));
  });
}

module.exports = {
  app: {
    getPath: function getPath(arg) {
      if (arg === 'home') {
        return require('fs-plus').getHomeDirectory();
      } else {
        console.error('app.getPath() called with ' + arg + ': not supported.');
      }
    },
    getVersion: function getVersion() {
      // TODO: Read this from Atom's package.json.
      return '0.37.8';
    },
    on: function on(eventName, callback) {
      console.error('Dropping ' + eventName + ' on the floor in Electron.');
    },
    setAppUserModelId: function setAppUserModelId(modelId) {}
  },

  ipcRenderer: {
    on: function on(action, cb) {
      if (!listeners[action]) {
        listeners[action] = [];
      }
      listeners[action].push(cb);
      if (action === 'ipc-helpers-get-temporary-window-state-response') {
        dispatch('ipc-helpers-get-temporary-window-state-response', temporaryWindowState);
      }
    },
    send: function send(action) {
      var handler = handlers[action];

      for (var _len5 = arguments.length, args = Array(_len5 > 1 ? _len5 - 1 : 0), _key5 = 1; _key5 < _len5; _key5++) {
        args[_key5 - 1] = arguments[_key5];
      }

      if (!handler) {
        var _console;

        // (_console = console).warn.apply(_console, ['Ignored IPC call', action].concat(args));
        return;
      }
      handler.apply(undefined, args);
    },
    sendSync: function sendSync(action) {
      var handler = handlers[action];

      for (var _len6 = arguments.length, args = Array(_len6 > 1 ? _len6 - 1 : 0), _key6 = 1; _key6 < _len6; _key6++) {
        args[_key6 - 1] = arguments[_key6];
      }

      if (!handler) {
        var _console2;

        (_console2 = console).warn.apply(_console2, ['Ignored synchronous IPC call', action].concat(args));
        return;
      }
      handler.apply(undefined, args);
    },
    removeAllListeners: function removeAllListeners(action) {
      delete listeners[action];
    },
    removeListener: function removeListener(action, callback) {
      var listenersForAction = listeners[action] || [];
      var index = listenersForAction.indexOf(callback);
      if (index !== -1) {
        listenersForAction.splice(index, 1);
      }
    }
  },

  remote: {
    getCurrentWindow: function getCurrentWindow() {
      return {
        on: function on() {},
        isFullScreen: function isFullScreen() {
          return false;
        },
        getPosition: function getPosition() {
          return [0, 0];
        },
        getSize: function getSize() {
          return [800, 600];
        },
        isMaximized: function isMaximized() {
          return false;
        },
        isWebViewFocused: function isWebViewFocused() {
          return true;
        },
        removeListener: function removeListener(action, callback) {
          console.warn('Failing to remove listener for ' + action + ' in remote.getCurrentWindow().');
        }
      };
    },


    screen: {
      getPrimaryDisplay: function getPrimaryDisplay() {
        return {
          workAreaSize: {}
        };
      }
    }
  },

  webFrame: {
    setZoomLevelLimits: function setZoomLevelLimits() {}
  },

  screen: {
    on: function on() {},
    removeListener: function removeListener(action, callback) {}
  }
};
