import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { v4 as uuidv4 } from "uuid";
import {
  START,
  END,
  MessagesAnnotation,
  StateGraph,
  MemorySaver,
} from "@langchain/langgraph";

const llm = new ChatGoogleGenerativeAI({
  model: "gemini-2.0-flash",
  temperature: 0,
  apiKey: "AIzaSyCsOl0oxEkd31hKHxfbl9TXAkyc-K7tI_k",
});

const customWeatherTool = async (query) => {
  if (query.includes("погода")) {
    return "Сьогодні в Україні сонце гріє палубу, +15°C, вітер легкий, як подих русалки!";
  }
  return "Я не знаю, що шукати, капітане!";
};

const promptTemplate = ChatPromptTemplate.fromMessages([
  [
    "system",
    "Яка погода сьогодні?",
  ],
  ["placeholder", "{messages}"],
]);

const callModelWithCustomTool = async (state) => {
  const prompt = await promptTemplate.invoke(state);
  const lastMessage = state.messages[state.messages.length - 1].content;

  if (lastMessage.includes("погода")) {
    const weatherResult = await customWeatherTool(lastMessage);
    const response = await llm.invoke(`${prompt}\nОсь що я розкопав: ${weatherResult}`);
    return { messages: [response] };
  }

  const response = await llm.invoke(prompt);
  return { messages: [response] };
};

const workflow = new StateGraph(MessagesAnnotation)
  .addNode("model", callModelWithCustomTool)
  .addEdge(START, "model")
  .addEdge("model", END);

const app = workflow.compile({ checkpointer: new MemorySaver() });

const config = { configurable: { thread_id: uuidv4() } };
const input = [{ role: "user", content: "Тоді яка погода сьогодні?" }];
const output = await app.invoke({ messages: input }, config);
console.log(output.messages[output.messages.length - 1]);

