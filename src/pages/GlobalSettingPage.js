import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createGlobalSettingExportTask, defaultGlobalSettingFilters, fetchGlobalSettingOverview, fetchGlobalSettingStoreConfig, removeGlobalSettingStore, saveGlobalSettingStoreConfig, saveGlobalSettingStoreSelection, startGlobalSettingConnectorDownload, } from '../services/globalSetting';
import { StoreSelectControl } from '../components/StoreSelect';
import { useStoreOptions } from '../hooks/useStoreOptions';
import './GlobalSettingPage.css';
export function GlobalSettingPage() {
    const navigate = useNavigate();
    const [filters, setFilters] = useState(defaultGlobalSettingFilters);
    const [query, setQuery] = useState(defaultGlobalSettingFilters);
    const [viewModel, setViewModel] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [feedback, setFeedback] = useState('配置中心数据加载中');
    const [dialog, setDialog] = useState(null);
    const nextSuccessFeedback = useRef('');
    const { storeOptions, storeLoading } = useStoreOptions({
        fallbackOptions: viewModel?.filterOptions.camps.map((option) => ({ id: option.value, label: option.label })),
    });
    useEffect(() => {
        const controller = new AbortController();
        fetchGlobalSettingOverview(query, controller.signal)
            .then((data) => {
            if (controller.signal.aborted)
                return;
            setViewModel(data);
            setError('');
            setFeedback(nextSuccessFeedback.current || '配置中心数据已更新');
            nextSuccessFeedback.current = '';
        })
            .catch((loadError) => {
            if (controller.signal.aborted)
                return;
            setError(loadError.message || '配置中心数据加载失败');
            setFeedback('配置中心数据加载失败');
        })
            .finally(() => {
            if (!controller.signal.aborted)
                setIsLoading(false);
        });
        return () => controller.abort();
    }, [query]);
    const contractText = useMemo(() => JSON.stringify({
        endpoint: (viewModel?.endpoint ?? '/radarConfig/shop/get').replace(/^mock:/, ''),
        requestBody: viewModel?.requestBody ?? {},
        traceId: viewModel?.traceId ?? '',
        provider: viewModel?.provider ?? 'loading',
        updatedAt: viewModel?.updatedAt ?? '',
    }), [viewModel]);
    async function reload(nextMessage) {
        nextSuccessFeedback.current = nextMessage;
        setIsLoading(true);
        setError('');
        setFeedback('配置中心数据加载中');
        setQuery((current) => ({ ...current }));
    }
    function updateFilter(key, value) {
        setFilters((current) => ({ ...current, [key]: value }));
    }
    function submitFilters() {
        nextSuccessFeedback.current = '已按当前条件更新配置中心';
        setIsLoading(true);
        setError('');
        setFeedback('配置中心数据加载中');
        setQuery(filters);
    }
    function resetFilters() {
        nextSuccessFeedback.current = '筛选条件已重置';
        setIsLoading(true);
        setError('');
        setFeedback('配置中心数据加载中');
        setFilters({ ...defaultGlobalSettingFilters });
        setQuery({ ...defaultGlobalSettingFilters });
    }
    async function confirmDownload() {
        await startGlobalSettingConnectorDownload();
        setDialog(null);
        setFeedback('数据连接器下载任务已启动');
    }
    function openSelectionDialog() {
        if (!viewModel)
            return;
        setDialog({
            type: 'selection',
            selectedPoiIds: viewModel.candidates
                .filter((item) => item.currentStatus === 'monitored')
                .map((item) => item.poiId),
        });
    }
    function toggleSelection(candidate, checked) {
        if (dialog?.type !== 'selection')
            return;
        const nextSet = new Set(dialog.selectedPoiIds);
        if (checked) {
            if (nextSet.size >= 3) {
                setFeedback('最多可选择 3 个监控门店');
                return;
            }
            nextSet.add(candidate.poiId);
        }
        else {
            nextSet.delete(candidate.poiId);
        }
        setDialog({ type: 'selection', selectedPoiIds: [...nextSet] });
    }
    async function confirmSelection() {
        if (!viewModel || dialog?.type !== 'selection')
            return;
        const nextViewModel = await saveGlobalSettingStoreSelection(viewModel, dialog.selectedPoiIds);
        setViewModel(nextViewModel);
        setDialog(null);
        setFeedback('监控门店已更新');
    }
    async function openConfigDialog(store) {
        const detail = await fetchGlobalSettingStoreConfig(store.id);
        setDialog({ type: 'config', detail, errors: {} });
    }
    function updateConfigField(channel, field, value) {
        if (dialog?.type !== 'config')
            return;
        setDialog({
            ...dialog,
            detail: {
                ...dialog.detail,
                [channel]: {
                    ...dialog.detail[channel],
                    [field]: value,
                },
            },
        });
    }
    async function confirmConfigSave() {
        if (!viewModel || dialog?.type !== 'config')
            return;
        const errors = validateConfig(dialog.detail);
        if (Object.keys(errors).length > 0) {
            setDialog({ ...dialog, errors });
            return;
        }
        const result = await saveGlobalSettingStoreConfig(viewModel, dialog.detail);
        setViewModel(result.viewModel);
        setDialog(null);
        setFeedback('Ebooking授权配置已保存');
    }
    async function confirmRemoveStore() {
        if (!viewModel || dialog?.type !== 'remove')
            return;
        const nextViewModel = await removeGlobalSettingStore(viewModel, dialog.store.id);
        setViewModel(nextViewModel);
        setDialog(null);
        setFeedback('监控门店已移除');
    }
    async function exportData() {
        await createGlobalSettingExportTask(filters);
        setFeedback('导出任务已创建');
    }
    function handleTodoAction(todo) {
        if (todo.action === 'route') {
            navigate('/InformationMaintenance/campInfo/edit');
            return;
        }
        if (todo.action === 'acknowledge') {
            setFeedback(`${todo.title}已加入今日处理队列`);
            return;
        }
        const targetStore = viewModel?.stores.find((item) => item.name === todo.storeName);
        if (targetStore) {
            void openConfigDialog(targetStore);
        }
    }
    return (_jsxs("div", { className: "global-setting-workbench", "data-testid": "global-setting-page", children: [_jsxs("header", { className: "global-setting-toolbar", children: [_jsxs("div", { children: [_jsx("p", { children: "AI\u5168\u57DF\u96F7\u8FBE / \u76D1\u63A7\u95E8\u5E97\u7BA1\u7406" }), _jsx("h1", { children: "\u914D\u7F6E\u4E2D\u5FC3" })] }), _jsxs("div", { className: "global-setting-toolbar__actions", children: [_jsx("button", { type: "button", onClick: () => reload('配置中心数据已刷新'), disabled: isLoading, children: "\u5237\u65B0" }), _jsx("button", { type: "button", onClick: exportData, disabled: isLoading || !viewModel, children: "\u5BFC\u51FA" }), _jsx("button", { type: "button", onClick: () => setDialog({ type: 'download' }), children: "\u4E0B\u8F7D\u6570\u636E\u8FDE\u63A5\u5668" }), _jsx("button", { type: "button", className: "is-primary", onClick: openSelectionDialog, disabled: isLoading, children: "\u9009\u62E9\u76D1\u63A7\u95E8\u5E97" })] })] }), _jsxs("section", { className: "global-setting-filter-bar", "aria-label": "\u914D\u7F6E\u4E2D\u5FC3\u7B5B\u9009\u6761\u4EF6", children: [_jsx(StoreSelectControl, { className: "global-setting-store-select", label: "\u95E8\u5E97\u8303\u56F4", options: storeOptions.map((option) => ({ id: option.id, name: option.label })), value: filters.campId, disabled: storeLoading, onChange: (campId) => updateFilter('campId', campId) }), _jsxs("label", { children: [_jsx("span", { children: "\u6388\u6743\u72B6\u6001" }), _jsx("select", { "aria-label": "\u6388\u6743\u72B6\u6001", value: filters.authorizationStatus, onChange: (event) => updateFilter('authorizationStatus', event.target.value), children: viewModel?.filterOptions.authorizationStatuses.map((option) => (_jsx("option", { value: option.value, children: option.label }, option.value))) ?? null })] }), _jsxs("label", { children: [_jsx("span", { children: "\u8FDE\u63A5\u5668\u72B6\u6001" }), _jsx("select", { "aria-label": "\u8FDE\u63A5\u5668\u72B6\u6001", value: filters.connectorStatus, onChange: (event) => updateFilter('connectorStatus', event.target.value), children: viewModel?.filterOptions.connectorStatuses.map((option) => (_jsx("option", { value: option.value, children: option.label }, option.value))) ?? null })] }), _jsxs("label", { className: "global-setting-filter-bar__keyword", children: [_jsx("span", { children: "\u5173\u952E\u8BCD" }), _jsx("input", { "aria-label": "\u5173\u952E\u8BCD", value: filters.keyword, placeholder: "\u95E8\u5E97 / \u57CE\u5E02 / \u6E20\u9053", onChange: (event) => updateFilter('keyword', event.target.value) })] }), _jsxs("div", { className: "global-setting-filter-bar__actions", children: [_jsx("button", { type: "button", onClick: submitFilters, disabled: isLoading, children: "\u67E5\u8BE2" }), _jsx("button", { type: "button", onClick: resetFilters, disabled: isLoading, children: "\u91CD\u7F6E" })] })] }), _jsx("div", { className: "global-setting-feedback", role: "status", "aria-label": "\u914D\u7F6E\u4E2D\u5FC3\u64CD\u4F5C\u53CD\u9988", children: isLoading ? '配置中心数据加载中' : feedback }), _jsx("pre", { "data-testid": "global-setting-contract", className: "global-setting-contract", children: contractText }), error ? (_jsxs("section", { className: "global-setting-state-card global-setting-state-card--error", role: "alert", children: [_jsx("strong", { children: "\u914D\u7F6E\u4E2D\u5FC3\u6570\u636E\u52A0\u8F7D\u5931\u8D25" }), _jsx("span", { children: "\u8BF7\u68C0\u67E5\u95E8\u5E97\u4E0A\u4E0B\u6587\u6216\u7A0D\u540E\u91CD\u65B0\u52A0\u8F7D\u3002" }), _jsx("button", { type: "button", onClick: () => reload('配置中心数据已刷新'), children: "\u91CD\u65B0\u52A0\u8F7D" })] })) : null, viewModel ? (_jsxs(_Fragment, { children: [_jsx("section", { className: "global-setting-summary", "aria-label": "\u914D\u7F6E\u4E2D\u5FC3\u6458\u8981\u6307\u6807", children: viewModel.summary.map((metric) => (_jsxs("article", { className: `global-setting-summary-card global-setting-summary-card--${metric.tone}`, children: [_jsx("span", { children: metric.label }), _jsx("strong", { children: metric.value }), _jsx("small", { children: metric.hint })] }, metric.label))) }), _jsxs("section", { className: "global-setting-main-grid", children: [_jsxs("section", { className: "global-setting-card", children: [_jsxs("div", { className: "global-setting-card__header", children: [_jsxs("div", { children: [_jsx("h2", { children: "\u76D1\u63A7\u95E8\u5E97\u7BA1\u7406" }), _jsx("p", { children: "\u6BCF\u4E2A\u8D26\u53F7\u6700\u591A\u652F\u6301\u5F00\u542F 3 \u4E2A\u95E8\u5E97\u7684\u5168\u57DF\u96F7\u8FBE\u670D\u52A1\u3002" })] }), _jsxs("span", { children: ["\u66F4\u65B0\u4E8E ", viewModel.updatedAt] })] }), viewModel.stores.length === 0 ? (_jsxs("section", { className: "global-setting-state-card", role: "status", "aria-label": "\u914D\u7F6E\u4E2D\u5FC3\u7A7A\u6001", children: [_jsx("strong", { children: "\u6682\u65E0\u5DF2\u542F\u7528\u7684\u76D1\u63A7\u95E8\u5E97" }), _jsx("span", { children: "\u8BF7\u5148\u4E0B\u8F7D\u6570\u636E\u8FDE\u63A5\u5668\u5E76\u9009\u62E9\u9700\u8981\u76D1\u63A7\u7684\u95E8\u5E97\u3002" })] })) : (_jsx("div", { className: "global-setting-table-wrap", children: _jsxs("table", { className: "global-setting-table", "aria-label": "\u76D1\u63A7\u95E8\u5E97\u5217\u8868", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "\u95E8\u5E97\u540D\u79F0" }), _jsx("th", { children: "\u8FDE\u63A5\u5668\u72B6\u6001" }), _jsx("th", { children: "\u76D1\u63A7\u72B6\u6001" }), _jsx("th", { children: "\u643A\u7A0B\u9152\u5E97" }), _jsx("th", { children: "\u7F8E\u56E2\u9152\u5E97" }), _jsx("th", { children: "\u98CE\u9669\u4E8B\u9879" }), _jsx("th", { children: "\u6700\u8FD1\u540C\u6B65" }), _jsx("th", { children: "\u64CD\u4F5C" })] }) }), _jsx("tbody", { children: viewModel.stores.map((store) => (_jsxs("tr", { children: [_jsxs("td", { children: [_jsx("strong", { children: store.name }), _jsx("span", { children: store.city })] }), _jsx("td", { children: _jsx(StateTag, { tone: store.connectorStatus, children: connectorStatusText(store.connectorStatus) }) }), _jsx("td", { children: monitorStatusText(store.monitorStatus) }), _jsx("td", { children: _jsx(StateTag, { tone: store.ctripAuthStatus === 'authorized' ? 'online' : store.ctripAuthStatus === 'failed' ? 'warning' : 'offline', children: authStatusText(store.ctripAuthStatus) }) }), _jsx("td", { children: _jsx(StateTag, { tone: store.meituanAuthStatus === 'authorized' ? 'online' : store.meituanAuthStatus === 'failed' ? 'warning' : 'offline', children: authStatusText(store.meituanAuthStatus) }) }), _jsx("td", { children: store.riskCount === 0 ? '正常' : `${store.riskCount} 项待处理` }), _jsx("td", { children: store.updatedAt }), _jsx("td", { children: _jsxs("div", { className: "global-setting-table__actions", children: [_jsx("button", { type: "button", onClick: () => void openConfigDialog(store), children: "\u914D\u7F6E" }), _jsx("button", { type: "button", onClick: () => navigate('/channels/globalRadar/globalData'), children: "\u67E5\u770B\u65E5\u5FD7" }), _jsx("button", { type: "button", onClick: () => setDialog({ type: 'remove', store }), children: "\u79FB\u9664" })] }) })] }, store.id))) })] }) }))] }), _jsxs("aside", { className: "global-setting-side-column", children: [_jsxs("section", { className: "global-setting-card", children: [_jsx("div", { className: "global-setting-card__header", children: _jsxs("div", { children: [_jsx("h2", { children: "\u5F85\u529E\u63D0\u9192" }), _jsx("p", { children: "\u4F18\u5148\u5904\u7406\u6388\u6743\u5F02\u5E38\u548C\u8FDE\u63A5\u5668\u5EF6\u8FDF\u95E8\u5E97\u3002" })] }) }), _jsx("div", { className: "global-setting-todo-list", children: viewModel.todos.map((todo) => (_jsxs("button", { type: "button", onClick: () => handleTodoAction(todo), children: [_jsx("strong", { children: todo.title }), _jsx("span", { children: todo.storeName }), _jsxs("small", { children: [todo.level, " \u4F18\u5148\u7EA7"] })] }, todo.id))) })] }), _jsxs("section", { className: "global-setting-card", children: [_jsx("div", { className: "global-setting-card__header", children: _jsxs("div", { children: [_jsx("h2", { children: "\u5FEB\u6377\u5165\u53E3" }), _jsx("p", { children: "\u5168\u90E8\u8DF3\u8F6C\u5230\u9879\u76EE\u73B0\u6709\u8DEF\u7531\uFF0C\u4E0D\u65B0\u589E\u5B64\u7ACB\u9875\u9762\u3002" })] }) }), _jsx("div", { className: "global-setting-quick-links", children: viewModel.quickLinks.map((link) => (_jsx("button", { type: "button", onClick: () => navigate(link.path), children: link.label }, link.path))) })] })] })] })] })) : null, dialog?.type === 'download' ? (_jsx("div", { className: "global-setting-modal-backdrop", role: "presentation", onClick: () => setDialog(null), children: _jsxs("section", { className: "global-setting-modal global-setting-modal--small", role: "dialog", "aria-modal": "true", "aria-label": "\u4E0B\u8F7D\u6570\u636E\u8FDE\u63A5\u5668", onClick: (event) => event.stopPropagation(), children: [_jsxs("header", { children: [_jsx("h3", { children: "\u4E0B\u8F7D\u6570\u636E\u8FDE\u63A5\u5668" }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u4E0B\u8F7D\u6570\u636E\u8FDE\u63A5\u5668", onClick: () => setDialog(null), children: "\u00D7" })] }), _jsxs("ol", { children: [_jsx("li", { children: "\u6B65\u9AA4\u4E00\uFF1A\u4E0B\u8F7D AI \u5168\u57DF\u96F7\u8FBE\u6570\u636E\u8FDE\u63A5\u5668\u5B89\u88C5\u5305\u3002" }), _jsx("li", { children: "\u6B65\u9AA4\u4E8C\uFF1A\u5728\u524D\u53F0\u529E\u516C\u7535\u8111\u4FDD\u6301\u5F00\u673A\u5E76\u8FD0\u884C\u8FDE\u63A5\u5668\u3002" }), _jsx("li", { children: "\u6B65\u9AA4\u4E09\uFF1A\u5B8C\u6210\u643A\u7A0B\u9152\u5E97\u4E0E\u7F8E\u56E2\u9152\u5E97\u7684\u8D26\u53F7\u6388\u6743\u3002" })] }), _jsxs("footer", { children: [_jsx("button", { type: "button", onClick: () => setDialog(null), children: "\u53D6\u6D88" }), _jsx("button", { type: "button", className: "is-primary", onClick: () => void confirmDownload(), children: "\u786E\u8BA4\u4E0B\u8F7D" })] })] }) })) : null, dialog?.type === 'selection' && viewModel ? (_jsx("div", { className: "global-setting-modal-backdrop", role: "presentation", onClick: () => setDialog(null), children: _jsxs("section", { className: "global-setting-modal", role: "dialog", "aria-modal": "true", "aria-label": "\u9009\u62E9\u76D1\u63A7\u95E8\u5E97", onClick: (event) => event.stopPropagation(), children: [_jsxs("header", { children: [_jsx("h3", { children: "\u9009\u62E9\u76D1\u63A7\u95E8\u5E97" }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u9009\u62E9\u76D1\u63A7\u95E8\u5E97", onClick: () => setDialog(null), children: "\u00D7" })] }), _jsx("p", { children: "\u6700\u591A\u53EF\u9009\u62E9 3 \u4E2A\u76D1\u63A7\u95E8\u5E97\uFF0C\u8D85\u51FA\u4E0A\u9650\u65F6\u8BF7\u5148\u79FB\u9664\u65E7\u95E8\u5E97\u3002" }), _jsx("div", { className: "global-setting-candidate-list", children: viewModel.candidates.map((candidate) => {
                                const checked = dialog.selectedPoiIds.includes(candidate.poiId);
                                return (_jsxs("label", { className: "global-setting-candidate", children: [_jsx("input", { type: "checkbox", checked: checked, onChange: (event) => toggleSelection(candidate, event.target.checked) }), _jsxs("div", { children: [_jsx("strong", { children: candidate.name }), _jsxs("span", { children: [candidate.city, " \u00B7 ", candidate.currentStatus === 'monitored' ? '已监控' : '可添加'] })] })] }, candidate.poiId));
                            }) }), _jsx("div", { className: "global-setting-modal__inline-link", children: _jsx("button", { type: "button", onClick: () => navigate('/InformationMaintenance/campInfo/edit'), children: "\u95E8\u5E97\u4FE1\u606F" }) }), _jsxs("footer", { children: [_jsx("button", { type: "button", onClick: () => setDialog(null), children: "\u53D6\u6D88" }), _jsx("button", { type: "button", className: "is-primary", onClick: () => void confirmSelection(), children: "\u786E\u8BA4" })] })] }) })) : null, dialog?.type === 'config' ? (_jsx("div", { className: "global-setting-modal-backdrop", role: "presentation", onClick: () => setDialog(null), children: _jsxs("section", { className: "global-setting-modal", role: "dialog", "aria-modal": "true", "aria-label": "Ebooking\u6388\u6743\u914D\u7F6E", onClick: (event) => event.stopPropagation(), children: [_jsxs("header", { children: [_jsx("h3", { children: "Ebooking\u6388\u6743\u914D\u7F6E" }), _jsx("button", { type: "button", "aria-label": "\u5173\u95EDEbooking\u6388\u6743\u914D\u7F6E", onClick: () => setDialog(null), children: "\u00D7" })] }), _jsxs("div", { className: "global-setting-config-title", children: [_jsx("strong", { children: dialog.detail.storeName }), _jsxs("span", { children: ["\u8FDE\u63A5\u5668\u7248\u672C ", dialog.detail.connectorVersion, " \u00B7 \u6700\u8FD1\u540C\u6B65 ", dialog.detail.lastSyncAt] })] }), _jsx(ConfigChannel, { title: "\u643A\u7A0B\u9152\u5E97", detail: dialog.detail.ctrip, usernameLabel: "\u643A\u7A0B\u9152\u5E97\u7528\u6237\u540D", passwordLabel: "\u643A\u7A0B\u9152\u5E97\u5BC6\u7801", usernameError: dialog.errors.ctripUsername, passwordError: dialog.errors.ctripPassword, onToggle: (checked) => updateConfigField('ctrip', 'enabled', checked), onUsernameChange: (value) => updateConfigField('ctrip', 'username', value), onPasswordChange: (value) => updateConfigField('ctrip', 'password', value) }), _jsx(ConfigChannel, { title: "\u7F8E\u56E2\u9152\u5E97", detail: dialog.detail.meituan, usernameLabel: "\u7F8E\u56E2\u9152\u5E97\u7528\u6237\u540D", passwordLabel: "\u7F8E\u56E2\u9152\u5E97\u5BC6\u7801", usernameError: dialog.errors.meituanUsername, passwordError: dialog.errors.meituanPassword, onToggle: (checked) => updateConfigField('meituan', 'enabled', checked), onUsernameChange: (value) => updateConfigField('meituan', 'username', value), onPasswordChange: (value) => updateConfigField('meituan', 'password', value) }), _jsx("ul", { className: "global-setting-config-notes", children: dialog.detail.notes.map((note) => (_jsx("li", { children: note }, note))) }), _jsxs("footer", { children: [_jsx("button", { type: "button", onClick: () => setDialog(null), children: "\u53D6\u6D88" }), _jsx("button", { type: "button", className: "is-primary", onClick: () => void confirmConfigSave(), children: "\u4FDD\u5B58\u914D\u7F6E" })] })] }) })) : null, dialog?.type === 'remove' ? (_jsx("div", { className: "global-setting-modal-backdrop", role: "presentation", onClick: () => setDialog(null), children: _jsxs("section", { className: "global-setting-modal global-setting-modal--small", role: "dialog", "aria-modal": "true", "aria-label": "\u79FB\u9664\u76D1\u63A7\u95E8\u5E97", onClick: (event) => event.stopPropagation(), children: [_jsxs("header", { children: [_jsx("h3", { children: "\u79FB\u9664\u76D1\u63A7\u95E8\u5E97" }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u79FB\u9664\u76D1\u63A7\u95E8\u5E97", onClick: () => setDialog(null), children: "\u00D7" })] }), _jsx("p", { children: "\u79FB\u9664\u540E\uFF0C\u8BE5\u95E8\u5E97\u5C06\u4E0D\u518D\u51FA\u73B0\u5728\u76D1\u63A7\u5217\u8868\u4E2D\uFF0C\u4E4B\u540E\u53EF\u91CD\u65B0\u6DFB\u52A0\u3002" }), _jsxs("footer", { children: [_jsx("button", { type: "button", onClick: () => setDialog(null), children: "\u53D6\u6D88" }), _jsx("button", { type: "button", className: "is-primary", onClick: () => void confirmRemoveStore(), children: "\u786E\u8BA4\u79FB\u9664" })] })] }) })) : null] }));
}
function ConfigChannel({ title, detail, usernameLabel, passwordLabel, usernameError, passwordError, onToggle, onUsernameChange, onPasswordChange, }) {
    return (_jsxs("section", { className: "global-setting-config-card", children: [_jsxs("div", { className: "global-setting-config-card__header", children: [_jsxs("label", { children: [_jsx("input", { type: "checkbox", checked: detail.enabled, onChange: (event) => onToggle(event.target.checked) }), _jsx("span", { children: title })] }), _jsx(StateTag, { tone: detail.authStatus === 'authorized' ? 'online' : detail.authStatus === 'failed' ? 'warning' : 'offline', children: authStatusText(detail.authStatus) })] }), _jsxs("div", { className: "global-setting-config-card__form", children: [_jsxs("label", { children: [_jsx("span", { children: usernameLabel }), _jsx("input", { "aria-label": usernameLabel, value: detail.username, disabled: !detail.enabled, onChange: (event) => onUsernameChange(event.target.value) }), usernameError ? _jsx("small", { children: usernameError }) : null] }), _jsxs("label", { children: [_jsx("span", { children: passwordLabel }), _jsx("input", { "aria-label": passwordLabel, value: detail.password, disabled: !detail.enabled, onChange: (event) => onPasswordChange(event.target.value) }), passwordError ? _jsx("small", { children: passwordError }) : null] })] }), _jsxs("p", { children: ["\u6700\u8FD1\u6821\u9A8C\uFF1A", detail.lastVerifiedAt] })] }));
}
function StateTag({ tone, children }) {
    return _jsx("span", { className: `global-setting-state-tag global-setting-state-tag--${tone}`, children: children });
}
function validateConfig(detail) {
    const errors = {};
    if (detail.ctrip.enabled && !detail.ctrip.username.trim())
        errors.ctripUsername = '请输入携程酒店用户名';
    if (detail.ctrip.enabled && !detail.ctrip.password.trim())
        errors.ctripPassword = '请输入携程酒店密码';
    if (detail.meituan.enabled && !detail.meituan.username.trim())
        errors.meituanUsername = '请输入美团酒店用户名';
    if (detail.meituan.enabled && !detail.meituan.password.trim())
        errors.meituanPassword = '请输入美团酒店密码';
    return errors;
}
function connectorStatusText(status) {
    if (status === 'warning')
        return '更新延迟';
    if (status === 'offline')
        return '离线';
    return '在线';
}
function monitorStatusText(status) {
    if (status === 'delay')
        return '更新延迟';
    if (status === 'paused')
        return '暂停采集';
    return '检查中';
}
function authStatusText(status) {
    if (status === 'authorized')
        return '已授权';
    if (status === 'failed')
        return '授权失败';
    return '未授权';
}
