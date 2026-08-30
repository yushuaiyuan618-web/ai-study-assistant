const chatForm = document.querySelector("#chatForm");
const messageInput = document.querySelector("#messageInput");
const messageList = document.querySelector("#messageList");
const welcomeSection = document.querySelector("#welcomeSection");
const chatArea = document.querySelector("#chatArea");
const chatInputArea = document.querySelector("#chatInputArea");
const sendButton = document.querySelector(".send-button");
const languageButtons = document.querySelectorAll("[data-language]");
const viewButtons = document.querySelectorAll("[data-view]");
const explainView = document.querySelector("#explainView");
const explainForm = document.querySelector("#explainForm");
const explainTopic = document.querySelector("#explainTopic");
const explainStyleButtons = document.querySelectorAll("[data-explain-style]");
const explainSubmitButton = document.querySelector(".explain-submit-button");
const explainResult = document.querySelector("#explainResult");
const explainOutput = document.querySelector("#explainOutput");
const quizView = document.querySelector("#quizView");
const quizSetupState = document.querySelector("#quizSetupState");
const quizSetupForm = document.querySelector("#quizSetupForm");
const quizTopic = document.querySelector("#quizTopic");
const quizDifficultyButtons = document.querySelectorAll("[data-quiz-difficulty]");
const quizGenerateButton = document.querySelector(".quiz-generate-button");
const quizSetupMessage = document.querySelector("#quizSetupMessage");
const quizQuestionsState = document.querySelector("#quizQuestionsState");
const quizTopicDisplay = document.querySelector("#quizTopicDisplay");
const quizDifficultyDisplay = document.querySelector("#quizDifficultyDisplay");
const quizAnswerForm = document.querySelector("#quizAnswerForm");
const quizQuestionList = document.querySelector("#quizQuestionList");
const quizAnswerMessage = document.querySelector("#quizAnswerMessage");
const quizSubmitButton = document.querySelector(".quiz-submit-button");
const quizResultsState = document.querySelector("#quizResultsState");
const quizScoreDisplay = document.querySelector("#quizScoreDisplay");
const quizResultList = document.querySelector("#quizResultList");
const quizNewButton = document.querySelector("#quizNewButton");
const studyPlanView = document.querySelector("#studyPlanView");
const studyPlanSetupState = document.querySelector("#studyPlanSetupState");
const studyPlanForm = document.querySelector("#studyPlanForm");
const studyPlanGoal = document.querySelector("#studyPlanGoal");
const studyLevelButtons = document.querySelectorAll("[data-study-level]");
const studyPlanDailyMinutes = document.querySelector("#studyPlanDailyMinutes");
const studyDurationButtons = document.querySelectorAll("[data-study-duration]");
const studyPlanGenerateButton = document.querySelector(".study-plan-generate-button");
const studyPlanMessage = document.querySelector("#studyPlanMessage");
const studyPlanResultState = document.querySelector("#studyPlanResultState");
const studyPlanTitle = document.querySelector("#studyPlanTitle");
const studyPlanOverview = document.querySelector("#studyPlanOverview");
const studyPlanLevelDisplay = document.querySelector("#studyPlanLevelDisplay");
const studyPlanTimeDisplay = document.querySelector("#studyPlanTimeDisplay");
const studyPlanDurationDisplay = document.querySelector("#studyPlanDurationDisplay");
const studyPlanDayList = document.querySelector("#studyPlanDayList");
const studyPlanNewButton = document.querySelector("#studyPlanNewButton");
const documentsView = document.querySelector("#documentsView");
const documentUploadForm = document.querySelector("#documentUploadForm");
const documentInput = document.querySelector("#documentInput");
const documentUploadButton = document.querySelector(".document-upload-button");
const documentMessage = document.querySelector("#documentMessage");
const documentListSection = document.querySelector("#documentListSection");
const documentList = document.querySelector("#documentList");
const documentAskForm = document.querySelector("#documentAskForm");
const documentQuestion = document.querySelector("#documentQuestion");
const documentAskButton = document.querySelector(".document-ask-button");
const documentAskMessage = document.querySelector("#documentAskMessage");
const documentAnswer = document.querySelector("#documentAnswer");
const documentAnswerOutput = document.querySelector("#documentAnswerOutput");
const documentSources = document.querySelector("#documentSources");
const documentSourceList = document.querySelector("#documentSourceList");

