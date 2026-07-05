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
        this.themeTabs = document.getElementById('setting-theme-tabs');
        this.themeTabButtons = this.themeTabs ? this.themeTabs.querySelectorAll('.todo-tab') : [];
        this.currentTheme = 'classic';
        this.colorThemeSelect = document.getElementById('setting-color-theme');
        this.textAnimTabs = document.getElementById('setting-text-anim-tabs');
        this.textAnimTabButtons = this.textAnimTabs ? this.textAnimTabs.querySelectorAll('.todo-tab') : [];
        this.currentTextAnim = 'fade';
        this.glowEffectTabs = document.getElementById('setting-glow-effect-tabs');
        this.glowEffectTabButtons = this.glowEffectTabs ? this.glowEffectTabs.querySelectorAll('.todo-tab') : [];
        this.currentGlowEffect = true;
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
            this.colorThemeSelect, this.autoStartToggle
        ];
        
        inputs.forEach(input => {
            if (input) input.addEventListener('change', () => this.save());
        });

        // Theme tabs events - 컨테이너 어디를 클릭해도 토글
        if (this.themeTabs) {
            this.themeTabs.style.cursor = 'pointer';
            this.themeTabs.addEventListener('click', () => {
                this.currentTheme = this.currentTheme === 'classic' ? 'minimal' : 'classic';
                this.themeTabs.setAttribute('data-active', this.currentTheme);
                this.themeTabButtons.forEach(b => {
                    b.classList.toggle('active', b.getAttribute('data-value') === this.currentTheme);
                });
                this.save();
            });
        }

        // Text Anim tabs events
        if (this.textAnimTabs) {
            this.textAnimTabs.style.cursor = 'pointer';
            this.textAnimTabs.addEventListener('click', () => {
                this.currentTextAnim = this.currentTextAnim === 'fade' ? 'slide' : 'fade';
                this.textAnimTabs.setAttribute('data-active', this.currentTextAnim);
                this.textAnimTabButtons.forEach(b => {
                    b.classList.toggle('active', b.getAttribute('data-value') === this.currentTextAnim);
                });
                this.save();
            });
        }

        // Glow Effect tabs events
        if (this.glowEffectTabs) {
            this.glowEffectTabs.style.cursor = 'pointer';
            this.glowEffectTabs.addEventListener('click', () => {
                this.currentGlowEffect = !this.currentGlowEffect;
                const value = this.currentGlowEffect ? 'on' : 'off';
                this.glowEffectTabs.setAttribute('data-active', value);
                this.glowEffectTabButtons.forEach(b => {
                    b.classList.toggle('active', b.getAttribute('data-value') === value);
                });
                this.save();
            });
        }
    }
    
    open() {
        // Load current settings into form
        const settings = Storage.getSettings();
        
        // Convert seconds to minutes for display
        this.focusTimeInput.value = settings.focusTime / 60;
        this.shortBreakTimeInput.value = settings.shortBreakTime / 60;
        this.longBreakTimeInput.value = settings.longBreakTime / 60;
        
        this.intervalInput.value = settings.longBreakInterval;
        
        // Theme tabs load
        this.currentTheme = settings.theme || 'classic';
        if (this.themeTabs) {
            this.themeTabs.setAttribute('data-active', this.currentTheme);
            this.themeTabButtons.forEach(b => {
                b.classList.toggle('active', b.getAttribute('data-value') === this.currentTheme);
            });
        }
        
        this.colorThemeSelect.value = settings.colorTheme || 'default';
        
        // Text Anim tabs load
        this.currentTextAnim = settings.textAnimation || 'fade';
        if (this.textAnimTabs) {
            this.textAnimTabs.setAttribute('data-active', this.currentTextAnim);
            this.textAnimTabButtons.forEach(b => {
                b.classList.toggle('active', b.getAttribute('data-value') === this.currentTextAnim);
            });
        }
        
        // Glow Effect tabs load
        this.currentGlowEffect = settings.glowEffect !== undefined ? settings.glowEffect : true;
        if (this.glowEffectTabs) {
            const value = this.currentGlowEffect ? 'on' : 'off';
            this.glowEffectTabs.setAttribute('data-active', value);
            this.glowEffectTabButtons.forEach(b => {
                b.classList.toggle('active', b.getAttribute('data-value') === value);
            });
        }
        
        this.autoStartToggle.checked = settings.autoStart;
        
        this.overlay.classList.add('active');
    }
    
    close() {
        this.overlay.classList.remove('active');
    }
    
    save() {
        let parsedInterval = parseInt(this.intervalInput.value, 10);
        if (parsedInterval >= 7) {
            parsedInterval = 6;
            this.intervalInput.value = 6;
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
            theme: this.currentTheme,
            colorTheme: this.colorThemeSelect.value,
            textAnimation: this.currentTextAnim,
            glowEffect: this.currentGlowEffect,
            autoStart: this.autoStartToggle.checked
        };
        
        Storage.saveSettings(settings);
        if (this.onSave) {
            this.onSave(settings);
        }
    }
}
