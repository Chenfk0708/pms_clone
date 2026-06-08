import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { cleanTaskCreateEndpoint, cleanTaskExportEndpoint, cleanTaskListEndpoint, cleanTaskNotifyEndpoint, fetchCleanTaskDashboard, } from '../services/cleanTask';
import { StoreSelectControl } from '../components/StoreSelect';
import { useStoreOptions } from '../hooks/useStoreOptions';
import './CleanTaskPage.css';
const defaultFilters = {
    campId: '1796067693589061634',
    poiId: 'ALL',
    cleanDate: '2026-05-18',
    roomId: 'ALL',
    cleanType: 'ALL',
    status: 'ALL',
    cleanerId: 'ALL',
    page: 1,
    pageSize: 20,
};
export function CleanTaskPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const initialScenario = normalizeScenario(searchParams.get('scenario'));
    const [filters, setFilters] = useState({
        ...defaultFilters,
        campId: searchParams.get('campId') || defaultFilters.campId,
        scenario: initialScenario,
    });
    const [dashboard, setDashboard] = useState(null);
    const [openFilter, setOpenFilter] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]);
    const [selectedTask, setSelectedTask] = useState(null);
    const [createOpen, setCreateOpen] = useState(false);
    const [moreOpen, setMoreOpen] = useState(false);
    const [remark, setRemark] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [feedback, setFeedback] = useState('');
    const { storeOptions, storeLoading } = useStoreOptions({
        fallbackOptions: (dashboard?.stores ?? [{ id: 'ALL', label: '全部门店' }]).map((store) => ({
            id: store.id === 'ALL' ? 'all' : store.id,
            label: store.label,
        })),
    });
    useEffect(() => {
        void loadData(filters);
        // Initial route state should drive the first provider call only.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    const optionList = useMemo(() => {
        if (!dashboard)
            return [];
        if (openFilter === 'room')
            return dashboard.rooms;
        if (openFilter === 'type')
            return dashboard.cleanTypes.filter((item) => item.id !== 'ALL');
        if (openFilter === 'status')
            return dashboard.statuses.filter((item) => item.id !== 'ALL');
        if (openFilter === 'cleaner')
            return dashboard.cleaners;
        return [];
    }, [dashboard, openFilter]);
    const requestStatus = dashboard
        ? `${cleanTaskListEndpoint.replace('/api', '')} ${formatRequestParams(dashboard.requestBody)}`
        : `${cleanTaskListEndpoint.replace('/api', '')} 等待加载`;
    async function loadData(nextFilters, options = {}) {
        setLoading(true);
        setError('');
        setOpenFilter(null);
        try {
            const nextDashboard = await fetchCleanTaskDashboard(nextFilters);
            setDashboard(nextDashboard);
            setFilters(nextFilters);
            setSelectedIds([]);
            if (options.successMessage)
                setFeedback(options.successMessage);
        }
        catch (caught) {
            setError(caught instanceof Error ? caught.message : '保洁任务数据加载失败');
        }
        finally {
            setLoading(false);
        }
    }
    function updateFilter(patch) {
        setFilters((current) => ({ ...current, ...patch, page: 1, scenario: 'success' }));
    }
    function chooseFilter(option) {
        if (openFilter === 'room')
            updateFilter({ roomId: option.id });
        if (openFilter === 'type')
            updateFilter({ cleanType: option.id });
        if (openFilter === 'status')
            updateFilter({ status: option.id });
        if (openFilter === 'cleaner')
            updateFilter({ cleanerId: option.id });
        setOpenFilter(null);
    }
    function resetFilters() {
        const nextFilters = { ...defaultFilters, scenario: 'success' };
        void loadData(nextFilters, { successMessage: '筛选条件已重置' });
    }
    function moveDate(offset) {
        const nextDate = shiftDate(filters.cleanDate, offset);
        const nextFilters = { ...filters, cleanDate: nextDate, scenario: 'success' };
        void loadData(nextFilters, { successMessage: `已切换到 ${nextDate}` });
    }
    function toggleSelect(taskId, checked) {
        setSelectedIds((current) => (checked ? [...current, taskId] : current.filter((id) => id !== taskId)));
    }
    function handleBatchNotify() {
        setFeedback(`已通知 ${selectedIds.length} 个任务，通知接口 ${cleanTaskNotifyEndpoint.replace('/api', '')}`);
    }
    function handleExport() {
        setFeedback(`已创建导出任务，导出接口 ${cleanTaskExportEndpoint.replace('/api', '')}`);
    }
    function handleCreateConfirm() {
        setCreateOpen(false);
        setRemark('');
        setFeedback(`保洁任务已创建，创建接口 ${cleanTaskCreateEndpoint.replace('/api', '')}`);
    }
    function handleMoreRoute(path) {
        setMoreOpen(false);
        navigate(path);
    }
    return (_jsxs("div", { className: "clean-task-page", children: [_jsx("h1", { children: "\u4FDD\u6D01\u4EFB\u52A1" }), _jsxs("section", { className: "clean-task-toolbar", "aria-label": "\u4FDD\u6D01\u4EFB\u52A1\u7B5B\u9009", children: [_jsxs("div", { className: "clean-task-toolbar__top", children: [_jsx(StoreSelectControl, { className: "clean-store-tabs", label: "\u95E8\u5E97\u7B5B\u9009", options: storeOptions.map((store) => ({ id: store.id, name: store.label })), value: filters.poiId === 'ALL' ? 'all' : filters.poiId, disabled: storeLoading, onChange: (storeId, option) => {
                                    const nextFilters = { ...filters, poiId: storeId === 'all' ? 'ALL' : storeId, scenario: 'success' };
                                    void loadData(nextFilters, { successMessage: `已切换门店：${option.name}` });
                                } }), _jsxs("label", { className: "clean-date", children: [_jsx("span", { children: "\u4FDD\u6D01\u65E5\u671F\uFF1A" }), _jsx("button", { type: "button", "aria-label": "\u524D\u4E00\u5929", onClick: () => moveDate(-1), children: "\u2039" }), _jsx("input", { "aria-label": "\u4FDD\u6D01\u65E5\u671F", type: "date", value: filters.cleanDate, onChange: (event) => updateFilter({ cleanDate: event.target.value }) }), _jsx("button", { type: "button", "aria-label": "\u540E\u4E00\u5929", onClick: () => moveDate(1), children: "\u203A" })] }), _jsxs("div", { className: "clean-toolbar-actions", children: [_jsx("button", { type: "button", onClick: () => loadData({ ...filters, scenario: 'success' }, { successMessage: '数据已刷新' }), children: "\u5237\u65B0" }), _jsx("button", { type: "button", onClick: handleExport, children: "\u5BFC \u51FA" }), _jsxs("div", { className: "clean-more", children: [_jsx("button", { type: "button", "aria-expanded": moreOpen, onClick: () => setMoreOpen((open) => !open), children: "\u66F4\u591A" }), moreOpen ? (_jsxs("div", { className: "clean-more-menu", role: "menu", "aria-label": "\u66F4\u591A\u64CD\u4F5C", children: [_jsx("button", { type: "button", role: "menuitem", onClick: () => handleMoreRoute('/cleanManage/cleanStatistics'), children: "\u67E5\u770B\u4FDD\u6D01\u7EDF\u8BA1" }), _jsx("button", { type: "button", role: "menuitem", onClick: () => handleMoreRoute('/cleanManage/cleanLog'), children: "\u67E5\u770B\u4FDD\u6D01\u65E5\u5FD7" }), _jsx("button", { type: "button", role: "menuitem", onClick: () => handleMoreRoute('/cleanManage/cleanSetting'), children: "\u4FDD\u6D01\u89C4\u5219\u8BBE\u7F6E" })] })) : null] })] })] }), _jsxs("div", { className: "clean-task-toolbar__filters", children: [_jsxs("div", { className: "clean-filter-wrap", children: [_jsx(FilterButton, { label: "\u623F\u578B\u623F\u95F4", value: labelById(dashboard?.rooms, filters.roomId), placeholder: "\u8BF7\u9009\u62E9\u623F\u578B\u623F\u95F4", name: "room", openFilter: openFilter, setOpenFilter: setOpenFilter }), _jsx(FilterButton, { label: "\u4FDD\u6D01\u7C7B\u578B", value: labelById(dashboard?.cleanTypes, filters.cleanType, 'ALL'), placeholder: "\u8BF7\u9009\u62E9\u4FDD\u6D01\u7C7B\u578B", name: "type", openFilter: openFilter, setOpenFilter: setOpenFilter }), _jsx(FilterButton, { label: "\u4FDD\u6D01\u72B6\u6001", value: labelById(dashboard?.statuses, filters.status, 'ALL'), placeholder: "\u8BF7\u9009\u62E9\u4FDD\u6D01\u72B6\u6001", name: "status", openFilter: openFilter, setOpenFilter: setOpenFilter }), _jsx(FilterButton, { label: "\u4FDD\u6D01\u5458", value: labelById(dashboard?.cleaners, filters.cleanerId), placeholder: "\u8BF7\u9009\u62E9\u4FDD\u6D01\u5458", name: "cleaner", openFilter: openFilter, setOpenFilter: setOpenFilter }), openFilter ? (_jsx("div", { className: "clean-options", role: "listbox", "aria-label": `${filterTitle(openFilter)}筛选`, children: optionList.map((option) => (_jsx("button", { type: "button", role: "option", "aria-selected": isSelectedFilter(option.id, openFilter, filters), onClick: () => chooseFilter(option), children: option.label }, option.id))) })) : null] }), _jsxs("div", { className: "clean-actions", children: [_jsx("button", { type: "button", onClick: resetFilters, children: "\u91CD \u7F6E" }), _jsx("button", { type: "button", className: "is-primary", onClick: () => loadData({ ...filters, scenario: 'success' }), children: "\u67E5 \u8BE2" }), _jsx("button", { type: "button", disabled: selectedIds.length === 0, onClick: handleBatchNotify, children: "\u6279\u91CF\u901A\u77E5" }), _jsx("button", { type: "button", className: "is-primary", onClick: () => setCreateOpen(true), children: "\u521B\u5EFA\u4FDD\u6D01\u4EFB\u52A1" })] })] }), _jsxs("div", { className: "clean-task-statusline", children: [_jsx("span", { role: "status", "aria-label": "\u4FDD\u6D01\u4EFB\u52A1\u8BF7\u6C42\u72B6\u6001", children: requestStatus }), _jsx("span", { role: "status", "aria-label": "\u4FDD\u6D01\u4EFB\u52A1\u64CD\u4F5C\u53CD\u9988", children: feedback })] })] }), error ? (_jsxs("div", { className: "clean-task-alert", role: "alert", "aria-label": "\u4FDD\u6D01\u4EFB\u52A1\u6570\u636E\u9519\u8BEF", children: [_jsx("strong", { children: "\u6570\u636E\u52A0\u8F7D\u5931\u8D25" }), _jsx("span", { children: error }), _jsx("button", { type: "button", onClick: () => loadData({ ...filters, scenario: 'success' }), children: "\u91CD\u8BD5" })] })) : null, _jsx("section", { className: "clean-task-overview", "aria-label": "\u4FDD\u6D01\u4EFB\u52A1\u6982\u89C8", children: summaryCards(dashboard).map((card) => (_jsxs("button", { type: "button", className: `clean-metric clean-metric--${card.tone}`, onClick: () => setFeedback(`${card.label}已选中，可在任务列表继续查看`), children: [_jsx("span", { children: card.label }), _jsx("strong", { children: card.value }), _jsx("em", { children: card.detail })] }, card.label))) }), _jsxs("section", { className: "clean-task-content", children: [_jsxs("div", { className: "clean-chart", "aria-label": "\u4FDD\u6D01\u8FDB\u5EA6\u56FE\u8868", children: [_jsxs("div", { className: "clean-section-title", children: [_jsx("strong", { children: "\u4ECA\u65E5\u8FDB\u5EA6" }), _jsx("span", { children: dashboard ? `更新时间 ${dashboard.updatedAt.slice(11, 16)}` : '加载中' })] }), progressRows(dashboard).map((item) => (_jsxs("button", { type: "button", className: "clean-chart-row", onClick: () => setFeedback(`${item.label}任务已筛选`), children: [_jsx("span", { children: item.label }), _jsx("i", { children: _jsx("b", { style: { width: `${item.percent}%` } }) }), _jsx("em", { children: item.value })] }, item.label)))] }), _jsxs("div", { className: "clean-quick", "aria-label": "\u4FDD\u6D01\u5FEB\u6377\u5165\u53E3", children: [_jsx("div", { className: "clean-section-title", children: _jsx("strong", { children: "\u5FEB\u6377\u5904\u7406" }) }), _jsx("button", { type: "button", onClick: () => navigate('/houseManage/days'), children: "\u67E5\u770B\u65E5\u623F\u6001" }), _jsx("button", { type: "button", onClick: () => navigate('/order/house-order/list'), children: "\u67E5\u770B\u5173\u8054\u8BA2\u5355" }), _jsx("button", { type: "button", onClick: () => navigate('/cleanManage/cleanStaff'), children: "\u8C03\u6574\u4FDD\u6D01\u4EBA\u5458" })] })] }), _jsxs("section", { className: "clean-task-table", "aria-label": "\u4FDD\u6D01\u4EFB\u52A1\u5217\u8868", "aria-busy": loading, children: [_jsxs("div", { className: "clean-table-head", children: [_jsx("span", { children: "\u9009\u62E9" }), _jsx("span", { children: "\u4EFB\u52A1\u7F16\u53F7" }), _jsx("span", { children: "\u64CD\u4F5C" }), _jsx("span", { children: "\u623F\u578B\u623F\u95F4" }), _jsx("span", { children: "\u7C7B\u578B" }), _jsx("span", { children: "\u72B6\u6001" }), _jsx("span", { children: "\u4FDD\u6D01\u5458" }), _jsx("span", { children: "\u8BA1\u5212\u65F6\u95F4" })] }), loading ? _jsx("div", { className: "clean-table-state", children: "\u4FDD\u6D01\u4EFB\u52A1\u52A0\u8F7D\u4E2D..." }) : null, !loading && dashboard && dashboard.tasks.length === 0 ? _jsx("div", { className: "clean-table-state", children: "\u5F53\u524D\u7B5B\u9009\u6682\u65E0\u4FDD\u6D01\u4EFB\u52A1" }) : null, !loading && dashboard?.tasks.map((task) => (_jsxs("div", { className: "clean-table-row", children: [_jsx("label", { className: "clean-row-check", children: _jsx("input", { type: "checkbox", "aria-label": `选择 ${task.taskNo}`, checked: selectedIds.includes(task.id), onChange: (event) => toggleSelect(task.id, event.target.checked) }) }), _jsx("strong", { children: task.taskNo }), _jsx("button", { type: "button", "aria-label": `查看详情 ${task.taskNo}`, onClick: () => setSelectedTask(task), children: "\u67E5\u770B\u8BE6\u60C5" }), _jsx("span", { children: task.roomName }), _jsx("span", { children: task.cleanTypeLabel }), _jsx("span", { className: `clean-status clean-status--${task.status.toLowerCase()}`, children: task.statusLabel }), _jsx("span", { children: task.cleanerName }), _jsx("span", { children: task.planTime })] }, task.id))), dashboard ? (_jsxs("div", { className: "clean-pagination", children: ["\u7B2C ", dashboard.pagination.page, " \u9875\uFF0C\u5171 ", dashboard.pagination.total, " \u6761\uFF0C\u6BCF\u9875 ", dashboard.pagination.pageSize, " \u6761"] })) : null] }), selectedTask ? (_jsx("div", { className: "clean-dialog-backdrop", children: _jsxs("section", { className: "clean-dialog", role: "dialog", "aria-modal": "true", "aria-label": "\u4FDD\u6D01\u4EFB\u52A1\u8BE6\u60C5", children: [_jsxs("header", { children: [_jsx("strong", { children: "\u4FDD\u6D01\u4EFB\u52A1\u8BE6\u60C5" }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u8BE6\u60C5", onClick: () => setSelectedTask(null), children: "\u00D7" })] }), _jsxs("dl", { children: [_jsx("dt", { children: "\u4EFB\u52A1\u7F16\u53F7" }), _jsx("dd", { children: selectedTask.taskNo }), _jsx("dt", { children: "\u5173\u8054\u8BA2\u5355" }), _jsx("dd", { children: selectedTask.sourceOrderNo }), _jsx("dt", { children: "\u4F4F\u5BA2" }), _jsx("dd", { children: selectedTask.guestName }), _jsx("dt", { children: "\u4EFB\u52A1\u5907\u6CE8" }), _jsx("dd", { children: selectedTask.remark }), _jsx("dt", { children: "\u8FDB\u5EA6" }), _jsxs("dd", { children: [selectedTask.progress, "%"] })] })] }) })) : null, createOpen ? (_jsx("div", { className: "clean-dialog-backdrop", children: _jsxs("section", { className: "clean-dialog", role: "dialog", "aria-modal": "true", "aria-label": "\u521B\u5EFA\u4FDD\u6D01\u4EFB\u52A1", children: [_jsxs("header", { children: [_jsx("strong", { children: "\u521B\u5EFA\u4FDD\u6D01\u4EFB\u52A1" }), _jsx("button", { type: "button", "aria-label": "\u53D6\u6D88\u521B\u5EFA", onClick: () => setCreateOpen(false), children: "\u00D7" })] }), _jsxs("label", { className: "clean-form-row", children: [_jsx("span", { children: "\u4EFB\u52A1\u5907\u6CE8" }), _jsx("textarea", { value: remark, onChange: (event) => setRemark(event.target.value), "aria-label": "\u4EFB\u52A1\u5907\u6CE8" })] }), _jsxs("div", { className: "clean-dialog-actions", children: [_jsx("button", { type: "button", onClick: () => setCreateOpen(false), children: "\u53D6\u6D88" }), _jsx("button", { type: "button", className: "is-primary", onClick: handleCreateConfirm, children: "\u786E\u8BA4\u521B\u5EFA" })] })] }) })) : null] }));
}
function FilterButton({ label, value, placeholder, name, openFilter, setOpenFilter, }) {
    return (_jsxs("label", { className: "clean-filter", children: [_jsxs("span", { children: [label, "\uFF1A"] }), _jsx("button", { type: "button", "aria-label": value || placeholder, "aria-haspopup": "listbox", "aria-expanded": openFilter === name, onClick: () => setOpenFilter(openFilter === name ? null : name), children: value || placeholder })] }));
}
function summaryCards(dashboard) {
    const summary = dashboard?.summary;
    return [
        { label: '今日任务', value: summary?.total ?? 0, detail: '按当前筛选统计', tone: 'total' },
        { label: '待分配', value: summary?.pendingAssign ?? 0, detail: '等待安排人员', tone: 'assign' },
        { label: '待保洁', value: summary?.pendingClean ?? 0, detail: '需要尽快处理', tone: 'pending' },
        { label: '保洁中', value: summary?.cleaning ?? 0, detail: '现场处理中', tone: 'cleaning' },
        { label: '已完成', value: summary?.done ?? 0, detail: '房间可售', tone: 'done' },
    ];
}
function progressRows(dashboard) {
    const summary = dashboard?.summary;
    const total = Math.max(summary?.total ?? 0, 1);
    return [
        { label: '待保洁', value: summary?.pendingClean ?? 0, percent: ((summary?.pendingClean ?? 0) / total) * 100 },
        { label: '保洁中', value: summary?.cleaning ?? 0, percent: ((summary?.cleaning ?? 0) / total) * 100 },
        { label: '已完成', value: summary?.done ?? 0, percent: ((summary?.done ?? 0) / total) * 100 },
    ];
}
function labelById(options, id, emptyId = 'ALL') {
    if (id === emptyId)
        return '';
    return options?.find((option) => option.id === id)?.label ?? '';
}
function isSelectedFilter(id, openFilter, filters) {
    if (openFilter === 'room')
        return filters.roomId === id;
    if (openFilter === 'type')
        return filters.cleanType === id;
    if (openFilter === 'status')
        return filters.status === id;
    return filters.cleanerId === id;
}
function filterTitle(openFilter) {
    if (openFilter === 'room')
        return '房型房间';
    if (openFilter === 'type')
        return '保洁类型';
    if (openFilter === 'status')
        return '保洁状态';
    return '保洁员';
}
function formatRequestParams(requestBody) {
    const compact = {
        cleanTime: requestBody.cleanTime,
        cleanType: requestBody.cleanType || 'ALL',
        status: requestBody.cleanStatus || 'ALL',
        cleanerIds: Array.isArray(requestBody.cleanerIds) && requestBody.cleanerIds.length > 0 ? requestBody.cleanerIds.join(',') : 'ALL',
        pageSize: requestBody.pageSize,
    };
    return Object.entries(compact)
        .map(([key, value]) => `${key}=${value}`)
        .join(' ');
}
function shiftDate(date, offset) {
    const next = new Date(`${date}T00:00:00+08:00`);
    next.setDate(next.getDate() + offset);
    return next.toISOString().slice(0, 10);
}
function normalizeScenario(value) {
    if (value === 'empty' || value === 'error')
        return value;
    return 'success';
}
