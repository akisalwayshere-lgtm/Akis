(function () {
  "use strict";

  const TG = window.TankGame;
  const C = TG.CONFIG;
  let nextId = 1;

  function Tank(options) {
    const opts = options || {};
    this.id = nextId++;
    this.x = opts.x || 0;
    this.y = opts.y || 0;
    this.size = opts.size || C.TANK_SIZE;
    this.dir = opts.dir === undefined ? 0 : opts.dir;
    this.team = opts.team || "enemy";
    this.type = opts.type || "scout";
    this.color = opts.color || C.COLORS.player;
    this.accent = opts.accent || C.COLORS.playerAccent;
    this.speed = opts.speed || C.PLAYER_SPEED;
    this.maxHp = opts.hp || 1;
    this.hp = this.maxHp;
    this.reload = opts.reload || C.PLAYER_RELOAD;
    this.cooldown = 0;
    this.alive = true;
    this.invulnerable = opts.invulnerable || 0;
    this.flash = 0;
    this.spawnPulse = 1;
    this.ai = null;
  }

  Tank.prototype.center = function () {
    return { x: this.x + this.size / 2, y: this.y + this.size / 2 };
  };

  Tank.prototype.rect = function (padding) {
    const p = padding || 0;
    return { x: this.x + p, y: this.y + p, w: this.size - p * 2, h: this.size - p * 2 };
  };

  Tank.prototype.updateTimers = function (dt) {
    this.cooldown = Math.max(0, this.cooldown - dt);
    this.invulnerable = Math.max(0, this.invulnerable - dt);
    this.flash = Math.max(0, this.flash - dt);
    this.spawnPulse = Math.max(0, this.spawnPulse - dt * 1.6);
  };

  function Bullet(options) {
    const opts = options || {};
    this.id = nextId++;
    this.x = opts.x;
    this.y = opts.y;
    this.dir = opts.dir;
    this.team = opts.team;
    this.ownerId = opts.ownerId;
    this.speed = opts.speed || C.BULLET_SPEED;
    this.damage = opts.damage || 1;
    this.radius = opts.radius || 4;
    this.alive = true;
    this.trail = [];
  }

  Bullet.prototype.update = function (dt) {
    this.trail.unshift({ x: this.x, y: this.y });
    if (this.trail.length > 5) this.trail.pop();
    const vectors = [{ x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }];
    const vector = vectors[this.dir];
    this.x += vector.x * this.speed * dt;
    this.y += vector.y * this.speed * dt;
  };

  Bullet.prototype.rect = function () {
    return { x: this.x - this.radius, y: this.y - this.radius, w: this.radius * 2, h: this.radius * 2 };
  };

  function Particle(options) {
    const opts = options || {};
    this.x = opts.x;
    this.y = opts.y;
    this.vx = opts.vx || 0;
    this.vy = opts.vy || 0;
    this.life = opts.life || 0.5;
    this.maxLife = this.life;
    this.size = opts.size || 3;
    this.color = opts.color || "#fff";
    this.drag = opts.drag || 0.95;
  }

  Particle.prototype.update = function (dt) {
    this.life -= dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vx *= Math.pow(this.drag, dt * 60);
    this.vy *= Math.pow(this.drag, dt * 60);
  };

  function rectsOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function pointInRect(point, rect) {
    return point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h;
  }

  TG.Entities = { Tank, Bullet, Particle, rectsOverlap, pointInRect };
})();

