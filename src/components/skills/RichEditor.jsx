import { useRef, useEffect } from "react";
import { T } from "../../theme";

export const RichEditor = ({ value, onChange }) => {
  const editorRef = useRef(null);
  const isInitRef = useRef(false);
  const savedRange = useRef(null);

  useEffect(() => {
    if (editorRef.current && !isInitRef.current) {
      editorRef.current.innerHTML = value || "";
      isInitRef.current = true;
    }
  }, []);

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedRange.current = sel.getRangeAt(0);
    }
  };

  const restoreSelection = () => {
    if (savedRange.current) {
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(savedRange.current);
    }
  };

  const exec = (cmd, val) => {
    editorRef.current?.focus();
    restoreSelection();
    document.execCommand(cmd, false, val || null);
    if (onChange) onChange(editorRef.current?.innerHTML || "");
  };

  const handleInput = () => {
    if (onChange) onChange(editorRef.current?.innerHTML || "");
  };

  const toolbarBtn = (label, onClickFn, extraStyle = {}) => (
    <button
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClickFn();
      }}
      style={{
        height: 28, border: "none", background: "transparent", cursor: "pointer",
        fontSize: "11px", color: T.charcoal, padding: "0 8px", display: "flex", alignItems: "center",
        ...extraStyle,
      }}
    >{label}</button>
  );

  return (
    <div style={{ border: "1px solid " + T.lightLine, background: T.white }}>
      <div style={{ display: "flex", gap: 1, padding: "4px 6px", borderBottom: "1px solid " + T.lightLine, background: T.cream, flexWrap: "wrap", alignItems: "center" }}>
        {toolbarBtn("B", () => exec("bold"), { fontWeight: 700, fontSize: "13px", width: 28, justifyContent: "center" })}
        {toolbarBtn("I", () => exec("italic"), { fontStyle: "italic", fontSize: "13px", width: 28, justifyContent: "center" })}
        {toolbarBtn("U", () => exec("underline"), { textDecoration: "underline", fontSize: "13px", width: 28, justifyContent: "center" })}
        <div style={{ width: 1, height: 18, background: T.lightLine, margin: "0 4px" }} />
        {toolbarBtn("1. List", () => exec("insertOrderedList"))}
        {toolbarBtn("• List", () => exec("insertUnorderedList"))}
        <div style={{ width: 1, height: 18, background: T.lightLine, margin: "0 4px" }} />
        {toolbarBtn("H3", () => exec("formatBlock", "<h3>"), { fontWeight: 700 })}
        {toolbarBtn("¶", () => exec("formatBlock", "<p>"), { color: T.textMuted })}
        {toolbarBtn("Clear", () => exec("removeFormat"), { color: T.textMuted })}
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onMouseUp={saveSelection}
        onKeyUp={saveSelection}
        style={{
          minHeight: 120, padding: "12px 14px", fontSize: "13px", lineHeight: 1.7, color: T.charcoal, outline: "none",
        }}
      />
    </div>
  );
};
