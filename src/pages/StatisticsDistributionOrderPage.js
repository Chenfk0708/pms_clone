import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { defaultStatisticsDistributionOrderCampId, getStatisticsDistributionOrderProviderName, loadStatisticsDistributionOrderData, statisticsDistributionOrderEndpoint, } from '../services/statisticsDistributionOrder';
import './OrderLedgerPage.css';
import './DistributionOrderPage.css';
import './StatisticsDistributionOrderPage.css';
const tableColumns = ['订单号', '客户信息', '房型名称', '预订时间', '实付金额', '平台服务费', '应结算金额', '已结算金额', '结算状态'];
const orderFilterOptions = ['全部', '非置换订单', '置换订单'];
const initialQuery = {
    campId: defaultStatisticsDistributionOrderCampId,
    storeScope: 'all',
    bookingStartDate: '2026-05-01',
    bookingEndDate: '2026-05-31',
    keyword: '',
    settlementState: '',
    pageNum: 1,
    pageSize: 20,
    current: 1,
};
export function StatisticsDistributionOrderPage({ defaultExpanded = true }) {
    const location = useLocation();
    const navigate = useNavigate();
    const [expanded, setExpanded] = useState(defaultExpanded);
    const [keyword, setKeyword] = useState('');
    const [filter, setFilter] = useState('');
    const [storeScope, setStoreScope] = useState('all');
    const [bookingStartDate, setBookingStartDate] = useState(initialQuery.bookingStartDate);
    const [bookingEndDate, setBookingEndDate] = useState(initialQuery.bookingEndDate);
    const [submittedKeyword, setSubmittedKeyword] = useState('');
    const [submittedFilter, setSubmittedFilter] = useState('');
    const [submittedStoreScope, setSubmittedStoreScope] = useState('all');
    const [submittedBookingStartDate, setSubmittedBookingStartDate] = useState(initialQuery.bookingStartDate);
    const [submittedBookingEndDate, setSubmittedBookingEndDate] = useState(initialQuery.bookingEndDate);
    const [openFilter, setOpenFilter] = useState(false);
    const [notice, setNotice] = useState('');
    const [reloadToken, setReloadToken] = useState(0);
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [isDatePanelOpen, setIsDatePanelOpen] = useState(false);
    const [datePickTarget, setDatePickTarget] = useState('start');
    const [calendarMonth, setCalendarMonth] = useState(() => bookingStartDate.slice(0, 7));
    const [datePanelPosition, setDatePanelPosition] = useState({ top: 0, left: 0 });
    const [dateDraft, setDateDraft] = useState(() => ({ startDate: bookingStartDate, endDate: bookingEndDate }));
    const dateRangeRef = useRef(null);
    const query = useMemo(() => ({
        ...initialQuery,
        storeScope: submittedStoreScope,
        bookingStartDate: submittedBookingStartDate,
        bookingEndDate: submittedBookingEndDate,
        keyword: submittedKeyword,
        settlementState: submittedFilter,
    }), [submittedBookingEndDate, submittedBookingStartDate, submittedFilter, submittedKeyword, submittedStoreScope]);
    useEffect(() => {
        const controller = new AbortController();
        async function run() {
            setIsLoading(true);
            setError('');
            try {
                const result = await loadStatisticsDistributionOrderData(query, controller.signal);
                setData(result);
            }
            catch (loadError) {
                if (loadError instanceof DOMException && loadError.name === 'AbortError')
                    return;
                setError(loadError instanceof Error ? loadError.message : '聚合分销订单服务暂不可用，请稍后重试');
            }
            finally {
                setIsLoading(false);
            }
        }
        void run();
        return () => controller.abort();
    }, [query, reloadToken, location.search]);
    function resetFilters() {
        setKeyword('');
        setSubmittedKeyword('');
        setFilter('');
        setSubmittedFilter('');
        setStoreScope('all');
        setSubmittedStoreScope('all');
        setBookingStartDate(initialQuery.bookingStartDate);
        setBookingEndDate(initialQuery.bookingEndDate);
        setSubmittedBookingStartDate(initialQuery.bookingStartDate);
        setSubmittedBookingEndDate(initialQuery.bookingEndDate);
        setOpenFilter(false);
        setIsDatePanelOpen(false);
        setDatePickTarget('start');
        setNotice('筛选条件已重置');
    }
    function queryOrders() {
        setSubmittedKeyword(keyword.trim());
        setSubmittedFilter(filter);
        setSubmittedBookingStartDate(bookingStartDate);
        setSubmittedBookingEndDate(bookingEndDate);
        setOpenFilter(false);
        setNotice('已查询聚合分销订单');
    }
    function applyStoreScope(nextScope, noticeMessage) {
        setStoreScope(nextScope);
        setSubmittedStoreScope(nextScope);
        setOpenFilter(false);
        setIsDatePanelOpen(false);
        setNotice(noticeMessage);
        if (submittedStoreScope === nextScope) {
            setReloadToken((value) => value + 1);
        }
    }
    function reloadOrders(message = '已重新加载聚合分销订单') {
        setOpenFilter(false);
        setIsDatePanelOpen(false);
        setNotice(message);
        setReloadToken((value) => value + 1);
    }
    function openDatePanel(target = 'start') {
        setOpenFilter(false);
        setDatePickTarget(target);
        setDateDraft({ startDate: bookingStartDate, endDate: bookingEndDate });
        setCalendarMonth(bookingStartDate.slice(0, 7));
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
        setBookingStartDate(nextStartDate);
        setBookingEndDate(nextEndDate);
        setIsDatePanelOpen(false);
        setDatePickTarget('start');
    }
    const filterLabel = filter || '请选择';
    const pageTotal = data?.pagination.total ?? 0;
    const pageStart = pageTotal ? 1 : 0;
    const pageEnd = pageTotal ? pageTotal : 0;
    const serviceSummary = data?.requestSummary ?? [
        `provider=${getStatisticsDistributionOrderProviderName()}`,
        'mockState=success',
        'traceId=pending',
        `path=${statisticsDistributionOrderEndpoint}`,
        `campId=${query.campId ?? defaultStatisticsDistributionOrderCampId}`,
        `storeScope=${query.storeScope ?? 'all'}`,
        `bookingStartDate=${query.bookingStartDate}`,
        `bookingEndDate=${query.bookingEndDate}`,
        `keyword=${query.keyword?.trim() || ''}`,
        `settlementState=${query.settlementState || ''}`,
    ];
    return (_jsxs("div", { className: "distribution-order-page statistics-distribution-order-page", children: [_jsx("h1", { className: "sr-only-heading", children: "\u805A\u5408\u5206\u9500\u8BA2\u5355" }), _jsx("pre", { id: "statistics-distribution-service", hidden: true, "data-testid": "statistics-distribution-order-service-contract", "aria-label": "\u805A\u5408\u5206\u9500\u8BA2\u5355\u6570\u636E\u670D\u52A1", children: serviceSummary.join(';') }), _jsxs("section", { className: "order-ledger-filter statistics-distribution-filter", "aria-label": "\u805A\u5408\u5206\u9500\u8BA2\u5355\u7B5B\u9009", children: [_jsx("div", { className: "order-ledger-filter__top statistics-distribution-filter__top", children: _jsxs("div", { className: "order-ledger-store-row statistics-distribution-store", "aria-label": "\u95E8\u5E97", children: [_jsx("button", { type: "button", className: storeScope === 'all' ? 'is-active' : '', "aria-pressed": storeScope === 'all', onClick: () => applyStoreScope('all', '已刷新全部门店口径的聚合分销订单'), children: "\u5168\u90E8\u95E8\u5E97" }), _jsx("button", { type: "button", className: storeScope === 'current' ? 'is-active' : '', "aria-pressed": storeScope === 'current', onClick: () => applyStoreScope('current', '已刷新当前门店口径的聚合分销订单'), children: data?.campName ?? '天落会宿公寓(前海壹方城宝安中心店)' }), _jsx("button", { type: "button", className: "order-ledger-gear", "aria-label": "\u95E8\u5E97\u8BBE\u7F6E", onClick: () => navigate('/InformationMaintenance/campInfo'), children: "\u2699" })] }) }), expanded ? (_jsxs("div", { className: "order-ledger-filter__bottom statistics-distribution-filter__bottom", children: [_jsxs("label", { className: "statistics-distribution-field statistics-distribution-field--date", children: [_jsx("span", { children: "\u9884\u8BA2\u65F6\u95F4:" }), _jsxs("div", { ref: dateRangeRef, className: "order-ledger-date-range", "aria-label": "\u9884\u8BA2\u65F6\u95F4", role: "button", tabIndex: 0, onClick: () => openDatePanel('start'), onKeyDown: (event) => {
                                            if (event.key === 'Enter' || event.key === ' ') {
                                                event.preventDefault();
                                                openDatePanel('start');
                                            }
                                        }, children: [_jsx("button", { type: "button", className: "order-ledger-date-field", "aria-label": "\u9884\u8BA2\u5F00\u59CB\u65E5\u671F", onClick: (event) => {
                                                    event.stopPropagation();
                                                    openDatePanel('start');
                                                }, children: bookingStartDate }), _jsx("span", { children: "\u81F3" }), _jsx("button", { type: "button", className: "order-ledger-date-field", "aria-label": "\u9884\u8BA2\u7ED3\u675F\u65E5\u671F", onClick: (event) => {
                                                    event.stopPropagation();
                                                    openDatePanel('end');
                                                }, children: bookingEndDate }), _jsx("i", { "aria-hidden": "true" })] })] }), _jsxs("label", { className: "statistics-distribution-field statistics-distribution-field--keyword", children: [_jsx("span", { children: "\u8BA2\u5355\u641C\u7D22:" }), _jsx("input", { value: keyword, placeholder: "\u8BF7\u8F93\u5165\u8BA2\u5355\u7F16\u53F7/\u9884\u8BA2\u4EBA/\u624B\u673A\u53F7", onChange: (event) => setKeyword(event.target.value) })] }), _jsxs("div", { className: "statistics-distribution-field statistics-distribution-field--select", children: [_jsx("span", { children: "\u8BA2\u5355\u7B5B\u9009:" }), _jsxs("div", { className: "order-ledger-select-field statistics-distribution-select-shell", children: [_jsx("button", { type: "button", "aria-haspopup": "listbox", "aria-expanded": openFilter, "aria-label": `订单筛选 ${filterLabel}`, onClick: () => setOpenFilter((value) => !value), children: _jsx("strong", { children: filterLabel }) }), openFilter ? (_jsx("div", { className: "order-ledger-options statistics-distribution-options", role: "listbox", "aria-label": "\u8BA2\u5355\u7B5B\u9009\u9009\u9879", children: orderFilterOptions.map((option) => (_jsx("button", { type: "button", role: "option", "aria-selected": filter === option, onClick: () => {
                                                        setFilter(option);
                                                        setOpenFilter(false);
                                                    }, children: option }, option))) })) : null] })] }), _jsxs("div", { className: "statistics-distribution-actions", children: [_jsx("button", { type: "button", className: "statistics-distribution-toggle", onClick: () => {
                                            setExpanded(false);
                                            setOpenFilter(false);
                                            setIsDatePanelOpen(false);
                                        }, children: "\u6536\u8D77" }), _jsx("button", { type: "button", onClick: resetFilters, disabled: isLoading, children: "\u91CD\u7F6E" }), _jsx("button", { type: "button", className: "is-primary", onClick: queryOrders, disabled: isLoading, children: "\u67E5\u8BE2" }), _jsx("button", { type: "button", onClick: () => setNotice('已生成聚合分销订单导出任务'), disabled: isLoading || !data?.rows.length, children: "\u5BFC\u51FA\u660E\u7EC6" })] })] })) : (_jsx("div", { className: "statistics-distribution-actions statistics-distribution-actions--collapsed", children: _jsx("button", { type: "button", className: "statistics-distribution-toggle", onClick: () => {
                                setExpanded(true);
                                setOpenFilter(false);
                            }, children: "\u5C55\u5F00" }) }))] }), _jsx("div", { className: "sr-only-heading", role: "status", children: notice }), isDatePanelOpen ? (_jsx(DatePanel, { month: calendarMonth, startDate: dateDraft.startDate, endDate: dateDraft.endDate, pickTarget: datePickTarget, position: datePanelPosition, onClose: () => {
                    setIsDatePanelOpen(false);
                    setDatePickTarget('start');
                    setDateDraft({ startDate: bookingStartDate, endDate: bookingEndDate });
                }, onPrevious: () => setCalendarMonth((current) => shiftMonth(current, -1)), onNext: () => setCalendarMonth((current) => shiftMonth(current, 1)), onPick: applyDateSelection })) : null, error ? (_jsxs("div", { className: "distribution-order-alert", role: "alert", children: [_jsx("strong", { children: error }), _jsx("button", { type: "button", onClick: () => reloadOrders('已重新发起加载'), children: "\u91CD\u65B0\u52A0\u8F7D" })] })) : null, _jsx("section", { className: "distribution-order-table statistics-distribution-table", "aria-label": "\u805A\u5408\u5206\u9500\u8BA2\u5355\u8868\u683C", children: _jsxs("table", { children: [_jsx("thead", { children: _jsx("tr", { children: tableColumns.map((column) => (_jsx("th", { children: column }, column))) }) }), _jsx("tbody", { children: isLoading ? (_jsx("tr", { children: _jsx("td", { colSpan: 9, className: "statistics-distribution-table__cell", children: _jsx("div", { className: "distribution-order-empty", children: "\u6B63\u5728\u5237\u65B0\u805A\u5408\u5206\u9500\u8BA2\u5355" }) }) })) : error ? null : data?.rows.length ? (_jsxs(_Fragment, { children: [_jsxs("tr", { className: "is-summary", children: [_jsx("td", { children: "\u5408\u8BA1" }), _jsx("td", { children: "-" }), _jsx("td", { children: "-" }), _jsx("td", { children: "-" }), _jsx("td", { children: formatAmount(data.summary.paidAmount) }), _jsx("td", { children: formatAmount(data.summary.serviceFee) }), _jsx("td", { children: formatAmount(data.summary.settlementAmount) }), _jsx("td", { children: formatAmount(data.summary.settledAmount) }), _jsx("td", { children: "-" })] }), data.rows.map((row) => (_jsxs("tr", { children: [_jsx("td", { children: _jsx("span", { className: "statistics-distribution-order-id", children: row.orderId }) }), _jsx("td", { children: row.customerInfo }), _jsx("td", { children: row.roomCategoryName }), _jsx("td", { children: row.bookedTime }), _jsx("td", { children: formatAmount(row.paidAmount) }), _jsx("td", { children: formatAmount(row.serviceFee) }), _jsx("td", { children: formatAmount(row.settlementAmount) }), _jsx("td", { children: formatAmount(row.settledAmount) }), _jsx("td", { children: row.settlementStatus })] }, row.orderId)))] })) : (_jsx("tr", { children: _jsx("td", { colSpan: 9, className: "statistics-distribution-table__cell", children: _jsx("div", { className: "distribution-order-empty", children: "\u5F53\u524D\u6761\u4EF6\u6682\u65E0\u805A\u5408\u5206\u9500\u8BA2\u5355" }) }) })) })] }) }), _jsxs("div", { className: "distribution-order-pagination", "aria-label": "\u5206\u9875", children: [_jsxs("span", { children: ["\u7B2C ", pageStart, "-", pageEnd, " \u6761/\u603B\u5171 ", pageTotal, " \u6761"] }), _jsx("button", { type: "button", "aria-label": "\u4E0A\u4E00\u9875", disabled: true, children: "\u2039" }), _jsx("span", { className: "statistics-distribution-page-chip is-current", "aria-current": "page", children: "1" }), _jsx("button", { type: "button", "aria-label": "\u4E0B\u4E00\u9875", disabled: true, children: "\u203A" }), _jsx("button", { type: "button", onClick: () => setNotice('当前每页展示 20 条聚合分销订单'), children: "20 \u6761/\u9875" })] })] }));
}
function DatePanel({ month, startDate, endDate, pickTarget, position, onClose, onPrevious, onNext, onPick, }) {
    const months = [month, shiftMonth(month, 1)];
    return (_jsx("div", { className: "order-ledger-date-panel-wrap", role: "presentation", onMouseDown: onClose, children: _jsxs("section", { className: "order-ledger-date-panel", role: "dialog", "aria-label": "\u9884\u8BA2\u65F6\u95F4\u65E5\u671F\u9762\u677F", style: { top: `${position.top}px`, left: `${position.left}px` }, onMouseDown: (event) => event.stopPropagation(), children: [_jsxs("div", { className: "order-ledger-date-panel__header", children: [_jsx("strong", { children: pickTarget === 'start' ? '请选择开始日期' : '请选择结束日期' }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u9884\u8BA2\u65F6\u95F4\u65E5\u671F\u9762\u677F", onClick: onClose, children: "\u00D7" })] }), _jsxs("div", { className: "order-ledger-date-panel__range", children: [_jsx("span", { children: startDate }), _jsx("em", { children: "\u81F3" }), _jsx("span", { children: endDate })] }), _jsx("div", { className: "order-ledger-date-panel__months", children: months.map((item, index) => (_jsx(CalendarMonth, { month: item, startDate: startDate, endDate: endDate, onPrevious: index === 0 ? onPrevious : undefined, onNext: index === months.length - 1 ? onNext : undefined, onPick: onPick }, item))) })] }) }));
}
function CalendarMonth({ month, startDate, endDate, onPrevious, onNext, onPick, }) {
    const days = buildCalendarDays(month);
    return (_jsxs("section", { className: "order-ledger-calendar-month", "aria-label": formatMonthLabel(month), children: [_jsxs("header", { children: [_jsx("button", { type: "button", "aria-label": "\u4E0A\u4E2A\u6708", onClick: onPrevious, disabled: !onPrevious, children: "\u2039" }), _jsx("strong", { children: formatMonthLabel(month) }), _jsx("button", { type: "button", "aria-label": "\u4E0B\u4E2A\u6708", onClick: onNext, disabled: !onNext, children: "\u203A" })] }), _jsx("div", { className: "order-ledger-calendar-month__weekdays", children: ['一', '二', '三', '四', '五', '六', '日'].map((day) => (_jsx("span", { children: day }, day))) }), _jsx("div", { className: "order-ledger-calendar-month__days", children: days.map((day) => {
                    const inRange = day.date >= startDate && day.date <= endDate;
                    const isSelected = day.date === startDate || day.date === endDate;
                    return (_jsx("button", { type: "button", "aria-label": day.date, className: `${day.isMuted ? 'is-muted' : ''}${inRange ? ' is-in-range' : ''}${isSelected ? ' is-selected' : ''}`, onClick: () => onPick(day.date), children: day.label }, day.date));
                }) })] }));
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
function formatAmount(value) {
    return value.toFixed(2);
}
