import { API_URL } from './config';

// ═══════════════════════════════════════════════════════════════════════════
// Types & Interfaces
// ═══════════════════════════════════════════════════════════════════════════

export interface KestraFlowRequest {
    repository_url: string;
    branch: string;
}

export interface KestraExecutionResponse {
    success: boolean;
    execution_id?: string;
    state?: string;
    error?: string;
    namespace?: string;
    flow_id?: string;
}

export interface KestraStatusResponse {
    success: boolean;
    execution_id: string;
    state: string;
    start_date?: string;
    end_date?: string;
    duration?: string;
    task_count: number;
    outputs: Record<string, unknown>;
    error?: string;
}

export interface HealthResponse {
    status: string;
    version: string;
}

export interface KestraConnectionStatus {
    status: 'online' | 'offline' | 'error';
    flows?: number;
    error?: string;
}

export interface WebSocketMessage {
    type: 'task_update' | 'execution_update';
    execution_id: string;
    task_id?: string;
    status?: string;
    state?: string;
    message?: string;
    data?: unknown;
    output?: string;
}

export interface ExecutionFile {
    path: string;
    size?: number;
    type?: string;
}

export interface ExecutionFilesResponse {
    success: boolean;
    execution_id: string;
    files: ExecutionFile[];
    error?: string;
}

export interface FileDownloadResponse {
    success: boolean;
    execution_id: string;
    file_path: string;
    content_type: string;
    content: string | object;
    error?: string;
}

export interface LogDownloadResponse {
    success: boolean;
    execution_id: string;
    content: string;
    content_type: string;
    size: number;
    error?: string;
}

export interface ExecutionMetricsResponse {
    success: boolean;
    execution_id: string;
    metrics: object[];
    error?: string;
}


