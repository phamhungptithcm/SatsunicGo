"""Review-only synthetic PDF designs. Never loads customer data or payment secrets."""
from pathlib import Path
from html import escape
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "output/pdf/payment-upfront-20261008"
OUT.mkdir(parents=True, exist_ok=True)
pdfmetrics.registerFont(TTFont("Receipt", "/System/Library/Fonts/Supplemental/Arial.ttf"))
pdfmetrics.registerFont(TTFont("ReceiptBold", "/System/Library/Fonts/Supplemental/Arial Bold.ttf"))
pdfmetrics.registerFontFamily("Receipt", normal="Receipt", bold="ReceiptBold", italic="Receipt", boldItalic="ReceiptBold")
NAVY, BLUE, MUTED, LINE = map(colors.HexColor, ["#111c35", "#163cff", "#596579", "#dbe1eb"])
PAGE_W, PAGE_H = A4
WIDTH = PAGE_W - 88
BODY = ParagraphStyle("body", fontName="Receipt", fontSize=9, leading=14, textColor=NAVY)
SMALL = ParagraphStyle("small", parent=BODY, fontSize=8, leading=12, textColor=MUTED)
BOLD = ParagraphStyle("bold", parent=BODY, fontName="ReceiptBold")
TITLE = ParagraphStyle("title", parent=BOLD, fontSize=21, leading=27)
AMOUNT = ParagraphStyle("amount", parent=BOLD, fontSize=26, leading=32, textColor=BLUE)
RIGHT = ParagraphStyle("right", parent=BODY, alignment=TA_RIGHT)
RIGHT_BOLD = ParagraphStyle("rightbold", parent=RIGHT, fontName="ReceiptBold")

def p(text, style=BODY):
    return Paragraph(text, style)

def vnd(value):
    return f"{value:,}".replace(",", ".") + " ₫"

def footer(c, doc):
    c.saveState()
    c.setStrokeColor(LINE)
    c.line(44, 48, PAGE_W-44, 48)
    c.setFont("Receipt", 7.5)
    c.setFillColor(MUTED)
    c.drawString(44, 34, "Chứng từ mẫu SatsunicGo. Không phải hóa đơn điện tử thuế.")
    c.drawRightString(PAGE_W-44, 34, f"Trang {doc.page}")
    c.restoreState()

def section(text):
    return p(text, ParagraphStyle("section", parent=BOLD, fontSize=10, spaceBefore=14, spaceAfter=9))

