import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { createCleanLogExportTask, fetchCleanLogs, getDefaultCleanLogFilterOptions, resolveCleanLogRuntimeConfig, } from '../services/cleanLog';
import { StoreSelectControl } from '../components/StoreSelect';
import { useStoreOptions } from '../hooks/useStoreOptions';
import './CleanLogPage.css';
const pageSize = 10;
export function CleanLogPage() {
    const runtime = useMemo(() => resolveCleanLogRuntimeConfig(window.location), []);
    const campId = useMemo(() => new URLSearchParams(window.location.search).get('campId') || '1796067693589061634', []);
    const defaultOptions = getDefaultCleanLogFilterOptions();
    const [roomDialogOpen, setRoomDialogOpen] = useState(false);
    const [operatorOpen, setOperatorOpen] = useState(false);
    const [selectedStoreId, setSelectedStoreId] = useState('');
    const [selectedRoomId, setSelectedRoomId] = useState('');
    const [selectedOperatorId, setSelectedOperatorId] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [refreshToken, setRefreshToken] = useState(0);
    const [message, setMessage] = useState('保洁日志已加载');
    const [error, setError] = useState('');
    const [result, setResult] = useState(null);
    const [selectedLog, setSelectedLog] = useState(null);
    const query = useMemo(() => ({
        provider: runtime.provider,
        mockState: runtime.mockState,
        campId,
        storeId: selectedStoreId,
        roomIds: selectedRoomId ? [selectedRoomId] : [],
        operatorId: selectedOperatorId,
        operatorStartTime: startDate ? new Date(`${startDate}T00:00:00+08:00`).getTime() : undefined,
        operatorEndTime: endDate ? new Date(`${endDate}T00:00:00+08:00`).getTime() : undefined,
        page: 1,
        pageSize,
    }), [campId, endDate, runtime.mockState, runtime.provider, selectedOperatorId, selectedRoomId, selectedStoreId, startDate]);
    useEffect(() => {
        const controller = new AbortController();
        fetchCleanLogs(query, controller.signal)
            .then((nextResult) => {
            setResult(nextResult);
            setError('');
        })
            .catch((caught) => {
            if (caught instanceof DOMException && caught.name === 'AbortError')
                return;
            setResult(null);
            setError(caught instanceof Error ? caught.message : '保洁日志加载失败，请重试');
        });
        return () => controller.abort();
    }, [query, refreshToken]);
    const options = result?.view.filterOptions ?? defaultOptions;
    const rows = result?.view.rows ?? [];
    const { storeOptions, storeLoading } = useStoreOptions({
        fallbackOptions: options.stores.map((store) => ({ id: store.value || 'all', label: store.label })),
    });
    const selectedRoom = options.rooms.find((room) => room.value === selectedRoomId);
    const selectedOperator = options.operators.find((operator) => operator.value === selectedOperatorId);
    function refresh(nextMessage = '已刷新') {
        setRefreshToken((current) => current + 1);
        setMessage(nextMessage);
    }
    function reset() {
        setSelectedStoreId('');
        setSelectedRoomId('');
        setSelectedOperatorId('');
        setStartDate('');
        setEndDate('');
        setRoomDialogOpen(false);
        setOperatorOpen(false);
        setSelectedLog(null);
        refresh('筛选条件已重置');
    }
    function exportLogs() {
        createCleanLogExportTask(query);
        setMessage('导出任务已创建');
    }
    return (_jsxs("div", { className: "clean-log-page", children: [_jsxs("section", { className: "clean-log-panel", children: [_jsxs("div", { className: "clean-log-query", "aria-label": "\u4FDD\u6D01\u65E5\u5FD7\u7B5B\u9009", children: [_jsx(StoreSelectControl, { className: "clean-log-store-row", label: "\u95E8\u5E97\u7B5B\u9009", options: storeOptions.map((store) => ({ id: store.id, name: store.label })), value: selectedStoreId || 'all', disabled: storeLoading, onChange: (storeId) => {
                                    setSelectedStoreId(storeId === 'all' ? '' : storeId);
                                    setMessage(storeId === 'all' ? '已切换到全部门店' : '已切换门店');
                                } }), _jsx("button", { type: "button", onClick: () => setRoomDialogOpen(true), children: selectedRoom ? selectedRoom.label : '请选择房间' }), _jsxs("label", { children: [_jsx("span", { children: "\u64CD\u4F5C\u65E5\u671F" }), _jsx("input", { "aria-label": "\u64CD\u4F5C\u65E5\u671F\u5F00\u59CB", placeholder: "\u5F00\u59CB\u65E5\u671F", value: startDate, onChange: (event) => setStartDate(event.target.value) }), _jsx("input", { "aria-label": "\u64CD\u4F5C\u65E5\u671F\u7ED3\u675F", placeholder: "\u7ED3\u675F\u65E5\u671F", value: endDate, onChange: (event) => setEndDate(event.target.value) })] }), _jsx("button", { type: "button", onClick: () => setOperatorOpen((open) => !open), children: selectedOperator?.label ?? '请选择操作人' }), _jsx("button", { type: "button", onClick: () => refresh('查询完成'), children: "\u67E5\u8BE2" }), _jsx("button", { type: "button", onClick: reset, children: "\u91CD\u7F6E" }), _jsx("button", { type: "button", onClick: () => refresh(), children: "\u5237\u65B0" }), _jsx("button", { type: "button", onClick: exportLogs, disabled: rows.length === 0, children: "\u5BFC\u51FA" })] }), operatorOpen ? (_jsx("div", { className: "clean-log-popover", role: "listbox", "aria-label": "\u64CD\u4F5C\u4EBA\u7B5B\u9009", children: options.operators.map((operator) => (_jsx("button", { type: "button", role: "option", "aria-selected": selectedOperatorId === operator.value, onClick: () => {
                                setSelectedOperatorId(operator.value);
                                setOperatorOpen(false);
                            }, children: operator.label }, `${operator.value}-${operator.label}`))) })) : null, error ? (_jsxs("div", { role: "alert", className: "clean-log-error", children: [error, _jsx("button", { type: "button", onClick: () => refresh(), children: "\u91CD\u8BD5" })] })) : null, _jsx("div", { role: "status", className: "clean-log-status", children: error ? '' : rows.length > 0 ? message : '暂无保洁日志' }), _jsxs("section", { "aria-label": "\u4FDD\u6D01\u65E5\u5FD7\u5217\u8868", className: "clean-log-table", children: [_jsx("div", { className: "clean-log-table__head", children: ['操作时间', '操作人', '操作类型', '操作内容', '操作'].map((column) => (_jsx("div", { children: column }, column))) }), rows.length === 0 ? _jsx("div", { className: "clean-log-empty", children: "\u6682\u65E0\u4FDD\u6D01\u65E5\u5FD7" }) : null, rows.map((row) => (_jsxs("div", { className: "clean-log-table__row", children: [_jsx("div", { children: row.operatorTime }), _jsx("div", { children: row.operatorName }), _jsx("div", { children: row.operatorType }), _jsx("div", { children: row.operatorDetails }), _jsx("div", { children: _jsx("button", { type: "button", className: "clean-log-link-button", onClick: () => setSelectedLog(row), "aria-label": `查看 ${row.id}`, children: "\u67E5\u770B" }) })] }, row.id)))] })] }), roomDialogOpen ? (_jsx("div", { className: "clean-log-modal-backdrop", children: _jsxs("section", { className: "clean-log-room-modal", role: "dialog", "aria-modal": "true", "aria-label": "\u9009\u62E9\u623F\u95F4", children: [_jsxs("header", { children: [_jsx("strong", { children: "\u9009\u62E9\u623F\u95F4" }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u9009\u62E9\u623F\u95F4", onClick: () => setRoomDialogOpen(false), children: "\u00D7" })] }), _jsxs("div", { className: "clean-log-room-filter", children: [_jsx("button", { type: "button", onClick: () => setMessage('房型标签已保持全部'), children: "\u8BF7\u9009\u62E9\u623F\u578B\u6807\u7B7E" }), _jsx("input", { placeholder: "\u8F93\u5165\u623F\u95F4/\u623F\u578B\u540D\u79F0", "aria-label": "\u623F\u95F4\u6216\u623F\u578B\u641C\u7D22" })] }), _jsx("div", { className: "clean-log-room-list", role: "listbox", "aria-label": "\u623F\u95F4\u5217\u8868", children: options.rooms.map((room) => (_jsxs("button", { type: "button", role: "option", "aria-selected": selectedRoomId === room.value, "aria-label": `${room.roomType} ${room.roomName}`, onClick: () => setSelectedRoomId(room.value), children: [_jsx("i", { "aria-hidden": "true" }), _jsx("span", { children: room.roomType }), _jsx("em", { children: room.roomName }), _jsx("b", { "aria-hidden": "true", children: "\u203A" })] }, room.value))) }), _jsxs("footer", { children: [_jsx("button", { type: "button", onClick: () => setRoomDialogOpen(false), children: "\u53D6\u6D88" }), _jsx("button", { type: "button", className: "is-primary", onClick: () => setRoomDialogOpen(false), children: "\u786E\u5B9A" })] })] }) })) : null, selectedLog ? (_jsxs("aside", { className: "clean-log-detail-drawer", role: "dialog", "aria-modal": "true", "aria-label": "\u4FDD\u6D01\u65E5\u5FD7\u8BE6\u60C5", children: [_jsxs("header", { children: [_jsx("strong", { children: "\u4FDD\u6D01\u65E5\u5FD7\u8BE6\u60C5" }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u8BE6\u60C5", onClick: () => setSelectedLog(null), children: "\u00D7" })] }), _jsxs("dl", { children: [_jsxs("div", { children: [_jsx("dt", { children: "\u65E5\u5FD7\u7F16\u53F7" }), _jsx("dd", { children: selectedLog.id })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u64CD\u4F5C\u65F6\u95F4" }), _jsx("dd", { children: selectedLog.operatorTime })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u64CD\u4F5C\u4EBA" }), _jsx("dd", { children: selectedLog.operatorName })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u64CD\u4F5C\u5185\u5BB9" }), _jsx("dd", { children: selectedLog.operatorDetails })] })] })] })) : null] }));
}
