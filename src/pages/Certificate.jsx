import { useRef, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { getGrade } from '../data/words.js'
import ThemeToggle from '../components/ThemeToggle.jsx'
import { BackIcon } from '../components/Icons.jsx'
import { downloadCertificate, faceCropStyle } from '../lib/certificateImage.js'

function formatDate(iso) {
  const d = iso ? new Date(iso) : new Date()
  return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.`
}

// 받침 유무로 을/를 고르기
function eulReul(word) {
  const code = word.charCodeAt(word.length - 1) - 0xac00
  return code >= 0 && code <= 11171 && code % 28 ? '을' : '를'
}

// 치타 무늬 인장
function Seal() {
  return (
    <svg className="cert-seal" role="img" aria-label="치타 인장" width="64" height="64" viewBox="0 0 60 60">
      <circle cx="30" cy="30" r="27" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="30" cy="30" r="21" fill="currentColor" />
      <g className="cert-seal-spots">
        <circle cx="23" cy="25" r="2.4" />
        <circle cx="34" cy="21" r="2" />
        <circle cx="38" cy="32" r="2.6" />
        <circle cx="26" cy="37" r="2.2" />
        <circle cx="31" cy="30" r="1.6" />
      </g>
    </svg>
  )
}

export default function Certificate({ theme, onToggleTheme }) {
  const grade = Number(useParams().grade)
  const navigate = useNavigate()
  const info = getGrade(grade)
  // 방금 본 시험 결과는 결과 화면에서 넘겨받는다 (따로 저장하지 않음)
  const result = useLocation().state
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const certRef = useRef(null)

  if (!info?.ready || !result) return <Navigate to="/" replace />

  const next = getGrade(grade - 1)?.ready ? grade - 1 : null

  const displayName = name.trim() || '이름 없는 치타'
  const body = [
    `위 사람은 치타어 능력시험 ${grade}급에 합격하여`,
    `${info.title}${eulReul(info.title)} 알아듣는 치타 친구임을 인증합니다.`,
  ]
  const score = `${result.points}점`
  const date = formatDate(result.date)

  const download = async () => {
    setSaving(true)
    try {
      await downloadCertificate(certRef.current, { grade, name: displayName, body, score, date })
    } finally {
      setSaving(false)
    }
  }


  return (
    <main className="screen">
      <div className="topbar">
        <div className="topbar-left">
          <Link to="/" className="icon-btn" aria-label="처음으로">
            <BackIcon />
          </Link>
          <h1 className="quiz-title">{grade}급 인증서</h1>
        </div>
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </div>

      <article ref={certRef} className="cert" aria-label={`치타어 ${grade}급 인증서`}>
        <div className="cert-inner">
          <p className="cert-org">치타 가이드 공인</p>
          <div className="cert-photo">
            <img src="/cheetah-cub.png" alt="아기 치타" style={faceCropStyle()} />
          </div>
          <p className="cert-grade">치타어 {grade}급</p>
          <p className="cert-kind">인 증 서</p>

          <p className="cert-name">{displayName} 님</p>
          <p className="cert-body">
            {body[0]}
            <br />
            {body[1]}
          </p>

          <dl className="cert-meta">
            <div>
              <dt>점수</dt>
              <dd>{score}</dd>
            </div>
            <div>
              <dt>합격일</dt>
              <dd>{date}</dd>
            </div>
          </dl>

          <Seal />
        </div>
      </article>

      <div className="cert-name-field">
        <label htmlFor="cert-name">인증서에 넣을 이름</label>
        <input id="cert-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={12} placeholder="이름을 적어 주세요" autoComplete="nickname" />
      </div>

      <div className="result-actions">
        <button type="button" className="btn btn-primary" onClick={download} disabled={saving}>
          {saving ? '이미지 만드는 중…' : '인증서 다운로드'}
        </button>
        {next && (
          <button type="button" className="btn" onClick={() => navigate(`/quiz/${next}`)}>
            {next}급 도전 →
          </button>
        )}
        <Link to="/" className="btn btn-link">처음으로</Link>
      </div>
    </main>
  )
}
