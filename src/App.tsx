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
      prescription
    };
  }, [inputs]);

  return (
    <div className="min-h-screen bg-[#f6f8f5] text-[#111827] p-4 md:p-8" style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <div className="max-w-[1120px] mx-auto">
        
        {/* 1. Hero Section */}
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-bold mb-4 tracking-tight">농사랑 MVP</h1>
          <p className="text-xl text-[#0f766e] font-semibold mb-2">센서 Raw Data → AI 보정 → 작물별 처방</p>
          <p className="text-sm text-[#9ca3af]">
            본 화면은 IoT 데이터 수집부터 작물 처방까지의 AI 소프트 센싱 기술 흐름을 보여주는 프로토타입입니다.
          </p>
        </header>

        {/* 2. Technology Flow Section */}
        <div className="relative mb-16">
          <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-[#e5e7eb] -translate-y-1/2 z-0"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
            <div className="bg-white p-6 rounded-[20px] border border-[#e5e7eb] shadow-sm flex flex-col items-center text-center">
              <div className="w-10 h-10 bg-[#0f766e] text-white rounded-full flex items-center justify-center font-bold mb-4">1</div>
              <h3 className="text-lg font-bold mb-2 text-[#111827]">IoT 데이터 수집</h3>
              <p className="text-[#6b7280] text-sm leading-relaxed">
                질소(N), 인산(P), 칼륨(K) 기초 양분과<br />
                EC, 수분, 온도 데이터를 실시간 수집합니다.
              </p>
            </div>
            <div className="bg-white p-6 rounded-[20px] border border-[#e5e7eb] shadow-sm flex flex-col items-center text-center">
              <div className="w-10 h-10 bg-[#0f766e] text-white rounded-full flex items-center justify-center font-bold mb-4">2</div>
              <h3 className="text-lg font-bold mb-2 text-[#111827]">AI Calibration</h3>
              <p className="text-[#6b7280] text-sm leading-relaxed">
                토양 수분, 온도, EC 조건을 다각도로 분석하여<br />
                센서의 환경 오차를 AI로 정밀 보정합니다.
              </p>
            </div>
            <div className="bg-white p-6 rounded-[20px] border border-[#e5e7eb] shadow-sm flex flex-col items-center text-center">
              <div className="w-10 h-10 bg-[#0f766e] text-white rounded-full flex items-center justify-center font-bold mb-4">3</div>
              <h3 className="text-lg font-bold mb-2 text-[#111827]">Crop Prescription</h3>
              <p className="text-[#6b7280] text-sm leading-relaxed">
                보정된 데이터와 작물별 생육 표준을 비교하여<br />
                부족/과잉 진단 및 최종 시비 처방을 생성합니다.
              </p>
            </div>
          </div>
        </div>

        {/* 3. Demo Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          {/* STEP 1: 왼쪽 입력 카드 */}
          <div className="bg-white p-8 rounded-[24px] border border-[#e5e7eb] shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Raw Sensor Data</h2>
              <span className="px-3 py-1 bg-[#f3f4f6] text-[#6b7280] text-xs font-bold rounded-full uppercase tracking-wider">Step 1</span>
            </div>
            
            <div className="space-y-5">
              <div className="bg-[#f9fafb] p-4 rounded-xl">
                <label className="block text-sm font-semibold text-[#374151] mb-2">재배 작물</label>
                <select 
                  name="crop" 
                  value={inputs.crop} 
                  onChange={handleChange}
                  className="w-full p-3 border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f766e] bg-white text-lg font-medium"
                >
                  {Object.keys(cropStandards).map(crop => (
                    <option key={crop} value={crop}>{crop}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#6b7280] mb-1 uppercase tracking-tight">질소 (N)</label>
                  <input type="number" name="n" value={inputs.n} onChange={handleChange} className="w-full p-3 border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f766e]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#6b7280] mb-1 uppercase tracking-tight">인산 (P)</label>
                  <input type="number" name="p" value={inputs.p} onChange={handleChange} className="w-full p-3 border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f766e]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#6b7280] mb-1 uppercase tracking-tight">칼륨 (K)</label>
                  <input type="number" name="k" value={inputs.k} onChange={handleChange} className="w-full p-3 border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f766e]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#6b7280] mb-1 uppercase tracking-tight">EC (전기전도도)</label>
                  <input type="number" step="0.1" name="ec" value={inputs.ec} onChange={handleChange} className="w-full p-3 border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f766e]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#6b7280] mb-1 uppercase tracking-tight">토양 수분 (%)</label>
                  <input type="number" name="moisture" value={inputs.moisture} onChange={handleChange} className="w-full p-3 border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f766e]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#6b7280] mb-1 uppercase tracking-tight">토양 온도 (℃)</label>
                  <input type="number" name="temperature" value={inputs.temperature} onChange={handleChange} className="w-full p-3 border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f766e]" />
                </div>
              </div>

              <div className="pt-4 flex flex-wrap gap-2">
                <button onClick={() => setExample('normal')} className="flex-1 text-sm py-2.5 px-3 bg-[#f3f4f6] hover:bg-[#e5e7eb] rounded-lg transition-colors font-medium">정상 수치</button>
                <button onClick={() => setExample('salinity')} className="flex-1 text-sm py-2.5 px-3 bg-[#f3f4f6] hover:bg-[#e5e7eb] rounded-lg transition-colors font-medium text-red-600">염류 위험</button>
                <button onClick={() => setExample('deficiency')} className="flex-1 text-sm py-2.5 px-3 bg-[#f3f4f6] hover:bg-[#e5e7eb] rounded-lg transition-colors font-medium text-amber-600">양분 부족</button>
              </div>
            </div>
          </div>

          {/* 오른쪽 섹션: STEP 2 & 3 */}
          <div className="space-y-6">
            
            {/* STEP 2: AI 보정 결과 카드 */}
            <div className="bg-white p-8 rounded-[24px] border border-[#e5e7eb] shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">AI Calibration</h2>
                <span className="px-3 py-1 bg-[#0f766e] text-white text-xs font-bold rounded-full uppercase tracking-wider">Step 2</span>
              </div>
              
              <div className="mb-6 bg-[#f9fafb] p-5 rounded-xl">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-bold text-[#374151]">보정 신뢰도 (Confidence)</span>
                  <span className="text-xl font-black text-[#0f766e]">{results.reliability}%</span>
                </div>
                <div className="w-full bg-[#e5e7eb] rounded-full h-3">
                  <div 
                    className="bg-[#0f766e] h-3 rounded-full transition-all duration-700 ease-out" 
                    style={{ width: `${results.reliability}%` }}
                  ></div>
                </div>
              </div>

              <div className="overflow-hidden border border-[#e5e7eb] rounded-xl">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-[#f9fafb]">
                    <tr>
                      <th className="p-3 text-xs font-bold text-[#6b7280] uppercase border-b border-[#e5e7eb]">항목</th>
                      <th className="p-3 text-xs font-bold text-[#6b7280] uppercase border-b border-[#e5e7eb]">Raw</th>
                      <th className="p-3 text-xs font-bold text-[#0f766e] uppercase border-b border-[#e5e7eb]">AI 보정값</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e5e7eb]">
                    {[
                      { label: '질소 (N)', raw: inputs.n, cal: results.calN },
                      { label: '인산 (P)', raw: inputs.p, cal: results.calP },
                      { label: '칼륨 (K)', raw: inputs.k, cal: results.calK },
                    ].map((item) => (
                      <tr key={item.label}>
                        <td className="p-3 text-sm font-semibold">{item.label}</td>
                        <td className="p-3 text-sm text-[#9ca3af]">{item.raw}</td>
                        <td className="p-3 text-sm font-bold text-[#111827]">{item.cal}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* STEP 3: 작물별 처방 결과 카드 */}
            <div className="bg-[#0f766e] p-8 rounded-[24px] shadow-lg text-white">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Crop Prescription</h2>
                <span className="px-3 py-1 bg-white/20 text-white text-xs font-bold rounded-full uppercase tracking-wider">Step 3</span>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white/10 p-3 rounded-xl border border-white/10">
                  <p className="text-[10px] font-bold text-white/60 mb-1 uppercase">질소 (N)</p>
                  <StatusBadge status={results.statusN} dark />
                </div>
                <div className="bg-white/10 p-3 rounded-xl border border-white/10">
                  <p className="text-[10px] font-bold text-white/60 mb-1 uppercase">인산 (P)</p>
                  <StatusBadge status={results.statusP} dark />
                </div>
                <div className="bg-white/10 p-3 rounded-xl border border-white/10">
                  <p className="text-[10px] font-bold text-white/60 mb-1 uppercase">칼륨 (K)</p>
                  <StatusBadge status={results.statusK} dark />
                </div>
              </div>

              <div className="bg-white rounded-xl p-5 text-[#111827]">
                <h3 className="text-xs font-black text-[#0f766e] mb-2 uppercase tracking-widest">최종 처방 의견</h3>
                <p className="text-base font-bold leading-relaxed">
                  {results.prescription}
                </p>
              </div>
            </div>

          </div>
        </div>
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
    <span className={`px-2 py-1 rounded-md text-[13px] font-black block text-center ${colorClass}`}>
      {status}
    </span>
  );
};

export default App;
