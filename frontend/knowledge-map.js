const knowledgeMapView = document.querySelector("#knowledgeMapView");
const mapTopic = document.querySelector("#mapTopic");
const mapCanvas = document.querySelector("#mapCanvas");
const mapWorkspace = document.querySelector("#mapWorkspace");
const mapStatus = document.querySelector("#mapStatus");
const mapNote = document.querySelector("#mapNote");
const mapNodeSelect = document.querySelector("#mapNodeSelect");
const mapSearch = document.querySelector("#mapSearch");
const mapDetailContent = document.querySelector("#mapDetailContent");
const mapBranchButton = document.querySelector("#mapToggleBranch");

const knowledgeMapTranslations = {
    en: {
        knowledgeMap: "Knowledge Map", mapSubtitle: "Explore the knowledge taking shape through your learning.",
        mapTopic: "Topic", mapMode: "Map mode", mapMind: "Mind Map", mapGraph: "Knowledge Graph",
        mapRefresh: "Refresh data", mapSearch: "Find a concept by name, alias or keyword", mapFind: "Find",
        mapConcepts: "Concepts in this topic", mapChooseConcept: "Select a concept…", mapControls: "Map controls",
        mapZoomIn: "Zoom in", mapZoomOut: "Zoom out", mapFit: "Fit", mapReset: "Reset view",
        mapCanvas: "Interactive knowledge map", mapDetails: "Concept details", mapClose: "Clear selection",
        mapSelectHint: "Select a concept to explore its definition and connections.",
        mapHint: "Drag to pan or move a node. Scroll or pinch to zoom. Use the concept list to select with a keyboard.",
        mapLoading: "Loading your knowledge…", mapError: "Unable to load this knowledge map. Please refresh to try again.",
        mapDetailError: "Unable to load this concept. Select it again to retry.",
        mapEmpty: "Your map starts with a question. Saved Chat, Explain and document answers build it automatically after knowledge extraction.",
        mapEmptyTopic: "No concepts in this topic yet. Refresh after knowledge extraction finishes.",
        mapNoRelations: "No verified relationships in this topic yet. Concepts are shown without invented connections.",
        mapScope: "Connections are shown within this topic. Topic branches organize membership, not prerequisite relationships.",
        mapLimited: "Showing the first {limit} of {total} concepts for responsiveness. Search covers these loaded concepts only.",
        mapEdgeLimit: "Showing the first 2,000 relationships. Select a concept to emphasize its direct connections.",
        mapNoMatch: "No matching concept in the loaded topic.", mapMatches: "{count} matches. Find again to visit the next.",
        mapDefinition: "Definition", mapAliases: "Aliases", mapKeywords: "Keywords", mapRelated: "Related concepts",
        mapMissing: "Not provided", mapCollapse: "Collapse branch", mapExpand: "Expand branch",
        mapLegend: "Relationship legend", mapPrerequisite: "Prerequisite of →", mapPart: "Part of →",
        mapRelatedType: "Related to ↔", mapContrast: "Contrasts with ↔", mapApplied: "Applied in →",
        mapTopicRoot: "Topic root", mapTopicCount: "{count} concepts in this topic"
    },
    zh: {
        knowledgeMap: "知识地图", mapSubtitle: "探索在日常学习中逐渐形成的知识体系。",
        mapTopic: "主题", mapMode: "地图模式", mapMind: "思维导图", mapGraph: "知识图谱",
        mapRefresh: "刷新数据", mapSearch: "按名称、别名或关键词查找知识点", mapFind: "查找",
        mapConcepts: "本主题知识点", mapChooseConcept: "选择知识点…", mapControls: "地图控制",
        mapZoomIn: "放大", mapZoomOut: "缩小", mapFit: "适应画布", mapReset: "重置视图",
        mapCanvas: "交互式知识地图", mapDetails: "知识点详情", mapClose: "取消选择",
        mapSelectHint: "选择一个知识点，查看定义及关联。",
        mapHint: "拖动画布或节点，滚轮或双指缩放。也可用知识点列表进行键盘选择。",
        mapLoading: "正在加载知识…", mapError: "暂时无法加载知识地图，请刷新重试。",
        mapDetailError: "暂时无法加载此知识点，请重新选择以重试。",
        mapEmpty: "从一个问题开始。保存的聊天、知识讲解和文档问答会在知识提取完成后自动构建地图。",
        mapEmptyTopic: "此主题暂无知识点，知识提取完成后请刷新。",
        mapNoRelations: "此主题暂无经过验证的知识关系，仅展示知识点，不编造关联。",
        mapScope: "仅展示主题内的关联。主题分支表示归属，不代表前置知识关系。",
        mapLimited: "为保持流畅，显示 {total} 个知识点中的前 {limit} 个，搜索也仅覆盖已加载的知识点。",
        mapEdgeLimit: "仅展示前 2,000 条关联。选择知识点可突出显示其直接关联。",
        mapNoMatch: "已加载的主题中没有匹配的知识点。", mapMatches: "找到 {count} 项，再次查找可定位下一项。",
        mapDefinition: "简洁定义", mapAliases: "别名", mapKeywords: "关键词", mapRelated: "相关知识点数量",
        mapMissing: "暂无", mapCollapse: "收起分支", mapExpand: "展开分支",
        mapLegend: "关系图例", mapPrerequisite: "前置知识 →", mapPart: "从属关系 →",
        mapRelatedType: "相关关系 ↔", mapContrast: "对比关系 ↔", mapApplied: "应用关系 →",
        mapTopicRoot: "主题根节点", mapTopicCount: "此主题包含 {count} 个知识点"
    }
};

