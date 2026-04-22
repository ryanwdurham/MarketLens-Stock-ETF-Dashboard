/* ── MarketLens App JS ── */

// ── State ──
let state = {
  ticker: null,
  period: "1Y",
  cPeriod: "1Y",
  data: null,
  alerts: [],
  alertInterval: null,
};

// ── Plotly theme ──
const PLOTLY_LAYOUT = (title = "") => ({
  title: { text: title, font: { family: "Syne", size: 13, color: "#6b7694" }, x: 0.02 },
  paper_bgcolor: "transparent",
  plot_bgcolor: "transparent",
  font: { family: "DM Mono, monospace", color: "#6b7694", size: 11 },
  xaxis: {
    showgrid: false, zeroline: false,
    color: "#3d4560", linecolor: "#3d4560",
    tickfont: { size: 10 },
  },
  yaxis: {
    showgrid: true,
    gridcolor: "rgba(255,255,255,0.04)",
    zeroline: false, color: "#3d4560",
    tickfont: { size: 10 }, tickformat: "$.2f",
  },
  legend: {
    orientation: "h", x: 0, y: 1.08,
    font: { size: 11, family: "DM Mono, monospace", color: "#6b7694" },
    bgcolor: "transparent",
  },
  margin: { l: 55, r: 20, t: 40, b: 45 },
  hovermode: "x unified",
  hoverlabel: {
    bgcolor: "#161b27",
    bordercolor: "rgba(255,255,255,0.14)",
    font: { family: "DM Mono, monospace", size: 11, color: "#e8ecf4" },
  },
});

const PLOTLY_CONFIG = {
  responsive: true,
  displayModeBar: true,
  modeBarButtonsToRemove: ["select2d", "lasso2d", "toggleSpikelines"],
  displaylogo: false,
};

// ── Utility ──
function fmt(val, prefix = "$") {
  if (val == null) return "—";
  if (Math.abs(val) >= 1e12) return prefix + (val / 1e12).toFixed(2) + "T";
  if (Math.abs(val) >= 1e9) return prefix + (val / 1e9).toFixed(2) + "B";
  if (Math.abs(val) >= 1e6) return prefix + (val / 1e6).toFixed(2) + "M";
  return prefix + val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtNum(val, suffix = "") {
  if (val == null) return "—";
  return val.toFixed(2) + suffix;
}

function showToast(msg, type = "success") {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.className = `toast show ${type}`;
  setTimeout(() => { t.className = "toast"; }, 3500);
}

function setLoading(id, visible) {
  const el = document.getElementById(id);
  if (el) el.classList.toggle("visible", visible);
}

// ── Navigation ──
document.querySelectorAll(".nav-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById("page-" + btn.dataset.page).classList.add("active");
    // Auto-run compare when switching to it
    if (btn.dataset.page === "compare") runCompare();
  });
});

// ── Mobile sidebar ──
document.getElementById("hamburger")?.addEventListener("click", () => {
  document.getElementById("sidebar").classList.toggle("open");
});

// ── Period buttons (overview) ──
document.querySelectorAll(".period-btn[data-period]").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".period-btn[data-period]").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    state.period = btn.dataset.period;
    if (state.ticker) loadTicker(state.ticker);
  });
});
// Set default active period
document.querySelector('[data-period="1Y"]')?.classList.add("active");
document.querySelectorAll(".period-btn[data-period]").forEach(b => b.classList.remove("active-default"));

// ── Period buttons (compare) ──
document.querySelectorAll(".period-btn[data-cperiod]").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".period-btn[data-cperiod]").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    state.cPeriod = btn.dataset.cperiod;
  });
});

// ── MA toggles ──
["ma20", "ma50", "ma200", "showVolume", "showRSI"].forEach(id => {
  document.getElementById(id)?.addEventListener("change", () => {
    if (state.data) renderChart(state.data);
  });
});

// ── Search ──
function doSearch() {
  const val = document.getElementById("searchInput").value.trim().toUpperCase();
  if (!val) return;
  loadTicker(val);
}
document.getElementById("searchBtn")?.addEventListener("click", doSearch);
document.getElementById("searchInput")?.addEventListener("keydown", e => {
  if (e.key === "Enter") doSearch();
});

// ── Quick tickers ──
document.querySelectorAll(".quick-ticker, .qs-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const t = btn.dataset.ticker;
    // Switch to overview
    document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    document.querySelector('[data-page="overview"]')?.classList.add("active");
    document.getElementById("page-overview")?.classList.add("active");
    loadTicker(t);
  });
});

