# 🌲 포레스텔라 원클릭 스밍리스트 생성기 (Sming Maker)

> 포레스텔라 & 멤버 4인(조민규, 배두훈, 강형호, 고우림) 맞춤 **1시간 스밍리스트 자동 생성기** 및 **멜론/지니/벅스/바이브/플로 원클릭 플레이리스트** 웹 애플리케이션입니다.

🔗 **배포 주소 (GitHub Pages):** [https://foretissimo.github.io/sming-maker/](https://foretissimo.github.io/sming-maker/)

---

## 🚨 [필독] 로컬 개발 및 AI 작업 전 필수 수칙

> **⚠️ 작업 시작 전 반드시 `git pull origin main`을 실행하세요!**
> 
> 음총팀이 웹 브라우저 편집기에서 `src/data/songs.json`, `src/data/recommendedPlaylist.json`, `src/data/backups/` 데이터를 GitHub `main` 브랜치로 **실시간 직접 배포**하고 있습니다.
> 로컬에서 작업하거나 소스코드를 수정하기 전, **반드시 최신 원격 변경사항을 pull 받아온 후** 작업을 시작해야 데이터 덮어쓰기나 충돌을 방지할 수 있습니다.
>
> ```bash
> git pull origin main
> ```

---

## ✨ 주요 기능

- ⏱️ **1시간 최적화 자동 생성 알고리즘**
  - 차트 집계 주기(~60분)에 맞추어 타이틀곡을 반복 배치하고 수록곡/솔로곡을 최적의 시간(58~62분)으로 자동 조합합니다.
- 🎯 **다양한 스밍 모드 지원**
  - **타이틀 집중 모드 (권장)**: 최신 타이틀곡을 1시간 동안 주기적으로 반복 배치해 화력 극대화
  - **최신곡 우선 모드**: 최신 발매 앨범/싱글 위주로 1시간 구성
  - **완전체 + 솔로 균형 모드**: 포레스텔라 단체곡과 4인 멤버 솔로곡을 골고루 배합
  - **랜덤 셔플 모드**: 다양한 명곡들을 무작위로 1시간 조합
- 👥 **아티스트 필터링**
  - 포레스텔라(완전체), 조민규, 배두훈, 강형호(PITTA), 고우림 개별/전체 선택 가능
- 🚀 **플랫폼별 원클릭 딥링크 (Mobile / PC)**
  - **멜론 (Melon)**: 안드로이드 / iOS 원클릭 앱 실행 & PC 플레이어 지원
  - **지니 (Genie)**: 지니 원클릭 앱 실행 & 웹 플레이어 지원
  - **벅스 (Bugs)**: 벅스 원클릭 앱 실행 & 웹 플레이어 지원
  - **바이브 (VIBE) & 플로 (FLO)**: 딥링크 및 트랙 리스트 복사 지원
- 📋 **리스트 텍스트 및 곡 ID 복사 & 공유**
  - 총 재생시간 포함 텍스트 목록 복사
  - 생성된 리스트 상태를 그대로 URL로 공유 가능 (`?songs=...`)
- 🔍 **곡 검색 및 직접 커스텀**
  - 전체 수록곡 검색 및 원하는 곡 직접 추가/삭제/순서 이동 (▲/▼)
- 📖 **스밍 필수 가이드 모달**
  - 중복곡 허용, 재생목록 비우기, 전체반복/셔플OFF, 음소거 방지 등 음원총공 핵심 팁 제공

---

## 🛠️ 기술 스택

- **Frontend:** React 19, Vite, Tailwind CSS v4, Lucide React, Canvas Confetti
- **Deployment:** GitHub Pages & GitHub Actions (자동 CI/CD)

---

## 📂 신규 곡 추가 및 데이터 관리

새로운 앨범이나 신곡이 발매되었을 때 [`src/data/songs.json`](./src/data/songs.json) 파일에 아래 형식으로 항목을 추가하면 자동으로 사이트에 반영됩니다.

```json
{
  "id": "fore-023",
  "title": "신곡 제목",
  "artist": "포레스텔라",
  "artistType": "group", // "group" | "jomingyu" | "baedoohun" | "kanghyungho" | "gowoorim"
  "album": "앨범명",
  "releaseDate": "2026-05-01",
  "duration": 235, // 초 단위 재생시간
  "isTitle": true, // 타이틀곡 여부 (true/false)
  "platformIds": {
    "melon": "멜론_곡ID",
    "genie": "지니_곡ID",
    "bugs": "벅스_곡ID",
    "vibe": "바이브_곡ID",
    "flo": "플로_곡ID"
  },
  "tags": ["title", "recent"]
}
```

---

## 💻 로컬 개발 환경 실행

```bash
# 의존성 설치
npm install --legacy-peer-deps

# 로컬 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build
```

---

## 🚀 GitHub Pages 배포 방법

1. 저장소에 코드를 `git push origin main` 합니다.
2. GitHub 저장소의 **Settings > Pages** 메뉴로 이동합니다.
3. **Build and deployment > Source**를 **GitHub Actions**로 선택합니다.
4. `.github/workflows/deploy.yml` 워크플로우가 자동으로 실행되어 몇 분 내로 배포가 완료됩니다.

---

## 💚 저작권 및 안내

- 본 프로젝트는 포레스텔라와 숲별(팬덤)을 위한 비영리 오픈소스 팬메이드 도구입니다.
- 모든 음원 및 저작권은 아티스트 및 해당 기획사/유통사에 있습니다.
