import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPreSaleCouponMallExportTask, defaultPreSaleCouponMallQuery, fetchPreSaleCouponMallDashboard, PreSaleCouponMallServiceError, } from '../services/preSaleCouponMallReport';
import './PresaleCouponMallReportPage.css';
const datePresetOptions = [
    { key: 'yesterday', label: '昨天' },
    { key: 'thisWeek', label: '本周' },
    { key: 'thisMonth', label: '本月' },
    { key: 'lastMonth', label: '上月' },
];
export function PresaleCouponMallReportPage() {
    const navigate = useNavigate();
    const [draft, setDraft] = useState(() => makeInitialQuery());
    const [query, setQuery] = useState(() => makeInitialQuery());
    const [dashboard, setDashboard] = useState(null);
    const [serviceError, setServiceError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [openSelect, setOpenSelect] = useState(null);
    const [datePanelOpen, setDatePanelOpen] = useState(false);
    const [storeView, setStoreView] = useState('all');
    const [calendarMonth, setCalendarMonth] = useState(() => makeInitialQuery().startDate.slice(0, 7));
    const [datePickTarget, setDatePickTarget] = useState('start');
    const [descriptionOpen, setDescriptionOpen] = useState(false);
    const [selectedRow, setSelectedRow] = useState(null);
    useEffect(() => {
        const controller = new AbortController();
        async function run() {
            setIsLoading(true);
            setServiceError(null);
            try {
                const nextDashboard = await fetchPreSaleCouponMallDashboard(query, controller.signal);
                setDashboard(nextDashboard);
            }
            catch (error) {
                if (error instanceof DOMException && error.name === 'AbortError')
                    return;
                if (error instanceof PreSaleCouponMallServiceError) {
                    setServiceError(error);
                    setDashboard(null);
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
    useEffect(() => {
        function handleKeyDown(event) {
            if (event.key !== 'Escape')
                return;
            setOpenSelect(null);
            setDatePanelOpen(false);
            setDescriptionOpen(false);
            setSelectedRow(null);
        }
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);
    const diagnosticsState = dashboard?.state ?? serviceError?.state ?? query.state ?? 'success';
    const diagnosticsProvider = dashboard?.provider ?? serviceError?.provider ?? 'mock';
    const diagnosticsRequest = dashboard?.request ?? serviceError?.request ?? query;
    const rows = dashboard?.rows ?? [];
    const channels = dashboard?.channels ?? [{ value: '', label: '全部渠道' }];
    const categories = dashboard?.categories ?? [{ value: '', label: '全部类型' }];
    const descriptions = dashboard?.descriptions ?? [];
    const defaultStore = defaultPreSaleCouponMallQuery();
    const currentStore = dashboard?.stores[0] ?? {
        id: defaultStore.poiId,
        name: defaultStore.poiName,
    };
    const activePreset = findMatchingPreset(draft.startDate, draft.endDate);
    function updateDraft(next) {
        setDraft((current) => ({ ...current, ...next }));
    }
    function applyFilters() {
        setQuery({ ...draft, page: 1 });
        setOpenSelect(null);
        setDatePanelOpen(false);
    }
    function resetFilters() {
        const nextQuery = createAllStoreQuery();
        setDraft(nextQuery);
        setQuery(nextQuery);
        setStoreView('all');
        setCalendarMonth(nextQuery.startDate.slice(0, 7));
        setDatePickTarget('start');
        setOpenSelect(null);
        setDatePanelOpen(false);
    }
    function refresh() {
        setQuery((current) => ({ ...current }));
        setOpenSelect(null);
        setDatePanelOpen(false);
    }
    async function exportRows() {
        setIsLoading(true);
        try {
            await createPreSaleCouponMallExportTask(query);
        }
        finally {
            setIsLoading(false);
        }
    }
    function chooseOption(kind, value) {
        updateDraft(kind === 'channel' ? { channelId: value } : { categoryId: value });
        setOpenSelect(null);
    }
    function switchStore(nextView) {
        setStoreView(nextView);
        setOpenSelect(null);
        setDatePanelOpen(false);
        if (nextView === 'all') {
            updateDraft({ poiId: 'all', poiName: '全部门店' });
            return;
        }
        updateDraft({ poiId: currentStore.id, poiName: currentStore.name });
    }
    function openDatePanel(target = 'start') {
        setOpenSelect(null);
        setDatePickTarget(target);
        setCalendarMonth(draft.startDate.slice(0, 7));
        setDatePanelOpen(true);
    }
    function pickDate(date) {
        if (datePickTarget === 'start') {
            updateDraft({
                startDate: date,
                endDate: date <= draft.endDate ? draft.endDate : date,
            });
            setDatePickTarget('end');
            return;
        }
        updateDraft({
            startDate: date < draft.startDate ? date : draft.startDate,
            endDate: date < draft.startDate ? draft.startDate : date,
        });
        setDatePickTarget('start');
        setDatePanelOpen(false);
    }
    function applyPreset(preset) {
        const nextRange = buildPresetRange(preset);
        updateDraft(nextRange);
        setCalendarMonth(nextRange.startDate.slice(0, 7));
        setDatePickTarget('start');
        setDatePanelOpen(false);
    }
    return (_jsxs("div", { className: "presale-coupon-report-page", children: [_jsx("h1", { className: "sr-only-heading", children: "\u9884\u552E\u5238\u6838\u9500\u660E\u7EC6" }), _jsx("output", { id: "pre-sale-coupon-mall-diagnostics", hidden: true, "data-provider": diagnosticsProvider, "data-state": diagnosticsState, "data-request": JSON.stringify(diagnosticsRequest) }), _jsxs("section", { className: "presale-coupon-query", "aria-label": "\u9884\u552E\u5238\u6570\u636E\u7B5B\u9009", children: [_jsxs("div", { className: "presale-coupon-store-switch", "aria-label": "\u95E8\u5E97\u5207\u6362", children: [_jsx("button", { type: "button", className: storeView === 'all' ? 'is-active' : '', "aria-pressed": storeView === 'all', onClick: () => switchStore('all'), children: "\u5168\u90E8\u95E8\u5E97" }), _jsx("button", { type: "button", className: `is-store${storeView === 'current' ? ' is-active' : ''}`, "aria-pressed": storeView === 'current', title: currentStore.name, onClick: () => switchStore('current'), children: currentStore.name }), _jsx("button", { type: "button", className: "is-setting", "aria-label": "\u6253\u5F00\u95E8\u5E97\u4FE1\u606F\u8BBE\u7F6E", onClick: () => navigate('/InformationMaintenance/campInfo'), children: _jsx("span", { "aria-hidden": "true", children: "\u2699" }) })] }), _jsxs("div", { className: "presale-coupon-filter-row", children: [_jsxs("div", { className: "presale-coupon-date-range", children: [_jsx("span", { children: "\u7EDF\u8BA1\u65E5\u671F:" }), _jsxs("button", { type: "button", className: "presale-coupon-date-trigger", "aria-label": "\u7EDF\u8BA1\u65E5\u671F", onClick: () => openDatePanel('start'), children: [_jsx("strong", { children: draft.startDate }), _jsx("em", { children: "\u81F3" }), _jsx("strong", { children: draft.endDate }), _jsx("i", { "aria-hidden": "true", children: "\uD83D\uDCC5" })] }), datePanelOpen ? (_jsx(DatePanel, { month: calendarMonth, startDate: draft.startDate, endDate: draft.endDate, pickTarget: datePickTarget, activePreset: activePreset, onPrevious: () => setCalendarMonth((current) => shiftMonth(current, -1)), onNext: () => setCalendarMonth((current) => shiftMonth(current, 1)), onPick: pickDate, onPreset: applyPreset })) : null] }), _jsx(SelectField, { label: "\u6E20\u9053:", displayValue: labelForOption(channels, draft.channelId, '请选择'), isOpen: openSelect === 'channel', options: channels, currentValue: draft.channelId, ariaLabel: "\u5A13\u72BB\u4EBE\u95AB\u5910\u300D", onToggle: () => {
                                    setDatePanelOpen(false);
                                    setOpenSelect(openSelect === 'channel' ? null : 'channel');
                                }, onSelect: (value) => chooseOption('channel', value) }), _jsx(SelectField, { label: "\u9884\u552E\u5238\u7C7B\u578B:", displayValue: labelForOption(categories, draft.categoryId, '请选择'), isOpen: openSelect === 'category', options: categories, currentValue: draft.categoryId, ariaLabel: "\u68F0\u52EB\u656D\u9352\u54E5\u88AB\u9368\u5B2E\u20AC\u5910\u300D", onToggle: () => {
                                    setDatePanelOpen(false);
                                    setOpenSelect(openSelect === 'category' ? null : 'category');
                                }, onSelect: (value) => chooseOption('category', value) }), _jsxs("label", { className: "presale-coupon-keyword", children: [_jsx("span", { children: "\u5546\u54C1\u641C\u7D22:" }), _jsx("input", { value: draft.keyword, placeholder: "\u8BF7\u8F93\u5165\u5546\u54C1\u7F16\u53F7/\u5546\u54C1\u540D\u79F0", onChange: (event) => updateDraft({ keyword: event.target.value }) })] })] }), _jsxs("div", { className: "presale-coupon-actions", children: [_jsx("button", { type: "button", className: "is-outline", onClick: resetFilters, disabled: isLoading, children: "\u91CD\u7F6E" }), _jsx("button", { type: "button", className: "is-primary", onClick: applyFilters, disabled: isLoading, children: "\u67E5\u8BE2" }), _jsx("button", { type: "button", className: "is-outline", onClick: exportRows, disabled: isLoading, children: "\u5BFC\u51FA" }), _jsx("button", { type: "button", className: "is-outline", onClick: () => {
                                    setOpenSelect(null);
                                    setDatePanelOpen(false);
                                    setDescriptionOpen(true);
                                }, children: "\u8BF4\u660E" })] })] }), serviceError ? (_jsxs("section", { className: "presale-coupon-alert", role: "alert", children: [_jsx("strong", { children: "\u9884\u552E\u5238\u6838\u9500\u660E\u7EC6\u52A0\u8F7D\u5931\u8D25" }), _jsx("span", { children: "\u8BF7\u7A0D\u540E\u91CD\u8BD5\uFF0C\u6216\u8C03\u6574\u7B5B\u9009\u6761\u4EF6\u540E\u91CD\u65B0\u52A0\u8F7D\u3002" }), _jsx("button", { type: "button", onClick: refresh, children: "\u91CD\u65B0\u52A0\u8F7D" })] })) : null, _jsx("section", { className: "presale-coupon-metrics", "aria-label": "\u9884\u552E\u5238\u6838\u9500\u6307\u6807", children: (dashboard?.metrics ?? []).map((metric) => (_jsx(MetricCard, { metric: metric }, metric.key))) }), _jsxs("section", { className: "presale-coupon-table-wrap", "aria-label": "\u9884\u552E\u5238\u6570\u636E\u8868\u683C", children: [_jsxs("table", { className: "presale-coupon-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "\u5546\u54C1\u540D\u79F0" }), _jsx("th", { children: "\u9884\u552E\u5238\u7C7B\u578B" }), _jsx("th", { children: "\u6E20\u9053" }), _jsx("th", { children: "\u6210\u4EA4\u5238\u6570" }), _jsx("th", { children: "\u4EA4\u6613\u91D1\u989D" }), _jsx("th", { children: "\u6210\u4EA4\u7387" }), _jsx("th", { children: "\u6838\u9500\u5238\u6570" }), _jsx("th", { children: "\u6838\u9500\u91D1\u989D" }), _jsx("th", { children: "\u6838\u9500\u7387" }), _jsx("th", { children: "\u9000\u6B3E\u5238\u6570" }), _jsx("th", { children: "\u9000\u6B3E\u91D1\u989D" }), _jsx("th", { children: "\u9000\u6B3E\u7387" }), _jsx("th", { children: "\u64CD\u4F5C" })] }) }), _jsx("tbody", { children: rows.map((row) => (_jsxs("tr", { children: [_jsx("td", { children: row.preSaleName }), _jsx("td", { children: row.categoryName }), _jsx("td", { children: row.channelName }), _jsx("td", { children: row.makeBargainCount }), _jsx("td", { children: formatAmount(row.transactionPrice) }), _jsx("td", { children: row.turnoverRate }), _jsx("td", { children: row.writeOffCount }), _jsx("td", { children: formatAmount(row.writeOffPrice) }), _jsx("td", { children: row.writeOffRate }), _jsx("td", { children: row.refundCount }), _jsx("td", { children: formatAmount(row.refundPrice) }), _jsx("td", { children: row.refundRate }), _jsx("td", { children: _jsx("button", { type: "button", className: "presale-coupon-link", "aria-label": `查看详情 ${row.preSaleName}`, onClick: () => setSelectedRow(row), children: "\u67E5\u770B\u8BE6\u60C5" }) })] }, row.id))) })] }), !isLoading && !serviceError && rows.length === 0 ? (_jsxs("div", { className: "presale-coupon-empty", role: "status", children: [_jsx("span", { className: "presale-coupon-empty-icon", "aria-hidden": "true" }), _jsx("strong", { children: "\u5F53\u524D\u7B5B\u9009\u6761\u4EF6\u4E0B\u6682\u65E0\u6838\u9500\u660E\u7EC6" })] })) : null] }), descriptionOpen ? (_jsx(DescriptionDialog, { descriptions: descriptions, onClose: () => setDescriptionOpen(false) })) : null, selectedRow ? _jsx(DetailDialog, { row: selectedRow, onClose: () => setSelectedRow(null) }) : null] }));
}
function makeInitialQuery() {
    const query = createAllStoreQuery();
    const params = new URLSearchParams(window.location.search);
    const mockState = params.get('mockState');
    if (mockState === 'empty' || mockState === 'error')
        query.state = mockState;
    return query;
}
function createAllStoreQuery() {
    const query = defaultPreSaleCouponMallQuery();
    return {
        ...query,
        poiId: 'all',
        poiName: '全部门店',
    };
}
function labelForOption(options, value, fallback) {
    return options.find((option) => option.value === value)?.label ?? fallback;
}
function formatAmount(value) {
    return value.toLocaleString('zh-CN');
}
function SelectField({ label, displayValue, isOpen, options, currentValue, ariaLabel, onToggle, onSelect, }) {
    return (_jsxs("div", { className: "presale-coupon-select-field", children: [_jsx("span", { children: label }), _jsxs("div", { className: "presale-coupon-select-field__control", children: [_jsx("button", { type: "button", "aria-haspopup": "listbox", "aria-expanded": isOpen, "aria-label": `${label} ${displayValue}`, onClick: onToggle, children: displayValue }), isOpen ? (_jsx(SelectOptions, { ariaLabel: ariaLabel, options: options, currentValue: currentValue, onSelect: onSelect })) : null] })] }));
}
function SelectOptions({ ariaLabel, options, currentValue, onSelect, }) {
    const availableOptions = options.filter((option) => option.value !== '');
    return (_jsx("div", { className: "presale-coupon-options", role: "listbox", "aria-label": ariaLabel, children: availableOptions.length > 0 ? (availableOptions.map((option) => (_jsx("button", { type: "button", role: "option", "aria-selected": currentValue === option.value, onClick: () => onSelect(option.value), children: option.label }, option.value || option.label)))) : (_jsxs("div", { className: "presale-coupon-options-empty", children: [_jsx("span", { className: "presale-coupon-options-empty__icon", "aria-hidden": "true" }), _jsx("strong", { children: "\u93C6\u509B\u68E4\u93C1\u7248\u5D41" })] })) }));
}
function MetricCard({ metric }) {
    return (_jsxs("button", { type: "button", className: "presale-coupon-metric", "aria-label": metric.title, children: [_jsx("span", { children: metric.title }), _jsxs("strong", { children: [formatAmount(metric.value), _jsx("em", { children: metric.unit })] }), _jsx("small", { children: metric.detail })] }));
}
function DatePanel({ month, startDate, endDate, pickTarget, activePreset, onPrevious, onNext, onPick, onPreset, }) {
    const months = [month, shiftMonth(month, 1)];
    return (_jsxs("div", { className: "presale-coupon-date-panel", role: "dialog", "aria-label": "\u7EDF\u8BA1\u65E5\u671F\u9762\u677F", children: [_jsxs("div", { className: "presale-coupon-date-presets", children: [_jsx("span", { children: pickTarget === 'start' ? '请选择开始日期' : '请选择结束日期' }), datePresetOptions.map((preset) => (_jsx("button", { type: "button", className: activePreset === preset.key ? 'is-active' : '', onClick: () => onPreset(preset.key), children: preset.label }, preset.key)))] }), _jsx("div", { className: "presale-coupon-date-months", children: months.map((item, index) => (_jsx(CalendarMonth, { month: item, startDate: startDate, endDate: endDate, onPrevious: index === 0 ? onPrevious : undefined, onNext: index === months.length - 1 ? onNext : undefined, onPick: onPick }, item))) })] }));
}
function CalendarMonth({ month, startDate, endDate, onPrevious, onNext, onPick, }) {
    const days = buildCalendarDays(month);
    return (_jsxs("section", { className: "presale-coupon-calendar-month", children: [_jsxs("header", { children: [_jsx("button", { type: "button", "aria-label": "\u4E0A\u4E2A\u6708", onClick: onPrevious, disabled: !onPrevious, children: "\u2039" }), _jsx("h2", { children: formatMonthLabel(month) }), _jsx("button", { type: "button", "aria-label": "\u4E0B\u4E2A\u6708", onClick: onNext, disabled: !onNext, children: "\u203A" })] }), _jsx("div", { className: "presale-coupon-calendar-weekdays", children: ['一', '二', '三', '四', '五', '六', '日'].map((weekday) => (_jsx("span", { children: weekday }, weekday))) }), _jsx("div", { className: "presale-coupon-calendar-days", children: days.map((day) => (_jsx("button", { type: "button", className: `${day.isMuted ? 'is-muted' : ''}${day.date >= startDate && day.date <= endDate ? ' is-in-range' : ''}${day.date === startDate || day.date === endDate ? ' is-picked' : ''}`, onClick: () => onPick(day.date), children: day.label }, day.date))) })] }));
}
function DescriptionDialog({ descriptions, onClose, }) {
    return (_jsx("div", { className: "presale-coupon-modal-backdrop", role: "presentation", onClick: onClose, children: _jsxs("section", { className: "presale-coupon-description-modal", role: "dialog", "aria-modal": "true", "aria-label": "\u5B57\u6BB5\u8BF4\u660E", onClick: (event) => event.stopPropagation(), children: [_jsxs("header", { children: [_jsx("strong", { children: "\u5B57\u6BB5\u8BF4\u660E" }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u5B57\u6BB5\u8BF4\u660E", onClick: onClose, children: "\u00D7" })] }), _jsxs("div", { className: "presale-coupon-description-table", children: [_jsxs("div", { className: "presale-coupon-description-table__head", children: [_jsx("span", { children: "\u5B57\u6BB5" }), _jsx("span", { children: "\u8BF4\u660E" })] }), descriptions.map((item) => (_jsxs("div", { className: "presale-coupon-description-table__row", children: [_jsx("span", { children: item.field }), _jsx("span", { children: item.description })] }, item.field)))] })] }) }));
}
function DetailDialog({ row, onClose }) {
    return (_jsx("div", { className: "presale-coupon-modal-backdrop", role: "presentation", onClick: onClose, children: _jsxs("section", { className: "presale-coupon-detail-modal", role: "dialog", "aria-modal": "true", "aria-label": "\u9884\u552E\u5238\u8BE6\u60C5", onClick: (event) => event.stopPropagation(), children: [_jsxs("header", { children: [_jsx("strong", { children: "\u9884\u552E\u5238\u8BE6\u60C5" }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u8BE6\u60C5", onClick: onClose, children: "\u00D7" })] }), _jsxs("dl", { children: [_jsxs("div", { children: [_jsx("dt", { children: "\u5546\u54C1\u540D\u79F0" }), _jsx("dd", { children: row.preSaleName })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u9884\u552E\u5238\u7C7B\u578B" }), _jsx("dd", { children: row.categoryName })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u5173\u8054\u6E20\u9053" }), _jsx("dd", { children: row.channelName })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u6700\u8FD1\u66F4\u65B0\u65F6\u95F4" }), _jsx("dd", { children: row.updatedAt })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u5907\u6CE8" }), _jsx("dd", { children: row.remark })] })] })] }) }));
}
function findMatchingPreset(startDate, endDate) {
    for (const preset of datePresetOptions) {
        const range = buildPresetRange(preset.key);
        if (range.startDate === startDate && range.endDate === endDate) {
            return preset.key;
        }
    }
    return null;
}
function buildPresetRange(preset) {
    const today = new Date();
    const current = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    if (preset === 'yesterday') {
        const yesterday = new Date(current.getFullYear(), current.getMonth(), current.getDate() - 1);
        const value = formatDate(yesterday);
        return { startDate: value, endDate: value };
    }
    if (preset === 'thisWeek') {
        const day = current.getDay() === 0 ? 7 : current.getDay();
        const start = new Date(current.getFullYear(), current.getMonth(), current.getDate() - day + 1);
        return { startDate: formatDate(start), endDate: formatDate(current) };
    }
    if (preset === 'lastMonth') {
        const start = new Date(current.getFullYear(), current.getMonth() - 1, 1);
        const end = new Date(current.getFullYear(), current.getMonth(), 0);
        return { startDate: formatDate(start), endDate: formatDate(end) };
    }
    const start = new Date(current.getFullYear(), current.getMonth(), 1);
    const end = new Date(current.getFullYear(), current.getMonth() + 1, 0);
    return { startDate: formatDate(start), endDate: formatDate(end) };
}
function shiftMonth(month, offset) {
    const [year, monthIndex] = month.split('-').map(Number);
    const nextDate = new Date(year, monthIndex - 1 + offset, 1);
    return `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
}
function formatMonthLabel(month) {
    const [year, monthValue] = month.split('-');
    return `${year}年 ${Number(monthValue)}月`;
}
function buildCalendarDays(month) {
    const [year, monthValue] = month.split('-').map(Number);
    const firstDay = new Date(year, monthValue - 1, 1);
    const startOffset = (firstDay.getDay() + 6) % 7;
    const gridStart = new Date(year, monthValue - 1, 1 - startOffset);
    return Array.from({ length: 42 }, (_, index) => {
        const date = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + index);
        return {
            date: formatDate(date),
            label: String(date.getDate()),
            isMuted: date.getMonth() !== monthValue - 1,
        };
    });
}
function formatDate(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
