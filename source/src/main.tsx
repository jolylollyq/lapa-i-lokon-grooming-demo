import React, { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './style.css'

const imagePath = (filename: string) => `${import.meta.env.BASE_URL}images/${filename}`

const studioPrices = [
  ['Комплекс для собак до 10 кг', '2 400 ₽'],
  ['Комплекс для собак 10–25 кг', '3 200 ₽'],
  ['Комплекс для собак от 25 кг', '4 200 ₽'],
  ['Уход для кошки', '2 700 ₽'],
  ['Лапы и когти', '900 ₽'],
]

const studioGallery = [
  { src: imagePath('neutral-grooming-04.jpg'), alt: 'Кошка отдыхает после спокойного ухода', caption: 'Спокойный уход для кошек', size: 'shot-large' },
  { src: imagePath('neutral-grooming-05.jpg'), alt: 'Мастер расчёсывает белую собаку', caption: 'Расчёсывание и укладка', size: '' },
  { src: imagePath('neutral-grooming-07.jpg'), alt: 'Такса принимает тёплую ванну', caption: 'Тёплая ванна', size: '' },
  { src: imagePath('neutral-grooming-09.jpg'), alt: 'Мастер бережно расчёсывает рыжего спаниеля', caption: 'Уход за длинной шерстью', size: 'shot-wide' },
]

const phoneDigitsBefore = (value: string, position: number) => (value.slice(0, position).match(/\d/g) ?? []).length

function formatRussianPhoneDigits(value: string) {
  let digits = value.replace(/\D/g, '')
  if (digits.length > 10 && (digits.startsWith('7') || digits.startsWith('8'))) digits = digits.slice(1)
  digits = digits.slice(0, 10)
  if (!digits) return ''

  const area = digits.slice(0, 3)
  const rest = digits.slice(3)
  let formatted = `(${area}${area.length === 3 ? ')' : ''}`
  if (rest.length) formatted += ` ${rest.slice(0, 3)}`
  if (rest.length > 3) formatted += `-${rest.slice(3, 5)}`
  if (rest.length > 5) formatted += `-${rest.slice(5, 7)}`
  return formatted
}

const phonePositionAfterDigits = (value: string, count: number) => {
  if (!count) return value.startsWith('(') ? 1 : 0
  let seen = 0
  for (let index = 0; index < value.length; index += 1) {
    if (/\d/.test(value[index])) seen += 1
    if (seen === count) return index + 1
  }
  return value.length
}

function formatRussianPhone(event: React.FormEvent<HTMLInputElement>) {
  const input = event.currentTarget
  const raw = input.value
  const caret = input.selectionStart ?? raw.length
  let digitsBefore = phoneDigitsBefore(raw, caret)
  const digits = raw.replace(/\D/g, '')
  if (digits.length > 10 && (digits.startsWith('7') || digits.startsWith('8')) && digitsBefore > 0) digitsBefore -= 1
  input.value = formatRussianPhoneDigits(raw)
  const nextCaret = phonePositionAfterDigits(input.value, Math.min(digitsBefore, input.value.replace(/\D/g, '').length))
  input.setSelectionRange(nextCaret, nextCaret)
}

function handleRussianPhoneBackspace(event: React.KeyboardEvent<HTMLInputElement>) {
  const input = event.currentTarget
  const caret = input.selectionStart ?? 0
  if (event.key !== 'Backspace' || caret !== input.selectionEnd || !caret || /\d/.test(input.value[caret - 1])) return

  const raw = input.value
  const digits = raw.replace(/\D/g, '')
  let digitsBefore = phoneDigitsBefore(raw, caret)
  if (digits.length > 10 && (digits.startsWith('7') || digits.startsWith('8')) && digitsBefore > 0) digitsBefore -= 1
  if (!digitsBefore) return

  event.preventDefault()
  const nationalDigits = digits.length > 10 && (digits.startsWith('7') || digits.startsWith('8')) ? digits.slice(1) : digits
  const nextDigits = nationalDigits.slice(0, digitsBefore - 1) + nationalDigits.slice(digitsBefore)
  input.value = formatRussianPhoneDigits(nextDigits)
  const nextCaret = phonePositionAfterDigits(input.value, digitsBefore - 1)
  input.setSelectionRange(nextCaret, nextCaret)
}

function App() {
  const [activeImage, setActiveImage] = useState<(typeof studioGallery)[number] | null>(null)
  const [requestDetails, setRequestDetails] = useState<{ pet: string; service: string; date: string } | null>(null)
  const lightboxRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = lightboxRef.current
    if (activeImage && dialog && !dialog.open) dialog.showModal()
  }, [activeImage])

  useEffect(() => {
    const nav = document.querySelector<HTMLElement>('.nav')
    const progress = document.querySelector<HTMLElement>('.progress-bar')
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const updateScroll = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight
      const amount = scrollable > 0 ? Math.min(window.scrollY / scrollable, 1) : 0
      if (progress) progress.style.transform = `scaleX(${amount})`
      nav?.classList.toggle('is-scrolled', window.scrollY > 18)
    }
    updateScroll()
    window.addEventListener('scroll', updateScroll, { passive: true })

    const revealItems = [...document.querySelectorAll<HTMLElement>('[data-reveal]')]
    let revealObserver: IntersectionObserver | undefined
    if (reducedMotion || !('IntersectionObserver' in window)) {
      revealItems.forEach(item => item.classList.add('is-revealed'))
    } else {
      revealObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed')
            revealObserver?.unobserve(entry.target)
          }
        })
      }, { threshold: 0.12, rootMargin: '0px 0px -24px 0px' })
      revealItems.forEach(item => revealObserver?.observe(item))
    }

    const art = document.querySelector<HTMLElement>('.hero-art')
    const canParallax = !reducedMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches
    let animationFrame = 0
    const moveArt = (event: PointerEvent) => {
      if (!art) return
      const bounds = art.getBoundingClientRect()
      const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 8
      const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 8
      cancelAnimationFrame(animationFrame)
      animationFrame = requestAnimationFrame(() => {
        art.style.setProperty('--mx', `${x.toFixed(1)}px`)
        art.style.setProperty('--my', `${y.toFixed(1)}px`)
      })
    }
    const resetArt = () => {
      if (!art) return
      art.style.setProperty('--mx', '0px')
      art.style.setProperty('--my', '0px')
    }
    if (art && canParallax) {
      art.addEventListener('pointermove', moveArt)
      art.addEventListener('pointerleave', resetArt)
    }

    return () => {
      window.removeEventListener('scroll', updateScroll)
      revealObserver?.disconnect()
      if (art && canParallax) {
        art.removeEventListener('pointermove', moveArt)
        art.removeEventListener('pointerleave', resetArt)
      }
      cancelAnimationFrame(animationFrame)
    }
  }, [])

  const handleBooking = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const pet = form.elements.namedItem('pet') as HTMLSelectElement
    const service = form.elements.namedItem('service') as HTMLSelectElement
    const date = form.elements.namedItem('date') as HTMLInputElement
    setRequestDetails({
      pet: pet.value,
      service: service.value,
      date: date.value,
    })
    form.reset()
  }

  return <div className="page min-h-screen bg-[#e9f0f3] text-[#142a43]">
    <div className="progress-bar" aria-hidden="true" />
    <div className="demo-bar"><span className="brand-note">ЛАПА И ЛОКОН</span><span>Груминг с заботой о характере</span><span className="top-hours">Нижний Новгород · 10:00–20:00</span></div>
    <header className="nav">
      <a href="#top" className="brand"><span className="brand-mark">✦</span><span>Лапа и Локон</span></a>
      <nav className="links" aria-label="Основная навигация"><a href="#care">Уход</a><a href="#gallery">Галерея</a><a href="#prices">Цены</a><a href="#visit">Контакты</a></nav>
      <a href="#contact" className="button nav-button">Оставить заявку <span>↗</span></a>
    </header>
    <main id="top">
      <section className="hero">
        <div className="copy" data-reveal="left">
          <div className="eyebrow"><span className="live-dot"/> ГРУМИНГ-СТУДИЯ · НИЖНИЙ НОВГОРОД</div>
          <h1>Груминг<br/>для кошек<br/><span className="accent">и собак</span></h1>
          <p>Бережный уход в спокойной студии. Подберём процедуру по шерсти, характеру и самочувствию питомца.</p>
          <div className="actions"><a className="button" href="#contact">Оставить заявку <span>→</span></a><a className="button light" href="#gallery">Наши гости</a></div>
          <a className="microcopy" href="#visit">Нижний Новгород, ул. Можжевеловая, 14 · Вт–Вс, 10:00–20:00 ↘</a>
        </div>
        <div className="hero-art" data-reveal="right">
          <img className="hero-main" src={imagePath('neutral-grooming-01.jpg')} alt="Пудель после бережного груминга" fetchPriority="high" />
          <div className="photo-tile tile-cat"><img src={imagePath('neutral-grooming-03.jpg')} alt="Кошка на столе грумера" /></div>
          <div className="photo-tile tile-dog"><img src={imagePath('neutral-grooming-07.jpg')} alt="Такса во время купания" /></div>
          <div className="location-card"><b>Лапа и Локон</b><br/>Встречаем гостей<br/>в уютной студии</div>
          <div className="orbit-label"><div><span>✳</span> Мягкий уход<br/>без спешки</div></div>
        </div>
      </section>
      <section className="strip" id="care" data-reveal><div><b>Сначала знакомство</b><span>учитываем характер и привычки</span></div><div><b>Мягкая косметика</b><span>подбираем средства по типу шерсти</span></div><div><b>Всё спокойно</b><span>делаем перерывы, если нужно</span></div></section>
      <div className="marquee" aria-label="Забота о питомцах в студии Лапа и Локон"><div className="marquee-track"><span>✳ БЕРЕЖНО К КАЖДОМУ</span><span>✳ СПОКОЙНО И ПО-ДОМАШНЕМУ</span><span>✳ УХОД С УЧЁТОМ ХАРАКТЕРА</span><span>✳ БЕРЕЖНО К КАЖДОМУ</span><span>✳ СПОКОЙНО И ПО-ДОМАШНЕМУ</span><span>✳ УХОД С УЧЁТОМ ХАРАКТЕРА</span></div></div>
      <section className="section">
        <div className="section-head" data-reveal><div><div className="label">Для пушистых и гладкошёрстных</div><h2>Уход, в котором комфортно</h2></div><p>Обсудим привычки питомца и выберем подходящий ритм. Никакой спешки и лишних процедур.</p></div>
        <div className="steps">
          <article className="step" data-reveal><div className="n">СОБАКАМ</div><h3>Комплексный уход</h3><p>Купание, сушка, расчёсывание и гигиеническая стрижка по породе.</p></article>
          <article className="step" data-reveal><div className="n">КОШКАМ</div><h3>Бережное обновление</h3><p>Вычесывание, уход за когтями и купание по необходимости.</p></article>
          <article className="step" data-reveal><div className="n">КОРОТКИЙ ВИЗИТ</div><h3>Лапы и когти</h3><p>Аккуратно подровняем когти и приведём в порядок шерсть на лапах.</p></article>
        </div>
      </section>
      <section className="section gallery-section" id="gallery">
        <div className="section-head" data-reveal><div><div className="label">Тёплые встречи в студии</div><h2>Наши гости</h2></div><p>Каждый питомец уникален — нам важно, чтобы ему было спокойно и приятно.</p></div>
        <div className="gallery" data-reveal>{studioGallery.map(image => <button type="button" className={`shot ${image.size}`} key={image.src} aria-label={`Открыть фотографию: ${image.caption}`} onClick={() => setActiveImage(image)}><img src={image.src} loading="lazy" alt={image.alt}/><span className="shot-caption">{image.caption}</span><span className="shot-zoom" aria-hidden="true">↗</span></button>)}</div>
      </section>
      <section className="price-section" id="prices">
        <div className="section-head" data-reveal><div><div className="label">Понятный уход без сюрпризов</div><h2>Стоимость услуг</h2></div><p>Перед визитом обсудим пожелания и подберём комфортный вариант для питомца.</p></div>
        <div className="price-card" data-reveal>{studioPrices.map(([name,price])=><div className="price-row" key={name}><span>{name}</span><b>{price}</b></div>)}<p className="price-caption">Стоимость зависит от размера питомца, густоты и состояния шерсти. Итоговую цену мастер согласует до начала процедуры.</p></div>
      </section>
      <section className="booking" id="contact" data-reveal>
        <div className="book-copy"><div className="label">Запись в студию</div><h2>Подберём удобное время.</h2><p>Расскажите немного о питомце и выберите день — так нам будет проще подготовить визит.</p><div className="booking-address"><span>⌖</span><div><b>Нижний Новгород, ул. Можжевеловая, 14</b><small>Вторник — воскресенье · 10:00–20:00</small></div></div></div>
        <form className="booking-form" autoComplete="off" onSubmit={handleBooking}>
          <div className="field-row"><label className="field">Ваше имя<input name="name" type="text" autoComplete="off" placeholder="Как к вам обращаться" required /></label><label className="field">Телефон<span className="phone-field"><span className="phone-prefix">+7</span><input name="phone" type="tel" autoComplete="off" inputMode="tel" placeholder="(999) 123-45-67" pattern="\([0-9]{3}\) [0-9]{3}-[0-9]{2}-[0-9]{2}" title="Введите десять цифр номера" onInput={formatRussianPhone} onKeyDown={handleRussianPhoneBackspace} required /></span></label></div>
          <div className="field-row"><label className="field">Питомец<select name="pet" defaultValue="" required><option value="" disabled>Кошка или собака</option><option value="Собака">Собака</option><option value="Кошка">Кошка</option></select></label><label className="field">Услуга<select name="service" defaultValue="" required><option value="" disabled>Выберите уход</option>{studioPrices.map(([name])=><option key={name} value={name}>{name}</option>)}</select></label></div>
          <label className="field">Желаемый день<input name="date" type="date" required /></label>
          <button className="button booking-submit" type="submit">Оставить заявку <span>→</span></button>
          {requestDetails && <div className="request-confirmation" role="status"><b>Спасибо! Ваша заявка оформлена.</b><span>{requestDetails.pet} · {requestDetails.service}</span><span>Желаемый день: {new Date(`${requestDetails.date}T00:00:00`).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}</span></div>}
        </form>
      </section>
      <section className="map-section" id="visit" data-reveal><div className="map-info"><div className="label">Мы рядом</div><h2>Нижний Новгород</h2><p>Будем рады вам в уютной студии на Можжевеловой.</p><div className="map-fact"><span className="map-icon">⌖</span><span><b>ул. Можжевеловая, 14</b><br/>Сосновый квартал<br/>Вход со стороны сквера</span></div><div className="map-route"><b>Часы работы</b><br/>Вт–Вс, 10:00–20:00 · Понедельник — выходной</div></div><div className="map-frame"><span className="map-street street-one">Можжевеловая</span><span className="map-street street-two">Сосновая</span><div className="map-placeholder"><span className="map-cross">⌖</span><b>Лапа и Локон</b><small>Можжевеловая, 14</small></div><div className="map-caption">Сосновый квартал · Нижний Новгород</div></div></section>
    </main>
    <footer className="footer"><div><b>Лапа и Локон</b><br/>Груминг с заботой о характере.</div><div>Нижний Новгород, ул. Можжевеловая, 14<br/>Вт–Вс, 10:00–20:00</div><div>hello@lapalokon.example<br/>Пусть каждому будет уютно.</div></footer>
    <dialog ref={lightboxRef} className="lightbox" aria-label="Просмотр фотографии" onClose={() => setActiveImage(null)} onClick={event => { if (event.target === event.currentTarget) lightboxRef.current?.close() }}>
      <button type="button" className="lightbox-close" aria-label="Закрыть фотографию" onClick={() => lightboxRef.current?.close()}>×</button>
      {activeImage && <figure><img src={activeImage.src} alt={activeImage.alt}/><figcaption>{activeImage.caption}</figcaption></figure>}
    </dialog>
  </div>
}

document.documentElement.classList.add('motion-ready')
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>)
