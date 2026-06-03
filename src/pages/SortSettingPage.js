import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { fetchSortSettingPageData, reorderSortSettingItems, resolveSortSettingRuntimeConfig, } from '../services/sortSetting';
import './SortSettingPage.css';
export function SortSettingPage() {
    const location = useLocation();
    const runtime = useMemo(() => resolveSortSettingRuntimeConfig(location.search), [location.search]);
    return _jsx(SortSettingSurface, { runtime: runtime }, location.search);
}
function SortSettingSurface({ runtime }) {
    const [retryKey, setRetryKey] = useState(0);
    const [loadState, setLoadState] = useState({ kind: 'loading' });
    const [activeTab, setActiveTab] = useState(runtime.activeTab);
    const [feedback, setFeedback] = useState('正在加载排序设置...');
    const [isSubmitting, setIsSubmitting] = useState(false);
    useEffect(() => {
        let cancelled = false;
        async function loadPageData() {
            setLoadState({ kind: 'loading' });
            setActiveTab(runtime.activeTab);
            setFeedback('正在加载排序设置...');
            try {
                const data = await fetchSortSettingPageData(runtime);
                if (cancelled)
                    return;
                setLoadState({ kind: 'ready', data });
                setActiveTab(data.activeTab);
                setFeedback(describeTabState(data, data.activeTab));
            }
            catch (error) {
                if (cancelled)
                    return;
                setLoadState({
                    kind: 'error',
                    message: error instanceof Error ? error.message : '排序设置加载失败，请稍后重试',
                });
                setFeedback('排序设置加载失败');
            }
        }
        void loadPageData();
        return () => {
            cancelled = true;
        };
    }, [retryKey, runtime]);
    const pageData = loadState.kind === 'ready' ? loadState.data : null;
    const currentTab = pageData ? pageData.tabs[activeTab] : null;
    const stateName = loadState.kind === 'ready' && pageData ? pageData.state : loadState.kind === 'loading' ? 'loading' : 'error';
    const contractText = useMemo(() => JSON.stringify({
        provider: pageData?.provider ?? runtime.provider,
        state: stateName,
        activeTab,
        traceId: pageData?.traceId ?? '',
        timestamp: pageData?.timestamp ?? '',
        lastActionSummary: pageData?.lastActionSummary ?? '',
        loadContracts: currentTab?.loadContracts ?? [],
        saveContract: currentTab?.saveContract ?? null,
        lastContract: pageData?.lastContract ?? null,
    }, null, 2), [activeTab, currentTab, pageData, runtime.provider, stateName]);
    function handleRetry() {
        setRetryKey((current) => current + 1);
    }
    function handleTabChange(tab) {
        setActiveTab(tab);
        if (pageData) {
            setFeedback(describeTabState(pageData, tab));
        }
    }
    async function handleMove(itemId, direction) {
        if (!pageData || !currentTab || isSubmitting)
            return;
        const orderedIds = currentTab.items.map((item) => item.id);
        const itemIndex = orderedIds.indexOf(itemId);
        const targetIndex = direction === 'up' ? itemIndex - 1 : itemIndex + 1;
        if (itemIndex < 0 || targetIndex < 0 || targetIndex >= orderedIds.length) {
            return;
        }
        ;
        [orderedIds[itemIndex], orderedIds[targetIndex]] = [orderedIds[targetIndex], orderedIds[itemIndex]];
        setIsSubmitting(true);
        setFeedback('正在更新排序...');
        try {
            const nextPageData = await reorderSortSettingItems({
                pageData: { ...pageData, activeTab },
                tab: activeTab,
                orderedIds,
            });
            setLoadState({ kind: 'ready', data: nextPageData });
            setFeedback(nextPageData.lastActionSummary);
        }
        catch (error) {
            setFeedback(error instanceof Error ? error.message : '排序更新失败，请稍后重试');
        }
        finally {
            setIsSubmitting(false);
        }
    }
    return (_jsxs("div", { className: "sort-setting-page", "aria-label": "\u6392\u5E8F\u8BBE\u7F6E", children: [_jsx("pre", { hidden: true, "data-testid": "sort-setting-service-contract", "data-provider": pageData?.provider ?? runtime.provider, "data-state": stateName, "data-active-tab": activeTab, children: contractText }), _jsx("div", { className: "sort-setting-feedback", role: "status", "aria-label": "\u6392\u5E8F\u8BBE\u7F6E\u64CD\u4F5C\u53CD\u9988", children: isSubmitting ? '正在更新排序...' : feedback }), loadState.kind === 'error' ? (_jsxs("section", { className: "sort-setting-state sort-setting-state--error", role: "alert", "aria-label": "\u6392\u5E8F\u8BBE\u7F6E\u9519\u8BEF\u72B6\u6001", children: [_jsx("strong", { children: "\u6392\u5E8F\u8BBE\u7F6E\u52A0\u8F7D\u5931\u8D25" }), _jsx("p", { children: loadState.message }), _jsx("button", { type: "button", className: "sort-setting-primary", onClick: handleRetry, children: "\u91CD\u65B0\u52A0\u8F7D\u6392\u5E8F\u8BBE\u7F6E" })] })) : null, loadState.kind === 'loading' ? (_jsxs("section", { className: "sort-setting-state", role: "status", "aria-label": "\u6392\u5E8F\u8BBE\u7F6E\u52A0\u8F7D\u4E2D", children: [_jsx("strong", { children: "\u6392\u5E8F\u8BBE\u7F6E\u52A0\u8F7D\u4E2D" }), _jsx("p", { children: "\u6B63\u5728\u540C\u6B65\u95E8\u5E97\u3001\u623F\u578B\u548C\u5546\u54C1\u6392\u5E8F\u6570\u636E\uFF0C\u8BF7\u7A0D\u5019\u3002" })] })) : null, pageData ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "sort-setting-toolbar", children: [_jsx("div", { className: "sort-setting-tabs", role: "tablist", "aria-label": "\u6392\u5E8F\u65B9\u5F0F", children: Object.keys(pageData.tabs).map((tabKey) => {
                                    const tab = pageData.tabs[tabKey];
                                    const isActive = activeTab === tabKey;
                                    return (_jsx("button", { type: "button", role: "tab", "aria-selected": isActive, className: isActive ? 'is-active' : '', onClick: () => handleTabChange(tabKey), children: tab.label }, tab.key));
                                }) }), _jsx("span", { className: "sort-setting-info", "aria-hidden": "true", children: "i" })] }), _jsx("p", { className: "sort-setting-tip", children: pageData.infoTip }), currentTab && currentTab.items.length > 0 ? (_jsx("div", { className: "sort-setting-list", "aria-label": currentTab.ariaLabel, children: currentTab.items.map((item, index) => (_jsx(SortSettingCard, { item: item, canMoveUp: index > 0, canMoveDown: index < currentTab.items.length - 1, disabled: isSubmitting, onMoveUp: () => void handleMove(item.id, 'up'), onMoveDown: () => void handleMove(item.id, 'down') }, item.id))) })) : currentTab ? (_jsxs("section", { className: "sort-setting-state sort-setting-state--empty", role: "status", "aria-label": "\u6392\u5E8F\u8BBE\u7F6E\u7A7A\u72B6\u6001", children: [_jsx("strong", { children: "\u5F53\u524D\u6682\u65E0\u53EF\u6392\u5E8F\u6570\u636E" }), _jsx("p", { children: "\u5F53\u524D\u6392\u5E8F\u65B9\u5F0F\u4E0B\u6682\u65E0\u53EF\u5C55\u793A\u7684\u6570\u636E\uFF0C\u53EF\u5207\u6362\u5176\u4ED6\u6392\u5E8F\u65B9\u5F0F\u7EE7\u7EED\u67E5\u770B\u3002" })] })) : null] })) : null] }));
}
function SortSettingCard({ item, canMoveUp, canMoveDown, disabled, onMoveUp, onMoveDown, }) {
    return (_jsxs("article", { className: "sort-setting-item", children: [_jsx("span", { className: "sort-setting-drag-handle", "aria-hidden": "true", children: "\u22EE\u22EE" }), _jsxs("div", { className: "sort-setting-item__content", children: [_jsx("span", { className: "sort-setting-item__title", children: item.title }), item.subtitle ? _jsx("small", { className: "sort-setting-item__subtitle", children: item.subtitle }) : null] }), _jsxs("div", { className: "sort-setting-item__actions", children: [_jsx("button", { type: "button", className: "sort-setting-action", "aria-label": `上移 ${item.title}`, onClick: onMoveUp, disabled: !canMoveUp || disabled, children: "\u4E0A\u79FB" }), _jsx("button", { type: "button", className: "sort-setting-action", "aria-label": `下移 ${item.title}`, onClick: onMoveDown, disabled: !canMoveDown || disabled, children: "\u4E0B\u79FB" })] })] }));
}
function describeTabState(pageData, tab) {
    const tabData = pageData.tabs[tab];
    if (tabData.items.length === 0) {
        return '当前暂无可排序数据';
    }
    if (tab === 'room') {
        return '拖拽房型后将按真实房型排序契约生成提交参数';
    }
    if (tab === 'goods') {
        return '拖拽商品后会提交到真实商品排序接口';
    }
    return pageData.lastActionSummary;
}
