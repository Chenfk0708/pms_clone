import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { createDefaultPsbLogQuery, fetchPsbLogPageData, psbLogBizTypeOptions, psbLogStateOptions, resolvePsbLogRuntimeConfig, retryPsbLogReport, } from '../services/psbLog';
import { StoreSelectControl } from '../components/StoreSelect';
import { useStoreOptions } from '../hooks/useStoreOptions';
import './PsbLogPage.css';
const tableColumns = [
    '姓名',
    '手机号',
    '证件号码',
    '房间号',
    '订单来源',
    '订单号',
    '路客云订单号',
    '上报时间',
    '上报类型',
    '上报状态',
    '备注',
];
const calendarWeekdays = ['一', '二', '三', '四', '五', '六', '日'];
export function PsbLogPage() {
    const location = useLocation();
    const runtime = useMemo(() => resolvePsbLogRuntimeConfig(window.location), [location.pathname, location.search, location.hash]);
    const defaults = useMemo(() => createDefaultPsbLogQuery(window.location), [location.pathname, location.search, location.hash]);
    const [openPanel, setOpenPanel] = useState(null);
    const [draftFilters, setDraftFilters] = useState({
        storeId: '',
        keyword: '',
        bizType: '',
        state: '',
        startDate: '',
        endDate: '',
    });
    const [appliedFilters, setAppliedFilters] = useState({
        storeId: '',
        keyword: '',
        bizType: '',
        state: '',
        startDate: '',
        endDate: '',
    });
    const [reloadToken, setReloadToken] = useState(0);
    const [statusMessage, setStatusMessage] = useState('正在加载上报日志');
    const [error, setError] = useState('');
    const [result, setResult] = useState(null);
    const [selectedLog, setSelectedLog] = useState(null);
    const [retryingLogId, setRetryingLogId] = useState('');
    const query = useMemo(() => ({
        provider: runtime.provider,
        mockState: runtime.mockState,
        campId: defaults.campId,
        page: defaults.page,
        pageSize: defaults.pageSize,
        ...appliedFilters,
    }), [appliedFilters, defaults.campId, defaults.page, defaults.pageSize, runtime.mockState, runtime.provider]);
    useEffect(() => {
        function closePanelsOnEscape(event) {
            if (event.key === 'Escape')
                setOpenPanel(null);
        }
        window.addEventListener('keydown', closePanelsOnEscape);
        return () => window.removeEventListener('keydown', closePanelsOnEscape);
    }, []);
    useEffect(() => {
        const controller = new AbortController();
        let ignore = false;
        setError('');
        setSelectedLog(null);
        fetchPsbLogPageData(query, controller.signal)
            .then((nextResult) => {
            if (ignore)
                return;
            setResult(nextResult);
            setStatusMessage(nextResult.view.rows.length > 0
                ? appliedFiltersChanged(appliedFilters)
                    ? '已按筛选条件刷新上报日志'
                    : `已加载 ${nextResult.view.rows.length} 条上报日志`
                : '暂无上报日志');
        })
            .catch((caught) => {
            if (ignore)
                return;
            if (caught instanceof DOMException && caught.name === 'AbortError')
                return;
            setResult(null);
            setError(caught instanceof Error ? caught.message : '上报日志加载失败，请稍后重试');
        });
        return () => {
            ignore = true;
            controller.abort();
        };
    }, [appliedFilters, query, reloadToken]);
    const fallbackStores = result?.view.stores ?? [
        { label: '全部门店', value: '' },
        { label: '当前门店', value: '1796425098638573570' },
    ];
    const { storeOptions, storeLoading } = useStoreOptions({
        fallbackOptions: fallbackStores.map((store) => ({ id: store.value || 'all', label: store.label })),
    });
    const rows = result?.view.rows ?? [];
    const provider = result?.diagnostics.provider ?? runtime.provider ?? 'mock';
    const viewState = error
        ? 'error'
        : result
            ? rows.length > 0
                ? 'success'
                : 'empty'
            : 'loading';
    const selectedBizType = readSelectedOption(psbLogBizTypeOptions, draftFilters.bizType);
    const selectedState = readSelectedOption(psbLogStateOptions, draftFilters.state);
    const dateLabel = buildDateLabel(draftFilters.startDate, draftFilters.endDate);
    function applyQuery() {
        setOpenPanel(null);
        setAppliedFilters({ ...draftFilters });
    }
    function reset() {
        const nextFilters = {
            storeId: '',
            keyword: '',
            bizType: '',
            state: '',
            startDate: '',
            endDate: '',
        };
        setOpenPanel(null);
        setDraftFilters(nextFilters);
        setAppliedFilters(nextFilters);
        setStatusMessage('筛选条件已重置');
    }
    function refresh() {
        setReloadToken((current) => current + 1);
    }
    async function handleRetrySelectedLog() {
        if (!selectedLog)
            return;
        setRetryingLogId(selectedLog.id);
        setError('');
        try {
            const nextLog = await retryPsbLogReport(selectedLog, {
                campId: defaults.campId,
                provider: query.provider,
                mockState: runtime.mockState,
            });
            setSelectedLog(nextLog);
            setResult((current) => current
                ? {
                    ...current,
                    view: {
                        ...current.view,
                        rows: current.view.rows.map((row) => (row.id === nextLog.id ? nextLog : row)),
                    },
                }
                : current);
            setStatusMessage(`订单 ${nextLog.orderNo} 已重新上报`);
        }
        catch (caught) {
            setError(caught instanceof Error ? caught.message : '重新上报失败，请稍后重试');
        }
        finally {
            setRetryingLogId('');
        }
    }
    return (_jsxs("div", { className: "psb-log-page", "data-provider": provider, "data-view-state": viewState, children: [_jsx("h1", { className: "psb-log-title", children: "\u4E0A\u62A5\u65E5\u5FD7" }), _jsxs("section", { className: "psb-log-panel", "aria-label": "\u4E0A\u62A5\u65E5\u5FD7", children: [_jsx(StoreSelectControl, { className: "psb-log-store-row", label: "\u95E8\u5E97\u8303\u56F4", options: storeOptions.map((store) => ({ id: store.id, name: store.label })), value: draftFilters.storeId || 'all', disabled: storeLoading, onChange: (storeId) => setDraftFilters((current) => ({ ...current, storeId: storeId === 'all' ? '' : storeId })), settingsLabel: "\u95E8\u5E97\u8BBE\u7F6E", onSettingsClick: () => setStatusMessage('请在门店信息页面维护公安上报关联门店') }), _jsxs("div", { className: "psb-log-toolbar", children: [_jsxs("label", { className: "psb-log-field psb-log-field--keyword", children: [_jsx("span", { children: "\u641C\u7D22\uFF1A" }), _jsx("input", { "aria-label": "\u641C\u7D22", value: draftFilters.keyword, onChange: (event) => setDraftFilters((current) => ({ ...current, keyword: event.target.value })), placeholder: "\u8BF7\u8F93\u5165\u8BA2\u5355\u53F7/\u624B\u673A\u53F7/\u623F\u53F7" })] }), _jsxs("div", { className: "psb-log-field psb-log-field--date", children: [_jsx("span", { children: "\u4E0A\u62A5\u65F6\u95F4\uFF1A" }), _jsxs("button", { type: "button", className: `psb-log-control-button${openPanel === 'date' ? ' is-open' : ''}`, "aria-label": `上报时间 ${dateLabel}`, onClick: () => setOpenPanel((current) => (current === 'date' ? null : 'date')), children: [_jsx("span", { children: dateLabel }), _jsx("i", { "aria-hidden": "true" })] }), openPanel === 'date' ? (_jsx(DatePanel, { startDate: draftFilters.startDate, endDate: draftFilters.endDate, onChange: (field, value) => setDraftFilters((current) => ({ ...current, [field]: value })) })) : null] }), _jsx(SelectPanel, { label: "\u4E0A\u62A5\u7C7B\u578B\uFF1A", selected: selectedBizType, options: psbLogBizTypeOptions, open: openPanel === 'bizType', onToggle: () => setOpenPanel((current) => (current === 'bizType' ? null : 'bizType')), onSelect: (value) => {
                                    setDraftFilters((current) => ({ ...current, bizType: value }));
                                    setOpenPanel(null);
                                } }), _jsx(SelectPanel, { label: "\u4E0A\u62A5\u72B6\u6001\uFF1A", selected: selectedState, options: psbLogStateOptions, open: openPanel === 'state', onToggle: () => setOpenPanel((current) => (current === 'state' ? null : 'state')), onSelect: (value) => {
                                    setDraftFilters((current) => ({ ...current, state: value }));
                                    setOpenPanel(null);
                                } }), _jsxs("div", { className: "psb-log-actions", children: [_jsx("button", { type: "button", className: "psb-log-button is-primary", onClick: applyQuery, disabled: viewState === 'loading', children: "\u67E5 \u8BE2" }), _jsx("button", { type: "button", className: "psb-log-button is-ghost", onClick: reset, disabled: viewState === 'loading', children: "\u91CD \u7F6E" })] })] }), error ? (_jsxs("div", { role: "alert", className: "psb-log-alert", children: [_jsx("span", { children: error }), _jsx("button", { type: "button", className: "psb-log-inline-button", onClick: refresh, children: "\u91CD\u8BD5" })] })) : null, _jsx("div", { role: "status", className: "psb-log-status", children: error ? '' : statusMessage }), _jsxs("section", { className: "psb-log-table", "aria-label": "\u4E0A\u62A5\u65E5\u5FD7\u5217\u8868", children: [_jsx("div", { className: "psb-log-table__head", role: "row", children: tableColumns.map((column) => (_jsx("div", { role: "columnheader", children: column }, column))) }), viewState === 'loading' ? (_jsx("div", { className: "psb-log-table__feedback", children: "\u6B63\u5728\u52A0\u8F7D\u4E0A\u62A5\u65E5\u5FD7..." })) : null, viewState === 'empty' ? (_jsxs("div", { className: "psb-log-table__feedback psb-log-table__feedback--empty", children: [_jsx("div", { className: "psb-log-empty-icon", "aria-hidden": "true", children: _jsx("span", {}) }), _jsx("p", { children: "\u6682\u65E0\u6570\u636E" })] })) : null, rows.map((row) => (_jsxs("div", { className: "psb-log-table__row", role: "row", children: [_jsx("div", { role: "cell", children: row.guestName }), _jsx("div", { role: "cell", children: row.phone }), _jsx("div", { role: "cell", children: row.idCard }), _jsx("div", { role: "cell", children: row.roomNo }), _jsx("div", { role: "cell", children: row.orderSource }), _jsx("div", { role: "cell", children: _jsx("button", { type: "button", className: "psb-log-link-button", "aria-label": `查看订单 ${row.orderNo}`, onClick: () => setSelectedLog(row), children: row.orderNo }) }), _jsx("div", { role: "cell", children: row.channelOrderNo }), _jsx("div", { role: "cell", children: row.reportTime }), _jsx("div", { role: "cell", children: row.bizTypeLabel }), _jsx("div", { role: "cell", children: row.stateLabel }), _jsx("div", { role: "cell", children: row.remark })] }, row.id)))] })] }), selectedLog ? (_jsxs("aside", { className: "psb-log-drawer", role: "dialog", "aria-modal": "true", "aria-label": "\u4E0A\u62A5\u8BE6\u60C5", children: [_jsxs("header", { children: [_jsxs("div", { children: [_jsx("strong", { children: "\u4E0A\u62A5\u8BE6\u60C5" }), _jsx("span", { children: selectedLog.orderNo })] }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u8BE6\u60C5", onClick: () => setSelectedLog(null), children: "\u00D7" })] }), _jsxs("dl", { children: [_jsxs("div", { children: [_jsx("dt", { children: "\u59D3\u540D" }), _jsx("dd", { children: selectedLog.guestName })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u624B\u673A\u53F7" }), _jsx("dd", { children: selectedLog.phone })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u4E0A\u62A5\u7C7B\u578B" }), _jsx("dd", { children: selectedLog.bizTypeLabel })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u4E0A\u62A5\u72B6\u6001" }), _jsx("dd", { children: selectedLog.stateLabel })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u4E0A\u62A5\u65F6\u95F4" }), _jsx("dd", { children: selectedLog.reportTime })] }), _jsxs("div", { className: "is-full", children: [_jsx("dt", { children: "\u516C\u5B89\u56DE\u6267" }), _jsx("dd", { children: selectedLog.receiptMessage })] })] }), _jsxs("footer", { children: [selectedLog.stateCode === '0' ? (_jsx("button", { type: "button", className: "psb-log-button is-primary", onClick: handleRetrySelectedLog, disabled: retryingLogId === selectedLog.id, children: retryingLogId === selectedLog.id ? '重新上报中...' : '重新上报' })) : null, _jsx("button", { type: "button", className: "psb-log-button is-ghost", onClick: () => setSelectedLog(null), children: "\u5173\u95ED" })] })] })) : null] }));
}
function SelectPanel({ label, selected, options, open, onToggle, onSelect, }) {
    return (_jsxs("div", { className: "psb-log-field psb-log-field--select", children: [_jsx("span", { children: label }), _jsxs("button", { type: "button", className: `psb-log-control-button${open ? ' is-open' : ''}`, "aria-label": `${label} ${selected?.label ?? '请选择'}`, onClick: onToggle, children: [_jsx("span", { children: selected?.label ?? '请选择' }), _jsx("i", { "aria-hidden": "true" })] }), open ? (_jsx("div", { className: "psb-log-dropdown", role: "listbox", "aria-label": label, children: options.map((option) => (_jsx("button", { type: "button", role: "option", "aria-selected": selected?.value === option.value, onClick: () => onSelect(option.value), children: option.label }, option.value))) })) : null] }));
}
function DatePanel({ startDate, endDate, onChange, }) {
    const selectedDate = endDate || startDate || '2026-05-23';
    const baseDate = new Date(`${selectedDate}T00:00:00`);
    const leftMonth = createCalendarMonth(baseDate.getFullYear(), baseDate.getMonth());
    const rightDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 1);
    const rightMonth = createCalendarMonth(rightDate.getFullYear(), rightDate.getMonth());
    function selectDate(value) {
        onChange('startDate', value);
        onChange('endDate', value);
    }
    return (_jsxs("div", { className: "psb-log-calendar", role: "dialog", "aria-label": "\u4E0A\u62A5\u65F6\u95F4", children: [_jsx(CalendarMonthPanel, { month: leftMonth, selectedValue: selectedDate, onSelect: selectDate }), _jsx(CalendarMonthPanel, { month: rightMonth, selectedValue: selectedDate, onSelect: selectDate })] }));
}
function CalendarMonthPanel({ month, selectedValue, onSelect, }) {
    return (_jsxs("section", { className: "psb-log-calendar-month", children: [_jsxs("header", { children: [_jsx("button", { type: "button", "aria-label": "\u4E0A\u4E00\u6708", children: "\u2039\u2039" }), _jsx("button", { type: "button", "aria-label": "\u4E0A\u4E2A\u6708", children: "\u2039" }), _jsxs("strong", { children: [month.year, "\u5E74 ", month.month + 1, "\u6708"] }), _jsx("button", { type: "button", "aria-label": "\u4E0B\u4E2A\u6708", children: "\u203A" }), _jsx("button", { type: "button", "aria-label": "\u4E0B\u4E00\u6708", children: "\u203A\u203A" })] }), _jsx("div", { className: "psb-log-calendar-weekdays", children: calendarWeekdays.map((weekday) => (_jsx("span", { children: weekday }, weekday))) }), _jsx("div", { className: "psb-log-calendar-grid", children: month.days.map((day) => (_jsx("button", { type: "button", className: [
                        'psb-log-calendar-day',
                        day.isCurrentMonth ? '' : 'is-muted',
                        day.value === selectedValue ? 'is-selected' : '',
                    ]
                        .filter(Boolean)
                        .join(' '), onClick: () => selectDateIfCurrent(day, onSelect), children: day.label }, day.key))) })] }));
}
function selectDateIfCurrent(day, onSelect) {
    if (!day.isCurrentMonth)
        return;
    onSelect(day.value);
}
function createCalendarMonth(year, month) {
    const firstDay = new Date(year, month, 1);
    const startWeekday = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();
    const days = [];
    for (let index = 0; index < 42; index += 1) {
        const dayNumber = index - startWeekday + 1;
        if (dayNumber <= 0) {
            const label = prevMonthDays + dayNumber;
            const prevDate = new Date(year, month - 1, label);
            days.push({
                key: `prev-${label}-${index}`,
                label,
                value: formatDate(prevDate),
                isCurrentMonth: false,
            });
            continue;
        }
        if (dayNumber > daysInMonth) {
            const nextLabel = dayNumber - daysInMonth;
            const nextDate = new Date(year, month + 1, nextLabel);
            days.push({
                key: `next-${nextLabel}-${index}`,
                label: nextLabel,
                value: formatDate(nextDate),
                isCurrentMonth: false,
            });
            continue;
        }
        days.push({
            key: `current-${dayNumber}`,
            label: dayNumber,
            value: formatDate(new Date(year, month, dayNumber)),
            isCurrentMonth: true,
        });
    }
    return { year, month, days };
}
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
function readSelectedOption(options, value) {
    return options.find((option) => option.value === value) ?? null;
}
function buildDateLabel(startDate, endDate) {
    if (!startDate && !endDate)
        return '请选择';
    if (startDate && endDate && startDate === endDate)
        return startDate;
    if (startDate && endDate)
        return `${startDate} - ${endDate}`;
    return startDate || endDate;
}
function appliedFiltersChanged(filters) {
    return Boolean(filters.storeId ||
        filters.keyword ||
        filters.bizType ||
        filters.state ||
        filters.startDate ||
        filters.endDate);
}
