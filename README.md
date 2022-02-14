# Create cross repository milestones in Github

Follow steps mentioned in the [documentation](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token#creating-a-token) to get access token.


## code
```
// script.js
import { Octokit } from "https://cdn.skypack.dev/@octokit/core";

const token = "YOUR_GITHUB_PERSONAL_ACCESS_TOKEN"
const octokit = new Octokit({ auth: token});
const repos = await octokit.request('GET /user/repos');
const milestones = [{
    "title": "Sprint 1",
    "description": "June 1 to June 7"
    "due_on": "2021-06-01T00:00:00Z"
}, {
    "title": "Sprint 2",
    "description": "June 7 to June 14"
    "due_on": "2021-06-07T00:00:00Z"
}];

for (let r=0; r < repos.length; r++) {
    let repo = repos[r];
    for (let m=0; m < milestones.length; m++) {
        let milestone = milestones[m];
        let payload = {
            owner: repo.owner.login,
            repo: repo.name,
            title: milestone.title,
            description: milestone.description,
            due_on: milestone.due_on
        };
        await octokit.request(`POST /repos/{owner}/{repo}/milestones`, payload);
    }
}
```

![Sample](sample.png)
