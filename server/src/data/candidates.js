export const candidates = [
  {
    id: "candidate-001",
    name: "Demo Candidate",
    completedMissions: [
      "Prompt Engineering Fundamentals",
      "RAG Pipeline Implementation",
      "Vector Search Prototype",
      "Agent Workflow Exercise",
    ],
    attemptedTopics: [
      "Prompt Engineering",
      "RAG",
      "Vector Databases",
      "Agentic AI",
      "MCP",
    ],
    skippedTopics: ["AI Deployment"],
    learningSignals: {
      strongAreas: ["Prompt Engineering", "RAG"],
      developingAreas: ["Vector Databases", "Agentic AI"],
      weakAreas: ["MCP", "AI Deployment"],
      preferredDifficulty: "progressive",
    },
  },
];

export const getCandidateById = (candidateId) => {
  return candidates.find((candidate) => candidate.id === candidateId) || null;
};