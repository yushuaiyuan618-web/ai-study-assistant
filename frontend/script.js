const chatForm = document.querySelector("#chatForm");
const messageInput = document.querySelector("#messageInput");
const messageList = document.querySelector("#messageList");
const welcomeSection = document.querySelector("#welcomeSection");
const chatArea = document.querySelector("#chatArea");
const sendButton = document.querySelector(".send-button");
const languageButtons = document.querySelectorAll("[data-language]");

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
        inputLabel: "Study question",
        inputPlaceholder: "Ask anything about your studies...",
        send: "Send",
        inputHint: "Press Enter to send · Shift + Enter for a new line",
        you: "You",
        thinking: "Thinking...",
        localAiError: "Local AI is not available. Please make sure Ollama is running.",
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
        inputLabel: "学习问题",
        inputPlaceholder: "输入你的学习问题...",
        send: "发送",
        inputHint: "按 Enter 发送 · 按 Shift + Enter 换行",
        you: "你",
        thinking: "正在思考...",
        localAiError: "本地 AI 暂时无法使用，请确认 Ollama 已经启动。",
        connectionError: "无法连接到服务器，请确认后端已经启动。"
    }
};

const savedLanguage = localStorage.getItem("studyAssistantLanguage");
let currentLanguage = savedLanguage === "zh" ? "zh" : "en";
let isSending = false;
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

    localStorage.setItem("studyAssistantLanguage", language);
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
    messageBubble.textContent = message;

    if (translationKey) {
        messageBubble.dataset.i18n = translationKey;
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
            if (response.status === 503) {
                errorTranslationKey = "localAiError";
            }
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

chatForm.addEventListener("submit", (event) => {
    event.preventDefault();
    sendMessage();
});

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

applyLanguage(currentLanguage);
