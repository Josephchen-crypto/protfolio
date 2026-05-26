---
title: "Toka Project Kickoff"
date: "2026-05-26"
summary: "A firsthand account of joining the Toka project in August 2023 — navigating corporate-grade git workflows, branch naming conventions, and the grueling late-night crunch that came with learning the ropes."
lang: "en"
category: "Essay"
paired: "toka-project-kickoff-zh"
cover: "https://raw.githubusercontent.com/Josephchen-crypto/pics/master/ChatGPT%20Image%202026%E5%B9%B45%E6%9C%8818%E6%97%A5%2020_20_55.png"
---

# Toka Project Kickoff

The project officially kicked off in August 2023. I joined the company in July and spent my first month getting familiar with its rules, processes, and workflows. During that time I also chipped in on small features for other teams' projects, while learning how each department handled issues at every stage — from feature research and development, through testing and bug fixes, all the way to launch. Every release cycle involved multiple departments, each with its own set of responsibilities.

I came into this as someone who'd been in the industry for years but with little exposure to formal development processes. Most companies I've worked for, constrained by capital and resources, had no choice but to move fast and iterate quickly. They couldn't afford to spend as much time perfecting every detail the way a large corporation with abundant resources can.

In August I was assigned to Toka, a brand new project. There were about two weeks of kickoff meetings to understand the project background and the client. Based on my estimate, the materials for these meetings had been in preparation for about a month — the team had apparently been in Mexico conducting thorough due diligence on the client, their business operations, and organizational background, before any PRD or kickoff meeting was even scheduled.

The kickoff meetings covered the client's profile, project milestones, goals for each phase, and the leads assigned to each department. I was put in charge of the Android side, while an iOS developer who'd been with the company for three years handled that end. He was also responsible for mentoring me through the early stages of the project setup.

## Development Process Rules and Regulations

What surprised me was how much more structured the development governance was compared to every small company I'd worked at before. Of course, that came with a lot more process overhead. I quickly realized how valuable these conventions were for a project's longevity — though getting familiar with them at first felt clumsy. It was just a matter of time before it clicked.

The git repository management alone was a headache. Everything in the early stages was nothing like the simple workflows I'd been used to. First, there was the permission model: the company had a dedicated platform for managing git access, and any operation on a repository required an application and approval. So even though I was the lead for this project, the repository wasn't mine to do with as I pleased.

Worse, shortly after kickoff I made a mistake that required reverting code — which needed authorization from the platform admin, plus a report to the project manager first. Any attempt to work around this mechanism didn't just fail; it made things worse. The invisible pressure from all of this meant I had to triple-check every merge and branch operation.

## Branch Naming Convention

The company had deep expertise in this area. Every branch followed a strict naming format:

```
(feature/bugfix)-(version<month(a/b)>)-(feature_name)-(task_id)-(dev_name)
```

For example: `feature-5a-aml_pin-123423-joseph`

Here's what each part means:

- **feature / bugfix**: Instantly tells you whether this branch is for new development or bug fixes.
- **Version cycle**: The company divides each month into two halves — "a" for the first half, "b" for the second. Every quarter, large features get broken down into smaller tasks assigned to developers. Each new feature needs a fresh branch tagged with its version month — so a task in the first half of May gets tagged `5a`.
- **Feature name**: The company's OA system was integrated with the git platform. Clicking "create branch" on a task ticket would automatically name the branch based on the ticket's info. That said, we still had to manually add some details like the version tag.
- **Task ID**: Auto-filled by the system, making it easy to locate the ticket after finishing a feature, switch it to "pending verification" status, and let CI/CD pick it up for automated build and testing.
- **Developer name**: Branches must carry the developer's initials or short name, so team members can identify their own feature branches in a multi-developer project.

## Crunch Mode

All this process overhead takes time, which runs directly counter to the project's breakneck pace. But the cost of a mistake would have been even greater — and that created an impossible situation for me. With only one developer on the project, I had to both learn all the company's processes and deliver against an impossibly compressed schedule at the same time. The result was inevitable: I was pulling late nights every day. Even after getting home, I'd be at my desk hammering away at the keyboard to get features done.