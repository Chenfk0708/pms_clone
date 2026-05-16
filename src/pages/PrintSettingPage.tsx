import { useState } from 'react'
import './PrintSettingPage.css'

const paperOptions = ['小票（80mm）', '小票（58mm）', 'A4'] as const

export function PrintSettingPage() {
  const [stayPaper, setStayPaper] = useState<(typeof paperOptions)[number]>('小票（80mm）')
  const [receiptPaper, setReceiptPaper] = useState<(typeof paperOptions)[number]>('A4')
  const [stayText, setStayText] = useState('请您仔细核对金额，确认无误后签名确认，谢谢!欢迎您再次光临!')
  const [receiptText, setReceiptText] = useState('')

  return (
    <div className="print-setting-page">
      <PrintPanel
        title="住宿打印"
        ariaLabel="住宿打印配置"
        paper={stayPaper}
        onPaperChange={setStayPaper}
        bill="消费明细账单（短租）"
        text={stayText}
        onTextChange={setStayText}
        order="paper-first"
      />
      <PrintPanel
        title="收款账单"
        ariaLabel="收款账单配置"
        paper={receiptPaper}
        onPaperChange={setReceiptPaper}
        bill="收款账单"
        text={receiptText}
        onTextChange={setReceiptText}
        order="bill-first"
      />
    </div>
  )
}

interface PrintPanelProps {
  title: string
  ariaLabel: string
  paper: (typeof paperOptions)[number]
  onPaperChange: (value: (typeof paperOptions)[number]) => void
  bill: string
  text: string
  onTextChange: (value: string) => void
  order: 'paper-first' | 'bill-first'
}

function PrintPanel({ title, ariaLabel, paper, onPaperChange, bill, text, onTextChange, order }: PrintPanelProps) {
  const fields =
    order === 'paper-first'
      ? [
          <PaperField key="paper" groupName={ariaLabel} value={paper} onChange={onPaperChange} />,
          <BillField key="bill" value={bill} />,
          <TextField key="text" value={text} onChange={onTextChange} />,
        ]
      : [
          <BillField key="bill" value={bill} />,
          <PaperField key="paper" groupName={ariaLabel} value={paper} onChange={onPaperChange} />,
          <TextField key="text" value={text} onChange={onTextChange} />,
        ]

  return (
    <section className="print-setting-section" aria-label={ariaLabel}>
      <h2>{title}</h2>
      <div className="print-setting-card">{fields}</div>
    </section>
  )
}

function PaperField({
  groupName,
  value,
  onChange,
}: {
  groupName: string
  value: (typeof paperOptions)[number]
  onChange: (value: (typeof paperOptions)[number]) => void
}) {
  return (
    <fieldset className="print-setting-field print-setting-field--paper">
      <legend>打印纸张</legend>
      <div className="print-setting-radio-group">
        {paperOptions.map((option) => (
          <label key={option} className="print-setting-radio">
            <input
              type="radio"
              name={`paper-${groupName}`}
              checked={value === option}
              onChange={() => onChange(option)}
            />
            <span>{option}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

function BillField({ value }: { value: string }) {
  return (
    <div className="print-setting-field">
      <div className="print-setting-label">选择单据</div>
      <button type="button" className="print-setting-select" aria-label={`选择单据 ${value}`}>
        <span>{value}</span>
        <i aria-hidden="true">⌄</i>
      </button>
    </div>
  )
}

function TextField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="print-setting-field print-setting-field--text">
      <label htmlFor={`print-text-${value ? 'stay' : 'receipt'}`}>自定义提示文案</label>
      <textarea
        id={`print-text-${value ? 'stay' : 'receipt'}`}
        placeholder="请填写文案"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <button type="button" className="print-setting-save">
        保 存
      </button>
    </div>
  )
}
