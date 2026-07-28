// ============================================================
// lab.js — Laboratório interativo de ordenação
// ============================================================

(function(){

  const DEFAULT_ARRAY = [8,5,2,1,9,6];

  const state = {
    singleAlgo: 'bubble',
    compareAlgos: ['bubble','selection','insertion'],
    compareMode: false,
    currentArray: DEFAULT_ARRAY.slice(),
    explainMode: false
  };

  let single = null;               // runner do modo individual
  let singlePlaying = false, singleTimer = null;
  let compareRunners = [];         // runners do modo comparação
  let comparePlaying = false, compareTimer = null;

  // ---------- utilidades ----------
  function escapeHtml(s){ return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function clamp(v, lo, hi){ return Math.max(lo, Math.min(hi, v)); }
  function parseListInput(str){
    return str.split(',').map(s=>parseInt(s.trim(),10)).filter(n=>!isNaN(n));
  }
  function estimateTime(stepsCount){ return (stepsCount * 3.4).toFixed(1) + ' ms'; }
  function speedMs(){
    const v = parseInt(document.getElementById('speed-slider').value);
    return v===1 ? 1100 : v===2 ? 550 : 220;
  }

  function createRunner(algoId, baseArray){
    const algo = ALGO_META[algoId];
    const steps = [...algo.generator(baseArray)];
    return { algoId, algo, steps, index:0 };
  }

  function accumulateSorted(steps, uptoIndex){
    const set = new Set();
    for(let k=0;k<=uptoIndex;k++){
      const e = steps[k].event;
      if(e.type==='sorted' && e.indices) e.indices.forEach(i=>set.add(i));
      if(steps[k].sortedAll) steps[k].array.forEach((_,i)=>set.add(i));
    }
    return set;
  }

  function computeStats(steps, uptoIndex){
    let comparisons=0, swaps=0;
    for(let k=0;k<=uptoIndex;k++){
      const e = steps[k].event;
      if(e.type==='compare') comparisons++;
      if(e.type==='swap' || e.type==='overwrite') swaps++;
    }
    return { comparisons, swaps, steps: uptoIndex+1 };
  }

  // Reaproveita as barras já existentes (em vez de recriar tudo a cada passo):
  // permite que a transição de altura/cor do CSS anime de verdade entre passos.
  function renderBars(container, step, sortedSet, opts){
    opts = opts || {};
    const { array } = step, max = Math.max(...array, 1), ev = step.event, showVal = opts.showVal !== false;
    if(container.children.length !== array.length){
      container.innerHTML = array.map(() => `<div class="bar-wrap"><div class="bar"></div>${showVal ? '<div class="bar-label"></div>' : ''}</div>`).join('');
    }
    array.forEach((v,i) => {
      const [bar, label] = container.children[i].children;
      bar.className = sortedSet.has(i) ? 'bar sorted'
        : (ev.type==='compare' && (i===ev.i||i===ev.j)) ? 'bar compare'
        : (ev.type==='swap' && (i===ev.i||i===ev.j)) || (ev.type==='overwrite' && i===ev.i) ? 'bar swap'
        : 'bar';
      bar.style.height = (12 + (v/max) * (opts.height || 200)) + 'px';
      if(showVal) label.textContent = v;
    });
  }

  function buildExplanation(algo, ev){
    if(ev.type==='compare') return `Neste momento o ${algo.name} está comparando dois elementos. ${ev.message} Essa comparação decide se uma troca é necessária.`;
    if(ev.type==='swap') return `O ${algo.name} realizou uma troca. ${ev.message}`;
    if(ev.type==='overwrite') return `O ${algo.name} moveu um valor dentro da lista. ${ev.message}`;
    if(ev.type==='sorted') return ev.message ? `${ev.message} Essa posição não muda mais até o fim da execução.` : 'Mais uma posição da lista já está no lugar certo.';
    if(ev.type==='done') return `${ev.message} O ${algo.name} concluiu a ordenação aplicando sua lógica até que nenhuma posição estivesse fora de ordem.`;
    return ev.message || 'Preparando a execução.';
  }

  // ---------- seletor de algoritmos (chips) ----------
  function renderPicker(container, ids, selectedIds, multi, onToggle){
    container.innerHTML = ids.map(id=>{
      const a = ALGO_META[id];
      const active = selectedIds.includes(id);
      return `<button type="button" class="chip ${active?'active':''}" ${multi?'data-multi':''} data-id="${id}">${a.name}</button>`;
    }).join('');
    container.querySelectorAll('.chip').forEach(btn=>{
      btn.addEventListener('click', ()=> onToggle(btn.dataset.id));
    });
  }

  function renderMainPicker(){
    renderPicker(document.getElementById('algo-picker'), ALGO_ORDER, [state.singleAlgo], false, id=>{
      state.singleAlgo = id;
      renderMainPicker();
      onSingleAlgoChange();
    });
  }
  function renderComparePicker(){
    renderPicker(document.getElementById('compare-picker'), ALGO_ORDER, state.compareAlgos, true, id=>{
      const idx = state.compareAlgos.indexOf(id);
      if(idx>=0){ if(state.compareAlgos.length>1) state.compareAlgos.splice(idx,1); }
      else state.compareAlgos.push(id);
      renderComparePicker();
      initCompareRunners();
    });
  }

  // ---------- código sincronizado (modo individual) ----------
  function renderCodeLines(algo){
    const el = document.getElementById('lab-code-lines');
    el.innerHTML = algo.code.map((line,idx)=>
      `<div class="code-line" data-line="${idx}"><span class="ln">${idx+1}</span>${escapeHtml(line)||'&nbsp;'}</div>`
    ).join('');
    el.querySelectorAll('.code-line').forEach(e=>{
      e.addEventListener('click', ()=>{
        const idx = parseInt(e.dataset.line);
        highlightCodeLine(idx);
        document.getElementById('lab-code-explain').textContent = algo.lineExplain[idx] || 'Esta linha organiza detalhes internos do algoritmo.';
      });
    });
  }
  function highlightCodeLine(idx){
    document.querySelectorAll('#lab-code-lines .code-line').forEach(e=>{
      e.classList.toggle('active', parseInt(e.dataset.line)===idx);
    });
    if(single){
      document.getElementById('lab-code-explain').textContent = single.algo.lineExplain[idx] || '';
    }
  }

  function renderFinalComplexity(algo){
    const c = algo.complexity;
    document.getElementById('final-complexity-grid').innerHTML = `
      <div class="complexity-card"><div class="big">${c.best}</div><div class="label">Melhor caso</div></div>
      <div class="complexity-card"><div class="big">${c.avg}</div><div class="label">Caso médio</div></div>
      <div class="complexity-card"><div class="big">${c.worst}</div><div class="label">Pior caso</div></div>
      <div class="complexity-card"><div class="big">${c.space}</div><div class="label">Espacial</div></div>
    `;
  }

  // ---------- modo individual ----------
  function initSingleRunner(){
    single = createRunner(state.singleAlgo, state.currentArray);
    document.getElementById('complexity-final').style.display = 'none';
    renderSingle();
  }
  function renderSingle(){
    const step = single.steps[single.index];
    const sortedSet = accumulateSorted(single.steps, single.index);
    renderBars(document.getElementById('viz-bars'), step, sortedSet, {height:200});
    document.getElementById('viz-message').textContent = step.event.message || '—';
    document.getElementById('viz-algo-name').textContent = single.algo.name;

    const stats = computeStats(single.steps, single.index);
    document.getElementById('stat-comparisons').textContent = stats.comparisons;
    document.getElementById('stat-swaps').textContent = stats.swaps;
    document.getElementById('stat-steps').textContent = stats.steps;
    document.getElementById('stat-time').textContent = estimateTime(stats.steps);

    if(step.event.line !== undefined) highlightCodeLine(step.event.line);

    if(state.explainMode){
      document.getElementById('explain-box').textContent = buildExplanation(single.algo, step.event);
    }

    if(single.index >= single.steps.length-1){
      document.getElementById('complexity-final').style.display = 'block';
      renderFinalComplexity(single.algo);
      stopSinglePlaying();
    }
  }
  function stepSingle(dir){
    single.index = clamp(single.index + dir, 0, single.steps.length-1);
    renderSingle();
  }
  function playSingle(){
    if(!single || single.index >= single.steps.length-1) return;
    singlePlaying = true;
    singleTimer = setInterval(()=>{
      stepSingle(1);
      if(single.index >= single.steps.length-1) stopSinglePlaying();
    }, speedMs());
  }
  function stopSinglePlaying(){ singlePlaying = false; clearInterval(singleTimer); }
  function onSingleAlgoChange(){
    renderCodeLines(ALGO_META[state.singleAlgo]);
    stopSinglePlaying();
    initSingleRunner();
  }

  // ---------- modo comparação ----------
  function initCompareRunners(){
    compareRunners = state.compareAlgos.map(id => createRunner(id, state.currentArray));
    renderCompareGrid();
  }
  function renderCompareGrid(){
    const grid = document.getElementById('compare-grid');
    grid.innerHTML = compareRunners.map((r,idx)=>`
      <div class="compare-cell">
        <h4><span>${r.algo.name}</span><span id="cmp-status-${idx}" class="mono" style="font-weight:400; color:#B9BEE8"></span></h4>
        <div class="viz-bars" id="cmp-bars-${idx}"></div>
        <div class="mini-stats" id="cmp-stats-${idx}"></div>
      </div>
    `).join('');
    compareRunners.forEach((r,idx)=>renderCompareCell(idx));
    document.getElementById('compare-results').style.display = 'none';
  }
  function renderCompareCell(idx){
    const r = compareRunners[idx];
    const step = r.steps[r.index];
    const sortedSet = accumulateSorted(r.steps, r.index);
    renderBars(document.getElementById(`cmp-bars-${idx}`), step, sortedSet, {height:110, showVal:false});
    const stats = computeStats(r.steps, r.index);
    document.getElementById(`cmp-status-${idx}`).textContent = `passo ${r.index}/${r.steps.length-1}`;
    document.getElementById(`cmp-stats-${idx}`).innerHTML = `<span>Comparações: ${stats.comparisons}</span><span>Trocas: ${stats.swaps}</span>`;
  }
  function stepCompareAll(dir){
    compareRunners.forEach((r,idx)=>{
      r.index = clamp(r.index + dir, 0, r.steps.length-1);
      renderCompareCell(idx);
    });
    if(compareRunners.every(r=>r.index >= r.steps.length-1)) showCompareResults();
  }
  function playCompare(){
    if(compareRunners.every(r=>r.index >= r.steps.length-1)) return;
    comparePlaying = true;
    compareTimer = setInterval(()=>{
      let moved = false;
      compareRunners.forEach((r,idx)=>{
        if(r.index < r.steps.length-1){ r.index++; moved = true; renderCompareCell(idx); }
      });
      if(!moved){ stopComparePlaying(); showCompareResults(); }
    }, speedMs());
  }
  function stopComparePlaying(){ comparePlaying = false; clearInterval(compareTimer); }
  function showCompareResults(){
    const tbody = document.getElementById('compare-table-body');
    tbody.innerHTML = compareRunners.map(r=>{
      const stats = computeStats(r.steps, r.steps.length-1);
      return `<tr><td>${r.algo.name}</td><td>${stats.comparisons}</td><td>${stats.swaps}</td><td>${stats.steps}</td><td>${estimateTime(stats.steps)}</td></tr>`;
    }).join('');
    document.getElementById('compare-results').style.display = 'block';
  }

  // ---------- lista de entrada ----------
  function applyCurrentList(arr){
    state.currentArray = arr;
    stopSinglePlaying();
    stopComparePlaying();
    if(state.compareMode) initCompareRunners(); else initSingleRunner();
  }

  // ---------- eventos gerais ----------
  document.getElementById('rand-btn').addEventListener('click', ()=>{
    const qty = clamp(parseInt(document.getElementById('rand-qty').value) || 8, 3, 40);
    const min = parseInt(document.getElementById('rand-min').value);
    const max = parseInt(document.getElementById('rand-max').value);
    const lo = isNaN(min) ? 1 : min, hi = isNaN(max) ? 99 : Math.max(max, lo+1);
    const arr = Array.from({length:qty}, ()=> Math.floor(Math.random()*(hi-lo+1)) + lo);
    document.getElementById('list-input').value = arr.join(',');
    applyCurrentList(arr);
  });

  document.getElementById('apply-list-btn').addEventListener('click', ()=>{
    const arr = parseListInput(document.getElementById('list-input').value);
    if(arr.length < 2){ alert('Digite pelo menos 2 números separados por vírgula, por exemplo: 8,5,2,1,9,6'); return; }
    applyCurrentList(arr);
  });

  document.getElementById('play-btn').addEventListener('click', ()=> state.compareMode ? playCompare() : playSingle());
  document.getElementById('pause-btn').addEventListener('click', ()=> state.compareMode ? stopComparePlaying() : stopSinglePlaying());
  document.getElementById('next-btn').addEventListener('click', ()=>{
    if(state.compareMode){ stopComparePlaying(); stepCompareAll(1); }
    else { stopSinglePlaying(); stepSingle(1); }
  });
  document.getElementById('prev-btn').addEventListener('click', ()=>{
    if(state.compareMode){ stopComparePlaying(); stepCompareAll(-1); }
    else { stopSinglePlaying(); stepSingle(-1); }
  });
  document.getElementById('reset-btn').addEventListener('click', ()=>{
    stopSinglePlaying(); stopComparePlaying();
    if(state.compareMode) initCompareRunners(); else initSingleRunner();
  });

  document.getElementById('compare-mode-toggle').addEventListener('change', (e)=>{
    state.compareMode = e.target.checked;
    stopSinglePlaying(); stopComparePlaying();
    document.getElementById('single-mode').style.display = state.compareMode ? 'none' : 'block';
    document.getElementById('compare-mode-section').style.display = state.compareMode ? 'block' : 'none';
    document.getElementById('play-btn').style.display = 'inline-flex';
    if(state.compareMode) initCompareRunners(); else initSingleRunner();
  });

  document.getElementById('explain-mode-toggle').addEventListener('change', (e)=>{
    state.explainMode = e.target.checked;
    document.getElementById('explain-panel').style.display = state.explainMode ? 'block' : 'none';
    if(state.explainMode && single) renderSingle();
  });

  // ---------- quiz ----------
  const QUIZ = [
    { q:'Qual algoritmo compara elementos vizinhos e os troca repetidamente até ordenar a lista?', options:['Bubble Sort','Merge Sort','Quick Sort','Heap Sort'], correct:0,
      explain:'O Bubble Sort percorre a lista comparando pares vizinhos e trocando-os quando estão fora de ordem.' },
    { q:'Qual algoritmo escolhe um pivô e organiza os menores à esquerda e os maiores à direita dele?', options:['Selection Sort','Quick Sort','Insertion Sort','Shell Sort'], correct:1,
      explain:'O Quick Sort particiona a lista em torno de um pivô, e depois repete o processo recursivamente.' },
    { q:'Qual estratégia o Merge Sort utiliza para ordenar?', options:['Trocas sucessivas de vizinhos','Inserção direta na posição correta','Divisão da lista em partes menores, seguida de junção','Construção de uma árvore de prioridades'], correct:2,
      explain:'O Merge Sort divide a lista repetidamente ao meio e depois junta (merge) as partes já ordenadas.' },
    { q:'Qual é a complexidade média de tempo do Bubble, Selection e Insertion Sort?', options:['O(n)','O(n log n)','O(n²)','O(1)'], correct:2,
      explain:'Esses três algoritmos clássicos têm complexidade média de O(n²), por comparar muitos pares de elementos.' },
    { q:'Qual algoritmo organiza a lista como uma árvore binária antes de ordenar?', options:['Heap Sort','Shell Sort','Bubble Sort','Merge Sort'], correct:0,
      explain:'O Heap Sort constrói um heap (árvore binária) e extrai repetidamente o maior valor da raiz.' },
    { q:'O Shell Sort pode ser descrito como uma evolução direta de qual algoritmo?', options:['Quick Sort','Insertion Sort','Merge Sort','Heap Sort'], correct:1,
      explain:'O Shell Sort é um Insertion Sort que compara elementos distantes (com um intervalo), reduzindo o intervalo aos poucos.' }
  ];

  // Embaralha um array sem alterar o original (Fisher-Yates)
  function shuffleArray(arr){
    const a = arr.slice();
    for(let i = a.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // Gera uma rodada nova: perguntas em ordem aleatória e, dentro de cada uma,
  // as opções também embaralhadas (recalculando o índice da resposta certa)
  function buildQuizRound(){
    return shuffleArray(QUIZ).map(item => {
      const order = shuffleArray(item.options.map((_, i) => i));
      return {
        q: item.q,
        explain: item.explain,
        options: order.map(i => item.options[i]),
        correct: order.indexOf(item.correct)
      };
    });
  }

  function renderQuiz(){
    const container = document.getElementById('quiz-container');
    const round = buildQuizRound();
    let answered = 0;
    let correct = 0;

    const updateHeader = () => {
      const scoreEl = document.getElementById('quiz-score-num');
      const fillEl = document.getElementById('quiz-progress-fill');
      if(scoreEl) scoreEl.textContent = `${correct}/${round.length}`;
      if(fillEl) fillEl.style.width = `${(answered / round.length) * 100}%`;
      if(answered === round.length) showSummary();
    };

    const showSummary = () => {
      const old = document.getElementById('quiz-summary');
      if(old) old.remove();
      const pct = Math.round((correct / round.length) * 100);
      let emoji = '🌱', msg = 'Vale a pena revisar os conceitos acima e tentar de novo.';
      if(pct === 100){ emoji = '🏆'; msg = 'Mandou muito bem! Você domina os algoritmos de ordenação.'; }
      else if(pct >= 70){ emoji = '✨'; msg = 'Muito bom! Faltou afinar só alguns detalhes.'; }
      else if(pct >= 40){ emoji = '📚'; msg = 'Bom começo! Releia as explicações e tente novamente.'; }

      const summary = document.createElement('div');
      summary.className = 'panel quiz-summary';
      summary.id = 'quiz-summary';
      summary.innerHTML = `
        <span class="emoji">${emoji}</span>
        <div class="score-big">${correct} de ${round.length} corretas</div>
        <p>${msg}</p>
        <button class="btn btn-primary" id="quiz-retry-btn">🔄 Refazer quiz</button>
      `;
      container.appendChild(summary);
      document.getElementById('quiz-retry-btn').addEventListener('click', renderQuiz);
      summary.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    container.innerHTML = `
      <div class="quiz-header">
        <div class="quiz-score">Pontuação: <span class="num" id="quiz-score-num">0/${round.length}</span></div>
        <div class="quiz-progress-track"><div class="quiz-progress-fill" id="quiz-progress-fill"></div></div>
      </div>
    ` + round.map((item, qi) => `
      <div class="quiz-card" id="quiz-card-${qi}">
        <strong><span class="qnum">${qi+1}</span>${item.q}</strong>
        <div class="quiz-options" data-qi="${qi}">
          ${item.options.map((op,oi)=>`<button data-oi="${oi}">${op}</button>`).join('')}
        </div>
        <div class="quiz-feedback" id="quiz-feedback-${qi}"></div>
      </div>
    `).join('');

    container.querySelectorAll('.quiz-options').forEach(group=>{
      const qi = parseInt(group.dataset.qi);
      group.querySelectorAll('button').forEach(btn=>{
        btn.addEventListener('click', ()=>{
          const oi = parseInt(btn.dataset.oi);
          const item = round[qi];
          const buttons = group.querySelectorAll('button');
          buttons.forEach(b=> b.disabled = true);
          const feedback = document.getElementById(`quiz-feedback-${qi}`);
          document.getElementById(`quiz-card-${qi}`).classList.add('answered');
          answered++;
          if(oi === item.correct){
            btn.classList.add('correct');
            feedback.innerHTML = `✅ Correto! ${item.explain}`;
            feedback.className = 'quiz-feedback show correct';
            correct++;
          } else {
            btn.classList.add('wrong');
            buttons[item.correct].classList.add('correct');
            feedback.innerHTML = `❌ Não foi dessa vez. ${item.explain}`;
            feedback.className = 'quiz-feedback show wrong';
          }
          updateHeader();
        });
      });
    });

    updateHeader();
  }

  // ---------- inicialização ----------
  function init(){
    const params = new URLSearchParams(location.search);
    const preset = params.get('a');
    if(preset && ALGO_META[preset]) state.singleAlgo = preset;

    document.getElementById('list-input').value = state.currentArray.join(',');
    renderMainPicker();
    renderComparePicker();
    renderCodeLines(ALGO_META[state.singleAlgo]);
    initSingleRunner();
    renderQuiz();
  }
  init();

})();
