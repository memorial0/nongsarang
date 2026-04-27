import React, { useState, useRef, useEffect } from 'react';
import { 
  Sprout, Cpu, BarChart3, ArrowRight, Settings2, 
  FileText, ChevronRight, Database, Thermometer, Droplets, 
  CloudRain, Activity, AlertCircle, CheckCircle2, Zap, LayoutDashboard, 
  LogOut, RefreshCw, TrendingUp, ShieldCheck, AlertTriangle, Info, Check, 
  Star, ArrowUpCircle, ArrowDownCircle, MinusCircle, Calendar, MapPin, 
  ClipboardList, Play, Layers, Globe, Brain, Fingerprint, Waves
} from 'lucide-react';
import { 
  calibrateSensorData, CalibrationResult, analyzeAnomalies, Anomaly, 
  cropStandards, generatePrescription, PrescriptionResult, calculateScores
} from './utils/ai-engine';

// --- Types ---
type View = 'landing' | 'dashboard';
type Crop = '토마토' | '딸기' | '상추' | '오이' | '고추';

interface SensorData {
  n: number; p: number; k: number; ec: number; temp: number; moisture: number; rainfall: number; solar: number;
}

function App() {
  const [view, setView] = useState<View>('landing');
  const [selectedCrop, setSelectedCrop] = useState<Crop>('토마토');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<CalibrationResult | null>(null);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [prescription, setPrescription] = useState<PrescriptionResult | null>(null);
  const [scores, setScores] = useState({ health: 92, status: '적정' });
  const [copySuccess, setCopyStatus] = useState(false);
  const [isHighlighting, setIsHighlighting] = useState(false);

  const resultRef = useRef<HTMLDivElement>(null);
  const [sensorData, setSensorData] = useState<SensorData>({
    n: 150, p: 45, k: 210, ec: 2.1, temp: 24.5, moisture: 35, rainfall: 0, solar: 450
  });

  // --- Real-time Core Engine ---
  const computeAll = (data: SensorData, crop: Crop) => {
    // 1. AI 보정값 계산
    const cal = calibrateSensorData(data.n, data.p, data.k, data);
    // 2. 이상치 탐지
    const anom = analyzeAnomalies({ ...data });
    // 3. 시비 처방 문장 생성
    const pres = generatePrescription(crop, { n: cal.calibratedN, p: cal.calibratedP, k: cal.calibratedK }, data);
    // 4. 토양 건강 점수 산출
    const scrs = calculateScores(crop, { n: cal.calibratedN, p: cal.calibratedP, k: cal.calibratedK }, { ...data });

    setResult(cal);
    setAnomalies(anom);
    setPrescription(pres);
    setScores(scrs);
  };

  // 초기 상태 로드 및 데이터 변경 감지
  useEffect(() => {
    computeAll(sensorData, selectedCrop);
  }, [sensorData, selectedCrop]);

  const handleInputChange = (field: keyof SensorData, value: number) => {
    setSensorData(prev => ({ ...prev, [field]: value }));
  };

  const runAnalysisWithAnimation = () => {
    setIsAnalyzing(true);
    setShowResult(false);
    setIsHighlighting(false);

    const steps = ['Raw 데이터 로드...', '환경 노이즈 필터링...', 'AI Soft-Sensing 보정...', '작물별 처방 알고리즘 가동...'];
    steps.forEach((s, i) => setTimeout(() => setAnalysisStep(s), i * 400));
    
    setTimeout(() => {
      setIsAnalyzing(false);
      setShowResult(true);
      setIsHighlighting(true);
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth' });
        setTimeout(() => setIsHighlighting(false), 2000);
      }, 100);
    }, 1800);
  };

  const loadPreset = (type: 'normal' | 'salt' | 'lack') => {
    let p: SensorData;
    if (type === 'normal') p = { n: 105, p: 55, k: 135, ec: 1.2, temp: 22, moisture: 45, rainfall: 0, solar: 600 };
    else if (type === 'salt') p = { n: 380, p: 65, k: 410, ec: 3.2, temp: 28, moisture: 18, rainfall: 0, solar: 800 };
    else p = { n: 35, p: 15, k: 45, ec: 0.8, temp: 20, moisture: 38, rainfall: 0, solar: 300 };
    
    setSensorData(p);
    runAnalysisWithAnimation();
  };

  const copyLog = () => {
    const text = `[농사랑 AI 영농 통합 리포트]\n진단일시: ${new Date().toLocaleString()}\n작물: ${selectedCrop}\n토양건강점수: ${scores.health}\n처방결과: ${prescription?.summary}\n추천전략: ${prescription?.strategy}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopyStatus(true);
      setTimeout(() => setCopyStatus(false), 2000);
    });
  };

  // --- Sub Components ---
  const MiniBarChart = ({ label, raw, cal, max }: { label: string, raw: number, cal: number, max: number }) => (
    <div className="space-y-4">
      <div className="flex justify-between items-end"><span className="text-base font-black text-slate-700 uppercase italic">{label}</span><div className="flex gap-4 text-[10px] font-black uppercase tracking-widest"><span className="text-slate-400">Raw: {raw}</span><span className="text-emerald-600">AI Cal: {cal}</span></div></div>
      <div className="h-10 w-full bg-slate-100 rounded-2xl overflow-hidden flex flex-col justify-center px-2 gap-1.5 shadow-inner border border-slate-200/50">
        <div className="h-1.5 bg-slate-300 rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, (raw / max) * 100)}%` }} />
        <div className="h-1.5 bg-emerald-500 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(16,185,129,0.4)]" style={{ width: `${Math.min(100, (cal / max) * 100)}%` }} />
      </div>
    </div>
  );

  if (view === 'landing') {
    return (
      <div className="min-h-screen bg-white font-sans selection:bg-emerald-100 selection:text-emerald-900">
        <nav className="fixed top-0 w-full bg-white/70 backdrop-blur-2xl border-b border-slate-100 z-50 h-20 flex items-center px-8 lg:px-12">
          <div className="max-w-7xl mx-auto flex justify-between w-full items-center">
            <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.scrollTo({top:0, behavior:'smooth'})}>
              <div className="bg-emerald-600 p-2 rounded-2xl shadow-xl shadow-emerald-200 group-hover:rotate-12 transition-all duration-500"><Sprout className="w-7 h-7 text-white" /></div>
              <span className="text-2xl font-black tracking-tighter text-emerald-900 uppercase">농사랑</span>
            </div>
            <button onClick={() => setView('dashboard')} className="bg-slate-900 hover:bg-emerald-700 text-white px-10 py-3 rounded-2xl text-sm font-black shadow-2xl active:scale-95 transition-all">DEMO START</button>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-8 lg:px-12 pt-60 pb-44 grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
          <div className="space-y-10 animate-fade-in">
            <div className="inline-flex items-center gap-3 px-5 py-2 bg-emerald-50 text-emerald-700 text-[12px] font-black uppercase tracking-[0.2em] rounded-full mb-4 border border-emerald-100 shadow-sm">AI 기반 정밀 농업 리포트</div>
            <h1 className="text-7xl lg:text-[100px] font-black text-slate-900 leading-[0.9] tracking-tighter uppercase italic drop-shadow-sm">토마토 정밀 시비<br /><span className="text-emerald-700 not-italic uppercase tracking-tighter">처방 결과 대시보드</span></h1>
            <p className="text-2xl text-slate-500 font-medium leading-relaxed max-w-xl italic">센서 Raw Data와 환경 정보를 AI로 보정하여<br />작물별 최적 시비 전략을 제안합니다.</p>
            <div className="flex gap-10 pt-6 border-t border-slate-200 font-black text-slate-400 text-xs uppercase tracking-widest">
              <div className="flex items-center gap-3 italic"><Calendar className="w-5 h-5 text-emerald-500" /> 2026. 4. 27.</div>
              <div className="flex items-center gap-3 italic"><MapPin className="w-5 h-5 text-emerald-500" /> Smart Farm A-01</div>
              <div className="flex items-center gap-3 italic"><Sprout className="w-5 h-5 text-emerald-500" /> Tomato</div>
            </div>
            <button onClick={() => setView('dashboard')} className="bg-emerald-600 hover:bg-emerald-700 text-white px-14 py-7 rounded-[32px] font-black text-2xl flex items-center justify-center gap-5 shadow-3xl active:scale-95 transition-all group">진단 결과 상세보기 <ArrowRight className="group-hover:translate-x-3 transition-transform" /></button>
          </div>

          <div className="bg-white p-16 rounded-[60px] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] border-2 border-slate-50 space-y-16 relative overflow-hidden animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="absolute top-0 right-0 p-12 opacity-5 rotate-12"><Brain className="w-80 h-80 text-emerald-950" /></div>
            <div className="text-center space-y-4">
              <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.4em] italic">Soil Health Score</p>
              <div className="text-[150px] font-black text-slate-900 leading-none tracking-tighter tabular-nums drop-shadow-xl">{scores.health}<span className="text-3xl font-bold text-slate-300 ml-4 uppercase italic">pts</span></div>
            </div>
            <div className="grid grid-cols-2 gap-10 pt-10 border-t-2 border-slate-50 relative z-10">
              <div className="text-center space-y-2 border-r-2 border-slate-50 group hover:scale-105 transition-transform"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">AI Calibration</p><p className="text-6xl font-black text-emerald-600 tracking-tighter tabular-nums">{result?.confidenceScore}%</p></div>
              <div className="text-center space-y-4 flex flex-col items-center justify-center"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Diagnosis Status</p><span className={`px-6 py-2.5 rounded-full text-base font-black uppercase border-2 shadow-lg tracking-widest ${scores.status === '적정' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>{scores.status}</span></div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900 font-sans pb-40 flex">
      {/* Sidebar */}
      <aside className="w-28 bg-slate-950 flex flex-col items-center py-12 gap-16 z-50 shadow-2xl">
        <div className="bg-emerald-600 p-4 rounded-[28px] shadow-2xl cursor-pointer active:scale-90 transition-all shadow-emerald-900/50" onClick={() => setView('landing')}><Sprout className="w-8 h-8 text-white" /></div>
        <div className="flex flex-col gap-10 text-slate-500">
          <div className="p-5 bg-white/10 text-white rounded-[22px] shadow-lg"><LayoutDashboard className="w-8 h-8" /></div>
          <div className="p-5 hover:text-emerald-400 transition-colors cursor-pointer"><Fingerprint className="w-8 h-8" /></div>
          <div className="p-5 hover:text-emerald-400 transition-colors cursor-pointer"><Database className="w-8 h-8" /></div>
        </div>
        <div onClick={() => setView('landing')} className="mt-auto p-5 text-slate-200 hover:text-rose-500 cursor-pointer transition-all"><LogOut className="w-8 h-8" /></div>
      </aside>

      <main className="flex-1 overflow-auto">
        <header className="h-28 bg-white/70 backdrop-blur-3xl border-b border-slate-100 flex items-center justify-between px-14 sticky top-0 z-40">
          <div className="flex items-center gap-8">
            <h2 className="font-black text-3xl text-slate-800 tracking-tighter uppercase italic">Agri-AI Control</h2>
            <div className="flex items-center gap-3 px-6 py-2 bg-emerald-50 text-emerald-700 rounded-2xl text-[11px] font-black border border-emerald-100 shadow-sm uppercase tracking-widest">
               <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.8)]" /> Intelligent Mode Active
            </div>
          </div>
          <div className="flex items-center gap-8 font-black">
             <div className="text-right"><p className="text-[11px] text-slate-400 uppercase tracking-[0.3em] leading-none mb-1 italic">Operator Alpha</p><p className="font-black text-lg text-slate-800 tracking-tight leading-none">KIM FARMER</p></div>
             <div className="w-14 h-14 bg-emerald-100 rounded-[20px] overflow-hidden border-2 border-white shadow-2xl"><img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="avatar" /></div>
          </div>
        </header>

        <div className="p-14 max-w-[1700px] mx-auto space-y-16">
          {/* Quick Demo Hub - High Impact */}
          <div className="bg-slate-900 rounded-[56px] p-12 text-white shadow-4xl relative overflow-hidden group border-[8px] border-slate-800">
             <div className="absolute top-[-100px] right-[-100px] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px] animate-pulse" />
             <div className="relative z-10 flex flex-col xl:flex-row items-center gap-14 text-center xl:text-left">
                <div className="shrink-0 border-l-8 border-emerald-500 pl-10">
                   <h4 className="text-sm font-black text-emerald-400 uppercase tracking-[0.5em] mb-4 italic">Scenario Hub</h4>
                   <p className="text-4xl font-black text-white tracking-tight leading-none uppercase tracking-tighter">발표 시나리오 즉시 시연</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
                  {[
                    { id: 'normal', label: '1. 정상 시연 (Normal)', color: 'from-emerald-500 to-emerald-600', icon: <CheckCircle2 className="w-10 h-10" />, desc: "최적화된 수확 모델링" },
                    { id: 'salt', label: '2. 염류 집적 (Salt Risk)', color: 'from-rose-500 to-rose-700', icon: <AlertTriangle className="w-10 h-10" />, desc: "고염류 위험 감지 및 조치" },
                    { id: 'lack', label: '3. 양분 부족 (Deficiency)', color: 'from-amber-500 to-orange-600', icon: <MinusCircle className="w-10 h-10" />, desc: "성분별 결핍 처방 전략" }
                  ].map(p => (
                    <button key={p.id} onClick={() => loadPreset(p.id as any)} className={`group flex flex-col items-center justify-center gap-5 py-10 px-12 bg-gradient-to-br ${p.color} text-white rounded-[48px] font-black shadow-4xl hover:scale-105 active:scale-95 transition-all duration-700 relative overflow-hidden`}>
                      <div className="absolute inset-0 bg-white/5 group-hover:bg-white/10 transition-colors" />
                      <div className="p-4 bg-white/20 rounded-[24px] shadow-2xl relative z-10 group-hover:rotate-12 transition-transform">{p.icon}</div>
                      <div className="relative z-10">
                        <p className="text-2xl uppercase tracking-tighter leading-none mb-2">{p.label}</p>
                        <p className="text-[10px] opacity-70 uppercase tracking-widest font-black">{p.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-14 items-start">
            {/* Input Terminal */}
            <div className="lg:col-span-8 bg-white p-16 rounded-[72px] shadow-4xl border border-slate-100 space-y-20 relative overflow-hidden group">
              {isAnalyzing && (
                <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-xl rounded-[72px] flex flex-col items-center justify-center animate-in fade-in duration-500 text-center px-12">
                   <div className="relative w-48 h-48 mb-16">
                      <div className="absolute inset-0 border-[12px] border-slate-50 rounded-full" />
                      <div className="absolute inset-0 border-[12px] border-emerald-600 rounded-full border-t-transparent animate-spin" />
                      <Cpu className="absolute inset-0 m-auto w-16 h-16 text-emerald-600 animate-pulse" />
                   </div>
                   <p className="text-5xl font-black text-slate-900 tracking-tighter uppercase italic animate-pulse mb-4 leading-none">{analysisStep}</p>
                   <p className="text-emerald-500 font-black uppercase tracking-[0.6em] text-[12px]">Cloud Engine Processing Live Stream</p>
                </div>
              )}
              
              <div className="flex justify-between items-center flex-col md:flex-row gap-8 text-center md:text-left">
                 <h3 className="text-4xl font-black text-slate-900 tracking-tighter flex items-center gap-6 uppercase italic leading-none"><Settings2 className="text-emerald-600 w-12 h-12" /> Sensor Terminal</h3>
                 <div className="px-6 py-2.5 bg-slate-950 text-white rounded-2xl text-[12px] font-black tracking-[0.4em] shadow-2xl shadow-emerald-950/20 italic">REAL-TIME SYNC</div>
              </div>

              <div className="space-y-10 pt-4">
                <label className="text-xs font-black text-slate-400 uppercase tracking-[0.5em] ml-6 flex items-center justify-center md:justify-start gap-4 italic leading-none border-b-2 border-slate-50 pb-6 w-fit mx-auto md:mx-0">Target Crop Algorithm <ChevronRight className="w-5 h-5 text-emerald-500" /></label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-6 px-2">
                  {(['토마토', '딸기', '상추', '오이', '고추'] as Crop[]).map(crop => (
                    <button key={crop} onClick={() => handleCropChange(crop)} className={`py-8 rounded-[40px] text-2xl font-black border-4 transition-all duration-700 shadow-2xl ${selectedCrop === crop ? 'bg-emerald-600 border-emerald-600 text-white scale-[1.12] shadow-emerald-200' : 'bg-white border-slate-50 text-slate-200 hover:border-emerald-100 hover:text-emerald-600'}`}>{crop}</button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-32 pt-10 text-center md:text-left">
                <div className="space-y-16">
                  <h4 className="text-[12px] font-black text-emerald-600 uppercase tracking-[0.6em] flex items-center gap-6 bg-emerald-50 w-fit px-8 py-3 rounded-full border border-emerald-100 mx-auto md:mx-0 shadow-inner">Nutrient Flux</h4>
                  {['n', 'p', 'k'].map(id => (
                    <div key={id} className="space-y-8 px-4 group/item">
                      <div className="flex justify-between items-end px-2"><span className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">{id} DATA</span><span className="text-6xl font-black text-emerald-600 tabular-nums leading-none tracking-tighter drop-shadow-sm">{sensorData[id as keyof SensorData]}</span></div>
                      <input type="range" min="0" max="500" value={sensorData[id as keyof SensorData]} onChange={(e) => handleInputChange(id as keyof SensorData, Number(e.target.value))} className="w-full h-4 bg-slate-100 rounded-full appearance-none cursor-pointer accent-emerald-600 shadow-inner group-hover/item:scale-y-125 transition-transform" />
                    </div>
                  ))}
                </div>
                <div className="space-y-12">
                  <h4 className="text-[12px] font-black text-blue-600 uppercase tracking-[0.6em] flex items-center gap-6 bg-blue-50 w-fit px-8 py-3 rounded-full border border-blue-100 mx-auto md:mx-0 shadow-inner">Env Feedback</h4>
                  <div className="grid grid-cols-1 gap-8">
                    {[
                      { id: 'ec', label: 'EC (dS/m)', icon: <Zap />, color: 'emerald' },
                      { id: 'moisture', label: 'Moisture (%)', icon: <Droplets />, color: 'blue' },
                      { id: 'temp', label: 'Temperature (°C)', icon: <Thermometer />, color: 'orange' },
                      { id: 'rainfall', label: 'Rainfall (mm)', icon: <CloudRain />, color: 'slate' }
                    ].map(item => (
                      <div key={item.id} className="flex items-center gap-10 p-8 bg-slate-50/50 rounded-[48px] border-2 border-slate-100 hover:bg-white hover:shadow-4xl transition-all duration-700 group/env shadow-inner">
                        <div className={`p-5 bg-white rounded-[32px] text-${item.color}-500 shadow-2xl group-hover/env:scale-110 group-hover/env:rotate-12 transition-all`}>{item.icon}</div>
                        <div className="flex-1 text-[12px] font-black text-slate-400 uppercase tracking-widest">{item.label}</div>
                        <input type="number" value={sensorData[item.id as keyof SensorData]} onChange={(e) => handleInputChange(item.id as keyof SensorData, Number(e.target.value))} className="w-32 bg-white border-4 border-slate-100 rounded-[32px] px-8 py-5 text-right font-black text-3xl text-slate-800 outline-none focus:border-emerald-500 transition-all shadow-inner tabular-nums tracking-tighter" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <button onClick={runAnalysisWithAnimation} disabled={isAnalyzing} className="w-full py-12 bg-slate-950 hover:bg-emerald-700 text-white rounded-[48px] font-black text-5xl flex justify-center items-center gap-10 shadow-6xl active:scale-95 transition-all duration-700 uppercase tracking-tighter italic">
                <Cpu className="w-16 h-16" /> Generate Insight
              </button>
            </div>
            
            {/* Control Side Status */}
            <div className="lg:col-span-4 space-y-10 flex flex-col h-full">
              <div className="bg-white p-14 rounded-[72px] shadow-4xl border-2 border-slate-50 relative overflow-hidden flex-1 group">
                 <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-125 transition-transform duration-1000 rotate-45"><Activity className="w-[600px] h-[600px] text-emerald-950" /></div>
                 <h3 className="text-3xl font-black mb-16 flex items-center gap-6 uppercase tracking-tighter italic border-b-4 border-slate-50 pb-10"><Database className="text-emerald-600 w-12 h-12" /> System Live</h3>
                 <div className="space-y-16 relative z-10 font-black">
                    <div className="flex justify-between items-center"><span className="text-[14px] text-slate-400 uppercase tracking-[0.4em]">Calibration Engine</span><span className="text-emerald-600 text-lg flex items-center gap-5 bg-emerald-50 px-8 py-3 rounded-3xl border-2 border-emerald-100 shadow-2xl"><div className="w-4 h-4 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_20px_rgba(16,185,129,1)]" /> ACTIVE</span></div>
                    <div className="flex justify-between items-center"><span className="text-[14px] text-slate-400 uppercase tracking-[0.4em]">Signal Integrity</span><span className="text-slate-900 text-lg uppercase flex items-center gap-5 italic leading-none"><Fingerprint className="w-8 h-8 text-emerald-600" /> SECURED</span></div>
                    <div className="flex justify-between items-center"><span className="text-[14px] text-slate-400 uppercase tracking-[0.4em]">Grid Location</span><span className="bg-slate-950 text-white px-10 py-3 rounded-3xl text-[14px] shadow-4xl uppercase tracking-[0.2em] font-mono border border-white/10">A-01 SMART FARM</span></div>
                 </div>
                 <div className="mt-32 p-14 bg-gradient-to-br from-emerald-950 via-slate-900 to-black rounded-[56px] text-white shadow-6xl border-4 border-white/5 relative group/card overflow-hidden text-center xl:text-left transition-all hover:scale-[1.02]">
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/20 to-transparent pointer-events-none opacity-40" />
                    <div className="flex items-center justify-center xl:justify-start gap-5 mb-10 relative z-10"><Brain className="text-emerald-400 w-10 h-10 shadow-2xl" /><span className="text-[13px] font-black text-emerald-400 uppercase tracking-[0.6em] italic">AI Neural Analysis</span></div>
                    <p className="text-2xl font-bold leading-loose opacity-90 italic relative z-10 border-l-4 border-emerald-500/40 pl-8">"현재 {selectedCrop}의 {new Date().toLocaleDateString()} 실시간 데이터를 성공적으로 수집했습니다. 보정 신뢰도 {result?.confidenceScore}% 기반 정밀 리포트를 생성 중입니다."</p>
                 </div>
              </div>
              <div className="bg-emerald-50 p-12 rounded-[56px] border-4 border-emerald-100 shadow-3xl shadow-emerald-950/10">
                <h4 className="font-black text-emerald-950 mb-6 flex items-center gap-5 text-2xl italic leading-none uppercase tracking-tighter"><Info className="w-8 h-8" /> Ag-Tech Core</h4>
                <p className="text-xl text-emerald-800/60 font-bold leading-[1.8] italic">"토양 내 수분 함량에 따른 전기적 저항 오차를 AI 알고리즘이 실시간 보정합니다. 보정된 수치는 {selectedCrop}의 표준 생육 곡선과 비교 분석됩니다."</p>
              </div>
            </div>
          </div>

          {/* Results Output Console */}
          {showResult && result && prescription && (
            <div ref={resultRef} className={`space-y-28 animate-in fade-in slide-in-from-bottom-32 duration-[1200ms] ${isHighlighting ? 'ring-[40px] ring-emerald-500/10 rounded-[120px] transition-all' : ''}`}>
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                 {/* Anomalies Dashboard */}
                 <div className="lg:col-span-12 bg-white rounded-[80px] border-8 border-slate-50 p-20 shadow-5xl group overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-10 opacity-5 -z-0"><Waves className="w-[1200px] h-[800px] text-slate-900" /></div>
                    <div className="flex justify-between items-center mb-20 flex-col xl:flex-row gap-12 text-center xl:text-left relative z-10">
                       <h4 className="text-6xl font-black flex items-center gap-12 tracking-tighter uppercase italic leading-none text-slate-900"><AlertTriangle className="text-rose-600 w-24 h-24 shadow-4xl animate-pulse" /> 이상치 탐지 <br />종합 리포트</h4>
                       <div className="px-14 py-5 bg-rose-50 text-rose-700 rounded-[40px] text-lg font-black border-4 border-rose-100 uppercase tracking-[0.5em] shadow-4xl italic shadow-rose-900/10 transition-all group-hover:scale-105">System Hazard Guard Active</div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10">
                      {anomalies.length > 0 ? anomalies.map((a, i) => (
                        <div key={i} className={`p-16 rounded-[72px] flex gap-14 border-8 ${a.type==='danger'?'bg-rose-50 border-rose-100 text-rose-950 shadow-rose-200':'bg-amber-50 border-amber-100 text-amber-950 shadow-amber-200'} shadow-4xl transition-all duration-700 hover:translate-y-[-10px] group/alert`}>
                          <div className={`p-10 rounded-[48px] bg-white shadow-4xl ${a.type==='danger'?'text-rose-600':'text-amber-600'} shrink-0 h-fit transform group-alert:rotate-6 transition-transform`}>{a.type==='danger'?<AlertCircle className="w-20 h-20" />:<AlertTriangle className="w-20 h-20" />}</div>
                          <div className="flex flex-col justify-center">
                            <p className="text-4xl font-black mb-6 uppercase tracking-tighter italic leading-none">{a.type==='danger'?'Danger Detected':'System Warning'}</p>
                            <p className="text-2xl font-bold leading-relaxed opacity-90 border-l-4 border-current pl-8">{a.message}</p>
                          </div>
                        </div>
                      )) : (
                        <div className="col-span-2 p-28 bg-emerald-50 border-8 border-emerald-100 text-emerald-950 rounded-[80px] flex items-center gap-24 shadow-6xl text-center md:text-left flex-col md:flex-row relative group/stable">
                          <div className="w-48 h-48 bg-white rounded-[64px] flex items-center justify-center text-emerald-600 shadow-5xl shrink-0 animate-bounce border-4 border-emerald-100"><Check className="w-24 h-24" /></div>
                          <div>
                             <p className="text-8xl font-black mb-8 italic tracking-tighter leading-none uppercase drop-shadow-2xl">Stable Soil</p>
                             <p className="text-4xl font-bold opacity-60 leading-relaxed max-w-5xl italic border-l-8 border-emerald-500 pl-14">"현재 시스템이 분석한 토양 데이터는 최적의 생육 곡선을 유지하고 있습니다. 위협 요소가 감지되지 않아 AI 정밀 보정 후 처방을 즉시 시행합니다."</p>
                          </div>
                        </div>
                      )}
                    </div>
                 </div>

                 {/* Advanced AI Calibration Analytics */}
                 <div className="lg:col-span-12 bg-white rounded-[100px] border-2 border-slate-50 shadow-6xl overflow-hidden relative group/cal">
                    <div className="bg-slate-950 px-24 py-32 text-white flex flex-col xl:flex-row justify-between items-center gap-32 relative overflow-hidden border-b-[40px] border-emerald-700">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/20 via-transparent to-transparent opacity-60" />
                      <div className="flex items-center gap-16 text-center md:text-left flex-col md:flex-row relative z-10">
                         <div className="w-56 h-56 bg-emerald-600 rounded-[72px] flex items-center justify-center shadow-[0_0_150px_rgba(16,185,129,0.6)] animate-pulse border-[8px] border-emerald-400/20 group-hover/cal:rotate-[360deg] transition-all duration-[2000ms]"><ShieldCheck className="w-28 h-28 text-white shadow-2xl" /></div>
                         <div className="space-y-8"><h3 className="text-8xl font-black tracking-tighter uppercase italic leading-[0.8]">AI Calibration <br />System Output</h3><p className="text-emerald-400 font-black uppercase tracking-[0.6em] text-3xl bg-white/5 w-fit px-12 py-4 rounded-[40px] border-2 border-white/10 mx-auto md:mx-0 shadow-5xl tracking-tighter leading-none italic">{result.calibrationMessage}</p></div>
                      </div>
                      <div className="bg-white/5 p-20 rounded-[80px] border-4 border-white/10 text-center min-w-[550px] backdrop-blur-3xl relative z-10 shadow-6xl group-hover/cal:scale-105 transition-all duration-1000 border-l-[24px] border-l-emerald-500">
                         <p className="text-[20px] font-black uppercase text-slate-500 mb-10 tracking-[1em] opacity-50 italic">AI System Reliability</p>
                         <p className="text-[180px] font-black text-emerald-400 tracking-tighter leading-none tabular-nums drop-shadow-[0_0_60px_rgba(52,211,153,0.5)]">{result.confidenceScore}<span className="text-6xl font-normal ml-8 text-slate-500 opacity-40 italic tracking-widest">%</span></p>
                      </div>
                    </div>
                    <div className="p-32 grid grid-cols-1 lg:grid-cols-2 gap-48">
                      <div className="space-y-40">
                        <div className="flex items-center justify-between border-b-[12px] border-slate-50 pb-16 flex-wrap gap-12 relative"><div className="absolute bottom-[-12px] left-0 w-48 h-[12px] bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,1)]" /><h4 className="text-6xl font-black text-slate-950 flex items-center gap-12 italic uppercase tracking-tighter drop-shadow-sm">Data Precision Map</h4><div className="flex gap-16 text-[16px] font-black uppercase tracking-[0.3em]"><div className="flex items-center gap-6 text-slate-300"><div className="w-8 h-8 bg-slate-200 rounded-full shadow-inner" /> Raw Input</div><div className="flex items-center gap-6 text-emerald-600"><div className="w-8 h-8 bg-emerald-600 rounded-full shadow-4xl animate-pulse" /> AI Refined</div></div></div>
                        <div className="space-y-40 text-center md:text-left pt-10">
                          <MiniBarChart label="질소 (Nitrogen / N)" raw={sensorData.n} cal={result.calibratedN} max={500} />
                          <MiniBarChart label="인산 (Phosphorus / P)" raw={sensorData.p} cal={result.calibratedP} max={200} />
                          <MiniBarChart label="칼륨 (Potassium / K)" raw={sensorData.k} cal={result.calibratedK} max={500} />
                        </div>
                      </div>
                      <div className="bg-[#FDFDFE] rounded-[120px] p-32 text-center flex flex-col justify-center items-center space-y-24 border-8 border-slate-50 shadow-inner relative overflow-hidden group/modeling transition-all hover:shadow-2xl">
                        <div className="w-72 h-72 bg-white rounded-[80px] shadow-7xl flex items-center justify-center text-emerald-600 transition-all duration-[1500ms] group-hover/modeling:scale-110 border-8 border-emerald-50 z-10 relative"><div className="absolute inset-0 bg-emerald-100/30 rounded-full blur-[80px] animate-pulse -z-10" /><Sprout className="w-40 h-40 shadow-2xl" /></div>
                        <div className="space-y-12 relative z-10"><h4 className="text-7xl font-black text-slate-950 tracking-tighter leading-[1.05] uppercase italic drop-shadow-sm">생육 정밀 모델링 <br />분석 최종 완료</h4><p className="text-4xl text-slate-500 font-bold opacity-50 italic leading-snug">"전국 표준 시비 DB와 실시간 <br />동기화된 처방 알고리즘 가동"</p></div>
                        <div className="flex gap-12 w-full relative z-10 text-center flex-col sm:flex-row">
                           <div className="flex-1 bg-white p-20 rounded-[64px] shadow-6xl border-4 border-slate-50 hover:border-emerald-300 hover:scale-[1.03] transition-all duration-700 group/score"><p className="text-[18px] font-black text-slate-400 mb-8 uppercase tracking-[0.5em] italic">Health Rating</p><p className="text-[110px] font-black text-emerald-600 tabular-nums leading-none tracking-tighter drop-shadow-2xl">{scores.health}<span className="text-4xl font-normal ml-5 opacity-30 italic font-serif uppercase">Pts</span></p></div>
                           <div className="flex-1 bg-white p-20 rounded-[64px] shadow-6xl border-4 border-slate-50 hover:border-blue-300 hover:scale-[1.03] transition-all duration-700 group/score"><p className="text-[18px] font-black text-slate-400 mb-8 uppercase tracking-[0.5em] italic">Matching Rate</p><p className="text-[110px] font-black text-blue-600 tabular-nums leading-none tracking-tighter drop-shadow-2xl">{scores.suitability}<span className="text-4xl font-normal ml-5 opacity-30 italic font-serif uppercase">%</span></p></div>
                        </div>
                      </div>
                    </div>
                 </div>

                 {/* The AI Prescription Master-Terminal */}
                 {showPrescription && prescription && (
                    <div className="lg:col-span-12 space-y-32 animate-in fade-in slide-in-from-bottom-40 duration-[1500ms] delay-700">
                       <div className="bg-white rounded-[140px] border-[20px] border-emerald-600/5 shadow-[0_80px_160px_-40px_rgba(6,78,59,0.2)] overflow-hidden relative group/ultimate">
                          <div className="bg-emerald-950 px-32 py-40 text-white relative overflow-hidden border-b-[40px] border-emerald-800 shadow-2xl">
                             <div className="absolute top-[-400px] right-[-400px] opacity-10 animate-spin-slow"><Star className="w-[1500px] h-[1200px] fill-emerald-500" /></div>
                             <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-32">
                                <div className="text-center lg:text-left">
                                   <div className="inline-flex items-center gap-8 px-12 py-5 bg-white/10 rounded-[40px] text-[22px] font-black uppercase mb-20 border-2 border-white/10 tracking-[0.6em] shadow-7xl backdrop-blur-4xl italic"><Star className="w-10 h-10 fill-emerald-400 text-emerald-400 shadow-2xl" /> AI PRECISION SYSTEM v2.0</div>
                                   <h3 className="text-[110px] lg:text-[180px] font-black tracking-[1.02] tracking-tighter leading-[0.7] mb-24 italic uppercase text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-emerald-500 drop-shadow-5xl">{selectedCrop} 최적 처방전</h3>
                                   <div className="flex flex-col sm:flex-row items-center gap-20 opacity-80 border-l-[12px] border-emerald-500/50 pl-20 transition-all hover:border-emerald-400">
                                      <p className="text-4xl font-black flex items-center gap-10 text-emerald-100 uppercase tracking-[0.2em] italic leading-none uppercase tracking-tighter"><Calendar className="w-16 h-16 text-emerald-400" /> {new Date().toLocaleDateString('ko-KR')}</p>
                                      <div className="w-5 h-5 bg-emerald-500 rounded-full hidden sm:block shadow-[0_0_30px_rgba(16,185,129,1)] animate-ping" />
                                      <p className="text-4xl font-black flex items-center gap-10 text-emerald-100 uppercase tracking-[0.2em] italic leading-none uppercase tracking-tighter"><MapPin className="w-16 h-16 text-emerald-400" /> SMART GRID TERMINAL A-01</p>
                                   </div>
                                </div>
                                <div className="bg-gradient-to-br from-emerald-600/30 to-black backdrop-blur-4xl px-32 py-24 rounded-[120px] border-8 border-white/10 text-center shadow-7xl transform group-hover/ultimate:scale-105 transition-transform duration-1000 border-l-[24px] border-l-emerald-500 shadow-emerald-950/50">
                                      <p className="text-[20px] font-black text-emerald-300 mb-12 uppercase tracking-[1.2em] opacity-40 italic">Digital Health Grade</p>
                                      <div className="text-[240px] font-black tracking-tighter leading-none text-white drop-shadow-[0_0_80px_rgba(255,255,255,0.3)] tabular-nums">{scores.health}<span className="text-6xl font-normal opacity-20 ml-12 uppercase italic tracking-[0.2em] font-serif">PTS</span></div>
                                </div>
                             </div>
                          </div>

                          <div className="p-32 space-y-48">
                             {/* NPK Macro Analytics Cards */}
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-20">
                                {['n', 'p', 'k'].map((nut) => {
                                  const standard = cropStandards[selectedCrop][nut];
                                  const calVal = nut === 'n' ? result.calibratedN : nut === 'p' ? result.calibratedP : result.calibratedK;
                                  const status = getNutrientStatus(calVal, standard.min, standard.max);
                                  return (
                                    <div key={nut} className={`${status.bg} border-[8px] ${status.color.replace('text', 'border')} rounded-[100px] p-24 shadow-6xl transition-all duration-1000 hover:translate-y-[-20px] group/card text-center relative overflow-hidden`}>
                                      <div className="absolute top-[-50px] right-[-50px] p-20 opacity-5 group-hover/card:scale-150 transition-transform duration-1000 pointer-events-none">{React.cloneElement(status.icon as React.ReactElement, { className: 'w-72 h-72' })}</div>
                                      <div className="flex justify-between items-center mb-24 flex-col gap-14 z-10 relative">
                                         <div className={`p-14 rounded-[56px] bg-white shadow-5xl ${status.color} transform group-hover/card:rotate-[360deg] transition-all duration-[1200ms] border-4 border-slate-50`}>{React.cloneElement(status.icon as React.ReactElement, { className: 'w-24 h-24' })}</div>
                                         <span className={`px-14 py-5 rounded-[40px] text-2xl font-black bg-white shadow-5xl uppercase tracking-[0.6em] border-[6px] border-slate-50 ${status.color} italic shadow-emerald-500/10`}>{status.label}</span>
                                      </div>
                                      <h5 className="text-2xl font-black text-slate-400 mb-10 uppercase tracking-[0.8em] italic opacity-80 leading-none">Terminal-{nut.toUpperCase()} Output</h5>
                                      <div className="text-[160px] font-black text-slate-950 mb-24 tracking-tighter leading-none tabular-nums drop-shadow-xl relative z-10 group-hover/card:scale-110 transition-transform duration-700">{calVal}<span className="text-4xl font-normal text-slate-300 ml-10 uppercase italic opacity-40 font-serif">mg/kg</span></div>
                                      <div className="h-8 w-full bg-white rounded-full overflow-hidden mb-20 flex border-[6px] border-slate-50 shadow-inner p-1.5 relative z-10">
                                         <div className="h-full bg-slate-100 rounded-full" style={{ width: `${(standard.min / 500) * 100}%` }} />
                                         <div className="h-full bg-emerald-500 rounded-full shadow-[0_0_40px_rgba(16,185,129,1)] group-hover/card:animate-pulse transition-all duration-1000 relative" style={{ width: `${((standard.max - standard.min) / 500) * 100}%` }}>
                                            <div className="absolute inset-0 bg-white/20 animate-shimmer" />
                                         </div>
                                      </div>
                                      <div className={`text-4xl font-black flex items-center justify-center gap-10 ${status.color} italic uppercase tracking-tighter border-t-4 border-current pt-16 relative z-10 leading-none`}><div className={`w-8 h-8 rounded-full shadow-4xl animate-pulse ${status.color.replace('text', 'bg')}`} />{status.recommendation}</div>
                                    </div>
                                  );
                                })}
                             </div>

                             {/* The Deep Decision Logic Box */}
                             <div className="bg-slate-950 rounded-[120px] p-32 text-white relative overflow-hidden shadow-7xl border-[32px] border-slate-900 transition-all hover:border-emerald-950 duration-1000 group/box text-center xl:text-left">
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-emerald-600/10 to-transparent opacity-40" />
                                <div className="absolute top-0 right-0 p-32 opacity-5 group-hover/box:rotate-[360deg] transition-transform duration-[4000ms]"><Brain className="w-[1200px] h-[1200px]" /></div>
                                <div className="relative z-10 flex flex-col xl:flex-row gap-48 items-center xl:items-start">
                                   <div className="flex-1 space-y-32">
                                      <div className="space-y-24">
                                         <div className="flex items-center justify-center xl:justify-start gap-14 mb-24 transform hover:scale-105 transition-transform"><div className="w-36 h-36 bg-emerald-500/10 rounded-[56px] flex items-center justify-center text-emerald-400 border-8 border-emerald-500/10 shadow-6xl"><Cpu className="w-16 h-16 shadow-2xl" /></div><h4 className="text-4xl font-black text-emerald-400 uppercase tracking-[1.2em] italic leading-none border-b-4 border-emerald-500/20 pb-6">AI Decision Core v2.0</h4></div>
                                         <p className="text-[90px] lg:text-[110px] font-black leading-[0.85] italic mb-24 tracking-[1.02] tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-emerald-400 drop-shadow-5xl uppercase leading-none">"{prescription.summary}"</p>
                                         <p className="text-slate-500 text-5xl font-medium leading-[1.5] max-w-7xl opacity-80 border-l-[20px] border-emerald-500/30 pl-24 italic mx-auto xl:mx-0 font-serif leading-relaxed uppercase tracking-tighter transition-all hover:text-slate-300">{cropStandards[selectedCrop].description}</p>
                                      </div>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-40 pt-24">
                                         <div className="flex gap-20 flex-col md:flex-row items-center md:items-start group/strategy">
                                            <div className="w-48 h-48 bg-emerald-500/10 rounded-[64px] flex items-center justify-center text-emerald-400 border-8 border-emerald-500/10 shadow-7xl shrink-0 group-hover/strategy:bg-emerald-500/30 transition-all duration-700 shadow-emerald-500/30"><Zap className="w-20 h-20 shadow-2xl animate-pulse" /></div>
                                            <div className="space-y-12"><p className="text-[22px] font-black text-slate-500 uppercase tracking-[0.8em] mb-6 opacity-40 italic leading-none">Strategic Protocol</p><p className="text-6xl font-black text-white leading-[1.1] tracking-tighter drop-shadow-4xl uppercase">{prescription.strategy}</p></div>
                                         </div>
                                         <div className="flex gap-20 flex-col md:flex-row items-center md:items-start group/cycle">
                                            <div className="w-48 h-48 bg-blue-500/10 rounded-[64px] flex items-center justify-center text-blue-400 border-8 border-blue-500/10 shadow-7xl shrink-0 group-hover/cycle:bg-blue-500/30 transition-all duration-700 shadow-blue-500/30"><RefreshCw className="w-20 h-20 shadow-2xl animate-spin-slow" /></div>
                                            <div className="space-y-12"><p className="text-[22px] font-black text-slate-500 uppercase tracking-[0.8em] mb-6 opacity-40 italic leading-none">System Reset Cycle</p><p className="text-[100px] font-black text-blue-400 tracking-tighter italic uppercase underline decoration-blue-500/40 decoration-[20px] underline-offset-[32px] drop-shadow-5xl leading-none">{prescription.nextDiagnosis}</p></div>
                                         </div>
                                      </div>
                                   </div>
                                   <div className="xl:w-[700px] bg-white/5 p-24 rounded-[100px] border-8 border-white/10 backdrop-blur-5xl space-y-24 shadow-7xl text-left relative overflow-hidden border-t-emerald-500/40 transform hover:scale-[1.01] transition-all">
                                      <div className="absolute top-[-200px] right-[-200px] w-96 h-96 bg-rose-500/10 rounded-full blur-[150px] animate-pulse" />
                                      <p className="text-[22px] font-black text-slate-400 uppercase tracking-[1em] flex items-center gap-10 border-b-4 border-white/5 pb-16 italic leading-none uppercase"><AlertTriangle className="text-rose-600 w-16 h-16 shadow-[0_0_50px_rgba(244,63,94,0.8)] animate-pulse" /> Critical Risk</p>
                                      <ul className="space-y-20 relative z-10 font-bold uppercase tracking-tighter">
                                         {prescription.precautions.map((p, i) => (
                                           <li key={i} className="text-4xl font-black text-slate-100 flex items-start gap-16 leading-tight transform hover:translate-x-6 transition-transform duration-700 uppercase tracking-tighter italic"><div className="w-10 h-10 bg-rose-600 rounded-full mt-4 shrink-0 shadow-[0_0_40px_rgba(244,63,94,1)] border-8 border-white/10 animate-pulse transition-all group-hover:scale-125" />{p}</li>
                                         ))}
                                      </ul>
                                   </div>
                                </div>
                             </div>

                             {/* Final Log Archive Terminal */}
                             <div className="bg-[#fcfdfe] rounded-[120px] border-[16px] border-slate-50 p-32 shadow-inner relative group/log overflow-hidden text-center xl:text-left shadow-6xl transform transition-all hover:bg-white">
                                <div className="absolute top-0 right-0 p-40 opacity-[0.05] group-hover/log:rotate-[25deg] transition-all duration-[3000ms] group-hover/log:scale-125"><ClipboardList className="w-[1000px] h-[1200px] text-slate-900" /></div>
                                <div className="flex flex-col xl:flex-row justify-between items-center mb-32 relative z-10 gap-24">
                                   <div className="flex items-center gap-20 flex-col xl:flex-row">
                                      <div className="p-12 bg-white rounded-[64px] shadow-7xl transform group-hover/log:scale-110 transition-transform duration-1000 border-4 border-slate-50 shrink-0 shadow-slate-200/50 relative"><div className="absolute inset-0 bg-emerald-500/10 rounded-full blur-2xl animate-pulse" /><FileText className="w-24 h-24 text-slate-400 shadow-2xl" /></div>
                                      <div className="space-y-8 text-center xl:text-left"><h4 className="text-9xl font-black tracking-tighter italic uppercase text-slate-950 drop-shadow-xl leading-none">Agri-Cloud Log</h4><p className="text-slate-400 text-4xl font-black uppercase tracking-[0.6em] opacity-80 leading-none italic transition-all hover:text-emerald-700">Digital Archive System 2026</p></div>
                                   </div>
                                   <button onClick={copyLog} className={`flex items-center gap-10 px-24 py-12 rounded-[64px] font-black text-5xl transition-all duration-1000 shadow-7xl shrink-0 uppercase tracking-[0.3em] border-[12px] group/copy shadow-emerald-950/20 ${copySuccess ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-400 animate-bounce' : 'bg-slate-950 text-white border-slate-900 hover:bg-black hover:border-emerald-900 active:scale-90'}`}>{copySuccess ? <><Check className="w-20 h-20" /> SYNCED</> : <><ClipboardCheck className="w-20 h-20 group-copy:rotate-12 transition-transform" /> Copy Archive</>}</button>
                                </div>
                                <div className="relative group/pre">
                                  <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-pre:opacity-100 transition-opacity duration-1000 rounded-[80px]" />
                                  <pre className="w-full bg-white p-32 rounded-[100px] border-8 border-slate-50 text-[32px] text-slate-900 font-mono leading-[2.8] whitespace-pre-wrap shadow-inner overflow-hidden transform hover:border-emerald-200 transition-all duration-1000 italic border-l-[80px] border-l-emerald-950 shadow-7xl tabular-nums tracking-tighter uppercase font-bold relative z-10">
                                     {`[농사랑 AI 영농 통합 리포트 - ARCHIVE 2026]\n------------------------------------------------------------\n▣ 진단 일시 : ${new Date().toLocaleString('ko-KR')}\n▣ 관리 구역 : PRECISION GRID AREA-A01 / FIELD-CORE\n▣ 작물 품종 : ${selectedCrop} (Hybrid National Strain)\n▣ AI 보정 신뢰 : Engine Reliability Grade ${result.confidenceScore}%\n▣ 최종 진단 : ${prescription.summary}\n▣ 전략적 처방 : ${prescription.strategy}\n▣ 주의 사항 : ${prescription.precautions.join(' / ')}\n------------------------------------------------------------\n* Report Hash: ${Math.random().toString(36).substring(7).toUpperCase()}\n* Generated by Nongsarang Ag-Tech Intelligence v2.0`}
                                  </pre>
                                </div>
                             </div>

                             <div className="flex flex-col lg:flex-row gap-20 justify-center pt-52 border-t-[20px] border-slate-50 border-dotted">
                                <button className="px-32 py-16 bg-white border-[10px] border-slate-100 rounded-[80px] font-black text-6xl text-slate-950 hover:bg-slate-50 hover:border-emerald-300 transition-all duration-700 flex items-center justify-center gap-16 shadow-7xl transform hover:translate-y-[-32px] uppercase tracking-tighter leading-none shadow-slate-200 font-serif italic"><MapPin className="w-24 h-24 text-emerald-600 shadow-4xl shadow-emerald-500/50" /> Area Sync</button>
                                <button className="px-32 py-16 bg-emerald-600 text-white rounded-[80px] font-black text-6xl hover:bg-emerald-700 transition-all duration-700 shadow-[0_80px_160px_-40px_rgba(16,185,129,0.8)] flex items-center justify-center gap-16 active:scale-95 transform hover:translate-y-[-32px] uppercase tracking-tighter leading-none shadow-emerald-400/40 font-serif italic"><Star className="w-24 h-24 fill-white shadow-7xl animate-pulse" /> Finalize Care</button>
                             </div>
                          </div>
                       </div>
                    </div>
                 )}
              </div>
            </div>
          )}
        </div>
    </div>
  );
}

const ArchitectureLayer = ({ title, items, icon, color }: { title: string, items: string[], icon: any, color: string }) => (
  <div className="bg-white p-12 rounded-[56px] border border-slate-100 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.05)] relative group hover:shadow-4xl hover:translate-y-[-20px] transition-all duration-700 flex flex-col items-center text-center">
    <div className={`w-24 h-24 rounded-[32px] bg-${color}-50 flex items-center justify-center text-${color}-600 mb-12 shadow-inner group-hover:rotate-[360deg] transition-all duration-1000 border-2 border-white`}>{React.cloneElement(icon as React.ReactElement, { className: 'w-12 h-12' })}</div>
    <h5 className="font-black text-slate-900 text-lg mb-8 uppercase tracking-[0.3em] italic leading-tight">{title}</h5>
    <ul className="space-y-6 w-full">
      {items.map((item, i) => (
        <li key={i} className="text-xs font-black text-slate-400 flex items-center justify-center gap-4">
          <div className={`w-2 h-2 rounded-full shadow-lg bg-${color}-500`} /> {item}
        </li>
      ))}
    </ul>
  </div>
);

export default App;
