import { useNavigate } from 'react-router-dom'
import { GRADES } from '../data/words.js'
import ThemeToggle from '../components/ThemeToggle.jsx'
import { LockIcon } from '../components/Icons.jsx'

const DICT_URL = 'https://cheetah.guide/dict'

export default function Home({ theme, onToggleTheme }) {
  const navigate = useNavigate()

  return (
    <main className="screen">
      <div className="topbar">
        <a className="brand" href="https://cheetah.guide">치타 가이드</a>
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </div>

      <section className="hero">
        <div className="hero-mark" aria-hidden="true">🐆</div>
        <h1 className="hero-title">치타어 능력시험</h1>
        <p className="hero-lede">치타 말을 얼마나 알아들을 수 있나요?<br />5급부터 차근차근 도전해 보세요.</p>
      </section>

      <ul className="grade-list">
        {GRADES.map((g) => (
          <li key={g.grade}>
            <button
              type="button"
              className={'grade-card' + (g.ready ? ' is-primary' : '')}
              disabled={!g.ready}
              onClick={() => navigate(`/quiz/${g.grade}`)}
            >
              <span className="grade-num">{g.grade}급</span>
              <span className="grade-body">
                <span className="grade-title">{g.title}</span>
                {!g.ready && <span className="grade-desc">준비 중이에요</span>}
              </span>
              {g.ready ? <span className="grade-go">도전 →</span> : <LockIcon label="잠김" />}
            </button>
          </li>
        ))}
      </ul>

      <footer className="home-foot">
        <a href={DICT_URL}>치타어 사전 보기 →</a>
      </footer>
    </main>
  )
}
