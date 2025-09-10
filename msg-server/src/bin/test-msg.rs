use msg_server::zmq_support;

fn main() {
    zmq_support::ServerHandler::new("tcp://127.0.0.1:5555", |_, msg| {
        println!("Received message: {}", msg.messages.join("\n"));
    })
    .run();
}
