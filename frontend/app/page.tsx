'use client';

import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useMotionValue, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Icon } from './components/Icon';
import { Button, Card, Badge, PageTransition, Modal } from './components/UI';
import ServerStatus from './components/ServerStatus';
import MagneticButton from './components/MagneticButton';
import HeroVisual from './components/HeroVisual';
import BattleDuel from './components/BattleDuel';


const InfinityLoop = () => {
    return (
        <div className="relative w-full max-w-5xl mx-auto h-[500px] flex items-center justify-center" style={{ perspective: '1000px' }}>
            <div className="absolute inset-0 bg-gradient-radial from-[#ff2d55]/10 via-transparent to-transparent blur-3xl" />

            {/* 3D Container with tilt */}
            <motion.div
                className="relative w-full h-full"
                style={{ transformStyle: 'preserve-3d' }}
                animate={{ rotateX: [0, 5, 0, -5, 0] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            >
                {/* Team Labels */}
                <div className="absolute top-1/2 -translate-y-1/2 left-0 z-20 text-left">
                    <div className="font-mono text-xs text-[#ff2d55] tracking-widest mb-1">RED TEAM</div>
                    <div className="font-serif italic text-2xl text-white">Adversary</div>
                    <p className="text-[#a0a0b0] text-xs mt-2 max-w-[120px]">Attacks your code before hackers do</p>
                </div>

                <div className="absolute top-1/2 -translate-y-1/2 right-0 z-20 text-right">
                    <div className="font-mono text-xs text-[#06b6d4] tracking-widest mb-1">BLUE TEAM</div>
                    <div className="font-serif italic text-2xl text-white">Defender</div>
                    <p className="text-[#a0a0b0] text-xs mt-2 max-w-[120px] ml-auto">Auto-patches vulnerabilities</p>
                </div>

                <svg viewBox="0 0 800 300" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full relative z-10">
                    <defs>
                        <linearGradient id="loopGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#ff2d55" />
                            <stop offset="50%" stopColor="#22d3ee" />
                            <stop offset="100%" stopColor="#06b6d4" />
                        </linearGradient>
                        <filter id="glow2" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur stdDeviation="6" result="blur" />
                            <feMerge>
                                <feMergeNode in="blur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                        {/* 3D Shadow */}
                        <filter id="shadow3d" x="-50%" y="-50%" width="200%" height="200%">
                            <feDropShadow dx="0" dy="20" stdDeviation="10" floodColor="#ff2d55" floodOpacity="0.3" />
                        </filter>
                    </defs>

                    {/* Shadow Layer for 3D depth */}
                    <path
                        d="M100,150 C100,50 250,50 400,150 C550,250 700,250 700,150 C700,50 550,50 400,150 C250,250 100,250 100,150"
                        stroke="rgba(255,45,85,0.1)"
                        strokeWidth="8"
                        fill="none"
                        transform="translate(0, 15)"
                    />

                    {/* Background track */}
                    <path
                        d="M100,150 C100,50 250,50 400,150 C550,250 700,250 700,150 C700,50 550,50 400,150 C250,250 100,250 100,150"
                        stroke="rgba(255,255,255,0.08)"
                        strokeWidth="2"
                        fill="none"
                    />

                    {/* Main animated path */}
                    <motion.path
                        d="M100,150 C100,50 250,50 400,150 C550,250 700,250 700,150 C700,50 550,50 400,150 C250,250 100,250 100,150"
                        stroke="url(#loopGrad2)"
                        strokeWidth="5"
                        fill="none"
                        strokeLinecap="round"
                        filter="url(#glow2)"
                        initial={{ pathLength: 0, opacity: 0 }}
                        whileInView={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 2, ease: "easeInOut" }}
                    />

                    {/* Evolving Particles */}
                    {[0, 0.33, 0.66].map((offset, i) => (
                        <motion.circle
                            key={i}
                            r={8}
                            fill={i === 0 ? "#ff2d55" : i === 1 ? "#22d3ee" : "#06b6d4"}
                            filter="url(#glow2)"
                        >
                            <animateMotion
                                dur="6s"
                                repeatCount="indefinite"
                                path="M100,150 C100,50 250,50 400,150 C550,250 700,250 700,150 C700,50 550,50 400,150 C250,250 100,250 100,150"
                                keyPoints={`${offset};${(offset + 1) % 1}`}
                                keyTimes="0;1"
                            />
                        </motion.circle>
                    ))}
                </svg>
            </motion.div>

            {/* Center connection label */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
                <div className="font-mono text-[10px] text-[#a0a0b0] tracking-[0.3em] text-center">CONTINUOUS FEEDBACK LOOP</div>
            </div>
        </div>
    );
};

const InteractiveThreatConsole = () => {
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const rotateX = useTransform(y, [-100, 100], [5, -5]);
    const rotateY = useTransform(x, [-100, 100], [-5, 5]);

    function handleMouse(event: React.MouseEvent<HTMLDivElement>) {
        const rect = event.currentTarget.getBoundingClientRect();
        x.set(event.clientX - rect.left - rect.width / 2);
        y.set(event.clientY - rect.top - rect.height / 2);
    }

    return (
        <motion.div
            style={{ perspective: 1000 }}
            className="w-full h-[500px] flex items-center justify-center cursor-crosshair"
            onMouseMove={handleMouse}
            onMouseLeave={() => { x.set(0); y.set(0); }}
        >
            {/* Hero content removed - now using video background */}
        </motion.div>
    );
};


export default function Landing() {
    const { scrollY } = useScroll();
    const y1 = useTransform(scrollY, [0, 500], [0, 200]);
    const y2 = useTransform(scrollY, [0, 500], [0, -200]);

    const [isManifestoOpen, setIsManifestoOpen] = useState(false);

    return (
        <PageTransition>

            <div className="min-h-screen bg-[#050508] text-white overflow-x-hidden selection:bg-[#ff2d55] selection:text-white relative z-10">


                <motion.nav
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                    className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4"
                >
                    {/* Premium Glass Container with Cutting Edge Effect */}
                    <div className="relative w-full max-w-[1200px]">
                        {/* Glass reflection / top edge highlight */}
                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

                        {/* Main container with depth */}
                        <div className="relative backdrop-blur-2xl bg-black/70 border border-white/[0.08] rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.05)] overflow-hidden">

                            {/* Inner glow layer */}
                            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.05] to-transparent pointer-events-none" />

                            <div className="relative flex items-center justify-between px-2 py-1.5">
                                {/* 1. Identity Module */}
                                <div className="flex items-center gap-4 px-4 py-2">
                                    <Link href="/" className="group flex items-center gap-3">
                                        <div className="relative w-9 h-9 flex items-center justify-center bg-gradient-to-br from-white/10 to-white/5 rounded-xl border border-white/10 overflow-hidden group-hover:border-[#ff2d55]/50 transition-all duration-300 shadow-[0_4px_12px_rgba(0,0,0,0.2)]">
                                            <div className="absolute inset-0 bg-gradient-to-tr from-[#ff2d55]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                            <span className="font-display font-bold text-lg text-[#ff2d55] drop-shadow-[0_0_8px_rgba(255,45,85,0.5)]">R</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-display font-bold tracking-tight text-sm leading-none text-white">REDLOOP</span>
                                            <span className="font-mono text-[9px] text-white/40 tracking-widest uppercase">Defense Protocol</span>
                                        </div>
                                    </Link>
                                </div>

                                {/* 2. Navigation Module - Premium Style */}
                                <div className="hidden md:flex items-center gap-1">
                                    {[
                                        { name: 'Vision', href: '#vision' },
                                        { name: 'Capabilities', href: '#capabilities' },
                                        { name: 'System', href: '#system' }
                                    ].map((item) => (
                                        <a
                                            key={item.name}
                                            href={item.href}
                                            className="relative px-4 py-2 group"
                                        >
                                            <span className="relative z-10 font-medium text-sm tracking-wide text-white/50 group-hover:text-white transition-colors duration-300">
                                                {item.name}
                                            </span>
                                            {/* Hover glow background */}
                                            <div className="absolute inset-0 rounded-lg bg-white/0 group-hover:bg-white/[0.06] transition-all duration-300" />
                                            {/* Animated underline */}
                                            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent group-hover:w-3/4 transition-all duration-300" />
                                        </a>
                                    ))}
                                </div>

                                {/* 3. CTA Module */}
                                <div className="flex items-center gap-3 pr-2">
                                    <a
                                        href="https://github.com/haroon0x/RedLoop"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="hidden lg:flex items-center justify-center w-9 h-9 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-200"
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-white/70 hover:text-white">
                                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                        </svg>
                                    </a>

                                    <Link href="/dashboard">
                                        <MagneticButton>
                                            <button className="relative group overflow-hidden px-6 py-2.5 rounded-xl bg-white text-black font-semibold text-xs tracking-wide uppercase transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] active:scale-95">
                                                <div className="absolute inset-0 bg-gradient-to-r from-[#ff2d55] to-[#ff6b35] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                                <span className="relative z-10 group-hover:text-white transition-colors duration-300 flex items-center gap-2">
                                                    <span>Console</span>
                                                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300">
                                                        <path d="M1 9L9 1M9 1H3M9 1V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                </span>
                                            </button>
                                        </MagneticButton>
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Bottom edge shadow for depth */}
                        <div className="absolute inset-x-4 -bottom-3 h-6 bg-black/20 blur-xl rounded-full" />
                    </div>
                </motion.nav>


                <section className="relative min-h-screen flex flex-col justify-center px-6 pt-20 bg-transparent">
                    {/* Video Background */}
                    <HeroVisual />

                    {/* Cinematic Vignette */}
                    <div className="absolute inset-0 pointer-events-none z-[2] bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.3)_60%,rgba(0,0,0,0.6)_100%)]" />

                    <div className="max-w-[900px] mx-auto w-full flex flex-col items-center text-center relative z-10">
                        {/* Centered Hero Content */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                            className="flex flex-col items-center"
                        >
                            <div className="mb-6">
                                <ServerStatus />
                            </div>

                            <h1 className="text-6xl md:text-8xl lg:text-9xl mb-6 font-display font-light tracking-tight leading-[0.95]">
                                <span className="block text-shimmer">The Art</span>
                                <span className="block opacity-50 italic font-serif">of Defense.</span>
                            </h1>

                            <p className="text-lg md:text-xl text-white/60 max-w-lg mt-4 leading-relaxed font-light">
                                RedLoop is the immune system for your digital infrastructure. Elegantly autonomous.
                            </p>

                            <div className="mt-12 flex items-center gap-6">
                                <Link href="/dashboard">
                                    <MagneticButton>
                                        <Button variant="primary" size="lg" className="rounded-full border border-white/20 bg-white/5 hover:bg-white/10 text-white px-12 backdrop-blur-md">
                                            Start the Sequence
                                        </Button>
                                    </MagneticButton>
                                </Link>

                                <button onClick={() => setIsManifestoOpen(true)} className="flex items-center gap-2 group">
                                    <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all">
                                        <Icon name="chevronRight" size={16} />
                                    </div>
                                    <span className="font-mono text-xs">MANIFESTO</span>
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </section>


                <section className="py-24 border-y border-white/5 bg-black/40">
                    <div className="max-w-[1600px] mx-auto text-center px-6">
                        <h2 className="font-display font-medium text-sm tracking-[0.2em] text-[#a0a0b0] mb-8">THE INFINITE LOOP</h2>
                        <InfinityLoop />
                    </div>
                </section>


                <section className="py-32 px-6" id="capabilities">
                    <div className="max-w-[1600px] mx-auto">
                        <div className="mb-20 flex flex-col md:flex-row justify-between items-end gap-8">
                            <div>
                                <h2 className="font-serif italic text-6xl md:text-7xl mb-4">Capabilities</h2>
                                <div className="w-20 h-1 bg-[#ff2d55]"></div>
                            </div>
                            <p className="max-w-md text-[#a0a0b0] leading-relaxed">
                                We have dismantled the traditional security stack and rebuilt it as a living, breathing organism.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-3 md:grid-rows-2 gap-6 h-auto md:h-[800px]">

                            {/* 1. MAIN FEATURE - Autonomous Remediation (Large) */}
                            <Card
                                className="md:col-span-2 md:row-span-2 bg-[#0a0a10] border-[#ff2d55]/20 relative overflow-hidden group"
                                glow
                                noPadding
                            >
                                <div className="absolute inset-0 bg-gradient-to-tr from-[#ff2d55]/10 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
                                <div className="absolute -right-20 -top-20 w-96 h-96 bg-[#ff2d55]/20 rounded-full blur-[100px] pointer-events-none" />

                                <div className="p-10 h-full flex flex-col justify-end relative z-10">
                                    <div className="w-16 h-16 rounded-none bg-[#ff2d55] text-white flex items-center justify-center mb-8">
                                        <Icon name="defend" size={32} />
                                    </div>
                                    <h3 className="font-display text-4xl md:text-5xl font-bold mb-6 text-white">Autonomous Remediation</h3>
                                    <p className="text-xl text-[#a0a0b0] max-w-lg leading-relaxed mb-8">
                                        The agent that sleeps in your repository. It wakes up when you commit, scans for anomalies, and patches them before CI/CD even blinks.
                                    </p>

                                    <div className="flex gap-4">
                                        <Badge text="AI-Core" variant="red" pulse />
                                        <Badge text="Auto-PR" variant="neutral" />
                                    </div>
                                </div>
                            </Card>

                            {/* 2. SECONDARY - Neural Genome (Now Blue/Cyan aligned) */}
                            <Card className="bg-[#0a0a10] border-[#06b6d4]/20 group relative overflow-hidden" glow>
                                <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:opacity-100 transition-opacity">
                                    <Icon name="genome" size={48} className="text-[#06b6d4]" />
                                </div>

                                <div className="h-full flex flex-col justify-between">
                                    <div>
                                        <Badge text="Analysis" variant="cyan" />
                                        <h3 className="font-serif italic text-3xl text-white mt-4">Neural<br />Genome</h3>
                                    </div>

                                    <div className="flex items-end gap-1 h-32 mt-8 opacity-60 group-hover:opacity-100 transition-opacity">
                                        {[40, 70, 45, 90, 60, 80, 50].map((h, i) => (
                                            <div key={i} className="flex-1 bg-[#06b6d4]" style={{ height: `${h}%` }}></div>
                                        ))}
                                    </div>
                                </div>
                            </Card>

                            {/* 3. TERTIARY - Live Replay (White/Contrast) */}
                            <Card className="bg-[#e5e5e5] text-black border-none group relative overflow-hidden" hover={false}>
                                <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-[#ff2d55] rounded-full blur-[60px] opacity-20" />

                                <div className="h-full flex flex-col justify-between">
                                    <div>
                                        <div className="w-10 h-10 bg-black text-white flex items-center justify-center mb-4">
                                            <Icon name="terminal" size={20} />
                                        </div>
                                        <h3 className="font-display text-2xl font-bold mb-2">Live Replay</h3>
                                        <p className="text-sm text-black/60">Step through attacks frame by frame.</p>
                                    </div>

                                    <div className="flex justify-end">
                                        <button className="w-12 h-12 rounded-full border border-black/10 flex items-center justify-center hover:bg-black hover:text-white transition-all">
                                            <Icon name="play" size={20} />
                                        </button>
                                    </div>
                                </div>
                            </Card>

                        </div>
                    </div>
                </section>


                <footer className="py-20 px-6 border-t border-white/5 bg-[#050508]">
                    <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-end gap-12">
                        <div>
                            <h1 className="font-display font-bold text-[12vw] leading-[0.8] tracking-tighter text-[#ff2d55]">REDLOOP</h1>
                        </div>
                        <div className="flex gap-8 mb-4">
                            <a href="#" className="font-mono text-xs hover:text-[#ff2d55] transition-colors">GITHUB</a>
                            <a href="#" className="font-mono text-xs hover:text-[#ff2d55] transition-colors">TWITTER</a>
                            <a href="#" className="font-mono text-xs hover:text-[#ff2d55] transition-colors">DISCORD</a>
                        </div>
                    </div>
                </footer>


                <Modal isOpen={isManifestoOpen} onClose={() => setIsManifestoOpen(false)} title="THE MANIFESTO">
                    <div className="prose prose-invert">
                        <p className="font-serif italic text-2xl text-white mb-6">&quot;Security is not a wall. It is an immune system.&quot;</p>
                        <div className="space-y-4 text-[#a0a0b0] text-sm leading-relaxed">
                            <p>For too long, cybersecurity has been reactive. We build walls, and hackers build taller ladders. It is a losing game.</p>
                            <p><span className="text-[#ff2d55]">RedLoop</span> fundamentally changes the physics of this conflict. Instead of waiting for an attack, we attack ourselves. Continuously. Relentlessly.</p>
                            <div className="mt-8 pt-6 border-t border-white/10 flex justify-end">
                                <Button variant="primary" size="sm" onClick={() => setIsManifestoOpen(false)}>ACKNOWLEDGE</Button>
                            </div>
                        </div>
                    </div>
                </Modal>

            </div>
        </PageTransition >
    );
}
