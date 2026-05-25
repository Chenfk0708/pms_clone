import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { fetchApiKeysPageData, generateApiKeys, resolveApiKeysCampId, resolveApiKeysQuery, } from '../services/apiKeys';
import './ApiKeysPage.css';
const pageDescription = '此API keys用于Locals AI使用，请妥善保存。';
const pageWarning = '不要与他人共享你的 API key，或将其暴露在浏览器中。';
export function ApiKeysPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const query = useMemo(() => resolveApiKeysQuery(location.search), [location.search]);
    const [pageData, setPageData] = useState(null);
    const [diagnostics, setDiagnostics] = useState(null);
    const [feedback, setFeedback] = useState('正在加载 API keys');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [guideOpen, setGuideOpen] = useState(false);
    const [regenerateOpen, setRegenerateOpen] = useState(false);
    useEffect(() => {
        void loadPageData('initial');
        // Route query should drive the first fetch only.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query.mockState]);
    const contractText = JSON.stringify(diagnostics, null, 2);
    async function loadPageData(reason) {
        setIsLoading(true);
        setError('');
        setFeedback(reason === 'retry' ? '正在重新加载 API keys' : '正在加载 API keys');
        try {
            const nextData = await fetchApiKeysPageData({
                campId: resolveApiKeysCampId(),
                mockState: query.mockState,
            });
            setPageData(nextData);
            setDiagnostics(nextData.diagnostics);
            setFeedback(nextData.keyRecord ? 'API keys 已同步' : '暂未生成 API keys');
        }
        catch (loadError) {
            const message = loadError instanceof Error ? loadError.message : 'API keys 加载失败，请稍后重试';
            setPageData(null);
            setDiagnostics(readDiagnostics());
            setError(message);
            setFeedback(message);
        }
        finally {
            setIsLoading(false);
        }
    }
    async function handleGenerate(source) {
        setIsSubmitting(true);
        setError('');
        setFeedback(source === 'create' ? '正在生成 API keys' : '正在重新生成 API keys');
        try {
            const nextData = await generateApiKeys({ campId: resolveApiKeysCampId() });
            setPageData(nextData);
            setDiagnostics(nextData.diagnostics);
            setFeedback(source === 'create' ? 'API keys 已生成' : '已重新生成 API keys');
            setRegenerateOpen(false);
        }
        catch (submitError) {
            const message = submitError instanceof Error ? submitError.message : 'API keys 生成失败，请稍后重试';
            setDiagnostics(readDiagnostics());
            setError(message);
            setFeedback(message);
        }
        finally {
            setIsSubmitting(false);
        }
    }
    function handleCopy(label) {
        setFeedback(`${label} 已复制`);
    }
    return (_jsxs("section", { className: "api-keys-page", "aria-label": "API keys", children: [_jsx("pre", { hidden: true, "data-testid": "api-keys-service-contract", children: contractText }), _jsxs("div", { className: "api-keys-card", children: [_jsxs("header", { className: "api-keys-header", children: [_jsxs("div", { children: [_jsx("h1", { children: "API keys" }), _jsxs("p", { className: "api-keys-copy", children: [_jsx("span", { children: pageDescription }), _jsx("span", { className: "api-keys-copy__warning", children: pageWarning })] })] }), _jsx("button", { type: "button", className: "api-keys-secondary", onClick: () => navigate('/CompanySetting/CompanyInfo'), children: "\u67E5\u770B\u4F01\u4E1A\u4FE1\u606F" })] }), _jsx("div", { className: "api-keys-status", role: "status", "aria-label": "API keys\u64CD\u4F5C\u53CD\u9988", children: feedback }), isLoading ? (_jsxs("section", { className: "api-keys-loading", "aria-label": "API keys\u52A0\u8F7D\u72B6\u6001", children: [_jsx("div", { className: "api-keys-skeleton api-keys-skeleton--title" }), _jsx("div", { className: "api-keys-skeleton" }), _jsx("div", { className: "api-keys-skeleton api-keys-skeleton--short" })] })) : null, error ? (_jsxs("section", { className: "api-keys-error", role: "alert", "aria-label": "API keys\u6570\u636E\u9519\u8BEF", children: [_jsx("strong", { children: "API keys \u52A0\u8F7D\u5931\u8D25\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5" }), _jsx("span", { children: error }), _jsx("button", { type: "button", className: "api-keys-primary", onClick: () => void loadPageData('retry'), disabled: isSubmitting, children: "\u91CD\u65B0\u52A0\u8F7D" })] })) : null, !isLoading && !error && pageData?.keyRecord === null ? (_jsxs("section", { className: "api-keys-empty", "aria-label": "API keys\u7A7A\u72B6\u6001", children: [_jsx("p", { children: "\u6682\u672A\u751F\u6210\u8DEF\u5BA2\u4E91API keys\uFF0C\u70B9\u51FB\u4E0B\u65B9\u6309\u94AE\u83B7\u53D6API Keys" }), _jsx("div", { className: "api-keys-actions", children: _jsx("button", { type: "button", className: "api-keys-primary", onClick: () => void handleGenerate('create'), disabled: isSubmitting, children: isSubmitting ? '生成中...' : '获取API keys' }) })] })) : null, !isLoading && !error && pageData?.keyRecord ? (_jsxs("div", { className: "api-keys-layout", children: [_jsxs("section", { className: "api-keys-panel api-keys-panel--credential", children: [_jsxs("div", { className: "api-keys-panel__head", children: [_jsxs("div", { children: [_jsx("h2", { children: "\u5F53\u524D\u51ED\u8BC1" }), _jsx("p", { children: "\u8BF7\u4EC5\u5728 Locals AI \u670D\u52A1\u7AEF\u6216\u5B89\u5168\u5BC6\u94A5\u7BA1\u7406\u7CFB\u7EDF\u4E2D\u4FDD\u5B58 Secret Key\u3002" })] }), _jsx("span", { className: "api-keys-badge", children: "\u5DF2\u542F\u7528" })] }), _jsxs("dl", { className: "api-keys-grid", children: [_jsxs("div", { children: [_jsx("dt", { children: "App ID" }), _jsx("dd", { children: pageData.keyRecord.appId })] }), _jsxs("div", { children: [_jsx("dt", { children: "Access Key ID" }), _jsx("dd", { "data-testid": "api-keys-access-key-id", children: pageData.keyRecord.accessKeyId })] }), _jsxs("div", { children: [_jsx("dt", { children: "Secret Key" }), _jsx("dd", { children: pageData.keyRecord.secretKeyPreview })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u751F\u6210\u65F6\u95F4" }), _jsx("dd", { children: pageData.keyRecord.createdAt })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u6700\u8FD1\u4F7F\u7528" }), _jsx("dd", { children: pageData.keyRecord.lastUsedAt })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u8F6E\u6362\u5EFA\u8BAE" }), _jsx("dd", { children: pageData.keyRecord.rotationTip })] })] }), _jsxs("div", { className: "api-keys-actions", children: [_jsx("button", { type: "button", className: "api-keys-primary", onClick: () => handleCopy('Access Key ID'), children: "\u590D\u5236 Access Key ID" }), _jsx("button", { type: "button", className: "api-keys-secondary", onClick: () => handleCopy('Secret Key'), children: "\u590D\u5236 Secret Key" }), _jsx("button", { type: "button", className: "api-keys-secondary", onClick: () => setGuideOpen(true), children: "\u67E5\u770B\u63A5\u5165\u8BF4\u660E" }), _jsx("button", { type: "button", className: "api-keys-secondary", onClick: () => setRegenerateOpen(true), disabled: isSubmitting, children: "\u91CD\u65B0\u751F\u6210" })] })] }), _jsxs("section", { className: "api-keys-panel", "aria-label": "API keys\u6743\u9650\u8303\u56F4", children: [_jsx("h2", { children: "\u6743\u9650\u8303\u56F4" }), _jsx("ul", { className: "api-keys-list", children: pageData.keyRecord.scopes.map((item) => (_jsx("li", { children: item }, item))) })] }), _jsxs("section", { className: "api-keys-panel", "aria-label": "API keys\u64CD\u4F5C\u8BB0\u5F55", children: [_jsx("h2", { children: "\u64CD\u4F5C\u8BB0\u5F55" }), _jsx("ul", { className: "api-keys-timeline", children: pageData.activityLog.map((item) => (_jsxs("li", { children: [_jsx("strong", { children: item.title }), _jsx("span", { children: item.detail }), _jsx("em", { children: item.occurredAt })] }, item.id))) })] })] })) : null] }), guideOpen ? (_jsx("div", { className: "api-keys-modal-backdrop", children: _jsxs("section", { role: "dialog", "aria-modal": "true", "aria-label": "Locals AI \u63A5\u5165\u8BF4\u660E", className: "api-keys-modal", children: [_jsx("h2", { children: "Locals AI \u63A5\u5165\u8BF4\u660E" }), _jsxs("ul", { className: "api-keys-guide", children: [_jsx("li", { children: "\u8BF7\u5728\u670D\u52A1\u7AEF\u5B89\u5168\u4FDD\u5B58 Secret Key\uFF0C\u4E0D\u8981\u5199\u5165\u6D4F\u89C8\u5668\u4FA7\u4EE3\u7801\u3002" }), _jsx("li", { children: "\u5EFA\u8BAE\u6309\u73AF\u5883\u62C6\u5206\u51ED\u8BC1\uFF0C\u5E76\u5728\u5207\u6362\u7A97\u53E3\u5185\u5B8C\u6210\u8F6E\u6362\u3002" }), _jsx("li", { children: "\u82E5\u91CD\u65B0\u751F\u6210 API keys\uFF0C\u8BF7\u540C\u6B65\u66F4\u65B0\u6240\u6709\u5DF2\u63A5\u5165\u8282\u70B9\u3002" })] }), _jsx("button", { type: "button", className: "api-keys-primary", onClick: () => setGuideOpen(false), children: "\u5173\u95ED\u63A5\u5165\u8BF4\u660E" })] }) })) : null, regenerateOpen ? (_jsx("div", { className: "api-keys-modal-backdrop", children: _jsxs("section", { role: "dialog", "aria-modal": "true", "aria-label": "\u786E\u8BA4\u91CD\u65B0\u751F\u6210 API keys", className: "api-keys-modal", children: [_jsx("h2", { children: "\u786E\u8BA4\u91CD\u65B0\u751F\u6210 API keys" }), _jsx("p", { children: "\u91CD\u65B0\u751F\u6210\u540E\uFF0C\u8BF7\u540C\u6B65\u66F4\u65B0 Locals AI \u914D\u7F6E\uFF0C\u65E7\u51ED\u8BC1\u5C06\u4E0D\u518D\u7EE7\u7EED\u4F7F\u7528\u3002" }), _jsxs("div", { className: "api-keys-modal__actions", children: [_jsx("button", { type: "button", className: "api-keys-secondary", onClick: () => setRegenerateOpen(false), children: "\u53D6\u6D88" }), _jsx("button", { type: "button", className: "api-keys-primary", onClick: () => void handleGenerate('regenerate'), disabled: isSubmitting, children: "\u786E\u8BA4\u91CD\u65B0\u751F\u6210" })] })] }) })) : null] }));
}
function readDiagnostics() {
    if (typeof window === 'undefined')
        return null;
    const rawText = window.localStorage.getItem('pms.apiKeys.lastRequest');
    return rawText ? JSON.parse(rawText) : null;
}
