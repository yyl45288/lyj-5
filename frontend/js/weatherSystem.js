const WEATHER_TYPES = {
  CLEAR: 'clear',
  ACID_RAIN: 'acid_rain',
  GRAVITY_ANOMALY: 'gravity_anomaly',
  EXTREME_COLD: 'extreme_cold',
  MAGMA_HEAT: 'magma_heat',
  THICK_FOG: 'thick_fog',
  THUNDERSTORM: 'thunderstorm',
  DIVINE_LIGHT: 'divine_light',
  UNDEAD_FOG: 'undead_fog'
};

const WEATHER_DATA = {
  [WEATHER_TYPES.CLEAR]: {
    id: WEATHER_TYPES.CLEAR,
    name: '晴朗',
    icon: '☀️',
    description: '地牢内天气正常，没有特殊效果。',
    color: '#FFD700',
    rarity: 0,
    effects: {
      mapClass: 'weather-clear',
      moveHpChange: 0,
      moveBlockChance: 0,
      viewRangeMod: 0,
      attackMod: 0,
      defenseMod: 0,
      critChanceMod: 0,
      enemyAttackMod: 0,
      enemyDefenseMod: 0,
      expBonus: 0,
      damageChance: 0,
      damageAmount: 0
    }
  },
  [WEATHER_TYPES.ACID_RAIN]: {
    id: WEATHER_TYPES.ACID_RAIN,
    name: '酸雨',
    icon: '🌧️',
    description: '腐蚀性酸雨持续滴落，每步损失少量生命，防御力下降。',
    color: '#27AE60',
    rarity: 0.12,
    effects: {
      mapClass: 'weather-acid-rain',
      moveHpChange: -2,
      moveBlockChance: 0,
      viewRangeMod: 0,
      attackMod: 0,
      defenseMod: -2,
      critChanceMod: 0,
      enemyAttackMod: 0,
      enemyDefenseMod: -1,
      expBonus: 0,
      damageChance: 0,
      damageAmount: 0
    }
  },
  [WEATHER_TYPES.GRAVITY_ANOMALY]: {
    id: WEATHER_TYPES.GRAVITY_ANOMALY,
    name: '重力异常',
    icon: '🌀',
    description: '空间扭曲导致重力异常，移动有概率失败，攻击力下降。',
    color: '#9B59B6',
    rarity: 0.10,
    effects: {
      mapClass: 'weather-gravity',
      moveHpChange: 0,
      moveBlockChance: 0.15,
      viewRangeMod: 0,
      attackMod: -3,
      defenseMod: 0,
      critChanceMod: 0,
      enemyAttackMod: -1,
      enemyDefenseMod: 0,
      expBonus: 0,
      damageChance: 0,
      damageAmount: 0
    }
  },
  [WEATHER_TYPES.EXTREME_COLD]: {
    id: WEATHER_TYPES.EXTREME_COLD,
    name: '极寒',
    icon: '❄️',
    description: '刺骨寒气侵袭，暴击率降低，移动有概率被冰冻停滞。',
    color: '#3498DB',
    rarity: 0.10,
    effects: {
      mapClass: 'weather-extreme-cold',
      moveHpChange: -1,
      moveBlockChance: 0.10,
      viewRangeMod: 0,
      attackMod: 0,
      defenseMod: 0,
      critChanceMod: -0.05,
      enemyAttackMod: 0,
      enemyDefenseMod: 1,
      expBonus: 0,
      damageChance: 0,
      damageAmount: 0
    }
  },
  [WEATHER_TYPES.MAGMA_HEAT]: {
    id: WEATHER_TYPES.MAGMA_HEAT,
    name: '熔岩热浪',
    icon: '🔥',
    description: '地热涌动，每步灼伤，但攻击力大幅提升。',
    color: '#E74C3C',
    rarity: 0.08,
    effects: {
      mapClass: 'weather-magma-heat',
      moveHpChange: -3,
      moveBlockChance: 0,
      viewRangeMod: 0,
      attackMod: 5,
      defenseMod: -1,
      critChanceMod: 0.03,
      enemyAttackMod: 2,
      enemyDefenseMod: 0,
      expBonus: 0,
      damageChance: 0,
      damageAmount: 0
    }
  },
  [WEATHER_TYPES.THICK_FOG]: {
    id: WEATHER_TYPES.THICK_FOG,
    name: '迷雾',
    icon: '💨',
    description: '浓雾弥漫，视野范围大幅缩小。',
    color: '#7F8C8D',
    rarity: 0.12,
    effects: {
      mapClass: 'weather-thick-fog',
      moveHpChange: 0,
      moveBlockChance: 0,
      viewRangeMod: -2,
      attackMod: 0,
      defenseMod: 0,
      critChanceMod: 0,
      enemyAttackMod: 0,
      enemyDefenseMod: 1,
      expBonus: 0,
      damageChance: 0,
      damageAmount: 0
    }
  },
  [WEATHER_TYPES.THUNDERSTORM]: {
    id: WEATHER_TYPES.THUNDERSTORM,
    name: '雷电风暴',
    icon: '⚡',
    description: '雷电交加，移动有概率被雷击。暴击率提升。',
    color: '#F39C12',
    rarity: 0.08,
    effects: {
      mapClass: 'weather-thunderstorm',
      moveHpChange: 0,
      moveBlockChance: 0,
      viewRangeMod: 0,
      attackMod: 2,
      defenseMod: 0,
      critChanceMod: 0.08,
      enemyAttackMod: 1,
      enemyDefenseMod: 0,
      expBonus: 0.1,
      damageChance: 0.10,
      damageAmount: 5
    }
  },
  [WEATHER_TYPES.DIVINE_LIGHT]: {
    id: WEATHER_TYPES.DIVINE_LIGHT,
    name: '神圣光辉',
    icon: '🌿',
    description: '神圣光芒照耀，每步恢复生命，防御力提升。',
    color: '#2ECC71',
    rarity: 0.05,
    effects: {
      mapClass: 'weather-divine-light',
      moveHpChange: 3,
      moveBlockChance: 0,
      viewRangeMod: 1,
      attackMod: 0,
      defenseMod: 3,
      critChanceMod: 0.02,
      enemyAttackMod: -1,
      enemyDefenseMod: 0,
      expBonus: 0.15,
      damageChance: 0,
      damageAmount: 0
    }
  },
  [WEATHER_TYPES.UNDEAD_FOG]: {
    id: WEATHER_TYPES.UNDEAD_FOG,
    name: '亡灵之雾',
    icon: '👻',
    description: '亡灵雾气弥漫，敌人变强，但击杀经验奖励增加。',
    color: '#8E44AD',
    rarity: 0.07,
    effects: {
      mapClass: 'weather-undead-fog',
      moveHpChange: -1,
      moveBlockChance: 0,
      viewRangeMod: -1,
      attackMod: 0,
      defenseMod: -1,
      critChanceMod: 0,
      enemyAttackMod: 3,
      enemyDefenseMod: 2,
      expBonus: 0.3,
      damageChance: 0,
      damageAmount: 0
    }
  }
};

