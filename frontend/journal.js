const journalView = document.querySelector("#journalView");
const journalList = document.querySelector("#journalList");
const journalMessage = document.querySelector("#journalMessage");
const journalFilters = document.querySelector("#journalFilters");
const journalAutoRecord = document.querySelector("#journalAutoRecord");
const journalKind = document.querySelector("#journalKind");
const journalFrom = document.querySelector("#journalFrom");
const journalTo = document.querySelector("#journalTo");
const journalOrder = document.querySelector("#journalOrder");
const journalExport = document.querySelector("#journalExport");
const journalExportScope = document.querySelector("#journalExportScope");
const journalClear = document.querySelector("#journalClear");
const journalClearDialog = document.querySelector("#journalClearDialog");
const journalPageSize = 50;
let journalOffset = 0;
let journalData = null;
let journalLoadVersion = 0;
let journalBusy = false;

const journalTranslations = {
    en: {
        journal: "Learning Journal",
        journalSubtitle: "Revisit what you learned. Keep the difficult questions close.",
        journalAutoRecord: "Automatically save successful answers",
        journalLocalHint: "Chat, Explain and document answers are saved on this computer.",
        journalTotal: "Total records", journalNormal: "Regular records",
        journalStarred: "Important difficulties", journalAll: "All records",
        journalShow: "Show", journalFrom: "From", journalTo: "Through",
        journalOrder: "Order", journalNewest: "Newest first", journalOldest: "Oldest first",
        journalReset: "Reset filters", journalExportScope: "Export scope",
        journalExportFiltered: "Current filter (all matching records)",
        journalExportAll: "All records", journalExport: "Export PDF",
        journalExporting: "Exporting...", journalRefresh: "Refresh",
        journalClear: "Clear all records", journalLoading: "Loading records...",
        journalEmpty: "No records match this view yet.",
        journalPages: "Journal pages", journalPrevious: "Previous", journalNext: "Next",
        journalQuestion: "Original question", journalAnswer: "AI answer",
        journalMark: "Mark as an important difficulty", journalUnmark: "Remove difficulty mark",
        journalDelete: "Delete record", journalSources: "Sources",
        journalClearTitle: "Clear your learning journal?",
        journalClearDescription: "This permanently deletes every record, including hidden or filtered records.",
        journalCancel: "Cancel", journalConfirmClear: "Delete all records",
        journalError: "Unable to access your learning journal. Please try again.",
        journalExportError: "Unable to export the PDF. Please try again.",
        journalDateError: "Choose a valid date range: the end date cannot be before the start date.",
        journalCaptureError: "Your answer is ready, but it could not be saved to the learning journal. Check the journal and try again later.",
        journalRag: "Documents / Local RAG"
    },
    zh: {
        journal: "学习记录", journalSubtitle: "回顾学过的知识，留意值得再想一遍的问题。",
        journalAutoRecord: "自动保存成功完成的问答",
        journalLocalHint: "AI 对话、知识讲解和资料问答会保存在这台电脑上。",
        journalTotal: "总记录数量", journalNormal: "普通记录", journalStarred: "重点难题",
        journalAll: "全部记录", journalShow: "查看", journalFrom: "开始日期",
        journalTo: "结束日期（含当天）", journalOrder: "排序", journalNewest: "最新在前",
        journalOldest: "最早在前", journalReset: "重置筛选", journalExportScope: "导出范围",
        journalExportFiltered: "当前筛选（全部符合条件的记录）", journalExportAll: "全部记录",
        journalExport: "导出 PDF", journalExporting: "正在导出…", journalRefresh: "刷新",
        journalClear: "清空全部记录", journalLoading: "正在加载记录…",
        journalEmpty: "当前条件下暂无学习记录。", journalPages: "学习记录分页",
        journalPrevious: "上一页", journalNext: "下一页", journalQuestion: "原始问题",
        journalAnswer: "AI 回答", journalMark: "标记为重点难题", journalUnmark: "取消重点难题标记",
        journalDelete: "删除记录", journalSources: "资料来源",
        journalClearTitle: "清空学习记录？",
        journalClearDescription: "此操作会永久删除所有记录，包括当前筛选未显示的记录。",
        journalCancel: "取消", journalConfirmClear: "确认删除全部记录",
        journalError: "暂时无法访问学习记录，请稍后重试。",
        journalExportError: "暂时无法导出 PDF，请稍后重试。",
        journalDateError: "请选择有效日期范围，结束日期不能早于开始日期。",
        journalCaptureError: "回答已生成，但未能保存到学习记录。请检查学习记录并稍后重试。",
        journalRag: "学习资料 / 本地 RAG"
    }
};

function journalText(key) {
    return translations[currentLanguage][key];
}

function showJournalMessage(key) {
    journalMessage.hidden = !key;
    journalMessage.dataset.i18n = key || "journalLoading";
    journalMessage.textContent = key ? journalText(key) : "";
}

