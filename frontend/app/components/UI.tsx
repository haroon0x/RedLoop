'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion, HTMLMotionProps, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Icon } from './Icon';


export const Preloader: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
    const [count, setCount] = useState(0);
    const [phase, setPhase] = useState<'loading' | 'ready'>('loading');

    useEffect(() => {
        const interval = setInterval(() => {
            setCount((prev) => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setPhase('ready');
                    setTimeout(onComplete, 600);
                    return 100;
                }
                return prev + Math.floor(Math.random() * 3) + 1;
            });
        }, 25);

        return () => clearInterval(interval);
    }, [onComplete]);

    return (
        <motion.div
            exit={{
                clipPath: 'polygon(0 0, 100% 0, 100% 0, 0 0)',
                transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] }
            }}
            className="fixed inset-0 z-[100] bg-[#050508] flex flex-col justify-center items-center overflow-hidden"
        >
            {/* Aurora Effect */}
            <div className="absolute inset-0 aurora opacity-50" />

            {/* Grid */}
            <div className="absolute inset-0 bg-grid" />

            {/* Central Orb */}
            <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute w-[400px] h-[400px] rounded-full bg-gradient-radial from-[#ff2d55]/20 to-transparent blur-[80px]"
            />

            {/* Logo */}
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="relative z-10 mb-12"
            >
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#ff2d55] to-[#ff4d6d] flex items-center justify-center text-white text-3xl font-bold font-serif italic shadow-[0_0_60px_rgba(255,45,85,0.5)]">
                    R
                </div>
            </motion.div>

            {/* Counter */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="relative z-10 text-center"
            >
                <div className="font-display font-bold text-8xl md:text-9xl tracking-tight">
                    <span className="gradient-text">{Math.min(count, 100)}</span>
                    <span className="text-[#ff2d55]">%</span>
                </div>

                {/* Progress Bar */}
                <div className="mt-8 w-64 h-1 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-[#ff2d55] to-[#8b5cf6]"
                        style={{ width: `${count}%` }}
                    />
                </div>

                {/* Status Text */}
                <motion.div
                    className="mt-6 font-mono text-xs tracking-widest uppercase text-[#606070]"
                    animate={{ opacity: phase === 'ready' ? 1 : [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: phase === 'ready' ? 0 : Infinity }}
                >
                    {phase === 'ready' ? (
                        <span className="text-[#ff2d55]">● System Ready</span>
                    ) : (
                        'Initializing Security Protocols...'
                    )}
                </motion.div>
            </motion.div>
        </motion.div>
    );
};


export const GlitchText: React.FC<{ text: string; className?: string }> = ({ text, className = "" }) => {
    const [displayText, setDisplayText] = useState(text);
    const [isGlitching, setIsGlitching] = useState(true);
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&';

    useEffect(() => {
        if (!isGlitching) return;

        let iteration = 0;
        const interval = setInterval(() => {
            setDisplayText(
                text
                    .split('')
                    .map((char, index) => {
                        if (char === ' ') return ' ';
                        if (index < iteration) return text[index];
                        return chars[Math.floor(Math.random() * chars.length)];
                    })
                    .join('')
            );

            if (iteration >= text.length) {
                clearInterval(interval);
                setIsGlitching(false);
            }
            iteration += 0.5;
        }, 40);

        return () => clearInterval(interval);
    }, [text, isGlitching, chars]);

    return <span className={className}>{displayText}</span>;
};


interface TiltCardProps extends HTMLMotionProps<"div"> {
    children: React.ReactNode;
    className?: string;
    intensity?: number;
}

export const TiltCard: React.FC<TiltCardProps> = ({
    children,
    className = '',
    intensity = 10,
    ...props
}) => {
    const ref = useRef<HTMLDivElement>(null);
    const [isHovered, setIsHovered] = useState(false);

    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [intensity, -intensity]), { stiffness: 300, damping: 30 });
    const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-intensity, intensity]), { stiffness: 300, damping: 30 });

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        x.set((e.clientX - centerX) / rect.width);
        y.set((e.clientY - centerY) / rect.height);
    }, [x, y]);

    const handleMouseLeave = useCallback(() => {
        setIsHovered(false);
        x.set(0);
        y.set(0);
    }, [x, y]);

    return (
        <motion.div
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={handleMouseLeave}
            style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
            className={`relative transition-all duration-200 ${className}`}
            {...props}
        >
            {/* Glow Effect */}
            <motion.div
                animate={{ opacity: isHovered ? 1 : 0 }}
                className="absolute -inset-px rounded-2xl bg-gradient-to-r from-[#ff2d55]/50 via-[#8b5cf6]/50 to-[#06b6d4]/50 blur-xl -z-10"
            />
            {children}
        </motion.div>
    );
};


interface CardProps extends HTMLMotionProps<"div"> {
    children: React.ReactNode;
    className?: string;
    noPadding?: boolean;
    glow?: boolean;
    tilt?: boolean;
    hover?: boolean;
}

export const Card: React.FC<CardProps> = ({
    children,
    className = '',
    noPadding = false,
    glow = false,
    tilt = false,
    hover = true,
    ...props
}) => {
    const content = (
        <motion.div
            className={`relative rounded-2xl overflow-hidden glass transition-premium ${hover ? 'glass-hover' : ''} ${glow ? 'glass-glow' : ''} ${className}`}
            {...props}
        >
            {/* Shine Effect */}
            {hover && (
                <div className="absolute inset-0 rounded-2xl opacity-0 hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full hover:translate-x-full pointer-events-none" style={{ transition: 'transform 0.8s ease' }} />
            )}

            <div className={`relative z-10 h-full ${noPadding ? '' : 'p-6'}`}>
                {children}
            </div>
        </motion.div>
    );

    if (tilt) {
        return <TiltCard className="h-full">{content}</TiltCard>;
    }

    return content;
};


interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
    children: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'success';
    size?: 'sm' | 'md' | 'lg';
    icon?: React.ReactNode;
    magnetic?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    icon,
    magnetic = true,
    className = '',
    ...props
}) => {
    const ref = useRef<HTMLButtonElement>(null);
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const springX = useSpring(x, { stiffness: 300, damping: 20 });
    const springY = useSpring(y, { stiffness: 300, damping: 20 });

    const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (!magnetic || !ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        x.set((e.clientX - centerX) * 0.3);
        y.set((e.clientY - centerY) * 0.3);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    const variants = {
        primary: 'btn-primary',
        secondary: 'bg-white/5 text-white hover:bg-white/10 border border-white/10',
        outline: 'bg-transparent border-2 border-[#ff2d55] text-[#ff2d55] hover:bg-[#ff2d55]/10',
        ghost: 'bg-transparent text-[#a0a0b0] hover:text-white',
        danger: 'bg-[#ff2d55]/20 text-[#ff2d55] hover:bg-[#ff2d55]/30 border border-[#ff2d55]/30',
        success: 'bg-[#22c55e]/20 text-[#22c55e] hover:bg-[#22c55e]/30 border border-[#22c55e]/30',
    };

    const sizes = {
        sm: 'px-4 py-2 text-xs rounded-lg',
        md: 'px-6 py-3 text-sm rounded-xl',
        lg: 'px-8 py-4 text-base rounded-xl'
    };

    return (
        <motion.button
            ref={ref}
            style={{ x: springX, y: springY }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            whileTap={{ scale: 0.98 }}
            className={`relative inline-flex items-center justify-center gap-2 font-display font-semibold cursor-pointer transition-all duration-300 ${variants[variant]} ${sizes[size]} ${className}`}
            {...props}
        >
            <span className="relative z-10 flex items-center gap-2">
                {icon && <span>{icon}</span>}
                {children}
            </span>
        </motion.button>
    );
};


interface BadgeProps {
    text: string;
    variant?: 'red' | 'purple' | 'cyan' | 'neutral';
    pulse?: boolean;
    glow?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({ text, variant = 'neutral', pulse = false, glow = false }) => {
    const styles = {
        red: 'bg-[#ff2d55]/15 text-[#ff2d55] border-[#ff2d55]/30',
        purple: 'bg-[#8b5cf6]/15 text-[#8b5cf6] border-[#8b5cf6]/30',
        cyan: 'bg-[#06b6d4]/15 text-[#06b6d4] border-[#06b6d4]/30',
        neutral: 'bg-white/5 text-[#a0a0b0] border-white/10',
    };

    const glowStyles = {
        red: 'shadow-[0_0_20px_rgba(255,45,85,0.3)]',
        purple: 'shadow-[0_0_20px_rgba(139,92,246,0.3)]',
        cyan: 'shadow-[0_0_20px_rgba(6,182,212,0.3)]',
        neutral: '',
    };

    return (
        <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-mono tracking-wider uppercase border ${styles[variant]} ${glow ? glowStyles[variant] : ''}`}
        >
            {pulse && (
                <span className="relative flex h-2 w-2">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${variant === 'red' ? 'bg-[#ff2d55]' : variant === 'purple' ? 'bg-[#8b5cf6]' : variant === 'cyan' ? 'bg-[#06b6d4]' : 'bg-white'}`}></span>
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${variant === 'red' ? 'bg-[#ff2d55]' : variant === 'purple' ? 'bg-[#8b5cf6]' : variant === 'cyan' ? 'bg-[#06b6d4]' : 'bg-white'}`}></span>
                </span>
            )}
            {text}
        </motion.span>
    );
};


export const Modal: React.FC<{ isOpen: boolean; onClose: () => void; children: React.ReactNode; title?: string }> = ({ isOpen, onClose, children, title }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60]"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", damping: 30, stiffness: 400 }}
                        className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 z-[70] w-auto md:w-full md:max-w-lg max-h-[90vh] overflow-y-auto glass rounded-2xl"
                    >
                        <div className="sticky top-0 z-10 flex justify-between items-center p-5 border-b border-white/5 bg-[#0d0d14]/90 backdrop-blur-md">
                            <h2 className="font-display font-bold text-lg flex items-center gap-3">
                                <span className="w-2 h-2 rounded-full bg-[#ff2d55] animate-pulse" />
                                {title}
                            </h2>
                            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                                <Icon name="close" size={18} />
                            </button>
                        </div>
                        <div className="p-6">{children}</div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};


export const PageTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full min-h-screen"
    >
        {children}
    </motion.div>
);


export const AnimatedCounter: React.FC<{ value: number; suffix?: string; className?: string }> = ({ value, suffix = '', className = '' }) => {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        const duration = 2000;
        const steps = 60;
        const increment = value / steps;
        let current = 0;

        const timer = setInterval(() => {
            current += increment;
            if (current >= value) {
                setDisplayValue(value);
                clearInterval(timer);
            } else {
                setDisplayValue(Math.floor(current));
            }
        }, duration / steps);

        return () => clearInterval(timer);
    }, [value]);

    return <span className={className}>{displayValue.toLocaleString()}{suffix}</span>;
};
