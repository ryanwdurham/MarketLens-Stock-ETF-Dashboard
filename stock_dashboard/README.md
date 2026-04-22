# ◈ MarketLens — Stock & ETF Dashboard

A professional stock and ETF tracker with interactive charts, moving averages,
comparison tools, and price alerts. Built with Flask + Plotly + yfinance.

---

## 📁 Project Structure

```
stock_dashboard/
├── app.py                  ← Flask backend (all API routes)
├── requirements.txt        ← Python dependencies
├── templates/
│   └── index.html          ← Main HTML page
└── static/
    ├── css/
    │   └── style.css       ← All styles (dark professional theme)
    └── js/
        └── app.js          ← Frontend logic, charting, alerts
```

---

## 🚀 Setup & Run (Step by Step)

### Step 1 — Make sure Python is installed
```bash
python --version
# Should be 3.9 or higher
```

### Step 2 — Create a virtual environment (recommended)
```bash
cd stock_dashboard
python -m venv venv

# Activate it:
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate
```

### Step 3 — Install dependencies
```bash
pip install -r requirements.txt
```

### Step 4 — Run the app
```bash
python app.py
```

### Step 5 — Open in browser
```
http://localhost:5000
```

---

## ✨ Features

| Feature | Description |
|---|---|
| **Overview** | Big interactive price chart with MA overlays (20/50/200), volume, RSI |
| **Time Periods** | 1M / 3M / 6M / 1Y / 3Y / 5Y toggles |
| **Stats Cards** | Price, change, 52W high/low, market cap, P/E, dividend, beta, volatility |
| **Trend Signal** | Bullish / Bearish / Neutral based on MA crossovers |
| **52W Range Bar** | Visual indicator of where price sits in 52-week range |
| **Compare** | Compare up to 5 tickers side-by-side, with normalize to $10K option |
| **Alerts** | Set price threshold alerts; auto-checks every 30 seconds |
| **Quick Tickers** | Sidebar shortcuts for popular ETFs and stocks |

---

## 📊 Data Source
- **yfinance** (Yahoo Finance) — free, no API key required
- Data is real-time delayed (~15 min)

---

## 🛠 Customization Tips

**Add more default tickers** → Edit `POPULAR_TICKERS` in `app.py`

**Change color scheme** → Edit CSS variables at top of `style.css`

**Add more indicators** → Add calculations in `app.py` and traces in `app.js`

---

## 🐛 Troubleshooting

| Problem | Fix |
|---|---|
| `ModuleNotFoundError` | Run `pip install -r requirements.txt` |
| Ticker shows "No data found" | Double-check the symbol (e.g. BRK-B not BRK.B) |
| Chart doesn't load | Check browser console for JS errors |
| Slow to load | yfinance fetches live data; first load may take 2-3 seconds |
