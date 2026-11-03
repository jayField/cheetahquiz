// 시험지 만들기와 채점
export const PASS_POINTS = 70

const CHOICE_COUNT = 4

// 테스트용: 급수마다 이 문항 수로 줄여서 낸다 (원래 문항 수로 되돌리려면 null)
export const TEST_TOTAL = null

// 문항 유형: 객관식/주관식 구분, 안내 문구, 문제 위 질문
export const QUESTION_TYPES = {
  choice: { kind: '객관식', desc: '치타어를 보고 뜻 고르기', ask: '이 치타어의 뜻은?' },
  trap: { kind: '객관식', desc: '비슷한 말 함정 · 같은 분류 보기 중 고르기', ask: '비슷한 말 주의! 이 치타어의 뜻은?' },
  blank: { kind: '객관식', desc: '빈칸에 들어갈 이모티콘 고르기', ask: '빈칸에 들어갈 이모티콘은?' },
  reverse: { kind: '객관식', desc: '뜻을 보고 치타어 고르기', ask: '이 뜻을 치타어로 쓰면?' },
  write: { kind: '주관식', desc: '뜻을 보고 이모티콘 직접 쓰기 · 정확히 같아야 정답', ask: '치타어로 써 보세요' },
  situation: { kind: '주관식', desc: '상황에 맞는 치타어 직접 쓰기 · 정확히 같아야 정답', ask: '이럴 때 치타는 뭐라고 할까요?' },
}

export function isWriteType(type) {
  return QUESTION_TYPES[type].kind === '주관식'
}

// 섹션 비율은 유지한 채 전체 문항 수를 맞춘다
export function getSections({ sections }) {
  const full = sections.reduce((sum, s) => sum + s.count, 0)
  if (!TEST_TOTAL || TEST_TOTAL >= full) return sections
  const scaled = sections.map((s) => ({ ...s, count: Math.round((s.count * TEST_TOTAL) / full) }))
  scaled[0].count += TEST_TOTAL - scaled.reduce((sum, s) => sum + s.count, 0)
  return scaled
}

// 100점 만점 환산
export function toPoints(score, total) {
  return Math.round((score / total) * 100)
}

// 합격에 필요한 최소 정답 수
export function passScore(total) {
  return Math.ceil((total * PASS_POINTS) / 100)
}

export function shuffle(list) {
  const a = [...list]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// 주관식 비교용: 키보드마다 붙었다 말았다 하는 변형 선택자(U+FE0F)와 공백은 무시
export function normalizeEmoji(text) {
  return text.replace(/[️\s]/g, '')
}

export function isWriteCorrect(input, answer) {
  const typed = normalizeEmoji(input)
  const full = normalizeEmoji(answer)
  // 앞의 🐆 는 입력칸에 이미 있으니 빼고 써도, 붙여 써도 정답
  return typed === full || '🐆' + typed === full
}

// 🐆😴 → 😴
function tail(cheetah) {
  return cheetah.replace(/^🐆/, '')
}

// 오답 보기 3개. sameCategory 면 같은 분류에서 먼저 뽑고, 모자라면 다른 분류로 채운다
function pickChoices(word, words, getValue, { sameCategory = false } = {}) {
  const others = shuffle(words.filter((w) => w[0] !== word[0] && w[1] !== word[1]))
  const ordered = sameCategory
    ? [...others.filter((w) => w[2] === word[2]), ...others.filter((w) => w[2] !== word[2])]
    : others
  const answer = getValue(word)
  const seen = new Set([answer])
  const wrong = []
  for (const w of ordered) {
    const value = getValue(w)
    if (seen.has(value)) continue
    seen.add(value)
    wrong.push(value)
    if (wrong.length === CHOICE_COUNT - 1) break
  }
  return shuffle([answer, ...wrong])
}

const meaningOf = (w) => w[1]
const cheetahOf = (w) => w[0]

function makeQuestion(type, word, words) {
  const [cheetah, meaning, , situation] = word
  const base = { type, cheetah, meaning }
  switch (type) {
    case 'choice':
      return { ...base, prompt: cheetah, answer: meaning, choices: pickChoices(word, words, meaningOf) }
    case 'trap':
      return { ...base, prompt: cheetah, answer: meaning, choices: pickChoices(word, words, meaningOf, { sameCategory: true }) }
    case 'blank':
      return { ...base, prompt: meaning, answer: tail(cheetah), choices: pickChoices(word, words, (w) => tail(w[0]), { sameCategory: true }) }
    case 'reverse':
      return { ...base, prompt: meaning, answer: cheetah, choices: pickChoices(word, words, cheetahOf) }
    case 'situation':
      return { ...base, prompt: situation, answer: cheetah }
    default:
      return { ...base, prompt: meaning, answer: cheetah }
  }
}

// 상황 문제는 상황 문장이 있는 단어만 낼 수 있다
const NEEDS = {
  situation: (w) => !!w[3],
}

// 한 시험 안에서는 같은 치타어가 두 번 나오지 않는다
export function buildQuiz(gradeInfo) {
  const { words } = gradeInfo
  const sections = getSections(gradeInfo)
  const pool = shuffle([...new Map(words.map((w) => [w[0], w])).values()])

  // 조건이 있는 섹션부터 단어를 가져가고, 출제 순서는 섹션 순서대로
  const picked = new Map()
  const order = [...sections].sort((a, b) => !!NEEDS[b.type] - !!NEEDS[a.type])
  for (const section of order) {
    const fits = NEEDS[section.type] || (() => true)
    const chosen = pool.filter(fits).slice(0, section.count)
    chosen.forEach((w) => pool.splice(pool.indexOf(w), 1))
    picked.set(section, chosen)
  }

  return sections
    .flatMap((section) => picked.get(section).map((word) => makeQuestion(section.type, word, words)))
    .map((q, id) => ({ ...q, id }))
}
