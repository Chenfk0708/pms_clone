import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createDefaultSmartHotelSettingsButtons, createDefaultSmartHotelSettingsQuery, fetchSmartHotelSettingsDashboard, publishSmartHotelSettingsShare, saveSmartHotelSettingsDecorate, uploadSmartHotelSettingsButtonIcon, } from '../services/smartHotelSettings';
import './SmartHotelSettingsPage.css';
export function SmartHotelSettingsPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const [dashboard, setDashboard] = useState(null);
    const [activeTab, setActiveTab] = useState('decorate');
    const [buttons, setButtons] = useState([]);
    const [shareDraft, setShareDraft] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSavingDecorate, setIsSavingDecorate] = useState(false);
    const [isPublishingShare, setIsPublishingShare] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [toastMessage, setToastMessage] = useState('');
    const [decorateSavedHint, setDecorateSavedHint] = useState('');
    const [hasDecorateChanges, setHasDecorateChanges] = useState(false);
    const [hasShareChanges, setHasShareChanges] = useState(false);
    const [sharePreviewTitle, setSharePreviewTitle] = useState('您好，欢迎于[入住日期]入住');
    const [emptyResolved, setEmptyResolved] = useState(false);
    const [previewDialog, setPreviewDialog] = useState(null);
    useEffect(() => {
        if (!toastMessage)
            return;
        const timer = window.setTimeout(() => setToastMessage(''), 1600);
        return () => window.clearTimeout(timer);
    }, [toastMessage]);
    useEffect(() => {
        const controller = new AbortController();
        const query = createDefaultSmartHotelSettingsQuery(new URLSearchParams(location.search));
        const loadDashboard = async () => {
            setIsLoading(true);
            setErrorMessage('');
            setToastMessage('');
            setDecorateSavedHint('');
            setHasDecorateChanges(false);
            setHasShareChanges(false);
            setSharePreviewTitle('您好，欢迎于[入住日期]入住');
            setEmptyResolved(false);
            try {
                const result = await fetchSmartHotelSettingsDashboard(query, controller.signal);
                setDashboard(result);
                setButtons(result.buttons);
                setShareDraft(result.shareDraft);
                setSharePreviewTitle(result.shareDraft.titleTemplate);
            }
            catch (error) {
                if (error instanceof DOMException && error.name === 'AbortError')
                    return;
                setDashboard(null);
                setButtons([]);
                setShareDraft(null);
                setErrorMessage(error instanceof Error ? error.message : '智住小程序数据加载失败，请稍后重试');
            }
            finally {
                if (!controller.signal.aborted) {
                    setIsLoading(false);
                }
            }
        };
        void loadDashboard();
        return () => controller.abort();
    }, [location.search]);
    const diagnosticsState = dashboard?.state ?? createDefaultSmartHotelSettingsQuery(new URLSearchParams(location.search)).mockState;
    const diagnosticsProvider = dashboard?.provider ?? 'mock';
    const diagnosticsRequest = dashboard?.request
        ? JSON.stringify(dashboard.request)
        : JSON.stringify({
            endpoint: '/smartHotelSettings/dashboard/get',
            mockState: diagnosticsState,
        });
    const isEmptyState = Boolean(dashboard?.emptyState) && !emptyResolved && !errorMessage;
    const previewButtons = buttons.length > 0 ? buttons : createDefaultSmartHotelSettingsButtons();
    const currentShareDraft = shareDraft ?? dashboard?.shareDraft ?? null;
    const sharePreviewImageLabel = useMemo(() => {
        if (!currentShareDraft)
            return '默认固定海报';
        switch (currentShareDraft.imageMode) {
            case 'room-cover':
                return '房源首图';
            case 'custom':
                return currentShareDraft.customPosterName || '自定义图片';
            default:
                return '默认固定海报';
        }
    }, [currentShareDraft]);
    function showToast(message) {
        setToastMessage(message);
    }
    function markDecorateChanged(nextButtons, toast) {
        setButtons(nextButtons);
        setHasDecorateChanges(true);
        setDecorateSavedHint('');
        if (toast)
            showToast(toast);
    }
    function updateButton(id, field, value) {
        markDecorateChanged(buttons.map((item) => (item.id === id ? { ...item, [field]: value } : item)), field === 'name' ? '已更新按钮名称' : '已更新弹框文案');
    }
    function addButton() {
        markDecorateChanged([
            ...buttons,
            {
                id: `custom-${buttons.length + 1}`,
                name: '新按钮',
                content: '请补充该按钮对应的业务说明。',
                iconSeed: '新增',
                previewAction: {
                    kind: 'dialog',
                    title: '自定义按钮',
                    description: '请补充该按钮的业务跳转或弹窗文案。',
                },
            },
        ], '已新增一个底部按钮');
    }
    function removeButton(id) {
        if (buttons.length <= 1) {
            showToast('至少保留一个底部按钮');
            return;
        }
        markDecorateChanged(buttons.filter((item) => item.id !== id), '已删除一个底部按钮');
    }
    async function handleUpload(button) {
        const result = await uploadSmartHotelSettingsButtonIcon(button);
        showToast(result.notice);
        setHasDecorateChanges(true);
        setDecorateSavedHint('');
    }
    async function handleSaveDecorate() {
        if (!hasDecorateChanges || isSavingDecorate)
            return;
        setIsSavingDecorate(true);
        try {
            const result = await saveSmartHotelSettingsDecorate(buttons);
            showToast(result.message);
            setDecorateSavedHint('左侧预览已同步最新按钮配置');
            setHasDecorateChanges(false);
        }
        finally {
            setIsSavingDecorate(false);
        }
    }
    function restoreDefaultButtons() {
        setButtons(createDefaultSmartHotelSettingsButtons());
        setEmptyResolved(true);
        setHasDecorateChanges(true);
        showToast('已恢复默认按钮');
    }
    function openPreviewAction(button) {
        const action = button.previewAction;
        if (action.kind === 'route') {
            navigate(action.path);
            return;
        }
        setPreviewDialog({
            title: action.title,
            description: action.description,
            primaryLabel: action.primaryLabel,
            primaryPath: action.primaryPath,
        });
    }
    function insertShareToken(token) {
        if (!currentShareDraft)
            return;
        const nextTitle = currentShareDraft.titleTemplate.includes(token.placeholder)
            ? currentShareDraft.titleTemplate
            : `${currentShareDraft.titleTemplate}${token.placeholder}`;
        setShareDraft({
            ...currentShareDraft,
            titleTemplate: nextTitle,
        });
        setHasShareChanges(true);
        showToast(`已插入变量“${token.label}”`);
    }
    function updateShareTitle(value) {
        if (!currentShareDraft)
            return;
        setShareDraft({
            ...currentShareDraft,
            titleTemplate: value,
        });
        setHasShareChanges(true);
    }
    function updateShareImageMode(mode) {
        if (!currentShareDraft)
            return;
        setShareDraft({
            ...currentShareDraft,
            imageMode: mode,
        });
        setHasShareChanges(true);
        showToast('已更新小程序卡片图片方案');
    }
    function uploadSharePoster() {
        if (!currentShareDraft)
            return;
        setShareDraft({
            ...currentShareDraft,
            imageMode: 'custom',
            customPosterName: '酒店大堂自定义分享海报.png',
        });
        setHasShareChanges(true);
        showToast('已上传自定义分享图片');
    }
    async function handlePublishShare() {
        if (!currentShareDraft || isPublishingShare)
            return;
        setIsPublishingShare(true);
        try {
            const result = await publishSmartHotelSettingsShare(currentShareDraft);
            showToast(result.message);
            setHasShareChanges(false);
            setSharePreviewTitle(currentShareDraft.titleTemplate || '您好，欢迎于[入住日期]入住');
        }
        finally {
            setIsPublishingShare(false);
        }
    }
    function retryLoad() {
        navigate('/smartHotel/smartSettings', { replace: true });
    }
    return (_jsxs("div", { className: "smart-settings-page", children: [_jsx("div", { className: "smart-settings-diagnostics", "data-testid": "smart-hotel-settings-service-contract", "data-provider": diagnosticsProvider, "data-state": diagnosticsState, "data-request": diagnosticsRequest }), toastMessage ? (_jsx("div", { className: "smart-settings-toast", role: "status", "aria-label": "\u667A\u4F4F\u5C0F\u7A0B\u5E8F\u64CD\u4F5C\u53CD\u9988", children: toastMessage })) : null, _jsxs("section", { className: "smart-settings-surface", "aria-label": "\u667A\u4F4F\u5C0F\u7A0B\u5E8F\u8BBE\u7F6E", children: [_jsxs("div", { className: "smart-settings-tabs", role: "tablist", "aria-label": "\u667A\u4F4F\u5C0F\u7A0B\u5E8F\u9875\u7B7E", children: [_jsx("button", { type: "button", role: "tab", "aria-selected": activeTab === 'decorate', className: activeTab === 'decorate' ? 'is-active' : '', onClick: () => setActiveTab('decorate'), children: "\u88C5\u4FEE" }), _jsx("button", { type: "button", role: "tab", "aria-selected": activeTab === 'share', className: activeTab === 'share' ? 'is-active' : '', onClick: () => setActiveTab('share'), children: "\u5206\u4EAB" })] }), isLoading ? _jsx("div", { className: "smart-settings-loading", children: "\u6B63\u5728\u540C\u6B65\u667A\u4F4F\u5C0F\u7A0B\u5E8F\u6570\u636E..." }) : null, errorMessage ? (_jsxs("section", { className: "smart-settings-error", role: "alert", "aria-label": "\u667A\u4F4F\u5C0F\u7A0B\u5E8F\u52A0\u8F7D\u5931\u8D25", children: [_jsx("strong", { children: "\u667A\u4F4F\u5C0F\u7A0B\u5E8F\u52A0\u8F7D\u5931\u8D25" }), _jsx("p", { children: errorMessage }), _jsx("button", { type: "button", onClick: retryLoad, children: "\u91CD\u65B0\u52A0\u8F7D" })] })) : null, !isLoading && !errorMessage && activeTab === 'decorate' ? (_jsxs("section", { className: "smart-settings-card", children: [_jsxs("header", { className: "smart-settings-card__head", children: [_jsxs("div", { children: [_jsx("h2", { children: "\u64CD\u4F5C\u6309\u94AE\u8BBE\u7F6E" }), _jsx("p", { children: "\u652F\u6301\u65B0\u589E\u5E95\u90E8\u64CD\u4F5C\u6309\u94AE\uFF0C\u53EF\u81EA\u5B9A\u4E49\u6309\u94AE\u540D\u79F0\u548C\u89E6\u53D1\u540E\u7684\u8BF4\u660E\u5185\u5BB9\u3002" })] }), _jsx("button", { type: "button", onClick: addButton, children: "\u6DFB\u52A0\u6309\u94AE" })] }), isEmptyState && dashboard?.emptyState ? (_jsxs("section", { className: "smart-settings-empty", "aria-label": "\u667A\u4F4F\u5C0F\u7A0B\u5E8F\u7A7A\u72B6\u6001", children: [_jsx("strong", { children: dashboard.emptyState.title }), _jsx("p", { children: dashboard.emptyState.description }), _jsx("button", { type: "button", onClick: restoreDefaultButtons, children: dashboard.emptyState.actionLabel })] })) : (_jsxs("div", { className: "smart-settings-grid", children: [_jsx("section", { className: "smart-settings-preview", "aria-label": "\u667A\u4F4F\u5C0F\u7A0B\u5E8F\u9884\u89C8", children: _jsxs("div", { className: "smart-settings-phone", children: [_jsxs("div", { className: "smart-settings-phone__top", children: [_jsx("strong", { children: "\u4F4F\u5BA2\u670D\u52A1" }), _jsx("span", { children: "\u4F53\u9A8C\u7248" })] }), _jsxs("div", { className: "smart-settings-phone__body", children: [_jsx("h3", { children: "\u6B22\u8FCE\u4F7F\u7528\u667A\u4F4F\u5C0F\u7A0B\u5E8F" }), _jsx("p", { children: "\u4F4F\u5BA2\u626B\u7801\u540E\u53EF\u5FEB\u901F\u5B8C\u6210\u767B\u8BB0\u3001\u67E5\u770B\u6307\u5F15\u548C\u7EED\u4F4F\u7533\u8BF7\u3002" }), _jsx("div", { className: "smart-settings-preview__buttons", children: previewButtons.map((button) => (_jsxs("button", { type: "button", onClick: () => openPreviewAction(button), children: [_jsx("span", { children: button.iconSeed }), _jsx("strong", { children: button.name })] }, button.id))) })] }), _jsxs("div", { className: "smart-settings-phone__footer", children: [_jsx("button", { type: "button", onClick: () => navigate(dashboard?.routes.selfCheckin ?? '/smartHotel/smartHome'), children: "\u81EA\u52A9\u5165\u4F4F" }), _jsx("button", { type: "button", onClick: () => navigate(dashboard?.routes.hardwareMall ?? '/smartHotel/smartHardware/mall'), children: "\u667A\u80FD\u786C\u4EF6\u5546\u57CE" })] })] }) }), _jsx("div", { className: "smart-settings-form", children: buttons.map((button) => (_jsxs("article", { className: "smart-settings-row", children: [_jsx("button", { type: "button", className: "smart-settings-row__drag", "aria-label": "\u62D6\u52A8\u6392\u5E8F", children: "\u2261" }), _jsxs("div", { className: "smart-settings-row__upload", children: [_jsx("span", { children: "\u6309\u94AE\u56FE\u6807" }), _jsx("strong", { children: button.name }), _jsx("button", { type: "button", onClick: () => void handleUpload(button), children: "\u4E0A\u4F20\u56FE\u7247" })] }), _jsxs("label", { className: "smart-settings-field", children: [_jsx("span", { children: "\u6309\u94AE\u540D\u79F0" }), _jsx("input", { "aria-label": "\u6309\u94AE\u540D\u79F0", maxLength: 5, value: button.name, placeholder: "\u8BF7\u8F93\u5165\u6309\u94AE\u540D\u79F0", onChange: (event) => updateButton(button.id, 'name', event.target.value) })] }), _jsxs("label", { className: "smart-settings-field", children: [_jsx("span", { children: "\u5F39\u6846\u6587\u6848" }), _jsx("input", { "aria-label": "\u5F39\u6846\u6587\u6848", maxLength: 256, value: button.content, placeholder: "\u8BF7\u8F93\u5165\u5F39\u6846\u6587\u6848", onChange: (event) => updateButton(button.id, 'content', event.target.value) })] }), _jsx("button", { type: "button", className: "smart-settings-row__delete", "aria-label": "\u5220\u9664\u6309\u94AE", onClick: () => removeButton(button.id), children: "\u00D7" })] }, button.id))) })] })), _jsxs("footer", { className: "smart-settings-footer", children: [_jsx("div", { children: decorateSavedHint ? _jsx("p", { children: decorateSavedHint }) : _jsx("span", { children: "\u4FDD\u5B58\u540E\u5C06\u540C\u6B65\u5230\u5DE6\u4FA7\u4F4F\u5BA2\u9884\u89C8\u548C\u5206\u4EAB\u5361\u7247\u3002" }) }), _jsx("button", { type: "button", className: "is-primary", onClick: () => void handleSaveDecorate(), disabled: !hasDecorateChanges || isSavingDecorate, children: "\u4FDD\u5B58" })] })] })) : null, !isLoading && !errorMessage && activeTab === 'share' ? (_jsxs("section", { className: "smart-settings-share-board", children: [_jsxs("div", { className: "smart-settings-share-shell", children: [_jsxs("section", { className: "smart-settings-share-config", children: [_jsxs("div", { className: "smart-settings-share-row", children: [_jsx("label", { htmlFor: "share-title-input", children: "\u5C0F\u7A0B\u5E8F\u5361\u7247\u6807\u9898" }), _jsxs("div", { className: "smart-settings-share-input-wrap", children: [_jsx("input", { id: "share-title-input", "aria-label": "\u5C0F\u7A0B\u5E8F\u5361\u7247\u6807\u9898", value: currentShareDraft?.titleTemplate ?? '', onChange: (event) => updateShareTitle(event.target.value) }), _jsx("div", { className: "smart-settings-share-tokens", "aria-label": "\u5206\u4EAB\u53D8\u91CF\u6309\u94AE", children: currentShareDraft?.tokens.map((token) => (_jsx("button", { type: "button", onClick: () => insertShareToken(token), children: token.label }, token.id))) })] })] }), _jsxs("div", { className: "smart-settings-share-row smart-settings-share-row--media", children: [_jsx("label", { children: "\u5C0F\u7A0B\u5E8F\u5361\u7247\u56FE\u7247" }), _jsxs("div", { className: "smart-settings-share-radio-stack", children: [_jsxs("label", { className: "smart-settings-radio", children: [_jsx("input", { type: "radio", name: "share-image-mode", checked: currentShareDraft?.imageMode === 'default', onChange: () => updateShareImageMode('default') }), _jsx("span", { children: "\u9ED8\u8BA4\u56FA\u5B9A\u6D77\u62A5" })] }), _jsxs("label", { className: "smart-settings-radio", children: [_jsx("input", { type: "radio", name: "share-image-mode", checked: currentShareDraft?.imageMode === 'room-cover', onChange: () => updateShareImageMode('room-cover') }), _jsx("span", { children: "\u623F\u6E90\u9996\u56FE" })] }), _jsxs("label", { className: "smart-settings-radio", children: [_jsx("input", { type: "radio", name: "share-image-mode", checked: currentShareDraft?.imageMode === 'custom', onChange: () => updateShareImageMode('custom') }), _jsx("span", { children: "\u81EA\u5B9A\u4E49" })] }), currentShareDraft?.imageMode === 'custom' ? (_jsx("button", { type: "button", className: "smart-settings-share-upload", onClick: uploadSharePoster, children: "\u4E0A\u4F20\u56FE\u7247" })) : null] })] })] }), _jsx("aside", { className: "smart-settings-share-preview", children: _jsx("div", { className: "smart-settings-share-phone", children: _jsxs("div", { className: "smart-settings-share-phone__frame", children: [_jsx("div", { className: "smart-settings-share-phone__header", children: _jsx("span", {}) }), _jsxs("div", { className: "smart-settings-share-phone__card", children: [_jsx("p", { children: sharePreviewTitle }), _jsxs("div", { className: "smart-settings-share-phone__poster", children: [_jsx("div", { className: "smart-settings-share-phone__tag", children: sharePreviewImageLabel }), _jsxs("div", { className: "smart-settings-share-phone__poster-art", children: [_jsx("span", { className: "is-panel" }), _jsx("span", { className: "is-desk" }), _jsx("span", { className: "is-guest" }), _jsx("span", { className: "is-key" })] })] })] })] }) }) })] }), _jsx("footer", { className: "smart-settings-share-footer", children: _jsx("button", { type: "button", className: "is-primary", onClick: () => void handlePublishShare(), disabled: isPublishingShare || !hasShareChanges, children: "\u4FDD\u5B58\u5E76\u53D1\u5E03" }) })] })) : null] }), previewDialog ? (_jsx(DialogFrame, { title: previewDialog.title, closeLabel: `关闭${previewDialog.title}`, onClose: () => setPreviewDialog(null), footer: previewDialog.primaryLabel && previewDialog.primaryPath ? (_jsx("button", { type: "button", className: "is-primary", onClick: () => {
                        if (!previewDialog.primaryPath)
                            return;
                        const nextPath = previewDialog.primaryPath;
                        setPreviewDialog(null);
                        navigate(nextPath);
                    }, children: previewDialog.primaryLabel })) : null, children: _jsx("p", { children: previewDialog.description }) })) : null] }));
}
function DialogFrame({ title, closeLabel, children, footer, onClose, }) {
    return (_jsx("div", { className: "smart-settings-modal-backdrop", children: _jsxs("section", { className: "smart-settings-modal", role: "dialog", "aria-modal": "true", "aria-label": title, children: [_jsxs("header", { children: [_jsx("h2", { children: title }), _jsx("button", { type: "button", "aria-label": closeLabel, onClick: onClose, children: "\u00D7" })] }), _jsx("div", { className: "smart-settings-modal__body", children: children }), footer ? _jsx("footer", { children: footer }) : null] }) }));
}
