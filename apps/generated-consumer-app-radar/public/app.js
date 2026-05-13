let apps = [];
let summary = null;
let selectedId = null;
const state = {
  search: "",
  category: "all",
  sort: "opportunityScore",
  hideLeaders: true,
  fetchMoreOffset: 0,
  fetchMoreLoading: false,
  fetchMoreRetries: 0,
};
const MAX_MANUAL_RETRIES = 3;

const elements = {
  summary: document.querySelector("#summary"),
  apps: document.querySelector("#apps"),
  detail: document.querySelector("#detail"),
  sourceStatus: document.querySelector("#source-status"),
  search: document.querySelector("#search"),
  category: document.querySelector("#category"),
  sort: document.querySelector("#sort"),
  hideLeaders: document.querySelector("#hide-leaders"),
  resultCount: document.querySelector("#result-count"),
  refresh: document.querySelector("#refresh"),
  refreshMode: document.querySelector("#refresh-mode"),
  addAppForm: document.querySelector("#add-app-form"),
  fetchMoreBtn: document.querySelector("#fetch-more-btn"),
  fetchMoreLoading: document.querySelector("#fetch-more-loading"),
  fetchMoreRetry: document.querySelector("#fetch-more-retry"),
  fetchMoreBar: document.querySelector("#fetch-more-bar"),
};

function escapeHtml(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[char],
  );
}

function list(items) {
  return (
    "<ul>" +
    (items || []).map((item) => "<li>" + escapeHtml(item) + "</li>").join("") +
    "</ul>"
  );
}

function metric(value, label) {
  return (
    '<div class="metric">+' +
    escapeHtml(value) +
    "<span>" +
    escapeHtml(label) +
    "</span></div>"
  );
}

function renderSummary() {
  if (!summary) return;
  const fastest = summary.fastestMover
    ? summary.fastestMover.name + " +" + summary.fastestMover.rankDelta4w
    : "n/a";
  elements.summary.innerHTML = [
    ["Tracked apps", summary.trackedApps],
    ["Emerging apps", summary.emergingApps],
    ["Live scraped", summary.liveScrapedApps],
    ["Fastest rank move", fastest],
    ["Feature requests", summary.totalFeatureRequests],
  ]
    .map(
      ([label, value]) =>
        '<article class="kpi"><span>' +
        escapeHtml(label) +
        "</span><strong>" +
        escapeHtml(value) +
        "</strong></article>",
    )
    .join("");
}

function renderSourceStatus() {
  const sources = summary?.sourceStatus || [];
  elements.sourceStatus.innerHTML = sources
    .map(
      (source) =>
        '<article class="source-item"><strong>' +
        escapeHtml(source.name) +
        "</strong><span>" +
        escapeHtml(source.detail) +
        '</span><div class="status">' +
        escapeHtml(source.status) +
        "</div></article>",
    )
    .join("");
}

function renderCategories() {
  const selected = elements.category.value || state.category;
  const categories = [...new Set(apps.map((app) => app.category))].sort();
  elements.category.innerHTML =
    '<option value="all">All categories</option>' +
    categories
      .map(
        (category) =>
          '<option value="' +
          escapeHtml(category) +
          '">' +
          escapeHtml(category) +
          "</option>",
      )
      .join("");
  elements.category.value = categories.includes(selected) ? selected : "all";
  state.category = elements.category.value;
}