const translations = {
    en: {
        pageTitle: "AI Study Assistant",
        appName: "AI Study Assistant",
        mainNavigation: "Main navigation",
        aiChat: "AI Chat",
        explain: "Explain",
        quiz: "Quiz",
        studyPlan: "Study Plan",
        documents: "Documents",
        sidebarFooter: "AI-powered personalized learning",
        subtitle: "Learn smarter with your personal AI tutor.",
        languageSelection: "Language selection",
        chatMessages: "Chat messages",
        welcomeTitle: "How can I help you learn today?",
        explainConcept: "Explain a concept",
        explainPrompt: "Explain gradient descent in simple terms",
        quizPractice: "Practice with a quiz",
        quizPrompt: "Create a Python quiz for me",
        makeStudyPlan: "Make a study plan",
        studyPlanPrompt: "Create a 7-day machine learning study plan",
        askNotes: "Ask about my notes",
        notesPrompt: "Help me understand my study materials",
        explainViewTitle: "Explain a Concept",
        explainViewSubtitle: "Turn difficult ideas into clear explanations.",
        explainTopicLabel: "Topic or question",
        explainTopicPlaceholder: "Enter a concept, topic, or question...",
        explainStyleLabel: "Explanation style",
        explainStyleSimple: "Simple",
        explainStyleDetailed: "Detailed",
        explainStyleExample: "With Example",
        explainSubmit: "Explain",
        explaining: "Explaining...",
        explainError: "Unable to generate an explanation right now. Please try again.",
        quizViewTitle: "Test Your Understanding",
        quizViewSubtitle: "Generate a short AI quiz on any topic.",
        quizTopicLabel: "Topic",
        quizTopicPlaceholder: "Enter a topic to practice...",
        quizDifficultyLabel: "Difficulty",
        quizDifficultyEasy: "Easy",
        quizDifficultyMedium: "Medium",
        quizDifficultyHard: "Hard",
        quizGenerate: "Generate Quiz",
        quizGenerating: "Generating quiz...",
        quizGenerateError: "Unable to generate a quiz right now. Please try again.",
        quizQuestionsTitle: "Quiz",
        quizQuestion: "Question",
        quizQuestionSuffix: "",
        quizSubmit: "Submit Quiz",
        quizIncomplete: "Please answer all questions before submitting.",
        quizChecking: "Checking answers...",
        quizSubmitError: "Unable to check your answers right now. Please try again.",
        quizExpired: "This quiz is no longer available. Please generate a new one.",
        quizScore: "Score",
        quizCorrect: "Correct",
        quizIncorrect: "Incorrect",
        quizYourAnswer: "Your answer",
        quizCorrectAnswer: "Correct answer",
        quizExplanation: "Explanation",
        quizNew: "New Quiz",
        studyPlanViewTitle: "Build Your Study Plan",
        studyPlanViewSubtitle: "Turn your learning goal into a clear daily roadmap.",
        studyPlanGoalLabel: "Learning Goal",
        studyPlanGoalPlaceholder: "What do you want to learn or achieve?",
        studyPlanLevelLabel: "Current Level",
        studyPlanLevelBeginner: "Beginner",
        studyPlanLevelIntermediate: "Intermediate",
        studyPlanLevelAdvanced: "Advanced",
        studyPlanTimeLabel: "Daily Study Time",
        minutesShort: "min",
        studyPlanDurationLabel: "Plan Duration",
        studyPlanDurationSeven: "7 Days",
        studyPlanDurationThirty: "30 Days",
        studyPlanGenerate: "Generate Plan",
        studyPlanBuilding: "Building your plan...",
        studyPlanValidation: "Enter a learning goal and a daily study time from 15 to 480 minutes.",
        studyPlanError: "Unable to generate a study plan right now. Please try again.",
        studyPlanDay: "Day",
        studyPlanDaySuffix: "",
        studyPlanTasks: "Tasks",
        studyPlanEstimatedTime: "Estimated time",
        studyPlanDailyGoal: "Goal",
        studyPlanNew: "Create New Plan",
        documentsViewTitle: "Study Materials",
        documentsViewSubtitle: "Upload your notes or documents to prepare them for AI-powered learning.",
        documentUploadTitle: "Upload Document",
        documentSupportedTypes: "Supported: PDF, TXT, MD",
        documentChooseFile: "Choose File",
        documentSizeLimit: "Maximum file size: 10 MB",
        documentUploadAction: "Upload",
        documentUploading: "Uploading...",
        documentPreparing: "Preparing document for AI...",
        documentNoFile: "Choose a PDF, TXT, or Markdown file.",
        documentTooLarge: "File is too large. Maximum size is 10 MB.",
        documentUnsupported: "Unsupported file type. Please upload a PDF, TXT, or Markdown file.",
        documentEmpty: "The selected file is empty.",
        documentUnreadablePdf: "The PDF could not be read. Please choose a valid PDF file.",
        documentNoReadablePdf: "No readable text could be extracted from this document. Scanned PDFs are not supported yet.",
        documentInvalidEncoding: "The text file must use UTF-8 encoding.",
        documentTextTooLarge: "The extracted text is too large to process.",
        documentLimitReached: "You can keep up to 10 temporary documents.",
        documentProcessingError: "Unable to process this document right now. Please try again.",
        documentNotFound: "This document is no longer available.",
        documentListTitle: "Uploaded Documents",
        documentType: "Type",
        documentSize: "Size",
        documentPages: "Pages",
        documentCharacters: "Characters",
        documentPreview: "Text Preview",
        documentChunks: "Chunks",
        documentAiStatus: "AI Status",
        documentReady: "Ready",
        documentSelect: "Use for questions",
        documentRemove: "Remove",
        documentRemoving: "Removing...",
        documentAskTitle: "Ask Your Materials",
        documentAskDescription: "Ask a question using the selected documents as sources.",
        documentQuestionLabel: "Question about your documents",
        documentQuestionPlaceholder: "Ask a question about your documents...",
        documentAskAction: "Ask",
        documentSearching: "Searching your materials...",
        documentQuestionBlank: "Enter a question about your documents.",
        documentSelectionRequired: "Select at least one document.",
        documentEmbeddingModelMissing: "The local embedding model is not installed. Please install it and try again.",
        documentEmbeddingUnavailable: "Cannot connect to the local embedding service. Please make sure Ollama is running.",
        documentEmbeddingTimeout: "Preparing or searching the document took too long. Please try again.",
        documentNotIndexed: "This document is not ready for AI questions. Please upload it again.",
        documentSearchError: "Unable to search your documents right now. Please try again.",
        documentAnswerTitle: "Answer",
        documentSourcesTitle: "Sources",
        documentSourcePage: "page",
        documentSourceChunk: "chunk",
        inputLabel: "Study question",
        inputPlaceholder: "Ask anything about your studies...",
        send: "Send",
        inputHint: "Press Enter to send · Shift + Enter for a new line",
        you: "You",
        thinking: "Thinking...",
        aiConfigurationError: "The local AI configuration is invalid. Please check the backend settings.",
        ollamaUnavailable: "Cannot connect to Ollama. Please make sure the Ollama server is running.",
        modelNotFound: "The configured Ollama model was not found. Please install it and try again.",
        aiRequestTimeout: "The local AI request took too long. Please try again.",
        emptyAiResponse: "The AI returned an empty response after retrying. Please try again.",
        aiGenerationError: "The local AI could not generate a response. Please try again.",
        connectionError: "Unable to connect to the server. Please make sure the backend is running."
    },
    zh: {
        pageTitle: "AI 学习助手",
        appName: "AI 学习助手",
        mainNavigation: "主导航",
        aiChat: "AI 对话",
        explain: "知识讲解",
        quiz: "AI 测验",
        studyPlan: "学习计划",
        documents: "学习资料",
        sidebarFooter: "AI 驱动的个性化学习",
        subtitle: "和你的 AI 学习助手一起，更高效地学习",
        languageSelection: "语言选择",
        chatMessages: "聊天消息",
        welcomeTitle: "今天想学点什么？",
        explainConcept: "讲解一个知识点",
        explainPrompt: "用简单的方式解释梯度下降",
        quizPractice: "做一个小测验",
        quizPrompt: "给我生成一个 Python 小测验",
        makeStudyPlan: "制定学习计划",
        studyPlanPrompt: "制定一个 7 天机器学习计划",
        askNotes: "询问学习资料",
        notesPrompt: "帮我理解我的学习资料",
        explainViewTitle: "知识讲解",
        explainViewSubtitle: "把复杂的知识变得简单易懂。",
        explainTopicLabel: "知识点或问题",
        explainTopicPlaceholder: "输入你想理解的知识点或问题...",
        explainStyleLabel: "讲解方式",
        explainStyleSimple: "简单讲解",
        explainStyleDetailed: "详细讲解",
        explainStyleExample: "举例讲解",
        explainSubmit: "开始讲解",
        explaining: "正在讲解...",
        explainError: "暂时无法生成讲解，请稍后再试。",
        quizViewTitle: "测试你的理解",
        quizViewSubtitle: "针对任意知识点生成一个 AI 小测验。",
        quizTopicLabel: "知识点",
        quizTopicPlaceholder: "输入你想练习的知识点...",
        quizDifficultyLabel: "难度",
        quizDifficultyEasy: "简单",
        quizDifficultyMedium: "中等",
        quizDifficultyHard: "困难",
        quizGenerate: "生成测验",
        quizGenerating: "正在生成测验...",
        quizGenerateError: "暂时无法生成测验，请稍后再试。",
        quizQuestionsTitle: "测验",
        quizQuestion: "第",
        quizQuestionSuffix: "题",
        quizSubmit: "提交答案",
        quizIncomplete: "请完成所有题目后再提交。",
        quizChecking: "正在批改...",
        quizSubmitError: "暂时无法批改答案，请稍后再试。",
        quizExpired: "当前测验已失效，请重新生成。",
        quizScore: "得分",
        quizCorrect: "回答正确",
        quizIncorrect: "回答错误",
        quizYourAnswer: "你的答案",
        quizCorrectAnswer: "正确答案",
        quizExplanation: "讲解",
        quizNew: "重新测验",
        studyPlanViewTitle: "制定学习计划",
        studyPlanViewSubtitle: "把你的学习目标拆解成清晰的每日学习路线。",
        studyPlanGoalLabel: "学习目标",
        studyPlanGoalPlaceholder: "你想学习什么，或达到什么目标？",
        studyPlanLevelLabel: "当前水平",
        studyPlanLevelBeginner: "初学者",
        studyPlanLevelIntermediate: "有一定基础",
        studyPlanLevelAdvanced: "进阶",
        studyPlanTimeLabel: "每天学习时间",
        minutesShort: "分钟",
        studyPlanDurationLabel: "计划时长",
        studyPlanDurationSeven: "7 天",
        studyPlanDurationThirty: "30 天",
        studyPlanGenerate: "生成计划",
        studyPlanBuilding: "正在生成学习计划...",
        studyPlanValidation: "请输入学习目标，并将每天学习时间设置为 15 到 480 分钟。",
        studyPlanError: "暂时无法生成学习计划，请稍后再试。",
        studyPlanDay: "第",
        studyPlanDaySuffix: "天",
        studyPlanTasks: "任务",
        studyPlanEstimatedTime: "预计时间",
        studyPlanDailyGoal: "目标",
        studyPlanNew: "重新制定计划",
        documentsViewTitle: "学习资料",
        documentsViewSubtitle: "上传你的笔记或资料，为后续 AI 学习功能做好准备。",
        documentUploadTitle: "上传学习资料",
        documentSupportedTypes: "支持：PDF、TXT、MD",
        documentChooseFile: "选择文件",
        documentSizeLimit: "最大文件大小：10 MB",
        documentUploadAction: "上传",
        documentUploading: "正在上传...",
        documentPreparing: "正在为 AI 准备资料...",
        documentNoFile: "请选择 PDF、TXT 或 Markdown 文件。",
        documentTooLarge: "文件过大，最大支持 10 MB。",
        documentUnsupported: "不支持该文件类型，请上传 PDF、TXT 或 Markdown 文件。",
        documentEmpty: "所选文件为空。",
        documentUnreadablePdf: "无法读取该 PDF，请选择有效的 PDF 文件。",
        documentNoReadablePdf: "无法从该文档中提取可读文本，目前暂不支持扫描版 PDF。",
        documentInvalidEncoding: "文本文件必须使用 UTF-8 编码。",
        documentTextTooLarge: "提取的文本过大，暂时无法处理。",
        documentLimitReached: "最多可暂存 10 份学习资料。",
        documentProcessingError: "暂时无法处理该文档，请稍后再试。",
        documentNotFound: "该文档已不存在。",
        documentListTitle: "已上传资料",
        documentType: "类型",
        documentSize: "大小",
        documentPages: "页数",
        documentCharacters: "字符数",
        documentPreview: "文本预览",
        documentChunks: "分块数",
        documentAiStatus: "AI 状态",
        documentReady: "已就绪",
        documentSelect: "用于提问",
        documentRemove: "移除",
        documentRemoving: "正在移除...",
        documentAskTitle: "询问学习资料",
        documentAskDescription: "基于你选择的学习资料进行提问。",
        documentQuestionLabel: "针对学习资料的问题",
        documentQuestionPlaceholder: "针对你的学习资料提问...",
        documentAskAction: "提问",
        documentSearching: "正在检索学习资料...",
        documentQuestionBlank: "请输入针对学习资料的问题。",
        documentSelectionRequired: "请至少选择一份学习资料。",
        documentEmbeddingModelMissing: "本地嵌入模型尚未安装，请安装后重试。",
        documentEmbeddingUnavailable: "无法连接本地嵌入服务，请确认 Ollama 已启动。",
        documentEmbeddingTimeout: "资料准备或检索超时，请重试。",
        documentNotIndexed: "该资料尚未准备好用于 AI 提问，请重新上传。",
        documentSearchError: "暂时无法检索学习资料，请稍后再试。",
        documentAnswerTitle: "回答",
        documentSourcesTitle: "来源",
        documentSourcePage: "第 {number} 页",
        documentSourceChunk: "第 {number} 段",
        inputLabel: "学习问题",
        inputPlaceholder: "输入你的学习问题...",
        send: "发送",
        inputHint: "按 Enter 发送 · 按 Shift + Enter 换行",
        you: "你",
        thinking: "正在思考...",
        aiConfigurationError: "本地 AI 配置无效，请检查后端设置。",
        ollamaUnavailable: "无法连接到 Ollama，请确认 Ollama 服务已经启动。",
        modelNotFound: "未找到配置的 Ollama 模型，请先安装模型后重试。",
        aiRequestTimeout: "本地 AI 响应超时，请重试。",
        emptyAiResponse: "AI 重试后仍返回空内容，请重试。",
        aiGenerationError: "本地 AI 无法生成回复，请重试。",
        connectionError: "无法连接到服务器，请确认后端已经启动。"
    }
};

