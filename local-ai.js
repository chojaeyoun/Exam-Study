(() => {
  const storageKey = window.EXAM_STUDY_CONFIG?.localAiStorageKey || "examStudyApp.localAi.v1";
  const defaultEndpoint = "http://127.0.0.1:8765";
  // 목록을 못 받을 때만 쓰는 값. Google이 옛 모델을 새 사용자에게 막아서(2.5-flash) 고정하지 않고 목록에서 고른다
  const geminiFallbackModel = "gemini-3.8-flash";
  let geminiChosenModel = "";
  const localAi = {
    toggle: document.querySelector("#localAiToggle"),
    panel: document.querySelector("#localAiPanel"),
    close: document.querySelector("#localAiClose"),
    status: document.querySelector("#localAiStatus"),
    endpoint: document.querySelector("#localAiEndpoint"),
    model: document.querySelector("#localAiModel"),
    geminiKey: document.querySelector("#localAiGeminiKey"),
    messages: document.querySelector("#localAiMessages"),
    form: document.querySelector("#localAiForm"),
    prompt: document.querySelector("#localAiPrompt"),
    send: document.querySelector("#localAiSend"),
    useQuestion: document.querySelector("#localAiUseQuestion"),
    useAnswer: document.querySelector("#localAiUseAnswer"),
    generateExplanation: document.querySelector("#localAiGenerateExplanation"),
    analyzeAnswer: document.querySelector("#localAiAnalyzeAnswer"),
    saveLast: document.querySelector("#localAiSaveLast"),
    saveNote: document.querySelector("#localAiSaveNote")
  };
  const history = [];
  let lastAssistant = { content: "", mode: "explanation" };

  if (!localAi.toggle || !localAi.panel) return;

  function loadSettings() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey));
      if (saved?.endpoint) localAi.endpoint.value = saved.endpoint;
      if (saved?.model) localAi.model.value = saved.model;
      if (saved?.geminiKey && localAi.geminiKey) localAi.geminiKey.value = saved.geminiKey;
    } catch (error) {
      console.warn(error);
    }
  }

  function saveSettings() {
    localStorage.setItem(storageKey, JSON.stringify({
      endpoint: endpoint(),
      model: modelName(),
      geminiKey: geminiKey()  // 이 기기에만 저장 (클라우드 동기화 안 함)
    }));
  }

  function endpoint() {
    return (localAi.endpoint.value || defaultEndpoint).trim().replace(/\/+$/, "");
  }

  function modelName() {
    return (localAi.model.value || "gemma3:4b").trim();
  }

  function geminiKey() {
    return (localAi.geminiKey?.value || "").trim();
  }

  function bridge() {
    return window.ExamStudyLocalAi || null;
  }

  function setStatus(text, type = "") {
    localAi.status.textContent = text;
    localAi.status.className = `local-ai-status ${type}`.trim();
  }

  function setBusy(isBusy) {
    [localAi.send, localAi.generateExplanation, localAi.analyzeAnswer].filter(Boolean).forEach(button => {
      button.disabled = isBusy;
    });
  }

  function addMessage(role, text) {
    const message = document.createElement("div");
    message.className = `local-ai-message ${role}`;
    message.innerHTML = renderLocalAiMarkdown(text);
    localAi.messages.appendChild(message);
    localAi.messages.scrollTop = localAi.messages.scrollHeight;
    return message;
  }

  function renderLocalAiMarkdown(text) {
    const escaped = String(text || "").replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[char]));
    return escaped
      .replace(/^### (.+)$/gm, "<strong>$1</strong>")
      .replace(/^## (.+)$/gm, "<strong>$1</strong>")
      .replace(/\*\*([^*\n][\s\S]*?[^*\n])\*\*/g, "<strong>$1</strong>");
  }

  function currentContext() {
    const fromApp = bridge()?.getCurrentQuestionContext?.();
    if (fromApp) return fromApp;

    const question = document.querySelector("#questionText")?.textContent?.trim() || "";
    const answer = document.querySelector("#answerText")?.textContent?.trim() || "";
    const title = document.querySelector("#currentExamTitle")?.textContent?.trim() || "";
    const myAnswer = document.querySelector("#myAnswer")?.value?.trim() || "";
    if (!question && !answer && !title) return null;
    return { examTitle: title, question, answer, myAnswer, tags: [] };
  }

  function currentStudyText(includeAnswer = false, includeMyAnswer = false) {
    const context = currentContext();
    if (!context) return "";
    const parts = [];
    if (context.examTitle) parts.push(`시험: ${context.examTitle}`);
    if (context.examTypeLabel) parts.push(`유형: ${context.examTypeLabel}`);
    if (context.category) parts.push(`분야: ${context.category}`);
    if (context.level) parts.push(`중요도: ${context.level}`);
    if (context.tags?.length) parts.push(`태그: ${context.tags.join(", ")}`);
    if (context.question) parts.push(`문제:\n${context.question}`);
    if (includeAnswer && context.answer) parts.push(`저장된 정답/해설:\n${context.answer}`);
    if (includeAnswer && context.memo) parts.push(`작성 메모:\n${context.memo}`);
    if (includeMyAnswer && context.myAnswer) parts.push(`내 답안:\n${context.myAnswer}`);
    if (context.aiExplanation?.explanation) parts.push(`저장된 AI 해설:\n${context.aiExplanation.explanation}`);
    return parts.join("\n\n");
  }

  function appendContext(includeAnswer) {
    const text = currentStudyText(includeAnswer, true);
    if (!text) {
      addMessage("system", "현재 화면에서 가져올 문제가 없습니다.");
      return;
    }
    const current = localAi.prompt.value.trim();
    localAi.prompt.value = `${current ? `${current}\n\n` : ""}${text}`;
    localAi.prompt.focus();
  }

  function buildExplanationPrompt() {
    const text = currentStudyText(true, false);
    if (!text) return "";
    return [
      "현재 산업안전기사 문제를 저장된 정답 기준으로 해설해줘.",
      "다음 형식을 지켜줘.",
      "",
      "1. 핵심 결론: 정답을 한두 줄로 정리",
      "2. 왜 맞는지: 원리나 법규 관점 설명",
      "3. 오답/주의점: 헷갈리기 쉬운 부분",
      "4. 암기 포인트: 시험 직전에 볼 키워드",
      "5. 오답노트 요약: 다시 볼 문장 3줄 이내",
      "",
      text
    ].join("\n");
  }

  function buildAnswerAnalysisPrompt() {
    const context = currentContext();
    if (!context) return "";
    if (!context.myAnswer) {
      addMessage("system", "내 답안 칸에 답을 먼저 적으면 분석할 수 있습니다.");
      return "";
    }
    return [
      "내 답안을 저장된 정답과 비교해서 채점 보조 형태로 분석해줘.",
      "확정 점수처럼 말하지 말고, 산업안전기사 필답형/작업형 부분점수 관점으로 봐줘.",
      "다음 형식을 지켜줘.",
      "",
      "1. 맞은 핵심 키워드",
      "2. 빠진 핵심 키워드",
      "3. 감점 위험 표현",
      "4. 더 시험답안다운 표현",
      "5. 틀린 이유 분류: 개념 모름/키워드 누락/문제 오독/용어 혼동/암기 부족 중 가장 가까운 것",
      "6. 오답노트 요약",
      "",
      currentStudyText(true, true)
    ].join("\n");
  }

  function systemPrompt() {
    return [
      "너는 산업안전기사 학습용 AI 해설 도우미다.",
      "반드시 한국어로만 답하고 중국어와 영어를 섞지 않는다.",
      "앱이 현재 문제와 저장된 정답/해설을 제공한 경우에는 그 정답을 최우선 기준으로 삼고 절대 다른 숫자나 답으로 바꾸지 않는다.",
      "저장된 정답이 있으면 먼저 저장된 정답 기준임을 밝히고, 왜 그 답인지 풀이, 암기 포인트, 헷갈리는 부분을 설명한다.",
      "내 답안 분석은 채점 보조이며 확정 점수처럼 단정하지 않는다.",
      "저장된 정답이 없는 일반 질문에는 일반 학습 설명으로만 답한다.",
      "법 조항 번호, 수치, 기준값은 저장된 정답이나 메모에 있는 것만 쓰고, 없는 숫자나 조항은 만들어 내지 않는다.",
      "확실하지 않은 내용은 쓰지 않는다. '~일 수 있다', '~할 수도 있다', '경우에 따라' 같은 흐릿한 표현 대신 저장된 정답에 근거해 짧고 단정적으로 쓴다.",
      "각 항목은 1~3문장으로 짧게 쓰고, 문제와 상관없는 일반론은 쓰지 않는다."
    ].join(" ");
  }

  async function checkHealth() {
    if (geminiKey()) {
      setStatus("Gemini로 해설합니다 (실패하면 로컬 AI)", "ok");
      return;
    }
    try {
      const response = await fetch(`${endpoint()}/api/health`);
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.hint || data.error || "연결 실패");
      const firstModel = data.models?.[0]?.name;
      if (firstModel && !localAi.model.value.trim()) localAi.model.value = firstModel;
      setStatus(`연결됨: ${data.models?.length || 0}개 모델`, "ok");
    } catch (error) {
      setStatus("브릿지 서버가 꺼져 있습니다. ollama-chatbot의 Start-Chatbot.ps1을 실행하세요.", "error");
    }
  }

  async function readLines(response, onLine) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      lines.filter(line => line.trim()).forEach(onLine);
    }
    if (buffer.trim()) onLine(buffer);
  }

  async function streamOllama(messages, temperature, onText) {
    const response = await fetch(`${endpoint()}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: modelName(), messages, stream: true, options: { temperature } })
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || `HTTP ${response.status}`);
    }
    let answer = "";
    await readLines(response, line => {
      const text = JSON.parse(line).message?.content || "";
      if (!text) return;
      answer += text;
      onText(answer);
    });
    return answer;
  }

  // 키로 쓸 수 있는 모델 중 가장 최신 정식 Flash (preview/lite/exp 제외)
  async function resolveGeminiModel() {
    if (geminiChosenModel) return geminiChosenModel;
    try {
      const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models?pageSize=200", {
        headers: { "x-goog-api-key": geminiKey() }
      });
      const data = await response.json();
      const version = name => (name.match(/gemini-([\d.]+)-flash$/)?.[1] || "0").split(".").map(Number);
      const candidates = (data.models || [])
        .filter(m => (m.supportedGenerationMethods || []).includes("generateContent"))
        .map(m => m.name.replace(/^models\//, ""))
        .filter(name => /^gemini-[\d.]+-flash$/.test(name))
        .sort((a, b) => {
          const [va, vb] = [version(a), version(b)];
          for (let i = 0; i < Math.max(va.length, vb.length); i += 1) {
            if ((vb[i] || 0) !== (va[i] || 0)) return (vb[i] || 0) - (va[i] || 0);
          }
          return 0;
        });
      geminiChosenModel = candidates[0] || geminiFallbackModel;
    } catch (error) {
      geminiChosenModel = geminiFallbackModel;
    }
    return geminiChosenModel;
  }

  async function streamGemini(messages, temperature, onText) {
    const system = messages.filter(m => m.role === "system").map(m => m.content).join("\n");
    const contents = [];
    messages.filter(m => m.role !== "system").forEach(m => {
      const role = m.role === "assistant" ? "model" : "user";
      const last = contents[contents.length - 1];
      if (last?.role === role) last.parts[0].text += `\n\n${m.content}`;  // 같은 역할이 연달아 오면 합친다
      else contents.push({ role, parts: [{ text: m.content }] });
    });
    const model = /^gemini/i.test(modelName()) ? modelName() : await resolveGeminiModel();
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:streamGenerateContent?alt=sse`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": geminiKey() },
      body: JSON.stringify({ systemInstruction: { parts: [{ text: system }] }, contents, generationConfig: { temperature } })
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      if (response.status === 429) throw new Error("무료 사용량 한도 초과(잠시 후 다시)");
      throw new Error(data.error?.message || `HTTP ${response.status}`);
    }
    let answer = "";
    await readLines(response, line => {
      if (!line.startsWith("data:")) return;
      const parts = JSON.parse(line.slice(5)).candidates?.[0]?.content?.parts || [];
      const text = parts.filter(part => !part.thought).map(part => part.text || "").join("");
      if (!text) return;
      answer += text;
      onText(answer);
    });
    if (!answer.trim()) throw new Error("빈 응답");
    return answer;
  }

  async function sendPrompt(content, options = {}) {
    if (!content) return "";
    saveSettings();
    setBusy(true);
    addMessage("user", content);
    history.push({ role: "user", content });
    const assistant = addMessage("assistant", "");

    // 해설/답안 분석은 이 문제만 보낸다: 이전 대화에 섞인 다른 문제 내용이 해설을 흐리게 만들었음
    const focused = Boolean(options.saveKind);
    const messages = focused
      ? [{ role: "system", content: systemPrompt() }, { role: "user", content }]
      : [
          { role: "system", content: systemPrompt() },
          {
            role: "user",
            content: currentStudyText(true, true)
              ? `앱에서 자동 첨부한 현재 문제 정보입니다. 아래 기준을 우선하여 답하세요.\n\n${currentStudyText(true, true)}`
              : "앱에서 현재 문제 정보를 찾지 못했습니다. 시험의 확정 정답인 것처럼 말하지 말고, 일반 학습 설명으로만 답하세요."
          },
          ...history.slice(-10)
        ];

    // 낮은 temperature: 사실 설명에서 지어내는 문장을 줄인다
    const temperature = focused ? 0.2 : 0.5;
    const onText = text => {
      assistant.innerHTML = renderLocalAiMarkdown(text);
      localAi.messages.scrollTop = localAi.messages.scrollHeight;
    };

    let geminiError = "";
    try {
      let answer = null;
      let source = "로컬 AI";
      if (geminiKey()) {
        try {
          setStatus("Gemini 응답 중...");
          answer = await streamGemini(messages, temperature, onText);
          source = "Gemini";
        } catch (error) {
          geminiError = error.message;
          assistant.innerHTML = renderLocalAiMarkdown(`(Gemini 실패: ${geminiError} · 로컬 AI로 다시 시도합니다)`);
        }
      }
      if (answer === null) {
        setStatus("로컬 AI 응답 중...");
        answer = await streamOllama(messages, temperature, onText);
      }

      history.push({ role: "assistant", content: answer });
      lastAssistant = { content: answer, mode: options.mode || "explanation" };
      if (options.saveKind && bridge()?.saveCurrentAiExplanation?.(options.saveKind, answer)) {
        setStatus(`${source} 응답 완료 · ${options.saveKind === "answerAnalysis" ? "답안 분석" : "AI 해설"} 저장됨`, "ok");
      } else {
        setStatus(`${source} 응답 완료`, "ok");
      }
      return answer;
    } catch (error) {
      // 두 쪽 오류를 다 보여준다: 로컬 오류만 보이면 Gemini가 왜 안 됐는지 알 수 없음
      assistant.textContent = geminiKey()
        ? `오류 · Gemini: ${geminiError || "-"} / 로컬 AI: ${error.message}`
        : `오류 · 로컬 AI: ${error.message}
(PC의 브릿지 서버가 꺼져 있으면 실패합니다. 위 'Gemini API 키' 칸에 키를 넣으면 PC 없이 해설됩니다.)`;
      setStatus("응답 실패", "error");
      return "";
    } finally {
      setBusy(false);
      localAi.prompt.focus();
    }
  }

  async function sendMessage(event) {
    event.preventDefault();
    const content = localAi.prompt.value.trim();
    if (!content) return;
    localAi.prompt.value = "";
    await sendPrompt(content, { mode: "chat" });
  }

  async function generateExplanation() {
    const prompt = buildExplanationPrompt();
    if (!prompt) {
      addMessage("system", "현재 화면에서 해설을 만들 문제가 없습니다.");
      return;
    }
    await sendPrompt(prompt, { mode: "explanation", saveKind: "explanation" });
  }

  async function analyzeMyAnswer() {
    const prompt = buildAnswerAnalysisPrompt();
    if (!prompt) return;
    await sendPrompt(prompt, { mode: "answerAnalysis", saveKind: "answerAnalysis" });
  }

  function saveLastResponse() {
    if (!lastAssistant.content.trim()) {
      addMessage("system", "저장할 마지막 AI 응답이 없습니다.");
      return;
    }
    const kind = lastAssistant.mode === "answerAnalysis" ? "answerAnalysis" : "explanation";
    if (bridge()?.saveCurrentAiExplanation?.(kind, lastAssistant.content)) {
      setStatus(kind === "answerAnalysis" ? "마지막 답안 분석 저장됨" : "마지막 해설 저장됨", "ok");
    } else {
      setStatus("현재 문제에 저장하지 못했습니다.", "error");
    }
  }

  function saveLastToStudyNote() {
    if (!lastAssistant.content.trim()) {
      addMessage("system", "오답노트에 넣을 마지막 AI 응답이 없습니다.");
      return;
    }
    const title = lastAssistant.mode === "answerAnalysis" ? "AI 답안 분석" : "AI 해설 요약";
    if (bridge()?.appendCurrentStudyNoteFromAi?.(lastAssistant.content, title)) {
      setStatus("오답노트에 저장됨", "ok");
    } else {
      setStatus("오답노트에 저장하지 못했습니다.", "error");
    }
  }

  function openPanel() {
    localAi.panel.classList.remove("hidden");
    localAi.toggle.setAttribute("aria-expanded", "true");
    checkHealth();
    localAi.prompt.focus();
  }

  function closePanel() {
    localAi.panel.classList.add("hidden");
    localAi.toggle.setAttribute("aria-expanded", "false");
  }

  loadSettings();
  localAi.toggle.addEventListener("click", () => {
    localAi.panel.classList.contains("hidden") ? openPanel() : closePanel();
  });
  localAi.close.addEventListener("click", closePanel);
  localAi.endpoint.addEventListener("change", () => { saveSettings(); checkHealth(); });
  localAi.model.addEventListener("change", saveSettings);
  localAi.geminiKey?.addEventListener("change", () => { saveSettings(); checkHealth(); });
  localAi.useQuestion.addEventListener("click", () => appendContext(false));
  localAi.useAnswer.addEventListener("click", () => appendContext(true));
  localAi.generateExplanation?.addEventListener("click", generateExplanation);
  localAi.analyzeAnswer?.addEventListener("click", analyzeMyAnswer);
  localAi.saveLast?.addEventListener("click", saveLastResponse);
  localAi.saveNote?.addEventListener("click", saveLastToStudyNote);
  localAi.form.addEventListener("submit", sendMessage);
})();
