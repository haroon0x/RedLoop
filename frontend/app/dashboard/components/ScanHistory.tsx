'use client';

import React from 'react';
import { Icon } from '../../components/Icon';
import { Card } from '../../components/UI';

interface ScanHistoryEntry {
    id: string;
    repoUrl: string;
    branch: string;
    status: 'running' | 'success' | 'failed';
    startTime: Date;
}

interface ScanHistoryProps {
    history: ScanHistoryEntry[];
}

export default function ScanHistory({ history }: ScanHistoryProps) {
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
}
