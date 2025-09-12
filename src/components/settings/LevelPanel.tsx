import { Box, Chip, Grid, InputAdornment, Switch, TextField, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import { LevelRule, LevelRuleSet } from "../../api/rules"
import Panel from "./Panel";
import ColorEditor from "../ColorEditor";
type state<T> = [T, (newState: T) => void]
export interface LevelPanelProps {
    level_rule_sets: state<LevelRuleSet[]>;
}
const LevelPanel = (props: LevelPanelProps) => {

    const update_rule = (index: number, rule_index: number, rule: LevelRule) => {
        const new_rule_sets = [...props.level_rule_sets[0]];
        new_rule_sets[index].rules[rule_index] = rule;
        props.level_rule_sets[1](new_rule_sets);
    }
    return <Panel
        getItems={set => set.rules}
        onInsertSet={position => {
            const new_rule_sets = [...props.level_rule_sets[0]];
            const newRuleSet: LevelRuleSet = {
                name: '新建规则集',
                rules: [],
                disabled: false
            };
            new_rule_sets.splice(position, 0, newRuleSet);
            props.level_rule_sets[1](new_rule_sets);
        }}
        onDeleteSet={position => {
            const new_rule_sets = [...props.level_rule_sets[0]];
            new_rule_sets.splice(position, 1);
            props.level_rule_sets[1](new_rule_sets);
        }}
        onMoveSet={(from, to) => {
            const new_rule_sets = [...props.level_rule_sets[0]];
            [new_rule_sets[from], new_rule_sets[to]] = [new_rule_sets[to], new_rule_sets[from]];
            props.level_rule_sets[1](new_rule_sets);
        }}
        onInsertItem={(setIndex, index) => {
            const new_rule_sets = [...props.level_rule_sets[0]];
            const newRule: LevelRule = {
                level: null,
                style: {
                    color: '#000000',
                    style: 'fill',
                    text: null
                }
            };
            new_rule_sets[setIndex].rules.splice(index + 1, 0, newRule);
            props.level_rule_sets[1](new_rule_sets);
        }}
        onMoveItem={(setIndex, from, to) => {
            const new_rule_sets = [...props.level_rule_sets[0]];
            [new_rule_sets[setIndex].rules[from], new_rule_sets[setIndex].rules[to]] = [new_rule_sets[setIndex].rules[to], new_rule_sets[setIndex].rules[from]];
            props.level_rule_sets[1](new_rule_sets);
        }
        }
        onDeleteItem={(setIndex, index) => {
            const new_rule_sets = [...props.level_rule_sets[0]];
            new_rule_sets[setIndex].rules.splice(index, 1);
            props.level_rule_sets[1](new_rule_sets);
        }}
        setHeader={({ set, index }) => (<>
            <Box display={'flex'} alignItems={'center'}>
                <Switch
                    checked={!set.disabled}
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
                <Typography>{set.name}</Typography>

            </Box>
        </>)}
        itemElement={({ item: rule, index, set_index }) => (
            <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
                <Grid size={2}>
                    <TextField
                        label='等级'
                        value={rule.level === null ? '' : rule.level}
                        type='number'
                        size='small'
                        fullWidth
                        slotProps={rule.level === null ? {
                            input: {
                                startAdornment: <InputAdornment position="start">  all</InputAdornment>,
                            },
                        } : {}}
                        onChange={(e) => {
                            update_rule(set_index, index, {
                                level: e.target.value === '' ? null : parseInt(e.target.value),
                                style: rule.style
                            });
                        }}
                    />
                </Grid>
                <Grid size={3}>
                    <TextField
                        size='small'
                        label='显示文本'
                        value={rule.style.text || ''}
                        fullWidth
                        onChange={(e) => {
                            update_rule(set_index, index, {
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
                <Grid size={2} display={'flex'} justifyContent={'center'}>
                    <ToggleButtonGroup
                        size='small'
                        exclusive
                        value={rule.style.style}
                        onChange={(_, v) => update_rule(set_index, index, {
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
                <Grid size={1} display={'flex'} justifyContent={'center'}>
                    <ColorEditor
                        size='small'
                        value={rule.style.color || '#000000'}
                        onChange={(color) => {
                            update_rule(set_index, index, {
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
                <Grid size={4} display='flex' justifyContent={'center'}>
                    <Chip
                        variant={rule.style.style === 'outline' ? 'outlined' : 'filled'}
                        label={rule.style.text || ((rule.level !== null) ? rule.level.toString() : 'all')}
                        sx={{
                            bgcolor: rule.style.style === 'fill' ? rule.style.color : 'transparent',
                            color: rule.style.style === 'outline' ? rule.style.color : '#fff',
                            borderColor: rule.style.color,
                        }}
                    />
                </Grid>
            </Grid>

        )}
        sets={props.level_rule_sets[0]}
    />
}

export default LevelPanel