const mapRelationKeys = {
    prerequisite_of: "mapPrerequisite", part_of: "mapPart", related_to: "mapRelatedType",
    contrasts_with: "mapContrast", applied_in: "mapApplied"
};
const MAP_NODE_LIMIT = 500;
const mapState = {
    topics: [], concepts: [], relations: [], total: 0, edgesTruncated: false, topicId: "", mode: "mind",
    cy: null, parents: new Map(), collapsed: new Set(), selected: null, detail: null,
    controller: null, detailController: null, loading: false, loaded: false,
    statusKey: "", statusValues: {}, searchIndex: -1, lastSearch: ""
};

function mapText(key, values = {}) {
    let text = translations[currentLanguage][key];
    for (const [name, value] of Object.entries(values)) text = text.replaceAll(`{${name}}`, value);
    return text;
}

function setMapStatus(key = "", values = {}) {
    mapState.statusKey = key;
    mapState.statusValues = values;
    mapStatus.textContent = key ? mapText(key, values) : "";
    mapStatus.hidden = !key;
    mapStatus.classList.toggle("is-error", key === "mapError");
}

async function mapRequest(path, signal) {
    const controller = new AbortController();
    const abort = () => controller.abort();
    signal.addEventListener("abort", abort, { once: true });
    const timer = window.setTimeout(abort, 20000);
    try {
        const response = await fetch(`/api/knowledge/${path}`, { signal: controller.signal, cache: "no-store" });
        if (!response.ok) throw new Error("Knowledge request failed");
        return await response.json();
    } finally {
        window.clearTimeout(timer);
        signal.removeEventListener("abort", abort);
    }
}

function mapStrings(value) {
    return Array.isArray(value) ? value.filter((item) => typeof item === "string" && item.trim()) : [];
}

function mapNameKey(value) {
    return String(value).normalize("NFKC").toLocaleLowerCase().trim();
}

function mapOption(value, text) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = text;
    return option;
}

function updateMapSelectors() {
    mapTopic.replaceChildren(...mapState.topics.map((topic) => mapOption(topic.id, topic.name)));
    mapTopic.value = mapState.topicId;
    mapTopic.disabled = !mapState.topics.length;
    mapNodeSelect.replaceChildren(mapOption("", mapText("mapChooseConcept")),
        ...mapState.concepts.map((concept) => mapOption(concept.id, concept.name)));
    mapNodeSelect.value = mapState.concepts.some((node) => node.id === mapState.selected) ? mapState.selected : "";
    mapNodeSelect.disabled = mapSearch.disabled = !mapState.concepts.length || mapState.loading;
    document.querySelector("#mapSearchButton").disabled = mapSearch.disabled;
}

