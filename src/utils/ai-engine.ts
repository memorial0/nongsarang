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
    description: "딸기는 낮은 농도의 영양액을 선호하며, 정밀한 칼륨 밸런스가 당도를 결정합니다."
  },
  "상추": {
    n: { min: 70, max: 110 },
    p: { min: 30, max: 60 },
    k: { min: 70, max: 110 },
    description: "상추는 질소 공급이 생육 속도를 결정하며, 과습 시 뿌리 활력이 저하됩니다."
  },
  "오이": {
    n: { min: 90, max: 130 },
    p: { min: 40, max: 80 },
    k: { min: 110, max: 170 },
    description: "오이는 수분 흡수가 매우 빨라 비료 농도 변화에 민감하므로 꾸준한 공급이 필요합니다."
  },
  "고추": {
    n: { min: 85, max: 125 },
    p: { min: 35, max: 65 },
    k: { min: 105, max: 165 },
    description: "고추는 착과기 이후 양분 소모가 급격히 늘어나므로 적기 시비가 필수적입니다."
  }
};

// --- Logic: AI Calibration ---
export const calibrateSensorData = (
  rawN: number, rawP: number, rawK: number, 
  data: { ec: number; temp: number; moisture: number; rainfall: number; solar: number; }
): CalibrationResult => {
  let multiplier = 1.0;
  let confidence = 100;
  let message = "최적 환경 내 정밀 분석 완료";

  if (data.moisture < 20) { multiplier *= 0.85; confidence -= 20; message = "저수분 신호 약화 보정 적용"; }
  else if (data.moisture > 70) { multiplier *= 1.15; confidence -= 15; message = "고수분 희석 효과 보정 적용"; }
  
  if (data.ec >= 2.5) confidence -= 15;
  if (data.temp < 10 || data.temp > 35) confidence -= 10;
  if (data.rainfall >= 20) { multiplier *= 0.95; confidence -= 10; }

  return {
    calibratedN: Math.round(rawN * multiplier),
    calibratedP: Math.round(rawP * multiplier),
    calibratedK: Math.round(rawK * multiplier),
    confidenceScore: Math.max(0, confidence),
    calibrationMessage: message
  };
};

// --- Logic: Anomaly Detection ---
export const analyzeAnomalies = (data: { n: number; ec: number; moisture: number; rainfall: number; temp: number; }): Anomaly[] => {
  const anomalies: Anomaly[] = [];
  if (data.ec >= 2.5) anomalies.push({ type: 'danger', message: '염류 집적 위험: 추가 시비를 중단하고 관수 또는 토양 세척을 권장합니다.' });
  if (data.moisture < 20) anomalies.push({ type: 'warning', message: '토양 건조: 수분이 낮아 센서 측정값의 신뢰도가 저하될 수 있습니다.' });
  if (data.moisture > 70) anomalies.push({ type: 'danger', message: '과습 위험: 양분 흡수 저하 또는 뿌리 손상 위험이 있습니다.' });
  if (data.rainfall >= 20) anomalies.push({ type: 'info', message: '양분 유실 가능성: 강우로 인해 비료 효율이 낮아질 수 있으니 강우 후 재진단을 권장합니다.' });
  if (data.temp < 10 || data.temp > 35) anomalies.push({ type: 'warning', message: '온도 불안정: 극한 기온으로 인해 생육 및 센서 안정성이 낮아질 수 있습니다.' });
  return anomalies;
};

// --- Logic: Dynamic Prescription ---
export const generatePrescription = (
  crop: string,
  cal: { n: number; p: number; k: number },
  env: { ec: number; moisture: number; rainfall: number }
): PrescriptionResult => {
  const std = cropStandards[crop];
  let summaryParts: string[] = [];
  let strategies: string[] = [];
  let precautions: string[] = [];
  let nextDiagnosis = "3일 후 정기 진단";

  const checkNutrient = (val: number, range: any, name: string, fertName: string) => {
    if (val < range.min) {
      summaryParts.push(`${name} 부족`);
      strategies.push(`${name === '칼륨 (K)' ? fertName + '계 비료 분할 시비' : fertName + '계 비료 보충'}을 권장합니다.`);
    } else if (val > range.max) {
      summaryParts.push(`${name} 과잉`);
      strategies.push(`${fertName}계 비료 투입 보류를 안내합니다.`);
    }
  };

  checkNutrient(cal.n, std.n, "질소 (N)", "질소");
  checkNutrient(cal.p, std.p, "인산 (P)", "인산");
  checkNutrient(cal.k, std.k, "칼륨 (K)", "칼륨");

  if (summaryParts.length === 0) {
    summaryParts.push("영양 상태 적정");
    strategies.push("현재 상태를 유지하며 정기적으로 모니터링하십시오.");
  }

  let summary = `현재 ${crop} 재배 기준에서 ${summaryParts.join(', ')} 상태입니다.`;
  let strategy = strategies.join(' ');

  if (env.ec >= 2.5) {
    strategy = "EC가 높으므로 전체 시비량을 대폭 줄이고 관수 또는 토양 세척을 최우선으로 권장합니다.";
  }
  if (env.moisture < 20) {
    strategy = "토양이 매우 건조하므로 충분한 관수 후 재측정을 권장합니다.";
  } else if (env.moisture > 70) {
    strategy = "과습 상태이므로 배수 관리 후 재진단을 권장합니다.";
  }
  if (env.rainfall >= 20) {
    strategy = "강우량이 많으므로 즉시 시비보다 강우 종료 후 재진단을 권장합니다.";
  }

  return { summary, strategy, precautions, nextDiagnosis };
};

// --- Logic: Health Scoring ---
export const calculateScores = (
  crop: string,
  cal: { n: number; p: number; k: number },
  env: { ec: number; moisture: number; temp: number }
) => {
  const std = cropStandards[crop];
  let health = 100;

  // NPK Balance
  if (cal.n < std.n.min || cal.n > std.n.max) health -= 10;
  if (cal.p < std.p.min || cal.p > std.p.max) health -= 10;
  if (cal.k < std.k.min || cal.k > std.k.max) health -= 10;

  // Env
  if (env.ec >= 2.5) health -= 25;
  if (env.moisture < 25 || env.moisture > 65) health -= 15;
  if (env.temp < 15 || env.temp > 32) health -= 10;

  let suitability = 100;
  const nDev = Math.abs((std.n.min + std.n.max) / 2 - cal.n) / ((std.n.min + std.n.max) / 2);
  const kDev = Math.abs((std.k.min + std.k.max) / 2 - cal.k) / ((std.k.min + std.k.max) / 2);
  suitability -= (nDev + kDev) * 50;

  return { 
    health: Math.max(5, health), 
    suitability: Math.max(5, Math.round(suitability)) 
  };
};
