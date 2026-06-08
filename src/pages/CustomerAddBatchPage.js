import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createCustomerAddBatchExportTask, createCustomerAddBatchMarkTask, createCustomerAddBatchSmsTask, fetchCustomerAddBatchDashboard, getDefaultCustomerAddBatchQuery, resolveCustomerAddBatchRuntimeConfig, } from '../services/customerAddBatch';
import { StoreSelectControl } from '../components/StoreSelect';
import './CustomerAddBatchPage.css';
const assetBase = '/scrm-add-batch-assets';
const detailImages = [
    {
        src: `${assetBase}/brandPromotionScrm1136.png`,
        alt: '企微SCRM高效获客留存',
    },
    {
        src: `${assetBase}/brandPromotionScrm1136-2.png`,
        alt: '全自动留存用户',
    },
    {
        src: `${assetBase}/brandPromotionScrm1136-3.png`,
        alt: '高效沟通工具',
    },
];
export function CustomerAddBatchPage() {
    const navigate = useNavigate();
    const runtimeConfig = useMemo(() => resolveCustomerAddBatchRuntimeConfig(window.location), []);
    const [query, setQuery] = useState(() => getDefaultCustomerAddBatchQuery(runtimeConfig));
    const [viewModel, setViewModel] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [notice, setNotice] = useState('批量加好友看板已加载');
    const [openSelect, setOpenSelect] = useState(null);
    const [dialog, setDialog] = useState(null);
    const [sentIds, setSentIds] = useState(() => new Set());
    const [markedIds, setMarkedIds] = useState(() => new Set());
    useEffect(() => {
        const controller = new AbortController();
        fetchCustomerAddBatchDashboard(query, controller.signal)
            .then((result) => {
            setViewModel(result);
            setErrorMessage('');
        })
            .catch((error) => {
            if (controller.signal.aborted)
                return;
            setViewModel(null);
            setErrorMessage(error instanceof Error ? error.message : '批量加好友数据加载失败，请重试');
        })
            .finally(() => {
            if (!controller.signal.aborted)
                setIsLoading(false);
        });
        return () => controller.abort();
    }, [query]);
    const channelName = viewModel?.channelOptions.find((option) => option.value === query.channel)?.label ?? '全部渠道';
    const statusName = viewModel?.statusOptions.find((option) => option.value === query.friendStatus)?.label ?? '全部状态';
    function openSubscribeDetail() {
        navigate(viewModel?.routeTargets.paymentDetail ?? '/version/applicationPayment/detail', { state: { product: 'scrm' } });
    }
    function updateQuery(next, message) {
        setIsLoading(true);
        setQuery((current) => ({ ...current, ...next, page: 1 }));
        setOpenSelect(null);
        setNotice(message);
    }
    function runSearch() {
        setIsLoading(true);
        setQuery((current) => ({ ...current }));
        setNotice('已按当前条件刷新批量加好友数据');
    }
    function resetFilters() {
        setIsLoading(true);
        setQuery(getDefaultCustomerAddBatchQuery(runtimeConfig));
        setOpenSelect(null);
        setDialog(null);
        setNotice('筛选条件已重置');
    }
    function refreshDashboard() {
        setIsLoading(true);
        setQuery((current) => ({ ...current }));
        setNotice('已刷新批量加好友看板');
    }
    function exportDashboard() {
        createCustomerAddBatchExportTask(query);
        setNotice('已生成批量加好友导出任务');
    }
    function sendSms(candidate) {
        createCustomerAddBatchSmsTask(candidate, query);
        setSentIds((current) => new Set(current).add(candidate.id));
        setNotice(`加好友短信已下发：${candidate.customerName}`);
    }
    function markAdded(candidate) {
        createCustomerAddBatchMarkTask(candidate, query);
        setMarkedIds((current) => new Set(current).add(candidate.id));
        setNotice(`已标记为企微好友：${candidate.customerName}`);
    }
    const candidates = (viewModel?.candidates ?? []).map((candidate) => ({
        ...candidate,
        friendStatus: markedIds.has(candidate.id) ? '已添加' : candidate.friendStatus,
        smsStatus: sentIds.has(candidate.id) ? '已发送' : candidate.smsStatus,
    }));
    return (_jsxs("div", { className: "customer-add-batch-page", "data-provider": viewModel?.provider ?? query.provider ?? 'mock', "data-response-state": viewModel?.state ?? query.mockState ?? 'success', "data-request-store": query.storeId, "data-request-channel": query.channel, "data-request-status": query.friendStatus, "data-request-date-start": query.dateStart, "data-request-date-end": query.dateEnd, children: [_jsxs("section", { className: "customer-add-batch-shell", children: [_jsxs("header", { className: "customer-add-batch-hero", children: [_jsxs("div", { className: "customer-add-batch-intro", children: [_jsx("img", { src: `${assetBase}/brandScrmLogo.png`, alt: "", "aria-hidden": "true" }), _jsxs("div", { children: [_jsx("h1", { children: "\u4F01\u5FAESCRM-\u6279\u91CF\u52A0\u597D\u53CB" }), _jsx("p", { children: viewModel?.subscription.description ?? '客户下单后获取到客户手机号，可引导客户添加企业微信。' })] })] }), _jsxs("div", { className: "customer-add-batch-actions", children: [_jsx("span", { children: viewModel?.subscription.priceText ?? '限时免费' }), _jsx("button", { type: "button", onClick: openSubscribeDetail, children: viewModel?.subscription.actionText ?? '立即开通' })] })] }), _jsxs("section", { className: "customer-add-batch-query", "aria-label": "\u6279\u91CF\u52A0\u597D\u53CB\u7B5B\u9009", children: [_jsxs("div", { className: "customer-add-batch-field", children: [_jsx("span", { children: "\u95E8\u5E97:" }), _jsx(StoreSelectControl, { label: "\u95E8\u5E97", className: "customer-add-batch-store-select", options: viewModel?.storeOptions ?? [], value: query.storeId || 'all', disabled: isLoading, onChange: (storeId) => updateQuery({ storeId: storeId === 'all' ? '' : storeId }, '筛选条件已更新') })] }), _jsxs("label", { className: "customer-add-batch-field", children: [_jsx("span", { children: "\u5F00\u59CB\u65E5\u671F:" }), _jsx("input", { "aria-label": "\u5F00\u59CB\u65E5\u671F", value: query.dateStart, placeholder: "YYYY-MM-DD", onChange: (event) => updateQuery({ dateStart: event.target.value }, '开始日期已更新') })] }), _jsxs("label", { className: "customer-add-batch-field", children: [_jsx("span", { children: "\u7ED3\u675F\u65E5\u671F:" }), _jsx("input", { "aria-label": "\u7ED3\u675F\u65E5\u671F", value: query.dateEnd, placeholder: "YYYY-MM-DD", onChange: (event) => updateQuery({ dateEnd: event.target.value }, '结束日期已更新') })] }), _jsxs("div", { className: "customer-add-batch-field", children: [_jsx("span", { children: "\u6E20\u9053:" }), _jsx(SelectButton, { label: "\u6E20\u9053", value: channelName, isOpen: openSelect === 'channel', onClick: () => setOpenSelect(openSelect === 'channel' ? null : 'channel') })] }), _jsxs("div", { className: "customer-add-batch-field", children: [_jsx("span", { children: "\u52A0\u597D\u53CB\u72B6\u6001:" }), _jsx(SelectButton, { label: "\u52A0\u597D\u53CB\u72B6\u6001", value: statusName, isOpen: openSelect === 'friendStatus', onClick: () => setOpenSelect(openSelect === 'friendStatus' ? null : 'friendStatus') })] }), _jsxs("div", { className: "customer-add-batch-query__actions", children: [_jsx("button", { type: "button", className: "is-primary", onClick: runSearch, disabled: isLoading, children: "\u67E5 \u8BE2" }), _jsx("button", { type: "button", onClick: resetFilters, disabled: isLoading, children: "\u91CD \u7F6E" }), _jsx("button", { type: "button", onClick: refreshDashboard, disabled: isLoading, children: "\u5237 \u65B0" }), _jsx("button", { type: "button", onClick: exportDashboard, disabled: !viewModel || isLoading, children: "\u5BFC \u51FA" })] }), openSelect ? (_jsx(SelectOptions, { options: openSelect === 'channel'
                                    ? (viewModel?.channelOptions ?? [])
                                    : (viewModel?.statusOptions ?? []), selected: query[openSelect], onChoose: (value) => updateQuery({ [openSelect]: value }, '筛选条件已更新') })) : null] }), _jsx("div", { className: "customer-add-batch-feedback", role: "status", "aria-label": "\u6279\u91CF\u52A0\u597D\u53CB\u64CD\u4F5C\u53CD\u9988", children: isLoading ? '正在刷新批量加好友数据' : notice }), errorMessage ? (_jsxs("section", { className: "customer-add-batch-error", role: "alert", "aria-label": "\u6279\u91CF\u52A0\u597D\u53CB\u6570\u636E\u9519\u8BEF", children: [_jsx("strong", { children: "\u6279\u91CF\u52A0\u597D\u53CB\u6570\u636E\u52A0\u8F7D\u5931\u8D25" }), _jsx("p", { children: errorMessage }), _jsx("button", { type: "button", onClick: refreshDashboard, children: "\u91CD\u8BD5" })] })) : null, viewModel ? (_jsxs(_Fragment, { children: [_jsx("section", { className: "customer-add-batch-metrics", "aria-label": "\u6279\u91CF\u52A0\u597D\u53CB\u6838\u5FC3\u6307\u6807", children: viewModel.metrics.map((metric) => (_jsxs("button", { type: "button", className: "customer-add-batch-metric", onClick: () => setDialog({ type: 'metric', metric }), children: [_jsx("span", { children: metric.label }), _jsxs("strong", { children: [metric.value, _jsx("em", { children: metric.unit })] }), _jsx("small", { children: metric.description })] }, metric.key))) }), _jsxs("div", { className: "customer-add-batch-grid", children: [_jsxs("section", { className: "customer-add-batch-panel customer-add-batch-trend", "aria-label": "\u6279\u91CF\u8F6C\u5316\u8D8B\u52BF", children: [_jsxs("header", { children: [_jsx("h2", { children: "\u6279\u91CF\u8F6C\u5316\u8D8B\u52BF" }), _jsxs("span", { children: [viewModel.timestamp.slice(0, 10), " \u66F4\u65B0"] })] }), viewModel.trend.length > 0 ? (_jsx("div", { className: "customer-add-batch-bars", children: viewModel.trend.map((item) => (_jsxs("div", { className: "customer-add-batch-bars__item", title: `${item.date} 触达 ${item.sent}，添加 ${item.added}`, children: [_jsx("i", { style: { height: `${Math.max(18, item.candidates * 2)}px` } }), _jsx("b", { children: item.date })] }, item.date))) })) : (_jsx(EmptyState, {}))] }), _jsxs("section", { className: "customer-add-batch-panel customer-add-batch-routes", "aria-label": "\u5FEB\u6377\u5165\u53E3", children: [_jsx("header", { children: _jsx("h2", { children: "\u5FEB\u6377\u5165\u53E3" }) }), _jsx("button", { type: "button", onClick: () => navigate(viewModel.routeTargets.customerList), children: "\u5BA2\u6237\u5217\u8868" }), _jsx("button", { type: "button", onClick: () => navigate(viewModel.routeTargets.staffList), children: "\u4F01\u5FAE\u5458\u5DE5\u5217\u8868" }), _jsx("button", { type: "button", onClick: () => navigate(viewModel.routeTargets.customerTag), children: "\u5BA2\u6237\u6807\u7B7E" })] })] }), _jsxs("section", { className: "customer-add-batch-panel", "aria-label": "\u5019\u9009\u5BA2\u6237\u5217\u8868", children: [_jsxs("header", { children: [_jsx("h2", { children: "\u5019\u9009\u5BA2\u6237\u5217\u8868" }), _jsxs("span", { children: ["\u7B2C ", viewModel.pagination.page, "-", Math.min(viewModel.pagination.pageSize, viewModel.pagination.total), " \u6761/\u603B\u5171 ", viewModel.pagination.total, " \u6761"] })] }), candidates.length > 0 ? (_jsxs("div", { className: "customer-add-batch-table", children: [_jsxs("div", { className: "customer-add-batch-table__head", children: [_jsx("div", { children: "\u5BA2\u6237" }), _jsx("div", { children: "\u6765\u6E90" }), _jsx("div", { children: "\u8BA2\u5355/\u623F\u578B" }), _jsx("div", { children: "\u72B6\u6001" }), _jsx("div", { children: "\u6700\u8FD1\u6C9F\u901A" }), _jsx("div", { children: "\u64CD\u4F5C" })] }), candidates.map((candidate) => (_jsxs("div", { className: "customer-add-batch-row", children: [_jsxs("div", { children: [_jsx("strong", { children: candidate.customerName }), _jsx("span", { children: candidate.maskedPhone })] }), _jsx("div", { children: candidate.sourceChannel }), _jsxs("div", { children: [_jsx("span", { children: candidate.orderDate }), _jsx("span", { children: candidate.roomName })] }), _jsxs("div", { children: [_jsx("b", { className: `status status-${candidate.friendStatus}`, children: candidate.friendStatus }), _jsx("span", { children: candidate.smsStatus })] }), _jsx("div", { children: candidate.lastMessage }), _jsxs("div", { className: "customer-add-batch-row__actions", children: [_jsx("button", { type: "button", onClick: () => setDialog({ type: 'candidate', candidate }), children: "\u8BE6\u60C5" }), _jsx("button", { type: "button", onClick: () => sendSms(candidate), disabled: candidate.friendStatus === '已添加', children: "\u4E0B\u53D1\u77ED\u4FE1" }), _jsx("button", { type: "button", onClick: () => markAdded(candidate), disabled: candidate.friendStatus === '已添加', children: "\u6807\u8BB0\u5DF2\u6DFB\u52A0" })] })] }, candidate.id)))] })) : (_jsx(EmptyState, {}))] }), _jsxs("section", { className: "customer-add-batch-panel", "aria-label": "\u6279\u91CF\u4EFB\u52A1\u5217\u8868", children: [_jsx("header", { children: _jsx("h2", { children: "\u6279\u91CF\u4EFB\u52A1\u5217\u8868" }) }), viewModel.tasks.length > 0 ? (_jsx("div", { className: "customer-add-batch-task-list", children: viewModel.tasks.map((task) => (_jsxs("article", { children: [_jsxs("div", { children: [_jsx("strong", { children: task.name }), _jsx("span", { children: task.scope })] }), _jsxs("p", { children: [_jsx("b", { children: task.status }), "\uFF0C\u89E6\u8FBE ", task.sentCount, "/", task.targetCount, "\uFF0C\u5DF2\u6DFB\u52A0 ", task.addedCount] }), _jsx("button", { type: "button", onClick: () => setDialog({ type: 'task', task }), children: "\u67E5\u770B\u4EFB\u52A1" })] }, task.id))) })) : (_jsx(EmptyState, {}))] }), _jsxs("section", { className: "customer-add-batch-detail", "aria-label": "\u5546\u54C1\u8BE6\u60C5", children: [_jsx("h2", { children: "\u5546\u54C1\u8BE6\u60C5" }), _jsx("div", { className: "customer-add-batch-images", children: detailImages.map((image) => (_jsx("img", { src: image.src, alt: image.alt }, image.src))) })] })] })) : null] }), dialog ? _jsx(DetailDialog, { dialog: dialog, onClose: () => setDialog(null) }) : null] }));
}
function SelectButton({ label, value, isOpen, onClick, }) {
    return (_jsxs("button", { type: "button", className: "customer-add-batch-select", "aria-haspopup": "listbox", "aria-expanded": isOpen, onClick: onClick, children: [label, " ", value] }));
}
function SelectOptions({ options, selected, onChoose, }) {
    return (_jsx("div", { className: "customer-add-batch-options", role: "listbox", children: options.map((option) => (_jsx("button", { type: "button", role: "option", "aria-selected": selected === option.value, onClick: () => onChoose(option.value), children: option.label }, `${option.label}-${option.value}`))) }));
}
function EmptyState() {
    return (_jsxs("div", { className: "customer-add-batch-empty", children: [_jsx("strong", { children: "\u6682\u65E0\u53EF\u89E6\u8FBE\u5BA2\u6237" }), _jsx("p", { children: "\u5F53\u524D\u7B5B\u9009\u6761\u4EF6\u4E0B\u6CA1\u6709\u5F85\u52A0\u597D\u53CB\u5BA2\u6237\uFF0C\u8BF7\u8C03\u6574\u6761\u4EF6\u540E\u91CD\u65B0\u67E5\u8BE2\u3002" })] }));
}
function DetailDialog({ dialog, onClose }) {
    if (dialog.type === 'metric') {
        return (_jsxs(DialogFrame, { title: "\u6307\u6807\u8BE6\u60C5", closeLabel: "\u5173\u95ED\u6307\u6807\u8BE6\u60C5", onClose: onClose, children: [_jsx("p", { children: dialog.metric.description }), _jsx("p", { children: "\u5BA2\u6237\u624B\u673A\u53F7\u5DF2\u8131\u654F\uFF0C\u4EC5\u7528\u4E8E\u8FD0\u8425\u89E6\u8FBE\u548C\u56DE\u5F52\u9A8C\u8BC1\u3002" })] }));
    }
    if (dialog.type === 'candidate') {
        return (_jsx(DialogFrame, { title: "\u5BA2\u6237\u52A0\u597D\u53CB\u8BE6\u60C5", closeLabel: "\u5173\u95ED\u5BA2\u6237\u52A0\u597D\u53CB\u8BE6\u60C5", onClose: onClose, children: _jsxs("dl", { children: [_jsx("dt", { children: "\u5BA2\u6237" }), _jsx("dd", { children: dialog.candidate.customerName }), _jsx("dt", { children: "\u624B\u673A\u53F7" }), _jsx("dd", { children: dialog.candidate.maskedPhone }), _jsx("dt", { children: "\u63A8\u8350\u8BDD\u672F" }), _jsx("dd", { children: dialog.candidate.suggestion })] }) }));
    }
    return (_jsx(DialogFrame, { title: "\u6279\u91CF\u4EFB\u52A1\u8BE6\u60C5", closeLabel: "\u5173\u95ED\u6279\u91CF\u4EFB\u52A1\u8BE6\u60C5", onClose: onClose, children: _jsxs("dl", { children: [_jsx("dt", { children: "\u4EFB\u52A1\u540D\u79F0" }), _jsx("dd", { children: dialog.task.name }), _jsx("dt", { children: "\u4EFB\u52A1\u8FDB\u5EA6" }), _jsxs("dd", { children: ["\u5DF2\u89E6\u8FBE ", dialog.task.sentCount, "/", dialog.task.targetCount, "\uFF0C\u5DF2\u6DFB\u52A0 ", dialog.task.addedCount] }), _jsx("dt", { children: "\u8D1F\u8D23\u4EBA" }), _jsx("dd", { children: dialog.task.owner })] }) }));
}
function DialogFrame({ title, closeLabel, children, onClose, }) {
    return (_jsx("div", { className: "customer-add-batch-modal-backdrop", children: _jsxs("section", { className: "customer-add-batch-modal", role: "dialog", "aria-modal": "true", "aria-label": title, children: [_jsxs("header", { children: [_jsx("h2", { children: title }), _jsx("button", { type: "button", "aria-label": closeLabel, onClick: onClose, children: "\u00D7" })] }), _jsx("div", { className: "customer-add-batch-modal__body", children: children })] }) }));
}
