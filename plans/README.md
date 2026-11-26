# FE Plans

| Path                        | Role                                                                                                                                           |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `supervisor/`               | Orchestrator v2.1 process docs. Canonical copies live in `go_be_arbitrage/plans/supervisor/`; this repo keeps a mirror for standalone workers. |
| `wallet-groups/`            | Active feature plan: contract, queue, sessions, checkpoints.                                                                                   |
| `wallet-groups/contract.md` | API/data contract v1.0 (canonical in BE, mirrored here).                                                                                       |

Rules: one folder per feature, no loose plan files at `plans/` root, completed features move to `plans/archive/<feature>/`.
