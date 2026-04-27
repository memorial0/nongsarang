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
    let prescription = `현재 ${crop} 기준에서 질소는 ${statusN}, 인산은 ${statusP}, 칼륨은 ${statusK} 상태입니다. `;
    
    const prescriptions: string[] = [];
    if (statusN === '부족') prescriptions.push('질소계 비료 보충 권장');
    else if (statusN === '과잉') prescriptions.push('질소계 비료 투입 보류');

    if (statusP === '부족') prescriptions.push('인산계 비료 보충 권장');
    else if (statusP === '과잉') prescriptions.push('인산계 비료 투입 보류');

    if (statusK === '부족') prescriptions.push('칼륨계 비료 분할 시비 권장');
    else if (statusK === '과잉') prescriptions.push('칼륨계 비료 투입 보류');

    prescription += prescriptions.join(', ') + (prescriptions.length > 0 ? '하는 것을 권장합니다. ' : '상태가 양호합니다. ');

    if (ec >= 2.5) {
      prescription += '또한 EC 수치가 높아 염류 집적 위험이 있으므로 전체 시비량을 줄이고 관수 후 재진단을 권장합니다.';
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
        
        {/* 상단 Hero */}
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-bold mb-4">농사랑 MVP</h1>
          <p className="text-xl text-[#6b7280] mb-2">센서 Raw Data → AI 보정 → 작물별 처방</p>
          <p className="text-sm text-[#9ca3af]">
            본 화면은 실제 농업 처방을 대체하는 것이 아니라, AI 소프트 센싱 흐름을 보여주는 발표용 프로토타입입니다.
          </p>
        </header>

        {/* Step Flow */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-6 rounded-[16px] border border-[#e5e7eb] shadow-sm">
            <h3 className="text-lg font-bold mb-2 text-[#0f766e]">① IoT 데이터 수집</h3>
            <p className="text-[#6b7280] text-sm">저가형 NPK 센서를 통해 토양의 기초 데이터를 실시간 수집합니다.</p>
          </div>
          <div className="bg-white p-6 rounded-[16px] border border-[#e5e7eb] shadow-sm">
            <h3 className="text-lg font-bold mb-2 text-[#0f766e]">② AI 보정</h3>
            <p className="text-[#6b7280] text-sm">토양 수분, 온도, EC 값을 활용해 센서 오차를 AI로 정밀 보정합니다.</p>
          </div>
          <div className="bg-white p-6 rounded-[16px] border border-[#e5e7eb] shadow-sm">
            <h3 className="text-lg font-bold mb-2 text-[#0f766e]">③ 작물별 처방</h3>
            <p className="text-[#6b7280] text-sm">보정된 데이터와 작물별 최적 생육 기준을 비교하여 처방을 생성합니다.</p>
          </div>
        </div>

        {/* Main Demo */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* 왼쪽 입력 카드 */}
          <div className="bg-white p-8 rounded-[16px] border border-[#e5e7eb] shadow-sm">
            <h2 className="text-2xl font-bold mb-6">Raw Sensor Data</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#6b7280] mb-1">작물 선택</label>
                <select 
                  name="crop" 
                  value={inputs.crop} 
                  onChange={handleChange}
                  className="w-full p-3 border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f766e] bg-white"
                >
                  {Object.keys(cropStandards).map(crop => (
                    <option key={crop} value={crop}>{crop}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#6b7280] mb-1">질소 (N)</label>
                  <input type="number" name="n" value={inputs.n} onChange={handleChange} className="w-full p-3 border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f766e]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#6b7280] mb-1">인산 (P)</label>
                  <input type="number" name="p" value={inputs.p} onChange={handleChange} className="w-full p-3 border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f766e]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#6b7280] mb-1">칼륨 (K)</label>
                  <input type="number" name="k" value={inputs.k} onChange={handleChange} className="w-full p-3 border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f766e]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#6b7280] mb-1">EC (전기전도도)</label>
                  <input type="number" step="0.1" name="ec" value={inputs.ec} onChange={handleChange} className="w-full p-3 border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f766e]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#6b7280] mb-1">토양 수분 (%)</label>
                  <input type="number" name="moisture" value={inputs.moisture} onChange={handleChange} className="w-full p-3 border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f766e]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#6b7280] mb-1">토양 온도 (℃)</label>
                  <input type="number" name="temperature" value={inputs.temperature} onChange={handleChange} className="w-full p-3 border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f766e]" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-4">
                <button onClick={() => setExample('normal')} className="text-sm py-2 px-1 bg-[#f3f4f6] hover:bg-[#e5e7eb] rounded-md transition-colors">정상 예시</button>
                <button onClick={() => setExample('salinity')} className="text-sm py-2 px-1 bg-[#f3f4f6] hover:bg-[#e5e7eb] rounded-md transition-colors">염류 위험 예시</button>
                <button onClick={() => setExample('deficiency')} className="text-sm py-2 px-1 bg-[#f3f4f6] hover:bg-[#e5e7eb] rounded-md transition-colors">양분 부족 예시</button>
              </div>
            </div>
          </div>

          {/* 오른쪽 결과 카드 */}
          <div className="bg-white p-8 rounded-[16px] border border-[#e5e7eb] shadow-sm">
            <h2 className="text-2xl font-bold mb-6">AI Calibration Result</h2>
            
            <div className="mb-8">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-[#6b7280]">AI 보정 신뢰도</span>
                <span className="text-lg font-bold text-[#0f766e]">{results.reliability}%</span>
              </div>
              <div className="w-full bg-[#f3f4f6] rounded-full h-2.5">
                <div 
                  className="bg-[#0f766e] h-2.5 rounded-full transition-all duration-500" 
                  style={{ width: `${results.reliability}%` }}
                ></div>
              </div>
            </div>

            <div className="mb-8 overflow-hidden border border-[#e5e7eb] rounded-lg">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#f9fafb]">
                  <tr>
                    <th className="p-3 text-xs font-semibold text-[#6b7280] uppercase border-b border-[#e5e7eb]">항목</th>
                    <th className="p-3 text-xs font-semibold text-[#6b7280] uppercase border-b border-[#e5e7eb]">Raw</th>
                    <th className="p-3 text-xs font-semibold text-[#6b7280] uppercase border-b border-[#e5e7eb]">AI 보정값</th>
                    <th className="p-3 text-xs font-semibold text-[#6b7280] uppercase border-b border-[#e5e7eb]">상태</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5e7eb]">
                  <tr>
                    <td className="p-3 text-sm font-medium">질소 (N)</td>
                    <td className="p-3 text-sm text-[#6b7280]">{inputs.n}</td>
                    <td className="p-3 text-sm font-bold">{results.calN}</td>
                    <td className="p-3 text-sm">
                      <StatusBadge status={results.statusN} />
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 text-sm font-medium">인산 (P)</td>
                    <td className="p-3 text-sm text-[#6b7280]">{inputs.p}</td>
                    <td className="p-3 text-sm font-bold">{results.calP}</td>
                    <td className="p-3 text-sm">
                      <StatusBadge status={results.statusP} />
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 text-sm font-medium">칼륨 (K)</td>
                    <td className="p-3 text-sm text-[#6b7280]">{inputs.k}</td>
                    <td className="p-3 text-sm font-bold">{results.calK}</td>
                    <td className="p-3 text-sm">
                      <StatusBadge status={results.statusK} />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="bg-[#f0f9ff] p-6 rounded-xl border border-[#bae6fd]">
              <h3 className="text-lg font-bold mb-3 text-[#0369a1]">작물별 시비 처방</h3>
              <p className="text-sm leading-relaxed text-[#0c4a6e]">
                {results.prescription}
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

// 상태 배지 컴포넌트
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  let colorClass = "bg-green-100 text-green-700";
  if (status === '부족') colorClass = "bg-amber-100 text-amber-700";
  if (status === '과잉') colorClass = "bg-red-100 text-red-700";
  
  return (
    <span className={`px-2 py-1 rounded text-xs font-bold ${colorClass}`}>
      {status}
    </span>
  );
};

export default App;
