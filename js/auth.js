/**
 * OTP Authentication (page-challenge mode):
 *   페이지 챌린지: 랜덤 페이지 1개 표시 → 사용자가 해당 페이지 인쇄 코드 입력
 *   → SHA-256 해시 → page_codes[currentPage] 와 일치 검사
 */
(function () {
  const inputs = document.querySelectorAll('.otp-input');
  const form = document.getElementById('auth-form');
  const verifyBtn = document.getElementById('verify-btn');
  const errorMsg = document.getElementById('error-msg');
  const lockoutMsg = document.getElementById('lockout-msg');
  const pageNumberEl = document.getElementById('page-number');

  let failCount = 0;
  let lockUntil = 0;
  let codesData = null;
  let currentPage = null;

  // Load codes on init + pick random page challenge
  // (cache-buster: codes.json schema changed from `codes[]` → `page_codes{}`)
  fetch('data/codes.json?v=2')
    .then(r => r.json())
    .then(data => {
      codesData = data;
      const pages = Object.keys(data.page_codes || {});
      if (pages.length === 0) {
        console.error('codes.json has no page_codes');
        return;
      }
      currentPage = pages[Math.floor(Math.random() * pages.length)];
      if (pageNumberEl) pageNumberEl.textContent = currentPage;
    })
    .catch(() => { console.error('Failed to load codes.json'); });

  // --- OTP Input UX ---
  inputs.forEach((input, i) => {
    input.addEventListener('input', () => {
      input.value = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (input.value && i < inputs.length - 1) {
        inputs[i + 1].focus();
      }
      updateButtonState();
      clearError();
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !input.value && i > 0) {
        inputs[i - 1].focus();
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        if (!verifyBtn.disabled) form.dispatchEvent(new Event('submit'));
      }
    });

    input.addEventListener('focus', () => input.select());

    // Handle paste
    input.addEventListener('paste', (e) => {
      e.preventDefault();
      const pasted = (e.clipboardData.getData('text') || '')
        .toUpperCase().replace(/[^A-Z0-9]/g, '');
      for (let j = 0; j < pasted.length && (i + j) < inputs.length; j++) {
        inputs[i + j].value = pasted[j];
      }
      const nextIdx = Math.min(i + pasted.length, inputs.length - 1);
      inputs[nextIdx].focus();
      updateButtonState();
    });
  });

  function getCode() {
    return Array.from(inputs).map(i => i.value).join('');
  }

  function updateButtonState() {
    const code = getCode();
    verifyBtn.disabled = code.length < 6 || Date.now() < lockUntil;
  }

  function clearError() {
    errorMsg.classList.remove('show');
    inputs.forEach(i => i.classList.remove('error'));
  }

  function showError(msg) {
    errorMsg.textContent = msg;
    errorMsg.classList.add('show');
    inputs.forEach(i => i.classList.add('error'));
    // Remove shake after animation
    setTimeout(() => inputs.forEach(i => i.classList.remove('error')), 400);
  }

  // --- SHA-256 Hash ---
  async function sha256(text) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // --- Form Submit ---
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (Date.now() < lockUntil) return;
    if (!codesData) {
      showError('데이터를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    const code = getCode();
    if (code.length !== 6) return;

    verifyBtn.disabled = true;
    verifyBtn.textContent = '확인 중...';

    const hash = await sha256(code);
    const expectedHash = codesData.page_codes && codesData.page_codes[currentPage];
    const isValid = !!expectedHash && hash === expectedHash;

    if (isValid) {
      // Success
      inputs.forEach(i => i.classList.add('success'));
      verifyBtn.textContent = '인증 완료!';

      localStorage.setItem('bigdata_auth', JSON.stringify({
        authenticated: true,
        timestamp: Date.now()
      }));

      setTimeout(() => {
        window.location.href = 'lobby.html';
      }, 600);
    } else {
      // Failure
      failCount++;
      verifyBtn.textContent = '인증하기';

      if (failCount >= 5) {
        lockUntil = Date.now() + 30000;
        verifyBtn.disabled = true;
        showError('입력 횟수를 초과했습니다.');
        startLockoutTimer();
      } else {
        showError(`인증 코드가 올바르지 않습니다. (${failCount}/5)`);
        updateButtonState();
      }
    }
  });

  function startLockoutTimer() {
    const interval = setInterval(() => {
      const remaining = Math.ceil((lockUntil - Date.now()) / 1000);
      if (remaining <= 0) {
        clearInterval(interval);
        lockoutMsg.style.display = 'none';
        failCount = 0;
        updateButtonState();
        clearError();
        return;
      }
      lockoutMsg.style.display = 'block';
      lockoutMsg.textContent = `${remaining}초 후 다시 시도할 수 있습니다.`;
    }, 200);
  }

  // Auto-focus first input
  if (inputs[0]) inputs[0].focus();
})();
