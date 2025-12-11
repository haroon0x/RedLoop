'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../../components/UI';

type LogLevel = 'all' | 'info' | 'success' | 'error';

interface LogEntry {
    id: number;
    type: string;
    msg: string;
    time: string;
}

interface LiveTerminalProps {
    logs: LogEntry[];
    isScanning: boolean;
}

export default function LiveTerminal({ logs, isScanning }: LiveTerminalProps) {
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
}
