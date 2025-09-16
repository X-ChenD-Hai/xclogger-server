use msg_server::MessageData;
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};
#[derive(Serialize, Debug)]
struct DBMessage {
    pub id: u64,
    pub role: String,
    pub label: String,
    pub file: String,
    pub function: String,
    pub time: usize,
    pub process_id: usize,
    pub thread_id: usize,
    pub line: i32,
    pub level: i32,
    pub messages: Vec<String>,
}
#[derive(Deserialize, Debug)]
pub enum PatternMode {
    Equal,
    Contain,
    Start,
    End,
}

#[derive(Deserialize, Debug)]
pub struct StringPattern {
    pub mode: PatternMode,
    pub value: String,
}

#[derive(Deserialize, Debug)]
pub struct NumberRange {
    pub min: Option<i64>,
    pub max: Option<i64>,
}

#[derive(Deserialize, Debug)]
pub struct FilterConfig {
    pub label: Option<StringPattern>,
    pub role: Option<StringPattern>,
    pub file: Option<StringPattern>,
    pub function: Option<StringPattern>,
    pub level: Option<NumberRange>,
    pub time: Option<NumberRange>,
    pub process_id: Option<NumberRange>,
    pub thread_id: Option<NumberRange>,
    pub line: Option<NumberRange>,
    pub messages: Option<StringPattern>,
}
#[derive(Deserialize, Debug)]
pub enum MessageField {
    Id,
    Role,
    Label,
    File,
    Function,
    Time,
    ProcessId,
    ThreadId,
    Line,
    Level,
}

pub trait MessageDB {
    fn insert_message(&self, message: &MessageData) -> Result<usize, String>;
    fn get_messages(&self, limit: i32, offset: i32, desc: bool) -> Result<String, String>;
    fn get_message_count(&self) -> Result<i32, String>;
    fn filter_messages(
        &self,
        config: &FilterConfig,
        order_by: &MessageField,
        limit: &i32,
        offset: &i32,
        desc: bool,
    ) -> Result<String, String>;
    fn filter_messages_count(&self, config: &FilterConfig) -> Result<i32, String>;
    fn get_distinct(&self, field: &MessageField) -> Result<String, String>;
    fn delete_messages(&self, config: &FilterConfig) -> Result<usize, String>;
}
// 辅助函数：构建字符串条件
fn build_string_condition(
    column: &str,
    pattern: &StringPattern,
) -> (String, Box<dyn rusqlite::ToSql>) {
    match pattern.mode {
        PatternMode::Equal => (format!("{} = ?", column), Box::new(pattern.value.clone())),
        PatternMode::Contain => (
            format!("{} LIKE ?", column),
            Box::new(format!("%{}%", pattern.value)),
        ),
        PatternMode::Start => (
            format!("{} LIKE ?", column),
            Box::new(format!("{}%", pattern.value)),
        ),
        PatternMode::End => (
            format!("{} LIKE ?", column),
            Box::new(format!("%{}", pattern.value)),
        ),
    }
}

// 辅助函数：构建数字范围条件
fn build_number_range_condition(
    column: &str,
    range: &NumberRange,
) -> (String, Option<i64>, Option<i64>) {
    let mut conditions = Vec::new();
    let mut min_param = None;
    let mut max_param = None;

    if let Some(min) = range.min {
        conditions.push(format!("{} >= ?", column));
        min_param = Some(min);
    }

    if let Some(max) = range.max {
        conditions.push(format!("{} <= ?", column));
        max_param = Some(max);
    }

    if conditions.is_empty() {
        ("1=1".to_string(), None, None)
    } else {
        (conditions.join(" AND "), min_param, max_param)
    }
}