function disposeKnowledgeMap() {
    if (mapState.cy) mapState.cy.destroy();
    mapState.cy = null;
}

async function loadKnowledgeMap(refreshTopics = false) {
    mapState.controller?.abort();
    mapState.detailController?.abort();
    const controller = new AbortController();
    mapState.controller = controller;
    mapState.loading = true;
    mapState.loaded = false;
    mapState.concepts = [];
    mapState.relations = [];
    mapState.collapsed.clear();
    mapState.selected = mapState.detail = null;
    disposeKnowledgeMap();
    mapWorkspace.hidden = true;
    mapNote.hidden = true;
    document.querySelector("#mapLegend").hidden = true;
    knowledgeMapView.setAttribute("aria-busy", "true");
    setMapStatus("mapLoading");
    updateMapSelectors();
    try {
        if (refreshTopics || !mapState.topics.length) {
            const result = await mapRequest("topics", controller.signal);
            if (controller.signal.aborted) return;
            if (!Array.isArray(result.items)) throw new Error("Invalid topics");
            mapState.topics = result.items.filter((topic) => typeof topic.id === "string" && typeof topic.name === "string");
            if (!mapState.topics.some((topic) => topic.id === mapState.topicId)) {
                mapState.topicId = mapState.topics[0]?.id || "";
            }
        }
        if (!mapState.topicId) {
            mapState.loaded = true;
            setMapStatus("mapEmpty");
            return;
        }
        const path = `topics/${encodeURIComponent(mapState.topicId)}`;
        const [nodes, edges] = await Promise.all([
            mapRequest(`${path}/concepts?limit=${MAP_NODE_LIMIT}`, controller.signal),
            mapRequest(`${path}/relations?limit=${MAP_NODE_LIMIT}`, controller.signal)
        ]);
        if (controller.signal.aborted) return;
        if (!Array.isArray(nodes.items) || !Array.isArray(edges.items)) throw new Error("Invalid graph");
        const ids = new Set();
        mapState.concepts = nodes.items.filter((node) => {
            if (typeof node.id !== "string" || typeof node.name !== "string" || !node.name.trim() || ids.has(node.id)) return false;
            ids.add(node.id);
            return true;
        });
        mapState.total = Number(nodes.total) || mapState.concepts.length;
        mapState.relations = edges.items.filter((edge) =>
            typeof edge.id === "string" && ids.has(edge.source_id) && ids.has(edge.target_id) &&
            edge.source_id !== edge.target_id && Object.hasOwn(mapRelationKeys, edge.relation_type));
        mapState.edgesTruncated = Boolean(edges.truncated);
        mapState.parents = mapState.edgesTruncated ? new Map() : buildMapParents(mapState.concepts, mapState.relations);
        mapState.loaded = true;
        setMapStatus(mapState.concepts.length ? "" : "mapEmptyTopic");
        if (mapState.concepts.length) renderKnowledgeMap();
    } catch (error) {
        if (!controller.signal.aborted) setMapStatus("mapError");
    } finally {
        if (mapState.controller === controller) {
            mapState.loading = false;
            knowledgeMapView.setAttribute("aria-busy", "false");
            updateMapSelectors();
        }
    }
}

// Only an unambiguous, acyclic part_of parent becomes a concept branch.
// Topic membership edges are presentation only, never saved as knowledge relations.
function buildMapParents(concepts, relations) {
    const ids = new Set(concepts.map((node) => node.id));
    const candidates = new Map();
    for (const edge of relations) {
        if (edge.relation_type !== "part_of" || !ids.has(edge.source_id) || !ids.has(edge.target_id)) continue;
        if (!candidates.has(edge.source_id)) candidates.set(edge.source_id, new Set());
        candidates.get(edge.source_id).add(edge.target_id);
    }
    const parents = new Map();
    for (const [child, choices] of candidates) if (choices.size === 1) parents.set(child, [...choices][0]);
    for (const child of parents.keys()) {
        const visited = new Set([child]);
        let parent = parents.get(child);
        while (parent) {
            if (visited.has(parent)) { parents.delete(child); break; }
            visited.add(parent);
            parent = parents.get(parent);
        }
    }
    return parents;
}

