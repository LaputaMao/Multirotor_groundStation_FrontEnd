import {useState, useCallback} from 'react';
import DroneMap from './components/DroneMap';
import SmartPanel from './components/SmartPanel';
import {CssBaseline, Box, Typography} from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import EventNoteIcon from '@mui/icons-material/EventNote';

// 类型定义保持不变
export interface PanelRect {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
}

function App() {
    const [panelBlockers, setPanelBlockers] = useState<PanelRect[]>([]);

    const handlePanelUpdate = useCallback((newRect: PanelRect) => {
        setPanelBlockers(prev => {
            const filtered = prev.filter(p => p.id !== newRect.id);
            return [...filtered, newRect];
        });
    }, []);

    return (
        // 1. 最外层容器：铺满全屏，相对定位，作为坐标系原点
        <Box sx={{
            position: 'relative', // 关键！
            width: '100vw',
            height: '100vh',
            overflow: 'hidden', // 禁止出现滚动条
            bgcolor: '#000',
        }}>
            <CssBaseline/>

            {/* --- 图层 1：地图层 (绝对定位，钉死在底层) --- */}
            <Box sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 1 // 地图层级最低
            }}>
                <DroneMap blockers={panelBlockers}/>
            </Box>

            {/* --- 图层 2：UI 悬浮层 (Panel) --- */}
            {/* 这里的 Panel 内部已经是 absolute 定位了，所以直接放即可 */}
            {/* 这里的 zIndex 在 Panel 内部控制，只要比 1 大就会浮起来 */}

            <SmartPanel
                id="video-panel"
                title="LIVE FEED - CAM 01"
                icon={<VideocamIcon/>}
                initialPosition={{x: 50, y: 50}} // 给一个稍微里面的位置
                onLayoutChange={handlePanelUpdate}
            >
                <Box sx={{
                    width: '100%', height: 200, bgcolor: 'black', position: 'relative',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
                }}>
                    <Typography variant="caption" sx={{color: 'gray', zIndex: 1}}>Connecting...</Typography>
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
                            opacity: 0.8,
                            zIndex: 2
                        }}
                    />
                </Box>
            </SmartPanel>

            <SmartPanel
                id="log-panel"
                title="MISSION LOG"
                icon={<EventNoteIcon/>}
                initialPosition={{x: 50, y: 400}} // 改一下位置，防止重叠
                onLayoutChange={handlePanelUpdate}
            >
                <Box sx={{p: 2, color: 'rgba(255,255,255,0.8)'}}>
                    <Typography variant="body2">• System Checking...</Typography>
                    <Typography variant="body2">• All Green</Typography>
                    <Typography variant="body2">• All Green</Typography>
                    <Typography variant="body2">• All Green</Typography>
                    <Typography variant="body2">• All Green</Typography>
                    <Typography variant="body2">• All Green</Typography>
                    <Typography variant="body2">• All Green</Typography>
                    <Typography variant="body2">• All Green</Typography>
                </Box>
            </SmartPanel>

        </Box>
    );
}

export default App;
