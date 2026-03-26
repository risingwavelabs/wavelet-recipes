# Spend Control Agent

Real-time AI/cloud API spend monitoring with automated budget enforcement. When a team exceeds its budget threshold, a webhook fires and an agent automatically throttles the team — creating a closed-loop control system.

## What it shows

- 4 live metrics: total spend, API call count, avg cost per call, active teams
- Spend by team (horizontal bar chart with $50 budget threshold line)
- Spend by model (doughnut chart)
- Budget alerts with live pulsing indicators for over-budget teams
- Agent actions log showing automated throttle decisions
- Recent API calls table with per-call cost

## Closed-loop pattern

```
seed.js             Wavelet              agent.js            Dashboard
  |                    |                    |                    |
  |-- usage events --> |                    |                    |
  |                    |-- budget_alerts -> |                    |
  |                    |   (webhook)       |                    |
  |                    |                    |-- throttle ------> |
  |                    |<- agent_actions ---|                    |
  |                    |                    |                    |
  |                    |------------ live queries -------------> |
```

1. `seed.js` sends API usage events (token counts + costs per team/model)
2. Wavelet continuously evaluates the `budget_alerts` query
3. When a team exceeds $50, Wavelet fires a webhook to `agent.js`
4. The agent records a `throttle` action back into Wavelet
5. The action appears in the dashboard — full visibility into automated decisions

## Run

```bash
# Install RisingWave (if not already)
curl -L https://risingwave.com/sh | sh

# Install Wavelet
npm install @risingwave/wavelet

# Terminal 1 — start Wavelet
npx wavelet dev --config wavelet.config.ts

# Terminal 2 — start the agent (webhook receiver)
node agent.js

# Terminal 3 — start the seed script
node seed.js

# Open the dashboard
open index.html
```

## Config

```
events:
  api_usage:      { team, model, input_tokens, output_tokens, cost_cents, user_id, ts }
  agent_actions:  { team, action, reason, ts }

queries:
  team_spend:     SUM(cost_cents)/100 GROUP BY team
  model_usage:    SUM(cost_cents)/100 GROUP BY model
  budget_alerts:  teams WHERE total_spend > $50 (triggers webhook)
  recent_calls:   last 25 API calls
  action_log:     last 10 agent actions
```

## What to try

1. Open the dashboard and watch spend accumulate in real time
2. Wait for the research team to hit $50 — the budget alert and agent action appear
3. Stop `seed.js` — updates stop immediately
4. Check `agent.js` terminal to see the closed-loop in action
5. Add a new query to `wavelet.config.ts` — it appears automatically after restart
