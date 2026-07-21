    (() => {
      const storageKey = window.EXAM_STUDY_CONFIG?.localAiStorageKey || "examStudyApp.localAi.v1";
      const defaultEndpoint = "http://127.0.0.1:8765";
      const localAi = {
        toggle: document.querySelector("#localAiToggle"),
        panel: document.querySelector("#localAiPanel"),
        close: document.querySelector("#localAiClose"),
        status: document.querySelector("#localAiStatus"),
        endpoint: document.querySelector("#localAiEndpoint"),
        model: document.querySelector("#localAiModel"),
        messages: document.querySelector("#localAiMessages"),
        form: document.querySelector("#localAiForm"),
        prompt: document.querySelector("#localAiPrompt"),
        send: document.querySelector("#localAiSend"),
        useQuestion: document.querySelector("#localAiUseQuestion"),
        useAnswer: document.querySelector("#localAiUseAnswer")
      };
      const history = [];

      function loadSettings() {
        try {
          const saved = JSON.parse(localStorage.getItem(storageKey));
          if (saved?.endpoint) localAi.endpoint.value = saved.endpoint;
          if (saved?.model) localAi.model.value = saved.model;
        } catch (error) {
          console.warn(error);
        }
      }

      function saveSettings() {
        localStorage.setItem(storageKey, JSON.stringify({
          endpoint: endpoint(),
          model: modelName()
        }));
      }

      function endpoint() {
        return (localAi.endpoint.value || defaultEndpoint).trim().replace(/\/+$/, "");
      }

      function modelName() {
        return (localAi.model.value || "gemma3:4b").trim();
      }

      function setStatus(text, type = "") {
        localAi.status.textContent = text;
        localAi.status.className = `local-ai-status ${type}`.trim();
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
        return escaped.replace(/\*\*([^*\n][\s\S]*?[^*\n])\*\*/g, "<strong>$1</strong>");
      }

      function currentStudyText(includeAnswer = false) {
        const question = document.querySelector("#questionText")?.textContent?.trim() || "";
        const answer = document.querySelector("#answerText")?.textContent?.trim() || "";
        const title = document.querySelector("#currentExamTitle")?.textContent?.trim() || "";
        const parts = [];
        if (title) parts.push(`시험: ${title}`);
        if (question) parts.push(`문제:\n${question}`);
        if (includeAnswer && answer) parts.push(`정답/해설:\n${answer}`);
        return parts.join("\n\n");
      }

      function appendContext(includeAnswer) {
        const text = currentStudyText(includeAnswer);
        if (!text) {
          addMessage("system", "현재 화면에서 가져올 문제가 없습니다.");
          return;
        }
        const current = localAi.prompt.value.trim();
        localAi.prompt.value = `${current ? `${current}\n\n` : ""}${text}`;
        localAi.prompt.focus();
      }

      async function checkHealth() {
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

      async function sendMessage(event) {
        event.preventDefault();
        const content = localAi.prompt.value.trim();
        if (!content) return;
        saveSettings();
        localAi.prompt.value = "";
        localAi.send.disabled = true;
        addMessage("user", content);
        history.push({ role: "user", content });
        const assistant = addMessage("assistant", "");

        const messages = [
          {
            role: "system",
            content: "너는 산업안전 학습용 AI 해설 도우미다. 반드시 한국어로만 답하고, 중국어와 영어를 섞지 않는다. 사용자의 일반 질문에는 자연스럽게 답한다. 단, 앱이 현재 문제와 저장된 정답/해설을 제공한 경우에는 그 정답을 최우선 기준으로 삼고 절대 다른 숫자나 답으로 바꾸지 않는다. 저장된 정답이 있으면 먼저 '저장된 정답 기준으로는'이라고 밝히고, 왜 그 답인지 풀이, 암기 포인트, 헷갈리는 부분을 설명한다. 저장된 정답이 없는 일반 질문에는 일반 지식으로 답하되 시험의 확정 정답처럼 단정하지 않는다."
          },
          {
            role: "user",
            content: currentStudyText(true)
              ? `앱에서 자동 첨부한 현재 문제와 저장된 정답/해설입니다. 아래 기준을 우선하여 답하세요.\n\n${currentStudyText(true)}`
              : "앱에서 자동 첨부할 현재 문제나 저장된 정답/해설을 찾지 못했습니다. 시험의 확정 정답인 것처럼 말하지 말고, 일반 학습 설명으로만 답하세요."
          },
          ...history.slice(-10)
        ];

        try {
          const response = await fetch(`${endpoint()}/api/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ model: modelName(), messages, stream: true })
          });
          if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.error || `HTTP ${response.status}`);
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";
          let answer = "";

          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";
            for (const line of lines) {
              if (!line.trim()) continue;
              const chunk = JSON.parse(line);
              const text = chunk.message?.content || "";
              if (!text) continue;
              answer += text;
              assistant.innerHTML = renderLocalAiMarkdown(answer);
              localAi.messages.scrollTop = localAi.messages.scrollHeight;
            }
          }

          history.push({ role: "assistant", content: answer });
          setStatus("응답 완료", "ok");
        } catch (error) {
          assistant.textContent = `오류: ${error.message}`;
          setStatus("응답 실패", "error");
        } finally {
          localAi.send.disabled = false;
          localAi.prompt.focus();
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
      localAi.useQuestion.addEventListener("click", () => appendContext(false));
      localAi.useAnswer.addEventListener("click", () => appendContext(true));
      localAi.form.addEventListener("submit", sendMessage);
    })();
