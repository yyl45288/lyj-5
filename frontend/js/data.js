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
    { id: 'crown_1', name: '王者之冠', type: 'accessory', rarity: 'legendary', stats: { attack: 8, defense: 8, maxHp: 40 }, icon: '👑' },
    { id: 'amulet_weather', name: '天候护符', type: 'accessory', rarity: 'rare', stats: { maxHp: 8 }, weatherProtection: true, icon: '🌤️', description: '佩戴后有70%概率抵御异常天气触发。' },
    { id: 'amulet_weather_pro', name: '星辰护符', type: 'accessory', rarity: 'epic', stats: { maxHp: 15, defense: 2 }, weatherProtection: true, weatherDamageResist: 0.5, icon: '🌟', description: '抵御异常天气，天气伤害减半，敌人因天气获得的增益降低。' },
    { id: 'cloak_wind', name: '风行斗篷', type: 'accessory', rarity: 'uncommon', stats: {}, weatherProtection: false, ignoreWeatherMoveBlock: true, icon: '🧥', description: '穿着时不会因天气原因导致移动失败。' }
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

const WEATHER_SCROLLS = [
  {
    id: 'scroll_acid_rain',
    name: '酸雨卷轴',
    type: 'weather_scroll',
    rarity: 'uncommon',
    icon: '📜',
    weatherId: 'acid_rain',
    duration: 25,
    description: '使用后召唤酸雨天气，持续25步。'
  },
  {
    id: 'scroll_divine_light',
    name: '圣光卷轴',
    type: 'weather_scroll',
    rarity: 'rare',
    icon: '📜',
    weatherId: 'divine_light',
    duration: 20,
    description: '使用后召唤神圣光辉，持续20步。'
  },
  {
    id: 'scroll_thunderstorm',
    name: '雷暴卷轴',
    type: 'weather_scroll',
    rarity: 'rare',
    icon: '📜',
    weatherId: 'thunderstorm',
    duration: 20,
    description: '使用后召唤雷电风暴，持续20步。'
  },
  {
    id: 'scroll_magma_heat',
    name: '熔岩卷轴',
    type: 'weather_scroll',
    rarity: 'epic',
    icon: '📜',
    weatherId: 'magma_heat',
    duration: 15,
    description: '使用后召唤熔岩热浪，持续15步。'
  },
  {
    id: 'scroll_clear_weather',
    name: '晴空咒符',
    type: 'weather_clear',
    rarity: 'uncommon',
    icon: '🧿',
    description: '使用后清除所有天气效果。'
  },
  {
    id: 'potion_weather_resist',
    name: '天气抗性药剂',
    type: 'weather_resist',
    rarity: 'uncommon',
    icon: '🧪',
    duration: 30,
    description: '使用后30步内免疫天气伤害和移动阻碍，天气负面效果减半。'
  },
  {
    id: 'scroll_weather_shield',
    name: '天气护盾卷轴',
    type: 'weather_shield',
    rarity: 'rare',
    icon: '📜',
    duration: 20,
    description: '使用后20步内完全免疫所有负面天气效果，正面天气效果增强。'
  },
  {
    id: 'item_weather_lure',
    name: '天候水晶',
    type: 'weather_lure',
    rarity: 'epic',
    icon: '💎',
    description: '使用后将当前所有负面天气转化为随机正面天气。'
  }
];

function getAllEquipment() {
  return [
    ...EQUIPMENT_DATA.weapons,
    ...EQUIPMENT_DATA.armors,
    ...EQUIPMENT_DATA.accessories
  ];
}

