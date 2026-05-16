import { useEffect } from 'react'
import './MemberPointsPage.css'

const comingSoonImage =
  'https://locals-house-prod.oss-cn-shenzhen.aliyuncs.com//localhomeqy/integrate/8a49c88e665575ed270c7f170f87bd31.png'
const advisorQr =
  'https://hudson-prod.localhome.cn/qr?text=https%3A%2F%2Fh.localhome.cn%2Fuser%2Fhudson%2Fparseurl%3Fschema%3Dhudsonaction%253A%252F%252Fminsubao.localhome.cn%252FFETCSET_CHANNELSH_JOIN_NETWORK%253FnetworkNum%253D%2526inviteUserId%253D1796067693261905922%2526inviteWay%253D1'

export function MemberPointsPage() {
  useEffect(() => {
    document.body.classList.add('member-points-route')

    return () => {
      document.body.classList.remove('member-points-route')
    }
  }, [])

  return (
    <div className="member-points-page">
      <section className="member-points-panel" aria-label="会员积分">
        <div className="member-points-empty">
          <img className="member-points-coming-soon" src={comingSoonImage} alt="敬请期待 coming soon" />
          <div className="member-points-contact">
            <img className="member-points-qr" src={advisorQr} alt="路客云SCRM顾问二维码" />
            <div className="member-points-contact__text">
              <p>路客云SCRM顾问</p>
              <span>请扫码添加路客云SCRM顾问</span>
              <span>我们将随时解答你的疑问</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