function mapRootId() { return `topic:${mapState.topicId}`; }

function mapChildren(id) {
    return mapState.concepts.filter((node) => (mapState.parents.get(node.id) || mapRootId()) === id);
}

function mapNodeVisible(id) {
    let parent = mapState.parents.get(id) || mapRootId();
    while (parent) {
        if (mapState.collapsed.has(parent)) return false;
        parent = mapState.parents.get(parent);
    }
    return !mapState.collapsed.has(mapRootId());
}

function mapElements() {
    const nodes = mapState.concepts.filter((node) => mapState.mode !== "mind" || mapNodeVisible(node.id));
    const label = (name) => name.length > 32 ? `${name.slice(0, 31)}…` : name;
    const elements = nodes.map((node) => ({ data: { id: node.id, label: label(node.name) } }));
    if (mapState.mode === "mind") {
        const topic = mapState.topics.find((item) => item.id === mapState.topicId);
        elements.unshift({ data: { id: mapRootId(), label: label(topic.name) }, classes: "topic-root" });
        for (const node of nodes) elements.push({
            data: { id: `branch:${node.id}`, source: mapState.parents.get(node.id) || mapRootId(), target: node.id },
            classes: mapState.parents.has(node.id) ? "component-branch" : "topic-branch"
        });
    } else {
        for (const edge of mapState.relations) elements.push({
            data: { id: `relation:${edge.id}`, source: edge.source_id, target: edge.target_id,
                label: mapText(mapRelationKeys[edge.relation_type]).replace(/ [→↔]$/, ""), type: edge.relation_type },
            classes: edge.relation_type
        });
    }
    return elements;
}

function mapStyles() {
    return [
        { selector: "node", style: {
            "shape": "round-rectangle", "width": 136, "height": 70, "background-color": "#f7f7f8",
            "border-width": 1, "border-color": "#dcdce3", "label": "data(label)", "font-size": 13,
            "font-family": "system-ui, sans-serif", "color": "#303039", "text-wrap": "wrap",
            "text-max-width": 120, "text-valign": "center", "text-halign": "center", "text-overflow-wrap": "anywhere"
        } },
        { selector: ".topic-root", style: { "background-color": "#eeedf6", "border-color": "#bcb8d6", "font-weight": 600 } },
        { selector: "node:selected", style: { "border-color": "#504a8e", "border-width": 2, "background-color": "#eeedf6" } },
        { selector: "edge", style: {
            "width": 1.3, "line-color": "#a3a2ae", "target-arrow-color": "#a3a2ae", "target-arrow-shape": "triangle",
            "curve-style": "bezier", "label": "data(label)", "font-size": 10, "color": "#656471",
            "text-background-color": "#fff", "text-background-opacity": 1, "text-background-padding": "3px",
            "text-rotation": "autorotate", "text-margin-y": -7, "arrow-scale": 0.85
        } },
        { selector: ".topic-branch, .component-branch", style: { "label": "", "target-arrow-shape": "none", "curve-style": "taxi", "taxi-direction": "downward" } },
        { selector: ".topic-branch", style: { "line-style": "dotted", "line-color": "#c7c5d2" } },
        { selector: ".prerequisite_of", style: { "line-color": "#797293", "target-arrow-color": "#797293" } },
        { selector: ".part_of", style: { "line-style": "dashed" } },
        { selector: ".related_to", style: { "target-arrow-shape": "none", "line-style": "dotted" } },
        { selector: ".contrasts_with", style: { "target-arrow-shape": "none", "line-style": "dashed", "line-color": "#9b8072" } },
        { selector: ".applied_in", style: { "line-color": "#70888d", "target-arrow-color": "#70888d" } },
        { selector: ".is-muted", style: { "opacity": 0.2 } }
    ];
}

