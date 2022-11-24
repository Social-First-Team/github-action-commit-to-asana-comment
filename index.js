const core = require('@actions/core');
const asana = require('asana');

const client = asana.Client.create({defaultHeaders: {"asana-enable": "new_user_task_lists"}}).useAccessToken(process.env.ASANA_PAT);
const TASK_REGEX=/https:\/\/app\.asana\.com\/\d+\/(\d+)\/(\d+)/g;

function getTaskIdsFromCommitMessage(message) {
    console.log('Checking message ' + message + ' for Asana URLs');
    const matches = message.matchAll(TASK_REGEX);
    return Array.from(matches).map(match => match[2]);
}

async function addCommentToTask(taskId, htmlComment) {
    try {
        console.log("Adding comment to task " + taskId);
        const result = await client.tasks.addComment(taskId, {html_text: htmlComment});
    } catch (error) {
        console.error(error.message);
        console.error(error);
    }
}

function formatCommentAsHtml(commit) {
    const breakIndex = commit.message.indexOf("\n\n");
    const summary = commit.message.substring(0, breakIndex);
    const message = commit.message.substring(breakIndex + 2);
    return `<body> ${commit.author.name} has just pushed a new commit
<strong>Summary</strong>: ${summary}
<strong>Message</strong>: ${message}
<strong>Link</strong>: <a href="${commit.url}">${commit.url}</a> 
</body>`
}

async function processCommit(commit) {
    const taskIds = getTaskIdsFromCommitMessage(commit.message);
    console.log(`Detected ${taskIds.length} Asana Task Ids`);
    if (taskIds.length > 0) {
        const htmlComment = formatCommentAsHtml(commit);
        console.log(htmlComment);
        for (let i = 0; i < taskIds.length; i++) {
            await addCommentToTask(taskIds[i], htmlComment);
        }
    }
}

async function run() {
    try {
        const payload = require(process.env.GITHUB_EVENT_PATH);
        console.log(`Detected ${payload.commits.length} commit(s)`);
        for (let i = 0; i < payload.commits.length; i++) {
            await processCommit(payload.commits[i]);
        }
    } catch (error) {
        core.setFailed(error.message);
    }

}

// noinspection JSIgnoredPromiseFromCall
run()