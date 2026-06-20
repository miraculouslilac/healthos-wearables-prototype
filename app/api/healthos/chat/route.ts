import { NextResponse } from 'next/server'
import type { AdaptivePlan, AgentMessage, PersonalBaseline, WearableDay } from '@/lib/types'
import { HEALTHOS_AGENT_SYSTEM_PROMPT } from '@/lib/healthos/healthosAgent'

type ChatRequest = {
  message: string
  history: AgentMessage[]
  plan: AdaptivePlan
  days: WearableDay[]
  baseline: PersonalBaseline
}

const planItemSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    area: { type: 'string', enum: ['activity', 'nutrition', 'hydration', 'sleep', 'stress', 'check_in', 'medical'] },
    title: { type: 'string' },
    description: { type: 'string' },
    changed: { type: 'boolean' },
  },
  required: ['id', 'area', 'title', 'description', 'changed'],
  additionalProperties: false,
}

const responseSchema = {
  type: 'object',
  properties: {
    answer: { type: 'string', description: 'Короткий естественный ответ пользователю на русском языке.' },
    shouldUpdatePlan: { type: 'boolean', description: 'Нужно ли менять видимый план после этого сообщения.' },
    updatedPlan: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        today: { type: 'array', items: planItemSchema },
        week: { type: 'array', items: planItemSchema },
        safetyNote: { type: 'string' },
        updatedAt: { type: 'string' },
      },
      required: ['title', 'today', 'week', 'safetyNote', 'updatedAt'],
      additionalProperties: false,
    },
  },
  required: ['answer', 'shouldUpdatePlan', 'updatedPlan'],
  additionalProperties: false,
}

const extractText = (response: Record<string, unknown>) => {
  const output = response.output
  if (!Array.isArray(output)) return ''
  for (const item of output) {
    if (!item || typeof item !== 'object') continue
    const content = (item as Record<string, unknown>).content
    if (!Array.isArray(content)) continue
    for (const part of content) {
      if (part && typeof part === 'object' && typeof (part as Record<string, unknown>).text === 'string') {
        return (part as Record<string, unknown>).text as string
      }
    }
  }
  return ''
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'openai_not_configured' }, { status: 503 })

  const body = await request.json() as ChatRequest
  if (!body.message?.trim()) return NextResponse.json({ error: 'message_required' }, { status: 400 })

  const recentDays = body.days.slice(-7)
  const context = {
    today: recentDays.at(-1),
    last7Days: recentDays,
    personalBaseline: body.baseline,
    currentPlan: body.plan,
  }
  const history = body.history.slice(-8).map(message => ({
    role: message.role === 'agent' ? 'assistant' : 'user',
    content: message.text,
  }))

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? 'gpt-5-mini',
      store: false,
      input: [
        {
          role: 'system',
          content: `${HEALTHOS_AGENT_SYSTEM_PROMPT}

Веди настоящий диалог: отвечай на вопрос пользователя, учитывай предыдущие сообщения и не заставляй его выбирать из готовых команд.
Сам решай, нужно ли менять план. Если пользователь просто спрашивает или делится наблюдением, сначала ответь; план меняй только если это полезно или пользователь попросил.
Если данных недостаточно, задай один короткий уточняющий вопрос и оставь план без изменений.
Если меняешь план, верни полный обновлённый план. Пометь changed=true только у реально изменённых пунктов.
При тревожных симптомах убери интенсивную нагрузку и спокойно рекомендуй медицинскую помощь.
Ответ должен быть естественным, коротким и на русском языке.`,
        },
        {
          role: 'system',
          content: `Текущий контекст WHOOP и плана:\n${JSON.stringify(context)}`,
        },
        ...history,
        { role: 'user', content: body.message.trim() },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'healthos_agent_response',
          strict: true,
          schema: responseSchema,
        },
      },
    }),
    cache: 'no-store',
  })

  if (!response.ok) return NextResponse.json({ error: 'openai_request_failed' }, { status: 502 })
  const raw = await response.json() as Record<string, unknown>
  const text = extractText(raw)
  if (!text) return NextResponse.json({ error: 'empty_model_response' }, { status: 502 })

  try {
    return NextResponse.json(JSON.parse(text))
  } catch {
    return NextResponse.json({ error: 'invalid_model_response' }, { status: 502 })
  }
}
