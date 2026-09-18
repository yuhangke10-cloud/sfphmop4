(() => {
  'use strict';

  const WIDTH = 1920;
  const HEIGHT = 1080;
  const PASSWORD = '18817962338';
  const screen = document.getElementById('screen');
  const passwordGate = document.getElementById('passwordGate');
  const passwordInput = document.getElementById('passwordInput');
  const controls = Object.fromEntries([
    'monitorTab', 'eventTab', 'parameterTab', 'theme', 'satellite', 'line',
    'network', 'parameterQuery', 'parameterBack'
  ].map(id => [id, document.getElementById(id)]));

  const state = {
    theme: matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
    page: 'monitor',
    mode: 'network',
    parameterView: 'main'
  };

  const regions = {
    monitorTab: [158, 0, 225, 43],
    eventTab: [383, 0, 226, 43],
    parameterTab: [609, 0, 261, 43],
    theme: [1828, 0, 47, 43],
    line: [1030, 360, 75, 42],
    satellite: [1104, 360, 96, 42],
    network: [1200, 360, 98, 42],
    parameterQuery: [1788, 59, 108, 31],
    parameterBack: [1788, 59, 108, 31]
  };

  const allImages = [
    'light-network.png', 'light-satellite.png', 'light-line.png',
    'dark-network.png', 'dark-satellite.png', 'dark-line.png',
    'light-event.png', 'dark-event.png',
    'light-parameter-main.png', 'dark-parameter-main.png',
    'light-parameter-result.png', 'dark-parameter-result.png'
  ].map(name => `assets/images/${name}`);

  let assetsReady = false;
  let preloadPromise = null;
  const preloadCache = [];

  function imagePath() {
    if (state.page === 'event') return `assets/images/${state.theme}-event.png`;
    if (state.page === 'parameter') return `assets/images/${state.theme}-parameter-${state.parameterView}.png`;
    return `assets/images/${state.theme}-${state.mode}.png`;
  }

  function preloadAllImages() {
    if (preloadPromise) return preloadPromise;
    const current = imagePath();
    const queue = [current, ...allImages.filter(path => path !== current)];
    preloadPromise = Promise.all(queue.map((path, index) => new Promise(resolve => {
      const image = new Image();
      image.decoding = 'async';
      image.fetchPriority = index === 0 ? 'high' : 'low';
      preloadCache.push(image);
      image.onload = resolve;
      image.onerror = resolve;
      image.src = path;
    }))).then(() => { assetsReady = true; });
    return preloadPromise;
  }

  function layout() {
    const scale = innerHeight / HEIGHT;
    const offsetX = (innerWidth - WIDTH * scale) / 2;
    Object.entries(regions).forEach(([id, [x, y, width, height]]) => {
      Object.assign(controls[id].style, {
        left: `${offsetX + x * scale}px`,
        top: `${y * scale}px`,
        width: `${width * scale}px`,
        height: `${height * scale}px`
      });
    });
  }

  function setVisible(id, visible) {
    controls[id].style.display = visible ? 'block' : 'none';
    controls[id].style.pointerEvents = visible ? 'auto' : 'none';
  }

  function render() {
    screen.src = imagePath();
    document.documentElement.dataset.theme = state.theme;
    const monitoring = state.page === 'monitor';
    for (const id of ['satellite', 'line', 'network']) setVisible(id, monitoring);
    setVisible('parameterQuery', state.page === 'parameter' && state.parameterView === 'main');
    setVisible('parameterBack', state.page === 'parameter' && state.parameterView === 'result');
    controls.monitorTab.setAttribute('aria-pressed', String(state.page === 'monitor'));
    controls.eventTab.setAttribute('aria-pressed', String(state.page === 'event'));
    controls.parameterTab.setAttribute('aria-pressed', String(state.page === 'parameter'));
    controls.theme.setAttribute('aria-label', state.theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme');
    layout();
  }

  function switchPage(page) {
    state.page = page;
    if (page === 'parameter') state.parameterView = 'main';
    render();
  }

  passwordInput.addEventListener('keydown', async event => {
    if (event.key !== 'Enter') return;
    if (passwordInput.value !== PASSWORD) {
      passwordInput.value = '';
      passwordInput.setAttribute('aria-invalid', 'true');
      passwordInput.focus();
      return;
    }
    passwordInput.disabled = true;
    passwordInput.value = '';
    passwordInput.placeholder = assetsReady ? 'Ready' : 'Loading…';
    await preloadAllImages();
    render();
    await screen.decode().catch(() => {});
    passwordGate.classList.add('is-hidden');
    passwordGate.setAttribute('aria-hidden', 'true');
  });

  controls.monitorTab.addEventListener('click', () => switchPage('monitor'));
  controls.eventTab.addEventListener('click', () => switchPage('event'));
  controls.parameterTab.addEventListener('click', () => switchPage('parameter'));
  controls.theme.addEventListener('click', () => {
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    render();
  });
  for (const id of ['satellite', 'line', 'network']) {
    controls[id].addEventListener('click', () => { state.mode = id; render(); });
  }
  controls.parameterQuery.addEventListener('click', () => { state.parameterView = 'result'; render(); });
  controls.parameterBack.addEventListener('click', () => { state.parameterView = 'main'; render(); });

  addEventListener('resize', layout);
  preloadAllImages();
  render();
})();
