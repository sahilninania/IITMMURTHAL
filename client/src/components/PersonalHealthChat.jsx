
import { useEffect, useRef, useState } from "react";
import "./PersonalHealthChat.css";

const API_URL =
  `${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/chat`;

const WELCOME_MESSAGES = {
  patient:
    "Namaste! Main Jeevan Rakshak AI hoon. Aap apni health report aur general health questions simple language mein pooch sakte hain.",
  doctor:
    "Namaste Doctor! Main medical information samajhne, report summaries aur clinical review questions mein assist kar sakta hoon.",
  receptionist:
    "Namaste! Main appointments, registration aur hospital coordination se related general guidance de sakta hoon.",
  hospital:
    "Namaste! Main hospital operations aur administrative coordination mein help kar sakta hoon.",
  admin:
    "Namaste! Main administrative processes aur general hospital guidance mein help kar sakta hoon.",
};

export default function PersonalHealthChat({ role = "patient" }) {
  const normalizedRole = String(role).toLowerCase();

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        WELCOME_MESSAGES[normalizedRole] || WELCOME_MESSAGES.patient,
    },
  ]);

  const [input, setInput] = useState("");
  const [language, setLanguage] = useState("Hinglish");
  const [conversationId, setConversationId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(event) {
    event.preventDefault();

    const message = input.trim();

    if (!message || loading) return;

    if (message.length > 2000) {
      setError("Message 2000 characters se chhota rakho.");
      return;
    }

    // App.jsx stores the login token in sessionStorage.
    const token = sessionStorage.getItem("jr_token");

    if (!token) {
      setError("Session expire ho gaya hai. Dobara login karo.");
      return;
    }

    setError("");
    setInput("");
    setMessages((previous) => [
      ...previous,
      { role: "user", content: message },
    ]);
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message,
          language,
          conversationId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || `Request failed (${response.status})`
        );
      }

      if (typeof data.reply !== "string" || !data.reply.trim()) {
        throw new Error("AI se valid response nahi mila.");
      }

      setConversationId(data.conversationId || null);
      setMessages((previous) => [
        ...previous,
        { role: "assistant", content: data.reply },
      ]);
    } catch (err) {
      setError(
        err.message ||
          "Backend se connection nahi ho pa raha. Server check karo."
      );
    } finally {
      setLoading(false);
    }
  }

  function startNewChat() {
    if (loading) return;

    setConversationId(null);
    setError("");
    setMessages([
      {
        role: "assistant",
        content:
          WELCOME_MESSAGES[normalizedRole] || WELCOME_MESSAGES.patient,
      },
    ]);
    setInput("");
  }

  return (
    <section className="jr-chat">
      <header className="jr-chat-header">
        <div className="jr-chat-avatar" aria-hidden="true">
          ✚
        </div>

        <div className="jr-chat-heading">
          <h2>Jeevan Rakshak AI</h2>
          <p>Personal AI Health Assistant</p>
        </div>

        <button
          type="button"
          className="jr-chat-new"
          onClick={startNewChat}
          disabled={loading}
        >
          New chat
        </button>
      </header>

      <div className="jr-chat-toolbar">
        <span className="jr-chat-role">
          {normalizedRole.charAt(0).toUpperCase() +
            normalizedRole.slice(1)}{" "}
          assistant
        </span>

        <label>
          <span className="jr-sr-only">Response language</span>
          <select
            value={language}
            onChange={(event) => setLanguage(event.target.value)}
            disabled={loading}
          >
            <option value="Hinglish">Hinglish</option>
            <option value="Hindi">Hindi</option>
            <option value="English">English</option>
          </select>
        </label>
      </div>

      <div
        className="jr-chat-messages"
        role="log"
        aria-live="polite"
        aria-label="Chat conversation"
      >
        {messages.map((message, index) => (
          <div
            key={`${index}-${message.role}`}
            className={`jr-chat-row ${
              message.role === "user" ? "jr-chat-user" : "jr-chat-ai"
            }`}
          >
            {message.role === "assistant" && (
              <span className="jr-chat-message-avatar" aria-hidden="true">
                ✚
              </span>
            )}

            <div className="jr-chat-bubble">{message.content}</div>
          </div>
        ))}

        {loading && (
          <div className="jr-chat-typing" role="status">
            <span className="jr-chat-dot" />
            <span className="jr-chat-dot" />
            <span className="jr-chat-dot" />
            <span className="jr-chat-typing-text">AI is thinking...</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {error && (
        <div className="jr-chat-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => setError("")}>
            Dismiss
          </button>
        </div>
      )}

      <form className="jr-chat-form" onSubmit={sendMessage}>
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Apna health-related sawaal likho..."
          aria-label="Type your message"
          maxLength={2000}
          rows={2}
          disabled={loading}
          required
        />

        <button
          type="submit"
          disabled={loading || !input.trim()}
          aria-label="Send message"
        >
          {loading ? "..." : "Send ➤"}
        </button>
      </form>

      <p className="jr-chat-disclaimer">
        AI-generated guidance doctor ke diagnosis ka substitute nahi hai.
        Emergency symptoms mein turant medical help lo.
      </p>
    </section>
  );
}
