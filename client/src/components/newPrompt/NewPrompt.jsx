import { useState, useRef, useEffect } from "react";
import Upload from "../upload/Upload";
import "./newPrompt.css";

const NewPrompt = ({ onSend }) => {
  const [img, setImg] = useState({
    isLoading: false,
    error: "",
    dbData: {},
    aiData: null,
  });
  const [input, setInput] = useState("");
  const endRef = useRef(null);

  useEffect(() => {
    if (endRef.current) endRef.current.scrollIntoView({ behavior: "smooth" });
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      onSend(input, img); // Sadece input ve img’i ChatPage’e gönderiyoruz
      setInput("");
      setImg({ ...img, aiData: null });
    }
  };

  return (
    <>
      {img.isLoading && (
        <div className="loading">
          <span>Loading...</span>
        </div>
      )}
      {/* Opsiyonel: yüklenen görselin önizlemesi */}
      <div className="endChat" ref={endRef}></div>
      <form className="newForm" onSubmit={handleSubmit}>
        <Upload setImg={setImg} />
        <input id="file" type="file" multiple={false} hidden />
        <input
          type="text"
          name="text"
          placeholder="Ask anything..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit">
          <img src="/arrow.png" alt="" />
        </button>
      </form>
    </>
  );
};

export default NewPrompt;
