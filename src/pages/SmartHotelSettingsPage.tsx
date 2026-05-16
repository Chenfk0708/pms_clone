import { useState } from 'react'
import './SmartHotelSettingsPage.css'

type SmartTab = 'decorate' | 'share'

interface SmartActionButton {
  id: string
  name: string
  content: string
}

const initialButtons: SmartActionButton[] = [
  { id: 'register', name: '入住登记', content: '' },
  { id: 'guide', name: '入住指引', content: '' },
  { id: 'notice', name: '入住须知', content: '' },
  { id: 'wifi', name: 'WIFI上网', content: '' },
  { id: 'renew', name: '续住', content: '' },
  { id: 'checkout', name: '一键退房', content: '' },
  { id: 'invoice', name: '开发票', content: '' },
]

export function SmartHotelSettingsPage() {
  const [activeTab, setActiveTab] = useState<SmartTab>('decorate')
  const [buttons, setButtons] = useState(initialButtons)
  const [saved, setSaved] = useState(false)

  function updateButton(id: string, field: 'name' | 'content', value: string) {
    setSaved(false)
    setButtons((current) => current.map((item) => (item.id === id ? { ...item, [field]: value } : item)))
  }

  function addButton() {
    setSaved(false)
    setButtons((current) => [
      ...current,
      {
        id: `custom-${current.length + 1}`,
        name: '',
        content: '',
      },
    ])
  }

  return (
    <div className="smart-settings-page">
      <h1 className="sr-only-heading">智住小程序</h1>
      <span className="smart-settings-version">版本号：v4.10.7</span>
      <section className="smart-settings-surface" aria-label="智住小程序设置">
        <div className="smart-settings-tabs" role="tablist" aria-label="智住小程序页签">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'decorate'}
            className={activeTab === 'decorate' ? 'is-active' : ''}
            onClick={() => setActiveTab('decorate')}
          >
            装修
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'share'}
            className={activeTab === 'share' ? 'is-active' : ''}
            onClick={() => setActiveTab('share')}
          >
            分享
          </button>
        </div>

        {activeTab === 'decorate' ? (
          <DecoratePanel
            buttons={buttons}
            saved={saved}
            onAdd={addButton}
            onSave={() => setSaved(true)}
            onChange={updateButton}
          />
        ) : (
          <SharePanel />
        )}
      </section>
    </div>
  )
}

function DecoratePanel({
  buttons,
  saved,
  onAdd,
  onSave,
  onChange,
}: {
  buttons: SmartActionButton[]
  saved: boolean
  onAdd: () => void
  onSave: () => void
  onChange: (id: string, field: 'name' | 'content', value: string) => void
}) {
  return (
    <div className="smart-settings-card">
      <header className="smart-settings-card__head">
        <h2>操作按钮设置</h2>
        <button type="button" onClick={onAdd}>
          添加按钮
        </button>
      </header>
      <p className="smart-settings-help">可根据业务场景可以根据业务场景调整内容，支持新增底部操作按钮，可自定义标题名称、自定义设置触发后显示的内容。</p>

      <div className="smart-settings-button-list" aria-label="智住小程序操作按钮">
        {buttons.map((button) => (
          <div key={button.id} className="smart-settings-button-row">
            <div className="smart-settings-upload">
              <span>按钮图标</span>
              <button type="button">上传图片</button>
            </div>
            <label className="smart-settings-field">
              <span>按钮名称：</span>
              <input
                value={button.name}
                placeholder="请输入按钮名称"
                onChange={(event) => onChange(button.id, 'name', event.target.value)}
              />
            </label>
            <label className="smart-settings-field">
              <span>弹框文案：</span>
              <input
                value={button.content}
                placeholder="请输入弹框文案"
                onChange={(event) => onChange(button.id, 'content', event.target.value)}
              />
            </label>
          </div>
        ))}
      </div>

      <footer className="smart-settings-footer">
        {saved ? <span role="status">已保存智住小程序配置</span> : null}
        <button type="button" className="is-primary" onClick={onSave}>
          保 存
        </button>
      </footer>
    </div>
  )
}

function SharePanel() {
  return (
    <div className="smart-settings-card smart-settings-share">
      <header className="smart-settings-card__head">
        <h2>分享设置</h2>
      </header>
      <div className="smart-settings-share__content">
        <div className="smart-settings-qr" aria-label="小程序二维码">
          <span />
          <strong>小程序二维码</strong>
        </div>
        <div className="smart-settings-share__copy">
          <h3>智住小程序分享入口</h3>
          <p>用于给住客展示自助入住、入住指引、续住、一键退房和发票等底部操作按钮。</p>
          <div>
            <button type="button">下载二维码</button>
            <button type="button">复制链接</button>
          </div>
        </div>
      </div>
    </div>
  )
}
