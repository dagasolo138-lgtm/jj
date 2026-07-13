/**
 * greatHall.js — Data constants for the Great Hall tab
 *
 * Phase 1: Ambient atmosphere, steward dialogue, queue placeholders.
 * Phase 2+: Dispute database, audience encounters, decrees, council topics.
 * Phase 4: Edmund dialogue matrix, trust/mood system, reputation tracks.
 */

// Atmospheric text that cycles in the hall footer (8-second rotation)
export const AMBIENT_TEXTS = [
  "Smoke from the hearth drifts toward the vaulted ceiling.",
  "A dog gnaws a bone beneath the long table.",
  "Servants whisper near the kitchen passage.",
  "Rain drums against the high windows.",
  "The herald clears his throat by the entrance.",
  "Dust motes dance in the pale light from the clerestory windows.",
  "The crackle of the fire fills the silence between petitions.",
  "A cold draft stirs the tapestries along the north wall.",
  "The smell of beeswax candles mixes with wood smoke.",
  "Someone coughs in the gallery above. The sound echoes.",
  "The steward's quill scratches against parchment.",
  "Footsteps echo on the flagstone floor as a guard changes post.",
];

// ─── Edmund Dialogue Matrix (Phase 4) ───────────────────────────

/**
 * Context-aware dialogue lines for Steward Edmund.
 * Each category is an array of { text, condition? } objects.
 * condition is an optional function (state, trust, mood) → boolean.
 * Lines without a condition are always eligible.
 */
