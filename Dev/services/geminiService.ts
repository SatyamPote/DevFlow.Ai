

import { GoogleGenAI, Type } from "@google/genai";
import type { Task, ChatMessage, Project, GeneratedCode, SimulationResult } from '../types';

// The API key is injected via process.env.API_KEY. Assume it is available.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export async function generateTasks(projectDescription: string): Promise<Task[]> {
    const prompt = `
        Based on the following project description, break it down into a list of development tasks.
        For each task, provide a title, a detailed description, and a list of file names that would likely be created or modified for that task.
        Return the result as a JSON array of objects. Each object should have "title", "description", and "files" properties.
        Do not include any other text or markdown formatting in your response. Just the raw JSON array.

        Project Description: "${projectDescription}"
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            description: { type: Type.STRING },
                            files: {
                                type: Type.ARRAY,
                                items: { type: Type.STRING }
                            }
                        },
                        required: ['title', 'description', 'files']
                    }
                }
            }
        });

        const jsonString = response.text.trim();
        const generatedTasks: Omit<Task, 'id' | 'status'>[] = JSON.parse(jsonString);

        // Add id and status to each task as expected by the application
        return generatedTasks.map((task, index) => ({
            ...task,
            id: `task-${Date.now()}-${index}`,
            status: 'pending' as const,
        }));

    } catch (error) {
        console.error("Failed to generate tasks:", error);
        throw new Error("Could not parse the task list from the AI. The response might be invalid. Please try again.");
    }
}


export async function generateBoilerplate(taskDescription: string, fileName: string): Promise<string> {
    const prompt = `
        Task Description: "${taskDescription}"
        File Name: "${fileName}"

        Based on the task description, generate the complete, initial boilerplate code for the specified file.
        Only output the raw code. Do not include any explanations, markdown formatting, or code fences (like \`\`\`javascript).
    `;
    try {
        const response = await ai.models.generateContent({ model: 'gemini-2.5-pro', contents: prompt });
        return response.text;
    } catch (error) {
        console.error("Gemini API call failed for generateBoilerplate:", error);
        throw new Error("Failed to get a response from the AI model for code generation.");
    }
}

export async function reviewCode(code: string): Promise<string> {
    const prompt = `
        As an expert code reviewer, analyze the following code. Provide a detailed review covering:
        - Potential bugs or edge cases.
        - Style and readability improvements.
        - Performance optimizations.
        - Best practice recommendations.

        Format your response in clear, easy-to-read Markdown.

        Code to review:
        \`\`\`
        ${code}
        \`\`\`
    `;
    try {
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        return response.text;
    } catch (error) {
        console.error("Gemini API call failed for reviewCode:", error);
        throw new Error("Failed to get a response from the AI model for code review.");
    }
}

export async function generateUnitTests(code: string): Promise<string> {
    const prompt = `
        Generate comprehensive unit tests for the following code.
        Try to identify the language and use a common testing framework for it (e.g., Jest for JS/TS, pytest for Python).
        Include tests for edge cases.
        Only output the raw code for the test file. Do not include any explanations or markdown formatting. Wrap the code in a single code block.

        Code to generate tests for:
        \`\`\`
        ${code}
        \`\`\`
    `;
    try {
        const response = await ai.models.generateContent({ model: 'gemini-2.5-pro', contents: prompt });
        // Extract code from markdown block if present
        const match = response.text.match(/```(?:\w+\n)?([\s\S]+)```/);
        return match ? match[1].trim() : response.text;
    } catch (error) {
        console.error("Gemini API call failed for generateUnitTests:", error);
        throw new Error("Failed to get a response from the AI model for test generation.");
    }
}

export async function generateDocumentation(code: string): Promise<string> {
    const prompt = `
        Generate technical documentation in Markdown format for the following code.
        Explain what the code does, its parameters (if any), return values, and include a simple usage example.

        Code to document:
        \`\`\`
        ${code}
        \`\`\`
    `;
    try {
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        return response.text;
    } catch (error) {
        console.error("Gemini API call failed for generateDocumentation:", error);
        throw new Error("Failed to get a response from the AI model for documentation generation.");
    }
}

export async function analyzeComplexity(code: string): Promise<string> {
    const prompt = `
        Analyze the time and space complexity of the following code.
        Provide the Big O notation for both time and space.
        Explain your reasoning clearly for a developer to understand. Format the response in Markdown.

        Code to analyze:
        \`\`\`
        ${code}
        \`\`\`
    `;
    try {
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        return response.text;
    } catch (error) {
        console.error("Gemini API call failed for analyzeComplexity:", error);
        throw new Error("Failed to get a response from the AI model for complexity analysis.");
    }
}

