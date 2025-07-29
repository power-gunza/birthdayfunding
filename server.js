const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'supporters.json');
const MASTER_PASSWORD = '1002';

// 미들웨어
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 데이터 파일 초기화
async function initDataFile() {
  try {
    await fs.access(DATA_FILE);
  } catch (error) {
    // 파일이 없으면 초기 데이터 생성
    const initialData = {
      totalAmount: 70000,
      supporterCount: 2,
      supporters: [
        {
          id: 1,
          nickname: "베프💕",
          amount: 50000,
          message: "생축!! 에어팟 사서 우리 음성메시지 더 잘 들어 ㅋㅋㅋ",
          password: "1234",
          timestamp: new Date().toISOString()
        },
        {
          id: 2,
          nickname: "동기짱",
          amount: 20000,
          message: "아 진짜 ㅋㅋㅋㅋ 이런것까지 만들어? 그래도 생일축하해!",
          password: "5678",
          timestamp: new Date().toISOString()
        }
      ]
    };
    
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(initialData, null, 2));
  }
}

// 데이터 읽기
async function readData() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('데이터 읽기 오류:', error);
    return null;
  }
}

// 데이터 쓰기
async function writeData(data) {
  try {
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('데이터 쓰기 오류:', error);
    return false;
  }
}

// 통계 업데이트
function updateStats(data) {
  data.totalAmount = data.supporters.reduce((sum, supporter) => sum + supporter.amount, 0);
  data.supporterCount = data.supporters.length;
  return data;
}

// API 라우트

// 후원자 목록 조회
app.get('/api/supporters', async (req, res) => {
  const data = await readData();
  if (!data) {
    return res.status(500).json({ error: '데이터를 읽을 수 없습니다.' });
  }
  
  // 비밀번호는 클라이언트에 전송하지 않음
  const safeData = {
    ...data,
    supporters: data.supporters.map(({ password, ...supporter }) => supporter)
  };
  
  res.json(safeData);
});

// 새 후원자 추가
app.post('/api/supporters', async (req, res) => {
  const { nickname, amount, message, password } = req.body;
  
  // 유효성 검사
  if (!nickname || !amount || !message || !password) {
    return res.status(400).json({ error: '모든 필드를 입력해주세요.' });
  }
  
  if (typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ error: '올바른 금액을 입력해주세요.' });
  }
  
  if (password.length !== 4) {
    return res.status(400).json({ error: '비밀번호는 4자리로 입력해주세요.' });
  }
  
  const data = await readData();
  if (!data) {
    return res.status(500).json({ error: '데이터를 읽을 수 없습니다.' });
  }
  
  // 새 후원자 추가
  const newSupporter = {
    id: Date.now(), // 간단한 ID 생성
    nickname: nickname.trim(),
    amount: parseInt(amount),
    message: message.trim(),
    password: password.trim(),
    timestamp: new Date().toISOString()
  };
  
  data.supporters.unshift(newSupporter); // 최신순으로 정렬
  updateStats(data);
  
  const success = await writeData(data);
  if (!success) {
    return res.status(500).json({ error: '데이터 저장에 실패했습니다.' });
  }
  
  // 응답에서는 비밀번호 제외
  const { password: _, ...safeSupporter } = newSupporter;
  res.json({ 
    success: true, 
    supporter: safeSupporter,
    totalAmount: data.totalAmount,
    supporterCount: data.supporterCount
  });
});

// 후원자 삭제
app.delete('/api/supporters/:id', async (req, res) => {
  const { id } = req.params;
  const { password } = req.body;
  
  if (!password) {
    return res.status(400).json({ error: '비밀번호를 입력해주세요.' });
  }
  
  const data = await readData();
  if (!data) {
    return res.status(500).json({ error: '데이터를 읽을 수 없습니다.' });
  }
  
  const supporterIndex = data.supporters.findIndex(s => s.id === parseInt(id));
  if (supporterIndex === -1) {
    return res.status(404).json({ error: '후원자를 찾을 수 없습니다.' });
  }
  
  const supporter = data.supporters[supporterIndex];
  
  // 비밀번호 확인 (개인 비밀번호 또는 마스터 비밀번호)
  if (password !== supporter.password && password !== MASTER_PASSWORD) {
    return res.status(403).json({ error: '비밀번호가 틀렸습니다.' });
  }
  
  // 후원자 삭제
  data.supporters.splice(supporterIndex, 1);
  updateStats(data);
  
  const success = await writeData(data);
  if (!success) {
    return res.status(500).json({ error: '데이터 저장에 실패했습니다.' });
  }
  
  const isMaster = password === MASTER_PASSWORD;
  res.json({ 
    success: true, 
    message: isMaster ? '마스터 권한으로 삭제되었습니다!' : '삭제되었습니다!',
    totalAmount: data.totalAmount,
    supporterCount: data.supporterCount
  });
});

// 루트 경로
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 서버 시작
async function startServer() {
  await initDataFile();
  app.listen(PORT, () => {
    console.log(`🎂 생일선물 펀딩 서버가 http://localhost:${PORT} 에서 실행중입니다!`);
  });
}

startServer().catch(console.error);