declare module "guest-qa-axe" {
  const axe: {
    run(
      element: Element,
      options: unknown,
    ): Promise<{
      violations: Array<{
        id: string;
        impact: string | null;
        nodes: unknown[];
      }>;
      incomplete: Array<{
        id: string;
        nodes: Array<{
          target: string[];
          failureSummary?: string;
          any: Array<{ id: string; message: string; data: unknown }>;
        }>;
      }>;
    }>;
  };
  export default axe;
}
