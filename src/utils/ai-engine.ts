// --- Types ---
export interface CalibrationResult {
  calibratedN: number;
  calibratedP: number;
  calibratedK: number;
  confidenceScore: number;
  calibrationMessage: string;
}

export interface Anomaly {
  type: 'danger' | 'warning' | 'info';
  message: string;
}

export interface PrescriptionResult {
  summary: string;
  strategy: string;
  precautions: string[];
  nextDiagnosis: string;
}

// --- Data Standards ---
// 실제 서비스에서는 농촌진흥청/농사로 DB 기반으로 보정 예정
export const cropStandards: Record<string, any> = {
  "토마토": {
    n: { min: 80, max: 120 },
    p: { min: 40, max: 70 },
    k: { min: 100, max: 160 },
    description: "토마토는 과실 비대기에 칼륨 요구량이 매우 높으며, 질소 과잉 시 웃자람이 발생할 수 있습니다."
  },
  "딸기": {
    n: { min: 60, max: 90 },
    p: { min: 30, max: 50 },
    k: { min: 80, max: 120 },
    description: "딸기는 낮은 농도의 영양액을 선호하며, 고온기에는 칼슘 결핍과 함께 칼륨 밸런스가 중요합니다."
  },
  "상추": {
    n: { min: 70, max: 110 },
    p: { min: 30, max: 60 },
    k: { min: 70, max: 110 },
    description: "상추와 같은 엽채류는 질소 공급이 생육 속도를 결정하며, 과습 시 뿌리 썩음에 주의해야 합니다."
  },
  "오이": {
    n: { min: 90, max: 130 },
    p: { min: 40, max: 80 },
    k: { min: 110, max: 170 },
    description: "오이는 수분 흡수가 매우 빨라 비료 농도 변화에 민감하며 꾸준한 칼륨 보충이 필수적입니다."
  },
  "고추": {
    n: { min: 85, max: 125 },
    p: { min: 35, max: 65 },
    k: { min: 105, max: 165 },
    description: "고추는 착과기 이후 양분 소모가 급격히 늘어나므로 적기 시비 처방이 생산량을 결정합니다."
  }
};

// --- Logic: AI Calibration ---
export const calibrateSensorData = (
  rawN: number, rawP: number, rawK: number, 
  data: { ec: number; temp: number; moisture: number; rainfall: number; solar: number; }
): CalibrationResult => {
  let multiplier = 1.0;
  let messages: string[] = [];
  let confidence = 100;

  if (data.moisture < 20) { multiplier *= 0.88; confidence -= 15; messages.push("저수분 신호 약화 보정"); }
  else if (data.moisture > 65) { multiplier *= 1.12; messages.push("희석 효과 보정"); }
  
  if (data.ec > 2.5) { multiplier *= 0.92; confidence -= 10; messages.push("염류 농도 과다 보정"); }
  if (data.temp < 10 || data.temp > 35) { confidence -= 20; messages.push("온도 이탈 오차 반영"); }
  if (data.rainfall > 10) { multiplier *= 0.95; messages.push("강우 유실 가능성 반영"); }

  if (messages.length === 0) messages.push("최적 환경 내 정밀 분석 완료");

  return {
    calibratedN: Math.round(rawN * multiplier),
    calibratedP: Math.round(rawP * multiplier),
    calibratedK: Math.round(rawK * multiplier),
    confidenceScore: Math.max(45, confidence),
    calibrationMessage: messages[0]
  };
};

// --- Logic: Anomaly Detection ---
export const analyzeAnomalies = (data: { n: number; ec: number; moisture: number; rainfall: number }): Anomaly[] => {
  const anomalies: Anomaly[] = [];
  if (data.ec >= 2.5) anomalies.push({ type: 'danger', message: '염류 집적 위험: 추가 시비를 금지하고 관수를 조절하십시오.' });
  if (data.moisture < 20) anomalies.push({ type: 'warning', message: '수분 부족: 센서 측정값의 신뢰도가 낮습니다.' });
  else if (data.moisture >= 75) anomalies.push({ type: 'danger', message: '토양 과습: 뿌리 호흡 저하 및 병해 위험이 있습니다.' });
  if (data.n > 400) anomalies.push({ type: 'warning', message: '질소 과잉: 생육 불균형 및 웃자람 가능성이 있습니다.' });
  if (data.rainfall >= 20) anomalies.push({ type: 'info', message: '강우 알림: 양분 유실 방지를 위해 추비 시점을 조정하십시오.' });
  return anomalies;
};

// --- Logic: Prescription Generator ---
export const generatePrescription = (
  crop: string,
  calibrated: { n: number; p: number; k: number },
  data: { ec: number; moisture: number; rainfall: number }
): PrescriptionResult => {
  const standard = cropStandards[crop];
  const nStat = calibrated.n < standard.n.min ? '부족' : calibrated.n > standard.n.max ? '과잉' : '적정';
  const pStat = calibrated.p < standard.p.min ? '부족' : calibrated.p > standard.p.max ? '과잉' : '적정';
  const kStat = calibrated.k < standard.k.min ? '부족' : calibrated.k > standard.k.max ? '과잉' : '적정';

  let summary = `${crop} 재배 기준, 현재 질소는 ${nStat}, 인산은 ${pStat}, 칼륨은 ${kStat} 상태입니다.`;
  let strategy = nStat === '부족' ? '질소계 비료 보충이 필요합니다.' : kStat === '부족' ? '칼륨 위주의 추비를 권장합니다.' : '현재 밸런스를 유지하며 모니터링하십시오.';
  let precautions = ["정기적인 관수로 EC 농도를 관리하십시오."];
  let nextDiagnosis = "3일 후 정기 진단";

  if (data.ec > 2.5) { strategy = "EC 수치가 높으므로 관수 위주로 관리하십시오."; precautions.push("염류 장해 위험 주의"); }
  if (data.rainfall > 20) { nextDiagnosis = "강우 종료 후 즉시 재분석"; }

  return { summary, strategy, precautions, nextDiagnosis };
};

// --- Logic: Scoring ---
export const calculateScores = (
  crop: string,
  calibrated: { n: number; p: number; k: number },
  data: { ec: number; moisture: number; temp: number }
) => {
  let health = 100;
  if (data.ec > 2.2) health -= 25;
  if (data.moisture < 25 || data.moisture > 70) health -= 20;
  if (data.temp < 15 || data.temp > 32) health -= 10;

  const standard = cropStandards[crop];
  let suitability = 100;
  if (calibrated.n < standard.n.min || calibrated.n > standard.n.max) suitability -= 20;
  if (calibrated.k < standard.k.min || calibrated.k > standard.k.max) suitability -= 20;

  return { health: Math.max(30, health), suitability: Math.max(20, suitability) };
};
