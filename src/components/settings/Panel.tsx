import React from 'react';
import Box from '@mui/material/Box';
import {
    Button,
    IconButton,
    Tooltip} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    ArrowUpward as ArrowUpwardIcon,
    ArrowDownward as ArrowDownIcon} from '@mui/icons-material';
import FoldArea from '../public/FoldArea';
const ActionBar = (props: {
    onInsert?: () => void,
    onDelete?: () => void,
    onMoveUp?: () => void,
    onMoveDown?: () => void,
}) => {
    return (
        <Box sx={{ display: 'flex', gap: 0.5 }
        } onClick={(e) => e.stopPropagation()}>
            <IconButton
                size="small"
                onClick={(e) => {
                    e.stopPropagation();
                    props.onMoveUp?.();
                }}
                disabled={props.onMoveUp === undefined}
            >
                <Tooltip title="删除">
                    <ArrowUpwardIcon fontSize="small" />
                </Tooltip>
            </IconButton>
            <IconButton
                size="small"
                onClick={(e) => {
                    e.stopPropagation();
                    props.onMoveDown?.();
                }}
                disabled={props.onMoveDown === undefined}
            >
                <Tooltip title="下移">
                    <ArrowDownIcon fontSize="small" />
                </Tooltip>
            </IconButton>
            <IconButton
                size="small"
                onClick={(e) => {
                    e.stopPropagation();
                    props.onInsert?.();
                }}
                disabled={props.onInsert === undefined}
            >
                <Tooltip title="插入">
                    <AddIcon fontSize="small" />
                </Tooltip>
            </IconButton>
            <IconButton
                size="small"
                onClick={(e) => {
                    e.stopPropagation();
                    props.onDelete?.();
                }}
                color="error"
                disabled={props.onDelete === undefined}
            >
                <Tooltip title="删除">
                    <DeleteIcon fontSize="small" />
                </Tooltip>
            </IconButton>

        </Box >
    )
}




export interface PanelProps<T, U> {
    sets: T[];
    setHeader: React.FC<{ set: T, index: number, [key: string]: any }>;
    getItems: (set: T) => U[];
    itemElement: React.FC<{ item: U, index: number, set_index: number, [key: string]: any }>;
    itemIsDisabled?: (item: U) => boolean;
    updateSetDisabled?: (sindex: number, disabled: boolean) => void;
    updateItemDisabled?: (setIndex: number, iindex: number, disabled: boolean) => void;
    onInsertSet?: (position: number) => void;
    onDeleteSet?: (index: number) => void;
    onMoveSet?: (from: number, to: number) => void;
    onInsertItem?: (setIndex: number, index: number) => void;
    onDeleteItem?: (setIndex: number, index: number) => void;
    onMoveItem?: (setIndex: number, from: number, to: number) => void;
}

function Panel<T, U>(props: PanelProps<T, U>) {

    return (
        <Box>
            {/* 规则集列表 - 操作按钮集成到每个项的右侧 */}
            {props.sets.map((set, index) => (
                <Box key={index} sx={{ position: 'relative', mb: 1 }}>
                    {/* 插入按钮 - 在每个规则集之前（第一个规则集前不显示） */}
                    <FoldArea
                        header={pros =>
                        (<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}
                            onClick={(e) => { e.stopPropagation(); pros.setFold(!pros.fold) }}
                        >
                            <props.setHeader set={set} index={index} />
                            <ActionBar
                                onInsert={props.onInsertSet ? () => { props.onInsertSet && props.onInsertSet(index) } : undefined}
                                onDelete={props.onDeleteSet ? () => { props.onDeleteSet && props.onDeleteSet(index) } : undefined}
                                onMoveUp={(props.onMoveSet && index > 0) ? () => { props.onMoveSet && props.onMoveSet(index, index - 1) } : undefined}
                                onMoveDown={(props.onMoveSet && index < props.sets.length - 1) ? () => { props.onMoveSet && props.onMoveSet(index, index + 1) } : undefined}
                            />
                        </Box>)
                        }
                    >
                        <Box sx={{ width: '100%' }}>
                            {props.getItems(set).length === 0 &&
                                <Box sx={{ width: '100%', height: 30, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                    <Button
                                        disabled={props.onInsertItem === undefined}
                                        onClick={() => { props.onInsertItem && props.onInsertItem(index, 0) }}
                                    >添加</Button>
                                </Box>
                            }
                            {props.getItems(set).map((item, iindex) => (
                                <Box sx={{ width: '100%', pl: 1, pr: 1 }} key={iindex} display='flex' flexDirection='row' justifyContent='space-between' >
                                    <props.itemElement item={item} index={iindex} set_index={index} />
                                    <ActionBar
                                        onInsert={props.onInsertItem ? () => { props.onInsertItem && props.onInsertItem(index, iindex) } : undefined}
                                        onDelete={props.onDeleteItem ? () => { props.onDeleteItem && props.onDeleteItem(index, iindex) } : undefined}
                                        onMoveUp={(props.onMoveItem && iindex > 0) ? () => { props.onMoveItem && props.onMoveItem(index, iindex, iindex - 1) } : undefined}
                                        onMoveDown={(props.onMoveItem && iindex < props.getItems(set).length - 1) ? () => { props.onMoveItem && props.onMoveItem(index, iindex, iindex + 1) } : undefined}
                                    />
                                </Box>
                            ))}
                        </Box>
                    </FoldArea>

                </Box >
            ))}
            {/* 在列表底部添加新规则集的按钮 */}
            {props.onInsertSet && <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Button
                    onClick={() => props.onInsertSet && props.onInsertSet(props.sets.length)}
                    variant="outlined"
                    startIcon={<AddIcon />}
                    size="large"
                >
                    添加新规则集
                </Button>
            </Box>}
        </Box >
    )
}

export default Panel;