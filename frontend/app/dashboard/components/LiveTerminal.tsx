'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Button } from '../../components/UI';
import { Icon } from '../../components/Icon';
import { getExecutionLogs } from '../../api';

type LogLevel = 'all' | 'info' | 'success' | 'error';

interface LogEntry {
    id: number;
    type: string;
    msg: string;
    time: string;
    source?: 'local' | 'kestra';
}

interface LiveTerminalProps {
    logs: LogEntry[];
    isScanning: boolean;
    executionId?: string;
}

export default function LiveTerminal({ logs, isScanning, executionId }: LiveTerminalProps) {
    const [logLevel, setLogLevel] = useState<LogLevel>('all');
    const [isExpanded, setIsExpanded] = useState(true);
    const [kestraLogs, setKestraLogs] = useState<LogEntry[]>([]);
    const [isFetchingLogs, setIsFetchingLogs] = useState(false);
    const [showKestraLogs, setShowKestraLogs] = useState(false);
    const logEndRef = useRef<HTMLDivElement>(null);
    const lastLogCount = useRef(0);

    // Fetch Kestra logs when execution ID is available
    const fetchKestraLogs = useCallback(async () => {
        if (!executionId) return;

        setIsFetchingLogs(true);
        try {
            const result = await getExecutionLogs(executionId, 200);
            if (result.success && result.logs) {
                const formattedLogs: LogEntry[] = result.logs.map((log, index) => ({
                    id: Date.now() + index,
                    type: log.level === 'ERROR' ? 'danger' :
                        log.level === 'WARN' ? 'warning' :
                            log.level === 'INFO' ? 'info' : 'info',
                    msg: `[${log.task_id || 'system'}] ${log.message}`,
                    time: new Date(log.timestamp).toLocaleTimeString('en-US', { hour12: false }),
                    source: 'kestra' as const
                }));
                setKestraLogs(formattedLogs);
            }
        } catch (error) {
            console.error('Failed to fetch Kestra logs:', error);
        } finally {
            setIsFetchingLogs(false);
        }
    }, [executionId]);

    // Auto-fetch logs when scanning
    useEffect(() => {
        if (isScanning && executionId && showKestraLogs) {
            fetchKestraLogs();
            const interval = setInterval(fetchKestraLogs, 5000);
            return () => clearInterval(interval);
        }
    }, [isScanning, executionId, showKestraLogs, fetchKestraLogs]);

    // Auto-scroll on new logs
    useEffect(() => {
        const allLogs = showKestraLogs ? kestraLogs : logs;
        if (allLogs.length > lastLogCount.current) {
            logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            lastLogCount.current = allLogs.length;
        }
    }, [logs, kestraLogs, showKestraLogs]);

    const displayLogs = showKestraLogs ? kestraLogs : logs;

    const filteredLogs = displayLogs.filter(log => {
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
            <Card className={`flex flex-col transition-all ${isExpanded ? 'h-[400px]' : 'h-[56px]'}`} noPadding>
                <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="flex gap-1.5">
                            <button onClick={() => setIsExpanded(false)} className="w-3 h-3 rounded-full bg-[#ff2d55] hover:brightness-110" />
                            <button onClick={() => setIsExpanded(!isExpanded)} className="w-3 h-3 rounded-full bg-[#ffbd2e] hover:brightness-110" />
                            <button onClick={() => setIsExpanded(true)} className="w-3 h-3 rounded-full bg-[#27c93f] hover:brightness-110" />
                        </div>
                        <span className="font-mono text-xs text-[#606070]">
                            redloop — {showKestraLogs ? 'kestra logs' : 'live'} ({filteredLogs.length})
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        {/* Toggle between local and Kestra logs */}
                        <div className="flex items-center gap-0.5 bg-black/30 rounded-lg p-0.5">
                            <button
                                onClick={() => setShowKestraLogs(false)}
                                className={`px-2.5 py-1 text-xs font-mono rounded-md transition-all ${!showKestraLogs ? 'text-white bg-white/10' : 'text-[#606070] hover:text-white'
                                    }`}
                            >
                                App
                            </button>
                            <button
                                onClick={() => {
                                    setShowKestraLogs(true);
                                    if (kestraLogs.length === 0) fetchKestraLogs();
                                }}
                                className={`px-2.5 py-1 text-xs font-mono rounded-md transition-all ${showKestraLogs ? 'text-[#8b5cf6] bg-white/10' : 'text-[#606070] hover:text-white'
                                    }`}
                            >
                                Kestra
                            </button>
                        </div>

                        {/* Log level filter */}
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

                        {/* Refresh button for Kestra logs */}
                        {showKestraLogs && (
                            <button
                                onClick={fetchKestraLogs}
                                disabled={isFetchingLogs}
                                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                            >
                                {isFetchingLogs ? (
                                    <span className="w-4 h-4 border-2 border-[#8b5cf6]/30 border-t-[#8b5cf6] rounded-full animate-spin block" />
                                ) : (
                                    <Icon name="settings" size={14} className="text-[#606070]" />
                                )}
                            </button>
                        )}

                        <span className={`w-2 h-2 rounded-full ${isScanning ? 'bg-[#06b6d4] animate-pulse' : 'bg-[#22c55e]'}`} />
                    </div>
                </div>

                {isExpanded && (
                    <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#08080c]">
                        <div className="p-4 font-mono text-xs space-y-1">
                            {filteredLogs.length === 0 ? (
                                <div className="text-[#606070] text-center py-8">
                                    {showKestraLogs ? (
                                        executionId ? 'No Kestra logs yet. Click refresh or wait...' : 'Start a scan to see Kestra logs'
                                    ) : (
                                        'No logs yet'
                                    )}
                                </div>
                            ) : (
                                <AnimatePresence mode="popLayout">
                                    {filteredLogs.map((log) => (
                                        <motion.div
                                            key={log.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="flex gap-3 py-1 px-2 rounded hover:bg-white/5"
                                        >
                                            <span className="text-[#404050] shrink-0">[{log.time}]</span>
                                            {log.source === 'kestra' && (
                                                <span className="text-[#8b5cf6] shrink-0">K</span>
                                            )}
                                            <span className={`flex-1 break-all ${log.type === 'danger' ? 'text-[#ff2d55]' :
                                                    log.type === 'success' ? 'text-[#22c55e]' :
                                                        log.type === 'warning' ? 'text-[#ffbd2e]' :
                                                            'text-[#06b6d4]'
                                                }`}>
                                                {log.msg}
                                            </span>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            )}
                            <div ref={logEndRef} />
                        </div>
                    </div>
                )}
            </Card>
        </motion.div>
    );
}

