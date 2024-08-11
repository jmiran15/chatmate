import React from "react";
import { useSlate } from "slate-react";
import {
  Editor,
  Transforms,
  Element as SlateElement,
  Range,
  Node,
} from "slate";

const isMarkActive = (editor: Editor, format: string) => {
  const marks = Editor.marks(editor);
  return marks ? marks[format] === true : false;
};

const toggleMark = (editor: Editor, format: string) => {
  const isActive = isMarkActive(editor, format);
  if (isActive) {
    Editor.removeMark(editor, format);
  } else {
    Editor.addMark(editor, format, true);
  }
};

const isBlockActive = (editor: Editor, format: string) => {
  const [match] = Editor.nodes(editor, {
    match: (n) =>
      !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === format,
  });
  return !!match;
};

const toggleBlock = (editor: Editor, format: string) => {
  const isActive = isBlockActive(editor, format);
  const isList = format === "numbered-list" || format === "bulleted-list";

  Transforms.unwrapNodes(editor, {
    match: (n) =>
      !Editor.isEditor(n) &&
      SlateElement.isElement(n) &&
      ["numbered-list", "bulleted-list"].includes(n.type),
    split: true,
  });

  const newProperties: Partial<SlateElement> = {
    type: isActive ? "paragraph" : isList ? "list-item" : format,
  };

  if (!isActive && isList) {
    const block = { type: format, children: [] };
    Transforms.wrapNodes(editor, block);
  }

  const { selection } = editor;
  if (selection && Range.isCollapsed(selection)) {
    // If the selection is collapsed (cursor), apply to the whole block
    Transforms.setNodes(editor, newProperties);
  } else if (selection) {
    // If there's a selection, only apply to the selected text
    Transforms.setNodes(editor, newProperties, {
      match: (n) => Editor.isBlock(editor, n),
      split: true,
    });
  }
};

const FormatButton = ({ format, icon, blockFormat = false }) => {
  const editor = useSlate();
  return (
    <button
      onMouseDown={(event) => {
        event.preventDefault();
        if (blockFormat) {
          toggleBlock(editor, format);
        } else {
          toggleMark(editor, format);
        }
        console.log(`Toggled ${format}`); // Add this line for debugging
      }}
      className={`p-2 ${
        blockFormat
          ? isBlockActive(editor, format)
          : isMarkActive(editor, format)
          ? "text-blue-500"
          : "text-gray-500"
      }`}
    >
      {icon}
    </button>
  );
};

export const FloatingToolbar: React.FC = () => {
  return (
    <div className="sticky top-0 z-10 flex items-center justify-center p-2 mb-4 bg-white border border-gray-200 rounded shadow-md">
      <FormatButton format="bold" icon="B" />
      <FormatButton format="italic" icon="I" />
      <FormatButton format="heading-one" icon="H1" blockFormat />
      <FormatButton format="heading-two" icon="H2" blockFormat />
    </div>
  );
};
