import { Link } from "react-router-dom";
import "./privacy105.css";
const sections = [
  {
    id: "privacy-analytics",
    title: "Thống kê truy cập tùy chọn",
    body: "Chỉ ghi nhận khi bạn chọn Cho phép thống kê và hệ thống đã bật thu thập. Thống kê gồm mã trình duyệt và phiên ngẫu nhiên, nhóm trang đã xem, mã sản phẩm được chọn và chủ đề câu hỏi Ask trong danh sách cố định. Không lưu nguyên văn câu hỏi, địa chỉ, email hoặc thông tin thanh toán vào sự kiện truy cập. Khi đăng nhập, hệ thống có thể liên kết phiên với đơn thuộc tài khoản của bạn để tính số phiên có đơn thanh toán. Mã liên kết vẫn là dữ liệu có thể liên quan đến tài khoản, không được coi là dữ liệu hoàn toàn ẩn danh.\n\nBạn có thể từ chối hoặc chọn Quyền thống kê → Dừng ghi nhận. Việc này không ảnh hưởng đến mua hàng và dừng ghi nhận tiếp theo; số liệu đã tổng hợp không bị xóa ngay.\n\nCấu hình lưu riêng cho thống kê: sự kiện 7 ngày; phiên và dữ liệu liên kết làm việc tối đa 45 ngày; tổng hợp không chứa nội dung cá nhân 365 ngày. Cơ chế xóa tự động chạy nền, không bảo đảm xóa đúng thời điểm hết hạn. Biên nhận chống đếm trùng và đối chiếu nguồn tài chính có thể được giữ 365 ngày. Thời hạn này chỉ áp dụng cho thống kê, không thay đổi thời hạn lưu đơn, giao dịch hoặc hồ sơ hỗ trợ.",
  },
  {
    id: "privacy-1",
    title: "Thông tin được dùng",
    body: "| Thông tin | Dùng để làm gì |\n| --- | --- |\n| Tên, email và ảnh tài khoản Google | Đăng nhập và hiển thị tài khoản của bạn |\n| Tên người nhận, số điện thoại và địa chỉ | Chuẩn bị giao hàng và liên hệ về đơn |\n| Sản phẩm, yêu cầu mua hộ, đơn hàng và thanh toán | Báo giá, xử lý đơn và đối chiếu giao dịch |\n| Tin nhắn, yêu cầu hỗ trợ và ảnh bạn gửi | Hiểu yêu cầu, kiểm tra hàng và hỗ trợ bạn |\n| Đánh giá bạn gửi | Hiển thị đánh giá được duyệt trên trang sản phẩm |\n\nChỉ gửi thông tin cần cho việc mua hộ. Không gửi mật khẩu, mã xác thực hoặc thông tin thẻ ngân hàng qua chat.",
  },
  {
    id: "privacy-2",
    title: "Ai có thể xem?",
    body: "Bạn xem thông tin của mình trong tài khoản. Nhân viên có quyền phù hợp xử lý thông tin cần cho công việc. Đánh giá đã được duyệt có thể được người khác xem; nội dung hiển thị gồm tên bạn chọn, số sao và nhận xét.\n\nỨng dụng dùng dịch vụ của Google/Firebase để đăng nhập, lưu dữ liệu và vận hành. Dịch vụ thanh toán xử lý thông tin cần cho giao dịch. Danh sách nhà cung cấp và phạm vi chia sẻ cần được đơn vị vận hành xác nhận trước khi công bố chính sách chính thức.",
  },
  {
    id: "privacy-3",
    title: "Khi dùng trợ lý chat",
    body: "Nội dung bạn gửi có thể được xử lý bằng AI để trả lời và hỗ trợ mua hộ. Đừng đưa thông tin nhạy cảm vào câu hỏi. Câu trả lời của AI không thay thế việc nhân viên xác nhận giá, khả năng mua hoặc điều kiện giao hàng.",
  },
  {
    id: "privacy-4",
    title: "Bạn có thể làm gì?",
    body: "- Xem và sửa thông tin hồ sơ, địa chỉ trong tài khoản.\n- Chọn nhận hoặc không nhận thông tin ưu đãi trong hồ sơ.\n- Gửi yêu cầu nhận bản sao dữ liệu.\n- Gửi yêu cầu xóa dữ liệu.\n\nYêu cầu bản sao hoặc xóa dữ liệu được gửi đến bộ phận hỗ trợ để kiểm tra và xử lý. Gửi yêu cầu không có nghĩa dữ liệu đã được xuất hoặc xóa ngay. Thông tin liên quan đến đơn hàng và giao dịch có thể cần được xem xét riêng trước khi xóa.\n\n[Hồ sơ và địa chỉ](/account/profile) · [Yêu cầu bản sao dữ liệu](/support?topic=data-export) · [Yêu cầu xóa dữ liệu](/support?topic=data-deletion)",
  },
  {
    id: "privacy-5",
    title: "Dữ liệu được lưu bao lâu?",
    body: "Thời hạn lưu, điều kiện xóa và cách xử lý dữ liệu trong bản sao lưu đang cần đơn vị vận hành xác nhận. Trang này chưa đưa ra thời hạn cụ thể khi chưa có chính sách được duyệt.",
  },
  {
    id: "privacy-6",
    title: "Cần hỏi thêm?",
    body: "Gửi yêu cầu qua trang Hỗ trợ. Bạn cần đăng nhập để gửi và theo dõi phản hồi. Không gửi mật khẩu hoặc mã xác thực trong yêu cầu.\n\n[Liên hệ hỗ trợ](/support)\n\nThông tin đơn vị chịu trách nhiệm, email liên hệ quyền riêng tư và ngày chính sách có hiệu lực: chờ xác nhận. Bản này là nội dung đang rà soát, chưa phải chính sách chính thức được duyệt.",
  },
];
function Paragraph({ text }: { text: string }) {
  const parts = text.split(/(\[[^\]]+\]\([^)]+\))/g);
  return (
    <>
      {parts.map((part, index) => {
        const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        return link ? (
          <Link key={index} to={link[2]}>
            {link[1]}
          </Link>
        ) : (
          part
        );
      })}
    </>
  );
}
function Content({ body }: { body: string }) {
  return (
    <>
      {body.split("\n\n").map((block, index) => {
        if (block.startsWith("|")) {
          const rows = block
            .split("\n")
            .filter((row) => !row.includes("---"))
            .map((row) =>
              row
                .split("|")
                .slice(1, -1)
                .map((cell) => cell.trim()),
            );
          return (
            <div
              key={index}
              className="privacyData"
              role="table"
              aria-label="Thông tin và mục đích sử dụng"
            >
              <div className="privacyDataHead" role="row">
                {rows[0].map((cell) => (
                  <span key={cell} role="columnheader">
                    {cell}
                  </span>
                ))}
              </div>
              {rows.slice(1).map((row) => (
                <div key={row[0]} className="privacyDataRow" role="row">
                  <strong role="cell">{row[0]}</strong>
                  <span role="cell">{row[1]}</span>
                </div>
              ))}
            </div>
          );
        }
        if (block.startsWith("- "))
          return (
            <ul key={index}>
              {block.split("\n").map((item) => (
                <li key={item}>{item.slice(2)}</li>
              ))}
            </ul>
          );
        return (
          <p key={index}>
            <Paragraph text={block} />
          </p>
        );
      })}
    </>
  );
}
export function PrivacyPage() {
  return (
    <article className="page privacy105">
      <header>
        <span className="privacyEyebrow">Thông tin của bạn</span>
        <h1>Quyền riêng tư</h1>
        <p>
          Bạn có thể xem thông tin nào được dùng, vì sao cần dùng và cách gửi
          yêu cầu về dữ liệu của mình.
        </p>
      </header>
      <nav aria-label="Các mục quyền riêng tư">
        {sections.map((section) => (
          <a key={section.id} href={`#${section.id}`}>
            {section.title}
          </a>
        ))}
      </nav>
      <div className="privacySections">
        {sections.map((section) => (
          <section
            key={section.id}
            id={section.id}
            aria-labelledby={`${section.id}-title`}
          >
            <h2 id={`${section.id}-title`}>{section.title}</h2>
            <Content body={section.body} />
          </section>
        ))}
      </div>
    </article>
  );
}
