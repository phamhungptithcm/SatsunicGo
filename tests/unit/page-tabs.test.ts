import { afterEach, expect, it, vi } from "vitest";
import type { ReactElement } from "react";
vi.mock("react", async (original) => ({
  ...(await original<typeof import("react")>()),
  useState: () => [null, vi.fn()],
}));
import { PageTabs } from "../../src/shared/PageTabs";
type TabProps = {
  id: string;
  disabled: boolean;
  tabIndex: number;
  "aria-selected": boolean;
  onClick: () => void;
  onKeyDown: (event: { key: string; preventDefault: () => void }) => void;
};
function setup(disabled = false) {
  const onChange = vi.fn();
  const element = PageTabs({
    id: "test",
    label: "Tasks",
    value: "a",
    disabled,
    items: [
      { value: "a", label: "A" },
      { value: "b", label: "B", disabled: true },
      { value: "c", label: "C" },
    ],
    onChange,
  }) as ReactElement<{ children: ReactElement<TabProps>[] }>;
  return { tabs: element.props.children, onChange };
}
afterEach(() => vi.unstubAllGlobals());
it("arrows skip disabled tabs, wrap and focus without activating", () => {
  const { tabs, onChange } = setup();
  const focus = vi.fn(),
    scrollIntoView = vi.fn(),
    getElementById = vi.fn(() => ({ focus, scrollIntoView }));
  vi.stubGlobal("document", { getElementById });
  tabs[0].props.onKeyDown({ key: "ArrowRight", preventDefault: vi.fn() });
  expect(getElementById).toHaveBeenLastCalledWith("test-tab-c");
  tabs[2].props.onKeyDown({ key: "ArrowRight", preventDefault: vi.fn() });
  expect(getElementById).toHaveBeenLastCalledWith("test-tab-a");
  expect(focus).toHaveBeenCalledTimes(2);
  expect(onChange).not.toHaveBeenCalled();
});
it("Home and End choose the enabled boundary without changing content", () => {
  const { tabs, onChange } = setup();
  const getElementById = vi.fn(() => ({
    focus: vi.fn(),
    scrollIntoView: vi.fn(),
  }));
  vi.stubGlobal("document", { getElementById });
  tabs[2].props.onKeyDown({ key: "Home", preventDefault: vi.fn() });
  expect(getElementById).toHaveBeenLastCalledWith("test-tab-a");
  tabs[0].props.onKeyDown({ key: "End", preventDefault: vi.fn() });
  expect(getElementById).toHaveBeenLastCalledWith("test-tab-c");
  expect(onChange).not.toHaveBeenCalled();
});
it("activation changes only a different tab and leaves selected click idempotent", () => {
  const { tabs, onChange } = setup();
  tabs[0].props.onClick();
  expect(onChange).not.toHaveBeenCalled();
  tabs[2].props.onClick();
  expect(onChange).toHaveBeenCalledExactlyOnceWith("c");
});
it("all-disabled groups have no keyboard stop or navigation", () => {
  const { tabs, onChange } = setup(true);
  expect(
    tabs.every((tab) => tab.props.disabled && tab.props.tabIndex === -1),
  ).toBe(true);
  const preventDefault = vi.fn();
  tabs[0].props.onKeyDown({ key: "ArrowRight", preventDefault });
  expect(preventDefault).not.toHaveBeenCalled();
  expect(onChange).not.toHaveBeenCalled();
});
