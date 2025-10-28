#!/usr/bin/env bun

import { existsSync, mkdirSync, symlinkSync, unlinkSync, lstatSync } from "fs";
import { resolve, join } from "path";
import { readdir } from "fs/promises";
import { command, positional, string, subcommands, run } from "cmd-ts";

const SKILLS_DIR = resolve(import.meta.dir);
const CLAUDE_SKILLS_DIR = join(process.env.HOME!, ".claude", "skills");

interface Skill {
  name: string;
  path: string;
  linked: boolean;
}

async function getAvailableSkills(): Promise<Map<string, Skill>> {
  const entries = await readdir(SKILLS_DIR, { withFileTypes: true });
  const skills = new Map<string, Skill>();

  for (const entry of entries) {
    if (entry.isDirectory() && !entry.name.startsWith(".") && entry.name !== "node_modules") {
      const skillPath = join(SKILLS_DIR, entry.name);
      const targetPath = join(CLAUDE_SKILLS_DIR, entry.name);
      const isLinked = existsSync(targetPath) && lstatSync(targetPath).isSymbolicLink();

      skills.set(entry.name, {
        name: entry.name,
        path: skillPath,
        linked: isLinked,
      });
    }
  }

  return skills;
}

function ensureClaudeSkillsDir(): void {
  if (!existsSync(CLAUDE_SKILLS_DIR)) {
    mkdirSync(CLAUDE_SKILLS_DIR, { recursive: true });
  }
}

// Add command
const addCommand = command({
  name: "add",
  description: "Add a skill from current path",
  args: {
    skill: positional({
      type: string,
      displayName: "skill",
      description: "Name of the skill to add",
    }),
  },
  handler: async ({ skill: skillName }) => {
    const skills = await getAvailableSkills();
    const skill = skills.get(skillName);

    if (!skill) {
      console.error(`Skill "${skillName}" not found in current directory`);
      console.log("\nAvailable skills:");
      skills.forEach(s => console.log(`  ${s.name}${s.linked ? " (installed)" : ""}`));
      process.exit(1);
    }

    if (skill.linked) {
      console.log(`Skill "${skillName}" is already installed`);
      return;
    }

    ensureClaudeSkillsDir();

    const targetPath = join(CLAUDE_SKILLS_DIR, skillName);

    try {
      symlinkSync(skill.path, targetPath);
      console.log(`Added skill: ${skillName}`);
    } catch (error) {
      console.error(`Failed to add skill: ${(error as Error).message}`);
      process.exit(1);
    }
  },
});

// Remove command
const removeCommand = command({
  name: "remove",
  description: "Remove a skill",
  args: {
    skill: positional({
      type: string,
      displayName: "skill",
      description: "Name of the skill to remove",
    }),
  },
  handler: async ({ skill: skillName }) => {
    const skills = await getAvailableSkills();
    const skill = skills.get(skillName);

    if (!skill) {
      console.error(`Skill "${skillName}" not found in current directory`);
      console.log("\nAvailable skills:");
      skills.forEach(s => console.log(`  ${s.name}${s.linked ? " (installed)" : ""}`));
      process.exit(1);
    }

    if (!skill.linked) {
      console.log(`Skill "${skillName}" is not installed`);
      return;
    }

    const targetPath = join(CLAUDE_SKILLS_DIR, skillName);

    try {
      unlinkSync(targetPath);
      console.log(`Removed skill: ${skillName}`);
    } catch (error) {
      console.error(`Failed to remove skill: ${(error as Error).message}`);
      process.exit(1);
    }
  },
});

// List command
const listCommand = command({
  name: "list",
  description: "List all skills available here",
  args: {},
  handler: async () => {
    const skills = await getAvailableSkills();

    if (skills.size === 0) {
      console.log("No skills found in current directory");
      return;
    }

    console.log(`Skills in ${SKILLS_DIR}:\n`);
    skills.forEach(skill => {
      const status = skill.linked ? " (installed)" : "";
      console.log(`  ${skill.name}${status}`);
    });
  },
});

// Main app
const app = subcommands({
  name: "cc-skill",
  description: "Claude Skills Manager",
  version: "1.0.0",
  cmds: {
    add: addCommand,
    remove: removeCommand,
    list: listCommand,
  },
});

run(app, process.argv.slice(2));
