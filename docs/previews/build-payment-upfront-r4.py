"""Build a design-only revision; application, tariffs and r3 stay untouched."""
from pathlib import Path
import re

root = Path(__file__).resolve().parents[2]
html = (root / 'docs/previews/SATSUNICGO-UPFRONT-PAYMENT-20261008-r3.html').read_text()
html = html.replace('<body>', '<body class="paymentDesignR4">', 1)
html = html.replace('</head>', '<link rel="stylesheet" href="/src/features/cart/cart.css?direct" /><link rel="stylesheet" href="/docs/previews/payment-upfront-r4.css" /></head>', 1)
html = re.sub(r'<div class="previewNotice">.*?</div>', '<div class="previewNotice"><strong>Bản thiết kế r4</strong><span>Giỏ hàng &amp; thanh toán · Dữ liệu minh họa, không chuyển tiền thật.</span></div>', html, count=1, flags=re.S)
html = re.sub(r'<p class="previewContext">.*?</p>', '<p class="previewContext">Xem từng màn hình thiết kế</p>', html, count=1, flags=re.S)
for key, label in [('initial', 'Mua hộ'), ('catalog', 'Sản phẩm'), ('cart', 'Giỏ hàng'), ('additional', 'Phát sinh'), ('staff', 'Nhân viên')]:
    html = re.sub(r'(<button\b[^>]*data-panel="' + key + r'"[^>]*>).*?(</button>)', lambda m: m[1] + label + m[2], html, count=1, flags=re.S)
for key in ('initial', 'cart'):
    html = re.sub(r'<button\b[^>]*data-panel="' + key + r'"[^>]*>.*?</button>', lambda m: re.sub(r'aria-selected="(?:true|false)"', 'aria-selected="' + ('true' if key == 'cart' else 'false') + '"', re.sub(r'tabindex="-?\d+"', 'tabindex="' + ('0' if key == 'cart' else '-1') + '"', m[0])), html, count=1, flags=re.S)
