export interface Message {
    id?: number; // 自增主键，Rust端返回时可能包含
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

export interface IClient {
    set(key: string, value: string): void;
    get(key: string): Promise<string | null>;
    get_messages(limit: number, offset: number): Promise<Array<Message>>;
    get_messages_count(): Promise<number>;
    onRecviveMesage(callback: (msg: Message) => void): void;
    start_server(addr: string): void;
    stop_server(): void;
}