export interface ExecutionControlResponse {
    success: boolean;
    execution_id?: string;
    original_execution_id?: string;
    new_execution_id?: string;
    state?: string;
    message?: string;
    error?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// Health & Status
// ═══════════════════════════════════════════════════════════════════════════

export async function getHealth(): Promise<HealthResponse> {
    const response = await fetch(`${API_URL}/api/health`);
    if (!response.ok) throw new Error('Backend unavailable');
    return response.json();
}

export async function getKestraStatus(): Promise<KestraConnectionStatus> {
    const response = await fetch(`${API_URL}/api/kestra/status`);
    if (!response.ok) throw new Error('Failed to check Kestra status');
    return response.json();
}

// ═══════════════════════════════════════════════════════════════════════════
// Execution Trigger & Status
// ═══════════════════════════════════════════════════════════════════════════

export async function triggerScan(
    repositoryUrl: string,
    branch: string = 'main'
): Promise<KestraExecutionResponse> {
    const response = await fetch(`${API_URL}/api/kestra/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repository_url: repositoryUrl, branch }),
    });
    if (!response.ok) throw new Error(`Failed to trigger scan: ${response.statusText}`);
    return response.json();
}

export async function getExecutionStatus(executionId: string): Promise<KestraStatusResponse> {
    const response = await fetch(`${API_URL}/api/kestra/execution/${executionId}`);
    if (!response.ok) throw new Error('Failed to get execution status');
    return response.json();
}

export async function getExecutionLogs(
    executionId: string,
    limit: number = 50
): Promise<{ success: boolean; logs: Array<{ timestamp: string; level: string; message: string; task_id: string }> }> {
    const response = await fetch(`${API_URL}/api/kestra/execution/${executionId}/logs?limit=${limit}`);
    if (!response.ok) throw new Error('Failed to get execution logs');
    return response.json();
}

// ═══════════════════════════════════════════════════════════════════════════
// Execution Control - Kill, Replay, Restart
// ═══════════════════════════════════════════════════════════════════════════

export async function killExecution(executionId: string): Promise<ExecutionControlResponse> {
    const response = await fetch(`${API_URL}/api/kestra/execution/${executionId}/kill`, {
        method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to kill execution');
    return response.json();
}

export async function replayExecution(executionId: string): Promise<ExecutionControlResponse> {
    const response = await fetch(`${API_URL}/api/kestra/execution/${executionId}/replay`, {
        method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to replay execution');
    return response.json();
}

export async function restartExecution(executionId: string): Promise<ExecutionControlResponse> {
    const response = await fetch(`${API_URL}/api/kestra/execution/${executionId}/restart`, {
        method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to restart execution');
    return response.json();
}

// ═══════════════════════════════════════════════════════════════════════════
// File Downloads
// ═══════════════════════════════════════════════════════════════════════════

export async function listExecutionFiles(executionId: string): Promise<ExecutionFilesResponse> {
    const response = await fetch(`${API_URL}/api/kestra/execution/${executionId}/files`);
    if (!response.ok) throw new Error('Failed to list files');
    return response.json();
}

export async function downloadExecutionFile(executionId: string, filePath: string): Promise<FileDownloadResponse> {
    const response = await fetch(`${API_URL}/api/kestra/execution/${executionId}/file?path=${encodeURIComponent(filePath)}`);
    if (!response.ok) throw new Error('Failed to download file');
    return response.json();
}

export async function previewExecutionFile(
    executionId: string,
    filePath: string,
    maxLines: number = 100
): Promise<{ success: boolean; preview: string; error?: string }> {
    const response = await fetch(
        `${API_URL}/api/kestra/execution/${executionId}/file/preview?path=${encodeURIComponent(filePath)}&max_lines=${maxLines}`
    );
    if (!response.ok) throw new Error('Failed to preview file');
    return response.json();
}

export async function downloadExecutionLogs(executionId: string): Promise<LogDownloadResponse> {
    const response = await fetch(`${API_URL}/api/kestra/execution/${executionId}/logs/download`);
    if (!response.ok) throw new Error('Failed to download logs');
    return response.json();
}

// ═══════════════════════════════════════════════════════════════════════════
// Metrics
// ═══════════════════════════════════════════════════════════════════════════

export async function getExecutionMetrics(executionId: string): Promise<ExecutionMetricsResponse> {
    const response = await fetch(`${API_URL}/api/kestra/execution/${executionId}/metrics`);
    if (!response.ok) throw new Error('Failed to get execution metrics');
    return response.json();
}


// ═══════════════════════════════════════════════════════════════════════════
// WebSocket Connection (existing)
// ═══════════════════════════════════════════════════════════════════════════

export function createExecutionWebSocket(
    executionId: string,
    onMessage: (data: WebSocketMessage) => void,
    onError?: (error: Event) => void,
    onClose?: () => void
): { ws: WebSocket; close: () => void } {
    const wsUrl = API_URL.replace('http://', 'ws://').replace('https://', 'wss://');
    const ws = new WebSocket(`${wsUrl}/ws/execution/${executionId}`);
    let pingInterval: ReturnType<typeof setInterval> | null = null;
    let isClosed = false;

    const cleanup = () => {
        if (pingInterval) {
            clearInterval(pingInterval);
            pingInterval = null;
        }
    };

    ws.onopen = () => {
        // Start ping interval only after connection is open
        pingInterval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) ws.send('ping');
        }, 30000);
    };

    ws.onmessage = (event) => {
        if (event.data === 'pong') return;
        try {
            const parsed = JSON.parse(event.data) as WebSocketMessage;
            onMessage(parsed);
        } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
        }
    };

    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        cleanup();
        onError?.(error);
    };

    ws.onclose = () => {
        cleanup();
        if (!isClosed) {
            onClose?.();
        }
    };

    return {
        ws,
        close: () => {
            isClosed = true;
            cleanup();
            if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
                ws.close();
            }
        }
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// SSE Streaming (new - more reliable than WebSocket for Kestra)
// ═══════════════════════════════════════════════════════════════════════════

export interface SSEMessage {
    type: 'execution_update' | 'log' | 'error' | 'raw' | 'connected' | 'waiting' | 'complete' | 'timeout';
    execution_id?: string;
    state?: string;
    task_run_list?: object[];
    tasks?: Record<string, { status: string; message?: string; output?: string }>;
    task_count?: number;
    outputs?: object;
    timestamp?: string;
    level?: string;
    message?: string;
    task_id?: string;
    data?: string;
    error?: string;
}

export function createExecutionSSE(
    executionId: string,
    onMessage: (data: SSEMessage) => void,
    onError?: (error: Event) => void,
    options?: { maxRetries?: number; baseDelayMs?: number }
): { close: () => void } {
    const url = `${API_URL}/api/kestra/execution/${executionId}/stream`;
    const maxRetries = options?.maxRetries ?? 5;
    const baseDelayMs = options?.baseDelayMs ?? 1000;

    let eventSource: EventSource | null = null;
    let retryCount = 0;
    let isManualClose = false;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
        eventSource = new EventSource(url);

        eventSource.onopen = () => {
            retryCount = 0; // Reset retry count on successful connection
        };

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data) as SSEMessage;
                onMessage(data);

                // If execution is complete, close the connection
                if (data.state && ['SUCCESS', 'FAILED', 'KILLED'].includes(data.state)) {
                    isManualClose = true;
                    eventSource?.close();
                }
            } catch (error) {
                console.error('[SSE] Failed to parse message:', error);
                onMessage({ type: 'raw', data: event.data });
            }
        };

        eventSource.onerror = (error) => {
            console.error(`[SSE] Connection error. ReadyState: ${eventSource?.readyState}`);

            if (isManualClose) return;

            eventSource?.close();

            if (retryCount < maxRetries) {
                const delay = Math.min(baseDelayMs * Math.pow(2, retryCount), 30000);
                reconnectTimeout = setTimeout(() => {
                    retryCount++;
                    connect();
                }, delay);
            } else {
                console.error(`[SSE] Max retries (${maxRetries}) exceeded. Giving up.`);
                onError?.(error);
            }
        };
    };

    // Initial connection
    connect();

    return {
        close: () => {
            isManualClose = true;
            if (reconnectTimeout) {
                clearTimeout(reconnectTimeout);
                reconnectTimeout = null;
            }
            if (eventSource) {
                eventSource.close();
                eventSource = null;
            }
        }
    };
}

export function createLogSSE(
    executionId: string,
    onLog: (log: SSEMessage) => void,
    onError?: (error: Event) => void
): { close: () => void } {
    const eventSource = new EventSource(`${API_URL}/api/kestra/execution/${executionId}/stream/logs`);

    eventSource.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data) as SSEMessage;
            onLog(data);
        } catch (error) {
            console.error('Failed to parse SSE log:', error);
        }
    };

    eventSource.onerror = (error) => {
        console.error('SSE log error:', error);
        onError?.(error);
    };

    return {
        close: () => eventSource.close()
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// Polling Fallback
// ═══════════════════════════════════════════════════════════════════════════

export async function pollExecution(
    executionId: string,
    onUpdate: (status: KestraStatusResponse) => void,
    intervalMs: number = 3000,
    maxAttempts: number = 100
): Promise<KestraStatusResponse> {
    let attempts = 0;
    while (attempts < maxAttempts) {
        const status = await getExecutionStatus(executionId);
        onUpdate(status);
        if (['SUCCESS', 'FAILED', 'KILLED'].includes(status.state)) return status;
        await new Promise(resolve => setTimeout(resolve, intervalMs));
        attempts++;
    }
    throw new Error('Polling timeout');
}

// ═══════════════════════════════════════════════════════════════════════════
// Utility: Download as File
// ═══════════════════════════════════════════════════════════════════════════

export function downloadAsFile(content: string, filename: string, mimeType: string = 'application/json') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

