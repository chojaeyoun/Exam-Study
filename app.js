    const appConfig = window.EXAM_STUDY_CONFIG || {};
    const DEFAULT_EXAM_ID = appConfig.defaultExamId || "industrial-practical";
    const STORAGE_KEY = appConfig.storageKey || "examStudyApp.v2";
    const CLOUD_CONFIG_KEY = appConfig.cloudConfigKey || "examStudyApp.supabase.v1";
    const MUSIC_LINKS_KEY = appConfig.musicLinksKey || "examStudyApp.youtubeMusic.v1";
    const OLD_STORAGE_KEYS = appConfig.oldStorageKeys || ["industrialSafetyPracticalStudy.v1"];
    const APP_TITLE = appConfig.appTitle || "Sushi Vinegar";
    const CLOUD_SYNC_START = "\n\n<!--EXAM_STUDY_SYNC:";
    const CLOUD_SYNC_END = "-->";
    const CLOUD_BACKUP_CATEGORY = "__sync_backup__";
    const CLOUD_BACKUP_CHUNK_SIZE = 250000;
    const DEFAULT_EXAMS = appConfig.defaultExams || [
      {
        id: DEFAULT_EXAM_ID,
        name: "산업기사 실기",
        description: "단답형·작업형"
      }
    ];
    const state = loadState();
    const cloudConfig = loadCloudConfig();
    let currentIndex = 0;
    let currentTheoryIndex = 0;
    let activeView = "study";
    let studyMode = "question";
    let composeMode = "question";
    let quickEditId = "";
    let bankListMode = "filtered";
    let reviewQueueIds = [];
    let reviewQueueLabel = "";
    let includeMasteredInStudyAll = false;
    let deferredInstallPrompt = null;
    let supabaseClient = null;
    let pendingPhotoQuestions = [];
    let removeQuestionImageOnSave = false;
    let removeAnswerImageOnSave = false;
    let answerStage = "full";
    let memoryMode = false;
    let musicTracks = [];
    let currentMusicIndex = -1;
    const PHOTO_MAX_EDGE = 1600;
    const PHOTO_QUALITY = 0.82;

    const els = {
      totalCount: document.querySelector("#totalCount"),
      wrongCount: document.querySelector("#wrongCount"),
      masteredCount: document.querySelector("#masteredCount"),
      currentExamTitle: document.querySelector("#currentExamTitle"),
      studySummaryText: document.querySelector("#studySummaryText"),
      summaryTotal: document.querySelector("#summaryTotal"),
      summaryWrong: document.querySelector("#summaryWrong"),
      summaryMastered: document.querySelector("#summaryMastered"),
      progressLabel: document.querySelector("#progressLabel"),
      progressFill: document.querySelector("#progressFill"),
      studyModeTabs: document.querySelector(".mode-tabs"),
      studyReviewModeBtn: document.querySelector("#studyReviewModeBtn"),
      studyMultipleModeBtn: document.querySelector("#studyMultipleModeBtn"),
      studyWrittenModeBtn: document.querySelector("#studyWrittenModeBtn"),
      studyPracticalModeBtn: document.querySelector("#studyPracticalModeBtn"),
      examTabs: document.querySelector("#examTabs"),
      addExamBtn: document.querySelector("#addExamBtn"),
      openDrawerBtn: document.querySelector("#openDrawerBtn"),
      closeDrawerBtn: document.querySelector("#closeDrawerBtn"),
      mobileBackdrop: document.querySelector("#mobileBackdrop"),
      mobileDrawer: document.querySelector("#mobileDrawer"),
      mobileExamTabs: document.querySelector("#mobileExamTabs"),
      mobileAddExamBtn: document.querySelector("#mobileAddExamBtn"),
      desktopSide: document.querySelector(".side"),
      toggleSearchBtn: document.querySelector("#toggleSearchBtn"),
      searchInput: document.querySelector("#searchInput"),
      installBtn: document.querySelector("#installBtn"),
      shuffleBtn: document.querySelector("#shuffleBtn"),
      resetBtn: document.querySelector("#resetBtn"),
      cardIndex: document.querySelector("#cardIndex"),
      cardType: document.querySelector("#cardType"),
      cardLevel: document.querySelector("#cardLevel"),
      cardStatus: document.querySelector("#cardStatus"),
      questionText: document.querySelector("#questionText"),
      answerText: document.querySelector("#answerText"),
      myAnswer: document.querySelector("#myAnswer"),
      choiceAnswerPanel: document.querySelector("#choiceAnswerPanel"),
      answerAssist: document.querySelector("#answerAssist"),
      answerHintBtn: document.querySelector("#answerHintBtn"),
      answerKeywordBtn: document.querySelector("#answerKeywordBtn"),
      answerFullBtn: document.querySelector("#answerFullBtn"),
      memoryModeBtn: document.querySelector("#memoryModeBtn"),
      studyGrid: document.querySelector("#studyGrid"),
      reviewGrid: document.querySelector("#reviewGrid"),
      studyRangeBox: document.querySelector("#studyRangeBox"),
      toggleRangeBtn: document.querySelector("#toggleRangeBtn"),
      writtenReviewQueueBtn: document.querySelector("#writtenReviewQueueBtn"),
      answerReviewQueueBtn: document.querySelector("#answerReviewQueueBtn"),
      practicalReviewQueueBtn: document.querySelector("#practicalReviewQueueBtn"),
      newStudyBtn: document.querySelector("#newStudyBtn"),
      clearQueueBtn: document.querySelector("#clearQueueBtn"),
      queueStatus: document.querySelector("#queueStatus"),
      showAnswerBtn: document.querySelector("#showAnswerBtn"),
      memoryCardBtn: document.querySelector("#memoryCardBtn"),
      memoryCardPanel: document.querySelector("#memoryCardPanel"),
      studyEditBtn: document.querySelector("#studyEditBtn"),
      phoneKeyboardBtn: document.querySelector("#phoneKeyboardBtn"),
      shortcutCapture: document.querySelector("#shortcutCapture"),
      studyFavoriteBtn: document.querySelector("#studyFavoriteBtn"),
      wrongBtn: document.querySelector("#wrongBtn"),
      masterBtn: document.querySelector("#masterBtn"),
      prevBtn: document.querySelector("#prevBtn"),
      nextBtn: document.querySelector("#nextBtn"),
      examTypeFilter: document.querySelector("#examTypeFilter"),
      categoryFilter: document.querySelector("#categoryFilter"),
      tagFilter: document.querySelector("#tagFilter"),
      statusFilter: document.querySelector("#statusFilter"),
      sortFilter: document.querySelector("#sortFilter"),
      favoriteFilter: document.querySelector("#favoriteFilter"),
      dashboardPanel: document.querySelector("#dashboardPanel"),
      insightPanel: document.querySelector("#insightPanel"),
      wrongReviewBtn: document.querySelector("#wrongReviewBtn"),
      masteredCheckBtn: document.querySelector("#masteredCheckBtn"),
      wrongList: document.querySelector("#wrongList"),
      masteredList: document.querySelector("#masteredList"),
      composeQuestionModeBtn: document.querySelector("#composeQuestionModeBtn"),
      composeTheoryModeBtn: document.querySelector("#composeTheoryModeBtn"),
      composeManageModeBtn: document.querySelector("#composeManageModeBtn"),
      theoryForm: document.querySelector("#theoryForm"),
      theoryEditId: document.querySelector("#theoryEditId"),
      theoryCategoryInput: document.querySelector("#theoryCategoryInput"),
      theoryTitleInput: document.querySelector("#theoryTitleInput"),
      theoryTagsInput: document.querySelector("#theoryTagsInput"),
      theoryContentInput: document.querySelector("#theoryContentInput"),
      theoryPromptInput: document.querySelector("#theoryPromptInput"),
      theoryPreview: document.querySelector("#theoryPreview"),
      theoryPreviewMeta: document.querySelector("#theoryPreviewMeta"),
      insertTheoryQuestionHintBtn: document.querySelector("#insertTheoryQuestionHintBtn"),
      slashMenu: document.querySelector("#slashMenu"),
      tableEditorBackdrop: document.querySelector("#tableEditorBackdrop"),
      tableEditorGrid: document.querySelector("#tableEditorGrid"),
      tableRowsInput: document.querySelector("#tableRowsInput"),
      tableColsInput: document.querySelector("#tableColsInput"),
      applyTableSizeBtn: document.querySelector("#applyTableSizeBtn"),
      addTableRowBtn: document.querySelector("#addTableRowBtn"),
      addTableColBtn: document.querySelector("#addTableColBtn"),
      closeTableEditorBtn: document.querySelector("#closeTableEditorBtn"),
      cancelTableEditorBtn: document.querySelector("#cancelTableEditorBtn"),
      insertTableEditorBtn: document.querySelector("#insertTableEditorBtn"),
      clearTheoryBtn: document.querySelector("#clearTheoryBtn"),
      theoryList: document.querySelector("#theoryList"),
      questionForm: document.querySelector("#questionForm"),
      editId: document.querySelector("#editId"),
      examTypeInput: document.querySelector("#examTypeInput"),
      categoryInput: document.querySelector("#categoryInput"),
      levelInput: document.querySelector("#levelInput"),
      tagsInput: document.querySelector("#tagsInput"),
      questionInput: document.querySelector("#questionInput"),
      answerInput: document.querySelector("#answerInput"),
      questionBlockButtons: document.querySelector("#questionBlockButtons"),
      answerBlockButtons: document.querySelector("#answerBlockButtons"),
      questionDiagnostics: document.querySelector("#questionDiagnostics"),
      questionPreview: document.querySelector("#questionPreview"),
      memoInput: document.querySelector("#memoInput"),
      insertClozeBtn: document.querySelector("#insertClozeBtn"),
      insertCalcTemplateBtn: document.querySelector("#insertCalcTemplateBtn"),
      ocrBox: document.querySelector("#ocrBox"),
      toggleOcrBtn: document.querySelector("#toggleOcrBtn"),
      photoFile: document.querySelector("#photoFile"),
      pickPhotoBtn: document.querySelector("#pickPhotoBtn"),
      applyOcrBtn: document.querySelector("#applyOcrBtn"),
      photoPairMode: document.querySelector("#photoPairMode"),
      ocrStatus: document.querySelector("#ocrStatus"),
      photoPreview: document.querySelector("#photoPreview"),
      clearPhotoBtn: document.querySelector("#clearPhotoBtn"),
      clearFormBtn: document.querySelector("#clearFormBtn"),
      exportBtn: document.querySelector("#exportBtn"),
      bankTable: document.querySelector("#bankTable"),
      bankSummary: document.querySelector("#bankSummary"),
      clearBankSearchBtn: document.querySelector("#clearBankSearchBtn"),
      csvFile: document.querySelector("#csvFile"),
      pickCsvBtn: document.querySelector("#pickCsvBtn"),
      csvPaste: document.querySelector("#csvPaste"),
      importPasteBtn: document.querySelector("#importPasteBtn"),
      downloadTemplateBtn: document.querySelector("#downloadTemplateBtn"),
      supabaseUrlInput: document.querySelector("#supabaseUrlInput"),
      supabaseAnonInput: document.querySelector("#supabaseAnonInput"),
      cloudEmailInput: document.querySelector("#cloudEmailInput"),
      cloudPasswordInput: document.querySelector("#cloudPasswordInput"),
      saveCloudConfigBtn: document.querySelector("#saveCloudConfigBtn"),
      signUpBtn: document.querySelector("#signUpBtn"),
      signInBtn: document.querySelector("#signInBtn"),
      signOutBtn: document.querySelector("#signOutBtn"),
      uploadCloudBtn: document.querySelector("#uploadCloudBtn"),
      downloadCloudBtn: document.querySelector("#downloadCloudBtn"),
      cloudStatus: document.querySelector("#cloudStatus"),
      installSettingsBtn: document.querySelector("#installSettingsBtn"),
      installStatus: document.querySelector("#installStatus"),
      installGuide: document.querySelector("#installGuide"),
      studyMusicFrame: document.querySelector("#studyMusicFrame"),
      musicNowTitle: document.querySelector("#musicNowTitle"),
      musicNowMeta: document.querySelector("#musicNowMeta"),
      musicLinkForm: document.querySelector("#musicLinkForm"),
      musicTitleInput: document.querySelector("#musicTitleInput"),
      musicUrlInput: document.querySelector("#musicUrlInput"),
      musicPrevBtn: document.querySelector("#musicPrevBtn"),
      musicOpenBtn: document.querySelector("#musicOpenBtn"),
      musicNextBtn: document.querySelector("#musicNextBtn"),
      musicList: document.querySelector("#musicList"),
      clearMusicBtn: document.querySelector("#clearMusicBtn"),
      musicStatus: document.querySelector("#musicStatus")
    };

    const WRITING_SYMBOLS = [
      "²", "³", "√", "±", "×", "÷", "≤", "≥", "≠", "°", "㎡", "㎥",
      "①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩", "→", "←", "∑", "π", "μ", "Ω", "※", "·", "ㆍ"
    ];
    const CIRCLED_NUMBER_SHORTCUTS = new Map([
      ["1", "①"],
      ["2", "②"],
      ["3", "③"],
      ["4", "④"],
      ["5", "⑤"],
      ["6", "⑥"],
      ["7", "⑦"],
      ["8", "⑧"],
      ["9", "⑨"],
      ["0", "⑩"]
    ]);

    const CALCULATION_TEMPLATE = "\n공식:\n\n대입:\n\n계산:\n\n답:\n";
    const THEORY_BLOCKS = [
      { id: "heading", label: "제목", icon: "H", hint: "# 제목 블록", template: "\n# 새 이론 제목\n\n정리할 내용을 입력하세요.\n" },
      { id: "key", label: "핵심 요약", icon: "!", hint: "핵심 개념과 암기 포인트", template: "\n## 핵심 요약\n\n- 핵심 개념:\n- 암기 포인트:\n- 주의할 표현:\n" },
      { id: "formula", label: "공식", icon: "√", hint: "공식, 단위, 기준", template: "\n## 공식\n\n공식: \n단위: \n기준: \n" },
      { id: "calc", label: "계산 풀이", icon: "=", hint: "공식, 대입, 계산, 답", template: CALCULATION_TEMPLATE },
      { id: "check", label: "체크리스트", icon: "☑", hint: "암기할 항목 확인", template: "\n- [ ] 암기할 항목\n- [ ] 헷갈리는 예외\n- [ ] 기출 연결 포인트\n" },
      { id: "callout", label: "암기 박스", icon: "※", hint: "강조해서 볼 문장", template: "\n> 암기 박스\n> 꼭 외워야 할 문장을 여기에 적으세요.\n" },
      { id: "table", label: "표", icon: "▦", hint: "3 x 3 표", template: () => buildMarkdownTable(3, 3) },
      { id: "divider", label: "구분선", icon: "―", hint: "내용 구간 나누기", template: "\n---\n" }
    ];

    const TABLE_SLASH_BLOCK = THEORY_BLOCKS.find(block => block.id === "table");
    const CALC_SLASH_BLOCK = THEORY_BLOCKS.find(block => block.id === "calc");
    const QUESTION_EXTRA_BLOCKS = [
      { id: "choices", label: "보기", icon: "V", hint: "통짜 보기 묶음", template: "\n1. 보기1\n2. 보기2\n3. 보기3\n4. 보기4\n\n" },
      { id: "cloze", label: "빈칸", icon: "□", hint: "빈칸 표시 삽입", template: "{{정답}}" },
      { id: "photo", label: "사진", icon: "⌁", hint: "사진 선택 또는 붙여넣기", action: "photo" },
      { id: "memo", label: "메모", icon: "M", hint: "메모 입력칸 열기", action: "memo" },
      { id: "tag", label: "태그", icon: "#", hint: "태그 입력칸 열기", action: "tag" }
    ];
    const QUESTION_SLASH_BLOCKS = [TABLE_SLASH_BLOCK, CALC_SLASH_BLOCK, ...QUESTION_EXTRA_BLOCKS].filter(Boolean);
    const SLASH_TARGETS = new Map([
      [els.theoryContentInput, THEORY_BLOCKS],
      [els.questionInput, QUESTION_SLASH_BLOCKS],
      [els.answerInput, QUESTION_SLASH_BLOCKS],
      [els.memoInput, QUESTION_SLASH_BLOCKS]
    ]);
    const DYNAMIC_SLASH_TARGETS = new WeakMap();

    let slashState = null;
    let tableEditorState = null;
    let activeMemoryCardQuestionId = "";

    setupTextTools();
    setupComposeBlocks();
    updateQuestionDiagnostics();

    document.querySelectorAll("[data-view-btn]").forEach(button => {
      button.addEventListener("click", () => handleViewButtonClick(button.dataset.viewBtn));
    });

    document.querySelectorAll("[data-summary-link]").forEach(button => {
      button.addEventListener("click", () => openSummaryList(button.dataset.summaryLink));
    });

    document.querySelectorAll("[data-more-btn]").forEach(button => {
      button.addEventListener("click", () => setMorePanel(button.dataset.moreBtn));
    });

    document.querySelectorAll("[data-more-view-btn]").forEach(button => {
      button.addEventListener("click", () => setView(button.dataset.moreViewBtn));
    });

    document.querySelectorAll("[data-record-btn]").forEach(button => {
      button.addEventListener("click", () => setRecordMode(button.dataset.recordBtn));
    });

    els.searchInput.addEventListener("input", () => { bankListMode = "filtered"; render(); });
    els.addExamBtn.addEventListener("click", addExam);
    els.mobileAddExamBtn.addEventListener("click", () => {
      addExam();
      closeMobileDrawer();
    });
    els.openDrawerBtn.addEventListener("click", openMobileDrawer);
    els.closeDrawerBtn.addEventListener("click", closeMobileDrawer);
    els.mobileBackdrop.addEventListener("click", closeMobileDrawer);
    els.toggleSearchBtn.addEventListener("click", toggleMobileSearch);
    els.installBtn.addEventListener("click", installApp);
    els.installSettingsBtn.addEventListener("click", installApp);
    els.musicLinkForm.addEventListener("submit", addMusicLink);
    els.musicPrevBtn.addEventListener("click", playPreviousMusic);
    els.musicOpenBtn.addEventListener("click", openCurrentMusicOnYoutube);
    els.musicNextBtn.addEventListener("click", playNextMusic);
    els.clearMusicBtn.addEventListener("click", clearMusicLibrary);
    els.examTypeFilter.addEventListener("change", () => { bankListMode = "filtered"; currentIndex = 0; currentTheoryIndex = 0; render(); });
    els.categoryFilter.addEventListener("change", () => { bankListMode = "filtered"; currentIndex = 0; currentTheoryIndex = 0; render(); });
    els.tagFilter.addEventListener("change", () => { bankListMode = "filtered"; currentIndex = 0; currentTheoryIndex = 0; render(); });
    els.statusFilter.addEventListener("change", () => { bankListMode = "filtered"; currentIndex = 0; render(); });
    els.sortFilter.addEventListener("change", () => { bankListMode = "filtered"; currentIndex = 0; currentTheoryIndex = 0; render(); });
    els.favoriteFilter.addEventListener("change", () => { bankListMode = "filtered"; currentIndex = 0; currentTheoryIndex = 0; render(); });
    els.shuffleBtn.addEventListener("click", shuffleQuestions);
    els.resetBtn.addEventListener("click", resetProgress);
    els.toggleRangeBtn.addEventListener("click", toggleStudyRange);
    els.writtenReviewQueueBtn.addEventListener("click", () => startReviewQueue("written"));
    els.answerReviewQueueBtn.addEventListener("click", () => startReviewQueue("answer"));
    els.practicalReviewQueueBtn.addEventListener("click", () => startReviewQueue("practical"));
    els.newStudyBtn.addEventListener("click", startNewQuestionStudy);
    els.clearQueueBtn.addEventListener("click", clearReviewQueue);
    els.wrongReviewBtn.addEventListener("click", startWrongReviewQueue);
    els.masteredCheckBtn.addEventListener("click", startMasteredCheckQueue);
    els.studyModeTabs.addEventListener("click", handleStudyModeTabClick);
    els.studyFavoriteBtn.addEventListener("click", toggleCurrentStudyFavorite);
    els.composeQuestionModeBtn.addEventListener("click", () => setComposeMode("question"));
    if (els.composeTheoryModeBtn) els.composeTheoryModeBtn.addEventListener("click", () => setComposeMode("theory"));
    els.composeManageModeBtn.addEventListener("click", () => setComposeMode("manage"));
    els.showAnswerBtn.addEventListener("click", handlePrimaryStudyAction);
    els.memoryCardBtn.addEventListener("click", openCurrentMemoryCard);
    els.studyEditBtn.addEventListener("click", editCurrentStudyQuestion);
    els.phoneKeyboardBtn.addEventListener("click", focusShortcutCapture);
    els.shortcutCapture.addEventListener("keydown", event => {
      if (handlePhoneStudyShortcut(event)) {
        event.stopPropagation();
        clearShortcutCapture();
        if (document.activeElement !== els.searchInput) keepShortcutCaptureFocused();
      }
    });
    els.shortcutCapture.addEventListener("input", handleShortcutCaptureInput);
    els.shortcutCapture.addEventListener("focus", updateShortcutCaptureState);
    els.shortcutCapture.addEventListener("blur", updateShortcutCaptureState);
    [els.answerHintBtn, els.answerKeywordBtn, els.answerFullBtn].forEach(button => {
      button.addEventListener("click", () => setAnswerStage(button.dataset.answerStage));
    });
    els.memoryModeBtn.addEventListener("click", toggleMemoryMode);
    els.prevBtn.addEventListener("click", () => moveCard(-1));
    els.nextBtn.addEventListener("click", () => moveCard(1));
    els.wrongBtn.addEventListener("click", markWrong);
    els.masterBtn.addEventListener("click", markMastered);
    els.myAnswer.addEventListener("input", updateAnswerAssist);
    els.theoryForm.addEventListener("submit", saveTheory);
    [els.theoryTitleInput, els.theoryCategoryInput, els.theoryContentInput, els.theoryPromptInput].forEach(input => {
      input.addEventListener("input", updateTheoryPreview);
    });
    SLASH_TARGETS.forEach((options, textarea) => registerSlashTextarea(textarea, options));
    document.querySelectorAll("[data-theory-block]").forEach(button => {
      button.addEventListener("click", () => insertTheoryBlock(button.dataset.theoryBlock));
    });
    els.insertTheoryQuestionHintBtn.addEventListener("click", buildTheoryQuestionHint);
    els.clearTheoryBtn.addEventListener("click", clearTheoryForm);
    els.questionForm.addEventListener("submit", saveQuestion);
    [els.questionInput, els.answerInput, els.examTypeInput, els.categoryInput, els.levelInput, els.tagsInput, els.memoInput].forEach(input => {
      input.addEventListener("input", updateQuestionDiagnostics);
      input.addEventListener("change", updateQuestionDiagnostics);
    });
    els.insertClozeBtn.addEventListener("click", insertClozeTemplate);
    els.insertCalcTemplateBtn.addEventListener("click", insertCalculationTemplate);
    els.clearFormBtn.addEventListener("click", clearForm);
    els.closeTableEditorBtn.addEventListener("click", closeTableEditor);
    els.cancelTableEditorBtn.addEventListener("click", closeTableEditor);
    els.tableEditorBackdrop.addEventListener("mousedown", event => {
      if (event.target === els.tableEditorBackdrop) closeTableEditor();
    });
    els.applyTableSizeBtn.addEventListener("click", applyTableEditorSize);
    els.addTableRowBtn.addEventListener("click", () => resizeTableEditor(tableEditorData().length + 1, tableEditorData()[0]?.length || 3));
    els.addTableColBtn.addEventListener("click", () => resizeTableEditor(tableEditorData().length || 3, (tableEditorData()[0]?.length || 3) + 1));
    els.insertTableEditorBtn.addEventListener("click", insertTableFromEditor);
    els.exportBtn.addEventListener("click", exportCsv);
    els.clearBankSearchBtn.addEventListener("click", clearBankSearch);
    els.toggleOcrBtn.addEventListener("click", toggleOcrBox);
    els.pickPhotoBtn.addEventListener("click", () => els.photoFile.click());
    els.photoFile.addEventListener("change", readQuestionPhoto);
    els.questionForm.addEventListener("paste", pasteQuestionPhoto);
    els.photoPairMode.addEventListener("change", () => {
      renderPhotoPreview();
      updateQuestionDiagnostics();
    });
    els.applyOcrBtn.addEventListener("click", applyOcrText);
    els.clearPhotoBtn.addEventListener("click", clearAttachedPhotos);
    els.pickCsvBtn.addEventListener("click", () => els.csvFile.click());
    els.csvFile.addEventListener("change", importCsvFile);
    els.importPasteBtn.addEventListener("click", () => importCsvText(els.csvPaste.value));
    els.downloadTemplateBtn.addEventListener("click", downloadTemplate);
    els.saveCloudConfigBtn.addEventListener("click", saveCloudConfig);
    els.signUpBtn.addEventListener("click", signUpCloud);
    els.signInBtn.addEventListener("click", signInCloud);
    els.signOutBtn.addEventListener("click", signOutCloud);
    els.uploadCloudBtn.addEventListener("click", uploadCloud);
    els.downloadCloudBtn.addEventListener("click", downloadCloud);
    window.addEventListener("resize", placeStudyRangeBox);
    document.addEventListener("keydown", event => {
      if (handleCircledNumberShortcut(event)) return;
      if (handlePhoneStudyShortcut(event)) return;
      if (event.key === "Escape") {
        if (tableEditorState) {
          closeTableEditor();
          return;
        }
        if (slashState) {
          closeSlashMenu();
          return;
        }
        closeMobileDrawer();
        document.body.classList.remove("search-open");
        els.toggleSearchBtn.textContent = "⌕";
        els.toggleSearchBtn.setAttribute("aria-label", "검색 열기");
      }
    });
    document.addEventListener("click", event => {
      const cloze = event.target.closest(".cloze");
      if (!cloze) return;
      cloze.classList.toggle("revealed");
      cloze.textContent = cloze.classList.contains("revealed") ? cloze.dataset.answer : "빈칸";
    });

    initCloudInputs();
    placeStudyRangeBox();
    setInitialStudyExamType();
    render();
    updateTheoryPreview();
    updateQuestionDiagnostics();
    setupPwa();
    initMusicLibrary();

    function loadState() {
      try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
        if (saved && Array.isArray(saved.questions)) {
          return normalizeState(saved);
        }
      } catch (error) {
        console.warn(error);
      }

      for (const key of OLD_STORAGE_KEYS) {
        try {
          const saved = JSON.parse(localStorage.getItem(key));
          if (saved && Array.isArray(saved.questions)) {
            const normalized = normalizeState(saved);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
            return normalized;
          }
        } catch (error) {
          console.warn(error);
        }
      }

      return normalizeState({ questions: [] });
    }

    function normalizeState(saved) {
      const savedExams = Array.isArray(saved.exams) ? saved.exams : DEFAULT_EXAMS;
      const exams = savedExams
        .filter(exam => exam && exam.id && exam.name)
        .map(exam => ({
          id: exam.id,
          name: exam.name,
          description: exam.description || "사용자 추가 시험"
        }));

      if (!exams.length) exams.push(...DEFAULT_EXAMS);

      const activeExamId = exams.some(exam => exam.id === saved.activeExamId) ? saved.activeExamId : exams[0].id;
      return {
        exams,
        activeExamId,
        questions: saved.questions.map(q => ({
          ...q,
          id: q.id || crypto.randomUUID(),
          examId: q.examId || DEFAULT_EXAM_ID,
          examType: normalizeExamType(q.examType),
          status: q.status || "new",
          wrongCount: q.wrongCount || 0,
          masteredAt: q.masteredAt || "",
          tags: normalizeTags(q.tags),
          favorite: Boolean(q.favorite),
          studyNote: String(q.studyNote || ""),
          memoryCard: normalizeMemoryCard(q.memoryCard),
          memoryCardStatus: ["known", "confused", "unknown"].includes(q.memoryCardStatus) ? q.memoryCardStatus : "",
          updatedAt: q.updatedAt || q.masteredAt || ""
        })),
        theories: Array.isArray(saved.theories) ? saved.theories.map(theory => ({
          id: theory.id || crypto.randomUUID(),
          examId: theory.examId || DEFAULT_EXAM_ID,
          category: theory.category || "미분류",
          title: theory.title || "제목 없는 이론",
          content: theory.content || "",
          prompt: theory.prompt || "",
          tags: normalizeTags(theory.tags),
          favorite: Boolean(theory.favorite),
          updatedAt: theory.updatedAt || ""
        })) : []
      };
    }

    function loadCloudConfig() {
      try {
        const saved = JSON.parse(localStorage.getItem(CLOUD_CONFIG_KEY));
        if (saved && saved.url && saved.anonKey) return saved;
      } catch (error) {
        console.warn(error);
      }
      return { url: "", anonKey: "" };
    }

    function initCloudInputs() {
      els.supabaseUrlInput.value = cloudConfig.url || "";
      els.supabaseAnonInput.value = cloudConfig.anonKey || "";
      getSupabaseClient();
      refreshCloudStatus();
    }

    function getSupabaseClient() {
      if (!cloudConfig.url || !cloudConfig.anonKey || !window.supabase) return null;
      if (!supabaseClient) {
        supabaseClient = window.supabase.createClient(cloudConfig.url, cloudConfig.anonKey);
      }
      return supabaseClient;
    }

    async function refreshCloudStatus(message = "") {
      const client = getSupabaseClient();
      if (!client) {
        setCloudStatus(message || "Supabase URL과 anon key를 저장하면 클라우드 동기화를 사용할 수 있습니다.");
        return;
      }

      const { data } = await client.auth.getUser();
      const email = data?.user?.email;
      setCloudStatus(message || (email ? `로그인됨: ${email}` : "연결 정보는 저장됨. 회원가입 또는 로그인을 진행하세요."));
    }

    function setCloudStatus(message) {
      els.cloudStatus.textContent = message;
    }

    function saveCloudConfig() {
      cloudConfig.url = els.supabaseUrlInput.value.trim();
      cloudConfig.anonKey = els.supabaseAnonInput.value.trim();
      supabaseClient = null;
      localStorage.setItem(CLOUD_CONFIG_KEY, JSON.stringify(cloudConfig));
      refreshCloudStatus("Supabase 연결 정보를 저장했습니다.");
    }

    async function signUpCloud() {
      const client = requireSupabaseClient();
      if (!client) return;
      const email = els.cloudEmailInput.value.trim();
      const password = els.cloudPasswordInput.value;
      if (!email || !password) return alert("이메일과 비밀번호를 입력하세요.");

      setCloudStatus("회원가입 중...");
      const { error } = await client.auth.signUp({ email, password });
      if (error) return setCloudStatus(`회원가입 실패: ${error.message}`);
      refreshCloudStatus("회원가입 완료. 이메일 확인이 필요한 설정이면 메일함을 확인하세요.");
    }

    async function signInCloud() {
      const client = requireSupabaseClient();
      if (!client) return;
      const email = els.cloudEmailInput.value.trim();
      const password = els.cloudPasswordInput.value;
      if (!email || !password) return alert("이메일과 비밀번호를 입력하세요.");

      setCloudStatus("로그인 중...");
      const { error } = await client.auth.signInWithPassword({ email, password });
      if (error) return setCloudStatus(`로그인 실패: ${error.message}`);
      refreshCloudStatus("로그인했습니다.");
    }

    async function signOutCloud() {
      const client = requireSupabaseClient();
      if (!client) return;
      await client.auth.signOut();
      refreshCloudStatus("로그아웃했습니다.");
    }

    function requireSupabaseClient() {
      const client = getSupabaseClient();
      if (!client) {
        alert("먼저 Supabase URL과 anon key를 저장하세요.");
        return null;
      }
      return client;
    }

    async function requireCloudUser(client) {
      const { data, error } = await client.auth.getUser();
      if (error || !data?.user) {
        setCloudStatus("먼저 로그인하세요.");
        return null;
      }
      return data.user;
    }

    function persist() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }

    function normalizeTags(value) {
      const raw = Array.isArray(value) ? value : String(value || "").split(/[,#]/);
      return [...new Set(raw.map(tag => String(tag).trim()).filter(Boolean))];
    }

    function tagsToInput(tags) {
      return normalizeTags(tags).join(", ");
    }

    function normalizeExamType(value) {
      return ["written", "multiple", "practical"].includes(value) ? value : "written";
    }

    function examTypeLabel(value) {
      const labels = {
        written: "실기 필답형",
        multiple: "필기 4지선다",
        practical: "실기 작업형"
      };
      return labels[normalizeExamType(value)];
    }

    function renderTags(tags) {
      const normalized = normalizeTags(tags);
      if (!normalized.length) return "";
      return `<div class="tag-row">${normalized.map(tag => `<span class="tag-chip">#${escapeHtml(tag)}</span>`).join("")}</div>`;
    }

    function renderTypeChips(question) {
      const types = detectQuestionTypes(question);
      if (!types.length) return "";
      return `<div class="type-row">${types.map(type => `<span class="type-chip">${escapeHtml(type)}</span>`).join("")}</div>`;
    }

    function detectQuestionTypes(question) {
      const q = String(question?.question || "");
      const a = String(question?.answer || "");
      const combined = `${q}\n${a}`;
      const examType = normalizeExamType(question?.examType);
      const types = [examTypeLabel(examType)];
      if (question?.questionImage || question?.answerImage || /\[사진\]|사진 문제|도면|그림|이미지|TF도|SIGN/i.test(combined)) types.push("사진형");
      if (extractChoiceBank(q).items.length || splitQuestionOptions(q).options.length >= 2 || /\[보기\]|보기\s*[:：]/.test(q)) types.push("보기형");
      if (/\{\{[^{}]+\}\}|빈칸|괄호|____|___/.test(combined)) types.push("빈칸형");
      if (isMarkdownTable(q) || isMarkdownTable(a) || /\|.+\|/.test(combined)) types.push("표형");
      if (/계산|공식|풀이|=\s*|×|÷|\b\d+\s*[%xX*/+\-]\s*\d+/.test(combined)) types.push("계산형");
      if (examType === "written") types.push("서술형");
      if (examType === "practical") types.push("지문/이미지 답안형");
      return [...new Set(types)].slice(0, 4);
    }

    function tagMatches(item, tag) {
      return !tag || tag === "all" || normalizeTags(item.tags).includes(tag);
    }

    function favoriteMatches(item) {
      return !els.favoriteFilter.checked || Boolean(item.favorite);
    }

    function itemTime(item) {
      return Date.parse(item.updatedAt || item.masteredAt || "") || 0;
    }

    function studyQuestionRank(question) {
      if (question.status === "wrong") return 1;
      if (question.status === "mastered") return 2;
      return 0;
    }

    function sortItems(items) {
      const sort = els.sortFilter.value;
      const copy = [...items];
      if (sort === "recent") {
        copy.sort((a, b) => itemTime(b) - itemTime(a));
      } else if (sort === "wrong") {
        copy.sort((a, b) => (b.wrongCount || 0) - (a.wrongCount || 0));
      }
      return copy;
    }

    function sortStudyQuestions(items) {
      const sort = els.sortFilter.value;
      return [...items].sort((a, b) => {
        const rank = studyQuestionRank(a) - studyQuestionRank(b);
        if (rank) return rank;
        if (sort === "recent") return itemTime(b) - itemTime(a);
        if (sort === "wrong") return (b.wrongCount || 0) - (a.wrongCount || 0) || itemTime(b) - itemTime(a);
        return 0;
      });
    }

    function filteredQuestions() {
      const search = els.searchInput.value.trim().toLowerCase();
      const examType = els.examTypeFilter.value;
      const category = els.categoryFilter.value;
      const tag = els.tagFilter.value;
      const status = els.statusFilter.value;
      const matches = state.questions.filter(q => {
        const text = [q.category, q.level, q.question, q.answer, q.memo, q.imageName, normalizeTags(q.tags).join(" ")].join(" ").toLowerCase();
        const examOk = (q.examId || DEFAULT_EXAM_ID) === state.activeExamId;
        const examTypeOk = !examType || examType === "all" || normalizeExamType(q.examType) === examType;
        const categoryOk = !category || category === "all" || q.category === category;
        const tagOk = tagMatches(q, tag);
        const favoriteOk = favoriteMatches(q);
        const statusOk = status === "all" || q.status === status;
        const searchOk = !search || text.includes(search);
        return examOk && examTypeOk && categoryOk && tagOk && favoriteOk && statusOk && searchOk;
      });
      if (!reviewQueueIds.length) return sortStudyQuestions(matches);
      return reviewQueueIds
        .map(id => matches.find(q => q.id === id))
        .filter(Boolean);
    }

    function filteredStudyQuestions() {
      const questions = filteredQuestions();
      if (els.statusFilter.value === "mastered" || includeMasteredInStudyAll) return questions;
      return questions.filter(q => q.status !== "mastered");
    }

    function filteredTheories() {
      const search = els.searchInput.value.trim().toLowerCase();
      const category = els.categoryFilter.value;
      const tag = els.tagFilter.value;
      return sortItems(currentExamTheories().filter(theory => {
        const text = [theory.category, theory.title, theory.content, theory.prompt, normalizeTags(theory.tags).join(" ")].join(" ").toLowerCase();
        const categoryOk = !category || category === "all" || theory.category === category;
        const tagOk = tagMatches(theory, tag);
        const favoriteOk = favoriteMatches(theory);
        const searchOk = !search || text.includes(search);
        return categoryOk && tagOk && favoriteOk && searchOk;
      }));
    }

    function render() {
      renderExamTabs();
      renderStats();
      renderFilters();
      renderDashboard();
      renderStudy();
      renderTheories();
      renderWrongList();
      renderMasteredList();
      renderBank();
    }

    function currentExam() {
      return state.exams.find(exam => exam.id === state.activeExamId) || state.exams[0];
    }

    function currentExamQuestions() {
      return state.questions.filter(q => (q.examId || DEFAULT_EXAM_ID) === state.activeExamId);
    }

    function currentExamTheories() {
      return (state.theories || []).filter(theory => (theory.examId || DEFAULT_EXAM_ID) === state.activeExamId);
    }

    function renderExamTabs() {
      renderExamButtons(els.examTabs);
      renderExamButtons(els.mobileExamTabs, { closeOnSelect: true });
    }

    function renderExamButtons(root, options = {}) {
      root.innerHTML = state.exams.map(exam => {
        const count = state.questions.filter(q => (q.examId || DEFAULT_EXAM_ID) === exam.id).length;
        return `<div class="exam-row">
          <button class="${exam.id === state.activeExamId ? "active" : ""}" data-exam-id="${escapeHtml(exam.id)}">
            <b>${escapeHtml(exam.name)}</b>
            <span>${escapeHtml(exam.description)} · ${count}문제</span>
          </button>
          <button class="exam-icon" data-rename-exam="${escapeHtml(exam.id)}" title="시험 이름 변경">수정</button>
          <button class="exam-icon" data-delete-exam="${escapeHtml(exam.id)}" title="시험 삭제">삭제</button>
        </div>`;
      }).join("");

      root.querySelectorAll("[data-exam-id]").forEach(button => {
        button.addEventListener("click", () => {
          state.activeExamId = button.dataset.examId;
          reviewQueueIds = [];
          currentIndex = 0;
          persist();
          render();
          if (options.closeOnSelect) closeMobileDrawer();
        });
      });

      root.querySelectorAll("[data-rename-exam]").forEach(button => {
        button.addEventListener("click", () => renameExam(button.dataset.renameExam));
      });

      root.querySelectorAll("[data-delete-exam]").forEach(button => {
        button.addEventListener("click", () => deleteExam(button.dataset.deleteExam));
      });
    }

    function addExam() {
      const name = prompt("추가할 시험 이름을 입력하세요. 예: 전기기사 필기");
      if (!name || !name.trim()) return;

      const trimmed = name.trim();
      const exam = {
        id: `exam-${Date.now()}`,
        name: trimmed,
        description: "사용자 추가 시험"
      };
      state.exams.push(exam);
      state.activeExamId = exam.id;
      reviewQueueIds = [];
      currentIndex = 0;
      persist();
      render();
    }

    function renameExam(id) {
      const exam = state.exams.find(item => item.id === id);
      if (!exam) return;

      const name = prompt("시험 이름을 수정하세요.", exam.name);
      if (!name || !name.trim()) return;

      exam.name = name.trim();
      persist();
      render();
    }

    function deleteExam(id) {
      const exam = state.exams.find(item => item.id === id);
      if (!exam) return;

      if (state.exams.length <= 1) {
        alert("시험 탭은 최소 1개가 필요합니다.");
        return;
      }

      const count = state.questions.filter(q => (q.examId || DEFAULT_EXAM_ID) === id).length;
      const theoryCount = (state.theories || []).filter(theory => (theory.examId || DEFAULT_EXAM_ID) === id).length;
      const ok = confirm(`"${exam.name}" 시험 탭을 삭제할까요?\n이 시험에 들어 있는 ${count}개 문제와 ${theoryCount}개 이론도 함께 삭제됩니다.`);
      if (!ok) return;

      state.exams = state.exams.filter(item => item.id !== id);
      state.questions = state.questions.filter(q => (q.examId || DEFAULT_EXAM_ID) !== id);
      state.theories = (state.theories || []).filter(theory => (theory.examId || DEFAULT_EXAM_ID) !== id);
      if (state.activeExamId === id) state.activeExamId = state.exams[0].id;
      reviewQueueIds = [];
      currentIndex = 0;
      persist();
      render();
    }

    async function uploadCloud() {
      const client = requireSupabaseClient();
      if (!client) return;
      const user = await requireCloudUser(client);
      if (!user) return;

      setCloudStatus("클라우드로 업로드 중...");
      const examRows = state.exams.map(exam => ({
        id: exam.id,
        user_id: user.id,
        name: exam.name,
        description: exam.description || "",
        updated_at: new Date().toISOString()
      }));
      const questionRows = state.questions.map(q => ({
        id: q.id,
        user_id: user.id,
        exam_id: q.examId || DEFAULT_EXAM_ID,
        category: q.category || "미분류",
        level: q.level || "중",
        question: q.question || "",
        answer: q.answer || "",
        memo: buildCloudMemo(q),
        status: q.status || "new",
        wrong_count: q.wrongCount || 0,
        mastered_at: q.masteredAt || null,
        updated_at: new Date().toISOString()
      }));

      const { error: examError } = await client.from("exam_tabs").upsert(examRows);
      if (examError) return setCloudStatus(`시험 탭 업로드 실패: ${examError.message}`);

      const backupResult = await uploadCloudBackup(client, user);
      if (!backupResult.ok) return setCloudStatus(backupResult.message);

      const { error: staleDeleteError } = await client
        .from("exam_questions")
        .delete()
        .eq("user_id", user.id)
        .neq("category", CLOUD_BACKUP_CATEGORY);
      if (staleDeleteError) return setCloudStatus(`기존 클라우드 문제 정리 실패: ${staleDeleteError.message}`);

      if (questionRows.length) {
        const { error: questionError } = await client.from("exam_questions").upsert(questionRows);
        if (questionError) return setCloudStatus(`문제 업로드 실패: ${questionError.message}`);
      }

      const { count: cloudQuestionCount } = await client
        .from("exam_questions")
        .select("id", { count: "exact", head: true })
        .neq("category", CLOUD_BACKUP_CATEGORY);
      const cloudCountText = Number.isFinite(cloudQuestionCount) ? `, 클라우드 확인 ${cloudQuestionCount}개` : "";
      setCloudStatus(`업로드 완료: 시험 ${examRows.length}개, 이 기기 문제 ${questionRows.length}개${cloudCountText}, 백업 ${backupResult.chunkCount}조각`);
    }

    async function downloadCloud() {
      const client = requireSupabaseClient();
      if (!client) return;
      const user = await requireCloudUser(client);
      if (!user) return;

      if (!confirm("클라우드 데이터를 이 기기에 덮어쓸까요? 현재 기기의 로컬 데이터는 클라우드 내용으로 바뀝니다.")) return;

      setCloudStatus("클라우드에서 가져오는 중...");
      const backup = await downloadCloudBackup(client, user);
      if (backup.ok) {
        const normalized = normalizeState(backup.data);
        state.exams = normalized.exams;
        state.questions = normalized.questions;
        state.theories = normalized.theories;
        state.activeExamId = normalized.activeExamId;
        currentIndex = 0;
        persist();
        render();
        setCloudStatus(`백업으로 가져오기 완료: 전체 ${state.questions.length}개 · ${questionCountSummary()}`);
        return;
      }

      const { data: exams, error: examError } = await fetchAllCloudRows(
        client,
        "exam_tabs",
        query => query.order("created_at", { ascending: true })
      );
      if (examError) return setCloudStatus(`시험 탭 가져오기 실패: ${examError.message}`);

      const { data: questions, error: questionError } = await fetchAllCloudRows(
        client,
        "exam_questions",
        query => query.order("created_at", { ascending: true })
      );
      if (questionError) return setCloudStatus(`문제 가져오기 실패: ${questionError.message}`);

      state.exams = (exams || []).map(row => ({
        id: row.id,
        name: row.name,
        description: row.description || "사용자 추가 시험"
      }));
      if (!state.exams.length) state.exams = [...DEFAULT_EXAMS];

      state.questions = (questions || []).filter(row => row.category !== CLOUD_BACKUP_CATEGORY).map(row => {
        const cloudMemo = parseCloudMemo(row.memo || "");
        return {
          id: row.id,
          examId: row.exam_id,
          examType: normalizeExamType(cloudMemo.payload.examType),
          category: row.category,
          level: row.level,
          question: row.question,
          answer: row.answer,
          memo: cloudMemo.memo,
          questionImage: cloudMemo.payload.questionImage || "",
          imageName: cloudMemo.payload.imageName || "",
          answerImage: cloudMemo.payload.answerImage || "",
          answerImageName: cloudMemo.payload.answerImageName || "",
          tags: normalizeTags(cloudMemo.payload.tags),
          favorite: Boolean(cloudMemo.payload.favorite),
          studyNote: String(cloudMemo.payload.studyNote || ""),
          memoryCard: normalizeMemoryCard(cloudMemo.payload.memoryCard),
          memoryCardStatus: ["known", "confused", "unknown"].includes(cloudMemo.payload.memoryCardStatus) ? cloudMemo.payload.memoryCardStatus : "",
          status: row.status || "new",
          wrongCount: row.wrong_count || 0,
          masteredAt: row.mastered_at || "",
          updatedAt: cloudMemo.payload.updatedAt || row.updated_at || ""
        };
      });
      state.theories = [];

      state.activeExamId = pickExamWithMostQuestions();
      currentIndex = 0;
      persist();
      render();
      setCloudStatus(`가져오기 완료: 전체 ${state.questions.length}개 · ${questionCountSummary()}`);
    }

    async function uploadCloudBackup(client, user) {
      const backupExamId =
        state.exams.find(exam => exam.id === state.activeExamId)?.id ||
        state.exams[0]?.id ||
        DEFAULT_EXAM_ID;
      const payload = encodeURIComponent(JSON.stringify({
        exams: state.exams,
        activeExamId: state.activeExamId,
        questions: state.questions,
        theories: state.theories || [],
        savedAt: new Date().toISOString()
      }));
      const chunks = chunkText(payload, CLOUD_BACKUP_CHUNK_SIZE);

      const { error: deleteError } = await client
        .from("exam_questions")
        .delete()
        .eq("user_id", user.id)
        .eq("category", CLOUD_BACKUP_CATEGORY);
      if (deleteError) {
        return { ok: false, message: `백업 정리 실패: ${deleteError.message}`, chunkCount: 0 };
      }

      for (let index = 0; index < chunks.length; index++) {
        const row = {
          id: crypto.randomUUID(),
          user_id: user.id,
          exam_id: backupExamId,
          category: CLOUD_BACKUP_CATEGORY,
          level: String(index).padStart(4, "0"),
          question: `backup ${index + 1}/${chunks.length}`,
          answer: "",
          memo: chunks[index],
          status: "new",
          wrong_count: 0,
          mastered_at: null,
          updated_at: new Date().toISOString()
        };
        const { error } = await client.from("exam_questions").upsert(row);
        if (error) return { ok: false, message: `백업 업로드 실패: ${error.message}`, chunkCount: index };
      }

      return { ok: true, message: "", chunkCount: chunks.length };
    }

    async function downloadCloudBackup(client, user) {
      const { data, error } = await fetchAllCloudRows(
        client,
        "exam_questions",
        query => query
          .eq("user_id", user.id)
          .eq("category", CLOUD_BACKUP_CATEGORY)
          .order("level", { ascending: true })
      );

      if (error || !data?.length) return { ok: false, data: null };

      try {
        const joined = data
          .slice()
          .sort((a, b) => String(a.level || "").localeCompare(String(b.level || "")))
          .map(row => row.memo || "")
          .join("");
        return { ok: true, data: JSON.parse(decodeURIComponent(joined)) };
      } catch (error) {
        console.warn("Cloud backup restore failed.", error);
        return { ok: false, data: null };
      }
    }

    async function fetchAllCloudRows(client, tableName, configureQuery) {
      const pageSize = 1000;
      const rows = [];
      let start = 0;

      while (true) {
        let query = client.from(tableName).select("*");
        if (configureQuery) query = configureQuery(query);
        const { data, error } = await query.range(start, start + pageSize - 1);
        if (error) return { data: null, error };

        const page = data || [];
        rows.push(...page);
        if (page.length < pageSize) break;
        start += pageSize;
      }

      return { data: rows, error: null };
    }

    function chunkText(text, size) {
      const chunks = [];
      for (let index = 0; index < text.length; index += size) {
        chunks.push(text.slice(index, index + size));
      }
      return chunks.length ? chunks : [""];
    }

    function pickExamWithMostQuestions() {
      if (!state.exams.length) return DEFAULT_EXAM_ID;
      const counts = state.exams.map(exam => ({
        id: exam.id,
        count: state.questions.filter(q => (q.examId || DEFAULT_EXAM_ID) === exam.id).length
      }));
      counts.sort((a, b) => b.count - a.count);
      return counts[0]?.id || state.exams[0].id;
    }

    function questionCountSummary() {
      return state.exams.map(exam => {
        const count = state.questions.filter(q => (q.examId || DEFAULT_EXAM_ID) === exam.id).length;
        return `${exam.name} ${count}개`;
      }).join(", ");
    }

    function buildCloudMemo(question) {
      const cleanMemo = stripCloudPayload(question.memo || "");
      const payload = {
        examType: normalizeExamType(question.examType),
        questionImage: question.questionImage || "",
        imageName: question.imageName || "",
        answerImage: question.answerImage || "",
        answerImageName: question.answerImageName || "",
        tags: normalizeTags(question.tags),
        favorite: Boolean(question.favorite),
        studyNote: String(question.studyNote || ""),
        memoryCard: normalizeMemoryCard(question.memoryCard),
        memoryCardStatus: question.memoryCardStatus || "",
        updatedAt: question.updatedAt || ""
      };
      const hasPayload = Object.values(payload).some(Boolean);
      if (!hasPayload) return cleanMemo;
      return `${cleanMemo}${CLOUD_SYNC_START}${encodeURIComponent(JSON.stringify(payload))}${CLOUD_SYNC_END}`;
    }

    function parseCloudMemo(memo) {
      const source = String(memo || "");
      const start = source.indexOf(CLOUD_SYNC_START);
      if (start < 0) return { memo: source, payload: {} };

      const payloadStart = start + CLOUD_SYNC_START.length;
      const end = source.indexOf(CLOUD_SYNC_END, payloadStart);
      if (end < 0) return { memo: source, payload: {} };

      const visibleMemo = `${source.slice(0, start)}${source.slice(end + CLOUD_SYNC_END.length)}`.trim();
      try {
        return {
          memo: visibleMemo,
          payload: JSON.parse(decodeURIComponent(source.slice(payloadStart, end)))
        };
      } catch (error) {
        console.warn("Failed to parse cloud sync payload.", error);
        return { memo: visibleMemo, payload: {} };
      }
    }

    function stripCloudPayload(memo) {
      return parseCloudMemo(memo).memo;
    }

    function renderStats() {
      const questions = currentExamQuestions();
      const theories = currentExamTheories();
      const mastered = questions.filter(q => q.status === "mastered").length;
      const wrong = questions.filter(q => q.status === "wrong").length;
      const progress = questions.length ? Math.round((mastered / questions.length) * 100) : 0;
      const exam = currentExam();

      els.currentExamTitle.textContent = exam?.name || APP_TITLE;
      els.studySummaryText.textContent = `${questions.length}문제 · ${theories.length}개 이론, ${mastered}문제 암기 완료, ${wrong}문제 오답 표시`;
      els.summaryTotal.textContent = questions.length;
      els.summaryWrong.textContent = wrong;
      els.summaryMastered.textContent = mastered;
      els.progressLabel.textContent = `${progress}% 완료`;
      els.progressFill.style.width = `${progress}%`;
      els.totalCount.textContent = questions.length;
      els.wrongCount.textContent = wrong;
      els.masteredCount.textContent = mastered;
    }

    function renderFilters() {
      const selected = els.categoryFilter.value || "all";
      const selectedTag = els.tagFilter.value || "all";
      const categories = studyMode === "theory"
        ? currentExamTheories().map(theory => theory.category).filter(Boolean)
        : currentExamQuestions().map(q => q.category).filter(Boolean);
      const uniqueCategories = [...new Set(categories)].sort();
      els.categoryFilter.innerHTML = `<option value="all">전체</option>` + uniqueCategories.map(category => {
        return `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`;
      }).join("");
      els.categoryFilter.value = uniqueCategories.includes(selected) ? selected : "all";

      const source = studyMode === "theory" ? currentExamTheories() : currentExamQuestions();
      const tags = [...new Set(source.flatMap(item => normalizeTags(item.tags)))].sort();
      els.tagFilter.innerHTML = `<option value="all">전체</option>` + tags.map(tag => {
        return `<option value="${escapeHtml(tag)}">#${escapeHtml(tag)}</option>`;
      }).join("");
      els.tagFilter.value = tags.includes(selectedTag) ? selectedTag : "all";
    }

    function renderDashboard() {
      const source = studyMode === "theory" ? currentExamTheories() : currentExamQuestions();
      const filtered = studyMode === "theory" ? filteredTheories() : filteredQuestions();
      const favoriteCount = source.filter(item => item.favorite).length;
      const tagCount = new Set(source.flatMap(item => normalizeTags(item.tags))).size;
      const wrongCount = studyMode === "question"
        ? source.filter(item => item.status === "wrong").length
        : currentExamQuestions().filter(item => item.status === "wrong").length;
      els.dashboardPanel.innerHTML = `
        <div class="dash-tile"><b>${filtered.length}</b><span>현재 표시</span></div>
        <div class="dash-tile"><b>${favoriteCount}</b><span>중요 표시</span></div>
        <div class="dash-tile"><b>${tagCount}</b><span>태그 수</span></div>
        <div class="dash-tile"><b>${wrongCount}</b><span>오답</span></div>
      `;
      renderInsights(filtered);
      const queueActive = studyMode === "question" && reviewQueueIds.length > 0;
      els.clearQueueBtn.classList.toggle("hidden", !queueActive);
      els.queueStatus.textContent = queueActive
        ? `${reviewQueueLabel || "복습 큐"} ${reviewQueueIds.length}개를 학습 중입니다.`
        : "유형별로 오답, 중요, 오래 안 본 문제를 자동으로 모읍니다.";
    }

    function renderInsights(source) {
      if (studyMode !== "question") {
        els.insightPanel.innerHTML = "";
        return;
      }
      const formatItems = wrongFormatStats(source).slice(0, 5);
      const typeItems = wrongTypeStats(source).slice(0, 4);
      const comboItems = wrongCategoryTypeStats(source).slice(0, 5);
      const weakItems = weakKeywordStats(source).slice(0, 5);
      const roundItems = roundProgressStats(source).slice(0, 8);
      const formatHtml = formatItems.length
        ? formatItems.map(item => renderInsightStatItem(item.label, `${item.count}문제 · 누적 오답 ${item.wrongTotal}회`, item.hint)).join("")
        : `<div class="empty">오답이 쌓이면 자주 틀리는 문제 형식이 표시됩니다.</div>`;
      const typeHtml = typeItems.length
        ? typeItems.map(item => renderInsightStatItem(item.label, `${item.count}문제 · 누적 오답 ${item.wrongTotal}회`, item.hint)).join("")
        : `<div class="empty">오답이 쌓이면 취약한 시험 유형이 표시됩니다.</div>`;
      const comboHtml = comboItems.length
        ? comboItems.map(item => renderInsightStatItem(item.label, `${item.count}문제 · 누적 오답 ${item.wrongTotal}회`, item.hint)).join("")
        : `<div class="empty">분야와 시험 유형을 함께 보면 취약 구간이 표시됩니다.</div>`;
      const weakHtml = weakItems.length
        ? weakItems.map(item => renderInsightStatItem(item.word, `오답 문제 ${item.count}개에서 반복`, item.examples.join(" · "))).join("")
        : `<div class="empty">의미 있는 반복 키워드가 쌓이면 보조 정보로 표시됩니다.</div>`;
      const roundHtml = roundItems.length
        ? roundItems.map(item => {
            return `<div class="round-progress-item">
              <div class="round-progress-top"><strong>${escapeHtml(item.category)}</strong><span>${item.progress}%</span></div>
              <div class="mini-progress"><i style="width:${item.progress}%"></i></div>
              <div class="round-progress-meta">${item.total}문제 · 완료 ${item.mastered} · 오답 ${item.wrong}</div>
            </div>`;
          }).join("")
        : `<div class="empty">문제를 추가하면 회차별 진행률이 표시됩니다.</div>`;
      els.insightPanel.innerHTML = `
        <section class="insight-section">
          <h3>자주 틀리는 문제 형식</h3>
          <div class="weak-list">${formatHtml}</div>
        </section>
        <section class="insight-section">
          <h3>취약한 시험 유형</h3>
          <div class="weak-list">${typeHtml}</div>
        </section>
        <section class="insight-section">
          <h3>취약 분야 + 유형</h3>
          <div class="weak-list">${comboHtml}</div>
        </section>
        <section class="insight-section">
          <h3>반복 키워드</h3>
          <div class="weak-list">${weakHtml}</div>
        </section>
        <section class="insight-section">
          <h3>회차별 진행률</h3>
          <div class="round-progress-list">${roundHtml}</div>
        </section>
      `;
    }

    function renderInsightStatItem(title, meta, hint = "") {
      const hintHtml = hint ? `<em>${escapeHtml(hint)}</em>` : "";
      return `<div class="weak-item"><strong>${escapeHtml(title)}</strong><span>${escapeHtml(meta)}</span>${hintHtml}</div>`;
    }

    function wrongQuestions(questions) {
      return questions.filter(q => q.status === "wrong" || (q.wrongCount || 0) > 0);
    }

    function addInsightGroup(groups, key, label, question, hint = "") {
      if (!groups.has(key)) groups.set(key, { label, count: 0, wrongTotal: 0, hints: new Map() });
      const item = groups.get(key);
      item.count += 1;
      item.wrongTotal += Math.max(1, qWrongCount(question));
      if (hint) item.hints.set(hint, (item.hints.get(hint) || 0) + 1);
    }

    function groupedInsightStats(groups) {
      return [...groups.values()]
        .map(item => {
          const hint = [...item.hints.entries()]
            .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
            .slice(0, 2)
            .map(([name]) => name)
            .join(" · ");
          return { ...item, hint };
        })
        .sort((a, b) => b.wrongTotal - a.wrongTotal || b.count - a.count || a.label.localeCompare(b.label));
    }

    function qWrongCount(question) {
      return Number(question?.wrongCount || 0) || (question?.status === "wrong" ? 1 : 0);
    }

    function wrongTypeStats(questions) {
      const groups = new Map();
      wrongQuestions(questions).forEach(q => {
        const label = examTypeLabel(q.examType);
        const hint = q.category || "미분류";
        addInsightGroup(groups, normalizeExamType(q.examType), label, q, hint);
      });
      return groupedInsightStats(groups);
    }

    function wrongCategoryTypeStats(questions) {
      const groups = new Map();
      wrongQuestions(questions).forEach(q => {
        const category = q.category || "미분류";
        const type = examTypeLabel(q.examType);
        addInsightGroup(groups, `${category}|${type}`, `${category} · ${type}`, q, inferQuestionFormat(q).label);
      });
      return groupedInsightStats(groups);
    }

    function wrongFormatStats(questions) {
      const groups = new Map();
      wrongQuestions(questions).forEach(q => {
        const format = inferQuestionFormat(q);
        const hint = q.category || examTypeLabel(q.examType);
        addInsightGroup(groups, format.key, format.label, q, hint);
      });
      return groupedInsightStats(groups);
    }

    function inferQuestionFormat(question) {
      const q = String(question?.question || "");
      const a = String(question?.answer || "");
      const memo = String(question?.memo || "");
      const combined = `${q}\n${a}\n${memo}`;
      const examType = normalizeExamType(question?.examType);
      if (question?.questionImage || question?.answerImage || /\[사진\]|사진 문제|도면|그림|이미지|TF도|SIGN/i.test(combined)) {
        return { key: "image", label: "사진/도면형" };
      }
      if (extractChoiceBank(q).items.length || splitQuestionOptions(q).options.length >= 2 || /\[보기\]|보기\s*[:：]/.test(q)) {
        return { key: "choice", label: "보기 선택형" };
      }
      if (/\{\{[^{}]+\}\}|빈칸|괄호|____|___/.test(combined)) {
        return { key: "blank", label: "빈칸/괄호형" };
      }
      if (/계산|공식|풀이|산출|구하|구하여|계산하|산정|=\s*|×|÷|\b\d+\s*[%xX*/+\-]\s*\d+|m\/s|㎡|m2|dB|kg|kN/i.test(combined)) {
        return { key: "calculation", label: "계산/산출형" };
      }
      if (isMarkdownTable(q) || isMarkdownTable(a) || /\|.+\|/.test(combined)) {
        return { key: "table", label: "표 정리형" };
      }
      if (/법령|법규|기준|규정|산업안전보건법|시행령|시행규칙|고시|별표|허용기준|안전보건규칙/.test(combined)) {
        return { key: "rule", label: "법령/기준형" };
      }
      if (/순서|절차|방법|작업방법|대책|조치|예방|유의사항|작성하시오|쓰시오/.test(combined)) {
        return { key: "procedure", label: "절차/대책 서술형" };
      }
      if (parseNumberedAnswerItems(a).length >= 2 || /①|②|③|1\.\s|2\.\s/.test(a)) {
        return { key: "list", label: "암기 목록형" };
      }
      if (/정의|설명|무엇|의미|용어|특징|목적/.test(combined)) {
        return { key: "concept", label: "정의/개념형" };
      }
      if (examType === "multiple") return { key: "multiple-short", label: "필기 단답/선택형" };
      if (examType === "practical") return { key: "practical-context", label: "작업상황 판단형" };
      return { key: "short-answer", label: "일반 단답형" };
    }

    function weakKeywordStats(questions) {
      const counts = new Map();
      const examples = new Map();
      wrongQuestions(questions)
        .forEach(q => {
          answerKeywords(`${q.answer || ""}\n${q.question || ""}\n${normalizeTags(q.tags).join(" ")}`)
            .filter(isUsefulInsightKeyword)
            .slice(0, 8)
            .forEach(word => {
              counts.set(word, (counts.get(word) || 0) + 1);
              if (!examples.has(word)) examples.set(word, new Set());
              if (q.category) examples.get(word).add(q.category);
            });
        });
      return [...counts.entries()]
        .map(([word, count]) => ({ word, count, examples: [...(examples.get(word) || [])].slice(0, 2) }))
        .filter(item => item.count >= 2)
        .sort((a, b) => b.count - a.count || a.word.localeCompare(b.word));
    }

    function isUsefulInsightKeyword(word) {
      const compact = compactText(word);
      const stop = new Set([
        "또는", "관한", "대한", "있는", "하는", "한다", "하여", "하고", "에서", "으로", "에게", "위해", "위한",
        "경우", "다음", "보기", "쓰시오", "작성하시오", "알맞은", "내용", "해당", "문제", "정답", "답안",
        "설명", "아래", "위하여", "따라", "따른", "등의", "등", "및", "시", "수", "것", "작업", "안전",
        "설치", "관리", "기준", "방법", "결과", "이상", "이하"
      ]);
      if (compact.length < 2 || compact.length > 12 || stop.has(compact)) return false;
      if (/^\d+$/.test(compact) || /^[가-힣]$/.test(compact)) return false;
      if (/[은는이가을를의로과와]$/.test(compact) && compact.length <= 3) return false;
      return true;
    }

    function roundProgressStats(questions) {
      const groups = new Map();
      questions.forEach(q => {
        const category = q.category || "미분류";
        if (!groups.has(category)) groups.set(category, { category, total: 0, mastered: 0, wrong: 0 });
        const item = groups.get(category);
        item.total += 1;
        if (q.status === "mastered") item.mastered += 1;
        if (q.status === "wrong") item.wrong += 1;
      });
      return [...groups.values()]
        .map(item => ({
          ...item,
          progress: item.total ? Math.round((item.mastered / item.total) * 100) : 0
        }))
        .sort((a, b) => b.total - a.total || a.category.localeCompare(b.category));
    }

    function formatQuestionCardHtml(question) {
      const textHtml = formatQuestionHtml(question.question || "사진 문제");
      const metaHtml = `${question.favorite ? `<p class="favorite-mark">★ 중요</p>` : ""}${renderTypeChips(question)}${renderTags(question.tags)}`;
      if (!question.questionImage) return `${textHtml}${metaHtml}`;
      return `${textHtml}<img class="question-photo" src="${escapeHtml(question.questionImage)}" alt="${escapeHtml(question.imageName || "사진 문제")}">${metaHtml}`;
    }

    function formatAnswerCardHtml(question) {
      const textHtml = formatStructuredAnswerHtml(question);
      const imageHtml = question.answerImage
        ? `<img class="answer-photo" src="${escapeHtml(question.answerImage)}" alt="${escapeHtml(question.answerImageName || "정답 사진")}">`
        : "";
      return textHtml || imageHtml ? `${textHtml}${imageHtml}` : "저장된 정답이 없습니다.";
    }

    function formatStructuredAnswerHtml(question) {
      const answer = String(question.answer || "").trim();
      const memo = String(question.memo || "").trim();
      if (!answer && !memo) return "";
      const calculation = parseCalculationAnswer(answer);
      if (calculation) return renderCalculationAnswerHtml(calculation, memo);
      const numberedItems = parseNumberedAnswerItems(answer);
      if (numberedItems.length >= 2) return renderNumberedAnswerHtml(numberedItems, memo);
      const parsed = parseAnswerSections(answer);
      const coreHtml = parsed.core
        ? `<section class="answer-section">
            <h4 class="answer-section-title">정답</h4>
            <p class="answer-core">${escapeHtml(parsed.core)}</p>
          </section>`
        : "";
      const pointsHtml = parsed.points.length
        ? `<section class="answer-section">
            <h4 class="answer-section-title">의미 · 해설</h4>
            <div class="answer-points">${parsed.points.map(point => {
              return `<div class="answer-point"><b>${escapeHtml(point.label)}</b><span>${escapeHtml(point.text)}</span></div>`;
            }).join("")}</div>
          </section>`
        : "";
      const extraHtml = parsed.extra
        ? `<section class="answer-section">
            <h4 class="answer-section-title">추가 답안</h4>
            ${formatRichTextHtml(parsed.extra)}
          </section>`
        : "";
      const memoHtml = memo
        ? `<section class="answer-section">
            <h4 class="answer-section-title">메모</h4>
            <p class="answer-note">${escapeHtml(memo.replace(/^메모:\s*/i, ""))}</p>
          </section>`
        : "";
      return `<div class="answer-card">${coreHtml}${pointsHtml}${extraHtml}${memoHtml}</div>`;
    }

    function parseNumberedAnswerItems(answer) {
      const lines = String(answer || "")
        .split("\n")
        .map(line => line.trim())
        .filter(Boolean);
      const items = lines.map(parseAnswerPoint).filter(Boolean);
      if (items.length < 2 || items.length !== lines.length) return [];
      return items;
    }

    function renderNumberedAnswerHtml(items, memo) {
      const itemsHtml = `<section class="answer-section">
        <h4 class="answer-section-title">정답 항목</h4>
        <div class="answer-points">${items.map(point => {
          return `<div class="answer-point"><b>${escapeHtml(point.label)}</b><span>${escapeHtml(point.text)}</span></div>`;
        }).join("")}</div>
      </section>`;
      const memoHtml = memo
        ? `<section class="answer-section">
            <h4 class="answer-section-title">메모</h4>
            <p class="answer-note">${escapeHtml(memo.replace(/^메모:\s*/i, ""))}</p>
          </section>`
        : "";
      return `<div class="answer-card">${itemsHtml}${memoHtml}</div>`;
    }

    function parseCalculationAnswer(answer) {
      const lines = String(answer || "")
        .split("\n")
        .map(line => line.trim())
        .filter(Boolean);
      if (!lines.length) return null;

      const sections = [];
      let current = null;
      const labels = new Map([
        ["공식", "공식"],
        ["대입", "대입"],
        ["계산", "계산"],
        ["풀이", "계산"],
        ["답", "답"],
        ["정답", "답"],
        ["결과", "답"]
      ]);

      lines.forEach(line => {
        const match = line.match(/^(공식|대입|계산|풀이|답|정답|결과)\s*[:：]\s*(.*)$/);
        if (match) {
          current = { label: labels.get(match[1]) || match[1], lines: [] };
          if (match[2]) current.lines.push(match[2]);
          sections.push(current);
          return;
        }
        if (current) current.lines.push(line);
      });

      if (!sections.length) return null;
      const hasCalculationLabel = sections.some(section => {
        return ["공식", "대입", "계산", "답"].includes(section.label);
      });
      if (!hasCalculationLabel) return null;

      const cleaned = sections
        .map(section => ({ ...section, text: section.lines.join("\n").trim() }))
        .filter(section => section.text);
      return cleaned.length ? cleaned : null;
    }

    function renderCalculationAnswerHtml(sections, memo) {
      const stepsHtml = sections.map(section => {
        const isFinal = section.label === "답";
        return `<section class="calc-step${isFinal ? " final" : ""}">
          <h4 class="calc-label">${escapeHtml(isFinal ? "최종 답" : section.label)}</h4>
          <p class="calc-equation">${escapeHtml(section.text)}</p>
        </section>`;
      }).join("");
      const memoHtml = memo
        ? `<section class="answer-section">
            <h4 class="answer-section-title">메모</h4>
            <p class="answer-note">${escapeHtml(memo.replace(/^메모:\s*/i, ""))}</p>
          </section>`
        : "";
      return `<div class="answer-card calc-answer">${stepsHtml}${memoHtml}</div>`;
    }

    function parseAnswerSections(answer) {
      const lines = String(answer || "")
        .split("\n")
        .map(line => line.trim())
        .filter(Boolean);
      const points = [];
      const core = [];
      const extra = [];
      let mode = "core";

      lines.forEach(line => {
        const heading = line.replace(/^#+\s*/, "").trim();
        if (/^(의미|해설|풀이|설명)$/i.test(heading)) {
          mode = "points";
          return;
        }
        const point = parseAnswerPoint(line);
        if (point) {
          const corePoint = point.text.match(/^(정답|비율)\s*[:：]\s*(.+)$/i);
          if (!core.length && corePoint) {
            core.push(corePoint[2].trim());
          } else if (/^(의미|해설|풀이|설명)\s*[:：]?$/i.test(point.text)) {
            mode = "points";
          } else if (mode === "points") {
            points.push(point);
          } else {
            core.push(line);
          }
          return;
        }
        if (mode === "core") {
          const cleanLine = core.length ? line : line.replace(/^(정답|비율)\s*[:：]\s*/i, "");
          core.push(cleanLine);
        } else {
          extra.push(line);
        }
      });

      return {
        core: core.join("\n").trim(),
        points,
        extra: extra.join("\n").trim()
      };
    }

    function parseAnswerPoint(line) {
      const source = String(line || "").trim();
      const circled = source.match(/^([①-⑳])\s*(.+)$/);
      if (circled) return { label: circled[1], text: circled[2].trim() };
      const numbered = source.match(/^(\d+)\s*[:：]\s*(.+)$/);
      if (numbered) return { label: numbered[1], text: numbered[2].trim() };
      const bullet = source.match(/^[-•]\s*(.+)$/);
      if (bullet) return { label: "•", text: bullet[1].trim() };
      return null;
    }

    function formatQuestionHtml(text) {
      const source = String(text || "").trim();
      if (!source) return "";

      const choiceBank = extractChoiceBank(source);
      const boxed = extractQuestionBoxes(choiceBank.body || source);
      const questionSource = boxed.body;
      const choiceHtml = choiceBank.items.length ? renderChoiceBank(choiceBank.items) : "";
      const boxHtml = renderQuestionBoxes(boxed.boxes);
      const parts = splitQuestionOptions(questionSource);
      if (parts.options.length >= 2) {
        const main = parts.body || "다음 조건을 보고 답하세요.";
        return [
          `<p class="question-main">${formatInlineHtml(main)}</p>`,
          choiceHtml,
          `<div class="question-list">`,
          ...parts.options.map(option => {
            return `<div class="question-option"><b>${escapeHtml(option.number)}</b><span>${formatInlineHtml(option.text)}</span></div>`;
          }),
          `</div>`,
          boxHtml
        ].join("");
      }

      return `${formatRichTextHtml(questionSource)}${choiceHtml}${boxHtml}`;
    }

    function extractQuestionBoxes(text) {
      const boxes = [];
      const body = String(text || "").replace(/\[(?:박스|보기박스|box)\]([\s\S]*?)\[\/(?:박스|보기박스|box)\]/gi, (match, content) => {
        const trimmed = content.trim();
        if (trimmed) boxes.push(trimmed);
        return "";
      }).trim();
      return { body, boxes };
    }

    function renderQuestionBoxes(boxes) {
      return boxes.map(box => {
        const lines = String(box || "").split("\n").map(line => line.trim()).filter(Boolean);
        const content = lines.length
          ? lines.map(line => `<p class="question-paper-line">${formatInlineHtml(line)}</p>`).join("")
          : formatRichTextHtml(box);
        return `<div class="question-paper-box">${content}</div>`;
      }).join("");
    }

    function extractChoiceBank(text) {
      const lines = String(text || "").split("\n");
      const markerIndex = lines.findIndex(line => /^\s*(?:\[보기\]|보기)\s*[:：]?\s*$/i.test(line.trim()));
      if (markerIndex < 0) {
        const inline = String(text || "").match(/(?:\[보기\]|보기)\s*[:：]\s*(.+?)(?=\n\s*(?:\d+[.)]|[①-⑳])\s+|$)/s);
        if (!inline) return { body: text, items: [] };
        const items = splitChoiceItems(inline[1]);
        const body = `${text.slice(0, inline.index)}${text.slice(inline.index + inline[0].length)}`.trim();
        return { body, items };
      }

      const bodyLines = lines.slice(0, markerIndex);
      const choiceLines = [];
      let index = markerIndex + 1;
      for (; index < lines.length; index += 1) {
        const line = lines[index];
        if (/^\s*(?:\d+[.)]|[①-⑳])\s+/.test(line) || /^\s*#{1,3}\s+/.test(line)) break;
        if (/^\s*\[\/보기\]\s*$/i.test(line.trim())) {
          index += 1;
          break;
        }
        choiceLines.push(line);
      }
      const tailLines = lines.slice(index);
      return {
        body: [...bodyLines, ...tailLines].join("\n").trim(),
        items: splitChoiceItems(choiceLines.join("\n"))
      };
    }

    function splitChoiceItems(text) {
      return String(text || "")
        .split(/[,，;；\n]+/)
        .map(item => item.replace(/^[\s\-•*]+/, "").trim())
        .filter(Boolean);
    }

    function renderChoiceBank(items) {
      if (!items.length) return "";
      return `<div class="question-choice-bank">
        <p class="choice-bank-title">보기</p>
        <div class="choice-bank-items">${items.map(item => `<span class="choice-bank-chip">${formatInlineHtml(item)}</span>`).join("")}</div>
      </div>`;
    }

    function formatRichTextHtml(text) {
      const blocks = String(text || "")
        .split(/\n{2,}/)
        .map(block => block.trim())
        .filter(Boolean);
      if (!blocks.length) return "";
      return blocks.map(block => {
        if (isMarkdownTable(block)) return renderMarkdownTable(block);
        return renderRichTextBlock(block);
      }).join("");
    }

    function formatInlineHtml(text) {
      const source = String(text || "");
      const parts = [];
      let cursor = 0;
      source.replace(/\{\{([^{}]+)\}\}/g, (match, answer, index) => {
        parts.push(escapeHtml(source.slice(cursor, index)));
        parts.push(`<button class="cloze" type="button" data-answer="${escapeHtml(answer.trim())}">빈칸</button>`);
        cursor = index + match.length;
        return match;
      });
      parts.push(escapeHtml(source.slice(cursor)));
      return parts.join("");
    }

    function renderRichTextBlock(block) {
      const source = String(block || "").trim();
      if (!source) return "";
      if (/^---+$/.test(source)) return `<hr class="rich-divider">`;
      if (source.startsWith("## ")) return `<h4 class="rich-subheading">${formatInlineHtml(source.slice(3).trim())}</h4>`;
      if (source.startsWith("# ")) return `<h3 class="rich-heading">${formatInlineHtml(source.slice(2).trim())}</h3>`;
      if (source.startsWith(">")) {
        return `<div class="rich-callout">${formatInlineHtml(source.replace(/^>\s?/gm, "").trim())}</div>`;
      }
      if (/^-\s+\[[ xX]\]\s+/m.test(source)) {
        const items = source.split("\n").map(line => line.trim()).filter(Boolean);
        return `<ul class="rich-checklist">${items.map(line => {
          const done = /^-\s+\[[xX]\]\s+/.test(line);
          const text = line.replace(/^-\s+\[[ xX]\]\s+/, "");
          return `<li><span class="box${done ? " done" : ""}"></span><span>${formatInlineHtml(text)}</span></li>`;
        }).join("")}</ul>`;
      }
      if (/^-\s+/m.test(source)) {
        const items = source.split("\n").map(line => line.replace(/^-\s+/, "").trim()).filter(Boolean);
        return `<ul class="rich-list">${items.map(item => `<li><span>•</span><span>${formatInlineHtml(item)}</span></li>`).join("")}</ul>`;
      }
      return `<p class="rich-paragraph question-paragraph">${formatInlineHtml(source)}</p>`;
    }

    function isMarkdownTable(block) {
      const lines = String(block || "").split("\n").map(line => line.trim()).filter(Boolean);
      if (lines.length < 2 || !lines.every(line => line.includes("|"))) return false;
      return /^:?-{3,}:?$/.test(splitTableRow(lines[1])[0] || "") || splitTableRow(lines[1]).every(cell => /^:?-{3,}:?$/.test(cell));
    }

    function renderMarkdownTable(block) {
      const lines = String(block || "").split("\n").map(line => line.trim()).filter(Boolean);
      const alignments = splitTableRow(lines[1] || "").map(tableAlignment);
      const rows = lines
        .filter((line, index) => index !== 1)
        .map(splitTableRow)
      .filter(row => row.length);
      if (!rows.length) return "";
      const header = rows[0];
      const bodyRows = rows.slice(1);
      return `<div class="content-table-wrap"><table class="content-table">
        <thead><tr>${header.map((cell, index) => `<th${tableAlignAttr(alignments[index])}>${escapeHtml(cell)}</th>`).join("")}</tr></thead>
        <tbody>${bodyRows.map(row => `<tr>${header.map((_, index) => `<td${tableAlignAttr(alignments[index])}>${escapeHtml(row[index] || "")}</td>`).join("")}</tr>`).join("")}</tbody>
      </table></div>`;
    }

    function tableAlignment(cell) {
      const value = String(cell || "").trim();
      const left = value.startsWith(":");
      const right = value.endsWith(":");
      if (left && right) return "center";
      if (right) return "right";
      if (left) return "left";
      return "";
    }

    function tableAlignAttr(align) {
      return align ? ` style="text-align:${align}"` : "";
    }

    function renderTheoryContentBlock(block, isKey = false) {
      if (isMarkdownTable(block)) {
        return `<div class="theory-study-block${isKey ? " key" : ""}">${renderMarkdownTable(block)}</div>`;
      }
      return `<div class="theory-study-block${isKey ? " key" : ""}">${renderRichTextBlock(block)}</div>`;
    }

    function splitTableRow(line) {
      return String(line || "")
        .replace(/^\|/, "")
        .replace(/\|$/, "")
        .split("|")
        .map(cell => cell.trim());
    }

    function splitQuestionOptions(text) {
      const circleMap = new Map([["①", "1"], ["②", "2"], ["③", "3"], ["④", "4"], ["⑤", "5"]]);
      const optionPattern = /(^|[\s/])(?:(\d{1,2})[).]|([①②③④⑤]))\s*/g;
      const matches = [...text.replace(/\n/g, " ").matchAll(optionPattern)];
      if (matches.length < 2) return { body: text, options: [] };

      const body = cleanupOptionText(text.slice(0, matches[0].index));
      const options = matches.map((match, index) => {
        const start = match.index + match[0].length;
        const end = matches[index + 1]?.index ?? text.length;
        return {
          number: match[2] || circleMap.get(match[3]) || "",
          text: cleanupOptionText(text.slice(start, end))
        };
      }).filter(option => option.text);

      if (!hasSequentialOptions(options)) return { body: text, options: [] };

      return { body, options };
    }

    function hasSequentialOptions(options) {
      const numbers = options.map(option => Number(option.number));
      if (numbers[0] !== 1) return false;
      return numbers.every((number, index) => number === index + 1);
    }

    function cleanupOptionText(text) {
      return String(text || "")
        .replace(/\s*\/\s*$/g, "")
        .replace(/^[\s/]+|[\s/]+$/g, "")
        .replace(/\s+/g, " ")
        .trim();
    }

    function renderStudy() {
      renderStudyModeButtons();
      if (studyMode === "theory") {
        renderTheoryStudy();
        return;
      }

      renderStudyDisplayOptions();
      const questions = filteredStudyQuestions();
      if (currentIndex >= questions.length) currentIndex = Math.max(0, questions.length - 1);
      const current = questions[currentIndex];

      els.cardIndex.textContent = `${questions.length ? currentIndex + 1 : 0} / ${questions.length}`;

      if (!current) {
        els.cardType.textContent = "분야";
        els.cardLevel.textContent = "중요도";
        setStudyStatusBadge(null);
        els.questionText.innerHTML = formatQuestionHtml("문제를 추가하거나 CSV를 가져오면 학습을 시작할 수 있습니다.");
        els.answerText.innerHTML = "";
        els.answerText.classList.remove("visible");
        els.myAnswer.value = "";
        renderChoiceAnswerPanel(null);
        hideAnswerAssist();
        els.myAnswer.classList.remove("hidden");
        els.showAnswerBtn.textContent = answerActionLabel();
        updateStudyFavoriteButton(null);
        els.prevBtn.textContent = "← 이전 문제";
        els.nextBtn.textContent = "다음 문제 →";
        els.wrongBtn.classList.remove("hidden");
        els.masterBtn.classList.remove("hidden");
        els.memoryCardBtn.classList.add("hidden");
        els.studyEditBtn.classList.add("hidden");
        renderMemoryCardPanel(null);
        return;
      }

      els.cardType.textContent = current.category || "미분류";
      els.cardLevel.textContent = `${examTypeLabel(current.examType)} · 중요도 ${current.level || "중"}`;
      setStudyStatusBadge(current);
      els.questionText.innerHTML = formatQuestionCardHtml(current);
      els.answerText.innerHTML = formatStagedAnswerHtml(current);
      els.answerText.classList.remove("visible");
      els.myAnswer.value = "";
      renderChoiceAnswerPanel(current);
      hideAnswerAssist();
      els.myAnswer.classList.remove("hidden");
      els.showAnswerBtn.textContent = answerActionLabel();
      updateStudyFavoriteButton(current);
      els.prevBtn.textContent = "← 이전 문제";
      els.nextBtn.textContent = "다음 문제 →";
      els.wrongBtn.classList.remove("hidden");
      els.masterBtn.classList.remove("hidden");
      els.memoryCardBtn.classList.remove("hidden");
      els.memoryCardBtn.textContent = current.studyNote ? "요약 메모 보기" : "요약 메모";
      els.studyEditBtn.classList.remove("hidden");
      renderMemoryCardPanel(activeMemoryCardQuestionId === current.id ? current : null);
    }

    function renderTheoryStudy() {
      renderStudyDisplayOptions();
      const theories = filteredTheories();
      if (currentTheoryIndex >= theories.length) currentTheoryIndex = Math.max(0, theories.length - 1);
      const current = theories[currentTheoryIndex];

      els.cardIndex.textContent = `${theories.length ? currentTheoryIndex + 1 : 0} / ${theories.length}`;

      els.cardType.textContent = current?.category || "분야";
      els.cardLevel.textContent = "이론";
      setStudyStatusBadge(null);
      els.myAnswer.value = "";
      renderChoiceAnswerPanel(null);
      hideAnswerAssist();
      els.myAnswer.classList.add("hidden");
      els.wrongBtn.classList.add("hidden");
      els.masterBtn.classList.add("hidden");
      els.memoryCardBtn.classList.add("hidden");
      els.studyEditBtn.classList.add("hidden");
      renderMemoryCardPanel(null);
      els.showAnswerBtn.textContent = "문제로 만들기";
      updateStudyFavoriteButton(current || null);
      els.prevBtn.textContent = "← 이전";
      els.nextBtn.textContent = "다음 →";

      if (!current) {
        els.questionText.innerHTML = formatQuestionHtml("작성에서 이론을 정리하면 여기서 학습할 수 있습니다.");
        els.answerText.innerHTML = "";
        els.answerText.classList.remove("visible");
        return;
      }

      els.questionText.innerHTML = formatTheoryStudyHtml(current);
      els.answerText.innerHTML = current.prompt
        ? `<p class="theory-study-hint">문제화 힌트: ${escapeHtml(current.prompt)}</p>`
        : `<p class="theory-study-hint">이 이론을 문제로 만들면 제목을 기준으로 자동 질문을 생성합니다.</p>`;
      els.answerText.classList.add("visible");
    }

    function setStudyStatusBadge(question) {
      els.cardStatus.classList.remove("status-new", "status-wrong", "status-mastered");
      if (!question) {
        els.cardStatus.textContent = "미학습";
        els.cardStatus.classList.add("status-new");
        return;
      }
      if (question.status === "wrong") {
        const count = question.wrongCount || 1;
        els.cardStatus.textContent = `오답 ${count}회`;
        els.cardStatus.classList.add("status-wrong");
        return;
      }
      if (question.status === "mastered") {
        els.cardStatus.textContent = "암기 완료";
        els.cardStatus.classList.add("status-mastered");
        return;
      }
      els.cardStatus.textContent = "미학습";
      els.cardStatus.classList.add("status-new");
    }

    function renderStudyDisplayOptions() {
      [els.answerHintBtn, els.answerKeywordBtn, els.answerFullBtn].forEach(button => {
        button.classList.toggle("active", button.dataset.answerStage === answerStage);
        button.disabled = studyMode !== "question";
      });
      els.memoryModeBtn.classList.toggle("active", memoryMode);
      document.body.classList.toggle("memory-mode", memoryMode && studyMode === "question" && activeView === "study");
    }

    function setAnswerStage(stage) {
      answerStage = ["hint", "keywords", "full"].includes(stage) ? stage : "full";
      const current = getCurrentQuestion();
      if (current) els.answerText.innerHTML = formatStagedAnswerHtml(current);
      els.showAnswerBtn.textContent = answerActionLabel();
      if (els.answerText.classList.contains("visible")) updateAnswerAssist();
      renderStudyDisplayOptions();
    }

    function toggleMemoryMode() {
      memoryMode = !memoryMode;
      renderStudyDisplayOptions();
    }

    function openCurrentMemoryCard() {
      const q = getCurrentQuestion();
      if (!q) return;
      activeMemoryCardQuestionId = q.id;
      q.updatedAt = new Date().toISOString();
      hideStudyAnswer();
      persist();
      renderMemoryCardPanel(q);
      renderBank();
      requestAnimationFrame(() => els.memoryCardPanel.scrollIntoView({ behavior: "smooth", block: "nearest" }));
    }

    function openMemoryCardById(id) {
      const q = state.questions.find(item => item.id === id);
      if (!q) return;
      q.updatedAt = new Date().toISOString();
      state.activeExamId = q.examId || DEFAULT_EXAM_ID;
      els.searchInput.value = "";
      els.examTypeFilter.value = "all";
      els.categoryFilter.value = "all";
      els.tagFilter.value = "all";
      els.statusFilter.value = q.status === "mastered" ? "mastered" : "all";
      els.favoriteFilter.checked = false;
      reviewQueueIds = [];
      studyMode = "question";
      activeMemoryCardQuestionId = q.id;
      persist();
      setView("study");
      render();
      const questions = filteredStudyQuestions();
      const index = questions.findIndex(item => item.id === q.id);
      currentIndex = index >= 0 ? index : 0;
      renderStudy();
      requestAnimationFrame(() => els.memoryCardPanel.scrollIntoView({ behavior: "smooth", block: "nearest" }));
    }

    function ensureMemoryCard(question) {
      const existing = normalizeMemoryCard(question.memoryCard);
      const built = buildMemoryCard(question);
      question.memoryCard = enrichMemoryCard(existing, built);
      return question.memoryCard;
    }

    function enrichMemoryCard(card, built) {
      if (!card) return built;
      const refreshGeneratedParts = shouldRefreshMemoryCard(card, built);
      const keywords = refreshGeneratedParts ? built.keywords : card.keywords || [];
      const mnemonicData = buildMnemonic(keywords);
      return {
        ...card,
        keywords,
        mnemonicType: refreshGeneratedParts ? mnemonicData.mnemonicType : (card.mnemonicType || mnemonicData.mnemonicType),
        mnemonic: refreshGeneratedParts ? mnemonicData.mnemonic : (card.mnemonic || mnemonicData.mnemonic),
        mnemonicItems: refreshGeneratedParts || !card.mnemonicItems?.length ? mnemonicData.mnemonicItems : card.mnemonicItems,
        mnemonicSentence: refreshGeneratedParts ? mnemonicData.mnemonicSentence : (card.mnemonicSentence || mnemonicData.mnemonicSentence),
        easyExplanation: card.easyExplanation || built.easyExplanation,
        blankQuiz: card.blankQuiz || built.blankQuiz
      };
    }

    function shouldRefreshMemoryCard(card, built) {
      const keywords = card.keywords || [];
      const builtKeywords = built.keywords || [];
      const mnemonic = String(card.mnemonic || "").trim();
      const items = card.mnemonicItems || [];
      if (!keywords.length) return true;
      if (builtKeywords.length && keywords.length > Math.max(5, builtKeywords.length + 1)) return true;
      if (built.mnemonicType === "number" && (card.mnemonicType !== "number" || /^\d+$/.test(mnemonic))) return true;
      if (items.length > 5 && built.mnemonicItems.length <= 5) return true;
      if (mnemonic.length > 6 && built.mnemonic.length <= 6) return true;
      if (keywords.some(keyword => /^\d{1,3}$/.test(keyword)) && builtKeywords.some(keyword => /,/.test(keyword))) return true;
      return false;
    }

    function normalizeMemoryCard(card) {
      if (!card || typeof card !== "object") return null;
      const keywords = Array.isArray(card.keywords) ? card.keywords.map(item => String(item || "").trim()).filter(Boolean) : [];
      return {
        keywords,
        mnemonicType: String(card.mnemonicType || "").trim(),
        mnemonic: String(card.mnemonic || "").trim(),
        mnemonicItems: normalizeMnemonicItems(card.mnemonicItems, keywords, card.mnemonic),
        mnemonicSentence: String(card.mnemonicSentence || "").trim(),
        easyExplanation: String(card.easyExplanation || "").trim(),
        blankQuiz: String(card.blankQuiz || "").trim()
      };
    }

    function buildMemoryCard(question) {
      const answer = String(question.answer || "").trim();
      const keywords = memoryKeywords(answer);
      return {
        keywords,
        ...buildMnemonic(keywords),
        easyExplanation: buildEasyExplanation(question, keywords),
        blankQuiz: buildBlankQuiz(answer, keywords)
      };
    }

    function memoryKeywords(answer) {
      const phrases = answerPhrases(answer).filter(item => item.length >= 2);
      if (phrases.length && phrases.every(isNumericKeyword)) {
        return phrases.slice(0, 6);
      }
      if (phrases.length >= 2 && phrases.length <= 6) {
        return phrases.slice(0, 6);
      }
      const splitPhrases = phrases
        .flatMap(phrase => phrase.split(/\s*(?:및|또는|하고|하며|，|·|\/)\s*/))
        .map(normalizeAnswerPhrase)
        .filter(item => item.length >= 2);
      const primary = uniqueMeaningfulPhrases(splitPhrases).slice(0, 6);
      if (primary.length) return primary;
      return answerKeywords(answer).slice(0, 6);
    }

    function buildMnemonic(keywords) {
      const sourceKeywords = keywords.slice(0, 5);
      if (sourceKeywords.length && sourceKeywords.every(isNumericKeyword)) {
        return {
          mnemonicType: "number",
          mnemonic: sourceKeywords.join(" → "),
          mnemonicItems: sourceKeywords.map((keyword, index) => ({
            letter: String(index + 1),
            keyword
          })),
          mnemonicSentence: `숫자는 ${sourceKeywords.join(" → ")} 순서와 단위를 함께 외우세요.`
        };
      }
      const items = sourceKeywords
        .map(keyword => ({
          letter: mnemonicLetter(keyword),
          keyword
        }))
        .filter(item => item.letter && item.keyword);
      const mnemonic = items.map(item => item.letter).join("");
      return {
        mnemonicType: "initial",
        mnemonic: mnemonic || "핵심어 첫 글자",
        mnemonicItems: items,
        mnemonicSentence: mnemonic
          ? `${mnemonic} 순서로 핵심 항목을 떠올리세요: ${items.map(item => item.keyword).join(" → ")}`
          : "키워드 첫 글자를 순서대로 떠올리세요."
      };
    }

    function normalizeMnemonicItems(items, keywords, mnemonic) {
      if (Array.isArray(items) && items.length) {
        return items
          .map(item => ({
            letter: String(item?.letter || "").trim().slice(0, 4),
            keyword: String(item?.keyword || "").trim()
          }))
          .filter(item => item.letter && item.keyword);
      }
      const letters = Array.from(String(mnemonic || ""));
      return keywords.map((keyword, index) => ({
        letter: letters[index] || mnemonicLetter(keyword),
        keyword
      })).filter(item => item.letter && item.keyword);
    }

    function mnemonicLetter(keyword) {
      const cleaned = String(keyword || "")
        .replace(/^[\s"'“”‘’()[\]{}<>]+/, "")
        .replace(/^(및|또는|그리고|하고|하며|를|을|이|가|은|는|의|에|에서)\s+/, "")
        .replace(/^[0-9.,%㎡m²m\s]+/, "")
        .trim();
      const first = Array.from(cleaned).find(char => /[가-힣A-Za-z]/.test(char));
      return first || "";
    }

    function isNumericKeyword(value) {
      return /^[0-9][0-9,.\s]*(?:%|㎡|m²|m|개|명|년|월|일|kg|톤)?$/i.test(String(value || "").trim());
    }

    function buildEasyExplanation(question, keywords) {
      if (keywords.length) {
        return `${keywords.join(", ")} 순서로 떠올리면 됩니다. 문제의 상황에서 무엇을 확인하고, 어떤 조치를 하고, 누가 지켜보며, 어떤 장비를 쓰는지 연결해서 외우세요.`;
      }
      return `문제의 요구사항을 작은 조치 단위로 나누어 순서대로 떠올리면 됩니다. 원문 답안을 그대로 외우기보다 핵심 행동을 먼저 잡고 문장으로 붙여보세요.`;
    }

    function hideStudyAnswer() {
      els.answerText.classList.remove("visible");
      hideAnswerAssist();
    }

    function renderChoiceAnswerPanel(question) {
      if (!els.choiceAnswerPanel) return;
      const wrap = els.choiceAnswerPanel.closest(".my-answer-wrap");
      const isMultiple = normalizeExamType(question?.examType) === "multiple";
      wrap?.classList.toggle("multiple-choice-mode", isMultiple);
      els.choiceAnswerPanel.classList.toggle("hidden", !isMultiple);
      if (!isMultiple) {
        els.choiceAnswerPanel.innerHTML = "";
        return;
      }

      const options = splitQuestionOptions(String(question?.question || "")).options.slice(0, 4);
      const optionButtons = [1, 2, 3, 4].map((number, index) => {
        const option = options[index];
        const label = option ? `${option.number}. ${option.text}` : `${number}번`;
        return `<button type="button" data-choice-answer="${number}">${escapeHtml(label)}</button>`;
      }).join("");
      els.choiceAnswerPanel.innerHTML = `
        <p class="choice-answer-title">필기형 답 선택</p>
        <div class="choice-answer-grid">${optionButtons}</div>
        <p class="choice-answer-result">정답을 보기 전에 하나를 골라보세요.</p>
      `;
      const result = els.choiceAnswerPanel.querySelector(".choice-answer-result");
      const answerText = String(question?.answer || "");
      const answerNumber = answerText.match(/(?:정답|답)?\s*[:：]?\s*([1-4①②③④])/);
      const normalizedAnswer = answerNumber ? "①②③④".indexOf(answerNumber[1]) >= 0
        ? String("①②③④".indexOf(answerNumber[1]) + 1)
        : answerNumber[1]
        : "";
      els.choiceAnswerPanel.querySelectorAll("[data-choice-answer]").forEach(button => {
        button.addEventListener("click", () => {
          els.choiceAnswerPanel.querySelectorAll("[data-choice-answer]").forEach(item => item.classList.remove("selected"));
          button.classList.add("selected");
          if (!normalizedAnswer) {
            result.textContent = `${button.dataset.choiceAnswer}번을 선택했습니다.`;
            return;
          }
          result.textContent = button.dataset.choiceAnswer === normalizedAnswer
            ? "선택한 답이 정답과 같습니다."
            : `선택한 답: ${button.dataset.choiceAnswer}번`;
        });
      });
    }

    function buildBlankQuiz(answer, keywords) {
      let quiz = String(answer || "");
      keywords.slice(0, 6).forEach(keyword => {
        const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        quiz = quiz.replace(new RegExp(escaped, "g"), "____");
      });
      if (quiz === answer && keywords.length) {
        keywords.slice(0, 5).forEach(keyword => {
          const first = keyword.split(/\s+/)[0];
          if (first?.length >= 2) quiz = quiz.replace(first, "____");
        });
      }
      return quiz || "____";
    }

    function renderMemoryCardPanel(question) {
      if (!question) {
        activeMemoryCardQuestionId = "";
        els.memoryCardPanel.classList.add("hidden");
        els.memoryCardPanel.innerHTML = "";
        return;
      }

      els.memoryCardPanel.classList.remove("hidden");
      els.memoryCardPanel.innerHTML = `
        <div class="memory-card-head">
          <div class="memory-card-eyebrow">
            <span class="memory-card-status">요약 메모</span>
          </div>
          <h3>${escapeHtml(question.question || "문제")}</h3>
        </div>
        <div class="study-note-editor">
          <textarea id="studyNoteInput" placeholder="이 문제를 풀 때 기억할 핵심 단어, 공식, 주의점, 요약을 자유롭게 적어두세요.">${escapeHtml(question.studyNote || "")}</textarea>
          <p class="study-note-hint">입력하면 자동 저장됩니다.</p>
        </div>
      `;
      const textarea = els.memoryCardPanel.querySelector("#studyNoteInput");
      textarea?.addEventListener("input", () => {
        question.studyNote = textarea.value;
        question.updatedAt = new Date().toISOString();
        persist();
        els.memoryCardBtn.textContent = textarea.value.trim() ? "요약 메모 보기" : "요약 메모";
        renderBank();
      });
    }
    function memoryCardStatusLabel(status) {
      if (status === "known") return "암기 카드 · 외움";
      if (status === "confused") return "암기 카드 · 헷갈림";
      if (status === "unknown") return "암기 카드 · 모름";
      return "암기 카드 · 미평가";
    }

    function markMemoryCard(id, result) {
      const q = state.questions.find(item => item.id === id);
      if (!q) return;
      ensureMemoryCard(q);
      q.memoryCardStatus = result;
      q.updatedAt = new Date().toISOString();
      if (result === "known") {
        q.status = "mastered";
        q.masteredAt = new Date().toISOString();
      } else {
        q.status = "wrong";
        q.wrongCount = (q.wrongCount || 0) + 1;
        q.masteredAt = "";
      }
      persist();
      render();
      activeMemoryCardQuestionId = q.id;
      renderMemoryCardPanel(q);
    }

    function formatStagedAnswerHtml(question) {
      if (answerStage === "hint") return formatAnswerHintHtml(question);
      if (answerStage === "keywords") return formatAnswerKeywordsHtml(question);
      return formatAnswerCardHtml(question);
    }

    function answerActionLabel() {
      if (answerStage === "hint") return "힌트 보기";
      if (answerStage === "keywords") return "키워드 보기";
      return "정답 보기";
    }

    function formatAnswerHintHtml(question) {
      const phrases = answerPhrases(question.answer).slice(0, 6);
      const formatText = phrases.length > 1
        ? `${phrases.length}개 항목을 쓰는 문제`
        : "핵심 구문을 떠올리는 문제";
      const chips = phrases.length
        ? phrases.map((phrase, index) => `<span class="hint-chip">${index + 1}. ${escapeHtml(maskHintPhrase(phrase))}</span>`).join("")
        : `<span class="hint-chip">정답의 형식과 핵심 흐름을 먼저 떠올려보세요.</span>`;
      return `<div class="answer-hint-card">
        <p class="hint-title">힌트 · ${escapeHtml(formatText)}</p>
        <div class="hint-chips">${chips}</div>
      </div>`;
    }

    function formatAnswerKeywordsHtml(question) {
      const phrases = answerPhrases(question.answer).slice(0, 10);
      const chips = phrases.length
        ? phrases.map(phrase => `<span class="hint-chip">${escapeHtml(phrase)}</span>`).join("")
        : `<span class="hint-chip">핵심어를 만들 정답 내용이 부족합니다.</span>`;
      return `<div class="answer-hint-card">
        <p class="hint-title">핵심 구문</p>
        <div class="hint-chips">${chips}</div>
      </div>`;
    }

    function maskHintPhrase(phrase) {
      const words = String(phrase || "")
        .replace(/[()[\]{}]/g, " ")
        .split(/\s+/)
        .filter(Boolean);
      if (words.length >= 2) {
        return words.map(word => maskHintWord(word)).join(" ");
      }
      return maskHintWord(phrase);
    }

    function maskHintWord(word) {
      const source = String(word || "").trim();
      if (/^[\d.:/%×+\-=]+$/.test(source)) return source;
      const chars = [...source];
      if (chars.length <= 1) return chars.join("");
      if (chars.length === 2) return `${chars[0]}?`;
      return `${chars[0]}${"·".repeat(Math.min(chars.length - 2, 3))}`;
    }

    function formatTheoryStudyHtml(theory) {
      const blocks = String(theory.content || "")
        .split(/\n{2,}/)
        .map(block => block.trim())
        .filter(Boolean);
      const content = blocks.length ? blocks : ["정리된 이론 내용이 없습니다."];
      const body = content.map(block => {
        const isKey = /^(암기|공식|정의|기준|절차|비율|특징|방지대책|영향|위험성|종류|요점|핵심|필답형|시험)/.test(block);
        return renderTheoryContentBlock(block, isKey);
      }).join("");
      return `<div class="theory-study">
        <h3 class="theory-study-title">${escapeHtml(theory.title)}</h3>
        ${theory.favorite ? `<p class="favorite-mark">★ 중요</p>` : ""}
        ${renderTags(theory.tags)}
        <div class="theory-study-body">${body}</div>
      </div>`;
    }

    function renderTheories() {
      const theories = filteredTheories();
      const search = els.searchInput.value.trim();
      setComposeMode(composeMode);
      if (!search) {
        els.theoryList.innerHTML = `<div class="empty">이론 목록은 검색어를 입력하면 표시됩니다. 저장된 이론은 로컬/클라우드 데이터에 그대로 보관됩니다.</div>`;
        return;
      }
      els.theoryList.innerHTML = theories.map(theory => {
        const relatedCount = currentExamQuestions().filter(q => q.category === theory.category).length;
        return `<article class="theory-card">
          <h3>${theory.favorite ? `<span class="favorite-mark">★</span> ` : ""}${escapeHtml(theory.title)}</h3>
          <p>${escapeHtml(theory.category || "미분류")} · 관련 문제 ${relatedCount}개</p>
          ${renderTags(theory.tags)}
          <div class="theory-card-content">${formatRichTextHtml(theory.content)}</div>
          ${theory.prompt ? `<p>문제화 힌트: ${escapeHtml(theory.prompt)}</p>` : ""}
          <footer>
            <button data-theory-study="${theory.id}" class="primary">관련 문제 풀기</button>
            <button data-theory-question="${theory.id}">문제로 만들기</button>
            <button data-theory-edit="${theory.id}">수정</button>
            <button data-theory-delete="${theory.id}" class="danger">삭제</button>
          </footer>
        </article>`;
      }).join("") || `<div class="empty">아직 정리한 이론이 없습니다.</div>`;

      els.theoryList.querySelectorAll("[data-theory-study]").forEach(button => {
        button.addEventListener("click", () => studyTheory(button.dataset.theoryStudy));
      });
      els.theoryList.querySelectorAll("[data-theory-question]").forEach(button => {
        button.addEventListener("click", () => createQuestionFromTheory(button.dataset.theoryQuestion));
      });
      els.theoryList.querySelectorAll("[data-theory-edit]").forEach(button => {
        button.addEventListener("click", () => editTheory(button.dataset.theoryEdit));
      });
      els.theoryList.querySelectorAll("[data-theory-delete]").forEach(button => {
        button.addEventListener("click", () => deleteTheory(button.dataset.theoryDelete));
      });
    }

    function insertTheoryBlock(type) {
      const block = THEORY_BLOCKS.find(item => item.id === type);
      if (block?.id === "table") {
        openTableEditor(els.theoryContentInput);
        return;
      }
      insertAtCursor(els.theoryContentInput, blockTemplate(block));
      updateTheoryPreview();
    }

    function insertClozeTemplate() {
      const textarea = els.questionInput;
      const start = textarea.selectionStart ?? textarea.value.length;
      const end = textarea.selectionEnd ?? textarea.value.length;
      const selected = textarea.value.slice(start, end).trim();
      const text = selected ? `{{${selected}}}` : "{{암기할 내용}}";
      const before = textarea.value.slice(0, start);
      const after = textarea.value.slice(end);
      textarea.value = `${before}${text}${after}`;
      const cursor = before.length + text.length;
      textarea.focus();
      textarea.setSelectionRange(cursor, cursor);
      textarea.dispatchEvent(new Event("input", { bubbles: true }));
    }

    function insertCalculationTemplate() {
      insertAtCursor(els.answerInput, CALCULATION_TEMPLATE);
    }

    function blockTemplate(block) {
      if (!block) return "";
      return typeof block.template === "function" ? block.template() : block.template;
    }

    function setupComposeBlocks() {
      renderComposeBlockButtons(els.questionBlockButtons, [
        ...QUESTION_SLASH_BLOCKS.filter(block => ["choices", "table", "cloze", "photo"].includes(block.id)),
        { id: "hint", label: "힌트", icon: "H", hint: "정답 힌트", template: "\n힌트: \n" }
      ], els.questionInput);
      renderComposeBlockButtons(els.answerBlockButtons, [
        CALC_SLASH_BLOCK,
        TABLE_SLASH_BLOCK,
        { id: "explain", label: "해설", icon: "E", hint: "해설 구역", template: "\n해설:\n- \n" },
        { id: "source", label: "출처", icon: "S", hint: "출처 메모", template: "\n출처: \n" }
      ].filter(Boolean), els.answerInput);
    }

    function renderComposeBlockButtons(container, blocks, textarea) {
      if (!container) return;
      container.innerHTML = blocks.map(block => {
        return `<button type="button" data-compose-block="${escapeHtml(block.id)}" title="${escapeHtml(block.hint || block.label)}">${escapeHtml(block.label)}</button>`;
      }).join("");
      container.querySelectorAll("[data-compose-block]").forEach(button => {
        button.addEventListener("click", () => {
          const block = blocks.find(item => item.id === button.dataset.composeBlock);
          if (!block) return;
          if (block.action) {
            applyDirectBlockAction(block.action);
            return;
          }
          if (block.id === "table") {
            openTableEditor(textarea);
            return;
          }
          insertAtCursor(textarea, blockTemplate(block));
          updateQuestionDiagnostics();
        });
      });
    }

    function applyDirectBlockAction(action) {
      if (action === "photo") {
        els.photoFile.click();
      } else if (action === "memo") {
        openComposeDetails();
        requestAnimationFrame(() => els.memoInput.focus());
      } else if (action === "tag") {
        openComposeDetails();
        requestAnimationFrame(() => els.tagsInput.focus());
      }
    }

    function buildQuestionDraft() {
      const editing = currentEditingQuestion();
      const questionPhoto = pendingPhotoQuestions[0] || null;
      const answerPhoto = els.photoPairMode.checked ? (pendingPhotoQuestions[1] || null) : null;
      return {
        id: els.editId.value || "preview",
        examId: editing?.examId || state.activeExamId,
        examType: normalizeExamType(els.examTypeInput.value),
        category: els.categoryInput.value.trim() || "미분류",
        level: els.levelInput.value || "중",
        question: els.questionInput.value.trim(),
        answer: els.answerInput.value.trim(),
        memo: els.memoInput.value.trim(),
        tags: normalizeTags(els.tagsInput.value),
        favorite: Boolean(editing?.favorite),
        questionImage: questionPhoto?.dataUrl || (removeQuestionImageOnSave ? "" : editing?.questionImage || ""),
        imageName: questionPhoto?.name || (removeQuestionImageOnSave ? "" : editing?.imageName || ""),
        answerImage: answerPhoto?.dataUrl || (removeAnswerImageOnSave ? "" : editing?.answerImage || ""),
        answerImageName: answerPhoto?.name || (removeAnswerImageOnSave ? "" : editing?.answerImageName || ""),
        status: editing?.status || "new",
        wrongCount: editing?.wrongCount || 0,
        masteredAt: editing?.masteredAt || "",
        updatedAt: new Date().toISOString()
      };
    }

    function updateQuestionDiagnostics() {
      if (!els.questionDiagnostics) return;
      const draft = buildQuestionDraft();
      const types = detectQuestionTypes(draft);
      const warnings = composeWarnings(draft, types);
      const lintIssues = lintQuestion(draft).slice(0, 4);
      els.questionDiagnostics.innerHTML = [
        ...types.map(type => `<span class="type-chip">${escapeHtml(type)}</span>`),
        ...warnings.map(text => `<span class="warn">${escapeHtml(text)}</span>`),
        ...lintIssues.map(issue => `<span class="lint-chip">${escapeHtml(issue.field)}: ${escapeHtml(issue.short)}</span>`)
      ].join("");
      renderQuestionPreview(draft);
    }

    function renderQuestionPreview(draft = buildQuestionDraft()) {
      if (!els.questionPreview) return;
      const hasQuestion = Boolean(draft.question || draft.questionImage);
      const hasAnswer = Boolean(draft.answer || draft.memo || draft.answerImage);
      const questionHtml = hasQuestion
        ? formatQuestionCardHtml(draft)
        : `<p class="compose-preview-empty">문제를 입력하면 실제 문제풀이 카드 모양으로 여기에 표시됩니다.</p>`;
      const answerHtml = hasAnswer
        ? formatAnswerCardHtml(draft)
        : `<p class="compose-preview-empty">정답을 입력하면 정답 영역도 함께 미리볼 수 있습니다.</p>`;
      els.questionPreview.innerHTML = `
        <div class="question-box">${questionHtml}</div>
        <div class="answer visible">${answerHtml}</div>
      `;
    }

    function composeWarnings(draft, types) {
      const warnings = [];
      if (!draft.question.trim()) warnings.push("문제 내용 필요");
      if (!draft.answer.trim() && !draft.answerImage) warnings.push("정답 필요");
      if (!draft.category.trim()) warnings.push("분야 미입력");
      if (normalizeExamType(draft.examType) === "multiple") {
        const options = splitQuestionOptions(extractChoiceBank(draft.question).body || draft.question).options;
        if (options.length !== 4) warnings.push("필기형은 보기 4개 권장");
      }
      if (normalizeExamType(draft.examType) === "practical" && !draft.questionImage && !/\[박스\]|\[보기박스\]|\[사진\]|도면|그림|이미지|지문/.test(draft.question)) {
        warnings.push("작업형 지문/이미지 확인");
      }
      if (types.includes("보기형") && splitQuestionOptions(extractChoiceBank(draft.question).body || "").options.length < 2) {
        warnings.push("보기형 번호 항목 확인");
      }
      if (types.includes("사진형") && !draft.questionImage && !/\[사진\]|사진/.test(draft.question)) {
        warnings.push("사진 첨부 확인");
      }
      return warnings;
    }

    function lintQuestion(question) {
      return [
        ...lintText("문제", question.question),
        ...lintText("정답", question.answer),
        ...lintText("메모", question.memo),
        ...lintStructure(question)
      ].slice(0, 12);
    }

    function lintText(field, text) {
      const source = String(text || "");
      if (!source.trim()) return [];
      const issues = [];
      if (/[^\S\r\n]{2,}/.test(source)) {
        issues.push({ field, short: "중복 공백", detail: "띄어쓰기가 두 칸 이상 이어진 곳이 있습니다." });
      }
      if (hasUnbalancedPairs(source, "(", ")")) {
        issues.push({ field, short: "괄호 짝 확인", detail: "소괄호의 여는/닫는 개수가 맞지 않습니다." });
      }
      if (hasUnbalancedPairs(source, "[", "]")) {
        issues.push({ field, short: "대괄호 짝 확인", detail: "대괄호의 여는/닫는 개수가 맞지 않습니다." });
      }
      if (hasUnbalancedPairs(source, "{", "}")) {
        issues.push({ field, short: "중괄호 짝 확인", detail: "{{빈칸}} 또는 중괄호 개수를 확인하세요." });
      }
      if (/[,，;；]\s*$/.test(source.trim())) {
        issues.push({ field, short: "끝 문장부호 확인", detail: "쉼표나 세미콜론으로 문장이 끝났습니다." });
      }
      issues.push(...lintOddTokens(field, source));
      return issues;
    }

    function lintOddTokens(field, text) {
      const source = String(text || "");
      const issues = [];
      const allowedUpper = new Set(["FTA", "HAZOP", "AND", "OR", "LEL", "UEL", "FSI", "TF", "SIGN", "PDF", "CSV", "OCR", "API", "URL", "HTML", "K", "A", "B", "C", "D"]);
      const compactSource = source.replace(/[A-Z]{2,}/g, token => allowedUpper.has(token) ? "" : token);

      const loneLetters = [...compactSource.matchAll(/(?:^|[^\w가-힣])([A-Za-z])(?:[^\w가-힣]|$)/g)]
        .map(match => match[1])
        .filter(letter => !["A", "B", "C", "D", "K"].includes(letter));
      uniqueSmall(loneLetters).forEach(token => {
        issues.push({
          field,
          short: `이상 문자 '${token}'`,
          detail: "한글 문제 안에 영문자 한 글자가 섞여 있습니다. OCR 인식 오류인지 확인하세요."
        });
      });

      const parenthesized = [...source.matchAll(/\(\s*([A-Za-z0-9가-힣ㄱ-ㅎㅏ-ㅣ]{1,2})\s*\)/g)].map(match => match[1]);
      uniqueSmall(parenthesized.filter(token => /^[A-Za-z0-9]$/.test(token))).forEach(token => {
        issues.push({
          field,
          short: `괄호 안 '${token}'`,
          detail: "괄호 안에 숫자나 영문자만 있습니다. 빈칸 기호인지 OCR 오류인지 확인하세요."
        });
      });

      const suspiciousLabels = [...source.matchAll(/(?:^|\n)\s*([기니디己])\s*[.)]\s*([^\n]{1,12})/g)];
      suspiciousLabels.slice(0, 3).forEach(match => {
        issues.push({
          field,
          short: `보기 기호 '${match[1]}.'`,
          detail: `'${match[1]}. ${match[2].trim()}' 부분이 보기 번호 OCR 오류처럼 보입니다. 가/나/다 또는 ㄱ/ㄴ/ㄷ인지 확인하세요.`
        });
      });

      const leadingSymbols = [...source.matchAll(/(?:^|\n)\s*([^\s\w가-힣ㄱ-ㅎㅏ-ㅣ#\-*•·※①-⑳])\s+(?=[가-힣A-Za-z])/g)]
        .map(match => match[1])
        .filter(symbol => !["|", ">", "(", "[", "{", "\"", "'", "“", "‘"].includes(symbol));
      uniqueSmall(leadingSymbols).forEach(token => {
        issues.push({
          field,
          short: `줄 앞 기호 '${token}'`,
          detail: "문장 맨 앞에 특수기호가 붙어 있습니다. OCR이 글머리표를 잘못 읽었거나 불필요한 기호인지 확인하세요."
        });
      });

      const latinFragments = [...source.matchAll(/(?:^|[\s()[\]{}.,:;!?])([A-Za-zÀ-ÿ]{1,3})(?=\s*(?:및|와|과|은|는|을|를|이|가|에|의|$))/g)]
        .map(match => match[1])
        .filter(token => !allowedUpper.has(token.toUpperCase()))
        .filter(token => !/^[UHICT]$/i.test(token));
      uniqueSmall(latinFragments).forEach(token => {
        issues.push({
          field,
          short: `낯선 영문 조각 '${token}'`,
          detail: "한글 문장 안에 짧은 영문 조각이 있습니다. D링, 각행 같은 단어가 OCR로 깨진 것인지 확인하세요."
        });
      });

      const oddShortWords = [...source.matchAll(/(?:^|[\s()[\]{}.,:;!?])([가-힣ㄱ-ㅎㅏ-ㅣ]{1,2})(?=[\s()[\]{}.,:;!?]|$)/g)]
        .map(match => match[1])
        .filter(token => ["취관", "기"].includes(token));
      uniqueSmall(oddShortWords).forEach(token => {
        issues.push({
          field,
          short: `낯선 짧은 단어 '${token}'`,
          detail: "짧거나 자모가 섞인 단어입니다. OCR이 잘못 읽은 표현인지 확인하세요."
        });
      });

      return issues.slice(0, 5);
    }

    function uniqueSmall(items) {
      return [...new Set(items)].slice(0, 4);
    }

    function lintStructure(question) {
      const issues = [];
      const q = String(question.question || "");
      const a = String(question.answer || "");
      const choiceBank = extractChoiceBank(q);
      if ((/\[보기\]|보기\s*[:：]/.test(q) || choiceBank.items.length) && !choiceBank.items.length) {
        issues.push({ field: "문제", short: "보기 항목 없음", detail: "[보기] 아래에 실제 보기 항목을 입력했는지 확인하세요." });
      }
      if (choiceBank.items.length && splitQuestionOptions(choiceBank.body || "").options.length < 2) {
        issues.push({ field: "문제", short: "보기형 번호 부족", detail: "보기형 문제라면 1., 2.처럼 답할 항목을 함께 적어두면 좋습니다." });
      }
      if (q.includes("|") && !findMarkdownTables(q).every(isMarkdownTable)) {
        issues.push({ field: "문제", short: "표 형식 확인", detail: "표에 구분선 줄(| --- | --- |)이 빠졌거나 열 개수가 맞지 않을 수 있습니다." });
      }
      if (a.includes("|") && !findMarkdownTables(a).every(isMarkdownTable)) {
        issues.push({ field: "정답", short: "표 형식 확인", detail: "정답 표의 구분선 줄이나 열 개수를 확인하세요." });
      }
      if (!a.trim() && !question.answerImage) {
        issues.push({ field: "정답", short: "정답 없음", detail: "채점용은 아니어도 암기 확인을 위해 정답을 넣어두는 편이 좋습니다." });
      }
      return issues;
    }

    function hasUnbalancedPairs(text, open, close) {
      const source = String(text || "");
      return [...source].filter(char => char === open).length !== [...source].filter(char => char === close).length;
    }

    function findMarkdownTables(text) {
      const blocks = String(text || "")
        .split(/\n{2,}/)
        .map(block => block.trim())
        .filter(block => block.includes("|"));
      return blocks.length ? blocks : [String(text || "")].filter(block => block.includes("|"));
    }

    function renderLintPanel(question) {
      const issues = lintQuestion(question);
      if (!issues.length) return "";
      return `<div class="lint-panel">
        <strong>문장 점검 ${issues.length}개</strong>
        <ul class="lint-list">${issues.slice(0, 5).map(issue => {
          return `<li><b>${escapeHtml(issue.field)} · ${escapeHtml(issue.short)}</b><span>${escapeHtml(issue.detail)}</span></li>`;
        }).join("")}</ul>
      </div>`;
    }

    function registerSlashTextarea(textarea, options) {
      if (!textarea || !options?.length || textarea.dataset.slashReady === "true") return;
      DYNAMIC_SLASH_TARGETS.set(textarea, options);
      textarea.dataset.slashReady = "true";
      textarea.addEventListener("input", () => handleSlashInput(textarea));
      textarea.addEventListener("keydown", handleSlashKeydown);
      textarea.addEventListener("blur", () => {
        setTimeout(closeSlashMenu, 120);
      });
    }

    function handleSlashInput(textarea) {
      const trigger = findSlashTrigger(textarea);
      if (!trigger) {
        closeSlashMenu();
        return;
      }
      const options = slashOptions(trigger.query, textarea);
      if (!options.length) {
        closeSlashMenu();
        return;
      }
      slashState = { ...trigger, textarea, selectedIndex: 0, options };
      renderSlashMenu();
    }

    function handleSlashKeydown(event) {
      if (!slashState || els.slashMenu.classList.contains("hidden")) return;
      if (event.key === "ArrowDown") {
        event.preventDefault();
        slashState.selectedIndex = (slashState.selectedIndex + 1) % slashState.options.length;
        renderSlashMenu();
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        slashState.selectedIndex = (slashState.selectedIndex - 1 + slashState.options.length) % slashState.options.length;
        renderSlashMenu();
      } else if (event.key === "Enter" || event.key === "Tab") {
        event.preventDefault();
        applySlashOption(slashState.options[slashState.selectedIndex]);
      } else if (event.key === "Escape") {
        event.preventDefault();
        closeSlashMenu();
      }
    }

    function findSlashTrigger(textarea) {
      if (!textarea) return null;
      const cursor = textarea.selectionStart ?? 0;
      const before = textarea.value.slice(0, cursor);
      const lineStart = before.lastIndexOf("\n") + 1;
      const line = before.slice(lineStart);
      const slashIndex = line.lastIndexOf("/");
      if (slashIndex < 0) return null;
      const query = line.slice(slashIndex + 1);
      if (/\s/.test(query) || query.length > 20) return null;
      return {
        start: lineStart + slashIndex,
        end: cursor,
        query: query.toLowerCase()
      };
    }

    function slashOptions(query, textarea) {
      const blocks = DYNAMIC_SLASH_TARGETS.get(textarea) || SLASH_TARGETS.get(textarea) || [];
      if (!query) return blocks;
      return blocks.filter(block => {
        return block.label.toLowerCase().includes(query) ||
          block.id.toLowerCase().includes(query) ||
          block.hint.toLowerCase().includes(query);
      });
    }

    function renderSlashMenu() {
      const { options, selectedIndex } = slashState;
      els.slashMenu.innerHTML = options.map((block, index) => {
        return `<button class="slash-option${index === selectedIndex ? " active" : ""}" type="button" data-slash-id="${block.id}" role="option" aria-selected="${index === selectedIndex}">
          <b>${escapeHtml(block.icon)}</b>
          <span>${escapeHtml(block.label)}<small>${escapeHtml(block.hint)}</small></span>
        </button>`;
      }).join("");
      els.slashMenu.querySelectorAll("[data-slash-id]").forEach(button => {
        button.addEventListener("mousedown", event => {
          event.preventDefault();
          const block = slashState.options.find(item => item.id === button.dataset.slashId);
          applySlashOption(block);
        });
      });
      positionSlashMenu();
      els.slashMenu.classList.remove("hidden");
    }

    function positionSlashMenu() {
      const textarea = slashState?.textarea || els.theoryContentInput;
      const rect = textarea.getBoundingClientRect();
      const top = Math.min(window.innerHeight - 290, rect.top + 58);
      const left = Math.min(window.innerWidth - 334, rect.left + 18);
      els.slashMenu.style.top = `${Math.max(12, top)}px`;
      els.slashMenu.style.left = `${Math.max(12, left)}px`;
    }

    function applySlashOption(block) {
      if (!slashState || !block) return;
      const textarea = slashState.textarea || els.theoryContentInput;
      const before = textarea.value.slice(0, slashState.start);
      const after = textarea.value.slice(slashState.end);
      if (block.action) {
        textarea.value = `${before}${after}`;
        textarea.focus();
        textarea.setSelectionRange(before.length, before.length);
        textarea.dispatchEvent(new Event("input", { bubbles: true }));
        closeSlashMenu();
        runSlashAction(block.action);
        return;
      }
      if (block.id === "table") {
        textarea.value = `${before}${after}`;
        textarea.focus();
        textarea.setSelectionRange(before.length, before.length);
        textarea.dispatchEvent(new Event("input", { bubbles: true }));
        closeSlashMenu();
        openTableEditor(textarea);
        return;
      }
      const text = blockTemplate(block);
      textarea.value = `${before}${text}${after}`;
      const cursor = before.length + text.length;
      textarea.focus();
      textarea.setSelectionRange(cursor, cursor);
      textarea.dispatchEvent(new Event("input", { bubbles: true }));
      closeSlashMenu();
      if (textarea === els.theoryContentInput) {
        updateTheoryPreview();
      }
    }

    function runSlashAction(action) {
      openComposeDetails();
      if (action === "photo") {
        requestAnimationFrame(() => els.photoFile.click());
      } else if (action === "memo") {
        requestAnimationFrame(() => els.memoInput.focus());
      } else if (action === "tag") {
        requestAnimationFrame(() => els.tagsInput.focus());
      }
    }

    function openComposeDetails() {
      els.ocrBox.classList.remove("collapsed");
      els.toggleOcrBtn.textContent = "옵션 접기";
      els.toggleOcrBtn.setAttribute("aria-expanded", "true");
    }

    function closeSlashMenu() {
      slashState = null;
      els.slashMenu.classList.add("hidden");
      els.slashMenu.innerHTML = "";
    }

    function buildTheoryQuestionHint() {
      const title = els.theoryTitleInput.value.trim() || "이론";
      const content = els.theoryContentInput.value.trim();
      const firstPoint = content
        .split("\n")
        .map(line => line.replace(/^[-#>\s\[\]xX.]+/, "").trim())
        .find(Boolean);
      els.theoryPromptInput.value = `${title}의 핵심 내용을 서술하시오.${firstPoint ? ` 핵심어: ${firstPoint}` : ""}`;
      updateTheoryPreview();
      els.theoryPromptInput.focus();
    }

    function updateTheoryPreview() {
      if (!els.theoryPreview) return;
      const title = els.theoryTitleInput.value.trim() || "제목 없는 노트";
      const category = els.theoryCategoryInput.value.trim() || "미분류";
      const content = els.theoryContentInput.value.trim();
      const prompt = els.theoryPromptInput.value.trim();
      els.theoryPreviewMeta.textContent = `${category} · ${content ? "미리보기" : "작성 중"}`;
      els.theoryPreview.innerHTML = content
        ? `${formatTheoryStudyHtml({ title, content })}${prompt ? `<p class="theory-study-hint">문제화 힌트: ${escapeHtml(prompt)}</p>` : ""}`
        : `<p class="note-empty">왼쪽에서 블록을 추가하거나 내용을 입력하면 이곳에 노트처럼 미리 보입니다.</p>`;
    }

    function saveTheory(event) {
      event.preventDefault();
      const id = els.theoryEditId.value || crypto.randomUUID();
      const existing = (state.theories || []).find(theory => theory.id === id);
      const data = {
        id,
        examId: existing?.examId || state.activeExamId,
        category: els.theoryCategoryInput.value.trim() || "미분류",
        title: els.theoryTitleInput.value.trim(),
        content: els.theoryContentInput.value.trim(),
        prompt: els.theoryPromptInput.value.trim(),
        tags: normalizeTags(els.theoryTagsInput.value),
        favorite: Boolean(existing?.favorite),
        updatedAt: new Date().toISOString()
      };

      if (!state.theories) state.theories = [];
      if (existing) Object.assign(existing, data);
      else state.theories.unshift(data);

      persist();
      clearTheoryForm();
      render();
      updateTheoryPreview();
    }

    function clearTheoryForm() {
      els.theoryEditId.value = "";
      els.theoryForm.reset();
      updateTheoryPreview();
    }

    function editTheory(id) {
      const theory = (state.theories || []).find(item => item.id === id);
      if (!theory) return;
      els.theoryEditId.value = theory.id;
      els.theoryCategoryInput.value = theory.category || "";
      els.theoryTitleInput.value = theory.title || "";
      els.theoryTagsInput.value = tagsToInput(theory.tags);
      els.theoryContentInput.value = theory.content || "";
      els.theoryPromptInput.value = theory.prompt || "";
      setView("bank");
      setComposeMode("theory");
      updateTheoryPreview();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function deleteTheory(id) {
      if (!confirm("이 이론 정리를 삭제할까요?")) return;
      state.theories = (state.theories || []).filter(theory => theory.id !== id);
      persist();
      render();
    }

    function createQuestionFromTheory(id) {
      const theory = (state.theories || []).find(item => item.id === id);
      if (!theory) return;
      const question = {
        id: crypto.randomUUID(),
        examId: theory.examId || state.activeExamId,
        category: theory.category || "미분류",
        level: "중",
        question: theory.prompt || `${theory.title}의 핵심 내용을 설명하세요.`,
        answer: theory.content,
        memo: `이론 정리: ${theory.title}`,
        tags: normalizeTags(theory.tags),
        favorite: Boolean(theory.favorite),
        status: "new",
        wrongCount: 0,
        masteredAt: "",
        updatedAt: new Date().toISOString()
      };
      state.questions.unshift(question);
      persist();
      render();
      currentIndex = 0;
      els.categoryFilter.value = question.category;
      els.statusFilter.value = "all";
      setStudyMode("question");
      setView("study");
      renderStudy();
    }

    function studyTheory(id) {
      const theory = (state.theories || []).find(item => item.id === id);
      if (!theory) return;
      renderFilters();
      els.categoryFilter.value = [...els.categoryFilter.options].some(option => option.value === theory.category) ? theory.category : "all";
      els.statusFilter.value = "all";
      currentIndex = 0;
      setStudyMode("question");
      setView("study");
      renderStudy();
    }

    function renderWrongList() {
      const wrong = currentExamQuestions().filter(q => q.status === "wrong");
      const groups = groupByCategory(wrong);
      els.wrongList.innerHTML = groups.map(group => `<section class="wrong-section">
        <h3 class="wrong-section-title">${escapeHtml(group.category)} · ${group.items.length}개</h3>
        ${group.items.map(q => `<article class="wrong-card">
          <div class="wrong-card-meta">
            <span class="pill">오답 ${q.wrongCount || 1}회</span>
            <span class="pill">중요도 ${escapeHtml(q.level || "중")}</span>
            ${q.studyNote ? `<span class="pill">요약 있음</span>` : ""}
            ${q.favorite ? `<span class="favorite-mark">★ 중요</span>` : ""}
          </div>
          <h3>${escapeHtml(q.question)}</h3>
          ${renderTypeChips(q)}
          ${renderTags(q.tags)}
          <p>${escapeHtml(q.answer || q.answerImageName || "정답 없음")}</p>
          <footer class="wrong-card-actions">
            <button data-memory-card="${q.id}">요약 메모</button>
            <button data-edit="${q.id}">수정</button>
            <button data-master="${q.id}">암기 완료</button>
          </footer>
        </article>`).join("")}
      </section>`).join("") || `<div class="empty">아직 오답 표시한 문제가 없습니다.</div>`;
      bindListButtons(els.wrongList);
    }

    function renderMasteredList() {
      const mastered = currentExamQuestions().filter(q => q.status === "mastered");
      const groups = groupByCategory(mastered);
      els.masteredList.innerHTML = groups.map(group => `<section class="wrong-section">
        <h3 class="wrong-section-title">${escapeHtml(group.category)} · ${group.items.length}개</h3>
        ${group.items.map(q => `<article class="wrong-card">
          <div class="wrong-card-meta">
            <span class="pill">암기 완료</span>
            <span class="pill">중요도 ${escapeHtml(q.level || "중")}</span>
            ${q.masteredAt ? `<span class="pill">${escapeHtml(formatShortDate(q.masteredAt))}</span>` : ""}
            ${q.studyNote ? `<span class="pill">요약 있음</span>` : ""}
            ${q.favorite ? `<span class="favorite-mark">★ 중요</span>` : ""}
          </div>
          <h3>${escapeHtml(q.question)}</h3>
          ${renderTypeChips(q)}
          ${renderTags(q.tags)}
          <p>${escapeHtml(q.answer || q.answerImageName || "정답 없음")}</p>
          <footer class="wrong-card-actions">
            <button data-study="${q.id}">다시 학습</button>
            <button data-memory-card="${q.id}">요약 메모</button>
            <button data-edit="${q.id}">수정</button>
          </footer>
        </article>`).join("")}
      </section>`).join("") || `<div class="empty">아직 암기 완료한 문제가 없습니다.</div>`;
      bindListButtons(els.masteredList);
    }

    function groupByCategory(items) {
      const groups = new Map();
      items.forEach(item => {
        const category = item.category || "미분류";
        if (!groups.has(category)) groups.set(category, []);
        groups.get(category).push(item);
      });
      return [...groups.entries()]
        .map(([category, groupItems]) => ({
          category,
          items: groupItems.sort((a, b) => (b.wrongCount || 0) - (a.wrongCount || 0) || itemTime(b) - itemTime(a))
        }))
        .sort((a, b) => b.items.length - a.items.length || a.category.localeCompare(b.category));
    }

    function formatShortDate(value) {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return "";
      return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
    }

    function renderBank() {
      const questions = filteredQuestions();
      const total = currentExamQuestions().length;
      const isFiltered =
        Boolean(els.searchInput.value.trim()) ||
        (els.examTypeFilter.value && els.examTypeFilter.value !== "all") ||
        (els.categoryFilter.value && els.categoryFilter.value !== "all") ||
        (els.tagFilter.value && els.tagFilter.value !== "all") ||
        (els.statusFilter.value && els.statusFilter.value !== "all") ||
        els.favoriteFilter.checked ||
        els.sortFilter.value !== "default" ||
        bankListMode === "all";
      els.bankSummary.textContent = isFiltered
        ? `${bankListMode === "all" ? "전체 문제" : "검색 결과"} ${questions.length}개 / 전체 ${total}개`
        : `전체 문제 ${total}개 · 검색하면 목록이 표시됩니다`;
      els.clearBankSearchBtn.classList.toggle("hidden", !isFiltered);

      if (!isFiltered) {
        quickEditId = "";
        els.bankTable.innerHTML = `<tr><td colspan="6" class="empty">문제 목록은 검색어 또는 필터를 선택하면 표시됩니다. 저장된 데이터는 로컬/클라우드에 그대로 보관됩니다.</td></tr>`;
        return;
      }

      els.bankTable.innerHTML = questions.map(q => {
        const status = q.status === "wrong" ? "오답" : q.status === "mastered" ? "암기 완료" : "미학습";
        const answerPreview = q.answer || q.answerImageName || "";
        const quickEdit = quickEditId === q.id ? quickEditRow(q) : "";
        return `<tr class="bank-card-row">
          <td colspan="6">
            <article class="bank-card">
              <div class="bank-card-top">
                <div class="bank-card-meta">
                  <span class="pill">${escapeHtml(examTypeLabel(q.examType))}</span>
                  <span class="pill">${escapeHtml(q.category || "미분류")}</span>
                  <span class="pill">중요도 ${escapeHtml(q.level || "중")}</span>
                  <span class="pill">${status}</span>
                  ${q.studyNote ? `<span class="pill">요약 있음</span>` : ""}
                  ${q.favorite ? `<span class="favorite-mark">★ 중요</span>` : ""}
                </div>
                <div class="bank-card-actions">
                  <button data-memory-card="${q.id}">요약 메모</button>
                  <button data-quick-edit="${q.id}">빠른 수정</button>
                  <button data-edit="${q.id}">전체 수정</button>
                  <button data-delete="${q.id}" class="danger">삭제</button>
                </div>
              </div>
              <h3 class="bank-card-title">${escapeHtml(q.question)}</h3>
              ${renderTypeChips(q)}
              ${renderTags(q.tags)}
              <p class="bank-card-answer">${escapeHtml(answerPreview || "정답 없음")}</p>
              ${renderLintPanel(q)}
            </article>
          </td>
        </tr>${quickEdit}`;
      }).join("") || `<tr><td colspan="6" class="empty">${isFiltered ? "검색 결과가 없습니다." : "작성한 문제가 없습니다."}</td></tr>`;
      bindListButtons(els.bankTable);
    }

    function quickEditRow(q) {
      return `<tr class="quick-edit-row">
        <td colspan="6">
          <div class="quick-edit-form" data-quick-form="${q.id}">
            <label>시험 유형
              <select data-quick-field="examType">
                ${[
                  ["written", "실기 필답형"],
                  ["multiple", "필기 4지선다"],
                  ["practical", "실기 작업형"]
                ].map(([value, label]) => `<option value="${value}"${normalizeExamType(q.examType) === value ? " selected" : ""}>${label}</option>`).join("")}
              </select>
            </label>
            <label>분야
              <input data-quick-field="category" value="${escapeHtml(q.category || "미분류")}">
            </label>
            <label>중요도
              <select data-quick-field="level">
                ${["상", "중", "하"].map(level => `<option value="${level}"${(q.level || "중") === level ? " selected" : ""}>${level}</option>`).join("")}
              </select>
            </label>
            <label class="wide">태그
              <input data-quick-field="tags" value="${escapeHtml(tagsToInput(q.tags))}">
            </label>
            <label class="wide">문제
              <div class="text-tools" data-tools-for-quick="question"></div>
              <textarea data-quick-field="question" required>${escapeHtml(q.question)}</textarea>
            </label>
            <label class="wide">정답
              <div class="text-tools" data-tools-for-quick="answer"></div>
              <textarea data-quick-field="answer" required>${escapeHtml(q.answer)}</textarea>
            </label>
            <label class="wide">메모
              <div class="text-tools" data-tools-for-quick="memo"></div>
              <textarea data-quick-field="memo">${escapeHtml(q.memo || "")}</textarea>
            </label>
            <div class="wide quick-photo-tools">
              <div class="quick-photo-current">
                ${q.questionImage ? `<img src="${escapeHtml(q.questionImage)}" alt="${escapeHtml(q.imageName || "문제 사진")}">` : ""}
                <span data-quick-image-name>${q.questionImage ? `현재 사진: ${escapeHtml(q.imageName || "문제 사진")}` : "문제 사진 없음"}</span>
              </div>
              <input class="hidden-file" type="file" accept="image/*" data-quick-image-file>
              <div class="actions">
                <button type="button" data-quick-image-pick="${q.id}">사진 선택</button>
                <label class="photo-option">
                  <input type="checkbox" data-quick-image-remove>
                  기존 사진 삭제
                </label>
              </div>
            </div>
            <div class="wide quick-edit-actions">
              <button type="button" class="primary" data-quick-save="${q.id}">저장</button>
              <button type="button" data-quick-cancel>취소</button>
            </div>
          </div>
        </td>
      </tr>`;
    }

    function bindListButtons(root) {
      setupTextTools(root);
      root.querySelectorAll("[data-quick-field='question'], [data-quick-field='answer'], [data-quick-field='memo']").forEach(textarea => {
        registerSlashTextarea(textarea, QUESTION_SLASH_BLOCKS);
      });
      root.querySelectorAll("[data-quick-edit]").forEach(button => {
        button.addEventListener("click", () => {
          quickEditId = quickEditId === button.dataset.quickEdit ? "" : button.dataset.quickEdit;
          renderBank();
          requestAnimationFrame(() => {
            const form = [...els.bankTable.querySelectorAll("[data-quick-form]")]
              .find(item => item.dataset.quickForm === quickEditId);
            form?.querySelector("[data-quick-field='question']")?.focus();
          });
        });
      });
      root.querySelectorAll("[data-quick-save]").forEach(button => {
        button.addEventListener("click", () => saveQuickEdit(button));
      });
      root.querySelectorAll("[data-quick-image-pick]").forEach(button => {
        button.addEventListener("click", () => {
          button.closest("[data-quick-form]")?.querySelector("[data-quick-image-file]")?.click();
        });
      });
      root.querySelectorAll("[data-quick-image-file]").forEach(input => {
        input.addEventListener("change", () => {
          const form = input.closest("[data-quick-form]");
          const name = input.files?.[0]?.name || "선택한 사진 없음";
          form?.querySelector("[data-quick-image-name]")?.replaceChildren(document.createTextNode(`선택한 사진: ${name}`));
          const remove = form?.querySelector("[data-quick-image-remove]");
          if (remove) remove.checked = false;
        });
      });
      root.querySelectorAll("[data-quick-cancel]").forEach(button => {
        button.addEventListener("click", () => {
          quickEditId = "";
          renderBank();
        });
      });
      root.querySelectorAll("[data-edit]").forEach(button => {
        button.addEventListener("click", () => editQuestion(button.dataset.edit));
      });
      root.querySelectorAll("[data-memory-card]").forEach(button => {
        button.addEventListener("click", () => openMemoryCardById(button.dataset.memoryCard));
      });
      root.querySelectorAll("[data-study]").forEach(button => {
        button.addEventListener("click", () => focusStudyQuestion(button.dataset.study));
      });
      root.querySelectorAll("[data-delete]").forEach(button => {
        button.addEventListener("click", () => deleteQuestion(button.dataset.delete));
      });
      root.querySelectorAll("[data-master]").forEach(button => {
        button.addEventListener("click", () => {
          const q = state.questions.find(item => item.id === button.dataset.master);
          if (q) {
            q.status = "mastered";
            q.masteredAt = new Date().toISOString();
            q.updatedAt = new Date().toISOString();
            persist();
            render();
          }
        });
      });
    }

    function focusStudyQuestion(id) {
      const q = state.questions.find(item => item.id === id);
      if (!q) return;
      state.activeExamId = q.examId || DEFAULT_EXAM_ID;
      els.searchInput.value = "";
      els.examTypeFilter.value = "all";
      els.categoryFilter.value = "all";
      els.tagFilter.value = "all";
      els.statusFilter.value = "all";
      els.favoriteFilter.checked = false;
      reviewQueueIds = [];
      studyMode = "question";
      activeMemoryCardQuestionId = "";
      setView("study");
      render();
      const questions = filteredStudyQuestions();
      const index = questions.findIndex(item => item.id === q.id);
      currentIndex = index >= 0 ? index : 0;
      renderStudy();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function openSummaryList(type) {
      if (type === "wrong") {
        setRecordMode("wrong");
        setView("record");
        return;
      }
      if (type === "mastered") {
        setRecordMode("mastered");
        setView("record");
        return;
      }
      startAllQuestionStudy();
    }

    async function saveQuickEdit(button) {
      const form = button.closest("[data-quick-form]");
      const q = state.questions.find(item => item.id === button.dataset.quickSave);
      if (!form || !q) return;
      const previousQuestion = q.question || "";
      const previousAnswer = q.answer || "";
      q.examType = normalizeExamType(form.querySelector("[data-quick-field='examType']").value);
      q.category = form.querySelector("[data-quick-field='category']").value.trim() || "미분류";
      q.level = form.querySelector("[data-quick-field='level']").value || "중";
      q.question = form.querySelector("[data-quick-field='question']").value.trim();
      q.answer = form.querySelector("[data-quick-field='answer']").value.trim();
      q.memo = form.querySelector("[data-quick-field='memo']").value.trim();
      q.tags = normalizeTags(form.querySelector("[data-quick-field='tags']").value);
      q.updatedAt = new Date().toISOString();
      if (!q.question || !q.answer) {
        alert("문제와 정답은 비워둘 수 없습니다.");
        return;
      }
      if (previousQuestion !== q.question || previousAnswer !== q.answer) {
        q.memoryCard = null;
        q.memoryCardStatus = "";
      }
      const imageFile = form.querySelector("[data-quick-image-file]")?.files?.[0];
      const removeImage = form.querySelector("[data-quick-image-remove]")?.checked;
      if (imageFile) {
        button.disabled = true;
        try {
          const photo = await readPhotoFile(imageFile);
          q.questionImage = photo.dataUrl;
          q.imageName = photo.name;
        } catch (error) {
          console.warn(error);
          alert("사진을 저장하지 못했습니다. 다른 이미지로 다시 선택하세요.");
          button.disabled = false;
          return;
        }
      } else if (removeImage) {
        q.questionImage = "";
        q.imageName = "";
      }
      persist();
      quickEditId = "";
      render();
    }

    function clearBankSearch() {
      bankListMode = "filtered";
      els.searchInput.value = "";
      els.examTypeFilter.value = "all";
      els.categoryFilter.value = "all";
      els.tagFilter.value = "all";
      els.statusFilter.value = "all";
      els.sortFilter.value = "default";
      els.favoriteFilter.checked = false;
      currentIndex = 0;
      currentTheoryIndex = 0;
      render();
    }

    function setView(name) {
      activeView = name;
      document.querySelectorAll("[data-view]").forEach(view => view.classList.toggle("active", view.dataset.view === name));
      document.querySelectorAll("[data-view-btn]").forEach(button => button.classList.toggle("active", button.dataset.viewBtn === name));
      els.studyRangeBox.classList.remove("hidden");
      placeStudyRangeBox();
      renderStudyDisplayOptions();
    }

    function handleViewButtonClick(name) {
      if (name === "study") {
        startDefaultStudyView();
        return;
      }
      if (name === "record") setRecordMode("wrong");
      setView(name);
    }

    function startDefaultStudyView() {
      reviewQueueIds = [];
      reviewQueueLabel = "";
      includeMasteredInStudyAll = false;
      studyMode = "question";
      els.examTypeFilter.value = "all";
      els.statusFilter.value = "all";
      currentIndex = 0;
      setView("study");
      renderFilters();
      renderDashboard();
      renderStudyModeButtons();
      renderStudy();
    }

    function startNewQuestionStudy() {
      const candidates = currentExamQuestions().filter(q => q.status === "new");
      if (!candidates.length) return alert("미학습 문제가 없습니다.");
      reviewQueueIds = [];
      reviewQueueLabel = "";
      includeMasteredInStudyAll = false;
      studyMode = "question";
      els.searchInput.value = "";
      els.examTypeFilter.value = "all";
      els.categoryFilter.value = "all";
      els.tagFilter.value = "all";
      els.statusFilter.value = "new";
      els.favoriteFilter.checked = false;
      currentIndex = 0;
      setView("study");
      renderFilters();
      renderDashboard();
      renderStudyModeButtons();
      renderStudy();
    }

    function startAllQuestionStudy() {
      reviewQueueIds = [];
      reviewQueueLabel = "";
      includeMasteredInStudyAll = true;
      studyMode = "question";
      els.searchInput.value = "";
      els.examTypeFilter.value = "all";
      els.categoryFilter.value = "all";
      els.tagFilter.value = "all";
      els.statusFilter.value = "all";
      els.sortFilter.value = "default";
      els.favoriteFilter.checked = false;
      currentIndex = 0;
      setView("study");
      renderFilters();
      renderDashboard();
      renderStudyModeButtons();
      renderStudy();
    }

    function setStudyMode(mode) {
      studyMode = mode;
      if (mode === "question") currentIndex = Math.max(0, currentIndex);
      if (mode === "theory") currentTheoryIndex = Math.max(0, currentTheoryIndex);
      renderFilters();
      renderDashboard();
      renderStudyModeButtons();
      renderStudy();
    }

    function setInitialStudyExamType() {
      if (!els.examTypeFilter || els.examTypeFilter.value !== "all") return;
      els.examTypeFilter.value = "multiple";
    }

    function handleStudyModeTabClick(event) {
      const button = event.target.closest("[data-study-mode]");
      if (!button) return;
      const mode = button.dataset.studyMode;
      if (mode === "review") {
        startWrongReviewQueue();
        return;
      }
      if (["multiple", "written", "practical"].includes(mode)) {
        setActiveStudyModeButton(mode);
        setStudyExamType(mode);
      }
    }

    function setStudyExamType(type) {
      reviewQueueIds = [];
      reviewQueueLabel = "";
      includeMasteredInStudyAll = false;
      studyMode = "question";
      els.searchInput.value = "";
      els.examTypeFilter.value = type;
      els.categoryFilter.value = "all";
      els.tagFilter.value = "all";
      els.statusFilter.value = "all";
      els.favoriteFilter.checked = false;
      currentIndex = 0;
      setView("study");
      renderFilters();
      renderDashboard();
      renderStudyModeButtons();
      renderStudy();
    }

    function renderStudyModeButtons() {
      const reviewActive = studyMode === "question" && (reviewQueueIds.length > 0 || els.statusFilter.value === "wrong");
      const mode = reviewActive ? "review" : (els.examTypeFilter.value === "all" ? "multiple" : normalizeExamType(els.examTypeFilter.value));
      setActiveStudyModeButton(mode);
      els.examTypeFilter.disabled = false;
      els.statusFilter.disabled = false;
    }

    function setActiveStudyModeButton(mode) {
      document.querySelectorAll("[data-study-mode]").forEach(button => {
        button.classList.toggle("active", button.dataset.studyMode === mode);
      });
    }

    function setComposeMode(mode) {
      if (mode === "theory" && !els.composeTheoryModeBtn) mode = "question";
      composeMode = mode;
      if (mode !== "manage") {
        quickEditId = "";
        bankListMode = "filtered";
      }
      els.composeQuestionModeBtn.classList.toggle("active", mode === "question");
      if (els.composeTheoryModeBtn) els.composeTheoryModeBtn.classList.toggle("active", mode === "theory");
      els.composeManageModeBtn.classList.toggle("active", mode === "manage");
      document.querySelectorAll("[data-bank-panel]").forEach(panel => {
        panel.classList.toggle("active", panel.dataset.bankPanel === mode);
      });
    }

    function setRecordMode(mode) {
      document.querySelectorAll("[data-record-btn]").forEach(button => {
        button.classList.toggle("active", button.dataset.recordBtn === mode);
      });
      document.querySelectorAll("[data-record-panel]").forEach(panel => {
        const active = panel.dataset.recordPanel === mode;
        panel.classList.toggle("active", active);
        panel.classList.toggle("hidden", !active);
      });
    }

    function setMorePanel(name) {
      document.querySelectorAll("[data-more-panel]").forEach(panel => panel.classList.toggle("active", panel.dataset.morePanel === name));
      document.querySelectorAll("[data-more-btn]").forEach(button => button.classList.toggle("active", button.dataset.moreBtn === name));
    }

    function openMobileDrawer() {
      document.body.classList.add("drawer-open");
    }

    function closeMobileDrawer() {
      document.body.classList.remove("drawer-open");
    }

    function toggleMobileSearch() {
      const willOpen = !document.body.classList.contains("search-open");
      document.body.classList.toggle("search-open", willOpen);
      els.toggleSearchBtn.setAttribute("aria-label", willOpen ? "검색 닫기" : "검색 열기");
      els.toggleSearchBtn.textContent = willOpen ? "×" : "⌕";
      if (willOpen) {
        requestAnimationFrame(() => els.searchInput.focus());
      }
    }

    function handlePhoneStudyShortcut(event) {
      if (!isPhoneStudyShortcutReady(event)) return false;

      if (!runPhoneStudyShortcut(event.key)) return false;
      event.preventDefault();
      return true;
    }

    function isPhoneStudyShortcutReady(event) {
      if (activeView !== "study" || tableEditorState || slashState || event.ctrlKey || event.altKey || event.metaKey) return false;
      if (!isPhoneStudySurface()) return false;
      const target = event.target;
      if (!target) return true;
      if (typeof target.closest !== "function") return true;
      if (target === els.shortcutCapture) return true;
      return !target.closest("input, textarea, select, [contenteditable='true']");
    }

    function isPhoneStudySurface() {
      return window.matchMedia("(max-width: 820px)").matches && (navigator.maxTouchPoints || 0) > 0;
    }

    function phoneStudyShortcutActions() {
      return {
        ArrowLeft: () => moveCard(-1),
        ArrowRight: () => moveCard(1),
        q: () => moveCard(-1),
        p: () => moveCard(1),
        Enter: () => handlePrimaryStudyAction(),
        Space: () => handlePrimaryStudyAction(),
        "1": () => studyMode === "question" && markWrong(),
        "2": () => studyMode === "question" && markMastered(),
        i: () => toggleCurrentStudyFavorite(),
        s: () => openMobileSearch(),
        m: () => openMobileDrawer()
      };
    }

    function normalizePhoneShortcutKey(value) {
      const raw = String(value || "");
      const key = raw.length === 1 ? raw.toLowerCase() : raw;
      const aliases = {
        " ": "Space",
        Spacebar: "Space",
        ㅂ: "q",
        ㅔ: "p",
        ㄴ: "s",
        ㅑ: "i",
        ㅡ: "m"
      };
      return aliases[key] || key;
    }

    function runPhoneStudyShortcut(value) {
      const key = normalizePhoneShortcutKey(value);
      const action = phoneStudyShortcutActions()[key];
      if (!action) return false;
      action();
      return true;
    }

    function handleShortcutCaptureInput() {
      const values = Array.from(els.shortcutCapture.value || "");
      clearShortcutCapture();
      let handled = false;
      values.forEach(value => {
        if (runPhoneStudyShortcut(value)) handled = true;
      });
      if (handled && document.activeElement !== els.searchInput) keepShortcutCaptureFocused();
    }

    function focusShortcutCapture() {
      if (!isPhoneStudySurface()) return;
      els.shortcutCapture.focus({ preventScroll: true });
      clearShortcutCapture();
      updateShortcutCaptureState();
    }

    function keepShortcutCaptureFocused() {
      if (document.activeElement !== els.shortcutCapture && isPhoneStudySurface()) {
        requestAnimationFrame(() => els.shortcutCapture.focus({ preventScroll: true }));
      }
      updateShortcutCaptureState();
    }

    function clearShortcutCapture() {
      els.shortcutCapture.value = "";
    }

    function updateShortcutCaptureState() {
      const active = document.activeElement === els.shortcutCapture;
      els.phoneKeyboardBtn.classList.toggle("active", active);
      els.phoneKeyboardBtn.setAttribute("aria-pressed", String(active));
    }

    function openMobileSearch() {
      if (!document.body.classList.contains("search-open")) {
        toggleMobileSearch();
      } else {
        els.searchInput.focus();
      }
    }

    function toggleStudyRange() {
      const willExpand = els.studyRangeBox.classList.contains("collapsed");
      els.studyRangeBox.classList.toggle("collapsed", !willExpand);
      els.toggleRangeBtn.textContent = willExpand ? "접기" : "펼치기";
      els.toggleRangeBtn.setAttribute("aria-expanded", String(willExpand));
    }

    function startReviewQueue(typeGroup = "all") {
      const candidates = currentExamQuestions().filter(q => reviewQueueTypeMatches(q, typeGroup));
      if (!candidates.length) return alert(`${reviewQueueTypeLabel(typeGroup)} 복습 큐에 넣을 문제가 없습니다.`);
      includeMasteredInStudyAll = false;
      reviewQueueLabel = reviewQueueTypeLabel(typeGroup);
      reviewQueueIds = candidates
        .map(q => ({ id: q.id, score: reviewScore(q), time: itemTime(q) }))
        .sort((a, b) => b.score - a.score || a.time - b.time)
        .slice(0, 20)
        .map(item => item.id);
      currentIndex = 0;
      studyMode = "question";
      els.searchInput.value = "";
      els.examTypeFilter.value = typeGroup === "written" ? "multiple" : "all";
      if (typeGroup === "answer") els.examTypeFilter.value = "written";
      if (typeGroup === "practical") els.examTypeFilter.value = "practical";
      els.categoryFilter.value = "all";
      els.tagFilter.value = "all";
      els.statusFilter.value = "all";
      els.favoriteFilter.checked = false;
      setView("study");
      renderFilters();
      renderDashboard();
      renderStudy();
    }

    function reviewQueueTypeMatches(question, typeGroup) {
      const examType = normalizeExamType(question?.examType);
      if (typeGroup === "written") return examType === "multiple";
      if (typeGroup === "answer") return examType === "written";
      if (typeGroup === "practical") return examType === "practical";
      return true;
    }

    function reviewQueueTypeLabel(typeGroup) {
      if (typeGroup === "written") return "필기";
      if (typeGroup === "answer") return "필답형";
      if (typeGroup === "practical") return "작업형";
      return "오늘";
    }

    function startWrongReviewQueue() {
      const candidates = currentExamQuestions().filter(q => q.status === "wrong");
      if (!candidates.length) return alert("복습할 오답 문제가 없습니다.");
      includeMasteredInStudyAll = false;
      reviewQueueLabel = "오답 복습 큐";
      reviewQueueIds = candidates
        .map(q => ({ id: q.id, score: reviewScore(q), time: itemTime(q) }))
        .sort((a, b) => b.score - a.score || b.time - a.time)
        .map(item => item.id);
      currentIndex = 0;
      studyMode = "question";
      els.searchInput.value = "";
      els.examTypeFilter.value = "all";
      els.categoryFilter.value = "all";
      els.tagFilter.value = "all";
      els.statusFilter.value = "wrong";
      els.favoriteFilter.checked = false;
      setView("study");
      renderFilters();
      renderDashboard();
      renderStudy();
    }

    function startMasteredCheckQueue() {
      const candidates = currentExamQuestions().filter(q => q.status === "mastered");
      if (!candidates.length) return alert("점검할 완료 문제가 없습니다.");
      includeMasteredInStudyAll = false;
      reviewQueueLabel = "암기 확인 큐";
      reviewQueueIds = shuffleArray(candidates)
        .slice(0, 20)
        .map(q => q.id);
      currentIndex = 0;
      studyMode = "question";
      els.searchInput.value = "";
      els.examTypeFilter.value = "all";
      els.categoryFilter.value = "all";
      els.tagFilter.value = "all";
      els.statusFilter.value = "mastered";
      els.favoriteFilter.checked = false;
      setView("study");
      renderFilters();
      renderDashboard();
      renderStudy();
    }

    function clearReviewQueue() {
      startAllQuestionStudy();
    }

    function shuffleArray(items) {
      const copy = [...items];
      for (let i = copy.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    }

    function reviewScore(q) {
      const daysSinceUpdate = Math.min(30, Math.floor((Date.now() - itemTime(q)) / 86400000) || 0);
      return (q.status === "wrong" ? 40 : 0)
        + ((q.wrongCount || 0) * 8)
        + (q.favorite ? 18 : 0)
        + (q.level === "상" ? 10 : q.level === "중" ? 5 : 0)
        + (q.status === "new" ? 8 : 0)
        + daysSinceUpdate;
    }

    function placeStudyRangeBox() {
      const target = els.studyGrid;
      if (!target || !els.studyRangeBox || els.studyRangeBox.parentElement === target) return;
      target.insertBefore(els.studyRangeBox, target.firstElementChild);
    }

    function moveCard(delta) {
      if (studyMode === "theory") {
        const count = filteredTheories().length;
        if (!count) return;
        currentTheoryIndex = (currentTheoryIndex + delta + count) % count;
        renderStudy();
        return;
      }
      const count = filteredStudyQuestions().length;
      if (!count) return;
      currentIndex = (currentIndex + delta + count) % count;
      renderStudy();
    }

    function handlePrimaryStudyAction() {
      if (studyMode === "theory") {
        const theory = filteredTheories()[currentTheoryIndex];
        if (theory) createQuestionFromTheory(theory.id);
        return;
      }
      const current = getCurrentQuestion();
      if (current) els.answerText.innerHTML = formatStagedAnswerHtml(current);
      els.answerText.classList.toggle("visible");
      if (els.answerText.classList.contains("visible")) {
        renderMemoryCardPanel(null);
        updateAnswerAssist();
      } else {
        hideAnswerAssist();
      }
    }

    function updateAnswerAssist() {
      const q = getCurrentQuestion();
      if (!q || studyMode !== "question" || answerStage === "hint" || !els.answerText.classList.contains("visible")) {
        hideAnswerAssist();
        return;
      }
      const keywords = answerKeywords(q.answer);
      if (!keywords.length) {
        hideAnswerAssist();
        return;
      }
      const mine = compactText(els.myAnswer.value);
      const hits = [];
      const misses = [];
      keywords.forEach(keyword => {
        const bucket = mine.includes(compactText(keyword)) ? hits : misses;
        bucket.push(keyword);
      });
      const score = Math.round((hits.length / keywords.length) * 100);
      els.answerAssist.innerHTML = `
        <h3>채점 보조</h3>
        <div class="assist-score">핵심어 ${hits.length}/${keywords.length}개 포함 · ${score}%</div>
        <div class="assist-row">
          ${hits.slice(0, 10).map(word => `<span class="assist-chip hit">✓ ${escapeHtml(word)}</span>`).join("")}
          ${misses.slice(0, 10).map(word => `<span class="assist-chip miss">+ ${escapeHtml(word)}</span>`).join("")}
        </div>
      `;
      els.answerAssist.classList.remove("hidden");
    }

    function hideAnswerAssist() {
      els.answerAssist.classList.add("hidden");
      els.answerAssist.innerHTML = "";
    }

    function answerKeywords(answer) {
      const phrases = answerPhrases(answer);
      const shortWords = phrases.flatMap(phrase => {
        if (phrase.length <= 12) return [];
        return phrase
          .replace(/[()[\]{}]/g, " ")
          .split(/\s+/)
          .map(word => normalizeAnswerPhrase(word))
          .filter(word => word.length >= 2 && word.length <= 8);
      });
      return uniqueMeaningfulPhrases([...phrases, ...shortWords]).slice(0, 14);
    }

    function answerPhrases(answer) {
      const numberComma = "__NUM_COMMA__";
      const source = String(answer || "")
        .replace(/(\d),(?=\d{3}\b)/g, `$1${numberComma}`)
        .replace(/\|/g, "\n")
        .replace(/([①-⑳])/g, "\n$1 ")
        .replace(/(\d+)\s*[.)]\s*/g, "\n$1. ");
      const chunks = source
        .split(/[\n,，;；]+/)
        .map(chunk => normalizeAnswerPhrase(chunk.replaceAll(numberComma, ",")))
        .filter(Boolean);
      return uniqueMeaningfulPhrases(chunks).slice(0, 20);
    }

    function normalizeAnswerPhrase(value) {
      return String(value || "")
        .replace(/\{\{([^{}]+)\}\}/g, "$1")
        .replace(/\[\/?박스\]/g, " ")
        .replace(/\[%\]/g, "%")
        .replace(/\[[^\]]{1,8}\]/g, " ")
        .replace(/^[\s\-•*]+/, "")
        .replace(/^[①-⑳]\s*/, "")
        .replace(/^\d+\s*[.)]\s*/, "")
        .replace(/^(정답|답|메모|공식|대입|계산|풀이|결과|출처)\s*[:：]\s*/i, "")
        .replace(/\s+/g, " ")
        .replace(/\s+([을를이가은는의])(?=\s|$)/g, "$1")
        .replace(/[.。]+$/g, "")
        .trim();
    }

    function uniqueMeaningfulPhrases(items) {
      const stop = new Set(["정답", "답", "메모", "출처", "공식", "대입", "계산", "풀이", "결과", "이상", "이하", "한다", "시오", "쓰기", "쓰시오"]);
      const seen = new Set();
      return items.filter(item => {
        const word = normalizeAnswerPhrase(item);
        const compact = compactText(word);
        if (compact.length < 2 || stop.has(compact) || /^[-=]+$/.test(compact)) return false;
        if (seen.has(compact)) return false;
        seen.add(compact);
        return true;
      }).map(normalizeAnswerPhrase);
    }

    function compactText(value) {
      return String(value || "").toLowerCase().replace(/\s+/g, "");
    }

    function updateStudyFavoriteButton(item) {
      const active = Boolean(item?.favorite);
      els.studyFavoriteBtn.disabled = !item;
      els.studyFavoriteBtn.classList.toggle("active", active);
      els.studyFavoriteBtn.textContent = active ? "★ 중요" : "☆ 중요";
    }

    function toggleCurrentStudyFavorite() {
      const item = studyMode === "theory"
        ? filteredTheories()[currentTheoryIndex]
        : filteredStudyQuestions()[currentIndex];
      if (!item) return;
      item.favorite = !item.favorite;
      item.updatedAt = new Date().toISOString();
      persist();
      render();
    }

    function getCurrentQuestion() {
      if (studyMode !== "question") return null;
      return filteredStudyQuestions()[currentIndex];
    }

    function editCurrentStudyQuestion() {
      const q = getCurrentQuestion();
      if (!q) return;
      editQuestion(q.id);
    }

    function markWrong() {
      const q = getCurrentQuestion();
      if (!q) return;
      q.status = "wrong";
      q.wrongCount = (q.wrongCount || 0) + 1;
      q.updatedAt = new Date().toISOString();
      persist();
      advanceAfterReview(q.id);
    }

    function markMastered() {
      const q = getCurrentQuestion();
      if (!q) return;
      q.status = "mastered";
      q.masteredAt = new Date().toISOString();
      q.updatedAt = new Date().toISOString();
      persist();
      advanceAfterReview(q.id);
    }

    function advanceAfterReview(reviewedId) {
      if (reviewQueueIds.includes(reviewedId)) {
        reviewQueueIds = reviewQueueIds.filter(id => id !== reviewedId);
      }
      const questions = filteredStudyQuestions();
      if (questions.length) {
        currentIndex = Math.min(currentIndex, questions.length - 1);
      }
      render();
    }

    function toggleOcrBox() {
      const willExpand = els.ocrBox.classList.contains("collapsed");
      els.ocrBox.classList.toggle("collapsed", !willExpand);
      els.toggleOcrBtn.textContent = willExpand ? "옵션 접기" : "상세 옵션";
      els.toggleOcrBtn.setAttribute("aria-expanded", String(willExpand));
    }

    async function readQuestionPhoto(event) {
      const files = [...event.target.files].filter(file => file.type.startsWith("image/"));
      if (!files.length) return;
      await loadPendingPhotoFiles(files, "선택됨");
      event.target.value = "";
    }

    async function pasteQuestionPhoto(event) {
      const files = [...event.clipboardData?.items || []]
        .filter(item => item.kind === "file" && item.type.startsWith("image/"))
        .map(item => item.getAsFile())
        .filter(Boolean);
      if (!files.length) return;
      event.preventDefault();
      await loadPendingPhotoFiles(files, "붙여넣음");
    }

    async function loadPendingPhotoFiles(files, actionLabel) {
      pendingPhotoQuestions = [];
      els.applyOcrBtn.disabled = true;
      els.pickPhotoBtn.disabled = true;
      els.photoPreview.innerHTML = "";
      setOcrStatus("사진을 불러오는 중입니다.");

      try {
        pendingPhotoQuestions = await Promise.all(files.map(readPhotoFile));
        removeQuestionImageOnSave = false;
        removeAnswerImageOnSave = false;
        renderPhotoPreview();
        updateQuestionDiagnostics();
        els.applyOcrBtn.disabled = !pendingPhotoQuestions.length;
        const totalSize = pendingPhotoQuestions.reduce((sum, photo) => sum + photo.dataUrl.length, 0);
        const sizeMb = (totalSize / 1024 / 1024).toFixed(1);
        setOcrStatus(`${pendingPhotoQuestions.length}장 ${actionLabel}. 저장용으로 압축했습니다. 약 ${sizeMb}MB`);
      } catch (error) {
        console.warn(error);
        pendingPhotoQuestions = [];
        els.photoPreview.innerHTML = "";
        setOcrStatus("사진을 불러오지 못했습니다. 다른 이미지로 다시 선택하세요.", true);
      } finally {
        els.pickPhotoBtn.disabled = false;
      }
    }

    async function readPhotoFile(file) {
      try {
        return await compressPhotoFile(file);
      } catch (error) {
        console.warn("Photo compression failed, falling back to original image.", error);
        return readPhotoFileAsDataUrl(file);
      }
    }

    function readPhotoFileAsDataUrl(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve({
          name: file.name,
          dataUrl: reader.result
        });
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
    }

    function compressPhotoFile(file) {
      return new Promise((resolve, reject) => {
        const image = new Image();
        const objectUrl = URL.createObjectURL(file);

        image.onload = () => {
          try {
            const scale = Math.min(1, PHOTO_MAX_EDGE / Math.max(image.naturalWidth, image.naturalHeight));
            const width = Math.max(1, Math.round(image.naturalWidth * scale));
            const height = Math.max(1, Math.round(image.naturalHeight * scale));
            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const context = canvas.getContext("2d");
            context.drawImage(image, 0, 0, width, height);
            URL.revokeObjectURL(objectUrl);
            resolve({
              name: file.name,
              dataUrl: canvas.toDataURL("image/jpeg", PHOTO_QUALITY)
            });
          } catch (error) {
            URL.revokeObjectURL(objectUrl);
            reject(error);
          }
        };

        image.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          reject(new Error("이미지를 읽을 수 없습니다."));
        };

        image.src = objectUrl;
      });
    }

    function renderPhotoPreview() {
      const editing = currentEditingQuestion();
      const selectedPhotos = pendingPhotoQuestions.map((photo, index) => ({
        dataUrl: photo.dataUrl,
        name: photo.name,
        role: index === 0 ? "문제 사진" : (els.photoPairMode.checked && index === 1 ? "정답 사진" : `추가 사진 ${index + 1}`)
      }));
      const existingPhotos = [];
      if (!pendingPhotoQuestions.length && editing) {
        if (editing.questionImage && !removeQuestionImageOnSave) {
          existingPhotos.push({
            dataUrl: editing.questionImage,
            name: editing.imageName || "저장된 문제 사진",
            role: "현재 문제 사진"
          });
        }
        if (editing.answerImage && !removeAnswerImageOnSave) {
          existingPhotos.push({
            dataUrl: editing.answerImage,
            name: editing.answerImageName || "저장된 정답 사진",
            role: "현재 정답 사진"
          });
        }
      }
      const photos = selectedPhotos.length ? selectedPhotos : existingPhotos;
      els.photoPreview.innerHTML = photos.map((photo, index) => {
        return `<figure>
          <img src="${escapeHtml(photo.dataUrl)}" alt="사진 문제 미리보기 ${index + 1}">
          <figcaption><span class="photo-role">${escapeHtml(photo.role)}</span><br>${escapeHtml(photo.name)}</figcaption>
        </figure>`;
      }).join("");
      els.clearPhotoBtn.disabled = !photos.length;
      renderQuestionPreview();
    }

    function currentEditingQuestion() {
      return state.questions.find(q => q.id === els.editId.value) || null;
    }

    function clearAttachedPhotos() {
      const editing = currentEditingQuestion();
      pendingPhotoQuestions = [];
      if (editing) {
        removeQuestionImageOnSave = true;
        removeAnswerImageOnSave = true;
        setOcrStatus("저장하면 기존 첨부 사진이 삭제됩니다.");
      } else {
        setOcrStatus("선택한 사진을 비웠습니다.");
      }
      els.applyOcrBtn.disabled = true;
      renderPhotoPreview();
      updateQuestionDiagnostics();
    }

    function applyOcrText() {
      if (!pendingPhotoQuestions.length) return;

      const category = els.categoryInput.value.trim() || "사진 문제";
      const examType = normalizeExamType(els.examTypeInput.value || "practical");
      const level = els.levelInput.value || "중";
      const tags = normalizeTags(els.tagsInput.value);
      const baseQuestion = els.questionInput.value.trim();
      const pairMode = els.photoPairMode.checked;
      const answer = els.answerInput.value.trim() || (pairMode ? "정답 사진을 확인하세요." : "사진 문제입니다.");
      const memo = els.memoInput.value.trim() || "사진을 그대로 저장한 문제";
      const photoGroups = pairMode ? groupPhotoPairs(pendingPhotoQuestions) : pendingPhotoQuestions.map(photo => ({ questionPhoto: photo }));
      const created = photoGroups.map((group, index) => {
        const fallbackTitle = group.questionPhoto.name ? group.questionPhoto.name.replace(/\.[^.]+$/g, "") : `사진 문제 ${index + 1}`;
        const question = photoGroups.length === 1
          ? (baseQuestion || fallbackTitle || "사진 문제")
          : `${baseQuestion || "사진 문제"} ${index + 1}`;
        return {
          id: crypto.randomUUID(),
          examId: state.activeExamId,
          examType,
          category,
          level,
          question,
          answer,
          memo,
          questionImage: group.questionPhoto.dataUrl,
          imageName: group.questionPhoto.name,
          answerImage: group.answerPhoto?.dataUrl || "",
          answerImageName: group.answerPhoto?.name || "",
          tags,
          favorite: false,
          status: "new",
          wrongCount: 0,
          masteredAt: "",
          updatedAt: new Date().toISOString()
        };
      });

      state.questions.unshift(...created);
      try {
        persist();
      } catch (error) {
        console.warn(error);
        state.questions.splice(0, created.length);
        setOcrStatus("사진 용량이 커서 저장하지 못했습니다. 사진 수를 줄이거나 화면을 잘라서 다시 선택하세요.", true);
        alert("사진 용량이 커서 저장하지 못했습니다. 사진 수를 줄이거나 화면을 잘라서 다시 선택하세요.");
        return;
      }

      const firstCreatedId = created[0]?.id;
      pendingPhotoQuestions = [];
      els.photoPreview.innerHTML = "";
      els.applyOcrBtn.disabled = true;
      clearForm();
      els.searchInput.value = "";
      els.examTypeFilter.value = "all";
      els.categoryFilter.value = "all";
      els.statusFilter.value = "all";
      render();
      const questions = filteredStudyQuestions();
      const savedIndex = questions.findIndex(q => q.id === firstCreatedId);
      currentIndex = savedIndex >= 0 ? savedIndex : 0;
      setView("study");
      renderStudy();
    }

    function groupPhotoPairs(photos) {
      const groups = [];
      for (let index = 0; index < photos.length; index += 2) {
        groups.push({
          questionPhoto: photos[index],
          answerPhoto: photos[index + 1] || null
        });
      }
      return groups;
    }

    function setOcrStatus(message, isError = false) {
      els.ocrStatus.textContent = message;
      els.ocrStatus.classList.toggle("error", isError);
    }

    function saveQuestion(event) {
      event.preventDefault();
      const id = els.editId.value || crypto.randomUUID();
      const existing = state.questions.find(q => q.id === id);
      const questionPhoto = pendingPhotoQuestions[0] || null;
      const answerPhoto = els.photoPairMode.checked ? (pendingPhotoQuestions[1] || null) : null;
      const nextQuestion = els.questionInput.value.trim();
      const nextAnswer = els.answerInput.value.trim();
      const keepMemoryCard = existing && existing.question === nextQuestion && existing.answer === nextAnswer;
      const data = {
        id,
        examId: existing?.examId || state.activeExamId,
        examType: normalizeExamType(els.examTypeInput.value),
        category: els.categoryInput.value.trim() || "미분류",
        level: els.levelInput.value,
        question: nextQuestion,
        answer: nextAnswer,
        memo: els.memoInput.value.trim(),
        tags: normalizeTags(els.tagsInput.value),
        favorite: Boolean(existing?.favorite),
        questionImage: questionPhoto?.dataUrl || (removeQuestionImageOnSave ? "" : existing?.questionImage || ""),
        imageName: questionPhoto?.name || (removeQuestionImageOnSave ? "" : existing?.imageName || ""),
        answerImage: answerPhoto?.dataUrl || (removeAnswerImageOnSave ? "" : existing?.answerImage || ""),
        answerImageName: answerPhoto?.name || (removeAnswerImageOnSave ? "" : existing?.answerImageName || ""),
        status: existing?.status || "new",
        wrongCount: existing?.wrongCount || 0,
        masteredAt: existing?.masteredAt || "",
        studyNote: existing?.studyNote || "",
        memoryCard: keepMemoryCard ? existing.memoryCard : null,
        memoryCardStatus: keepMemoryCard ? existing.memoryCardStatus || "" : "",
        updatedAt: new Date().toISOString()
      };

      if (existing) Object.assign(existing, data);
      else state.questions.unshift(data);

      persist();
      clearForm({ keepContext: !existing });
      render();
      requestAnimationFrame(() => els.questionInput.focus());
    }

    function clearForm(options = {}) {
      const keepContext = Boolean(options.keepContext);
      const context = keepContext ? {
        examType: els.examTypeInput.value,
        category: els.categoryInput.value,
        level: els.levelInput.value,
        tags: els.tagsInput.value
      } : null;
      els.editId.value = "";
      els.questionForm.querySelector(".compose-head h2").textContent = "새 문제";
      els.questionForm.reset();
      els.examTypeInput.value = normalizeExamType(context?.examType);
      els.categoryInput.value = context?.category || "";
      els.levelInput.value = context?.level || "중";
      els.tagsInput.value = context?.tags || "";
      pendingPhotoQuestions = [];
      removeQuestionImageOnSave = false;
      removeAnswerImageOnSave = false;
      els.photoPreview.innerHTML = "";
      els.applyOcrBtn.disabled = true;
      els.clearPhotoBtn.disabled = true;
      setOcrStatus("사진을 고르거나 캡처 이미지를 Ctrl+V로 붙여넣으면 미리보기가 표시됩니다.");
      updateQuestionDiagnostics();
    }

    function editQuestion(id) {
      const q = state.questions.find(item => item.id === id);
      if (!q) return;
      pendingPhotoQuestions = [];
      removeQuestionImageOnSave = false;
      removeAnswerImageOnSave = false;
      els.editId.value = q.id;
      els.questionForm.querySelector(".compose-head h2").textContent = "문제 수정";
      els.examTypeInput.value = normalizeExamType(q.examType);
      els.categoryInput.value = q.category;
      els.levelInput.value = q.level || "중";
      els.tagsInput.value = tagsToInput(q.tags);
      els.questionInput.value = q.question;
      els.answerInput.value = q.answer;
      els.memoInput.value = q.memo || "";
      renderPhotoPreview();
      setOcrStatus(q.questionImage || q.answerImage ? "저장된 첨부 사진이 있습니다." : "사진을 고르거나 캡처 이미지를 Ctrl+V로 붙여넣으면 미리보기가 표시됩니다.");
      updateQuestionDiagnostics();
      setView("bank");
      setComposeMode("question");
      openComposeDetails();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function deleteQuestion(id) {
      if (!confirm("이 문제를 삭제할까요?")) return;
      const index = state.questions.findIndex(q => q.id === id);
      if (index >= 0) {
        state.questions.splice(index, 1);
        persist();
        render();
      }
    }

    function shuffleQuestions() {
      const examQuestions = currentExamQuestions();
      const shuffledIds = examQuestions.map(q => q.id);
      for (let i = shuffledIds.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledIds[i], shuffledIds[j]] = [shuffledIds[j], shuffledIds[i]];
      }

      const order = new Map(shuffledIds.map((id, index) => [id, index]));
      state.questions.sort((a, b) => {
        const aOrder = order.has(a.id) ? order.get(a.id) : Number.MAX_SAFE_INTEGER;
        const bOrder = order.has(b.id) ? order.get(b.id) : Number.MAX_SAFE_INTEGER;
        return aOrder - bOrder;
      });
      currentIndex = 0;
      persist();
      render();
    }

    function resetProgress() {
      if (!confirm("현재 시험의 문제는 유지하고 오답/암기 완료 기록만 초기화할까요?")) return;
      currentExamQuestions().forEach(q => {
        q.status = "new";
        q.wrongCount = 0;
        q.masteredAt = "";
      });
      persist();
      render();
    }

    function importCsvFile(event) {
      const file = event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => importCsvText(String(reader.result || ""));
      reader.readAsText(file, "utf-8");
      event.target.value = "";
    }

    function importCsvText(text) {
      const rows = parseCsv(text).filter(row => row.some(cell => cell.trim()));
      if (!rows.length) return alert("가져올 CSV 내용이 없습니다.");

      const header = rows[0].map(cell => cell.trim().toLowerCase());
      const hasHeader = ["category", "level", "question", "answer"].every(name => header.includes(name));
      const dataRows = hasHeader ? rows.slice(1) : rows;
      const imported = dataRows.map(row => {
        const get = name => hasHeader ? row[header.indexOf(name)] || "" : "";
        return {
          id: crypto.randomUUID(),
          examId: state.activeExamId,
          examType: normalizeExamType(hasHeader ? get("examtype") || get("exam_type") : ""),
          category: (hasHeader ? get("category") : row[0])?.trim() || "미분류",
          level: (hasHeader ? get("level") : row[1])?.trim() || "중",
          question: (hasHeader ? get("question") : row[2])?.trim() || "",
          answer: (hasHeader ? get("answer") : row[3])?.trim() || "",
          memo: (hasHeader ? get("memo") : row[4])?.trim() || "",
          tags: normalizeTags(hasHeader ? get("tags") : row[5]),
          favorite: ["true", "1", "yes", "y", "중요"].includes(String(hasHeader ? get("favorite") : row[6]).trim().toLowerCase()),
          status: "new",
          wrongCount: 0,
          masteredAt: "",
          updatedAt: new Date().toISOString()
        };
      }).filter(q => q.question && q.answer);

      const existing = new Set(currentExamQuestions().map(q => `${q.category}|${q.question}`));
      let added = 0;
      imported.forEach(q => {
        const key = `${q.category}|${q.question}`;
        if (!existing.has(key)) {
          state.questions.push(q);
          existing.add(key);
          added += 1;
        }
      });

      persist();
      render();
      alert(`${added}개 문제를 가져왔습니다.`);
      setView("study");
    }

    function exportCsv() {
      const header = ["examType", "category", "level", "question", "answer", "memo", "tags", "favorite", "status", "wrongCount"];
      const rows = currentExamQuestions().map(q => [normalizeExamType(q.examType), q.category, q.level, q.question, q.answer, q.memo, tagsToInput(q.tags), q.favorite ? "true" : "", q.status, q.wrongCount]);
      download(`${state.activeExamId}_questions.csv`, toCsv([header, ...rows]));
    }

    function downloadTemplate() {
      const rows = [
        ["examType", "category", "level", "question", "answer", "memo", "tags", "favorite"],
        ["multiple", "안전관리", "상", "문제 내용을 입력\n① 보기1\n② 보기2\n③ 보기3\n④ 보기4", "정답: 1", "암기 메모", "필기, 4지선다", "true"]
      ];
      download("exam_questions_template.csv", toCsv(rows));
    }

    function setupTextTools(root = document) {
      root.querySelectorAll("[data-tools-for], [data-tools-for-quick]").forEach(toolbox => {
        if (toolbox.dataset.toolsReady === "true") return;
        const textarea = toolbox.dataset.toolsFor
          ? document.querySelector(`#${toolbox.dataset.toolsFor}`)
          : toolbox.closest("[data-quick-form]")?.querySelector(`[data-quick-field="${toolbox.dataset.toolsForQuick}"]`);
        if (!textarea) return;
        toolbox.dataset.toolsReady = "true";
        toolbox.innerHTML = `
          <button class="symbol-toggle" type="button" aria-expanded="false">특수기호</button>
          <div class="symbol-tools" aria-label="특수기호 입력">
            ${WRITING_SYMBOLS.map(symbol => `<button class="symbol-tool" type="button" data-symbol="${escapeHtml(symbol)}" title="${escapeHtml(symbolTitle(symbol))}">${escapeHtml(symbol)}</button>`).join("")}
          </div>
        `;
        const toggle = toolbox.querySelector(".symbol-toggle");
        toggle.addEventListener("click", () => {
          const willOpen = !toolbox.classList.contains("open");
          toolbox.classList.toggle("open", willOpen);
          toggle.setAttribute("aria-expanded", String(willOpen));
        });
        toolbox.querySelectorAll("[data-symbol]").forEach(button => {
          button.addEventListener("click", () => insertAtCursor(textarea, button.dataset.symbol));
        });
      });
    }

    function handleCircledNumberShortcut(event) {
      if (!event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return false;
      const symbol = CIRCLED_NUMBER_SHORTCUTS.get(event.key);
      const textarea = document.activeElement;
      if (!symbol || !(textarea instanceof HTMLTextAreaElement)) return false;
      event.preventDefault();
      insertAtCursor(textarea, symbol);
      return true;
    }

    function symbolTitle(symbol) {
      const shortcut = [...CIRCLED_NUMBER_SHORTCUTS.entries()].find(([, value]) => value === symbol);
      return shortcut ? `${symbol} (Alt+${shortcut[0]})` : symbol;
    }

    function openTableEditor(textarea) {
      if (!(textarea instanceof HTMLTextAreaElement)) return;
      const start = textarea.selectionStart ?? textarea.value.length;
      const end = textarea.selectionEnd ?? start;
      const selected = textarea.value.slice(start, end);
      const parsed = parseMarkdownTable(selected);
      tableEditorState = {
        textarea,
        start,
        end,
        data: parsed?.length ? parsed : defaultTableData(3, 3)
      };
      renderTableEditor();
      els.tableEditorBackdrop.classList.remove("hidden");
      requestAnimationFrame(() => els.tableEditorGrid.querySelector("input")?.focus());
    }

    function closeTableEditor() {
      tableEditorState = null;
      els.tableEditorBackdrop.classList.add("hidden");
    }

    function renderTableEditor() {
      const data = tableEditorState?.data?.length ? tableEditorState.data : defaultTableData(3, 3);
      els.tableRowsInput.value = data.length;
      els.tableColsInput.value = data[0]?.length || 1;
      els.tableEditorGrid.innerHTML = data.map((row, rowIndex) => {
        const cells = row.map((cell, colIndex) => {
          const tag = rowIndex === 0 ? "th" : "td";
          return `<${tag}><input data-table-cell="${rowIndex}:${colIndex}" value="${escapeHtml(cell)}" aria-label="${rowIndex + 1}행 ${colIndex + 1}열"></${tag}>`;
        }).join("");
        return `<tr>${cells}</tr>`;
      }).join("");
    }

    function tableEditorData() {
      if (!tableEditorState) return defaultTableData(3, 3);
      const rows = clampNumber(els.tableRowsInput.value, 2, 12, tableEditorState.data.length || 3);
      const cols = clampNumber(els.tableColsInput.value, 1, 8, tableEditorState.data[0]?.length || 3);
      const data = defaultTableData(rows, cols, "");
      els.tableEditorGrid.querySelectorAll("[data-table-cell]").forEach(input => {
        const [row, col] = input.dataset.tableCell.split(":").map(Number);
        if (data[row]) data[row][col] = input.value;
      });
      return data;
    }

    function applyTableEditorSize() {
      resizeTableEditor(
        clampNumber(els.tableRowsInput.value, 2, 12, 3),
        clampNumber(els.tableColsInput.value, 1, 8, 3)
      );
    }

    function resizeTableEditor(rows, cols) {
      if (!tableEditorState) return;
      const current = tableEditorData();
      const next = defaultTableData(clampNumber(rows, 2, 12, 3), clampNumber(cols, 1, 8, 3), "");
      next.forEach((row, rowIndex) => {
        row.forEach((_, colIndex) => {
          next[rowIndex][colIndex] = current[rowIndex]?.[colIndex] ?? defaultTableCell(rowIndex, colIndex);
        });
      });
      tableEditorState.data = next;
      renderTableEditor();
    }

    function insertTableFromEditor() {
      if (!tableEditorState) return;
      const data = tableEditorData();
      const markdown = tableDataToMarkdown(data);
      const { textarea, start, end } = tableEditorState;
      const before = textarea.value.slice(0, start);
      const after = textarea.value.slice(end);
      const insertText = needsLeadingLineBreak(before, markdown) ? `\n${markdown}` : markdown;
      textarea.value = `${before}${insertText}${after}`;
      const cursor = before.length + insertText.length;
      closeTableEditor();
      textarea.focus();
      textarea.setSelectionRange(cursor, cursor);
      textarea.dispatchEvent(new Event("input", { bubbles: true }));
      if (textarea === els.theoryContentInput) updateTheoryPreview();
      updateQuestionDiagnostics();
    }

    function defaultTableData(rows, cols, fill = null) {
      return Array.from({ length: rows }, (_, rowIndex) => {
        return Array.from({ length: cols }, (_, colIndex) => {
          return fill === null ? defaultTableCell(rowIndex, colIndex) : fill;
        });
      });
    }

    function defaultTableCell(rowIndex, colIndex) {
      return rowIndex === 0 ? `항목 ${colIndex + 1}` : "내용";
    }

    function parseMarkdownTable(text) {
      const lines = String(text || "").split("\n").map(line => line.trim()).filter(Boolean);
      if (lines.length < 2 || !isMarkdownTable(lines.join("\n"))) return null;
      return lines
        .filter((_, index) => index !== 1)
        .map(splitTableRow)
        .filter(row => row.length);
    }

    function tableDataToMarkdown(data) {
      const normalized = normalizeTableData(data);
      const header = normalized[0];
      const separator = header.map(() => "---");
      const body = normalized.slice(1);
      return [
        "",
        `| ${header.map(escapeMarkdownTableCell).join(" | ")} |`,
        `| ${separator.join(" | ")} |`,
        ...body.map(row => `| ${row.map(escapeMarkdownTableCell).join(" | ")} |`),
        ""
      ].join("\n");
    }

    function normalizeTableData(data) {
      const rows = data.length;
      const cols = Math.max(1, ...data.map(row => row.length));
      return Array.from({ length: Math.max(2, rows) }, (_, rowIndex) => {
        return Array.from({ length: cols }, (_, colIndex) => {
          return String(data[rowIndex]?.[colIndex] || "").trim() || defaultTableCell(rowIndex, colIndex);
        });
      });
    }

    function escapeMarkdownTableCell(value) {
      return String(value || "").replace(/\|/g, "\\|").replace(/\n/g, " ").trim();
    }

    function insertAtCursor(textarea, text) {
      const start = textarea.selectionStart ?? textarea.value.length;
      const end = textarea.selectionEnd ?? textarea.value.length;
      const before = textarea.value.slice(0, start);
      const after = textarea.value.slice(end);
      const insertText = needsLeadingLineBreak(before, text) ? `\n${text}` : text;
      textarea.value = `${before}${insertText}${after}`;
      const cursor = before.length + insertText.length;
      textarea.focus();
      textarea.setSelectionRange(cursor, cursor);
      textarea.dispatchEvent(new Event("input", { bubbles: true }));
    }

    function needsLeadingLineBreak(before, text) {
      return text.startsWith("\n") && before && !before.endsWith("\n");
    }

    function buildMarkdownTable(rows, cols) {
      const headers = Array.from({ length: cols }, (_, index) => `항목 ${index + 1}`);
      const separator = Array.from({ length: cols }, () => "---");
      const body = Array.from({ length: rows - 1 }, () => Array.from({ length: cols }, () => "내용"));
      return [
        "",
        `| ${headers.join(" | ")} |`,
        `| ${separator.join(" | ")} |`,
        ...body.map(row => `| ${row.join(" | ")} |`),
        ""
      ].join("\n");
    }

    function clampNumber(value, min, max, fallback) {
      const parsed = Number(value);
      if (!Number.isFinite(parsed)) return fallback;
      return Math.min(max, Math.max(min, Math.round(parsed)));
    }

    function download(filename, content) {
      const blob = new Blob(["\ufeff" + content], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    }

    function parseCsv(text) {
      const rows = [];
      let row = [];
      let cell = "";
      let quote = false;
      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const next = text[i + 1];
        if (char === '"' && quote && next === '"') {
          cell += '"';
          i++;
        } else if (char === '"') {
          quote = !quote;
        } else if (char === "," && !quote) {
          row.push(cell);
          cell = "";
        } else if ((char === "\n" || char === "\r") && !quote) {
          if (char === "\r" && next === "\n") i++;
          row.push(cell);
          rows.push(row);
          row = [];
          cell = "";
        } else {
          cell += char;
        }
      }
      row.push(cell);
      rows.push(row);
      return rows;
    }

    function toCsv(rows) {
      return rows.map(row => row.map(cell => {
        const value = String(cell ?? "");
        return /[",\n\r]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
      }).join(",")).join("\n");
    }

    function escapeHtml(value) {
      return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[char]));
    }

    function initMusicLibrary() {
      musicTracks = loadMusicLinks();
      const savedIndex = Number.parseInt(localStorage.getItem(`${MUSIC_LINKS_KEY}.index`) || "0", 10);
      currentMusicIndex = musicTracks.length ? Math.min(Math.max(savedIndex, 0), musicTracks.length - 1) : -1;
      renderMusicList();
      if (currentMusicIndex >= 0) loadMusicTrack(currentMusicIndex, false);
      else updateEmptyMusicState();
    }

    function loadMusicLinks() {
      try {
        const saved = JSON.parse(localStorage.getItem(MUSIC_LINKS_KEY));
        if (!Array.isArray(saved)) return [];
        return saved.filter(track => track && track.embedUrl && track.watchUrl && track.title);
      } catch (error) {
        console.warn(error);
        return [];
      }
    }

    function saveMusicLinks() {
      localStorage.setItem(MUSIC_LINKS_KEY, JSON.stringify(musicTracks));
      localStorage.setItem(`${MUSIC_LINKS_KEY}.index`, String(Math.max(currentMusicIndex, 0)));
    }

    function parseYoutubeLink(rawUrl) {
      let url;
      try {
        url = new URL(rawUrl.trim());
      } catch (error) {
        return null;
      }
      const host = url.hostname.replace(/^www\./, "");
      const isYoutube = host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com" || host === "youtu.be";
      if (!isYoutube) return null;

      const list = url.searchParams.get("list");
      let videoId = "";
      if (host === "youtu.be") {
        videoId = url.pathname.split("/").filter(Boolean)[0] || "";
      } else if (url.pathname === "/watch") {
        videoId = url.searchParams.get("v") || "";
      } else {
        const parts = url.pathname.split("/").filter(Boolean);
        if (["embed", "shorts", "live"].includes(parts[0])) videoId = parts[1] || "";
      }

      const cleanVideoId = /^[\w-]{6,}$/.test(videoId) ? videoId : "";
      const cleanList = list && /^[\w-]+$/.test(list) ? list : "";
      if (!cleanVideoId && !cleanList) return null;

      const embedParams = new URLSearchParams();
      embedParams.set("rel", "0");
      embedParams.set("modestbranding", "1");
      if (cleanList && !cleanVideoId) {
        embedParams.set("listType", "playlist");
        embedParams.set("list", cleanList);
        return {
          embedUrl: `https://www.youtube.com/embed/videoseries?${embedParams.toString()}`,
          watchUrl: `https://www.youtube.com/playlist?list=${encodeURIComponent(cleanList)}`,
          type: "재생목록"
        };
      }
      if (cleanList) embedParams.set("list", cleanList);
      return {
        embedUrl: `https://www.youtube.com/embed/${cleanVideoId}?${embedParams.toString()}`,
        watchUrl: `https://www.youtube.com/watch?v=${encodeURIComponent(cleanVideoId)}${cleanList ? `&list=${encodeURIComponent(cleanList)}` : ""}`,
        type: cleanList ? "영상 + 재생목록" : "영상"
      };
    }

    function addMusicLink(event) {
      event.preventDefault();
      const parsed = parseYoutubeLink(els.musicUrlInput.value);
      const title = els.musicTitleInput.value.trim();
      if (!parsed) {
        els.musicStatus.textContent = "YouTube 영상 또는 재생목록 링크를 붙여넣어 주세요.";
        return;
      }
      const duplicateIndex = musicTracks.findIndex(track => track.watchUrl === parsed.watchUrl);
      if (duplicateIndex >= 0) {
        if (title) musicTracks[duplicateIndex].title = title;
        currentMusicIndex = duplicateIndex;
        loadMusicTrack(currentMusicIndex, true);
        renderMusicList();
        els.musicTitleInput.value = "";
        els.musicUrlInput.value = "";
        els.musicStatus.textContent = title ? "이미 추가된 링크의 이름을 바꾸고 재생합니다." : "이미 추가된 링크를 재생합니다.";
        saveMusicLinks();
        return;
      }
      const track = {
        id: `yt-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        title: title || `지브리 음악 ${musicTracks.length + 1}`,
        type: parsed.type,
        embedUrl: parsed.embedUrl,
        watchUrl: parsed.watchUrl
      };
      musicTracks.push(track);
      currentMusicIndex = musicTracks.length - 1;
      els.musicTitleInput.value = "";
      els.musicUrlInput.value = "";
      saveMusicLinks();
      renderMusicList();
      loadMusicTrack(currentMusicIndex, true);
      els.musicStatus.textContent = "링크를 추가했습니다. 영상에서 재생 버튼을 눌러 음악을 시작하세요.";
    }

    function loadMusicTrack(index, autoplay) {
      if (!musicTracks.length) {
        updateEmptyMusicState();
        return;
      }
      currentMusicIndex = (index + musicTracks.length) % musicTracks.length;
      const track = musicTracks[currentMusicIndex];
      const url = new URL(track.embedUrl);
      if (autoplay) url.searchParams.set("autoplay", "1");
      els.studyMusicFrame.src = url.toString();
      els.musicNowTitle.textContent = track.title;
      els.musicNowMeta.textContent = `YouTube ${track.type}`;
      els.musicStatus.textContent = "공부 화면으로 이동해도 현재 플레이어는 계속 유지됩니다.";
      saveMusicLinks();
      renderMusicList();
    }

    function renderMusicList() {
      if (!musicTracks.length) {
        els.musicList.innerHTML = `<div class="empty">YouTube 링크를 추가하면 여기에 목록이 표시됩니다.</div>`;
        return;
      }
      els.musicList.innerHTML = musicTracks.map((track, index) => `
        <article class="music-track${index === currentMusicIndex ? " active" : ""}">
          <div>
            <div class="music-track-title">${escapeHtml(track.title)}</div>
            <div class="music-track-meta">${escapeHtml(track.type)} · ${escapeHtml(track.watchUrl)}</div>
          </div>
          <div class="music-track-actions">
            <button type="button" data-music-play="${index}">열기</button>
            <button type="button" data-music-rename="${index}">이름</button>
            <button type="button" data-music-remove="${index}">삭제</button>
          </div>
        </article>
      `).join("");
      els.musicList.querySelectorAll("[data-music-play]").forEach(button => {
        button.addEventListener("click", () => loadMusicTrack(Number(button.dataset.musicPlay), true));
      });
      els.musicList.querySelectorAll("[data-music-rename]").forEach(button => {
        button.addEventListener("click", () => renameMusicTrack(Number(button.dataset.musicRename)));
      });
      els.musicList.querySelectorAll("[data-music-remove]").forEach(button => {
        button.addEventListener("click", () => removeMusicTrack(Number(button.dataset.musicRemove)));
      });
    }

    function updateEmptyMusicState() {
      currentMusicIndex = -1;
      els.studyMusicFrame.removeAttribute("src");
      els.musicNowTitle.textContent = "공부 음악";
      els.musicNowMeta.textContent = "YouTube 링크를 추가하면 앱 안에서 재생됩니다.";
      els.musicStatus.textContent = "지브리 음악 YouTube 링크를 붙여넣어 목록을 만들어보세요.";
      renderMusicList();
    }

    function playPreviousMusic() {
      if (!musicTracks.length) return;
      loadMusicTrack(currentMusicIndex - 1, true);
    }

    function playNextMusic() {
      if (!musicTracks.length) return;
      loadMusicTrack(currentMusicIndex + 1, true);
    }

    function openCurrentMusicOnYoutube() {
      const track = musicTracks[currentMusicIndex];
      if (!track) {
        els.musicStatus.textContent = "먼저 YouTube 링크를 추가해 주세요.";
        return;
      }
      window.open(track.watchUrl, "_blank", "noopener,noreferrer");
    }

    function renameMusicTrack(index) {
      const track = musicTracks[index];
      if (!track) return;
      const nextTitle = prompt("저장 이름을 입력하세요.", track.title);
      if (nextTitle === null) return;
      const cleanTitle = nextTitle.trim();
      if (!cleanTitle) {
        els.musicStatus.textContent = "이름은 비워둘 수 없습니다.";
        return;
      }
      track.title = cleanTitle;
      saveMusicLinks();
      renderMusicList();
      if (index === currentMusicIndex) {
        els.musicNowTitle.textContent = cleanTitle;
      }
      els.musicStatus.textContent = "저장 이름을 바꿨습니다.";
    }

    function removeMusicTrack(index) {
      if (index < 0 || index >= musicTracks.length) return;
      musicTracks.splice(index, 1);
      if (!musicTracks.length) {
        saveMusicLinks();
        updateEmptyMusicState();
        return;
      }
      currentMusicIndex = Math.min(currentMusicIndex, musicTracks.length - 1);
      saveMusicLinks();
      loadMusicTrack(currentMusicIndex, false);
    }

    function clearMusicLibrary() {
      if (!musicTracks.length) return;
      if (!confirm("저장된 YouTube 음악 링크를 모두 지울까요?")) return;
      musicTracks = [];
      saveMusicLinks();
      updateEmptyMusicState();
    }

    function setupPwa() {
      if ("serviceWorker" in navigator && location.protocol !== "file:") {
        navigator.serviceWorker.register("./sw.js").catch(error => console.warn("Service worker registration failed", error));
      }

      updateInstallUi(false, getInstallHelpText());

      window.addEventListener("beforeinstallprompt", event => {
        event.preventDefault();
        deferredInstallPrompt = event;
        updateInstallUi(true, "이 기기에 앱처럼 설치할 수 있습니다.");
        els.installBtn.classList.remove("hidden");
      });

      window.addEventListener("appinstalled", () => {
        deferredInstallPrompt = null;
        updateInstallUi(false, "앱 설치가 완료되었습니다.");
        els.installBtn.classList.add("hidden");
      });
    }

    function updateInstallUi(canInstall, message) {
      els.installSettingsBtn.textContent = canInstall ? "앱 설치" : "설치 방법 확인";
      els.installStatus.textContent = message;
      if (canInstall) {
        els.installGuide.classList.add("hidden");
        els.installGuide.replaceChildren();
      }
    }

    function getInstallHelpText() {
      const standalone = window.matchMedia?.("(display-mode: standalone)").matches || navigator.standalone === true;
      if (standalone) return "이미 앱처럼 실행 중입니다.";
      const isAppleMobile = /iphone|ipad|ipod/i.test(navigator.userAgent);
      if (isAppleMobile) return "iPhone/iPad는 Safari 공유 버튼에서 '홈 화면에 추가'를 선택해 설치하세요.";
      if (location.protocol === "file:") return "설치 기능은 로컬 파일 열기보다 http:// 또는 https:// 주소에서 사용할 수 있습니다.";
      return "브라우저가 설치 조건을 확인하면 버튼이 활성화됩니다. 주소창의 설치 아이콘을 사용할 수도 있습니다.";
    }

    function getInstallGuideHtml() {
      const standalone = window.matchMedia?.("(display-mode: standalone)").matches || navigator.standalone === true;
      if (standalone) {
        return `
          <strong>이미 설치된 앱으로 실행 중입니다.</strong>
          <p>홈 화면이나 앱 목록에서 바로 열면 같은 설치 앱으로 사용할 수 있습니다.</p>
        `;
      }
      const userAgent = navigator.userAgent.toLowerCase();
      const isAppleMobile = /iphone|ipad|ipod/.test(userAgent);
      const isAndroid = /android/.test(userAgent);
      const isEdge = /edg\//.test(userAgent);
      const isChrome = /chrome|crios/.test(userAgent) && !isEdge;
      if (isAppleMobile) {
        return `
          <strong>iPhone/iPad 설치 방법</strong>
          <ol>
            <li>Safari에서 이 페이지를 엽니다.</li>
            <li>하단 공유 버튼을 누릅니다.</li>
            <li>'홈 화면에 추가'를 선택합니다.</li>
            <li>추가를 누르면 홈 화면에서 앱처럼 실행됩니다.</li>
          </ol>
        `;
      }
      if (isAndroid) {
        return `
          <strong>Android 설치 방법</strong>
          <ol>
            <li>Chrome에서 이 페이지를 엽니다.</li>
            <li>주소창 오른쪽의 설치 아이콘이 보이면 누릅니다.</li>
            <li>아이콘이 없으면 Chrome 메뉴에서 '홈 화면에 추가' 또는 '앱 설치'를 선택합니다.</li>
          </ol>
        `;
      }
      if (isEdge) {
        return `
          <strong>Microsoft Edge 설치 방법</strong>
          <ol>
            <li>주소창 오른쪽의 앱 설치 아이콘을 확인합니다.</li>
            <li>아이콘이 없으면 메뉴에서 '앱'을 열고 '이 사이트를 앱으로 설치'를 선택합니다.</li>
            <li>설치가 보이지 않으면 페이지를 새로고침한 뒤 다시 확인합니다.</li>
          </ol>
        `;
      }
      if (isChrome) {
        return `
          <strong>Chrome 설치 방법</strong>
          <ol>
            <li>주소창 오른쪽의 설치 아이콘을 확인합니다.</li>
            <li>아이콘이 없으면 Chrome 메뉴에서 '저장 및 공유'를 열고 '페이지를 앱으로 설치'를 선택합니다.</li>
            <li>설치 메뉴가 안 보이면 잠시 뒤 새로고침하거나 캐시 초기화 페이지를 한 번 열어보세요.</li>
          </ol>
        `;
      }
      return `
        <strong>설치 방법</strong>
        <ol>
          <li>브라우저 주소창 또는 메뉴에서 '앱 설치', '홈 화면에 추가', '이 사이트를 앱으로 설치' 항목을 찾습니다.</li>
          <li>설치 메뉴가 보이지 않으면 Chrome, Edge, Safari 같은 PWA 지원 브라우저에서 다시 열어보세요.</li>
          <li>이미 설치된 경우에는 버튼 대신 브라우저 메뉴나 앱 목록에서 실행할 수 있습니다.</li>
        </ol>
      `;
    }

    function showInstallGuide() {
      els.installGuide.innerHTML = getInstallGuideHtml();
      els.installGuide.classList.remove("hidden");
      els.installStatus.textContent = "아래 안내에 따라 브라우저 메뉴에서 설치를 진행하세요.";
      els.installSettingsBtn.textContent = "설치 안내 보기";
    }

    async function installApp() {
      if (!deferredInstallPrompt) {
        showInstallGuide();
        return;
      }
      deferredInstallPrompt.prompt();
      const choice = await deferredInstallPrompt.userChoice;
      deferredInstallPrompt = null;
      updateInstallUi(false, choice.outcome === "accepted" ? "앱 설치가 시작되었습니다." : getInstallHelpText());
      els.installBtn.classList.add("hidden");
    }
