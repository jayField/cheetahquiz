// 문제 화면 가운데 원. 이모티콘이 길어지면 글자를 줄이고, 대화·문장은 둥근 카드로
const segmenter = typeof Intl !== 'undefined' && Intl.Segmenter ? new Intl.Segmenter('ko', { granularity: 'grapheme' }) : null

function countGraphemes(text) {
  return segmenter ? [...segmenter.segment(text)].length : [...text].length
}

function emojiSize(text) {
  const n = countGraphemes(text)
  if (n <= 2) return 78
  if (n === 3) return 60
  if (n === 4) return 48
  return 40
}

export default function EmojiStage({ text, kind = 'emoji' }) {
  // 빈칸: '🐆 ＿' 아래에 뜻
  if (kind === 'blank') {
    return (
      <div className="stage stage-card stage-blank">
        <span className="blank-line" aria-label="치타 더하기 빈칸">🐆 <span className="blank-slot">?</span></span>
        <span className="stage-text">= {text}</span>
      </div>
    )
  }

  if (kind === 'text') {
    return (
      <div className="stage stage-card">
        <span className="stage-text">{text}</span>
      </div>
    )
  }

  // 2급 대화: 'A 👋😊❓ · B 😊👍😋'
  if (text.startsWith('A ')) {
    const [a, b] = text.split(' · ').map((part) => part.slice(2))
    return (
      <div className="stage stage-card stage-dialog">
        <p className="bubble"><span className="speaker">A</span><span className="bubble-emoji">{a}</span></p>
        <p className="bubble bubble-b"><span className="speaker">B</span><span className="bubble-emoji">{b}</span></p>
      </div>
    )
  }

  return (
    <div className="stage stage-circle" style={{ fontSize: emojiSize(text) }}>
      <span>{text}</span>
    </div>
  )
}
