/**
 * TradeTab.jsx
 *
 * Buy/sell goods at market. Prices fluctuate each season.
 */

import { RESOURCE_CONFIG, BASE_SELL_PRICES, BASE_BUY_PRICES } from "../data/economy.js";

function SellPanel({ inventory, marketPrices, onSell }) {
  const sellableResources = Object.entries(inventory).filter(([res, qty]) => {
    return qty > 0 && marketPrices.sell?.[res];
  });

  return (
    <div>
      <h4
        className="text-base font-bold uppercase tracking-wider mb-2"
        style={{ fontFamily: "Cinzel, serif", color: "#4a8a3a" }}
      >
        Sell Goods
      </h4>
      {sellableResources.length === 0 ? (
        <p className="text-sm italic" style={{ color: "#8a7a3a" }}>
          Your stores are empty. Build production facilities on the Estate tab to generate goods for trade.
        </p>
      ) : (
        <div className="space-y-2">
          {sellableResources.map(([resource, qty]) => {
            const cfg = RESOURCE_CONFIG[resource];
            const price = marketPrices.sell[resource];
            return (
              <div
                key={resource}
                className="flex items-center justify-between p-2.5 rounded-md"
                style={{ border: "1px solid #6a5a42", backgroundColor: "#1a1610" }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{cfg?.icon}</span>
                  <div>
                    <span className="text-base font-semibold" style={{ color: "#c8b090" }}>
                      {cfg?.label || resource}
                    </span>
                    <span className="text-sm ml-2" style={{ color: "#a89070" }}>
                      ({qty} in stock)
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold" style={{ color: "#4a8a3a" }}>
                    {price}d each
                  </span>
                  <div className="flex gap-1">
                    {[1, 5].map((amount) => (
                      <button
                        key={amount}
                        disabled={qty < amount}
                        onClick={() => onSell(resource, amount)}
                        className="min-w-[44px] min-h-[44px] px-3 py-2 rounded text-sm font-semibold uppercase cursor-pointer transition-all duration-200"
                        style={{
                          fontFamily: "Cinzel, serif",
                          backgroundColor: qty >= amount ? "#4a8a3a" : "#2a2318",
                          border: qty >= amount ? "1px solid #2a5a2a" : "1px solid #3a3228",
                          color: qty >= amount ? "#e8c44a" : "#6a5a42",
                          cursor: qty >= amount ? "pointer" : "not-allowed",
                        }}
                        onMouseEnter={(e) => { if (qty >= amount) e.currentTarget.style.backgroundColor = "#5a9a4a"; }}
                        onMouseLeave={(e) => { if (qty >= amount) e.currentTarget.style.backgroundColor = "#4a8a3a"; }}
                        aria-label={`Sell ${amount} ${cfg?.label || resource}`}
                      >
                        {amount}
                      </button>
                    ))}
                    <button
                      disabled={qty <= 0}
                      onClick={() => onSell(resource, qty)}
                      className="min-w-[44px] min-h-[44px] px-3 py-2 rounded text-sm font-semibold uppercase cursor-pointer transition-all duration-200"
                      style={{
                        fontFamily: "Cinzel, serif",
                        backgroundColor: qty > 0 ? "#4a8a3a" : "#2a2318",
                        border: qty > 0 ? "1px solid #2a5a2a" : "1px solid #3a3228",
                        color: qty > 0 ? "#e8c44a" : "#6a5a42",
                        cursor: qty > 0 ? "pointer" : "not-allowed",
                      }}
                      onMouseEnter={(e) => { if (qty > 0) e.currentTarget.style.backgroundColor = "#5a9a4a"; }}
                      onMouseLeave={(e) => { if (qty > 0) e.currentTarget.style.backgroundColor = "#4a8a3a"; }}
                      aria-label={`Sell all ${cfg?.label || resource}`}
                    >
                      All
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const BUYABLE_HINTS = {
  salt: "Preserves food \u2014 boosts People each season (consumed on use)",
  tools: "Improves efficiency \u2014 boosts Treasury each season (consumed on use)",
  spices: "Church ceremonies \u2014 boosts Faith each season (consumed on use)",
};

function BuyPanel({ denarii, marketPrices, onBuy }) {
  const buyableResources = Object.entries(marketPrices.buy || {}).filter(([, price]) => price > 0);

  return (
    <div>
      <h4
        className="text-base font-bold uppercase tracking-wider mb-2"
        style={{ fontFamily: "Cinzel, serif", color: "#c62828" }}
      >
        Buy Goods
      </h4>
      <div className="space-y-2">
        {buyableResources.map(([resource, price]) => {
          const cfg = RESOURCE_CONFIG[resource];
          const canAfford1 = denarii >= price;
          const canAfford5 = denarii >= price * 5;
          return (
            <div
              key={resource}
              className="flex items-center justify-between p-2.5 rounded-md"
              style={{ border: "1px solid #6a5a42", backgroundColor: "#1a1610" }}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{cfg?.icon}</span>
                <span className="text-base font-semibold" style={{ color: "#c8b090" }}>
                  {cfg?.label || resource}
                </span>
                {BUYABLE_HINTS[resource] && (
                  <div className="text-xs" style={{ color: "#8a7a3a" }}>
                    {BUYABLE_HINTS[resource]}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold" style={{ color: "#c62828" }}>
                  {price}d each
                </span>
                <div className="flex gap-1">
                  <button
                    disabled={!canAfford1}
                    onClick={() => onBuy(resource, 1)}
                    className="min-w-[44px] min-h-[44px] px-3 py-2 rounded text-sm font-semibold uppercase cursor-pointer transition-all duration-200"
                    style={{
                      fontFamily: "Cinzel, serif",
                      backgroundColor: canAfford1 ? "#8b1a1a" : "#2a2318",
                      border: canAfford1 ? "1px solid #5a1010" : "1px solid #3a3228",
                      color: canAfford1 ? "#e8c44a" : "#6a5a42",
                      cursor: canAfford1 ? "pointer" : "not-allowed",
                    }}
                    onMouseEnter={(e) => { if (canAfford1) e.currentTarget.style.backgroundColor = "#a52020"; }}
                    onMouseLeave={(e) => { if (canAfford1) e.currentTarget.style.backgroundColor = "#8b1a1a"; }}
                    aria-label={`Buy 1 ${cfg?.label || resource} for ${price}d`}
                  >
                    1
                  </button>
                  <button
                    disabled={!canAfford5}
                    onClick={() => onBuy(resource, 5)}
                    className="min-w-[44px] min-h-[44px] px-3 py-2 rounded text-sm font-semibold uppercase cursor-pointer transition-all duration-200"
                    style={{
                      fontFamily: "Cinzel, serif",
                      backgroundColor: canAfford5 ? "#8b1a1a" : "#2a2318",
                      border: canAfford5 ? "1px solid #5a1010" : "1px solid #3a3228",
                      color: canAfford5 ? "#e8c44a" : "#6a5a42",
                      cursor: canAfford5 ? "pointer" : "not-allowed",
                    }}
                    onMouseEnter={(e) => { if (canAfford5) e.currentTarget.style.backgroundColor = "#a52020"; }}
                    onMouseLeave={(e) => { if (canAfford5) e.currentTarget.style.backgroundColor = "#8b1a1a"; }}
                    aria-label={`Buy 5 ${cfg?.label || resource} for ${price * 5}d`}
                  >
                    5
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function TradeTab({ state, onSell, onBuy }) {
  const { inventory, denarii, marketPrices } = state;

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Denarii display */}
      <div
        className="rounded-lg p-3 mb-4 text-center"
        style={{ backgroundColor: "#231e16", border: "1px solid #c4a24a" }}
      >
        <span className="text-lg font-bold" style={{ fontFamily: "Cinzel, serif", color: "#e8c44a" }}>
          Treasury: {denarii}d
        </span>
        <p className="text-sm mt-1" style={{ color: "#8a7a3a" }}>
          Prices fluctuate each season. Buy low, sell high.
        </p>
      </div>

      <div className="space-y-6">
        <SellPanel inventory={inventory} marketPrices={marketPrices} onSell={onSell} />
        <BuyPanel denarii={denarii} marketPrices={marketPrices} onBuy={onBuy} />
      </div>
    </div>
  );
}
