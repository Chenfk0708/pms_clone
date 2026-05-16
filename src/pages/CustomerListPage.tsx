import { useState } from 'react'
import './CustomerListPage.css'

type FilterKey = 'status' | 'identity' | 'level' | 'wechat' | 'gender' | 'age'

const filterOptions: Record<FilterKey, string[]> = {
  status: ['全部', '正常', '冻结', '黑名单'],
  identity: ['全部客户', '会员客户', '企微客户', '渠道客户'],
  level: ['普通会员', '银卡会员', '金卡会员', '钻石会员'],
  wechat: ['已添加', '未添加'],
  gender: ['男', '女', '未知'],
  age: ['18-25', '26-35', '36-45', '46岁以上'],
}

const defaultFilterValues: Record<FilterKey, string> = {
  status: '',
  identity: '',
  level: '',
  wechat: '',
  gender: '',
  age: '',
}

const tableColumns = [
  '客户信息',
  '客户编号',
  '客户渠道',
  '会员等级',
  '客户标签',
  '最近消费金额',
  '累计消费次数',
  '累计消费金额',
  '客单价',
  '是否添加企微',
  '是否加微信',
  '是否加群',
  '成为客户时间',
  '成为会员时间',
  '最近消费时间',
  '最近跟进时间',
  '操作',
]

const customerRows = [
  {
    name: '任清明',
    phone: '13141204230',
    id: '1810493396951339010',
    channel: '携程',
    level: '普通会员',
    lastAmount: '637.2',
    count: '1',
    totalAmount: '637.2',
    average: '637.2',
    customerAt: '2024-07-09 09:57:17',
    memberAt: '2024-07-09 09:57:17',
    lastOrderAt: '2024-07-09 09:57:17',
  },
  {
    name: 'izu262346024',
    phone: '0110',
    id: '1862465040109776897',
    channel: '美团民宿',
    level: '普通会员',
    lastAmount: '-',
    count: '-',
    totalAmount: '-',
    average: '-',
    customerAt: '2024-11-29 19:54:03',
    memberAt: '2024-11-29 19:54:03',
    lastOrderAt: '-',
  },
  {
    name: '路客云6TS5',
    phone: '18123941382',
    id: '1796067694142693378',
    channel: '自来客',
    level: '-',
    lastAmount: '-',
    count: '-',
    totalAmount: '-',
    average: '-',
    customerAt: '2024-05-30 14:34:42',
    memberAt: '-',
    lastOrderAt: '-',
  },
  {
    name: 'GHq721352403',
    phone: '8788',
    id: '1801949715195166722',
    channel: '美团民宿',
    level: '普通会员',
    lastAmount: '19.8',
    count: '3',
    totalAmount: '59.4',
    average: '19.8',
    customerAt: '2024-06-15 20:07:45',
    memberAt: '2024-06-15 20:07:45',
    lastOrderAt: '2024-09-12 19:20:22',
  },
  {
    name: 'gUM25201527',
    phone: '6595',
    id: '1801949723525050371',
    channel: '美团民宿',
    level: '普通会员',
    lastAmount: '1087.02',
    count: '1',
    totalAmount: '1087.02',
    average: '1087.02',
    customerAt: '2024-06-15 20:07:47',
    memberAt: '2024-06-15 20:07:47',
    lastOrderAt: '2024-05-28 14:10:33',
  },
  {
    name: 'pTu748894801',
    phone: '2729',
    id: '1801949727954239490',
    channel: '美团民宿',
    level: '普通会员',
    lastAmount: '19.8',
    count: '1',
    totalAmount: '19.8',
    average: '19.8',
    customerAt: '2024-06-15 20:07:48',
    memberAt: '2024-06-15 20:07:48',
    lastOrderAt: '2024-05-30 22:14:47',
  },
  {
    name: 'shB710890387',
    phone: '2772',
    id: '1801949777824514050',
    channel: '美团民宿',
    level: '普通会员',
    lastAmount: '37.62',
    count: '1',
    totalAmount: '37.62',
    average: '37.62',
    customerAt: '2024-06-15 20:08:00',
    memberAt: '2024-06-15 20:08:00',
    lastOrderAt: '2024-05-16 14:52:53',
  },
  {
    name: 'pCG136191587',
    phone: '1479',
    id: '1801949732022714369',
    channel: '美团民宿',
    level: '普通会员',
    lastAmount: '16.83',
    count: '2',
    totalAmount: '36.63',
    average: '18.31',
    customerAt: '2024-06-15 20:07:49',
    memberAt: '2024-06-15 20:07:49',
    lastOrderAt: '2024-05-30 20:37:45',
  },
  {
    name: '是七啊838',
    phone: '1974',
    id: '1801949753279447041',
    channel: '美团民宿',
    level: '普通会员',
    lastAmount: '16.83',
    count: '1',
    totalAmount: '16.83',
    average: '16.83',
    customerAt: '2024-06-15 20:07:54',
    memberAt: '2024-06-15 20:07:54',
    lastOrderAt: '2024-05-21 20:15:34',
  },
  {
    name: 'bQm125435443',
    phone: '7025',
    id: '1801949735889862657',
    channel: '美团民宿',
    level: '普通会员',
    lastAmount: '727.2',
    count: '1',
    totalAmount: '727.2',
    average: '727.2',
    customerAt: '2024-06-15 20:07:50',
    memberAt: '2024-06-15 20:07:50',
    lastOrderAt: '2024-05-22 00:01:58',
  },
]

