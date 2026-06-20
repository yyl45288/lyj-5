class DungeonGenerator {
  constructor(width = 50, height = 50, floor = 1) {
    this.width = width;
    this.height = height;
    this.floor = floor;
    this.tiles = [];
    this.rooms = [];
  }

  generate() {
    this.initializeTiles();
    this.generateRooms();
    this.connectRooms();
    this.placeStairs();
    this.placeEnemies();
    this.placeItems();
    const merchantCount = this.placeMerchants() || 0;
    this.placePlayer();
    const map = this.createDungeonMap();
    map.merchantCount = merchantCount;
    map.floor = this.floor;
    return map;
  }

  initializeTiles() {
    for (let y = 0; y < this.height; y++) {
      this.tiles[y] = [];
      for (let x = 0; x < this.width; x++) {
        this.tiles[y][x] = {
          type: 'wall',
          explored: false,
          enemy: null,
          item: null,
          merchant: null
        };
      }
    }
  }

  generateRooms() {
    const minRoomSize = 5;
    const maxRoomSize = 12;
    const maxRooms = 8 + Math.floor(this.floor / 2);
    let attempts = 0;

    while (this.rooms.length < maxRooms && attempts < 100) {
      attempts++;
      const roomWidth = Math.floor(Math.random() * (maxRoomSize - minRoomSize + 1)) + minRoomSize;
      const roomHeight = Math.floor(Math.random() * (maxRoomSize - minRoomSize + 1)) + minRoomSize;
      const x = Math.floor(Math.random() * (this.width - roomWidth - 2)) + 1;
      const y = Math.floor(Math.random() * (this.height - roomHeight - 2)) + 1;

      const newRoom = { x, y, width: roomWidth, height: roomHeight };

      if (!this.roomOverlaps(newRoom)) {
        this.carveRoom(newRoom);
        this.rooms.push(newRoom);
      }
    }
  }

  roomOverlaps(room) {
    for (const other of this.rooms) {
      if (
        room.x <= other.x + other.width + 1 &&
        room.x + room.width + 1 >= other.x &&
        room.y <= other.y + other.height + 1 &&
        room.y + room.height + 1 >= other.y
      ) {
        return true;
      }
    }
    return false;
  }

  carveRoom(room) {
    for (let y = room.y; y < room.y + room.height; y++) {
      for (let x = room.x; x < room.x + room.width; x++) {
        if (y >= 0 && y < this.height && x >= 0 && x < this.width) {
          this.tiles[y][x].type = 'floor';
        }
      }
    }
  }

  connectRooms() {
    for (let i = 1; i < this.rooms.length; i++) {
      const prevRoom = this.rooms[i - 1];
      const currRoom = this.rooms[i];

      const prevCenter = {
        x: Math.floor(prevRoom.x + prevRoom.width / 2),
        y: Math.floor(prevRoom.y + prevRoom.height / 2)
      };
      const currCenter = {
        x: Math.floor(currRoom.x + currRoom.width / 2),
        y: Math.floor(currRoom.y + currRoom.height / 2)
      };

      if (Math.random() < 0.5) {
        this.carveHorizontalTunnel(prevCenter.x, currCenter.x, prevCenter.y);
        this.carveVerticalTunnel(prevCenter.y, currCenter.y, currCenter.x);
      } else {
        this.carveVerticalTunnel(prevCenter.y, currCenter.y, prevCenter.x);
        this.carveHorizontalTunnel(prevCenter.x, currCenter.x, currCenter.y);
      }
    }
  }

  carveHorizontalTunnel(x1, x2, y) {
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    for (let x = minX; x <= maxX; x++) {
      if (y >= 0 && y < this.height && x >= 0 && x < this.width) {
        this.tiles[y][x].type = 'floor';
      }
    }
  }

  carveVerticalTunnel(y1, y2, x) {
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);
    for (let y = minY; y <= maxY; y++) {
      if (y >= 0 && y < this.height && x >= 0 && x < this.width) {
        this.tiles[y][x].type = 'floor';
      }
    }
  }

  placeStairs() {
    if (this.rooms.length < 2) return;
    const lastRoom = this.rooms[this.rooms.length - 1];
    const stairsX = Math.floor(lastRoom.x + lastRoom.width / 2);
    const stairsY = Math.floor(lastRoom.y + lastRoom.height / 2);
    this.tiles[stairsY][stairsX].type = 'stairs';
  }

  placeEnemies() {
    const enemyCount = 5 + this.floor * 3;
    let placed = 0;
    let attempts = 0;

    while (placed < enemyCount && attempts < 200) {
      attempts++;
      const room = this.rooms[Math.floor(Math.random() * this.rooms.length)];
      if (!room) continue;

      const x = Math.floor(Math.random() * (room.width - 2)) + room.x + 1;
      const y = Math.floor(Math.random() * (room.height - 2)) + room.y + 1;

      if (this.isValidPlacement(x, y)) {
        this.tiles[y][x].type = 'enemy';
        this.tiles[y][x].enemy = getRandomEnemy(this.floor);
        placed++;
      }
    }
  }

  placeItems() {
    const itemCount = 3 + Math.floor(this.floor / 2);
    let placed = 0;
    let attempts = 0;

    while (placed < itemCount && attempts < 200) {
      attempts++;
      const room = this.rooms[Math.floor(Math.random() * this.rooms.length)];
      if (!room) continue;

      const x = Math.floor(Math.random() * (room.width - 2)) + room.x + 1;
      const y = Math.floor(Math.random() * (room.height - 2)) + room.y + 1;

      if (this.isValidPlacement(x, y)) {
        this.tiles[y][x].type = 'item';
        this.tiles[y][x].item = getRandomEquipment(this.floor);
        placed++;
      }
    }
  }

  isValidPlacement(x, y) {
    if (y < 0 || y >= this.height || x < 0 || x >= this.width) return false;
    const tile = this.tiles[y][x];
    return tile.type === 'floor' && !tile.enemy && !tile.item && !tile.merchant;
  }

  placeMerchants() {
    const guaranteedEvery = 2;
    const isGuaranteedFloor = this.floor % guaranteedEvery === 0;
    const baseChance = 0.7;
    const floorBonusChance = Math.min(this.floor * 0.04, 0.3);
    const finalChance = isGuaranteedFloor ? 1.0 : Math.min(baseChance + floorBonusChance, 0.95);

    if (Math.random() > finalChance && !isGuaranteedFloor) return;

    const minCount = isGuaranteedFloor ? 2 : 1;
    const maxBonusCount = Math.min(3, Math.floor(this.floor / 3) + 1);
    const merchantCount = minCount + Math.floor(Math.random() * (maxBonusCount + 1));
    let placed = 0;
    let attempts = 0;

    while (placed < merchantCount && attempts < 200) {
      attempts++;
      const room = this.rooms[Math.floor(Math.random() * this.rooms.length)];
      if (!room) continue;

      const x = Math.floor(Math.random() * (room.width - 2)) + room.x + 1;
      const y = Math.floor(Math.random() * (room.height - 2)) + room.y + 1;

      if (this.isValidPlacement(x, y)) {
        this.tiles[y][x].type = 'merchant';
        this.tiles[y][x].merchant = generateMerchant(this.floor);
        placed++;
      }
    }

    return placed;
  }

  placePlayer() {
    const firstRoom = this.rooms[0];
    if (!firstRoom) return { x: 1, y: 1 };
    return {
      x: Math.floor(firstRoom.x + firstRoom.width / 2),
      y: Math.floor(firstRoom.y + firstRoom.height / 2)
    };
  }

  createDungeonMap() {
    const playerPosition = this.placePlayer();
    return {
      width: this.width,
      height: this.height,
      floor: this.floor,
      tiles: this.tiles,
      playerPosition: playerPosition
    };
  }
}

function generateDungeon(width, height, floor) {
  const generator = new DungeonGenerator(width, height, floor);
  return generator.generate();
}
