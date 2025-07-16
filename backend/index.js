import express from "express";
import ImageKit from "imagekit";
import cors from "cors";
import mongoose from "mongoose";
import Chat from "./models/chat.js";
import UserChats from "./models/userChats.js";
import { ClerkExpressRequireAuth } from "@clerk/clerk-sdk-node";

const port = process.env.PORT || 3000;
const app = express();

// ENV CHECK
if (!process.env.CLERK_SECRET_KEY || !process.env.MONGO) {
  console.error("Missing required environment variables! Please create a .env file with CLERK_SECRET_KEY and MONGO");
  process.exit(1);
}

// MIDDLEWARES
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());

// DB CONNECT
const connect = async () => {
  try {
    await mongoose.connect(process.env.MONGO, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

// IMAGEKIT
const imagekit = new ImageKit({
  urlEndpoint: process.env.IMAGE_KIT_ENDPOINT,
  publicKey: process.env.IMAGE_KIT_PUBLIC_KEY,
  privateKey: process.env.IMAGE_KIT_PRIVATE_KEY,
});

// ROUTES

// ImageKit Auth
app.get("/api/upload", (req, res) => {
  const result = imagekit.getAuthenticationParameters();
  res.send(result);
});

// Create Chat
app.post("/api/chats", ClerkExpressRequireAuth(), async (req, res) => {
  const userId = req.auth?.userId;
  const { text } = req.body;

  if (!userId) return res.status(401).json({ error: "User not authenticated" });
  if (!text) return res.status(400).json({ error: "Text is required" });

  try {
    const newChat = new Chat({
      userId,
      history: [{ role: "user", parts: [{ text }] }],
    });
    const savedChat = await newChat.save();

    const userChats = await UserChats.find({ userId });
    if (!userChats.length) {
      const newUserChats = new UserChats({
        userId,
        chats: [
          {
            _id: savedChat._id,
            title: text.substring(0, 40),
          },
        ],
      });
      await newUserChats.save();
    } else {
      await UserChats.updateOne(
        { userId },
        {
          $push: {
            chats: {
              _id: savedChat._id,
              title: text.substring(0, 40),
            },
          },
        }
      );
    }
    res.status(201).send(savedChat._id);
  } catch (err) {
    res.status(500).json({ error: "Error creating chat!", details: err.message });
  }
});

// Get Chat
app.get("/api/chats/:id", ClerkExpressRequireAuth(), async (req, res) => {
  const userId = req.auth.userId;
  try {
    const chat = await Chat.findOne({ _id: req.params.id, userId });
    res.status(200).send(chat);
  } catch (err) {
    res.status(500).send("Error fetching chat!");
  }
});

// Add Message to Chat
app.put("/api/chats/:id", ClerkExpressRequireAuth(), async (req, res) => {
  const userId = req.auth.userId;
  const { question, answer, img } = req.body;

  // Eğer cevap boşsa veya çok kısa ise reject et (opsiyonel, güvenlik için)
  if (!answer || answer.length < 2) {
    return res.status(400).send("Answer too short or missing!");
  }

  const newItems = [
    ...(question
      ? [{ role: "user", parts: [{ text: question }], ...(img && { img }) }]
      : []),
    { role: "model", parts: [{ text: answer }] },
  ];

  try {
    const updatedChat = await Chat.updateOne(
      { _id: req.params.id, userId },
      {
        $push: {
          history: {
            $each: newItems,
          },
        },
      }
    );
    res.status(200).send(updatedChat);
  } catch (err) {
    res.status(500).send("Error adding conversation!");
  }
});

app.delete("/api/chats/:id", ClerkExpressRequireAuth(), async (req, res) => {
  const userId = req.auth.userId;
  const chatId = req.params.id;
  try {
    // Chat'i sil
    await Chat.deleteOne({ _id: chatId, userId });
    // UserChats içindeki referansı da sil
    await UserChats.updateOne(
      { userId },
      { $pull: { chats: { _id: chatId } } }
    );
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Error deleting chat", details: err.message });
  }
});

// Get User Chats
app.get("/api/userchats", ClerkExpressRequireAuth(), async (req, res) => {
  const userId = req.auth.userId;
  try {
    const userChats = await UserChats.find({ userId });
    if (!userChats.length) return res.status(200).json([]);
    res.status(200).json(userChats[0].chats);
  } catch (err) {
    res.status(500).json({ error: "Error fetching userchats!", details: err.message });
  }
});

// SERVER START
const start = async () => {
  await connect();
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
};

start();