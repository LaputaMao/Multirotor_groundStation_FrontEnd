import {useState} from 'react';
import {Box, TextField, Button, Switch, FormControlLabel, Alert, CircularProgress} from '@mui/material';
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
        dem_path: null
    });

    const handleSubmit = async () => {
        setLoading(true);
        setSuccessMsg(null);
        try {
            const res = await createMission(formData);
            setSuccessMsg(`Task Created! ID: ${res.mission.id}`);
            // 这里可以扩展：比如在地图上画出返回的 route 航线
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
                variant="filled"
                size="small"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                InputLabelProps={{style: {color: '#aaa'}}}
                inputProps={{style: {color: 'white'}}}
                sx={{bgcolor: 'rgba(255,255,255,0.05)'}}
            />

            <TextField
                label="Location / Region"
                variant="filled"
                size="small"
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
                label="Simulation Mode"
                sx={{color: '#ccc'}}
            />

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
                    bgcolor: '#00e676',
                    color: '#000',
                    fontWeight: 'bold',
                    '&:hover': {bgcolor: '#00c853'}
                }}
            >
                {loading ? "SENDING..." : "EXECUTE"}
            </Button>
        </Box>
    );
};

export default CreateMissionForm;
