// Google Sheets Web App URL
const API_URL = 'https://script.google.com/macros/s/AKfycbzQxvyZdUd27yDquryUmiOpx8Q4t76zYND0Udh7izrdRwlcjg2DSNKzf6ysWU5DB8FdGQ/exec';

// 전역 변수
let totalAmount = 0;
let supporterCount = 0;
const targetAmount = 1000000;

// 페이지 로드시 초기화
document.addEventListener('DOMContentLoaded', function () {
    loadSupporters();
    initAmountOptions();
});

// 후원자 데이터 불러오기 (Google Sheets)
async function loadSupporters() {
    try {
        const res = await fetch(API_URL);
        const data = await res.json();

        totalAmount = data.totalAmount;
        supporterCount = data.supporterCount;

        updateStats();
        renderSupporters(data.supporters);
    } catch (error) {
        console.error('후원자 로드 오류:', error);
        showError('데이터를 불러오는데 실패했습니다.');
    }
}

// POST 요청: JSON 말고 폼데이터 방식
async function addSupporter() {
  const nickname = document.getElementById('nickname').value.trim();
  const amount = parseInt(document.getElementById('customAmount').value);
  const message = document.getElementById('message').value.trim();
  const password = document.getElementById('deletePassword').value.trim();

  if (!nickname || !amount || !message || !password) {
    showError('모든 항목을 입력해주세요!');
    return;
  }

  const submitBtn = document.getElementById('submitBtn');
  submitBtn.disabled = true;
  submitBtn.textContent = '후원 중...';

  const form = new URLSearchParams();
  form.append('nickname', nickname);
  form.append('amount', amount);
  form.append('message', message);
  form.append('password', password);

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      body: form
    });

    const result = await res.json();

    if (!result.success) {
      throw new Error('후원 저장 실패');
    }

    await loadSupporters();
    resetForm();
    showSuccess('후원해주셔서 감사합니다!');
  } catch (e) {
    console.error('후원 오류 (Google Sheets):', e);
    showError('저장 중 오류가 발생했습니다.');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = '후원하기';
  }
}



// 통계 업데이트
function updateStats() {
    document.getElementById('totalAmount').textContent = totalAmount.toLocaleString();
    document.getElementById('supporterCount').textContent = supporterCount;

    const percentage = Math.min((totalAmount / targetAmount) * 100, 100);
    document.getElementById('progressFill').style.width = percentage + '%';
    document.getElementById('progressPercent').textContent = Math.round(percentage) + '%';

    updateGoalStatus(1, 100000);
    updateGoalStatus(2, 200000);
    updateGoalStatus(3, 300000);
    updateGoalStatus(4, 400000);
    updateGoalStatus(5, 500000);
    updateGoalStatus(6, 700000);
    updateGoalStatus(7, 1000000);
}

// 목표 달성 상태 업데이트
function updateGoalStatus(goalNumber, target) {
    const goalElement = document.getElementById(`goal${goalNumber}`);
    if (totalAmount >= target) {
        goalElement.classList.add('achieved');
    } else {
        goalElement.classList.remove('achieved');
    }
}

// 후원자 목록 렌더링
function renderSupporters(supporters) {
    const supportersList = document.getElementById('supportersList');
    const mainSupportersList = document.getElementById('mainSupportersList');

    const html = getSupportersHTML(supporters);

    if (supportersList) supportersList.innerHTML = html;
    if (mainSupportersList) mainSupportersList.innerHTML = html;
}

// 후원자 HTML 생성
function getSupportersHTML(supporters) {
    if (!supporters || supporters.length === 0) {
        return '<div class="no-supporters">아직 후원자가 없습니다.</div>';
    }

    return supporters.map(s => `
        <div class="supporter-item">
            <div class="supporter-info">
                <div class="supporter-name">${escapeHtml(s.nickname)}</div>
                <div class="supporter-message">${escapeHtml(s.message)}</div>
                <div class="verification-badge">✓ 후원 완료</div>
            </div>
            <div class="supporter-amount">${Number(s.amount).toLocaleString()}원</div>
        </div>
    `).join('');
}

// 금액 옵션 초기화
function initAmountOptions() {
    const options = document.querySelectorAll('.amount-option');
    options.forEach(option => {
        option.addEventListener('click', function () {
            options.forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
            document.getElementById('customAmount').value = this.dataset.amount;
        });
    });
}

// 입력 폼 초기화
function resetForm() {
    document.getElementById('nickname').value = '';
    document.getElementById('customAmount').value = '';
    document.getElementById('message').value = '';
    document.getElementById('deletePassword').value = '';
    document.querySelectorAll('.amount-option').forEach(opt => opt.classList.remove('selected'));
}

// HTML 이스케이프
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 알림 함수들
function showError(msg) {
    alert('❌ ' + msg);
}

function showSuccess(msg) {
    alert('✅ ' + msg);
}

// (선택) 탭 전환 함수
function switchTab(event, tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));

    event.target.classList.add('active');
    document.getElementById(tabName + '-panel').classList.add('active');
}
