import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loadBrandWebsiteData, } from '../services/brandWebsite';
import './BrandWebsitePage.css';
const pageNavGroups = [
    { items: [{ key: 'templates', label: '模板市场' }] },
    {
        title: '系统页面',
        items: [
            { key: 'store', label: '店铺主页' },
            { key: 'profile', label: '个人中心' },
            { key: 'coupon', label: '领券活动' },
        ],
    },
    {
        title: '通用组件',
        items: [
            { key: 'navigation', label: '通用导航' },
            { key: 'float', label: '悬浮框' },
            { key: 'popup', label: '首页弹窗' },
        ],
    },
    { items: [{ key: 'style', label: '全局风格' }] },
];
const METRIC_DETAIL_TITLE = String.fromCharCode(0x6307, 0x6807, 0x8be6, 0x60c5);
const METRIC_DETAIL_CLOSE_LABEL = String.fromCharCode(0x5173, 0x95ed, 0x6307, 0x6807, 0x8be6, 0x60c5);
const decorateCopy = {
    website: {
        pageTitle: '品牌官网',
        activeLabel: '品牌官网',
        activePath: '/mallManagement/weapp/decorate',
        contractTestId: 'brand-website-contract',
        statusLabel: '品牌官网操作反馈',
        loadedNotice: '品牌官网数据已更新',
        refreshedNotice: '品牌官网数据已刷新',
        retryNotice: '已重新加载品牌官网',
        filterNotice: '已按当前条件更新品牌官网',
        resetNotice: '已恢复默认条件',
        exportNotice: '导出任务已创建，可在下载中心查看',
        loadingNotice: '正在更新品牌官网数据',
        errorTitle: '品牌官网数据加载失败',
        emptyTitle: '暂无符合当前条件的品牌官网配置',
        emptyDescription: '可以重置条件后查看默认门店配置，或新建模板方案继续运营。',
        showOperationsHeader: true,
    },
    program: {
        pageTitle: '品牌小程序',
        activeLabel: '品牌小程序',
        activePath: '/channels/private/program',
        contractTestId: 'brand-program-contract',
        statusLabel: '品牌小程序操作反馈',
        loadedNotice: '品牌小程序页面已更新',
        refreshedNotice: '品牌小程序页面已刷新',
        retryNotice: '已重新加载品牌小程序页面',
        filterNotice: '已按当前条件更新品牌小程序页面',
        resetNotice: '已恢复默认条件',
        exportNotice: '品牌小程序页面已刷新',
        loadingNotice: '正在更新品牌小程序页面',
        errorTitle: '品牌小程序页面加载失败',
        emptyTitle: '暂无符合当前条件的品牌小程序配置',
        emptyDescription: '可以重置条件后查看默认门店配置，或继续调整页面内容。',
        showOperationsHeader: false,
    },
};
function initialState(copy) {
    try {
        return { kind: 'ready', data: loadBrandWebsiteData() };
    }
    catch (error) {
        return { kind: 'error', message: error instanceof Error ? error.message : copy.errorTitle };
    }
}
export function BrandWebsitePage({ variant = 'website' }) {
    const copy = decorateCopy[variant];
    const navigate = useNavigate();
    const [active, setActive] = useState('templates');
    const [state, setState] = useState(() => initialState(copy));
    const [query, setQuery] = useState({ campId: 'camp-ts5', businessDate: '2026-05-18', keyword: '' });
    const [notice, setNotice] = useState(copy.loadedNotice);
    const [isLoading, setIsLoading] = useState(false);
    const [metricDetail, setMetricDetail] = useState(null);
    const [templateDetail, setTemplateDetail] = useState(null);
    const [couponDetail, setCouponDetail] = useState(null);
    const [appliedTemplateId, setAppliedTemplateId] = useState(null);
    const data = state.kind === 'ready' ? state.data : null;
    function loadWithFeedback(nextQuery = query, message = copy.refreshedNotice) {
        setIsLoading(true);
        window.setTimeout(() => {
            try {
                const next = loadBrandWebsiteData(nextQuery);
                setState({ kind: 'ready', data: next });
                setNotice(message);
            }
            catch (error) {
                setState({ kind: 'error', message: error instanceof Error ? error.message : copy.errorTitle });
            }
            finally {
                setIsLoading(false);
            }
        }, 120);
    }
    function retry() {
        window.localStorage.setItem('pms.brandWebsiteMockMode', 'success');
        loadWithFeedback(query, copy.retryNotice);
    }
    function resetFilters() {
        const nextQuery = { campId: 'camp-ts5', businessDate: '2026-05-18', keyword: '' };
        setQuery(nextQuery);
        loadWithFeedback(nextQuery, copy.resetNotice);
    }
    function updateSection(section) {
        setActive(section);
        setNotice(`已切换到${pageNavGroups.flatMap((group) => group.items).find((item) => item.key === section)?.label}`);
    }
    if (state.kind === 'error') {
        return (_jsxs(BrandShell, { active: active, onSectionChange: updateSection, activeLabel: copy.activeLabel, activePath: copy.activePath, children: [_jsxs("section", { className: "brand-state-card", role: "alert", children: [_jsx("h1", { children: copy.errorTitle }), _jsx("p", { children: state.message }), _jsx("button", { type: "button", onClick: retry, children: "\u91CD\u8BD5" })] }), copy.showOperationsHeader ? _jsx(ActionStatus, { message: notice, label: copy.statusLabel }) : null] }));
    }
    if (!data)
        return null;
    return (_jsxs(BrandShell, { active: active, onSectionChange: updateSection, activeLabel: copy.activeLabel, activePath: copy.activePath, children: [copy.showOperationsHeader ? (_jsxs("header", { className: "brand-toolbar", "aria-label": `${copy.pageTitle}筛选区`, children: [_jsxs("div", { children: [_jsx("h1", { children: copy.pageTitle }), _jsxs("p", { children: [data.camp.name, "\uFF0C", data.businessDate, " \u8FD0\u8425\u6982\u89C8"] })] }), _jsxs("label", { children: [_jsx("span", { children: "\u95E8\u5E97" }), _jsx("select", { "aria-label": "\u95E8\u5E97", value: query.campId, onChange: (event) => setQuery((current) => ({ ...current, campId: event.target.value })), disabled: isLoading, children: data.stores.map((store) => (_jsx("option", { value: store.id, children: store.name }, store.id))) })] }), _jsxs("label", { children: [_jsx("span", { children: "\u8FD0\u8425\u65E5\u671F" }), _jsx("input", { "aria-label": "\u8FD0\u8425\u65E5\u671F", type: "date", value: query.businessDate, onChange: (event) => setQuery((current) => ({ ...current, businessDate: event.target.value })), disabled: isLoading })] }), _jsx("button", { type: "button", onClick: () => loadWithFeedback(query, copy.filterNotice), disabled: isLoading, children: "\u67E5\u8BE2" }), _jsx("button", { type: "button", onClick: resetFilters, disabled: isLoading, children: "\u91CD\u7F6E" }), _jsx("button", { type: "button", onClick: () => loadWithFeedback(query, copy.refreshedNotice), disabled: isLoading, children: "\u5237\u65B0" }), _jsx("button", { type: "button", onClick: () => setNotice(copy.exportNotice), disabled: isLoading, children: "\u5BFC\u51FA" })] })) : null, copy.showOperationsHeader ? _jsx(ActionStatus, { message: isLoading ? copy.loadingNotice : notice, label: copy.statusLabel }) : null, _jsx("span", { className: "brand-contract", "data-testid": copy.contractTestId, children: JSON.stringify(data.contract) }), _jsxs("main", { className: "brand-workspace", children: [copy.showOperationsHeader ? (_jsx(MetricStrip, { data: data, onMetricDetail: (metric) => {
                            setMetricDetail(metric);
                            setNotice(`已查看${metric.label}详情`);
                        } })) : null, data.templates.length === 0 ? (_jsxs("section", { className: "brand-state-card", role: "status", "aria-label": `${copy.pageTitle}空态`, children: [_jsx("h2", { children: copy.emptyTitle }), _jsx("p", { children: copy.emptyDescription }), _jsx("button", { type: "button", onClick: resetFilters, children: "\u91CD\u7F6E\u6761\u4EF6" })] })) : (_jsx(BrandWorkspace, { active: active, data: data, keyword: query.keyword, onKeywordChange: (keyword) => setQuery((current) => ({ ...current, keyword })), onSearchCoupons: () => loadWithFeedback(query, '已筛选领券活动'), appliedTemplateId: appliedTemplateId, onTemplateApply: (template) => {
                            setAppliedTemplateId(template.id);
                            setNotice(`已应用${template.name}`);
                        }, onTemplateDetail: setTemplateDetail, onCouponDetail: setCouponDetail, onNavigate: (path) => navigate(path), onNotice: setNotice }))] }), templateDetail ? (_jsxs(BrandDialog, { title: "\u6A21\u677F\u8BE6\u60C5", closeLabel: "\u5173\u95ED\u6A21\u677F\u8BE6\u60C5", onClose: () => setTemplateDetail(null), children: [_jsx("h3", { children: templateDetail.name }), _jsx("p", { children: templateDetail.scene }), _jsx("div", { className: "brand-dialog-swatches", children: templateDetail.colors.map((color) => (_jsx("span", { style: { backgroundColor: color } }, color))) })] })) : null, metricDetail ? (_jsxs(BrandDialog, { title: METRIC_DETAIL_TITLE, closeLabel: METRIC_DETAIL_CLOSE_LABEL, onClose: () => setMetricDetail(null), children: [_jsx("h3", { children: metricDetail.label }), _jsxs("p", { children: [metricDetail.value, metricDetail.unit] }), _jsx("p", { children: metricDetail.trend })] })) : null, couponDetail ? (_jsxs(BrandDialog, { title: "\u6D3B\u52A8\u8BE6\u60C5", closeLabel: "\u5173\u95ED\u6D3B\u52A8\u8BE6\u60C5", onClose: () => setCouponDetail(null), children: [_jsx("h3", { children: couponDetail.name }), _jsx("p", { children: couponDetail.validPeriod }), _jsxs("p", { children: ["\u5FAE\u4FE1 ", couponDetail.wechatViews, " \u6B21\uFF0C\u6296\u97F3 ", couponDetail.douyinViews, " \u6B21\uFF0C\u5C0F\u7EA2\u4E66 ", couponDetail.redbookViews, " \u6B21\u3002"] })] })) : null] }));
}
function BrandShell({ active, children, onSectionChange, activeLabel, activePath, }) {
    return (_jsxs("div", { className: "brand-website-page", children: [_jsxs("aside", { className: "brand-module-menu", "aria-label": "OTA \u79C1\u57DF\u5BFC\u822A", children: [_jsx(Link, { to: "/channels/ota", children: "OTA" }), _jsx(Link, { to: "/channels/social", children: "\u793E\u5A92" }), _jsxs("div", { className: "brand-module-menu__group is-open", children: [_jsx("span", { children: "\u79C1\u57DF" }), _jsx(Link, { to: "/channels/private", children: "\u79C1\u57DF\u6E20\u9053" }), _jsx(Link, { className: "is-active", to: activePath, children: activeLabel })] }), _jsx("small", { children: "\u7248\u672C\u53F7\uFF1Av4.10.7" })] }), _jsxs("section", { className: "brand-decorate-shell", children: [_jsxs("nav", { className: "brand-page-nav", "aria-label": "\u9875\u9762\u5BFC\u822A", children: [_jsx("h2", { children: "\u9875\u9762\u5BFC\u822A" }), pageNavGroups.map((group, groupIndex) => (_jsxs("div", { className: "brand-page-nav__group", children: [group.title ? _jsx("p", { children: group.title }) : null, group.items.map((item) => (_jsx("button", { type: "button", className: active === item.key ? 'is-active' : '', onClick: () => onSectionChange(item.key), children: item.label }, item.key)))] }, group.title ?? `group-${groupIndex}`)))] }), _jsx("section", { className: "brand-main-panel", children: children })] })] }));
}
function ActionStatus({ message, label }) {
    return (_jsx("div", { className: "brand-action-status", role: "status", "aria-label": label, children: message }));
}
function MetricStrip({ data, onMetricDetail, }) {
    return (_jsx("section", { className: "brand-metric-strip", "aria-label": "\u54C1\u724C\u5B98\u7F51\u6838\u5FC3\u6307\u6807", children: data.metrics.map((metric) => (_jsxs("button", { type: "button", onClick: () => onMetricDetail(metric), children: [_jsx("span", { children: metric.label }), _jsx("strong", { children: metric.value }), _jsx("em", { children: metric.unit }), _jsx("small", { children: metric.trend })] }, metric.id))) }));
}
function BrandWorkspace({ active, data, keyword, appliedTemplateId, onKeywordChange, onSearchCoupons, onTemplateApply, onTemplateDetail, onCouponDetail, onNavigate, onNotice, }) {
    if (active === 'store')
        return _jsx(StoreEditor, { data: data, onNavigate: onNavigate, onNotice: onNotice });
    if (active === 'profile')
        return _jsx(ProfileEditor, { data: data, onNotice: onNotice });
    if (active === 'coupon') {
        return (_jsx(CouponState, { coupons: data.coupons, keyword: keyword, onKeywordChange: onKeywordChange, onSearch: onSearchCoupons, onDetail: onCouponDetail, onNotice: onNotice }));
    }
    if (active === 'navigation')
        return _jsx(NavigationState, { data: data, onNotice: onNotice });
    if (active === 'float')
        return _jsx(ComponentState, { title: "\u60AC\u6D6E\u6846", enabled: data.pageConfig.floatingButtonEnabled, onNotice: onNotice });
    if (active === 'popup')
        return _jsx(ComponentState, { title: "\u9996\u9875\u5F39\u7A97", enabled: data.pageConfig.popupEnabled, onNotice: onNotice });
    if (active === 'style')
        return _jsx(StyleState, { data: data, onNotice: onNotice });
    return _jsx(TemplateMarket, { templates: data.templates, appliedTemplateId: appliedTemplateId, onApply: onTemplateApply, onDetail: onTemplateDetail });
}
function TemplateMarket({ templates, appliedTemplateId, onApply, onDetail, }) {
    return (_jsx("div", { className: "brand-template-market", children: templates.map((template) => (_jsxs("section", { className: "brand-template", children: [_jsxs("header", { className: "brand-template__head", children: [_jsxs("div", { children: [_jsx("h2", { children: template.name }), _jsx("p", { children: template.scene })] }), _jsxs("button", { type: "button", onClick: () => onApply(template), children: [_jsx("span", { children: template.name }), ' ', _jsx("b", { children: appliedTemplateId === template.id || (!appliedTemplateId && template.status === 'using') ? '已使用' : '一键使用' })] }), _jsxs("button", { type: "button", className: "brand-secondary-button", onClick: () => onDetail(template), children: ["\u67E5\u770B", template.name, "\u8BE6\u60C5"] })] }), _jsxs("div", { className: "brand-template__colors", children: [_jsx("strong", { children: "\u989C\u8272\u9009\u62E9" }), template.colors.map((color) => (_jsx("span", { className: "brand-template__swatch", style: { backgroundColor: color } }, `${template.id}-${color}`)))] }), _jsxs("div", { className: "brand-template__phones", children: [_jsx(TemplatePhone, { src: template.previewImage, label: "\u9996\u9875" }), _jsx(TemplatePhone, { src: template.profileImage, label: "\u4E2A\u4EBA\u4E2D\u5FC3" })] })] }, template.id))) }));
}
function TemplatePhone({ src, label }) {
    return (_jsxs("figure", { className: "brand-template-phone", children: [_jsxs("div", { className: "brand-template-phone__image", children: [_jsx("img", { src: src, alt: `${label}预览` }), _jsx("span", { children: "\u9884\u89C8" })] }), _jsx("figcaption", { children: label })] }));
}
function StoreEditor({ data, onNavigate, onNotice, }) {
    return (_jsxs("div", { className: "brand-editor-state", children: [_jsx(PhonePreview, { data: data }), _jsxs(DetailPanel, { title: "\u5E97\u94FA\u4E3B\u9875", children: [_jsxs("div", { className: "brand-store-row", children: [_jsx("span", { children: data.pageConfig.storeName }), _jsx("button", { type: "button", onClick: () => onNotice('店铺主页配置已保存'), children: "\u4FDD\u5B58\u914D\u7F6E" })] }), _jsx("div", { className: "brand-route-grid", children: data.routeTargets.map((target) => (_jsxs("button", { type: "button", onClick: () => onNavigate(target.path), children: ["\u524D\u5F80", target.label] }, target.path))) })] })] }));
}
function ProfileEditor({ data, onNotice }) {
    return (_jsxs("div", { className: "brand-editor-state", children: [_jsx(ProfilePreview, {}), _jsxs(DetailPanel, { title: "\u4E2A\u4EBA\u4E2D\u5FC3", children: [_jsxs("div", { className: "brand-store-row", children: [_jsxs("span", { children: [data.pageConfig.storeName, "\u4F1A\u5458\u4E2D\u5FC3"] }), _jsx("button", { type: "button", onClick: () => onNotice('个人中心配置已保存'), children: "\u4FDD\u5B58\u914D\u7F6E" })] }), _jsx(TodoList, { todos: data.todos, onNotice: onNotice })] })] }));
}
function PhonePreview({ data }) {
    return (_jsxs("div", { className: "brand-phone brand-phone--home", children: [_jsx(MiniTop, { title: "\u9996\u9875" }), _jsxs("div", { className: "brand-hero", children: [_jsx("div", { className: "brand-hero__logo", children: "LOCALS" }), _jsx("div", { className: "brand-hero__cn", children: data.pageConfig.heroTitle })] }), _jsxs("div", { className: "brand-search-card", children: [_jsxs("div", { className: "brand-search-card__row", children: [_jsx("span", { children: "\u8F93\u5165\u5173\u952E\u8BCD\u641C\u7D22" }), _jsx("em", { children: "\u5168\u56FD" })] }), _jsxs("div", { className: "brand-date-row", children: [_jsxs("div", { children: [_jsx("small", { children: "\u5468\u4E09\u5165\u4F4F" }), _jsx("strong", { children: "05\u670818\u65E5" })] }), _jsx("span", { children: "\u51711\u665A" }), _jsxs("div", { children: [_jsx("small", { children: "\u5468\u56DB\u9000\u623F" }), _jsx("strong", { children: "05\u670819\u65E5" })] })] }), _jsx("button", { type: "button", children: "\u641C\u7D22" })] }), _jsx(PhoneSectionTitle, { title: "\u70ED\u95E8\u5957\u9910" }), _jsx(PhoneSectionTitle, { title: "\u54C1\u724C\u95E8\u5E97" })] }));
}
function MiniTop({ title }) {
    return (_jsxs("div", { className: "brand-phone__top", children: [_jsx("span", { children: "9:41" }), _jsx("strong", { children: title }), _jsx("span", { className: "brand-phone__capsule", children: "\u2022\u2022\u2022" })] }));
}
function PhoneSectionTitle({ title }) {
    return (_jsxs("div", { className: "brand-phone-title", children: [_jsx("strong", { children: title }), _jsx("span", { children: "\u67E5\u770B\u66F4\u591A >" })] }));
}
function ProfilePreview() {
    const orderItems = ['待支付', '待入住', '已完成', '已取消'];
    const listItems = ['微商城订单', '我的优惠券', '分销钱包', '服务资质', '联系我们'];
    return (_jsxs("div", { className: "brand-phone brand-phone--profile", children: [_jsx(MiniTop, { title: "\u4E2A\u4EBA\u4E2D\u5FC3" }), _jsxs("div", { className: "brand-user", children: [_jsx("span", { children: "\u4F1A" }), _jsx("strong", { children: "\u7528\u6237\u6635\u79F0" })] }), _jsxs("section", { className: "brand-order-card", children: [_jsxs("header", { children: [_jsx("strong", { children: "\u6211\u7684\u8BA2\u5355" }), _jsx("span", { children: "\u5168\u90E8\u8BA2\u5355" })] }), _jsx("div", { className: "brand-order-icons", children: orderItems.map((item) => (_jsxs("div", { children: [_jsx("span", { children: "\u25A1" }), _jsx("small", { children: item })] }, item))) })] }), _jsx("div", { className: "brand-profile-list", children: listItems.map((item) => (_jsxs("div", { children: [_jsx("span", { children: item }), _jsx("b", { children: ">" })] }, item))) })] }));
}
function CouponState({ coupons, keyword, onKeywordChange, onSearch, onDetail, onNotice, }) {
    return (_jsxs("div", { className: "brand-management-state", children: [_jsxs("form", { className: "brand-coupon-filter", "aria-label": "\u9886\u5238\u6D3B\u52A8\u7B5B\u9009", onSubmit: (event) => event.preventDefault(), children: [_jsxs("label", { children: [_jsx("span", { children: "\u6D3B\u52A8\u540D\u79F0" }), _jsx("input", { value: keyword, placeholder: "\u8BF7\u8F93\u5165\u6D3B\u52A8\u540D\u79F0", onChange: (event) => onKeywordChange(event.target.value) })] }), _jsx("button", { type: "button", onClick: onSearch, children: "\u641C\u7D22\u6D3B\u52A8" }), _jsx("button", { type: "button", onClick: () => onKeywordChange(''), children: "\u6E05\u7A7A" })] }), _jsxs("div", { className: "brand-table-toolbar", children: [_jsx("button", { type: "button", onClick: () => onDetail(coupons[0]), children: "\u65B0\u5EFA\u6D3B\u52A8" }), _jsx("button", { type: "button", onClick: () => onNotice('活动列表已刷新'), children: "\u5237\u65B0\u6D3B\u52A8" })] }), _jsxs("div", { className: "brand-coupon-table", "aria-label": "\u9886\u5238\u6D3B\u52A8\u8868\u683C", children: [_jsxs("div", { className: "brand-coupon-table__head", children: [_jsx("span", { children: "\u6D3B\u52A8\u9875\u9762\u540D\u79F0" }), _jsx("span", { children: "\u72B6\u6001" }), _jsx("span", { children: "\u6D3B\u52A8\u65F6\u95F4" }), _jsx("span", { children: "\u5FAE\u4FE1\u8BBF\u95EE" }), _jsx("span", { children: "\u6296\u97F3\u8BBF\u95EE" }), _jsx("span", { children: "\u5C0F\u7EA2\u4E66\u8BBF\u95EE" }), _jsx("span", { children: "\u64CD\u4F5C" })] }), coupons.map((coupon) => (_jsxs("div", { className: "brand-coupon-table__row", children: [_jsx("span", { children: coupon.name }), _jsx("span", { children: readCouponStatus(coupon.status) }), _jsx("span", { children: coupon.validPeriod }), _jsx("span", { children: coupon.wechatViews }), _jsx("span", { children: coupon.douyinViews }), _jsx("span", { children: coupon.redbookViews }), _jsx("button", { type: "button", onClick: () => onDetail(coupon), children: "\u67E5\u770B\u8BE6\u60C5" })] }, coupon.id)))] })] }));
}
function NavigationState({ data, onNotice }) {
    return (_jsxs("div", { className: "brand-editor-state", children: [_jsxs("div", { className: "brand-phone-stage", children: [_jsx(PhonePreview, { data: data }), _jsx("div", { className: "brand-bottom-nav", children: data.pageConfig.bottomNavigation.map((item) => (_jsx("span", { children: item.label }, item.id))) })] }), _jsxs(DetailPanel, { title: "\u5E95\u90E8\u5BFC\u822A", children: [data.pageConfig.bottomNavigation.map((item, index) => (_jsxs("label", { className: "brand-nav-card", children: [_jsxs("span", { children: ["\u5BFC\u822A", index + 1] }), _jsx("input", { defaultValue: item.label })] }, item.id))), _jsx(SaveBar, { onNotice: onNotice })] })] }));
}
function ComponentState({ title, enabled, onNotice, }) {
    return (_jsxs("div", { className: "brand-editor-state", children: [_jsx(EmptyPhone, { dim: title === '首页弹窗' }), _jsxs(DetailPanel, { title: title, children: [_jsxs("div", { className: "brand-radio-row", children: [_jsx("b", { children: "\u662F\u5426\u5F00\u542F" }), _jsxs("label", { children: [_jsx("input", { type: "radio", name: title, defaultChecked: !enabled }), " \u4E0D\u542F\u7528"] }), _jsxs("label", { children: [_jsx("input", { type: "radio", name: title, defaultChecked: enabled }), " \u542F\u7528"] })] }), _jsx("button", { type: "button", className: "brand-upload", onClick: () => onNotice(`${title}素材已上传`), children: "\u70B9\u51FB\u4E0A\u4F20" }), _jsx(SaveBar, { onNotice: onNotice })] })] }));
}
function StyleState({ data, onNotice }) {
    return (_jsxs("div", { className: "brand-editor-state", children: [_jsxs("div", { className: "brand-global-preview", children: [_jsx("h2", { children: "\u5F53\u524D\u5C0F\u7A0B\u5E8F\u5C55\u793A" }), _jsx(PhonePreview, { data: data })] }), _jsxs(DetailPanel, { title: "\u9009\u62E9\u989C\u8272", children: [_jsx("div", { className: "brand-style-swatches", children: data.templates[0]?.colors.map((color) => (_jsx("button", { type: "button", style: { backgroundColor: color }, onClick: () => onNotice('全局风格颜色已更新') }, color))) }), _jsx(SaveBar, { onNotice: onNotice })] })] }));
}
function EmptyPhone({ dim = false }) {
    return (_jsx("div", { className: `brand-phone brand-phone--empty${dim ? ' is-dimmed' : ''}`, children: _jsx(MiniTop, { title: "" }) }));
}
function DetailPanel({ title, children }) {
    return (_jsxs("aside", { className: "brand-detail-panel", children: [_jsx("h2", { children: title }), _jsx("div", { className: "brand-detail-panel__line" }), children] }));
}
function TodoList({ todos, onNotice }) {
    return (_jsx("div", { className: "brand-todo-list", children: todos.map((todo) => (_jsxs("button", { type: "button", onClick: () => onNotice(`${todo.title}已标记处理`), children: [_jsx("strong", { children: todo.title }), _jsxs("span", { children: [todo.owner, " \u00B7 ", todo.dueText] })] }, todo.id))) }));
}
function SaveBar({ onNotice }) {
    return (_jsx("div", { className: "brand-savebar", children: _jsx("button", { type: "button", onClick: () => onNotice('配置已保存并发布'), children: "\u4FDD\u5B58\u5E76\u53D1\u5E03" }) }));
}
function BrandDialog({ title, closeLabel, children, onClose, }) {
    return (_jsx("div", { className: "brand-dialog-backdrop", role: "presentation", onClick: onClose, children: _jsxs("section", { className: "brand-dialog", role: "dialog", "aria-label": title, onClick: (event) => event.stopPropagation(), children: [_jsxs("header", { children: [_jsx("h2", { children: title }), _jsx("button", { type: "button", onClick: onClose, children: closeLabel })] }), children] }) }));
}
function readCouponStatus(status) {
    if (status === 'active')
        return '进行中';
    if (status === 'scheduled')
        return '未开始';
    return '已暂停';
}
