import { useState, useEffect, useRef } from "react";
import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { TauriClient } from "./api/tauriClient";
import "./App.css";

function App() {
  const [text, setText] = useState("");
  const [messages, setMessages] = useState("");
  const client = useRef<TauriClient>(null);
  const unlisten = useRef<() => void>(null);
  const start_inited = useRef(false);

  useEffect(() => {
    const init = async () => {
      if (start_inited.current) {
        return;
      }
      start_inited.current = true;
      if (unlisten.current === null) {
        unlisten.current = await listen("message-received", (event) => {
          setText(event.payload as string);
        });
      }
      if (client.current === null) {
        client.current = new TauriClient();
      }
      start_inited.current = false;
    }
    init();
  })
  return (
    <>
      <h1>hello world</h1>
      <p>{text}</p>
      <button onClick={() => invoke("say_hello").then(data => setText(data as string))}
      >get</button>
      <button onClick={() => invoke("start_server").then(data => setText(data as string))}
      >start server</button>
      <button onClick={() => invoke("stop_server").then(data => setText(data as string))}
      >stop server</button>
      <button onClick={() => client.current?.get_messages(10, 0).then(data => setMessages(data))}>select message</button>
      <p>{messages}</p>
    </>

  );
}

export default App;
