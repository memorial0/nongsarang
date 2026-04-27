import React, { useState, useRef, useEffect } from 'react';
import { 
  Sprout, Cpu, BarChart3, ArrowRight, Settings2, 
  FileText, ChevronRight, Database, Thermometer, Droplets, 
  CloudRain, Activity, AlertCircle, CheckCircle2, Zap, LayoutDashboard, 
  LogOut, RefreshCw, TrendingUp, ShieldCheck, AlertTriangle, Info, Check, 
  Star, ArrowUpCircle, ArrowDownCircle, MinusCircle, Calendar, MapPin, 
  ClipboardList, Play, Layers, Globe, Search, Bell, Brain, Fingerprint, Waves
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

  // 실시간 엔진 가동 (상태 변경 시 자동 연산)
  const computeAll = (data: SensorData, crop: Crop) => {
    const cal = calibrateSensorData(data.n, data.p, data.k, data);
    const anom = analyzeAnomalies({ ...data });
    const pres = generatePrescription(crop, { n: cal.calibratedN, p: cal.calibratedP, k: cal.calibratedK }, data);
    const scrs = calculateScores(crop, { n: cal.calibratedN, p: cal.calibratedP, k: cal.calibratedK }, data);

    setResult(cal);
    setAnomalies(anom);
    setPrescription(pres);
    setScores(scrs);
  };

  useEffect(() => {
    computeAll(sensorData, selectedCrop);
  }, []);

  const handleInputChange = (field: keyof SensorData, value: number) => {
    const next = { ...sensorData, [field]: value };
    setSensorData(next);
    computeAll(next, selectedCrop);
  };

  const handleCropChange = (crop: Crop) => {
    setSelectedCrop(crop);
    computeAll(sensorData, crop);
  };

  const runAnalysisWithAnimation = () => {
    setIsAnalyzing(true);
    setShowResult(false);
    setIsHighlighting(false);

    const steps = ['Raw 데이터 로드...', '환경 오차 분석 중...', 'AI Calibration 적용...', '시비 처방 최적화 중...'];
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
    computeAll(p, selectedCrop);
    runAnalysisWithAnimation();
  };

  const copyLog = () => {
    const log = `[농사랑 영농리포트] 날짜:${new Date().toLocaleDateString()}, 작물:${selectedCrop}, 점수:${scores.health}, 처방:${prescription?.strategy}`;
    navigator.clipboard.writeText(log).then(() => {
      setCopyStatus(true);
      setTimeout(() => setCopyStatus(false), 2000);
    });
  };

  const MiniBarChart = ({ label, raw, cal, max }: { label: string, raw: number, cal: number, max: number }) => (
    <div className="space-y-4">
      <div className="flex justify-between items-end"><span className="text-base font-black text-slate-700">{label}</span><div className="flex gap-4 text-[10px] font-black uppercase"><span className="text-slate-400 font-bold">RAW: {raw}</span><span className="text-emerald-600 font-bold">CAL: {cal}</span></div></div>
      <div className="h-10 w-full bg-slate-100 rounded-2xl overflow-hidden flex flex-col justify-center px-2 gap-1.5 shadow-inner border border-slate-200/50">
        <div className="h-1.5 bg-slate-300 rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, (raw / max) * 100)}%` }} />
        <div className="h-1.5 bg-emerald-500 rounded-full transition-all duration-1000 shadow-[0_0_12px_rgba(16,185,129,0.4)]" style={{ width: `${Math.min(100, (cal / max) * 100)}%` }} />
      </div>
    </div>
  );

  if (view === 'landing') {
    return (
      <div className="min-h-screen bg-white font-sans selection:bg-emerald-100 selection:text-emerald-900">
        <nav className="fixed top-0 w-full bg-white/70 backdrop-blur-2xl border-b border-slate-100 z-50 h-20 flex items-center px-8 lg:px-12">
          <div className="max-w-7xl mx-auto flex justify-between w-full items-center">
            <div className="flex items-center gap-3 group cursor-pointer">
              <div className="bg-emerald-600 p-2 rounded-2xl shadow-xl"><Sprout className="w-7 h-7 text-white" /></div>
              <span className="text-2xl font-black tracking-tighter text-emerald-900 uppercase">농사랑</span>
            </div>
            <button onClick={() => setView('dashboard')} className="bg-slate-900 hover:bg-emerald-700 text-white px-10 py-3 rounded-2xl text-sm font-black shadow-2xl active:scale-95 transition-all">DEMO START</button>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-8 lg:px-12 pt-52 pb-44 grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
          <div className="space-y-10 animate-fade-in">
            <div className="inline-flex items-center gap-3 px-5 py-2 bg-emerald-50 text-emerald-700 text-[12px] font-black uppercase tracking-widest rounded-full border border-emerald-100 shadow-sm">AI 기반 정밀 농업 리포트</div>
            <h1 className="text-7xl lg:text-8xl font-black tracking-tighter mb-10 leading-[0.95] text-slate-900 italic">토마토 정밀 시비<br /><span className="text-emerald-700 not-italic">처방 리포트</span></h1>
            <p className="text-2xl text-slate-500 font-medium leading-relaxed max-w-xl">센서 Raw Data와 환경 정보를 AI로 보정하여<br />작물별 최적 시비 전략을 제안합니다.</p>
            <div className="flex gap-10 pt-6 border-t border-slate-200 font-black text-slate-400 text-xs uppercase tracking-widest">
              <div className="flex items-center gap-3"><Calendar className="w-5 h-5" /> 2026. 4. 27.</div>
              <div className="flex items-center gap-3"><MapPin className="w-5 h-5" /> Smart Farm A-01</div>
              <div className="flex items-center gap-3"><Sprout className="w-5 h-5" /> {selectedCrop}</div>
            </div>
            <button onClick={() => setView('dashboard')} className="bg-emerald-600 hover:bg-emerald-700 text-white px-14 py-7 rounded-[32px] font-black text-2xl flex items-center justify-center gap-5 shadow-3xl active:scale-95 transition-all group">진단 결과 상세보기 <ArrowRight className="group-hover:translate-x-3 transition-transform" /></button>
          </div>

          <div className="bg-white p-16 rounded-[60px] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] border border-slate-100 space-y-16 relative overflow-hidden animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="text-center space-y-4">
              <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Soil Health Score</p>
              <div className="text-[150px] font-black text-slate-900 leading-none tracking-tighter tabular-nums">{scores.health}<span className="text-3xl font-bold text-slate-300 ml-4 uppercase">pts</span></div>
            </div>
            <div className="grid grid-cols-2 gap-10 pt-10 border-t border-slate-100">
              <div className="text-center space-y-2 border-r border-slate-100"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Calibration Confidence</p><p className="text-6xl font-black text-emerald-600">{result?.confidenceScore}%</p></div>
              <div className="text-center space-y-4 flex flex-col items-center justify-center"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Diagnosis Status</p><span className={`px-6 py-2.5 rounded-full text-sm font-black uppercase border-2 ${scores.status === '적정' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>{scores.status}</span></div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900 font-sans pb-40 flex">
      <aside className="w-28 bg-slate-900 flex flex-col items-center py-12 gap-16 z-50 shadow-2xl">
        <div className="bg-emerald-600 p-4 rounded-[28px] shadow-2xl cursor-pointer" onClick={() => setView('landing')}><Sprout className="w-8 h-8 text-white" /></div>
        <div className="flex flex-col gap-10 text-slate-500">
          <div className="p-5 bg-white/10 text-white rounded-[22px] shadow-lg shadow-black/20"><LayoutDashboard className="w-8 h-8" /></div>
          <div className="p-5 hover:text-emerald-400 transition-colors cursor-pointer"><Fingerprint className="w-8 h-8" /></div>
          <div className="p-5 hover:text-emerald-400 transition-colors cursor-pointer"><Database className="w-8 h-8" /></div>
        </div>
        <div onClick={() => setView('landing')} className="mt-auto p-5 text-slate-600 hover:text-rose-500 cursor-pointer transition-all"><LogOut className="w-8 h-8" /></div>
      </aside>

      <main className="flex-1 overflow-auto pl-0">
        <header className="h-28 bg-white/70 backdrop-blur-3xl border-b border-slate-100 flex items-center justify-between px-14 sticky top-0 z-40">
          <div className="flex items-center gap-8">
            <h2 className="font-black text-3xl text-slate-800 tracking-tighter uppercase italic">Diagnosis Center</h2>
            <div className="flex items-center gap-3 px-5 py-2 bg-emerald-50 text-emerald-700 rounded-2xl text-[10px] font-black border border-emerald-100">
               <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.8)]" /> AI ENGINE ACTIVE
            </div>
          </div>
          <div className="flex items-center gap-8">
             <div className="text-right hidden xl:block"><p className="text-[11px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1">Master Operator</p><p className="font-black text-lg text-slate-800 tracking-tight">김농부 님</p></div>
             <div className="w-14 h-14 bg-emerald-100 rounded-[20px] overflow-hidden border-2 border-white shadow-2xl"><img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="avatar" /></div>
          </div>
        </header>

        <div className="p-14 max-w-[1700px] mx-auto space-y-16">
          {/* Quick Demo Hub */}
          <div className="bg-emerald-900 rounded-[56px] p-12 text-white shadow-4xl relative overflow-hidden group">
             <div className="absolute top-[-50px] right-[-50px] w-96 h-96 bg-emerald-500/20 rounded-full blur-[80px] group-hover:scale-110 transition-transform duration-1000" />
             <div className="relative z-10 flex flex-col xl:flex-row items-center gap-14">
                <div className="shrink-0 border-l-8 border-emerald-500 pl-8">
                   <h4 className="text-sm font-black text-emerald-400 uppercase tracking-[0.4em] mb-4">Demo Preset Hub</h4>
                   <p className="text-4xl font-black text-white tracking-tight">시나리오 즉시 실행</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                  {[
                    { id: 'normal', label: '1. 정상 상태 (Optimal)', color: 'from-emerald-500 to-emerald-600', icon: <CheckCircle2 className="w-8 h-8" /> },
                    { id: 'salt', label: '2. 염류 집적 (Warning)', color: 'from-rose-500 to-rose-700', icon: <AlertTriangle className="w-8 h-8" /> },
                    { id: 'lack', label: '3. 양분 부족 (Deficiency)', color: 'from-amber-500 to-orange-600', icon: <MinusCircle className="w-8 h-8" /> }
                  ].map(p => (
                    <button key={p.id} onClick={() => loadPreset(p.id as any)} className={`flex flex-col items-center justify-center gap-4 py-8 px-10 bg-gradient-to-br ${p.color} text-white rounded-[40px] font-black shadow-2xl hover:translate-y-[-10px] active:scale-95 transition-all duration-500`}>
                      <div className="p-3 bg-white/20 rounded-2xl">{p.icon}</div>
                      <p className="text-xl uppercase tracking-tighter">{p.label}</p>
                    </button>
                  ))}
                </div>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-14 items-start">
            <div className="lg:col-span-8 bg-white p-14 rounded-[64px] shadow-3xl border border-slate-100 space-y-16 relative">
              {isAnalyzing && (
                <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-md rounded-[64px] flex flex-col items-center justify-center animate-in fade-in duration-500 text-center px-10">
                   <div className="relative w-32 h-32 mb-12">
                      <div className="absolute inset-0 border-8 border-slate-50 rounded-full" />
                      <div className="absolute inset-0 border-8 border-emerald-500 rounded-full border-t-transparent animate-spin" />
                      <Cpu className="absolute inset-0 m-auto w-12 h-12 text-emerald-600" />
                   </div>
                   <p className="text-4xl font-black text-slate-800 mb-4 animate-pulse uppercase tracking-tighter">{analysisStep}</p>
                   <p className="text-emerald-500 font-black uppercase tracking-[0.4em] text-[10px]">Processing via Cloud AI Calibration Node</p>
                </div>
              )}
              
              <div className="space-y-8">
                <label className="text-xs font-black text-slate-400 uppercase tracking-[0.4em] ml-4 flex items-center gap-3 italic">Crop Selection Model <ChevronRight className="w-4 h-4 text-emerald-500" /></label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-5">
                  {(['토마토', '딸기', '상추', '오이', '고추'] as Crop[]).map(crop => (
                    <button key={crop} onClick={() => handleCropChange(crop)} className={`py-6 rounded-[32px] text-xl font-black border-4 transition-all duration-500 shadow-sm ${selectedCrop === crop ? 'bg-emerald-600 border-emerald-600 text-white shadow-2xl scale-[1.08]' : 'bg-white border-slate-50 text-slate-300 hover:text-emerald-600'}`}>{crop}</button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-24 pt-4">
                <div className="space-y-12">
                  <h4 className="text-[12px] font-black text-emerald-600 uppercase tracking-[0.5em] flex items-center gap-4 bg-emerald-50 w-fit px-6 py-2 rounded-full border border-emerald-100 mx-auto md:mx-0 font-mono tracking-tighter">Soil Nutrients (mg/kg)</h4>
                  {['n', 'p', 'k'].map(id => (
                    <div key={id} className="space-y-6 px-2">
                      <div className="flex justify-between items-end"><span className="text-2xl font-black text-slate-700 uppercase italic">{id} DATA</span><span className="text-5xl font-black text-emerald-600 tabular-nums">{sensorData[id as keyof SensorData]}</span></div>
                      <input type="range" min="0" max="500" value={sensorData[id as keyof SensorData]} onChange={(e) => handleInputChange(id as keyof SensorData, Number(e.target.value))} className="w-full h-3 bg-slate-100 rounded-full appearance-none cursor-pointer accent-emerald-600 shadow-inner" />
                    </div>
                  ))}
                </div>
                <div className="space-y-10">
                  <h4 className="text-[12px] font-black text-blue-600 uppercase tracking-[0.5em] flex items-center gap-4 bg-blue-50 w-fit px-6 py-2 rounded-full border border-blue-100 mx-auto md:mx-0 font-mono tracking-tighter">Environment Factors</h4>
                  <div className="grid grid-cols-1 gap-6">
                    {[
                      { id: 'ec', label: 'EC (dS/m)', icon: <Zap />, color: 'emerald' },
                      { id: 'moisture', label: '수분 (%)', icon: <Droplets />, color: 'blue' },
                      { id: 'temp', label: '온도 (°C)', icon: <Thermometer />, color: 'orange' },
                      { id: 'rainfall', label: '강우 (mm)', icon: <CloudRain />, color: 'slate' }
                    ].map(item => (
                      <div key={item.id} className="flex items-center gap-8 p-7 bg-slate-50/50 rounded-[40px] border border-slate-100 group hover:bg-white hover:shadow-2xl transition-all duration-500 shadow-inner">
                        <div className={`p-4 bg-white rounded-3xl text-${item.color}-500 shadow-md group-hover:scale-110 transition-transform`}>{item.icon}</div>
                        <div className="flex-1 text-[11px] font-black text-slate-400 uppercase tracking-widest">{item.label}</div>
                        <input type="number" value={sensorData[item.id as keyof SensorData]} onChange={(e) => handleInputChange(item.id as keyof SensorData, Number(e.target.value))} className="w-28 bg-white border-2 border-slate-100 rounded-[24px] px-6 py-4 text-right font-black text-2xl text-slate-800 outline-none focus:border-emerald-500 transition-all shadow-inner" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <button onClick={runManualAnalysisWithAnimation} disabled={isAnalyzing} className="w-full py-10 bg-slate-900 hover:bg-emerald-600 text-white rounded-[40px] font-black text-4xl flex justify-center items-center gap-8 shadow-5xl active:scale-95 transition-all duration-500 italic">
                <Cpu className="w-12 h-12" /> AI 보정 및 시비 처방 시작
              </button>
            </div>
            
            <div className="lg:col-span-4 flex flex-col gap-8">
              <div className="bg-white p-12 rounded-[56px] shadow-2xl border border-slate-50 relative overflow-hidden flex-1 group">
                 <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform duration-1000"><Activity className="w-80 h-80 text-emerald-900" /></div>
                 <h3 className="text-2xl font-black mb-12 flex items-center gap-6 uppercase tracking-tighter italic border-b-2 border-slate-50 pb-8"><Database className="text-emerald-600 w-10 h-10" /> System Live</h3>
                 <div className="space-y-12 relative z-10">
                    <div className="flex justify-between items-center font-black"><span className="text-[12px] text-slate-400 uppercase tracking-[0.4em]">Engine Status</span><span className="text-emerald-600 text-base flex items-center gap-4 bg-emerald-50 px-6 py-2 rounded-2xl border border-emerald-100 shadow-lg"><div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.8)]" /> ONLINE</span></div>
                    <div className="flex justify-between items-center font-black"><span className="text-[12px] text-slate-400 uppercase tracking-[0.4em]">Data Quality</span><span className="text-slate-800 text-base uppercase flex items-center gap-4">High Precision</span></div>
                    <div className="flex justify-between items-center font-black"><span className="text-[12px] text-slate-400 uppercase tracking-[0.4em]">Field Zone</span><span className="bg-slate-900 text-white px-8 py-3 rounded-3xl text-[10px] shadow-2xl uppercase tracking-widest font-mono">Smart Area-A01</span></div>
                 </div>
                 <div className="mt-24 p-12 bg-gradient-to-br from-emerald-900 via-slate-900 to-slate-950 rounded-[48px] text-white shadow-5xl border border-white/5 relative group/card overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/20 to-transparent pointer-events-none opacity-50" />
                    <div className="flex items-center gap-4 mb-8 relative z-10 font-black"><Brain className="text-emerald-400 w-8 h-8" /><span className="text-[11px] text-emerald-400 uppercase tracking-[0.5em]">AI Deep Intelligence</span></div>
                    <p className="text-xl font-bold leading-relaxed opacity-90 italic relative z-10">"현재 {selectedCrop}의 {new Date().toLocaleDateString()} 최적 시비 모델이 로드되었습니다. {result?.confidenceScore}%의 정밀 보정 신뢰도를 확보했습니다."</p>
                 </div>
              </div>
            </div>
          </div>

          {/* Analysis View Area */}
          {showResult && result && prescription && (
            <div ref={resultRef} className={`space-y-24 animate-in fade-in slide-in-from-bottom-32 duration-1000 ${isHighlighting ? 'ring-[30px] ring-emerald-500/10 rounded-[100px] transition-all' : ''}`}>
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-14">
                 {/* Anomalies Report */}
                 <div className="lg:col-span-12 bg-white rounded-[72px] border-4 border-slate-50 p-16 shadow-4xl group">
                    <div className="flex justify-between items-center mb-16 flex-col xl:flex-row gap-8 text-center xl:text-left">
                       <h4 className="text-5xl font-black flex items-center gap-10 tracking-tighter uppercase italic"><AlertTriangle className="text-rose-500 w-16 h-16 shadow-2xl" /> 이상치 탐지 결과 리포트</h4>
                       <div className="px-10 py-4 bg-rose-50 text-rose-600 rounded-[32px] text-xs font-black border-2 border-rose-100 uppercase tracking-widest shadow-xl">Critical Analysis Mode</div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      {anomalies.length > 0 ? anomalies.map((a, i) => (
                        <div key={i} className={`p-14 rounded-[56px] flex gap-10 border-4 ${a.type==='danger'?'bg-rose-50 border-rose-100 text-rose-900 shadow-rose-200':'bg-amber-50 border-amber-100 text-amber-900 shadow-amber-200'} shadow-2xl group/item relative overflow-hidden transition-all hover:scale-[1.03]`}>
                          <div className={`p-8 rounded-[40px] bg-white shadow-3xl ${a.type==='danger'?'text-rose-500':'text-amber-500'} shrink-0 z-10`}>{a.type==='danger'?<AlertCircle className="w-16 h-16" />:<AlertTriangle className="w-16 h-16" />}</div>
                          <div className="z-10 flex flex-col justify-center">
                            <p className="text-3xl font-black mb-4 uppercase tracking-tighter italic">{a.type==='danger'?'Danger Detected':'System Warning'}</p>
                            <p className="text-xl font-bold leading-relaxed opacity-80">{a.message}</p>
                          </div>
                        </div>
                      )) : (
                        <div className="col-span-2 p-24 bg-emerald-50 border-4 border-emerald-100 text-emerald-900 rounded-[64px] flex items-center gap-20 shadow-4xl text-center md:text-left flex-col md:flex-row shadow-inner relative overflow-hidden">
                          <div className="w-32 h-32 bg-white rounded-[48px] flex items-center justify-center text-emerald-600 shadow-4xl shrink-0 animate-bounce"><Check className="w-16 h-16" /></div>
                          <div><p className="text-6xl font-black mb-6 italic uppercase tracking-tighter text-emerald-950">Optimal Soil Stable</p><p className="text-3xl font-bold opacity-70 leading-relaxed text-emerald-800/60 max-w-4xl">현재 분석된 토양 환경에서 위협적인 이상 신호가 발견되지 않았습니다. 보정이 신뢰도 {result.confidenceScore}% 수준에서 완료되었습니다.</p></div>
                        </div>
                      )}
                    </div>
                 </div>

                 {/* Calibration Details */}
                 <div className="lg:col-span-12 bg-white rounded-[80px] border-2 border-slate-50 shadow-5xl overflow-hidden relative group">
                    <div className="bg-slate-900 px-20 py-24 text-white flex flex-col xl:flex-row justify-between items-center gap-24 relative overflow-hidden border-b-[32px] border-emerald-600">
                      <div className="flex items-center gap-14 text-center md:text-left flex-col md:flex-row relative z-10">
                         <div className="w-40 h-40 bg-emerald-600 rounded-[56px] flex items-center justify-center shadow-[0_0_120px_rgba(16,185,129,0.4)] animate-pulse border-[6px] border-emerald-400/20"><ShieldCheck className="w-24 h-24 text-white shadow-2xl" /></div>
                         <div className="space-y-6"><h3 className="text-7xl font-black tracking-tighter uppercase italic leading-none">AI Calibration <br />Analysis Result</h3><p className="text-emerald-400 font-black uppercase tracking-[0.5em] text-2xl bg-white/5 w-fit px-10 py-3 rounded-[32px] border border-white/10 mx-auto md:mx-0 shadow-2xl tracking-tighter">{result.calibrationMessage}</p></div>
                      </div>
                      <div className="bg-white/5 p-16 rounded-[72px] border-4 border-white/10 text-center min-w-[450px] backdrop-blur-3xl relative z-10 shadow-5xl group-hover:border-emerald-500/50 transition-all duration-1000 transform hover:scale-105">
                         <p className="text-[16px] font-black uppercase text-slate-500 mb-8 tracking-[0.8em] opacity-60 italic">AI Confidence Index</p>
                         <p className="text-[150px] font-black text-emerald-400 tracking-tighter leading-none tabular-nums drop-shadow-[0_0_50px_rgba(52,211,153,0.5)]">{result.confidenceScore}<span className="text-5xl font-normal ml-6 text-slate-500 opacity-40 italic">%</span></p>
                      </div>
                    </div>
                    <div className="p-24 grid grid-cols-1 lg:grid-cols-2 gap-48">
                      <div className="space-y-32">
                        <div className="flex items-center justify-between border-b-8 border-slate-50 pb-14 flex-wrap gap-10"><h4 className="text-5xl font-black text-slate-900 flex items-center gap-10 italic uppercase tracking-tighter">Data Precision Hub</h4><div className="flex gap-14 text-[14px] font-black uppercase tracking-[0.2em]"><div className="flex items-center gap-4 text-slate-300"><div className="w-6 h-6 bg-slate-200 rounded-full shadow-inner" /> Sensor Raw</div><div className="flex items-center gap-4 text-emerald-600"><div className="w-6 h-6 bg-emerald-600 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.5)] animate-pulse" /> AI Calibrated</div></div></div>
                        <div className="space-y-32 text-center md:text-left">
                          <MiniBarChart label="질소 (Nitrogen)" raw={sensorData.n} cal={result.calibratedN} max={500} />
                          <MiniBarChart label="인산 (Phosphorus)" raw={sensorData.p} cal={result.calibratedP} max={200} />
                          <MiniBarChart label="칼륨 (Potassium)" raw={sensorData.k} cal={result.calibratedK} max={500} />
                        </div>
                      </div>
                      <div className="bg-slate-50/70 rounded-[100px] p-24 text-center flex flex-col justify-center items-center space-y-20 border-4 border-white shadow-inner relative group/modeling overflow-hidden">
                        <div className="w-56 h-56 bg-white rounded-[72px] shadow-6xl flex items-center justify-center text-emerald-600 transition-all duration-1000 group-hover/modeling:scale-110 border-4 border-emerald-50 z-10"><Sprout className="w-32 h-32 shadow-2xl" /></div>
                        <div className="space-y-10 relative z-10"><h4 className="text-6xl font-black text-slate-900 tracking-tighter leading-tight uppercase italic drop-shadow-sm">{selectedCrop} 생육 모델링 <br />분석 최종 완료</h4><p className="text-3xl text-slate-500 font-bold opacity-50 italic">"데이터 보정과 처방 전략 알고리즘이 <br />매칭 알고리즘과 결합하여 완료되었습니다."</p></div>
                        <div className="flex gap-10 w-full relative z-10 text-center">
                           <div className="flex-1 bg-white p-14 rounded-[56px] shadow-4xl border-2 border-white hover:border-emerald-300 hover:-translate-y-4 transition-all duration-500 group/s"><p className="text-[14px] font-black text-slate-400 mb-6 uppercase tracking-[0.4em]">Health Score</p><p className="text-8xl font-black text-emerald-600 tabular-nums leading-none tracking-tighter group-hover/s:scale-110 transition-transform">{scores.health}<span className="text-3xl font-normal ml-3 opacity-30 italic">PTS</span></p></div>
                           <div className="flex-1 bg-white p-14 rounded-[56px] shadow-4xl border-2 border-white hover:border-blue-300 hover:-translate-y-4 transition-all duration-500 group/s"><p className="text-[14px] font-black text-slate-400 mb-6 uppercase tracking-[0.4em]">Matching</p><p className="text-8xl font-black text-blue-600 tabular-nums leading-none tracking-tighter group-hover/s:scale-110 transition-transform">{scores.suitability}<span className="text-3xl font-normal ml-3 opacity-30 italic">%</span></p></div>
                        </div>
                      </div>
                    </div>
                 </div>

                 {/* The Ultimate Prescription Card */}
                 {showPrescription && prescription && (
                    <div className="lg:col-span-12 space-y-20 animate-in fade-in slide-in-from-bottom-32 duration-1000 delay-500">
                       <div className="bg-white rounded-[120px] border-[16px] border-emerald-600/5 shadow-7xl overflow-hidden relative group/pres">
                          <div className="bg-emerald-950 px-24 py-32 text-white relative overflow-hidden border-b-[32px] border-emerald-900 shadow-inner">
                             <div className="absolute top-[-300px] right-[-300px] opacity-10 animate-spin-slow"><Star className="w-[1200px] h-[1200px] fill-emerald-400" /></div>
                             <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-24">
                                <div className="text-center lg:text-left">
                                   <div className="inline-flex items-center gap-6 px-10 py-4 bg-white/10 rounded-[32px] text-[18px] font-black uppercase mb-16 border border-white/10 tracking-[0.6em] shadow-5xl backdrop-blur-3xl italic"><Star className="w-8 h-8 fill-emerald-400 text-emerald-400 shadow-xl" /> AI PRECISION SYSTEM v2.0</div>
                                   <h3 className="text-8xl lg:text-[140px] font-black tracking-tighter leading-[0.8] mb-16 italic uppercase text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-emerald-500 drop-shadow-4xl">{selectedCrop} 처방 리포트</h3>
                                   <div className="flex flex-col sm:flex-row items-center gap-16 opacity-80 border-l-4 border-emerald-500/50 pl-12">
                                      <p className="text-3xl font-black flex items-center gap-8 text-emerald-100 uppercase tracking-widest italic leading-none uppercase tracking-tighter"><Calendar className="w-12 h-12 text-emerald-400" /> {new Date().toLocaleDateString('ko-KR')}</p>
                                      <div className="w-4 h-4 bg-emerald-500 rounded-full hidden sm:block shadow-[0_0_20px_rgba(16,185,129,1)] animate-ping" />
                                      <p className="text-3xl font-black flex items-center gap-8 text-emerald-100 uppercase tracking-widest italic leading-none uppercase tracking-tighter"><MapPin className="w-12 h-12 text-emerald-400" /> SMART GRID AREA-A01</p>
                                   </div>
                                </div>
                                <div className="bg-gradient-to-br from-emerald-600/30 to-slate-950/80 backdrop-blur-3xl px-24 py-20 rounded-[100px] border-4 border-white/10 text-center shadow-6xl transform group-hover/pres:scale-105 transition-transform duration-1000 border-l-[16px] border-l-emerald-500">
                                      <p className="text-[18px] font-black text-emerald-300 mb-8 uppercase tracking-[1em] opacity-40 italic">Digital Health</p>
                                      <div className="text-[180px] font-black tracking-tighter leading-none text-white drop-shadow-[0_0_60px_rgba(255,255,255,0.3)] tabular-nums">{scores.health}<span className="text-5xl font-normal opacity-20 ml-8 uppercase italic tracking-widest font-serif">PTS</span></div>
                                </div>
                             </div>
                          </div>

                          <div className="p-24 space-y-32">
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
                                {['n', 'p', 'k'].map((nut) => {
                                  const standard = cropStandards[selectedCrop][nut];
                                  const calVal = nut === 'n' ? result.calibratedN : nut === 'p' ? result.calibratedP : result.calibratedK;
                                  const status = getNutrientStatus(calVal, standard.min, standard.max);
                                  return (
                                    <div key={nut} className={`${status.bg} border-4 ${status.color.replace('text', 'border')} rounded-[80px] p-20 shadow-5xl transition-all duration-1000 hover:-translate-y-12 group/card text-center relative overflow-hidden`}>
                                      <div className="flex justify-between items-center mb-20 flex-col gap-10 z-10 relative">
                                         <div className={`p-10 rounded-[48px] bg-white shadow-4xl ${status.color} transform group-hover/card:rotate-12 transition-transform duration-700 border-2 border-slate-50`}>{React.cloneElement(status.icon as React.ReactElement, { className: 'w-20 h-20' })}</div>
                                         <span className={`px-12 py-4 rounded-full text-lg font-black bg-white shadow-4xl uppercase tracking-[0.4em] border-4 border-slate-50 ${status.color} italic shadow-emerald-500/10`}>{status.label}</span>
                                      </div>
                                      <h5 className="text-xl font-black text-slate-400 mb-6 uppercase tracking-[0.6em] italic opacity-80">{nut.toUpperCase()} ANALYTICS TERMINAL</h5>
                                      <div className="text-[130px] font-black text-slate-900 mb-20 tracking-tighter leading-none tabular-nums drop-shadow-sm z-10 relative">{calVal}<span className="text-4xl font-normal text-slate-300 ml-8 uppercase italic opacity-40">mg/kg</span></div>
                                      <div className="h-6 w-full bg-white rounded-full overflow-hidden mb-16 flex border-4 border-slate-50 shadow-inner p-1 z-10 relative">
                                         <div className="h-full bg-slate-100 rounded-full" style={{ width: `${(standard.min / 500) * 100}%` }} />
                                         <div className="h-full bg-emerald-500 rounded-full shadow-[0_0_25px_rgba(16,185,129,1)] group-hover/card:animate-pulse transition-all duration-1000" style={{ width: `${((standard.max - standard.min) / 500) * 100}%` }} />
                                      </div>
                                      <div className={`text-3xl font-black flex items-center justify-center gap-8 ${status.color} italic uppercase tracking-tighter border-t-2 border-current pt-10 z-10 relative`}><div className={`w-6 h-6 rounded-full shadow-2xl animate-pulse ${status.color.replace('text', 'bg')}`} />{status.recommendation}</div>
                                    </div>
                                  );
                                })}
                             </div>

                             <div className="bg-slate-900 rounded-[100px] p-32 text-white relative overflow-hidden shadow-7xl border-[24px] border-slate-800 transition-all hover:border-emerald-800 duration-1000 group/box text-center xl:text-left">
                                <div className="absolute top-0 right-0 p-24 opacity-5 group-hover/box:rotate-90 transition-transform duration-[2000ms]"><Brain className="w-[1000px] h-[1000px]" /></div>
                                <div className="relative z-10 flex flex-col xl:flex-row gap-48 items-center xl:items-start">
                                   <div className="flex-1 space-y-24">
                                      <div className="space-y-16">
                                         <div className="flex items-center justify-center xl:justify-start gap-10 mb-20 transform hover:scale-105 transition-transform"><div className="w-28 h-28 bg-emerald-500/20 rounded-[48px] flex items-center justify-center text-emerald-400 border-4 border-emerald-500/20 shadow-inner"><Cpu className="w-14 h-14 shadow-2xl" /></div><h4 className="text-3xl font-black text-emerald-400 uppercase tracking-[1em] italic">AI DECISION CORE v2.0</h4></div>
                                         <p className="text-[80px] lg:text-[94px] font-black leading-[0.95] italic mb-20 tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-emerald-400 drop-shadow-4xl">"{prescription.summary}"</p>
                                         <p className="text-slate-400 text-4xl font-medium leading-[1.6] max-w-6xl opacity-70 border-l-[12px] border-emerald-500/30 pl-20 italic mx-auto xl:mx-0">{cropStandards[selectedCrop].description}</p>
                                      </div>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-32 pt-16">
                                         <div className="flex gap-16 flex-col md:flex-row items-center md:items-start group/strategy">
                                            <div className="w-36 h-36 bg-emerald-500/10 rounded-[48px] flex items-center justify-center text-emerald-400 border-4 border-emerald-500/10 shadow-6xl shrink-0 group-hover/strategy:bg-emerald-500/30 transition-all duration-700 shadow-emerald-500/20"><Zap className="w-16 h-16 shadow-2xl animate-pulse" /></div>
                                            <div className="space-y-8"><p className="text-[18px] font-black text-slate-500 uppercase tracking-[0.6em] mb-4 opacity-50 italic">Strategic Advice</p><p className="text-4xl font-black text-white leading-tight tracking-tight drop-shadow-2xl">{prescription.strategy}</p></div>
                                         </div>
                                         <div className="flex gap-16 flex-col md:flex-row items-center md:items-start group/cycle">
                                            <div className="w-36 h-36 bg-blue-500/10 rounded-[48px] flex items-center justify-center text-blue-400 border-4 border-blue-500/10 shadow-6xl shrink-0 group-hover/cycle:bg-blue-500/30 transition-all duration-700 shadow-blue-500/20"><RefreshCw className="w-16 h-16 shadow-2xl animate-spin-slow" /></div>
                                            <div className="space-y-8"><p className="text-[18px] font-black text-slate-500 uppercase tracking-[0.6em] mb-4 opacity-50 italic">Next Analysis</p><p className="text-7xl font-black text-blue-400 tracking-tighter italic uppercase underline decoration-blue-500/40 decoration-[16px] underline-offset-[24px] drop-shadow-4xl uppercase leading-none">{prescription.nextDiagnosis}</p></div>
                                         </div>
                                      </div>
                                   </div>
                                   <div className="xl:w-[600px] bg-white/5 p-20 rounded-[80px] border-4 border-white/10 backdrop-blur-3xl space-y-20 shadow-7xl text-left relative overflow-hidden border-t-emerald-500/30">
                                      <p className="text-[18px] font-black text-slate-400 uppercase tracking-[0.8em] flex items-center gap-8 border-b-2 border-white/5 pb-12 italic"><AlertTriangle className="text-rose-500 w-12 h-12 shadow-[0_0_30px_rgba(244,63,94,0.8)] animate-pulse" /> Risk Protocol</p>
                                      <ul className="space-y-16 relative z-10 font-bold uppercase tracking-tighter">
                                         {prescription.precautions.map((p, i) => (
                                           <li key={i} className="text-3xl font-bold text-slate-100 flex items-start gap-12 leading-snug transform hover:translate-x-4 transition-transform duration-500"><div className="w-7 h-7 bg-rose-600 rounded-full mt-3 shrink-0 shadow-[0_0_30px_rgba(244,63,94,1)] border-4 border-white/20 animate-pulse" />{p}</li>
                                         ))}
                                      </ul>
                                   </div>
                                </div>
                             </div>

                             <div className="bg-[#fcfdfe] rounded-[100px] border-[12px] border-slate-50 p-24 shadow-inner relative group overflow-hidden text-center xl:text-left shadow-2xl">
                                <div className="absolute top-0 right-0 p-32 opacity-[0.04] group-hover:rotate-[20deg] transition-all duration-[2000ms]"><ClipboardList className="w-[800px] h-[1000px] text-slate-900" /></div>
                                <div className="flex flex-col xl:flex-row justify-between items-center mb-24 relative z-10 gap-20">
                                   <div className="flex items-center gap-16 flex-col xl:flex-row">
                                      <div className="p-10 bg-white rounded-[56px] shadow-6xl transform group-hover:scale-110 transition-transform duration-1000 border-2 border-slate-100 shrink-0 shadow-slate-200/50"><FileText className="w-20 h-20 text-slate-400 shadow-xl" /></div>
                                      <div className="space-y-6"><h4 className="text-7xl font-black tracking-tighter italic uppercase text-slate-900 drop-shadow-sm">Digital Farming Log</h4><p className="text-slate-400 text-3xl font-bold uppercase tracking-[0.5em] opacity-80 leading-none italic uppercase">분석 및 처방 리포트 실시간 디지털 아카이빙</p></div>
                                   </div>
                                   <button onClick={copyLog} className={`flex items-center gap-8 px-20 py-10 rounded-[48px] font-black text-4xl transition-all duration-700 shadow-7xl shrink-0 uppercase tracking-[0.2em] border-[8px] ${copySuccess ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-400/50 scale-95' : 'bg-slate-950 text-white border-slate-800 hover:bg-emerald-900 hover:border-emerald-800 active:scale-95'}`}>{copySuccess ? <><Check className="w-14 h-14" /> COPIED</> : <><ClipboardCheck className="w-14 h-14" /> Sync Cloud</>}</button>
                                </div>
                                <div className="relative group">
                                  <pre className="w-full bg-white p-24 rounded-[80px] border-8 border-slate-50 text-[26px] text-slate-800 font-mono leading-[2.6] whitespace-pre-wrap shadow-inner overflow-hidden transform hover:border-emerald-100 transition-all duration-1000 italic border-l-[60px] border-l-emerald-950 shadow-2xl tabular-nums tracking-tighter uppercase tracking-tight text-left">
                                     {`[농사랑 AI 영농 통합 리포트 - ARCHIVE 2026]\n--------------------------------------------------------\n▣ 진단 일시 : ${new Date().toLocaleString('ko-KR')}\n▣ 관리 구역 : SMART GRID AREA-A01 / FIELD-X2\n▣ 작물 품종 : ${selectedCrop} (Premium National Strain)\n▣ AI 보정 신뢰 : Cloud Engine Reliability ${result.confidenceScore}%\n▣ 최종 진단 : ${prescription.summary}\n▣ 전략적 처방 : ${prescription.strategy}\n▣ 정밀 가이드 : ${prescription.precautions.join(' / ')}\n--------------------------------------------------------\n* This report was generated by Nongsarang Precise Lab v2.0`}
                                  </pre>
                                </div>
                             </div>

                             <div className="flex flex-col lg:flex-row gap-16 justify-center pt-40 border-t-[12px] border-slate-50 border-dotted">
                                <button className="px-28 py-14 bg-white border-8 border-slate-100 rounded-[64px] font-black text-5xl text-slate-800 hover:bg-slate-50 hover:border-emerald-300 transition-all duration-700 flex items-center justify-center gap-12 shadow-6xl transform hover:translate-y-[-24px] uppercase tracking-tighter leading-none shadow-slate-200 font-mono uppercase"><MapPin className="w-20 h-20 text-emerald-600 shadow-2xl shadow-emerald-500/50" /> Cloud Sync</button>
                                <button className="px-28 py-14 bg-emerald-600 text-white rounded-[64px] font-black text-5xl hover:bg-emerald-700 transition-all duration-700 shadow-[0_60px_120px_-30px_rgba(16,185,129,0.8)] flex items-center justify-center gap-12 active:scale-95 transform hover:translate-y-[-24px] uppercase tracking-tighter leading-none shadow-emerald-400/30 font-mono uppercase"><Star className="w-20 h-20 fill-white shadow-4xl animate-pulse" /> Activate Care</button>
                             </div>
                          </div>
                       </div>
                    </div>
                 )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
