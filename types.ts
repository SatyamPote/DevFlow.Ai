export interface Task {
  id: string;
  title: string;
  description: string;
  files: string[];
  status: 'pending' | 'in-progress' | 'done';
}

export interface GeneratedFile {
  taskId: string;
  fileName: string;
  content: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
}

export interface Snippet {
  id: string;
  title: string;
  language: string;
  code: string;
  description: string;
}

export interface GeneratedCode {
  fileName: string;
  content: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  tasks: Task[];
  messages: ChatMessage[];
  generatedCode: GeneratedCode[];
  createdAt?: any; // For Firestore serverTimestamp
}

export interface SimulationTurn {
  agent: string;
  message: string;
}

export interface SimulationResult {
  turns: SimulationTurn[];
  files: GeneratedCode[];
}