def receipt(path, *, additional=False, long=False):
    items = [{"name": "Tai nghe không dây - màu trắng", "qty": 2, "unit": 1_550_000 if additional else 1_450_000}]
    if long:
        items = [{"name": f"Món {i+1:02d} - Sản phẩm theo yêu cầu với tên dài, phiên bản tiếng Việt có dấu, lựa chọn kích thước và màu đã xác nhận", "qty": 1, "unit": 100_000} for i in range(30)]
    goods = sum(x["qty"]*x["unit"] for x in items)
    service = goods//20
    shipping = 240_000 if additional else None
    total = goods+service+(shipping or 0)
    previous = 3_045_000 if additional else 0
    paid = total-previous
    assert paid > 0 and previous+paid == total
    issue = "SG-PAY-DEMO-002" if additional else "SG-PAY-DEMO-001"
    if long:
        issue = "SG-PAY-DEMO-030"
    story = []
    header = Table([[p("SatsunicGo", ParagraphStyle("brand", parent=BOLD, fontSize=24, leading=28, textColor=BLUE)), p("MUA HỘ QUỐC TẾ<br/>MỸ · NHẬT · HÀN", SMALL)]], colWidths=[WIDTH*0.65, WIDTH*0.35])
    header.setStyle(TableStyle([("VALIGN", (0,0),(-1,-1),"TOP"), ("LEFTPADDING",(0,0),(-1,-1),0), ("RIGHTPADDING",(0,0),(-1,-1),0)]))
    story += [header, Spacer(1,18), p("MẪU MINH HỌA - KHÔNG PHẢI GIAO DỊCH THẬT", ParagraphStyle("demo", parent=BOLD, fontSize=8, textColor=MUTED)), Spacer(1,9), p("Phiếu xác nhận thanh toán", TITLE), Spacer(1,4), p("Khoản thanh toán thêm" if additional else "Thanh toán toàn bộ số tiền ban đầu", BODY), Spacer(1,14)]
    meta = Table([[p(f"<b>Đơn mua hộ</b><br/>SG-DEMO-20261008<br/>Khách hàng minh họa", BODY), p(f"<b>Số phiếu</b><br/>{issue}<br/>08/10/2026 · {'16:20' if additional else '09:30'} (UTC+7)", BODY)]], colWidths=[WIDTH/2]*2)
    meta.setStyle(TableStyle([("VALIGN",(0,0),(-1,-1),"TOP"), ("LEFTPADDING",(0,0),(-1,-1),0), ("RIGHTPADDING",(0,0),(-1,-1),4)]))
    story += [meta, Spacer(1,16)]
    amountbox = Table([[p("Số tiền xác nhận trong lần này", SMALL)], [p(vnd(paid), AMOUNT)], [p("Đã xác nhận trong môi trường demo · Cổng thanh toán mô phỏng", SMALL)]], colWidths=[WIDTH])
    amountbox.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,-1),colors.HexColor("#f0f4ff")), ("BOX",(0,0),(-1,-1),0.5,LINE), ("LEFTPADDING",(0,0),(-1,-1),14), ("TOPPADDING",(0,0),(-1,0),12), ("BOTTOMPADDING",(0,-1),(-1,-1),12)]))
    story += [amountbox, section("Chi tiết đơn mua hộ")]
    rows = [[p("Sản phẩm / lựa chọn", BOLD), p("SL", BOLD), p("Đơn giá", RIGHT_BOLD), p("Thành tiền", RIGHT_BOLD)]]
    rows += [[p(escape(x["name"])), p(str(x["qty"])), p(vnd(x["unit"]), RIGHT), p(vnd(x["qty"]*x["unit"]), RIGHT)] for x in items]
    t = Table(rows, colWidths=[WIDTH-221, 37, 88, 96], repeatRows=1, hAlign="LEFT")
    t.setStyle(TableStyle([("VALIGN",(0,0),(-1,-1),"TOP"), ("BACKGROUND",(0,0),(-1,0),colors.HexColor("#f6f7fa")), ("LINEBELOW",(0,0),(-1,0),0.6,LINE), ("LINEBELOW",(0,1),(-1,-1),0.4,LINE), ("LEFTPADDING",(0,0),(-1,-1),8), ("RIGHTPADDING",(0,0),(-1,-1),8), ("TOPPADDING",(0,0),(-1,-1),8), ("BOTTOMPADDING",(0,0),(-1,-1),8)]))
    story.append(t)
    charges = [("Giá hàng " + ("thực tế" if additional else "theo giá đã tìm hiểu"), vnd(goods)), ("Phí mua hộ (5% - chính sách minh họa)", vnd(service)), ("Vận chuyển", vnd(shipping) if shipping else "Chưa chốt")]
    charges += [("Tổng chi phí " + ("đã chốt" if additional else "đã xác định ban đầu"), vnd(total)), ("Đã thanh toán trước lần này", vnd(previous)), ("Khoản nhận trong lần này", vnd(paid)), ("Còn phải trả trên các chi phí đã xác định", vnd(0))]
    summary = Table([[p(k, BOLD if i in [3,5] else BODY), p(v, RIGHT_BOLD if i in [3,5] else RIGHT)] for i,(k,v) in enumerate(charges)], colWidths=[WIDTH-136,136])
    summary.setStyle(TableStyle([("VALIGN",(0,0),(-1,-1),"TOP"), ("LEFTPADDING",(0,0),(-1,-1),0), ("RIGHTPADDING",(0,0),(-1,-1),0), ("TOPPADDING",(0,0),(-1,-1),4), ("BOTTOMPADDING",(0,0),(-1,-1),4), ("LINEABOVE",(0,3),(-1,3),0.8,LINE)]))
    notes = []
    if additional:
        notes += ["Khoản trả thêm 450.000 ₫ gồm: giá hàng tăng 200.000 ₫, phí mua hộ tăng 10.000 ₫ và cước mới chốt 240.000 ₫.", "Bản chi phí demo-02 đã được khách minh họa chấp thuận. Phiếu ban đầu: SG-PAY-DEMO-001."]
    else:
        notes += ["Đã trả đủ 100% số tiền ban đầu. Cước vận chuyển chưa chốt; chênh lệch giá và chi phí bổ sung cần được xem và xác nhận trước khi thu thêm."]
    if not long:
        notes += [f"Giá nguồn minh họa: {'62' if additional else '58'} USD/món × 2. Tỷ giá đã khóa: 25.000 VND/USD. Điều khoản: mua-ho-demo-v1."]
    notes += ["Phiếu phản ánh khoản tiền và chi phí tại thời điểm xác nhận; không xác nhận đơn đã gửi hàng. Thông tin pháp nhân, thuế và liên hệ chính thức sẽ lấy từ cấu hình đã được xác minh."]
    block = [Spacer(1,9),summary,section("Thông tin đối chiếu")] + [p(escape(x), SMALL) for x in notes]
    story.append(KeepTogether(block))
    doc = SimpleDocTemplate(str(path), pagesize=A4, rightMargin=44, leftMargin=44, topMargin=38, bottomMargin=68, title="SatsunicGo - Phiếu thanh toán mẫu", author="SatsunicGo - Design preview")
    doc.build(story, onFirstPage=footer, onLaterPages=footer)
    return {"file": str(path.relative_to(ROOT)), "paid": paid, "previous": previous, "knownTotal": total, "items": len(items)}

if __name__ == "__main__":
    import json
    result = [receipt(OUT/"01-thanh-toan-ban-dau.pdf"), receipt(OUT/"02-thanh-toan-them.pdf", additional=True), receipt(OUT/"03-kiem-tra-30-mon.pdf", long=True)]
    (OUT/"sample-values.json").write_text(json.dumps(result, ensure_ascii=False, indent=2)+"\n")
    print(json.dumps(result, ensure_ascii=False, indent=2))
