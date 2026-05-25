import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { NavLink, useNavigate, useSearchParams } from 'react-router-dom';
import { createDefaultMyBenefitQuery, createMyBenefitExpandTask, createMyBenefitExportTask, createMyBenefitRenewTask, fetchMyBenefitDashboard, } from '../services/myBenefit';
import './MyBenefitPage.css';
const sideLinks = [
    { label: '我的权益', path: '/version/myBenefit' },
    { label: '置换权益', path: '/version/displacementBenefit' },
    { label: '版本订阅', path: '/version/subscriptionCenter' },
    { label: '应用订阅', path: '/version/applicationPayment' },
    { label: '路客商城', path: '/version/localsMall' },
];
export function MyBenefitPage() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [view, setView] = useState(null);
    const [loadState, setLoadState] = useState('loading');
    const [notice, setNotice] = useState('');
    const [recordDetailId, setRecordDetailId] = useState(null);
    const [resourceDetailId, setResourceDetailId] = useState(null);
    const [refreshSeed, setRefreshSeed] = useState(0);
    const query = useMemo(() => createDefaultMyBenefitQuery({
        search: `?${searchParams.toString()}`,
    }), [searchParams]);
    const upgradeOpen = searchParams.get('upgrade') === '1';
    useEffect(() => {
        const controller = new AbortController();
        queueMicrotask(() => setLoadState('loading'));
        fetchMyBenefitDashboard(query, controller.signal)
            .then((result) => {
            setView(result.view);
            setLoadState(result.view.state === 'empty' ? 'empty' : 'success');
        })
            .catch((error) => {
            if (error instanceof DOMException && error.name === 'AbortError')
                return;
            setLoadState('error');
            setNotice(error instanceof Error ? error.message : '我的权益加载失败，请稍后重试');
        });
        return () => controller.abort();
    }, [query, refreshSeed]);
    const activeTab = query.activeTab;
    const selectedRecord = view?.records.find((record) => record.id === recordDetailId) ?? null;
    const selectedResource = view?.resources.find((resource) => resource.id === resourceDetailId) ?? null;
    function updateSearchParams(mutate) {
        const next = new URLSearchParams(searchParams);
        mutate(next);
        setSearchParams(next);
    }
    function switchTab(nextTab) {
        updateSearchParams((next) => {
            next.set('tab', nextTab);
            next.delete('upgrade');
        });
    }
    function setUpgradeState(nextOpen) {
        updateSearchParams((next) => {
            if (nextOpen) {
                next.set('upgrade', '1');
                next.set('tab', 'resources');
            }
            else {
                next.delete('upgrade');
            }
        });
    }
    function refreshDashboard() {
        setNotice('');
        updateSearchParams((next) => {
            next.delete('myBenefitMockState');
        });
        setLoadState('loading');
        setRefreshSeed((value) => value + 1);
        window.localStorage.removeItem('pms.myBenefitMockState');
        setNotice('权益数据已刷新');
    }
    function exportRecords() {
        const task = createMyBenefitExportTask(query);
        setNotice(`导出任务已创建：${task.taskId}`);
    }
    function renewBenefit() {
        const task = createMyBenefitRenewTask(query);
        setNotice(`续费任务已创建：${task.taskId}`);
    }
    function expandResource(resource) {
        createMyBenefitExpandTask(query, resource);
        setResourceDetailId(resource.id);
        setNotice(`已生成 ${resource.name} 扩容咨询单`);
    }
    function retryFromError() {
        setNotice('');
        updateSearchParams((next) => {
            next.delete('myBenefitMockState');
        });
    }
    return (_jsxs("div", { className: "my-benefit-page", "data-provider": view?.provider ?? query.provider ?? 'mock', "data-response-state": loadState, "data-active-tab": activeTab, "data-upgrade-open": upgradeOpen ? 'true' : 'false', children: [_jsx(VersionSideNav, {}), _jsxs("main", { className: "my-benefit-main", children: [_jsxs("section", { className: "my-benefit-tabs", role: "tablist", "aria-label": "\u6211\u7684\u6743\u76CA\u89C6\u56FE", children: [_jsx("button", { type: "button", role: "tab", "aria-selected": activeTab === 'resources', onClick: () => switchTab('resources'), children: "\u7248\u672C\u8D44\u6E90" }), _jsx("button", { type: "button", role: "tab", "aria-selected": activeTab === 'services', onClick: () => switchTab('services'), children: "\u529F\u80FD\u670D\u52A1" }), _jsx("button", { type: "button", role: "tab", "aria-selected": activeTab === 'records', onClick: () => switchTab('records'), children: "\u5F00\u901A\u8BB0\u5F55" })] }), _jsxs("section", { className: "my-benefit-toolbar", "aria-label": "\u6743\u76CA\u5DE5\u5177\u680F", children: [_jsx("button", { type: "button", onClick: refreshDashboard, children: "\u5237\u65B0\u6743\u76CA" }), _jsx("button", { type: "button", onClick: exportRecords, children: "\u5BFC\u51FA\u8BB0\u5F55" }), _jsx("button", { type: "button", onClick: () => navigate('/version/applicationPayment'), children: "\u53BB\u5E94\u7528\u8BA2\u9605" })] }), notice ? (_jsx("div", { className: "my-benefit-notice", role: "status", "aria-label": "\u6211\u7684\u6743\u76CA\u64CD\u4F5C\u53CD\u9988", children: notice })) : null, loadState === 'loading' ? _jsx(LoadingState, {}) : null, loadState === 'error' ? (_jsxs("section", { className: "my-benefit-error", role: "alert", "aria-label": "\u6211\u7684\u6743\u76CA\u6570\u636E\u9519\u8BEF", children: [_jsx("strong", { children: "\u6211\u7684\u6743\u76CA\u52A0\u8F7D\u5931\u8D25\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5" }), _jsx("p", { children: "\u5F53\u524D\u65E0\u6CD5\u8BFB\u53D6\u6743\u76CA\u8D44\u6E90\u3001\u529F\u80FD\u670D\u52A1\u4E0E\u5F00\u901A\u8BB0\u5F55\uFF0C\u8BF7\u91CD\u8BD5\u540E\u7EE7\u7EED\u3002" }), _jsx("button", { type: "button", onClick: retryFromError, children: "\u91CD\u8BD5" })] })) : null, loadState !== 'error' && view ? (_jsxs(_Fragment, { children: [_jsxs("section", { className: "my-benefit-version", "aria-label": "\u5F53\u524D\u7248\u672C", children: [_jsx("div", { className: "my-benefit-version__icon", "aria-hidden": "true" }), _jsxs("div", { children: [_jsx("p", { className: "my-benefit-version__eyebrow", children: view.versionBadge }), _jsxs("h1", { children: ["\u5F53\u524D\u7248\u672C\uFF1A", view.currentVersionName] }), _jsxs("p", { children: ["\u6709\u6548\u671F\u5230\uFF1A", view.expiresAtText, _jsx("button", { type: "button", onClick: () => switchTab('records'), children: "\u5F00\u901A\u8BB0\u5F55" })] })] }), _jsxs("div", { className: "my-benefit-version__actions", children: [_jsx("button", { type: "button", className: "is-outline", onClick: renewBenefit, children: "\u7EED \u8D39" }), _jsx("button", { type: "button", className: "is-primary", onClick: () => setUpgradeState(true), children: "\u7248\u672C\u5347\u7EA7" })] })] }), _jsx("section", { className: "my-benefit-overview", "aria-label": "\u6743\u76CA\u5FEB\u89C8", children: view.overviewCards.map((card) => (_jsxs("article", { className: "my-benefit-overview__card", children: [_jsx("span", { children: card.label }), _jsx("strong", { children: card.value }), _jsx("p", { children: card.detail })] }, card.id))) }), loadState === 'empty' ? (_jsxs("section", { className: "my-benefit-empty-state", "aria-label": "\u6743\u76CA\u7A7A\u6001", children: [_jsx("strong", { children: "\u5F53\u524D\u6743\u76CA\u8D44\u6E90\u4E3A\u7A7A" }), _jsx("span", { children: "\u8BF7\u786E\u8BA4\u95E8\u5E97\u8BA2\u9605\u72B6\u6001\u6216\u5207\u6362\u5230\u5176\u4ED6\u7248\u672C\u540E\u518D\u67E5\u770B\u3002" })] })) : upgradeOpen ? (_jsx(UpgradePanel, { view: view, onClose: () => setUpgradeState(false), onViewSubscription: () => navigate('/version/subscriptionCenter') })) : activeTab === 'resources' ? (_jsx(ResourceTable, { resources: view.resources, onExpand: expandResource })) : activeTab === 'services' ? (_jsx(ServicesPanel, { view: view, onNavigate: (path) => navigate(path) })) : (_jsx(RecordsPanel, { records: view.records, onOpenDetail: setRecordDetailId }))] })) : null] }), selectedRecord ? _jsx(RecordDialog, { record: selectedRecord, onClose: () => setRecordDetailId(null) }) : null, selectedResource ? _jsx(ResourceDialog, { resource: selectedResource, onClose: () => setResourceDetailId(null) }) : null] }));
}
function VersionSideNav() {
    return (_jsxs("aside", { className: "my-benefit-sidebar", "aria-label": "\u6743\u76CA\u4E0E\u8BA2\u9605\u4FA7\u680F", children: [_jsx("div", { className: "my-benefit-sidebar__root", children: "\u8BA2\u9605\u4E2D\u5FC3" }), _jsx("nav", { children: sideLinks.map((item) => (_jsx(NavLink, { to: item.path, className: ({ isActive }) => `my-benefit-side-link${isActive ? ' is-active' : ''}`, children: item.label }, item.path))) }), _jsx("span", { className: "my-benefit-build", children: "\u7248\u672C\u53F7\uFF1Av4.10.7" })] }));
}
function LoadingState() {
    return (_jsxs("section", { className: "my-benefit-loading", "aria-label": "\u6743\u76CA\u52A0\u8F7D\u4E2D", children: [_jsx("span", { className: "my-benefit-loading__dot", "aria-hidden": "true" }), _jsx("strong", { children: "\u6B63\u5728\u5237\u65B0\u6743\u76CA\u6570\u636E" }), _jsx("p", { children: "\u6B63\u5728\u540C\u6B65\u5F53\u524D\u7248\u672C\u3001\u8D44\u6E90\u660E\u7EC6\u4E0E\u5F00\u901A\u8BB0\u5F55\u3002" })] }));
}
function ResourceTable({ resources, onExpand, }) {
    return (_jsxs("table", { className: "my-benefit-table", "aria-label": "\u7248\u672C\u8D44\u6E90\u8868", children: [_jsx("thead", { children: _jsx("tr", { children: ['资源名称', '可用数量', '已经用数量', '资源来源', '状态', '有效期', '操作'].map((column) => (_jsx("th", { children: column }, column))) }) }), _jsx("tbody", { children: resources.map((resource) => (_jsxs("tr", { children: [_jsx("td", { children: resource.name }), _jsx("td", { children: resource.totalText }), _jsx("td", { children: resource.usedText }), _jsx("td", { children: resource.sourceText }), _jsx("td", { children: _jsx("span", { className: "my-benefit-status", children: resource.statusText }) }), _jsx("td", { children: resource.expiresText }), _jsx("td", { children: resource.actionLabel ? (_jsx("button", { type: "button", "aria-label": `${resource.actionLabel} ${resource.name}`, onClick: () => onExpand(resource), children: resource.actionLabel })) : ('-') })] }, resource.id))) })] }));
}
function ServicesPanel({ view, onNavigate, }) {
    return (_jsx("section", { className: "my-benefit-services", "aria-label": "\u529F\u80FD\u670D\u52A1\u5206\u7EC4", children: view.serviceGroups.map((group) => (_jsxs("article", { className: "my-benefit-service-group", children: [_jsxs("header", { children: [_jsx("h2", { children: group.title }), _jsxs("span", { children: [group.items.length, " \u9879\u627F\u63A5\u5165\u53E3"] })] }), _jsx("div", { className: "my-benefit-service-grid", children: group.items.map((item) => (_jsxs("section", { className: "my-benefit-service-card", children: [_jsxs("div", { children: [_jsx("strong", { children: item.label }), item.badge ? _jsx("em", { children: item.badge }) : null] }), _jsx("p", { children: item.description }), _jsx("button", { type: "button", "aria-label": `打开 ${item.label}`, onClick: () => onNavigate(item.path), children: "\u6253\u5F00" })] }, item.id))) })] }, group.id))) }));
}
function RecordsPanel({ records, onOpenDetail, }) {
    return (_jsx("section", { className: "my-benefit-records", "aria-label": "\u5F00\u901A\u8BB0\u5F55\u5217\u8868", children: records.map((record) => (_jsxs("article", { className: "my-benefit-record", children: [_jsxs("div", { children: [_jsx("strong", { children: record.title }), _jsx("span", { children: record.typeLabel })] }), _jsx("p", { children: record.description }), _jsxs("dl", { children: [_jsxs("div", { children: [_jsx("dt", { children: "\u6765\u6E90" }), _jsx("dd", { children: record.sourceLabel })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u6709\u6548\u671F" }), _jsx("dd", { children: record.effectiveRange })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u72B6\u6001" }), _jsx("dd", { children: record.statusLabel })] })] }), _jsx("button", { type: "button", "aria-label": `查看详情 ${record.title}`, onClick: () => onOpenDetail(record.id), children: "\u67E5\u770B\u8BE6\u60C5" })] }, record.id))) }));
}
function UpgradePanel({ view, onClose, onViewSubscription, }) {
    return (_jsxs("section", { className: "my-benefit-upgrade", "aria-label": "\u7248\u672C\u5347\u7EA7\u9762\u677F", children: [_jsxs("header", { className: "my-benefit-upgrade__header", children: [_jsxs("div", { children: [_jsxs("h1", { children: ["\u5F53\u524D\u7248\u672C\uFF1A", view.currentVersionName] }), _jsxs("p", { children: ["\u6709\u6548\u671F\u5230\uFF1A", view.expiresAtText] })] }), _jsxs("div", { className: "my-benefit-upgrade__actions", children: [_jsx("button", { type: "button", onClick: onViewSubscription, children: "\u67E5\u770B\u7248\u672C\u8BA2\u9605" }), _jsx("button", { type: "button", className: "is-outline", onClick: onClose, children: "\u8FD4\u56DE\u8D44\u6E90" })] })] }), _jsx("section", { className: "my-benefit-plan-row", "aria-label": "\u7248\u672C\u5957\u9910", children: view.plans.map((plan) => (_jsxs("article", { className: `my-benefit-plan my-benefit-plan--${plan.tone}${plan.active ? ' is-active' : ''}`, "aria-label": plan.name, children: [plan.tag ? _jsx("span", { children: plan.tag }) : null, _jsx("strong", { children: plan.name }), _jsx("em", { children: plan.price }), plan.oldPrice ? _jsxs("del", { children: ["\u539F\u4EF7:", plan.oldPrice] }) : null] }, plan.id))) }), _jsxs("section", { className: "my-benefit-feature-board", "aria-label": "\u7248\u672C\u8BA2\u9605\u529F\u80FD\u660E\u7EC6", children: [_jsxs("aside", { className: "my-benefit-subscription-list", children: [_jsx("h2", { children: "\u7248\u672C\u8BA2\u9605" }), _jsx("p", { children: "\u5E93\u5B58(10\u4E2A)" }), _jsx("p", { children: "\u6210\u5458\u8D26\u53F7(3\u4E2A)" }), _jsx("p", { children: "\u95E8\u5E97(1\u4E2A)" })] }), _jsxs("div", { className: "my-benefit-feature-grid", children: [_jsx("h2", { children: "\u529F\u80FD\u8BA2\u9605" }), view.serviceGroups.map((group) => (_jsxs("section", { "aria-label": group.title, children: [_jsx("h3", { children: group.title }), group.items.map((item) => (_jsx("p", { children: item.label }, item.id)))] }, group.id)))] }), _jsxs("aside", { className: "my-benefit-service-list", children: [_jsx("h2", { children: "\u670D\u52A1\u7279\u6743" }), _jsx("p", { children: "\u4E13\u4E1A\u57F9\u8BAD" }), _jsx("p", { children: "\u91D1\u724C\u8FDB\u7FA4\u670D\u52A1" }), _jsx("p", { children: "7x12\u5C0F\u65F6\u5728\u7EBF\u5BA2\u670D" })] })] })] }));
}
function RecordDialog({ record, onClose }) {
    return (_jsx("div", { className: "my-benefit-modal", role: "presentation", children: _jsxs("div", { className: "my-benefit-dialog", role: "dialog", "aria-modal": "true", "aria-label": "\u8BB0\u5F55\u8BE6\u60C5", children: [_jsx("button", { type: "button", className: "my-benefit-dialog__close", "aria-label": "\u5173\u95ED\u8BB0\u5F55\u8BE6\u60C5", onClick: onClose, children: "\u00D7" }), _jsx("h2", { children: record.title }), _jsx("p", { children: record.description }), _jsxs("dl", { className: "my-benefit-dialog__meta", children: [_jsxs("div", { children: [_jsx("dt", { children: "\u8BA2\u5355\u53F7" }), _jsx("dd", { children: record.orderNo })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u6765\u6E90" }), _jsx("dd", { children: record.sourceLabel })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u6743\u76CA\u8303\u56F4" }), _jsx("dd", { children: record.relatedResources.join('、') })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u6709\u6548\u671F" }), _jsx("dd", { children: record.effectiveRange })] })] })] }) }));
}
function ResourceDialog({ resource, onClose }) {
    return (_jsx("div", { className: "my-benefit-modal", role: "presentation", children: _jsxs("div", { className: "my-benefit-dialog", role: "dialog", "aria-modal": "true", "aria-label": `${resource.name} 资源详情`, children: [_jsx("button", { type: "button", className: "my-benefit-dialog__close", "aria-label": "\u5173\u95ED\u8D44\u6E90\u8BE6\u60C5", onClick: onClose, children: "\u00D7" }), _jsx("h2", { children: resource.name }), _jsx("p", { children: "\u5F53\u524D\u8D44\u6E90\u652F\u6301\u7EE7\u7EED\u6269\u5BB9\uFF0C\u540E\u7EED\u53EF\u76F4\u63A5\u627F\u63A5\u5230\u5E94\u7528\u8BA2\u9605\u6216\u4EBA\u5DE5\u54A8\u8BE2\u6D41\u7A0B\u3002" }), _jsx("ul", { className: "my-benefit-dialog__list", children: resource.detailLines.map((line) => (_jsx("li", { children: line }, line))) })] }) }));
}
