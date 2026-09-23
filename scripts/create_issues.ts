import { readFileSync } from "fs";
import { spawnSync } from "child_process";
import { join } from "path";

const backlogPath = join(process.cwd(), "docs", "user-stories-backlog.md");
const content = readFileSync(backlogPath, "utf-8");

interface IssueData {
  title: string;
  body: string;
  labels: string[];
  milestone: string;
}

const issues: IssueData[] = [];

// Divide as seções por "### [US-"
const rawSections = content.split(/\n(?=### \[US-)/g);

for (const section of rawSections) {
  if (!section.trim().startsWith("### [US-")) continue;

  const lines = section.trim().split("\n");
  const titleLine = lines[0]!.replace("### ", "").trim();
  const bodyLines = lines.slice(1).join("\n").trim();

  // Remove o separador horizontal final se houver
  const cleanBody = bodyLines.replace(/\n---\s*$/, "").trim();

  let labels: string[] = ["Feature"];
  let milestone = "Parcial 1 - Apresentacao (Auth, 2 CRUDs, Figma, README)";

  if (titleLine.includes("[US-DB-")) {
    labels = ["database", "Feature", "p1"];
    milestone = "Parcial 1 - Apresentacao (Auth, 2 CRUDs, Figma, README)";
  } else if (
    titleLine.includes("[US-BE-01]") ||
    titleLine.includes("[US-BE-02]") ||
    titleLine.includes("[US-BE-03]") ||
    titleLine.includes("[US-BE-04]") ||
    titleLine.includes("[US-BE-05]")
  ) {
    labels = ["backend", "Feature", "p1"];
    milestone = "Parcial 1 - Apresentacao (Auth, 2 CRUDs, Figma, README)";
  } else if (
    titleLine.includes("[US-FE-01]") ||
    titleLine.includes("[US-FE-02]") ||
    titleLine.includes("[US-FE-03]") ||
    titleLine.includes("[US-FE-04]") ||
    titleLine.includes("[US-FE-05]")
  ) {
    labels = ["frontend", "Feature", "p1"];
    milestone = "Parcial 1 - Apresentacao (Auth, 2 CRUDs, Figma, README)";
  } else if (titleLine.includes("[US-DOC-01]")) {
    labels = ["Docs", "p1"];
    milestone = "Parcial 1 - Apresentacao (Auth, 2 CRUDs, Figma, README)";
  } else if (titleLine.includes("[US-ROB-01]")) {
    labels = ["Chore", "p1"];
    milestone = "Parcial 1 - Apresentacao (Auth, 2 CRUDs, Figma, README)";
  } else {
    // Parcial 2
    milestone =
      "Parcial 2 - Apresentacao Final (Permissoes, Catalogo, 3 Testes, VM)";
    if (titleLine.includes("[US-BE-")) {
      labels = ["backend", "Feature", "p2"];
    } else if (titleLine.includes("[US-FE-")) {
      labels = ["frontend", "Feature", "p2"];
    } else if (titleLine.includes("[US-TEST-")) {
      labels = ["test", "Feature", "p2"];
    } else if (titleLine.includes("[US-INFRA-")) {
      labels = ["infra", "Feature", "p2"];
    } else if (titleLine.includes("[US-ROB-")) {
      labels = ["Chore", "p2"];
    }
  }

  issues.push({
    title: titleLine,
    body: cleanBody,
    labels,
    milestone,
  });
}

console.log(`Encontradas ${issues.length} User Stories para criação.`);

// Função para criar issue com gh CLI
async function createAllIssues() {
  for (let i = 0; i < issues.length; i++) {
    const item = issues[i]!;
    console.log(`[${i + 1}/${issues.length}] Criando: ${item.title}...`);

    const labelArg = item.labels.join(",");
    const res = spawnSync(
      "gh",
      [
        "issue",
        "create",
        "--repo",
        "Joao-Camilo-Mallmann/site-emporio-henz",
        "--title",
        item.title,
        "--body",
        item.body,
        "--label",
        labelArg,
        "--milestone",
        item.milestone,
      ],
      { encoding: "utf-8" },
    );

    if (res.error || res.status !== 0) {
      console.error(
        `Erro ao criar issue "${item.title}":`,
        res.stderr || res.error,
      );
    } else {
      console.log(`  -> Criada com sucesso: ${res.stdout.trim()}`);
    }

    // Pequena pausa para evitar rate limit do GitHub
    await new Promise((resolve) => setTimeout(resolve, 800));
  }

  console.log("\n🚀 Todas as issues foram processadas com sucesso!");
}

createAllIssues();
