import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createWriteExpendSettingItem, fetchWriteExpendSettingPageData, resolveWriteExpendSettingCampId, resolveWriteExpendSettingQuery, } from '../services/writeExpendSetting';
import './WriteExpendSettingPage.css';
const pageHint = '系统默认项目不支持编辑和删除，可直接拖动调整排序。';
export function WriteExpendSettingPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const query = useMemo(() => resolveWriteExpendSettingQuery(location.search), [location.search]);
    const [pageData, setPageData] = useState(null);
    const [error, setError] = useState('');
    const [feedback, setFeedback] = useState('正在加载记一笔设置');
    const [isLoading, setIsLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogGroup, setDialogGroup] = useState('');
    const [dialogGroupType, setDialogGroupType] = useState(1);
    const [dialogName, setDialogName] = useState('');
    const [dialogError, setDialogError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const activeTab = query.tab ?? 'income';
    useEffect(() => {
        void loadPageData('initial');
        // mockState/mockDelayMs are the only query parts that affect data loading.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query.mockState, query.mockDelayMs]);
    const diagnostics = pageData?.diagnostics ?? readDiagnostics();
    const contractText = JSON.stringify(diagnostics, null, 2);
    const currentTabGroups = pageData?.tabs[activeTab].groups ?? [];
    const currentTabItemCount = pageData?.tabs[activeTab].totalItems ?? 0;
    const currentTabLabel = activeTab === 'income' ? '收入项' : '支出项';
    const availableGroups = pageData?.availableGroups ?? [];
    const disabledItems = pageData?.disabledItems ?? [];
    const pageState = error ? 'error' : isLoading ? 'loading' : pageData?.state ?? query.mockState ?? 'success';
    async function loadPageData(reason) {
        setIsLoading(true);
        setError('');
        setDialogError('');
        setFeedback(reason === 'retry' ? '正在重新加载记一笔设置' : '正在加载记一笔设置');
        try {
            const nextPageData = await fetchWriteExpendSettingPageData({
                campId: resolveWriteExpendSettingCampId(),
                mockState: query.mockState,
                mockDelayMs: query.mockDelayMs,
            });
            setPageData(nextPageData);
            setFeedback(resolveLoadFeedback(nextPageData, activeTab));
        }
        catch (loadError) {
            setPageData(null);
            setError(loadError instanceof Error ? loadError.message : '记一笔设置加载失败，请稍后重试');
            setFeedback('记一笔设置加载失败，请稍后重试');
        }
        finally {
            setIsLoading(false);
        }
    }
    function handleTabChange(nextTab) {
        if (nextTab === activeTab)
            return;
        setFeedback(nextTab === 'income' ? '已切换到收入项设置' : '已切换到支出项设置');
        const nextParams = new URLSearchParams(location.search);
        nextParams.set('tab', nextTab);
        navigate({
            pathname: location.pathname,
            search: `?${nextParams.toString()}`,
        }, { replace: true });
    }
    function openDialog(groupName, groupType) {
        const fallbackGroup = pageData?.availableGroups[0] ?? { groupType: 1, name: '住宿' };
        setDialogGroup(groupName ?? fallbackGroup.name);
        setDialogGroupType(groupType ?? fallbackGroup.groupType);
        setDialogName('');
        setDialogError('');
        setDialogOpen(true);
    }
    async function handleCreate(event) {
        event.preventDefault();
        setDialogError('');
        setIsSubmitting(true);
        try {
            const nextPageData = await createWriteExpendSettingItem({
                tab: activeTab,
                groupType: dialogGroupType,
                groupName: dialogGroup,
                name: dialogName,
                campId: resolveWriteExpendSettingCampId(),
                mockState: query.mockState,
            });
            setPageData(nextPageData);
            setDialogOpen(false);
            setDialogName('');
            setFeedback(`已在${currentTabLabel} > ${dialogGroup}新增“${dialogName.trim()}”`);
        }
        catch (submitError) {
            setDialogError(submitError instanceof Error ? submitError.message : '新增项目失败，请稍后重试');
            setFeedback('新增项目失败，请稍后重试');
        }
        finally {
            setIsSubmitting(false);
        }
    }
    function handleSelectGroup(nextGroupName) {
        const matchedGroup = availableGroups.find((group) => group.name === nextGroupName);
        setDialogGroup(nextGroupName);
        setDialogGroupType(matchedGroup?.groupType ?? 1);
    }
    return (_jsxs("div", { className: "write-expend-page", "data-provider": diagnostics?.provider ?? 'mock', "data-response-state": pageState, "data-active-tab": activeTab, children: [_jsx("pre", { hidden: true, "data-testid": "write-expend-setting-service-contract", children: contractText }), _jsxs("section", { className: "write-expend-card", "aria-label": "\u8BB0\u4E00\u7B14\u8BBE\u7F6E", children: [_jsxs("header", { className: "write-expend-toolbar", children: [_jsxs("div", { className: "write-expend-toolbar-copy", children: [_jsx("p", { children: pageHint }), _jsxs("div", { className: "write-expend-status", role: "status", "aria-label": "\u8BB0\u4E00\u7B14\u8BBE\u7F6E\u64CD\u4F5C\u53CD\u9988", children: [_jsx("span", { children: feedback }), pageData ? _jsxs("em", { children: ["\u652F\u4ED8\u65B9\u5F0F ", pageData.paymentWays.join(' / ')] }) : null] })] }), _jsx("button", { type: "button", className: "write-expend-primary", onClick: () => openDialog(), disabled: isLoading || isSubmitting, children: "\u65B0\u589E" })] }), _jsxs("div", { className: "write-expend-tabs", role: "tablist", "aria-label": "\u8BB0\u4E00\u7B14\u9879\u76EE\u7C7B\u522B", children: [_jsx("button", { type: "button", role: "tab", "aria-selected": activeTab === 'income', className: activeTab === 'income' ? 'is-active' : '', onClick: () => handleTabChange('income'), children: "\u6536\u5165\u9879" }), _jsx("button", { type: "button", role: "tab", "aria-selected": activeTab === 'expense', className: activeTab === 'expense' ? 'is-active' : '', onClick: () => handleTabChange('expense'), children: "\u652F\u51FA\u9879" })] }), _jsxs("section", { className: "write-expend-meta", "aria-label": "\u5F53\u524D\u5217\u8868\u6458\u8981", children: [_jsx("span", { children: currentTabLabel }), _jsxs("span", { children: [currentTabItemCount, " \u4E2A\u542F\u7528\u9879\u76EE"] }), _jsxs("span", { children: [disabledItems.length, " \u4E2A\u505C\u7528\u9879\u76EE"] }), diagnostics ? _jsxs("span", { children: ["TraceId ", diagnostics.traceId] }) : null] }), error ? (_jsxs("section", { className: "write-expend-alert", role: "alert", "aria-label": "\u8BB0\u4E00\u7B14\u8BBE\u7F6E\u6570\u636E\u9519\u8BEF", children: [_jsx("strong", { children: "\u8BB0\u4E00\u7B14\u8BBE\u7F6E\u52A0\u8F7D\u5931\u8D25" }), _jsx("span", { children: error }), _jsx("button", { type: "button", className: "write-expend-primary", onClick: () => void loadPageData('retry'), disabled: isSubmitting, children: "\u91CD\u8BD5" })] })) : null, isLoading ? _jsx(LoadingState, {}) : null, !isLoading && !error ? (_jsxs("section", { className: "write-expend-groups", "aria-label": `${currentTabLabel}设置`, children: [currentTabGroups.map((group) => (_jsx(PaymentGroupSection, { group: group, onAdd: () => openDialog(group.name, group.groupType) }, `${activeTab}-${group.groupType}`))), _jsx("div", { className: "write-expend-divider" }), _jsxs("section", { className: "write-expend-disabled", "aria-label": "\u5DF2\u505C\u7528\u9879", children: [_jsx("h2", { children: "\u5DF2\u505C\u7528\u9879" }), disabledItems.length > 0 ? (_jsx("div", { className: "write-expend-item-grid", children: disabledItems.map((item) => (_jsx(PaymentItemCard, { item: item }, item.id))) })) : (_jsx("div", { className: "write-expend-disabled-empty", children: "\u6682\u65E0\u505C\u7528\u9879\u76EE" }))] })] })) : null] }), dialogOpen ? (_jsx("div", { className: "write-expend-modal-backdrop", children: _jsxs("section", { className: "write-expend-modal", role: "dialog", "aria-modal": "true", "aria-label": "\u65B0\u589E", children: [_jsxs("header", { children: [_jsx("h2", { children: "\u65B0\u589E" }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u65B0\u589E", onClick: () => setDialogOpen(false), children: "\u00D7" })] }), _jsxs("form", { onSubmit: handleCreate, children: [_jsxs("label", { className: "write-expend-form-row", children: [_jsx("span", { children: "\u9009\u62E9\u4E1A\u6001" }), _jsx("select", { className: "write-expend-select", value: dialogGroup, disabled: isSubmitting, onChange: (event) => handleSelectGroup(event.target.value), children: availableGroups.map((group) => (_jsx("option", { value: group.name, children: group.name }, group.groupType))) })] }), _jsxs("label", { className: "write-expend-form-row", children: [_jsxs("span", { children: [_jsx("em", { children: "*" }), "\u540D\u79F0"] }), _jsx("input", { type: "text", "aria-label": "\u540D\u79F0", placeholder: "\u8BF7\u8F93\u5165\u540D\u79F0", value: dialogName, disabled: isSubmitting, onChange: (event) => setDialogName(event.target.value) })] }), dialogError ? (_jsx("p", { className: "write-expend-form-error", role: "alert", children: dialogError })) : null, _jsxs("footer", { children: [_jsx("button", { type: "button", disabled: isSubmitting, onClick: () => setDialogOpen(false), children: "\u53D6\u6D88" }), _jsx("button", { type: "submit", className: "write-expend-primary", disabled: isSubmitting, children: isSubmitting ? '提交中...' : '完成' })] })] })] }) })) : null] }));
}
function PaymentGroupSection({ group, onAdd }) {
    return (_jsxs("section", { className: "write-expend-group", children: [_jsx("h2", { children: group.name }), _jsx("div", { className: group.items.length > 0 ? 'write-expend-item-grid' : 'write-expend-empty-box', children: group.items.length > 0 ? (group.items.map((item) => _jsx(PaymentItemCard, { item: item }, item.id))) : (_jsxs("p", { children: ["\u6682\u65E0\u9879\u76EE\uFF0C", _jsx("button", { type: "button", onClick: onAdd, children: "\u70B9\u51FB\u65B0\u589E" })] })) })] }));
}
function PaymentItemCard({ item }) {
    return (_jsxs("article", { className: `write-expend-item ${item.isEnabled ? '' : 'is-disabled'}`, children: [_jsx("span", { className: "write-expend-drag", "aria-hidden": "true", children: "\u22EE\u22EE" }), _jsx("span", { className: "write-expend-item-name", children: item.name }), _jsx("span", { className: "write-expend-lock", "aria-hidden": "true" }), _jsx("span", { className: `write-expend-default-badge ${item.isCustom ? 'is-custom' : ''}`, children: item.isCustom ? '自定义' : '默认' })] }));
}
function LoadingState() {
    return (_jsxs("section", { className: "write-expend-loading", "aria-label": "\u8BB0\u4E00\u7B14\u8BBE\u7F6E\u52A0\u8F7D\u72B6\u6001", children: [_jsxs("div", { className: "write-expend-loading-row", children: [_jsx("span", { className: "write-expend-loading-label" }), _jsxs("div", { className: "write-expend-loading-grid", children: [_jsx("span", { className: "write-expend-loading-pill" }), _jsx("span", { className: "write-expend-loading-pill" }), _jsx("span", { className: "write-expend-loading-pill" }), _jsx("span", { className: "write-expend-loading-pill" })] })] }), _jsxs("div", { className: "write-expend-loading-row", children: [_jsx("span", { className: "write-expend-loading-label" }), _jsxs("div", { className: "write-expend-loading-grid", children: [_jsx("span", { className: "write-expend-loading-pill" }), _jsx("span", { className: "write-expend-loading-pill is-wide" })] })] }), _jsxs("div", { className: "write-expend-loading-row", children: [_jsx("span", { className: "write-expend-loading-label" }), _jsx("div", { className: "write-expend-loading-grid", children: _jsx("span", { className: "write-expend-loading-empty" }) })] })] }));
}
function readDiagnostics() {
    if (typeof window === 'undefined')
        return null;
    const rawText = window.localStorage.getItem('pms.writeExpendSetting.lastRequest');
    return rawText ? JSON.parse(rawText) : null;
}
function resolveLoadFeedback(pageData, activeTab) {
    if (pageData.state === 'empty') {
        return activeTab === 'income' ? '当前收入项暂无可展示项目' : '当前支出项暂无可展示项目';
    }
    const currentTab = pageData.tabs[activeTab];
    return `已同步${currentTab.totalItems}个${activeTab === 'income' ? '收入项' : '支出项'}配置`;
}
