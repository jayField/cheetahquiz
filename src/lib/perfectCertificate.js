// 100점 만점 인증서: 화면과 다운로드 이미지가 같은 캔버스 그림을 쓴다 (테마와 상관없이 금빛 다크)
const W = 1080
const H = 1520
const PHOTO_SRC = '/cheetah-cub-perfect.jpg'
// 원 안에 들어갈 정사각형 영역 (원본 884×884 기준)
const CROP = { sx: 175, sy: 180, side: 520 }
// 사진 중심
const CX = 540
const CY = 470

const display = '"Do Hyeon", sans-serif'
const sans = '"Noto Sans KR", sans-serif'

const GOLD = [[0, '#FFF8D6'], [0.45, '#F2C866'], [1, '#A86F14']]
const GOLD_TEXT = [[0, '#FFF8D6'], [0.3, '#FFE08A'], [0.55, '#E0A93C'], [0.72, '#FFF0B0'], [1, '#C38A24']]
const LEAF = [[0, '#FFF6C8'], [0.45, '#EBB94E'], [1, '#9A6412']]
const RUBY = [[0, '#FF9A9A'], [0.5, '#D42A2A'], [1, '#6E0A0A']]
const FOIL = ['#FFF3C4', '#D9A23A', '#FFE9A0', '#A86F14', '#FFE08A', '#B47A1C', '#FFF3C4']
const FADE = 'rgba(255, 224, 138, 0)'

const even = (colors) => colors.map((c, i) => [i / (colors.length - 1), c])
const rad = (deg) => (deg * Math.PI) / 180

function linear(ctx, x0, y0, x1, y1, stops) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1)
  stops.forEach(([at, color]) => g.addColorStop(at, color))
  return g
}

function radial(ctx, x, y, r, stops) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r)
  stops.forEach(([at, color]) => g.addColorStop(at, color))
  return g
}

function conic(ctx, start, colors) {
  const g = ctx.createConicGradient(start, CX, CY)
  even(colors).forEach(([at, color]) => g.addColorStop(at, color))
  return g
}

function circle(ctx, x, y, r) {
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
}

function polygon(ctx, points) {
  ctx.beginPath()
  points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)))
  ctx.closePath()
}