// ── Load ticker data ──
async function loadTicker(ticker) {
  state.ticker = ticker;
  document.getElementById("chartPlaceholder").style.display = "none";
  setLoading("chartLoading", true);

  // Optimistically update header
  document.getElementById("tickerDisplay").textContent = ticker;
  document.getElementById("nameDisplay").textContent = "Loading…";
  document.getElementById("searchInput").value = ticker;

  try {
    const res = await fetch(`/api/quote/${ticker}?period=${state.period}`);
    const data = await res.json();
    if (data.error) { showToast("⚠ " + data.error, "error"); setLoading("chartLoading", false); return; }

    state.data = data;
    updateHeader(data);
    updateStats(data);
    renderChart(data);
    updateRangeBar(data);
  } catch (err) {
    showToast("Network error: " + err.message, "error");
  } finally {
    setLoading("chartLoading", false);
  }
}

function updateHeader(d) {
  document.getElementById("tickerDisplay").textContent = d.ticker;
  document.getElementById("nameDisplay").textContent = d.name;
  document.getElementById("priceDisplay").textContent = fmt(d.current_price);

  const ch = document.getElementById("changeDisplay");
  const sign = d.change >= 0 ? "+" : "";
  ch.textContent = `${sign}${fmtNum(d.change)} (${sign}${fmtNum(d.change_pct)}%)`;
  ch.className = "change-display " + (d.change >= 0 ? "up" : "down");
}

function updateStats(d) {
  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val ?? "—";
  };

  set("sv-price", fmt(d.current_price));
  const svChange = document.getElementById("sv-change");
  const sign = d.change >= 0 ? "+" : "";
  svChange.textContent = `${sign}${fmtNum(d.change_pct)}%`;
  svChange.className = "stat-value " + (d.change >= 0 ? "up" : "down");

  set("sv-high", fmt(d.week_52_high));
  set("sv-low", fmt(d.week_52_low));
  set("sv-volume", d.avg_volume ? fmtNum(d.avg_volume / 1e6, "M") : "—");
  set("sv-mcap", d.market_cap ? fmt(d.market_cap, "$") : "—");
  set("sv-pe", d.pe_ratio ? fmtNum(d.pe_ratio) : "—");
  set("sv-div", d.dividend_yield ? fmtNum(d.dividend_yield) + "%" : "—");
  set("sv-beta", d.beta ? fmtNum(d.beta) : "—");
  set("sv-vol", d.volatility ? fmtNum(d.volatility) + "%" : "—");

  const trendEl = document.getElementById("sv-trend");
  const trendCard = document.getElementById("sv-trend-card");
  if (trendEl && trendCard) {
    trendEl.textContent = d.trend;
    trendCard.className = "stat-card trend-card " + d.trend.toLowerCase();
    trendEl.className = "stat-value " + (d.trend === "Bullish" ? "up" : d.trend === "Bearish" ? "down" : "");
  }

  // Price card color
  const priceCard = document.getElementById("stat-price");
  if (priceCard) priceCard.style.borderColor = d.change >= 0 ? "rgba(34,216,122,0.25)" : "rgba(244,91,91,0.25)";
}

function updateRangeBar(d) {
  const card = document.getElementById("rangeCard");
  if (!card || !d.week_52_high || !d.week_52_low || !d.current_price) return;
  card.style.display = "block";
  const pct = Math.min(100, Math.max(0, ((d.current_price - d.week_52_low) / (d.week_52_high - d.week_52_low)) * 100));
  document.getElementById("rangeBarFill").style.width = pct + "%";
  document.getElementById("rangeBarMarker").style.left = pct + "%";
  document.getElementById("rv-low").textContent = fmt(d.week_52_low);
  document.getElementById("rv-high").textContent = fmt(d.week_52_high);
}

