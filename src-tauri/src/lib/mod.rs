pub mod db;
pub mod errors;
pub mod loghandler;
use crate::db::*;
use crate::loghandler::*;
use tauri::{AppHandle, State};
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
    handler.connect_db(&app)?;
    handler.db.get_message_count()
}
#[tauri::command]
async fn config_set(
    app: AppHandle,
    handler: State<'_, LogHandler>,
    key: String,
    value: String,
) -> Result<(), String> {
    handler.connect_db(&app)?;
    handler.db.set_config(key.as_str(), value.as_str())?;
    Ok(())
}
#[tauri::command]
async fn config_get(
    app: AppHandle,
    handler: State<'_, LogHandler>,
    key: String,
) -> Result<Option<String>, String> {
    handler.connect_db(&app)?;
    handler.db.get_config(key.as_str())
}
#[tauri::command]
async fn get_server_address(handler: State<'_, LogHandler>) -> Result<String, String> {
    handler.get_address()
}
#[tauri::command]
async fn set_server_address(
    handler: State<'_, LogHandler>,
    address: String,
) -> Result<String, String> {
    handler.set_server_address(address)
}
#[tauri::command]
async fn get_server_state(handler: State<'_, LogHandler>) -> Result<String, String> {
    serde_json::to_string(&handler.get_server_state()?).map_err(|e| e.to_string())
}

#[tauri::command]
async fn filter_messages(
    app: AppHandle,
    handler: State<'_, LogHandler>,
    config: FilterConfig,
    order_by: MessageField,
    limit: i32,
    offset: i32,
) -> Result<String, String> {
    handler.connect_db(&app)?;
    handler
        .db
        .filter_messages(&config, &order_by, &limit, &offset)
}

#[tauri::command]
async fn filter_messages_count(
    app: AppHandle,
    handler: State<'_, LogHandler>,
    config: FilterConfig,
) -> Result<i32, String> {
    handler.connect_db(&app)?;
    handler.db.filter_messages_count(&config)
}
#[tauri::command]
async fn get_distinct(
    app: AppHandle,
    handler: State<'_, LogHandler>,
    field: MessageField,
) -> Result<String, String> {
    handler.connect_db(&app)?;
    handler.db.get_distinct(&field)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(LogHandler::new())
        .invoke_handler(tauri::generate_handler![
            start_server,
            stop_server,
            get_server_address,
            set_server_address,
            get_server_state,
            get_messages,
            filter_messages_count,
            filter_messages,
            get_message_count,
            get_distinct,
            config_set,
            config_get
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
