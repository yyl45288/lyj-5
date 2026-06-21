const AFFIX_DATA = {
  prefixes: [
    { id: 'flame', name: '火焰之', minRarity: 'uncommon', allowedTypes: ['weapon', 'armor', 'accessory'], stats: {}, specialEffect: { type: 'burn', chance: 0.15, damagePercent: 0.08, turns: 3 }, description: '攻击时有15%概率使敌人燃烧，3回合每回合受到8%攻击力伤害' },
    { id: 'frost', name: '寒冰之', minRarity: 'uncommon', allowedTypes: ['weapon', 'armor', 'accessory'], stats: {}, specialEffect: { type: 'freeze', chance: 0.12, turns: 1 }, description: '攻击时有12%概率冻结敌人1回合' },
    { id: 'thunder', name: '雷霆之', minRarity: 'rare', allowedTypes: ['weapon', 'armor', 'accessory'], stats: {}, specialEffect: { type: 'chain_lightning', chance: 0.1, damagePercent: 0.5 }, description: '攻击时有10%概率触发连锁闪电，额外造成50%攻击力伤害' },
    { id: 'vampiric', name: '吸血之', minRarity: 'rare', allowedTypes: ['weapon', 'accessory'], stats: {}, specialEffect: { type: 'lifesteal', percent: 0.15 }, description: '攻击时吸取15%伤害值的生命值' },
    { id: 'agile', name: '敏捷之', minRarity: 'uncommon', allowedTypes: ['weapon', 'armor', 'accessory'], stats: { attack: 2, critChance: 0.05 }, description: '提升2点攻击力和5%暴击率' },
    { id: 'mighty', name: '力量之', minRarity: 'uncommon', allowedTypes: ['weapon', 'armor', 'accessory'], stats: { attack: 5 }, description: '提升5点攻击力' },
    { id: 'sturdy', name: '坚固之', minRarity: 'uncommon', allowedTypes: ['weapon', 'armor', 'accessory'], stats: { defense: 4 }, description: '提升4点防御力' },
    { id: 'vital', name: '生命之', minRarity: 'common', allowedTypes: ['weapon', 'armor', 'accessory'], stats: { maxHp: 20 }, description: '提升20点生命值上限' },
    { id: 'swift', name: '迅捷之', minRarity: 'rare', allowedTypes: ['weapon', 'armor', 'accessory'], stats: { attack: 3, critChance: 0.08 }, specialEffect: { type: 'double_strike', chance: 0.05 }, description: '提升攻击和暴击率，5%概率触发双击' },
    { id: 'ancient', name: '远古之', minRarity: 'epic', allowedTypes: ['weapon', 'armor', 'accessory'], stats: { attack: 8, defense: 5, maxHp: 30 }, description: '远古力量加持，全面提升属性' },
    { id: 'shadow', name: '暗影之', minRarity: 'epic', allowedTypes: ['weapon', 'accessory'], stats: { attack: 6, critChance: 0.1 }, specialEffect: { type: 'execute', threshold: 0.2, damageMultiplier: 2.0 }, description: '攻击提升，暴击+10%，敌人血量低于20%时伤害翻倍' },
    { id: 'holy', name: '神圣之', minRarity: 'epic', allowedTypes: ['weapon', 'armor', 'accessory'], stats: { attack: 5, defense: 8, maxHp: 25 }, specialEffect: { type: 'holy_shield', chance: 0.1, shieldPercent: 0.1 }, description: '攻击时有10%概率生成最大生命值10%的护盾' },
    { id: 'cursed', name: '诅咒之', minRarity: 'legendary', allowedTypes: ['weapon', 'accessory'], stats: { attack: 15, critChance: 0.15 }, specialEffect: { type: 'curse', damagePercent: 0.15, turns: 2 }, description: '攻击时诅咒敌人，2回合受到15%攻击力持续伤害' },
    { id: 'dragon', name: '龙之', minRarity: 'legendary', allowedTypes: ['weapon', 'armor', 'accessory'], stats: { attack: 12, defense: 10, maxHp: 50 }, specialEffect: { type: 'dragon_breath', chance: 0.08, damagePercent: 0.8 }, description: '龙之力加持，8%概率喷出龙息造成80%伤害' },
    { id: 'celestial', name: '天界之', minRarity: 'legendary', allowedTypes: ['weapon', 'armor', 'accessory'], stats: { attack: 10, defense: 10, maxHp: 40 }, specialEffect: { type: 'celestial_blessing', healPercent: 0.05 }, description: '每回合恢复5%最大生命值' }
  ],
  suffixes: [
    { id: 'flame', name: '之焰', minRarity: 'uncommon', allowedTypes: ['weapon', 'accessory'], stats: { attack: 3 }, specialEffect: { type: 'burn', chance: 0.1, damagePercent: 0.05, turns: 2 }, description: '攻击力+3，攻击时10%概率灼烧敌人' },
    { id: 'frost', name: '之霜', minRarity: 'uncommon', allowedTypes: ['weapon', 'accessory'], stats: { attack: 2, defense: 2 }, specialEffect: { type: 'freeze', chance: 0.08, turns: 1 }, description: '攻防各+2，8%概率冻结敌人' },
    { id: 'thunder', name: '之雷', minRarity: 'rare', allowedTypes: ['weapon', 'accessory'], stats: { attack: 5 }, specialEffect: { type: 'chain_lightning', chance: 0.08, damagePercent: 0.3 }, description: '攻击+5，8%概率触发连锁闪电' },
    { id: 'vampire', name: '之吸血', minRarity: 'rare', allowedTypes: ['weapon', 'accessory'], stats: { attack: 3 }, specialEffect: { type: 'lifesteal', percent: 0.1 }, description: '攻击+3，每次攻击吸取10%伤害为生命' },
    { id: 'giant', name: '之巨人', minRarity: 'rare', allowedTypes: ['weapon', 'armor', 'accessory'], stats: { attack: 4, maxHp: 30 }, description: '攻击+4，生命上限+30' },
    { id: 'tiger', name: '之猛虎', minRarity: 'uncommon', allowedTypes: ['weapon', 'armor', 'accessory'], stats: { attack: 4, critChance: 0.05 }, description: '攻击+4，暴击率+5%' },
    { id: 'turtle', name: '之玄武', minRarity: 'rare', allowedTypes: ['armor', 'accessory'], stats: { defense: 6, maxHp: 20 }, description: '防御+6，生命上限+20' },
    { id: 'phoenix', name: '之凤凰', minRarity: 'epic', allowedTypes: ['weapon', 'armor', 'accessory'], stats: { attack: 6, maxHp: 25 }, specialEffect: { type: 'phoenix_revive', chance: 0.03, healPercent: 0.5 }, description: '死亡时有3%概率复活，恢复50%生命值' },
    { id: 'wolf', name: '之狼王', minRarity: 'epic', allowedTypes: ['weapon', 'accessory'], stats: { attack: 8, critChance: 0.1 }, specialEffect: { type: 'wolf_pack', damageMultiplier: 0.1 }, description: '每击杀一个敌人，本场战斗攻击+10%（最多叠加5次）' },
    { id: 'king', name: '之王', minRarity: 'epic', allowedTypes: ['weapon', 'armor', 'accessory'], stats: { attack: 6, defense: 6, maxHp: 30 }, description: '全面提升攻防和生命值' },
    { id: 'god', name: '之神', minRarity: 'legendary', allowedTypes: ['weapon', 'armor', 'accessory'], stats: { attack: 15, defense: 12, maxHp: 60 }, specialEffect: { type: 'divine_blessing', damageReduction: 0.15, damageBoost: 0.15 }, description: '神明祝福，伤害+15%，减伤+15%' },
    { id: 'destruction', name: '之毁灭', minRarity: 'legendary', allowedTypes: ['weapon'], stats: { attack: 20, critChance: 0.2 }, specialEffect: { type: 'destruction', chance: 0.05, damageMultiplier: 3.0 }, description: '5%概率造成3倍毁灭伤害' },
    { id: 'eternity', name: '之永恒', minRarity: 'legendary', allowedTypes: ['armor', 'accessory'], stats: { defense: 15, maxHp: 80 }, specialEffect: { type: 'eternity', damageReduction: 0.2 }, description: '受到的所有伤害降低20%' }
  ],
  special: [
    { id: 'blood_moon', name: '血月', minRarity: 'legendary', allowedTypes: ['weapon'], stats: { attack: 18, critChance: 0.25 }, specialEffect: { type: 'blood_moon', lifestealPercent: 0.3, damageBoost: 0.3 }, description: '血月降临：生命越低伤害越高，最多提升30%伤害，吸血30%' },
    { id: 'soul_reaper', name: '噬魂', minRarity: 'legendary', allowedTypes: ['weapon'], stats: { attack: 15 }, specialEffect: { type: 'soul_reap', attackPerKill: 2, maxStacks: 10 }, description: '每击杀一个敌人，永久+2攻击力（最多10层）' },
    { id: 'guardian_angel', name: '守护天使', minRarity: 'legendary', allowedTypes: ['armor'], stats: { defense: 20, maxHp: 50 }, specialEffect: { type: 'guardian_angel', reviveOnce: true, healPercent: 0.3 }, description: '每场战斗可免死一次，恢复30%生命值' },
    { id: 'time_warp', name: '时间扭曲', minRarity: 'legendary', allowedTypes: ['accessory'], stats: { attack: 8, defense: 8 }, specialEffect: { type: 'time_warp', extraTurnChance: 0.15 }, description: '15%概率获得额外行动回合' }
  ]
};

