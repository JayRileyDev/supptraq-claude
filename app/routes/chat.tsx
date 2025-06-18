"use client";

import { useChat } from "@ai-sdk/react";
import Markdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { 
  MessageCircle, 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  TrendingUp, 
  Package, 
  Users, 
  AlertTriangle,
  ChartBar,
  BarChart3
} from "lucide-react";
import { cn } from "~/lib/utils";
import { useState, useEffect } from "react";
import { useAuth, useUser } from "@clerk/react-router";
import { PageAccessGuard } from "~/components/access/PageAccessGuard";


const CONVEX_SITE_URL = import.meta.env.VITE_CONVEX_URL!.replace(
  /.cloud$/,
  ".site"
);

const SUGGESTED_PROMPTS = [
  {
    icon: TrendingUp,
    title: "What are the 5 worst-performing stores this week?",
    category: "Performance",
  },
  {
    icon: Users,
    title: "Which sales rep had the lowest average ticket in May?",
    category: "Sales Reps",
  },
  {
    icon: Package,
    title: "What's our total retail value in inventory right now?",
    category: "Inventory",
  },
  {
    icon: AlertTriangle,
    title: "Which items are consistently overstocked across all stores?",
    category: "Inventory",
  },
  {
    icon: ChartBar,
    title: "Who had the most returns last month and why?",
    category: "Returns",
  },
  {
    icon: BarChart3,
    title: "Which stores improved the most compared to last week?",
    category: "Trends",
  },
];

