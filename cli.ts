#!/usr/bin/env bun

import { existsSync, mkdirSync, symlinkSync, unlinkSync, lstatSync } from "fs";
import { resolve, join } from "path";
import { readdir } from "fs/promises";
import { command, positional, string, subcommands, run, flag } from "cmd-ts";

const SKILLS_DIR = resolve(import.meta.dir);
const CLAUDE_SKILLS_DIR = join(process.env.HOME!, ".claude", "skills");
const LOCAL_SKILLS_DIR = join(process.cwd(), ".claude", "skills");

interface Skill {
  name: string;
  path: string;
  linked: boolean;
  local: boolean;
}

async function getAvailableSkills(): Promise<Map<string, Skill>> {
  const skills = new Map<string, Skill>();

  // Check skills in current directory (not local)
  const entries = await readdir(SKILLS_DIR, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory() && !entry.name.startsWith(".") && entry.name !== "node_modules") {
      const skillPath = join(SKILLS_DIR, entry.name);
      const targetPath = join(CLAUDE_SKILLS_DIR, entry.name);
      const isLinked = existsSync(targetPath) && lstatSync(targetPath).isSymbolicLink();

      skills.set(entry.name, {
        name: entry.name,
        path: skillPath,
        linked: isLinked,
        local: false,
      });
    }
  }

  // Check local skills in ./.claude/skills/
  if (existsSync(LOCAL_SKILLS_DIR)) {
    const localEntries = await readdir(LOCAL_SKILLS_DIR, { withFileTypes: true });
    for (const entry of localEntries) {
      if (entry.name.startsWith(".")) continue;

      const skillPath = join(LOCAL_SKILLS_DIR, entry.name);

      // Check if it's a symbolic link (most likely case for installed skills)
      if (lstatSync(skillPath).isSymbolicLink()) {
        // Always add/update local skills, even if they exist in skills map
        // This ensures local installations take precedence
        skills.set(entry.name, {
          name: entry.name,
          path: skillPath,
          linked: true, // Local skills are always "installed"
          local: true,
        });
      }
      // Also check if it's a directory (in case of direct installations)
      else if (entry.isDirectory()) {
        skills.set(entry.name, {
          name: entry.name,
          path: skillPath,
          linked: true,
          local: true,
        });
      }
    }
  }

  return skills;
}

function ensureClaudeSkillsDir(): void {
  if (!existsSync(CLAUDE_SKILLS_DIR)) {
    mkdirSync(CLAUDE_SKILLS_DIR, { recursive: true });
  }
}

function ensureLocalSkillsDir(): void {
  if (!existsSync(LOCAL_SKILLS_DIR)) {
    mkdirSync(LOCAL_SKILLS_DIR, { recursive: true });
  }
}

interface SkillSetConfig {
  skill_set: {
    [key: string]: string[];
  };
}

async function readSkillSetConfig(): Promise<SkillSetConfig | null> {
  const configPath = join(SKILLS_DIR, "cc-skill.json");

  if (!existsSync(configPath)) {
    console.error("cc-skill.json not found in current directory");
    return null;
  }

  try {
    const file = Bun.file(configPath);
    return await file.json() as SkillSetConfig;
  } catch (error) {
    console.error(`Failed to read cc-skill.json: ${(error as Error).message}`);
    return null;
  }
}

async function getSkillFromSet(skillSetName: string): Promise<string[] | null> {
  const config = await readSkillSetConfig();
  if (!config) return null;

  const skillSet = config.skill_set[skillSetName];
  if (!skillSet) {
    console.error(`Skill set "${skillSetName}" not found in cc-skill.json`);
    console.log("Available skill sets:");
    Object.keys(config.skill_set).forEach(name => console.log(`  ${name}`));
    return null;
  }

  return skillSet;
}