function layoutKnowledgeMap() {
    const cy = mapState.cy;
    if (!cy) return;
    cy.resize();
    cy.layout(mapState.mode === "mind" ? {
        name: "breadthfirst", directed: true, roots: [mapRootId()], spacingFactor: 1.05,
        avoidOverlap: true, nodeDimensionsIncludeLabels: true, padding: 40, animate: false
    } : {
        name: "cose", animate: false, randomize: true, nodeDimensionsIncludeLabels: true,
        nodeRepulsion: () => 14000, idealEdgeLength: () => 160, componentSpacing: 100,
        numIter: mapState.concepts.length > 150 ? 250 : 700, padding: 40
    }).run();
    fitKnowledgeMap();
}

function fitKnowledgeMap() {
    if (!mapState.cy) return;
    mapState.cy.resize();
    mapState.cy.fit(undefined, 40);
    if (mapState.cy.zoom() > 1.1) mapState.cy.zoom(1.1).center();
}

function renderKnowledgeMap() {
    disposeKnowledgeMap();
    try {
        if (typeof cytoscape !== "function") throw new Error("Map library unavailable");
        mapWorkspace.hidden = false;
        mapState.cy = cytoscape({
            container: mapCanvas, elements: mapElements(), style: mapStyles(), layout: { name: "preset" },
            minZoom: 0.01, maxZoom: 3, boxSelectionEnabled: false, selectionType: "single",
            hideEdgesOnViewport: mapState.concepts.length > 150, pixelRatio: "auto"
        });
        mapState.cy.on("tap", "node", (event) => selectMapNode(event.target.id(), false));
        mapState.cy.on("tap", (event) => { if (event.target === mapState.cy) clearMapSelection(); });
        layoutKnowledgeMap();
        updateMapNotes();
        renderMapDetails();
        updateMapBranchButton();
    } catch (error) {
        disposeKnowledgeMap();
        mapWorkspace.hidden = true;
        mapState.loaded = false;
        setMapStatus("mapError");
    }
}

function updateMapNotes() {
    mapNote.hidden = !mapState.concepts.length;
    mapNote.textContent = [mapText("mapScope"),
        mapState.mode === "graph" && !mapState.relations.length ? mapText("mapNoRelations") : "",
        mapState.total > MAP_NODE_LIMIT ? mapText("mapLimited", { limit: MAP_NODE_LIMIT, total: mapState.total }) : "",
        mapState.edgesTruncated ? mapText("mapEdgeLimit") : ""
    ].filter(Boolean).join(" ");
    const legend = document.querySelector("#mapLegend");
    legend.replaceChildren();
    for (const [type, key] of Object.entries(mapRelationKeys)) {
        const item = document.createElement("li");
        item.className = `map-legend-${type}`;
        item.textContent = mapText(key);
        legend.append(item);
    }
    legend.hidden = mapState.mode !== "graph" || !mapState.concepts.length;
}

function renderMapDetails() {
    mapWorkspace.classList.toggle("has-selection", Boolean(mapState.selected));
    document.querySelector("#mapDetail").hidden = !mapState.selected;
    mapDetailContent.replaceChildren();
    const paragraph = (text) => { const item = document.createElement("p"); item.textContent = text; mapDetailContent.append(item); };
    if (!mapState.selected) { paragraph(mapText("mapSelectHint")); return; }
    if (mapState.selected === mapRootId()) {
        paragraph(mapState.topics.find((topic) => topic.id === mapState.topicId).name);
        paragraph(mapText("mapTopicRoot"));
        paragraph(mapText("mapTopicCount", { count: mapState.total }));
        return;
    }
    if (!mapState.detail) { paragraph(mapText("mapLoading")); return; }
    if (mapState.detail.error) { paragraph(mapText("mapDetailError")); return; }
    const concept = mapState.detail;
    const title = document.createElement("h4");
    title.textContent = concept.name;
    mapDetailContent.append(title);
    for (const [key, value] of [
        ["mapDefinition", concept.definition], ["mapTopic", concept.topic_name],
        ["mapAliases", mapStrings(concept.aliases).join(" · ")],
        ["mapKeywords", mapStrings(concept.keywords).join(" · ")], ["mapRelated", String(concept.relatedCount)]
    ]) {
        const label = document.createElement("h5");
        label.textContent = mapText(key);
        mapDetailContent.append(label);
        paragraph(typeof value === "string" && value.trim() ? value : mapText("mapMissing"));
    }
}

