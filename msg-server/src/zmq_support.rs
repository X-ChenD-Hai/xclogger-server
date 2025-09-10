// use ffi_wrapper::MessageData;
use crate::ffi_wrapper::MessageData;
use std::sync::{Arc, Mutex, RwLock};
use std::thread;
use std::thread::sleep;
use zmq::{Context, SocketType};

pub struct ServerHandler {
    address_: Arc<Mutex<String>>,
    handler_: Arc<RwLock<Box<dyn Fn(MessageData) -> () + Send + Sync>>>,
    closed_: Arc<RwLock<bool>>,
}
impl ServerHandler {
    pub fn new<F>(address: &str, handler: F) -> Self
    where
        F: 'static + Fn(MessageData) -> () + Send + Sync,
    {
        Self {
            address_: Arc::new(Mutex::new(address.to_string())),
            handler_: Arc::new(RwLock::new(Box::new(handler))),
            closed_: Arc::<RwLock<bool>>::new(true.into()),
        }
    }
    pub fn run(&self) -> () {
        *self.closed_.as_ref().write().unwrap() = false;
        // Create communication context (like TCP connection pool)
        let addr = self.address_.lock().unwrap().clone();
        let closed = self.closed_.clone();
        let handler = self.handler_.clone();
        thread::spawn(move || {
            let ctx = Context::new();
            let rep = ctx
                .socket(SocketType::REP)
                .expect("Failed to create socket");
            rep.bind(addr.as_str()).expect("Failed to bind socket");
            if *closed.as_ref().read().unwrap() {
                return;
            }
            println!("Server listening on: {}", addr);
            while !*closed.as_ref().read().unwrap() {
                match rep.recv_bytes(zmq::DONTWAIT) {
                    Ok(data) => {
                        if let Ok(decoded_msg) = MessageData::from_bytes(&data) {
                            handler.as_ref().read().unwrap().as_ref()(decoded_msg);
                        }
                        rep.send(data, 0).expect("Failed to send message back");
                    }
                    Err(_) => {
                        continue;
                    }
                }
                sleep(std::time::Duration::from_millis(0));
            }
        });
        // Send messages (0 means non-blocking mode)
    }
    pub fn close(&self) {
        *self.closed_.as_ref().write().unwrap() = true;
    }
    pub fn is_closed(&self) -> bool {
        *self.closed_.as_ref().read().unwrap()
    }
    pub fn set_handler<F>(self, handler: F)
    where
        F: 'static + Fn(MessageData) -> () + Send + Sync,
    {
        *self.handler_.as_ref().write().unwrap() = Box::new(handler);
    }
    pub fn address(&self) -> String {
        self.address_.lock().unwrap().clone()
    }
    pub fn set_address(&self, address: &str) {
        if *self.closed_.as_ref().read().unwrap() {
            *self.address_.lock().unwrap() = address.to_string();
        }
    }
}