function renderChart(d) {
  const chart = d.chart;
  const showMA20 = document.getElementById("ma20").checked;
  const showMA50 = document.getElementById("ma50").checked;
  const showMA200 = document.getElementById("ma200").checked;
  const showVol = document.getElementById("showVolume").checked;
  const showRSI = document.getElementById("showRSI").checked;

  // Determine chart color
  const isUp = d.change >= 0;
  const priceColor = isUp ? "#22d87a" : "#f45b5b";
  const fillColor = isUp ? "rgba(34,216,122,0.07)" : "rgba(244,91,91,0.07)";

  const traces = [];

  // Main price trace
  traces.push({
    x: chart.dates,
    y: chart.close,
    type: "scatter",
    mode: "lines",
    name: d.ticker,
    line: { color: priceColor, width: 2 },
    fill: "tozeroy",
    fillcolor: fillColor,
    hovertemplate: "%{x}<br>Price: <b>$%{y:.2f}</b><extra></extra>",
  });

  if (showMA20) {
    traces.push({
      x: chart.dates, y: chart.ma20,
      type: "scatter", mode: "lines",
      name: "MA 20",
      line: { color: "#4f9cf9", width: 1.5, dash: "dot" },
      hovertemplate: "MA20: $%{y:.2f}<extra></extra>",
    });
  }
  if (showMA50) {
    traces.push({
      x: chart.dates, y: chart.ma50,
      type: "scatter", mode: "lines",
      name: "MA 50",
      line: { color: "#f5c842", width: 1.5, dash: "dot" },
      hovertemplate: "MA50: $%{y:.2f}<extra></extra>",
    });
  }
  if (showMA200) {
    traces.push({
      x: chart.dates, y: chart.ma200,
      type: "scatter", mode: "lines",
      name: "MA 200",
      line: { color: "#c084fc", width: 1.5, dash: "dot" },
      hovertemplate: "MA200: $%{y:.2f}<extra></extra>",
    });
  }

  // Build subplot layout
  let layout = { ...PLOTLY_LAYOUT() };
  layout.showlegend = true;

  // Subplots for volume / RSI
  let hasSubplot = showVol || showRSI;
  if (hasSubplot) {
    layout.grid = { rows: showVol && showRSI ? 3 : 2, columns: 1, pattern: "independent" };
    layout.xaxis = { ...layout.xaxis };
    layout.xaxis2 = { showgrid: false, zeroline: false, color: "#3d4560", tickfont: { size: 9 } };
    layout.xaxis3 = { showgrid: false, zeroline: false, color: "#3d4560", tickfont: { size: 9 } };

    // Main price = row 1
    traces[0].xaxis = "x"; traces[0].yaxis = "y";
    if (showMA20 && traces.length > 1) traces.find(t => t.name === "MA 20").xaxis = "x";
    if (showMA50) { const t = traces.find(t => t.name === "MA 50"); if (t) t.xaxis = "x"; }
    if (showMA200) { const t = traces.find(t => t.name === "MA 200"); if (t) t.xaxis = "x"; }

    let row = 2;
    if (showVol) {
      traces.push({
        x: chart.dates, y: chart.volume,
        type: "bar", name: "Volume",
        marker: { color: "rgba(79,156,249,0.35)" },
        xaxis: `x${row}`, yaxis: `y${row}`,
        hovertemplate: "Vol: %{y:,.0f}<extra></extra>",
      });
      layout[`yaxis${row}`] = { showgrid: false, zeroline: false, color: "#3d4560", tickfont: { size: 9 }, tickformat: ".2s" };
      layout[`xaxis${row}`] = { showgrid: false, zeroline: false, color: "#3d4560", tickfont: { size: 9 } };
      row++;
    }
    if (showRSI) {
      traces.push({
        x: chart.dates, y: chart.rsi,
        type: "scatter", mode: "lines", name: "RSI",
        line: { color: "#6ee7b7", width: 1.5 },
        xaxis: `x${row}`, yaxis: `y${row}`,
        hovertemplate: "RSI: %{y:.1f}<extra></extra>",
      });
      layout[`yaxis${row}`] = {
        showgrid: true, gridcolor: "rgba(255,255,255,0.04)",
        zeroline: false, color: "#3d4560", tickfont: { size: 9 },
        range: [0, 100],
      };
      layout[`xaxis${row}`] = { showgrid: false, zeroline: false, color: "#3d4560", tickfont: { size: 9 } };

      // RSI overbought/oversold lines
      layout.shapes = [
        ...(layout.shapes || []),
        { type: "line", xref: `x${row}`, yref: `y${row}`, x0: chart.dates[0], x1: chart.dates[chart.dates.length-1], y0: 70, y1: 70, line: { color: "#f45b5b", dash: "dot", width: 1 } },
        { type: "line", xref: `x${row}`, yref: `y${row}`, x0: chart.dates[0], x1: chart.dates[chart.dates.length-1], y0: 30, y1: 30, line: { color: "#22d87a", dash: "dot", width: 1 } },
      ];
    }

    // Heights
    const mainPct = showVol && showRSI ? 0.6 : 0.7;
    const subH = (1 - mainPct - 0.04) / (showVol && showRSI ? 2 : 1);
    layout.yaxis = { ...layout.yaxis, domain: [1 - mainPct, 1] };
    if (showVol) layout.yaxis2 = { ...(layout.yaxis2 || {}), domain: showRSI ? [subH + 0.02, subH * 2 + 0.02] : [0, subH] };
    if (showRSI) layout[`yaxis${showVol ? 3 : 2}`] = { ...(layout[`yaxis${showVol ? 3 : 2}`] || {}), domain: [0, subH] };
  }

  Plotly.react("mainChart", traces, layout, PLOTLY_CONFIG);
  document.getElementById("mainChart").style.minHeight = hasSubplot ? "520px" : "360px";
}

// ── Compare ──
document.getElementById("runCompare")?.addEventListener("click", runCompare);

