import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createDefaultIncomeReportQuery, createIncomeReportExportTask, fetchIncomeReportDashboard, } from '../services/incomeReport';
import { StoreSelectControl } from '../components/StoreSelect';
import { useStoreOptions } from '../hooks/useStoreOptions';
import './IncomeReportPage.css';
export function IncomeReportPage() {
    const navigate = useNavigate();
    const [query, setQuery] = useState(createInitialQuery);
    const [draft, setDraft] = useState(createInitialQuery);
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [expanded, setExpanded] = useState(true);
    const [descriptionOpen, setDescriptionOpen] = useState(false);
    const [detailRow, setDetailRow] = useState(null);
    const [openSelect, setOpenSelect] = useState(null);
    const [isDatePanelOpen, setIsDatePanelOpen] = useState(false);
    const [datePickTarget, setDatePickTarget] = useState('start');
    const [calendarMonth, setCalendarMonth] = useState(() => draft.startDate.slice(0, 7));
    const [datePanelPosition, setDatePanelPosition] = useState({ top: 0, left: 0 });
    const [expandedColumns, setExpandedColumns] = useState([]);
    const dateRangeRef = useRef(null);
    useEffect(() => {
        const abort = new AbortController();
        fetchIncomeReportDashboard(query, abort.signal)
            .then((nextDashboard) => {
            setDashboard(nextDashboard);
            setError('');
        })
            .catch((reason) => {
            if (reason instanceof DOMException && reason.name === 'AbortError')
                return;
            setError(reason instanceof Error ? reason.message : '收入报表加载失败');
        })
            .finally(() => setLoading(false));
        return () => abort.abort();
    }, [query]);
    const contractText = useMemo(() => JSON.stringify({
        provider: dashboard?.provider ?? 'mock',
        state: dashboard?.state ?? query.state,
        endpoint: dashboard?.endpoint ?? '/report/accommodation/get',
        requestBody: dashboard?.requestBody ?? null,
        pagination: dashboard?.pagination ?? null,
        traceId: dashboard?.traceId ?? null,
    }), [dashboard, query.state]);
    const dimensions = dashboard?.dimensions ?? [];
    const stores = dashboard?.stores ?? [];
    const { storeOptions, storeLoading } = useStoreOptions({
        fallbackOptions: stores.map((item) => ({ id: item.id, label: item.label })),
    });
    const roomTypes = dashboard?.roomTypes ?? [];
    const channels = dashboard?.channels ?? [];
    const roomGroups = dashboard?.roomGroups ?? [];
    const rows = dashboard?.rows ?? [];
    const isChannelDimension = query.dimension === 'channel';
    const isEmpty = !loading && !error && rows.length === 0;
    function patchDraft(next) {
        setDraft((current) => ({ ...current, ...next }));
    }
    function switchDimension(dimension) {
        const next = { ...draft, dimension, pageNum: 1 };
        setDraft(next);
        setLoading(true);
        setError('');
        setNotice('');
        setOpenSelect(null);
        setQuery(next);
    }
    function submitQuery() {
        setLoading(true);
        setError('');
        setNotice('');
        setOpenSelect(null);
        setQuery({ ...draft, pageNum: 1 });
        setNotice('收入报表已刷新');
    }
    function openDatePanel(target = 'start') {
        setOpenSelect(null);
        setDatePickTarget(target);
        setCalendarMonth(draft.startDate.slice(0, 7));
        const rect = dateRangeRef.current?.getBoundingClientRect();
        if (rect) {
            setDatePanelPosition({
                top: rect.bottom + 8,
                left: Math.max(16, Math.min(rect.left, window.innerWidth - 600)),
            });
        }
        setIsDatePanelOpen(true);
    }
    function applyDateSelection(date) {
        if (datePickTarget === 'start') {
            const nextEndDate = date <= draft.endDate ? draft.endDate : date;
            patchDraft({ startDate: date, endDate: nextEndDate });
            setDatePickTarget('end');
            return;
        }
        const nextStartDate = date < draft.startDate ? date : draft.startDate;
        const nextEndDate = date < draft.startDate ? draft.startDate : date;
        patchDraft({ startDate: nextStartDate, endDate: nextEndDate });
        setDatePickTarget('start');
        setIsDatePanelOpen(false);
    }
    function toggleExpandedColumn(column) {
        setExpandedColumns((current) => current.includes(column) ? current.filter((item) => item !== column) : [...current, column]);
    }
    function resetFilters() {
        const next = createDefaultIncomeReportQuery();
        next.state = query.state;
        setDraft(next);
        setLoading(true);
        setError('');
        setNotice('已恢复默认筛选');
        setOpenSelect(null);
        setQuery(next);
    }
    async function handleExport() {
        const result = await createIncomeReportExportTask(query);
        setNotice(`收入报表导出任务已创建：${result.data.taskId}`);
    }
    function handleRetry() {
        setLoading(true);
        setError('');
        setNotice('');
        setQuery(createInitialQuery());
        setDraft(createInitialQuery());
    }
    return (_jsxs("div", { className: "income-report-page", "data-provider": dashboard?.provider ?? 'mock', "data-state": dashboard?.state ?? query.state ?? 'success', children: [_jsx("h1", { className: "sr-only-heading", children: "\u6536\u5165\u62A5\u8868" }), _jsx("pre", { hidden: true, "data-testid": "income-report-contract", "data-provider": dashboard?.provider ?? 'mock', "data-endpoint": dashboard?.endpoint ?? '/report/accommodation/get', children: contractText }), _jsxs("section", { className: "income-report-query", "aria-label": "\u6536\u5165\u62A5\u8868\u7B5B\u9009", children: [_jsx("div", { className: "income-report-mode", role: "group", "aria-label": "\u7EDF\u8BA1\u7EF4\u5EA6", children: dimensions.map((item) => (_jsx("button", { type: "button", className: query.dimension === item.value ? 'is-active' : '', "aria-pressed": query.dimension === item.value, onClick: () => switchDimension(item.value), children: item.label }, item.value))) }), _jsxs("div", { className: "income-report-form", children: [_jsx(StoreSelectControl, { className: "income-report-store-row", label: "\u95E8\u5E97", options: storeOptions.map((item) => ({ id: item.id, name: item.label })), value: draft.storeId, disabled: storeLoading, onChange: (storeId, option) => patchDraft({ storeId, storeName: option.name }) }), expanded ? (_jsxs("div", { className: "income-report-filter-row", children: [_jsxs("label", { className: "income-date-field", children: [_jsx("span", { children: "\u5F00\u59CB\u65E5\u671F" }), _jsxs("div", { ref: dateRangeRef, className: "income-date-range", role: "button", tabIndex: 0, "aria-label": "\u6536\u5165\u62A5\u8868\u65E5\u671F\u8303\u56F4", onClick: () => openDatePanel('start'), onKeyDown: (event) => {
                                                    if (event.key === 'Enter' || event.key === ' ') {
                                                        event.preventDefault();
                                                        openDatePanel('start');
                                                    }
                                                }, children: [_jsx("input", { "aria-label": "\u5F00\u59CB\u65E5\u671F", value: draft.startDate, readOnly: true, onClick: (event) => {
                                                            event.stopPropagation();
                                                            openDatePanel('start');
                                                        } }), _jsx("span", { children: "\u81F3" }), _jsx("input", { "aria-label": "\u7ED3\u675F\u65E5\u671F", value: draft.endDate, readOnly: true, onClick: (event) => {
                                                            event.stopPropagation();
                                                            openDatePanel('end');
                                                        } }), _jsx("i", { "aria-hidden": "true" })] })] }), _jsx(SelectField, { label: "\u623F\u578B", selectedId: draft.roomTypeId, selectedLabel: draft.roomTypeName, options: roomTypes, open: openSelect === 'roomType', onToggle: () => setOpenSelect(openSelect === 'roomType' ? null : 'roomType'), onSelect: (option) => {
                                            patchDraft({ roomTypeId: option.id, roomTypeName: option.id ? option.label : '' });
                                            setOpenSelect(null);
                                        } }), _jsx(SelectField, { label: "\u6E20\u9053", selectedId: draft.channelId, selectedLabel: draft.channelName, options: channels, open: openSelect === 'channel', onToggle: () => setOpenSelect(openSelect === 'channel' ? null : 'channel'), onSelect: (option) => {
                                            patchDraft({ channelId: option.id, channelName: option.id ? option.label : '' });
                                            setOpenSelect(null);
                                        } }), _jsx(SelectField, { label: "\u623F\u578B\u5206\u7EC4", selectedId: draft.roomGroupId, selectedLabel: draft.roomGroupName, options: roomGroups, open: openSelect === 'roomGroup', onToggle: () => setOpenSelect(openSelect === 'roomGroup' ? null : 'roomGroup'), onSelect: (option) => {
                                            patchDraft({ roomGroupId: option.id, roomGroupName: option.id ? option.label : '' });
                                            setOpenSelect(null);
                                        } })] })) : null] }), _jsxs("div", { className: "income-report-actions", children: [_jsx("button", { type: "button", onClick: resetFilters, disabled: loading, children: "\u91CD \u7F6E" }), _jsx("button", { type: "button", className: "is-primary", onClick: submitQuery, disabled: loading, children: "\u67E5 \u8BE2" }), _jsx("button", { type: "button", onClick: handleExport, disabled: loading || Boolean(error), children: "\u5BFC\u51FA" }), _jsx("button", { type: "button", onClick: () => {
                                    setDescriptionOpen(true);
                                    setOpenSelect(null);
                                }, children: "\u8BF4\u660E" }), _jsx("button", { type: "button", className: "is-link", onClick: () => setExpanded((current) => !current), children: expanded ? '收起' : '展开' })] })] }), isDatePanelOpen ? (_jsx(DatePanel, { month: calendarMonth, startDate: draft.startDate, endDate: draft.endDate, pickTarget: datePickTarget, position: datePanelPosition, onClose: () => {
                    setIsDatePanelOpen(false);
                    setDatePickTarget('start');
                }, onPrevious: () => setCalendarMonth((current) => shiftMonth(current, -1)), onNext: () => setCalendarMonth((current) => shiftMonth(current, 1)), onPick: applyDateSelection })) : null, _jsx("div", { className: "income-report-notice sr-only-heading", role: "status", "aria-label": "\u6536\u5165\u62A5\u8868\u64CD\u4F5C\u53CD\u9988", children: notice }), error ? (_jsxs("section", { className: "income-report-error", role: "alert", "aria-label": "\u6536\u5165\u62A5\u8868\u6570\u636E\u9519\u8BEF", children: [_jsx("strong", { children: "\u6536\u5165\u62A5\u8868\u52A0\u8F7D\u5931\u8D25" }), _jsx("p", { children: error }), _jsx("button", { type: "button", onClick: handleRetry, children: "\u91CD\u65B0\u52A0\u8F7D" })] })) : null, isEmpty ? (_jsxs("section", { className: "income-report-empty", role: "status", "aria-label": "\u6536\u5165\u62A5\u8868\u7A7A\u6001", children: [_jsx("strong", { children: "\u5F53\u524D\u7B5B\u9009\u6761\u4EF6\u6682\u65E0\u6536\u5165\u6570\u636E" }), _jsx("p", { children: "\u8BF7\u5207\u6362\u7EDF\u8BA1\u7EF4\u5EA6\u3001\u65E5\u671F\u8303\u56F4\u6216\u95E8\u5E97\u540E\u91CD\u65B0\u67E5\u8BE2\u3002" })] })) : null, _jsxs("section", { className: `income-report-table-wrap${loading ? ' is-loading' : ''}`, "aria-label": "\u6536\u5165\u62A5\u8868\u8868\u683C", children: [loading ? _jsx("div", { className: "income-report-loading", children: "\u6B63\u5728\u52A0\u8F7D\u6536\u5165\u62A5\u8868\u6570\u636E" }) : null, _jsxs("table", { className: `income-report-table${isChannelDimension ? ' income-report-table--channel' : ''}`, children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: firstColumnLabel(query.dimension) }), _jsx("th", { children: "\u623F\u8D39(\u51CF\u4F63)" }), isChannelDimension ? _jsx("th", { children: "\u5360\u6BD4" }) : null, _jsx("th", { children: "\u4F63\u91D1" }), isChannelDimension ? _jsx("th", { children: "\u5360\u6BD4" }) : null, _jsx(ExpandableHeader, { label: "\u623F\u8D39(\u542B\u4F63)", expanded: expandedColumns.includes('roomFeeIncludingCommission'), onClick: () => toggleExpandedColumn('roomFeeIncludingCommission') }), expandedColumns.includes('roomFeeIncludingCommission') ? (_jsxs(_Fragment, { children: [_jsx("th", { className: "is-expanded-group", children: "\u5168\u65E5\u623F\u8D39(\u542B\u4F63)" }), _jsx("th", { className: "is-expanded-group", children: "\u949F\u70B9\u623F\u8D39(\u542B\u4F63)" })] })) : null, _jsx(ExpandableHeader, { label: "\u5176\u4ED6\u6D88\u8D39", expanded: expandedColumns.includes('otherExpense'), onClick: () => toggleExpandedColumn('otherExpense') }), expandedColumns.includes('otherExpense') ? (_jsxs(_Fragment, { children: [_jsx("th", { className: "is-expanded-group", children: "\u5176\u4ED6\u6D88\u8D39(\u4F4F\u5BBF)" }), _jsx("th", { className: "is-expanded-group", children: "\u5176\u4ED6\u6D88\u8D39(\u9910\u996E)" }), _jsx("th", { className: "is-expanded-group", children: "\u5176\u4ED6\u6D88\u8D39(\u5546\u8D85)" }), _jsx("th", { className: "is-expanded-group", children: "\u5176\u4ED6\u6D88\u8D39(\u5A31\u4E50)" }), _jsx("th", { className: "is-expanded-group", children: "\u5176\u4ED6\u6D88\u8D39(\u573A\u5730)" })] })) : null, _jsx("th", { children: "\u8BA2\u5355\u603B\u6536\u5165" }), _jsx(ExpandableHeader, { label: "\u8BB0\u4E00\u7B14\u6536\u5165", expanded: expandedColumns.includes('manualIncome'), onClick: () => toggleExpandedColumn('manualIncome') }), expandedColumns.includes('manualIncome') ? (_jsxs(_Fragment, { children: [_jsx("th", { className: "is-expanded-group", children: "\u8BB0\u4E00\u7B14\u6536\u5165(\u4F4F\u5BBF)" }), _jsx("th", { className: "is-expanded-group", children: "\u8BB0\u4E00\u7B14\u6536\u5165(\u9910\u996E)" }), _jsx("th", { className: "is-expanded-group", children: "\u8BB0\u4E00\u7B14\u6536\u5165(\u5546\u8D85)" }), _jsx("th", { className: "is-expanded-group", children: "\u8BB0\u4E00\u7B14\u6536\u5165(\u5A31\u4E50)" }), _jsx("th", { className: "is-expanded-group", children: "\u8BB0\u4E00\u7B14\u6536\u5165(\u573A\u5730)" })] })) : null, _jsx("th", { children: "\u603B\u8425\u6536(\u542B\u4F63)" }), _jsx("th", { children: "\u603B\u8425\u6536(\u51CF\u4F63)" }), _jsx("th", { children: "\u64CD\u4F5C" })] }) }), _jsx("tbody", { children: rows.length > 0 ? (rows.map((row) => (_jsxs("tr", { className: row.label === '合计' ? 'is-summary' : '', children: [_jsx("td", { children: row.label }), _jsx("td", { children: row.roomFeeMinusCommission }), isChannelDimension ? _jsx("td", { children: row.roomFeeMinusCommissionRatio ?? '-' }) : null, _jsx("td", { children: row.channelCommission }), isChannelDimension ? _jsx("td", { children: row.channelCommissionRatio ?? '-' }) : null, _jsx("td", { children: row.roomFeeIncludingCommission }), expandedColumns.includes('roomFeeIncludingCommission') ? (_jsxs(_Fragment, { children: [_jsx("td", { children: row.allDayRoomFeeIncludingCommission }), _jsx("td", { children: row.hourRoomFeeIncludingCommission })] })) : null, _jsx("td", { children: row.otherExpense }), expandedColumns.includes('otherExpense') ? (_jsxs(_Fragment, { children: [_jsx("td", { children: row.accommodationExpense }), _jsx("td", { children: row.cateringExpense }), _jsx("td", { children: row.supermarketExpense }), _jsx("td", { children: row.entertainmentExpense }), _jsx("td", { children: row.venueExpense })] })) : null, _jsx("td", { children: row.orderTotalIncome }), _jsx("td", { children: row.manualIncome }), expandedColumns.includes('manualIncome') ? (_jsxs(_Fragment, { children: [_jsx("td", { children: row.manualAccommodationIncome }), _jsx("td", { children: row.manualCateringIncome }), _jsx("td", { children: row.manualSupermarketIncome }), _jsx("td", { children: row.manualEntertainmentIncome }), _jsx("td", { children: row.manualVenueIncome })] })) : null, _jsx("td", { children: row.businessIncomeIncludingCommission }), _jsx("td", { children: row.businessIncomeMinusCommission }), _jsx("td", { children: _jsx("button", { type: "button", className: "income-detail-link", onClick: () => setDetailRow(row), children: "\u4E0B\u8F7D\u8BA2\u5355\u660E\u7EC6" }) })] }, row.key)))) : (_jsx("tr", { children: _jsx("td", { className: "income-report-empty-cell", colSpan: isChannelDimension ? 12 : 10, children: "\u6682\u65E0\u6570\u636E" }) })) })] })] }), dashboard ? (_jsxs("nav", { className: "income-report-pagination", "aria-label": "\u5206\u9875", children: [_jsx("span", { children: paginationText(dashboard.pagination.page, dashboard.pagination.pageSize, dashboard.pagination.total) }), _jsx("button", { type: "button", disabled: true, children: "\u2039" }), _jsx("button", { type: "button", className: "is-current", children: dashboard.pagination.page }), _jsx("button", { type: "button", disabled: true, children: "\u203A" }), _jsxs("button", { type: "button", children: [dashboard.pagination.pageSize, " \u6761/\u9875"] })] })) : null, descriptionOpen ? (_jsx("div", { className: "income-modal-backdrop", role: "presentation", onClick: () => setDescriptionOpen(false), children: _jsxs("section", { className: "income-dialog", role: "dialog", "aria-modal": "true", "aria-label": "\u62A5\u8868\u5B57\u6BB5\u8BF4\u660E", onClick: (event) => event.stopPropagation(), children: [_jsxs("header", { children: [_jsx("h2", { children: "\u62A5\u8868\u5B57\u6BB5\u8BF4\u660E" }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u62A5\u8868\u5B57\u6BB5\u8BF4\u660E", onClick: () => setDescriptionOpen(false), children: "\u00D7" })] }), _jsx("div", { className: "income-description-list", children: (dashboard?.descriptions ?? []).map((item) => (_jsxs("div", { className: "income-description-row", children: [_jsx("strong", { children: item.field }), _jsx("span", { children: item.detail })] }, item.field))) })] }) })) : null, detailRow ? (_jsx("div", { className: "income-modal-backdrop", role: "presentation", onClick: () => setDetailRow(null), children: _jsxs("section", { className: "income-dialog income-dialog--detail", role: "dialog", "aria-modal": "true", "aria-label": "\u8BA2\u5355\u660E\u7EC6\u4E0B\u8F7D\u4EFB\u52A1", onClick: (event) => event.stopPropagation(), children: [_jsxs("header", { children: [_jsx("h2", { children: "\u8BA2\u5355\u660E\u7EC6\u4E0B\u8F7D\u4EFB\u52A1" }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u8BA2\u5355\u660E\u7EC6\u4E0B\u8F7D\u4EFB\u52A1", onClick: () => setDetailRow(null), children: "\u00D7" })] }), _jsxs("div", { className: "income-detail-body", children: [_jsx("p", { children: "\u5DF2\u4E3A\u5F53\u524D\u884C\u751F\u6210\u4E0B\u8F7D\u4EFB\u52A1\uFF0C\u4EE5\u4E0B\u4E3A\u4EFB\u52A1\u6458\u8981\uFF1A" }), _jsxs("dl", { children: [_jsxs("div", { children: [_jsx("dt", { children: "\u7EDF\u8BA1\u9879" }), _jsx("dd", { children: detailRow.label })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u4E1A\u52A1\u4E0A\u4E0B\u6587" }), _jsx("dd", { children: detailRow.detailContext })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u603B\u8425\u6536(\u51CF\u4F63)" }), _jsx("dd", { children: detailRow.businessIncomeMinusCommission })] })] })] }), _jsxs("footer", { children: [_jsx("button", { type: "button", onClick: () => setDetailRow(null), children: "\u5173\u95ED" }), _jsx("button", { type: "button", className: "is-primary", onClick: () => {
                                        setDetailRow(null);
                                        navigate('/statistics/orderLedger');
                                    }, children: "\u67E5\u770B\u6536\u652F\u660E\u7EC6" })] })] }) })) : null] }));
}
function DatePanel({ month, startDate, endDate, pickTarget, position, onClose, onPrevious, onNext, onPick, }) {
    const months = [month, shiftMonth(month, 1)];
    return (_jsx("div", { className: "income-date-panel-wrap", role: "presentation", onMouseDown: onClose, children: _jsxs("section", { className: "income-date-panel", role: "dialog", "aria-label": "\u6536\u5165\u62A5\u8868\u65E5\u671F\u9762\u677F", style: { top: `${position.top}px`, left: `${position.left}px` }, onMouseDown: (event) => event.stopPropagation(), children: [_jsxs("div", { className: "income-date-panel__header", children: [_jsx("strong", { children: pickTarget === 'start' ? '请选择开始日期' : '请选择结束日期' }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u6536\u5165\u62A5\u8868\u65E5\u671F\u9762\u677F", onClick: onClose, children: "\u00D7" })] }), _jsx("div", { className: "income-date-panel__months", children: months.map((item, index) => (_jsx(CalendarMonth, { month: item, startDate: startDate, endDate: endDate, onPrevious: index === 0 ? onPrevious : undefined, onNext: index === months.length - 1 ? onNext : undefined, onPick: onPick }, item))) })] }) }));
}
function CalendarMonth({ month, startDate, endDate, onPrevious, onNext, onPick, }) {
    const days = buildCalendarDays(month);
    const monthLabel = formatMonthLabel(month);
    return (_jsxs("section", { className: "income-calendar-month", "aria-label": monthLabel, children: [_jsxs("header", { children: [_jsx("button", { type: "button", "aria-label": "\u4E0A\u4E2A\u6708", onClick: onPrevious, disabled: !onPrevious, children: "\u2039" }), _jsx("strong", { children: monthLabel }), _jsx("button", { type: "button", "aria-label": "\u4E0B\u4E2A\u6708", onClick: onNext, disabled: !onNext, children: "\u203A" })] }), _jsx("div", { className: "income-calendar-month__weekdays", children: ['一', '二', '三', '四', '五', '六', '日'].map((day) => (_jsx("span", { children: day }, day))) }), _jsx("div", { className: "income-calendar-month__days", children: days.map((day) => {
                    const inRange = day.date >= startDate && day.date <= endDate;
                    const isSelected = day.date === startDate || day.date === endDate;
                    return (_jsx("button", { type: "button", "aria-label": day.date, className: `${day.isMuted ? 'is-muted' : ''}${inRange ? ' is-in-range' : ''}${isSelected ? ' is-selected' : ''}`, onClick: () => onPick(day.date), children: day.label }, day.date));
                }) })] }));
}
function SelectField({ label, selectedId, selectedLabel, options, open, onToggle, onSelect, }) {
    const displayLabel = selectedId && selectedLabel ? selectedLabel : '请选择';
    const selectableOptions = options.filter((item) => item.id !== undefined);
    return (_jsxs("label", { className: "income-select-field", children: [_jsx("span", { children: label }), _jsxs("div", { className: "income-select-wrap", children: [_jsx("button", { type: "button", "aria-haspopup": "listbox", "aria-expanded": open, "aria-label": `${label} ${displayLabel}`, onClick: onToggle, children: displayLabel }), open ? (_jsx("div", { className: "income-options", role: "listbox", "aria-label": `${label}选项`, children: selectableOptions.map((option) => (_jsx("button", { type: "button", role: "option", "aria-selected": selectedId === option.id, onClick: () => onSelect(option), children: option.label }, `${label}-${option.id}-${option.label}`))) })) : null] })] }));
}
function ExpandableHeader({ label, expanded, onClick, }) {
    return (_jsx("th", { className: expanded ? 'is-expanded-group' : '', children: _jsxs("button", { type: "button", className: `income-table-expand${expanded ? ' is-expanded' : ''}`, "aria-expanded": expanded, "aria-label": `${label}${expanded ? '收起子列' : '展开子列'}`, onClick: onClick, children: [_jsx("span", { children: label }), _jsx("i", { "aria-hidden": "true" })] }) }));
}
function createInitialQuery() {
    if (typeof window === 'undefined')
        return createDefaultIncomeReportQuery();
    const defaults = createDefaultIncomeReportQuery();
    const state = window.localStorage.getItem('pms.incomeReport.state');
    defaults.state = state === 'empty' || state === 'error' ? state : 'success';
    return defaults;
}
function firstColumnLabel(dimension) {
    if (dimension === 'month')
        return '月份';
    if (dimension === 'store')
        return '门店';
    if (dimension === 'channel')
        return '渠道';
    if (dimension === 'roomType')
        return '房型';
    if (dimension === 'room')
        return '房间';
    if (dimension === 'checkout')
        return '退房时间';
    return '日期';
}
function paginationText(page, pageSize, total) {
    const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
    const end = Math.min(page * pageSize, total);
    return `第 ${start}-${end} 条/总共 ${total} 条`;
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