export async function summarizeCommit(diff: string): Promise<string> {
    const prompt = `
        Generate a conventional commit message for the following git diff.
        The message should have a type (e.g., feat, fix, chore), a short description, and an optional body explaining the changes.

        Git Diff:
        \`\`\`diff
        ${diff}
        \`\`\`
    `;
    try {
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        return response.text;
    } catch (error) {
        console.error("Gemini API call failed for summarizeCommit:", error);
        throw new Error("Failed to get a response from the AI model for commit summarization.");
    }
}

export async function generateProjectScaffold(description: string): Promise<GeneratedCode[]> {
    const prompt = `
        Based on the following project description, generate a complete project scaffold.
        This includes a hierarchical file structure and the full code content for each file.
        Crucially, you must include a 'README.md' file with clear, step-by-step instructions on how to set up and run the project locally (e.g., dependencies to install, commands to run).
        Return the result as a single JSON array of objects. Each object must have two string properties: "fileName" (the full path, e.g., "src/components/Button.js") and "content" (the complete code for that file).
        Do not include any other text, explanations, or markdown formatting in your response. Your entire response must be only the raw JSON array.

        Project Description: "${description}"
    `;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            fileName: { type: Type.STRING },
                            content: { type: Type.STRING },
                        },
                        required: ['fileName', 'content']
                    }
                }
            }
        });
        const jsonString = response.text.trim();
        return JSON.parse(jsonString);
    } catch (error) {
        console.error("Gemini API call failed for generateProjectScaffold:", error);
        throw new Error("Failed to generate the project scaffold from the AI. The model may have returned an invalid structure. Please try a different description.");
    }
}


export async function runAndReviewCode(code: string, language: string): Promise<string> {
    const prompt = `
        You are a code execution sandbox. You cannot actually run code, but you must simulate it.
        For the given ${language} code:
        1.  Analyze the code for correctness and potential errors.
        2.  Predict what the output would be if it were executed. If there are no print/log statements, describe what the code accomplishes.
        3.  Provide a brief review of the code's quality.

        Format your response in Markdown, with sections for "Predicted Output" and "Code Review".

        Code:
        \`\`\`${language}
        ${code}
        \`\`\`
    `;
    try {
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        return response.text;
    } catch (error) {
        console.error("Gemini API call failed for runAndReviewCode:", error);
        throw new Error("Failed to get a response from the AI model for code execution review.");
    }
}

function formatChatHistoryForPrompt(messages: ChatMessage[]): string {
    return messages.map(m => `${m.sender === 'user' ? 'User' : 'Model'}: ${m.text}`).join('\n');
}

export async function continueConversation(messages: ChatMessage[], project: Project): Promise<string> {
    const projectContext = `
        Current Project: "${project.name}"
        Description: "${project.description}"
        Tasks (${project.tasks.filter(t=>t.status==='done').length}/${project.tasks.length} done):
        ${project.tasks.map(t => `- ${t.title} (Status: ${t.status})`).join('\n')}
    `;
    
    const history = formatChatHistoryForPrompt(messages);

    const prompt = `
        You are DevFlow.AI, a helpful AI assistant integrated into a developer workflow tool.
        You have context about the current project and the ongoing conversation.
        Be helpful, concise, and knowledgeable about software development.

        --- Project Context ---
        ${projectContext}

        --- Conversation History ---
        ${history}

        ---
        Based on all the above, provide a helpful and relevant response to the last user message.
    `;
    try {
        const response = await ai.models.generateContent({ model: 'gemini-2.5-pro', contents: prompt });
        return response.text;
    } catch (error) {
        console.error("Gemini API call failed for continueConversation:", error);
        throw new Error("Failed to get a response from the AI model for the chat.");
    }
}

