'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '../../components/Icon';
import { Card, Button } from '../../components/UI';

interface ScanReportProps {
    executionId: string;
    repoUrl: string;
    outputs: Record<string, string>;
    isComplete: boolean;
}

type TabId = 'adversary' | 'summary' | 'fixes' | 'report';

interface Tab {
    id: TabId;
    taskId: string;
    label: string;
    icon: string;
    color: string;
}

const tabs: Tab[] = [
    { id: 'adversary', taskId: 'adversary_kestra', label: 'Vulnerabilities', icon: '🔴', color: '#ff2d55' },
    { id: 'summary', taskId: 'summarizer_agent', label: 'Risk Analysis', icon: '📋', color: '#f59e0b' },
    { id: 'fixes', taskId: 'defender_agent', label: 'Security Fixes', icon: '🛡️', color: '#22c55e' },
    { id: 'report', taskId: 'complete', label: 'Executive Report', icon: '📊', color: '#8b5cf6' },
];

export default function ScanReport({ executionId, repoUrl, outputs, isComplete }: ScanReportProps) {
    const [activeTab, setActiveTab] = useState<TabId>('adversary');

    const downloadReport = () => {
        const report = {
            executionId,
            repository: repoUrl,
            timestamp: new Date().toISOString(),
            vulnerabilities: outputs['adversary_kestra'] || null,
            riskAnalysis: outputs['summarizer_agent'] || null,
            securityFixes: outputs['defender_agent'] || null,
            executiveReport: outputs['complete'] || null,
        };

        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `redloop-scan-${executionId.substring(0, 8)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const downloadMarkdown = () => {
        const md = `# RedLoop Security Assessment

## Repository
${repoUrl}

## Execution ID
${executionId}

## Generated
${new Date().toISOString()}

---

## 🔴 Vulnerabilities Found

${outputs['adversary_kestra'] || '_No vulnerabilities data_'}

---

## 📋 Risk Analysis

${outputs['summarizer_agent'] || '_No risk analysis data_'}

---

## 🛡️ Security Fixes

${outputs['defender_agent'] || '_No fixes data_'}

---

## 📊 Executive Report

${outputs['complete'] || '_No executive report_'}
`;

        const blob = new Blob([md], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `redloop-scan-${executionId.substring(0, 8)}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const activeTabData = tabs.find(t => t.id === activeTab);
    const activeOutput = activeTabData ? outputs[activeTabData.taskId] : null;
    const hasAnyOutput = Object.values(outputs).some(o => o && o.length > 0);

    if (!hasAnyOutput && !isComplete) {
        return (
            <Card className="p-8 flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#ff2d55]/20 to-[#8b5cf6]/20 flex items-center justify-center"
                    >
                        <span className="text-3xl">⚡</span>
                    </motion.div>
                    <h4 className="text-lg font-display font-bold text-white mb-2">Scanning in Progress</h4>
                    <p className="text-sm text-[#606070]">Results will appear here as agents complete their analysis</p>
                </div>
            </Card>
        );
    }

    return (
        <Card className="overflow-hidden" noPadding>
            {/* Header */}
            <div className="p-4 border-b border-white/5 bg-gradient-to-r from-[#0a0a10] to-[#0f0f18]">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
                            <span className="text-2xl">📄</span>
                            Security Assessment Report
                        </h3>
                        <p className="text-xs text-[#606070] font-mono mt-1 truncate max-w-md">{repoUrl}</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="secondary" size="sm" onClick={downloadMarkdown}>
                            <Icon name="download" size={14} className="mr-1" />
                            Markdown
                        </Button>
                        <Button variant="primary" size="sm" onClick={downloadReport}>
                            <Icon name="download" size={14} className="mr-1" />
                            JSON
                        </Button>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/5 bg-[#08080c] overflow-x-auto">
                {tabs.map(tab => {
                    const hasOutput = outputs[tab.taskId] && outputs[tab.taskId].length > 0;
                    const isActive = activeTab === tab.id;

                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            disabled={!hasOutput}
                            className={`flex-shrink-0 px-5 py-3 flex items-center gap-2 text-sm font-medium transition-all border-b-2 ${isActive
                                    ? 'border-current bg-white/5'
                                    : 'border-transparent hover:bg-white/5'
                                } ${hasOutput
                                    ? 'text-white cursor-pointer'
                                    : 'text-[#404050] cursor-not-allowed'
                                }`}
                            style={{ color: isActive ? tab.color : undefined }}
                        >
                            <span>{tab.icon}</span>
                            <span>{tab.label}</span>
                            {hasOutput && (
                                <span className="w-2 h-2 rounded-full bg-current opacity-60" />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Content */}
            <div className="min-h-[400px] max-h-[600px] overflow-y-auto custom-scrollbar bg-[#050508]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="p-6"
                    >
                        {activeOutput ? (
                            <div className="prose prose-invert prose-sm max-w-none">
                                <pre className="whitespace-pre-wrap text-sm text-[#c0c0d0] font-mono leading-relaxed bg-[#0a0a0e] p-4 rounded-xl border border-white/5 overflow-x-auto">
                                    {activeOutput}
                                </pre>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <span className="text-4xl mb-4 opacity-30">{activeTabData?.icon}</span>
                                <p className="text-[#606070]">
                                    {isComplete
                                        ? 'No data available for this section'
                                        : 'Waiting for analysis to complete...'}
                                </p>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-white/5 bg-[#08080c] flex items-center justify-between">
                <span className="text-xs text-[#404050] font-mono">
                    Execution: {executionId.substring(0, 16)}...
                </span>
                <div className="flex items-center gap-4">
                    {tabs.map(tab => {
                        const hasOutput = outputs[tab.taskId] && outputs[tab.taskId].length > 0;
                        return (
                            <span
                                key={tab.id}
                                className={`w-2 h-2 rounded-full ${hasOutput ? 'bg-[#22c55e]' : 'bg-[#303040]'}`}
                                title={`${tab.label}: ${hasOutput ? 'Complete' : 'Pending'}`}
                            />
                        );
                    })}
                </div>
            </div>
        </Card>
    );
}
