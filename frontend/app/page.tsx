'use client';

import React, { useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import { Icon } from './components/Icon';
import { Button, Card, Badge, PageTransition, Modal } from './components/UI';


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
                            <stop offset="50%" stopColor="#8b5cf6" />
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
                            fill={i === 0 ? "#ff2d55" : i === 1 ? "#8b5cf6" : "#06b6d4"}
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


export default function Landing() {
    const { scrollY } = useScroll();
    const y1 = useTransform(scrollY, [0, 500], [0, 200]);
    const y2 = useTransform(scrollY, [0, 500], [0, -200]);
    const rotate = useTransform(scrollY, [0, 1000], [0, 45]);

    const [isManifestoOpen, setIsManifestoOpen] = useState(false);

    return (
        <PageTransition>
            <div className="min-h-screen bg-[#050508] text-white overflow-x-hidden selection:bg-[#ff2d55] selection:text-white">
                <div className="bg-noise opacity-50" />
                <div className="bg-grid opacity-30" />


                <motion.nav
                    initial={{ y: -100 }}
                    animate={{ y: 0 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4"
                >
                    <div className="w-full max-w-[1400px] neo-glass rounded-2xl flex items-center justify-between p-2">
                        {/* 1. Identity Module */}
                        <div className="flex items-center gap-4 px-6 py-2 border-r border-white/5">
                            <Link href="/" className="group flex items-center gap-3">
                                <div className="relative w-8 h-8 flex items-center justify-center bg-white/5 rounded-lg border border-white/10 overflow-hidden group-hover:border-[#ff2d55]/50 transition-colors">
                                    <div className="absolute inset-0 bg-gradient-to-tr from-[#ff2d55] to-transparent opacity-0 group-hover:opacity-20 transition-opacity" />
                                    <span className="font-display font-bold text-[#ff2d55]">R</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-display font-bold tracking-tight text-sm leading-none">REDLOOP</span>
                                    <span className="font-mono text-[9px] text-[#505060] tracking-widest uppercase">Defense Protocol</span>
                                </div>
                            </Link>
                        </div>

                        {/* 2. Navigation Module */}
                        <div className="hidden md:flex items-center bg-white/5 rounded-xl px-1 py-1 gap-1 border border-white/5">
                            {[
                                { name: 'Vision', href: '#vision', i: '01' },
                                { name: 'Capabilities', href: '#capabilities', i: '02' },
                                { name: 'System', href: '#system', i: '03' }
                            ].map((item) => (
                                <a
                                    key={item.name}
                                    href={item.href}
                                    className="px-5 py-2 rounded-lg hover:bg-white/5 transition-all flex items-center gap-2 group relative overflow-hidden"
                                >
                                    <span className="font-mono text-[9px] text-[#505060] group-hover:text-[#ff2d55] transition-colors">{item.i}</span>
                                    <span className="font-sans text-xs font-medium tracking-wide text-[#a0a0b0] group-hover:text-white transition-colors uppercase">{item.name}</span>
                                </a>
                            ))}
                        </div>

                        {/* 3. Status & Action Module */}
                        <div className="flex items-center gap-4 pl-6 border-l border-white/5">
                            <div className="hidden lg:flex flex-col items-end mr-4">
                                <span className="font-mono text-[9px] text-[#505060]">v2.4.0-stable</span>
                            </div>

                            <Link href="/dashboard">
                                <button className="relative group overflow-hidden px-5 py-2.5 rounded-xl bg-white text-black font-semibold text-xs tracking-wide uppercase transition-transform active:scale-95">
                                    <div className="absolute inset-0 bg-gradient-to-r from-[#ff2d55] to-[#ff2d55] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    <span className="relative z-10 group-hover:text-white transition-colors flex items-center gap-2">
                                        <span>Console</span>
                                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="opacity-60 group-hover:opacity-100 transition-opacity">
                                            <path d="M1 9L9 1M9 1H3M9 1V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </span>
                                </button>
                            </Link>
                        </div>
                    </div>
                </motion.nav>


                <section className="relative min-h-screen flex flex-col justify-center px-6 overflow-hidden pt-20">
                    {/* Hero Noise Mask */}
                    <div className="absolute inset-0 bg-noise opacity-30 pointer-events-none z-[5]" />

                    {/* Background Typography */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5 select-none overflow-hidden">
                        <motion.div style={{ rotate }} className="relative w-[200vw] h-[200vw]">
                            <svg viewBox="0 0 100 100" className="w-full h-full animate-spin-slow-reverse">
                                <path id="circlePath" d="M 50, 50 m -37, 0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0" fill="none" />
                                <text fontSize="11" fill="white" letterSpacing="2">
                                    <textPath href="#circlePath">
                                        AUTONOMOUS DEFENSE · ADVERSARIAL AI · REDLOOP PROTOCOL ·
                                    </textPath>
                                </text>
                            </svg>
                        </motion.div>
                    </div>

                    {/* Enhanced Background Orbs */}
                    <div className="absolute top-[20%] right-[10%] w-[600px] h-[600px] bg-[#ff2d55]/30 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />
                    <div className="absolute bottom-[10%] left-[5%] w-[500px] h-[500px] bg-[#8b5cf6]/20 rounded-full blur-[100px] pointer-events-none mix-blend-screen" />

                    <div className="max-w-[1600px] mx-auto w-full grid lg:grid-cols-2 gap-12 items-center relative z-10">
                        {/* Left: The Statement */}
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                        >
                            <div className="flex items-center gap-4 mb-8">
                                <span className="w-12 h-[1px] bg-[#ff2d55]"></span>
                                <span className="font-mono text-[#ff2d55] text-xs">SYS.STATUS: ONLINE</span>
                            </div>

                            <h1 className="font-serif italic text-7xl md:text-9xl mb-4 leading-[0.9]">
                                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50">Security</span>
                                <span className="block text-[#ff2d55]">Evolved.</span>
                            </h1>

                            <p className="text-xl text-[#a0a0b0] max-w-md mt-8 leading-relaxed">
                                The immune system for your codebase. We use adversarial AI to attack your software before hackers do.
                            </p>

                            <div className="mt-12 flex items-center gap-8">
                                <Link href="/dashboard">
                                    <Button variant="primary" size="lg" className="rounded-none border-0 bg-[#ff2d55] hover:bg-[#ff4d6d] text-white px-10">
                                        INITIATE SEQUENCE
                                    </Button>
                                </Link>

                                <button onClick={() => setIsManifestoOpen(true)} className="flex items-center gap-2 group">
                                    <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all">
                                        <Icon name="chevronRight" size={16} />
                                    </div>
                                    <span className="font-mono text-xs">MANIFESTO</span>
                                </button>
                            </div>
                        </motion.div>

                        {/* Right: The Visual Glitch */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 1, delay: 0.2 }}
                            className="relative h-[500px] w-full hidden lg:block"
                        >
                            {/* Abstract Composition */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-[#ff2d55]/20 to-transparent clip-path-polygon" />

                            <motion.div
                                style={{ y: y2 }}
                                className="absolute top-10 right-10 w-64 h-80 neo-glass rounded-lg p-6 z-20"
                            >
                                <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
                                    <div className="font-mono text-xs text-[#ff2d55]">ATTACK_VECTOR.EXE</div>
                                    <div className="flex gap-1">
                                        <div className="w-2 h-2 rounded-full bg-[#ff2d55]"></div>
                                        <div className="w-2 h-2 rounded-full bg-[#ff2d55] animate-ping"></div>
                                    </div>
                                </div>
                                <div className="font-mono text-[10px] space-y-2 text-[#a0a0b0]">
                                    <div className="text-white">&gt; Initiating SQL Injection...</div>
                                    <div>User input sanitization failed.</div>
                                    <div className="text-[#ff2d55]">! CRITICAL VULNERABILITY FOUND</div>
                                    <div className="h-[1px] w-full bg-white/10 my-4"></div>
                                    <div className="text-white">&gt; Deploying Patch v2.1...</div>
                                    <div className="text-[#22c55e]">✓ Fixed. PR Created.</div>
                                </div>
                            </motion.div>

                            <motion.div
                                style={{ y: y1 }}
                                className="absolute bottom-10 left-10 w-64 h-64 bg-[#0a0a10] border border-[#ff2d55]/30 z-10 flex items-center justify-center"
                            >
                                <div className="text-center">
                                    <div className="font-display text-6xl font-bold text-white">99.9%</div>
                                    <div className="font-mono text-xs text-[#ff2d55] mt-2">IMMUNITY SCORE</div>
                                </div>
                            </motion.div>
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

                            {/* 2. SECONDARY - Neural Genome (Purple) */}
                            <Card className="bg-[#121218] border-[#8b5cf6]/20 group relative overflow-hidden" glow>
                                <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:opacity-100 transition-opacity">
                                    <Icon name="genome" size={48} className="text-[#8b5cf6]" />
                                </div>

                                <div className="h-full flex flex-col justify-between">
                                    <div>
                                        <Badge text="Analysis" variant="purple" />
                                        <h3 className="font-serif italic text-3xl text-white mt-4">Neural<br />Genome</h3>
                                    </div>

                                    <div className="flex items-end gap-1 h-32 mt-8 opacity-60 group-hover:opacity-100 transition-opacity">
                                        {[40, 70, 45, 90, 60, 80, 50].map((h, i) => (
                                            <div key={i} className="flex-1 bg-[#8b5cf6]" style={{ height: `${h}%` }}></div>
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
        </PageTransition>
    );
}
