
import { useState, useEffect } from 'react';
import { Box, Chip, Grid, Link, Tooltip, Typography } from '@mui/material';
import { Message } from '../api/client';
import { FormateMessage } from '../api/rules';
import client from '../api/tauriClient';
import { LevelRuleSet, LevelChipStyle } from '../api/rules';
interface MessageCardProps {
    message: FormateMessage;
    project_location?: string,
    level_style: LevelChipStyle
}

const MessageCard: React.FC<MessageCardProps> = ({
    message,
    project_location,
    level_style
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
                    <Chip label={msg.msg.role} variant='outlined' />
                    <Chip label={msg.msg.label} variant='outlined' />
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
                {/* <Grid size={1.2} display={'flex'} justifyContent={'center'}> */}
                {/* <Chip size='small' label={msg.msg.level} variant='outlined' /> */}
                <Tooltip title={msg.msg.level.toString()} placement='top'>
                    <Chip
                        variant={level_style.style === 'outline' ? 'outlined' : 'filled'}
                        label={level_style.text || ((msg.msg.level !== null) ? msg.msg.level.toString() : 'all')}
                        sx={{
                            bgcolor: level_style.style === 'fill' ? level_style.color : 'transparent',
                            color: level_style.style === 'outline' ? level_style.color : '#fff',
                            borderColor: level_style.color,
                            mr: 1,
                            minWidth: 40,
                        }}
                    />
                </Tooltip>
                {/* </Grid> */}
                {/* <Grid size={10}> */}
                {msg.msg.messages.map((msg, index) => (
                    <Typography key={index} variant="body2" display='inline-block'>{msg}</Typography>
                ))}
                {/* </Grid> */}
            </Box>
        </Box>
    )
}

interface LogViewProps {
    project_location?: string
    level_rules_sets: LevelRuleSet[]
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
    const ruleset = props.level_rules_sets.find((ruleset) => ruleset.disabled === false);
    return (
        <Box >
            {messages.map((message, index) => (
                <MessageCard level_style={ruleset?.rules.find((rule) => rule.level === message.level)?.style || { style: 'outline', color: '#fff', text: null }} project_location={props.project_location} key={index} message={new FormateMessage(message)} />
            ))}

        </Box>
    )
}

export default LogView;