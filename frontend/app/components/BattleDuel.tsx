'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// THE CODE DUEL: Red Team vs Blue Team Battle Visualization
// POLISHED VERSION with FIRE 🔥

interface BattleLog {
    id: number;
    type: 'attack' | 'defense';
    text: string;
}

const attackSequence = [
    "Scanning target: api/auth/login.ts",
    "▸ SQL Injection vulnerability found",
    "Crafting payload: ' OR 1=1 --",
    "▸ Attempting authentication bypass...",
    "Escalating privileges...",
    "▸ Accessing /admin endpoint...",
    "Exfiltrating session tokens...",
    "▸ XSS in comment field detected",
    "Injecting script payload...",
    "▸ CVE-2024-1234 in lodash",
];

const defenseSequence = [
    "⚡ Threat detected in auth module",
    "✓ SQL injection blocked",
    "⚡ Input sanitization applied",
    "✓ Access denied. IP logged.",
    "⚡ Privilege check patched",
    "✓ Admin route secured",
    "⚡ Token rotation triggered",
    "✓ XSS attempt neutralized",
    "⚡ Upgrading lodash → 4.17.21",
    "✓ All vulnerabilities patched",
];

export default function BattleDuel() {
    const [attackLogs, setAttackLogs] = useState<BattleLog[]>([]);
    const [defenseLogs, setDefenseLogs] = useState<BattleLog[]>([]);
    const [stats, setStats] = useState({
        attacks: 0,
        blocked: 0,
        patched: 0,
        responseTime: 0.3
    });
    const [attackIndex, setAttackIndex] = useState(0);

    useEffect(() => {
        const attackInterval = setInterval(() => {
            setAttackIndex(prev => {
                const next = (prev + 1) % attackSequence.length;
                setAttackLogs(logs => [...logs, {
                    id: Date.now(),
                    type: 'attack' as const,
                    text: attackSequence[next]
                }].slice(-5));
                setStats(s => ({ ...s, attacks: s.attacks + 1 }));
                return next;
            });
        }, 1800);

        const defenseInterval = setInterval(() => {
            setDefenseLogs(logs => {
                const next = logs.length % defenseSequence.length;
                return [...logs, {
                    id: Date.now(),
                    type: 'defense' as const,
                    text: defenseSequence[next]
                }].slice(-5);
            });
            setStats(s => ({
                ...s,
                blocked: s.blocked + 1,
                patched: s.patched + (Math.random() > 0.3 ? 1 : 0),
                responseTime: Math.round((0.1 + Math.random() * 0.2) * 10) / 10
            }));
        }, 2000);

        return () => {
            clearInterval(attackInterval);
            clearInterval(defenseInterval);
        };
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="relative w-[520px] flex-shrink-0"
        >
            {/* Subtle glow that blends with video */}
            <div className="absolute -inset-8 bg-gradient-to-r from-red-500/10 via-transparent to-cyan-500/10 rounded-3xl blur-3xl opacity-50" />

            {/* Main Battle Container - Glassmorphism to blend */}
            <div className="relative rounded-xl overflow-hidden backdrop-blur-xl bg-black/50 border border-white/10 shadow-2xl">

                {/* Header Bar */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/5">
                    <div className="flex items-center gap-2">
                        <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"
                        />
                        <span className="text-[10px] font-bold tracking-[0.15em] text-white/80">LIVE BATTLE</span>
                    </div>
                    <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-white/20" />
                        <div className="w-2 h-2 rounded-full bg-white/20" />
                        <div className="w-2 h-2 rounded-full bg-white/20" />
                    </div>
                </div>

                {/* Dual Terminal View */}
                <div className="grid grid-cols-2">

                    {/* Red Team - Attacker */}
                    <div className="p-4 h-[200px] bg-gradient-to-br from-red-500/5 to-transparent border-r border-white/10">
                        <div className="flex items-center gap-2.5 mb-4">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                            <span className="text-xs font-bold tracking-[0.2em] text-red-400">RED TEAM</span>
                            <span className="text-[10px] text-red-500/50 ml-auto font-mono">ATTACKING</span>
                        </div>
                        <div className="space-y-2.5 font-mono text-[11px]">
                            <AnimatePresence mode="popLayout">
                                {attackLogs.map((log, i) => (
                                    <motion.div
                                        key={log.id}
                                        initial={{ opacity: 0, x: -20, filter: 'blur(4px)' }}
                                        animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                                        exit={{ opacity: 0, x: -10 }}
                                        transition={{ duration: 0.3 }}
                                        className={`text-red-400 ${i === attackLogs.length - 1 ? 'text-red-300' : 'text-red-400/70'}`}
                                    >
                                        <span className="text-red-600">$ </span>
                                        {log.text}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                            <motion.span
                                animate={{ opacity: [1, 0] }}
                                transition={{ duration: 0.6, repeat: Infinity }}
                                className="text-red-400 text-sm"
                            >
                                ▋
                            </motion.span>
                        </div>
                    </div>

                    {/* Blue Team - Defender */}
                    <div className="p-4 h-[200px] bg-gradient-to-bl from-cyan-500/10 to-transparent">
                        <div className="flex items-center gap-2.5 mb-4">
                            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                            <span className="text-xs font-bold tracking-[0.2em] text-cyan-400">BLUE TEAM</span>
                            <span className="text-[10px] text-cyan-500/50 ml-auto font-mono">DEFENDING</span>
                        </div>
                        <div className="space-y-2.5 font-mono text-[11px]">
                            <AnimatePresence mode="popLayout">
                                {defenseLogs.map((log, i) => (
                                    <motion.div
                                        key={log.id}
                                        initial={{ opacity: 0, x: 20, filter: 'blur(4px)' }}
                                        animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                                        exit={{ opacity: 0, x: 10 }}
                                        transition={{ duration: 0.3 }}
                                        className={`${i === defenseLogs.length - 1 ? 'text-cyan-300' : 'text-cyan-400/70'}`}
                                    >
                                        {log.text}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                            <motion.span
                                animate={{ opacity: [1, 0] }}
                                transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
                                className="text-cyan-400 text-sm"
                            >
                                ▋
                            </motion.span>
                        </div>
                    </div>
                </div>

                {/* Animated Divider Line */}
                <div className="absolute top-[45px] bottom-[60px] left-1/2 w-px">
                    <motion.div
                        className="w-full h-full bg-gradient-to-b from-red-500 via-purple-500 to-cyan-500"
                        animate={{
                            opacity: [0.3, 0.8, 0.3],
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                    />
                </div>

                {/* Live Stats Bar */}
                <div className="grid grid-cols-4 border-t border-white/10 bg-black/60">
                    <StatBox
                        label="ATTACKS"
                        value={stats.attacks}
                        color="text-red-400"
                        bgColor="bg-red-500/10"
                        icon="⚔️"
                    />
                    <StatBox
                        label="BLOCKED"
                        value={stats.blocked}
                        color="text-cyan-400"
                        bgColor="bg-cyan-500/10"
                        icon="🛡️"
                    />
                    <StatBox
                        label="PATCHED"
                        value={stats.patched}
                        color="text-green-400"
                        bgColor="bg-green-500/10"
                        icon="🔧"
                    />
                    <StatBox
                        label="RESPONSE"
                        value={`${stats.responseTime}s`}
                        color="text-yellow-400"
                        bgColor="bg-yellow-500/10"
                        icon="⚡"
                    />
                </div>
            </div>
        </motion.div>
    );
}

function StatBox({ label, value, color, bgColor, icon }: { label: string; value: string | number; color: string; bgColor: string; icon: string }) {
    return (
        <div className={`${bgColor} px-4 py-4 text-center border-r border-white/5 last:border-r-0`}>
            <div className="flex items-center justify-center gap-1.5 mb-1">
                <span className="text-sm">{icon}</span>
                <span className="text-[10px] font-bold tracking-wider text-white/50">{label}</span>
            </div>
            <motion.div
                key={String(value)}
                initial={{ scale: 1.3, filter: 'brightness(1.5)' }}
                animate={{ scale: 1, filter: 'brightness(1)' }}
                transition={{ duration: 0.3 }}
                className={`text-lg font-bold font-mono ${color}`}
            >
                {value}
            </motion.div>
        </div>
    );
}
