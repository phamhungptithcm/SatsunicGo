import { Link } from "react-router-dom";
import {
  restrictedIntro,
  restrictedGroups,
  restrictedChecklist,
  restrictedFaq,
} from "../../../packages/domain/restricted-content";
import "./restricted-page.css";
const paths: Record<string, string> = {
  battery: "M3 7h16v10H3zM21 10v4M7 10v4M11 10v4",
  drop: "M12 3s-7 8-7 12a7 7 0 0 0 14 0c0-4-7-12-7-12Z",
  leaf: "M20 4C8 2 2 8 5 16c6 7 17 0 15-12ZM5 20 16 9",
  gem: "m3 8 4-5h10l4 5-9 13ZM3 8h18M7 3l5 18 5-18",
};
export function RestrictedPage() {
  return (
    <section className="page restrictedPage">
      <header className="restrictedHeading">
        <span className="restrictedEyebrow">Trước khi mua & gửi hàng</span>
        <h1>Hàng hạn chế</h1>
        <p>{restrictedIntro}</p>
      </header>
      <section aria-labelledby="restricted-groups">
        <h2 id="restricted-groups">Những món nên hỏi trước</h2>
        <div className="restrictedGrid">
          {restrictedGroups.map((group) => (
            <article className="restrictedCard" key={group.title}>
              <span className="restrictedIcon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d={paths[group.symbol]} />
                </svg>
              </span>
              <h3>{group.title}</h3>
              <p>{group.example}</p>
              <p className="restrictedHint">{group.note}</p>
            </article>
          ))}
        </div>
      </section>
      <section
        className="restrictedPrepare"
        aria-labelledby="restricted-prepare"
      >
        <div>
          <h2 id="restricted-prepare">Bạn cần gửi gì?</h2>
          <ul>
            {restrictedChecklist.map((item, i) => (
              <li key={item}>
                <span aria-hidden="true">{i + 1}</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="restrictedAction">
          <h3>Chưa chắc món này gửi được?</h3>
          <p>
            Gửi link hoặc ảnh để nhân viên kiểm tra trước khi bạn quyết định
            mua.
          </p>
          <Link className="primary" to="/request">
            Nhờ kiểm tra sản phẩm <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>
      <section className="restrictedFaq" aria-labelledby="restricted-faq">
        <h2 id="restricted-faq">Câu hỏi thường gặp</h2>
        {restrictedFaq.map((faq) => (
          <details key={faq.question}>
            <summary>{faq.question}</summary>
            <p>{faq.answer}</p>
          </details>
        ))}
      </section>
    </section>
  );
}
