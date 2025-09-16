import React, { useState, useEffect, useRef } from 'react';
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
  CircularProgress,
  Chip,
  InputAdornment
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  ArrowDownward as ArrowDownwardIcon,
  ArrowUpward as ArrowUpwardIcon,
  FilterList as FilterListIcon
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
  const [searchQuery, setSearchQuery] = useState('');

  // State for distinct values
  const [labelOptions, setLabelOptions] = useState<string[]>([]);
  const [roleOptions, setRoleOptions] = useState<string[]>([]);
  const [fileOptions, setFileOptions] = useState<string[]>([]);
  const [functionOptions, setFunctionOptions] = useState<string[]>([]);

  // State for loading
  const [loadingLabel, setLoadingLabel] = useState(false);
  const [loadingRole, setLoadingRole] = useState(false);
  const [loadingFile, setLoadingFile] = useState(false);
  const [loadingFunction, setLoadingFunction] = useState(false);

  // State for filter panel
  const [filterField, setFilterField] = useState<keyof FilterConfig>('messages');
  const [filterValue, setFilterValue] = useState('');
  const [filterOperator, setFilterOperator] = useState<PatternMode>(PatternMode.Contain);

  // Refs for current state values to avoid stale closures in effects
  const isInitialRender = useRef(true);
  const filterConfigRef = useRef(filterConfig);
  const searchQueryRef = useRef(searchQuery);

  // Update refs when state changes
  useEffect(() => {
    filterConfigRef.current = filterConfig;
  }, [filterConfig]);

  useEffect(() => {
    searchQueryRef.current = searchQuery;
  }, [searchQuery]);

  // Auto-apply sort changes
  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }

    let finalConfig = { ...filterConfigRef.current };
    if (searchQueryRef.current.trim()) {
      finalConfig.messages = { mode: PatternMode.Contain, value: searchQueryRef.current.trim() };
    } else if (finalConfig.messages) {
      delete finalConfig.messages;
    }
    onSearch(finalConfig, orderBy, desc);
  }, [orderBy, desc, onSearch]);

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
    // If there's a search query, add it to filterConfig for messages field
    let finalConfig = { ...filterConfig };
    if (searchQuery.trim()) {
      finalConfig.messages = { mode: PatternMode.Contain, value: searchQuery.trim() };
    } else if (finalConfig.messages) {
      delete finalConfig.messages;
    }

    onSearch(finalConfig, orderBy, desc);
  };

  const handleReset = () => {
    setFilterConfig({});
    setSearchQuery('');
    setOrderBy(MessageField.time);
    setDesc(false);
    onReset();
  };

  const handleAddFilter = () => {
    if (filterValue.trim()) {
      const newFilterConfig = { ...filterConfig };
      newFilterConfig[filterField] = {
        mode: filterOperator,
        value: filterValue.trim()
      } as any;
      setFilterConfig(newFilterConfig);
      setFilterValue('');
    }
  };

  const handleRemoveFilter = (field: string) => {
    const newFilterConfig = { ...filterConfig };
    delete newFilterConfig[field as keyof FilterConfig];
    setFilterConfig(newFilterConfig);
  };

  const hasActiveFilters = Object.keys(filterConfig).length > 0 || searchQuery.trim() !== '';

  const getFieldDisplayName = (field: string): string => {
    const fieldMap: { [key: string]: string } = {
      'messages': '消息内容',
      'file': '文件',
      'function': '函数',
      'level': '等级',
      'process_id': '进程ID',
      'thread_id': '线程ID',
      'role': '角色',
      'label': '标签'
    };
    return fieldMap[field] || field;
  };

  const getOperatorDisplayName = (operator: PatternMode): string => {
    const operatorMap: { [key: string]: string } = {
      [PatternMode.Contain]: '包含',
      [PatternMode.Equal]: '等于',
      [PatternMode.Start]: '开头为',
      [PatternMode.End]: '结尾为'
    };
    return operatorMap[operator] || operator;
  };

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Search Input */}
        <TextField
          placeholder="搜索日志内容..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: searchQuery && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearchQuery('')}>
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
          size="small"
          sx={{ minWidth: 300 }}
        />

        {/* Sort Control */}
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>排序字段</InputLabel>
          <Select
            value={orderBy}
            label="排序字段"
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

        {/* Sort Direction Toggle */}
        <IconButton
          onClick={() => setDesc(!desc)}
          title={desc ? '降序' : '升序'}
        >
          {desc ? <ArrowDownwardIcon /> : <ArrowUpwardIcon />}
        </IconButton>

        {/* Filter Toggle */}
        <IconButton
          onClick={() => setExpanded(!expanded)}
          color={hasActiveFilters ? 'primary' : 'default'}
          title="显示筛选器"
        >
          <FilterListIcon />
        </IconButton>

        {/* Action buttons */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            startIcon={<SearchIcon />}
            onClick={handleSearch}
            disabled={!hasActiveFilters}
            size="small"
          >
            搜索
          </Button>
          <Button
            variant="outlined"
            startIcon={<ClearIcon />}
            onClick={handleReset}
            size="small"
          >
            重置
          </Button>
        </Box>
      </Box>

      {/* Active Filters */}
      {hasActiveFilters && (
        <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {searchQuery && (
            <Chip
              label={`消息内容: 包含 "${searchQuery}"`}
              onDelete={() => setSearchQuery('')}
              size="small"
              color="primary"
              variant="outlined"
            />
          )}
          {Object.entries(filterConfig).map(([field, value]) => (
            <Chip
              key={field}
              label={`${getFieldDisplayName(field)}: ${getOperatorDisplayName((value as any).mode)} "${(value as any).value}"`}
              onDelete={() => handleRemoveFilter(field)}
              size="small"
              color="primary"
              variant="outlined"
            />
          ))}
        </Box>
      )}

      {/* Filter Panel */}
      <Collapse in={expanded}>
        <Box sx={{ mt: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            添加高级筛选器
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>字段</InputLabel>
              <Select
                value={filterField}
                label="字段"
                onChange={(e) => setFilterField(e.target.value)}
              >
                <MenuItem value="messages">消息内容</MenuItem>
                <MenuItem value="file">文件</MenuItem>
                <MenuItem value="function">函数</MenuItem>
                <MenuItem value="role">角色</MenuItem>
                <MenuItem value="label">标签</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>操作符</InputLabel>
              <Select
                value={filterOperator}
                label="操作符"
                onChange={(e) => setFilterOperator(e.target.value as PatternMode)}
              >
                <MenuItem value={PatternMode.Contain}>包含</MenuItem>
                <MenuItem value={PatternMode.Equal}>等于</MenuItem>
                <MenuItem value={PatternMode.Start}>开头为</MenuItem>
                <MenuItem value={PatternMode.End}>结尾为</MenuItem>
              </Select>
            </FormControl>

            <Autocomplete
              freeSolo
              options={filterField === 'label' ? labelOptions :
                filterField === 'role' ? roleOptions :
                  filterField === 'file' ? fileOptions :
                    filterField === 'function' ? functionOptions : []}
              value={filterValue}
              onChange={(_, newValue) => setFilterValue(newValue || '')}
              onInputChange={(_, newInputValue) => setFilterValue(newInputValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="值"
                  size="small"
                  sx={{ minWidth: 200 }}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {filterField === 'label' && loadingLabel ? <CircularProgress color="inherit" size={16} /> : null}
                        {filterField === 'role' && loadingRole ? <CircularProgress color="inherit" size={16} /> : null}
                        {filterField === 'file' && loadingFile ? <CircularProgress color="inherit" size={16} /> : null}
                        {filterField === 'function' && loadingFunction ? <CircularProgress color="inherit" size={16} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
              loading={filterField === 'label' ? loadingLabel :
                filterField === 'role' ? loadingRole :
                  filterField === 'file' ? loadingFile :
                    filterField === 'function' ? loadingFunction : false}
            />

            <Button
              variant="outlined"
              onClick={handleAddFilter}
              disabled={!filterValue.trim()}
              size="small"
            >
              添加筛选
            </Button>
          </Box>

          {/* Number range filters */}
          <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {/* Level filter */}
            <Box sx={{ minWidth: 200 }}>
              <Typography variant="body2" gutterBottom>日志级别范围</Typography>
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
              <Typography variant="body2" gutterBottom>进程ID范围</Typography>
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
              <Typography variant="body2" gutterBottom>线程ID范围</Typography>
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
              <Typography variant="body2" gutterBottom>行号范围</Typography>
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
        </Box>
      </Collapse>
    </Paper>
  );
};

export default SearchBar;