export const EDMUND_DIALOGUE = {
  // Category 1: Throne greetings — shown when entering the Hall
  throne: [
    { text: "The hall awaits your command, my lord." },
    { text: "A quiet morning — which usually means trouble is on its way." },
    { text: "The people are watching, my lord. They always are." },
    { text: "I have prepared the day's ledger. Shall we begin?" },
    { text: "The fire is lit and the seats are filled. Your court awaits." },
    { text: "Your steward stands ready, my lord. What is your will?" },
    { text: "The coffers grow thin, my lord. We must tread carefully.", condition: (s) => s.greatHall.meters.treasury < 30 },
    { text: "The people speak well of you in the village. A rare thing for a lord.", condition: (s) => s.greatHall.meters.people >= 70 },
    { text: "The garrison stands strong. The men take comfort in that.", condition: (s) => s.greatHall.meters.military >= 70 },
    { text: "The church bells ring with unusual frequency. The clergy seem pleased.", condition: (s) => s.greatHall.meters.church >= 70 },
  ],

  // Category 2: Pre-dispute advice — shown when a dispute is available
  preDispute: [
    { text: "Consider both sides carefully, my lord. The truth often hides in the middle." },
    { text: "This one may test your patience. The petitioners are... passionate." },
    { text: "A word of caution — the last lord who ruled hastily found his hall empty by winter." },
    { text: "The people will remember this ruling long after you've forgotten it.", condition: (_s, trust) => trust >= 50 },
    { text: "I have my suspicions about this case, but I shall hold my tongue.", condition: (_s, trust) => trust < 40 },
    { text: "Between us, my lord — favor the common folk when you can. They are the backbone of the manor.", condition: (_s, trust) => trust >= 70 },
  ],

  // Category 3: Post-ruling reactions
  postRuling: [
    { text: "A bold ruling, my lord. Time will tell if it was wise." },
    { text: "The petitioners have departed. Whether satisfied or not, justice was served." },
    { text: "I would have ruled differently, but you are the lord, not I.", condition: (_s, trust) => trust < 40 },
    { text: "Well judged, my lord. I could not have counseled better myself.", condition: (_s, trust) => trust >= 60 },
    { text: "The people murmur outside. Your ruling has stirred the village.", condition: (s) => s.greatHall.meters.people < 40 },
  ],

  // Category 4: Audience commentary
  audience: [
    { text: "Another face in the queue. Each one carries a world of troubles." },
    { text: "Listen carefully — what they ask for and what they need are seldom the same." },
    { text: "You've heard many voices today. The hall grows weary.", condition: (s) => (s.greatHall.audienceResolved || []).length >= 3 },
    { text: "Some of these petitioners have waited weeks for this moment. Do them the courtesy of your attention." },
  ],

  // Category 5: Decree warnings
  decree: [
    { text: "A decree carries weight, my lord. Once sealed, it cannot be easily undone." },
    { text: "The last decree still echoes through the village. Be cautious with the next.", condition: (s) => (s.greatHall.activeDecrees || []).length >= 1 },
    { text: "Too many laws and the people will grumble. Too few and they will run wild.", condition: (_s, trust) => trust >= 50 },
    { text: "I advise restraint. The ink is permanent, even if your will is not.", condition: (_s, trust) => trust >= 70 },
  ],

  // Category 6: Council opinions
  council: [
    { text: "The advisors gather. Each will speak their truth — or what serves them best." },
    { text: "Listen to all, trust none completely. Even I have my biases, my lord." , condition: (_s, trust) => trust >= 60 },
    { text: "The council is only as wise as the lord who heeds it." },
    { text: "I wonder sometimes if the advisors advise for the manor's good or their own.", condition: (_s, trust) => trust >= 50 },
  ],

  // Category 7: Crisis alerts — triggered by low meters
  crisis: [
    { text: "My lord, the treasury is nearly bare. We cannot sustain this course.", condition: (s) => s.greatHall.meters.treasury < 20 },
    { text: "The people grow restless. I hear talk of families leaving the manor.", condition: (s) => s.greatHall.meters.people < 25 },
    { text: "The garrison is undermanned. If raiders come, we are vulnerable.", condition: (s) => s.greatHall.meters.military < 20 },
    { text: "The clergy have sent a stern letter. The church's patience wears thin.", condition: (s) => s.greatHall.meters.church < 20 },
    { text: "Everything is falling apart, my lord. We must act decisively — on all fronts.", condition: (s) => {
      const m = s.greatHall.meters;
      return m.treasury < 30 && m.people < 30;
    }},
  ],

  // Category 8: Idle observations — when nothing pressing is happening
  idle: [
    { text: "A peaceful day in the hall. Enjoy it — they are rare." },
    { text: "I've been reviewing the accounts. Nothing alarming, for once." },
    { text: "The servants have polished the throne again. As if that makes the rulings easier." },
    { text: "Do you ever wonder, my lord, what the common folk say about us behind closed doors?" },
    { text: "I found a mouse in the ledger room this morning. Even the vermin want to review the accounts." },
  ],

  // Category 9: Personal moments — trust-gated, reveals Edmund's character
  personal: [
    { text: "I served your father before you, my lord. You have his eyes, if not yet his certainty.", condition: (_s, trust) => trust >= 40 },
    { text: "If I may speak freely... you are becoming the lord this manor needs.", condition: (_s, trust) => trust >= 70 },
    { text: "I was not always a steward, you know. Once I was a clerk in the abbey, copying manuscripts by candlelight.", condition: (_s, trust) => trust >= 60 },
    { text: "Trust is earned slowly and lost in an instant. I say this from experience, my lord.", condition: (_s, trust) => trust >= 30 && trust < 50 },
    { text: "You remind me why I stayed in service. Not every lord deserves loyalty, but some earn it.", condition: (_s, trust) => trust >= 80 },
    { text: "I will do my duty regardless, my lord. But it is easier to serve one I believe in.", condition: (_s, trust) => trust < 30 },
  ],

  // Category 10: Season transitions
  season: [
    { text: "Spring has come. The fields will need tending, and the people will need hope.", condition: (s) => s.season === "spring" },
    { text: "Summer burns bright. A good season for building — and for ambition.", condition: (s) => s.season === "summer" },
    { text: "Autumn arrives with its harvest. The tax collectors sharpen their quills.", condition: (s) => s.season === "autumn" },
    { text: "Winter settles over the manor. We must endure — and hope the stores hold.", condition: (s) => s.season === "winter" },
    { text: "The first frost came early this year. I pray it does not take the last of the crops.", condition: (s) => s.season === "winter" && s.greatHall.meters.treasury < 40 },
    { text: "The harvest looks promising. Perhaps this winter will not be so cruel.", condition: (s) => s.season === "autumn" && s.greatHall.meters.treasury >= 50 },
  ],
};