class WeatherSystem {
  static createEmptyWeather() {
    return {
      activeWeathers: [],
      weatherTimers: {}
    };
  }

  static generateWeatherForFloor(floor) {
    const weatherState = this.createEmptyWeather();

    const weatherChance = Math.min(0.25 + floor * 0.03, 0.70);
    if (Math.random() >= weatherChance) {
      return weatherState;
    }

    const availableWeathers = Object.values(WEATHER_DATA).filter(w => w.rarity > 0);
    const totalRarity = availableWeathers.reduce((sum, w) => sum + w.rarity, 0);

    const numWeathers = Math.random() < 0.15 + floor * 0.01 ? 2 : 1;
    const selectedWeathers = [];

    for (let i = 0; i < numWeathers; i++) {
      let roll = Math.random() * totalRarity;
      let selected = null;

      for (const weather of availableWeathers) {
        if (selectedWeathers.includes(weather.id)) continue;
        roll -= weather.rarity;
        if (roll <= 0) {
          selected = weather;
          break;
        }
      }

      if (selected && !selectedWeathers.includes(selected.id)) {
        selectedWeathers.push(selected.id);
        weatherState.activeWeathers.push({
          id: selected.id,
          duration: this.generateWeatherDuration(floor),
          startedAt: Date.now()
        });
        weatherState.weatherTimers[selected.id] = weatherState.activeWeathers[weatherState.activeWeathers.length - 1];
      }
    }

    return weatherState;
  }

  static generateWeatherDuration(floor) {
    const baseMoves = 30 + floor * 5;
    const variance = Math.floor(Math.random() * 20) - 10;
    return Math.max(15, baseMoves + variance);
  }

  static addWeather(weatherState, weatherId, duration = null) {
    if (!WEATHER_DATA[weatherId]) return false;
    if (weatherId === WEATHER_TYPES.CLEAR) return false;

    const existing = weatherState.activeWeathers.find(w => w.id === weatherId);
    if (existing) {
      existing.duration += duration || 20;
      existing.startedAt = Date.now();
      return { added: false, stacked: true, weather: existing };
    }

    const newWeather = {
      id: weatherId,
      duration: duration || this.generateWeatherDuration(1),
      startedAt: Date.now()
    };
    weatherState.activeWeathers.push(newWeather);
    weatherState.weatherTimers[weatherId] = newWeather;
    return { added: true, stacked: false, weather: newWeather };
  }

  static removeWeather(weatherState, weatherId) {
    const index = weatherState.activeWeathers.findIndex(w => w.id === weatherId);
    if (index === -1) return false;

    weatherState.activeWeathers.splice(index, 1);
    delete weatherState.weatherTimers[weatherId];
    return true;
  }

  static clearAllWeathers(weatherState) {
    const removed = [...weatherState.activeWeathers];
    weatherState.activeWeathers = [];
    weatherState.weatherTimers = {};
    return removed;
  }

