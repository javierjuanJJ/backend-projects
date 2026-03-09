const args = process.argv.slice(2) // Solo argumentos relevantes

if (args.length !== 1) {
    console.error('❌ Solo se puede poner un parametro')
    process.exit(1)
}

// 1. Recuperar la carpeta a listar
const GITHUB_USERNAME = args[0];
const GITHUB_API_URL = `https://api.github.com/users/${GITHUB_USERNAME}/events`;


try {
    const response = await fetch(GITHUB_API_URL, {
        headers: {
            Accept: "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        },
    });

    if (response.status === 304) {
        console.log("304 Not Modified - Using cached data.");
        return;
    }

    if (response.status === 403) {
        const error = await response.json();
        console.error("403 Forbidden:", error.message);
        return;
    }

    if (response.status === 503) {
        console.error("503 Service Unavailable - GitHub API is down, try again later.");
        return;
    }

    if (!response.ok) {
        console.error(`Unexpected error: HTTP ${response.status}`);
        return;
    }

    // 200 OK
    const events = await response.json();
    const formatted = formatEvents(events);

    console.log("Output:");
    formatted.forEach((line) => console.log(line));

} catch (error) {
    console.error("Network error:", error.message);
}

function formatEvents(events) {
    const output = [];

    for (const event of events) {
        const repo = event.repo.name;

        switch (event.type) {
            case "PushEvent": {
                const commitCount = event.payload.commits?.length ?? 0;
                output.push(`- Pushed ${commitCount} commit${commitCount !== 1 ? "s" : ""} to ${repo}`);
                break;
            }
            case "IssuesEvent": {
                const action = event.payload.action;
                if (action === "opened") {
                    output.push(`- Opened a new issue in ${repo}`);
                } else {
                    output.push(`- ${action} an issue in ${repo}`);
                }
                break;
            }
            case "WatchEvent":
                output.push(`- Starred ${repo}`);
                break;
            case "ForkEvent":
                output.push(`- Forked ${repo}`);
                break;
            case "PullRequestEvent":
                output.push(`- ${event.payload.action} a pull request in ${repo}`);
                break;
            case "CreateEvent":
                output.push(`- Created a new ${event.payload.ref_type} in ${repo}`);
                break;
            default:
                output.push(`- ${event.type.replace("Event", "")} activity in ${repo}`);
        }
    }

    return output;
}
