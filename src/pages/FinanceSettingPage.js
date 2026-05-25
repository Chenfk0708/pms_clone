import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createDefaultFinanceSettingQuery, FINANCE_SETTING_GET_ENDPOINT, getFinanceLockDate, initializeFinanceSettingDefaults, isFinanceRuleLocked, loadFinanceSettingViewModel, resolveFinanceSettingRuntimeConfig, saveFinanceAmortizeSetting, saveFinanceNightAuditSetting, saveFinanceVendibleSetting, } from '../services/financeSetting';
import './FinanceSettingPage.css';
export function FinanceSettingPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const runtimeConfig = useMemo(() => resolveFinanceSettingRuntimeConfig(location.search), [location.search]);
    const query = useMemo(() => createDefaultFinanceSettingQuery(runtimeConfig), [runtimeConfig]);
    const [viewModel, setViewModel] = useState(null);
    const [statusText, setStatusText] = useState('财务设置数据加载中');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [dialog, setDialog] = useState(null);
    const [isVendibleEditing, setIsVendibleEditing] = useState(false);
    const [vendibleDraft, setVendibleDraft] = useState([]);
    useEffect(() => {
        const controller = new AbortController();
        loadFinanceSettingViewModel(query, controller.signal)
            .then((nextViewModel) => {
            if (controller.signal.aborted)
                return;
            setViewModel(nextViewModel);
            setVendibleDraft(nextViewModel.vendible.selectedValues);
            setStatusText(nextViewModel.feedback);
        })
            .catch((loadError) => {
            if (controller.signal.aborted)
                return;
            setViewModel(null);
            setVendibleDraft([]);
            setError(loadError.message || '财务设置加载失败，请稍后重试');
            setStatusText('财务设置加载失败');
        })
            .finally(() => {
            if (!controller.signal.aborted)
                setIsLoading(false);
        });
        return () => controller.abort();
    }, [query]);
    const contractText = useMemo(() => JSON.stringify({
        endpoint: viewModel?.diagnostics.getRequest.endpoint ?? FINANCE_SETTING_GET_ENDPOINT,
        request: viewModel?.diagnostics.getRequest.body ?? query,
        provider: viewModel?.provider ?? runtimeConfig.provider,
        mockState: viewModel?.mockState ?? runtimeConfig.mockState,
        lockDates: viewModel
            ? {
                amortize: getFinanceLockDate(viewModel.amortize.lockKey),
                vendible: getFinanceLockDate(viewModel.vendible.lockKey),
            }
            : {},
        saveRequests: viewModel?.diagnostics.saveRequests ?? null,
        traceId: viewModel?.traceId ?? '',
        timestamp: viewModel?.timestamp ?? '',
    }, null, 2), [query, runtimeConfig.mockState, runtimeConfig.provider, viewModel]);
    const canInteract = !isLoading && !isSubmitting && Boolean(viewModel);
    async function reload(nextStatus = '财务设置数据已刷新') {
        setStatusText(nextStatus);
        setIsLoading(true);
        setError('');
        setViewModel(null);
        try {
            const nextViewModel = await loadFinanceSettingViewModel(query);
            setViewModel(nextViewModel);
            setVendibleDraft(nextViewModel.vendible.selectedValues);
            setStatusText(nextStatus);
        }
        catch (loadError) {
            const message = loadError instanceof Error ? loadError.message : '财务设置加载失败，请稍后重试';
            setError(message);
            setStatusText('财务设置加载失败');
        }
        finally {
            setIsLoading(false);
        }
    }
    async function commitNightAudit(enabled, time, nextStatus) {
        if (!viewModel)
            return;
        setIsSubmitting(true);
        setError('');
        setStatusText(nextStatus ?? '夜审设置保存中');
        try {
            const result = await saveFinanceNightAuditSetting(viewModel, { enabled, time }, enabled ? 'direct-enable' : 'disable');
            setViewModel(result.viewModel);
            setStatusText(result.feedback);
            setDialog(null);
        }
        catch (submitError) {
            const message = submitError instanceof Error ? submitError.message : '夜审设置保存失败，请稍后重试';
            setError(message);
            setStatusText('夜审设置保存失败');
        }
        finally {
            setIsSubmitting(false);
        }
    }
    async function commitNightAuditTime(time) {
        if (!viewModel)
            return;
        setIsSubmitting(true);
        setError('');
        setStatusText('自动夜审时间保存中');
        try {
            const result = await saveFinanceNightAuditSetting(viewModel, { enabled: viewModel.nightAudit.enabled, time }, 'time');
            setViewModel(result.viewModel);
            setStatusText(result.feedback);
        }
        catch (submitError) {
            const message = submitError instanceof Error ? submitError.message : '自动夜审时间保存失败，请稍后重试';
            setError(message);
            setStatusText('自动夜审时间保存失败');
        }
        finally {
            setIsSubmitting(false);
        }
    }
    async function confirmAmortize(strategy) {
        if (!viewModel)
            return;
        setIsSubmitting(true);
        setError('');
        setStatusText('连住订单分摊模式保存中');
        try {
            const result = await saveFinanceAmortizeSetting(viewModel, strategy);
            setViewModel(result.viewModel);
            setStatusText(result.feedback);
            setDialog(null);
        }
        catch (submitError) {
            const message = submitError instanceof Error ? submitError.message : '连住订单分摊模式保存失败，请稍后重试';
            setError(message);
            setStatusText('连住订单分摊模式保存失败');
        }
        finally {
            setIsSubmitting(false);
        }
    }
    async function confirmVendible() {
        if (!viewModel)
            return;
        setIsSubmitting(true);
        setError('');
        setStatusText('关房计入可售规则保存中');
        try {
            const result = await saveFinanceVendibleSetting(viewModel, vendibleDraft);
            setViewModel(result.viewModel);
            setVendibleDraft(result.viewModel.vendible.selectedValues);
            setIsVendibleEditing(false);
            setStatusText(result.feedback);
            setDialog(null);
        }
        catch (submitError) {
            const message = submitError instanceof Error ? submitError.message : '关房计入可售规则保存失败，请稍后重试';
            setError(message);
            setStatusText('关房计入可售规则保存失败');
        }
        finally {
            setIsSubmitting(false);
        }
    }
    async function initializeDefaults() {
        if (!viewModel)
            return;
        setIsSubmitting(true);
        setError('');
        setStatusText('财务规则初始化中');
        try {
            const result = await initializeFinanceSettingDefaults(viewModel);
            setViewModel(result.viewModel);
            setVendibleDraft(result.viewModel.vendible.selectedValues);
            setStatusText(result.feedback);
        }
        catch (submitError) {
            const message = submitError instanceof Error ? submitError.message : '财务规则初始化失败，请稍后重试';
            setError(message);
            setStatusText('财务规则初始化失败');
        }
        finally {
            setIsSubmitting(false);
        }
    }
    function handleNightAuditToggle(nextEnabled) {
        if (!viewModel || isSubmitting)
            return;
        if (nextEnabled && !viewModel.nightAudit.enabled) {
            setDialog({ type: 'permission-enable' });
            return;
        }
        void commitNightAudit(nextEnabled, viewModel.nightAudit.time);
    }
    function handleNightAuditTimeChange(value) {
        if (!viewModel || isSubmitting || value === viewModel.nightAudit.time)
            return;
        void commitNightAuditTime(value);
    }
    function handleAmortizeChange(strategy) {
        if (!viewModel || isSubmitting || strategy === viewModel.amortize.strategy)
            return;
        if (isFinanceRuleLocked(viewModel.amortize.lockKey)) {
            setStatusText('连住订单分摊模式今天已修改，请明日再试');
            return;
        }
        setDialog({ type: 'amortize-confirm', strategy });
    }
    function toggleVendible(value, checked) {
        if (!isVendibleEditing || isSubmitting)
            return;
        setVendibleDraft((current) => {
            const nextSet = new Set(current);
            if (checked) {
                nextSet.add(value);
            }
            else if (nextSet.size > 1) {
                nextSet.delete(value);
            }
            return [...nextSet].sort((left, right) => left - right);
        });
    }
    function beginVendibleEdit() {
        if (!viewModel || isSubmitting)
            return;
        setVendibleDraft(viewModel.vendible.selectedValues);
        setIsVendibleEditing(true);
        setStatusText('请确认关房计入可售的房态类型');
    }
    function cancelVendibleEdit() {
        if (!viewModel)
            return;
        setVendibleDraft(viewModel.vendible.selectedValues);
        setIsVendibleEditing(false);
        setDialog(null);
        setStatusText('已恢复当前关房计入可售规则');
    }
    function submitVendibleEdit() {
        if (!viewModel || isSubmitting)
            return;
        if (isFinanceRuleLocked(viewModel.vendible.lockKey)) {
            setStatusText('关房计入可售规则今天已修改，请明日再试');
            return;
        }
        setDialog({ type: 'vendible-confirm', selectedValues: vendibleDraft });
    }
    return (_jsxs("div", { className: "finance-setting-page", children: [_jsxs("section", { className: "finance-setting-panel", "aria-label": "\u8D22\u52A1\u8BBE\u7F6E", children: [_jsx("h1", { className: "finance-setting-sr-title", children: "\u8D22\u52A1\u8BBE\u7F6E" }), _jsxs("div", { className: "finance-setting-status-row", children: [_jsx("div", { className: "finance-setting-status", role: "status", "aria-label": "\u8D22\u52A1\u8BBE\u7F6E\u64CD\u4F5C\u53CD\u9988", children: isLoading ? '财务设置数据加载中' : statusText }), _jsx("button", { type: "button", className: "finance-setting-refresh", onClick: () => void reload(), disabled: isLoading || isSubmitting, children: "\u5237\u65B0" })] }), _jsx("pre", { "data-testid": "finance-setting-contract", className: "finance-setting-contract", children: contractText }), error ? (_jsxs("section", { className: "finance-setting-state-card finance-setting-state-card--error", role: "alert", children: [_jsx("strong", { children: "\u8D22\u52A1\u8BBE\u7F6E\u52A0\u8F7D\u5931\u8D25" }), _jsx("span", { children: error }), _jsx("button", { type: "button", onClick: () => void reload('财务设置数据已重试'), children: "\u91CD\u65B0\u52A0\u8F7D" })] })) : null, !error && viewModel && !viewModel.isInitialized ? (_jsxs("section", { className: "finance-setting-state-card", role: "status", "aria-label": "\u8D22\u52A1\u8BBE\u7F6E\u521D\u59CB\u5316\u63D0\u9192", children: [_jsx("strong", { children: "\u5F53\u524D\u95E8\u5E97\u5C1A\u672A\u5B8C\u6210\u8D22\u52A1\u89C4\u5219\u8BBE\u7F6E" }), _jsx("span", { children: "\u5EFA\u8BAE\u5148\u521D\u59CB\u5316\u9ED8\u8BA4\u89C4\u5219\uFF0C\u518D\u6309\u95E8\u5E97\u7ECF\u8425\u65B9\u5F0F\u8C03\u6574\u591C\u5BA1\u3001\u5206\u644A\u4E0E\u53EF\u552E\u53E3\u5F84\u3002" }), _jsx("button", { type: "button", onClick: () => void initializeDefaults(), disabled: isSubmitting, children: "\u521D\u59CB\u5316\u9ED8\u8BA4\u89C4\u5219" })] })) : null, viewModel ? (_jsxs(_Fragment, { children: [_jsxs("section", { className: "finance-setting-section", children: [_jsx("h2", { children: "\u591C\u5BA1\u8BBE\u7F6E" }), _jsxs("div", { className: "finance-setting-row finance-setting-row--night", children: [_jsxs("div", { className: "finance-setting-row-main", children: [_jsx("span", { className: "finance-setting-label", children: "\u591C\u5BA1" }), _jsx("button", { type: "button", role: "switch", "aria-label": "\u591C\u5BA1", "aria-checked": viewModel.nightAudit.enabled, className: `finance-switch${viewModel.nightAudit.enabled ? ' is-on' : ''}`, onClick: () => handleNightAuditToggle(!viewModel.nightAudit.enabled), disabled: !canInteract }), _jsx("p", { children: "\u5F00\u542F\u540E\uFF0C\u6BCF\u5929\u6307\u5B9A\u65F6\u95F4\u4F1A\u81EA\u52A8\u8FDB\u884C\u591C\u5BA1\u3002" })] }), _jsxs("label", { className: `finance-time-select${!canInteract ? ' is-disabled' : ''}`, children: [_jsx("span", { children: "\u81EA\u52A8\u591C\u5BA1\u65F6\u95F4" }), _jsx("select", { "aria-label": "\u81EA\u52A8\u591C\u5BA1\u65F6\u95F4", value: viewModel.nightAudit.time, onChange: (event) => handleNightAuditTimeChange(Number(event.target.value)), disabled: !canInteract, children: viewModel.nightAudit.options.map((option) => (_jsx("option", { value: option.value, children: option.label }, option.value))) })] })] })] }), _jsxs("section", { className: "finance-setting-section", children: [_jsx("h2", { children: "\u5206\u644A\u8BBE\u7F6E" }), _jsxs("div", { className: "finance-setting-content", children: [_jsx("div", { className: "finance-setting-line", children: _jsx("span", { children: "\u8FDE\u4F4F\u8BA2\u5355\u5206\u644A(\u4E00\u5929\u4EC5\u80FD\u4FEE\u6539\u4E00\u6B21\uFF0C\u8BF7\u8C28\u614E\u64CD\u4F5C\u3002)" }) }), _jsx("div", { className: "finance-setting-options", role: "radiogroup", "aria-label": "\u8FDE\u4F4F\u8BA2\u5355\u5206\u644A\u6A21\u5F0F", children: viewModel.amortize.options.map((option) => (_jsxs("label", { children: [_jsx("input", { type: "radio", name: "finance-allocation", "aria-label": option.label, checked: viewModel.amortize.strategy === option.value, disabled: !canInteract, onChange: () => handleAmortizeChange(option.value) }), option.label] }, option.value))) }), _jsx("div", { className: "finance-setting-hint", children: _jsxs("span", { children: ["\u4ECA\u65E5\u4FEE\u6539\u8BB0\u5F55\uFF1A", getFinanceLockDate(viewModel.amortize.lockKey) || '未修改'] }) })] })] }), _jsxs("section", { className: "finance-setting-section", children: [_jsx("h2", { children: "\u53EF\u552E\u8BBE\u7F6E" }), _jsxs("div", { className: "finance-setting-content", children: [_jsx("div", { className: "finance-setting-line", children: _jsx("span", { children: "\u5173\u623F\u8BA1\u5165\u53EF\u552E(\u4E00\u5929\u4EC5\u80FD\u4FEE\u6539\u4E00\u6B21\uFF0C\u8BF7\u8C28\u614E\u64CD\u4F5C\u3002)" }) }), _jsxs("div", { className: "finance-setting-actions-row", children: [_jsx("div", { className: "finance-setting-options", "aria-label": "\u5173\u623F\u8BA1\u5165\u53EF\u552E\u9009\u9879", children: viewModel.vendible.options.map((option) => (_jsxs("label", { children: [_jsx("input", { type: "checkbox", "aria-label": option.label, checked: vendibleDraft.includes(option.value), disabled: !isVendibleEditing || isSubmitting, onChange: (event) => toggleVendible(option.value, event.target.checked) }), option.label] }, option.value))) }), isVendibleEditing ? (_jsxs("div", { className: "finance-setting-inline-actions", children: [_jsx("button", { type: "button", onClick: cancelVendibleEdit, disabled: isSubmitting, children: "\u53D6\u6D88" }), _jsx("button", { type: "button", onClick: submitVendibleEdit, disabled: isSubmitting, children: "\u4FDD\u5B58" })] })) : (_jsx("button", { type: "button", className: "finance-setting-edit", onClick: beginVendibleEdit, disabled: !canInteract, children: "\u7F16\u8F91" }))] }), _jsx("div", { className: "finance-setting-hint", children: _jsxs("span", { children: ["\u4ECA\u65E5\u4FEE\u6539\u8BB0\u5F55\uFF1A", getFinanceLockDate(viewModel.vendible.lockKey) || '未修改'] }) })] })] })] })) : null] }), dialog?.type === 'permission-enable' ? (_jsx(Modal, { title: "\u662F\u5426\u786E\u8BA4\u5F00\u542F\u591C\u5BA1\uFF1F", ariaLabel: "\u662F\u5426\u786E\u8BA4\u5F00\u542F\u591C\u5BA1", onClose: () => setDialog(null), footer: _jsxs(_Fragment, { children: [_jsx("button", { type: "button", onClick: () => setDialog(null), disabled: isSubmitting, children: "\u53D6\u6D88" }), _jsx("button", { type: "button", onClick: () => void commitNightAudit(true, viewModel?.nightAudit.time, '夜审设置保存中'), disabled: isSubmitting, children: "\u786E\u8BA4\u5F00\u542F" }), _jsx("button", { type: "button", className: "is-primary", onClick: () => navigate(viewModel?.permissionRoute ?? '/setting/role'), disabled: isSubmitting, children: "\u53BB\u8BBE\u7F6E\u6743\u9650" })] }), children: _jsx("p", { children: "\u5EFA\u8BAE\u9650\u5236\u7BA1\u7406\u5458\u5916\u7684\u5176\u4ED6\u6210\u5458\u65E0\u6CD5\u4FEE\u6539\u5386\u53F2\u8BA2\u5355/\u8D26\u5355\u6743\u9650\u540E\u518D\u5F00\u542F\u591C\u5BA1\u3002" }) })) : null, dialog?.type === 'amortize-confirm' ? (_jsx(Modal, { title: "\u786E\u8BA4\u4FEE\u6539\u8FDE\u4F4F\u8BA2\u5355\u5206\u644A\u6A21\u5F0F\uFF1F", ariaLabel: "\u786E\u8BA4\u4FEE\u6539\u8FDE\u4F4F\u8BA2\u5355\u5206\u644A\u6A21\u5F0F", onClose: () => setDialog(null), footer: _jsxs(_Fragment, { children: [_jsx("button", { type: "button", onClick: () => setDialog(null), disabled: isSubmitting, children: "\u53D6\u6D88" }), _jsx("button", { type: "button", className: "is-primary", onClick: () => void confirmAmortize(dialog.strategy), disabled: isSubmitting, children: "\u786E\u5B9A" })] }), children: _jsx("p", { children: "\u4FEE\u6539\u4E4B\u540E\u6240\u6709\u5F85\u5165\u4F4F\u8BA2\u5355\u5C06\u6309\u9009\u5B9A\u6A21\u5F0F\u8FDB\u884C\u5206\u644A\uFF0C\u5F53\u524D\u5165\u4F4F\u548C\u5386\u53F2\u8BA2\u5355\u4ECD\u6309\u4FEE\u6539\u524D\u6A21\u5F0F\u8FDB\u884C\u5206\u644A\u3002" }) })) : null, dialog?.type === 'vendible-confirm' ? (_jsxs(Modal, { title: "\u662F\u5426\u786E\u8BA4\u64CD\u4F5C\uFF1F", ariaLabel: "\u662F\u5426\u786E\u8BA4\u64CD\u4F5C", onClose: () => setDialog(null), footer: _jsxs(_Fragment, { children: [_jsx("button", { type: "button", onClick: () => setDialog(null), disabled: isSubmitting, children: "\u53D6\u6D88" }), _jsx("button", { type: "button", className: "is-primary", onClick: () => void confirmVendible(), disabled: isSubmitting, children: "\u786E\u5B9A" })] }), children: [_jsx("p", { children: "\u5165\u4F4F\u7387 = \u5F00\u623F\u6570 / \u603B\u53EF\u552E\u623F\u95F4\u6570\u3002\u5982\u52FE\u9009\u5173\u623F\u4E0D\u8BA1\u5165\u53EF\u552E\uFF0C\u5219\u5BF9\u5E94\u5173\u623F\u4E0D\u8BA1\u5165\u603B\u53EF\u552E\u623F\u95F4\u6570\uFF1B\u786E\u8BA4\u540E\u4EC5\u66F4\u65B0\u5F53\u5929\u53CA\u8FDC\u671F\u6570\u636E\uFF0C\u5386\u53F2\u6570\u636E\u4E0D\u505A\u8C03\u6574\u3002" }), _jsxs("p", { children: ["\u672C\u6B21\u5C06\u8BA1\u5165\u53EF\u552E\u7684\u623F\u6001\uFF1A", formatVendibleSummary(dialog.selectedValues, viewModel?.vendible.options ?? [])] })] })) : null] }));
}
function Modal({ title, ariaLabel, children, footer, onClose, }) {
    return (_jsx("div", { className: "finance-setting-modal-backdrop", role: "presentation", onClick: onClose, children: _jsxs("section", { className: "finance-setting-modal", role: "dialog", "aria-modal": "true", "aria-label": ariaLabel, onClick: (event) => event.stopPropagation(), children: [_jsxs("header", { children: [_jsx("h3", { children: title }), _jsx("button", { type: "button", "aria-label": `关闭${title}`, onClick: onClose, children: "\u00D7" })] }), _jsx("div", { className: "finance-setting-modal__content", children: children }), _jsx("footer", { children: footer })] }) }));
}
function formatVendibleSummary(selectedValues, options) {
    const selectedLabels = options.filter((option) => selectedValues.includes(option.value)).map((option) => option.label);
    return selectedLabels.join('、') || '未选择';
}
