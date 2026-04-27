// [공지] 본 기준값 및 로직은 발표용 데모 기준입니다.
// 실제 서비스에서는 농촌진흥청 농사로, 토양검정 DB, 작물별 표준시비량 데이터를 기반으로 고도화 예정입니다.

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

// 1. 작물별 NPK 적정 기준
export const cropStandards: Record<string, any> = {
  "토마토": { name: "토마토", n: { min: 80, max: 130 }, p: { min: 35, max: 70 }, k: { min: 120, max: 190 } },
  "딸기": { name: "딸기", n: { min: 60, max: 110 }, p: { min: 30, max: 60 }, k: { min: 90, max: 150 } },
  "상추": { name: "상추", n: { min: 50, max: 100 }, p: { min: 25, max: 55 }, k: { min: 70, max: 130 } },
  "오이": { name: "오이", n: { min: 80, max: 140 }, p: { min: 35, max: 75 }, k: { min: 110, max: 180 } },
  "고추": { name: "고추", n: { min: 70, max: 120 }, p: { min: 30, max: 65 }, k: { min: 100, max: 170 } }
};

// 2. AI 보정 시뮬레이션 (Rule-based Soft-Sensing)
export const calibrateSensorData = (
  rawN: number, rawP: number, rawK: number, 
  data: { ec: number; temp: number; moisture: number; rainfall: number; solar: number; }
): CalibrationResult => {
  const mF = data.moisture < 20 ? 0.92 : data.moisture <= 60 ? 1.00 : 1.06;
  const eF = data.ec >= 3.0 ? 0.92 : data.ec >= 2.5 ? 0.96 : 1.00;
  const tF = (data.temp < 10 || data.temp > 35) ? 0.95 : 1.00;
  const rF = data.rainfall >= 20 ? 0.90 : data.rainfall >= 10 ? 0.95 : 1.00;

  const calN = Math.round(rawN * mF * eF * tF * rF);
  const calP = Math.round(rawP * mF * tF);
  const calK = Math.round(rawK * mF * eF * rF);

  // 신뢰도 점수 계산
  let conf = 100;
  if (data.moisture < 20 || data.moisture > 70) conf -= 20;
  if (data.ec >= 2.5) conf -= 15;
  if (data.temp < 10 || data.temp > 35) conf -= 15;
  if (data.rainfall >= 20) conf -= 10;
  if (rawN > 400 || rawN < 20 || rawP > 200 || rawP < 10) conf -= 10;

  return {
    calibratedN: calN,
    calibratedP: calP,
    calibratedK: calK,
    confidenceScore: Math.min(98, Math.max(40, conf)),
    calibrationMessage: conf >= 80 ? "최적 환경 내 정밀 분석 완료" : "환경 간섭에 따른 보정값 적용됨"
  };
};

// 3. 토양 건강 점수 계산
export const calculateScores = (
  crop: string,
  cal: { n: number; p: number; k: number },
  env: { ec: number; moisture: number; temp: number; rainfall: number }
) => {
  let score = 100;
  const std = cropStandards[crop];

  if (cal.n < std.n.min || cal.n > std.n.max) score -= 10;
  if (cal.p < std.p.min || cal.p > std.p.max) score -= 10;
  if (cal.k < std.k.min || cal.k > std.k.max) score -= 10;
  if (env.ec >= 2.5) score -= 15;
  if (env.moisture < 20 || env.moisture > 70) score -= 15;
  if (env.temp < 10 || env.temp > 35) score -= 10;
  if (env.rainfall >= 20) score -= 5;

  score = Math.min(100, Math.max(30, score));
  const status = score >= 85 ? "적정" : score >= 65 ? "주의" : "위험";

  return { health: score, status };
};

// 4. 동적 시비 처방 엔진
export const generatePrescription = (
  crop: string,
  cal: { n: number; p: number; k: number },
  env: { ec: number; moisture: number; rainfall: number }
): PrescriptionResult => {
  const std = cropStandards[crop];
  let summaryParts: string[] = [];
  let strategies: string[] = [];
  let precautions: string[] = [];
  let nextDiagnosis = "3일 후 정기 진단 권장";

  const check = (val: number, range: any, name: string, fert: string) => {
    if (val < range.min) {
      summaryParts.push(`${name} 부족`);
      strategies.push(`${name === '칼륨 (K)' ? fert + '계 비료 분할 시비' : fert + '계 비료 보충'}를 추천합니다.`);
    } else if (val > range.max) {
      summaryParts.push(`${name} 과잉`);
      strategies.push(`${fert}계 비료 투입 보류를 안내합니다.`);
    }
  };

  check(cal.n, std.n, "질소 (N)", "질소");
  check(cal.p, std.p, "인산 (P)", "인산");
  check(cal.k, std.k, "칼륨 (K)", "칼륨");

  if (summaryParts.length === 0) {
    summaryParts.push("영양 균형 최적");
    strategies.push("현재의 관리 체계를 유지하십시오.");
  }

  if (env.ec >= 2.5) {
    strategies = ["EC가 높으므로 전체 시비량을 줄이고 관수 또는 토양 세척을 권장합니다."];
    precautions.push("염류 집적 위험이 높으므로 추가 시비를 금지하십시오.");
  }
  if (env.moisture < 20) {
    strategies.push("토양이 건조하므로 관수 후 재측정을 권장합니다.");
    precautions.push("저수분으로 인한 측정 신뢰도 저하 구간입니다.");
  } else if (env.moisture > 70) {
    strategies.push("과습 상태이므로 배수 관리 후 재진단을 권장합니다.");
    precautions.push("과습으로 인한 뿌리 손상 위험이 있습니다.");
  }
  if (env.rainfall >= 20) {
    strategies.push("강우량이 많으므로 즉시 시비보다 강우 종료 후 재진단을 권장합니다.");
    precautions.push("강우에 따른 양분 유실 가능성이 큽니다.");
  }

  return {
    summary: `현재 ${crop} 재배 기준, ${summaryParts.join(', ')} 상태입니다.`,
    strategy: strategies.join(' '),
    precautions: precautions.length > 0 ? precautions : ["생육 단계별 표준 지침을 준수하세요."],
    nextDiagnosis: (env.ec >= 2.5 || env.rainfall >= 20) ? "24시간 후 재분석" : "3일 후 정기 진단"
  };
};

export const analyzeAnomalies = (data: { n: number; ec: number; moisture: number; rainfall: number; temp: number }): Anomaly[] => {
  const anomalies: Anomaly[] = [];
  if (data.ec >= 2.5) anomalies.push({ type: 'danger', message: '염류 집적 위험이 감지되었습니다.' });
  if (data.moisture < 20) anomalies.push({ type: 'warning', message: '토양 수분이 낮아 센서 신뢰도가 저하될 수 있습니다.' });
  if (data.moisture > 70) anomalies.push({ type: 'danger', message: '과습 상태입니다. 뿌리 활력 저하에 주의하세요.' });
  if (data.rainfall >= 20) anomalies.push({ type: 'info', message: '강우로 인한 양분 유실 가능성이 있습니다.' });
  if (data.temp < 10 || data.temp > 35) anomalies.push({ type: 'warning', message: '온도 불안정으로 인한 센서 안정성 저하 가능성.' });
  return anomalies;
};
