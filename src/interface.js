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

class Interface {
  constructor() {
    this._gameboy = null; // Core emulator
    this._frames = 0; // Number of elapsed frames
    this._pressed = new Array(8).fill(false); // Which keys are currently being held down
  }

  // Check to make sure the gameboy object has been created.
  _initialized() {
    return this._gameboy != null;
  }

  /**
   * Make sure that the emulator is "running" (note that this is different than play/pause)
   * Think of it like turning the key in your ignition before you start driving your car
   *
   * Returns true or false; true means running, false means stopped.
   */
  isRunning() {
    return (this._gameboy.stopEmulator & 2) === 0;
  }

  /**
   * Presses or releases a key
   * - note that in the gameboy core, a key will stay pressed until it has been explicitly released.
   * - will do nothing if the emulator is running
   *
   * @param keycode 0-7 number of the key to press (see Interface.KEYCODES)
   * @param `true` to press key, `false` to release
   */
  _sendKey(keyCode, down) {
    if (!KEYMAP_REVERSED[keyCode]) {
      throw new Error(`Invalid keyCode: ${keyCode}. Valid keyCodes are 0-7.`);
    }

    if (this._initialized() && this.isRunning()) {
      this._gameboy.JoyPadEvent(keyCode, down);
    }
  }

  /**
   * Load a ROM - like popping in a new cartridge
   * - Won't do anything if the emulator hasn't been initialized.
   */
  loadRom(romBuffer) {
    this.shutdownEmulation(); // Will shut down emulator if it's still running.

    this._gameboy = new GameBoyCore(romBuffer);

    // Start emulator (some logic in here that needs to be documented)
    this._gameboy.start();
    this._gameboy.stopEmulator &= 1;
    this._gameboy.iterations = 0;
  }

  pressKey(keyCode) {
    this._sendKey(keyCode, true);
  }

  releaseKey(keyCode) {
    this._sendKey(keyCode, false);
  }

  doFrame() {
    this._gameboy.frameDone = false;
    while (!this._gameboy.frameDone) {
      this._gameboy.run(); // Run internal logic until the entire frame is finished.
    }

    this._frames++;
  }

  getScreen() {
    return this._gameboy.currentScreen;
  }

  getMemory() {
    return this._gameboy.memory;
  }

  getAudio() {
    return this._gameboy.audioBuffer;
  }

  shutdownEmulation() {
    if (this._initialized() && this.isRunning()) {
      this._gameboy.stopEmulator |= 2;
      this._frames = 0;
    }
  }
}

Interface.KEYMAP = KEYMAP;
module.exports = Interface;
