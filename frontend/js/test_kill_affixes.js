console.log('=== 击杀词缀效果测试 ===\n');

function createTestGameState() {
  const gameState = {
    player: {
      stats: {
        level: 1,
        attack: 10,
        defense: 5,
        maxHp: 100,
        currentHp: 100,
        exp: 0,
        critChance: 0.1
      },
      equipment: {
        weapon: null,
        armor: null,
        accessory: null
      },
      inventory: [],
      gold: 100,
      skills: { combatEffects: { shield: 0 } }
    },
    dungeon: { floor: 5 },
    combat: {
      active: false,
      killsThisCombat: 0
    },
    kills: 0,
    score: 0,
    difficultyState: {
      difficultyScore: 0,
      currentDifficulty: 'normal'
    },
    gameLog: []
  };
  return gameState;
}

function createTestWeapon(affixType) {
  const baseWeapon = {
    id: 'test_weapon',
    name: '测试之剑',
    type: 'weapon',
    rarity: 'legendary',
    stats: { attack: 20 },
    icon: '⚔️',
    slotName: '武器',
    baseName: '测试之剑',
    baseStats: { attack: 20 },
    affixes: {
      prefixes: [],
      suffixes: [],
      specials: []
    }
  };

  switch (affixType) {
    case 'soul_reaper':
      baseWeapon.affixes.specials.push({
        id: 'soul_reaper',
        name: '噬魂',
        minRarity: 'legendary',
        allowedTypes: ['weapon'],
        stats: { attack: 15 },
        specialEffect: { type: 'soul_reap', attackPerKill: 2, maxStacks: 10 },
        description: '每击杀一个敌人，永久+2攻击力（最多10层）'
      });
      baseWeapon.stats.attack += 15;
      baseWeapon.name = '噬魂之测试之剑';
      break;
    case 'wolf_pack':
      baseWeapon.affixes.suffixes.push({
        id: 'wolf',
        name: '之狼王',
        minRarity: 'epic',
        allowedTypes: ['weapon', 'accessory'],
        stats: { attack: 8, critChance: 0.1 },
        specialEffect: { type: 'wolf_pack', damageMultiplier: 0.1 },
        description: '每击杀一个敌人，本场战斗攻击+10%（最多叠加5次）'
      });
      baseWeapon.stats.attack += 8;
      baseWeapon.stats.critChance = 0.1;
      baseWeapon.name = '测试之剑之狼王';
      break;
    case 'blood_moon':
      baseWeapon.affixes.specials.push({
        id: 'blood_moon',
        name: '血月',
        minRarity: 'legendary',
        allowedTypes: ['weapon'],
        stats: { attack: 18, critChance: 0.25 },
        specialEffect: { type: 'blood_moon', lifestealPercent: 0.3, damageBoost: 0.3 },
        description: '血月降临：生命越低伤害越高，最多提升30%伤害，吸血30%'
      });
      baseWeapon.stats.attack += 18;
      baseWeapon.stats.critChance = 0.25;
      baseWeapon.name = '血月之测试之剑';
      break;
  }

  return baseWeapon;
}

function testSoulReaper() {
  console.log('1. 测试噬魂词缀（击杀永久加攻）...');
  
  const gameState = createTestGameState();
  const weapon = createTestWeapon('soul_reaper');
  gameState.player.equipment.weapon = weapon;
  
  const combatSystem = new CombatSystem(gameState);
  
  console.log(`   初始攻击力: ${CharacterSystem.getPlayerTotalStats(gameState).attack}`);
  console.log(`   装备基础攻击: ${weapon.stats.attack}`);
  
  for (let i = 0; i < 12; i++) {
    gameState.combat.active = true;
    gameState.combat.killsThisCombat = i;
    gameState.combat.enemy = { name: '测试怪' };
    
    const effects = combatSystem.applyEquipmentOnKillEffects();
    
    const currentAttack = CharacterSystem.getPlayerTotalStats(gameState).attack;
    const affix = weapon.affixes.specials[0];
    const stacks = affix.stacks || 0;
    
    if (effects.length > 0) {
      console.log(`   第${i + 1}次击杀: ${effects[0]}, 当前攻击: ${currentAttack}, 层数: ${stacks}/10`);
    } else {
      console.log(`   第${i + 1}次击杀: 无效果（已达最大层数）, 当前攻击: ${currentAttack}, 层数: ${stacks}/10`);
    }
  }
  
  const finalAttack = CharacterSystem.getPlayerTotalStats(gameState).attack;
  const expectedAttack = 10 + (20 + 15) + 2 * 10;
  
  console.log(`   最终攻击力: ${finalAttack} (预期: ${expectedAttack})`);
  
  if (finalAttack === expectedAttack) {
    console.log('   ✓ 噬魂词缀测试通过！\n');
    return true;
  } else {
    console.log(`   ❌ 噬魂词缀测试失败！预期 ${expectedAttack}，实际 ${finalAttack}\n`);
    return false;
  }
}

