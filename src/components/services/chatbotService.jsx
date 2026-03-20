/**
 * Chatbot Service (Offline, Rule-Based)
 *
 * PURPOSE:
 * Core logic for the embedded support chatbot. This service is designed to be
 * entirely self-contained within the application, using only database content
 * to provide answers. It does NOT make any external API calls.
 *
 * DESIGN PRINCIPLE - OFFLINE FIRST & EXPORTABLE:
 * This entire system is built to work offline and be exportable with the Base44
 * project. There are no dependencies on external AI services (like OpenAI, Anthropic, etc.).
 * The "intelligence" is derived from a structured data model (Intents, Aliases,
 * Context Rules) stored in the application's own database. This ensures that all
 * support logic and content are part of the project's source code and data,
 * making it maintainable and independent of third-party services.
 *
 * ---
 *
 * HOW IT WORKS (RULE-BASED INTENT MATCHING):
 *
 * 1. INPUT PROCESSING:
 *    - User input is converted to a lowercase, trimmed string.
 *
 * 2. ALIAS MATCHING (findMatchingIntents):
 *    - The user's input is compared against the `phrase` field in the `HelpAlias` entity.
    * - This is a simple `includes()` check, allowing for partial matches. For example,
 *      if a user types "why is my registration failing?", it can match an alias like "registration fails".
 *    - Every matching alias returns its corresponding `intentId`.
 *
 * 3. CONTEXTUAL RANKING (rankIntents):
 *    - The list of matched intents is then ranked to find the most relevant answer.
 *    - Ranking considers two factors:
 *      a) PAGE CONTEXT: If a `HelpContextRule` exists for the current page (`pageKey`),
 *         any intent mentioned in that rule gets a significant priority boost (its rank is used).
 *         This makes the chatbot context-aware. For example, on the `VesselDetail` page,
 *         intents related to vessels are ranked higher.
 *      b) INTENT PRIORITY: Each `HelpIntent` has a `priority` field (lower is better).
 *         This serves as a global ranking for the intent's importance.
 *
 * 4. FINAL SELECTION:
 *    - The intents are sorted by their final calculated rank.
 *    - The top-ranked intent (the one with the lowest rank score) is selected as the best answer.
 *
 * This multi-step process (Alias -> Intent -> Context -> Rank) provides a robust,
 * rule-based system that can deliver relevant help without the complexity or
 * cost of a true AI model.
 */
import { base44 } from '@/api/base44Client';

/**
 * Finds all intents that match the user's input via the HelpAlias table.
 * @param {string} userInput - The user's raw input.
 * @returns {Promise<Array<Object>>} - A promise that resolves to an array of matching HelpIntent objects.
 */
async function findMatchingIntents(userInput) {
  // Normalize input for broader matching.
  const normalizedInput = userInput.toLowerCase().trim();
  if (!normalizedInput) return [];

  // Fetch all aliases. In a real-world, large-scale application, this could be optimized,
  // but for an internal support tool, fetching all is acceptable and simple.
  const allAliases = await base44.entities.HelpAlias.list();

  // Find all aliases where the user's input is included in the phrase.
  // This allows users to type partial keywords like "registration" and match longer phrases.
  const matchingAliases = allAliases.filter(alias =>
    alias.phrase.toLowerCase().includes(normalizedInput)
  );

  if (matchingAliases.length === 0) return [];

  // Get the unique intent IDs from the matching aliases.
  const intentIds = [...new Set(matchingAliases.map(a => a.intentId))];

  // Fetch the full intent objects for the matched IDs.
  const intents = await base44.entities.HelpIntent.filter({
    id: { $in: intentIds },
    isActive: true,
  });

  return intents;
}

/**
 * Ranks a list of intents based on page context and their inherent priority.
 * @param {Array<Object>} intents - The array of intents to rank.
 * @param {string} pageKey - The key of the current page (e.g., 'VesselDetail').
 * @returns {Promise<Object|null>} - A promise that resolves to the top-ranked intent, or null if none.
 */
async function rankIntents(intents, pageKey) {
  if (!intents || intents.length === 0) return null;

  // Fetch context rules for the current page to apply ranking adjustments.
  const contextRules = pageKey
    ? await base44.entities.HelpContextRule.filter({ pageKey })
    : [];

  const rankedIntents = intents.map(intent => {
    const contextRule = contextRules.find(rule => rule.intentId === intent.id);
    // The final rank is determined by the context rule's rank if it exists,
    // otherwise it defaults to the intent's global priority.
    // This makes the chatbot context-aware.
    const finalRank = contextRule ? contextRule.rank : intent.priority;
    return { ...intent, rank: finalRank };
  });

  // Sort by rank (lower is better).
  rankedIntents.sort((a, b) => a.rank - b.rank);

  return rankedIntents[0];
}

/**
 * Main service function to get a chatbot response.
 * Orchestrates the finding and ranking of intents.
 * @param {string} userInput - The user's input.
 * @param {string} pageKey - The current page context key.
 * @returns {Promise<Object|null>} - A promise that resolves to the best HelpIntent object or null.
 */
export async function getChatbotResponse(userInput, pageKey) {
  // Step 1: Find all possible intents based on user input aliases.
  const matchedIntents = await findMatchingIntents(userInput);

  // Step 2: Rank the matched intents using page context to find the best one.
  const bestIntent = await rankIntents(matchedIntents, pageKey);

  return bestIntent;
}