import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { defaultCouponFilters, fetchCouponList, fetchCouponTasks, } from '../services/coupon';
import './CouponPage.css';
const couponColumns = ['', '优惠力度', '可用范围', '派发上限', '每人可领数', '派发时间', '时效类型', '生效时间', '操作'];
const taskColumns = ['派发方式', '优惠券', '已派数量', '创建时间', '记录'];
const shelfStatusOptions = [
    { label: '请选择', value: 'all' },
    { label: '已上架', value: 'enabled' },
    { label: '已下架', value: 'disabled' },
];
const defaultCouponForm = {
    name: '',
    type: '满减券',
    fullAmount: '0',
    minusAmount: '0',
    scopeText: '选择商品/房型',
    receiveRule: 'all',
    memberRule: 'shared',
    sendLimit: '0',
    perUserLimit: '0',
    sendDateStart: '',
    sendDateEnd: '',
    timeMode: 'days',
    validDays: '0',
    delayDays: '0',
    fixedDateStart: '',
    fixedDateEnd: '',
    disabledHoliday: false,
    disabledWeekend: false,
    disabledCustom: false,
};
export function CouponPage() {
    const location = useLocation();
    return location.pathname.endsWith('/edit') ? _jsx(CouponEditPage, {}) : _jsx(CouponListPage, {});
}
function CouponListPage() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('优惠券管理');
    const [draftStatus, setDraftStatus] = useState('all');
    const [filters, setFilters] = useState(defaultCouponFilters);
    const [taskPage] = useState(1);
    const [listState, setListState] = useState({ status: 'loading' });
    const [taskState, setTaskState] = useState({ status: 'loading' });
    const [dialog, setDialog] = useState(null);
    useEffect(() => {
        const controller = new AbortController();
        fetchCouponList(filters, controller.signal)
            .then((data) => setListState({ status: 'success', data }))
            .catch((error) => {
            if (controller.signal.aborted)
                return;
            setListState({ status: 'error', message: error.message || '优惠券数据加载失败' });
        });
        return () => controller.abort();
    }, [filters]);
    useEffect(() => {
        const controller = new AbortController();
        fetchCouponTasks({ campId: filters.campId, pageNum: taskPage, pageSize: filters.pageSize }, controller.signal)
            .then((data) => setTaskState({ status: 'success', data }))
            .catch((error) => {
            if (controller.signal.aborted)
                return;
            setTaskState({ status: 'error', message: error.message || '派发任务数据加载失败' });
        });
        return () => controller.abort();
    }, [filters.campId, filters.pageSize, taskPage]);
    function queryCoupons() {
        setFilters((current) => ({ ...current, shelfStatus: draftStatus, pageNum: 1 }));
    }
    function resetFilters() {
        setDraftStatus('all');
        setFilters(defaultCouponFilters);
    }
    return (_jsxs("div", { className: "coupon-page", children: [_jsxs("section", { className: "coupon-card coupon-list-card", "aria-label": "\u4F18\u60E0\u5238\u7BA1\u7406", children: [_jsx("div", { className: "coupon-tabs", role: "tablist", "aria-label": "\u4F18\u60E0\u5238\u9875\u9762", children: ['优惠券管理', '派发任务'].map((tab) => (_jsx("button", { type: "button", role: "tab", "aria-selected": activeTab === tab, className: activeTab === tab ? 'is-active' : '', onClick: () => setActiveTab(tab), children: tab }, tab))) }), activeTab === '优惠券管理' ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "coupon-query coupon-query--split", "aria-label": "\u4F18\u60E0\u5238\u7B5B\u9009", children: [_jsxs("label", { className: "coupon-field", children: [_jsx("span", { children: "\u4E0A\u67B6\u72B6\u6001\uFF1A" }), _jsx("select", { className: "coupon-native-select", "aria-label": "\u4E0A\u67B6\u72B6\u6001", value: draftStatus, onChange: (event) => setDraftStatus(event.target.value), children: shelfStatusOptions.map((option) => (_jsx("option", { value: option.value, children: option.label }, option.value))) })] }), _jsxs("div", { className: "coupon-actions", children: [_jsx("button", { type: "button", className: "is-primary", onClick: queryCoupons, children: "\u67E5 \u8BE2" }), _jsx("button", { type: "button", onClick: resetFilters, children: "\u91CD \u7F6E" })] })] }), _jsxs("div", { className: "coupon-toolbar", children: [_jsx("button", { type: "button", className: "is-primary", onClick: () => setActiveTab('派发任务'), children: "\u6D3E\u53D1\u4EFB\u52A1" }), _jsx("button", { type: "button", className: "is-primary", onClick: () => navigate('/mallManagement/couponMgt/edit'), children: "+ \u65B0\u5EFA" })] }), _jsx(DataFeedback, { state: listState }), listState.status === 'success' ? (_jsx(CouponDataTable, { data: listState.data, onDetail: (coupon) => setDialog({ type: 'coupon-detail', coupon }) })) : null] })) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: "coupon-task-toolbar", children: [_jsx("button", { type: "button", className: "is-primary", children: "\u5168\u90E8\u8BB0\u5F55" }), _jsx("button", { type: "button", className: "is-primary", onClick: () => setDialog({ type: 'task-create' }), children: "\u65B0\u5EFA\u4EFB\u52A1" })] }), _jsx(DataFeedback, { state: taskState }), taskState.status === 'success' ? _jsx(TaskDataTable, { data: taskState.data }) : null] }))] }), _jsx(CouponDialog, { dialog: dialog, onClose: () => setDialog(null) })] }));
}
function CouponEditPage() {
    const navigate = useNavigate();
    const [dialog, setDialog] = useState(null);
    const [notice, setNotice] = useState('');
    const [form, setForm] = useState(defaultCouponForm);
    function updateForm(key, value) {
        setForm((current) => ({ ...current, [key]: value }));
    }
    function submitForm() {
        setNotice('优惠券已保存，可返回列表继续查看');
    }
    const effectiveText = form.timeMode === 'days'
        ? `${form.validDays || '0'} 天`
        : form.fixedDateStart && form.fixedDateEnd
            ? `${form.fixedDateStart} 至 ${form.fixedDateEnd}`
            : '请选择固定时间';
    return (_jsxs("div", { className: "coupon-page coupon-edit-page", children: [_jsxs("section", { className: "coupon-card coupon-edit-card", "aria-label": "\u4F18\u60E0\u5238\u8868\u5355", children: [_jsxs("div", { className: "coupon-breadcrumb", children: [_jsx("button", { type: "button", className: "coupon-breadcrumb__link", onClick: () => navigate('/mallManagement/couponMgt'), children: "\u4F18\u60E0\u5238\u5217\u8868" }), _jsx("span", { children: ">" }), _jsx("span", { children: "\u65B0\u589E" })] }), _jsx(Feedback, { notice: notice }), _jsxs("div", { className: "coupon-form-grid", children: [_jsxs("label", { className: "coupon-form-field", children: [_jsxs("span", { children: [_jsx("i", { children: "*" }), " \u540D\u79F0:"] }), _jsx("input", { "aria-label": "\u540D\u79F0", placeholder: "\u8BF7\u8F93\u5165\u4F18\u60E0\u5238\u540D\u79F0", value: form.name, onChange: (event) => updateForm('name', event.target.value) })] }), _jsxs("label", { className: "coupon-form-field", children: [_jsx("span", { children: "\u7C7B\u578B:" }), _jsx("select", { className: "coupon-native-select", "aria-label": "\u7C7B\u578B", value: form.type, onChange: (event) => updateForm('type', event.target.value), children: _jsx("option", { value: "\u6EE1\u51CF\u5238", children: "\u6EE1\u51CF\u5238" }) })] }), _jsxs("div", { className: "coupon-money-row", children: [_jsxs("span", { children: [_jsx("i", { children: "*" }), " \u4F18\u60E0\u91D1\u989D:"] }), _jsxs("label", { children: ["\u6EE1", _jsx("input", { "aria-label": "\u6EE1\u989D\u91D1\u989D", value: form.fullAmount, onChange: (event) => updateForm('fullAmount', event.target.value) }), "\u5143\uFF0C\u51CF", _jsx("input", { "aria-label": "\u51CF\u514D\u91D1\u989D", value: form.minusAmount, onChange: (event) => updateForm('minusAmount', event.target.value) }), "\u5143"] })] }), _jsxs("label", { className: "coupon-form-field", children: [_jsxs("span", { children: [_jsx("i", { children: "*" }), " \u751F\u6548\u8303\u56F4:"] }), _jsx("button", { type: "button", className: "coupon-select coupon-select-button", "aria-label": "\u9009\u62E9\u5546\u54C1/\u623F\u578B", onClick: () => setDialog({ type: 'product-picker' }), children: form.scopeText })] }), _jsxs("fieldset", { className: "coupon-radio-row", children: [_jsxs("legend", { children: [_jsx("i", { children: "*" }), " \u9886\u5238\u6761\u4EF6:"] }), _jsxs("label", { children: [_jsx("input", { type: "radio", name: "receiveRule", checked: form.receiveRule === 'all', onChange: () => updateForm('receiveRule', 'all') }), "\u6240\u6709\u4EBA\u53EF\u4EE5\u9886"] }), _jsxs("label", { children: [_jsx("input", { type: "radio", name: "receiveRule", checked: form.receiveRule === 'new', onChange: () => updateForm('receiveRule', 'new') }), "\u4EC5\u9650\u65B0\u7528\u6237\u53EF\u9886\u53D6"] }), _jsxs("label", { children: [_jsx("input", { type: "radio", name: "receiveRule", checked: form.receiveRule === 'old', onChange: () => updateForm('receiveRule', 'old') }), "\u4EC5\u9650\u8001\u7528\u6237\u53EF\u9886\u53D6"] })] }), _jsxs("fieldset", { className: "coupon-radio-row", children: [_jsxs("legend", { children: [_jsx("i", { children: "*" }), " \u4F7F\u7528\u6761\u4EF6:"] }), _jsxs("label", { children: [_jsx("input", { type: "radio", name: "memberRule", checked: form.memberRule === 'shared', onChange: () => updateForm('memberRule', 'shared') }), "\u53EF\u4EE5\u4E0E\u4F1A\u5458\u6298\u6263\u5171\u7528"] }), _jsxs("label", { children: [_jsx("input", { type: "radio", name: "memberRule", checked: form.memberRule === 'exclusive', onChange: () => updateForm('memberRule', 'exclusive') }), "\u4E0D\u53EF\u4E0E\u4F1A\u5458\u6298\u6263\u5171\u4EAB"] })] }), _jsxs("label", { className: "coupon-form-field coupon-unit-field", children: [_jsxs("span", { children: [_jsx("i", { children: "*" }), " \u6D3E\u53D1\u4E0A\u9650:"] }), _jsx("input", { "aria-label": "\u6D3E\u53D1\u4E0A\u9650", value: form.sendLimit, onChange: (event) => updateForm('sendLimit', event.target.value) }), _jsx("em", { children: "\u5F20" })] }), _jsxs("label", { className: "coupon-form-field coupon-unit-field", children: [_jsxs("span", { children: [_jsx("i", { children: "*" }), " \u6BCF\u4EBA\u53EF\u9886\u6570:"] }), _jsx("input", { "aria-label": "\u6BCF\u4EBA\u53EF\u9886\u6570", value: form.perUserLimit, onChange: (event) => updateForm('perUserLimit', event.target.value) }), _jsx("em", { children: "\u5F20" })] }), _jsxs("div", { className: "coupon-form-field coupon-date-range-field", children: [_jsxs("span", { children: [_jsx("i", { children: "*" }), " \u6D3E\u53D1\u65F6\u95F4:"] }), _jsxs("div", { className: "coupon-date-range", children: [_jsx("input", { type: "date", "aria-label": "\u6D3E\u53D1\u5F00\u59CB\u65E5\u671F", value: form.sendDateStart, onChange: (event) => updateForm('sendDateStart', event.target.value) }), _jsx("span", { className: "coupon-date-range__divider", children: "\u81F3" }), _jsx("input", { type: "date", "aria-label": "\u6D3E\u53D1\u7ED3\u675F\u65E5\u671F", value: form.sendDateEnd, onChange: (event) => updateForm('sendDateEnd', event.target.value) })] })] }), _jsxs("fieldset", { className: "coupon-radio-row", children: [_jsx("legend", { children: "\u65F6\u6548\u7C7B\u578B:" }), _jsxs("label", { children: [_jsx("input", { type: "radio", name: "timeMode", checked: form.timeMode === 'days', onChange: () => updateForm('timeMode', 'days') }), "\u6709\u6548\u5929\u6570"] }), _jsxs("label", { children: [_jsx("input", { type: "radio", name: "timeMode", checked: form.timeMode === 'fixed', onChange: () => updateForm('timeMode', 'fixed') }), "\u56FA\u5B9A\u65F6\u95F4"] })] }), form.timeMode === 'days' ? (_jsxs(_Fragment, { children: [_jsxs("label", { className: "coupon-form-field coupon-unit-field", children: [_jsxs("span", { children: [_jsx("i", { children: "*" }), " \u6709\u6548\u671F:"] }), _jsx("input", { "aria-label": "\u6709\u6548\u671F\u5929\u6570", value: form.validDays, onChange: (event) => updateForm('validDays', event.target.value) }), _jsx("em", { children: "\u5929" })] }), _jsxs("label", { className: "coupon-form-field coupon-unit-field", children: [_jsx("span", { children: "\u9694\u5929\u751F\u6548:" }), _jsx("input", { "aria-label": "\u9694\u5929\u751F\u6548\u5929\u6570", value: form.delayDays, onChange: (event) => updateForm('delayDays', event.target.value) }), _jsx("em", { children: "\u5929" })] })] })) : (_jsxs("div", { className: "coupon-form-field coupon-date-range-field", children: [_jsxs("span", { children: [_jsx("i", { children: "*" }), " \u56FA\u5B9A\u65F6\u95F4:"] }), _jsxs("div", { className: "coupon-date-range", children: [_jsx("input", { type: "date", "aria-label": "\u56FA\u5B9A\u5F00\u59CB\u65E5\u671F", value: form.fixedDateStart, onChange: (event) => updateForm('fixedDateStart', event.target.value) }), _jsx("span", { className: "coupon-date-range__divider", children: "\u81F3" }), _jsx("input", { type: "date", "aria-label": "\u56FA\u5B9A\u7ED3\u675F\u65E5\u671F", value: form.fixedDateEnd, onChange: (event) => updateForm('fixedDateEnd', event.target.value) })] })] })), _jsxs("fieldset", { className: "coupon-radio-row coupon-unavailable-row", children: [_jsx("legend", { children: "\u4E0D\u53EF\u7528\u65F6\u95F4:" }), _jsxs("label", { children: [_jsx("input", { type: "checkbox", checked: form.disabledHoliday, onChange: (event) => updateForm('disabledHoliday', event.target.checked) }), "\u8282\u5047\u65E5"] }), _jsx("button", { type: "button", className: "coupon-text-link", onClick: () => setDialog({ type: 'holidays' }), children: "\u67E5\u770B\u9ED8\u8BA4\u8282\u5047\u65E5\u5217\u8868" }), _jsxs("label", { children: [_jsx("input", { type: "checkbox", checked: form.disabledWeekend, onChange: (event) => updateForm('disabledWeekend', event.target.checked) }), "\u5468\u672B"] }), _jsx("span", { children: "\u661F\u671F\u4E94~\u516D\u4E0D\u53EF\u4F7F\u7528" }), _jsxs("label", { children: [_jsx("input", { type: "checkbox", checked: form.disabledCustom, onChange: (event) => updateForm('disabledCustom', event.target.checked) }), "\u81EA\u5B9A\u4E49"] })] }), _jsx("div", { className: "coupon-form-summary", children: _jsxs("span", { children: ["\u5F53\u524D\u751F\u6548\u8BBE\u7F6E\uFF1A", effectiveText] }) })] }), _jsxs("footer", { className: "coupon-edit-footer", children: [_jsx("button", { type: "button", onClick: () => navigate('/mallManagement/couponMgt'), children: "\u8FD4\u56DE\u5217\u8868" }), _jsx("button", { type: "button", className: "is-primary", onClick: submitForm, children: "\u63D0 \u4EA4" })] })] }), _jsx(CouponDialog, { dialog: dialog, onClose: () => setDialog(null), onConfirmProduct: () => {
                    updateForm('scopeText', '顶层套房/总裁套间');
                    setDialog(null);
                    setNotice('已选择商品/房型');
                } })] }));
}
function DataFeedback({ state }) {
    if (state.status === 'loading')
        return null;
    if (state.status === 'error')
        return _jsx(TableShellError, { text: state.message });
    return null;
}
function Feedback({ notice }) {
    return notice ? (_jsx("div", { className: "coupon-notice", role: "status", children: notice })) : null;
}
function CouponDataTable({ data, onDetail }) {
    return (_jsxs("div", { className: "coupon-table coupon-table--coupon", role: "table", "aria-label": "\u4F18\u60E0\u5238\u5217\u8868\u8868\u683C", children: [_jsxs("div", { className: "coupon-table__head", role: "row", children: [_jsx("div", { className: "coupon-checkbox-cell", role: "columnheader", children: _jsx("input", { type: "checkbox", "aria-label": "\u5168\u9009\u4F18\u60E0\u5238" }) }), couponColumns.slice(1).map((column) => (_jsx("div", { role: "columnheader", children: column }, column)))] }), data.list.length > 0 ? (data.list.map((coupon) => (_jsxs("div", { className: "coupon-table__row", role: "row", children: [_jsx("div", { className: "coupon-checkbox-cell", role: "cell", children: _jsx("input", { type: "checkbox", "aria-label": `选择 ${coupon.name}` }) }), _jsx("div", { role: "cell", children: coupon.discountText }), _jsx("div", { role: "cell", children: coupon.scopeText }), _jsx("div", { role: "cell", children: coupon.sendLimit }), _jsx("div", { role: "cell", children: coupon.perUserLimit }), _jsx("div", { role: "cell", children: coupon.sendTime }), _jsx("div", { role: "cell", children: coupon.validityType }), _jsx("div", { role: "cell", children: coupon.effectiveTime }), _jsx("div", { role: "cell", children: _jsx("button", { type: "button", className: "coupon-link-button", "aria-label": `查看 ${coupon.name}`, onClick: () => onDetail(coupon), children: "\u67E5\u770B" }) })] }, coupon.id)))) : (_jsx(TableEmpty, { columns: couponColumns.length, text: "\u6682\u65E0\u6570\u636E", inlineScroll: true }))] }));
}
function TaskDataTable({ data }) {
    return (_jsxs("div", { className: "coupon-table coupon-table--task", role: "table", "aria-label": "\u6D3E\u53D1\u4EFB\u52A1\u8868\u683C", children: [_jsx(TableHead, { columns: taskColumns }), data.list.length > 0 ? (data.list.map((task) => (_jsxs("div", { className: "coupon-table__row", role: "row", children: [_jsx("div", { role: "cell", children: task.sendMethod }), _jsx("div", { role: "cell", children: task.couponName }), _jsx("div", { role: "cell", children: task.sentCount }), _jsx("div", { role: "cell", children: task.createdAt }), _jsx("div", { role: "cell", children: task.recordText })] }, task.id)))) : (_jsx(TableEmpty, { columns: taskColumns.length, text: "\u6682\u65E0\u6570\u636E" }))] }));
}
function TableHead({ columns }) {
    return (_jsx("div", { className: "coupon-table__head", role: "row", children: columns.map((column) => (_jsx("div", { role: "columnheader", children: column }, column))) }));
}
function TableEmpty({ columns, text, inlineScroll = false }) {
    return (_jsxs(_Fragment, { children: [_jsx("div", { className: `coupon-empty ${inlineScroll ? 'coupon-empty--scroll' : ''}`, role: "row", children: _jsxs("div", { role: "cell", "aria-colspan": columns, children: [_jsx("span", { className: "coupon-empty__icon", "aria-hidden": "true" }), _jsx("strong", { children: text })] }) }), inlineScroll ? (_jsx("div", { className: "coupon-inline-scrollbar", "aria-hidden": "true", children: _jsx("span", {}) })) : null] }));
}
function TableShellError({ text }) {
    return (_jsx("div", { className: "coupon-error", role: "alert", children: _jsx("span", { children: text }) }));
}
function CouponDialog({ dialog, onClose, onConfirmProduct, }) {
    if (!dialog)
        return null;
    if (dialog.type === 'coupon-detail') {
        return (_jsxs(Modal, { title: "\u4F18\u60E0\u5238\u8BE6\u60C5", closeLabel: "\u5173\u95ED\u4F18\u60E0\u5238\u8BE6\u60C5", onClose: onClose, children: [_jsx("p", { children: dialog.coupon.name }), _jsx("p", { children: dialog.coupon.discountText }), _jsx("p", { children: dialog.coupon.scopeText })] }));
    }
    if (dialog.type === 'task-create') {
        return (_jsxs(Modal, { title: "\u65B0\u5EFA\u6D3E\u53D1\u4EFB\u52A1", closeLabel: "\u53D6\u6D88\u65B0\u5EFA\u6D3E\u53D1\u4EFB\u52A1", onClose: onClose, children: [_jsx("p", { children: "\u9009\u62E9\u4F18\u60E0\u5238\u540E\u53EF\u6309\u4F1A\u5458\u6807\u7B7E\u6D3E\u53D1\u3002" }), _jsx("p", { children: "\u9ED8\u8BA4\u53D1\u9001\u5BF9\u8C61\uFF1A\u8FD1 30 \u5929\u590D\u8D2D\u4F1A\u5458\u3002" })] }));
    }
    if (dialog.type === 'product-picker') {
        return (_jsxs(Modal, { title: "\u9009\u62E9\u5546\u54C1/\u623F\u578B", closeLabel: "\u5173\u95ED\u9009\u62E9\u5546\u54C1/\u623F\u578B", onClose: onClose, children: [_jsx("p", { children: "\u9876\u5C42\u5957\u623F\uFF08\u6D74\u7F38\u5DE8\u5E55\u7535\u7ADE\u9EBB\u5C06\uFF09" }), _jsx("p", { children: "\u603B\u88C1\u5957\u95F4\uFF08\u6851\u62FF\u6D74\u7F38\u9732\u53F0\u7535\u7ADE\u9EBB\u5C06\uFF09" }), _jsx("button", { type: "button", className: "is-primary", onClick: onConfirmProduct, children: "\u786E\u8BA4\u9009\u62E9\u5546\u54C1/\u623F\u578B" })] }));
    }
    return (_jsx(Modal, { title: "\u9ED8\u8BA4\u8282\u5047\u65E5\u5217\u8868", closeLabel: "\u5173\u95ED\u9ED8\u8BA4\u8282\u5047\u65E5\u5217\u8868", onClose: onClose, children: _jsx("p", { children: "\u6625\u8282\u3001\u6E05\u660E\u8282\u3001\u52B3\u52A8\u8282\u3001\u7AEF\u5348\u8282\u3001\u4E2D\u79CB\u8282\u3001\u56FD\u5E86\u8282\u3002" }) }));
}
function Modal({ title, closeLabel, children, onClose }) {
    return (_jsx("div", { className: "coupon-modal-mask", role: "presentation", onMouseDown: onClose, children: _jsxs("section", { className: "coupon-modal", role: "dialog", "aria-label": title, onMouseDown: (event) => event.stopPropagation(), children: [_jsxs("header", { children: [_jsx("strong", { children: title }), _jsx("button", { type: "button", "aria-label": closeLabel, onClick: onClose, children: "\u00D7" })] }), _jsx("div", { className: "coupon-modal__body", children: children })] }) }));
}
