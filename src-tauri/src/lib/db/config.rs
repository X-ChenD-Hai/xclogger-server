use rusqlite::{params, Connection};
use std::sync::{Arc, Mutex};

pub trait Config {
    fn get_config(&self, key: &str) -> Result<Option<String>, String>;
    fn set_config(&self, key: &str, value: &str) -> Result<(), String>;
    fn get_all_configs(&self) -> Result<Vec<(String, String)>, String>;
}

impl Config for Arc<Mutex<Option<Connection>>> {
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
