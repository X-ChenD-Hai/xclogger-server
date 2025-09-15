import { Box, Switch } from "@mui/material";
import { Rule, RuleSet } from "../../api/rules"
import Panel from "./Panel";
import React from "react";
import TextEidtDelay from "../public/TextEidtDelay";
type state<T> = [T, (newState: T) => void]
export interface RulePanelProps<T extends Rule> {
    rule_sets: state<RuleSet<T>[]>;
    default_rule: T;
    exclusive?: boolean;
    default_rule_set: RuleSet<T>;
    ruleItemElement: React.FC<{ rule: T, index: number, set_index: number, onRuleChange: (set_index: number, index: number, rule: T) => void }>;
}

const RuleSetPanel = <T extends Rule,>(props: RulePanelProps<T>) => {
    return <Panel
        sets={props.rule_sets[0]}
        getItems={set => set.rules}
        onInsertSet={index => {
            const new_rule_sets = [...props.rule_sets[0]];
            new_rule_sets.splice(index + 1, 0, props.default_rule_set);
            props.rule_sets[1](new_rule_sets);
        }}
        onDeleteSet={position => {
            const new_rule_sets = [...props.rule_sets[0]];
            new_rule_sets.splice(position, 1);
            props.rule_sets[1](new_rule_sets);
        }}
        onMoveSet={(from, to) => {
            const new_rule_sets = [...props.rule_sets[0]];
            [new_rule_sets[from], new_rule_sets[to]] = [new_rule_sets[to], new_rule_sets[from]];
            props.rule_sets[1](new_rule_sets);
        }}
        setHeader={({ set, index }) => (<>
            <Box display={'flex'} alignItems={'center'}>
                <Switch
                    checked={!set.disabled}
                    onChange={(_, v) => {
                        if (v) {
                            const new_rule_sets = [...props.rule_sets[0]];
                            if (props.exclusive) {
                                new_rule_sets.forEach(s => s.disabled = true);
                            }
                            new_rule_sets[index].disabled = false;
                            props.rule_sets[1](new_rule_sets);
                        } else {
                            const new_rule_sets = [...props.rule_sets[0]]
                            new_rule_sets[index].disabled = true;
                            props.rule_sets[1](new_rule_sets);
                        }
                    }}
                    onClick={(e) => e.stopPropagation()}
                />
                <TextEidtDelay
                    value={set.name}
                    onChange={(name) => {
                        const new_rule_sets = props.rule_sets[0].map(
                            r => { r.disabled = true; return r; })
                        new_rule_sets[index].name = name;
                        props.rule_sets[1](new_rule_sets);
                    }}
                />
            </Box>
        </>)}
        onInsertItem={(setIndex, index) => {
            const new_rule_sets = [...props.rule_sets[0]];
            new_rule_sets[setIndex].rules.splice(index + 1, 0, props.default_rule);
            props.rule_sets[1](new_rule_sets);
        }}
        onMoveItem={(setIndex, from, to) => {
            const new_rule_sets = [...props.rule_sets[0]];
            [new_rule_sets[setIndex].rules[from], new_rule_sets[setIndex].rules[to]] = [new_rule_sets[setIndex].rules[to], new_rule_sets[setIndex].rules[from]];
            props.rule_sets[1](new_rule_sets);
        }}
        onDeleteItem={(setIndex, index) => {
            const new_rule_sets = [...props.rule_sets[0]];
            new_rule_sets[setIndex].rules.splice(index, 1);
            props.rule_sets[1](new_rule_sets);
        }}
        itemElement={({ item: rule, index, set_index }) => (
            <props.ruleItemElement rule={rule} index={index} set_index={set_index} onRuleChange={(set_index, index, rule) => {
                const new_rule_sets = [...props.rule_sets[0]];
                new_rule_sets[set_index].rules[index] = rule;
                props.rule_sets[1](new_rule_sets);
            }} />
        )}
    />
}

export default RuleSetPanel;