/**
 * Maps the backend's timeline read model onto the scrubber's commit shape.
 *
 * The API speaks snake_case because that is what the backend serializes, while
 * the panel was written against camelCase. Translating here keeps both contracts
 * honest: the panel renders what it always rendered, and the wire shape is
 * decoded in exactly one place.
 */

import {
  BisectCommit,
  CommitOutcome,
} from "@/components/workspace/CommitTimelineScrubber";
import { BisectCommitRead, SessionTimelineRead } from "@/lib/api/types";

/**
 * The backend only ever reports a verdict it actually observed.
 *
 * `testing` and `untested` are panel-only states for a commit the user is
 * looking at while a run is still in progress, so they are never derived from a
 * stored commit; doing so would report progress the run did not make.
 */
function toPanelOutcome(outcome: BisectCommitRead["outcome"]): CommitOutcome {
  return outcome;
}

export function toPanelCommit(commit: BisectCommitRead): BisectCommit {
  return {
    hash: commit.hash,
    shortHash: commit.short_hash,
    message: commit.message,
    author: commit.author,
    timestamp: commit.timestamp,
    outcome: toPanelOutcome(commit.outcome),
    testOutput: commit.test_output ?? undefined,
    durationSeconds: commit.duration_seconds,
  };
}

export function toPanelCommits(
  timeline: SessionTimelineRead
): BisectCommit[] {
  return timeline.commits.map(toPanelCommit);
}
