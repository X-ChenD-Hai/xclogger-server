use anyhow::{Result, anyhow};
use libc::size_t;
use serde::Serialize;
use std::ffi::{CStr, CString};
use std::os::raw::c_char;
use std::ptr;

// Manual FFI bindings for the C++ functions
#[derive(Debug)]
#[repr(C)]
pub struct XCLOGMessage {
    pub role: *const c_char,
    pub label: *const c_char,
    pub file: *const c_char,
    pub function: *const c_char,
    pub time: size_t,
    pub process_id: size_t,
    pub thread_id: size_t,
    pub line: i32,
    pub level: i32,
    pub messages: *const *const c_char,
    pub messages_size: size_t,
}

unsafe extern "C" {
    pub fn XCLOGMessage_encode(msg: *const XCLOGMessage, out_size: *mut size_t) -> *mut c_char;
    pub fn XCLOGMessage_decode(data: *const c_char, size: size_t) -> *mut XCLOGMessage;
    pub fn XCLOGMessage_free_encoded_data(data: *mut c_char);
    pub fn XCLOGMessage_hash(data: *const c_char, size: size_t) -> size_t;
}

/// Safe wrapper for XCLOGMessage
#[derive(Debug)]
pub struct Message {
    inner: *mut XCLOGMessage,
}

impl Message {
    /// Create a new message from Rust data
    pub fn new(
        role: &str,
        label: &str,
        file: &str,
        function: &str,
        time: usize,
        process_id: usize,
        thread_id: usize,
        line: i32,
        level: i32,
        messages: Vec<String>,
    ) -> Result<Self> {
        // Convert strings to C strings and leak them (they'll be freed by C++ code)
        let c_role = CString::new(role)?.into_raw();
        let c_label = CString::new(label)?.into_raw();
        let c_file = CString::new(file)?.into_raw();
        let c_function = CString::new(function)?.into_raw();

        // Convert message strings
        let mut c_messages_vec: Vec<*const c_char> = Vec::new();
        for msg in messages {
            c_messages_vec.push(CString::new(msg)?.into_raw());
        }

        let messages_size = c_messages_vec.len();
        let messages_ptr = if c_messages_vec.is_empty() {
            ptr::null()
        } else {
            let mut boxed_messages = c_messages_vec.into_boxed_slice();
            let ptr = boxed_messages.as_mut_ptr();
            Box::leak(boxed_messages);
            ptr
        };

        let msg = XCLOGMessage {
            role: c_role,
            label: c_label,
            file: c_file,
            function: c_function,
            time,
            process_id,
            thread_id,
            line,
            level,
            messages: messages_ptr,
            messages_size,
        };

        let inner = Box::into_raw(Box::new(msg));
        Ok(Self { inner })
    }

    /// Encode the message to binary format
    pub fn encode(&self) -> Result<Vec<u8>> {
        let mut out_size: size_t = 0;
        let encoded_ptr = unsafe { XCLOGMessage_encode(self.inner, &mut out_size) };
        if encoded_ptr.is_null() {
            return Err(anyhow!("Failed to encode message"));
        }

        let encoded_data =
            unsafe { std::slice::from_raw_parts(encoded_ptr as *const u8, out_size) }.to_vec();

        // Free the encoded data
        unsafe { XCLOGMessage_free_encoded_data(encoded_ptr) };

        Ok(encoded_data)
    }

    /// Decode binary data to a message
    pub fn decode(data: &[u8]) -> Result<Self> {
        let msg_ptr = unsafe { XCLOGMessage_decode(data.as_ptr() as *const c_char, data.len()) };

        if msg_ptr.is_null() {
            return Err(anyhow!("Failed to decode message"));
        }

        Ok(Self { inner: msg_ptr })
    }

