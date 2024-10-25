import { Content, EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "tiptap-markdown";
import { Toolbar } from "./Toolbar";

interface MinimalTiptapEditorProps {
  value: Content;
  onChange: (content: string) => void;
  className?: string;
  editorContentClassName?: string;
  placeholder?: string;
  editorProps?: Record<string, unknown>;
  maxLength?: number;
}

export function MinimalTiptapEditor({
  value,
  onChange,
  className = "",
  editorContentClassName = "",
  placeholder = "Start typing...",
  editorProps = {},
  maxLength,
}: MinimalTiptapEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit, Markdown],
    content: value,
    onUpdate: ({ editor }) => {
      const markdown = editor.storage.markdown.getMarkdown();
      onChange(markdown);
    },
    editorProps: {
      ...editorProps,
      attributes: {
        ...((editorProps.attributes as Record<string, unknown>) || {}),
        class: `prose max-w-none ${
          (editorProps.attributes as Record<string, unknown>)?.class || ""
        }`,
      },
    },
  });

  return (
    <div className={`border rounded-md ${className}`}>
      <Toolbar editor={editor} />
      <EditorContent
        editor={editor}
        className={`p-4 ${editorContentClassName}`}
      />
    </div>
  );
}
