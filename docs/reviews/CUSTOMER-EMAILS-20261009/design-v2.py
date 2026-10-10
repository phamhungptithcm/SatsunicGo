"""Generate review-only email designs. Never imported by the application."""
from pathlib import Path
import html
import json
import re
import shutil

ROOT = Path(__file__).resolve().parent
ORIGIN = 'https://satsunicgo.web.app'
archive = ROOT / 'v1'
archive.mkdir(exist_ok=True)
for name in ['TEMPLATES.vi.json', 'EMAIL-COPY.md', 'preview.html']:
    if not (archive / name).exists():
        shutil.copyfile(ROOT / name, archive / name)
catalog = json.loads((archive / 'TEMPLATES.vi.json').read_text())
fixture = json.loads((ROOT / 'PREVIEW-FIXTURES.json').read_text())
fixture['common']['previousTotal'] = '1.200.000 ₫'
fixture['common']['zeroAmount'] = '0 ₫'
fixture['common']['fullReceivedSummary'] = '2 áo cotton trắng, cỡ M'

# id: heading, lead, detail fields, highlighted field/label, closing, treatment
spec = {}
def design(id, heading, lead, details=(), hero=None, closing='', treatment='neutral'):
    spec[id] = dict(heading=heading, lead=lead, details=list(details), hero=hero, closing=closing, treatment=treatment)
