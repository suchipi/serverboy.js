"use-strict";
var GameBoyCore = require("./gameboy_core/gameboy");

const KEYMAP = {
  RIGHT: 0,
  LEFT: 1,
  UP: 2,
  DOWN: 3,
  A: 4,
  B: 5,
  SELECT: 6,
  START: 7,
};

const KEYMAP_REVERSED = {
  0: "RIGHT",
  1: "LEFT",
  2: "UP",
  3: "DOWN",
  4: "A",
  5: "B",
  6: "SELECT",
  7: "START",
};

const PRIVATE = "_" + process.hrtime().join(".");
function Interface() {
  let _that = (this[PRIVATE] = {
    __proto__: Interface._prototype,
    gameboy: null, // Core emulator
    frames: 0, // Number of elapsed frames
    pressed: new Array(Object.keys(KEYMAP).length), // Which keys are currently being held down
  });
  _that[PRIVATE] = _that;
}

Interface._prototype = {
  // Check to make sure the gameboy object has been created.
  initialized: function () {
    let _that = this[PRIVATE];
    return typeof _that.gameboy === "object" && _that.gameboy != null;
  },

  /*
   * Make sure that the emulator is "running" (note that this is different than play/pause)
   * Think of it like turning the key in your ignition before you start driving your car
   *
   * Returns true or false; true means running, false means stopped.
   */
  running: function () {
    let _that = this[PRIVATE];
    return (_that.gameboy.stopEmulator & 2) == 0;
  },

  /*
   * Presses or releases a key
   * - note that in the gameboy core, a key will stay pressed until it has been explicitly released.
   * - will do nothing if the emulator is running
   *
   * @param keycode 1-8 number of the key to press (see Interface.KEYCODES)
   * @param `true` to press key, `false` to release
   */
  sendKey: function (keycode, down) {
    let _that = this[PRIVATE];
    if (_that.initialized() && _that.running()) {
      _that.gameboy.JoyPadEvent(keycode, down);
    }
  },
};

Interface.prototype = {
  constructor: Interface,

  /*
   * Load a ROM - like popping in a new cartridge
   * - Won't do anything if the emulator hasn't been initialized.
   *
   * TODO: better documentation on what ROMs are and how they should be formatted.
   */
  loadRom: function (ROM) {
    let _that = this[PRIVATE];

    this.shutdownEmulation(); // Will shut down emulator if it's still running.

    _that.gameboy = new GameBoyCore(ROM);

    //Start emulator (some logic in here that needs to be documented)
    _that.gameboy.start();
    _that.gameboy.stopEmulator &= 1;
    _that.gameboy.iterations = 0;

    return true;
  },

  /*
   * Emulates a single frame
   */
  doFrame: function () {
    let _that = this[PRIVATE];
    // Press required keys
    for (let i = _that.pressed.length - 1; i >= 0; i--) {
      if (_that.pressed[i]) {
        _that.sendKey(i, true);
      }
    }

    _that.gameboy.frameDone = false;
    while (!_that.gameboy.frameDone) {
      _that.gameboy.run(); // Run internal logic until the entire frame as finished.
    }

    // Release all keys
    for (let i = _that.pressed.length - 1; i >= 0; i--) {
      _that.pressed[i] = false;
      _that.sendKey(i, false);
    }

    ++_that.frames;
  },

  /*
   * Pass in an array of keys you want pressed
   * - this array should be propogated with values from ``Interface.KEYMAP``
   * - you can not undo a press. Once a key is pressed it stays pressed until the end of the frame.
   */
  pressKeys: function (keys) {
    keys = keys || [];

    let that = this;
    for (let i = keys.length - 1; i >= 0; i--) {
      that.pressKey(keys[i]);
    }
  },

  /*
   * Presses a key corresponding with ``Interface.KEYMAP``
   * - you can not undo a press. Once a key is pressed it stays pressed until the end of the frame.
   */
  pressKey: function (key) {
    let _that = this[PRIVATE];

    if (!KEYMAP_REVERSED[key]) {
      throw new Error(`Invalid key passed to 'pressKey': ${key}`);
    }
    if (key < _that.pressed.length && key != null) {
      _that.pressed[key] = true;
    }
  },

  /*
   * Returns an array of all currently pressed keys
   * - built using the enum ``Interface.KEYMAP``
   */
  getKeys: function () {
    let _that = this[PRIVATE];
    return _that.pressed.slice(0);
  },

  getScreen: function () {
    var _that = this[PRIVATE];
    return _that.gameboy.currentScreen;
  },

  /*
   * Gets a block of memory, you can specify a start and an end if you want
   * - this is an expensive operation and should be called sparingly
   */
  getMemory: function () {
    let _that = this[PRIVATE];
    return _that.gameboy.memory;
  },

  getAudio: function () {
    let _that = this[PRIVATE];
    return _that.gameboy.audioBuffer;
  },

  // Stop emulator, reset relevant variables
  shutdownEmulation: function () {
    let _that = this[PRIVATE];
    if (_that.initialized() && _that.running()) {
      _that.gameboy.stopEmulator |= 2;
      _that.frames = 0; // Reset internal variables
    }
  },
};

Interface.KEYMAP = KEYMAP;
module.exports = Interface;
