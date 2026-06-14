/**
 * ProScannerBot — adapted for ramzfx2.site
 *
 * Original: millifx ProScannerBot.tsx
 * Adapted:  all millifx-specific imports replaced with ramzfx2 equivalents.
 *
 * DROP THIS FILE INTO:
 *   src/pages/scanner/ProScannerBot.tsx
 *
 * See CHANGES NEEDED section at the bottom of this file.
 */

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
// ── ramzfx2 replacements for millifx imports ──────────────────────────────────
import { api_base } from '@/external/bot-skeleton';                    // replaces derivApi
import { buyContractForUi, streamContractUntilSettled } from '@/utils/trade-purchase'; // replaces derivApi.buyContract / waitForContractResult
import { getLastDigitFromQuote } from '@/utils/market-data';          // replaces getLastDigit from @/services/analysis
import { useStore } from '@/hooks/useStore';                           // replaces useAuth
// lucide-react is shared between both projects — keep as-is
import {
  Play, StopCircle, Trash2, Scan,
  Home, RefreshCw, Shield, Zap, Eye, Anchor, Download, Upload, X, Users,
  MessageCircle, MessageSquare, Youtube, Instagram, Music, BarChart3,
  Volume2, VolumeX, GripVertical, Combine
} from 'lucide-react';
// ramzfx2 UI components (shared_ui replaces @/components/ui/*)
import Input from '@/components/shared_ui/input';
// Note: Badge, Button, Switch, Select, Textarea — see CHANGES NEEDED below
// ─────────────────────────────────────────────────────────────────────────────

// ── All logic below this line is unchanged from the original ProScannerBot ──
// (animation styles, popup components, market constants, bot engine, JSX)
// Only the shim layer at the top and the adapted hooks inside the component differ.

// ============================================================
// Animation Styles (unchanged)
// ============================================================
const notificationStyles = `
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideInDown {
  from { opacity: 0; transform: translateY(-30px) scale(0.95); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes slideOutUp {
  from { opacity: 1; transform: translateY(0) scale(1); }
  to   { opacity: 0; transform: translateY(-30px) scale(0.95); }
}
@keyframes slideUpCenter {
  from { opacity: 0; transform: translateY(40px) scale(0.9); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes slideDownCenter {
  from { opacity: 1; transform: translateY(0) scale(1); }
  to   { opacity: 0; transform: translateY(40px) scale(0.9); }
}
@keyframes gradientShift {
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
@keyframes float {
  0%   { transform: translateY(0px) rotate(0deg); }
  50%  { transform: translateY(-8px) rotate(2deg); }
  100% { transform: translateY(0px) rotate(0deg); }
}
@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(-4px); }
}
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50%       { transform: scale(1.05); }
}
@keyframes shimmer {
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
@keyframes glowPulse {
  0%, 100% { box-shadow: 0 0 5px rgba(59,130,246,0.3); }
  50%       { box-shadow: 0 0 20px rgba(59,130,246,0.6); }
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
.animate-fadeIn          { animation: fadeIn 0.3s ease-out forwards; }
.animate-slide-in-down   { animation: slideInDown 0.4s cubic-bezier(0.34,1.2,0.64,1) forwards; }
.animate-slide-out-up    { animation: slideOutUp 0.3s ease-out forwards; }
.animate-slide-up-center { animation: slideUpCenter 0.4s cubic-bezier(0.34,1.2,0.64,1) forwards; }
.animate-slide-down-center { animation: slideDownCenter 0.3s ease-out forwards; }
.animate-gradient        { background-size: 200% 200%; animation: gradientShift 3s ease infinite; }
.animate-float           { animation: float 3s ease-in-out infinite; }
.animate-bounce          { animation: bounce 0.4s ease-in-out 2; }
.animate-pulse-slow      { animation: pulse 1s ease-in-out infinite; }
.animate-shimmer         { animation: shimmer 2s infinite; }
.animate-glow-pulse      { animation: glowPulse 1.5s ease-in-out infinite; }
.animate-spin-slow       { animation: spin 1s linear infinite; }
`;

// ── TP/SL notification helper (unchanged) ────────────────────────────────────
export const showTPNotification = (type: 'tp' | 'sl', message: string, amount?: number) => {
  if (typeof window !== 'undefined' && (window as any).showTPNotification) {
    (window as any).showTPNotification(type, message, amount);
  }
};

