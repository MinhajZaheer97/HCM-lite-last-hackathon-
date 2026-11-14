# HCM Lite — AI Assistant Phases and Ownership

This file is the repository copy of the approved AI implementation ownership plan.

| Phase | Implementation tasks | Project owner tasks |
|---|---|---|
| Provider foundation | Build the server-only Gemini client, configuration, limits, and error handling. | Create the Gemini key, configure deployment secrets, choose a supported model. |
| Read-only tools | Build role- and company-scoped company, attendance, leave, payroll, policy, and workforce tools. | Review role-appropriate data exposure. |
| Analytics context | Extend shared metrics, periods, finalized status, source metadata, and insufficient-data handling. | Verify answers against real records. |
| Chat API | Build authenticated `/api/ai/chat`, validation, tool execution, limits, and safe errors. | Configure and test provider availability. |
| Prompt policy | Add grounding, mutation refusal, prompt-injection resistance, and source formatting. | Review wording and refusal behavior. |
| Chat UI | Replace all placeholders with the shared temporary-history assistant. | Perform browser usability and accessibility review. |
| Privacy and abuse protection | Add redaction, throttling, timeouts, safe logs, and no persistence. | Review privacy expectations and monitor usage. |
| Tests and acceptance | Add automated security tests and run lint, tests, and build. | Test all roles, two companies, direct API access, and injection attempts. |
| Documentation | Update environment, deployment, limitations, and demo documentation. | Supply final configuration and approve results. |

**Security rule:** never place `GEMINI_API_KEY` in chat, commits, screenshots, logs, or client-side code.
