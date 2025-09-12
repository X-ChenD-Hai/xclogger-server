#[derive(Debug)]
pub enum ServerError {
    Rusqlite(rusqlite::Error),
    SerdeJson(serde_json::Error),
}

// 为方便起见，为你的错误类型实现 From trait，实现自动转换
impl From<rusqlite::Error> for ServerError {
    fn from(err: rusqlite::Error) -> Self {
        ServerError::Rusqlite(err)
    }
}

impl From<serde_json::Error> for ServerError {
    fn from(err: serde_json::Error) -> Self {
        ServerError::SerdeJson(err)
    }
}

// 可以选择实现 Display 和 std::error::Error，以便更好地集成
impl std::fmt::Display for ServerError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ServerError::Rusqlite(e) => write!(f, "Database error: {}", e),
            ServerError::SerdeJson(e) => write!(f, "JSON parsing error: {}", e),
            // ... 处理其他变体
        }
    }
}

impl std::error::Error for ServerError {}
