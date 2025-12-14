'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '../../components/Icon';
import { Card, Button } from '../../components/UI';
import { replayExecution } from '../../api';

export interface ScanHistoryEntry {
    id: string;
    repoUrl: string;
    branch: string;
    status: 'running' | 'success' | 'failed' | 'killed';
    startTime: string; // ISO string for storage
    outputs?: Record<string, string>;
}

interface ScanHistoryProps {
    history: ScanHistoryEntry[];
    onHistoryChange?: (history: ScanHistoryEntry[]) => void;
    onSelectEntry?: (entry: ScanHistoryEntry) => void;
    onReplay?: (newExecutionId: string, repoUrl: string, branch: string) => void;
    selectedId?: string;
}

const STORAGE_KEY = 'redloop_scan_history';

// Helper to load history from localStorage
export function loadHistoryFromStorage(): ScanHistoryEntry[] {
    if (typeof window === 'undefined') return [];
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (error) {
        console.error('Failed to load history:', error);
    }
    return [];
}

// Helper to save history to localStorage
export function saveHistoryToStorage(history: ScanHistoryEntry[]): void {
    if (typeof window === 'undefined') return;
    try {
        // Keep only last 20 entries
        const trimmed = history.slice(0, 20);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch (error) {
        console.error('Failed to save history:', error);
    }
}

export default function ScanHistory({
    history,
    onHistoryChange,
    onSelectEntry,
    onReplay,
    selectedId
}: ScanHistoryProps) {
    const [replayingId, setReplayingId] = useState<string | null>(null);
    const [isExpanded, setIsExpanded] = useState(true);

    // Save to localStorage whenever history changes
    useEffect(() => {
        if (history.length > 0) {
            saveHistoryToStorage(history);
        }
    }, [history]);

    const handleReplay = async (entry: ScanHistoryEntry, e: React.MouseEvent) => {
        e.stopPropagation();
        setReplayingId(entry.id);
        try {
            const result = await replayExecution(entry.id);
            if (result.success && result.new_execution_id) {
                onReplay?.(result.new_execution_id, entry.repoUrl, entry.branch);
            }
        } catch (error) {
            console.error('Replay failed:', error);
        } finally {
            setReplayingId(null);
        }
    };

    const handleClearHistory = () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem(STORAGE_KEY);
        }
        onHistoryChange?.([]);
    };

    const formatTime = (isoString: string) => {
        const date = new Date(isoString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();

        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        return date.toLocaleDateString();
    };

    const getStatusConfig = (status: ScanHistoryEntry['status']) => {
        switch (status) {
            case 'success':
                return { dot: 'bg-[#22c55e]', badge: 'bg-[#22c55e]/10 text-[#22c55e]', icon: '✓' };
            case 'failed':
                return { dot: 'bg-[#ff2d55]', badge: 'bg-[#ff2d55]/10 text-[#ff2d55]', icon: '✖' };
            case 'killed':
                return { dot: 'bg-[#f59e0b]', badge: 'bg-[#f59e0b]/10 text-[#f59e0b]', icon: '⊘' };
            default:
                return { dot: 'bg-[#06b6d4] animate-pulse', badge: 'bg-[#06b6d4]/10 text-[#06b6d4]', icon: '⟳' };
        }
    };

    if (history.length === 0) return null;

    return (
        <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center gap-2 hover:text-[#ff2d55] transition-colors"
                >
                    <span className="w-8 h-8 rounded-lg bg-[#8b5cf6]/20 flex items-center justify-center">
                        <Icon name="terminal" size={18} className="text-[#8b5cf6]" />
                    </span>
                    <h3 className="font-display font-bold text-lg">
                        Scan History
                    </h3>
                    <span className="text-xs text-[#606070] bg-white/10 px-2 py-0.5 rounded-full">
                        {history.length}
                    </span>
                    <motion.span
                        animate={{ rotate: isExpanded ? 0 : -90 }}
                        className="text-[#606070] text-sm"
                    >
                        ▼
                    </motion.span>
                </button>

                {history.length > 0 && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClearHistory}
                        className="text-[#606070] hover:text-[#ff2d55]"
                    >
                        Clear
                    </Button>
                )}
            </div>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                            {history.map((entry, index) => {
                                const config = getStatusConfig(entry.status);
                                const isSelected = entry.id === selectedId;
                                const isReplaying = replayingId === entry.id;

                                return (
                                    <motion.div
                                        key={entry.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        onClick={() => onSelectEntry?.(entry)}
                                        className={`p-3 rounded-xl cursor-pointer transition-all ${isSelected
                                                ? 'bg-[#ff2d55]/10 border border-[#ff2d55]/30'
                                                : 'bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            {/* Status Indicator */}
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${config.badge}`}>
                                                {entry.status === 'running' ? (
                                                    <span className="w-4 h-4 border-2 border-[#06b6d4]/30 border-t-[#06b6d4] rounded-full animate-spin" />
                                                ) : (
                                                    <span className="text-sm">{config.icon}</span>
                                                )}
                                            </div>

                                            {/* Details */}
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium truncate">
                                                    {entry.repoUrl.replace('https://github.com/', '')}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-[#606070]">
                                                    <span>{entry.branch}</span>
                                                    <span>•</span>
                                                    <span>{formatTime(entry.startTime)}</span>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-2">
                                                {entry.status !== 'running' && (
                                                    <button
                                                        onClick={(e) => handleReplay(entry, e)}
                                                        disabled={isReplaying}
                                                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                                                        title="Replay this scan"
                                                    >
                                                        {isReplaying ? (
                                                            <span className="w-4 h-4 border-2 border-white/20 border-t-[#ff2d55] rounded-full animate-spin block" />
                                                        ) : (
                                                            <Icon name="dashboard" size={14} className="text-[#606070]" />
                                                        )}
                                                    </button>
                                                )}
                                                <span className={`text-xs px-2 py-1 rounded-lg font-medium ${config.badge}`}>
                                                    {entry.status.toUpperCase()}
                                                </span>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </Card>
    );
}

