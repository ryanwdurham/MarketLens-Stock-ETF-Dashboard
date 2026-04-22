
# ◈ MarketLens — Stock & ETF Dashboard

> A clean, beginner-friendly stock tracker you can run on your own computer. No subscriptions. No ads. No confusing jargon. Just the data you need.

![Python](https://img.shields.io/badge/Python-3.9+-blue?style=flat-square&logo=python)
![Flask](https://img.shields.io/badge/Flask-3.0+-lightgrey?style=flat-square&logo=flask)
![Data](https://img.shields.io/badge/Data-Yahoo%20Finance-purple?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

---

## 📸 Screenshots
---

<img width="1920" height="1020" alt="marketlens" src="https://github.com/user-attachments/assets/8acd378d-40f0-43ef-8ed4-9b5d787c9bad" />

<img width="1920" height="1020" alt="marketlens2" src="https://github.com/user-attachments/assets/fbd82d8e-ba47-4cc4-a71b-03fdaed7e1b1" />


---


## ✨ Features

### 📈 Overview — Your Main Dashboard
The heart of the app. Type any ticker and instantly see:
- A big, interactive price chart (you can zoom in, hover for exact prices, and more)
- How the price is doing **today** (green = up, red = down)
- Key numbers explained below 👇

- ## 🤔 Wait, what even IS a stock or ETF?

No worries if you're new to this — here's the plain-English version:

- **Stock** = A tiny piece of ownership in a company. When you buy Apple stock (AAPL), you own a sliver of Apple Inc.
- **ETF** (Exchange-Traded Fund) = A basket of many stocks bundled together. Instead of picking one company, you buy a little of many at once. It's like buying a "greatest hits" album instead of betting on one song.
  - **QQQ** = tracks the top 100 tech companies (Apple, Microsoft, Google, etc.)
  - **VOO** = tracks the S&P 500 — the 500 biggest US companies
  - **VTI** = tracks the *entire* US stock market — thousands of companies at once
- **Ticker** = The short code for a stock or ETF (AAPL = Apple, TSLA = Tesla, QQQ = that tech ETF)
- **Price chart** = A graph showing how the price changed over time — up is good, down is less fun

This app lets you look up any of these and see how they're doing — visually, simply, and for free.


---


### 📊 What Do All Those Numbers Mean?

| Stat | Plain English |
|---|---|
| **Current Price** | What the stock costs right now (delayed ~15 min) |
| **Daily Change** | How much the price moved since yesterday's close |
| **52-Week High** | The highest price it's been in the last year |
| **52-Week Low** | The lowest price it's been in the last year |
| **Avg Volume** | How many shares typically change hands per day — higher = more popular/liquid |
| **Market Cap** | Total value of the whole company (price × all shares) |
| **P/E Ratio** | "Price-to-Earnings" — a rough measure of how expensive the stock is. Lower can mean cheaper, higher can mean investors expect big growth |
| **Dividend Yield** | Some companies pay you just for owning the stock — this is that % per year |
| **Beta** | How jumpy the stock is vs. the market. Above 1 = more volatile, below 1 = calmer |
| **30D Volatility** | How much the price has been swinging around lately |
| **Trend Signal** | A simple Bullish / Bearish / Neutral read based on the moving averages |

### 📉 Moving Averages (MA) — What Are Those Lines on the Chart?
Moving averages smooth out the noise so you can see the bigger trend:
- **MA 20** (blue dotted) = Average price of the last 20 trading days
- **MA 50** (yellow dotted) = Average of last 50 days
- **MA 200** (purple dotted) = Average of last 200 days

> **Rule of thumb:** When the price is *above* the MA 200, many traders consider that a healthy long-term trend. When it dips *below*, some see it as a warning sign.

### ⚖️ Compare — Side-by-Side
Put up to 5 tickers on the same chart. The "Normalize to $10,000" option is the most useful feature here — it pretends everyone started with the same $10,000 investment so you can fairly compare who grew more, regardless of share price.

### 🔔 Alerts — Price Notifications
Set a target price (e.g., "tell me if QQQ goes above $500"). The app checks every 30 seconds and shows a notification when it hits. Great for watching a price you're waiting on.

### 📏 52-Week Range Bar
A visual bar showing where the current price sits between the yearly high and low. Is it near the top? Near the bottom? Glance and know.

---

## 🚀 Getting Started

### What You'll Need
- Python 3.9 or newer ([download here](https://www.python.org/downloads/))
- A terminal / command prompt (it's easier than it sounds, promise)

### Step-by-Step Setup

**1. Download or clone this project**
```bash
git clone https://github.com/YOUR-USERNAME/marketlens.git
cd marketlens
```

**2. Create a virtual environment** *(keeps things tidy on your computer)*
```bash
# Mac / Linux
python -m venv venv
source venv/bin/activate

# Windows
python -m venv venv
venv\Scripts\activate
```

**3. Install the required packages**
```bash
pip install -r requirements.txt
```

**4. Start the app**
```bash
python app.py
```

**5. Open your browser and go to:**
```
http://localhost:5000
```

That's it! 🎉 Type a ticker like `QQQ` or `AAPL` and the chart loads instantly.

---

## 🗂️ Project Structure

```
marketlens/
├── app.py                 ← The Python server (handles all the data fetching)
├── requirements.txt       ← List of packages to install
├── templates/
│   └── index.html         ← The webpage layout
└── static/
    ├── css/
    │   └── style.css      ← All the visual styling (dark theme, colors, layout)
    └── js/
        └── app.js         ← The interactive behavior (charts, buttons, alerts)
```

---

## 🛠️ Tech Stack

| Tool | What It Does | Cost |
|---|---|---|
| **Python + Flask** | Runs the local web server | Free |
| **yfinance** | Fetches real stock data from Yahoo Finance | Free, no API key |
| **Plotly.js** | Powers the interactive charts | Free |
| **HTML + CSS + JS** | The frontend interface | Free |

> 💡 No database, no accounts, no cloud costs. Everything runs on your machine.

---

## 💡 Tips & Customization

**Add your own default tickers** — open `app.py` and edit the `POPULAR_TICKERS` dictionary at the top.

**Change the color theme** — open `static/css/style.css` and edit the variables at the top of the file (the `:root` block).

**Data is delayed ~15 minutes** — this is a Yahoo Finance limitation on free data. Fine for research, not for split-second trading.

---

## ❓ Troubleshooting

| Problem | Fix |
|---|---|
| `ModuleNotFoundError` | Make sure you ran `pip install -r requirements.txt` with the virtual environment active |
| Ticker shows "No data found" | Double-check the symbol. Use `BRK-B` not `BRK.B` for Berkshire Hathaway |
| Page won't load | Make sure `python app.py` is still running in your terminal |
| Chart is slow to load | yfinance fetches live data — first load takes 1–3 seconds, normal |

---

## 📄 License

MIT — use it, modify it, share it freely.

---

## 🙏 Acknowledgements

- [yfinance](https://github.com/ranaroussi/yfinance) for making free financial data accessible
- [Plotly](https://plotly.com/) for the beautiful interactive charts
- [Yahoo Finance](https://finance.yahoo.com/) for the underlying data