const errorTranslationKeyByCode = {
    ai_configuration_error: "aiConfigurationError",
    ollama_unavailable: "ollamaUnavailable",
    model_not_found: "modelNotFound",
    ai_request_timeout: "aiRequestTimeout",
    empty_ai_response: "emptyAiResponse",
    ai_generation_error: "aiGenerationError"
};

const documentErrorTranslationKeyByCode = {
    unsupported_file_type: "documentUnsupported",
    file_too_large: "documentTooLarge",
    empty_file: "documentEmpty",
    unreadable_pdf: "documentUnreadablePdf",
    no_readable_pdf_text: "documentNoReadablePdf",
    invalid_text_encoding: "documentInvalidEncoding",
    extracted_text_too_large: "documentTextTooLarge",
    document_limit_reached: "documentLimitReached",
    document_not_found: "documentNotFound",
    document_processing_error: "documentProcessingError",
    embedding_model_not_found: "documentEmbeddingModelMissing",
    embedding_service_unavailable: "documentEmbeddingUnavailable",
    embedding_request_timeout: "documentEmbeddingTimeout",
    document_indexing_error: "documentSearchError",
    document_not_indexed: "documentNotIndexed",
    document_search_error: "documentSearchError",
    document_question_empty: "documentQuestionBlank"
};

const DOCUMENT_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const DOCUMENT_MAX_COUNT = 10;
const SUPPORTED_DOCUMENT_EXTENSIONS = ["pdf", "txt", "md"];

const savedLanguage = localStorage.getItem("studyAssistantLanguage");
let currentLanguage = savedLanguage === "zh" ? "zh" : "en";
let isSending = false;
let isExplaining = false;
let selectedExplainStyle = "simple";
let isGeneratingQuiz = false;
let isSubmittingQuiz = false;
let selectedQuizDifficulty = "medium";
let currentQuiz = null;
let isGeneratingStudyPlan = false;
let selectedStudyLevel = "beginner";
let selectedStudyDuration = 7;
let currentStudyPlan = null;
let isUploadingDocument = false;
let isAskingDocuments = false;
let currentDocumentAnswer = null;
const uploadedDocuments = [];
const selectedDocumentIds = new Set();
const conversationHistory = [];

function applyLanguage(language) {
    const selectedTranslations = translations[language];

    currentLanguage = language;
    document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
    document.title = selectedTranslations.pageTitle;

    document.querySelectorAll("[data-i18n]").forEach((element) => {
        element.textContent = selectedTranslations[element.dataset.i18n];
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
        element.placeholder = selectedTranslations[element.dataset.i18nPlaceholder];
    });

    document.querySelectorAll("[data-i18n-aria-label]").forEach((element) => {
        element.setAttribute("aria-label", selectedTranslations[element.dataset.i18nAriaLabel]);
    });

    languageButtons.forEach((button) => {
        const isActive = button.dataset.language === language;
        button.classList.toggle("active", isActive);
        button.setAttribute("aria-pressed", isActive);
    });

    updateQuizLocalizedText();
    updateStudyPlanLocalizedText();
    updateDocumentLocalizedText();

    localStorage.setItem("studyAssistantLanguage", language);
}

function formatQuizQuestionNumber(number) {
    const prefix = translations[currentLanguage].quizQuestion;
    const suffix = translations[currentLanguage].quizQuestionSuffix;
    return `${prefix} ${number}${suffix ? ` ${suffix}` : ""}`;
}

function updateQuizLocalizedText() {
    document.querySelectorAll("[data-quiz-question-number]").forEach((element) => {
        element.textContent = formatQuizQuestionNumber(element.dataset.quizQuestionNumber);
    });

    if (currentQuiz) {
        const difficultyKey = `quizDifficulty${
            currentQuiz.difficulty[0].toUpperCase() + currentQuiz.difficulty.slice(1)
        }`;
        quizDifficultyDisplay.textContent = translations[currentLanguage][difficultyKey];
    }
}

function formatStudyPlanDayNumber(number) {
    const prefix = translations[currentLanguage].studyPlanDay;
    const suffix = translations[currentLanguage].studyPlanDaySuffix;
    return `${prefix} ${number}${suffix ? ` ${suffix}` : ""}`;
}

function updateStudyPlanLocalizedText() {
    document.querySelectorAll("[data-study-day-number]").forEach((element) => {
        element.textContent = formatStudyPlanDayNumber(element.dataset.studyDayNumber);
    });

    document.querySelectorAll("[data-study-minutes]").forEach((element) => {
        element.textContent =
            `: ${element.dataset.studyMinutes} ${translations[currentLanguage].minutesShort}`;
    });

    if (currentStudyPlan) {
        const levelKey = `studyPlanLevel${
            currentStudyPlan.level[0].toUpperCase() + currentStudyPlan.level.slice(1)
        }`;
        const durationKey = currentStudyPlan.durationDays === 30
            ? "studyPlanDurationThirty"
            : "studyPlanDurationSeven";
        studyPlanLevelDisplay.textContent = translations[currentLanguage][levelKey];
        studyPlanTimeDisplay.textContent =
            `${currentStudyPlan.dailyMinutes} ${translations[currentLanguage].minutesShort}`;
        studyPlanDurationDisplay.textContent = translations[currentLanguage][durationKey];
    }
}

function formatFileSize(sizeBytes) {
    const locale = currentLanguage === "zh" ? "zh-CN" : "en-US";
    const formatter = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });

    if (sizeBytes < 1024) {
        return `${sizeBytes} B`;
    }
    if (sizeBytes < 1024 * 1024) {
        return `${formatter.format(sizeBytes / 1024)} KB`;
    }
    return `${formatter.format(sizeBytes / (1024 * 1024))} MB`;
}

