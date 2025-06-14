"use client";

import { useChat } from "@ai-sdk/react";
import Markdown from "react-markdown";
import { motion } from "framer-motion";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { MessageCircle, Send, Bot, User, Sparkles } from "lucide-react";
import { cn } from "~/lib/utils";


const CONVEX_SITE_URL = import.meta.env.VITE_CONVEX_URL!.replace(
  /.cloud$/,
  ".site"
);

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat({
      maxSteps: 10,
      api: `${CONVEX_SITE_URL}/api/chat`,
    });

  return (
    <div className="p-4 sm:p-6 space-y-6 sm:space-y-8 min-h-screen bg-gradient-to-br from-background via-background to-background/50">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <h1 className="text-3xl font-bold text-foreground mb-2 glow-text flex items-center justify-center gap-3">
          <MessageCircle className="h-8 w-8 text-primary" />
          AI Assistant
        </h1>
        <p className="text-muted-foreground">
          Ask questions about your business data and get intelligent insights
        </p>
        <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 mt-3">
          <Sparkles className="h-3 w-3 mr-1" />
          Powered by AI
        </Badge>
      </motion.div>

      {/* Chat Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="max-w-4xl mx-auto"
      >
        <Card className="glow-card card-shadow border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm min-h-[600px] flex flex-col">
          <CardHeader className="border-b border-border/50">
            <CardTitle className="text-foreground flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              Chat Session
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Start a conversation with your AI assistant
            </CardDescription>
          </CardHeader>
          
          {/* Messages Area */}
          <CardContent className="flex-1 p-6 overflow-y-auto max-h-[400px]">
            <div className="space-y-4">
              {messages.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className="text-center py-12"
                >
                  <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center mb-4">
                    <MessageCircle className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Start a conversation</h3>
                  <p className="text-muted-foreground text-sm max-w-md mx-auto">
                    Ask me anything about your business data, sales performance, inventory levels, or general business questions.
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center mt-6">
                    <Badge variant="outline" className="text-xs">Sales Analysis</Badge>
                    <Badge variant="outline" className="text-xs">Inventory Help</Badge>
                    <Badge variant="outline" className="text-xs">Performance Insights</Badge>
                    <Badge variant="outline" className="text-xs">Business Advice</Badge>
                  </div>
                </motion.div>
              ) : (
                messages.map((message, i) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1, duration: 0.3 }}
                    className={cn(
                      "flex",
                      message.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    <div className="flex items-start gap-3 max-w-[80%]">
                      {message.role === "assistant" && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0">
                          <Bot className="h-4 w-4 text-primary" />
                        </div>
                      )}
                      <div
                        className={cn(
                          "px-4 py-3 rounded-2xl shadow-sm border",
                          message.role === "user"
                            ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-primary/20 rounded-br-sm"
                            : "bg-gradient-to-br from-card to-card/50 text-foreground border-border/50 rounded-bl-sm backdrop-blur-sm"
                        )}
                      >
                        {message.parts.map((part) => {
                          switch (part.type) {
                            case "text":
                              return (
                                <div
                                  key={`${message.id}-${i}`}
                                  className="prose prose-sm max-w-none prose-p:my-1 prose-li:my-0.5 prose-ul:my-1 prose-ol:my-1 prose-headings:text-foreground prose-p:text-current prose-li:text-current prose-strong:text-current"
                                >
                                  <Markdown>{part.text}</Markdown>
                                </div>
                              );
                            default:
                              return null;
                          }
                        })}
                      </div>
                      {message.role === "user" && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center flex-shrink-0">
                          <User className="h-4 w-4 text-accent" />
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                    <div className="px-4 py-3 rounded-2xl rounded-bl-sm bg-gradient-to-br from-card to-card/50 border border-border/50 backdrop-blur-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                        </div>
                        <span className="text-sm">Thinking...</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </CardContent>

          {/* Input Area */}
          <div className="border-t border-border/50 p-4">
            <form onSubmit={handleSubmit} className="flex gap-3 items-end">
              <div className="flex-1">
                <Input
                  className="min-h-[44px] resize-none border-border/50 bg-background/50 backdrop-blur-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-primary/20"
                  value={input}
                  placeholder="Ask about your business data, sales trends, inventory levels..."
                  onChange={handleInputChange}
                  disabled={isLoading}
                />
              </div>
              <Button 
                type="submit" 
                disabled={isLoading || !input.trim()}
                className="min-h-[44px] px-6 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 transition-all duration-200 shadow-lg shadow-primary/25"
              >
                <Send className="h-4 w-4 mr-2" />
                Send
              </Button>
            </form>
            <p className="text-xs text-muted-foreground/70 mt-2">
              AI can make mistakes. Verify important information.
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
