// Real Cytoscape layouts, test-only API fixtures and a small safe-DOM harness.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const cytoscape = require("../frontend/vendor/cytoscape/cytoscape-3.35.0.min.js");

class Element {
    constructor() {
        this.children = []; this.value = ""; this.dataset = {}; this.listeners = {}; this.attributes = {};
        this.hidden = false; this.disabled = false; this.className = ""; this._text = "";
        this.classes = new Set();
        this.classList = { toggle: (key, active) => active ? this.classes.add(key) : this.classes.delete(key) };
    }
    set textContent(value) { this._text = String(value); this.children = []; }
    get textContent() { return this._text + this.children.map((node) => node.textContent).join(""); }
    set innerHTML(value) { throw new Error("Unsafe HTML insertion"); }
    append(...nodes) { this.children.push(...nodes); }
    replaceChildren(...nodes) { this.children = nodes; this._text = ""; }
    setAttribute(key, value) { this.attributes[key] = String(value); }
    addEventListener(key, listener) { this.listeners[key] = listener; }
}

const elements = new Map();
const element = (key) => {
    if (!elements.has(key)) elements.set(key, new Element());
    return elements.get(key);
};
const modeButtons = ["mind", "graph"].map((mode) => { const node = new Element(); node.dataset.mapMode = mode; return node; });
const requests = [];
let topics = [{ id: "ml", name: "Machine Learning" }, { id: "empty", name: "Empty topic" }];
let nodes = [
    { id: "a", name: "Gradient Descent", aliases: ["梯度下降"], keywords: ["optimizer"] },
    { id: "b", name: "Optimization" }, { id: "c", name: "Machine Learning" },
    { id: "d", name: "<img src=x onerror=alert(1)>" }
];
let relations = [
    { id: "1", source_id: "a", target_id: "b", relation_type: "part_of" },
    { id: "2", source_id: "b", target_id: "c", relation_type: "part_of" },
    { id: "3", source_id: "a", target_id: "d", relation_type: "related_to" },
    { id: "4", source_id: "a", target_id: "d", relation_type: "contrasts_with" },
    { id: "5", source_id: "c", target_id: "a", relation_type: "prerequisite_of" },
    { id: "6", source_id: "b", target_id: "a", relation_type: "applied_in" }
];
let fail = false;
let delayTopic = false;
let releaseTopic;
const context = vm.createContext({
    console, AbortController, Set, Map,
    document: { querySelector: element, createElement: () => new Element(), querySelectorAll: () => modeButtons },
    window: { setTimeout, clearTimeout, requestAnimationFrame: (callback) => callback() },
    ResizeObserver: class { observe() {} },
    // The VM has a different Object prototype; pass host-realm JSON to the real library.
    cytoscape: (options) => {
        const cy = cytoscape({ ...options, headless: true, container: undefined, styleEnabled: true,
            elements: JSON.parse(JSON.stringify(options.elements)), style: JSON.parse(JSON.stringify(options.style)) });
        const zoom = cy.zoom.bind(cy);
        cy.zoom = (value) => zoom(value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value);
        return cy;
    },
    fetch: async (url, options) => {
        requests.push(url);
        if (delayTopic && url.includes("topics/ml/concepts")) await new Promise((resolve) => { releaseTopic = resolve; });
        if (options.signal.aborted) throw new Error("Aborted");
        if (fail) return { ok: false };
        let payload;
        if (url.endsWith("/topics")) payload = { items: topics };
        else if (url.includes("topics/empty")) payload = { items: [], total: 0 };
        else if (url.includes("/concepts?")) payload = { items: nodes, total: nodes.length };
        else if (url.includes("topics/ml/relations")) payload = { items: relations };
        else if (url.endsWith("/relations")) payload = { items: relations };
        else {
            const id = url.split("/").pop();
            payload = { ...nodes.find((node) => node.id === id), definition: "<script>alert(1)</script> 中文 definition", topic_name: "Machine Learning" };
        }
        return { ok: true, json: async () => JSON.parse(JSON.stringify(payload)) };
    }
});
const source = fs.readFileSync("frontend/knowledge-map.js", "utf8");
vm.runInContext(source, context);
vm.runInContext("const translations = knowledgeMapTranslations; let currentLanguage = 'en'; initializeKnowledgeMap();", context);
const run = (code) => vm.runInContext(code, context);
const json = (code) => JSON.parse(JSON.stringify(run(code)));
const settle = () => new Promise((resolve) => setImmediate(resolve));

