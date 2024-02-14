import { useState } from "react";
import SyntaxHighlighter from "react-syntax-highlighter";
import { vs2015 } from "react-syntax-highlighter/dist/cjs/styles/hljs";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { Copy, CheckCircle } from "lucide-react";

export default function CodeBlock({
  code,
  language,
}: {
  code: string;
  language: string;
}) {
  const [copied, setCopied] = useState(false);
  const notify = () => {
    toast(<ToastDisplay className="bg-neutral-700 m-2" />);
    copy();
  };

  function ToastDisplay() {
    return (
      <div className="m-2">
        <p className="text-md">Copied to clipboard!</p>
      </div>
    );
  }
  const copy = () => {
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 5000);
  };

  return (
    <div className="relative">
      <button className="absolute top-0 right-0 p-2">
        <CopyToClipboard text={code} onCopy={() => notify()}>
          {copied ? (
            <CheckCircle className="h-6 w-6 text-green-300" />
          ) : (
            <Copy className="h-6 w-6" color="#fff" />
          )}
        </CopyToClipboard>
      </button>
      <SyntaxHighlighter
        className="rounded-md"
        language={language}
        style={vs2015}
        wrapLines={true}
        wrapLongLines={true}
        showLineNumbers={false}
        showInlineLineNumbers={false}
      >
        {code}
      </SyntaxHighlighter>
      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        hideProgressBar
        newestOnTop={false}
        closeOnClick={false}
        closeButton={false}
        limit={1}
        rtl={false}
        pauseOnFocusLoss={false}
        draggable={false}
        pauseOnHover={false}
        theme="dark"
      />
    </div>
  );
}
