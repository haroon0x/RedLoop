'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Icon } from '../components/Icon';
import { Card, Badge, Button, PageTransition, Modal } from '../components/UI';
import { IconName } from '../types';
import {
    triggerScan,
    getHealth,
    getKestraStatus,
    createExecutionWebSocket,
    WebSocketMessage
} from '../api';

// ══════════════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════════════
type LogLevel = 'all' | 'info' | 'success' | 'error';

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

interface TaskState {
    status: string;
    message: string;
}

// ══════════════════════════════════════════════════════════════════════════
// NAV ITEM
// ══════════════════════════════════════════════════════════════════════════
const NavItem: React.FC<{ icon: IconName; label: string; active?: boolean; onClick?: () => void }> = ({ icon, label, active, onClick }) => (
    <motion.div
        whileHover={{ x: 4 }}
        onClick={onClick}
        className={`group flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all ${active
            ? 'bg-gradient-to-r from-[#ff2d55]/20 to-transparent border border-[#ff2d55]/20 text-white'
            : 'text-[#606070] hover:text-[#a0a0b0] hover:bg-white/5'
            }`}
    >
        <Icon name={icon} size={18} className={active ? 'text-[#ff2d55]' : 'group-hover:text-[#ff2d55] transition-colors'} />
        <span className="text-sm font-medium hidden md:block">{label}</span>
    </motion.div>
);

