'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Icon } from '../components/Icon';
import { Card, Badge, Button, PageTransition, AnimatedCounter } from '../components/UI';
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
    BarChart,
    Bar
} from 'recharts';
import { IconName } from '../types';

// ══════════════════════════════════════════════════════════════════════════
// DATA
// ══════════════════════════════════════════════════════════════════════════
const VELOCITY_DATA = [
    { time: '00:00', attacks: 12, blocked: 12 },
    { time: '04:00', attacks: 28, blocked: 27 },
    { time: '08:00', attacks: 45, blocked: 44 },
    { time: '12:00', attacks: 62, blocked: 61 },
    { time: '16:00', attacks: 78, blocked: 77 },
    { time: '20:00', attacks: 34, blocked: 34 },
    { time: '24:00', attacks: 18, blocked: 18 },
];

const GENOME_DATA = [
    { subject: 'SQLi', score: 95, fullMark: 100 },
    { subject: 'XSS', score: 88, fullMark: 100 },
    { subject: 'Auth', score: 92, fullMark: 100 },
    { subject: 'CSRF', score: 85, fullMark: 100 },
    { subject: 'RCE', score: 78, fullMark: 100 },
    { subject: 'SSRF', score: 82, fullMark: 100 },
];

const CATEGORY_DATA = [
    { name: 'SQLi', value: 34, color: '#ff2d55' },
    { name: 'XSS', value: 28, color: '#8b5cf6' },
    { name: 'Auth', value: 22, color: '#06b6d4' },
    { name: 'Other', value: 16, color: '#606070' },
];

const INITIAL_LOGS = [
    { id: 1, type: 'success', msg: 'System initialized successfully', time: '10:00:00' },
    { id: 2, type: 'info', msg: 'Deep scan started on ./src', time: '10:00:05' },
    { id: 3, type: 'warning', msg: 'Potential vulnerability in auth.ts:142', time: '10:01:23' },
    { id: 4, type: 'danger', msg: 'CRITICAL: SQL Injection detected', time: '10:01:45' },
    { id: 5, type: 'success', msg: 'Patch generated and validated', time: '10:01:52' },
];

// ══════════════════════════════════════════════════════════════════════════
// CUSTOM TOOLTIP
// ══════════════════════════════════════════════════════════════════════════
const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string }>; label?: string }) => {
    if (!active || !payload) return null;
    return (
        <div className="glass rounded-lg p-3 border border-white/10">
            <p className="text-xs text-[#606070] mb-1">{label}</p>
            {payload.map((p, i) => (
                <p key={i} className="text-sm font-mono" style={{ color: i === 0 ? '#ff2d55' : '#8b5cf6' }}>
                    {p.name}: {p.value}
                </p>
            ))}
        </div>
    );
};

// ══════════════════════════════════════════════════════════════════════════
// STAT CARD
// ══════════════════════════════════════════════════════════════════════════
const StatCard: React.FC<{
    title: string;
    value: number;
    suffix?: string;
    trend?: string;
    trendUp?: boolean;
    icon: IconName;
    color: 'red' | 'purple' | 'cyan' | 'neutral';
    delay?: number;
}> = ({ title, value, suffix = '', trend, trendUp = true, icon, color, delay = 0 }) => {
    const colors = {
        red: 'from-[#ff2d55]/10 to-transparent border-[#ff2d55]/20',
        purple: 'from-[#8b5cf6]/10 to-transparent border-[#8b5cf6]/20',
        cyan: 'from-[#06b6d4]/10 to-transparent border-[#06b6d4]/20',
        neutral: 'from-white/5 to-transparent border-white/10',
    };

    const iconColors = {
        red: 'text-[#ff2d55]',
        purple: 'text-[#8b5cf6]',
        cyan: 'text-[#06b6d4]',
        neutral: 'text-[#a0a0b0]',
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.4 }}
        >
            <Card className={`p-5 bg-gradient-to-b ${colors[color]}`}>
                <div className="flex justify-between items-start mb-4">
                    <div className={`w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center ${iconColors[color]}`}>
                        <Icon name={icon} size={20} />
                    </div>
                    {trend && (
                        <span className={`text-xs font-mono px-2 py-1 rounded ${trendUp ? 'text-[#22c55e] bg-[#22c55e]/10' : 'text-[#ff2d55] bg-[#ff2d55]/10'}`}>
                            {trendUp ? '↑' : '↓'} {trend}
                        </span>
                    )}
                </div>
                <div className="text-3xl font-display font-bold mb-1">
                    <AnimatedCounter value={value} suffix={suffix} />
                </div>
                <div className="text-sm text-[#606070] font-mono uppercase tracking-wider">{title}</div>
            </Card>
        </motion.div>
    );
};

