class SettingsModal {
    constructor(onSave) {
        this.onSave = onSave;
        this.overlay = document.getElementById('settings-modal');
        this.closeBtn = document.getElementById('btn-close-modal');
        
        // Inputs
        this.focusTimeInput = document.getElementById('setting-focus-time');
        this.shortBreakTimeInput = document.getElementById('setting-short-break');
        this.longBreakTimeInput = document.getElementById('setting-long-break');
        this.intervalInput = document.getElementById('setting-interval');
        this.themeSelect = document.getElementById('setting-theme');
        this.textAnimSelect = document.getElementById('setting-text-anim');
        this.autoStartToggle = document.getElementById('setting-autostart');
        
        this.bindEvents();
    }
    
    bindEvents() {
        this.closeBtn.addEventListener('click', () => this.close());
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) this.close();
        });
        
        // Save automatically on change/blur
        const inputs = [
            this.focusTimeInput, this.shortBreakTimeInput, 
            this.longBreakTimeInput, this.intervalInput, 
            this.themeSelect, this.textAnimSelect, this.autoStartToggle
        ];
        
        inputs.forEach(input => {
            input.addEventListener('change', () => this.save());
        });
    }
    
    open() {
        // Load current settings into form
        const settings = Storage.getSettings();
        
        // Convert seconds to minutes for display
        this.focusTimeInput.value = settings.focusTime / 60;
        this.shortBreakTimeInput.value = settings.shortBreakTime / 60;
        this.longBreakTimeInput.value = settings.longBreakTime / 60;
        
        this.intervalInput.value = settings.longBreakInterval;
        this.themeSelect.value = settings.theme;
        this.textAnimSelect.value = settings.textAnimation || 'fade';
        this.autoStartToggle.checked = settings.autoStart;
        
        this.overlay.classList.add('active');
    }
    
    close() {
        this.overlay.classList.remove('active');
    }
    
    save() {
        let parsedInterval = parseInt(this.intervalInput.value, 10);
        if (parsedInterval >= 9) {
            parsedInterval = 8;
            this.intervalInput.value = 8;
        }
        if (parsedInterval < 2) {
            parsedInterval = 2;
            this.intervalInput.value = 2;
        }

        const settings = {
            focusTime: parseInt(this.focusTimeInput.value, 10) * 60,
            shortBreakTime: parseInt(this.shortBreakTimeInput.value, 10) * 60,
            longBreakTime: parseInt(this.longBreakTimeInput.value, 10) * 60,
            longBreakInterval: parsedInterval,
            theme: this.themeSelect.value,
            textAnimation: this.textAnimSelect.value,
            autoStart: this.autoStartToggle.checked
        };
        
        Storage.saveSettings(settings);
        if (this.onSave) {
            this.onSave(settings);
        }
    }
}