export default function Chat() {
  const { getToken, isSignedIn } = useAuth();
  const { user } = useUser();
  
  useEffect(() => {
    console.log("Chat component loaded - User signed in:", isSignedIn);
    console.log("User info:", user?.emailAddresses?.[0]?.emailAddress);
  }, [isSignedIn, user]);
  
  const { messages, input, handleInputChange, handleSubmit, isLoading, setInput } =
    useChat({
      maxSteps: 10,
      api: `${CONVEX_SITE_URL}/api/chat`,
      fetch: async (url, options) => {
        console.log("🔥 Custom fetch called");
        if (isSignedIn) {
          try {
            const token = await getToken({ template: "convex" });
            console.log("🔑 Got auth token for custom fetch");
            
            // Add the token to the request body
            const body = JSON.parse(options?.body as string || '{}');
            body.authToken = token;
            
            return fetch(url, {
              ...options,
              body: JSON.stringify(body),
            });
          } catch (error) {
            console.error("❌ Failed to get token for custom fetch:", error);
          }
        }
        console.log("⚠️ No auth token available");
        return fetch(url, options);
      },
      onError: (error) => {
        console.error("💥 Chat error:", error);
      },
      onFinish: (message) => {
        console.log("✅ Chat response finished:", message.content.substring(0, 50) + "...");
      },
    });
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);

  const handlePromptClick = (prompt: string) => {
    setInput(prompt);
    setSelectedPrompt(prompt);
    // Auto-submit after a brief delay
    setTimeout(() => {
      const form = document.querySelector('form') as HTMLFormElement;
      if (form) {
        form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      }
    }, 100);
  };

  return (
    <PageAccessGuard pagePath="/chat">
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Bot className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">Executive AI Assistant</h1>
                <p className="text-sm text-muted-foreground">Smart insights for your retail business</p>
              </div>
            </div>
            <Badge variant="outline" className="gap-1">
              <Sparkles className="h-3 w-3" />
              AI-Powered Analytics
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Chat Area */}
          <div className="lg:col-span-3">
            <Card className="h-[calc(100vh-180px)] flex flex-col shadow-sm">
          
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-6">
                <AnimatePresence mode="popLayout">
                  {messages.length === 0 ? (
                    <motion.div
                      key="welcome-screen"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-6"
                    >
                      {/* Welcome Message */}
                      <div className="text-center py-8">
                        <div className="w-20 h-20 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                          <Bot className="h-10 w-10 text-primary" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Welcome to your AI Executive Assistant</h3>
                        <p className="text-muted-foreground max-w-md mx-auto">
                          I understand your business data and can provide intelligent insights about sales performance, inventory management, and operational metrics.
                        </p>
                      </div>

                      {/* Suggested Prompts */}
                      <div className="space-y-3">
                        <p className="text-sm font-medium text-muted-foreground text-center">Try asking:</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {SUGGESTED_PROMPTS.map((prompt, i) => {
                            const Icon = prompt.icon;
                            return (
                              <motion.button
                                key={`prompt-${i}-${prompt.category}`}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                onClick={() => handlePromptClick(prompt.title)}
                                className="group relative p-4 bg-card hover:bg-accent/5 border rounded-lg text-left transition-all hover:shadow-md hover:border-primary/20"
                              >
                                <div className="flex items-start gap-3">
                                  <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                                    <Icon className="h-4 w-4 text-primary" />
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-sm font-medium leading-tight">{prompt.title}</p>
                                    <Badge variant="secondary" className="mt-2 text-xs">
                                      {prompt.category}
                                    </Badge>
                                  </div>
                                </div>
                              </motion.button>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div key="messages-container" className="space-y-4">
                      {messages.map((message, i) => (
                        <motion.div
                          key={`message-${message.id}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                          layout
                          className={cn(
                            "flex",
                            message.role === "user" ? "justify-end" : "justify-start"
                          )}
                        >
                          <div className={cn(
                            "flex items-start gap-3 max-w-[85%]",
                            message.role === "user" ? "flex-row-reverse" : "flex-row"
                          )}>
                            <div className={cn(
                              "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center",
                              message.role === "user" 
                                ? "bg-primary text-primary-foreground" 
                                : "bg-muted"
                            )}>
                              {message.role === "user" ? (
                                <User className="h-4 w-4" />
                              ) : (
                                <Bot className="h-4 w-4" />
                              )}
                            </div>
                            <div
                              className={cn(
                                "px-4 py-3 rounded-lg",
                                message.role === "user"
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted/50 border"
                              )}
                            >
                              {message.parts.map((part, partIndex) => {
                                switch (part.type) {
                                  case "text":
                                    return (
                                      <div
                                        key={`${message.id}-part-${partIndex}`}
                                        className={cn(
                                          "prose prose-sm max-w-none",
                                          message.role === "user" 
                                            ? "prose-invert" 
                                            : "prose-headings:font-semibold prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5 prose-strong:font-semibold prose-strong:text-foreground"
                                        )}
                                      >
                                        <Markdown>{part.text}</Markdown>
                                      </div>
                                    );
                                  default:
                                    return null;
                                }
                              })}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                  {isLoading && (
                    <motion.div
                      key="loading-indicator"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-start"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                          <Bot className="h-4 w-4" />
                        </div>
                        <div className="px-4 py-3 rounded-lg bg-muted/50 border">
                          <div className="flex items-center gap-2">
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                            </div>
                            <span className="text-sm text-muted-foreground">Analyzing your data...</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Input Area */}
              <div className="border-t p-4">
                <form onSubmit={handleSubmit} className="flex gap-3">
                  <Input
                    className="flex-1"
                    value={input}
                    placeholder="Ask about sales performance, inventory levels, or business metrics..."
                    onChange={handleInputChange}
                    disabled={isLoading}
                  />
                  <Button 
                    type="submit" 
                    disabled={isLoading || !input.trim()}
                    size="icon"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
                <p className="text-xs text-muted-foreground mt-2">
                  AI responses are based on your business data. Always verify critical decisions.
                </p>
              </div>
            </Card>
          </div>

          {/* Sidebar with Quick Actions */}
          <div className="lg:col-span-1 space-y-4">
            {/* Quick Insights Card */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Quick Insights
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => handlePromptClick("Show me today's sales summary")}
                  className="w-full text-left text-sm p-2 rounded hover:bg-accent/5 transition-colors"
                >
                  Today's Performance
                </button>
                <button
                  onClick={() => handlePromptClick("What are my top 5 selling items this week?")}
                  className="w-full text-left text-sm p-2 rounded hover:bg-accent/5 transition-colors"
                >
                  Best Sellers
                </button>
                <button
                  onClick={() => handlePromptClick("Which stores need inventory transfers?")}
                  className="w-full text-left text-sm p-2 rounded hover:bg-accent/5 transition-colors"
                >
                  Transfer Suggestions
                </button>
                <button
                  onClick={() => handlePromptClick("Show me underperforming sales reps")}
                  className="w-full text-left text-sm p-2 rounded hover:bg-accent/5 transition-colors"
                >
                  Rep Performance
                </button>
              </div>
            </Card>

            {/* Capabilities Card */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3">What I Can Help With</h3>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <TrendingUp className="h-4 w-4 mt-0.5 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">Sales Analytics</p>
                    <p className="text-xs">Revenue trends, rep performance, store comparisons</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Package className="h-4 w-4 mt-0.5 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">Inventory Management</p>
                    <p className="text-xs">Stock levels, transfer suggestions, reorder alerts</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 mt-0.5 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">Risk Detection</p>
                    <p className="text-xs">Underperformance, anomalies, compliance issues</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <ChartBar className="h-4 w-4 mt-0.5 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">Business Intelligence</p>
                    <p className="text-xs">Actionable insights and recommendations</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
    </PageAccessGuard>
  );
}
