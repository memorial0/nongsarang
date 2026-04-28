import React, { useState, useMemo } from 'react';

// 작물별 기준값 정의
const cropStandards: Record<string, { n: { min: number; max: number }; p: { min: number; max: number }; k: { min: number; max: number } }> = {
  '토마토': {
    n: { min: 80, max: 130 },
    p: { min: 35, max: 70 },
    k: { min: 120, max: 190 }
  },
  '딸기': {
    n: { min: 60, max: 110 },
    p: { min: 30, max: 60 },
    k: { min: 90, max: 150 }
  },
  '상추': {
    n: { min: 50, max: 100 },
    p: { min: 25, max: 55 },
    k: { min: 70, max: 130 }
  },
  '오이': {
    n: { min: 80, max: 140 },
    p: { min: 35, max: 75 },
    k: { min: 110, max: 180 }
  },
  '고추': {
    n: { min: 70, max: 120 },
    p: { min: 30, max: 65 },
    k: { min: 100, max: 170 }
  }
};

type CropType = keyof typeof cropStandards;

interface SensorData {
  crop: CropType;
  n: number;
  p: number;
  k: number;
  ec: number;
  moisture: number;
  temperature: number;
}

const App: React.FC = () => {
  // 상태 관리
  const [currentStep, setCurrentStep] = useState(0);
  const [inputs, setInputs] = useState<SensorData>({
    crop: '토마토',
    n: 100,
    p: 50,
    k: 150,
    ec: 1.5,
    moisture: 40,
    temperature: 24
  });

  // 입력 변경 핸들러
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setInputs(prev => ({
      ...prev,
      [name]: name === 'crop' ? value : parseFloat(value) || 0
    }));
  };

  // 예시 버튼 핸들러
  const setExample = (type: 'normal' | 'salinity' | 'deficiency') => {
    if (type === 'normal') {
      setInputs({ crop: '토마토', n: 105, p: 52, k: 155, ec: 1.8, moisture: 45, temperature: 24 });
    } else if (type === 'salinity') {
      setInputs({ crop: '토마토', n: 150, p: 80, k: 210, ec: 3.2, moisture: 30, temperature: 28 });
    } else if (type === 'deficiency') {
      setInputs({ crop: '토마토', n: 50, p: 20, k: 80, ec: 0.8, moisture: 15, temperature: 20 });
    }
  };

  // AI 보정 및 결과 계산
  const results = useMemo(() => {
    const { n, p, k, ec, moisture, temperature, crop } = inputs;
    const standard = cropStandards[crop];

    // 보정 계수
    const moistureFactor = moisture < 20 ? 0.92 : moisture <= 60 ? 1.00 : 1.06;
    const ecFactor = ec >= 3.0 ? 0.92 : ec >= 2.5 ? 0.96 : 1.00;
    const tempFactor = (temperature < 10 || temperature > 35) ? 0.95 : 1.00;

    // 보정값 계산
    const calN = Math.round(n * moistureFactor * ecFactor * tempFactor);
    const calP = Math.round(p * moistureFactor * tempFactor);
    const calK = Math.round(k * moistureFactor * ecFactor);

    // 상태 판단 함수
    const getStatus = (val: number, range: { min: number; max: number }) => {
      if (val < range.min) return '부족';
      if (val > range.max) return '과잉';
      return '적정';
    };

    const statusN = getStatus(calN, standard.n);
    const statusP = getStatus(calP, standard.p);
    const statusK = getStatus(calK, standard.k);

    // 신뢰도 계산
    let reliability = 100;
    if (moisture < 20 || moisture > 70) reliability -= 20;
    if (ec >= 2.5) reliability -= 15;
    if (temperature < 10 || temperature > 35) reliability -= 15;
    if (statusN !== '적정' || statusP !== '적정' || statusK !== '적정') reliability -= 10;
    
    reliability = Math.max(40, Math.min(98, reliability));

    // 처방 문장 생성
    let prescription = `질소 ${statusN}, 인산 ${statusP}, 칼륨 ${statusK} 상태입니다. `;
    
    const prescriptions: string[] = [];
    if (statusN === '부족') prescriptions.push('질소계 비료 보충');
    else if (statusN === '과잉') prescriptions.push('질소계 비료 투입 보류');

    if (statusP === '부족') prescriptions.push('인산계 비료 보충');
    else if (statusP === '과잉') prescriptions.push('인산계 비료 투입 보류');

    if (statusK === '부족') prescriptions.push('칼륨계 비료 분할 시비');
    else if (statusK === '과잉') prescriptions.push('칼륨계 비료 투입 보류');

    prescription += prescriptions.join(', ') + (prescriptions.length > 0 ? '이 필요합니다.' : '상태가 양호합니다.');

    if (ec >= 2.5) {
      prescription += ' 염류 집적 위험이 있으므로 관수 후 재진단을 권장합니다.';
    }

    return {
      calN, calP, calK,
      statusN, statusP, statusK,
      reliability,
      prescription,
      factors: {
        moisture: moistureFactor,
        ec: ecFactor,
        temp: tempFactor
      }
    };
  }, [inputs]);

  // 진행 표시 컴포넌트
  const ProgressBar = () => {
    const steps = ['개요', '데이터 수집', 'AI 보정', '작물별 처방'];
    return (
      <div className="flex items-center justify-center mb-12 space-x-4 md:space-x-8">
        {steps.map((step, idx) => (
          <React.Fragment key={step}>
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mr-2 ${currentStep === idx ? 'bg-[#0f766e] text-white shadow-lg' : currentStep > idx ? 'bg-[#0f766e]/20 text-[#0f766e]' : 'bg-[#e5e7eb] text-[#9ca3af]'}`}>
                {idx + 1}
              </div>
              <span className={`text-sm font-bold ${currentStep === idx ? 'text-[#0f766e]' : 'text-[#9ca3af]'}`}>{step}</span>
            </div>
            {idx < steps.length - 1 && <div className="w-8 md:w-16 h-0.5 bg-[#e5e7eb]"></div>}
          </React.Fragment>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f6f8f5] text-[#111827] p-4 md:p-8" style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <div className="max-w-[800px] mx-auto">
        
        {/* 상단 진행 표시 */}
        <ProgressBar />

        {/* Step 0: 기술 개요 */}
        {currentStep === 0 && (
          <div className="bg-white p-10 rounded-[32px] border border-[#e5e7eb] shadow-sm text-center">
            <h1 className="text-4xl font-black mb-4 tracking-tight">농사랑 MVP</h1>
            <p className="text-xl text-[#0f766e] font-bold mb-8">센서 Raw Data → AI 보정 → 작물별 처방</p>
            
            <p className="text-[#6b7280] leading-relaxed mb-12 text-lg">
              저가형 NPK 센서 데이터를 토양 수분·온도·EC 조건과 함께 보정하여<br />
              작물별 최적 시비 처방으로 변환하는 기술 데모입니다.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-[#f9fafb] p-6 rounded-2xl border border-[#e5e7eb]">
                <div className="text-[#0f766e] font-black text-2xl mb-2">1</div>
                <div className="font-bold text-[#111827]">IoT 데이터 수집</div>
              </div>
              <div className="bg-[#f9fafb] p-6 rounded-2xl border border-[#e5e7eb]">
                <div className="text-[#0f766e] font-black text-2xl mb-2">2</div>
                <div className="font-bold text-[#111827]">AI 실시간 보정</div>
              </div>
              <div className="bg-[#f9fafb] p-6 rounded-2xl border border-[#e5e7eb]">
                <div className="text-[#0f766e] font-black text-2xl mb-2">3</div>
                <div className="font-bold text-[#111827]">작물별 처방</div>
              </div>
            </div>

            <button 
              onClick={() => setCurrentStep(1)}
              className="w-full md:w-64 py-4 bg-[#0f766e] text-white text-xl font-bold rounded-2xl shadow-lg hover:bg-[#0d635c] transition-all transform hover:scale-[1.02]"
            >
              데모 시작하기
            </button>
          </div>
        )}

        {/* Step 1: IoT 데이터 수집 */}
        {currentStep === 1 && (
          <div className="bg-white p-10 rounded-[32px] border border-[#e5e7eb] shadow-sm">
            <div className="mb-8">
              <h2 className="text-3xl font-black mb-2">Step 1. IoT 데이터 수집</h2>
              <p className="text-[#6b7280]">저가형 센서에서 NPK, EC, 토양 수분, 토양 온도 데이터를 수집합니다.</p>
            </div>
            
            <div className="space-y-6">
              <div className="bg-[#f9fafb] p-6 rounded-2xl">
                <label className="block text-sm font-bold text-[#374151] mb-2 uppercase tracking-wider">재배 작물 선택</label>
                <select 
                  name="crop" 
                  value={inputs.crop} 
                  onChange={handleChange}
                  className="w-full p-4 border border-[#e5e7eb] rounded-xl focus:outline-none focus:ring-4 focus:ring-[#0f766e]/10 bg-white text-xl font-bold"
                >
                  {Object.keys(cropStandards).map(crop => (
                    <option key={crop} value={crop}>{crop}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {[
                  { id: 'n', label: '질소 (N)', unit: 'mg/kg' },
                  { id: 'p', label: '인산 (P)', unit: 'mg/kg' },
                  { id: 'k', label: '칼륨 (K)', unit: 'mg/kg' },
                  { id: 'ec', label: 'EC', step: '0.1', unit: 'dS/m' },
                  { id: 'moisture', label: '토양 수분', unit: '%' },
                  { id: 'temperature', label: '토양 온도', unit: '℃' },
                ].map((field) => (
                  <div key={field.id}>
                    <label className="block text-xs font-bold text-[#6b7280] mb-2 uppercase tracking-tighter">{field.label}</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        step={field.step || '1'}
                        name={field.id} 
                        value={(inputs as any)[field.id]} 
                        onChange={handleChange} 
                        className="w-full p-4 border border-[#e5e7eb] rounded-xl focus:outline-none focus:ring-4 focus:ring-[#0f766e]/10 text-xl font-bold"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#9ca3af] uppercase">{field.unit}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-6 flex flex-wrap gap-3">
                <button onClick={() => setExample('normal')} className="flex-1 py-3 px-4 bg-[#f3f4f6] hover:bg-[#e5e7eb] rounded-xl text-sm font-bold">정상 예시</button>
                <button onClick={() => setExample('salinity')} className="flex-1 py-3 px-4 bg-[#f3f4f6] hover:bg-[#e5e7eb] rounded-xl text-sm font-bold text-red-600">염류 위험 예시</button>
                <button onClick={() => setExample('deficiency')} className="flex-1 py-3 px-4 bg-[#f3f4f6] hover:bg-[#e5e7eb] rounded-xl text-sm font-bold text-amber-600">양분 부족 예시</button>
              </div>

              <div className="pt-8">
                <button 
                  onClick={() => setCurrentStep(2)}
                  className="w-full py-5 bg-[#0f766e] text-white text-xl font-bold rounded-2xl shadow-lg hover:bg-[#0d635c] transition-all"
                >
                  AI 보정 단계로 이동
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: AI 실시간 보정 */}
        {currentStep === 2 && (
          <div className="space-y-8">
            <div className="bg-white p-10 rounded-[32px] border border-[#e5e7eb] shadow-sm">
              <div className="mb-10">
                <h2 className="text-3xl font-black mb-2">Step 2. AI 실시간 보정</h2>
                <p className="text-[#6b7280]">토양 수분, 온도, EC 조건을 반영해 저가형 센서의 물리적 오차를 보정합니다.</p>
              </div>

              <div className="mb-12 bg-[#f9fafb] p-8 rounded-[24px]">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-bold text-[#374151]">AI 보정 신뢰도</span>
                  <span className="text-3xl font-black text-[#0f766e]">{results.reliability}%</span>
                </div>
                <div className="w-full bg-[#e5e7eb] rounded-full h-4">
                  <div 
                    className="bg-[#0f766e] h-4 rounded-full transition-all duration-1000 ease-out" 
                    style={{ width: `${results.reliability}%` }}
                  ></div>
                </div>
              </div>

              <div className="mb-10 overflow-hidden border border-[#e5e7eb] rounded-2xl">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-[#f9fafb]">
                    <tr>
                      <th className="p-4 text-xs font-black text-[#6b7280] uppercase tracking-widest border-b border-[#e5e7eb]">항목</th>
                      <th className="p-4 text-xs font-black text-[#6b7280] uppercase tracking-widest border-b border-[#e5e7eb]">Raw Data</th>
                      <th className="p-4 text-xs font-black text-[#0f766e] uppercase tracking-widest border-b border-[#e5e7eb]">AI 보정값</th>
                      <th className="p-4 text-xs font-black text-[#6b7280] uppercase tracking-widest border-b border-[#e5e7eb]">변화량</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e5e7eb]">
                    {[
                      { label: '질소 (N)', raw: inputs.n, cal: results.calN },
                      { label: '인산 (P)', raw: inputs.p, cal: results.calP },
                      { label: '칼륨 (K)', raw: inputs.k, cal: results.calK },
                    ].map((item) => (
                      <tr key={item.label} className="hover:bg-[#f9fafb]">
                        <td className="p-4 text-base font-bold">{item.label}</td>
                        <td className="p-4 text-base text-[#9ca3af]">{item.raw}</td>
                        <td className="p-4 text-xl font-black text-[#111827]">{item.cal}</td>
                        <td className={`p-4 text-sm font-bold ${item.cal > item.raw ? 'text-green-600' : item.cal < item.raw ? 'text-red-600' : 'text-[#9ca3af]'}`}>
                          {item.cal - item.raw > 0 ? `+${item.cal - item.raw}` : item.cal - item.raw}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                <div className="bg-[#f0f9ff] p-4 rounded-2xl border border-[#bae6fd]">
                  <p className="text-[10px] font-black text-[#0369a1] uppercase mb-1">수분 보정 계수</p>
                  <p className="text-xl font-black text-[#0c4a6e]">x{results.factors.moisture.toFixed(2)}</p>
                </div>
                <div className="bg-[#f0fdf4] p-4 rounded-2xl border border-[#bbf7d0]">
                  <p className="text-[10px] font-black text-[#166534] uppercase mb-1">EC 보정 계수</p>
                  <p className="text-xl font-black text-[#064e3b]">x{results.factors.ec.toFixed(2)}</p>
                </div>
                <div className="bg-[#fff7ed] p-4 rounded-2xl border border-[#fed7aa]">
                  <p className="text-[10px] font-black text-[#9a3412] uppercase mb-1">온도 보정 계수</p>
                  <p className="text-xl font-black text-[#7c2d12]">x{results.factors.temp.toFixed(2)}</p>
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setCurrentStep(1)}
                  className="flex-1 py-4 border-2 border-[#e5e7eb] text-[#6b7280] text-lg font-bold rounded-2xl hover:bg-[#f9fafb] transition-all"
                >
                  입력값 수정
                </button>
                <button 
                  onClick={() => setCurrentStep(3)}
                  className="flex-[2] py-4 bg-[#0f766e] text-white text-lg font-bold rounded-2xl shadow-lg hover:bg-[#0d635c] transition-all"
                >
                  작물별 처방 단계로 이동
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: 작물별 처방 */}
        {currentStep === 3 && (
          <div className="space-y-8">
            <div className="bg-white p-10 rounded-[32px] border border-[#e5e7eb] shadow-sm">
              <div className="mb-10">
                <h2 className="text-3xl font-black mb-2">Step 3. 작물별 시비 처방</h2>
                <p className="text-[#6b7280]">보정된 NPK 값을 작물별 생육 기준과 비교하여 최종 처방을 생성합니다.</p>
              </div>

              <div className="bg-[#0f766e] p-8 rounded-[24px] shadow-xl text-white mb-8">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-1">선택 작물</p>
                    <h3 className="text-4xl font-black">{inputs.crop}</h3>
                  </div>
                  <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm">
                    <p className="text-[10px] font-black uppercase text-center mb-1">진단 상태</p>
                    <p className="text-2xl font-black">정밀 진단 중</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-10">
                  {[
                    { label: '질소 (N)', status: results.statusN },
                    { label: '인산 (P)', status: results.statusP },
                    { label: '칼륨 (K)', status: results.statusK },
                  ].map((item) => (
                    <div key={item.label} className="bg-white/10 p-4 rounded-2xl border border-white/10 text-center">
                      <p className="text-[10px] font-bold text-white/60 mb-2 uppercase">{item.label}</p>
                      <StatusBadge status={item.status} dark />
                    </div>
                  ))}
                </div>

                <div className="bg-white rounded-2xl p-6 text-[#111827]">
                  <h4 className="text-xs font-black text-[#0f766e] mb-3 uppercase tracking-widest border-b border-[#f3f4f6] pb-2">최종 시비 처방 의견</h4>
                  <p className="text-xl font-bold leading-relaxed tracking-tight">
                    {results.prescription}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <button 
                  onClick={() => setCurrentStep(2)}
                  className="w-full py-4 border-2 border-[#e5e7eb] text-[#6b7280] text-lg font-bold rounded-2xl hover:bg-[#f9fafb] transition-all"
                >
                  AI 보정 단계로 돌아가기
                </button>
                <button 
                  onClick={() => setCurrentStep(0)}
                  className="w-full py-5 bg-[#111827] text-white text-xl font-bold rounded-2xl shadow-lg hover:bg-black transition-all"
                >
                  처음부터 다시
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// 상태 배지 컴포넌트
const StatusBadge: React.FC<{ status: string; dark?: boolean }> = ({ status, dark }) => {
  let colorClass = "bg-green-100 text-green-700";
  if (status === '부족') colorClass = dark ? "bg-amber-400 text-amber-950" : "bg-amber-100 text-amber-700";
  if (status === '과잉') colorClass = dark ? "bg-red-400 text-red-950" : "bg-red-100 text-red-700";
  if (status === '적정' && dark) colorClass = "bg-emerald-400 text-emerald-950";
  
  return (
    <span className={`px-2 py-2 rounded-xl text-sm font-black block text-center shadow-sm ${colorClass}`}>
      {status}
    </span>
  );
};

export default App;
