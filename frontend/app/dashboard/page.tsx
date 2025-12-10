'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Icon } from '../components/Icon';
import { Card, Badge, Button, PageTransition } from '../components/UI';
import { IconName } from '../types';
import { triggerScan, getHealth, getKestraStatus } from '../api';

const LiveTerminal = dynamic(() => import('./components/LiveTerminal'), {
    loading: () => <TerminalSkeleton />,
    ssr: false
});

const ExecutionStatus = dynamic(() => import('./components/ExecutionStatus'), {
    loading: () => <CardSkeleton />,
    ssr: false
});

const ScanHistory = dynamic(() => import('./components/ScanHistory'), {
    loading: () => <CardSkeleton />,
    ssr: false
});

interface LogEntry {
    id: number;
    type: string;
    msg: string;
    time: string;
}

interface ScanHistoryEntry {
    id: string;
    repoUrl: string;
    branch: string;
    status: 'running' | 'success' | 'failed';
    startTime: Date;
}

const TerminalSkeleton = () => (
    <div className="h-[350px] rounded-2xl bg-white/5 animate-pulse" />
);

const CardSkeleton = () => (
    <div className="h-[300px] rounded-2xl bg-white/5 animate-pulse" />
);

const NavItem: React.FC<{ icon: IconName; label: string; active?: boolean }> = ({ icon, label, active }) => (
    <motion.div
        whileHover={{ x: 4 }}
        className={`group flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all ${active
            ? 'bg-gradient-to-r from-[#ff2d55]/20 to-transparent border border-[#ff2d55]/20 text-white'
            : 'text-[#606070] hover:text-[#a0a0b0] hover:bg-white/5'
            }`}
    >
        <Icon name={icon} size={18} className={active ? 'text-[#ff2d55]' : 'group-hover:text-[#ff2d55] transition-colors'} />
        <span className="text-sm font-medium hidden md:block">{label}</span>
    </motion.div>
);

