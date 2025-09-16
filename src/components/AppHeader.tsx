import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { IconButton, TextField, Tooltip } from '@mui/material';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkMode from '@mui/icons-material/DarkMode';
import SettingsIcon from '@mui/icons-material/Settings';
import SearchIcon from '@mui/icons-material/Search';
import DensityMediumIcon from '@mui/icons-material/DensityMedium';
import DensitySmallIcon from '@mui/icons-material/DensitySmall';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import React from 'react';
import client from '../api/tauriClient';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
export type ThemeMode = 'light' | 'dark';
type State<T> = [T, (value: T) => void];
interface AppProps {
    thamestate: State<ThemeMode>;
    show_settings: State<boolean>;
    show_search: State<boolean>;
    mutiline: State<boolean>,
    title?: string,
    status?: string,
    onMessageChange?: () => void; // Callback for message changes (deletions)
}

const AppHeader = (pros: AppProps) => {
    const
        { thamestate: [mode, setMode], show_settings: [act_settings,
            setAct_settings],
            show_search: [show_search, setShowSearchbar],
            onMessageChange
        } = pros;
    const [server_running, setServerRunning] = React.useState(false);
    const [address, setAddress] = React.useState('');
    const [inited, setInited] = React.useState(false);

    React.useEffect(() => {
        async function init() {
            const [address, status] = await Promise.all([client.get('address'), client.get_server_state()]);
            if (address) {
                setAddress(address)
            }
            if (status) {
                setServerRunning(status.is_running)
            }
            setInited(true)
        }
        init()
    }, [])

    React.useEffect(() => {
        if (inited)
            client.set('address', address)
    }, [address])

    const handleServerRunButtonClick = async () => {
        await client.set_server_address(address)
        await client.onRecviveMesage(() => {
            onMessageChange?.()
        })
        await client.start_server(address).then(() => {
            setServerRunning(true)
        })
    }
    const handleServerStopButtonClick = () => {
        client.stop_server().then(() => {
            setServerRunning(false)
        })
    }

    return (<>
        <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            p: 1,
            bgcolor: 'ba'
        }}>
            <Box display='flex' flexDirection='row' justifyItems='start'>
                {pros.title ? <Typography variant="h6" component="h1" sx={{ ml: 2, mr: 2 }}>{pros.title}</Typography> : null}
                <TextField
                    size='small'
                    id="standard-basic"
                    disabled={server_running}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                />
                <Tooltip title={server_running ? '停止服务' : '启动服务'}>
                    <IconButton size='small'>
                        {server_running ? <PauseIcon onClick={handleServerStopButtonClick} /> : <PlayArrowIcon onClick={handleServerRunButtonClick} />}
                    </IconButton>
                </Tooltip>

            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'row-reverse' }}>
                <Tooltip title="设置">
                    <IconButton onClick={() => setAct_settings(!act_settings)}
                        color={act_settings ? 'primary' : 'inherit'}>
                        <SettingsIcon />
                    </IconButton>
                </Tooltip>
                <Tooltip title={mode === 'light' ? '切换为暗色模式' : '切换为亮色模式'}>
                    <IconButton
                        onClick={() => setMode(mode === 'light' ? 'dark' : 'light')}>
                        {mode === 'light' ? <LightModeIcon /> : <DarkMode />}
                    </IconButton>
                </Tooltip>
                <Tooltip title='搜索'>
                    <IconButton onClick={() => setShowSearchbar(!show_search)}
                        color={show_search ? 'primary' : 'inherit'}>
                        <SearchIcon />
                    </IconButton>
                </Tooltip>
                <Tooltip title='清除所有日志'>
                    <IconButton onClick={async () => {
                        await client.delete_messages({});
                        onMessageChange?.();
                    }}>
                        <DeleteForeverIcon />
                    </IconButton>
                </Tooltip>
                <Tooltip title={pros.mutiline[0] ? '多行' : '单行'}>
                    <IconButton onClick={() => pros.mutiline[1](!pros.mutiline[0])}>
                        {pros.mutiline[0] ? <DensityMediumIcon /> :
                            <DensitySmallIcon />}
                    </IconButton>
                </Tooltip>
            </Box>
        </Box>
    </>
    )
}

export default AppHeader;
