import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createCustomerListExport, createDefaultCustomerListQuery, customerAgeOptions, customerGenderOptions, customerIdentityOptions, customerStatusOptions, customerWechatOptions, fetchCustomerListDashboard, memberCardOptions, saveCustomer, } from '../services/customerList';
import './CustomerListPage.css';
const tableColumns = [
    '客户信息',
    '客户编号',
    '客户渠道',
    '会员等级',
    '客户标签',
    '最近消费金额',
    '累计消费次数',
    '累计消费金额',
    '客单价',
    '是否添加企微',
    '是否加微信',
    '是否加群',
    '成为客户时间',
    '成为会员时间',
    '最近消费时间',
    '最近跟进时间',
    '操作',
];
const searchTypes = [
    { id: 'mobile', label: '手机号' },
    { id: 'name', label: '客户姓名' },
    { id: 'memberNo', label: '客户编号' },
];
const levelDialogOptions = ['普通会员', '银卡会员', '金卡会员', '钻石会员'];
export function CustomerListPage() {
    const navigate = useNavigate();
    const panelRef = useRef(null);
    const triggerRefs = useRef({});
    const moreTriggerRefs = useRef({});
    const [query, setQuery] = useState(createInitialCustomerListQuery);
    const [draft, setDraft] = useState(createInitialCustomerListQuery);
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [expanded, setExpanded] = useState(false);
    const [openFilter, setOpenFilter] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]);
    const [moreCustomer, setMoreCustomer] = useState(null);
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [couponCustomer, setCouponCustomer] = useState(null);
    const [levelCustomer, setLevelCustomer] = useState(null);
    const [tagCustomer, setTagCustomer] = useState(null);
    const [notice, setNotice] = useState('');
    const [dropdownStyle, setDropdownStyle] = useState(null);
    const [moreMenuStyle, setMoreMenuStyle] = useState(null);
    useEffect(() => {
        const abort = new AbortController();
        fetchCustomerListDashboard(query, abort.signal)
            .then((nextDashboard) => {
            setDashboard(nextDashboard);
            setError('');
            setSelectedIds([]);
        })
            .catch((reason) => {
            if (reason instanceof DOMException && reason.name === 'AbortError')
                return;
            setError(reason instanceof Error ? reason.message : '客户列表加载失败');
        })
            .finally(() => {
            if (!abort.signal.aborted)
                setLoading(false);
        });
        return () => abort.abort();
    }, [query]);
    useEffect(() => {
        if (!openFilter) {
            setDropdownStyle(null);
            return;
        }
        const panel = panelRef.current;
        const trigger = triggerRefs.current[openFilter];
        if (!panel || !trigger)
            return;
        const updatePosition = () => {
            const panelRect = panel.getBoundingClientRect();
            const triggerRect = trigger.getBoundingClientRect();
            setDropdownStyle({
                left: triggerRect.left - panelRect.left,
                top: triggerRect.bottom - panelRect.top + 6,
                minWidth: triggerRect.width,
            });
        };
        updatePosition();
        window.addEventListener('resize', updatePosition);
        return () => window.removeEventListener('resize', updatePosition);
    }, [expanded, openFilter]);
    useEffect(() => {
        if (!moreCustomer) {
            setMoreMenuStyle(null);
            return;
        }
        const trigger = moreTriggerRefs.current[moreCustomer.id];
        if (!trigger)
            return;
        const updatePosition = () => {
            const rect = trigger.getBoundingClientRect();
            setMoreMenuStyle({
                left: rect.left,
                top: rect.bottom + 6,
            });
        };
        updatePosition();
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true);
        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
        };
    }, [moreCustomer]);
    const contractText = useMemo(() => JSON.stringify({
        provider: dashboard?.provider,
        endpoint: dashboard?.endpoint,
        requestBody: dashboard?.requestBody,
        pagination: dashboard?.pagination,
        traceId: dashboard?.traceId,
    }), [dashboard]);
    const selectedCustomers = useMemo(() => dashboard?.rows.filter((row) => selectedIds.includes(row.id)) ?? [], [dashboard, selectedIds]);
    const batchActionCustomer = selectedCustomers[0] ?? null;
    function patchDraft(next) {
        setDraft((current) => ({ ...current, ...next, pageNum: next.pageNum ?? current.pageNum }));
    }
    function chooseFilter(key, id) {
        if (key === 'status')
            patchDraft({ status: id });
        if (key === 'identity')
            patchDraft({ identity: id });
        if (key === 'level')
            patchDraft({ memberCardId: id });
        if (key === 'wechat')
            patchDraft({ wechatState: id });
        if (key === 'gender')
            patchDraft({ gender: id });
        if (key === 'age')
            patchDraft({ ageRange: id });
        setOpenFilter(null);
    }
    function patchSearchType(next) {
        patchDraft({ memberSearchType: next });
        setOpenFilter(null);
    }
    function submitQuery() {
        setNotice('');
        setOpenFilter(null);
        setLoading(true);
        setError('');
        setQuery({ ...draft, pageNum: 1, scenario: resolveScenario() });
    }
    function resetFilters() {
        const next = createDefaultCustomerListQuery();
        next.scenario = resolveScenario();
        setDraft(next);
        setLoading(true);
        setError('');
        setQuery(next);
        setOpenFilter(null);
        setNotice('已恢复默认客户筛选');
    }
    async function handleExport() {
        const result = await createCustomerListExport(query);
        setNotice(`客户导出任务已创建：${result.data.taskId}`);
    }
    function handleSelect(id, checked) {
        const next = checked ? [...selectedIds, id] : selectedIds.filter((item) => item !== id);
        setSelectedIds(next);
        setNotice(next.length ? `已选择 ${next.length} 位客户` : '已取消选择客户');
    }
    function handleSelectAll(checked) {
        const ids = checked && dashboard ? dashboard.rows.map((row) => row.id) : [];
        setSelectedIds(ids);
        setNotice(ids.length ? `已选择 ${ids.length} 位客户` : '已取消选择客户');
    }
    function handlePageChange(pageNum) {
        const next = { ...query, pageNum, scenario: resolveScenario() };
        setDraft(next);
        setLoading(true);
        setError('');
        setQuery(next);
    }
    function handleMoreAction(action) {
        if (!moreCustomer)
            return;
        if (action === 'coupon')
            setCouponCustomer(moreCustomer);
        if (action === 'level')
            setLevelCustomer(moreCustomer);
        if (action === 'tag')
            setTagCustomer(moreCustomer);
        setMoreCustomer(null);
    }
    function handleBatchAction(action) {
        if (!batchActionCustomer)
            return;
        if (action === 'coupon')
            setCouponCustomer(batchActionCustomer);
        if (action === 'level')
            setLevelCustomer(batchActionCustomer);
        if (action === 'tag')
            setTagCustomer(batchActionCustomer);
    }
    return (_jsxs("div", { className: "customer-list-page", children: [_jsx("h1", { className: "sr-only-heading", children: "\u5BA2\u6237\u5217\u8868" }), _jsx("pre", { hidden: true, "data-testid": "customer-list-contract", "data-provider": dashboard?.provider ?? 'mock', "data-endpoint": dashboard?.endpoint ?? '/member/page/get', children: contractText }), _jsxs("section", { ref: panelRef, className: `customer-list-query${expanded ? ' is-expanded' : ''}`, "aria-label": "\u5BA2\u6237\u5217\u8868\u7B5B\u9009", children: [_jsxs("div", { className: "customer-list-query__grid", children: [_jsxs("div", { className: "customer-list-field customer-list-search", children: [_jsx("span", { children: "\u5BA2\u6237\u641C\u7D22:" }), _jsxs("div", { className: "customer-list-search__control", children: [_jsx("button", { ref: (node) => {
                                                    triggerRefs.current.searchType = node;
                                                }, type: "button", "aria-haspopup": "listbox", "aria-label": searchTypeLabel(draft.memberSearchType), onClick: () => setOpenFilter(openFilter === 'searchType' ? null : 'searchType'), children: searchTypeLabel(draft.memberSearchType) }), _jsx("input", { value: draft.keyword, placeholder: "\u8BF7\u8F93\u5165", onChange: (event) => patchDraft({ keyword: event.target.value }) })] })] }), _jsx(CustomerSelect, { label: "\u5BA2\u6237\u72B6\u6001", value: optionLabel(customerStatusOptions, draft.status, '请选择'), isOpen: openFilter === 'status', triggerRef: (node) => {
                                    triggerRefs.current.status = node;
                                }, onToggle: () => setOpenFilter(openFilter === 'status' ? null : 'status') }), _jsx(CustomerSelect, { label: "\u5BA2\u6237\u8EAB\u4EFD", value: optionLabel(customerIdentityOptions, draft.identity, '请选择'), isOpen: openFilter === 'identity', triggerRef: (node) => {
                                    triggerRefs.current.identity = node;
                                }, onToggle: () => setOpenFilter(openFilter === 'identity' ? null : 'identity') }), expanded ? (_jsxs(_Fragment, { children: [_jsx(CustomerSelect, { label: "\u4F1A\u5458\u7B49\u7EA7", value: optionLabel(memberCardOptions, draft.memberCardId, '请选择'), isOpen: openFilter === 'level', triggerRef: (node) => {
                                            triggerRefs.current.level = node;
                                        }, onToggle: () => setOpenFilter(openFilter === 'level' ? null : 'level') }), _jsx(CustomerSelect, { label: "\u662F\u5426\u6DFB\u52A0\u4F01\u5FAE", value: optionLabel(customerWechatOptions, draft.wechatState, '请选择'), isOpen: openFilter === 'wechat', triggerRef: (node) => {
                                            triggerRefs.current.wechat = node;
                                        }, onToggle: () => setOpenFilter(openFilter === 'wechat' ? null : 'wechat') }), _jsx(CustomerSelect, { label: "\u5BA2\u6237\u6027\u522B", value: optionLabel(customerGenderOptions, draft.gender, '请选择'), isOpen: openFilter === 'gender', triggerRef: (node) => {
                                            triggerRefs.current.gender = node;
                                        }, onToggle: () => setOpenFilter(openFilter === 'gender' ? null : 'gender') }), _jsx(CustomerSelect, { label: "\u5BA2\u6237\u5E74\u9F84", value: optionLabel(customerAgeOptions, draft.ageRange, '请选择'), isOpen: openFilter === 'age', triggerRef: (node) => {
                                            triggerRefs.current.age = node;
                                        }, onToggle: () => setOpenFilter(openFilter === 'age' ? null : 'age') }), _jsx(DateRangeField, { label: "\u6210\u4E3A\u5BA2\u6237\u65F6\u95F4", start: draft.firstMemberStartTime, end: draft.firstMemberEndTime, onStart: (value) => patchDraft({ firstMemberStartTime: value }), onEnd: (value) => patchDraft({ firstMemberEndTime: value }) }), _jsx(DateRangeField, { label: "\u6210\u4E3A\u4F1A\u5458\u65F6\u95F4", start: draft.firstMemberCardStartTime, end: draft.firstMemberCardEndTime, onStart: (value) => patchDraft({ firstMemberCardStartTime: value }), onEnd: (value) => patchDraft({ firstMemberCardEndTime: value }) }), _jsx(DateRangeField, { label: "\u6700\u8FD1\u8DDF\u8FDB\u65F6\u95F4", start: draft.lastFollowStartTime, end: draft.lastFollowEndTime, onStart: (value) => patchDraft({ lastFollowStartTime: value }), onEnd: (value) => patchDraft({ lastFollowEndTime: value }) }), _jsx(DateRangeField, { label: "\u6700\u8FD1\u6D88\u8D39\u65F6\u95F4", start: draft.lastConsumeStartTime, end: draft.lastConsumeEndTime, onStart: (value) => patchDraft({ lastConsumeStartTime: value }), onEnd: (value) => patchDraft({ lastConsumeEndTime: value }) }), _jsx(AmountRangeField, { label: "\u6700\u8FD1\u6D88\u8D39\u91D1\u989D", min: draft.lastConsumeMin, max: draft.lastConsumeMax, onMin: (value) => patchDraft({ lastConsumeMin: value }), onMax: (value) => patchDraft({ lastConsumeMax: value }) }), _jsx(AmountRangeField, { label: "\u7D2F\u8BA1\u6D88\u8D39\u91D1\u989D", min: draft.totalConsumeMin, max: draft.totalConsumeMax, onMin: (value) => patchDraft({ totalConsumeMin: value }), onMax: (value) => patchDraft({ totalConsumeMax: value }) }), _jsx(AmountRangeField, { label: "\u5BA2\u5355\u4EF7", min: draft.avgConsumeMin, max: draft.avgConsumeMax, onMin: (value) => patchDraft({ avgConsumeMin: value }), onMax: (value) => patchDraft({ avgConsumeMax: value }) })] })) : null] }), openFilter && dropdownStyle ? (_jsx("div", { className: "customer-list-options", role: "listbox", "aria-label": `${filterLabel(openFilter)}选项`, style: {
                            left: `${dropdownStyle.left}px`,
                            top: `${dropdownStyle.top}px`,
                            minWidth: `${dropdownStyle.minWidth}px`,
                        }, children: filterOptions(openFilter).map((option) => (_jsx("button", { type: "button", role: "option", "aria-selected": isSelected(openFilter, option.id, draft), onClick: () => (openFilter === 'searchType' ? patchSearchType(option.id) : chooseFilter(openFilter, option.id)), children: option.label }, option.id))) })) : null, _jsxs("div", { className: "customer-list-query__actions", children: [_jsxs("button", { type: "button", className: "is-link", onClick: () => setExpanded((current) => !current), children: [expanded ? '收起' : '展开', " ", _jsx("span", { "aria-hidden": "true", children: expanded ? '▲' : '▼' })] }), _jsx("button", { type: "button", className: "is-primary", onClick: submitQuery, disabled: loading, children: loading ? '查询中' : '查询' }), _jsx("button", { type: "button", onClick: resetFilters, disabled: loading, children: "\u91CD\u7F6E" })] })] }), _jsxs("div", { className: "customer-list-toolbar", children: [_jsx("button", { type: "button", className: "customer-list-export", onClick: handleExport, disabled: loading, children: "\u5BFC\u51FA\u6570\u636E" }), _jsx("button", { type: "button", className: "customer-list-add", onClick: () => setShowAddDialog(true), children: "\u6DFB\u52A0\u5BA2\u6237" })] }), selectedIds.length ? (_jsxs("section", { className: "customer-list-batchbar", "aria-label": "\u6279\u91CF\u64CD\u4F5C", children: [_jsxs("div", { className: "customer-list-batchbar__info", children: ["\u5DF2\u9009 ", selectedIds.length, " \u4F4D\u5BA2\u6237"] }), _jsxs("div", { className: "customer-list-batchbar__actions", children: [_jsx("button", { type: "button", onClick: () => handleBatchAction('coupon'), children: "\u9001\u4F18\u60E0\u5238" }), _jsx("button", { type: "button", onClick: () => handleBatchAction('level'), children: "\u4FEE\u6539\u4F1A\u5458\u7B49\u7EA7" }), _jsx("button", { type: "button", onClick: () => handleBatchAction('tag'), children: "\u6DFB\u52A0\u6807\u7B7E" })] }), _jsx("button", { type: "button", className: "customer-list-batchbar__cancel", onClick: () => {
                            setSelectedIds([]);
                            setNotice('已取消选择客户');
                        }, children: "\u53D6\u6D88\u9009\u62E9" })] })) : null, notice ? (_jsx("div", { className: "customer-list-notice", role: "status", children: notice })) : null, error ? (_jsxs("section", { className: "customer-list-state customer-list-state--error", role: "alert", children: [_jsx("strong", { children: "\u5BA2\u6237\u5217\u8868\u52A0\u8F7D\u5931\u8D25" }), _jsx("span", { children: error }), _jsx("button", { type: "button", onClick: () => {
                            setLoading(true);
                            setError('');
                            setQuery({ ...query, scenario: resolveScenario() });
                        }, children: "\u91CD\u65B0\u52A0\u8F7D" })] })) : null, _jsxs("section", { className: `customer-list-table${loading ? ' is-loading' : ''}`, "aria-label": "\u5BA2\u6237\u5217\u8868\u8868\u683C", children: [loading ? _jsx("div", { className: "customer-list-loading", children: "\u6B63\u5728\u52A0\u8F7D\u5BA2\u6237\u6570\u636E" }) : null, _jsxs("div", { className: "customer-list-table__head", children: [_jsx("label", { className: "customer-list-check", children: _jsx("input", { type: "checkbox", "aria-label": "\u5168\u9009\u5BA2\u6237", checked: Boolean(dashboard?.rows.length) && selectedIds.length === dashboard?.rows.length, onChange: (event) => handleSelectAll(event.target.checked) }) }), tableColumns.map((column) => (_jsx("div", { children: column }, column)))] }), _jsx("div", { className: "customer-list-table__body", children: dashboard?.rows.map((row) => (_jsxs("div", { className: "customer-list-row", children: [_jsx("label", { className: "customer-list-check", children: _jsx("input", { type: "checkbox", "aria-label": `选择${row.name}`, checked: selectedIds.includes(row.id), onChange: (event) => handleSelect(row.id, event.target.checked) }) }), _jsxs("div", { className: "customer-list-profile", children: [_jsx("span", { className: "customer-list-avatar", "aria-hidden": "true" }), _jsxs("div", { children: [_jsx("strong", { children: row.name }), _jsx("span", { children: row.mobile })] })] }), _jsx("div", { children: row.memberNo }), _jsx("div", { children: row.channelName }), _jsx("div", { children: row.memberCardName }), _jsx("div", { children: row.tagNames.length ? row.tagNames.join('、') : '-' }), _jsx("div", { children: row.lastConsumePrice }), _jsx("div", { children: row.totalConsumeCount }), _jsx("div", { children: row.totalConsumePrice }), _jsx("div", { children: row.avgConsumePrice }), _jsx("div", { children: row.isJoinWxCp }), _jsx("div", { children: row.isJoinWx }), _jsx("div", { children: row.isJoinGroup }), _jsx("div", { children: row.firstMemberTime }), _jsx("div", { children: row.firstMemberCardTime }), _jsx("div", { children: row.lastConsumeTime }), _jsx("div", { children: row.lastFollowTime }), _jsxs("div", { className: "customer-list-actions", children: [_jsx("button", { type: "button", onClick: () => navigate(`/customer/list/detail?id=${row.id}`), children: "\u8BE6\u60C5" }), _jsx("button", { ref: (node) => {
                                                moreTriggerRefs.current[row.id] = node;
                                            }, type: "button", onClick: () => setMoreCustomer(row), children: "\u66F4\u591A" })] })] }, row.id))) }), !loading && !error && dashboard?.rows.length === 0 ? _jsx("div", { className: "customer-list-empty", children: "\u6682\u65E0\u7B26\u5408\u6761\u4EF6\u7684\u5BA2\u6237" }) : null, _jsxs("footer", { className: "customer-list-pagination", children: [_jsx("span", { children: paginationText(dashboard) }), [1, 2, 3, 4, 5].map((pageNum) => (_jsx("button", { type: "button", className: dashboard?.pagination.page === pageNum ? 'is-active' : '', onClick: () => handlePageChange(pageNum), children: pageNum }, pageNum))), _jsx("em", { children: "..." }), _jsx("button", { type: "button", onClick: () => handlePageChange(30), children: "30" }), _jsx("button", { type: "button", "aria-label": "\u4E0B\u4E00\u9875", onClick: () => handlePageChange(Math.min((dashboard?.pagination.page ?? 1) + 1, 30)), children: "\u2192" }), _jsxs("button", { type: "button", className: "customer-list-page-size", children: [dashboard?.pagination.pageSize ?? 20, " \u6761/\u9875"] })] })] }), moreCustomer && moreMenuStyle ? (_jsxs("div", { className: "customer-list-more-menu", style: { left: `${moreMenuStyle.left}px`, top: `${moreMenuStyle.top}px` }, role: "menu", "aria-label": "\u5BA2\u6237\u66F4\u591A\u64CD\u4F5C", children: [_jsx("button", { type: "button", role: "menuitem", onClick: () => handleMoreAction('coupon'), children: "\u9001\u4F18\u60E0\u5238" }), _jsx("button", { type: "button", role: "menuitem", onClick: () => handleMoreAction('level'), children: "\u4FEE\u6539\u4F1A\u5458\u7B49\u7EA7" }), _jsx("button", { type: "button", role: "menuitem", onClick: () => handleMoreAction('tag'), children: "\u4FEE\u6539\u6807\u7B7E" })] })) : null, showAddDialog ? _jsx(AddCustomerDialog, { onClose: () => setShowAddDialog(false), onSaved: (message) => setNotice(message) }) : null, couponCustomer ? _jsx(CouponPickerDialog, { customer: couponCustomer, onClose: () => setCouponCustomer(null) }) : null, levelCustomer ? _jsx(LevelDialog, { customer: levelCustomer, onClose: () => setLevelCustomer(null), onSaved: (message) => setNotice(message) }) : null, tagCustomer ? _jsx(TagDialog, { customer: tagCustomer, onClose: () => setTagCustomer(null), onSaved: (message) => setNotice(message) }) : null] }));
}
function CustomerSelect({ label, value, isOpen, triggerRef, onToggle, }) {
    return (_jsxs("label", { className: "customer-list-field", children: [_jsxs("span", { children: [label, ":"] }), _jsx("button", { ref: triggerRef, type: "button", className: "customer-list-select", "aria-haspopup": "listbox", "aria-expanded": isOpen, "aria-label": `${label} ${value}`, onClick: onToggle, children: value })] }));
}
function DateRangeField({ label, start, end, onStart, onEnd, }) {
    return (_jsxs("div", { className: "customer-list-field customer-list-date", role: "group", "aria-label": label, children: [_jsxs("span", { children: [label, ":"] }), _jsxs("div", { className: "customer-list-date__range", children: [_jsx("input", { type: "date", "aria-label": `${label}开始`, value: start, onChange: (event) => onStart(event.target.value) }), _jsx("em", { children: "\u81F3" }), _jsx("input", { type: "date", "aria-label": `${label}结束`, value: end, onChange: (event) => onEnd(event.target.value) })] })] }));
}
function AmountRangeField({ label, min, max, onMin, onMax, }) {
    return (_jsxs("div", { className: "customer-list-field customer-list-amount", role: "group", "aria-label": label, children: [_jsxs("span", { children: [label, ":"] }), _jsxs("div", { className: "customer-list-amount__range", children: [_jsx("input", { "aria-label": `${label}最小值`, placeholder: "\u8BF7\u8F93\u5165", value: min, onChange: (event) => onMin(event.target.value) }), _jsx("em", { children: "-" }), _jsx("input", { "aria-label": `${label}最大值`, placeholder: "\u8BF7\u8F93\u5165", value: max, onChange: (event) => onMax(event.target.value) })] })] }));
}
function AddCustomerDialog({ onClose, onSaved }) {
    const [mobile, setMobile] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    async function handleSave() {
        setError('');
        if (!mobile.trim()) {
            setError('请输入手机号');
            return;
        }
        setSaving(true);
        try {
            await saveCustomer({
                mobile,
                name,
                gender: '',
                channelName: '自来客',
                firstMemberTime: '2026-05-18 10:00:00',
                remark: '',
            });
            onSaved('客户已保存');
            onClose();
        }
        catch (reason) {
            setError(reason instanceof Error ? reason.message : '客户保存失败');
        }
        finally {
            setSaving(false);
        }
    }
    return (_jsx("div", { className: "customer-list-modal-backdrop", children: _jsxs("section", { className: "customer-list-modal", role: "dialog", "aria-modal": "true", "aria-label": "\u6DFB\u52A0\u5BA2\u6237", children: [_jsxs("header", { children: [_jsx("h2", { children: "\u6DFB\u52A0\u5BA2\u6237" }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u6DFB\u52A0\u5BA2\u6237", onClick: onClose, children: "\u00D7" })] }), _jsxs("div", { className: "customer-list-modal__body", children: [error ? (_jsx("div", { className: "customer-list-dialog-error", role: "alert", children: error })) : null, _jsx(DialogField, { label: "\u624B\u673A\u53F7", required: true, placeholder: "\u8BF7\u8F93\u5165\u624B\u673A\u53F7", value: mobile, onChange: setMobile }), _jsx(DialogField, { label: "\u59D3\u540D", placeholder: "\u8BF7\u8F93\u5165\u59D3\u540D", value: name, onChange: setName }), _jsx(DialogSelect, { label: "\u6027\u522B", placeholder: "\u8BF7\u9009\u62E9" }), _jsx(DialogField, { label: "\u751F\u65E5", type: "date", placeholder: "\u8BF7\u9009\u62E9\u65E5\u671F" }), _jsx(DialogField, { label: "\u5730\u533A", placeholder: "\u8BF7\u8F93\u5165" }), _jsx(DialogSelect, { label: "\u5BA2\u6237\u6E20\u9053", required: true, placeholder: "\u81EA\u6765\u5BA2" }), _jsx(DialogField, { label: "\u6210\u4E3A\u5BA2\u6237\u65F6\u95F4", type: "date", required: true, defaultValue: "2026-05-18" }), _jsx(DialogField, { label: "\u5FAE\u4FE1", placeholder: "\u8BF7\u8F93\u5165\u5FAE\u4FE1" }), _jsx(DialogField, { label: "\u90AE\u7BB1", placeholder: "\u8BF7\u8F93\u5165\u90AE\u7BB1" }), _jsx(DialogField, { label: "QQ", placeholder: "QQ" }), _jsx(DialogSelect, { label: "\u662F\u5426\u52A0\u5FAE\u4FE1", placeholder: "\u8BF7\u9009\u62E9" }), _jsx(DialogSelect, { label: "\u662F\u5426\u52A0\u7FA4", placeholder: "\u8BF7\u9009\u62E9" }), _jsx(DialogField, { label: "\u5907\u6CE8", placeholder: "\u8BF7\u8F93\u5165\u5907\u6CE8" })] }), _jsxs("footer", { children: [_jsx("button", { type: "button", onClick: onClose, children: "\u53D6\u6D88" }), _jsx("button", { type: "button", className: "is-primary", onClick: handleSave, disabled: saving, children: saving ? '保存中' : '保存' })] })] }) }));
}
function CouponPickerDialog({ customer, onClose }) {
    const navigate = useNavigate();
    return (_jsx("div", { className: "customer-list-modal-backdrop", children: _jsxs("section", { className: "customer-list-modal customer-list-modal--wide", role: "dialog", "aria-modal": "true", "aria-label": "\u9009\u62E9\u4F18\u60E0\u5238", children: [_jsxs("header", { children: [_jsxs("div", { className: "customer-list-modal-tabs", children: [_jsx("h2", { children: "\u9009\u62E9\u4F18\u60E0\u5238" }), _jsx("button", { type: "button", className: "customer-list-tab-chip is-active", onClick: () => {
                                        onClose();
                                        navigate('/mallManagement/couponMgt');
                                    }, children: "\u4F18\u60E0\u5238\u7BA1\u7406" })] }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u9009\u62E9\u4F18\u60E0\u5238", onClick: onClose, children: "\u00D7" })] }), _jsx("div", { className: "customer-list-modal__body customer-list-coupon-body", children: _jsxs("div", { className: "customer-list-coupon-table", "aria-label": `${customer.name}优惠券选择`, children: [_jsxs("div", { className: "customer-list-coupon-head", children: [_jsx("label", { className: "customer-list-check", children: _jsx("input", { type: "checkbox", "aria-label": "\u5168\u9009\u4F18\u60E0\u5238" }) }), _jsx("span", { children: "\u4F18\u60E0\u5238\u540D\u79F0" }), _jsx("span", { children: "\u4F18\u60E0\u5238\u7C7B\u578B" }), _jsx("span", { children: "\u9886\u53D6\u6761\u4EF6" }), _jsx("span", { children: "\u4F18\u60E0\u529B\u5EA6" }), _jsx("span", { children: "\u6D3E\u53D1\u4E0A\u9650" }), _jsx("span", { children: "\u9650\u9886\u6B21\u6570" }), _jsx("span", { children: "\u5269\u4F59\u5E93\u5B58" }), _jsx("span", { children: "\u751F\u6548\u8303\u56F4" })] }), _jsxs("div", { className: "customer-list-coupon-empty", children: [_jsx("div", { className: "customer-list-coupon-empty__icon", "aria-hidden": "true" }), _jsx("span", { children: "\u6682\u65E0\u6570\u636E" })] })] }) }), _jsxs("footer", { className: "customer-list-coupon-footer", children: [_jsx("span", { children: "\u5DF2\u9009\u4E2D 0 \u9879" }), _jsx("button", { type: "button", className: "is-primary is-disabled", disabled: true, children: "\u786E\u5B9A" })] })] }) }));
}
function LevelDialog({ customer, onClose, onSaved, }) {
    const [remark, setRemark] = useState('');
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState('');
    return (_jsx("div", { className: "customer-list-modal-backdrop", children: _jsxs("section", { className: "customer-list-modal", role: "dialog", "aria-modal": "true", "aria-label": "\u4FEE\u6539\u4F1A\u5458\u7B49\u7EA7", children: [_jsxs("header", { children: [_jsx("h2", { children: "\u4FEE\u6539\u4F1A\u5458\u7B49\u7EA7" }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u4FEE\u6539\u4F1A\u5458\u7B49\u7EA7", onClick: onClose, children: "\u00D7" })] }), _jsxs("div", { className: "customer-list-modal__body customer-list-level-body", children: [_jsxs("div", { className: "customer-list-current-level", children: ["\u5F53\u524D\u4F1A\u5458\u7B49\u7EA7\uFF1A", customer.memberCardName || '普通会员'] }), _jsx(DialogSelect, { label: "\u4FEE\u6539\u7B49\u7EA7\u81F3", required: true, placeholder: selected || '请选择会员等级', expanded: open, onToggle: () => setOpen((current) => !current) }), open ? (_jsx("div", { className: "customer-list-inline-options", role: "listbox", "aria-label": "\u4F1A\u5458\u7B49\u7EA7\u9009\u9879", children: levelDialogOptions.map((option) => (_jsx("button", { type: "button", role: "option", "aria-selected": selected === option, onClick: () => {
                                    setSelected(option);
                                    setOpen(false);
                                }, children: option }, option))) })) : null, _jsx(DialogField, { label: "\u5907\u6CE8", placeholder: "\u8BF7\u8F93\u5165\u5907\u6CE8", value: remark, onChange: setRemark })] }), _jsxs("footer", { children: [_jsx("button", { type: "button", onClick: onClose, children: "\u53D6\u6D88" }), _jsx("button", { type: "button", className: "is-primary", onClick: () => {
                                onSaved(`客户会员等级已更新：${customer.name}`);
                                onClose();
                            }, children: "\u786E\u5B9A" })] })] }) }));
}
function TagDialog({ customer, onClose, onSaved, }) {
    const [keyword, setKeyword] = useState('');
    return (_jsx("div", { className: "customer-list-modal-backdrop", children: _jsxs("section", { className: "customer-list-modal customer-list-modal--tag", role: "dialog", "aria-modal": "true", "aria-label": "\u9009\u62E9\u6807\u7B7E", children: [_jsxs("header", { children: [_jsx("h2", { children: "\u9009\u62E9\u6807\u7B7E" }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u9009\u62E9\u6807\u7B7E", onClick: onClose, children: "\u00D7" })] }), _jsxs("div", { className: "customer-list-modal__body customer-list-tag-body", children: [_jsxs("div", { className: "customer-list-tag-toolbar", children: [_jsx("input", { "aria-label": "\u641C\u7D22\u6807\u7B7E", placeholder: "\u641C\u7D22\u6807\u7B7E", value: keyword, onChange: (event) => setKeyword(event.target.value) }), _jsx("button", { type: "button", children: "+ \u6DFB\u52A0\u6807\u7B7E" })] }), _jsx("section", { className: "customer-list-tag-selected", "aria-label": `${customer.name}已选标签`, children: _jsx("strong", { children: "\u5DF2\u9009\u6807\u7B7E" }) })] }), _jsxs("footer", { children: [_jsx("button", { type: "button", onClick: onClose, children: "\u53D6\u6D88" }), _jsx("button", { type: "button", className: "is-primary", onClick: () => {
                                onSaved(`客户标签已更新：${customer.name}`);
                                onClose();
                            }, children: "\u5B8C\u6210" })] })] }) }));
}
function DialogField({ label, type, placeholder, required, defaultValue, value, onChange, }) {
    return (_jsxs("label", { className: "customer-list-dialog-field", children: [_jsxs("span", { children: [required ? _jsx("b", { "aria-hidden": "true", children: "*" }) : null, label, ":"] }), _jsx("input", { type: type ?? 'text', "aria-label": label, placeholder: placeholder, defaultValue: defaultValue, value: value, onChange: (event) => onChange?.(event.target.value) })] }));
}
function DialogSelect({ label, placeholder, required, expanded, onToggle, }) {
    return (_jsxs("label", { className: "customer-list-dialog-field", children: [_jsxs("span", { children: [required ? _jsx("b", { "aria-hidden": "true", children: "*" }) : null, label, ":"] }), _jsx("button", { type: "button", className: "customer-list-dialog-select", "aria-label": `${label} ${placeholder}`, "aria-expanded": expanded, onClick: onToggle, children: placeholder })] }));
}
function filterOptions(key) {
    if (key === 'searchType')
        return searchTypes;
    if (key === 'status')
        return customerStatusOptions;
    if (key === 'identity')
        return customerIdentityOptions;
    if (key === 'level')
        return memberCardOptions;
    if (key === 'wechat')
        return customerWechatOptions;
    if (key === 'gender')
        return customerGenderOptions;
    return customerAgeOptions;
}
function filterLabel(key) {
    const labels = {
        searchType: '搜索类型',
        status: '客户状态',
        identity: '客户身份',
        level: '会员等级',
        wechat: '是否添加企微',
        gender: '客户性别',
        age: '客户年龄',
    };
    return labels[key];
}
function isSelected(key, id, query) {
    if (key === 'searchType')
        return query.memberSearchType === id;
    if (key === 'status')
        return query.status === id;
    if (key === 'identity')
        return query.identity === id;
    if (key === 'level')
        return query.memberCardId === id;
    if (key === 'wechat')
        return query.wechatState === id;
    if (key === 'gender')
        return query.gender === id;
    return query.ageRange === id;
}
function optionLabel(options, id, fallback) {
    if (!id)
        return fallback;
    return options.find((option) => option.id === id)?.label ?? fallback;
}
function searchTypeLabel(value) {
    return searchTypes.find((item) => item.id === value)?.label ?? '手机号';
}
function paginationText(dashboard) {
    if (!dashboard)
        return '第 0-0 条 / 共 0 条';
    const start = dashboard.pagination.total === 0 ? 0 : (dashboard.pagination.page - 1) * dashboard.pagination.pageSize + 1;
    const end = Math.min(dashboard.pagination.page * dashboard.pagination.pageSize, dashboard.pagination.total);
    return `第 ${start}-${end} 条 / 共 ${dashboard.pagination.total} 条`;
}
function resolveScenario() {
    const value = window.localStorage.getItem('pms.customerList.scenario');
    return value === 'empty' || value === 'error' ? value : 'success';
}
function createInitialCustomerListQuery() {
    const next = createDefaultCustomerListQuery();
    if (typeof window !== 'undefined')
        next.scenario = resolveScenario();
    return next;
}
