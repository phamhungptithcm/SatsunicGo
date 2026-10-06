export function isMermaidBlock(language: unknown, source: string): boolean {
  if (pastedMermaid(source) !== null) return true;
  if (language === "mermaid") return true;
  if (language) return false;
  const text = source.replace(/^\s*%%[^\n]*(?:\n|$)/gm, "").trimStart();
  return /^(?:flowchart|graph)\s+(?:TD|TB|BT|LR|RL)\b|^(?:sequenceDiagram|classDiagram|stateDiagram(?:-v2)?|erDiagram|journey|gantt|pie|mindmap|timeline|gitGraph|quadrantChart)\b/.test(
    text,
  );
}
export function pastedMermaid(text: string): string | null {
  const match = /^\s*```mermaid\s*\n([\s\S]*?)\n```\s*$/i.exec(text);
  return match?.[1] && match[1].length <= 10000 ? match[1] : null;
}

export function mermaidSource(source: string): string {
  return pastedMermaid(source) ?? source;
}
