import React, { useState, useRef } from 'react';
import { 
  Sprout, Cpu, BarChart3, ArrowRight, Settings2, 
  FileText, ChevronRight, Database, Thermometer, Droplets, 
  CloudRain, Activity, AlertCircle, CheckCircle2, Zap, LayoutDashboard, 
  LogOut, RefreshCw, TrendingUp, ShieldCheck, AlertTriangle, Info, Check, 
  Star, ArrowUpCircle, ArrowDownCircle, MinusCircle, Calendar, MapPin, 
  ClipboardList, Play, Layers, Globe, Search, Bell
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
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<CalibrationResult | null>(null);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [prescription, setPrescription] = useState<PrescriptionResult | null>(null);
  const [scores, setScores] = useState({ health: 92, suitability: 88 });
  const [copySuccess, setCopyStatus] = useState(false);

  const dashboardRef = useRef<HTMLDivElement>(null);
  
  const [sensorData, setSensorData] = useState<SensorData>({
    n: 150, p: 45, k: 210, ec: 2.1, temp: 24.5, moisture: 35, rainfall: 0, solar: 450
  });

  const runAnalysis = (dataToUse: SensorData) => {
    setIsAnalyzing(true);
    setShowResult(false);
    
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
    }, 1200);
  };

  const loadPreset = (type: 'normal' | 'salt' | 'lack') => {
    let preset: SensorData;
    if (type === 'normal') preset = { n: 105, p: 55, k: 135, ec: 1.2, temp: 22, moisture: 45, rainfall: 0, solar: 600 };
    else if (type === 'salt') preset = { n: 380, p: 65, k: 410, ec: 3.2, temp: 28, moisture: 18, rainfall: 0, solar: 800 };
    else preset = { n: 35, p: 15, k: 45, ec: 0.8, temp: 20, moisture: 38, rainfall: 0, solar: 300 };
    setSensorData(preset);
    runAnalysis(preset);
  };

  const copyLog = () => {
    const text = `[자동 영농일지] 날짜: ${new Date().toLocaleDateString()}, 작물: ${selectedCrop}, 상태: ${scores.health}점`;
    navigator.clipboard.writeText(text).then(() => {
      setCopyStatus(true);
      setTimeout(() => setCopyStatus(false), 2000);
    });
  };

  // --- UI Components ---
  const StatusBadge = ({ label }: { label: string }) => (
    <span className="inline-flex items-center px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-100 shadow-sm">
      <Check className="w-3 h-3 mr-1" /> {label}
    </span>
  );

  if (view === 'landing') {
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        {/* Navigation */}
        <nav className="h-16 flex items-center border-b border-slate-200 bg-white px-6 lg:px-12 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="bg-emerald-700 p-1.5 rounded-lg"><Sprout className="w-5 h-5 text-white" /></div>
              <span className="text-xl font-bold tracking-tight text-slate-900">농사랑</span>
            </div>
            <div className="flex items-center gap-8">
              <div className="hidden md:flex gap-6 text-sm font-medium text-slate-500">
                <a href="#" className="hover:text-emerald-700">솔루션</a>
                <a href="#" className="hover:text-emerald-700">AI 기술 구조</a>
                <a href="#" className="hover:text-emerald-700">작물별 DB</a>
              </div>
              <button 
                onClick={() => setView('dashboard')}
                className="bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-2 rounded-xl text-sm font-bold shadow-sm transition-all"
              >
                데모 시작하기
              </button>
            </div>
          </div>
        </nav>

        {/* Hero Section: Left-Right Structure */}
        <main className="max-w-7xl mx-auto px-6 lg:px-12 pt-20 lg:pt-32 pb-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            {/* Left: Explanation */}
            <div className="space-y-8 animate-fade-in">
              <div className="inline-flex items-center px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-black uppercase tracking-wider rounded-full border border-emerald-100">
                AI 기반 정밀 농업 리포트
              </div>
              <h1 className="text-5xl lg:text-6xl font-extrabold text-slate-900 leading-tight">
                토마토 정밀 시비<br />
                <span className="text-emerald-700">처방 결과 대시보드</span>
              </h1>
              <p className="text-lg lg:text-xl text-slate-600 leading-relaxed max-w-lg">
                센서 Raw Data와 환경 정보를 AI로 보정하여<br />
                작물별 최적 시비 전략을 제안합니다.
              </p>
              
              <div className="flex flex-wrap gap-6 pt-4 border-t border-slate-200">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-slate-400" />
                  <span className="text-sm font-bold text-slate-700">2026. 4. 27.</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-slate-400" />
                  <span className="text-sm font-bold text-slate-700">스마트팜 A-01</span>
                </div>
                <div className="flex items-center gap-3">
                  <Sprout className="w-5 h-5 text-slate-400" />
                  <span className="text-sm font-bold text-slate-700">토마토</span>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => setView('dashboard')}
                  className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-2xl font-bold text-lg flex items-center gap-3 shadow-lg"
                >
                  진단 결과 상세보기 <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Right: Key Cards */}
            <div className="relative animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="bg-white p-10 lg:p-14 rounded-[40px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] border border-slate-100 space-y-12">
                <div className="text-center space-y-2">
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Soil Health Score</p>
                  <div className="text-8xl lg:text-9xl font-black text-slate-900 tracking-tighter">
                    {scores.health}<span className="text-3xl font-bold text-slate-300 ml-2">점</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 pt-8 border-t border-slate-100">
                  <div className="text-center space-y-1 border-r border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase">AI 보정 신뢰도</p>
                    <p className="text-3xl font-extrabold text-emerald-600">87%</p>
                  </div>
                  <div className="text-center space-y-2 flex flex-col items-center justify-center">
                    <p className="text-xs font-bold text-slate-400 uppercase">현재 토양 상태</p>
                    <StatusBadge label="적정" />
                  </div>
                </div>

                <div className="bg-slate-50 p-6 rounded-3xl flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm border border-slate-100">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-medium text-slate-600 leading-snug">
                    AI 엔진이 현재 습도를 바탕으로 질소(N) 값을 성공적으로 보정했습니다.
                  </p>
                </div>
              </div>
              
              {/* Decorative Accent */}
              <div className="absolute -top-6 -right-6 w-32 h-32 bg-emerald-100 rounded-full blur-3xl opacity-50 -z-10" />
              <div className="absolute -bottom-6 -left-6 w-40 h-40 bg-blue-100 rounded-full blur-3xl opacity-50 -z-10" />
            </div>
          </div>
        </main>

        {/* System Architecture (Landing Page Bottom) */}
        <section className="bg-white border-t border-slate-200 py-32 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center space-y-4 mb-20">
              <h2 className="text-3xl font-black text-slate-900">시스템 아키텍처</h2>
              <p className="text-slate-500 font-medium">센서 데이터가 정밀 처방 리포트로 변환되는 5단계 프로세스</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {[
                { label: 'IoT 센서 계층', desc: 'NPK, EC, 수분, 온도 수집', icon: <Database />, color: 'emerald' },
                { label: '외부 데이터 연동', desc: '기상청 API, 작물 표준 DB', icon: <Globe />, color: 'blue' },
                { label: 'AI 보정 계층', desc: '노이즈 제거, 신뢰도 산출', icon: <BrainCircuit />, color: 'purple' },
                { label: '의사결정 엔진', desc: '영양 분석 및 처방 알고리즘', icon: <Cpu />, color: 'amber' },
                { label: '사용자 리포트', desc: '시각화 및 영농일지 자동화', icon: <LayoutDashboard />, color: 'emerald' },
              ].map((item, i) => (
                <div key={i} className="p-8 bg-slate-50 rounded-3xl border border-slate-100 space-y-6 text-center hover:bg-white hover:shadow-xl transition-all group">
                  <div className={`w-14 h-14 mx-auto bg-white rounded-2xl flex items-center justify-center text-${item.color}-600 shadow-sm border border-slate-100 group-hover:scale-110 transition-transform`}>
                    {React.cloneElement(item.icon as React.ReactElement, { className: 'w-7 h-7' })}
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-black text-slate-900">{item.label}</h4>
                    <p className="text-[11px] font-bold text-slate-400 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    );
  }

  // --- Dashboard View ---
  return (
    <div className="min-h-screen bg-[#F1F5F9] flex">
      {/* Sidebar */}
      <aside className="w-20 bg-emerald-900 flex flex-col items-center py-10 gap-10">
        <div className="bg-white/10 p-2.5 rounded-xl cursor-pointer" onClick={() => setView('landing')}><Sprout className="w-6 h-6 text-white" /></div>
        <div className="flex flex-col gap-6">
          <div className="p-3 bg-white text-emerald-900 rounded-xl shadow-lg shadow-emerald-950/20"><LayoutDashboard className="w-6 h-6" /></div>
          <div className="p-3 text-emerald-500 hover:text-white cursor-pointer transition-colors"><Database className="w-6 h-6" /></div>
          <div className="p-3 text-emerald-500 hover:text-white cursor-pointer transition-colors"><Settings2 className="w-6 h-6" /></div>
        </div>
        <div onClick={() => setView('landing')} className="mt-auto p-3 text-emerald-600 hover:text-rose-400 cursor-pointer transition-all"><LogOut className="w-6 h-6" /></div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-10 sticky top-0 z-40 shadow-sm">
          <div className="flex items-center gap-6">
            <h2 className="font-black text-xl text-slate-800 tracking-tight">AI 진단 대시보드</h2>
            <div className="px-4 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl text-[10px] font-black border border-emerald-100 flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> AI ENGINE READY
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right"><p className="text-[10px] text-slate-400 font-bold uppercase">Master Operator</p><p className="font-black text-sm text-slate-800">김농부 님</p></div>
            <div className="w-10 h-10 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 shadow-sm"><img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="avatar" /></div>
          </div>
        </header>

        <div className="p-10 max-w-7xl mx-auto space-y-10">
          {/* Demo Presets - Extremely Important for Presentation */}
          <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-10">
            <div className="shrink-0 space-y-1">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Play className="w-3 h-3 fill-current" /> 발표용 시나리오</h4>
              <p className="text-lg font-black text-slate-800">데모 데이터 로드</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
              <button onClick={() => loadPreset('normal')} className="py-4 px-6 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 rounded-2xl font-bold text-sm border border-slate-100 transition-all flex items-center justify-center gap-3 group">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 group-hover:scale-110" /> 1. 정상 토양 시연
              </button>
              <button onClick={() => loadPreset('salt')} className="py-4 px-6 bg-slate-50 hover:bg-rose-50 hover:text-rose-700 text-slate-700 rounded-2xl font-bold text-sm border border-slate-100 transition-all flex items-center justify-center gap-3 group">
                <AlertCircle className="w-5 h-5 text-rose-500 group-hover:scale-110" /> 2. 염류 집적 위험
              </button>
              <button onClick={() => loadPreset('lack')} className="py-4 px-6 bg-slate-50 hover:bg-amber-50 hover:text-amber-700 text-slate-700 rounded-2xl font-bold text-sm border border-slate-100 transition-all flex items-center justify-center gap-3 group">
                <MinusCircle className="w-5 h-5 text-amber-500 group-hover:scale-110" /> 3. 양분 부족 해결
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Input Form */}
            <div className="lg:col-span-8 bg-white p-10 rounded-[40px] shadow-sm border border-slate-200 space-y-12 relative overflow-hidden">
              {isAnalyzing && (
                <div className="absolute inset-0 z-50 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-300">
                  <div className="w-16 h-16 border-4 border-slate-100 border-t-emerald-600 rounded-full animate-spin mb-6" />
                  <p className="text-2xl font-black text-slate-800 animate-pulse">AI 보정 분석 중...</p>
                  <p className="text-[10px] text-slate-400 mt-2 font-bold tracking-widest uppercase tracking-[0.3em]">Processing Soil Intelligence</p>
                </div>
              )}
              
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">재배 작물 선택</label>
                <div className="grid grid-cols-5 gap-3">
                  {(['토마토', '딸기', '상추', '오이', '고추'] as Crop[]).map(crop => (
                    <button key={crop} onClick={() => setSelectedCrop(crop)} className={`py-4 rounded-2xl text-sm font-bold border-2 transition-all ${selectedCrop === crop ? 'bg-emerald-700 border-emerald-700 text-white shadow-lg scale-105' : 'bg-white border-slate-100 text-slate-400 hover:border-emerald-200 hover:text-emerald-700'}`}>{crop}</button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                <div className="space-y-8">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-3 border-l-4 border-emerald-500 pl-4">NPK 센서 Raw Data (mg/kg)</h4>
                  {['n', 'p', 'k'].map(id => (
                    <div key={id} className="space-y-4 px-1">
                      <div className="flex justify-between items-end"><span className="text-sm font-bold text-slate-600 uppercase">{id}</span><span className="text-2xl font-black text-slate-900 tabular-nums">{sensorData[id as keyof SensorData]}</span></div>
                      <input type="range" min="0" max="500" value={sensorData[id as keyof SensorData]} onChange={(e) => handleInputChange(id as keyof SensorData, Number(e.target.value))} className="w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-emerald-600" />
                    </div>
                  ))}
                </div>
                <div className="space-y-6">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-3 border-l-4 border-blue-500 pl-4">현장 환경 조건</h4>
                  <div className="grid grid-cols-1 gap-4">
                    {[
                      { id: 'ec', label: 'EC 농도 (dS/m)', icon: <Zap />, color: 'emerald' },
                      { id: 'moisture', label: '토양 수분 (%)', icon: <Droplets />, color: 'blue' },
                      { id: 'temp', label: '토양 온도 (°C)', icon: <Thermometer />, color: 'orange' },
                      { id: 'rainfall', label: '강우량 (mm)', icon: <CloudRain />, color: 'slate' }
                    ].map(item => (
                      <div key={item.id} className="flex items-center gap-6 p-4 bg-slate-50 rounded-2xl border border-slate-100 group transition-all hover:bg-white hover:shadow-md">
                        <div className={`p-2.5 bg-white rounded-xl text-${item.color}-500 shadow-sm border border-slate-100 group-hover:scale-110 transition-transform`}>{item.icon}</div>
                        <div className="flex-1 text-[11px] font-bold text-slate-500">{item.label}</div>
                        <input type="number" value={sensorData[item.id as keyof SensorData]} onChange={(e) => handleInputChange(item.id as keyof SensorData, Number(e.target.value))} className="w-20 bg-white border-2 border-slate-100 rounded-xl px-3 py-2 text-right font-black text-slate-700 outline-none focus:border-emerald-500 transition-all shadow-inner" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <button onClick={() => runAnalysis(sensorData)} disabled={isAnalyzing} className="w-full py-6 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl font-black text-xl flex justify-center items-center gap-5 shadow-xl shadow-emerald-900/10 active:scale-[0.98] transition-all">
                <Cpu className="w-6 h-6" /> AI 보정 및 시비 처방 가동
              </button>
            </div>
            
            {/* Real-time Monitor */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              <div className="bg-slate-900 p-10 rounded-[40px] text-white shadow-xl relative overflow-hidden flex-1">
                 <div className="absolute top-0 right-0 p-10 opacity-5"><Activity className="w-48 h-48" /></div>
                 <h3 className="text-xl font-black mb-10 flex items-center gap-4 uppercase tracking-tighter italic border-b border-white/10 pb-6"><Database className="text-emerald-500" /> 실시간 모니터링</h3>
                 <div className="space-y-10">
                    <div className="flex justify-between items-center"><span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">엔진 상태</span><span className="text-emerald-500 font-black text-sm flex items-center gap-2"><div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />ONLINE</span></div>
                    <div className="flex justify-between items-center"><span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">데이터 품질</span><span className="text-amber-500 font-black text-sm uppercase">정상 (Optimal)</span></div>
                    <div className="flex justify-between items-center"><span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">수집 구역</span><span className="bg-white/10 text-white px-4 py-1.5 rounded-xl text-xs font-black border border-white/5 uppercase">Area A-01</span></div>
                 </div>
                 <div className="mt-14 p-6 bg-white/5 rounded-3xl border border-white/5">
                    <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-3">AI Deep Insight</p>
                    <p className="text-xs font-medium leading-relaxed opacity-70">현재 {selectedCrop} 생육 모델의 표준 데이터를 기반으로 보정이 준비되었습니다. 주변 대기 정보 연동 완료.</p>
                 </div>
              </div>
            </div>
          </div>

          {/* Results Render Area */}
          {showResult && result && prescription && (
            <div className="space-y-10 animate-fade-in">
              {/* Abnormal Signal Summary */}
              <div className="bg-white rounded-[40px] border border-slate-200 p-10 shadow-sm space-y-8">
                <h4 className="text-2xl font-black text-slate-800 flex items-center gap-4 tracking-tight uppercase"><AlertTriangle className="text-rose-500 w-8 h-8" /> 이상치 탐지 결과 리포트</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {anomalies.length > 0 ? anomalies.map((a, i) => (
                    <div key={i} className={`p-8 rounded-3xl flex gap-6 border-2 ${a.type==='danger'?'bg-rose-50 border-rose-100 text-rose-900':'bg-amber-50 border-amber-100 text-amber-900'} shadow-sm`}>
                      <div className={`p-4 rounded-2xl bg-white shadow-md ${a.type==='danger'?'text-rose-500':'text-amber-500'}`}>{a.type==='danger'?<AlertCircle className="w-8 h-8" />:<AlertTriangle className="w-8 h-8" />}</div>
                      <div>
                        <p className="text-lg font-black mb-1 uppercase tracking-tight">{a.type==='danger'?'위험 알림':'주의 경고'}</p>
                        <p className="text-sm font-bold opacity-80 leading-relaxed">{a.message}</p>
                      </div>
                    </div>
                  )) : (
                    <div className="col-span-2 p-12 bg-emerald-50 border-2 border-emerald-100 text-emerald-900 rounded-[32px] flex items-center gap-8 shadow-inner">
                      <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-md"><Check className="w-10 h-10" /></div>
                      <div><p className="text-2xl font-black mb-1 uppercase">정상 상태</p><p className="text-lg font-bold opacity-70 leading-relaxed">현재 토양 환경에서 위협적인 이상 신호가 발견되지 않았습니다. AI 보정이 신뢰도 {result.confidenceScore}% 수준에서 완료되었습니다.</p></div>
                    </div>
                  )}
                </div>
              </div>

              {/* Precise Calibration & Score */}
              <div className="bg-white rounded-[48px] border border-slate-200 shadow-xl overflow-hidden">
                <div className="bg-slate-900 px-12 py-10 text-white flex flex-col xl:flex-row justify-between items-center gap-12 border-b-[8px] border-emerald-600">
                  <div className="flex items-center gap-8 text-center md:text-left flex-col md:flex-row">
                    <div className="w-24 h-24 bg-emerald-600 rounded-[32px] flex items-center justify-center shadow-[0_20px_50px_rgba(16,185,129,0.3)] animate-pulse border-2 border-white/20"><ShieldCheck className="w-12 h-12 text-white" /></div>
                    <div><h3 className="text-4xl font-black tracking-tighter mb-2 uppercase italic">AI 보정 분석 결과</h3><p className="text-emerald-500 font-black uppercase tracking-widest text-xs bg-white/5 w-fit px-4 py-1.5 rounded-xl border border-white/10">{result.calibrationMessage}</p></div>
                  </div>
                  <div className="bg-white/5 px-10 py-6 rounded-[32px] border-2 border-white/10 text-center min-w-[280px] backdrop-blur-xl">
                    <p className="text-[10px] font-black uppercase text-slate-500 mb-3 tracking-[0.4em]">신뢰 지수 (Reliability)</p>
                    <p className="text-7xl font-black text-emerald-400 tracking-tighter tabular-nums leading-none">{result.confidenceScore}<span className="text-2xl font-normal ml-2 opacity-50">%</span></p>
                  </div>
                </div>
                <div className="p-16 grid grid-cols-1 lg:grid-cols-12 gap-20">
                  {/* NPK Chart */}
                  <div className="lg:col-span-7 space-y-16">
                    <div className="flex items-center justify-between border-b-2 border-slate-50 pb-6"><h4 className="text-xl font-black text-slate-800 italic uppercase">데이터 보정 정밀 비교</h4><div className="flex gap-6 text-[10px] font-black uppercase tracking-widest"><div className="flex items-center gap-2 text-slate-300"><div className="w-3 h-3 bg-slate-300 rounded-full" /> Sensor</div><div className="flex items-center gap-2 text-emerald-600"><div className="w-3 h-3 bg-emerald-600 rounded-full shadow-lg" /> Calibrated</div></div></div>
                    <div className="space-y-16">
                      <MiniBarChart label="질소 (N)" raw={sensorData.n} cal={result.calibratedN} max={500} />
                      <MiniBarChart label="인산 (P)" raw={sensorData.p} cal={result.calibratedP} max={200} />
                      <MiniBarChart label="칼륨 (K)" raw={sensorData.k} cal={result.calibratedK} max={500} />
                    </div>
                  </div>
                  {/* Score Visualization */}
                  <div className="lg:col-span-5 bg-slate-50/50 rounded-[48px] p-12 text-center flex flex-col justify-center items-center space-y-10 border border-slate-100 shadow-inner">
                    <div className="w-28 h-28 bg-white rounded-[32px] shadow-2xl flex items-center justify-center text-emerald-600 animate-bounce transition-all"><Sprout className="w-14 h-14" /></div>
                    <div className="space-y-4"><h4 className="text-3xl font-black text-slate-800 tracking-tight uppercase italic">{selectedCrop} 처방 분석 완료</h4><p className="text-lg text-slate-500 font-bold opacity-70">보정된 정밀 데이터를 기반으로 <br />최종 처방 가이드가 생성되었습니다.</p></div>
                    <div className="flex gap-4 w-full">
                       <div className="flex-1 bg-white p-8 rounded-[32px] shadow-xl border border-white hover:scale-105 transition-transform"><p className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Soil Health</p><p className="text-4xl font-black text-emerald-600 tabular-nums">{scores.health}<span className="text-lg font-normal ml-1">pts</span></p></div>
                       <div className="flex-1 bg-white p-8 rounded-[32px] shadow-xl border border-white hover:scale-105 transition-transform"><p className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Agri Match</p><p className="text-4xl font-black text-blue-600 tabular-nums">{scores.suitability}%</p></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ultimate Prescription Details */}
              <div className="bg-white rounded-[64px] border-4 border-slate-100 shadow-4xl overflow-hidden relative">
                <div className="bg-emerald-800 px-16 py-20 text-white relative border-b-[16px] border-emerald-900">
                  <div className="absolute top-0 right-0 p-16 opacity-5"><Star className="w-96 h-96 rotate-12" /></div>
                  <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-16 text-center lg:text-left">
                    <div className="space-y-4">
                      <div className="inline-flex items-center gap-3 px-5 py-2 bg-white/10 rounded-2xl text-[12px] font-black uppercase tracking-[0.4em] border border-white/10"><Star className="w-4 h-4 fill-emerald-400 text-emerald-400" /> AI-BASED GUIDELINE</div>
                      <h3 className="text-7xl font-black tracking-tighter uppercase italic">{selectedCrop} 최적 시비 가이드</h3>
                      <p className="text-xl font-bold opacity-70 tracking-widest uppercase">Precision Agri-System Result Archive v2.0</p>
                    </div>
                  </div>
                </div>

                <div className="p-16 space-y-28">
                  {/* Nutrient Detail Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                    {['n', 'p', 'k'].map((nut) => {
                      const standard = cropStandards[selectedCrop][nut];
                      const calVal = nut === 'n' ? result.calibratedN : nut === 'p' ? result.calibratedP : result.calibratedK;
                      const status = getNutrientStatus(calVal, standard.min, standard.max);
                      return (
                        <div key={nut} className={`${status.bg} border-[3px] ${status.color.replace('text', 'border')} rounded-[56px] p-12 shadow-2xl transition-all hover:translate-y-[-8px] text-center`}>
                          <div className="flex justify-between items-center mb-10 flex-col gap-6">
                            <div className={`p-5 rounded-3xl bg-white shadow-xl ${status.color}`}>{React.cloneElement(status.icon as React.ReactElement, { className: 'w-10 h-10' })}</div>
                            <span className={`px-6 py-2 rounded-full text-xs font-black bg-white shadow-md uppercase tracking-widest border border-slate-50 ${status.color}`}>{status.label}</span>
                          </div>
                          <h5 className="text-sm font-black text-slate-400 mb-3 uppercase tracking-widest italic">{nut} Analytics</h5>
                          <div className="text-[72px] font-black text-slate-900 mb-10 tracking-tighter leading-none tabular-nums">{calVal}<span className="text-xl font-normal text-slate-300 ml-3">mg/kg</span></div>
                          <div className="h-3 w-full bg-white rounded-full overflow-hidden mb-10 flex border-2 border-slate-50 shadow-inner p-0.5">
                             <div className="h-full bg-slate-100 rounded-full" style={{ width: `${(standard.min / 500) * 100}%` }} />
                             <div className="h-full bg-emerald-500 rounded-full shadow-lg" style={{ width: `${((standard.max - standard.min) / 500) * 100}%` }} />
                          </div>
                          <div className={`text-base font-black flex items-center justify-center gap-4 ${status.color} uppercase tracking-tighter`}><div className={`w-3 h-3 rounded-full animate-pulse ${status.color.replace('text', 'bg')}`} />{status.recommendation}</div>
                        </div>
                      );
                    })}
                  </div>

                  {/* AI Strategy Box */}
                  <div className="bg-slate-900 rounded-[64px] p-16 text-white relative overflow-hidden shadow-5xl border-[16px] border-slate-800">
                    <div className="absolute top-0 right-0 p-16 opacity-5 animate-spin-slow"><BrainCircuit className="w-[600px] h-[600px]" /></div>
                    <div className="relative z-10 flex flex-col xl:flex-row gap-32">
                       <div className="flex-1 space-y-14">
                          <div className="space-y-8">
                             <div className="flex items-center gap-5 mb-10"><div className="w-14 h-14 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400 border-2 border-emerald-500/20 shadow-inner"><Cpu className="w-8 h-8" /></div><h4 className="text-xl font-black text-emerald-400 uppercase tracking-[0.5em] italic">AI 처방 엔진 분석 보고</h4></div>
                             <p className="text-5xl font-black leading-[1.2] italic mb-12 tracking-tight">"{prescription.summary}"</p>
                             <p className="text-slate-400 text-xl font-medium leading-[1.8] max-w-4xl opacity-80 border-l-4 border-emerald-500/30 pl-10">{cropStandards[selectedCrop].description}</p>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 pt-8">
                             <div className="flex gap-8 group">
                                <div className="w-20 h-20 bg-emerald-500/10 rounded-[32px] flex items-center justify-center text-emerald-400 border border-emerald-500/10 shadow-inner shrink-0"><Zap className="w-10 h-10" /></div>
                                <div><p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-3">전략적 시비 권고</p><p className="text-2xl font-bold text-white leading-snug">{prescription.strategy}</p></div>
                             </div>
                             <div className="flex gap-8 group">
                                <div className="w-20 h-20 bg-blue-500/10 rounded-[32px] flex items-center justify-center text-blue-400 border border-blue-500/10 shadow-inner shrink-0"><RefreshCw className="w-10 h-10" /></div>
                                <div><p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-3">다음 정밀 분석 시점</p><p className="text-4xl font-black text-blue-400 tracking-tighter italic uppercase underline decoration-blue-500/30 decoration-8 underline-offset-8">{prescription.nextDiagnosis}</p></div>
                             </div>
                          </div>
                       </div>
                       <div className="xl:w-[420px] bg-white/5 p-12 rounded-[56px] border-2 border-white/10 backdrop-blur-3xl space-y-12 shadow-3xl text-left">
                          <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.5em] flex items-center gap-5 border-b border-white/5 pb-8"><AlertTriangle className="text-rose-500 w-8 h-8" /> 핵심 관리 리스크</p>
                          <ul className="space-y-12">
                             {prescription.precautions.map((p, i) => (
                               <li key={i} className="text-lg font-bold text-slate-200 flex items-start gap-8 leading-snug transform hover:translate-x-2 transition-transform"><div className="w-4 h-4 bg-rose-500 rounded-full mt-2 shrink-0 shadow-[0_0_20px_rgba(244,63,94,1)] animate-pulse" />{p}</li>
                             ))}
                          </ul>
                       </div>
                    </div>
                  </div>

                  {/* Farming Log Archive */}
                  <div className="bg-slate-50 rounded-[72px] border-4 border-slate-100 p-20 shadow-inner relative group overflow-hidden">
                    <div className="absolute top-0 right-0 p-20 opacity-[0.03] group-hover:rotate-12 transition-transform duration-1000"><ClipboardList className="w-[500px] h-[500px] text-slate-900" /></div>
                    <div className="flex flex-col xl:flex-row justify-between items-center mb-16 relative z-10 gap-16 text-center xl:text-left">
                       <div className="flex items-center gap-8 flex-col xl:flex-row">
                          <div className="p-6 bg-white rounded-3xl shadow-2xl transform group-hover:scale-110 transition-transform shrink-0 border border-slate-100"><FileText className="w-12 h-12 text-slate-400" /></div>
                          <div className="space-y-2"><h4 className="text-5xl font-black tracking-tighter italic text-slate-900 uppercase">AI Automated Farming Log</h4><p className="text-slate-400 text-xl font-bold uppercase tracking-widest opacity-60">오늘의 영농 데이터를 기록실로 자동 전송합니다.</p></div>
                       </div>
                       <button onClick={copyLog} className={`flex items-center gap-6 px-14 py-7 rounded-[32px] font-black text-2xl transition-all duration-500 shadow-5xl shrink-0 uppercase tracking-widest border-4 ${copySuccess ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-200' : 'bg-slate-900 text-white border-slate-800 hover:bg-slate-800'}`}>{copySuccess ? 'COPIED!' : '로그 복사하기'}</button>
                    </div>
                    <pre className="w-full bg-white p-16 rounded-[64px] border-4 border-slate-50 text-[18px] text-slate-800 font-mono leading-[2.4] whitespace-pre-wrap shadow-inner overflow-hidden transform hover:border-emerald-100 transition-all duration-700 italic border-l-[32px] border-l-emerald-900">
                       {`[농사랑 AI 영농 시스템 - 2026. DIGITAL REPORT]\n----------------------------------------------------\n▣ 진단 일시 : ${new Date().toLocaleString('ko-KR')}\n▣ 관리 구역 : AREA-A01 / SMART GRID SYSTEM\n▣ 작물 품종 : ${selectedCrop} (Hybrid Strain)\n▣ 진단 결과 : ${prescription.summary}\n▣ 보정 신뢰 : Engine Reliability Rating ${result.confidenceScore}%\n▣ 최종 처방 : ${prescription.strategy}\n▣ 주의 사항 : ${prescription.precautions.join(' / ')}\n----------------------------------------------------\n* 본 리포트는 농사랑 AI Calibration Engine v2.0에 의해 실시간 생성되었습니다.`}
                    </pre>
                  </div>

                  <div className="flex flex-col lg:flex-row gap-10 justify-center pt-20">
                    <button className="px-20 py-12 bg-white border-4 border-slate-100 rounded-[48px] font-black text-3xl text-slate-800 hover:bg-slate-50 hover:border-emerald-200 transition-all duration-500 flex items-center justify-center gap-8 shadow-4xl transform hover:translate-y-[-10px] uppercase tracking-tighter"><MapPin className="w-12 h-12 text-emerald-600" /> Cloud Archive Sync</button>
                    <button className="px-20 py-12 bg-emerald-600 text-white rounded-[48px] font-black text-3xl hover:bg-emerald-700 transition-all duration-500 shadow-[0_40px_100px_-20px_rgba(16,185,129,0.5)] flex items-center justify-center gap-8 active:scale-95 transform hover:translate-y-[-10px] uppercase tracking-tighter"><Star className="w-12 h-12 fill-white" /> 스마트 영농 시작</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