function spaced(ctx, px) {
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${px}px`
}

function shadow(ctx, color, blur, offsetY = 0) {
  ctx.shadowColor = color
  ctx.shadowBlur = blur
  ctx.shadowOffsetY = offsetY
}

let photo
function loadPhoto() {
  photo ??= new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = (e) => {
      photo = null
      reject(e)
    }
    img.src = PHOTO_SRC
  })
  return photo
}

function drawBackground(ctx) {
  ctx.fillStyle = radial(ctx, CX, 486, 1180, [[0, '#4A3018'], [0.45, '#2A1A0D'], [1, '#150D06']])
  ctx.fillRect(0, 0, W, H)

  // 금사 격자 무늬
  ctx.save()
  ctx.globalAlpha = 0.07
  ctx.strokeStyle = '#FFD98A'
  ctx.lineWidth = 2
  for (let c = -H; c < W + H; c += 46 * Math.SQRT2) {
    ctx.beginPath()
    ctx.moveTo(c, 0)
    ctx.lineTo(c + H, H)
    ctx.moveTo(c + H, 0)
    ctx.lineTo(c, H)
    ctx.stroke()
  }
  ctx.restore()

  ctx.fillStyle = radial(ctx, CX, CY, 425, [[0, 'rgba(255, 200, 90, .45)'], [1, 'rgba(255, 200, 90, 0)']])
  ctx.fillRect(0, 0, W, H)
  ctx.save()
  ctx.translate(CX, 942)
  ctx.scale(490 / 210, 1)
  ctx.fillStyle = radial(ctx, 0, 0, 210, [[0, 'rgba(255, 170, 60, .12)'], [1, 'rgba(255, 170, 60, 0)']])
  circle(ctx, 0, 0, 210)
  ctx.fill()
  ctx.restore()
}

// 사진 뒤 빛줄기: 부채꼴을 그린 뒤 가운데만 남기고 흐리게 지운다
function drawRays(ctx) {
  const layer = document.createElement('canvas')
  layer.width = W
  layer.height = H
  const l = layer.getContext('2d')
  l.fillStyle = 'rgba(255, 214, 120, .26)'
  for (let deg = 3; deg < 363; deg += 12) {
    l.beginPath()
    l.moveTo(CX, CY)
    l.arc(CX, CY, 700, rad(deg - 90), rad(deg - 85))
    l.closePath()
    l.fill()
  }
  l.globalCompositeOperation = 'destination-in'
  l.fillStyle = radial(l, CX, CY, 492, [[0, '#000'], [0.28, '#000'], [1, 'rgba(0, 0, 0, 0)']])
  l.fillRect(0, 0, W, H)
  ctx.drawImage(layer, 0, 0)
}

function sparkle(ctx, x, y, r) {
  const k = r * 0.14
  ctx.save()
  shadow(ctx, '#FFC861', r * 0.5)
  ctx.fillStyle = '#FFF1C2'
  ctx.beginPath()
  ctx.moveTo(x, y - r)
  ctx.quadraticCurveTo(x + k, y - k, x + r, y)
  ctx.quadraticCurveTo(x + k, y + k, x, y + r)
  ctx.quadraticCurveTo(x - k, y + k, x - r, y)
  ctx.quadraticCurveTo(x - k, y - k, x, y - r)
  ctx.fill()
  ctx.restore()
}

// 금가루, 빛망울, 반짝이 (글자 영역은 비워 둔다)
function drawDust(ctx) {
  let seed = 5
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647
  const inText = (x, y, top) => x > 130 && x < 950 && y > top && y < 1350

  ctx.save()
  ctx.fillStyle = '#FFE7A6'
  for (let i = 0; i < 220; i++) {
    const x = 60 + rnd() * 960
    const y = 60 + rnd() * 1400
    if (inText(x, y, 800)) continue
    const r = 0.8 + rnd() * 2
    ctx.globalAlpha = 0.2 + rnd() * 0.6
    circle(ctx, x, y, r)
    ctx.fill()
  }
  for (let i = 0; i < 18; i++) {
    const x = 80 + rnd() * 920
    const y = 80 + rnd() * 1360
    if (inText(x, y, 780)) continue
    const r = 10 + rnd() * 22
    const alpha = 0.08 + rnd() * 0.12
    const blur = 3 + rnd() * 5
    ctx.globalAlpha = 1
    ctx.fillStyle = radial(ctx, x, y, r + blur, [[0, `rgba(255, 200, 97, ${alpha})`], [r / (r + blur), `rgba(255, 200, 97, ${alpha * 0.7})`], [1, 'rgba(255, 200, 97, 0)']])
    circle(ctx, x, y, r + blur)
    ctx.fill()
  }
  ctx.restore()

  for (const [x, y, r] of [[160, 220, 24], [920, 230, 28], [120, 560, 18], [960, 600, 22], [150, 800, 16], [930, 820, 18], [250, 380, 10], [830, 390, 12], [140, 1080, 14], [940, 1100, 16]]) {
    sparkle(ctx, x, y, r)
  }
}

function ruby(ctx, points) {
  const xs = points.map((p) => p[0])
  const ys = points.map((p) => p[1])
  polygon(ctx, points)
  ctx.fillStyle = linear(ctx, Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys), RUBY)
  ctx.fill()
  ctx.strokeStyle = '#FFE0E0'
  ctx.lineWidth = 1.2
  ctx.stroke()
}

// 모서리 넝쿨 장식 (왼쪽 위 기준 170×170)
const CORNER_LINES = [
  ['M8 160 L8 8 L160 8', 5],
  ['M24 150 L24 24 L150 24', 2],
  ['M24 80 C 50 80, 60 60, 48 48 C 36 36, 60 30, 80 24', 3],
  ['M60 24 C 70 40, 90 40, 100 30', 2.5],
  ['M24 60 C 40 70, 40 90, 30 100', 2.5],
]

function drawCorner(ctx, x, y, sx, sy) {
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(sx, sy)
  const gold = linear(ctx, 0, 8, 0, 160, GOLD)
  ctx.strokeStyle = gold
  ctx.lineCap = 'round'
  for (const [d, width] of CORNER_LINES) {
    ctx.lineWidth = width
    ctx.stroke(new Path2D(d))
  }
  ctx.fillStyle = gold
  for (const [cx, cy] of [[160, 8], [8, 160]]) {
    circle(ctx, cx, cy, 5)
    ctx.fill()
  }
  circle(ctx, 24, 24, 16)
  ctx.fillStyle = linear(ctx, 0, 8, 0, 40, GOLD)
  ctx.fill()
  ctx.strokeStyle = '#6E4410'
  ctx.lineWidth = 2
  ctx.stroke()
  ruby(ctx, [[24, 12], [34, 24], [24, 36], [14, 24]])
  ctx.restore()
}

function drawFrame(ctx) {
  ctx.strokeStyle = linear(ctx, 18, 18, W - 18, H - 18, even(FOIL))
  ctx.lineWidth = 12
  ctx.strokeRect(24, 24, W - 48, H - 48)
  ctx.strokeStyle = 'rgba(255, 224, 138, .8)'
  ctx.lineWidth = 2
  ctx.strokeRect(41, 41, W - 82, H - 82)
  ctx.strokeStyle = 'rgba(255, 224, 138, .4)'
  ctx.lineWidth = 1
  ctx.strokeRect(50.5, 50.5, W - 101, H - 101)

  drawCorner(ctx, 34, 34, 1, 1)
  drawCorner(ctx, W - 34, 34, -1, 1)
  drawCorner(ctx, 34, H - 34, 1, -1)
  drawCorner(ctx, W - 34, H - 34, -1, -1)
}

function drawLeaf(ctx, x, y, angle, len, w) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(angle)
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.quadraticCurveTo(len * 0.5, -w, len, 0)
  ctx.quadraticCurveTo(len * 0.5, w, 0, 0)
  ctx.fillStyle = linear(ctx, 0, -w / 2, len, w / 2, LEAF)
  ctx.fill()
  ctx.strokeStyle = '#7A4E0E'
  ctx.lineWidth = 1
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(2, 0)
  ctx.lineTo(len * 0.85, 0)
  ctx.strokeStyle = '#9A6412'
  ctx.lineWidth = 1.2
  ctx.stroke()
  ctx.restore()
}

// 월계관: 사진 아래에서 시작해 양옆으로 올라가는 두 가지
function drawLaurel(ctx) {
  const r = 268
  const at = (t, side) => [CX + side * r * Math.sin(rad(t)), CY + r * Math.cos(rad(t))]
  ctx.save()
  shadow(ctx, 'rgba(0, 0, 0, .5)', 4, 3)
  for (const side of [-1, 1]) {
    ctx.beginPath()
    for (let t = 18; t <= 150; t += 4) ctx.lineTo(...at(t, side))
    ctx.strokeStyle = linear(ctx, 0, CY - r, 0, CY + r, GOLD)
    ctx.lineWidth = 5
    ctx.lineCap = 'round'
    ctx.stroke()

    for (let i = 0, t = 22; t <= 148; t += 9, i++) {
      const [x, y] = at(t, side)
      // 가지가 위로 뻗는 방향에서 양쪽으로 잎이 난다
      const dir = Math.atan2(-Math.sin(rad(t)), side * Math.cos(rad(t)))
      const len = 76 - (t / 148) * 22
      drawLeaf(ctx, x, y, dir - rad(38), len, 17)
      drawLeaf(ctx, x, y, dir + rad(38), len, 17)
      if (i % 3 === 1) {
        circle(ctx, x + side * 10, y - 4, 6)
        ctx.fillStyle = linear(ctx, x + side * 10 - 6, y - 10, x + side * 10 + 6, y + 2, RUBY)
        ctx.fill()
        ctx.strokeStyle = '#FFE0E0'
        ctx.lineWidth = 1
        ctx.stroke()
      }
    }
  }
  ctx.restore()
}

// 사진: 금 링 → 짙은 틈 → 금 링
function drawPhoto(ctx, img) {
  ctx.fillStyle = radial(ctx, CX, CY, 300, [[0.66, 'rgba(255, 200, 90, .45)'], [1, 'rgba(255, 200, 90, 0)']])
  circle(ctx, CX, CY, 300)
  ctx.fill()

  ctx.fillStyle = conic(ctx, -Math.PI / 2, FOIL)
  circle(ctx, CX, CY, 228)
  ctx.fill()
  ctx.fillStyle = '#2A1A0D'
  circle(ctx, CX, CY, 218)
  ctx.fill()
  ctx.fillStyle = conic(ctx, 0, ['#FFE08A', '#A86F14', '#FFF3C4', '#C8902C', '#FFE08A'])
  circle(ctx, CX, CY, 210)
  ctx.fill()

  const r = 201
  ctx.save()
  circle(ctx, CX, CY, r)
  ctx.clip()
  ctx.drawImage(img, CROP.sx, CROP.sy, CROP.side, CROP.side, CX - r, CY - r, r * 2, r * 2)
  ctx.restore()
}

// 리본 배너 (720×140, 왼쪽 위 기준)
function drawBanner(ctx) {
  ctx.save()
  ctx.translate(180, 664)
  shadow(ctx, 'rgba(0, 0, 0, .45)', 10, 8)

  const tail = linear(ctx, 0, 46, 0, 124, [[0, '#9A1A1A'], [1, '#5E0C0C']])
  for (const points of [
    [[0, 46], [100, 46], [100, 124], [0, 124], [34, 85]],
    [[720, 46], [620, 46], [620, 124], [720, 124], [686, 85]],
  ]) {
    polygon(ctx, points)
    ctx.fillStyle = tail
    ctx.fill()
    ctx.strokeStyle = '#E9BE5C'
    ctx.lineWidth = 2
    ctx.stroke()
  }
  ctx.fillStyle = '#3E0606'
  polygon(ctx, [[100, 124], [132, 138], [132, 108]])
  ctx.fill()
  polygon(ctx, [[620, 124], [588, 138], [588, 108]])
  ctx.fill()

  ctx.beginPath()
  ctx.roundRect(100, 16, 520, 108, 6)
  ctx.fillStyle = linear(ctx, 0, 16, 0, 124, [[0, '#E04848'], [1, '#9A1A1A']])
  ctx.fill()
  ctx.strokeStyle = linear(ctx, 0, 16, 0, 124, GOLD)
  ctx.lineWidth = 5
  ctx.stroke()

  ctx.beginPath()
  ctx.roundRect(114, 28, 492, 84, 3)
  ctx.setLineDash([8, 6])
  ctx.strokeStyle = 'rgba(255, 224, 138, .55)'
  ctx.lineWidth = 2
  ctx.stroke()
  ctx.setLineDash([])

  ctx.fillStyle = '#FFE7A6'
  ctx.font = `58px ${display}`
  ctx.textAlign = 'center'
  spaced(ctx, 3)
  ctx.fillText('★ 100점 만점 ★', 360 + 1.5, 90)
  ctx.restore()
}

// 글자 양옆의 금선
function sideLines(ctx, x0, x1, y, len, gap) {
  ctx.fillStyle = linear(ctx, x0 - gap - len, 0, x0 - gap, 0, [[0, FADE], [1, '#FFE08A']])
  ctx.fillRect(x0 - gap - len, y - 1, len, 2)
  ctx.fillStyle = linear(ctx, x1 + gap, 0, x1 + gap + len, 0, [[0, '#FFE08A'], [1, FADE]])
  ctx.fillRect(x1 + gap, y - 1, len, 2)
}

// 가운데 정렬로 쓰고, 글자 폭(자간 포함)을 돌려준다
function centered(ctx, text, y, px) {
  spaced(ctx, px)
  const w = ctx.measureText(text).width
  ctx.textAlign = 'left'
  ctx.fillText(text, W / 2 - w / 2 + px / 2, y)
  spaced(ctx, 0)
  return w - px
}

// [글자, 굵게?] 조각들을 한 줄로 가운데 정렬
function runs(ctx, parts, y, px, color, strong) {
  const font = (bold) => `${bold ? 700 : 400} ${px}px ${sans}`
  const widths = parts.map(([text, bold]) => {
    ctx.font = font(bold)
    return ctx.measureText(text).width
  })
  let x = W / 2 - widths.reduce((a, b) => a + b, 0) / 2
  ctx.textAlign = 'left'
  parts.forEach(([text, bold], i) => {
    ctx.font = font(bold)
    ctx.fillStyle = bold ? strong : color
    ctx.fillText(text, x, y)
    x += widths[i]
  })
}

function star(ctx, x, y, R) {
  const points = Array.from({ length: 10 }, (_, i) => {
    const r = i % 2 ? R * 0.45 : R
    const a = -Math.PI / 2 + (i * Math.PI) / 5
    return [x + r * Math.cos(a), y + r * Math.sin(a)]
  })
  polygon(ctx, points)
  ctx.fillStyle = linear(ctx, 0, y - R, 0, y + R * 0.81, GOLD)
  ctx.fill()
  ctx.strokeStyle = '#7A4E0E'
  ctx.lineWidth = 1.5
  ctx.lineJoin = 'round'
  ctx.stroke()
}

function drawText(ctx, { grade, name, body, score, date }) {
  ctx.textBaseline = 'middle'

  ctx.fillStyle = '#F2D9A6'
  ctx.font = `700 30px ${sans}`
  const orgW = centered(ctx, '치타 가이드 공인', 114, 16)
  ctx.fillStyle = linear(ctx, W / 2 - orgW / 2 - 102, 0, W / 2 - orgW / 2 - 22, 0, [[0, FADE], [0.5, '#FFE08A'], [1, FADE]])
  ctx.fillRect(W / 2 - orgW / 2 - 102, 113, 80, 2)
  ctx.fillStyle = linear(ctx, W / 2 + orgW / 2 + 22, 0, W / 2 + orgW / 2 + 102, 0, [[0, FADE], [0.5, '#FFE08A'], [1, FADE]])
  ctx.fillRect(W / 2 + orgW / 2 + 22, 113, 80, 2)

  // 제목: 입체 금박 글자 + 빛 번짐
  ctx.font = `140px ${display}`
  ctx.fillStyle = linear(ctx, 0, 822, 0, 962, GOLD_TEXT)
  ctx.textAlign = 'center'
  ctx.save()
  shadow(ctx, '#5A3306', 0, 4)
  ctx.fillText(`치타어 ${grade}급`, W / 2, 892)
  ctx.restore()
  ctx.save()
  shadow(ctx, 'rgba(255, 190, 80, .55)', 22)
  ctx.fillText(`치타어 ${grade}급`, W / 2, 892)
  ctx.restore()

  ctx.fillStyle = '#FFE7A6'
  ctx.font = `46px ${display}`
  const kindW = centered(ctx, '만점 인증서', 1006, 18)
  sideLines(ctx, W / 2 - kindW / 2, W / 2 + kindW / 2, 1006, 90, 18)

  ctx.save()
  ctx.fillStyle = '#FFF8EA'
  ctx.font = `700 62px ${sans}`
  shadow(ctx, 'rgba(255, 190, 90, .5)', 24)
  const nameText = `${name} 님`
  const nameW = centered(ctx, nameText, 1097, 0) + 112
  ctx.restore()
  ctx.fillStyle = linear(ctx, W / 2 - nameW / 2, 0, W / 2 + nameW / 2, 0, [[0, FADE], [0.5, '#FFE08A'], [1, FADE]])
  ctx.fillRect(W / 2 - nameW / 2, 1148, nameW, 3)

  body.forEach((line, i) => runs(ctx, line, 1190 + i * 56, 33, '#E3D1B0', '#FFE7A6'))

  // 점수 · 합격일
  const parts = [
    ['점수', score],
    ['합격일', date],
  ]
  const widths = parts.map(([k, v]) => {
    ctx.font = `400 34px ${sans}`
    const kw = ctx.measureText(k).width
    ctx.font = `700 34px ${sans}`
    return kw + 16 + ctx.measureText(v).width
  })
  let x = W / 2 - (widths[0] + widths[1] + 60) / 2
  ctx.textAlign = 'left'
  parts.forEach(([k, v], i) => {
    ctx.font = `400 34px ${sans}`
    ctx.fillStyle = '#C4AE88'
    ctx.fillText(k, x, 1315)
    const kw = ctx.measureText(k).width
    ctx.font = `700 34px ${sans}`
    ctx.fillStyle = '#FFE7A6'
    ctx.fillText(v, x + kw + 16, 1315)
    x += widths[i] + 60
  })
}

function drawStars(ctx) {
  ctx.save()
  ctx.translate(W / 2 - 230, 1352)
  shadow(ctx, 'rgba(255, 210, 110, .7)', 12)
  for (const [x, y, r] of [[60, 52, 24], [145, 48, 30], [230, 44, 40], [315, 48, 30], [400, 52, 24]]) star(ctx, x, y, r)
  ctx.restore()
}

// body: 줄마다 [글자, 굵게?] 조각 배열
export async function drawPerfectCertificate(canvas, data) {
  const sansText = ['치타 가이드 공인', `${data.name} 님`, data.score, data.date, '점수 합격일', ...data.body.flat().map(([t]) => t)].join('')
  const [img] = await Promise.all([
    loadPhoto(),
    document.fonts.load(`140px "Do Hyeon"`, `치타어 ${data.grade}급 만점 인증서 ★ 100점`),
    document.fonts.load(`400 34px "Noto Sans KR"`, sansText),
    document.fonts.load(`700 34px "Noto Sans KR"`, sansText),
  ])

  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  drawBackground(ctx)
  drawRays(ctx)
  drawDust(ctx)
  drawFrame(ctx)
  drawLaurel(ctx)
  drawPhoto(ctx, img)
  drawBanner(ctx)
  drawText(ctx, data)
  drawStars(ctx)
}
