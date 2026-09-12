/* Independent, manual carousels. Native links remain usable without JavaScript. */
document.querySelectorAll('[data-carousel]').forEach(board => {
  const slides = [...board.querySelectorAll('.collection-slide')];
  const dots = [...board.querySelectorAll('[data-slide]')];
  const controls = board.querySelector('.carousel-controls');
  const announcement = board.querySelector('.carousel-announcement');
  let current = 0;
  function show(index) {
    const next = (index + slides.length) % slides.length;
    if (next === current) return;
    current = next;
    slides.forEach((slide, i) => {
      slide.hidden = i !== current;
      slide.querySelectorAll('a').forEach(link => link.tabIndex = i === current ? 0 : -1);
      if (i === current) slide.querySelectorAll('img').forEach(img => img.loading = 'eager');
    });
    dots.forEach((dot, i) => i === current ? dot.setAttribute('aria-current', 'true') : dot.removeAttribute('aria-current'));
    board.querySelector('.carousel-counter').textContent = `${String(current + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
    announcement.textContent = slides[current].getAttribute('aria-label');
  }
  controls.hidden = false;
  board.querySelectorAll('[data-step]').forEach(button => button.addEventListener('click', () => show(current + Number(button.dataset.step))));
  dots.forEach(dot => dot.addEventListener('click', () => show(Number(dot.dataset.slide))));
  controls.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    show(event.key === 'Home' ? 0 : event.key === 'End' ? slides.length - 1 : current + (event.key === 'ArrowRight' ? 1 : -1));
    if (event.target.matches('[data-slide]')) dots[current].focus();
  });
  let start = null;
  let swiped = false;
  board.querySelector('.carousel-slides').addEventListener('pointerdown', event => {
    if (event.pointerType === 'mouse') return;
    swiped = false;
    start = {x:event.clientX, y:event.clientY};
  });
  board.addEventListener('pointerup', event => {
    if (!start) return;
    const dx = event.clientX - start.x, dy = event.clientY - start.y;
    start = null;
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      swiped = true;
      show(current + (dx < 0 ? 1 : -1));
      setTimeout(() => swiped = false, 0);
    }
  });
  board.addEventListener('pointercancel', () => start = null);
  board.addEventListener('click', event => {
    if (swiped) { event.preventDefault(); swiped = false; }
  }, true);
});