function updateMapBranchButton() {
    const id = mapState.selected;
    mapBranchButton.hidden = mapState.mode !== "mind" || !id || !mapChildren(id).length;
    mapBranchButton.textContent = mapText(mapState.collapsed.has(id) ? "mapExpand" : "mapCollapse");
    mapBranchButton.setAttribute("aria-expanded", String(!mapState.collapsed.has(id)));
}

function clearMapSelection() {
    mapState.detailController?.abort();
    mapState.selected = mapState.detail = null;
    mapState.cy?.nodes().unselect();
    mapState.cy?.elements().removeClass("is-muted");
    mapNodeSelect.value = "";
    renderMapDetails();
    updateMapBranchButton();
    mapState.cy?.resize();
}

async function selectMapNode(id, focus = true) {
    if (!mapState.cy) return;
    mapState.detailController?.abort();
    const controller = new AbortController();
    mapState.detailController = controller;
    mapState.selected = id;
    mapState.detail = null;
    if (mapState.mode === "mind") {
        let parent = mapState.parents.get(id) || mapRootId();
        let changed = false;
        while (parent) {
            changed = mapState.collapsed.delete(parent) || changed;
            parent = mapState.parents.get(parent);
        }
        if (changed) renderKnowledgeMap();
    }
    if (!mapState.cy) return;
    mapState.cy.nodes().unselect();
    const node = mapState.cy.getElementById(id);
    node.select();
    mapState.cy.elements().removeClass("is-muted");
    if (mapState.mode === "graph") mapState.cy.elements().difference(node.closedNeighborhood()).addClass("is-muted");
    mapNodeSelect.value = id === mapRootId() ? "" : id;
    renderMapDetails();
    updateMapBranchButton();
    mapState.cy.resize();
    if (focus) {
        const neighborhood = node.closedNeighborhood();
        if (mapState.mode === "graph" && neighborhood.nodes().length > 1 && neighborhood.nodes().length <= 6) {
            mapState.cy.fit(neighborhood, 45);
            if (mapState.cy.zoom() > 1.1) mapState.cy.zoom(1.1).center(neighborhood);
        } else {
            mapState.cy.zoom(Math.max(mapState.cy.zoom(), 0.85));
            mapState.cy.center(node);
        }
    } else {
        const position = node.renderedPosition();
        if (position.x < 30 || position.x > mapState.cy.width() - 30) mapState.cy.center(node);
    }
    if (id === mapRootId()) return;
    try {
        const path = `concepts/${encodeURIComponent(id)}`;
        const [concept, relations] = await Promise.all([
            mapRequest(path, controller.signal), mapRequest(`${path}/relations`, controller.signal)
        ]);
        if (controller.signal.aborted) return;
        if (concept.id !== id || !Array.isArray(relations.items)) throw new Error("Invalid concept detail");
        const relatedIds = new Set();
        for (const edge of relations.items) {
            if (edge.source_id === id && edge.target_id !== id) relatedIds.add(edge.target_id);
            if (edge.target_id === id && edge.source_id !== id) relatedIds.add(edge.source_id);
        }
        mapState.detail = { ...concept, relatedCount: relatedIds.size };
    } catch (error) {
        if (controller.signal.aborted) return;
        mapState.detail = { error: true };
    }
    renderMapDetails();
}

