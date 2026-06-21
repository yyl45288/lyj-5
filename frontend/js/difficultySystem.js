const DIFFICULTY_LEVELS = {
  VERY_EASY: 'very_easy',
  EASY: 'easy',
  NORMAL: 'normal',
  HARD: 'hard',
  VERY_HARD: 'very_hard',
  EXTREME: 'extreme'
};

const DIFFICULTY_DATA = {
  [DIFFICULTY_LEVELS.VERY_EASY]: {
    id: DIFFICULTY_LEVELS.VERY_EASY,
    name: '轻松',
    icon: '🌱',
    color: '#2ECC71',
    enemyHpMod: 0.7,
    enemyAtkMod: 0.7,
    enemyDefMod: 0.7,
    dropRateMod: 1.3,
    rareDropMod: 1.5,
    eliteChanceMod: 0.3,
    expMod: 0.8
  },
  [DIFFICULTY_LEVELS.EASY]: {
    id: DIFFICULTY_LEVELS.EASY,
    name: '简单',
    icon: '🌿',
    color: '#27AE60',
    enemyHpMod: 0.85,
    enemyAtkMod: 0.85,
    enemyDefMod: 0.85,
    dropRateMod: 1.15,
    rareDropMod: 1.2,
    eliteChanceMod: 0.6,
    expMod: 0.9
  },
  [DIFFICULTY_LEVELS.NORMAL]: {
    id: DIFFICULTY_LEVELS.NORMAL,
    name: '普通',
    icon: '⚖️',
    color: '#F39C12',
    enemyHpMod: 1.0,
    enemyAtkMod: 1.0,
    enemyDefMod: 1.0,
    dropRateMod: 1.0,
    rareDropMod: 1.0,
    eliteChanceMod: 1.0,
    expMod: 1.0
  },
  [DIFFICULTY_LEVELS.HARD]: {
    id: DIFFICULTY_LEVELS.HARD,
    name: '困难',
    icon: '🔥',
    color: '#E67E22',
    enemyHpMod: 1.2,
    enemyAtkMod: 1.15,
    enemyDefMod: 1.15,
    dropRateMod: 0.9,
    rareDropMod: 0.85,
    eliteChanceMod: 1.5,
    expMod: 1.15
  },
  [DIFFICULTY_LEVELS.VERY_HARD]: {
    id: DIFFICULTY_LEVELS.VERY_HARD,
    name: '极难',
    icon: '💀',
    color: '#E74C3C',
    enemyHpMod: 1.4,
    enemyAtkMod: 1.35,
    enemyDefMod: 1.3,
    dropRateMod: 0.8,
    rareDropMod: 0.7,
    eliteChanceMod: 2.0,
    expMod: 1.3
  },
  [DIFFICULTY_LEVELS.EXTREME]: {
    id: DIFFICULTY_LEVELS.EXTREME,
    name: '炼狱',
    icon: '👹',
    color: '#8E44AD',
    enemyHpMod: 1.7,
    enemyAtkMod: 1.6,
    enemyDefMod: 1.5,
    dropRateMod: 0.7,
    rareDropMod: 0.55,
    eliteChanceMod: 3.0,
    expMod: 1.5
  }
};

class DifficultySystem {
  static createEmptyDifficultyState() {
    return {
      currentDifficulty: DIFFICULTY_LEVELS.NORMAL,
      difficultyScore: 0,
      history: {
        totalKills: 0,
        totalFloors: 0,
        highestFloor: 0,
        averageHpPercent: 1.0,
        gamesPlayed: 0
      },
      currentFloorStats: {
        killsThisFloor: 0,
        damageTaken: 0,
        damageDealt: 0,
        itemsFound: 0
      },
      eliteEventTriggered: false,
      lastUpdateTime: Date.now()
    };
  }