html = re.sub(r'(<section\b[^>]*\bid="initial"[^>]*)(>)', r'\1 hidden\2', html, count=1, flags=re.S)
html = re.sub(r'(<section\b[^>]*\bid="cart"[^>]*)(>)', lambda m: re.sub(r'\s+hidden\b', '', m[1]) + m[2], html, count=1, flags=re.S)
html = html.replace('Tóm tắt lần mua này', 'Chi tiết thanh toán')
html = html.replace('<title>SatsunicGo · giỏ hàng và thanh toán thống nhất</title>', '<title>SatsunicGo · checkout sau giỏ hàng</title>')
html = html.replace('Giỏ hàng &amp; thanh toán · Dữ liệu minh họa, không chuyển tiền thật.', 'Checkout mẫu sau giỏ hàng · 2 dòng / 3 món minh họa, chưa kết nối backend/PayOS, không chuyển tiền thật.')
html = re.sub(r'(<button\b[^>]*data-panel="cart"[^>]*>).*?(</button>)', r'\1Checkout\2', html, count=1, flags=re.S)
html = re.sub(r'(<section\b[^>]*\bid="cart"[^>]*>\s*)<header class="requestHeading">.*?</header>', r'\1<header class="requestHeading"><a href="/cart" class="requestCatalogLink">← Giỏ hàng</a><h1 id="checkoutPageHeading">Thông tin nhận hàng</h1><p id="checkoutPageHelp">Nhập địa chỉ nhận hàng, rồi xem tổng quan trước khi thanh toán.</p></header>', html, count=1, flags=re.S)
html = html.replace('<a class="active" href="#initial"', '<a href="#initial"')
html = re.sub(r'<button class="login"[^>]*id="headerCart"[^>]*>.*?</button\s*>', '<a class="headerCart107" href="/cart" id="headerCart" aria-label="Giỏ hàng"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3h2l2.4 11.5a2 2 0 0 0 2 1.5H18a2 2 0 0 0 2-1.5L22 7H6"/><circle cx="10" cy="21" r="1"/><circle cx="18" cy="21" r="1"/></svg><span id="cartCount" aria-hidden="true">0</span></a>', html, count=1, flags=re.S)
html = html.replace('Thanh toán toàn bộ ban đầu', 'Thanh toán ban đầu · 100% giá hàng và phí mua hộ')
html = re.sub(r'Chọn món bạn muốn mua trong lần này\. Các món chưa chọn vẫn ở trong\s+giỏ\.', 'Kiểm tra món đã thêm, số lượng và giá trước khi tiếp tục. Món chưa chọn vẫn được giữ trong giỏ.', html, count=1)
html = html.replace('<div id="cartLines"></div>', '<div class="cartSheet" id="cartSheet"><div class="cartSheetHeading"><span>Món đã thêm vào giỏ</span><span>Số tiền ban đầu</span></div><div id="cartLines"></div></div>', 1)
html = html.replace('Thêm sản phẩm niêm yết', 'Tiếp tục chọn sản phẩm').replace('Thêm yêu cầu mua hộ', 'Thêm món cần mua hộ')
html = html.replace('<h3>Thông tin nhận hàng</h3>', '<h3>Một địa chỉ cho các món đã chọn</h3>', 1)
html = html.replace('<section data-checkout-stage="0">', '<section data-checkout-stage="0" hidden>')
html = html.replace('<section data-checkout-stage="1" hidden>', '<section data-checkout-stage="1">')
html = re.sub(r'(<button\b[^>]*id="catalogPay"[^>]*>.*?</button\s*>)', r'\1<p id="catalogAdded" role="status" class="hint"></p>', html, count=1, flags=re.S)
html = html.replace('<h2 id="checkoutHeading" tabindex="-1">', '<h2 id="checkoutHeading" tabindex="-1" hidden>')
journey = '''<nav class="requestStepper checkoutSteps" aria-label="Các bước hoàn tất đơn">
<button type="button" data-checkout="1" class="isCurrent" aria-current="step"><span aria-hidden="true">1</span><span>Nhận hàng</span></button>
<button type="button" data-checkout="2" disabled><span aria-hidden="true">2</span><span>Tổng quan</span></button>
<button type="button" id="paymentStep" disabled><span aria-hidden="true">3</span><span>Thanh toán</span></button>
</nav>'''
html, journey_count = re.subn(r'<nav\b[^>]*\bclass="requestStepper checkoutSteps"[^>]*>.*?</nav>', journey, html, count=1, flags=re.S)
assert journey_count == 1, 'checkout stepper not found'
payment_journey = '''<nav class="paymentJourney" aria-label="Tiến độ hoàn tất đơn"><div><span aria-hidden="true">1</span><span>Nhận hàng</span></div><div><span aria-hidden="true">2</span><span>Tổng quan</span></div><div class="isCurrent" aria-current="step"><span aria-hidden="true">3</span><span>Thanh toán</span></div></nav>'''
html = re.sub(r'(<section\b[^>]*\bid="payment"[^>]*>)', lambda m: m[1] + payment_journey, html, count=1, flags=re.S)
html = re.sub(r'<button\b[^>]*data-checkout-back="0"[^>]*>.*?</button>', '<a href="/cart" class="textbutton">Sửa trong giỏ hàng</a>', html, count=1, flags=re.S)
html = html.replace('Những món chưa chọn', 'Những món chưa chọn')
html = html.replace('<div class="total">Thanh toán ban đầu', '<div class="total">Thanh toán ban đầu', 1)
shipping = '''
<section class="shippingCard" id="shippingCard" aria-labelledby="shippingHeading" hidden>
  <div class="sectionHeading"><h3 id="shippingHeading">Cước vận chuyển</h3><a class="textbutton" href="/fees">Biểu phí ↗</a></div>
  <div class="freightResult" aria-live="polite"><div><span>Quốc tế dự tính · chưa thu</span><strong id="shipQuoteAmount">Chưa tính</strong></div><p id="shipQuoteDetail">Chọn loại hàng và nhập cân nặng để xem cước.</p></div>
  <div class="deliveryRegion"><div><span>Giao nội địa</span><strong id="shipDestination">Chọn địa chỉ ở bước Nhận hàng</strong></div><span class="tag" id="domesticStatus">Phí cần xác nhận</span></div>
  <details class="shippingOptions"><summary>Xem / điều chỉnh cước</summary><p class="hint">Hàng cần tìm mua · Mỹ → Việt Nam. Có thể để trống cân nặng nếu bạn chưa biết.</p>
  <div class="shippingFields">
    <label for="shipWarehouse">Kho xuất gửi<select id="shipWarehouse"><option value="texas_cali">Texas / California</option><option value="oregon">Oregon</option></select></label>
    <label for="shipCategory">Loại hàng để ước tính<select id="shipCategory"><option value="">Chọn loại hàng</option></select></label>
    <label for="shipWeight">Tổng cân nặng dự kiến (kg)<input id="shipWeight" type="text" inputmode="decimal" maxlength="12" placeholder="Ví dụ: 1,5" aria-describedby="shipWeightHelp shipQuoteDetail" /></label>
  </div>
  <p class="hint" id="shipWeightHelp">Cho nhóm hàng cần tìm mua đã chọn. Cước tối thiểu 1 kg; hàng cồng kềnh dùng cân quy đổi khi cao hơn cân thực.</p>
  <div class="shippingConditions"><p id="domesticDetail">Biểu phí hiện có chưa có cước giao nội địa theo tỉnh/thành. Nhân viên xác nhận phí theo địa chỉ trước khi gửi.</p><p>Biểu phí tham khảo lấy từ code hiện có, chưa phải cấu hình đã công bố. Phí thông quan, thuế, bảo hiểm và giao nội địa tính riêng. Nhân viên xác nhận loại hàng, cân nặng và các phí trước khi bạn duyệt khoản trả thêm.</p><p id="shipSource"></p><p id="shipClearance"></p><p>Cước dự tính chưa được thu trong lần thanh toán ban đầu này. Sản phẩm niêm yết giữ giá trọn gói.</p><p>Tỷ giá mẫu 25.000 ₫/USD · phí mua hộ mẫu 5%. Không phải biểu phí đang áp dụng.</p></div>
  </details>
</section>
'''
aside_match = re.search(r'<aside class="card checkoutAside">.*?</aside>', html, re.S)
assert aside_match, 'checkout payment summary missing'
aside = aside_match[0]
aside, count_row = re.subn(r'<div class="row">\s*<span>Món đã chọn</span>\s*<strong id="selectedCount">.*?</strong>\s*</div>', '', aside, count=1, flags=re.S)
assert count_row == 1, 'selected-count row not found'
aside, demo_hint = re.subn(r'<p class="hint">\s*Tỷ giá USD mẫu.*?</p>', '', aside, count=1, flags=re.S)
assert demo_hint == 1, 'demo pricing hint not found'
aside, shipping_row_count = re.subn(r'(<div class="row")(?=>\s*<span>Cước món cần tìm mua</span\s*>)', r'\1 hidden', aside, count=1)
assert shipping_row_count == 1, 'legacy shipping row not found'
total_amount = '<p id="cartTotal" class="large">0 ₫</p>'
assert total_amount in aside, 'initial payment amount not found'
aside = aside.replace('Thanh toán ban đầu · 100% giá hàng và phí mua hộ', 'Thanh toán ban đầu')
aside = aside.replace(total_amount, total_amount + '<p class="hint" id="paymentIncludes">100% giá hàng và phí mua hộ. Giá niêm yết đã gồm cước; món cần tìm mua chốt cước trước khi gửi.</p>' + shipping, 1)
html = html[:aside_match.start()] + aside + html[aside_match.end():]
assert html.count('id="shipWarehouse"') == 1
confirmation = re.search(r'<label class="consent"\s*>\s*<input id="checkoutConsent".*?</p>', html, re.S)
footer = re.search(r'<div class="checkoutFooter">.*?</div>', html, re.S)
assert confirmation and footer, 'checkout confirmation/actions missing'
completion = '<div class="checkoutCompletion"><section data-checkout-stage="2" hidden>' + confirmation[0] + '</section>' + footer[0] + '</div>'
completion = re.sub(r'<p class="hint">.*?</p>', '<p class="hint">Thanh toán mô phỏng, không chuyển tiền thật.</p>', completion, count=1, flags=re.S)
html = html.replace(confirmation[0], '', 1).replace(footer[0], '', 1)
review = '''<section class="card checkoutReview" data-checkout-stage="2" hidden>
<div class="sectionHeading"><div><h3>Món đã chọn</h3><span id="selectedCount" class="hint">0 món</span></div><a href="/cart" class="textbutton">Sửa giỏ hàng</a></div>
<div id="reviewLines"></div>
<div class="deliveryReview"><div class="sectionHeading"><h3>Giao đến</h3><button type="button" class="textbutton" data-checkout-back="1">Sửa địa chỉ</button></div><p id="recipientSummary"></p></div>
<p class="checkoutTerms">Giá niêm yết giữ trọn gói. Món cần tìm mua có thể phát sinh giá và cước; bạn duyệt khoản trả thêm trước khi gửi.</p>
</section>'''
html, review_count = re.subn(r'<section data-checkout-stage="2" hidden>.*?</section>', review, html, count=1, flags=re.S)
assert review_count == 1, 'overview stage not found'
aside_end = html.index('</aside>', html.index('<aside class="card checkoutAside">'))
html = html[:aside_end] + completion + html[aside_end:]
demo_controls = '<details class="designControls checkoutDemoControls"><summary>Tùy chọn bản thiết kế</summary><label for="shipRateState">Trạng thái bảng cước<select id="shipRateState"><option value="reference">Biểu phí tham khảo trong code</option><option value="unavailable">Không tải được biểu phí</option></select></label></details>'
grid_end = html.index('</div>', html.index('</aside>', aside_end)) + len('</div>')
html = html[:grid_end] + demo_controls + html[grid_end:]
html = re.sub(r'    <script>.*?</script>', '<script type="module" src="/docs/previews/payment-upfront-r4.js"></script>', html, count=1, flags=re.S)
html = html.replace('Thiết kế r3 bám', 'Thiết kế r4 bám')
(root / 'docs/previews/SATSUNICGO-UPFRONT-PAYMENT-20261008-r4.html').write_text(html)
print('Written design r4')
