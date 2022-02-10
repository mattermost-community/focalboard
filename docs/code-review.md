# Code Review Checklist

Currently, all changes to the product must be reviewed by a [core committer](core-committers.md).

## If you are a community member seeking a review

1. Submit your pull request (PR).
    * Follow the [contribution checklist](../contribution-checklist/).
2. Wait for a reviewer to be assigned.
    * Product managers are on the lookout for new pull requests and usually handle this for you automatically.
    * If you have been working alongside a core committer, feel free to message them for help.
    * When in doubt, ask for help in the [Focalboard](https://community.mattermost.com/core/channels/focalboard) channel on our community server.
    * If you are still stuck, please message Chen Lim (@chenilim on GitHub).
3. [Wait for a review](#if-you-are-awaiting-a-review).
    * Expect some interaction with at least one reviewer within 5 business days (weekdays, Monday through Friday, excluding [statutory holidays](https://docs.mattermost.com/process/working-at-mattermost.html#holidays)).
    * Keep in mind that core committers are geographically distributed around the world and likely in a different time zone than your own.
    * If no interaction has occurred after 5 business days, please [at-mention](https://github.blog/2011-03-23-mention-somebody-they-re-notified/) a reviewer with a comment on your pull request.
4. Make any necessary changes.
    * If a reviewer requests changes, your pull request will disappear from their queue of reviews.
    * Once you've addressed the concerns, please at-mention the reviewer with a comment on your pull request.
5. Wait for your code to be merged.
    * Larger pull requests may require more time to review.
    * Once all reviewers have approved your changes, they will handle merging your code.

## If you are awaiting a review

1. Wait patiently for reviews to complete.
    * Expect some interaction with each of your reviewers within 5 business days.
    * There is no need to explicitly mention them on the pull request or to explicitly reach out on our community server.
2. Make any necessary changes.
    * If a reviewer requests changes, your pull request will disappear from their queue of reviews.
    * Once you've addressed the concerns, assign them as a reviewer again to put your pull request back in their queue.

## If you are a core committer asked to give a review

1. Respond promptly to requested reviews.
    * Assume the requested review is urgent and blocking unless explicitly stated otherwise.
    * Try to interact with the author within 2 business days.
    * Configure the GitHub plugin to automate notifications.
    * Review your outstanding requested reviews daily to avoid blocking authors.
    * Prioritize earlier milestones when reviewing to help with the release process.
    * Responding quickly doesn't necessarily mean reviewing quickly! Just don't leave the author hanging.
2. Feel free to clarify expectations with the author.
    * If the code is experimental, they may need only a cursory glance and thumbs up to proceed with productizing their changes.
    * If the review is large or complex, additional time may be required to complete your review. Be upfront with the author.
    * If you are not comfortable reviewing the code, avoid "rubber stamping" the review. Be honest with the author and ask them to consider another core committer.
3. Never rush a review.
    * Take the time necessary to review the code thoroughly.
    * Don't be afraid to ask for changes repeatedly until all concerns are addressed.
    * Feel free to challenge assumptions and timelines. Rushing a change into a patch release may cause more harm than good.
4. Avoid leaving a review hanging.
    * Try to accept or reject the review instead of just leaving comments.
5. Merge the pull request.
    * Do not merge if there are outstanding changes requested.
    * Merge the pull request, and delete the branch if not from a fork.
