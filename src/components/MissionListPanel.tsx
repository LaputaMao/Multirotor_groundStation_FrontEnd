import React, {useEffect, useState} from 'react';
import {
    Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    IconButton, CircularProgress, Pagination
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import {getMissionList, type MissionListItem} from '../services/api';

interface MissionListPanelProps {
    selectedId: number | null;
    onSelect: (id: number) => void;
}

const MissionListPanel: React.FC<MissionListPanelProps> = ({selectedId, onSelect}) => {
    const [missions, setMissions] = useState<MissionListItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const pageSize = 5;

    const fetchMissions = async () => {
        setLoading(true);
        try {
            const res = await getMissionList(page, pageSize);
            setMissions(res.items);
            setTotal(res.total);
        } catch (error) {
            console.error("Failed to fetch missions", error);
        } finally {
            setLoading(false);
        }
    };

    // 页码改变或组件加载时请求
    useEffect(() => {
        fetchMissions();
    }, [page]);

    // 格式化时间
    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('zh-CN', {
            month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <Box sx={{p: 0, minHeight: 300, display: 'flex', flexDirection: 'column'}}>
            {/* 工具栏 */}
            <Box sx={{
                p: 1,
                display: 'flex',
                justifyContent: 'flex-end',
                borderBottom: '1px solid rgba(255,255,255,0.1)'
            }}>
                <IconButton size="small" onClick={fetchMissions} sx={{color: '#aaa'}}>
                    <RefreshIcon fontSize="small"/>
                </IconButton>
            </Box>

            <TableContainer sx={{flex: 1, bgcolor: 'transparent'}}>
                <Table size="small" stickyHeader>
                    <TableHead>
                        <TableRow>
                            <TableCell
                                sx={{bgcolor: '#1e1e1e', color: '#888', borderBottom: '1px solid #333'}}>ID</TableCell>
                            <TableCell sx={{
                                bgcolor: '#1e1e1e',
                                color: '#888',
                                borderBottom: '1px solid #333'
                            }}>Name</TableCell>
                            <TableCell align="right" sx={{
                                bgcolor: '#1e1e1e',
                                color: '#888',
                                borderBottom: '1px solid #333'
                            }}>Time</TableCell>
                            <TableCell align="center" sx={{
                                bgcolor: '#1e1e1e',
                                color: '#888',
                                borderBottom: '1px solid #333'
                            }}>St</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={4} align="center" sx={{py: 4}}><CircularProgress
                                    size={20}/></TableCell>
                            </TableRow>
                        ) : missions.map((row) => {
                            const isSelected = selectedId === row.id;
                            return (
                                <TableRow
                                    key={row.id}
                                    hover
                                    onClick={() => onSelect(row.id)}
                                    sx={{
                                        cursor: 'pointer',
                                        // 选中状态下的高亮背景色和左侧边框提示
                                        bgcolor: isSelected ? 'rgba(0, 191, 255, 0.15)' : 'transparent',
                                        borderLeft: isSelected ? '3px solid #00bfff' : '3px solid transparent',
                                        transition: 'all 0.2s',
                                        '&:last-child td, &:last-child th': {borderBottom: 0}
                                    }}
                                >
                                    <TableCell sx={{
                                        color: isSelected ? '#00bfff' : 'white',
                                        fontFamily: 'monospace'
                                    }}>#{row.id}</TableCell>
                                    <TableCell sx={{color: 'white'}}>{row.name}</TableCell>
                                    <TableCell align="right" sx={{
                                        color: '#aaa',
                                        fontSize: '0.75rem'
                                    }}>{formatDate(row.created_at)}</TableCell>
                                    <TableCell align="center">
                                        {row.finished_at ?
                                            <CheckCircleOutlineIcon sx={{fontSize: 16, color: '#00e676'}}/> :
                                            <RadioButtonUncheckedIcon sx={{fontSize: 16, color: '#aaa'}}/>
                                        }
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* 分页控制 */}
            <Box sx={{display: 'flex', justifyContent: 'center', p: 1, borderTop: '1px solid rgba(255,255,255,0.1)'}}>
                <Pagination
                    count={Math.ceil(total / pageSize)}
                    page={page}
                    onChange={(_, p) => setPage(p)}
                    size="small"
                    sx={{
                        '& .MuiPaginationItem-root': {color: '#aaa'},
                        '& .Mui-selected': {bgcolor: 'rgba(0, 230, 118, 0.3)', color: 'white'}
                    }}
                />
            </Box>
        </Box>
    );
};

export default MissionListPanel;
