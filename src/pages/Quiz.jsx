import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { getGrade } from '../data/words.js'
import { buildQuiz, isWriteCorrect, passScore } from '../lib/quiz.js'
import { isUnlocked, loadProgress, saveResult } from '../lib/progress.js'
import ThemeToggle from '../components/ThemeToggle.jsx'
import EmojiStage from '../components/EmojiStage.jsx'
import { BackIcon, CheckIcon, CrossIcon } from '../components/Icons.jsx'

const SECTION_LABEL = { choice: '객관식', reverse: '객관식', write: '주관식' }
const QUESTION_TEXT = {
  choice: '이 치타어의 뜻은?',
  reverse: '이 뜻을 치타어로 쓰면?',
  write: '치타어로 써 보세요',
}

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
  const [round, setRound] = useState(0)
  const questions = useMemo(() => (info ? buildQuiz(info) : []), [info, round])
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState([])

  if (!info || !isUnlocked(loadProgress(), grade)) return <Navigate to="/" replace />

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
    const correct = q.type === 'write' ? isWriteCorrect(value, q.answer) : value === q.answer
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
            <span className="visually-hidden">{SECTION_LABEL[q.type]} 문제, 전체 {questions.length}문제 중 </span>
            {pad(index + 1)} / {pad(questions.length)}
          </span>
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </div>
      </div>

      <div className="progress" aria-hidden="true">
        <div className="progress-fill" style={{ width: `${((index + (answered ? 1 : 0)) / questions.length) * 100}%` }} />
      </div>

      <div className="question">
        <span className="section-chip">{SECTION_LABEL[q.type]}</span>
        <span className="question-text">{QUESTION_TEXT[q.type]}</span>
        <EmojiStage text={q.prompt} kind={q.type === 'choice' ? 'emoji' : 'text'} />
      </div>

      {q.type === 'write' ? (
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

function ChoiceAnswer({ question, answered, onSubmit }) {
  const emojiChoices = question.type === 'reverse'
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
  const need = passScore(total)
  const passed = score >= need

  useEffect(() => {
    saveResult(grade, score, total)
  }, [grade, score, total])

  const next = grade > 1 ? grade - 1 : null
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
          <strong>{score}</strong> / {total}
        </p>
        <p className="result-need">합격 기준 {need}문제</p>
      </section>

      <div className="result-actions">
        {passed && next ? (
          <button type="button" className="btn btn-primary" onClick={() => navigate(`/quiz/${next}`)}>
            {next}급 도전 →
          </button>
        ) : (
          <button type="button" className="btn btn-primary" onClick={onRetry}>
            다시 도전
          </button>
        )}
        {passed && next && (
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
