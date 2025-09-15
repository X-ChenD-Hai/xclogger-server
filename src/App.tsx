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
import { LevelRuleSet, RoleRuleSet, LabelRuleSet } from './api/rules';

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
  const [role_rules, setRole_rules] = useState<Array<RoleRuleSet>>([]);
  const [label_rules, setLabel_rules] = useState<Array<LabelRuleSet>>([]);
  const [inited, setInited] = useState(false);
  // 使用useMemo根据模式创建主题，优化性能



  useEffect(() => {
    const init = async () => {
      try {
        // 并行获取所有数据
        const [
          theme,
          projection_path,
          level_rule_sets,
          role_rule_sets,
          label_rule_sets
        ] = await Promise.all([
          client.get('theme'),
          client.get('projection_path'),
          client.get('level_rule_sets'),
          client.get('role_rule_sets'),
          client.get('label_rule_sets')
        ]);

        // 安全设置状态
        if (theme) setMode(theme as ThemeMode);
        if (projection_path) setProjection_path(projection_path);

        // 添加JSON解析保护
        const safeParse = (str: string) => {
          try { return JSON.parse(str) }
          catch { return [] }
        };

        if (level_rule_sets) setLevel_rules(safeParse(level_rule_sets));
        if (role_rule_sets) setRole_rules(safeParse(role_rule_sets));
        if (label_rule_sets) setLabel_rules(safeParse(label_rule_sets));

      } catch (e) {
        console.error("初始化失败", e);
      } finally {
        // 确保所有数据设置完成后再标记初始化
        setInited(true);
      }
    };

    init();
  }, []);
  useEffect(() => {
    if (inited) {
      console.log("set level_rules ", level_rules);
      client.set('level_rule_sets', JSON.stringify(level_rules));
    }
  }, [level_rules])
  useEffect(() => {
    if (inited) {
      console.log("set role_rules ", role_rules);
      client.set('role_rule_sets', JSON.stringify(role_rules));
    }
  }, [role_rules])
  useEffect(() => {
    if (inited) {
      console.log("set label_rules ", label_rules);
      client.set('label_rule_sets', JSON.stringify(label_rules));
    }
  }, [label_rules])


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
        {show_settings && <SettingsPanel
          project_location={[projection_path, path => { setProjection_path(path); client.set('projection_path', path) }]}
          level_rule_sets={[level_rules, setLevel_rules]}
          role_rule_sets={[role_rules, setRole_rules]}
          label_rule_sets={[label_rules, setLabel_rules]}
        />}
        <Box display={show_settings ? 'none' : 'block'}>
          <LogView
            level_rules_sets={level_rules}
            role_rule_sets={role_rules}
            label_rule_sets={label_rules}
            project_location={projection_path} />
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default App;
