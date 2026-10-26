// 시험지 만들기와 채점
export const PASS_RATE = 0.7

const CHOICE_COUNT = 4

export function passScore(total) {
  return Math.ceil(total * PASS_RATE)
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

function pickChoices(word, words, field) {
  const others = shuffle(
    words.filter((w) => w[0] !== word[0] && w[1] !== word[1]),
  )
  const seen = new Set([word[field]])
  const wrong = []
  for (const w of others) {
    if (seen.has(w[field])) continue
    seen.add(w[field])
    wrong.push(w[field])
    if (wrong.length === CHOICE_COUNT - 1) break
  }
  return shuffle([word[field], ...wrong])
}

// 한 시험 안에서는 같은 치타어가 두 번 나오지 않는다
export function buildQuiz(gradeInfo) {
  const { words, sections } = gradeInfo
  const unique = [...new Map(words.map((w) => [w[0], w])).values()]
  const pool = shuffle(unique)
  const questions = []

  for (const section of sections) {
    const picked = pool.splice(0, section.count)
    for (const word of picked) {
      const [cheetah, meaning] = word
      const base = { id: questions.length, type: section.type, cheetah, meaning }
      if (section.type === 'choice') {
        questions.push({ ...base, prompt: cheetah, answer: meaning, choices: pickChoices(word, words, 1) })
      } else if (section.type === 'reverse') {
        questions.push({ ...base, prompt: meaning, answer: cheetah, choices: pickChoices(word, words, 0) })
      } else {
        questions.push({ ...base, prompt: meaning, answer: cheetah })
      }
    }
  }
  return questions
}
