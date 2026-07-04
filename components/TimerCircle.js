class TimerCircle {
    constructor(container) {
        this.container = container;
        this.render();
    }
    
    render() {
        this.container.innerHTML = `
            <div class="timer-circle-wrapper" style="position: relative; width: 400px; height: 400px;">
                <svg width="400" height="400" viewBox="0 0 400 400" style="transform: rotate(-90deg); overflow: visible;">
                    <circle cx="200" cy="200" r="174" fill="none" stroke="var(--color-surface)" stroke-width="14" />
                    <circle id="progress-ring" cx="200" cy="200" r="174" fill="none" stroke="var(--color-accent)" stroke-width="14" 
                            stroke-linecap="round" stroke-dasharray="1093.27" stroke-dashoffset="0"
                            style="transition: stroke 0.4s ease; filter: drop-shadow(0 0 24px var(--color-accent));" />
                </svg>
                <div id="time-display" class="text-timer-classic" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: var(--color-text-primary); display: flex;">
                </div>
            </div>
        `;
        this.progressRing = document.getElementById('progress-ring');
        this.timeDisplay = document.getElementById('time-display');
        this.circumference = 2 * Math.PI * 174; // ~1093.27
    }
    
    update(timeLeft, totalTime, animClass = 'text-tick-anim', exactProgress = undefined) {
        const minutes = Math.floor(timeLeft / 60).toString().padStart(2, '0');
        const seconds = (timeLeft % 60).toString().padStart(2, '0');
        const newText = `${minutes}:${seconds}`;
        
        if (this.timeDisplay.children.length !== newText.length) {
            this.timeDisplay.innerHTML = newText.split('').map(char => `<span>${char}</span>`).join('');
        } else {
            for (let i = 0; i < newText.length; i++) {
                const span = this.timeDisplay.children[i];
                if (span.textContent !== newText[i]) {
                    span.textContent = newText[i];
                    span.classList.remove('text-tick-anim', 'text-slide-up-anim');
                    void span.offsetWidth;
                    span.classList.add(animClass);
                }
            }
        }
        
        const progress = exactProgress !== undefined ? exactProgress : timeLeft / totalTime;
        const offset = this.circumference - (progress * this.circumference);
        this.progressRing.style.strokeDashoffset = `${offset}px`;
    }
}
