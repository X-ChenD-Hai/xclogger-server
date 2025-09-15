// LabelPanel.tsx
import { Chip, Grid, InputAdornment, TextField, ToggleButton, ToggleButtonGroup, Typography, MenuItem, Select } from "@mui/material";
import { ChipStyle, LabelRule, LabelRuleSet, RuleAction, RoleRule } from "../../api/rules"
import ColorEditor from "../public/ColorEditor";
import React from "react";
import RuleSetPanel from "./RuleSetPanel";
type state<T> = [T, (newState: T) => void]
export interface LabelPanelProps {
    label_rule_sets: state<LabelRuleSet[]>;
}

const LabelRuleItem = React.memo((props: {
    rule: LabelRule,
    index: number,
    set_index: number,
    onRuleChange: (set_index: number, index: number, rule: LabelRule) => void
}) => {
    const [pattern, setPattern] = React.useState(props.rule.pattern)
    const [mode, setMode] = React.useState<RuleAction>(props.rule.mode)
    const [text, setText] = React.useState(props.rule.style.text)
    const update_rule = (rule: LabelRule) => {
        props.onRuleChange(props.set_index, props.index, rule)
    }
    const update_style = (style: ChipStyle) => {
        update_rule(new RoleRule(pattern, mode, style))
    }
    return <>
        <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
            <Grid size={2}>
                <Select
                    value={mode}
                    onChange={(e) => {
                        const newMode = e.target.value as RuleAction;
                        setMode(newMode);
                        update_rule(new RoleRule(pattern, newMode, { ...props.rule.style, text }));
                    }}
                    size="small"
                    fullWidth
                >
                    <MenuItem value="equal">等于</MenuItem>
                    <MenuItem value="notEqual">不等于</MenuItem>
                    <MenuItem value="contains">包含</MenuItem>
                    <MenuItem value="notContains">不包含</MenuItem>
                    <MenuItem value="regex">正则</MenuItem>
                    <MenuItem value="startsWith">开头</MenuItem>
                    <MenuItem value="endsWith">结尾</MenuItem>
                </Select>
            </Grid>
            <Grid size={2}>
                <TextField
                    label='标签模式'
                    value={pattern}
                    size='small'
                    fullWidth
                    onBlur={() => update_rule(new RoleRule(pattern, mode, { ...props.rule.style, text }))}
                    slotProps={pattern === '' ? {
                        input: {
                            startAdornment: <InputAdornment position="start">all</InputAdornment>,
                        },
                    } : {}}
                    onChange={(e) => {
                        setPattern(e.target.value)
                    }}
                />
            </Grid>
            <Grid size={3}>
                <TextField
                    size='small'
                    label='显示文本'
                    value={text || ''}
                    fullWidth
                    onChange={(e) => {
                        setText(e.target.value)
                    }}
                    onBlur={() =>
                        update_style({ ...props.rule.style, text })
                    }
                />
            </Grid>
            <Grid size={2} display={'flex'} justifyContent={'center'}>
                <ToggleButtonGroup
                    size='small'
                    exclusive
                    value={props.rule.style.style}
                    onChange={(_, v) => update_style({ ...props.rule.style, style: v })}
                    aria-label="label chip style"
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
                    value={props.rule.style.color || '#000000'}
                    onChange={(color) => update_style({ ...props.rule.style, color })}
                />
            </Grid>
            <Grid size={2} display='flex' justifyContent={'center'}>
                <Chip
                    variant={props.rule.style.style === 'outline' ? 'outlined' : 'filled'}
                    label={text || (pattern !== '' ? pattern : 'all')}
                    sx={{
                        bgcolor: props.rule.style.style === 'fill' ? props.rule.style.color : 'transparent',
                        color: props.rule.style.style === 'outline' ? props.rule.style.color : '#fff',
                        borderColor: props.rule.style.color,
                    }}
                />
            </Grid>
        </Grid>
    </>
})

const LabelPanel = (props: LabelPanelProps) => {
    return <RuleSetPanel
        default_rule={new RoleRule('', 'equal', { style: 'fill', color: '#000000', text: null })}
        default_rule_set={{ rules: [], name: '默认', disabled: true }}
        exclusive
        rule_sets={props.label_rule_sets}
        ruleItemElement={LabelRuleItem}
    />
}

export default LabelPanel