  static tickWeatherDuration(weatherState, moves = 1) {
    const expired = [];
    for (let i = weatherState.activeWeathers.length - 1; i >= 0; i--) {
      const weather = weatherState.activeWeathers[i];
      weather.duration -= moves;
      if (weather.duration <= 0) {
        expired.push(weather.id);
        weatherState.activeWeathers.splice(i, 1);
        delete weatherState.weatherTimers[weather.id];
      }
    }
    return expired;
  }

  static hasWeather(weatherState, weatherId) {
    return weatherState.activeWeathers.some(w => w.id === weatherId);
  }

  static getCombinedEffects(weatherState) {
    const combined = {
      ...WEATHER_DATA[WEATHER_TYPES.CLEAR].effects
    };

    if (!weatherState || weatherState.activeWeathers.length === 0) {
      return combined;
    }

    for (const weather of weatherState.activeWeathers) {
      const data = WEATHER_DATA[weather.id];
      if (!data) continue;
      const eff = data.effects;

      combined.moveHpChange += eff.moveHpChange;
      combined.moveBlockChance = Math.min(0.5, combined.moveBlockChance + eff.moveBlockChance);
      combined.viewRangeMod += eff.viewRangeMod;
      combined.attackMod += eff.attackMod;
      combined.defenseMod += eff.defenseMod;
      combined.critChanceMod += eff.critChanceMod;
      combined.enemyAttackMod += eff.enemyAttackMod;
      combined.enemyDefenseMod += eff.enemyDefenseMod;
      combined.expBonus += eff.expBonus;
      combined.damageChance = Math.min(0.4, combined.damageChance + eff.damageChance);
      combined.damageAmount += eff.damageAmount;

      if (eff.mapClass && eff.mapClass !== 'weather-clear') {
        if (!combined.mapClasses) combined.mapClasses = [];
        combined.mapClasses.push(eff.mapClass);
      }
    }

    combined.critChanceMod = Math.max(-0.1, Math.min(0.2, combined.critChanceMod));
    combined.expBonus = Math.min(0.5, combined.expBonus);

    return combined;
  }

  static getActiveWeatherDescriptions(weatherState) {
    if (!weatherState || weatherState.activeWeathers.length === 0) {
      return [];
    }
    return weatherState.activeWeathers.map(w => {
      const data = WEATHER_DATA[w.id];
      return {
        id: w.id,
        name: data.name,
        icon: data.icon,
        description: data.description,
        color: data.color,
        duration: w.duration
      };
    });
  }

  static applyMoveEffects(gameState) {
    const effects = this.getCombinedEffects(gameState.weatherState);
    const player = gameState.player;
    const result = {
      hpChange: 0,
      blocked: false,
      extraDamage: 0,
      messages: []
    };

    if (effects.moveBlockChance > 0 && Math.random() < effects.moveBlockChance) {
      result.blocked = true;
      result.messages.push('⛔ 你被天气影响，无法移动！');
      return result;
    }

    if (effects.moveHpChange !== 0) {
      result.hpChange = effects.moveHpChange;
      player.stats.currentHp = Math.max(0, Math.min(
        CharacterSystem.getPlayerTotalStats(gameState).maxHp,
        player.stats.currentHp + effects.moveHpChange
      ));
      if (effects.moveHpChange > 0) {
        result.messages.push(`💚 天气效果恢复了 ${effects.moveHpChange} 点生命！`);
      } else {
        result.messages.push(`💔 天气效果造成了 ${Math.abs(effects.moveHpChange)} 点伤害！`);
      }
    }

    if (effects.damageChance > 0 && Math.random() < effects.damageChance) {
      result.extraDamage = effects.damageAmount;
      player.stats.currentHp = Math.max(0, player.stats.currentHp - effects.damageAmount);
      result.messages.push(`⚡ 闪电击中了你！造成 ${effects.damageAmount} 点伤害！`);
    }

    return result;
  }

  static applyCombatAttackMods(gameState, baseAttack, isPlayer) {
    const effects = this.getCombinedEffects(gameState.weatherState);
    if (isPlayer) {
      return Math.max(1, baseAttack + effects.attackMod);
    } else {
      return Math.max(1, baseAttack + effects.enemyAttackMod);
    }
  }

  static applyCombatDefenseMods(gameState, baseDefense, isPlayer) {
    const effects = this.getCombinedEffects(gameState.weatherState);
    if (isPlayer) {
      return Math.max(0, baseDefense + effects.defenseMod);
    } else {
      return Math.max(0, baseDefense + effects.enemyDefenseMod);
    }
  }

  static applyCritChanceMod(gameState, baseCritChance) {
    const effects = this.getCombinedEffects(gameState.weatherState);
    return Math.max(0.01, Math.min(0.5, baseCritChance + effects.critChanceMod));
  }

  static applyExpBonus(gameState, baseExp) {
    const effects = this.getCombinedEffects(gameState.weatherState);
    return Math.floor(baseExp * (1 + effects.expBonus));
  }

  static getModifiedViewRange(gameState, baseRange) {
    const effects = this.getCombinedEffects(gameState.weatherState);
    return Math.max(2, baseRange + effects.viewRangeMod);
  }

  static getWeatherMapClasses(weatherState) {
    const effects = this.getCombinedEffects(weatherState);
    return effects.mapClasses || [];
  }
}
