/**
 * Solution Viewer: Interactive quiz mode
 * - MCQ: show problem + choices → user clicks → reveal result + explanation
 * - Code: show problem → "정답 보기" button → reveal code + explanation
 */
(function () {
  const PROGRESS_KEY = 'bigdata_progress';
  let examData = null;
  let currentQ = 0;
  let examId = '';
  let answered = {}; // Track which questions have been answered this session

  const params = new URLSearchParams(window.location.search);
  examId = params.get('exam') || 'exam-01';
  const startQ = parseInt(params.get('q')) || 1;

  // --- Progress ---
  function getProgress() {
    try { return JSON.parse(localStorage.getItem(PROGRESS_KEY)) || {}; } catch (e) { return {}; }
  }

  function markViewed(qId) {
    const progress = getProgress();
    if (!progress[examId]) progress[examId] = { viewed: [] };
    if (!progress[examId].viewed.includes(qId)) {
      progress[examId].viewed.push(qId);
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    }
    updateSidebarStates();
    updateHeaderProgress();
  }

  function isViewed(qId) {
    const p = getProgress()[examId];
    return p && p.viewed.includes(qId);
  }

  // --- Sidebar ---
  function renderSidebar() {
    const container = document.getElementById('sidebar-items');
    const mobileNav = document.getElementById('mobile-q-nav');

    container.innerHTML = examData.questions.map((q, i) => {
      const viewedClass = isViewed(q.id) ? ' viewed' : '';
      const activeClass = i === currentQ ? ' active' : '';
      return `
        <button class="sidebar-item${activeClass}${viewedClass}" data-index="${i}">
          <span class="q-num">Q${q.id}</span>
          <span class="q-title" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${q.title}</span>
        </button>
      `;
    }).join('');

    mobileNav.innerHTML = examData.questions.map((q, i) => {
      const activeClass = i === currentQ ? ' active' : '';
      return `<button class="q-pill${activeClass}" data-index="${i}">Q${q.id}</button>`;
    }).join('');

    container.querySelectorAll('.sidebar-item').forEach(btn => {
      btn.addEventListener('click', () => navigateTo(parseInt(btn.dataset.index)));
    });
    mobileNav.querySelectorAll('.q-pill').forEach(btn => {
      btn.addEventListener('click', () => navigateTo(parseInt(btn.dataset.index)));
    });
  }

  function updateSidebarStates() {
    document.querySelectorAll('#sidebar-items .sidebar-item').forEach((btn, i) => {
      const q = examData.questions[i];
      btn.classList.toggle('active', i === currentQ);
      btn.classList.toggle('viewed', isViewed(q.id) && i !== currentQ);
    });
    document.querySelectorAll('#mobile-q-nav .q-pill').forEach((btn, i) => {
      btn.classList.toggle('active', i === currentQ);
    });
  }

  function updateHeaderProgress() {
    const total = examData.questions.length;
    const viewed = getProgress()[examId]?.viewed.length || 0;
    document.getElementById('header-progress').textContent = `${viewed}/${total} 완료`;
  }

  // --- Render Question (Interactive Mode) ---
  function renderQuestion(q) {
    const main = document.getElementById('viewer-main');
    const isFirst = currentQ === 0;
    const isLast = currentQ === examData.questions.length - 1;
    const alreadyAnswered = answered[q.id];

    const problemHtml = q.problem.map(p => `<li>${escapeHtml(p)}</li>`).join('');

    // Prerequisite code (Q13)
    let prereqHtml = '';
    if (q.prerequisiteCode) {
      prereqHtml = `
        <div class="accordion mb-md">
          <button class="accordion-header" aria-expanded="false" onclick="toggleAccordion(this)">
            <span>⚙️ 사전 실행 코드</span>
            <span class="accordion-icon">▼</span>
          </button>
          <div class="accordion-body">
            <div class="accordion-content">
              <div class="code-block">
                <div class="code-block-header">
                  <span>Python</span>
                  <button class="copy-btn" onclick="copyCode(this)">복사</button>
                </div>
                <pre><code class="language-python">${escapeHtml(q.prerequisiteCode)}</code></pre>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    // Navigation
    const total = examData.questions.length;
    const viewedCount = getProgress()[examId]?.viewed.length || 0;
    const allDone = viewedCount >= total;

    let completionHtml = '';
    if (isLast && (alreadyAnswered || q.type === 'code')) {
      completionHtml = `
        <div class="card text-center mt-xl" style="background: var(--color-primary-container); border: 2px solid var(--color-primary);" id="completion-card">
          <div style="font-size: 2.5rem; margin-bottom: 0.75rem;">🎓</div>
          <h2 style="color: var(--color-on-primary-container); margin-bottom: 0.5rem;">
            ${allDone ? '모의고사 1회를 모두 완료했습니다!' : '마지막 문제입니다'}
          </h2>
          <p class="text-sm" style="color: var(--color-on-primary-container); opacity: 0.8; margin-bottom: 1.5rem;">
            ${allDone ? `총 ${total}문항 학습 완료` : `${viewedCount}/${total} 문항 학습 완료`}
          </p>
          <div class="flex flex-center gap-md" style="flex-wrap: wrap;">
            <a href="lobby.html" class="btn btn-primary">📋 로비로 돌아가기</a>
            <button class="btn btn-secondary" onclick="navigateTo(0)">🔄 처음부터 다시 보기</button>
          </div>
        </div>
      `;
    }

    const navHtml = `
      ${completionHtml}
      <div class="question-nav">
        <button class="btn btn-secondary btn-sm" ${isFirst ? 'disabled' : ''} onclick="navigateTo(${currentQ - 1})">
          ← 이전 문제
        </button>
        <span class="text-sm text-muted">Q${q.id} / ${total}</span>
        ${isLast
          ? '<a href="lobby.html" class="btn btn-primary btn-sm">📋 로비로 돌아가기</a>'
          : `<button class="btn btn-primary btn-sm" onclick="navigateTo(${currentQ + 1})">다음 문제 →</button>`
        }
      </div>
    `;

    // --- MCQ Type ---
    if (q.choices && q.choices.length > 0) {
      const correctIdx = q.answer ? parseInt(q.answer) - 1 : -1;

      let choicesHtml;
      if (alreadyAnswered) {
        // Already answered: show result state
        choicesHtml = q.choices.map((c, i) => {
          const isCorrect = i === correctIdx;
          const wasSelected = i === alreadyAnswered.selected;
          let cls = '';
          if (isCorrect) cls = ' correct';
          else if (wasSelected && !alreadyAnswered.isCorrect) cls = ' wrong';
          return `
            <li class="choice-item${cls}" style="cursor: default;">
              <span class="choice-num">${i + 1}</span>
              <span>${escapeHtml(c)}</span>
              ${isCorrect ? '<span style="margin-left:auto;font-size:0.8rem;">✓ 정답</span>' : ''}
              ${wasSelected && !alreadyAnswered.isCorrect ? '<span style="margin-left:auto;font-size:0.8rem;">✗ 선택</span>' : ''}
            </li>
          `;
        }).join('');
      } else {
        // Not answered: clickable choices
        choicesHtml = q.choices.map((c, i) => `
          <li class="choice-item choice-clickable" data-choice="${i}" style="cursor: pointer;">
            <span class="choice-num">${i + 1}</span>
            <span>${escapeHtml(c)}</span>
          </li>
        `).join('');
      }

      main.innerHTML = `
        <div class="animate-in">
          <span class="badge mb-sm">${q.category}</span>
          <h1 style="margin-bottom: 1rem;">문제 ${q.id}. ${q.title}</h1>

          <div class="card mb-md">
            <h4 style="margin-bottom: 0.75rem;">📋 문제</h4>
            <ul style="list-style: disc; padding-left: 1.5rem; line-height: 2;">
              ${problemHtml}
            </ul>
          </div>

          ${prereqHtml}

          <h4 style="margin-top: 1.5rem; margin-bottom: 0.5rem;">${alreadyAnswered ? '결과' : '선택지를 클릭하세요'}</h4>
          <ul class="choice-list" id="choice-list">
            ${choicesHtml}
          </ul>

          <!-- Result area (hidden until answered) -->
          <div id="result-area">${alreadyAnswered ? buildResultHtml(q, alreadyAnswered) : ''}</div>

          ${navHtml}
        </div>
      `;

      // Attach click handlers if not yet answered
      if (!alreadyAnswered) {
        main.querySelectorAll('.choice-clickable').forEach(li => {
          li.addEventListener('click', () => handleChoiceClick(q, parseInt(li.dataset.choice)));
        });
      }

    // --- Code Type ---
    } else {
      main.innerHTML = `
        <div class="animate-in">
          <span class="badge mb-sm">${q.category}</span>
          <h1 style="margin-bottom: 1rem;">문제 ${q.id}. ${q.title}</h1>

          <div class="card mb-md">
            <h4 style="margin-bottom: 0.75rem;">📋 문제</h4>
            <ul style="list-style: disc; padding-left: 1.5rem; line-height: 2;">
              ${problemHtml}
            </ul>
          </div>

          ${prereqHtml}

          <div id="result-area">
            ${alreadyAnswered ? buildCodeResultHtml(q) : `
              <div class="text-center mt-xl mb-lg">
                <p class="text-muted mb-md">코드를 직접 작성해본 후 정답을 확인하세요.</p>
                <button class="btn btn-primary btn-lg" id="reveal-btn">
                  🔓 정답 및 해설 보기
                </button>
              </div>
            `}
          </div>

          ${navHtml}
        </div>
      `;

      if (!alreadyAnswered) {
        const revealBtn = document.getElementById('reveal-btn');
        if (revealBtn) {
          revealBtn.addEventListener('click', () => {
            answered[q.id] = { revealed: true };
            document.getElementById('result-area').innerHTML = buildCodeResultHtml(q);
            if (window.Prism) Prism.highlightAll();
            markViewed(q.id);
          });
        }
      }
    }

    if (window.Prism) Prism.highlightAll();
    if (alreadyAnswered) markViewed(q.id);
  }

  // --- Handle MCQ Choice Click ---
  function handleChoiceClick(q, selectedIdx) {
    const correctIdx = parseInt(q.answer) - 1;
    const isCorrect = selectedIdx === correctIdx;

    answered[q.id] = { selected: selectedIdx, isCorrect: isCorrect };

    // Update choice list UI
    const items = document.querySelectorAll('#choice-list .choice-item');
    items.forEach((li, i) => {
      li.classList.remove('choice-clickable');
      li.style.cursor = 'default';
      if (i === correctIdx) {
        li.classList.add('correct');
        li.innerHTML += '<span style="margin-left:auto;font-size:0.8rem;">✓ 정답</span>';
      } else if (i === selectedIdx && !isCorrect) {
        li.classList.add('wrong');
        li.innerHTML += '<span style="margin-left:auto;font-size:0.8rem;">✗ 선택</span>';
      }
      // Remove click
      li.replaceWith(li.cloneNode(true));
    });

    // Show result
    const resultArea = document.getElementById('result-area');
    resultArea.innerHTML = buildResultHtml(q, answered[q.id]);
    resultArea.scrollIntoView({ behavior: 'smooth', block: 'start' });

    if (window.Prism) Prism.highlightAll();
    markViewed(q.id);
  }

  // --- Build Result HTML (MCQ) ---
  function buildResultHtml(q, result) {
    const feedbackHtml = result.isCorrect
      ? `<div class="card mb-md" style="background: var(--color-success-light); border: 2px solid var(--color-success);">
           <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">🎉</div>
           <h3 style="color: var(--color-success);">정답입니다!</h3>
         </div>`
      : `<div class="card mb-md" style="background: var(--color-error-container); border: 2px solid var(--color-error); opacity: 0.9;">
           <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">😢</div>
           <h3 style="color: var(--color-error);">오답입니다</h3>
           <p class="text-sm mt-sm">정답: <strong>${escapeHtml(q.answerDisplay || '②')}</strong></p>
         </div>`;

    return `
      <div class="animate-in">
        ${feedbackHtml}
        ${buildSolutionSection(q)}
      </div>
    `;
  }

  // --- Build Code Result HTML ---
  function buildCodeResultHtml(q) {
    let answerHtml = '';
    if (q.answerDisplay) {
      answerHtml = `
        <div class="answer-card">
          <div class="answer-label">결과</div>
          <div class="answer-value">${escapeHtml(q.answerDisplay)}</div>
        </div>
      `;
    }
    return `
      <div class="animate-in">
        ${answerHtml}
        ${buildSolutionSection(q)}
      </div>
    `;
  }

  // --- Build Solution Section (shared) ---
  function buildSolutionSection(q) {
    let codeHtml = '';
    if (q.code) {
      codeHtml = `
        <h4 style="margin-top: 1.5rem; margin-bottom: 0.5rem;">코드</h4>
        <div class="code-block">
          <div class="code-block-header">
            <span>Python</span>
            <button class="copy-btn" onclick="copyCode(this)">복사</button>
          </div>
          <pre><code class="language-python">${escapeHtml(q.code)}</code></pre>
        </div>
      `;
    }

    let explanationHtml = '';
    if (q.explanation) {
      explanationHtml = `
        <div class="accordion mt-lg">
          <button class="accordion-header" aria-expanded="true" onclick="toggleAccordion(this)">
            <span>💡 해설</span>
            <span class="accordion-icon" style="transform: rotate(180deg);">▼</span>
          </button>
          <div class="accordion-body open">
            <div class="accordion-content">
              <p style="line-height: 1.8;">${escapeHtml(q.explanation)}</p>
              ${q.tip ? `
                <div class="tip-box mt-md">
                  <span class="tip-icon">📌</span>
                  <span>${escapeHtml(q.tip)}</span>
                </div>
              ` : ''}
            </div>
          </div>
        </div>
      `;
    }

    const colabUrl = 'https://colab.research.google.com/github/ashram68/bigdata-analytics-exam/blob/main/data/exam-01/exam-01_type1.ipynb';
    const actionsHtml = `
      <div class="flex flex-wrap gap-sm mt-lg">
        <a href="${colabUrl}" target="_blank" rel="noopener" class="btn btn-primary btn-sm" onclick="event.preventDefault(); if(window.openColabWithNotice){openColabWithNotice(this.href);}else{window.open(this.href,'_blank','noopener');} return false;">
          🔗 Google Colab 실습
        </a>
        <button class="btn btn-secondary btn-sm" onclick="openSearch()">
          🔍 라이브러리 문서 검색
        </button>
      </div>
    `;

    return `${codeHtml}${explanationHtml}${actionsHtml}`;
  }

  // --- Prerequisite Page ---
  function renderPrerequisite() {
    const main = document.getElementById('viewer-main');
    main.innerHTML = `
      <div class="animate-in">
        <span class="badge mb-sm">공통</span>
        <h1 style="margin-bottom: 1rem;">사전 실행 코드</h1>
        <p class="text-muted mb-md">모든 문제를 풀기 전에 아래 코드를 먼저 실행하세요.</p>

        <div class="code-block">
          <div class="code-block-header">
            <span>Python</span>
            <button class="copy-btn" onclick="copyCode(this)">복사</button>
          </div>
          <pre><code class="language-python">${escapeHtml(examData.prerequisiteCode)}</code></pre>
        </div>

        <div class="tip-box mt-lg">
          <span class="tip-icon">📌</span>
          <span>이 코드는 pandas, numpy, matplotlib를 임포트하고 titanic.csv 데이터를 df 변수로 로드합니다. 모든 문항에서 이 변수들을 사용합니다.</span>
        </div>

        <div style="margin-top: 2rem;">
          <button class="btn btn-primary" onclick="navigateTo(0)">문제 1로 이동 →</button>
        </div>
      </div>
    `;
    if (window.Prism) Prism.highlightAll();
    document.querySelectorAll('#sidebar-items .sidebar-item').forEach(b => b.classList.remove('active'));
    document.getElementById('prereq-btn').classList.add('active');
  }

  // --- Navigation ---
  window.navigateTo = function (index) {
    if (index < 0 || index >= examData.questions.length) return;
    currentQ = index;
    renderQuestion(examData.questions[currentQ]);
    updateSidebarStates();
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const url = new URL(window.location);
    url.searchParams.set('q', examData.questions[currentQ].id);
    history.replaceState(null, '', url);

    document.getElementById('prereq-btn').classList.remove('active');
  };

  // --- Accordion ---
  window.toggleAccordion = function (header) {
    const body = header.nextElementSibling;
    const isOpen = body.classList.contains('open');
    body.classList.toggle('open');
    header.setAttribute('aria-expanded', !isOpen);
  };

  // --- Copy Code ---
  window.copyCode = function (btn) {
    const code = btn.closest('.code-block').querySelector('code').textContent;
    navigator.clipboard.writeText(code).then(() => {
      btn.textContent = '복사됨!';
      btn.classList.add('copied');
      setTimeout(() => {
        btn.textContent = '복사';
        btn.classList.remove('copied');
      }, 1500);
    });
  };

  // --- Search ---
  window.openSearch = function () {
    const query = prompt('검색할 라이브러리 또는 함수명을 입력하세요.\n(예: pandas.DataFrame.corr, seaborn.countplot)');
    if (query) {
      window.open(`https://www.google.com/search?q=${encodeURIComponent(query + ' python documentation site:pandas.pydata.org OR site:seaborn.pydata.org OR site:scikit-learn.org OR site:tensorflow.org')}`, '_blank');
    }
  };

  // --- Prereq Button ---
  document.getElementById('prereq-btn').addEventListener('click', renderPrerequisite);

  // --- Utility ---
  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  // --- Init ---
  fetch(`data/${examId}/solutions.json`)
    .then(r => r.json())
    .then(data => {
      examData = data;
      renderSidebar();
      updateHeaderProgress();

      const qIndex = data.questions.findIndex(q => q.id === startQ);
      currentQ = qIndex >= 0 ? qIndex : 0;
      renderQuestion(data.questions[currentQ]);
      updateSidebarStates();
    })
    .catch(err => {
      console.error('Failed to load solutions:', err);
      document.getElementById('viewer-main').innerHTML = '<div class="p-xl text-center"><p class="text-muted">데이터를 불러올 수 없습니다.</p><a href="lobby.html" class="btn btn-primary mt-md">로비로 돌아가기</a></div>';
    });
})();
