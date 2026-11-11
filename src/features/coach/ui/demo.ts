import type { Answer, Ask } from '../chat';
import type { ChatMessage, ToolCall } from '../types';

/* The coach chat as a mockup (open the app with `?sandbox&demo`): a made-up model that answers
   from a short script, calling real read-only tools on the phone so the screen shows it working.
   Nothing goes to the server. */

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
let n = 0;
const call = (name: string, args: Record<string, unknown> = {}): ToolCall => ({ id: `demo${n++}`, type: 'function', function: { name, arguments: JSON.stringify(args) } });
const say = (content: string, replies?: string[]): Answer => ({
  message: { role: 'assistant', content, ...(replies ? { tool_calls: [call('suggest_replies', { replies })] } : {}) },
  finish_reason: 'stop',
});

/** What the made-up coach says, turn by turn: the tools it calls, then its answer. */
const SCRIPT: { tools: ToolCall[][]; answer: Answer }[] = [
  {
    tools: [[call('workout_log', { last: 6 })], [call('show_week')]],
    answer: say('Three workouts last week, all done. Your pulls went up again. Want Thursday to lean a bit more on legs?', ['Yes, more legs', 'Keep it as is']),
  },
  {
    tools: [[call('training_guide', { topic: 'legs' })], [call('find_exercises', { query: 'split squat' })]],
    answer: say('Good. Thursday gets split squats and slower squats. The pulls stay as they are.', ['Thanks', 'Why slower?']),
  },
  {
    tools: [[call('training_guide', { topic: 'tempo' })]],
    answer: say('Slower down, more time under load. Same weight, more work for the legs, easy on the knees.'),
  },
];

export const demoAsk: Ask = async (_brief: string, messages: ChatMessage[]) => {
  // Which turn this is: the player's lines so far. Which round: tool rounds since the last one.
  const turns = messages.filter((m) => m.role === 'user').length - 1;
  const since = messages.length - 1 - messages.findLastIndex((m) => m.role === 'user');
  const round = messages.slice(-since || messages.length).filter((m) => m.role === 'assistant').length;
  const step = SCRIPT[Math.min(turns, SCRIPT.length - 1)];
  await wait(1300);
  if (since === 0 || round < step.tools.length) return { message: { role: 'assistant', content: '', tool_calls: step.tools[since === 0 ? 0 : round] }, finish_reason: 'tool_calls' };
  return step.answer;
};
