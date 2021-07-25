# Electroloader

The simplest way to load contents of all active [`BrowserWindow`s](https://github.com/atom/electron/blob/master/docs/api/browser-window.md) within electron when the source files are changed.

**Disclaimer**: This is a fork from [electron reload](https://github.com/yan-foto/electron-reload).

# Installation

```
npm install electroloader
```

# Usage

Just initialize this module with desired glob or file path to watch and let it refresh electron browser windows as targets are changed:

```js
'use strict';

const {app, BrowserWindow} = require('electron');

require('electroloader')(__dirname);

// Standard stuff
app.on('ready', () {
  let mainWindow = new BrowserWindow({width: 800, height: 600});

  mainWindow.loadUrl(`file://${__dirname}/index.html`);
  // the rest...
});
```

Note that the above code only refreshes `WebContent`s of all `BrowserWindow`s. So if you want to have a hard reset (starting a new electron process) you can just pass the path to the electron executable in the `options` object. For example if you already have electron pre-built installed you could just do

```js
require("electroloader")(__dirname, {
  electron: require("electron-prebuilt"),
});
```

You could also use the (relatively) new [`electron`](https://www.npmjs.com/package/electron) package, _but_ you should specify the path directly (no `require`!):

```js
const path = require("path");

require("electroloader")(__dirname, {
  electron: path.join(__dirname, "node_modules", ".bin", "electron"),
});
```

If your app overrides some of the default `quit` or `close` actions (e.g. closing the last app window hides the window instead of quitting the app) then the default `electroloader` hard restart could leave you with multiple instances of your app running. In these cases you can change the default hard restart action from `app.quit()` to `app.exit()` by specifying the hard reset method in the electroloader options:

```js
const path = require("path");

require("electroloader")(__dirname, {
  electron: path.join(__dirname, "node_modules", ".bin", "electron"),
  hardResetMethod: "exit",
});
```

# API

`electron_reload(paths, options)`

- `paths`: a file, directory or glob pattern to watch
- `options` (optional) containing:

  - [`chokidar`](https://github.com/paulmillr/chokidar) options
  - `electron` property pointing to electron executables.
  - `argv` string array with command line options passed to the executed Electron app. Only used when hard resetting.
  - `forceHardReset`: enables hard reset for **every** file change and not only the main file

  `options` will default to `{ignored: /node_modules|[\/\\]\./, argv: []}`.

# Why this module?

Simply put, I was tired and confused by all other available modules which are so complicated\* for such an uncomplicated task!

\* _e.g. start a local HTTP server, publish change events through a WebSocket, etc.!_

# Changelog

- **1.0.0**: Initial release
