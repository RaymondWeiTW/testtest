const STORAGE_KEY = "quiz_bank";
let questionBank = [];
let examQuestions = [];
let currentIdx = 0;
let userAnswers = [];

const el = (id) => document.getElementById(id);

// ========== 初始化與事件綁定 ==========
window.onload = () => {
  loadBankFromStorage();
  
  el("fileInput").addEventListener("change", handleFileImport);
  el("btnStartExam").addEventListener("click", startExam);
  el("btnNext").addEventListener("click", () => { saveAns(); moveNext(); });
  el("btnPrev").addEventListener("click", () => { saveAns(); movePrev(); });
  el("btnSubmit").addEventListener("click", submitExam);
  el("btnClearBank").addEventListener("click", clearBank);
};

// ========== 檔案處理 ==========
function handleFileImport(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (evt) => {
    try {
      const data = JSON.parse(evt.target.result);
      if (Array.isArray(data)) {
        questionBank = data;
        saveBankToStorage();
        alert(`成功載入 ${data.length} 題`);
      }
    } catch (err) {
      alert("JSON 格式解析失敗，請檢查檔案內容。");
    }
  };
  reader.readAsText(file);
}

function saveBankToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(questionBank));
  updateBankStatus();
}

function loadBankFromStorage() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    questionBank = JSON.parse(stored);
    updateBankStatus();
  }
}

function updateBankStatus() {
  el("bankStatus").innerHTML = questionBank.length > 0 
    ? `<span style="color:#166534">✅ 已儲存 ${questionBank.length} 題</span>`
    : `<span style="color:#991b1b">❌ 尚未載入題庫</span>`;
}

function clearBank() {
  localStorage.removeItem(STORAGE_KEY);
  questionBank = [];
  updateBankStatus();
}

// ========== 測驗邏輯 ==========
function startExam() {
  if (questionBank.length === 0) return alert("請先匯入題庫！");
  
  const isRandom = el("chkRandomize").checked;
  examQuestions = isRandom ? [...questionBank].sort(() => Math.random() - 0.5) : [...questionBank];
  userAnswers = new Array(examQuestions.length).fill(null);
  currentIdx = 0;

  el("startArea").classList.add("hidden");
  el("examArea").classList.remove("hidden");
  renderQuestion();
}

function renderQuestion() {
  const q = examQuestions[currentIdx];
  el("qProgress").textContent = `題號 ${currentIdx + 1} / ${examQuestions.length}`;
  el("qtext").textContent = q.question_text;
  el("qcontent").textContent = q.content || "";

  const isMulti = q.correct_answer.length > 1;
  const type = isMulti ? "checkbox" : "radio";

  let html = "";
  for (const [key, text] of Object.entries(q.options)) {
    const saved = userAnswers[currentIdx] || [];
    const checked = saved.includes(key) ? "checked" : "";
    html += `
      <label class="opt">
        <input type="${type}" name="ans" value="${key}" ${checked}>
        <span><strong>${key}.</strong> ${text}</span>
      </label>
    `;
  }
  el("options").innerHTML = html;
}

function saveAns() {
  const selected = [...document.querySelectorAll('input[name="ans"]:checked')];
  userAnswers[currentIdx] = selected.map(i => i.value);
}

function moveNext() {
  if (currentIdx < examQuestions.length - 1) {
    currentIdx++;
    renderQuestion();
  }
}

function movePrev() {
  if (currentIdx > 0) {
    currentIdx--;
    renderQuestion();
  }
}

// ========== 交卷與結果顯示 (含 Key Points) ==========
function submitExam() {
  if (!confirm("確定要交卷嗎？")) return;
  saveAns();
  el("examArea").classList.add("hidden");
  el("resultArea").classList.remove("hidden");
  
  let correctCount = 0;
  let html = "";

  examQuestions.forEach((q, i) => {
    const uAns = userAnswers[i] || [];
    const cAns = q.correct_answer || [];
    const isCorrect = uAns.sort().join(",") === cAns.sort().join(",");
    if (isCorrect) correctCount++;

    html += `
      <div class="detail-item ${isCorrect ? 'correct' : 'wrong'}">
        <strong>Q${i+1}. ${q.question_text}</strong>
        <p>你的答案：${uAns.join(", ") || "未作答"} | 正確答案：<strong>${cAns.join(", ")}</strong></p>
        
        <div class="key-points-box">
          <strong>Key Points:</strong>
          <ul>
            ${q.key_points.map(kp => `<li>${kp}</li>`).join("")}
          </ul>
        </div>
      </div>
    `;
  });

  const score = Math.round((correctCount / examQuestions.length) * 100);
  el("scoreCard").innerHTML = `<h3>得分：${score} 分 (答對 ${correctCount} 題)</h3>`;
  el("detailList").innerHTML = html;
}