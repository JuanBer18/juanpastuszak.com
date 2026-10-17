/* The content, links and natural image proportions work without JavaScript. */
(() => {
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const videos = [...document.querySelectorAll('video')];
  const visible = new Set(), pausedByReader = new Set();
  let motionPaused = motion.matches;
  const motionButton = document.querySelector('[data-motion]');
  const start = video => {
    if (document.hidden || motionPaused || pausedByReader.has(video)) return;
    video.play().catch(() => { video.dataset.blocked = 'true'; });
  };
  const motionLabel = () => {
    if (!motionButton) return;
    motionButton.hidden = false;
    motionButton.textContent = motionPaused ? 'Play videos' : 'Pause videos';
    motionButton.setAttribute('aria-label', motionPaused ? 'Play videos when visible' : 'Pause all videos');
  };
  videos.forEach(video => {
    video.muted = true;
    video.tabIndex = 0;
    video.setAttribute('role', 'button');
    video.setAttribute('aria-label', video.getAttribute('aria-label') + '. Activate to play or pause.');
    const sync = () => video.setAttribute('aria-pressed', String(!video.paused));
    video.addEventListener('play', sync); video.addEventListener('pause', sync); sync();
    const toggle = () => {
      if (video.paused) { pausedByReader.delete(video); video.play().catch(() => {}); }
      else { pausedByReader.add(video); video.pause(); }
    };
    video.addEventListener('click', toggle);
    video.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); toggle(); }
    });
  });
  // Smooth scrolling: only the most visible video plays, it starts once scrolling settles,
  // and each clip starts downloading shortly before it reaches the screen.
  const ratio = new Map();
  let active = null, settle = 0;
  const choose = () => {
    let best = null, bestRatio = 0;
    visible.forEach(video => { const r = ratio.get(video) || 0; if (r > bestRatio) { best = video; bestRatio = r; } });
    if (active && active !== best) active.pause();
    active = best;
    if (best) start(best);
  };
  const schedule = () => { clearTimeout(settle); settle = setTimeout(choose, 200); };
  addEventListener('scroll', () => { if (active) schedule(); }, { passive: true });
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      const video = entry.target;
      ratio.set(video, entry.intersectionRatio);
      if (entry.isIntersecting && entry.intersectionRatio >= .3) visible.add(video);
      else { visible.delete(video); video.pause(); if (active === video) active = null; }
    }) || schedule(), { threshold: [0, .3, .5, .7, .9, 1] });
    const preload = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.preload = 'auto'; preload.unobserve(entry.target); }
    }), { rootMargin: '300px 0px' });
    videos.forEach(video => { observer.observe(video); preload.observe(video); });
  }
  motionButton?.addEventListener('click', () => {
    motionPaused = !motionPaused;
    if (motionPaused) videos.forEach(video => video.pause());
    else { pausedByReader.clear(); choose(); }
    motionLabel();
  });
  motion.addEventListener('change', () => {
    motionPaused = motion.matches;
    if (motionPaused) videos.forEach(video => video.pause()); else choose();
    motionLabel();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) videos.forEach(video => video.pause()); else choose();
  });
  const retry = event => {
    if (event.target.closest('video,[data-motion]')) return;
    if (active && active.dataset.blocked) { delete active.dataset.blocked; start(active); }
  };
  document.addEventListener('pointerdown', retry, { passive: true });
  document.addEventListener('keydown', retry);
  motionLabel();

  const filters = [...document.querySelectorAll('[data-project-filter]')];
  const tiles = [...document.querySelectorAll('[data-groups]')];
  filters.forEach(button => button.addEventListener('click', () => {
    const category = button.dataset.projectFilter;
    filters.forEach(filter => filter.setAttribute('aria-pressed', String(filter === button)));
    tiles.forEach(tile => { tile.hidden = category !== 'all' && !tile.dataset.groups.split(' ').includes(category); });
    const secondary = document.querySelector('.bento-secondary');
    if (secondary) secondary.hidden = !secondary.querySelector('[data-groups]:not([hidden])');
    const count = document.querySelector('.bento-count');
    if (count) count.textContent = `${tiles.filter(tile => !tile.hidden).length} of ${tiles.length} projects`;
  }));

  document.querySelectorAll('.project-cards').forEach(rail => {
    const buttons = [...document.querySelectorAll('[data-rail]')].filter(b => b.dataset.rail === rail.id);
    const update = () => buttons.forEach(button => {
      button.disabled = Number(button.dataset.direction) < 0 ? rail.scrollLeft <= 2 : rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 2;
    });
    buttons.forEach(button => button.addEventListener('click', () => {
      const cards = [...rail.children];
      const current = cards[0].getBoundingClientRect().left;
      const positions = cards.map(card => card.getBoundingClientRect().left - current);
      const forward = Number(button.dataset.direction) > 0;
      const next = forward ? positions.find(x => x > rail.scrollLeft + 4) : positions.reverse().find(x => x < rail.scrollLeft - 4);
      rail.scrollTo({left: next ?? (forward ? rail.scrollWidth : 0), behavior: motion.matches ? 'instant' : 'smooth'});
    }));
    rail.addEventListener('scroll', update, {passive:true});
    addEventListener('resize', update, {passive:true});
    update();
  });

  document.querySelectorAll('.cmp').forEach(comparison => {
    const range = comparison.querySelector('input');
    const update = () => {
      comparison.style.setProperty('--pos', range.value + '%');
      range.setAttribute('aria-valuetext', range.value + '% of the unpatched sample visible');
    };
    range.addEventListener('input', update); update();
  });

  const menu = document.querySelector('.menu');
  menu?.addEventListener('click', event => { if (event.target.closest('a')) menu.open = false; });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu?.open) { menu.open = false; menu.querySelector('summary').focus(); }
  });
  document.addEventListener('click', event => { if (menu?.open && !menu.contains(event.target)) menu.open = false; });

  const chapterLinks = [...document.querySelectorAll('.project-nav a[href^="#"]')];
  const headerLinks = [...document.querySelectorAll('.nav a[href^="#"]')];
  const chapters = [...document.querySelectorAll('.ch')];
  let queued = false, activeChapter;
  const mark = (links, id) => links.forEach(link => {
    const active = link.hash === '#' + id;
    link.classList.toggle('on', active);
    if (active) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
  });
  const updateNav = () => {
    queued = false;
    const current = [...chapters].reverse().find(section => section.getBoundingClientRect().top <= 175);
    mark(chapterLinks, current?.id);
    if (current?.id !== activeChapter) {
      activeChapter = current?.id;
      const selected = chapterLinks.find(link => link.hash === '#' + activeChapter);
      if (selected) {
        const rail = selected.parentElement;
        const x = selected.getBoundingClientRect().left - rail.getBoundingClientRect().left + rail.scrollLeft;
        rail.scrollTo({left: x - (rail.clientWidth - selected.clientWidth) / 2, behavior: 'instant'});
      }
    }
    const section = ['contact', 'education', 'work', 'recognition'].find(id => document.getElementById(id)?.getBoundingClientRect().top <= 175);
    mark(headerLinks, section);
  };
  addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(updateNav); } }, { passive: true });
  updateNav();

  /* Fit uncropped evidence to its accompanying copy, with a readable minimum size. */
  const fittedSteps = [...document.querySelectorAll('.project-case .step')];
  const fitStep = step => {
    if (step.classList.contains('wheel-overview') || step.classList.contains('reflection-layout') || step.classList.contains('full-media')) return;
    const figure = step.querySelector(':scope > figure');
    if (!figure) return;
    if (innerWidth <= 860) { figure.style.removeProperty('--media-width'); return; }
    const media = figure.querySelector('img,video');
    if (!media) return;
    if (/\/(sat_ground|av_group|rocket_team_rail)\.jpg$|\/uas-team-national-final\.svg$/.test(media.getAttribute('src') || '')) {
      figure.style.setProperty('--media-width', '100%');
      return;
    }
    const width = Number(media.getAttribute('width')), height = Number(media.getAttribute('height'));
    if (!width || !height) return;
    const copyHeight = step.querySelector('.t').getBoundingClientRect().height;
    const captionHeight = figure.querySelector('figcaption')?.getBoundingClientRect().height || 0;
    const diagram = figure.classList.contains('contain');
    const imageHeight = Math.max(diagram ? 270 : 200, Math.min(500, copyHeight - captionHeight - 10));
    figure.style.setProperty('--media-width', Math.round(imageHeight * width / height) + 'px');
  };
  if ('ResizeObserver' in window) {
    const ro = new ResizeObserver(entries => entries.forEach(entry => fitStep(entry.target.closest('.step'))));
    fittedSteps.forEach(step => ro.observe(step.querySelector('.t')));
  }
  addEventListener('resize', () => fittedSteps.forEach(fitStep), { passive: true });
  document.fonts.ready.then(() => fittedSteps.forEach(fitStep));

  const dialog = document.createElement('dialog');
  dialog.className = 'image-viewer';
  dialog.setAttribute('aria-label', 'Enlarged project image');
  dialog.innerHTML = '<div class="viewer-head"><a target="_blank" rel="noopener">Open full image</a><button class="close" type="button">Close</button></div><figure><figcaption></figcaption></figure>';
  document.body.append(dialog);
  let opener;
  dialog.querySelector('.close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => { document.body.classList.remove('image-viewer-open'); opener?.focus({ preventScroll: true }); });
  document.querySelectorAll('figure.m img').forEach(image => {
    if (image.closest('.cmp')) return;
    const figure = image.closest('figure'), button = document.createElement('button');
    button.className = 'image-open'; button.type = 'button';
    button.setAttribute('aria-label', 'Enlarge image: ' + image.alt);
    image.replaceWith(button); button.append(image);
    const label = document.createElement('span'); label.className = 'zoom-label'; label.textContent = 'Enlarge'; label.setAttribute('aria-hidden', 'true'); button.append(label);
    button.addEventListener('click', () => {
      opener = button;
      const enlarged = dialog.querySelector('img') || document.createElement('img'); enlarged.src = image.src; enlarged.alt = image.alt;
      if (!enlarged.parentNode) dialog.querySelector('figure').prepend(enlarged);
      dialog.querySelector('a').href = image.src;
      dialog.querySelector('figcaption').textContent = figure.querySelector('figcaption')?.textContent || image.alt;
      dialog.showModal(); document.body.classList.add('image-viewer-open');
    });
  });
})();