// ─── Trust Tiers ─────────────────────────────────────────────────

export const TRUST_TIERS = [
  { min: 0,  max: 30,  label: "Wary",      color: "#c44444", desc: "Edmund doubts your judgment" },
  { min: 31, max: 50,  label: "Cautious",   color: "#cc8844", desc: "Edmund is reserved but loyal" },
  { min: 51, max: 70,  label: "Respectful", color: "#c4a24a", desc: "Edmund trusts your instincts" },
  { min: 71, max: 85,  label: "Devoted",    color: "#88aa44", desc: "Edmund speaks freely and truly" },
  { min: 86, max: 100, label: "Bonded",     color: "#44aa66", desc: "Edmund would lay down his life" },
];

export function getTrustTier(trust) {
  return TRUST_TIERS.find((t) => trust >= t.min && trust <= t.max) || TRUST_TIERS[0];
}

// ─── Edmund Mood (tied to treasury) ──────────────────────────────

export const EDMUND_MOODS = {
  worried:   { label: "Worried",   color: "#c44444", icon: "troubled",  threshold: 20 },
  concerned: { label: "Concerned", color: "#cc8844", icon: "uneasy",    threshold: 40 },
  steady:    { label: "Steady",    color: "#b8a880", icon: "dutiful",   threshold: 60 },
  pleased:   { label: "Pleased",   color: "#88aa44", icon: "content",   threshold: 80 },
  proud:     { label: "Proud",     color: "#44aa66", icon: "proud",     threshold: 101 },
};

export function getEdmundMood(treasury) {
  if (treasury < 20) return EDMUND_MOODS.worried;
  if (treasury < 40) return EDMUND_MOODS.concerned;
  if (treasury < 60) return EDMUND_MOODS.steady;
  if (treasury < 80) return EDMUND_MOODS.pleased;
  return EDMUND_MOODS.proud;
}

// ─── Reputation Tracks ───────────────────────────────────────────

/**
 * Reputation is determined by analyzing cumulative ruling patterns.
 * Each ruling's consequences are tallied into track scores.
 * The dominant track determines the lord's title.
 */
export const REPUTATION_TRACKS = {
  merciful: {
    label: "Merciful",
    titles: [
      { threshold: 3,  title: "Gentle Hand" },
      { threshold: 8,  title: "The Merciful" },
      { threshold: 15, title: "Beloved of the People" },
    ],
  },
  stern: {
    label: "Stern",
    titles: [
      { threshold: 3,  title: "Iron Fist" },
      { threshold: 8,  title: "The Unyielding" },
      { threshold: 15, title: "Dread Lord" },
    ],
  },
  wealthy: {
    label: "Wealthy",
    titles: [
      { threshold: 3,  title: "The Prosperous" },
      { threshold: 8,  title: "Golden Lord" },
      { threshold: 15, title: "Midas of the Manor" },
    ],
  },
  pious: {
    label: "Pious",
    titles: [
      { threshold: 3,  title: "The Devout" },
      { threshold: 8,  title: "Blessed Ruler" },
      { threshold: 15, title: "Defender of the Faith" },
    ],
  },
  militant: {
    label: "Militant",
    titles: [
      { threshold: 3,  title: "Warlord" },
      { threshold: 8,  title: "Shield of the Realm" },
      { threshold: 15, title: "Conqueror" },
    ],
  },
  balanced: {
    label: "Balanced",
    titles: [
      { threshold: 3,  title: "The Just" },
      { threshold: 8,  title: "Fair Arbiter" },
      { threshold: 15, title: "Solomon of the Shire" },
    ],
  },
};

