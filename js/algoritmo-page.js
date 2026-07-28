// ============================================================
// algoritmo-page.js — página de um algoritmo específico
// ============================================================

(function(){
  const params = new URLSearchParams(location.search);
  const id = params.get('a') || 'bubble';
  const algo = ALGO_META[id] || ALGO_META.bubble;
  const DEMO_ARRAY = [8,3,5,1,9,6];

  // ---------- cabeçalho ----------
  document.title = `${algo.name} · Laboratório de Ordenação`;
  document.getElementById('algo-badge').textContent = algo.name;
  document.getElementById('algo-tagline').textContent = algo.tagline;
  document.getElementById('algo-title').textContent = algo.name;
  document.getElementById('algo-short').textContent = algo.short;
  document.getElementById('demo-lab-link').href = `laboratorio.html?a=${algo.id}`;

  // ---------- navegação entre algoritmos ----------
  function renderJump(target){
    const chips = ALGO_ORDER.map(key => {
      const a = ALGO_META[key];
      const isCurrent = key === algo.id;
      return `<a href="algoritmo.html?a=${key}" class="${isCurrent ? 'current' : ''}"${isCurrent ? ' aria-current="page"' : ''}>${a.name}</a>`;
    }).join('');
    target.innerHTML = `<span class="jump-label">Outros algoritmos:</span>${chips}`;
  }
  renderJump(document.getElementById('algo-jump'));

  // ---------- explicação ----------
  document.getElementById('explicacao-body').innerHTML = `<h2>Como funciona, em linguagem simples</h2>${algo.explanation}`;

  // ---------- complexidade ----------
  const c = algo.complexity;
  document.getElementById('complexity-grid').innerHTML = `
    <div class="complexity-card"><div class="big">${c.best}</div><div class="label">Melhor caso</div></div>
    <div class="complexity-card"><div class="big">${c.avg}</div><div class="label">Caso médio</div></div>
    <div class="complexity-card"><div class="big">${c.worst}</div><div class="label">Pior caso</div></div>
    <div class="complexity-card"><div class="big">${c.space}</div><div class="label">Complexidade espacial</div></div>
  `;

  // ---------- vantagens / desvantagens / quando usar ----------
  document.getElementById('pros-list').innerHTML = algo.pros.map(p=>`<li>${p}</li>`).join('');
  document.getElementById('cons-list').innerHTML = algo.cons.map(p=>`<li>${p}</li>`).join('');
  document.getElementById('when-text').textContent = algo.when;

  // ---------- código sincronizado ----------
  const codeLinesEl = document.getElementById('code-lines');
  codeLinesEl.innerHTML = algo.code.map((line, idx) =>
    `<div class="code-line" data-line="${idx}"><span class="ln">${idx+1}</span>${escapeHtml(line) || '&nbsp;'}</div>`
  ).join('');
  function escapeHtml(s){ return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  codeLinesEl.querySelectorAll('.code-line').forEach(el => {
    el.addEventListener('click', () => selectLine(parseInt(el.dataset.line)));
  });
  function selectLine(idx, switchTab){
    codeLinesEl.querySelectorAll('.code-line').forEach(el => el.classList.toggle('active', parseInt(el.dataset.line)===idx));
    const explainEl = document.getElementById('code-explain');
    explainEl.textContent = algo.lineExplain[idx] || 'Esta linha organiza detalhes internos do algoritmo.';
    if(switchTab) activateTab('codigo');
  }

  // ---------- abas ----------
  const tabButtons = document.querySelectorAll('#tabs button');
  tabButtons.forEach(btn => btn.addEventListener('click', () => activateTab(btn.dataset.tab)));
  function activateTab(tab){
    tabButtons.forEach(b => b.classList.toggle('active', b.dataset.tab===tab));
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.toggle('active', p.id===`pane-${tab}`));
  }

  // ---------- demonstração animada ----------
  const stage = document.getElementById('demo-stage');
  const caption = document.getElementById('demo-caption');
  let steps = [];
  let stepIndex = -1;
  let playing = false;
  let timer = null;

  function buildSteps(){
    steps = [...algo.generator(DEMO_ARRAY)];
  }
  buildSteps();

  function renderStep(){
    const idx = Math.max(stepIndex,0);
    const s = steps[idx] || steps[0];
    const max = Math.max(...s.array);
    const ev = s.event;
    const acc = new Set();
    for(let k=0;k<=idx;k++){
      const e = steps[k].event;
      if(e.type==='sorted' && e.indices) e.indices.forEach(i=>acc.add(i));
      if(steps[k].sortedAll) steps[k].array.forEach((_,i)=>acc.add(i));
    }

    if(stage.children.length !== s.array.length){
      stage.innerHTML = s.array.map(() => '<div class="bar-wrap"><div class="bar"></div><div class="bar-label"></div></div>').join('');
    }
    s.array.forEach((v,i) => {
      const [bar, label] = stage.children[i].children;
      bar.className = acc.has(i) ? 'bar sorted'
        : (ev.type==='compare' && (i===ev.i||i===ev.j)) ? 'bar compare'
        : (ev.type==='swap' && (i===ev.i||i===ev.j)) || (ev.type==='overwrite' && i===ev.i) ? 'bar swap'
        : 'bar';
      bar.style.height = (20 + (v/max)*130) + 'px';
      label.textContent = v;
    });
    caption.textContent = ev.message || '—';
    if(ev.line!==undefined) selectLine(ev.line, false);
  }


  function step(dir){
    stepIndex = Math.max(0, Math.min(steps.length-1, stepIndex + dir));
    renderStep();
    if(stepIndex>=steps.length-1) stopPlaying();
  }

  function stopPlaying(){
    playing=false; clearInterval(timer);
    document.getElementById('demo-play').textContent = '▶ Reproduzir';
  }

  document.getElementById('demo-next').addEventListener('click', () => { stopPlaying(); step(1); });
  document.getElementById('demo-prev').addEventListener('click', () => { stopPlaying(); step(-1); });
  document.getElementById('demo-reset').addEventListener('click', () => {
    stopPlaying(); buildSteps(); stepIndex=0; renderStep();
    caption.textContent = 'Clique em "Reproduzir" para começar.';
  });
  document.getElementById('demo-play').addEventListener('click', () => {
    if(playing){ stopPlaying(); return; }
    if(stepIndex>=steps.length-1){ buildSteps(); stepIndex=0; }
    playing = true;
    document.getElementById('demo-play').textContent = '⏸ Pausar';
    timer = setInterval(() => {
      step(1);
      if(stepIndex>=steps.length-1) stopPlaying();
    }, 900);
  });

  stepIndex = 0;
  renderStep();
})();