  static calculateDifficultyScore(gameState, leaderboardAvg = 0) {
    const player = gameState.player;
    const floor = gameState.dungeon?.floor || 1;
    const kills = gameState.kills || 0;
    const totalStats = CharacterSystem.getPlayerTotalStats(gameState);
    const hpPercent = player.stats.currentHp / totalStats.maxHp;

    let score = 0;

    const floorFactor = Math.min(floor * 8, 80);
    score += floorFactor;

    const killsFactor = Math.min(kills * 1.5, 40);
    score += killsFactor;

    const levelFactor = Math.min(player.stats.level * 3, 30);
    score += levelFactor;

    const hpFactor = (1 - hpPercent) * 25;
    score -= hpFactor;

    const currentScore = gameState.score || 0;
    if (leaderboardAvg > 0) {
      const scoreRatio = currentScore / leaderboardAvg;
      if (scoreRatio > 1.5) {
        score += 20;
      } else if (scoreRatio > 1.2) {
        score += 10;
      } else if (scoreRatio < 0.5) {
        score -= 15;
      } else if (scoreRatio < 0.7) {
        score -= 8;
      }
    }

    const comboKills = gameState.comboKills || 0;
    if (comboKills >= 10) {
      score += 10;
    } else if (comboKills >= 5) {
      score += 5;
    }

    const difficultyState = gameState.difficultyState;
    if (difficultyState && difficultyState.history) {
      const history = difficultyState.history;
      const hasHistory = history.highestFloor > 0 || history.totalKills > 0 || history.gamesPlayed > 0;
      if (hasHistory) {
        const gamesPlayed = Math.max(1, history.gamesPlayed);
        const avgFloor = history.highestFloor / gamesPlayed;
        
        const floorHistoryFactor = Math.min(avgFloor * 4, 30);
        score += floorHistoryFactor;

        const avgKills = history.totalKills / gamesPlayed;
        const killsHistoryFactor = Math.min(avgKills * 0.3, 15);
        score += killsHistoryFactor;

        if (floor > avgFloor * 1.3) {
          score += 10;
        }
      }
    }

    return Math.max(-50, Math.min(100, score));
  }

  static getDifficultyFromScore(score) {
    if (score <= -30) return DIFFICULTY_LEVELS.VERY_EASY;
    if (score <= -10) return DIFFICULTY_LEVELS.EASY;
    if (score <= 15) return DIFFICULTY_LEVELS.NORMAL;
    if (score <= 40) return DIFFICULTY_LEVELS.HARD;
    if (score <= 70) return DIFFICULTY_LEVELS.VERY_HARD;
    return DIFFICULTY_LEVELS.EXTREME;
  }

  static async updateDifficulty(gameState) {
    if (!gameState.difficultyState) {
      gameState.difficultyState = this.createEmptyDifficultyState();
    }

    const difficultyState = gameState.difficultyState;

    let leaderboardAvg = 0;
    try {
      const result = await this.getLeaderboardAverage();
      leaderboardAvg = result.average || 0;
    } catch (e) {
      console.warn('Failed to get leaderboard average:', e);
    }

    const score = this.calculateDifficultyScore(gameState, leaderboardAvg);
    difficultyState.difficultyScore = score;
    difficultyState.currentDifficulty = this.getDifficultyFromScore(score);
    difficultyState.lastUpdateTime = Date.now();

    return {
      difficulty: difficultyState.currentDifficulty,
      score: score,
      data: DIFFICULTY_DATA[difficultyState.currentDifficulty]
    };
  }

  static getCurrentDifficultyData(gameState) {
    if (!gameState.difficultyState) {
      return DIFFICULTY_DATA[DIFFICULTY_LEVELS.NORMAL];
    }
    return DIFFICULTY_DATA[gameState.difficultyState.currentDifficulty] || DIFFICULTY_DATA[DIFFICULTY_LEVELS.NORMAL];
  }

  static applyDifficultyToEnemy(enemy, gameState) {
    const diffData = this.getCurrentDifficultyData(gameState);
    const modifiedEnemy = { ...enemy };

    modifiedEnemy.maxHp = Math.floor(enemy.maxHp * diffData.enemyHpMod);
    modifiedEnemy.currentHp = Math.floor(enemy.currentHp * diffData.enemyHpMod);
    modifiedEnemy.attack = Math.floor(enemy.attack * diffData.enemyAtkMod);
    modifiedEnemy.defense = Math.floor(enemy.defense * diffData.enemyDefMod);
    modifiedEnemy.expReward = Math.floor(enemy.expReward * diffData.expMod);
    modifiedEnemy.dropRate = Math.min(0.95, enemy.dropRate * diffData.dropRateMod);

    if (!modifiedEnemy.originalStats) {
      modifiedEnemy.originalStats = {
        maxHp: enemy.maxHp,
        attack: enemy.attack,
        defense: enemy.defense
      };
    }

    return modifiedEnemy;
  }

