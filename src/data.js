// =============================================================================
//  data.js  —  Arka Patra's content, structured for an editorial,
//  Vectr-style layout: hero, a numbered "approach" journey, capabilities,
//  selected work, experience and an FAQ.
// =============================================================================
export const PROFILE = {
  name: "ARKA PATRA",
  title: "Lead GenAI Engineer",
  eyebrow: "GENAI · AGENTS · RAG",
  hero1: "Intelligence,",
  hero2: "engineered for production.",
  heroSub:
    "Consistently building agentic systems, RAG pipelines and the accelerators that ship them — at enterprise scale.",
  links: {
    github: "https://github.com/arkapatra31",
    linkedin: "https://www.linkedin.com/in/arkapatra31/",
    email: "arka.patra96@outlook.com",
  },
  philosophy:
    "I'd rather build something small and useful — than something fancy and forgotten.",
};

// the guided journey — a continuous line threads these four steps
export const APPROACH = [
  { n: "01", title: "Understand", body: "Translate complex, ambiguous client requirements into a concrete, scalable scope — from first conversation to architecture." },
  { n: "02", title: "Architect", body: "Design custom agentic workflows and RAG systems from first principles: retrieval, orchestration, governance, evaluation." },
  { n: "03", title: "Build", body: "Production-grade and modular — Python, FastAPI, LangGraph, MCP, Neo4j — with human-in-the-loop audit baked in." },
  { n: "04", title: "Ship", body: "Deploy at enterprise scale with measurable ROI, real-time decision support, and accelerators reused across engagements." },
];

export const CAPABILITIES = [
  { icon: "agent", title: "Agentic orchestration", body: "Multi-agent workflows, ReAct loops and governance with human-in-the-loop audit." },
  { icon: "rag", title: "RAG & retrieval", body: "End-to-end pipelines over Pinecone, FAISS, MongoDB and Neo4j graph-RAG." },
  { icon: "eval", title: "LLM evaluation", body: "Ragas v0.4 scoring against graph-structured targets — 80–90% agent accuracy." },
  { icon: "arch", title: "Production architecture", body: "7+ years of microservices, FastAPI, GraphQL and MCP-backed data layers." },
  { icon: "spark", title: "Reusable accelerators", body: "Modular assets and accelerators that compress time-to-market across clients." },
];

export const PROJECTS = [
  { name: "guardian", tag: "Multi-dimensional PR reviewer", url: "https://github.com/arkapatra31/guardian",
    desc: "A pluggable GitHub App running architectural, security, spec, performance & release reviews on the Claude Code Agent SDK." },
  { name: "meridian", tag: "Code knowledge graph for agents", url: "https://arkapatra31.github.io/meridian/",
    desc: "A queryable graph of every function, class & dependency so coding agents stop burning tokens. Tree-sitter + symbol index." },
  { name: "llm-nervous-system", tag: "Visualising LLM responses", url: "https://github.com/arkapatra31/llm-nervous-system",
    desc: "A TypeScript project visualising how LLMs respond to user queries." },
  { name: "agent-semantic-caching", tag: "Semantic cache for AI agents", url: "https://github.com/arkapatra31/agent-semantic-caching",
    desc: "Cuts redundant LLM calls by matching on meaning, not exact strings." },
];

export const EXPERIENCE = [
  { company: "Deloitte", role: "Senior Consultant", period: "2023 — Now",
    line: "Production GenAI — a LangChain + NVIDIA NIM Digital Avatar, MCP data architecture, and multi-agent governance in Neo4j." },
  { company: "Accenture", role: "Senior Analyst", period: "2023",
    line: "Composable commerce backend in Node/TS/GraphQL; 15+ production Commercetools accelerators." },
  { company: "Tata Consultancy Services", role: "System Engineer", period: "2019 — 2023",
    line: "Led a 12-member REST API team for banking; modernized core-banking to 99.9% uptime, cut latency 30%." },
];

