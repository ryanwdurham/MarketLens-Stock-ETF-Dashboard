from flask import Flask, render_template, jsonify, request
import yfinance as yf
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import json

app = Flask(__name__)

POPULAR_TICKERS = {
    "ETFs": ["QQQ", "VOO", "VTI", "SPY", "IVV", "SCHD", "VGT", "ARKK"],
    "Stocks": ["AAPL", "MSFT", "NVDA", "GOOGL", "AMZN", "TSLA", "META", "BRK-B"],
}

PERIOD_MAP = {
    "1M": ("1mo", "1d"),
    "3M": ("3mo", "1d"),
    "6M": ("6mo", "1d"),
    "1Y": ("1y", "1d"),
    "3Y": ("3y", "1wk"),
    "5Y": ("5y", "1wk"),
}


def calculate_moving_averages(df):
    df["MA20"] = df["Close"].rolling(window=20).mean()
    df["MA50"] = df["Close"].rolling(window=50).mean()
    df["MA200"] = df["Close"].rolling(window=200).mean()
    return df


def calculate_rsi(series, period=14):
    delta = series.diff()
    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)
    avg_gain = gain.rolling(window=period).mean()
    avg_loss = loss.rolling(window=period).mean()
    rs = avg_gain / avg_loss
    return 100 - (100 / (1 + rs))


def safe_float(val):
    try:
        if val is None or (isinstance(val, float) and np.isnan(val)):
            return None
        return float(val)
    except Exception:
        return None


@app.route("/")
def index():
    return render_template("index.html", popular=POPULAR_TICKERS)


@app.route("/api/quote/<ticker>")
def get_quote(ticker):
    try:
        ticker = ticker.upper().strip()
        period = request.args.get("period", "1Y")
        yf_period, yf_interval = PERIOD_MAP.get(period, ("1y", "1d"))

        tk = yf.Ticker(ticker)
        hist = tk.history(period=yf_period, interval=yf_interval)

        if hist.empty:
            return jsonify({"error": f"No data found for {ticker}"}), 404

        hist = calculate_moving_averages(hist)
        hist["RSI"] = calculate_rsi(hist["Close"])
        hist["DailyReturn"] = hist["Close"].pct_change() * 100

        info = tk.info

        # Build chart data
        dates = hist.index.strftime("%Y-%m-%d").tolist()
        close = [safe_float(v) for v in hist["Close"].tolist()]
        volume = [safe_float(v) for v in hist["Volume"].tolist()]
        ma20 = [safe_float(v) for v in hist["MA20"].tolist()]
        ma50 = [safe_float(v) for v in hist["MA50"].tolist()]
        ma200 = [safe_float(v) for v in hist["MA200"].tolist()]
        rsi = [safe_float(v) for v in hist["RSI"].tolist()]

        current_price = safe_float(hist["Close"].iloc[-1])
        prev_close = safe_float(hist["Close"].iloc[-2]) if len(hist) > 1 else current_price
        change = current_price - prev_close if current_price and prev_close else 0
        change_pct = (change / prev_close * 100) if prev_close else 0

        week_52_high = safe_float(info.get("fiftyTwoWeekHigh")) or safe_float(hist["Close"].max())
        week_52_low = safe_float(info.get("fiftyTwoWeekLow")) or safe_float(hist["Close"].min())
        avg_volume = safe_float(info.get("averageVolume")) or safe_float(hist["Volume"].mean())
        market_cap = safe_float(info.get("marketCap"))
        pe_ratio = safe_float(info.get("trailingPE"))
        dividend_yield = safe_float(info.get("dividendYield"))
        beta = safe_float(info.get("beta"))

        # 30-day volatility
        returns = hist["Close"].pct_change().dropna()
        volatility = safe_float(returns.tail(30).std() * np.sqrt(252) * 100)

        # Simple trend signal
        last_ma20 = ma20[-1] if ma20 else None
        last_ma50 = ma50[-1] if ma50 else None
        if last_ma20 and last_ma50 and current_price:
            if current_price > last_ma20 > last_ma50:
                trend = "Bullish"
            elif current_price < last_ma20 < last_ma50:
                trend = "Bearish"
            else:
                trend = "Neutral"
        else:
            trend = "Neutral"

        return jsonify({
            "ticker": ticker,
            "name": info.get("longName") or info.get("shortName") or ticker,
            "current_price": current_price,
            "change": round(change, 2),
            "change_pct": round(change_pct, 2),
            "week_52_high": week_52_high,
            "week_52_low": week_52_low,
            "avg_volume": avg_volume,
            "market_cap": market_cap,
            "pe_ratio": pe_ratio,
            "dividend_yield": round(dividend_yield * 100, 2) if dividend_yield else None,
            "beta": beta,
            "volatility": volatility,
            "trend": trend,
            "chart": {
                "dates": dates,
                "close": close,
                "volume": volume,
                "ma20": ma20,
                "ma50": ma50,
                "ma200": ma200,
                "rsi": rsi,
            }
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/compare")
def compare():
    try:
        tickers_raw = request.args.get("tickers", "QQQ,VOO,VTI")
        period = request.args.get("period", "1Y")
        normalize = request.args.get("normalize", "false").lower() == "true"
        tickers = [t.strip().upper() for t in tickers_raw.split(",") if t.strip()][:5]

        yf_period, yf_interval = PERIOD_MAP.get(period, ("1y", "1d"))

        result = {}
        for ticker in tickers:
            try:
                tk = yf.Ticker(ticker)
                hist = tk.history(period=yf_period, interval=yf_interval)
                if hist.empty:
                    continue
                dates = hist.index.strftime("%Y-%m-%d").tolist()
                prices = [safe_float(v) for v in hist["Close"].tolist()]
                if normalize and prices:
                    base = prices[0]
                    prices = [round((p / base) * 10000, 2) if p else None for p in prices]
                result[ticker] = {"dates": dates, "prices": prices}
            except Exception:
                continue

        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)