export function CustomerListPage() {
  const [expanded, setExpanded] = useState(false)
  const [openFilter, setOpenFilter] = useState<FilterKey | null>(null)
  const [filters, setFilters] = useState(defaultFilterValues)
  const [keyword, setKeyword] = useState('')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [notice, setNotice] = useState('')

  function chooseFilter(key: FilterKey, value: string) {
    setFilters((current) => ({ ...current, [key]: value }))
    setOpenFilter(null)
  }

  function resetFilters() {
    setFilters(defaultFilterValues)
    setKeyword('')
    setOpenFilter(null)
    setNotice('')
  }

  return (
    <div className="customer-list-page">
      <h1 className="sr-only-heading">客户列表</h1>

      <section className={`customer-list-query${expanded ? ' is-expanded' : ''}`} aria-label="客户列表筛选">
        <div className="customer-list-query__grid">
          <div className="customer-list-field customer-list-search">
            <span>客户搜索:</span>
            <div className="customer-list-search__control">
              <button type="button" aria-haspopup="listbox" aria-label="手机号">
                手机号
              </button>
              <input value={keyword} placeholder="请输入" onChange={(event) => setKeyword(event.target.value)} />
            </div>
          </div>
          <CustomerSelect
            label="客户状态"
            placeholder="请选择"
            value={filters.status}
            isOpen={openFilter === 'status'}
            onToggle={() => setOpenFilter(openFilter === 'status' ? null : 'status')}
          />
          <CustomerSelect
            label="客户身份"
            placeholder="请选择"
            value={filters.identity}
            isOpen={openFilter === 'identity'}
            onToggle={() => setOpenFilter(openFilter === 'identity' ? null : 'identity')}
          />
          {expanded ? (
            <>
              <CustomerSelect
                label="会员等级"
                placeholder="请选择"
                value={filters.level}
                isOpen={openFilter === 'level'}
                onToggle={() => setOpenFilter(openFilter === 'level' ? null : 'level')}
              />
              <CustomerSelect
                label="是否添加企微"
                placeholder="请选择"
                value={filters.wechat}
                isOpen={openFilter === 'wechat'}
                onToggle={() => setOpenFilter(openFilter === 'wechat' ? null : 'wechat')}
              />
              <CustomerSelect
                label="客户性别"
                placeholder="请选择"
                value={filters.gender}
                isOpen={openFilter === 'gender'}
                onToggle={() => setOpenFilter(openFilter === 'gender' ? null : 'gender')}
              />
              <CustomerSelect
                label="客户年龄"
                placeholder="请选择"
                value={filters.age}
                isOpen={openFilter === 'age'}
                onToggle={() => setOpenFilter(openFilter === 'age' ? null : 'age')}
              />
              <DateRangeField label="成为客户时间" />
              <DateRangeField label="成为会员时间" />
              <DateRangeField label="最近跟进时间" />
              <DateRangeField label="最近消费时间" />
              <AmountRangeField label="最近消费金额" />
              <AmountRangeField label="累计消费金额" />
              <AmountRangeField label="客单价" />
            </>
          ) : null}
        </div>

        {openFilter ? (
          <div className="customer-list-options" role="listbox" aria-label={`${filterLabel(openFilter)}选项`}>
            {filterOptions[openFilter].map((option) => (
              <button
                key={option}
                type="button"
                role="option"
                aria-selected={filters[openFilter] === option}
                onClick={() => chooseFilter(openFilter, option)}
              >
                {option}
              </button>
            ))}
          </div>
        ) : null}

        <div className="customer-list-query__actions">
          <button type="button" className="is-link" onClick={() => setExpanded((current) => !current)}>
            {expanded ? '收起' : '展开'} <span aria-hidden="true">{expanded ? '⌃' : '⌄'}</span>
          </button>
          <button type="button" className="is-primary" onClick={() => setOpenFilter(null)}>
            查 询
          </button>
          <button type="button" onClick={resetFilters}>
            重 置
          </button>
        </div>
      </section>

      <div className="customer-list-toolbar">
        <button type="button" className="customer-list-export" onClick={() => setNotice('已生成客户列表导出任务')}>
          导出数据
        </button>
        <button type="button" className="customer-list-add" onClick={() => setShowAddDialog(true)}>
          添加客户
        </button>
      </div>

      {notice ? (
        <div className="customer-list-notice" role="status">
          {notice}
        </div>
      ) : null}

      <section className="customer-list-table" aria-label="客户列表表格">
        <div className="customer-list-table__head">
          <label className="customer-list-check">
            <input type="checkbox" aria-label="全选客户" />
          </label>
          {tableColumns.map((column) => (
            <div key={column}>{column}</div>
          ))}
        </div>
        <div className="customer-list-table__body">
          {customerRows.map((row) => (
            <div key={row.id} className="customer-list-row">
              <label className="customer-list-check">
                <input type="checkbox" aria-label={`选择${row.name}`} />
              </label>
              <div className="customer-list-profile">
                <span className="customer-list-avatar" aria-hidden="true" />
                <div>
                  <strong>{row.name}</strong>
                  <span>{row.phone}</span>
                </div>
              </div>
              <div>{row.id}</div>
              <div>{row.channel}</div>
              <div>{row.level}</div>
              <div>-</div>
              <div>{row.lastAmount}</div>
              <div>{row.count}</div>
              <div>{row.totalAmount}</div>
              <div>{row.average}</div>
              <div>-</div>
              <div>-</div>
              <div>-</div>
              <div>{row.customerAt}</div>
              <div>{row.memberAt}</div>
              <div>{row.lastOrderAt}</div>
              <div>-</div>
              <div className="customer-list-actions">
                <button type="button" onClick={() => setNotice(`查看客户：${row.name}`)}>
                  详情
                </button>
                <button type="button" onClick={() => setNotice(`打开更多操作：${row.name}`)}>
                  更多
                </button>
              </div>
            </div>
          ))}
        </div>
        <footer className="customer-list-pagination">
          <span>第 1-20 条/总共 588 条</span>
          <button type="button" className="is-active">
            1
          </button>
          <button type="button">2</button>
          <button type="button">3</button>
          <button type="button">4</button>
          <button type="button">5</button>
          <em>•••</em>
          <button type="button">30</button>
          <button type="button" aria-label="下一页">
            ›
          </button>
          <button type="button" className="customer-list-page-size">
            20 条/页
          </button>
        </footer>
      </section>

      {showAddDialog ? <AddCustomerDialog onClose={() => setShowAddDialog(false)} /> : null}
    </div>
  )
}

