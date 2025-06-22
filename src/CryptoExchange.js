import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const CryptoExchange = () => {
  const [currentPrice, setCurrentPrice] = useState(49500);
  const [priceData, setPriceData] = useState([]);
  const [orderBook, setOrderBook] = useState({ bids: [], asks: [] });
  const [recentTrades, setRecentTrades] = useState([]);
  const [candleData, setCandleData] = useState([]);
  const [timeframe, setTimeframe] = useState('1H');
  const [orderForm, setOrderForm] = useState({
    side: 'buy',
    type: 'market',
    amount: '',
    price: ''
  });
  const [isConnected, setIsConnected] = useState(true);
  const [stats, setStats] = useState({
    volume24h: 2847.32,
    change24h: 2.45,
    high24h: 52100,
    low24h: 47800
  });

  const intervalRef = useRef();
  const candleIntervalRef = useRef();

  // Price simulation with realistic noise
  const generateNextPrice = (currentPrice) => {
    const microNoise = (Math.random() - 0.5) * 0.002; // ±0.2%
    const smallNoise = (Math.random() - 0.5) * 0.005; // ±0.5%
    const mediumNoise = (Math.random() - 0.5) * 0.012; // ±1.2%
    const largeNoise = Math.random() < 0.05 ? (Math.random() - 0.5) * 0.025 : 0; // ±2.5% with 5% probability
    
    const totalNoise = microNoise + smallNoise + mediumNoise + largeNoise;
    const trendBias = (Math.random() - 0.5) * 0.001; // Weak trend
    
    return currentPrice * (1 + totalNoise + trendBias);
  };

  // Generate order book data
  const generateOrderBook = (currentPrice) => {
    const bids = [];
    const asks = [];
    
    for (let i = 0; i < 15; i++) {
      const bidPrice = currentPrice - (i + 1) * (10 + Math.random() * 20);
      const askPrice = currentPrice + (i + 1) * (10 + Math.random() * 20);
      const bidQty = (Math.random() * 2 + 0.1).toFixed(4);
      const askQty = (Math.random() * 2 + 0.1).toFixed(4);
      
      bids.push([bidPrice.toFixed(2), bidQty]);
      asks.push([askPrice.toFixed(2), askQty]);
    }
    
    return { bids, asks };
  };

  // Generate random trades
  const generateTrade = (currentPrice) => {
    const side = Math.random() > 0.5 ? 'buy' : 'sell';
    const quantity = (Math.random() * 0.5 + 0.01).toFixed(4);
    const price = (currentPrice + (Math.random() - 0.5) * 50).toFixed(2);
    
    return {
      id: Date.now() + Math.random(),
      side,
      price,
      quantity,
      timestamp: new Date().toLocaleTimeString()
    };
  };

  // Generate candlestick data
  const generateCandle = (priceHistory) => {
    if (priceHistory.length < 4) return null;
    
    const recent = priceHistory.slice(-60); // Last 60 data points for 1-minute candle
    const open = recent[0]?.price || currentPrice;
    const close = recent[recent.length - 1]?.price || currentPrice;
    const high = Math.max(...recent.map(p => p.price));
    const low = Math.min(...recent.map(p => p.price));
    
    return {
      timestamp: Date.now(),
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume: (Math.random() * 50 + 10).toFixed(2),
      time: new Date().toLocaleTimeString()
    };
  };

  // Place order simulation
  const placeOrder = () => {
    if (!orderForm.amount) return;
    
    const order = {
      id: Date.now(),
      side: orderForm.side,
      type: orderForm.type,
      amount: orderForm.amount,
      price: orderForm.type === 'market' ? currentPrice.toFixed(2) : orderForm.price,
      status: 'filled',
      timestamp: new Date().toLocaleTimeString()
    };
    
    // Add to recent trades
    setRecentTrades(prev => [order, ...prev.slice(0, 19)]);
    
    // Reset form
    setOrderForm({
      ...orderForm,
      amount: '',
      price: ''
    });
    
    alert(`Order placed: ${order.side.toUpperCase()} ${order.amount} BTC at $${order.price}`);
  };

  // Initialize data
  useEffect(() => {
    // Generate initial price history
    const initialData = [];
    let price = 49500;
    for (let i = 0; i < 100; i++) {
      price = generateNextPrice(price);
      initialData.push({
        timestamp: Date.now() - (100 - i) * 3000,
        price: Number(price.toFixed(2)),
        time: new Date(Date.now() - (100 - i) * 3000).toLocaleTimeString()
      });
    }
    setPriceData(initialData);
    setCurrentPrice(price);

    // Generate initial candle data
    const initialCandles = [];
    for (let i = 0; i < 20; i++) {
      const segmentStart = i * 5;
      const segment = initialData.slice(segmentStart, segmentStart + 5);
      if (segment.length > 0) {
        const open = segment[0].price;
        const close = segment[segment.length - 1].price;
        const high = Math.max(...segment.map(p => p.price));
        const low = Math.min(...segment.map(p => p.price));
        
        initialCandles.push({
          timestamp: Date.now() - (20 - i) * 60000,
          open: Number(open.toFixed(2)),
          high: Number(high.toFixed(2)),
          low: Number(low.toFixed(2)),
          close: Number(close.toFixed(2)),
          volume: (Math.random() * 50 + 10).toFixed(2),
          time: new Date(Date.now() - (20 - i) * 60000).toLocaleTimeString()
        });
      }
    }
    setCandleData(initialCandles);

    // Generate initial trades
    const initialTrades = [];
    for (let i = 0; i < 10; i++) {
      initialTrades.push(generateTrade(price));
    }
    setRecentTrades(initialTrades);
  }, []);

  // Real-time updates
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      const newPrice = generateNextPrice(currentPrice);
      setCurrentPrice(newPrice);
      
      // Update price data
      setPriceData(prev => {
        const newData = [...prev, {
          timestamp: Date.now(),
          price: Number(newPrice.toFixed(2)),
          time: new Date().toLocaleTimeString()
        }].slice(-120); // Keep last 120 points
        return newData;
      });
      
      // Update order book
      setOrderBook(generateOrderBook(newPrice));
      
      // Occasionally add new trade
      if (Math.random() > 0.7) {
        setRecentTrades(prev => [generateTrade(newPrice), ...prev.slice(0, 19)]);
      }
      
      // Update 24h stats
      setStats(prev => ({
        ...prev,
        volume24h: prev.volume24h + Math.random() * 10,
        change24h: ((newPrice - 49500) / 49500 * 100),
        high24h: Math.max(prev.high24h, newPrice),
        low24h: Math.min(prev.low24h, newPrice)
      }));
    }, 3000);

    // Update candles every minute
    candleIntervalRef.current = setInterval(() => {
      setPriceData(prev => {
        const newCandle = generateCandle(prev);
        if (newCandle) {
          setCandleData(prevCandles => [...prevCandles, newCandle].slice(-50));
        }
        return prev;
      });
    }, 60000);

    return () => {
      clearInterval(intervalRef.current);
      clearInterval(candleIntervalRef.current);
    };
  }, [currentPrice]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">BTC/USD Exchange</h1>
            <div className="flex items-center space-x-4">
              <span className="text-4xl font-mono">{formatPrice(currentPrice)}</span>
              <span className={`text-lg ${stats.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {stats.change24h >= 0 ? '+' : ''}{stats.change24h.toFixed(2)}%
              </span>
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
              <span className="text-sm text-gray-400">Live</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 lg:flex lg:space-x-6 gap-4 lg:gap-0 mt-4 lg:mt-0">
            <div className="text-center">
              <div className="text-sm text-gray-400">24h Volume</div>
              <div className="font-semibold">{stats.volume24h.toFixed(2)} BTC</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-400">24h High</div>
              <div className="font-semibold text-green-400">{formatPrice(stats.high24h)}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-400">24h Low</div>
              <div className="font-semibold text-red-400">{formatPrice(stats.low24h)}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Chart Section */}
        <div className="xl:col-span-3">
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
              <h2 className="text-xl font-semibold mb-2 sm:mb-0">Price Chart</h2>
              <div className="flex space-x-2">
                {['1H', '1D', '1W', '1M'].map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={`px-3 py-1 rounded text-sm ${
                      timeframe === tf 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={priceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="time" 
                    stroke="#9CA3AF"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    domain={['dataMin - 100', 'dataMax + 100']}
                    stroke="#9CA3AF"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `$${value.toLocaleString()}`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }}
                    formatter={(value) => [formatPrice(value), 'Price']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="price" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    dot={false}
                    animationDuration={300}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Form */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Place Order</h3>
            
            <div className="flex space-x-2 mb-4">
              <button
                onClick={() => setOrderForm({...orderForm, side: 'buy'})}
                className={`flex-1 py-2 px-4 rounded ${
                  orderForm.side === 'buy' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-700 text-gray-300'
                }`}
              >
                Buy
              </button>
              <button
                onClick={() => setOrderForm({...orderForm, side: 'sell'})}
                className={`flex-1 py-2 px-4 rounded ${
                  orderForm.side === 'sell' 
                    ? 'bg-red-600 text-white' 
                    : 'bg-gray-700 text-gray-300'
                }`}
              >
                Sell
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Order Type</label>
                <select
                  value={orderForm.type}
                  onChange={(e) => setOrderForm({...orderForm, type: e.target.value})}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                >
                  <option value="market">Market</option>
                  <option value="limit">Limit</option>
                </select>
              </div>

              {orderForm.type === 'limit' && (
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Price (USD)</label>
                  <input
                    type="number"
                    value={orderForm.price}
                    onChange={(e) => setOrderForm({...orderForm, price: e.target.value})}
                    placeholder={currentPrice.toFixed(2)}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm text-gray-400 mb-1">Amount (BTC)</label>
                <input
                  type="number"
                  value={orderForm.amount}
                  onChange={(e) => setOrderForm({...orderForm, amount: e.target.value})}
                  placeholder="0.001"
                  step="0.001"
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                />
              </div>

              <button
                onClick={placeOrder}
                className={`w-full py-3 rounded font-semibold ${
                  orderForm.side === 'buy'
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                {orderForm.side === 'buy' ? 'Buy' : 'Sell'} BTC
              </button>
            </div>
          </div>

          {/* Order Book */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Order Book</h3>
            
            <div className="space-y-2 mb-4">
              <div className="text-xs text-gray-400 grid grid-cols-3 gap-2">
                <span>Price</span>
                <span className="text-right">Size</span>
                <span className="text-right">Total</span>
              </div>
              
              {/* Asks */}
              {orderBook.asks.slice(0, 8).reverse().map((ask, i) => (
                <div key={`ask-${i}`} className="grid grid-cols-3 gap-2 text-sm text-red-400">
                  <span>{formatPrice(ask[0])}</span>
                  <span className="text-right">{ask[1]}</span>
                  <span className="text-right">{(ask[0] * ask[1]).toFixed(2)}</span>
                </div>
              ))}
              
              {/* Current Price */}
              <div className="border-t border-b border-gray-600 py-2 my-2">
                <div className="text-center font-mono text-lg">
                  {formatPrice(currentPrice)}
                </div>
              </div>
              
              {/* Bids */}
              {orderBook.bids.slice(0, 8).map((bid, i) => (
                <div key={`bid-${i}`} className="grid grid-cols-3 gap-2 text-sm text-green-400">
                  <span>{formatPrice(bid[0])}</span>
                  <span className="text-right">{bid[1]}</span>
                  <span className="text-right">{(bid[0] * bid[1]).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Trades */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Trades</h3>
            
            <div className="space-y-2">
              <div className="text-xs text-gray-400 grid grid-cols-3 gap-2">
                <span>Time</span>
                <span className="text-right">Price</span>
                <span className="text-right">Size</span>
              </div>
              
              {recentTrades.slice(0, 15).map((trade, i) => (
                <div key={trade.id || i} className="grid grid-cols-3 gap-2 text-sm">
                  <span className="text-gray-400">{trade.timestamp}</span>
                  <span className={`text-right ${trade.side === 'buy' ? 'text-green-400' : 'text-red-400'}`}>
                    {formatPrice(trade.price)}
                  </span>
                  <span className="text-right text-gray-300">{trade.quantity}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CryptoExchange;