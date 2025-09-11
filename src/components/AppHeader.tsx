import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { IconButton, Tooltip } from '@mui/material';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkMode from '@mui/icons-material/DarkMode';
import SettingsIcon from '@mui/icons-material/Settings';
import SearchIcon from '@mui/icons-material/Search';

export type ThemeMode = 'light' | 'dark';
type State<T> = [T, (value: T) => void];
interface AppProps {
    thamestate: State<ThemeMode>;
    show_settings: State<boolean>;
    show_search: State<boolean>;
    title?: string,
    status?: string
}

const AppHeader = (pros: AppProps) => {
    const
        { thamestate: [mode, setMode], show_settings: [act_settings,
            setAct_settings],
            show_search: [show_search, setShowSearchbar]
        } = pros;

    return (<>
        <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            p: 1,
            bgcolor: 'ba'
        }}>
            {pros.title ? <Typography variant="h6" component="h1" sx={{ mr: 2 }}>{pros.title}</Typography> : null}
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
            </Box>
        </Box>
    </>
    )
}

export default AppHeader;