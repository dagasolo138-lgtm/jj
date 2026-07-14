import { createElement, useMemo } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Briefcase,
  Factory,
  Gauge,
  RotateCcw,
  ShieldCheck,
  Users,
  Wallet,
  Wheat,
} from "lucide-react";
import { ENGINE_MODES } from "../engine/agentEconomy/engineControlSystem.js";
import { getEconomyMonitorViewModel } from "../engine/agentEconomy/economyMonitorSelectors.js";

const COLORS = {
  gold: "#c4a24a",
  brightGold: "#e8c44a",
  text: "#c8b090",
  muted: "#8d7a62",
  panel: "#1a1610",
  panelDeep: "#12100d",
  border: "#4a3d2b",
  green: "#7da86a",
  red: "#c96c62",
  amber: "#d29a4a",
  blue: "#6d91a8",
};

function pct(value) {
  return `${Number(value ?? 0).toFixed(0)}%`;
}

function number(value, digits = 1) {
  return Number(value ?? 0).toLocaleString(undefined, {
    maximumFractionDigits: digits,
  });
}

function Panel({ title, icon: Icon, action, children }) {
  return (
    <section
      className="rounded-lg border overflow-hidden"
      style={{ backgroundColor: COLORS.panel, borderColor: COLORS.border }}
    >
      <div
        className="flex items-center justify-between gap-3 px-4 py-3 border-b"
        style={{ borderColor: COLORS.border, backgroundColor: "rgba(196, 162, 74, 0.04)" }}
      >
        <div className="flex items-center gap-2 min-w-0">
          {Icon && <Icon size={17} color={COLORS.gold} strokeWidth={1.7} />}
          <h2
            className="font-semibold uppercase tracking-wider text-sm truncate"
            style={{ color: COLORS.brightGold, fontFamily: "Cinzel, serif" }}
          >
            {title}
          </h2>
        </div>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function MetricCard({ icon: Icon, label, value, detail, tone = "gold" }) {
  const toneColor = {
    gold: COLORS.gold,
    green: COLORS.green,
    red: COLORS.red,
    amber: COLORS.amber,
    blue: COLORS.blue,
  }[tone];

  return (
    <div
      className="rounded-lg border p-3 min-w-0"
      style={{ backgroundColor: COLORS.panelDeep, borderColor: COLORS.border }}
    >
      <div className="flex items-center gap-2 mb-2">
        {createElement(Icon, { size: 15, color: toneColor, strokeWidth: 1.7 })}
        <span
          className="text-[10px] uppercase tracking-wider truncate"
          style={{ color: COLORS.muted, fontFamily: "Cinzel, serif" }}
        >
          {label}
        </span>
      </div>
      <div className="text-xl font-semibold" style={{ color: toneColor, fontFamily: "Cinzel, serif" }}>
        {value}
      </div>
      <div className="text-xs mt-1 truncate" style={{ color: COLORS.muted }}>
        {detail}
      </div>
    </div>
  );
}

function ProgressBar({ value, tone = COLORS.gold }) {
  const bounded = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "#30291f" }}>
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${bounded}%`, backgroundColor: tone }}
      />
    </div>
  );
}

function Sparkline({ values, trend }) {
  const points = Array.isArray(values) ? values.filter(Number.isFinite).slice(-20) : [];
  if (points.length < 2) {
    return <div className="w-20 h-7" aria-label="Not enough price history" />;
  }

  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = Math.max(0.001, max - min);
  const path = points.map((point, index) => {
    const x = (index / (points.length - 1)) * 78 + 1;
    const y = 25 - ((point - min) / span) * 22;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  const stroke = trend === "up" ? COLORS.green : trend === "down" ? COLORS.red : COLORS.gold;

  return (
    <svg width="80" height="28" viewBox="0 0 80 28" role="img" aria-label={`Price trend ${trend}`}>
      <polyline
        points={path}
        fill="none"
        stroke={stroke}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrendIcon({ trend }) {
  if (trend === "up") return <ArrowUpRight size={15} color={COLORS.green} />;
  if (trend === "down") return <ArrowDownRight size={15} color={COLORS.red} />;
  return <ArrowRight size={15} color={COLORS.gold} />;
}

function ModeButton({ active, disabled, onClick, children }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="px-3 py-2 rounded-md border text-xs uppercase tracking-wide transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      style={{
        borderColor: active ? COLORS.gold : COLORS.border,
        backgroundColor: active ? "rgba(196, 162, 74, 0.12)" : COLORS.panelDeep,
        color: active ? COLORS.brightGold : COLORS.muted,
        fontFamily: "Cinzel, serif",
      }}
    >
      {children}
    </button>
  );
}

function resolveOperatorMode() {
  if (typeof window === "undefined") return false;
  const query = new URLSearchParams(window.location.search).get("operator");
  try {
    if (query === "1") {
      window.localStorage.setItem("lords-ledger-operator-mode", "1");
      return true;
    }
    if (query === "0") {
      window.localStorage.removeItem("lords-ledger-operator-mode");
      return false;
    }
    return window.localStorage.getItem("lords-ledger-operator-mode") === "1";
  } catch {
    return query === "1";
  }
}

function ComparisonValue({ label, legacy, agent }) {
  return (
    <div className="grid grid-cols-[1fr_auto_auto] items-center gap-3 py-2 border-b last:border-b-0" style={{ borderColor: "#30291f" }}>
      <span className="text-xs" style={{ color: COLORS.text }}>{label}</span>
      <span className="text-xs tabular-nums" style={{ color: COLORS.muted }}>{legacy ?? "—"}</span>
      <span className="text-xs tabular-nums" style={{ color: COLORS.gold }}>{agent ?? "—"}</span>
    </div>
  );
}

export default function EconomyMonitorTab({ state, dispatch }) {
  const view = useMemo(() => getEconomyMonitorViewModel(state), [state]);
  const mode = view.mode;
  const comparison = view.comparison;
  const operatorMode = useMemo(resolveOperatorMode, []);

  function setMode(nextMode) {
    dispatch({ type: "AGENT_ECONOMY_SET_MODE", payload: { mode: nextMode } });
  }

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div
        className="rounded-lg border p-4"
        style={{
          background: "linear-gradient(135deg, rgba(196, 162, 74, 0.10), rgba(18, 16, 13, 0.96))",
          borderColor: COLORS.gold,
        }}
      >
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Activity size={20} color={COLORS.brightGold} />
              <h1
                className="text-xl uppercase tracking-widest font-bold"
                style={{ color: COLORS.brightGold, fontFamily: "Cinzel Decorative, Cinzel, serif" }}
              >
                Economy Monitor
              </h1>
            </div>
            <p className="text-sm max-w-2xl" style={{ color: COLORS.text }}>
              Household prices, employment, production chains and dual-engine safety. The legacy engine remains authoritative.
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs" style={{ color: COLORS.muted }}>
              <span>Economic day: <strong style={{ color: COLORS.gold }}>{view.day}</strong></span>
              <span>Requested: <strong style={{ color: COLORS.gold }}>{mode.requested}</strong></span>
              <span>Active: <strong style={{ color: COLORS.gold }}>{mode.active}</strong></span>
              <span>Authority: <strong style={{ color: COLORS.green }}>{mode.authority}</strong></span>
            </div>
          </div>

          {operatorMode && (
            <div className="flex flex-wrap gap-2 lg:justify-end">
              <ModeButton active={mode.active === ENGINE_MODES.LEGACY} onClick={() => setMode(ENGINE_MODES.LEGACY)}>
                Legacy only
              </ModeButton>
              <ModeButton active={mode.active === ENGINE_MODES.SHADOW} onClick={() => setMode(ENGINE_MODES.SHADOW)}>
                Shadow compare
              </ModeButton>
              <button
                type="button"
                onClick={() => dispatch({
                  type: "AGENT_ECONOMY_STOP_CANARY_CAMPAIGN",
                  payload: { reason: "operator-emergency-stop" },
                })}
                className="px-3 py-2 rounded-md border text-xs uppercase tracking-wide flex items-center gap-1.5"
                style={{ borderColor: "#78433c", color: COLORS.red, backgroundColor: "rgba(120, 67, 60, 0.10)", fontFamily: "Cinzel, serif" }}
              >
                <RotateCcw size={13} /> Emergency stop
              </button>
            </div>
          )}
        </div>

        {operatorMode && mode.blockers.length > 0 && mode.requested === ENGINE_MODES.CANARY && (
          <div className="mt-4 rounded-md border p-3 text-xs" style={{ borderColor: "#6f532a", backgroundColor: "rgba(210, 154, 74, 0.08)", color: COLORS.amber }}>
            Canary remains blocked: {mode.blockers.join(" · ")}
          </div>
        )}
      </div>

      {operatorMode && (
        <Panel
          title="Canary operator controls"
          icon={view.campaign.running ? ShieldCheck : AlertTriangle}
          action={(
            <span className="text-xs uppercase" style={{ color: view.campaign.running ? COLORS.green : COLORS.amber }}>
              {view.campaign.status}
            </span>
          )}
        >
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-4">
            <div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  ["Limit", `${view.campaign.quarterLimit} quarters`],
                  ["Committed", `${view.campaign.committedQuarters}/${view.campaign.quarterLimit}`],
                  ["Write-back", mode.writeBackEnabled ? "Enabled" : "Disabled"],
                  ["Authority", mode.authority],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-md p-3" style={{ backgroundColor: COLORS.panelDeep }}>
                    <div className="text-sm font-semibold" style={{ color: COLORS.gold }}>{value}</div>
                    <div className="text-[10px] uppercase mt-1" style={{ color: COLORS.muted }}>{label}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span style={{ color: COLORS.muted }}>Campaign progress</span>
                  <span style={{ color: COLORS.gold }}>{view.campaign.committedQuarters}/{view.campaign.quarterLimit}</span>
                </div>
                <ProgressBar value={view.campaign.progress} tone={view.campaign.running ? COLORS.green : COLORS.gold} />
              </div>
              {view.campaign.blockers.length > 0 && !view.campaign.running && (
                <div className="mt-3 text-xs" style={{ color: COLORS.amber }}>
                  Start blocked: {view.campaign.blockers.join(" · ")}
                </div>
              )}
              {view.campaign.lastStopReason && (
                <div className="mt-3 text-xs" style={{ color: view.campaign.status === "aborted" ? COLORS.red : COLORS.muted }}>
                  Last stop: {view.campaign.lastStopReason}
                </div>
              )}
              <div className="flex flex-wrap gap-2 mt-4">
                <button
                  type="button"
                  disabled={!view.campaign.canStart}
                  onClick={() => dispatch({
                    type: "AGENT_ECONOMY_START_CANARY_CAMPAIGN",
                    payload: { quarterLimit: 3 },
                  })}
                  className="px-4 py-2 rounded-md border text-xs uppercase tracking-wide disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ borderColor: COLORS.green, color: COLORS.green, backgroundColor: "rgba(125, 168, 106, 0.10)", fontFamily: "Cinzel, serif" }}
                >
                  Start 3-quarter trial
                </button>
                <button
                  type="button"
                  disabled={!view.campaign.running}
                  onClick={() => dispatch({
                    type: "AGENT_ECONOMY_STOP_CANARY_CAMPAIGN",
                    payload: { reason: "operator-stop" },
                  })}
                  className="px-4 py-2 rounded-md border text-xs uppercase tracking-wide disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ borderColor: COLORS.red, color: COLORS.red, backgroundColor: "rgba(201, 108, 98, 0.08)", fontFamily: "Cinzel, serif" }}
                >
                  Stop and roll back
                </button>
              </div>
            </div>
            <div className="rounded-md p-3" style={{ backgroundColor: COLORS.panelDeep }}>
              <div className="text-[10px] uppercase tracking-wider mb-2" style={{ color: COLORS.muted }}>Recent transactions</div>
              {view.transactions.length === 0 ? (
                <div className="text-xs" style={{ color: COLORS.muted }}>No Canary transactions recorded.</div>
              ) : view.transactions.map((transaction) => (
                <div key={transaction.id} className="py-2 border-t first:border-t-0 text-xs" style={{ borderColor: COLORS.border }}>
                  <div className="flex items-center justify-between gap-3">
                    <span style={{ color: COLORS.text }}>Turn {transaction.turn} · {transaction.season}</span>
                    <span style={{ color: transaction.status === "committed" ? COLORS.green : COLORS.red }}>{transaction.status}</span>
                  </div>
                  {transaction.issue && <div className="mt-1" style={{ color: COLORS.red }}>{transaction.issue}</div>}
                </div>
              ))}
            </div>
          </div>
        </Panel>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          icon={Briefcase}
          label="Employment"
          value={pct(view.householdStats.employmentRate)}
          detail={`${number(view.householdStats.assignedWorkers, 1)} assigned workers`}
          tone={view.householdStats.employmentRate >= 70 ? "green" : "amber"}
        />
        <MetricCard
          icon={Wallet}
          label="Poverty"
          value={pct(view.householdStats.povertyRate)}
          detail={`${pct(view.householdStats.severePovertyRate)} severe`}
          tone={view.householdStats.povertyRate >= 25 ? "red" : "green"}
        />
        <MetricCard
          icon={Wheat}
          label="Food stress"
          value={pct(view.householdStats.foodStressRate)}
          detail={`${number(view.quarter?.unmetFood ?? 0)} unmet this quarter`}
          tone={view.householdStats.foodStressRate > 10 ? "red" : "green"}
        />
        <MetricCard
          icon={Factory}
          label="Labor coverage"
          value={pct(view.production.laborCoverage)}
          detail={`${view.production.constrained} constrained buildings`}
          tone={view.production.laborCoverage >= 80 ? "green" : "amber"}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-4">
        <Panel
          title="Prices & supply pressure"
          icon={BarChart3}
          action={(
            <span className="text-xs tabular-nums" style={{ color: view.market.netPressure > 0 ? COLORS.red : COLORS.green }}>
              Net {view.market.netPressure > 0 ? "+" : ""}{number(view.market.netPressure)}
            </span>
          )}
        >
          {view.market.rows.length === 0 ? (
            <p className="text-sm" style={{ color: COLORS.muted }}>No market observations yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[610px]">
                <div className="grid grid-cols-[1.2fr_0.7fr_0.7fr_0.7fr_0.9fr] gap-3 px-2 pb-2 text-[10px] uppercase tracking-wider" style={{ color: COLORS.muted, fontFamily: "Cinzel, serif" }}>
                  <span>Commodity</span><span>Price</span><span>Demand</span><span>Supply</span><span>History</span>
                </div>
                {view.market.rows.map((row) => (
                  <div
                    key={row.commodity}
                    className="grid grid-cols-[1.2fr_0.7fr_0.7fr_0.7fr_0.9fr] gap-3 items-center px-2 py-2.5 border-t"
                    style={{ borderColor: "#30291f" }}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <TrendIcon trend={row.trend} />
                        <span className="text-sm truncate" style={{ color: COLORS.text }}>{row.label}</span>
                      </div>
                      <div className="text-[10px] ml-5" style={{ color: row.changePct > 0 ? COLORS.green : row.changePct < 0 ? COLORS.red : COLORS.muted }}>
                        {row.changePct > 0 ? "+" : ""}{row.changePct}%
                      </div>
                    </div>
                    <span className="text-sm tabular-nums" style={{ color: COLORS.gold }}>{number(row.lastPrice, 2)}d</span>
                    <span className="text-sm tabular-nums" style={{ color: COLORS.text }}>{number(row.demand)}</span>
                    <span className="text-sm tabular-nums" style={{ color: COLORS.text }}>{number(row.supply)}</span>
                    <Sparkline values={row.history} trend={row.trend} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </Panel>

        <div className="space-y-4">
          <Panel title="Household condition" icon={Users}>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1.5"><span style={{ color: COLORS.text }}>Average health</span><span style={{ color: COLORS.green }}>{pct(view.householdStats.averageHealth)}</span></div>
                <ProgressBar value={view.householdStats.averageHealth} tone={COLORS.green} />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1.5"><span style={{ color: COLORS.text }}>Average satisfaction</span><span style={{ color: COLORS.gold }}>{pct(view.householdStats.averageSatisfaction)}</span></div>
                <ProgressBar value={view.householdStats.averageSatisfaction} />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1.5"><span style={{ color: COLORS.text }}>Employment</span><span style={{ color: COLORS.blue }}>{pct(view.householdStats.employmentRate)}</span></div>
                <ProgressBar value={view.householdStats.employmentRate} tone={COLORS.blue} />
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="rounded-md p-3" style={{ backgroundColor: COLORS.panelDeep }}>
                  <div className="text-lg" style={{ color: COLORS.gold }}>{view.householdStats.households}</div>
                  <div className="text-[10px] uppercase" style={{ color: COLORS.muted }}>Households</div>
                </div>
                <div className="rounded-md p-3" style={{ backgroundColor: COLORS.panelDeep }}>
                  <div className="text-lg" style={{ color: COLORS.gold }}>{view.householdStats.population}</div>
                  <div className="text-[10px] uppercase" style={{ color: COLORS.muted }}>Represented people</div>
                </div>
              </div>
            </div>
          </Panel>

          <Panel title="Quarter pulse" icon={Gauge}>
            {view.quarter ? (
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  ["Produced", view.quarter.produced],
                  ["Consumed", view.quarter.consumed],
                  ["Trade volume", view.quarter.tradeVolume],
                  ["Failed orders", view.quarter.failedOrders],
                  ["Unmet food", view.quarter.unmetFood],
                  ["Idle building-days", view.quarter.idleBuildingDays],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-md p-2.5" style={{ backgroundColor: COLORS.panelDeep }}>
                    <div className="font-semibold tabular-nums" style={{ color: COLORS.gold }}>{number(value)}</div>
                    <div className="text-[10px] uppercase mt-0.5" style={{ color: COLORS.muted }}>{label}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm" style={{ color: COLORS.muted }}>Simulate a season to generate a quarter pulse.</p>
            )}
          </Panel>
        </div>
      </div>

      <Panel title="Production chain status" icon={Factory}>
        {view.production.rows.length === 0 ? (
          <p className="text-sm" style={{ color: COLORS.muted }}>No building production report yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {view.production.rows.map((row) => {
              const bad = row.priority >= 3;
              return (
                <div
                  key={row.instanceId}
                  className="rounded-md border p-3"
                  style={{ backgroundColor: COLORS.panelDeep, borderColor: bad ? "#70473e" : COLORS.border }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-sm truncate" style={{ color: COLORS.text }}>{row.name}</div>
                      <div className="text-[10px] uppercase mt-0.5" style={{ color: bad ? COLORS.red : COLORS.green }}>
                        {row.status.replaceAll("-", " ")}
                      </div>
                    </div>
                    <span className="text-xs tabular-nums" style={{ color: COLORS.gold }}>{pct(row.laborCoverage)}</span>
                  </div>
                  <div className="mt-3"><ProgressBar value={row.laborCoverage} tone={bad ? COLORS.red : COLORS.green} /></div>
                  <div className="grid grid-cols-2 gap-2 mt-3 text-xs" style={{ color: COLORS.muted }}>
                    <span>Workers {number(row.assignedWorkers)}/{number(row.requiredWorkers)}</span>
                    <span>Condition {pct(row.condition)}</span>
                  </div>
                  {row.shortages.length > 0 && (
                    <div className="mt-2 text-xs" style={{ color: COLORS.amber }}>
                      Needs {row.shortages.map((item) => `${item.label} ${number(item.amount)}`).join(" · ")}
                    </div>
                  )}
                  {row.produced.length > 0 && (
                    <div className="mt-2 text-xs" style={{ color: COLORS.muted }}>
                      Producing {row.produced.join(" · ")}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Panel
          title="Dual-engine safety"
          icon={comparison?.safe ? ShieldCheck : AlertTriangle}
          action={comparison && (
            <span className="text-xs uppercase" style={{ color: comparison.safe ? COLORS.green : COLORS.red }}>
              {comparison.safe ? "Passed" : "Attention"}
            </span>
          )}
        >
          {!comparison ? (
            <p className="text-sm" style={{ color: COLORS.muted }}>No comparison has been recorded yet.</p>
          ) : (
            <div>
              <div className="grid grid-cols-[1fr_auto_auto] gap-3 pb-2 text-[10px] uppercase tracking-wider" style={{ color: COLORS.muted, fontFamily: "Cinzel, serif" }}>
                <span>Quarter delta</span><span>Legacy</span><span>Households</span>
              </div>
              <ComparisonValue label="Money" legacy={number(comparison.legacyDeltas?.denarii)} agent={number(comparison.agentDeltas?.cash)} />
              <ComparisonValue label="Food" legacy={number(comparison.legacyDeltas?.food)} agent={number(comparison.agentDeltas?.food)} />
              <ComparisonValue label="Population" legacy={number(comparison.legacyDeltas?.population)} agent={number(comparison.agentDeltas?.population)} />
              <ComparisonValue label="Inventory" legacy={number(comparison.legacyDeltas?.inventory)} agent={number(comparison.agentDeltas?.inventory)} />

              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="rounded-md p-3" style={{ backgroundColor: COLORS.panelDeep }}>
                  <div className="text-sm tabular-nums" style={{ color: Math.abs(comparison.accounting?.cashAccountingError ?? 0) <= 0.05 ? COLORS.green : COLORS.red }}>
                    {number(comparison.accounting?.cashAccountingError, 2)}
                  </div>
                  <div className="text-[10px] uppercase mt-1" style={{ color: COLORS.muted }}>Cash error</div>
                </div>
                <div className="rounded-md p-3" style={{ backgroundColor: COLORS.panelDeep }}>
                  <div className="text-sm tabular-nums" style={{ color: Math.abs(comparison.accounting?.inventoryAccountingError ?? 0) <= 0.1 ? COLORS.green : COLORS.red }}>
                    {number(comparison.accounting?.inventoryAccountingError, 2)}
                  </div>
                  <div className="text-[10px] uppercase mt-1" style={{ color: COLORS.muted }}>Inventory error</div>
                </div>
              </div>

              {(comparison.criticalIssues.length > 0 || comparison.warnings.length > 0) && (
                <div className="mt-4 space-y-2">
                  {comparison.criticalIssues.map((issue) => (
                    <div key={issue} className="text-xs flex gap-2" style={{ color: COLORS.red }}><AlertTriangle size={13} className="shrink-0 mt-0.5" />{issue}</div>
                  ))}
                  {comparison.warnings.map((warning) => (
                    <div key={warning} className="text-xs flex gap-2" style={{ color: COLORS.amber }}><AlertTriangle size={13} className="shrink-0 mt-0.5" />{warning}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </Panel>

        <Panel title="Steward's economic notes" icon={Activity}>
          <div className="space-y-2.5">
            {view.narrative.map((line, index) => (
              <div key={`${index}-${line}`} className="flex gap-3 text-sm leading-relaxed">
                <span className="shrink-0" style={{ color: COLORS.gold }}>◇</span>
                <span style={{ color: COLORS.text }}>{line}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t" style={{ borderColor: COLORS.border }}>
            <div className="flex items-center justify-between gap-3 text-xs">
              <span style={{ color: COLORS.muted }}>Safe-quarter streak</span>
              <span style={{ color: COLORS.gold }}>{mode.safeStreak}/{mode.requiredSafeQuarters}</span>
            </div>
            <div className="mt-2"><ProgressBar value={(mode.safeStreak / Math.max(1, mode.requiredSafeQuarters)) * 100} tone={COLORS.green} /></div>
            {mode.rollbackCount > 0 && (
              <div className="mt-3 text-xs" style={{ color: COLORS.red }}>
                Rollbacks: {mode.rollbackCount}{mode.lastRollbackReason ? ` · ${mode.lastRollbackReason}` : ""}
              </div>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}
