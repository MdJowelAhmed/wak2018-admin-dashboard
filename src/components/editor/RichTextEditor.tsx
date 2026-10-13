import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import { Color } from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/utils/utils";
import "./RichTextEditor.css";

// ── Icons ─────────────────────────────────────────────────────────────────
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Code2,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link as LinkIcon,
  Unlink,
  Highlighter,
  Minus,
  Image as ImageIcon,
  Table as TableIcon,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
export type SnippetItem = {
  label: string;
  icon?: React.ReactNode;
  content: string;
};

export type RichTextEditorProps = {
  value?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  disabled?: boolean;
  minHeight?: number;
  maxHeight?: number;
  className?: string;
  /** Show character count bar at the bottom */
  showWordCount?: boolean;
  /** Allow switching between TipTap visual WYSIWYG and raw HTML source */
  allowSourceToggle?: boolean;
  /** Quick insert snippet templates */
  snippets?: SnippetItem[];
};

// ─────────────────────────────────────────────────────────────────────────────
// Toolbar button helper
// ─────────────────────────────────────────────────────────────────────────────
function ToolbarBtn({
  active,
  disabled,
  onClick,
  title,
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      disabled={disabled}
      title={title}
      className={cn("rte-btn", active && "is-active")}
    >
      {children}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Toolbar
// ─────────────────────────────────────────────────────────────────────────────
function Toolbar({
  editor,
  isCodeMode,
  onToggleCodeMode,
  allowSourceToggle,
}: {
  editor: Editor;
  isCodeMode: boolean;
  onToggleCodeMode: () => void;
  allowSourceToggle: boolean;
}) {
  const setLink = useCallback(() => {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Enter URL:", prev ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().unsetLink().run();
    } else {
      editor.chain().focus().setLink({ href: url, target: "_blank" }).run();
    }
  }, [editor]);

  const addImage = useCallback(() => {
    const url = window.prompt("Image URL:");
    if (url) editor.chain().focus().setImage({ src: url }).run();
  }, [editor]);

  const addTable = useCallback(() => {
    editor
      .chain()
      .focus()
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run();
  }, [editor]);

  return (
    <div className="rte-toolbar">
      {/* Undo / Redo */}
      <div className="rte-toolbar-group">
        <ToolbarBtn
          onClick={() => editor.chain().focus().undo().run()}
          disabled={isCodeMode || !editor.can().undo()}
          title="Undo (Ctrl+Z)"
        >
          <Undo />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().redo().run()}
          disabled={isCodeMode || !editor.can().redo()}
          title="Redo (Ctrl+Y)"
        >
          <Redo />
        </ToolbarBtn>
      </div>

      <div className="rte-toolbar-divider" />

      {/* Heading picker */}
      <div className="rte-toolbar-group">
        <select
          title="Paragraph / Heading"
          disabled={isCodeMode}
          className="rte-select"
          value={
            editor.isActive("heading", { level: 1 })
              ? "h1"
              : editor.isActive("heading", { level: 2 })
                ? "h2"
                : editor.isActive("heading", { level: 3 })
                  ? "h3"
                  : editor.isActive("heading", { level: 4 })
                    ? "h4"
                    : "p"
          }
          onChange={(e) => {
            const v = e.target.value;
            if (v === "p") {
              editor.chain().focus().setParagraph().run();
            } else {
              editor
                .chain()
                .focus()
                .setHeading({
                  level: Number(v.slice(1)) as 1 | 2 | 3 | 4,
                })
                .run();
            }
          }}
        >
          <option value="p">Paragraph</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="h4">Heading 4</option>
        </select>
      </div>

      <div className="rte-toolbar-divider" />

      {/* Text formatting */}
      <div className="rte-toolbar-group">
        <ToolbarBtn
          active={editor.isActive("bold")}
          disabled={isCodeMode}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold (Ctrl+B)"
        >
          <Bold />
        </ToolbarBtn>
        <ToolbarBtn
          active={editor.isActive("italic")}
          disabled={isCodeMode}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic (Ctrl+I)"
        >
          <Italic />
        </ToolbarBtn>
        <ToolbarBtn
          active={editor.isActive("underline")}
          disabled={isCodeMode}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title="Underline (Ctrl+U)"
        >
          <UnderlineIcon />
        </ToolbarBtn>
        <ToolbarBtn
          active={editor.isActive("strike")}
          disabled={isCodeMode}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          title="Strikethrough"
        >
          <Strikethrough />
        </ToolbarBtn>
        <ToolbarBtn
          active={editor.isActive("code")}
          disabled={isCodeMode}
          onClick={() => editor.chain().focus().toggleCode().run()}
          title="Inline Code"
        >
          <Code />
        </ToolbarBtn>
      </div>

      <div className="rte-toolbar-divider" />

      {/* Text color */}
      <div className="rte-toolbar-group" title="Text Color">
        <input
          type="color"
          disabled={isCodeMode}
          className="rte-color-input"
          title="Text Color"
          value={editor.getAttributes("textStyle").color ?? "#000000"}
          onInput={(e) => {
            editor
              .chain()
              .focus()
              .setColor((e.target as HTMLInputElement).value)
              .run();
          }}
        />
        <ToolbarBtn
          active={editor.isActive("highlight")}
          disabled={isCodeMode}
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          title="Highlight"
        >
          <Highlighter />
        </ToolbarBtn>
      </div>

      <div className="rte-toolbar-divider" />

      {/* Alignment */}
      <div className="rte-toolbar-group">
        <ToolbarBtn
          active={editor.isActive({ textAlign: "left" })}
          disabled={isCodeMode}
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          title="Align Left"
        >
          <AlignLeft />
        </ToolbarBtn>
        <ToolbarBtn
          active={editor.isActive({ textAlign: "center" })}
          disabled={isCodeMode}
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          title="Align Center"
        >
          <AlignCenter />
        </ToolbarBtn>
        <ToolbarBtn
          active={editor.isActive({ textAlign: "right" })}
          disabled={isCodeMode}
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          title="Align Right"
        >
          <AlignRight />
        </ToolbarBtn>
        <ToolbarBtn
          active={editor.isActive({ textAlign: "justify" })}
          disabled={isCodeMode}
          onClick={() => editor.chain().focus().setTextAlign("justify").run()}
          title="Justify"
        >
          <AlignJustify />
        </ToolbarBtn>
      </div>

      <div className="rte-toolbar-divider" />

      {/* Lists */}
      <div className="rte-toolbar-group">
        <ToolbarBtn
          active={editor.isActive("bulletList")}
          disabled={isCodeMode}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Bullet List"
        >
          <List />
        </ToolbarBtn>
        <ToolbarBtn
          active={editor.isActive("orderedList")}
          disabled={isCodeMode}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Ordered List"
        >
          <ListOrdered />
        </ToolbarBtn>
        <ToolbarBtn
          active={editor.isActive("blockquote")}
          disabled={isCodeMode}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          title="Blockquote"
        >
          <Quote />
        </ToolbarBtn>
      </div>

      <div className="rte-toolbar-divider" />

      {/* Link / Image / Table / HR */}
      <div className="rte-toolbar-group">
        <ToolbarBtn
          active={editor.isActive("link")}
          disabled={isCodeMode}
          onClick={setLink}
          title="Insert / Edit Link"
        >
          <LinkIcon />
        </ToolbarBtn>
        {editor.isActive("link") && (
          <ToolbarBtn
            disabled={isCodeMode}
            onClick={() => editor.chain().focus().unsetLink().run()}
            title="Remove Link"
          >
            <Unlink />
          </ToolbarBtn>
        )}
        <ToolbarBtn
          disabled={isCodeMode}
          onClick={addImage}
          title="Insert Image URL"
        >
          <ImageIcon />
        </ToolbarBtn>
        <ToolbarBtn
          disabled={isCodeMode}
          onClick={addTable}
          title="Insert Table (3×3)"
        >
          <TableIcon />
        </ToolbarBtn>
        <ToolbarBtn
          disabled={isCodeMode}
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Horizontal Divider"
        >
          <Minus />
        </ToolbarBtn>
      </div>

      {/* HTML / Visual Toggle */}
      {allowSourceToggle && (
        <>
          <div className="rte-toolbar-divider" />
          <div className="rte-toolbar-group ml-auto">
            <ToolbarBtn
              active={isCodeMode}
              onClick={onToggleCodeMode}
              title={isCodeMode ? "Switch to Visual WYSIWYG Editor" : "View / Edit HTML Source Code"}
            >
              <Code2 className="h-4 w-4" />
            </ToolbarBtn>
          </div>
        </>
      )}
    </div>
  );
}

