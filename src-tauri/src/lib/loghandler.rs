use crate::db::*;
use msg_server::zmq_support::ServerHandler;
use rusqlite::Connection;
use std::sync::{Arc, Mutex, RwLock};
use tauri::{AppHandle, Emitter, Manager};
pub struct LogHandler {
    pub db: Arc<Mutex<Option<Connection>>>,
    pub server_handler: Arc<RwLock<Option<ServerHandler>>>,
}
impl LogHandler {
    pub fn new() -> Self {
        Self {
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
                    server_handler.run();
                }
                return Ok("server already started".to_string());
            }
        }
        {
            let address = "tcp://127.0.0.1:5553";
            let db = self.db.clone();
            let app = app_handle.clone();
            let server_handler = ServerHandler::new(&address, move |data| {
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
                    db.insert_message(&data).expect("Failed to insert message");
                }
                app.emit(
                    "message-received",
                    data.to_json_string().expect("Failed to serialize message"),
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
}