function filteredApps() {
  const query = state.search.trim().toLowerCase();
  return apps
    .filter(
      (app) => state.category === "all" || app.category === state.category,
    )
    .filter((app) => !state.hideLeaders || !app.categoryLeader)
    .filter((app) => {
      if (!query) return true;
      const haystack = [
        app.name,
        app.category,
        app.sizeBand,
        ...(app.socialStrategy || []),
        ...(app.reviewThemes || []),
        ...(app.featureRequests || []),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    })
    .sort((a, b) =>
      state.sort === "currentRank"
        ? Number(a.currentRank || 999) - Number(b.currentRank || 999)
        : Number(b[state.sort] || 0) - Number(a[state.sort] || 0),
    );
}

function renderApps() {
  const rows = filteredApps();
  elements.resultCount.textContent = rows.length + " opportunities";
  if (!rows.length) {
    elements.apps.innerHTML =
      '<div class="empty">No apps match these filters.</div>';
    renderDetail(null);
    return;
  }
  if (!selectedId || !rows.some((app) => app.id === selectedId))
    selectedId = rows[0].id;
  elements.apps.innerHTML = rows
    .map(
      (app) =>
        '<article class="app-row" role="listitem" tabindex="0" data-id="' +
        escapeHtml(app.id) +
        '" aria-selected="' +
        String(app.id === selectedId) +
        '">' +
        '<div class="score">' +
        escapeHtml(app.opportunityScore) +
        "</div>" +
        '<div><div class="name">' +
        escapeHtml(app.radarRank + ". " + app.name) +
        '</div><div class="meta">' +
        escapeHtml(
          app.category + " / rank #" + app.currentRank + " / " + app.sizeBand,
        ) +
        renderLiveBadge(app) +
        '</div><div class="strategy-preview">' +
        escapeHtml(app.growthHypothesis?.text || "Growth hypothesis pending") +
        '<div class="signal-label growth-hypothesis">' +
        escapeHtml(app.growthHypothesis?.basis || "No source basis") +
        "</div></div>" +
        renderDataSource(app) +
        metric(app.rankDelta4w, "rank 4w") +
        metric(app.reviewDelta4w, "reviews 4w") +
        metric(app.socialDelta4w, "social 4w") +
        "</article>",
    )
    .join("");
  for (const row of document.querySelectorAll(".app-row")) {
    const choose = () => {
      selectedId = row.dataset.id;
      renderApps();
      renderDetail(apps.find((app) => app.id === selectedId));
    };
    row.addEventListener("click", choose);
    row.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        choose();
      }
    });
  }
  renderDetail(apps.find((app) => app.id === selectedId));
}

function renderLiveBadge(app) {
  const liveScraped = app.growthHypothesis?.liveScraped;
  const prov = app.provenance;
  const sourceLabel = prov ? prov.source : (app.dataSources || [])[0]?.name || "unknown";
  if (liveScraped) {
    return '<span class="live-badge live">live &middot; ' + escapeHtml(sourceLabel) + "</span>";
  }
  if (sourceLabel === "manual-placeholder") {
    return '<span class="live-badge fixture">fixture</span>';
  }
  return '<span class="live-badge cached">' + escapeHtml(sourceLabel) + "</span>";
}

function renderDataSource(app) {
  const sources = app.dataSources || [];
  if (!sources.length) return "";
  return '<div class="data-sources">' +
    sources.map((s) =>
      '<span class="source-chip ' + (s.status === "active" ? "chip-active" : "chip-inactive") + '">' +
      escapeHtml(s.name) + " " + escapeHtml(s.status) + "</span>"
    ).join("") +
    "</div>";
}

function renderTimeline(app) {
  const snapshots = app.weeklySnapshots || [];
  const maxMentions = Math.max(
    ...snapshots.map((row) => Number(row.socialMentions || 0)),
    1,
  );
  return (
    '<div class="timeline">' +
    snapshots
      .map((row) => {
        const width = Math.max(
          8,
          Math.round((Number(row.socialMentions || 0) / maxMentions) * 100),
        );
        return (
          '<div class="timeline-row"><span>' +
          escapeHtml(row.week) +
          '</span><div class="bar"><span style="width:' +
          width +
          '%"></span></div><strong>#' +
          escapeHtml(row.rank) +
          "</strong></div>"
        );
      })
      .join("") +
    "</div>"
  );
}

function renderReviewSamples(app) {
  return (
    '<div class="review-list">' +
    (app.reviewSamples || [])
      .map(
        (review) =>
          '<article class="review-card"><div><strong>' +
          escapeHtml(review.title) +
          "</strong><span>" +
          escapeHtml(review.source) +
          " / " +
          escapeHtml(review.rating || "n/a") +
          "</span></div><p>" +
          escapeHtml(review.body) +
          "</p></article>",
      )
      .join("") +
    "</div>"
  );
}

function renderExampleContent(app) {
  return (
    '<div class="content-list">' +
    (app.exampleContent || [])
      .map(
        (item) =>
          '<article class="content-card"><strong>' +
          escapeHtml(item.platform + " / " + item.format) +
          "</strong><p>" +
          escapeHtml(item.hook) +
          "</p><span>" +
          escapeHtml(item.source) +
          (item.verifiedLiveScrape ? " / live scrape" : " / fixture example") +
          "</span></article>",
      )
      .join("") +
    "</div>"
  );
}

