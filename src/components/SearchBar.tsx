import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Paper,
  Typography,
  IconButton,
  Collapse,
  Autocomplete,
  CircularProgress
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  ArrowDownward as ArrowDownwardIcon,
  ArrowUpward as ArrowUpwardIcon
} from '@mui/icons-material';
import { FilterConfig, MessageField, PatternMode } from '../api/client';
import client from '../api/tauriClient';

interface SearchBarProps {
  onSearch: (config: FilterConfig, orderBy: MessageField, desc: boolean) => void;
  onReset: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, onReset }) => {
  const [expanded, setExpanded] = useState(false);
  const [filterConfig, setFilterConfig] = useState<FilterConfig>({});
  const [orderBy, setOrderBy] = useState<MessageField>(MessageField.time);
  const [desc, setDesc] = useState<boolean>(false);

  // State for distinct values
  const [labelOptions, setLabelOptions] = useState<string[]>([]);
  const [roleOptions, setRoleOptions] = useState<string[]>([]);
  const [fileOptions, setFileOptions] = useState<string[]>([]);
  const [functionOptions, setFunctionOptions] = useState<string[]>([]);
  const [messagesOptions, setMessagesOptions] = useState<string[]>([]);

  // State for loading
  const [loadingLabel, setLoadingLabel] = useState(false);
  const [loadingRole, setLoadingRole] = useState(false);
  const [loadingFile, setLoadingFile] = useState(false);
  const [loadingFunction, setLoadingFunction] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Load distinct values when expanded
  useEffect(() => {
    if (expanded) {
      loadDistinctValues();
    }
  }, [expanded]);

  const loadDistinctValues = async () => {
    // Load label options
    setLoadingLabel(true);
    try {
      const labels = await client.get_distinct(MessageField.Label);
      setLabelOptions(labels.filter(label => label && label.trim() !== ''));
    } catch (error) {
      console.error('Failed to load label options:', error);
    } finally {
      setLoadingLabel(false);
    }

    // Load role options
    setLoadingRole(true);
    try {
      const roles = await client.get_distinct(MessageField.Role);
      setRoleOptions(roles.filter(role => role && role.trim() !== ''));
    } catch (error) {
      console.error('Failed to load role options:', error);
    } finally {
      setLoadingRole(false);
    }

    // Load file options
    setLoadingFile(true);
    try {
      const files = await client.get_distinct(MessageField.file);
      setFileOptions(files.filter(file => file && file.trim() !== ''));
    } catch (error) {
      console.error('Failed to load file options:', error);
    } finally {
      setLoadingFile(false);
    }

    // Load function options
    setLoadingFunction(true);
    try {
      const functions = await client.get_distinct(MessageField.function);
      setFunctionOptions(functions.filter(func => func && func.trim() !== ''));
    } catch (error) {
      console.error('Failed to load function options:', error);
    } finally {
      setLoadingFunction(false);
    }

    // Load messages options
    setLoadingMessages(true);
    try {
      // For messages, we might want to get distinct message patterns or common phrases
      // For now, we'll use an empty array as messages can be very diverse
      setMessagesOptions([]);
    } catch (error) {
      console.error('Failed to load messages options:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleStringPatternChange = (
    field: keyof FilterConfig,
    mode: PatternMode,
    value: string
  ) => {
    setFilterConfig(prev => ({
      ...prev,
      [field]: { mode, value }
    }));
  };

  const handleNumberRangeChange = (
    field: keyof FilterConfig,
    min: number | undefined,
    max: number | undefined
  ) => {
    setFilterConfig(prev => ({
      ...prev,
      [field]: { min: min ?? 0, max: max ?? 0 }
    }));
  };

  const handleSearch = () => {
    onSearch(filterConfig, orderBy, desc);
  };

  const handleReset = () => {
    setFilterConfig({});
    setOrderBy(MessageField.time);
    onReset();
  };

  const hasActiveFilters = Object.keys(filterConfig).length > 0;

  return (
    <Paper elevation={2} sx={{ p: 1, mb: 2, position: 'sticky', top: 0, zIndex: 1000 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: expanded ? 2 : 0 }}>
        <Typography variant="h6" component="h2">
          搜索过滤器
        </Typography>
        <IconButton onClick={() => setExpanded(!expanded)}>
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>

      <Collapse in={expanded}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* String pattern filters - Compact layout */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 1 }}>
            {/* Label filter */}
            <Autocomplete
              freeSolo
              size="small"
              options={labelOptions}
              value={(filterConfig.label as any)?.value || ''}
              onChange={(_, newValue) => handleStringPatternChange('label', PatternMode.Contain, newValue || '')}
              onInputChange={(_, newInputValue) => handleStringPatternChange('label', PatternMode.Contain, newInputValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="标签"
                  size="small"
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {loadingLabel ? <CircularProgress color="inherit" size={16} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
              loading={loadingLabel}
            />

            {/* Role filter */}
            <Autocomplete
              freeSolo
              size="small"
              options={roleOptions}
              value={(filterConfig.role as any)?.value || ''}
              onChange={(_, newValue) => handleStringPatternChange('role', PatternMode.Contain, newValue || '')}
              onInputChange={(_, newInputValue) => handleStringPatternChange('role', PatternMode.Contain, newInputValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="角色"
                  size="small"
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {loadingRole ? <CircularProgress color="inherit" size={16} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
              loading={loadingRole}
            />

            {/* File filter */}
            <Autocomplete
              freeSolo
              size="small"
              options={fileOptions}
              value={(filterConfig.file as any)?.value || ''}
              onChange={(_, newValue) => handleStringPatternChange('file', PatternMode.Contain, newValue || '')}
              onInputChange={(_, newInputValue) => handleStringPatternChange('file', PatternMode.Contain, newInputValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="文件"
                  size="small"
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {loadingFile ? <CircularProgress color="inherit" size={16} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
              loading={loadingFile}
            />

            {/* Function filter */}
            <Autocomplete
              freeSolo
              size="small"
              options={functionOptions}
              value={(filterConfig.function as any)?.value || ''}
              onChange={(_, newValue) => handleStringPatternChange('function', PatternMode.Contain, newValue || '')}
              onInputChange={(_, newInputValue) => handleStringPatternChange('function', PatternMode.Contain, newInputValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="函数"
                  size="small"
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {loadingFunction ? <CircularProgress color="inherit" size={16} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
              loading={loadingFunction}
            />

            {/* Messages filter */}
            <Autocomplete
              freeSolo
              size="small"
              options={messagesOptions}
              value={(filterConfig.messages as any)?.value || ''}
              onChange={(_, newValue) => handleStringPatternChange('messages', PatternMode.Contain, newValue || '')}
              onInputChange={(_, newInputValue) => handleStringPatternChange('messages', PatternMode.Contain, newInputValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="消息内容"
                  size="small"
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {loadingMessages ? <CircularProgress color="inherit" size={16} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
              loading={loadingMessages}
            />
          </Box>

          {/* Number range filters */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {/* Level filter */}
            <Box sx={{ minWidth: 200 }}>
              <Typography variant="body2" gutterBottom>日志级别</Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  label="最小值"
                  type="number"
                  value={(filterConfig.level as any)?.min || ''}
                  onChange={(e) => handleNumberRangeChange('level', e.target.value ? parseInt(e.target.value) : undefined, (filterConfig.level as any)?.max)}
                  size="small"
                />
                <TextField
                  label="最大值"
                  type="number"
                  value={(filterConfig.level as any)?.max || ''}
                  onChange={(e) => handleNumberRangeChange('level', (filterConfig.level as any)?.min, e.target.value ? parseInt(e.target.value) : undefined)}
                  size="small"
                />
              </Box>
            </Box>

            {/* Process ID filter */}
            <Box sx={{ minWidth: 200 }}>
              <Typography variant="body2" gutterBottom>进程ID</Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  label="最小值"
                  type="number"
                  value={(filterConfig.process_id as any)?.min || ''}
                  onChange={(e) => handleNumberRangeChange('process_id', e.target.value ? parseInt(e.target.value) : undefined, (filterConfig.process_id as any)?.max)}
                  size="small"
                />
                <TextField
                  label="最大值"
                  type="number"
                  value={(filterConfig.process_id as any)?.max || ''}
                  onChange={(e) => handleNumberRangeChange('process_id', (filterConfig.process_id as any)?.min, e.target.value ? parseInt(e.target.value) : undefined)}
                  size="small"
                />
              </Box>
            </Box>

            {/* Thread ID filter */}
            <Box sx={{ minWidth: 200 }}>
              <Typography variant="body2" gutterBottom>线程ID</Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  label="最小值"
                  type="number"
                  value={(filterConfig.thread_id as any)?.min || ''}
                  onChange={(e) => handleNumberRangeChange('thread_id', e.target.value ? parseInt(e.target.value) : undefined, (filterConfig.thread_id as any)?.max)}
                  size="small"
                />
                <TextField
                  label="最大值"
                  type="number"
                  value={(filterConfig.thread_id as any)?.max || ''}
                  onChange={(e) => handleNumberRangeChange('thread_id', (filterConfig.thread_id as any)?.min, e.target.value ? parseInt(e.target.value) : undefined)}
                  size="small"
                />
              </Box>
            </Box>

            {/* Line filter */}
            <Box sx={{ minWidth: 200 }}>
              <Typography variant="body2" gutterBottom>行号</Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  label="最小值"
                  type="number"
                  value={(filterConfig.line as any)?.min || ''}
                  onChange={(e) => handleNumberRangeChange('line', e.target.value ? parseInt(e.target.value) : undefined, (filterConfig.line as any)?.max)}
                  size="small"
                />
                <TextField
                  label="最大值"
                  type="number"
                  value={(filterConfig.line as any)?.max || ''}
                  onChange={(e) => handleNumberRangeChange('line', (filterConfig.line as any)?.min, e.target.value ? parseInt(e.target.value) : undefined)}
                  size="small"
                />
              </Box>
            </Box>
          </Box>

          {/* Order by selection and sort direction */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <Box sx={{ minWidth: 200 }}>
              <FormControl fullWidth>
                <InputLabel>排序方式</InputLabel>
                <Select
                  value={orderBy}
                  label="排序方式"
                  onChange={(e) => setOrderBy(e.target.value as MessageField)}
                >
                  <MenuItem value={MessageField.Id}>ID</MenuItem>
                  <MenuItem value={MessageField.Role}>角色</MenuItem>
                  <MenuItem value={MessageField.Label}>标签</MenuItem>
                  <MenuItem value={MessageField.file}>文件</MenuItem>
                  <MenuItem value={MessageField.function}>函数</MenuItem>
                  <MenuItem value={MessageField.time}>时间</MenuItem>
                  <MenuItem value={MessageField.process_id}>进程ID</MenuItem>
                  <MenuItem value={MessageField.thread_id}>线程ID</MenuItem>
                  <MenuItem value={MessageField.line}>行号</MenuItem>
                  <MenuItem value={MessageField.level}>日志级别</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Sort direction toggle */}
            <Box>
              <Button
                variant={desc ? "contained" : "outlined"}
                onClick={() => setDesc(!desc)}
                startIcon={desc ? <ArrowDownwardIcon /> : <ArrowUpwardIcon />}
                sx={{ minWidth: 'auto' }}
              >
                {desc ? '降序' : '升序'}
              </Button>
            </Box>
          </Box>

          {/* Action buttons */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              startIcon={<SearchIcon />}
              onClick={handleSearch}
              disabled={!hasActiveFilters}
            >
              搜索
            </Button>
            <Button
              variant="outlined"
              startIcon={<ClearIcon />}
              onClick={handleReset}
            >
              重置
            </Button>
          </Box>
        </Box>
      </Collapse>
    </Paper>
  );
};

export default SearchBar;
