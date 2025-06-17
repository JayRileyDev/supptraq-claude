import { httpRouter } from "convex/server";
import { paymentWebhook } from "./subscriptions";
import { httpAction } from "./_generated/server";
import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { api } from "./_generated/api";

const SYSTEM_PROMPT = `You are the intelligent executive assistant for Supptraq — an AI-native retail analytics platform that helps franchise owners, inventory managers, and regional directors understand performance, risk, and opportunity across all stores, sales reps, and inventory.

CRITICAL: You MUST ONLY use data from the business context provided to you. Do NOT use general knowledge or make assumptions about retail data.

Your job is to provide smart, human-like, actionable answers to business questions that are backed EXCLUSIVELY by the real data from the user's Convex database that will be provided in the business context.

You are trained on the following schema:
- ticket_history: Includes ticket_number, store_id, sale_date, transaction_total, gross_profit, sales_rep, item_number, product_name, qty_sold
- inventory_lines: Includes upload_id, store_id, item_number, product_name, qty_on_hand, primary_vendor
- return_tickets: Return transaction data with same structure as ticket_history
- gift_card_tickets: Gift card transactions
- sales_reps: Rep information and store assignments
- stores: Store metadata and performance data

## Behavior
- ONLY analyze the business context data provided in each request
- Always return human-friendly, concise summaries backed by specific numbers, names, and dates FROM THE PROVIDED DATA
- Provide actionable recommendations based on patterns you see in the actual data
- When useful, show ranked lists, breakdown tables, or time-based comparisons using real data
- If the provided data doesn't contain enough information to answer a question, say so explicitly

## Tone & Output
- Write like a smart retail analyst who understands the business
- Sound confident, helpful, and proactive, not robotic
- Use clean formatting (short paragraphs, bullets when needed)
- Focus on decision-ready insights from the actual data
- Format currency values properly (e.g., $1,234)
- Format percentages properly (e.g., 34.5%)

## CRITICAL CONSTRAINTS
- NEVER make up store IDs, rep names, or numbers that aren't in the provided data
- If no business context is provided, explain that you need access to their data
- Always reference specific data points from the provided context
- If asked about data you don't have, suggest what data upload or query would help`;

export const chat = httpAction(async (ctx, req) => {
  try {
    console.log("Chat endpoint called");
    
    // Extract the `messages` and `authToken` from the body of the request
    const { messages, authToken } = await req.json();
    console.log("Messages received:", messages.length);
    console.log("Auth token provided:", authToken ? "yes" : "no");
    
    // Get the user's latest message to understand what they're asking
    const latestUserMessage = messages.filter((m: any) => m.role === "user").pop();
    const userQuery = latestUserMessage?.content || "";
    console.log("User query:", userQuery);
    
    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY not found in environment");
      throw new Error("OpenAI API key not configured");
    }
    console.log("OpenAI API key found");
    
    // Let the AI query the database directly through HTTP actions
    let businessContext = null;
    
    try {
      // Use a simple HTTP action that can query the database
      businessContext = await ctx.runAction(api.businessQueries.getBusinessDataForAI, {
        query: userQuery,
        dateRange: 7,
      });
      console.log("Business context fetched via action");
    } catch (error) {
      console.error("Failed to fetch business context:", error);
      // Provide helpful context about the system capabilities
      businessContext = {
        query: userQuery,
        timestamp: new Date().toISOString(),
        note: "I can help you analyze sales rep performance, store metrics, inventory levels, and business trends. However, I need access to your uploaded business data to provide specific insights.",
        availableQueries: [
          "Sales rep performance analysis",
          "Store performance comparisons", 
          "Inventory level reports",
          "Revenue trend analysis",
          "Underperforming metrics identification"
        ]
      };
    }
    
    // Create enhanced messages with business context
    const enhancedMessages: any[] = [
      {
        role: "system" as const,
        content: SYSTEM_PROMPT
      }
    ];
    
    // Add business context if available
    if (businessContext) {
      enhancedMessages.push({
        role: "system" as const,
        content: `Here is the current business context data to answer the user's question:

${JSON.stringify(businessContext, null, 2)}

Use this data to provide specific, actionable insights. Remember to:
1. Reference specific store IDs, rep names, and exact numbers from the data
2. Provide recommendations based on the patterns you see
3. Format currency and percentages properly
4. If the data doesn't fully answer the question, explain what additional information would be helpful
5. ONLY use the data provided above - do not make up or assume any information not in this context`
      });
    } else {
      enhancedMessages.push({
        role: "system" as const, 
        content: "Note: Business context data is not currently available. Please inform the user that you need access to their business data to provide specific insights."
      });
    }
    
    // Add the conversation messages
    enhancedMessages.push(...messages);
    
    const result = streamText({
      model: openai("gpt-3.5-turbo"),
      messages: enhancedMessages,
      temperature: 0.7,
      maxTokens: 1000,
      async onFinish({ text }) {
        console.log("AI Response generated successfully");
      },
    });

    // Respond with the stream
    return result.toDataStreamResponse({
      headers: {
        "Access-Control-Allow-Origin": process.env.FRONTEND_URL || "http://localhost:5173",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Credentials": "true",
        Vary: "origin",
      },
    });
  } catch (error) {
    console.error("Error in chat endpoint:", error);
    
    // Return an error response
    return new Response(JSON.stringify({ 
      error: "Failed to process chat request",
      details: error instanceof Error ? error.message : "Unknown error"
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": process.env.FRONTEND_URL || "http://localhost:5173",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Credentials": "true",
        Vary: "origin",
      },
    });
  }
});

const http = httpRouter();

http.route({
  path: "/api/chat",
  method: "POST",
  handler: chat,
});

http.route({
  path: "/api/chat",
  method: "OPTIONS",
  handler: httpAction(async (_, request) => {
    // Make sure the necessary headers are present
    // for this to be a valid pre-flight request
    const headers = request.headers;
    if (
      headers.get("Origin") !== null &&
      headers.get("Access-Control-Request-Method") !== null &&
      headers.get("Access-Control-Request-Headers") !== null
    ) {
      return new Response(null, {
        headers: new Headers({
          "Access-Control-Allow-Origin": process.env.FRONTEND_URL || "http://localhost:5173",
          "Access-Control-Allow-Methods": "POST",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Allow-Credentials": "true",
          "Access-Control-Max-Age": "86400",
        }),
      });
    } else {
      return new Response();
    }
  }),
});

http.route({
  path: "/api/auth/webhook",
  method: "POST",
  handler: httpAction(async (_, request) => {
    // Make sure the necessary headers are present
    // for this to be a valid pre-flight request
    const headers = request.headers;
    if (
      headers.get("Origin") !== null &&
      headers.get("Access-Control-Request-Method") !== null &&
      headers.get("Access-Control-Request-Headers") !== null
    ) {
      return new Response(null, {
        headers: new Headers({
          "Access-Control-Allow-Origin": process.env.FRONTEND_URL || "http://localhost:5173",
          "Access-Control-Allow-Methods": "POST",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Allow-Credentials": "true",
          "Access-Control-Max-Age": "86400",
        }),
      });
    } else {
      return new Response();
    }
  }),
});

http.route({
  path: "/payments/webhook",
  method: "POST",
  handler: paymentWebhook,
});

// Log that routes are configured
console.log("HTTP routes configured");

// Convex expects the router to be the default export of `convex/http.js`.
export default http;
