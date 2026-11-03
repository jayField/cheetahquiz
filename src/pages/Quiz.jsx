import { useMemo, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { getGrade } from '../data/words.js'
import { PASS_POINTS, QUESTION_TYPES, buildQuiz, getSections, isWriteCorrect, isWriteType, passScore, toPoints } from '../lib/quiz.js'
import ThemeToggle from '../components/ThemeToggle.jsx'
import EmojiStage from '../components/EmojiStage.jsx'
import { BackIcon, CheckIcon, CrossIcon } from '../components/Icons.jsx'

// 문제 가운데 표시 방식
const STAGE_KIND = { choice: 'emoji', trap: 'emoji', blank: 'blank' }
// 보기가 이모티콘인 유형
const EMOJI_CHOICES = new Set(['blank', 'reverse'])

function pad(n) {
  return String(n).padStart(2, '0')
}

// 결과 화면에서 다음 급수로 넘어가면 시험 상태를 새로 시작
export default function QuizRoute(props) {
  const { grade } = useParams()
  return <Quiz key={grade} grade={Number(grade)} {...props} />
}

function Quiz({ grade, theme, onToggleTheme }) {
  const info = getGrade(grade)
  const [started, setStarted] = useState(false)
  const [round, setRound] = useState(0)
  const questions = useMemo(() => (info ? buildQuiz(info) : []), [info, round])
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState([])

  if (!info?.ready) return <Navigate to="/" replace />

  if (!started) {
    return <Intro grade={grade} info={info} onStart={() => setStarted(true)} theme={theme} onToggleTheme={onToggleTheme} />
  }

  const restart = () => {
    setRound((r) => r + 1)
    setIndex(0)
    setAnswers([])
  }

  if (index >= questions.length) {
    return <Result grade={grade} questions={questions} answers={answers} onRetry={restart} theme={theme} onToggleTheme={onToggleTheme} />
  }

  const q = questions[index]
  const answered = answers[index]

  const submit = (value) => {
    const correct = isWriteType(q.type) ? isWriteCorrect(value, q.answer) : value === q.answer
    setAnswers((a) => [...a, { value, correct }])
  }

  return (
    <main className="screen screen-quiz">
      <div className="topbar">
        <div className="topbar-left">
          <Link to="/" className="icon-btn" aria-label="처음으로">
            <BackIcon />
          </Link>
          <h1 className="quiz-title">치타어 {grade}급</h1>
        </div>
        <div className="topbar-right">
          <span className="count">
            <span className="visually-hidden">{QUESTION_TYPES[q.type].kind} 문제, 전체 {questions.length}문제 중 </span>
            {pad(index + 1)} / {pad(questions.length)}
          </span>
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </div>
      </div>

      <div className="progress" aria-hidden="true">
        <div className="progress-fill" style={{ width: `${((index + (answered ? 1 : 0)) / questions.length) * 100}%` }} />
      </div>

      <div className="question">
        <span className="section-chip">{QUESTION_TYPES[q.type].kind}</span>
        <span className="question-text">{QUESTION_TYPES[q.type].ask}</span>
        <EmojiStage text={q.prompt} kind={STAGE_KIND[q.type] || 'text'} />
      </div>

      {isWriteType(q.type) ? (
        <WriteAnswer key={q.id} question={q} answered={answered} onSubmit={submit} />
      ) : (
        <ChoiceAnswer key={q.id} question={q} answered={answered} onSubmit={submit} />
      )}

      <p className="visually-hidden" aria-live="polite">
        {answered && (answered.correct ? '정답이에요' : `아쉬워요. 정답은 ${q.answer}`)}
      </p>

      {answered && (
        <button type="button" className="btn btn-primary" onClick={() => setIndex((i) => i + 1)} autoFocus>
          {index + 1 === questions.length ? '결과 보기' : '다음 문제'}
        </button>
      )}
    </main>
  )
}

// 시작 전 안내: 문항 구성과 합격 기준
function Intro({ grade, info, onStart, theme, onToggleTheme }) {
  const sections = getSections(info)
  const total = sections.reduce((sum, s) => sum + s.count, 0)
  const perQuestion = 100 / total
  const kinds = ['객관식', '주관식']
    .map((kind) => [kind, sections.filter((s) => QUESTION_TYPES[s.type].kind === kind).reduce((sum, s) => sum + s.count, 0)])
    .filter(([, n]) => n > 0)

  return (
    <main className="screen">
      <div className="topbar">
        <div className="topbar-left">
          <Link to="/" className="icon-btn" aria-label="처음으로">
            <BackIcon />
          </Link>
          <h1 className="quiz-title">치타어 {grade}급</h1>
        </div>
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </div>

      <section className="intro-head">
        <div className="hero-mark" aria-hidden="true">🐆</div>
        <p className="intro-title">{info.title}</p>
        <p className="intro-sub">
          {kinds.map(([kind, n]) => `${kind} ${n}`).join(' · ')} · 총 {total}문항
          {Number.isInteger(perQuestion) && ` · 문항당 ${perQuestion}점`}
        </p>
      </section>

      <section className="intro-box">
        <h2 className="intro-h">문항 구성</h2>
        <ul className="intro-list">
          {sections.map((s) => (
            <li key={s.type}>
              <span className="section-chip">{QUESTION_TYPES[s.type].kind}</span>
              <span className="intro-count">{s.count}문항</span>
              <span className="intro-desc">{QUESTION_TYPES[s.type].desc}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="intro-box">
        <h2 className="intro-h">합격 기준</h2>
        <p className="intro-pass"><strong>{PASS_POINTS}점 이상</strong> 합격</p>
        <p className="intro-note">
          {total}문항 중 {passScore(total)}문항 이상 맞히면 합격이에요. 합격하면 인증서를 받을 수 있어요.
        </p>
      </section>

      <button type="button" className="btn btn-primary intro-start" onClick={onStart}>
        시작하기
      </button>
    </main>
  )
}

function ChoiceAnswer({ question, answered, onSubmit }) {
  const emojiChoices = EMOJI_CHOICES.has(question.type)
  return (
    <div className="choices">
      {question.choices.map((choice) => {
        let state = ''
        if (answered) {
          if (choice === question.answer) state = ' is-correct'
          else if (choice === answered.value) state = ' is-wrong'
          else state = ' is-dim'
        }
        return (
          <button
            key={choice}
            type="button"
            className={'choice' + (emojiChoices ? ' choice-emoji' : '') + state}
            disabled={!!answered}
            onClick={() => onSubmit(choice)}
          >
            <span>{choice}</span>
            {state === ' is-correct' && <CheckIcon label="정답" />}
            {state === ' is-wrong' && <CrossIcon label="내가 고른 오답" />}
          </button>
        )
      })}
    </div>
  )
}

function WriteAnswer({ question, answered, onSubmit }) {
  const [value, setValue] = useState('')
  const inputRef = useRef(null)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!value.trim()) {
      inputRef.current?.focus()
      return
    }
    onSubmit(value)
  }

  return (
    <form className="write" onSubmit={handleSubmit}>
      <label htmlFor="write-input" className="write-label">이모티콘으로 입력해요 · 정확히 같아야 정답</label>
      <div className={'write-field' + (answered ? (answered.correct ? ' is-correct' : ' is-wrong') : '')}>
        <span className="write-prefix" aria-hidden="true">🐆</span>
        <input
          id="write-input"
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={!!answered}
          autoComplete="off"
          autoCorrect="off"
          spellCheck="false"
          enterKeyHint="done"
          autoFocus
        />
        {answered && (answered.correct ? <CheckIcon label="정답" /> : <CrossIcon label="오답" />)}
      </div>
      {answered && !answered.correct && (
        <p className="write-answer">정답 <span className="write-answer-emoji">{question.answer}</span></p>
      )}
      {!answered && (
        <button type="submit" className="btn btn-primary">확인</button>
      )}
    </form>
  )
}

function Result({ grade, questions, answers, onRetry, theme, onToggleTheme }) {
  const navigate = useNavigate()
  const total = questions.length
  const score = answers.filter((a) => a.correct).length
  const points = toPoints(score, total)
  const passed = points >= PASS_POINTS

  const wrong = questions.filter((_, i) => !answers[i]?.correct)

  return (
    <main className="screen">
      <div className="topbar">
        <div className="topbar-left">
          <Link to="/" className="icon-btn" aria-label="처음으로">
            <BackIcon />
          </Link>
          <h1 className="quiz-title">치타어 {grade}급 결과</h1>
        </div>
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </div>

      <section className="result">
        <div className="result-mark" aria-hidden="true">{passed ? '🐆🏆' : '🐆😢'}</div>
        <p className="result-verdict">{passed ? (grade === 1 ? '치타어 마스터!' : '합격이에요!') : '아쉬워요'}</p>
        <p className="result-score">
          <strong>{points}점</strong>
        </p>
        <p className="result-need">{total}문항 중 {score}개 정답 · 합격 기준 {PASS_POINTS}점</p>
      </section>

      <div className="result-actions">
        {passed ? (
          <button type="button" className="btn btn-primary" onClick={() => navigate(`/certificate/${grade}`, { state: { points, date: new Date().toISOString() } })}>
            {grade}급 인증서 받기 →
          </button>
        ) : (
          <button type="button" className="btn btn-primary" onClick={onRetry}>
            다시 도전
          </button>
        )}
        {passed && (
          <button type="button" className="btn" onClick={onRetry}>
            {grade}급 다시 풀기
          </button>
        )}
      </div>

      {wrong.length > 0 && (
        <section className="review">
          <h2 className="review-title">틀린 문제 {wrong.length}개</h2>
          <ul className="review-list">
            {wrong.map((q) => (
              <li key={q.id}>
                <span className="review-emoji">{q.cheetah}</span>
                <span className="review-meaning">{q.meaning}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  )
}
