import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createOrderLedgerExportTask, defaultOrderLedgerRequest, fetchOrderLedgerDashboard, resolveOrderLedgerMockState, resolveOrderLedgerProvider, } from '../services/orderLedger';
import './OrderLedgerPage.css';
const datePresets = [
    { label: '昨天', beginTime: '2026-05-18', endTime: '2026-05-19' },
    { label: '今天', beginTime: '2026-05-19', endTime: '2026-05-20' },
    { label: '上周', beginTime: '2026-05-11', endTime: '2026-05-17' },
    { label: '本周', beginTime: '2026-05-18', endTime: '2026-05-24' },
    { label: '上月', beginTime: '2026-04-01', endTime: '2026-04-30' },
    { label: '本月', beginTime: '2026-05-01', endTime: '2026-05-31' },
];
export function OrderLedgerPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const [request, setRequest] = useState(() => createPageRequest(location.search));
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [reloadKey, setReloadKey] = useState(0);
    const [openSelect, setOpenSelect] = useState(null);
    const [projectPanelOpen, setProjectPanelOpen] = useState(false);
    const [projectDraft, setProjectDraft] = useState([]);
    const [roomDialogOpen, setRoomDialogOpen] = useState(false);
    const [roomDraft, setRoomDraft] = useState([]);
    const [detailRecord, setDetailRecord] = useState(null);
    const [activeDetailTab, setActiveDetailTab] = useState('order');
    const [moreActionsOpen, setMoreActionsOpen] = useState(false);
    const [isDatePanelOpen, setIsDatePanelOpen] = useState(false);
    const [datePickTarget, setDatePickTarget] = useState('start');
    const [calendarMonth, setCalendarMonth] = useState(() => request.beginTime.slice(0, 7));
    const [datePanelPosition, setDatePanelPosition] = useState({ top: 0, left: 0 });
    const [dateDraft, setDateDraft] = useState(() => ({ beginTime: request.beginTime, endTime: request.endTime }));
    const dateRangeRef = useRef(null);
    const searchRef = useRef(location.search);
    useEffect(() => {
        if (searchRef.current === location.search)
            return;
        searchRef.current = location.search;
        setDashboard(null);
        setError('');
        setNotice('');
        setLoading(true);
        setOpenSelect(null);
        setProjectPanelOpen(false);
        setRoomDialogOpen(false);
        setDetailRecord(null);
        setActiveDetailTab('order');
        setMoreActionsOpen(false);
        setIsDatePanelOpen(false);
        setDatePickTarget('start');
        setRequest(createPageRequest(location.search));
    }, [location.search]);
    useEffect(() => {
        const abort = new AbortController();
        fetchOrderLedgerDashboard(request, abort.signal)
            .then((nextDashboard) => {
            setDashboard(nextDashboard);
        })
            .catch((reason) => {
            if (reason instanceof DOMException && reason.name === 'AbortError')
                return;
            setDashboard(null);
            setError(reason instanceof Error ? reason.message : '收支明细数据加载失败');
        })
            .finally(() => {
            if (!abort.signal.aborted) {
                setLoading(false);
            }
        });
        return () => abort.abort();
    }, [request, reloadKey]);
    const provider = dashboard?.provider ?? resolveOrderLedgerProvider(location.search);
    const state = request.state ?? resolveOrderLedgerMockState(location.search);
    const activeRequest = dashboard?.request ?? request;
    const selectedPreset = useMemo(() => datePresets.find((item) => item.beginTime === activeRequest.beginTime && item.endTime === activeRequest.endTime)?.label ?? '', [activeRequest.beginTime, activeRequest.endTime]);
    const detail = detailRecord?.detail ?? null;
    const records = dashboard?.records ?? [];
    const summary = dashboard?.summary ?? { netIncome: 0, totalIncome: 0, totalExpense: 0 };
    const roomLabel = roomSelectionLabel(activeRequest.roomIds, dashboard?.roomOptions ?? []);
    const projectLabel = projectSelectionLabel(activeRequest.paymentTypeIds, dashboard?.projectOptions ?? []);
    const paymentLabel = optionLabelById(activeRequest.paymentWayIds[0], dashboard?.paymentWayOptions ?? [], '请选择支付方式');
    const typeValue = typeValueFromRequest(activeRequest);
    const sourceValue = sourceValueFromRequest(activeRequest);
    const isEmpty = !loading && !error && records.length === 0;
    const roomBreakdownDates = Array.from(new Set(detail?.roomBreakdown.map((item) => item.date) ?? []));
    const roomBreakdownLabels = Array.from(new Set(detail?.roomBreakdown.map((item) => item.roomLabel) ?? []));
    const detailLogs = detailRecord
        ? [
            `${detailRecord.createdAt} 创建账本明细`,
            `${detailRecord.paymentTime || detailRecord.createdAt} 记录支付流水 ${detailRecord.paymentNo}`,
            `${detailRecord.createdAt} 操作人 ${detailRecord.operatorName} 提交 ${detailRecord.projectLabel}`,
        ]
        : [];
    const channelSections = detailRecord
        ? [
            {
                key: 'basic',
                title: '基础信息',
                items: [
                    { label: '渠道', value: detail?.channelName ?? '-' },
                    { label: '渠道单号', value: detail?.channelOrderNo ?? '-' },
                    { label: '订单号', value: detailRecord.orderId },
                    { label: '来源', value: detailRecord.sourceLabel },
                ],
            },
            {
                key: 'settlement',
                title: '结算信息',
                items: [
                    { label: '支付方式', value: detailRecord.paymentWayLabel },
                    { label: '支付流水号', value: detailRecord.paymentNo },
                    { label: '支付时间', value: detailRecord.paymentTime || '-' },
                    { label: '创建时间', value: detailRecord.createdAt },
                ],
            },
        ]
        : [];
    function patchRequest(patch) {
        setNotice('');
        setError('');
        setLoading(true);
        setOpenSelect(null);
        setProjectPanelOpen(false);
        setRequest((current) => ({ ...current, ...patch, pageNum: 1 }));
    }
    function handleTypeChange(value) {
        const nextIncome = value === 'income' ? 1 : value === 'expense' ? 0 : null;
        patchRequest({
            isIncome: nextIncome,
            paymentTypeIds: [],
        });
    }
    function handleSourceChange(value) {
        const nextType = value === 'stayOrder' ? 1 : value === 'manualEntry' ? 2 : null;
        patchRequest({ type: nextType });
    }
    function openDatePanel(target = 'start') {
        setOpenSelect(null);
        setProjectPanelOpen(false);
        setDatePickTarget(target);
        setDateDraft({ beginTime: activeRequest.beginTime, endTime: activeRequest.endTime });
        setCalendarMonth(activeRequest.beginTime.slice(0, 7));
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
            const nextEndTime = date <= dateDraft.endTime ? dateDraft.endTime : date;
            setDateDraft({ beginTime: date, endTime: nextEndTime });
            setDatePickTarget('end');
            return;
        }
        const nextBeginTime = date < dateDraft.beginTime ? date : dateDraft.beginTime;
        const nextEndTime = date < dateDraft.beginTime ? dateDraft.beginTime : date;
        setDateDraft({ beginTime: nextBeginTime, endTime: nextEndTime });
        setIsDatePanelOpen(false);
        setDatePickTarget('start');
        patchRequest({ beginTime: nextBeginTime, endTime: nextEndTime });
    }
    function resetFilters() {
        setNotice('');
        setError('');
        setLoading(true);
        setOpenSelect(null);
        setProjectPanelOpen(false);
        setRoomDialogOpen(false);
        setMoreActionsOpen(false);
        setDetailRecord(null);
        setActiveDetailTab('order');
        setIsDatePanelOpen(false);
        setDatePickTarget('start');
        setRequest(createPageRequest(location.search));
    }
    async function handleExport() {
        const result = await createOrderLedgerExportTask(activeRequest);
        setNotice(`导出任务已创建：${result.data.taskId}`);
    }
    function openDetail(record) {
        setDetailRecord(record);
        setActiveDetailTab('order');
        setMoreActionsOpen(false);
    }
    function closeDetail() {
        setDetailRecord(null);
        setActiveDetailTab('order');
        setMoreActionsOpen(false);
    }
    function handleRetry() {
        setNotice('');
        setError('');
        setLoading(true);
        setReloadKey((value) => value + 1);
    }
    function openProjectPanel() {
        setOpenSelect(null);
        setProjectDraft(activeRequest.paymentTypeIds);
        setProjectPanelOpen(true);
    }
    function toggleProject(projectId) {
        setProjectDraft((current) => current.includes(projectId) ? current.filter((item) => item !== projectId) : [...current, projectId]);
    }
    function openRoomDialog() {
        setOpenSelect(null);
        setProjectPanelOpen(false);
        setRoomDraft(activeRequest.roomIds);
        setRoomDialogOpen(true);
    }
    function toggleRoom(roomId) {
        setRoomDraft((current) => current.includes(roomId) ? current.filter((item) => item !== roomId) : [...current, roomId]);
    }
    return (_jsxs("div", { className: "order-ledger-page", children: [_jsx("h1", { className: "sr-only-heading", children: "\u6536\u652F\u660E\u7EC6" }), _jsx("div", { id: "order-ledger-diagnostics", hidden: true, "data-provider": provider, "data-state": state, "data-request": JSON.stringify(activeRequest) }), _jsxs("section", { className: "order-ledger-filter", "aria-label": "\u6536\u652F\u660E\u7EC6\u7B5B\u9009", children: [_jsxs("div", { className: "order-ledger-filter__top", children: [_jsxs("div", { className: "order-ledger-store-row", "aria-label": "\u95E8\u5E97", children: [_jsx("button", { type: "button", className: activeRequest.poiIds.length === 0 ? 'is-active' : '', "aria-pressed": activeRequest.poiIds.length === 0, onClick: () => patchRequest({ poiIds: [] }), children: "\u5168\u90E8\u95E8\u5E97" }), (dashboard?.stores ?? []).map((store) => {
                                        const selected = activeRequest.poiIds.includes(store.id);
                                        return (_jsx("button", { type: "button", className: selected ? 'is-active' : '', "aria-pressed": selected, onClick: () => patchRequest({ poiIds: [store.id] }), children: store.name }, store.id));
                                    }), _jsx("button", { type: "button", className: "order-ledger-gear", "aria-label": "\u95E8\u5E97\u8BBE\u7F6E", onClick: () => navigate('/InformationMaintenance/campInfo'), children: "\u2699" })] }), _jsx("div", { className: "order-ledger-presets", role: "group", "aria-label": "\u65E5\u671F\u5FEB\u6377\u7B5B\u9009", children: datePresets.map((preset) => (_jsx("button", { type: "button", className: selectedPreset === preset.label ? 'is-active' : '', onClick: () => patchRequest({ beginTime: preset.beginTime, endTime: preset.endTime }), children: preset.label }, preset.label))) }), _jsxs("div", { ref: dateRangeRef, className: "order-ledger-date-range", "aria-label": "\u8D26\u672C\u65E5\u671F", role: "button", tabIndex: 0, onClick: () => openDatePanel('start'), onKeyDown: (event) => {
                                    if (event.key === 'Enter' || event.key === ' ') {
                                        event.preventDefault();
                                        openDatePanel('start');
                                    }
                                }, children: [_jsx("button", { type: "button", className: "order-ledger-date-field", "aria-label": "\u5F00\u59CB\u65E5\u671F", onClick: (event) => {
                                            event.stopPropagation();
                                            openDatePanel('start');
                                        }, children: activeRequest.beginTime }), _jsx("span", { children: "\u81F3" }), _jsx("button", { type: "button", className: "order-ledger-date-field", "aria-label": "\u7ED3\u675F\u65E5\u671F", onClick: (event) => {
                                            event.stopPropagation();
                                            openDatePanel('end');
                                        }, children: activeRequest.endTime }), _jsx("i", { "aria-hidden": "true" })] }), _jsx(SelectField, { label: "\u7C7B\u578B", value: labelForType(typeValue), kind: "type", openSelect: openSelect, optionLabel: "\u7C7B\u578B\u9009\u9879", options: [
                                    { value: 'all', label: '全部类型' },
                                    { value: 'income', label: '收入' },
                                    { value: 'expense', label: '支出' },
                                ], onToggle: () => setOpenSelect(openSelect === 'type' ? null : 'type'), onSelect: (value) => handleTypeChange(value) }), _jsx(SelectField, { label: "\u6765\u6E90", value: labelForSource(sourceValue), kind: "source", openSelect: openSelect, optionLabel: "\u6765\u6E90\u9009\u9879", options: [
                                    { value: 'all', label: '全部来源' },
                                    { value: 'stayOrder', label: '住宿订单' },
                                    { value: 'manualEntry', label: '记一笔' },
                                ], onToggle: () => setOpenSelect(openSelect === 'source' ? null : 'source'), onSelect: (value) => handleSourceChange(value) }), _jsxs("div", { className: "order-ledger-select-field", children: [_jsx("span", { className: "order-ledger-select-label", children: "\u9879\u76EE:" }), _jsx("button", { type: "button", "aria-label": `项目 ${projectLabel}`, onClick: openProjectPanel, children: _jsx("strong", { children: projectLabel }) }), projectPanelOpen ? (_jsx("section", { className: "order-ledger-project-panel", "aria-label": "\u9879\u76EE\u9009\u9879", children: activeRequest.isIncome === null ? (_jsx("p", { className: "order-ledger-project-empty-hint", children: "\u8BF7\u5148\u9009\u62E9\u7C7B\u578B\uFF0C\u518D\u7B5B\u9009\u9879\u76EE\u3002" })) : (_jsxs(_Fragment, { children: [_jsx("div", { className: "order-ledger-project-options", children: (dashboard?.projectOptions ?? []).map((option) => (_jsxs("label", { className: "order-ledger-checkbox", children: [_jsx("input", { type: "checkbox", checked: projectDraft.includes(option.value), onChange: () => toggleProject(option.value) }), _jsx("span", { children: option.label })] }, option.value))) }), _jsxs("div", { className: "order-ledger-project-actions", children: [_jsx("button", { type: "button", onClick: () => setProjectPanelOpen(false), children: "\u53D6\u6D88\u9879\u76EE" }), _jsx("button", { type: "button", className: "is-primary", onClick: () => {
                                                                patchRequest({ paymentTypeIds: projectDraft });
                                                            }, children: "\u786E\u5B9A\u9879\u76EE" })] })] })) })) : null] })] }), _jsxs("div", { className: "order-ledger-filter__bottom", children: [_jsxs("label", { className: "order-ledger-keyword", children: [_jsx("span", { children: "\u641C\u7D22:" }), _jsx("input", { "aria-label": "\u641C\u7D22\u5173\u952E\u5B57", placeholder: "\u8F93\u5165\u652F\u4ED8\u6D41\u6C34\u53F7/\u8BA2\u5355\u53F7", value: activeRequest.keyword, onChange: (event) => patchRequest({ keyword: event.target.value }) })] }), _jsxs("button", { type: "button", className: "order-ledger-room-select", "aria-label": `关联房间 ${roomLabel}`, onClick: openRoomDialog, children: [_jsx("span", { children: "\u5173\u8054\u623F\u95F4" }), _jsx("strong", { children: roomLabel })] }), _jsx(SelectField, { label: "\u652F\u4ED8\u65B9\u5F0F", value: paymentLabel, kind: "payment", openSelect: openSelect, optionLabel: "\u652F\u4ED8\u65B9\u5F0F\u9009\u9879", options: (dashboard?.paymentWayOptions ?? []).map((item) => ({ value: item.value, label: item.label })), onToggle: () => setOpenSelect(openSelect === 'payment' ? null : 'payment'), onSelect: (value) => patchRequest({ paymentWayIds: [value] }) }), _jsxs("div", { className: "order-ledger-actions", children: [_jsx("button", { type: "button", className: "is-outline", onClick: resetFilters, children: "\u91CD\u7F6E" }), _jsx("button", { type: "button", className: "is-primary", onClick: handleExport, disabled: loading || Boolean(error), children: "\u5BFC\u51FA" })] })] })] }), isDatePanelOpen ? (_jsx(DatePanel, { month: calendarMonth, startDate: dateDraft.beginTime, endDate: dateDraft.endTime, pickTarget: datePickTarget, position: datePanelPosition, onClose: () => {
                    setIsDatePanelOpen(false);
                    setDatePickTarget('start');
                    setDateDraft({ beginTime: activeRequest.beginTime, endTime: activeRequest.endTime });
                }, onPrevious: () => setCalendarMonth((current) => shiftMonth(current, -1)), onNext: () => setCalendarMonth((current) => shiftMonth(current, 1)), onPick: applyDateSelection })) : null, _jsx("div", { className: "sr-only-heading", role: "status", "aria-label": "\u6536\u652F\u660E\u7EC6\u64CD\u4F5C\u53CD\u9988", children: notice }), error ? (_jsxs("section", { className: "order-ledger-error", role: "alert", "aria-label": "\u6536\u652F\u660E\u7EC6\u9519\u8BEF\u53CD\u9988", children: [_jsx("strong", { children: "\u6536\u652F\u660E\u7EC6\u6570\u636E\u52A0\u8F7D\u5931\u8D25" }), _jsx("p", { children: error }), _jsx("button", { type: "button", onClick: handleRetry, children: "\u91CD\u65B0\u52A0\u8F7D" })] })) : null, _jsxs("section", { className: "order-ledger-summary", "aria-label": "\u8D26\u672C\u6982\u62EC", children: [_jsx("h2", { children: "\u8D26\u672C\u6982\u62EC" }), _jsx("div", { className: "order-ledger-summary-grid", children: [
                            ['净收入', formatMoney(summary.netIncome)],
                            ['总收入', formatMoney(summary.totalIncome)],
                            ['总支出', formatMoney(summary.totalExpense)],
                        ].map(([label, value]) => (_jsxs("article", { children: [_jsx("span", { "aria-hidden": "true", children: "\u00A5" }), _jsx("p", { children: label }), _jsx("strong", { children: value })] }, label))) })] }), loading ? _jsx("div", { className: "order-ledger-loading", children: "\u6B63\u5728\u52A0\u8F7D\u6536\u652F\u660E\u7EC6\u6570\u636E..." }) : null, isEmpty ? (_jsxs("section", { className: "order-ledger-empty", role: "status", children: [_jsx("strong", { children: "\u5F53\u524D\u7B5B\u9009\u6761\u4EF6\u4E0B\u6682\u65E0\u6536\u652F\u6D41\u6C34" }), _jsx("p", { children: "\u8BF7\u8C03\u6574\u7C7B\u578B\u3001\u6765\u6E90\u3001\u9879\u76EE\u3001\u623F\u95F4\u6216\u65E5\u671F\u6761\u4EF6\u540E\u91CD\u65B0\u67E5\u770B\u3002" })] })) : null, _jsxs("section", { className: "order-ledger-table-section", "aria-label": "\u8D26\u672C\u660E\u7EC6\u8868\u683C", children: [_jsx("h2", { children: "\u8D26\u672C\u660E\u7EC6" }), _jsx("div", { className: "order-ledger-table-scroll", children: _jsxs("table", { className: "order-ledger-table", children: [_jsx("thead", { children: _jsx("tr", { children: [
                                            '类型',
                                            '来源',
                                            '订单号',
                                            '项目',
                                            '金额',
                                            '欠款',
                                            '支付方式',
                                            '支付流水号',
                                            '支付时间',
                                            '创建时间',
                                            '关联房型/房间',
                                            '备注',
                                            '操作人',
                                            '操作',
                                        ].map((heading) => (_jsx("th", { children: heading }, heading))) }) }), _jsx("tbody", { children: records.length > 0
                                        ? records.map((record) => (_jsxs("tr", { children: [_jsx("td", { children: record.typeLabel }), _jsx("td", { children: record.sourceLabel }), _jsx("td", { children: _jsx("button", { type: "button", className: "order-ledger-link", onClick: () => openDetail(record), children: record.orderId }) }), _jsx("td", { children: record.projectLabel }), _jsx("td", { children: record.amount.toFixed(2) }), _jsx("td", { children: record.debtAmount.toFixed(2) }), _jsx("td", { children: record.paymentWayLabel }), _jsx("td", { children: record.paymentNo }), _jsx("td", { children: record.paymentTime }), _jsx("td", { children: record.createdAt }), _jsx("td", { children: record.roomLabel }), _jsx("td", { children: record.remark }), _jsx("td", { children: record.operatorName }), _jsx("td", { children: _jsx("button", { type: "button", className: "order-ledger-link", onClick: () => openDetail(record), children: "\u67E5\u770B\u8BE6\u60C5" }) })] }, record.id)))
                                        : !loading && (_jsx("tr", { children: _jsx("td", { className: "order-ledger-empty-cell", colSpan: 14, children: "\u6682\u65E0\u6570\u636E" }) })) })] }) }), _jsxs("nav", { className: "order-ledger-pagination", "aria-label": "\u5206\u9875", children: [_jsx("span", { children: paginationText(dashboard?.pagination.page ?? 1, dashboard?.pagination.pageSize ?? 10, dashboard?.pagination.total ?? 0) }), _jsx("button", { type: "button", "aria-label": "\u4E0A\u4E00\u9875", disabled: true, children: '<' }), _jsx("button", { type: "button", className: "is-current", children: dashboard?.pagination.page ?? 1 }), _jsx("button", { type: "button", "aria-label": "\u4E0B\u4E00\u9875", disabled: true, children: '>' }), _jsxs("button", { type: "button", children: [dashboard?.pagination.pageSize ?? 10, " \u6761/\u9875"] })] })] }), roomDialogOpen ? (_jsx(RoomDialog, { groups: dashboard?.roomOptions ?? [], selectedRoomIds: roomDraft, onClose: () => setRoomDialogOpen(false), onToggleRoom: toggleRoom, onConfirm: () => {
                    setRoomDialogOpen(false);
                    patchRequest({ roomIds: roomDraft });
                } })) : null, detail ? (_jsxs(_Fragment, { children: [_jsxs("aside", { className: "month-order-drawer order-ledger-detail-drawer", role: "dialog", "aria-label": "\u8BA2\u5355\u8BE6\u60C5", children: [_jsxs("header", { className: "month-order-drawer__header", children: [_jsxs("div", { children: [_jsx("strong", { children: "\u8BA2\u5355\u8BE6\u60C5" }), _jsx("span", { children: "\u5168\u5929\u623F" })] }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u8BA2\u5355\u8BE6\u60C5", onClick: closeDetail, children: "\u00D7" })] }), _jsxs("nav", { className: "month-order-drawer__tabs", "aria-label": "\u8BA2\u5355\u8BE6\u60C5\u6807\u7B7E", children: [_jsx("button", { type: "button", className: activeDetailTab === 'order' ? 'is-active' : '', onClick: () => setActiveDetailTab('order'), children: "\u8BA2\u5355\u4FE1\u606F" }), _jsx("button", { type: "button", className: activeDetailTab === 'channel' ? 'is-active' : '', onClick: () => setActiveDetailTab('channel'), children: "\u6E20\u9053\u4FE1\u606F" }), _jsx("button", { type: "button", className: activeDetailTab === 'log' ? 'is-active' : '', onClick: () => setActiveDetailTab('log'), children: "\u64CD\u4F5C\u65E5\u5FD7" })] }), _jsxs("div", { className: "month-order-drawer__body", children: [activeDetailTab === 'order' ? (_jsxs(_Fragment, { children: [_jsxs("section", { className: "month-order-card", children: [_jsxs("div", { className: "month-order-card__guest", children: [_jsx("strong", { children: detail.guestSummary || detailRecord?.operatorName || '未登记客人' }), _jsx("span", { children: detail.channelName })] }), _jsxs("p", { children: ["\u6E20\u9053\u5355\u53F7\uFF1A", detail.channelOrderNo || '-'] }), _jsxs("p", { children: ["\u8BA2\u5355\u53F7\uFF1A", detailRecord?.orderId || '-'] })] }), _jsxs("section", { className: "month-room-order-card", children: [_jsxs("div", { className: "month-room-order-card__top", children: [_jsx("strong", { children: detail.roomLabel }), _jsx("span", { children: detail.statusLabel })] }), _jsx("div", { className: "month-room-order-card__stay", children: detail.stayRange }), _jsx("div", { className: "month-room-order-card__amount", children: formatMoney(detail.totalAmount) }), _jsxs("div", { className: "month-room-order-card__guest", children: [_jsxs("span", { children: ["\u5173\u8054\u4EA7\u54C1\uFF1A", detail.productName || '-'] }), _jsx("button", { type: "button", onClick: () => navigate('/statistics/houseMonth'), children: "\u67E5\u770B\u6708\u623F\u6001" })] }), _jsx("em", { children: detailRecord?.roomLabel || detail.roomLabel })] }), _jsxs("section", { className: "month-finance-card", children: [_jsxs("div", { className: "month-finance-summary", children: [_jsxs("span", { children: [detail.breakdownTitle, "\uFF1A", _jsx("strong", { children: formatMoney(detail.breakdownAmount) })] }), _jsxs("span", { children: ["\u8BA2\u5355\u603B\u6536\u5165\uFF1A", _jsx("strong", { children: formatMoney(detail.totalIncome) })] })] }), _jsxs("div", { className: "month-finance-meta", children: [_jsxs("span", { children: ["\u652F\u4ED8\u65B9\u5F0F\uFF1A", detailRecord?.paymentWayLabel || '-'] }), _jsxs("span", { children: ["\u652F\u4ED8\u6D41\u6C34\uFF1A", detailRecord?.paymentNo || '-'] }), _jsxs("span", { children: ["\u6B20\u6B3E\uFF1A", formatMoney(detailRecord?.debtAmount ?? 0)] })] }), _jsxs("table", { children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "\u623F\u95F4/\u65E5\u671F" }), roomBreakdownDates.map((date) => (_jsx("th", { children: date }, date)))] }) }), _jsx("tbody", { children: roomBreakdownLabels.map((roomName) => (_jsxs("tr", { children: [_jsx("td", { children: roomName }), roomBreakdownDates.map((date) => {
                                                                            const amount = detail.roomBreakdown.find((item) => item.roomLabel === roomName && item.date === date)?.amount ?? 0;
                                                                            return _jsx("td", { children: amount ? amount.toFixed(2) : '-' }, `${roomName}-${date}`);
                                                                        })] }, roomName))) })] })] }), detail.extraLines.map((item) => (_jsx("section", { className: "month-info-block month-order-section-row", children: _jsxs("div", { className: "month-order-section-header month-order-section-header--summary", children: [_jsx("h3", { children: item.title }), _jsxs("div", { className: "month-order-section-summary", children: [_jsx("span", { children: item.primary }), item.secondary ? _jsx("span", { children: item.secondary }) : null] })] }) }, item.title))), _jsxs("section", { className: "month-info-block month-order-section-row", children: [_jsxs("div", { className: "month-order-section-header month-order-section-header--summary", children: [_jsx("h3", { children: "\u6536\u6B3E\u8BB0\u5F55" }), _jsx("div", { className: "month-order-section-summary", children: _jsxs("span", { children: [detail.paymentRecords.length, " \u6761"] }) })] }), detail.paymentRecords.length === 0 ? (_jsx("div", { className: "month-order-empty-table", children: "\u6682\u65E0\u6536\u6B3E\u8BB0\u5F55" })) : (_jsx("div", { className: "order-ledger-detail-table-wrap", children: _jsxs("table", { className: "order-ledger-detail-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "\u7C7B\u578B" }), _jsx("th", { children: "\u623F\u95F4" }), _jsx("th", { children: "\u9879\u76EE" }), _jsx("th", { children: "\u652F\u4ED8\u65B9\u5F0F" }), _jsx("th", { children: "\u91D1\u989D(\u5143)" }), _jsx("th", { children: "\u652F\u4ED8\u5355\u53F7" }), _jsx("th", { children: "\u65E5\u671F" }), _jsx("th", { children: "\u5907\u6CE8" }), _jsx("th", { children: "\u64CD\u4F5C" })] }) }), _jsx("tbody", { children: detail.paymentRecords.map((item) => (_jsxs("tr", { children: [_jsx("td", { children: item.typeLabel }), _jsx("td", { children: item.roomLabel }), _jsx("td", { children: item.projectLabel }), _jsx("td", { children: item.paymentWayLabel }), _jsx("td", { children: item.amount.toFixed(2) }), _jsx("td", { children: item.paymentNo }), _jsx("td", { children: item.paidAt }), _jsx("td", { children: item.remark }), _jsx("td", { children: _jsx("button", { type: "button", children: item.actionLabel }) })] }, item.id))) })] }) }))] }), _jsx("section", { className: "month-info-block month-order-section-row", children: _jsxs("div", { className: "month-order-key-value-list", children: [_jsxs("div", { className: "month-order-key-value-row", children: [_jsx("span", { children: "\u521B\u5EFA\u65F6\u95F4" }), _jsx("strong", { children: detailRecord?.createdAt || '-' })] }), _jsxs("div", { className: "month-order-key-value-row", children: [_jsx("span", { children: "\u64CD\u4F5C\u4EBA" }), _jsx("strong", { children: detailRecord?.operatorName || '-' })] }), _jsxs("div", { className: "month-order-key-value-row", children: [_jsx("span", { children: "\u5907\u6CE8" }), _jsx("strong", { children: detailRecord?.remark || '-' })] })] }) })] })) : null, activeDetailTab === 'channel' ? (_jsx("section", { className: "month-channel-panel", children: channelSections.map((section) => (_jsxs("section", { className: "month-channel-section", children: [_jsx("div", { className: "month-channel-section__header", children: _jsx("h3", { children: section.title }) }), _jsx("div", { className: "month-channel-grid", children: section.items.map((item) => (_jsxs("div", { className: "month-channel-kv", children: [_jsxs("span", { children: [item.label, ":"] }), _jsx("strong", { children: item.value })] }, item.label))) })] }, section.key))) })) : null, activeDetailTab === 'log' ? (_jsxs("section", { className: "month-info-block month-info-block--plain", children: [_jsx("h3", { children: "\u64CD\u4F5C\u65E5\u5FD7" }), _jsx("ul", { className: "month-log-list", children: detailLogs.map((item) => (_jsx("li", { children: item }, item))) })] })) : null] }), _jsx("footer", { className: "month-order-drawer__footer", children: _jsxs("div", { className: "month-order-footer-row", children: [_jsxs("div", { children: [_jsxs("span", { children: [detail.breakdownTitle, "\uFF1A", formatMoney(detail.breakdownAmount)] }), _jsxs("span", { children: ["\u8BA2\u5355\u603B\u6536\u5165\uFF1A", formatMoney(detail.totalIncome)] })] }), _jsx("button", { type: "button", onClick: () => setMoreActionsOpen((current) => !current), children: "\u66F4\u591A\u64CD\u4F5C" }), _jsx("button", { type: "button", className: "is-primary", onClick: () => setActiveDetailTab('order'), children: "\u67E5\u770B\u8BE6\u60C5" }), moreActionsOpen ? (_jsxs("div", { className: "month-order-more-menu", role: "menu", "aria-label": "\u66F4\u591A\u64CD\u4F5C", children: [_jsx("button", { type: "button", role: "menuitem", onClick: () => navigate('/order/house-order/list'), children: "\u67E5\u770B\u8BA2\u5355\u9875" }), _jsx("button", { type: "button", role: "menuitem", onClick: () => navigate('/statistics/roomSituation'), children: "\u67E5\u770B\u623F\u6001\u9875" })] })) : null] }) })] }), detail.channelName === '__legacy__' ? (_jsxs(_Fragment, { children: [_jsxs("aside", { className: "order-ledger-drawer", "aria-label": "\u8BA2\u5355\u8BE6\u60C5\u62BD\u5C49", children: [_jsxs("header", { children: [_jsx("strong", { children: "\u8BA2\u5355\u8BE6\u60C5" }), _jsx("button", { type: "button", className: "is-tag", children: "\u5168\u5929\u623F" }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u8BA2\u5355\u8BE6\u60C5", onClick: () => {
                                                    setDetailRecord(null);
                                                    setMoreActionsOpen(false);
                                                }, children: "\u00D7" })] }), _jsxs("section", { className: "order-ledger-order-card", children: [_jsxs("div", { children: [_jsx("span", { children: detail.channelName }), _jsxs("strong", { children: ["\u6E20\u9053\u5355\u53F7\uFF1A", detail.channelOrderNo] })] }), _jsx("p", { children: detail.roomLabel }), _jsx("small", { children: detail.statusLabel }), _jsxs("b", { children: ["\u00A5 ", detail.totalAmount.toFixed(2)] })] }), _jsxs("section", { className: "order-ledger-drawer-block", children: [_jsxs("h3", { children: [detail.breakdownTitle, "\uFF1A\u00A5", detail.breakdownAmount.toFixed(2)] }), _jsxs("span", { children: ["\u8BA2\u5355\u603B\u6536\u5165\uFF1A\u00A5 ", detail.totalIncome.toFixed(2)] }), _jsx("table", { children: _jsxs("tbody", { children: [_jsxs("tr", { children: [_jsx("th", { children: "\u623F\u95F4/\u65E5\u671F" }), _jsx("th", { children: detail.roomBreakdown[0]?.date ?? '-' })] }), detail.roomBreakdown.map((item) => (_jsxs("tr", { children: [_jsx("td", { children: item.roomLabel }), _jsx("td", { children: item.amount.toFixed(2) })] }, `${item.date}-${item.roomLabel}`)))] }) })] }), _jsx("section", { className: "order-ledger-drawer-block is-list", children: detail.extraLines.map((item) => (_jsxs("p", { children: [_jsx("span", { children: item.title }), _jsx("strong", { children: item.primary }), item.secondary ? _jsx("em", { children: item.secondary }) : null] }, item.title))) }), _jsxs("footer", { children: [_jsxs("span", { children: [detail.breakdownTitle, "\uFF1A", _jsxs("b", { children: ["\u00A5", detail.breakdownAmount.toFixed(2)] })] }), _jsxs("div", { className: "order-ledger-more-actions", children: [_jsx("button", { type: "button", onClick: () => setMoreActionsOpen((current) => !current), children: "\u66F4\u591A\u64CD\u4F5C" }), moreActionsOpen ? (_jsxs("div", { className: "order-ledger-more-menu", children: [_jsx("button", { type: "button", onClick: () => navigate('/order/house-order/list'), children: "\u67E5\u770B\u8BA2\u5355\u9875" }), _jsx("button", { type: "button", onClick: () => navigate('/statistics/roomSituation'), children: "\u67E5\u770B\u623F\u6001\u9875" })] })) : null] }), _jsx("button", { type: "button", className: "is-primary", children: "\u6536\u6B3E" })] })] }), _jsx("div", { className: "order-ledger-payment-layer", children: _jsxs("section", { className: "order-ledger-payment-dialog", role: "dialog", "aria-modal": "true", "aria-label": "\u6536\u6B3E\u8BB0\u5F55", children: [_jsxs("header", { children: [_jsx("button", { type: "button", disabled: true, children: "\u6536\u6B3E\u6B3E\u9879" }), _jsx("button", { type: "button", className: "is-active", children: "\u6536\u6B3E\u8BB0\u5F55" }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u6536\u6B3E\u8BB0\u5F55", onClick: () => {
                                                        setDetailRecord(null);
                                                        setMoreActionsOpen(false);
                                                    }, children: "\u00D7" })] }), detail.paymentRecords.length === 0 ? (_jsx("div", { className: "order-ledger-payment-empty", children: "\u7A7A\u7A7A\u5982\u4E5F" })) : (_jsxs("table", { children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "\u7C7B\u578B" }), _jsx("th", { children: "\u623F\u95F4" }), _jsx("th", { children: "\u9879\u76EE" }), _jsx("th", { children: "\u652F\u4ED8\u65B9\u5F0F" }), _jsx("th", { children: "\u91D1\u989D(\u00A5)" }), _jsx("th", { children: "\u652F\u4ED8\u5355\u53F7" }), _jsx("th", { children: "\u65E5\u671F" }), _jsx("th", { children: "\u5907\u6CE8" }), _jsx("th", { children: "\u64CD\u4F5C" })] }) }), _jsx("tbody", { children: detail.paymentRecords.map((item) => (_jsxs("tr", { children: [_jsx("td", { children: item.typeLabel }), _jsx("td", { children: item.roomLabel }), _jsx("td", { children: item.projectLabel }), _jsx("td", { children: item.paymentWayLabel }), _jsx("td", { children: item.amount.toFixed(2) }), _jsx("td", { children: item.paymentNo }), _jsx("td", { children: item.paidAt }), _jsx("td", { children: item.remark }), _jsx("td", { children: _jsx("button", { type: "button", children: item.actionLabel }) })] }, item.id))) })] }))] }) })] })) : null] })) : null] }));
}
function DatePanel({ month, startDate, endDate, pickTarget, position, onClose, onPrevious, onNext, onPick, }) {
    const months = [month, shiftMonth(month, 1)];
    return (_jsx("div", { className: "order-ledger-date-panel-wrap", role: "presentation", onMouseDown: onClose, children: _jsxs("section", { className: "order-ledger-date-panel", role: "dialog", "aria-label": "\u6536\u652F\u660E\u7EC6\u65E5\u671F\u9762\u677F", style: { top: `${position.top}px`, left: `${position.left}px` }, onMouseDown: (event) => event.stopPropagation(), children: [_jsxs("div", { className: "order-ledger-date-panel__header", children: [_jsx("strong", { children: pickTarget === 'start' ? '请选择开始日期' : '请选择结束日期' }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u6536\u652F\u660E\u7EC6\u65E5\u671F\u9762\u677F", onClick: onClose, children: "\u00D7" })] }), _jsxs("div", { className: "order-ledger-date-panel__range", children: [_jsx("span", { children: startDate }), _jsx("em", { children: "\u81F3" }), _jsx("span", { children: endDate })] }), _jsx("div", { className: "order-ledger-date-panel__months", children: months.map((item, index) => (_jsx(CalendarMonth, { month: item, startDate: startDate, endDate: endDate, onPrevious: index === 0 ? onPrevious : undefined, onNext: index === months.length - 1 ? onNext : undefined, onPick: onPick }, item))) })] }) }));
}
function CalendarMonth({ month, startDate, endDate, onPrevious, onNext, onPick, }) {
    const days = buildCalendarDays(month);
    return (_jsxs("section", { className: "order-ledger-calendar-month", "aria-label": formatMonthLabel(month), children: [_jsxs("header", { children: [_jsx("button", { type: "button", "aria-label": "\u4E0A\u4E2A\u6708", onClick: onPrevious, disabled: !onPrevious, children: "\u2039" }), _jsx("strong", { children: formatMonthLabel(month) }), _jsx("button", { type: "button", "aria-label": "\u4E0B\u4E2A\u6708", onClick: onNext, disabled: !onNext, children: "\u203A" })] }), _jsx("div", { className: "order-ledger-calendar-month__weekdays", children: ['一', '二', '三', '四', '五', '六', '日'].map((day) => (_jsx("span", { children: day }, day))) }), _jsx("div", { className: "order-ledger-calendar-month__days", children: days.map((day) => {
                    const inRange = day.date >= startDate && day.date <= endDate;
                    const isSelected = day.date === startDate || day.date === endDate;
                    return (_jsx("button", { type: "button", "aria-label": day.date, className: `${day.isMuted ? 'is-muted' : ''}${inRange ? ' is-in-range' : ''}${isSelected ? ' is-selected' : ''}`, onClick: () => onPick(day.date), children: day.label }, day.date));
                }) })] }));
}
function SelectField({ label, value, kind, openSelect, optionLabel, options, onToggle, onSelect, }) {
    return (_jsxs("div", { className: "order-ledger-select-field", children: [_jsxs("span", { className: "order-ledger-select-label", children: [label, ":"] }), _jsx("button", { type: "button", "aria-haspopup": "listbox", "aria-expanded": openSelect === kind, "aria-label": `${label} ${value}`, onClick: onToggle, children: _jsx("strong", { children: value }) }), openSelect === kind ? (_jsx("div", { className: "order-ledger-options", role: "listbox", "aria-label": optionLabel, children: options.map((option) => (_jsx("button", { type: "button", role: "option", "aria-selected": value === option.label, onClick: () => onSelect(option.value), children: option.label }, option.value))) })) : null] }));
}
function RoomDialog({ groups, selectedRoomIds, onClose, onToggleRoom, onConfirm, }) {
    return (_jsx("div", { className: "order-ledger-dialog-layer", children: _jsxs("section", { className: "order-ledger-room-dialog", role: "dialog", "aria-modal": "true", "aria-label": "\u9009\u62E9\u623F\u95F4", children: [_jsxs("header", { children: [_jsx("strong", { children: "\u9009\u62E9\u623F\u95F4" }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u9009\u62E9\u623F\u95F4", onClick: onClose, children: "\u00D7" })] }), _jsxs("div", { className: "order-ledger-room-dialog__toolbar", children: [_jsx("input", { placeholder: "\u8F93\u5165\u623F\u95F4/\u623F\u578B\u540D\u79F0", readOnly: true, value: "" }), _jsx("button", { type: "button", children: "\u641C\u7D22" })] }), _jsx("div", { className: "order-ledger-room-tree", children: groups.map((group) => (_jsxs("div", { className: "order-ledger-room-group", children: [_jsx("strong", { children: group.roomCategoryName }), group.rooms.map((room) => {
                                const label = `${group.roomCategoryName} ${room.roomName}`;
                                return (_jsxs("label", { className: "order-ledger-checkbox", children: [_jsx("input", { type: "checkbox", checked: selectedRoomIds.includes(room.roomId), onChange: () => onToggleRoom(room.roomId) }), _jsx("span", { children: label })] }, room.roomId));
                            })] }, group.roomCategoryId))) }), _jsxs("footer", { children: [_jsx("button", { type: "button", onClick: onClose, children: "\u53D6\u6D88" }), _jsx("button", { type: "button", className: "is-primary", onClick: onConfirm, children: "\u786E\u5B9A\u623F\u95F4" })] })] }) }));
}
function createPageRequest(search) {
    return defaultOrderLedgerRequest(resolveOrderLedgerMockState(search));
}
function typeValueFromRequest(request) {
    if (request.isIncome === 1)
        return 'income';
    if (request.isIncome === 0)
        return 'expense';
    return 'all';
}
function sourceValueFromRequest(request) {
    if (request.type === 1)
        return 'stayOrder';
    if (request.type === 2)
        return 'manualEntry';
    return 'all';
}
function labelForType(value) {
    if (value === 'income')
        return '收入';
    if (value === 'expense')
        return '支出';
    return '全部类型';
}
function labelForSource(value) {
    if (value === 'stayOrder')
        return '住宿订单';
    if (value === 'manualEntry')
        return '记一笔';
    return '全部来源';
}
function optionLabelById(id, options, fallback) {
    if (!id)
        return fallback;
    return options.find((item) => item.value === id)?.label ?? fallback;
}
function projectSelectionLabel(selectedIds, options) {
    if (selectedIds.length === 0)
        return '请选择项目';
    const labels = options.filter((item) => selectedIds.includes(item.value)).map((item) => item.label);
    return labels[0] ?? '请选择项目';
}
function roomSelectionLabel(selectedIds, groups) {
    if (selectedIds.length === 0)
        return '全部';
    for (const group of groups) {
        const room = group.rooms.find((item) => selectedIds.includes(item.roomId));
        if (room) {
            return `${group.roomCategoryName} ${room.roomName}`;
        }
    }
    return '全部';
}
function paginationText(page, pageSize, total) {
    const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
    const end = total === 0 ? 0 : Math.min(page * pageSize, total);
    return `第 ${start}-${end} 条，共 ${total} 条`;
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
    return `¥ ${value.toFixed(2)}`;
}
