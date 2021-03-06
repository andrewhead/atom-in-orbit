'use strict';

// By default, browserify sets process.platform to 'browser'. Atom needs a
// real value for process.platform because it does a lot of resource loading
// based on this variable (including keyboard shortcut registration!).
function detectPlatform() {
  var platform = 'browser';
  var userAgentPlatform = void 0;
  try {
    userAgentPlatform = window.navigator.platform;
  } catch (e) {
    console.error('Could not find the platform: assuming \'' + platform + '\'.');
    return platform;
  }

  if (userAgentPlatform.includes('Mac')) {
    platform = 'darwin';
  } else if (userAgentPlatform.includes('Linux')) {
    platform = 'linux';
  } else if (userAgentPlatform.includes('Win')) {
    platform = 'win32';
  }

  return platform;
}
process.platform = detectPlatform();

window.setImmediate = function (callback) {
  Promise.resolve().then(callback);
};

var pathModule = require('path');

var resourcePath = ATOM_RESOURCE_PATH;

// This exists in a GitHub checkout of Atom, but I cannot seem to
// find it under /Applications/Atom.app/.
var menusDirPath = resourcePath + '/menus';
var menusConfigFile = menusDirPath + '/menu.json';

// process.env.ATOM_DEV_RESOURCE_PATH = '/This/is/fake';
process.env.ATOM_HOME = '/This/is/.atom';
process.resourcesPath = resourcePath;

/*
window.location.hash = '#' + JSON.stringify({
  initialPaths: [],
  locationsToOpen: [{}],
  // windowInitializationScript: 'atom/src/initialize-application-window.coffee',
  resourcePath,
  devMode: false,
  safeMode: false,
  profileStartup: false,
  clearWindowState: false,
  env: {
    ATOM_HOME: process.env.ATOM_HOME,
    ATOM_DEV_RESOURCE_PATH: '/This/is/fake',
  },
  appVersion: '1.11.2',
  atomHome: '',
  shellLoadTime: 999,
});
*/

process.binding = function (arg) {
  // console.warn('process.binding() called with ' + arg + ': not supported.');
  return {};
};

var inMemoryFs = new BrowserFS.FileSystem.InMemory();
BrowserFS.initialize(inMemoryFs);

// Define these environment variables for the benefit of fs-plus's
// getHomeDirectory() function and anyone else who might need it.
process.env.HOME = '/home/andrew';
process.env.USERPROFILE = '/home/andrew';

var fs = require('fs');
var fsPlus = require('fs-plus');
function addFile(file, contents) {
  fsPlus.makeTreeSync(pathModule.dirname(file));
  fs.writeFileSync(file, contents);
}

// Unfortunately, I'm not sure why this hack works. Between fs, multiple versions
// of fs-plus, and browserfs, there are a lot of entities trying to do funny things
// with the fs module. We need to do some work to ensure only one instance of is
// is used in the system. lstatSyncNoException is an API introduced by fs-plus, but
// somehow it was missing when calling atom.project.addPath() when tree-view is loaded.
fs.lstatSyncNoException = fsPlus.lstatSyncNoException = function (filePath) {
  try {
    return fs.lstatSync(filePath);
  } catch (e) {
    return null;
  }
};

for (var fileName in ATOM_FILES_TO_ADD) {
  addFile(fileName, ATOM_FILES_TO_ADD[fileName]);
}

var atomPackages = [];

for (var pkgName in ATOM_PACKAGE_DATA) {
  var packageData = ATOM_PACKAGE_DATA[pkgName];
  atomPackages.push({
    name: pkgName,
    main: packageData.metadata.main
  });
  var entryMap = packageData['files'];
  for (var _fileName in entryMap) {
    var contents = entryMap[_fileName];
    addFile(_fileName, contents);
  }
}

fsPlus.resolveOnLoadPath = function () {
  for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }

  return fsPlus.resolve.apply(fsPlus, require('module').globalPaths.concat(args));
};

// TODO: Find a better way to hack this?
require('module').globalPaths = [];
require('module').paths = [];

// Ultimately, two things should happen:
// 1. tree-view should be fixed so it can tolerate an empty state.
// 2. This should be able to be specified from the caller if someone
//    creates a webapp that
var atomPackageInitialState = {
  'tree-view': {
    attached: false
  }
};

window.loadAtom = function (callback) {
  var initializeApplicationWindow = require('./initialize-application-window');

  // Various things try to write to the BlobStore.
  var FileSystemBlobStore = require('./file-system-blob-store.js');
  var blobStore = new FileSystemBlobStore('/tmp');

  initializeApplicationWindow({ blobStore: blobStore }).then(function () {
    require('electron').ipcRenderer.send('window-command', 'window:loaded');

    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = atomPackages[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var atomPackage = _step.value;
        var name = atomPackage.name,
            main = atomPackage.main;

        if (name !== 'atom-patch') {
          atom.packages.activatePackage(ATOM_PACKAGE_ROOT_FROM_BROWSERIFY + '/' + name);
          var initialState = atomPackageInitialState[name];
          // TODO(mbolin): Use main to eliminate the repeated calls to require() with
          // one line of code in this loop. May be a problem for browserify's static pass.
        }
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }

    // require('command-palette/lib/command-palette-view').activate();
    // require('find-and-replace/lib/find.js').activate();
    // require('go-to-line/lib/go-to-line-view').activate();
    // require('markdown-preview/lib/main.js').activate();
    require('notifications/lib/main.js').activate();
    // require('status-bar/lib/main.js').activate();
    // require('script/lib/script.js').activate();

    // Open up the test file.  Wait to initialize CodeScoop until the test file
    // has been opened, as it needs to initialize on that file.
    atom.workspace.project.addPath("/home/andrew/")
    atom.workspace.open("sandbox/QueryDatabase.java").then(function () {
      require('codescoop/lib/examplify.js').activate();
    });

    // For whatever reason, Atom seems to think tabs should not be auto-activated?
    // atom.packages.loadedPackages['tabs'].mainModulePath is undefined.
    // Though even if it could, it's unclear that it would load the path that Browserify
    // has prepared, so we may be better off loading it explicitly.
    // require('tabs/lib/main.js').activate();


    // tree-view does not seem to tolerate the case where it receives an empty state
    // from the previous session, so we make sure to pass one explicitly.
    // var treeViewState = { attached: false };
    // require('tree-view/lib/main.js').activate(treeViewState);

    var paramsForCaller = {
      atom: atom,
      fs: fsPlus
    };
    callback(paramsForCaller);
  });
};
