import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { startTransition, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { createPermissionSettingRole, deletePermissionSettingRole, getPermissionSettingProviderName, loadPermissionSettingRoleDetail, loadPermissionSettingRoleList, permissionRoleDetailEndpoint, permissionRoleListEndpoint, resolvePermissionSettingCampId, renamePermissionSettingRole, savePermissionSettingRolePermissions, } from '../services/permissionSetting';
import './PermissionSettingPage.css';
export function PermissionSettingPage() {
    const location = useLocation();
    const campId = useMemo(() => resolvePermissionSettingCampId(), [location.search]);
    const [keyword, setKeyword] = useState('');
    const deferredKeyword = useDeferredValue(keyword.trim());
    const [rolesData, setRolesData] = useState(null);
    const [detailData, setDetailData] = useState(null);
    const [rolesLoading, setRolesLoading] = useState(true);
    const [detailLoading, setDetailLoading] = useState(false);
    const [rolesError, setRolesError] = useState('');
    const [detailError, setDetailError] = useState('');
    const [selectedRoleId, setSelectedRoleId] = useState(null);
    const [notice, setNotice] = useState('');
    const [roleDialogMode, setRoleDialogMode] = useState(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [formName, setFormName] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [formError, setFormError] = useState('');
    const [isMutating, setIsMutating] = useState(false);
    const [savingPermissionKey, setSavingPermissionKey] = useState('');
    const [listReloadToken, setListReloadToken] = useState(0);
    const [detailReloadToken, setDetailReloadToken] = useState(0);
    const listQuery = useMemo(() => ({
        campId,
        keyword: deferredKeyword,
        pageNum: 1,
        pageSize: 50,
    }), [campId, deferredKeyword]);
    useEffect(() => {
        const controller = new AbortController();
        async function run() {
            setRolesLoading(true);
            setRolesError('');
            try {
                const result = await loadPermissionSettingRoleList(listQuery, controller.signal);
                setRolesData(result);
                setSelectedRoleId((currentRoleId) => {
                    if (currentRoleId && result.roles.some((role) => role.roleId === currentRoleId)) {
                        return currentRoleId;
                    }
                    if (currentRoleId && !result.roles.some((role) => role.roleId === currentRoleId)) {
                        return null;
                    }
                    return result.roles.find((role) => role.roleName === '管理员')?.roleId ?? result.roles[0]?.roleId ?? null;
                });
            }
            catch (loadError) {
                if (loadError instanceof DOMException && loadError.name === 'AbortError')
                    return;
                setRolesError(loadError instanceof Error ? loadError.message : '角色列表暂时无法获取，请稍后重试');
                setRolesData(null);
                setSelectedRoleId(null);
                setDetailData(null);
            }
            finally {
                setRolesLoading(false);
            }
        }
        void run();
        return () => controller.abort();
    }, [listQuery, listReloadToken, location.search]);
    useEffect(() => {
        if (selectedRoleId === null)
            return;
        const roleId = selectedRoleId;
        const controller = new AbortController();
        async function run() {
            setDetailLoading(true);
            setDetailError('');
            try {
                const result = await loadPermissionSettingRoleDetail({
                    campId,
                    roleId,
                }, controller.signal);
                setDetailData(result);
            }
            catch (loadError) {
                if (loadError instanceof DOMException && loadError.name === 'AbortError')
                    return;
                setDetailError(loadError instanceof Error ? loadError.message : '角色权限详情暂时无法获取，请稍后重试');
                setDetailData(null);
            }
            finally {
                setDetailLoading(false);
            }
        }
        void run();
        return () => controller.abort();
    }, [campId, detailReloadToken, location.search, selectedRoleId]);
    const selectedRoleSummary = useMemo(() => {
        const fromList = rolesData?.roles.find((role) => role.roleId === selectedRoleId) ?? null;
        return detailData?.detail.role ?? fromList;
    }, [detailData, rolesData, selectedRoleId]);
    const diagnosticsText = useMemo(() => {
        const listSummary = rolesData?.requestSummary ??
            [
                `provider=${getPermissionSettingProviderName()}`,
                'mockState=success',
                'traceId=pending-role-list',
                `path=${permissionRoleListEndpoint}`,
                `campId=${campId}`,
                `keyword=${listQuery.keyword}`,
                'pageNum=1',
                'pageSize=50',
            ];
        const detailSummary = detailData?.requestSummary ??
            [
                `provider=${getPermissionSettingProviderName()}`,
                'mockState=success',
                'traceId=pending-role-detail',
                `path=${permissionRoleDetailEndpoint}`,
                `campId=${campId}`,
                `roleId=${selectedRoleId ?? ''}`,
            ];
        return [...listSummary, '|', ...detailSummary].join(';');
    }, [campId, detailData, listQuery.keyword, rolesData, selectedRoleId]);
    function openCreateDialog() {
        setFormName('');
        setFormDescription('');
        setFormError('');
        setRoleDialogMode('create');
    }
    function openEditDialog() {
        if (!selectedRoleSummary)
            return;
        setFormName(selectedRoleSummary.roleName);
        setFormDescription(selectedRoleSummary.description);
        setFormError('');
        setRoleDialogMode('edit');
    }
    function closeRoleDialog() {
        if (isMutating)
            return;
        setRoleDialogMode(null);
        setFormError('');
    }
    async function submitRoleDialog() {
        if (!formName.trim()) {
            setFormError('请输入角色名称');
            return;
        }
        setIsMutating(true);
        setFormError('');
        try {
            if (roleDialogMode === 'create') {
                const result = await createPermissionSettingRole({
                    campId,
                    roleName: formName,
                    description: formDescription,
                });
                setKeyword('');
                setNotice(`角色“${result.role.roleName}”已新增`);
                setRoleDialogMode(null);
                startTransition(() => setSelectedRoleId(result.role.roleId));
            }
            if (roleDialogMode === 'edit' && selectedRoleSummary) {
                const result = await renamePermissionSettingRole({
                    campId,
                    roleId: selectedRoleSummary.roleId,
                    roleName: formName,
                    description: formDescription,
                });
                setNotice(`角色“${result.role.roleName}”已更新`);
                setRoleDialogMode(null);
                startTransition(() => setSelectedRoleId(result.role.roleId));
            }
            setListReloadToken((value) => value + 1);
            setDetailReloadToken((value) => value + 1);
        }
        catch (submitError) {
            setFormError(submitError instanceof Error ? submitError.message : '角色保存失败，请稍后重试');
        }
        finally {
            setIsMutating(false);
        }
    }
    async function confirmDeleteRole() {
        if (!selectedRoleSummary)
            return;
        setIsMutating(true);
        try {
            const result = await deletePermissionSettingRole({
                campId,
                roleId: selectedRoleSummary.roleId,
            });
            setDeleteConfirmOpen(false);
            setNotice(`角色“${result.role.roleName}”已删除`);
            setSelectedRoleId(null);
            setDetailData(null);
            setDetailError('');
            setListReloadToken((value) => value + 1);
        }
        catch (deleteError) {
            setNotice('');
            setDetailError(deleteError instanceof Error ? deleteError.message : '角色删除失败，请稍后重试');
        }
        finally {
            setIsMutating(false);
        }
    }
    async function togglePermission(row, permission) {
        if (!detailData || savingPermissionKey)
            return;
        const previousDetailData = detailData;
        const permissionKey = `${row.moduleId}:${permission}`;
        const nextRows = togglePermissionRows(detailData.detail.permissionRows, row.moduleId, permission);
        setSavingPermissionKey(permissionKey);
        setNotice('');
        setDetailError('');
        setDetailData({
            ...detailData,
            detail: {
                ...detailData.detail,
                permissionRows: nextRows,
            },
        });
        try {
            const result = await savePermissionSettingRolePermissions({
                campId,
                roleId: detailData.detail.role.roleId,
                permissionRows: nextRows,
            });
            setDetailData(result);
            setNotice('权限已保存');
            setListReloadToken((value) => value + 1);
        }
        catch (saveError) {
            setDetailData(previousDetailData);
            setDetailError(saveError instanceof Error ? saveError.message : '权限保存失败，请稍后重试');
        }
        finally {
            setSavingPermissionKey('');
        }
    }
    const roles = rolesData?.roles ?? [];
    return (_jsxs("div", { className: "permission-setting-page", children: [_jsx("h1", { className: "permission-sr-only", children: "\u6743\u9650\u8BBE\u7F6E" }), _jsx("div", { className: "permission-setting-diagnostics", "data-testid": "permission-setting-service-contract", "aria-hidden": "true", children: diagnosticsText }), _jsxs("section", { className: "permission-role-shell", "aria-label": "\u6743\u9650\u8BBE\u7F6E", children: [_jsxs("aside", { className: "permission-role-list", "aria-label": "\u5E97\u94FA\u89D2\u8272", children: [_jsxs("div", { className: "permission-role-list__header", children: [_jsxs("div", { children: [_jsx("h2", { children: "\u5E97\u94FA\u89D2\u8272" }), _jsx("small", { children: rolesLoading ? '正在同步角色列表' : `共 ${rolesData?.pagination.total ?? roles.length} 个角色` })] }), _jsx("button", { type: "button", className: "permission-primary-button", onClick: openCreateDialog, children: "\u65B0\u589E\u89D2\u8272" })] }), _jsxs("label", { className: "permission-role-search-row", children: [_jsx("span", { className: "permission-sr-only", children: "\u89D2\u8272\u540D\u79F0\u641C\u7D22" }), _jsx("input", { className: "permission-role-search", value: keyword, placeholder: "\u8BF7\u8F93\u5165\u540D\u79F0", "aria-label": "\u89D2\u8272\u540D\u79F0\u641C\u7D22", onChange: (event) => {
                                            setKeyword(event.target.value);
                                            setNotice('');
                                        } })] }), rolesError ? (_jsxs("div", { className: "permission-panel-alert", role: "alert", children: [_jsx("strong", { children: rolesError }), _jsx("button", { type: "button", onClick: () => setListReloadToken((value) => value + 1), children: "\u91CD\u8BD5" })] })) : null, _jsxs("div", { className: "permission-role-buttons", "aria-label": "\u89D2\u8272\u5217\u8868", children: [rolesLoading ? _jsx("div", { className: "permission-list-placeholder", children: "\u6B63\u5728\u52A0\u8F7D\u89D2\u8272\u5217\u8868..." }) : null, !rolesLoading && !rolesError && roles.length === 0 ? (_jsx("div", { className: "permission-list-placeholder", children: "\u5F53\u524D\u6CA1\u6709\u53EF\u5C55\u793A\u7684\u89D2\u8272" })) : null, !rolesLoading &&
                                        !rolesError &&
                                        roles.map((role) => (_jsxs("button", { type: "button", "aria-label": role.roleName, className: selectedRoleId === role.roleId ? 'is-active' : '', onClick: () => {
                                                setNotice('');
                                                startTransition(() => setSelectedRoleId(role.roleId));
                                            }, children: [_jsx("strong", { children: role.roleName }), _jsxs("span", { "aria-hidden": "true", children: [role.memberCount, " \u4EBA"] })] }, role.roleId)))] })] }), _jsxs("main", { className: "permission-detail-panel", children: [notice ? (_jsx("div", { className: "permission-page-notice", role: "status", children: notice })) : null, !selectedRoleId ? (_jsx(EmptyPermissionDetail, { hasRoles: !rolesError && roles.length > 0 })) : detailLoading && !detailData ? (_jsx("div", { className: "permission-state-card", children: "\u6B63\u5728\u52A0\u8F7D\u89D2\u8272\u6743\u9650..." })) : detailError && !detailData ? (_jsxs("div", { className: "permission-panel-alert permission-panel-alert--detail", role: "alert", children: [_jsx("strong", { children: detailError }), _jsx("button", { type: "button", onClick: () => setDetailReloadToken((value) => value + 1), children: "\u91CD\u65B0\u52A0\u8F7D" })] })) : detailData ? (_jsxs("section", { className: "permission-detail", "aria-label": `${detailData.detail.role.roleName}权限详情`, children: [detailError ? (_jsxs("div", { className: "permission-inline-alert", role: "alert", children: [_jsx("strong", { children: detailError }), _jsx("button", { type: "button", onClick: () => setDetailReloadToken((value) => value + 1), children: "\u91CD\u65B0\u52A0\u8F7D" })] })) : null, _jsxs("div", { className: "permission-detail__heading", children: [_jsxs("div", { children: [_jsx("h2", { children: detailData.detail.role.roleName }), _jsx("p", { children: detailData.detail.subtitle }), _jsxs("small", { children: [detailData.detail.role.memberCount, " \u4F4D\u6210\u5458 \u00B7 \u6700\u8FD1\u66F4\u65B0 ", detailData.detail.role.updatedAt || '未记录'] })] }), _jsxs("div", { className: "permission-detail__actions", children: [_jsx("button", { type: "button", onClick: openEditDialog, children: "\u7F16\u8F91\u89D2\u8272\u540D\u79F0" }), _jsx("button", { type: "button", className: "permission-danger-button", disabled: !detailData.detail.role.canDelete, onClick: () => setDeleteConfirmOpen(true), children: "\u5220\u9664\u89D2\u8272" })] })] }), _jsxs("table", { className: "permission-table", "aria-label": `${detailData.detail.role.roleName}角色权限表`, children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "\u6A21\u5757/\u9875\u9762" }), _jsx("th", { children: "\u6743\u9650" })] }) }), _jsx("tbody", { children: detailData.detail.permissionRows.map((row) => (_jsxs("tr", { children: [_jsx("td", { children: _jsx(ModuleName, { value: row.moduleName }) }), _jsx("td", { children: _jsx("div", { className: "permission-checks", children: (row.availablePermissions?.length ? row.availablePermissions : row.permissions).map((permission) => {
                                                                    const isSelected = row.permissions.includes(permission);
                                                                    const permissionKey = `${row.moduleId}:${permission}`;
                                                                    return (_jsxs("button", { type: "button", className: isSelected ? 'is-selected' : '', "aria-pressed": isSelected, disabled: Boolean(savingPermissionKey), onClick: () => void togglePermission(row, permission), children: [_jsx("i", { "aria-hidden": "true" }), permission] }, `${row.moduleId}-${permission}`));
                                                                }) }) })] }, row.moduleId))) })] })] })) : (_jsx("div", { className: "permission-state-card", children: "\u672A\u83B7\u53D6\u5230\u89D2\u8272\u6743\u9650\u8BE6\u60C5" }))] })] }), roleDialogMode ? (_jsx(RoleDialog, { mode: roleDialogMode, name: formName, description: formDescription, error: formError, isSubmitting: isMutating, onNameChange: setFormName, onDescriptionChange: setFormDescription, onClose: closeRoleDialog, onSubmit: () => void submitRoleDialog() })) : null, deleteConfirmOpen && selectedRoleSummary ? (_jsx(DeleteRoleDialog, { roleName: selectedRoleSummary.roleName, isSubmitting: isMutating, onCancel: () => {
                    if (isMutating)
                        return;
                    setDeleteConfirmOpen(false);
                }, onConfirm: () => void confirmDeleteRole() })) : null] }));
}
function togglePermissionRows(rows, moduleId, permission) {
    return rows.map((row) => {
        if (row.moduleId !== moduleId)
            return row;
        const availablePermissions = row.availablePermissions?.length ? row.availablePermissions : row.permissions;
        const selectedPermissions = new Set(row.permissions);
        if (selectedPermissions.has(permission)) {
            selectedPermissions.delete(permission);
        }
        else {
            selectedPermissions.add(permission);
        }
        return {
            ...row,
            permissions: availablePermissions.filter((item) => selectedPermissions.has(item)),
            availablePermissions,
        };
    });
}
function ModuleName({ value }) {
    const isSensitive = value.endsWith('敏感');
    const label = isSensitive ? value.replace(/敏感$/, '') : value;
    return (_jsxs("span", { className: "permission-module-name", children: [label, isSensitive ? _jsx("em", { children: "\u654F\u611F" }) : null] }));
}
function EmptyPermissionDetail({ hasRoles }) {
    return (_jsx("div", { className: "permission-empty-state", children: _jsx("span", { children: hasRoles ? '请选择角色' : '当前角色列表为空，请先新增角色' }) }));
}
function RoleDialog({ mode, name, description, error, isSubmitting, onNameChange, onDescriptionChange, onClose, onSubmit, }) {
    const title = mode === 'create' ? '新增角色' : '编辑角色名称';
    return (_jsx("div", { className: "permission-modal-backdrop", children: _jsxs("section", { className: "permission-modal", role: "dialog", "aria-modal": "true", "aria-label": title, children: [_jsxs("div", { className: "permission-modal__header", children: [_jsx("h2", { children: title }), _jsx("button", { type: "button", "aria-label": `关闭${title}`, onClick: onClose, children: "\u00D7" })] }), _jsxs("div", { className: "permission-modal__body", children: [_jsx("p", { className: "permission-modal__notice", children: "\u63D0\u793A\uFF1A\u6B64\u64CD\u4F5C\u6709\u7EAA\u5F55\uFF0C\u8BF7\u8C28\u614E\u6DFB\u52A0\u3001\u7F16\u8F91\u548C\u5220\u9664\u3002" }), _jsxs("label", { className: "permission-form-row", children: [_jsx("span", { children: "\u89D2\u8272\u540D\u79F0\uFF08\u5FC5\u586B\uFF09" }), _jsx("input", { value: name, placeholder: "\u8BF7\u8F93\u5165\u89D2\u8272\u540D\u79F0", onChange: (event) => onNameChange(event.target.value) })] }), _jsxs("label", { className: "permission-form-row", children: [_jsx("span", { children: "\u63CF\u8FF0" }), _jsx("textarea", { value: description, placeholder: "\u8BF7\u8F93\u5165\u63CF\u8FF0", rows: 4, onChange: (event) => onDescriptionChange(event.target.value) })] }), error ? (_jsx("div", { className: "permission-form-error", role: "alert", children: error })) : null] }), _jsxs("div", { className: "permission-modal__footer", children: [_jsx("button", { type: "button", onClick: onClose, disabled: isSubmitting, children: "\u53D6 \u6D88" }), _jsx("button", { type: "button", className: "permission-primary-button", onClick: onSubmit, disabled: isSubmitting, children: isSubmitting ? '提交中...' : '确 定' })] })] }) }));
}
function DeleteRoleDialog({ roleName, isSubmitting, onCancel, onConfirm, }) {
    return (_jsx("div", { className: "permission-modal-backdrop", children: _jsxs("section", { className: "permission-confirm-modal", role: "dialog", "aria-modal": "true", "aria-label": "\u5220\u9664\u89D2\u8272\u786E\u8BA4", children: [_jsx("h2", { children: "\u5220\u9664\u89D2\u8272" }), _jsxs("p", { children: ["\u786E\u8BA4\u5220\u9664\u89D2\u8272\u201C", roleName, "\u201D\u5417\uFF1F\u5220\u9664\u540E\u5C06\u56DE\u5230\u89D2\u8272\u7A7A\u6001\u3002"] }), _jsxs("div", { className: "permission-confirm-modal__actions", children: [_jsx("button", { type: "button", onClick: onCancel, disabled: isSubmitting, children: "\u53D6 \u6D88" }), _jsx("button", { type: "button", className: "permission-danger-solid-button", onClick: onConfirm, disabled: isSubmitting, children: isSubmitting ? '删除中...' : '确认删除' })] })] }) }));
}