function CustomerSelect({
  label,
  placeholder,
  value,
  isOpen,
  onToggle,
}: {
  label: string
  placeholder: string
  value: string
  isOpen: boolean
  onToggle: () => void
}) {
  const displayValue = value || placeholder

  return (
    <label className="customer-list-field">
      <span>{label}:</span>
      <button
        type="button"
        className="customer-list-select"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`${label} ${displayValue}`}
        onClick={onToggle}
      >
        {displayValue}
      </button>
    </label>
  )
}

function DateRangeField({ label }: { label: string }) {
  return (
    <div className="customer-list-field customer-list-date" role="group" aria-label={label}>
      <span>{label}:</span>
      <div className="customer-list-date__range">
        <input aria-label={`${label}开始`} placeholder="请选择" />
        <em>→</em>
        <input aria-label={`${label}结束`} placeholder="请选择" />
      </div>
    </div>
  )
}

function AmountRangeField({ label }: { label: string }) {
  return (
    <div className="customer-list-field customer-list-amount" role="group" aria-label={label}>
      <span>{label}:</span>
      <div className="customer-list-amount__range">
        <input aria-label={`${label}最小值`} placeholder="请输入" />
        <em>-</em>
        <input aria-label={`${label}最大值`} placeholder="请输入" />
      </div>
    </div>
  )
}

