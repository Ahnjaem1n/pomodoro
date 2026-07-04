class Timer {
    constructor(onTick, onComplete) {
        this.onTick = onTick;
        this.onComplete = onComplete;
        
        this.totalTime = 0;
        this.timeLeft = 0;
        this.remainingMs = 0;
        this.isRunning = false;
        this.endTime = null;
        this.animFrameId = null;
        
        // Handle background/foreground sync
        document.addEventListener('visibilitychange', () => this.handleVisibilityChange());
    }
    
    start(time) {
        if (!this.isRunning) {
            this.totalTime = (this.remainingMs === 0 || time !== undefined) ? time : this.totalTime;
            this.remainingMs = this.remainingMs === 0 ? this.totalTime * 1000 : this.remainingMs;
            this.isRunning = true;
            this.endTime = Date.now() + this.remainingMs;
            
            const loop = () => {
                this.tick();
                if (this.isRunning) {
                    this.animFrameId = requestAnimationFrame(loop);
                }
            };
            this.animFrameId = requestAnimationFrame(loop);
        }
    }
    
    pause() {
        if (this.isRunning) {
            this.isRunning = false;
            cancelAnimationFrame(this.animFrameId);
            this.remainingMs = Math.max(0, this.endTime - Date.now());
            this.timeLeft = Math.ceil(this.remainingMs / 1000);
        }
    }
    
    reset(time) {
        this.pause();
        this.totalTime = time !== undefined ? time : this.totalTime;
        this.remainingMs = this.totalTime * 1000;
        this.timeLeft = this.totalTime;
        this.onTick(this.timeLeft, this.totalTime, 1);
    }
    
    tick() {
        if (!this.isRunning) return;
        
        const now = Date.now();
        this.remainingMs = Math.max(0, this.endTime - now);
        this.timeLeft = Math.ceil(this.remainingMs / 1000);
        const exactProgress = this.totalTime > 0 ? this.remainingMs / (this.totalTime * 1000) : 0;
        
        this.onTick(this.timeLeft, this.totalTime, exactProgress);
        
        if (this.remainingMs <= 0) {
            this.pause();
            this.onComplete();
        }
    }
    
    handleVisibilityChange() {
        if (document.hidden) {
            // Backgrounded
        } else {
            // Foregrounded
            if (this.isRunning && this.endTime) {
                this.tick(); // Re-sync time immediately
            }
        }
    }
}
