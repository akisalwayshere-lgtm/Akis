(function () {
  "use strict";

  const TG = window.TankGame;

  function InputSystem(options) {
    this.keys = Object.create(null);
    this.touchDirection = null;
    this.fireHeld = false;
    this.firePressed = false;
    this.movePressed = null;
    this.lastDirection = null;
    this.directionPulseUntil = 0;
    this.pausePressed = false;
    this.onInteraction = options && options.onInteraction;
    this.bindKeyboard();
    this.bindTouch();
  }

  InputSystem.prototype.bindKeyboard = function () {
    const self = this;
    const blocked = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"];
    window.addEventListener("keydown", function (event) {
      if (blocked.indexOf(event.code) >= 0) event.preventDefault();
      if (!self.keys[event.code]) {
        if (event.code === "Space" || event.code === "KeyJ") self.firePressed = true;
        if (event.code === "KeyP" || event.code === "Escape") self.pausePressed = true;
        if (event.code === "ArrowUp" || event.code === "KeyW") self.movePressed = "up";
        if (event.code === "ArrowRight" || event.code === "KeyD") self.movePressed = "right";
        if (event.code === "ArrowDown" || event.code === "KeyS") self.movePressed = "down";
        if (event.code === "ArrowLeft" || event.code === "KeyA") self.movePressed = "left";
        if (self.movePressed) {
          self.lastDirection = self.movePressed;
          self.directionPulseUntil = performance.now() + 220;
        }
      }
      self.keys[event.code] = true;
      if (self.onInteraction) self.onInteraction();
    }, { passive: false });

    window.addEventListener("keyup", function (event) {
      self.keys[event.code] = false;
    });

    window.addEventListener("blur", function () {
      self.keys = Object.create(null);
      self.touchDirection = null;
      self.fireHeld = false;
      self.directionPulseUntil = 0;
      self.clearTouchClasses();
    });
  };

  InputSystem.prototype.bindTouch = function () {
    const self = this;
    const directionButtons = document.querySelectorAll("[data-direction]");
    directionButtons.forEach(function (button) {
      function start(event) {
        event.preventDefault();
        self.touchDirection = button.dataset.direction;
        self.movePressed = button.dataset.direction;
        self.lastDirection = button.dataset.direction;
        self.directionPulseUntil = performance.now() + 220;
        button.classList.add("active");
        if (button.setPointerCapture && event.pointerId !== undefined) button.setPointerCapture(event.pointerId);
        if (self.onInteraction) self.onInteraction();
      }
      function end(event) {
        event.preventDefault();
        if (self.touchDirection === button.dataset.direction) self.touchDirection = null;
        button.classList.remove("active");
      }
      button.addEventListener("pointerdown", start);
      button.addEventListener("pointerup", end);
      button.addEventListener("pointercancel", end);
      button.addEventListener("contextmenu", function (event) { event.preventDefault(); });
    });

    const fireButton = document.getElementById("mobileFire");
    function fireStart(event) {
      event.preventDefault();
      self.fireHeld = true;
      self.firePressed = true;
      fireButton.classList.add("active");
      if (fireButton.setPointerCapture && event.pointerId !== undefined) fireButton.setPointerCapture(event.pointerId);
      if (self.onInteraction) self.onInteraction();
    }
    function fireEnd(event) {
      event.preventDefault();
      self.fireHeld = false;
      fireButton.classList.remove("active");
    }
    fireButton.addEventListener("pointerdown", fireStart);
    fireButton.addEventListener("pointerup", fireEnd);
    fireButton.addEventListener("pointercancel", fireEnd);
    fireButton.addEventListener("contextmenu", function (event) { event.preventDefault(); });
  };

  InputSystem.prototype.clearTouchClasses = function () {
    document.querySelectorAll("[data-direction], #mobileFire").forEach(function (button) {
      button.classList.remove("active");
    });
  };

  InputSystem.prototype.direction = function () {
    if (this.touchDirection) return this.touchDirection;
    if (this.keys.ArrowUp || this.keys.KeyW) return "up";
    if (this.keys.ArrowRight || this.keys.KeyD) return "right";
    if (this.keys.ArrowDown || this.keys.KeyS) return "down";
    if (this.keys.ArrowLeft || this.keys.KeyA) return "left";
    if (this.lastDirection && performance.now() < this.directionPulseUntil) return this.lastDirection;
    return null;
  };

  InputSystem.prototype.isFiring = function () {
    return this.fireHeld || this.keys.Space || this.keys.KeyJ;
  };

  InputSystem.prototype.consumeFire = function () {
    const value = this.firePressed;
    this.firePressed = false;
    return value;
  };

  InputSystem.prototype.consumeMove = function () {
    const value = this.movePressed;
    this.movePressed = null;
    return value;
  };

  InputSystem.prototype.consumePause = function () {
    const value = this.pausePressed;
    this.pausePressed = false;
    return value;
  };

  TG.InputSystem = InputSystem;
})();

