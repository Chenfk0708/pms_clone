import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { fetchImSettingView, resolveImSettingProvider, saveImShortcutSettings, updateImSettingDiagnostics, } from '../services/imSetting';
import './ImSettingPage.css';
const defaultCampId = '1796067693589061634';
const defaultUserId = '1796067693261905922';
const tabs = [
    { key: 'phrases', label: '常用语' },
    { key: 'autoReply', label: '自动回复设置' },
    { key: 'page', label: '页面设置' },
    { key: 'tags', label: '标签设置' },
    { key: 'shortcuts', label: '快捷键设置' },
    { key: 'version', label: '版本设置' },
];
const autoReplyPanels = [
    { key: 'welcome', label: '欢迎语' },
    { key: 'timeout', label: '超时提醒' },
    { key: 'task', label: '任务提醒' },
];
const autoReplySceneOptions = ['全部任务场景', '【催单】咨询未下单', '【催付】预订待支付', '【回访】入住后关怀'];
const defaultAutoReplyTaskDraft = {
    scene: '【催单】咨询未下单',
    name: '',
    minutes: '5',
    content: '您好，还有什么可以帮助的？我们非常愿意详尽解答，期待您入住',
};
const defaultPageSettings = {
    timeoutReplyEnabled: false,
    timeoutReplyMinutes: '3',
    severeTimeoutReplyEnabled: false,
    severeTimeoutReplyMinutes: '6',
    firstReplyReminderEnabled: true,
    highConversionEnabled: false,
    highConversionCount: '6',
    soundNotifyEnabled: false,
    volume: 100,
};
const defaultCustomerTags = [
    {
        id: 'customer-tag-1',
        type: '客户标签',
        contents: [],
        enabled: true,
    },
];
export function ImSettingPage() {
    const location = useLocation();
    const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
    const campId = searchParams.get('campId') || defaultCampId;
    const userId = searchParams.get('userId') || defaultUserId;
    const [activeTab, setActiveTab] = useState('phrases');
    const [view, setView] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [feedback, setFeedback] = useState(null);
    const [keyword, setKeyword] = useState('');
    const [selectedGroupId, setSelectedGroupId] = useState(null);
    const [selectedPhrase, setSelectedPhrase] = useState(null);
    const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [isPhraseEditorOpen, setIsPhraseEditorOpen] = useState(false);
    const [activeAutoReplyPanel, setActiveAutoReplyPanel] = useState('welcome');
    const [autoReplyTaskKeyword, setAutoReplyTaskKeyword] = useState('');
    const [autoReplyTaskSceneFilter, setAutoReplyTaskSceneFilter] = useState('全部任务场景');
    const [autoReplyTasks, setAutoReplyTasks] = useState([]);
    const [isAutoReplyTaskDialogOpen, setIsAutoReplyTaskDialogOpen] = useState(false);
    const [autoReplyTaskDraft, setAutoReplyTaskDraft] = useState(defaultAutoReplyTaskDraft);
    const [pageSettings, setPageSettings] = useState(defaultPageSettings);
    const [tagKeyword, setTagKeyword] = useState('');
    const [customerTags, setCustomerTags] = useState(defaultCustomerTags);
    const [isTagEditorOpen, setIsTagEditorOpen] = useState(false);
    const [editingTagId, setEditingTagId] = useState(null);
    const [tagEditorContents, setTagEditorContents] = useState(['']);
    const [selectedVersion, setSelectedVersion] = useState('basic');
    const [phraseDraft, setPhraseDraft] = useState({
        title: '',
        groupId: '',
        content: '',
    });
    const [shortcutDraft, setShortcutDraft] = useState([]);
    const [phraseActionsVisible, setPhraseActionsVisible] = useState(false);
    const provider = resolveImSettingProvider();
    useEffect(() => {
        updateImSettingDiagnostics({ currentTab: activeTab });
    }, [activeTab]);
    useEffect(() => {
        if (!view || error)
            return;
        const timer = window.setTimeout(() => {
            setPhraseActionsVisible(true);
        }, 1200);
        return () => window.clearTimeout(timer);
    }, [error, view]);
    const loadView = useCallback(async (signal) => {
        setIsLoading(true);
        setError('');
        setPhraseActionsVisible(false);
        try {
            const nextView = await fetchImSettingView({
                provider,
                campId,
                userId,
                keyword,
                groupId: selectedGroupId,
            }, signal);
            if (signal?.aborted)
                return;
            setView(nextView);
            setShortcutDraft(nextView.shortcuts);
        }
        catch (nextError) {
            if (signal?.aborted)
                return;
            setError(nextError instanceof Error ? nextError.message : '会话设置数据加载失败，请重试');
            setFeedback(null);
        }
        finally {
            if (!signal?.aborted) {
                setIsLoading(false);
            }
        }
    }, [campId, keyword, provider, selectedGroupId, userId]);
    useEffect(() => {
        const controller = new AbortController();
        const timer = window.setTimeout(() => {
            void loadView(controller.signal);
        }, 0);
        return () => {
            window.clearTimeout(timer);
            controller.abort();
        };
    }, [loadView]);
    async function handleQuery() {
        await loadView();
    }
    async function handleReset() {
        setKeyword('');
        setSelectedGroupId(null);
        setFeedback({ tone: 'success', text: '常用语筛选条件已重置' });
        setIsLoading(true);
        setError('');
        try {
            const nextView = await fetchImSettingView({
                provider,
                campId,
                userId,
                keyword: '',
                groupId: null,
            });
            setView(nextView);
            setShortcutDraft(nextView.shortcuts);
        }
        catch (nextError) {
            setError(nextError instanceof Error ? nextError.message : '会话设置数据加载失败，请重试');
            setFeedback(null);
        }
        finally {
            setIsLoading(false);
        }
    }
    async function handleRefresh() {
        await loadView();
    }
    function handleOpenCategoryDialog() {
        setNewCategoryName('');
        setIsCategoryDialogOpen(true);
    }
    function handleSaveCategory() {
        const nextName = newCategoryName.trim();
        if (!nextName)
            return;
        const nextGroupId = `group-${Date.now()}`;
        setView((current) => current
            ? {
                ...current,
                phraseGroups: [{ id: nextGroupId, name: nextName, count: 0 }, ...current.phraseGroups],
            }
            : current);
        setSelectedGroupId(nextGroupId);
        setIsCategoryDialogOpen(false);
        setFeedback({ tone: 'success', text: '分类已创建' });
    }
    function handleOpenPhraseEditor() {
        setPhraseDraft({
            title: '',
            groupId: selectedGroupId ?? view?.phraseGroups[0]?.id ?? '',
            content: '',
        });
        setIsPhraseEditorOpen(true);
    }
    function handleSavePhrase() {
        if (!phraseDraft.title.trim() || !phraseDraft.groupId || !phraseDraft.content.trim())
            return;
        const group = view?.phraseGroups.find((item) => item.id === phraseDraft.groupId) ?? view?.phraseGroups[0];
        const nextPhrase = {
            id: `phrase-${Date.now()}`,
            title: phraseDraft.title.trim(),
            content: phraseDraft.content.trim(),
            groupId: group?.id ?? 'group-checkin',
            groupName: group?.name ?? '入住前沟通',
            updatedAt: '2026-05-19 19:30:00',
        };
        setView((current) => current
            ? {
                ...current,
                phrases: [nextPhrase, ...current.phrases],
                state: 'success',
            }
            : current);
        setIsPhraseEditorOpen(false);
        setFeedback({ tone: 'success', text: '常用语已保存' });
        updateImSettingDiagnostics({
            lastAction: {
                endpoint: '/imWords/save',
                request: {
                    campId,
                    title: nextPhrase.title,
                    content: nextPhrase.content,
                    imWordsGroupId: nextPhrase.groupId,
                },
            },
        });
    }
    function handleToggleShortcut(code) {
        setShortcutDraft((current) => current.map((item) => (item.code === code ? { ...item, isOpen: !item.isOpen } : item)));
    }
    async function handleSaveShortcuts() {
        await saveImShortcutSettings({ userId }, shortcutDraft);
        setView((current) => (current ? { ...current, shortcuts: shortcutDraft } : current));
        setFeedback({ tone: 'success', text: '快捷键设置已保存' });
    }
    function handleOpenAutoReplyTaskDialog() {
        setAutoReplyTaskDraft(defaultAutoReplyTaskDraft);
        setIsAutoReplyTaskDialogOpen(true);
    }
    function handleSaveAutoReplyTask() {
        if (!autoReplyTaskDraft.scene || !autoReplyTaskDraft.name.trim() || !autoReplyTaskDraft.minutes.trim() || !autoReplyTaskDraft.content.trim())
            return;
        const nextTask = {
            id: `auto-task-${Date.now()}`,
            name: autoReplyTaskDraft.name.trim(),
            scene: autoReplyTaskDraft.scene,
            timing: `客户咨询后，${autoReplyTaskDraft.minutes.trim()} 分钟未下单且未回复`,
            content: autoReplyTaskDraft.content.trim(),
            enabled: true,
        };
        setAutoReplyTasks((current) => [nextTask, ...current]);
        setIsAutoReplyTaskDialogOpen(false);
        setFeedback({ tone: 'success', text: '任务提醒已创建' });
    }
    const filteredAutoReplyTasks = autoReplyTasks.filter((item) => {
        const keyword = autoReplyTaskKeyword.trim();
        const matchesKeyword = !keyword || `${item.name}${item.scene}${item.content}`.includes(keyword);
        const matchesScene = autoReplyTaskSceneFilter === '全部任务场景' || item.scene === autoReplyTaskSceneFilter;
        return matchesKeyword && matchesScene;
    });
    const filteredCustomerTags = customerTags.filter((item) => {
        const nextKeyword = tagKeyword.trim();
        return !nextKeyword || `${item.type}${item.contents.join('')}`.includes(nextKeyword);
    });
    const editingTag = customerTags.find((item) => item.id === editingTagId) ?? null;
    function handleOpenTagEditor(tag) {
        setEditingTagId(tag.id);
        setTagEditorContents(tag.contents.length > 0 ? [...tag.contents] : ['']);
        setIsTagEditorOpen(true);
    }
    function handleChangeTagEditorContent(index, value) {
        setTagEditorContents((current) => current.map((item, itemIndex) => (itemIndex === index ? value : item)));
    }
    function handleAddTagEditorContent() {
        setTagEditorContents((current) => [...current, '']);
    }
    function handleRemoveTagEditorContent(index) {
        setTagEditorContents((current) => {
            if (current.length === 1) {
                return [''];
            }
            return current.filter((_, itemIndex) => itemIndex !== index);
        });
    }
    function handleSaveTagEditor() {
        if (!editingTagId)
            return;
        const normalizedContents = tagEditorContents.map((item) => item.trim()).filter(Boolean);
        setCustomerTags((current) => current.map((item) => (item.id === editingTagId ? { ...item, contents: normalizedContents } : item)));
        setIsTagEditorOpen(false);
        setEditingTagId(null);
        setFeedback({ tone: 'success', text: '标签已保存' });
    }
    return (_jsxs("div", { className: "im-setting-page", "data-provider": provider, "data-tab": activeTab, children: [_jsxs("section", { className: "im-setting-upgrade-banner", children: [_jsx("span", { children: "\u5F53\u524D\u4E3A\u4F1A\u8BDD\u57FA\u7840\u7248\u672C\uFF0C\u53EF\u5347\u7EA7\u83B7\u53D6\u66F4\u5B8C\u6574\u7684 IM \u4F1A\u8BDD\u80FD\u529B\u4E0E\u5FEB\u6377\u952E\u534F\u540C\u3002" }), _jsx("a", { href: "/version/applicationPayment/detail?app=im", children: "\u4F1A\u8BDD\u5347\u7EA7\u7248" })] }), _jsx("nav", { className: "im-setting-tabs", "aria-label": "\u4F1A\u8BDD\u8BBE\u7F6E\u6807\u7B7E", children: tabs.map((tab) => (_jsx("button", { type: "button", "aria-pressed": activeTab === tab.key, className: activeTab === tab.key ? 'is-active' : '', onClick: () => setActiveTab(tab.key), children: tab.label }, tab.key))) }), feedback ? (_jsx("div", { className: `im-setting-feedback is-${feedback.tone}`, role: "status", children: feedback.text })) : null, error ? (_jsxs("section", { className: "im-setting-error", role: "alert", children: [_jsx("strong", { children: error }), _jsx("button", { type: "button", onClick: () => void loadView(), children: "\u91CD\u8BD5" })] })) : null, activeTab === 'phrases' ? (_jsxs("section", { className: "im-setting-panel im-phrase-panel", role: "region", "aria-label": "\u5E38\u7528\u8BED\u7BA1\u7406", children: [_jsxs("aside", { className: "im-phrase-sidebar", children: [_jsxs("div", { className: "im-panel-head", children: [_jsx("h2", { children: "\u5206\u7C7B" }), _jsx("button", { type: "button", onClick: handleOpenCategoryDialog, children: "\u65B0\u5EFA\u5206\u7C7B" })] }), _jsxs("div", { className: "im-group-list", children: [_jsx("button", { type: "button", className: !selectedGroupId ? 'is-active' : '', onClick: () => setSelectedGroupId(null), children: "\u5168\u90E8\u5206\u7C7B" }), (view?.phraseGroups ?? []).map((group) => (_jsx("button", { type: "button", className: selectedGroupId === group.id ? 'is-active' : '', onClick: () => setSelectedGroupId(group.id), children: group.name }, group.id)))] })] }), _jsxs("div", { className: "im-phrase-content", children: [_jsxs("div", { className: "im-panel-head", children: [_jsx("h2", { children: "\u5E38\u7528\u8BED\u5217\u8868" }), _jsxs("span", { children: ["\u5F53\u524D\u5206\u7C7B\uFF1A", selectedGroupId ? view?.phraseGroups.find((item) => item.id === selectedGroupId)?.name : '全部分类'] })] }), _jsxs("div", { className: "im-phrase-toolbar", children: [_jsxs("label", { className: "im-search-field", children: [_jsx("span", { children: "\u5E38\u7528\u8BED\u5173\u952E\u8BCD" }), _jsx("input", { value: keyword, onChange: (event) => setKeyword(event.target.value) })] }), _jsxs("div", { className: "im-toolbar-actions", children: [_jsx("button", { type: "button", onClick: () => void handleQuery(), children: "\u67E5\u8BE2" }), _jsx("button", { type: "button", onClick: () => void handleReset(), children: "\u91CD\u7F6E" }), _jsx("button", { type: "button", onClick: () => void handleRefresh(), children: "\u5237\u65B0" }), phraseActionsVisible ? (_jsx("button", { type: "button", className: "is-primary", onClick: handleOpenPhraseEditor, children: "\u6DFB\u52A0\u5E38\u7528\u8BED" })) : null, phraseActionsVisible ? _jsx("button", { type: "button", children: "\u5BFC\u51FA\u5E38\u7528\u8BED" }) : null] })] }), isLoading ? _jsx("div", { className: "im-setting-loading", children: "\u6B63\u5728\u540C\u6B65\u4F1A\u8BDD\u8BBE\u7F6E\u6570\u636E..." }) : null, !isLoading && (view?.phrases.length ?? 0) === 0 ? (_jsx("div", { className: "im-setting-empty", children: "\u5F53\u524D\u5206\u7C7B\u4E0B\u6682\u65E0\u5E38\u7528\u8BED" })) : (_jsx("div", { className: "im-phrase-list", children: (view?.phrases ?? []).map((phrase) => (_jsxs("article", { className: "im-phrase-card", children: [_jsxs("div", { children: [_jsx("strong", { children: phrase.title }), _jsx("span", { children: phrase.groupName })] }), _jsx("p", { children: phrase.content }), _jsxs("footer", { children: [_jsx("small", { children: phrase.updatedAt }), _jsx("button", { type: "button", "aria-label": `查看 ${phrase.title}`, onClick: () => setSelectedPhrase(phrase), children: "\u67E5\u770B" })] })] }, phrase.id))) }))] })] })) : null, activeTab === 'autoReply' ? (_jsxs("section", { className: "im-setting-panel im-auto-reply-panel", role: "region", "aria-label": "\u81EA\u52A8\u56DE\u590D\u8BBE\u7F6E", children: [_jsx("nav", { className: "im-auto-reply-subtabs", "aria-label": "\u81EA\u52A8\u56DE\u590D\u5B50\u6807\u7B7E", children: autoReplyPanels.map((panel) => (_jsx("button", { type: "button", className: activeAutoReplyPanel === panel.key ? 'is-active' : '', "aria-pressed": activeAutoReplyPanel === panel.key, onClick: () => setActiveAutoReplyPanel(panel.key), children: panel.label }, panel.key))) }), activeAutoReplyPanel === 'welcome' ? (_jsxs("div", { className: "im-auto-reply-simple", children: [_jsxs("div", { className: "im-auto-reply-toggle-row", children: [_jsx("strong", { children: "\u53D1\u9001\u6B22\u8FCE\u8BED" }), _jsx("span", { className: "im-auto-reply-toggle is-disabled", children: "\u505C\u7528" })] }), _jsx("p", { children: "\u5F53\u987E\u5BA2\u53D1\u9001\u7684\u7B2C\u4E00\u6761\u6D88\u606F\u5206\u914D\u5230\u4EBA\u5DE5\u63A5\u5F85\u65F6\uFF0C\u4F1A\u81EA\u52A8\u53D1\u9001\u56DE\u590D\uFF0C\u4E00\u5929\u5185\u53EA\u4F1A\u5BF9\u540C\u4E00\u987E\u5BA2\u53D1\u9001\u4E00\u6B21" })] })) : null, activeAutoReplyPanel === 'timeout' ? (_jsxs("div", { className: "im-auto-reply-simple", children: [_jsxs("div", { className: "im-auto-reply-toggle-row", children: [_jsx("strong", { children: "\u8D85\u65F6\u63D0\u9192" }), _jsx("span", { className: "im-auto-reply-toggle is-disabled", children: "\u505C\u7528" })] }), _jsx("p", { children: "\u5BA2\u6237\u7B49\u5F85\u5BA2\u670D\u56DE\u590D\u7684\u65F6\u95F4\u8D85\u65F6\u540E\uFF0C\u53D1\u8D77\u8FD9\u4E2A\u56DE\u590D" })] })) : null, activeAutoReplyPanel === 'task' ? (_jsxs("div", { className: "im-auto-reply-task", children: [_jsxs("div", { className: "im-auto-reply-task-toolbar", children: [_jsxs("div", { className: "im-auto-reply-task-filters", children: [_jsxs("label", { className: "im-auto-reply-search", children: [_jsx("input", { "aria-label": "\u4EFB\u52A1\u540D\u79F0\u6216\u8BDD\u672F", placeholder: "\u8F93\u5165\u4EFB\u52A1\u540D\u79F0\u6216\u8BDD\u672F", value: autoReplyTaskKeyword, onChange: (event) => setAutoReplyTaskKeyword(event.target.value) }), _jsx("button", { type: "button", "aria-label": "\u641C\u7D22\u4EFB\u52A1", children: "\u641C\u7D22" })] }), _jsx("label", { className: "im-auto-reply-scene-filter", children: _jsx("select", { "aria-label": "\u4EFB\u52A1\u573A\u666F\u7B5B\u9009", value: autoReplyTaskSceneFilter, onChange: (event) => setAutoReplyTaskSceneFilter(event.target.value), children: autoReplySceneOptions.map((option) => (_jsx("option", { value: option, children: option }, option))) }) })] }), _jsx("button", { type: "button", className: "is-primary", onClick: handleOpenAutoReplyTaskDialog, children: "\u65B0\u5EFA\u4EFB\u52A1" })] }), _jsx("div", { className: "im-auto-reply-task-table-wrap", children: _jsxs("table", { className: "im-auto-reply-task-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "\u4EFB\u52A1\u540D\u79F0" }), _jsx("th", { children: "\u4EFB\u52A1\u573A\u666F" }), _jsx("th", { children: "\u53D1\u9001\u65F6\u673A" }), _jsx("th", { children: "\u8BDD\u8BED" }), _jsx("th", { children: "\u662F\u5426\u542F\u7528" }), _jsx("th", { children: "\u64CD\u4F5C" })] }) }), _jsx("tbody", { children: filteredAutoReplyTasks.length === 0 ? (_jsx("tr", { children: _jsx("td", { colSpan: 6, children: _jsxs("div", { className: "im-auto-reply-task-empty", children: [_jsx("span", { className: "im-auto-reply-task-empty__icon", "aria-hidden": "true" }), _jsx("span", { children: "\u6682\u65E0\u6570\u636E" })] }) }) })) : (filteredAutoReplyTasks.map((task) => (_jsxs("tr", { children: [_jsx("td", { children: task.name }), _jsx("td", { children: task.scene }), _jsx("td", { children: task.timing }), _jsx("td", { children: task.content }), _jsx("td", { children: task.enabled ? '启用' : '停用' }), _jsx("td", { children: "\u8BE6\u60C5" })] }, task.id)))) })] }) })] })) : null] })) : null, activeTab === 'page' ? (_jsxs("section", { className: "im-setting-panel im-page-setting-panel", role: "region", "aria-label": "\u9875\u9762\u8BBE\u7F6E", children: [_jsxs("section", { className: "im-config-section", children: [_jsx("h2", { children: "\u4F1A\u8BDD\u6807\u7B7E" }), _jsxs("div", { className: "im-config-group", children: [_jsx("h3", { children: "\u8D85\u65F6\u63D0\u9192" }), _jsxs("label", { className: "im-config-check-line", children: [_jsx("input", { type: "checkbox", "aria-label": "\u4F1A\u8BDD\u56DE\u590D\u8D85\u65F6\u63D0\u9192", checked: pageSettings.timeoutReplyEnabled, onChange: (event) => setPageSettings((current) => ({
                                                    ...current,
                                                    timeoutReplyEnabled: event.target.checked,
                                                })) }), _jsx("span", { children: "\u5BA2\u6237\u7B49\u5F85\u56DE\u590D\u65F6\u95F4\u8FBE\u5230\uFF08\u5927\u4E8E\u7B49\u4E8E\uFF09" }), _jsx("input", { "aria-label": "\u4F1A\u8BDD\u56DE\u590D\u8D85\u65F6\u5206\u949F\u6570", value: pageSettings.timeoutReplyMinutes, onChange: (event) => setPageSettings((current) => ({
                                                    ...current,
                                                    timeoutReplyMinutes: event.target.value.replace(/[^\d]/g, '').slice(0, 2),
                                                })) }), _jsx("span", { children: "\u5206\u949F\uFF0C\u4F1A\u8BDD\u56DE\u590D\u8D85\u65F6\u3002" })] }), _jsxs("label", { className: "im-config-check-line", children: [_jsx("input", { type: "checkbox", "aria-label": "\u4F1A\u8BDD\u56DE\u590D\u4E25\u91CD\u8D85\u65F6\u63D0\u9192", checked: pageSettings.severeTimeoutReplyEnabled, onChange: (event) => setPageSettings((current) => ({
                                                    ...current,
                                                    severeTimeoutReplyEnabled: event.target.checked,
                                                })) }), _jsx("span", { children: "\u5BA2\u6237\u7B49\u5F85\u56DE\u590D\u65F6\u95F4\u8FBE\u5230\uFF08\u5927\u4E8E\u7B49\u4E8E\uFF09" }), _jsx("input", { "aria-label": "\u4F1A\u8BDD\u56DE\u590D\u4E25\u91CD\u8D85\u65F6\u5206\u949F\u6570", value: pageSettings.severeTimeoutReplyMinutes, onChange: (event) => setPageSettings((current) => ({
                                                    ...current,
                                                    severeTimeoutReplyMinutes: event.target.value.replace(/[^\d]/g, '').slice(0, 2),
                                                })) }), _jsx("span", { children: "\u5206\u949F\uFF0C\u4F1A\u8BDD\u56DE\u590D\u4E25\u91CD\u8D85\u65F6\u3002" })] })] }), _jsx("div", { className: "im-config-group", children: _jsxs("div", { className: "im-config-toggle-line", children: [_jsx("strong", { children: "\u9996\u56DE\u590D\u63D0\u9192" }), _jsx("span", { className: "im-config-info", "aria-hidden": "true", children: "i" }), _jsx("button", { type: "button", className: `im-switch ${pageSettings.firstReplyReminderEnabled ? 'is-on' : ''}`, "aria-pressed": pageSettings.firstReplyReminderEnabled, "aria-label": "\u9996\u56DE\u590D\u63D0\u9192\u5F00\u5173", onClick: () => setPageSettings((current) => ({
                                                ...current,
                                                firstReplyReminderEnabled: !current.firstReplyReminderEnabled,
                                            })) })] }) }), _jsxs("div", { className: "im-config-group", children: [_jsx("h3", { children: "\u9AD8\u6210\u4EA4\u63D0\u9192" }), _jsxs("label", { className: "im-config-check-line", children: [_jsx("input", { type: "checkbox", "aria-label": "\u9AD8\u6210\u4EA4\u63D0\u9192", checked: pageSettings.highConversionEnabled, onChange: (event) => setPageSettings((current) => ({
                                                    ...current,
                                                    highConversionEnabled: event.target.checked,
                                                })) }), _jsx("span", { children: "\u5BA2\u6237\u8FDE\u7EED\u53D1\u9001\u6D88\u606F\u8FBE\u5230\uFF08\u5927\u4E8E\u7B49\u4E8E\uFF09" }), _jsx("input", { "aria-label": "\u9AD8\u6210\u4EA4\u63D0\u9192\u6761\u6570", value: pageSettings.highConversionCount, onChange: (event) => setPageSettings((current) => ({
                                                    ...current,
                                                    highConversionCount: event.target.value.replace(/[^\d]/g, '').slice(0, 2),
                                                })) }), _jsx("span", { children: "\u6761\uFF0C\u4E3A\u9AD8\u6210\u4EA4\u7387\u3002" })] })] })] }), _jsxs("section", { className: "im-config-section", children: [_jsx("h2", { children: "\u6D88\u606F\u901A\u77E5" }), _jsxs("div", { className: "im-config-sound-line", children: [_jsx("span", { children: "\u65B0\u6D88\u606F\u63D0\u9192:" }), _jsxs("label", { className: "im-config-inline-check", children: [_jsx("input", { type: "checkbox", "aria-label": "\u58F0\u97F3\u901A\u77E5", checked: pageSettings.soundNotifyEnabled, onChange: (event) => setPageSettings((current) => ({
                                                    ...current,
                                                    soundNotifyEnabled: event.target.checked,
                                                })) }), _jsx("span", { children: "\u58F0\u97F3\u901A\u77E5" })] }), _jsx("span", { children: "\u97F3\u91CF" }), _jsx("input", { type: "range", min: "0", max: "100", "aria-label": "\u6D88\u606F\u901A\u77E5\u97F3\u91CF", value: pageSettings.volume, onChange: (event) => setPageSettings((current) => ({
                                            ...current,
                                            volume: Number(event.target.value),
                                        })) })] })] }), _jsx("div", { className: "im-setting-save-bar", children: _jsx("button", { type: "button", className: "is-primary", onClick: () => setFeedback({ tone: 'success', text: '页面设置已保存' }), children: "\u4FDD\u5B58" }) })] })) : null, activeTab === 'tags' ? (_jsx("section", { className: "im-setting-panel im-tag-setting-panel", role: "region", "aria-label": "\u6807\u7B7E\u8BBE\u7F6E", children: _jsxs("section", { className: "im-config-section", children: [_jsx("h2", { children: "\u5BA2\u6237\u6807\u7B7E" }), _jsx("div", { className: "im-tag-toolbar", children: _jsxs("label", { className: "im-auto-reply-search", children: [_jsx("input", { "aria-label": "\u6807\u7B7E\u5185\u5BB9\u641C\u7D22", placeholder: "\u8F93\u5165\u6807\u7B7E\u5185\u5BB9", value: tagKeyword, onChange: (event) => setTagKeyword(event.target.value) }), _jsx("button", { type: "button", "aria-label": "\u641C\u7D22\u6807\u7B7E", children: "\u641C\u7D22" })] }) }), _jsx("div", { className: "im-tag-table-wrap", children: _jsxs("table", { className: "im-auto-reply-task-table im-tag-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "\u6807\u7B7E\u7C7B\u578B" }), _jsx("th", { children: "\u6807\u7B7E\u5185\u5BB9" }), _jsx("th", { children: "\u662F\u5426\u542F\u7528" }), _jsx("th", { children: "\u64CD\u4F5C" })] }) }), _jsx("tbody", { children: filteredCustomerTags.length === 0 ? (_jsx("tr", { children: _jsx("td", { colSpan: 4, children: _jsxs("div", { className: "im-auto-reply-task-empty", children: [_jsx("span", { className: "im-auto-reply-task-empty__icon", "aria-hidden": "true" }), _jsx("span", { children: "\u6682\u65E0\u6570\u636E" })] }) }) })) : (filteredCustomerTags.map((item) => (_jsxs("tr", { children: [_jsx("td", { children: item.type }), _jsx("td", { children: item.contents.join('，') }), _jsx("td", { children: _jsx("button", { type: "button", className: `im-switch im-switch--labeled ${item.enabled ? 'is-on' : ''}`, "aria-pressed": item.enabled, "aria-label": `${item.type}启用开关`, onClick: () => setCustomerTags((current) => current.map((row) => (row.id === item.id ? { ...row, enabled: !row.enabled } : row))), children: _jsx("span", { children: item.enabled ? '启用' : '停用' }) }) }), _jsx("td", { children: _jsx("button", { type: "button", className: "im-table-action-button", onClick: () => handleOpenTagEditor(item), children: "\u7F16\u8F91" }) })] }, item.id)))) })] }) }), _jsxs("div", { className: "im-tag-pagination", children: [_jsx("span", { children: "\u7B2C 1-1 \u6761/\u603B\u5171 1 \u6761" }), _jsx("button", { type: "button", "aria-label": "\u4E0A\u4E00\u9875", disabled: true, children: "\u2039" }), _jsx("button", { type: "button", className: "is-current", "aria-label": "\u7B2C1\u9875", children: "1" }), _jsx("button", { type: "button", "aria-label": "\u4E0B\u4E00\u9875", disabled: true, children: "\u203A" }), _jsx("select", { "aria-label": "\u6BCF\u9875\u6761\u6570", children: _jsx("option", { children: "10 \u6761/\u9875" }) })] })] }) })) : null, activeTab === 'shortcuts' ? (_jsxs("section", { className: "im-setting-panel im-shortcut-setting-panel", role: "region", "aria-label": "\u5FEB\u6377\u952E\u8BBE\u7F6E", children: [_jsx("div", { className: "im-shortcut-setting-grid", children: shortcutDraft.map((item) => (_jsxs("div", { className: "im-shortcut-setting-row", children: [_jsx("strong", { children: item.name }), _jsx("span", { className: "im-shortcut-pill", children: item.win }), _jsx("span", { className: "im-shortcut-pill", children: item.mac }), _jsxs("label", { className: "im-shortcut-checkbox", children: [_jsx("input", { type: "checkbox", checked: item.isOpen, "aria-label": `${item.name}开关`, onChange: () => handleToggleShortcut(item.code) }), _jsx("span", { "aria-hidden": "true" })] })] }, item.code))) }), _jsx("div", { className: "im-setting-save-bar", children: _jsx("button", { type: "button", className: "is-primary", onClick: () => void handleSaveShortcuts(), children: "\u4FDD\u5B58" }) })] })) : null, activeTab === 'version' ? (_jsxs("section", { className: "im-setting-panel im-version-setting-panel", role: "region", "aria-label": "\u7248\u672C\u8BBE\u7F6E", children: [_jsx("p", { className: "im-version-setting-tip", children: "\u4F1A\u8BDD\u9ED8\u8BA4\u57FA\u7840\u7248\u672C\uFF0C\u53EF\u6839\u636E\u9700\u8981\u5207\u6362\u7248\u672C" }), _jsxs("section", { className: "im-version-setting-group", children: [_jsx("h2", { children: "\u9009\u62E9\u4F1A\u8BDD\u7248\u672C" }), _jsxs("label", { className: "im-version-option", children: [_jsx("input", { type: "radio", name: "conversation-version", value: "basic", checked: selectedVersion === 'basic', onChange: () => setSelectedVersion('basic') }), _jsxs("div", { children: [_jsx("strong", { children: "\u4F1A\u8BDD\u57FA\u7840\u7248" }), _jsx("p", { children: "\u4F1A\u8BDD\u57FA\u7840\u7248\u672C\uFF0C\u6EE1\u8DB3\u623F\u4E1C\u591A\u6E20\u9053\u63A5\u5165\uFF0C\u8FDB\u884C\u5373\u65F6\u4F1A\u8BDD" })] })] }), _jsxs("label", { className: "im-version-option", children: [_jsx("input", { type: "radio", name: "conversation-version", value: "upgrade", checked: selectedVersion === 'upgrade', onChange: () => setSelectedVersion('upgrade') }), _jsxs("div", { children: [_jsx("strong", { children: "\u4F1A\u8BDD\u5347\u7EA7\u7248" }), _jsx("p", { children: "\u4F1A\u8BDD\u5347\u7EA7\u7248\u672C\uFF0C\u5728\u57FA\u7840\u7248\u672C\u7684\u57FA\u7840\u4E0A\uFF0C\u63D0\u4F9B\u5BA2\u670D\u5750\u5E2D\uFF0C\u589E\u52A0\u4F1A\u8BDD\u6D3E\u5355\u673A\u5236\uFF0C\u63D0\u9AD8\u54CD\u5E94\u670D\u52A1\u6548\u7387" })] })] })] }), _jsx("div", { className: "im-setting-save-bar", children: _jsx("button", { type: "button", className: "is-primary", onClick: () => setFeedback({ tone: 'success', text: '版本设置已保存' }), children: "\u4FDD\u5B58" }) })] })) : null, selectedPhrase ? (_jsx("div", { className: "im-setting-dialog-backdrop", children: _jsxs("section", { className: "im-setting-dialog", role: "dialog", "aria-label": "\u5E38\u7528\u8BED\u8BE6\u60C5", children: [_jsxs("header", { children: [_jsx("h2", { children: "\u5E38\u7528\u8BED\u8BE6\u60C5" }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u5E38\u7528\u8BED\u8BE6\u60C5", onClick: () => setSelectedPhrase(null), children: "\u00D7" })] }), _jsxs("div", { className: "im-setting-dialog-content", children: [_jsx("strong", { children: selectedPhrase.title }), _jsx("p", { children: selectedPhrase.content }), _jsx("small", { children: selectedPhrase.groupName })] })] }) })) : null, isCategoryDialogOpen ? (_jsx("div", { className: "im-setting-dialog-backdrop", children: _jsxs("section", { className: "im-setting-dialog im-setting-dialog--compact", role: "dialog", "aria-label": "\u65B0\u5EFA\u5206\u7C7B", children: [_jsx("header", { children: _jsx("h2", { children: "\u65B0\u5EFA\u5206\u7C7B" }) }), _jsx("div", { className: "im-setting-dialog-form im-setting-dialog-form--compact", children: _jsxs("label", { className: "im-setting-form-row", children: [_jsx("span", { className: "im-setting-form-label is-required", children: "\u5206\u7C7B\u540D\u79F0\uFF1A" }), _jsx("input", { "aria-label": "\u5206\u7C7B\u540D\u79F0", placeholder: "\u8BF7\u8F93\u5165\u4E00\u7EA7\u5206\u7C7B\u540D\u79F0", value: newCategoryName, onChange: (event) => setNewCategoryName(event.target.value) })] }) }), _jsxs("footer", { className: "im-setting-dialog-actions", children: [_jsx("button", { type: "button", onClick: () => setIsCategoryDialogOpen(false), children: "\u53D6\u6D88" }), _jsx("button", { type: "button", className: "is-primary", onClick: handleSaveCategory, children: "\u786E\u5B9A" })] })] }) })) : null, isPhraseEditorOpen ? (_jsx("div", { className: "im-setting-dialog-backdrop", children: _jsxs("section", { className: "im-setting-dialog im-setting-dialog--wide", role: "dialog", "aria-label": "\u6DFB\u52A0\u5E38\u7528\u8BED", children: [_jsxs("header", { children: [_jsx("h2", { children: "\u6DFB\u52A0\u5E38\u7528\u8BED" }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u6DFB\u52A0\u5E38\u7528\u8BED", onClick: () => setIsPhraseEditorOpen(false), children: "\u00D7" })] }), _jsxs("div", { className: "im-setting-dialog-form", children: [_jsxs("label", { className: "im-setting-form-row", children: [_jsx("span", { className: "im-setting-form-label is-required", children: "\u6807\u9898\uFF1A" }), _jsx("input", { "aria-label": "\u6807\u9898", placeholder: "\u8BF7\u8F93\u5165\u6807\u9898", value: phraseDraft.title, onChange: (event) => setPhraseDraft((current) => ({
                                                ...current,
                                                title: event.target.value,
                                            })) })] }), _jsxs("label", { className: "im-setting-form-row", children: [_jsx("span", { className: "im-setting-form-label is-required", children: "\u5206\u7C7B\uFF1A" }), _jsxs("select", { "aria-label": "\u5206\u7C7B", value: phraseDraft.groupId, onChange: (event) => setPhraseDraft((current) => ({
                                                ...current,
                                                groupId: event.target.value,
                                            })), children: [_jsx("option", { value: "", disabled: true, children: "\u8BF7\u9009\u62E9\u5206\u7C7B" }), (view?.phraseGroups ?? []).map((group) => (_jsx("option", { value: group.id, children: group.name }, group.id)))] })] }), _jsxs("label", { className: "im-setting-form-row im-setting-form-row--textarea", children: [_jsx("span", { className: "im-setting-form-label is-required", children: "\u56DE\u590D\u5185\u5BB9\uFF1A" }), _jsxs("div", { className: "im-setting-form-control", children: [_jsx("textarea", { "aria-label": "\u56DE\u590D\u5185\u5BB9", placeholder: "\u8BF7\u8F93\u5165\u56DE\u590D\u5185\u5BB9", value: phraseDraft.content, onChange: (event) => setPhraseDraft((current) => ({
                                                        ...current,
                                                        content: event.target.value,
                                                    })), rows: 5, maxLength: 500 }), _jsxs("span", { className: "im-setting-form-counter", children: [phraseDraft.content.length, " / 500"] })] })] })] }), _jsxs("footer", { className: "im-setting-dialog-actions", children: [_jsx("button", { type: "button", onClick: () => setIsPhraseEditorOpen(false), children: "\u53D6\u6D88" }), _jsx("button", { type: "button", className: "is-primary", onClick: handleSavePhrase, children: "\u786E\u5B9A" })] })] }) })) : null, isTagEditorOpen ? (_jsx("div", { className: "im-setting-dialog-backdrop", children: _jsxs("section", { className: "im-setting-dialog im-setting-dialog--tag-editor", role: "dialog", "aria-label": "\u7F16\u8F91\u6807\u7B7E", children: [_jsxs("header", { children: [_jsx("h2", { children: "\u7F16\u8F91\u6807\u7B7E" }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u7F16\u8F91\u6807\u7B7E", onClick: () => setIsTagEditorOpen(false), children: "\u00D7" })] }), _jsxs("div", { className: "im-setting-dialog-form", children: [_jsxs("label", { className: "im-setting-form-row", children: [_jsx("span", { className: "im-setting-form-label is-required", children: "\u6807\u7B7E\u7EC4\uFF1A" }), _jsx("input", { "aria-label": "\u6807\u7B7E\u7EC4", value: editingTag?.type ?? '', readOnly: true })] }), _jsxs("div", { className: "im-setting-form-row im-setting-form-row--tag-editor", children: [_jsx("span", { className: "im-setting-form-label is-required", children: "\u6807\u7B7E\u5185\u5BB9\uFF1A" }), _jsx("div", { className: "im-tag-editor-list", children: tagEditorContents.map((content, index) => (_jsxs("div", { className: "im-tag-editor-row", children: [_jsx("input", { "aria-label": `标签内容${index + 1}`, placeholder: "\u8BF7\u8F93\u5165\u6807\u7B7E\u5185\u5BB9", value: content, onChange: (event) => handleChangeTagEditorContent(index, event.target.value) }), _jsx("button", { type: "button", className: "im-tag-editor-remove", "aria-label": `删除标签内容${index + 1}`, onClick: () => handleRemoveTagEditorContent(index), children: "\uFF0D" }), index === tagEditorContents.length - 1 ? (_jsxs("button", { type: "button", className: "im-tag-editor-add", onClick: handleAddTagEditorContent, children: [_jsx("span", { "aria-hidden": "true", children: "\uFF0B" }), "\u6DFB\u52A0\u6807\u7B7E\u5185\u5BB9"] })) : null] }, `${editingTagId ?? 'tag'}-${index}`))) })] })] }), _jsxs("footer", { className: "im-setting-dialog-actions", children: [_jsx("button", { type: "button", onClick: () => setIsTagEditorOpen(false), children: "\u53D6\u6D88" }), _jsx("button", { type: "button", className: "is-primary", onClick: handleSaveTagEditor, children: "\u786E\u5B9A" })] })] }) })) : null, isAutoReplyTaskDialogOpen ? (_jsx("div", { className: "im-setting-dialog-backdrop", children: _jsxs("section", { className: "im-setting-dialog im-setting-dialog--task", role: "dialog", "aria-label": "\u65B0\u5EFA\u4EFB\u52A1", children: [_jsxs("header", { children: [_jsx("h2", { children: "\u65B0\u5EFA\u4EFB\u52A1" }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u65B0\u5EFA\u4EFB\u52A1", onClick: () => setIsAutoReplyTaskDialogOpen(false), children: "\u00D7" })] }), _jsxs("div", { className: "im-setting-dialog-form", children: [_jsxs("label", { className: "im-setting-form-row", children: [_jsx("span", { className: "im-setting-form-label is-required", children: "\u4EFB\u52A1\u573A\u666F\uFF1A" }), _jsx("select", { "aria-label": "\u4EFB\u52A1\u573A\u666F", value: autoReplyTaskDraft.scene, onChange: (event) => setAutoReplyTaskDraft((current) => ({
                                                ...current,
                                                scene: event.target.value,
                                            })), children: autoReplySceneOptions.filter((option) => option !== '全部任务场景').map((option) => (_jsx("option", { value: option, children: option }, option))) })] }), _jsxs("label", { className: "im-setting-form-row", children: [_jsx("span", { className: "im-setting-form-label is-required", children: "\u4EFB\u52A1\u540D\u79F0\uFF1A" }), _jsx("input", { "aria-label": "\u4EFB\u52A1\u540D\u79F0", placeholder: "\u8F93\u5165\u4E8B\u4EF6\u540D\u79F0", value: autoReplyTaskDraft.name, onChange: (event) => setAutoReplyTaskDraft((current) => ({
                                                ...current,
                                                name: event.target.value,
                                            })) })] }), _jsxs("div", { className: "im-setting-form-row im-setting-form-row--timing", children: [_jsx("span", { className: "im-setting-form-label", children: "\u53D1\u9001\u65F6\u673A\uFF1A" }), _jsxs("div", { className: "im-auto-reply-task-timing", children: [_jsx("span", { children: "\u5BA2\u6237\u54A8\u8BE2\u540E\uFF0C" }), _jsx("input", { "aria-label": "\u53D1\u9001\u5206\u949F\u6570", inputMode: "numeric", value: autoReplyTaskDraft.minutes, onChange: (event) => setAutoReplyTaskDraft((current) => ({
                                                        ...current,
                                                        minutes: event.target.value.replace(/[^\d]/g, '').slice(0, 3),
                                                    })) }), _jsx("span", { children: "\u5206\u949F\u672A\u4E0B\u5355\u4E14\u672A\u56DE\u590D" })] })] }), _jsxs("label", { className: "im-setting-form-row im-setting-form-row--textarea", children: [_jsx("span", { className: "im-setting-form-label is-required", children: "\u50AC\u5355\u8BDD\u672F\uFF1A" }), _jsxs("div", { className: "im-setting-form-control", children: [_jsx("textarea", { "aria-label": "\u50AC\u5355\u8BDD\u672F", value: autoReplyTaskDraft.content, onChange: (event) => setAutoReplyTaskDraft((current) => ({
                                                        ...current,
                                                        content: event.target.value,
                                                    })), rows: 5, maxLength: 500 }), _jsxs("span", { className: "im-setting-form-counter", children: [autoReplyTaskDraft.content.length, " / 500"] })] })] })] }), _jsxs("footer", { className: "im-setting-dialog-actions", children: [_jsx("button", { type: "button", onClick: () => setIsAutoReplyTaskDialogOpen(false), children: "\u53D6\u6D88" }), _jsx("button", { type: "button", className: "is-primary", onClick: handleSaveAutoReplyTask, children: "\u786E\u5B9A" })] })] }) })) : null] }));
}
