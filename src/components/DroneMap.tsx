import React, {useEffect} from 'react';
import {MapContainer, TileLayer, Marker, Polyline, useMap} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {Box, Chip, Typography} from '@mui/material';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import type {PanelRect} from "../App.tsx";

const droneIcon = new L.Icon({
    iconUrl: '/drone.png', // Vite 中，/ 直接指向 public 目录
    iconSize: [40, 40],    // 图标大小，根据你的图片比例调整，比如 [40, 40] 或 [50, 50]
    iconAnchor: [20, 20],  // 锚点：也就是图片的中心点 (通常是 iconSize 的一半)
    className: 'drone-custom-icon' // ⚠️ 重点！这个类名一定要保留！
});

// --- 核心优化：基于遮挡检测的智能视角 ---
const AutoPanController = ({
                               position,
                               blockers
                           }: {
    position: L.LatLngTuple,
    blockers: PanelRect[]
}) => {
    const map = useMap();

    useEffect(() => {
        if (!position) return;

        // 1. 将无人机经纬度转换为屏幕像素坐标 (x, y)
        const dronePoint = map.latLngToContainerPoint(position);

        // 2. 检查是否被任何一个板子遮挡
        // 我们定义一个 "Padding"，让飞机不贴着板子边缘
        const padding = 50;

        let isObscured = false;

        // 遍历所有板子
        for (const panel of blockers) {
            // 简单的矩形碰撞检测
            // 板子区域：Left, Right, Top, Bottom
            const pLeft = panel.x;
            const pRight = panel.x + panel.width;
            const pTop = panel.y;
            const pBottom = panel.y + panel.height;

            // 无人机是否在板子内 (或者非常靠近板子)
            if (
                dronePoint.x > pLeft - padding &&
                dronePoint.x < pRight + padding &&
                dronePoint.y > pTop - padding &&
                dronePoint.y < pBottom + padding
            ) {
                isObscured = true;
                break; // 只要被其中一个挡住，就需要移动
            }
        }

        // 3. 同时也检查是否飞出了屏幕边缘 (原逻辑保持)
        const bounds = map.getBounds();
        const paddedBounds = bounds.pad(-0.1); // 内缩 10%
        const isOutOfScreen = !paddedBounds.contains(position);

        // 4. 如果被挡住 OR 飞出屏幕，就移动地图
        if (isObscured || isOutOfScreen) {
            // 这里只是简单地把地图中心对准无人机
            // 进阶做法是：计算出一个"不被遮挡的最佳可视为位置"，但 panTo(position) 已经足够解决问题
            map.panTo(position, {animate: true, duration: 0.8});
        }

    }, [position, map, blockers]); // 监听 blockers 变化！

    return null;
};

// ... (DroneMap 主组件，需接收 blockers props) ...

interface DroneMapProps {
    blockers: PanelRect[];
    realTimePosition: [number, number] | null; // <--- 新增 Prop
}

