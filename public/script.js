<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js"></script>
<script>
  const SUPABASE_URL = "https://ixywyoutlmagbmzmbsen.supabase.co";
  const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4eXd5b3V0bG1hZ2Jtem1ic2VuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkyNjQ5OTEsImV4cCI6MjA2NDg0MDk5MX0.7Nb0ClJPycHByycXirFj_-BQR-8WTGbt44LRIAyOo9E";

  const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  // 데이터 불러오기
  async function loadSupporters() {
    const { data, error } = await supabase
      .from('supporters')
      .select('*')
      .order('timestamp', { ascending: false });

    if (error) {
      console.error(error);
      alert('불러오기 실패: ' + error.message);
      return;
    }

    updateStats(data);
    renderSupporters(data);
  }

  // 통계 업데이트
  function updateStats(supporters) {
    const totalAmount = supporters.reduce((sum, s) => sum + s.amount, 0);
    const supporterCount = supporters.length;
    const targetAmount = 1000000;

    document.getElementById('totalAmount').textContent = totalAmount.toLocaleString();
    document.getElementById('supporterCount').textContent = supporterCount;

    const percent = Math.min((totalAmount / targetAmount) * 100, 100);
    document.getElementById('progressFill').style.width = percent + '%';
    document.getElementById('progressPercent').textContent = Math.round(percent) + '%';
  }

  // 후원자 추가
  async function addSupporter() {
    const nickname = document.getElementById('nickname').value.trim();
    const amount = parseInt(document.getElementById('customAmount').value);
    const message = document.getElementById('message').value.trim();
    const password = document.getElementById('deletePassword').value.trim();

    if (!nickname || !amount || !message || !password) {
      alert('모든 항목을 입력해주세요');
      return;
    }

    const { error } = await supabase
      .from('supporters')
      .insert([{ nickname, amount, message, password }]);

    if (error) {
      console.error(error);
      alert('저장 실패: ' + error.message);
      return;
    }

    alert('후원 완료!');
    resetForm();
    loadSupporters();
  }

  // 후원자 리스트 HTML 렌더
  function renderSupporters(supporters) {
    const container = document.getElementById('supportersList');
    if (!container) return;

    if (supporters.length === 0) {
      container.innerHTML = '<div class="no-supporters">아직 후원자가 없습니다.</div>';
      return;
    }

    container.innerHTML = supporters.map(s => `
      <div class="supporter-item">
        <div class="supporter-info">
          <div class="supporter-name">${escapeHtml(s.nickname)}</div>
          <div class="supporter-message">${escapeHtml(s.message)}</div>
          <div class="verification-badge">✓ 후원 완료</div>
        </div>
        <div class="supporter-amount">${s.amount.toLocaleString()}원</div>
      </div>
    `).join('');
  }

  // 기타
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function resetForm() {
    document.getElementById('nickname').value = '';
    document.getElementById('customAmount').value = '';
    document.getElementById('message').value = '';
    document.getElementById('deletePassword').value = '';
    document.querySelectorAll('.amount-option').forEach(opt => opt.classList.remove('selected'));
  }

  // 초기화
  document.addEventListener('DOMContentLoaded', () => {
    initAmountOptions();
    loadSupporters();
  });

  function initAmountOptions() {
    const options = document.querySelectorAll('.amount-option');
    options.forEach(opt => {
      opt.addEventListener('click', function () {
        options.forEach(o => o.classList.remove('selected'));
        this.classList.add('selected');
        document.getElementById('customAmount').value = this.dataset.amount;
      });
    });
  }
</script>
