import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useSyncExternalStore, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createCleanStatisticsExportTask, fetchCleanStatisticsDashboard, getCurrentMonthRange, getDefaultCleanStatisticsFilters, } from '../services/cleanStatistics';
import './CleanStatisticsPage.css';
const defaultFilters = getDefaultCleanStatisticsFilters();
const initialRange = { start: defaultFilters.startDate, end: defaultFilters.endDate };
function FieldMultiSelect({ label, placeholder, options, selected, open, onToggle, onSelect, }) {
    const selectedLabels = options.filter((option) => selected.includes(option.id)).map((option) => option.label);
    return (_jsxs("div", { className: "clean-stat-filter", children: [_jsxs("span", { children: [label, "\uFF1A"] }), _jsxs("div", { className: "clean-stat-select-wrap", children: [_jsxs("button", { type: "button", className: "clean-stat-select", onClick: onToggle, children: [label, " ", selectedLabels.length > 0 ? selectedLabels.join('、') : placeholder] }), open ? (_jsx("div", { className: "clean-stat-options", role: "listbox", "aria-label": `${label}筛选`, children: options.map((option) => (_jsxs("button", { type: "button", role: "option", "aria-selected": selected.includes(option.id), onClick: () => onSelect(option.id), children: [_jsx("span", { children: option.label }), selected.includes(option.id) ? _jsx("strong", { children: "\u2713" }) : null] }, option.id))) })) : null] })] }));
}
export function CleanStatisticsPage() {
    const navigate = useNavigate();
    const routeKey = useRouteSearchKey();
    const [tab, setTab] = useState('summary');
    const [storeId, setStoreId] = useState(defaultFilters.storeId ?? 'all');
    const [range, setRange] = useState(initialRange);
    const [rooms, setRooms] = useState([]);
    const [cleaners, setCleaners] = useState([]);
    const [openSelect, setOpenSelect] = useState(null);
    const [status, setStatus] = useState('');
    const [dashboard, setDashboard] = useState(null);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [dialog, setDialog] = useState(null);
    const [lastRequestBody, setLastRequestBody] = useState({});
    const [exportTask, setExportTask] = useState(null);
    const campId = useMemo(() => resolveCampId(), [routeKey]);
    const mockState = useMemo(() => resolveMockState(), [routeKey]);
    const summaryRows = dashboard?.statistics.rows ?? [];
    const detailRows = dashboard?.statistics.detailRows ?? [];
    const metrics = dashboard?.statistics.metrics ?? [];
    const todos = dashboard?.statistics.todos ?? [];
    const stores = dashboard?.stores ?? [{ id: 'all', label: '全部门店' }];
    const roomOptions = dashboard?.rooms ?? [];
    const cleanerOptions = dashboard?.cleaners ?? [];
    const buildFilters = useCallback((nextRange = range) => ({
        campId,
        startDate: nextRange.start,
        endDate: nextRange.end,
        pageNum: 1,
        pageSize: 20,
        storeId,
        roomIds: rooms,
        cleanerIds: cleaners,
        mockState,
    }), [campId, cleaners, mockState, range, rooms, storeId]);
    const loadStatistics = useCallback(async (nextRange = range, nextStatus = '保洁统计已刷新') => {
        setIsLoading(true);
        setError('');
        try {
            const nextDashboard = await fetchCleanStatisticsDashboard(buildFilters(nextRange));
            setDashboard(nextDashboard);
            setLastRequestBody(nextDashboard.statistics.requestBody);
            setStatus(nextStatus);
        }
        catch (nextError) {
            setDashboard(null);
            setLastRequestBody(buildFilters(nextRange));
            setError(nextError instanceof Error ? nextError.message : String(nextError));
        }
        finally {
            setIsLoading(false);
        }
    }, [buildFilters, range]);
    useEffect(() => {
        let cancelled = false;
        queueMicrotask(() => {
            if (!cancelled)
                void loadStatistics(range, '保洁统计已加载');
        });
        return () => {
            cancelled = true;
        };
        // 只用于首次进入和路由查询参数变化时加载；普通筛选变更由“查询/重置”显式触发，避免覆盖操作反馈。
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [campId, mockState]);
    function toggleOption(kind, optionId) {
        const updater = kind === 'room' ? setRooms : setCleaners;
        updater((current) => (current.includes(optionId) ? current.filter((item) => item !== optionId) : [...current, optionId]));
    }
    function resetFilters() {
        const nextRange = getCurrentMonthRange();
        setStoreId('all');
        setRange(nextRange);
        setRooms([]);
        setCleaners([]);
        setOpenSelect(null);
        void loadStatistics(nextRange, '已重置筛选并刷新统计');
    }
    async function exportStatistics() {
        const task = await createCleanStatisticsExportTask(buildFilters());
        setExportTask(task);
        setStatus(`导出任务已创建：${task.taskId}`);
    }
    return (_jsxs("div", { className: "clean-stat-page", "data-clean-request": JSON.stringify(lastRequestBody), "data-clean-export": exportTask ? JSON.stringify(exportTask) : '', children: [_jsx("div", { className: "clean-stat-title", children: "\u4FDD\u6D01\u7EDF\u8BA1" }), _jsxs("section", { className: "clean-stat-shell", children: [_jsxs("div", { className: "clean-stat-tabs", "aria-label": "\u4FDD\u6D01\u7EDF\u8BA1\u89C6\u56FE", children: [_jsx("button", { type: "button", className: tab === 'summary' ? 'is-active' : '', onClick: () => setTab('summary'), children: "\u7EDF\u8BA1\u6C47\u603B" }), _jsx("button", { type: "button", className: tab === 'detail' ? 'is-active' : '', onClick: () => setTab('detail'), children: "\u7EDF\u8BA1\u660E\u7EC6" }), _jsx("button", { type: "button", className: "clean-stat-help", "aria-label": "\u4FDD\u6D01\u7EDF\u8BA1\u8BF4\u660E", onClick: () => setDialog({ type: 'help' }), children: "?" })] }), _jsxs("section", { className: "clean-stat-toolbar", "aria-label": "\u4FDD\u6D01\u7EDF\u8BA1\u7B5B\u9009", children: [_jsxs("div", { className: "clean-stat-row", children: [_jsxs("div", { className: "clean-stat-store", role: "group", "aria-label": "\u95E8\u5E97\u7B5B\u9009", children: [stores.map((item) => (_jsx("button", { type: "button", className: storeId === item.id ? 'is-active' : '', onClick: () => {
                                                    setStoreId(item.id);
                                                    setStatus(`已切换门店：${item.label}`);
                                                }, children: item.id === 'qianhai' ? '天落会宿…' : item.label }, item.id))), _jsx("button", { type: "button", className: "clean-stat-gear", "aria-label": "\u95E8\u5E97\u8BBE\u7F6E", onClick: () => navigate('/cleanManage/cleanSetting'), children: "\u2699" })] }), _jsxs("label", { className: "clean-stat-date", children: [_jsx("span", { children: "\u65E5\u671F\uFF1A" }), _jsx("button", { type: "button", className: "clean-stat-month is-active", onClick: () => {
                                                    const nextRange = getCurrentMonthRange();
                                                    setRange(nextRange);
                                                    setStatus('已切换为本月');
                                                }, children: "\u672C \u6708" }), _jsx("button", { type: "button", className: "clean-stat-month", onClick: () => {
                                                    const nextRange = getPreviousMonthRange(range.start);
                                                    setRange(nextRange);
                                                    setStatus('已切换为上月');
                                                }, children: "\u4E0A \u6708" }), _jsx("input", { "aria-label": "\u5F00\u59CB\u65E5\u671F", value: range.start, onChange: (event) => setRange((current) => ({ ...current, start: event.target.value })) }), _jsx("span", { children: "\u81F3" }), _jsx("input", { "aria-label": "\u7ED3\u675F\u65E5\u671F", value: range.end, onChange: (event) => setRange((current) => ({ ...current, end: event.target.value })) })] }), _jsx("button", { type: "button", className: "clean-stat-export", disabled: isLoading, onClick: () => void exportStatistics(), children: "\u5BFC \u51FA" })] }), _jsxs("div", { className: "clean-stat-row clean-stat-row--second", children: [_jsx(FieldMultiSelect, { label: "\u623F\u578B\u623F\u95F4", placeholder: "\u8BF7\u9009\u62E9\u623F\u95F4", options: roomOptions.length > 0 ? roomOptions : [{ id: 'empty-room', label: '暂无房间数据' }], selected: rooms, open: openSelect === 'room', onToggle: () => setOpenSelect(openSelect === 'room' ? null : 'room'), onSelect: (option) => toggleOption('room', option) }), _jsx(FieldMultiSelect, { label: "\u4FDD\u6D01\u5458", placeholder: "\u8BF7\u9009\u62E9\u4FDD\u6D01\u5458", options: cleanerOptions.length > 0 ? cleanerOptions : [{ id: 'empty-cleaner', label: '暂无保洁员' }], selected: cleaners, open: openSelect === 'cleaner', onToggle: () => setOpenSelect(openSelect === 'cleaner' ? null : 'cleaner'), onSelect: (option) => toggleOption('cleaner', option) }), _jsxs("div", { className: "clean-stat-actions", children: [_jsx("button", { type: "button", disabled: isLoading, onClick: resetFilters, children: "\u91CD \u7F6E" }), _jsx("button", { type: "button", className: "is-primary", disabled: isLoading, onClick: () => void loadStatistics(range, '已按当前筛选更新'), children: "\u67E5 \u8BE2" })] })] })] }), error ? (_jsxs("div", { className: "clean-stat-alert clean-stat-alert--error", role: "alert", "aria-label": "\u4FDD\u6D01\u7EDF\u8BA1\u6570\u636E\u9519\u8BEF", children: [_jsx("span", { children: error }), _jsx("button", { type: "button", onClick: () => void loadStatistics(range, '保洁统计已重新加载'), children: "\u91CD\u8BD5" })] })) : null, _jsx("section", { className: "clean-stat-metrics", "aria-label": "\u4FDD\u6D01\u7EDF\u8BA1\u6838\u5FC3\u6307\u6807", children: metrics.map((metric) => (_jsxs("button", { type: "button", "aria-label": `查看指标 ${metric.label}`, onClick: () => setDialog({ type: 'metric', metric }), children: [_jsx("span", { children: metric.label }), _jsxs("strong", { children: [metric.value, _jsx("em", { children: metric.unit })] }), _jsx("small", { children: metric.trend })] }, metric.id))) }), tab === 'summary' ? (_jsxs("section", { className: "clean-stat-table", "aria-label": "\u4FDD\u6D01\u7EDF\u8BA1\u6C47\u603B\u8868", children: [_jsxs("div", { className: "clean-stat-table__head", children: [_jsx("div", { className: "is-date" }), _jsx("div", { children: "\u626B\u5C18\u4FDD\u6D01" }), _jsx("div", { children: "\u7EED\u4F4F\u4FDD\u6D01" }), _jsx("div", { children: "\u9000\u623F\u4FDD\u6D01" }), _jsx("div", { children: "\u6DF1\u5EA6\u4FDD\u6D01" }), _jsx("div", { children: "\u5408\u8BA1" })] }), _jsxs("div", { className: "clean-stat-table__subhead", children: [_jsx("div", { className: "is-date", children: "\u4FDD\u6D01\u65E5\u671F" }), ['数量', '费用', '数量', '费用', '数量', '费用', '数量', '费用', '数量', '费用'].map((item, index) => (_jsx("div", { children: item }, `${item}-${index}`)))] }), _jsxs("div", { className: "clean-stat-table__body", children: [isLoading ? _jsx("div", { className: "clean-stat-empty", children: "\u6B63\u5728\u52A0\u8F7D\u4FDD\u6D01\u7EDF\u8BA1..." }) : null, !isLoading && summaryRows.length === 0 ? _jsx("div", { className: "clean-stat-empty", children: "\u6682\u65E0\u4FDD\u6D01\u7EDF\u8BA1\u6570\u636E" }) : null, summaryRows.map((row) => (_jsxs("div", { className: "clean-stat-table__row", children: [_jsx("strong", { className: "is-date", children: row.date }), _jsx("span", { children: row.checkoutCount }), _jsx("span", { children: row.checkoutFee }), _jsx("span", { children: row.stayCount }), _jsx("span", { children: row.stayFee }), _jsx("span", { children: row.departureCount }), _jsx("span", { children: row.departureFee }), _jsx("span", { children: row.deepCount }), _jsx("span", { children: row.deepFee }), _jsx("span", { children: row.totalCount }), _jsx("span", { children: row.totalFee })] }, row.date)))] })] })) : (_jsxs("section", { className: "clean-detail-table", "aria-label": "\u4FDD\u6D01\u7EDF\u8BA1\u660E\u7EC6\u8868", children: [_jsx("div", { className: "clean-detail-table__head", children: ['任务编号', '保洁日期', '房型房间', '保洁员', '类型', '费用', '状态', '操作'].map((item) => (_jsx("div", { children: item }, item))) }), detailRows.length === 0 ? _jsx("div", { className: "clean-stat-empty", children: "\u6682\u65E0\u4FDD\u6D01\u7EDF\u8BA1\u6570\u636E" }) : null, detailRows.map((row) => (_jsxs("div", { className: "clean-detail-table__row", children: [_jsx("strong", { children: row.id }), _jsx("span", { children: row.cleanDate }), _jsx("span", { children: row.roomName }), _jsx("span", { children: row.cleanerName }), _jsx("span", { children: row.cleanType }), _jsx("span", { children: row.fee }), _jsx("span", { className: row.status === '已完成' ? 'is-done' : 'is-pending', children: row.status }), _jsxs("button", { type: "button", onClick: () => setDialog({ type: 'detail', detail: row }), children: ["\u67E5\u770B ", row.id] })] }, row.id)))] })), _jsxs("section", { className: "clean-stat-todos", "aria-label": "\u4FDD\u6D01\u7EDF\u8BA1\u5F85\u529E", children: [todos.length === 0 ? _jsx("div", { className: "clean-stat-empty", children: "\u6682\u65E0\u5F85\u529E\u4E8B\u9879" }) : null, todos.map((todo) => (_jsxs("button", { type: "button", onClick: () => {
                                    if (todo.id === 'today-checkout')
                                        navigate('/houseManage/days');
                                    else if (todo.id === 'staff-schedule')
                                        navigate('/cleanManage/cleanStaff');
                                    else
                                        setTab('detail');
                                }, children: [_jsx("span", { children: todo.title }), _jsx("strong", { children: todo.count }), _jsx("em", { children: todo.action })] }, todo.id)))] }), _jsxs("section", { className: "clean-stat-promo", children: [_jsxs("div", { children: [_jsx("h2", { children: "\u9650\u65F6\u949C\u60E0\uFF01\u667A\u80FD\u4FDD\u6D016\u6298\u5F00\u901A" }), _jsx("p", { children: "\u81EA\u52A8\u6D3E\u5355 \uFF5C \u5B9E\u65F6\u63D0\u9192 \uFF5C \u62A5\u8868\u6E05\u6670" })] }), _jsx("button", { type: "button", onClick: () => navigate('/version/applicationPayment/detail'), children: "\u8BA2\u9605\u5F00\u901A" })] })] }), status ? (_jsx("div", { role: "status", "aria-label": "\u4FDD\u6D01\u7EDF\u8BA1\u64CD\u4F5C\u53CD\u9988", className: "clean-stat-status", children: status })) : null, dialog ? _jsx(CleanStatisticsDialog, { dialog: dialog, onClose: () => setDialog(null) }) : null] }));
}
function CleanStatisticsDialog({ dialog, onClose }) {
    if (!dialog)
        return null;
    if (dialog.type === 'help') {
        return (_jsx("div", { className: "clean-stat-modal-backdrop", children: _jsxs("section", { className: "clean-stat-modal", role: "dialog", "aria-label": "\u4FDD\u6D01\u7EDF\u8BA1\u8BF4\u660E", children: [_jsxs("header", { children: [_jsx("h2", { children: "\u4FDD\u6D01\u7EDF\u8BA1\u8BF4\u660E" }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u8BF4\u660E", onClick: onClose, children: "\u00D7" })] }), _jsx("p", { children: "\u7EDF\u8BA1\u53E3\u5F84\u6309\u4FDD\u6D01\u65E5\u671F\u3001\u4FDD\u6D01\u7C7B\u578B\u3001\u8D39\u7528\u548C\u9A8C\u6536\u72B6\u6001\u6C47\u603B\uFF0C\u7B5B\u9009\u540E\u540C\u6B65\u5237\u65B0\u6C47\u603B\u4E0E\u660E\u7EC6\u3002" })] }) }));
    }
    if (dialog.type === 'metric') {
        return (_jsx("div", { className: "clean-stat-modal-backdrop", children: _jsxs("section", { className: "clean-stat-modal", role: "dialog", "aria-label": "\u6307\u6807\u8BE6\u60C5", children: [_jsxs("header", { children: [_jsx("h2", { children: "\u6307\u6807\u8BE6\u60C5" }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u8BE6\u60C5", onClick: onClose, children: "\u00D7" })] }), _jsx("strong", { children: dialog.metric.label }), _jsx("p", { children: dialog.metric.description }), _jsxs("p", { children: ["\u5F53\u524D\u503C\uFF1A", dialog.metric.value, dialog.metric.unit, "\uFF0C", dialog.metric.trend] })] }) }));
    }
    return (_jsx("div", { className: "clean-stat-modal-backdrop", children: _jsxs("section", { className: "clean-stat-modal", role: "dialog", "aria-label": "\u4FDD\u6D01\u660E\u7EC6", children: [_jsxs("header", { children: [_jsx("h2", { children: "\u4FDD\u6D01\u660E\u7EC6" }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u660E\u7EC6", onClick: onClose, children: "\u00D7" })] }), _jsxs("p", { children: [dialog.detail.id, "\uFF1A", dialog.detail.roomName, "\uFF0C", dialog.detail.cleanerName, "\uFF0C", dialog.detail.cleanType, "\uFF0C", dialog.detail.status] })] }) }));
}
function resolveCampId() {
    return readRouteParam('campId') || window.localStorage.getItem('pmsCampId') || import.meta.env.VITE_PMS_CAMP_ID || defaultFilters.campId;
}
function resolveMockState() {
    const state = readRouteParam('cleanMockState');
    return state === 'empty' || state === 'error' ? state : 'success';
}
function readRouteParam(key) {
    const searchValue = new URLSearchParams(window.location.search).get(key);
    if (searchValue)
        return searchValue;
    const hashQuery = window.location.hash.split('?')[1] ?? '';
    return new URLSearchParams(hashQuery).get(key);
}
function useRouteSearchKey() {
    return useSyncExternalStore((notify) => {
        window.addEventListener('hashchange', notify);
        window.addEventListener('popstate', notify);
        return () => {
            window.removeEventListener('hashchange', notify);
            window.removeEventListener('popstate', notify);
        };
    }, () => `${window.location.search}|${window.location.hash}`);
}
function getPreviousMonthRange(currentStart) {
    const date = new Date(`${currentStart}T00:00:00+08:00`);
    date.setMonth(date.getMonth() - 1);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const lastDay = new Date(year, date.getMonth() + 1, 0).getDate();
    return {
        start: `${year}-${month}-01`,
        end: `${year}-${month}-${String(lastDay).padStart(2, '0')}`,
    };
}
