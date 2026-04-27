# 🌿 농사랑 (Nongsarang) - AI 정밀 농업 솔루션 MVP

본 프로젝트는 데이터 기반 정밀 농업 솔루션 **'농사랑'**의 발표용 웹 MVP입니다. 저가형 NPK 센서의 데이터를 AI로 보정하여 최적의 시비 처방을 제공하는 과정을 시연하기 위해 제작되었습니다.

## 🚀 주요 기능
- **실시간 데이터 보정**: 환경 변수(수분, 온도, EC)를 기반으로 센서 오차 정밀 보정
- **이상치 탐지**: 염류 집적, 과습 등 위험 요소 실시간 감지 및 경고
- **작물별 처방**: 토마토, 딸기 등 5종 작물에 대한 NPK 상태 진단 및 시비 가이드
- **데모 프리셋**: 발표 시나리오에 따른 3가지 데이터(정상/위험/부족) 즉시 로드
- **디지털 영농일지**: 분석 결과를 일지 형식으로 자동 생성 및 복사

## 🛠 실행 방법 (Local)

1. **저장소 내려받기 또는 코드 복사**
2. **패키지 설치**
   ```bash
   npm install
   ```
3. **데모 서버 실행**
   ```bash
   npm run dev
   ```
4. 브라우저에서 `http://localhost:5173` 접속

## 🌐 배포 방법 (Deployment)

본 프로젝트는 순수 프론트엔드 로직으로만 작동하므로 별도의 서버 설정 없이 정적 호스팅 서비스에 즉시 배포 가능합니다.

### 1. 빌드 (Production Build)
```bash
npm run build
```
이 명령어를 실행하면 `dist/` 폴더에 배포용 정적 파일들이 생성됩니다.

### 2. GitHub Pages 배포
- GitHub 저장소 설정(Settings) -> Pages에서 `branch`를 `main`, `folder`를 `/docs`로 설정하거나 (빌드 경로 수정 필요), GitHub Action을 사용하여 `dist` 폴더를 배포합니다.

### 3. Cloudflare Pages / Vercel 배포
- 저장소를 연결하고 Build Command에 `npm run build`, Build Output Directory에 `dist`를 입력하면 1분 안에 배포됩니다.

## 📄 기술 스택
- **Framework**: React 18 (TypeScript)
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Logic**: Custom AI Calibration Engine (Mock Logic)

---
*본 프로젝트는 발표용 데모를 위해 제작되었으며, 실제 서비스 시에는 농촌진흥청 농사로 API 및 공공 데이터베이스와 연동될 예정입니다.*
