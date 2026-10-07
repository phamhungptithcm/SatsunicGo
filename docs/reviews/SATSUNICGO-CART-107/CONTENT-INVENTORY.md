# CART-107 string and state inventory
Source-bound inventory, 2026-10-07. Includes surrounding existing checkout/navbar text for terminology review.

## src/features/cart/Cart.tsx
```text
93: ← Sản phẩm
96: <span>MUA HỘ QUỐC TẾ</span>
97: <h1>Giỏ hàng của bạn</h1>
98: <p>Xem lại mẫu và số lượng trước khi đặt mua.</p>
104: Xóa bản giỏ trên trình duyệt
111: Bạn còn {guestItems.length} mẫu sản phẩm trong giỏ trên trình duyệt.
118: Gộp vào giỏ tài khoản
124: Bạn đang ngoại tuyến. Giá chưa được kiểm tra lại. Kết nối để tiếp tục
125: đặt mua.
137: Kiểm tra lại lần cập nhật
146: Tải lại giỏ
154: Có lần cập nhật chưa xác nhận.{" "}
160: Kiểm tra lại lần cập nhật
165: <LoadingState>Đang tải giỏ hàng…</LoadingState>
169: <h2>{error ? "Chưa hiển thị được giỏ" : "Giỏ hàng đang trống"}</h2>
172: ? "Tải lại để kiểm tra sản phẩm đã lưu trong tài khoản."
173: : "Chọn sản phẩm để bắt đầu mua hộ."}
176: Xem sản phẩm
189: Tải lại sản phẩm và giá
197: Đang kiểm tra sản phẩm và giá…
224: "Sản phẩm chưa có thông tin"
228: {item.variant || "Mẫu mặc định"}
232: ? "Chưa xác định giá"
233: : `${money(price)} / sản phẩm`}
237: Sản phẩm hoặc mẫu này chưa mở đặt mua. Chọn lại trong
238: danh mục.
245: aria-label={`Giảm số lượng ${product?.title ?? "sản phẩm"}`}
258: aria-label={`Số lượng ${product?.title ?? "sản phẩm"}`}
264: aria-label={`Tăng số lượng ${product?.title ?? "sản phẩm"}`}
281: aria-label={`Xóa ${product?.title ?? "sản phẩm"} khỏi giỏ`}
289: Xóa
293: ? "Chưa xác định"
302: Đặt mua sản phẩm này →
312: ? "Đang xem bản giỏ chưa xác nhận từ server."
314: ? "Đang lưu giỏ…"
315: : "Giỏ đã lưu trong tài khoản."
317: ? "Giỏ đang được giữ trong trang này."
318: : "Giỏ được lưu trên trình duyệt này."}
321: ← Tiếp tục chọn sản phẩm
325: <h2>Tóm tắt giỏ hàng</h2>
327: <span>Số lượng</span>
328: <span>{quantity} sản phẩm</span>
331: <span>Tạm tính</span>
333: {total === null ? "Chưa xác định" : money(total)}
337: Giá niêm yết đã gồm phí mua hộ và giao hàng. Giá được kiểm tra
338: lại trước khi tạo đơn.
354: Xem lại để đặt mua
358: Đăng nhập để đặt mua
362: Mỗi sản phẩm tạo một đơn riêng và thanh toán toàn bộ một lần.
366: Chọn “Đặt mua sản phẩm này” ở sản phẩm bạn muốn mua. Bạn sẽ
367: xác nhận trước khi tạo đơn.
376: Tải lại sản phẩm và giá
```

## src/features/cart/AddToCart.tsx
```text
44: <span>Mẫu sản phẩm</span>
53: <option value="">Chọn mẫu</option>
61: <span>Số lượng</span>
99: setMessage("Đã thêm vào giỏ.");
100: else setMessage("Chưa thêm được. Mở giỏ để kiểm tra và thử lại.");
104: {busy ? "Đang lưu…" : "Thêm vào giỏ"}
108: {message} <Link to="/cart">Xem giỏ hàng</Link>
```

## src/features/cart/cart-store.tsx
```text
45: "Giỏ đã lưu chưa đọc được. Bạn có thể xóa bản lưu để chọn lại.",
128: : "Chưa đọc được giỏ trên trình duyệt. Thay đổi sẽ chỉ giữ trong trang này.",
151: setError("Chưa đọc được giỏ tài khoản. Thử tải lại.");
161: "Chưa mở được giỏ tài khoản. Kiểm tra kết nối và quyền truy cập rồi tải lại.",
178: "Chưa đọc được lần cập nhật đang chờ. Kiểm tra giỏ trước khi thay đổi.",
183: if (user) setError("Chưa kết nối được giỏ tài khoản.");
206: setError("Chưa tải lại được giỏ. Kiểm tra kết nối rồi thử lại.");
215: "Chưa lưu được lần cập nhật để thử lại an toàn. Cho phép lưu phiên rồi thử lại.",
287: "Chưa rõ giỏ đã cập nhật chưa. Thử kiểm tra lại cùng lần cập nhật.",
299: setError("Kết nối và tải lại giỏ trước khi thay đổi.");
313: setError("Giỏ đã thay đổi ở tab khác. Xem lại rồi thử lại.");
342: "Giỏ chỉ được giữ trong trang này vì trình duyệt chưa cho phép lưu.",
350: "Chưa cập nhật được giỏ. Giỏ tối đa 30 mẫu, mỗi mẫu từ 1 đến 100 sản phẩm.",
360: setError("Chưa đọc được giỏ trên trình duyệt.");
374: setStorageWarning("Chưa xóa được bản giỏ trên trình duyệt.");
```

