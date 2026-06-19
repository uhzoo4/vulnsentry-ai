// ─────────────────────────────────────────────
// 3D Card Tilt Effect
// CSS perspective + JS mouse tracking
// ─────────────────────────────────────────────

function initTilt() {
  const cards = document.querySelectorAll('.artist-card')

  cards.forEach(card => {
    card.addEventListener('mousemove', onMouseMove)
    card.addEventListener('mouseleave', onMouseLeave)
  })

  function onMouseMove(e) {
    const card   = e.currentTarget
    const rect   = card.getBoundingClientRect()
    const cx     = rect.left + rect.width  / 2
    const cy     = rect.top  + rect.height / 2
    const dx     = (e.clientX - cx) / (rect.width  / 2)
    const dy     = (e.clientY - cy) / (rect.height / 2)
    const MAX    = 8

    card.style.transform = `perspective(1000px) rotateY(${dx * MAX}deg) rotateX(${-dy * MAX}deg) translateZ(8px)`
  }

  function onMouseLeave(e) {
    const card = e.currentTarget
    card.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg) translateZ(0)'
    card.style.transition = 'transform 400ms ease'
    setTimeout(() => { card.style.transition = '' }, 400)
  }
}

document.addEventListener('DOMContentLoaded', initTilt)
