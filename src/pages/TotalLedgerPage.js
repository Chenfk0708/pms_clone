import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { exportTotalLedger, getDefaultTotalLedgerQuery, getDefaultTotalLedgerRangeKey, getTotalLedgerProviderName, getTotalLedgerRangePresets, loadTotalLedgerData, } from '../services/totalLedger';
import './TotalLedgerPage.css';
const rangePresets = getTotalLedgerRangePresets();
const defaultQuery = getDefaultTotalLedgerQuery();
export function TotalLedgerPage() {
    const [activeStoreId, setActiveStoreId] = useState('all');
    const [query, setQuery] = useState(defaultQuery);
    const [activeRange, setActiveRange] = useState(getDefaultTotalLedgerRangeKey(defaultQuery));
    const [panelRange, setPanelRange] = useState(() => ({
        beginTime: defaultQuery.beginTime,
        endTime: defaultQuery.endTime,
    }));
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [reloadSeq, setReloadSeq] = useState(0);
    const [isDatePanelOpen, setIsDatePanelOpen] = useState(false);
    const [datePickTarget, setDatePickTarget] = useState('start');
    const [calendarMonth, setCalendarMonth] = useState(() => defaultQuery.beginTime.slice(0, 7));
    const [datePanelPosition, setDatePanelPosition] = useState({ top: 0, left: 0 });
    const [isExporting, setIsExporting] = useState(false);
    const dateRangeRef = useRef(null);
    const fetchData = useCallback(async (signal) => {
        setIsLoading(true);
        setError('');
        try {
            const result = await loadTotalLedgerData(query, signal);
            setData(result);
        }
        catch (loadError) {
            if (loadError instanceof DOMException && loadError.name === 'AbortError')
                return;
            setData(null);
            setError(loadError instanceof Error ? loadError.message : '收支汇总服务暂不可用，请稍后重试');
        }
        finally {
            setIsLoading(false);
        }
    }, [query]);
    useEffect(() => {
        const controller = new AbortController();
        queueMicrotask(() => {
            if (!controller.signal.aborted) {
                void fetchData(controller.signal);
            }
        });
        return () => controller.abort();
    }, [fetchData, reloadSeq]);
    const contractProvider = data?.provider ?? getTotalLedgerProviderName();
    const contractMockState = data?.mockState ?? readCurrentMockState();
    const requestBody = data?.requestBody ?? query;
    const stores = data?.stores ?? [
        { id: 'all', label: '全部门店' },
        { id: defaultQuery.campId, label: '天落会宿公寓(前海壹方城宝安中心店)' },
    ];
    const activeStoreLabel = stores.find((item) => item.id === activeStoreId)?.label ?? '全部门店';
    const pageStart = data?.pagination.total ? 1 : 0;
    const pageEnd = data?.pagination.total ? Math.min(data.pagination.total, data.pagination.pageSize) : 0;
    const ratioCards = useMemo(() => [
        {
            title: '收入占比',
            items: data?.income ?? [],
            total: data?.summary.totalIncomePrice ?? 0,
            emptyText: '暂无数据',
        },
        {
            title: '支出占比',
            items: data?.expend.filter((item) => item.price > 0) ?? [],
            total: data?.summary.totalExpendPrice ?? 0,
            emptyText: '暂无数据',
        },
    ], [data]);
    function openDatePanel(target = 'start') {
        setDatePickTarget(target);
        setPanelRange({ beginTime: query.beginTime, endTime: query.endTime });
        setCalendarMonth(query.beginTime.slice(0, 7));
        const rect = dateRangeRef.current?.getBoundingClientRect();
        if (rect) {
            setDatePanelPosition({
                top: rect.bottom + 8,
                left: Math.max(16, Math.min(rect.left, window.innerWidth - 624)),
            });
        }
        setIsDatePanelOpen(true);
    }
    function applyRange(nextRange) {
        const preset = rangePresets.find((item) => item.key === nextRange);
        if (!preset)
            return;
        setActiveRange(nextRange);
        setPanelRange({ beginTime: preset.beginTime, endTime: preset.endTime });
        setQuery((current) => ({
            ...current,
            beginTime: preset.beginTime,
            endTime: preset.endTime,
            pageNum: 1,
        }));
        setIsDatePanelOpen(false);
        setDatePickTarget('start');
    }
    function applyStore(storeId) {
        setActiveStoreId(storeId);
        setQuery((current) => ({
            ...current,
            poiIds: storeId === 'all' ? [] : [storeId],
            pageNum: 1,
        }));
    }
    function applyDateSelection(date) {
        if (datePickTarget === 'start') {
            const nextEndTime = date <= panelRange.endTime ? panelRange.endTime : date;
            setPanelRange({ beginTime: date, endTime: nextEndTime });
            setDatePickTarget('end');
            return;
        }
        const nextBeginTime = date < panelRange.beginTime ? date : panelRange.beginTime;
        const nextEndTime = date < panelRange.beginTime ? panelRange.beginTime : date;
        setPanelRange({ beginTime: nextBeginTime, endTime: nextEndTime });
        setQuery((current) => ({
            ...current,
            beginTime: nextBeginTime,
            endTime: nextEndTime,
            pageNum: 1,
        }));
        setActiveRange(resolveRangeKey(nextBeginTime, nextEndTime));
        setDatePickTarget('start');
        setIsDatePanelOpen(false);
    }
    function resetFilters() {
        setActiveStoreId('all');
        setActiveRange(getDefaultTotalLedgerRangeKey(defaultQuery));
        setPanelRange({ beginTime: defaultQuery.beginTime, endTime: defaultQuery.endTime });
        setQuery(defaultQuery);
        setIsDatePanelOpen(false);
        setDatePickTarget('start');
        setError('');
    }
    async function handleExport() {
        setIsExporting(true);
        setError('');
        try {
            await exportTotalLedger(query);
        }
        catch (exportError) {
            setError(exportError instanceof Error ? exportError.message : '收支汇总导出失败，请稍后重试');
        }
        finally {
            setIsExporting(false);
        }
    }
    function retryLoad() {
        setReloadSeq((current) => current + 1);
    }
    return (_jsxs("div", { className: "total-ledger-page", children: [_jsx("div", { "data-testid": "total-ledger-service-contract", "data-provider": contractProvider, "data-endpoint": "/accountBookPaymentWay/page/get", "data-export-endpoint": "/accountBookPaymentWay/page/get", "data-mock-state": contractMockState, "data-request-body": JSON.stringify(requestBody), hidden: true }), _jsx("h1", { className: "sr-only-heading", children: "\u6536\u652F\u6C47\u603B" }), _jsxs("section", { className: "total-ledger-filter", "aria-label": "\u6536\u652F\u6C47\u603B\u7B5B\u9009", children: [_jsx("div", { className: "total-ledger-store-head", children: _jsx("div", { className: "total-ledger-store-row", role: "radiogroup", "aria-label": "\u95E8\u5E97", children: stores.map((store) => (_jsx("button", { type: "button", role: "radio", "aria-checked": activeStoreId === store.id, className: activeStoreId === store.id ? 'is-active' : '', onClick: () => applyStore(store.id), disabled: isLoading || isExporting, children: store.label }, store.id))) }) }), _jsxs("div", { className: "total-ledger-query-row", children: [_jsxs("div", { className: "total-ledger-query-main", children: [_jsx("div", { className: "total-ledger-range-buttons", role: "group", "aria-label": "\u65E5\u671F\u5FEB\u6377\u7B5B\u9009", children: rangePresets.map((range) => (_jsx("button", { type: "button", className: activeRange === range.key ? 'is-active' : '', onClick: () => applyRange(range.key), disabled: isLoading || isExporting, children: range.label }, range.key))) }), _jsxs("div", { ref: dateRangeRef, className: "total-ledger-date-range", role: "button", tabIndex: 0, "aria-label": "\u6536\u652F\u6C47\u603B\u65E5\u671F\u8303\u56F4", onClick: () => openDatePanel('start'), onKeyDown: (event) => {
                                            if (event.key === 'Enter' || event.key === ' ') {
                                                event.preventDefault();
                                                openDatePanel('start');
                                            }
                                        }, children: [_jsx("button", { type: "button", className: "total-ledger-date-field", "aria-label": "\u5F00\u59CB\u65E5\u671F", onClick: (event) => {
                                                    event.stopPropagation();
                                                    openDatePanel('start');
                                                }, children: _jsx("span", { children: query.beginTime }) }), _jsx("em", { "aria-hidden": "true", children: "\u81F3" }), _jsx("button", { type: "button", className: "total-ledger-date-field", "aria-label": "\u7ED3\u675F\u65E5\u671F", onClick: (event) => {
                                                    event.stopPropagation();
                                                    openDatePanel('end');
                                                }, children: _jsx("span", { children: query.endTime }) }), _jsx("i", { "aria-hidden": "true" })] })] }), _jsxs("div", { className: "total-ledger-actions", children: [_jsx("button", { type: "button", className: "is-outline", onClick: resetFilters, disabled: isLoading || isExporting, children: "\u91CD\u7F6E" }), _jsx("button", { type: "button", className: "is-primary", onClick: () => void handleExport(), disabled: isLoading || isExporting || Boolean(error), children: isExporting ? '导出中...' : '导出' })] })] })] }), isDatePanelOpen ? (_jsx(DatePanel, { month: calendarMonth, startDate: panelRange.beginTime, endDate: panelRange.endTime, pickTarget: datePickTarget, position: datePanelPosition, onClose: () => {
                    setIsDatePanelOpen(false);
                    setDatePickTarget('start');
                    setPanelRange({ beginTime: query.beginTime, endTime: query.endTime });
                }, onPrevious: () => setCalendarMonth((current) => shiftMonth(current, -1)), onNext: () => setCalendarMonth((current) => shiftMonth(current, 1)), onPick: applyDateSelection })) : null, _jsx("div", { className: "sr-only-heading", role: "status", "aria-label": "\u6536\u652F\u6C47\u603B\u64CD\u4F5C\u53CD\u9988", children: isLoading ? '正在加载收支汇总' : '' }), error ? (_jsxs("div", { className: "total-ledger-alert", role: "alert", children: [_jsx("strong", { children: error }), _jsx("button", { type: "button", onClick: retryLoad, children: "\u91CD\u65B0\u52A0\u8F7D" })] })) : null, _jsxs("section", { className: "total-ledger-summary", "aria-label": "\u8D26\u672C\u6982\u51B5", children: [_jsxs("article", { className: "total-ledger-card total-ledger-balance-card", children: [_jsx("div", { className: "total-ledger-card__head", children: _jsx("h2", { children: "\u8D26\u672C\u6982\u51B5" }) }), _jsxs("div", { className: "total-ledger-balance", children: [_jsx("div", { className: "total-ledger-balance__icon", children: "\u51C0\u6536\u5165" }), _jsxs("div", { className: "total-ledger-balance__content", children: [_jsx("span", { children: activeStoreLabel }), _jsx("strong", { children: formatCurrency(data?.summary.netIncome ?? 0) }), _jsxs("p", { children: ["\u603B\u6536\u5165\uFF1A", formatCurrency(data?.summary.totalIncomePrice ?? 0)] }), _jsxs("p", { children: ["\u603B\u652F\u51FA\uFF1A", formatCurrency(data?.summary.totalExpendPrice ?? 0)] })] })] })] }), ratioCards.map((card) => (_jsx(RatioCard, { title: card.title, items: card.items, total: card.total, emptyText: card.emptyText }, card.title)))] }), _jsxs("section", { className: "total-ledger-table-section", "aria-label": "\u6536\u652F\u6C47\u603B\u8868", children: [_jsx("div", { className: "total-ledger-table-section__head", children: _jsx("h2", { children: "\u6536\u652F\u6C47\u603B\u8868" }) }), _jsx("div", { className: "total-ledger-table-wrap", children: error ? null : isLoading ? (_jsx("div", { className: "total-ledger-table-loading", children: "\u6B63\u5728\u52A0\u8F7D\u6570\u636E" })) : data?.rows.length ? (_jsxs(_Fragment, { children: [_jsxs("table", { className: "total-ledger-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "\u65E5\u671F" }), data.paymentWays.map((way) => (_jsx("th", { children: way.paymentWayName }, way.paymentWayId)))] }) }), _jsx("tbody", { children: data.rows.map((row) => (_jsxs("tr", { className: row.date === '合计' ? 'is-summary' : '', children: [_jsx("td", { children: row.date }), data.paymentWays.map((way) => (_jsx("td", { children: formatAmount(row.values[way.paymentWayId] ?? 0) }, `${row.date}-${way.paymentWayId}`)))] }, row.date))) })] }), _jsxs("nav", { className: "total-ledger-pagination", "aria-label": "\u5206\u9875", children: [_jsxs("span", { children: ["\u7B2C ", pageStart, "-", pageEnd, " \u6761\uFF0C\u5171 ", data.pagination.total, " \u6761"] }), _jsx("button", { type: "button", className: "is-current", children: data.pagination.current })] })] })) : (_jsxs(_Fragment, { children: [_jsx("div", { className: "total-ledger-empty", role: "status", "aria-label": "\u6536\u652F\u6C47\u603B\u7A7A\u72B6\u6001", children: "\u5F53\u524D\u6761\u4EF6\u6682\u65E0\u6536\u652F\u6C47\u603B\u6570\u636E" }), _jsxs("nav", { className: "total-ledger-pagination", "aria-label": "\u5206\u9875", children: [_jsx("span", { children: "\u7B2C 0-0 \u6761\uFF0C\u5171 0 \u6761" }), _jsx("button", { type: "button", className: "is-current", children: "1" })] })] })) })] })] }));
}
function RatioCard({ title, items, total, emptyText, }) {
    const hasValues = items.length > 0 && total > 0;
    const chartStyle = hasValues ? { backgroundImage: buildConicGradient(items, total) } : undefined;
    return (_jsxs("article", { className: "total-ledger-card total-ledger-ratio-card", "aria-label": title, children: [_jsx("div", { className: "total-ledger-card__head", children: _jsx("h2", { children: title }) }), hasValues ? (_jsxs("div", { className: "total-ledger-ratio-body", children: [_jsx("div", { className: "total-ledger-donut", style: chartStyle, children: _jsx("span", { children: formatPercent(items[0]?.price ?? 0, total) }) }), _jsx("ul", { className: "total-ledger-ratio-legend", children: items.map((item, index) => (_jsxs("li", { children: [_jsx("i", { style: { background: pickChartColor(index) } }), _jsx("span", { children: item.paymentWayName }), _jsx("strong", { children: formatPercent(item.price, total) })] }, `${title}-${item.paymentWayId}`))) })] })) : (_jsx("div", { className: "total-ledger-ratio-empty", children: emptyText }))] }));
}
function DatePanel({ month, startDate, endDate, pickTarget, position, onClose, onPrevious, onNext, onPick, }) {
    const months = [month, shiftMonth(month, 1)];
    return (_jsx("div", { className: "total-ledger-date-panel-wrap", role: "presentation", onMouseDown: onClose, children: _jsxs("section", { className: "total-ledger-date-panel", role: "dialog", "aria-label": "\u6536\u652F\u6C47\u603B\u65E5\u671F\u9762\u677F", style: { top: `${position.top}px`, left: `${position.left}px` }, onMouseDown: (event) => event.stopPropagation(), children: [_jsxs("div", { className: "total-ledger-date-panel__header", children: [_jsx("strong", { children: pickTarget === 'start' ? '请选择开始日期' : '请选择结束日期' }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u6536\u652F\u6C47\u603B\u65E5\u671F\u9762\u677F", onClick: onClose, children: "\u00D7" })] }), _jsxs("div", { className: "total-ledger-date-panel__range", children: [_jsx("span", { children: startDate }), _jsx("em", { children: "\u81F3" }), _jsx("span", { children: endDate })] }), _jsx("div", { className: "total-ledger-date-panel__months", children: months.map((item, index) => (_jsx(CalendarMonth, { month: item, startDate: startDate, endDate: endDate, onPrevious: index === 0 ? onPrevious : undefined, onNext: index === months.length - 1 ? onNext : undefined, onPick: onPick }, item))) })] }) }));
}
function CalendarMonth({ month, startDate, endDate, onPrevious, onNext, onPick, }) {
    const days = buildCalendarDays(month);
    return (_jsxs("section", { className: "total-ledger-calendar-month", "aria-label": formatMonthLabel(month), children: [_jsxs("header", { children: [_jsx("button", { type: "button", "aria-label": "\u4E0A\u4E2A\u6708", onClick: onPrevious, disabled: !onPrevious, children: "\u2039" }), _jsx("strong", { children: formatMonthLabel(month) }), _jsx("button", { type: "button", "aria-label": "\u4E0B\u4E2A\u6708", onClick: onNext, disabled: !onNext, children: "\u203A" })] }), _jsx("div", { className: "total-ledger-calendar-month__weekdays", children: ['一', '二', '三', '四', '五', '六', '日'].map((day) => (_jsx("span", { children: day }, day))) }), _jsx("div", { className: "total-ledger-calendar-month__days", children: days.map((day) => {
                    const inRange = day.date >= startDate && day.date <= endDate;
                    const isSelected = day.date === startDate || day.date === endDate;
                    return (_jsx("button", { type: "button", "aria-label": day.date, className: `${day.isMuted ? 'is-muted' : ''}${inRange ? ' is-in-range' : ''}${isSelected ? ' is-selected' : ''}`, onClick: () => onPick(day.date), children: day.label }, day.date));
                }) })] }));
}
function resolveRangeKey(beginTime, endTime) {
    return rangePresets.find((item) => item.beginTime === beginTime && item.endTime === endTime)?.key ?? '';
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
function formatCurrency(value) {
    return `¥${value.toFixed(2)}`;
}
function formatAmount(value) {
    return value.toFixed(2);
}
function formatPercent(value, total) {
    if (total <= 0)
        return '0.00%';
    return `${((value / total) * 100).toFixed(2)}%`;
}
function buildConicGradient(items, total) {
    let start = 0;
    const segments = items.map((item, index) => {
        const ratio = total <= 0 ? 0 : (item.price / total) * 100;
        const end = start + ratio;
        const segment = `${pickChartColor(index)} ${start}% ${end}%`;
        start = end;
        return segment;
    });
    if (!segments.length)
        return 'none';
    return `conic-gradient(${segments.join(', ')})`;
}
function pickChartColor(index) {
    const palette = ['#4d65f6', '#43b581', '#ff8a3d', '#f2c94c'];
    return palette[index % palette.length];
}
function readCurrentMockState() {
    if (typeof window === 'undefined')
        return 'success';
    const configured = readMockModeFromSearch(window.location.search) ||
        readMockModeFromSearch(window.location.hash.split('?')[1] ? `?${window.location.hash.split('?')[1]}` : '') ||
        window.localStorage.getItem('pms.totalLedgerMockMode')?.trim() ||
        '';
    return configured === 'empty' || configured === 'error' || configured === 'success' ? configured : 'success';
}
function readMockModeFromSearch(search) {
    const params = new URLSearchParams(search);
    return params.get('mockState') || params.get('totalLedgerMockMode') || '';
}
