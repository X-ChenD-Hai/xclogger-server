use crate::db::*;
use msg_server::zmq_support::ServerHandler;
use rusqlite::Connection;
use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex, RwLock};
use tauri::{AppHandle, Emitter, Manager};
pub struct LogHandler {
    address: Arc<RwLock<String>>,
    pub db: Arc<Mutex<Option<Connection>>>,
    pub server_handler: Arc<RwLock<Option<ServerHandler>>>,
}
#[derive(Serialize, Deserialize)]
pub struct ServerState {
    is_running: bool,
    address: String,
}
impl LogHandler {
    pub fn new() -> Self {
        Self {
            address: Arc::new(RwLock::new("tcp://127.0.0.1:5555".to_string())),
            db: Arc::new(Mutex::new(Option::<Connection>::None)),
            server_handler: Arc::new(RwLock::new(Option::<ServerHandler>::None)),
        }
    }
    pub fn start_server(&self, app_handle: &AppHandle) -> Result<String, String> {
        {
            if let Some(server_handler) = self
                .server_handler
                .read()
                .map_err(|e| e.to_string())?
                .as_ref()
            {
                if server_handler.is_closed() {
                    server_handler.set_address(&self.address.read().unwrap().as_str());
                    server_handler.run();
                }
                return Ok("server already started".to_string());
            }
        }
        {
            let address = self.address.read().unwrap();
            let db = self.db.clone();
            let app = app_handle.clone();
            let server_handler = ServerHandler::new(&address.as_str(), move |data| {
                {
                    if !db.is_connected() {
                        db.connect(
                            &app.path()
                                .data_dir()
                                .unwrap()
                                .join("xclogger")
                                .join("xclogger.db"),
                        )
                        .expect("Failed to connect to database");
                    }
                }
                app.emit(
                    "message-received",
                    &DBMessage {
                        id: db.insert_message(&data).expect("Failed to insert message"),
                        role: data.role.clone(),
                        label: data.label.clone(),
                        file: data.file.clone(),
                        function: data.function.clone(),
                        time: data.time,
                        process_id: data.process_id,
                        thread_id: data.thread_id,
                        line: data.line,
                        level: data.level,
                        messages: data.messages.clone(),
                    },
                )
                .expect("Failed to emit message-received event");
            });
            server_handler.run();
            let mut grade = self.server_handler.write().map_err(|e| e.to_string())?;

            *grade = Some(server_handler);
        }

        Ok("server started".to_string())
    }
    pub fn stop_server(&self) -> Result<String, String> {
        if let Some(server_handler) = self
            .server_handler
            .read()
            .map_err(|e| e.to_string())?
            .as_ref()
        {
            server_handler.close();
        }
        Ok("server stopped".to_string())
    }
    pub fn get_address(&self) -> Result<String, String> {
        if !self.is_server_running().unwrap_or(false) {
            return Ok(self.address.read().unwrap().clone());
        }
        if let Some(server_handler) = self
            .server_handler
            .read()
            .map_err(|e| e.to_string())?
            .as_ref()
        {
            Ok(server_handler.address())
        } else {
            Err("server not started".to_string())
        }
    }
    pub fn is_server_running(&self) -> Result<bool, String> {
        if let Some(server_handler) = self
            .server_handler
            .read()
            .map_err(|e| e.to_string())?
            .as_ref()
        {
            Ok(!server_handler.is_closed())
        } else {
            Ok(false)
        }
    }
    pub fn connect_db(&self, app: &AppHandle) -> Result<String, String> {
        if !self.db.is_connected() {
            self.db
                .connect(
                    &app.path()
                        .data_dir()
                        .unwrap()
                        .join("xclogger")
                        .join("xclogger.db"),
                )
                .map_err(|e| e.to_string())?;
        }
        Ok("database connected".to_string())
    }
    pub fn get_server_address(&self) -> Result<String, String> {
        Ok(self.address.read().unwrap().clone())
    }
    pub fn set_server_address(&self, address: String) -> Result<String, String> {
        if self.is_server_running().unwrap_or(false) {
            return Err("server is running, cannot update address".to_string());
        }
        *self.address.write().unwrap() = address;
        println!(
            "server address updated to {}",
            *self.address.read().unwrap()
        );
        Ok("server address updated".to_string())
    }
    pub fn get_server_state(&self) -> Result<ServerState, String> {
        Ok(ServerState {
            is_running: self.is_server_running().unwrap_or(false),
            address: self.get_address().unwrap_or_default(),
        })
    }
}