  static getAdjustedDropRate(baseDropRate, gameState, isRare = false) {
    const diffData = this.getCurrentDifficultyData(gameState);
    const mod = isRare ? diffData.rareDropMod : diffData.dropRateMod;
    return Math.max(0.05, Math.min(0.95, baseDropRate * mod));
  }

  static getAdjustedEliteChance(baseChance, gameState) {
    const diffData = this.getCurrentDifficultyData(gameState);
    return Math.max(0.01, Math.min(0.8, baseChance * diffData.eliteChanceMod));
  }

  static shouldTriggerEliteEvent(gameState) {
    const floor = gameState.dungeon.floor;
    const baseChance = 0.05 + floor * 0.01;
    const adjustedChance = this.getAdjustedEliteChance(baseChance, gameState);

    const difficultyState = gameState.difficultyState;
    if (difficultyState && difficultyState.eliteEventTriggered) {
      return false;
    }

    return Math.random() < adjustedChance;
  }

  static generateEliteEnemy(baseEnemy, gameState) {
    const eliteMods = {
      hpMod: 2.0,
      atkMod: 1.5,
      defMod: 1.5,
      expMod: 2.5,
      dropMod: 2.0
    };

    const eliteEnemy = {
      ...baseEnemy,
      id: `elite_${baseEnemy.id}_${Date.now()}`,
      name: `精英${baseEnemy.name}`,
      icon: `💎${baseEnemy.icon}`,
      isElite: true,
      maxHp: Math.floor(baseEnemy.maxHp * eliteMods.hpMod),
      currentHp: Math.floor(baseEnemy.maxHp * eliteMods.hpMod),
      attack: Math.floor(baseEnemy.attack * eliteMods.atkMod),
      defense: Math.floor(baseEnemy.defense * eliteMods.defMod),
      expReward: Math.floor(baseEnemy.expReward * eliteMods.expMod),
      dropRate: Math.min(1.0, baseEnemy.dropRate * eliteMods.dropMod),
      goldReward: baseEnemy.goldReward ? Math.floor(baseEnemy.goldReward * 2) : undefined
    };

    return eliteEnemy;
  }

  static updateFloorStats(gameState, eventType, value = 1) {
    if (!gameState.difficultyState) {
      gameState.difficultyState = this.createEmptyDifficultyState();
    }

    const stats = gameState.difficultyState.currentFloorStats;
    switch (eventType) {
      case 'kill':
        stats.killsThisFloor += value;
        break;
      case 'damage_taken':
        stats.damageTaken += value;
        break;
      case 'damage_dealt':
        stats.damageDealt += value;
        break;
      case 'item_found':
        stats.itemsFound += value;
        break;
    }
  }

  static updateDifficultyScoreRealtime(gameState, eventType, value = 1) {
    if (!gameState.difficultyState) {
      gameState.difficultyState = this.createEmptyDifficultyState();
    }

    const diffState = gameState.difficultyState;
    let scoreDelta = 0;

    switch (eventType) {
      case 'kill':
        scoreDelta = value * 0.5;
        break;
      case 'damage_taken':
        scoreDelta = -value * 0.1;
        break;
      case 'damage_dealt':
        scoreDelta = value * 0.02;
        break;
      case 'combo':
        scoreDelta = value * 0.3;
        break;
      case 'level_up':
        scoreDelta = value * 3;
        break;
    }

    diffState.difficultyScore = Math.max(-50, Math.min(100, diffState.difficultyScore + scoreDelta));
    diffState.currentDifficulty = this.getDifficultyFromScore(diffState.difficultyScore);
    diffState.lastUpdateTime = Date.now();

    this.updateFloorStats(gameState, eventType, value);

    return {
      difficulty: diffState.currentDifficulty,
      score: diffState.difficultyScore,
      scoreDelta: scoreDelta
    };
  }

  static resetFloorStats(gameState) {
    if (!gameState.difficultyState) return;
    gameState.difficultyState.currentFloorStats = {
      killsThisFloor: 0,
      damageTaken: 0,
      damageDealt: 0,
      itemsFound: 0
    };
    gameState.difficultyState.eliteEventTriggered = false;
  }

