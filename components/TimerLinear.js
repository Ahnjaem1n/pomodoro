class TimerLinear {
    constructor(container) {
        this.container = container;
        this.particles = [];
        this.animFrameId = null;
        this.lastProgress = 1;
        this.render();
        this._startParticleLoop();
    }
    
    render() {
        this.container.innerHTML = `
            <div class="timer-linear-wrapper" style="width: 100%; display: flex; flex-direction: column; align-items: flex-start;">
                <div id="time-display-minimal" class="text-timer-minimal" style="color: var(--color-text-primary); margin-bottom: 1rem; display: flex;">
                </div>
                <div id="progress-bar-track" style="width: 100%; height: 12px; background: var(--color-surface); border-radius: 6px; position: relative; overflow: visible;">
                    <div id="progress-bar" style="height: 100%; width: 100%; background: var(--color-accent); border-radius: 6px; transition: background-color 0.4s ease; box-shadow: 0 0 32px var(--color-accent);"></div>
                    <canvas id="particle-canvas" style="position: absolute; top: 50%; left: 0; transform: translateY(-50%); pointer-events: none; z-index: 10;"></canvas>
                </div>
            </div>
        `;
        this.timeDisplay = document.getElementById('time-display-minimal');
        this.progressBar = document.getElementById('progress-bar');
        this.canvas = document.getElementById('particle-canvas');
        this.ctx = this.canvas.getContext('2d');
        this._resizeCanvas();
    }

    _resizeCanvas() {
        const track = document.getElementById('progress-bar-track');
        if (!track) return;
        this.canvas.width = track.offsetWidth + 150; // 파티클이 오른쪽으로 날아갈 수 있는 여유 공간 확보
        this.canvas.height = 60;
    }

    _spawnParticles(x, y) {
        const count = 1 + Math.floor(Math.random() * 2); // 1~2개로 줄여 조금씩
        for (let i = 0; i < count; i++) {
            // 오른쪽 방향(약 -75도 ~ 75도)으로만 퍼지도록 각도 설정
            const angle = (Math.random() - 0.5) * Math.PI * 0.8;
            const speed = 0.5 + Math.random() * 1.5;
            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: 0.8 + Math.random() * 1.0, // 크기를 아주 작게
                alpha: 1.0, // 불투명하고 선명하게 시작
                decay: 0.02 + Math.random() * 0.03, // 서서히 사라지도록
                gravity: 0.05,
            });
        }
    }

    setRunning(isRunning) {
        this.isRunning = isRunning;
    }

    _startParticleLoop() {
        let lastSpawnTime = performance.now();
        
        const loop = (timestamp) => {
            this.animFrameId = requestAnimationFrame(loop);
            
            const track = document.getElementById('progress-bar-track');
            // 레이아웃이 확정된 후 또는 창 크기 변경 시 폭을 동기화
            if (track && this.canvas.width !== track.offsetWidth + 150) {
                this._resizeCanvas();
            }
            
            if (!this.ctx || !this.canvas.width) return;

            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            const rect = this.progressBar.getBoundingClientRect();
            const trackRect = track.getBoundingClientRect();
            
            // CSS 픽셀을 캔버스 내부 좌표로 변환 (추가한 여유 공간 150px 제외)
            const ratio = trackRect.width > 0 ? ((this.canvas.width - 150) / trackRect.width) : 1;
            const currentBarEndX = rect.width * ratio;

            // 타이머가 실행 중일 때만 0.1초마다 파티클 방출
            if (this.isRunning && currentBarEndX > 0 && timestamp - lastSpawnTime > 100) {
                this._spawnParticles(currentBarEndX, this.canvas.height / 2);
                lastSpawnTime = timestamp;
            }

            // 파티클 업데이트 & 렌더
            this.particles = this.particles.filter(p => p.alpha > 0.02);
            for (const p of this.particles) {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += p.gravity;
                p.vx *= 0.96;
                p.alpha -= p.decay;

                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                this.ctx.shadowBlur = 0; // 블러를 없애 선명하게
                this.ctx.fillStyle = `rgba(230, 210, 255, ${p.alpha})`; // 밝은 연보라색으로 선명하게
                this.ctx.fill();
            }
        };
        loop(performance.now());
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
        this.progressBar.style.width = `${progress * 100}%`;
    }

    destroy() {
        if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    }
}

