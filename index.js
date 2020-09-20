const core = require("@actions/core");
const exec = require("@actions/exec");
const github = require("@actions/github");

function format(output) {
  const ret = [];
  let resultSection = false;
  let inefficientFilesSection = false;
  output.split("\n").forEach((line) => {
    if (line.includes("Analyzing image")) {
      resultSection = true;
      inefficientFilesSection = false;
      ret.push("### Results");
    } else if (line.includes("Inefficient Files:")) {
      resultSection = false;
      inefficientFilesSection = true;
      ret.push("### Inefficient Files");
    } else if (line.includes("Results:")) {
      resultSection = false;
      inefficientFilesSection = false;
    } else if (resultSection) {
      ret.push(line);
    } else if (inefficientFilesSection) {
      ret.push(line);
    }
  });
  return ret.join("\n");
}

async function run() {
  try {
    const image = core.getInput("image");
    const configFile = core.getInput("config-file");

    const diveImage = "wagoodman/dive:v0.9";
    await exec.exec("docker", ["pull", diveImage]);

    const commandOptions = [
      "run",
      "-e",
      "CI=true",
      "-e",
      "DOCKER_API_VERSION=1.37",
      "--rm",
      "--mount",
      `type=bind,source=${configFile},target=/.dive-ci`,
      "-v",
      "/var/run/docker.sock:/var/run/docker.sock",
      diveImage,
      "--ci-config",
      "/.dive-ci",
      image,
    ];
    let output = "";
    const execOptions = {};
    execOptions.ignoreReturnCode = true;
    execOptions.listeners = {
      stdout: (data) => {
        output += data.toString();
      },
      stderr: (data) => {
        output += data.toString();
      },
    };
    const exitCode = await exec.exec("docker", commandOptions, execOptions);
    if (exitCode === 0) {
      // success
      return;
    }

    const stripAnsi = require("strip-ansi");
    const token = core.getInput("github-token");
    const octokit = github.getOctokit(token);
    const comment = {
      ...github.context.issue,
      issue_number: github.context.issue.number,
      body: format(output),
    };
    await octokit.issues.createComment(comment);
    core.setFailed(`Scan failed (exit code: ${exitCode})`);
  } catch (error) {
    core.setFailed(error);
  }
}

run();
