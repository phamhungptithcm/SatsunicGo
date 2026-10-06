import CodeBlock from "@tiptap/extension-code-block";
import {
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type ReactNodeViewProps,
} from "@tiptap/react";
import { MermaidDiagram } from "./MermaidDiagram";
import { isMermaidBlock } from "./mermaid-source";
import { useState } from "react";
function CodeBlockView({ node }: ReactNodeViewProps) {
  const diagram = isMermaidBlock(node.attrs.language, node.textContent);
  const [mode, setMode] = useState<"diagram" | "code">("diagram");
  return (
    <NodeViewWrapper
      className={diagram ? "editor-diagram-block" : "editor-code-block"}
    >
      {diagram ? (
        <>
          <div className="editor-diagram-toolbar" contentEditable={false}>
            <span>Mermaid</span>
            <div role="group" aria-label="Chế độ hiển thị Mermaid">
              <button
                type="button"
                aria-pressed={mode === "diagram"}
                onClick={() => setMode("diagram")}
              >
                Sơ đồ
              </button>
              <button
                type="button"
                aria-pressed={mode === "code"}
                onClick={() => setMode("code")}
              >
                Code
              </button>
            </div>
          </div>
          {mode === "diagram" && (
            <div contentEditable={false}>
              <MermaidDiagram source={node.textContent} showSource={false} />
            </div>
          )}
          <div hidden={mode !== "code"}>
            <NodeViewContent className="editor-code-content" />
          </div>
        </>
      ) : (
        <NodeViewContent className="editor-code-content" />
      )}
    </NodeViewWrapper>
  );
}
export const DiagramCodeBlock = CodeBlock.extend({
  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockView);
  },
});
