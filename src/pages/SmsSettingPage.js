import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createDefaultSmsSettingFilters, fetchSmsSettingDashboard, readSmsSettingDiagnostics, } from '../services/smsSetting';
import './SmsSettingPage.css';
export function SmsSettingPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const filters = useMemo(() => createDefaultSmsSettingFilters(new URLSearchParams(location.search)), [location.search]);
    const [reloadKey, setReloadKey] = useState(0);
    const requestKey = `${filters.campId}:${filters.mockState}:${reloadKey}`;
    const [viewModel, setViewModel] = useState(null);
    const [settledRequestKey, setSettledRequestKey] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [feedback, setFeedback] = useState('正在加载短信设置...');
    const [dialog, setDialog] = useState(null);
    const [selectedRechargePlan, setSelectedRechargePlan] = useState('');
    const [selectedChannelId, setSelectedChannelId] = useState('');
    const [activeTemplate, setActiveTemplate] = useState(null);
    const loading = settledRequestKey !== requestKey;
    const hasError = !loading && Boolean(errorMessage);
    useEffect(() => {
        const controller = new AbortController();
        void fetchSmsSettingDashboard(filters, controller.signal)
            .then((result) => {
            setViewModel(result);
            setSelectedChannelId(result.currentChannel.id);
            setErrorMessage('');
            setFeedback(result.emptyState ? result.emptyState.title : '短信设置已同步');
            setSettledRequestKey(requestKey);
        })
            .catch((error) => {
            if (error instanceof DOMException && error.name === 'AbortError')
                return;
            setViewModel(null);
            setErrorMessage(error instanceof Error ? error.message : '短信设置数据加载失败，请稍后重试');
            setFeedback(error instanceof Error ? error.message : '短信设置数据加载失败，请稍后重试');
            setSettledRequestKey(requestKey);
        });
        return () => controller.abort();
    }, [filters, requestKey]);
    const diagnostics = readSmsSettingDiagnostics();
    const provider = viewModel?.provider ?? diagnostics?.provider ?? 'mock';
    const pageState = loading ? 'loading' : hasError ? 'error' : viewModel?.state ?? filters.mockState ?? 'success';
    const requestBody = viewModel?.requestBody ??
        diagnostics?.requestBody ?? {
        campId: filters.campId,
        endpoints: [],
    };
    const contractText = JSON.stringify({
        provider,
        state: pageState,
        requestBody: viewModel?.requestBody ?? diagnostics?.requestBody,
        traceId: viewModel?.traceId ?? diagnostics?.traceId ?? '',
        timestamp: viewModel?.timestamp ?? diagnostics?.timestamp ?? '',
    }, null, 2);
    function retryLoad() {
        setDialog(null);
        setActiveTemplate(null);
        setFeedback('正在重新加载短信设置...');
        setReloadKey((current) => current + 1);
    }
    function openRechargeDialog() {
        setDialog('recharge');
        setFeedback('请选择短信充值套餐');
    }
    function openRechargeRecordDialog() {
        setDialog('rechargeRecord');
        setFeedback('已打开最近充值记录');
    }
    function openChannelDialog() {
        if (!viewModel)
            return;
        setSelectedChannelId(viewModel.currentChannel.id);
        setDialog('channel');
        setFeedback('请选择启用短信渠道');
    }
    function openSignDialog() {
        setDialog('sign');
        setFeedback('已打开短信签名说明');
    }
    function openTemplateDialog(template) {
        setActiveTemplate(template);
        setDialog('template');
        setFeedback(`已打开 ${template.title} 模板详情`);
    }
    function handleRechargePlanSelect(plan) {
        setSelectedRechargePlan(plan.id);
        setFeedback(`已选择 ${plan.countLabel}短信套餐`);
    }
    function handleChannelSave() {
        if (!viewModel)
            return;
        const selected = viewModel.channelOptions.find((item) => item.id === selectedChannelId) ?? viewModel.currentChannel;
        setViewModel({
            ...viewModel,
            currentChannel: selected,
            channelOptions: viewModel.channelOptions.map((item) => ({
                ...item,
                enabled: item.id === selected.id,
            })),
        });
        setDialog(null);
        setFeedback(`启用渠道已切换为 ${selected.name}`);
    }
    function handleTemplateToggle(sectionId, templateId) {
        setViewModel((current) => {
            if (!current)
                return current;
            return {
                ...current,
                sections: current.sections.map((section) => {
                    if (section.id !== sectionId)
                        return section;
                    return {
                        ...section,
                        templates: section.templates.map((template) => template.id === templateId ? { ...template, enabled: !template.enabled } : template),
                    };
                }),
            };
        });
        const template = viewModel?.sections
            .find((item) => item.id === sectionId)
            ?.templates.find((item) => item.id === templateId);
        if (template) {
            setFeedback(`${template.title}${template.enabled ? ' 已停用' : ' 已启用'}`);
        }
    }
    function handleCloseDialog() {
        setDialog(null);
    }
    return (_jsxs("div", { className: "sms-setting-page", "data-provider": provider, "data-state": pageState, children: [_jsx("pre", { id: "sms-setting-service-contract", hidden: true, "data-provider": provider, "data-state": pageState, "data-request": JSON.stringify(requestBody), "data-trace-id": viewModel?.traceId ?? diagnostics?.traceId ?? '', children: contractText }), _jsxs("section", { className: "sms-setting-shell", "aria-label": "\u77ED\u4FE1\u8BBE\u7F6E", children: [_jsx("div", { className: "sms-setting-status", role: "status", "aria-label": "\u77ED\u4FE1\u8BBE\u7F6E\u64CD\u4F5C\u53CD\u9988", children: loading ? '正在加载短信设置...' : feedback }), _jsx("header", { className: "sms-setting-header", children: _jsxs("div", { className: "sms-setting-header__main", "data-testid": "sms-setting-overview", children: [_jsxs("div", { className: "sms-setting-header__toolbar", children: [_jsxs("div", { className: "sms-setting-header__balance", children: [_jsx("h1", { children: viewModel?.title ?? '短信设置' }), _jsxs("div", { className: "sms-setting-header__balance-text", children: [_jsx("span", { children: "\u5269\u4F59\u77ED\u4FE1\uFF1A" }), _jsx("strong", { children: viewModel?.balance.remaining ?? '--' })] }), _jsx("button", { type: "button", className: "sms-setting-primary", onClick: openRechargeDialog, children: "\u5145\u503C" }), _jsx("button", { type: "button", className: "sms-setting-secondary", onClick: openRechargeRecordDialog, children: "\u5145\u503C\u8BB0\u5F55" })] }), _jsx("p", { className: "sms-setting-header__hint", children: viewModel?.introText ?? '启用短信推送模版后，系统将在预设条件下自动向客人发送短信通知' })] }), !loading && !hasError && !viewModel?.emptyState && viewModel ? (_jsxs("div", { className: "sms-setting-header__meta", children: [_jsxs("div", { className: "sms-setting-channel-row", "data-testid": "sms-channel-row", children: [_jsx("span", { className: "sms-setting-label", children: "\u542F\u7528\u6E20\u9053:" }), _jsx("div", { className: "sms-setting-channel-list", "aria-label": "\u5DF2\u542F\u7528\u77ED\u4FE1\u6E20\u9053", children: viewModel.channelOptions.map((channel) => (_jsx("span", { className: `sms-setting-channel-badge sms-setting-channel-badge--${channel.tone}${channel.enabled ? ' is-active' : ''}`, title: channel.name, children: channel.badgeText }, channel.id))) }), _jsx("button", { type: "button", className: "sms-setting-text-button", onClick: openChannelDialog, children: "\u4FEE\u6539" })] }), _jsxs("div", { className: "sms-setting-sign-row", "data-testid": "sms-sign-row", children: [_jsx("span", { className: "sms-setting-label", children: "\u7B7E\u540D:" }), _jsx("strong", { children: viewModel.sign.value }), _jsx("button", { type: "button", className: "sms-setting-text-button", onClick: openSignDialog, children: "\u4FEE\u6539" })] })] })) : null] }) }), loading ? (_jsxs("section", { className: "sms-setting-state sms-setting-state--loading", "aria-live": "polite", "aria-label": "\u77ED\u4FE1\u8BBE\u7F6E\u52A0\u8F7D\u4E2D", children: [_jsx("div", { className: "sms-setting-skeleton sms-setting-skeleton--overview" }), _jsx("div", { className: "sms-setting-skeleton sms-setting-skeleton--section" }), _jsx("div", { className: "sms-setting-skeleton sms-setting-skeleton--section" })] })) : null, hasError ? (_jsxs("section", { className: "sms-setting-state sms-setting-state--error", role: "alert", "aria-label": "\u77ED\u4FE1\u8BBE\u7F6E\u6570\u636E\u9519\u8BEF", children: [_jsx("h2", { children: "\u77ED\u4FE1\u8BBE\u7F6E\u6570\u636E\u52A0\u8F7D\u5931\u8D25\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5" }), _jsx("p", { children: errorMessage }), _jsx("button", { type: "button", className: "sms-setting-primary", onClick: retryLoad, children: "\u91CD\u65B0\u52A0\u8F7D" })] })) : null, !loading && !hasError && viewModel?.emptyState ? (_jsxs("section", { className: "sms-setting-state sms-setting-state--empty", "aria-label": "\u77ED\u4FE1\u8BBE\u7F6E\u7A7A\u72B6\u6001", children: [_jsx("h2", { children: viewModel.emptyState.title }), _jsx("p", { children: viewModel.emptyState.description }), _jsx("button", { type: "button", className: "sms-setting-primary", onClick: () => navigate(viewModel.emptyState?.actionPath ?? '/smartHotel/smartHome'), children: viewModel.emptyState.actionLabel })] })) : null, !loading && !hasError && !viewModel?.emptyState && viewModel ? (_jsx("div", { className: "sms-setting-section-list", "data-testid": "sms-section-list", children: viewModel.sections.map((section) => (_jsx(SmsTemplateSection, { section: section, onRoute: (route) => {
                                setFeedback(`正在前往 ${section.title} 承接页`);
                                navigate(route);
                            }, onToggle: handleTemplateToggle, onEdit: openTemplateDialog }, section.id))) })) : null] }), dialog === 'recharge' && viewModel ? (_jsx(RechargeDialog, { plans: viewModel.rechargePlans, selectedPlanId: selectedRechargePlan, onSelect: handleRechargePlanSelect, onClose: handleCloseDialog })) : null, dialog === 'rechargeRecord' && viewModel ? (_jsx(RechargeRecordDialog, { records: viewModel.rechargeRecords, onClose: handleCloseDialog })) : null, dialog === 'channel' && viewModel ? (_jsx(ChannelDialog, { options: viewModel.channelOptions, selectedChannelId: selectedChannelId, onChange: setSelectedChannelId, onClose: handleCloseDialog, onSave: handleChannelSave })) : null, dialog === 'sign' && viewModel ? (_jsx(SignDialog, { signValue: viewModel.sign.value, description: viewModel.sign.description, onClose: handleCloseDialog })) : null, dialog === 'template' && activeTemplate ? (_jsx(TemplateDialog, { template: activeTemplate, onClose: handleCloseDialog })) : null] }));
}
function SmsTemplateSection({ section, onRoute, onToggle, onEdit, }) {
    return (_jsxs("section", { className: "sms-section-card", "data-accent": section.accent, "aria-label": section.title, children: [_jsxs("header", { className: "sms-section-card__header", children: [_jsx("span", { className: "sms-section-card__icon", "aria-hidden": "true", children: section.iconLabel }), _jsxs("div", { className: "sms-section-card__copy", children: [_jsx("h2", { children: section.title }), _jsx("p", { children: section.description })] }), section.actionLabel && section.actionRoute ? (_jsx("button", { type: "button", className: "sms-setting-text-button", onClick: () => onRoute(section.actionRoute), children: section.actionLabel })) : (_jsx("span", {}))] }), _jsx("div", { className: "sms-section-card__body", children: section.templates.map((template) => (_jsxs("article", { className: "sms-template-item", children: [_jsxs("div", { className: "sms-template-item__top", children: [_jsxs("div", { className: "sms-template-item__title", children: [_jsx("span", { className: "sms-template-item__clock", "aria-hidden": "true" }), _jsx("strong", { children: template.title })] }), _jsx(SmsSwitch, { checked: template.enabled, label: `${template.title}开关`, onChange: () => onToggle(section.id, template.id) })] }), _jsxs("div", { className: "sms-template-item__body", children: [_jsx("p", { children: template.content }), _jsx("button", { type: "button", className: "sms-template-item__edit", "aria-label": `编辑${template.title}`, onClick: () => onEdit(template), children: _jsx("span", {}) })] })] }, template.id))) })] }));
}
function SmsSwitch({ checked, label, onChange, }) {
    return (_jsx("button", { type: "button", className: `sms-switch${checked ? ' is-on' : ''}`, role: "switch", "aria-checked": checked, "aria-label": label, onClick: onChange, children: _jsx("span", {}) }));
}
function RechargeDialog({ plans, selectedPlanId, onSelect, onClose, }) {
    return (_jsx("div", { className: "sms-dialog-backdrop", children: _jsxs("section", { className: "sms-dialog sms-dialog--recharge", role: "dialog", "aria-modal": "true", "aria-label": "\u77ED\u4FE1\u5145\u503C", children: [_jsxs("header", { className: "sms-dialog__header", children: [_jsx("h2", { children: "\u77ED\u4FE1\u5145\u503C" }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u77ED\u4FE1\u5145\u503C", onClick: onClose, children: "\u00D7" })] }), _jsx("div", { className: "sms-recharge-grid", children: plans.map((plan) => (_jsxs("button", { type: "button", "aria-label": plan.countLabel, className: `sms-recharge-plan${selectedPlanId === plan.id ? ' is-selected' : ''}`, onClick: () => onSelect(plan), children: [_jsx("strong", { children: plan.countLabel }), _jsx("span", { children: plan.priceLabel }), _jsx("em", { children: plan.totalLabel })] }, plan.id))) }), _jsx("footer", { className: "sms-dialog__footer", children: _jsx("button", { type: "button", className: "sms-setting-secondary", onClick: onClose, children: "\u53D6\u6D88" }) })] }) }));
}
function RechargeRecordDialog({ records, onClose, }) {
    return (_jsx("div", { className: "sms-dialog-backdrop", children: _jsxs("section", { className: "sms-dialog", role: "dialog", "aria-modal": "true", "aria-label": "\u77ED\u4FE1\u5145\u503C\u8BB0\u5F55", children: [_jsxs("header", { className: "sms-dialog__header", children: [_jsx("h2", { children: "\u77ED\u4FE1\u5145\u503C\u8BB0\u5F55" }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u5145\u503C\u8BB0\u5F55", onClick: onClose, children: "\u00D7" })] }), _jsxs("div", { className: "sms-dialog__content", children: [_jsx("strong", { className: "sms-dialog__label", children: "\u6700\u8FD1\u5145\u503C\u8BB0\u5F55" }), _jsx("div", { className: "sms-record-list", children: records.map((record) => (_jsxs("article", { className: "sms-record-item", children: [_jsxs("div", { children: [_jsx("span", { children: record.createdAt }), _jsx("strong", { children: record.packageLabel })] }), _jsxs("div", { children: [_jsx("em", { children: record.amountLabel }), _jsx("span", { children: record.statusLabel })] })] }, record.id))) })] })] }) }));
}
function ChannelDialog({ options, selectedChannelId, onChange, onClose, onSave, }) {
    return (_jsx("div", { className: "sms-dialog-backdrop", children: _jsxs("section", { className: "sms-dialog", role: "dialog", "aria-modal": "true", "aria-label": "\u542F\u7528\u6E20\u9053", children: [_jsxs("header", { className: "sms-dialog__header", children: [_jsx("h2", { children: "\u542F\u7528\u6E20\u9053" }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u542F\u7528\u6E20\u9053\u5F39\u7A97", onClick: onClose, children: "\u00D7" })] }), _jsx("div", { className: "sms-dialog__content", children: _jsx("div", { className: "sms-channel-option-list", children: options.map((option) => (_jsxs("label", { className: `sms-channel-option${selectedChannelId === option.id ? ' is-selected' : ''}`, children: [_jsx("input", { type: "radio", name: "sms-channel", checked: selectedChannelId === option.id, onChange: () => onChange(option.id), "aria-label": option.name }), _jsx("span", { className: `sms-setting-channel-badge sms-setting-channel-badge--${option.tone}`, children: option.badgeText }), _jsx("strong", { children: option.name })] }, option.id))) }) }), _jsxs("footer", { className: "sms-dialog__footer", children: [_jsx("button", { type: "button", className: "sms-setting-secondary", onClick: onClose, children: "\u53D6\u6D88" }), _jsx("button", { type: "button", className: "sms-setting-primary", onClick: onSave, children: "\u4FDD\u5B58\u6E20\u9053\u8BBE\u7F6E" })] })] }) }));
}
function SignDialog({ signValue, description, onClose, }) {
    return (_jsx("div", { className: "sms-dialog-backdrop", children: _jsxs("section", { className: "sms-dialog", role: "dialog", "aria-modal": "true", "aria-label": "\u77ED\u4FE1\u7B7E\u540D", children: [_jsxs("header", { className: "sms-dialog__header", children: [_jsx("h2", { children: "\u77ED\u4FE1\u7B7E\u540D" }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u7B7E\u540D\u8BF4\u660E", onClick: onClose, children: "\u00D7" })] }), _jsxs("div", { className: "sms-dialog__content", children: [_jsx("strong", { className: "sms-dialog__title", children: signValue }), _jsx("p", { className: "sms-dialog__paragraph", children: description })] })] }) }));
}
function TemplateDialog({ template, onClose, }) {
    return (_jsx("div", { className: "sms-dialog-backdrop", children: _jsxs("section", { className: "sms-dialog", role: "dialog", "aria-modal": "true", "aria-label": `${template.title}模板`, children: [_jsxs("header", { className: "sms-dialog__header", children: [_jsx("h2", { children: template.title }), _jsx("button", { type: "button", "aria-label": `关闭${template.title}模板`, onClick: onClose, children: "\u00D7" })] }), _jsxs("div", { className: "sms-dialog__content", children: [_jsx("strong", { className: "sms-dialog__title", children: template.signName }), _jsx("p", { className: "sms-dialog__paragraph", children: template.content })] }), _jsx("footer", { className: "sms-dialog__footer", children: _jsx("button", { type: "button", className: "sms-setting-secondary", onClick: onClose, children: "\u5173\u95ED" }) })] }) }));
}