function getRandomEquipment(floor = 1) {
  const scrollChance = 0.15 + floor * 0.01;
  if (Math.random() < scrollChance) {
    return getRandomWeatherScroll(floor);
  }

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

function getRandomWeatherScroll(floor = 1) {
  const rarityWeights = {
    uncommon: 50,
    rare: 30 + floor,
    epic: 10 + floor * 0.5
  };

  const totalWeight = Object.values(rarityWeights).reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;
  let selectedRarity = 'uncommon';

  for (const [rarity, weight] of Object.entries(rarityWeights)) {
    random -= weight;
    if (random <= 0) {
      selectedRarity = rarity;
      break;
    }
  }

  const scrollsOfRarity = WEATHER_SCROLLS.filter(s => s.rarity === selectedRarity);
  if (scrollsOfRarity.length === 0) {
    return WEATHER_SCROLLS[Math.floor(Math.random() * WEATHER_SCROLLS.length)];
  }

  const baseScroll = scrollsOfRarity[Math.floor(Math.random() * scrollsOfRarity.length)];
  return {
    ...baseScroll,
    id: `${baseScroll.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
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

const MERCHANT_DATA = [
  { id: 'merchant_1', name: '流浪商人', icon: '🧙‍♂️', greeting: '欢迎光临！我这里有各种好东西！', baseDiscount: 1.0 },
  { id: 'merchant_2', name: '神秘老者', icon: '🧓', greeting: '年轻人，看看这些宝贝吧...', baseDiscount: 0.95 },
  { id: 'merchant_3', name: '地精商贩', icon: '👺', greeting: '嘿嘿嘿，来看看我的货！便宜又实惠！', baseDiscount: 0.85 },
  { id: 'merchant_4', name: '精灵商人', icon: '🧝', greeting: '远方的朋友，我带来了精灵族的珍品。', baseDiscount: 1.1 },
  { id: 'merchant_5', name: '矮人工匠', icon: '🧔', greeting: '瞧瞧这些手工打造的装备！绝对坚固！', baseDiscount: 1.05 },
  { id: 'merchant_6', name: '黑市商人', icon: '🎭', greeting: '嘘...我这里有些特别的东西...', baseDiscount: 0.75 }
];

const ATTRIBUTE_TYPES = [
  { id: 'maxHp', name: '生命上限', icon: '❤️', basePrice: 50, baseValue: 10, description: '永久提升最大生命值' },
  { id: 'attack', name: '攻击力', icon: '⚔️', basePrice: 80, baseValue: 2, description: '永久提升攻击力' },
  { id: 'defense', name: '防御力', icon: '🛡️', basePrice: 80, baseValue: 1, description: '永久提升防御力' }
];

function calculateItemBuyPrice(item, floor, merchantDiscount = 1.0) {
  const rarityMultiplier = {
    common: 1,
    uncommon: 2,
    rare: 4,
    epic: 8,
    legendary: 20
  };
  
  let baseValue = 0;
  if (item.stats) {
    baseValue += (item.stats.attack || 0) * 15;
    baseValue += (item.stats.defense || 0) * 15;
    baseValue += (item.stats.maxHp || 0) * 2;
  }
  
  if (item.weatherProtection) baseValue += 100;
  if (item.weatherDamageResist) baseValue += 80;
  if (item.ignoreWeatherMoveBlock) baseValue += 60;
  
  if (baseValue < 20) baseValue = 20;
  
  const rarityMod = rarityMultiplier[item.rarity] || 1;
  const floorMod = 1 + (floor - 1) * 0.05;
  const valueMod = 1 / (1 + (floor - 1) * 0.03);
  
  return Math.floor(baseValue * rarityMod * floorMod * valueMod * merchantDiscount);
}

function calculateItemSellPrice(item, floor) {
  const buyPrice = calculateItemBuyPrice(item, floor, 1.0);
  return Math.floor(buyPrice * 0.5);
}

function calculateAttributePrice(attrType, floor, purchasedCount) {
  const basePrice = ATTRIBUTE_TYPES.find(a => a.id === attrType)?.basePrice || 50;
  const floorMod = 1 + (floor - 1) * 0.1;
  const valueMod = 1 + (floor - 1) * 0.02;
  const countMod = 1 + purchasedCount * 0.2;
  
  return Math.floor(basePrice * floorMod * valueMod * countMod);
}

function calculateAttributeValue(attrType, floor) {
  const baseValue = ATTRIBUTE_TYPES.find(a => a.id === attrType)?.baseValue || 1;
  const floorMod = 1 + (floor - 1) * 0.05;
  return Math.floor(baseValue * floorMod);
}

function generateMerchantInventory(floor, merchant) {
  const items = [];
  const itemCount = 3 + Math.floor(Math.random() * 3) + Math.floor(floor / 5);
  
  for (let i = 0; i < itemCount; i++) {
    const item = getRandomEquipment(floor);
    item.buyPrice = calculateItemBuyPrice(item, floor, merchant.baseDiscount);
    item.sellPrice = calculateItemSellPrice(item, floor);
    items.push(item);
  }
  
  return items;
}

function generateMerchant(floor) {
  const baseMerchant = MERCHANT_DATA[Math.floor(Math.random() * MERCHANT_DATA.length)];
  const floorMod = 1 + (floor - 1) * 0.02;
  
  return {
    ...baseMerchant,
    id: `${baseMerchant.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    floor: floor,
    discount: baseMerchant.baseDiscount,
    inventory: generateMerchantInventory(floor, baseMerchant),
    attributePurchased: {
      maxHp: 0,
      attack: 0,
      defense: 0
    },
    goldReward: Math.floor(20 + floor * 15 + Math.random() * floor * 10),
    expReward: Math.floor(10 + floor * 5)
  };
}

function getRandomGoldAmount(floor, enemyRarity = 'common') {
  const baseAmount = 8 + floor * 4;
  const rarityMultiplier = {
    common: 1.0,
    uncommon: 1.5,
    rare: 2.2,
    epic: 3.5,
    legendary: 5.5
  };
  const multiplier = rarityMultiplier[enemyRarity] || 1.0;
  const variance = Math.floor(Math.random() * baseAmount * 0.6);
  return Math.floor((baseAmount + variance) * multiplier);
}

const QUEST_TYPES = [
  {
    id: 'kill_enemies',
    name: '清剿怪物',
    description: (count) => `击败 ${count} 个敌人`,
    getTarget: (floor) => Math.min(3 + Math.floor(floor * 0.8), 12),
    getReward: (floor) => 30 + floor * 20
  },
  {
    id: 'find_merchant',
    name: '寻找商人',
    description: (count) => `访问 ${count} 个商人`,
    getTarget: (floor) => Math.min(1 + Math.floor(floor / 5), 3),
    getReward: (floor) => 25 + floor * 15
  },
  {
    id: 'collect_gold',
    name: '收集金币',
    description: (count) => `累计获得 ${count} 金币`,
    getTarget: (floor) => 50 + floor * 40,
    getReward: (floor) => 40 + floor * 18
  },
  {
    id: 'complete_combo',
    name: '连击高手',
    description: (count) => `达成 ${count} 次连续击杀`,
    getTarget: (floor) => Math.min(2 + Math.floor(floor * 0.3), 6),
    getReward: (floor) => 35 + floor * 22
  },
  {
    id: 'reach_stairs',
    name: '深入探索',
    description: () => `找到并前往下一层入口`,
    getTarget: () => 1,
    getReward: (floor) => 20 + floor * 12
  }
];

function generateQuest(floor, existingQuests = []) {
  const existingIds = existingQuests.map(q => q.typeId);
  let availableQuests = QUEST_TYPES.filter(q => !existingIds.includes(q.id));
  if (availableQuests.length === 0) availableQuests = QUEST_TYPES;
  const questType = availableQuests[Math.floor(Math.random() * availableQuests.length)];
  const target = questType.getTarget(floor);
  return {
    id: 'quest_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
    typeId: questType.id,
    name: questType.name,
    description: questType.description(target),
    target,
    progress: 0,
    reward: questType.getReward(floor),
    completed: false,
    claimed: false
  };
}

function generateFloorQuests(floor, count = 2) {
  const quests = [];
  for (let i = 0; i < count; i++) {
    quests.push(generateQuest(floor, quests));
  }
  return quests;
}