// ══════════════════════════════════════════════════════════════════════════
// NAV ITEM
// ══════════════════════════════════════════════════════════════════════════
const NavItem: React.FC<{ icon: IconName; label: string; active?: boolean; badge?: string }> = ({ icon, label, active, badge }) => (
    <motion.div
        whileHover={{ x: 4 }}
        className={`group flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-all ${active
                ? 'bg-gradient-to-r from-[#ff2d55]/20 to-transparent border border-[#ff2d55]/20 text-white'
                : 'text-[#606070] hover:text-[#a0a0b0] hover:bg-white/5'
            }`}
    >
        <div className="flex items-center gap-3">
            <Icon name={icon} size={18} className={active ? 'text-[#ff2d55]' : 'group-hover:text-[#ff2d55] transition-colors'} />
            <span className="text-sm font-medium hidden md:block">{label}</span>
        </div>
        {badge && (
            <span className="bg-[#ff2d55] text-white text-[10px] font-bold px-1.5 py-0.5 rounded animate-pulse">
                {badge}
            </span>
        )}
    </motion.div>
);

// ══════════════════════════════════════════════════════════════════════════
// DASHBOARD PAGE
// ══════════════════════════════════════════════════════════════════════════
export default function Dashboard() {
    const [logs, setLogs] = useState(INITIAL_LOGS);
    const [timeRange, setTimeRange] = useState('24H');
    const logEndRef = useRef<HTMLDivElement>(null);

    // Simulate live logs
    useEffect(() => {
        const messages = [
            { type: 'info', msg: 'Scanning new commit...' },
            { type: 'success', msg: 'No vulnerabilities found' },
            { type: 'warning', msg: 'Deprecated dependency detected' },
            { type: 'info', msg: 'Running SAST analysis...' },
            { type: 'success', msg: 'All security checks passed' },
        ];

        const interval = setInterval(() => {
            const random = messages[Math.floor(Math.random() * messages.length)];
            const newLog = {
                id: Date.now(),
                type: random.type,
                msg: random.msg,
                time: new Date().toLocaleTimeString('en-US', { hour12: false })
            };
            setLogs(prev => [...prev.slice(-12), newLog]);
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    return (
        <PageTransition>
            <div className="flex h-screen bg-[#050508] text-white font-sans overflow-hidden">
                {/* Background */}
                <div className="fixed inset-0 bg-grid opacity-30" />
                <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-[#ff2d55]/5 rounded-full blur-[150px]" />
                <div className="fixed bottom-0 left-0 w-[400px] h-[400px] bg-[#8b5cf6]/5 rounded-full blur-[100px]" />
                <div className="bg-noise" />

                {/* Sidebar */}
                <aside className="w-16 md:w-64 border-r border-white/5 flex flex-col z-20 bg-[#050508]/80 backdrop-blur-xl">
                    {/* Logo */}
                    <div className="h-16 flex items-center justify-center md:justify-start md:px-5 border-b border-white/5">
                        <Link href="/" className="flex items-center gap-3 group">
                            <motion.div
                                whileHover={{ rotate: 180 }}
                                transition={{ duration: 0.5 }}
                                className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#ff2d55] to-[#ff4d6d] flex items-center justify-center shadow-[0_0_20px_rgba(255,45,85,0.4)]"
                            >
                                <span className="text-white font-serif italic font-bold">R</span>
                            </motion.div>
                            <span className="hidden md:block font-display font-bold">
                                <span className="text-[#ff2d55]">Red</span>Loop
                            </span>
                        </Link>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 p-3 space-y-1">
                        <NavItem icon="dashboard" label="Overview" active />
                        <NavItem icon="attack" label="Threats" badge="3" />
                        <NavItem icon="genome" label="Genome" />
                        <NavItem icon="terminal" label="Logs" />
                        <NavItem icon="settings" label="Settings" />
                    </nav>

                    {/* User */}
                    <div className="p-3 border-t border-white/5">
                        <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#ff2d55] to-[#8b5cf6] flex items-center justify-center text-sm font-bold">
                                A
                            </div>
                            <div className="hidden md:block">
                                <div className="text-sm font-medium">Admin</div>
                                <div className="text-xs text-[#606070]">Level 5 Access</div>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 flex flex-col overflow-hidden relative">
                    {/* Header */}
                    <header className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-[#050508]/50 backdrop-blur-md z-10">
                        <div className="flex items-center gap-4">
                            <h1 className="font-display font-bold text-xl">Dashboard</h1>
                            <Badge text="Live" variant="red" pulse />
                        </div>
                        <div className="flex items-center gap-3">
                            <a href="https://github.com/haroon0x/RedLoop" target="_blank" rel="noopener noreferrer">
                                <Button variant="secondary" size="sm" icon={<Icon name="github" size={14} />}>
                                    Repository
                                </Button>
                            </a>
                        </div>
                    </header>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                        <div className="max-w-7xl mx-auto space-y-6">

                            {/* Stats Row */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <StatCard title="Immunity Score" value={98} suffix="%" trend="2.4%" trendUp icon="defend" color="cyan" delay={0} />
                                <StatCard title="Threats Blocked" value={1247} suffix="" trend="12" trendUp icon="attack" color="red" delay={0.1} />
                                <StatCard title="Avg Response" value={42} suffix="ms" trend="5ms" trendUp={false} icon="terminal" color="purple" delay={0.2} />
                                <StatCard title="Files Scanned" value={2847} suffix="" trend="147" trendUp icon="search" color="neutral" delay={0.3} />
                            </div>

                            {/* Charts Row */}
                            <div className="grid lg:grid-cols-3 gap-6">
                                {/* Attack Velocity - Large */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className="lg:col-span-2"
                                >
                                    <Card className="h-full">
                                        <div className="flex justify-between items-center mb-6">
                                            <h3 className="font-display font-bold flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-[#ff2d55] animate-pulse" />
                                                Attack Velocity
                                            </h3>
                                            <div className="flex gap-1 bg-white/5 rounded-lg p-1">
                                                {['1H', '24H', '7D'].map((t) => (
                                                    <button
                                                        key={t}
                                                        onClick={() => setTimeRange(t)}
                                                        className={`px-3 py-1.5 text-xs font-mono rounded-md transition-all ${timeRange === t
                                                                ? 'bg-[#ff2d55]/20 text-[#ff2d55]'
                                                                : 'text-[#606070] hover:text-white'
                                                            }`}
                                                    >
                                                        {t}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="h-[280px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={VELOCITY_DATA}>
                                                    <defs>
                                                        <linearGradient id="attackGradient" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="0%" stopColor="#ff2d55" stopOpacity={0.3} />
                                                            <stop offset="100%" stopColor="#ff2d55" stopOpacity={0} />
                                                        </linearGradient>
                                                        <linearGradient id="blockedGradient" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.2} />
                                                            <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#606070', fontSize: 11 }} />
                                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#606070', fontSize: 11 }} />
                                                    <Tooltip content={<CustomTooltip />} />
                                                    <Area type="monotone" dataKey="attacks" name="Attacks" stroke="#ff2d55" strokeWidth={2} fill="url(#attackGradient)" />
                                                    <Area type="monotone" dataKey="blocked" name="Blocked" stroke="#8b5cf6" strokeWidth={2} fill="url(#blockedGradient)" />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </Card>
                                </motion.div>

                                {/* Security Genome */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 }}
                                >
                                    <Card className="h-full">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="font-display font-bold flex items-center gap-2">
                                                <Icon name="genome" size={16} className="text-[#8b5cf6]" />
                                                Security Genome
                                            </h3>
                                            <Badge text="Live" variant="purple" pulse />
                                        </div>
                                        <div className="h-[280px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <RadarChart data={GENOME_DATA}>
                                                    <PolarGrid stroke="rgba(255,255,255,0.08)" />
                                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#606070', fontSize: 10 }} />
                                                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                                    <Radar
                                                        name="Score"
                                                        dataKey="score"
                                                        stroke="#8b5cf6"
                                                        strokeWidth={2}
                                                        fill="#8b5cf6"
                                                        fillOpacity={0.2}
                                                    />
                                                </RadarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </Card>
                                </motion.div>
                            </div>

                            {/* Bottom Row */}
                            <div className="grid lg:grid-cols-2 gap-6">
                                {/* Live Terminal */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.6 }}
                                >
                                    <Card className="h-[400px] flex flex-col" noPadding>
                                        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="flex gap-1.5">
                                                    <div className="w-3 h-3 rounded-full bg-[#ff2d55]" />
                                                    <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                                                    <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
                                                </div>
                                                <span className="font-mono text-xs text-[#606070]">redloop — live</span>
                                            </div>
                                            <span className="w-2 h-2 rounded-full bg-[#ff2d55] animate-pulse" />
                                        </div>

                                        <div className="flex-1 p-4 font-mono text-xs overflow-y-auto space-y-2 custom-scrollbar">
                                            <AnimatePresence mode="popLayout">
                                                {logs.map((log) => (
                                                    <motion.div
                                                        key={log.id}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        exit={{ opacity: 0, x: 10 }}
                                                        className="flex gap-3"
                                                    >
                                                        <span className="text-[#606070] shrink-0">[{log.time}]</span>
                                                        <span className={`shrink-0 ${log.type === 'danger' ? 'text-[#ff2d55]' :
                                                                log.type === 'success' ? 'text-[#22c55e]' :
                                                                    log.type === 'warning' ? 'text-[#ffbd2e]' :
                                                                        'text-[#06b6d4]'
                                                            }`}>
                                                            {log.type === 'danger' && '✖'}
                                                            {log.type === 'success' && '✓'}
                                                            {log.type === 'warning' && '⚠'}
                                                            {log.type === 'info' && '○'}
                                                        </span>
                                                        <span className="text-[#a0a0b0]">{log.msg}</span>
                                                    </motion.div>
                                                ))}
                                            </AnimatePresence>
                                            <div ref={logEndRef} />
                                        </div>

                                        <div className="px-4 py-3 border-t border-white/5 bg-white/[0.02]">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[#ff2d55]">$</span>
                                                <input
                                                    type="text"
                                                    placeholder="Enter command..."
                                                    className="flex-1 bg-transparent border-none outline-none text-xs font-mono text-white placeholder-[#606070]"
                                                />
                                            </div>
                                        </div>
                                    </Card>
                                </motion.div>

                                {/* Threat Breakdown */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.7 }}
                                >
                                    <Card className="h-[400px]">
                                        <h3 className="font-display font-bold mb-6 flex items-center gap-2">
                                            <Icon name="attack" size={16} className="text-[#ff2d55]" />
                                            Threat Categories
                                        </h3>
                                        <div className="h-[180px] mb-6">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={CATEGORY_DATA} layout="vertical">
                                                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#606070', fontSize: 11 }} />
                                                    <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#a0a0b0', fontSize: 12 }} width={50} />
                                                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                                        {CATEGORY_DATA.map((entry, index) => (
                                                            <motion.rect
                                                                key={index}
                                                                initial={{ width: 0 }}
                                                                animate={{ width: '100%' }}
                                                                transition={{ delay: 0.8 + index * 0.1 }}
                                                                fill={entry.color}
                                                            />
                                                        ))}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>

                                        {/* Legend */}
                                        <div className="grid grid-cols-2 gap-3">
                                            {CATEGORY_DATA.map((item) => (
                                                <div key={item.name} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                                                        <span className="text-sm text-[#a0a0b0]">{item.name}</span>
                                                    </div>
                                                    <span className="font-mono text-sm font-medium">{item.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </Card>
                                </motion.div>
                            </div>

                        </div>
                    </div>
                </main>
            </div>
        </PageTransition>
    );
}
