import { Link, useLocation, useNavigate } from "react-router-dom";
import "./chatList.css";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const ChatList = () => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();

  const { isPending, error, data } = useQuery({
    queryKey: ["userChats"],
    queryFn: async () => {
      const token = await getToken();
      const response = await fetch(`http://localhost:3000/api/userchats`, {
        credentials: "include",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    retry: 2,
    retryDelay: 1000,
  });

  const deleteMutation = useMutation({
    mutationFn: async (chatId) => {
      const token = await getToken();
      const res = await fetch(`http://localhost:3000/api/chats/${chatId}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!res.ok) throw new Error("Failed to delete chat");
      return { chatId };
    },
    onSuccess: ({ chatId }) => {
      queryClient.invalidateQueries({ queryKey: ["userChats"] });
      // Eğer şu anda silinen chat'in sayfasındaysan, dashboarda yönlendir
      if (location.pathname === `/dashboard/chats/${chatId}`) {
        navigate("/dashboard");
      }
    },
  });

  const handleDelete = (e, chatId) => {
    e.preventDefault();
    deleteMutation.mutate(chatId);
  };

  return (
    <div className="chatList">
      <span className="title">DASHBOARD</span>
      <Link to="/dashboard">Create a new Chat</Link>
      <Link to="/">Explore Enes GPT</Link>
      <Link to="/">Contact</Link>
      <hr />
      <span className="title">RECENT CHATS</span>
      <div className="list">
        {isPending
          ? "Loading..."
          : error
          ? "Something went wrong!"
          : data && data.length > 0
          ? data.map((chat) => (
              <Link to={`/dashboard/chats/${chat._id}`} key={chat._id}>
                {chat.title}
                <span
                  className="deleteChat"
                  onClick={(e) => handleDelete(e, chat._id)}
                  title="Delete chat"
                >
                  x
                </span>
              </Link>
            ))
          : "No chats found"}
      </div>
      <hr />
      <div className="upgrade">
        <img src="/logo.png" alt="" />
        <div className="texts">
          <span>Upgrade EnesGPT Pro</span>
          <span>Get unlimited access to all features</span>
        </div>
      </div>
    </div>
  );
};

export default ChatList;
