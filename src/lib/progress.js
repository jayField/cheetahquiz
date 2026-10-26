// 급수별 최고 점수는 이 브라우저에만 저장한다
const KEY = 'cheetahquiz-progress'

import { passScore } from './quiz.js'

export function loadProgress() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {}
  } catch {
    return {}
  }
}

export function saveResult(grade, score, total) {
  const progress = loadProgress()
  const prev = progress[grade]
  if (!prev || score > prev.best) {
    progress[grade] = { best: score, total }
    try {
      localStorage.setItem(KEY, JSON.stringify(progress))
    } catch {}
  }
  return progress
}

export function isPassed(progress, grade) {
  const record = progress[grade]
  return !!record && record.best >= passScore(record.total)
}

// 5급은 처음부터, 나머지는 한 단계 아래 급수에 합격하면 열린다
export function isUnlocked(progress, grade) {
  return grade === 5 || isPassed(progress, grade + 1)
}
