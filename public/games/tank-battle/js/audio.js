(function () {
  "use strict";

  const TG = window.TankGame;

  function AudioSystem() {
    this.context = null;
    this.master = null;
    this.muted = false;
  }

  AudioSystem.prototype.ensure = function () {
    if (this.context) {
      if (this.context.state === "suspended") this.context.resume();
      return true;
    }
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return false;
    this.context = new AudioContext();
    this.master = this.context.createGain();
    this.master.gain.value = this.muted ? 0 : 0.18;
    this.master.connect(this.context.destination);
    return true;
  };

  AudioSystem.prototype.setMuted = function (muted) {
    this.muted = !!muted;
    if (this.master && this.context) {
      this.master.gain.setTargetAtTime(this.muted ? 0 : 0.18, this.context.currentTime, 0.015);
    }
  };

  AudioSystem.prototype.tone = function (frequency, duration, type, volume, slide) {
    if (this.muted || !this.ensure()) return;
    const now = this.context.currentTime;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    osc.type = type || "square";
    osc.frequency.setValueAtTime(frequency, now);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(30, slide), now + duration);
    gain.gain.setValueAtTime(volume || 0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  };

  AudioSystem.prototype.noise = function (duration, volume) {
    if (this.muted || !this.ensure()) return;
    const sampleCount = Math.floor(this.context.sampleRate * duration);
    const buffer = this.context.createBuffer(1, sampleCount, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < sampleCount; i += 1) data[i] = Math.random() * 2 - 1;
    const source = this.context.createBufferSource();
    const filter = this.context.createBiquadFilter();
    const gain = this.context.createGain();
    filter.type = "lowpass";
    filter.frequency.value = 600;
    gain.gain.setValueAtTime(volume || 0.12, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + duration);
    source.buffer = buffer;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    source.start();
  };

  AudioSystem.prototype.shoot = function (enemy) {
    this.tone(enemy ? 145 : 210, 0.09, "square", enemy ? 0.08 : 0.14, enemy ? 80 : 105);
  };
  AudioSystem.prototype.hit = function () { this.tone(110, 0.12, "sawtooth", 0.1, 48); };
  AudioSystem.prototype.explosion = function () {
    this.noise(0.3, 0.17);
    this.tone(72, 0.28, "sawtooth", 0.12, 34);
  };
  AudioSystem.prototype.level = function () {
    const self = this;
    [330, 440, 660].forEach(function (frequency, index) {
      window.setTimeout(function () { self.tone(frequency, 0.18, "triangle", 0.11); }, index * 100);
    });
  };
  AudioSystem.prototype.fail = function () {
    const self = this;
    [250, 180, 110].forEach(function (frequency, index) {
      window.setTimeout(function () { self.tone(frequency, 0.22, "sawtooth", 0.11); }, index * 130);
    });
  };

  TG.AudioSystem = AudioSystem;
})();

