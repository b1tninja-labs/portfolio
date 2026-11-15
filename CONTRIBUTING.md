# Contributing to the b1tninja-labs portfolio

The portfolio is several dozen repositories planned as one body of work: protocol libraries, reference
libraries and the tools that plan them. This file is how an agent or a person takes a piece of that work and
finishes it. Each project's own `AGENTS.md` and `CONTRIBUTING.md` say how to build and test that project; this
file is about what happens around the code: which work to take, how to hold it, and what counts as done.

## Where things are

| What | Where |
|---|---|
| The work, one issue per obligation row, milestone, project, wave and decision | issues in this repository, titled `[project] row(): summary` for a row |
| Who is doing what, and the state of every item | [Project 1](https://github.com/orgs/b1tninja-labs/projects/1) (private for now) |
| The tools that pick, claim and check work | [projecthub](https://github.com/b1tninja-labs/projecthub) |
| What is in active development | the status site, [labs.b1tninja.com](https://labs.b1tninja.com/) |
| Which projects are worked on, in what order, and what is deliberately not built | `PORTFOLIO.md` in the maintainer's workspace, and each project's `docs/plan.md` |

Project 1 is the authority on the state of work: Status, who holds an item and since when, and the activity
on it. The issues and the site are derived from it.

## Take work from the board, not from your own list

In the maintainer's workspace (`D:\code`), projecthub is installed and every project is checked out beside it.
Anywhere else, install it first:

```bash
python -m pip install "projecthub @ git+https://github.com/b1tninja-labs/projecthub"
```

Then ask for an assignment:

```bash
python -m projecthub pickup --who <your name>
```

Add `--project <name>` to prefer one project. The board decides the order of work, so `pickup` picks the row
and claims it for you before printing it. Work that row and only that row, even if another one looks more
interesting. What it prints, by exit code:

| Exit | Output | What to do |
|---|---|---|
| 0 | `# Your assignment: <project>:<row>` | Read the project's `AGENTS.md`, then do the row |
| 3 | `NO WORK` and the reason | A real answer, often "nothing is Active". Ask the person what to work on; do not go looking for something |
| 4 | `BUSY` | You already hold a claim. Finish, park or block it first |
| 5 | `CANNOT CLAIM` | The Project could not be reached, or the rate budget is low; the message says until when |

The assignment names the directory to work in, the function the row implements, its named test, the
specification it cites, what "finished" means for it, what it depends on and any open decision that names the
project. It ends with the commands that end the work, already filled in with your lease id.

If you cannot run commands, read `.projecthub/packet.md` if the person put one in the repository, and ask what to
work on if there is none.

## While you work

A claim expires (the assignment says when). On long work, renew it before then:

```bash
python -m projecthub leases heartbeat <lease_id>
```

Log progress as it happens. A note renews the claim too. Its text stays on your machine: the board and the
site see only that a note was made, and when.

```bash
python -m projecthub leases note <lease_id> progress "<what changed>"
```

Note kinds are `progress`, `finding`, `test_written` and `pr_opened`. To stop for now and keep your place,
park the row with what the next session needs. It goes back to Ready for whoever comes next:

```bash
python -m projecthub leases park <lease_id> "<where you stopped, what is next>"
```

Found work that is not your row, such as a bug, a missing obligation or a question? Do not fix it on the
side. Propose it, and keep going:

```bash
python -m projecthub leases propose <project> <bug|task|obligation|question> "<title>" --why "<why it matters>"
```

A proposal becomes an issue here in the board's Triage column, and the maintainer accepts or rejects it.

## Ending the work

End every claim one of these ways. The assignment prints them with your lease id filled in.

| You | Run | The item becomes |
|---|---|---|
| opened a pull request | `python -m projecthub leases release <lease_id> pr_opened --pr-url <url>` | In review |
| have to stop part-way | `... release <lease_id> handoff --note "<done, next, watch for>"` | Ready |
| are giving it back | `... release <lease_id> abandoned --note "<why>"` | Ready |
| cannot go on without something | `... block <lease_id> <kind> "<what you need>"` | Blocked |

The kind of a block is `dependency`, `spec_question`, `decision_needed` or `env`. A blocked row waits for a
person. If the decision belongs to the person, block with `decision_needed`, name the options, and stop: do
not pick one and carry on.

## What "done" means

Nothing you run marks a row done, and neither you nor a pull request description is the evidence. When the
commit that implements the row exists, submit it:

```bash
python -m projecthub leases submit <lease_id> <full 40-character sha>
```

The evidence worker then checks the row's named test against that commit, and records a verdict:

- **L1, it asserts:** the test checks something real. `assert True` is not an assertion.
- **L3, it was written for this change:** the test fails on the code before your change and passes after it.
  A test that already passed before proves nothing about your change.
- **L4, it notices a bug:** the test catches at least one deliberately planted defect in the function the row
  names.

A row is done when its verdict passes. For now the maintainer moves the card to Done from a passing verdict;
no tool sets Done on its own. So say "done", "fixed" or "tested" only when a tool's output shows it.

## Rules that hold in every project

- **Read the standard, never remember it.** Cite RFC, ITU-T, NIST and USB specifications by section from the
  `primarysource` tools. A section number is written down only if that section was read.
- **A change comes with a test that fails without it.** Break the code once, watch the test fail, and restore
  it. That is what the evidence check will do too.
- **Respect the sequencing.** At most two projects carry real effort at once. A project whose plan says a
  dependency does not exist yet is blocked, and work on it does not start. `keyproof` and `localns` are plans,
  not projects: there is nothing in them to build until their wave.
- **Commit small, with a message that says why.** No `Co-Authored-By` trailer or any other AI attribution in
  commit messages. Stage files by path; do not commit with `-A` when another agent is in the tree.
- **Keep scratch out of repositories.** Logs, diffs and probe scripts go to a temporary directory. The workspace
  hook refuses `probe_*.py`, `*.log` and `*.out`, and a commit that deletes a markdown heading.
- **Run formatters and linters from the project directory**, never from the workspace root, where one command
  would rewrite every unrelated project.
- **Public means public.** These issues and the site are public. Note text, private repositories and anything
  personal stay out of them.
- **Be gentle with GitHub's limits.** Every agent shares one budget of roughly 5,000 points an hour and 80
  writes a minute. `python -m projecthub budget` shows what is left; projecthub's own tools pace themselves.

## Pull requests

Open the pull request against `main` of the project's own repository, one row per pull request where you can.
Name the row in the description, for example `Refs b1tninja-labs/portfolio#123`, so the issue and the change
find each other. The project's gates (listed in its `CONTRIBUTING.md`) must pass on CI before review.

## Using the tools over MCP

Every command above is also an MCP tool. `python -m projecthub mcp --toolset read` serves the read-only tools
(`status`, `next`, `query`, `graph`, `plan`, ...), and `--toolset work` adds the ones that claim and write.
projecthub's [docs/agents.md](https://github.com/b1tninja-labs/projecthub/blob/main/docs/agents.md) has the
client configuration for Claude Code, Continue and Cline.

## For the maintainer

- **Activate a project** with two fields on its project card on Project 1. Set **Active** to Active: `pickup`
  continues rows already In progress, then starts Ready rows only in Active projects, and the rule allows two
  at a time. With nothing Active it answers `NO WORK` and says so. Move the card's **Status** to In progress: the
  status site leads with those projects, a few at a time.
- **Triage** proposals in the Triage column: move them to Backlog to accept, or close them.
- **Close the loop on evidence**: move a row to Done when its verdict passes.