/**
 * Analyze ruling history to determine dominant track and title.
 * Returns { track, title, scores } where track is the key in REPUTATION_TRACKS.
 */
export function computeReputation(rulingHistory) {
  if (!rulingHistory || rulingHistory.length === 0) {
    return { track: null, title: "Unknown Lord", scores: {} };
  }

  // Tally scores from consequences
  const scores = { merciful: 0, stern: 0, wealthy: 0, pious: 0, militant: 0, balanced: 0 };

  for (const ruling of rulingHistory) {
    const c = ruling.consequences || {};
    const peopleDelta = c.people || 0;
    const treasuryDelta = c.treasury || 0;
    const churchDelta = c.church || 0;
    const militaryDelta = c.military || 0;

    // Merciful: positive people effects
    if (peopleDelta > 0) scores.merciful += peopleDelta;
    // Stern: negative people effects (choosing order over comfort)
    if (peopleDelta < 0) scores.stern += Math.abs(peopleDelta);
    // Wealthy: positive treasury effects
    if (treasuryDelta > 0) scores.wealthy += treasuryDelta;
    // Pious: positive church effects
    if (churchDelta > 0) scores.pious += churchDelta;
    // Militant: positive military effects
    if (militaryDelta > 0) scores.militant += militaryDelta;

    // Balanced: when effects are spread (no single dominant delta)
    const deltas = [peopleDelta, treasuryDelta, churchDelta, militaryDelta].filter((d) => d !== 0);
    if (deltas.length >= 2) {
      const positives = deltas.filter((d) => d > 0).length;
      const negatives = deltas.filter((d) => d < 0).length;
      if (positives >= 1 && negatives >= 1) scores.balanced += 2;
    }
  }

  // Find dominant track
  let dominantTrack = "balanced";
  let maxScore = scores.balanced;
  for (const [track, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      dominantTrack = track;
    }
  }

  // Get title from dominant track based on thresholds
  const trackConfig = REPUTATION_TRACKS[dominantTrack];
  let title = "Fledgling Judge";
  for (const t of trackConfig.titles) {
    if (maxScore >= t.threshold) title = t.title;
  }

  return { track: dominantTrack, title, scores };
}

// ─── Context-Aware Edmund Line Selection ─────────────────────────

/**
 * Select the best Edmund line given current game state.
 * Priority: crisis > season > view-specific > personal > idle
 * Returns a string.
 */
export function selectEdmundLine(state, currentView, trust) {
  const eligible = [];

  // Helper to filter eligible lines from a category
  const collect = (category, priority) => {
    const lines = EDMUND_DIALOGUE[category] || [];
    for (const line of lines) {
      if (!line.condition || line.condition(state, trust)) {
        eligible.push({ text: line.text, priority });
      }
    }
  };

  // Crisis lines get highest priority
  collect("crisis", 100);

  // Season-specific lines
  collect("season", 80);

  // View-specific lines
  const viewMap = {
    throne: "throne",
    dispute: "preDispute",
    audience: "audience",
    decrees: "decree",
    council: "council",
  };
  if (viewMap[currentView]) {
    collect(viewMap[currentView], 60);
  }

  // Personal moments (trust-gated)
  collect("personal", 40);

  // Idle observations as fallback
  collect("idle", 20);

  if (eligible.length === 0) {
    return "The hall awaits your command, my lord.";
  }

  // Weight selection toward higher priority lines
  // Crisis/season lines appear if eligible; otherwise pick from pool
  const maxPriority = Math.max(...eligible.map((e) => e.priority));
  const topTier = eligible.filter((e) => e.priority >= maxPriority - 20);

  // Pick randomly from top tier
  return topTier[Math.floor(Math.random() * topTier.length)].text;
}

// ─── Phase 5: Crisis & Peak Events ───────────────────────────────

