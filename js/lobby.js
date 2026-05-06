/**
 * Lobby: 회차 카드 그리드 + 1·2·3유형 분리 진입 + 사이드바 통계
 */
(function () {
  const PROGRESS_KEY = 'bigdata_progress';

  function getProgress() {
    try {
      return JSON.parse(localStorage.getItem(PROGRESS_KEY)) || {};
    } catch (e) { return {}; }
  }

  function renderStats(exams) {
    const progress = getProgress();
    let totalViewed = 0;
    let activeExams = 0;

    exams.forEach(exam => {
      if (!exam.enabled) return;
      const p = progress[exam.id];
      const viewed = p ? (p.viewed || []).length : 0;
      totalViewed += viewed;
      activeExams++;
    });

    document.getElementById('stat-total-exams').textContent = exams.length;
    document.getElementById('stat-active-exams').textContent = activeExams;
    document.getElementById('stat-viewed').textContent = totalViewed;
    // 진행률은 회차당 6~8문항 가변이라 단순 카운트만 표시
    document.getElementById('stat-progress').textContent = totalViewed > 0 ? totalViewed + '문항' : '0문항';
  }

  function typeButton(typeKey, typeData, examId) {
    if (!typeData) return '';
    const disabled = !typeData.enabled;
    const cls = disabled ? 'lobby-btn lobby-btn-outline' : 'lobby-btn lobby-btn-colab';
    const onclick = disabled ? '' :
      `event.preventDefault(); if(window.openColabWithNotice){openColabWithNotice('${typeData.colabUrl}');}else{window.open('${typeData.colabUrl}','_blank','noopener');}`;
    const dim = disabled ? ' style="opacity:0.45;"' : '';
    return `
      <button class="${cls}"${dim} ${disabled ? 'disabled' : ''} onclick="${onclick}">
        ${typeData.name} · ${typeData.label} (${typeData.score}점)
      </button>
    `;
  }

  function renderExamCards(exams) {
    const grid = document.getElementById('exam-grid');

    grid.innerHTML = exams.map(exam => {
      const titleHtml = exam.subtitle ? `${exam.title}: ${exam.subtitle}` : exam.title;
      if (!exam.enabled) {
        return `
          <div class="lobby-card lobby-card-disabled">
            <h3 class="lobby-card-title">${titleHtml}</h3>
            <p class="lobby-card-desc">${(exam.description || '').replace(/\n/g, '<br>')}</p>
            <div class="lobby-card-buttons">
              <button class="lobby-btn lobby-btn-outline" disabled>준비 중</button>
            </div>
          </div>
        `;
      }

      const types = exam.types || {};
      return `
        <div class="lobby-card">
          <h3 class="lobby-card-title">${titleHtml}</h3>
          <p class="lobby-card-desc">${(exam.description || '').replace(/\n/g, '<br>')}</p>
          <div class="lobby-card-buttons">
            ${typeButton('type1', types.type1, exam.id)}
            ${typeButton('type2', types.type2, exam.id)}
            ${typeButton('type3', types.type3, exam.id)}
            <button class="lobby-btn lobby-btn-gray" onclick="location.href='viewer.html?exam=${exam.id}'">정답 및 해설 보기</button>
          </div>
        </div>
      `;
    }).join('');
  }

  // Load data
  fetch('data/exams.json')
    .then(r => r.json())
    .then(data => {
      renderStats(data.exams);
      renderExamCards(data.exams);
    })
    .catch(err => {
      console.error('Failed to load exams:', err);
      document.getElementById('exam-grid').innerHTML = '<p class="text-muted">데이터를 불러올 수 없습니다.</p>';
    });

  // Logout
  document.getElementById('logout-btn').addEventListener('click', function () {
    localStorage.removeItem('bigdata_auth');
    window.location.href = 'auth.html';
  });
})();
