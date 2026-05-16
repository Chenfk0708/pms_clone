import { useState } from 'react'
import './SmartIdCardReaderPage.css'

const readerSteps = [
  {
    id: 'brand',
    title: '请选择读卡器品牌',
    body: '华视',
  },
  {
    id: 'plugin',
    title: '请下载插件（如已下载，可跳过）',
    body: 'PMS助手',
  },
  {
    id: 'debug',
    title: '请调试读卡',
  },
]

export function SmartIdCardReaderPage() {
  const [guestName, setGuestName] = useState('')
  const [idNumber, setIdNumber] = useState('')
  const [notice, setNotice] = useState('')

  function downloadAssistant() {
    setNotice('PMS助手下载已开始')
  }

  function readIdCard() {
    setGuestName('张张')
    setIdNumber('4403********1234')
    setNotice('已读取身份证信息')
  }

  function finishSetup() {
    if (!guestName || !idNumber) {
      setNotice('请先调试读卡')
      return
    }

    setNotice('身份证读卡器已完成对接')
  }

  return (
    <div className="smart-id-reader-page">
      <span className="smart-id-reader-version">版本号：v4.10.7</span>

      <section className="smart-id-reader-card" aria-label="身份证读卡器接入流程">
        <header className="smart-id-reader-head">
          <h1>
            <span aria-hidden="true" />
            身份证读卡器
          </h1>
          <p>接入身份证读卡器可自动录入房客信息，并快速查询房客相关订单</p>
        </header>

        <section className="smart-id-reader-flow" aria-labelledby="smart-id-reader-flow-title">
          <h2 id="smart-id-reader-flow-title">接入流程</h2>

          <div className="smart-id-reader-timeline">
            <article className="smart-id-reader-step">
              <span className="smart-id-reader-dot" aria-hidden="true" />
              <div className="smart-id-reader-step__body">
                <h3>{readerSteps[0].title}</h3>
                <button type="button" className="smart-id-reader-select" aria-label="读卡器品牌">
                  <span>{readerSteps[0].body}</span>
                  <i aria-hidden="true" />
                </button>
              </div>
            </article>

            <article className="smart-id-reader-step">
              <span className="smart-id-reader-dot" aria-hidden="true" />
              <div className="smart-id-reader-step__body">
                <h3>{readerSteps[1].title}</h3>
                <div className="smart-id-reader-download">
                  <span>{readerSteps[1].body}</span>
                  <button type="button" onClick={downloadAssistant}>
                    PMS助手下载
                  </button>
                </div>
              </div>
            </article>

            <article className="smart-id-reader-step smart-id-reader-step--debug">
              <span className="smart-id-reader-dot" aria-hidden="true" />
              <div className="smart-id-reader-step__body">
                <h3>{readerSteps[2].title}</h3>
                <div className="smart-id-reader-debug">
                  <label>
                    <span>名字</span>
                    <input aria-label="名字" value={guestName} readOnly placeholder="名字" />
                  </label>
                  <label>
                    <span>身份证号码</span>
                    <input aria-label="身份证号码" value={idNumber} readOnly placeholder="身份证号码" />
                  </label>
                  <button type="button" onClick={readIdCard}>
                    读身份证
                  </button>
                </div>
              </div>
            </article>
          </div>
        </section>
      </section>

      <footer className="smart-id-reader-footer">
        <button type="button" disabled={!guestName || !idNumber} onClick={finishSetup}>
          完成对接
        </button>
      </footer>

      <div className="smart-id-reader-status" role="status" aria-live="polite">
        {notice}
      </div>
    </div>
  )
}
