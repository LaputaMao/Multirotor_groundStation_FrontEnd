import {useState, useEffect, useCallback, useRef} from 'react';
import {Box, Typography, Chip} from '@mui/material';
import {CssBaseline} from '@mui/material';

// --- 图标引入 ---
import VideocamIcon from '@mui/icons-material/Videocam';
import AddToPhotosIcon from '@mui/icons-material/AddToPhotos'; // 新建任务图标
import BatteryChargingFullIcon from '@mui/icons-material/BatteryChargingFull';
import HeightIcon from '@mui/icons-material/Height';

// --- 组件引入 ---
import DroneMap from './components/DroneMap';
import SmartPanel from './components/SmartPanel';
import TopBar from './components/TopBar';
import CreateMissionForm from './components/CreateMissionForm'; // 我们刚才写的表单
import ResumeDialog from './components/ResumeDialog';         // 我们刚才写的弹窗

// --- API 与 类型 ---
import {WS_URL, resumeMission, cancelResume} from './services/api';

// 定义面板位置/大小类型
export interface PanelRect {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
}

// 定义无人机状态类型
interface DroneTelemetry {
    lat: number;
    lon: number;
    alt: number;
    battery: number;
    status: string; // 'idle', 'mission', etc.
    progress_index: number;
}

function App() {
    // --- 1. 核心状态管理 ---
    // 无人机实时位置 (给地图用)
    const [dronePosition, setDronePosition] = useState<[number, number] | null>(null);

    // 无人机详细遥测数据 (给 HUD 显示用)
    const [telemetry, setTelemetry] = useState<DroneTelemetry>({
        lat: 0, lon: 0, alt: 0, battery: 100, status: 'DISCONNECTED', progress_index: 0
    });

    // 悬浮板遮挡区域 (给地图避让算法用)
    const [panelBlockers, setPanelBlockers] = useState<PanelRect[]>([]);

    // 断点续飞弹窗控制
    const [resumeDialogOpen, setResumeDialogOpen] = useState(false);

    // WebSocket 引用 (避免重复连接)
    const wsRef = useRef<WebSocket | null>(null);

    // --- 2. WebSocket 连接逻辑 ---
    useEffect(() => {
        // 创建连接
        const ws = new WebSocket(WS_URL);
        wsRef.current = ws;

        ws.onopen = () => {
            console.log("System Online: Connected to Drone Link.");
            setTelemetry(prev => ({...prev, status: 'CONNECTED'}));
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                // 分发消息类型
                switch (data.type) {
                    case 'telemetry':
                        // 更新位置
                        if (data.lat && data.lon) {
                            setDronePosition([data.lat, data.lon]);
                        }
                        // 更新仪表盘数据
                        setTelemetry(prev => ({
                            ...prev,
                            lat: data.lat,
                            lon: data.lon,
                            alt: data.alt,
                            battery: data.battery,
                            status: data.status,
                            progress_index: data.progress_index
                        }));
                        break;

                    case 'checkpoint_detected':
                        // 收到后端通知：有未完成的任务
                        console.log("Checkpoint detected:", data.message);
                        setResumeDialogOpen(true);
                        break;

                    default:
                        console.log("Unknown msg:", data);
                }
            } catch (e) {
                console.error("Message parse error", e);
            }
        };

        ws.onclose = () => {
            console.log("System Offline: Signal Lost.");
            setTelemetry(prev => ({...prev, status: 'OFFLINE'}));
        };

        // 组件卸载时断开连接
        return () => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
        };
    }, []);

    // --- 3. 交互回调 ---

    // 处理面板移动，更新遮挡区
    const handlePanelUpdate = useCallback((newRect: PanelRect) => {
        setPanelBlockers(prev => {
            const filtered = prev.filter(p => p.id !== newRect.id);
            return [...filtered, newRect];
        });
    }, []);

    // 处理断点续飞 - 确认
    const handleResumeConfirm = async () => {
        try {
            await resumeMission();
            setResumeDialogOpen(false); // 关闭弹窗
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (e) {
            alert("Failed to send resume command");
        }
    };

    // 处理断点续飞 - 取消
    const handleResumeCancel = async () => {
        try {
            await cancelResume();
            setResumeDialogOpen(false); // 关闭弹窗
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (e) {
            alert("Failed to clear checkpoint");
        }
    };

    return (
        <Box sx={{
            position: 'relative',
            width: '100vw',
            height: '100vh',
            overflow: 'hidden',
            bgcolor: '#000',
        }}>
            <CssBaseline/>

            {/* --- 层级 1: 智能地图底座 --- */}
            {/* 传入真实位置和遮挡区域 */}
            <Box sx={{position: 'absolute', inset: 0, zIndex: 1}}>
                <DroneMap
                    blockers={panelBlockers}
                    realTimePosition={dronePosition}
                />
            </Box>

            {/* --- 层级 2: 顶部信息栏 (时间/天气) --- */}
            <TopBar/>

            {/* --- 层级 3: UI 悬浮面板 --- */}

            {/* 面板 A: 实时图传 + HUD 数据 */}
            <SmartPanel
                id="video-panel"
                title={`CAM-01 [${telemetry.status.toUpperCase()}]`}
                icon={<VideocamIcon/>}
                initialPosition={{x: 50, y: 160}}
                onLayoutChange={handlePanelUpdate}
            >
                <Box sx={{
                    width: '100%', minHeight: 220, bgcolor: 'black', position: 'relative',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
                }}>
                    {/* 模拟视频流 */}
                    <img
                        src="https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExcjZ4eXc1emg1aTh4aWw0eXJ4aWwxeXJ4aWwxeXJ4aWwxeXJ4aWwxeCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7TKSjRrfIPjeiVyM/giphy.gif"
                        alt="Video Stream"
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            opacity: 0.6,
                            zIndex: 1
                        }}
                    />

                    {/* HUD (Head-Up Display) 数据叠加层 */}
                    <Box sx={{
                        position: 'absolute', bottom: 10, left: 10, zIndex: 10,
                        display: 'flex', gap: 1, flexDirection: 'column'
                    }}>
                        <Chip
                            icon={<HeightIcon style={{color: 'white'}}/>}
                            label={`ALT: ${telemetry.alt.toFixed(1)} m`}
                            size="small"
                            sx={{
                                bgcolor: 'rgba(0,0,0,0.6)',
                                color: '#00e676',
                                border: '1px solid rgba(0,255,0,0.3)',
                                backdropFilter: 'blur(4px)'
                            }}
                        />
                        <Chip
                            icon={<BatteryChargingFullIcon style={{color: telemetry.battery < 20 ? 'red' : 'white'}}/>}
                            label={`BAT: ${telemetry.battery < 0 ? '--' : telemetry.battery + '%'}`}
                            size="small"
                            sx={{
                                bgcolor: 'rgba(0,0,0,0.6)',
                                color: telemetry.battery < 20 ? '#ff5252' : '#29b6f6',
                                border: '1px solid rgba(255,255,255,0.1)',
                                backdropFilter: 'blur(4px)'
                            }}
                        />
                    </Box>

                    {/* 连接状态显示 (如果未连接) */}
                    {telemetry.status === 'OFFLINE' && (
                        <Box sx={{
                            position: 'absolute', inset: 0, zIndex: 20, bgcolor: 'rgba(0,0,0,0.7)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <Typography variant="h6" color="error" sx={{fontWeight: 'bold', letterSpacing: 2}}>
                                SIGNAL LOST
                            </Typography>
                        </Box>
                    )}
                </Box>
            </SmartPanel>

            {/* 面板 B: 任务创建控制台 */}
            <SmartPanel
                id="control-panel"
                title="MISSION CONTROL"
                icon={<AddToPhotosIcon/>}
                initialPosition={{x: 50, y: 460}}
                onLayoutChange={handlePanelUpdate}
            >
                {/* 直接嵌入之前写的表单组件 */}
                <CreateMissionForm/>
            </SmartPanel>

            {/* --- 层级 4: 全局弹窗 --- */}
            <ResumeDialog
                open={resumeDialogOpen}
                onConfirm={handleResumeConfirm}
                onCancel={handleResumeCancel}
            />

        </Box>
    );
}

export default App;
