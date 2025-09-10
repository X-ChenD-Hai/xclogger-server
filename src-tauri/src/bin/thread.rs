use tauri::{AppHandle, State};
use xclogger_server_lib::db::*;
use xclogger_server_lib::loghandler::*;

#[tauri::command]
async fn stop_server(handler: State<'_, LogHandler>) -> Result<String, String> {
    handler.stop_server().map_err(|e| e.to_string())
}

#[tauri::command]
async fn start_server(app: AppHandle, handler: State<'_, LogHandler>) -> Result<String, String> {
    handler.start_server(&app).map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_messages(
    app_handle: AppHandle,
    handler: State<'_, LogHandler>,
    limit: i32,
    offset: i32,
) -> Result<String, String> {
    if !handler.db.is_connected() {
        handler.connect_db(&app_handle)?;
    }
    handler.db.get_messages(limit, offset)
}

#[tauri::command]
async fn get_message_count(app: AppHandle, handler: State<'_, LogHandler>) -> Result<i32, String> {
    if !handler.db.is_connected() {
        handler.connect_db(&app)?;
    }
    handler.db.get_message_count()
}

fn main() {
    // 初始化数据库连接

    tauri::Builder::default()
        .manage(LogHandler::new())
        .invoke_handler(tauri::generate_handler![
            start_server,
            stop_server,
            get_messages,
            get_message_count
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
