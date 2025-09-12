import { useState, useMemo, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import { useMediaQuery } from '@mui/material';
import SettingsPanel from './components/SettingsPanel';
import AppHeader from './components/AppHeader';
// import ApiDebugView from './components/ApiDebugView';
import LogView from './components/LogView';
import client from './api/tauriClient';
import { LevelRuleSet } from './api/rules';

type ThemeMode = 'light' | 'dark';
const App = () => {

  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');


  // 状态用于管理当前主题模式，并允许用户手动覆盖
  const [mode, setMode] = useState<ThemeMode>(prefersDarkMode ? 'dark' : 'light');
  const [show_settings, setShow_settings] = useState(false);
  const [show_searchbar, setShowSearchbar] = useState(false);
  const [title, setTitle] = useState('xclogger-server');
  const [projection_path, setProjection_path] = useState('');
  const [level_rules, setLevel_rules] = useState<Array<LevelRuleSet>>([]);
  // 使用useMemo根据模式创建主题，优化性能



  useEffect(() => {
    async function init() {
      const theme = await client.get('theme');
      if (theme) {
        setMode(theme as ThemeMode);
      }
      const projection_path = await client.get('projection_path');
      if (projection_path) {
        console.log('get projection_path', projection_path);
        setProjection_path(projection_path);
      }
      const level_rule_sets = await client.get('level_rule_sets');
      if (level_rule_sets) {
        console.log('get level_rule_sets', level_rule_sets);
        setLevel_rules(JSON.parse(level_rule_sets));
      }
    }
    init();
  }, [])

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: mode, // , // 'light' 或 'dark'
          background: {
            default: mode === 'light' ? '#f5f5f5' : '#0f1214',
            paper: mode === 'light' ? '#fff' : '#26262aff',
          }
        },
      }),
    [mode] // 当mode改变时重新创建主题
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ height: '10vh' }}>
        <AppHeader
          thamestate={[mode, (m) => { setMode(m); client.set('theme', m) }]}
          show_search={[show_searchbar, setShowSearchbar]}
          show_settings={[show_settings, value => { setShow_settings(value); setTitle(value ? '设置' : 'xclogger-server'); }]}
          title={title} />
      </Box>
      <Box sx={{ height: '90vh', overflow: 'auto' }}>
        {show_settings ? <SettingsPanel
          project_location={[projection_path, path => { setProjection_path(path); client.set('projection_path', path) }]}
          level_rule_sets={[level_rules, rules => { setLevel_rules(rules); client.set('level_rule_sets', JSON.stringify(rules)) }]}
        /> : <LogView level_rules_sets={level_rules} project_location={projection_path} />}
      </Box>
    </ThemeProvider>
  );
};

export default App;