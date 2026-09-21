import chalk from 'chalk';
import ora from 'ora';
import boxen from 'boxen';

export const logger = {
  banner() {
    console.log(
      boxen(
        chalk.bold.cyan('🚀 SHAXSIY LOYIHA KONSTRUKTORI (CLI PRO)\n') +
        chalk.gray('Next.js (Public) • React (Admin) • Go Clean Architecture • DevOps'),
        {
          padding: 1,
          margin: 1,
          borderStyle: 'round',
          borderColor: 'cyan',
          title: '✨ create-my-stack v2.0',
          titleAlignment: 'center'
        }
      )
    );
  },

  info(msg) {
    console.log(chalk.blue('ℹ ') + chalk.white(msg));
  },

  success(msg) {
    console.log(chalk.green('✔ ') + chalk.bold.green(msg));
  },

  warning(msg) {
    console.log(chalk.yellow('⚠ ') + chalk.yellow(msg));
  },

  error(msg) {
    console.log(chalk.red('✖ ') + chalk.bold.red(msg));
  },

  spinner(text) {
    return ora({
      text,
      color: 'cyan'
    });
  },

  summaryBox(projectName, details) {
    const content = [
      chalk.bold.green(`🎉 [${projectName}] loyihasi muvaffaqiyatli yaratildi!\n`),
      chalk.bold.white('📦 O\'rnatilgan modullar:'),
      ...details.map((d) => `  ${chalk.cyan('•')} ${d}`),
      chalk.bold.white('\n⚡ Ishni boshlash:'),
      chalk.yellow(`  cd ${projectName}`),
      chalk.gray('  Tafsilotlar va barcha buyruqlar loyiha ichidagi README.md da keltirilgan.')
    ].join('\n');

    console.log(
      boxen(content, {
        padding: 1,
        margin: 1,
        borderStyle: 'double',
        borderColor: 'green'
      })
    );
  }
};
