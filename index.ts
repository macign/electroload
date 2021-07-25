import { app, BrowserWindow } from "electron";
import chokidar from "chokidar";
import fs from "fs";
import { spawn } from "child_process";

const ignoredPaths = /node_modules|[/\\]\./;

/**
 * Creates a callback for hard resets.
 *
 * @param eXecutable path to electron executable
 * @param entryFile path to the .js entry file to launch
 * @param hardResetMethod method to restart electron
 * @param appArgv arguments to restart the app with
 * @param electronArgv arguments to restart electron with
 * @returns handler to pass to chokidar
 */
const createHardresetHandler = (eXecutable: string, entryFile: string[], hardResetMethod: string, appArgv: string[], electronArgv: string[]) => () => {
  // Detaching child is useful when in Windows to let child
  // live after the parent is killed
  const args = (electronArgv || []).concat(entryFile).concat(appArgv || []);
  const child = spawn(eXecutable, args, {
    detached: true,
    stdio: "inherit",
  });

  child.unref();

  // In cases where an app overrides the default closing or quiting actions
  // firing an `app.quit()` may not actually quit the app. In these cases
  // you can use `app.exit()` to gracefully close the app.
  if (hardResetMethod === "exit") {
    app.exit();
  } else {
    app.quit();
  }
};

export = (
  glob: string | string[],
  options = { argv: [], appArgv: [], electronArgv: [], electron: "", mainFile: [module?.parent?.filename ?? ""], hardResetMethod: "", forceHardReset: false }
) => {
  // Main file poses a special case, as its changes are
  // only effective when the process is restarted (hard reset)
  // We assume that electron-reload is required by the main
  // file of the electron application if a path is not provided
  const mainFile = options.mainFile;
  const browserWindows: BrowserWindow[] = [];
  const watcher = chokidar.watch(glob, Object.assign({ ignored: [ignoredPaths, mainFile] }, options));

  // Callback function to be executed:
  // I) soft reset: reload browser windows
  const softResetHandler = () => browserWindows.forEach((bw) => bw.webContents.reloadIgnoringCache());
  // II) hard reset: restart the whole electron process
  const eXecutable = options.electron;
  const hardResetHandler = createHardresetHandler(eXecutable, mainFile, options.hardResetMethod, options.appArgv, options.electronArgv);

  // Add each created BrowserWindow to list of maintained items
  app.on("browser-window-created", (_e, bw) => {
    browserWindows.push(bw);

    // Remove closed windows from list of maintained items
    bw.on("closed", function () {
      const i = browserWindows.indexOf(bw); // Must use current index
      browserWindows.splice(i, 1);
    });
  });

  // Enable default soft reset
  watcher.on("change", softResetHandler);

  // Preparing hard reset if electron executable is given in options
  // A hard reset is only done when the main file has changed
  if (typeof eXecutable === "string" && fs.existsSync(eXecutable)) {
    const hardWatcher = chokidar.watch(mainFile, Object.assign({ ignored: [ignoredPaths] }, options));

    if (options.forceHardReset === true) {
      // Watch every file for hard reset and not only the main file
      hardWatcher.add(glob);
      // Stop our default soft reset
      watcher.close();
    }

    hardWatcher.once("change", hardResetHandler);
  } else {
    console.log("Electron could not be found. No hard resets for you!");
  }
};
