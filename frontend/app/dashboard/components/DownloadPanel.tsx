'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '../../components/Icon';
import { Button, Card } from '../../components/UI';
import {
    listExecutionFiles,
    downloadExecutionFile,
    downloadExecutionLogs,
    downloadAsFile,
    ExecutionFile
} from '../../api';

interface DownloadPanelProps {
    executionId: string;
    outputs?: Record<string, string>;
    isComplete: boolean;
}

export default function DownloadPanel({ executionId, outputs, isComplete }: DownloadPanelProps) {
    const [files, setFiles] = useState<ExecutionFile[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [downloadingFile, setDownloadingFile] = useState<string | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        if (isComplete && isExpanded) {
            loadFiles();
        }
    }, [isComplete, isExpanded, executionId]);

    const loadFiles = async () => {
        setIsLoading(true);
        try {
            const result = await listExecutionFiles(executionId);
            if (result.success) {
                setFiles(result.files || []);
            }
        } catch (error) {
            console.error('Failed to load files:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownloadFile = async (file: ExecutionFile) => {
        setDownloadingFile(file.path);
        try {
            const result = await downloadExecutionFile(executionId, file.path);
            if (result.success) {
                const content = typeof result.content === 'object'
                    ? JSON.stringify(result.content, null, 2)
                    : result.content;
                const filename = file.path.split('/').pop() || 'download';
                const mimeType = result.content_type === 'json' ? 'application/json' : 'text/plain';
                downloadAsFile(content, filename, mimeType);
            }
        } catch (error) {
            console.error('Download failed:', error);
        } finally {
            setDownloadingFile(null);
        }
    };

    const handleDownloadLogs = async () => {
        setDownloadingFile('logs');
        try {
            const result = await downloadExecutionLogs(executionId);
            if (result.success) {
                downloadAsFile(
                    result.content,
                    `redloop-logs-${executionId.substring(0, 8)}.txt`,
                    'text/plain'
                );
            }
        } catch (error) {
            console.error('Log download failed:', error);
        } finally {
            setDownloadingFile(null);
        }
    };

    const handleDownloadReport = () => {
        // Combine all outputs into a Markdown report
        const report = generateMarkdownReport();
        downloadAsFile(
            report,
            `redloop-report-${executionId.substring(0, 8)}.md`,
            'text/markdown'
        );
    };

    const handleDownloadJSON = () => {
        // Download all outputs as JSON
        const jsonContent = JSON.stringify(outputs || {}, null, 2);
        downloadAsFile(
            jsonContent,
            `redloop-results-${executionId.substring(0, 8)}.json`,
            'application/json'
        );
    };

    const generateMarkdownReport = () => {
        let report = `# RedLoop Security Scan Report\n\n`;
        report += `**Execution ID:** ${executionId}\n`;
        report += `**Generated:** ${new Date().toISOString()}\n\n`;
        report += `---\n\n`;

        if (outputs?.adversary_kestra) {
            report += `## 🔴 Vulnerability Scan Results\n\n`;
            report += `\`\`\`json\n${outputs.adversary_kestra}\n\`\`\`\n\n`;
        }

        if (outputs?.summarizer_agent) {
            report += `## 📋 Risk Assessment\n\n`;
            report += `${outputs.summarizer_agent}\n\n`;
        }

        if (outputs?.defender_agent) {
            report += `## 🛡️ Recommended Fixes\n\n`;
            report += `${outputs.defender_agent}\n\n`;
        }

        if (outputs?.complete) {
            report += `## 📊 Executive Summary\n\n`;
            report += `${outputs.complete}\n\n`;
        }

        return report;
    };

    const hasOutputs = outputs && Object.keys(outputs).length > 0;

    return (
        <Card className="p-4">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between"
            >
                <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-[#22c55e]/20 flex items-center justify-center">
                        <Icon name="dashboard" size={16} className="text-[#22c55e]" />
                    </span>
                    <div className="text-left">
                        <h4 className="font-display font-bold text-sm">Download Results</h4>
                        <p className="text-xs text-[#606070]">Export scan data and reports</p>
                    </div>
                </div>
                <motion.span
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    className="text-[#606070]"
                >
                    ▼
                </motion.span>
            </button>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
                            {/* Quick Download Buttons */}
                            <div className="grid grid-cols-2 gap-2">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={handleDownloadJSON}
                                    disabled={!hasOutputs}
                                    className="justify-center"
                                >
                                    <Icon name="terminal" size={14} className="mr-2" />
                                    JSON Data
                                </Button>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={handleDownloadReport}
                                    disabled={!hasOutputs}
                                    className="justify-center"
                                >
                                    <Icon name="search" size={14} className="mr-2" />
                                    MD Report
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleDownloadLogs}
                                    disabled={downloadingFile === 'logs'}
                                    className="justify-center"
                                >
                                    {downloadingFile === 'logs' ? (
                                        <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" />
                                    ) : (
                                        <Icon name="terminal" size={14} className="mr-2" />
                                    )}
                                    Full Logs
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={loadFiles}
                                    disabled={isLoading}
                                    className="justify-center"
                                >
                                    {isLoading ? (
                                        <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" />
                                    ) : (
                                        <Icon name="settings" size={14} className="mr-2" />
                                    )}
                                    Refresh Files
                                </Button>
                            </div>

                            {/* File List */}
                            {files.length > 0 && (
                                <div className="mt-4">
                                    <h5 className="text-xs text-[#606070] font-mono uppercase mb-2">
                                        Output Files ({files.length})
                                    </h5>
                                    <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
                                        {files.map((file, index) => (
                                            <button
                                                key={index}
                                                onClick={() => handleDownloadFile(file)}
                                                disabled={downloadingFile === file.path}
                                                className="w-full flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-left group"
                                            >
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <Icon name="terminal" size={14} className="text-[#606070] shrink-0" />
                                                    <span className="text-xs font-mono truncate">
                                                        {file.path.split('/').pop()}
                                                    </span>
                                                </div>
                                                {downloadingFile === file.path ? (
                                                    <span className="w-4 h-4 border-2 border-white/20 border-t-[#22c55e] rounded-full animate-spin shrink-0" />
                                                ) : (
                                                    <Icon
                                                        name="dashboard"
                                                        size={14}
                                                        className="text-[#606070] group-hover:text-[#22c55e] shrink-0"
                                                    />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Empty State */}
                            {!hasOutputs && !isLoading && (
                                <p className="text-xs text-[#606070] text-center py-2">
                                    Scan results will appear here when complete
                                </p>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </Card>
    );
}