order = [('Đơn hàng', '{{orderRef}}')]
parcel = [('Đơn hàng', '{{orderRef}}'), ('Kiện hàng', '{{parcelRef}}')]
thanks = 'Cảm ơn bạn đã tin tưởng SatsunicGo.'
design('request_received','Đã nhận yêu cầu mua hộ','Bạn có thể xem lại yêu cầu và theo dõi bước tiếp theo trong tài khoản.',order,closing=thanks)
design('order_received','Đơn hàng đã được tạo','Đơn đã được lưu và đang chờ xác nhận thanh toán.',order+[('Sản phẩm','{{itemSummary}}')],closing='Cảm ơn bạn đã chọn SatsunicGo.')
design('quote_ready','Báo giá đã sẵn sàng','Bạn xem chi phí và điều khoản trước khi quyết định nhé.',order,('Tổng báo giá','{{quotedTotal}}'),treatment='action')
design('quote_accepted','Đã lưu lựa chọn của bạn','Bạn đã đồng ý báo giá. Khoản thanh toán vẫn cần được xác nhận.',order+[('Báo giá đã đồng ý','{{quotedTotal}}')])
design('payment_reported','Đã nhận thông tin chuyển khoản','Khoản tiền đang chờ đối chiếu. Bạn chưa cần chuyển lại.',order,treatment='pending')
design('payment_confirmed','Đã xác nhận thanh toán','{{paymentScope}}',order,('Khoản đã nhận','{{paidAmount}}'),thanks,'confirmed')
design('payment_review','Cần đối chiếu thanh toán','{{customerReason}}.',order,closing='Nếu đã chuyển tiền, bạn chưa cần chuyển lại trong lúc kiểm tra.',treatment='action')
design('payment_failed','Thanh toán chưa hoàn tất','Kiểm tra trạng thái trước khi thanh toán lại.',order,closing='Nếu ngân hàng đã trừ tiền, bạn liên hệ hỗ trợ để kiểm tra nhé.',treatment='action')
design('payment_expired','Lượt thanh toán đã hết hạn','Bạn xem lại trạng thái thanh toán và giá hiện tại trước khi tiếp tục.',order,treatment='pending')
design('price_change_proposed','Bạn xem giúp giá mua mới','{{customerReason}}.',order+[('Giá trước đó','{{previousTotal}}'),('Chênh lệch tăng','{{differenceAmount}}')],('Tổng theo giá mới','{{proposedTotal}}'),'Phần mua theo giá mới cần bạn đồng ý.', 'action')
design('change_proposed','Có phương án thay đổi','Bạn xem phương án và chi phí trước khi chọn đồng ý hoặc từ chối.',order+[('Phương án','{{changeSummary}}'),('Chi phí','{{costImpact}}')],treatment='action')
design('change_accepted','Đã lưu phương án bạn đồng ý','Lựa chọn đã được lưu. Bạn có thể xem bước tiếp theo trong đơn.',order+[('Phương án','{{changeSummary}}')])
design('change_rejected','Đã lưu lựa chọn từ chối','Bạn có thể trao đổi thêm với bên mình trong đơn.',order+[('Phương án đã từ chối','{{changeSummary}}')])
design('change_applied','Đơn hàng đã được cập nhật','Phương án bạn đồng ý đã được áp dụng.',order+[('Nội dung cập nhật','{{changeSummary}}')])
design('order_hold','Đơn hàng đang tạm dừng','{{customerReason}}.',order,closing='{{nextStep}}',treatment='action')
design('purchase_partial','Đã mua một phần hàng','Bạn có thể theo dõi từng món trong đơn.',order+[('Đã mua','{{purchasedSummary}}'),('Còn lại','{{remainingSummary}}')])
design('purchase_completed','Đã mua đủ hàng','Các món trong đơn đã được mua đủ.',order+[('Sản phẩm','{{itemSummary}}')])
design('warehouse_received','Kho đã nhận hàng','Số lượng hàng nhận đã được cập nhật trong đơn.',order+[('Đã nhận','{{receivedSummary}}')])
design('warehouse_issue','Hàng nhận có vấn đề','{{customerReason}}.',order,closing='{{nextStep}}',treatment='action')
design('final_balance_due','Chi phí cuối đã được chốt','Bạn xem bảng chi phí trước khi thanh toán phần còn lại nhé.',order+[('Chi phí cuối','{{finalTotal}}'),('Đã thanh toán sau điều chỉnh','{{netPaid}}')],('Còn cần thanh toán','{{balanceDue}}'),treatment='action')
design('final_no_balance','Đơn hàng đã đủ thanh toán','Bạn không cần thanh toán thêm theo bảng chi phí đã chốt.',order+[('Chi phí cuối','{{finalTotal}}')],('Cần thanh toán thêm','{{zeroAmount}}'),treatment='confirmed')
design('excess_payment_review','Có khoản thanh toán dư','Bạn có thể trao đổi với bên mình về cách xử lý khoản chênh lệch.',order,('Khoản dư đã đối chiếu','{{excessAmount}}'),'Khoản này chưa được xác nhận hoàn tiền.','action')
design('shipment_dispatched','Kiện hàng đã được gửi','Kiện đã được bàn giao cho đơn vị vận chuyển.',parcel+[('Đơn vị vận chuyển','{{carrierName}}'),('Mã vận đơn','{{trackingCode}}'),('Hàng trong kiện','{{parcelItems}}')],treatment='confirmed')
design('shipment_progress','Hành trình có cập nhật','{{trackingSummary}}.',parcel+[('Ghi nhận lúc','{{observedAt}}')])
design('delivery_estimate_changed','Lịch giao dự kiến thay đổi','{{customerReason}}.',parcel+[('Dự kiến trước đó','{{previousWindow}}'),('Dự kiến mới','{{deliveryWindow}}')],closing='Thời gian trên là dự kiến, chưa phải cam kết giao hàng.',treatment='pending')
design('delivery_failed','Kiện hàng chưa giao được','{{customerReason}}.',parcel,closing='{{nextStep}}',treatment='action')
design('shipment_returned','Kiện hàng được ghi nhận hoàn về','Bạn xem tình trạng và trao đổi hướng xử lý tiếp theo trong đơn.',parcel,treatment='action')
design('parcel_delivered_partial','Đã giao một kiện hàng','Đơn vẫn còn hàng đang được xử lý hoặc vận chuyển.',parcel+[('Đã giao trong kiện','{{parcelItems}}'),('Phần còn lại','{{remainingSummary}}')],treatment='confirmed')
design('order_delivered','Đơn hàng đã được giao đủ','Nếu hàng nhận có vấn đề, bạn có thể mở đơn để trao đổi với bên mình.',order,closing=thanks,treatment='confirmed')
design('order_cancelled','Đơn hàng đã được hủy','Bạn có thể xem trạng thái xử lý khoản đã thanh toán trong đơn.',order,closing='Thông báo hủy đơn chưa phải xác nhận hoàn tiền.')
design('refund_requested','Đã ghi nhận yêu cầu hoàn tiền','Yêu cầu đang chờ xử lý. Tiền chưa được xác nhận hoàn.',order,('Số tiền đề nghị hoàn','{{refundAmount}}'),treatment='pending')
design('refund_request_cancelled','Yêu cầu hoàn tiền đã được hủy','{{customerReason}}.',order+[('Số tiền trong yêu cầu','{{refundAmount}}')],closing='Bạn có thể trao đổi với bên mình trong đơn nếu cần làm rõ.')
design('refund_recorded','Đã ghi nhận khoản hoàn tiền','Bạn có thể xem xác nhận khoản hoàn trong đơn.',order+[('Ghi nhận ngày','{{refundRecordedAt}}')],('Khoản hoàn đã ghi nhận','{{refundAmount}}'),'Nếu chưa thấy tiền về, bạn liên hệ bên mình để kiểm tra nhé.','confirmed')
design('financial_adjustment','Thanh toán có điều chỉnh','{{customerReason}}.',order+[('Ảnh hưởng đến chi phí','{{costImpact}}')],treatment='action')
design('payment_allocated','Đã đối chiếu khoản thanh toán','Khoản tiền đã được ghi nhận vào đúng đơn.',order,('Khoản đã đối chiếu','{{paidAmount}}'),'Cảm ơn bạn đã chờ bên mình kiểm tra.','confirmed')
design('order_reply','Bên mình đã trả lời về đơn','Bạn mở cuộc trao đổi để xem và trả lời khi tiện nhé.',order)
design('support_reply','Bạn có phản hồi mới','Bên mình đã trả lời yêu cầu hỗ trợ của bạn.',[('Yêu cầu hỗ trợ','{{ticketRef}}')])
design('membership_activated','Gói của bạn đã được kích hoạt','Bạn có thể xem các quyền lợi áp dụng trong thông tin gói.',[('Gói sử dụng','{{planName}}'),('Có hiệu lực đến','{{endsAt}}')],closing='Cảm ơn bạn đã sử dụng gói của SatsunicGo.',treatment='confirmed')
design('membership_expiring','Gói của bạn sắp hết hạn','Bạn có thể chọn gia hạn nếu còn nhu cầu.',[('Gói sử dụng','{{planName}}'),('Ngày hết hạn','{{endsAt}}')],closing='SatsunicGo không tự trừ tiền để gia hạn.',treatment='pending')
design('membership_expired','Gói của bạn đã hết hạn','Bạn có thể xem quyền lợi hiện tại và gia hạn khi cần.',[('Gói sử dụng','{{planName}}'),('Đã hết hạn ngày','{{endsAt}}')],closing='Cảm ơn bạn đã sử dụng gói trong thời gian qua.')
design('receipt_ready','Chứng từ thanh toán đã sẵn sàng','Bạn có thể xem và tải chứng từ trong tài khoản.',[('Chứng từ','{{receiptRef}}'),('Khoản thanh toán','{{paidAmount}}')],closing='Chứng từ này không thay thế hóa đơn thuế.')
design('internal_document_issued','Chứng từ đơn hàng đã được xuất','Số tiền trên chứng từ phản ánh thời điểm xuất.',[('Chứng từ nội bộ','{{documentNumber}}')],closing='Đây không phải hóa đơn điện tử thuế.')

