mod config;
mod messagedb;
pub use config::*;
pub use messagedb::*;
use rusqlite::Connection;
use std::{
    path::PathBuf,
    sync::{Arc, Mutex},
};

pub trait DB {
    fn connect(&self, path: &PathBuf) -> Result<(), String>;
    fn is_connected(&self) -> bool;
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
}

#[cfg(test)]
mod test {
    use super::*;

    #[test]
    fn test() {
        let db = Arc::new(Mutex::new(Option::<Connection>::None));
        db.connect(&PathBuf::from("xclogger.db")).unwrap();
        // println!("{:?}", db.get_messages(100, 0));
        let config = FilterConfig {
            label: Some(StringPattern {
                mode: PatternMode::Start,
                value: "data1".to_string(),
            }),
            role: None,
            file: None,
            function: None,
            level: None,
            time: None,
            process_id: None,
            thread_id: None,
            line: None,
            messages: None,
        };
        let order_by = MessageField::Id;
        let limit = 100;
        let offset = 0;
        println!("{:?}", db.filter_messages_count(&config));
        println!(
            "{:?}",
            db.filter_messages(&config, &order_by, &limit, &offset, false)
        );
    }
    #[test]
    fn get_distinct() {
        let db = Arc::new(Mutex::new(Option::<Connection>::None));
        db.connect(&PathBuf::from("xclogger.db")).unwrap();
        let labels = db.get_distinct(&MessageField::Label).unwrap();
        println!("{:?}", labels);
        let files = db.get_distinct(&MessageField::File).unwrap();
        println!("{:?}", files);
        let roles = db.get_distinct(&MessageField::Role).unwrap();
        println!("{:?}", roles);
        let process_ids = db.get_distinct(&MessageField::ProcessId).unwrap();
        println!("{:?}", process_ids);
        let thread_ids = db.get_distinct(&MessageField::ThreadId).unwrap();
        println!("{:?}", thread_ids);
    }
}