(async () => {
    await run("loadKnowledgeMap(true)");
    assert.equal(run("mapState.loaded"), true);
    assert.equal(run("mapState.cy.nodes().length"), 5);
    assert.equal(run("mapState.cy.edges().length"), 4);
    assert.equal(run("mapState.parents.get('a')"), "b");
    assert.equal(run("mapState.parents.get('b')"), "c");
    assert.equal(run("mapState.parents.has('d')"), false);
    const membership = json("mapElements().filter(e => e.classes === 'topic-branch').map(e => e.data.target).sort()");
    assert.deepEqual(membership, ["c", "d"]);
    assert.equal(requests.length, 3);
    console.log("PASS existing fields, bounded loading and true part_of hierarchy; no fabricated concept parents");

    const cyclic = run("buildMapParents([{id:'x'},{id:'y'}], [{source_id:'x',target_id:'y',relation_type:'part_of'}, {source_id:'y',target_id:'x',relation_type:'part_of'}])");
    assert.ok(cyclic.size < 2);
    assert.equal(run("buildMapParents([{id:'x'},{id:'y'},{id:'z'}], [{source_id:'x',target_id:'y',relation_type:'part_of'}, {source_id:'x',target_id:'z',relation_type:'part_of'}]).has('x')"), false);
    run("mapState.collapsed.add('b'); renderKnowledgeMap();");
    assert.equal(run("mapState.cy.getElementById('a').length"), 0);
    assert.equal(run("mapState.cy.getElementById('b').length"), 1);
    element("#mapSearch").value = "梯度下降";
    element("#mapSearchForm").listeners.submit({ preventDefault() {} });
    await settle();
    assert.equal(run("mapState.selected"), "a");
    assert.equal(run("mapState.collapsed.has('b')"), false);
    assert.equal(run("mapState.cy.getElementById('a').selected()"), true);
    assert.ok(element("#mapDetailContent").textContent.includes("<script>alert(1)</script>"));
    assert.ok(element("#mapDetailContent").textContent.includes("中文 definition"));
    assert.equal(run("mapState.detail.relatedCount"), 3);
    assert.equal(requests.filter((path) => path.endsWith("/sources")).length, 0);
    console.log("PASS cycle/ambiguous-parent safety, collapsed branch reveal, Chinese alias search and safe API details");

    modeButtons[1].listeners.click();
    await settle();
    assert.equal(run("mapState.topicId"), "ml");
    assert.equal(run("mapState.mode"), "graph");
    assert.equal(run("mapState.cy.nodes().length"), 4);
    assert.equal(run("mapState.cy.edges().length"), 6);
    assert.equal(run("mapState.cy.getElementById('relation:6').data('source')"), "b");
    for (const type of ["related_to", "contrasts_with"]) assert.equal(run(`mapState.cy.edges('.${type}')[0].style('target-arrow-shape')`), "none");
    for (const type of ["prerequisite_of", "part_of", "applied_in"]) assert.equal(run(`mapState.cy.edges('.${type}')[0].style('target-arrow-shape')`), "triangle");
    assert.ok(run("mapState.cy.nodes().every(n => Number.isFinite(n.position().x) && Number.isFinite(n.position().y))"));
    run("mapState.cy.zoom(0.5); zoomKnowledgeMap(1.25);");
    assert.equal(run("mapState.cy.zoom()"), 0.625);
    element("#mapReset").listeners.click();
    assert.equal(run("mapState.selected"), null);
    assert.equal(run("mapState.collapsed.size"), 0);
    console.log("PASS real CoSE/breadthfirst layouts, all actual directions, symmetric arrows, zoom and reset");

    run("currentLanguage = 'zh'; updateKnowledgeMapLanguage();");
    assert.ok(run("mapState.cy.edges('.applied_in')[0].data('label')").includes("应用"));
    assert.deepEqual(json("Object.keys(knowledgeMapTranslations.en).sort()"), json("Object.keys(knowledgeMapTranslations.zh).sort()"));
    const html = fs.readFileSync("frontend/index.html", "utf8");
    for (const [, key] of html.matchAll(/data-i18n(?:-placeholder|-aria-label)?="(map\w+|knowledgeMap)"/g)) {
        assert.ok(run(`knowledgeMapTranslations.en[${JSON.stringify(key)}]`), key);
        assert.ok(run(`knowledgeMapTranslations.zh[${JSON.stringify(key)}]`), key);
    }
    assert.equal(/innerHTML|insertAdjacentHTML/.test(source), false);
    assert.equal(/https?:\/\//.test(source), false);
    console.log("PASS complete bilingual strings, localized graph labels and no external runtime/unsafe HTML");

    delayTopic = true;
    const pending = run("loadKnowledgeMap()");
    await settle();
    run("mapState.topicId = 'empty'");
    await run("loadKnowledgeMap()");
    releaseTopic();
    await pending;
    delayTopic = false;
    assert.equal(run("mapState.topicId"), "empty");
    assert.equal(run("mapState.concepts.length"), 0);
    assert.equal(run("mapState.statusKey"), "mapEmptyTopic");
    assert.equal(element("#knowledgeMapView").attributes["aria-busy"], "false");
    topics = [];
    await run("loadKnowledgeMap(true)");
    assert.equal(run("mapState.statusKey"), "mapEmpty");
    assert.equal(element("#mapTopic").disabled, true);
    fail = true;
    await run("loadKnowledgeMap(true)");
    assert.equal(run("mapState.statusKey"), "mapError");
    assert.equal(run("mapState.loading"), false);
    assert.equal(element("#mapWorkspace").hidden, true);
    fail = false;
    topics = [{ id: "ml", name: "Machine Learning" }];
    relations = [];
    await run("loadKnowledgeMap(true)");
    assert.ok(element("#mapNote").textContent.includes("暂无经过验证"));
    console.log("PASS stale-request isolation, empty topics/nodes, no relations, safe API errors and recovery");

    nodes = [{ id: "a", name: "Only concept" }];
    await run("loadKnowledgeMap(true)");
    await run("selectMapNode('a')");
    assert.ok(element("#mapDetailContent").textContent.includes("暂无"));
    fail = true;
    await run("selectMapNode('a')");
    assert.ok(element("#mapDetailContent").textContent.includes("重新选择"));
    fail = false;
    await run("selectMapNode('a')");
    assert.equal(run("mapState.detail.error"), undefined);
    run("mapState.total = 501; updateMapNotes()");
    assert.ok(element("#mapNote").textContent.includes("501"));
    assert.ok(element("#mapNote").textContent.includes("500"));
    console.log("PASS optional-field fallbacks, detail retry and explicit large-topic disclosure");

    nodes = Array.from({ length: 500 }, (_, index) => ({ id: `large-${index}`, name: `Concept ${index}` }));
    const started = performance.now();
    await run("loadKnowledgeMap(true)");
    assert.equal(run("mapState.cy.nodes().length"), 500);
    assert.ok(run("mapState.cy.nodes().every(n => Number.isFinite(n.position().x) && Number.isFinite(n.position().y))"));
    const renderer = context.cytoscape;
    context.cytoscape = undefined;
    run("renderKnowledgeMap()");
    assert.equal(run("mapState.statusKey"), "mapError");
    assert.equal(run("mapState.cy"), null);
    assert.equal(element("#mapWorkspace").hidden, true);
    context.cytoscape = renderer;
    nodes = [{ id: "a", name: "Recovered concept" }];
    await run("loadKnowledgeMap(true)");
    assert.equal(run("mapState.cy.nodes().length"), 1);
    run("disposeKnowledgeMap()");
    console.log(`PASS 500-node CoSE smoke, unavailable-library fallback and recovery (${Math.round(performance.now() - started)} ms)`);
})().catch((error) => { run("disposeKnowledgeMap()"); console.error(error); process.exitCode = 1; });