const RARITY_AFFIX_COUNT = {
  common: { prefix: 0, suffix: 0, special: 0 },
  uncommon: { prefix: 1, suffix: 0, special: 0 },
  rare: { prefix: 1, suffix: 1, special: 0 },
  epic: { prefix: 1, suffix: 1, special: 0 },
  legendary: { prefix: 1, suffix: 1, special: 1 }
};

const AFFIX_KEYWORD_MAP = {
  flame: ['火焰', '烈焰', '炎', '火', '灼热', '燃烧'],
  frost: ['寒冰', '冰霜', '霜', '冰', '雪', '冻结', '冰冻'],
  thunder: ['雷霆', '闪电', '雷电', '雷', '电', '霹雳', '闪电'],
  vampiric: ['吸血', '血族', '嗜血'],
  vampire: ['吸血', '血族', '嗜血'],
  agile: ['敏捷', '迅捷', '快速', '灵巧', '疾风'],
  swift: ['迅捷', '敏捷', '快速', '灵巧', '疾风'],
  mighty: ['力量', '强力', '狂战士', '勇猛', '刚猛'],
  sturdy: ['坚固', '结实', '厚重', '稳固', '坚韧'],
  vital: ['生命', '活力', '生命守护', '生机', '活力'],
  ancient: ['远古', '上古', '古老', '太古', '洪荒'],
  shadow: ['暗影', '阴影', '黑暗', '幽灵', '死神', '影', '暗', '鬼'],
  holy: ['神圣', '圣洁', '天候', '圣', '神恩'],
  celestial: ['天界', '神圣', '星辰', '圣洁', '天堂', '神佑'],
  cursed: ['诅咒', '恶魔', '邪', '死灵', '死亡', '死神'],
  dragon: ['龙', '龙鳞', '龙魂', '龙血', '龙息'],
  giant: ['巨人', '巨大', '巨型', '大力', '泰坦'],
  tiger: ['猛虎', '虎', '白虎', '兽王'],
  turtle: ['玄武', '龟', '玄龟', '龟甲'],
  phoenix: ['凤凰', '不死鸟', '朱雀', '涅槃'],
  wolf: ['狼', '狼王', '灰狼', '狼群'],
  king: ['王', '王者', '帝王', '君主'],
  god: ['神', '诸神', '神明', '神', '神邸'],
  destruction: ['毁灭', '破坏', '破灭', '崩坏'],
  eternity: ['永恒', '不朽', '永生', '不灭'],
  blood_moon: ['血月', '血', '嗜血', '血月'],
  soul_reaper: ['噬魂', '灵魂', '死神', '收割', '夺魂'],
  guardian_angel: ['守护天使', '守护', '天使', '神佑', '圣盾'],
  time_warp: ['时间扭曲', '时间', '扭曲', '时停', '时光']
};

