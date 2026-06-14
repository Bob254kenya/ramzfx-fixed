// Export all pages for convenient imports
export { default as BotIdeas } from './bot-ideas';
export { default as BestBots } from './best-bots';
export { default as Dashboard } from './dashboard';
export { default as BotBuilder } from './bot-builder';
export { default as AutoTrades } from './auto-trades';
export { default as ManualTrading } from './manual-trading';
export { default as Scanner } from './scanner';
export { default as Chart } from './chart';
export { default as Analysistool } from './analysistool';
// FIX: Added missing ProScanner and SpeedBot exports.
// Their absence forced main.tsx to skip importing them, causing blank tab renders.
export { default as ProScanner } from './pro-scanner';
export { default as SpeedBot } from './speed-bot';
