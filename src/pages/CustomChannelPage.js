import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { createCustomChannel, createDefaultCustomChannelQuery, deleteCustomChannel, fetchCustomChannelDashboard, getColorOptions, saveSystemChannels, toggleCustomChannelStatus, updateCustomChannel, } from '../services/customChannel';
import './CustomChannelPage.css';
function createEmptyDialogValue() {
    return {
        name: '',
        color: '',
        colorName: '',
    };
}
export function CustomChannelPage() {
    const location = useLocation();
    const query = useMemo(() => createDefaultCustomChannelQuery(new URLSearchParams(location.search)), [location.search]);
    const [dashboard, setDashboard] = useState(null);
    const [systemDraft, setSystemDraft] = useState({});
    const [feedback, setFeedback] = useState('自定义渠道加载中');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSavingSystem, setIsSavingSystem] = useState(false);
    const [editingSystem, setEditingSystem] = useState(false);
    const [dialog, setDialog] = useState(null);
    const [dialogError, setDialogError] = useState('');
    const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
    const [pendingDelete, setPendingDelete] = useState(null);
    const loadDashboard = useCallback(async (reason) => {
        setIsLoading(true);
        setError('');
        setFeedback(reason === 'retry' ? '正在重新加载自定义渠道' : '自定义渠道加载中');
        try {
            const nextDashboard = await fetchCustomChannelDashboard(query);
            setDashboard(nextDashboard);
            setSystemDraft(Object.fromEntries(nextDashboard.systemChannels.map((channel) => [channel.id, channel.enabled])));
            setFeedback(nextDashboard.customChannels.length === 0 ? '当前暂无自定义渠道' : '已加载自定义渠道配置');
        }
        catch (reasonError) {
            setDashboard(null);
            setFeedback('');
            setError(reasonError instanceof Error ? reasonError.message : '自定义渠道加载失败，请稍后重试');
        }
        finally {
            setIsLoading(false);
        }
    }, [query]);
    useEffect(() => {
        const timer = window.setTimeout(() => {
            void loadDashboard('initial');
        }, 0);
        return () => window.clearTimeout(timer);
    }, [loadDashboard]);
    async function handleSystemSave() {
        setIsSavingSystem(true);
        setError('');
        setFeedback('正在保存系统默认渠道设置');
        try {
            const nextDashboard = await saveSystemChannels(systemDraft, query);
            setDashboard(nextDashboard);
            setEditingSystem(false);
            setFeedback('系统默认渠道设置已保存');
        }
        catch (reasonError) {
            setError(reasonError instanceof Error ? reasonError.message : '系统默认渠道保存失败，请稍后重试');
        }
        finally {
            setIsSavingSystem(false);
        }
    }
    function openCreateDialog() {
        setDialog({ mode: 'create', value: createEmptyDialogValue() });
        setDialogError('');
        setIsColorPickerOpen(false);
    }
    function openEditDialog(channel) {
        setDialog({
            mode: 'edit',
            channelId: channel.id,
            value: {
                name: channel.name,
                color: channel.color,
                colorName: channel.colorName,
            },
        });
        setDialogError('');
        setIsColorPickerOpen(false);
    }
    function updateDialogValue(patch) {
        setDialog((current) => (current ? { ...current, value: { ...current.value, ...patch } } : current));
    }
    async function handleDialogConfirm() {
        if (!dialog)
            return;
        setDialogError('');
        setFeedback(dialog.mode === 'create' ? '正在添加自定义渠道' : '正在更新自定义渠道');
        try {
            const nextDashboard = dialog.mode === 'create'
                ? await createCustomChannel(dialog.value, query)
                : await updateCustomChannel(dialog.channelId, dialog.value, query);
            setDashboard(nextDashboard);
            setDialog(null);
            setIsColorPickerOpen(false);
            setFeedback(dialog.mode === 'create' ? '自定义渠道已添加' : '自定义渠道已更新');
        }
        catch (reasonError) {
            setDialogError(reasonError instanceof Error ? reasonError.message : '渠道操作失败，请稍后重试');
        }
    }
    async function handleToggle(channel) {
        setFeedback(channel.enabled ? `正在停用${channel.name}` : `正在启用${channel.name}`);
        try {
            const nextDashboard = await toggleCustomChannelStatus(channel.id, !channel.enabled, query);
            setDashboard(nextDashboard);
            setFeedback(channel.enabled ? `${channel.name}已停用` : `${channel.name}已启用`);
        }
        catch (reasonError) {
            setError(reasonError instanceof Error ? reasonError.message : '自定义渠道状态更新失败，请稍后重试');
        }
    }
    async function handleDeleteConfirm() {
        if (!pendingDelete)
            return;
        setFeedback('正在删除自定义渠道');
        try {
            const nextDashboard = await deleteCustomChannel(pendingDelete.id, query);
            setDashboard(nextDashboard);
            setPendingDelete(null);
            setFeedback('自定义渠道已删除');
        }
        catch (reasonError) {
            setError(reasonError instanceof Error ? reasonError.message : '删除自定义渠道失败，请稍后重试');
        }
    }
    return (_jsxs(_Fragment, { children: [_jsx("div", { className: "sr-only-heading", "aria-label": "\u81EA\u5B9A\u4E49\u6E20\u9053\u6570\u636E\u670D\u52A1", children: (dashboard?.audit ?? []).join(';') }), _jsxs("div", { className: "custom-channel-page", "data-provider": dashboard?.provider ?? query.provider, "data-response-state": dashboard?.state ?? query.mockState, children: [_jsx("div", { className: "sr-only-heading", children: "\u81EA\u5B9A\u4E49\u6E20\u9053" }), _jsx("div", { className: "custom-channel-tip", children: "\u7CFB\u7EDF\u9ED8\u8BA4\u6E20\u9053\u4E0D\u652F\u6301\u7F16\u8F91\u548C\u5220\u9664\u3002\u70B9\u51FB\u201C\u7F16\u8F91\u201D\u6309\u94AE\uFF0C\u53EF\u505C\u7528\u6216\u542F\u7528\u6E20\u9053\uFF0C\u505C\u7528\u540E\u4E0D\u80FD\u5728\u5217\u8868\u9009\u9879\u770B\u5230\u3002" }), _jsx("div", { className: "custom-channel-feedback", role: "status", "aria-label": "\u81EA\u5B9A\u4E49\u6E20\u9053\u64CD\u4F5C\u53CD\u9988", children: feedback }), error ? (_jsxs("section", { className: "custom-channel-error", role: "alert", "aria-label": "\u81EA\u5B9A\u4E49\u6E20\u9053\u6570\u636E\u9519\u8BEF", children: [_jsx("strong", { children: "\u81EA\u5B9A\u4E49\u6E20\u9053\u6570\u636E\u9519\u8BEF" }), _jsx("span", { children: error }), _jsx("button", { type: "button", onClick: () => void loadDashboard('retry'), children: "\u91CD\u8BD5" })] })) : null, _jsxs("section", { className: "custom-channel-section", children: [_jsxs("header", { className: "custom-channel-title", children: [_jsx("h2", { children: "\u7CFB\u7EDF\u9ED8\u8BA4\u6E20\u9053" }), _jsx("button", { type: "button", className: "custom-channel-primary", disabled: isLoading || isSavingSystem, onClick: () => (editingSystem ? void handleSystemSave() : setEditingSystem(true)), children: editingSystem ? '保 存' : '编 辑' })] }), _jsx("div", { className: "custom-channel-grid", "aria-label": "\u7CFB\u7EDF\u9ED8\u8BA4\u6E20\u9053", children: (dashboard?.systemChannels ?? []).map((channel) => (_jsxs("label", { className: `custom-channel-card${!systemDraft[channel.id] ? ' is-disabled' : ''}`, style: { '--channel-color': channel.color }, children: [editingSystem ? (_jsx("input", { type: "checkbox", checked: systemDraft[channel.id] ?? false, "aria-label": `${channel.name}启用`, onChange: (event) => {
                                                const checked = event.target.checked;
                                                setSystemDraft((current) => ({ ...current, [channel.id]: checked }));
                                            } })) : null, _jsx("span", { children: channel.name })] }, channel.id))) })] }), _jsxs("section", { className: "custom-channel-section custom-channel-section--custom", children: [_jsxs("header", { className: "custom-channel-title", children: [_jsx("h2", { children: "\u81EA\u5B9A\u4E49\u6E20\u9053" }), _jsx("button", { type: "button", className: "custom-channel-secondary", disabled: isLoading, onClick: openCreateDialog, children: "\u6DFB\u52A0\u6E20\u9053" })] }), dashboard && dashboard.customChannels.length > 0 ? (_jsx("div", { className: "custom-channel-custom-list", role: "region", "aria-label": "\u81EA\u5B9A\u4E49\u6E20\u9053\u5217\u8868", children: dashboard.customChannels.map((channel) => (_jsxs("article", { className: "custom-channel-custom-card", children: [_jsxs("div", { className: "custom-channel-custom-card__header", children: [_jsxs("div", { className: "custom-channel-custom-card__title", children: [_jsx("span", { className: "custom-channel-dot", style: { backgroundColor: channel.color } }), _jsx("strong", { children: channel.name }), _jsx("em", { children: channel.enabled ? '启用中' : '已停用' })] }), _jsx("span", { children: channel.code })] }), _jsx("p", { children: channel.note }), _jsxs("dl", { className: "custom-channel-meta", children: [_jsxs("div", { children: [_jsx("dt", { children: "\u6700\u8FD1\u66F4\u65B0" }), _jsx("dd", { children: channel.updatedAt })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u64CD\u4F5C\u4EBA" }), _jsx("dd", { children: channel.operator })] })] }), _jsxs("div", { className: "custom-channel-actions", children: [_jsx("button", { type: "button", "aria-label": `编辑 自定义渠道 ${channel.name}`, onClick: () => openEditDialog(channel), children: "\u7F16\u8F91" }), _jsx("button", { type: "button", "aria-label": `${channel.enabled ? '停用' : '启用'} 自定义渠道 ${channel.name}`, onClick: () => void handleToggle(channel), children: channel.enabled ? '停用' : '启用' }), _jsx("button", { type: "button", "aria-label": `删除 自定义渠道 ${channel.name}`, onClick: () => setPendingDelete(channel), children: "\u5220\u9664" })] })] }, channel.id))) })) : (_jsxs("div", { className: "custom-channel-empty", "aria-label": "\u81EA\u5B9A\u4E49\u6E20\u9053\u7A7A\u6001", children: [_jsx("strong", { children: "\u6682\u65E0\u81EA\u5B9A\u4E49\u6E20\u9053" }), _jsx("span", { children: "\u53EF\u901A\u8FC7\u201C\u6DFB\u52A0\u6E20\u9053\u201D\u8865\u5145\u7EBF\u4E0B\u5408\u4F5C\u3001\u793E\u7FA4\u56E2\u8D2D\u6216\u5305\u79DF\u4E1A\u52A1\u6765\u6E90\u3002" })] }))] }), dialog ? (_jsx("div", { className: "custom-channel-modal-backdrop", children: _jsxs("div", { className: "custom-channel-modal", role: "dialog", "aria-modal": "true", "aria-label": dialog.mode === 'create' ? '添加渠道' : '编辑渠道', children: [_jsxs("header", { children: [_jsx("h2", { children: dialog.mode === 'create' ? '添加渠道' : '编辑渠道' }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED", onClick: () => setDialog(null) })] }), _jsxs("label", { children: [_jsx("span", { children: "\u6E20\u9053\u540D\u79F0" }), _jsx("input", { "aria-label": "\u6E20\u9053\u540D\u79F0", placeholder: "\u8BF7\u8F93\u5165\u6E20\u9053\u540D\u79F0", value: dialog.value.name, onChange: (event) => updateDialogValue({ name: event.target.value }) })] }), _jsxs("label", { className: "custom-channel-color-field", children: [_jsx("span", { children: "\u6E20\u9053\u989C\u8272" }), _jsxs("div", { children: [_jsx("button", { type: "button", className: "custom-channel-color-picker", "aria-label": "\u6E20\u9053\u989C\u8272", onClick: () => setIsColorPickerOpen((value) => !value), children: dialog.value.colorName || '请选择渠道颜色' }), isColorPickerOpen ? (_jsx("div", { className: "custom-channel-color-panel", children: getColorOptions().map((option) => (_jsxs("button", { type: "button", "aria-label": `选择渠道颜色 ${option.label}`, className: dialog.value.color === option.value ? 'is-selected' : '', onClick: () => {
                                                            updateDialogValue({ color: option.value, colorName: option.label });
                                                            setIsColorPickerOpen(false);
                                                        }, children: [_jsx("span", { style: { backgroundColor: option.value } }), option.label] }, option.value))) })) : null] })] }), dialogError ? _jsx("div", { className: "custom-channel-dialog-error", children: dialogError }) : null, _jsxs("footer", { children: [_jsx("button", { type: "button", onClick: () => setDialog(null), children: "\u53D6 \u6D88" }), _jsx("button", { type: "button", className: "custom-channel-primary", onClick: () => void handleDialogConfirm(), children: "\u786E \u5B9A" })] })] }) })) : null, pendingDelete ? (_jsx("div", { className: "custom-channel-modal-backdrop", children: _jsxs("div", { className: "custom-channel-modal custom-channel-modal--confirm", role: "dialog", "aria-modal": "true", "aria-label": "\u5220\u9664\u6E20\u9053\u786E\u8BA4", children: [_jsxs("header", { children: [_jsx("h2", { children: "\u5220\u9664\u6E20\u9053\u786E\u8BA4" }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED", onClick: () => setPendingDelete(null) })] }), _jsxs("div", { className: "custom-channel-confirm-copy", children: [_jsx("strong", { children: pendingDelete.name }), _jsx("span", { children: "\u5220\u9664\u540E\u4E0D\u53EF\u6062\u590D\uFF0C\u8BF7\u786E\u8BA4\u5F53\u524D\u6E20\u9053\u5DF2\u4E0D\u518D\u53C2\u4E0E\u524D\u53F0\u7B5B\u9009\u4E0E\u7EDF\u8BA1\u3002" })] }), _jsxs("footer", { children: [_jsx("button", { type: "button", onClick: () => setPendingDelete(null), children: "\u53D6\u6D88\u5220\u9664" }), _jsx("button", { type: "button", className: "custom-channel-primary", onClick: () => void handleDeleteConfirm(), children: "\u786E\u8BA4\u5220\u9664" })] })] }) })) : null] })] }));
}