function AddCustomerDialog({ onClose }: { onClose: () => void }) {
  return (
    <div className="customer-list-modal-backdrop">
      <section className="customer-list-modal" role="dialog" aria-modal="true" aria-label="添加客户">
        <header>
          <h2>添加客户</h2>
          <button type="button" aria-label="关闭添加客户" onClick={onClose}>
            ×
          </button>
        </header>
        <div className="customer-list-modal__body">
          <DialogField label="手机号" required placeholder="请输入手机号" />
          <DialogField label="姓名" placeholder="请输入姓名" />
          <DialogSelect label="性别" placeholder="请选择" />
          <DialogField label="生日" placeholder="请选择日期" />
          <DialogField label="地区" placeholder="请输入" />
          <DialogSelect label="客户渠道" required placeholder="请选择客户渠道" />
          <DialogField label="成为客户时间" required defaultValue="2026-05-14 10:33:27" />
          <DialogField label="微信" placeholder="请输入微信" />
          <DialogField label="邮箱" placeholder="请输入邮箱" />
          <DialogField label="QQ" placeholder="QQ" />
          <DialogSelect label="是否加微信" placeholder="请选择" />
          <DialogSelect label="是否加群" placeholder="请选择" />
          <DialogField label="备注" placeholder="请输入备注" />
        </div>
        <footer>
          <button type="button" onClick={onClose}>
            取 消
          </button>
          <button type="button" className="is-primary" onClick={onClose}>
            保 存
          </button>
        </footer>
      </section>
    </div>
  )
}

function DialogField({
  label,
  placeholder,
  required,
  defaultValue,
}: {
  label: string
  placeholder?: string
  required?: boolean
  defaultValue?: string
}) {
  return (
    <label className="customer-list-dialog-field">
      <span>{required ? <b aria-hidden="true">*</b> : null}{label}:</span>
      <input placeholder={placeholder} defaultValue={defaultValue} />
    </label>
  )
}

function DialogSelect({ label, placeholder, required }: { label: string; placeholder: string; required?: boolean }) {
  return (
    <label className="customer-list-dialog-field">
      <span>{required ? <b aria-hidden="true">*</b> : null}{label}:</span>
      <button type="button" className="customer-list-dialog-select" aria-label={`${label} ${placeholder}`}>
        {placeholder}
      </button>
    </label>
  )
}

function filterLabel(key: FilterKey) {
  const labels: Record<FilterKey, string> = {
    status: '客户状态',
    identity: '客户身份',
    level: '会员等级',
    wechat: '是否添加企微',
    gender: '客户性别',
    age: '客户年龄',
  }
  return labels[key]
}