/**
 * Crisis events trigger when a meter drops below 20.
 * Peak events trigger when a meter rises above 80.
 * Each has text (narrative), effects (optional meter adjustments), and a chronicle entry.
 */
export const CRISIS_EVENTS = {
  people: {
    text: "A group of peasants refuses to work the fields. They gather at the village green, angry and defiant.",
    chronicle: "Peasant unrest erupts — workers refuse to till the fields.",
    effects: { people: -5, treasury: -3, church: 0, military: 0 },
  },
  treasury: {
    text: "Your coffers are empty. Edmund reports that you cannot pay the soldiers this month.",
    chronicle: "The treasury is bare — soldiers go unpaid.",
    effects: { people: 0, treasury: -3, church: 0, military: -5 },
  },
  church: {
    text: "Father Aldous announces he is suspending services at the chapel. The bishop has sent a stern letter.",
    chronicle: "The church suspends services — the bishop threatens action.",
    effects: { people: -3, treasury: 0, church: -5, military: 0 },
  },
  military: {
    text: "Bandits raid a farmstead on the eastern border. There are no soldiers to stop them.",
    chronicle: "Bandits raid unchecked — the garrison is too weak to respond.",
    effects: { people: -5, treasury: -5, church: 0, military: -3 },
  },
};

export const PEAK_EVENTS = {
  people: {
    text: "The village holds a spontaneous celebration in your honor. They've carved your likeness into the Witness Tree.",
    chronicle: "The people celebrate their lord — a likeness carved into the Witness Tree.",
    effects: { people: 3, treasury: 0, church: 2, military: 0 },
  },
  treasury: {
    text: "Merchants from three counties seek your patronage. Your wealth is the talk of the region.",
    chronicle: "Wealthy merchants flock to the manor — trade flourishes.",
    effects: { people: 0, treasury: 3, church: 0, military: 2 },
  },
  church: {
    text: "The bishop himself visits your manor, praising your devotion. He offers to fund a monastery on your lands.",
    chronicle: "The bishop visits, praising the lord's devotion.",
    effects: { people: 2, treasury: 3, church: 3, military: 0 },
  },
  military: {
    text: "Your soldiers are the envy of neighboring lords. Sergeant Wulf receives a commendation from the king's marshal.",
    chronicle: "The garrison earns a royal commendation for excellence.",
    effects: { people: 2, treasury: 0, church: 0, military: 3 },
  },
};

// ─── Phase 5: Compound Consequences ─────────────────────────────

/**
 * Compound consequences check rulingHistory for specific past rulings
 * and modify the current game state accordingly.
 * Each rule: { check: (rulingHistory) → boolean, flag: string, label: string }
 */
export const COMPOUND_RULES = [
  {
    flag: "harshOnPoacher",
    label: "Peasants are more fearful after the poacher's harsh sentence.",
    check: (history) => history.some(
      (r) => r.disputeId === "giles_poacher" && (r.consequences?.people ?? 0) < 0
    ),
  },
  {
    flag: "fundedEdwin",
    label: "Edwin the Tinker's contraption may yet prove useful.",
    check: (history) => history.some(
      (r) => r.disputeId === "edwin_tinker" && (r.consequences?.treasury ?? 0) < 0
    ),
  },
  {
    flag: "welcomedHenrik",
    label: "Trade has increased since welcoming Henrik the Trader.",
    check: (history) => history.some(
      (r) => r.disputeId === "henrik_trader" && (r.consequences?.treasury ?? 0) > 0
    ),
  },
  {
    flag: "grantedScriptorium",
    label: "The scriptorium attracts learned visitors to the manor.",
    check: (history) => history.some(
      (r) => r.disputeId === "brother_marcus" && (r.consequences?.church ?? 0) > 0
    ),
  },
  {
    flag: "mercifulToThieves",
    label: "Your mercy toward the accused has emboldened some — but won hearts.",
    check: (history) => {
      const mercifulRulings = history.filter((r) => (r.consequences?.people ?? 0) > 3);
      return mercifulRulings.length >= 3;
    },
  },
  {
    flag: "ironRule",
    label: "Your stern rulings have brought order, but the people whisper.",
    check: (history) => {
      const sternRulings = history.filter((r) => (r.consequences?.people ?? 0) < -3);
      return sternRulings.length >= 3;
    },
  },
];

