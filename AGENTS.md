# AGENT & DEVELOPER INSTRUCTIONS

## 🚨 MANDATORY RULE: ALWAYS PULL BEFORE STARTING ANY TASK

The Sound Team (음총팀) continuously edits and commits data directly to the GitHub remote `main` branch via the web application:
- `src/data/songs.json`
- `src/data/recommendedPlaylist.json`
- `src/data/backups/`

### Critical Workflow for all Agents & Developers:
1. **PULL FIRST**: Before analyzing files, making code edits, or touching data, ALWAYS run:
   ```bash
   git pull origin main
   ```
2. **Never overwrite sound team data** without merging their latest commits first.
3. **Verify build** with `npm run build` after changes.
4. **Push commits** to `origin/main`.

---

## 📱 Platform Deep Link & URI Scheme Standards (플랫폼별 랜딩 URL 규격)

All platform deep links are managed in `src/utils/platformLinks.js`. Whenever modifying link generation logic, ALWAYS follow these exact scheme formats:

### 1. 멜론 (Melon)
- **아이폰 (iOS Melon App)**:
  `melonapp://play?menuid=0&ctype=1&cid=${joinedIds}`
  > 🚨 **주의**: 아이폰 멜론앱 랜딩 URL은 반드시 `menuid=0&ctype=1&cid=ID1,ID2...` 형식이어야 합니다 (`cType=1&cList=` 사용 금지).
- **갤럭시 / 안드로이드 (Android Melon App)**:
  `melonapp://play?menuid=0&ctype=1&cid=${joinedIds}`
- **PC Windows (Melon Windows Player)**:
  `melonapp://play?cType=1&cList=${joinedIds}`
- **PC Mac (Melon Mac Player)**:
  `melonplayer://play?menuid=0&cflag=1&cid=${joinedIds}`
- **아이패드 (iPadOS Melon iPad App)**:
  `melonipad://play/?ctype=1&menuid=0&cid=${joinedIds}`
  > 💡 **특징**: 아이패드 멜론앱은 중복곡이 포함된 전체 리스트를 분할 없이 한 번의 URL 호출로 모두 담을 수 있어 단일 버튼 및 단일 URL로 처리합니다.

### 2. 지니 (Genie)
- **아이폰 (iOS)**: `ktolleh00167://landing/?landing_type=31&landing_target=${ids.join(';')};`
- **안드로이드 (Android)**: `cromegenie://scan/?landing_type=31&landing_target=${ids.join(';')};`
- **PC (Web Player)**: `https://www.genie.co.kr/player/shareProcessV2?xgnm=${ids.join(';')}`

### 3. 벅스 (Bugs)
- **아이폰 / 안드로이드 (iOS & Android)**: `bugs3://app/tracks/lists?title=%EC%A0%84%EC%B2%B4%EB%93%A3%EA%B8%B0&miniplay=y&track_ids=${ids.join('|')}|`
- **PC (Web Player)**: `https://music.bugs.co.kr/newPlayer?trackId=${ids.join(',')}`

### 4. 플로 (FLO) & 바이브 (VIBE)
- **플로 (iOS)**: `flomobile://play?trackId=${ids.join(',')}`
- **바이브 (iOS)**: `vibe://listen?version=3&trackIds=${ids.join(',')}`

---

## 🌐 Official Channels & External Links (공식 채널 및 외부 연동 URL)
- **멜론 뮤직웨이브 (Music Wave)**:
  `https://into.melon.com/bridge/kakaotalk/musicwave/VvseWVazR3I9q3Kuzn_eFA?type=channel&t=1751896537993`
- **포레스텔라 음원총공팀 공식 홈페이지**:
  `https://www.forestellastream.com/`


