import { Message } from './client';

export type RuleAction = 'equal' | 'notEqual' | 'contains' | 'notContains' | 'regex';
export type RuleTarget = 'role' | 'label' | 'level';
export type LevelChipStyleStyle = 'outline' | 'fill';
export interface LevelChipStyle {
    color: string;
    style: LevelChipStyleStyle;
    text: string | null;
}
export interface LevelRule {
    level: number | null;
    style: LevelChipStyle;
}
export interface LevelRuleSet {
    name: string;
    rules: LevelRule[];
    disabled: boolean;
}

export class FormateMessage {
    readonly msg: Message;
    constructor(msg: Message) {
        this.msg = msg;
    }
    get time(): string {
        return new Date(this.msg.time / 1000).toLocaleString();
    }
    levelStyle(rules: LevelRuleSet[]) {
        const rule = rules.find(rule => !rule.disabled)?.rules;
        if (!rule) {
            return { color: 'gray', style: 'outline', text: null };
        }
        const levelRule = rule.find(rule => rule.level === this.msg.level);
        if (levelRule) {
            return levelRule.style;
        }
        const defaultRule = rule.find(rule => rule.level === null);
        if (defaultRule) {
            return defaultRule.style;
        }
        return { color: 'gray', style: 'outline', text: null };
    }
}
