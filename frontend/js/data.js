const EQUIPMENT_DATA = {
  weapons: [
    { id: 'sword_1', name: '铁剑', type: 'weapon', rarity: 'common', stats: { attack: 3 }, icon: '🗡️' },
    { id: 'sword_2', name: '钢剑', type: 'weapon', rarity: 'uncommon', stats: { attack: 6 }, icon: '⚔️' },
    { id: 'sword_3', name: '烈焰剑', type: 'weapon', rarity: 'rare', stats: { attack: 10 }, icon: '🔥' },
    { id: 'sword_4', name: '雷霆之刃', type: 'weapon', rarity: 'epic', stats: { attack: 15 }, icon: '⚡' },
    { id: 'sword_5', name: '诸神黄昏', type: 'weapon', rarity: 'legendary', stats: { attack: 25 }, icon: '👑' },
    { id: 'axe_1', name: '战斧', type: 'weapon', rarity: 'common', stats: { attack: 4 }, icon: '🪓' },
    { id: 'dagger_1', name: '匕首', type: 'weapon', rarity: 'common', stats: { attack: 2 }, icon: '🔪' },
    { id: 'staff_1', name: '法杖', type: 'weapon', rarity: 'uncommon', stats: { attack: 5, maxHp: 10 }, icon: '🪄' }
  ],
  armors: [
    { id: 'armor_1', name: '布甲', type: 'armor', rarity: 'common', stats: { defense: 2 }, icon: '👕' },
    { id: 'armor_2', name: '皮甲', type: 'armor', rarity: 'common', stats: { defense: 4 }, icon: '🦺' },
    { id: 'armor_3', name: '锁子甲', type: 'armor', rarity: 'uncommon', stats: { defense: 7 }, icon: '⛓️' },
    { id: 'armor_4', name: '板甲', type: 'armor', rarity: 'rare', stats: { defense: 12 }, icon: '🛡️' },
    { id: 'armor_5', name: '龙鳞甲', type: 'armor', rarity: 'epic', stats: { defense: 18, maxHp: 20 }, icon: '🐉' },
    { id: 'armor_6', name: '神圣铠甲', type: 'armor', rarity: 'legendary', stats: { defense: 25, maxHp: 50 }, icon: '✨' }
  ],
  accessories: [
    { id: 'ring_1', name: '生命戒指', type: 'accessory', rarity: 'common', stats: { maxHp: 15 }, icon: '💍' },
    { id: 'ring_2', name: '力量戒指', type: 'accessory', rarity: 'uncommon', stats: { attack: 3 }, icon: '💪' },
    { id: 'amulet_1', name: '守护护符', type: 'accessory', rarity: 'rare', stats: { defense: 5, maxHp: 10 }, icon: '📿' },
    { id: 'amulet_2', name: '吸血项链', type: 'accessory', rarity: 'epic', stats: { attack: 5, maxHp: 25 }, icon: '🩸' },
    { id: 'crown_1', name: '王者之冠', type: 'accessory', rarity: 'legendary', stats: { attack: 8, defense: 8, maxHp: 40 }, icon: '👑' }
  ]
};

const ENEMY_DATA = [
  { id: 'slime', name: '史莱姆', maxHp: 20, attack: 5, defense: 1, expReward: 15, icon: '🟢', dropRate: 0.3 },
  { id: 'goblin', name: '哥布林', maxHp: 30, attack: 8, defense: 2, expReward: 25, icon: '👺', dropRate: 0.4 },
  { id: 'skeleton', name: '骷髅兵', maxHp: 40, attack: 10, defense: 3, expReward: 35, icon: '💀', dropRate: 0.45 },
  { id: 'orc', name: '兽人', maxHp: 60, attack: 14, defense: 5, expReward: 50, icon: '👹', dropRate: 0.5 },
  { id: 'ghost', name: '幽灵', maxHp: 35, attack: 16, defense: 2, expReward: 45, icon: '👻', dropRate: 0.5 },
  { id: 'vampire', name: '吸血鬼', maxHp: 80, attack: 18, defense: 6, expReward: 70, icon: '🧛', dropRate: 0.6 },
  { id: 'werewolf', name: '狼人', maxHp: 100, attack: 22, defense: 8, expReward: 90, icon: '🐺', dropRate: 0.65 },
  { id: 'demon', name: '恶魔', maxHp: 120, attack: 25, defense: 10, expReward: 120, icon: '😈', dropRate: 0.7 },
  { id: 'dragon', name: '巨龙', maxHp: 200, attack: 35, defense: 15, expReward: 200, icon: '🐲', dropRate: 0.9 },
  { id: 'lich', name: '巫妖', maxHp: 150, attack: 30, defense: 12, expReward: 180, icon: '🧙', dropRate: 0.8 }
];

const RARITY_COLORS = {
  common: '#95A5A6',
  uncommon: '#2ECC71',
  rare: '#3498DB',
  epic: '#9B59B6',
  legendary: '#F1C40F'
};

const RARITY_NAMES = {
  common: '普通',
  uncommon: '优秀',
  rare: '稀有',
  epic: '史诗',
  legendary: '传说'
};

function getAllEquipment() {
  return [
    ...EQUIPMENT_DATA.weapons,
    ...EQUIPMENT_DATA.armors,
    ...EQUIPMENT_DATA.accessories
  ];
}

function getRandomEquipment(floor = 1) {
  const allEquipment = getAllEquipment();
  const rarityWeights = {
    common: Math.max(50 - floor * 3, 10),
    uncommon: 30 + floor,
    rare: 15 + floor * 1.5,
    epic: 4 + floor * 0.5,
    legendary: 1 + floor * 0.2
  };

  const totalWeight = Object.values(rarityWeights).reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;
  let selectedRarity = 'common';

  for (const [rarity, weight] of Object.entries(rarityWeights)) {
    random -= weight;
    if (random <= 0) {
      selectedRarity = rarity;
      break;
    }
  }

  const equipmentOfRarity = allEquipment.filter(e => e.rarity === selectedRarity);
  if (equipmentOfRarity.length === 0) {
    return allEquipment[Math.floor(Math.random() * allEquipment.length)];
  }

  const baseEquipment = equipmentOfRarity[Math.floor(Math.random() * equipmentOfRarity.length)];
  return {
    ...baseEquipment,
    id: `${baseEquipment.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  };
}

function getRandomEnemy(floor = 1) {
  const availableEnemies = ENEMY_DATA.filter((_, index) => index <= Math.min(floor + 2, ENEMY_DATA.length - 1));
  const baseEnemy = availableEnemies[Math.floor(Math.random() * availableEnemies.length)];
  const scaleFactor = 1 + (floor - 1) * 0.15;

  return {
    ...baseEnemy,
    id: `${baseEnemy.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    maxHp: Math.floor(baseEnemy.maxHp * scaleFactor),
    currentHp: Math.floor(baseEnemy.maxHp * scaleFactor),
    attack: Math.floor(baseEnemy.attack * scaleFactor),
    defense: Math.floor(baseEnemy.defense * scaleFactor),
    expReward: Math.floor(baseEnemy.expReward * scaleFactor),
    dropRate: baseEnemy.dropRate
  };
}
