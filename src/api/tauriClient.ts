import { invoke } from "@tauri-apps/api/core";
import { IClient, Message } from "./client";
import { listen } from "@tauri-apps/api/event";

export interface TauriParam {
    [key: string]: unknown
}
/**
 * 获取消息列表的请求参数
 */
export interface GetMessagesRequest extends TauriParam {
    limit: number;
    offset: number;
}

/**
 * 存储键值对的请求参数
 */
export interface SetKeyValueRequest extends TauriParam {
    key: string;
    value: string;
}

/**
 * 获取特定键值的请求参数
 */
export interface GetKeyValueRequest extends TauriParam {
    key: string;
}

/**
 * Tauri IPC 命令名枚举
 */
export enum TauriCommands {
    GetMessages = "get_messages",
    StartServer = "start_server",
    StopServer = "stop_server",
    GetServerState = "get_server_state",
    GetServerAddress = "get_server_address",
    SetServerAddress = "set_server_address",
    GetMessageCount = "get_message_count",
    ConfigSet = "config_set",
    ConfigGet = "config_get",
}
export type UnlistenFn = () => void

/**
 * 事件名枚举
 */
export enum TauriEvents {
    MessageReceived = "message-received",
}
interface ServerState {
    address: string;
    is_running: boolean;
    [key: string]: unknown;
}

export class TauriClient implements IClient {
    private static instance: TauriClient | null = null;
    private unlisten: UnlistenFn | null = null;
    private is_seting_listen: boolean = false;
    private debounceTimer: ReturnType<typeof setTimeout> | null = null;
    private constructor() {
        console.log("TauriClient initialized");
    }
    async get_messages_count(): Promise<number> {
        try {
            const res = await invoke<number>(TauriCommands.GetMessageCount);
            console.log("msg count", res);

            return res
        } catch (e) {
            console.log("Error ", e);

            throw e;
        }
    }
    async stop_server() {
        try {
            const res = await
                invoke<String>(TauriCommands.StopServer)

            console.log("res ", res);

        }
        catch (e) {
            console.log("Error: ", e);

        }

    }
    async start_server(_: string) {
        try {
            const res = await
                invoke<String>(TauriCommands.StartServer)

            console.log("res ", res);

        }
        catch (e) {
            console.log("Error: ", e);

        }
    }
    async get_server_state(): Promise<ServerState> {
        try {
            const res = await
                invoke<ServerState>(TauriCommands.GetServerState)

            console.log("res ", res);

            return res
        }
        catch (e) {
            console.log("Error: ", e);

            throw e;
        }
    }
    async get_server_address(): Promise<String> {
        try {
            const res = await
                invoke<String>(TauriCommands.GetServerAddress)

            console.log("res ", res);

            return res
        }
        catch (e) {
            console.log("Error: ", e);

            throw e;
        }
    }
    async set_server_address(address: string): Promise<void> {
        try {
            const res = await
                invoke<String>(TauriCommands.SetServerAddress, { address })

            console.log("res ", res);

        }
        catch (e) {
            console.log("Error: ", e);

            throw e;
        }
    }

    /**
     * 获取 TauriClient 单例实例
     */
    public static getInstance(): TauriClient {
        if (!TauriClient.instance) {
            TauriClient.instance = new TauriClient();
        }
        return TauriClient.instance;
    }

    /**
     * 监听接收到的消息事件
     * @param callback 收到消息时的回调函数
     */
    async onRecviveMesage(callback: (msg: Message) => void): Promise<void> {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
        this.debounceTimer = setTimeout(async () => {
            try {
                // 如果已经在设置中，则等待直到设置完成
                while (this.is_seting_listen) {
                    await new Promise(resolve => setTimeout(resolve, 10)); // 轻微延迟以避免紧密循环
                }
                this.is_seting_listen = true;

                // 移除旧的监听器（如果存在）
                if (this.unlisten) {
                    this.unlisten();
                    this.unlisten = null;
                }

                // 设置新的监听器
                const unlistenFn = await listen<Message>(TauriEvents.MessageReceived, (event) => {
                    callback(event.payload);
                });
                this.unlisten = unlistenFn;
                console.log("Event listener set successfully.");

            } catch (error) {
                console.error("Failed to listen to 'message-received' event:", error);
                // 可以选择在这里重新抛出错误，让调用者知道设置失败
                // throw error;
            } finally {
                // 无论成功与否，都释放“设置权”
                this.is_seting_listen = false;
            }
        }, 100); // 防抖延迟时间，可
    }

    /**
     * 获取日志消息列表
     * @param params 包含 limit 和 offset 的参数对象
     * @returns 返回 Message 数组的 Promise
     */
    async get_messages(limit: number, offset: number): Promise<Message[]> {
        try {
            const res = await invoke<Message[]>(TauriCommands.GetMessages, { limit, offset } as GetMessagesRequest);
            console.log("get_messages result:", res);
            return res;
        } catch (error) {
            console.error("Error invoking 'get_messages':", error);
            throw error; // 重新抛出错误以便调用者处理
        }
    }

    /**
     * 存储键值对
     * @param params 包含 key 和 value 的参数对象
     * @returns 返回操作结果的 Promise (具体类型根据Rust端返回确定，这里假设为any)
     */
    async set(key: string, value: string) {
        try {
            const res = await invoke<any>(TauriCommands.ConfigSet, { key, value });
            console.log("set result:", res);
            return res;
        } catch (error) {
            console.error("Error invoking 'set':", error);
            throw error;
        }
    }

    /**
     * 获取特定键的值
     * @param params 包含 key 的参数对象
     * @returns 返回字符串值的 Promise
     */
    async get(key: string): Promise<string | null> {
        try {
            const res = await invoke<string | null>(TauriCommands.ConfigGet, { key });
            console.log("get result:", res);
            return res;
        } catch (error) {
            console.error("Error invoking 'get':", error);
            throw error;
        }
    }

    /**
     * 解析消息字符串为 Message 对象 (静态方法)
     * @param msg JSON 字符串
     * @returns 解析后的 Message 对象
     */
    static parser_message(msg: string): Message {
        try {
            return JSON.parse(msg) as Message;
        } catch (error) {
            console.error("Failed to parse message:", error, msg);
            throw new Error("Invalid message format");
        }
    }

}
const client = TauriClient.getInstance();
export default client;