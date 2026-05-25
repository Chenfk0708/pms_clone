import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { createPaymentMethod, loadPaymentSettingPage, movePaymentMethod, updatePaymentMethodStatus, } from '../services/paymentSetting';
import './PaymentSettingPage.css';
export function PaymentSettingPage() {
    const [pageData, setPageData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [feedback, setFeedback] = useState('支付方式设置加载中');
    const [inlineAdd, setInlineAdd] = useState(null);
    const [reloadToken, setReloadToken] = useState(0);
    const [lastMutation, setLastMutation] = useState(null);
    const [hoveredEnabledMethodId, setHoveredEnabledMethodId] = useState(null);
    const [draggingMethodId, setDraggingMethodId] = useState(null);
    const nextSuccessFeedback = useRef('支付方式设置已更新');
    useEffect(() => {
        const controller = new AbortController();
        loadPaymentSettingPage({}, controller.signal)
            .then((data) => {
            if (controller.signal.aborted)
                return;
            setPageData(data);
            setFeedback(nextSuccessFeedback.current || '支付方式设置已更新');
            nextSuccessFeedback.current = '支付方式设置已更新';
        })
            .catch((loadError) => {
            if (controller.signal.aborted)
                return;
            setError(loadError.message || '支付方式设置加载失败，请稍后重试');
            setFeedback('支付方式设置加载失败');
        })
            .finally(() => {
            if (!controller.signal.aborted) {
                setIsLoading(false);
            }
        });
        return () => controller.abort();
    }, [reloadToken]);
    const contractLines = [
        ...(pageData?.requestSummary ?? []),
        ...(lastMutation?.requestSummary ?? []),
    ];
    function triggerReload(message) {
        setIsLoading(true);
        setError('');
        nextSuccessFeedback.current = message;
        setReloadToken((value) => value + 1);
    }
    function openInlineAdd() {
        setInlineAdd({
            name: '',
            error: '',
            isSubmitting: false,
        });
    }
    async function handleCreate() {
        if (!inlineAdd)
            return;
        const name = inlineAdd.name.trim();
        if (!name) {
            setInlineAdd({ ...inlineAdd, error: '请输入支付方式名称' });
            return;
        }
        setInlineAdd({ ...inlineAdd, error: '', isSubmitting: true });
        try {
            const result = await createPaymentMethod({
                name,
                status: 'enabled',
            });
            setLastMutation(result);
            setInlineAdd(null);
            triggerReload(result.message);
        }
        catch (mutationError) {
            setInlineAdd({
                ...inlineAdd,
                error: mutationError instanceof Error ? mutationError.message : '新增支付方式失败，请稍后重试',
                isSubmitting: false,
            });
        }
    }
    async function handleDisable(methodId) {
        try {
            const result = await updatePaymentMethodStatus({ methodId, nextStatus: 'disabled' });
            setLastMutation(result);
            triggerReload(result.message);
        }
        catch (mutationError) {
            setFeedback(mutationError instanceof Error ? mutationError.message : '支付方式停用失败，请稍后重试');
        }
    }
    async function handleEnable(methodId) {
        try {
            const result = await updatePaymentMethodStatus({ methodId, nextStatus: 'enabled' });
            setLastMutation(result);
            triggerReload(result.message);
        }
        catch (mutationError) {
            setFeedback(mutationError instanceof Error ? mutationError.message : '支付方式启用失败，请稍后重试');
        }
    }
    async function handleSortDrop(targetMethodId) {
        if (!pageData || !draggingMethodId || draggingMethodId === targetMethodId) {
            setDraggingMethodId(null);
            return;
        }
        const enabledIds = pageData.enabledMethods.map((method) => method.id);
        const fromIndex = enabledIds.indexOf(draggingMethodId);
        const toIndex = enabledIds.indexOf(targetMethodId);
        if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) {
            setDraggingMethodId(null);
            return;
        }
        const direction = fromIndex < toIndex ? 'down' : 'up';
        try {
            let result = null;
            for (let step = 0; step < Math.abs(toIndex - fromIndex); step += 1) {
                result = await movePaymentMethod({ methodId: draggingMethodId, direction });
            }
            if (result) {
                setLastMutation(result);
                triggerReload('支付方式排序已更新');
            }
        }
        catch (mutationError) {
            setFeedback(mutationError instanceof Error ? mutationError.message : '支付方式排序失败，请稍后重试');
        }
        finally {
            setDraggingMethodId(null);
        }
    }
    return (_jsx("div", { className: "payment-setting-page", children: _jsxs("section", { className: "payment-setting-panel", "aria-label": "\u652F\u4ED8\u65B9\u5F0F\u8BBE\u7F6E", children: [_jsx("div", { className: "payment-setting-feedback", role: "status", "aria-label": "\u652F\u4ED8\u65B9\u5F0F\u8BBE\u7F6E\u64CD\u4F5C\u53CD\u9988", children: feedback }), _jsxs("div", { className: "payment-setting-notice", role: "note", children: [_jsx("span", { "aria-hidden": "true", children: "!" }), pageData?.notice ?? '系统默认支付方式不支持编辑和删除，可直接拖动调整排序。'] }), isLoading ? _jsx(LoadingState, {}) : null, !isLoading && error ? (_jsxs("section", { className: "payment-setting-alert", role: "alert", children: [_jsx("strong", { children: "\u652F\u4ED8\u65B9\u5F0F\u8BBE\u7F6E\u52A0\u8F7D\u5931\u8D25\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5" }), _jsx("p", { children: error }), _jsx("button", { type: "button", className: "payment-setting-primary", onClick: () => triggerReload('支付方式设置已更新'), children: "\u91CD\u65B0\u52A0\u8F7D\u652F\u4ED8\u65B9\u5F0F\u8BBE\u7F6E" })] })) : null, !isLoading && !error && pageData ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "payment-setting-heading-row", children: [_jsx(SectionHeading, { children: "\u5DF2\u542F\u7528\u652F\u4ED8\u65B9\u5F0F" }), _jsx("button", { type: "button", className: "payment-setting-primary payment-setting-primary--compact", onClick: openInlineAdd, disabled: inlineAdd !== null, children: "\u65B0\u589E" })] }), _jsxs("div", { className: "payment-setting-grid", "aria-label": "\u5DF2\u542F\u7528\u652F\u4ED8\u65B9\u5F0F\u5217\u8868", children: [pageData.enabledMethods.map((method) => (_jsx(PaymentMethodTile, { method: method, isHovering: hoveredEnabledMethodId === method.id, isDragging: draggingMethodId === method.id, onDisable: () => handleDisable(method.id), onDragStart: () => setDraggingMethodId(method.id), onDragEnd: () => setDraggingMethodId(null), onDragEnter: () => setHoveredEnabledMethodId(method.id), onMouseEnter: () => setHoveredEnabledMethodId(method.id), onMouseLeave: () => setHoveredEnabledMethodId((current) => (current === method.id ? null : current)), onDrop: () => void handleSortDrop(method.id) }, method.id))), inlineAdd ? (_jsx(InlineAddTile, { value: inlineAdd.name, error: inlineAdd.error, isSubmitting: inlineAdd.isSubmitting, onChange: (value) => setInlineAdd({ ...inlineAdd, name: value, error: '' }), onConfirm: () => void handleCreate(), onCancel: () => setInlineAdd(null) })) : null] }), _jsx("div", { className: "payment-setting-divider" }), _jsx("div", { className: "payment-setting-heading-row", children: _jsx(SectionHeading, { children: "\u5DF2\u505C\u7528\u652F\u4ED8\u65B9\u5F0F" }) }), _jsx("div", { className: "payment-setting-disabled", "aria-label": "\u5DF2\u505C\u7528\u652F\u4ED8\u65B9\u5F0F\u5217\u8868", children: pageData.disabledMethods.map((method) => (_jsx(PaymentMethodTile, { method: method, variant: "disabled", onEnable: () => handleEnable(method.id) }, method.id))) })] })) : null, _jsx("pre", { className: "payment-setting-contract", "data-testid": "payment-setting-service-contract", "aria-hidden": "true", children: contractLines.join('\n') })] }) }));
}
function SectionHeading({ children }) {
    return (_jsxs("h2", { className: "payment-setting-title", children: [_jsx("span", { "aria-hidden": "true" }), children] }));
}
function PaymentMethodTile({ method, variant = 'enabled', isHovering = false, isDragging = false, onDisable, onEnable, onDragStart, onDragEnd, onDragEnter, onDrop, onMouseEnter, onMouseLeave, }) {
    return (_jsxs("article", { className: `payment-method-tile payment-method-tile--${variant}${isDragging ? ' is-dragging' : ''}`, "data-testid": "payment-method-tile", "data-method-id": method.id, "data-status": variant, draggable: variant === 'enabled', onDragStart: onDragStart, onDragEnd: onDragEnd, onDragOver: variant === 'enabled' ? (event) => event.preventDefault() : undefined, onDrop: variant === 'enabled' ? onDrop : undefined, onDragEnter: variant === 'enabled' ? onDragEnter : undefined, onMouseEnter: onMouseEnter, onMouseLeave: onMouseLeave, children: [_jsx("span", { className: "payment-method-tile__handle", "aria-hidden": "true", children: "\u22EE\u22EE" }), _jsx("strong", { children: method.name }), method.isSystemDefault ? _jsx("span", { className: "payment-method-tile__badge", children: "\u9ED8\u8BA4" }) : null, variant === 'enabled' && isHovering ? (_jsx("button", { type: "button", className: "payment-method-tile__disable", "aria-label": `停用 ${method.name}`, "data-tooltip": "\u505C\u7528", onClick: onDisable, children: "\u00D7" })) : null, variant === 'disabled' ? (_jsx("button", { type: "button", className: "payment-method-tile__enable", onClick: onEnable, children: "\u542F\u7528" })) : null] }));
}
function InlineAddTile({ value, error, isSubmitting, onChange, onConfirm, onCancel, }) {
    return (_jsxs("div", { className: "payment-method-tile payment-method-tile--editing", "data-testid": "payment-method-inline-add", children: [_jsx("span", { className: "payment-method-tile__handle", "aria-hidden": "true", children: "\u22EE\u22EE" }), _jsxs("div", { className: "payment-method-tile__editor", children: [_jsx("input", { type: "text", "aria-label": "\u65B0\u589E\u652F\u4ED8\u65B9\u5F0F\u540D\u79F0", value: value, onChange: (event) => onChange(event.target.value), placeholder: "\u8BF7\u8F93\u5165" }), _jsx("button", { type: "button", className: "is-confirm", "aria-label": "\u786E\u8BA4\u65B0\u589E\u652F\u4ED8\u65B9\u5F0F", onClick: onConfirm, disabled: isSubmitting, children: "\u221A" }), _jsx("button", { type: "button", className: "is-cancel", "aria-label": "\u53D6\u6D88\u65B0\u589E\u652F\u4ED8\u65B9\u5F0F", onClick: onCancel, disabled: isSubmitting, children: "\u00D7" })] }), error ? _jsx("p", { className: "payment-method-tile__error", children: error }) : null] }));
}
function LoadingState({ compact = false }) {
    return (_jsxs("div", { className: `payment-setting-loading${compact ? ' payment-setting-loading--compact' : ''}`, children: [_jsx("span", { className: "payment-setting-loading__dot", "aria-hidden": "true" }), _jsx("p", { children: "\u652F\u4ED8\u65B9\u5F0F\u8BBE\u7F6E\u52A0\u8F7D\u4E2D..." })] }));
}
