import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { createInitialSalesReportQuery, createSalesReportExportTask, createSalesReportRequestBody, getDefaultSalesReportQuery, getSalesReportStaticLookups, loadSalesReportDashboard, } from '../services/salesReport';
import { StoreSelectControl } from '../components/StoreSelect';
import { useStoreOptions } from '../hooks/useStoreOptions';
import './SalesReportPage.css';
const tabs = [
    { key: 'day', label: '按日' },
    { key: 'month', label: '按月' },
    { key: 'store', label: '按门店' },
    { key: 'channel', label: '按渠道' },
    { key: 'roomType', label: '按房型' },
    { key: 'room', label: '按房间' },
];
const staticLookups = getSalesReportStaticLookups();
const expandableColumnMeta = {
    adr: {
        label: 'ADR',
        afterIndex: 7,
        groupIndex: 3,
        children: ['全日房ADR', '钟点房ADR'],
    },
    adrMinusCommission: {
        label: 'ADR(减佣)',
        afterIndex: 8,
        groupIndex: 3,
        children: ['全日房ADR(减佣)', '钟点房ADR(减佣)'],
    },
    roomFeeIncludingCommission: {
        label: '房费(含佣)',
        afterIndex: 13,
        groupIndex: 5,
        children: ['全日房费(含佣)', '钟点房费(含佣)'],
    },
    accommodationOrderCount: {
        label: '住宿订单总数',
        afterIndex: 14,
        groupIndex: 6,
        children: ['自来客'],
    },
};
export function SalesReportPage() {
    const [query, setQuery] = useState(createInitialSalesReportQuery);
    const [dashboard, setDashboard] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [errorTraceId, setErrorTraceId] = useState('');
    const [descriptionOpen, setDescriptionOpen] = useState(false);
    const [filtersCollapsed, setFiltersCollapsed] = useState(false);
    const [exportTask, setExportTask] = useState(null);
    const [expandedColumns, setExpandedColumns] = useState([]);
    const { storeOptions, storeLoading } = useStoreOptions({
        fallbackOptions: (dashboard?.stores ?? staticLookups.stores).map((store) => ({ id: store.id, label: store.label })),
    });
    useEffect(() => {
        void runQuery(query);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    const currentState = error ? 'error' : dashboard?.state ?? query.mockState ?? 'success';
    const roomTypes = dashboard?.roomTypes ?? staticLookups.roomTypes;
    const channels = dashboard?.channels ?? staticLookups.channels;
    const roomGroups = dashboard?.roomGroups ?? staticLookups.roomGroups;
    const rooms = dashboard?.rooms ?? staticLookups.rooms;
    const descriptionItems = dashboard?.descriptionItems ?? staticLookups.descriptionItems;
    const requestBody = useMemo(() => createSalesReportRequestBody(query), [query]);
    const serviceContract = useMemo(() => JSON.stringify({
        provider: dashboard?.provider ?? query.provider ?? 'mock',
        state: currentState,
        tab: query.activeTab,
        requestBody,
        rows: dashboard?.table.rows.length ?? 0,
        traceId: dashboard?.traceId ?? errorTraceId,
    }), [currentState, dashboard, errorTraceId, query.activeTab, query.provider, requestBody]);
    const exportContract = useMemo(() => JSON.stringify(exportTask ?? {}), [exportTask]);
    const isExpandableTable = Boolean(dashboard && dashboard.table.columns.length >= 15 && dashboard.table.groups.length >= 7);
    const derivedColumns = useMemo(() => (dashboard ? buildDerivedColumns(dashboard, expandedColumns) : []), [dashboard, expandedColumns]);
    const derivedGroups = useMemo(() => (dashboard ? buildDerivedGroups(dashboard, expandedColumns) : []), [dashboard, expandedColumns]);
    const derivedRows = useMemo(() => (dashboard ? buildDerivedRows(dashboard, expandedColumns) : []), [dashboard, expandedColumns]);
    async function runQuery(nextQuery, nextNotice = '') {
        setIsLoading(true);
        setError('');
        setErrorTraceId('');
        setDescriptionOpen(false);
        try {
            const nextDashboard = await loadSalesReportDashboard(nextQuery);
            setDashboard(nextDashboard);
            setQuery(nextQuery);
            setNotice(nextNotice);
        }
        catch (reason) {
            const nextError = reason instanceof Error ? reason.message : '销况报表加载失败，请稍后重试';
            const traceId = reason instanceof Error && 'response' in reason ? readTraceId(reason) : '';
            setDashboard(null);
            setQuery(nextQuery);
            setNotice('');
            setError(nextError);
            setErrorTraceId(traceId);
        }
        finally {
            setIsLoading(false);
        }
    }
    function patchQuery(patch) {
        setQuery((current) => ({
            ...current,
            ...patch,
        }));
    }
    function handleTabChange(activeTab) {
        const defaults = getDefaultSalesReportQuery();
        const nextQuery = {
            ...query,
            activeTab,
            roomIds: activeTab === 'room' ? query.roomIds : [],
            pageNum: 1,
            monthStartDate: defaults.monthStartDate,
            monthEndDate: defaults.monthEndDate,
        };
        setExportTask(null);
        setExpandedColumns([]);
        void runQuery(nextQuery, `已切换到${tabs.find((item) => item.key === activeTab)?.label}`);
    }
    function handleReset() {
        const defaults = getDefaultSalesReportQuery();
        const nextQuery = {
            ...defaults,
            activeTab: query.activeTab,
            provider: query.provider,
            mockState: query.mockState,
        };
        setExportTask(null);
        setExpandedColumns([]);
        void runQuery(nextQuery, '已重置筛选条件');
    }
    function handleQuery() {
        setExportTask(null);
        setExpandedColumns([]);
        void runQuery({ ...query, pageNum: 1 }, '已按当前条件刷新销况报表');
    }
    async function handleExport() {
        const nextExportTask = await createSalesReportExportTask(query);
        setExportTask(nextExportTask);
        setNotice(nextExportTask.message);
    }
    function toggleExpandedColumn(column) {
        setExpandedColumns((current) => current.includes(column) ? current.filter((item) => item !== column) : [...current, column]);
    }
    const roomTypeValue = query.roomCategoryIds[0] ?? '';
    const channelValue = query.channelIds[0] ?? '';
    const roomGroupValue = query.roomCategoryGroupIds[0] ?? '';
    const roomValue = query.roomIds[0] ?? '';
    return (_jsxs("div", { className: "sales-report-page", "data-provider": dashboard?.provider ?? query.provider ?? 'mock', "data-response-state": currentState, "data-trace-id": dashboard?.traceId ?? errorTraceId, children: [_jsx("h1", { className: "sr-only-heading", children: "\u9500\u51B5\u62A5\u8868" }), _jsx("pre", { hidden: true, "data-testid": "sales-report-service-contract", children: serviceContract }), _jsx("pre", { hidden: true, "data-testid": "sales-report-export-contract", children: exportContract }), _jsx("section", { className: "sales-report-panel", children: _jsxs("section", { className: "sales-report-query", "aria-label": "\u9500\u51B5\u62A5\u8868\u7B5B\u9009", children: [_jsx("div", { className: "sales-report-tabs", role: "tablist", "aria-label": "\u9500\u51B5\u62A5\u8868\u7EF4\u5EA6", children: tabs.map((tab) => (_jsx("button", { type: "button", "aria-pressed": query.activeTab === tab.key, className: query.activeTab === tab.key ? 'is-active' : '', onClick: () => handleTabChange(tab.key), children: tab.label }, tab.key))) }), _jsxs("div", { className: "sales-report-form", children: [_jsx(StoreSelectControl, { className: "sales-report-store-row", label: "\u95E8\u5E97\u8303\u56F4", options: storeOptions.map((item) => ({ id: item.id, name: item.label })), value: query.storeScope, disabled: storeLoading, onChange: (storeId) => patchQuery({ storeScope: storeId }) }), !filtersCollapsed ? (_jsxs("div", { className: "sales-report-filter-row", children: [query.activeTab === 'month' ? (_jsx(DateMonthFields, { startValue: query.monthStartDate.slice(0, 7), endValue: query.monthEndDate.slice(0, 7), onStartChange: (value) => patchQuery({ monthStartDate: `${value}-01` }), onEndChange: (value) => patchQuery({ monthEndDate: `${value}-${lastDayOfMonth(value)}` }) })) : (_jsx(DateDayFields, { startValue: query.dayStartDate, endValue: query.dayEndDate, onStartChange: (value) => patchQuery({ dayStartDate: value }), onEndChange: (value) => patchQuery({ dayEndDate: value }) })), query.activeTab !== 'store' ? (_jsx(SelectField, { id: "sales-room-type", label: "\u623F\u578B", value: roomTypeValue, options: roomTypes, onChange: (value) => patchQuery({ roomCategoryIds: value ? [value] : [], roomIds: [] }) })) : null, query.activeTab === 'room' ? (_jsx(SelectField, { id: "sales-room", label: "\u623F\u95F4", value: roomValue, options: rooms, onChange: (value) => patchQuery({ roomIds: value ? [value] : [] }) })) : null, _jsx(SelectField, { id: "sales-channel", label: "\u6E20\u9053", value: channelValue, options: channels, onChange: (value) => patchQuery({ channelIds: value ? [value] : [] }) }), query.activeTab !== 'store' ? (_jsx(SelectField, { id: "sales-room-group", label: "\u623F\u578B\u5206\u7EC4", value: roomGroupValue, options: roomGroups, onChange: (value) => patchQuery({ roomCategoryGroupIds: value ? [value] : [] }) })) : null] })) : null] }), _jsxs("div", { className: "sales-report-actions", children: [_jsx("button", { type: "button", className: "is-outline", disabled: isLoading, onClick: handleReset, children: "\u91CD\u7F6E" }), _jsx("button", { type: "button", className: "is-primary", disabled: isLoading, onClick: handleQuery, children: "\u67E5\u8BE2" }), _jsx("button", { type: "button", className: "is-outline", disabled: isLoading, onClick: () => void handleExport(), children: "\u5BFC\u51FA" }), _jsx("button", { type: "button", className: "is-outline", disabled: isLoading, onClick: () => {
                                        setDescriptionOpen(true);
                                        setNotice('');
                                    }, children: "\u8BF4\u660E" }), _jsx("button", { type: "button", className: "is-link", disabled: isLoading, "aria-label": filtersCollapsed ? '展开筛选' : '收起筛选', onClick: () => setFiltersCollapsed((current) => !current), children: filtersCollapsed ? '展开' : '收起' })] })] }) }), _jsx("div", { className: "sr-only-heading", role: "status", "aria-label": "\u9500\u51B5\u62A5\u8868\u64CD\u4F5C\u53CD\u9988", children: notice }), error ? (_jsxs("section", { className: "sales-report-alert", role: "alert", "aria-label": "\u9500\u51B5\u62A5\u8868\u52A0\u8F7D\u5931\u8D25", children: [_jsx("strong", { children: "\u9500\u51B5\u62A5\u8868\u52A0\u8F7D\u5931\u8D25" }), _jsx("p", { children: error }), _jsx("button", { type: "button", onClick: () => void runQuery(query, '已重新加载销况报表'), children: "\u91CD\u8BD5" })] })) : null, _jsx("section", { className: "sales-report-table-wrap", "aria-label": "\u9500\u51B5\u62A5\u8868\u8868\u683C", children: isLoading ? (_jsx("div", { className: "sales-report-empty", children: "\u6B63\u5728\u52A0\u8F7D\u9500\u51B5\u62A5\u8868..." })) : dashboard && dashboard.table.rows.length === 0 ? (_jsx("div", { className: "sales-report-empty", children: dashboard.emptyMessage })) : (_jsxs("table", { className: "sales-report-table", "aria-label": "\u9500\u51B5\u62A5\u8868\u8868\u683C", children: [_jsxs("thead", { children: [_jsx("tr", { children: derivedGroups.map((group, index) => (_jsx("th", { colSpan: group.span, children: group.label }, `${group.label}-${index}`))) }), _jsx("tr", { children: derivedColumns.map((column) => column.expandable && isExpandableTable ? (_jsx(ExpandableHeader, { label: column.label, expanded: Boolean(column.expanded), onClick: () => toggleExpandedColumn(column.expandable) }, column.key)) : (_jsx("th", { className: column.expanded ? 'is-expanded-group' : '', children: column.label }, column.key))) })] }), _jsx("tbody", { children: derivedRows.map((row) => (_jsx("tr", { className: row.summary ? 'is-summary' : '', children: row.cells.map((cell, index) => (_jsx("td", { children: cell }, `${row.id}-${index}`))) }, row.id))) })] })) }), !isLoading && dashboard ? (_jsxs("nav", { className: "sales-report-pagination", "aria-label": "\u5206\u9875", children: [_jsx("span", { children: dashboard.pageText }), _jsx("button", { type: "button", disabled: true, "aria-label": "\u4E0A\u4E00\u9875", children: "\u4E0A\u4E00\u9875" }), _jsx("button", { type: "button", className: "is-current", "aria-current": "page", disabled: true, children: dashboard.pagination.pageNum }), _jsx("button", { type: "button", disabled: true, "aria-label": "\u4E0B\u4E00\u9875", children: "\u4E0B\u4E00\u9875" }), _jsxs("button", { type: "button", disabled: true, children: [dashboard.pagination.pageSize, " \u6761/\u9875"] })] })) : null, descriptionOpen ? (_jsx("div", { className: "sales-modal-backdrop", role: "presentation", children: _jsxs("section", { className: "sales-description-modal", role: "dialog", "aria-modal": "true", "aria-label": "\u62A5\u8868\u5B57\u6BB5\u8BF4\u660E", children: [_jsxs("header", { children: [_jsx("strong", { children: "\u62A5\u8868\u5B57\u6BB5\u8BF4\u660E" }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u62A5\u8868\u5B57\u6BB5\u8BF4\u660E", onClick: () => setDescriptionOpen(false), children: "\u00D7" })] }), _jsx("div", { className: "sales-description-grid", children: descriptionItems.map((item) => (_jsxs("div", { className: "sales-description-row", children: [_jsx("span", { children: item.field }), _jsx("span", { children: item.detail })] }, item.field))) })] }) })) : null] }));
}
function DateDayFields({ startValue, endValue, onStartChange, onEndChange, }) {
    return (_jsxs("div", { className: "sales-date-field", children: [_jsx("span", { children: "\u5F00\u59CB\u65E5\u671F" }), _jsx("div", { className: "sales-date-field__body", children: _jsxs("div", { className: "sales-date-range", "aria-label": "\u65E5\u671F", children: [_jsx("label", { htmlFor: "sales-day-start", className: "sr-only-heading", children: "\u5F00\u59CB\u65E5\u671F" }), _jsx("input", { id: "sales-day-start", "aria-label": "\u5F00\u59CB\u65E5\u671F", type: "date", value: startValue, onChange: (event) => onStartChange(event.target.value) }), _jsx("span", { children: "\u81F3" }), _jsx("label", { htmlFor: "sales-day-end", className: "sr-only-heading", children: "\u7ED3\u675F\u65E5\u671F" }), _jsx("input", { id: "sales-day-end", "aria-label": "\u7ED3\u675F\u65E5\u671F", type: "date", value: endValue, onChange: (event) => onEndChange(event.target.value) }), _jsx("i", { "aria-hidden": "true" })] }) })] }));
}
function DateMonthFields({ startValue, endValue, onStartChange, onEndChange, }) {
    return (_jsxs("div", { className: "sales-date-field", children: [_jsx("span", { children: "\u5F00\u59CB\u6708\u4EFD" }), _jsx("div", { className: "sales-date-field__body", children: _jsxs("div", { className: "sales-date-range sales-date-range--month", "aria-label": "\u6708\u4EFD", children: [_jsx("label", { htmlFor: "sales-month-start", className: "sr-only-heading", children: "\u5F00\u59CB\u6708\u4EFD" }), _jsx("input", { id: "sales-month-start", "aria-label": "\u5F00\u59CB\u6708\u4EFD", type: "month", value: startValue, onChange: (event) => onStartChange(event.target.value) }), _jsx("span", { children: "\u81F3" }), _jsx("label", { htmlFor: "sales-month-end", className: "sr-only-heading", children: "\u7ED3\u675F\u6708\u4EFD" }), _jsx("input", { id: "sales-month-end", "aria-label": "\u7ED3\u675F\u6708\u4EFD", type: "month", value: endValue, onChange: (event) => onEndChange(event.target.value) }), _jsx("i", { "aria-hidden": "true" })] }) })] }));
}
function SelectField({ id, label, value, options, onChange, }) {
    return (_jsxs("label", { className: "sales-select-field", htmlFor: id, children: [_jsx("span", { children: label }), _jsxs("select", { id: id, "aria-label": label, value: value, onChange: (event) => onChange(event.target.value), children: [_jsx("option", { value: "", children: "\u8BF7\u9009\u62E9" }), options.map((option) => (_jsx("option", { value: option.id, children: option.label }, option.id)))] })] }));
}
function ExpandableHeader({ label, expanded, onClick, }) {
    return (_jsx("th", { className: expanded ? 'is-expanded-group' : '', children: _jsxs("button", { type: "button", className: `sales-table-expand${expanded ? ' is-expanded' : ''}`, "aria-expanded": expanded, "aria-label": `${label}${expanded ? '收起子列' : '展开子列'}`, onClick: onClick, children: [_jsx("span", { children: label }), _jsx("i", { "aria-hidden": "true" })] }) }));
}
function buildDerivedColumns(dashboard, expandedColumns) {
    const columns = dashboard.table.columns.map((label, index) => {
        const expandable = getExpandableKey(index);
        return {
            key: `base-${index}`,
            label,
            expandable,
            expanded: expandable ? expandedColumns.includes(expandable) : false,
        };
    });
    const sortedExpanded = [...expandedColumns].sort((left, right) => expandableColumnMeta[left].afterIndex - expandableColumnMeta[right].afterIndex);
    sortedExpanded.forEach((column) => {
        const meta = expandableColumnMeta[column];
        const insertIndex = columns.findIndex((item) => item.key === `base-${meta.afterIndex}`) + 1;
        if (insertIndex <= 0)
            return;
        columns.splice(insertIndex, 0, ...meta.children.map((label, childIndex) => ({
            key: `${column}-${childIndex}`,
            label,
            expanded: true,
        })));
    });
    return columns;
}
function buildDerivedGroups(dashboard, expandedColumns) {
    const groups = dashboard.table.groups.map((group) => ({ ...group }));
    expandedColumns.forEach((column) => {
        const meta = expandableColumnMeta[column];
        if (groups[meta.groupIndex]) {
            groups[meta.groupIndex] = {
                ...groups[meta.groupIndex],
                span: groups[meta.groupIndex].span + meta.children.length,
            };
        }
    });
    return groups;
}
function buildDerivedRows(dashboard, expandedColumns) {
    const sortedExpanded = [...expandedColumns].sort((left, right) => expandableColumnMeta[left].afterIndex - expandableColumnMeta[right].afterIndex);
    return dashboard.table.rows.map((row) => {
        const cells = [...row.cells];
        sortedExpanded.forEach((column) => {
            const insertIndex = expandableColumnMeta[column].afterIndex + 1;
            cells.splice(insertIndex, 0, ...buildExpandedCells(row.cells, column));
        });
        return {
            ...row,
            cells,
        };
    });
}
function buildExpandedCells(rowCells, column) {
    if (column === 'adr')
        return [rowCells[7] ?? '-', '0'];
    if (column === 'adrMinusCommission')
        return [rowCells[8] ?? '-', '0'];
    if (column === 'roomFeeIncludingCommission')
        return [rowCells[13] ?? '-', '0'];
    return ['0'];
}
function getExpandableKey(index) {
    if (index === 7)
        return 'adr';
    if (index === 8)
        return 'adrMinusCommission';
    if (index === 13)
        return 'roomFeeIncludingCommission';
    if (index === 14)
        return 'accommodationOrderCount';
    return undefined;
}
function lastDayOfMonth(monthValue) {
    const [yearText, monthText] = monthValue.split('-');
    const year = Number(yearText);
    const month = Number(monthText);
    if (!Number.isFinite(year) || !Number.isFinite(month))
        return '31';
    return String(new Date(year, month, 0).getDate()).padStart(2, '0');
}
function readTraceId(reason) {
    return reason.response.traceId || '';
}
