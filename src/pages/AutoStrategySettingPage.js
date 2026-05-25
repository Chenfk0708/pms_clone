import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AUTO_STRATEGY_SETTING_BOOTSTRAP_ENDPOINT, AutoStrategySettingServiceError, createDefaultAutoStrategySettingQuery, loadAutoStrategySettingViewModel, resolveAutoStrategySettingRuntimeConfig, updateNegotiateRefundAutomaticAcceptStrategy, updateOrderAutoPendingStrategy, updateOrderAutoSettleStrategy, } from '../services/autoStrategySetting';
import './AutoStrategySettingPage.css';
const defaultContract = {
    provider: 'mock',
    responseState: 'loading',
    endpoint: AUTO_STRATEGY_SETTING_BOOTSTRAP_ENDPOINT,
    mockState: 'success',
    requestBody: {},
    traceId: '',
    timestamp: '',
    lastAction: '',
    lastRequestBody: null,
};
export function AutoStrategySettingPage() {
    const location = useLocation();
    const runtimeConfig = useMemo(() => resolveAutoStrategySettingRuntimeConfig({ search: location.search }), [location.search]);
    const query = useMemo(() => createDefaultAutoStrategySettingQuery(runtimeConfig), [runtimeConfig]);
    const queryKey = JSON.stringify(query);
    return _jsx(AutoStrategySettingSurface, { query: query }, queryKey);
}
function AutoStrategySettingSurface({ query }) {
    const [reloadKey, setReloadKey] = useState(0);
    const [mockStateOverride, setMockStateOverride] = useState(null);
    const [activeTab, setActiveTab] = useState('orderRules');
    const [busyKey, setBusyKey] = useState('');
    const [orderAutoPendingValue, setOrderAutoPendingValue] = useState('1');
    const [orderAutoSettleChecked, setOrderAutoSettleChecked] = useState(false);
    const [negotiateRefundValue, setNegotiateRefundValue] = useState('0');
    const [state, setState] = useState({
        kind: 'loading',
        contract: {
            ...defaultContract,
            provider: query.provider ?? 'mock',
            mockState: query.mockState ?? 'success',
            requestBody: { campId: query.campId },
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
                mockState: requestQuery.mockState ?? 'success',
                requestBody: { campId: requestQuery.campId },
            },
        });
        loadAutoStrategySettingViewModel(requestQuery, abort.signal)
            .then((data) => {
            setOrderAutoPendingValue(data.orderRules.orderAutoPending.value);
            setOrderAutoSettleChecked(data.orderRules.orderAutoSettle.checked);
            setNegotiateRefundValue(data.orderRules.negotiateRefund.value);
            setState({
                kind: 'ready',
                data,
                contract: toContract(data),
            });
            setActiveTab('orderRules');
        })
            .catch((error) => {
            if (error instanceof DOMException && error.name === 'AbortError')
                return;
            const message = error instanceof Error ? error.message : '自动策略设置加载失败，请稍后重试';
            setState({
                kind: 'error',
                message,
                contract: toErrorContract(error, requestQuery),
            });
        });
        return () => abort.abort();
    }, [reloadKey, requestQuery]);
    const readyData = state.kind === 'ready' ? state.data : null;
    async function runMutation(busyLabel, task, callbacks) {
        setBusyKey(busyLabel);
        callbacks?.onMutate?.();
        try {
            const result = await task();
            setState({
                kind: 'ready',
                data: result.viewModel,
                contract: {
                    ...toContract(result.viewModel),
                    endpoint: result.endpoint,
                    lastAction: result.lastAction,
                    lastRequestBody: result.requestBody,
                },
            });
            callbacks?.onSuccess?.(result.viewModel);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : '自动策略设置保存失败，请稍后重试';
            callbacks?.onError?.();
            setState((current) => {
                if (current.kind !== 'ready') {
                    return {
                        kind: 'error',
                        message,
                        contract: toErrorContract(error, requestQuery),
                    };
                }
                return {
                    ...current,
                    contract: {
                        ...toErrorContract(error, requestQuery, current.contract.lastAction, current.contract.lastRequestBody),
                    },
                };
            });
        }
        finally {
            setBusyKey('');
        }
    }
    function handleRetry() {
        setMockStateOverride('success');
        setReloadKey((current) => current + 1);
    }
    return (_jsxs("div", { className: "auto-strategy-page", children: [_jsx("h1", { className: "auto-strategy-page__sr-title", children: "\u81EA\u52A8\u7B56\u7565\u8BBE\u7F6E" }), _jsx("div", { hidden: true, "data-testid": "auto-strategy-setting-service-contract", "data-provider": state.contract.provider, "data-endpoint": state.contract.endpoint, "data-response-state": state.contract.responseState, "data-mock-state": state.contract.mockState, "data-request-body": JSON.stringify(state.contract.requestBody), "data-last-action": state.contract.lastAction, "data-last-request-body": JSON.stringify(state.contract.lastRequestBody ?? {}) }), _jsxs("section", { className: "auto-strategy-page__shell", "aria-label": "\u81EA\u52A8\u7B56\u7565\u8BBE\u7F6E", children: [state.kind === 'error' ? (_jsxs("section", { className: "auto-strategy-page__state auto-strategy-page__state--error", role: "alert", children: [_jsx("h2", { children: "\u81EA\u52A8\u7B56\u7565\u8BBE\u7F6E\u52A0\u8F7D\u5931\u8D25\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5" }), _jsx("p", { children: state.message }), _jsx("button", { type: "button", className: "auto-strategy-page__primary", onClick: handleRetry, children: "\u91CD\u65B0\u52A0\u8F7D" })] })) : null, state.kind === 'loading' ? (_jsxs("section", { className: "auto-strategy-page__state", role: "status", "aria-label": "\u81EA\u52A8\u7B56\u7565\u8BBE\u7F6E\u52A0\u8F7D\u4E2D", children: [_jsx("h2", { children: "\u81EA\u52A8\u7B56\u7565\u8BBE\u7F6E\u52A0\u8F7D\u4E2D" }), _jsx("p", { children: "\u6B63\u5728\u540C\u6B65\u63A5\u5355\u89C4\u5219\u3001\u623F\u6001\u81EA\u52A8\u5316\u4E0E\u5E93\u5B58\u5360\u7528\u89C4\u5219\uFF0C\u8BF7\u7A0D\u5019\u3002" })] })) : null, readyData?.state === 'empty' ? (_jsxs("section", { className: "auto-strategy-page__state auto-strategy-page__state--empty", "aria-label": "\u81EA\u52A8\u7B56\u7565\u8BBE\u7F6E\u7A7A\u72B6\u6001", children: [_jsx("h2", { children: readyData.emptyState.title }), _jsx("p", { children: readyData.emptyState.description }), _jsx("button", { type: "button", className: "auto-strategy-page__primary", onClick: handleRetry, children: readyData.emptyState.actionText })] })) : null, readyData?.state === 'success' ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "auto-strategy-tabs", role: "tablist", "aria-label": "\u81EA\u52A8\u7B56\u7565\u8BBE\u7F6E\u6807\u7B7E\u9875", children: readyData.tabs.map((tab) => (_jsx("button", { type: "button", role: "tab", "aria-selected": activeTab === tab.key, "aria-controls": `auto-strategy-panel-${tab.key}`, id: `auto-strategy-tab-${tab.key}`, className: `auto-strategy-tabs__button${activeTab === tab.key ? ' is-active' : ''}`, onClick: () => setActiveTab(tab.key), children: tab.label }, tab.key))) }), _jsxs("div", { id: "auto-strategy-panel-orderRules", role: "tabpanel", "aria-labelledby": "auto-strategy-tab-orderRules", "aria-label": "\u63A5\u5355\u89C4\u5219", hidden: activeTab !== 'orderRules', children: [_jsx(StrategyCard, { title: readyData.orderRules.orderAutoPending.title, description: readyData.orderRules.orderAutoPending.description, children: _jsx(RadioGroup, { name: "order-auto-pending", options: readyData.orderRules.orderAutoPending.options, value: orderAutoPendingValue, disabled: busyKey === 'order-auto-pending', onChange: (nextValue) => {
                                                const previousValue = orderAutoPendingValue;
                                                void runMutation('order-auto-pending', () => updateOrderAutoPendingStrategy(requestQuery, nextValue), {
                                                    onMutate: () => setOrderAutoPendingValue(nextValue),
                                                    onSuccess: (viewModel) => setOrderAutoPendingValue(viewModel.orderRules.orderAutoPending.value),
                                                    onError: () => setOrderAutoPendingValue(previousValue),
                                                });
                                            } }) }), _jsx(StrategyCard, { title: readyData.orderRules.orderAutoSettle.title, description: readyData.orderRules.orderAutoSettle.description, children: _jsxs("div", { className: "auto-strategy-switch-row", children: [_jsx("span", { children: readyData.orderRules.orderAutoSettle.switchLabel }), _jsx(SwitchButton, { label: readyData.orderRules.orderAutoSettle.switchLabel, checked: orderAutoSettleChecked, disabled: busyKey === 'order-auto-settle', onToggle: () => {
                                                        const previousValue = orderAutoSettleChecked;
                                                        const nextValue = !orderAutoSettleChecked;
                                                        void runMutation('order-auto-settle', () => updateOrderAutoSettleStrategy(requestQuery, nextValue), {
                                                            onMutate: () => setOrderAutoSettleChecked(nextValue),
                                                            onSuccess: (viewModel) => setOrderAutoSettleChecked(viewModel.orderRules.orderAutoSettle.checked),
                                                            onError: () => setOrderAutoSettleChecked(previousValue),
                                                        });
                                                    } })] }) }), _jsx(StrategyCard, { title: readyData.orderRules.negotiateRefund.title, description: readyData.orderRules.negotiateRefund.description, children: _jsx(RadioGroup, { name: "negotiate-refund", options: readyData.orderRules.negotiateRefund.options, value: negotiateRefundValue, disabled: busyKey === 'negotiate-refund', onChange: (nextValue) => {
                                                const previousValue = negotiateRefundValue;
                                                void runMutation('negotiate-refund', () => updateNegotiateRefundAutomaticAcceptStrategy(requestQuery, nextValue), {
                                                    onMutate: () => setNegotiateRefundValue(nextValue),
                                                    onSuccess: (viewModel) => setNegotiateRefundValue(viewModel.orderRules.negotiateRefund.value),
                                                    onError: () => setNegotiateRefundValue(previousValue),
                                                });
                                            } }) })] }), _jsxs("div", { id: "auto-strategy-panel-roomAutomation", role: "tabpanel", "aria-labelledby": "auto-strategy-tab-roomAutomation", "aria-label": "\u623F\u6001\u81EA\u52A8\u5316", hidden: activeTab !== 'roomAutomation', children: [_jsx(StrategyCard, { title: readyData.roomAutomation.roomAssign.title, children: _jsxs("div", { className: "auto-strategy-stack", children: [_jsx("div", { className: "auto-strategy-inline-copy", children: _jsx("span", { className: "auto-strategy-inline-copy__label", children: readyData.roomAutomation.roomAssign.strategyLabel }) }), _jsx(RadioGroup, { name: "room-assign-strategy", options: readyData.roomAutomation.roomAssign.options, value: readyData.roomAutomation.roomAssign.value, disabled: true, onChange: () => undefined }), _jsxs("div", { className: "auto-strategy-advanced", children: [_jsx("span", { className: "auto-strategy-advanced__title", children: "\u9AD8\u7EA7\u529F\u80FD" }), readyData.roomAutomation.roomAssign.advancedOptions.map((item) => (_jsx(CheckboxRow, { label: item.label, checked: item.checked }, item.label)))] })] }) }), _jsx(StrategyCard, { title: readyData.roomAutomation.autoCheckIn.title, description: readyData.roomAutomation.autoCheckIn.description, children: _jsxs("div", { className: "auto-strategy-time-row", children: [_jsx("span", { children: readyData.roomAutomation.autoCheckIn.label }), _jsx(SwitchButton, { label: readyData.roomAutomation.autoCheckIn.switchLabel, checked: readyData.roomAutomation.autoCheckIn.checked, disabled: true }), _jsx("div", { className: "auto-strategy-time-chip", children: readyData.roomAutomation.autoCheckIn.time })] }) }), _jsx(StrategyCard, { title: readyData.roomAutomation.autoCheckOut.title, description: readyData.roomAutomation.autoCheckOut.description, children: _jsxs("div", { className: "auto-strategy-time-row", children: [_jsx("span", { children: readyData.roomAutomation.autoCheckOut.label }), _jsx(SwitchButton, { label: readyData.roomAutomation.autoCheckOut.switchLabel, checked: readyData.roomAutomation.autoCheckOut.checked, disabled: true }), _jsx("div", { className: "auto-strategy-time-chip", children: readyData.roomAutomation.autoCheckOut.time })] }) }), _jsx(StrategyCard, { title: readyData.roomAutomation.dirtyRoom.title, description: readyData.roomAutomation.dirtyRoom.description, children: _jsx(RadioGroup, { name: "dirty-room-strategy", options: readyData.roomAutomation.dirtyRoom.options, value: readyData.roomAutomation.dirtyRoom.value, disabled: true, onChange: () => undefined }) }), _jsx(StrategyCard, { title: readyData.roomAutomation.cleanRoom.title, children: _jsxs("div", { className: "auto-strategy-switch-row", children: [_jsx("span", { children: readyData.roomAutomation.cleanRoom.switchLabel }), _jsx(SwitchButton, { label: readyData.roomAutomation.cleanRoom.switchLabel, checked: readyData.roomAutomation.cleanRoom.checked, disabled: true })] }) })] }), _jsxs("div", { id: "auto-strategy-panel-inventoryOccupation", role: "tabpanel", "aria-labelledby": "auto-strategy-tab-inventoryOccupation", "aria-label": "\u5E93\u5B58\u5360\u7528\u89C4\u5219", hidden: activeTab !== 'inventoryOccupation', children: [_jsx(StrategyCard, { title: readyData.inventoryOccupation.pendingOrder.title, description: readyData.inventoryOccupation.pendingOrder.description, children: _jsx(RadioGroup, { name: "pending-order-occupation", options: readyData.inventoryOccupation.pendingOrder.options, value: readyData.inventoryOccupation.pendingOrder.value, disabled: true, onChange: () => undefined }) }), _jsx(StrategyCard, { title: readyData.inventoryOccupation.unpaidOrder.title, description: readyData.inventoryOccupation.unpaidOrder.description, children: _jsx(RadioGroup, { name: "unpaid-order-occupation", options: readyData.inventoryOccupation.unpaidOrder.options, value: readyData.inventoryOccupation.unpaidOrder.value, disabled: true, onChange: () => undefined }) }), _jsx(StrategyCard, { title: readyData.inventoryOccupation.hourlyRoom.title, description: readyData.inventoryOccupation.hourlyRoom.description, children: _jsx(RadioGroup, { name: "hourly-room-occupation", options: readyData.inventoryOccupation.hourlyRoom.options, value: readyData.inventoryOccupation.hourlyRoom.value, disabled: true, onChange: () => undefined }) })] })] })) : null] })] }));
}
function StrategyCard({ title, description, children, }) {
    return (_jsxs("section", { className: "auto-strategy-card", role: "region", "aria-label": title, children: [_jsxs("header", { className: "auto-strategy-card__header", children: [_jsx("h2", { children: title }), description ? _jsx("p", { children: description }) : null] }), _jsx("div", { className: "auto-strategy-card__body", children: children })] }));
}
function RadioGroup({ name, options, value, disabled, onChange, }) {
    return (_jsx("div", { className: "auto-strategy-radio-group", children: options.map((option) => (_jsxs("label", { className: `auto-strategy-radio${disabled ? ' is-disabled' : ''}`, children: [_jsx("input", { type: "radio", name: name, "aria-label": option.label, checked: value === option.value, disabled: disabled, onChange: () => onChange(option.value) }), _jsxs("span", { className: "auto-strategy-radio__content", children: [_jsxs("span", { className: "auto-strategy-radio__main", children: [_jsx("span", { children: option.label }), option.actionText ? _jsx("span", { className: "auto-strategy-radio__action", children: option.actionText }) : null] }), option.description ? _jsx("span", { className: "auto-strategy-radio__description", children: option.description }) : null] })] }, option.value))) }));
}
function SwitchButton({ label, checked, disabled, onToggle, }) {
    return (_jsx("button", { type: "button", role: "switch", "aria-label": label, "aria-checked": checked, disabled: disabled, className: `auto-strategy-switch${checked ? ' is-on' : ''}`, onClick: onToggle, children: _jsx("span", {}) }));
}
function CheckboxRow({ label, checked }) {
    return (_jsxs("label", { className: "auto-strategy-checkbox", children: [_jsx("input", { type: "checkbox", "aria-label": label, checked: checked, readOnly: true }), _jsx("span", { children: label })] }));
}
function toContract(data) {
    return {
        provider: data.provider,
        responseState: data.state,
        endpoint: data.endpoint,
        mockState: data.state,
        requestBody: data.requestBody,
        traceId: data.traceId,
        timestamp: data.timestamp,
        lastAction: '',
        lastRequestBody: null,
    };
}
function toErrorContract(error, query, lastAction = '', lastRequestBody = null) {
    if (error instanceof AutoStrategySettingServiceError) {
        return {
            provider: error.provider,
            responseState: 'error',
            endpoint: error.endpoint,
            mockState: query.mockState ?? 'error',
            requestBody: error.requestBody,
            traceId: error.response.traceId,
            timestamp: error.response.timestamp,
            lastAction,
            lastRequestBody,
        };
    }
    return {
        provider: query.provider ?? 'mock',
        responseState: 'error',
        endpoint: AUTO_STRATEGY_SETTING_BOOTSTRAP_ENDPOINT,
        mockState: query.mockState ?? 'error',
        requestBody: { campId: query.campId },
        traceId: '',
        timestamp: '',
        lastAction,
        lastRequestBody,
    };
}
