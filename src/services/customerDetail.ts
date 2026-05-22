import type { CustomerRecord } from './customerList'

export type CustomerDetailTab = 'profile' | 'member' | 'orders' | 'coupons'

export type CustomerFollowRecord = {
  id: string
  owner: string
  time: string
  content: string
}

export type CustomerAssetCard = {
  title: string
  lines: string[]
  action?: string
  placeholder?: string
}

export type CustomerDetailData = {
  id: string
  name: string
  mobile: string
  avatarText: string
  customerNo: string
  memberLevel: string
  customerStatus: string
  becomeCustomerTime: string
  followPublicAccountTime: string
  channelText: string
  tags: string[]
  basicInfo: Array<{ label: string; value: string }>
  followRecords: CustomerFollowRecord[]
  assetCards: CustomerAssetCard[]
  tradeInfo: Array<{ label: string; value: string }>
}

const defaultDetail: CustomerDetailData = {
  id: '1801949727954239490',
  name: 'pTu748894801',
  mobile: '2729',
  avatarText: 'P',
  customerNo: '1801949727954239490',
  memberLevel: '普通会员',
  customerStatus: '正常',
  becomeCustomerTime: '2024-06-15 08:07:48',
  followPublicAccountTime: '-',
  channelText: '美团民宿（首次）',
  tags: [],
  basicInfo: [
    { label: '手机号', value: '2729' },
    { label: '姓名', value: 'pTu748894801' },
    { label: '生日', value: '-' },
    { label: '性别', value: '-' },
    { label: '地区', value: '-' },
    { label: '微信', value: '-' },
    { label: '邮箱', value: '-' },
    { label: 'QQ', value: '-' },
    { label: '是否加微信', value: '-' },
    { label: '是否加群', value: '-' },
    { label: '备注', value: '-' },
  ],
  followRecords: [],
  assetCards: [
    {
      title: '优惠券',
      lines: ['可用优惠券 0', '已失效 0', '已使用 0'],
      action: '送优惠券',
    },
    {
      title: '积分',
      lines: [],
      placeholder: '后续更新，敬请期待',
    },
    {
      title: '账户余额',
      lines: [],
      placeholder: '后续更新，敬请期待',
    },
  ],
  tradeInfo: [
    { label: '最近交易时间', value: '2024/05/30' },
    { label: '最近消费金额', value: '19.8' },
    { label: '累计消费金额', value: '19.8' },
    { label: '累计消费次数', value: '1' },
    { label: '客单价', value: '19.8' },
  ],
}

export async function fetchCustomerDetail(customer: CustomerRecord | null | undefined, signal?: AbortSignal): Promise<CustomerDetailData> {
  await delay(120, signal)

  if (!customer) {
    return defaultDetail
  }

  return {
    ...defaultDetail,
    id: customer.id,
    name: customer.name,
    mobile: customer.mobile,
    avatarText: customer.name.slice(0, 1).toUpperCase(),
    customerNo: customer.memberNo,
    memberLevel: customer.memberCardName,
    customerStatus: '正常',
    becomeCustomerTime: customer.firstMemberTime,
    channelText: `${customer.channelName}${customer.channelName === '-' ? '' : '（首次）'}`,
    tags: customer.tagNames,
    tradeInfo: [
      { label: '最近交易时间', value: customer.lastConsumeTime === '-' ? '-' : customer.lastConsumeTime.slice(0, 10).replace(/-/g, '/') },
      { label: '最近消费金额', value: customer.lastConsumePrice },
      { label: '累计消费金额', value: customer.totalConsumePrice },
      { label: '累计消费次数', value: customer.totalConsumeCount },
      { label: '客单价', value: customer.avgConsumePrice },
    ],
  }
}

function delay(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(resolve, ms)
    signal?.addEventListener(
      'abort',
      () => {
        window.clearTimeout(timer)
        reject(new DOMException('Aborted', 'AbortError'))
      },
      { once: true },
    )
  })
}
