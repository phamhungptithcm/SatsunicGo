import { Link } from "react-router-dom";
import { purchaseTerms } from "../../../packages/domain/public-content";
import "./terms-page.css";

export function TermsPage() {
  return (
    <section
      className="page purchaseTerms"
      aria-labelledby="purchase-terms-title"
    >
      <header>
        <h1 id="purchase-terms-title">{purchaseTerms.title}</h1>
        <p>{purchaseTerms.intro}</p>
      </header>
      <ol className="purchaseTermsSections" role="list">
        {purchaseTerms.sections.map((section, index) => (
          <li key={section.id}>
            <span className="purchaseTermsNumber" aria-hidden="true">
              {index + 1}
            </span>
            <section aria-labelledby={`terms-${section.id}`}>
              <h2 id={`terms-${section.id}`}>{section.title}</h2>
              <p>{section.body}</p>
            </section>
          </li>
        ))}
      </ol>
      <Link className="primary purchaseTermsAction" to="/request">
        Gửi yêu cầu mua hộ <span aria-hidden="true">→</span>
      </Link>
    </section>
  );
}