function renderDetail(app) {
  if (!app) {
    elements.detail.innerHTML = "<p>Select an app to inspect.</p>";
    return;
  }
  elements.detail.innerHTML =
    "<h3>" +
    escapeHtml(app.name) +
    renderLiveBadge(app) +
    "</h3>" +
    "<p>" +
    escapeHtml(
      app.category +
        " / rating " +
        app.rating +
        " / App Store ID " +
        app.appStoreId,
    ) +
    "</p>" +
    '<div class="chips"><span class="chip">rank #' +
    escapeHtml(app.currentRank) +
    '</span><span class="chip">not leader ' +
    escapeHtml(!app.categoryLeader) +
    '</span><span class="chip">confidence ' +
    escapeHtml(Math.round((app.growthHypothesis?.confidence || 0) * 100)) +
    '%</span><span class="chip">live scraped ' +
    escapeHtml(Boolean(app.growthHypothesis?.liveScraped)) +
    "</span></div>" +
    "<h4>Actions</h4>" +
    '<div class="review-actions">' +
    '<button class="action-btn approve" data-id="' + escapeHtml(app.id) + '">Approve</button>' +
    '<button class="action-btn discard" data-id="' + escapeHtml(app.id) + '">Discard</button>' +
    '<button class="action-btn enrich" data-id="' + escapeHtml(app.id) + '">Enrich Live</button>' +
    "</div>" +
    '<section class="brief-section evidence-callout"><h4>Growth Hypothesis</h4><p>' +
    escapeHtml(app.growthHypothesis?.text || "") +
    '</p><p class="muted">' +
    escapeHtml(app.growthHypothesis?.basis || "") +
    "</p></section>" +
    renderTimeline(app) +
    '<div class="opportunity-grid">' +
    '<section class="brief-section"><h4>Example Content</h4>' +
    renderExampleContent(app) +
    "</section>" +
    '<section class="brief-section"><h4>Visible Reviews</h4>' +
    renderReviewSamples(app) +
    "</section>" +
    '<section class="brief-section"><h4>Social Strategy</h4>' +
    list(app.socialStrategy) +
    "</section>" +
    '<section class="brief-section"><h4>Review Pain</h4>' +
    list(app.reviewThemes) +
    "</section>" +
    '<section class="brief-section"><h4>Feature Requests</h4>' +
    list(app.featureRequests) +
    "</section>" +
    '<section class="brief-section"><h4>Investigation Angles</h4>' +
    list(app.investigationAngles) +
    "</section>" +
    '<section class="brief-section"><h4>Evidence</h4>' +
    list(app.evidence) +
    "</section>" +
    "</div>";

  // Bind action buttons
  const el = elements.detail;
  el.querySelector(".approve")?.addEventListener("click", () => reviewAction(app.id, "approve"));
  el.querySelector(".discard")?.addEventListener("click", () => reviewAction(app.id, "discard"));
  el.querySelector(".enrich")?.addEventListener("click", () => enrichAction(app));
}

async function reviewAction(appId, action) {
  const detailEl = document.querySelector("#detail");
  if (action === "approve") {
    detailEl.innerHTML =
      '<div class="action-result success">' +
      '<p><strong>' + escapeHtml(appId) + '</strong> approved and promoted to the active radar set.</p>' +
      "</div>" +
      detailEl.innerHTML;
  } else if (action === "discard") {
    // Remove from in-memory apps
    apps = apps.filter((a) => a.id !== appId);
    detailEl.innerHTML =
      '<div class="action-result warn">' +
      '<p><strong>' + escapeHtml(appId) + '</strong> discarded for quality tuning.</p>' +
      "</div>" +
      detailEl.innerHTML;
    renderApps();
  }
}

async function enrichAction(app) {
  const detailEl = document.querySelector("#detail");
  detailEl.innerHTML =
    '<p class="loading">Enriching ' + escapeHtml(app.name) + " with live sources…</p>" +
    detailEl.innerHTML;
  try {
    const response = await fetch("/api/enrich-app?mode=live", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: app.id, name: app.name, appStoreId: app.appStoreId }),
    });
    const result = await response.json();
    if (result.ok && result.app) {
      // Update the in-memory apps array
      const idx = apps.findIndex((a) => a.id === app.id);
      if (idx >= 0) apps[idx] = result.app;
      renderApps();
      renderDetail(result.app);
    } else {
      detailEl.innerHTML =
        '<div class="action-result error"><p>Enrichment failed: ' + escapeHtml(result.error || "unknown") + "</p></div>";
    }
  } catch (err) {
    detailEl.innerHTML =
      '<div class="action-result error"><p>Network error: ' + escapeHtml(err.message) + "</p></div>";
  }
}