const EQUIPMENT_DATA = {
  weapons: [
    { id: 'sword_1', name: '铁剑', type: 'weapon', rarity: 'common', stats: { attack: 3 }, icon: '🗡️', slotName: '武器' },
    { id: 'sword_2', name: '钢剑', type: 'weapon', rarity: 'uncommon', stats: { attack: 6 }, icon: '⚔️', slotName: '武器' },
    { id: 'sword_3', name: '烈焰剑', type: 'weapon', rarity: 'rare', stats: { attack: 10 }, icon: '🔥', slotName: '武器' },
    { id: 'sword_4', name: '雷霆之刃', type: 'weapon', rarity: 'epic', stats: { attack: 15 }, icon: '⚡', slotName: '武器' },
    { id: 'sword_5', name: '诸神黄昏', type: 'weapon', rarity: 'legendary', stats: { attack: 25 }, icon: '👑', slotName: '武器' },
    { id: 'axe_1', name: '战斧', type: 'weapon', rarity: 'common', stats: { attack: 4 }, icon: '🪓', slotName: '武器' },
    { id: 'dagger_1', name: '匕首', type: 'weapon', rarity: 'common', stats: { attack: 2 }, icon: '🔪', slotName: '武器' },
    { id: 'staff_1', name: '法杖', type: 'weapon', rarity: 'uncommon', stats: { attack: 5, maxHp: 10 }, icon: '🪄', slotName: '武器' },
    { id: 'greatsword_1', name: '巨剑', type: 'weapon', rarity: 'rare', stats: { attack: 12, critChance: 0.05 }, icon: '⚔️', slotName: '武器', description: '双手巨剑，提升暴击率' },
    { id: 'katana_1', name: '武士刀', type: 'weapon', rarity: 'epic', stats: { attack: 14, critChance: 0.1 }, icon: '🗡️', slotName: '武器', description: '锋利的武士刀，高暴击率' },
    { id: 'hammer_1', name: '战锤', type: 'weapon', rarity: 'rare', stats: { attack: 11, defense: 3 }, icon: '🔨', slotName: '武器', description: '沉重的战锤，攻防兼备' },
    { id: 'scythe_1', name: '死神镰刀', type: 'weapon', rarity: 'legendary', stats: { attack: 22, critChance: 0.15 }, icon: '⚰️', slotName: '武器', description: '死神的武器，吸取敌人灵魂' },
    { id: 'spear_1', name: '长枪', type: 'weapon', rarity: 'uncommon', stats: { attack: 7 }, icon: '🔱', slotName: '武器' },
    { id: 'bow_1', name: '精灵弓', type: 'weapon', rarity: 'rare', stats: { attack: 9, critChance: 0.08 }, icon: '🏹', slotName: '武器', description: '精灵族的长弓，远程攻击' },
    { id: 'mace_1', name: '钉头锤', type: 'weapon', rarity: 'epic', stats: { attack: 16, maxHp: 15 }, icon: '⚒️', slotName: '武器', description: '打击类武器，增加生命' }
  ],
  armors: [
    { id: 'armor_1', name: '布甲', type: 'armor', rarity: 'common', stats: { defense: 2 }, icon: '👕', slotName: '护甲' },
    { id: 'armor_2', name: '皮甲', type: 'armor', rarity: 'common', stats: { defense: 4 }, icon: '🦺', slotName: '护甲' },
    { id: 'armor_3', name: '锁子甲', type: 'armor', rarity: 'uncommon', stats: { defense: 7 }, icon: '⛓️', slotName: '护甲' },
    { id: 'armor_4', name: '板甲', type: 'armor', rarity: 'rare', stats: { defense: 12 }, icon: '🛡️', slotName: '护甲' },
    { id: 'armor_5', name: '龙鳞甲', type: 'armor', rarity: 'epic', stats: { defense: 18, maxHp: 20 }, icon: '🐉', slotName: '护甲' },
    { id: 'armor_6', name: '神圣铠甲', type: 'armor', rarity: 'legendary', stats: { defense: 25, maxHp: 50 }, icon: '✨', slotName: '护甲' },
    { id: 'robe_1', name: '法师长袍', type: 'armor', rarity: 'uncommon', stats: { defense: 5, maxHp: 10 }, icon: '🧥', slotName: '护甲', description: '法师专用长袍' },
    { id: 'leather_armor_1', name: '暗影皮甲', type: 'armor', rarity: 'rare', stats: { defense: 10, critChance: 0.05 }, icon: '🦺', slotName: '护甲', description: '适合刺客的轻便护甲' },
    { id: 'knight_armor_1', name: '骑士铠甲', type: 'armor', rarity: 'epic', stats: { defense: 20, maxHp: 30 }, icon: '🛡️', slotName: '护甲', description: '骑士的重型铠甲' },
    { id: 'demon_armor_1', name: '恶魔战甲', type: 'armor', rarity: 'legendary', stats: { defense: 22, attack: 8, maxHp: 40 }, icon: '😈', slotName: '护甲', description: '恶魔的铠甲，攻防兼备' },
    { id: 'chain_mail_1', name: '精金锁子甲', type: 'armor', rarity: 'rare', stats: { defense: 13, maxHp: 15 }, icon: '⛓️', slotName: '护甲', description: '精心打造的锁子甲' },
    { id: 'ghost_robe_1', name: '幽灵斗篷', type: 'armor', rarity: 'epic', stats: { defense: 15, critChance: 0.08 }, icon: '👻', slotName: '护甲', description: '幽灵编织的斗篷' }
  ],
  accessories: [
    { id: 'ring_1', name: '生命戒指', type: 'accessory', rarity: 'common', stats: { maxHp: 15 }, icon: '💍', slotName: '饰品' },
    { id: 'ring_2', name: '力量戒指', type: 'accessory', rarity: 'uncommon', stats: { attack: 3 }, icon: '💪', slotName: '饰品' },
    { id: 'amulet_1', name: '守护护符', type: 'accessory', rarity: 'rare', stats: { defense: 5, maxHp: 10 }, icon: '📿', slotName: '饰品' },
    { id: 'amulet_2', name: '吸血项链', type: 'accessory', rarity: 'epic', stats: { attack: 5, maxHp: 25 }, icon: '🩸', slotName: '饰品' },
    { id: 'crown_1', name: '王者之冠', type: 'accessory', rarity: 'legendary', stats: { attack: 8, defense: 8, maxHp: 40 }, icon: '👑', slotName: '饰品' },
    { id: 'amulet_weather', name: '天候护符', type: 'accessory', rarity: 'rare', stats: { maxHp: 8 }, weatherProtection: true, icon: '🌤️', slotName: '饰品', description: '佩戴后有70%概率抵御异常天气触发。' },
    { id: 'amulet_weather_pro', name: '星辰护符', type: 'accessory', rarity: 'epic', stats: { maxHp: 15, defense: 2 }, weatherProtection: true, weatherDamageResist: 0.5, icon: '🌟', slotName: '饰品', description: '抵御异常天气，天气伤害减半，敌人因天气获得的增益降低。' },
    { id: 'cloak_wind', name: '风行斗篷', type: 'accessory', rarity: 'uncommon', stats: {}, weatherProtection: false, ignoreWeatherMoveBlock: true, icon: '🧥', slotName: '饰品', description: '穿着时不会因天气原因导致移动失败。' },
    { id: 'ring_crit_1', name: '暴击戒指', type: 'accessory', rarity: 'rare', stats: { critChance: 0.1 }, icon: '💍', slotName: '饰品', description: '提升10%暴击率' },
    { id: 'ring_hp_1', name: '生命守护戒指', type: 'accessory', rarity: 'epic', stats: { maxHp: 50, defense: 5 }, icon: '❤️', slotName: '饰品', description: '大幅提升生命值' },
    { id: 'amulet_attack_1', name: '狂战士项链', type: 'accessory', rarity: 'rare', stats: { attack: 8, maxHp: -10 }, icon: '⚔️', slotName: '饰品', description: '牺牲生命换取攻击' },
    { id: 'ring_legendary_1', name: '不朽之戒', type: 'accessory', rarity: 'legendary', stats: { attack: 10, defense: 10, maxHp: 60 }, icon: '💎', slotName: '饰品', description: '传说中的不朽戒指' },
    { id: 'earring_1', name: '敏捷耳环', type: 'accessory', rarity: 'uncommon', stats: { attack: 2, critChance: 0.03 }, icon: '💎', slotName: '饰品' },
    { id: 'belt_1', name: '力量腰带', type: 'accessory', rarity: 'rare', stats: { attack: 4, defense: 4 }, icon: '🎗️', slotName: '饰品' },
    { id: 'bracelet_1', name: '生命手镯', type: 'accessory', rarity: 'epic', stats: { maxHp: 35, defense: 3 }, icon: '📿', slotName: '饰品' }
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

const RARITY_ORDER = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

function getRarityIndex(rarity) {
  return RARITY_ORDER.indexOf(rarity);
}

function isRarityAtLeast(rarity, minRarity) {
  return getRarityIndex(rarity) >= getRarityIndex(minRarity);
}

function generateAffixesForEquipment(baseEquipment, floor = 1, difficultyScore = 0) {
  const rarity = baseEquipment.rarity;
  const affixCount = RARITY_AFFIX_COUNT[rarity] || { prefix: 0, suffix: 0, special: 0 };
  const result = { prefixes: [], suffixes: [], specials: [] };

  const floorBonus = Math.floor(floor / 5);
  const difficultyBonus = Math.floor(Math.max(0, difficultyScore) / 30);
  
  const equipmentName = baseEquipment.baseName || baseEquipment.name;

  const isAffixNameRedundant = (affixId) => {
    const keywords = AFFIX_KEYWORD_MAP[affixId];
    if (!keywords) return false;
    return keywords.some(keyword => equipmentName.includes(keyword));
  };

  const selectAffixes = (affixPool, count, equipmentType) => {
    let available = affixPool.filter(affix => 
      affix.allowedTypes.includes(equipmentType) && 
      isRarityAtLeast(rarity, affix.minRarity) &&
      !isAffixNameRedundant(affix.id)
    );

    if (available.length === 0) {
      available = affixPool.filter(affix => 
        affix.allowedTypes.includes(equipmentType) && 
        isRarityAtLeast(rarity, affix.minRarity)
      );
    }

    const selected = [];
    const usedIds = new Set();
    
    for (let i = 0; i < count && available.length > 0; i++) {
      const bonusChance = Math.min(0.3, (floorBonus + difficultyBonus) * 0.05);
      
      let pool = available.filter(a => !usedIds.has(a.id));
      if (pool.length === 0) break;

      if (Math.random() < bonusChance && pool.length > 1) {
        const highTier = pool.filter(a => 
          getRarityIndex(a.minRarity) >= getRarityIndex('rare')
        );
        if (highTier.length > 0) {
          pool = highTier;
        }
      }

      const selectedAffix = pool[Math.floor(Math.random() * pool.length)];
      selected.push({ ...selectedAffix });
      usedIds.add(selectedAffix.id);
    }

    return selected;
  };

  if (affixCount.prefix > 0) {
    result.prefixes = selectAffixes(AFFIX_DATA.prefixes, affixCount.prefix, baseEquipment.type);
  }

  if (affixCount.suffix > 0) {
    result.suffixes = selectAffixes(AFFIX_DATA.suffixes, affixCount.suffix, baseEquipment.type);
  }

  if (affixCount.special > 0) {
    result.specials = selectAffixes(AFFIX_DATA.special, affixCount.special, baseEquipment.type);
  }

  return result;
}

function generateEquipmentName(baseEquipment, affixes) {
  let name = baseEquipment.name;
  
  if (affixes.prefixes.length > 0) {
    const prefixNames = affixes.prefixes.map(p => p.name).join('');
    name = prefixNames + name;
  }
  
  if (affixes.suffixes.length > 0) {
    const suffixNames = affixes.suffixes.map(s => s.name).join('');
    name = name + suffixNames;
  }
  
  if (affixes.specials.length > 0) {
    const specialNames = affixes.specials.map(s => `「${s.name}」`).join('');
    name = name + specialNames;
  }
  
  return name;
}

function calculateEquipmentAffixStats(affixes) {
  const totalStats = { attack: 0, defense: 0, maxHp: 0, critChance: 0 };

  const addStats = (affix) => {
    if (affix.stats) {
      totalStats.attack += affix.stats.attack || 0;
      totalStats.defense += affix.stats.defense || 0;
      totalStats.maxHp += affix.stats.maxHp || 0;
      totalStats.critChance += affix.stats.critChance || 0;
    }
  };

  affixes.prefixes?.forEach(addStats);
  affixes.suffixes?.forEach(addStats);
  affixes.specials?.forEach(addStats);

  return totalStats;
}

function getEquipmentSpecialEffects(equipment) {
  const effects = [];
  const affixes = equipment.affixes || { prefixes: [], suffixes: [], specials: [] };

  const addEffect = (affix) => {
    if (affix.specialEffect) {
      effects.push({ ...affix.specialEffect, affixId: affix.id, affixName: affix.name });
    }
  };

  affixes.prefixes?.forEach(addEffect);
  affixes.suffixes?.forEach(addEffect);
  affixes.specials?.forEach(addEffect);

  return effects;
}

function getAllEquipment() {
  return [
    ...EQUIPMENT_DATA.weapons,
    ...EQUIPMENT_DATA.armors,
    ...EQUIPMENT_DATA.accessories
  ];
}

function getRandomEquipment(floor = 1, difficultyScore = 0, gameState = null) {
  const scrollChance = 0.15 + floor * 0.01;
  if (Math.random() < scrollChance) {
    return getRandomWeatherScroll(floor);
  }

  if (gameState && gameState.difficultyState) {
    const diffInfo = DifficultySystem.getDifficultyDescription(gameState);
    difficultyScore = diffInfo.score || difficultyScore;
  }

  const allEquipment = getAllEquipment();
  
  const floorRarityBoost = Math.floor(floor / 3);
  const difficultyRarityBoost = Math.floor(Math.max(0, difficultyScore) / 25);
  
  const rarityWeights = {
    common: Math.max(50 - floor * 3 - floorRarityBoost * 5, 5),
    uncommon: 30 + floor + floorRarityBoost * 2,
    rare: 15 + floor * 1.5 + floorRarityBoost * 3 + difficultyRarityBoost * 2,
    epic: 4 + floor * 0.5 + floorRarityBoost * 2 + difficultyRarityBoost * 3,
    legendary: 1 + floor * 0.2 + floorRarityBoost + difficultyRarityBoost * 5
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
  let baseEquipment;
  
  if (equipmentOfRarity.length === 0) {
    baseEquipment = allEquipment[Math.floor(Math.random() * allEquipment.length)];
  } else {
    baseEquipment = equipmentOfRarity[Math.floor(Math.random() * equipmentOfRarity.length)];
  }

  const affixes = generateAffixesForEquipment(baseEquipment, floor, difficultyScore);
  const affixStats = calculateEquipmentAffixStats(affixes);
  const finalName = generateEquipmentName(baseEquipment, affixes);

  const combinedStats = { ...baseEquipment.stats };
  if (affixStats.attack) combinedStats.attack = (combinedStats.attack || 0) + affixStats.attack;
  if (affixStats.defense) combinedStats.defense = (combinedStats.defense || 0) + affixStats.defense;
  if (affixStats.maxHp) combinedStats.maxHp = (combinedStats.maxHp || 0) + affixStats.maxHp;
  if (affixStats.critChance) combinedStats.critChance = (combinedStats.critChance || 0) + affixStats.critChance;

  return {
    ...baseEquipment,
    id: `${baseEquipment.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: finalName,
    baseName: baseEquipment.name,
    stats: combinedStats,
    affixes: affixes,
    baseStats: { ...baseEquipment.stats }
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

function generateMerchantInventory(floor, merchant, gameState = null) {
  const items = [];
  const itemCount = 3 + Math.floor(Math.random() * 3) + Math.floor(floor / 5);
  
  for (let i = 0; i < itemCount; i++) {
    const item = getRandomEquipment(floor, 0, gameState);
    item.buyPrice = calculateItemBuyPrice(item, floor, merchant.baseDiscount);
    item.sellPrice = calculateItemSellPrice(item, floor);
    items.push(item);
  }
  
  return items;
}

function generateMerchant(floor, gameState = null) {
  const baseMerchant = MERCHANT_DATA[Math.floor(Math.random() * MERCHANT_DATA.length)];
  const floorMod = 1 + (floor - 1) * 0.02;
  
  return {
    ...baseMerchant,
    id: `${baseMerchant.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    floor: floor,
    discount: baseMerchant.baseDiscount,
    inventory: generateMerchantInventory(floor, baseMerchant, gameState),
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
