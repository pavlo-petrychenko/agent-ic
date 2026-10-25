import { createServer } from 'node:http';
import { parseArgs } from 'node:util';

const { values: options } = parseArgs({
  options: {
    port: { type: 'string', default: '4010' },
    latency: { type: 'string', default: '200-900' },
    'failure-rate': { type: 'string', default: '0.03' },
  },
});
const PORT = Number(options.port);
const LATENCY_RANGE = options.latency.split('-').map(Number);
const FAILURE_RATE = Number(options['failure-rate']);
const EMBEDDING_DIMENSIONS = 1024;
const USAGE = { input: 120, output: 40 };
const REPLY_TOOL = 'reply';
const FALLBACK_REPLY = 'Thanks for your message! A barista will be happy to help you with that.';

const Route = {
  Health: '/health',
  ChatCompletions: '/v1/chat/completions',
  Messages: '/v1/messages',
  Embeddings: '/v1/embeddings',
};

const REPLIES = [
  {
    keywords: ['hour', 'open', 'close', 'sunday', 'годин', 'відкрит'],
    text: 'We are open every day from 8:00 to 21:00, and on Sundays from 9:00 to 21:00.',
  },
  {
    keywords: ['deliver', 'доставк'],
    text: 'Yes, we deliver within 3 km every day from 10:00 to 20:00. Delivery is free from 300 UAH.',
  },
  {
    keywords: ['oat', 'milk', 'молок'],
    text: 'Yes, we have oat, almond and lactose-free milk at no extra charge.',
  },
  {
    keywords: ['book', 'table', 'reserv', 'стол', 'брон'],
    text: 'Sure! Tell me the date, the time and how many guests, and I will book a table for you.',
  },
  {
    keywords: ['menu', 'eat', 'cake', 'desert', 'dessert', 'меню'],
    text: 'Today we have cheesecake, croissants and our seasonal pumpkin latte.',
  },
  {
    keywords: ['where', 'address', 'locat', 'адрес'],
    text: 'We are at Rynok Square 10, Lviv, right next to the town hall.',
  },
  {
    keywords: ['wifi', 'wi-fi', 'password'],
    text: 'Wi-Fi is free: network Kavarnia, the password is on your receipt.',
  },
  {
    keywords: ['complain', 'bad', 'cold', 'wrong', 'скарг'],
    text: 'I am sorry about that! I have passed it to our manager, who will contact you shortly.',
  },
  {
    keywords: ['price', 'cost', 'how much', 'цін'],
    text: 'A cappuccino is 75 UAH, a latte is 80 UAH and a croissant is 60 UAH.',
  },
];

const STRING_HINTS = [
  { keys: ['date', 'day'], value: 'Saturday, 19:00' },
  { keys: ['time', 'hour'], value: '19:00' },
  { keys: ['name'], value: 'Olena' },
  { keys: ['phone'], value: '+380 67 123 45 67' },
  { keys: ['email'], value: 'guest@example.com' },
];
const NUMBER_HINTS = [{ keys: ['guest', 'people', 'person', 'seat'], value: 2 }];

const hinted = (hints, key) => {
  const lower = String(key).toLowerCase();
  const match = hints.find((hint) => hint.keys.some((candidate) => lower.includes(candidate)));
  return match ? match.value : undefined;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const latency = () => {
  const [min, max] = LATENCY_RANGE;
  return min + Math.floor(Math.random() * Math.max(1, (max ?? min) - min));
};

const hash = (text) =>
  [...text].reduce((value, char) => (value * 31 + char.charCodeAt(0)) >>> 0, 7);

const textOf = (content) => {
  if (typeof content === 'string') {
    return content;
  }
  if (Array.isArray(content)) {
    return content.map((part) => (typeof part === 'string' ? part : (part?.text ?? ''))).join(' ');
  }
  return '';
};

const lastUserText = (messages) => {
  const user = [...(messages ?? [])].reverse().find((message) => message.role === 'user');
  return user ? textOf(user.content) : '';
};

const replyFor = (question) => {
  const lower = question.toLowerCase();
  const match = REPLIES.find((reply) => reply.keywords.some((keyword) => lower.includes(keyword)));
  return match ? match.text : FALLBACK_REPLY;
};

const firstType = (schema) =>
  Array.isArray(schema.type) ? schema.type.find((type) => type !== 'null') : schema.type;

const sample = (schema, key, question) => {
  if (!schema || typeof schema !== 'object') {
    return replyFor(question);
  }
  if (schema.const !== undefined) {
    return schema.const;
  }
  if (Array.isArray(schema.enum) && schema.enum.length > 0) {
    return schema.enum[hash(question + key) % schema.enum.length];
  }
  const variants = schema.anyOf ?? schema.oneOf;
  if (Array.isArray(variants) && variants.length > 0) {
    return sample(
      variants.find((variant) => firstType(variant) !== 'null') ?? variants[0],
      key,
      question,
    );
  }
  switch (firstType(schema) ?? (schema.properties ? 'object' : 'string')) {
    case 'object':
      return Object.fromEntries(
        Object.entries(schema.properties ?? {}).map(([name, property]) => [
          name,
          sample(property, name, question),
        ]),
      );
    case 'array':
      return Array.from({ length: Math.max(1, schema.minItems ?? 1) }, () =>
        sample(schema.items, key, question),
      );
    case 'number':
    case 'integer':
      return hinted(NUMBER_HINTS, key) ?? schema.minimum ?? 1;
    case 'boolean':
      return true;
    default:
      return hinted(STRING_HINTS, key) ?? replyFor(question);
  }
};

const DEFAULT_OUTPUT = {
  type: 'object',
  properties: { messages: { type: 'array', items: { type: 'string' } } },
};

const chatCompletion = (body) => {
  const question = lastUserText(body.messages);
  const tools = body.tools ?? [];
  const forced = body.tool_choice?.function?.name;
  const tool = tools.find((candidate) => candidate.function?.name === (forced ?? REPLY_TOOL));
  const usage = {
    prompt_tokens: USAGE.input,
    completion_tokens: USAGE.output,
    total_tokens: USAGE.input + USAGE.output,
  };
  const base = {
    id: `chatcmpl-${Date.now()}`,
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model: body.model,
    usage,
  };
  if (tool) {
    const args = sample(tool.function.parameters, tool.function.name, question);
    return {
      ...base,
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: null,
            tool_calls: [
              {
                id: 'call-mock',
                type: 'function',
                function: { name: tool.function.name, arguments: JSON.stringify(args) },
              },
            ],
          },
          finish_reason: 'tool_calls',
        },
      ],
    };
  }
  const schema =
    body.response_format?.json_schema?.schema ?? (body.response_format ? DEFAULT_OUTPUT : null);
  const content = schema ? JSON.stringify(sample(schema, 'root', question)) : replyFor(question);
  return {
    ...base,
    choices: [{ index: 0, message: { role: 'assistant', content }, finish_reason: 'stop' }],
  };
};

