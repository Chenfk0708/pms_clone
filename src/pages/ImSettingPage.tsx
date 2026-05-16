import { useState } from 'react'
import './ImSettingPage.css'

const tabs = ['常用语', '自动回复设置', '页面设置', '标签设置', '快捷键设置', '版本设置'] as const

type ImSettingTab = (typeof tabs)[number]

export function ImSettingPage() {
  const [activeTab, setActiveTab] = useState<ImSettingTab>('常用语')

  return (
    <div className="im-setting-page">
      <section className="im-setting-version">
        <span>当前为会话基础版本，想提高IM回话接待效率，增加客服坐席，切换</span>
        <a href="/version/applicationPayment/detail?app=im">“会话升级版”</a>
      </section>

      <nav className="im-setting-tabs" aria-label="会话设置标签">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            className={activeTab === tab ? 'is-active' : ''}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </nav>

      {activeTab === '常用语' ? <PhrasePanel /> : <SettingsPlaceholder activeTab={activeTab} />}
    </div>
  )
}

function PhrasePanel() {
  return (
    <section className="im-phrase-panel" aria-label="常用语">
      <aside className="im-phrase-categories">
        <div className="im-category-head">
          <strong>分类</strong>
          <button type="button">新建分类</button>
        </div>
        <div className="im-category-active">全部分类</div>
      </aside>

      <section className="im-phrase-content">
        <div className="im-current-category">当前分类：全部分类</div>
        <div className="im-phrase-toolbar">
          <label className="im-search">
            <input type="text" placeholder="输入标题/回复内容" />
            <button type="button" aria-label="搜索">
              搜
            </button>
          </label>
          <button type="button" className="im-primary-action">
            添加常用语
          </button>
        </div>

        <div className="im-batch-actions">
          <span>共选择 0 条</span>
          <button type="button" disabled>
            更改分类
          </button>
          <button type="button" disabled>
            批量删除
          </button>
        </div>

        <div className="im-phrase-table" role="table" aria-label="常用语列表">
          <div className="im-table-row im-table-head" role="row">
            <span role="columnheader" className="im-check" aria-label="全选" />
            <span role="columnheader">分类</span>
            <span role="columnheader">标题</span>
            <span role="columnheader">回复内容</span>
            <span role="columnheader">操作</span>
          </div>
          <div className="im-empty-row">暂无数据</div>
        </div>
      </section>
    </section>
  )
}

function SettingsPlaceholder({ activeTab }: { activeTab: Exclude<ImSettingTab, '常用语'> }) {
  const descriptions: Record<Exclude<ImSettingTab, '常用语'>, string> = {
    自动回复设置: '会话基础版暂未开启自动回复，升级后可配置接待规则和自动回复内容。',
    页面设置: '用于控制会话窗口、消息列表和接待页面的基础展示。',
    标签设置: '可用于会话列表快速识别咨询状态、渠道来源和跟进优先级。',
    快捷键设置: '配置客服坐席常用快捷键，提高回复与切换会话效率。',
    版本设置: '查看当前会话基础版本能力，并切换到会话升级版。',
  }

  return (
    <section className="im-setting-state" aria-label={activeTab}>
      <h2>{activeTab}</h2>
      <p>{descriptions[activeTab]}</p>
      <div className="im-setting-state-card">
        <span>当前版本</span>
        <strong>会话基础版</strong>
        <button type="button">会话升级版</button>
      </div>
    </section>
  )
}
