(function () {
  "use strict";

  const TG = window.TankGame;

  const VECTORS = [
    { x: 0, y: -1 },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: -1, y: 0 }
  ];

  function createAI() {
    return {
      thinkTimer: Math.random() * 0.5,
      fireTimer: 0.35 + Math.random() * 0.9,
      stuckTimer: 0,
      lastX: 0,
      lastY: 0,
      target: Math.random() < 0.58 ? "base" : "player"
    };
  }

  function clearShot(tank, target, obstacles) {
    const tc = tank.center();
    const targetRect = target.rect ? target.rect() : target;
    const tx = targetRect.x + targetRect.w / 2;
    const ty = targetRect.y + targetRect.h / 2;
    const horizontal = Math.abs(tc.y - ty) < 24;
    const vertical = Math.abs(tc.x - tx) < 24;
    if (!horizontal && !vertical) return false;

    const ray = horizontal
      ? { x: Math.min(tc.x, tx), y: tc.y - 3, w: Math.abs(tx - tc.x), h: 6 }
      : { x: tc.x - 3, y: Math.min(tc.y, ty), w: 6, h: Math.abs(ty - tc.y) };
    const blocked = obstacles.some(function (item) {
      return item.alive && item.type !== "water" && TG.Entities.rectsOverlap(ray, item);
    });
    return !blocked;
  }

  function desiredDirections(tank, target) {
    const tc = tank.center();
    const tr = target.rect ? target.rect() : target;
    const tx = tr.x + tr.w / 2;
    const ty = tr.y + tr.h / 2;
    const horizontal = tx > tc.x ? 1 : 3;
    const vertical = ty > tc.y ? 2 : 0;
    if (Math.abs(tx - tc.x) > Math.abs(ty - tc.y)) return [horizontal, vertical];
    return [vertical, horizontal];
  }

  function updateEnemy(enemy, game, dt) {
    if (!enemy.ai) {
      enemy.ai = createAI();
      enemy.ai.lastX = enemy.x;
      enemy.ai.lastY = enemy.y;
    }
    const ai = enemy.ai;
    ai.thinkTimer -= dt;
    ai.fireTimer -= dt;

    const moved = Math.hypot(enemy.x - ai.lastX, enemy.y - ai.lastY);
    ai.stuckTimer = moved < 0.35 ? ai.stuckTimer + dt : 0;
    ai.lastX = enemy.x;
    ai.lastY = enemy.y;

    const target = ai.target === "base" || !game.player.alive ? game.base : game.player;
    if (ai.thinkTimer <= 0 || ai.stuckTimer > 0.45) {
      const preferred = desiredDirections(enemy, target);
      if (Math.random() < 0.73 && ai.stuckTimer < 0.45) {
        enemy.dir = preferred[Math.random() < 0.72 ? 0 : 1];
      } else {
        const options = [0, 1, 2, 3].filter(function (dir) { return dir !== (enemy.dir + 2) % 4; });
        enemy.dir = options[Math.floor(Math.random() * options.length)];
      }
      ai.thinkTimer = 0.42 + Math.random() * 0.9;
      ai.stuckTimer = 0;
      if (Math.random() < 0.2) ai.target = ai.target === "base" ? "player" : "base";
    }

    const vector = VECTORS[enemy.dir];
    const movedSuccessfully = game.tryMoveTank(enemy, vector.x * enemy.speed * dt, vector.y * enemy.speed * dt);
    if (!movedSuccessfully) ai.stuckTimer += dt * 2;

    const alignedTarget = clearShot(enemy, target, game.obstacles);
    if (ai.fireTimer <= 0 && (alignedTarget || Math.random() < 0.09)) {
      game.fireTank(enemy);
      ai.fireTimer = enemy.reload * (0.75 + Math.random() * 0.65);
    }
  }

  TG.AI = { updateEnemy, VECTORS };
})();

