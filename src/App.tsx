import { useState, useMemo } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import { useMediaQuery } from '@mui/material';
type ThemeMode = 'light' | 'dark';
import SettingsPanel from './components/SettingsPanel';
import AppHeader from './components/AppHeader';
import LogView from './components/LogView';

const App = () => {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  // 状态用于管理当前主题模式，并允许用户手动覆盖
  const [mode, setMode] = useState<ThemeMode>(prefersDarkMode ? 'dark' : 'light');
  const [show_settings, setShow_settings] = useState(false);
  const [show_searchbar, setShowSearchbar] = useState(false);
  const [title, setTitle] = useState('xclogger-server');
  // 使用useMemo根据模式创建主题，优化性能
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: mode, // 'light' 或 'dark'
          background: {
            default: mode === 'light' ? '#f5f5f5' : '#0f1214',
          }
        },
      }),
    [mode] // 当mode改变时重新创建主题
  );


  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ height: '10vh' }}>
        <AppHeader thamestate={[mode, setMode]}
          show_search={[show_searchbar, setShowSearchbar]}
          show_settings={[show_settings, value => { setShow_settings(value); setTitle(value ? '设置' : 'xclogger-server'); }]}
          title={title} />
      </Box>
      <Box sx={{ height: '90vh', overflow: 'auto' }}>
        {show_settings ? <SettingsPanel /> : <LogView />}
      </Box>
    </ThemeProvider>
  );
};

export default App;