// ── Social Notification Popup (unchanged) ────────────────────────────────────
const SocialNotificationPopup = ({ onClose }: { onClose: () => void }) => {
  const [isExiting, setIsExiting] = useState(false);
  const handleClose = () => { setIsExiting(true); setTimeout(onClose, 300); };
  const socialLinks = [
    { name: 'WhatsApp',         url: 'https://wa.me/254702490526',                                     icon: <MessageCircle className='w-4 h-4' />, color: 'hover:text-[#25D366]',   bgGradient: 'from-green-500/20 to-green-600/20' },
    { name: 'Telegram Group',   url: 'https://t.me/ramzfx',                                            icon: <MessageSquare className='w-4 h-4' />, color: 'hover:text-[#26A5E4]',   bgGradient: 'from-blue-500/20 to-blue-600/20' },
    { name: 'YouTube',          url: 'https://youtube.com/@ramzfx',                                    icon: <Youtube className='w-4 h-4' />,       color: 'hover:text-[#FF0000]',   bgGradient: 'from-red-500/20 to-red-600/20' },
    { name: 'Instagram',        url: 'https://instagram.com/ramzfx',                                   icon: <Instagram className='w-4 h-4' />,     color: 'hover:text-[#E4405F]',   bgGradient: 'from-pink-500/20 to-pink-600/20' },
  ];
  return (
    <div className='fixed inset-0 z-50 flex items-start justify-center pointer-events-none' style={{ paddingTop: '100px' }}>
      <div className={`pointer-events-auto w-[380px] max-w-[90vw] rounded-2xl shadow-2xl overflow-hidden relative ${isExiting ? 'animate-slide-out-up' : 'animate-slide-in-down'}`}>
        <div className='absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 animate-gradient' />
        <div className='absolute inset-0 bg-black/20 backdrop-blur-[1px]' />
        <div className='relative z-10 p-4'>
          <button onClick={handleClose} className='absolute top-2 right-2 p-1 rounded-lg bg-white/20 hover:bg-white/30 text-white'>
            <X className='w-3.5 h-3.5' />
          </button>
          <div className='flex items-center gap-3 mb-3'>
            <div className='w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center'>
              <Users className='w-5 h-5 text-white' />
            </div>
            <div>
              <h2 className='text-lg font-bold text-white'>Join Our Trading Community</h2>
              <p className='text-[10px] text-white/80'>Connect & Grow Together</p>
            </div>
          </div>
          <div className='grid grid-cols-2 gap-2 mb-3'>
            {socialLinks.map(s => (
              <a key={s.name} href={s.url} target='_blank' rel='noopener noreferrer' onClick={handleClose}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white/15 border border-white/30 text-white hover:scale-105 hover:bg-white/25 transition-all ${s.color}`}>
                <div className={`p-1 rounded-lg bg-gradient-to-r ${s.bgGradient}`}>{s.icon}</div>
                <span className='text-[9px] font-medium truncate'>{s.name}</span>
              </a>
            ))}
          </div>
          <div className='flex gap-2'>
            <button onClick={handleClose} className='flex-1 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-[11px] font-semibold border border-white/30'>NO THANKS</button>
            <button onClick={handleClose} className='flex-1 py-1.5 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-[11px] font-semibold'>MAYBE LATER</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── TP/SL Popup (unchanged) ───────────────────────────────────────────────────
const TPSLNotificationPopup = () => {
  const [notification, setNotification] = useState<{ type: 'tp' | 'sl'; message: string; amount?: number } | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  useEffect(() => {
    (window as any).showTPNotification = (type: 'tp' | 'sl', message: string, amount?: number) => {
      setNotification({ type, message, amount });
      setIsVisible(true);
      setIsExiting(false);
      setTimeout(() => handleClose(), 8000);
    };
    return () => { delete (window as any).showTPNotification; };
  }, []);
  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => { setIsVisible(false); setNotification(null); setIsExiting(false); }, 300);
  };
  if (!isVisible || !notification) return null;
  const isTP = notification.type === 'tp';
  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center pointer-events-none'>
      <div className={`pointer-events-auto w-[350px] h-[350px] rounded-xl shadow-2xl overflow-hidden ${isExiting ? 'animate-slide-down-center' : 'animate-slide-up-center'}`}>
        <div className={`relative w-full h-full flex flex-col p-3 ${isTP ? 'bg-gradient-to-br from-emerald-500 to-emerald-700' : 'bg-gradient-to-br from-rose-500 to-rose-700'}`}>
          <h3 className='text-sm font-bold text-white'>{isTP ? '🎉 TAKE PROFIT!' : '😢 STOP LOSS!'}</h3>
          <div className='flex-1 flex flex-col items-center justify-center text-center'>
            <p className='text-white text-xs'>{notification.message}</p>
            {notification.amount && (
              <p className={`text-xl font-bold mt-1 ${isTP ? 'text-emerald-200' : 'text-rose-200'}`}>
                {isTP ? '+' : '-'}${Math.abs(notification.amount).toFixed(2)}
              </p>
            )}
          </div>
          <button onClick={handleClose} className={`w-full py-1.5 rounded-lg font-semibold text-xs ${isTP ? 'bg-white/95 text-emerald-600' : 'bg-white/95 text-rose-600'}`}>OK</button>
        </div>
      </div>
    </div>
  );
};

// ── Markets ────────────────────────────────────────────────────────────────────
const SCANNER_MARKETS: { symbol: string; name: string }[] = [
  { symbol: 'R_10',    name: 'Vol 10'  }, { symbol: 'R_25',    name: 'Vol 25'  },
  { symbol: 'R_50',    name: 'Vol 50'  }, { symbol: 'R_75',    name: 'Vol 75'  },
  { symbol: 'R_100',   name: 'Vol 100' }, { symbol: '1HZ10V',  name: 'V10 1s'  },
  { symbol: '1HZ15V',  name: 'V15 1s'  }, { symbol: '1HZ25V',  name: 'V25 1s'  },
  { symbol: '1HZ30V',  name: 'V30 1s'  }, { symbol: '1HZ50V',  name: 'V50 1s'  },
  { symbol: '1HZ75V',  name: 'V75 1s'  }, { symbol: '1HZ90V',  name: 'V90 1s'  },
  { symbol: '1HZ100V', name: 'V100 1s' }, { symbol: 'JD10',    name: 'Jump 10' },
  { symbol: 'JD25',    name: 'Jump 25' }, { symbol: 'RDBEAR',  name: 'Bear'    },
  { symbol: 'RDBULL',  name: 'Bull'    },
];

const CONTRACT_TYPES = ['DIGITEVEN','DIGITODD','DIGITMATCH','DIGITDIFF','DIGITOVER','DIGITUNDER'] as const;
const needsBarrier = (ct: string) => ['DIGITMATCH','DIGITDIFF','DIGITOVER','DIGITUNDER'].includes(ct);

// ── Types ─────────────────────────────────────────────────────────────────────
type BotStatus = 'idle' | 'trading_m1' | 'recovery' | 'waiting_pattern' | 'pattern_matched' | 'virtual_hook' | 'reconnecting';

interface LogEntry {
  id: number; time: string; market: 'M1'|'M2'|'VH'|'SYSTEM'|'COMBINED';
  symbol: string; contract: string; stake: number; martingaleStep: number;
  exitDigit: string; result: 'Win'|'Loss'|'Pending'|'V-Win'|'V-Loss'|'Failed';
  pnl: number; balance: number; switchInfo: string;
}

interface BotState {
  cStake: number; mStep: number; inRecovery: boolean; currentPnl: number;
  currentBalance: number; currentMarket: 1|2; vhFakeWins: number;
  vhFakeLosses: number; vhConsecLosses: number;
  vhStatus: 'idle'|'waiting'|'confirmed'|'failed';
  patternTradeTaken: boolean; combinedTradeTaken: boolean;
}

// ── Circular tick buffer (unchanged) ─────────────────────────────────────────
class CircularTickBuffer {
  private buffer: { digit: number; ts: number }[];
  private head = 0; private count = 0;
  constructor(private capacity = 1000) { this.buffer = new Array(capacity); }
  push(digit: number) {
    this.buffer[this.head] = { digit, ts: performance.now() };
    this.head = (this.head + 1) % this.capacity;
    if (this.count < this.capacity) this.count++;
  }
  last(n: number): number[] {
    const result: number[] = [];
    const start = (this.head - Math.min(n, this.count) + this.capacity) % this.capacity;
    for (let i = 0; i < Math.min(n, this.count); i++)
      result.push(this.buffer[(start + i) % this.capacity].digit);
    return result;
  }
  get size() { return this.count; }
}

// ── Helper: wait for next tick via ramzfx2 api_base ──────────────────────────
function waitForNextTick(symbol: string): Promise<{ quote: number }> {
  return new Promise(resolve => {
    const timeout = setTimeout(() => { unsub.unsubscribe?.(); resolve({ quote: 0 }); }, 5000);
    const unsub = (api_base.api as any).onMessage().subscribe((raw: any) => {
      const data = raw?.data ?? raw;
      if (data?.tick?.symbol === symbol) {
        clearTimeout(timeout);
        unsub.unsubscribe?.();
        resolve({ quote: data.tick.quote });
      }
    });
  });
}

// ── Helper: virtual contract simulation via ramzfx2 api_base ─────────────────
function simulateVirtualContract(
  contractType: string, barrier: string, symbol: string
): Promise<{ won: boolean; digit: number }> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => { unsub.unsubscribe?.(); reject(new Error('timeout')); }, 5000);
    const unsub = (api_base.api as any).onMessage().subscribe((raw: any) => {
      const data = raw?.data ?? raw;
      if (data?.tick?.symbol === symbol) {
        clearTimeout(timeout);
        unsub.unsubscribe?.();
        const digit = getLastDigitFromQuote(data.tick.quote, symbol);
        const b = parseInt(barrier) || 0;
        let won = false;
        switch (contractType) {
          case 'DIGITEVEN': won = digit % 2 === 0; break;
          case 'DIGITODD':  won = digit % 2 !== 0; break;
          case 'DIGITMATCH': won = digit === b; break;
          case 'DIGITDIFF':  won = digit !== b; break;
          case 'DIGITOVER':  won = digit > b; break;
          case 'DIGITUNDER': won = digit < b; break;
        }
        resolve({ won, digit });
      }
    });
  });
}

// ── Pattern helpers (unchanged logic) ────────────────────────────────────────
function checkCombinedPattern(digits: number[], patternStr: string): boolean {
  if (!patternStr?.trim()) return false;
  const patterns = patternStr.split(',').map(p => p.trim().toUpperCase()).filter(Boolean);
  for (const pattern of patterns) {
    if (digits.length < pattern.length) continue;
    const recent = digits.slice(-pattern.length);
    const matched = recent.every((digit, i) => {
      const ch = pattern[i];
      if (ch === 'U') return digit < 5;
      if (ch === 'O') return digit > 4;
      if (ch === 'E') return digit % 2 === 0;
      if (ch >= '0' && ch <= '9') return digit === parseInt(ch);
      return false;
    });
    if (matched) return true;
  }
  return false;
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════════════
export default function ProScannerBot() {
  // ── ramzfx2 store (replaces useAuth + useLossRequirement) ─────────────────
  const { client } = useStore();
  const isAuthorized  = client.is_logged_in;
  const localBalanceFromStore = parseFloat(client.balance ?? '0');
  const currency = client.currency ?? 'USD';

  // ── Local balance mirror ───────────────────────────────────────────────────
  const [localBalance, setLocalBalance] = useState(localBalanceFromStore);
  useEffect(() => { setLocalBalance(localBalanceFromStore); }, [localBalanceFromStore]);

  // ── Popup visibility ───────────────────────────────────────────────────────
  const [showSocialPopup, setShowSocialPopup] = useState(true);
  const [showTradingChart, setShowTradingChart] = useState(false);

  // ── Bot state ──────────────────────────────────────────────────────────────
  const runningRef = useRef(false);
  const shouldStopRef = useRef(false);
  const savedBotStateRef = useRef<BotState | null>(null);
  const patternTradeTakenRef = useRef(false);
  const combinedTradeTakenRef = useRef(false);
  const logIdRef = useRef(0);

  const [isRunning, setIsRunning] = useState(false);
  const [botStatus, setBotStatus] = useState<BotStatus>('idle');
  const [currentMarket, setCurrentMarket] = useState<1|2>(1);
  const [currentStake, setCurrentStakeState] = useState(0);
  const [martingaleStep, setMartingaleStepState] = useState(0);
  const [netProfit, setNetProfit] = useState(0);
  const [wins, setWins] = useState(0);
  const [losses, setLosses] = useState(0);
  const [totalStaked, setTotalStaked] = useState(0);
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);

  // ── M1 config ─────────────────────────────────────────────────────────────
  const [m1Enabled, setM1Enabled] = useState(true);
  const [m1Contract, setM1Contract] = useState('DIGITEVEN');
  const [m1Barrier, setM1Barrier] = useState('5');
  const [m1Symbol, setM1Symbol] = useState('R_100');
  const [m1HookEnabled, setM1HookEnabled] = useState(false);
  const [m1VirtualLossCount, setM1VirtualLossCount] = useState('3');
  const [m1RealCount, setM1RealCount] = useState('2');
  const [m1CombinedEnabled, setM1CombinedEnabled] = useState(false);
  const [m1CombinedPatterns, setM1CombinedPatterns] = useState('');

  // ── M2 config ─────────────────────────────────────────────────────────────
  const [m2Enabled, setM2Enabled] = useState(true);
  const [m2Contract, setM2Contract] = useState('DIGITODD');
  const [m2Barrier, setM2Barrier] = useState('5');
  const [m2Symbol, setM2Symbol] = useState('R_50');
  const [m2HookEnabled, setM2HookEnabled] = useState(false);
  const [m2VirtualLossCount, setM2VirtualLossCount] = useState('3');
  const [m2RealCount, setM2RealCount] = useState('2');
  const [m2CombinedEnabled, setM2CombinedEnabled] = useState(false);
  const [m2CombinedPatterns, setM2CombinedPatterns] = useState('');

  // ── Virtual hook stats ────────────────────────────────────────────────────
  const [vhFakeWins, setVhFakeWins] = useState(0);
  const [vhFakeLosses, setVhFakeLosses] = useState(0);
  const [vhConsecLosses, setVhConsecLosses] = useState(0);
  const [vhStatus, setVhStatus] = useState<'idle'|'waiting'|'confirmed'|'failed'>('idle');

  // ── Risk config ────────────────────────────────────────────────────────────
  const [stake, setStake] = useState('0.6');
  const [martingaleOn, setMartingaleOn] = useState(false);
  const [martingaleMultiplier, setMartingaleMultiplier] = useState('2.0');
  const [martingaleMaxSteps, setMartingaleMaxSteps] = useState('5');
  const [takeProfit, setTakeProfit] = useState('5');
  const [stopLoss, setStopLoss] = useState('30');

  // ── Strategy config ────────────────────────────────────────────────────────
  const [strategyEnabled, setStrategyEnabled] = useState(false);
  const [strategyM1Enabled, setStrategyM1Enabled] = useState(false);
  const [m1StrategyMode, setM1StrategyMode] = useState<'pattern'|'digit'>('pattern');
  const [m2StrategyMode, setM2StrategyMode] = useState<'pattern'|'digit'>('pattern');
  const [m1Pattern, setM1Pattern] = useState('');
  const [m1DigitCondition, setM1DigitCondition] = useState('==');
  const [m1DigitCompare, setM1DigitCompare] = useState('5');
  const [m1DigitWindow, setM1DigitWindow] = useState('3');
  const [m2Pattern, setM2Pattern] = useState('');
  const [m2DigitCondition, setM2DigitCondition] = useState('==');
  const [m2DigitCompare, setM2DigitCompare] = useState('5');
  const [m2DigitWindow, setM2DigitWindow] = useState('3');

  // ── Scanner ────────────────────────────────────────────────────────────────
  const [scannerActive, setScannerActive] = useState(false);
  const [turboMode, setTurboMode] = useState(true);
  const [turboLatency, setTurboLatency] = useState(0);
  const [ticksCaptured, setTicksCaptured] = useState(0);
  const [ticksMissed, setTicksMissed] = useState(0);
  const turboBuffersRef = useRef<Map<string, CircularTickBuffer>>(new Map());
  const lastTickTsRef = useRef(0);
  const [isConnected, setIsConnected] = useState(!!api_base.api);
  const tickMapRef = useRef<Map<string, number[]>>(new Map());
  const [tickCounts, setTickCounts] = useState<Record<string, number>>({});

  const cleanM1Pattern = m1Pattern.toUpperCase().replace(/[^EO]/g, '');
  const m1PatternValid = cleanM1Pattern.length >= 2;
  const cleanM2Pattern = m2Pattern.toUpperCase().replace(/[^EO]/g, '');
  const m2PatternValid = cleanM2Pattern.length >= 2;

  // ── Log helpers ───────────────────────────────────────────────────────────
  const addLog = useCallback((id: number, entry: Omit<LogEntry, 'id'>) => {
    setLogEntries(prev => [{ ...entry, id }, ...prev].slice(0, 100));
  }, []);

  const updateLog = useCallback((id: number, updates: Partial<LogEntry>) => {
    setLogEntries(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
  }, []);

  const clearLog = useCallback(() => {
    setLogEntries([]);
    setWins(0); setLosses(0); setTotalStaked(0); setNetProfit(0);
    setMartingaleStepState(0);
    setVhFakeWins(0); setVhFakeLosses(0); setVhConsecLosses(0); setVhStatus('idle');
    setTicksCaptured(0); setTicksMissed(0);
    shouldStopRef.current = false;
    patternTradeTakenRef.current = false;
    combinedTradeTakenRef.current = false;
  }, []);

  // ── Tick subscription via ramzfx2 api_base ────────────────────────────────
  useEffect(() => {
    if (!api_base.api) return;
    let active = true;

    const handler = (raw: any) => {
      const data = raw?.data ?? raw;
      if (!active || !data?.tick) return;
      const { symbol, quote } = data.tick;
      const digit = getLastDigitFromQuote(quote, symbol);
      const now = performance.now();

      const arr = tickMapRef.current.get(symbol) || [];
      arr.push(digit); if (arr.length > 200) arr.shift();
      tickMapRef.current.set(symbol, arr);
      setTickCounts(prev => ({ ...prev, [symbol]: arr.length }));

      if (!turboBuffersRef.current.has(symbol))
        turboBuffersRef.current.set(symbol, new CircularTickBuffer(1000));
      turboBuffersRef.current.get(symbol)!.push(digit);

      if (lastTickTsRef.current > 0) {
        const lat = now - lastTickTsRef.current;
        setTurboLatency(Math.round(lat));
        if (lat > 50) setTicksMissed(prev => prev + 1);
      }
      lastTickTsRef.current = now;
      setTicksCaptured(prev => prev + 1);
    };

    const sub = (api_base.api as any).onMessage().subscribe(handler);
    SCANNER_MARKETS.forEach(m => {
      (api_base.api as any).subscribe({ ticks: m.symbol }).catch(() => {});
    });

    return () => { active = false; sub.unsubscribe?.(); };
  }, []);

  // ── Pattern checkers (unchanged logic) ───────────────────────────────────
  const checkPatternMatchWith = useCallback((symbol: string, cleanPat: string): boolean => {
    const digits = tickMapRef.current.get(symbol) || [];
    if (digits.length < cleanPat.length) return false;
    const recent = digits.slice(-cleanPat.length);
    return recent.every((d, i) => (d % 2 === 0 ? 'E' : 'O') === cleanPat[i]);
  }, []);

  const checkDigitConditionWith = useCallback((symbol: string, condition: string, compare: string, window: string): boolean => {
    const digits = tickMapRef.current.get(symbol) || [];
    const win = parseInt(window) || 3;
    const comp = parseInt(compare);
    if (digits.length < win) return false;
    return digits.slice(-win).every(d => {
      switch (condition) {
        case '>':  return d > comp;
        case '<':  return d < comp;
        case '>=': return d >= comp;
        case '<=': return d <= comp;
        case '==': return d === comp;
        default:   return false;
      }
    });
  }, []);

  const checkCombinedPatternForSymbol = useCallback((symbol: string, patterns: string): boolean => {
    return checkCombinedPattern(tickMapRef.current.get(symbol) || [], patterns);
  }, []);

  const checkStrategyForMarket = useCallback((symbol: string, market: 1|2): boolean => {
    const mode = market === 1 ? m1StrategyMode : m2StrategyMode;
    if (mode === 'pattern') {
      return checkPatternMatchWith(symbol, market === 1 ? cleanM1Pattern : cleanM2Pattern);
    }
    return checkDigitConditionWith(
      symbol,
      market === 1 ? m1DigitCondition : m2DigitCondition,
      market === 1 ? m1DigitCompare   : m2DigitCompare,
      market === 1 ? m1DigitWindow    : m2DigitWindow
    );
  }, [m1StrategyMode, m2StrategyMode, cleanM1Pattern, cleanM2Pattern, checkPatternMatchWith, checkDigitConditionWith, m1DigitCondition, m1DigitCompare, m1DigitWindow, m2DigitCondition, m2DigitCompare, m2DigitWindow]);

  const checkCombinedForMarket = useCallback((symbol: string, market: 1|2): boolean => {
    return market === 1
      ? m1CombinedEnabled && checkCombinedPatternForSymbol(symbol, m1CombinedPatterns)
      : m2CombinedEnabled && checkCombinedPatternForSymbol(symbol, m2CombinedPatterns);
  }, [m1CombinedEnabled, m2CombinedEnabled, m1CombinedPatterns, m2CombinedPatterns, checkCombinedPatternForSymbol]);

  const findScannerMatch = useCallback((market: 1|2): string | null => {
    for (const m of SCANNER_MARKETS) {
      if (checkStrategyForMarket(m.symbol, market)) return m.symbol;
    }
    return null;
  }, [checkStrategyForMarket]);

  const findCombinedMatch = useCallback((market: 1|2): string | null => {
    if (!scannerActive) return null;
    for (const m of SCANNER_MARKETS) {
      if (checkCombinedForMarket(m.symbol, market)) return m.symbol;
    }
    return null;
  }, [scannerActive, checkCombinedForMarket]);

  // ── Trade execution via ramzfx2 buyContractForUi ──────────────────────────
  const executeRealTrade = useCallback(async (
    cfg: { contract: string; barrier: string; symbol: string },
    tradeSymbol: string,
    cStake: number,
    mStep: number,
    mkt: 1|2,
    currentBalance: number,
    currentPnl: number,
    baseStake: number,
  ) => {
    const logId = ++logIdRef.current;
    setTotalStaked(prev => prev + cStake);
    setCurrentStakeState(cStake);

    addLog(logId, {
      time: new Date().toLocaleTimeString(), market: mkt === 1 ? 'M1' : 'M2',
      symbol: tradeSymbol, contract: cfg.contract, stake: cStake, martingaleStep: mStep,
      exitDigit: '...', result: 'Pending', pnl: 0, balance: currentBalance, switchInfo: '',
    });

    let updatedPnl = currentPnl;
    let updatedBalance = currentBalance;
    let won = false;
    let contractExecuted = false;
    let newCStake = cStake;
    let newMStep = mStep;
    let newInRecovery = mkt === 2;

    try {
      if (!turboMode) await waitForNextTick(tradeSymbol);

      const params: Record<string, any> = {
        contract_type: cfg.contract, symbol: tradeSymbol,
        duration: 1, duration_unit: 't', basis: 'stake', amount: cStake,
      };
      if (needsBarrier(cfg.contract)) params.barrier = cfg.barrier;

      // ── ramzfx2 trade purchase ─────────────────────────────────────────────
      const buy = await buyContractForUi({ parameters: params, price: cStake, source: 'ProScanner' });
      contractExecuted = true;
      // buyContractForUi returns the buy object directly (not wrapped in {buy:{...}})
      const contractId = (buy as any).contract_id;
      if (!contractId) throw new Error('No contract_id returned');

      const buySnapshot = {
        buy_price: (buy as any).buy_price,
        contract_id: contractId,
        transaction_ids: { buy: (buy as any).transaction_id },
      };

      // streamContractUntilSettled returns a Promise<Record> — no manual wrapping needed.
      // The callback key is `onUpdate`, not `onContractUpdate`.
      const settledContract = await streamContractUntilSettled({
        contractId,
        fallback: buySnapshot,
        onUpdate: (snapshot: any) => { won = snapshot.is_sold ? Number(snapshot.profit ?? 0) > 0 : won; },
        source: 'ProScanner',
      });
      const finalPnl = Number(settledContract.profit ?? 0);
      won = finalPnl > 0;

      updatedPnl = currentPnl + finalPnl;
      updatedBalance = currentBalance + finalPnl;
      setLocalBalance(updatedBalance);
      setNetProfit(updatedPnl);

      if (won) {
        setWins(prev => prev + 1);
        newMStep = 0; newCStake = baseStake;
        newInRecovery = mkt === 2 ? false : newInRecovery;
      } else {
        setLosses(prev => prev + 1);
        if (!newInRecovery && m2Enabled) newInRecovery = true;
        if (martingaleOn) {
          const maxS = parseInt(martingaleMaxSteps) || 5;
          if (mStep < maxS) {
            newCStake = parseFloat((cStake * (parseFloat(martingaleMultiplier) || 2)).toFixed(2));
            newMStep++;
          } else { newMStep = 0; newCStake = baseStake; }
        }
      }

      setMartingaleStepState(newMStep);
      setCurrentStakeState(newCStake);
      updateLog(logId, { exitDigit: '-', result: won ? 'Win' : 'Loss', pnl: finalPnl, balance: updatedBalance, switchInfo: won ? '→ Win' : newInRecovery ? '✗ Loss → M2' : '✗ Loss' });

      let shouldBreak = false;
      if (updatedPnl >= parseFloat(takeProfit)) { showTPNotification('tp', 'Take Profit Hit!', updatedPnl); shouldBreak = true; shouldStopRef.current = true; }
      if (updatedPnl <= -parseFloat(stopLoss))  { showTPNotification('sl', 'Stop Loss Hit!', Math.abs(updatedPnl)); shouldBreak = true; shouldStopRef.current = true; }

      return { localPnl: updatedPnl, localBalance: updatedBalance, cStake: newCStake, mStep: newMStep, inRecovery: newInRecovery, shouldBreak, won, contractExecuted };
    } catch (err: any) {
      updateLog(logId, { result: 'Failed', pnl: 0, exitDigit: '-', switchInfo: `❌ ${err.message}` });
      return { localPnl: updatedPnl, localBalance: updatedBalance, cStake, mStep, inRecovery: newInRecovery, shouldBreak: false, won: false, contractExecuted };
    }
  }, [addLog, updateLog, m2Enabled, martingaleOn, martingaleMultiplier, martingaleMaxSteps, takeProfit, stopLoss, turboMode]);

  // ── Start bot ─────────────────────────────────────────────────────────────
  const startBot = useCallback(async () => {
    if (!isAuthorized || isRunning || !api_base.api) return;

    const baseStake = parseFloat(stake);
    if (baseStake < 0.35) { addLog(++logIdRef.current, { time: new Date().toLocaleTimeString(), market: 'SYSTEM', symbol: 'ERROR', contract: 'STAKE', stake: 0, martingaleStep: 0, exitDigit: '-', result: 'Failed', pnl: 0, balance: localBalance, switchInfo: '❌ Minimum stake is $0.35' }); return; }
    if (!m1Enabled && !m2Enabled) return;

    shouldStopRef.current = false;
    setIsRunning(true); runningRef.current = true;
    setBotStatus('trading_m1'); setCurrentStakeState(baseStake);

    let cStake = baseStake, mStep = 0, inRecovery = false;
    let currentPnl = 0, currentBalance = localBalance;

    const getConfig = (market: 1|2) => ({
      contract: market === 1 ? m1Contract : m2Contract,
      barrier:  market === 1 ? m1Barrier  : m2Barrier,
      symbol:   market === 1 ? m1Symbol   : m2Symbol,
    });

    while (runningRef.current && !shouldStopRef.current) {
      if (currentPnl >= parseFloat(takeProfit) || currentPnl <= -parseFloat(stopLoss)) break;

      const mkt: 1|2 = inRecovery ? 2 : 1;
      setCurrentMarket(mkt);
      if (mkt === 1 && !m1Enabled) { if (m2Enabled) { inRecovery = true; continue; } break; }
      if (mkt === 2 && !m2Enabled) { inRecovery = false; continue; }

      const cfg = getConfig(mkt);
      let tradeSymbol = cfg.symbol;

      // Combined strategy
      const combinedEnabled = mkt === 1 ? m1CombinedEnabled : m2CombinedEnabled;
      const combinedPatterns = mkt === 1 ? m1CombinedPatterns : m2CombinedPatterns;
      if (combinedEnabled && combinedPatterns.trim()) {
        setBotStatus('waiting_pattern');
        let matched = false; let matchedSym = '';
        for (let a = 0; a < 100 && runningRef.current && !matched; a++) {
          const found = scannerActive ? findCombinedMatch(mkt) : (checkCombinedForMarket(cfg.symbol, mkt) ? cfg.symbol : null);
          if (found) { matched = true; matchedSym = found; } else await new Promise(r => turboMode ? requestAnimationFrame(() => r(undefined)) : setTimeout(r, 100));
        }
        if (matched) {
          setBotStatus('pattern_matched'); tradeSymbol = matchedSym;
          const result = await executeRealTrade(cfg, tradeSymbol, cStake, mStep, mkt, currentBalance, currentPnl, baseStake);
          if (result) { currentPnl = result.localPnl; currentBalance = result.localBalance; cStake = result.cStake; mStep = result.mStep; inRecovery = result.inRecovery; if (result.shouldBreak) break; }
          continue;
        }
      }

      // Pattern/digit strategy
      const useStrategy = (mkt === 1 && strategyM1Enabled) || (mkt === 2 && strategyEnabled);
      if (useStrategy) {
        setBotStatus('waiting_pattern');
        let matched = false;
        for (let a = 0; a < 100 && runningRef.current && !matched; a++) {
          const found = scannerActive ? findScannerMatch(mkt) : (checkStrategyForMarket(cfg.symbol, mkt) ? cfg.symbol : null);
          if (found) { matched = true; tradeSymbol = found; } else await new Promise(r => turboMode ? requestAnimationFrame(() => r(undefined)) : setTimeout(r, 100));
        }
        if (!matched) continue;
        setBotStatus('pattern_matched');
      } else {
        setBotStatus(mkt === 1 ? 'trading_m1' : 'recovery');
      }

      if (shouldStopRef.current) break;

      // Virtual hook
      const hookEnabled = mkt === 1 ? m1HookEnabled : m2HookEnabled;
      const requiredLosses = parseInt(mkt === 1 ? m1VirtualLossCount : m2VirtualLossCount) || 3;
      const realCount = parseInt(mkt === 1 ? m1RealCount : m2RealCount) || 2;

      if (hookEnabled) {
        setBotStatus('virtual_hook'); setVhStatus('waiting');
        setVhFakeWins(0); setVhFakeLosses(0); setVhConsecLosses(0);
        let consecLosses = 0;
        while (consecLosses < requiredLosses && runningRef.current && !shouldStopRef.current) {
          const vLogId = ++logIdRef.current;
          addLog(vLogId, { time: new Date().toLocaleTimeString(), market: 'VH', symbol: tradeSymbol, contract: cfg.contract, stake: 0, martingaleStep: 0, exitDigit: '...', result: 'Pending', pnl: 0, balance: currentBalance, switchInfo: `Virtual (losses: ${consecLosses}/${requiredLosses})` });
          try {
            const vr = await simulateVirtualContract(cfg.contract, cfg.barrier, tradeSymbol);
            if (vr.won) { consecLosses = 0; setVhConsecLosses(0); setVhFakeWins(v => v+1); updateLog(vLogId, { exitDigit: String(vr.digit), result: 'V-Win', switchInfo: 'Virtual WIN → reset' }); }
            else { consecLosses++; setVhConsecLosses(consecLosses); setVhFakeLosses(v => v+1); updateLog(vLogId, { exitDigit: String(vr.digit), result: 'V-Loss', switchInfo: `V-Loss (${consecLosses}/${requiredLosses})` }); }
          } catch { break; }
        }
        setVhStatus('confirmed');
        for (let ri = 0; ri < realCount && runningRef.current; ri++) {
          const result = await executeRealTrade(cfg, tradeSymbol, cStake, mStep, mkt, currentBalance, currentPnl, baseStake);
          if (!result) break;
          currentPnl = result.localPnl; currentBalance = result.localBalance; cStake = result.cStake; mStep = result.mStep; inRecovery = result.inRecovery;
          if (result.shouldBreak) { shouldStopRef.current = true; break; }
          if (result.won) break;
        }
        setVhStatus('idle'); setVhConsecLosses(0);
        if (!runningRef.current || shouldStopRef.current) break;
        continue;
      }

      // Standard trade
      const result = await executeRealTrade(cfg, tradeSymbol, cStake, mStep, mkt, currentBalance, currentPnl, baseStake);
      if (!result) break;
      currentPnl = result.localPnl; currentBalance = result.localBalance; cStake = result.cStake; mStep = result.mStep; inRecovery = result.inRecovery;
      if (result.shouldBreak) break;
      if (!turboMode) await new Promise(r => setTimeout(r, 400));
    }

    setIsRunning(false); runningRef.current = false; setBotStatus('idle');
  }, [isAuthorized, isRunning, stake, m1Enabled, m2Enabled, m1Contract, m2Contract, m1Barrier, m2Barrier, m1Symbol, m2Symbol, martingaleOn, martingaleMultiplier, martingaleMaxSteps, takeProfit, stopLoss, strategyEnabled, strategyM1Enabled, m1StrategyMode, m2StrategyMode, m1PatternValid, m2PatternValid, scannerActive, turboMode, m1HookEnabled, m2HookEnabled, m1VirtualLossCount, m2VirtualLossCount, m1RealCount, m2RealCount, executeRealTrade, addLog, findScannerMatch, findCombinedMatch, checkStrategyForMarket, checkCombinedForMarket, m1CombinedEnabled, m2CombinedEnabled, m1CombinedPatterns, m2CombinedPatterns, localBalance]);

  const stopBot = useCallback(() => {
    shouldStopRef.current = true; runningRef.current = false;
    setIsRunning(false); setBotStatus('idle');
  }, []);

  const statusConfig: Record<BotStatus, { icon: string; label: string; color: string }> = {
    idle:            { icon: '⚪', label: 'IDLE',            color: 'text-muted-foreground' },
    trading_m1:      { icon: '🟢', label: 'TRADING M1',      color: 'text-profit' },
    recovery:        { icon: '🟣', label: 'RECOVERY MODE',   color: 'text-purple-400' },
    waiting_pattern: { icon: '🟡', label: 'WAITING PATTERN', color: 'text-warning' },
    pattern_matched: { icon: '✅', label: 'PATTERN MATCHED', color: 'text-profit' },
    virtual_hook:    { icon: '🎣', label: 'VIRTUAL HOOK',    color: 'text-primary' },
    reconnecting:    { icon: '🔄', label: 'RECONNECTING...',  color: 'text-orange-400' },
  };

  const status = statusConfig[botStatus];
  const winRate = wins + losses > 0 ? ((wins / (wins + losses)) * 100).toFixed(1) : '0.0';
  const activeSymbol = currentMarket === 1 ? m1Symbol : m2Symbol;
  const activeDigits = (tickMapRef.current.get(activeSymbol) || []).slice(-8);

  // ═══════════════════════════════════════════════════════════════════════════
  // JSX — identical to original ProScannerBot, social links updated for ramzfx
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <>
      <style>{notificationStyles}</style>

      {/* Floating chart button */}
      <div className='fixed bottom-6 right-6 z-40'>
        <button
          onClick={() => setShowTradingChart(v => !v)}
          className='group relative w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center before:absolute before:inset-0 before:rounded-full before:bg-blue-500/30 before:animate-ping before:opacity-75'
        >
          <div className='absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent' />
          <BarChart3 className='w-5 h-5 text-white relative z-10' />
          <span className='absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse ring-2 ring-white' />
        </button>
      </div>

      {showSocialPopup && <SocialNotificationPopup onClose={() => setShowSocialPopup(false)} />}

      <div className='space-y-3 max-w-7xl mx-auto p-4'>

        {/* Header */}
        <div className='flex items-center justify-between gap-3 bg-gradient-to-r from-card/80 to-card/50 backdrop-blur-sm border border-blue-500/20 rounded-xl px-4 py-3 shadow-lg'>
          <div className='flex items-center gap-3'>
            <div className='p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-md'>
              <Scan className='w-4 h-4 text-white' />
            </div>
            <div>
              <h1 className='text-base font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent'>Ramzfx Pro Scanner Bot</h1>
              <p className='text-[10px] text-blue-300/80'>Advanced Market Scanning & Recovery System</p>
            </div>
          </div>
          <div className='flex items-center gap-2'>
            <span className={`text-[9px] px-2 py-0.5 rounded-full bg-muted/50 border border-blue-500/20 ${status.color}`}>
              {status.icon} {status.label}
            </span>
            {isRunning && (
              <span className='text-[9px] text-warning animate-pulse font-mono border border-yellow-500/30 px-2 py-0.5 rounded-full'>
                P/L: ${netProfit.toFixed(2)}
              </span>
            )}
          </div>
        </div>

        {/* Scanner + Turbo + Stats row */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
          <div className='bg-card border border-blue-500/20 rounded-xl p-3'>
            <div className='flex items-center justify-between mb-2'>
              <div className='flex items-center gap-1.5'>
                <Eye className='w-3.5 h-3.5 text-blue-400' />
                <span className='text-xs font-semibold'>Scan All Markets</span>
                <span className={`text-[9px] px-1.5 h-4 rounded-full border ${scannerActive ? 'bg-green-500/20 border-green-500/30 text-green-400' : 'bg-muted/50 border-muted text-muted-foreground'}`}>
                  {scannerActive ? '🟢 ON' : '⚫ OFF'}
                </span>
              </div>
              <input type='checkbox' checked={scannerActive} onChange={e => setScannerActive(e.target.checked)} disabled={isRunning} className='w-4 h-4' />
            </div>
            <div className='flex flex-wrap gap-1 max-h-20 overflow-y-auto'>
              {SCANNER_MARKETS.map(m => (
                <span key={m.symbol} className={`text-[8px] h-5 px-1 font-mono border rounded ${tickCounts[m.symbol] > 0 ? 'border-blue-500/50 text-blue-400' : 'text-muted-foreground border-muted'}`}>
                  {m.name}
                </span>
              ))}
            </div>
          </div>

          <div className='bg-card border border-blue-500/20 rounded-xl p-3'>
            <div className='flex items-center justify-between mb-2'>
              <div className='flex items-center gap-1.5'>
                <Zap className={`w-3.5 h-3.5 ${turboMode ? 'text-blue-400 animate-pulse' : 'text-muted-foreground'}`} />
                <span className='text-xs font-semibold'>Turbo Mode</span>
              </div>
              <button
                className={`h-6 text-[9px] px-2 rounded border ${turboMode ? 'bg-blue-500 text-white border-blue-600 animate-pulse' : 'bg-muted text-muted-foreground border-muted'}`}
                onClick={() => setTurboMode(v => !v)} disabled={isRunning}
              >
                {turboMode ? '⚡ ON' : 'OFF'}
              </button>
            </div>
            <div className='grid grid-cols-3 gap-1 text-center'>
              <div className='bg-muted/50 rounded p-1'><div className='text-[8px] text-muted-foreground'>Latency</div><div className='font-mono text-[10px] text-blue-400 font-bold'>{turboLatency}ms</div></div>
              <div className='bg-muted/50 rounded p-1'><div className='text-[8px] text-muted-foreground'>Captured</div><div className='font-mono text-[10px] text-green-400 font-bold'>{ticksCaptured}</div></div>
              <div className='bg-muted/50 rounded p-1'><div className='text-[8px] text-muted-foreground'>Missed</div><div className='font-mono text-[10px] text-red-400 font-bold'>{ticksMissed}</div></div>
            </div>
          </div>

          <div className='bg-card border border-blue-500/20 rounded-xl p-3'>
            <div className='flex items-center justify-between mb-2'>
              <span className='text-xs font-semibold'>Live Stats</span>
              <span className='font-mono text-sm font-bold text-blue-400'>{currency} {localBalance.toFixed(2)}</span>
            </div>
            <div className='grid grid-cols-3 gap-1 text-center'>
              <div className='bg-muted/50 rounded p-1'><div className='text-[8px] text-muted-foreground'>W/L</div><div className='font-mono text-[10px] font-bold'><span className='text-green-400'>{wins}</span>/<span className='text-red-400'>{losses}</span></div></div>
              <div className='bg-muted/50 rounded p-1'><div className='text-[8px] text-muted-foreground'>P/L</div><div className={`font-mono text-[10px] font-bold ${netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>${netProfit.toFixed(2)}</div></div>
              <div className='bg-muted/50 rounded p-1'><div className='text-[8px] text-muted-foreground'>Stake</div><div className='font-mono text-[10px] font-bold'>${currentStake.toFixed(2)}{martingaleStep > 0 && <span className='text-yellow-400 ml-0.5'>M{martingaleStep}</span>}</div></div>
            </div>
          </div>
        </div>

        {/* Main layout */}
        <div className='grid grid-cols-1 lg:grid-cols-12 gap-3'>

          {/* LEFT: Config */}
          <div className='lg:col-span-4 space-y-3'>

            {/* M1 Card */}
            <div className='bg-card border-2 border-blue-500/30 rounded-xl p-3 space-y-2'>
              <div className='flex items-center justify-between'>
                <h3 className='text-xs font-bold text-blue-400 flex items-center gap-1'><Home className='w-3.5 h-3.5' /> M1 — Home</h3>
                <div className='flex items-center gap-1.5'>
                  {currentMarket === 1 && isRunning && <span className='w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse' />}
                  <input type='checkbox' checked={m1Enabled} onChange={e => setM1Enabled(e.target.checked)} disabled={isRunning} />
                </div>
              </div>
              <select className='w-full h-7 text-xs rounded border border-input bg-transparent px-2' value={m1Symbol} onChange={e => setM1Symbol(e.target.value)} disabled={isRunning}>
                {SCANNER_MARKETS.map(m => <option key={m.symbol} value={m.symbol}>{m.name}</option>)}
              </select>
              <select className='w-full h-7 text-xs rounded border border-input bg-transparent px-2' value={m1Contract} onChange={e => setM1Contract(e.target.value)} disabled={isRunning}>
                {CONTRACT_TYPES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {needsBarrier(m1Contract) && (
                <input type='number' min='0' max='9' value={m1Barrier} onChange={e => setM1Barrier(e.target.value)} className='w-full h-7 text-xs rounded border border-input bg-transparent px-2' disabled={isRunning} />
              )}
              {/* Virtual Hook */}
              <div className='border-t border-border/30 pt-2'>
                <div className='flex items-center justify-between'>
                  <span className='text-[9px] font-semibold text-blue-400 flex items-center gap-1'><Anchor className='w-3 h-3' /> Virtual Hook</span>
                  <input type='checkbox' checked={m1HookEnabled} onChange={e => setM1HookEnabled(e.target.checked)} disabled={isRunning} />
                </div>
                {m1HookEnabled && (
                  <div className='grid grid-cols-2 gap-1.5 mt-1'>
                    <div><label className='text-[8px] text-muted-foreground'>V-Losses</label><input type='number' min='1' max='20' value={m1VirtualLossCount} onChange={e => setM1VirtualLossCount(e.target.value)} disabled={isRunning} className='w-full h-6 text-[10px] rounded border border-input bg-transparent px-1' /></div>
                    <div><label className='text-[8px] text-muted-foreground'>Real Trades</label><input type='number' min='1' max='10' value={m1RealCount} onChange={e => setM1RealCount(e.target.value)} disabled={isRunning} className='w-full h-6 text-[10px] rounded border border-input bg-transparent px-1' /></div>
                  </div>
                )}
              </div>
              {/* Combined Strategy */}
              <div className='border-t border-border/30 pt-2'>
                <div className='flex items-center justify-between'>
                  <span className='text-[9px] font-semibold text-green-400 flex items-center gap-1'><Combine className='w-3 h-3' /> Combined Strategy</span>
                  <input type='checkbox' checked={m1CombinedEnabled} onChange={e => setM1CombinedEnabled(e.target.checked)} disabled={isRunning} />
                </div>
                {m1CombinedEnabled && (
                  <div className='mt-1'>
                    <textarea placeholder='Patterns: 1,5,11,1O,5U,EEO,OOE' value={m1CombinedPatterns} onChange={e => setM1CombinedPatterns(e.target.value)} disabled={isRunning} className='w-full h-16 text-[10px] font-mono rounded border border-input bg-transparent px-2 py-1 resize-none' />
                    <div className='text-[8px] text-muted-foreground mt-0.5'>E=Even · O=Odd/Over · U=Under · 0-9=digit</div>
                  </div>
                )}
              </div>
            </div>

            {/* M2 Card */}
            <div className='bg-card border-2 border-purple-500/30 rounded-xl p-3 space-y-2'>
              <div className='flex items-center justify-between'>
                <h3 className='text-xs font-bold text-purple-400 flex items-center gap-1'><RefreshCw className='w-3.5 h-3.5' /> M2 — Recovery</h3>
                <div className='flex items-center gap-1.5'>
                  {currentMarket === 2 && isRunning && <span className='w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse' />}
                  <input type='checkbox' checked={m2Enabled} onChange={e => setM2Enabled(e.target.checked)} disabled={isRunning} />
                </div>
              </div>
              <select className='w-full h-7 text-xs rounded border border-input bg-transparent px-2' value={m2Symbol} onChange={e => setM2Symbol(e.target.value)} disabled={isRunning}>
                {SCANNER_MARKETS.map(m => <option key={m.symbol} value={m.symbol}>{m.name}</option>)}
              </select>
              <select className='w-full h-7 text-xs rounded border border-input bg-transparent px-2' value={m2Contract} onChange={e => setM2Contract(e.target.value)} disabled={isRunning}>
                {CONTRACT_TYPES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {needsBarrier(m2Contract) && (
                <input type='number' min='0' max='9' value={m2Barrier} onChange={e => setM2Barrier(e.target.value)} className='w-full h-7 text-xs rounded border border-input bg-transparent px-2' disabled={isRunning} />
              )}
              <div className='border-t border-border/30 pt-2'>
                <div className='flex items-center justify-between'>
                  <span className='text-[9px] font-semibold text-blue-400 flex items-center gap-1'><Anchor className='w-3 h-3' /> Virtual Hook</span>
                  <input type='checkbox' checked={m2HookEnabled} onChange={e => setM2HookEnabled(e.target.checked)} disabled={isRunning} />
                </div>
                {m2HookEnabled && (
                  <div className='grid grid-cols-2 gap-1.5 mt-1'>
                    <div><label className='text-[8px] text-muted-foreground'>V-Losses</label><input type='number' min='1' max='20' value={m2VirtualLossCount} onChange={e => setM2VirtualLossCount(e.target.value)} disabled={isRunning} className='w-full h-6 text-[10px] rounded border border-input bg-transparent px-1' /></div>
                    <div><label className='text-[8px] text-muted-foreground'>Real Trades</label><input type='number' min='1' max='10' value={m2RealCount} onChange={e => setM2RealCount(e.target.value)} disabled={isRunning} className='w-full h-6 text-[10px] rounded border border-input bg-transparent px-1' /></div>
                  </div>
                )}
              </div>
              <div className='border-t border-border/30 pt-2'>
                <div className='flex items-center justify-between'>
                  <span className='text-[9px] font-semibold text-green-400 flex items-center gap-1'><Combine className='w-3 h-3' /> Combined Strategy</span>
                  <input type='checkbox' checked={m2CombinedEnabled} onChange={e => setM2CombinedEnabled(e.target.checked)} disabled={isRunning} />
                </div>
                {m2CombinedEnabled && (
                  <div className='mt-1'>
                    <textarea placeholder='Patterns: 1,5,11,1O,5U,EEO,OOE' value={m2CombinedPatterns} onChange={e => setM2CombinedPatterns(e.target.value)} disabled={isRunning} className='w-full h-16 text-[10px] font-mono rounded border border-input bg-transparent px-2 py-1 resize-none' />
                    <div className='text-[8px] text-muted-foreground mt-0.5'>E=Even · O=Odd/Over · U=Under · 0-9=digit</div>
                  </div>
                )}
              </div>
            </div>

            {/* Virtual Hook Stats */}
            {(m1HookEnabled || m2HookEnabled) && (
              <div className='bg-card border border-blue-500/30 rounded-xl p-3'>
                <h3 className='text-[10px] font-semibold text-blue-400 flex items-center gap-1 mb-2'><Anchor className='w-3 h-3' /> Hook Status</h3>
                <div className='grid grid-cols-4 gap-1 text-center'>
                  <div className='bg-muted/50 rounded p-1'><div className='text-[8px] text-muted-foreground'>V-Win</div><div className='font-mono text-[10px] font-bold text-green-400'>{vhFakeWins}</div></div>
                  <div className='bg-muted/50 rounded p-1'><div className='text-[8px] text-muted-foreground'>V-Loss</div><div className='font-mono text-[10px] font-bold text-red-400'>{vhFakeLosses}</div></div>
                  <div className='bg-muted/50 rounded p-1'><div className='text-[8px] text-muted-foreground'>Streak</div><div className='font-mono text-[10px] font-bold text-yellow-400'>{vhConsecLosses}</div></div>
                  <div className='bg-muted/50 rounded p-1'><div className='text-[8px] text-muted-foreground'>State</div><div className={`text-[9px] font-bold ${vhStatus === 'confirmed' ? 'text-green-400' : vhStatus === 'waiting' ? 'text-yellow-400 animate-pulse' : 'text-muted-foreground'}`}>{vhStatus === 'confirmed' ? '✓' : vhStatus === 'waiting' ? '⏳' : '—'}</div></div>
                </div>
              </div>
            )}

            {/* Risk Management */}
            <div className='bg-card border border-blue-500/20 rounded-xl p-3 space-y-2'>
              <h3 className='text-xs font-semibold flex items-center gap-1'><Shield className='w-3.5 h-3.5' /> Risk Management</h3>
              <div className='grid grid-cols-3 gap-2'>
                <div><label className='text-[8px] text-muted-foreground'>Stake ($)</label><input type='number' min='0.35' step='0.01' value={stake} onChange={e => setStake(e.target.value)} disabled={isRunning} className='w-full h-7 text-xs rounded border border-input bg-transparent px-2' /></div>
                <div><label className='text-[8px] text-muted-foreground'>Take Profit</label><input type='number' value={takeProfit} onChange={e => setTakeProfit(e.target.value)} disabled={isRunning} className='w-full h-7 text-xs rounded border border-input bg-transparent px-2' /></div>
                <div><label className='text-[8px] text-muted-foreground'>Stop Loss</label><input type='number' value={stopLoss} onChange={e => setStopLoss(e.target.value)} disabled={isRunning} className='w-full h-7 text-xs rounded border border-input bg-transparent px-2' /></div>
              </div>
              <div className='flex items-center justify-between'>
                <label className='text-[10px]'>Martingale</label>
                <input type='checkbox' checked={martingaleOn} onChange={e => setMartingaleOn(e.target.checked)} disabled={isRunning} />
              </div>
              {martingaleOn && (
                <div className='grid grid-cols-2 gap-2'>
                  <div><label className='text-[8px] text-muted-foreground'>Multiplier</label><input type='number' min='1.1' step='0.1' value={martingaleMultiplier} onChange={e => setMartingaleMultiplier(e.target.value)} disabled={isRunning} className='w-full h-7 text-xs rounded border border-input bg-transparent px-2' /></div>
                  <div><label className='text-[8px] text-muted-foreground'>Max Steps</label><input type='number' min='1' max='10' value={martingaleMaxSteps} onChange={e => setMartingaleMaxSteps(e.target.value)} disabled={isRunning} className='w-full h-7 text-xs rounded border border-input bg-transparent px-2' /></div>
                </div>
              )}
              <div className='flex items-center gap-3 pt-1'>
                <label className='flex items-center gap-1 text-[10px]'><input type='checkbox' checked={strategyM1Enabled} onChange={e => setStrategyM1Enabled(e.target.checked)} disabled={isRunning} className='rounded w-3 h-3' /> Strategy M1</label>
                <label className='flex items-center gap-1 text-[10px]'><input type='checkbox' checked={strategyEnabled} onChange={e => setStrategyEnabled(e.target.checked)} disabled={isRunning} className='rounded w-3 h-3' /> Strategy M2</label>
              </div>
            </div>

            {/* Strategy Conditions */}
            {(strategyEnabled || strategyM1Enabled) && (
              <div className='bg-card border border-yellow-500/30 rounded-xl p-3 space-y-2'>
                <h3 className='text-xs font-semibold text-yellow-500 flex items-center gap-1'><Zap className='w-3.5 h-3.5' /> Strategy Conditions</h3>
                {strategyM1Enabled && (
                  <div className='border border-blue-500/20 rounded-lg p-2 space-y-1'>
                    <div className='flex items-center justify-between'>
                      <label className='text-[9px] font-semibold text-blue-400'>M1 Strategy</label>
                      <div className='flex gap-0.5'>
                        <button className={`text-[9px] h-5 px-1.5 rounded border ${m1StrategyMode === 'pattern' ? 'bg-blue-500 text-white border-blue-600' : 'bg-transparent border-input'}`} onClick={() => setM1StrategyMode('pattern')} disabled={isRunning}>Pattern</button>
                        <button className={`text-[9px] h-5 px-1.5 rounded border ${m1StrategyMode === 'digit' ? 'bg-blue-500 text-white border-blue-600' : 'bg-transparent border-input'}`} onClick={() => setM1StrategyMode('digit')} disabled={isRunning}>Digit</button>
                      </div>
                    </div>
                    {m1StrategyMode === 'pattern' ? (
                      <>
                        <textarea placeholder='E=Even O=Odd e.g. EEEOE' value={m1Pattern} onChange={e => setM1Pattern(e.target.value.toUpperCase().replace(/[^EO]/g, ''))} disabled={isRunning} className='w-full h-10 text-[10px] font-mono rounded border border-input bg-transparent px-2 py-1 resize-none' />
                        <div className={`text-[9px] font-mono ${m1PatternValid ? 'text-green-400' : 'text-red-400'}`}>{cleanM1Pattern.length === 0 ? 'Enter pattern...' : m1PatternValid ? `✓ ${cleanM1Pattern}` : '✗ Need 2+'}</div>
                      </>
                    ) : (
                      <div className='grid grid-cols-3 gap-1'>
                        <input type='number' min='1' max='50' value={m1DigitWindow} onChange={e => setM1DigitWindow(e.target.value)} disabled={isRunning} className='h-6 text-[10px] rounded border border-input bg-transparent px-1' placeholder='Window' />
                        <select value={m1DigitCondition} onChange={e => setM1DigitCondition(e.target.value)} disabled={isRunning} className='h-6 text-[10px] rounded border border-input bg-transparent px-1'>{['==','>','<','>=','<='].map(c => <option key={c} value={c}>{c}</option>)}</select>
                        <input type='number' min='0' max='9' value={m1DigitCompare} onChange={e => setM1DigitCompare(e.target.value)} disabled={isRunning} className='h-6 text-[10px] rounded border border-input bg-transparent px-1' placeholder='Digit' />
                      </div>
                    )}
                  </div>
                )}
                {strategyEnabled && (
                  <div className='border border-purple-500/20 rounded-lg p-2 space-y-1'>
                    <div className='flex items-center justify-between'>
                      <label className='text-[9px] font-semibold text-purple-400'>M2 Strategy</label>
                      <div className='flex gap-0.5'>
                        <button className={`text-[9px] h-5 px-1.5 rounded border ${m2StrategyMode === 'pattern' ? 'bg-blue-500 text-white border-blue-600' : 'bg-transparent border-input'}`} onClick={() => setM2StrategyMode('pattern')} disabled={isRunning}>Pattern</button>
                        <button className={`text-[9px] h-5 px-1.5 rounded border ${m2StrategyMode === 'digit' ? 'bg-blue-500 text-white border-blue-600' : 'bg-transparent border-input'}`} onClick={() => setM2StrategyMode('digit')} disabled={isRunning}>Digit</button>
                      </div>
                    </div>
                    {m2StrategyMode === 'pattern' ? (
                      <>
                        <textarea placeholder='E=Even O=Odd e.g. OOEEO' value={m2Pattern} onChange={e => setM2Pattern(e.target.value.toUpperCase().replace(/[^EO]/g, ''))} disabled={isRunning} className='w-full h-10 text-[10px] font-mono rounded border border-input bg-transparent px-2 py-1 resize-none' />
                        <div className={`text-[9px] font-mono ${m2PatternValid ? 'text-green-400' : 'text-red-400'}`}>{cleanM2Pattern.length === 0 ? 'Enter pattern...' : m2PatternValid ? `✓ ${cleanM2Pattern}` : '✗ Need 2+'}</div>
                      </>
                    ) : (
                      <div className='grid grid-cols-3 gap-1'>
                        <input type='number' min='1' max='50' value={m2DigitWindow} onChange={e => setM2DigitWindow(e.target.value)} disabled={isRunning} className='h-6 text-[10px] rounded border border-input bg-transparent px-1' placeholder='Window' />
                        <select value={m2DigitCondition} onChange={e => setM2DigitCondition(e.target.value)} disabled={isRunning} className='h-6 text-[10px] rounded border border-input bg-transparent px-1'>{['==','>','<','>=','<='].map(c => <option key={c} value={c}>{c}</option>)}</select>
                        <input type='number' min='0' max='9' value={m2DigitCompare} onChange={e => setM2DigitCompare(e.target.value)} disabled={isRunning} className='h-6 text-[10px] rounded border border-input bg-transparent px-1' placeholder='Digit' />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RIGHT: Digits + Log */}
          <div className='lg:col-span-8 space-y-3'>

            {/* Live Digits */}
            <div className='bg-card border border-blue-500/20 rounded-xl p-3'>
              <div className='flex items-center justify-between mb-2'>
                <h3 className='text-[10px] font-semibold'>Live Digits — {activeSymbol}</h3>
                <span className='text-[9px] text-muted-foreground font-mono'>Win Rate: {winRate}% | Staked: ${totalStaked.toFixed(2)}</span>
              </div>
              <div className='flex gap-1 justify-center flex-wrap'>
                {activeDigits.length === 0
                  ? <span className='text-[10px] text-muted-foreground'>Waiting for ticks…</span>
                  : activeDigits.map((d, i) => {
                    const isOver = d >= 5; const isEven = d % 2 === 0; const isLast = i === activeDigits.length - 1;
                    return (
                      <div key={i} className={`w-8 h-10 rounded-lg flex flex-col items-center justify-center text-xs font-mono font-bold border ${isLast ? 'ring-2 ring-blue-500 shadow-lg' : ''} ${isOver ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-green-500/10 border-green-500/30 text-green-400'}`}>
                        <span className='text-sm'>{d}</span>
                        <span className='text-[7px] opacity-60'>{isOver ? 'O' : 'U'}{isEven ? 'E' : 'O'}</span>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Start/Stop button */}
            <button
              onClick={isRunning ? stopBot : startBot}
              disabled={!isRunning && (!isAuthorized || !isConnected)}
              className={`relative w-full h-16 text-lg font-bold rounded-xl transition-all duration-300 overflow-hidden ${isRunning ? 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white shadow-lg shadow-red-500/30 animate-glow-pulse' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/30'} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isRunning && <span className='absolute inset-0 bg-white/20 animate-pulse rounded-xl' />}
              <div className='relative flex items-center justify-center gap-3'>
                {isRunning
                  ? <><StopCircle className='w-6 h-6 animate-pulse' /><span>STOP BOT</span></>
                  : <><Play className='w-6 h-6' /><span>START BOT</span></>}
              </div>
            </button>

            {/* Activity Log */}
            <div className='bg-card border border-blue-500/20 rounded-xl overflow-hidden shadow-lg'>
              <div className='px-4 py-3 border-b border-blue-500/20 flex items-center justify-between bg-muted/20'>
                <h3 className='text-xs font-semibold flex items-center gap-2'>
                  <RefreshCw className='w-3.5 h-3.5 text-blue-400' />
                  Activity Log
                  <span className='text-[9px] px-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400'>{logEntries.length} entries</span>
                </h3>
                <button onClick={clearLog} className='h-7 w-7 flex items-center justify-center rounded text-muted-foreground hover:text-red-400 transition-colors'>
                  <Trash2 className='w-3.5 h-3.5' />
                </button>
              </div>
              <div className='max-h-[400px] overflow-auto'>
                <table className='w-full text-[10px]'>
                  <thead className='text-[9px] text-muted-foreground bg-muted/40 sticky top-0'>
                    <tr className='border-b border-blue-500/20'>
                      <th className='text-left p-2'>Time</th><th className='text-left p-2'>Mkt</th>
                      <th className='text-left p-2'>Symbol</th><th className='text-left p-2'>Type</th>
                      <th className='text-right p-2'>Stake</th><th className='text-center p-2'>Digit</th>
                      <th className='text-center p-2'>Result</th><th className='text-right p-2'>P/L</th>
                      <th className='text-right p-2'>Bal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logEntries.length === 0
                      ? <tr><td colSpan={9} className='text-center text-muted-foreground py-12 text-xs'>No trades yet — configure and start the bot</td></tr>
                      : logEntries.map(e => (
                        <tr key={e.id} className={`border-b border-border/50 hover:bg-muted/30 ${e.market === 'M1' ? 'border-l-2 border-l-blue-500' : e.market === 'VH' ? 'border-l-2 border-l-indigo-500' : e.market === 'SYSTEM' ? 'border-l-2 border-l-orange-500' : e.market === 'COMBINED' ? 'border-l-2 border-l-green-500' : 'border-l-2 border-l-purple-500'}`}>
                          <td className='p-2 font-mono text-[9px] text-muted-foreground'>{e.time}</td>
                          <td className={`p-2 font-bold text-[10px] ${e.market === 'M1' ? 'text-blue-400' : e.market === 'VH' ? 'text-indigo-400' : e.market === 'SYSTEM' ? 'text-orange-500' : e.market === 'COMBINED' ? 'text-green-400' : 'text-purple-400'}`}>{e.market}</td>
                          <td className='p-2 font-mono text-[9px]'>{e.symbol}</td>
                          <td className='p-2 text-[9px] text-muted-foreground'>{e.contract.replace('DIGIT', '')}</td>
                          <td className='p-2 font-mono text-right text-[9px]'>
                            {e.market === 'VH' ? <span className='text-indigo-400'>FAKE</span> : e.market === 'SYSTEM' ? <span className='text-orange-500'>SYS</span> : <span>${e.stake.toFixed(2)}</span>}
                            {e.martingaleStep > 0 && e.market !== 'VH' && <span className='text-yellow-400 ml-1 font-bold'>M{e.martingaleStep}</span>}
                          </td>
                          <td className='p-2 text-center font-mono text-[10px] font-bold'>{e.exitDigit}</td>
                          <td className='p-2 text-center'>
                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold ${e.result === 'Win' || e.result === 'V-Win' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : e.result === 'Loss' || e.result === 'V-Loss' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : e.result === 'Failed' ? 'bg-orange-500/20 text-orange-500 border border-orange-500/30' : 'bg-yellow-500/20 text-yellow-400 animate-pulse border border-yellow-500/30'}`}>
                              {e.result === 'Pending' ? '...' : e.result === 'V-Win' ? '✓' : e.result === 'V-Loss' ? '✗' : e.result === 'Failed' ? '⚠️' : e.result}
                            </span>
                          </td>
                          <td className={`p-2 font-mono text-right text-[9px] font-bold ${e.pnl > 0 ? 'text-green-400' : e.pnl < 0 ? 'text-red-400' : 'text-muted-foreground'}`}>
                            {e.result === 'Pending' || e.market === 'VH' || e.market === 'SYSTEM' || e.result === 'Failed' ? '-' : `${e.pnl > 0 ? '+' : ''}${e.pnl.toFixed(2)}`}
                          </td>
                          <td className='p-2 font-mono text-right text-[9px] text-muted-foreground'>
                            {e.market === 'VH' || e.market === 'SYSTEM' || e.result === 'Failed' ? '-' : `$${e.balance.toFixed(2)}`}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <TPSLNotificationPopup />
    </>
  );
}

/*
 * ═══════════════════════════════════════════════════════════════════════════════
 * CHANGES NEEDED IN YOUR RAMZFX2 CODE
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * 1. CREATE FILE
 *    src/pages/pro-scanner/ProScannerBot.tsx   ← this file
 *    (drop into the existing pro-scanner page folder, NOT the scanner folder)
 *
 * 2. src/pages/pro-scanner/pro-scanner.tsx  (OR  index.ts)
 *    Re-export ProScannerBot as the default for this tab:
 *
 *      // Option A — replace the existing pro-scanner.tsx content entirely:
 *      export { default } from './ProScannerBot';
 *
 *      // Option B — keep pro-scanner.tsx and import inside it:
 *      import ProScannerBot from './ProScannerBot';
 *      // then render <ProScannerBot /> inside the existing component
 *
 * 3. src/pages/main/main.tsx
 *    The PRO_SCANNER tab is already wired up with <ProScanner />.
 *    ProScanner is imported from '../pro-scanner'.
 *    No change needed here — as long as step 2 is done.
 *
 * 4. src/constants/bot-contents.ts
 *    PRO_SCANNER: 8  and  'id-pro-scanner' in TAB_IDS — already correct.
 *    No change needed.
 *
 * 5. src/components/shared/utils/config/config.ts
 *    proScanner feature flag is already `proScanner: true` for ramzfx.site.
 *    No change needed.
 *
 * 6. API FIXES ALREADY APPLIED IN THIS FILE:
 *    - buyContractForUi returns the buy object directly (not {buy:{...}}).
 *      contractId comes from buy.contract_id, not buy.buy.contract_id.
 *    - streamContractUntilSettled takes `onUpdate` (not `onContractUpdate`),
 *      requires a `source` string, and returns Promise<Record<string,any>>.
 *      No manual Promise wrapper is needed.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 */
