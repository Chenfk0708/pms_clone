import { useEffect, useState } from 'react'
import './PermissionSettingPage.css'

const roles = ['管理员', '管家', '投资人', '保洁员', '智住管家', '业主', 'localsAI']

const permissionRows = [
  { module: '首页', permissions: ['查看'] },
  { module: '房源', permissions: ['查看', '操作'] },
  { module: '房态', permissions: ['查看', '操作'] },
  { module: '房价', permissions: ['查看', '操作'] },
  { module: '全盘价格规划', permissions: ['查看', '操作'] },
  { module: '订单', permissions: ['查看', '操作'] },
  { module: '数据统计', permissions: ['查看', '操作'] },
  { module: '账本', permissions: ['查看', '操作'] },
  { module: '平台管理', permissions: ['查看', '操作'] },
  { module: '成员管理', permissions: ['查看', '操作'] },
  { module: '自定义项目', permissions: ['查看', '操作'] },
  { module: '我的店', permissions: ['查看', '操作'] },
  { module: '我的钱包', permissions: ['启用'] },
  { module: '接收系统通知 -订单相关', permissions: ['启用'] },
  { module: '接收系统通知 -店铺成员相关', permissions: ['启用'] },
  { module: '接收系统通知 -其他', permissions: ['启用'] },
  { module: '咨询', permissions: ['咨询'] },
  { module: '客服IM', permissions: ['售前', '售后', '主管'] },
  { module: '智能入住', permissions: ['启用'] },
  { module: '门锁管理', permissions: ['操作'] },
  { module: '夜审', permissions: ['修改夜审设置', '查看夜审数据', '重审'] },
  { module: '修改历史订单\\账单数据敏感', permissions: ['启用'] },
  { module: '置换权益', permissions: ['启用'] },
  { module: '交接班', permissions: ['启用'] },
]

export function PermissionSettingPage() {
  const [selectedRole, setSelectedRole] = useState<string | null>(null)
  const [isAddingRole, setIsAddingRole] = useState(false)

  useEffect(() => {
    if (!isAddingRole) return undefined

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsAddingRole(false)
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [isAddingRole])

  return (
    <div className="permission-setting-page">
      <section className="permission-role-shell" aria-label="权限设置">
        <aside className="permission-role-list" aria-label="店铺角色">
          <div className="permission-role-list__header">
            <h1>店铺角色</h1>
            <button type="button" className="permission-primary-button" onClick={() => setIsAddingRole(true)}>
              新增角色
            </button>
          </div>
          <input className="permission-role-search" placeholder="请输入名称" aria-label="角色名称搜索" />
          <div className="permission-role-buttons" aria-label="角色列表">
            {roles.map((role) => (
              <button
                key={role}
                type="button"
                className={selectedRole === role ? 'is-active' : ''}
                onClick={() => setSelectedRole(role)}
              >
                {role}
              </button>
            ))}
          </div>
        </aside>

        <main className="permission-detail-panel">
          {selectedRole ? <RolePermissionDetail roleName={selectedRole} /> : <EmptyPermissionDetail />}
        </main>
      </section>

      {isAddingRole ? <AddRoleDialog onClose={() => setIsAddingRole(false)} /> : null}
    </div>
  )
}

function EmptyPermissionDetail() {
  return (
    <div className="permission-empty-state">
      <span>请选择角色</span>
    </div>
  )
}

function RolePermissionDetail({ roleName }: { roleName: string }) {
  return (
    <section className="permission-detail" aria-label={`${roleName}权限详情`}>
      <div className="permission-detail__heading">
        <div>
          <h2>{roleName}</h2>
          <p>请为角色设置权限</p>
        </div>
        <div className="permission-detail__actions">
          <button type="button">编辑角色名称</button>
          <button type="button" className="permission-danger-button">
            删除角色
          </button>
        </div>
      </div>

      <table className="permission-table" aria-label="角色权限表">
        <thead>
          <tr>
            <th>模块/页面</th>
            <th>权限</th>
          </tr>
        </thead>
        <tbody>
          {permissionRows.map((row) => (
            <tr key={row.module}>
              <td>{row.module}</td>
              <td>
                <div className="permission-tags">
                  {row.permissions.map((permission) => (
                    <span key={`${row.module}-${permission}`}>{permission}</span>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

function AddRoleDialog({ onClose }: { onClose: () => void }) {
  return (
    <div className="permission-modal-backdrop">
      <section className="permission-modal" role="dialog" aria-modal="true" aria-label="新增角色">
        <div className="permission-modal__header">
          <h2>新增角色</h2>
          <button type="button" aria-label="关闭新增角色" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="permission-modal__body">
          <p className="permission-modal__notice">提示：此操作有纪录，请谨慎添加、编辑和删除。</p>
          <label className="permission-form-row">
            <span>角色名称（必填）</span>
            <input placeholder="请输入角色名称" />
          </label>
          <label className="permission-form-row">
            <span>描述</span>
            <textarea placeholder="请输入描述" rows={4} />
          </label>
        </div>
        <div className="permission-modal__footer">
          <button type="button" onClick={onClose}>
            取 消
          </button>
          <button type="button" className="permission-primary-button" onClick={onClose}>
            确 定
          </button>
        </div>
      </section>
    </div>
  )
}
