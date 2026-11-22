import type { Config } from "release-it";

export default {
  git: {
    commitMessage: "chore(release): v${version}",
    tagName: "v${version}",
  },
  hooks: {
    "after:bump": "tsx scripts/release.ts",
  },
  npm: {
    publish: false,
  },
} satisfies Config;
