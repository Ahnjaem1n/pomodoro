const Storage = {
    DEFAULT_SETTINGS: {
        focusTime: 25 * 60,
        shortBreakTime: 5 * 60,
        longBreakTime: 15 * 60,
        longBreakInterval: 4,
        dailyGoal: 120, // In minutes
        autoStart: false,
        theme: 'classic', // 'classic' or 'minimal'
        colorTheme: 'default',
        textAnimation: 'fade',
        glowEffect: true
    },
    
    getSettings() {
        const stored = localStorage.getItem('pomodoro_settings');
        return stored ? { ...this.DEFAULT_SETTINGS, ...JSON.parse(stored) } : { ...this.DEFAULT_SETTINGS };
    },
    
    saveSettings(settings) {
        localStorage.setItem('pomodoro_settings', JSON.stringify(settings));
    },
    
    getStats() {
        const stored = localStorage.getItem('pomodoro_stats');
        const parsed = stored ? JSON.parse(stored) : null;
        
        const todayStr = new Date().toDateString();
        
        if (parsed) {
            if (parsed.lastDate !== todayStr) {
                parsed.todayCompleted = 0;
                parsed.todayFocusTime = 0;
                parsed.hourlyFocus = {};
                parsed.lastDate = todayStr;
            }
            if (typeof parsed.todayFocusTime === 'undefined') parsed.todayFocusTime = 0;
            if (typeof parsed.hourlyFocus === 'undefined') parsed.hourlyFocus = {};
            return parsed;
        }
        return { todayCompleted: 0, totalCompleted: 0, todayFocusTime: 0, hourlyFocus: {}, lastDate: todayStr };
    },
    
    saveStats(stats) {
        localStorage.setItem('pomodoro_stats', JSON.stringify(stats));
    },
    
    getTodos() {
        const stored = localStorage.getItem('pomodoro_todos');
        return stored ? JSON.parse(stored) : [];
    },
    
    saveTodos(todos) {
        localStorage.setItem('pomodoro_todos', JSON.stringify(todos));
    }
};
