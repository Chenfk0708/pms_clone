import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { applyDefaultPrintSettingTemplates, createDefaultPrintSettingQuery, loadPrintSettingViewModel, PrintSettingServiceError, resolvePrintSettingRuntimeConfig, savePrintSettingSection, } from '../services/printSetting';
import './PrintSettingPage.css';
const defaultContract = {
    provider: 'mock',
    responseState: 'loading',
    endpoint: '/setting/print/bootstrap',
    traceId: '',
    timestamp: '',
    request: {},
};
export function PrintSettingPage() {
    const location = useLocation();
    const runtimeConfig = useMemo(() => resolvePrintSettingRuntimeConfig({ search: location.search }), [location.search]);
    const query = useMemo(() => createDefaultPrintSettingQuery(runtimeConfig), [runtimeConfig]);
    const queryKey = JSON.stringify(query);
    return _jsx(PrintSettingSurface, { query: query }, queryKey);
}
function PrintSettingSurface({ query }) {
    const [reloadKey, setReloadKey] = useState(0);
    const [loadStateOverride, setLoadStateOverride] = useState(null);
    const [state, setState] = useState({
        kind: 'loading',
        contract: {
            ...defaultContract,
            provider: query.provider ?? 'mock',
            request: query,
        },
    });
    const [feedback, setFeedback] = useState('正在同步打印设置...');
    const [drafts, setDrafts] = useState({
        stay: { key: 'stay', paperType: '80mm', selectedDocument: '', customText: '' },
        receipt: { key: 'receipt', paperType: 'A4', selectedDocument: '', customText: '' },
    });
    const [openDropdown, setOpenDropdown] = useState(null);
    const [savingSection, setSavingSection] = useState(null);
    const requestQuery = useMemo(() => ({
        ...query,
        mockState: loadStateOverride ?? query.mockState,
    }), [loadStateOverride, query]);
    useEffect(() => {
        const abort = new AbortController();
        setState({
            kind: 'loading',
            contract: {
                ...defaultContract,
                provider: requestQuery.provider ?? 'mock',
                request: requestQuery,
            },
        });
        loadPrintSettingViewModel(requestQuery, abort.signal)
            .then((data) => {
            setDrafts(createDraftMap(data));
            setState({
                kind: 'ready',
                data,
                contract: toContract(data),
            });
            setFeedback(data.state === 'empty' ? '当前还没有可用的打印模板配置' : '打印设置已更新');
        })
            .catch((error) => {
            if (error instanceof DOMException && error.name === 'AbortError')
                return;
            const message = error instanceof Error ? error.message : '打印设置加载失败，请稍后重试';
            setState({
                kind: 'error',
                message,
                contract: toErrorContract(error, requestQuery),
            });
            setFeedback(message);
        });
        return () => abort.abort();
    }, [reloadKey, requestQuery]);
    const contractJson = JSON.stringify(state.contract);
    const readyData = state.kind === 'ready' ? state.data : null;
    function updateDraft(sectionKey, patch) {
        setDrafts((current) => ({
            ...current,
            [sectionKey]: {
                ...current[sectionKey],
                ...patch,
            },
        }));
    }
    async function handleSave(sectionKey) {
        setSavingSection(sectionKey);
        try {
            const data = await savePrintSettingSection(query, drafts[sectionKey]);
            setState({
                kind: 'ready',
                data,
                contract: toContract(data),
            });
            setFeedback(sectionKey === 'stay' ? '住宿打印配置已保存' : '收款账单配置已保存');
            setOpenDropdown(null);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : '打印模板保存失败，请稍后重试';
            setFeedback(message);
            setState((current) => current.kind === 'ready'
                ? {
                    ...current,
                    contract: toErrorContract(error, query, current.data),
                }
                : current);
        }
        finally {
            setSavingSection(null);
        }
    }
    async function handleApplyDefault() {
        try {
            const data = await applyDefaultPrintSettingTemplates(query);
            setDrafts(createDraftMap(data));
            setState({
                kind: 'ready',
                data,
                contract: toContract(data),
            });
            setFeedback('已恢复默认打印模板');
        }
        catch (error) {
            const message = error instanceof Error ? error.message : '默认模板恢复失败，请稍后重试';
            setFeedback(message);
        }
    }
    function handleRetry() {
        setLoadStateOverride('success');
        setReloadKey((current) => current + 1);
        setFeedback('正在重新加载打印设置...');
    }
    return (_jsxs("div", { className: "print-setting-page", children: [_jsx("pre", { hidden: true, "data-testid": "print-setting-service-contract", "data-provider": state.contract.provider, "data-response-state": state.contract.responseState, "data-endpoint": state.contract.endpoint, children: contractJson }), _jsxs("section", { className: "print-setting-shell", "aria-label": "\u6253\u5370\u8BBE\u7F6E", children: [_jsx("div", { className: "print-setting-feedback", role: "status", "aria-label": "\u6253\u5370\u8BBE\u7F6E\u64CD\u4F5C\u53CD\u9988", children: feedback }), state.kind === 'error' ? (_jsxs("section", { className: "print-setting-state print-setting-state--error", role: "alert", "aria-label": "\u6253\u5370\u8BBE\u7F6E\u9519\u8BEF\u72B6\u6001", children: [_jsx("h2", { children: "\u6253\u5370\u8BBE\u7F6E\u52A0\u8F7D\u5931\u8D25\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5" }), _jsx("p", { children: state.message }), _jsx("button", { type: "button", className: "print-setting-primary", onClick: handleRetry, children: "\u91CD\u65B0\u52A0\u8F7D\u6253\u5370\u8BBE\u7F6E" })] })) : null, state.kind === 'loading' ? (_jsxs("section", { className: "print-setting-state", role: "status", "aria-label": "\u6253\u5370\u8BBE\u7F6E\u52A0\u8F7D\u4E2D", children: [_jsx("h2", { children: "\u6253\u5370\u8BBE\u7F6E\u52A0\u8F7D\u4E2D" }), _jsx("p", { children: "\u6B63\u5728\u540C\u6B65\u7EB8\u5F20\u3001\u5355\u636E\u548C\u63D0\u793A\u6587\u6848\u914D\u7F6E\uFF0C\u8BF7\u7A0D\u5019\u3002" })] })) : null, readyData?.state === 'empty' ? (_jsxs("section", { className: "print-setting-state print-setting-state--empty", "aria-label": "\u6253\u5370\u8BBE\u7F6E\u7A7A\u72B6\u6001", children: [_jsx("h2", { children: readyData.emptyState.title }), _jsx("p", { children: readyData.emptyState.description }), _jsx("button", { type: "button", className: "print-setting-primary", onClick: () => void handleApplyDefault(), children: readyData.emptyState.actionText })] })) : null, readyData?.state === 'success'
                        ? readyData.sections.map((section) => {
                            const draft = drafts[section.key];
                            const isSaving = savingSection === section.key;
                            const currentDocument = section.documentOptions.find((item) => item.value === draft.selectedDocument)?.label ??
                                section.documentOptions[0]?.label ??
                                '';
                            return (_jsxs("section", { className: "print-setting-section", "aria-label": section.ariaLabel, children: [_jsx("h2", { children: section.title }), _jsxs("div", { className: "print-setting-card", children: [_jsxs("fieldset", { className: "print-setting-field", children: [_jsx("legend", { children: "\u6253\u5370\u7EB8\u5F20" }), _jsx("div", { className: "print-setting-radio-group", children: section.paperOptions.map((option) => (_jsxs("label", { className: "print-setting-radio", children: [_jsx("input", { type: "radio", name: `${section.key}-paper`, "aria-label": option.label, checked: draft.paperType === option.value, onChange: () => updateDraft(section.key, { paperType: option.value }) }), _jsx("span", { children: option.label })] }, option.value))) })] }), _jsxs("div", { className: "print-setting-field", children: [_jsx("div", { className: "print-setting-label", children: "\u9009\u62E9\u5355\u636E" }), _jsxs("div", { className: "print-setting-select-wrap", children: [_jsxs("button", { type: "button", className: `print-setting-select${openDropdown === section.key ? ' is-open' : ''}`, "aria-haspopup": "listbox", "aria-expanded": openDropdown === section.key, "aria-label": section.key === 'stay' ? '选择住宿打印单据' : '选择收款账单单据', onClick: () => setOpenDropdown(openDropdown === section.key ? null : section.key), children: [_jsx("span", { children: currentDocument }), _jsx("i", { "aria-hidden": "true", children: "\u25BE" })] }), openDropdown === section.key ? (_jsx("ul", { className: "print-setting-options", role: "listbox", "aria-label": section.key === 'stay' ? '住宿打印单据选项' : '收款账单单据选项', children: section.documentOptions.map((option) => (_jsx("li", { role: "option", "aria-selected": draft.selectedDocument === option.value, tabIndex: 0, onClick: () => {
                                                                        updateDraft(section.key, { selectedDocument: option.value });
                                                                        setOpenDropdown(null);
                                                                    }, children: option.label }, option.value))) })) : null] })] }), _jsxs("div", { className: "print-setting-field print-setting-field--text", children: [_jsx("label", { htmlFor: `${section.key}-custom-text`, children: "\u81EA\u5B9A\u4E49\u63D0\u793A\u6587\u6848" }), _jsx("textarea", { id: `${section.key}-custom-text`, "aria-label": "\u81EA\u5B9A\u4E49\u63D0\u793A\u6587\u6848", placeholder: section.placeholder, value: draft.customText, onChange: (event) => updateDraft(section.key, { customText: event.target.value }) })] }), _jsx("div", { className: "print-setting-actions", children: _jsx("button", { type: "button", className: "print-setting-primary", "aria-label": section.key === 'stay' ? '保存住宿打印配置' : '保存收款账单配置', disabled: isSaving, onClick: () => void handleSave(section.key), children: isSaving ? '保存中...' : '保 存' }) })] })] }, section.key));
                        })
                        : null] })] }));
}
function createDraftMap(data) {
    const draftMap = data.sections.reduce((current, section) => ({
        ...current,
        [section.key]: {
            key: section.key,
            paperType: section.paperType,
            selectedDocument: section.selectedDocument,
            customText: section.customText,
        },
    }), {});
    return {
        stay: draftMap.stay ?? { key: 'stay', paperType: '80mm', selectedDocument: '', customText: '' },
        receipt: draftMap.receipt ?? { key: 'receipt', paperType: 'A4', selectedDocument: '', customText: '' },
    };
}
function toContract(data) {
    return {
        provider: data.provider,
        responseState: data.state,
        endpoint: data.endpoint,
        traceId: data.traceId,
        timestamp: data.timestamp,
        request: data.request,
    };
}
function toErrorContract(error, query, previousData) {
    if (error instanceof PrintSettingServiceError) {
        return {
            provider: error.provider,
            responseState: 'error',
            endpoint: previousData?.endpoint ?? '/setting/print/bootstrap',
            traceId: error.response.traceId,
            timestamp: error.response.timestamp,
            request: error.request,
        };
    }
    return {
        provider: query.provider ?? 'mock',
        responseState: 'error',
        endpoint: previousData?.endpoint ?? '/setting/print/bootstrap',
        traceId: '',
        timestamp: '',
        request: query,
    };
}
