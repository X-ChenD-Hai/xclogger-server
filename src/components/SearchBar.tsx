import React, { useState } from 'react';
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
  Collapse
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Search as SearchIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { FilterConfig, OrderBy, PatternMode } from '../api/client';

interface SearchBarProps {
  onSearch: (config: FilterConfig, orderBy: OrderBy) => void;
  onReset: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, onReset }) => {
  const [expanded, setExpanded] = useState(false);
  const [filterConfig, setFilterConfig] = useState<FilterConfig>({});
  const [orderBy, setOrderBy] = useState<OrderBy>(OrderBy.time);

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
    onSearch(filterConfig, orderBy);
  };

  const handleReset = () => {
    setFilterConfig({});
    setOrderBy(OrderBy.time);
    onReset();
  };

  const hasActiveFilters = Object.keys(filterConfig).length > 0;

  return (
    <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
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
          {/* String pattern filters */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {/* Label filter */}
            <Box sx={{ minWidth: 200 }}>
              <TextField
                label="标签"
                value={(filterConfig.label as any)?.value || ''}
                onChange={(e) => handleStringPatternChange('label', PatternMode.Contain, e.target.value)}
                fullWidth
              />
            </Box>

            {/* Role filter */}
            <Box sx={{ minWidth: 200 }}>
              <TextField
                label="角色"
                value={(filterConfig.role as any)?.value || ''}
                onChange={(e) => handleStringPatternChange('role', PatternMode.Contain, e.target.value)}
                fullWidth
              />
            </Box>

            {/* File filter */}
            <Box sx={{ minWidth: 200 }}>
              <TextField
                label="文件"
                value={(filterConfig.file as any)?.value || ''}
                onChange={(e) => handleStringPatternChange('file', PatternMode.Contain, e.target.value)}
                fullWidth
              />
            </Box>

            {/* Function filter */}
            <Box sx={{ minWidth: 200 }}>
              <TextField
                label="函数"
                value={(filterConfig.function as any)?.value || ''}
                onChange={(e) => handleStringPatternChange('function', PatternMode.Contain, e.target.value)}
                fullWidth
              />
            </Box>

            {/* Messages filter */}
            <Box sx={{ minWidth: 200 }}>
              <TextField
                label="消息内容"
                value={(filterConfig.messages as any)?.value || ''}
                onChange={(e) => handleStringPatternChange('messages', PatternMode.Contain, e.target.value)}
                fullWidth
              />
            </Box>
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

          {/* Order by selection */}
          <Box sx={{ minWidth: 200 }}>
            <FormControl fullWidth>
              <InputLabel>排序方式</InputLabel>
              <Select
                value={orderBy}
                label="排序方式"
                onChange={(e) => setOrderBy(e.target.value as OrderBy)}
              >
                <MenuItem value={OrderBy.Id}>ID</MenuItem>
                <MenuItem value={OrderBy.Role}>角色</MenuItem>
                <MenuItem value={OrderBy.Label}>标签</MenuItem>
                <MenuItem value={OrderBy.file}>文件</MenuItem>
                <MenuItem value={OrderBy.function}>函数</MenuItem>
                <MenuItem value={OrderBy.time}>时间</MenuItem>
                <MenuItem value={OrderBy.process_id}>进程ID</MenuItem>
                <MenuItem value={OrderBy.thread_id}>线程ID</MenuItem>
                <MenuItem value={OrderBy.line}>行号</MenuItem>
                <MenuItem value={OrderBy.level}>日志级别</MenuItem>
              </Select>
            </FormControl>
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
