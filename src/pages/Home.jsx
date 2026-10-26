import { useNavigate } from 'react-router-dom'
import { GRADES } from '../data/words.js'
import { isPassed, isUnlocked, loadProgress } from '../lib/progress.js'
import ThemeToggle from '../components/ThemeToggle.jsx'
import { CheckIcon, LockIcon } from '../components/Icons.jsx'

const DICT_URL = 'https://cheetah.guide/dict'

export default function Home({ theme, onToggleTheme }) {
  const navigate = useNavigate()
  const progress = loadProgress()
  // 지금 도전할 급수: 열려 있으면서 아직 합격 못 한 가장 낮은 급수
  const current = GRADES.find((g) => isUnlocked(progress, g.grade) && !isPassed(progress, g.grade))?.grade

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
        {GRADES.map((g) => {
          const unlocked = isUnlocked(progress, g.grade)
          const passed = isPassed(progress, g.grade)
          const record = progress[g.grade]
          const primary = g.grade === current
          return (
            <li key={g.grade}>
              <button
                type="button"
                className={'grade-card' + (primary ? ' is-primary' : '')}
                disabled={!unlocked}
                onClick={() => navigate(`/quiz/${g.grade}`)}
              >
                <span className="grade-num">{g.grade}급</span>
                <span className="grade-body">
                  <span className="grade-title">{g.title}</span>
                  <span className="grade-desc">
                    {!unlocked ? `${g.grade + 1}급 합격 후 열려요` : passed ? `합격 · 최고 ${record.best}/${record.total}` : g.desc}
                  </span>
                </span>
                {!unlocked ? (
                  <LockIcon label="잠김" />
                ) : passed ? (
                  <CheckIcon label="합격" />
                ) : (
                  <span className="grade-go">도전 →</span>
                )}
              </button>
            </li>
          )
        })}
      </ul>

      <footer className="home-foot">
        <a href={DICT_URL}>치타어 사전 보기 →</a>
      </footer>
    </main>
  )
}
