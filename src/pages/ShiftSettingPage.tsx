import { useState } from 'react'
import './ShiftSettingPage.css'

type ShiftSettingDialog = 'shift' | 'item' | null

const shiftColumns = ['班次名称', '开始时间', '结束时间', '班次成员']

export function ShiftSettingPage() {
  const [dialog, setDialog] = useState<ShiftSettingDialog>(null)

  return (
    <div className="shift-setting-page">
      <h1 className="sr-only-heading">交接班设置</h1>

      <SettingSection title="班次设置" actionLabel="班次设置" onAction={() => setDialog('shift')}>
        <table className="shift-setting-table" aria-label="班次设置表格">
          <colgroup>
            <col className="shift-setting-col" />
            <col className="shift-setting-col" />
            <col className="shift-setting-col" />
            <col className="shift-setting-col shift-setting-col--members" />
          </colgroup>
          <thead>
            <tr>
              {shiftColumns.map((column) => (
                <th key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={shiftColumns.length}>
                <EmptyState label="暂无班次， 点击新增" onClick={() => setDialog('shift')} />
              </td>
            </tr>
          </tbody>
        </table>
      </SettingSection>

      <SettingSection title="交班物品" actionLabel="添加物品" onAction={() => setDialog('item')}>
        <div className="shift-setting-item-empty">
          <EmptyState label="暂无交班物品， 点击新增" onClick={() => setDialog('item')} />
        </div>
      </SettingSection>

      {dialog === 'shift' ? <ShiftDialog onClose={() => setDialog(null)} /> : null}
      {dialog === 'item' ? <ItemDialog onClose={() => setDialog(null)} /> : null}
    </div>
  )
}

function SettingSection({
  title,
  actionLabel,
  onAction,
  children,
}: {
  title: string
  actionLabel: string
  onAction: () => void
  children: React.ReactNode
}) {
  return (
    <section className="shift-setting-section" aria-label={title}>
      <header className="shift-setting-section__header">
        <div className="shift-setting-section__title">
          <h2>{title}</h2>
          <span>最近更新时间：-</span>
        </div>
        <button type="button" className="shift-setting-primary" onClick={onAction}>
          {actionLabel}
        </button>
      </header>
      {children}
    </section>
  )
}

function EmptyState({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <div className="shift-setting-empty">
      <span>{label.split('点击新增')[0]}</span>
      <button type="button" onClick={onClick}>
        点击新增
      </button>
    </div>
  )
}

function ShiftDialog({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="设置班次" onClose={onClose}>
      <div className="shift-setting-modal__body">
        <button type="button" className="shift-setting-outline">
          + 新增班次
        </button>
        <div className="shift-setting-shift-row">
          <input aria-label="班次名称" placeholder="请输入班次名称" />
          <input aria-label="开始时间" placeholder="请选择" readOnly />
          <input aria-label="结束时间" placeholder="请选择" readOnly />
          <input aria-label="班次成员" placeholder="请选择班次成员" readOnly />
        </div>
      </div>
      <ModalFooter onClose={onClose} />
    </Modal>
  )
}

function ItemDialog({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="添加物品" onClose={onClose}>
      <div className="shift-setting-modal__body">
        <button type="button" className="shift-setting-outline">
          + 新增物品
        </button>
        <div className="shift-setting-item-row">
          <input aria-label="物品名称" placeholder="请输入物品名称" />
        </div>
      </div>
      <ModalFooter onClose={onClose} />
    </Modal>
  )
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <div className="shift-setting-modal-mask">
      <div className="shift-setting-modal" role="dialog" aria-modal="true" aria-label={title}>
        <header className="shift-setting-modal__header">
          <h2>{title}</h2>
          <button type="button" aria-label="Close" onClick={onClose}>
            ×
          </button>
        </header>
        {children}
      </div>
    </div>
  )
}

function ModalFooter({ onClose }: { onClose: () => void }) {
  return (
    <footer className="shift-setting-modal__footer">
      <button type="button" className="shift-setting-cancel" onClick={onClose}>
        取 消
      </button>
      <button type="button" className="shift-setting-confirm" onClick={onClose}>
        确 定
      </button>
    </footer>
  )
}