function journalQuery(filtered = true) {
    const query = new URLSearchParams();
    if (!filtered) return query;
    if (!journalFrom.validity.valid || !journalTo.validity.valid ||
        (journalFrom.value && journalTo.value && journalFrom.value > journalTo.value)) {
        throw new Error("journalDateError");
    }
    query.set("kind", journalKind.value);
    query.set("order", journalOrder.value);
    if (journalFrom.value) {
        query.set("start", new Date(`${journalFrom.value}T00:00:00`).toISOString());
    }
    if (journalTo.value) {
        const end = new Date(`${journalTo.value}T00:00:00`);
        end.setDate(end.getDate() + 1);
        query.set("end", end.toISOString());
    }
    return query;
}

async function journalFetch(path = "", options = {}) {
    const response = await fetch(`/api/journal${path}`, options);
    if (!response.ok) throw new Error("journalError");
    return response;
}

function updateJournalControls() {
    const total = journalData?.stats.total || 0;
    const filtered = journalData?.filtered_count || 0;
    journalExport.disabled = journalBusy || !(journalExportScope.value === "all" ? total : filtered);
    journalClear.disabled = journalBusy || !total;
    document.querySelector("#journalPrevious").disabled = journalBusy || journalOffset === 0;
    document.querySelector("#journalNext").disabled = journalBusy || journalOffset + journalPageSize >= filtered;
    document.querySelector("#journalRefresh").disabled = journalBusy;
    journalList.querySelectorAll("button").forEach((button) => { button.disabled = journalBusy; });
}

function updateJournalLocalizedText() {
    if (journalData) renderJournal();
}

function journalModuleLabel(module) {
    return journalText({chat: "aiChat", explain: "explain", rag: "journalRag"}[module]);
}

function journalLabeledText(container, key, text, markdown = false) {
    const heading = document.createElement("h4");
    heading.textContent = journalText(key);
    const content = document.createElement("div");
    content.className = "markdown-content";
    if (markdown) renderMarkdown(content, text);
    else {
        content.classList.add("journal-original");
        content.textContent = text;
    }
    container.append(heading, content);
}

function renderJournal() {
    const expanded = new Set([...journalList.querySelectorAll("details[open]")]
        .map((element) => element.dataset.entryId));
    journalList.textContent = "";
    for (const key of ["total", "normal", "starred"]) {
        document.querySelector(`#journal${key[0].toUpperCase() + key.slice(1)}`).textContent = journalData.stats[key];
    }
    document.querySelector("#journalEmpty").hidden = journalData.entries.length > 0;
    for (const entry of journalData.entries) {
        const article = document.createElement("article");
        article.className = `journal-entry${entry.starred ? " is-starred" : ""}`;
        const details = document.createElement("details");
        details.dataset.entryId = entry.id;
        details.open = expanded.has(entry.id);
        const summary = document.createElement("summary");
        const title = document.createElement("span");
        title.className = "journal-entry-title";
        title.textContent = entry.question;
        const metadata = document.createElement("span");
        metadata.className = "journal-entry-meta";
        metadata.textContent = `${new Date(entry.created_at).toLocaleString(currentLanguage === "zh" ? "zh-CN" : "en-US")} · ${journalModuleLabel(entry.module)}`;
        summary.append(title, metadata);
        const content = document.createElement("div");
        content.className = "journal-entry-content";
        journalLabeledText(content, "journalQuestion", entry.question);
        journalLabeledText(content, "journalAnswer", entry.answer, true);
        if (entry.sources.length) {
            const sources = entry.sources.map((source) =>
                `${source.filename}${source.page_number ? ` · ${journalText("documentSourcePage").replace("{number}", source.page_number)}${currentLanguage === "en" ? ` ${source.page_number}` : ""}` : ""}`
            );
            journalLabeledText(content, "journalSources", sources.join("\n"));
        }
        const recordId = document.createElement("p");
        recordId.className = "journal-entry-meta";
        recordId.textContent = `ID: ${entry.id}`;
        content.appendChild(recordId);
        details.append(summary, content);

        const actions = document.createElement("div");
        actions.className = "journal-entry-actions";
        const star = document.createElement("button");
        star.type = "button";
        star.className = "journal-star";
        star.textContent = entry.starred ? "★" : "☆";
        star.setAttribute("aria-pressed", entry.starred);
        star.setAttribute("aria-label", journalText(entry.starred ? "journalUnmark" : "journalMark"));
        star.title = star.getAttribute("aria-label");
        star.addEventListener("click", () => mutateJournal(`/${encodeURIComponent(entry.id)}`, {
            method: "PATCH", body: JSON.stringify({starred: !entry.starred}),
            headers: {"Content-Type": "application/json"}
        }));
        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "journal-secondary";
        remove.textContent = journalText("journalDelete");
        remove.addEventListener("click", () => mutateJournal(`/${encodeURIComponent(entry.id)}`, {method: "DELETE"}));
        actions.append(star, remove);
        article.append(details, actions);
        journalList.appendChild(article);
    }
    const count = journalData.filtered_count;
    document.querySelector("#journalPageStatus").textContent =
        `${count ? journalOffset + 1 : 0}–${Math.min(journalOffset + journalData.entries.length, count)} / ${count}`;
    updateJournalControls();
}

