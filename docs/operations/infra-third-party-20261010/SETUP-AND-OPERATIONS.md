# Sổ tay thiết lập hạ tầng và dịch vụ bên thứ ba SatsunicGo

Phiên bản 1.0 · Ngày đối chiếu 10/10/2026 · Tài liệu vận hành nội bộ

Tài liệu này ghi lại các nền tảng mà SatsunicGo phụ thuộc, trình tự thiết lập, nơi quản lý cấu hình và cách cập nhật về sau. Đi cùng sổ tay là danh sách tài khoản quản trị và danh mục cấu hình có thể bổ sung trực tiếp. Người tiếp quản có thể lần từ một chức năng bị lỗi đến đúng dự án, bảng điều khiển, tệp cấu hình và người phụ trách.

Các định danh đã có trong mã nguồn được điền cụ thể. Tài khoản đăng nhập, quyền sở hữu, thông tin thanh toán dịch vụ và trạng thái cấu hình trên nhà cung cấp chưa được kiểm tra trực tiếp sẽ ghi **CHƯA XÁC NHẬN**. Đây là phần cần hoàn thiện khi bàn giao, không phải bằng chứng dịch vụ chưa được thiết lập. Tài liệu không chứa mật khẩu, khóa API, mã MFA hay mã khôi phục.

Các bước tạo tài nguyên, sửa DNS, cấp quyền, đổi secret, đổi chính sách dữ liệu hoặc triển khai là hướng dẫn thực hiện trong một lần thay đổi đã được duyệt. Việc viết sổ tay này không thực hiện các bước đó trên hệ thống thật.

## 01 Cách dùng và cập nhật sổ tay

Khi thiết lập một dịch vụ lần đầu, đọc theo thứ tự của chương đó và ghi kết quả vào hồ sơ dịch vụ. Khi sửa một cấu hình đã tồn tại, đọc phần cập nhật trước; không tạo tài nguyên mới chỉ vì chưa tìm thấy tài nguyên cũ.

Mỗi lần thay đổi cần có bốn thông tin tối thiểu: giá trị cũ thuộc phiên bản nào, người thực hiện, thời điểm thay đổi và kết quả kiểm tra. Với secret, chỉ ghi tên, số phiên bản và nơi lưu; không ghi giá trị. Với tài khoản quản trị, ghi định danh đăng nhập và vai trò đã được xác nhận, không ghi tài khoản của một người chỉ vì người đó là tác giả commit.

Trong sổ tay, **ĐÃ ĐỐI CHIẾU NGUỒN** nghĩa là thông tin có trong tệp cấu hình hoặc implementation tại ngày chụp. **CHƯA XÁC NHẬN** nghĩa là chưa có phiên đọc trực tiếp bảng điều khiển hoặc xác nhận từ người sở hữu. **THEO ĐIỀU KIỆN** nghĩa là chỉ cần khi bật tính năng tương ứng. **CHƯA TRIỂN KHAI TRONG PHẠM VI KIỂM TRA** không đồng nghĩa với không tồn tại ở nơi khác.

Tệp `ACCOUNT-REGISTER.csv` lưu danh sách dịch vụ và người quản trị. `CONFIGURATION-REGISTER.csv` ghi từng biến và nơi thay đổi. `CHANGE-LOG.csv` lưu lịch sử. `RESOURCE-REGISTER.csv` lưu định danh tài nguyên, còn `POLICY-REGISTER.csv` ghi 22 trường chính sách email, PayOS và AI. Các tệp CSV dùng UTF-8 và có thể mở bằng Excel hoặc Google Sheets. Bộ sổ tay này phục vụ nội bộ; không đưa danh sách quản trị và vị trí kho bí mật vào hồ sơ quảng bá công khai.

## 02 Bản đồ các thành phần cần quản lý

| Thành phần | Vai trò trong ứng dụng | Mức cần thiết và căn cứ |
| --- | --- | --- |
| Google Cloud và Firebase | Chạy backend, lưu dữ liệu, đăng nhập, lưu tệp và website | Nền tảng chính trong mã nguồn |
| GitHub và GitHub Actions | Mã nguồn, kiểm tra, gói phát hành và CI/CD | Workflow có trong repo |
| Tên miền và DNS | Trỏ website, xác minh email, hỗ trợ đăng nhập | Cần theo tên miền thực tế; nhà đăng ký chưa xác nhận |
| Firebase Authentication và Google OAuth | Đăng nhập khách và nhân viên | Có implementation; cấu hình live cần đọc lại |
| Identity Platform hoặc cấu hình MFA tương ứng | Xác thực bổ sung cho nhân viên | Cần kiểm tra tính năng và quyền sử dụng trên dự án |
| App Check và reCAPTCHA Enterprise | Xác thực ứng dụng khi gọi dịch vụ | Client dùng Enterprise provider |
| Firestore và Cloud Storage | Dữ liệu nghiệp vụ, hình ảnh, chứng từ | Có rules và index trong repo |
| Cloud Functions, Cloud Run, Cloud Build, Artifact Registry | Chạy, đóng gói và lưu bản backend do nền tảng quản lý | Không phải bốn ứng dụng độc lập cần đăng ký riêng |
| Scheduler và Eventarc/Pub/Sub | Lịch chạy, sự kiện và hàng đợi theo trigger thực tế | Kiểm theo từng function đã triển khai |
| Secret Manager | Giữ thông tin xác thực phía máy chủ | Có khai báo secret trong source |
| Resend | Gửi email giao dịch và đăng ký thông báo | Có adapter và chính sách server |
| SePay Payment Gateway sandbox | Thanh toán mua hộ trong môi trường demo | Implementation đang khóa theo demo emulator |
| PayOS | Nhánh thanh toán khác trong source | Capability payments hiện bị giữ; không coi đã hoạt động |
| Vertex AI | Nhánh tư vấn AI khách hàng có ngân sách và thời hạn | Có module riêng; trạng thái live chưa xác nhận |
| Gemini API cho CI | Deep review mã nguồn tùy chọn | Tách hoàn toàn khỏi Vertex AI runtime |
| Logging, Monitoring và Cloud Billing | Theo dõi lỗi, vận hành và chi phí | Cần hoàn thiện cấu hình, người nhận cảnh báo |
| Kho lưu bản sao và hồ sơ phục hồi | Khôi phục dữ liệu và cấu hình | Lịch backup thật, RPO/RTO chưa xác nhận |

Không thấy căn cứ để yêu cầu Kubernetes, Redis, Vercel, AWS, Cloudflare, một máy chủ SFTP hoặc một dịch vụ SMS độc lập cho toàn bộ ứng dụng. Chỉ bổ sung chúng khi có implementation và nhu cầu đã duyệt. Việc thư viện tồn tại trong dependency không chứng minh có tài khoản hoặc lưu lượng thật ở nhà cung cấp đó.

## 03 Định danh hệ thống đã có trong nguồn

| Thông tin | Giá trị hoặc tình trạng | Nguồn đối chiếu |
| --- | --- | --- |
| Google Cloud project | `satsunicgo` | `scripts/release/public-config.mjs` |
| Project number | `278913913091` | Cùng nguồn và WIF descriptor |
| Firebase web app ID | `1:278913913091:web:e40355cd8ad5abe00f9936` | `docs/releases/CICD-108.md` |
| Region backend chính | `asia-southeast1` | Firebase config và workflow |
| Website mặc định trong release | `https://satsunicgo.web.app` | `.github/workflows/release.yml` |
| Repository | `phamhungptithcm/SatsunicGo` | Git remote và WIF descriptor |
| GitHub repository ID | `1403691876` | `production-wif.json`; chưa đọc lại GitHub |
| GitHub owner ID | `32831453` | Cùng nguồn; không suy ra người đăng nhập |
| Service account triển khai dự kiến | `github-release@satsunicgo.iam.gserviceaccount.com` | WIF descriptor |
| WIF pool và provider dự kiến | `github-release` / `satsunicgo-main` | WIF descriptor |
| GitHub deployment environment | `production` | Release workflow |
| Codebase Firebase Functions | `satsunicgo` | `firebase.json` |
| Runtime Node | `nodejs22` / Node 22 | Firebase config và workflow |
| Địa chỉ gửi email | `contact@hunpeolabs.com` | Email provider schema |
| Tên miền gửi email | `hunpeolabs.com` | Email provider schema |
| SePay merchant sandbox trong source | `SP-TEST-HL5339A9` | Domain purchase-sepay module |
| Secret API Resend hiện được đọc qua tên | `SFTP_PASSWORD` | Email worker truyền vào adapter Resend |
| Project demo | `demo-satsunicgo` | Client/server fences và quy định repo |

Đây là bản ghi theo nguồn, không phải kết quả kiểm tra quyền sở hữu hôm nay. Không có `.firebaserc` ở root tại thời điểm kiểm tra; các lệnh production phải chỉ rõ project hoặc đi qua workflow đã thiết kế, không dựa vào project mặc định của máy.

## 04 Tài khoản quản trị và quyền sở hữu

### Ba loại danh tính cần ghi riêng

**Người quản trị** là tài khoản đăng nhập bảng điều khiển, có thể cấp quyền hoặc thay cấu hình. **Tài khoản chạy hệ thống** là service account hoặc workload identity dùng khi ứng dụng/CI hoạt động. **Danh tính nghiệp vụ** là người gửi email, merchant, tài khoản nhận tiền hoặc người có vai trò OWNER trong ứng dụng. Một người có thể tham gia nhiều vai trò nhưng các quyền không tự kéo theo nhau.

Ví dụ: có quyền OWNER trong CRM không có nghĩa được quản lý billing Google Cloud. GitHub username trong đường dẫn repo không chứng minh tài khoản nào đang đăng nhập CLI. Địa chỉ gửi thư không chứng minh địa chỉ đăng nhập Resend. Service account triển khai không nên được dùng như tài khoản cá nhân.

### Email quản trị đã được cung cấp

Người dùng xác nhận email quản trị chung là `hunpeo97@gmail.com` trong cuộc trao đổi ngày 10/10/2026. Email này đã được điền trong danh mục cho các dịch vụ cần quản lý. Quyền đăng nhập, workspace, vai trò và người dự phòng của từng dịch vụ vẫn cần đọc lại tại bảng điều khiển. Với GitHub, username nguồn `phamhungptithcm` được giữ riêng; không tự kết luận username đăng nhập từ email. Với runtime, tài khoản service account vẫn được ghi riêng.

### Cách hoàn thiện danh sách tài khoản

