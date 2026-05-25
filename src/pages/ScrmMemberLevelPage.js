import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useState } from 'react';
import { fetchScrmMemberLevelDashboard, saveScrmMemberLevel, saveScrmMemberUpgradeRule, } from '../services/scrmMemberLevel';
import './ScrmMemberLevelPage.css';
const DEFAULT_FILTERS = {
    storeId: 'all',
    status: 'all',
    keyword: '',
    page: 1,
    pageSize: 20,
    mockState: 'success',
};
function LevelDialog({ mode, level, isSaving, onClose, onSave, }) {
    const isEdit = mode === 'edit';
    const title = isEdit ? '编辑会员等级' : '新建会员等级';
    const [name, setName] = useState(level?.name ?? '');
    const [cardColor, setCardColor] = useState(level?.cardColor ?? '#d7b48e');
    const rank = level?.rank ?? 2;
    function handleSubmit(event) {
        event.preventDefault();
        onSave({ id: level?.id, name, rank, cardColor });
    }
    return (_jsx("div", { className: "scrm-member-overlay", role: "presentation", children: _jsxs("section", { className: "scrm-member-modal", role: "dialog", "aria-modal": "true", "aria-labelledby": "scrm-member-level-dialog-title", children: [_jsxs("header", { className: "scrm-member-modal__header", children: [_jsx("h2", { id: "scrm-member-level-dialog-title", children: title }), _jsx("button", { type: "button", className: "scrm-member-close", "aria-label": "\u5173\u95ED", onClick: onClose, children: "\u00D7" })] }), _jsxs("form", { className: "scrm-member-form", onSubmit: handleSubmit, children: [_jsxs("label", { className: "scrm-member-field scrm-member-field--required", children: [_jsx("span", { children: "\u7B49\u7EA7\u540D\u79F0\uFF1A" }), _jsx("input", { "aria-label": "\u7B49\u7EA7\u540D\u79F0", placeholder: "\u8BF7\u8F93\u5165\u7B49\u7EA7\u540D\u79F0", value: name, onChange: (event) => setName(event.target.value) })] }), _jsxs("label", { className: "scrm-member-field", children: [_jsx("span", { children: "\u4F1A\u5458\u7B49\u7EA7\uFF1A" }), _jsx("input", { className: "is-short", "aria-label": "\u4F1A\u5458\u7B49\u7EA7", value: rank, disabled: true, readOnly: true })] }), _jsxs("div", { className: "scrm-member-field scrm-member-inline-field", children: [_jsx("span", { children: "\u514D\u8D39\u5347\u7EA7\u6761\u4EF6\uFF1A" }), _jsx("input", { className: "is-short", value: "0", readOnly: true, "aria-label": "\u5347\u7EA7\u6D88\u8D39\u6B21\u6570" }), _jsx("em", { children: "\u6B21\u6D88\u8D39\uFF0C\u6216" }), _jsx("input", { className: "is-short", value: "0", readOnly: true, "aria-label": "\u5347\u7EA7\u4F4F\u5BBF\u5929\u6570" }), _jsx("em", { children: "\u5929" })] }), _jsxs("div", { className: "scrm-member-field scrm-member-inline-field scrm-member-discount-row", children: [_jsx("span", { children: "\u4F1A\u5458\u6298\u6263\uFF1A" }), _jsx("em", { children: "\u623F\u6E90" }), _jsx("input", { className: "is-short", value: "1", readOnly: true, "aria-label": "\u623F\u6E90\u6298\u6263" }), _jsx("em", { children: "\u6298\uFF0C\u5546\u54C1" }), _jsx("input", { className: "is-short", value: "1", readOnly: true, "aria-label": "\u5546\u54C1\u6298\u6263" }), _jsx("em", { children: "\u6298" }), _jsx("small", { children: "\u6298\u6263\u8BF7\u8F93\u5165 0-10" })] }), _jsxs("label", { className: "scrm-member-field", children: [_jsx("span", { children: "\u4F1A\u5458\u5361\u9762\uFF1A" }), _jsx("input", { "aria-label": "\u4F1A\u5458\u5361\u9762\u989C\u8272", className: "scrm-member-color-input", type: "color", value: cardColor, onChange: (event) => setCardColor(event.target.value) })] }), _jsxs("label", { className: "scrm-member-field", children: [_jsx("span", { children: "\u4F1A\u5458\u6743\u76CA\uFF1A" }), _jsx("input", { "aria-label": "\u4F1A\u5458\u6743\u76CA", placeholder: "\u8BF7\u9009\u62E9\u4F1A\u5458\u6743\u76CA", value: level?.benefits === '-' ? '' : level?.benefits ?? '', readOnly: true })] }), _jsxs("footer", { className: "scrm-member-modal__footer", children: [_jsx("button", { type: "button", className: "scrm-member-ghost-button", onClick: onClose, disabled: isSaving, children: "\u53D6\u6D88" }), _jsx("button", { type: "submit", className: "scrm-member-primary-button", disabled: isSaving, children: "\u63D0\u4EA4\u4F1A\u5458\u7B49\u7EA7" })] })] })] }) }));
}
function UpgradeSettingsDrawer({ dashboard, isSaving, onClose, onSave, }) {
    const selectedRule = dashboard.upgradeRules.find((rule) => rule.selected)?.id ?? dashboard.upgradeRules[0]?.id ?? '';
    const [ruleId, setRuleId] = useState(selectedRule);
    return (_jsx("div", { className: "scrm-member-drawer-layer", role: "presentation", children: _jsxs("section", { className: "scrm-member-drawer", role: "dialog", "aria-modal": "true", "aria-labelledby": "scrm-member-upgrade-title", children: [_jsxs("header", { className: "scrm-member-drawer__header", children: [_jsx("h2", { id: "scrm-member-upgrade-title", children: "\u4F1A\u5458\u5347\u7EA7\u8BBE\u7F6E" }), _jsx("button", { type: "button", className: "scrm-member-close", "aria-label": "\u5173\u95ED", onClick: onClose, children: "\u00D7" })] }), _jsxs("div", { className: "scrm-member-drawer__body", children: [_jsxs("section", { className: "scrm-member-rule-block", children: [_jsx("h3", { children: "\u8BA1\u7B97\u7D2F\u8BA1\u65F6\u95F4\u6BB5" }), _jsxs("label", { className: "scrm-member-radio", children: [_jsx("input", { type: "radio", name: "member-cycle", defaultChecked: true }), _jsx("span", { children: "\u4E00\u4E2A\u81EA\u7136\u5E74" })] })] }), _jsxs("section", { className: "scrm-member-rule-block", children: [_jsx("h3", { children: "\u4F1A\u5458\u5347\u7EA7\u89C4\u5219" }), _jsx("div", { className: "scrm-member-rule-list", children: dashboard.upgradeRules.map((rule) => (_jsxs("label", { className: "scrm-member-radio", children: [_jsx("input", { type: "radio", name: "member-upgrade-rule", "aria-label": rule.id === 'stay-days' ? '用户总计成功预订的天数' : rule.label, checked: ruleId === rule.id, onChange: () => setRuleId(rule.id) }), _jsx("span", { children: rule.label })] }, rule.id))) })] })] }), _jsxs("footer", { className: "scrm-member-drawer__footer", children: [_jsx("button", { type: "button", className: "scrm-member-ghost-button", onClick: onClose, disabled: isSaving, children: "\u53D6\u6D88" }), _jsx("button", { type: "button", className: "scrm-member-primary-button", onClick: () => onSave(ruleId), disabled: isSaving, children: "\u4FDD\u5B58\u5347\u7EA7\u8BBE\u7F6E" })] })] }) }));
}
export function ScrmMemberLevelPage() {
    const [dashboard, setDashboard] = useState(null);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [dialogMode, setDialogMode] = useState(null);
    const [selectedLevel, setSelectedLevel] = useState(null);
    const [showUpgradeDrawer, setShowUpgradeDrawer] = useState(false);
    const loadDashboard = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const nextDashboard = await fetchScrmMemberLevelDashboard(DEFAULT_FILTERS);
            setDashboard(nextDashboard);
        }
        catch (loadError) {
            const message = loadError instanceof Error ? loadError.message : '会员等级加载失败，请稍后重试';
            setError(message);
            setDashboard(null);
        }
        finally {
            setIsLoading(false);
        }
    }, []);
    useEffect(() => {
        void loadDashboard();
    }, [loadDashboard]);
    function openCreateDialog() {
        setSelectedLevel(null);
        setDialogMode('create');
    }
    function openEditDialog(level) {
        setSelectedLevel(level);
        setDialogMode('edit');
    }
    async function handleSaveLevel(input) {
        setIsSaving(true);
        try {
            await saveScrmMemberLevel({
                ...input,
                roomDiscount: '1',
                goodsDiscount: '1',
                benefitIds: [],
            });
            setDialogMode(null);
            await loadDashboard();
        }
        catch (saveError) {
            setError(saveError instanceof Error ? saveError.message : '会员等级保存失败，请稍后重试');
        }
        finally {
            setIsSaving(false);
        }
    }
    async function handleSaveUpgradeRule(ruleId) {
        setIsSaving(true);
        try {
            await saveScrmMemberUpgradeRule(ruleId);
            setShowUpgradeDrawer(false);
            await loadDashboard();
        }
        catch (saveError) {
            setError(saveError instanceof Error ? saveError.message : '升级设置保存失败，请稍后重试');
        }
        finally {
            setIsSaving(false);
        }
    }
    return (_jsxs("div", { className: "scrm-member-level-page", children: [_jsxs("section", { className: "scrm-member-level-panel", children: [_jsxs("header", { className: "scrm-member-level-panel__header", children: [_jsxs("div", { className: "scrm-member-title", children: [_jsx("h1", { children: "\u4F1A\u5458\u7B49\u7EA7\u5217\u8868" }), _jsx("p", { children: "\u6700\u591A\u53EA\u53EF\u4EE5\u8BBE\u7F6E 8 \u4E2A\u7B49\u7EA7\uFF0C\u5EFA\u8BAE 3-6 \u4E2A\u7B49\u7EA7\u5373\u53EF" })] }), _jsxs("div", { className: "scrm-member-actions", children: [_jsx("button", { type: "button", onClick: openCreateDialog, disabled: isLoading, children: "\u65B0\u5EFA\u4F1A\u5458\u7B49\u7EA7" }), _jsx("button", { type: "button", onClick: () => setShowUpgradeDrawer(true), disabled: isLoading || !dashboard, children: "\u4F1A\u5458\u5347\u7EA7\u8BBE\u7F6E" })] })] }), isLoading ? _jsx("section", { className: "scrm-member-loading", "aria-label": "\u4F1A\u5458\u7B49\u7EA7\u52A0\u8F7D\u72B6\u6001", children: "\u4F1A\u5458\u7B49\u7EA7\u6570\u636E\u52A0\u8F7D\u4E2D..." }) : null, error ? (_jsxs("section", { className: "scrm-member-error", role: "alert", "aria-label": "\u4F1A\u5458\u7B49\u7EA7\u6570\u636E\u9519\u8BEF", children: [_jsx("strong", { children: "\u4F1A\u5458\u7B49\u7EA7\u52A0\u8F7D\u5931\u8D25" }), _jsx("span", { children: error }), _jsx("button", { type: "button", onClick: () => void loadDashboard(), children: "\u91CD\u65B0\u52A0\u8F7D" })] })) : null, dashboard && !error ? (_jsxs("table", { className: "scrm-member-table", "aria-label": "\u4F1A\u5458\u7B49\u7EA7\u5217\u8868", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "\u4F1A\u5458\u7B49\u7EA7" }), _jsx("th", { children: "\u7B49\u7EA7\u540D\u79F0" }), _jsx("th", { children: "\u514D\u8D39\u5347\u7EA7\u6761\u4EF6" }), _jsx("th", { children: "\u4F1A\u5458\u6298\u6263" }), _jsx("th", { children: "\u4F1A\u5458\u6743\u76CA" }), _jsx("th", { children: "\u4F1A\u5458\u5361\u9762" }), _jsx("th", { children: "\u72B6\u6001" }), _jsx("th", { children: "\u64CD\u4F5C" })] }) }), _jsx("tbody", { children: dashboard.levels.length === 0 ? (_jsx("tr", { children: _jsx("td", { colSpan: 8, children: "\u6682\u65E0\u4F1A\u5458\u7B49\u7EA7" }) })) : (dashboard.levels.map((level) => (_jsxs("tr", { children: [_jsxs("td", { children: ["\u7B49\u7EA7", level.rank] }), _jsx("td", { children: level.name }), _jsx("td", { children: level.upgradeCondition }), _jsx("td", { children: level.discount }), _jsx("td", { children: level.benefits }), _jsx("td", { children: _jsx("span", { className: "scrm-member-card-preview", "aria-label": `会员卡面 ${level.cardColor}`, children: _jsx("i", { style: { backgroundColor: level.cardColor } }) }) }), _jsx("td", { children: _jsx("span", { className: `scrm-member-status is-${level.status}`, children: level.status === 'enabled' ? '已启用' : '已停用' }) }), _jsx("td", { children: _jsx("button", { type: "button", className: "scrm-member-link-button", onClick: () => openEditDialog(level), children: "\u7F16\u8F91" }) })] }, level.id)))) })] })) : null] }), dialogMode ? (_jsx(LevelDialog, { mode: dialogMode, level: selectedLevel, isSaving: isSaving, onClose: () => setDialogMode(null), onSave: handleSaveLevel })) : null, showUpgradeDrawer && dashboard ? (_jsx(UpgradeSettingsDrawer, { dashboard: dashboard, isSaving: isSaving, onClose: () => setShowUpgradeDrawer(false), onSave: handleSaveUpgradeRule })) : null] }));
}
