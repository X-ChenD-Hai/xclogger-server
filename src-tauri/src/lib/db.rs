use msg_server::MessageData;
use rusqlite::{params, Connection};
use std::{
    path::PathBuf,
    sync::{Arc, Mutex},
};

pub trait DB {
    fn connect(&self, path: &PathBuf) -> Result<(), String>;
    fn is_connected(&self) -> bool;
    fn insert_message(&self, message: &MessageData) -> Result<usize, String>;
    fn get_messages(&self, limit: i32, offset: i32) -> Result<String, String>;
    fn get_message_count(&self) -> Result<i32, String>;

    fn get_config(&self, key: &str) -> Result<Option<String>, String>;
    fn set_config(&self, key: &str, value: &str) -> Result<(), String>;
    fn get_all_configs(&self) -> Result<Vec<(String, String)>, String>;
}

impl DB for Arc<Mutex<Option<Connection>>> {
    fn connect(&self, path: &PathBuf) -> Result<(), String> {
        let mut conn = self.lock().unwrap();
        if conn.is_none() {
            std::fs::create_dir_all(&path.parent().unwrap()).map_err(|e| e.to_string())?;
            let new_conn = Connection::open(&path).unwrap();
            new_conn
                .execute(
                    "
    CREATE TABLE IF NOT EXISTS
    log_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT, -- 自增主键，唯一标识每条日志
        role TEXT NOT NULL, -- 角色信息，对应Message.role
        label TEXT, -- 标签，对应Message.label
        file TEXT DEFAULT NULL, -- 文件名，对应Message.file
        function TEXT DEFAULT NULL, -- 函数名，对应Message.function
        time INTEGER NOT NULL, -- 时间戳，对应Message.time
        process_id INTEGER NOT NULL, -- 进程ID，对应Message.process_id
        thread_id INTEGER NOT NULL, -- 线程ID，对应Message.thread_id
        line INTEGER DEFAULT NULL, -- 行号，对应Message.line
        level INTEGER NOT NULL, -- 日志级别，对应Message.level
        messages TEXT NOT NULL, -- 合并后的消息内容
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP -- 记录插入时间，便于查询[8](@ref)
    );",
                    [],
                )
                .map_err(|e| format!("创建表失败: {}", e))?;
            // 创建配置表
            new_conn
                .execute(
                    "
    CREATE TABLE IF NOT EXISTS
    app_config (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT NOT NULL UNIQUE,
        value TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );",
                    [],
                )
                .map_err(|e| format!("创建配置表失败: {}", e))?;

            // 插入默认配置
            new_conn
                .execute(
                    "INSERT OR IGNORE INTO app_config (key, value) VALUES ('version', '1.0.0')",
                    [],
                )
                .map_err(|e| format!("插入默认配置失败: {}", e))?;

            *conn = Some(new_conn);
        }
        Ok(())
    }

    fn is_connected(&self) -> bool {
        self.lock().unwrap().is_some()
    }

    fn insert_message(&self, message: &MessageData) -> Result<usize, String> {
        let conn_guard = self.lock().map_err(|e| e.to_string())?;
        let conn = conn_guard.as_ref().ok_or("数据库未连接".to_string())?;

        // 将 messages 向量合并为一个字符串（使用换行符分隔）
        let messages_text = serde_json::to_string(&message.messages)
            .map_err(|e| format!("序列化消息列表失败: {}", e))?;

        conn.execute(
            "INSERT INTO log_messages 
            (role, label, file, function, time, process_id, thread_id, line, level, messages) 
            VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
            params![
                message.role,
                message.label,
                message.file,
                message.function,
                message.time as i64, // usize 转 i64
                message.process_id as i64,
                message.thread_id as i64,
                message.line,
                message.level,
                messages_text
            ],
        )
        .map_err(|e| format!("插入消息失败: {}", e))
    }

    fn get_messages(&self, limit: i32, offset: i32) -> Result<String, String> {
        let conn_guard = self.lock().map_err(|e| e.to_string())?;
        let conn = conn_guard.as_ref().ok_or("数据库未连接".to_string())?;
        println!("select with: lim:{}, off:{}", limit, offset);
        let mut stmt = conn
            .prepare(
                "SELECT role, label, file, function, time, process_id, thread_id, line, level, messages 
                 FROM log_messages 
                 ORDER BY id DESC 
                 LIMIT ?1 OFFSET ?2",
            )
            .map_err(|e| e.to_string())?;

        let messages_iter = stmt
            .query_map(params![limit, offset], |row| {
                Ok(MessageData {
                    role: row.get(0)?,
                    label: row.get(1)?,
                    file: row.get(2)?,
                    function: row.get(3)?,
                    time: row.get::<_, i64>(4)? as usize, // i64 转 usize
                    process_id: row.get::<_, i64>(5)? as usize,
                    thread_id: row.get::<_, i64>(6)? as usize,
                    line: row.get(7)?,
                    level: row.get(8)?,
                    messages: serde_json::from_str(row.get::<_, String>(9)?.as_str()).unwrap(),
                })
            })
            .map_err(|e| e.to_string())?;

        // 收集结果并处理错误
        let messages: Result<Vec<_>, _> = messages_iter.collect();
        let messages = messages.map_err(|e| e.to_string())?;
        println!("success to get message {:?}", messages);
        // 序列化为 JSON 返回给前端
        serde_json::to_string(&messages).map_err(|e| e.to_string())
    }

    fn get_message_count(&self) -> Result<i32, String> {
        let conn_guard = self.lock().map_err(|e| e.to_string())?;
        let conn = conn_guard.as_ref().ok_or("数据库未连接".to_string())?;

        let mut stmt = conn
            .prepare("SELECT COUNT(*) FROM log_messages")
            .map_err(|e| e.to_string())?;

        let count = stmt
            .query_row([], |row| row.get(0))
            .map_err(|e| e.to_string())?;

        Ok(count)
    }

    fn get_config(&self, key: &str) -> Result<Option<String>, String> {
        let conn_guard = self.lock().map_err(|e| e.to_string())?;
        let conn = conn_guard.as_ref().ok_or("数据库未连接".to_string())?;

        let mut stmt = conn
            .prepare("SELECT value FROM app_config WHERE key = ?1")
            .map_err(|e| format!("准备查询语句失败: {}", e))?;

        let result: Result<String, _> = stmt.query_row(params![key], |row| row.get(0));

        match result {
            Ok(value) => Ok(Some(value)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(format!("查询配置失败: {}", e)),
        }
    }

    fn set_config(&self, key: &str, value: &str) -> Result<(), String> {
        let conn_guard = self.lock().map_err(|e| e.to_string())?;
        let conn = conn_guard.as_ref().ok_or("数据库未连接".to_string())?;

        conn.execute(
            "INSERT OR REPLACE INTO app_config (key, value) VALUES (?1, ?2)",
            params![key, value],
        )
        .map_err(|e| format!("设置配置失败: {}", e))?;

        Ok(())
    }

    fn get_all_configs(&self) -> Result<Vec<(String, String)>, String> {
        let conn_guard = self.lock().map_err(|e| e.to_string())?;
        let conn = conn_guard.as_ref().ok_or("数据库未连接".to_string())?;

        let mut stmt = conn
            .prepare("SELECT key, value FROM app_config ORDER BY key")
            .map_err(|e| format!("准备查询语句失败: {}", e))?;

        let config_iter = stmt
            .query_map([], |row| {
                Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
            })
            .map_err(|e| format!("查询配置失败: {}", e))?;

        let configs: Result<Vec<_>, _> = config_iter.collect();
        configs.map_err(|e| format!("收集配置结果失败: {}", e))
    }
}
