(function () {
  "use strict";

  const TG = window.TankGame;
  const C = TG.CONFIG;

  const LETTERS = {
    A: ["01110", "10001", "11111", "10001", "10001"],
    Z: ["11111", "00010", "00100", "01000", "11111"],
    O: ["01110", "10001", "10001", "10001", "01110"],
    U: ["10001", "10001", "10001", "10001", "01110"]
  };

  function obstacle(type, x, y, w, h, extra) {
    return Object.assign({ type, x, y, w, h, hp: type === "brick" ? 1 : Infinity, alive: true }, extra || {});
  }

  function addRow(list, type, x, y, count, size, gap) {
    for (let i = 0; i < count; i += 1) list.push(obstacle(type, x + i * (size + gap), y, size, size));
  }

  function addColumn(list, type, x, y, count, size, gap) {
    for (let i = 0; i < count; i += 1) list.push(obstacle(type, x, y + i * (size + gap), size, size));
  }

  function addWord(list, y, type) {
    const word = C.IDENTITY_MARK.toUpperCase();
    const unit = 11;
    const cellGap = 2;
    const letterGap = 12;
    const letterWidth = 5 * (unit + cellGap) - cellGap;
    const totalWidth = word.length * letterWidth + (word.length - 1) * letterGap;
    const startX = (C.WIDTH - totalWidth) / 2;

    word.split("").forEach(function (letter, letterIndex) {
      const glyph = LETTERS[letter];
      if (!glyph) return;
      glyph.forEach(function (row, rowIndex) {
        row.split("").forEach(function (value, colIndex) {
          if (value === "1") {
            list.push(obstacle(
              type || "brick",
              startX + letterIndex * (letterWidth + letterGap) + colIndex * (unit + cellGap),
              y + rowIndex * (unit + cellGap),
              unit,
              unit,
              { identity: true }
            ));
          }
        });
      });
    });
  }

  function protectBase(list) {
    const x = C.WIDTH / 2;
    addColumn(list, "brick", x - 58, C.HEIGHT - 82, 2, 24, 1);
    addColumn(list, "brick", x + 34, C.HEIGHT - 82, 2, 24, 1);
    addRow(list, "brick", x - 33, C.HEIGHT - 82, 3, 24, 1);
  }

  function makeLevelOne() {
    const list = [];
    addWord(list, 245, "brick");
    addColumn(list, "brick", 148, 132, 6, 25, 2);
    addColumn(list, "brick", 787, 132, 6, 25, 2);
    addRow(list, "brick", 235, 438, 5, 26, 2);
    addRow(list, "brick", 589, 438, 5, 26, 2);
    addRow(list, "steel", 32, 356, 4, 26, 2);
    addRow(list, "steel", 818, 356, 4, 26, 2);
    protectBase(list);
    return list;
  }

  function makeLevelTwo() {
    const list = [];
    addWord(list, 238, "brick");
    list.push(obstacle("water", 42, 180, 145, 66));
    list.push(obstacle("water", 773, 180, 145, 66));
    list.push(obstacle("water", 355, 410, 250, 54));
    addColumn(list, "steel", 250, 118, 4, 27, 2);
    addColumn(list, "steel", 682, 118, 4, 27, 2);
    addRow(list, "brick", 60, 358, 6, 24, 2);
    addRow(list, "brick", 750, 358, 6, 24, 2);
    addColumn(list, "brick", 278, 454, 4, 24, 2);
    addColumn(list, "brick", 658, 454, 4, 24, 2);
    protectBase(list);
    return list;
  }

  function makeLevelThree() {
    const list = [];
    addWord(list, 260, "brick");
    list.push(obstacle("water", 48, 278, 155, 52));
    list.push(obstacle("water", 757, 278, 155, 52));
    addRow(list, "steel", 300, 132, 4, 29, 3);
    addRow(list, "steel", 540, 132, 4, 29, 3);
    addColumn(list, "steel", 232, 404, 4, 27, 3);
    addColumn(list, "steel", 701, 404, 4, 27, 3);
    addRow(list, "brick", 55, 110, 5, 25, 2);
    addRow(list, "brick", 770, 110, 5, 25, 2);
    addRow(list, "brick", 330, 470, 4, 24, 2);
    addRow(list, "brick", 536, 470, 4, 24, 2);
    protectBase(list);
    return list;
  }

  function createMap(levelIndex) {
    const factories = [makeLevelOne, makeLevelTwo, makeLevelThree];
    return factories[Math.max(0, Math.min(factories.length - 1, levelIndex))]();
  }

  TG.Maps = { createMap };
})();

