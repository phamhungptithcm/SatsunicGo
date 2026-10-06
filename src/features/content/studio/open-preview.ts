export type PreviewWindow = {
  closed: boolean;
  close(): void;
  location: { replace(url: string): void };
};

/** Open during the click gesture; never navigate until the draft is saved. */
export async function openSavedPreview(options: {
  url: string;
  open: () => PreviewWindow | null;
  prepare: () => Promise<boolean>;
  navigate: (url: string) => void;
  onError: (error: unknown) => void;
}) {
  let tab: PreviewWindow | null = null;
  const closeTab = () => {
    try {
      tab?.close();
    } catch {
      /* Best-effort placeholder cleanup. */
    }
  };
  try {
    try {
      tab = options.open();
    } catch {
      /* Popup policy: use the current tab. */
    }
    if (!(await options.prepare())) {
      closeTab();
      return;
    }
    if (!tab) options.navigate(options.url);
    else if (!tab.closed) {
      try {
        tab.location.replace(options.url);
      } catch {
        closeTab();
        options.navigate(options.url);
      }
    }
  } catch (error) {
    closeTab();
    options.onError(error);
  }
}