1. Mở đúng bảng điều khiển của từng dịch vụ bằng phiên đăng nhập của người phụ trách.
2. Ghi tên tổ chức/workspace và ID tài nguyên. Đối chiếu project `satsunicgo`, repository và tên miền trước khi tiếp tục.
3. Xem danh sách thành viên và quyền của tài khoản hiện tại. Ghi vai trò cụ thể; không chỉ ghi “admin” khi nhà cung cấp có nhiều mức quyền.
4. Điền email hoặc username quản trị chính và người dự phòng vào `ACCOUNT-REGISTER.csv`. Tài khoản dự phòng phải được người sở hữu xác nhận.
5. Ghi nơi quản lý MFA và tham chiếu mục trong kho mật khẩu của tổ chức. Chỉ ghi tên mục hoặc đường dẫn nội bộ, không ghi recovery code.
6. Ghi người thanh toán, ngày gia hạn, kênh nhận hóa đơn và nơi tiếp nhận cảnh báo. Không ghi số thẻ hoặc thông tin ngân hàng nhạy cảm.
7. Lưu ngày kiểm tra và người xác nhận. Nếu chưa truy cập được bảng điều khiển, giữ trạng thái CHƯA XÁC NHẬN và ghi bước còn thiếu.
8. Khi bàn giao, người nhận đăng nhập bằng tài khoản riêng, kiểm tra quyền thực tế rồi xác nhận. Không dùng việc gửi mật khẩu chung làm bằng chứng bàn giao.

### Thay người quản lý

Mời người mới bằng quyền phù hợp; kiểm tra đăng nhập, MFA và quyền với một thao tác đọc. Chuyển người nhận billing, cảnh báo và liên hệ hỗ trợ. Chỉ thu hồi quyền người cũ khi người mới và người dự phòng đã kiểm tra được quyền. Với quyền đặc biệt hoặc tài khoản khẩn cấp, ghi riêng người phê duyệt và nơi lưu quy trình khôi phục.

## 05 Trình tự thiết lập toàn hệ thống

Thứ tự dưới đây tránh việc cấu hình một dịch vụ phụ thuộc vào tài nguyên chưa có. Với hệ thống đang tồn tại, mỗi bước bắt đầu bằng kiểm kê và đối chiếu; không chạy lại quy trình tạo mới một cách máy móc.

1. Hoàn thiện tài khoản quản trị, MFA, người dự phòng và quyền thanh toán.
2. Xác nhận repository, branch bảo vệ, workflow, phiên bản công cụ và quyền đọc mã.
3. Xác nhận Google Cloud project, billing và các API cần cho tài nguyên thật.
4. Xác nhận Firebase web app, Firestore, Storage và region đã chọn.
5. Cấu hình Google sign-in, miền được phép, MFA và App Check.
6. Kiểm tra rules, indexes, runtime identity và các trigger backend.
7. Thiết lập GitHub production environment, WIF và biến build công khai.
8. Kiểm tra Hosting, tên miền, DNS và chứng chỉ.
9. Thiết lập Resend cùng tên miền gửi và chính sách email.
10. Thiết lập thanh toán theo nhánh được duyệt; giữ sandbox và production riêng.
11. Thiết lập AI theo từng nhánh, ngân sách, model, region và thời hạn.
12. Thiết lập log, cảnh báo, billing budget, backup và quy trình phục hồi.
13. Kiểm tra gói phát hành, triển khai theo quy trình, đọc lại provider và chạy nghiệm thu nghiệp vụ được phép.
14. Ghi toàn bộ ID, phiên bản, ngày kiểm tra và người quản lý vào các danh mục đi kèm.

Kết thúc setup khi tài nguyên, quyền và hành vi đã được kiểm tra trên đúng môi trường. Chỉ nhìn thấy mục cấu hình hoặc nhận HTTP 200 chưa đủ để xác nhận luồng nghiệp vụ hoạt động.

## 06 Repository và môi trường phát triển

### Thiết lập và kiểm tra

1. Mở repository tại `https://github.com/phamhungptithcm/SatsunicGo`. Kiểm tra quyền của tài khoản bằng danh sách Collaborators/Teams nếu có quyền xem.
2. Dùng checkout phục vụ công việc đã phân công. Xem `git status` trước khi cài đặt hoặc chạy script; worktree hiện có nhiều thay đổi đồng thời.
3. Dùng Node 22 cho quy trình đang được CI xác định. Đọc `package.json`, lockfile và workflow để lấy phiên bản dependency; không cập nhật hàng loạt trong bước setup.
4. Cài dependency bằng `npm ci` ở checkout được phép. Không coi `npm install` đã thành công là tương đương với bộ dependency được CI kiểm tra.
5. Đặt cấu hình client theo môi trường. Biến `VITE_*` sẽ đi vào gói trình duyệt; không đặt API key Resend/PayOS/SePay vào đây.
6. Khi cần kiểm tra mã, các script hiện có gồm `npm run typecheck`, `npm run lint`, `npm test`, `npm run test:release-config`. Rules/HTTP/restore tests cần backend phù hợp; không chạy chồng vào runtime dùng chung khi chưa kiểm tra quyền sở hữu.
7. Ghi phiên bản Node, commit, kết quả và phạm vi kiểm tra. Không dùng kết quả checkout khác hoặc snapshot cũ để xác nhận bản hiện tại.

### Cập nhật

Thay Node, Firebase CLI hoặc dependency cần kiểm tra lockfile, build, functions runtime và workflow cùng lúc. Đọc release notes chính thức và thử trong checkout được phân công trước. Không sửa generated files trực tiếp; chạy lại generator tương ứng.

## 07 Môi trường demo dùng chung

Frontend dùng `http://127.0.0.1:5207`. Backend dùng Auth 19207, Firestore 18207, Functions 15207 và Storage 19208. Tệp cấu hình runtime dùng chung là `/private/tmp/satsunicgo-shared5207/firebase.json`.

1. Kiểm tra listener 5207 và người đang giữ runtime. Nếu đã chạy, tái sử dụng; không khởi động Vite/preview thứ hai.
2. Kiểm tra project client là `demo-satsunicgo`, `VITE_USE_EMULATORS=true` và các port Auth/Firestore/Functions ở trên.
3. So sánh với cấu hình dùng chung. `firebase.json` trong repo có các port mặc định khác; chúng không thay thế chỉ dẫn runtime đang dùng.
4. Xác nhận có thể đăng nhập demo, đọc dữ liệu demo và gọi Functions đúng project. Không dùng tài khoản hay dữ liệu production để seed.
5. Nếu file ở `/private/tmp` bị dọn, phối hợp người giữ runtime để tạo lại đúng cấu hình. Lưu dữ liệu demo trước khi có lần restart được cho phép.
6. Chỉ dùng `--port 5207 --strictPort` khi có lần khởi động được phép. Nếu cổng bận, dừng và kiểm tra; không chuyển sang port khác.
7. Ghi trạng thái và fixture phục vụ demo. Không dùng `demo:reset`, reseed hoặc tắt emulator trong khi người khác đang kiểm thử.

Storage có cổng backend riêng nhưng không có nghĩa client đã hỗ trợ `VITE_STORAGE_EMULATOR_PORT`. Chỉ dùng biến và cách kết nối có trong implementation. Các kịch bản backend Storage phải đọc đúng cấu hình của script hiện có.

## 08 Google Cloud project và billing

Bảng điều khiển: `https://console.cloud.google.com/`. Project ID theo nguồn là `satsunicgo`; project number là `278913913091`. Billing account, tổ chức và email chủ quản: CHƯA XÁC NHẬN.

### Thiết lập hoặc kiểm kê

1. Đăng nhập bằng tài khoản quản trị đã được xác nhận. Chọn project bằng ID và đối chiếu project number trong Project info.
2. Xem organization/folder và người có quyền quản trị. Ghi các nhóm liên quan, không chỉ tài khoản hiện tại.
3. Mở Billing, xác nhận project gắn đúng billing account. Ghi tên/ID billing account trong danh mục nội bộ cùng người nhận hóa đơn; không ghi phương thức thanh toán chi tiết.
4. Xem APIs & Services. Kiểm các API mà tài nguyên đang dùng yêu cầu: Functions, Cloud Run, Cloud Build, Artifact Registry, Firestore, Storage, Secret Manager, Scheduler/Eventarc/Pub/Sub theo trigger, Identity Toolkit, reCAPTCHA Enterprise và Vertex AI nếu nhánh đó được bật.
5. Không bật thêm mọi API vì thấy chúng trong danh sách. Đối chiếu tài nguyên và tài liệu provider của lần setup đó; việc bật API hoặc liên kết billing là một thay đổi thực tế.
6. Ghi quota, region, người nhận cảnh báo và thời điểm xác nhận. Kiểm tra chênh lệch giữa billing viewer và người có quyền sửa billing.
7. Tạo budget theo mức ngân sách đã được duyệt. Ghi ngưỡng thông báo, phạm vi dịch vụ/project và email nhận.

### Cập nhật và kiểm tra

