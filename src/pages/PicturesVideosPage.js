import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from 'react';
import './PicturesVideosPage.css';
import { defaultPicturesVideosRequest, fetchPicturesVideosView, resolvePicturesVideosMockState, resolvePicturesVideosProvider, } from '../services/picturesVideos';
export function PicturesVideosPage() {
    const [activeTab, setActiveTab] = useState('picture');
    const [keyword, setKeyword] = useState('');
    const [viewModel, setViewModel] = useState(null);
    const [loadState, setLoadState] = useState('loading');
    const [feedback, setFeedback] = useState('图片视频数据加载中');
    const [errorMessage, setErrorMessage] = useState('');
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
    const [draftFolders, setDraftFolders] = useState([]);
    const searchInputRef = useRef(null);
    useEffect(() => {
        const controller = new AbortController();
        void loadPicturesVideos(defaultPicturesVideosRequest(), '图片视频数据已更新', controller.signal);
        return () => controller.abort();
    }, []);
    const provider = viewModel?.provider ?? resolvePicturesVideosProvider();
    const responseState = loadState === 'error' ? 'error' : loadState === 'empty' ? 'empty' : viewModel?.state ?? 'success';
    const requestName = viewModel?.request.name ?? keyword.trim();
    const contractText = useMemo(() => {
        if (!viewModel)
            return '';
        return JSON.stringify(viewModel.contract);
    }, [viewModel]);
    async function loadPicturesVideos(request, successMessage, signal) {
        setLoadState('loading');
        setErrorMessage('');
        try {
            const nextViewModel = await fetchPicturesVideosView({
                ...request,
                state: request.state ?? resolvePicturesVideosMockState(),
            }, signal);
            setViewModel(nextViewModel);
            setKeyword(nextViewModel.request.name);
            setLoadState(nextViewModel.state === 'empty' ? 'empty' : 'success');
            setFeedback(successMessage);
        }
        catch (error) {
            if (isAbortError(error))
                return;
            setErrorMessage(error instanceof Error ? error.message : '图片视频数据加载失败，请稍后重试');
            setLoadState('error');
            setFeedback('图片视频数据加载失败');
        }
    }
    function getCurrentRequest() {
        const nextKeyword = searchInputRef.current?.value.trim() ?? keyword.trim();
        const baseRequest = viewModel ? { ...viewModel.request } : defaultPicturesVideosRequest();
        return {
            ...baseRequest,
            name: nextKeyword,
            state: resolvePicturesVideosMockState(),
        };
    }
    function handleSearch() {
        const nextKeyword = searchInputRef.current?.value.trim() ?? keyword.trim();
        const successMessage = nextKeyword ? `已按关键字“${nextKeyword}”筛选图片管理` : '已按当前条件刷新图片视频数据';
        void loadPicturesVideos(getCurrentRequest(), successMessage);
    }
    function handleRefresh() {
        void loadPicturesVideos(getCurrentRequest(), '已重新加载图片视频数据');
    }
    function handleRetry() {
        void loadPicturesVideos(getCurrentRequest(), '已重新加载图片视频数据');
    }
    function handleBack() {
        setFeedback('当前目录已是根目录');
    }
    function handleCreateFolder() {
        setDraftFolders((current) => (current.length > 0 ? current : ['新建文件夹']));
        setFeedback('已创建待命名文件夹');
    }
    return (_jsxs("div", { className: "pictures-videos-page", "data-provider": provider, "data-response-state": responseState, "data-request-name": requestName, "data-active-tab": activeTab, children: [_jsx("h1", { className: "sr-only-heading", children: "\u56FE\u7247\u89C6\u9891" }), _jsx("pre", { className: "pictures-videos-contract", "data-testid": "pictures-videos-contract", children: contractText }), _jsxs("section", { className: "pictures-videos-panel", "aria-label": "\u56FE\u7247\u89C6\u9891\u7BA1\u7406", children: [_jsx("header", { className: "pictures-videos-topline", children: _jsx("div", { className: "pictures-videos-tabs", role: "tablist", "aria-label": "\u56FE\u7247\u89C6\u9891\u7C7B\u578B", children: (viewModel?.tabs ?? defaultTabs).map((tab) => (_jsx("button", { type: "button", role: "tab", "aria-selected": activeTab === tab.key, className: activeTab === tab.key ? 'is-active' : '', onClick: () => setActiveTab(tab.key), children: tab.label }, tab.key))) }) }), _jsxs("div", { className: "pictures-videos-toolbar", "aria-label": "\u56FE\u7247\u89C6\u9891\u5DE5\u5177\u680F", children: [activeTab === 'picture' ? (_jsxs("label", { className: "pictures-videos-search", children: [_jsx("input", { ref: searchInputRef, "aria-label": "\u641C\u7D22\u56FE\u7247\u6216\u6587\u4EF6\u5939\u540D\u79F0", type: "search", value: keyword, placeholder: "\u8F93\u5165\u56FE\u7247\u6216\u6587\u4EF6\u5939\u540D\u79F0", onChange: (event) => setKeyword(event.target.value) }), _jsx("button", { type: "button", onClick: handleSearch, children: "\u641C\u7D22" })] })) : null, _jsxs("div", { className: "pictures-videos-actions", children: [_jsx("button", { type: "button", className: "pictures-videos-upload", onClick: () => setUploadDialogOpen(true), children: "\u4E0A\u4F20" }), _jsx("button", { type: "button", onClick: handleCreateFolder, children: "\u65B0\u5EFA\u6587\u4EF6\u5939" }), _jsx("button", { type: "button", onClick: handleBack, children: "\u8FD4\u56DE\u4E0A\u4E00\u7EA7" }), _jsx("button", { type: "button", onClick: handleRefresh, children: "\u5237\u65B0" })] })] }), _jsx("div", { className: "pictures-videos-feedback is-success", role: "status", "aria-label": "\u56FE\u7247\u89C6\u9891\u64CD\u4F5C\u53CD\u9988", children: feedback }), _jsx("div", { className: "pictures-videos-path-row", children: _jsx("strong", { children: viewModel?.breadcrumbLabel ?? '全部附件' }) }), activeTab === 'attachment' ? (_jsxs("section", { className: "pictures-videos-attachment-panel", "aria-label": "\u9644\u4EF6\u7BA1\u7406\u627F\u63A5\u533A", children: [_jsxs("header", { children: [_jsx("h2", { children: "\u9644\u4EF6\u7BA1\u7406" }), _jsx("p", { className: "pictures-videos-attachment-tip", children: "\u9644\u4EF6\u7BA1\u7406\u6682\u4E0D\u652F\u6301\u641C\u7D22\u6587\u4EF6\u5939\uFF0C\u4FDD\u7559\u5217\u8868\u4E0E\u4E0A\u4F20\u627F\u63A5\u3002" })] }), _jsxs("div", { className: "pictures-videos-attachment-empty", children: ["\u5F53\u524D\u627F\u63A5\u76EE\u6807\uFF1A", viewModel?.uploadTargetLabel ?? '全部附件'] })] })) : loadState === 'loading' ? (_jsxs("section", { className: "pictures-videos-loading", role: "status", "aria-label": "\u56FE\u7247\u89C6\u9891\u52A0\u8F7D\u4E2D", children: [_jsx("h2", { children: "\u56FE\u7247\u89C6\u9891\u6570\u636E\u52A0\u8F7D\u4E2D" }), _jsx("p", { children: "\u8BF7\u7A0D\u5019\uFF0C\u6B63\u5728\u540C\u6B65\u5F53\u524D\u76EE\u5F55\u5185\u5BB9\u3002" })] })) : loadState === 'error' ? (_jsxs("section", { className: "pictures-videos-state-card is-error", role: "alert", "aria-label": "\u56FE\u7247\u89C6\u9891\u6570\u636E\u9519\u8BEF", children: [_jsx("h2", { children: "\u56FE\u7247\u89C6\u9891\u6570\u636E\u9519\u8BEF" }), _jsx("p", { children: errorMessage }), _jsx("button", { type: "button", onClick: handleRetry, children: "\u91CD\u8BD5" })] })) : loadState === 'empty' ? (_jsxs(_Fragment, { children: [_jsxs("section", { className: "pictures-videos-state-card", role: "status", "aria-label": "\u56FE\u7247\u89C6\u9891\u7A7A\u6001", children: [_jsx("h2", { children: "\u5F53\u524D\u76EE\u5F55\u4E0B\u6682\u65E0\u56FE\u7247\u6216\u89C6\u9891\u7D20\u6750" }), _jsx("p", { children: "\u53EF\u4EE5\u8C03\u6574\u5173\u952E\u5B57\u540E\u91CD\u65B0\u67E5\u8BE2\uFF0C\u6216\u4E0A\u4F20\u65B0\u7684\u56FE\u7247\u548C\u89C6\u9891\u7D20\u6750\u3002" }), _jsx("button", { type: "button", onClick: () => {
                                            setKeyword('');
                                            void loadPicturesVideos({
                                                ...(viewModel?.request ?? defaultPicturesVideosRequest()),
                                                name: '',
                                                state: resolvePicturesVideosMockState(),
                                            }, '已重置搜索条件');
                                        }, children: "\u91CD\u7F6E\u641C\u7D22\u6761\u4EF6" })] }), draftFolders.length > 0 ? (_jsx("div", { className: "pictures-videos-grid is-grid", "aria-label": "\u56FE\u7247\u89C6\u9891\u5217\u8868", children: draftFolders.map((folderName, index) => (_jsxs("article", { className: "pictures-videos-folder-card", children: [_jsx("div", { className: "pictures-videos-folder-visual", "aria-hidden": "true" }), _jsx("input", { "aria-label": "\u6587\u4EF6\u5939\u540D\u79F0", value: folderName, readOnly: true }), _jsx("small", { children: "\u5F85\u4FDD\u5B58" })] }, `empty-draft-${index}`))) })) : null, _jsx("footer", { className: "pictures-videos-footer", children: _jsx("div", { className: "pictures-videos-pagination", children: _jsxs("span", { children: ["\u5171 ", viewModel?.pagination.total ?? 0, " \u6761"] }) }) })] })) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: "pictures-videos-grid is-grid", "aria-label": "\u56FE\u7247\u89C6\u9891\u5217\u8868", children: [viewModel?.items.map((item) => (_jsxs("article", { className: "pictures-videos-folder-card", children: [_jsx("div", { className: "pictures-videos-folder-visual", "aria-hidden": "true" }), _jsx("strong", { children: item.name }), _jsx("small", { children: item.isDir ? '文件夹' : '文件' })] }, item.id))), draftFolders.map((folderName, index) => (_jsxs("article", { className: "pictures-videos-folder-card", children: [_jsx("div", { className: "pictures-videos-folder-visual", "aria-hidden": "true" }), _jsx("input", { "aria-label": "\u6587\u4EF6\u5939\u540D\u79F0", value: folderName, readOnly: true }), _jsx("small", { children: "\u5F85\u4FDD\u5B58" })] }, `draft-${index}`)))] }), _jsx("footer", { className: "pictures-videos-footer", children: _jsx("div", { className: "pictures-videos-pagination", children: _jsxs("span", { children: ["\u5171 ", viewModel?.pagination.total ?? 0, " \u6761"] }) }) })] }))] }), uploadDialogOpen ? (_jsx("div", { className: "pictures-videos-modal-backdrop", role: "presentation", children: _jsxs("div", { className: "pictures-videos-modal-frame", children: [_jsxs("section", { className: "pictures-videos-modal", role: "dialog", "aria-modal": "true", "aria-label": "\u4E0A\u4F20\u9644\u4EF6", children: [_jsx("h2", { children: "\u4E0A\u4F20\u9644\u4EF6" }), _jsxs("div", { className: "pictures-videos-upload-body", children: [_jsxs("p", { children: [_jsx("strong", { children: "\u4E0A\u4F20\u5230\uFF1A" }), _jsx("span", { children: viewModel?.uploadTargetLabel ?? '全部附件' })] }), _jsxs("div", { className: "pictures-videos-upload-guide", children: [_jsx("strong", { children: "\u4E0A\u4F20\u6307\u5F15\uFF1A" }), _jsx("ol", { children: (viewModel?.uploadGuide ?? defaultUploadGuide).map((guide) => (_jsx("li", { children: guide }, guide))) })] }), _jsxs("div", { className: "pictures-videos-upload-buttons", children: [_jsx("button", { type: "button", children: "\u4E0A\u4F20\u9644\u4EF6" }), _jsx("button", { type: "button", children: "\u4E0A\u4F20\u6587\u4EF6\u5939" })] })] })] }), _jsx("button", { type: "button", className: "pictures-videos-modal-close", "aria-label": "\u5173\u95ED\u4E0A\u4F20\u9644\u4EF6\u5F39\u7A97", onClick: () => setUploadDialogOpen(false), children: "\u00D7" })] }) })) : null] }));
}
const defaultTabs = [
    { key: 'picture', label: '图片管理' },
    { key: 'attachment', label: '附件管理' },
];
const defaultUploadGuide = [
    '为了保证附件的正常使用，单个附件最大支持 20M',
    'jpg、jpeg、png格式附件上传',
    '支持选择多张图片上传，支持拖拽文件夹上传',
];
function isAbortError(error) {
    return error instanceof DOMException && error.name === 'AbortError';
}