async function runCompare() {
  const inputs = [1, 2, 3, 4, 5].map(i => document.getElementById(`cmp${i}`)?.value.trim().toUpperCase()).filter(Boolean);
  if (!inputs.length) return;

  const normalize = document.getElementById("normalizeToggle")?.checked;
  setLoading("compareLoading", true);

  try {
    const params = new URLSearchParams({ tickers: inputs.join(","), period: state.cPeriod, normalize: normalize.toString() });
    const res = await fetch(`/api/compare?${params}`);
    const data = await res.json();

    if (data.error) { showToast("⚠ " + data.error, "error"); return; }

    const COLORS = ["#4f9cf9", "#22d87a", "#f5c842", "#f45b5b", "#c084fc"];
    const traces = Object.entries(data).map(([ticker, d], i) => ({
      x: d.dates,
      y: d.prices,
      type: "scatter",
      mode: "lines",
      name: ticker,
      line: { color: COLORS[i % COLORS.length], width: 2 },
      hovertemplate: `${ticker}: <b>${normalize ? "$%{y:,.0f}" : "$%{y:.2f}"}</b><extra></extra>`,
    }));

    const layout = {
      ...PLOTLY_LAYOUT(),
      showlegend: true,
      yaxis: {
        showgrid: true,
        gridcolor: "rgba(255,255,255,0.04)",
        zeroline: false, color: "#3d4560",
        tickfont: { size: 10 },
        tickformat: normalize ? "$,.0f" : "$.2f",
      },
    };

    Plotly.react("compareChart", traces, layout, PLOTLY_CONFIG);

    if (normalize) {
      showToast("Normalized to $10,000 starting value", "success");
    }
  } catch (err) {
    showToast("Compare error: " + err.message, "error");
  } finally {
    setLoading("compareLoading", false);
  }
}

// ── Alerts ──
document.getElementById("addAlertBtn")?.addEventListener("click", addAlert);

function addAlert() {
  const ticker = document.getElementById("alertTicker").value.trim().toUpperCase();
  const dir = document.getElementById("alertDir").value;
  const price = parseFloat(document.getElementById("alertPrice").value);

  if (!ticker || isNaN(price)) { showToast("Enter a ticker and target price", "error"); return; }

  const alert = { id: Date.now(), ticker, dir, price, triggered: false };
  state.alerts.push(alert);
  renderAlerts();
  showToast(`Alert set: ${ticker} ${dir === "above" ? "↑" : "↓"} $${price.toFixed(2)}`, "success");

  document.getElementById("alertTicker").value = "";
  document.getElementById("alertPrice").value = "";

  // Start polling if not already
  if (!state.alertInterval) {
    state.alertInterval = setInterval(checkAlerts, 30000);
    checkAlerts();
  }
}

function renderAlerts() {
  const list = document.getElementById("alertsList");
  const empty = document.getElementById("noAlerts");
  if (!state.alerts.length) {
    list.innerHTML = "";
    empty.style.display = "block";
    return;
  }
  empty.style.display = "none";
  list.innerHTML = state.alerts.map(a => `
    <div class="alert-item ${a.triggered ? "triggered" : ""}" data-id="${a.id}">
      <div class="alert-info">
        <span class="alert-ticker">${a.ticker}</span>
        <span class="alert-desc">${a.dir === "above" ? "rises above" : "falls below"} $${a.price.toFixed(2)}</span>
      </div>
      <div style="display:flex;gap:10px;align-items:center">
        <span class="alert-status ${a.triggered ? "triggered" : "active"}">${a.triggered ? "⚡ Triggered" : "● Watching"}</span>
        <button class="delete-alert" onclick="removeAlert(${a.id})">✕</button>
      </div>
    </div>
  `).join("");
}

function removeAlert(id) {
  state.alerts = state.alerts.filter(a => a.id !== id);
  renderAlerts();
  if (!state.alerts.length && state.alertInterval) {
    clearInterval(state.alertInterval);
    state.alertInterval = null;
  }
}

async function checkAlerts() {
  if (!state.alerts.length) return;
  const tickers = [...new Set(state.alerts.map(a => a.ticker))];
  for (const ticker of tickers) {
    try {
      const res = await fetch(`/api/quote/${ticker}?period=1M`);
      const data = await res.json();
      if (data.error || !data.current_price) continue;
      const price = data.current_price;

      state.alerts.forEach(alert => {
        if (alert.ticker !== ticker || alert.triggered) return;
        if ((alert.dir === "above" && price >= alert.price) ||
            (alert.dir === "below" && price <= alert.price)) {
          alert.triggered = true;
          showToast(`🔔 ${ticker} hit $${price.toFixed(2)} — Alert triggered!`, "warning");
        }
      });
    } catch (e) { /* silent */ }
  }
  renderAlerts();
}

// ── Init ──
// Activate default period button
document.querySelectorAll('.period-btn[data-period]').forEach(b => {
  b.classList.remove('active');
  if (b.dataset.period === '1Y') b.classList.add('active');
});
