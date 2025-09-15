
import { useState, useEffect } from 'react';
import { Box, Chip, Link, Tooltip, Typography } from '@mui/material';
import { Message } from '../api/client';
import { FormateMessage, LabelRuleSet, RoleRuleSet } from '../api/rules';
import client from '../api/tauriClient';
import { LevelRuleSet, ChipStyle } from '../api/rules';
import React from 'react';
interface MessageCardProps {
    message: FormateMessage;
    project_location?: string,
    level_rules_sets: LevelRuleSet[],
    role_rules_sets: RoleRuleSet[]
    label_rules_sets: LabelRuleSet[]
}
const StyleChip = React.memo((props: { label: string, style: ChipStyle }) => {
    return <Chip
        variant={props.style.style === 'outline' ? 'outlined' : 'filled'}
        label={props.style.text || props.label}
        sx={{
            bgcolor: props.style.style === 'fill' ? props.style.color : 'transparent',
            color: props.style.style === 'outline' ? props.style.color : '#fff',
            borderColor: props.style.color,
            mr: 1,
            minWidth: 40,
        }}
    />
})
const MessageCard: React.FC<MessageCardProps> = React.memo(({
    message,
    project_location,
    level_rules_sets,
    role_rules_sets,
    label_rules_sets,
}) => {
    const msg = message;
    const get_relative_path = (file: string) => {
        if (!project_location) {
            return file;
        }
        if (file.startsWith(project_location)) {
            return file.slice(project_location.length);
        }
        return file;
    }
    return (
        <Box sx={{ pl: 3, pt: 1 }}>
            <Box display='flex' sx={{ justifyContent: 'space-between', bgcolor: 'background.paper', borderRadius: 1, mb: 1 }}>
                <Box display={'flex'} alignItems={'center'}>
                    <StyleChip label={msg.msg.role} style={msg.roleStyle(role_rules_sets)} />
                    <StyleChip label={msg.msg.label} style={msg.labelStyle(label_rules_sets)} />
                </Box>
                <Box display={'flex'} flexDirection={'row'} justifyContent={'space-between'} alignItems={'end'}>
                    <Box display={'flex'} flexDirection={'column'}>
                        <Typography color='text.secondary' variant="body2" sx={{ mr: 2 }}>id: {msg.msg.id}</Typography>
                        <Typography color='text.secondary' variant="body2" sx={{ mr: 2 }}>{msg.time}</Typography>
                    </Box>
                    <Box display={'flex'} flexDirection={'column'}>
                        {msg.msg.file &&
                            <Link color='text.secondary' underline='hover' href={message.msg ? `vscode://file/${msg.msg.file}:${msg.msg.line}` : ''}>
                                {get_relative_path(msg.msg.file) + ((msg.msg.line !== undefined) ? `:${msg.msg.line}` : '')}
                            </Link>}
                        {msg.msg.function &&
                            <Typography color='text.secondary' variant="body2" sx={{ mr: 1 }}>{msg.msg.function}</Typography>}
                    </Box>
                </Box>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
                <Typography variant="h6" sx={{ ml: 1 }}>{msg.msg.id}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', mb: 1 }}>
                <Tooltip title={msg.msg.level.toString()} placement='top'>
                    <StyleChip label={msg.msg.level.toString()} style={msg.levelStyle(level_rules_sets)} />
                </Tooltip>
                {msg.msg.messages.map((msg, index) => (
                    <Typography key={index} variant="body2" display='inline-block'>{msg}</Typography>
                ))}
            </Box>
        </Box>
    )
})

interface LogViewProps {
    project_location?: string
    level_rules_sets: LevelRuleSet[]
    role_rules_sets: RoleRuleSet[]
    label_rules_sets: LabelRuleSet[]
}

const LogView = (props: LogViewProps) => {
    const [messages, setMessages] = useState<Message[]>([]);
    useEffect(() => {
        // 定义一个异步函数获取数据
        const fetchMessages = async () => {
            try {
                const res = await client.get_messages(100, 0);
                setMessages(res); // 假设 res 就是 Message[] 类型
            } catch (error) {
                console.error('获取消息失败:', error);
                // 可以在这里处理错误，例如设置一个错误状态
            }
        };

        fetchMessages();
    }, []); // 空依赖数组确保只在组件挂载时执行一次
    return (
        <Box >
            {messages.map((message) => (
                <MessageCard
                    level_rules_sets={props.level_rules_sets}
                    project_location={props.project_location}
                    role_rules_sets={props.role_rules_sets}
                    label_rules_sets={props.label_rules_sets}
                    key={message.id}
                    message={new FormateMessage(message)}
                />
            ))}

        </Box>
    )
}

export default LogView;