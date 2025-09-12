import React, { useState } from 'react';
import Box from '@mui/material/Box';
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Button,
    Chip,
    Grid,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
    Checkbox,
    IconButton,
    Tooltip,
    Switch
} from '@mui/material';
import {
    ArrowDownward as ArrowDownwardIcon,
    Add as AddIcon,
    Delete as DeleteIcon,
    ArrowUpward as ArrowUpwardIcon,
    ArrowDownward as ArrowDownIcon,
    CheckBox as CheckBoxIcon,
    CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon,
    MoreVert as MoreVertIcon
} from '@mui/icons-material';
import { LevelRule, LevelRuleSet } from '../../api/rules';
import { ColorEditor } from '../ColorEditor';

type State<T> = [T, (val: T) => void];

export interface LevelPanelProps {
    level_rule_sets: State<LevelRuleSet[]>;
}

const LevelPanel = (props: LevelPanelProps) => {
    const [selectedRuleSets, setSelectedRuleSets] = useState<number[]>([]);
    const [selectedRules, setSelectedRules] = useState<{ setIndex: number, ruleIndex: number }[]>([]);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [currentSetIndex, setCurrentSetIndex] = useState<number>(-1);

    const append_rule_set = () => {
        let name = '新建规则集';
        let i = 0;
        while (props.level_rule_sets[0].some(rule_set => rule_set.name === name)) {
            name = `新建规则集(${++i})`;
        }
        const new_rule_set: LevelRuleSet = {
            name,
            rules: [],
            disabled: true,
        }
        props.level_rule_sets[1]([...props.level_rule_sets[0], new_rule_set]);
    }

    const append_rule = (index: number) => {
        const rule_set = props.level_rule_sets[0][index];
        const max_level = rule_set.rules.reduce((acc, cur) => Math.max(acc, cur.level || 0), 0);
        let new_rule_sets = [...props.level_rule_sets[0]];
        new_rule_sets[index].rules.push({
            level: max_level + 1,
            style: { color: '#1976d2', style: 'fill', text: null }
        });
        props.level_rule_sets[1](new_rule_sets);
    }

    const update_rule = (index: number, rule_index: number, rule: LevelRule) => {
        const new_rule_sets = [...props.level_rule_sets[0]];
        new_rule_sets[index].rules[rule_index] = rule;
        props.level_rule_sets[1](new_rule_sets);
    }

    const delete_rule_set = (index: number) => {
        const new_rule_sets = props.level_rule_sets[0].filter((_, i) => i !== index);
        props.level_rule_sets[1](new_rule_sets);
        setSelectedRuleSets(selectedRuleSets.filter(i => i !== index));
    }

    const move_rule_set_up = (index: number) => {
        if (index <= 0) return;
        const new_rule_sets = [...props.level_rule_sets[0]];
        [new_rule_sets[index], new_rule_sets[index - 1]] = [new_rule_sets[index - 1], new_rule_sets[index]];
        props.level_rule_sets[1](new_rule_sets);
    }

    const move_rule_set_down = (index: number) => {
        if (index >= props.level_rule_sets[0].length - 1) return;
        const new_rule_sets = [...props.level_rule_sets[0]];
        [new_rule_sets[index], new_rule_sets[index + 1]] = [new_rule_sets[index + 1], new_rule_sets[index]];
        props.level_rule_sets[1](new_rule_sets);
    }

    const handle_rule_set_select = (index: number, selected: boolean) => {
        if (selected) {
            setSelectedRuleSets([...selectedRuleSets, index]);
        } else {
            setSelectedRuleSets(selectedRuleSets.filter(i => i !== index));
        }
    }

    const handle_rule_select = (setIndex: number, ruleIndex: number, selected: boolean) => {
        if (selected) {
            setSelectedRules([...selectedRules, { setIndex, ruleIndex }]);
        } else {
            setSelectedRules(selectedRules.filter(r =>
                !(r.setIndex === setIndex && r.ruleIndex === ruleIndex)
            ));
        }
    }

    const insert_rule_set = (position: number) => {
        let name = '新建规则集';
        let i = 0;
        while (props.level_rule_sets[0].some(rule_set => rule_set.name === name)) {
            name = `新建规则集(${++i})`;
        }
        const new_rule_set: LevelRuleSet = {
            name,
            rules: [],
            disabled: true,
        }

        const new_rule_sets = [...props.level_rule_sets[0]];
        new_rule_sets.splice(position + 1, 0, new_rule_set);
        props.level_rule_sets[1](new_rule_sets);
        handleMenuClose();
    }

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, index: number) => {
        setAnchorEl(event.currentTarget);
        setCurrentSetIndex(index);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setCurrentSetIndex(-1);
    };

    // 规则操作函数
    const move_rule_up = (setIndex: number, ruleIndex: number) => {
        if (ruleIndex <= 0) return;
        const new_rule_sets = [...props.level_rule_sets[0]];
        const rules = new_rule_sets[setIndex].rules;
        [rules[ruleIndex], rules[ruleIndex - 1]] = [rules[ruleIndex - 1], rules[ruleIndex]];
        props.level_rule_sets[1](new_rule_sets);
    };

    const move_rule_down = (setIndex: number, ruleIndex: number) => {
        const rules = props.level_rule_sets[0][setIndex].rules;
        if (ruleIndex >= rules.length - 1) return;
        const new_rule_sets = [...props.level_rule_sets[0]];
        [rules[ruleIndex], rules[ruleIndex + 1]] = [rules[ruleIndex + 1], rules[ruleIndex]];
        props.level_rule_sets[1](new_rule_sets);
    };

    const delete_rule = (setIndex: number, ruleIndex: number) => {
        const new_rule_sets = [...props.level_rule_sets[0]];
        new_rule_sets[setIndex].rules.splice(ruleIndex, 1);
        props.level_rule_sets[1](new_rule_sets);
        // 更新选中状态
        setSelectedRules(selectedRules.filter(r =>
            !(r.setIndex === setIndex && r.ruleIndex === ruleIndex)
        ));
    };

    const insert_rule_after = (setIndex: number, ruleIndex: number) => {
        const new_rule_sets = [...props.level_rule_sets[0]];
        const newRule: LevelRule = {
            level: null,
            style: { color: '#1976d2', style: 'fill', text: null }
        };
        new_rule_sets[setIndex].rules.splice(ruleIndex + 1, 0, newRule);
        props.level_rule_sets[1](new_rule_sets);
    };

    return (
        <Box>
            {/* 规则集列表 - 操作按钮集成到每个项的右侧 */}
            {props.level_rule_sets[0].map((rule_set, index) => (
                <Box key={index} sx={{ position: 'relative', mb: 1 }}>
                    {/* 插入按钮 - 在每个规则集之前（第一个规则集前不显示） */}
                    {index > 0 && (
                        <Tooltip title="在此插入新规则集">
                            <IconButton
                                size="small"
                                onClick={() => insert_rule_set(index - 1)}
                                sx={{
                                    position: 'absolute',
                                    left: '50%',
                                    top: -20,
                                    transform: 'translateX(-50%)',
                                    zIndex: 10,
                                    backgroundColor: 'background.paper',
                                    '&:hover': {
                                        backgroundColor: 'primary.main',
                                        color: 'white'
                                    }
                                }}
                            >
                                <AddIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    )}

                    <Accordion>
                        <AccordionSummary
                            expandIcon={<ArrowDownwardIcon />}
                            aria-controls={`${rule_set.name}-content`}
                            id={`${rule_set.name}-header`}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                <Switch
                                    checked={!rule_set.disabled}
                                    onChange={(_, v) => {
                                        if (v) {
                                            const new_rule_sets = props.level_rule_sets[0].map(
                                                r => { r.disabled = true; return r; })
                                            new_rule_sets[index].disabled = false;
                                            props.level_rule_sets[1](new_rule_sets);
                                        } else {
                                            const new_rule_sets = [...props.level_rule_sets[0]]
                                            new_rule_sets[index].disabled = true;
                                            props.level_rule_sets[1](new_rule_sets);
                                        }

                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                />

                                <Typography component="span" sx={{ ml: 1, flexGrow: 1 }}>
                                    {rule_set.name}
                                </Typography>

                                {/* 右侧操作按钮组 */}
                                <Box sx={{ display: 'flex', gap: 0.5 }} onClick={(e) => e.stopPropagation()}>
                                    <Tooltip title="上移">
                                        <span>
                                            <IconButton
                                                size="small"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    move_rule_set_up(index);
                                                }}
                                                disabled={index === 0}
                                            >
                                                <ArrowUpwardIcon fontSize="small" />
                                            </IconButton>
                                        </span>
                                    </Tooltip>

                                    <Tooltip title="下移">
                                        <span>
                                            <IconButton
                                                size="small"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    move_rule_set_down(index);
                                                }}
                                                disabled={index === props.level_rule_sets[0].length - 1}
                                            >
                                                <ArrowDownIcon fontSize="small" />
                                            </IconButton>
                                        </span>
                                    </Tooltip>

                                    <Tooltip title="删除">
                                        <span>
                                            <IconButton
                                                size="small"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    delete_rule_set(index);
                                                }}
                                                color="error"
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </span>
                                    </Tooltip>

                                    <Tooltip title="更多操作">
                                        <IconButton
                                            size="small"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleMenuOpen(e, index);
                                            }}
                                        >
                                            <MoreVertIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                </Box>
                            </Box>
                        </AccordionSummary>

                        <AccordionDetails>
                            {/* 规则操作区域 */}
                            <Box sx={{ mb: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
                                <Typography variant="subtitle2">
                                    规则管理 ({rule_set.rules.length} 条规则)
                                </Typography>
                                <Button
                                    size="small"
                                    startIcon={<AddIcon />}
                                    onClick={() => append_rule(index)}
                                    variant="outlined"
                                >
                                    添加规则
                                </Button>
                            </Box>

                            {/* 规则列表 */}
                            {rule_set.rules.map((rule, rindex) => (
                                <Grid container spacing={2} key={rindex} alignItems="center" sx={{ mb: 2 }}>
                                    <Grid size={1.2}>
                                        <TextField
                                            label='等级'
                                            placeholder='all'
                                            value={rule.level === null ? '' : rule.level}
                                            type='number'
                                            size='small'
                                            fullWidth
                                            onChange={(e) => {
                                                update_rule(index, rindex, {
                                                    level: e.target.value === '' ? null : parseInt(e.target.value),
                                                    style: rule.style
                                                });
                                            }}
                                        />
                                    </Grid>
                                    <Grid size={2}>
                                        <TextField
                                            size='small'
                                            label='显示文本'
                                            value={rule.style.text || ''}
                                            fullWidth
                                            onChange={(e) => {
                                                update_rule(index, rindex, {
                                                    level: rule.level,
                                                    style: {
                                                        color: rule.style.color,
                                                        style: rule.style.style,
                                                        text: e.target.value
                                                    }
                                                })
                                            }}
                                        />
                                    </Grid>
                                    <Grid size={1.5}>
                                        <ToggleButtonGroup
                                            size='small'
                                            exclusive
                                            value={rule.style.style}
                                            onChange={(_, v) => update_rule(index, rindex, {
                                                level: rule.level,
                                                style: {
                                                    color: rule.style.color,
                                                    style: v,
                                                    text: rule.style.text
                                                }
                                            })}
                                            aria-label="level chip style"
                                            fullWidth
                                        >
                                            <ToggleButton value='fill' aria-label='fill'>
                                                <Typography variant='caption'>填充</Typography>
                                            </ToggleButton>
                                            <ToggleButton value='outline' aria-label='outline'>
                                                <Typography variant='caption'>描边</Typography>
                                            </ToggleButton>
                                        </ToggleButtonGroup>
                                    </Grid>
                                    <Grid size={1}>
                                        <ColorEditor
                                            size='small'
                                            value={rule.style.color || '#000000'}
                                            onChange={(color) => {
                                                update_rule(index, rindex, {
                                                    level: rule.level,
                                                    style: {
                                                        color,
                                                        style: rule.style.style,
                                                        text: rule.style.text
                                                    }
                                                });
                                            }}
                                        />
                                    </Grid>
                                    <Grid size={2}>
                                        <Chip
                                            variant={rule.style.style === 'outline' ? 'outlined' : 'filled'}
                                            label={rule.style.text || ((rule.level !== null) ? rule.level.toString() : 'all')}
                                            sx={{
                                                bgcolor: rule.style.style === 'fill' ? rule.style.color : 'transparent',
                                                color: rule.style.style === 'outline' ? rule.style.color : '#fff',
                                                borderColor: rule.style.color,
                                                minWidth: 80
                                            }}
                                        />
                                    </Grid>

                                    {/* 规则操作工具栏 - 在Chip右侧 */}
                                    <Grid size={1}>
                                        <Box display="flex" gap={0.5}>
                                            <Tooltip title="上移">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => move_rule_up(index, rindex)}
                                                    disabled={rindex === 0}
                                                >
                                                    <ArrowUpwardIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="下移">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => move_rule_down(index, rindex)}
                                                    disabled={rindex === rule_set.rules.length - 1}
                                                >
                                                    <ArrowDownIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="删除">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => delete_rule(index, rindex)}
                                                    color="error"
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="在此之后插入">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => insert_rule_after(index, rindex)}
                                                >
                                                    <AddIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </Grid>
                                </Grid>
                            ))}

                            {rule_set.rules.length === 0 && (
                                <Box sx={{ textAlign: 'center', py: 3 }}>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                        暂无规则，点击添加第一条规则
                                    </Typography>
                                    <Button
                                        onClick={() => append_rule(index)}
                                        variant="contained"
                                        startIcon={<AddIcon />}
                                    >
                                        添加规则
                                    </Button>
                                </Box>
                            )}
                        </AccordionDetails>
                    </Accordion>
                </Box>
            ))}

            {/* 在列表底部添加新规则集的按钮 */}
            <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Button
                    onClick={append_rule_set}
                    variant="outlined"
                    startIcon={<AddIcon />}
                    size="large"
                >
                    添加新规则集
                </Button>
            </Box>
        </Box>
    )
}

export default LevelPanel;