async function loadJournal() {
    const version = ++journalLoadVersion;
    showJournalMessage("journalLoading");
    try {
        const query = journalQuery();
        query.set("offset", journalOffset);
        query.set("limit", journalPageSize);
        const response = await journalFetch(`?${query}`);
        const data = await response.json();
        if (version !== journalLoadVersion) return;
        journalData = data;
        if (journalOffset && journalOffset >= data.filtered_count) {
            journalOffset = Math.max(0, Math.ceil(data.filtered_count / journalPageSize) - 1) * journalPageSize;
            return loadJournal();
        }
        renderJournal();
        showJournalMessage("");
    } catch (error) {
        if (version === journalLoadVersion) showJournalMessage(error.message === "journalDateError" ? error.message : "journalError");
    }
}

async function mutateJournal(path, options) {
    if (journalBusy) return;
    journalBusy = true;
    updateJournalControls();
    try {
        await journalFetch(path, options);
        await loadJournal();
    } catch {
        showJournalMessage("journalError");
    } finally {
        journalBusy = false;
        updateJournalControls();
    }
}

function handleJournalStatus(status) {
    const warning = document.querySelector("#journalCaptureWarning");
    if (status === "error") {
        warning.dataset.i18n = "journalCaptureError";
        warning.textContent = journalText("journalCaptureError");
        warning.hidden = false;
    } else if (status === "saved") {
        warning.hidden = true;
    }
    if (!journalView.hidden) loadJournal();
}

async function exportJournal() {
    if (journalBusy) return;
    journalBusy = true;
    journalExport.dataset.i18n = "journalExporting";
    journalExport.textContent = journalText("journalExporting");
    updateJournalControls();
    try {
        const query = journalQuery(journalExportScope.value === "filtered");
        query.set("language", currentLanguage);
        query.set("utc_offset", -new Date().getTimezoneOffset());
        const response = await journalFetch(`/export?${query}`);
        const url = URL.createObjectURL(await response.blob());
        const link = document.createElement("a");
        link.href = url;
        link.download = "my-learning-journal.pdf";
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 10000);
        showJournalMessage("");
    } catch (error) {
        showJournalMessage(error.message === "journalDateError" ? error.message : "journalExportError");
    } finally {
        journalBusy = false;
        journalExport.dataset.i18n = "journalExport";
        journalExport.textContent = journalText("journalExport");
        updateJournalControls();
    }
}

async function loadJournalSettings() {
    try {
        const response = await journalFetch("/settings");
        journalAutoRecord.checked = (await response.json()).auto_record;
        journalAutoRecord.disabled = false;
    } catch {
        showJournalMessage("journalError");
    }
}

function initializeJournal() {
    loadJournalSettings();
    journalFilters.addEventListener("submit", (event) => event.preventDefault());
    journalFilters.addEventListener("change", () => { journalOffset = 0; loadJournal(); });
    journalFilters.addEventListener("reset", () => {
        window.setTimeout(() => { journalOffset = 0; loadJournal(); }, 0);
    });
    journalAutoRecord.addEventListener("change", async () => {
        const enabled = journalAutoRecord.checked;
        journalAutoRecord.disabled = true;
        try {
            await journalFetch("/settings", {
                method: "PUT", headers: {"Content-Type": "application/json"},
                body: JSON.stringify({auto_record: enabled})
            });
            showJournalMessage("");
        } catch {
            journalAutoRecord.checked = !enabled;
            showJournalMessage("journalError");
        } finally {
            journalAutoRecord.disabled = false;
        }
    });
    document.querySelector("#journalRefresh").addEventListener("click", () => {
        loadJournalSettings(); loadJournal();
    });
    document.querySelector("#journalPrevious").addEventListener("click", () => {
        journalOffset = Math.max(0, journalOffset - journalPageSize); loadJournal();
    });
    document.querySelector("#journalNext").addEventListener("click", () => {
        journalOffset += journalPageSize; loadJournal();
    });
    journalExportScope.addEventListener("change", updateJournalControls);
    journalExport.addEventListener("click", exportJournal);
    journalClear.addEventListener("click", () => {
        journalClearDialog.returnValue = "cancel";
        journalClearDialog.showModal();
    });
    journalClearDialog.addEventListener("close", () => {
        if (journalClearDialog.returnValue === "confirm") {
            mutateJournal("", {
                method: "DELETE", headers: {"Content-Type": "application/json"},
                body: JSON.stringify({confirmed: true})
            });
        }
    });
}
