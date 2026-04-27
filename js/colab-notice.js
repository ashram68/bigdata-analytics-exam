/**
 * Colab Notice Modal
 * - 사용자가 Colab 링크를 클릭할 때, Google의 "not authored by Google" 경고에 대한
 *   안내 모달을 1회 노출한다.
 * - "다시 보지 않기" 체크 시 localStorage에 플래그를 저장하여 재노출하지 않는다.
 * - 전역 window.openColabWithNotice(url) 함수만 노출한다.
 */
(function () {
  const DISMISSED_KEY = 'bigdata_colab_notice_dismissed';

  function isDismissed() {
    try {
      return localStorage.getItem(DISMISSED_KEY) === '1';
    } catch (e) { return false; }
  }

  function setDismissed() {
    try { localStorage.setItem(DISMISSED_KEY, '1'); } catch (e) {}
  }

  function openUrl(url) {
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  function buildModal() {
    const modal = document.createElement('div');
    modal.id = 'colab-notice-modal';
    modal.className = 'modal-backdrop hidden';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'colab-notice-title');
    modal.innerHTML = [
      '<div class="modal-card" role="document">',
      '  <div class="modal-header">',
      '    <h3 id="colab-notice-title">⚠️ Google Colab 안내</h3>',
      '    <button class="modal-close" type="button" aria-label="닫기">×</button>',
      '  </div>',
      '  <div class="modal-body">',
      '    <p>Colab 첫 실행 시 다음과 같은 Google 기본 보안 경고가 표시됩니다.</p>',
      '    <div class="modal-quote">경고: 이 노트북은 Google에서 작성하지 않았습니다</div>',
      '    <p>이는 GitHub 등 외부 저장소에서 불러오는 모든 노트북에 표시되는 <strong>Google의 기본 보안 정책</strong>입니다. 아래 <strong>[Colab으로 이동]</strong> 버튼을 눌러 Colab으로 이동한 후, 경고 창의 <strong>[무시하고 계속]</strong> 버튼을 클릭하시면 정상적으로 응시하실 수 있습니다.</p>',
      '    <div class="tip-box" style="margin: 1rem 0 0;">',
      '      <span class="tip-icon">📌</span>',
      '      <span><strong>팁:</strong> Colab 상단 메뉴에서 <code>파일 &gt; 드라이브에 사본 저장</code>을 이용하시면 다음 접속부터는 본인 사본이므로 경고가 표시되지 않습니다.</span>',
      '    </div>',
      '  </div>',
      '  <div class="modal-footer">',
      '    <label class="modal-checkbox">',
      '      <input type="checkbox" id="colab-notice-dont-show">',
      '      <span>다시 보지 않기</span>',
      '    </label>',
      '    <div class="modal-actions">',
      '      <button type="button" class="btn btn-secondary btn-sm" data-action="cancel">취소</button>',
      '      <button type="button" class="btn btn-primary btn-sm" data-action="confirm">Colab으로 이동</button>',
      '    </div>',
      '  </div>',
      '</div>'
    ].join('');
    document.body.appendChild(modal);
    return modal;
  }

  let modalEl = null;
  let currentUrl = null;

  function ensureModal() {
    if (modalEl) return modalEl;
    modalEl = buildModal();

    const close = function () { modalEl.classList.add('hidden'); };

    modalEl.querySelector('.modal-close').addEventListener('click', close);
    modalEl.querySelector('[data-action="cancel"]').addEventListener('click', close);
    modalEl.addEventListener('click', function (e) {
      if (e.target === modalEl) close();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !modalEl.classList.contains('hidden')) close();
    });

    modalEl.querySelector('[data-action="confirm"]').addEventListener('click', function () {
      const dontShow = modalEl.querySelector('#colab-notice-dont-show');
      if (dontShow && dontShow.checked) setDismissed();
      close();
      if (currentUrl) openUrl(currentUrl);
    });

    return modalEl;
  }

  window.openColabWithNotice = function (url) {
    if (!url) return;
    if (isDismissed()) {
      openUrl(url);
      return;
    }
    const modal = ensureModal();
    currentUrl = url;
    const dontShow = modal.querySelector('#colab-notice-dont-show');
    if (dontShow) dontShow.checked = false;
    modal.classList.remove('hidden');
  };
})();
