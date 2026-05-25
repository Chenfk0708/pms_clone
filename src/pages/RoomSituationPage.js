import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dailyRoomSituationEndpoint, fetchDailyRoomSituation, fetchForwardRoomSituation, fetchRoomSituationStores, formatRoomSituationDataSource, formatRoomSituationFeedback, forwardRoomSituationEndpoint, resolveRoomSituationCampId, resolveRoomSituationProvider, } from '../services/roomSituation';
const dayColumns = [
    { key: 'total', label: '总房间数' },
    { key: 'sold', label: '已售房间数' },
    { key: 'available', label: '剩余可售数' },
    { key: 'closed', label: '总关房数' },
    { key: 'disabled', label: '停用房' },
    { key: 'reserved', label: '保留房' },
    { key: 'repair', label: '维修房' },
    { key: 'linkedClosed', label: '联动关房' },
    { key: 'usable', label: '总可用房数' },
    { key: 'arriving', label: '预抵' },
    { key: 'occupied', label: '在住' },
    { key: 'leaving', label: '预离' },
    { key: 'clean', label: '净房' },
    { key: 'dirty', label: '脏房' },
];
const metricDescriptions = [
    { label: '总房间数', text: '企业的房间总数；' },
    { label: '剩余可售', text: '当天剩余的可售房间数量；' },
    { label: '占用', text: '订单占用、停用房占用、维修房占用、保留房占用的占用房间总数；' },
];
const dayMs = 24 * 60 * 60 * 1000;
const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
const forwardWindowDays = 30;
export function RoomSituationPage() {
    const navigate = useNavigate();
    const today = useMemo(() => startOfDay(new Date()), []);
    const [mode, setMode] = useState('day');
    const [forwardStartDate, setForwardStartDate] = useState(today);
    const [forwardPickerMonth, setForwardPickerMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
    const [forwardCalendarOpen, setForwardCalendarOpen] = useState(false);
    const [pageSizeOpen, setPageSizeOpen] = useState(false);
    const [pageSize, setPageSize] = useState(20);
    const [showMetricHelp, setShowMetricHelp] = useState(false);
    const [stores, setStores] = useState([]);
    const [storeError, setStoreError] = useState('');
    const [activeStoreId, setActiveStoreId] = useState('all');
    const [dailyRows, setDailyRows] = useState([]);
    const [forwardRows, setForwardRows] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [feedback, setFeedback] = useState('等待加载');
    const [reloadKey, setReloadKey] = useState(0);
    const activeEndpoint = mode === 'day' ? dailyRoomSituationEndpoint : forwardRoomSituationEndpoint;
    const dataSourceLabel = formatRoomSituationDataSource(activeEndpoint);
    const providerName = resolveRoomSituationProvider();
    useEffect(() => {
        const controller = new AbortController();
        async function loadStores() {
            try {
                const campId = resolveRoomSituationCampId();
                const nextStores = await fetchRoomSituationStores(campId, controller.signal);
                setStores(nextStores);
                setStoreError('');
            }
            catch (caught) {
                if (isAbortError(caught))
                    return;
                setStoreError(toErrorMessage(caught));
            }
        }
        void loadStores();
        return () => controller.abort();
    }, [reloadKey]);
    useEffect(() => {
        const controller = new AbortController();
        async function loadTableData() {
            setLoading(true);
            setError('');
            setFeedback(formatRoomSituationFeedback('loading'));
            try {
                const campId = resolveRoomSituationCampId();
                const todayLabel = formatDate();
                if (mode === 'day') {
                    const nextData = await fetchDailyRoomSituation({ campId, date: todayLabel, poiIds: activeStoreId === 'all' ? [] : [activeStoreId], pageNum: 1, pageSize }, controller.signal);
                    setDailyRows(nextData.rows);
                    setTotal(nextData.total);
                }
                else {
                    const startDate = formatDateFromValue(forwardStartDate);
                    const nextData = await fetchForwardRoomSituation({
                        campId,
                        startDate,
                        endDate: formatDateFromValue(shiftDate(forwardStartDate, forwardWindowDays)),
                        poiIds: activeStoreId === 'all' ? [] : [activeStoreId],
                        pageNum: 1,
                        pageSize,
                    }, controller.signal);
                    setForwardRows(nextData.rows);
                    setTotal(nextData.total);
                }
                setFeedback(formatRoomSituationFeedback('success'));
            }
            catch (caught) {
                if (isAbortError(caught))
                    return;
                setError(toErrorMessage(caught));
                setFeedback(formatRoomSituationFeedback('failure'));
            }
            finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        }
        void loadTableData();
        return () => controller.abort();
    }, [activeStoreId, forwardStartDate, mode, pageSize, reloadKey]);
    const rowsInView = mode === 'day' ? dailyRows.length : forwardRows.length;
    const futureDates = useMemo(() => buildFutureDates(forwardStartDate, Math.max(1, maxForwardDays(forwardRows))), [forwardRows, forwardStartDate]);
    const storeOptions = useMemo(() => [{ poiId: 'all', poiName: '全部门店' }, ...stores.filter((store) => store.poiId && store.poiId !== 'all')], [stores]);
    const forwardDateLabel = `${formatDateFromValue(forwardStartDate)} ${weekdays[forwardStartDate.getDay()]}`;
    const forwardCalendarCells = useMemo(() => buildCalendarCells(forwardPickerMonth, forwardStartDate), [forwardPickerMonth, forwardStartDate]);
    const forwardPickerLabel = `${forwardPickerMonth.getFullYear()}年 ${forwardPickerMonth.getMonth() + 1}月`;
    function retry() {
        setReloadKey((value) => value + 1);
    }
    return (_jsxs("div", { className: "page-stack room-situation-page", children: [_jsxs("section", { className: "room-situation-toolbar", "aria-label": "\u623F\u60C5\u8868\u7B5B\u9009", children: [_jsxs("div", { className: "room-situation-tabs", children: [_jsx("button", { type: "button", className: mode === 'day' ? 'is-active' : '', onClick: () => setMode('day'), children: "\u5355\u65E5\u623F\u60C5\u8868" }), _jsx("button", { type: "button", className: mode === 'future' ? 'is-active' : '', onClick: () => setMode('future'), children: "\u8FDC\u671F\u623F\u60C5\u8868" })] }), _jsxs("div", { className: "room-situation-filters", children: [_jsxs("div", { className: "month-store-control room-situation-store-control", children: [_jsx("div", { className: "month-store-switch", "aria-label": "\u95E8\u5E97\u8303\u56F4", children: storeOptions.map((store, index) => (_jsx("button", { type: "button", className: `chip${index === 0 ? ' month-store-chip' : ''}${activeStoreId === store.poiId ? ' is-active' : ''}`, "aria-pressed": activeStoreId === store.poiId, title: store.poiName, onClick: () => setActiveStoreId(store.poiId), children: store.poiName }, store.poiId))) }), _jsx("button", { type: "button", className: "month-store-settings", "aria-label": "\u95E8\u5E97\u8BBE\u7F6E", onClick: () => navigate('/InformationMaintenance/campInfo'), children: _jsx("span", { "aria-hidden": "true", children: "\u2699" }) })] }), _jsx("button", { type: "button", className: "room-metric-help", onClick: () => setShowMetricHelp(true), children: "\u6307\u6807\u8BF4\u660E" })] }), mode === 'future' ? (_jsxs("div", { className: "room-forward-toolbar", children: [_jsxs("div", { className: "room-forward-date-nav", "aria-label": "\u8FDC\u671F\u5F00\u59CB\u65E5\u671F", children: [_jsx("button", { type: "button", className: "room-forward-date-nav__arrow", "aria-label": "\u4E0A\u4E00\u5929", onClick: () => setForwardStartDate((current) => shiftDate(current, -1)), children: "\u2039" }), _jsxs("button", { type: "button", className: "room-forward-date-display", "aria-expanded": forwardCalendarOpen, onClick: () => {
                                            setForwardPickerMonth(new Date(forwardStartDate.getFullYear(), forwardStartDate.getMonth(), 1));
                                            setForwardCalendarOpen((current) => !current);
                                        }, children: [_jsx("strong", { children: forwardDateLabel }), _jsx("span", { "aria-hidden": "true", children: "\uD83D\uDCC5" })] }), _jsx("button", { type: "button", className: "room-forward-date-nav__arrow", "aria-label": "\u4E0B\u4E00\u5929", onClick: () => setForwardStartDate((current) => shiftDate(current, 1)), children: "\u203A" }), forwardCalendarOpen ? (_jsxs("div", { className: "room-forward-calendar", role: "dialog", "aria-label": "\u9009\u62E9\u8FDC\u671F\u5F00\u59CB\u65E5\u671F", children: [_jsxs("div", { className: "room-forward-calendar__header", children: [_jsxs("div", { className: "room-forward-calendar__nav", children: [_jsx("button", { type: "button", "aria-label": "\u4E0A\u4E00\u5E74", onClick: () => setForwardPickerMonth((current) => new Date(current.getFullYear() - 1, current.getMonth(), 1)), children: "\u00AB" }), _jsx("button", { type: "button", "aria-label": "\u4E0A\u4E00\u6708", onClick: () => setForwardPickerMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1)), children: "\u2039" })] }), _jsx("strong", { children: forwardPickerLabel }), _jsxs("div", { className: "room-forward-calendar__nav", children: [_jsx("button", { type: "button", "aria-label": "\u4E0B\u4E00\u6708", onClick: () => setForwardPickerMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1)), children: "\u203A" }), _jsx("button", { type: "button", "aria-label": "\u4E0B\u4E00\u5E74", onClick: () => setForwardPickerMonth((current) => new Date(current.getFullYear() + 1, current.getMonth(), 1)), children: "\u00BB" })] })] }), _jsx("div", { className: "room-forward-calendar__weekdays", children: ['一', '二', '三', '四', '五', '六', '日'].map((weekday) => (_jsx("span", { children: weekday }, weekday))) }), _jsx("div", { className: "room-forward-calendar__grid", children: forwardCalendarCells.map((cell) => (_jsx("button", { type: "button", className: `room-forward-calendar__cell${cell.inViewMonth ? ' is-in-month' : ''}${cell.isSelected ? ' is-selected' : ''}`, onClick: () => {
                                                        setForwardStartDate(parseDateValue(cell.isoDate));
                                                        setForwardCalendarOpen(false);
                                                    }, children: cell.label }, cell.isoDate))) }), _jsx("button", { type: "button", className: "room-forward-calendar__today", onClick: () => {
                                                    setForwardStartDate(today);
                                                    setForwardPickerMonth(new Date(today.getFullYear(), today.getMonth(), 1));
                                                    setForwardCalendarOpen(false);
                                                }, children: "\u4ECA\u5929" })] })) : null] }), _jsx("div", { className: "room-situation-caption", children: _jsx("span", { children: "\u53EF\u552E=\u5F53\u5929\u5269\u4F59\u53EF\u552E\uFF0C\u5360\u7528=\u8BA2\u5355\u5360\u7528+\u5173\u623F\u5360\u7528" }) })] })) : null, _jsxs("div", { className: "room-request-status", "aria-live": "polite", "data-provider": providerName, "data-endpoint": activeEndpoint, children: [_jsxs("div", { className: "room-data-source", "aria-label": "\u623F\u60C5\u8868\u6570\u636E\u6765\u6E90", children: ["\u6570\u636E\u6765\u6E90\uFF1A", dataSourceLabel] }), _jsx("div", { className: "room-feedback", "aria-label": "\u623F\u60C5\u8868\u64CD\u4F5C\u53CD\u9988", children: loading ? formatRoomSituationFeedback('loading') : feedback }), storeError ? _jsxs("div", { className: "room-store-warning", children: ["\u95E8\u5E97\u52A0\u8F7D\u5931\u8D25\uFF1A", storeError] }) : null] })] }), _jsxs("section", { className: "room-situation-board", children: [error ? (_jsxs("div", { className: "room-error", role: "alert", children: [_jsx("strong", { children: error }), _jsx("button", { type: "button", onClick: retry, disabled: loading, children: "\u91CD\u8BD5" })] })) : null, loading ? _jsx("div", { className: "room-loading", children: "\u6B63\u5728\u52A0\u8F7D\u623F\u60C5\u8868\u6570\u636E..." }) : null, !loading && !error && rowsInView === 0 ? _jsx("div", { className: "room-empty", children: "\u6682\u65E0\u623F\u60C5\u8868\u6570\u636E" }) : null, mode === 'future' ? (_jsx(FutureSituationTable, { rows: forwardRows, dates: futureDates })) : (_jsx(DaySituationTable, { rows: dailyRows })), _jsxs("footer", { className: "room-situation-pagination", children: [_jsxs("span", { children: ["\u7B2C ", rowsInView === 0 ? 0 : 1, "-", rowsInView, " \u6761 \u603B\u5171 ", total, " \u6761"] }), _jsx("button", { type: "button", className: "is-active", children: "1" }), _jsxs("div", { className: "room-page-size-wrap", children: [_jsxs("button", { type: "button", className: "room-page-size", onClick: () => setPageSizeOpen((value) => !value), children: [pageSize, " \u6761/\u9875"] }), pageSizeOpen ? (_jsx("div", { className: "room-page-size-options", role: "listbox", "aria-label": "\u6BCF\u9875\u6761\u6570", children: [10, 20, 50, 100].map((size) => (_jsxs("button", { type: "button", role: "option", "aria-selected": pageSize === size, onClick: () => {
                                                setPageSize(size);
                                                setPageSizeOpen(false);
                                            }, children: [size, " \u6761/\u9875"] }, size))) })) : null] })] })] }), showMetricHelp ? (_jsx("div", { className: "room-metric-drawer-backdrop", onClick: () => setShowMetricHelp(false), children: _jsxs("section", { className: "room-metric-drawer", role: "dialog", "aria-modal": "true", "aria-label": "\u6307\u6807\u8BF4\u660E", onClick: (event) => event.stopPropagation(), children: [_jsxs("header", { children: [_jsx("h2", { children: "\u6307\u6807\u8BF4\u660E" }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u6307\u6807\u8BF4\u660E", onClick: () => setShowMetricHelp(false), children: "\u00D7" })] }), _jsx("div", { className: "room-metric-drawer__body", children: metricDescriptions.map((item) => (_jsxs("p", { children: [_jsxs("strong", { children: [item.label, "\uFF1A"] }), item.text] }, item.label))) })] }) })) : null] }));
}
function DaySituationTable({ rows }) {
    return (_jsx("div", { className: "room-situation-table-scroll", "data-testid": "room-situation-table-scroll", children: _jsxs("table", { className: "room-situation-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { className: "room-type-column", children: "\u623F\u578B\u540D\u79F0" }), dayColumns.map((column) => (_jsx("th", { children: column.label }, column.key)))] }) }), _jsx("tbody", { children: rows.map((row) => (_jsxs("tr", { children: [_jsxs("th", { className: "room-type-column", children: [_jsx("span", { className: "room-row-summary", children: formatDailyRowSummary(row) }), _jsx("span", { children: row.name })] }), dayColumns.map((column) => (_jsxs("td", { children: [" ", row[column.key]] }, column.key)))] }, row.id))) })] }) }));
}
function FutureSituationTable({ rows, dates }) {
    const tableMinWidth = Math.max(1400, 220 + dates.length * 112);
    return (_jsx("div", { className: "room-situation-future-wrap", children: _jsx("div", { className: "room-situation-table-scroll", "data-testid": "room-situation-table-scroll", children: _jsxs("table", { className: "room-situation-table room-situation-table--future", style: { minWidth: `${tableMinWidth}px` }, children: [_jsxs("thead", { children: [_jsxs("tr", { children: [_jsx("th", { className: "room-type-column", rowSpan: 2, children: "\u623F\u578B" }), _jsx("th", { rowSpan: 2, children: "\u603B\u623F\u95F4\u6570" }), dates.map((date) => (_jsx("th", { colSpan: 2, children: date }, date)))] }), _jsx("tr", { children: dates.flatMap((date) => [
                                    _jsx("th", { children: "\u5269\u4F59\u53EF\u552E" }, `${date}-available`),
                                    _jsx("th", { children: "\u5360\u7528" }, `${date}-occupied`),
                                ]) })] }), _jsx("tbody", { children: rows.map((row) => (_jsxs("tr", { children: [_jsxs("th", { className: "room-type-column", children: [_jsx("span", { className: "room-row-summary", children: formatForwardRowSummary(row) }), _jsx("span", { children: row.name })] }), _jsxs("td", { children: [" ", row.total] }), row.days.flatMap((day, index) => [
                                    _jsxs("td", { children: [" ", day.available] }, `${row.id}-${dates[index] ?? index}-available`),
                                    _jsxs("td", { children: [" ", day.occupied] }, `${row.id}-${dates[index] ?? index}-occupied`),
                                ])] }, row.id))) })] }) }) }));
}
function formatDate(offset = 0) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + offset);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
function buildFutureDates(startDate, length) {
    return Array.from({ length }, (_, index) => {
        const date = shiftDate(startDate, index);
        return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')} ${weekdays[date.getDay()]}`;
    });
}
function buildCalendarCells(cursorMonth, selectedDate) {
    const monthStart = new Date(cursorMonth.getFullYear(), cursorMonth.getMonth(), 1);
    const firstGridDate = shiftDate(monthStart, -((monthStart.getDay() + 6) % 7));
    const selectedIsoDate = formatDateFromValue(selectedDate);
    return Array.from({ length: 42 }, (_, index) => {
        const date = shiftDate(firstGridDate, index);
        return {
            isoDate: formatDateFromValue(date),
            label: String(date.getDate()),
            inViewMonth: date.getMonth() === cursorMonth.getMonth(),
            isSelected: formatDateFromValue(date) === selectedIsoDate,
        };
    });
}
function startOfDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
function shiftDate(date, offset) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + offset);
}
function formatDateFromValue(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
function parseDateValue(value) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, (month || 1) - 1, day || 1);
}
function maxForwardDays(rows) {
    return rows.reduce((max, row) => Math.max(max, row.days.length), 0);
}
function formatDailyRowSummary(row) {
    return [row.name, ...dayColumns.map((column) => row[column.key])].join(' ');
}
function formatForwardRowSummary(row) {
    return [
        row.name,
        row.total,
        ...row.days.flatMap((day) => [day.available, day.occupied]),
    ].join(' ');
}
function toErrorMessage(caught) {
    return caught instanceof Error ? caught.message : String(caught);
}
function isAbortError(caught) {
    return caught instanceof DOMException && caught.name === 'AbortError';
}
