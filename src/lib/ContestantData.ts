export interface ContestantData {
    id: number;
    name: string;
    teamName: string;
    project: string;
    description: string;
    track: string;  // e.g., "AI/ML", "Web3", "Gaming", etc.
    members: number;  // team size
    progress: number;  // 0-1 for visualization
    colorIndex: number;  // for visual variety
}

// Example tracks with their associated colors
export const TRACKS = {
    'AI/ML': 0,  // white
    'Web3': 1,   // light gray
    'Gaming': 2, // medium gray
    'Mobile': 3, // dark gray
    'Social': 4  // accent blue
};

// Mock data generator for testing
export function generateMockContestants(count: number): ContestantData[] {
    const contestants: ContestantData[] = [];
    const tracks = Object.keys(TRACKS);
    
    for (let i = 0; i < count; i++) {
        contestants.push({
            id: i,
            name: `Contestant ${i + 1}`,
            teamName: `Team ${i + 1}`,
            project: `Project ${i + 1}`,
            description: `An innovative project that aims to solve ${tracks[i % tracks.length]} challenges`,
            track: tracks[i % tracks.length],
            members: Math.floor(Math.random() * 3) + 1,  // 1-4 members
            progress: Math.random(),  // random progress
            colorIndex: TRACKS[tracks[i % tracks.length] as keyof typeof TRACKS]
        });
    }
    
    return contestants;
}
