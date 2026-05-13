let apps = [];

function list(items) {
  return (
    "<ul>" +
    (items || []).map((item) => "<li>" + item + "</li>").join("") +
    "</ul>"
  );
}

function renderDetail(app) {
  const target = document.querySelector("#detail");
  if (!app) {
    target.innerHTML = "<p>Select an app to inspect.</p>";
    return;
  }
  target.innerHTML =
    "<h3>" +
    app.name +
    "</h3>" +
    "<p>" +
    app.category +
    " / rating " +
    app.rating +
    "</p>" +
    '<div class="chips"><span class="chip">rank +' +
    app.rankDelta4w +
    '</span><span class="chip">reviews +' +
    app.reviewDelta4w +
    '</span><span class="chip">social +' +
    app.socialDelta4w +
    "</span></div>" +
    "<h2>Social Strategy</h2>" +
    list(app.socialStrategy) +
    "<h2>Review Pain</h2>" +
    list(app.reviewThemes) +
    "<h2>Feature requests</h2>" +
    list(app.featureRequests);
}

function renderApps() {
  const root = document.querySelector("#apps");
  root.innerHTML = apps
    .map(
      (app) =>
        '<article class="app-row" data-id="' +
        app.id +
        '">' +
        '<div class="score">' +
        app.opportunityScore +
        "</div>" +
        '<div><div class="name">' +
        app.radarRank +
        ". " +
        app.name +
        '</div><div class="meta">' +
        app.category +
        " / " +
        app.country +
        "</div></div>" +
        '<div class="delta">+' +
        app.rankDelta4w +
        " rank</div>" +
        "</article>",
    )
    .join("");
  document
    .querySelectorAll(".app-row")
    .forEach((row) =>
      row.addEventListener("click", () =>
        renderDetail(apps.find((app) => app.id === row.dataset.id)),
      ),
    );
  renderDetail(apps[0]);
}

async function loadApps() {
  const response = await fetch("/api/apps");
  const payload = await response.json();
  apps = payload.apps || [];
  renderApps();
}

document.querySelector("#refresh").addEventListener("click", async () => {
  await fetch("/api/refresh", { method: "POST" });
  await loadApps();
});

await loadApps();
