import { Bot, User } from 'lucide-react';
import type { ConversationMessage } from '../../types';

interface ConversationViewProps {
  messages: ConversationMessage[];
}

export default function ConversationView({ messages }: ConversationViewProps) {
  if (messages.length === 0) return null;

  return (
    <div className="w-full max-h-48 overflow-y-auto space-y-3 mb-4 px-2">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex items-start gap-2 ${
            msg.role === 'ai' ? 'justify-start' : 'justify-end'
          }`}
        >
          {msg.role === 'ai' && (
            <div className="bg-primary-100 p-1.5 rounded-full flex-shrink-0 mt-0.5">
              <Bot className="w-4 h-4 text-primary-600" />
            </div>
          )}
          <div
            className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-base ${
              msg.role === 'ai'
                ? 'bg-white border border-navy-200 text-navy-700 rounded-tl-sm'
                : 'bg-primary-500 text-white rounded-tr-sm'
            }`}
          >
            {msg.message}
          </div>
          {msg.role === 'patient' && (
            <div className="bg-navy-200 p-1.5 rounded-full flex-shrink-0 mt-0.5">
              <User className="w-4 h-4 text-navy-600" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
