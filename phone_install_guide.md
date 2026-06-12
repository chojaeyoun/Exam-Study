# 시험 공부 어플 휴대폰 사용 안내

## 핵심

- `industrial_safety_study.html`, `manifest.webmanifest`, `sw.js`, `icons` 폴더를 같은 위치에 올리면 PWA로 동작합니다.
- 휴대폰에서 쓰려면 GitHub Pages, Netlify, Cloudflare Pages 같은 정적 웹 호스팅에 `outputs` 폴더 내용을 업로드하세요.
- `file:///`로 열면 서비스 워커가 동작하지 않으므로 오프라인 설치 기능은 웹 주소에서만 켜집니다.

## 무료로 올리는 방법

1. GitHub 저장소를 새로 만듭니다.
2. `outputs` 폴더 안의 파일들을 저장소 루트에 업로드합니다.
3. GitHub Pages를 켜고 Branch를 `main`, folder를 `/root`로 설정합니다.
4. 생성된 `https://...github.io/.../industrial_safety_study.html` 주소를 휴대폰에서 엽니다.
5. 안드로이드는 브라우저 메뉴에서 "홈 화면에 추가" 또는 앱의 "설치" 버튼을 사용합니다.
6. 아이폰은 Safari 공유 버튼에서 "홈 화면에 추가"를 선택합니다.

## 저장 방식

- 문제와 진도는 각 기기의 브라우저 저장소에 저장됩니다.
- 현재는 `산업기사 실기` 시험 탭이 기본으로 들어 있으며, 이후 다른 시험 탭을 추가할 수 있는 구조입니다.
- Supabase를 연결하면 `클라우드` 탭에서 로그인 후 이 기기 데이터를 클라우드로 올리거나, 다른 기기에서 클라우드 데이터를 가져올 수 있습니다.
- PC와 휴대폰 기록을 합치려면 문제은행의 CSV 내보내기/가져오기를 사용하세요.
- 여러 기기 자동 동기화는 Firebase나 Supabase 같은 온라인 DB를 붙이면 가능합니다.