/**
 * Scan rulingHistory and return active compound flags.
 * Returns { [flag]: true } for each active compound consequence.
 */
export function computeCompoundFlags(rulingHistory) {
  if (!rulingHistory || rulingHistory.length === 0) return {};
  const flags = {};
  for (const rule of COMPOUND_RULES) {
    if (rule.check(rulingHistory)) {
      flags[rule.flag] = true;
    }
  }
  return flags;
}

// ─── Phase 5: Pitch Export ───────────────────────────────────────

/**
 * Package Great Hall data for the Kingdom Investor Pitch (PBL assessment).
 * Returns a structured summary suitable for student presentations.
 */
export function exportPitchData(state) {
  const hall = state.greatHall || {};
  const history = hall.rulingHistory || [];
  const repResult = computeReputation(history);

  // Ruling distribution
  let mercifulCount = 0;
  let sternCount = 0;
  let balancedCount = 0;
  for (const r of history) {
    const c = r.consequences || {};
    const peopleDelta = c.people || 0;
    if (peopleDelta > 0) mercifulCount++;
    else if (peopleDelta < 0) sternCount++;
    else balancedCount++;
  }

  return {
    // Summary stats
    totalDisputesResolved: hall.disputesResolved || 0,
    totalAudienceHeld: (hall.audienceResolved || []).length,
    totalDecreesIssued: (hall.activeDecrees || []).length,
    totalFeastsHosted: (hall.feastHistory || []).length,
    totalCouncilSessions: (hall.councilResolved || []).length,

    // Ruling patterns
    rulingDistribution: {
      merciful: mercifulCount,
      stern: sternCount,
      balanced: balancedCount,
    },

    // Reputation
    reputation: repResult.title,
    reputationTrack: repResult.track,
    reputationScores: repResult.scores,

    // Trust
    stewardTrust: hall.stewardTrust || 50,

    // Meter trends (for Recharts visualization)
    meterHistory: hall.meterHistory || [],

    // Final meter state
    finalMeters: hall.meters || DEFAULT_METERS,

    // Hall log (notable moments)
    hallLog: hall.hallLog || [],

    // Compound consequences achieved
    compoundFlags: computeCompoundFlags(history),
  };
}

// ─── Legacy Exports (kept for backward compat) ──────────────────

// Old random greetings — still used as fallback
export const EDMUND_GREETINGS = [
  "The hall awaits your command, my lord.",
  "A quiet morning — which usually means trouble is on its way.",
  "Three petitions await your judgment today.",
  "The people are watching, my lord. They always are.",
  "I have prepared the day's ledger. Shall we begin?",
  "Another season turns. The hall stands ready.",
  "The fire is lit and the seats are filled. Your court awaits.",
  "Your steward stands ready, my lord. What is your will?",
];

// Placeholder queue items for the throne room (replaced by real disputes in Phase 2)
export const QUEUE_ITEMS = [
  { title: "A dispute over trampled crops", category: "property", urgency: "pending" },
  { title: "A widow requests an audience", category: "audience", urgency: "waiting" },
  { title: "The blacksmith complains of an apprentice", category: "trade", urgency: "waiting" },
];

// Meter configuration for the four Great Hall approval gauges
export const METER_CONFIG = [
  { key: "people", label: "People", color: "#2d5a2d" },
  { key: "treasury", label: "Treasury", color: "#c4a24a" },
  { key: "church", label: "Church", color: "#6a4a8a" },
  { key: "military", label: "Military", color: "#8b2020" },
];

// Default meter values (used when greatHall state hasn't been initialized)
export const DEFAULT_METERS = { people: 50, treasury: 50, church: 50, military: 50 };
