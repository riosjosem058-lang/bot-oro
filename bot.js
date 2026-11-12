const TELEGRAM_TOKEN = '16338814:AAF1b2jX8RzBaLnkW_oexiYpUH_2ICDo-o4';
const CHAT_ID = '6025308114';
const SYMBOL = 'PAXGUSDT'; 
const TIMEFRAME = '15m';

async function analizarMercado() {
  try {
    const res = await fetch(`https://api.binance.com/api/v3/klines?symbol=${SYMBOL}&interval=${TIMEFRAME}&limit=50`);
    const data = await res.json();
    const candles = data.map(v => ({ open: parseFloat(v[1]), close: parseFloat(v[4]) }));

    function calcEMA(data, period) {
      let k = 2 / (period + 1);
      let ema = data.slice(0, period).reduce((a, b) => a + b.close, 0) / period;
      for (let i = period; i < data.length; i++) ema = (data[i].close - ema) * k + ema;
      return ema;
    }
    function calcRSI(data, period = 14) {
      let gains = 0, losses = 0;
      for (let i = data.length - period; i < data.length; i++) {
        const diff = data[i].close - data[i-1].close;
        if (diff >= 0) gains += diff; else losses -= diff;
      }
      const avgGain = gains / period, avgLoss = losses / period;
      if (avgLoss === 0) return 100;
      return 100 - (100 / (1 + (avgGain / avgLoss)));
    }

    const currentEma9 = calcEMA(candles, 9);
    const currentEma21 = calcEMA(candles, 21);
    const prevEma9 = calcEMA(candles.slice(0, -1), 9);
    const prevEma21 = calcEMA(candles.slice(0, -1), 21);
    const rsi = calcRSI(candles, 14);
    const lastPrice = candles[candles.length - 1].close;
    
    const crossUp = (prevEma9 <= prevEma21) && (currentEma9 > currentEma21);
    const crossDown = (prevEma9 >= prevEma21) && (currentEma9 < currentEma21);

    let message = "";
    if (crossUp && rsi > 30 && rsi < 65) {
      message = `🟢 ¡SEÑAL DE COMPRA (LONG)!\n\nEl Oro ha cruzado hacia arriba.\n💰 Precio: $${lastPrice.toFixed(2)}\n📊 RSI: ${rsi.toFixed(2)}\n\n(Revisa tu MT5)`;
    } else if (crossDown && rsi > 35 && rsi < 70) {
      message = `🔴 ¡SEÑAL DE VENTA (SHORT)!\n\nEl Oro ha cruzado hacia abajo.\n💰 Precio: $${lastPrice.toFixed(2)}\n📊 RSI: ${rsi.toFixed(2)}\n\n(Revisa tu MT5)`;
    }

    if (message !== "") {
      await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: CHAT_ID, text: message })
      });
      console.log("Señal enviada a Telegram");
    } else {
      console.log("Sin señal en este momento.");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}
analizarMercado();