const StatusDot: React.FC<{ status: 'online' | 'offline' | 'checking'; label: string }> = ({ status, label }) => (
    <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${status === 'online' ? 'bg-[#22c55e]' : status === 'offline' ? 'bg-[#ff2d55]' : 'bg-yellow-500 animate-pulse'}`} />
        <span className="text-xs text-[#606070] font-mono">{label}</span>
    </div>
);

const ScanForm: React.FC<{
    onScanStart: (executionId: string, repoUrl: string, branch: string) => void;
    onLog: (log: { type: string; msg: string }) => void;
    disabled?: boolean;
}> = React.memo(({ onScanStart, onLog, disabled }) => {
    const [repoUrl, setRepoUrl] = useState('https://github.com/haroon0x/percolation-hypotheses-gen');
    const [branch, setBranch] = useState('main');
    const [isLoading, setIsLoading] = useState(false);
    const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
    const [kestraStatus, setKestraStatus] = useState<'checking' | 'online' | 'offline'>('checking');

    useEffect(() => {
        const checkStatus = async () => {
            try {
                await getHealth();
                setBackendStatus('online');
            } catch {
                setBackendStatus('offline');
            }
            try {
                const status = await getKestraStatus();
                setKestraStatus(status.status === 'online' ? 'online' : 'offline');
            } catch {
                setKestraStatus('offline');
            }
        };
        checkStatus();
        const interval = setInterval(checkStatus, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (disabled || !repoUrl.trim()) return;

        setIsLoading(true);
        onLog({ type: 'info', msg: `🚀 Starting security scan...` });
        onLog({ type: 'info', msg: `   Repository: ${repoUrl}` });
        onLog({ type: 'info', msg: `   Branch: ${branch}` });

        try {
            const result = await triggerScan(repoUrl, branch);
            if (result.success && result.execution_id) {
                onLog({ type: 'success', msg: `✓ Scan initiated: ${result.execution_id.substring(0, 12)}` });
                onScanStart(result.execution_id, repoUrl, branch);
            } else {
                onLog({ type: 'danger', msg: `✖ Failed: ${result.error || 'Unknown error'}` });
            }
        } catch (error) {
            onLog({ type: 'danger', msg: `✖ Error: ${error instanceof Error ? error.message : 'Connection error'}` });
        } finally {
            setIsLoading(false);
        }
    };

    const isReady = backendStatus === 'online' && kestraStatus === 'online';

    return (
        <Card className="p-6" glow={isReady}>
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-display font-bold text-lg flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-[#ff2d55]/20 flex items-center justify-center">
                        <Icon name="search" size={18} className="text-[#ff2d55]" />
                    </span>
                    New Scan
                </h3>
                <div className="flex gap-4">
                    <StatusDot status={backendStatus} label="API" />
                    <StatusDot status={kestraStatus} label="Engine" />
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="flex items-center justify-between text-xs font-mono text-[#606070] mb-2 uppercase tracking-wider">
                        <span>Repository URL</span>
                        <span className="text-[#ff2d55]">*</span>
                    </label>
                    <input
                        type="url"
                        value={repoUrl}
                        onChange={(e) => setRepoUrl(e.target.value)}
                        placeholder="https://github.com/user/repo"
                        className="w-full bg-[#0a0a0e] border border-white/10 rounded-xl px-4 py-3.5 text-sm font-mono text-white placeholder-[#404050] focus:outline-none focus:border-[#ff2d55]/50 focus:ring-2 focus:ring-[#ff2d55]/20 transition-all"
                        required
                        disabled={disabled}
                    />
                </div>

                <div>
                    <label className="block text-xs font-mono text-[#606070] mb-2 uppercase tracking-wider">Branch</label>
                    <input
                        type="text"
                        value={branch}
                        onChange={(e) => setBranch(e.target.value)}
                        placeholder="main"
                        className="w-full bg-[#0a0a0e] border border-white/10 rounded-xl px-4 py-3.5 text-sm font-mono text-white placeholder-[#404050] focus:outline-none focus:border-[#ff2d55]/50 focus:ring-2 focus:ring-[#ff2d55]/20 transition-all"
                        disabled={disabled}
                    />
                </div>

                <Button type="submit" variant="primary" size="lg" className="w-full" disabled={isLoading || !isReady || disabled}>
                    {isLoading ? (
                        <span className="flex items-center justify-center gap-2">
                            <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            Initiating...
                        </span>
                    ) : disabled ? (
                        <span className="flex items-center justify-center gap-2">
                            <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            Scanning...
                        </span>
                    ) : !isReady ? (
                        <span className="text-[#606070]">Services Offline</span>
                    ) : (
                        <span className="flex items-center justify-center gap-2">
                            <Icon name="attack" size={18} />
                            Start Security Scan
                        </span>
                    )}
                </Button>
            </form>
        </Card>
    );
});

ScanForm.displayName = 'ScanForm';

const EmptyState: React.FC = () => (
    <Card className="p-6 flex items-center justify-center min-h-[300px]">
        <div className="text-center">
            <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity }} className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-white/5 flex items-center justify-center">
                <Icon name="search" size={36} className="text-[#606070]" />
            </motion.div>
            <h4 className="text-lg font-display font-bold text-[#808090] mb-2">No Active Scan</h4>
            <p className="text-sm text-[#606070]">Enter a repository URL to start</p>
        </div>
    </Card>
);

export default function Dashboard() {
    const [logs, setLogs] = useState<LogEntry[]>([
        { id: 1, type: 'success', msg: '○ System online', time: new Date().toLocaleTimeString('en-US', { hour12: false }) },
        { id: 2, type: 'info', msg: '○ Ready for security scans', time: new Date().toLocaleTimeString('en-US', { hour12: false }) },
    ]);
    const [currentExecution, setCurrentExecution] = useState<{ id: string; repoUrl: string; branch: string } | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [scanHistory, setScanHistory] = useState<ScanHistoryEntry[]>([]);

    const addLog = useCallback((log: { type: string; msg: string }) => {
        setLogs(prev => [...prev.slice(-300), { id: Date.now() + Math.random(), ...log, time: new Date().toLocaleTimeString('en-US', { hour12: false }) }]);
    }, []);

    const handleScanStart = useCallback((executionId: string, repoUrl: string, branch: string) => {
        setCurrentExecution({ id: executionId, repoUrl, branch });
        setIsScanning(true);
        setScanHistory(prev => [{ id: executionId, repoUrl, branch, status: 'running', startTime: new Date() }, ...prev.slice(0, 9)]);
    }, []);

    const handleScanComplete = useCallback((status: 'success' | 'failed') => {
        setIsScanning(false);
        setScanHistory(prev => prev.map(entry => entry.id === currentExecution?.id ? { ...entry, status } : entry));
    }, [currentExecution]);

    return (
        <PageTransition>
            <div className="flex h-screen bg-[#050508] text-white font-sans overflow-hidden">
                <div className="fixed inset-0 bg-grid opacity-20" />
                <div className="fixed top-0 right-0 w-[800px] h-[800px] bg-[#ff2d55]/5 rounded-full blur-[200px]" />
                <div className="fixed bottom-0 left-0 w-[600px] h-[600px] bg-[#8b5cf6]/5 rounded-full blur-[150px]" />
                <div className="bg-noise" />

                <aside className="w-16 md:w-64 border-r border-white/5 flex flex-col z-20 bg-[#050508]/90 backdrop-blur-xl">
                    <div className="h-16 flex items-center justify-center md:justify-start md:px-5 border-b border-white/5">
                        <Link href="/" className="flex items-center gap-3">
                            <motion.div whileHover={{ rotate: 180 }} transition={{ duration: 0.5 }} className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff2d55] to-[#ff4d6d] flex items-center justify-center shadow-[0_0_30px_rgba(255,45,85,0.4)]">
                                <span className="text-white font-serif italic font-bold text-lg">R</span>
                            </motion.div>
                            <span className="hidden md:block font-display font-bold text-lg"><span className="text-[#ff2d55]">Red</span>Loop</span>
                        </Link>
                    </div>
                    <nav className="flex-1 p-3 space-y-1">
                        <NavItem icon="dashboard" label="Dashboard" active />
                        <NavItem icon="terminal" label="History" />
                        <NavItem icon="settings" label="Settings" />
                    </nav>
                    <div className="p-3 border-t border-white/5">
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ff2d55] to-[#8b5cf6] flex items-center justify-center text-sm font-bold">A</div>
                            <div className="hidden md:block">
                                <div className="text-sm font-medium">Admin</div>
                                <div className="text-xs text-[#606070]">Analyst</div>
                            </div>
                        </div>
                    </div>
                </aside>

                <main className="flex-1 flex flex-col overflow-hidden relative">
                    <header className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-[#050508]/80 backdrop-blur-md z-10">
                        <div className="flex items-center gap-4">
                            <h1 className="font-display font-bold text-xl">Security Scanner</h1>
                            <Badge text={isScanning ? "Scanning" : "Ready"} variant={isScanning ? "cyan" : "neutral"} pulse={isScanning} />
                        </div>
                        <a href="https://github.com/haroon0x/RedLoop" target="_blank" rel="noopener noreferrer">
                            <Button variant="secondary" size="sm" icon={<Icon name="github" size={14} />}>GitHub</Button>
                        </a>
                    </header>

                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                        <div className="max-w-7xl mx-auto space-y-6">
                            <div className="grid lg:grid-cols-2 gap-6">
                                <ScanForm onScanStart={handleScanStart} onLog={addLog} disabled={isScanning} />
                                <Suspense fallback={<CardSkeleton />}>
                                    {currentExecution ? (
                                        <ExecutionStatus executionId={currentExecution.id} repoUrl={currentExecution.repoUrl} onLog={addLog} onComplete={handleScanComplete} />
                                    ) : (
                                        <EmptyState />
                                    )}
                                </Suspense>
                            </div>
                            <Suspense fallback={<CardSkeleton />}>
                                <ScanHistory history={scanHistory} />
                            </Suspense>
                            <Suspense fallback={<TerminalSkeleton />}>
                                <LiveTerminal logs={logs} isScanning={isScanning} />
                            </Suspense>
                        </div>
                    </div>
                </main>
            </div>
        </PageTransition>
    );
}