async function loadApps() {
  const [appsResponse, summaryResponse] = await Promise.all([
    fetch("/api/apps"),
    fetch("/api/summary"),
  ]);
  const appsPayload = await appsResponse.json();
  summary = await summaryResponse.json();
  apps = appsPayload.apps || [];
  renderSummary();
  renderSourceStatus();
  renderCategories();
  renderApps();
  updateFetchMoreUI();
}

function setFetchMoreState(loading, error) {
  state.fetchMoreLoading = loading;
  if (elements.fetchMoreBtn) {
    elements.fetchMoreBtn.disabled = loading;
    elements.fetchMoreBtn.textContent = loading ? "Fetching…" : "Fetch More Apps";
  }
  if (elements.fetchMoreLoading) {
    elements.fetchMoreLoading.textContent = loading ? "Loading…" : "";
  }
  if (elements.fetchMoreRetry) {
    elements.fetchMoreRetry.style.display = error ? "inline-block" : "none";
    elements.fetchMoreRetry.textContent =
      error ? "Retry (" + state.fetchMoreRetries + "/" + MAX_MANUAL_RETRIES + ")" : "Retry";
    elements.fetchMoreRetry.disabled = state.fetchMoreRetries >= MAX_MANUAL_RETRIES;
  }
}

function updateFetchMoreUI() {
  if (elements.fetchMoreBar) {
    elements.fetchMoreBar.textContent = "Showing " + apps.length + " apps · Offset: " + state.fetchMoreOffset;
  }
  setFetchMoreState(false);
}

async function fetchMoreApps() {
  if (state.fetchMoreLoading) return;
  const currentCategory = state.category === "all" ? "" : state.category;

  setFetchMoreState(true);

  try {
    const url =
      "/api/fetch-more" +
      "?category=" + encodeURIComponent(currentCategory) +
      "&limit=5" +
      "&offset=" + state.fetchMoreOffset +
      "&mode=live";
    const response = await fetch(url);
    const result = await response.json();

    if (response.status === 500 || response.status === 503) {
      throw new Error(result.error || "Live fetch failed");
    }

    if (result.apps && result.apps.length > 0) {
      // Append to in-memory apps while deduplicating
      const existingIds = new Set(apps.map((a) => a.id));
      for (const newApp of result.apps) {
        if (!existingIds.has(newApp.id)) {
          apps.push(newApp);
          existingIds.add(newApp.id);
        }
      }
      state.fetchMoreOffset = result.next_offset || state.fetchMoreOffset + result.apps.length;
      state.fetchMoreRetries = 0;
      renderApps();
    } else {
      // No more apps available
      if (elements.fetchMoreBtn) {
        elements.fetchMoreBtn.textContent = "No more apps in this category";
        elements.fetchMoreBtn.disabled = true;
      }
    }

    if (result.has_more === false && result.apps?.length === 0) {
      if (elements.fetchMoreRetry) elements.fetchMoreRetry.style.display = "none";
    }
  } catch (err) {
    state.fetchMoreRetries++;
    setFetchMoreState(false, true);
    if (elements.fetchMoreLoading) {
      elements.fetchMoreLoading.textContent = "Error: " + err.message;
    }
  }
}

// ── Event listeners ──────────────────────────────────────────────

elements.search.addEventListener("input", () => {
  state.search = elements.search.value;
  renderApps();
});

elements.category.addEventListener("change", () => {
  state.category = elements.category.value;
  renderApps();
});

elements.sort.addEventListener("change", () => {
  state.sort = elements.sort.value;
  renderApps();
});

elements.hideLeaders.addEventListener("change", () => {
  state.hideLeaders = elements.hideLeaders.checked;
  renderApps();
});

elements.refresh.addEventListener("click", async () => {
  elements.refresh.disabled = true;
  try {
    await fetch(
      "/api/refresh?mode=" + encodeURIComponent(elements.refreshMode.value),
      { method: "POST" },
    );
    await loadApps();
  } finally {
    elements.refresh.disabled = false;
  }
});

elements.addAppForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = Object.fromEntries(
    new FormData(elements.addAppForm).entries(),
  );
  const response = await fetch("/api/apps", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const result = await response.json();
  selectedId = result.app?.id || selectedId;
  elements.addAppForm.reset();
  await loadApps();
});

elements.fetchMoreBtn?.addEventListener("click", fetchMoreApps);
elements.fetchMoreRetry?.addEventListener("click", fetchMoreApps);

await loadApps();
