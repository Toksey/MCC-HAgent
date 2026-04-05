import type { ChatRole } from './types';

export interface MockChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: string;
}

export interface MockChatSession {
  id: string;
  agentId: string;
  key: string;
  label: string;
  createdAt: string;
  modifiedAt: string;
  sizeBytes: number;
  messages: MockChatMessage[];
}

interface MockWorkspaceFile {
  content: string;
  updatedAt: string;
}

const chatSessions = new Map<string, Map<string, MockChatSession>>();
const workspaceFiles = new Map<string, Map<string, MockWorkspaceFile>>();

function now() {
  return new Date().toISOString();
}

function createId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function getAgentSessionMap(agentId: string) {
  let sessions = chatSessions.get(agentId);
  if (!sessions) {
    sessions = new Map<string, MockChatSession>();
    chatSessions.set(agentId, sessions);
  }
  return sessions;
}

function getAgentWorkspaceMap(agentId: string) {
  let files = workspaceFiles.get(agentId);
  if (!files) {
    files = new Map<string, MockWorkspaceFile>();
    workspaceFiles.set(agentId, files);
  }
  return files;
}

function calculateSize(messages: MockChatMessage[]) {
  return JSON.stringify(messages).length;
}

export function ensureChatSession(
  agentId: string,
  sessionId: string,
  seedMessages: MockChatMessage[] = []
) {
  const sessions = getAgentSessionMap(agentId);
  const existing = sessions.get(sessionId);

  if (existing) {
    if (existing.messages.length === 0 && seedMessages.length > 0) {
      existing.messages = [...seedMessages];
      existing.modifiedAt = seedMessages.at(-1)?.timestamp || now();
      existing.sizeBytes = calculateSize(existing.messages);
    }
    return existing;
  }

  const createdAt = seedMessages[0]?.timestamp || now();
  const modifiedAt = seedMessages.at(-1)?.timestamp || createdAt;
  const session: MockChatSession = {
    id: sessionId,
    agentId,
    key: sessionId,
    label: sessionId === 'main' ? 'Direct Channel' : sessionId,
    createdAt,
    modifiedAt,
    sizeBytes: calculateSize(seedMessages),
    messages: [...seedMessages],
  };

  sessions.set(sessionId, session);
  return session;
}

export function listChatSessions(agentId: string) {
  return Array.from(getAgentSessionMap(agentId).values()).sort((a, b) =>
    b.modifiedAt.localeCompare(a.modifiedAt)
  );
}

export function getChatSession(agentId: string, sessionId: string) {
  return getAgentSessionMap(agentId).get(sessionId);
}

export function appendChatExchange(
  agentId: string,
  sessionId: string,
  userContent: string,
  assistantContent?: string
) {
  const session = ensureChatSession(agentId, sessionId);
  const timestamp = now();

  session.messages.push({
    id: createId('msg'),
    role: 'user',
    content: userContent,
    timestamp,
  });

  if (assistantContent) {
    session.messages.push({
      id: createId('msg'),
      role: 'assistant',
      content: assistantContent,
      timestamp: now(),
    });
  }

  session.modifiedAt = session.messages.at(-1)?.timestamp || timestamp;
  session.sizeBytes = calculateSize(session.messages);
  return session;
}

export function getWorkspaceOverride(agentId: string, filename: string) {
  return getAgentWorkspaceMap(agentId).get(filename);
}

export function saveWorkspaceOverride(agentId: string, filename: string, content: string) {
  const updatedAt = now();
  getAgentWorkspaceMap(agentId).set(filename, { content, updatedAt });
  return { content, updatedAt };
}