def escape(text):
    return html.escape(text, quote=True)
def interpolate(value, values):
    return re.sub(r'\{\{([A-Za-z]+)\}\}',lambda m: values[m[1]],value)
def wrap_money(text):
    return re.sub(r'\d[\d.]*\s₫',lambda m:'<span style="white-space:nowrap">'+m[0]+'</span>',escape(text))
routes={'order':'/account','account':'/account','support':'/support','membership':'/membership','documents':'/account/documents'}
status_labels={'confirmed':'Đã xác nhận','action':'Cần bạn xem','pending':'Đang chờ xử lý','neutral':'Cập nhật từ SatsunicGo'}

def email_html(row, data, placeholder=False):
    def t(value):
        return wrap_money(value if placeholder else interpolate(value,data))
    d=row['design']; color='#8a5200' if d['treatment']=='action' else '#163cff' if d['treatment']=='confirmed' else '#56627a'
    hero=''
    if d['hero']:
        label,value=d['hero']
        hero=f'<tr><td class="hero" style="padding:18px 20px;background:#f4f6ff;border-radius:8px"><div style="font-size:12px;line-height:20px;color:#52617a">{t(label)}</div><div class="amount" style="font-size:34px;line-height:44px;font-weight:700;letter-spacing:-1px;color:#163cff">{t(value)}</div></td></tr><tr><td height="18"></td></tr>'
    details=''.join(f'<tr><td valign="top" style="padding:10px 0;color:#667086;font-size:13px;line-height:21px;width:43%;border-bottom:1px solid #edf0f5">{t(label)}</td><td valign="top" align="right" style="padding:10px 0 10px 16px;color:#111c35;font-size:13px;line-height:21px;font-weight:500;border-bottom:1px solid #edf0f5;overflow-wrap:anywhere">{t(value)}</td></tr>' for label,value in d['details'])
    closing=f'<tr><td style="padding:18px 0 0;color:#667086;font-size:13px;line-height:21px">{t(d["closing"])}</td></tr>' if d['closing'] else ''
    cta_url='{{ctaUrl}}' if placeholder else ORIGIN+routes[row['destination']]
    status=status_labels[d['treatment']]
    # Email-specific statuses override generic treatment, avoiding semantic exaggeration.
    if row['id'] in ['order_delivered','parcel_delivered_partial']: status='Giao hàng'
    if row['id']=='refund_recorded': status='Khoản hoàn'
    if row['id']=='shipment_dispatched': status='Đang vận chuyển'
    if row['id']=='final_no_balance': status='Đủ thanh toán'
    if row['id']=='membership_activated': status='Đã kích hoạt'
    return f'''<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>{escape(row['subject'] if placeholder else interpolate(row['subject'],data))}</title><style>body{{margin:0}}a:focus-visible{{outline:2px solid #163cff;outline-offset:4px}}@media only screen and (max-width:480px){{.outer{{padding:16px 10px!important}}.pad{{padding:24px 22px!important}}.title{{font-size:24px!important;line-height:31px!important}}.amount{{font-size:30px!important;line-height:40px!important}}.attribution{{font-size:10px!important}}}}</style></head><body style="margin:0;background:#f5f7fb;font-family:Arial,Helvetica,sans-serif;color:#111c35"><div style="display:none;max-height:0;overflow:hidden;mso-hide:all">{t(row['preheader'])}</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td class="outer" align="center" style="padding:32px 16px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:580px;background:#fff;border:1px solid #e2e6ef;border-radius:12px"><tr><td class="pad" style="padding:28px 32px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td style="padding-bottom:24px;border-bottom:1px solid #edf0f5"><a href="{ORIGIN}/" style="text-decoration:none;color:#111c35;font-size:23px;font-weight:700;letter-spacing:-.8px">Satsunic<span style="color:#163cff">Go</span></a></td><td class="attribution" align="right" style="padding-bottom:24px;border-bottom:1px solid #edf0f5;color:#667086;font-size:11px">by HunpeoLabs</td></tr><tr><td colspan="2" style="padding-top:24px"><span style="font-size:11px;letter-spacing:.3px;color:{color};font-weight:600">{escape(status)}</span><h1 class="title" style="font-size:27px;line-height:35px;letter-spacing:-.7px;font-weight:700;margin:9px 0 12px">{t(d['heading'])}</h1><p style="font-size:14px;line-height:23px;color:#52617a;margin:0 0 20px">{t(d['lead'])}</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0">{hero}<tr><td><table role="presentation" width="100%" cellspacing="0" cellpadding="0">{details}</table></td></tr><tr><td style="padding-top:22px"><table role="presentation" cellspacing="0" cellpadding="0"><tr><td bgcolor="#163cff" style="border-radius:6px;text-align:center"><a href="{escape(cta_url)}" style="display:inline-block;padding:13px 19px;font-size:13px;line-height:18px;font-weight:600;text-decoration:none;color:#fff;border:1px solid #163cff;border-radius:6px">{t(row['ctaLabel'])}</a></td></tr></table></td></tr>{closing}</table></td></tr></table></td></tr></table><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:580px"><tr><td align="center" style="padding:20px 8px 0;font-size:11px;line-height:22px;color:#667086"><a href="{ORIGIN}/account" style="color:#52617a;text-decoration:none">Tài khoản</a><span style="padding:0 10px;color:#c5ccda">·</span><a href="{ORIGIN}/support" style="color:#52617a;text-decoration:none">Hỗ trợ</a><span style="padding:0 10px;color:#c5ccda">·</span><a href="{ORIGIN}/terms" style="color:#52617a;text-decoration:none">Điều khoản</a><br><a href="{ORIGIN}/privacy" style="color:#667086;text-decoration:none">Quyền riêng tư</a><span style="padding:0 10px;color:#c5ccda">·</span><a href="{ORIGIN}/" style="color:#667086;text-decoration:none">SatsunicGo by HunpeoLabs</a></td></tr></table></td></tr></table></body></html>'''

