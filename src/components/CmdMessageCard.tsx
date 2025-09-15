import React, { useState } from 'react';
import { Box, Link, Tooltip, Typography } from '@mui/material';
import { FormateMessage, LevelRuleSet, RoleRuleSet, LabelRuleSet } from '../api/rules';
import RoundaboutRightIcon from '@mui/icons-material/RoundaboutRight';interface CmdMessageCardProps {
    message: FormateMessage;
    level_rules_sets: LevelRuleSet[];
    role_rules_sets: RoleRuleSet[];
    label_rules_sets: LabelRuleSet[];
}

const CmdMessageCard: React.FC<CmdMessageCardProps> = React.memo(({
    message,
    level_rules_sets,
    role_rules_sets,
    label_rules_sets,
}) => {
    const [hovered, setHovered] = useState(false);

    // 获取样式
    const levelStyle = message.levelStyle(level_rules_sets);
    const roleStyle = message.roleStyle(role_rules_sets);
    const labelStyle = message.labelStyle(label_rules_sets);

    // 格式化时间 (HH:MM:SS)
    const formatTime = (timestamp: number) => {
        const date = new Date(timestamp / 1000);
        return date.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    // 连接所有消息内容
    const messageContent = message.msg.messages.join(' ');

    return (
        <Tooltip
            title={
                <Box>
                    <Typography variant="body2">完整消息: {messageContent}</Typography>
                    <Typography variant="caption">时间: {new Date(message.msg.time / 1000).toLocaleString()}</Typography>
                    <br />
                    <Typography variant="caption">角色: {message.msg.role}</Typography>
                    <br />
                    <Typography variant="caption">标签: {message.msg.label}</Typography>
                    <br />
                    <Typography variant="caption">级别: {message.msg.level}</Typography>
                </Box>
            }
            placement="top-start"
            arrow
        >
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    py: 0.5,
                    px: 1,
                    borderRadius: 1,
                    bgcolor: hovered ? 'rgba(255,255,255,0.1)' : 'transparent',
                    transition: 'background-color 0.2s',
                    width: '100%',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                    backgroundColor: '#1e1e1e',
                    color: '#d4d4d4',
                }}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
            >
                {/* 时间 */}
                <Typography
                    component="span"
                    sx={{
                        color: '#6a9955',
                        mr: 1,
                        minWidth: 70,
                    }}
                >
                    {formatTime(message.msg.time)}
                </Typography>

                {/* 级别 - 放在时间后面 */}
                <Typography
                    component="span"
                    sx={{
                        bgcolor: levelStyle.style === 'fill' ? levelStyle.color : 'transparent',
                        color: levelStyle.style === 'outline' ? levelStyle.color : '#fff',
                        borderRadius: '2px',
                        mr: 1,
                    }}
                >
                    [{levelStyle.text || message.msg.level}]
                </Typography>

                {/* 消息内容 - 占据剩余空间 */}
                <Typography
                    component="span"
                    sx={{
                        flex: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        mr: 1,
                    }}
                >
                    {messageContent}
                </Typography>

                {/* 右侧容器 - 放置角色和级别 */}
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    flexShrink: 0,
                    ml: 'auto',
                }}>
                    {/* 角色 */}
                    <Typography
                        component="span"
                        sx={{
                            bgcolor: roleStyle.style === 'fill' ? roleStyle.color : 'transparent',
                            color: roleStyle.style === 'outline' ? roleStyle.color : '#fff',
                            mr: 1,
                            borderRadius: '2px',
                        }}
                    >
                        [{message.msg.role}]
                    </Typography>

                    {/* 标签 */}
                    <Typography
                        component="span"
                        sx={{
                            bgcolor: labelStyle.style === 'fill' ? labelStyle.color : 'transparent',
                            color: labelStyle.style === 'outline' ? labelStyle.color : '#fff',
                            mr: 1,
                            borderRadius: '2px',
                        }}
                    >
                        [{message.msg.label}]
                    </Typography>
                    {message.msg.file &&
                    <Tooltip
                        
                        title={
                            <Box>
                                <Typography variant="body2">文件: {message.msg.file}</Typography>
                                <Typography variant="caption">行号: {message.msg.line}</Typography>
                            </Box>
                        }
                        placement="top-start"
                        arrow
                    >
                        <Link color='text.secondary' underline='hover' href={message.msg ? `vscode://file/${message.msg.file}:${message.msg.line}` : ''}>
                            <RoundaboutRightIcon  sx={{ mr: 1 }} />
                        </Link>
                    </Tooltip>
                        }
                </Box>
            </Box>
        </Tooltip>
    )
});

export default CmdMessageCard;