const DroneMap: React.FC<DroneMapProps> = ({blockers, realTimePosition}) => {
    // 初始坐标：成都市中心附近
    // const [position, setPosition] = useState<[number, number]>([30.6586, 104.0648]);
    const defaultPos: [number, number] = [30.6586, 104.0648];
    const position = realTimePosition || defaultPos;
    // --- 模拟无人机飞行 (轨迹稍微复杂点，画个"8"字) ---
    // useEffect(() => {
    //     let angle = 0;
    //     const timer = setInterval(() => {
    //         angle += 0.05; // 每次增加的角度
    //         const newLat = 30.6586 + Math.sin(angle) * 0.002;
    //         const newLng = 104.0648 + Math.sin(angle * 2) * 0.004; // "8"字形轨迹
    //         setPosition([newLat, newLng]);
    //     }, 100); // 提高刷新率到 50ms (20fps) 测试丝滑度
    //
    //     return () => clearInterval(timer);
    // }, []);

    // 计算十字线 (全屏延伸)
    // 我们不需要每次重新计算巨大的数值，用 map bounds 更好，
    // 但为了简单，这里直接画两条很长的线即可
    const longRange = 1.0; // 这里的 1.0 经纬度跨度已经涵盖整个城市了
    const verticalLine: [number, number][] = [
        [position[0] - longRange, position[1]],
        [position[0] + longRange, position[1]]
    ];
    const horizontalLine: [number, number][] = [
        [position[0], position[1] - longRange],
        [position[0], position[1] + longRange]
    ];

    return (
        <Box sx={{width: '100%', height: '100%', position: 'relative', bgcolor: '#1e1e1e'}}>

            <MapContainer
                center={defaultPos}
                zoom={17}
                style={{height: '100%', width: '100%'}}
                zoomControl={false}
                scrollWheelZoom={true} // 允许滚轮缩放
            >
                {/* 使用更有科技感的 CartoDB Dark Matter 地图底图 (暗色模式) */}
                {/* 如果你喜欢亮色，可以改回之前的 OSM */}
                {/* 方案 A: 亮色 OSM */}
                <TileLayer
                    attribution='© OSM'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* 方案 B: 暗黑科技风 (推荐尝试，配合 MUI 很酷) */}

                {/*<TileLayer*/}
                {/*    attribution='© CartoDB'*/}
                {/*    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"*/}
                {/*/>*/}


                {/* 将 blockers 传给控制器 */}
                <AutoPanController position={position} blockers={blockers}/>
                {realTimePosition && <Marker position={realTimePosition} icon={droneIcon} />}
                {/*<Marker position={position} icon={droneIcon}/>*/}

                {/* 准星线：调低一点透明度，不抢眼 */}
                <Polyline positions={horizontalLine}
                          pathOptions={{color: '#ff1744', weight: 1, dashArray: '8, 8', opacity: 0.8}}/>
                <Polyline positions={verticalLine}
                          pathOptions={{color: '#2979ff', weight: 1, dashArray: '8, 8', opacity: 0.8}}/>

            </MapContainer>

            {/* 坐标悬浮窗 (已移动到右下角) */}
            <Box
                sx={{
                    position: 'absolute',
                    bottom: 30, // 距离底部 30px
                    right: 30,  // 距离右侧 30px
                    pointerEvents: 'none', // 鼠标穿透
                    zIndex: 9999, // 确保浮在地图上层
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end', // 让内容靠右对齐
                    gap: 1, // 如果以后有多个数据，它们之间会有间距
                }}
            >
                {/* 稍微加了一点点标题说明，更有仪表盘的感觉 */}
                <Typography
                    variant="caption"
                    sx={{
                        color: 'rgba(255,255,255,0.7)',
                        fontSize: '0.7rem',
                        mr: 1,
                        fontFamily: 'monospace',
                        textTransform: 'uppercase'
                    }}
                >
                    Real-time Coordinates
                </Typography>

                <Chip
                    icon={<GpsFixedIcon style={{color: '#00e676', fontSize: '1.2rem'}}/>}
                    // 这里我对格式化做了一点微调，用 / 分割更像工程参数
                    label={`${position[0].toFixed(6)} N / ${position[1].toFixed(6)} E`}
                    sx={{
                        height: 'auto', // 允许高度自适应
                        padding: '8px 4px',
                        backgroundColor: 'rgba(15, 23, 42, 0.85)', // 深蓝灰色背景，更现代
                        color: '#00e676', // 荧光绿数据
                        fontFamily: '"JetBrains Mono", Consolas, monospace', // 尽量用代码字体
                        fontSize: '1rem',
                        fontWeight: 600,
                        letterSpacing: '0.5px', // 增加字间距
                        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)', // 玻璃拟态阴影
                        backdropFilter: 'blur(8px)', // 毛玻璃效果
                        border: '1px solid rgba(255, 255, 255, 0.1)', // 极细的边框
                        borderRadius: '8px', //稍微方一点的圆角，不像之前那么圆
                        '& .MuiChip-label': {
                            paddingLeft: '8px',
                            paddingRight: '12px'
                        }
                    }}
                />
            </Box>
        </Box>
    );
};

export default DroneMap;
