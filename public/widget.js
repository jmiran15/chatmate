(async function () {
  let scriptTag = document.currentScript;
  if (!scriptTag) {
    let scripts = document.getElementsByTagName("script");
    scriptTag = scripts[scripts.length - 1];
  }

  let chatbotId = scriptTag.getAttribute("data-chatbotid");

  const chatbotResponse = await fetch(`/api/chatbot/${chatbotId}`, {
    method: "GET",
  });
  const chatbot = await chatbotResponse.json();

  const primaryColor = chatbot.color || "#FF5733"; // Default color if not set
  const publicName = chatbot.publicName || "Your Chatbot"; // Default name if not set

  let chatId = null;

  document.head.insertAdjacentHTML(
    "beforeend",
    '<link href="https://cdnjs.cloudflare.com/ajax/libs/tailwindcss/2.2.16/tailwind.min.css" rel="stylesheet">',
  );

  // Inject the CSS
  const style = document.createElement("style");
  style.innerHTML = `

    #chat-widget-container {
      position: fixed;
      bottom: 20px;
      right: 20px;
      flex-direction: column;
    }
    #chat-popup {
      height: 70vh;
      max-height: 70vh;
      transition: all 0.3s;
      overflow: hidden;
    }
    @media (max-width: 768px) {
      #chat-popup {
        position: fixed;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 100%;
        max-height: 100%;
        border-radius: 0;
      }
    }

    /* Setting primary color */
    #chat-bubble, #chat-submit {
      background-color: ${primaryColor};
    }
    #chat-header {
      background-color: ${primaryColor};
    }
    `;

  document.head.appendChild(style);

  // Create chat widget container
  const chatWidgetContainer = document.createElement("div");
  chatWidgetContainer.id = "chat-widget-container";
  document.body.appendChild(chatWidgetContainer);

  // Inject the HTML
  chatWidgetContainer.innerHTML = `
      <div id="chat-bubble" class="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center cursor-pointer text-3xl">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </div>
      <div id="chat-popup" class="hidden absolute bottom-20 right-0 w-96 bg-white rounded-md shadow-md flex flex-col transition-all text-sm">
        <div id="chat-header" class="flex justify-between items-center p-4 bg-gray-800 text-white rounded-t-md">
          <h3 class="m-0 text-lg">${publicName}</h3>
          <button id="close-popup" class="bg-transparent border-none text-white cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div id="chat-messages" class="flex-1 p-4 overflow-y-auto"></div>
        <div id="chat-input-container" class="p-4 border-t border-gray-200">
          <div class="flex space-x-4 items-center">
            <input type="text" id="chat-input" class="flex-1 border border-gray-300 rounded-md px-4 py-2 outline-none w-3/4" placeholder="Type your message...">
            <button id="chat-submit" class="bg-gray-800 text-white rounded-md px-4 py-2 cursor-pointer">Send</button>
          </div>
          <div class="flex text-center text-xs pt-4">
            <span class="flex-1">Powered by <a href="https://chatmate.fly.dev/" target="_blank" class="text-indigo-600">Chatmate</a></span>
          </div>
        </div>
      </div>
    `;

  // Add event listeners
  const chatInput = document.getElementById("chat-input");
  const chatSubmit = document.getElementById("chat-submit");
  const chatMessages = document.getElementById("chat-messages");
  const chatBubble = document.getElementById("chat-bubble");
  const closePopup = document.getElementById("close-popup");

  let messages = [];

  chatbot.introMessages.forEach((message) => {
    messages.push({ role: "assistant", content: message });
    reply(message);
  });

  chatSubmit.addEventListener("click", function () {
    const message = chatInput.value.trim();
    if (!message) return;

    chatMessages.scrollTop = chatMessages.scrollHeight;

    chatInput.value = "";

    onUserRequest(message);
  });

  chatInput.addEventListener("keyup", function (event) {
    if (event.key === "Enter") {
      chatSubmit.click();
    }
  });

  chatBubble.addEventListener("click", function () {
    togglePopup();
  });

  closePopup.addEventListener("click", function () {
    togglePopup();
  });

  function togglePopup() {
    const chatPopup = document.getElementById("chat-popup");
    chatPopup.classList.toggle("hidden");
    if (!chatPopup.classList.contains("hidden")) {
      document.getElementById("chat-input").focus();
    }
  }

  function createLoadingMessage() {
    return `
      <div id="loading-assistant" class="flex space-x-2 justify-center items-center bg-gray-200 w-min rounded-lg pb-2 pt-3 px-4 text-sm">
        <div class="h-2 w-2 bg-gray-700 rounded-full animate-bounce" style="animation-delay: -0.3s;"></div>
        <div class="h-2 w-2 bg-gray-700 rounded-full animate-bounce" style="animation-delay: -0.15s;"></div>
        <div class="h-2 w-2 bg-gray-700 rounded-full animate-bounce"></div>
      </div>
    `;
  }

  function onUserRequest(message) {
    messages.push({ role: "user", content: message });

    // Display user message
    const messageElement = document.createElement("div");
    messageElement.className = "flex justify-end mb-3";
    messageElement.innerHTML = `
        <div class="bg-gray-800 text-white rounded-lg py-2 px-4 max-w-[70%]">
          ${message}
        </div>
      `;
    chatMessages.appendChild(messageElement);

    chatMessages.innerHTML += createLoadingMessage();
    chatMessages.scrollTop = chatMessages.scrollHeight;

    const chatFormData = new FormData();
    chatFormData.append(
      "message",
      JSON.stringify({ role: "user", content: message }),
    );
    if (!chatId) {
      fetch(`/api/createchat/${chatbotId}`, {
        method: "POST",
        body: chatFormData,
      })
        .then((response) => response.json())
        .then((data) => {
          chatId = data.chatId;
        })
        .catch((error) => {
          console.log(`Error saving chat to the server: ${error}`);
        });
    } else {
      fetch(`/api/updatechat/${chatId}`, {
        method: "POST",
        body: chatFormData,
      })
        .then((response) => response.json())
        .then((data) => data)
        .catch((error) => {
          console.log(`Error adding new message to chat: ${chatId}: ${error}`);
        });
    }

    chatInput.value = "";

    let formData = new FormData();
    formData.append("messages", JSON.stringify(messages));

    fetch(`/api/chat/${chatbotId}`, {
      method: "POST",
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        const loadingMessage = document.getElementById("loading-assistant");
        if (loadingMessage) {
          loadingMessage.remove();
        }

        const assistantContent = data.message.content;
        messages.push({
          role: "assistant",
          content: assistantContent,
        });
        reply(assistantContent);

        // save the message to the chat
        const assistantFormData = new FormData();
        assistantFormData.append(
          "message",
          JSON.stringify({
            role: "assistant",
            content: assistantContent,
          }),
        );

        fetch(`/api/updatechat/${chatId}`, {
          method: "POST",
          body: assistantFormData,
        })
          .then((response) => response.json())
          .then((data) => data)
          .catch((error) => {
            console.log(
              `Error adding new message to chat: ${chatId}: ${error}`,
            );
          });
      })
      .catch((error) => {
        const loadingMessage = document.getElementById("loading-assistant");
        if (loadingMessage) {
          loadingMessage.remove();
        }

        messages.push({
          role: "assistant",
          content: `Sorry, there was an error processing your request. ${error}`,
        });
        reply(`Sorry, there was an error processing your request. ${error}`);
      });
  }

  function reply(message) {
    const chatMessages = document.getElementById("chat-messages");
    const replyElement = document.createElement("div");
    replyElement.className = "flex mb-3";
    replyElement.innerHTML = `
        <div class="bg-gray-200 text-black rounded-lg py-2 px-4 max-w-[70%]">
          ${message}
        </div>
      `;
    chatMessages.appendChild(replyElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
})();
