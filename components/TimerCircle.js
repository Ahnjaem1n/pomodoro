class TimerCircle {
    constructor(container) {
        this.container = container;
        this.particles = [];
        this.animFrameId = null;
        this.isRunning = false;
        this.currentProgress = 1;
        this.render();
        this._startParticleLoop();
    }
    
    render() {
        this.container.innerHTML = `
            <div class="timer-circle-wrapper" style="position: relative; width: 400px; height: 400px;">
                <svg width="400" height="400" viewBox="0 0 400 400" style="transform: rotate(-90deg); overflow: visible;">
                    <defs>
                        <filter id="circle-glow" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur in="SourceGraphic" stdDeviation="11.2" result="blur" />
                            <feFlood id="circle-glow-color" flood-color="var(--color-accent)" flood-opacity="0.56" result="color" />
                            <feComposite in="color" in2="blur" operator="in" result="coloredBlur" />
                            <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>
                    <circle cx="200" cy="200" r="174" fill="none" stroke="var(--color-surface)" stroke-width="14" />
                    <circle id="progress-ring" cx="200" cy="200" r="174" fill="none" stroke="var(--color-accent)" stroke-width="14" 
                            stroke-linecap="round" stroke-dasharray="1093.27" stroke-dashoffset="0"
                            style="transition: stroke 0.4s ease;" filter="url(#circle-glow)" />
                </svg>
                <canvas id="circle-particle-canvas" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 10;"></canvas>
                <div id="time-display" class="text-timer-classic" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: var(--color-text-primary); display: flex;">
                </div>
            </div>
        `;
        this.progressRing = document.getElementById('progress-ring');
        this.timeDisplay = document.getElementById('time-display');
        this.canvas = document.getElementById('circle-particle-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.circumference = 2 * Math.PI * 174; // ~1093.27
        this.wrapper = this.container.querySelector('.timer-circle-wrapper');
        this.glowFlood = document.getElementById('circle-glow-color');
        this._resizeCanvas();
        this._syncGlowColor();
    }

    _syncGlowColor() {
        if (!this.glowFlood) return;

        // glow-off 토글 처리: SVG 속성 filter는 CSS로 제어 불가하므로 JS로 처리
        const glowOff = document.body.classList.contains('glow-off');
        if (glowOff) {
            this.progressRing.removeAttribute('filter');
            return;
        } else if (!this.progressRing.getAttribute('filter')) {
            this.progressRing.setAttribute('filter', 'url(#circle-glow)');
        }

        const accent = getComputedStyle(document.body).getPropertyValue('--color-accent').trim();
        if (accent && accent !== this._lastGlowColor) {
            this.glowFlood.setAttribute('flood-color', accent);
            this._lastGlowColor = accent;
        }
    }

    _resizeCanvas() {
        if (!this.wrapper || !this.canvas) return;
        // 캔버스 버퍼 크기를 래퍼의 실제 렌더링 크기에 맞춤
        const w = this.wrapper.offsetWidth;
        const h = this.wrapper.offsetHeight;
        this.canvas.width = w;
        this.canvas.height = h;
    }

    _getEndPoint(progress) {
        // 캔버스의 실제 크기를 기준으로 중심점과 반지름을 동적 계산
        const w = this.canvas.width;
        const h = this.canvas.height;
        const centerX = w / 2;
        const centerY = h / 2;
        // SVG viewBox 기준 비율: radius 174 / viewBox반쪽 200
        const radius = (Math.min(w, h) / 2) * (174 / 200);

        // SVG rotate(-90deg)이므로 시작점이 12시 방향(상단)
        // progress 1 = 전체, progress 0 = 없음
        const angle = (progress * 2 * Math.PI) - (Math.PI / 2);
        return {
            x: centerX + radius * Math.cos(angle),
            y: centerY + radius * Math.sin(angle)
        };
    }

    setRunning(isRunning) {
        this.isRunning = isRunning;
    }

    _spawnParticles(x, y, progress) {
        const count = 1 + Math.floor(Math.random() * 2);
        // 원의 바깥 방향(방사 방향)으로 퍼지도록 각도 계산
        const radialAngle = (progress * 2 * Math.PI) - (Math.PI / 2);
        for (let i = 0; i < count; i++) {
            const spread = (Math.random() - 0.5) * Math.PI * 0.65;
            const outAngle = radialAngle + spread;
            const speed = 0.4 + Math.random() * 1.2;
            this.particles.push({
                x,
                y,
                vx: Math.cos(outAngle) * speed,
                vy: Math.sin(outAngle) * speed,
                size: 0.6 + Math.random() * 1.0,
                alpha: 0.9 + Math.random() * 0.1,
                decay: 0.015 + Math.random() * 0.025,
                gravity: 0.03,
            });
        }
    }

    _startParticleLoop() {
        let lastSpawnTime = performance.now();

        const loop = (timestamp) => {
            this.animFrameId = requestAnimationFrame(loop);
            if (!this.ctx) return;

            // 래퍼 크기가 변했을 때 캔버스 리사이즈
            if (this.wrapper) {
                const w = this.wrapper.offsetWidth;
                const h = this.wrapper.offsetHeight;
                if (this.canvas.width !== w || this.canvas.height !== h) {
                    this._resizeCanvas();
                }
            }

            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            // SVG 필터 글로우 색상을 현재 accent 색상과 동기화
            this._syncGlowColor();

            // 타이머 실행 중이고 progress가 있을 때만 파티클 생성
            if (this.isRunning && this.currentProgress > 0.001 && timestamp - lastSpawnTime > 100) {
                const pt = this._getEndPoint(this.currentProgress);
                this._spawnParticles(pt.x, pt.y, this.currentProgress);
                lastSpawnTime = timestamp;
            }

            // 파티클 업데이트 & 렌더
            this.particles = this.particles.filter(p => p.alpha > 0.02);

            // accent 색상 가져오기
            const accentColor = getComputedStyle(document.body).getPropertyValue('--color-accent').trim();
            const rgb = this._hexToRgb(accentColor) || { r: 230, g: 210, b: 255 };

            for (const p of this.particles) {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += p.gravity;
                p.vx *= 0.97;
                p.alpha -= p.decay;

                this.ctx.save();
                this.ctx.globalAlpha = p.alpha;
                this.ctx.fillStyle = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
                const half = p.size / 2;
                const rotation = Math.atan2(p.vy, p.vx);
                this.ctx.translate(p.x, p.y);
                this.ctx.rotate(rotation);
                this.ctx.fillRect(-half * 1.5, -half, p.size * 1.5, p.size);
                this.ctx.restore();
            }
        };
        loop(performance.now());
    }

    _hexToRgb(hex) {
        if (!hex || hex.charAt(0) !== '#') return null;
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
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
        this.currentProgress = progress;
        const offset = this.circumference - (progress * this.circumference);
        this.progressRing.style.strokeDashoffset = `${offset}px`;
    }

    destroy() {
        if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    }
}
