import { useState } from 'react'
import './SmartDoorLockPage.css'

type LockTab = 'password' | 'card'

interface LockBrand {
  id: string
  name: string
  logo: string
  tone: 'blue' | 'cyan' | 'black' | 'dark' | 'sky' | 'red' | 'mall'
}

interface BrandGroup {
  id: string
  brands: LockBrand[]
}

const passwordBrandGroups: BrandGroup[] = [
  {
    id: 'ttlock-xia',
    brands: [
      { id: 'ttlock', name: '通通锁', logo: '手', tone: 'blue' },
      { id: 'kejixia', name: '科技侠', logo: 'K', tone: 'cyan' },
    ],
  },
  {
    id: 'guojia-huohe',
    brands: [
      { id: 'guojia', name: '果加', logo: 'GC', tone: 'black' },
      { id: 'huohe', name: '火河', logo: '火河', tone: 'dark' },
    ],
  },
  {
    id: 'gm-lock',
    brands: [{ id: 'gm', name: '国民锁', logo: '链', tone: 'sky' }],
  },
  {
    id: 'hxj-lock',
    brands: [{ id: 'hxj', name: '慧享佳门锁', logo: 'HXOT', tone: 'sky' }],
  },
  {
    id: 'ut-lock',
    brands: [{ id: 'ut', name: '优特', logo: 'UT', tone: 'red' }],
  },
  {
    id: 'loock-yunding',
    brands: [{ id: 'loock', name: '鹿客/云丁', logo: '鹿', tone: 'red' }],
  },
]

const cardLockGroups: BrandGroup[] = [
  {
    id: 'card-system',
    brands: [{ id: 'card-system', name: '门卡管理系统', logo: 'CARD', tone: 'blue' }],
  },
  {
    id: 'ut-card',
    brands: [{ id: 'ut-card', name: '优特', logo: 'UT', tone: 'red' }],
  },
]

export function SmartDoorLockPage() {
  const [activeTab, setActiveTab] = useState<LockTab>('password')
  const [dialogBrand, setDialogBrand] = useState('')
  const [notice, setNotice] = useState('')

  const brandGroups = activeTab === 'password' ? passwordBrandGroups : cardLockGroups
  const leadText = activeTab === 'password' ? '请选择门锁品牌添加账号' : '请选择房卡门锁品牌添加账号'

  function openBrandDialog(brandName: string) {
    setNotice('')
    setDialogBrand(brandName)
  }

  return (
    <div className="smart-lock-page">
      <h1 className="sr-only-heading">智能门锁</h1>
      <span className="smart-lock-version">版本号：v4.10.7</span>

      <section className="smart-lock-surface" aria-label="智能门锁账号接入">
        <div className="smart-lock-tabs" role="tablist" aria-label="门锁类型">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'password'}
            className={activeTab === 'password' ? 'is-active' : ''}
            onClick={() => setActiveTab('password')}
          >
            密码门锁
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'card'}
            className={activeTab === 'card' ? 'is-active' : ''}
            onClick={() => setActiveTab('card')}
          >
            房卡门锁
          </button>
        </div>

        <p className="smart-lock-lead">{leadText}</p>

        <div className="smart-lock-grid" aria-label="门锁品牌列表">
          {brandGroups.map((group) => (
            <article key={group.id} className="smart-lock-card">
              {group.brands.map((brand) => (
                <button
                  key={brand.id}
                  type="button"
                  className="smart-lock-brand"
                  aria-label={`添加${brand.name}账号`}
                  onClick={() => openBrandDialog(brand.name)}
                >
                  <span className={`smart-lock-logo smart-lock-logo--${brand.tone}`}>{brand.logo}</span>
                  <strong>{brand.name}</strong>
                </button>
              ))}
            </article>
          ))}

          <article className="smart-lock-card smart-lock-card--mall">
            <div className="smart-lock-mall-logo">路客商城</div>
            <button type="button" onClick={() => setNotice('已打开路客商城入口')}>
              + 加购门锁
            </button>
          </article>
        </div>
      </section>

      <div className="smart-lock-status" role="status" aria-live="polite">
        {notice}
      </div>

      {dialogBrand ? <AddAccountDialog brandName={dialogBrand} onClose={() => setDialogBrand('')} /> : null}
    </div>
  )
}

function AddAccountDialog({ brandName, onClose }: { brandName: string; onClose: () => void }) {
  return (
    <div className="smart-lock-modal-backdrop">
      <section className="smart-lock-modal" role="dialog" aria-modal="true" aria-labelledby="smart-lock-dialog-title">
        <header>
          <h2 id="smart-lock-dialog-title">添加{brandName}账号</h2>
          <button type="button" aria-label="关闭" onClick={onClose}>
            ×
          </button>
        </header>
        <div className="smart-lock-modal__body">
          <label>
            <span>账号名称</span>
            <input placeholder="请输入账号名称" />
          </label>
          <label>
            <span>登录账号</span>
            <input placeholder="请输入登录账号" />
          </label>
          <label>
            <span>登录密码</span>
            <input type="password" placeholder="请输入登录密码" />
          </label>
        </div>
        <footer>
          <button type="button" onClick={onClose}>
            取消
          </button>
          <button type="button" className="is-primary" onClick={onClose}>
            确定
          </button>
        </footer>
      </section>
    </div>
  )
}
