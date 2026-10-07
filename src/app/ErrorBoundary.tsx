import { Component, type ReactNode } from "react";
import styles from "./ErrorBoundary.module.css";

export class ErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <main className={styles.screen} aria-labelledby="screenErrorTitle">
        <div className={styles.content}>
          <div className={styles.illustration} aria-hidden="true">
            <span className={styles.halo} />
            <svg className={styles.parcel} viewBox="0 0 240 220" fill="none">
              <ellipse cx="120" cy="191" rx="55" ry="9" fill="#dce4ff" />
              <g
                className={styles.box}
                stroke="#163cff"
                strokeWidth="3"
                strokeLinejoin="round"
              >
                <path d="m58 77 62-27 62 27v91l-62 27-62-27Z" fill="#eef2ff" />
                <path d="m58 77 62 27 62-27M120 104v91" />
                <path d="m91 63 62 27v24l-18 8V98L73 71" fill="#cbd6ff" />
                <g
                  className={styles.eyes}
                  stroke="#111c35"
                  strokeLinecap="round"
                >
                  <path d="M76 117v6M102 128v6" />
                </g>
                <path
                  d="M80 143q8-7 16 6"
                  stroke="#111c35"
                  strokeLinecap="round"
                />
                <path
                  d="m148 141 17-7m-17 17 11-5"
                  stroke="#8fa5ed"
                  strokeLinecap="round"
                />
              </g>
              <g stroke="#8fa5ed" strokeWidth="2.5" strokeLinecap="round">
                <path d="M44 48v10m-5-5h10M195 123v10m-5-5h10" />
                <path d="m177 38 5 5m0-5-5 5" />
              </g>
            </svg>
          </div>
          <h1 id="screenErrorTitle" className={styles.title}>
            Chưa mở được màn hình
          </h1>
          <p className={styles.description}>Tải lại trang để thử tiếp.</p>
          <button
            className={styles.reload}
            type="button"
            onClick={() => window.location.reload()}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 7v5h-5M20 12a8 8 0 1 0-2 5M20 7l-3 3" />
            </svg>
            Tải lại trang
          </button>
          <p className={styles.caution}>
            Nếu vừa gửi một thao tác, kiểm tra lịch sử đơn trước khi gửi lại.
          </p>
        </div>
      </main>
    ) : (
      this.props.children
    );
  }
}
