// 인증서를 캔버스에 다시 그려서 PNG 로 저장한다 (화면과 같은 테마 색)
const W = 1080
const H = 1520
const PHOTO_SRC = '/cheetah-cub.png'

// 사진 속 얼굴 중심 (원본 305×253 기준). 화면과 다운로드 이미지가 같은 영역을 잘라 쓴다
const PHOTO = { w: 305, h: 253 }
const FACE = { x: 122, y: 120, zoom: 1.0 }

// 원 안에 들어갈 정사각형 영역 (원본 픽셀)
export function faceCrop() {
  const side = Math.min(PHOTO.w, PHOTO.h) / FACE.zoom
  const sx = Math.min(Math.max(FACE.x - side / 2, 0), PHOTO.w - side)
  const sy = Math.min(Math.max(FACE.y - side / 2, 0), PHOTO.h - side)
  return { sx, sy, side }
}

// 화면용: 같은 영역이 원을 꽉 채우도록 img 를 키우고 옮긴다
export function faceCropStyle() {
  const { sx, sy, side } = faceCrop()
  const pct = (n) => `${(n / side) * 100}%`
  return { width: pct(PHOTO.w), height: pct(PHOTO.h), left: pct(-sx), top: pct(-sy) }
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function readColors(el) {
  const css = getComputedStyle(el)
  const v = (name) => css.getPropertyValue(name).trim()
  return {
    card: v('--card'),
    gold: v('--gold'),
    ring: v('--ring'),
    title: v('--title'),
    text: v('--text'),
    text2: v('--text-2'),
    muted: v('--muted'),
    line: v('--line'),
  }
}

function spaced(ctx, px) {
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${px}px`
}

function drawPhoto(ctx, img, cx, cy, r) {
  const { sx, sy, side } = faceCrop()
  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.clip()
  ctx.drawImage(img, sx, sy, side, side, cx - r, cy - r, r * 2, r * 2)
  ctx.restore()
}

function drawSeal(ctx, cx, cy, c) {
  const s = 2.4
  ctx.strokeStyle = c.gold
  ctx.lineWidth = 2 * s
  ctx.beginPath()
  ctx.arc(cx, cy, 27 * s, 0, Math.PI * 2)
  ctx.stroke()
  ctx.fillStyle = c.gold
  ctx.beginPath()
  ctx.arc(cx, cy, 21 * s, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = c.card
  for (const [x, y, r] of [[23, 25, 2.4], [34, 21, 2], [38, 32, 2.6], [26, 37, 2.2], [31, 30, 1.6]]) {
    ctx.beginPath()
    ctx.arc(cx + (x - 30) * s, cy + (y - 30) * s, r * s, 0, Math.PI * 2)
    ctx.fill()
  }
}

export async function downloadCertificate(el, { grade, name, body, score, date }) {
  await Promise.all([
    document.fonts.load('120px "Do Hyeon"'),
    document.fonts.load('700 54px "Noto Sans KR"'),
    document.fonts.load('400 38px "Noto Sans KR"'),
  ])
  const img = await loadImage(PHOTO_SRC)
  const c = readColors(el)

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  const display = '"Do Hyeon", sans-serif'
  const sans = '"Noto Sans KR", sans-serif'

  ctx.fillStyle = c.card
  ctx.fillRect(0, 0, W, H)

  // 이중 금테 + 안쪽 가는 테
  ctx.strokeStyle = c.gold
  ctx.lineWidth = 4
  ctx.strokeRect(18, 18, W - 36, H - 36)
  ctx.strokeRect(34, 34, W - 68, H - 68)
  ctx.lineWidth = 3
  ctx.strokeRect(60, 60, W - 120, H - 120)

  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'

  ctx.fillStyle = c.text2
  ctx.font = `400 34px ${sans}`
  spaced(ctx, 12)
  ctx.fillText('치타 가이드 공인', W / 2 + 6, 165)
  spaced(ctx, 0)

  // 사진: 금색 바깥 테, 여백, 안쪽 테
  const cx = W / 2
  const cy = 440
  const r = 240
  ctx.strokeStyle = c.gold
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.arc(cx, cy, r + 21, 0, Math.PI * 2)
  ctx.stroke()
  drawPhoto(ctx, img, cx, cy, r)
  ctx.strokeStyle = c.ring
  ctx.lineWidth = 9
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.stroke()

  ctx.fillStyle = c.title
  ctx.font = `120px ${display}`
  ctx.fillText(`치타어 ${grade}급`, W / 2, 850)

  ctx.fillStyle = c.text2
  ctx.font = `60px ${display}`
  spaced(ctx, 18)
  ctx.fillText('인증서', W / 2 + 9, 935)
  spaced(ctx, 0)

  ctx.fillStyle = c.text
  ctx.font = `700 54px ${sans}`
  const nameText = `${name} 님`
  ctx.fillText(nameText, W / 2, 1060)
  const nameW = ctx.measureText(nameText).width + 72
  ctx.strokeStyle = c.line
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(W / 2 - nameW / 2, 1085)
  ctx.lineTo(W / 2 + nameW / 2, 1085)
  ctx.stroke()

  ctx.fillStyle = c.text2
  ctx.font = `400 38px ${sans}`
  body.forEach((line, i) => ctx.fillText(line, W / 2, 1160 + i * 60))

  // 점수 · 합격일
  ctx.font = `400 38px ${sans}`
  const parts = [
    ['점수', score],
    ['합격일', date],
  ]
  ctx.textAlign = 'left'
  const gap = 66
  const widths = parts.map(([k, v]) => {
    ctx.font = `400 38px ${sans}`
    const kw = ctx.measureText(k).width
    ctx.font = `700 38px ${sans}`
    return kw + 18 + ctx.measureText(v).width
  })
  let x = W / 2 - (widths[0] + widths[1] + gap) / 2
  parts.forEach(([k, v], i) => {
    ctx.font = `400 38px ${sans}`
    ctx.fillStyle = c.muted
    ctx.fillText(k, x, 1290)
    const kw = ctx.measureText(k).width
    ctx.font = `700 38px ${sans}`
    ctx.fillStyle = c.text
    ctx.fillText(v, x + kw + 18, 1290)
    x += widths[i] + gap
  })

  drawSeal(ctx, W / 2, 1382, c)

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `치타어-${grade}급-인증서.png`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
