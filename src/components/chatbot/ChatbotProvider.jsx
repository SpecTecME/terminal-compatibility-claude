import React, { createContext, useContext, useState } from 'react';

/**
 * Chatbot Context Provider
 *
 * PURPOSE:
 * This provider makes the application's current context (e.g., which page the
 * user is on) available to the ChatbotWidget. This is a critical piece of the
 * "offline AI" strategy.
 *
 * HOW IT WORKS:
 * - Any page or component can use the `useChatbotContext` hook to set its `pageKey`.
 * - The `ChatbotWidget` consumes this context.
 * - When the user asks a question, the widget passes the `pageKey` to the
 *   `chatbotService`.
 * - The service then uses this key to look up `HelpContextRule` entities,
 *   allowing it to prioritize and rank help intents that are relevant to the
 *   user's current screen.
 *
 * EXAMPLE:
 * - A user is on the `VesselDetail` page.
 * - `VesselDetail.js` sets the context: `setPageKey('VesselDetail')`.
 * - The user opens the chatbot and types "what is IMO?".
 * - The chatbot service receives the input and the `pageKey` 'VesselDetail'.
 * - It finds a `HelpContextRule` linking 'VesselDetail' to the `vessel_imo_explanation` intent.
 * - This intent is ranked higher, and the user gets a relevant answer about IMO numbers.
 *
 * This mechanism allows the chatbot to be context-aware without needing complex
 * screen-reading or AI observation, keeping it simple, fast, and offline.
 */
const ChatbotContext = createContext();

export function useChatbotContext() {
  return useContext(ChatbotContext);
}

export function ChatbotProvider({ children }) {
  const [pageKey, setPageKey] = useState('Global');
  const [entityType, setEntityType] = useState(null);
  const [entityId, setEntityId] = useState(null);

  const setChatbotContext = (context) => {
    setPageKey(context.pageKey || 'Global');
    setEntityType(context.entityType || null);
    setEntityId(context.entityId || null);
  };

  const value = {
    pageKey,
    entityType,
    entityId,
    setChatbotContext,
  };

  return (
    <ChatbotContext.Provider value={value}>{children}</ChatbotContext.Provider>
  );
}