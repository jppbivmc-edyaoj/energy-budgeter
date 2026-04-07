import React, { useState, useEffect, useMemo } from 'react';
import { 
  Flame, 
  History, 
  TrendingDown, 
  ChefHat, 
  Plus, 
  Settings, 
  AlertTriangle, 
  Droplets,
  ArrowRight,
  Info,
  CheckCircle2,
  Trash2,
  LayoutDashboard,
  ClipboardCheck,
  Search,
  Zap,
  Target,
  ChevronRight,
  ChevronLeft,
  Download,
  Lightbulb
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { format } from 'date-fns';

import { cn, formatCurrency, formatNumber } from '@/src/lib/utils';
import { 
  HARDCODED_RECIPES, 
  calculateLPGConsumption, 
  Recipe,
  APPLIANCE_DATABASE,
  AUDIT_QUESTIONS,
  ELECTRICITY_PRICE_KWH,
  LPG_PRICE_PER_KG_DEFAULT,
  Appliance
} from '@/src/lib/constants';
import { getCustomRecipe, getEnergySavingTips, generateAuditReport } from '@/src/services/gemini';

interface ConsumptionRecord {
  id: string;
  date: string;
  dish: string;
  pax: number;
  lpgConsumed: number;
  cost: number;
}

type Tab = 'dashboard' | 'cook' | 'audit' | 'appliances';

export default function App() {
  // --- Navigation ---
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  // --- State ---
  const [lpgStock, setLpgStock] = useState<number>(8.2);
  const [lpgPrice, setLpgPrice] = useState<number>(LPG_PRICE_PER_KG_DEFAULT);
  const [history, setHistory] = useState<ConsumptionRecord[]>([]);
  const [dishInput, setDishInput] = useState('Nilagang Baka');
  const [paxInput, setPaxInput] = useState(8);
  const [currentRecipe, setCurrentRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [tips, setTips] = useState<string[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [manualStock, setManualStock] = useState('');

  // --- Audit State ---
  const [auditStep, setAuditStep] = useState(0);
  const [auditAnswers, setAuditAnswers] = useState<Record<string, string>>({});
  const [auditReport, setAuditReport] = useState<any>(null);
  const [isAuditing, setIsAuditing] = useState(false);

  // --- Goals State ---
  const [energyGoal, setEnergyGoal] = useState(500); // PHP per month goal
  const [currentMonthSpend, setCurrentMonthSpend] = useState(320);

  // --- Appliance State ---
  const [searchQuery, setSearchQuery] = useState('');
  const [compareList, setCompareList] = useState<Appliance[]>([]);
  const [isThinkingMode, setIsThinkingMode] = useState(false);
  const [aiInsights, setAiInsights] = useState<string | null>(null);

  // --- Initialization ---
  useEffect(() => {
    getEnergySavingTips().then(setTips);
    handleGenerateRecipe('Nilagang Baka', 8);
  }, []);

  // --- Logic ---
  const handleGenerateRecipe = async (dish: string, pax: number) => {
    setIsLoading(true);
    const lowerDish = dish.toLowerCase();
    let recipe: Recipe | null = null;
    const hardcodedKey = Object.keys(HARDCODED_RECIPES).find(k => lowerDish.includes(k));
    if (hardcodedKey) {
      recipe = HARDCODED_RECIPES[hardcodedKey](pax);
    } else {
      const custom = await getCustomRecipe(dish, pax);
      if (custom) {
        recipe = { ...custom, id: `custom-${Date.now()}`, pax };
      }
    }
    setCurrentRecipe(recipe);
    setIsLoading(false);
  };

  const handleCook = () => {
    if (!currentRecipe) return;
    const consumed = calculateLPGConsumption(currentRecipe.cookingMinutes, currentRecipe.basePowerKw);
    if (lpgStock < consumed) {
      alert("Insufficient LPG stock!");
      return;
    }
    const lpgCost = consumed * lpgPrice;
    const newRecord: ConsumptionRecord = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      dish: currentRecipe.name,
      pax: currentRecipe.pax,
      lpgConsumed: consumed,
      cost: currentRecipe.totalCost + lpgCost
    };
    setLpgStock(prev => Math.max(0, prev - consumed));
    setHistory(prev => [newRecord, ...prev]);
    setCurrentMonthSpend(prev => prev + lpgCost); 

    // Success feedback
    const toast = document.createElement('div');
    toast.className = "fixed bottom-8 left-1/2 -translate-x-1/2 bg-[#2D2B26] text-[#FFEFCF] px-6 py-3 rounded-full shadow-2xl z-50 flex items-center gap-2 animate-bounce";
    toast.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> Cooked ${currentRecipe.name}! ${consumed}kg LPG used.`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  const handleDeleteRecord = (id: string) => {
    const record = history.find(r => r.id === id);
    if (record) {
      setLpgStock(prev => prev + record.lpgConsumed);
      setHistory(prev => prev.filter(r => r.id !== id));
    }
  };

  const handleAuditSubmit = async () => {
    setIsAuditing(true);
    const report = await generateAuditReport(auditAnswers);
    setAuditReport(report);
    setIsAuditing(false);
  };

  // --- Computed ---
  const chartData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return format(d, 'MMM dd');
    }).reverse();
    return last7Days.map(day => {
      const dayRecords = history.filter(r => format(new Date(r.date), 'MMM dd') === day);
      const total = dayRecords.reduce((acc, curr) => acc + curr.lpgConsumed, 0);
      return { name: day, consumption: total };
    });
  }, [history]);

  const totalConsumed = history.reduce((acc, curr) => acc + curr.lpgConsumed, 0);
  const avgConsumption = history.length > 0 ? totalConsumed / history.length : 0;
  const daysRemaining = avgConsumption > 0 ? lpgStock / avgConsumption : Infinity;

  const filteredAppliances = APPLIANCE_DATABASE.filter(a => 
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    a.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pieData = [
    { name: 'Kitchen', value: 400, color: '#E67E22' },
    { name: 'HVAC', value: 300, color: '#2D2B26' },
    { name: 'Laundry', value: 200, color: '#B45F2B' },
    { name: 'Other', value: 100, color: '#6B2E00' },
  ];

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl md:text-6xl font-display font-black tracking-tighter text-[#B45F2B]">
            ENERGY <span className="text-[#6B2E00]">CRISIS</span> COMMAND
          </h1>
          <nav className="flex gap-4 mt-4">
            {(['dashboard', 'cook', 'audit', 'appliances'] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-4 py-2 rounded-xl font-bold text-sm transition-all flex items-center gap-2",
                  activeTab === tab 
                    ? "bg-[#E67E22] text-white shadow-lg" 
                    : "bg-white/50 text-[#5A3E2B] hover:bg-white"
                )}
              >
                {tab === 'dashboard' && <LayoutDashboard className="w-4 h-4" />}
                {tab === 'cook' && <Flame className="w-4 h-4" />}
                {tab === 'audit' && <ClipboardCheck className="w-4 h-4" />}
                {tab === 'appliances' && <Search className="w-4 h-4" />}
                {tab.toUpperCase()}
              </button>
            ))}
          </nav>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 bg-white/50 px-3 py-1.5 rounded-xl border border-black/5">
            <span className="text-[10px] font-bold uppercase opacity-60">Thinking Mode</span>
            <button 
              onClick={() => setIsThinkingMode(!isThinkingMode)}
              className={cn(
                "w-10 h-5 rounded-full transition-all relative",
                isThinkingMode ? "bg-[#E67E22]" : "bg-black/10"
              )}
            >
              <motion.div 
                animate={{ x: isThinkingMode ? 20 : 2 }}
                className="absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm"
              />
            </button>
          </div>
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="p-3 rounded-full bg-white/50 hover:bg-white transition-colors border border-black/5"
          >
            <Settings className="w-6 h-6 text-[#5A3E2B]" />
          </button>
          <div className="bg-[#2D2B26] text-[#FFEFCF] px-6 py-3 rounded-2xl flex items-center gap-3 shadow-xl">
            <Droplets className="w-5 h-5 text-[#E67E22]" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-widest opacity-60 font-mono">LPG Stock</span>
              <span className="text-xl font-mono font-bold">{formatNumber(lpgStock)} <span className="text-sm opacity-60">kg</span></span>
            </div>
          </div>
        </div>
      </header>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="glass-card p-8 relative z-50 space-y-8"
          >
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-display font-black flex items-center gap-2">
                <Settings className="w-6 h-6" /> SYSTEM CONFIGURATION
              </h3>
              <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-black/5 rounded-full"><Trash2 className="w-5 h-5" /></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="font-bold text-sm uppercase opacity-40">Inventory Management</h4>
                <div className="flex gap-4 items-end">
                  <div className="flex-1 space-y-2">
                    <label className="text-xs font-bold uppercase opacity-60">Manual LPG Stock (kg)</label>
                    <input 
                      type="number" 
                      value={manualStock}
                      onChange={(e) => setManualStock(e.target.value)}
                      placeholder="e.g. 11.0"
                      className="w-full bg-white border border-black/10 rounded-xl px-4 py-2 font-mono"
                    />
                  </div>
                  <button 
                    onClick={() => {
                      const val = parseFloat(manualStock);
                      if (!isNaN(val)) {
                        setLpgStock(val);
                        setManualStock('');
                      }
                    }}
                    className="btn-secondary"
                  >
                    UPDATE
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-bold text-sm uppercase opacity-40">Financial Goals</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase opacity-60">LPG Price / kg</label>
                    <input 
                      type="number" 
                      value={lpgPrice}
                      onChange={(e) => setLpgPrice(parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-black/10 rounded-xl px-4 py-2 font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase opacity-60">Monthly Budget</label>
                    <input 
                      type="number" 
                      value={energyGoal}
                      onChange={(e) => setEnergyGoal(parseInt(e.target.value) || 0)}
                      className="w-full bg-white border border-black/10 rounded-xl px-4 py-2 font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-black/5 flex justify-end gap-4">
              <button 
                onClick={() => {
                  setHistory([]);
                  setLpgStock(11);
                  setShowSettings(false);
                }}
                className="px-6 py-2 rounded-full border border-red-500/20 text-red-600 hover:bg-red-50 transition-colors font-bold text-sm"
              >
                RESET ALL DATA
              </button>
              <button onClick={() => setShowSettings(false)} className="btn-primary">SAVE CHANGES</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main>
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              {/* Real-time Monitoring */}
              <div className="lg:col-span-8 space-y-8">
                <section className="glass-card p-8">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-2xl font-display font-black text-[#5A3E2B] flex items-center gap-3">
                      <Zap className="w-6 h-6 text-[#E67E22]" /> REAL-TIME MONITORING
                    </h3>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 bg-white/50 px-3 py-1.5 rounded-xl border border-black/5">
                        <span className="text-[10px] font-bold uppercase opacity-60">Thinking Mode</span>
                        <button 
                          onClick={() => setIsThinkingMode(!isThinkingMode)}
                          className={cn(
                            "w-10 h-5 rounded-full transition-all relative",
                            isThinkingMode ? "bg-[#E67E22]" : "bg-black/10"
                          )}
                        >
                          <motion.div 
                            animate={{ x: isThinkingMode ? 20 : 2 }}
                            className="absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm"
                          />
                        </button>
                      </div>
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">LIVE</span>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isThinkingMode && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-8 overflow-hidden"
                      >
                        <div className="p-6 bg-[#2D2B26] text-[#FFEFCF] rounded-3xl border-0 relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Zap className="w-24 h-24" />
                          </div>
                          <h4 className="text-sm font-bold mb-4 flex items-center gap-2 text-[#E67E22]">
                            <motion.div 
                              animate={{ rotate: 360 }}
                              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                            >
                              <Settings className="w-4 h-4" />
                            </motion.div>
                            AI DEEP ANALYSIS IN PROGRESS...
                          </h4>
                          <p className="text-sm leading-relaxed opacity-90">
                            Based on your current LPG stock of <strong>{lpgStock}kg</strong> and average consumption of <strong>{avgConsumption.toFixed(2)}kg/meal</strong>, 
                            I recommend optimizing your cooking schedule. Your current monthly spend of <strong>₱{currentMonthSpend}</strong> is 
                            <strong>{((currentMonthSpend / energyGoal) * 100).toFixed(1)}%</strong> of your goal. 
                            <br /><br />
                            <span className="text-[#E67E22] font-bold">Pro-active Insight:</span> Switching to a pressure cooker for your next beef dish could save you approximately <strong>0.15kg</strong> of LPG, extending your stock by an extra day.
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="p-6 bg-[#F3F1E8] rounded-3xl border border-black/5">
                      <p className="text-xs font-bold opacity-50 uppercase mb-2">Days Remaining</p>
                      <p className={cn(
                        "text-4xl font-mono font-black",
                        daysRemaining < 5 ? "text-red-600" : "text-[#B45F2B]"
                      )}>
                        {daysRemaining === Infinity ? '∞' : Math.round(daysRemaining)}
                        <span className="text-lg ml-1">days</span>
                      </p>
                    </div>
                    <div className="p-6 bg-[#F3F1E8] rounded-3xl border border-black/5">
                      <p className="text-xs font-bold opacity-50 uppercase mb-2">Avg / Meal</p>
                      <p className="text-4xl font-mono font-black text-[#B45F2B]">
                        {formatNumber(avgConsumption)}
                        <span className="text-lg ml-1">kg</span>
                      </p>
                    </div>
                    <div className="p-6 bg-[#F3F1E8] rounded-3xl border border-black/5">
                      <p className="text-xs font-bold opacity-50 uppercase mb-2">Monthly Spend</p>
                      <p className="text-4xl font-mono font-black text-[#B45F2B]">₱{currentMonthSpend}</p>
                    </div>
                  </div>

                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorCons" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#E67E22" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#E67E22" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#14141410" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                        <YAxis hide />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                        <Area type="monotone" dataKey="consumption" stroke="#E67E22" strokeWidth={4} fill="url(#colorCons)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </section>

                <section className="glass-card p-8">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <Target className="w-5 h-5" /> ENERGY SAVING GOALS
                  </h3>
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-bold">Monthly Budget Goal</span>
                        <span className="text-sm font-mono font-bold">₱{currentMonthSpend} / ₱{energyGoal}</span>
                      </div>
                      <div className="w-full h-4 bg-black/5 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${(currentMonthSpend / energyGoal) * 100}%` }}
                          className={cn(
                            "h-full transition-all",
                            (currentMonthSpend / energyGoal) > 0.8 ? "bg-red-500" : "bg-[#E67E22]"
                          )}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-green-50 rounded-2xl border border-green-100 flex items-center gap-4">
                        <div className="p-2 bg-green-500 rounded-lg text-white"><CheckCircle2 className="w-5 h-5" /></div>
                        <div>
                          <p className="text-xs font-bold text-green-900">ON TRACK</p>
                          <p className="text-xs text-green-700">You are 12% below your target.</p>
                        </div>
                      </div>
                      <div className="p-4 bg-[#FEF7E0] rounded-2xl border border-[#E67E22]/20 flex items-center gap-4">
                        <div className="p-2 bg-[#E67E22] rounded-lg text-white"><Lightbulb className="w-5 h-5" /></div>
                        <div>
                          <p className="text-xs font-bold text-[#6B2E00]">TIP</p>
                          <p className="text-xs text-[#5A3E2B]">Reduce AC usage by 1hr to save ₱450/mo.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              {/* Sidebar: Breakdown */}
              <div className="lg:col-span-4 space-y-8">
                <section className="glass-card p-6">
                  <h3 className="font-bold mb-6 flex items-center gap-2">
                    <TrendingDown className="w-5 h-5" /> USAGE BREAKDOWN
                  </h3>
                  <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-3 mt-4">
                    {pieData.map((item, i) => (
                      <div key={i} className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="font-medium">{item.name}</span>
                        </div>
                        <span className="font-mono font-bold">{item.value} kWh</span>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="glass-card p-6 bg-[#2D2B26] text-[#FFEFCF] border-0">
                  <h3 className="font-bold mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-[#E67E22]" /> PEAK HOURS ALERT
                  </h3>
                  <p className="text-sm opacity-80 leading-relaxed">
                    Grid load is high between <strong>6:00 PM - 9:00 PM</strong>. 
                    Avoid using heavy appliances like washing machines or heaters during this time to reduce grid strain.
                  </p>
                </section>
              </div>
            </motion.div>
          )}

          {activeTab === 'cook' && (
            <motion.div 
              key="cook"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              <div className="lg:col-span-8 space-y-8">
                <section className="glass-card p-8">
                  <div className="flex flex-col md:flex-row gap-6 items-end">
                    <div className="flex-1 space-y-2">
                      <label className="text-xs font-bold uppercase text-[#5A3A22] flex items-center gap-2">
                        <ChefHat className="w-4 h-4" /> Dish Name (AI Accurate)
                      </label>
                      <input 
                        type="text" 
                        value={dishInput}
                        onChange={(e) => setDishInput(e.target.value)}
                        className="w-full bg-[#FFFEF7] border-2 border-[#E0CFB0] rounded-2xl px-6 py-3 text-lg font-medium focus:outline-none focus:border-[#E67E22] transition-colors"
                        placeholder="e.g. Nilagang Baka good for 8 pax"
                      />
                    </div>
                    <div className="w-full md:w-32 space-y-2">
                      <label className="text-xs font-bold uppercase text-[#5A3A22]">Pax</label>
                      <input 
                        type="number" 
                        value={paxInput}
                        onChange={(e) => setPaxInput(parseInt(e.target.value) || 1)}
                        className="w-full bg-[#FFFEF7] border-2 border-[#E0CFB0] rounded-2xl px-6 py-3 text-lg font-medium focus:outline-none focus:border-[#E67E22] transition-colors"
                      />
                    </div>
                    <button 
                      onClick={() => handleGenerateRecipe(dishInput, paxInput)}
                      disabled={isLoading}
                      className="btn-primary w-full md:w-auto flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isLoading ? (
                        <motion.div 
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                        >
                          <Plus className="w-5 h-5" />
                        </motion.div>
                      ) : (
                        <Plus className="w-5 h-5" />
                      )}
                      GENERATE
                    </button>
                  </div>
                </section>

                <AnimatePresence mode="wait">
                  {currentRecipe && (
                    <motion.div 
                      key={currentRecipe.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="grid grid-cols-1 md:grid-cols-2 gap-8"
                    >
                      {/* Ingredients Card */}
                      <div className="glass-card overflow-hidden flex flex-col">
                        <div className="bg-[#E67E22] p-4 text-white flex justify-between items-center">
                          <h3 className="font-bold flex items-center gap-2">
                            <ChefHat className="w-5 h-5" /> {currentRecipe.name.toUpperCase()}
                          </h3>
                          <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase">
                            {currentRecipe.pax} Pax
                          </span>
                        </div>
                        <div className="p-6 flex-1 space-y-4">
                          <div className="space-y-2">
                            {currentRecipe.ingredients.map((ing, i) => (
                              <div key={i} className="flex justify-between items-center py-2 border-b border-black/5 last:border-0">
                                <span className="text-sm font-medium">
                                  <span className="font-mono font-bold text-[#B45F2B]">{formatNumber(ing.qty, 1)}</span> {ing.unit} {ing.name}
                                </span>
                                <span className="text-xs font-mono text-black/40">{formatCurrency(ing.cost)}</span>
                              </div>
                            ))}
                          </div>
                          <div className="pt-4 border-t-2 border-dashed border-black/10 flex justify-between items-center">
                            <span className="font-bold text-[#5A3E2B]">TOTAL BUDGET</span>
                            <span className="text-2xl font-display font-black text-[#C0392B]">
                              {formatCurrency(currentRecipe.totalCost)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Instructions & Action */}
                      <div className="flex flex-col gap-8">
                        <div className="glass-card p-6 flex-1 bg-[#FEF7E0]/50 border-[#E67E22]/20">
                          <h3 className="font-bold mb-4 flex items-center gap-2 text-[#6B2E00]">
                            <Info className="w-5 h-5" /> COOKING STEPS
                          </h3>
                          <ol className="space-y-3">
                            {currentRecipe.instructions.map((step, i) => (
                              <li key={i} className="text-sm flex gap-3">
                                <span className="font-mono font-bold text-[#E67E22]">{i + 1}.</span>
                                <span className="text-[#5A3E2B] leading-relaxed">{step}</span>
                              </li>
                            ))}
                          </ol>
                        </div>

                        <div className="glass-card p-6 bg-[#2D2B26] text-[#FFEFCF] border-0">
                          <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-3">
                              <div className="p-3 bg-[#E67E22]/20 rounded-xl">
                                <Flame className="w-6 h-6 text-[#E67E22]" />
                              </div>
                              <div>
                                <p className="text-[10px] uppercase tracking-widest opacity-60 font-mono">LPG Consumption</p>
                                <p className="text-2xl font-mono font-bold">
                                  {formatNumber(calculateLPGConsumption(currentRecipe.cookingMinutes, currentRecipe.basePowerKw))} <span className="text-sm">kg</span>
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] uppercase tracking-widest opacity-60 font-mono">Est. Time</p>
                              <p className="text-xl font-mono font-bold">{currentRecipe.cookingMinutes} <span className="text-sm">min</span></p>
                            </div>
                          </div>
                          <button 
                            onClick={handleCook}
                            className="w-full bg-[#E67E22] hover:bg-[#BF5E0A] text-white font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-3 group"
                          >
                            LOG COOKING SESSION
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="lg:col-span-4 space-y-8">
                <section className="glass-card p-6">
                  <h3 className="font-bold mb-4 flex items-center gap-2 text-[#5A3E2B]">
                    <History className="w-5 h-5" /> RECENT COOKS
                  </h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                    {history.length === 0 ? (
                      <p className="text-center py-8 text-sm opacity-40 italic">No cooking history yet.</p>
                    ) : (
                      history.map((record) => (
                        <div key={record.id} className="group p-3 bg-white border border-black/5 rounded-xl flex justify-between items-center hover:border-[#E67E22]/30 transition-colors">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold">{record.dish}</span>
                            <span className="text-[10px] opacity-50 uppercase font-mono">{format(new Date(record.date), 'MMM dd, HH:mm')}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-xs font-mono font-bold text-[#B45F2B]">-{record.lpgConsumed}kg</p>
                              <p className="text-[10px] opacity-50">{formatCurrency(record.cost)}</p>
                            </div>
                            <button 
                              onClick={() => handleDeleteRecord(record.id)}
                              className="p-2 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </section>
                
                <section className="glass-card p-6 bg-[#2C3E2F] text-[#D4E6B0] border-0">
                  <h3 className="font-bold mb-4 flex items-center gap-2">
                    <TrendingDown className="w-5 h-5" /> CRISIS SURVIVAL TIPS
                  </h3>
                  <div className="space-y-4">
                    {tips.slice(0, 3).map((tip, i) => (
                      <div key={i} className="flex gap-3 items-start">
                        <CheckCircle2 className="w-4 h-4 shrink-0 mt-1 opacity-60" />
                        <p className="text-sm leading-relaxed">{tip}</p>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </motion.div>
          )}

          {activeTab === 'audit' && (
            <motion.div 
              key="audit"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-3xl mx-auto"
            >
              {!auditReport ? (
                <section className="glass-card p-8">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-2xl font-display font-black text-[#5A3E2B]">HOUSEHOLD ENERGY AUDIT</h3>
                    <span className="text-xs font-mono font-bold opacity-40">STEP {auditStep + 1} / {AUDIT_QUESTIONS.length}</span>
                  </div>

                  <div className="w-full h-2 bg-black/5 rounded-full mb-8 overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${((auditStep + 1) / AUDIT_QUESTIONS.length) * 100}%` }}
                      className="h-full bg-[#E67E22]"
                    />
                  </div>

                  <AnimatePresence mode="wait">
                    <motion.div 
                      key={auditStep}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-8"
                    >
                      <div className="space-y-4">
                        <span className="px-3 py-1 bg-[#FEF7E0] text-[#E67E22] text-[10px] font-bold rounded-full uppercase tracking-widest">
                          {AUDIT_QUESTIONS[auditStep].category}
                        </span>
                        <h4 className="text-xl font-bold text-[#5A3E2B]">{AUDIT_QUESTIONS[auditStep].question}</h4>
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        {AUDIT_QUESTIONS[auditStep].options.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => setAuditAnswers(prev => ({ ...prev, [AUDIT_QUESTIONS[auditStep].id]: opt.value }))}
                            className={cn(
                              "p-6 rounded-2xl border-2 transition-all text-left flex justify-between items-center group",
                              auditAnswers[AUDIT_QUESTIONS[auditStep].id] === opt.value
                                ? "border-[#E67E22] bg-[#FEF7E0]/50"
                                : "border-black/5 hover:border-black/10 bg-white"
                            )}
                          >
                            <span className="font-bold">{opt.label}</span>
                            <div className={cn(
                              "w-6 h-6 rounded-full border-2 flex items-center justify-center",
                              auditAnswers[AUDIT_QUESTIONS[auditStep].id] === opt.value
                                ? "border-[#E67E22] bg-[#E67E22]"
                                : "border-black/10"
                            )}>
                              {auditAnswers[AUDIT_QUESTIONS[auditStep].id] === opt.value && <CheckCircle2 className="w-4 h-4 text-white" />}
                            </div>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  </AnimatePresence>

                  <div className="flex justify-between mt-12">
                    <button 
                      disabled={auditStep === 0}
                      onClick={() => setAuditStep(prev => prev - 1)}
                      className="flex items-center gap-2 font-bold opacity-40 hover:opacity-100 disabled:opacity-10"
                    >
                      <ChevronLeft className="w-5 h-5" /> PREVIOUS
                    </button>
                    {auditStep === AUDIT_QUESTIONS.length - 1 ? (
                      <button 
                        onClick={handleAuditSubmit}
                        disabled={isAuditing || !auditAnswers[AUDIT_QUESTIONS[auditStep].id]}
                        className="btn-primary flex items-center gap-2"
                      >
                        {isAuditing ? "ANALYZING..." : "GENERATE REPORT"} <ArrowRight className="w-5 h-5" />
                      </button>
                    ) : (
                      <button 
                        disabled={!auditAnswers[AUDIT_QUESTIONS[auditStep].id]}
                        onClick={() => setAuditStep(prev => prev + 1)}
                        className="btn-primary flex items-center gap-2"
                      >
                        NEXT <ChevronRight className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </section>
              ) : (
                <section className="glass-card p-8 space-y-8">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-3xl font-display font-black text-[#B45F2B]">AUDIT REPORT</h3>
                      <p className="text-sm opacity-50 font-mono">{format(new Date(), 'MMMM dd, yyyy')}</p>
                    </div>
                    <button onClick={() => setAuditReport(null)} className="p-2 hover:bg-black/5 rounded-full"><Trash2 className="w-5 h-5" /></button>
                  </div>

                  <div className="p-6 bg-[#FEF7E0] rounded-3xl border border-[#E67E22]/20">
                    <p className="text-lg font-medium text-[#5A3E2B] leading-relaxed italic">"{auditReport.summary}"</p>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-bold uppercase text-xs tracking-widest opacity-40">Waste Areas Identified</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {auditReport.wasteAreas.map((area: any, i: number) => (
                        <div key={i} className="p-6 bg-white border border-black/5 rounded-3xl space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-bold">{area.area}</span>
                            <span className={cn(
                              "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                              area.severity === 'high' ? "bg-red-100 text-red-700" : 
                              area.severity === 'medium' ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"
                            )}>{area.severity}</span>
                          </div>
                          <p className="text-sm opacity-60 leading-relaxed">{area.explanation}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-bold uppercase text-xs tracking-widest opacity-40">Actionable Solutions</h4>
                    <div className="space-y-4">
                      {auditReport.solutions.map((sol: any, i: number) => (
                        <div key={i} className="p-6 border-2 border-dashed border-[#E67E22]/30 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                          <div className="space-y-1">
                            <p className="font-bold text-lg">{sol.title}</p>
                            <p className="text-sm opacity-60">{sol.description}</p>
                          </div>
                          <div className="bg-[#E67E22] text-white px-4 py-2 rounded-2xl font-mono font-bold text-sm shrink-0">
                            SAVE {sol.estSavings}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button className="w-full btn-secondary flex items-center justify-center gap-2">
                    <Download className="w-5 h-5" /> EXPORT PDF REPORT
                  </button>
                </section>
              )}
            </motion.div>
          )}

          {activeTab === 'appliances' && (
            <motion.div 
              key="appliances"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <section className="glass-card p-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                  <h3 className="text-2xl font-display font-black text-[#5A3E2B]">APPLIANCE DATABASE</h3>
                  <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-30" />
                    <input 
                      type="text" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search appliances or categories..."
                      className="w-full bg-[#F3F1E8] border-0 rounded-2xl pl-12 pr-6 py-3 focus:ring-2 focus:ring-[#E67E22] transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredAppliances.map((app) => (
                    <div key={app.id} className="p-6 bg-white border border-black/5 rounded-3xl space-y-4 hover:shadow-xl transition-all group">
                      <div className="flex justify-between items-start">
                        <span className="px-2 py-1 bg-[#FEF7E0] text-[#E67E22] text-[10px] font-bold rounded-md uppercase">{app.category}</span>
                        <button 
                          onClick={() => {
                            if (compareList.find(c => c.id === app.id)) {
                              setCompareList(prev => prev.filter(c => c.id !== app.id));
                            } else if (compareList.length < 3) {
                              setCompareList(prev => [...prev, app]);
                            }
                          }}
                          className={cn(
                            "p-2 rounded-full transition-colors",
                            compareList.find(c => c.id === app.id) ? "bg-[#E67E22] text-white" : "bg-black/5 hover:bg-black/10"
                          )}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <div>
                        <h4 className="font-bold text-lg leading-tight">{app.name}</h4>
                        <p className="text-xs opacity-40 mt-1">{app.description}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-black/5">
                        <div>
                          <p className="text-[10px] font-bold opacity-40 uppercase">Efficiency</p>
                          <p className="text-sm font-bold text-green-600">{app.efficiencyRating}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold opacity-40 uppercase">Annual Cost</p>
                          <p className="text-sm font-mono font-bold">{formatCurrency(app.annualKwh * ELECTRICITY_PRICE_KWH)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {compareList.length > 0 && (
                <motion.section 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card p-8 bg-[#2D2B26] text-[#FFEFCF] border-0"
                >
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-xl font-bold flex items-center gap-2"><TrendingDown className="w-5 h-5" /> COMPARISON TOOL</h3>
                    <button onClick={() => setCompareList([])} className="text-xs font-bold opacity-50 hover:opacity-100">CLEAR ALL</button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {compareList.map((app) => (
                      <div key={app.id} className="space-y-6 p-6 bg-white/5 rounded-3xl border border-white/10">
                        <h4 className="font-bold text-lg">{app.name}</h4>
                        <div className="space-y-4">
                          <div className="flex justify-between text-sm">
                            <span className="opacity-60">Annual Energy</span>
                            <span className="font-mono font-bold">{app.annualKwh} kWh</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="opacity-60">Typical Power</span>
                            <span className="font-mono font-bold">{app.typicalWattage} W</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="opacity-60">Est. Monthly Cost</span>
                            <span className="font-mono font-bold text-[#E67E22]">{formatCurrency((app.annualKwh / 12) * ELECTRICITY_PRICE_KWH)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {compareList.length < 3 && (
                      <div className="flex items-center justify-center p-8 border-2 border-dashed border-white/10 rounded-3xl opacity-30">
                        <p className="text-sm font-bold">Add up to 3 appliances to compare</p>
                      </div>
                    )}
                  </div>
                </motion.section>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="pt-8 border-t border-black/5 text-center">
        <p className="text-xs font-mono opacity-40 uppercase tracking-[0.2em]">
          Precision Energy Management System v2.1.0 // Household Resilience Unit
        </p>
      </footer>
    </div>
  );
}
