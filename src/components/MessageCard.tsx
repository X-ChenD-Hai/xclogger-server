import { Box, Chip, Link, Tooltip, Typography } from '@mui/material';
import { FormateMessage, LabelRuleSet, RoleRuleSet } from '../api/rules';
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
            height: 22,
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
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography color='text.secondary' variant="body2" sx={{ mr: 2 }}>process id: </Typography>
                            <Typography color='text.secondary' variant="body2" sx={{ mr: 2 }}>{msg.msg.process_id}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography color='text.secondary' variant="body2" sx={{ mr: 2 }}>thread id: </Typography>
                            <Typography color='text.secondary' variant="body2" sx={{ mr: 2 }}>{msg.msg.thread_id}</Typography>
                        </Box>
                    </Box>
                    <Box display={'flex'} flexDirection={'column'}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography color='text.secondary' variant="body2" sx={{ mr: 2 }}>id: </Typography>
                            <Typography color='text.secondary' variant="body2" sx={{ mr: 2 }}>{msg.msg.id}</Typography>
                        </Box>
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
            <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-end', mb: 1 }}>
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

export default MessageCard;