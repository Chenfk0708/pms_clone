import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import './MemberSettingPage.css'

const roleOptions = ['全部', '管理员', '管家', '投资人', '保洁员', '智住管家', '业主', 'localsAI']
const roomTypes = [
  '观影大床房',
  '天落大床电竞套间',
  '总裁套间（桑拿浴缸露台电竞麻将）',
  '顶层套房（浴缸巨幕电竞麻将）',
]

const member = {
  name: '路客云6TS5',
  phone: '18123941382',
  role: '-',
  wecom: '点击绑定',
  email: '-',
}

export function MemberSettingPage() {
  const location = useLocation()

  if (location.pathname.endsWith('/actions')) {
    return <MemberActionPage />
  }

  return <MemberListPage />
}

function MemberListPage() {
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState('')
  const [roleOpen, setRoleOpen] = useState(false)
  const [role, setRole] = useState('全部')

  const hasRows = useMemo(() => keyword.trim().length === 0, [keyword])

  return (
    <div className="member-setting-page">
      <section className="member-setting-panel" aria-label="成员设置">
        <div className="member-filter-section">
          <div className="member-filter-row member-filter-row--fields">
            <label className="member-filter-control">
              <span>搜索：</span>
              <input
                type="text"
                placeholder="姓名/手机号/角色"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
              />
            </label>

            <div className="member-filter-control member-filter-control--role">
              <span>角色：</span>
              <button
                type="button"
                className={`member-role-select${roleOpen ? ' is-open' : ''}`}
                aria-haspopup="listbox"
                aria-expanded={roleOpen}
                onClick={() => setRoleOpen((open) => !open)}
              >
                {role}
              </button>
              {roleOpen ? (
                <ul className="member-role-options" role="listbox" aria-label="角色筛选">
                  {roleOptions.map((option) => (
                    <li
                      key={option}
                      role="option"
                      aria-selected={role === option}
                      tabIndex={0}
                      onClick={() => {
                        setRole(option)
                        setRoleOpen(false)
                      }}
                    >
                      {option}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>

          <div className="member-filter-row member-filter-row--summary">
            <strong>成员账号数：1/3</strong>
            <button type="button" className="member-primary-button" onClick={() => navigate('/setting/member/actions')}>
              添加成员
            </button>
          </div>
        </div>

        <div className="member-table-wrap" role="table" aria-label="成员账号列表">
          <div className="member-table-head" role="row">
            {['姓名', '手机号', '角色', '企微', '邮箱', '操作'].map((label) => (
              <div role="columnheader" key={label}>
                {label}
              </div>
            ))}
          </div>

          {hasRows ? (
            <div className="member-table-row" role="row">
              <div role="cell">{member.name}</div>
              <div role="cell">{member.phone}</div>
              <div role="cell">{member.role}</div>
              <div role="cell">
                <button type="button" className="member-link-button">
                  {member.wecom}
                </button>
              </div>
              <div role="cell">{member.email}</div>
              <div role="cell">
                <button type="button" className="member-link-button">
                  编辑
                </button>
              </div>
            </div>
          ) : (
            <div className="member-empty-row" role="row">
              <div role="cell" aria-colspan={6}>
                暂无数据
              </div>
            </div>
          )}
        </div>

        {hasRows ? (
          <footer className="member-pagination" aria-label="成员分页">
            <span>第 1-1 条/共 1 条</span>
            <button type="button" aria-label="上一页" disabled />
            <strong>1</strong>
            <button type="button" aria-label="下一页" disabled />
            <button type="button" className="member-page-size">
              20 条/页
            </button>
          </footer>
        ) : null}
      </section>
    </div>
  )
}

function MemberActionPage() {
  const navigate = useNavigate()

  return (
    <div className="member-action-page">
      <section className="member-action-panel" aria-label="添加成员">
        <div className="member-breadcrumb">
          <button type="button" onClick={() => navigate('/setting/member')}>
            成员设置
          </button>
          <span>/</span>
          <strong>添加成员</strong>
        </div>

        <h1>基本资料</h1>
        <form className="member-action-form">
          <label className="member-action-field">
            <span>成员姓名</span>
            <input aria-label="成员姓名" placeholder="请输入成员姓名" />
          </label>
          <label className="member-action-field">
            <span>手机号</span>
            <input aria-label="手机号" placeholder="请输入手机号" />
          </label>
          <div className="member-action-field">
            <span>角色</span>
            <button type="button" className="member-action-select">
              请选择角色
            </button>
          </div>

          <div className="member-room-section">
            <div className="member-room-heading">分配房型</div>
            <label className="member-check-all">
              <input type="checkbox" aria-label="全选" />
              <span>全选</span>
            </label>
            <div className="member-room-list">
              {roomTypes.map((room) => (
                <label key={room} className="member-room-item">
                  <input type="checkbox" defaultChecked />
                  <span>{room}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="member-form-actions">
            <button type="button" className="member-secondary-button" onClick={() => navigate('/setting/member')}>
              取 消
            </button>
            <button type="button" className="member-primary-button">
              提 交
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
