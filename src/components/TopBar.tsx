import {useState, useEffect} from 'react';
import {Box, Typography, Paper, Fade} from '@mui/material';
// 引入图标
import WbSunnyIcon from '@mui/icons-material/WbSunny';       // 晴天
import CloudIcon from '@mui/icons-material/Cloud';           // 雾/多云
import GrainIcon from '@mui/icons-material/Grain';           // 小雨
import ThunderstormIcon from '@mui/icons-material/Thunderstorm'; // 大雨/雷暴

// --- 模拟数据生成工具 ---
const generateWeekWeather = () => {
    const types = ['sunny', 'foggy', 'light_rain', 'heavy_rain'] as const;
    const days = [];
    const today = new Date();

    for (let i = 0; i < 7; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);

        // 简单模拟：轮流展示不同天气，方便你看效果
        const type = types[i % 4];

        days.push({
            dateStr: `${d.getMonth() + 1}月${d.getDate()}日`,
            dayName: i === 0 ? '今天' : i === 1 ? '明天' : ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()],
            type: type,
            temp: 20 + Math.floor(Math.random() * 10) // 随机温度
        });
    }
    return days;
};

// --- 样式配置中心 (核心视觉效果) ---
const weatherStyles: Record<string, any> = {
    sunny: {
        label: '晴朗',
        icon: <WbSunnyIcon sx={{color: '#FFF59D', filter: 'drop-shadow(0 0 5px rgba(255, 235, 59, 0.8))'}}/>,
        // 橙黄色渐变 + 发光扩散效果
        bg: 'linear-gradient(135deg, #FFD700 0%, #FF8C00 100%)',
        shadow: '0 4px 15px rgba(255, 160, 0, 0.6)',
        border: '1px solid rgba(255, 255, 255, 0.4)'
    },
    foggy: {
        label: '大雾',
        icon: <CloudIcon sx={{color: '#E0E0E0'}}/>,
        // 灰蓝色渐变 + 磨砂质感 (尽可能模拟迷蒙)
        bg: 'linear-gradient(135deg, #90A4AE 0%, #546E7A 100%)',
        shadow: '0 4px 15px rgba(96, 125, 139, 0.5)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        customStyle: {filter: 'blur(0.5)'} // 视觉上的微模糊
    },
    light_rain: {
        label: '小雨',
        icon: <GrainIcon sx={{color: '#B3E5FC'}}/>,
        // 青色浅蓝渐变 + 清新感
        bg: 'linear-gradient(135deg, #4FC3F7 0%, #0288D1 100%)',
        shadow: '0 4px 15px rgba(3, 169, 244, 0.5)',
        border: '1px solid rgba(179, 229, 252, 0.4)'
    },
    heavy_rain: {
        label: '暴雨',
        icon: <ThunderstormIcon sx={{color: '#E040FB'}}/>,
        // 深蓝紫色渐变 + 压抑酷炫感
        bg: 'linear-gradient(135deg, #304FFE 0%, #6200EA 100%)',
        shadow: '0 4px 15px rgba(101, 31, 255, 0.6)',
        border: '1px solid rgba(224, 64, 251, 0.4)'
    }
};

const TopBar = () => {
    // 1. 时间状态
    const [currentTime, setCurrentTime] = useState(new Date());
    // 2. 天气数据状态
    const [forecast, setForecast] = useState<any[]>([]);

    useEffect(() => {
        // 启动时钟
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        // 加载模拟天气
        setForecast(generateWeekWeather());
        return () => clearInterval(timer);
    }, []);

    // 格式化时间 HH:mm:ss
    const timeString = currentTime.toLocaleTimeString('zh-CN', {hour12: false});

    return (
        <Box
            sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '140px', // 区域高度
                zIndex: 1100, // 稍微比悬浮板低一点，或者一样高
                pointerEvents: 'none', // 关键！让鼠标穿透透明区域，不影响操作地图
                // 背景：由上到下，从黑(0.9)渐变到全透明
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.6) 40%, rgba(0,0,0,0) 100%)',
                display: 'flex',
                alignItems: 'flex-start', // 内容靠上
                padding: '20px 40px',
            }}
        >
            {/* 左侧：巨大的时间显示 */}
            <Box sx={{
                color: '#fff',
                minWidth: '180px',
                textShadow: '0 0 20px rgba(0,255,118,0.6)', // 赛博朋克荧光绿光晕
                mt: 1
            }}>
                <Typography variant="h3" sx={{fontWeight: 'bold', fontFamily: 'monospace', letterSpacing: -2}}>
                    {timeString}
                </Typography>
                <Typography variant="subtitle1" sx={{opacity: 0.8, pl: 1}}>
                    {currentTime.toLocaleDateString()}
                </Typography>
            </Box>

            {/* 右侧：天气列表 Scrollview */}
            <Box sx={{
                flex: 1,
                display: 'flex',
                gap: 2,
                overflowX: 'auto', // 允许横向滚动（虽然我们有7个，屏幕大可能一排显示完）
                pb: 2, // 预留阴影空间
                pl: 4,
                scrollbarWidth: 'none', // 隐藏滚动条 (Firefox)
                '&::-webkit-scrollbar': {display: 'none'}, // 隐藏滚动条 (Chrome)
                pointerEvents: 'auto' // 恢复子元素的鼠标事件
            }}>
                {forecast.map((day, index) => {
                    const style = weatherStyles[day.type];

                    return (
                        <Fade in={true} timeout={500 + index * 100} key={index}>
                            <Paper
                                elevation={0}
                                sx={{
                                    minWidth: 100,
                                    height: 110,
                                    borderRadius: 4,
                                    color: '#fff',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'transform 0.3s ease',
                                    cursor: 'pointer',

                                    // 应用动态样式
                                    background: style.bg,
                                    boxShadow: style.shadow,
                                    border: style.border,

                                    '&:hover': {
                                        transform: 'translateY(5px) scale(1.05)', // 悬浮交互
                                    }
                                }}
                            >
                                <Typography variant="caption" sx={{opacity: 0.9, fontWeight: 'bold'}}>
                                    {day.dateStr}
                                </Typography>
                                <Typography variant="caption" sx={{mb: 1, opacity: 0.7}}>
                                    {day.dayName}
                                </Typography>

                                {/* 图标容器，稍微放大一点 */}
                                <Box sx={{transform: 'scale(1.5)', my: 1}}>
                                    {style.icon}
                                </Box>

                                <Box sx={{display: 'flex', alignItems: 'center', mt: 0.5}}>
                                    <Typography variant="body2" fontWeight="bold">
                                        {day.temp}°C
                                    </Typography>
                                </Box>
                            </Paper>
                        </Fade>
                    );
                })}
            </Box>
        </Box>
    );
};

export default TopBar;
