export type ContestantCategory = 'prize' | 'sponsor' | 'judge' | 'contestant';

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
    category: ContestantCategory;
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
    
    // Add sponsors
    const sponsors = ['AWS', 'Google Cloud', 'Microsoft', 'Meta', 'OpenAI'];
    sponsors.forEach((name, idx) => {
        contestants.push({
            id: contestants.length,
            name,
            teamName: name,
            project: `${name} Platform Integration`,
            description: `${name} is providing cloud credits and technical support`,
            track: tracks[idx % tracks.length],
            members: 5,
            progress: 1,
            colorIndex: 2,
            category: 'sponsor'
        });
    });

    // Add judges
    const judges = ['Sarah Chen', 'Alex Kumar', 'Maria Rodriguez', 'James Smith', 'Yuki Tanaka'];
    judges.forEach((name, idx) => {
        contestants.push({
            id: contestants.length,
            name,
            teamName: 'Judges Panel',
            project: 'Hackathon Judging',
            description: `${name} is an industry expert in ${tracks[idx % tracks.length]}`,
            track: tracks[idx % tracks.length],
            members: 1,
            progress: 1,
            colorIndex: 3,
            category: 'judge'
        });
    });

    // Add prize categories
    const prizes = [
        'Grand Prize ($500k)',
        'AI Innovation ($200k)',
        'Web3 Future ($150k)',
        'Gaming Excellence ($100k)',
        'Social Impact ($50k)'
    ];
    prizes.forEach((name, idx) => {
        contestants.push({
            id: contestants.length,
            name,
            teamName: 'Prize Pool',
            project: name,
            description: `Win ${name} by excelling in ${tracks[idx % tracks.length]}`,
            track: tracks[idx % tracks.length],
            members: 0,
            progress: 1,
            colorIndex: 4,
            category: 'prize'
        });
    });

    // Add regular contestants
    for (let i = 0; i < count; i++) {
        contestants.push({
            id: contestants.length,
            name: `Contestant ${i + 1}`,
            teamName: `Team ${i + 1}`,
            project: `Project ${i + 1}`,
            description: `An innovative project that aims to solve ${tracks[i % tracks.length]} challenges`,
            track: tracks[i % tracks.length],
            members: Math.floor(Math.random() * 3) + 1,  // 1-4 members
            progress: Math.random(),  // random progress
            colorIndex: TRACKS[tracks[i % tracks.length] as keyof typeof TRACKS],
            category: 'contestant'
        });
    }
    
    return contestants;
}