## src/features/cart/cart-cache.ts
```text
99: error: "Chưa kiểm tra được sản phẩm và giá. Kết nối rồi tải lại.",
```

## src/app/SiteChrome.tsx
```text
11: ["Sản phẩm", "/products"],
12: ["Mua hộ", "/request"],
13: ["Biểu phí", "/fees"],
15: ["Bài viết", "/posts"],
16: ["Hỗ trợ", "/support"],
19: ["Hồ sơ và địa chỉ", "/account/profile"],
20: ["Đơn của tôi", "/account"],
21: ["Gửi yêu cầu mua hộ", "/request"],
23: ["Hỗ trợ", "/support"],
24: ["Bảo mật tài khoản", "/account/security"],
50: "Tài khoản của bạn";
55: name === "Tài khoản của bạn"
103: name === "Tài khoản của bạn" ? name : `Tài khoản của ${name}`
155: aria-label="Chức năng tài khoản"
173: {busy ? "Đang đăng xuất…" : "Đăng xuất"}
259: aria-label="SatsunicGo — Trang chủ"
280: aria-label="Điều hướng chính"
303: ? "Giỏ hàng chưa tải được"
305: ? "Giỏ hàng đang tải"
307: ? `Giỏ hàng, ${cartCount} sản phẩm từ bản lưu`
308: : `Giỏ hàng, ${cartCount} sản phẩm`
324: Mua hộ <span aria-hidden="true">↗</span>
342: aria-label={open ? "Đóng menu" : "Mở menu"}
363: <nav aria-label="Thông tin và hỗ trợ">
364: <Link to="/support">Hỗ trợ</Link>
365: <Link to="/privacy">Quyền riêng tư</Link>
366: <Link to="/terms">Điều khoản & hoàn tiền</Link>
367: <Link to="/restricted">Hàng hạn chế</Link>
```

## src/features/products/Checkout.tsx
```text
90: setError("Chưa kết nối được danh mục.");
125: setError("Chưa tải được sản phẩm. Kiểm tra kết nối rồi tải lại.");
176: "Chưa lưu được lựa chọn để đặt mua an toàn. Cho phép lưu phiên trên trình duyệt rồi thử lại.",
196: "Đơn đã tạo. Giỏ chưa cập nhật; mở giỏ để kiểm tra lại.",
218: "Chưa rõ kết quả đặt mua. Giữ lựa chọn và thử lại để kiểm tra cùng đơn, hoặc xem đơn trong tài khoản.",
226: <Link to="/products">← Sản phẩm</Link>
227: <h1>Đặt mua sản phẩm</h1>
228: {cartLine && <Link to="/cart">← Quay lại giỏ hàng</Link>}
230: <LoadingState>Đang tải sản phẩm…</LoadingState>
235: Giá trọn gói: {parsed.data.listedPrice.toLocaleString("vi-VN")} ₫ /
236: sản phẩm. Bao gồm phí mua hộ và giao hàng.
241: Mẫu sản phẩm{" "}
252: <option value="">Chọn mẫu</option>
261: Số lượng{" "}
278: Tổng thanh toán:{" "}
284: : "Chưa xác định"}
288: Thanh toán toàn bộ một lần. Nhân viên mua hộ sau khi tiền được xác
289: nhận. Điều khoản: {parsed.data.termsVersion}.
294: Sản phẩm đã cập nhật từ lúc bạn xem giỏ. Xem lại giá và mẫu
295: trước khi đặt mua.
298: Đã xem thông tin mới
303: <p role="status">Chọn mẫu và số lượng hợp lệ để tiếp tục.</p>
313: ? "Đang tạo đơn…"
315: ? "Kiểm tra lại đơn và tiếp tục"
316: : "Đặt mua và tiếp tục thanh toán"}
320: Đăng nhập để đặt mua
327: Sản phẩm này chưa mở đặt mua. Bạn có thể chọn sản phẩm khác trong
328: danh mục.
341: Tải lại sản phẩm và giá
```

## functions/src/cart.ts
```text
28: "Kiểm tra mẫu và số lượng trong giỏ.",
47: "Tài khoản chưa thể cập nhật giỏ hàng.",
63: "Giỏ đã lưu chưa đọc được. Liên hệ hỗ trợ để kiểm tra.",
67: throw new HttpsError("permission-denied", "Chưa thể mở giỏ hàng.");
72: "Lần cập nhật này đã được sử dụng.",
94: "Chưa xác nhận được đơn để cập nhật giỏ.",
104: "Thông tin đơn chưa đủ để cập nhật giỏ.",
120: "Giỏ đã thay đổi ở nơi khác. Xem lại giỏ rồi thử lại.",
138: "Sản phẩm hoặc mẫu này chưa thể thêm vào giỏ.",
146: "Giỏ tối đa 30 mẫu sản phẩm, mỗi mẫu tối đa 100 sản phẩm.",
153: "Sản phẩm đã thay đổi trong giỏ. Xem lại rồi thử lại.",
```
