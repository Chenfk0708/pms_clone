import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './CleanStaffPage.css'

const unpaidBackground =
  'https://locals-house-prod.oss-cn-shenzhen.aliyuncs.com//localhomeqy/KEEPCLEANRENYUAN.png'

export function CleanStaffPage() {
  const navigate = useNavigate()
  const [selectedStore, setSelectedStore] = useState('all')
  const [keyword, setKeyword] = useState('')

  return (
    <div className="clean-staff-page">
      <h1 className="sr-only-heading">保洁人员</h1>
      <section className="clean-staff-card">
        <div className="clean-staff-toolbar">
          <div className="clean-staff-toolbar__top">
            <div className="clean-store-tabs" aria-label="门店筛选">
              <button
                type="button"
                aria-pressed={selectedStore === 'all'}
                className={selectedStore === 'all' ? 'is-active' : ''}
                onClick={() => setSelectedStore('all')}
              >
                全部门店
              </button>
              <button
                type="button"
                aria-pressed={selectedStore === 'main'}
                className={selectedStore === 'main' ? 'is-active' : ''}
                onClick={() => setSelectedStore('main')}
              >
                天落会宿公寓(前海壹方城宝安中心店)
              </button>
            </div>

            <label className="clean-search">
              <span>搜索：</span>
              <input
                type="text"
                placeholder="姓名/手机号"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
              />
            </label>
          </div>

          <button type="button" className="clean-primary clean-add-member">
            添加成员
          </button>
        </div>

        <div className="clean-unpaid-state">
          <img className="clean-unpaid-bg" src={unpaidBackground} alt="" draggable={false} />
          <div className="clean-subscribe-mask">
            <strong>限时钜惠！智能保洁6折开通</strong>
            <span>自动派单 ｜实时提醒 ｜ 报表清晰</span>
            <button
              type="button"
              className="clean-primary clean-subscribe-button"
              onClick={() => navigate('/version/applicationPayment/detail')}
            >
              订阅开通
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
