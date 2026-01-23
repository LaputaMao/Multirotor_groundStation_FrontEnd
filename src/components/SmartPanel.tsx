// src/components/SmartPanel.tsx
import React, {useEffect, useRef, useState} from "react";
import Draggable, {type DraggableEventHandler} from "react-draggable";
import {Box, Fade, IconButton, Paper, Tooltip, Typography} from "@mui/material";
import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen';
import type {PanelRect} from "../App"; // 引入类型
// 引入类型

interface SmartPanelProps {
    id: string; // 新增 ID
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    initialPosition?: { x: number; y: number };
    // 新增回调：告诉父组件我的位置变了
    onLayoutChange?: (rect: PanelRect) => void;
}

const SmartPanel: React.FC<SmartPanelProps> = ({
                                                   id,
                                                   title,
                                                   icon,
                                                   children,
                                                   initialPosition = {x: 0, y: 0},
                                                   onLayoutChange
                                               }) => {
    const [isMini, setIsMini] = useState(false);
    const [position, setPosition] = useState(initialPosition);
    const [isDragging, setIsDragging] = useState(false);
    const nodeRef = useRef<HTMLDivElement>(null);

    const screenWidth = window.innerWidth;
    const panelWidth = 320;
    const panelHeight = isMini ? 50 : 'auto'; // 简化：假设展开高度也是动态的，但在 Rect 里我们需要估算

    // --- 关键辅助函数：汇报位置 ---
    // 我们需要获取真实的 DOM 尺寸来汇报，但 React 更新是异步的，
    // 为了简化，我们根据已知状态估算 Rect
    const reportPosition = (x: number, y: number, mini: boolean) => {
        if (onLayoutChange) {
            // 稍微延迟一点点确保 DOM 渲染完成（也可以用 ResizeObserver，但这里简单处理）
            setTimeout(() => {
                const currentWidth = mini ? 50 : panelWidth;
                // 如果是展开状态，高度是不确定的，最好通过 ref 获取。
                // 这里为了演示 Buffer 逻辑，假设展开平均高度为 300
                // 如果 ref 存在，用真实高度
                let realHeight = mini ? 50 : 300;
                if (nodeRef.current) {
                    realHeight = nodeRef.current.offsetHeight;
                }

                onLayoutChange({
                    id,
                    x,
                    y,
                    width: currentWidth,
                    height: realHeight
                });
            }, 200); // 等待 CSS transition 结束
        }
    };

    // 初始化汇位置
    useEffect(() => {
        reportPosition(position.x, position.y, isMini);
    }, []);

    const handleStop: DraggableEventHandler = (_e, data) => {
        setIsDragging(false);
        const {x, y} = data;
        const edgeThreshold = 7;

        let newX: number;
        let newMini = isMini;

        if (x < screenWidth / 2) {
            newX = 20;
            if (x < edgeThreshold) {
                newMini = true;
                newX = 20; /* 贴边距离 */
            }
        } else {
            newX = screenWidth - panelWidth - 20;
            if (x > screenWidth - panelWidth - edgeThreshold) {
                newMini = true;
                newX = screenWidth - 70; // 小球靠右
            }
        }

        setPosition({x: newX, y});
        setIsMini(newMini);

        // 汇报新位置
        reportPosition(newX, y, newMini);
    };

    const handleExpand = () => {
        const newMini = false;
        setIsMini(newMini);
        let newX: number;
        if (position.x > screenWidth / 2) {
            newX = screenWidth - panelWidth - 20;
        } else {
            newX = 20;
        }
        setPosition({...position, x: newX});
        reportPosition(newX, position.y, newMini);
    };

    return (
        <Draggable
            nodeRef={nodeRef}
            position={position}
            onStart={() => setIsDragging(true)}
            onStop={handleStop}
            bounds="parent" // 关键：限制在 App 的 Box 内，就不会飞出去了
        >
            <Box
                ref={nodeRef}
                sx={{
                    position: "absolute",
                    zIndex: 1200,
                    cursor: isDragging ? "grabbing" : "grab",
                    transition: isDragging ? "none" : "all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)",
                    width: isMini ? 50 : panelWidth,
                    height: panelHeight,
                }}
            >
                {/* (内部渲染逻辑保持不变，依然是 Tooltip/Paper那一套) */}
                {isMini ? (
                    <Tooltip title={title} placement="right">
                        <Paper elevation={6} onClick={handleExpand} sx={{
                            width: 50, height: 50, borderRadius: "50%",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            bgcolor: "#00e676", color: "#000", border: '2px solid #fff'
                        }}>
                            {icon}
                        </Paper>
                    </Tooltip>
                ) : (
                    <Fade in={!isMini}>
                        <Paper elevation={10} sx={{
                            bgcolor: "rgba(20, 20, 20, 0.85)", backdropFilter: "blur(12px)",
                            border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: 3,
                            color: "white", overflow: "hidden", display: "flex", flexDirection: "column"
                        }}>
                            <Box sx={{
                                padding: "8px 16px", borderBottom: "1px solid rgba(255,255,255,0.1)",
                                display: "flex", justifyContent: "space-between", alignItems: "center",
                                background: "linear-gradient(90deg, rgba(0,230,118,0.1) 0%, rgba(0,0,0,0) 100%)"
                            }}>
                                <Typography variant="subtitle2"
                                            sx={{fontWeight: "bold", color: "#00e676"}}>{title}</Typography>
                                <IconButton size="small" onClick={(e) => {
                                    e.stopPropagation();
                                    const newMini = true;
                                    setIsMini(newMini);
                                    // 强制收缩逻辑...
                                    const targetX = position.x > screenWidth / 2 ? screenWidth - 70 : 20;
                                    setPosition({x: targetX, y: position.y});
                                    reportPosition(targetX, position.y, newMini); // 汇报
                                }} sx={{color: "rgba(255,255,255,0.5)", p: 0}}><CloseFullscreenIcon
                                    fontSize="small"/></IconButton>
                            </Box>
                            <Box>{children}</Box>
                        </Paper>
                    </Fade>
                )}
            </Box>
        </Draggable>
    );
};
export default SmartPanel;
