function sendSizeToIframe() {
  const newWidth = window.innerWidth;
  const newHeight = window.innerHeight;

  const iframe = document.getElementById("chatmate-chatbot-widget-iframe");
  if (iframe && iframe.contentWindow) {
    iframe.contentWindow.postMessage(
      {
        type: "sizeChange",
        width: newWidth,
        height: newHeight,
      },
      "*", // Replace '*' with iframe's domain for security
    );
  }
}

window.addEventListener("resize", sendSizeToIframe);

window.addEventListener(
  "message",
  function (event) {
    // Optionally, check event.origin for security
    if (event.data.type === "requestViewportSize") {
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      event.source.postMessage(
        {
          type: "sizeChange",
          height: viewportHeight,
          width: viewportWidth,
        },
        event.origin,
      );
    } else if (event.data.width && event.data.height) {
      const iframe = document.getElementById("chatmate-chatbot-widget-iframe");
      if (iframe) {
        iframe.style.width = event.data.width + "px";
        iframe.style.height = event.data.height + "px";
        iframe.style.bottom = event.data.bottom + "px";
        iframe.style.right = event.data.right + "px";
      }
    }
  },
  false,
);