  static updateHistory(gameState, gameOver = false) {
    if (!gameState.difficultyState) return;

    const history = gameState.difficultyState.history;
    const floor = gameState.dungeon?.floor || 1;
    const kills = gameState.kills || 0;

    if (gameOver) {
      history.totalKills += kills;
      history.gamesPlayed++;
    }

    history.totalFloors = Math.max(history.totalFloors, floor);
    history.highestFloor = Math.max(history.highestFloor, floor);

    this.saveDifficultyHistory(gameState.difficultyState);
  }

  static saveDifficultyHistory(difficultyState) {
    try {
      const historyData = {
        history: difficultyState.history,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem('roguelike_difficulty_history', JSON.stringify(historyData));
    } catch (e) {
      console.warn('Failed to save difficulty history:', e);
    }
  }

  static loadDifficultyHistory() {
    try {
      const data = localStorage.getItem('roguelike_difficulty_history');
      if (data) {
        return JSON.parse(data).history;
      }
    } catch (e) {
      console.warn('Failed to load difficulty history:', e);
    }
    return null;
  }

  static loadHistoryToGameState(gameState) {
    if (!gameState.difficultyState) {
      gameState.difficultyState = this.createEmptyDifficultyState();
    }

    const savedHistory = this.loadDifficultyHistory();
    if (savedHistory) {
      gameState.difficultyState.history = { ...savedHistory };
      return true;
    }
    return false;
  }

  static async getLeaderboardAverage() {
    try {
      const response = await fetch('/api/difficulty/leaderboard-avg');
      const data = await response.json();
      return data;
    } catch (e) {
      console.warn('Failed to get leaderboard average:', e);
      return { success: false, average: 0 };
    }
  }

  static async submitDifficultyData(gameState) {
    try {
      const data = {
        floor: gameState.dungeon.floor,
        kills: gameState.kills || 0,
        score: gameState.score || 0,
        difficulty: gameState.difficultyState?.currentDifficulty || DIFFICULTY_LEVELS.NORMAL,
        difficultyScore: gameState.difficultyState?.difficultyScore || 0
      };

      const response = await fetch('/api/difficulty/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      return await response.json();
    } catch (e) {
      console.warn('Failed to submit difficulty data:', e);
      return { success: false };
    }
  }

  static getDifficultyDescription(gameState) {
    const diffData = this.getCurrentDifficultyData(gameState);
    const score = gameState.difficultyState?.difficultyScore || 0;

    return {
      ...diffData,
      score,
      description: this.getDifficultyDescriptionText(diffData.id)
    };
  }

  static getDifficultyDescriptionText(difficultyId) {
    const descriptions = {
      [DIFFICULTY_LEVELS.VERY_EASY]: '难度较低，适合新手探索。敌人较弱，掉落丰厚。',
      [DIFFICULTY_LEVELS.EASY]: '难度偏低，敌人稍有加强，掉落依然不错。',
      [DIFFICULTY_LEVELS.NORMAL]: '标准难度，平衡的挑战与奖励。',
      [DIFFICULTY_LEVELS.HARD]: '难度较高，敌人明显增强，需要一定策略。',
      [DIFFICULTY_LEVELS.VERY_HARD]: '难度极高，敌人非常强大，精英怪频繁出现。',
      [DIFFICULTY_LEVELS.EXTREME]: '炼狱级难度，只有最强的玩家才能生存！'
    };
    return descriptions[difficultyId] || '';
  }

  static ensureGameStateCompatibility(gameState) {
    if (!gameState.difficultyState) {
      gameState.difficultyState = this.createEmptyDifficultyState();
    }

    if (!gameState.difficultyState.currentFloorStats) {
      gameState.difficultyState.currentFloorStats = {
        killsThisFloor: 0,
        damageTaken: 0,
        damageDealt: 0,
        itemsFound: 0
      };
    }

    if (gameState.difficultyState.eliteEventTriggered === undefined) {
      gameState.difficultyState.eliteEventTriggered = false;
    }

    if (!gameState.difficultyState.history) {
      gameState.difficultyState.history = {
        totalKills: 0,
        totalFloors: 0,
        highestFloor: 0,
        averageHpPercent: 1.0,
        gamesPlayed: 0
      };

      const savedHistory = this.loadDifficultyHistory();
      if (savedHistory) {
        gameState.difficultyState.history = savedHistory;
      }
    }

    return gameState;
  }
}
