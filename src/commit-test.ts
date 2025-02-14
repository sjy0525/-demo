import simpleGit from 'simple-git';
import path from 'path';
import fs from 'fs';

// 初始化 simple-git
const git = simpleGit();

// 通过环境变量获取信息
const repoUrl = process.env.REPO_URL;
const branchName = process.env.BRANCH_NAME;
const targetBranchName = process.env.TARGET_BRANCH_NAME;

async function getLatestCommit() {
  try {
    const repoDir = path.join(__dirname, 'repo');

    // 如果已存在，则删除该目录
    if (fs.existsSync(repoDir)) {
      fs.rmdirSync(repoDir, { recursive: true });
    }

    // 克隆仓库
    await git.clone(repoUrl, repoDir);

    // 切换到指定分支
    await git.cwd(repoDir).checkout(branchName);

    // 获取最新的提交信息
    const log = await git.log();
    const latestCommit = log.latest;

    // 正则表达式，匹配<类型>:[<单号>] <描述> 可根据需求自行设置
    const commitMessageRegex = /^(feat|fix|refactor):\s*\[\d+\]\s+.+$/;
    // 检查提交信息是否符合规范
    const isValid = commitMessageRegex.test(latestCommit.message);

    if (isValid) {
      console.log('Commit message is valid.');
    } else {
      console.log('Commit message is invalid.');
      process.exit(1); // 中断 pipeline
    }
  } catch (error) {
    console.error('Error getting the latest commit:', error);
    process.exit(1); // 中断 pipeline
  }
}

// 检查目标分支到当前分支之间的所有提交信息
async function checkCommitsInRange() {
  try {
    const repoDir = path.join(__dirname, 'repo');
    
    // 获取目标分支到当前分支之间的所有提交
    const logData = await git.cwd(repoDir).log({
      from: targetBranchName,
      to: branchName,
    });

    const commitMessageRegex = /^(feat|fix|refactor):\s*\[\d+\]\s+.+$/;

    for (const commit of logData.all) {
      const isValid = commitMessageRegex.test(commit.message);
      if (!isValid) {
        console.log(`Commit message "${commit.message}" is invalid.`);
        process.exit(1); // 中断 pipeline
      }
    }
    console.log('All commit messages are valid.');
  } catch (error) {
    console.error('Error checking commits in range:', error);
    process.exit(1); // 中断 pipeline
  }
}

// 调用函数
getLatestCommit();
checkCommitsInRange();