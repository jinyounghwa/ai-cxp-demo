import { createStore } from './store';
import { seedCallSessions, seedCallMessages } from '@/data/callSeed';
import type { ConversationSession, BotMessage, Channel } from '@/types';

interface ChatState {
  sessions: ConversationSession[];
  messages: Record<string, BotMessage[]>; // sessionId -> messages
  activeSessionId: string | null;
}

export const chatStore = createStore<ChatState>({
  sessions: seedCallSessions,
  messages: seedCallMessages,
  activeSessionId: null,
});

export function startSession(channel: Channel, customerName: string, userId: string): ConversationSession {
  const id = `S-${Date.now().toString(36)}`;
  const session: ConversationSession = {
    id, userId, customerName, channel,
    startedAt: Date.now(), endedAt: null,
    status: 'active', messageCount: 0,
  };
  chatStore.setState((s) => ({
    sessions: [session, ...s.sessions],
    messages: { ...s.messages, [id]: [] },
    activeSessionId: id,
  }));
  return session;
}

export function endSession(id: string, status: ConversationSession['status'] = 'ended') {
  chatStore.setState((s) => ({
    sessions: s.sessions.map((x) =>
      x.id === id ? { ...x, status, endedAt: Date.now() } : x
    ),
  }));
}

export function addMessage(msg: BotMessage) {
  chatStore.setState((s) => ({
    messages: {
      ...s.messages,
      [msg.sessionId]: [...(s.messages[msg.sessionId] || []), msg],
    },
    sessions: s.sessions.map((x) =>
      x.id === msg.sessionId ? { ...x, messageCount: x.messageCount + 1 } : x
    ),
  }));
}

export function getMessages(sessionId: string): BotMessage[] {
  return chatStore.getState().messages[sessionId] || [];
}