// ══════════════════════════════════════════════════════════════════════════
// STATUS DOT
// ══════════════════════════════════════════════════════════════════════════
const StatusDot: React.FC<{ status: 'online' | 'offline' | 'checking'; label: string }> = ({ status, label }) => (
    <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${status === 'online' ? 'bg-[#22c55e]' : status === 'offline' ? 'bg-[#ff2d55]' : 'bg-yellow-500 animate-pulse'}`} />
        <span className="text-xs text-[#606070] font-mono">{label}</span>
    </div>
);

// ══════════════════════════════════════════════════════════════════════════
// SCAN FORM
// ══════════════════════════════════════════════════════════════════════════
const ScanForm: React.FC<{
    onScanStart: (executionId: string, repoUrl: string, branch: string) => void;
    onLog: (log: { type: string; msg: string }) => void;
    disabled?: boolean;
}> = ({ onScanStart, onLog, disabled }) => {
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
};

// ══════════════════════════════════════════════════════════════════════════
// EXECUTION STATUS
// ══════════════════════════════════════════════════════════════════════════
const ExecutionStatus: React.FC<{
    executionId: string;
    repoUrl: string;
    onLog: (log: { type: string; msg: string }) => void;
    onComplete: (status: 'success' | 'failed') => void;
}> = ({ executionId, repoUrl, onLog, onComplete }) => {
    const [isConnected, setIsConnected] = useState(false);
    const [executionState, setExecutionState] = useState<'RUNNING' | 'SUCCESS' | 'FAILED'>('RUNNING');
    const [taskStates, setTaskStates] = useState<Record<string, TaskState>>({});
    const [elapsedTime, setElapsedTime] = useState(0);
    const wsRef = useRef<{ close: () => void } | null>(null);
    const hasConnectedRef = useRef(false);
    const onLogRef = useRef(onLog);
    const onCompleteRef = useRef(onComplete);
    onLogRef.current = onLog;
    onCompleteRef.current = onComplete;

    useEffect(() => {
        if (executionState !== 'RUNNING') return;
        const interval = setInterval(() => setElapsedTime(t => t + 1), 1000);
        return () => clearInterval(interval);
    }, [executionState]);

    useEffect(() => {
        const handleMessage = (data: WebSocketMessage) => {
            if (data.type === 'task_update' && data.task_id) {
                setTaskStates(prev => ({
                    ...prev,
                    [data.task_id!]: { status: data.status || 'RUNNING', message: data.message || '' }
                }));
                const logType = data.status === 'SUCCESS' ? 'success' : data.status === 'FAILED' ? 'danger' : 'info';
                onLogRef.current({ type: logType, msg: data.message || `Task ${data.task_id}` });

                if (data.task_id === 'complete' && data.status === 'SUCCESS') {
                    setExecutionState('SUCCESS');
                    onCompleteRef.current('success');
                }
            } else if (data.type === 'execution_update' && data.state === 'FAILED') {
                setExecutionState('FAILED');
                onLogRef.current({ type: 'danger', msg: data.message || '❌ Scan failed' });
                onCompleteRef.current('failed');
            }
        };

        const { close } = createExecutionWebSocket(executionId, handleMessage, () => setIsConnected(false), () => setIsConnected(false));
        wsRef.current = { close };
        setIsConnected(true);

        if (!hasConnectedRef.current) {
            onLogRef.current({ type: 'success', msg: '📡 Connected to real-time stream' });
            hasConnectedRef.current = true;
        }

        return () => close();
    }, [executionId]);

    const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

    const workflowStages = [
        { id: 'clone_repository', name: 'Clone', icon: '📥' },
        { id: 'adversary_kestra', name: 'Adversary Scan', icon: '🔴' },
        { id: 'summarizer_agent', name: 'Risk Analysis', icon: '📋' },
        { id: 'defender_agent', name: 'Generate Fixes', icon: '🛡️' },
        { id: 'complete', name: 'Complete', icon: '✅' },
    ];

    const completedCount = workflowStages.filter(s => taskStates[s.id]?.status === 'SUCCESS').length;
    const progress = (completedCount / workflowStages.length) * 100;

    const stateConfig = {
        RUNNING: { color: 'text-[#06b6d4]', bg: 'bg-[#06b6d4]/10', border: 'border-[#06b6d4]/30', barColor: '#06b6d4' },
        SUCCESS: { color: 'text-[#22c55e]', bg: 'bg-[#22c55e]/10', border: 'border-[#22c55e]/30', barColor: '#22c55e' },
        FAILED: { color: 'text-[#ff2d55]', bg: 'bg-[#ff2d55]/10', border: 'border-[#ff2d55]/30', barColor: '#ff2d55' },
    };
    const config = stateConfig[executionState];

    return (
        <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-bold text-lg flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-[#8b5cf6]/20 flex items-center justify-center">
                        <Icon name="terminal" size={18} className="text-[#8b5cf6]" />
                    </span>
                    Live Execution
                </h3>
                <div className="flex items-center gap-3">
                    <span className="font-mono text-sm text-[#606070] bg-white/5 px-2 py-1 rounded">{formatTime(elapsedTime)}</span>
                    <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#22c55e] animate-pulse' : 'bg-[#ff2d55]'}`} />
                </div>
            </div>

            <div className="mb-4 p-3 bg-white/5 rounded-xl border border-white/5">
                <div className="text-xs text-[#606070] font-mono mb-1">SCANNING</div>
                <div className="text-sm font-medium truncate">{repoUrl}</div>
            </div>

            <div className={`p-4 rounded-xl border mb-4 ${config.bg} ${config.border}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">{executionState === 'RUNNING' ? '⚡' : executionState === 'SUCCESS' ? '✓' : '✖'}</span>
                        <div>
                            <div className={`font-bold ${config.color}`}>{executionState}</div>
                            <div className="text-xs text-[#606070] font-mono">{executionId.substring(0, 16)}...</div>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className={`text-3xl font-bold ${config.color}`}>{Math.round(progress)}%</div>
                        <div className="text-xs text-[#606070]">{completedCount}/{workflowStages.length}</div>
                    </div>
                </div>
                <div className="mt-4 h-2 bg-black/30 rounded-full overflow-hidden">
                    <motion.div className="h-full rounded-full" style={{ backgroundColor: config.barColor }} initial={{ width: 0 }} animate={{ width: `${progress}%` }} />
                </div>
            </div>

            <div className="space-y-2">
                {workflowStages.map((stage) => {
                    const taskState = taskStates[stage.id];
                    const isCompleted = taskState?.status === 'SUCCESS';
                    const isActive = taskState?.status === 'RUNNING';
                    const isFailed = taskState?.status === 'FAILED';

                    return (
                        <motion.div
                            key={stage.id}
                            animate={{ opacity: isCompleted || isActive || isFailed ? 1 : 0.4 }}
                            className={`flex items-center gap-3 p-3 rounded-xl transition-all ${isCompleted ? 'bg-[#22c55e]/10 border border-[#22c55e]/20' :
                                isActive ? 'bg-[#06b6d4]/10 border border-[#06b6d4]/20' :
                                    isFailed ? 'bg-[#ff2d55]/10 border border-[#ff2d55]/20' : 'bg-white/5 border border-white/5'
                                }`}
                        >
                            <span className="text-xl">{stage.icon}</span>
                            <div className="flex-1 min-w-0">
                                <div className={`text-sm font-medium ${isCompleted ? 'text-[#22c55e]' : isActive ? 'text-[#06b6d4]' : isFailed ? 'text-[#ff2d55]' : 'text-[#606070]'}`}>
                                    {stage.name}
                                </div>
                                {taskState?.message && <div className="text-xs text-[#606070] truncate">{taskState.message}</div>}
                            </div>
                            {isCompleted && <span className="text-[#22c55e]">✓</span>}
                            {isActive && <span className="w-5 h-5 border-2 border-[#06b6d4]/30 border-t-[#06b6d4] rounded-full animate-spin" />}
                            {isFailed && <span className="text-[#ff2d55]">✖</span>}
                        </motion.div>
                    );
                })}
            </div>
        </Card>
    );
};

// ══════════════════════════════════════════════════════════════════════════
// LIVE TERMINAL
// ══════════════════════════════════════════════════════════════════════════
const LiveTerminal: React.FC<{ logs: LogEntry[]; isScanning: boolean }> = ({ logs, isScanning }) => {
    const [logLevel, setLogLevel] = useState<LogLevel>('all');
    const [isExpanded, setIsExpanded] = useState(true);
    const logEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    const filteredLogs = logs.filter(log => {
        if (logLevel === 'all') return true;
        if (logLevel === 'info') return ['info', 'success'].includes(log.type);
        if (logLevel === 'success') return log.type === 'success';
        if (logLevel === 'error') return ['danger', 'warning'].includes(log.type);
        return true;
    });

    const logLevels: { label: string; value: LogLevel; color: string }[] = [
        { label: 'All', value: 'all', color: 'text-white' },
        { label: 'Info', value: 'info', color: 'text-[#06b6d4]' },
        { label: 'Success', value: 'success', color: 'text-[#22c55e]' },
        { label: 'Errors', value: 'error', color: 'text-[#ff2d55]' },
    ];

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className={`flex flex-col transition-all ${isExpanded ? 'h-[350px]' : 'h-[56px]'}`} noPadding>
                <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="flex gap-1.5">
                            <button onClick={() => setIsExpanded(false)} className="w-3 h-3 rounded-full bg-[#ff2d55] hover:brightness-110" />
                            <button onClick={() => setIsExpanded(!isExpanded)} className="w-3 h-3 rounded-full bg-[#ffbd2e] hover:brightness-110" />
                            <button onClick={() => setIsExpanded(true)} className="w-3 h-3 rounded-full bg-[#27c93f] hover:brightness-110" />
                        </div>
                        <span className="font-mono text-xs text-[#606070]">redloop — live ({filteredLogs.length})</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-0.5 bg-black/30 rounded-lg p-0.5">
                            {logLevels.map((level) => (
                                <button
                                    key={level.value}
                                    onClick={() => setLogLevel(level.value)}
                                    className={`px-2.5 py-1 text-xs font-mono rounded-md transition-all ${logLevel === level.value ? `${level.color} bg-white/10` : 'text-[#606070] hover:text-white'}`}
                                >
                                    {level.label}
                                </button>
                            ))}
                        </div>
                        <span className={`w-2 h-2 rounded-full ${isScanning ? 'bg-[#06b6d4] animate-pulse' : 'bg-[#22c55e]'}`} />
                    </div>
                </div>

                {isExpanded && (
                    <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#08080c]">
                        <div className="p-4 font-mono text-xs space-y-1">
                            <AnimatePresence mode="popLayout">
                                {filteredLogs.map((log) => (
                                    <motion.div
                                        key={log.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="flex gap-3 py-1 px-2 rounded hover:bg-white/5"
                                    >
                                        <span className="text-[#404050] shrink-0">[{log.time}]</span>
                                        <span className={`flex-1 break-all ${log.type === 'danger' ? 'text-[#ff2d55]' : log.type === 'success' ? 'text-[#22c55e]' : log.type === 'warning' ? 'text-[#ffbd2e]' : 'text-[#06b6d4]'}`}>
                                            {log.msg}
                                        </span>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                            <div ref={logEndRef} />
                        </div>
                    </div>
                )}
            </Card>
        </motion.div>
    );
};

// ══════════════════════════════════════════════════════════════════════════
// EMPTY STATE
// ══════════════════════════════════════════════════════════════════════════
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

// ══════════════════════════════════════════════════════════════════════════
// SCAN HISTORY
// ══════════════════════════════════════════════════════════════════════════
const ScanHistory: React.FC<{ history: ScanHistoryEntry[] }> = ({ history }) => {
    if (history.length === 0) return null;

    return (
        <Card className="p-6">
            <h3 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
                <Icon name="terminal" size={18} className="text-[#606070]" />
                Recent Scans ({history.length})
            </h3>
            <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar">
                {history.map((entry) => (
                    <div key={entry.id} className="p-3 rounded-xl bg-white/5 border border-white/5">
                        <div className="flex items-center gap-3">
                            <span className={`w-2 h-2 rounded-full ${entry.status === 'success' ? 'bg-[#22c55e]' : entry.status === 'failed' ? 'bg-[#ff2d55]' : 'bg-[#06b6d4] animate-pulse'}`} />
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium truncate">{entry.repoUrl.replace('https://github.com/', '')}</div>
                                <div className="text-xs text-[#606070]">{entry.startTime.toLocaleTimeString()}</div>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded ${entry.status === 'success' ? 'bg-[#22c55e]/10 text-[#22c55e]' : entry.status === 'failed' ? 'bg-[#ff2d55]/10 text-[#ff2d55]' : 'bg-[#06b6d4]/10 text-[#06b6d4]'}`}>
                                {entry.status.toUpperCase()}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
};

// ══════════════════════════════════════════════════════════════════════════
// DASHBOARD PAGE
// ══════════════════════════════════════════════════════════════════════════
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

                {/* Sidebar */}
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

                {/* Main */}
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
                                {currentExecution ? (
                                    <ExecutionStatus executionId={currentExecution.id} repoUrl={currentExecution.repoUrl} onLog={addLog} onComplete={handleScanComplete} />
                                ) : (
                                    <EmptyState />
                                )}
                            </div>
                            <ScanHistory history={scanHistory} />
                            <LiveTerminal logs={logs} isScanning={isScanning} />
                        </div>
                    </div>
                </main>
            </div>
        </PageTransition>
    );
}
