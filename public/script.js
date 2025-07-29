// 전역 변수
let totalAmount = 0;
let supporterCount = 0;
const targetAmount = 500000;

// 페이지 로드시 초기화
document.addEventListener('DOMContentLoaded', function() {
    loadSupporters();
    initAmountOptions();
});

// 후원자 데이터 로드
async function loadSupporters() {
    try {
        const response = await fetch('/api/supporters');
        if (!response.ok) {
            throw new Error('데이터를 불러올 수 없습니다.');
        }
        
        const data = await response.json();
        totalAmount = data.totalAmount;
        supporterCount = data.supporterCount;
        
        updateStats();
        renderSupporters(data.supporters);
    } catch (error) {
        console.error('후원자 로드 오류:', error);
        showError('데이터를 불러오는데 실패했습니다.');
    }
}

// 통계 업데이트
function updateStats() {
    document.getElementById('totalAmount').textContent = totalAmount.toLocaleString();
    document.getElementById('supporterCount').textContent = supporterCount;
    
    const percentage = Math.min((totalAmount / targetAmount) * 100, 100);
    document.getElementById('progressFill').style.width = percentage + '%';
    document.getElementById('progressPercent').textContent = Math.round(percentage) + '%';

    // 목표 달성 체크
    updateGoalStatus(1, 200000);
    updateGoalStatus(2, 300000);
    updateGoalStatus(3, 500000);
}

// 목표 달성 상태 업데이트
function updateGoalStatus(goalNumber, targetAmount) {
    const goalElement = document.getElementById(`goal${goalNumber}`);
    if (totalAmount >= targetAmount) {
        goalElement.classList.add('achieved');
    } else {
        goalElement.classList.remove('achieved');
    }
}

// 후원자 목록 렌더링
function renderSupporters(supporters) {
    const supportersList = document.getElementById('supportersList');
    
    if (supporters.length === 0) {
        supportersList.innerHTML = '<div class="no-supporters">아직 후원자가 없습니다.</div>';
        return;
    }
    
    supportersList.innerHTML = supporters.map(supporter => `
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

// HTML 이스케이핑
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 금액 옵션 초기화
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

// 새 후원자 추가
async function addSupporter() {
    const nickname = document.getElementById('nickname').value.trim();
    const amount = parseInt(document.getElementById('customAmount').value);
    const message = document.getElementById('message').value.trim();
    const password = document.getElementById('deletePassword').value.trim();

    // 유효성 검사
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

    // 버튼 비활성화
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = '후원 중...';

    try {
        const response = await fetch('/api/supporters', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nickname,
                amount,
                message,
                password
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || '후원에 실패했습니다.');
        }

        // 성공시 통계 업데이트
        totalAmount = result.totalAmount;
        supporterCount = result.supporterCount;
        updateStats();

        // 후원자 목록 새로고침
        await loadSupporters();

        // 폼 초기화
        resetForm();

        // 성공 메시지
        showSuccess('후원해주셔서 감사합니다! 🎉\n(물론 가짜 후원이지만요 ㅋㅋㅋ)');

    } catch (error) {
        console.error('후원 오류:', error);
        showError(error.message);
    } finally {
        // 버튼 다시 활성화
        submitBtn.disabled = false;
        submitBtn.textContent = '후원하기';
    }
}

// 후원자 삭제
async function deleteSupporter(supporterId) {
    const password = prompt('삭제용 비밀번호를 입력하세요:');
    
    if (!password) {
        return;
    }

    try {
        const response = await fetch(`/api/supporters/${supporterId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ password })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || '삭제에 실패했습니다.');
        }

        // 성공시 통계 업데이트
        totalAmount = result.totalAmount;
        supporterCount = result.supporterCount;
        updateStats();

        // 후원자 목록 새로고침
        await loadSupporters();

        // 성공 메시지
        showSuccess(result.message);

    } catch (error) {
        console.error('삭제 오류:', error);
        showError(error.message);
    }
}

// 폼 초기화
function resetForm() {
    document.getElementById('nickname').value = '';
    document.getElementById('customAmount').value = '';
    document.getElementById('message').value = '';
    document.getElementById('deletePassword').value = '';
    
    // 선택된 금액 옵션 해제
    document.querySelectorAll('.amount-option').forEach(opt => {
        opt.classList.remove('selected');
    });
}

// 이미지 업로드
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

// 네비게이션 알림
function showAlert(menu) {
    alert(`${menu} 기능은 없습니다! 이건 장난용 페이지거든요 ㅋㅋㅋ`);
}

// 에러 메시지 표시
function showError(message) {
    alert('❌ ' + message);
}

// 성공 메시지 표시
function showSuccess(message) {
    alert('✅ ' + message);
}

// 숫자 포맷팅
function formatNumber(num) {
    return num.toLocaleString();
}

// 날짜 포맷팅
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR');
}