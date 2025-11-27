"use client";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect, useRef } from "react";
import { Input } from "../ui/input";
import Loadingsvg from "../../../public/loading";
import { toast } from "@/components/ui/use-toast";

interface MessageProps {
  type: string;
  text: string;
  avatarFallback: string;
}

export function ChatWithAI() {
  const [Loading, setLoading] = useState(false);
  const [typing, setTyping] = useState(false); // ✅ new typing flag
  const [messages, setMessages] = useState<MessageProps[]>([]);
  const [promptValue, setPromptValue] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const copyTextToClipboard = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        toast({
          title: "Text copied to clipboard",
          description: "The AI response has been copied to your clipboard.",
        });
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err);
      });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typing]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPromptValue(e.target.value);
  };

  const handleClick = () => {
    if (promptValue.trim() === "") return;

    // Add user message to chat
    setMessages((prevMessages) => [
      ...prevMessages,
      {
        type: "user",
        text: promptValue,
        avatarFallback: "YO",
      },
    ]);

    // Preserve current prompt before clearing
    const currentPrompt = promptValue;

    // Set loading + typing states
    setLoading(true);
    setTyping(true);
    setPromptValue("");

    // Fire AI
    generateAiAnswer(currentPrompt);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleClick();
    }
  };

  const generateAiAnswer = async (prompt: string) => {
    try {
      const response = await fetch("/api/Bard", {
        method: "POST",
        body: JSON.stringify({ question: prompt }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      // If the API route returns an error (status 4xx/5xx)
      if (!response.ok) {
        let errorMessage = "Failed to get AI response";
        try {
          const errorBody = await response.json();
          if (errorBody?.text) {
            errorMessage = errorBody.text;
          }
        } catch {
          // ignore JSON parse errors
        }

        toast({
          title: "AI error",
          description: errorMessage,
          variant: "destructive",
        });

        return;
      }

      const aiAnswer = await response.json();

      setMessages((prevMessages) => [
        ...prevMessages,
        {
          type: "bot",
          text: aiAnswer.text,
          avatarFallback: "OA",
        },
      ]);
    } catch (error) {
      console.error("Chat AI error:", error);
      toast({
        title: "Network error",
        description: "Something went wrong talking to the AI.",
        variant: "destructive",
      });
    } finally {
      // ✅ Always clear loading & typing flags
      setLoading(false);
      setTyping(false);
    }
  };

  return (
    <div className="flex h-[90%] w-full max-w-5xl flex-col rounded-2xl bg-gray-900 text-black shadow-lg sm:h-[95%]">
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex items-start gap-3 ${
              message.type === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {message.type === "bot" && (
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src="/placeholder-user.jpg" />
                <AvatarFallback>{message.avatarFallback}</AvatarFallback>
              </Avatar>
            )}
            <div
              className={`max-w-[90%] min-w-[40%] rounded-2xl p-3 sm:max-w-[80%] ${
                message.type === "user"
                  ? "bg-[#030014] text-[#CAC2FF]"
                  : "bg-[#030014] text-[#CAC2FF]"
              }`}
            >
              <div className="text-sm font-medium">
                {message.type === "user" ? "You" : "ChatBot"}
              </div>
              <div className="text-sm">{message.text}</div>
              <div className="mt-2 flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyTextToClipboard(message.text)}
                  className="h-4 w-4 text-gray-400 hover:bg-transparent hover:text-gray-100"
                >
                  <ClipboardIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {message.type === "user" && (
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src="/placeholder-user.jpg" />
                <AvatarFallback>{message.avatarFallback}</AvatarFallback>
              </Avatar>
            )}
          </div>
        ))}

        {/* ✅ AI "typing..." indicator with bouncing dots */}
        {typing && (
          <div className="flex items-start gap-3 justify-start">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage src="/placeholder-user.jpg" />
              <AvatarFallback>OA</AvatarFallback>
            </Avatar>
            <div className="max-w-[70%] rounded-2xl bg-[#030014] p-3 text-[#CAC2FF]">
              <div className="text-sm font-medium">ChatBot</div>
              <div className="mt-1 flex items-center space-x-2">
                <span className="text-sm text-gray-300">AI is typing</span>
                <span className="flex space-x-1">
                  <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.3s]" />
                  <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.15s]" />
                  <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" />
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="flex items-center gap-2 rounded-b-2xl p-4">
        <Input
          placeholder="Type your message..."
          className="flex-1 resize-none rounded-2xl bg-gray-900 p-3 text-white focus:ring-2 focus:ring-blue-600 focus:ring-opacity-50"
          onChange={handleChange}
          onKeyPress={handleKeyPress}
          value={promptValue}
          disabled={Loading}
        />
        <Button
          type="submit"
          size="icon"
          className="h-8 w-8 bg-blue-600 hover:bg-blue-700"
          onClick={handleClick}
          disabled={Loading}
        >
        <ArrowUpIcon className="h-4 w-4 text-white" />
        </Button>
      </div>
    </div>
  );
}

function ArrowUpIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m5 12 7-7 7 7" />
      <path d="M12 19V5" />
    </svg>
  );
}

function ClipboardIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    </svg>
  );
}
