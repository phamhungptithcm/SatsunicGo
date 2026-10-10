# Thiết lập production tracking — người quản trị thực hiện

Project: `satsunicgo`. Region: `asia-southeast1`. Database: `(default)`. Không deploy trong các bước này. Không gửi giá trị secret vào chat, Git hoặc file cấu hình frontend. Tài liệu kiểm tra ngày2026-10-10; các lệnh chỉ dành cho quản trị đã được phép thay đổi production.

## 1. Tạo secret mới, không in hoặc lưu ra file

Mở Terminal đã đăng nhập đúng tài khoản quản trị gcloud, chạy đoạn sau. Đoạn này chỉ tạo secret mới bằng64 ký tự ngẫu nhiên, chuyển trực tiếp qua stdin. Nó không đọc secret và không thêm version nếu tên đã tồn tại. Nếu lệnh báo lỗi/timeout/kết quả không rõ, dừng và để kiểm tra metadata; không xóa/tạo lại hoặc tự rotate.

```sh
python3 - <<'PY'
import secrets, subprocess
with open('/dev/tty', 'r+') as tty:
    tty.write('Gõ CREATE GUEST_TRACKING_QUOTA_KEY IN satsunicgo để xác nhận: ')
    tty.flush()
    approval = tty.readline().strip()
if approval != 'CREATE GUEST_TRACKING_QUOTA_KEY IN satsunicgo':
    raise SystemExit('Đã hủy; không thay đổi production.')
value = secrets.token_urlsafe(48).encode('ascii')
result = subprocess.run([
    'gcloud','secrets','create','GUEST_TRACKING_QUOTA_KEY',
    '--project=satsunicgo','--replication-policy=automatic','--data-file=-',
], input=value)
del value
raise SystemExit(result.returncode)
PY
```

Giữ secret ổn định qua retry. Rotation làm thay đổi HMAC quota và mã issuance được tái tạo; cần plan riêng. Không dùng key emulator trên production.

## 2. Cấp accessor ở đúng secret, không cấp role toàn project

Runtime service account hiện tại đọc từ `customerOrderTracking` là `278913913091-compute@developer.gserviceaccount.com`. Candidate hai callable mới dùng default runtime identity, chưa có override; phải xác minh lại identity/binding sau deployment được duyệt. Dùng cùng identity hiện có là phạm vi nhỏ nhất của thay đổi này, không khẳng định các Functions khác dùng chung identity bị cách ly hoàn toàn. Dedicated service account cần thiết kế/IAM riêng.

```sh
TRACKING_RUNTIME_SA="$(gcloud functions describe customerOrderTracking --gen2 --region=asia-southeast1 --project=satsunicgo --format='value(serviceConfig.serviceAccountEmail)')"
if [ "$TRACKING_RUNTIME_SA" = '278913913091-compute@developer.gserviceaccount.com' ]; then
  gcloud secrets add-iam-policy-binding GUEST_TRACKING_QUOTA_KEY \
    --project=satsunicgo \
    --member="serviceAccount:$TRACKING_RUNTIME_SA" \
    --role=roles/secretmanager.secretAccessor \
    --condition=None
else
  echo 'Runtime identity khác dự kiến; dừng để kiểm tra, chưa cấp quyền.'
fi
```

Không thêm allUsers/allAuthenticatedUsers, không cấp Owner/Editor, không thay project IAM. Lệnh thêm binding giữ nguyên các binding khác. Việc triển khai sau này còn phải kiểm tra deploy identity có quyền metadata/version cần thiết; không cấp accessor cho deploy account chỉ để vượt lỗi.

## 3. Bật ba TTL đã định nghĩa trong source

TTL xóa bất đồng bộ các document có trường Timestamp đã hết hạn, có thể bao gồm document tồn tại sẵn. Không chạy nếu các collection này đang được dùng cho dữ liệu cần giữ ngoài contract tracking. Bước này là thay đổi retention production, người quản trị phải chủ động thực hiện.

```sh
gcloud firestore fields ttls update expiresAt \
  --collection-group=guestTrackingQuotas --database='(default)' \
  --enable-ttl --project=satsunicgo --async

gcloud firestore fields ttls update deleteAfter \
  --collection-group=guestTrackingCodes --database='(default)' \
  --enable-ttl --project=satsunicgo --async

gcloud firestore fields ttls update deleteAfter \
  --collection-group=guestTrackingOperations --database='(default)' \
  --enable-ttl --project=satsunicgo --async
```

Không bật TTL cho `guestTrackingAccess`: activeHash là chốt thu hồi mã. Không đặt expiration-offset. TTL không phải chốt authorization: backend tự kiểm tra expiresAt trước khi trả dữ liệu. Dữ liệu quota ghi Timestamp +2phút, code/operation deleteAfter +30ngày theo source. Firestore không bảo đảm xóa ngay tại thời điểm hết hạn.

## 4. Kiểm tra chỉ metadata, tuyệt đối không access payload

```sh
gcloud secrets versions list GUEST_TRACKING_QUOTA_KEY --project=satsunicgo \
  --format='table(name,state,createTime)'
gcloud secrets get-iam-policy GUEST_TRACKING_QUOTA_KEY --project=satsunicgo \
  --format='json(bindings)'
gcloud firestore fields ttls list --database='(default)' --project=satsunicgo \
  --format='table(name,ttlConfig.state)'
```

Gửi lại “đã tạo secret/cấp quyền/bật TTL” cùng kết quả thành công hoặc lỗi đã che thông tin cá nhân; không gửi secret. Tôi sẽ đọc lại metadata để xác nhận secret có version ENABLED, đúng secret-level binding và ba TTL ACTIVE. CREATING/NEEDS_REPAIR hoặc lỗi quyền vẫn là pending/blocker.

## 5. Review và hosted acceptance

Người dùng review draft PR, diff, exact-head CI và candidate artifact manifest/checksum. Candidate v0.12.0 chỉ là nhãn UNRESERVED; không có tag/release và chưa được duyệt để promote. Không merge main vì workflow hiện tại sẽ tự deploy. Cần phê duyệt deploy riêng, sau đó mới kiểm tra hai callable thực tế, App Check, runtime secret binding và CRM→Account/Ask bằng safe test order/identity được duyệt; không tự tạo đơn/dữ liệu khách production.

Nguồn chính thức:
- https://docs.cloud.google.com/secret-manager/docs/manage-access-to-secrets
- https://docs.cloud.google.com/sdk/gcloud/reference/secrets/create
- https://docs.cloud.google.com/sdk/gcloud/reference/firestore/fields/ttls/update
- https://firebase.google.com/docs/firestore/ttl
