(function () {
  "use strict";

  const TG = window.TankGame;
  const C = TG.CONFIG;
  const E = TG.Entities;
  const DIR_NAMES = ["up", "right", "down", "left"];
  const DIR_INDEX = { up: 0, right: 1, down: 2, left: 3 };

  function safeGet(key, fallback) {
    try {
      const value = window.localStorage.getItem(key);
      return value === null ? fallback : value;
    } catch (error) {
      return fallback;
    }
  }

  function safeSet(key, value) {
    try { window.localStorage.setItem(key, String(value)); } catch (error) { /* Storage may be disabled. */ }
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function formatTime(seconds) {
    const total = Math.max(0, Math.floor(seconds));
    const minutes = Math.floor(total / 60);
    const secs = total % 60;
    return String(minutes).padStart(2, "0") + ":" + String(secs).padStart(2, "0");
  }

  function Game() {
    this.canvas = document.getElementById("gameCanvas");
    this.ctx = this.canvas.getContext("2d");
    this.ctx.imageSmoothingEnabled = true;
    this.audio = new TG.AudioSystem();
    this.state = "menu";
    this.levelIndex = 0;
    this.difficultyName = safeGet(C.STORAGE_KEYS.difficulty, "normal");
    if (!C.DIFFICULTIES[this.difficultyName]) this.difficultyName = "normal";
    this.difficulty = C.DIFFICULTIES[this.difficultyName];
    this.muted = safeGet(C.STORAGE_KEYS.muted, "false") === "true";
    this.audio.setMuted(this.muted);
    this.input = new TG.InputSystem({ onInteraction: this.audio.ensure.bind(this.audio) });
    this.player = null;
    this.base = null;
    this.enemies = [];
    this.bullets = [];
    this.particles = [];
    this.obstacles = [];
    this.spawnQueue = [];
    this.spawnTimer = 0;
    this.spawned = 0;
    this.levelKills = 0;
    this.lives = C.STARTING_LIVES;
    this.score = 0;
    this.shots = 0;
    this.hits = 0;
    this.totalTime = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.shake = 0;
    this.lastFrame = performance.now();
    this.runToken = 0;
    this.toastTimer = 0;
    this.transitionUnlockAt = 0;
    this.tauntTimer = 1.1;
    this.lastTauntText = "";
    this.helpReturnState = "menu";
    this.cacheElements();
    this.bindUI();
    this.updateMuteButton();
    this.difficultySelect.value = this.difficultyName;
    this.draw(performance.now() / 1000);
    requestAnimationFrame(this.loop.bind(this));
  }

  Game.prototype.cacheElements = function () {
    this.menuScreen = document.getElementById("menuScreen");
    this.pauseScreen = document.getElementById("pauseScreen");
    this.transitionScreen = document.getElementById("transitionScreen");
    this.resultScreen = document.getElementById("resultScreen");
    this.helpScreen = document.getElementById("helpScreen");
    this.levelValue = document.getElementById("levelValue");
    this.livesValue = document.getElementById("livesValue");
    this.enemyValue = document.getElementById("enemyValue");
    this.scoreValue = document.getElementById("scoreValue");
    this.cooldownMeter = document.getElementById("cooldownMeter");
    this.comboBadge = document.getElementById("comboBadge");
    this.toast = document.getElementById("toast");
    this.battleActions = document.querySelector(".battle-actions");
    this.muteButton = document.getElementById("muteButton");
    this.pauseButton = document.getElementById("pauseButton");
    this.difficultySelect = document.getElementById("difficultySelect");
  };

  Game.prototype.bindUI = function () {
    const self = this;
    document.getElementById("startButton").addEventListener("click", function () { self.startGame(); });
    document.getElementById("restartButton").addEventListener("click", function () { self.startGame(); });
    document.getElementById("pauseRestartButton").addEventListener("click", function () { self.startGame(); });
    document.getElementById("resumeButton").addEventListener("click", function () { self.resume(); });
    document.getElementById("backToMenuButton").addEventListener("click", function () { self.showMenu(); });
    document.getElementById("homeButton").addEventListener("click", function () { self.showMenu(); });
    document.getElementById("battlePauseButton").addEventListener("click", function () { self.pause(); });
    document.getElementById("battleExitButton").addEventListener("click", function () { self.showMenu(); });
    document.getElementById("pauseExitButton").addEventListener("click", function () { self.showMenu(); });
    this.pauseButton.addEventListener("click", function () { self.togglePause(); });
    this.muteButton.addEventListener("click", function () { self.toggleMute(); });
    document.getElementById("helpButton").addEventListener("click", function () { self.openHelp(); });
    document.getElementById("menuHelpButton").addEventListener("click", function () { self.openHelp(); });
    document.getElementById("closeHelpButton").addEventListener("click", function () { self.closeHelp(); });
    this.difficultySelect.addEventListener("change", function () {
      self.difficultyName = self.difficultySelect.value;
      self.difficulty = C.DIFFICULTIES[self.difficultyName];
      safeSet(C.STORAGE_KEYS.difficulty, self.difficultyName);
    });
    document.addEventListener("visibilitychange", function () {
      if (document.hidden && self.state === "playing") self.pause();
    });
  };

  Game.prototype.hideScreens = function () {
    [this.menuScreen, this.pauseScreen, this.transitionScreen, this.resultScreen, this.helpScreen].forEach(function (screen) {
      screen.classList.remove("visible");
    });
  };

  Game.prototype.startGame = function () {
    this.audio.ensure();
    this.runToken += 1;
    this.difficultyName = this.difficultySelect.value;
    this.difficulty = C.DIFFICULTIES[this.difficultyName];
    safeSet(C.STORAGE_KEYS.difficulty, this.difficultyName);
    this.levelIndex = 0;
    this.lives = C.STARTING_LIVES;
    this.score = 0;
    this.shots = 0;
    this.hits = 0;
    this.totalTime = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.setupLevel();
  };

  Game.prototype.setupLevel = function () {
    const level = C.LEVELS[this.levelIndex];
    const token = this.runToken;
    this.state = "transition";
    this.obstacles = TG.Maps.createMap(this.levelIndex);
    this.enemies = [];
    this.bullets = [];
    this.particles = [];
    this.spawnQueue = level.roster.slice();
    this.spawned = 0;
    this.levelKills = 0;
    this.spawnTimer = 0.65;
    this.tauntTimer = 1.1;
    this.transitionUnlockAt = performance.now() + 250;
    this.base = {
      x: C.WIDTH / 2 - 18,
      y: C.HEIGHT - 47,
      w: 36,
      h: 36,
      alive: true,
      flash: 0,
      rect: function () { return { x: this.x, y: this.y, w: this.w, h: this.h }; }
    };
    this.player = this.createPlayer();
    this.hideScreens();
    document.getElementById("transitionIndex").textContent = "MISSION " + String(this.levelIndex + 1).padStart(2, "0");
    document.getElementById("transitionTitle").textContent = level.title;
    document.getElementById("transitionText").textContent = level.description;
    const loadingLine = this.transitionScreen.querySelector(".loading-line i");
    loadingLine.style.animation = "none";
    void loadingLine.offsetWidth;
    loadingLine.style.animation = "";
    this.transitionScreen.classList.add("visible");
    this.battleActions.classList.remove("visible");
    this.updateHUD();
    window.setTimeout(function () {
      if (this.runToken === token) this.beginLevel();
    }.bind(this), 1200);
  };

  Game.prototype.beginLevel = function () {
    if (this.state !== "transition") return;
    const level = C.LEVELS[this.levelIndex];
    this.transitionScreen.classList.remove("visible");
    this.state = "playing";
    this.shake = 0;
    this.battleActions.classList.add("visible");
    this.audio.level();
    this.showToast("守住基地 · 消灭 " + level.totalEnemies + " 辆敌军");
  };

  Game.prototype.createPlayer = function () {
    return new E.Tank({
      x: C.WIDTH / 2 - 105,
      y: C.HEIGHT - 55,
      team: "player",
      type: "player",
      dir: 0,
      color: C.COLORS.player,
      accent: C.COLORS.playerAccent,
      speed: C.PLAYER_SPEED,
      reload: C.PLAYER_RELOAD * this.difficulty.playerReload,
      hp: 1,
      invulnerable: 1.7
    });
  };

  Game.prototype.showMenu = function () {
    this.runToken += 1;
    this.state = "menu";
    this.shake = 0;
    this.hideScreens();
    this.menuScreen.classList.add("visible");
    this.battleActions.classList.remove("visible");
    this.pauseButton.classList.remove("active");
  };

  Game.prototype.pause = function () {
    if (this.state !== "playing") return;
    this.state = "paused";
    this.shake = 0;
    this.pauseScreen.classList.add("visible");
    this.battleActions.classList.remove("visible");
    this.pauseButton.classList.add("active");
  };

  Game.prototype.resume = function () {
    if (this.state !== "paused") return;
    this.state = "playing";
    this.pauseScreen.classList.remove("visible");
    this.battleActions.classList.add("visible");
    this.pauseButton.classList.remove("active");
    this.lastFrame = performance.now();
  };

  Game.prototype.togglePause = function () {
    if (this.state === "playing") this.pause();
    else if (this.state === "paused") this.resume();
  };

  Game.prototype.openHelp = function () {
    if (this.state === "help") return;
    this.helpReturnState = this.state === "playing" ? "paused" : this.state;
    if (this.state === "playing") this.pauseButton.classList.add("active");
    this.state = "help";
    this.battleActions.classList.remove("visible");
    this.hideScreens();
    this.helpScreen.classList.add("visible");
  };

  Game.prototype.closeHelp = function () {
    this.helpScreen.classList.remove("visible");
    if (this.helpReturnState === "menu") {
      this.state = "menu";
      this.menuScreen.classList.add("visible");
    } else if (this.helpReturnState === "paused") {
      this.state = "paused";
      this.pauseScreen.classList.add("visible");
    } else if (this.helpReturnState === "victory" || this.helpReturnState === "gameover") {
      this.state = this.helpReturnState;
      this.resultScreen.classList.add("visible");
    } else {
      this.state = this.helpReturnState;
    }
  };

  Game.prototype.toggleMute = function () {
    this.muted = !this.muted;
    this.audio.setMuted(this.muted);
    safeSet(C.STORAGE_KEYS.muted, this.muted);
    this.updateMuteButton();
  };

  Game.prototype.updateMuteButton = function () {
    this.muteButton.textContent = this.muted ? "×" : "♫";
    this.muteButton.classList.toggle("active", this.muted);
    this.muteButton.setAttribute("aria-label", this.muted ? "打开声音" : "关闭声音");
  };

  Game.prototype.loop = function (timestamp) {
    const dt = Math.min(0.034, Math.max(0, (timestamp - this.lastFrame) / 1000));
    this.lastFrame = timestamp;
    if (this.input.consumePause()) this.togglePause();
    if (this.state === "transition" && timestamp >= this.transitionUnlockAt) {
      const openingDirection = this.input.consumeMove();
      if (openingDirection || this.input.isFiring()) {
        this.beginLevel();
        if (openingDirection && this.player) {
          this.player.dir = DIR_INDEX[openingDirection];
          const openingVector = TG.AI.VECTORS[this.player.dir];
          this.tryMoveTank(this.player, openingVector.x * 12, openingVector.y * 12);
        }
      }
    }
    if (this.state === "playing") this.update(dt);
    else {
      this.shake = 0;
      this.updateParticles(dt * 0.35);
    }
    this.draw(timestamp / 1000);
    requestAnimationFrame(this.loop.bind(this));
  };

  Game.prototype.update = function (dt) {
    this.totalTime += dt;
    this.shake = Math.max(0, this.shake - dt * 18);
    this.toastTimer = Math.max(0, this.toastTimer - dt);
    if (this.toastTimer <= 0) this.toast.classList.remove("visible");
    this.comboTimer = Math.max(0, this.comboTimer - dt);
    if (this.comboTimer <= 0) {
      this.combo = 0;
      this.comboBadge.classList.remove("visible");
    }
    if (this.base) this.base.flash = Math.max(0, this.base.flash - dt);

    if (this.player) {
      this.player.updateTimers(dt);
      if (this.player.alive) this.updatePlayer(dt);
    }

    this.spawnEnemies(dt);
    for (let i = 0; i < this.enemies.length; i += 1) {
      const enemy = this.enemies[i];
      enemy.updateTimers(dt);
      if (enemy.alive) TG.AI.updateEnemy(enemy, this, dt);
    }
    this.updateTaunts(dt);

    this.updateBullets(dt);
    this.updateParticles(dt);
    this.enemies = this.enemies.filter(function (enemy) { return enemy.alive; });
    this.bullets = this.bullets.filter(function (bullet) { return bullet.alive; });
    this.particles = this.particles.filter(function (particle) { return particle.life > 0; });

    const level = C.LEVELS[this.levelIndex];
    if (this.spawned >= level.totalEnemies && this.enemies.length === 0 && this.state === "playing") {
      this.completeLevel();
    }
    this.updateHUD();
  };

  Game.prototype.updatePlayer = function (dt) {
    const directionName = this.input.direction();
    this.input.consumeMove();
    if (directionName) {
      this.player.dir = DIR_INDEX[directionName];
      const vector = TG.AI.VECTORS[this.player.dir];
      this.tryMoveTank(this.player, vector.x * this.player.speed * dt, vector.y * this.player.speed * dt);
    }
    if (this.input.isFiring() && this.player.cooldown <= 0) this.fireTank(this.player);
  };

  Game.prototype.spawnEnemies = function (dt) {
    const maxActive = C.MAX_ACTIVE_ENEMIES[this.levelIndex];
    if (!this.spawnQueue.length || this.enemies.length >= maxActive) return;
    this.spawnTimer -= dt;
    if (this.spawnTimer > 0) return;
    const type = this.spawnQueue[0];
    if (this.spawnEnemy(type)) {
      this.spawnQueue.shift();
      this.spawned += 1;
      this.spawnTimer = C.LEVELS[this.levelIndex].spawnDelay;
    } else {
      this.spawnTimer = 0.35;
    }
  };

  Game.prototype.updateTaunts = function (dt) {
    this.enemies.forEach(function (enemy) {
      if (!enemy.tauntLife) return;
      enemy.tauntLife = Math.max(0, enemy.tauntLife - dt);
      if (enemy.tauntLife === 0) enemy.tauntText = "";
    });

    this.tauntTimer -= dt;
    if (this.tauntTimer > 0 || !this.player || !this.player.alive || this.enemies.length === 0) return;

    const playerCenter = this.player.center();
    let nearest = null;
    let nearestDistance = Infinity;
    this.enemies.forEach(function (enemy) {
      if (!enemy.alive) return;
      const center = enemy.center();
      const distance = Math.hypot(center.x - playerCenter.x, center.y - playerCenter.y);
      if (distance < nearestDistance) {
        nearest = enemy;
        nearestDistance = distance;
      }
    });
    if (!nearest) return;

    const choices = C.TAUNTS.filter(function (text) { return text !== this.lastTauntText; }, this);
    const text = choices[Math.floor(Math.random() * choices.length)];
    nearest.tauntText = text;
    nearest.tauntLife = 1.9;
    nearest.tauntMaxLife = 1.9;
    this.lastTauntText = text;
    this.tauntTimer = 3.2 + Math.random() * 2.8;
    this.audio.tone(360 + Math.random() * 110, 0.07, "square", 0.035, 520);
  };

  Game.prototype.spawnEnemy = function (typeName) {
    const stats = C.ENEMY_TYPES[typeName];
    const positions = [70, C.WIDTH / 2 - C.TANK_SIZE / 2, C.WIDTH - 100];
    const offset = Math.floor(Math.random() * positions.length);
    for (let i = 0; i < positions.length; i += 1) {
      const x = positions[(i + offset) % positions.length];
      const candidate = { x, y: 48, w: C.TANK_SIZE, h: C.TANK_SIZE };
      const occupied = this.enemies.some(function (enemy) { return E.rectsOverlap(candidate, enemy.rect()); });
      const blocked = this.obstacles.some(function (item) { return item.alive && E.rectsOverlap(candidate, item); });
      if (!occupied && !blocked) {
        const enemy = new E.Tank({
          x,
          y: 48,
          team: "enemy",
          type: typeName,
          dir: 2,
          color: stats.color,
          accent: stats.accent,
          speed: stats.speed * this.difficulty.enemySpeed,
          reload: stats.reload * this.difficulty.enemyReload,
          hp: stats.hp,
          invulnerable: 0.65
        });
        this.enemies.push(enemy);
        this.makeParticles(x + C.TANK_SIZE / 2, 48 + C.TANK_SIZE / 2, stats.color, 10, 70);
        return true;
      }
    }
    return false;
  };

  Game.prototype.tryMoveTank = function (tank, dx, dy) {
    if (!tank.alive) return false;
    const next = {
      x: clamp(tank.x + dx, 5, C.WIDTH - tank.size - 5),
      y: clamp(tank.y + dy, 5, C.HEIGHT - tank.size - 5),
      w: tank.size,
      h: tank.size
    };
    const padded = { x: next.x + 2, y: next.y + 2, w: next.w - 4, h: next.h - 4 };
    const obstacleHit = this.obstacles.some(function (item) {
      return item.alive && E.rectsOverlap(padded, item);
    });
    if (obstacleHit || (this.base && this.base.alive && E.rectsOverlap(padded, this.base.rect()))) return false;
    const tanks = [this.player].concat(this.enemies);
    const tankHit = tanks.some(function (other) {
      return other && other !== tank && other.alive && E.rectsOverlap(padded, other.rect(2));
    });
    if (tankHit) return false;
    tank.x = next.x;
    tank.y = next.y;
    return true;
  };

  Game.prototype.fireTank = function (tank) {
    if (!tank.alive || tank.cooldown > 0 || tank.invulnerable > 0.75) return false;
    const center = tank.center();
    const vector = TG.AI.VECTORS[tank.dir];
    const muzzle = tank.size / 2 + 7;
    this.bullets.push(new E.Bullet({
      x: center.x + vector.x * muzzle,
      y: center.y + vector.y * muzzle,
      dir: tank.dir,
      team: tank.team,
      ownerId: tank.id,
      speed: tank.team === "player" ? C.BULLET_SPEED : C.BULLET_SPEED * 0.82,
      radius: tank.type === "elite" ? 5 : 4
    }));
    tank.cooldown = tank.reload;
    if (tank.team === "player") this.shots += 1;
    this.audio.shoot(tank.team === "enemy");
    this.makeParticles(center.x + vector.x * muzzle, center.y + vector.y * muzzle, tank.accent, 4, 65);
    return true;
  };

  Game.prototype.updateBullets = function (dt) {
    let i;
    let j;
    for (i = 0; i < this.bullets.length; i += 1) {
      const bullet = this.bullets[i];
      if (!bullet.alive) continue;
      bullet.update(dt);
      if (bullet.x < -10 || bullet.x > C.WIDTH + 10 || bullet.y < -10 || bullet.y > C.HEIGHT + 10) {
        bullet.alive = false;
        continue;
      }
      for (j = i + 1; j < this.bullets.length; j += 1) {
        const other = this.bullets[j];
        if (other.alive && other.team !== bullet.team && E.rectsOverlap(bullet.rect(), other.rect())) {
          bullet.alive = false;
          other.alive = false;
          this.makeParticles((bullet.x + other.x) / 2, (bullet.y + other.y) / 2, "#ffffff", 6, 55);
          break;
        }
      }
      if (!bullet.alive) continue;
      this.collideBulletWithWorld(bullet);
    }
  };

  Game.prototype.collideBulletWithWorld = function (bullet) {
    const bulletRect = bullet.rect();
    for (let i = 0; i < this.obstacles.length; i += 1) {
      const item = this.obstacles[i];
      if (!item.alive || item.type === "water" || !E.rectsOverlap(bulletRect, item)) continue;
      bullet.alive = false;
      if (item.type === "brick") {
        item.alive = false;
        this.makeParticles(bullet.x, bullet.y, C.COLORS.brick, 7, 90);
        this.audio.hit();
      } else {
        this.makeParticles(bullet.x, bullet.y, "#d9f6f8", 5, 65);
        this.audio.tone(520, 0.05, "square", 0.05, 280);
      }
      return;
    }

    if (this.base && this.base.alive && bullet.team === "enemy" && E.rectsOverlap(bulletRect, this.base.rect())) {
      bullet.alive = false;
      this.base.alive = false;
      this.base.flash = 1;
      this.shake = 15;
      this.makeParticles(this.base.x + this.base.w / 2, this.base.y + this.base.h / 2, C.COLORS.base, 34, 190);
      this.audio.explosion();
      this.finishGame(false, "核心基地已被摧毁");
      return;
    }

    if (bullet.team === "player") {
      for (let i = 0; i < this.enemies.length; i += 1) {
        const enemy = this.enemies[i];
        if (enemy.alive && enemy.invulnerable <= 0 && E.rectsOverlap(bulletRect, enemy.rect(2))) {
          bullet.alive = false;
          this.hits += 1;
          this.damageEnemy(enemy);
          return;
        }
      }
    } else if (this.player && this.player.alive && this.player.invulnerable <= 0 && E.rectsOverlap(bulletRect, this.player.rect(2))) {
      bullet.alive = false;
      this.damagePlayer();
    }
  };

  Game.prototype.damageEnemy = function (enemy) {
    enemy.hp -= 1;
    enemy.flash = 0.13;
    this.makeParticles(enemy.x + enemy.size / 2, enemy.y + enemy.size / 2, enemy.accent, 10, 110);
    this.audio.hit();
    if (enemy.hp > 0) {
      this.showToast("重甲受损 · 剩余 " + enemy.hp + " 层装甲");
      return;
    }
    enemy.alive = false;
    this.levelKills += 1;
    this.shake = enemy.type === "elite" ? 13 : 6;
    this.makeParticles(enemy.x + enemy.size / 2, enemy.y + enemy.size / 2, enemy.color, enemy.type === "elite" ? 35 : 22, 190);
    this.audio.explosion();
    this.registerKill(enemy);
  };

  Game.prototype.registerKill = function (enemy) {
    this.combo = this.comboTimer > 0 ? this.combo + 1 : 1;
    this.comboTimer = 2.6;
    const baseScore = C.ENEMY_TYPES[enemy.type].score;
    const awarded = Math.round(baseScore * this.combo * this.difficulty.score);
    this.score += awarded;
    if (this.combo >= 2) {
      this.comboBadge.textContent = "COMBO ×" + this.combo + "  +" + awarded;
      this.comboBadge.classList.add("visible");
    }
  };

  Game.prototype.damagePlayer = function () {
    if (!this.player || !this.player.alive || this.player.invulnerable > 0) return;
    this.player.alive = false;
    this.lives -= 1;
    this.shake = 0;
    this.makeParticles(this.player.x + this.player.size / 2, this.player.y + this.player.size / 2, C.COLORS.player, 28, 185);
    this.audio.explosion();
    this.updateHUD();
    if (this.lives <= 0) {
      this.finishGame(false, "作战坦克全部损失");
      return;
    }
    const token = this.runToken;
    this.showToast("坦克受损 · 即将重新部署");
    window.setTimeout(function () {
      if (this.runToken !== token || this.state !== "playing") return;
      const fresh = this.createPlayer();
      this.player.x = fresh.x;
      this.player.y = fresh.y;
      this.player.dir = fresh.dir;
      this.player.cooldown = 0;
      this.player.invulnerable = 2;
      this.player.alive = true;
      this.player.spawnPulse = 1;
      this.showToast("防护力场已启动");
    }.bind(this), 1050);
  };

  Game.prototype.completeLevel = function () {
    this.state = "transition";
    this.combo = 0;
    this.comboBadge.classList.remove("visible");
    if (this.levelIndex >= C.LEVELS.length - 1) {
      this.score += this.lives * 500;
      this.finishGame(true);
      return;
    }
    this.score += 750 + this.levelIndex * 250;
    this.lives = Math.min(C.STARTING_LIVES, this.lives + 1);
    this.levelIndex += 1;
    const token = this.runToken;
    this.showToast("区域肃清 · 生命补给 +1");
    this.audio.level();
    window.setTimeout(function () {
      if (this.runToken === token && this.state === "transition") this.setupLevel();
    }.bind(this), 1200);
  };

  Game.prototype.finishGame = function (won, message) {
    if (this.state !== "playing" && this.state !== "transition") return;
    if (this.state === "victory" || this.state === "gameover") return;
    this.state = won ? "victory" : "gameover";
    this.shake = 0;
    this.battleActions.classList.remove("visible");
    const oldBest = Number(safeGet(C.STORAGE_KEYS.bestScore, "0")) || 0;
    const newBest = Math.max(oldBest, this.score);
    safeSet(C.STORAGE_KEYS.bestScore, newBest);
    const oldTime = Number(safeGet(C.STORAGE_KEYS.bestTime, "0")) || 0;
    if (won && (oldTime === 0 || this.totalTime < oldTime)) safeSet(C.STORAGE_KEYS.bestTime, this.totalTime.toFixed(2));
    document.getElementById("resultKicker").textContent = won ? "MISSION COMPLETE" : "MISSION FAILED";
    document.getElementById("resultTitle").textContent = won ? "守卫成功" : "行动失败";
    document.getElementById("resultMessage").textContent = won ? "三道防线全部突破，浪尖阿走基地安然无恙。" : (message || "基地防线失守，请重新部署。");
    document.getElementById("resultScore").textContent = String(this.score);
    document.getElementById("resultTime").textContent = formatTime(this.totalTime);
    document.getElementById("resultAccuracy").textContent = (this.shots ? Math.round(this.hits / this.shots * 100) : 0) + "%";
    document.getElementById("resultBest").textContent = String(newBest);
    this.hideScreens();
    this.resultScreen.classList.add("visible");
    if (won) this.audio.level();
    else this.audio.fail();
  };

  Game.prototype.makeParticles = function (x, y, color, count, force) {
    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = force * (0.25 + Math.random() * 0.75);
      this.particles.push(new E.Particle({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.25 + Math.random() * 0.55,
        size: 1.5 + Math.random() * 4,
        color,
        drag: 0.94
      }));
    }
  };

  Game.prototype.updateParticles = function (dt) {
    this.particles.forEach(function (particle) { particle.update(dt); });
    this.particles = this.particles.filter(function (particle) { return particle.life > 0; });
  };

  Game.prototype.showToast = function (message) {
    this.toast.textContent = message;
    this.toast.classList.add("visible");
    this.toastTimer = 2.2;
  };

  Game.prototype.updateHUD = function () {
    const level = C.LEVELS[this.levelIndex] || C.LEVELS[0];
    this.levelValue.textContent = String(this.levelIndex + 1).padStart(2, "0") + " / 03";
    this.livesValue.textContent = this.lives > 0 ? Array(this.lives).fill("●").join(" ") : "—";
    const remaining = Math.max(0, level.totalEnemies - this.levelKills);
    this.enemyValue.textContent = String(remaining).padStart(2, "0");
    this.scoreValue.textContent = String(this.score).padStart(6, "0");
    const ratio = this.player ? 1 - this.player.cooldown / this.player.reload : 1;
    this.cooldownMeter.style.transform = "scaleX(" + clamp(ratio, 0, 1).toFixed(3) + ")";
  };

  Game.prototype.draw = function (time) {
    const ctx = this.ctx;
    ctx.save();
    const magnitude = this.shake;
    if (magnitude > 0) ctx.translate((Math.random() - 0.5) * magnitude, (Math.random() - 0.5) * magnitude);
    this.drawBackground(ctx, time);
    this.drawObstacles(ctx, time);
    this.drawBase(ctx, time);
    if (this.player && this.player.alive) this.drawTank(ctx, this.player, time);
    this.enemies.forEach(function (enemy) { this.drawTank(ctx, enemy, time); }, this);
    this.enemies.forEach(function (enemy) { this.drawTaunt(ctx, enemy, time); }, this);
    this.drawBullets(ctx);
    this.drawParticles(ctx);
    ctx.restore();
  };

  Game.prototype.drawBackground = function (ctx, time) {
    const gradient = ctx.createLinearGradient(0, 0, C.WIDTH, C.HEIGHT);
    gradient.addColorStop(0, "#0b242b");
    gradient.addColorStop(0.48, "#07171d");
    gradient.addColorStop(1, "#09141b");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, C.WIDTH, C.HEIGHT);

    ctx.strokeStyle = C.COLORS.grid;
    ctx.lineWidth = 1;
    for (let x = 0; x <= C.WIDTH; x += 32) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, C.HEIGHT); ctx.stroke();
    }
    for (let y = 0; y <= C.HEIGHT; y += 32) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(C.WIDTH, y); ctx.stroke();
    }

    ctx.save();
    ctx.globalAlpha = 0.06;
    ctx.fillStyle = C.COLORS.player;
    ctx.font = "900 104px Microsoft YaHei, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(C.BACKGROUND_TEXT, C.WIDTH / 2, 370);
    ctx.font = "700 22px Consolas, monospace";
    ctx.letterSpacing = "8px";
    ctx.fillText("CAMPUS DEFENSE NETWORK / AZOU", C.WIDTH / 2, 406);
    ctx.restore();

    ctx.fillStyle = "rgba(98, 245, 230, 0.035)";
    const skyline = [62, 108, 78, 132, 92, 150, 76, 116, 68, 140, 92, 126];
    const width = C.WIDTH / skyline.length;
    skyline.forEach(function (height, index) {
      const sway = Math.sin(time * 0.3 + index) * 2;
      ctx.fillRect(index * width + 5, C.HEIGHT - height + sway, width - 10, height);
    });

    ctx.fillStyle = "rgba(255,255,255,.14)";
    ctx.font = "10px Consolas, monospace";
    ctx.textAlign = "left";
    ctx.fillText("SECTOR " + String(this.levelIndex + 1).padStart(2, "0") + " · WAVEPEAK CAMPUS", 18, 22);
    ctx.textAlign = "right";
    ctx.fillText("ID VERIFIED / " + C.IDENTITY_MARK.toUpperCase(), C.WIDTH - 18, 22);
  };

  Game.prototype.drawObstacles = function (ctx, time) {
    const self = this;
    this.obstacles.forEach(function (item) {
      if (!item.alive) return;
      if (item.type === "brick") self.drawBrick(ctx, item);
      else if (item.type === "steel") self.drawSteel(ctx, item);
      else self.drawWater(ctx, item, time);
    });
  };

  Game.prototype.drawBrick = function (ctx, item) {
    ctx.save();
    ctx.shadowColor = item.identity ? "rgba(255, 138, 91, .5)" : "rgba(217, 104, 77, .25)";
    ctx.shadowBlur = item.identity ? 8 : 3;
    ctx.fillStyle = item.identity ? "#f17b58" : C.COLORS.brick;
    ctx.fillRect(item.x, item.y, item.w, item.h);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = C.COLORS.brickDark;
    ctx.lineWidth = 1;
    ctx.strokeRect(item.x + 0.5, item.y + 0.5, item.w - 1, item.h - 1);
    ctx.beginPath();
    ctx.moveTo(item.x, item.y + item.h / 2);
    ctx.lineTo(item.x + item.w, item.y + item.h / 2);
    ctx.moveTo(item.x + item.w / 2, item.y);
    ctx.lineTo(item.x + item.w / 2, item.y + item.h / 2);
    ctx.stroke();
    ctx.restore();
  };

  Game.prototype.drawSteel = function (ctx, item) {
    const gradient = ctx.createLinearGradient(item.x, item.y, item.x + item.w, item.y + item.h);
    gradient.addColorStop(0, "#40575e");
    gradient.addColorStop(0.45, "#9ab0b5");
    gradient.addColorStop(0.5, "#d9e7e9");
    gradient.addColorStop(0.55, "#71888e");
    gradient.addColorStop(1, "#344a51");
    ctx.fillStyle = gradient;
    ctx.fillRect(item.x, item.y, item.w, item.h);
    ctx.strokeStyle = "rgba(220,248,250,.38)";
    ctx.strokeRect(item.x + 2, item.y + 2, item.w - 4, item.h - 4);
    ctx.fillStyle = "rgba(4,18,22,.6)";
    [[4, 4], [item.w - 4, 4], [4, item.h - 4], [item.w - 4, item.h - 4]].forEach(function (p) {
      ctx.beginPath(); ctx.arc(item.x + p[0], item.y + p[1], 1.4, 0, Math.PI * 2); ctx.fill();
    });
  };

  Game.prototype.drawWater = function (ctx, item, time) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(item.x, item.y, item.w, item.h);
    ctx.clip();
    ctx.fillStyle = "rgba(10, 105, 135, .66)";
    ctx.fillRect(item.x, item.y, item.w, item.h);
    ctx.strokeStyle = "rgba(79, 225, 241, .42)";
    ctx.lineWidth = 2;
    for (let y = item.y - 8; y < item.y + item.h + 10; y += 12) {
      ctx.beginPath();
      for (let x = item.x - 20; x <= item.x + item.w + 20; x += 8) {
        const waveY = y + Math.sin(x * 0.055 + time * 2.2) * 3;
        if (x === item.x - 20) ctx.moveTo(x, waveY); else ctx.lineTo(x, waveY);
      }
      ctx.stroke();
    }
    ctx.restore();
    ctx.strokeStyle = "rgba(72, 210, 232, .22)";
    ctx.strokeRect(item.x + .5, item.y + .5, item.w - 1, item.h - 1);
  };

  Game.prototype.drawTank = function (ctx, tank, time) {
    const center = tank.center();
    ctx.save();
    ctx.translate(center.x, center.y);
    ctx.rotate(tank.dir * Math.PI / 2);
    const alpha = tank.invulnerable > 0 && Math.floor(time * 12) % 2 === 0 ? 0.38 : 1;
    ctx.globalAlpha = alpha;
    ctx.shadowColor = tank.color;
    ctx.shadowBlur = tank.type === "elite" ? 18 : 9;
    ctx.fillStyle = tank.flash > 0 ? "#ffffff" : tank.color;
    ctx.fillRect(-tank.size / 2, -tank.size / 2 + 2, 6, tank.size - 4);
    ctx.fillRect(tank.size / 2 - 6, -tank.size / 2 + 2, 6, tank.size - 4);
    ctx.shadowBlur = 5;
    ctx.fillRect(-tank.size / 2 + 7, -tank.size / 2 + 4, tank.size - 14, tank.size - 8);
    ctx.fillStyle = "rgba(3, 16, 20, .68)";
    ctx.fillRect(-tank.size / 2 + 9, 3, tank.size - 18, tank.size / 2 - 9);
    ctx.fillStyle = tank.flash > 0 ? "#fff" : tank.accent;
    ctx.fillRect(-2.5, -tank.size / 2 - 9, 5, 19);
    ctx.beginPath();
    ctx.arc(0, -1, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(3, 15, 18, .7)";
    ctx.beginPath(); ctx.arc(0, -1, 3, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    if (tank.maxHp > 1) {
      const ratio = tank.hp / tank.maxHp;
      ctx.fillStyle = "rgba(0,0,0,.5)";
      ctx.fillRect(tank.x, tank.y - 8, tank.size, 4);
      ctx.fillStyle = tank.type === "elite" ? "#ff4f91" : "#b486ff";
      ctx.fillRect(tank.x, tank.y - 8, tank.size * ratio, 4);
    }
    if (tank.spawnPulse > 0 || tank.invulnerable > 0) {
      ctx.save();
      ctx.globalAlpha = clamp(Math.max(tank.spawnPulse, tank.invulnerable * .22), 0, .65);
      ctx.strokeStyle = tank.accent;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(center.x, center.y, tank.size * (.72 + Math.sin(time * 6) * .08), 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  };

  Game.prototype.drawTaunt = function (ctx, enemy, time) {
    if (!enemy.alive || !enemy.tauntText || enemy.tauntLife <= 0) return;
    const center = enemy.center();
    const age = enemy.tauntMaxLife - enemy.tauntLife;
    const fade = enemy.tauntLife < 0.35 ? enemy.tauntLife / 0.35 : 1;
    const pop = age < 0.16 ? 0.72 + age / 0.16 * 0.28 : 1;

    ctx.save();
    ctx.globalAlpha = clamp(fade, 0, 1);
    ctx.strokeStyle = enemy.color;
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(center.x, center.y, enemy.size * (0.78 + Math.sin(time * 8) * 0.05), 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.font = "800 14px Microsoft YaHei, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const bubbleWidth = Math.max(66, ctx.measureText(enemy.tauntText).width + 26);
    const bubbleHeight = 32;
    let bubbleX = clamp(center.x, bubbleWidth / 2 + 7, C.WIDTH - bubbleWidth / 2 - 7);
    let bubbleY = enemy.y - 27;
    let tailBelow = true;
    if (bubbleY - bubbleHeight / 2 < 6) {
      bubbleY = enemy.y + enemy.size + 27;
      tailBelow = false;
    }

    ctx.translate(bubbleX, bubbleY);
    ctx.scale(pop, pop);
    ctx.shadowColor = enemy.color;
    ctx.shadowBlur = 14;
    ctx.fillStyle = "rgba(5, 19, 24, .94)";
    ctx.strokeStyle = enemy.color;
    ctx.lineWidth = 1.5;
    const left = -bubbleWidth / 2;
    const top = -bubbleHeight / 2;
    const radius = 9;
    ctx.beginPath();
    ctx.moveTo(left + radius, top);
    ctx.lineTo(-7, top);
    if (!tailBelow) {
      ctx.lineTo(0, top - 7);
      ctx.lineTo(7, top);
    }
    ctx.lineTo(-left - radius, top);
    ctx.quadraticCurveTo(-left, top, -left, top + radius);
    ctx.lineTo(-left, -top - radius);
    ctx.quadraticCurveTo(-left, -top, -left - radius, -top);
    ctx.lineTo(7, -top);
    if (tailBelow) {
      ctx.lineTo(0, -top + 7);
      ctx.lineTo(-7, -top);
    }
    ctx.lineTo(left + radius, -top);
    ctx.quadraticCurveTo(left, -top, left, -top - radius);
    ctx.lineTo(left, top + radius);
    ctx.quadraticCurveTo(left, top, left + radius, top);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.stroke();
    ctx.fillStyle = "#f7ffff";
    ctx.fillText(enemy.tauntText, 0, 1);
    ctx.restore();
  };

  Game.prototype.drawBase = function (ctx, time) {
    if (!this.base) return;
    const x = this.base.x + this.base.w / 2;
    const y = this.base.y + this.base.h / 2;
    ctx.save();
    ctx.translate(x, y);
    const pulse = 1 + Math.sin(time * 3) * .04;
    ctx.scale(pulse, pulse);
    ctx.shadowColor = this.base.alive ? C.COLORS.base : "#ff5d70";
    ctx.shadowBlur = this.base.alive ? 16 : 5;
    ctx.fillStyle = this.base.alive ? C.COLORS.base : "#4a2328";
    ctx.beginPath();
    for (let i = 0; i < 6; i += 1) {
      const angle = -Math.PI / 2 + i * Math.PI / 3;
      const px = Math.cos(angle) * 18;
      const py = Math.sin(angle) * 18;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath(); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#17252a";
    ctx.font = "900 16px Consolas, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("A", 0, 1);
    ctx.restore();
  };

  Game.prototype.drawBullets = function (ctx) {
    this.bullets.forEach(function (bullet) {
      bullet.trail.forEach(function (point, index) {
        ctx.globalAlpha = (1 - index / bullet.trail.length) * .25;
        ctx.fillStyle = bullet.team === "player" ? C.COLORS.player : "#ff8a5b";
        ctx.beginPath(); ctx.arc(point.x, point.y, Math.max(1, bullet.radius - index * .6), 0, Math.PI * 2); ctx.fill();
      });
      ctx.globalAlpha = 1;
      ctx.shadowColor = bullet.team === "player" ? C.COLORS.player : "#ff5d70";
      ctx.shadowBlur = 12;
      ctx.fillStyle = bullet.team === "player" ? "#e8fffc" : "#fff0e8";
      ctx.beginPath(); ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
    });
    ctx.globalAlpha = 1;
  };

  Game.prototype.drawParticles = function (ctx) {
    this.particles.forEach(function (particle) {
      ctx.globalAlpha = clamp(particle.life / particle.maxLife, 0, 1);
      ctx.fillStyle = particle.color;
      ctx.fillRect(particle.x - particle.size / 2, particle.y - particle.size / 2, particle.size, particle.size);
    });
    ctx.globalAlpha = 1;
  };

  window.addEventListener("DOMContentLoaded", function () {
    window.azouTankGame = new Game();
  });
})();

