import { useState, useEffect, useCallback, useRef } from 'react';
import { Box, Typography } from '@mui/material';
import { Message, FilterConfig, MessageField } from '../api/client';
import { FormateMessage, LabelRuleSet, RoleRuleSet } from '../api/rules';
import client from '../api/tauriClient';
import { LevelRuleSet } from '../api/rules';
import MessageCard from './MessageCard';
import SearchBar from './SearchBar';
import CmdMessageCard from './CmdMessageCard';

interface LogViewProps {
    project_location?: string
    level_rules_sets: LevelRuleSet[]
    role_rules_sets: RoleRuleSet[]
    label_rules_sets: LabelRuleSet[]
    show_search_bar: boolean
    mutiline?: boolean
    messageVersion?: number // Trigger refresh when messages change (e.g., deletions)
}

const LogView = (props: LogViewProps) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [currentPage, setCurrentPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [observer, setObserver] = useState<IntersectionObserver | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [searchConfig, setSearchConfig] = useState<FilterConfig>({});
    const [searchOrderBy, setSearchOrderBy] = useState<MessageField>(MessageField.time);
    const [searchDesc, setSearchDesc] = useState<boolean>(false);
    const pageSize = 20; // 每页加载数量

    // Refs for debouncing and message buffering
    const messageBufferRef = useRef<Message[]>([]);
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isMountedRef = useRef(true);

    // 加载更多消息的函数
    const loadMoreMessages = useCallback(async () => {
        if (loading || !hasMore) return;

        setLoading(true);
        try {
            const offset = currentPage * pageSize;
            let newMessages: Message[];

            if (isSearching) {
                newMessages = await client.filter_messages(searchConfig, searchOrderBy, pageSize, offset, searchDesc);
            } else {
                newMessages = await client.get_messages(pageSize, offset, searchDesc);
            }

            if (newMessages.length < pageSize) {
                setHasMore(false);
            }

            setMessages(prev => [...prev, ...newMessages]);
            setCurrentPage(prev => prev + 1);
        } catch (error) {
            console.error('加载更多消息失败:', error);
        } finally {
            setLoading(false);
        }
    }, [currentPage, hasMore, loading, pageSize, isSearching, searchConfig, searchOrderBy, searchDesc]);

    // 处理搜索
    const handleSearch = useCallback(async (config: FilterConfig, orderBy: MessageField, desc: boolean) => {
        setLoading(true);
        try {
            setSearchConfig(config);
            setSearchOrderBy(orderBy);
            setSearchDesc(desc);
            setIsSearching(true);
            setCurrentPage(0);

            const filteredMessages = await client.filter_messages(config, orderBy, pageSize, 0, desc);
            setMessages(filteredMessages);
            setHasMore(filteredMessages.length === pageSize);
            setCurrentPage(1);
        } catch (error) {
            console.error('搜索消息失败:', error);
        } finally {
            setLoading(false);
        }
    }, [pageSize]);

    // 处理重置搜索
    const handleResetSearch = useCallback(async () => {
        setLoading(true);
        try {
            setIsSearching(false);
            setSearchConfig({});
            setSearchOrderBy(MessageField.time);
            setSearchDesc(false);
            setCurrentPage(0);

            const initialMessages = await client.get_messages(pageSize, 0, false);
            setMessages(initialMessages);
            setHasMore(initialMessages.length === pageSize);
            setCurrentPage(1);
        } catch (error) {
            console.error('重置搜索失败:', error);
        } finally {
            setLoading(false);
        }
    }, [pageSize]);

    // 初始加载和设置观察器
    useEffect(() => {
        // 初始加载第一页
        const fetchInitialMessages = async () => {
            try {
                setLoading(true);
                const initialMessages = await client.get_messages(pageSize, 0, searchDesc);
                setMessages(initialMessages);
                setCurrentPage(1);
                setHasMore(initialMessages.length === pageSize);
            } catch (error) {
                console.error('获取初始消息失败:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchInitialMessages();
    }, [searchDesc]); // 依赖searchDesc以确保排序方向变化时重新加载

    // 处理消息版本变化（例如删除操作后刷新）
    useEffect(() => {
        if (props.messageVersion !== undefined && props.messageVersion > 0) {
            const refreshMessages = async () => {
                setLoading(true);
                try {
                    const refreshedMessages = await client.get_messages(pageSize, 0, searchDesc);
                    setMessages(refreshedMessages);
                    setCurrentPage(1);
                    setHasMore(refreshedMessages.length === pageSize);
                } catch (error) {
                    console.error('刷新消息失败:', error);
                } finally {
                    setLoading(false);
                }
            };
            refreshMessages();
        }
    }, [props.messageVersion, searchDesc, pageSize]);

    // 处理新消息接收（带防抖）
    useEffect(() => {
        const handleNewMessage = (msg: Message) => {
            // 如果在搜索模式下，忽略新消息
            if (isSearching) {
                return;
            }

            // 将消息添加到缓冲区
            messageBufferRef.current.push(msg);

            // 清除现有的防抖计时器
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
            if (messageBufferRef.current.length > 100) {
                setMessages(prev => [...messageBufferRef.current.reverse(), ...prev]);
                messageBufferRef.current = []; // 清空缓冲区
            }
            // 设置新的防抖计时器（100毫秒）
            debounceTimerRef.current = setTimeout(() => {
                if (messageBufferRef.current.length > 0 && isMountedRef.current) {
                    // 将缓冲区的消息添加到消息列表的前面
                    setMessages(prev => [...messageBufferRef.current.reverse(), ...prev]);
                    messageBufferRef.current = []; // 清空缓冲区
                }
            }, 100);
        };

        // 设置消息监听器
        client.onRecviveMesage(handleNewMessage);

        // 组件卸载时的清理
        return () => {
            isMountedRef.current = false;
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, [isSearching]); // 依赖isSearching以确保搜索模式变化时正确处理

    // 使用 useCallback 包装 loadMoreMessages 以避免重复创建
    const handleLoadMore = useCallback(() => {
        if (hasMore && !loading) {
            loadMoreMessages();
        }
    }, [hasMore, loading, loadMoreMessages]);

    // 设置 Intersection Observer 来检测滚动到底部
    useEffect(() => {
        const options = {
            root: null,
            rootMargin: '20px',
            threshold: 0.1,
        };

        const obs = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                handleLoadMore();
            }
        }, options);

        setObserver(obs);

        return () => {
            obs.disconnect();
        };
    }, [handleLoadMore]);

    // 设置观察目标
    const bottomRef = useCallback((node: HTMLDivElement | null) => {
        if (observer) {
            observer.disconnect();
            if (node) {
                observer.observe(node);
            }
        }
    }, [observer]);

    return (
        <Box >
            {props.show_search_bar && (
                <Box sx={{ position: 'sticky', top: 0, zIndex: 1000 }}>
                    <SearchBar
                        onSearch={handleSearch}
                        onReset={handleResetSearch}
                    />
                </Box>
            )}

            {props.mutiline ? messages.map((message) => (
                <MessageCard
                    level_rules_sets={props.level_rules_sets}
                    project_location={props.project_location}
                    role_rules_sets={props.role_rules_sets}
                    label_rules_sets={props.label_rules_sets}
                    key={message.id}
                    message={new FormateMessage(message)}
                />
            )) :
                messages.map((message) => (
                    <CmdMessageCard
                        level_rules_sets={props.level_rules_sets}
                        role_rules_sets={props.role_rules_sets}
                        label_rules_sets={props.label_rules_sets}
                        key={message.id}
                        message={new FormateMessage(message)}
                    />
                ))
            }

            {/* 底部观察元素 */}
            <div ref={bottomRef} style={{ height: '20px', display: hasMore ? 'block' : 'none' }} />

            {/* 加载状态显示 */}
            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', padding: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                        加载中...
                    </Typography>
                </Box>
            )}

            {/* 没有更多数据的提示 */}
            {!hasMore && messages.length > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', padding: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                        没有更多消息了
                    </Typography>
                </Box>
            )}
        </Box>
    )
}

export default LogView;