function updateDocumentLocalizedText() {
    document.querySelectorAll("[data-document-size]").forEach((element) => {
        element.textContent = formatFileSize(Number(element.dataset.documentSize));
    });

    document.querySelectorAll("[data-document-select-id]").forEach((element) => {
        const documentData = uploadedDocuments.find(
            (item) => item.document_id === element.dataset.documentSelectId
        );
        if (documentData) {
            element.setAttribute(
                "aria-label",
                `${translations[currentLanguage].documentSelect}: ${documentData.filename}`
            );
        }
    });

    document.querySelectorAll("[data-source-page]").forEach((element) => {
        const number = element.dataset.sourcePage;
        element.textContent = currentLanguage === "zh"
            ? translations.zh.documentSourcePage.replace("{number}", number)
            : `${translations.en.documentSourcePage} ${number}`;
    });

    document.querySelectorAll("[data-source-chunk]").forEach((element) => {
        const number = element.dataset.sourceChunk;
        element.textContent = currentLanguage === "zh"
            ? translations.zh.documentSourceChunk.replace("{number}", number)
            : `${translations.en.documentSourceChunk} ${number}`;
    });
}

function resizeMessageInput() {
    messageInput.style.height = "auto";
    messageInput.style.height = `${Math.min(messageInput.scrollHeight, 160)}px`;
    messageInput.style.overflowY = messageInput.scrollHeight > 160 ? "auto" : "hidden";
}

function scrollChatToBottom() {
    chatArea.scrollTop = chatArea.scrollHeight;
}

function setSendingState(sending) {
    isSending = sending;
    sendButton.disabled = sending;
    chatForm.setAttribute("aria-busy", sending);
}

function setActiveView(view) {
    const isChatView = view === "chat";
    const isExplainView = view === "explain";
    const isQuizView = view === "quiz";
    const isStudyPlanView = view === "study-plan";
    const isDocumentsView = view === "documents";

    chatArea.hidden = !isChatView;
    chatInputArea.hidden = !isChatView;
    explainView.hidden = !isExplainView;
    quizView.hidden = !isQuizView;
    studyPlanView.hidden = !isStudyPlanView;
    documentsView.hidden = !isDocumentsView;

    viewButtons.forEach((button) => {
        const isActive = button.dataset.view === view;
        button.classList.toggle("active", isActive);

        if (isActive) {
            button.setAttribute("aria-current", "page");
        } else {
            button.removeAttribute("aria-current");
        }
    });

    if (isChatView) {
        messageInput.focus();
    } else if (isExplainView) {
        explainTopic.focus();
    } else if (isQuizView && !currentQuiz) {
        quizTopic.focus();
    } else if (isStudyPlanView && !currentStudyPlan) {
        studyPlanGoal.focus();
    } else if (isDocumentsView) {
        (uploadedDocuments.length ? documentQuestion : documentInput).focus();
    }
}

function selectExplainStyle(style) {
    selectedExplainStyle = style;

    explainStyleButtons.forEach((button) => {
        const isActive = button.dataset.explainStyle === style;
        button.classList.toggle("active", isActive);
        button.setAttribute("aria-pressed", isActive);
    });
}

function setExplainingState(explaining) {
    isExplaining = explaining;
    explainTopic.disabled = explaining;
    explainSubmitButton.disabled = explaining;
    explainForm.setAttribute("aria-busy", explaining);

    explainStyleButtons.forEach((button) => {
        button.disabled = explaining;
    });
}

function displayExplainOutput(message, state = "", translationKey = "") {
    explainResult.hidden = false;
    explainOutput.className = `explain-output${state ? ` ${state}` : ""}`;
    explainOutput.textContent = message;

    if (translationKey) {
        explainOutput.dataset.i18n = translationKey;
    } else {
        delete explainOutput.dataset.i18n;
        explainOutput.classList.add("markdown-content");
        renderMarkdown(explainOutput, message);
    }
}

function appendInlineMarkdown(container, text) {
    const tokenPattern = /(`[^`\n]+`|\*\*[^*\n]+?\*\*)/g;
    let lastIndex = 0;

    for (const match of text.matchAll(tokenPattern)) {
        container.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));

        const token = match[0];
        const element = document.createElement(token.startsWith("`") ? "code" : "strong");
        const markerLength = token.startsWith("`") ? 1 : 2;
        element.textContent = token.slice(markerLength, -markerLength);
        container.appendChild(element);
        lastIndex = match.index + token.length;
    }

    container.appendChild(document.createTextNode(text.slice(lastIndex)));
}

function splitTableRow(line) {
    let row = line.trim();

    if (row.startsWith("|")) {
        row = row.slice(1);
    }
    if (row.endsWith("|")) {
        row = row.slice(0, -1);
    }

    return row.split("|").map((cell) => cell.trim());
}

