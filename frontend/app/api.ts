import { API_URL } from './config';

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
}

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

export function createExecutionWebSocket(
    executionId: string,
    onMessage: (data: WebSocketMessage) => void,
    onError?: (error: Event) => void,
    onClose?: () => void
): { ws: WebSocket; close: () => void } {
    const wsUrl = API_URL.replace('http://', 'ws://').replace('https://', 'wss://');
    const ws = new WebSocket(`${wsUrl}/ws/execution/${executionId}`);

    ws.onopen = () => console.log(`WebSocket connected: ${executionId}`);
    ws.onmessage = (event) => {
        try {
            onMessage(JSON.parse(event.data) as WebSocketMessage);
        } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
        }
    };
    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        onError?.(error);
    };
    ws.onclose = () => {
        console.log('WebSocket closed');
        onClose?.();
    };

    const pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) ws.send('ping');
    }, 30000);

    return {
        ws,
        close: () => {
            clearInterval(pingInterval);
            ws.close();
        }
    };
}

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