out=[]; samples=ROOT/'samples'; samples.mkdir(exist_ok=True)
templates=ROOT/'templates'; templates.mkdir(exist_ok=True)
for row in catalog['templates']:
    row=json.loads(json.dumps(row)); row['version']=2; row['design']=spec[row['id']]
    row['subject']=row['subject'].replace('SatsunicGO','SatsunicGo'); row['preheader']=row['preheader'].replace('SatsunicGO','SatsunicGo')
    if row['id']=='payment_confirmed': row['subject']='Đã xác nhận thanh toán · {{orderRef}}'
    row['paragraphs']=[row['design']['lead']]+([row['design']['closing']] if row['design']['closing'] else [])
    row['ctaDestination']={'origin':ORIGIN,'previewPath':routes[row['destination']],'productionRule':'Validated owner-scoped entity route, or existing account/support/membership/documents route. Never interpolate display orderRef as resource ID.'}
    strings=[row['subject'],row['preheader'],row['design']['heading'],*row['paragraphs'],*sum(([a,b] for a,b in row['design']['details']),[])]
    if row['design']['hero']: strings+=list(row['design']['hero'])
    row['requiredFields']=sorted(set(re.findall(r'\{\{([A-Za-z]+)\}\}',' '.join(strings))))
    if row['id']=='price_change_proposed': row['sendGuard']+=' Previous total must be an authoritative amount in the same cost scope as proposed total.'
    if row['id']=='final_no_balance': row['sendGuard']+=' zeroAmount is literal formatted integer zero, not null fallback.'
    data={**fixture['common'],**fixture['overrides'].get(row['id'],{})}
    assert set(row['requiredFields'])<=data.keys()
    sample_html=email_html(row,data)
    template_html=email_html(row,{},True)
    (samples/f"{row['id']}.html").write_text(sample_html)
    (templates/f"{row['id']}.html").write_text(template_html)
    row['artifacts']={'htmlTemplate':'templates/'+row['id']+'.html','sampleHtml':'samples/'+row['id']+'.html','sampleText':'samples/'+row['id']+'.txt'}
    text=[interpolate(row['design']['heading'],data),'',interpolate(row['design']['lead'],data)]
    if row['design']['hero']: text+=['',': '.join(interpolate(x,data) for x in row['design']['hero'])]
    text+=['']+[label+': '+interpolate(value,data) for label,value in row['design']['details']]
    text+=['',row['ctaLabel']+': '+ORIGIN+routes[row['destination']]]
    if row['design']['closing']: text+=['',interpolate(row['design']['closing'],data)]
    text+=['','SatsunicGo by HunpeoLabs','Hỗ trợ: '+ORIGIN+'/support','Điều khoản: '+ORIGIN+'/terms','Quyền riêng tư: '+ORIGIN+'/privacy']
    (samples/f"{row['id']}.txt").write_text('\n'.join(text)+'\n')
    raw_text=[row['design']['heading'],'',row['design']['lead']]
    if row['design']['hero']: raw_text+=['',': '.join(row['design']['hero'])]
    raw_text+=['']+[label+': '+value for label,value in row['design']['details']]
    raw_text+=['',row['ctaLabel']+': {{ctaUrl}}']
    if row['design']['closing']: raw_text+=['',row['design']['closing']]
    raw_text+=['','SatsunicGo by HunpeoLabs','Hỗ trợ: '+ORIGIN+'/support','Điều khoản: '+ORIGIN+'/terms','Quyền riêng tư: '+ORIGIN+'/privacy']
    (templates/f"{row['id']}.txt").write_text('\n'.join(raw_text)+'\n')
    out.append(row)

