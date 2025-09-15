export interface Message {
    id: number; // 自增主键，Rust端返回时可能包含
    role: string; // 角色信息
    label: string; // 标签，可选
    file?: string | null; // 文件名，可选
    function?: string | null; // 函数名，可选
    time: number; // 时间戳 (Unix 时间戳或类似)
    process_id: number; // 进程ID
    thread_id: number; // 线程ID
    line?: number | null; // 行号，可选
    level: number; // 日志级别
    messages: Array<Array<string>>; // 合并后的消息内容
    created_at?: string; // 记录插入时间 (ISO 字符串格式，如 "2024-01-01T12:00:00Z")
}
export enum MessageField {
    Id = 'Id',
    Role = 'Role',
    Label = 'Label',
    file = 'File',
    function = 'Function',
    time = 'Time',
    process_id = 'ProcessId',
    thread_id = 'ThreadId',
    line = 'Line',
    level = 'Level',
}
export enum PatternMode {
    Equal = "Equal",
    Contain = "Contain",
    Start = "Start",
    End = "End",
}

export interface StringPattern {
    mode: PatternMode;
    value: string;
}
export interface NumberRange {
    min: number;
    max: number;
}
export interface FilterConfig {
    label?: StringPattern;
    role?: StringPattern;
    file?: StringPattern;
    function?: StringPattern;
    level?: NumberRange;
    time?: NumberRange;
    process_id?: NumberRange;
    thread_id?: NumberRange;
    line?: NumberRange;
    messages?: StringPattern;
}

export interface IClient {
    set(key: string, value: string): void;
    get(key: string): Promise<string | null>;
    get_messages(limit: number, offset: number): Promise<Array<Message>>;
    get_messages_count(): Promise<number>;
    onRecviveMesage(callback: (msg: Message) => void): void;
    start_server(addr: string): void;
    stop_server(): void;
    filter_messages(config: FilterConfig, oeder: MessageField, limit: number, offset: number): Promise<Array<Message>>;
    filter_messages_count(config: FilterConfig): Promise<number>;
    get_distinct(field: MessageField): Promise<Array<string>>;
}