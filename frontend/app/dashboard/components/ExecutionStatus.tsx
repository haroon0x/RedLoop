'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '../../components/Icon';
import { Card } from '../../components/UI';
import { createExecutionWebSocket, WebSocketMessage } from '../../api';

interface TaskState {
    status: string;
    message: string;
}

interface ExecutionStatusProps {
    executionId: string;
    repoUrl: string;
    onLog: (log: { type: string; msg: string }) => void;
    onComplete: (status: 'success' | 'failed') => void;
    onOutputReceived?: (taskId: string, output: string) => void;
}

export default function ExecutionStatus({ executionId, repoUrl, onLog, onComplete, onOutputReceived }: ExecutionStatusProps) {
    const [isConnected, setIsConnected] = useState(true);
    const [executionState, setExecutionState] = useState<'RUNNING' | 'SUCCESS' | 'FAILED'>('RUNNING');
    const [taskStates, setTaskStates] = useState<Record<string, TaskState>>({});
    const [elapsedTime, setElapsedTime] = useState(0);
    const wsRef = useRef<{ close: () => void } | null>(null);
    const hasConnectedRef = useRef(false);
    const onLogRef = useRef(onLog);
    const onCompleteRef = useRef(onComplete);
    const onOutputReceivedRef = useRef(onOutputReceived);

    useEffect(() => {
        onLogRef.current = onLog;
        onCompleteRef.current = onComplete;
        onOutputReceivedRef.current = onOutputReceived;
    });

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

                // Pass the actual AI output to parent if present
                if (data.output && typeof data.output === 'string' && data.output.length > 0) {
                    onOutputReceivedRef.current?.(data.task_id!, data.output);

                    // Also log a summary to terminal
                    const lines = data.output.split('\n').filter(l => l.trim()).length;
                    onLogRef.current({ type: 'info', msg: `  └─ Received ${lines} lines of output` });
                }

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

        const handleDisconnect = () => setIsConnected(false);
        const { close } = createExecutionWebSocket(executionId, handleMessage, handleDisconnect, handleDisconnect);
        wsRef.current = { close };

        if (!hasConnectedRef.current) {
            onLogRef.current({ type: 'success', msg: '📡 Connected to real-time stream' });
            hasConnectedRef.current = true;
        }

        return () => close();
    }, [executionId]);

    const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

    const workflowStages = [
        { id: 'clone_repository', name: 'Clone Repository', icon: '📥' },
        { id: 'adversary_kestra', name: 'Adversary Scan', icon: '🔴' },
        { id: 'summarizer_agent', name: 'Risk Analysis', icon: '📋' },
        { id: 'defender_agent', name: 'Security Fixes', icon: '🛡️' },
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
                    Execution Status
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
}
