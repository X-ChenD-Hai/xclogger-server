import React, { useState, useRef } from 'react';
import {
  Box,
  Popover,
  IconButton,
  Paper,
  Typography,
  ClickAwayListener,
} from '@mui/material';
import {
  Palette as PaletteIcon,
  Check as CheckIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { HexColorPicker } from 'react-colorful';

interface ColorEditorProps {
  value: string;
  onChange: (color: string) => void;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export const ColorEditor: React.FC<ColorEditorProps> = ({
  value,
  onChange,
  disabled = false,
  size = 'medium',
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [tempColor, setTempColor] = useState(value);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // 尺寸配置
  const sizeConfig = {
    small: {
      button: 32,
      pickerHeight: 150,
      fontSize: '0.75rem',
      iconSize: 18,
      popoverWidth: 280,
    },
    medium: {
      button: 40,
      pickerHeight: 200,
      fontSize: '0.875rem',
      iconSize: 24,
      popoverWidth: 320,
    },
    large: {
      button: 48,
      pickerHeight: 250,
      fontSize: '1rem',
      iconSize: 30,
      popoverWidth: 360,
    },
  };

  const currentSize = sizeConfig[size];

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    if (disabled) return;
    setAnchorEl(event.currentTarget);
    setTempColor(value);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleApply = () => {
    onChange(tempColor);
    handleClose();
  };

  const handleCancel = () => {
    setTempColor(value);
    handleClose();
  };

  const handleColorChange = (newColor: string) => {
    setTempColor(newColor);
  };

  const open = Boolean(anchorEl);
  const id = open ? 'color-picker-popover' : undefined;

  return (
    <Box>
      {/* 图标按钮 - 触发颜色选择器 */}
      <IconButton
        ref={buttonRef}
        onClick={handleOpen}
        disabled={disabled}
        size={size}
        sx={{
          backgroundColor: value,
          color: '#fff',
          border: `1px solid ${value}`,
          width: currentSize.button,
          height: currentSize.button,
          '&:hover': {
            backgroundColor: value,
            opacity: 0.8,
          },
          '& .MuiSvgIcon-root': {
            fontSize: currentSize.iconSize, // 图标大小与按钮尺寸成比例
          },
        }}
        aria-label="选择颜色"
      >
        <PaletteIcon />
      </IconButton>

      {/* 颜色选择弹出层 */}
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleCancel}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        sx={{
          '& .MuiPopover-paper': {
            borderRadius: 2,
            overflow: 'hidden',
          },
        }}
      >
        <ClickAwayListener onClickAway={handleCancel}>
          <Paper sx={{
            p: 2,
            minWidth: currentSize.popoverWidth,
            backgroundColor: 'background.paper',
          }}>
            {/* 标题和操作按钮 */}
            <Box sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2
            }}>
              <Typography variant="subtitle1" sx={{ fontSize: currentSize.fontSize }}>
                选择颜色
              </Typography>
              <Box>
                <IconButton
                  size={size}
                  onClick={handleApply}
                  sx={{ color: 'success.main' }}
                  aria-label="确认选择"
                >
                  <CheckIcon fontSize={size} />
                </IconButton>
                <IconButton
                  size={size}
                  onClick={handleCancel}
                  sx={{ color: 'error.main' }}
                  aria-label="取消选择"
                >
                  <CloseIcon fontSize={size} />
                </IconButton>
              </Box>
            </Box>

            {/* 颜色选择器 */}
            <HexColorPicker
              color={tempColor}
              onChange={handleColorChange}
              style={{
                width: '100%',
                height: currentSize.pickerHeight,
                marginBottom: 16,
                borderRadius: 8,
              }}
            />

            {/* 颜色预览和显示 */}
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              mb: 1
            }}>
              <Box
                sx={{
                  width: currentSize.button,
                  height: currentSize.button,
                  backgroundColor: tempColor,
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                  flexShrink: 0,
                }}
              />
              <Typography
                variant="body2"
                sx={{
                  flex: 1,
                  fontSize: currentSize.fontSize,
                  fontFamily: 'monospace',
                }}
              >
                {tempColor.toUpperCase()}
              </Typography>
            </Box>

            {/* 当前颜色提示 */}
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                display: 'block',
                fontSize: size === 'small' ? '0.7rem' : '0.75rem'
              }}
            >
              点击上方颜色选择器或使用颜色代码选择颜色
            </Typography>
          </Paper>
        </ClickAwayListener>
      </Popover>
    </Box>
  );
};

// 默认导出
export default ColorEditor;