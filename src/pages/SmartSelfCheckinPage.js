import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { createDefaultSmartSelfCheckinFilters, fetchSmartSelfCheckinDashboard, } from '../services/smartSelfCheckin';
import './SmartSelfCheckinPage.css';
const scanFlowSteps = [
    { id: 'scan-arrive', label: '到达酒店' },
    { id: 'scan-qr', label: '扫描智住二维码' },
    { id: 'scan-mini-program', label: '进入智住小程序' },
    { id: 'scan-identity', label: '身份登记' },
    { id: 'scan-deposit', label: '缴纳押金' },
    { id: 'scan-checkin', label: '办理入住' },
    { id: 'scan-password', label: '查看门锁密码' },
];
const kioskFlowSteps = [
    { id: 'kiosk-arrive', label: '到达酒店' },
    { id: 'kiosk-checkin', label: '入住办理' },
    { id: 'kiosk-identity', label: '身份识别' },
    { id: 'kiosk-door', label: '获取房间开门权限' },
    { id: 'kiosk-wifi', label: '连接WIFI' },
    { id: 'kiosk-luggage', label: '行李寄存' },
];
const kioskDeviceGroups = [
    {
        title: '入住办理',
        cards: [
            { title: '选配台式自助机', kind: 'kiosk-desktop' },
            { title: '选配嵌入式自助机', kind: 'kiosk-wall' },
        ],
    },
    {
        title: '获取房间开门权限',
        cards: [
            { title: '二维码取房卡', kind: 'door-qr' },
            { title: '碰一碰开门', kind: 'door-nfc' },
            { title: '刷脸开门', kind: 'door-face' },
            { title: '密码开门', kind: 'door-password' },
            { title: '刷卡开门', kind: 'door-card' },
            { title: '二维码房卡', kind: 'door-phone' },
        ],
    },
    {
        title: '连接WIFI',
        cards: [
            { title: '路由器S1', kind: 'wifi-router' },
            { title: '路由器S2', kind: 'wifi-router-alt' },
        ],
    },
    {
        title: '行李寄存柜',
        cards: [{ title: '行李寄存柜', kind: 'locker' }],
    },
];
export function SmartSelfCheckinPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const [dashboard, setDashboard] = useState(null);
    const [plans, setPlans] = useState([]);
    const [enabled, setEnabled] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [feedback, setFeedback] = useState('自助入住数据加载中');
    const [purchasePlan, setPurchasePlan] = useState(null);
    const [isExpertDialogOpen, setIsExpertDialogOpen] = useState(false);
    const [selectedPlanId, setSelectedPlanId] = useState('password-only');
    const [collapsedSections, setCollapsedSections] = useState({
        cloud: false,
        scan: false,
        kiosk: false,
    });
    useEffect(() => {
        const controller = new AbortController();
        const filters = createDefaultSmartSelfCheckinFilters(new URLSearchParams(location.search));
        setIsLoading(true);
        setErrorMessage('');
        void fetchSmartSelfCheckinDashboard(filters, controller.signal)
            .then((result) => {
            setDashboard(result);
            setPlans(result.plans);
            setEnabled(result.enabled);
            setSelectedPlanId(result.plans.find((plan) => plan.badge !== 'locked')?.id ?? result.plans[0]?.id ?? '');
            setFeedback(result.emptyState ? '当前暂无可发布的自助入住方案' : '自助入住数据已加载');
        })
            .catch((error) => {
            if (error instanceof DOMException && error.name === 'AbortError')
                return;
            setDashboard(null);
            setPlans([]);
            setEnabled(false);
            setSelectedPlanId('');
            setErrorMessage(error instanceof Error ? error.message : '自助入住加载失败，请稍后重试');
            setFeedback(error instanceof Error ? error.message : '自助入住加载失败，请稍后重试');
        })
            .finally(() => {
            if (!controller.signal.aborted) {
                setIsLoading(false);
            }
        });
        return () => controller.abort();
    }, [location.search]);
    function handleRetry() {
        setDashboard(null);
        setPlans([]);
        setEnabled(false);
        setSelectedPlanId('');
        setErrorMessage('');
        setFeedback('自助入住数据加载中');
        setIsLoading(true);
        navigate('/smartHotel/smartHome', { replace: true });
    }
    function handleSwitchToggle() {
        setEnabled((current) => {
            const next = !current;
            setFeedback(next ? '云端入住登记已开启，短信邀请将按当前方案发送。' : '云端入住登记已关闭，新的入住邀请不会自动发送。');
            return next;
        });
    }
    function toggleSection(sectionId) {
        setCollapsedSections((current) => ({
            ...current,
            [sectionId]: !current[sectionId],
        }));
    }
    function isSectionHeaderActionTarget(target) {
        return target instanceof HTMLElement && Boolean(target.closest('button, a, input, textarea, select, label'));
    }
    function handleSectionHeaderToggle(sectionId, event) {
        if (isSectionHeaderActionTarget(event.target))
            return;
        toggleSection(sectionId);
    }
    function createQrTask() {
        setFeedback('二维码下载任务已创建，可前往下载中心查看。');
    }
    function createKioskLead() {
        setIsExpertDialogOpen(true);
        setFeedback('已打开智慧酒店专家联系信息。');
    }
    function handlePlanSelect(plan) {
        if (plan.badge === 'locked') {
            setPurchasePlan(plan);
            return;
        }
        setSelectedPlanId(plan.id);
        setFeedback(`已切换到「${plan.title}」方案。`);
    }
    const provider = dashboard?.provider ?? 'mock';
    const emptyState = dashboard?.emptyState;
    const activePlan = plans.find((plan) => plan.id === selectedPlanId) ?? plans[0] ?? null;
    const cloudFlowSteps = getFlowStepsForPlan(activePlan, dashboard?.flowSteps ?? []);
    const globalSettingPath = dashboard?.routes.globalSetting ?? '/smartHotel/checkInGuide';
    const hardwareMallPath = dashboard?.routes.hardwareMall ?? '/smartHotel/smartHardware/mall';
    return (_jsxs("div", { className: "smart-checkin-page", "data-provider": provider, "data-enabled": enabled ? 'true' : 'false', "data-empty": emptyState ? 'true' : 'false', children: [_jsxs("div", { className: "smart-checkin-page__content", children: [_jsxs("section", { className: "smart-checkin-hero", "aria-label": "\u667A\u6167\u9152\u5E97\u81EA\u52A9\u5165\u4F4F\u4ECB\u7ECD", children: [_jsxs("div", { className: "smart-checkin-hero__copy", children: [_jsx("h1", { children: "\u667A\u6167\u9152\u5E97\uFF1A\u5168\u573A\u666F\u81EA\u52A9\u5165\u4F4F" }), _jsx("p", { children: "\u8DEF\u5BA2\u4E91\u652F\u6301\u4E09\u79CD\u6570\u5B57\u5316\u81EA\u52A9\u5165\u4F4F\u6A21\u5F0F\uFF0C\u7075\u6D3B\u9002\u914D\u9152\u5E97\u3001\u6C11\u5BBF\u3001\u516C\u5BD3\u7B49\u5168\u4E1A\u6001\u3002\u540C\u65F6\u53EF\u81EA\u7531\u9009\u914D\u667A\u80FD\u786C\u4EF6\u7EC4\u5408\uFF0C\u90E8\u7F72\u65E0\u4EBA\u9152\u5E97\uFF0C\u5B9E\u73B0\u964D\u672C\u589E\u6548\u3002" })] }), _jsxs("div", { className: "smart-checkin-hero__art", "aria-hidden": "true", children: [_jsx("span", { className: "smart-checkin-hero__beam" }), _jsx("span", { className: "smart-checkin-hero__platform smart-checkin-hero__platform--main" }), _jsx("span", { className: "smart-checkin-hero__platform smart-checkin-hero__platform--side" }), _jsx("span", { className: "smart-checkin-hero__tower" }), _jsx("span", { className: "smart-checkin-hero__device smart-checkin-hero__device--kiosk" }), _jsx("span", { className: "smart-checkin-hero__device smart-checkin-hero__device--phone" })] })] }), _jsxs("section", { className: "smart-checkin-section smart-checkin-section--cloud", "aria-labelledby": "smart-checkin-cloud-title", children: [_jsxs("header", { className: "smart-checkin-section__header smart-checkin-section__header--interactive", onClick: (event) => handleSectionHeaderToggle('cloud', event), children: [_jsxs("div", { className: "smart-checkin-section__meta", children: [_jsx("div", { className: "smart-checkin-section__icon smart-checkin-section__icon--cloud", "aria-hidden": "true", children: _jsx(CloudIcon, {}) }), _jsxs("div", { children: [_jsx("h2", { id: "smart-checkin-cloud-title", children: "\u4E91\u7AEF\u5165\u4F4F\u767B\u8BB0" }), _jsx("p", { children: "\u623F\u5BA2\u5728\u5230\u5E97\u524D\uFF0C\u901A\u8FC7\u77ED\u4FE1\u5B8C\u6210\u5165\u4F4F\u76F8\u5173\u64CD\u4F5C" })] })] }), _jsxs("div", { className: "smart-checkin-section__controls", children: [_jsx("button", { type: "button", "aria-label": "\u4E91\u7AEF\u5165\u4F4F\u767B\u8BB0\u5F00\u5173", "aria-pressed": enabled, className: `smart-checkin-switch${enabled ? ' is-on' : ''}`, onClick: handleSwitchToggle, disabled: isLoading || Boolean(errorMessage), children: _jsx("span", {}) }), _jsx("button", { type: "button", className: `smart-checkin-collapse${collapsedSections.cloud ? ' is-collapsed' : ''}`, "aria-label": "\u4E91\u7AEF\u5165\u4F4F\u767B\u8BB0\u5C55\u5F00\u6536\u8D77", "aria-expanded": !collapsedSections.cloud, onClick: () => toggleSection('cloud'), children: _jsx(ChevronIcon, {}) })] })] }), _jsxs("div", { className: `smart-checkin-section__body${collapsedSections.cloud ? ' is-hidden' : ''}`, children: [_jsx("span", { role: "status", "aria-label": "\u81EA\u52A9\u5165\u4F4F\u64CD\u4F5C\u53CD\u9988", className: "smart-checkin-status", children: feedback }), isLoading ? _jsx("div", { className: "smart-checkin-loading", children: "\u81EA\u52A9\u5165\u4F4F\u6570\u636E\u52A0\u8F7D\u4E2D" }) : null, errorMessage ? (_jsxs("div", { className: "smart-checkin-error", role: "alert", "aria-label": "\u81EA\u52A9\u5165\u4F4F\u52A0\u8F7D\u5931\u8D25", children: [_jsx("strong", { children: "\u81EA\u52A9\u5165\u4F4F\u52A0\u8F7D\u5931\u8D25" }), _jsx("span", { children: errorMessage }), _jsx("button", { type: "button", onClick: handleRetry, children: "\u91CD\u65B0\u52A0\u8F7D" })] })) : null, !isLoading && !errorMessage && emptyState ? (_jsxs("section", { className: "smart-checkin-empty", "aria-label": "\u81EA\u52A9\u5165\u4F4F\u7A7A\u72B6\u6001", children: [_jsx("strong", { children: emptyState.title }), _jsx("p", { children: emptyState.description }), _jsx("button", { type: "button", onClick: () => navigate(emptyState.actionPath), children: emptyState.actionLabel })] })) : null, !isLoading && !errorMessage && !emptyState ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "smart-checkin-plans", "aria-label": "\u4E91\u7AEF\u5165\u4F4F\u767B\u8BB0\u65B9\u5F0F", children: plans.map((plan) => {
                                                    const isLocked = plan.badge === 'locked';
                                                    const isActive = plan.id === selectedPlanId;
                                                    return (_jsxs("button", { type: "button", className: `smart-checkin-plan${isActive ? ' is-active' : ''}${isLocked ? ' is-locked' : ''}`, onClick: () => handlePlanSelect(plan), "aria-pressed": isActive, children: [_jsxs("span", { className: "smart-checkin-plan__head", children: [_jsx("span", { className: "smart-checkin-plan__title", children: plan.title }), plan.badge === 'recommended' ? _jsx("span", { className: "smart-checkin-badge is-recommended", children: "\u63A8\u8350" }) : null, isLocked ? _jsx("span", { className: "smart-checkin-badge is-locked", children: "\u672A\u5F00\u901A" }) : null] }), _jsx("span", { className: "smart-checkin-plan__description", children: plan.description }), _jsx("span", { className: "smart-checkin-message", children: plan.messageTemplate })] }, plan.id));
                                                }) }), _jsx(SceneFlow, { title: "\u573A\u666F\u6D41\u7A0B", action: _jsx("button", { type: "button", onClick: () => navigate('/setting/balanceAndTemplate'), children: "\u7F16\u8F91\u77ED\u4FE1\u5185\u5BB9" }), steps: cloudFlowSteps })] })) : null] })] }), _jsxs("section", { className: "smart-checkin-section", "aria-labelledby": "smart-checkin-scan-title", children: [_jsxs("header", { className: "smart-checkin-section__header smart-checkin-section__header--interactive", onClick: (event) => handleSectionHeaderToggle('scan', event), children: [_jsxs("div", { className: "smart-checkin-section__meta", children: [_jsx("div", { className: "smart-checkin-section__icon smart-checkin-section__icon--scan", "aria-hidden": "true", children: _jsx(PhoneIcon, {}) }), _jsxs("div", { children: [_jsx("h2", { id: "smart-checkin-scan-title", children: "\u524D\u53F0\u6570\u5B57\u5316\uFF08\u626B\u7801\uFF09" }), _jsx("p", { children: "\u623F\u5BA2\u5230\u5E97\u540E\uFF0C\u626B\u63CF\u524D\u53F0\u4E8C\u7EF4\u7801\uFF0C\u8FDB\u5165\u667A\u4F4F\u5C0F\u7A0B\u5E8F\uFF0C\u5B8C\u6210\u5165\u4F4F\u64CD\u4F5C" })] })] }), _jsxs("div", { className: "smart-checkin-section__controls", children: [_jsx("button", { type: "button", className: "smart-checkin-outline-button smart-checkin-outline-button--primary", onClick: createQrTask, children: "\u4E0B\u8F7D\u4E8C\u7EF4\u7801" }), _jsx("button", { type: "button", className: `smart-checkin-collapse${collapsedSections.scan ? ' is-collapsed' : ''}`, "aria-label": "\u524D\u53F0\u6570\u5B57\u5316\uFF08\u626B\u7801\uFF09\u5C55\u5F00\u6536\u8D77", "aria-expanded": !collapsedSections.scan, onClick: () => toggleSection('scan'), children: _jsx(ChevronIcon, {}) })] })] }), _jsx("div", { className: `smart-checkin-section__body${collapsedSections.scan ? ' is-hidden' : ''}`, children: _jsx(SceneFlow, { title: "\u573A\u666F\u6D41\u7A0B", action: _jsx("button", { type: "button", onClick: () => navigate(globalSettingPath), children: "\u5168\u5C40\u8BBE\u7F6E" }), steps: scanFlowSteps }) })] }), _jsxs("section", { className: "smart-checkin-section", "aria-labelledby": "smart-checkin-kiosk-title", children: [_jsxs("header", { className: "smart-checkin-section__header smart-checkin-section__header--interactive", onClick: (event) => handleSectionHeaderToggle('kiosk', event), children: [_jsxs("div", { className: "smart-checkin-section__meta", children: [_jsx("div", { className: "smart-checkin-section__icon smart-checkin-section__icon--kiosk", "aria-hidden": "true", children: _jsx(KioskIcon, {}) }), _jsxs("div", { children: [_jsx("h2", { id: "smart-checkin-kiosk-title", children: "\u81EA\u52A9\u673A\u5165\u4F4F" }), _jsx("p", { children: "\u623F\u5BA2\u5230\u5E97\u540E\uFF0C\u901A\u8FC7\u81EA\u52A9\u673A\u5B8C\u6210\u5165\u4F4F\u64CD\u4F5C" })] })] }), _jsxs("div", { className: "smart-checkin-section__controls", children: [_jsx("button", { type: "button", className: "smart-checkin-outline-button", onClick: createKioskLead, children: "\u8054\u7CFB\u667A\u6167\u9152\u5E97\u4E13\u5BB6" }), _jsx("button", { type: "button", className: `smart-checkin-collapse${collapsedSections.kiosk ? ' is-collapsed' : ''}`, "aria-label": "\u81EA\u52A9\u673A\u5165\u4F4F\u5C55\u5F00\u6536\u8D77", "aria-expanded": !collapsedSections.kiosk, onClick: () => toggleSection('kiosk'), children: _jsx(ChevronIcon, {}) })] })] }), _jsxs("div", { className: `smart-checkin-section__body${collapsedSections.kiosk ? ' is-hidden' : ''}`, children: [_jsx(SceneFlow, { title: "\u573A\u666F\u6D41\u7A0B", extra: _jsxs("p", { className: "smart-checkin-flow__helper", children: ["\u53EF\u642D\u914D\u66F4\u591A\u667A\u80FD\u786C\u4EF6\uFF0C\u524D\u5F80", _jsx(Link, { to: hardwareMallPath, children: "\u667A\u80FD\u786C\u4EF6\u5546\u57CE" }), "\u67E5\u770B"] }), steps: kioskFlowSteps }), _jsx("div", { className: "smart-checkin-device-groups", children: kioskDeviceGroups.map((group) => (_jsxs("section", { className: `smart-checkin-device-group smart-checkin-device-group--${toGroupModifier(group.title)}`, children: [_jsx("h3", { children: group.title }), _jsx("div", { className: "smart-checkin-device-grid", children: group.cards.map((card) => (_jsxs("article", { className: "smart-checkin-device-card", children: [_jsx("div", { className: `smart-checkin-device-art smart-checkin-device-art--${card.kind}`, "aria-hidden": "true", children: _jsx(DeviceIllustration, { kind: card.kind }) }), _jsx("strong", { children: card.title })] }, card.title))) })] }, group.title))) })] })] })] }), purchasePlan ? (_jsx(PurchaseDialog, { planTitle: purchasePlan.title, onClose: () => setPurchasePlan(null), onContact: () => {
                    setPurchasePlan(null);
                    setIsExpertDialogOpen(true);
                    setFeedback(`已为「${purchasePlan.title}」创建购买咨询，请联系智慧酒店专家跟进。`);
                } })) : null, isExpertDialogOpen ? (_jsx(ExpertDialog, { onClose: () => setIsExpertDialogOpen(false), onNavigate: () => {
                    setIsExpertDialogOpen(false);
                    navigate(hardwareMallPath);
                } })) : null] }));
}
function SceneFlow({ title, action, extra, steps, }) {
    return (_jsxs("section", { className: "smart-checkin-flow", "aria-label": title, children: [_jsxs("div", { className: "smart-checkin-section-head", children: [_jsxs("div", { className: "smart-checkin-flow__label", children: [_jsx(FlowIcon, {}), _jsx("h3", { children: title })] }), action ?? extra] }), _jsx("div", { className: "smart-checkin-flow__steps", children: steps.map((step, index) => (_jsxs("div", { className: "smart-checkin-flow__step-group", children: [_jsxs("div", { className: "smart-checkin-step", children: [_jsx("strong", { children: index + 1 }), _jsx("span", { children: step.label })] }), index < steps.length - 1 ? _jsx("div", { className: "smart-checkin-flow__line" }) : null] }, step.id))) })] }));
}
function getFlowStepsForPlan(activePlan, fallbackSteps) {
    if (!activePlan)
        return fallbackSteps;
    switch (activePlan.id) {
        case 'mini-program':
            return [
                { id: 'sms', label: '接收短信' },
                { id: 'mini-program-entry', label: '进入智住小程序' },
                { id: 'identity', label: '身份登记' },
                { id: 'deposit', label: '缴纳押金' },
                { id: 'checkin', label: '办理入住' },
                { id: 'password', label: '查看门锁密码' },
            ];
        case 'wecom-service':
            return [
                { id: 'sms', label: '接收短信' },
                { id: 'wecom', label: '添加企微' },
                { id: 'service', label: '人工接待入住' },
            ];
        case 'wechat-official':
            return [
                { id: 'sms', label: '接收短信' },
                { id: 'follow', label: '关注公众号' },
                { id: 'register', label: '办理登记入住' },
            ];
        default:
            return fallbackSteps;
    }
}
function toGroupModifier(title) {
    switch (title) {
        case '入住办理':
            return 'checkin';
        case '获取房间开门权限':
            return 'door';
        case '连接WIFI':
            return 'wifi';
        default:
            return 'locker';
    }
}
function DeviceIllustration({ kind }) {
    switch (kind) {
        case 'kiosk-desktop':
            return (_jsxs(_Fragment, { children: [_jsx("span", { className: "device-screen" }), _jsx("span", { className: "device-stand" })] }));
        case 'kiosk-wall':
            return (_jsxs(_Fragment, { children: [_jsx("span", { className: "device-panel" }), _jsx("span", { className: "device-base" })] }));
        case 'door-qr':
        case 'door-nfc':
        case 'door-face':
        case 'door-password':
        case 'door-card':
            return (_jsxs(_Fragment, { children: [_jsx("span", { className: "device-door" }), _jsx("span", { className: "device-handle" })] }));
        case 'door-phone':
            return (_jsxs(_Fragment, { children: [_jsx("span", { className: "device-phone" }), _jsx("span", { className: "device-phone-code" })] }));
        case 'wifi-router':
        case 'wifi-router-alt':
            return (_jsxs(_Fragment, { children: [_jsx("span", { className: "device-router" }), _jsx("span", { className: "device-router-antenna device-router-antenna--left" }), _jsx("span", { className: "device-router-antenna device-router-antenna--right" })] }));
        case 'locker':
            return (_jsxs(_Fragment, { children: [_jsx("span", { className: "device-locker" }), _jsx("span", { className: "device-locker-split" })] }));
    }
}
function PurchaseDialog({ planTitle, onClose, onContact, }) {
    return (_jsx("div", { className: "smart-checkin-modal-backdrop", children: _jsxs("div", { className: "smart-checkin-modal", role: "dialog", "aria-modal": "true", "aria-labelledby": "smart-checkin-purchase-title", children: [_jsxs("header", { children: [_jsx("h2", { id: "smart-checkin-purchase-title", children: "\u4ED8\u8D39\u8D2D\u4E70" }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u4ED8\u8D39\u8D2D\u4E70\u5F39\u7A97", onClick: onClose, children: "\u00D7" })] }), _jsxs("div", { className: "smart-checkin-modal__body", children: [_jsx("strong", { children: planTitle }), _jsx("p", { children: "\u5F53\u524D\u95E8\u5E97\u5C1A\u672A\u5F00\u901A\u8BE5\u5165\u4F4F\u65B9\u6848\uFF0C\u53EF\u5148\u8054\u7CFB\u667A\u6167\u9152\u5E97\u4E13\u5BB6\u786E\u8BA4\u5F00\u901A\u65B9\u5F0F\u4E0E\u4EA4\u4ED8\u5468\u671F\u3002" })] }), _jsxs("footer", { children: [_jsx("button", { type: "button", onClick: onClose, children: "\u53D6\u6D88" }), _jsx("button", { type: "button", className: "is-primary", onClick: onContact, children: "\u8054\u7CFB\u4E13\u5BB6" })] })] }) }));
}
function ExpertDialog({ onClose, onNavigate }) {
    return (_jsx("div", { className: "smart-checkin-modal-backdrop", children: _jsxs("section", { className: "smart-checkin-modal smart-checkin-modal--expert", role: "dialog", "aria-modal": "true", "aria-labelledby": "smart-checkin-expert-title", children: [_jsxs("header", { children: [_jsx("h2", { id: "smart-checkin-expert-title", children: "\u667A\u6167\u9152\u5E97\u4E13\u5BB6" }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u4E13\u5BB6\u8054\u7CFB\u5F39\u7A97", onClick: onClose, children: "\u00D7" })] }), _jsxs("div", { className: "smart-checkin-modal__body", children: [_jsx("p", { children: "\u5DF2\u4E3A\u5F53\u524D\u95E8\u5E97\u51C6\u5907\u81EA\u52A9\u673A\u5165\u4F4F\u54A8\u8BE2\u3002" }), _jsxs("ul", { className: "smart-checkin-contact-list", children: [_jsx("li", { children: "\u670D\u52A1\u65F6\u95F4\uFF1A\u6BCF\u65E5 09:00 - 21:00" }), _jsx("li", { children: "\u8054\u7CFB\u7535\u8BDD\uFF1A400-860-1122" }), _jsx("li", { children: "\u8DDF\u8FDB\u65B9\u5F0F\uFF1A\u521B\u5EFA\u54A8\u8BE2\u540E 30 \u5206\u949F\u5185\u56DE\u7535" })] })] }), _jsxs("footer", { children: [_jsx("button", { type: "button", onClick: onClose, children: "\u7A0D\u540E\u5904\u7406" }), _jsx("button", { type: "button", className: "is-primary", onClick: onNavigate, children: "\u524D\u5F80\u786C\u4EF6\u5546\u57CE" })] })] }) }));
}
function CloudIcon() {
    return (_jsx("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: _jsx("path", { d: "M7.4 18.2h8.9a4 4 0 0 0 .5-8 5.1 5.1 0 0 0-9.8-1.2 3.7 3.7 0 0 0 .4 7.2Z" }) }));
}
function PhoneIcon() {
    return (_jsxs("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: [_jsx("rect", { x: "8", y: "4", width: "8", height: "16", rx: "2.4" }), _jsx("path", { d: "M10.5 7.3h3M11.2 17h1.6" })] }));
}
function KioskIcon() {
    return (_jsxs("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: [_jsx("path", { d: "M9 4.8h6a2 2 0 0 1 2 2v5.7a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V6.8a2 2 0 0 1 2-2Z" }), _jsx("path", { d: "M10.2 17.2h3.6l1.2 2H9Z" })] }));
}
function FlowIcon() {
    return (_jsxs("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: [_jsx("rect", { x: "5", y: "5", width: "5", height: "5", rx: "1.2" }), _jsx("rect", { x: "14", y: "14", width: "5", height: "5", rx: "1.2" }), _jsx("path", { d: "M10 7.5h3.4v9H14" })] }));
}
function ChevronIcon() {
    return (_jsx("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: _jsx("path", { d: "m8 10 4 4 4-4" }) }));
}
