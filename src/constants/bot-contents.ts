type TTabsTitle = {
    [key: string]: string | number;
};

type TDashboardTabIndex = {
    [key: string]: number;
};

export const tabs_title: TTabsTitle = Object.freeze({
    WORKSPACE: 'Workspace',
    CHART: 'Chart',
});

export const DBOT_TABS: TDashboardTabIndex = Object.freeze({
    BEST_BOTS: 0,
    DASHBOARD: 1,
    BOT_BUILDER: 2,
    AUTO_TRADES: 3,
    MANUAL_TRADING: 4,
    SCANNER: 5,
    ANALYSIS_TOOL: 6,
    SPEED_BOT: 7,
    PRO_SCANNER: 8,
});

export const MAX_STRATEGIES = 10;

// FIX: TAB_IDS indices now match DBOT_TABS values exactly.
// Previously TAB_IDS[7] was 'id-pro-scanner' and TAB_IDS[8] was 'id-speed-bot' — swapped.
export const TAB_IDS = [
    'id-best-bots',       // 0 = BEST_BOTS
    'id-dbot-dashboard',  // 1 = DASHBOARD
    'id-bot-builder',     // 2 = BOT_BUILDER
    'id-auto-trades',     // 3 = AUTO_TRADES
    'id-manual-trading',  // 4 = MANUAL_TRADING
    'id-scanner',         // 5 = SCANNER
    'id-analysistool',    // 6 = ANALYSIS_TOOL
    'id-speed-bot',       // 7 = SPEED_BOT  ✅ was 'id-pro-scanner'
    'id-pro-scanner',     // 8 = PRO_SCANNER ✅ was 'id-speed-bot'
];

export const DEBOUNCE_INTERVAL_TIME = 500;
