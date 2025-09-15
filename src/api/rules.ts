/// rules.ts
import { Message } from './client';

export type RuleAction = 'equal' | 'notEqual' | 'contains' | 'notContains' | 'regex' | 'startsWith' | 'endsWith';
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
export class RoleRule implements Rule {
    pattern: string;
    mode: RuleAction = 'equal';
    style: ChipStyle;
    constructor(role: string, mode: RuleAction, style: ChipStyle) {
        this.pattern = role;
        this.style = style;
        this.mode = mode;
    }
    is_patterned(dst: string): boolean {
        switch (this.mode) {
            case 'equal':
                return this.pattern === dst;
            case 'notEqual':
                return this.pattern !== dst;
            case 'contains':
                return dst.includes(this.pattern);
            case 'notContains':
                return !dst.includes(this.pattern);
            case 'regex':
                return new RegExp(this.pattern).test(dst);
            case 'startsWith':
                return dst.startsWith(this.pattern);
            case 'endsWith':
                return dst.endsWith(this.pattern);
            default:
                return false;
        }
    }
}
export type LabelRule = RoleRule;

export interface RuleSet<T extends Rule> {
    name: string;
    rules: T[];
    disabled: boolean;
}
export type LevelRuleSet = RuleSet<LevelRule>;
export type RoleRuleSet = RuleSet<RoleRule>;
export type LabelRuleSet = RuleSet<LabelRule>;

export function dumpLevelRuleSetList(ruleSetList: LevelRuleSet[]): string {
    const result: any[] = [];
    ruleSetList.forEach(ruleSet => {
        const rules: any[] = [];
        ruleSet.rules.forEach(rule => {
            rules.push({
                level: rule.level,
                color: rule.style.color,
                style: rule.style.style,
                text: rule.style.text
            });
        });
        result.push({
            name: ruleSet.name,
            rules: rules,
            disabled: ruleSet.disabled
        });
    });
    return JSON.stringify(result);
}
export function dumpRoleLabelRuleSetList(ruleSetList: RoleRuleSet[]): string {
    const result: any[] = [];
    ruleSetList.forEach(ruleSet => {
        const rules: any[] = [];
        ruleSet.rules.forEach(rule => {
            rules.push({
                pattern: rule.pattern,
                mode: rule.mode,
                color: rule.style.color,
                style: rule.style.style,
                text: rule.style.text
            });
        });
        result.push({
            name: ruleSet.name,
            rules: rules,
            disabled: ruleSet.disabled
        });
    });
    return JSON.stringify(result);
}

export function parserLevelRoleSetList(data: string): LevelRuleSet[] {
    const result: LevelRuleSet[] = [];
    const obj = JSON.parse(data);
    obj.forEach((item: any) => {
        const rules: LevelRule[] = [];
        item.rules.forEach((rule: any) => {
            const style: ChipStyle = {
                color: rule.color,
                style: rule.style,
                text: rule.text
            };
            rules.push(new LevelRule(rule.level, style));
        });
        result.push({
            name: item.name,
            rules: rules,
            disabled: item.disabled
        });
    });
    return result;
}
export function parserRoleLabelSetList(data: string): RoleRuleSet[] {
    const result: RoleRuleSet[] = [];
    const obj = JSON.parse(data);
    obj.forEach((item: any) => {
        const rules: RoleRule[] = [];
        item.rules.forEach((rule: any) => {
            const style: ChipStyle = {
                color: rule.color,
                style: rule.style,
                text: rule.text
            };
            rules.push(new RoleRule(rule.pattern, rule.mode, style));
        });
        result.push({
            name: item.name,
            rules: rules,
            disabled: item.disabled
        });
    });
    return result;
}
export function parserLabelRoleSetList(data: string): LabelRuleSet[] {
    return parserRoleLabelSetList(data);
}

export class FormateMessage {
    readonly msg: Message;
    constructor(msg: Message) {
        this.msg = msg;
    }
    get time(): string {
        return new Date(this.msg.time / 1000).toLocaleString();
    }
    levelStyle(rules: LevelRuleSet[]): ChipStyle {
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
    roleStyle(rules: RoleRuleSet[]): ChipStyle {
        const rule = rules.find(rule => !rule.disabled)?.rules;
        if (!rule) {
            return { color: 'gray', style: 'outline', text: null };
        }
        const roleRule = rule.find(rule => rule.is_patterned(this.msg.role));
        if (roleRule) {
            return roleRule.style;
        }
        const defaultRule = rule.find(rule => rule.pattern === '');
        if (defaultRule) {
            return defaultRule.style;
        }
        return { color: 'gray', style: 'outline', text: null };
    }
    labelStyle(rules: LabelRuleSet[]): ChipStyle {
        const rule = rules.find(rule => !rule.disabled)?.rules;
        if (!rule) {
            return { color: 'gray', style: 'outline', text: null };
        }
        const labelRule = rule.find(rule => rule.is_patterned(this.msg.label));
        if (labelRule) {
            return labelRule.style;
        }
        const defaultRule = rule.find(rule => rule.pattern === '');
        if (defaultRule) {
            return defaultRule.style;
        }
        return { color: 'gray', style: 'outline', text: null };
    }
}
