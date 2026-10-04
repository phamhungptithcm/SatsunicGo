import { Component, type ReactNode } from "react";
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
      <main className="page">
        <h1>Chưa mở được màn hình</h1>
        <p>
          Tải lại trang để thử tiếp. Nếu vừa gửi một thao tác, kiểm tra lịch sử
          đơn trước khi gửi lại.
        </p>
        <button onClick={() => window.location.reload()}>Tải lại trang</button>
      </main>
    ) : (
      this.props.children
    );
  }
}
