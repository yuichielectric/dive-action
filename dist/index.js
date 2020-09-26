"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const core = require("@actions/core");
const exec = require("@actions/exec");
const github = require("@actions/github");
const stripAnsi = require("strip-ansi");
function format(output) {
    const ret = ["**The container image has inefficient files.**"];
    let summarySection = false;
    let inefficientFilesSection = false;
    let resultSection = false;
    output.split("\n").forEach((line) => {
        if (line.includes("Analyzing image")) {
            summarySection = true;
            inefficientFilesSection = false;
            resultSection = false;
            ret.push("### Summary");
        }
        else if (line.includes("Inefficient Files:")) {
            summarySection = false;
            inefficientFilesSection = true;
            resultSection = false;
            ret.push("### Inefficient Files");
        }
        else if (line.includes("Results:")) {
            summarySection = false;
            inefficientFilesSection = false;
            resultSection = true;
            ret.push("### Results");
        }
        else if (summarySection || resultSection) {
            ret.push(stripAnsi(line));
        }
        else if (inefficientFilesSection) {
            if (line.startsWith("Count")) {
                ret.push("| Count | Wasted Space | File Paht |");
                ret.push("|---|---|---|");
            }
            else {
                // https://github.com/wagoodman/dive/blob/master/runtime/ci/evaluator.go#L140
                ret.push(`| ${line.slice(0, 5)} | ${line.slice(7, 19)} | ${line.slice(21)} |`);
            }
        }
    });
    return ret.join("\n");
}
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const image = core.getInput("image");
            const configFile = core.getInput("config-file");
            const diveImage = "wagoodman/dive:v0.9";
            yield exec.exec("docker", ["pull", diveImage]);
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
            const execOptions = {
                ignoreReturnCode: true,
                listeners: {
                    stdout: (data) => {
                        output += data.toString();
                    },
                    stderr: (data) => {
                        output += data.toString();
                    },
                }
            };
            const exitCode = yield exec.exec("docker", commandOptions, execOptions);
            if (exitCode === 0) {
                // success
                return;
            }
            const token = core.getInput("github-token");
            const octokit = github.getOctokit(token);
            const comment = Object.assign(Object.assign({}, github.context.issue), { issue_number: github.context.issue.number, body: format(output) });
            yield octokit.issues.createComment(comment);
            core.setFailed(`Scan failed (exit code: ${exitCode})`);
        }
        catch (error) {
            core.setFailed(error);
        }
    });
}
run();
//# sourceMappingURL=index.js.map