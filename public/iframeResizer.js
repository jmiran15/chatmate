window.addEventListener(
  "message",
  function (event) {
    // Optionally, check event.origin for security
    if (event.data.type === "requestViewportHeight") {
      const viewportHeight = window.innerHeight;
      event.source.postMessage(
        { type: "viewportHeight", height: viewportHeight },
        event.origin,
      );
    } else if (event.data.width && event.data.height) {
      const iframe = document.getElementById("chatmate-chatbot-widget-iframe");
      if (iframe) {
        iframe.style.width = event.data.width + "px";
        iframe.style.height = event.data.height + "px";
      }
    }
  },
  false,
);
