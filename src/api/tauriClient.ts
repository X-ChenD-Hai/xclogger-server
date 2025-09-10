import { invoke } from "@tauri-apps/api/core";
export class TauriClient {
    constructor() {
        console.log("TauriClient constructor called");
    }
    async get_messages(limit: number, offset: number) {
        const res = await invoke("get_messages", { limit, offset });
        console.log("get_messages called");
        console.log(res);


        return res as string;
    }
}