export const FAQ = [
  { q: "What do you actually build?", a: "Production GenAI systems — agentic workflows, RAG pipelines, LLM-evaluation harnesses and reusable accelerators. Recently: a C-suite Digital Avatar, an MCP-backed enterprise data layer, and multi-agent governance with human-in-the-loop audit." },
  { q: "What's your core stack?", a: "Python, FastAPI, Node/TypeScript and GraphQL on the backend. LangChain, LangGraph, the Claude SDK, MCP, RAG and Ragas for GenAI. Neo4j, Pinecone, MongoDB and FAISS for data. Azure, AWS and Docker for infra." },
  { q: "Do you work end-to-end?", a: "Yes — from translating ambiguous requirements into scope, through architecture and build, to deployment at enterprise scale. 7+ years across backend, microservices and GenAI platforms." },
  { q: "How do you keep agents reliable?", a: "Human-in-the-loop audit mechanisms, evaluation with Ragas v0.4 against graph-structured targets in Neo4j (80–90% accuracy), and semantic caching to cut redundant calls." },
  { q: "Are you open to new work?", a: "Always up for hard problems in agentic systems, RAG and LLM evaluation. The fastest way to reach me is email or LinkedIn." },
];

// Fallback list of every public (non-fork) repo, superseded by the live GitHub
// API fetch when available.
const repo = (name, lang, desc = "") => ({ name, lang, desc, url: `https://github.com/arkapatra31/${name}`, stars: 0 });
export const ALL_REPOS = [
  repo("guardian", "Python", "Pluggable GitHub App for multi-dimensional PR reviews."),
  repo("agent-semantic-caching", "Python", "Semantic caching for AI agents."),
  repo("llm-nervous-system", "TypeScript", "Visualising how LLMs respond to user queries."),
  repo("meridian", "Python", "Code knowledge graph for AI coding agents."),
  repo("claude-code-agent-sdk", "Python", "Implementing the Claude Code Agent SDK step by step."),
  repo("model-context-protocol", "Python", "Implementation of Anthropic's Model Context Protocol."),
  repo("multi-agents", "Python", "Application with multiple coordinating agents."),
  repo("LangChain", "Python", "LangChain concepts — RAG, agents, retrieval, tracing."),
  repo("google-adk", "Python", "Google Agent Development Kit experiments."),
  repo("Knowledge-Graph", "Python", "Knowledge graphs for RAG."),
  repo("Neo4j-Cypher", "Cypher", "Cypher scripts & graph data modeling for Neo4j."),
  repo("GenAI", "Jupyter", "GenAI starter, growing with more implementation."),
  repo("ML", "Jupyter", "Machine learning journey — regression, classification."),
  repo("fine-tuning", "Python", "Fine-tuning an LLM."),
  repo("synthetic-data", "Python", "Creating synthetic data in Python."),
  repo("Data-Structures-Algorithm_System-Design", "HTML", "DSA & system design notes."),
  repo("Airflow", "Python", "Apache Airflow pipelines."),
  repo("kafka-streaming", "TypeScript", "Node.js + TypeScript Kafka integration."),
  repo("python-flask", "Python", "Python Flask."),
  repo("NodeJS", "JavaScript", "Node.js application code."),
  repo("graphql", "JavaScript", "GraphQL experiments."),
  repo("apollo-federation", "JavaScript", "Apollo Federation managed workflow."),
  repo("commercetools-connect", "TypeScript", "Commercetools Connect application & utilities."),
  repo("commercetools", "TypeScript", "Commercetools."),
  repo("docker_basics", "C#", "Docker fundamentals."),
  repo("kubernetes_beginner", "", "Everything about Kubernetes for a beginner."),
  repo("bulkFileExtensionChange", "Python", "Bulk file-extension changer script."),
  repo("ReactJS", "JavaScript", "React apps."),
];
