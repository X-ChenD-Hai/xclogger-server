import { Message } from './client';

export type RuleAction = 'equal' | 'notEqual' | 'contains' | 'notContains' | 'regex';
export type RuleTarget = 'role' | 'label' | 'level';
export type LevelChipStyleStyle = 'outline' | 'fill';
export interface ChipStyle {
    color: string;
    style: LevelChipStyleStyle;
    text: string | null;
}

export interface Rule {
    is_patterned: (dst: any) => boolean;
    style: ChipStyle;
}
export class LevelRule implements Rule {
    level: number | null;
    style: ChipStyle;
    constructor(level: number | null, style: ChipStyle) {
        this.level = level;
        this.style = style;
    }
    is_patterned(dst: number): boolean {
        return this.level === dst;
    }
}

export interface RuleSet<T extends Rule> {
    name: string;
    rules: T[];
    disabled: boolean;
}
export type LevelRuleSet = RuleSet<LevelRule>;
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
