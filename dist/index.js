"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const GitHub = __importStar(require("@actions/github"));
const discord_1 = __importDefault(require("./helpers/discord"));
const { GITHUB_RUN_ID, GITHUB_WORKFLOW } = process.env;
function wordToUpperCase(word) {
    return word[0].toUpperCase() + word.substring(1, word.length).toLowerCase();
}
function workflowStatusFromJobs(jobs) {
    let statuses = jobs.map(j => j.status);
    if (statuses.includes('cancelled')) {
        return 'Cancelled';
    }
    if (statuses.includes('failure')) {
        return 'Failure';
    }
    return 'Success';
}
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (GITHUB_RUN_ID == undefined) {
                core.setFailed('Unable to locate the current run id... Something is very wrong');
            }
            else {
                const githubToken = core.getInput('github-token', { required: true });
                const discordWebhook = core.getInput('discord-webhook', { required: true });
                const username = core.getInput('username');
                const avatarURL = core.getInput('avatar-url');
                const includeDetails = core.getInput('include-details').trim().toLowerCase() === 'true' || false;
                const colorSuccess = parseInt(core.getInput('color-success').trim().replace(/^#/g, ''), 16);
                const colorFailure = parseInt(core.getInput('color-failure').trim().replace(/^#/g, ''), 16);
                const colorCancelled = parseInt(core.getInput('color-cancelled').trim().replace(/^#/g, ''), 16);
                const inputTitle = core.getInput('title');
                const inputDescription = core.getInput('description');
                core.setSecret(githubToken);
                core.setSecret(discordWebhook);
                const octokit = GitHub.getOctokit(githubToken);
                const context = GitHub.context;
                octokit.actions.listJobsForWorkflowRun({
                    owner: context.repo.owner,
                    repo: context.repo.repo,
                    run_id: parseInt(GITHUB_RUN_ID, 10)
                })
                    .then(response => {
                    let workflowJobs = response.data.jobs;
                    let jobData = workflowJobs
                        .filter(j => j.status === 'completed')
                        .map(j => ({ name: j.name, status: j.conclusion, url: j.html_url }));
                    let workflowStatus = workflowStatusFromJobs(jobData);
                    let color = workflowStatus === 'Success' ? colorSuccess : (workflowStatus === 'Failure' ? colorFailure : colorCancelled);
                    let payload = {
                        username: username,
                        avatar_url: avatarURL,
                        embeds: [
                            {
                                author: {
                                    name: context.actor,
                                    url: `https://github.com/${context.actor}`,
                                    icon_url: `https://github.com/${context.actor}.png`
                                },
                                title: inputTitle.replace('{{STATUS}}', workflowStatus) || `[${context.repo.owner}/${context.repo.repo}] ${GITHUB_WORKFLOW}: ${workflowStatus}`,
                                url: `https://github.com/${context.repo.owner}/${context.repo.repo}/actions/runs/${GITHUB_RUN_ID}`,
                                description: inputDescription.replace('{{STATUS}}', workflowStatus) || undefined,
                                color: color
                            }
                        ]
                    };
                    if (includeDetails) {
                        let fields = [];
                        jobData.forEach(jd => {
                            fields.push({
                                name: jd.name,
                                value: `[\`${jd.status}\`](${jd.url})`,
                                inline: true
                            });
                        });
                        payload.embeds[0].fields = fields;
                    }
                    discord_1.default(payload, discordWebhook);
                })
                    .catch(error => {
                    core.setFailed(error.message);
                });
            }
        }
        catch (error) {
            core.setFailed(error.message);
        }
    });
}
run();
