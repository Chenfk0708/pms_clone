import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { informationFlowItems, informationRadarMetrics, informationSummaryTags, } from '../data/discovery';
import { CompanyInfoPage } from './CompanyInfoPage';
import './InformationOverviewPage.css';
const flowIconGroups = {
    OTA流量: [
        { label: '途', tone: 'orange' },
        { label: '美团', tone: 'gold' },
        { label: '猪', tone: 'pink' },
        { label: '携', tone: 'blue' },
        { label: '美团', tone: 'yellow' },
        { label: '飞', tone: 'rainbow' },
        { label: '木鸟', tone: 'red' },
        { label: '爱彼', tone: 'gray' },
        { label: 'B.', tone: 'muted' },
        { label: 'T', tone: 'muted-dark' },
        { label: 'C', tone: 'muted' },
        { label: '觅', tone: 'muted' },
    ],
    社媒流量: [
        { label: '小红书', tone: 'muted' },
        { label: '抖', tone: 'muted-dark' },
        { label: '视频号', tone: 'muted-light' },
    ],
    私域流量: [{ label: '企微', tone: 'green' }],
};
const storeOptions = [
    '天落会舍公寓(前海壹方城宝安中心店)',
    '天落会舍公寓(科技园店)',
    '天落会舍公寓(会展中心店)',
];
const channelTabs = [
    { id: 'ctrip', label: '携程酒店' },
    { id: 'meituan', label: '美团民宿' },
];
function buildRadarPoints(values) {
    const center = 120;
    const radius = 88;
    return values
        .map((value, index) => {
        const angle = (-90 + index * 72) * (Math.PI / 180);
        const currentRadius = (radius * value) / 100;
        const x = center + Math.cos(angle) * currentRadius;
        const y = center + Math.sin(angle) * currentRadius;
        return `${x},${y}`;
    })
        .join(' ');
}
export function InformationOverviewPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const [selectedStore, setSelectedStore] = useState(storeOptions[0]);
    const [storeDropdownOpen, setStoreDropdownOpen] = useState(false);
    const [importMenuOpen, setImportMenuOpen] = useState(false);
    const [importDialogMode, setImportDialogMode] = useState(null);
    if (location.pathname === '/InformationMaintenance/companyInfo') {
        return _jsx(CompanyInfoPage, {});
    }
    const radarPoints = buildRadarPoints(informationRadarMetrics.map((item) => item.value));
    return (_jsxs("div", { className: "settings-page information-overview-page", onClick: () => {
            setStoreDropdownOpen(false);
            setImportMenuOpen(false);
        }, children: [_jsxs("div", { className: "information-overview-main", children: [_jsx("section", { className: "settings-summary", children: _jsxs("div", { className: "settings-summary__main", children: [_jsxs("div", { className: "settings-summary__row", children: [_jsx("span", { className: "settings-summary__label", children: "\u95E8\u5E97:" }), _jsxs("div", { className: "settings-store-select-wrap", onClick: (event) => event.stopPropagation(), children: [_jsxs("button", { type: "button", className: "settings-store-select", "aria-haspopup": "listbox", "aria-expanded": storeDropdownOpen, "aria-label": "\u5F53\u524D\u95E8\u5E97", onClick: () => setStoreDropdownOpen((current) => !current), children: [_jsx("span", { className: "settings-store-select__text", children: selectedStore }), _jsx("span", { "aria-hidden": "true", children: "\u25BD" })] }), storeDropdownOpen ? (_jsx("div", { className: "settings-store-select__dropdown", role: "listbox", "aria-label": "\u95E8\u5E97\u5217\u8868", children: storeOptions.map((store) => (_jsx("button", { type: "button", role: "option", "aria-selected": selectedStore === store, className: selectedStore === store ? 'is-selected' : '', onClick: () => {
                                                            setSelectedStore(store);
                                                            setStoreDropdownOpen(false);
                                                        }, children: store }, store))) })) : null] }), _jsx("span", { className: "summary-chip summary-chip--outline", children: "\u6570\u5B57\u5316\u80FD\u529B" }), informationSummaryTags.map((tag) => (_jsx("span", { className: `summary-chip summary-chip--${tag.tone ?? 'blue'}`, children: tag.label }, tag.label))), _jsxs("button", { type: "button", className: "settings-summary__status", onClick: () => navigate('/InformationMaintenance/campInfo'), children: [_jsx("i", { "aria-hidden": "true" }), "\u5DF2\u4E0A\u67B6 | \u4FEE\u6539 >"] })] }), _jsxs("div", { className: "settings-summary__meta", children: [_jsx("span", { children: "\u25CF \u5730\u5740: \u6DF1\u5733\u5B9D\u5B89\u533A\u65B0\u5B89\u8857\u9053\u6D77\u88D5\u793E\u533AN15\u5E78\u798F\u6D77\u5CB8\u82B1\u56ED10\u680B10\u697C \u4E2D\u56FD" }), _jsx("span", { children: "\u260E \u8054\u7CFB\u7535\u8BDD: +86-18123941382" })] })] }) }), _jsxs("section", { className: "settings-panel information-overview-store", children: [_jsxs("div", { className: "settings-panel__header", children: [_jsxs("div", { className: "settings-panel__title", children: [_jsx("h2", { children: "\u95E8\u5E97\u4FE1\u606F" }), _jsx("span", { children: "\u4FE1\u606F\u5B8C\u5584\u5EA6" }), _jsx("em", { children: "\u4E2D\u7B49" })] }), _jsxs("div", { className: "information-overview-action-menu", onClick: (event) => event.stopPropagation(), children: [_jsx("button", { type: "button", "aria-expanded": importMenuOpen, "aria-haspopup": "menu", onClick: () => setImportMenuOpen((current) => !current), children: "\u4E00\u952E\u5BFC\u5165" }), importMenuOpen ? (_jsxs("div", { className: "information-overview-action-menu__dropdown", role: "menu", children: [_jsx("button", { type: "button", role: "menuitem", onClick: () => {
                                                            setImportDialogMode('store');
                                                            setImportMenuOpen(false);
                                                        }, children: "\u5B8C\u5584\u95E8\u5E97\u4FE1\u606F" }), _jsx("button", { type: "button", role: "menuitem", onClick: () => {
                                                            setImportDialogMode('room');
                                                            setImportMenuOpen(false);
                                                        }, children: "\u5B8C\u5584\u623F\u578B\u4FE1\u606F" })] })) : null] })] }), _jsxs("div", { className: "settings-panel__body", children: [_jsxs("div", { className: "radar-panel", children: [_jsxs("svg", { viewBox: "0 0 240 240", className: "radar-chart", "aria-hidden": "true", children: [_jsx("polygon", { points: "120,32 203,92 172,188 68,188 37,92" }), _jsx("polygon", { points: "120,54 184,101 160,174 80,174 56,101" }), _jsx("polygon", { points: "120,78 165,111 148,159 92,159 75,111" }), _jsx("polygon", { points: "120,102 146,120 136,145 104,145 94,120" }), _jsx("polygon", { points: radarPoints, className: "radar-chart__shape" })] }), _jsx("div", { className: "radar-labels", children: informationRadarMetrics.map((item) => (_jsx("span", { children: item.label }, item.label))) })] }), _jsxs("div", { className: "settings-copy", children: [_jsx("h3", { children: "\u5EFA\u8BAE:" }), _jsxs("p", { children: ["1. \u5EFA\u8BAE\u8865\u9F50\u8D44\u8D28\u4FE1\u606F\uFF0C\u5168\u6E20\u9053\u901A\u7528\uFF0C\u5E76\u53EF\u5FEB\u6377\u63D0\u4EA4\u8DEF\u5BA2\u4E91\u8FDB\u884C\u4E00\u952E\u5F00\u6237;", _jsx("a", { href: "/", onClick: (event) => event.preventDefault(), children: "\u53BB\u5B8C\u5584" })] }), _jsxs("p", { children: ["2. \u5B8C\u5584\u95E8\u5E97\u8BE6\u7EC6\u4ECB\u7ECD\u6709\u5229\u4E8E\u7528\u6237\u6DF1\u5EA6\u4E86\u89E3\u95E8\u5E97\u670D\u52A1\u80FD\u529B;", _jsx("a", { href: "/", onClick: (event) => event.preventDefault(), children: "\u53BB\u5B8C\u5584" })] })] })] })] }), _jsxs("section", { className: "settings-panel information-overview-traffic", children: [_jsxs("div", { className: "settings-panel__header", children: [_jsxs("div", { className: "settings-panel__title", children: [_jsx("h2", { children: "\u95E8\u5E97\u6D41\u91CF" }), _jsx("span", { children: "\u6D41\u91CF\u83B7\u53D6\u80FD\u529B" }), _jsx("em", { className: "is-good", children: "\u8F83\u597D" })] }), _jsx("button", { type: "button", onClick: () => navigate('/channels/ota'), children: "\u4E00\u952E\u65B0\u589E" })] }), _jsxs("div", { className: "settings-flow", children: [_jsx("div", { className: "settings-flow__groups", children: informationFlowItems.map((item) => (_jsxs("div", { className: "flow-row", children: [_jsxs("strong", { children: [item.name, _jsxs("span", { children: ["(", item.detail, ")"] })] }), _jsx("div", { className: "flow-icons", children: (flowIconGroups[item.name] ?? []).map((icon, index) => (_jsx("i", { className: `flow-icon flow-icon--${icon.tone}`, children: icon.label }, `${item.name}-${index}`))) })] }, item.name))) }), _jsxs("div", { className: "settings-copy", children: [_jsx("h3", { children: "\u5EFA\u8BAE:" }), _jsx("p", { children: "1. \u5C0F\u7EA2\u4E66\u548C\u6296\u97F3\u6E20\u9053\u6682\u672A\u5F00\u901A\uFF0C\u6E20\u9053\u6BCF\u65E5\u4E0A\u4EBF\u6D41\u91CF\uFF0C\u642D\u8F7D\u56FE\u6587\u548C\u89C6\u9891\uFF0C\u80FD\u591F\u5FEB\u901F\u5438\u5F15\u7528\u6237\uFF0C\u4FC3\u6210\u4E0B\u5355;" })] })] })] })] }), _jsxs("aside", { className: "phone-preview", "aria-label": "\u6570\u5B57\u5316\u95E8\u5E97\u9884\u89C8", children: [_jsx("header", { children: "\u6570\u5B57\u5316\u95E8\u5E97" }), _jsxs("div", { className: "phone-preview__device", children: [_jsxs("div", { className: "phone-preview__chrome", children: [_jsx("span", { children: "\u25D0\u25D1" }), _jsx("span", { children: "\u2315" })] }), _jsxs("div", { className: "phone-preview__status", children: [_jsx("span", { children: "LOCALS" }), _jsx("small", { children: "\u8DEF \u5BA2 \u4E91" })] }), _jsxs("div", { className: "phone-preview__search", children: [_jsx("span", { children: "\u8F93\u5165\u5173\u952E\u8BCD\u641C\u7D22" }), _jsx("em", { children: "\u25CF \u5168\u56FD" })] }), _jsxs("div", { className: "phone-preview__datebar", children: [_jsxs("div", { children: [_jsx("span", { children: "\u5468\u4E09\u5165\u4F4F" }), _jsx("strong", { children: "09\u670814\u65E5" })] }), _jsx("small", { children: "\u51711\u665A" }), _jsxs("div", { children: [_jsx("span", { children: "\u5468\u56DB\u9000\u623F" }), _jsx("strong", { children: "09\u670815\u65E5" })] })] }), _jsx("button", { className: "phone-preview__search-button", type: "button", children: "\u641C\u7D22" }), _jsxs("div", { className: "phone-preview__section-title", children: [_jsx("strong", { children: "\u70ED\u95E8\u5957\u9910" }), _jsx("span", { children: "\u67E5\u770B\u66F4\u591A >" })] }), _jsx("div", { className: "phone-preview__package" }), _jsxs("div", { className: "phone-preview__section-title", children: [_jsx("strong", { children: "\u54C1\u724C\u95E8\u5E97" }), _jsx("span", { children: "\u67E5\u770B\u66F4\u591A >" })] }), _jsxs("article", { className: "phone-preview__store", children: [_jsx("div", {}), _jsx("p", { children: "\u6DF1\u5733\u5B9D\u5B89\u533A\u65B0\u5B89\u8857\u9053\u6D77\u88D5\u793E\u533AN15\u5E78\u798F\u6D77\u5CB8\u82B1\u56ED10\u680B10\u697C \u4E2D\u56FD" }), _jsx("strong", { children: "\u5929\u843D\u4F1A\u820D\u516C\u5BD3(\u524D\u6D77\u58F9\u65B9\u57CE\u5B9D\u5B89\u4E2D\u5FC3\u5E97)" }), _jsx("span", { children: "\u00A5999/\u665A\u8D77" }), _jsx("button", { type: "button", children: "\u67E5\u770B\u8BE6\u60C5" })] }), _jsxs("div", { className: "phone-preview__section-title", children: [_jsx("strong", { children: "\u7CBE\u9009\u623F\u6E90" }), _jsx("span", { children: "\u67E5\u770B\u66F4\u591A >" })] }), _jsx("div", { className: "phone-preview__rooms", children: ['顶层套房(浴缸巨幕电竞麻将)', '总统套间(桑拿浴缸露台电竞麻将)', '天落大床电竞套间', '观影大床房'].map((room) => (_jsxs("article", { children: [_jsx("div", {}), _jsx("span", { children: "2\u5E8A1\u5385\u00B7\u53EF\u4F4F4\u4EBA\u00B71\u536B" }), _jsx("strong", { children: room }), _jsx("em", { children: "\u00A59999/\u665A\u8D77" }), _jsx("button", { type: "button", children: "\u7ACB\u5373\u9884\u8BA2" })] }, room))) })] })] }), importDialogMode ? (_jsx(ChannelImportDialog, { mode: importDialogMode, defaultStore: selectedStore, onClose: () => setImportDialogMode(null) })) : null] }));
}
function ChannelImportDialog({ mode, defaultStore, onClose, }) {
    const layerRef = useRef(null);
    const [activeTab, setActiveTab] = useState('ctrip');
    const [roomType, setRoomType] = useState('prepay');
    const [connectEnabled, setConnectEnabled] = useState(true);
    const [storeDropdownOpen, setStoreDropdownOpen] = useState(false);
    const [selectedStore, setSelectedStore] = useState(defaultStore);
    useEffect(() => {
        setSelectedStore(defaultStore);
    }, [defaultStore]);
    const dialogTitle = mode === 'store' ? '完善门店信息' : '完善房型信息';
    return (_jsx("div", { ref: layerRef, className: "distribution-dialog-layer information-overview-dialog-layer", role: "presentation", onMouseDown: (event) => {
            if (event.target === layerRef.current)
                onClose();
        }, children: _jsxs("section", { className: "distribution-import-dialog information-overview-import-dialog", role: "dialog", "aria-modal": "true", "aria-label": dialogTitle, onMouseDown: (event) => event.stopPropagation(), children: [_jsx("button", { type: "button", className: "distribution-import-dialog__close", "aria-label": "\u5173\u95ED\u5F39\u7A97", onClick: onClose, children: "\u00D7" }), _jsx("p", { className: "distribution-import-dialog__intro", children: "\u8BF7\u9009\u62E9\u60A8\u4E0A\u7EBF\u7684\u6E20\u9053\uFF08\u5355\u9009\uFF09\uFF0C\u9152\u5E97\u6E20\u9053\u80FD\u5BFC\u5165\u7684\u4FE1\u606F\u80FD\u5B8C\u5584~" }), _jsx("div", { className: "distribution-import-dialog__channels", role: "tablist", "aria-label": "\u5BFC\u5165\u6E20\u9053", children: channelTabs
                        .filter((tab) => mode === 'room' || tab.id === 'ctrip')
                        .map((tab) => (_jsx("button", { type: "button", role: "tab", "aria-selected": activeTab === tab.id, className: activeTab === tab.id ? 'is-active' : '', onClick: () => setActiveTab(tab.id), children: tab.label }, tab.id))) }), _jsx("p", { className: "distribution-import-dialog__desc", children: "\u8BF7\u6388\u6743\u6E20\u9053\uFF0C\u6211\u4EEC\u5C06\u4F1A\u4E3A\u60A8\u81EA\u52A8\u76F4\u8FDE\u5E76\u5B8C\u5584\u95E8\u5E97\u4FE1\u606F" }), mode === 'room' && activeTab === 'meituan' ? (_jsxs("div", { className: "information-overview-channel-card-grid", children: [_jsx("article", { className: "information-overview-channel-card", children: _jsxs("dl", { children: [_jsxs("div", { children: [_jsx("dt", { children: "\u8D26\u53F7:" }), _jsx("dd", { children: "\u5929\u843D\u4F1A\u5BBF" })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u8D26\u53F7ID:" }), _jsx("dd", { children: "1801949566888878081" })] })] }) }), _jsx("button", { type: "button", className: "information-overview-channel-card information-overview-channel-card--action", children: _jsx("span", { children: "\uFF0B\u6388\u6743\u6E20\u9053\u8D26\u53F7" }) })] })) : (_jsxs("div", { className: "distribution-import-form information-overview-import-form", children: [_jsxs("label", { className: "distribution-import-form__row", children: [_jsx("span", { children: "\u5F53\u524D\u95E8\u5E97:" }), _jsxs("div", { className: "distribution-import-form__field-wrap", children: [_jsxs("div", { className: "distribution-import-form__select-wrap", children: [_jsxs("button", { type: "button", className: "distribution-import-form__select", "aria-expanded": storeDropdownOpen, onClick: () => setStoreDropdownOpen((current) => !current), children: [_jsx("span", { children: selectedStore }), _jsx("em", { children: "\u25BD" })] }), storeDropdownOpen ? (_jsx("div", { className: "distribution-import-form__dropdown", role: "listbox", "aria-label": "\u9009\u62E9\u95E8\u5E97", children: storeOptions.map((store) => (_jsx("button", { type: "button", role: "option", className: selectedStore === store ? 'is-selected' : '', onClick: () => {
                                                            setSelectedStore(store);
                                                            setStoreDropdownOpen(false);
                                                        }, children: store }, store))) })) : null] }), _jsx("button", { type: "button", className: "distribution-import-form__link", children: "\u65B0\u589E\u95E8\u5E97" })] })] }), _jsxs("div", { className: "distribution-import-form__row", children: [_jsx("span", { children: "\u5B50\u9152\u5E97\u7C7B\u578B:" }), _jsxs("div", { className: "distribution-import-form__radios", children: [_jsxs("label", { children: [_jsx("input", { type: "radio", checked: roomType === 'prepay', onChange: () => setRoomType('prepay') }), _jsx("span", { children: "\u9884\u4ED8" })] }), _jsxs("label", { children: [_jsx("input", { type: "radio", checked: roomType === 'cash', onChange: () => setRoomType('cash') }), _jsx("span", { children: "\u73B0\u4ED8" })] })] })] }), _jsxs("label", { className: "distribution-import-form__row", children: [_jsx("span", { children: "\u5B50\u9152\u5E97ID:" }), _jsxs("div", { className: "distribution-import-form__input-wrap", children: [_jsx("input", { type: "text", placeholder: "\u8BF7\u8F93\u5165\u5B50\u9152\u5E97ID" }), _jsx("button", { type: "button", className: "distribution-import-form__help", "aria-label": "\u67E5\u770B\u5E2E\u52A9", children: "?" })] })] }), _jsxs("label", { className: "distribution-import-form__row", children: [_jsx("span", { children: "\u9152\u5E97\u540D\u79F0:" }), _jsx("input", { type: "text", placeholder: "\u8BF7\u786E\u4FDD\u8F93\u5165\u4E0E\u643A\u7A0B\u4E00\u81F4\u7684\u9152\u5E97\u540D\u79F0" })] }), _jsxs("label", { className: "distribution-import-form__checkbox", children: [_jsx("input", { type: "checkbox", checked: connectEnabled, onChange: () => setConnectEnabled((current) => !current) }), _jsx("span", { children: "\u540C\u65F6\u5B8C\u6210\u643A\u7A0B\u76F4\u8FDE" })] })] })), _jsx("div", { className: "distribution-import-dialog__footer information-overview-import-dialog__footer", children: _jsx("button", { type: "button", className: "distribution-import-dialog__confirm", onClick: onClose, children: "\u786E\u8BA4" }) })] }) }));
}
