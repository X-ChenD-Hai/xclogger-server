import { Box, Button, TextField, Typography } from "@mui/material"
import { useEffect, useState } from "react";
import client from "../api/tauriClient";
import { Message } from '../api/client';
const LogViewer = () => {
    const [msgs, setMessages] = useState<Array<Message>>([])
    const [statemsg, setStateMsg] = useState<string>("")
    const [addr, setAddr] = useState<string>("")
    useEffect(() => {
        client.onRecviveMesage((msg) => {
            const new_ = msgs;
            new_.push(msg)
            setMessages(new_)
            console.log("get msg", msg);

        })
    })
    return (
        <Box>
            <Button size='small' onClick={() => {
                client.get_messages(10, 0).then((v) => {
                    setStateMsg(JSON.stringify(v))

                }).catch(e => {
                    console.log(e);

                })
            }}>
                getmessage
            </Button>
            <Button onClick={() => client.start_server("").then(async () => setStateMsg(JSON.stringify(await client.get_server_state())))}>
                start server
            </Button>
            <Button onClick={() => client.stop_server().then(async () => setStateMsg(JSON.stringify(await client.get_server_state())))}>
                Stop server
            </Button>
            <Button onClick={() => client.get_messages_count().then(v => setStateMsg("msg count: " + v.toString()))}>
                msg count
            </Button>
            <Button onClick={() => client.set("key1", "aa")}>
                set value
            </Button>
            <Button onClick={() => client.get("key1").then(v => console.log(v))}>
                get value
            </Button>
            <Box>
                <TextField label="addr" value={addr} onChange={(e) => setAddr(e.target.value)} />
                <Button onClick={() => client.set_server_address(addr).then(async () => setStateMsg("Success: \n" + JSON.stringify(await client.get_server_state()))).catch(e => setStateMsg("Error: " + e.toString()))}>
                    set addr
                </Button>
            </Box>
            <Box>
                <Typography variant="h6">
                    {statemsg}
                </Typography>
            </Box>
        </Box>
    )
}

export default LogViewer;