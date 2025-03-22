export type ContestantCategory = "prize" | "sponsor" | "judge" | "contestant";

export interface AIPersona {
  role: string;
  background: string;
  expertise: string[];
  greeting: string;
  contextPrompt: string;
}

const AGENT_PERSONAS: Record<ContestantCategory, AIPersona> = {
  prize: {
    role: "Prize Track Guide",
    background:
      "I help participants understand prize categories and submission requirements.",
    expertise: [
      "Prize Categories",
      "Submission Guidelines",
      "Project Requirements",
    ],
    greeting:
      "Hi! I can help you understand our prize tracks and optimize your submission.",
    contextPrompt:
      "Focus on explaining prize requirements and helping participants align their ideas with prize criteria.",
  },
  sponsor: {
    role: "Sponsor Resources Guide",
    background:
      "I help teams leverage sponsor technologies and resources effectively.",
    expertise: ["Technical Resources", "API Integration", "Platform Features"],
    greeting:
      "Hello! I can help you access and implement sponsor technologies in your project.",
    contextPrompt:
      "Focus on explaining available sponsor resources and how to best utilize them in projects.",
  },
  judge: {
    role: "Judging Criteria Advisor",
    background:
      "I help teams understand judging criteria and evaluation standards.",
    expertise: [
      "Evaluation Criteria",
      "Project Feedback",
      "Innovation Assessment",
    ],
    greeting:
      "Welcome! I can help you understand how projects are evaluated and how to strengthen your submission.",
    contextPrompt:
      "Help participants understand judging criteria and compare their ideas against existing projects. Do NOT provide actual judging scores or decisions.",
  },
  contestant: {
    role: "Team Collaboration Guide",
    background:
      "I help teams optimize their project development and collaboration.",
    expertise: [
      "Project Planning",
      "Team Coordination",
      "Development Best Practices",
    ],
    greeting:
      "Hi! I can help your team organize and optimize your development process.",
    contextPrompt:
      "Focus on helping teams improve their project planning and execution.",
  },
};

export interface ContestantData {
  id: number;
  name: string;
  teamName: string;
  project: string;
  description: string;
  track: string; // e.g., "AI/ML", "Web3", "Gaming", etc.
  members: number; // team size
  progress: number; // 0-1 for visualization
  colorIndex: number; // for visual variety
  category: ContestantCategory;
  aiPersona?: AIPersona;
  chatHistory?: ChatMessage[];
}

// Example tracks with their associated colors
export const TRACKS = {
  "AI/ML": 0, // white
  Web3: 1, // light gray
  Gaming: 2, // medium gray
  Mobile: 3, // dark gray
  Social: 4, // accent blue
};

export interface ChatMessage {
  timestamp: number;
  message: string;
  sender: "user" | "agent";
}

// Real data loading function
export function loadContestantsData(): Promise<ContestantData[]> {
  return new Promise((resolve, reject) => {
    try {
      // Use localStorage or API to load real contestant data
      const savedData = localStorage.getItem("contestant-data");

      if (savedData) {
        const contestants = JSON.parse(savedData);
        console.log(`Loaded ${contestants.length} contestants from storage`);
        // Ensure AI personas are properly attached
        contestants.forEach((contestant: ContestantData) => {
          if (!contestant.aiPersona) {
            contestant.aiPersona = AGENT_PERSONAS[contestant.category];
          }
          if (!contestant.chatHistory) {
            contestant.chatHistory = [];
          }
        });
        resolve(contestants);
      } else {
        // No data in storage yet
        console.log("No contestant data found in storage");
        resolve([]);
      }
    } catch (error) {
      console.error("Error loading contestant data:", error);
      reject(error);
    }
  });
}

// Save contestants data
export function saveContestantsData(
  contestants: ContestantData[]
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      localStorage.setItem("contestant-data", JSON.stringify(contestants));
      console.log(`Saved ${contestants.length} contestants to storage`);
      resolve();
    } catch (error) {
      console.error("Error saving contestant data:", error);
      reject(error);
    }
  });
}

// Create a new contestant with required fields
export function createContestant(
  name: string,
  teamName: string,
  project: string,
  description: string,
  track: string,
  members: number,
  category: ContestantCategory
): ContestantData {
  // Generate a unique ID
  const id = Date.now();

  // Determine color index based on track
  const colorIndex = TRACKS[track as keyof typeof TRACKS] || 0;

  return {
    id,
    name,
    teamName,
    project,
    description,
    track,
    members,
    progress: 0,
    colorIndex,
    category,
    aiPersona: AGENT_PERSONAS[category],
    chatHistory: [],
  };
}
