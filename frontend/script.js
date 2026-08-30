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

const savedLanguage = localStorage.getItem("studyAssistantLanguage");
let currentLanguage = savedLanguage === "zh" ? "zh" : "en";
let isSending = false;
let isExplaining = false;
let selectedExplainStyle = "simple";
let isGeneratingQuiz = false;
let isSubmittingQuiz = false;
let selectedQuizDifficulty = "medium";
let currentQuiz = null;
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

    chatArea.hidden = !isChatView;
    chatInputArea.hidden = !isChatView;
    explainView.hidden = !isExplainView;
    quizView.hidden = !isQuizView;

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

quizNewButton.addEventListener("click", resetQuiz);

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

applyLanguage(currentLanguage);
