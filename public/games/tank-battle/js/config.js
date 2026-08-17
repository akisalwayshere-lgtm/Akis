(function () {
  "use strict";

  window.TankGame = window.TankGame || {};

  const CONFIG = {
    GAME_TITLE: "浪尖阿走 · 坦克大战",
    IDENTITY_MARK: "Azou",
    BACKGROUND_TEXT: "浪尖阿走",
    WIDTH: 960,
    HEIGHT: 640,
    TANK_SIZE: 30,
    PLAYER_SPEED: 175,
    PLAYER_RELOAD: 0.34,
    BULLET_SPEED: 445,
    STARTING_LIVES: 3,
    MAX_ACTIVE_ENEMIES: [3, 4, 4],
    LEVELS: [
      {
        title: "初入阵地",
        description: "击破砖墙，熟悉战场节奏。",
        totalEnemies: 6,
        spawnDelay: 1.45,
        roster: ["scout", "scout", "scout", "scout", "scout", "scout"]
      },
      {
        title: "潮汐回廊",
        description: "绕开水域，截击高速敌军。",
        totalEnemies: 8,
        spawnDelay: 1.25,
        roster: ["scout", "runner", "scout", "runner", "scout", "runner", "scout", "runner"]
      },
      {
        title: "核心防线",
        description: "重甲来袭，守住浪尖阿走基地。",
        totalEnemies: 10,
        spawnDelay: 1.08,
        roster: ["scout", "runner", "scout", "runner", "heavy", "scout", "runner", "heavy", "runner", "elite"]
      }
    ],
    ENEMY_TYPES: {
      scout: { color: "#ff766d", accent: "#ffd0c9", speed: 95, hp: 1, reload: 1.45, score: 100 },
      runner: { color: "#ffd166", accent: "#fff3bd", speed: 135, hp: 1, reload: 1.2, score: 150 },
      heavy: { color: "#b486ff", accent: "#e5d5ff", speed: 75, hp: 3, reload: 1.55, score: 280 },
      elite: { color: "#ff4f91", accent: "#ffe0ec", speed: 92, hp: 5, reload: 0.85, score: 600 }
    },
    TAUNTS: [
      "来抓我呀", "就这水平", "瞄准点吧", "太慢啦", "别发呆",
      "看这边", "打不中", "追不上", "认输吧", "小心身后",
      "敢过来吗", "继续努力", "差一点哦", "炮弹偏了", "再快一点"
    ],
    DIFFICULTIES: {
      easy: { enemySpeed: 0.82, enemyReload: 1.25, playerReload: 0.86, score: 0.85 },
      normal: { enemySpeed: 1, enemyReload: 1, playerReload: 1, score: 1 },
      hard: { enemySpeed: 1.2, enemyReload: 0.8, playerReload: 1.08, score: 1.35 }
    },
    STORAGE_KEYS: {
      bestScore: "azou-tank-best-score",
      bestTime: "azou-tank-best-time",
      muted: "azou-tank-muted",
      difficulty: "azou-tank-difficulty"
    },
    COLORS: {
      bg: "#07151b",
      grid: "rgba(98, 245, 230, 0.055)",
      player: "#62f5e6",
      playerAccent: "#d8fffb",
      brick: "#d9684d",
      brickDark: "#763429",
      steel: "#78939a",
      water: "#0d7f9b",
      base: "#ffd166"
    }
  };

  window.TankGame.CONFIG = CONFIG;
})();

