import React, { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";

const OrderMessaging = ({
  orderId,
  fetchMessages, // async function to fetch messages
  sendMessage,   // async function to send a message
  disabled,
  initialMessages = [],
}) => {
  const [messages, setMessages] = useState(initialMessages);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const intervalRef = useRef();
  const messagesScrollRef = useRef(null);

  // Poll for messages every 30s
  useEffect(() => {
    const poll = async () => {
      const msgs = await fetchMessages();
      setMessages(msgs);
    };
    poll();
    intervalRef.current = setInterval(poll, 30000);
    return () => clearInterval(intervalRef.current);
  }, [orderId, fetchMessages]);

  // Send message and fetch fresh messages
  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;
    setSending(true);
    await sendMessage(newMessage.trim());
    setNewMessage("");
    const msgs = await fetchMessages();
    setMessages(msgs);
    setSending(false);
  };

  return (
    <div className="p-4 mt-8 border rounded bg-white shadow-sm">
        <h1 className="text-lg font-semibold mb-4">
          Order Messages
        </h1>
      <div className="space-y-2 max-h-60 overflow-y-auto mb-2 relative" ref={messagesScrollRef}>
        {messages.length > 0 ? (
          messages.map((message, idx) => (
            <div
              key={idx}
              className={`p-3 rounded text-sm ${
                message.from === "admin"
                  ? "bg-blue-50 border-l-4 border-blue-400 ml-4"
                  : "bg-gray-50 border-l-4 border-gray-400 mr-4"
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="font-medium">
                  {message.from === "admin" ? "Support Team" : "You"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(message.timestamp).toLocaleString()}
                </span>
              </div>
              <p>{message.message}</p>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No messages yet. Send a message to our team if you have any questions.
          </p>
        )}
        {/* Scroll buttons */}
        {/* <div className="absolute bottom-2 right-2 flex flex-col gap-2 z-10">
          <Button
            size="icon"
            className="bg-white/80 border shadow h-7 w-7 p-0 flex items-center justify-center"
            onClick={() => {
              
                messagesScrollRef.current.scrollBy({ top: -100, behavior: 'smooth' });
              
            }}
            aria-label="Scroll up"
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 15l6-6 6 6"/></svg>
          </Button>
          <Button
            size="icon"
            className="bg-white/80 border shadow h-7 w-7 p-0 flex items-center justify-center"
            onClick={() => {
                messagesScrollRef.current.scrollBy({ top: 100, behavior: 'smooth' });
              
            }}
            aria-label="Scroll down"
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 9l-6 6-6-6"/></svg>
          </Button>
        </div> */}
      </div>
      {!disabled && (
        <div className="space-y-2">
          <label className="block font-medium">Send a message:</label>
          <div className="flex space-x-2">
            <Textarea
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              rows={2}
              className="flex-1"
            />
            <Button
              onClick={handleSend}
              disabled={!newMessage.trim() || sending}
              size="sm"
            >
              {sending ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderMessaging;