interface DisplayResultInput {
  title: string;
  variant: "success" | "destructive" | "default";
}

export type DisplayResultFn = (input: DisplayResultInput) => void;

export async function copyToClipboard(
  text: string,
  displayResult: DisplayResultFn,
) {
  try {
    await navigator.clipboard.writeText(text);

    displayResult({
      title: "Copied to clipboard",
      variant: "success",
    });
  } catch (error) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand("copy");
      displayResult({
        title: "Copied to clipboard",
        variant: "success",
      });
    } catch (error) {
      displayResult({
        title: "Copy failed, please grant permission to access clipboard",
        variant: "destructive",
      });
    }
    document.body.removeChild(textArea);
  }
}
