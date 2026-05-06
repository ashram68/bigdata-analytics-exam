/**
 * Lobby Notice Modal
 * - 로비 진입 시 1회 자동 노출 (Colab/로컬 Jupyter 호환 안내).
 * - "다시 보지 않기" 체크 시 localStorage 플래그 저장 → 이후 자동 노출 차단.
 * - 헤더 ⓘ 아이콘 클릭 시 강제 재노출 (dismissed 상태와 무관).
 */
(function () {
  const DISMISSED_KEY = 'bigdata_lobby_notice_dismissed';

  function isDismissed() {
    try { return localStorage.getItem(DISMISSED_KEY) === '1'; }
    catch (e) { return false; }
  }

  function setDismissed() {
    try { localStorage.setItem(DISMISSED_KEY, '1'); } catch (e) {}
  }

  function buildModal() {
    const modal = document.createElement('div');
    modal.id = 'lobby-notice-modal';
    modal.className = 'modal-backdrop hidden';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'lobby-notice-title');
    modal.innerHTML = [
      '<div class="modal-card" role="document">',
      '  <div class="modal-header">',
      '    <h3 id="lobby-notice-title">💡 Colab · 로컬 Jupyter 호환 안내</h3>',
      '    <button class="modal-close" type="button" aria-label="닫기">×</button>',
      '  </div>',
      '  <div class="modal-body">',
      '    <p>코랩(Colab) 환경에서 제공되는 모든 실습 코드는 <strong style="color:#e8621a;">로컬 주피터 노트북에서도 100% 동일하게 실행 가능</strong>합니다.</p>',
      '    <p>여러분의 PC 환경에서도 제약 없이 데이터 분석 역량을 펼쳐보세요.</p>',
      '  </div>',
      '  <div class="modal-footer">',
      '    <label class="modal-checkbox">',
      '      <input type="checkbox" id="lobby-notice-dont-show">',
      '      <span>다시 보지 않기</span>',
      '    </label>',
      '    <div class="modal-actions">',
      '      <button type="button" class="btn btn-primary btn-sm" data-action="confirm">확인</button>',
      '    </div>',
      '  </div>',
      '</div>'
    ].join('');
    document.body.appendChild(modal);
    return modal;
  }

  let modalEl = null;

  function ensureModal() {
    if (modalEl) return modalEl;
    modalEl = buildModal();

    const close = function () { modalEl.classList.add('hidden'); };

    modalEl.querySelector('.modal-close').addEventListener('click', close);
    modalEl.addEventListener('click', function (e) {
      if (e.target === modalEl) close();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !modalEl.classList.contains('hidden')) close();
    });

    modalEl.querySelector('[data-action="confirm"]').addEventListener('click', function () {
      const dontShow = modalEl.querySelector('#lobby-notice-dont-show');
      if (dontShow && dontShow.checked) setDismissed();
      close();
    });

    return modalEl;
  }

  function showModal(forced) {
    if (!forced && isDismissed()) return;
    const modal = ensureModal();
    const dontShow = modal.querySelector('#lobby-notice-dont-show');
    if (dontShow) dontShow.checked = false;
    modal.classList.remove('hidden');
  }

  document.addEventListener('DOMContentLoaded', function () {
    const btn = document.getElementById('lobby-notice-btn');
    if (btn) {
      btn.addEventListener('click', function () { showModal(true); });
    }
    showModal(false);
  });
})();
