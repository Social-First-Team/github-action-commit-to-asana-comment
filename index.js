const core = require('@actions/core');
const asana = require('asana');

const client = asana.Client.create({defaultHeaders: {"asana-enable": "new_user_task_lists"}}).useAccessToken(process.env.ASANA_PAT);
const TASK_REGEX=/https:\/\/app\.asana\.com\/\d+\/(\d+)\/(\d+)/g;

function getTaskIdsFromCommitMessage(message) {
    console.log('Checking message ' + message + ' for Asana URLs');
    const matches = message.matchAll(TASK_REGEX);
    return Array.from(matches).map(match => match[2]);
}

async function addCommentToTask(taskId, comment) {
    try {
        console.log("Adding comment to task " + taskId);
        await client.tasks.addComment(taskId, {text: comment});
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

function formatCommentAsText(pushInfo, commit) {
    const breakIndex = commit.message.indexOf("\n\n");
    const summary = commit.message.substring(0, breakIndex);
    const message = commit.message.substring(breakIndex + 2);
    return `${commit.author.name} has just pushed a new commit to branch ${pushInfo.branchName} of repository ${pushInfo.repoName}
    
Summary: ${summary}

Message: ${message}

Link: ${commit.url}
`
}

async function processCommit(pushInfo, commit) {
    const taskIds = getTaskIdsFromCommitMessage(commit.message);
    console.log(`Detected ${taskIds.length} Asana Task Ids`);
    if (taskIds.length > 0) {
        const comment = formatCommentAsText(pushInfo, commit);
        for (let i = 0; i < taskIds.length; i++) {
            await addCommentToTask(taskIds[i], comment);
        }
    }
}

function extractPushInfo(payload) {
    const branchName = process.env.GITHUB_REF.split("/")
        .slice(2)
        .join("/")
        .replace(/\//g, "-");
    const repoName = payload.repository.name;
    return {branchName, repoName};
}

async function run() {
    try {
        const payload = require(process.env.GITHUB_EVENT_PATH);
        const pushInfo = extractPushInfo(payload);
        console.log(`Detected ${payload.commits.length} commit(s)`);
        for (let i = 0; i < payload.commits.length; i++) {
            await processCommit(pushInfo, payload.commits[i]);
        }
    } catch (error) {
        core.setFailed(error.message);
    }

}

// noinspection JSIgnoredPromiseFromCall
run()