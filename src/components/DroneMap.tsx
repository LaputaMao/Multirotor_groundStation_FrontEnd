import React, {useEffect, useState} from 'react';
import {MapContainer, TileLayer, Marker, Polyline, useMap, GeoJSON} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {Box, Button, ButtonGroup, Chip, Tooltip, Typography} from '@mui/material';
import MapIcon from '@mui/icons-material/Map';
import SatelliteIcon from '@mui/icons-material/Satellite';
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

// === 新增：一个隐形组件，专门用于在 GeoJSON 数据改变时调整地图视野 ===
const GeoJsonFitter = ({data}: { data: never }) => {
    const map = useMap();

    useEffect(() => {
        if (data) {
            // 利用 Leaflet 原生方法计算 GeoJSON 的边界 (Bounding Box)
            const geoJsonLayer = L.geoJSON(data);
            const bounds = geoJsonLayer.getBounds();

            if (bounds.isValid()) {
                // padding 确保图形不会紧紧贴在屏幕边缘，留出 50px 空隙
                map.flyToBounds(bounds, {padding: [50, 50], duration: 1.5});
            }
        }
    }, [data, map]);

    return null; // 不需要渲染任何 DOM
};

// ... (DroneMap 主组件，需接收 blockers props) ...

interface DroneMapProps {
    blockers: PanelRect[];
    realTimePosition: [number, number] | null; // <--- 新增 Prop
    missionAreaGeoJson?: never; // 新增：接收任务区域数据
}

const DroneMap: React.FC<DroneMapProps> = ({blockers, realTimePosition, missionAreaGeoJson}) => {
    // 初始坐标：成都市中心附近
    // const [position, setPosition] = useState<[number, number]>([30.6586, 104.0648]);
    const defaultPos: [number, number] = [36.1411964, 120.1003234];
    const position = realTimePosition || defaultPos;

    // --- 新增功能 1: 历史轨迹状态 ---
    // pathHistory 是一个坐标数组 [[lat, lon], [lat, lon], ...]
    const [pathHistory, setPathHistory] = useState<[number, number][]>([]);

    // --- 新增功能 2: 地图底图类型 ---
    // 'dark' = 街道夜间模式 (CartoDB)
    // 'satellite' = 卫星影像 (Esri / Google)
    const [mapType, setMapType] = useState<'light' | 'satellite'>('satellite');

    // 当收到新坐标时，加入历史记录
    useEffect(() => {
        if (realTimePosition) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setPathHistory(prev => {
                // 简单的去重逻辑：如果无人机没动，不要重复加点
                const lastPoint = prev[prev.length - 1];
                if (lastPoint && lastPoint[0] === realTimePosition[0] && lastPoint[1] === realTimePosition[1]) {
                    return prev;
                }
                return [...prev, realTimePosition];
            });
        }
    }, [realTimePosition]);

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
                maxZoom={22}
                style={{height: '100%', width: '100%'}}
                zoomControl={false}
                scrollWheelZoom={true} // 允许滚轮缩放
            >

                {/*
            动态切换底图
            key={mapType} 是必须的！这迫使 Leaflet 重新渲染图层，避免瓦片混合
         */}
                {mapType === 'light' ? (
                    <TileLayer
                        key="light"
                        attribution='© CartoDB'
                        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                        maxZoom={22}         // 2. 允许拉伸的最大级别
                        maxNativeZoom={19}   // 3. 告诉Leaflet，这个图源原生只到19级，剩下的你帮我用CSS拉伸
                    />
                ) : (
                    <TileLayer
                        key="satellite"
                        attribution='© Esri'
                        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                        maxZoom={22}         // 2. 允许拉伸的最大级别
                        maxNativeZoom={19}   // 3. 告诉Leaflet，这个图源原生只到19级，剩下的你帮我用CSS拉伸
                    />
                )}

                {/* 将 blockers 传给控制器 */}
                <AutoPanController position={position} blockers={blockers}/>
                {realTimePosition && <Marker position={realTimePosition} icon={droneIcon}/>}
                {/*<Marker position={position} icon={droneIcon}/>*/}

                {/* --- 绘制轨迹线 --- */}
                {pathHistory.length > 1 && (
                    <Polyline
                        positions={pathHistory}
                        pathOptions={{
                            color: '#fff581',   // 黄色
                            weight: 3,          // 线条粗细
                            opacity: 1.0,
                            dashArray: '10, 10' // 点状/虚线效果 (10px实线, 10px空白)
                        }}
                    />
                )}

                {/* --- 渲染选中的任务区域 --- */}
                {missionAreaGeoJson && (
                    <>
                        {/*
                    给 GeoJSON 组件加 key 极其关键！
                    由于 react-leaflet 的设计原则，只有 key 改变时它才会真正销毁重建 DOM 以更新新数据，否则会残留以前的图形
                */}
                        <GeoJSON
                            key={JSON.stringify(missionAreaGeoJson)} // 用数据内容做 key，保证每次新数据渲染新的图层
                            data={missionAreaGeoJson}
                            pathOptions={{
                                color: '#00bfff',      // 亮蓝色边框
                                weight: 1,             // 细线
                                opacity: 0.7,
                                fillColor: '#00008b',  // 深蓝色填充
                                fillOpacity: 0.2     // 较高透明度
                            }}
                        />
                        {/* 触发展开视野动画 */}
                        <GeoJsonFitter data={missionAreaGeoJson}/>
                    </>
                )}


                <Marker position={position} icon={droneIcon}/>

                {/* 准星线：调低一点透明度，不抢眼 */}
                <Polyline positions={horizontalLine}
                          pathOptions={{color: '#9af34c', weight: 1.5, dashArray: '8, 8', opacity: 0.8}}/>
                <Polyline positions={verticalLine}
                          pathOptions={{color: '#a6ea64', weight: 1.5, dashArray: '8, 8', opacity: 0.8}}/>

            </MapContainer>

            {/* --- 地图切换悬浮按钮组 --- */}
            <Box sx={{
                position: 'absolute',
                top: 150, // 躲开左上角的 time panel 和 smart panel
                right: 20,
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column',
                gap: 1
            }}>
                <ButtonGroup orientation="vertical" variant="contained" sx={{
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(5px)',
                    border: '1px solid rgba(255,255,255,0.2)'
                }}>
                    <Tooltip title="Street Map" placement="left">
                        <Button
                            onClick={() => setMapType('light')}
                            sx={{color: mapType === 'light' ? '#00e676' : '#aaa'}}
                        >
                            <MapIcon/>
                        </Button>
                    </Tooltip>
                    <Tooltip title="Satellite Mode" placement="left">
                        <Button
                            onClick={() => setMapType('satellite')}
                            sx={{color: mapType === 'satellite' ? '#00e676' : '#aaa'}}
                        >
                            <SatelliteIcon/>
                        </Button>
                    </Tooltip>
                </ButtonGroup>
            </Box>

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
