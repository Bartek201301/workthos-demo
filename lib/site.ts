// Site-wide facts in one place. Every link to the repository and the install
// box read them from here, so the human can change them in one edit.
export const site = {
  name: "workthos",
  repositoryUrl: "https://github.com/Bartek201301/workthos",
  installCommand:
    "git clone https://github.com/Bartek201301/workthos.git && cd workthos && node bin/workthos.mjs init <project dir> <lead dir>",
} as const;