catalog.update(schemaVersion=2,planId='CUSTOMER-EMAILS-20261009-design-v2',brand='SatsunicGo',status='FINAL_DESIGN_PROPOSAL_NOT_INTEGRATED',templates=out)
(ROOT/'TEMPLATES.vi.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n')
(ROOT/'PREVIEW-FIXTURES.json').write_text(json.dumps(fixture,ensure_ascii=False,indent=2)+'\n')
copy=['# SatsunicGo · Bộ mẫu email v2','', '42 mẫu dùng chung một hệ thiết kế. Bản mẫu, chưa tích hợp gửi email. Dữ liệu ví dụ là minh họa.','']
for n,row in enumerate(out,1):
    d=row['design']; copy += [f"## {n:02}. {row['id']}",'',f"**Tiêu đề email:** {row['subject']}",f"**Dòng xem trước:** {row['preheader']}",'',f"### {d['heading']}",'',d['lead'],'']
    if d['hero']:copy+=['**'+d['hero'][0]+': '+d['hero'][1]+'**','']
    copy += [f'- {k}: {v}' for k,v in d['details']]+['',f"**Nút:** {row['ctaLabel']}",'',d['closing'],'',f"Điều kiện gửi: {row['sendGuard']}",f"Kênh: {row['deliveryPolicy']}",'']
