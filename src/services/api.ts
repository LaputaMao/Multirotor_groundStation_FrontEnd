// src/services/api.ts

// 基础配置
const API_BASE = "http://localhost:7007/api/missions";
const WS_URL = "ws://localhost:7007/api/missions/ws";

export {WS_URL};

// --- 接口类型定义 (对应后端的 Pydantic Model) ---

// 1. 任务创建请求
export interface MissionCreateRequest {
    name: string;
    location_name: string;
    dem_path?: string | null;
    simulate?: boolean;
}

// 2. 航点节点
export interface RouteNode {
    lat: number;
    lon: number;
    type: number; // 0: Transit, 1: Work
}

// 3. 任务响应
export interface MissionResponse {
    id: number;
    name: string;
    location: string | null;
    route: RouteNode[];
    created_at: string;
    finished_at: string | null;
}

export interface MissionCreateResult {
    mission: MissionResponse;
    status: string;
}

// 4. 任务列表相关的类型
export interface MissionListItem {
    id: number;
    name: string;
    location: string | null;
    created_at: string;
    updated_at: string | null;
    finished_at: string | null;
}

export interface MissionListResponse {
    total: number;
    items: MissionListItem[];
}

// --- API 方法封装 ---

// 通用的 Fetch 包装器
async function request<T>(url: string, method: 'GET' | 'POST', body?: unknown): Promise<T> {
    const headers = {'Content-Type': 'application/json'};
    const config: RequestInit = {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    };

    const response = await fetch(`${API_BASE}${url}`, config);
    if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
    }
    return response.json();
}

// 1. 断点续飞 - 恢复
export const resumeMission = async () => {
    return request<{ status: string, message: string }>('/resume', 'POST');
};

// 2. 断点续飞 - 取消 (删除断点信息)
export const cancelResume = async () => {
    return request<{ status: string }>('/cancel_resume', 'POST');
};

// 3. 新建任务
export const createMission = async (data: MissionCreateRequest) => {
    return request<MissionCreateResult>('/create', 'POST', data);
};

// 4. 获取任务列表 (分页)
export const getMissionList = async (page: number = 1, size: number = 10) => {
    //构建 query string
    const query = `?page=${page}&size=${size}`;
    return request<MissionListResponse>(`/list${query}`, 'GET');
};

// 5. 获取任务的 GeoJSON 区域数据
export const getMissionGeoJson = async (missionId: number) => {
    // 根据你的示例直接 fetch
    const response = await fetch(`${API_BASE}/${missionId}/geojson`);
    if (!response.ok) {
        throw new Error("Failed to fetch GeoJSON");
    }
    return response.json();
};