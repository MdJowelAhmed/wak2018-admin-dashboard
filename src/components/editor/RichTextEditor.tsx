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
import { useCallback, useEffect } from "react";
import { cn } from "@/utils/utils";
import "./RichTextEditor.css";

// ── Icons ─────────────────────────────────────────────────────────────────
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
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
function Toolbar({ editor }: { editor: Editor }) {
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
          disabled={!editor.can().undo()}
          title="Undo (Ctrl+Z)"
        >
          <Undo />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
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
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold (Ctrl+B)"
        >
          <Bold />
        </ToolbarBtn>
        <ToolbarBtn
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic (Ctrl+I)"
        >
          <Italic />
        </ToolbarBtn>
        <ToolbarBtn
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title="Underline (Ctrl+U)"
        >
          <UnderlineIcon />
        </ToolbarBtn>
        <ToolbarBtn
          active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          title="Strikethrough"
        >
          <Strikethrough />
        </ToolbarBtn>
        <ToolbarBtn
          active={editor.isActive("code")}
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
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          title="Align Left"
        >
          <AlignLeft />
        </ToolbarBtn>
        <ToolbarBtn
          active={editor.isActive({ textAlign: "center" })}
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          title="Align Center"
        >
          <AlignCenter />
        </ToolbarBtn>
        <ToolbarBtn
          active={editor.isActive({ textAlign: "right" })}
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          title="Align Right"
        >
          <AlignRight />
        </ToolbarBtn>
        <ToolbarBtn
          active={editor.isActive({ textAlign: "justify" })}
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
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Bullet List"
        >
          <List />
        </ToolbarBtn>
        <ToolbarBtn
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Ordered List"
        >
          <ListOrdered />
        </ToolbarBtn>
        <ToolbarBtn
          active={editor.isActive("blockquote")}
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
          onClick={setLink}
          title="Insert / Edit Link"
        >
          <LinkIcon />
        </ToolbarBtn>
        {editor.isActive("link") && (
          <ToolbarBtn
            onClick={() => editor.chain().focus().unsetLink().run()}
            title="Remove Link"
          >
            <Unlink />
          </ToolbarBtn>
        )}
        <ToolbarBtn onClick={addImage} title="Insert Image URL">
          <ImageIcon />
        </ToolbarBtn>
        <ToolbarBtn onClick={addTable} title="Insert Table (3×3)">
          <TableIcon />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() =>
            editor.chain().focus().setHorizontalRule().run()
          }
          title="Horizontal Divider"
        >
          <Minus />
        </ToolbarBtn>
      </div>
    </div>
  );
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
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
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
    content: value,
    editable: !disabled,
    onUpdate({ editor }) {
      onChange?.(editor.getHTML());
    },
  });

  // Sync external value changes (e.g., when API data loads)
  useEffect(() => {
    if (!editor) return;
    // Only update if the content is different to avoid cursor jump
    if (editor.getHTML() !== value) {
      editor.commands.setContent(value ?? "");
    }
  }, [editor, value]);

  // Sync disabled prop
  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [editor, disabled]);

  const charCount = editor?.storage.characterCount.characters() ?? 0;
  const wordCount = editor?.storage.characterCount.words() ?? 0;

  return (
    <div
      className={cn(
        "rte-wrapper overflow-hidden rounded-xl border border-[#EEE7DF] bg-white transition-shadow",
        disabled && "opacity-60 pointer-events-none",
        className,
      )}
    >
      {/* Toolbar */}
      {editor && <Toolbar editor={editor} />}

      {/* Content */}
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

      {/* Footer: word / char count */}
      {showWordCount && (
        <div className="flex items-center justify-between border-t border-[#EEE7DF] bg-[#faf8f5] px-4 py-2 text-[11px] text-muted-foreground">
          <span>{wordCount} word{wordCount !== 1 ? "s" : ""}</span>
          <span>{charCount.toLocaleString()} character{charCount !== 1 ? "s" : ""}</span>
        </div>
      )}
    </div>
  );
}

export default RichTextEditor;
