<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js"></script>
<script>
const SUPABASE_URL = "https://ixywyoutlmagbmzmbsen.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4eXd5b3V0bG1hZ2Jtem1ic2VuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkyNjQ5OTEsImV4cCI6MjA2NDg0MDk5MX0.7Nb0ClJPycHByycXirFj_-BQR-8WTGbt44LRIAyOo9E";
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let totalAmount = 0;
let supporterCount = 0;
const targetAmount = 1000000;

document.addEventListener('DOMContentLoaded', function () {
  loadSupporters();
  initAmountOptions();
});

async function loadSupporters() {
  const { data, error } = await supabase.from('supporters').select('*').order('id', { ascending: false });

  if (error) {
    console.error('후원자 로드 오류:', error);
    showError('데이터를 불러오는데 실패했습니다.');
    return;
  }

  const supporters = data || [];
  supporterCount = supporters.length;
  totalAmount = supporters.reduce((sum, s) => sum + s.amount, 0);

  updateStats();
  renderSupporters(supporters);
}

function updateStats() {
  document.getElementById('totalAmount').textContent = totalAmount.toLocaleString();
  document.getElementById('supporterCount').textContent = supporterCount;

  const percentage = Math.min((totalAmount / targetAmount) * 100, 100);
  document.getElementById('progressFill').style.width = percentage + '%';
  document.getElementById('progressPercent').textContent = Math.round(percentage) + '%';

  for (let i = 1; i <= 7; i++) {
    const goal = document.getElementById(`goal${i}`);
    const goalAmount = parseInt(goal.querySelector('.goal-amount').textContent.replace(/[^0-9]/g, ''));
    if (totalAmount >= goalAmount) {
      goal.classList.add('achieved');
    } else {
      goal.classList.remove('achieved');
    }
  }
}

function renderSupporters(supporters) {
  const html = supporters.length === 0
    ? '<div class="no-supporters">아직 후원자가 없습니다.</div>'
    : supporters.map(s => `
      <div class="supporter-item" data-id="${s.id}">
        <div class="supporter-info">
          <div class="supporter-name">${escapeHtml(s.nickname)}</div>
          <div class="supporter-message">${escapeHtml(s.message)}</div>
          <div class="verification-badge">✓ 후원 완료</div>
        </div>
        <div class="supporter-amount">${s.amount.toLocaleString()}원</div>
        <button class="delete-btn" onclick="deleteSupporter(${s.id})">삭제</button>
      </div>
    `).join('');

  const list = document.getElementById('supportersList');
  if (list) list.innerHTML = html;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function initAmountOptions() {
  const options = document.querySelectorAll('.amount-option');
  options.forEach(option => {
    option.addEventListener('click', function () {
      options.forEach(o => o.classList.remove('selected'));
      this.classList.add('selected');
      document.getElementById('customAmount').value = this.dataset.amount;
    });
  });
}

async function addSupporter() {
  const nickname = document.getElementById('nickname').value.trim();
  const amount = parseInt(document.getElementById('customAmount').value);
  const message = document.getElementById('message').value.trim();
  const password = document.getElementById('deletePassword').value.trim();

  if (!nickname || !amount || !message || !password) return showError('모든 항목을 입력해주세요!');
  if (amount <= 0) return showError('올바른 금액을 입력해주세요!');
  if (password.length !== 4) return showError('삭제용 비밀번호는 4자리로 입력해주세요!');

  const submitBtn = document.getElementById('submitBtn');
  submitBtn.disabled = true;
  submitBtn.textContent = '후원 중...';

  const { data, error } = await supabase.from('supporters').insert([{
    nickname,
    amount,
    message,
    password
  }]);

  if (error) {
    showError('후원에 실패했습니다.');
    console.error(error);
  } else {
    showSuccess('후원 감사합니다!');
    resetForm();
    loadSupporters();
  }

  submitBtn.disabled = false;
  submitBtn.textContent = '후원하기';
}

async function deleteSupporter(id) {
  const password = prompt('삭제용 비밀번호를 입력하세요:');
  if (!password) return;

  const { data, error } = await supabase.from('supporters').select('password').eq('id', id).single();
  if (error || !data) return showError('삭제 대상이 존재하지 않거나 오류가 발생했습니다.');

  if (data.password !== password) return showError('비밀번호가 일치하지 않습니다.');

  const { error: deleteError } = await supabase.from('supporters').delete().eq('id', id);
  if (deleteError) {
    console.error(deleteError);
    showError('삭제 실패');
  } else {
    showSuccess('삭제 완료');
    loadSupporters();
  }
}

function resetForm() {
  document.getElementById('nickname').value = '';
  document.getElementById('customAmount').value = '';
  document.getElementById('message').value = '';
  document.getElementById('deletePassword').value = '';
  document.querySelectorAll('.amount-option').forEach(o => o.classList.remove('selected'));
}

function showError(msg) {
  alert('❌ ' + msg);
}

function showSuccess(msg) {
  alert('✅ ' + msg);
}
</script>
