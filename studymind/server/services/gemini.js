console.log("Using Offline Mock AI service. No GEMINI_API_KEY required.");

/**
 * Deterministic pseudo-random embedding generator so that local cosine similarity functions correctly.
 */
export async function embedText(text) {
  const size = 768;
  const arr = [];
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  for (let i = 0; i < size; i++) {
    const val = Math.sin(hash + i);
    arr.push(val);
  }
  return arr;
}

/**
 * Streams a mock chat response as an async generator of text chunks.
 */
export async function* streamChatReply(history, newMessage, systemContext = "") {
  let reply = `[Offline Mode] `;
  
  const lowerMsg = newMessage.toLowerCase();
  
  // Extract document excerpts if present
  let docExcerpts = [];
  if (systemContext.includes("Use the following document excerpts as your primary source:")) {
    const parts = systemContext.split("Use the following document excerpts as your primary source:\n");
    if (parts.length > 1) {
      docExcerpts = parts[1].split("\n---\n").map(x => x.trim()).filter(Boolean);
    }
  }

  if (lowerMsg.includes("hello") || lowerMsg.includes("hi")) {
    reply += `Hello! I'm Synapse, your friendly study tutor. I am currently running offline without requiring a Gemini API key. How can I assist you with your studies today?`;
  } else if (docExcerpts.length > 0) {
    const primaryExcerpt = docExcerpts[0];
    const sentences = primaryExcerpt.split(/[.!?]/).map(s => s.trim()).filter(s => s.length > 15);
    reply += `Based on the uploaded document: "${sentences.slice(0, 2).join(". ") || primaryExcerpt.slice(0, 200)}..."\n\nIs there a specific detail in this section you'd like me to explain further?`;
  } else {
    reply += `I'm Synapse, your study assistant. I am running offline, simulating answers to keep everything functional without a Gemini API Key. You asked: "${newMessage}". Let's dive deeper into this subject!`;
  }

  const words = reply.split(" ");
  for (let i = 0; i < words.length; i++) {
    yield words[i] + (i === words.length - 1 ? "" : " ");
    await new Promise(resolve => setTimeout(resolve, 20));
  }
}

/**
 * Generates mock structured JSON content matching the expected shapes of the prompts.
 */
export async function generateStructuredJSON(prompt) {
  // Check if it's a summary request
  if (prompt.includes('"summary"') && prompt.includes('"keyTopics"')) {
    const materialIndex = prompt.indexOf("Material:\n");
    let materialText = "";
    if (materialIndex !== -1) {
      materialText = prompt.slice(materialIndex + 10).trim();
    }
    
    let summary = "This document covers important concepts and terms in the material.";
    let keyTopics = ["General Overview"];
    
    if (materialText) {
      const sentences = materialText.split(/[.!?]/).map(s => s.trim()).filter(s => s.length > 20);
      if (sentences.length > 0) {
        summary = `This study guide is based on the provided material, focusing on key themes like ${sentences[0].slice(0, 100)}...`;
      }
      
      const words = materialText.match(/[A-Z][a-z]+/g) || [];
      const uniqueWords = [...new Set(words)].filter(w => w.length > 3 && w !== "This" && w !== "That" && w !== "With");
      if (uniqueWords.length > 0) {
        keyTopics = uniqueWords.slice(0, 5);
      } else {
        keyTopics = ["Core concepts", "Key terms", "Key definitions", "Overview"];
      }
    }
    
    return {
      summary,
      keyTopics
    };
  }

  // Check if it's a flashcard request
  if (prompt.includes('"cards"') && prompt.includes('"front"')) {
    const topicMatch = prompt.match(/topic "([^"]+)"/);
    const countMatch = prompt.match(/Create (\d+) flashcards/);
    
    const topic = topicMatch ? topicMatch[1] : "the subject";
    const count = countMatch ? parseInt(countMatch[1], 10) : 5;
    
    const cards = [];
    for (let i = 1; i <= count; i++) {
      cards.push({
        front: `What is key concept #${i} of ${topic}?`,
        back: `This is the mock description/definition of concept #${i} for the topic of ${topic}. (Generated in offline mode)`
      });
    }
    return { cards };
  }

  // Check if it's a quiz request
  if (prompt.includes('"questions"') && prompt.includes('"options"')) {
    const topicMatch = prompt.match(/on "([^"]+)"/);
    const difficultyMatch = prompt.match(/Create a (\w+) difficulty/);
    const countMatch = prompt.match(/with (\d+) questions/);
    
    const topic = topicMatch ? topicMatch[1] : "the subject";
    const difficulty = difficultyMatch ? difficultyMatch[1] : "medium";
    const count = countMatch ? parseInt(countMatch[1], 10) : 5;
    
    const questions = [];
    for (let i = 1; i <= count; i++) {
      questions.push({
        question: `Sample multiple-choice question #${i} about ${topic} (${difficulty} level)`,
        options: [
          `Option A: A detailed definition or example related to ${topic}`,
          `Option B: An alternative definition or option for ${topic}`,
          `Option C: A common misconception or distractor for ${topic}`,
          `Option D: None of the above / all of the above`
        ],
        correctIndex: (i % 4),
        explanation: `Explanation for question #${i}: Option ${String.fromCharCode(65 + (i % 4))} is correct because it best describes the core concept of ${topic} in this context.`
      });
    }
    return { questions };
  }

  return {};
}

/**
 * Generates mock plain text content.
 */
export async function generatePlainText(prompt) {
  return `[Mock Plain Text Response] This is a mock response for the prompt: "${prompt}".`;
}

