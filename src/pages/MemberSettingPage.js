import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { bindMemberWecom, createDefaultMemberSettingQuery, createEditorDraft, loadMemberSettingViewModel, MemberSettingServiceError, resolveMemberSettingRuntimeConfig, saveMemberSettingMember, } from '../services/memberSetting';
import './MemberSettingPage.css';
const defaultContract = {
    provider: 'mock',
    responseState: 'loading',
    endpoint: '/setting/member/bootstrap',
    traceId: '',
    timestamp: '',
    routeMode: 'list',
    request: {},
};
export function MemberSettingPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const flashMessage = readLocationFlashMessage(location.state);
    const runtimeConfig = useMemo(() => resolveMemberSettingRuntimeConfig({ pathname: location.pathname, search: location.search }), [location.pathname, location.search]);
    const query = useMemo(() => createDefaultMemberSettingQuery(runtimeConfig), [runtimeConfig]);
    const queryKey = JSON.stringify(query);
    return _jsx(MemberSettingSurface, { flashMessage: flashMessage, navigate: navigate, query: query }, queryKey);
}
function MemberSettingSurface({ flashMessage, navigate, query, }) {
    const pendingFeedbackRef = useRef(flashMessage);
    const [keyword, setKeyword] = useState(query.keyword);
    const [selectedRole, setSelectedRole] = useState(query.roleName);
    const [mockStateOverride, setMockStateOverride] = useState(null);
    const [reloadKey, setReloadKey] = useState(0);
    const [state, setState] = useState({
        kind: 'loading',
        contract: {
            ...defaultContract,
            provider: query.provider ?? 'mock',
            routeMode: query.routeMode,
        },
    });
    const [feedback, setFeedback] = useState(flashMessage ?? (query.routeMode === 'list' ? '成员设置数据加载中...' : '正在加载成员表单...'));
    const [bindTarget, setBindTarget] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
    const [formRoleDropdownOpen, setFormRoleDropdownOpen] = useState(false);
    const [draft, setDraft] = useState(createEditorDraft(query));
    const [roomSearch, setRoomSearch] = useState('');
    const [formError, setFormError] = useState('');
    useEffect(() => {
        const abort = new AbortController();
        const requestQuery = {
            ...query,
            keyword: query.routeMode === 'list' ? keyword : query.keyword,
            roleName: query.routeMode === 'list' ? selectedRole : query.roleName,
            mockState: mockStateOverride ?? query.mockState,
        };
        queueMicrotask(() => {
            if (abort.signal.aborted) {
                return;
            }
            setState((current) => ({
                kind: 'loading',
                contract: {
                    ...current.contract,
                    provider: requestQuery.provider ?? 'mock',
                    responseState: 'loading',
                    routeMode: requestQuery.routeMode,
                    request: requestQuery,
                },
            }));
        });
        loadMemberSettingViewModel(requestQuery, abort.signal)
            .then((data) => {
            if (data.routeMode !== 'list') {
                setDraft(data.editor.draft);
            }
            setState({
                kind: 'ready',
                data,
                contract: toContract(data),
            });
            if (data.routeMode === 'list') {
                if (pendingFeedbackRef.current) {
                    setFeedback(pendingFeedbackRef.current);
                    pendingFeedbackRef.current = null;
                }
                else {
                    setFeedback(data.state === 'empty' ? '暂无数据' : '成员设置数据已更新');
                }
            }
            else {
                setFeedback(data.editor.title);
            }
        })
            .catch((error) => {
            if (error instanceof DOMException && error.name === 'AbortError') {
                return;
            }
            const message = error instanceof Error ? error.message : '成员设置数据加载失败，请稍后重试';
            setState({
                kind: 'error',
                message,
                contract: toErrorContract(error, requestQuery),
            });
            setFeedback(message);
        });
        return () => abort.abort();
    }, [keyword, mockStateOverride, query, reloadKey, selectedRole]);
    const contractJson = JSON.stringify(state.contract);
    const readyData = state.kind === 'ready' ? state.data : null;
    const roomOptions = readyData?.roomCategories ?? [];
    const filteredRoomOptions = roomOptions.filter((item) => item.roomCategoryName.includes(roomSearch.trim()));
    function updateDraft(nextPatch) {
        setDraft((current) => ({ ...current, ...nextPatch }));
        setFormError('');
    }
    async function handleBindConfirm() {
        if (!bindTarget) {
            return;
        }
        setIsSubmitting(true);
        try {
            await bindMemberWecom(query, bindTarget.userId);
            setBindTarget(null);
            pendingFeedbackRef.current = '企微绑定成功';
            setFeedback('企微绑定成功');
            setReloadKey((current) => current + 1);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : '企微绑定失败，请稍后重试';
            setFeedback(message);
        }
        finally {
            setIsSubmitting(false);
        }
    }
    async function handleSubmit() {
        setIsSubmitting(true);
        setFormError('');
        try {
            await saveMemberSettingMember(query, draft);
            navigate('/setting/member', {
                state: {
                    memberSettingFlashMessage: '成员保存成功',
                },
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : '成员保存失败，请稍后重试';
            setFormError(message);
            setFeedback(message);
        }
        finally {
            setIsSubmitting(false);
        }
    }
    function toggleRoomCategory(roomCategoryId, checked) {
        const nextIds = checked
            ? [...new Set([...draft.roomCategoryIds, roomCategoryId])]
            : draft.roomCategoryIds.filter((id) => id !== roomCategoryId);
        updateDraft({ roomCategoryIds: nextIds });
    }
    function toggleAllRoomCategories(checked) {
        updateDraft({ roomCategoryIds: checked ? roomOptions.map((item) => item.roomCategoryId) : [] });
    }
    return (_jsxs("div", { className: "member-setting-shell", children: [_jsx("pre", { hidden: true, "data-testid": "member-setting-service-contract", "data-provider": state.contract.provider, "data-response-state": state.contract.responseState, "data-endpoint": state.contract.endpoint, "data-route-mode": state.contract.routeMode, children: contractJson }), query.routeMode === 'list' ? (_jsxs("div", { className: "member-setting-page", children: [_jsxs("section", { className: "member-setting-panel", "aria-label": "\u6210\u5458\u8BBE\u7F6E", children: [_jsx("div", { className: "member-setting-feedback", role: "status", "aria-label": "\u6210\u5458\u8BBE\u7F6E\u64CD\u4F5C\u53CD\u9988", children: feedback }), _jsxs("div", { className: "member-filter-section", children: [_jsxs("div", { className: "member-filter-row member-filter-row--fields", children: [_jsxs("label", { className: "member-filter-control", children: [_jsx("span", { children: "\u641C\u7D22\uFF1A" }), _jsx("input", { type: "text", placeholder: "\u59D3\u540D/\u624B\u673A\u53F7/\u89D2\u8272", value: keyword, onChange: (event) => {
                                                            setMockStateOverride(null);
                                                            setKeyword(event.target.value);
                                                        } })] }), _jsxs("div", { className: "member-filter-control member-filter-control--role", children: [_jsx("span", { children: "\u89D2\u8272\uFF1A" }), _jsx("button", { type: "button", className: `member-role-select${roleDropdownOpen ? ' is-open' : ''}`, "aria-haspopup": "listbox", "aria-expanded": roleDropdownOpen, disabled: state.kind !== 'ready', onClick: () => setRoleDropdownOpen((open) => !open), children: selectedRole }), roleDropdownOpen && readyData ? (_jsx("ul", { className: "member-role-options", role: "listbox", "aria-label": "\u89D2\u8272\u7B5B\u9009", children: readyData.roles.map((role) => (_jsx("li", { role: "option", "aria-selected": selectedRole === role.roleName, tabIndex: 0, onClick: () => {
                                                                setSelectedRole(role.roleName);
                                                                setMockStateOverride(null);
                                                                setRoleDropdownOpen(false);
                                                            }, children: role.roleName }, role.roleId))) })) : null] })] }), _jsxs("div", { className: "member-filter-row member-filter-row--summary", children: [_jsxs("strong", { children: ["\u6210\u5458\u8D26\u53F7\u6570\uFF1A", readyData?.summary.usedEmployeeNum ?? 0, "/", readyData?.summary.employeeNum ?? 0] }), _jsx("button", { type: "button", className: "member-primary-button", disabled: state.kind !== 'ready', onClick: () => navigate('/setting/member/actions'), children: "\u6DFB\u52A0\u6210\u5458" })] })] }), state.kind === 'error' ? (_jsxs("section", { className: "member-state-card member-state-card--error", role: "alert", "aria-label": "\u6210\u5458\u8BBE\u7F6E\u9519\u8BEF\u72B6\u6001", children: [_jsx("h2", { children: "\u6210\u5458\u8BBE\u7F6E\u6570\u636E\u52A0\u8F7D\u5931\u8D25" }), _jsx("p", { children: state.message }), _jsx("button", { type: "button", className: "member-primary-button", onClick: () => {
                                            setMockStateOverride('success');
                                            setReloadKey((current) => current + 1);
                                        }, children: "\u91CD\u8BD5" })] })) : null, state.kind === 'loading' ? (_jsxs("section", { className: "member-state-card", role: "status", "aria-label": "\u6210\u5458\u8BBE\u7F6E\u52A0\u8F7D\u4E2D", children: [_jsx("h2", { children: "\u6210\u5458\u8BBE\u7F6E\u6570\u636E\u52A0\u8F7D\u4E2D" }), _jsx("p", { children: "\u6B63\u5728\u540C\u6B65\u6210\u5458\u3001\u89D2\u8272\u548C\u623F\u578B\u6570\u636E\uFF0C\u8BF7\u7A0D\u5019\u3002" })] })) : null, state.kind === 'ready' ? renderMemberList(state.data, navigate, setBindTarget, setFeedback) : null] }), bindTarget ? (_jsx("div", { className: "member-modal-backdrop", role: "presentation", children: _jsxs("section", { className: "member-dialog", role: "dialog", "aria-modal": "true", "aria-label": "\u4F01\u5FAE\u7ED1\u5B9A", children: [_jsxs("header", { children: [_jsx("h2", { children: "\u4F01\u5FAE\u7ED1\u5B9A" }), _jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u4F01\u5FAE\u7ED1\u5B9A", onClick: () => setBindTarget(null), children: "\u00D7" })] }), _jsx("p", { children: "\u786E\u8BA4\u5C06\u5F53\u524D\u6210\u5458\u6807\u8BB0\u4E3A\u5DF2\u7ED1\u5B9A\u4F01\u5FAE\u5417\uFF1F" }), _jsx("strong", { children: bindTarget.name }), _jsxs("footer", { children: [_jsx("button", { type: "button", className: "member-secondary-button", disabled: isSubmitting, onClick: () => setBindTarget(null), children: "\u53D6\u6D88" }), _jsx("button", { type: "button", className: "member-primary-button", disabled: isSubmitting, onClick: () => void handleBindConfirm(), children: "\u786E\u8BA4\u7ED1\u5B9A" })] })] }) })) : null] })) : (_jsx("div", { className: "member-action-page", children: _jsxs("section", { className: "member-action-panel", "aria-label": "\u6DFB\u52A0\u6210\u5458", children: [_jsx("div", { className: "member-setting-feedback", role: "status", "aria-label": "\u6210\u5458\u8BBE\u7F6E\u64CD\u4F5C\u53CD\u9988", children: feedback }), _jsxs("div", { className: "member-breadcrumb", children: [_jsx("button", { type: "button", onClick: () => navigate('/setting/member'), children: "\u6210\u5458\u8BBE\u7F6E" }), _jsx("span", { children: "/" }), _jsx("strong", { children: readyData?.editor.title ?? '添加成员' })] }), state.kind === 'error' ? (_jsxs("section", { className: "member-state-card member-state-card--error", role: "alert", "aria-label": "\u6210\u5458\u8BBE\u7F6E\u9519\u8BEF\u72B6\u6001", children: [_jsx("h2", { children: "\u6210\u5458\u8BBE\u7F6E\u6570\u636E\u52A0\u8F7D\u5931\u8D25" }), _jsx("p", { children: state.message }), _jsx("button", { type: "button", className: "member-primary-button", onClick: () => {
                                        setMockStateOverride('success');
                                        setReloadKey((current) => current + 1);
                                    }, children: "\u91CD\u8BD5" })] })) : null, state.kind === 'loading' ? (_jsxs("section", { className: "member-state-card", role: "status", "aria-label": "\u6210\u5458\u8BBE\u7F6E\u52A0\u8F7D\u4E2D", children: [_jsx("h2", { children: "\u6210\u5458\u8BBE\u7F6E\u6570\u636E\u52A0\u8F7D\u4E2D" }), _jsx("p", { children: "\u6B63\u5728\u540C\u6B65\u6210\u5458\u3001\u89D2\u8272\u548C\u623F\u578B\u6570\u636E\uFF0C\u8BF7\u7A0D\u5019\u3002" })] })) : null, state.kind === 'ready' ? (_jsx(MemberActionForm, { draft: draft, feedback: feedback, filteredRoomOptions: filteredRoomOptions, formError: formError, formRoleDropdownOpen: formRoleDropdownOpen, isSubmitting: isSubmitting, navigate: navigate, onRoleDropdownToggle: () => setFormRoleDropdownOpen((open) => !open), onRoomSearchChange: setRoomSearch, onSubmit: () => void handleSubmit(), onToggleAllRoomCategories: toggleAllRoomCategories, onToggleRoomCategory: toggleRoomCategory, roomOptions: roomOptions, roomSearch: roomSearch, setFormRoleDropdownOpen: setFormRoleDropdownOpen, updateDraft: updateDraft, viewModel: state.data })) : null] }) }))] }));
}
function MemberActionForm({ draft, filteredRoomOptions, formError, formRoleDropdownOpen, isSubmitting, navigate, onRoleDropdownToggle, onRoomSearchChange, onSubmit, onToggleAllRoomCategories, onToggleRoomCategory, roomOptions, roomSearch, setFormRoleDropdownOpen, updateDraft, viewModel, }) {
    return (_jsxs(_Fragment, { children: [_jsx("h1", { children: "\u57FA\u672C\u8D44\u6599" }), _jsxs("div", { className: "member-action-form", children: [_jsxs("label", { className: "member-action-field", children: [_jsx("span", { children: "* \u6210\u5458\u59D3\u540D\uFF1A" }), _jsx("input", { "aria-label": "\u6210\u5458\u59D3\u540D", placeholder: "\u8BF7\u8F93\u5165\u6210\u5458\u59D3\u540D", value: draft.name, onChange: (event) => updateDraft({ name: event.target.value }) })] }), _jsxs("label", { className: "member-action-field", children: [_jsx("span", { children: "* \u624B\u673A\u53F7\uFF1A" }), _jsx("input", { "aria-label": "\u624B\u673A\u53F7", placeholder: "\u8BF7\u8F93\u5165\u624B\u673A\u53F7", value: draft.phone, onChange: (event) => updateDraft({ phone: event.target.value }) })] }), _jsxs("div", { className: "member-action-field", children: [_jsx("span", { children: "\u89D2\u8272\uFF1A" }), _jsxs("div", { className: "member-form-role", children: [_jsx("button", { type: "button", className: "member-action-select", onClick: onRoleDropdownToggle, children: draft.roleName || viewModel.editor.rolePlaceholder }), formRoleDropdownOpen ? (_jsx("ul", { className: "member-role-options member-role-options--form", role: "listbox", "aria-label": "\u89D2\u8272\u9009\u62E9", children: viewModel.roles
                                            .filter((role) => role.roleName !== '全部')
                                            .map((role) => (_jsx("li", { role: "option", "aria-selected": draft.roleId === role.roleId, tabIndex: 0, onClick: () => {
                                                updateDraft({ roleId: role.roleId, roleName: role.roleName });
                                                setFormRoleDropdownOpen(false);
                                            }, children: role.roleName }, role.roleId))) })) : null] })] }), _jsxs("div", { className: "member-room-section", children: [_jsx("div", { className: "member-room-heading", children: "\u5206\u914D\u623F\u578B" }), _jsxs("div", { children: [_jsxs("div", { className: "member-room-toolbar", children: [_jsxs("label", { className: "member-check-all", children: [_jsx("input", { type: "checkbox", "aria-label": "\u5168\u9009", checked: draft.roomCategoryIds.length === roomOptions.length && roomOptions.length > 0, onChange: (event) => onToggleAllRoomCategories(event.target.checked) }), _jsx("span", { children: "\u5168\u9009" })] }), _jsx("input", { className: "member-room-search", placeholder: viewModel.editor.roomSearchPlaceholder, value: roomSearch, onChange: (event) => onRoomSearchChange(event.target.value) })] }), _jsx("div", { className: "member-room-list", children: filteredRoomOptions.map((roomCategory) => (_jsx(RoomCategoryCheckbox, { checked: draft.roomCategoryIds.includes(roomCategory.roomCategoryId), roomCategory: roomCategory, onChange: (checked) => onToggleRoomCategory(roomCategory.roomCategoryId, checked) }, roomCategory.roomCategoryId))) })] })] }), formError ? _jsx("div", { className: "member-form-error", children: formError }) : null, _jsxs("div", { className: "member-form-actions", children: [_jsx("button", { type: "button", className: "member-secondary-button", onClick: () => navigate('/setting/member'), children: "\u53D6\u6D88" }), _jsx("button", { type: "button", className: "member-primary-button", disabled: isSubmitting, onClick: onSubmit, children: viewModel.editor.submitText })] })] })] }));
}
function renderMemberList(viewModel, navigate, setBindTarget, setFeedback) {
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "member-table-wrap", role: "table", "aria-label": "\u6210\u5458\u8D26\u53F7\u5217\u8868", children: [_jsx("div", { className: "member-table-head", role: "row", children: ['姓名', '手机号', '角色', '企微', '邮箱', '操作'].map((label) => (_jsx("div", { role: "columnheader", children: label }, label))) }), viewModel.members.length > 0 ? (viewModel.members.map((member) => (_jsxs("div", { className: "member-table-row", role: "row", children: [_jsx("div", { role: "cell", children: member.name }), _jsx("div", { role: "cell", children: member.phone }), _jsx("div", { role: "cell", children: member.roleName }), _jsx("div", { role: "cell", children: _jsx("button", { type: "button", className: "member-link-button", onClick: () => {
                                        setBindTarget(member);
                                        setFeedback('请选择是否确认绑定企微');
                                    }, children: member.wecomLabel }) }), _jsx("div", { role: "cell", children: member.email }), _jsx("div", { role: "cell", children: _jsx("button", { type: "button", className: "member-link-button", onClick: () => navigate(`/setting/member/actions?mode=edit&userId=${member.userId}`), children: "\u7F16\u8F91" }) })] }, member.userId)))) : (_jsx("div", { className: "member-empty-row", role: "row", children: _jsx("div", { role: "cell", children: _jsxs("div", { className: "member-empty-state", "aria-label": "\u6210\u5458\u5217\u8868\u7A7A\u6001", children: [_jsx("span", { "aria-hidden": "true", children: "\u25CB" }), _jsx("strong", { children: "\u6682\u65E0\u6570\u636E" })] }) }) }))] }), _jsxs("footer", { className: "member-pagination", "aria-label": "\u6210\u5458\u5206\u9875", children: [_jsxs("span", { children: ["\u7B2C 1-", viewModel.members.length, " \u6761\uFF0C\u5171 ", viewModel.pagination.total, " \u6761"] }), _jsx("button", { type: "button", "aria-label": "\u4E0A\u4E00\u9875", disabled: true }), _jsx("strong", { children: "1" }), _jsx("button", { type: "button", "aria-label": "\u4E0B\u4E00\u9875", disabled: true }), _jsx("button", { type: "button", className: "member-page-size", children: "20 \u6761/\u9875" })] })] }));
}
function RoomCategoryCheckbox({ checked, roomCategory, onChange, }) {
    return (_jsxs("label", { className: "member-room-item", children: [_jsx("input", { type: "checkbox", "aria-label": `房型 ${roomCategory.roomCategoryName}`, checked: checked, onChange: (event) => onChange(event.target.checked) }), _jsx("span", { children: roomCategory.roomCategoryName })] }));
}
function toContract(data) {
    return {
        provider: data.provider,
        responseState: data.state,
        endpoint: data.endpoint,
        traceId: data.traceId,
        timestamp: data.timestamp,
        routeMode: data.routeMode,
        request: data.request,
    };
}
function toErrorContract(error, query) {
    if (error instanceof MemberSettingServiceError) {
        return {
            provider: error.provider,
            responseState: 'error',
            endpoint: '/setting/member/bootstrap',
            traceId: error.response.traceId,
            timestamp: error.response.timestamp,
            routeMode: query.routeMode,
            request: error.request,
        };
    }
    return {
        provider: query.provider ?? 'mock',
        responseState: 'error',
        endpoint: '/setting/member/bootstrap',
        traceId: '',
        timestamp: '',
        routeMode: query.routeMode,
        request: query,
    };
}
function readLocationFlashMessage(state) {
    if (!state || typeof state !== 'object') {
        return null;
    }
    const flashMessage = Reflect.get(state, 'memberSettingFlashMessage');
    return typeof flashMessage === 'string' ? flashMessage : null;
}
