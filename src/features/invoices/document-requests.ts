/** Only the latest selection in the current screen may publish a response. */
export class LatestDocumentRequest {
  private revision = 0;

  invalidate() {
    this.revision++;
  }

  async run<T>(
    read: () => Promise<T>,
    success: (value: T) => void,
    failure: () => void,
  ) {
    const revision = ++this.revision;
    try {
      const value = await read();
      if (revision === this.revision) success(value);
    } catch {
      if (revision === this.revision) failure();
    }
  }
}
