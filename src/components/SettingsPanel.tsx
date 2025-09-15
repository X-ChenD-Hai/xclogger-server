import React, { useState } from 'react';
import Box from '@mui/material/Box';
import { Grid, List, ListItem, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import ContrastIcon from '@mui/icons-material/Contrast';
import { FaCriticalRole } from "react-icons/fa";
import { MdLabelImportant } from "react-icons/md";
import ClearAllIcon from '@mui/icons-material/ClearAll';
import LevelPanel, { LevelPanelProps } from './settings/LevelPanel';
import ProjectsPanel, { ProjectsPanelProps } from './settings/ProjectsPanel';
import RolePanel, { RolePanelProps } from './settings/RolePanel';
import LabelPanel, { LabelPanelProps } from './settings/LabelPanel';
interface SettingsProps { }



interface SettingsPanelAllProps extends SettingsProps, ProjectsPanelProps, LevelPanelProps, RolePanelProps, LabelPanelProps {}

const SettingsPanel = (props: SettingsPanelAllProps) => {
    type ItemKey = 'role' | 'project' | 'level' | 'label';
    interface SettingItem {
        name: string;
        key: ItemKey;
        icon: React.ReactNode;
    }
    const setting_items: SettingItem[] = [
        { name: '项目', key: 'project', icon: <ContrastIcon /> },
        { name: '角色', key: 'role', icon: <FaCriticalRole /> },
        { name: '日志等级', key: 'level', icon: <ClearAllIcon /> },
        { name: '标签', key: 'label', icon: <MdLabelImportant /> },
    ]

    const [act_item, setAct_item] = useState<ItemKey>('role');
    const itemChange = (key: ItemKey) => {
        console.log(key);
        setAct_item(key);
    }

    const checkPanel = () => {

        switch (act_item) {
            case 'project':
                return <ProjectsPanel project_location={props.project_location} />
            case 'role':
                return <RolePanel role_rule_sets={props.role_rule_sets} />
            case 'level':
                return <LevelPanel level_rule_sets={props.level_rule_sets} />
            case 'label':
                return <LabelPanel label_rule_sets={props.label_rule_sets} />
            default:
                return <div>默认设置</div>
        }
    }
    return (
        <Box sx={{ width: '100%', height: '100%' }}>
            <Grid container spacing={2}>
                <Grid size={3}>
                    <Box display={'flex'} sx={{ flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
                        <List>{setting_items.map(item =>
                            <ListItem key={item.key}
                                disablePadding sx={{ borderLeft: act_item === item.key ? '3px solid' : 'none', borderLeftColor: 'primary.main', color: act_item === item.key ? 'primary.main' : 'inherit' }}>
                                <ListItemButton onClick={() => itemChange(item.key)}>
                                    <ListItemIcon sx={{ color: act_item === item.key ? 'primary.main' : 'inherit' }} >
                                        {item.icon}
                                    </ListItemIcon>
                                    <ListItemText primary={item.name} />
                                </ListItemButton>
                            </ListItem>)}
                        </List>
                    </Box>
                </Grid>
                <Grid size={9}>
                    {checkPanel()}
                </Grid>
            </Grid>

        </Box>
    )
}

export default SettingsPanel;
