const core = require('@actions/core');

try {
    console.log("In the action code");
    console.log(process.env.GITHUB_EVENT_PATH);
    const payload = require(process.env.GITHUB_EVENT_PATH);
    console.log(payload);
} catch (error) {
    core.setFailed(error.message);
}