    /// Convert to Rust-friendly representation
    pub fn to_rust(&self) -> Result<MessageData> {
        unsafe {
            let msg = &*self.inner;

            Ok(MessageData {
                role: CStr::from_ptr(msg.role).to_str()?.to_string(),
                label: CStr::from_ptr(msg.label).to_str()?.to_string(),
                file: CStr::from_ptr(msg.file).to_str()?.to_string(),
                function: CStr::from_ptr(msg.function).to_str()?.to_string(),
                time: msg.time,
                process_id: msg.process_id,
                thread_id: msg.thread_id,
                line: msg.line,
                level: msg.level,
                messages: (0..msg.messages_size)
                    .map(|i| {
                        CStr::from_ptr(*msg.messages.add(i))
                            .to_str()
                            .map(|s| s.to_string())
                    })
                    .collect::<Result<Vec<String>, _>>()?,
            })
        }
    }

    /// Hash the message data
    pub fn hash(&self) -> u64 {
        let data = self.encode().unwrap();
        unsafe { XCLOGMessage_hash(data.as_ptr() as *const c_char, data.len()) as u64 }
    }
}

impl Drop for Message {
    fn drop(&mut self) {
        unsafe {
            // Only free if the message was created by C++ (not by Rust)
            // For messages created by Rust, we need to manually free the memory
            // since Rust's allocator is different from C++'s
            if !self.inner.is_null() {
                // Free the individual message strings if they exist
                let msg = &*self.inner;
                if !msg.messages.is_null() && msg.messages_size > 0 {
                    for i in 0..msg.messages_size {
                        let message_ptr = *msg.messages.add(i);
                        if !message_ptr.is_null() {
                            drop(CString::from_raw(message_ptr as *mut c_char));
                        }
                    }
                    // Free the messages array
                    drop(Box::from_raw(msg.messages as *mut *const c_char));
                }

                // Free the main message struct
                drop(Box::from_raw(self.inner));
            }
        }
    }
}

/// Rust-friendly message data structure
#[derive(Debug, Clone, Serialize)]
pub struct MessageData {
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

impl MessageData {
    pub fn from_bytes(data: &[u8]) -> Result<Self> {
        let msg = Message::decode(data)?;
        msg.to_rust()
    }
    /// Convert to FFI message
    pub fn to_ffi(&self) -> Result<Message> {
        let msg = Message::new(
            &self.role,
            &self.label,
            &self.file,
            &self.function,
            self.time,
            self.process_id,
            self.thread_id,
            self.line,
            self.level,
            self.messages.clone(),
        );

        msg
    }
    pub fn to_json_string(&self) -> Result<String> {
        serde_json::to_string(self).map_err(|e| anyhow!("Failed to serialize message: {}", e))
    }
    pub fn hash(&self) -> u64 {
        self.to_ffi().unwrap().hash()
    }
}
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_message() -> Result<()> {
        println!("Testing Rust to C++ Message Encoding...");

        // Create a test message
        let test_message = MessageData {
            role: "test".to_string(),
            label: "debug".to_string(),
            file: "main.rs".to_string(),
            function: "main".to_string(),
            time: 1234567890,
            process_id: 12345,
            thread_id: 1,
            line: 42,
            level: 1,
            messages: vec![
                "Hello from Rust!".to_string(),
                "Calling C++ encoding function".to_string(),
                "Success!".to_string(),
            ],
        };

        println!("Original message: {:?}", test_message);

        // Convert to FFI message (Rust -> C++ interface)
        let ffi_message = test_message.to_ffi().expect("Failed to create FFI message");
        println!("FFI message created successfully");

        // Encode using C++ function
        let encoded = ffi_message.encode().expect("Failed to encode message");
        println!("Encoded data length: {} bytes", encoded.len());
        println!(
            "First 16 bytes of encoded data: {:?}",
            &encoded[..16.min(encoded.len())]
        );
        let hash = ffi_message.hash();
        println!("Hash of encoded data: {:#x}", hash);

        let msg_data = MessageData::from_bytes(&encoded)?;
        println!("Decoded message: {:?}", msg_data);
        println!("Decoded message: {:?}", msg_data.to_json_string()?);

        println!("\n✅ Rust successfully called C++ message encoding functionality!");

        Ok(())
    }
}
