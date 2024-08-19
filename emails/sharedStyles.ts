export const sharedStyles = {
  main: {
    backgroundColor: "#ffffff",
    fontFamily:
      '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
  },
  container: {
    margin: "0 auto",
    padding: "20px 20px 48px",
    maxWidth: "560px",
  },
  logo: {
    width: "42px",
    height: "42px",
    margin: "0 0 24px 0",
  },
  heading: {
    fontSize: "24px",
    letterSpacing: "-0.5px",
    lineHeight: "1.3",
    fontWeight: "400",
    color: "#484848",
    padding: "17px 0 0",
  },
  paragraph: {
    margin: "0 0 15px",
    fontSize: "15px",
    lineHeight: "1.4",
    color: "#3c4149",
  },
  codeContainer: {
    marginTop: "32px",
    marginBottom: "32px",
  },
  code: {
    fontFamily: "monospace",
    fontWeight: "700",
    padding: "1px 4px",
    backgroundColor: "#f4f4f4",
    letterSpacing: "-0.3px",
    fontSize: "21px",
    borderRadius: "4px",
    color: "#3c4149",
  },
  buttonContainer: {
    padding: "27px 0 27px",
  },
  button: {
    backgroundColor: "#f97316",
    borderRadius: "4px",
    fontWeight: "600",
    color: "#fff",
    fontSize: "16px",
    textDecoration: "none",
    textAlign: "center" as const,
    display: "block",
    padding: "14px 23px",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
  },
  footer: {
    marginTop: "32px",
    textAlign: "center" as const,
  },
  footerLink: {
    fontSize: "14px",
    color: "#f97316",
  },
  hr: {
    borderColor: "#dfe1e4",
    margin: "42px 0 26px",
  },

  // New Chat styles
  userInfoContainer: {
    backgroundColor: "#f0f0f0",
    borderRadius: "8px",
    padding: "16px",
    marginBottom: "24px",
  },
  userInfoItem: {
    fontSize: "14px",
    color: "#555",
    marginBottom: "8px",
  },
  chatContainer: {
    border: "1px solid #e0e0e0",
    borderRadius: "8px",
    padding: "16px",
    marginBottom: "24px",
  },
  messageContainer: {
    marginBottom: "12px",
  },
  messageUser: {
    backgroundColor: "#f0f0f0",
    borderRadius: "8px 8px 8px 0",
    padding: "8px 12px",
    marginLeft: "0",
    marginRight: "20%",
  },
  messageAssistant: {
    backgroundColor: "#e8f5e9",
    borderRadius: "8px 8px 0 8px",
    padding: "8px 12px",
    marginLeft: "20%",
    marginRight: "0",
  },
  messageTimestamp: {
    fontSize: "12px",
    color: "#888",
    marginTop: "4px",
  },
};
