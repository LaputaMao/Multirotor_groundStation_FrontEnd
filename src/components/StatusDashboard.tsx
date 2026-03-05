import {Box, Typography, LinearProgress, Grid, Divider} from '@mui/material';
import SpeedIcon from '@mui/icons-material/Speed';
import HeightIcon from '@mui/icons-material/Height';
import RouteIcon from '@mui/icons-material/Route';
import SettingsInputComponentIcon from '@mui/icons-material/SettingsInputComponent'; // 模拟电机图标
import BatteryChargingFullIcon from '@mui/icons-material/BatteryChargingFull';

// 定义完整的遥测数据类型
export interface DroneTelemetry {
    lat: number;
    lon: number;
    alt: number;
    battery: number;
    speed: number;       // 新增
    distance: number;    // 新增
    motor_duty: number;  // 新增
    progress_index: number;
    total_points: number;
    status: string;
}

const StatItem = ({icon, label, value, unit, color = '#fff'}: any) => (
    <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        p: 1,
        bgcolor: 'rgba(255,255,255,0.05)',
        borderRadius: 1
    }}>
        <Box sx={{display: 'flex', alignItems: 'center', gap: 0.5, color: '#aaa', mb: 0.5}}>
            {icon}
            <Typography variant="caption">{label}</Typography>
        </Box>
        <Typography variant="h6" sx={{fontFamily: 'monospace', fontWeight: 'bold', color: color}}>
            {value} <Typography component="span" variant="caption" sx={{color: '#666'}}>{unit}</Typography>
        </Typography>
    </Box>
);

const StatusDashboard = ({data}: { data: DroneTelemetry }) => {
    // 防止除以0
    const progressPercent = data.total_points > 0
        ? Math.min(100, (data.progress_index / data.total_points) * 100)
        : 0;

    // 状态颜色映射
    const statusColor = data.status === 'flying' ? '#00e676' :
        data.status === 'idle' ? '#ff9800' : '#f44336';


    return (
        <Box sx={{p: 2, minWidth: 300, color: 'white'}}>

            {/* Header: 状态与电量 */}
            <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2}}>
                <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                    <Box sx={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        bgcolor: statusColor,
                        boxShadow: `0 0 8px ${statusColor}`
                    }}/>
                    <Typography variant="button" sx={{fontWeight: 'bold', color: statusColor}}>
                        {data.status.toUpperCase()}
                    </Typography>
                </Box>
                <Box sx={{display: 'flex', alignItems: 'center', color: data.battery < 20 ? '#ff5252' : '#29b6f6'}}>
                    <BatteryChargingFullIcon fontSize="small"/>
                    <Typography variant="body2" sx={{fontWeight: 'bold', ml: 0.5}}>
                        {data.battery < 0 ? '--' : `${data.battery}%`}
                    </Typography>
                </Box>
            </Box>

            {/* 进度条区域 */}
            <Box sx={{mb: 2}}>
                <Box sx={{display: 'flex', justifyContent: 'space-between', mb: 0.5}}>
                    <Typography variant="caption" sx={{color: '#aaa'}}>MISSION PROGRESS</Typography>
                    <Typography variant="caption" sx={{color: '#00e676'}}>
                        {data.progress_index} / {data.total_points}
                    </Typography>
                </Box>
                <LinearProgress
                    variant="determinate"
                    value={progressPercent}
                    sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: 'rgba(255,255,255,0.1)',
                        '& .MuiLinearProgress-bar': {bgcolor: '#00e676'}
                    }}
                />
            </Box>

            <Divider sx={{borderColor: 'rgba(255,255,255,0.1)', mb: 2}}/>

            {/* 核心仪表网格 */}
            <Grid container spacing={1} sx={{mb: 2}}>
                <Grid item xs={6}>
                    <StatItem icon={<SpeedIcon fontSize="inherit"/>} label="SPEED" value={data.speed.toFixed(1)}
                              unit="m/s" color="#29b6f6"/>
                </Grid>
                <Grid item xs={6}>
                    <StatItem icon={<HeightIcon fontSize="inherit"/>} label="ALTITUDE" value={data.alt.toFixed(1)}
                              unit="m" color="#ffd700"/>
                </Grid>
                <Grid item xs={6}>
                    <StatItem icon={<RouteIcon fontSize="inherit"/>} label="ODOMETER" value={data.distance.toFixed(0)}
                              unit="m"/>
                </Grid>
                <Grid item xs={6}>
                    <StatItem icon={<SettingsInputComponentIcon fontSize="inherit"/>} label="MOTOR"
                              value={data.motor_duty.toFixed(1)} unit="%"/>
                </Grid>
            </Grid>

            {/* 底部 GPS 坐标 */}
            <Box sx={{
                bgcolor: 'rgba(0,0,0,0.3)', p: 1, borderRadius: 1,
                border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex', justifyContent: 'space-between', fontFamily: 'monospace'
            }}>
                <Box>
                    <Typography variant="caption" sx={{color: '#666', display: 'block'}}>LATITUDE</Typography>
                    <Typography variant="body2">{data.lat.toFixed(7)} N</Typography>
                </Box>
                <Box sx={{textAlign: 'right'}}>
                    <Typography variant="caption" sx={{color: '#666', display: 'block'}}>LONGITUDE</Typography>
                    <Typography variant="body2">{data.lon.toFixed(7)} E</Typography>
                </Box>
            </Box>
        </Box>
    );
};

export default StatusDashboard;
