import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useId, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createDefaultSmartHotelGlobalSettingFilters, fetchSmartHotelGlobalSettingDashboard, } from '../services/smartHotelGlobalSetting';
import './SmartHotelGlobalSettingPage.css';
const guideRows = [];
const wifiRows = [];
function createEmptyGuideDraft() {
    return {
        guideName: '',
        routeGuide: '',
        processGuide: '',
        noticeGuide: '',
        routeImages: [],
        processImages: [],
        noticeImages: [],
    };
}
function createEmptyWifiDraft() {
    return {
        wifiName: '',
        wifiPassword: '',
    };
}
export function SmartHotelGlobalSettingPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const [dashboard, setDashboard] = useState(null);
    const [activeTab, setActiveTab] = useState('rules');
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [dialog, setDialog] = useState(null);
    const [guideRuleChecks, setGuideRuleChecks] = useState({ identity: false, deposit: false });
    const [wifiEnabled, setWifiEnabled] = useState(false);
    const [saveNotice, setSaveNotice] = useState('');
    const [guideKeyword, setGuideKeyword] = useState('');
    const [wifiKeyword, setWifiKeyword] = useState('');
    const [guideCreateDraft, setGuideCreateDraft] = useState(() => createEmptyGuideDraft());
    const [wifiCreateDraft, setWifiCreateDraft] = useState(() => createEmptyWifiDraft());
    useEffect(() => {
        const controller = new AbortController();
        const filters = createDefaultSmartHotelGlobalSettingFilters(new URLSearchParams(location.search));
        setIsLoading(true);
        setErrorMessage('');
        setDialog(null);
        setGuideRuleChecks({ identity: false, deposit: false });
        setWifiEnabled(false);
        setSaveNotice('');
        setGuideKeyword('');
        setWifiKeyword('');
        setGuideCreateDraft(createEmptyGuideDraft());
        setWifiCreateDraft(createEmptyWifiDraft());
        void fetchSmartHotelGlobalSettingDashboard(filters, controller.signal)
            .then((result) => {
            setDashboard(result);
        })
            .catch((error) => {
            if (error instanceof DOMException && error.name === 'AbortError')
                return;
            setDashboard(null);
            setErrorMessage(error instanceof Error ? error.message : '全局设置数据加载失败，请稍后重试');
        })
            .finally(() => {
            if (!controller.signal.aborted) {
                setIsLoading(false);
            }
        });
        return () => controller.abort();
    }, [location.search]);
    useEffect(() => {
        if (!saveNotice)
            return;
        const timer = window.setTimeout(() => setSaveNotice(''), 1600);
        return () => window.clearTimeout(timer);
    }, [saveNotice]);
    useEffect(() => {
        return () => {
            revokeDraftUrls(guideCreateDraft);
        };
    }, [guideCreateDraft]);
    const fallbackState = createDefaultSmartHotelGlobalSettingFilters(new URLSearchParams(location.search)).mockState;
    const diagnosticsState = dashboard?.state ?? fallbackState;
    const diagnosticsProvider = dashboard?.provider ?? 'mock';
    const diagnosticsRequest = JSON.stringify(dashboard?.requestBody ?? { campId: '', endpoints: [] });
    const emptyState = !errorMessage ? dashboard?.emptyState : undefined;
    const routes = dashboard?.routes ?? {
        smartSettings: '/smartHotel/smartSettings',
        roomTypeInfo: '/setting/roomTypeInfo',
        paymentSetting: '/setting/paymentSetting',
        smsSetting: '/setting/balanceAndTemplate',
    };
    const canSubmitGuide = useMemo(() => Boolean(guideCreateDraft.guideName.trim() &&
        guideCreateDraft.routeGuide.trim() &&
        guideCreateDraft.processGuide.trim() &&
        guideCreateDraft.noticeGuide.trim()), [guideCreateDraft]);
    const canSubmitWifi = useMemo(() => Boolean(wifiCreateDraft.wifiName.trim() && wifiCreateDraft.wifiPassword.trim()), [wifiCreateDraft]);
    function handleRetry() {
        navigate('/smartHotel/checkInGuide', { replace: true });
    }
    function handleGuideRuleToggle(key) {
        setGuideRuleChecks((current) => ({ ...current, [key]: !current[key] }));
        setSaveNotice('保存成功');
    }
    function handleWifiToggle() {
        setWifiEnabled((current) => !current);
        setSaveNotice('保存成功');
    }
    function handleGuideSearch() {
        setGuideKeyword((current) => current.trimStart());
    }
    function handleGuideReset() {
        setGuideKeyword('');
    }
    function handleWifiSearch() {
        setWifiKeyword((current) => current.trimStart());
    }
    function handleWifiReset() {
        setWifiKeyword('');
    }
    function openGuideCreateDialog() {
        revokeDraftUrls(guideCreateDraft);
        setGuideCreateDraft(createEmptyGuideDraft());
        setDialog('guide-create');
    }
    function closeGuideCreateDialog() {
        revokeDraftUrls(guideCreateDraft);
        setGuideCreateDraft(createEmptyGuideDraft());
        setDialog(null);
    }
    function openWifiCreateDialog() {
        setWifiCreateDraft(createEmptyWifiDraft());
        setDialog('wifi-create');
    }
    function closeWifiCreateDialog() {
        setWifiCreateDraft(createEmptyWifiDraft());
        setDialog(null);
    }
    function updateGuideDraft(key, value) {
        setGuideCreateDraft((current) => ({ ...current, [key]: value }));
    }
    function updateWifiDraft(key, value) {
        setWifiCreateDraft((current) => ({ ...current, [key]: value }));
    }
    function handleGuideImageUpload(key, event) {
        const files = Array.from(event.target.files ?? []);
        if (!files.length)
            return;
        setGuideCreateDraft((current) => {
            const existing = current[key];
            const nextItems = files.slice(0, Math.max(0, 15 - existing.length)).map((file, index) => ({
                id: `${key}-${Date.now()}-${index}`,
                name: file.name,
                url: URL.createObjectURL(file),
            }));
            return {
                ...current,
                [key]: [...existing, ...nextItems].slice(0, 15),
            };
        });
        event.target.value = '';
    }
    function handleGuideCreateSubmit() {
        if (!canSubmitGuide)
            return;
        closeGuideCreateDialog();
        setSaveNotice('保存成功');
    }
    function handleWifiCreateSubmit() {
        if (!canSubmitWifi)
            return;
        closeWifiCreateDialog();
        setSaveNotice('保存成功');
    }
    return (_jsxs("div", { className: "smart-global-page", children: [_jsx("div", { id: "smart-hotel-global-setting-diagnostics", "data-provider": diagnosticsProvider, "data-state": diagnosticsState, "data-request": diagnosticsRequest }), _jsx("div", { className: "smart-global-version", children: "\u7248\u672C\u53F7\uFF1Av4.10.7" }), saveNotice ? (_jsx("div", { className: "smart-global-toast", role: "status", "aria-label": "\u4FDD\u5B58\u6210\u529F\u63D0\u793A", children: saveNotice })) : null, _jsxs("section", { className: "smart-global-shell", "aria-label": "\u5168\u5C40\u8BBE\u7F6E", children: [_jsxs("div", { className: "smart-global-tabs", role: "tablist", "aria-label": "\u5168\u5C40\u8BBE\u7F6E\u9875\u7B7E", children: [_jsx(TabButton, { active: activeTab === 'rules', onClick: () => setActiveTab('rules'), children: "\u5165\u4F4F\u89C4\u5219" }), _jsx(TabButton, { active: activeTab === 'guide', onClick: () => setActiveTab('guide'), children: "\u5165\u4F4F\u6307\u5F15" }), _jsx(TabButton, { active: activeTab === 'wifi', onClick: () => setActiveTab('wifi'), children: "WIFI\u4E0A\u7F51" })] }), isLoading ? _jsx("section", { className: "smart-global-state", children: "\u5168\u5C40\u8BBE\u7F6E\u6570\u636E\u52A0\u8F7D\u4E2D..." }) : null, !isLoading && errorMessage ? (_jsxs("section", { className: "smart-global-state smart-global-state--error", role: "alert", children: [_jsx("strong", { children: "\u5168\u5C40\u8BBE\u7F6E\u6570\u636E\u52A0\u8F7D\u5931\u8D25" }), _jsx("span", { children: errorMessage }), _jsx("button", { type: "button", onClick: handleRetry, children: "\u91CD\u65B0\u52A0\u8F7D" })] })) : null, !isLoading && !errorMessage && emptyState ? (_jsxs("section", { className: "smart-global-state", children: [_jsx("strong", { children: emptyState.title }), _jsx("span", { children: emptyState.description }), _jsx("button", { type: "button", onClick: () => navigate(emptyState.actionPath), children: emptyState.actionLabel })] })) : null, !isLoading && !errorMessage && !emptyState ? (_jsxs(_Fragment, { children: [activeTab === 'rules' ? (_jsx(RulesPanel, { roomTypeSummary: decodeMaybeGarbled(dashboard?.roomTypeSummary, '4 个房型已同步门锁时效策略'), smsTemplateSummary: decodeMaybeGarbled(dashboard?.smsTemplateSummary, '短信模板 15 条'), syncLabel: decodeMaybeGarbled(dashboard?.syncLabel, '最近同步：2026-05-19 16:30'), paymentMethods: (dashboard?.paymentMethods ?? []).map((item) => decodeMaybeGarbled(item, item)), identitySummary: {
                                    realNameBalance: decodeMaybeGarbled(dashboard?.identitySummary.realNameBalance, '实名认证剩余 5 次'),
                                    smsBalance: decodeMaybeGarbled(dashboard?.identitySummary.smsBalance, '短信剩余 50 条'),
                                    channelName: decodeMaybeGarbled(dashboard?.identitySummary.channelName, '携程直连'),
                                }, flowSteps: (dashboard?.flowSteps ?? []).map((item, index) => decodeMaybeGarbled(item, ['进入智住小程序', '办理登记', '查看门锁密码', '在线续住'][index] ?? `步骤${index + 1}`)), roomPasswordStrategies: dashboard?.roomPasswordStrategies ?? [], guestVerificationChoices: dashboard?.guestVerificationChoices ?? [], registerChoices: dashboard?.registerChoices ?? [], smsSendChoices: dashboard?.smsSendChoices ?? [], toggles: dashboard?.toggles, onOpenIdentity: () => setDialog('identity'), onOpenSms: () => setDialog('sms'), onOpenPayment: () => setDialog('payment'), onOpenRoomType: () => navigate(routes.roomTypeInfo), onOpenSmsSetting: () => navigate(routes.smsSetting) })) : null, activeTab === 'guide' ? (_jsx(GuideTabPanel, { checkedState: guideRuleChecks, keyword: guideKeyword, onKeywordChange: setGuideKeyword, onSearch: handleGuideSearch, onReset: handleGuideReset, onToggleRule: handleGuideRuleToggle, onOpenCreate: openGuideCreateDialog, onOpenMiniProgram: () => navigate(routes.smartSettings) })) : null, activeTab === 'wifi' ? (_jsx(WifiTabPanel, { keyword: wifiKeyword, enabled: wifiEnabled, onKeywordChange: setWifiKeyword, onSearch: handleWifiSearch, onReset: handleWifiReset, onToggle: handleWifiToggle, onOpenCreate: openWifiCreateDialog })) : null] })) : null, _jsxs("footer", { className: "smart-global-footer", children: [_jsx("span", { children: "\u5F53\u524D\u9875\u4EC5\u5BF9\u9F50\u76EE\u6807\u7AD9\u89C6\u89C9\u4E0E\u7ED3\u6784\uFF0C\u4FDD\u5B58\u6309\u94AE\u4FDD\u6301\u7981\u7528\u6001" }), _jsx("button", { type: "button", disabled: true, children: "\u4FDD\u5B58" })] })] }), dialog === 'identity' ? (_jsx(DialogFrame, { title: "\u8BA4\u8BC1\u4E0E\u77ED\u4FE1\u4F59\u989D\u8BE6\u60C5", closeLabel: "\u5173\u95ED\u8BA4\u8BC1\u4E0E\u77ED\u4FE1\u4F59\u989D\u8BE6\u60C5", onClose: () => setDialog(null), children: _jsxs("dl", { className: "smart-global-dialog-list", children: [_jsxs("div", { children: [_jsx("dt", { children: "\u5B9E\u540D\u8BA4\u8BC1" }), _jsx("dd", { children: decodeMaybeGarbled(dashboard?.identitySummary.realNameBalance, '实名认证剩余 5 次') })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u77ED\u4FE1\u4F59\u989D" }), _jsx("dd", { children: decodeMaybeGarbled(dashboard?.identitySummary.smsBalance, '短信剩余 50 条') })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u901A\u9053" }), _jsx("dd", { children: decodeMaybeGarbled(dashboard?.identitySummary.channelName, '携程直连') })] })] }) })) : null, dialog === 'sms' ? (_jsx(DialogFrame, { title: "\u77ED\u4FE1\u53D1\u9001\u6A21\u677F", closeLabel: "\u5173\u95ED\u77ED\u4FE1\u53D1\u9001\u6A21\u677F", onClose: () => setDialog(null), children: _jsx("div", { className: "smart-global-template-list", children: (dashboard?.smsTemplates ?? []).map((template, index) => (_jsxs("article", { children: [_jsx("strong", { children: decodeMaybeGarbled(template.title, ['获得密码（智能入住）', '实名认证（智能入住）', '押金提醒'][index] ?? template.title) }), _jsx("p", { children: decodeMaybeGarbled(template.content, '模板内容以短信设置页中的配置为准') })] }, template.id))) }) })) : null, dialog === 'payment' ? (_jsx(DialogFrame, { title: "\u62BC\u91D1\u4E0E\u6536\u6B3E\u65B9\u5F0F", closeLabel: "\u5173\u95ED\u62BC\u91D1\u4E0E\u6536\u6B3E\u65B9\u5F0F", onClose: () => setDialog(null), children: _jsx("div", { className: "smart-global-payment-list", children: (dashboard?.paymentMethods ?? ['微信', '支付宝']).map((item, index) => (_jsx("span", { children: decodeMaybeGarbled(item, item) }, `${item}-${index}`))) }) })) : null, dialog === 'guide-create' ? (_jsx(GuideCreateDialog, { draft: guideCreateDraft, canSubmit: canSubmitGuide, onClose: closeGuideCreateDialog, onChange: updateGuideDraft, onUpload: handleGuideImageUpload, onSubmit: handleGuideCreateSubmit })) : null, dialog === 'wifi-create' ? (_jsx(WifiCreateDialog, { draft: wifiCreateDraft, canSubmit: canSubmitWifi, onClose: closeWifiCreateDialog, onChange: updateWifiDraft, onSubmit: handleWifiCreateSubmit })) : null] }));
}
function RulesPanel({ roomTypeSummary, smsTemplateSummary, syncLabel, paymentMethods, identitySummary, flowSteps, roomPasswordStrategies, guestVerificationChoices, registerChoices, smsSendChoices, toggles, onOpenIdentity, onOpenSms, onOpenPayment, onOpenRoomType, onOpenSmsSetting, }) {
    return (_jsxs("div", { className: "smart-global-rule-layout", children: [_jsxs("div", { className: "smart-global-rule-main", children: [_jsxs("section", { className: "smart-global-section", children: [_jsx("h2", { children: "\u95E8\u9501\u5BC6\u7801\u6709\u6548\u65F6\u95F4" }), _jsxs("div", { className: "smart-global-summary-row", children: [_jsx("strong", { children: roomTypeSummary }), _jsx("button", { type: "button", className: "smart-global-link-button", onClick: onOpenRoomType, children: "\u524D\u5F80\u623F\u578B\u4FE1\u606F" })] }), _jsx(ChoiceList, { items: roomPasswordStrategies })] }), _jsxs("section", { className: "smart-global-section", children: [_jsx("h2", { children: "\u5165\u4F4F\u8EAB\u4EFD\u8BA4\u8BC1\u4E0E\u767B\u8BB0" }), _jsxs("div", { className: "smart-global-summary-row", children: [_jsx("strong", { children: identitySummary.realNameBalance }), _jsx("button", { type: "button", className: "smart-global-link-button", onClick: onOpenIdentity, children: "\u5145\u503C" })] }), _jsxs("div", { className: "smart-global-setting-line", children: [_jsx("div", { className: "smart-global-label", children: "\u5165\u4F4F\u4EBA\u8EAB\u4EFD\u8BA4\u8BC1\uFF1A" }), _jsx("div", { children: _jsx(ChoiceList, { items: guestVerificationChoices }) })] }), _jsxs("div", { className: "smart-global-setting-line", children: [_jsx("div", { className: "smart-global-label", children: "\u5165\u4F4F\u767B\u8BB0\u8981\u6C42\uFF1A" }), _jsx("div", { children: _jsx(ChoiceList, { items: registerChoices, compact: true }) })] })] }), _jsxs("section", { className: "smart-global-section", children: [_jsx("h2", { children: "\u77ED\u4FE1\u4E0E\u62BC\u91D1\u8BBE\u7F6E" }), _jsxs("div", { className: "smart-global-summary-row", children: [_jsx("strong", { children: smsTemplateSummary }), _jsxs("div", { className: "smart-global-summary-actions", children: [_jsx("button", { type: "button", className: "smart-global-link-button", onClick: onOpenSms, children: "\u67E5\u770B\u77ED\u4FE1\u6A21\u677F" }), _jsx("button", { type: "button", className: "smart-global-link-button", onClick: onOpenSmsSetting, children: "\u7F16\u8F91\u77ED\u4FE1\u5185\u5BB9" })] })] }), _jsxs("div", { className: "smart-global-setting-line", children: [_jsx("div", { className: "smart-global-label", children: "\u53D1\u9001\u77ED\u4FE1\u5185\u5BB9\uFF1A" }), _jsx("div", { children: _jsx(ChoiceList, { items: smsSendChoices }) })] }), _jsxs("div", { className: "smart-global-setting-line", children: [_jsx("div", { className: "smart-global-label", children: "\u62BC\u91D1\u4E0E\u6536\u6B3E\u65B9\u5F0F\uFF1A" }), _jsxs("div", { className: "smart-global-inline-actions", children: [_jsx("span", { children: paymentMethods.join(' / ') }), _jsx("button", { type: "button", className: "smart-global-link-button", onClick: onOpenPayment, children: "\u67E5\u770B\u652F\u4ED8\u65B9\u5F0F" })] })] })] }), _jsxs("section", { className: "smart-global-section", children: [_jsx("h2", { children: "\u5176\u4ED6\u89C4\u5219" }), _jsx(SettingToggleRow, { toggle: toggles?.autoInvite, fallbackLabel: "\u81EA\u52A8\u53D1\u9001\u5165\u4F4F\u9080\u8BF7" }), _jsx(SettingToggleRow, { toggle: toggles?.deposit, fallbackLabel: "\u6536\u53D6\u62BC\u91D1" }), _jsx(SettingToggleRow, { toggle: toggles?.guestStatus, fallbackLabel: "\u623F\u5BA2\u53D8\u66F4\u5165\u4F4F\u72B6\u6001" }), _jsx(SettingToggleRow, { toggle: toggles?.dirtyRoomBlock, fallbackLabel: "\u810F\u623F\u4E0D\u5141\u8BB8\u5165\u4F4F" }), _jsx(SettingToggleRow, { toggle: toggles?.earlyPassword, fallbackLabel: "\u63D0\u524D\u5165\u4F4F\u751F\u6210\u5BC6\u7801" }), _jsx("div", { className: "smart-global-sync-row", children: syncLabel })] })] }), _jsxs("aside", { className: "smart-global-flow", children: [_jsx("h2", { children: "\u573A\u666F\u6D41\u7A0B" }), _jsx("div", { className: "smart-global-flow__steps", children: flowSteps.map((step, index) => (_jsxs("div", { className: "smart-global-flow-step", children: [_jsxs("span", { children: ["\u6B65\u9AA4 ", index + 1] }), _jsx("strong", { children: step })] }, `${step}-${index}`))) })] })] }));
}
function GuideTabPanel({ checkedState, keyword, onKeywordChange, onSearch, onReset, onToggleRule, onOpenCreate, onOpenMiniProgram, }) {
    return (_jsxs("div", { className: "smart-global-panel-layout", children: [_jsx(PhonePreviewCard, { title: "\u5165\u4F4F\u6307\u5F15", description: "\u4F4F\u5BA2\u5728\u667A\u4F4F\u5C0F\u7A0B\u5E8F\u4E2D\u67E5\u770B\u5165\u4F4F\u89C4\u5219\u3001\u529E\u7406\u767B\u8BB0\u5E76\u83B7\u53D6\u5F00\u95E8\u4FE1\u606F\u3002", items: ['查看入住规则', '完成身份登记', '缴纳押金', '查看入住指引'], actionLabel: "\u524D\u5F80\u667A\u4F4F\u5C0F\u7A0B\u5E8F", onAction: onOpenMiniProgram }), _jsxs("div", { className: "smart-global-panel-main", children: [_jsxs("section", { className: "smart-global-card", children: [_jsx(CardTitle, { children: "\u5165\u4F4F\u6307\u5F15\u67E5\u770B\u89C4\u5219" }), _jsxs("div", { className: "smart-global-check-stack", children: [_jsxs("label", { children: [_jsx("input", { type: "checkbox", checked: checkedState.identity, "aria-label": "\u5B8C\u6210\u8EAB\u4EFD\u767B\u8BB0\u8981\u6C42", onChange: () => onToggleRule('identity') }), _jsx("span", { children: "\u5B8C\u6210\u8EAB\u4EFD\u767B\u8BB0\u8981\u6C42" })] }), _jsxs("label", { children: [_jsx("input", { type: "checkbox", checked: checkedState.deposit, "aria-label": "\u5B8C\u6210\u62BC\u91D1\u8981\u6C42", onChange: () => onToggleRule('deposit') }), _jsx("span", { children: "\u5B8C\u6210\u62BC\u91D1\u8981\u6C42" })] })] })] }), _jsxs("section", { className: "smart-global-card", children: [_jsxs("div", { className: "smart-global-card__head", children: [_jsx(CardTitle, { children: "\u5165\u4F4F\u6307\u5F15" }), _jsx("button", { type: "button", className: "smart-global-primary-button", onClick: onOpenCreate, children: "\u65B0\u589E\u5165\u4F4F\u6307\u5F15" })] }), _jsxs("div", { className: "smart-global-toolbar", children: [_jsx("input", { "aria-label": "\u5165\u4F4F\u6307\u5F15\u641C\u7D22", placeholder: "\u8BF7\u8F93\u5165\u5165\u4F4F\u6307\u5F15\u540D\u79F0/\u623F\u578B\u540D\u79F0", value: keyword, onChange: (event) => onKeywordChange(event.target.value) }), _jsx("button", { type: "button", className: "smart-global-primary-button smart-global-primary-button--small", onClick: onSearch, children: "\u641C\u7D22" }), _jsx("button", { type: "button", className: "smart-global-secondary-button", onClick: onReset, children: "\u91CD\u7F6E" })] }), _jsx(TableCard, { columns: ['入住指引名称', '应用房型', '操作'], rows: guideRows, emptyText: "\u6682\u65E0\u6570\u636E", renderRow: (row) => (_jsxs(_Fragment, { children: [_jsx("td", { children: row.name }), _jsx("td", { children: row.roomType }), _jsx("td", { children: _jsx("button", { type: "button", className: "smart-global-link-button", children: "\u7F16\u8F91" }) })] })) })] })] })] }));
}
function WifiTabPanel({ keyword, enabled, onKeywordChange, onSearch, onReset, onToggle, onOpenCreate, }) {
    return (_jsxs("div", { className: "smart-global-panel-layout", children: [_jsx(PhonePreviewCard, { title: "WIFI\u4E0A\u7F51", description: "\u4F4F\u5BA2\u53EF\u5728\u667A\u4F4F\u5C0F\u7A0B\u5E8F\u4E2D\u67E5\u770B\u5F53\u524D\u623F\u95F4\u53EF\u7528\u7684 WIFI \u540D\u79F0\u4E0E\u5BC6\u7801\u3002", items: ['查看WIFI规则', '获取WIFI名称', '查看WIFI密码', '连接网络'] }), _jsxs("div", { className: "smart-global-panel-main", children: [_jsxs("section", { className: "smart-global-card", children: [_jsx(CardTitle, { children: "WIFI\u67E5\u770B\u89C4\u5219" }), _jsxs("div", { className: "smart-global-rule-form", children: [_jsxs("div", { className: "smart-global-setting-line", children: [_jsx("div", { className: "smart-global-label", children: "\u5F00\u542FWIFI\uFF1A" }), _jsx("div", { children: _jsx("button", { type: "button", className: `smart-global-switch${enabled ? ' is-on' : ''}`, "aria-label": "\u5F00\u542FWIFI", "aria-pressed": enabled ? 'true' : 'false', onClick: onToggle, children: _jsx("span", {}) }) })] }), _jsxs("div", { className: "smart-global-setting-line", children: [_jsx("div", { className: "smart-global-label", children: "WIFI\u53EF\u67E5\u770B\u6761\u4EF6\uFF1A" }), _jsx("div", { className: "smart-global-radio-stack is-compact", children: _jsxs("label", { className: "smart-global-radio-line is-selected", children: [_jsx("input", { type: "radio", name: "wifi-rule", checked: true, readOnly: true }), _jsx("strong", { children: "\u4E0D\u9650\u5236" })] }) })] })] })] }), _jsxs("section", { className: "smart-global-card", children: [_jsxs("div", { className: "smart-global-card__head", children: [_jsx(CardTitle, { children: "WIFI" }), _jsx("button", { type: "button", className: "smart-global-primary-button", onClick: onOpenCreate, children: "\u65B0\u589EWIFI" })] }), _jsxs("div", { className: "smart-global-toolbar", children: [_jsx("input", { "aria-label": "WIFI\u641C\u7D22", placeholder: "\u8F93\u5165WIFI\u540D\u79F0", value: keyword, onChange: (event) => onKeywordChange(event.target.value) }), _jsx("button", { type: "button", className: "smart-global-primary-button smart-global-primary-button--small", onClick: onSearch, children: "\u641C\u7D22" }), _jsx("button", { type: "button", className: "smart-global-secondary-button", onClick: onReset, children: "\u91CD\u7F6E" })] }), _jsx(TableCard, { columns: ['WIFI名称', 'WIFI密码', '应用房间', '操作'], rows: wifiRows, emptyText: "\u6682\u65E0\u6570\u636E", renderRow: (row) => (_jsxs(_Fragment, { children: [_jsx("td", { children: row.name }), _jsx("td", { children: row.password }), _jsx("td", { children: row.rooms }), _jsx("td", { children: _jsx("button", { type: "button", className: "smart-global-link-button", children: "\u7F16\u8F91" }) })] })) })] })] })] }));
}
function GuideCreateDialog({ draft, canSubmit, onClose, onChange, onUpload, onSubmit, }) {
    return (_jsx("div", { className: "smart-global-modal-backdrop", children: _jsxs("section", { className: "smart-global-modal smart-global-modal--guide", role: "dialog", "aria-modal": "true", "aria-label": "\u65B0\u589E\u5165\u4F4F\u6307\u5F15", children: [_jsxs("header", { children: [_jsx("h2", { children: "\u65B0\u589E\u5165\u4F4F\u6307\u5F15" }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u65B0\u589E\u5165\u4F4F\u6307\u5F15", onClick: onClose, children: "\u00D7" })] }), _jsxs("div", { className: "smart-global-guide-dialog__body", "data-testid": "guide-create-scrollable", children: [_jsxs("div", { className: "smart-global-guide-dialog__field", children: [_jsx("label", { htmlFor: "guide-name-input", children: "\u5165\u4F4F\u6307\u5F15\u540D\u79F0\uFF1A" }), _jsx("input", { id: "guide-name-input", "aria-label": "\u5165\u4F4F\u6307\u5F15\u540D\u79F0", placeholder: "\u8BF7\u8F93\u5165\u5165\u4F4F\u6307\u5F15\u540D\u79F0", value: draft.guideName, onChange: (event) => onChange('guideName', event.target.value) })] }), _jsx(GuideSectionEditor, { index: 1, title: "\u623F\u6E90\u8DEF\u7EBF", label: "\u5230\u8FBE\u623F\u6E90\u8DEF\u7EBF\uFF1A", fieldName: "\u5230\u8FBE\u623F\u6E90\u8DEF\u7EBF", placeholder: "\u8BF7\u8F93\u5165\u8DEF\u7EBF\u6307\u5F15", helper: "\u8BF7\u91C7\u7528\u623F\u6E90\u9644\u8FD1\u663E\u8457\u7684\u5730\u7406\u6807\u5FD7\u7269\u8FDB\u884C\u5F15\u5BFC\uFF0C\u5982\u5730\u94C1\u3001\u516C\u4EA4\u7559\u7A7A\uFF0C\u7528\u6237\u7AEF\u4E0D\u5C55\u793A\u8BE5\u9009\u9879\u3002", uploadHint: "\u5EFA\u8BAE\u4E0A\u4F20\u8DEF\u7EBF\u5B9E\u666F\u56FE\uFF0C\u5F15\u5BFC\u623F\u5BA2\u5982\u4F55\u4ECE\u8DEF\u7EBF\u8D77\u70B9\u627E\u5230\u5C0F\u533A\uFF0C\u518D\u5230\u697C\u680B\u53CA\u627E\u5230\u81EA\u5DF1\u7684\u623F\u95F4", draftValue: draft.routeGuide, images: draft.routeImages, onTextChange: (value) => onChange('routeGuide', value), onUpload: (event) => onUpload('routeImages', event) }), _jsx(GuideSectionEditor, { index: 2, title: "\u5165\u4F4F\u6D41\u7A0B", label: "\u5165\u4F4F\u6D41\u7A0B\u8BF4\u660E\uFF1A", fieldName: "\u5165\u4F4F\u6D41\u7A0B\u8BF4\u660E", placeholder: "\u8BF7\u8F93\u5165\u5165\u4F4F\u6D41\u7A0B\u8BF4\u660E", helper: "\u5165\u4F4F\u6D41\u7A0B\u8BF4\u660E\uFF0C\u5F15\u5BFC\u623F\u5BA2\u5728\u627E\u5230\u81EA\u5DF1\u7684\u623F\u95F4\u540E\uFF0C\u5982\u4F55\u5F00\u9501\u5165\u4F4F\u623F\u95F4\uFF0C\u5982\u7559\u7A7A\uFF0C\u7528\u6237\u7AEF\u4E0D\u5C55\u793A\u8BE5\u9879\u76EE\u3002", uploadHint: "\u5EFA\u8BAE\u4E0A\u4F20\u5B9E\u666F\u56FE\uFF0C\u5F15\u5BFC\u623F\u5BA2\u5982\u4F55\u5F00\u9501\u8FDB\u5165\u623F\u95F4", draftValue: draft.processGuide, images: draft.processImages, onTextChange: (value) => onChange('processGuide', value), onUpload: (event) => onUpload('processImages', event) }), _jsx(GuideSectionEditor, { index: 3, title: "\u5165\u4F4F\u987B\u77E5", label: "\u5165\u4F4F\u987B\u77E5\uFF1A", fieldName: "\u5165\u4F4F\u987B\u77E5", placeholder: "\u8BF7\u8F93\u5165\u5165\u4F4F\u987B\u77E5", helper: "\u5165\u4F4F\u6CE8\u610F\u4E8B\u9879\uFF0C\u5982\u7981\u6B62\u9EC4\u8D4C\u6BD2\uFF0C\u4E0D\u53EF\u4E3E\u529E\u96C6\u4F1A\uFF0C\u4E0D\u53EF\u5546\u4E1A\u62CD\u7167\u7B49\u9700\u8981\u623F\u5BA2\u9075\u5B88\u7684\u89C4\u5219\u6761\u6B3E\u3002", uploadHint: "\u53EF\u4E0A\u4F20\u793A\u610F\u56FE\uFF0C\u623F\u5BA2\u770B\u5F97\u66F4\u6E05\u6670", draftValue: draft.noticeGuide, images: draft.noticeImages, onTextChange: (value) => onChange('noticeGuide', value), onUpload: (event) => onUpload('noticeImages', event) })] }), _jsxs("footer", { className: "smart-global-guide-dialog__footer", children: [_jsx("button", { type: "button", className: "smart-global-secondary-button", onClick: onClose, children: "\u53D6\u6D88" }), _jsx("button", { type: "button", className: "smart-global-primary-button", disabled: !canSubmit, onClick: onSubmit, children: "\u786E\u5B9A" })] })] }) }));
}
function GuideSectionEditor({ index, title, label, fieldName, placeholder, helper, uploadHint, draftValue, images, onTextChange, onUpload, }) {
    const inputId = useId();
    return (_jsxs("section", { className: "smart-global-guide-section", children: [_jsxs("h3", { children: [index, ".", title] }), _jsxs("div", { className: "smart-global-guide-section__row", children: [_jsx("label", { htmlFor: inputId, children: label }), _jsxs("div", { className: "smart-global-guide-section__main", children: [_jsx("textarea", { id: inputId, "aria-label": fieldName, placeholder: placeholder, value: draftValue, onChange: (event) => onTextChange(event.target.value) }), _jsx("p", { children: helper }), _jsx(UploadCard, { fieldName: fieldName, images: images, onUpload: onUpload }), _jsxs("p", { className: "smart-global-guide-section__hint", children: [uploadHint, _jsx("br", {}), "\u5EFA\u8BAE\u5C3A\u5BF8\uFF1A800*800\u50CF\u7D20\uFF0C\u4F60\u53EF\u4EE5\u62D6\u62FD\u56FE\u7247\u4E0A\u4F20\uFF0C\u6700\u591A\u4E0A\u4F2015\u5F20\u3002\u6700\u5C11\u4E00\u5F20", _jsx("button", { type: "button", children: "\u8C03\u6574\u56FE\u7247\u987A\u5E8F" })] })] })] })] }));
}
function WifiCreateDialog({ draft, canSubmit, onClose, onChange, onSubmit, }) {
    return (_jsx("div", { className: "smart-global-modal-backdrop", children: _jsxs("section", { className: "smart-global-modal smart-global-modal--wifi", role: "dialog", "aria-modal": "true", "aria-label": "\u65B0\u589EWIFI", children: [_jsxs("header", { children: [_jsx("h2", { children: "\u65B0\u589EWIFI" }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u65B0\u589EWIFI", onClick: onClose, children: "\u00D7" })] }), _jsxs("div", { className: "smart-global-modal__body smart-global-wifi-dialog__body", children: [_jsxs("div", { className: "smart-global-wifi-dialog__field", children: [_jsxs("label", { htmlFor: "wifi-name-input", children: [_jsx("span", { children: "*" }), " WIFI\u540D\u79F0"] }), _jsx("input", { id: "wifi-name-input", "aria-label": "WIFI\u540D\u79F0", placeholder: "\u8BF7\u8F93\u5165WIFI\u540D\u79F0", value: draft.wifiName, onChange: (event) => onChange('wifiName', event.target.value) })] }), _jsxs("div", { className: "smart-global-wifi-dialog__field", children: [_jsxs("label", { htmlFor: "wifi-password-input", children: [_jsx("span", { children: "*" }), " WIFI\u5BC6\u7801"] }), _jsx("input", { id: "wifi-password-input", "aria-label": "WIFI\u5BC6\u7801", placeholder: "\u8BF7\u8F93\u5165WIFI\u5BC6\u7801", value: draft.wifiPassword, onChange: (event) => onChange('wifiPassword', event.target.value) })] })] }), _jsxs("footer", { className: "smart-global-guide-dialog__footer", children: [_jsx("button", { type: "button", className: "smart-global-secondary-button", onClick: onClose, children: "\u53D6\u6D88" }), _jsx("button", { type: "button", className: "smart-global-primary-button", disabled: !canSubmit, onClick: onSubmit, children: "\u786E\u5B9A" })] })] }) }));
}
function UploadCard({ fieldName, images, onUpload, }) {
    const inputId = useId();
    return (_jsxs("div", { className: "smart-global-upload-field", children: [_jsxs("label", { htmlFor: inputId, className: "smart-global-upload-card", children: [_jsx("span", { className: "smart-global-upload-card__plus", children: "+" }), _jsx("span", { children: "\u4E0A\u4F20" })] }), _jsx("input", { id: inputId, className: "smart-global-upload-input", type: "file", multiple: true, accept: "image/*", onChange: onUpload }), images.length > 0 ? (_jsx("div", { className: "smart-global-upload-list", "aria-label": `${fieldName}已上传图片`, children: images.map((image) => (_jsxs("article", { children: [_jsx("img", { src: image.url, alt: image.name }), _jsx("span", { children: image.name })] }, image.id))) })) : null] }));
}
function PhonePreviewCard({ title, description, items, actionLabel, onAction, }) {
    return (_jsx("aside", { className: "smart-global-phone-card", "aria-label": `${title}预览`, children: _jsxs("div", { className: "smart-global-phone", children: [_jsxs("div", { className: "smart-global-phone__status", children: [_jsx("span", { children: "09:41" }), _jsx("span", { children: "5G" })] }), _jsxs("div", { className: "smart-global-phone__hero", children: [_jsx("span", { className: "smart-global-phone__badge", children: "\u667A\u4F4F\u5C0F\u7A0B\u5E8F" }), _jsx("strong", { children: title }), _jsx("p", { children: description })] }), _jsx("div", { className: "smart-global-phone__list", children: items.map((item, index) => (_jsxs("article", { children: [_jsx("span", { children: index + 1 }), _jsx("strong", { children: item })] }, item))) }), actionLabel && onAction ? (_jsx("button", { type: "button", className: "smart-global-phone__action", onClick: onAction, children: actionLabel })) : null] }) }));
}
function TableCard({ columns, rows, emptyText, renderRow, }) {
    return (_jsx("div", { className: "smart-global-table-card", children: _jsxs("table", { children: [_jsx("thead", { children: _jsx("tr", { children: columns.map((column) => (_jsx("th", { children: column }, column))) }) }), _jsx("tbody", { children: rows.length > 0 ? (rows.map((row, index) => _jsx("tr", { children: renderRow(row) }, index))) : (_jsx("tr", { children: _jsx("td", { className: "smart-global-empty-cell", colSpan: columns.length, children: emptyText }) })) })] }) }));
}
function ChoiceList({ items, compact = false, }) {
    return (_jsx("div", { className: `smart-global-radio-stack${compact ? ' is-compact' : ''}`, children: items.map((item) => (_jsxs("label", { className: `smart-global-radio-line${item.selected ? ' is-selected' : ''}`, children: [_jsx("input", { type: "radio", checked: Boolean(item.selected), readOnly: true }), _jsxs("div", { children: [_jsx("strong", { children: decodeChoiceTitle(item.title) }), item.badge ? _jsx("span", { className: "smart-global-tag", children: "\u63A8\u8350" }) : null, item.description ? _jsx("p", { className: "smart-global-muted", children: decodeMaybeGarbled(item.description, item.description) }) : null] })] }, item.id))) }));
}
function SettingToggleRow({ toggle, fallbackLabel, }) {
    return (_jsxs("div", { className: "smart-global-setting-line", children: [_jsxs("div", { className: "smart-global-label", children: [decodeMaybeGarbled(toggle?.label, fallbackLabel), "\uFF1A"] }), _jsxs("div", { children: [_jsx("button", { type: "button", className: `smart-global-switch${toggle?.checked ? ' is-on' : ''}`, disabled: true, "aria-label": decodeMaybeGarbled(toggle?.label, fallbackLabel), "aria-pressed": toggle?.checked ? 'true' : 'false', children: _jsx("span", {}) }), toggle?.description ? (_jsx("span", { className: "smart-global-muted", children: decodeMaybeGarbled(toggle.description, toggle.description) })) : null] })] }));
}
function TabButton({ active, children, onClick, }) {
    return (_jsx("button", { type: "button", role: "tab", "aria-selected": active, className: active ? 'is-active' : '', onClick: onClick, children: children }));
}
function CardTitle({ children }) {
    return _jsx("h2", { className: "smart-global-card-title", children: children });
}
function DialogFrame({ title, closeLabel, children, onClose, }) {
    return (_jsx("div", { className: "smart-global-modal-backdrop", children: _jsxs("section", { className: "smart-global-modal", role: "dialog", "aria-modal": "true", "aria-label": title, children: [_jsxs("header", { children: [_jsx("h2", { children: title }), _jsx("button", { type: "button", "aria-label": closeLabel, onClick: onClose, children: "\u00D7" })] }), _jsx("div", { className: "smart-global-modal__body", children: children })] }) }));
}
function revokeDraftUrls(draft) {
    draft.routeImages.forEach((item) => URL.revokeObjectURL(item.url));
    draft.processImages.forEach((item) => URL.revokeObjectURL(item.url));
    draft.noticeImages.forEach((item) => URL.revokeObjectURL(item.url));
}
function decodeMaybeGarbled(value, fallback) {
    if (!value)
        return fallback;
    if (/[\u4e00-\u9fff]/.test(value))
        return value;
    return fallback;
}
function decodeChoiceTitle(value) {
    return decodeMaybeGarbled(value, '配置项');
}
