import React, { useState, useEffect, useRef } from 'react';
import { 
  Sprout, Cpu, ClipboardCheck, BarChart3, ArrowRight, Settings2, 
  LineChart, FileText, ChevronRight, Database, Thermometer, Droplets, 
  CloudRain, Sun, Activity, AlertCircle, CheckCircle2, Zap, LayoutDashboard, 
  LogOut, RefreshCw, TrendingUp, ShieldCheck, AlertTriangle, Info, Check, 
  Star, ArrowUpCircle, ArrowDownCircle, MinusCircle, Calendar, MapPin, 
  ClipboardList, Play, Layers, Globe, BrainCircuit, Server, Bell, Search,
  Radar, Fingerprint, Waves
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
  const [showPrescription, setShowPrescription] = useState(false);
  const [result, setResult] = useState<CalibrationResult | null>(null);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [prescription, setPrescription] = useState<PrescriptionResult | null>(null);
  const [scores, setScores] = useState({ health: 0, suitability: 0 });
  const [copySuccess, setCopyStatus] = useState(false);
  const [isHighlighting, setIsHighlighting] = useState(false);

  const resultRef = useRef<HTMLDivElement>(null);
  const prescriptionRef = useRef<HTMLDivElement>(null);
  const architectureRef = useRef<HTMLDivElement>(null);
  
  const [sensorData, setSensorData] = useState<SensorData>({
    n: 150, p: 45, k: 210, ec: 2.1, temp: 24.5, moisture: 35, rainfall: 0, solar: 450
  });

  const handleInputChange = (field: keyof SensorData, value: number) => {
    setSensorData(prev => ({ ...prev, [field]: value }));
  };

  const runAnalysis = (dataToUse: SensorData) => {
    setIsAnalyzing(true);
    setShowResult(false);
    setShowPrescription(false);
    setIsHighlighting(false);

    const steps = ['Raw 데이터 로드 중...', '환경 노이즈 필터링 중...', 'AI Calibration Engine 가동...', '처방 알고리즘 연산 중...'];
    steps.forEach((step, i) => {
      setTimeout(() => setAnalysisStep(step), i * 400);
    });
    
    setTimeout(() => {
      const calibration = calibrateSensorData(
        dataToUse.n, dataToUse.p, dataToUse.k,
        { ec: dataToUse.ec, temp: dataToUse.temp, moisture: dataToUse.moisture, rainfall: dataToUse.rainfall, solar: dataToUse.solar }
      );
      const detectedAnomalies = analyzeAnomalies({
        n: dataToUse.n, ec: dataToUse.ec, moisture: dataToUse.moisture, rainfall: dataToUse.rainfall
      });
      const pres = generatePrescription(
        selectedCrop,
        { n: calibration.calibratedN, p: calibration.calibratedP, k: calibration.calibratedK },
        { ec: dataToUse.ec, moisture: dataToUse.moisture, rainfall: dataToUse.rainfall }
      );
      const scrs = calculateScores(
        selectedCrop,
        { n: calibration.calibratedN, p: calibration.calibratedP, k: calibration.calibratedK },
        { ec: dataToUse.ec, moisture: dataToUse.moisture, temp: dataToUse.temp }
      );

      setResult(calibration);
      setAnomalies(detectedAnomalies);
      setPrescription(pres);
      setScores(scrs);
      setIsAnalyzing(false);
      setShowResult(true);
      setShowPrescription(true);
      setIsHighlighting(true);

      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setTimeout(() => setIsHighlighting(false), 2000);
      }, 100);
    }, 2000);
  };

  const handleStartAnalysis = () => runAnalysis(sensorData);

  const loadDemoPreset = (type: 'normal' | 'salt' | 'lack') => {
    let preset: SensorData;
    if (type === 'normal') preset = { n: 105, p: 55, k: 135, ec: 1.2, temp: 22, moisture: 45, rainfall: 0, solar: 600 };
    else if (type === 'salt') preset = { n: 380, p: 65, k: 410, ec: 3.2, temp: 28, moisture: 18, rainfall: 0, solar: 800 };
    else preset = { n: 35, p: 15, k: 45, ec: 0.8, temp: 20, moisture: 38, rainfall: 0, solar: 300 };
    setSensorData(preset);
    runAnalysis(preset);
  };

  const copyToClipboard = () => {
    const text = `[자동 영농일지 - 농사랑 AI]\n날짜: ${new Date().toLocaleDateString()}\n작물: ${selectedCrop}\n진단: ${prescription?.summary}\n처방: ${prescription?.strategy}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopyStatus(true);
      setTimeout(() => setCopyStatus(false), 2000);
    });
  };

  const getNutrientStatus = (val: number, min: number, max: number) => {
    if (val < min) return { label: '부족', color: 'text-amber-500', bg: 'bg-amber-50', icon: <ArrowDownCircle /> };
    if (val > max) return { label: '과잉', color: 'text-rose-500', bg: 'bg-rose-50', icon: <ArrowUpCircle /> };
    return { label: '적정', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: <CheckCircle2 /> };
  };

  const MiniBarChart = ({ label, raw, cal, max }: { label: string, raw: number, cal: number, max: number }) => (
    <div className="space-y-4">
      <div className="flex justify-between items-end">
        <span className="text-base font-black text-slate-700">{label}</span>
        <div className="flex gap-4 text-[10px] font-black uppercase">
          <span className="text-slate-400 font-bold tracking-widest">RAW: {raw}</span>
          <span className="text-emerald-600 font-bold tracking-widest">CAL: {cal}</span>
        </div>
      </div>
      <div className="h-10 w-full bg-slate-100 rounded-2xl overflow-hidden flex flex-col justify-center px-2 gap-1.5 shadow-inner border border-slate-200/50 relative">
        <div className="h-1.5 bg-slate-300 rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, (raw / max) * 100)}%` }} />
        <div className="h-1.5 bg-emerald-500 rounded-full transition-all duration-1000 shadow-[0_0_12px_rgba(16,185,129,0.4)]" style={{ width: `${Math.min(100, (cal / max) * 100)}%` }} />
      </div>
    </div>
  );

  if (view === 'landing') {
    return (
      <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-emerald-100 selection:text-emerald-900">
        <nav className="fixed top-0 w-full bg-white/70 backdrop-blur-2xl border-b border-slate-100 z-50 transition-all h-20 flex items-center px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex justify-between w-full items-center">
            <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.scrollTo({top:0, behavior:'smooth'})}>
              <div className="bg-emerald-600 p-2 rounded-2xl shadow-xl shadow-emerald-200 group-hover:rotate-12 transition-all duration-500"><Sprout className="w-7 h-7 text-white" /></div>
              <span className="text-2xl font-black tracking-tighter text-emerald-900 uppercase">농사랑</span>
            </div>
            <div className="hidden md:flex gap-12 text-sm font-black text-slate-400 uppercase tracking-widest">
               <a href="#" className="hover:text-emerald-600 transition-colors">Solution</a>
               <button onClick={() => architectureRef.current?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-emerald-600 transition-colors">Architecture</button>
               <a href="#" className="hover:text-emerald-600 transition-colors">Agri-DB</a>
            </div>
            <button onClick={() => setView('dashboard')} className="bg-slate-900 hover:bg-emerald-700 text-white px-10 py-3 rounded-2xl text-sm font-black shadow-2xl active:scale-95 transition-all">DEMO START</button>
          </div>
        </nav>

        <section className="pt-60 pb-44 px-6 text-center relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
             <div className="absolute top-0 right-1/4 w-[700px] h-[700px] bg-emerald-50 rounded-full blur-[130px] opacity-70 animate-pulse" />
             <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-green-50 rounded-full blur-[110px] opacity-70" />
          </div>
          <div className="max-w-6xl mx-auto text-center">
            <div className="inline-flex items-center gap-3 px-5 py-2 bg-emerald-50 text-emerald-700 text-[12px] font-black uppercase tracking-[0.25em] rounded-full mb-12 border border-emerald-100 shadow-sm">
               <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" /> Precise Agriculture AI
            </div>
            <h1 className="text-8xl lg:text-[110px] font-black tracking-tighter mb-14 leading-[0.9] text-slate-900">
               감에 의존하던 시비를,<br />
               <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-emerald-500 to-green-400 drop-shadow-md italic font-serif">데이터 기반 처방으로.</span>
            </h1>
            <p className="text-2xl lg:text-3xl text-slate-500 mb-20 max-w-4xl mx-auto font-medium leading-relaxed">
               농사랑은 저가형 NPK 센서의 오차를 AI로 정밀 보정하여<br className="hidden md:block" /> 
               농가가 100% 신뢰할 수 있는 실시간 토양 진단과 시비 처방을 제공합니다.
            </p>
            <div className="flex flex-col sm:flex-row gap-8 justify-center items-center">
              <button onClick={() => setView('dashboard')} className="bg-emerald-600 hover:bg-emerald-700 text-white px-14 py-7 rounded-[32px] font-black text-2xl flex items-center justify-center gap-5 shadow-3xl shadow-emerald-200 transition-all active:scale-95 group">
                NPK 진단 시작하기 <ArrowRight className="w-7 h-7 group-hover:translate-x-3 transition-transform" />
              </button>
              <button onClick={() => architectureRef.current?.scrollIntoView({ behavior: 'smooth' })} className="bg-white border-2 border-slate-100 text-slate-800 px-14 py-7 rounded-[32px] font-black text-2xl hover:bg-slate-50 hover:border-slate-200 transition-all shadow-xl shadow-slate-100/50">
                기술 구조 보기
              </button>
            </div>
          </div>
        </section>

        <section ref={architectureRef} className="py-48 bg-slate-50/70 border-y border-slate-100 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-end mb-32 gap-10 text-center md:text-left">
              <div className="flex-1">
                <h2 className="text-6xl font-black text-slate-900 mb-8 tracking-tight uppercase tracking-tighter">System Architecture</h2>
                <p className="text-xl text-slate-500 font-medium max-w-2xl leading-loose mx-auto md:mx-0">불안정한 아날로그 신호를 디지털 정밀 처방으로 변환하는 5단계 기술 계층 구조입니다.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {[
                { title: "IoT Sensor Layer", items: ["NPK Sensor", "EC/PH Probe", "Gate-way Node"], icon: <Fingerprint />, color: "emerald" },
                { title: "External Data", items: ["Weather API", "Solar Radiation", "National Ag-DB"], icon: <Globe />, color: "blue" },
                { title: "AI Calibration", items: ["Noise Filtering", "Env Correction", "Soft-Sensing"], icon: <BrainCircuit />, color: "purple" },
                { title: "Decision Engine", items: ["Gap Analysis", "Crop Algorithm", "Score Logic"], icon: <Cpu />, color: "amber" },
                { title: "Farmer Interface", items: ["Visual Report", "Digital Presc.", "Auto Log"], icon: <LayoutDashboard />, color: "emerald" }
              ].map((layer, idx) => (
                <div key={idx} className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-xl group hover:shadow-4xl transition-all duration-500 flex flex-col items-center text-center">
                   <div className={`w-20 h-20 rounded-3xl bg-${layer.color}-50 flex items-center justify-center text-${layer.color}-600 mb-10 shadow-inner group-hover:rotate-6 transition-all`}>
                      {React.cloneElement(layer.icon as React.ReactElement, { className: 'w-10 h-10' })}
                   </div>
                   <h5 className="font-black text-slate-900 text-sm mb-6 uppercase tracking-widest leading-tight">{layer.title}</h5>
                   <ul className="space-y-4 w-full">
                      {layer.items.map((item, i) => (
                        <li key={i} className="text-[11px] font-black text-slate-400 flex items-center justify-center gap-3 uppercase tracking-tighter">
                           <div className={`w-1 h-1 rounded-full bg-${layer.color}-400`} /> {item}
                        </li>
                      ))}
                   </ul>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        <footer className="py-24 text-center border-t border-slate-50 bg-white">
           <div className="flex items-center justify-center gap-3 mb-6 font-black text-3xl text-slate-900 tracking-tighter uppercase italic"><Sprout className="text-emerald-600 w-10 h-10" /> 농사랑</div>
           <p className="text-slate-400 text-xs font-black uppercase tracking-[0.5em] opacity-60">© 2026 Precise Ag-Tech Solution | AI Deep Calibration MVP</p>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9fafb] text-slate-900 font-sans pb-40">
      <aside className="fixed left-0 top-0 h-full w-28 bg-white border-r border-slate-100 flex flex-col items-center py-12 gap-16 z-50 shadow-2xl">
        <div className="bg-emerald-600 p-4 rounded-[28px] shadow-2xl shadow-emerald-200 cursor-pointer active:scale-90 transition-all" onClick={() => setView('landing')}><Sprout className="w-8 h-8 text-white" /></div>
        <div className="flex flex-col gap-10">
          <div className="p-5 bg-emerald-50 text-emerald-600 rounded-[22px] shadow-inner"><LayoutDashboard className="w-8 h-8" /></div>
          <div className="p-5 text-slate-200 hover:text-emerald-400 transition-colors cursor-pointer"><Radar className="w-8 h-8" /></div>
          <div className="p-5 text-slate-200 hover:text-emerald-400 transition-colors cursor-pointer"><Database className="w-8 h-8" /></div>
        </div>
        <div onClick={() => setView('landing')} className="mt-auto p-5 text-slate-200 hover:text-rose-500 cursor-pointer transition-all"><LogOut className="w-8 h-8" /></div>
      </aside>

      <main className="pl-28">
        <header className="h-28 bg-white/70 backdrop-blur-3xl border-b border-slate-100 flex items-center justify-between px-14 sticky top-0 z-40">
          <div className="flex items-center gap-8">
            <h2 className="font-black text-3xl text-slate-800 tracking-tighter uppercase italic">Agri-SaaS Terminal</h2>
            <div className="flex items-center gap-3 px-5 py-2 bg-emerald-50 text-emerald-700 rounded-2xl text-[10px] font-black border border-emerald-100 shadow-sm">
               <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.8)]" /> ENGINE ACTIVE
            </div>
          </div>
          <div className="flex items-center gap-8">
             <div className="flex gap-4">
               <button className="p-4 bg-slate-50 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 rounded-2xl transition-all shadow-sm"><Bell className="w-6 h-6" /></button>
               <button className="p-4 bg-slate-50 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 rounded-2xl transition-all shadow-sm"><Settings2 className="w-6 h-6" /></button>
             </div>
             <div className="h-12 w-px bg-slate-100 mx-4" />
             <div className="flex items-center gap-6">
                <div className="text-right hidden xl:block"><p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1">Master Operator</p><p className="font-black text-lg text-slate-800 tracking-tight">김농부 님</p></div>
                <div className="w-14 h-14 bg-emerald-100 rounded-[20px] overflow-hidden border-2 border-white shadow-2xl"><img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="avatar" /></div>
             </div>
          </div>
        </header>

        <div className="p-14 max-w-[1700px] mx-auto space-y-16">
          {/* Preset Buttons - Presentation Friendly */}
          <div className="bg-emerald-900 rounded-[56px] p-12 text-white shadow-4xl relative overflow-hidden">
             <div className="absolute top-[-50px] right-[-50px] w-96 h-96 bg-emerald-500/20 rounded-full blur-[80px]" />
             <div className="relative z-10 flex flex-col xl:flex-row items-center gap-14 text-center xl:text-left">
                <div className="shrink-0 border-l-8 border-emerald-500 pl-8">
                   <h4 className="text-sm font-black text-emerald-400 uppercase tracking-[0.4em] mb-4">Quick Simulation Hub</h4>
                   <p className="text-4xl font-black text-white tracking-tight">데모 데이터 즉시 불러오기</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                  {[
                    { id: 'normal', label: '1. 정상 토양 (Optimal)', color: 'from-emerald-500 to-emerald-600', icon: <CheckCircle2 className="w-8 h-8" />, desc: "고수율 안정화 분석 시연" },
                    { id: 'salt', label: '2. 염류 집적 (Warning)', color: 'from-rose-500 to-rose-700', icon: <AlertTriangle className="w-8 h-8" />, desc: "이상치 경고 및 차단 시연" },
                    { id: 'lack', label: '3. 양분 부족 (Deficiency)', color: 'from-amber-500 to-orange-600', icon: <MinusCircle className="w-8 h-8" />, desc: "성분별 보충 전략 시연" }
                  ].map(p => (
                    <button key={p.id} onClick={() => loadDemoPreset(p.id as any)} className={`group flex flex-col items-center justify-center gap-4 py-8 px-10 bg-gradient-to-br ${p.color} text-white rounded-[40px] font-black shadow-2xl hover:translate-y-[-10px] active:scale-95 transition-all duration-500`}>
                      <div className="p-3 bg-white/20 rounded-2xl group-hover:rotate-12 transition-transform">{p.icon}</div>
                      <div className="text-center">
                        <p className="text-xl mb-1 uppercase tracking-tighter">{p.label}</p>
                        <p className="text-[10px] opacity-70 uppercase tracking-widest font-bold font-mono">{p.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-14 items-start">
            {/* Input Terminal */}
            <div className="lg:col-span-8 bg-white p-14 rounded-[64px] shadow-3xl border border-slate-100 space-y-16 relative">
              {isAnalyzing && (
                <div className="absolute inset-0 z-50 bg-white/90 backdrop-blur-md rounded-[64px] flex flex-col items-center justify-center animate-in fade-in duration-500 text-center px-10">
                   <div className="relative w-32 h-32 mb-12">
                      <div className="absolute inset-0 border-8 border-slate-50 rounded-full" />
                      <div className="absolute inset-0 border-8 border-emerald-500 rounded-full border-t-transparent animate-spin" />
                      <Cpu className="absolute inset-0 m-auto w-12 h-12 text-emerald-600" />
                   </div>
                   <p className="text-4xl font-black text-slate-800 mb-4 animate-pulse uppercase tracking-tighter">{analysisStep}</p>
                   <p className="text-emerald-500 font-black uppercase tracking-[0.4em] text-[10px]">Processing via Cloud AI Calibration Node</p>
                </div>
              )}
              
              <div className="flex justify-between items-center flex-col md:flex-row gap-6 text-center md:text-left">
                 <h3 className="text-4xl font-black text-slate-900 tracking-tighter flex items-center gap-5 uppercase italic"><Settings2 className="text-emerald-600 w-10 h-10" /> Sensor Input Terminal</h3>
                 <div className="px-5 py-2 bg-slate-900 text-white rounded-2xl text-[12px] font-black tracking-widest shadow-xl">LIVE IOT SYNC</div>
              </div>

              <div className="space-y-8">
                <label className="text-xs font-black text-slate-500 uppercase tracking-[0.4em] ml-4 flex items-center justify-center md:justify-start gap-3">Crop Selection Model <ChevronRight className="w-4 h-4" /></label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-5">
                  {(['토마토', '딸기', '상추', '오이', '고추'] as Crop[]).map(crop => (
                    <button key={crop} onClick={() => setSelectedCrop(crop)} className={`py-6 rounded-[32px] text-xl font-black border-4 transition-all duration-500 shadow-sm ${selectedCrop === crop ? 'bg-emerald-600 border-emerald-600 text-white shadow-2xl scale-[1.08]' : 'bg-white border-slate-50 text-slate-300 hover:text-emerald-600'}`}>{crop}</button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-24 pt-4 text-center md:text-left">
                <div className="space-y-12">
                  <h4 className="text-[12px] font-black text-emerald-600 uppercase tracking-[0.5em] flex items-center gap-4 bg-emerald-50 w-fit px-6 py-2 rounded-full border border-emerald-100 mx-auto md:mx-0">Soil Nutrients (mg/kg)</h4>
                  {['n', 'p', 'k'].map(id => (
                    <div key={id} className="space-y-6 px-2">
                      <div className="flex justify-between items-end"><span className="text-2xl font-black text-slate-700 uppercase">{id.toUpperCase()}</span><span className="text-4xl font-black text-emerald-600 tabular-nums">{sensorData[id as keyof SensorData]}</span></div>
                      <input type="range" min="0" max="500" value={sensorData[id as keyof SensorData]} onChange={(e) => handleInputChange(id as keyof SensorData, Number(e.target.value))} className="w-full h-3 bg-slate-100 rounded-full appearance-none cursor-pointer accent-emerald-600" />
                    </div>
                  ))}
                </div>
                <div className="space-y-10">
                  <h4 className="text-[12px] font-black text-blue-600 uppercase tracking-[0.5em] flex items-center gap-4 bg-blue-50 w-fit px-6 py-2 rounded-full border border-blue-100 mx-auto md:mx-0">Environment Conditions</h4>
                  <div className="grid grid-cols-1 gap-6">
                    {[
                      { id: 'ec', label: 'EC (dS/m)', icon: <Zap />, color: 'emerald' },
                      { id: 'moisture', label: 'Moisture (%)', icon: <Droplets />, color: 'blue' },
                      { id: 'temp', label: 'Temp (°C)', icon: <Thermometer />, color: 'orange' },
                      { id: 'rainfall', label: 'Rain (mm)', icon: <CloudRain />, color: 'slate' }
                    ].map(item => (
                      <div key={item.id} className="flex items-center gap-8 p-7 bg-slate-50/50 rounded-[40px] border border-slate-100 group hover:bg-white hover:shadow-2xl transition-all duration-500">
                        <div className={`p-4 bg-white rounded-3xl text-${item.color}-500 shadow-md group-hover:scale-110 transition-transform`}>{item.icon}</div>
                        <div className="flex-1 text-xs font-black text-slate-400 uppercase tracking-widest">{item.label}</div>
                        <input type="number" value={sensorData[item.id as keyof SensorData]} onChange={(e) => handleInputChange(item.id as keyof SensorData, Number(e.target.value))} className="w-28 bg-white border-2 border-slate-100 rounded-[24px] px-6 py-4 text-right font-black text-2xl text-slate-800 outline-none focus:border-emerald-500 transition-all shadow-inner" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <button onClick={handleStartAnalysis} disabled={isAnalyzing} className="w-full py-10 bg-slate-900 hover:bg-emerald-600 text-white rounded-[40px] font-black text-3xl flex justify-center items-center gap-8 shadow-4xl active:scale-95 transition-all duration-500">
                <Cpu className="w-12 h-12" /> AI 보정 및 진단 실행
              </button>
            </div>
            
            <div className="lg:col-span-4 space-y-8 h-full">
              <div className="bg-white p-12 rounded-[56px] shadow-2xl border border-slate-50 relative overflow-hidden h-full flex flex-col">
                 <div className="absolute top-0 right-0 p-10 opacity-5"><Activity className="w-64 h-64" /></div>
                 <h3 className="text-2xl font-black mb-12 flex items-center gap-5 uppercase tracking-tighter italic border-b border-slate-100 pb-8"><Database className="text-emerald-600 w-8 h-8" /> Connection</h3>
                 <div className="space-y-12">
                    <div className="flex justify-between items-center"><span className="text-[12px] font-black text-slate-400 uppercase tracking-[0.3em]">Engine</span><span className="text-emerald-600 font-black text-sm flex items-center gap-3 bg-emerald-50 px-5 py-2 rounded-2xl border border-emerald-100 shadow-sm"><div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.8)]" />LIVE-AI</span></div>
                    <div className="flex justify-between items-center"><span className="text-[12px] font-black text-slate-400 uppercase tracking-[0.3em]">Protocol</span><span className="text-slate-800 font-black text-sm uppercase flex items-center gap-3"><Fingerprint className="w-5 h-5 text-emerald-500" />Encrypted</span></div>
                    <div className="flex justify-between items-center"><span className="text-[12px] font-black text-slate-400 uppercase tracking-[0.3em]">Field</span><span className="bg-slate-900 text-white px-6 py-2.5 rounded-2xl text-[10px] font-black shadow-2xl uppercase tracking-widest">Zone A-01</span></div>
                 </div>
                 <div className="mt-auto pt-20">
                    <div className="p-10 bg-gradient-to-br from-emerald-900 to-slate-900 rounded-[40px] text-white shadow-3xl text-center relative group overflow-hidden">
                       <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl" />
                       <div className="flex items-center justify-center gap-3 mb-6"><BrainCircuit className="text-emerald-400 w-7 h-7" /><span className="text-[11px] font-black text-emerald-400 uppercase tracking-[0.4em]">Smart Insight</span></div>
                       <p className="text-base font-bold leading-relaxed opacity-90 italic">"{selectedCrop} 생육 모델링 데이터를 성공적으로 로드했습니다. 현장 센서의 수분 상관관계를 분석 중입니다."</p>
                    </div>
                 </div>
              </div>
            </div>
          </div>

          {/* Results Render Area */}
          {showResult && result && (
            <div ref={resultRef} className={`space-y-24 animate-in fade-in slide-in-from-bottom-32 duration-1000 ${isHighlighting ? 'ring-[30px] ring-emerald-500/10 rounded-[100px] transition-all' : ''}`}>
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-14">
                 {/* Anomalies Report */}
                 <div className="lg:col-span-12 bg-white rounded-[72px] border-4 border-slate-50 p-16 shadow-4xl">
                    <div className="flex justify-between items-center mb-16 flex-col xl:flex-row gap-8 text-center xl:text-left">
                       <h4 className="text-5xl font-black flex items-center gap-8 tracking-tighter uppercase"><AlertTriangle className="text-rose-500 w-16 h-16" /> 이상치 탐지 분석 리포트</h4>
                       <div className="px-8 py-3 bg-rose-50 text-rose-600 rounded-3xl text-xs font-black border border-rose-100 uppercase tracking-widest shadow-xl">Critical Event Log Ready</div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      {anomalies.length > 0 ? anomalies.map((a, i) => (
                        <div key={i} className={`p-12 rounded-[56px] flex gap-10 border-4 ${a.type==='danger'?'bg-rose-50 border-rose-100 text-rose-900':'bg-amber-50 border-amber-100 text-amber-900'} shadow-2xl transition-all hover:scale-[1.02]`}>
                          <div className={`p-8 rounded-[40px] bg-white shadow-3xl ${a.type==='danger'?'text-rose-500':'text-amber-500'} shrink-0`}>{a.type==='danger'?<AlertCircle className="w-14 h-14" />:<AlertTriangle className="w-14 h-14" />}</div>
                          <div>
                            <p className="text-3xl font-black mb-4 uppercase tracking-tighter">{a.type==='danger'?'Danger Detected':'System Warning'}</p>
                            <p className="text-xl font-bold leading-relaxed opacity-80">{a.message}</p>
                          </div>
                        </div>
                      )) : (
                        <div className="col-span-2 p-20 bg-emerald-50 border-4 border-emerald-100 text-emerald-900 rounded-[64px] flex items-center gap-16 shadow-4xl text-center md:text-left flex-col md:flex-row">
                          <div className="w-32 h-32 bg-white rounded-[48px] flex items-center justify-center text-emerald-600 shadow-4xl shrink-0 animate-bounce"><Check className="w-16 h-16" /></div>
                          <div><p className="text-5xl font-black mb-6 italic tracking-tight leading-none uppercase">Optimal Soil Conditions</p><p className="text-3xl font-bold opacity-70 leading-relaxed text-emerald-800/50">현재 분석된 토양 환경에서 위험 신호가 감지되지 않았습니다. 보정이 성공적으로 수행되었습니다.</p></div>
                        </div>
                      )}
                    </div>
                 </div>

                 {/* Calibration Details */}
                 <div className="lg:col-span-12 bg-white rounded-[80px] border border-slate-100 shadow-5xl overflow-hidden relative">
                    <div className="bg-slate-900 px-20 py-20 text-white flex flex-col xl:flex-row justify-between items-center gap-20 relative">
                      <div className="flex items-center gap-12 text-center md:text-left flex-col md:flex-row relative z-10">
                         <div className="w-40 h-40 bg-emerald-600 rounded-[56px] flex items-center justify-center shadow-[0_0_100px_rgba(16,185,129,0.4)] border-4 border-emerald-400/20"><ShieldCheck className="w-20 h-20 text-white" /></div>
                         <div><h3 className="text-6xl font-black tracking-tighter mb-6 uppercase italic">AI Calibration Report</h3><p className="text-emerald-400 font-black uppercase tracking-[0.4em] text-xl bg-white/5 w-fit px-8 py-3 rounded-[24px] border border-white/10 mx-auto md:mx-0">{result.calibrationMessage}</p></div>
                      </div>
                      <div className="bg-white/5 p-16 rounded-[64px] border-4 border-white/10 text-center min-w-[380px] backdrop-blur-3xl shadow-4xl relative z-10 group hover:border-emerald-500/40 transition-all duration-1000">
                         <p className="text-[14px] font-black uppercase text-slate-500 mb-8 tracking-[0.6em]">System Confidence</p>
                         <p className="text-[120px] font-black text-emerald-400 tracking-tighter leading-none tabular-nums drop-shadow-[0_0_30px_rgba(52,211,153,0.4)]">{result.confidenceScore}<span className="text-4xl font-normal ml-4 text-slate-500 opacity-50">%</span></p>
                      </div>
                    </div>
                    <div className="p-24 grid grid-cols-1 lg:grid-cols-2 gap-40">
                      <div className="space-y-24">
                        <div className="flex items-center justify-between border-b-4 border-slate-50 pb-10 flex-wrap gap-6"><h4 className="text-4xl font-black text-slate-800 flex items-center gap-8 italic uppercase tracking-tighter"><TrendingUp className="text-emerald-600 w-12 h-12" /> Data Precision Map</h4><div className="flex gap-10 text-[12px] font-black uppercase"><div className="flex items-center gap-4 text-slate-300"><div className="w-5 h-5 bg-slate-200 rounded-full shadow-inner" /> Sensor Raw</div><div className="flex items-center gap-4 text-emerald-600"><div className="w-5 h-5 bg-emerald-600 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)]" /> AI Calibrated</div></div></div>
                        <div className="space-y-24">
                          <MiniBarChart label="질소 (Nitrogen)" raw={sensorData.n} cal={result.calibratedN} max={500} />
                          <MiniBarChart label="인산 (Phosphorus)" raw={sensorData.p} cal={result.calibratedP} max={200} />
                          <MiniBarChart label="칼륨 (Potassium)" raw={sensorData.k} cal={result.calibratedK} max={500} />
                        </div>
                      </div>
                      <div className="bg-[#fcfdfe] rounded-[72px] p-20 text-center flex flex-col justify-center items-center space-y-16 border-4 border-slate-50 shadow-2xl relative">
                        <div className="w-48 h-48 bg-white rounded-[64px] shadow-4xl flex items-center justify-center text-emerald-600 transition-all duration-1000 hover:rotate-[360deg] border-4 border-emerald-50"><Sprout className="w-24 h-24" /></div>
                        <div className="space-y-8"><h4 className="text-5xl font-black text-slate-900 tracking-tighter leading-tight uppercase italic">{selectedCrop} 생육 정밀 모델링 <br />분석 최종 완료</h4><p className="text-2xl text-slate-500 font-bold opacity-60 leading-loose">보정된 고신뢰도 데이터를 기반으로 <br />최상의 영농 처방 시나리오를 구성합니다.</p></div>
                        <div className="flex gap-10 w-full">
                           <div className="flex-1 bg-white p-12 rounded-[48px] shadow-2xl border-2 border-slate-50 hover:border-emerald-200 transition-all"><p className="text-[14px] font-black text-slate-400 mb-4 uppercase tracking-[0.2em]">Health Pts</p><p className="text-6xl font-black text-emerald-600 tabular-nums leading-none tracking-tighter">{scores.health}<span className="text-2xl font-normal ml-2 opacity-30">pts</span></p></div>
                           <div className="flex-1 bg-white p-12 rounded-[48px] shadow-2xl border-2 border-slate-50 hover:border-blue-200 transition-all"><p className="text-[14px] font-black text-slate-400 mb-4 uppercase tracking-[0.2em]">Suitability</p><p className="text-6xl font-black text-blue-600 tabular-nums leading-none tracking-tighter">{scores.suitability}<span className="text-2xl font-normal ml-2 opacity-30">%</span></p></div>
                        </div>
                      </div>
                    </div>
                 </div>

                 {/* The Ultimate Prescription Card */}
                 {showPrescription && prescription && (
                    <div className="lg:col-span-12 space-y-20 animate-in fade-in slide-in-from-bottom-32 duration-1000 delay-300">
                       <div className="bg-white rounded-[100px] border-[12px] border-emerald-600/5 shadow-6xl overflow-hidden relative">
                          <div className="bg-emerald-900 px-24 py-28 text-white relative overflow-hidden border-b-[20px] border-emerald-800">
                             <div className="absolute top-[-200px] right-[-200px] opacity-10"><Star className="w-[800px] h-[800px] rotate-[15deg] fill-white" /></div>
                             <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-24">
                                <div className="text-center lg:text-left">
                                   <div className="inline-flex items-center gap-5 px-8 py-3 bg-white/10 rounded-[28px] text-[16px] font-black uppercase mb-12 border border-white/10 tracking-[0.5em] shadow-4xl"><Star className="w-6 h-6 fill-emerald-400 text-emerald-400" /> AI-POWERED PRESCRIPTION v2.0</div>
                                   <h3 className="text-8xl lg:text-[120px] font-black tracking-tighter leading-[0.8] mb-16 italic uppercase text-transparent bg-clip-text bg-gradient-to-r from-white to-emerald-400">{selectedCrop} 최적 처방전</h3>
                                   <div className="flex flex-col sm:flex-row items-center gap-14 opacity-90">
                                      <p className="text-2xl font-black flex items-center gap-6 text-emerald-200 uppercase tracking-widest"><Calendar className="w-10 h-10" /> {new Date().toLocaleDateString('ko-KR')}</p>
                                      <div className="w-3 h-3 bg-emerald-500 rounded-full hidden sm:block shadow-[0_0_15px_rgba(16,185,129,1)]" />
                                      <p className="text-2xl font-black flex items-center gap-6 text-emerald-200 uppercase tracking-widest"><MapPin className="w-10 h-10" /> Smart Farm Area-A01</p>
                                   </div>
                                </div>
                                <div className="bg-gradient-to-br from-emerald-600/40 to-slate-900/60 backdrop-blur-3xl px-20 py-16 rounded-[72px] border-4 border-white/20 text-center shadow-5xl transform hover:scale-105 transition-transform duration-1000">
                                      <p className="text-[16px] font-black text-emerald-300 mb-6 uppercase tracking-[0.5em] opacity-60">Farming Health</p>
                                      <div className="text-[140px] font-black tracking-tighter leading-none text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]">{scores.health}<span className="text-4xl font-normal opacity-30 ml-6 uppercase">Index</span></div>
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
                                    <div key={nut} className={`${status.bg} border-4 ${status.color.replace('text', 'border')} rounded-[72px] p-16 shadow-4xl transition-all duration-700 hover:-translate-y-10 group/card`}>
                                      <div className="flex justify-between items-start mb-16 flex-col md:flex-row gap-8">
                                         <div className={`p-8 rounded-[40px] bg-white shadow-3xl ${status.color} transform group-hover/card:rotate-12 transition-transform duration-700`}>{React.cloneElement(status.icon as React.ReactElement, { className: 'w-16 h-16' })}</div>
                                         <span className={`px-8 py-3 rounded-full text-sm font-black bg-white shadow-2xl uppercase tracking-[0.2em] border-2 border-slate-50 ${status.color}`}>{status.label}</span>
                                      </div>
                                      <h5 className="text-lg font-black text-slate-400 mb-4 uppercase tracking-[0.5em]">{nut.toUpperCase()} ANALYTICS</h5>
                                      <div className="text-[100px] font-black text-slate-900 mb-16 tracking-tighter leading-none tabular-nums group-hover/card:text-emerald-950 transition-colors">{calVal}<span className="text-3xl font-normal text-slate-300 ml-6 uppercase">mg/kg</span></div>
                                      <div className="h-5 w-full bg-white/60 rounded-full overflow-hidden mb-12 flex border-4 border-slate-50 shadow-inner p-1">
                                         <div className="h-full bg-slate-100 rounded-full" style={{ width: `${(standard.min / 500) * 100}%` }} />
                                         <div className="h-full bg-emerald-500 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.8)]" style={{ width: `${((standard.max - standard.min) / 500) * 100}%` }} />
                                      </div>
                                      <div className={`text-2xl font-black flex items-center justify-center md:justify-start gap-6 ${status.color} italic uppercase tracking-tighter`}><div className={`w-5 h-5 rounded-full shadow-2xl animate-pulse ${status.color.replace('text', 'bg')}`} />{status.recommendation}</div>
                                    </div>
                                  );
                                })}
                             </div>

                             <div className="bg-slate-900 rounded-[80px] p-24 text-white relative overflow-hidden shadow-6xl border-[20px] border-slate-800 transition-all hover:border-emerald-900/50 duration-1000">
                                <div className="absolute top-0 right-0 p-24 opacity-5 animate-spin-slow"><BrainCircuit className="w-[800px] h-[800px]" /></div>
                                <div className="relative z-10 flex flex-col xl:flex-row gap-40 text-center xl:text-left">
                                   <div className="flex-1 space-y-20">
                                      <div className="space-y-12">
                                         <div className="flex items-center justify-center xl:justify-start gap-8 mb-16"><div className="w-20 h-20 bg-emerald-500/20 rounded-[32px] flex items-center justify-center text-emerald-400 border-4 border-emerald-500/20 shadow-inner"><Cpu className="w-10 h-10" /></div><h4 className="text-3xl font-black text-emerald-400 uppercase tracking-[0.6em]">AI Decision Insight Engine</h4></div>
                                         <p className="text-6xl lg:text-7xl font-black leading-[1.05] italic mb-16 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-emerald-300">"{prescription.summary}"</p>
                                         <p className="text-slate-400 text-3xl font-medium leading-[1.7] max-w-5xl opacity-70 border-l-8 border-emerald-500/30 pl-12">{cropStandards[selectedCrop].description}</p>
                                      </div>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-20">
                                         <div className="flex gap-12 flex-col md:flex-row items-center md:items-start group transition-all">
                                            <div className="w-28 h-28 bg-emerald-500/10 rounded-[40px] flex items-center justify-center text-emerald-400 border-2 border-emerald-500/10 shadow-2xl shrink-0 group-hover:bg-emerald-500/20 transition-all"><Zap className="w-14 h-14" /></div>
                                            <div><p className="text-[14px] font-black text-slate-500 uppercase tracking-[0.4em] mb-6">AI Strategic Recommendation</p><p className="text-3xl font-bold text-white leading-relaxed tracking-tight">{prescription.strategy}</p></div>
                                         </div>
                                         <div className="flex gap-12 flex-col md:flex-row items-center md:items-start group transition-all">
                                            <div className="w-28 h-28 bg-blue-500/10 rounded-[40px] flex items-center justify-center text-blue-400 border-2 border-blue-500/10 shadow-2xl shrink-0 group-hover:bg-blue-500/20 transition-all"><RefreshCw className="w-14 h-14" /></div>
                                            <div><p className="text-[14px] font-black text-slate-500 uppercase tracking-[0.4em] mb-6">Next Scheduled Analytics</p><p className="text-5xl font-black text-blue-400 tracking-tighter italic uppercase underline decoration-blue-500/30 decoration-8 underline-offset-[16px]">{prescription.nextDiagnosis}</p></div>
                                         </div>
                                      </div>
                                   </div>
                                   <div className="xl:w-[500px] bg-white/5 p-16 rounded-[64px] border-4 border-white/10 backdrop-blur-3xl space-y-16 shadow-5xl text-left transform xl:rotate-1">
                                      <p className="text-[16px] font-black text-slate-400 uppercase tracking-[0.5em] flex items-center gap-6"><AlertTriangle className="text-rose-500 w-10 h-10 shadow-[0_0_20px_rgba(244,63,94,0.5)]" /> Risk Management</p>
                                      <ul className="space-y-14">
                                         {prescription.precautions.map((p, i) => (
                                           <li key={i} className="text-2xl font-bold text-slate-100 flex items-start gap-10 leading-snug"><div className="w-5 h-5 bg-rose-500 rounded-full mt-2 shrink-0 shadow-[0_0_25px_rgba(244,63,94,1)] animate-pulse" />{p}</li>
                                         ))}
                                      </ul>
                                   </div>
                                </div>
                             </div>

                             <div className="bg-[#fcfdfe] rounded-[80px] border-8 border-slate-50 p-24 shadow-inner relative group overflow-hidden">
                                <div className="absolute top-0 right-0 p-24 opacity-[0.05] group-hover:rotate-[15deg] transition-all duration-1000"><ClipboardList className="w-[600px] h-[600px] text-slate-900" /></div>
                                <div className="flex flex-col xl:flex-row justify-between items-center mb-20 relative z-10 gap-16 text-center xl:text-left">
                                   <div className="flex items-center gap-12 flex-col xl:flex-row">
                                      <div className="p-8 bg-white rounded-[48px] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] transform group-hover:scale-110 transition-transform duration-700 border border-slate-50"><FileText className="w-16 h-16 text-slate-400" /></div>
                                      <div className="space-y-4"><h4 className="text-6xl font-black tracking-tighter italic uppercase text-slate-900">Digital Farming Log</h4><p className="text-slate-400 text-2xl font-bold uppercase tracking-[0.3em] opacity-70">분석 및 처방 리포트 자동 아카이빙</p></div>
                                   </div>
                                   <button onClick={copyToClipboard} className={`flex items-center gap-6 px-16 py-8 rounded-[40px] font-black text-3xl transition-all duration-500 shadow-5xl shrink-0 uppercase tracking-widest ${copySuccess ? 'bg-emerald-600 text-white shadow-emerald-200 scale-95' : 'bg-slate-900 text-white hover:bg-slate-800 active:scale-95'}`}>{copySuccess ? <><Check className="w-10 h-10" /> COPIED!</> : <><ClipboardCheck className="w-10 h-10" /> Copy Report</>}</button>
                                </div>
                                <div className="relative group">
                                  <pre className="w-full bg-white p-20 rounded-[64px] border-4 border-slate-50 text-[22px] text-slate-800 font-mono leading-[2.4] whitespace-pre-wrap shadow-inner overflow-auto transform hover:border-emerald-100 transition-all duration-700 italic border-l-[32px] border-l-emerald-900">
                                     {`[농사랑 AI 영농 통합 리포트 - DIGITAL ARCHIVE]\n----------------------------------------------------\n▣ 진단 일시 : ${new Date().toLocaleString('ko-KR')}\n▣ 관리 구역 : AREA-A01 / SMART GRID SYSTEM\n▣ 작물 품종 : ${selectedCrop} (Premium Strain)\n▣ AI 보정 신뢰도 : High Reliability Engine ${result.confidenceScore}%\n▣ 진단 결과 : ${prescription.summary}\n▣ 추천 처방 : ${prescription.strategy}\n▣ 정밀 가이드 : ${prescription.precautions.join(' / ')}\n----------------------------------------------------\n* Generated by Nongsarang Precise Ag-Tech Lab v2.0`}
                                  </pre>
                                </div>
                             </div>

                             <div className="flex flex-col lg:flex-row gap-12 justify-center pt-32 border-t-8 border-slate-50 border-dashed">
                                <button className="px-24 py-12 bg-white border-4 border-slate-100 rounded-[48px] font-black text-4xl text-slate-800 hover:bg-slate-50 hover:border-emerald-200 transition-all duration-500 flex items-center justify-center gap-8 shadow-4xl transform hover:translate-y-[-15px] uppercase tracking-tighter"><MapPin className="w-14 h-14 text-emerald-600" /> Area Cloud Sync</button>
                                <button className="px-24 py-12 bg-emerald-600 text-white rounded-[48px] font-black text-4xl hover:bg-emerald-700 transition-all duration-500 shadow-[0_40px_100px_-20px_rgba(16,185,129,0.6)] flex items-center justify-center gap-8 active:scale-95 transform hover:translate-y-[-15px] uppercase tracking-tighter"><Star className="w-14 h-14 fill-white shadow-2xl" /> Activate Care</button>
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