export async function generateArchitectureDiagram(projectContext: string): Promise<string> {
    const prompt = `
        Based on the following project context (description and all code files), generate a system architecture diagram using Mermaid.js syntax.
        The diagram should show the main components and their relationships.
        Only output the Mermaid.js code block. Do not include any other text, explanations, or markdown formatting. Your response should start with \`\`\`mermaid and end with \`\`\`.

        Project Context:
        ${projectContext}
    `;
    try {
        const response = await ai.models.generateContent({ model: 'gemini-2.5-pro', contents: prompt });
        
        const text = response.text;
        const mermaidMatch = text.match(/```mermaid\s*([\s\S]*?)\s*```/);
        if (mermaidMatch && mermaidMatch[1]) {
            return mermaidMatch[1].trim();
        }
        
        // Fallback if the model didn't use fences correctly
        if (text.trim().startsWith('graph') || text.trim().startsWith('flowchart')) {
            return text.trim();
        }

        console.warn("Could not extract Mermaid code from response:", text);
        throw new Error("Could not extract a valid Mermaid diagram from the AI's response.");
    } catch (error) {
        console.error("Gemini API call failed for generateArchitectureDiagram:", error);
        if (error instanceof Error && error.message.includes("Mermaid")) {
            throw error;
        }
        throw new Error("Failed to get a response from the AI model for diagram generation.");
    }
}

export async function askMemoryAgent(messages: ChatMessage[], currentInput: string): Promise<string> {
    const history = formatChatHistoryForPrompt(messages);

    const prompt = `
        You are a helpful AI assistant with a perfect memory of the current conversation.
        
        --- Conversation History ---
        ${history}
        User: ${currentInput}
        ---

        Provide a response to the last user message based on the entire conversation history.
    `;
     try {
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        return response.text;
    } catch (error) {
        console.error("Gemini API call failed for askMemoryAgent:", error);
        throw new Error("Failed to get a response from the AI model for the memory agent.");
    }
}

export async function runAgentSimulation(goal: string, existingFiles: GeneratedCode[]): Promise<SimulationResult> {
    const existingFileContext = existingFiles.length > 0 
        ? `The project currently contains the following files. You can choose to modify them or add new ones:\n${existingFiles.map(f => `// File: ${f.fileName}\n${f.content}`).join('\n\n')}`
        : "The project is currently empty. The Senior Developer must create all necessary files from scratch.";

    const prompt = `
        You are a simulator for a team of AI agents collaborating to build a software project based on a user's goal.
        The team consists of:
        - **Project Manager:** Breaks down the goal, creates a plan, assigns tasks, and ensures the project stays on track.
        - **Senior Developer:** Writes and modifies the code. When providing code, it must be complete and correct.
        - **QA Engineer:** Asks clarifying questions, identifies edge cases, and reviews the code for quality and correctness.

        **Instructions:**
        1.  Follow a logical conversational flow where agents respond to each other.
        2.  The **Project Manager** must start by creating a plan.
        3.  The **Senior Developer** is responsible for all code generation. When the developer provides code for a file, they must provide the *entire file's content*, even if it's just a small change.
        4.  The simulation must conclude with the **Project Manager** giving a final summary.
        5.  Your **FINAL response** MUST be a single JSON object. Do not include any other text, explanations, or markdown formatting.
        6.  The JSON object must have two top-level keys: "simulationTurns" and "finalFileSet".
            - **"simulationTurns"**: An array of objects, where each object represents a turn in the conversation and has two keys: "agent" (string, e.g., "Project Manager") and "message" (string, the agent's message).
            - **"finalFileSet"**: An array of objects, representing the complete and final state of all code files after the simulation is finished. Each object must have two keys: "fileName" (string, e.g., "src/App.js") and "content" (string, the full content of the file). This set should include both new and modified files.

        **Existing Project Context:**
        ${existingFileContext}

        The user's goal is: "${goal}"
    `;
    try {
        const response = await ai.models.generateContent({ 
            model: 'gemini-2.5-pro', 
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        simulationTurns: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    agent: { type: Type.STRING },
                                    message: { type: Type.STRING },
                                },
                                required: ['agent', 'message'],
                            }
                        },
                        finalFileSet: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    fileName: { type: Type.STRING },
                                    content: { type: Type.STRING },
                                },
                                required: ['fileName', 'content'],
                            }
                        }
                    },
                    required: ['simulationTurns', 'finalFileSet'],
                }
            }
        });

        const jsonString = response.text.trim();
        const parsedJson = JSON.parse(jsonString);

        return {
            turns: parsedJson.simulationTurns,
            files: parsedJson.finalFileSet
        };

    } catch (error) {
        console.error("Gemini API call failed for runAgentSimulation:", error);
        throw new Error("Failed to get a response from the AI model for the agent simulation. The model might have returned an invalid structure.");
    }
}
