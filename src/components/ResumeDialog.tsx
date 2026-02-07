import React from 'react';
import {Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

interface ResumeDialogProps {
    open: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

const ResumeDialog: React.FC<ResumeDialogProps> = ({open, onConfirm, onCancel}) => {
    return (
        <Dialog
            open={open}
            // 这里的 onClose 留空，强制用户必须选一个 (或者点击遮罩层不做反应)
            PaperProps={{
                sx: {
                    bgcolor: 'rgba(30, 30, 30, 0.95)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid #ff9800',
                    color: 'white',
                    minWidth: 320
                }
            }}
        >
            <DialogTitle sx={{display: 'flex', alignItems: 'center', gap: 1, color: '#ff9800'}}>
                <WarningAmberIcon/>
                SYSTEM ALERT
            </DialogTitle>
            <DialogContent>
                <Typography variant="body1" sx={{fontWeight: 'bold', mb: 1}}>
                    Interrupted Task Detected
                </Typography>
                <Typography variant="body2" sx={{color: '#bbb'}}>
                    An unfinished waypoint sequence was found in the drone's memory.
                    Do you want to RESUME from the last checkpoint, or DISCARD it?
                </Typography>
            </DialogContent>
            <DialogActions sx={{p: 2, justifyContent: 'space-between'}}>
                <Button
                    onClick={onCancel}
                    variant="outlined" color="error"
                    sx={{fontWeight: 'bold'}}
                >
                    DISCARD (Delete)
                </Button>
                <Button
                    onClick={onConfirm}
                    variant="contained"
                    sx={{bgcolor: '#ff9800', color: 'black', fontWeight: 'bold', '&:hover': {bgcolor: '#f57c00'}}}
                >
                    RESUME FLIGHT
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ResumeDialog;
