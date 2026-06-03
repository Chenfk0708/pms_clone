import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useSyncExternalStore, useState } from 'react';
import { createProfitReportExportTask, createProfitReportRequestBody, fetchProfitReportDashboard, getDefaultProfitReportFilters, getProfitReportStaticLookups, resolveProfitReportProvider, } from '../services/profitReport';
import './ProfitReportPage.css';
const staticLookups = getProfitReportStaticLookups();
export function ProfitReportPage() {
    const routeKey = useRouteSearchKey();
    const provider = useMemo(() => resolveProfitReportProvider(), []);
    const mockState = useMemo(() => resolveMockState(), [routeKey]);
    const [filters, setFilters] = useState(() => ({
        ...getDefaultProfitReportFilters(),
        mockState,
    }));
    const [dashboard, setDashboard] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [status, setStatus] = useState('');
    const [expanded, setExpanded] = useState(true);
    const [descriptionOpen, setDescriptionOpen] = useState(false);
    const [openSelect, setOpenSelect] = useState(null);
    const [exportTask, setExportTask] = useState(null);
    const [isDatePanelOpen, setIsDatePanelOpen] = useState(false);
    const [datePickTarget, setDatePickTarget] = useState('start');
    const [calendarMonth, setCalendarMonth] = useState(() => filters.startDate.slice(0, 7));
    const [datePanelPosition, setDatePanelPosition] = useState({ top: 0, left: 0 });
    const dateRangeRef = useRef(null);
    useEffect(() => {
        const nextFilters = { ...getDefaultProfitReportFilters(), mockState };
        setFilters(nextFilters);
        setCalendarMonth(nextFilters.startDate.slice(0, 7));
        void loadDashboard(nextFilters, '利润报表已完成加载');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mockState]);
    const stores = dashboard?.stores ?? staticLookups.stores;
    const roomCategories = dashboard?.roomCategories ?? staticLookups.roomCategories;
    const channels = dashboard?.channels ?? staticLookups.channels;
    const roomGroups = dashboard?.roomGroups ?? staticLookups.roomGroups;
    const descriptions = dashboard?.descriptions ?? staticLookups.descriptions;
    const rows = dashboard?.rows ?? [];
    const total = dashboard?.total ?? 0;
    const pageNum = dashboard?.pageNum ?? filters.pageNum;
    const pageSize = dashboard?.pageSize ?? filters.pageSize;
    const pageCount = dashboard?.pageCount ?? 1;
    const requestBody = dashboard?.requestBody ?? createProfitReportRequestBody(filters);
    const currentRoomType = roomCategories.find((item) => item.id === filters.roomCategoryId);
    const currentChannel = channels.find((item) => item.id === filters.channelId);
    const currentRoomGroup = roomGroups.find((item) => item.id === filters.roomGroupId);
    const dataFilters = {
        storeId: filters.storeId,
        startDate: filters.startDate,
        endDate: filters.endDate,
        roomCategoryId: currentRoomType?.id ?? '',
        roomCategoryLabel: currentRoomType?.label ?? '',
        channelId: currentChannel?.id ?? '',
        channelLabel: currentChannel?.label ?? '',
        roomGroupId: currentRoomGroup?.id ?? '',
        roomGroupLabel: currentRoomGroup?.label ?? '',
        includeCleanCost: filters.includeCleanCost,
        pageNum,
        pageSize,
    };
    async function loadDashboard(nextFilters, successMessage) {
        setIsLoading(true);
        setError('');
        setOpenSelect(null);
        try {
            const nextDashboard = await fetchProfitReportDashboard(nextFilters);
            setDashboard(nextDashboard);
            setFilters(nextFilters);
            setStatus(successMessage);
        }
        catch (reason) {
            setDashboard(null);
            setFilters(nextFilters);
            setStatus('');
            setError(reason instanceof Error ? reason.message : '利润报表数据加载失败');
        }
        finally {
            setIsLoading(false);
        }
    }
    function patchFilters(partial) {
        setFilters((current) => ({
            ...current,
            ...partial,
        }));
    }
    function selectOption(kind, option) {
        setOpenSelect(null);
        if (kind === 'roomType') {
            patchFilters({ roomCategoryId: option.id, pageNum: 1 });
            setStatus(`已选择房型：${option.label}`);
            return;
        }
        if (kind === 'channel') {
            patchFilters({ channelId: option.id, pageNum: 1 });
            setStatus(`已选择渠道：${option.label}`);
            return;
        }
        patchFilters({ roomGroupId: option.id, pageNum: 1 });
        setStatus(`已选择房型分组：${option.label}`);
    }
    function openDatePanel(target = 'start') {
        setOpenSelect(null);
        setDatePickTarget(target);
        setCalendarMonth(filters.startDate.slice(0, 7));
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
            const nextEndDate = date <= filters.endDate ? filters.endDate : date;
            patchFilters({ startDate: date, endDate: nextEndDate, pageNum: 1 });
            setDatePickTarget('end');
            return;
        }
        const nextStartDate = date < filters.startDate ? date : filters.startDate;
        const nextEndDate = date < filters.startDate ? filters.startDate : date;
        patchFilters({ startDate: nextStartDate, endDate: nextEndDate, pageNum: 1 });
        setDatePickTarget('start');
        setIsDatePanelOpen(false);
        setStatus(`已选择日期范围：${nextStartDate} 至 ${nextEndDate}`);
    }
    async function handleQuery() {
        await loadDashboard({ ...filters, pageNum: 1 }, '已按当前条件更新利润报表');
    }
    async function handleReset() {
        const nextFilters = { ...getDefaultProfitReportFilters(), mockState };
        setExportTask(null);
        setCalendarMonth(nextFilters.startDate.slice(0, 7));
        await loadDashboard(nextFilters, '已重置筛选并刷新利润报表');
    }
    async function handleChangePage(nextPageNum) {
        if (nextPageNum === filters.pageNum || nextPageNum < 1 || nextPageNum > pageCount) {
            return;
        }
        await loadDashboard({ ...filters, pageNum: nextPageNum }, `已切换到第 ${nextPageNum} 页`);
    }
    async function handleExport() {
        const nextTask = await createProfitReportExportTask(filters);
        setExportTask(nextTask);
        setStatus(`导出任务已创建：${nextTask.taskId}`);
    }
    return (_jsxs("div", { className: "profit-report-page", "data-provider": provider, "data-profit-request": JSON.stringify(requestBody), "data-profit-filters": JSON.stringify(dataFilters), "data-profit-export": exportTask ? JSON.stringify(exportTask) : '', children: [_jsx("h1", { className: "sr-only-heading", children: "\u5229\u6DA6\u62A5\u8868" }), _jsxs("section", { className: "profit-report-query", "aria-label": "\u5229\u6DA6\u62A5\u8868\u7B5B\u9009", children: [_jsx("div", { className: "profit-report-store-row", role: "radiogroup", "aria-label": "\u95E8\u5E97", children: stores.map((item) => (_jsx("button", { type: "button", role: "radio", "aria-checked": filters.storeId === item.id, className: filters.storeId === item.id ? 'is-active' : '', onClick: () => {
                                patchFilters({ storeId: item.id, pageNum: 1 });
                                setStatus(`已切换门店：${item.label}`);
                            }, children: item.label }, item.id))) }), expanded ? (_jsxs("div", { className: "profit-report-form", children: [_jsxs("div", { className: "profit-report-filter-row", children: [_jsxs("label", { className: "profit-date-field", children: [_jsx("span", { children: "\u65E5\u671F\uFF1A" }), _jsxs("div", { ref: dateRangeRef, className: "profit-date-range", role: "button", tabIndex: 0, "aria-label": "\u5229\u6DA6\u62A5\u8868\u65E5\u671F\u8303\u56F4", onClick: () => openDatePanel('start'), onKeyDown: (event) => {
                                                    if (event.key === 'Enter' || event.key === ' ') {
                                                        event.preventDefault();
                                                        openDatePanel('start');
                                                    }
                                                }, children: [_jsx("input", { "aria-label": "\u5F00\u59CB\u65E5\u671F", value: filters.startDate, readOnly: true, onClick: (event) => {
                                                            event.stopPropagation();
                                                            openDatePanel('start');
                                                        } }), _jsx("span", { children: "\u81F3" }), _jsx("input", { "aria-label": "\u7ED3\u675F\u65E5\u671F", value: filters.endDate, readOnly: true, onClick: (event) => {
                                                            event.stopPropagation();
                                                            openDatePanel('end');
                                                        } }), _jsx("i", { "aria-hidden": "true" })] })] }), _jsx(SelectField, { label: "\u623F\u578B\uFF1A", placeholder: "\u8BF7\u9009\u62E9", selectedId: currentRoomType?.id ?? '', value: currentRoomType?.label ?? '', options: roomCategories, emptyCopy: "\u6682\u65E0\u623F\u578B\u6570\u636E", open: openSelect === 'roomType', onToggle: () => setOpenSelect((current) => (current === 'roomType' ? null : 'roomType')), onSelect: (option) => selectOption('roomType', option) }), _jsx(SelectField, { label: "\u6E20\u9053\uFF1A", placeholder: "\u8BF7\u9009\u62E9", selectedId: currentChannel?.id ?? '', value: currentChannel?.label ?? '', options: channels, emptyCopy: "\u6682\u65E0\u6E20\u9053\u6570\u636E", open: openSelect === 'channel', onToggle: () => setOpenSelect((current) => (current === 'channel' ? null : 'channel')), onSelect: (option) => selectOption('channel', option) }), _jsx(SelectField, { label: "\u623F\u578B\u5206\u7EC4\uFF1A", placeholder: "\u8BF7\u9009\u62E9", selectedId: currentRoomGroup?.id ?? '', value: currentRoomGroup?.label ?? '', options: roomGroups, emptyCopy: "\u6682\u65E0\u623F\u578B\u5206\u7EC4", open: openSelect === 'roomGroup', onToggle: () => setOpenSelect((current) => (current === 'roomGroup' ? null : 'roomGroup')), onSelect: (option) => selectOption('roomGroup', option) })] }), _jsx("div", { className: "profit-report-extra-row", children: _jsxs("label", { className: "profit-checkbox", children: [_jsx("input", { type: "checkbox", "aria-label": "\u5305\u542B\u4FDD\u6D01\u8D39\u7528", checked: filters.includeCleanCost, onChange: (event) => {
                                                patchFilters({ includeCleanCost: event.target.checked, pageNum: 1 });
                                                setStatus(event.target.checked ? '已计入保洁费用' : '已取消计入保洁费用');
                                            } }), _jsx("span", { children: "\u5305\u542B\u4FDD\u6D01\u8D39\u7528" })] }) })] })) : null, _jsxs("div", { className: "profit-report-actions", children: [_jsx("button", { type: "button", className: "is-outline", disabled: isLoading, onClick: () => void handleReset(), children: "\u91CD\u7F6E" }), _jsx("button", { type: "button", className: "is-primary", disabled: isLoading, onClick: () => void handleQuery(), children: "\u67E5\u8BE2" }), _jsx("button", { type: "button", className: "is-outline", disabled: isLoading, onClick: () => void handleExport(), children: "\u5BFC\u51FA" }), _jsx("button", { type: "button", className: "is-outline", disabled: isLoading, onClick: () => {
                                    setDescriptionOpen(true);
                                    setOpenSelect(null);
                                }, children: "\u8BF4\u660E" }), _jsx("button", { type: "button", className: "is-link", disabled: isLoading, "aria-label": expanded ? '收起' : '展开', onClick: () => {
                                    const nextExpanded = !expanded;
                                    setExpanded(nextExpanded);
                                    setOpenSelect(null);
                                    setStatus(nextExpanded ? '已展开筛选条件' : '已收起筛选条件');
                                }, children: expanded ? '收起' : '展开' })] })] }), isDatePanelOpen ? (_jsx(DatePanel, { month: calendarMonth, startDate: filters.startDate, endDate: filters.endDate, pickTarget: datePickTarget, position: datePanelPosition, onClose: () => {
                    setIsDatePanelOpen(false);
                    setDatePickTarget('start');
                }, onPrevious: () => setCalendarMonth((current) => shiftMonth(current, -1)), onNext: () => setCalendarMonth((current) => shiftMonth(current, 1)), onPick: applyDateSelection })) : null, _jsx("div", { className: "sr-only-heading", role: "status", "aria-label": "\u5229\u6DA6\u62A5\u8868\u64CD\u4F5C\u53CD\u9988", children: status }), error ? (_jsxs("div", { className: "profit-report-alert", role: "alert", "aria-label": "\u5229\u6DA6\u62A5\u8868\u6570\u636E\u9519\u8BEF", children: [_jsx("span", { children: error }), _jsx("button", { type: "button", onClick: () => void loadDashboard(filters, '利润报表已重试并更新'), children: "\u91CD\u8BD5" })] })) : null, _jsxs("section", { className: "profit-report-table-wrap", "aria-label": "\u5229\u6DA6\u62A5\u8868\u8868\u683C", children: [isLoading ? _jsx("div", { className: "profit-report-empty", children: "\u6B63\u5728\u52A0\u8F7D\u5229\u6DA6\u62A5\u8868..." }) : null, !isLoading && rows.length === 0 ? _jsx("div", { className: "profit-report-empty", children: "\u6682\u65E0\u5229\u6DA6\u62A5\u8868\u6570\u636E" }) : null, _jsxs("table", { className: "profit-report-table", children: [_jsxs("thead", { children: [_jsxs("tr", { children: [_jsx("th", { colSpan: 7, children: "\u6536\u5165" }), _jsx("th", { children: "\u652F\u51FA" }), _jsx("th", { colSpan: 2, children: "\u5229\u6DA6" })] }), _jsxs("tr", { children: [_jsx("th", { children: "\u65E5\u671F" }), _jsx("th", { children: "\u623F\u8D39(\u51CF\u4F63)" }), _jsx("th", { children: "\u95E8\u7968" }), _jsx("th", { children: "\u9910\u996E" }), _jsx("th", { children: "\u5176\u4ED6\u6D88\u8D39" }), _jsx("th", { children: "\u8BB0\u4E00\u7B14\u6536\u5165" }), _jsx("th", { children: "\u603B\u6536\u5165" }), _jsx("th", { children: "\u8BB0\u4E00\u7B14\u652F\u51FA" }), _jsx("th", { children: "\u5229\u6DA6" }), _jsx("th", { children: "\u5229\u6DA6\u7387" })] })] }), _jsx("tbody", { children: rows.map((row) => (_jsxs("tr", { className: row.isTotal ? 'is-summary' : '', children: [_jsx("td", { children: row.date }), _jsx("td", { children: row.roomFeeMinusCommission }), _jsx("td", { children: row.ticketPrice }), _jsx("td", { children: row.cateringPrice }), _jsx("td", { children: row.otherOrderExpense }), _jsx("td", { children: row.writeDownIncome }), _jsx("td", { children: row.totalIncome }), _jsx("td", { children: row.writeDownExpenses }), _jsx("td", { children: row.profitPrice }), _jsx("td", { children: row.profitRate })] }, `${row.date}-${row.isTotal ? 'total' : 'detail'}`))) })] })] }), _jsxs("nav", { className: "profit-report-pagination", "aria-label": "\u5206\u9875", children: [_jsx("span", { children: paginationText(pageNum, pageSize, total, rows.length) }), _jsx("button", { type: "button", "aria-label": "\u4E0A\u4E00\u9875", disabled: isLoading || pageNum <= 1, onClick: () => void handleChangePage(pageNum - 1), children: "\u2039" }), buildPageButtons(pageCount).map((item) => (_jsx("button", { type: "button", className: item === pageNum ? 'is-current' : '', disabled: isLoading, onClick: () => void handleChangePage(item), children: item }, item))), _jsx("button", { type: "button", "aria-label": "\u4E0B\u4E00\u9875", disabled: isLoading || pageNum >= pageCount, onClick: () => void handleChangePage(pageNum + 1), children: "\u203A" }), _jsxs("button", { type: "button", disabled: isLoading, children: [pageSize, " \u6761/\u9875"] })] }), descriptionOpen ? (_jsx("div", { className: "profit-modal-backdrop", role: "presentation", children: _jsxs("section", { className: "profit-description-modal", role: "dialog", "aria-modal": "true", "aria-label": "\u5229\u6DA6\u62A5\u8868\u5B57\u6BB5\u8BF4\u660E", children: [_jsxs("header", { children: [_jsx("strong", { children: "\u5229\u6DA6\u62A5\u8868\u5B57\u6BB5\u8BF4\u660E" }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u5229\u6DA6\u62A5\u8868\u5B57\u6BB5\u8BF4\u660E", onClick: () => setDescriptionOpen(false), children: "\u00D7" })] }), _jsxs("div", { className: "profit-description-table", "aria-label": "\u5229\u6DA6\u62A5\u8868\u5B57\u6BB5\u8BF4\u660E\u8868\u683C", children: [_jsxs("div", { className: "profit-description-table__head", children: [_jsx("span", { children: "\u5B57\u6BB5" }), _jsx("span", { children: "\u8BF4\u660E" })] }), descriptions.map((item) => (_jsx(DescriptionRow, { item: item }, item.field)))] })] }) })) : null] }));
}
function SelectField({ label, placeholder, selectedId, value, options, emptyCopy, open, onToggle, onSelect, }) {
    return (_jsxs("div", { className: "profit-select-field", children: [_jsx("span", { children: label }), _jsxs("div", { className: "profit-select-wrap", children: [_jsx("button", { type: "button", "aria-haspopup": "listbox", "aria-expanded": open, "aria-label": `${label}${value || placeholder}`, onClick: onToggle, children: value || placeholder }), open ? (_jsx("div", { className: "profit-options", role: "listbox", "aria-label": `${label}选项`, children: options.length === 0 ? (_jsx("div", { className: "profit-options__empty", children: emptyCopy })) : (options.map((option) => (_jsx("button", { type: "button", role: "option", "aria-selected": selectedId === option.id, onClick: () => onSelect(option), children: option.label }, option.id)))) })) : null] })] }));
}
function DatePanel({ month, startDate, endDate, pickTarget, position, onClose, onPrevious, onNext, onPick, }) {
    const months = [month, shiftMonth(month, 1)];
    return (_jsx("div", { className: "profit-date-panel-wrap", role: "presentation", onMouseDown: onClose, children: _jsxs("section", { className: "profit-date-panel", role: "dialog", "aria-label": "\u5229\u6DA6\u62A5\u8868\u65E5\u671F\u9762\u677F", style: { top: `${position.top}px`, left: `${position.left}px` }, onMouseDown: (event) => event.stopPropagation(), children: [_jsxs("div", { className: "profit-date-panel__header", children: [_jsx("strong", { children: pickTarget === 'start' ? '请选择开始日期' : '请选择结束日期' }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u5229\u6DA6\u62A5\u8868\u65E5\u671F\u9762\u677F", onClick: onClose, children: "\u00D7" })] }), _jsx("div", { className: "profit-date-panel__months", children: months.map((item, index) => (_jsx(CalendarMonth, { month: item, startDate: startDate, endDate: endDate, onPrevious: index === 0 ? onPrevious : undefined, onNext: index === months.length - 1 ? onNext : undefined, onPick: onPick }, item))) })] }) }));
}
function CalendarMonth({ month, startDate, endDate, onPrevious, onNext, onPick, }) {
    const days = buildCalendarDays(month);
    const monthLabel = formatMonthLabel(month);
    return (_jsxs("section", { className: "profit-calendar-month", "aria-label": monthLabel, children: [_jsxs("header", { children: [_jsx("button", { type: "button", "aria-label": "\u4E0A\u4E2A\u6708", onClick: onPrevious, disabled: !onPrevious, children: "\u2039" }), _jsx("strong", { children: monthLabel }), _jsx("button", { type: "button", "aria-label": "\u4E0B\u4E2A\u6708", onClick: onNext, disabled: !onNext, children: "\u203A" })] }), _jsx("div", { className: "profit-calendar-month__weekdays", children: ['一', '二', '三', '四', '五', '六', '日'].map((day) => (_jsx("span", { children: day }, day))) }), _jsx("div", { className: "profit-calendar-month__days", children: days.map((day) => {
                    const inRange = day.date >= startDate && day.date <= endDate;
                    const isSelected = day.date === startDate || day.date === endDate;
                    return (_jsx("button", { type: "button", "aria-label": day.date, className: `${day.isMuted ? 'is-muted' : ''}${inRange ? ' is-in-range' : ''}${isSelected ? ' is-selected' : ''}`, onClick: () => onPick(day.date), children: day.label }, day.date));
                }) })] }));
}
function DescriptionRow({ item }) {
    return (_jsxs("div", { className: "profit-description-table__row", children: [_jsx("span", { children: item.field }), _jsx("span", { children: item.detail })] }));
}
function buildPageButtons(pageCount) {
    return Array.from({ length: Math.max(pageCount, 1) }, (_, index) => index + 1);
}
function paginationText(pageNum, pageSize, total, length) {
    const start = total === 0 ? 0 : (pageNum - 1) * pageSize + 1;
    const end = total === 0 ? 0 : (pageNum - 1) * pageSize + length;
    return `第 ${start}-${end} 条/总共 ${total} 条`;
}
function resolveMockState() {
    const state = readRouteParam('profitMockState');
    return state === 'empty' || state === 'error' ? state : 'success';
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
function readRouteParam(key) {
    const searchValue = new URLSearchParams(window.location.search).get(key);
    if (searchValue)
        return searchValue;
    const hashQuery = window.location.hash.split('?')[1] ?? '';
    return new URLSearchParams(hashQuery).get(key);
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
