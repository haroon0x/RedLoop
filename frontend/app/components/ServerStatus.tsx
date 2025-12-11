'use client';

import { useState, useEffect } from 'react';
import { API_URL } from '../config';

export default function ServerStatus() {
    const [status, setStatus] = useState<'checking' | 'online' | 'offline'>('checking');

    useEffect(() => {
        fetch(`${API_URL}/`)
            .then((res) => {
                if (res.ok) setStatus('online');
                else setStatus('offline');
            })
            .catch(() => setStatus('offline'));
    }, []);

    return (
        <div className="flex items-center gap-4 mb-4">
            <span className="w-12 h-[1px] bg-[#ff2d55]"></span>
            <span className="font-mono text-[#ff2d55] text-xs">
                SYS.STATUS: {status === 'checking' ? 'CHECKING...' : status === 'online' ? 'ONLINE' : 'OFFLINE'}
            </span>
        </div>
    );
}