function testWolfPack() {
  console.log('2. 测试狼王词缀（击杀本场战斗加伤）...');
  
  const gameState = createTestGameState();
  const weapon = createTestWeapon('wolf_pack');
  gameState.player.equipment.weapon = weapon;
  
  const combatSystem = new CombatSystem(gameState);
  
  console.log(`   基础攻击力: ${CharacterSystem.getPlayerTotalStats(gameState).attack}`);
  
  for (let i = 0; i < 7; i++) {
    gameState.combat.active = true;
    gameState.combat.killsThisCombat = i;
    
    const boost = combatSystem.getEquipmentDamageBoost();
    const expectedStacks = Math.min(5, i);
    const expectedBoost = expectedStacks * 0.1;
    
    console.log(`   击杀${i}次: 伤害加成 +${Math.round(boost * 100)}% (预期: +${Math.round(expectedBoost * 100)}%)`);
    
    if (Math.abs(boost - expectedBoost) > 0.001) {
      console.log(`   ❌ 狼王词缀测试失败！\n`);
      return false;
    }
  }
  
  console.log('   ✓ 狼王词缀测试通过！\n');
  return true;
}

function testBloodMoonLifesteal() {
  console.log('3. 测试血月词缀（吸血效果）...');
  
  const gameState = createTestGameState();
  const weapon = createTestWeapon('blood_moon');
  gameState.player.equipment.weapon = weapon;
  
  gameState.player.stats.currentHp = 50;
  
  const combatSystem = new CombatSystem(gameState);
  
  const testDamage = 100;
  const result = combatSystem.applyEquipmentOnHitEffects(testDamage, true);
  
  let lifestealFound = false;
  result.extraEffects.forEach(effect => {
    if (effect.type === 'lifesteal' && effect.amount > 0) {
      lifestealFound = true;
      console.log(`   造成${testDamage}点伤害，吸血${effect.amount}点（预期约30点）`);
    }
  });
  
  if (lifestealFound) {
    console.log('   ✓ 血月吸血效果测试通过！\n');
    return true;
  } else {
    console.log('   ❌ 血月吸血效果测试失败！未检测到吸血\n');
    return false;
  }
}

function testBloodMoonDamageBoost() {
  console.log('4. 测试血月词缀（低血量加伤）...');
  
  const gameState = createTestGameState();
  const weapon = createTestWeapon('blood_moon');
  gameState.player.equipment.weapon = weapon;
  
  const combatSystem = new CombatSystem(gameState);
  
  const testCases = [
    { hpPercent: 1.0, desc: '满血', expectedBoost: 0 },
    { hpPercent: 0.7, desc: '70%血量', expectedBoost: 0.09 },
    { hpPercent: 0.5, desc: '半血', expectedBoost: 0.15 },
    { hpPercent: 0.2, desc: '20%血量', expectedBoost: 0.24 },
    { hpPercent: 0.05, desc: '5%血量', expectedBoost: 0.285 }
  ];
  
  let allPassed = true;
  
  testCases.forEach(testCase => {
    gameState.player.stats.currentHp = Math.floor(gameState.player.stats.maxHp * testCase.hpPercent);
    
    const boost = combatSystem.getEquipmentDamageBoost();
    const expectedBoost = (1 - testCase.hpPercent) * 0.3;
    
    console.log(`   ${testCase.desc}: 伤害加成 +${Math.round(boost * 100)}% (预期: +${Math.round(expectedBoost * 100)}%)`);
    
    if (Math.abs(boost - expectedBoost) > 0.01) {
      allPassed = false;
    }
  });
  
  if (allPassed) {
    console.log('   ✓ 血月低血量加伤测试通过！\n');
    return true;
  } else {
    console.log('   ❌ 血月低血量加伤测试失败！\n');
    return false;
  }
}

