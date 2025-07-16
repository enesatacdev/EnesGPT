import { useState } from "react";
import "./dashboardpage.css";
import { useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

const DashboardPage = () => {
  const { userId, getToken } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [img, setImg] = useState({ dbData: {}, aiData: null });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const input = e.target.text.value.trim();
    if (!input) return;

    try {
      const token = await getToken();
      if (!token) return;

      const response = await fetch("http://localhost:3000/api/chats", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: input }),
      });

      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      const rawChatId = await response.text();
      const chatId = rawChatId.replace(/"/g, "");

      // Chat list'i invalidate et (react-query cache)
      queryClient.invalidateQueries({ queryKey: ["userChats"] });

      // initialQuestionIsAnswered: false olarak ilet (sadece ilk prompt için)
      navigate(`/dashboard/chats/${chatId}`, {
        state: { initialQuestionIsAnswered: false },
      });

      e.target.text.value = "";
      setImg((prev) => ({ ...prev, aiData: null }));
    } catch (error) {
      // Error UI veya log ekleyebilirsin
    }
  };

  if (!userId) {
    return (
      <div className="dashboardPage">
        <div className="texts">
          <div className="logo">
            <img src="/logo.png" alt="" />
            <h1>Enes GPT</h1>
          </div>
          <p>Please sign in to continue...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboardPage">
      <div className="texts">
        <div className="logo">
          <img src="/logo.png" alt="" />
          <h1>Enes GPT</h1>
        </div>
        <div className="options">
          <div className="option">
            <img src="/chat.png" alt="" />
            <span>Create a New Chat</span>
          </div>
          <div className="option">
            <img src="/image.png" alt="" />
            <span>Analyze Images</span>
          </div>
          <div className="option">
            <img src="/code.png" alt="" />
            <span>Help me with my Code</span>
          </div>
        </div>
      </div>
      <div className="formContainer">
        <form onSubmit={handleSubmit}>
          <input type="text" name="text" placeholder="Ask me anything..." />
          <button type="submit">
            <img src="/arrow.png" alt="" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default DashboardPage;
