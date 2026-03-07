'use client';

import { useEffect, useRef } from 'react';

export default function AnimatedBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animId: number;
        let W = window.innerWidth;
        let H = window.innerHeight;

        canvas.width = W;
        canvas.height = H;

        const resize = () => {
            W = window.innerWidth;
            H = window.innerHeight;
            canvas.width = W;
            canvas.height = H;
        };
        window.addEventListener('resize', resize);

        // Particles
        const PARTICLE_COUNT = 55;
        type Particle = { x: number; y: number; vx: number; vy: number; r: number; alpha: number; pulse: number };
        const particles: Particle[] = Array.from({ length: PARTICLE_COUNT }, () => ({
            x: Math.random() * W,
            y: Math.random() * H,
            vx: (Math.random() - 0.5) * 0.22,
            vy: (Math.random() - 0.5) * 0.22,
            r: Math.random() * 1.4 + 0.4,
            alpha: Math.random() * 0.35 + 0.08,
            pulse: Math.random() * Math.PI * 2,
        }));

        let t = 0;
        const draw = () => {
            ctx.clearRect(0, 0, W, H);
            t += 0.006;

            // Animated radial indigo glow (top-center)
            const glowR = 520 + Math.sin(t * 0.7) * 40;
            const grd = ctx.createRadialGradient(W / 2, -60, 0, W / 2, -60, glowR);
            grd.addColorStop(0, 'rgba(99,102,241,0.13)');
            grd.addColorStop(0.5, 'rgba(99,102,241,0.04)');
            grd.addColorStop(1, 'transparent');
            ctx.fillStyle = grd;
            ctx.fillRect(0, 0, W, H);

            // Secondary purple glow (bottom-left wander)
            const bx = 0.12 * W + Math.sin(t * 0.5) * 60;
            const by = H + 80 + Math.cos(t * 0.4) * 60;
            const grd2 = ctx.createRadialGradient(bx, by, 0, bx, by, 380);
            grd2.addColorStop(0, 'rgba(139,92,246,0.09)');
            grd2.addColorStop(1, 'transparent');
            ctx.fillStyle = grd2;
            ctx.fillRect(0, 0, W, H);

            // Animated grid lines
            ctx.strokeStyle = 'rgba(99,102,241,0.035)';
            ctx.lineWidth = 1;
            const gridOffset = (t * 8) % 60;
            // horizontal
            for (let y = -60 + gridOffset; y < H + 60; y += 60) {
                ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
            }
            // vertical — perspective-style, fan from center
            const vCount = 18;
            for (let i = 0; i <= vCount; i++) {
                const x = (W / vCount) * i;
                ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
            }

            // Particles
            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.pulse += 0.018;
                if (p.x < 0) p.x = W;
                if (p.x > W) p.x = 0;
                if (p.y < 0) p.y = H;
                if (p.y > H) p.y = 0;

                const alpha = p.alpha + Math.sin(p.pulse) * 0.06;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(99,102,241,${Math.max(0, alpha)})`;
                ctx.fill();
            });

            // Particle connection lines
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 130) {
                        const alpha = (1 - dist / 130) * 0.07;
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.strokeStyle = `rgba(99,102,241,${alpha})`;
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                }
            }

            animId = requestAnimationFrame(draw);
        };

        draw();
        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener('resize', resize);
        };
    }, []);

    return (
        <>
            {/* Canvas background */}
            <canvas
                ref={canvasRef}
                style={{
                    position: 'fixed',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    zIndex: 0,
                    pointerEvents: 'none',
                }}
            />
            {/* Noise grain overlay */}
            <div
                style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 0,
                    pointerEvents: 'none',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
                    opacity: 0.4,
                }}
            />
        </>
    );
}
