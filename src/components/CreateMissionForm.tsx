import {useState} from 'react';
import {Box, TextField, Button, Switch, FormControlLabel, Alert, CircularProgress, Collapse} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import {createMission, type MissionCreateRequest} from '../services/api';

const CreateMissionForm = () => {
    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    // 表单状态
    const [formData, setFormData] = useState<MissionCreateRequest>({
        name: "Mission-Alpha",
        location_name: "Chengdu_Sim_Area",
        simulate: true,
        dem_path: ""
    });

    const handleSubmit = async () => {
        // 简单的校验：如果是实飞模式，必须填 DEM 路径
        if (!formData.simulate && !formData.dem_path) {
            setSuccessMsg("Error: DEM Path is required for real flight!");
            return;
        }
        setLoading(true);
        setSuccessMsg(null);
        try {
            // 发送请求前清理数据，如果是模拟模式，dem_path 设为 null 或忽略
            const payload = {
                ...formData,
                dem_path: formData.simulate ? null : formData.dem_path
            };
            const res = await createMission(payload);
            setSuccessMsg(`Task Created! ID: ${res.mission.id}`);
        } catch (e) {
            console.error(e);
            setSuccessMsg("Error creating mission");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{p: 2, display: 'flex', flexDirection: 'column', gap: 2, color: 'white'}}>
            <TextField
                label="Task Name"
                variant="filled" size="small"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                InputLabelProps={{style: {color: '#aaa'}}}
                inputProps={{style: {color: 'white'}}}
                sx={{bgcolor: 'rgba(255,255,255,0.05)'}}
            />

            <TextField
                label="Location / Region"
                variant="filled" size="small"
                value={formData.location_name}
                onChange={(e) => setFormData({...formData, location_name: e.target.value})}
                InputLabelProps={{style: {color: '#aaa'}}}
                inputProps={{style: {color: 'white'}}}
                sx={{bgcolor: 'rgba(255,255,255,0.05)'}}
            />

            <FormControlLabel
                control={
                    <Switch
                        checked={formData.simulate}
                        onChange={(e) => setFormData({...formData, simulate: e.target.checked})}
                        color="secondary"
                    />
                }
                label={formData.simulate ? "Mode: Simulation (Simulated GPS)" : "Mode: Real Flight"}
                sx={{color: formData.simulate ? '#ccc' : '#ff9800'}} // 实飞模式变成橙色警告色
            />

            {/* 联动区域：只有当 simulate = false 时才显示 */}
            <Collapse in={!formData.simulate}>
                <TextField
                    label="Digital Elevation Model (DEM) Path"
                    placeholder="/home/drone/maps/terrain.tif"
                    variant="outlined" size="small"
                    fullWidth
                    value={formData.dem_path || ''}
                    onChange={(e) => setFormData({...formData, dem_path: e.target.value})}
                    InputProps={{
                        style: {color: '#ff9800', borderColor: '#ff9800'}, // 橙色文字强调重要性
                        // endAdornment: <FolderOpenIcon sx={{color: '#ff9800'}}/>
                    }}
                    InputLabelProps={{style: {color: '#ff9800'}}}
                    sx={{
                        bgcolor: 'rgba(255, 152, 0, 0.1)',
                        '& .MuiOutlinedInput-root': {
                            '& fieldset': {borderColor: 'rgba(255, 152, 0, 0.5)'},
                            '&:hover fieldset': {borderColor: '#ff9800'},
                        }
                    }}
                />
            </Collapse>

            {successMsg && (
                <Alert severity={successMsg.includes("Error") ? "error" : "success"} sx={{p: 0.5}}>
                    {successMsg}
                </Alert>
            )}

            <Button
                variant="contained"
                endIcon={loading ? <CircularProgress size={20} color="inherit"/> : <SendIcon/>}
                onClick={handleSubmit}
                disabled={loading}
                sx={{
                    bgcolor: formData.simulate ? '#00e676' : '#ff9800', // 按钮颜色随模式改变
                    color: '#000', fontWeight: 'bold',
                    '&:hover': {bgcolor: formData.simulate ? '#00c853' : '#f57c00'}
                }}
            >
                {loading ? "SENDING..." : (formData.simulate ? "EXECUTE SIMULATION" : "EXECUTE REAL FLIGHT")}
            </Button>
        </Box>
    );
};
export default CreateMissionForm;
