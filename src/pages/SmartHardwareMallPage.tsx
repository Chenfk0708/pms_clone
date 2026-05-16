import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import './SmartHardwareMallPage.css'

interface HardwareProduct {
  name: string
  price: string
  image: string
  action: 'buy' | 'contact'
}

const assetBase = '/assets/smart-hardware-mall'

const products: HardwareProduct[] = [
  {
    name: '门卡管理系统',
    price: '￥800',
    image: `${assetBase}/door-card-system.png`,
    action: 'buy',
  },
  {
    name: '蜂助手CPE路由器P5(5G门店版)',
    price: '￥1643',
    image: `${assetBase}/cpe-p5.png`,
    action: 'contact',
  },
  {
    name: '蜂助手CPE路由器S1(4G版)',
    price: '￥896',
    image: `${assetBase}/cpe-s1.jpg`,
    action: 'contact',
  },
  {
    name: '蜂助手4G盒子S2(极光TV版)',
    price: '￥1195',
    image: `${assetBase}/box-s2.jpg`,
    action: 'contact',
  },
  {
    name: '蜂助手随身UiFi U1',
    price: '￥341',
    image: `${assetBase}/uifi-u1.png`,
    action: 'contact',
  },
  {
    name: '指定款【智能密码锁/门锁】',
    price: '￥998',
    image: `${assetBase}/smart-lock.webp`,
    action: 'contact',
  },
  {
    name: '无人入住智能门锁智能入住 D12',
    price: '￥299',
    image: `${assetBase}/d12-lock.webp`,
    action: 'contact',
  },
]

export function SmartHardwareMallPage() {
  const location = useLocation()

  return location.pathname.endsWith('/detail') ? <SmartHardwareDetail /> : <SmartHardwareList />
}

function SmartHardwareList() {
  const navigate = useNavigate()
  const [notice, setNotice] = useState('')

  function handleProductAction(product: HardwareProduct) {
    if (product.action === 'buy') {
      navigate('/smartHotel/smartHardware/mall/detail')
      return
    }

    setNotice(`已唤起客服：${product.name}`)
  }

  return (
    <div className="smart-hardware-page">
      <section className="smart-hardware-hero">
        <div className="smart-hardware-hero__copy">
          <h1>智慧酒店一站式部署</h1>
          <p>助力酒店高效运营</p>
        </div>
        <img
          className="smart-hardware-hero__decoration"
          src={`${assetBase}/banner-decoration.png`}
          alt=""
          aria-hidden="true"
        />
      </section>

      <section className="smart-hardware-products" aria-label="智能硬件商品列表">
        {products.map((product) => (
          <article key={product.name} className="smart-hardware-card">
            <div className="smart-hardware-card__content">
              <div className="smart-hardware-card__image">
                <img src={product.image} alt={product.name} />
              </div>
              <div className="smart-hardware-card__info">
                <strong>{product.name}</strong>
                <span>{product.price}</span>
              </div>
            </div>
            <button type="button" onClick={() => handleProductAction(product)}>
              {product.action === 'buy' ? '立即购买' : '联系客服'}
            </button>
          </article>
        ))}
      </section>

      <StatusNotice message={notice} />
    </div>
  )
}

function SmartHardwareDetail() {
  const [isAgreementChecked, setIsAgreementChecked] = useState(false)
  const [notice, setNotice] = useState('')

  function submitOrder() {
    if (!isAgreementChecked) {
      setNotice('请先勾选购买协议')
      return
    }

    setNotice('已提交门卡管理系统购买申请')
  }

  return (
    <div className="smart-hardware-detail-page">
      <section className="smart-hardware-detail-card">
        <header className="smart-hardware-breadcrumb" aria-label="购买详情路径">
          <span>路客商城/ </span>
          <strong>详情</strong>
        </header>

        <div className="smart-hardware-detail-form" aria-label="智能硬件购买详情">
          <div className="smart-hardware-detail-row">
            <span>购买时长</span>
            <label>
              <input type="radio" checked readOnly />
              一年
            </label>
          </div>
          <div className="smart-hardware-detail-row">
            <span>购买方</span>
            <strong>路客云6TS5</strong>
          </div>
          <div className="smart-hardware-detail-row smart-hardware-total-row">
            <span>总费用</span>
            <strong>¥ 800</strong>
          </div>
          <label className="smart-hardware-agreement">
            <input
              type="checkbox"
              aria-label="购买协议"
              checked={isAgreementChecked}
              onChange={(event) => setIsAgreementChecked(event.target.checked)}
            />
            <span>我已经阅读同意《路客云产品服务购买协议》</span>
          </label>
          <div className="smart-hardware-detail-actions">
            <button type="button" onClick={submitOrder}>
              立即购买
            </button>
          </div>
        </div>
      </section>

      <StatusNotice message={notice} />
    </div>
  )
}

function StatusNotice({ message }: { message: string }) {
  return (
    <div className="smart-hardware-status" role="status" aria-live="polite">
      {message}
    </div>
  )
}
