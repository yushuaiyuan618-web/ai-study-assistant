// DOM contract checks without installing a frontend framework or browser driver.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

class Element {
    constructor(tag = "div") {
        this.tagName = tag;
        this.children = [];
        this.dataset = {};
        this.attributes = {};
        this.listeners = {};
        this.className = "";
        this.value = "";
        this.validity = {valid: true};
        this._text = "";
        this.classList = {add: (name) => { this.className += ` ${name}`; }};
    }
    set textContent(value) { this._text = String(value); this.children = []; }
    get textContent() { return this._text + this.children.map((child) => child.textContent).join(""); }
    set innerHTML(value) { throw new Error("Unsafe innerHTML was used."); }
    append(...children) { this.children.push(...children); }
    appendChild(child) { this.children.push(child); return child; }
    setAttribute(key, value) { this.attributes[key] = String(value); }
    getAttribute(key) { return this.attributes[key]; }
    addEventListener(name, listener) { this.listeners[name] = listener; }
    showModal() { this.open = true; }
    querySelectorAll(selector) {
        const nodes = this.children.flatMap((child) => [child, ...child.querySelectorAll("*")]);
        if (selector === "details[open]") return nodes.filter((node) => node.tagName === "details" && node.open);
        if (selector === "button") return nodes.filter((node) => node.tagName === "button");
        return nodes;
    }
}

const elements = new Map();
const document = {
    querySelector: (selector) => {
        if (!elements.has(selector)) elements.set(selector, new Element());
        return elements.get(selector);
    },
    createElement: (tag) => new Element(tag)
};
const requests = [];
let entries = [{
    id: "entry-1", question: "<img src=x onerror=alert(1)> 中文 question", answer: "**Answer** $x^2$",
    module: "chat", created_at: "2026-11-13T01:00:00+00:00", starred: false, sources: []
}];
let autoRecord = true;
const context = vm.createContext({
    document, console, URLSearchParams, Date, Set,
    renderMarkdown: (container, text) => { container.textContent = text; },
    fetch: async (url, options = {}) => {
        requests.push({url, ...options});
        let payload;
        if (url.includes("/settings")) {
            if (options.body) autoRecord = JSON.parse(options.body).auto_record;
            payload = {auto_record: autoRecord};
        } else if (options.method === "PATCH") {
            entries[0].starred = JSON.parse(options.body).starred;
            payload = {};
        } else if (options.method === "DELETE") {
            entries = [];
            payload = {};
        } else {
            const kind = new URL(url, "http://localhost").searchParams.get("kind");
            const selected = entries.filter((entry) => kind !== "starred" || entry.starred);
            payload = {entries: selected, filtered_count: selected.length,
                stats: {total: entries.length, normal: entries.filter((entry) => !entry.starred).length,
                    starred: entries.filter((entry) => entry.starred).length}};
        }
        return {ok: true, json: async () => JSON.parse(JSON.stringify(payload))};
    },
    window: {setTimeout: (callback) => callback()}
});
const journalSource = fs.readFileSync("frontend/journal.js", "utf8");
const mainSource = fs.readFileSync("frontend/script.js", "utf8");
vm.runInContext(journalSource, context);
vm.runInContext(mainSource.slice(mainSource.indexOf("const translations ="), mainSource.indexOf("const errorTranslationKeyByCode")), context);
vm.runInContext("let currentLanguage = 'en';", context);
elements.get("#journalKind").value = "all";
elements.get("#journalOrder").value = "newest";
elements.get("#journalExportScope").value = "filtered";

(async () => {
    await vm.runInContext("loadJournal()", context);
    const article = elements.get("#journalList").children[0];
    assert.equal(article.className, "journal-entry");
    assert.ok(article.textContent.includes("<img src=x onerror=alert(1)>"));
    assert.ok(article.textContent.includes("Original question"));
    assert.equal(article.children[1].children[0].textContent, "☆");
    await article.children[1].children[0].listeners.click();
    assert.equal(entries[0].starred, true);
    assert.equal(elements.get("#journalList").children[0].className, "journal-entry is-starred");
    assert.equal(elements.get("#journalList").children[0].children[1].children[0].textContent, "★");
    console.log("PASS safe text, star toggle request, important-record DOM and statistics");

    vm.runInContext("currentLanguage = 'zh'; updateJournalLocalizedText();", context);
    assert.ok(elements.get("#journalList").textContent.includes("原始问题"));
    const keys = vm.runInContext("Object.keys(journalTranslations.en).sort()", context);
    assert.equal(JSON.stringify(keys), JSON.stringify(vm.runInContext("Object.keys(journalTranslations.zh).sort()", context)));
    for (const key of keys) assert.ok(vm.runInContext(`translations.zh[${JSON.stringify(key)}]`, context));
    console.log(`PASS all ${keys.length} Journal strings have English and Chinese translations`);

    elements.get("#journalFrom").value = "2026-11-15";
    elements.get("#journalTo").value = "2026-11-13";
    const before = requests.length;
    await vm.runInContext("loadJournal()", context);
    assert.equal(requests.length, before);
    assert.ok(elements.get("#journalMessage").textContent.includes("结束日期"));
    elements.get("#journalFrom").value = "2026-11-13";
    const query = vm.runInContext("journalQuery().toString()", context);
    assert.ok(query.includes("start="));
    assert.ok(query.includes("end="));
    console.log("PASS invalid ranges rejected locally; valid dates include an exclusive next-day bound");

    vm.runInContext("initializeJournal()", context);
    await new Promise((resolve) => setImmediate(resolve));
    const dialog = elements.get("#journalClearDialog");
    dialog.returnValue = "confirm";
    elements.get("#journalClear").listeners.click();
    assert.equal(dialog.returnValue, "cancel");
    const beforeCancel = requests.length;
    dialog.listeners.close();
    assert.equal(requests.length, beforeCancel);
    console.log("PASS reopening clear confirmation resets its result; cancellation cannot delete records");

    const css = fs.readFileSync("frontend/style.css", "utf8");
    assert.match(css, /\.journal-entry\.is-starred \.journal-entry-title,[\s\S]*?color: #bb303b/);
    assert.match(css, /\.documents-view,\s*\.journal-view\s*\{[\s\S]*?min-height: 0;[\s\S]*?overflow-y: auto;/);
    console.log("PASS red marked title/star and contained active-view scrolling CSS contract");
})().catch((error) => { console.error(error); process.exitCode = 1; });