function isTableSeparator(line) {
    const cells = splitTableRow(line);
    return cells.length > 1 && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

function isMarkdownBlockStart(lines, index) {
    const line = lines[index];

    return (
        /^```/.test(line.trim()) ||
        /^#{1,6}\s+/.test(line) ||
        /^\s*[-*+]\s+/.test(line) ||
        /^\s*\d+\.\s+/.test(line) ||
        (line.includes("|") && isTableSeparator(lines[index + 1] || ""))
    );
}

function renderMarkdown(container, markdown) {
    const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
    let index = 0;

    container.textContent = "";

    while (index < lines.length) {
        const line = lines[index];

        if (!line.trim()) {
            index += 1;
            continue;
        }

        const codeFence = line.trim().match(/^```([\w-]*)\s*$/);
        if (codeFence) {
            const codeLines = [];
            index += 1;

            while (index < lines.length && !/^```\s*$/.test(lines[index].trim())) {
                codeLines.push(lines[index]);
                index += 1;
            }

            if (index < lines.length) {
                index += 1;
            }

            const preformatted = document.createElement("pre");
            const code = document.createElement("code");
            code.textContent = codeLines.join("\n");
            if (codeFence[1]) {
                code.dataset.language = codeFence[1];
            }
            preformatted.appendChild(code);
            container.appendChild(preformatted);
            continue;
        }

        const heading = line.match(/^(#{1,6})\s+(.+)$/);
        if (heading) {
            const headingElement = document.createElement(`h${heading[1].length}`);
            appendInlineMarkdown(headingElement, heading[2]);
            container.appendChild(headingElement);
            index += 1;
            continue;
        }

        const unorderedItem = line.match(/^\s*[-*+]\s+(.+)$/);
        if (unorderedItem) {
            const list = document.createElement("ul");

            while (index < lines.length) {
                const item = lines[index].match(/^\s*[-*+]\s+(.+)$/);
                if (!item) {
                    break;
                }

                const listItem = document.createElement("li");
                appendInlineMarkdown(listItem, item[1]);
                list.appendChild(listItem);
                index += 1;
            }

            container.appendChild(list);
            continue;
        }

        const orderedItem = line.match(/^\s*\d+\.\s+(.+)$/);
        if (orderedItem) {
            const list = document.createElement("ol");

            while (index < lines.length) {
                const item = lines[index].match(/^\s*\d+\.\s+(.+)$/);
                if (!item) {
                    break;
                }

                const listItem = document.createElement("li");
                appendInlineMarkdown(listItem, item[1]);
                list.appendChild(listItem);
                index += 1;
            }

            container.appendChild(list);
            continue;
        }

        if (line.includes("|") && isTableSeparator(lines[index + 1] || "")) {
            const headerCells = splitTableRow(line);
            const tableWrapper = document.createElement("div");
            const table = document.createElement("table");
            const tableHead = document.createElement("thead");
            const headerRow = document.createElement("tr");

            headerCells.forEach((cell) => {
                const headerCell = document.createElement("th");
                appendInlineMarkdown(headerCell, cell);
                headerRow.appendChild(headerCell);
            });

            tableHead.appendChild(headerRow);
            table.appendChild(tableHead);
            index += 2;

            const tableBody = document.createElement("tbody");
            while (index < lines.length && lines[index].trim() && lines[index].includes("|")) {
                const row = document.createElement("tr");
                const cells = splitTableRow(lines[index]);

                headerCells.forEach((unusedHeader, cellIndex) => {
                    const cell = document.createElement("td");
                    appendInlineMarkdown(cell, cells[cellIndex] || "");
                    row.appendChild(cell);
                });

                tableBody.appendChild(row);
                index += 1;
            }

            table.appendChild(tableBody);
            tableWrapper.className = "markdown-table-wrapper";
            tableWrapper.appendChild(table);
            container.appendChild(tableWrapper);
            continue;
        }

        const paragraphLines = [];
        while (
            index < lines.length &&
            lines[index].trim() &&
            !isMarkdownBlockStart(lines, index)
        ) {
            paragraphLines.push(lines[index].trim());
            index += 1;
        }

        const paragraph = document.createElement("p");
        appendInlineMarkdown(paragraph, paragraphLines.join(" "));
        container.appendChild(paragraph);
    }
}

function rememberSuccessfulTurn(userMessage, assistantReply) {
    conversationHistory.push(
        { role: "user", content: userMessage },
        { role: "assistant", content: assistantReply }
    );
}

function displayUserMessage(message) {
    const messageRow = document.createElement("div");
    const messageContent = document.createElement("div");
    const messageAuthor = document.createElement("span");
    const messageBubble = document.createElement("div");

    messageRow.className = "user-message";
    messageContent.className = "message-content";
    messageAuthor.className = "message-author";
    messageAuthor.dataset.i18n = "you";
    messageAuthor.textContent = translations[currentLanguage].you;
    messageBubble.className = "message-bubble";
    messageBubble.textContent = message;

    messageContent.append(messageAuthor, messageBubble);
    messageRow.appendChild(messageContent);
    messageList.appendChild(messageRow);
    welcomeSection.hidden = true;
    scrollChatToBottom();
}

function displayAssistantMessage(message, state = "", translationKey = "") {
    const messageRow = document.createElement("div");
    const messageContent = document.createElement("div");
    const messageAuthor = document.createElement("span");
    const messageBubble = document.createElement("div");

    messageRow.className = `assistant-message${state ? ` ${state}-message` : ""}`;
    messageContent.className = "message-content";
    messageAuthor.className = "message-author";
    messageAuthor.dataset.i18n = "appName";
    messageAuthor.textContent = translations[currentLanguage].appName;
    messageBubble.className = "message-bubble";

    if (translationKey) {
        messageBubble.textContent = message;
        messageBubble.dataset.i18n = translationKey;
    } else {
        messageBubble.classList.add("markdown-content");
        renderMarkdown(messageBubble, message);
    }

    messageContent.append(messageAuthor, messageBubble);
    messageRow.appendChild(messageContent);
    messageList.appendChild(messageRow);
    scrollChatToBottom();

    return messageRow;
}

async function sendMessage() {
    const message = messageInput.value.trim();

    if (!message || isSending) {
        return;
    }

    const requestLanguage = currentLanguage;
    const previousHistory = conversationHistory.map((historyMessage) => ({
        ...historyMessage
    }));

    displayUserMessage(message);
    messageInput.value = "";
    resizeMessageInput();
    setSendingState(true);

    const loadingMessage = displayAssistantMessage(
        translations[requestLanguage].thinking,
        "loading",
        "thinking"
    );
    let errorTranslationKey = "connectionError";

    try {
        const response = await fetch("/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message,
                language: requestLanguage,
                history: previousHistory
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            errorTranslationKey =
                errorTranslationKeyByCode[errorData.detail] || "aiGenerationError";
            throw new Error("The chat request failed.");
        }

        const data = await response.json();
        loadingMessage.remove();
        displayAssistantMessage(data.reply);
        rememberSuccessfulTurn(message, data.reply);
    } catch {
        loadingMessage.remove();
        displayAssistantMessage(
            translations[currentLanguage][errorTranslationKey],
            "error",
            errorTranslationKey
        );
    } finally {
        setSendingState(false);
        messageInput.focus();
    }
}

async function requestExplanation() {
    const topic = explainTopic.value.trim();

    if (!topic || isExplaining) {
        explainTopic.focus();
        return;
    }

    const requestLanguage = currentLanguage;
    const requestStyle = selectedExplainStyle;

    setExplainingState(true);
    displayExplainOutput(
        translations[requestLanguage].explaining,
        "loading",
        "explaining"
    );

    try {
        const response = await fetch("/api/explain", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                topic,
                style: requestStyle,
                language: requestLanguage
            })
        });

        if (!response.ok) {
            throw new Error("The explanation request failed.");
        }

        const data = await response.json();
        displayExplainOutput(data.reply);
    } catch {
        displayExplainOutput(
            translations[currentLanguage].explainError,
            "error",
            "explainError"
        );
    } finally {
        setExplainingState(false);
        explainTopic.focus();
    }
}

function selectQuizDifficulty(difficulty) {
    selectedQuizDifficulty = difficulty;

    quizDifficultyButtons.forEach((button) => {
        const isActive = button.dataset.quizDifficulty === difficulty;
        button.classList.toggle("active", isActive);
        button.setAttribute("aria-pressed", isActive);
    });
}

function showQuizMessage(element, translationKey, state = "") {
    element.hidden = false;
    element.className = `quiz-message${state ? ` ${state}` : ""}`;
    element.dataset.i18n = translationKey;
    element.textContent = translations[currentLanguage][translationKey];
}

function clearQuizMessage(element) {
    element.hidden = true;
    element.className = "quiz-message";
    element.textContent = "";
    delete element.dataset.i18n;
}

function setQuizGeneratingState(generating) {
    isGeneratingQuiz = generating;
    quizTopic.disabled = generating;
    quizGenerateButton.disabled = generating;
    quizSetupForm.setAttribute("aria-busy", generating);

    quizDifficultyButtons.forEach((button) => {
        button.disabled = generating;
    });

    const translationKey = generating ? "quizGenerating" : "quizGenerate";
    quizGenerateButton.dataset.i18n = translationKey;
    quizGenerateButton.textContent = translations[currentLanguage][translationKey];
}

function setQuizSubmittingState(submitting) {
    isSubmittingQuiz = submitting;
    quizSubmitButton.disabled = submitting;
    quizAnswerForm.setAttribute("aria-busy", submitting);
    quizQuestionList.querySelectorAll("input[type='radio']").forEach((input) => {
        input.disabled = submitting;
    });

    const translationKey = submitting ? "quizChecking" : "quizSubmit";
    quizSubmitButton.dataset.i18n = translationKey;
    quizSubmitButton.textContent = translations[currentLanguage][translationKey];
}

function renderQuizQuestions() {
    quizQuestionList.textContent = "";
    quizTopicDisplay.textContent = currentQuiz.topic;
    updateQuizLocalizedText();

    currentQuiz.questions.forEach((question, questionIndex) => {
        const questionCard = document.createElement("article");
        const questionNumber = document.createElement("h3");
        const questionText = document.createElement("p");
        const optionGroup = document.createElement("fieldset");
        const optionLegend = document.createElement("legend");

        questionCard.className = "quiz-question";
        questionNumber.dataset.quizQuestionNumber = questionIndex + 1;
        questionNumber.textContent = formatQuizQuestionNumber(questionIndex + 1);
        questionText.className = "quiz-question-text";
        questionText.textContent = question.question;
        optionGroup.className = "quiz-option-group";
        optionLegend.className = "visually-hidden";
        optionLegend.textContent = question.question;
        optionGroup.appendChild(optionLegend);

        question.options.forEach((option, optionIndex) => {
            const optionLabel = document.createElement("label");
            const optionInput = document.createElement("input");
            const optionText = document.createElement("span");

            optionLabel.className = "quiz-option";
            optionInput.type = "radio";
            optionInput.name = `quiz-question-${questionIndex}`;
            optionInput.value = optionIndex;
            optionText.textContent = option;

            optionInput.addEventListener("change", () => {
                optionGroup.querySelectorAll(".quiz-option").forEach((label) => {
                    label.classList.remove("selected");
                });
                optionLabel.classList.add("selected");
                clearQuizMessage(quizAnswerMessage);
            });

            optionLabel.append(optionInput, optionText);
            optionGroup.appendChild(optionLabel);
        });

        questionCard.append(questionNumber, questionText, optionGroup);
        quizQuestionList.appendChild(questionCard);
    });

    quizSetupState.hidden = true;
    quizResultsState.hidden = true;
    quizQuestionsState.hidden = false;
    clearQuizMessage(quizAnswerMessage);
}

async function generateQuizRequest() {
    const topic = quizTopic.value.trim();

    if (!topic || isGeneratingQuiz) {
        quizTopic.focus();
        return;
    }

    const requestLanguage = currentLanguage;
    const requestDifficulty = selectedQuizDifficulty;
    setQuizGeneratingState(true);
    showQuizMessage(quizSetupMessage, "quizGenerating", "loading");

    try {
        const response = await fetch("/api/quiz/generate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                topic,
                difficulty: requestDifficulty,
                language: requestLanguage
            })
        });

        if (!response.ok) {
            throw new Error("The quiz generation request failed.");
        }

        const data = await response.json();
        const hasValidShape =
            data.quiz_id &&
            data.questions?.length === 5 &&
            data.questions.every((question) => question.options?.length === 4);

        if (!hasValidShape) {
            throw new Error("The quiz response was incomplete.");
        }

        currentQuiz = data;
        clearQuizMessage(quizSetupMessage);
        renderQuizQuestions();
    } catch {
        showQuizMessage(quizSetupMessage, "quizGenerateError", "error");
    } finally {
        setQuizGeneratingState(false);
        if (!currentQuiz) {
            quizTopic.focus();
        }
    }
}

function getSelectedQuizAnswers() {
    if (!currentQuiz) {
        return null;
    }

    const answers = currentQuiz.questions.map((question, questionIndex) => {
        const selectedOption = quizQuestionList.querySelector(
            `input[name='quiz-question-${questionIndex}']:checked`
        );
        return selectedOption ? Number(selectedOption.value) : null;
    });

    return answers.includes(null) ? null : answers;
}

function appendResultDetail(container, labelKey, value) {
    const detail = document.createElement("p");
    const label = document.createElement("strong");
    const text = document.createTextNode(`: ${value}`);

    label.dataset.i18n = labelKey;
    label.textContent = translations[currentLanguage][labelKey];
    detail.append(label, text);
    container.appendChild(detail);
}

function renderQuizResults(resultData) {
    quizResultList.textContent = "";
    quizScoreDisplay.textContent = `${resultData.score} / ${resultData.total}`;

    resultData.results.forEach((result, resultIndex) => {
        const question = currentQuiz.questions.find(
            (quizQuestion) => quizQuestion.id === result.question_id
        );
        const resultCard = document.createElement("article");
        const resultHeader = document.createElement("div");
        const questionNumber = document.createElement("h3");
        const status = document.createElement("span");
        const questionText = document.createElement("p");

        resultCard.className = `quiz-result ${result.correct ? "correct" : "incorrect"}`;
        resultHeader.className = "quiz-result-heading";
        questionNumber.dataset.quizQuestionNumber = resultIndex + 1;
        questionNumber.textContent = formatQuizQuestionNumber(resultIndex + 1);
        status.className = "quiz-result-status";
        status.dataset.i18n = result.correct ? "quizCorrect" : "quizIncorrect";
        status.textContent = translations[currentLanguage][status.dataset.i18n];
        questionText.className = "quiz-result-question";
        questionText.textContent = question.question;

        resultHeader.append(questionNumber, status);
        resultCard.append(resultHeader, questionText);
        appendResultDetail(
            resultCard,
            "quizYourAnswer",
            question.options[result.user_answer]
        );
        appendResultDetail(
            resultCard,
            "quizCorrectAnswer",
            question.options[result.correct_answer]
        );
        appendResultDetail(resultCard, "quizExplanation", result.explanation);
        quizResultList.appendChild(resultCard);
    });

    quizQuestionsState.hidden = true;
    quizResultsState.hidden = false;
}

function returnToQuizSetup(messageKey = "", state = "") {
    currentQuiz = null;
    quizQuestionsState.hidden = true;
    quizResultsState.hidden = true;
    quizSetupState.hidden = false;
    quizQuestionList.textContent = "";
    quizResultList.textContent = "";
    clearQuizMessage(quizAnswerMessage);

    if (messageKey) {
        showQuizMessage(quizSetupMessage, messageKey, state);
    } else {
        clearQuizMessage(quizSetupMessage);
    }
}

function resetQuiz() {
    quizTopic.value = "";
    selectQuizDifficulty("medium");
    returnToQuizSetup();
    quizTopic.focus();
}

async function submitQuizAnswers() {
    if (!currentQuiz || isSubmittingQuiz) {
        return;
    }

    const answers = getSelectedQuizAnswers();
    if (!answers) {
        showQuizMessage(quizAnswerMessage, "quizIncomplete", "error");
        return;
    }

    setQuizSubmittingState(true);
    showQuizMessage(quizAnswerMessage, "quizChecking", "loading");

    try {
        const response = await fetch("/api/quiz/submit", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                quiz_id: currentQuiz.quiz_id,
                answers
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const error = new Error("The quiz submission request failed.");
            error.code = errorData.detail;
            throw error;
        }

        const data = await response.json();
        if (data.results?.length !== 5 || data.total !== 5) {
            throw new Error("The quiz result response was incomplete.");
        }

        clearQuizMessage(quizAnswerMessage);
        renderQuizResults(data);
    } catch (error) {
        if (error.code === "quiz_not_found") {
            returnToQuizSetup("quizExpired", "error");
        } else {
            showQuizMessage(quizAnswerMessage, "quizSubmitError", "error");
        }
    } finally {
        setQuizSubmittingState(false);
    }
}

function selectStudyLevel(level) {
    selectedStudyLevel = level;

    studyLevelButtons.forEach((button) => {
        const isActive = button.dataset.studyLevel === level;
        button.classList.toggle("active", isActive);
        button.setAttribute("aria-pressed", isActive);
    });
}

function selectStudyDuration(duration) {
    selectedStudyDuration = Number(duration);

    studyDurationButtons.forEach((button) => {
        const isActive = Number(button.dataset.studyDuration) === selectedStudyDuration;
        button.classList.toggle("active", isActive);
        button.setAttribute("aria-pressed", isActive);
    });
}

function showStudyPlanMessage(translationKey, state = "") {
    studyPlanMessage.hidden = false;
    studyPlanMessage.className = `study-plan-message${state ? ` ${state}` : ""}`;
    studyPlanMessage.dataset.i18n = translationKey;
    studyPlanMessage.textContent = translations[currentLanguage][translationKey];
}

function clearStudyPlanMessage() {
    studyPlanMessage.hidden = true;
    studyPlanMessage.className = "study-plan-message";
    studyPlanMessage.textContent = "";
    delete studyPlanMessage.dataset.i18n;
}

function setStudyPlanGeneratingState(generating) {
    isGeneratingStudyPlan = generating;
    studyPlanGoal.disabled = generating;
    studyPlanDailyMinutes.disabled = generating;
    studyPlanGenerateButton.disabled = generating;
    studyPlanForm.setAttribute("aria-busy", generating);

    [...studyLevelButtons, ...studyDurationButtons].forEach((button) => {
        button.disabled = generating;
    });

    const translationKey = generating ? "studyPlanBuilding" : "studyPlanGenerate";
    studyPlanGenerateButton.dataset.i18n = translationKey;
    studyPlanGenerateButton.textContent = translations[currentLanguage][translationKey];
}

function appendStudyPlanDetail(container, labelKey, value) {
    const detail = document.createElement("p");
    const label = document.createElement("strong");
    const text = document.createElement("span");

    detail.className = "study-plan-day-detail";
    label.dataset.i18n = labelKey;
    label.textContent = translations[currentLanguage][labelKey];
    text.textContent = `: ${value}`;
    detail.append(label, text);
    container.appendChild(detail);
    return text;
}

function renderStudyPlan() {
    const plan = currentStudyPlan.plan;
    studyPlanTitle.textContent = plan.title;
    studyPlanOverview.textContent = plan.overview;
    studyPlanDayList.textContent = "";
    updateStudyPlanLocalizedText();

    plan.days.forEach((studyDay) => {
        const daySection = document.createElement("section");
        const dayNumber = document.createElement("h3");
        const focus = document.createElement("h4");
        const tasksLabel = document.createElement("p");
        const taskList = document.createElement("ul");

        daySection.className = "study-plan-day";
        dayNumber.dataset.studyDayNumber = studyDay.day;
        dayNumber.textContent = formatStudyPlanDayNumber(studyDay.day);
        focus.textContent = studyDay.focus;
        tasksLabel.className = "study-plan-day-label";
        tasksLabel.dataset.i18n = "studyPlanTasks";
        tasksLabel.textContent = translations[currentLanguage].studyPlanTasks;

        studyDay.tasks.forEach((task) => {
            const taskItem = document.createElement("li");
            taskItem.textContent = task;
            taskList.appendChild(taskItem);
        });

        daySection.append(dayNumber, focus, tasksLabel, taskList);
        const estimatedTime = appendStudyPlanDetail(
            daySection,
            "studyPlanEstimatedTime",
            `${studyDay.estimated_minutes} ${translations[currentLanguage].minutesShort}`
        );
        estimatedTime.dataset.studyMinutes = studyDay.estimated_minutes;
        appendStudyPlanDetail(daySection, "studyPlanDailyGoal", studyDay.goal);
        studyPlanDayList.appendChild(daySection);
    });

    studyPlanSetupState.hidden = true;
    studyPlanResultState.hidden = false;
}

async function generateStudyPlanRequest() {
    const goal = studyPlanGoal.value.trim();
    const dailyMinutes = Number(studyPlanDailyMinutes.value);
    const isValidTime =
        Number.isInteger(dailyMinutes) && dailyMinutes >= 15 && dailyMinutes <= 480;

    if (!goal || !isValidTime) {
        showStudyPlanMessage("studyPlanValidation", "error");
        (goal ? studyPlanDailyMinutes : studyPlanGoal).focus();
        return;
    }

    if (isGeneratingStudyPlan) {
        return;
    }

    const requestLanguage = currentLanguage;
    const requestLevel = selectedStudyLevel;
    const requestDuration = selectedStudyDuration;
    setStudyPlanGeneratingState(true);
    showStudyPlanMessage("studyPlanBuilding", "loading");

    try {
        const response = await fetch("/api/study-plan", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                goal,
                level: requestLevel,
                daily_minutes: dailyMinutes,
                duration_days: requestDuration,
                language: requestLanguage
            })
        });

        if (!response.ok) {
            throw new Error("The study plan request failed.");
        }

        const data = await response.json();
        const hasValidShape =
            data.title &&
            data.overview &&
            data.days?.length === requestDuration &&
            data.days.every((studyDay) =>
                studyDay.tasks?.length >= 2 && studyDay.tasks.length <= 5
            );

        if (!hasValidShape) {
            throw new Error("The study plan response was incomplete.");
        }

        currentStudyPlan = {
            plan: data,
            level: requestLevel,
            dailyMinutes,
            durationDays: requestDuration
        };
        clearStudyPlanMessage();
        renderStudyPlan();
    } catch {
        showStudyPlanMessage("studyPlanError", "error");
    } finally {
        setStudyPlanGeneratingState(false);
        if (!currentStudyPlan) {
            studyPlanGoal.focus();
        }
    }
}

function resetStudyPlan() {
    currentStudyPlan = null;
    studyPlanGoal.value = "";
    studyPlanDailyMinutes.value = "60";
    selectStudyLevel("beginner");
    selectStudyDuration(7);
    studyPlanTitle.textContent = "";
    studyPlanOverview.textContent = "";
    studyPlanDayList.textContent = "";
    studyPlanResultState.hidden = true;
    studyPlanSetupState.hidden = false;
    clearStudyPlanMessage();
    studyPlanGoal.focus();
}

function showDocumentMessage(translationKey, state = "") {
    documentMessage.hidden = false;
    documentMessage.className = `document-message${state ? ` ${state}` : ""}`;
    documentMessage.dataset.i18n = translationKey;
    documentMessage.textContent = translations[currentLanguage][translationKey];
}

function clearDocumentMessage() {
    documentMessage.hidden = true;
    documentMessage.className = "document-message";
    documentMessage.textContent = "";
    delete documentMessage.dataset.i18n;
}

function setDocumentUploadingState(uploading) {
    isUploadingDocument = uploading;
    documentInput.disabled = uploading;
    documentUploadButton.disabled = uploading;
    documentUploadForm.setAttribute("aria-busy", uploading);

    const translationKey = uploading ? "documentPreparing" : "documentUploadAction";
    documentUploadButton.dataset.i18n = translationKey;
    documentUploadButton.textContent = translations[currentLanguage][translationKey];
}

function showDocumentAskMessage(translationKey, state = "") {
    documentAskMessage.hidden = false;
    documentAskMessage.className = `document-ask-message${state ? ` ${state}` : ""}`;
    documentAskMessage.dataset.i18n = translationKey;
    documentAskMessage.textContent = translations[currentLanguage][translationKey];
}

function clearDocumentAskMessage() {
    documentAskMessage.hidden = true;
    documentAskMessage.className = "document-ask-message";
    documentAskMessage.textContent = "";
    delete documentAskMessage.dataset.i18n;
}

function clearDocumentAnswer() {
    currentDocumentAnswer = null;
    documentAnswer.hidden = true;
    documentAnswerOutput.textContent = "";
    documentSourceList.textContent = "";
    documentSources.hidden = true;
}

function setDocumentAskingState(asking) {
    isAskingDocuments = asking;
    documentQuestion.disabled = asking;
    documentAskButton.disabled = asking;
    documentAskForm.setAttribute("aria-busy", asking);
    documentList.querySelectorAll(
        "input[type='checkbox'], .document-remove-button"
    ).forEach((control) => {
        control.disabled = asking;
    });

    const translationKey = asking ? "documentSearching" : "documentAskAction";
    documentAskButton.dataset.i18n = translationKey;
    documentAskButton.textContent = translations[currentLanguage][translationKey];
}

function renderDocumentAnswer(answerData) {
    currentDocumentAnswer = answerData;
    documentAnswerOutput.textContent = "";
    renderMarkdown(documentAnswerOutput, answerData.reply);
    documentSourceList.textContent = "";

    answerData.sources.forEach((source) => {
        const sourceItem = document.createElement("li");
        const sourceHeading = document.createElement("p");
        const filename = document.createElement("strong");
        const separator = document.createTextNode(" — ");
        const location = document.createElement("span");
        const snippet = document.createElement("p");

        filename.textContent = source.filename;
        if (source.page_number !== null) {
            location.dataset.sourcePage = source.page_number;
        } else {
            location.dataset.sourceChunk = source.chunk_index + 1;
        }
        snippet.className = "document-source-snippet";
        snippet.textContent = source.snippet;
        sourceHeading.append(filename, separator, location);
        sourceItem.append(sourceHeading, snippet);
        documentSourceList.appendChild(sourceItem);
    });

    documentSources.hidden = answerData.sources.length === 0;
    documentAnswer.hidden = false;
    updateDocumentLocalizedText();
}

async function askDocumentQuestion() {
    const question = documentQuestion.value.trim();
    const documentIds = [...selectedDocumentIds];

    if (!question) {
        showDocumentAskMessage("documentQuestionBlank", "error");
        documentQuestion.focus();
        return;
    }
    if (documentIds.length === 0) {
        showDocumentAskMessage("documentSelectionRequired", "error");
        return;
    }
    if (isAskingDocuments) {
        return;
    }

    const requestLanguage = currentLanguage;
    setDocumentAskingState(true);
    clearDocumentAnswer();
    showDocumentAskMessage("documentSearching", "loading");
    let errorTranslationKey = "documentSearchError";

    try {
        const response = await fetch("/api/documents/ask", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                question,
                document_ids: documentIds,
                language: requestLanguage
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            errorTranslationKey =
                documentErrorTranslationKeyByCode[errorData.detail] ||
                errorTranslationKeyByCode[errorData.detail] ||
                "documentSearchError";
            throw new Error("The document question request failed.");
        }

        const data = await response.json();
        const hasValidShape =
            typeof data.reply === "string" &&
            data.reply.trim() &&
            Array.isArray(data.sources) &&
            data.sources.every((source) =>
                typeof source.document_id === "string" &&
                typeof source.filename === "string" &&
                (source.page_number === null || Number.isInteger(source.page_number)) &&
                Number.isInteger(source.chunk_index) &&
                typeof source.snippet === "string"
            );

        if (!hasValidShape) {
            throw new Error("The document answer response was incomplete.");
        }

        clearDocumentAskMessage();
        renderDocumentAnswer(data);
    } catch {
        showDocumentAskMessage(errorTranslationKey, "error");
    } finally {
        setDocumentAskingState(false);
        documentQuestion.focus();
    }
}

function validateDocumentFile(file) {
    if (!file) {
        return "documentNoFile";
    }

    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!SUPPORTED_DOCUMENT_EXTENSIONS.includes(extension)) {
        return "documentUnsupported";
    }
    if (file.size === 0) {
        return "documentEmpty";
    }
    if (file.size > DOCUMENT_MAX_FILE_SIZE_BYTES) {
        return "documentTooLarge";
    }
    if (uploadedDocuments.length >= DOCUMENT_MAX_COUNT) {
        return "documentLimitReached";
    }

    return "";
}

function appendDocumentMetadata(container, labelKey, value, data = {}) {
    const item = document.createElement("div");
    const label = document.createElement("dt");
    const content = document.createElement("dd");

    item.className = "document-meta-item";
    label.dataset.i18n = labelKey;
    label.textContent = translations[currentLanguage][labelKey];
    content.textContent = value;

    Object.entries(data).forEach(([key, dataValue]) => {
        content.dataset[key] = dataValue;
    });

    item.append(label, content);
    container.appendChild(item);
    return content;
}

async function removeDocumentRequest(documentData, documentCard, removeButton) {
    if (removeButton.disabled) {
        return;
    }

    removeButton.disabled = true;
    removeButton.dataset.i18n = "documentRemoving";
    removeButton.textContent = translations[currentLanguage].documentRemoving;
    let errorTranslationKey = "documentProcessingError";

    try {
        const response = await fetch(
            `/api/documents/${encodeURIComponent(documentData.document_id)}`,
            { method: "DELETE" }
        );

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            errorTranslationKey =
                documentErrorTranslationKeyByCode[errorData.detail] ||
                "documentProcessingError";
            throw new Error("The document removal request failed.");
        }

        const documentIndex = uploadedDocuments.findIndex(
            (item) => item.document_id === documentData.document_id
        );
        if (documentIndex !== -1) {
            uploadedDocuments.splice(documentIndex, 1);
        }
        selectedDocumentIds.delete(documentData.document_id);
        documentCard.remove();
        documentListSection.hidden = uploadedDocuments.length === 0;
        clearDocumentAnswer();
        clearDocumentAskMessage();
        clearDocumentMessage();
    } catch {
        showDocumentMessage(errorTranslationKey, "error");
    } finally {
        removeButton.disabled = false;
        removeButton.dataset.i18n = "documentRemove";
        removeButton.textContent = translations[currentLanguage].documentRemove;
    }
}

function renderDocument(documentData) {
    const documentCard = document.createElement("article");
    const header = document.createElement("div");
    const titleGroup = document.createElement("div");
    const filename = document.createElement("h4");
    const selectLabel = document.createElement("label");
    const selectCheckbox = document.createElement("input");
    const selectText = document.createElement("span");
    const removeButton = document.createElement("button");
    const metadata = document.createElement("dl");
    const previewHeading = document.createElement("h5");
    const preview = document.createElement("pre");

    documentCard.className = "document-item";
    documentCard.dataset.documentId = documentData.document_id;
    header.className = "document-item-header";
    titleGroup.className = "document-title-group";
    filename.textContent = documentData.filename;
    selectLabel.className = "document-select-label";
    selectCheckbox.type = "checkbox";
    selectCheckbox.checked = selectedDocumentIds.has(documentData.document_id);
    selectCheckbox.dataset.documentSelectId = documentData.document_id;
    selectCheckbox.setAttribute(
        "aria-label",
        `${translations[currentLanguage].documentSelect}: ${documentData.filename}`
    );
    selectText.dataset.i18n = "documentSelect";
    selectText.textContent = translations[currentLanguage].documentSelect;
    selectCheckbox.addEventListener("change", () => {
        if (selectCheckbox.checked) {
            selectedDocumentIds.add(documentData.document_id);
        } else {
            selectedDocumentIds.delete(documentData.document_id);
        }
        clearDocumentAnswer();
        clearDocumentAskMessage();
    });
    selectLabel.append(selectCheckbox, selectText);
    titleGroup.append(filename, selectLabel);
    removeButton.className = "document-remove-button";
    removeButton.type = "button";
    removeButton.dataset.i18n = "documentRemove";
    removeButton.textContent = translations[currentLanguage].documentRemove;
    removeButton.addEventListener("click", () => {
        removeDocumentRequest(documentData, documentCard, removeButton);
    });
    header.append(titleGroup, removeButton);

    metadata.className = "document-meta";
    appendDocumentMetadata(metadata, "documentType", documentData.file_type.toUpperCase());
    appendDocumentMetadata(
        metadata,
        "documentSize",
        formatFileSize(documentData.size_bytes),
        { documentSize: documentData.size_bytes }
    );
    if (documentData.page_count !== null) {
        appendDocumentMetadata(metadata, "documentPages", documentData.page_count);
    }
    appendDocumentMetadata(metadata, "documentCharacters", documentData.text_length);
    appendDocumentMetadata(metadata, "documentChunks", documentData.chunk_count);
    const statusValue = appendDocumentMetadata(metadata, "documentAiStatus", "");
    statusValue.dataset.i18n = "documentReady";
    statusValue.textContent = translations[currentLanguage].documentReady;

    previewHeading.dataset.i18n = "documentPreview";
    previewHeading.textContent = translations[currentLanguage].documentPreview;
    preview.className = "document-preview";
    preview.textContent = documentData.preview;

    documentCard.append(header, metadata, previewHeading, preview);
    documentList.appendChild(documentCard);
    documentListSection.hidden = false;
}

async function uploadDocumentRequest() {
    if (isUploadingDocument) {
        return;
    }

    const file = documentInput.files[0];
    const validationError = validateDocumentFile(file);
    if (validationError) {
        showDocumentMessage(validationError, "error");
        documentInput.focus();
        return;
    }

    const formData = new FormData();
    formData.append("file", file);
    setDocumentUploadingState(true);
    clearDocumentMessage();
    let errorTranslationKey = "documentProcessingError";

    try {
        const response = await fetch("/api/documents/upload", {
            method: "POST",
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            errorTranslationKey =
                documentErrorTranslationKeyByCode[errorData.detail] ||
                "documentProcessingError";
            throw new Error("The document upload request failed.");
        }

        const data = await response.json();
        const hasValidShape =
            typeof data.document_id === "string" &&
            typeof data.filename === "string" &&
            SUPPORTED_DOCUMENT_EXTENSIONS.includes(data.file_type) &&
            Number.isInteger(data.size_bytes) &&
            Number.isInteger(data.text_length) &&
            data.rag_ready === true &&
            Number.isInteger(data.chunk_count) &&
            data.chunk_count > 0 &&
            typeof data.preview === "string" &&
            (data.page_count === null || Number.isInteger(data.page_count));

        if (!hasValidShape) {
            throw new Error("The document response was incomplete.");
        }

        uploadedDocuments.push(data);
        selectedDocumentIds.add(data.document_id);
        renderDocument(data);
        documentInput.value = "";
        clearDocumentMessage();
    } catch {
        showDocumentMessage(errorTranslationKey, "error");
    } finally {
        setDocumentUploadingState(false);
        documentInput.focus();
    }
}

chatForm.addEventListener("submit", (event) => {
    event.preventDefault();
    sendMessage();
});

explainForm.addEventListener("submit", (event) => {
    event.preventDefault();
    requestExplanation();
});

quizSetupForm.addEventListener("submit", (event) => {
    event.preventDefault();
    generateQuizRequest();
});

quizAnswerForm.addEventListener("submit", (event) => {
    event.preventDefault();
    submitQuizAnswers();
});

studyPlanForm.addEventListener("submit", (event) => {
    event.preventDefault();
    generateStudyPlanRequest();
});

documentUploadForm.addEventListener("submit", (event) => {
    event.preventDefault();
    uploadDocumentRequest();
});

documentAskForm.addEventListener("submit", (event) => {
    event.preventDefault();
    askDocumentQuestion();
});

quizNewButton.addEventListener("click", resetQuiz);
studyPlanNewButton.addEventListener("click", resetStudyPlan);

documentInput.addEventListener("change", clearDocumentMessage);

documentQuestion.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        askDocumentQuestion();
    }
});

documentQuestion.addEventListener("input", clearDocumentAskMessage);

messageInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
});

messageInput.addEventListener("input", resizeMessageInput);

languageButtons.forEach((button) => {
    button.addEventListener("click", () => {
        applyLanguage(button.dataset.language);
    });
});

viewButtons.forEach((button) => {
    button.addEventListener("click", () => {
        setActiveView(button.dataset.view);
    });
});

explainStyleButtons.forEach((button) => {
    button.addEventListener("click", () => {
        selectExplainStyle(button.dataset.explainStyle);
    });
});

quizDifficultyButtons.forEach((button) => {
    button.addEventListener("click", () => {
        selectQuizDifficulty(button.dataset.quizDifficulty);
    });
});

studyLevelButtons.forEach((button) => {
    button.addEventListener("click", () => {
        selectStudyLevel(button.dataset.studyLevel);
    });
});

studyDurationButtons.forEach((button) => {
    button.addEventListener("click", () => {
        selectStudyDuration(button.dataset.studyDuration);
    });
});

applyLanguage(currentLanguage);
