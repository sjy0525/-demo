export const WORKFLOW_REPO_URL="https://github.com/sjy0525/-demo.git"
export const WORKFLOW_REPO_BRANCH="master"
export const WORKFLOW_REPO_NAME="-demo.git"
export const TEMPLATE_MERGE_TARGET_BRANCH="master"
export const COMMIT_DIFF_IGNORE_LIST='["package-lock.json"]'

import simpleGit from 'simple-git';
import { execSync } from 'child_process';
import fs from 'fs';
import chalk from 'chalk';

const git = simpleGit();

// 最大更改行数限制
const MAX_LINES = 2000;

// 定义忽略列表（从环境变量获取）
const ignoreList = JSON.parse(process.env.COMMIT_DIFF_IGNORE_LIST as string) || ['pnpm-lock.yaml'];

interface Repo {
  repoURL: string; // 仓库URL
  branchName: string; // 分支名
  repoName: string; // 仓库名
  localPath: string; // 临时目录来存储拉取的代码
}

async function cloneRepo(repo: Repo) {
  if (fs.existsSync(repo.localPath)) {
    try {
      execSync(`rm -rf ${repo.localPath}`);
      console.log('✅ Directory deleted successfully');
    } catch (error) {
      console.error(chalk.red('An error occurred:'), error);
    }
  }
  console.log(`🚀 Cloning ${repo.branchName} from ${repo.repoName} into ${repo.localPath}...`);
  await git.clone(repo.repoURL, repo.localPath, ['--branch', repo.branchName]);
  console.log(chalk.green(`Successfully cloned ${repo.branchName} into ${repo.localPath}!\n`));
}

// 检查提交的修改行数
const checkCommitDiff = async () => {
  // 定义仓库信息
  let sourceRepo: Repo, targetRepo: Repo;

  // 判断是否为线上环境，注入参数
  if (process.env.WORKFLOW_REPO_URL) {
    sourceRepo = {
      repoURL: process.env.WORKFLOW_REPO_URL || '',
      branchName: process.env.WORKFLOW_REPO_BRANCH || '',
      repoName: process.env.WORKFLOW_REPO_NAME || '',
      localPath: './source-repo',
    };

    targetRepo = {
      repoURL: process.env.WORKFLOW_REPO_URL || '',
      branchName: process.env.TEMPLATE_MERGE_TARGET_BRANCH || process.env.WORKFLOW_REPO_TARGET_BRANCH || '',
      repoName: process.env.WORKFLOW_REPO_NAME || '',
      localPath: './target-repo',
    };

    if (targetRepo.branchName === '' || sourceRepo.branchName === '') {
      console.log('Empty repository, skipping~');
      return;
    }
  } else {
    // 线下测试数据……
  }

  // 克隆源仓库和目标仓库
  await cloneRepo(sourceRepo);
  await cloneRepo(targetRepo);

  // 使用simple-git比较两个分支的差异
  const sourceGit = simpleGit(sourceRepo.localPath);
  const targetGit = simpleGit(targetRepo.localPath);

  // 获取源分支最新commit
  const sourceLog = await sourceGit.log();
  const sourceLatestCommit = sourceLog.latest?.hash;

  // 切换到目标分支目录，比较差异
  await targetGit.checkout('.');

  // 初始化 diffArgs 数组
  let diffArgs = [sourceLatestCommit as string];

  console.log(chalk.yellow('Ignore list:'));
  // 添加忽略标记
  ignoreList.forEach((path: string) => {
    console.log(chalk.yellow(`- ${path}`));
    diffArgs = [...diffArgs, `:(exclude)${path}`];
  });

  const diffSummary = await targetGit.diffSummary(diffArgs);

  console.log(chalk.yellow('\n----- Diff Summary -----\n'));
  console.log(chalk.yellow(`Total files changed: ${diffSummary.files.length}`));
  console.log(chalk.yellow(`Insertions: ${diffSummary.insertions} 🟢`));
  console.log(chalk.yellow(`Deletions: ${diffSummary.deletions} 🔴`));
  console.log(chalk.yellow(`Max lines: ${MAX_LINES}`));
  console.log(chalk.yellow('\n------------------------\n'));

  if (diffSummary.insertions >= MAX_LINES || diffSummary.deletions >= MAX_LINES) {
    console.error(chalk.red(`Error: Change exceeds ${MAX_LINES} lines`));
    console.log('🌟🌟🌟 how to resolve: xxxxxxxxxxxxxxxxx');
    process.exit(1);
  } else {
    console.log(chalk.green('✅ Change is within limits.'));
  }
};

// 执行相关任务
checkCommitDiff().catch((error) => {
  console.error(chalk.red('An error occurred during the commit diff check:'), error);
  process.exit(1);
});