# Storyline portfolio QA record — 13 September 2026

Status: complete native concept lessons; locally published and inspected. This record distinguishes native-file logic checks, actual player checks and remaining validation. Deployment evidence is recorded separately in LIVE-VERIFICATION.json when available.

## Exact native sources

| Course | Slides | Feedback layers | Native triggers | Custom variables | Embedded videos |
|---|---:|---:|---:|---:|---:|
| Service Recovery | 38 | 32 | 485 | 48 | 4 |
| Resolve Your First Support Ticket | 41 | 74 | 601 | 54 | 3 |

Service Recovery - Complete Native.story SHA-256:
`721d4bd431cb1db71fff0f12a5e076b3223c381267e58f55e3f15d4374ab5577`

Support Ticket - Complete Native.story SHA-256:
`2d83d484288473a3a02207b84f71586c5c8a6e239022b4e5212b707e8b5f2379`

The full published-file manifest records every Web-export file and hash. Web folder sizes are 61,709,189 bytes for Service Recovery and 27,398,516 bytes for Support Ticket. These are measured exports; 8–12 minutes remains an unmeasured completion-time target.

## Native authoring and media

- PowerPoint layouts were imported into Storyline with editable text and objects. Native controls, states, variables, branching, feedback and reset behavior were added.
- Both final .story files were opened, saved, reopened and Web-published in the installed Storyline desktop application using computer control. The deliverables are native projects, not renamed PowerPoint files.
- Visual inspection covered all base slides and selected feedback, result, resource and video states during production. Final layout corrections included the support submission/debrief controls and the service conversation-guide controls.
- Seven MP4 videos are embedded, with native caption controls and transcript access. The courses remain understandable without narration. The support worked-example video was played with captions and its timed transcript inspected in the final player. MP4/caption/transcript source files are retained.
- The two 52-second portfolio previews show the actual PowerPoint design layouts with captions. They are labeled design previews, not recordings of interaction in Storyline.

## Saved native trigger audit — PASS

The independent audit reads the saved native project XML and interprets its serialized triggers. It is separate from browser execution and from the earlier instructional scoring reference model.

- Service: all 243 five-decision combinations; 13 clear-plan outcomes, 2 credible-recovery outcomes and 228 work-remains outcomes. It checks mandatory conditions, explicit repairs, duplicate sending, read-only review and fresh-attempt reset.
- Support: 1,296 submission combinations across priority, guidance, action, documentation and status; missing-field submission guards; verification-before-closure ordering; invalidation after a new action; frozen review; and attempt reset.
- The machine-readable audit includes the two final .story hashes above. All combinations were evaluated by the audit; they were not all manually played through in the browser.

## Published-player checks

Browser environment: Codex in-app Chromium browser, local HTTP hosting of the actual Storyline Web exports. Checks used visible course controls rather than injected course variables.

- Service: representative clear-plan and explicit-repair paths, a high-score failure, response previews, consequence screens, order/policy resources, personalized read-only review, job-aid launch and replay. The final BACBA path displayed 9/10 and Work remains because it omitted a specific update time. The five criterion reviews retained B/A/C/B/A and 2/2/2/2/1 respectively.
- Support: the guided wrong-printer workflow, guidance and incorrect-choice feedback, approved action, employee verification, useful notes and status selection; the independent stalled-queue workflow; incomplete/failed submissions and retry. Final independent work using P2, KB-202, clearing J-883/resuming LP-07/requesting a TEST label, Dana’s confirmation, all four accurate documentation entries, and Resolved after verification displayed 100/100.
- The final support verification debrief displayed current confirmation = Yes, Resolved after confirmation = Yes, and 20/20. Review and transfer buttons remained available.
- Both embedded PDF job-aid buttons opened the published external_files resources. Download integrity and public deployment checks are recorded with the release verification.
- Selected keyboard/focus behavior and caption controls were inspected. Essential decisions use buttons/fields rather than drag, hover or timed input.

## Remaining validation and limits

- A full screen-reader review, complete keyboard/focus-order audit, every feedback-layer visual review, and broader desktop/mobile browser testing are still needed before making an accessibility-conformance claim.
- Storyline’s last native accessibility-checker runs reported 10 items for Service and 66 for Support. These include long accessible labels and video/input review items; the counts are not a completed human accessibility verdict.
- The support documentation score uses structured selections tied to actual activity. Editable prose and optional reflection are not graded as natural language.
- No learner pilot, measured completion time, measured learning gain or workplace transfer result has been collected. All organizations, tickets, customers and policies are fictional.
- These are Web exports for a portfolio, not LMS/SCORM packages. The portfolio launch does not collect learner scores.
