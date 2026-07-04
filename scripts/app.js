document.addEventListener('DOMContentLoaded', () => {
    let settings = Storage.getSettings();
    const stats = Storage.getStats();
    if (typeof stats.cycles === 'undefined') stats.cycles = 0;
    
    // DOM Elements
    const phaseLabel = document.getElementById('phase-label');
    const toggleBtn = document.getElementById('btn-toggle');
    const resetBtn = document.getElementById('btn-reset');
    const skipBtn = document.getElementById('btn-skip');
    const statCompleted = document.getElementById('stat-completed');
    const container = document.getElementById('timer-display-container');
    const settingsBtn = document.getElementById('btn-settings');
    
    const dailyCurrentTimeEl = document.getElementById('daily-current-time');
    const dailyGoalTimeEl = document.getElementById('daily-goal-time');
    const dailyProgressFill = document.getElementById('daily-progress-fill');
    
    const btnEditGoal = document.getElementById('btn-edit-daily-goal');
    const goalEditorOverlay = document.getElementById('goal-editor-overlay');
    const goalHoursInput = document.getElementById('goal-hours-input');
    const goalMinutesInput = document.getElementById('goal-minutes-input');
    const btnSaveGoal = document.getElementById('btn-save-goal');
    const btnCancelGoal = document.getElementById('btn-cancel-goal');
    
    const hourlyChartScrollArea = document.getElementById('hourly-chart-scroll-area');
    const hourlyChartContainer = document.getElementById('hourly-chart-container');
    
    let currentPhase = 'focus'; // focus, short-break, long-break
    let pomodoroCount = 0;
    let currentRenderedHour = new Date().getHours();
    
    let timerUI = null;
    
    const cycleProgressBar = document.getElementById('cycle-progress-bar');
    const cycleCountDisplay = document.getElementById('cycle-count-display');

    const ICONS = {
        focus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path></svg>`,
        break: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line></svg>`,
        longBreak: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`
    };

    const updateCycleDisplay = () => {
        if (!cycleProgressBar || !cycleCountDisplay) return;
        
        const interval = parseInt(settings.longBreakInterval, 10);
        let currentStepIndex = 0;
        
        if (currentPhase === 'focus') {
            currentStepIndex = (pomodoroCount % interval) * 2;
        } else if (currentPhase === 'short-break') {
            currentStepIndex = (pomodoroCount % interval) * 2 - 1;
        } else if (currentPhase === 'long-break') {
            currentStepIndex = interval * 2 - 1;
        }

        let html = '';
        const totalSteps = interval * 2;

        for (let i = 0; i < totalSteps; i++) {
            const isFocus = (i % 2 === 0);
            const isLongBreak = (i === totalSteps - 1);
            
            let icon = isFocus ? ICONS.focus : (isLongBreak ? ICONS.longBreak : ICONS.break);
            
            let stepClass = 'cycle-step';
            if (i < currentStepIndex) stepClass += ' step-completed';
            else if (i === currentStepIndex) stepClass += ' step-current';
            else stepClass += ' step-pending';

            html += `<div class="${stepClass}">${icon}</div>`;
            
            if (i < totalSteps - 1) {
                let lineClass = 'cycle-line';
                if (i < currentStepIndex) lineClass += ' step-completed';
                html += `<div class="${lineClass}"></div>`;
            }
        }
        
        cycleProgressBar.innerHTML = html;
        cycleCountDisplay.textContent = `${stats.cycles} Cycles`;
    };

    // 버튼 텍스트를 자연스러운 애니메이션과 함께 교체하는 헬퍼 함수
    const setToggleText = (newText) => {
        const span = toggleBtn.querySelector('span');
        if (!span) {
            toggleBtn.innerHTML = `<span>${newText}</span>`;
            return;
        }
        // 이미 같은 텍스트면 스킵
        if (span.textContent === newText) return;

        // 1) fade out
        span.classList.remove('btn-text-in');
        span.classList.add('btn-text-out');

        // 2) 100ms 후 텍스트 교체 + fade in
        setTimeout(() => {
            span.textContent = newText;
            span.classList.remove('btn-text-out');
            span.classList.add('btn-text-in');
        }, 100);
    };
    
    const getPhaseTime = () => {
        if (currentPhase === 'focus') return settings.focusTime;
        if (currentPhase === 'short-break') return settings.shortBreakTime;
        return settings.longBreakTime;
    };

    const updateTheme = () => {
        if (timerUI && typeof timerUI.destroy === 'function') timerUI.destroy();
        container.innerHTML = ''; // Clear current UI
        if (settings.theme === 'minimal') {
            timerUI = new TimerLinear(container);
        } else {
            timerUI = new TimerCircle(container);
        }
        document.body.className = `theme-${settings.theme} phase-${currentPhase}`;
    };

    // Initial UI setup
    updateTheme();
    
    const setPhase = (phase) => {
        currentPhase = phase;
        document.body.className = `theme-${settings.theme} phase-${phase}`;
        
        let newLabel = '';
        if (phase === 'focus') newLabel = 'Focus';
        else if (phase === 'short-break') newLabel = 'Break';
        else newLabel = 'Long Break';
        
        if (phaseLabel.textContent !== newLabel) {
            phaseLabel.textContent = newLabel;
            const animClass = settings.textAnimation === 'slide' ? 'text-slide-up-anim' : 'text-tick-anim';
            phaseLabel.classList.remove('text-tick-anim', 'text-slide-up-anim');
            void phaseLabel.offsetWidth;
            phaseLabel.classList.add(animClass);
        }
        
        updateCycleDisplay();
        timer.reset(getPhaseTime());
        setToggleText('Start');
        if (timerUI && timerUI.setRunning) timerUI.setRunning(false);
        updateDailyFocus();
    };
    
    const commitFocusTime = () => {
        if (currentPhase === 'focus') {
            const sessionElapsed = timer.totalTime - timer.timeLeft;
            if (sessionElapsed > 0) {
                stats.todayFocusTime = (stats.todayFocusTime || 0) + sessionElapsed;
                
                // Track hourly focus
                if (!stats.hourlyFocus) stats.hourlyFocus = {};
                const now = new Date();
                const hourKey = `${now.getFullYear()}-${now.getMonth()+1}-${now.getDate()}-${now.getHours()}`;
                stats.hourlyFocus[hourKey] = (stats.hourlyFocus[hourKey] || 0) + sessionElapsed;
                
                Storage.saveStats(stats);
                renderHourlyChart();
            }
        }
    };
    
    const renderHourlyChart = () => {
        if (!hourlyChartScrollArea) return;
        
        let html = '';
        const now = new Date();
        // Generate past 24 hours
        for (let i = 23; i >= 0; i--) {
            const d = new Date(now.getTime() - i * 3600 * 1000);
            const hourKey = `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}-${d.getHours()}`;
            
            const focusSeconds = (stats.hourlyFocus && stats.hourlyFocus[hourKey]) ? stats.hourlyFocus[hourKey] : 0;
            const percentage = Math.min(100, (focusSeconds / 3600) * 100);
            
            const isCurrent = i === 0;
            const wrapperClass = isCurrent ? 'hourly-bar-wrapper current' : 'hourly-bar-wrapper';
            const label = d.getHours();
            
            html += `
                <div class="${wrapperClass}">
                    <div class="hourly-bar">
                        <div class="hourly-bar-fill" style="height: ${percentage}%;"></div>
                    </div>
                    <span class="hourly-bar-label">${label}</span>
                </div>
            `;
        }
        
        hourlyChartScrollArea.innerHTML = html;
        currentRenderedHour = now.getHours();
        
        setTimeout(() => {
            if (hourlyChartContainer && !hourlyChartContainer.hasScrolled) {
                hourlyChartContainer.scrollLeft = hourlyChartContainer.scrollWidth;
                hourlyChartContainer.hasScrolled = true;
            }
        }, 10);
    };
    
    const addNewHourAnimated = (newDate) => {
        if (!hourlyChartScrollArea) return;
        
        const oldFirst = hourlyChartScrollArea.firstElementChild;
        const oldLast = hourlyChartScrollArea.lastElementChild;
        
        if (oldLast) {
            oldLast.classList.remove('current');
        }
        
        const newEl = document.createElement('div');
        newEl.className = 'hourly-bar-wrapper current';
        newEl.style.width = '0px';
        newEl.style.opacity = '0';
        newEl.style.transition = 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.8s ease';
        
        newEl.innerHTML = `
            <div class="hourly-bar">
                <div class="hourly-bar-fill" style="height: 0%;"></div>
            </div>
            <span class="hourly-bar-label">${newDate.getHours()}</span>
        `;
        
        hourlyChartScrollArea.appendChild(newEl);
        
        if (oldFirst) {
            oldFirst.style.transition = 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.8s ease';
        }
        
        // Force reflow
        void hourlyChartScrollArea.offsetWidth;
        
        if (oldFirst) {
            oldFirst.style.width = '0px';
            oldFirst.style.opacity = '0';
        }
        
        newEl.style.width = 'calc(100% / 24)';
        newEl.style.opacity = '1';
        
        setTimeout(() => {
            if (oldFirst && oldFirst.parentNode === hourlyChartScrollArea) {
                hourlyChartScrollArea.removeChild(oldFirst);
            }
            newEl.style.transition = '';
            newEl.style.width = '';
            newEl.style.opacity = '';
        }, 850);
    };
    
    const updateDailyFocus = () => {
        let currentFocusSeconds = stats.todayFocusTime || 0;
        
        if (currentPhase === 'focus') {
            const sessionElapsed = timer.totalTime - timer.timeLeft;
            if (sessionElapsed > 0) {
                currentFocusSeconds += sessionElapsed;
            }
        }
        
        const goalSeconds = (settings.dailyGoal || 120) * 60;
        const hours = Math.floor(currentFocusSeconds / 3600);
        const minutes = Math.floor((currentFocusSeconds % 3600) / 60);
        
        const goalHours = Math.floor((settings.dailyGoal || 120) / 60);
        const goalMins = (settings.dailyGoal || 120) % 60;
        
        const formatTime = (h, m) => {
            return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        };
        
        const percentageValue = Math.min(100, (currentFocusSeconds / goalSeconds) * 100);
        
        if (dailyCurrentTimeEl) {
            dailyCurrentTimeEl.textContent = `${Math.floor(percentageValue)}% Completed`;
        }
        
        if (dailyGoalTimeEl) {
            dailyGoalTimeEl.textContent = `Goal: ${formatTime(goalHours, goalMins)}`;
        }
        
        if (dailyProgressFill) {
            const percentage = Math.min(100, (currentFocusSeconds / goalSeconds) * 100);
            dailyProgressFill.style.width = `${percentage}%`;
        }
        
        const statsTimeEl = document.querySelector('.stats-time');
        if (statsTimeEl) statsTimeEl.textContent = formatTime(hours, minutes);
        
        // Update current hour's bar dynamically
        if (hourlyChartScrollArea) {
            const actualHour = new Date().getHours();
            if (actualHour !== currentRenderedHour) {
                currentRenderedHour = actualHour;
                addNewHourAnimated(new Date());
            }
            
            if (currentPhase === 'focus') {
                const currentBarFill = hourlyChartScrollArea.querySelector('.hourly-bar-wrapper.current .hourly-bar-fill');
                if (currentBarFill) {
                    const now = new Date();
                    const hourKey = `${now.getFullYear()}-${now.getMonth()+1}-${now.getDate()}-${now.getHours()}`;
                    let currentHourSeconds = (stats.hourlyFocus && stats.hourlyFocus[hourKey]) ? stats.hourlyFocus[hourKey] : 0;
                    
                    const sessionElapsed = timer.totalTime - timer.timeLeft;
                    if (sessionElapsed > 0) {
                        currentHourSeconds += sessionElapsed;
                    }
                    const percentage = Math.min(100, (currentHourSeconds / 3600) * 100);
                    currentBarFill.style.height = `${percentage}%`;
                }
            }
        }
    };
    
    const nextPhase = () => {
        commitFocusTime();
        
        if (currentPhase === 'focus') {
            pomodoroCount++;
            stats.todayCompleted++;
            stats.totalCompleted++;
            Storage.saveStats(stats);
            
            if (pomodoroCount % settings.longBreakInterval === 0) {
                setPhase('long-break');
            } else {
                setPhase('short-break');
            }
        } else {
            if (currentPhase === 'long-break') {
                stats.cycles = (stats.cycles || 0) + 1;
                Storage.saveStats(stats);
            }
            setPhase('focus');
        }
        
        if (settings.autoStart) {
            timer.start();
            setToggleText('Pause');
            if (timerUI && timerUI.setRunning) timerUI.setRunning(true);
        }
    };
    
    const timer = new Timer(
        (timeLeft, totalTime, exactProgress) => {
            const animClass = settings.textAnimation === 'slide' ? 'text-slide-up-anim' : 'text-tick-anim';
            if(timerUI) timerUI.update(timeLeft, totalTime, animClass, exactProgress);
            updateDailyFocus();
        },
        () => nextPhase()
    );
    
    // Initialize Timer
    setPhase('focus');
    
    // Settings Modal Setup
    const settingsModal = new SettingsModal((newSettings) => {
        const themeChanged = settings.theme !== newSettings.theme;
        const timeChanged = 
            settings.focusTime !== newSettings.focusTime ||
            settings.shortBreakTime !== newSettings.shortBreakTime ||
            settings.longBreakTime !== newSettings.longBreakTime;
            
        settings = newSettings;
        
        if (themeChanged) {
            updateTheme();
            updateCycleDisplay(); // Refresh icons if necessary, mostly harmless
            if (timer.isRunning && timerUI && timerUI.setRunning) {
                timerUI.setRunning(true);
            }
        } else {
            // Even if theme didn't change, settings.longBreakInterval might have changed
            updateCycleDisplay();
        }
        
        if (timeChanged) {
            timer.reset(getPhaseTime());
            setToggleText('Start');
            if (timerUI && timerUI.setRunning) timerUI.setRunning(false);
        }
        
        // Ensure UI updates immediately
        const animClass = settings.textAnimation === 'slide' ? 'text-slide-up-anim' : 'text-tick-anim';
        const exactProgress = timer.totalTime > 0 ? timer.remainingMs / (timer.totalTime * 1000) : 0;
        if(timerUI) timerUI.update(timer.timeLeft, timer.totalTime, animClass, exactProgress);
        updateDailyFocus();
    });

    // Events
    toggleBtn.addEventListener('click', () => {
        if (timer.isRunning) {
            timer.pause();
            setToggleText('Resume');
            if (timerUI && timerUI.setRunning) timerUI.setRunning(false);
        } else {
            timer.start();
            setToggleText('Pause');
            if (timerUI && timerUI.setRunning) timerUI.setRunning(true);
        }
    });
    
    resetBtn.addEventListener('click', () => {
        commitFocusTime();
        timer.reset(getPhaseTime());
        setToggleText('Start');
        if (timerUI && timerUI.setRunning) timerUI.setRunning(false);
        updateDailyFocus();
    });
    
    skipBtn.addEventListener('click', () => {
        timer.pause();
        nextPhase();
    });
    
    settingsBtn.addEventListener('click', () => {
        settingsModal.open();
    });

    // Daily Goal Editing (Overlay)
    if (btnEditGoal && goalEditorOverlay) {
        btnEditGoal.addEventListener('click', () => {
            const currentGoal = settings.dailyGoal || 120;
            goalHoursInput.value = Math.floor(currentGoal / 60);
            goalMinutesInput.value = currentGoal % 60;
            goalEditorOverlay.style.display = 'flex';
        });

        btnCancelGoal.addEventListener('click', () => {
            goalEditorOverlay.style.display = 'none';
        });

        btnSaveGoal.addEventListener('click', () => {
            let h = parseInt(goalHoursInput.value, 10);
            let m = parseInt(goalMinutesInput.value, 10);
            
            if (isNaN(h) || h < 0) h = 0;
            if (isNaN(m) || m < 0) m = 0;
            if (h === 0 && m === 0) h = 1; // minimum 1 hour if 0
            
            settings.dailyGoal = (h * 60) + m;
            Storage.saveSettings(settings);
            
            goalEditorOverlay.style.display = 'none';
            updateDailyFocus();
        });
    }

    // Initialize Todo List Component
    const todoList = new TodoList();
    renderHourlyChart();

    // iOS Safari에서 :active CSS가 작동하지 않는 문제 대응
    // 터치/클릭 시 .pressing 클래스를 직접 토글하여 버튼 눌림 애니메이션 보장
    const allButtons = document.querySelectorAll('.btn-primary, .btn-icon-pill');
    allButtons.forEach(btn => {
        btn.addEventListener('touchstart', () => {
            btn.classList.add('pressing');
        }, { passive: true });
        btn.addEventListener('touchend', () => {
            setTimeout(() => btn.classList.remove('pressing'), 120);
        }, { passive: true });
        btn.addEventListener('touchcancel', () => {
            btn.classList.remove('pressing');
        }, { passive: true });
        // 마우스(데스크탑) 대응
        btn.addEventListener('mousedown', () => {
            btn.classList.add('pressing');
        });
        btn.addEventListener('mouseup', () => {
            setTimeout(() => btn.classList.remove('pressing'), 120);
        });
        btn.addEventListener('mouseleave', () => {
            btn.classList.remove('pressing');
        });
    });
});

