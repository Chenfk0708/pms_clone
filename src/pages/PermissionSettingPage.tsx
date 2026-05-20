import { startTransition, useDeferredValue, useEffect, useMemo, useState } from 'react'
import {
  createPermissionSettingRole,
  defaultPermissionSettingCampId,
  deletePermissionSettingRole,
  getPermissionSettingProviderName,
  loadPermissionSettingRoleDetail,
  loadPermissionSettingRoleList,
  permissionRoleDetailEndpoint,
  permissionRoleListEndpoint,
  renamePermissionSettingRole,
  type PermissionSettingRoleDetailData,
  type PermissionSettingRoleListData,
} from '../services/permissionSetting'
import './PermissionSettingPage.css'

type RoleDialogMode = 'create' | 'edit' | null

const initialListQuery = {
  campId: defaultPermissionSettingCampId,
  keyword: '',
  pageNum: 1,
  pageSize: 50,
}

export function PermissionSettingPage() {
  const [keyword, setKeyword] = useState('')
  const deferredKeyword = useDeferredValue(keyword.trim())
  const [rolesData, setRolesData] = useState<PermissionSettingRoleListData | null>(null)
  const [detailData, setDetailData] = useState<PermissionSettingRoleDetailData | null>(null)
  const [rolesLoading, setRolesLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [rolesError, setRolesError] = useState('')
  const [detailError, setDetailError] = useState('')
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null)
  const [notice, setNotice] = useState('')
  const [roleDialogMode, setRoleDialogMode] = useState<RoleDialogMode>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formError, setFormError] = useState('')
  const [isMutating, setIsMutating] = useState(false)
  const [listReloadToken, setListReloadToken] = useState(0)
  const [detailReloadToken, setDetailReloadToken] = useState(0)

  const listQuery = useMemo(
    () => ({
      ...initialListQuery,
      keyword: deferredKeyword,
    }),
    [deferredKeyword],
  )

  useEffect(() => {
    const controller = new AbortController()

    async function run() {
      setRolesLoading(true)
      setRolesError('')
      try {
        const result = await loadPermissionSettingRoleList(listQuery, controller.signal)
        setRolesData(result)
        setSelectedRoleId((currentRoleId) => {
          if (!currentRoleId) return null
          return result.roles.some((role) => role.roleId === currentRoleId) ? currentRoleId : null
        })
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === 'AbortError') return
        setRolesError(loadError instanceof Error ? loadError.message : '角色列表暂时无法获取，请稍后重试')
        setRolesData(null)
      } finally {
        setRolesLoading(false)
      }
    }

    void run()
    return () => controller.abort()
  }, [listQuery, listReloadToken])

  useEffect(() => {
    if (selectedRoleId === null) return
    const roleId: string = selectedRoleId

    const controller = new AbortController()

    async function run() {
      setDetailLoading(true)
      setDetailError('')
      try {
        const result = await loadPermissionSettingRoleDetail(
          {
            campId: defaultPermissionSettingCampId,
            roleId,
          },
          controller.signal,
        )
        setDetailData(result)
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === 'AbortError') return
        setDetailError(loadError instanceof Error ? loadError.message : '角色权限详情暂时无法获取，请稍后重试')
        setDetailData(null)
      } finally {
        setDetailLoading(false)
      }
    }

    void run()
    return () => controller.abort()
  }, [detailReloadToken, selectedRoleId])

  const selectedRoleSummary = useMemo(() => {
    const fromList = rolesData?.roles.find((role) => role.roleId === selectedRoleId) ?? null
    return detailData?.detail.role ?? fromList
  }, [detailData, rolesData, selectedRoleId])

  const diagnosticsText = useMemo(() => {
    const listSummary =
      rolesData?.requestSummary ??
      [
        `provider=${getPermissionSettingProviderName()}`,
        'mockState=success',
        'traceId=pending-role-list',
        `path=${permissionRoleListEndpoint}`,
        `campId=${defaultPermissionSettingCampId}`,
        `keyword=${listQuery.keyword}`,
        'pageNum=1',
        'pageSize=50',
      ]
    const detailSummary =
      detailData?.requestSummary ??
      [
        `provider=${getPermissionSettingProviderName()}`,
        'mockState=success',
        'traceId=pending-role-detail',
        `path=${permissionRoleDetailEndpoint}`,
        `campId=${defaultPermissionSettingCampId}`,
        `roleId=${selectedRoleId ?? ''}`,
      ]

    return [...listSummary, '|', ...detailSummary].join(';')
  }, [detailData, listQuery.keyword, rolesData, selectedRoleId])

  function openCreateDialog() {
    setFormName('')
    setFormDescription('')
    setFormError('')
    setRoleDialogMode('create')
  }

  function openEditDialog() {
    if (!selectedRoleSummary) return
    setFormName(selectedRoleSummary.roleName)
    setFormDescription(selectedRoleSummary.description)
    setFormError('')
    setRoleDialogMode('edit')
  }

  function closeRoleDialog() {
    if (isMutating) return
    setRoleDialogMode(null)
    setFormError('')
  }

  async function submitRoleDialog() {
    if (!formName.trim()) {
      setFormError('请输入角色名称')
      return
    }

    setIsMutating(true)
    setFormError('')
    try {
      if (roleDialogMode === 'create') {
        const result = await createPermissionSettingRole({
          campId: defaultPermissionSettingCampId,
          roleName: formName,
          description: formDescription,
        })
        setKeyword('')
        setNotice(`角色“${result.role.roleName}”已新增`)
        setRoleDialogMode(null)
        startTransition(() => setSelectedRoleId(result.role.roleId))
      }

      if (roleDialogMode === 'edit' && selectedRoleSummary) {
        const result = await renamePermissionSettingRole({
          campId: defaultPermissionSettingCampId,
          roleId: selectedRoleSummary.roleId,
          roleName: formName,
          description: formDescription,
        })
        setNotice(`角色“${result.role.roleName}”已更新`)
        setRoleDialogMode(null)
        startTransition(() => setSelectedRoleId(result.role.roleId))
      }

      setListReloadToken((value) => value + 1)
      setDetailReloadToken((value) => value + 1)
    } catch (submitError) {
      setFormError(submitError instanceof Error ? submitError.message : '角色保存失败，请稍后重试')
    } finally {
      setIsMutating(false)
    }
  }

  async function confirmDeleteRole() {
    if (!selectedRoleSummary) return

    setIsMutating(true)
    try {
      const result = await deletePermissionSettingRole({
        campId: defaultPermissionSettingCampId,
        roleId: selectedRoleSummary.roleId,
      })
      setDeleteConfirmOpen(false)
      setNotice(`角色“${result.role.roleName}”已删除`)
      setSelectedRoleId(null)
      setDetailData(null)
      setDetailError('')
      setListReloadToken((value) => value + 1)
    } catch (deleteError) {
      setNotice('')
      setDetailError(deleteError instanceof Error ? deleteError.message : '角色删除失败，请稍后重试')
    } finally {
      setIsMutating(false)
    }
  }

  const roles = rolesData?.roles ?? []

  return (
    <div className="permission-setting-page">
      <h1 className="permission-sr-only">权限设置</h1>

      <div className="permission-setting-diagnostics" data-testid="permission-setting-service-contract" aria-hidden="true">
        {diagnosticsText}
      </div>

      <section className="permission-role-shell" aria-label="权限设置">
        <aside className="permission-role-list" aria-label="店铺角色">
          <div className="permission-role-list__header">
            <div>
              <h2>店铺角色</h2>
              <small>{rolesLoading ? '正在同步角色列表' : `共 ${rolesData?.pagination.total ?? roles.length} 个角色`}</small>
            </div>
            <button type="button" className="permission-primary-button" onClick={openCreateDialog}>
              新增角色
            </button>
          </div>

          <label className="permission-role-search-row">
            <span className="permission-sr-only">角色名称搜索</span>
            <input
              className="permission-role-search"
              value={keyword}
              placeholder="请输入名称"
              aria-label="角色名称搜索"
              onChange={(event) => {
                setKeyword(event.target.value)
                setNotice('')
              }}
            />
          </label>

          {rolesError ? (
            <div className="permission-panel-alert" role="alert">
              <strong>{rolesError}</strong>
              <button type="button" onClick={() => setListReloadToken((value) => value + 1)}>
                重试
              </button>
            </div>
          ) : null}

          <div className="permission-role-buttons" aria-label="角色列表">
            {rolesLoading ? <div className="permission-list-placeholder">正在加载角色列表...</div> : null}
            {!rolesLoading && !rolesError && roles.length === 0 ? (
              <div className="permission-list-placeholder">当前没有可展示的角色</div>
            ) : null}
            {!rolesLoading &&
              !rolesError &&
              roles.map((role) => (
                <button
                  key={role.roleId}
                  type="button"
                  aria-label={role.roleName}
                  className={selectedRoleId === role.roleId ? 'is-active' : ''}
                  onClick={() => {
                    setNotice('')
                    startTransition(() => setSelectedRoleId(role.roleId))
                  }}
                >
                  <strong>{role.roleName}</strong>
                  <span aria-hidden="true">{role.memberCount} 人</span>
                </button>
              ))}
          </div>
        </aside>

        <main className="permission-detail-panel">
          {notice ? (
            <div className="permission-page-notice" role="status">
              {notice}
            </div>
          ) : null}

          {!selectedRoleId ? (
            <EmptyPermissionDetail hasRoles={!rolesError && roles.length > 0} />
          ) : detailLoading ? (
            <div className="permission-state-card">正在加载角色权限...</div>
          ) : detailError ? (
            <div className="permission-panel-alert permission-panel-alert--detail" role="alert">
              <strong>{detailError}</strong>
              <button type="button" onClick={() => setDetailReloadToken((value) => value + 1)}>
                重新加载
              </button>
            </div>
          ) : detailData ? (
            <section className="permission-detail" aria-label={`${detailData.detail.role.roleName}权限详情`}>
              <div className="permission-detail__heading">
                <div>
                  <h2>{detailData.detail.role.roleName}</h2>
                  <p>{detailData.detail.subtitle}</p>
                  <small>
                    {detailData.detail.role.memberCount} 位成员 · 最近更新 {detailData.detail.role.updatedAt || '未记录'}
                  </small>
                </div>
                <div className="permission-detail__actions">
                  <button type="button" onClick={openEditDialog}>
                    编辑角色名称
                  </button>
                  <button
                    type="button"
                    className="permission-danger-button"
                    disabled={!detailData.detail.role.canDelete}
                    onClick={() => setDeleteConfirmOpen(true)}
                  >
                    删除角色
                  </button>
                </div>
              </div>

              <div className="permission-role-description">{detailData.detail.role.description}</div>

              <table className="permission-table" aria-label="角色权限表">
                <thead>
                  <tr>
                    <th>模块/页面</th>
                    <th>权限</th>
                  </tr>
                </thead>
                <tbody>
                  {detailData.detail.permissionRows.map((row) => (
                    <tr key={row.moduleId}>
                      <td>{row.moduleName}</td>
                      <td>
                        <div className="permission-tags">
                          {row.permissions.map((permission) => (
                            <span key={`${row.moduleId}-${permission}`}>{permission}</span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ) : (
            <div className="permission-state-card">未获取到角色权限详情</div>
          )}
        </main>
      </section>

      {roleDialogMode ? (
        <RoleDialog
          mode={roleDialogMode}
          name={formName}
          description={formDescription}
          error={formError}
          isSubmitting={isMutating}
          onNameChange={setFormName}
          onDescriptionChange={setFormDescription}
          onClose={closeRoleDialog}
          onSubmit={() => void submitRoleDialog()}
        />
      ) : null}

      {deleteConfirmOpen && selectedRoleSummary ? (
        <DeleteRoleDialog
          roleName={selectedRoleSummary.roleName}
          isSubmitting={isMutating}
          onCancel={() => {
            if (isMutating) return
            setDeleteConfirmOpen(false)
          }}
          onConfirm={() => void confirmDeleteRole()}
        />
      ) : null}
    </div>
  )
}

function EmptyPermissionDetail({ hasRoles }: { hasRoles: boolean }) {
  return (
    <div className="permission-empty-state">
      <span>{hasRoles ? '请选择角色' : '当前角色列表为空，请先新增角色'}</span>
    </div>
  )
}

function RoleDialog({
  mode,
  name,
  description,
  error,
  isSubmitting,
  onNameChange,
  onDescriptionChange,
  onClose,
  onSubmit,
}: {
  mode: Exclude<RoleDialogMode, null>
  name: string
  description: string
  error: string
  isSubmitting: boolean
  onNameChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  onClose: () => void
  onSubmit: () => void
}) {
  const title = mode === 'create' ? '新增角色' : '编辑角色名称'

  return (
    <div className="permission-modal-backdrop">
      <section className="permission-modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="permission-modal__header">
          <h2>{title}</h2>
          <button type="button" aria-label={`关闭${title}`} onClick={onClose}>
            ×
          </button>
        </div>
        <div className="permission-modal__body">
          <p className="permission-modal__notice">提示：此操作有纪录，请谨慎添加、编辑和删除。</p>
          <label className="permission-form-row">
            <span>角色名称（必填）</span>
            <input value={name} placeholder="请输入角色名称" onChange={(event) => onNameChange(event.target.value)} />
          </label>
          <label className="permission-form-row">
            <span>描述</span>
            <textarea
              value={description}
              placeholder="请输入描述"
              rows={4}
              onChange={(event) => onDescriptionChange(event.target.value)}
            />
          </label>
          {error ? (
            <div className="permission-form-error" role="alert">
              {error}
            </div>
          ) : null}
        </div>
        <div className="permission-modal__footer">
          <button type="button" onClick={onClose} disabled={isSubmitting}>
            取 消
          </button>
          <button type="button" className="permission-primary-button" onClick={onSubmit} disabled={isSubmitting}>
            {isSubmitting ? '提交中...' : '确 定'}
          </button>
        </div>
      </section>
    </div>
  )
}

function DeleteRoleDialog({
  roleName,
  isSubmitting,
  onCancel,
  onConfirm,
}: {
  roleName: string
  isSubmitting: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <div className="permission-modal-backdrop">
      <section className="permission-confirm-modal" role="dialog" aria-modal="true" aria-label="删除角色确认">
        <h2>删除角色</h2>
        <p>确认删除角色“{roleName}”吗？删除后将回到角色空态。</p>
        <div className="permission-confirm-modal__actions">
          <button type="button" onClick={onCancel} disabled={isSubmitting}>
            取 消
          </button>
          <button type="button" className="permission-danger-solid-button" onClick={onConfirm} disabled={isSubmitting}>
            {isSubmitting ? '删除中...' : '确认删除'}
          </button>
        </div>
      </section>
    </div>
  )
}