function checkSkillInstalled(skillName: string): { installed: boolean; local: boolean; path: string } {
  // Check local installation first
  const localPath = join(LOCAL_SKILLS_DIR, skillName);
  if (existsSync(localPath) && lstatSync(localPath).isSymbolicLink()) {
    return { installed: true, local: true, path: localPath };
  }

  // Check global installation
  const globalPath = join(CLAUDE_SKILLS_DIR, skillName);
  if (existsSync(globalPath) && lstatSync(globalPath).isSymbolicLink()) {
    return { installed: true, local: false, path: globalPath };
  }

  return { installed: false, local: false, path: "" };
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
    local: flag({
      long: "local",
      description: "Install skill locally in ./.claude/skills/",
    }),
    skillSet: flag({
      long: "skill-set",
      description: "Treat the skill name as a skill set from cc-skill.json",
    }),
  },
  handler: async ({ skill: skillName, local, skillSet }) => {
    const skills = await getAvailableSkills();

    // Handle skill set mode
    if (skillSet) {
      const skillNames = await getSkillFromSet(skillName);
      if (!skillNames) {
        process.exit(1);
      }

      console.log(`Adding skill set "${skillName}": ${skillNames.join(", ")}\n`);

      let successCount = 0;
      let failureCount = 0;

      for (const name of skillNames) {
        const skill = skills.get(name);

        if (!skill) {
          console.error(`Skill "${name}" not found in current directory`);
          failureCount++;
          continue;
        }

        if (skill.linked) {
          console.log(`Skill "${name}" is already installed`);
          successCount++;
          continue;
        }

        const targetPath = local ? join(LOCAL_SKILLS_DIR, name) : join(CLAUDE_SKILLS_DIR, name);

        try {
          if (local) {
            ensureLocalSkillsDir();
          } else {
            ensureClaudeSkillsDir();
          }

          symlinkSync(skill.path, targetPath);
          console.log(`Added ${local ? "local " : ""}skill: ${name}`);
          successCount++;
        } catch (error) {
          console.error(`Failed to add ${local ? "local " : ""}skill "${name}": ${(error as Error).message}`);
          failureCount++;
        }
      }

      console.log(`\nSkill set "${skillName}" completed: ${successCount} added, ${failureCount} failed`);
      return;
    }

    // Handle single skill mode (existing logic)
    const skill = skills.get(skillName);

    if (!skill) {
      console.error(`Skill "${skillName}" not found in current directory`);
      console.log("\nAvailable skills:");
      skills.forEach(s => {
        let status = "";
        if (s.linked) {
          status += s.local ? " (installed, local)" : " (installed)";
        }
        console.log(`  ${s.name}${status}`);
      });
      process.exit(1);
    }

    if (skill.linked) {
      console.log(`Skill "${skillName}" is already installed`);
      return;
    }

    if (local) {
      ensureLocalSkillsDir();
      const targetPath = join(LOCAL_SKILLS_DIR, skillName);

      try {
        symlinkSync(skill.path, targetPath);
        console.log(`Added skill locally: ${skillName}`);
      } catch (error) {
        console.error(`Failed to add skill locally: ${(error as Error).message}`);
        process.exit(1);
      }
    } else {
      ensureClaudeSkillsDir();
      const targetPath = join(CLAUDE_SKILLS_DIR, skillName);

      try {
        symlinkSync(skill.path, targetPath);
        console.log(`Added skill: ${skillName}`);
      } catch (error) {
        console.error(`Failed to add skill: ${(error as Error).message}`);
        process.exit(1);
      }
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
    skillSet: flag({
      long: "skill-set",
      description: "Treat the skill name as a skill set from cc-skill.json",
    }),
  },
  handler: async ({ skill: skillName, skillSet }) => {
    const skills = await getAvailableSkills();

    // Handle skill set mode
    if (skillSet) {
      const skillNames = await getSkillFromSet(skillName);
      if (!skillNames) {
        process.exit(1);
      }

      console.log(`Removing skill set "${skillName}": ${skillNames.join(", ")}\n`);

      let successCount = 0;
      let failureCount = 0;

      for (const name of skillNames) {
        const installStatus = checkSkillInstalled(name);

        if (!installStatus.installed) {
          console.log(`Skill "${name}" is not installed`);
          failureCount++;
          continue;
        }

        try {
          unlinkSync(installStatus.path);
          console.log(`Removed ${installStatus.local ? "local " : ""}skill: ${name}`);
          successCount++;
        } catch (error) {
          console.error(`Failed to remove ${installStatus.local ? "local " : ""}skill "${name}": ${(error as Error).message}`);
          failureCount++;
        }
      }

      console.log(`\nSkill set "${skillName}" completed: ${successCount} removed, ${failureCount} failed`);
      return;
    }

    // Handle single skill mode (existing logic)
    const skill = skills.get(skillName);

    if (!skill) {
      console.error(`Skill "${skillName}" not found in current directory`);
      console.log("\nAvailable skills:");
      skills.forEach(s => {
        let status = "";
        if (s.linked) {
          status += s.local ? " (installed, local)" : " (installed)";
        }
        console.log(`  ${s.name}${status}`);
      });
      process.exit(1);
    }

    if (!skill.linked) {
      console.log(`Skill "${skillName}" is not installed`);
      return;
    }

    const targetPath = skill.local
      ? join(LOCAL_SKILLS_DIR, skillName)
      : join(CLAUDE_SKILLS_DIR, skillName);

    try {
      unlinkSync(targetPath);
      console.log(`Removed ${skill.local ? "local " : ""}skill: ${skillName}`);
    } catch (error) {
      console.error(`Failed to remove ${skill.local ? "local " : ""}skill: ${(error as Error).message}`);
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
      let status = "";
      if (skill.linked) {
        status += skill.local ? " (installed, local)" : " (installed)";
      }
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
