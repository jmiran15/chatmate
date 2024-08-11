import React, { useMemo, useState, useCallback } from "react";
import { createEditor, Descendant, Element as SlateElement } from "slate";
import { Slate, Editable, withReact } from "slate-react";
import { withHistory } from "slate-history";
import { FloatingToolbar } from "./FloatingToolbar";

interface MarkdownEditorProps {
  initialContent: string;
}

const deserialize = (content: string): Descendant[] => {
  // For now, we'll just return a simple paragraph
  return [
    {
      type: "paragraph",
      children: [{ text: content }],
    } as SlateElement,
  ];
};

const Element = ({ attributes, children, element }: any) => {
  switch (element.type) {
    case "heading-one":
      return (
        <h1 {...attributes} className="text-4xl font-bold my-4">
          {children}
        </h1>
      );
    case "heading-two":
      return (
        <h2 {...attributes} className="text-3xl font-semibold my-3">
          {children}
        </h2>
      );
    case "numbered-list":
      return <ol {...attributes}>{children}</ol>;
    case "bulleted-list":
      return <ul {...attributes}>{children}</ul>;
    case "list-item":
      return <li {...attributes}>{children}</li>;
    case "paragraph":
    default:
      return (
        <p {...attributes} className="my-2">
          {children}
        </p>
      );
  }
};

const Leaf = ({ attributes, children, leaf }: any) => {
  if (leaf.bold) {
    children = <strong>{children}</strong>;
  }
  if (leaf.italic) {
    children = <em>{children}</em>;
  }
  return <span {...attributes}>{children}</span>;
};

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  initialContent,
}) => {
  const editor = useMemo(() => withHistory(withReact(createEditor())), []);
  const [value, setValue] = useState<Descendant[]>(() =>
    deserialize(initialContent),
  );

  const renderElement = useCallback((props: any) => <Element {...props} />, []);
  const renderLeaf = useCallback((props: any) => <Leaf {...props} />, []);

  return (
    <div className="relative max-w-2xl mx-auto">
      <Slate editor={editor} initialValue={value} onChange={setValue}>
        <FloatingToolbar />
        <Editable
          renderElement={renderElement}
          renderLeaf={renderLeaf}
          placeholder="Start writing..."
          className="prose prose-lg dark:prose-invert"
        />
      </Slate>
    </div>
  );
};
