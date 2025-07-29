<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js"></script>
<script>
const SUPABASE_URL = "https://ixywyoutlmagbmzmbsen.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4eXd5b3V0bG1hZ2Jtem1ic2VuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkyNjQ5OTEsImV4cCI6MjA2NDg0MDk5MX0.7Nb0ClJPycHByycXirFj_-BQR-8WTGbt44LRIAyOo9E";
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let totalAmount = 0;
let supporterCount = 0;
const targetAmount = 1000000;

document.addEventListener('DOMContentLoaded', function() {
    loadSupporters();
    initAmountOptions();
});

async function loadSupporters() {
    try {
        const { data, error } = await supabase
            .from('supporters')
            .select('*')
            .order('id', { ascending: false });

        if (error) throw error;

        totalAmount = data.reduce((sum, s) => sum + s.amount, 0);
        supporterCount = data.length;

        updateStats();
        renderSupporters(data);
    } catch (error) {
        console.error('후원자 로드 오류:', error);
        showError('데이터를 불러오는데 실패했습니다.');
    }
}

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

function updateGoalStatus(goalNumber, targetAmount) {
    const goalElement = document.getElementById(`goal${goalNumber}`);
    if (totalAmount >= targetAmount) {
        goalElement.classList.add('achieved');
    } else {
        goalElement.classList.remove('achieved');
    }
}

function renderSupporters(supporters) {
    const html = getSupportersHTML(supporters);

    const supportersList = document.getElementById('supportersList');
    const mainSupportersList = document.getElementById('mainSupportersList');

    if (supportersList) supportersList.innerHTML = html;
    if (mainSupportersList) mainSupportersList.innerHTML = html;
}

function getSupportersHTML(supporters) {
    if (supporters.length === 0) {
        return '<div class="no-supporters">아직 후원자가 없습니다.</div>';
    }

    return supporters.map(supporter => `
        <div class="supporter-item" data-id="${supporter.id}">
            <div class="supporter-info">
                <div class="supporter-name">${escapeHtml(supporter.nickname)}</div>
                <div class="supporter-message">${escapeHtml(supporter.message)}</div>
                <div class="verification-badge">✓ 후원 완료</div>
            </div>
            <div class="supporter-amount">${supporter.amount.toLocaleString()}원</div>
            <button class="delete-btn" onclick="deleteSupporter(${supporter.id})">삭제</button>
        </div>
    `).join('');
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));

    event.target.classList.add('active');
    document.getElementById(tabName + '-panel').classList.add('active');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function initAmountOptions() {
    const amountOptions = document.querySelectorAll('.amount-option');
    amountOptions.forEach(option => {
        option.addEventListener('click', function() {
            amountOptions.forEach(opt => opt.classList.remove('selected'));
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

    if (!nickname || !amount || !message || !password) {
        showError('모든 항목을 입력해주세요!');
        return;
    }

    if (amount <= 0) {
        showError('올바른 금액을 입력해주세요!');
        return;
    }

    if (password.length !== 4) {
        showError('삭제용 비밀번호는 4자리로 입력해주세요!');
        return;
    }

    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = '후원 중...';

    try {
        const { error } = await supabase.from('supporters').insert([{ nickname, amount, message, password }]);

        if (error) throw error;

        await loadSupporters();
        resetForm();
        showSuccess('후원해주셔서 감사합니다!\n(물론 가짜 후원이지만요 ㅋㅋㅋ)');
    } catch (error) {
        console.error('후원 오류:', error);
        showError(error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = '후원하기';
    }
}

async function deleteSupporter(supporterId) {
    const password = prompt('삭제용 비밀번호를 입력하세요:');
    if (!password) return;

    try {
        const { data, error } = await supabase.from('supporters').select('password').eq('id', supporterId).single();
        if (error || !data || data.password !== password) {
            showError('비밀번호가 틀렸거나 삭제할 수 없습니다.');
            return;
        }

        const { error: deleteError } = await supabase.from('supporters').delete().eq('id', supporterId);
        if (deleteError) throw deleteError;

        await loadSupporters();
        showSuccess('삭제되었습니다.');
    } catch (error) {
        console.error('삭제 오류:', error);
        showError(error.message);
    }
}

function resetForm() {
    document.getElementById('nickname').value = '';
    document.getElementById('customAmount').value = '';
    document.getElementById('message').value = '';
    document.getElementById('deletePassword').value = '';
    document.querySelectorAll('.amount-option').forEach(opt => opt.classList.remove('selected'));
}

function uploadImage() {
    document.getElementById('imageInput').click();
}

function handleImageUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'cover';
            img.style.borderRadius = '50%';

            const projectImage = document.querySelector('.project-image');
            projectImage.innerHTML = '';
            projectImage.appendChild(img);
        };
        reader.readAsDataURL(file);
    }
}

function showAlert(menu) {
    alert(`${menu} 서비스는 현재 준비 중입니다. 빠른 시일 내에 제공될 예정이니 양해 부탁드립니다.`);
}

function showError(message) {
    alert('❌ ' + message);
}

function showSuccess(message) {
    alert('✅ ' + message);
}

function formatNumber(num) {
    return num.toLocaleString();
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR');
}
</script>
