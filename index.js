const core = require('@actions/core');
const asana = require('asana');

async function run() {
    try {
        console.log("In the action code");
        console.log(process.env.GITHUB_EVENT_PATH);
        const payload = require(process.env.GITHUB_EVENT_PATH);
        console.log(process.env.ASANA_PAT)
        const client = asana.Client.create().useAccessToken(process.env.ASANA_PAT);
        const me = await client.users.me();
        console.log(me);
    } catch (error) {
        core.setFailed(error.message);
    }

}

// noinspection JSIgnoredPromiseFromCall
run()