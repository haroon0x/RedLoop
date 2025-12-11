'use client';

import React, { useEffect, useRef } from 'react';

export default function NeuralGrid() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = window.innerWidth;
        let height = window.innerHeight;
        let animationFrameId: number;

        const resize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
        };

        window.addEventListener('resize', resize);
        resize();

        // Grid config
        const spacing = 40;
        const pointer = { x: -1000, y: -1000 };
        const connectionRadius = 150;

        const handleMouseMove = (e: MouseEvent) => {
            pointer.x = e.clientX;
            pointer.y = e.clientY;
        };
        window.addEventListener('mousemove', handleMouseMove);

        const draw = () => {
            ctx.clearRect(0, 0, width, height);

            // Draw Dots
            const cols = Math.ceil(width / spacing);
            const rows = Math.ceil(height / spacing);

            ctx.fillStyle = 'rgba(255, 255, 255, 0.05)'; // Very subtle dot

            for (let i = 0; i < cols; i++) {
                for (let j = 0; j < rows; j++) {
                    const x = i * spacing;
                    const y = j * spacing;

                    // Calculate distance to pointer
                    const dx = pointer.x - x;
                    const dy = pointer.y - y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    // Draw Dot
                    ctx.beginPath();
                    // Slight swell effect
                    const radius = 1; // Fixed small radius
                    ctx.arc(x, y, radius, 0, Math.PI * 2);
                    ctx.fill();

                    // Draw Connection Line - More subtle
                    if (distance < connectionRadius) {
                        ctx.beginPath();
                        ctx.moveTo(x, y);
                        ctx.lineTo(pointer.x, pointer.y);
                        const opacity = (1 - distance / connectionRadius) * 0.1; // Reduced opacity
                        ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`; // White lines
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                }
            }

            animationFrameId = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            window.removeEventListener('resize', resize);
            window.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 z-[-2] pointer-events-none"
        />
    );
}
