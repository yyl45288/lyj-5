class StorageManager {
  static LOCAL_STORAGE_KEY = 'roguelike_save';
  static API_BASE = '/api';

  static async saveToLocal(gameState) {
    try {
      const saveData = {
        id: localStorage.getItem('roguelike_save_id') || this.generateId(),
        createdAt: localStorage.getItem('roguelike_created_at') || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        gameState: gameState
      };

      localStorage.setItem('roguelike_save_id', saveData.id);
      localStorage.setItem('roguelike_created_at', saveData.createdAt);
      localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(saveData));

      try {
        await this.saveToServer(gameState, saveData.id);
      } catch (e) {
        console.warn('Failed to save to server, saved locally only:', e);
      }

      return { success: true, saveId: saveData.id };
    } catch (error) {
      console.error('Failed to save game:', error);
      return { success: false, error: error.message };
    }
  }

  static async loadFromLocal() {
    try {
      const saveDataStr = localStorage.getItem(this.LOCAL_STORAGE_KEY);
      if (!saveDataStr) {
        return { success: false, message: 'No save found' };
      }

      const saveData = JSON.parse(saveDataStr);
      return { success: true, gameState: saveData.gameState, saveId: saveData.id };
    } catch (error) {
      console.error('Failed to load game:', error);
      return { success: false, error: error.message };
    }
  }

  static async loadFromServer(saveId) {
    try {
      const response = await fetch(`${this.API_BASE}/load?saveId=${saveId}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to load from server:', error);
      return { success: false, error: error.message };
    }
  }

  static async saveToServer(gameState, saveId = null) {
    try {
      const response = await fetch(`${this.API_BASE}/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          gameState: gameState,
          saveId: saveId
        })
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to save to server:', error);
      throw error;
    }
  }

  static hasLocalSave() {
    return localStorage.getItem(this.LOCAL_STORAGE_KEY) !== null;
  }

  static clearLocalSave() {
    localStorage.removeItem(this.LOCAL_STORAGE_KEY);
    localStorage.removeItem('roguelike_save_id');
    localStorage.removeItem('roguelike_created_at');
  }

  static async getScores() {
    try {
      const response = await fetch(`${this.API_BASE}/scores`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to get scores:', error);
      const localScores = JSON.parse(localStorage.getItem('roguelike_scores') || '{"records":[]}');
      return { success: true, scores: localScores.records };
    }
  }

  static async saveScore(score, kills, floor) {
    const record = {
      id: this.generateId(),
      score: score,
      kills: kills,
      floor: floor,
      date: new Date().toISOString()
    };

    try {
      const response = await fetch(`${this.API_BASE}/scores`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(record)
      });
      const data = await response.json();

      const localScores = JSON.parse(localStorage.getItem('roguelike_scores') || '{"records":[]}');
      localScores.records.push(record);
      localScores.records.sort((a, b) => b.score - a.score);
      localScores.records = localScores.records.slice(0, 10);
      localStorage.setItem('roguelike_scores', JSON.stringify(localScores));

      return data;
    } catch (error) {
      console.error('Failed to save score to server:', error);

      const localScores = JSON.parse(localStorage.getItem('roguelike_scores') || '{"records":[]}');
      localScores.records.push(record);
      localScores.records.sort((a, b) => b.score - a.score);
      localScores.records = localScores.records.slice(0, 10);
      localStorage.setItem('roguelike_scores', JSON.stringify(localScores));

      return { success: true, record };
    }
  }

  static generateId() {
    return `save_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
