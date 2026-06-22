document.addEventListener('DOMContentLoaded', () => {
    leaderboardManager.init();
    game.init();

    window.addEventListener('beforeunload', () => {
        leaderboardManager.destroy();
    });

    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            if (leaderboardManager.sseClient && !leaderboardManager.sseClient.isConnectedToServer()) {
                leaderboardManager.sseClient.reconnect();
            }
        }
    });
});