function updateKnowledgeMapLanguage() {
    updateMapSelectors();
    setMapStatus(mapState.statusKey, mapState.statusValues);
    updateMapNotes();
    renderMapDetails();
    updateMapBranchButton();
    // Labels change without relayout, losing the selection, or calling the AI.
    mapState.cy?.edges().forEach((edge) => {
        if (edge.data("type")) edge.data("label", mapText(mapRelationKeys[edge.data("type")]).replace(/ [→↔]$/, ""));
    });
}

function openKnowledgeMap() {
    if (!mapState.loaded && !mapState.loading) loadKnowledgeMap(true);
    else window.requestAnimationFrame(() => { if (mapState.cy) { mapState.cy.resize(); fitKnowledgeMap(); } });
}

function initializeKnowledgeMap() {
    document.querySelector("#mapRefresh").addEventListener("click", () => loadKnowledgeMap(true));
    mapTopic.addEventListener("change", () => { mapState.topicId = mapTopic.value; loadKnowledgeMap(); });
    document.querySelectorAll("[data-map-mode]").forEach((button) => {
        button.addEventListener("click", () => {
            if (mapState.mode === button.dataset.mapMode) return;
            mapState.mode = button.dataset.mapMode;
            document.querySelectorAll("[data-map-mode]").forEach((item) => {
                const active = item.dataset.mapMode === mapState.mode;
                item.classList.toggle("active", active);
                item.setAttribute("aria-pressed", String(active));
            });
            if (mapState.concepts.length) {
                const selected = mapState.selected;
                if (selected === mapRootId() && mapState.mode === "graph") clearMapSelection();
                renderKnowledgeMap();
                if (mapState.selected && mapState.cy) selectMapNode(mapState.selected, false);
            }
        });
    });
    document.querySelector("#mapSearchForm").addEventListener("submit", (event) => {
        event.preventDefault();
        const query = mapNameKey(mapSearch.value);
        if (!query) return;
        const matches = mapState.concepts.filter((node) => [node.name, ...mapStrings(node.aliases), ...mapStrings(node.keywords)]
            .some((name) => mapNameKey(name).includes(query)));
        if (!matches.length) { setMapStatus("mapNoMatch"); return; }
        mapState.searchIndex = query === mapState.lastSearch ? (mapState.searchIndex + 1) % matches.length : 0;
        mapState.lastSearch = query;
        setMapStatus("mapMatches", { count: matches.length });
        selectMapNode(matches[mapState.searchIndex].id);
    });
    mapNodeSelect.addEventListener("change", () => mapNodeSelect.value ? selectMapNode(mapNodeSelect.value) : clearMapSelection());
    document.querySelector("#mapCloseDetail").addEventListener("click", clearMapSelection);
    document.querySelector("#mapZoomIn").addEventListener("click", () => zoomKnowledgeMap(1.25));
    document.querySelector("#mapZoomOut").addEventListener("click", () => zoomKnowledgeMap(0.8));
    document.querySelector("#mapFit").addEventListener("click", fitKnowledgeMap);
    document.querySelector("#mapReset").addEventListener("click", () => {
        mapState.collapsed.clear();
        clearMapSelection();
        if (mapState.concepts.length) renderKnowledgeMap();
        mapSearch.value = "";
        mapState.lastSearch = "";
        setMapStatus();
    });
    mapBranchButton.addEventListener("click", () => {
        const id = mapState.selected;
        if (!id || !mapChildren(id).length) return;
        if (mapState.collapsed.has(id)) mapState.collapsed.delete(id); else mapState.collapsed.add(id);
        renderKnowledgeMap();
        mapState.cy?.getElementById(id).select();
    });
    new ResizeObserver(() => { if (!knowledgeMapView.hidden) mapState.cy?.resize(); }).observe(mapCanvas);
}

function zoomKnowledgeMap(factor) {
    const cy = mapState.cy;
    if (cy) cy.zoom({ level: Math.min(cy.maxZoom(), Math.max(cy.minZoom(), cy.zoom() * factor)),
        renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 } });
}
