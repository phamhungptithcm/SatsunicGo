export type OneTapIdentity = {
  initialize(options: {
    client_id: string;
    auto_select: boolean;
    use_fedcm_for_prompt: boolean;
    callback: (response: { credential: string }) => Promise<void>;
  }): void;
  prompt(): void;
  cancel(): void;
};
export function createOneTapController(
  identity: OneTapIdentity,
  clientId: string,
  exchange: (credential: string) => Promise<unknown>,
  onError: (error: unknown) => void,
) {
  let disposed = false,
    busy = false;
  identity.initialize({
    client_id: clientId,
    auto_select: false,
    use_fedcm_for_prompt: true,
    callback: async ({ credential }) => {
      if (disposed || busy || !credential) return;
      busy = true;
      try {
        await exchange(credential);
        if (!disposed) identity.cancel();
      } catch (error) {
        if (!disposed) onError(error);
      } finally {
        busy = false;
      }
    },
  });
  identity.prompt();
  return () => {
    disposed = true;
    identity.cancel();
  };
}
