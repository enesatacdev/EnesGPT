import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import NewPrompt from "../../components/newPrompt/NewPrompt";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { sendPromptStream } from "../../lib/gemini";
import "./chatpage.css";

function LoadingDots() {
  return <span className="loading-dots">...</span>;
}

const ChatPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { getToken } = useAuth();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [streamingText, setStreamingText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const streamingTimeout = useRef();

  // initialQuestionIsAnswered sadece ilk AI otomatik başlatmayı kontrol için
  const initialQuestionIsAnswered =
    location.state && location.state.initialQuestionIsAnswered === true;
  const [aiStarted, setAiStarted] = useState(false);

  // AI yanıtı ve mesaj işle
  const handleNewMessage = useCallback(
    async (userText, imageData = null, isInitial = false) => {
      const token = await getToken();

      setMessages((prev) =>
        isInitial
          ? [prev[0], { role: "ai", text: "" }]
          : [
              ...prev,
              { role: "user", text: userText },
              { role: "ai", text: "" },
            ]
      );
      setStreamingText("");
      setIsStreaming(true);

      let streamed = "";
      let lastStreamed = "";
      let queue = [];
      let isStreamActive = true;

      await sendPromptStream(userText, imageData, (currentText) => {
        if (currentText.length > lastStreamed.length) {
          const diff = currentText.slice(lastStreamed.length);
          queue.push(...diff.split(""));
          lastStreamed = currentText;
        }
      });

      function processQueue() {
        if (queue.length > 0) {
          streamed += queue.shift();
          setStreamingText(streamed);
          streamingTimeout.current = setTimeout(processQueue, 14);
        } else if (isStreamActive) {
          streamingTimeout.current = setTimeout(processQueue, 14);
        } else {
          setIsStreaming(false);
          setStreamingText("");
          setMessages((prev) => {
            const updated = [...prev];
            const lastIndex = updated.findLastIndex((msg) => msg.role === "ai");
            if (lastIndex !== -1)
              updated[lastIndex] = { ...updated[lastIndex], text: streamed };
            return updated;
          });

          // Mesajı DB'ye kaydet
          fetch(`${import.meta.env.VITE_API_URL}/api/chats/${id}`, {
            method: "PUT",
            credentials: "include",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              question: userText,
              answer: streamed,
              img: imageData?.dbData?.filePath || null,
            }),
          });
        }
      }

      processQueue();
      isStreamActive = false;
    },
    [getToken, id]
  );

  // Chat geçmişini yükle
  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    const loadChat = async () => {
      try {
        const token = await getToken();
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/chats/${id}`,
          {
            credentials: "include",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (!response.ok) throw new Error();
        const chat = await response.json();
        setMessages(
          chat.history.map((item) => ({
            role: item.role === "user" ? "user" : "ai",
            text: item.parts[0].text,
            img: item.img || null,
          }))
        );
      } catch {
        setError("Failed to load chat history");
      } finally {
        setLoading(false);
        setStreamingText("");
        setIsStreaming(false);
        setAiStarted(false);
      }
    };
    loadChat();
  }, [id, getToken]);

  // Sadece ilk mesajda AI'ı otomatik başlat (ve sadece bir kez tetiklenir)
  useEffect(() => {
    if (
      !loading &&
      messages.length === 1 &&
      messages[0]?.role === "user" &&
      !initialQuestionIsAnswered &&
      !aiStarted
    ) {
      setAiStarted(true);
      handleNewMessage(messages[0].text, null, true);
      // State'i güncelle ki tekrar AI çalışmasın
      navigate(location.pathname, {
        replace: true,
        state: { initialQuestionIsAnswered: true },
      });
    }
    // eslint-disable-next-line
  }, [
    loading,
    messages.length,
    messages[0]?.role,
    initialQuestionIsAnswered,
    aiStarted,
    handleNewMessage,
    navigate,
    location.pathname,
  ]);

  useEffect(() => {
    return () => {
      if (streamingTimeout.current) clearTimeout(streamingTimeout.current);
    };
  }, []);

  if (loading)
    return (
      <div className="chatPage">
        <div className="wrapper">
          <div className="chat">
            <div className="message ai">
              <LoadingDots />
            </div>
          </div>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="chatPage">
        <div className="wrapper">
          <div className="chat">
            <div className="message ai">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );

  return (
    <div className="chatPage">
      <div className="wrapper">
        <div className="chat">
          {messages.map((msg, i) => (
            <div key={i} className={`message ${msg.role}`}>
              {msg.img && (
                <img src={msg.img} alt="" className="message-image" />
              )}
              {msg.role === "ai" && i === messages.length - 1 && isStreaming ? (
                <ReactMarkdown
                  components={{
                    code({ inline, className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || "");
                      return !inline ? (
                        <SyntaxHighlighter
                          style={vscDarkPlus}
                          language={match ? match[1] : "plaintext"}
                          PreTag="div"
                          showLineNumbers
                          customStyle={{
                            borderRadius: "8px",
                            fontSize: "1em",
                            padding: "18px",
                            margin: "12px 0",
                            background: "#181825",
                          }}
                        >
                          {String(children).replace(/\n$/, "")}
                        </SyntaxHighlighter>
                      ) : (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      );
                    },
                  }}
                >
                  {streamingText}
                </ReactMarkdown>
              ) : msg.role === "ai" ? (
                <ReactMarkdown
                  components={{
                    code({ inline, className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || "");
                      return !inline ? (
                        <SyntaxHighlighter
                          style={vscDarkPlus}
                          language={match ? match[1] : "plaintext"}
                          PreTag="div"
                          showLineNumbers
                          customStyle={{
                            borderRadius: "8px",
                            fontSize: "1em",
                            padding: "18px",
                            margin: "12px 0",
                            background: "#181825",
                          }}
                        >
                          {String(children).replace(/\n$/, "")}
                        </SyntaxHighlighter>
                      ) : (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      );
                    },
                  }}
                >
                  {msg.text}
                </ReactMarkdown>
              ) : (
                msg.text
              )}
            </div>
          ))}
          <NewPrompt onSend={handleNewMessage} />
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
