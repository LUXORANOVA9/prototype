import { evaluateResponse } from './antiPatterns';

self.onmessage = (e: MessageEvent) => {
  const { id, text, prompt } = e.data;
  const result = evaluateResponse(text, prompt);
  self.postMessage({ id, result });
};