(ROOT/'EMAIL-COPY.md').write_text('\n'.join(copy))

group_order=list(dict.fromkeys(r['group'] for r in out))
nav=''.join(f'<button type="button" class="template" data-id="{r["id"]}" data-group="{escape(r["group"])}"><span>{escape(r["design"]["heading"])}</span><small>{escape(r["group"])}</small></button>' for r in out)
options=''.join(f'<option value="{r["id"]}">{escape(r["design"]["heading"])}</option>' for r in out)
groups=''.join(f'<option>{escape(g)}</option>' for g in group_order)
browser_data=[dict(id=r['id'],heading=r['design']['heading'],subject=interpolate(r['subject'],{**fixture['common'],**fixture['overrides'].get(r['id'],{})}),preheader=interpolate(r['preheader'],{**fixture['common'],**fixture['overrides'].get(r['id'],{})}),group=r['group'],policy=r['deliveryPolicy'],guard=r['sendGuard']) for r in out]
js_data=json.dumps(browser_data,ensure_ascii=False).replace('<','\\u003c')
gallery='''<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Email design · SatsunicGo</title><style>*{box-sizing:border-box}body{margin:0;background:#f5f7fb;color:#111c35;font:14px/1.6 Arial,sans-serif}.top{height:66px;background:#fff;border-bottom:1px solid #e2e6ef;display:flex;align-items:center;justify-content:space-between;padding:0 30px;gap:15px}.brand{font-size:21px;font-weight:700;letter-spacing:-.7px}.brand span{color:#163cff}.top small{font-size:12px;color:#667086}.workspace{display:grid;grid-template-columns:276px 1fr;min-height:calc(100vh - 66px)}aside{background:white;border-right:1px solid #e2e6ef;padding:22px 16px;height:calc(100vh - 66px);position:sticky;top:0;overflow:auto}.navtitle{display:flex;justify-content:space-between;margin:0 6px 15px;font-size:13px;font-weight:600}.navtitle span{color:#798399;font-weight:400}label{font-size:12px;color:#667086;display:block;margin-bottom:5px}select{font:inherit;background:#fff;border:1px solid #d9dfeb;border-radius:6px;padding:9px 10px;width:100%;color:#111c35}.template{display:block;width:100%;text-align:left;background:none;border:1px solid transparent;padding:11px 12px;border-radius:7px;margin:5px 0;color:#26334d;cursor:pointer;font:inherit;line-height:1.4}.template small{display:block;color:#798399;font-size:11px;margin-top:4px}.template:hover{background:#f5f7fb}.template[aria-current=true]{background:#eef2ff;border-color:#dce4ff;color:#163cff}.template[aria-current=true] small{color:#5269b2}.list{margin-top:14px}.canvas{padding:24px 30px 40px;min-width:0}.mailmeta{max-width:700px;margin:0 auto 17px;background:white;border:1px solid #e2e6ef;border-radius:9px;padding:14px 18px;display:grid;grid-template-columns:62px 1fr;gap:4px 12px;font-size:12px;color:#667086;overflow-wrap:anywhere}.mailmeta strong{font-size:13px;color:#26334d;font-weight:500}.preview{max-width:700px;margin:auto}iframe{display:block;width:100%;height:850px;border:0;background:#f5f7fb}.caption{max-width:700px;margin:8px auto 0;display:flex;justify-content:space-between;align-items:center;gap:15px;font-size:11px;color:#667086}.caption a{color:#52617a;text-decoration:underline}details{max-width:700px;margin:16px auto 0;color:#667086;font-size:12px;overflow-wrap:anywhere}summary{cursor:pointer}.mobilechoice{display:none}a:focus-visible,button:focus-visible,select:focus-visible{outline:2px solid #163cff;outline-offset:3px}[hidden]{display:none!important}@media(max-width:760px){.top{height:58px;padding:0 18px}.top small{font-size:10px}.workspace{display:block}aside{display:none}.canvas{padding:16px 10px}.mobilechoice{display:block;margin:0 6px 14px}.mailmeta{padding:12px 14px;grid-template-columns:50px 1fr}.caption{padding:0 6px;flex-wrap:wrap}iframe{height:940px}}@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto}}</style></head><body><header class="top"><div class="brand">Satsunic<span>Go</span> <small style="margin-left:14px;font-weight:400;letter-spacing:0">Email design</small></div><small>42 mẫu · Phiên bản 02</small></header><div class="workspace"><aside aria-label="Danh mục mẫu email"><div class="navtitle">Tình huống<span id="count">42 mẫu</span></div><label for="group">Nhóm thông báo</label><select id="group"><option value="all">Tất cả nhóm</option>'''+groups+'''</select><div class="list">'''+nav+'''</div></aside><main class="canvas"><div class="mobilechoice"><label for="mobile">Chọn mẫu email</label><select id="mobile">'''+options+'''</select></div><div class="mailmeta"><span>Từ</span><strong>SatsunicGo</strong><span>Tiêu đề</span><strong id="subject"></strong><span>Xem trước</span><span id="preheader"></span></div><div class="preview"><iframe id="email" title="Bản xem trước email SatsunicGo"></iframe></div><div class="caption"><span>Bản thiết kế · Dữ liệu minh họa</span><a id="standalone" target="_blank" rel="noopener">Mở riêng email ↗</a></div><details><summary>Điều kiện gửi</summary><p id="policy"></p><p id="guard"></p></details><p id="announce" role="status" style="position:absolute;clip-path:inset(50%);width:1px;height:1px;overflow:hidden"></p></main></div><script>const rows='''+js_data+''';const frame=document.querySelector('#email');frame.addEventListener('load',()=>{if(frame.contentDocument)frame.style.height=frame.contentDocument.documentElement.scrollHeight+'px'});const buttons=[...document.querySelectorAll('.template')],mobile=document.querySelector('#mobile');function select(id){const r=rows.find(x=>x.id===id)||rows.find(x=>x.id==='payment_confirmed');frame.src='samples/'+r.id+'.html';document.querySelector('#subject').textContent=r.subject;document.querySelector('#preheader').textContent=r.preheader;document.querySelector('#standalone').href='samples/'+r.id+'.html';document.querySelector('#guard').textContent=r.guard;document.querySelector('#policy').textContent=r.policy;mobile.value=r.id;buttons.forEach(b=>b.setAttribute('aria-current',b.dataset.id===r.id?'true':'false'));document.querySelector('#announce').textContent=r.heading;history.replaceState(null,'','#'+r.id)}buttons.forEach(b=>b.addEventListener('click',()=>select(b.dataset.id)));mobile.addEventListener('change',()=>select(mobile.value));document.querySelector('#group').addEventListener('change',e=>{let visible=buttons.filter(b=>{b.hidden=e.target.value!=='all'&&b.dataset.group!==e.target.value;return !b.hidden});document.querySelector('#count').textContent=visible.length+' mẫu';if(!visible.some(b=>b.getAttribute('aria-current')==='true'))select(visible[0].dataset.id)});window.addEventListener('hashchange',()=>select(location.hash.slice(1)));select(location.hash.slice(1));</script></body></html>'''
(ROOT/'preview.html').write_text(gallery)
print(json.dumps({'templates':len(out),'htmlSamples':len(list(samples.glob('*.html'))),'plainTextSamples':len(list(samples.glob('*.txt'))),'designVersion':2,'runtimeIntegration':False}))
