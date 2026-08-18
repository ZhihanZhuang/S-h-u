(() => {
  "use strict";

  const data = window.DICTIONARY_DATA;
  const PAGE_SIZE_KEY = "sahehehu-zdi-page-size-v1";
  const STORAGE_KEY = "sahehehu-zdi-edits-v2";
  const GITHUB_TOKEN_KEY = "sahehehu-zdi-github-token-v1";
  const GITHUB_REPO = "ZhihanZhuang/S-h-u";
  const GITHUB_DATA_PATH = "data.js";
  const collator = new Intl.Collator(undefined, { sensitivity: "base", numeric: true });
  const savedPageSize = Number(localStorage.getItem(PAGE_SIZE_KEY));
  const state = { query: "", pos: "", category: "", sort: "native", page: 1, hasSearched: false, pageSize: [20, 40, 60, 100].includes(savedPageSize) ? savedPageSize : 60 };
  let currentEntry = null;

  const elements = {
    headerCount: document.querySelector("#headerCount"),
    search: document.querySelector("#searchInput"),
    clear: document.querySelector("#clearSearch"),
    pos: document.querySelector("#posFilter"),
    category: document.querySelector("#categoryFilter"),
    pageSize: document.querySelector("#pageSize"),
    sortButtons: [...document.querySelectorAll("[data-sort]")],
    reset: document.querySelector("#resetFilters"),
    add: document.querySelector("#addEntry"),
    export: document.querySelector("#exportData"),
    githubSync: document.querySelector("#githubSync"),
    githubDialog: document.querySelector("#githubDialog"),
    githubForm: document.querySelector("#githubForm"),
    githubToken: document.querySelector("#githubToken"),
    githubStatus: document.querySelector("#githubStatus"),
    closeGithub: document.querySelector("#closeGithub"),
    cancelGithub: document.querySelector("#cancelGithub"),
    resultCount: document.querySelector("#resultCount"),
    resultLabel: document.querySelector("#resultLabel"),
    body: document.querySelector("#resultsBody"),
    empty: document.querySelector("#emptyState"),
    previous: document.querySelector("#previousPage"),
    next: document.querySelector("#nextPage"),
    currentPage: document.querySelector("#currentPage"),
    pageCount: document.querySelector("#pageCount"),
    resultsSection: document.querySelector(".results-section"),
    dialog: document.querySelector("#entryDialog"),
    closeButtons: [...document.querySelectorAll(".close-dialog")],
    view: document.querySelector("#entryView"),
    form: document.querySelector("#entryForm"),
    formTitle: document.querySelector("#formTitle"),
    dialogMeta: document.querySelector("#dialogMeta"),
    dialogNative: document.querySelector("#dialogNative"),
    dialogEnglish: document.querySelector("#dialogEnglish"),
    exampleBlock: document.querySelector("#dialogExampleBlock"),
    dialogExample: document.querySelector("#dialogExample"),
    dialogExampleTranslation: document.querySelector("#dialogExampleTranslation"),
    copy: document.querySelector("#copyEntry"),
    edit: document.querySelector("#editEntry"),
    cancelEdit: document.querySelector("#cancelEdit"),
    editNative: document.querySelector("#editNative"),
    editEnglish: document.querySelector("#editEnglish"),
    editPos: document.querySelector("#editPos"),
    editCategory: document.querySelector("#editCategory"),
    editExample: document.querySelector("#editExample"),
    editExampleTranslation: document.querySelector("#editExampleTranslation"),
    posSuggestions: document.querySelector("#posSuggestions"),
    categorySuggestions: document.querySelector("#categorySuggestions")
  };

  const fold = (value) => String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .replace(/[’‘]/g, "'")
    .trim();

  function loadEdits() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return saved && typeof saved === "object" ? saved : { edits: {}, additions: [] };
    } catch {
      return { edits: {}, additions: [] };
    }
  }

  const saved = loadEdits();
  saved.edits ||= {};
  saved.additions ||= [];

  const searchable = (entry) => ({
    ...entry,
    searchText: fold(`${entry.native} ${entry.english} ${entry.partOfSpeech} ${entry.category}`)
  });

  let indexedEntries = [
    ...data.entries.map((entry) => searchable({ ...entry, ...(saved.edits[entry.uid] || {}) })),
    ...saved.additions.map(searchable)
  ];


  function persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  }

  function githubToken() { return localStorage.getItem(GITHUB_TOKEN_KEY) || ""; }

  function encodedData() {
    const payload = { ...data, entryCount: indexedEntries.length, entries: indexedEntries.map(({ searchText, ...entry }) => entry) };
    return `window.DICTIONARY_DATA = ${JSON.stringify(payload)};\n`;
  }

  async function syncToGithub() {
    const token = githubToken();
    if (!token) { elements.githubDialog.showModal(); elements.githubToken.focus(); return; }
    elements.githubSync.disabled = true;
    elements.githubSync.textContent = "Saving…";
    try {
      const headers = { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "Content-Type": "application/json" };
      const api = `https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_DATA_PATH}`;
      const current = await fetch(api, { headers });
      if (!current.ok) throw new Error(`GitHub read failed (${current.status})`);
      const currentJson = await current.json();
      const content = btoa(unescape(encodeURIComponent(encodedData())));
      const response = await fetch(api, { method: "PUT", headers, body: JSON.stringify({ message: "Update dictionary from online editor", content, sha: currentJson.sha, branch: "main" }) });
      if (!response.ok) throw new Error(`GitHub save failed (${response.status})`);
      elements.githubSync.textContent = "Saved to GitHub";
      setTimeout(() => { elements.githubSync.textContent = "GitHub sync"; }, 2200);
    } catch (error) {
      elements.githubSync.textContent = "Save failed";
      window.alert(`${error.message}. Check your token and repository access.`);
    } finally { elements.githubSync.disabled = false; }
  }

  function uniqueSorted(field) {
    return [...new Set(indexedEntries.map((entry) => entry[field]).filter(Boolean))].sort(collator.compare);
  }

  function populateOptions(target, values, firstOption) {
    target.replaceChildren();
    if (firstOption) {
      const option = document.createElement("option");
      option.value = "";
      option.textContent = firstOption;
      target.append(option);
    }
    for (const value of values) {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      target.append(option);
    }
  }

  function refreshOptions() {
    const currentPos = state.pos;
    const currentCategory = state.category;
    populateOptions(elements.pos, uniqueSorted("partOfSpeech"), "All parts of speech");
    populateOptions(elements.category, uniqueSorted("category"), "All categories");
    populateOptions(elements.posSuggestions, uniqueSorted("partOfSpeech"));
    populateOptions(elements.categorySuggestions, uniqueSorted("category"));
    elements.pos.value = currentPos;
    elements.category.value = currentCategory;
  }

  function filteredEntries() {
    const terms = fold(state.query).split(/\s+/).filter(Boolean);
    const filtered = indexedEntries.filter((entry) =>
      (!state.pos || entry.partOfSpeech === state.pos) &&
      (!state.category || entry.category === state.category) &&
      terms.every((term) => entry.searchText.includes(term))
    );

    return filtered.sort((a, b) => {
      if (state.sort === "source") return a.sourceOrder - b.sourceOrder;
      const field = state.sort === "english" ? "english" : "native";
      const primary = collator.compare(a[field], b[field]);
      return primary || collator.compare(a.english, b.english) || a.sourceOrder - b.sourceOrder;
    });
  }

  function makeCell(text, className) {
    const cell = document.createElement("td");
    const span = document.createElement("span");
    span.className = className;
    span.textContent = text;
    cell.append(span);
    return cell;
  }

  function setDialogMode(mode) {
    elements.view.hidden = mode !== "view";
    elements.form.hidden = mode !== "edit";
  }

  function showEntry(entry) {
    currentEntry = entry;
    setDialogMode("view");
    elements.dialogMeta.textContent = `${entry.partOfSpeech || "uncategorized"} · ${entry.category || "No category"}`;
    elements.dialogNative.textContent = entry.native;
    elements.dialogEnglish.textContent = entry.english;
    const hasExample = Boolean(entry.example || entry.exampleTranslation);
    elements.exampleBlock.hidden = !hasExample;
    elements.dialogExample.textContent = entry.example;
    elements.dialogExampleTranslation.textContent = entry.exampleTranslation;
    elements.copy.dataset.copy = `${entry.native} — ${entry.english}`;
    elements.copy.textContent = "Copy entry";
    if (!elements.dialog.open) elements.dialog.showModal();
  }

  function openEditor(entry = null) {
    currentEntry = entry;
    setDialogMode("edit");
    elements.formTitle.textContent = entry ? "Edit entry" : "Add entry";
    elements.editNative.value = entry?.native || "";
    elements.editEnglish.value = entry?.english || "";
    elements.editPos.value = entry?.partOfSpeech || "";
    elements.editCategory.value = entry?.category || "";
    elements.editExample.value = entry?.example || "";
    elements.editExampleTranslation.value = entry?.exampleTranslation || "";
    if (!elements.dialog.open) elements.dialog.showModal();
    elements.editNative.focus();
  }

  function render({ keepScroll = true } = {}) {
    elements.resultsSection.hidden = !state.hasSearched;
    if (!state.hasSearched) {
      elements.headerCount.textContent = indexedEntries.length.toLocaleString();
      elements.clear.hidden = true;
      elements.reset.hidden = true;
      return;
    }
    elements.resultsSection.setAttribute("aria-busy", "true");
    const results = filteredEntries();
    const pages = Math.max(1, Math.ceil(results.length / state.pageSize));
    state.page = Math.min(state.page, pages);
    const start = (state.page - 1) * state.pageSize;
    const pageEntries = results.slice(start, start + state.pageSize);
    const fragment = document.createDocumentFragment();

    for (const entry of pageEntries) {
      const row = document.createElement("tr");
      row.tabIndex = 0;
      row.setAttribute("role", "button");
      row.setAttribute("aria-label", `${entry.native}: ${entry.english}`);
      row.append(
        makeCell(entry.native, "native-word"),
        makeCell(entry.english, "english-word"),
        makeCell(entry.partOfSpeech, "tag"),
        makeCell(entry.category, "tag")
      );
      row.addEventListener("click", () => showEntry(entry));
      row.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          showEntry(entry);
        }
      });
      fragment.append(row);
    }

    elements.body.replaceChildren(fragment);
    elements.empty.hidden = results.length > 0;
    elements.resultCount.textContent = results.length.toLocaleString();
    elements.resultLabel.textContent = results.length === 1 ? "entry" : "entries";
    elements.headerCount.textContent = indexedEntries.length.toLocaleString();
    elements.currentPage.textContent = state.page;
    elements.pageCount.textContent = pages;
    elements.previous.disabled = state.page <= 1;
    elements.next.disabled = state.page >= pages;
    elements.clear.hidden = !state.query;
    elements.reset.hidden = !state.query && !state.pos && !state.category;
    elements.resultsSection.setAttribute("aria-busy", "false");
    if (!keepScroll) document.querySelector(".results-bar").scrollIntoView({ block: "start", behavior: "smooth" });
  }

  function resetPageAndRender() {
    state.page = 1;
    state.hasSearched = Boolean(state.query || state.pos || state.category);
    render();
  }

  function saveEntry(formData) {
    const fields = {
      native: String(formData.get("native") || "").trim(),
      english: String(formData.get("english") || "").trim(),
      partOfSpeech: String(formData.get("partOfSpeech") || "").trim(),
      category: String(formData.get("category") || "").trim(),
      example: String(formData.get("example") || "").trim(),
      exampleTranslation: String(formData.get("exampleTranslation") || "").trim()
    };

    if (currentEntry) {
      const baseEntry = data.entries.find((entry) => entry.uid === currentEntry.uid);
      if (baseEntry) {
        saved.edits[currentEntry.uid] = fields;
      } else {
        const additionIndex = saved.additions.findIndex((entry) => entry.uid === currentEntry.uid);
        saved.additions[additionIndex] = { ...saved.additions[additionIndex], ...fields };
      }
      const entryIndex = indexedEntries.findIndex((entry) => entry.uid === currentEntry.uid);
      indexedEntries[entryIndex] = searchable({ ...indexedEntries[entryIndex], ...fields });
      currentEntry = indexedEntries[entryIndex];
    } else {
      const sourceOrder = Math.max(0, ...indexedEntries.map((entry) => entry.sourceOrder)) + 1;
      const addition = searchable({
        uid: `local-${Date.now()}`,
        sourceId: "",
        sourceOrder,
        ...fields
      });
      saved.additions.push({ ...addition, searchText: undefined });
      indexedEntries.push(addition);
      currentEntry = addition;
    }

    persist();
    refreshOptions();
    resetPageAndRender();
    showEntry(currentEntry);
    syncToGithub();
  }

  function exportCsv() {
    const columns = ["Sahehehu", "English", "Part of Speech", "Category", "Example", "Example Translation"];
    const quote = (value) => `"${String(value || "").replaceAll('"', '""')}"`;
    const rows = [...indexedEntries]
      .sort((a, b) => a.sourceOrder - b.sourceOrder)
      .map((entry) => [entry.native, entry.english, entry.partOfSpeech, entry.category, entry.example, entry.exampleTranslation]);
    const csv = "\uFEFF" + [columns, ...rows].map((row) => row.map(quote).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "Sahehehu_Zdi_edited.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  refreshOptions();
  elements.pageSize.value = String(state.pageSize);
  elements.pageSize.addEventListener("change", () => {
    state.pageSize = Number(elements.pageSize.value);
    localStorage.setItem(PAGE_SIZE_KEY, String(state.pageSize));
    state.page = 1;
    render();
  });
  elements.search.addEventListener("input", () => { state.query = elements.search.value; resetPageAndRender(); });
  elements.clear.addEventListener("click", () => { elements.search.value = ""; state.query = ""; elements.search.focus(); resetPageAndRender(); });
  elements.pos.addEventListener("change", () => { state.pos = elements.pos.value; resetPageAndRender(); });
  elements.category.addEventListener("change", () => { state.category = elements.category.value; resetPageAndRender(); });
  elements.sortButtons.forEach((button) => button.addEventListener("click", () => {
    state.sort = button.dataset.sort;
    elements.sortButtons.forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
    resetPageAndRender();
  }));
  elements.reset.addEventListener("click", () => {
    state.query = ""; state.pos = ""; state.category = ""; state.page = 1;
    state.hasSearched = false;
    elements.search.value = ""; elements.pos.value = ""; elements.category.value = "";
    render();
  });
  elements.add.addEventListener("click", () => openEditor());
  elements.export.addEventListener("click", exportCsv);
  elements.githubSync.addEventListener("click", syncToGithub);
  elements.closeGithub.addEventListener("click", () => elements.githubDialog.close());
  elements.cancelGithub.addEventListener("click", () => elements.githubDialog.close());
  elements.githubForm.addEventListener("submit", (event) => { event.preventDefault(); const token = elements.githubToken.value.trim(); if (token) localStorage.setItem(GITHUB_TOKEN_KEY, token); elements.githubDialog.close(); syncToGithub(); });
  elements.previous.addEventListener("click", () => { if (state.page > 1) { state.page -= 1; render({ keepScroll: false }); } });
  elements.next.addEventListener("click", () => { state.page += 1; render({ keepScroll: false }); });
  elements.closeButtons.forEach((button) => button.addEventListener("click", () => elements.dialog.close()));
  elements.dialog.addEventListener("click", (event) => { if (event.target === elements.dialog) elements.dialog.close(); });
  elements.copy.addEventListener("click", async () => {
    await navigator.clipboard.writeText(elements.copy.dataset.copy);
    elements.copy.textContent = "Copied";
  });
  elements.edit.addEventListener("click", () => openEditor(currentEntry));
  elements.cancelEdit.addEventListener("click", () => currentEntry ? showEntry(currentEntry) : elements.dialog.close());
  elements.form.addEventListener("submit", (event) => {
    event.preventDefault();
    saveEntry(new FormData(elements.form));
  });

  render();
})();