const anthropicMessage = (body) => {
  const question = lastUserText(body.messages);
  const tools = body.tools ?? [];
  const forced = body.tool_choice?.type === 'tool' ? body.tool_choice.name : null;
  const tool =
    tools.find((candidate) => candidate.name === (forced ?? REPLY_TOOL)) ??
    (forced ? tools[0] : null);
  const base = {
    id: `msg-${Date.now()}`,
    type: 'message',
    role: 'assistant',
    model: body.model,
    stop_sequence: null,
    usage: { input_tokens: USAGE.input, output_tokens: USAGE.output },
  };
  if (tool) {
    return {
      ...base,
      content: [
        {
          type: 'tool_use',
          id: 'call-mock',
          name: tool.name,
          input: sample(tool.input_schema, tool.name, question),
        },
      ],
      stop_reason: 'tool_use',
    };
  }
  const schema = body.output_format?.schema ?? body.output_config?.format?.schema ?? null;
  const text = schema ? JSON.stringify(sample(schema, 'root', question)) : replyFor(question);
  return { ...base, content: [{ type: 'text', text }], stop_reason: 'end_turn' };
};

const embeddings = (body) => {
  const inputs = Array.isArray(body.input) ? body.input : [body.input ?? ''];
  const dimensions = body.dimensions ?? EMBEDDING_DIMENSIONS;
  return {
    object: 'list',
    model: body.model,
    data: inputs.map((input, index) => ({
      object: 'embedding',
      index,
      embedding: Array.from(
        { length: dimensions },
        (_, position) => ((hash(String(input)) + position) % 1000) / 1000,
      ),
    })),
    usage: { prompt_tokens: inputs.length, total_tokens: inputs.length },
  };
};

const HANDLERS = {
  [Route.ChatCompletions]: chatCompletion,
  [Route.Messages]: anthropicMessage,
  [Route.Embeddings]: embeddings,
};

const readBody = async (request) => {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }
  return chunks.length > 0 ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {};
};

const send = (response, status, body) => {
  response.writeHead(status, { 'content-type': 'application/json' });
  response.end(JSON.stringify(body));
};

const log = (fields) =>
  process.stdout.write(`${JSON.stringify({ time: new Date().toISOString(), ...fields })}\n`);

const handle = async (request, response) => {
  const path = (request.url ?? '').split('?')[0];
  if (request.method === 'GET' && path === Route.Health) {
    send(response, 200, { status: 'ok' });
    return;
  }
  const handler = request.method === 'POST' ? HANDLERS[path] : undefined;
  if (!handler) {
    send(response, 404, {
      error: { message: `no route ${request.method} ${path}`, type: 'not_found' },
    });
    return;
  }
  const started = Date.now();
  try {
    const body = await readBody(request);
    await sleep(path === Route.Embeddings ? 20 : latency());
    if (path !== Route.Embeddings && Math.random() < FAILURE_RATE) {
      send(response, 503, {
        error: { message: 'mock llm is overloaded, try again', type: 'overloaded' },
      });
      log({
        level: 'warn',
        msg: 'mock llm failure injected',
        path,
        model: body.model,
        status: 503,
        durationMs: Date.now() - started,
      });
      return;
    }
    send(response, 200, handler(body));
    log({
      level: 'info',
      msg: 'mock llm answered',
      path,
      model: body.model,
      status: 200,
      durationMs: Date.now() - started,
    });
  } catch (error) {
    send(response, 400, { error: { message: String(error), type: 'invalid_request' } });
    log({ level: 'error', msg: 'mock llm bad request', path, status: 400, error: String(error) });
  }
};

const server = createServer((request, response) => {
  void handle(request, response);
});

server.listen(PORT, '0.0.0.0', () => log({ level: 'info', msg: 'mock llm listening', port: PORT }));
