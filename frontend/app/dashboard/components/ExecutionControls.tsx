'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '../../components/Icon';
import { Button } from '../../components/UI';
import {
    killExecution,
    replayExecution,
    restartExecution,
    downloadExecutionLogs,
    downloadAsFile
} from '../../api';

interface ExecutionControlsProps {
    executionId: string;
    executionState: 'RUNNING' | 'SUCCESS' | 'FAILED' | 'KILLED';
    repoUrl: string;
    branch: string;
    onKilled?: () => void;
    onReplay?: (newExecutionId: string) => void;
    onRestart?: (newExecutionId: string) => void;
    onLog?: (log: { type: string; msg: string }) => void;
}

export default function ExecutionControls({
    executionId,
    executionState,
    repoUrl,
    branch,
    onKilled,
    onReplay,
    onRestart,
    onLog
}: ExecutionControlsProps) {
    const [isKilling, setIsKilling] = useState(false);
    const [isReplaying, setIsReplaying] = useState(false);
    const [isRestarting, setIsRestarting] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [showConfirmKill, setShowConfirmKill] = useState(false);

    const handleKill = async () => {
        if (!showConfirmKill) {
            setShowConfirmKill(true);
            return;
        }

        setIsKilling(true);
        try {
            const result = await killExecution(executionId);
            if (result.success) {
                onLog?.({ type: 'warning', msg: '🛑 Execution killed' });
                onKilled?.();
            } else {
                onLog?.({ type: 'danger', msg: `❌ Failed to kill: ${result.error}` });
            }
        } catch (error) {
            onLog?.({ type: 'danger', msg: `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}` });
        } finally {
            setIsKilling(false);
            setShowConfirmKill(false);
        }
    };

    const handleReplay = async () => {
        setIsReplaying(true);
        try {
            const result = await replayExecution(executionId);
            if (result.success && result.new_execution_id) {
                onLog?.({ type: 'success', msg: `🔄 Replay started: ${result.new_execution_id.substring(0, 12)}` });
                onReplay?.(result.new_execution_id);
            } else {
                onLog?.({ type: 'danger', msg: `❌ Failed to replay: ${result.error}` });
            }
        } catch (error) {
            onLog?.({ type: 'danger', msg: `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}` });
        } finally {
            setIsReplaying(false);
        }
    };

    const handleRestart = async () => {
        setIsRestarting(true);
        try {
            const result = await restartExecution(executionId);
            if (result.success && result.new_execution_id) {
                onLog?.({ type: 'success', msg: `🔃 Restart initiated: ${result.new_execution_id.substring(0, 12)}` });
                onRestart?.(result.new_execution_id);
            } else {
                onLog?.({ type: 'danger', msg: `❌ Failed to restart: ${result.error}` });
            }
        } catch (error) {
            onLog?.({ type: 'danger', msg: `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}` });
        } finally {
            setIsRestarting(false);
        }
    };

    const handleDownloadLogs = async () => {
        setIsDownloading(true);
        try {
            const result = await downloadExecutionLogs(executionId);
            if (result.success) {
                downloadAsFile(
                    result.content,
                    `redloop-logs-${executionId.substring(0, 8)}.txt`,
                    'text/plain'
                );
                onLog?.({ type: 'success', msg: '📥 Logs downloaded' });
            } else {
                onLog?.({ type: 'danger', msg: `❌ Download failed: ${result.error}` });
            }
        } catch (error) {
            onLog?.({ type: 'danger', msg: `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}` });
        } finally {
            setIsDownloading(false);
        }
    };

    const isRunning = executionState === 'RUNNING';
    const isFailed = executionState === 'FAILED';
    const isComplete = executionState === 'SUCCESS' || executionState === 'FAILED' || executionState === 'KILLED';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap items-center gap-2 p-3 bg-white/5 rounded-xl border border-white/10"
        >
            {/* Kill Button - Only when running */}
            <AnimatePresence>
                {isRunning && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="relative"
                    >
                        <Button
                            variant={showConfirmKill ? "danger" : "secondary"}
                            size="sm"
                            onClick={handleKill}
                            disabled={isKilling}
                            icon={isKilling ? (
                                <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Icon name="attack" size={14} />
                            )}
                        >
                            {showConfirmKill ? 'Confirm Kill' : 'Kill Scan'}
                        </Button>
                        {showConfirmKill && (
                            <button
                                onClick={() => setShowConfirmKill(false)}
                                className="ml-1 text-xs text-[#606070] hover:text-white"
                            >
                                Cancel
                            </button>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Replay Button - Always available after started */}
            {isComplete && (
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleReplay}
                    disabled={isReplaying}
                    icon={isReplaying ? (
                        <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                        <Icon name="dashboard" size={14} />
                    )}
                >
                    Replay
                </Button>
            )}

            {/* Restart Button - Only for failed executions */}
            {isFailed && (
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleRestart}
                    disabled={isRestarting}
                    icon={isRestarting ? (
                        <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                        <Icon name="settings" size={14} />
                    )}
                >
                    Restart
                </Button>
            )}

            {/* Download Logs Button */}
            <Button
                variant="ghost"
                size="sm"
                onClick={handleDownloadLogs}
                disabled={isDownloading}
                icon={isDownloading ? (
                    <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                    <Icon name="terminal" size={14} />
                )}
            >
                Logs
            </Button>

            {/* Execution ID */}
            <div className="ml-auto flex items-center gap-2 text-xs text-[#606070] font-mono">
                <span className={`w-2 h-2 rounded-full ${executionState === 'RUNNING' ? 'bg-[#06b6d4] animate-pulse' :
                        executionState === 'SUCCESS' ? 'bg-[#22c55e]' :
                            executionState === 'FAILED' ? 'bg-[#ff2d55]' :
                                'bg-[#f59e0b]'
                    }`} />
                <span>{executionId.substring(0, 12)}...</span>
            </div>
        </motion.div>
    );
}