function isContentEqual(editor: Editor, incoming: string | undefined): boolean {
  const isIncomingEmpty = !incoming || incoming.trim() === "" || incoming.trim() === "<p></p>";
  if (isIncomingEmpty) {
    return editor.isEmpty;
  }
  const currentHtml = editor.getHTML();
  if (currentHtml === incoming) {
    return true;
  }
  // If incoming string has no HTML tags, compare text content to avoid <p> tag mismatch
  if (!incoming.includes("<") && !incoming.includes(">")) {
    return editor.getText().trim() === incoming.trim();
  }
  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main RichTextEditor component
// ─────────────────────────────────────────────────────────────────────────────
export function RichTextEditor({
  value = "",
  onChange,
  placeholder = "Start writing here...",
  disabled = false,
  minHeight = 200,
  maxHeight,
  className,
  showWordCount = true,
  allowSourceToggle = true,
  snippets,
}: RichTextEditorProps) {
  const [isCodeMode, setIsCodeMode] = useState(false);
  const isProgrammaticUpdateRef = useRef(false);

  const extensions = useMemo(
    () => [
      StarterKit.configure({
        codeBlock: false,
      }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
      }),
      Color,
      TextStyle,
      Highlight.configure({ multicolor: false }),
      Image.configure({ inline: false, allowBase64: true }),
      Placeholder.configure({ placeholder }),
      CharacterCount,
      Table.configure({ resizable: false }),
      TableRow,
      TableCell,
      TableHeader,
    ],
    [placeholder],
  );

  const editor = useEditor({
    extensions,
    content: value,
    editable: !disabled,
    onUpdate({ editor }) {
      if (isProgrammaticUpdateRef.current) return;
      if (!editor || editor.isDestroyed || (editor as any).destroyed || !editor.schema) {
        return;
      }
      try {
        onChange?.(editor.getHTML());
      } catch {
        // Safe guard against unmount race conditions
      }
    },
  });

  // Sync external value changes safely without resetting cursor when user is focused
  useEffect(() => {
    if (!editor || editor.isDestroyed || (editor as any).destroyed || !editor.schema) {
      return;
    }
    if (editor.isFocused) return;
    try {
      if (isContentEqual(editor, value)) {
        return;
      }
      isProgrammaticUpdateRef.current = true;
      editor.commands.setContent(value ?? "", { emitUpdate: false });
      isProgrammaticUpdateRef.current = false;
    } catch {
      isProgrammaticUpdateRef.current = false;
    }
  }, [editor, value]);

  // Sync disabled prop
  useEffect(() => {
    if (!editor || editor.isDestroyed || (editor as any).destroyed) return;
    try {
      editor.setEditable(!disabled);
    } catch {
      // Safe guard
    }
  }, [editor, disabled]);

  const toggleCodeMode = () => {
    if (!isCodeMode && editor && !editor.isDestroyed && editor.schema) {
      // Switching to code mode: sync latest HTML from editor
      let latestHtml = value;
      try {
        latestHtml = editor.getHTML();
      } catch {
        latestHtml = value;
      }
      onChange?.(latestHtml);
      setIsCodeMode(true);
    } else if (isCodeMode && editor && !editor.isDestroyed) {
      // Switching back to visual mode: reload HTML into TipTap
      try {
        isProgrammaticUpdateRef.current = true;
        editor.commands.setContent(value ?? "", { emitUpdate: false });
        isProgrammaticUpdateRef.current = false;
      } catch {
        isProgrammaticUpdateRef.current = false;
      }
      setIsCodeMode(false);
    }
  };

  const handleInsertSnippet = (snippetContent: string) => {
    if (isCodeMode) {
      const next = value ? `${value}\n${snippetContent}` : snippetContent;
      onChange?.(next);
    } else if (editor && !editor.isDestroyed) {
      try {
        editor.chain().focus().insertContent(snippetContent).run();
      } catch {
        // Safe guard
      }
    }
  };

  const charCount =
    editor && !editor.isDestroyed && editor.storage?.characterCount
      ? editor.storage.characterCount.characters()
      : (value?.length ?? 0);
  const wordCount =
    editor && !editor.isDestroyed && editor.storage?.characterCount
      ? editor.storage.characterCount.words()
      : value
        ? value.trim().split(/\s+/).length
        : 0;

  return (
    <div
      className={cn(
        "rte-wrapper overflow-hidden rounded-xl border border-[#EEE7DF] bg-white transition-shadow shadow-xs",
        disabled && "opacity-60 pointer-events-none",
        className,
      )}
    >
      {/* Toolbar */}
      {editor && !editor.isDestroyed && (
        <Toolbar
          editor={editor}
          isCodeMode={isCodeMode}
          onToggleCodeMode={toggleCodeMode}
          allowSourceToggle={allowSourceToggle}
        />
      )}

      {/* Snippet / Quick Blocks Ribbon */}
      {snippets && snippets.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 border-b border-[#EEE7DF] bg-[#faf8f5] px-3 py-2 text-xs">
          <span className="mr-1 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
            Quick Insert:
          </span>
          {snippets.map((snip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleInsertSnippet(snip.content)}
              disabled={disabled}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#e3dcd3] bg-white px-2.5 py-1 text-xs font-medium text-neutral-700 shadow-2xs transition-all hover:border-[#895129]/40 hover:bg-[#895129]/5 hover:text-[#895129] active:scale-95"
            >
              {snip.icon}
              <span>{snip.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Content Area */}
      {isCodeMode ? (
        <textarea
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          disabled={disabled}
          placeholder="<p>Enter HTML code here...</p>"
          className="rte-code-textarea"
          style={{
            minHeight,
            maxHeight: maxHeight ?? undefined,
          }}
        />
      ) : (
        <div
          className="rte-content"
          style={{
            minHeight,
            maxHeight: maxHeight ?? undefined,
            overflowY: maxHeight ? "auto" : undefined,
          }}
        >
          <EditorContent editor={editor} />
        </div>
      )}

      {/* Footer: word / char count + mode indicator */}
      {showWordCount && (
        <div className="flex items-center justify-between border-t border-[#EEE7DF] bg-[#faf8f5] px-4 py-2 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span>
              {wordCount} word{wordCount !== 1 ? "s" : ""}
            </span>
            <span>
              {charCount.toLocaleString()} character{charCount !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold",
                isCodeMode
                  ? "bg-amber-100 text-amber-800"
                  : "bg-emerald-100 text-emerald-800",
              )}
            >
              {isCodeMode ? "HTML Source Mode" : "TipTap WYSIWYG Mode"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default RichTextEditor;
