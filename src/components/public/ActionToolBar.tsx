import React, { useState } from 'react';
import {
  Box,
  ButtonGroup,
  IconButton,
  Tooltip,
  Paper,
  Typography,
  Checkbox,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import {
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  Delete as DeleteIcon,
  CheckBox as CheckBoxIcon,
  CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon,
  Add as AddIcon,
  ContentCopy as ContentCopyIcon
} from '@mui/icons-material';

interface ActionToolbarProps {
  items: Array<{ id: number; name: string }>;
  onMoveUp: (id: number) => void;
  onMoveDown: (id: number) => void;
  onDelete: (id: number) => void;
  onSelect: (id: number, selected: boolean) => void;
  onInsert: (position?: number) => void;
  selectedItems: number[];
  disabled?: boolean;
}

export const ActionToolbar: React.FC<ActionToolbarProps> = ({
  items,
  onMoveUp,
  onMoveDown,
  onDelete,
  onSelect,
  onInsert,
  selectedItems,
  disabled = false
}) => {
  const [insertPosition, setInsertPosition] = useState<number>(0);

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    items.forEach(item => {
      onSelect(item.id, event.target.checked);
    });
  };

  const isAllSelected = items.length > 0 && selectedItems.length === items.length;
  const isSomeSelected = selectedItems.length > 0 && !isAllSelected;

  return (
    <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
      {/* 工具栏标题和全选功能 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" component="h2">
          操作工具栏
        </Typography>
        <FormControlLabel
          control={
            <Checkbox
              checked={isAllSelected}
              indeterminate={isSomeSelected}
              onChange={handleSelectAll}
              disabled={disabled || items.length === 0}
            />
          }
          label="全选"
        />
      </Box>

      {/* 主要操作按钮组 */}
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
        <ButtonGroup variant="contained" disabled={disabled}>
          {/* 上移按钮 */}
          <Tooltip title="上移选中项">
            <span> {/* 用于禁用时显示提示 */}
              <IconButton
                onClick={() => selectedItems.forEach(id => onMoveUp(id))}
                disabled={disabled || selectedItems.length === 0}
                color="primary"
              >
                <ArrowUpwardIcon />
              </IconButton>
            </span>
          </Tooltip>

          {/* 下移按钮 */}
          <Tooltip title="下移选中项">
            <span>
              <IconButton
                onClick={() => selectedItems.forEach(id => onMoveDown(id))}
                disabled={disabled || selectedItems.length === 0}
                color="primary"
              >
                <ArrowDownwardIcon />
              </IconButton>
            </span>
          </Tooltip>

          {/* 删除按钮 */}
          <Tooltip title="删除选中项">
            <span>
              <IconButton
                onClick={() => selectedItems.forEach(id => onDelete(id))}
                disabled={disabled || selectedItems.length === 0}
                color="error"
              >
                <DeleteIcon />
              </IconButton>
            </span>
          </Tooltip>

          {/* 插入按钮 */}
          <Tooltip title="插入新项">
            <span>
              <IconButton
                onClick={() => onInsert(insertPosition)}
                disabled={disabled}
                color="success"
              >
                <AddIcon />
              </IconButton>
            </span>
          </Tooltip>

          {/* 复制插入按钮 */}
          <Tooltip title="复制选中项并插入">
            <span>
              <IconButton
                onClick={() => {
                  // 这里可以实现复制逻辑
                  console.log('复制并插入选中项');
                }}
                disabled={disabled || selectedItems.length === 0}
                color="info"
              >
                <ContentCopyIcon />
              </IconButton>
            </span>
          </Tooltip>
        </ButtonGroup>

        {/* 插入位置选择器 */}
        <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
          <Typography variant="body2" sx={{ mr: 1 }}>
            插入位置:
          </Typography>
          <select
            value={insertPosition}
            onChange={(e) => setInsertPosition(Number(e.target.value))}
            disabled={disabled}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          >
            <option value={0}>开头</option>
            {items.map((_, index) => (
              <option key={index + 1} value={index + 1}>
                第 {index + 1} 项后
              </option>
            ))}
          </select>
        </Box>
      </Box>

      {/* 项目列表显示 */}
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        项目列表 ({items.length} 项, 选中 {selectedItems.length} 项)
      </Typography>
      
      <List dense sx={{ maxHeight: 200, overflow: 'auto', border: '1px solid #eee', borderRadius: 1 }}>
        {items.map((item, index) => (
          <ListItem key={item.id} divider>
            <Checkbox
              checked={selectedItems.includes(item.id)}
              onChange={(e) => onSelect(item.id, e.target.checked)}
              icon={<CheckBoxOutlineBlankIcon />}
              checkedIcon={<CheckBoxIcon />}
              disabled={disabled}
            />
            <ListItemText 
              primary={`${index + 1}. ${item.name}`} 
              secondary={`ID: ${item.id}`} 
            />
            <ListItemSecondaryAction>
              <Typography variant="caption" color="text.secondary">
                {selectedItems.includes(item.id) ? '已选中' : ''}
              </Typography>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
        {items.length === 0 && (
          <ListItem>
            <ListItemText primary="暂无项目" sx={{ textAlign: 'center', color: 'text.secondary' }} />
          </ListItem>
        )}
      </List>
    </Paper>
  );
};

// 默认导出
export default ActionToolbar;