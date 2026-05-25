import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createLedgerEntryExportTask, defaultLedgerEntryQuery, fetchLedgerEntryDashboard, LedgerEntryServiceError, } from '../services/ledgerEntry';
import './OrderLedgerPage.css';
import './LedgerEntryPage.css';
const presetRanges = [
    { key: 'yesterday', label: '昨天', start: '2026-05-18', end: '2026-05-18' },
    { key: 'today', label: '今天', start: '2026-05-19', end: '2026-05-19' },
    { key: 'lastWeek', label: '上周', start: '2026-05-12', end: '2026-05-18' },
    { key: 'thisWeek', label: '本周', start: '2026-05-19', end: '2026-05-25' },
    { key: 'lastMonth', label: '上月', start: '2026-04-01', end: '2026-04-30' },
    { key: 'thisMonth', label: '本月', start: '2026-05-01', end: '2026-05-31' },
];
export function LedgerEntryPage() {
    const navigate = useNavigate();
    const [query, setQuery] = useState(() => makeInitialQuery());
    const [dashboard, setDashboard] = useState(null);
    const [serviceError, setServiceError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [notice, setNotice] = useState('');
    const [openSelect, setOpenSelect] = useState(null);
    const [selectedRow, setSelectedRow] = useState(null);
    const [isDatePanelOpen, setIsDatePanelOpen] = useState(false);
    const [datePickTarget, setDatePickTarget] = useState('start');
    const [calendarMonth, setCalendarMonth] = useState(() => query.startDate.slice(0, 7));
    const [datePanelPosition, setDatePanelPosition] = useState({ top: 0, left: 0 });
    const [dateDraft, setDateDraft] = useState(() => ({ startDate: query.startDate, endDate: query.endDate }));
    const dateRangeRef = useRef(null);
    useEffect(() => {
        const controller = new AbortController();
        async function run() {
            setIsLoading(true);
            setServiceError(null);
            try {
                const nextDashboard = await fetchLedgerEntryDashboard(query, controller.signal);
                setDashboard(nextDashboard);
            }
            catch (error) {
                if (error instanceof DOMException && error.name === 'AbortError')
                    return;
                if (error instanceof LedgerEntryServiceError) {
                    setServiceError(error);
                    return;
                }
                throw error;
            }
            finally {
                if (!controller.signal.aborted)
                    setIsLoading(false);
            }
        }
        void run();
        return () => controller.abort();
    }, [query]);
    const diagnosticsProvider = dashboard?.provider ?? serviceError?.provider ?? 'mock';
    const diagnosticsState = dashboard?.state ?? serviceError?.state ?? query.state ?? 'success';
    const diagnosticsRequest = dashboard?.request ?? serviceError?.request ?? query;
    const activePreset = useMemo(() => findPresetRangeKey(query.startDate, query.endDate), [query.endDate, query.startDate]);
    const stores = dashboard?.stores ?? [{ id: query.storeId, name: query.storeName }];
    const allStore = stores[0];
    const roomCategoryName = dashboard?.roomCategories.find((item) => item.id === query.roomCategoryId)?.name ?? '请选择房型';
    const rows = dashboard?.rows ?? [];
    function patchQuery(next, nextNotice = '') {
        setOpenSelect(null);
        setNotice(nextNotice);
        setQuery((current) => ({
            ...current,
            ...next,
            page: next.page ?? 1,
        }));
    }
    function openDatePanel(target = 'start') {
        setOpenSelect(null);
        setDatePickTarget(target);
        setDateDraft({ startDate: query.startDate, endDate: query.endDate });
        setCalendarMonth(query.startDate.slice(0, 7));
        const rect = dateRangeRef.current?.getBoundingClientRect();
        if (rect) {
            setDatePanelPosition({
                top: rect.bottom + 8,
                left: Math.max(16, Math.min(rect.left, window.innerWidth - 624)),
            });
        }
        setIsDatePanelOpen(true);
    }
    function applyDateSelection(date) {
        if (datePickTarget === 'start') {
            const nextEndDate = date <= dateDraft.endDate ? dateDraft.endDate : date;
            setDateDraft({ startDate: date, endDate: nextEndDate });
            setDatePickTarget('end');
            return;
        }
        const nextStartDate = date < dateDraft.startDate ? date : dateDraft.startDate;
        const nextEndDate = date < dateDraft.startDate ? dateDraft.startDate : date;
        setDateDraft({ startDate: nextStartDate, endDate: nextEndDate });
        setIsDatePanelOpen(false);
        setDatePickTarget('start');
        patchQuery({ startDate: nextStartDate, endDate: nextEndDate }, '已更新账本日期');
    }
    function resetFilters() {
        setOpenSelect(null);
        setNotice('筛选条件已重置');
        setSelectedRow(null);
        setIsDatePanelOpen(false);
        setDatePickTarget('start');
        setQuery(defaultLedgerEntryQuery());
    }
    async function exportReport() {
        setIsLoading(true);
        try {
            await createLedgerEntryExportTask(query);
            setNotice('已生成记一笔明细导出任务');
        }
        finally {
            setIsLoading(false);
        }
    }
    function changePage(page) {
        patchQuery({ page }, `已切换到第 ${page} 页`);
    }
    return (_jsxs("div", { className: "ledger-entry-page", children: [_jsx("h1", { className: "sr-only-heading", children: "\u8BB0\u4E00\u7B14\u660E\u7EC6" }), _jsx("output", { id: "ledger-entry-diagnostics", hidden: true, "data-provider": diagnosticsProvider, "data-state": diagnosticsState, "data-request": JSON.stringify(diagnosticsRequest) }), _jsxs("section", { className: "order-ledger-filter", "aria-label": "\u8BB0\u4E00\u7B14\u660E\u7EC6\u7B5B\u9009", children: [_jsxs("div", { className: "order-ledger-filter__top", children: [_jsxs("div", { className: "order-ledger-store-row", "aria-label": "\u95E8\u5E97", children: [_jsx("button", { type: "button", className: query.storeId === allStore.id ? 'is-active' : '', "aria-pressed": query.storeId === allStore.id, onClick: () => patchQuery({ storeId: allStore.id, storeName: allStore.name }, `已切换到${allStore.name}`), children: "\u5168\u90E8\u95E8\u5E97" }), stores.slice(1).map((store) => {
                                        const selected = query.storeId === store.id;
                                        return (_jsx("button", { type: "button", className: selected ? 'is-active' : '', "aria-pressed": selected, onClick: () => patchQuery({ storeId: store.id, storeName: store.name }, `已切换到${store.name}`), children: store.name }, store.id));
                                    }), _jsx("button", { type: "button", className: "order-ledger-gear", "aria-label": "\u95E8\u5E97\u8BBE\u7F6E", onClick: () => navigate('/InformationMaintenance/campInfo'), children: "\u2699" })] }), _jsx("div", { className: "order-ledger-presets", role: "group", "aria-label": "\u65E5\u671F\u5FEB\u6377\u7B5B\u9009", children: presetRanges.map((preset) => (_jsx("button", { type: "button", className: activePreset === preset.key ? 'is-active' : '', onClick: () => patchQuery({ startDate: preset.start, endDate: preset.end }, `已切换到${preset.label}`), children: preset.label }, preset.key))) }), _jsxs("div", { ref: dateRangeRef, className: "order-ledger-date-range", "aria-label": "\u8D26\u672C\u65E5\u671F", role: "button", tabIndex: 0, onClick: () => openDatePanel('start'), onKeyDown: (event) => {
                                    if (event.key === 'Enter' || event.key === ' ') {
                                        event.preventDefault();
                                        openDatePanel('start');
                                    }
                                }, children: [_jsx("button", { type: "button", className: "order-ledger-date-field", "aria-label": "\u5F00\u59CB\u65E5\u671F", onClick: (event) => {
                                            event.stopPropagation();
                                            openDatePanel('start');
                                        }, children: query.startDate }), _jsx("span", { children: "\u81F3" }), _jsx("button", { type: "button", className: "order-ledger-date-field", "aria-label": "\u7ED3\u675F\u65E5\u671F", onClick: (event) => {
                                            event.stopPropagation();
                                            openDatePanel('end');
                                        }, children: query.endDate }), _jsx("i", { "aria-hidden": "true" })] }), _jsx(FilterSelect, { label: "\u7C7B\u578B", value: (dashboard?.typeOptions ?? [{ value: query.type, label: '全部类型' }]).find((item) => item.value === query.type)?.label ??
                                    '全部类型', kind: "type", openSelect: openSelect, optionLabel: "\u7C7B\u578B\u9009\u9879", options: (dashboard?.typeOptions ?? []).map((item) => ({ value: item.value, label: item.label })), onToggle: () => setOpenSelect(openSelect === 'type' ? null : 'type'), onSelect: (value) => patchQuery({ type: value }, '已更新类型筛选') })] }), _jsxs("div", { className: "order-ledger-filter__bottom ledger-entry-filter__bottom", children: [_jsx(FilterSelect, { label: "\u623F\u578B", value: roomCategoryName, kind: "roomType", openSelect: openSelect, optionLabel: "\u623F\u578B\u9009\u9879", options: (dashboard?.roomCategories ?? []).map((item) => ({ value: item.id, label: item.name })), onToggle: () => setOpenSelect(openSelect === 'roomType' ? null : 'roomType'), onSelect: (value) => patchQuery({ roomCategoryId: value }, '已更新房型筛选') }), _jsxs("div", { className: "order-ledger-actions", children: [_jsx("button", { type: "button", onClick: resetFilters, disabled: isLoading, children: "\u91CD\u7F6E" }), _jsx("button", { type: "button", className: "is-primary", onClick: exportReport, disabled: isLoading, children: "\u5BFC\u51FA" })] })] })] }), _jsx("div", { className: "sr-only-heading", role: "status", "aria-live": "polite", children: isLoading ? '账本数据加载中' : notice }), serviceError ? (_jsxs("section", { className: "ledger-entry-alert", role: "alert", children: [_jsx("strong", { children: serviceError.message }), _jsx("span", { children: "\u8BF7\u68C0\u67E5\u65E5\u671F\u8303\u56F4\u6216\u7A0D\u540E\u91CD\u8BD5\uFF0C\u5F53\u524D\u9519\u8BEF\u5DF2\u5728\u6570\u636E\u670D\u52A1\u5C42\u663E\u5F0F\u66B4\u9732\u3002" }), _jsx("button", { type: "button", onClick: () => patchQuery({}, '重新加载中'), children: "\u91CD\u65B0\u52A0\u8F7D" })] })) : null, _jsxs("section", { className: "ledger-entry-table-section", "aria-label": "\u8D26\u672C\u660E\u7EC6\u8868\u683C", children: [_jsxs("div", { className: "ledger-entry-section-header", children: [_jsx("h2", { children: "\u8D26\u672C\u660E\u7EC6" }), _jsxs("span", { children: ["\u66F4\u65B0\u65F6\u95F4\uFF1A", dashboard?.updatedAt ?? '2026-05-19T16:40:00+08:00'] })] }), _jsx("div", { className: "ledger-entry-table-scroll", children: _jsxs("table", { className: "ledger-entry-table", children: [_jsx("thead", { children: _jsx("tr", { children: ['类型', '项目', '金额', '支付方式', '时间', '关联房型/房间', '备注', '操作人', '操作'].map((heading) => (_jsx("th", { children: heading }, heading))) }) }), _jsx("tbody", { children: rows.length ? (rows.map((row) => (_jsxs("tr", { children: [_jsx("td", { children: row.typeLabel }), _jsxs("td", { children: [_jsx("strong", { children: row.project }), _jsx("small", { children: row.channelName })] }), _jsxs("td", { className: row.type === 'income' ? 'is-income' : 'is-expense', children: [row.type === 'income' ? '+' : '-', "\u00A5 ", formatMoney(row.amount)] }), _jsx("td", { children: row.paymentWay }), _jsx("td", { children: row.occurredAt }), _jsxs("td", { children: [_jsx("strong", { children: row.roomCategoryName }), _jsx("small", { children: row.roomName })] }), _jsx("td", { children: row.remark }), _jsx("td", { children: row.operatorName }), _jsx("td", { children: _jsx("button", { type: "button", className: "ledger-entry-detail-button", "aria-label": `查看明细 ${row.id}`, onClick: () => setSelectedRow(row), children: "\u8BE6\u60C5" }) })] }, row.id)))) : (_jsx("tr", { className: "ledger-entry-empty-row", children: _jsx("td", { colSpan: 9, children: _jsxs("div", { className: "ledger-entry-empty", children: [_jsx("span", { "aria-hidden": "true" }), _jsx("p", { children: "\u6682\u65E0\u6570\u636E" })] }) }) })) })] }) }), _jsxs("footer", { className: "ledger-entry-pagination", "aria-label": "\u5206\u9875", children: [_jsxs("span", { children: ["\u7B2C ", dashboard?.pagination.page ?? query.page, " \u9875 / \u5171 ", dashboard?.pagination.total ?? 0, " \u6761"] }), _jsx("button", { type: "button", onClick: () => changePage(Math.max(1, query.page - 1)), disabled: query.page <= 1 || isLoading, children: "\u4E0A\u4E00\u9875" }), _jsx("button", { type: "button", onClick: () => changePage(query.page + 1), disabled: !dashboard || query.page * query.pageSize >= dashboard.pagination.total || isLoading, children: "\u4E0B\u4E00\u9875" })] })] }), isDatePanelOpen ? (_jsx(DatePanel, { month: calendarMonth, startDate: dateDraft.startDate, endDate: dateDraft.endDate, pickTarget: datePickTarget, position: datePanelPosition, onClose: () => {
                    setIsDatePanelOpen(false);
                    setDatePickTarget('start');
                    setDateDraft({ startDate: query.startDate, endDate: query.endDate });
                }, onPrevious: () => setCalendarMonth((current) => shiftMonth(current, -1)), onNext: () => setCalendarMonth((current) => shiftMonth(current, 1)), onPick: applyDateSelection })) : null, selectedRow ? _jsx(RowDialog, { row: selectedRow, onClose: () => setSelectedRow(null) }) : null] }));
}
function makeInitialQuery() {
    const query = defaultLedgerEntryQuery();
    const params = new URLSearchParams(window.location.search);
    const mockState = params.get('mockState');
    if (mockState === 'empty' || mockState === 'error')
        query.state = mockState;
    return query;
}
function findPresetRangeKey(startDate, endDate) {
    const matched = presetRanges.find((item) => item.start === startDate && item.end === endDate);
    return matched?.key ?? 'custom';
}
function FilterSelect({ label, value, kind, openSelect, optionLabel, options, onToggle, onSelect, }) {
    return (_jsxs("div", { className: "order-ledger-select-field", children: [_jsxs("span", { className: "order-ledger-select-label", children: [label, ":"] }), _jsx("button", { type: "button", "aria-haspopup": "listbox", "aria-expanded": openSelect === kind, "aria-label": `${label} ${value}`, onClick: onToggle, children: _jsx("strong", { children: value }) }), openSelect === kind ? (_jsx("div", { className: "order-ledger-options", role: "listbox", "aria-label": optionLabel, children: options.map((option) => (_jsx("button", { type: "button", role: "option", "aria-selected": value === option.label, onClick: () => onSelect(option.value), children: option.label }, option.value))) })) : null] }));
}
function DatePanel({ month, startDate, endDate, pickTarget, position, onClose, onPrevious, onNext, onPick, }) {
    const months = [month, shiftMonth(month, 1)];
    return (_jsx("div", { className: "order-ledger-date-panel-wrap", role: "presentation", onMouseDown: onClose, children: _jsxs("section", { className: "order-ledger-date-panel", role: "dialog", "aria-label": "\u8BB0\u4E00\u7B14\u660E\u7EC6\u65E5\u671F\u9762\u677F", style: { top: `${position.top}px`, left: `${position.left}px` }, onMouseDown: (event) => event.stopPropagation(), children: [_jsxs("div", { className: "order-ledger-date-panel__header", children: [_jsx("strong", { children: pickTarget === 'start' ? '请选择开始日期' : '请选择结束日期' }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u8BB0\u4E00\u7B14\u660E\u7EC6\u65E5\u671F\u9762\u677F", onClick: onClose, children: "\u00D7" })] }), _jsxs("div", { className: "order-ledger-date-panel__range", children: [_jsx("span", { children: startDate }), _jsx("em", { children: "\u81F3" }), _jsx("span", { children: endDate })] }), _jsx("div", { className: "order-ledger-date-panel__months", children: months.map((item, index) => (_jsx(CalendarMonth, { month: item, startDate: startDate, endDate: endDate, onPrevious: index === 0 ? onPrevious : undefined, onNext: index === months.length - 1 ? onNext : undefined, onPick: onPick }, item))) })] }) }));
}
function CalendarMonth({ month, startDate, endDate, onPrevious, onNext, onPick, }) {
    const days = buildCalendarDays(month);
    return (_jsxs("section", { className: "order-ledger-calendar-month", "aria-label": formatMonthLabel(month), children: [_jsxs("header", { children: [_jsx("button", { type: "button", "aria-label": "\u4E0A\u4E2A\u6708", onClick: onPrevious, disabled: !onPrevious, children: "\u2039" }), _jsx("strong", { children: formatMonthLabel(month) }), _jsx("button", { type: "button", "aria-label": "\u4E0B\u4E2A\u6708", onClick: onNext, disabled: !onNext, children: "\u203A" })] }), _jsx("div", { className: "order-ledger-calendar-month__weekdays", children: ['一', '二', '三', '四', '五', '六', '日'].map((day) => (_jsx("span", { children: day }, day))) }), _jsx("div", { className: "order-ledger-calendar-month__days", children: days.map((day) => {
                    const inRange = day.date >= startDate && day.date <= endDate;
                    const isSelected = day.date === startDate || day.date === endDate;
                    return (_jsx("button", { type: "button", "aria-label": day.date, className: `${day.isMuted ? 'is-muted' : ''}${inRange ? ' is-in-range' : ''}${isSelected ? ' is-selected' : ''}`, onClick: () => onPick(day.date), children: day.label }, day.date));
                }) })] }));
}
function RowDialog({ row, onClose }) {
    return (_jsx("div", { className: "ledger-entry-dialog-layer", children: _jsxs("section", { className: "ledger-entry-dialog", role: "dialog", "aria-modal": "true", "aria-label": "\u8D26\u672C\u660E\u7EC6\u8BE6\u60C5", children: [_jsxs("header", { children: [_jsx("strong", { children: "\u8D26\u672C\u660E\u7EC6\u8BE6\u60C5" }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u8D26\u672C\u660E\u7EC6\u8BE6\u60C5", onClick: onClose, children: "\u00D7" })] }), _jsxs("dl", { children: [_jsxs("div", { children: [_jsx("dt", { children: "\u9879\u76EE" }), _jsx("dd", { children: row.project })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u6E20\u9053" }), _jsx("dd", { children: row.channelName })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u623F\u578B / \u623F\u95F4" }), _jsxs("dd", { children: [row.roomCategoryName, " / ", row.roomName] })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u652F\u4ED8\u65B9\u5F0F" }), _jsx("dd", { children: row.paymentWay })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u5907\u6CE8" }), _jsx("dd", { children: row.remark })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u64CD\u4F5C\u4EBA" }), _jsx("dd", { children: row.operatorName })] })] }), _jsx("footer", { children: _jsx(Link, { to: "/statistics/orderLedger", children: "\u67E5\u770B\u6536\u652F\u660E\u7EC6" }) })] }) }));
}
function shiftMonth(month, offset) {
    const [year, monthIndex] = month.split('-').map(Number);
    const nextDate = new Date(year, monthIndex - 1 + offset, 1);
    return `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
}
function formatMonthLabel(month) {
    const [year, monthValue] = month.split('-');
    return `${year}年${Number(monthValue)}月`;
}
function buildCalendarDays(month) {
    const [year, monthValue] = month.split('-').map(Number);
    const firstDay = new Date(year, monthValue - 1, 1);
    const startOffset = (firstDay.getDay() + 6) % 7;
    const gridStart = new Date(year, monthValue - 1, 1 - startOffset);
    return Array.from({ length: 42 }, (_, index) => {
        const date = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + index);
        return {
            date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
            label: String(date.getDate()),
            isMuted: date.getMonth() !== monthValue - 1,
        };
    });
}
function formatMoney(value) {
    return value.toFixed(2);
}