fn get_params(config: &FilterConfig) -> (String, Vec<Box<dyn rusqlite::ToSql>>) {
    let mut params: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();
    let mut conditions = Vec::new();

    // 构建过滤条件
    if let Some(label_pattern) = config.label.as_ref() {
        let (condition, param) = build_string_condition("label", label_pattern);
        conditions.push(condition);
        params.push(param);
    }

    if let Some(role_pattern) = config.role.as_ref() {
        let (condition, param) = build_string_condition("role", role_pattern);
        conditions.push(condition);
        params.push(param);
    }

    if let Some(file_pattern) = config.file.as_ref() {
        let (condition, param) = build_string_condition("file", file_pattern);
        conditions.push(condition);
        params.push(param);
    }

    if let Some(function_pattern) = config.function.as_ref() {
        let (condition, param) = build_string_condition("function", function_pattern);
        conditions.push(condition);
        params.push(param);
    }

    if let Some(level_range) = config.level.as_ref() {
        let (condition, min_param, max_param) = build_number_range_condition("level", level_range);
        conditions.push(condition);
        if let Some(min) = min_param {
            params.push(Box::new(min));
        }
        if let Some(max) = max_param {
            params.push(Box::new(max));
        }
    }

    if let Some(time_range) = config.time.as_ref() {
        let (condition, min_param, max_param) = build_number_range_condition("time", time_range);
        conditions.push(condition);
        if let Some(min) = min_param {
            params.push(Box::new(min));
        }
        if let Some(max) = max_param {
            params.push(Box::new(max));
        }
    }

    if let Some(process_id_range) = config.process_id.as_ref() {
        let (condition, min_param, max_param) =
            build_number_range_condition("process_id", process_id_range);
        conditions.push(condition);
        if let Some(min) = min_param {
            params.push(Box::new(min));
        }
        if let Some(max) = max_param {
            params.push(Box::new(max));
        }
    }

    if let Some(thread_id_range) = config.thread_id.as_ref() {
        let (condition, min_param, max_param) =
            build_number_range_condition("thread_id", thread_id_range);
        conditions.push(condition);
        if let Some(min) = min_param {
            params.push(Box::new(min));
        }
        if let Some(max) = max_param {
            params.push(Box::new(max));
        }
    }

    if let Some(line_range) = config.line.as_ref() {
        let (condition, min_param, max_param) = build_number_range_condition("line", line_range);
        conditions.push(condition);
        if let Some(min) = min_param {
            params.push(Box::new(min));
        }
        if let Some(max) = max_param {
            params.push(Box::new(max));
        }
    }

    if let Some(messages_pattern) = config.messages.as_ref() {
        let (condition, param) = build_string_condition("messages", messages_pattern);
        conditions.push(condition);
        params.push(param);
    }

    // 组合所有条件
    let where_clause = if conditions.is_empty() {
        "".to_string()
    } else {
        format!("WHERE {}", conditions.join(" AND "))
    };

    (where_clause, params)
}