function runAllTests() {
  try {
    const results = [];
    results.push(testSoulReaper());
    results.push(testWolfPack());
    results.push(testBloodMoonLifesteal());
    results.push(testBloodMoonDamageBoost());
    
    const passed = results.filter(r => r).length;
    const total = results.length;
    
    console.log(`=== 测试完成: ${passed}/${total} 通过 ===`);
    
    if (passed === total) {
      console.log('🎉 所有测试通过！');
    } else {
      console.log(`⚠️  ${total - passed} 个测试失败`);
    }
    
    return passed === total;
  } catch (error) {
    console.error('❌ 测试失败:', error);
    console.error(error.stack);
    return false;
  }
}

function testIntegrationWithUI() {
  console.log('5. 集成测试：击杀后属性面板实时更新...');
  
  const gameState = createTestGameState();
  const weapon = createTestWeapon('soul_reaper');
  gameState.player.equipment.weapon = weapon;
  
  const combatSystem = new CombatSystem(gameState);
  
  const initialAttack = CharacterSystem.getPlayerTotalStats(gameState).attack;
  console.log(`   初始攻击力（面板显示）: ${initialAttack}`);
  
  gameState.combat.active = true;
  gameState.combat.killsThisCombat = 0;
  gameState.combat.enemy = { name: '哥布林', maxHp: 50, currentHp: 50 };
  
  const killEffects = combatSystem.applyEquipmentOnKillEffects();
  const attackAfterKill1 = CharacterSystem.getPlayerTotalStats(gameState).attack;
  
  console.log(`   第1次击杀后攻击力（面板显示）: ${attackAfterKill1}`);
  console.log(`   战斗日志: ${killEffects[0]}`);
  
  if (attackAfterKill1 !== initialAttack + 2) {
    console.log(`   ❌ 集成测试失败！攻击力未正确更新`);
    return false;
  }
  
  for (let i = 1; i < 5; i++) {
    gameState.combat.killsThisCombat = i;
    combatSystem.applyEquipmentOnKillEffects();
  }
  
  const attackAfter5Kills = CharacterSystem.getPlayerTotalStats(gameState).attack;
  console.log(`   5次击杀后攻击力（面板显示）: ${attackAfter5Kills}`);
  
  if (attackAfter5Kills !== initialAttack + 10) {
    console.log(`   ❌ 集成测试失败！5次击杀后攻击力应为 ${initialAttack + 10}，实际 ${attackAfter5Kills}`);
    return false;
  }
  
  console.log(`   ✓ 集成测试通过！击杀后属性正确反映在面板计算中\n`);
  return true;
}

function runAllTests() {
  try {
    const results = [];
    results.push(testSoulReaper());
    results.push(testWolfPack());
    results.push(testBloodMoonLifesteal());
    results.push(testBloodMoonDamageBoost());
    results.push(testIntegrationWithUI());
    
    const passed = results.filter(r => r).length;
    const total = results.length;
    
    console.log(`=== 测试完成: ${passed}/${total} 通过 ===`);
    
    if (passed === total) {
      console.log('🎉 所有测试通过！');
    } else {
      console.log(`⚠️  ${total - passed} 个测试失败`);
    }
    
    return passed === total;
  } catch (error) {
    console.error('❌ 测试失败:', error);
    console.error(error.stack);
    return false;
  }
}

if (typeof window !== 'undefined') {
  window.runKillAffixTests = runAllTests;
  console.log('击杀词缀效果测试脚本已加载。');
  console.log('在控制台输入 runKillAffixTests() 运行测试。');
}
