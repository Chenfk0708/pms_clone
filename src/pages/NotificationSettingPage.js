import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { createDefaultNotificationSettingQuery, loadNotificationSettingViewModel, markNotificationAccountFollowed, NotificationSettingServiceError, refreshNotificationFollowStatus, resolveNotificationSettingRuntimeConfig, toggleNotificationChannel, toggleNotificationItem, } from '../services/notificationSetting';
import './NotificationSettingPage.css';
const defaultContract = {
    provider: 'mock',
    responseState: 'loading',
    endpoint: '/setting/wechatPushSetting/bootstrap',
    traceId: '',
    timestamp: '',
    request: {},
};
export function NotificationSettingPage() {
    const location = useLocation();
    const runtimeConfig = useMemo(() => resolveNotificationSettingRuntimeConfig({ search: location.search }), [location.search]);
    const query = useMemo(() => createDefaultNotificationSettingQuery(runtimeConfig), [runtimeConfig]);
    const queryKey = JSON.stringify(query);
    return _jsx(NotificationSettingSurface, { query: query }, queryKey);
}
function NotificationSettingSurface({ query }) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [mockStateOverride, setMockStateOverride] = useState(null);
    const [reloadKey, setReloadKey] = useState(0);
    const [busyKey, setBusyKey] = useState('');
    const [feedback, setFeedback] = useState('正在加载通知设置...');
    const [state, setState] = useState({
        kind: 'loading',
        contract: {
            ...defaultContract,
            provider: query.provider ?? 'mock',
            request: query,
        },
    });
    const requestQuery = useMemo(() => ({
        ...query,
        mockState: mockStateOverride ?? query.mockState,
    }), [mockStateOverride, query]);
    useEffect(() => {
        const abort = new AbortController();
        setState({
            kind: 'loading',
            contract: {
                ...defaultContract,
                provider: requestQuery.provider ?? 'mock',
                request: requestQuery,
            },
        });
        loadNotificationSettingViewModel(requestQuery, abort.signal)
            .then((data) => {
            setState({
                kind: 'ready',
                data,
                contract: toContract(data),
            });
            setFeedback(data.state === 'empty' ? '通知模板尚未初始化。' : '通知设置已同步。');
        })
            .catch((error) => {
            if (error instanceof DOMException && error.name === 'AbortError') {
                return;
            }
            const message = error instanceof Error ? error.message : '通知设置加载失败，请稍后重试';
            setState({
                kind: 'error',
                message,
                contract: toErrorContract(error, requestQuery),
            });
            setFeedback(message);
        });
        return () => abort.abort();
    }, [reloadKey, requestQuery]);
    const contractJson = JSON.stringify(state.contract);
    const readyData = state.kind === 'ready' ? state.data : null;
    async function runMutation(busyLabel, task) {
        setBusyKey(busyLabel);
        try {
            const result = await task();
            if ((requestQuery.provider ?? 'mock') !== 'api') {
                setMockStateOverride(result.viewModel.state);
            }
            setState({
                kind: 'ready',
                data: result.viewModel,
                contract: toContract(result.viewModel),
            });
            setFeedback(result.statusMessage);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : '通知设置操作失败，请稍后重试';
            setFeedback(message);
            setState((current) => current.kind === 'ready'
                ? current
                : {
                    kind: 'error',
                    message,
                    contract: toErrorContract(error, requestQuery),
                });
        }
        finally {
            setBusyKey('');
        }
    }
    function handleRetry() {
        setMockStateOverride('success');
        setReloadKey((current) => current + 1);
        setFeedback('正在重新加载通知设置...');
    }
    return (_jsxs("div", { className: "notification-page", children: [_jsx("pre", { hidden: true, "data-testid": "notification-setting-service-contract", "data-provider": state.contract.provider, "data-response-state": state.contract.responseState, "data-endpoint": state.contract.endpoint, children: contractJson }), _jsxs("section", { className: "notification-page__surface", "aria-label": "\u901A\u77E5\u8BBE\u7F6E", children: [_jsx("div", { className: "notification-page__status", role: "status", "aria-label": "\u901A\u77E5\u8BBE\u7F6E\u64CD\u4F5C\u53CD\u9988", children: feedback }), _jsxs("header", { className: "notification-page__hero", children: [_jsxs("div", { className: "notification-page__intro", children: [_jsxs("div", { className: "notification-page__qr-panel", children: [_jsx("div", { className: "notification-page__qr", role: "img", "aria-label": readyData?.qrCode.alt ?? '路客云微信公众号二维码', children: _jsx("img", { src: readyData?.qrCode.imageDataUrl, alt: readyData?.qrCode.alt ?? '路客云微信公众号二维码' }) }), _jsxs("div", { className: "notification-page__qr-actions", children: [_jsx("button", { type: "button", className: "notification-page__text-button", "aria-label": "\u6211\u5DF2\u5173\u6CE8\uFF1F", disabled: busyKey === 'follow', onClick: () => void runMutation('follow', () => markNotificationAccountFollowed({ ...requestQuery, mockState: 'success' })), children: "\u6211\u5DF2\u5173\u6CE8\uFF1F" }), _jsx("button", { type: "button", className: "notification-page__text-button", "aria-label": "\u5237\u65B0\u4E00\u4E0B", disabled: busyKey === 'refresh', onClick: () => void runMutation('refresh', () => refreshNotificationFollowStatus({ ...requestQuery, mockState: 'success' })), children: "\u5237\u65B0\u4E00\u4E0B" })] })] }), _jsxs("div", { className: "notification-page__hero-copy", children: [_jsx("strong", { children: readyData?.intro.title ?? '扫码关注公众号【路客云】，快速通过微信推送订单、房态' }), _jsx("button", { type: "button", className: "notification-page__link-button", "aria-label": "\u67E5\u770B\u63A5\u53D7\u5FAE\u4FE1\u901A\u77E5\u516C\u4F17\u53F7", onClick: () => setDialogOpen(true), children: readyData?.intro.detailButtonText ?? '查看接受微信通知公众号' })] })] }), readyData && readyData.state === 'success' ? (_jsx("div", { className: "notification-page__channel-heads", role: "presentation", children: readyData.channels.map((channel) => (_jsxs("div", { className: "notification-page__channel-head", children: [_jsx(NotificationSwitch, { checked: channel.enabled, disabled: busyKey === `channel-${channel.key}`, label: `${channel.title} 总开关`, onChange: (nextChecked) => void runMutation(`channel-${channel.key}`, () => toggleNotificationChannel({ ...requestQuery, mockState: 'success' }, channel.key, nextChecked)) }), _jsxs("div", { className: "notification-page__channel-head-copy", children: [channel.key === 'wechat' ? null : _jsx("span", { children: channel.title }), channel.subtitle ? _jsx("small", { children: channel.subtitle }) : null] })] }, channel.key))) })) : null] }), state.kind === 'error' ? (_jsxs("section", { className: "notification-page__state notification-page__state--error", role: "alert", "aria-label": "\u901A\u77E5\u8BBE\u7F6E\u52A0\u8F7D\u5931\u8D25", children: [_jsx("h2", { children: "\u901A\u77E5\u8BBE\u7F6E\u52A0\u8F7D\u5931\u8D25\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5" }), _jsx("p", { children: "\u5F53\u524D\u65E0\u6CD5\u540C\u6B65\u6E20\u9053\u6743\u9650\u4E0E\u516C\u4F17\u53F7\u72B6\u6001\uFF0C\u8BF7\u91CD\u65B0\u52A0\u8F7D\u901A\u77E5\u8BBE\u7F6E\u3002" }), _jsx("button", { type: "button", className: "notification-page__primary-button", onClick: handleRetry, children: "\u91CD\u65B0\u52A0\u8F7D\u901A\u77E5\u8BBE\u7F6E" })] })) : null, state.kind === 'loading' ? (_jsxs("section", { className: "notification-page__state", "aria-live": "polite", "aria-label": "\u901A\u77E5\u8BBE\u7F6E\u52A0\u8F7D\u4E2D", children: [_jsx("h2", { children: "\u901A\u77E5\u8BBE\u7F6E\u52A0\u8F7D\u4E2D" }), _jsx("p", { children: "\u6B63\u5728\u540C\u6B65\u516C\u4F17\u53F7\u72B6\u6001\u3001\u901A\u77E5\u6E20\u9053\u548C\u5F00\u5173\u914D\u7F6E\uFF0C\u8BF7\u7A0D\u5019\u3002" })] })) : null, readyData && readyData.state === 'empty' ? (_jsxs("section", { className: "notification-page__state notification-page__state--empty", "aria-label": "\u901A\u77E5\u8BBE\u7F6E\u7A7A\u72B6\u6001", children: [_jsx("h2", { children: "\u5F53\u524D\u6682\u65E0\u53EF\u914D\u7F6E\u7684\u901A\u77E5\u9879" }), _jsx("p", { children: "\u901A\u77E5\u6A21\u677F\u5C1A\u672A\u521D\u59CB\u5316\uFF0C\u7A0D\u540E\u5F00\u901A\u540E\u5373\u53EF\u7EE7\u7EED\u914D\u7F6E\u63A8\u9001\u6E20\u9053\u3002" })] })) : null, readyData && readyData.state === 'success' ? (_jsx("section", { className: "notification-page__table", role: "table", "aria-label": "\u901A\u77E5\u8BBE\u7F6E\u8868", children: readyData.items.map((item) => (_jsxs("div", { className: "notification-page__row", role: "row", children: [_jsxs("div", { className: "notification-page__row-copy", role: "cell", children: [_jsx("strong", { children: item.title }), _jsx("p", { children: item.description })] }), _jsx("div", { className: "notification-page__row-switch", role: "cell", children: item.toggles.pcApp !== undefined ? (_jsx(NotificationSwitch, { checked: item.toggles.pcApp, disabled: busyKey === `item-${item.key}-pcApp`, label: `${item.title} PC\\APP推送`, onChange: (nextChecked) => void handleItemToggle(item.key, 'pcApp', nextChecked, requestQuery, runMutation) })) : (_jsx("span", { className: "notification-page__placeholder", children: "-" })) }), _jsx("div", { className: "notification-page__row-switch", role: "cell", children: item.toggles.wechat !== undefined ? (_jsx(NotificationSwitch, { checked: item.toggles.wechat, disabled: busyKey === `item-${item.key}-wechat`, label: `${item.title} 公众号推送`, onChange: (nextChecked) => void handleItemToggle(item.key, 'wechat', nextChecked, requestQuery, runMutation) })) : (_jsx("span", { className: "notification-page__placeholder", children: "-" })) })] }, item.key))) })) : null] }), dialogOpen ? (_jsx("div", { className: "notification-page__dialog-backdrop", role: "presentation", onClick: () => setDialogOpen(false), children: _jsxs("section", { className: "notification-page__dialog", role: "dialog", "aria-modal": "true", "aria-label": "\u63A5\u53D7\u5FAE\u4FE1\u901A\u77E5\u516C\u4F17\u53F7", onClick: (event) => event.stopPropagation(), children: [_jsxs("header", { className: "notification-page__dialog-header", children: [_jsx("h2", { children: "\u63A5\u53D7\u5FAE\u4FE1\u901A\u77E5\u516C\u4F17\u53F7" }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u516C\u4F17\u53F7\u8BE6\u60C5", onClick: () => setDialogOpen(false), children: "\u00D7" })] }), _jsx("p", { className: "notification-page__dialog-hint", children: readyData?.followSummary.hint ?? '当前暂无已关注公众号，请扫码关注后刷新状态。' }), readyData?.followSummary.accounts.length ? (_jsx("ul", { className: "notification-page__account-list", children: readyData.followSummary.accounts.map((account) => (_jsxs("li", { children: [_jsx("strong", { children: account.accountName }), _jsx("span", { children: account.receivedAt })] }, account.accountId))) })) : (_jsx("div", { className: "notification-page__account-empty", children: "\u6682\u65E0\u5DF2\u7ED1\u5B9A\u516C\u4F17\u53F7\u8BB0\u5F55\uFF0C\u8BF7\u626B\u7801\u5173\u6CE8\u540E\u5237\u65B0\u3002" }))] }) })) : null] }));
}
function NotificationSwitch({ checked, disabled, label, onChange, }) {
    return (_jsx("button", { type: "button", className: `notification-switch${checked ? ' is-on' : ''}`, role: "switch", "aria-checked": checked, "aria-label": label, disabled: disabled, onClick: () => onChange(!checked), children: _jsx("span", {}) }));
}
async function handleItemToggle(itemKey, channel, nextChecked, query, runMutation) {
    await runMutation(`item-${itemKey}-${channel}`, () => toggleNotificationItem({ ...query, mockState: 'success' }, itemKey, channel, nextChecked));
}
function toContract(data) {
    return {
        provider: data.provider,
        responseState: data.state,
        endpoint: data.endpoint,
        traceId: data.traceId,
        timestamp: data.timestamp,
        request: data.request,
    };
}
function toErrorContract(error, query) {
    const serviceError = error instanceof NotificationSettingServiceError ? error : null;
    if (serviceError) {
        return {
            provider: serviceError.provider,
            responseState: 'error',
            endpoint: '/setting/wechatPushSetting/bootstrap',
            traceId: serviceError.response.traceId,
            timestamp: serviceError.response.timestamp,
            request: serviceError.request,
        };
    }
    return {
        provider: query.provider ?? 'mock',
        responseState: 'error',
        endpoint: '/setting/wechatPushSetting/bootstrap',
        traceId: '',
        timestamp: '',
        request: query,
    };
}