impl MessageDB for Arc<Mutex<Option<Connection>>> {
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
    fn get_messages(&self, limit: i32, offset: i32, desc: bool) -> Result<String, String> {
        let conn_guard = self.lock().map_err(|e| e.to_string())?;
        let conn = conn_guard.as_ref().ok_or("数据库未连接".to_string())?;
        println!("select with: lim:{}, off:{}, desc:{}", limit, offset, desc);

        let order_clause = if desc { "DESC" } else { "ASC" };

        let mut stmt = conn
            .prepare(&format!(
                "SELECT id, role, label, file, function, time, process_id, thread_id, line, level, messages 
                 FROM log_messages 
                 ORDER BY id {}
                 LIMIT ?1 OFFSET ?2",
                order_clause
            ))
            .map_err(|e| e.to_string())?;

        let messages_iter = stmt
            .query_map(params![limit, offset], |row| {
                Ok(DBMessage {
                    id: row.get(0)?,
                    role: row.get(1)?,
                    label: row.get(2)?,
                    file: row.get(3)?,
                    function: row.get(4)?,
                    time: row.get::<_, i64>(5)? as usize,
                    process_id: row.get::<_, i64>(6)? as usize,
                    thread_id: row.get::<_, i64>(7)? as usize,
                    line: row.get(8)?,
                    level: row.get(9)?,
                    messages: serde_json::from_str(row.get::<_, String>(10)?.as_str()).unwrap(),
                })
            })
            .map_err(|e| e.to_string())?;

        let messages: Result<Vec<_>, _> = messages_iter.collect();
        let messages = messages.map_err(|e| e.to_string())?;
        println!("success to get message {:?}", messages);
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
    fn filter_messages(
        &self,
        config: &FilterConfig,
        order_by: &MessageField,
        limit: &i32,
        offset: &i32,
        desc: bool,
    ) -> Result<String, String> {
        let conn_guard = self.lock().map_err(|e| e.to_string())?;
        let conn = conn_guard.as_ref().ok_or("数据库未连接".to_string())?;

        let (where_clause, mut params) = get_params(&config);

        let order_clause = if desc { "DESC" } else { "ASC" };

        let mut query = format!(
            "SELECT id, role, label, file, function, time, process_id, thread_id, line, level, messages 
             FROM log_messages 
             {}",
            where_clause
        );

        query.push_str(" ORDER BY ");
        match order_by {
            MessageField::Id => query.push_str("id"),
            MessageField::Role => query.push_str("role"),
            MessageField::Label => query.push_str("label"),
            MessageField::File => query.push_str("file"),
            MessageField::Function => query.push_str("function"),
            MessageField::Time => query.push_str("time"),
            MessageField::ProcessId => query.push_str("process_id"),
            MessageField::ThreadId => query.push_str("thread_id"),
            MessageField::Line => query.push_str("line"),
            MessageField::Level => query.push_str("level"),
        }
        query.push_str(" ");
        query.push_str(order_clause);

        query.push_str(" LIMIT ? OFFSET ?");
        params.push(Box::new(limit));
        params.push(Box::new(offset));

        println!("Filter query: {}", query);

        let mut stmt = conn.prepare(&query).map_err(|e| e.to_string())?;

        let messages_iter = stmt
            .query_map(
                rusqlite::params_from_iter(params.iter().map(|p| &**p)),
                |row| {
                    Ok(DBMessage {
                        id: row.get(0)?,
                        role: row.get(1)?,
                        label: row.get(2)?,
                        file: row.get(3)?,
                        function: row.get(4)?,
                        time: row.get::<_, i64>(5)? as usize,
                        process_id: row.get::<_, i64>(6)? as usize,
                        thread_id: row.get::<_, i64>(7)? as usize,
                        line: row.get(8)?,
                        level: row.get(9)?,
                        messages: serde_json::from_str(row.get::<_, String>(10)?.as_str()).unwrap(),
                    })
                },
            )
            .map_err(|e| e.to_string())?;

        let messages: Result<Vec<_>, _> = messages_iter.collect();
        let messages = messages.map_err(|e| e.to_string())?;

        serde_json::to_string(&messages).map_err(|e| e.to_string())
    }

    // 实现 filter_messages_count 函数
    fn filter_messages_count(&self, config: &FilterConfig) -> Result<i32, String> {
        let conn_guard = self.lock().map_err(|e| e.to_string())?;
        let conn = conn_guard.as_ref().ok_or("数据库未连接".to_string())?;

        // 获取条件语句和参数
        let (where_clause, params) = get_params(&config);

        let query = format!("SELECT COUNT(*) FROM log_messages {}", where_clause);

        println!("Count query: {}", query);

        let mut stmt = conn.prepare(&query).map_err(|e| e.to_string())?;

        let count = stmt
            .query_row(
                rusqlite::params_from_iter(params.iter().map(|p| &**p)),
                |row| row.get(0),
            )
            .map_err(|e| e.to_string())?;

        Ok(count)
    }

    fn get_distinct(&self, field: &MessageField) -> Result<String, String> {
        let conn_guard = self.lock().map_err(|e| e.to_string())?;
        let conn = conn_guard.as_ref().ok_or("数据库未连接".to_string())?;

        // 根据字段确定要查询的列名
        let column = match field {
            MessageField::Id => "id",
            MessageField::Role => "role",
            MessageField::Label => "label",
            MessageField::File => "file",
            MessageField::Function => "function",
            MessageField::Time => "time",
            MessageField::ProcessId => "process_id",
            MessageField::ThreadId => "thread_id",
            MessageField::Line => "line",
            MessageField::Level => "level",
        };

        let query = format!(
            "SELECT DISTINCT {} FROM log_messages ORDER BY {}",
            column, column
        );

        let mut stmt = conn.prepare(&query).map_err(|e| e.to_string())?;

        // 根据字段类型处理不同的返回值
        match field {
            MessageField::Id => {
                let ids: Result<Vec<u64>, _> = stmt
                    .query_map([], |row| row.get(0))
                    .map_err(|e| e.to_string())?
                    .collect();
                serde_json::to_string(&ids.map_err(|e| e.to_string())?).map_err(|e| e.to_string())
            }
            MessageField::Role
            | MessageField::Label
            | MessageField::File
            | MessageField::Function => {
                let strings: Result<Vec<String>, _> = stmt
                    .query_map([], |row| row.get(0))
                    .map_err(|e| e.to_string())?
                    .collect();
                serde_json::to_string(&strings.map_err(|e| e.to_string())?)
                    .map_err(|e| e.to_string())
            }
            MessageField::Time | MessageField::ProcessId | MessageField::ThreadId => {
                let numbers: Result<Vec<i64>, _> = stmt
                    .query_map([], |row| row.get(0))
                    .map_err(|e| e.to_string())?
                    .collect();
                serde_json::to_string(&numbers.map_err(|e| e.to_string())?)
                    .map_err(|e| e.to_string())
            }
            MessageField::Line | MessageField::Level => {
                let numbers: Result<Vec<i32>, _> = stmt
                    .query_map([], |row| row.get(0))
                    .map_err(|e| e.to_string())?
                    .collect();
                serde_json::to_string(&numbers.map_err(|e| e.to_string())?)
                    .map_err(|e| e.to_string())
            }
        }
    }

    fn delete_messages(&self, config: &FilterConfig) -> Result<usize, String> {
        let conn_guard = self.lock().map_err(|e| e.to_string())?;
        let conn = conn_guard.as_ref().ok_or("数据库未连接".to_string())?;

        // 获取条件语句和参数
        let (where_clause, params) = get_params(&config);

        // 构建删除语句
        let query = format!("DELETE FROM log_messages {}", where_clause);

        println!("Delete query: {}", query);

        // 执行删除操作
        let rows_deleted = conn
            .execute(
                &query,
                rusqlite::params_from_iter(params.iter().map(|p| &**p)),
            )
            .map_err(|e| format!("删除消息失败: {}", e))?;

        Ok(rows_deleted)
    }
}