Khi đổi billing account hoặc organization, kiểm lại quyền service agent, API, quota và các giới hạn theo vùng. Budget là cảnh báo, không tự tạo một trần ngắt toàn bộ chi tiêu. Các giới hạn ở mã ứng dụng và quota provider phải được quản lý riêng. [Hướng dẫn Cloud Billing](https://docs.cloud.google.com/billing/docs/how-to/budgets).

## 09 Firebase project và web app

Bảng điều khiển: `https://console.firebase.google.com/project/satsunicgo/overview`.

1. Mở project và xác nhận Firebase đang gắn với đúng Google Cloud project. Không tạo project mới có tên gần giống.
2. Vào Project settings, xem web app ID và bộ Firebase SDK config. Đối chiếu ID web app ở chương 03.
3. Ghi project ID, app ID, auth domain và storage bucket vào danh mục cấu hình. Tên bucket thực tế chưa được điền nếu chưa có readback từ provider.
4. Đưa các giá trị public cần cho build vào GitHub repository variables hoặc cấu hình local phù hợp. Không chép credentials backend vào config web.
5. Đối chiếu `scripts/release/public-config.mjs`: production phải đúng project `satsunicgo`, region `asia-southeast1`, app thuộc project number đã chốt và không bật emulator/beta.
6. Nếu dùng custom auth domain/bucket, kiểm đúng release tuple và quyền sở hữu; validator không tự chứng minh DNS hoặc đăng ký OAuth hợp lệ.
7. Chạy kiểm public config ở môi trường build được phép, rồi kiểm website và Auth/App Check sau triển khai. Lưu kết quả đã che thông tin nhạy cảm.

Đổi web app hoặc project không chỉ là thay API key. Nó ảnh hưởng danh tính Auth, database, Storage, App Check, domain, rules, secrets và runtime. Chuyển project cần một kế hoạch migration riêng; không làm bằng cách sửa vài biến client.

## 10 Đăng nhập Google OAuth và MFA

### Google sign in

1. Mở Firebase Authentication, xem Google provider và email hỗ trợ của project. Xác nhận provider được bật theo cấu hình được duyệt.
2. Kiểm tra Authorized domains cho từng host production thực sự sử dụng. Không suy ra cấu hình OAuth chỉ từ việc Hosting đã nối tên miền.
3. Mở Google Cloud Console, xem OAuth consent/Google Auth Platform và OAuth web client tương ứng. Ghi client ID công khai, chủ quản và trạng thái ứng dụng.
4. Đối chiếu JavaScript origins và redirect URI theo auth domain thật. Luồng Firebase thường dùng `https://<AUTH_DOMAIN>/__/auth/handler`; xác nhận theo client và tài liệu chính thức, không điền host đoán.
5. Nếu bật One Tap, dùng `VITE_GOOGLE_CLIENT_ID` khớp OAuth web client và origin. Trống biến này là cách tắt One Tap theo release config; không thay thế provider Google sign-in.
6. Kiểm tra popup, popup bị chặn, đóng popup, tài khoản khác, reload và đăng xuất. Ghi trình duyệt và domain đã thử. Không sửa CSP bằng wildcard để bỏ qua lỗi.
7. Ghi lỗi với mã và bước tái hiện, không lưu ID token hoặc nội dung profile của khách.

Nguồn provider: [Firebase Google sign in](https://firebase.google.com/docs/auth/web/google-signin). Các bước kiểm tra riêng của ứng dụng nằm trong `src/shared/firebase.ts`, OneTap và auth modules.

### MFA cho nhân viên

1. Xác định tính năng MFA/Identity Platform mà project và ứng dụng đang sử dụng; kiểm tra điều kiện gói dịch vụ và phương thức xác thực được hỗ trợ tại thời điểm làm.
2. Đối chiếu `functions/src/auth/guards.ts` và các module MFA trước khi thay provider. Backend kiểm phiên Google đã xác minh và độ mới của lần MFA, không dựa vào một cờ do client gửi.
3. Ghi tài khoản OWNER của ứng dụng riêng với tài khoản quản trị Firebase. Kiểm tra vai trò và trạng thái khóa từ nguồn phân quyền hiện tại.
4. Cho người được phép tự đăng ký yếu tố MFA bằng giao diện thật. Không thu hộ seed, OTP hay mã khôi phục trong tài liệu.
5. Kiểm tra hành động yêu cầu MFA mới, phiên hết hạn, đổi tài khoản và trường hợp bị khóa. Bằng chứng phải gắn đúng người dùng thử đã cho phép.
6. Khi mất yếu tố MFA, dùng quy trình khôi phục đã duyệt và xác minh danh tính; không tự bỏ MFA ở backend.

## 11 App Check và reCAPTCHA Enterprise

Client hiện dùng `ReCaptchaEnterpriseProvider` khi có `VITE_RECAPTCHA_ENTERPRISE_SITE_KEY` và không ở local. App Check và Authentication phục vụ hai mục đích riêng; đăng nhập thành công không chứng minh App Check đã được chấp nhận.

1. Mở App Check trong Firebase, chọn đúng web app.
2. Đối chiếu reCAPTCHA Enterprise key trên Google Cloud và các domain hợp lệ. Ghi ID/site key công khai và người quản lý; không ghi debug token.
3. Đăng ký provider Enterprise cho web app theo cấu hình đã duyệt. Dùng đúng loại key, không thay bằng reCAPTCHA v3 chỉ vì tên gần giống.
4. Đặt site key public vào `VITE_RECAPTCHA_ENTERPRISE_SITE_KEY`, rebuild và triển khai bằng luồng phát hành.
5. Xem metrics về request hợp lệ, không hợp lệ và thiếu token cho từng dịch vụ. Kiểm thử trên domain thật được phép trước khi thay enforcement.
6. Đối chiếu từng callable có yêu cầu App Check. Không kết luận mọi endpoint được bảo vệ chỉ vì client đã khởi tạo SDK.
7. Thay enforcement theo kế hoạch rollout và theo dõi lỗi. Khi rollback, giữ biên bản nguyên nhân; không dùng debug token trong production.

Khi đổi domain hoặc key, cập nhật cả provider registration và gói client rồi kiểm lại. [Hướng dẫn Enterprise provider](https://firebase.google.com/docs/app-check/web/recaptcha-enterprise-provider).

## 12 Firestore dữ liệu rules và indexes

### Thiết lập hoặc xác nhận

1. Mở Firestore của project và xác nhận database ID, chế độ và location hiện tại. Region Functions không đủ để suy ra location Firestore.
2. Ghi các thông tin này vào danh mục tài nguyên. Với database đã có dữ liệu, không tạo bản mới hoặc đổi cấu trúc để khớp tài liệu.
3. Đọc `firestore.rules` và `firestore.indexes.json`, đối chiếu với rules/indexes đang được provider áp dụng.
4. Kiểm tra các collection cấu hình nghiệp vụ bằng schema trong source. Việc biết đường dẫn document không có nghĩa được sửa trực tiếp trong console.
5. Chạy rules tests theo workflow trong môi trường phù hợp. Kiểm các trường hợp không đăng nhập, sai chủ đơn, sai vai trò, dữ liệu private và truy vấn bị từ chối.
6. Nếu cần triển khai rules/indexes, dùng một đợt phát hành riêng được duyệt. CI/CD hiện chỉ deploy Hosting và Functions.
7. Đợi index ở trạng thái sẵn sàng và kiểm truy vấn thực tế. Khi index đang build, không kết luận lỗi truy vấn đã được giải quyết.
8. Ghi nguồn hash, provider revision/thời điểm và kết quả. Không xuất tài liệu khách hàng thật làm mẫu.

### Cập nhật

Thêm field không nhất thiết cần index; thêm query có thể cần composite index. Mỗi thay đổi phải kiểm source, query, rules và khả năng đọc dữ liệu cũ. Migration cần backup, danh sách dữ liệu tác động, khóa thực thi và cơ chế chạy lại an toàn. Không tự áp dụng migration trong bước setup hạ tầng.

## 13 Storage hình ảnh và chứng từ

1. Mở Cloud Storage/Firebase Storage để xác nhận bucket thực tế, location, project và billing.
2. Ghi bucket ID trong danh mục. Đối chiếu `VITE_FIREBASE_STORAGE_BUCKET` và Admin SDK; không suy ra tên bucket theo một hậu tố cố định.
3. Đọc `storage.rules` và các module xử lý ảnh/chứng từ. Phân biệt ảnh công khai với ảnh đơn hàng, chứng từ và biên nhận chỉ chủ sở hữu được đọc.
4. Kiểm tra IAM bucket và public access settings. Không mở public toàn bucket chỉ để một ảnh tải được.
5. Kiểm MIME, kích thước, đường dẫn và cơ chế download đang dùng. Kiểm tra một người dùng khác không tải được tệp private.
6. Nếu cần CORS/lifecycle/versioning, đọc cấu hình hiện có, xác định ứng dụng thực sự cần gì và ghi thay đổi riêng. Không thêm cấu hình theo mẫu chung khi chưa có căn cứ.
7. Ghi chính sách giữ tệp, bản backup, quy trình orphan cleanup và ai được xóa. Giá trị retention hiện tại chưa được xác nhận.

Khi cập nhật, kiểm cả URL cũ, cache của ảnh công khai và đường tải tệp private. Token download hoặc URL ký có thể cấp quyền đọc; không lưu chúng trong sổ tay hoặc ảnh chụp dùng để chia sẻ.

## 14 Functions và các dịch vụ Google Cloud đi kèm

`firebase.json` định nghĩa codebase `satsunicgo` và runtime Node 22. Nhiều tài nguyên Cloud Run, build, artifact và event routing được nền tảng tạo khi triển khai Functions; cần kiểm kê tài nguyên đã tồn tại trước khi thiết lập thủ công.

1. Mở Functions và lập danh sách tên function, generation, region, trigger, runtime identity và trạng thái.
2. Đối chiếu entrypoint nguồn với inventory của artifact được chọn. Export trong source không chứng minh đã có endpoint live; release có thể giữ lại một số chức năng.
3. Mở Cloud Run hoặc trang tài nguyên tương ứng để xem runtime service account thực tế. Không mặc định nó là account triển khai GitHub.
4. Xem timeout, memory, concurrency, min/max instances, secret bindings và network settings của từng nhóm. Không gán một cấu hình mẫu cho tất cả function.
5. Xem Cloud Build và Artifact Registry liên quan; ghi vùng, repository và cleanup policy hiện tại. Cleanup policy có thể xóa image cần điều tra/rollback, nên không dùng `--force` để tự sửa.
6. Với trigger sự kiện, kiểm Eventarc/Pub/Sub, service agents và dead-letter/retry nếu được cấu hình. Với HTTP/callable, kiểm IAM/invoker và lớp xác thực trong source.
7. Kiểm log khởi động, lỗi request và revision. Đánh giá quota và giới hạn instance theo dịch vụ gây chi phí như AI, email và payment.
8. Sau thay đổi runtime, đọc lại provider revision và so với artifact. Build thành công không đủ xác nhận source đang chạy.

Khi cần đổi region/runtime identity, kiểm dữ liệu, domain rewrite, secret permission, event routing và cold start. Không xóa function cũ để “dọn sạch” trong cùng lần triển khai nếu chưa có kế hoạch chuyển đổi và phê duyệt riêng.

## 15 GitHub production environment và Workload Identity Federation

### GitHub

1. Mở repository Settings và xem branch rules cho `main`; giữ nguyên yêu cầu review/checks của tổ chức.
2. Vào Environments, xác nhận environment tên chính xác `production` và branch policy. Không gỡ reviewer gate chỉ để workflow tự chạy; cấu hình hiện hành phải được người có thẩm quyền quyết định.
3. Trong Actions variables, ghi các biến public web từ chương 09. Workflow hiện cố định project, app ID, region và các cờ production; kiểm scope biến ở repo/environment trước khi sửa.
4. Trong environment `production`, đặt tên biến `GCP_WORKLOAD_IDENTITY_PROVIDER` và `GCP_DEPLOY_SERVICE_ACCOUNT` theo tài nguyên đã được xác nhận.
5. Kiểm workflow `.github/workflows/release.yml`, quyền `id-token: write`, deployment environment và trigger push `main`.
6. Ghi URL run đầu tiên được kiểm tra, source SHA, tag và receipt. Không coi draft release là bản đã phát hành thành công.

[GitHub deployment environments](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments).

### Google Cloud WIF

1. Xem `scripts/release/production-wif.json` và đối chiếu pool/provider có sẵn trên Google Cloud.
2. Định danh dự kiến là pool `github-release`, provider `satsunicgo-main`, account `github-release@satsunicgo.iam.gserviceaccount.com`.
3. Đối chiếu issuer `https://token.actions.githubusercontent.com` và numeric repo/owner IDs. Nếu repo chuyển owner hoặc thay subject format, trust condition phải được xem lại.
4. Kiểm điều kiện khóa vào `main`, sự kiện push, đúng workflow release và environment production. Không mở wildcard để hết lỗi đăng nhập.
5. Kiểm quyền impersonation và vai trò deploy/verify theo `production-deployer-role.json`. Không grant Owner/Editor hay quyền đọc secret payload cho account triển khai chỉ để tiện vận hành.
6. Ghi provider resource đầy đủ từ console vào biến GitHub, theo dạng `projects/278913913091/locations/global/workloadIdentityPools/github-release/providers/satsunicgo-main` nếu provider hiện tại khớp descriptor.
7. Chạy workflow được phép; kiểm token exchange và readback provider. Không xuất OIDC token hoặc service account key vào log.

Đây là mô tả trust trong repo, chưa xác nhận IAM thực tế. [Google WIF cho deployment pipelines](https://docs.cloud.google.com/iam/docs/workload-identity-federation-with-deployment-pipelines).

## 16 Hosting tên miền DNS và chứng chỉ

### Hosting

1. Mở Firebase Hosting và xác nhận site ID, tên miền mặc định và version đang serve.
2. Đối chiếu `firebase.json`: thư mục public `dist`, rewrite vào function theo region và fallback SPA.
3. Kiểm các tuyến động như sản phẩm, bài viết, media, robots và sitemap. Một homepage chạy được không xác nhận toàn bộ rewrite.
4. Kiểm CSP, cache, security headers và assets. CSP hiện cho form gửi sang SePay sandbox; chuyển production cần một thay đổi reviewed, không chỉ đổi secret.
5. Đọc `/release-version.json` trên host thật và so SHA/tag với artifact. Kiểm bytes static và nguồn Functions theo script release, không chỉ nội dung metadata.

### Tên miền riêng

1. Xác nhận tên miền thuộc ai, đăng ký ở đâu, DNS authoritative ở đâu, ngày hết hạn và email nhận gia hạn. Nhà đăng ký/DNS hiện CHƯA XÁC NHẬN; không mặc định Cloudflare.
2. Lưu bản ghi DNS hiện có vào vùng lưu nội bộ trước lần sửa. Phân biệt bản ghi website, email và xác minh domain.
3. Trong Firebase Hosting, chọn kết nối domain đã được duyệt. Lấy chính xác bản ghi xác minh và routing từ provider cho domain đó.
4. Tại DNS provider, thêm/sửa đúng hostname và record; không copy IP hoặc TXT từ ví dụ trên mạng.
5. Chờ xác minh DNS và chứng chỉ; kiểm hostname chính, redirect www/apex, HTTPS và đường dẫn động.
6. Cập nhật Auth authorized domains, OAuth origins/redirect, App Check domain và các callback có liên quan. Việc có certificate không tự cập nhật các nơi này.
7. Ghi TTL, thời điểm, người sửa, record cũ/mới và đường quay lại. Khi rollback, phục hồi bản ghi đã lưu và theo dõi propagation.

[Firebase custom domain](https://firebase.google.com/docs/hosting/custom-domain). Tên miền của website sản phẩm chưa được xác nhận ở lần kiểm tra này; tên miền gửi email `hunpeolabs.com` không tự được coi là host website SatsunicGo.

## 17 Secret Manager và đổi khóa

### Danh mục cần kiểm

| Tên secret theo source | Mục đích thực tế | Điều kiện |
| --- | --- | --- |
| `SFTP_PASSWORD` | API key Resend truyền vào email adapter | Production email; tên legacy |
| `PAYOS_CLIENT_ID` | Client ID của PayOS được khai báo dạng secret | Nhánh PayOS được duyệt |
| `PAYOS_API_KEY` | Xác thực PayOS | Nhánh PayOS được duyệt |
| `PAYOS_CHECKSUM_KEY` | Kiểm tra chữ ký PayOS | Nhánh PayOS được duyệt |
| `GUEST_TRACKING_QUOTA_KEY` | Key phía server phục vụ giới hạn guest tracking | Function production tương ứng |
| `SEPAY_SANDBOX_SECRET_KEY` | Ký/xác thực API SePay sandbox | Chỉ đăng ký theo điều kiện demo trong source |
| `SEPAY_SANDBOX_IPN_SECRET_KEY` | Xác thực IPN SePay sandbox riêng | Cùng giới hạn demo |
| `GEMINI_API_KEY` | GitHub Actions deep review tùy chọn | GitHub secret, không phải mặc định Secret Manager |

### Thiết lập và ghi nhận

1. Xác nhận project và service account tiêu thụ secret. Phân biệt người tạo version, người cấp quyền và runtime reader.
2. Tạo/lưu secret qua kênh được duyệt. Không đưa giá trị vào command line, commit, ticket, slide hoặc screenshot.
3. Ghi secret resource name, version metadata, producer/vendor, consumer functions và người quản lý vào register.
4. Kiểm binding `secrets: [...]` trong function cùng quyền runtime. Secret đã có trong console chưa đủ nếu function chưa bind đúng phiên bản/quyền.
5. Triển khai hoặc khởi động revision mới theo cơ chế provider khi cần và đọc lại binding. Không giả định process cũ tự nhận giá trị mới.
6. Kiểm một thao tác được phép, không in payload xác thực. Lưu outcome và tham chiếu receipt.

### Đổi khóa có kiểm soát

Tạo khóa/version mới theo kế hoạch, cập nhật consumer, kiểm revision và thử có giới hạn. Chỉ thu hồi khóa cũ sau khi xác nhận consumer đã chuyển và các tác vụ dở dang được xử lý. Nếu nhà cung cấp không cho hai khóa cùng sống, cần khoảng chuyển đổi và phương án phục hồi rõ ràng. Version cũ chỉ giúp rollback nếu khóa tương ứng phía nhà cung cấp vẫn còn hiệu lực.



## 18 Resend và tên miền gửi email

### Tài khoản và định danh

Workspace/admin Resend, billing plan, người dự phòng và DNS owner: CHƯA XÁC NHẬN. Mã nguồn yêu cầu `from=contact@hunpeolabs.com`, `verifiedDomain=hunpeolabs.com`. Đây là giá trị schema hiện tại; dùng một domain khác cần cập nhật source theo quy trình.

### Thiết lập từng bước

1. Đăng nhập đúng workspace Resend tại `https://resend.com/`; ghi workspace ID/tên, admin và người quản lý billing.
2. Mở Domains, kiểm tên miền `hunpeolabs.com` đã có chưa. Lấy chính xác bản ghi DNS provider yêu cầu cho domain đó.
3. Phối hợp DNS owner thêm bản ghi xác minh DKIM/SPF cần thiết; kiểm record email hiện có để tránh làm hỏng luồng thư khác.
4. Chờ trạng thái domain được xác minh. Lưu bằng chứng xác thực có ngày, tài nguyên và người kiểm, không chỉ screenshot thiếu định danh workspace.
5. Tạo API key có quyền gửi và phạm vi domain phù hợp. Lưu qua kho bí mật đã duyệt; với source hiện tại, consumer đọc qua secret tên `SFTP_PASSWORD`.
6. Kiểm secret bindings của `deliverEmail` và worker subscription tương ứng trên revision thật.
7. Chuẩn bị `settings/email` theo schema ở dưới. Giữ gửi tắt cho tới khi domain, secret, policy và evidence đã đạt điều kiện. Không dùng setting để vượt gate của code.
8. Đặt cutover cho sự kiện mới được phép; không kéo toàn bộ hàng đợi lịch sử ra gửi. Xác nhận timestamp đã tới hiệu lực và không nằm trong tương lai.
9. Dùng tài khoản thử đã đồng ý và email Firebase Auth được xác minh. Kiểm mục đích liên lạc hiện tại ngay trước gửi.
10. Kiểm provider accepted, trạng thái delivered/bounce nếu có bằng chứng từ provider và inbox thực tế theo phạm vi thử. Ghi chúng riêng.
11. Kiểm timeout/unknown và đối chiếu trước khi thử lại. Giữ cùng request identity/idempotency; không tạo job mới để vượt kết quả chưa rõ.

[Resend domains](https://resend.com/docs/dashboard/domains/introduction), [Resend API keys](https://resend.com/docs/dashboard/api-keys/introduction).

### Cấu hình server hiện tại

| Field ở `settings/email` | Giá trị hoặc ràng buộc nguồn |
| --- | --- |
| `approved` | Phải là `true` trong schema |
| `provider` | `resend` |
| `enabled` | Bật/tắt gửi theo chính sách được duyệt |
| `subscriptionsEnabled` | Bật/tắt luồng subscription riêng |
| `from` | `contact@hunpeolabs.com` |
| `verifiedDomain` | `hunpeolabs.com` |
| `cutoverAt` | Timestamp milliseconds dương, không ở tương lai khi bắt đầu dùng |
| `dailyAttemptLimit` | Số nguyên từ 1 đến 100 |
| `domainVerificationEvidenceId` | Tham chiếu bằng chứng đúng định dạng schema |
| `domainVerifiedAt` | Timestamp milliseconds; không dùng ngày tự đoán |

Worker hiện có lịch `every 30 minutes` ở `asia-southeast1`; phải kiểm job thực tế. Hai luồng dùng giới hạn reserved attempts chung; kết quả không chắc chắn không tự hoàn lại lượt. API trả accepted không chứng minh thư đã đến inbox. Adapter chặn redirect và xử lý timeout như unknown khi không thể kết luận.

### Cập nhật và xử lý lỗi

Đổi API key theo chương 17. Đổi sender/domain phải cập nhật schema, DNS, evidence và policy trước khi bật lại. Nếu 401/403, kiểm key scope và binding; nếu domain chưa verified, sửa xác minh; nếu không có email, kiểm eligibility/consent/cutover/queue và lịch chạy trước khi nghĩ đến lỗi Resend. Không gửi lại hàng loạt job unknown và không bật webhook mới mà không có handler xác thực tương ứng trong ứng dụng.

## 19 SePay Payment Gateway sandbox

Nhánh đang đọc là **Cổng thanh toán SePay**, không phải mọi sản phẩm webhook biến động số dư của SePay. Các dashboard, secret và giao thức có thể khác nhau.

### Thiết lập sandbox

1. Đăng nhập tài khoản quản lý tại `https://my.sepay.vn/`; ghi admin, merchant và người phụ trách. Tài khoản thực tế chưa được xác nhận.
2. Xác nhận đang ở sandbox của Payment Gateway. Merchant trong nguồn là `SP-TEST-HL5339A9`; merchant dashboard phải khớp trước khi dùng.
3. Lấy credential sandbox qua kênh an toàn. Không đưa nó vào client hoặc CSV. API secret và IPN authentication secret là hai cấu hình riêng trong implementation.
4. Xác nhận runtime là demo emulator: `FUNCTIONS_EMULATOR=true`, `GCLOUD_PROJECT=demo-satsunicgo`, Google project alias nếu có cũng phải khớp.
5. Cấu hình `PURCHASE_SEPAY_SANDBOX_ENABLED=true` và các secret sandbox trong runtime demo được phối hợp. Không sửa runtime đang dùng chung khi người khác đang chạy thử.
6. Kiểm entrypoint export endpoint và secret registration theo điều kiện demo. Secret trong Secret Manager production không tự làm sandbox endpoint được mở.
7. Đối chiếu host checkout `https://pay-sandbox.sepay.vn` và API readback `https://pgapi-sandbox.sepay.vn`. Source chỉ cho `BANK_TRANSFER`; NAPAS/card không tự mở bằng dashboard.
8. Callback trả về trong source dùng frontend local 5207 và checkout ID. Callback chỉ phục vụ màn hình; không dùng URL success làm bằng chứng đã thu tiền.
9. Nếu cần genuine IPN, chuẩn bị endpoint HTTPS công khai đã được duyệt và xác thực đúng header theo handler. Localhost không nhận được IPN từ Internet. Không tạo tunnel hoặc expose Auth/Firestore/admin/debug surfaces từ hướng dẫn này.
10. Chạy một đơn sandbox riêng với tài khoản thử. Kiểm hosted checkout, sự kiện IPN được xác thực, readback đúng host và kết quả settlement server.
11. Thử duplicate/delayed IPN, callback cancel/error, sai auth và trường hợp chưa rõ kết quả. Không biến injected negative case thành kết quả provider thật.
12. Ghi request/receipt reference đã làm sạch, thời điểm và kết quả. Không lưu signed form hoặc secret header trong bằng chứng chia sẻ.

[SePay sandbox](https://developer.sepay.vn/vi/cong-thanh-toan/sandbox), [SePay IPN](https://developer.sepay.vn/vi/cong-thanh-toan/IPN).

### Chuyển production

Source hiện khóa nhánh này vào demo và cố định sandbox host/merchant/callback. Không chuyển live bằng cách thay credential. Cần kế hoạch riêng cho merchant thật, KYC/điều kiện kinh doanh, tài khoản nhận tiền, endpoint IPN, CSP, callback host, secret bindings, gate, reconciliation và kiểm thử tiền thật được cho phép. Trạng thái onboarding/KYC không được suy ra từ đăng nhập dashboard thành công.

## 20 PayOS

PayOS có adapter trong source nhưng `releaseCapabilities.payments=false` và gate hiện không mở nhánh payments. Cấu hình `settings/payments.payosEnabled=true` một mình không kích hoạt được luồng này.

1. Xác nhận sản phẩm có quyết định dùng PayOS cho luồng nào và không nhầm với SePay purchase checkout.
2. Đăng nhập đúng tài khoản merchant PayOS; ghi chủ quản, channel/payment integration ID, billing và tài khoản nhận tiền ở mức định danh được phép.
3. Hoàn thành điều kiện onboarding theo provider; không điền trạng thái đã duyệt khi chưa có bằng chứng.
4. Lưu `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY` qua kênh bí mật và bind đúng functions.
5. Chuẩn bị cấu hình `settings/payments`: source kiểm `payosEnabled`, `accountNumber`, `returnOrigin` là HTTPS. Tài khoản nhận tiền chi tiết giữ trong hệ thống được phép; sổ tay chỉ ghi tham chiếu hồ sơ.
6. Xác nhận webhook URL từ endpoint đã triển khai. Dùng API/provider tools kiểm webhook theo tài liệu hiện hành; endpoint phải xác thực chữ ký và đối chiếu account/amount/reference.
7. Duyệt thay đổi code-owned capability và release inventory trước khi mở endpoint. Không vô hiệu hóa gate để “test cho nhanh”.
8. Kiểm tạo intent, kết quả create chưa rõ, webhook trùng, sai amount/account, callback và đối soát. SDK hiện dùng timeout 10 giây và không tự retry create.
9. Ghi lần thử theo từng loại bằng chứng: mock, emulator, provider test hay tiền thật. Không tính cùng một receipt hai lần.

Khi thay channel/key/account nhận tiền, kiểm các intent đang mở và reconciliation trước khi thu hồi key cũ. [PayOS API](https://payos.vn/docs/api/). Chi tiết legal/banking và giao dịch thật cần người sở hữu tài khoản xác nhận.

## 21 Vertex AI và các nhánh AI trong ứng dụng

Không có một công tắc AI chung đủ để kết luận toàn bộ trợ lý đang mở. `provider-release-gate.ts` có cờ `ai=false`, nhưng source hiện có module `ask-production.ts` riêng với policy và giới hạn cho AI khách hàng. Cần trace đúng entrypoint và nhánh gọi trước khi kết luận.

### Kiểm kê nhánh runtime

1. Đọc `functions/src/ai/ask.ts`, `ask-production.ts` và entrypoint. Xác định function nào được artifact đưa lên, nhánh nào sử dụng Vertex và nhánh nào chỉ xử lý nội dung/tri thức đã kiểm soát.
2. Ghi project `satsunicgo`, runtime service account thực tế và quyền gọi model. Module này lấy credential từ Admin app, không đọc `GEMINI_API_KEY` của GitHub.
3. Model trong source là `gemini-2.5-flash-lite`, location `us-central1`. Không suy ra region AI giống region Functions.
4. Kiểm khả năng dùng model, quota, tình trạng vòng đời và giá hiện hành từ provider trước mỗi lần gia hạn. Comment về giá/lịch retirement là thông tin ở thời điểm viết source, không dùng như xác nhận giá hiện tại.
5. Kiểm project billing và API cần thiết; chỉ cấp quyền model/runtime cần dùng theo kế hoạch được duyệt.
6. Đối chiếu `settings/askCustomerAi` với schema nguồn: enabled, audience, canaryUid, maxBudgetVnd, activatedAt, expiresAt, version và releaseId.
7. Bắt đầu bằng audience `owner-canary` khi được duyệt. Người canary phải đáp ứng kiểm tra tài khoản, vai trò và phiên thật; không coi một UID viết trong setting là đủ.
8. Ghi giới hạn nguồn tại thời điểm này: ngân sách tổng 50.000 VND, theo người 5.000 VND, reserve 1.000 VND/lần, 10 request/phút chung, 2 request/phút/người, input tối đa 10.000 token, output tối đa 800.
9. Nguồn khóa thời hạn pricing `2026-10-12T00:00:00Z`, cửa sổ policy tối đa 24 giờ và releaseId `ask-customer-20261010-v1`. Không chỉ sửa expiresAt trong database để vượt thời hạn source.
10. Kiểm log, reservation, response, unknown và tải giới hạn với dữ liệu thử được phép. Không lưu prompt khách hoặc thông tin cá nhân vào hồ sơ setup.

### Cập nhật model hoặc mở rộng audience

Đổi model, pricing envelope, thời hạn, region, ngân sách hoặc audience cần đánh giá source và policy cùng nhau. Thử canary, kiểm chất lượng câu trả lời, an toàn nghiệp vụ, latency và chi phí rồi mới mở rộng. Không hoàn lại reservation cho request có kết quả chưa rõ chỉ để mở ngân sách. Endpoint có thể đổi theo sản phẩm Google; đối chiếu [tài liệu model của Google Cloud](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/start) và hợp đồng gọi hiện tại trước thay đổi.

## 22 Gemini API cho deep review trong GitHub

Nhánh này phục vụ kiểm tra mã nguồn, không phải credential cho trợ lý đang chạy trong ứng dụng.

1. Đọc `.github/workflows/deep-review.yml` và `docs/releases/DEEP-REVIEW.md`.
2. Xác nhận repository variable `AI_REVIEW_ENABLED` và quyết định có bật workflow tùy chọn hay không. Không suy ra workflow bắt buộc từ việc file tồn tại.
3. Xác nhận tài khoản/project quản lý Gemini API, quota, billing và người nhận cảnh báo. Ghi riêng với Google Cloud runtime identity.
4. Lưu key trong GitHub Actions secret tên `GEMINI_API_KEY`; workflow truyền sang `OCR_LLM_TOKEN`. Không đưa vào repository variable công khai.
5. Kiểm giới hạn nhánh trusted và cách xử lý external PR. Không cấp key cho mã từ fork không đáng tin.
6. Workflow hiện tải công cụ được pin phiên bản và kiểm checksum. Khi cập nhật công cụ, kiểm checksum, quyền thực thi và nội dung report.
7. Chạy trên trusted branch đã được phép, kiểm báo cáo coverage và artifact. Ghi rõ review mang tính tư vấn hay gate bắt buộc theo workflow hiện tại.
8. Khi tắt, đổi variable theo quy trình; khi key bị lộ, thu hồi ở provider và cập nhật secret. Không sửa ngưỡng/checksum chỉ để report xanh.

Không cần bật dịch vụ này để giải quyết cấu hình Firebase/Resend/SePay. Nếu chưa chọn dùng, ghi THEO ĐIỀU KIỆN cùng người ra quyết định, thay vì tạo key rồi bỏ quên.

## 23 Scheduler sự kiện và tác vụ nền

1. Từ inventory Functions, nhóm trigger HTTP/callable, Firestore/Storage event và schedule. Ghi từng function cùng tài nguyên kích hoạt thật.
2. Kiểm Scheduler job target, service account, timezone, cadence, retry và trạng thái enabled. Không tự thêm job thứ hai vì chưa nhìn thấy log gần đây.
3. Email worker trong source có lịch 30 phút; runtime job cần được đọc lại. Cờ `scheduledMaintenance=false` không tự mô tả toàn bộ scheduled email vì email có gate riêng.
4. Với Eventarc/Pub/Sub, kiểm subscription/trigger và service agent permission đúng project/region. Không xóa tài nguyên “mồ côi” nếu chưa trace consumer và backlog.
5. Kiểm cách lock/claim và idempotency của từng worker; Scheduler có thể gọi lại, còn event có thể đến trùng hoặc muộn.
6. Khi tạm dừng, ghi tác vụ đang xử lý, hàng đợi và kết quả unknown. Khi mở lại, kiểm cutover và eligibility; không drain toàn bộ lịch sử.
7. Sau cập nhật, xem log invocation, số lỗi và backlog. Một job hiện enabled chưa chứng minh handler đã xử lý thành công.

Ghi các lịch bằng timezone cụ thể. Các timestamp nghiệp vụ trong schema thường là milliseconds; không đổi sang seconds khi nhập tay chỉ vì dashboard hiển thị khác.

## 24 Cấu hình nghiệp vụ trong ứng dụng

Infra vận hành được chưa đủ nếu giá, vùng mua hộ, biểu cước và chính sách chưa hợp lệ. Cấu hình nghiệp vụ phải được quản lý cùng schema và quyền owner/operations của ứng dụng.

1. Lập danh sách cấu hình từ server modules, gồm pricing/upfront checkout, khu vực, shipping rates, membership, email, payments và AI policy theo implementation hiện tại.
2. Ưu tiên giao diện hoặc callable quản trị đã có. Chỉ chỉnh trực tiếp database khi có thủ tục được duyệt và biết đầy đủ schema/audit/version.
3. Ghi người chịu trách nhiệm nghiệp vụ khác với người có quyền kỹ thuật. Người sửa được field không tự có quyền phê duyệt chính sách giá.
4. Kiểm version, ngày hiệu lực/hết hạn, đơn vị tiền, timezone và dữ liệu mà server dùng để tính.
5. Kiểm ba đường mua hàng riêng: catalog full payment, custom qua quote với khoản đầu theo rule hiện tại và custom upfront tính tổng ở server. Không lấy wording homepage thay cho rule backend.
6. Khi đổi giá/cước, kiểm giỏ đang mở, snapshot đã xác nhận và expected version. Không cập nhật đơn đã thu tiền chỉ vì chính sách mới vừa có hiệu lực.
7. Sau thay đổi, dùng một yêu cầu thử phù hợp để kiểm kết quả tính ở server và quyền truy cập. Ghi phiên bản chính sách dùng trong kết quả.

Sổ tay này không xuất cấu hình production đang chứa dữ liệu nhạy cảm. Các đường dẫn/settings khác chưa được đọc lại live phải ghi theo source và xác nhận riêng khi bàn giao.

## 25 Logging Monitoring và cảnh báo

### Thiết lập

1. Mở Logs Explorer đúng project; lọc theo service/function/revision thực tế.
2. Xác nhận ai có quyền xem log và log có vô tình chứa payload, email, địa chỉ hoặc credential không. Không cấp rộng quyền đọc log khi dữ liệu không được phân loại.
3. Ghi dashboard hoặc saved query cho lỗi HTTP/callable, permission/App Check, worker email, payment/IPN, AI quota và job backlog.
4. Tạo alert theo ngưỡng đã được duyệt; ghi mục đích, cửa sổ đo, điều kiện mở/đóng và người trực. Không dùng một ngưỡng mẫu cho mọi function.
5. Kiểm notification channels bằng một alert thử được phép. Email cấu hình trong console chưa chứng minh người trực nhận được.
6. Ghi link runbook tương ứng cho từng alert và cách xác định mức ảnh hưởng. Lỗi email provider khác với queue chưa đủ eligibility.
7. Kiểm retention và chi phí log; đặt mức ghi phù hợp mà vẫn giữ audit cần thiết. Không tắt audit/security monitoring để giảm nhiễu.

### Cập nhật và điều tra

Khi đổi tên function, revision hoặc region, cập nhật filter và dashboard. Dùng correlation/reference an toàn, không dùng raw token. Với payment/email unknown, thông báo vận hành phải hướng tới đối chiếu kết quả, không tự retry. Với AI, kiểm reservation và expiration trước khi tăng quota.

Chưa có danh sách alert live, số điện thoại/email trực hoặc SLA được xác nhận trong task này. Điền chúng trong account/resource register sau phiên kiểm tra console.

## 26 Backup phục hồi và lưu bản cấu hình

### Thiết lập hồ sơ backup

1. Xác định dữ liệu cần phục hồi: Firestore, Storage, Auth identities/cấu hình, secrets metadata, IAM, DNS, các thiết lập GitHub và bản phát hành.
2. Ghi RPO/RTO đã được chủ hệ thống duyệt cho từng nhóm. Chưa có quyết định thì để CHƯA XÁC NHẬN, không tự điền 24 giờ hoặc 1 giờ.
3. Kiểm khả năng backup/PITR và lịch hiện có của Firestore trên database thật. Không suy ra backup được bật vì có test restore trong repo.
4. Xác nhận nơi lưu, retention, quyền đọc và quyền xóa của bản sao. Tách quyền vận hành ứng dụng với quyền phá hủy toàn bộ bản backup khi phù hợp.
5. Ghi Storage versioning/backup riêng; Firestore backup không chứa toàn bộ file Storage.
6. Ghi phương án Auth và quyền khôi phục tài khoản; không coi backup database là bản sao toàn bộ Firebase project.
7. Lưu cấu hình không nhạy cảm, revision và tham chiếu secret version. Không xuất secret payload vào bundle backup tài liệu.
8. Diễn tập restore vào mục tiêu cô lập đã duyệt, kiểm tính toàn vẹn và quyền truy cập rồi ghi thời gian thực tế. Không restore đè production trong lần kiểm tra thông thường.

[Firestore backup và restore](https://firebase.google.com/docs/firestore/backups). Tùy tính năng/gói dịch vụ hiện tại, điều kiện thiết lập và tài nguyên đích có thể khác; kiểm provider trước thực hiện.

### Quay lại cấu hình

DNS có bản ghi cũ; secret có version cũ còn hiệu lực; policy có version đã duyệt; Hosting/Functions có artifact và receipt. Ghi quan hệ giữa các bản này trước khi thay đổi. Không dùng “rollback” như một thao tác đơn lẻ có thể phục hồi đồng thời mọi dịch vụ.

## 27 Phát hành cập nhật và quay về phiên bản trước

Luồng hiện tại: quality checks, đóng gói version/artifact, triển khai production, đọc lại provider, sau đó publish GitHub Release. Workflow deploy `functions:satsunicgo,hosting`; không tự deploy Firestore/Storage rules hoặc indexes.

1. Chọn source SHA và thay đổi đã được duyệt. Đọc trạng thái worktree/PR; không push toàn bộ dirty main.
2. Kiểm public build config, runtime secrets metadata/bindings và thay đổi policy cần kèm theo.
3. Cho workflow chạy bộ kiểm tra của repo. Không bỏ gate vì bước deploy đang chờ.
4. Kiểm tag, artifact checksum, manifest và source association. Không rebuild lại artifact đã giữ chỗ version để “thử lại”.
5. Kiểm deploy identity và inventory provider trước khi promote; không chấp nhận việc xóa function ngầm.
6. Sau deploy, đọc Hosting bytes/version và source package/revision Functions. Deploy exit 0 chưa đủ để publish.
7. Kiểm nghiệp vụ theo phạm vi: đăng nhập/MFA, private data, payment, email, AI và các cấu hình vừa thay. Provider package match không chứng minh tất cả tích hợp nghiệp vụ.
8. Ghi receipt và link run; nếu verification lỗi, giữ release draft và kiểm trạng thái từng phần.

Khi rollback, phối hợp khóa phát hành, chọn bản verified trước đó, kiểm artifact gốc và inventory hiện tại. Không force-push, đổi tag hoặc tự xóa function mới để khớp bản cũ. Hosting và Functions không deploy nguyên tử; có thể một phần đã đổi dù run thất bại. Rollback rules, data, secrets và provider settings cần đánh giá riêng.

Nguồn vận hành: `docs/releases/CICD-108.md`, workflow release và các script `scripts/release/`. Các con số function held trong tài liệu cũ có thể không còn khớp source mới; dùng manifest của artifact được chọn và inventory provider tại thời điểm thực hiện.

## 28 Tra cứu khi cần đổi một cấu hình

| Cần thay đổi | Những nơi phải kiểm | Xác nhận sau thay đổi |
| --- | --- | --- |
| Đổi domain website | DNS, Hosting, Auth, OAuth, App Check, callback, origin/CSP | HTTPS, login, token, routing và luồng callback |
| Đổi Resend key | Resend workspace, Secret Manager version, worker bindings | Revision mới, gửi thử được phép, xử lý unknown |
| Đổi email gửi | Schema source, verified domain, DNS, policy và templates | Đúng sender, eligibility, provider outcome |
| Đổi merchant/payment key | Provider dashboard, secret, handler, pending intents, reconciliation | Reference/amount/account, chữ ký và chống trùng |
| Đổi người quản trị | Provider members, MFA, billing, alert, recovery, kho mật khẩu | Người mới và dự phòng đăng nhập bằng account riêng |
| Đổi repo owner/name | Remote, WIF numeric IDs/subject/workflow_ref, environment, release links | CI OIDC, quyền artifact và publish |
| Đổi Node/Firebase CLI | Runtime, workflow, lock, build, artifact và provider | Quality gates, package match, revision health |
| Đổi region/project | Dữ liệu, Auth, bucket, runtime, secrets, OAuth, DNS và quota | Kế hoạch migration và nghiệm thu riêng |
| Đổi AI model/budget | Source limits, policy, giá hiện hành, quota, IAM và log | Canary, budget reservation và chất lượng trả lời |
| Đổi rules/index | Source query, tests, provider rules và index build | Unauthorized cases và truy vấn hợp lệ |
| Đổi lịch worker | Source trigger, Scheduler, queue lock, retry/cutover | Không job trùng và không gửi backlog ngoài policy |
| Đổi backup retention | Backup destination, quyền xóa, pháp lý, chi phí | Restore thử và tuổi bản sao đạt RPO |

Mỗi thay đổi nên có một dòng trong `CHANGE-LOG.csv`, liên kết plan/approval, snapshot trước, kết quả sau và bước quay lại. Nếu thay đổi chạm nhiều dịch vụ, ghi một người điều phối và thứ tự cập nhật.

## 29 Lịch bảo trì và bàn giao

### Kiểm tra định kỳ

Hằng tuần, xem release lỗi, queue/email/payment unknown, job nền và chi phí bất thường theo vận hành thực tế. Hằng tháng, kiểm billing budget, quota, người nhận cảnh báo, lần backup mới nhất và quyền quản trị còn cần thiết. Trước ngày hết hạn domain, certificate/credential hoặc model/policy, lập lịch thay đổi đủ sớm theo mức rủi ro. Đây là lịch đề xuất cần người vận hành chốt, không phải tác vụ đã được tự động tạo.

Không mặc định mọi secret phải đổi cùng một ngày. Ưu tiên khi có sự cố, người quản trị rời nhóm, key bị lộ, provider yêu cầu hoặc đến hạn chính sách nội bộ. Mọi lần xoay khóa vẫn phải xét tác vụ đang chạy và khả năng phục hồi.

### Biên bản bàn giao tối thiểu

- Người nhận có account riêng, MFA và quyền đọc đúng bảng điều khiển.
- Người dự phòng và đường khôi phục được xác nhận.
- Định danh project/app/bucket/repo/domain khớp nguồn và provider.
- Biến công khai, secret metadata và policy được phân loại đúng nơi lưu.
- Release gần nhất, artifact, receipt và rollback path truy cập được.
- Các kết quả unknown, khoản đối soát và backlog còn mở có người phụ trách.
- Backup gần nhất và lần restore thử có chứng cứ, không chỉ có lịch trên console.
- Billing, gia hạn, cảnh báo và support contact có người nhận.
- Tất cả mục CHƯA XÁC NHẬN có người hoàn thiện và ngày dự kiến.

## 30 Các mục còn cần chủ hệ thống xác nhận

| Mục còn thiếu | Nơi lấy thông tin | Ghi vào đâu |
| --- | --- | --- |
| Email quản trị Google Cloud/Firebase và người dự phòng | IAM, Firebase users and permissions | Account register |
| Billing account và người thanh toán | Cloud Billing | Account/resource register |
| Admin GitHub, quyền repo và environment live | Repository settings | Account register |
| Runtime service accounts và quyền thật | Function/Cloud Run/IAM | Resource register |
| Nhà đăng ký domain, DNS provider, hạn gia hạn | Domain owner và registrar | Account register |
| Domain website, auth domain và bucket đang dùng | Firebase, DNS và config build | Configuration register |
| Admin/workspace Resend, domain evidence và key version | Resend và Secret Manager metadata | Account/secret register |
| Tài khoản SePay, merchant sở hữu, IPN endpoint thật | Merchant dashboard và owner | Account/resource register |
| PayOS có được chọn dùng và trạng thái onboarding | Quyết định sản phẩm và merchant | Account register |
| AI live policy, runtime model access, canary evidence | Source, Firestore policy và provider | Configuration/resource register |
| Gemini API CI owner và quyết định bật | GitHub settings và provider project | Account register |
| Alert channels, người trực và SLA | Monitoring và người vận hành | Account/resource register |
| Backup, retention, RPO/RTO và restore receipt | Database/storage backup và owner | Resource register |
| Kho mật khẩu tổ chức và mục recovery | Người quản lý truy cập | Account register, chỉ tham chiếu |

Tài liệu được hoàn thiện tiếp bằng các xác nhận này; không cần gửi mật khẩu hoặc token trong chat. Nếu một dịch vụ không được chọn dùng, ghi KHÔNG ÁP DỤNG kèm người xác nhận thay vì để nó như một hạng mục chưa làm.

## 31 Nguồn tham chiếu và thời điểm kiểm tra

Nguồn nội bộ được khóa hash trong `review/SOURCE-MANIFEST.json`. Phạm vi gồm cấu hình Firebase, client, Functions, adapter tích hợp, provider gates, workflow và script release. Chỉ mục CodeGraph/CocoIndex được dùng để định hướng nhưng gate vẫn DEGRADED vì độ mới/health chưa đạt; các kết luận chính được kiểm từ source.

Các liên kết provider trong từng chương được truy cập ngày 10/10/2026. Tên menu có thể đổi theo giao diện và ngôn ngữ. Khi thao tác, ưu tiên định danh tài nguyên và tính năng cần tìm; không tự chọn một mục gần giống để tiếp tục.

Sổ tay này không đọc giá trị trong `.env`, credential store, secret payload hoặc dữ liệu khách production. Không có phiên kiểm tra trực tiếp danh sách account/IAM/provider live trong lần lập tài liệu này. `review/VERIFICATION.md` ghi kết quả kiểm tài liệu và các giới hạn.


## 32 Danh mục tài khoản và cấu hình kèm theo

Năm tệp CSV đi kèm là hồ sơ có thể cập nhật sau mỗi lần vận hành. Danh mục tài khoản có 23 nhóm dịch vụ; danh mục cấu hình chứa 41 tên được quét từ source/workflow. Quét tĩnh không bảo đảm tìm được mọi tên cấu hình động hoặc cấu hình chỉ có ở provider.

### Tài khoản quản lý

| Dịch vụ | Email quản trị do người dùng cung cấp | Định danh cần đối chiếu |
| --- | --- | --- |
| Google Cloud | `hunpeo97@gmail.com` | satsunicgo / 278913913091 |
| Firebase | `hunpeo97@gmail.com` | satsunicgo; web app 1:278913913091:web:e40355cd8ad5abe00f9936 |
| GitHub | `hunpeo97@gmail.com` | phamhungptithcm/SatsunicGo |
| Domain registrar | `hunpeo97@gmail.com` | Domain website CHƯA XÁC NHẬN; hunpeolabs.com là domain gửi trong source |
| DNS provider | `hunpeo97@gmail.com` | Authoritative zone CHƯA XÁC NHẬN |
| Google OAuth | `hunpeo97@gmail.com` | OAuth client ID CHƯA XÁC NHẬN |
| Identity Platform MFA | `hunpeo97@gmail.com` | satsunicgo; phương thức/gói live CHƯA XÁC NHẬN |
| App Check reCAPTCHA Enterprise | `hunpeo97@gmail.com` | Web app satsunicgo; key CHƯA XÁC NHẬN |
| Cloud Billing | `hunpeo97@gmail.com` | Billing account CHƯA XÁC NHẬN |
| Secret Manager | `hunpeo97@gmail.com` | Secret names ở sổ tay; version live CHƯA XÁC NHẬN |
| Firebase Hosting | `hunpeo97@gmail.com` | satsunicgo.web.app; site ID live CHƯA XÁC NHẬN |
| Firestore | `hunpeo97@gmail.com` | Database ID/location live CHƯA XÁC NHẬN |
| Cloud Storage | `hunpeo97@gmail.com` | Bucket ID live CHƯA XÁC NHẬN |
| Cloud Functions Cloud Run | `hunpeo97@gmail.com` | Codebase satsunicgo / asia-southeast1 / Node 22 |
| Cloud Build Artifact Registry | `hunpeo97@gmail.com` | Repository và service agents CHƯA XÁC NHẬN |
| Scheduler Eventarc PubSub | `hunpeo97@gmail.com` | Từng job/trigger live CHƯA XÁC NHẬN |
| Resend | `hunpeo97@gmail.com` | Workspace ID CHƯA XÁC NHẬN; sender contact@hunpeolabs.com |
| SePay Payment Gateway | `hunpeo97@gmail.com` | Sandbox merchant source SP-TEST-HL5339A9 |
| PayOS | `hunpeo97@gmail.com` | Integration/channel CHƯA XÁC NHẬN |
| Vertex AI runtime | `hunpeo97@gmail.com` | satsunicgo; us-central1; model theo source |
| Gemini API CI | `hunpeo97@gmail.com` | Project/key owner CHƯA XÁC NHẬN |
| Monitoring Logging | `hunpeo97@gmail.com` | Alert channels/dashboard IDs CHƯA XÁC NHẬN |
| Password manager recovery | `hunpeo97@gmail.com` | Tên kho và item recovery CHƯA XÁC NHẬN |

Email chung do người dùng xác nhận; chưa kiểm phiên đăng nhập/quyền riêng từng dịch vụ. Các nhóm Google Cloud dùng chung project không nhất thiết cần đăng ký nhiều tài khoản độc lập.

### Từng tên cấu hình

#### AI_REVIEW_ENABLED

Bật deep review tùy chọn. Phân loại: RUNTIME/CI METADATA.

- Giá trị hoặc quy tắc: CHƯA XÁC NHẬN live.
- Nơi thay đổi: GitHub repository variable.
- Sau cập nhật: Workflow trusted branch và report coverage.
- Nguồn: `.github/workflows/deep-review.yml`.

#### DEV

Cờ Vite development. Phân loại: RUNTIME/CI METADATA.

- Giá trị hoặc quy tắc: Do bundler cung cấp.
- Nơi thay đổi: Build tooling.
- Sau cập nhật: Không tự đặt thành true để mở demo trong production.
- Nguồn: `src/app/App.tsx`, `src/shared/firebase.ts`, `src/features/ask/Ask.tsx`, `src/features/ask/CatalogSearch.tsx`.

#### EMAIL_TEST_ENABLED

Cho phép self-test email theo source. Phân loại: RUNTIME/CI METADATA.

- Giá trị hoặc quy tắc: CHƯA XÁC NHẬN.
- Nơi thay đổi: Backend self-test configuration.
- Sau cập nhật: Chỉ quy trình self-test được phép.
- Nguồn: `functions/src/email/self-test.ts`.

#### EMAIL_TEST_RECIPIENT

Người nhận self-test giới hạn. Phân loại: RUNTIME/CI METADATA.

- Giá trị hoặc quy tắc: CHƯA XÁC NHẬN; không xuất địa chỉ thật tự động.
- Nơi thay đổi: Backend self-test configuration.
- Sau cập nhật: Tài khoản thử/consent/policy đúng.
- Nguồn: `functions/src/email/self-test.ts`.

#### FIREBASE_AUTH_EMULATOR_HOST

Danh tính/runtime fence do nền tảng hoặc emulator cấp. Phân loại: RUNTIME/CI METADATA.

- Giá trị hoặc quy tắc: Theo runtime thật; không giả lập production.
- Nơi thay đổi: Provider runtime/emulator config.
- Sau cập nhật: Project/database identity và môi trường phải nhất quán.
- Nguồn: `functions/src/ai/ask-production.ts`.

#### FIREBASE_CONFIG

Danh tính/runtime fence do nền tảng hoặc emulator cấp. Phân loại: RUNTIME/CI METADATA.

- Giá trị hoặc quy tắc: Theo runtime thật; không giả lập production.
- Nơi thay đổi: Provider runtime/emulator config.
- Sau cập nhật: Project/database identity và môi trường phải nhất quán.
- Nguồn: `functions/src/purchase-environment.ts`.

#### FIRESTORE_EMULATOR_HOST

Danh tính/runtime fence do nền tảng hoặc emulator cấp. Phân loại: RUNTIME/CI METADATA.

- Giá trị hoặc quy tắc: Theo runtime thật; không giả lập production.
- Nơi thay đổi: Provider runtime/emulator config.
- Sau cập nhật: Project/database identity và môi trường phải nhất quán.
- Nguồn: `functions/src/purchase-environment.ts`, `functions/src/ai/ask-production.ts`, `functions/src/email/dispatch.ts`.

#### FUNCTIONS_EMULATOR

Danh tính/runtime fence do nền tảng hoặc emulator cấp. Phân loại: RUNTIME/CI METADATA.

- Giá trị hoặc quy tắc: Theo runtime thật; không giả lập production.
- Nơi thay đổi: Provider runtime/emulator config.
- Sau cập nhật: Project/database identity và môi trường phải nhất quán.
- Nguồn: `functions/src/customer-order-tracking.ts`, `functions/src/purchase-checkout.ts`, `functions/src/purchase-adjustment.ts`, `functions/src/membership.ts`.

#### GCLOUD_PROJECT

Danh tính/runtime fence do nền tảng hoặc emulator cấp. Phân loại: RUNTIME/CI METADATA.

- Giá trị hoặc quy tắc: Theo runtime thật; không giả lập production.
- Nơi thay đổi: Provider runtime/emulator config.
- Sau cập nhật: Project/database identity và môi trường phải nhất quán.
- Nguồn: `functions/src/index.ts`, `functions/src/purchase-environment.ts`, `functions/src/payments/sepay-sandbox.ts`, `functions/src/ai/research-live.ts`.

#### GCP_DEPLOY_SERVICE_ACCOUNT

Account deploy/verify. Phân loại: RUNTIME/CI METADATA.

- Giá trị hoặc quy tắc: github-release@satsunicgo.iam.gserviceaccount.com theo descriptor.
- Nơi thay đổi: GitHub production environment variable + IAM.
- Sau cập nhật: Quyền deploy/verify; không secret payload.
- Nguồn: `.github/workflows/release.yml`, `.github/workflows/release.yml`, `.github/workflows/release.yml`.

#### GCP_WORKLOAD_IDENTITY_PROVIDER

OIDC provider resource. Phân loại: RUNTIME/CI METADATA.

- Giá trị hoặc quy tắc: Theo WIF descriptor; cần provider readback.
- Nơi thay đổi: GitHub production environment variable.
- Sau cập nhật: Token exchange và numeric identity condition.
- Nguồn: `.github/workflows/release.yml`, `.github/workflows/release.yml`, `.github/workflows/release.yml`.

#### GEMINI_API_KEY

Credential deep review CI. Phân loại: BÍ MẬT.

- Giá trị hoặc quy tắc: KHÔNG LƯU GIÁ TRỊ.
- Nơi thay đổi: GitHub Actions secret.
- Sau cập nhật: Trusted code only, không lộ trong external PR.
- Nguồn: `.github/workflows/deep-review.yml`.

#### GOOGLE_CLOUD_PROJECT

Danh tính/runtime fence do nền tảng hoặc emulator cấp. Phân loại: RUNTIME/CI METADATA.

- Giá trị hoặc quy tắc: Theo runtime thật; không giả lập production.
- Nơi thay đổi: Provider runtime/emulator config.
- Sau cập nhật: Project/database identity và môi trường phải nhất quán.
- Nguồn: `functions/src/payments/sepay-sandbox.ts`, `functions/src/ai/ask-production.ts`, `functions/src/email/self-test.ts`.

#### GUEST_TRACKING_QUOTA_KEY

Credential server theo adapter tương ứng. Phân loại: BÍ MẬT.

- Giá trị hoặc quy tắc: KHÔNG LƯU GIÁ TRỊ.
- Nơi thay đổi: Secret Manager + function bindings.
- Sau cập nhật: Provider scope + version binding + phép thử được duyệt.
- Nguồn: `functions/src/public-order-tracking.ts`.

#### NODE_OPTIONS

Runtime/telemetry theo source. Phân loại: RUNTIME/CI METADATA.

- Giá trị hoặc quy tắc: CHƯA XÁC NHẬN.
- Nơi thay đổi: Runtime configuration và telemetry policy.
- Sau cập nhật: Không mở exporter/flags ngoài policy.
- Nguồn: `functions/src/ai/telemetry-policy.ts`.

#### OTEL_METRICS_EXPORTER

Runtime/telemetry theo source. Phân loại: RUNTIME/CI METADATA.

- Giá trị hoặc quy tắc: CHƯA XÁC NHẬN.
- Nơi thay đổi: Runtime configuration và telemetry policy.
- Sau cập nhật: Không mở exporter/flags ngoài policy.
- Nguồn: `functions/src/ai/telemetry-policy.ts`.

#### OTEL_PROPAGATORS

Runtime/telemetry theo source. Phân loại: RUNTIME/CI METADATA.

- Giá trị hoặc quy tắc: CHƯA XÁC NHẬN.
- Nơi thay đổi: Runtime configuration và telemetry policy.
- Sau cập nhật: Không mở exporter/flags ngoài policy.
- Nguồn: `functions/src/ai/telemetry-policy.ts`.

#### PAYOS_API_KEY

Credential server theo adapter tương ứng. Phân loại: BÍ MẬT.

- Giá trị hoặc quy tắc: KHÔNG LƯU GIÁ TRỊ.
- Nơi thay đổi: Secret Manager + function bindings.
- Sau cập nhật: Provider scope + version binding + phép thử được duyệt.
- Nguồn: `functions/src/payments/payos.ts`.

#### PAYOS_CHECKSUM_KEY

Credential server theo adapter tương ứng. Phân loại: BÍ MẬT.

- Giá trị hoặc quy tắc: KHÔNG LƯU GIÁ TRỊ.
- Nơi thay đổi: Secret Manager + function bindings.
- Sau cập nhật: Provider scope + version binding + phép thử được duyệt.
- Nguồn: `functions/src/payments/payos.ts`.

#### PAYOS_CLIENT_ID

Credential server theo adapter tương ứng. Phân loại: BÍ MẬT.

- Giá trị hoặc quy tắc: KHÔNG LƯU GIÁ TRỊ.
- Nơi thay đổi: Secret Manager + function bindings.
- Sau cập nhật: Provider scope + version binding + phép thử được duyệt.
- Nguồn: `functions/src/payments/payos.ts`.

#### PUBLIC_ORIGIN

Canonical origin phía public server. Phân loại: RUNTIME/CI METADATA.

- Giá trị hoặc quy tắc: CHƯA XÁC NHẬN live.
- Nơi thay đổi: Functions runtime env.
- Sau cập nhật: Public URL/sitemap/canonical khớp host.
- Nguồn: `functions/src/public.ts`.

#### PURCHASE_SEPAY_SANDBOX_ENABLED

Bật sandbox demo có điều kiện. Phân loại: RUNTIME/CI METADATA.

- Giá trị hoặc quy tắc: true chỉ trong demo được phép.
- Nơi thay đổi: Demo backend env.
- Sau cập nhật: Exact project fence + hai secret + provider sandbox.
- Nguồn: `functions/src/payments/sepay-sandbox.ts`.

#### SEPAY_SANDBOX_IPN_SECRET_KEY

Credential server theo adapter tương ứng. Phân loại: BÍ MẬT.

- Giá trị hoặc quy tắc: KHÔNG LƯU GIÁ TRỊ.
- Nơi thay đổi: Demo runtime riêng.
- Sau cập nhật: Provider scope + version binding + phép thử được duyệt.
- Nguồn: `functions/src/payments/sepay-sandbox.ts`.

#### SEPAY_SANDBOX_SECRET_KEY

Credential server theo adapter tương ứng. Phân loại: BÍ MẬT.

- Giá trị hoặc quy tắc: KHÔNG LƯU GIÁ TRỊ.
- Nơi thay đổi: Demo runtime riêng.
- Sau cập nhật: Provider scope + version binding + phép thử được duyệt.
- Nguồn: `functions/src/payments/sepay-sandbox.ts`.

#### SFTP_PASSWORD

API key Resend; tên legacy. Phân loại: BÍ MẬT.

- Giá trị hoặc quy tắc: KHÔNG LƯU GIÁ TRỊ.
- Nơi thay đổi: Secret Manager + email function binding.
- Sau cập nhật: Key scope/domain và gửi thử được phép.
- Nguồn: `functions/src/subscription-email.ts`, `functions/src/email.ts`, `functions/src/email/self-test.ts`.

#### VITE_ASK_COMMERCE_ENABLED

Cờ UI cho nhánh Ask. Phân loại: PUBLIC BUILD.

- Giá trị hoặc quy tắc: CHƯA XÁC NHẬN.
- Nơi thay đổi: Client build + nhánh server tương ứng.
- Sau cập nhật: UI flag không tự mở quyền/capability server.
- Nguồn: `src/features/ask/Ask.tsx`.

#### VITE_ASK_FEEDBACK_ENABLED

Cờ UI cho nhánh Ask. Phân loại: PUBLIC BUILD.

- Giá trị hoặc quy tắc: CHƯA XÁC NHẬN.
- Nơi thay đổi: Client build + nhánh server tương ứng.
- Sau cập nhật: UI flag không tự mở quyền/capability server.
- Nguồn: `src/features/ask/Ask.tsx`.

#### VITE_ASK_RESEARCH_ENABLED

Cờ UI cho nhánh Ask. Phân loại: PUBLIC BUILD.

- Giá trị hoặc quy tắc: CHƯA XÁC NHẬN.
- Nơi thay đổi: Client build + nhánh server tương ứng.
- Sau cập nhật: UI flag không tự mở quyền/capability server.
- Nguồn: `src/features/ask/Ask.tsx`, `src/features/ask/CatalogSearch.tsx`.

#### VITE_AUTH_EMULATOR_PORT

Port Auth demo dùng chung. Phân loại: PUBLIC BUILD.

- Giá trị hoặc quy tắc: 19207.
- Nơi thay đổi: Cấu hình local được phối hợp.
- Sau cập nhật: Auth demo đúng port.
- Nguồn: `src/shared/firebase.ts`.

#### VITE_BETA_RELEASE

Cờ beta client. Phân loại: PUBLIC BUILD.

- Giá trị hoặc quy tắc: false production.
- Nơi thay đổi: Build config.
- Sau cập nhật: Production config gate.
- Nguồn: `src/shared/firebase.ts`.

#### VITE_FIREBASE_API_KEY

Public Firebase SDK config. Phân loại: PUBLIC BUILD.

- Giá trị hoặc quy tắc: Lấy từ web app đúng project.
- Nơi thay đổi: GitHub repo variable/client build.
- Sau cập nhật: Public config validation và API restrictions phù hợp.
- Nguồn: `src/shared/firebase.ts`, `.github/workflows/release.yml`.

#### VITE_FIREBASE_APP_ID

Firebase web app. Phân loại: PUBLIC BUILD.

- Giá trị hoặc quy tắc: 1:278913913091:web:e40355cd8ad5abe00f9936 theo release doc.
- Nơi thay đổi: GitHub release guard/web app settings.
- Sau cập nhật: App thuộc đúng project number.
- Nguồn: `src/shared/firebase.ts`.

#### VITE_FIREBASE_AUTH_DOMAIN

Host xử lý đăng nhập. Phân loại: PUBLIC BUILD.

- Giá trị hoặc quy tắc: CHƯA XÁC NHẬN live.
- Nơi thay đổi: GitHub repo variable + Auth/OAuth.
- Sau cập nhật: Authorized domain, origin và redirect.
- Nguồn: `src/shared/firebase.ts`, `.github/workflows/release.yml`.

#### VITE_FIREBASE_PROJECT_ID

Project Firebase của client. Phân loại: PUBLIC BUILD.

- Giá trị hoặc quy tắc: satsunicgo cho production; demo-satsunicgo cho demo.
- Nơi thay đổi: Build config/GitHub workflow.
- Sau cập nhật: Project identity + login/data fence.
- Nguồn: `src/shared/firebase.ts`.

#### VITE_FIREBASE_REGION

Region Functions client. Phân loại: PUBLIC BUILD.

- Giá trị hoặc quy tắc: asia-southeast1 production.
- Nơi thay đổi: Workflow/client build.
- Sau cập nhật: Callable tới đúng region.
- Nguồn: `src/shared/firebase.ts`.

#### VITE_FIREBASE_STORAGE_BUCKET

Bucket client. Phân loại: PUBLIC BUILD.

- Giá trị hoặc quy tắc: CHƯA XÁC NHẬN live.
- Nơi thay đổi: GitHub repo variable + Storage.
- Sau cập nhật: Đúng bucket/project và quyền private.
- Nguồn: `src/shared/firebase.ts`, `.github/workflows/release.yml`.

#### VITE_FIRESTORE_EMULATOR_PORT

Port Firestore demo dùng chung. Phân loại: PUBLIC BUILD.

- Giá trị hoặc quy tắc: 18207.
- Nơi thay đổi: Cấu hình local được phối hợp.
- Sau cập nhật: Không chạm database thật.
- Nguồn: `src/shared/firebase.ts`.

#### VITE_FUNCTIONS_EMULATOR_PORT

Port Functions demo dùng chung. Phân loại: PUBLIC BUILD.

- Giá trị hoặc quy tắc: 15207.
- Nơi thay đổi: Cấu hình local được phối hợp.
- Sau cập nhật: Callable/ảnh demo đúng port.
- Nguồn: `src/shared/firebase.ts`, `src/features/cart/purchase-thumbnail.tsx`.

#### VITE_GOOGLE_CLIENT_ID

One Tap public client ID. Phân loại: PUBLIC BUILD.

- Giá trị hoặc quy tắc: CHƯA XÁC NHẬN; trống có chủ ý để tắt.
- Nơi thay đổi: GitHub repo variable + OAuth.
- Sau cập nhật: One Tap, origins và đăng nhập Google riêng.
- Nguồn: `src/features/auth/OneTap.tsx`, `.github/workflows/release.yml`.

#### VITE_RECAPTCHA_ENTERPRISE_SITE_KEY

Site key App Check Enterprise công khai. Phân loại: PUBLIC BUILD.

- Giá trị hoặc quy tắc: CHƯA XÁC NHẬN live.
- Nơi thay đổi: GitHub repo variable + App Check/reCAPTCHA.
- Sau cập nhật: Đúng app/domain; request metrics.
- Nguồn: `src/shared/firebase.ts`, `.github/workflows/release.yml`.

#### VITE_USE_EMULATORS

Client dùng emulator. Phân loại: PUBLIC BUILD.

- Giá trị hoặc quy tắc: false production; true demo dev.
- Nơi thay đổi: Build config.
- Sau cập nhật: Không emulator trong build production.
- Nguồn: `src/shared/firebase.ts`, `src/features/auth/OneTap.tsx`.

