from pathlib import Path
import re

root = Path(__file__).resolve().parents[2]
old = (root / 'docs/previews/SATSUNICGO-UPFRONT-PAYMENT-20261008-r2.html').read_text()
html = old.replace('BẢN THIẾT KẾ r2', 'BẢN THIẾT KẾ r3 · GIỎ HÀNG THỐNG NHẤT')
html = html.replace('Thiết kế r2 bám', 'Thiết kế r3 bám')
html = html.replace('thiết kế thanh toán theo code hiện có', 'giỏ hàng và thanh toán thống nhất')
html = html.replace('Nhập giá bạn đã tìm hiểu. Xem số tiền ban đầu và thanh toán toàn bộ\n            trước khi nhân viên tiến hành mua hộ.', 'Giữ thông tin món bạn muốn mua. Thêm yêu cầu vào giỏ, rồi nhập địa chỉ và thanh toán cùng các sản phẩm khác.')
html = html.replace('Sản phẩm niêm yết: mua và thanh toán toàn bộ ngay →', 'Chọn sản phẩm niêm yết để thêm vào cùng giỏ →')
html = html.replace('<div class="total">Cần thanh toán 100%</div>', '<div class="total">Tạm tính để thêm vào giỏ</div>')
html = re.sub(r'<label class="consent"\s*><input type="checkbox" id="initialconsent".*?</label\s*>', '<p class="hint"><strong>Cần tìm mua</strong> · Nhân viên sẽ tìm nơi bán và kiểm tra giá sau khi khoản thanh toán ban đầu được xác nhận. Bạn xem tổng và xác nhận thanh toán tại giỏ.</p>', html, flags=re.S)
html = html.replace('Xem thanh toán demo', 'Thêm vào giỏ hàng').replace('Thanh toán toàn bộ giá niêm yết', 'Giá niêm yết trọn gói')
html = html.replace('Mua và thanh toán ngay', 'Thêm vào giỏ hàng')
html = re.sub(r'(<button[^>]+id="catalogPay"[^>]*>).*?(</button>)', r'\1Thêm vào giỏ hàng\2', html, flags=re.S)
html = html.replace('id="showreceipt">Xem mẫu phiếu PDF', 'id="showreceipt" disabled>Xem phiếu của giỏ')
html = html.replace('<p>Đơn mẫu SG-DEMO-20261008</p>', '<p id="paymentContext">Chưa có lượt checkout trong mẫu này.</p><div id="paymentAllocation"></div>')
html = html.replace('Xem trạng thái chờ', 'Mô phỏng đang xác minh').replace('Xem khi kết quả chưa rõ', 'Mô phỏng kết quả chưa rõ').replace('Xem trạng thái đã trả', 'Mô phỏng đã xác nhận tiền')
html = html.replace('<a class="login" href="/account">Đơn của tôi</a', '<button class="login" type="button" id="headerCart">Giỏ hàng <span id="cartCount">0</span></button')
html = html.replace('<a href="/products">Sản phẩm</a', '<a href="#catalog" data-go="catalog">Sản phẩm</a').replace('<a class="active" href="/request">Mua hộ</a', '<a class="active" href="#initial" data-go="initial">Mua hộ</a')
newtabs = '''<button type="button" role="tab" class="pageTab" id="preview-tab-cart" aria-controls="cart" aria-selected="false" tabindex="-1" data-panel="cart">Giỏ &amp; checkout</button>'''
html = html.replace('      </div>\n\n      <section', newtabs + '\n      </div>\n\n      <section', 1)
html = html.replace(newtabs, newtabs + '<button type="button" role="tab" class="pageTab" id="preview-tab-staff" aria-controls="staff" aria-selected="false" tabindex="-1" data-panel="staff">Nhân viên tìm mua</button>', 1)
tablist_match = re.search(r'(<div\s+class="pageTabs"[^>]*>)(.*?)(</div>)', html, re.S)
assert tablist_match
buttons = re.findall(r'<button\b.*?</button>', tablist_match.group(2), re.S)
order = ['initial', 'catalog', 'cart', 'payment', 'additional', 'document', 'staff']
ordered = [next(b for b in buttons if f'data-panel="{key}"' in b) for key in order]
html = html[:tablist_match.start()] + tablist_match.group(1) + '\n'.join(ordered) + tablist_match.group(3) + html[tablist_match.end():]
css = '''
      .unifiedFields { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
      .unifiedFields label { display:grid; gap:7px; font-size:13px; }
      .unifiedFields .wide { grid-column:1/-1; }
      .cartLine { padding:20px 0; border-bottom:1px solid #e2e6ef; display:grid; grid-template-columns:24px minmax(0,1fr); gap:12px; }
      .cartLine h3 { margin:8px 0; overflow-wrap:anywhere; }
      .cartLine p { margin:6px 0; }
      .cartLine input[type=checkbox], .previewMain .consent input { width:18px; height:18px; flex-shrink:0; margin:3px 0; }
      .cartLine .lineControls { display:flex; flex-wrap:wrap; align-items:center; gap:10px; margin-top:12px; }
      .cartLine .lineControls label { display:flex; gap:8px; align-items:center; font-size:12px; }
      .cartLine .lineControls input { width:74px; }
      .cartLine .lineControls strong { margin-left:auto; }
      .previewMain .consent { display:flex; align-items:flex-start; gap:10px; line-height:1.6; font-size:13px; }
      .quickRequestPage .checkoutSteps { margin:16px 0 24px; display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); grid-column:auto; grid-row:auto; height:auto; border-right:0; border-bottom:1px solid #e6eaf2; padding:0 0 18px; gap:4px; }
      .quickRequestPage .checkoutSteps button { flex-direction:column; align-items:center; text-align:center; font-size:12px; }
      .quickRequestPage .checkoutSteps button:not(:last-child)::after { top:21px; left:50%; width:calc(100% + 4px); height:2px; }
      .allocationLine { display:flex; flex-wrap:wrap; justify-content:space-between; gap:8px; padding:12px 0; border-bottom:1px solid #e2e6ef; font-size:13px; }
      .allocationLine span { overflow-wrap:anywhere; min-width:0; }
      .staffItem { border-bottom:1px solid #e2e6ef; padding:18px 0; overflow-wrap:anywhere; }
      .staffItem p { margin:8px 0; }
      #recipientSummary { overflow-wrap:anywhere; white-space:pre-line; }
      .checkoutFooter { display:flex; justify-content:space-between; gap:14px; margin-top:22px; }
      .checkoutFooter button { min-height:44px; }
      .checkoutAside { position:sticky; top:120px; }
      .previewMain .card .row { flex-wrap:wrap; }
      .previewMain .card .row span:last-child { white-space:normal; text-align:right; }
      @media(max-width:700px) { .unifiedFields { grid-template-columns:1fr; } .checkoutSteps button { padding:10px 5px; font-size:12px; } .checkoutAside { position:static; } .checkoutSteps { gap:4px; } .checkoutFooter { flex-wrap:wrap; } .lineControls strong { width:100%; margin-left:0!important; } }
'''
html = html.replace('    </style>', css + '\n    </style>', 1)
panels = '''
      <section id="cart" class="previewPanel" role="tabpanel" aria-labelledby="preview-tab-cart" tabindex="0" hidden>
        <header class="requestHeading"><h1>Giỏ hàng</h1><p>Chọn món bạn muốn mua trong lần này. Các món chưa chọn vẫn ở trong giỏ.</p></header>
        <nav class="requestStepper checkoutSteps" aria-label="Các bước checkout">
          <button type="button" data-checkout="0" class="isCurrent" aria-current="step"><span>1</span><span>Giỏ hàng</span></button>
          <button type="button" data-checkout="1" disabled><span>2</span><span>Nhận hàng</span></button>
          <button type="button" data-checkout="2" disabled><span>3</span><span>Kiểm tra &amp; trả tiền</span></button>
        </nav>
        <h2 id="checkoutHeading" tabindex="-1">Món trong giỏ</h2>
        <div class="grid">
          <div>
            <section data-checkout-stage="0">
              <p id="emptyCart" class="note neutral">Giỏ chưa có món. Thêm sản phẩm niêm yết hoặc yêu cầu mua hộ để bắt đầu.</p>
              <div id="cartLines"></div>
              <div class="actions"><button type="button" class="secondary" data-go="catalog">Thêm sản phẩm niêm yết</button><button type="button" class="secondary" data-go="initial">Thêm yêu cầu mua hộ</button></div>
              <p id="cartMessage" role="status" class="hint"></p>
            </section>
            <section data-checkout-stage="1" hidden>
              <form id="recipientForm" class="card" novalidate>
                <h3>Thông tin nhận hàng</h3>
                <label class="field">Địa chỉ đã lưu<select id="savedAddress"><option value="">Nhập địa chỉ mới</option><option value="sample">Địa chỉ mẫu · TP. Hồ Chí Minh</option></select></label>
                <p class="hint">Địa chỉ này dùng cho tất cả món bạn đã chọn.</p>
                <div class="unifiedFields">
                  <label>Người nhận<input id="recipientName" autocomplete="shipping name" minlength="2" maxlength="120" required aria-describedby="recipientError"></label>
                  <label>Số điện thoại<input id="recipientPhone" type="tel" autocomplete="shipping tel" maxlength="20" required aria-describedby="recipientError"></label>
                  <label>Quốc gia<input value="Việt Nam" readonly autocomplete="shipping country-name"></label>
                  <label>Tỉnh / thành phố<select id="province" required aria-describedby="recipientError regionHelp"><option value="">Chọn tỉnh / thành phố</option><option value="hcm">TP. Hồ Chí Minh</option><option value="hanoi">Hà Nội</option></select></label>
                  <label>Phường / xã<select id="ward" required disabled aria-describedby="recipientError regionHelp"><option value="">Chọn tỉnh / thành phố trước</option></select></label>
                  <label>Số nhà, đường, tòa nhà / căn hộ<input id="street" autocomplete="shipping street-address" minlength="5" maxlength="300" required aria-describedby="recipientError"></label>
                  <label class="wide">Ghi chú giao hàng <span class="hint">Không bắt buộc</span><textarea id="deliveryNote" rows="2" maxlength="500"></textarea></label>
                </div>
                <p id="regionHelp" class="hint">Bản mẫu có 2 thành phố và một số phường để thử thao tác. Bản triển khai sẽ dùng danh mục hành chính đầy đủ và có tìm kiếm.</p>
                <p class="note neutral">Google Maps chưa được kết nối trong bản mẫu. Bạn vẫn nhập địa chỉ và chọn khu vực tại đây.</p>
                <p id="recipientError" class="error" role="alert" hidden></p>
              </form>
            </section>
            <section data-checkout-stage="2" hidden>
              <div class="card"><h3>Món đã chọn</h3><div id="reviewLines"></div><button type="button" class="textbutton" data-checkout-back="0">Sửa giỏ hàng</button></div>
              <div class="card" style="margin-top:16px"><h3>Giao đến</h3><p id="recipientSummary"></p><button type="button" class="textbutton" data-checkout-back="1">Sửa thông tin nhận hàng</button></div>
              <p class="note">Sản phẩm niêm yết giữ giá trọn gói. Món cần tìm mua có thể phát sinh chênh lệch giá và cước; bạn xem và duyệt trước khi thanh toán thêm.</p>
              <label class="consent"><input id="checkoutConsent" type="checkbox"><span>Tôi đã kiểm tra món, địa chỉ và số tiền cần thanh toán ban đầu.</span></label>
              <p class="hint">Thao tác thanh toán trong bản thiết kế chỉ mô phỏng, không tạo đơn thật.</p>
            </section>
            <div class="checkoutFooter"><button id="checkoutBack" type="button" class="secondary" hidden>Quay lại</button><button id="checkoutNext" type="button" class="primary" disabled>Thông tin nhận hàng →</button></div>
          </div>
          <aside class="card checkoutAside"><h3>Tóm tắt lần mua này</h3><div class="row"><span>Món đã chọn</span><strong id="selectedCount">0</strong></div><div class="row"><span>Sản phẩm niêm yết</span><strong id="listedTotal">0 ₫</strong></div><div class="row"><span>Giá hàng cần tìm mua</span><strong id="customGoods">0 ₫</strong></div><div class="row"><span>Phí mua hộ mẫu</span><strong id="customFee">0 ₫</strong></div><div class="row"><span>Cước món cần tìm mua</span><span id="shippingStatus">Không áp dụng</span></div><div class="total">Thanh toán toàn bộ ban đầu</div><p id="cartTotal" class="large">0 ₫</p><p class="hint">Tỷ giá USD mẫu 25.000 ₫; phí mua hộ mẫu 5%. Đây là dữ liệu thiết kế, không phải biểu phí đang áp dụng.</p></aside>
        </div>
      </section>
      <section id="staff" class="previewPanel" role="tabpanel" aria-labelledby="preview-tab-staff" tabindex="0" hidden>
        <header class="requestHeading"><h1>Nhân viên · tìm mua</h1><p>Mẫu hàng việc sau khi thanh toán được xác nhận. Yêu cầu còn trong giỏ chưa giao việc cho nhân viên.</p></header>
        <div class="grid"><div class="card"><h2>Cần tìm mua</h2><div id="staffLines"><p class="muted">Chưa có yêu cầu đã thanh toán trong phiên mẫu này.</p></div></div><aside class="card"><h3>Trước khi mua</h3><p>Kiểm tra nơi bán, đúng mẫu và giá thực tế. Nếu vượt số tiền đã được khách chấp thuận, gửi khách duyệt trước khi mua.</p><p class="hint">Trạng thái tìm mua đi theo từng món. Sản phẩm niêm yết xử lý trong hàng việc riêng theo điều kiện đã chốt.</p></aside></div>
      </section>
'''
section_match = re.search(r'      <section\s[^>]*id="additional"', html)
assert section_match, 'additional section not found'
html = html[:section_match.start()] + panels + '\n' + html[section_match.start():]
assert 'id="cartLines"' in html, 'cart insertion missing'
html = html.replace('<h2>Tải mẫu PDF</h2>', '<h2>Tải mẫu PDF</h2><div id="checkoutReceipt" hidden><h3>Khoản nhận của giỏ trong phiên mẫu</h3><p id="checkoutReceiptTotal" class="large"></p><div id="checkoutReceiptLines"></div><p class="hint">Chi tiết này theo giỏ vừa mô phỏng; các PDF tải xuống bên dưới là ví dụ cố định riêng, không thay đổi theo giỏ.</p></div>')
script = (Path(__file__).with_name('payment-upfront-r3.js')).read_text()
html = re.sub(r'    <script>.*?</script>', lambda _: '<script>\n' + script + '\n</script>', html, flags=re.S)
(root / 'docs/previews/SATSUNICGO-UPFRONT-PAYMENT-20261008-r3.html').write_text(html)
print('Written design r3')
