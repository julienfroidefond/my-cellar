#!/usr/bin/env node
import { fileURLToPath } from "url";
import path from "path";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, "../cellar.db");
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });

const { PrismaClient } = await import("../app/generated/prisma/client.js");
const prisma = new PrismaClient({ adapter } as any);

const server = new Server(
  { name: "my-cellar", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

// ─── Tool definitions ───────────────────────────────────────────────────────

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "add_wine",
      description: "Ajouter un vin à la cave. Utilisez cet outil pour insérer un nouveau vin avec toutes ses informations.",
      inputSchema: {
        type: "object",
        properties: {
          name: { type: "string", description: "Nom complet du vin" },
          producer: { type: "string", description: "Producteur ou domaine" },
          vintage: { type: "number", description: "Millésime (année)" },
          quantity: { type: "number", description: "Nombre de bouteilles (défaut: 1)" },
          volume: { type: "number", description: "Volume en cl (défaut: 75)" },
          color: { type: "string", enum: ["rouge", "blanc", "rosé"], description: "Couleur du vin" },
          region: { type: "string", description: "Région viticole (ex: Bordeaux, Bourgogne)" },
          appellation: { type: "string", description: "Appellation (ex: Margaux, Pauillac)" },
          country: { type: "string", description: "Pays (défaut: France)" },
          grapeVarieties: { type: "string", description: "Cépages (ex: Cabernet Sauvignon, Merlot)" },
          purchasePrice: { type: "number", description: "Prix d'achat en euros" },
          marketPrice: { type: "number", description: "Prix du marché estimé en euros" },
          notes: { type: "string", description: "Notes, commentaires, occasion d'achat" },
          drinkFrom: { type: "number", description: "Année à partir de laquelle boire" },
          drinkUntil: { type: "number", description: "Année jusqu'à laquelle boire" },
        },
        required: ["name"],
      },
    },
    {
      name: "list_wines",
      description: "Lister les vins de la cave avec filtres optionnels.",
      inputSchema: {
        type: "object",
        properties: {
          color: { type: "string", enum: ["rouge", "blanc", "rosé"], description: "Filtrer par couleur" },
          region: { type: "string", description: "Filtrer par région" },
          search: { type: "string", description: "Recherche textuelle" },
        },
      },
    },
    {
      name: "get_wine",
      description: "Obtenir les détails d'un vin par son ID.",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string", description: "ID du vin" },
        },
        required: ["id"],
      },
    },
    {
      name: "update_wine",
      description: "Mettre à jour les informations d'un vin existant.",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string", description: "ID du vin à modifier" },
          name: { type: "string" },
          producer: { type: "string" },
          vintage: { type: "number" },
          quantity: { type: "number" },
          color: { type: "string", enum: ["rouge", "blanc", "rosé"] },
          region: { type: "string" },
          appellation: { type: "string" },
          country: { type: "string" },
          grapeVarieties: { type: "string" },
          purchasePrice: { type: "number" },
          marketPrice: { type: "number" },
          notes: { type: "string" },
          drinkFrom: { type: "number" },
          drinkUntil: { type: "number" },
        },
        required: ["id"],
      },
    },
    {
      name: "delete_wine",
      description: "Supprimer un vin de la cave.",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string", description: "ID du vin à supprimer" },
        },
        required: ["id"],
      },
    },
    {
      name: "get_stats",
      description: "Obtenir les statistiques globales de la cave (total bouteilles, valeur, répartition).",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
  ],
}));

// ─── Tool handlers ────────────────────────────────────────────────────────────

const AddWineSchema = z.object({
  name: z.string(),
  producer: z.string().optional(),
  vintage: z.number().optional(),
  quantity: z.number().default(1),
  volume: z.number().default(75),
  color: z.enum(["rouge", "blanc", "rosé"]).optional(),
  region: z.string().optional(),
  appellation: z.string().optional(),
  country: z.string().default("France"),
  grapeVarieties: z.string().optional(),
  purchasePrice: z.number().optional(),
  marketPrice: z.number().optional(),
  notes: z.string().optional(),
  drinkFrom: z.number().optional(),
  drinkUntil: z.number().optional(),
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === "add_wine") {
      const data = AddWineSchema.parse(args);
      const wine = await prisma.wine.create({ data });
      return {
        content: [
          {
            type: "text",
            text: `✅ Vin ajouté avec succès !\nID: ${wine.id}\nNom: ${wine.name}\nMillésime: ${wine.vintage ?? "—"}\nQuantité: ${wine.quantity} bouteille(s)`,
          },
        ],
      };
    }

    if (name === "list_wines") {
      const { color, region, search } = (args ?? {}) as Record<string, string>;
      const wines = await prisma.wine.findMany({
        where: {
          ...(color ? { color } : {}),
          ...(region ? { region } : {}),
          ...(search
            ? {
                OR: [
                  { name: { contains: search } },
                  { producer: { contains: search } },
                  { appellation: { contains: search } },
                  { region: { contains: search } },
                ],
              }
            : {}),
        },
        orderBy: { name: "asc" },
      });

      const lines = wines.map(
        (w) =>
          `• [${w.id}] ${w.name}${w.vintage ? ` (${w.vintage})` : ""} — ${w.quantity}× ${w.color ?? "?"} — ${w.appellation ?? w.region ?? "?"} — ${w.marketPrice ? `${w.marketPrice}€` : "prix inconnu"}`
      );

      return {
        content: [
          {
            type: "text",
            text: `${wines.length} vins dans la cave :\n\n${lines.join("\n")}`,
          },
        ],
      };
    }

    if (name === "get_wine") {
      const { id } = args as { id: string };
      const wine = await prisma.wine.findUnique({ where: { id }, include: { rack: true } });
      if (!wine) return { content: [{ type: "text", text: "❌ Vin non trouvé" }] };
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(wine, null, 2),
          },
        ],
      };
    }

    if (name === "update_wine") {
      const { id, ...data } = args as Record<string, unknown>;
      const wine = await prisma.wine.update({ where: { id: id as string }, data });
      return {
        content: [{ type: "text", text: `✅ Vin mis à jour : ${wine.name}` }],
      };
    }

    if (name === "delete_wine") {
      const { id } = args as { id: string };
      const wine = await prisma.wine.delete({ where: { id } });
      return {
        content: [{ type: "text", text: `🗑️ Vin supprimé : ${wine.name}` }],
      };
    }

    if (name === "get_stats") {
      const wines = await prisma.wine.findMany();
      const totalBottles = wines.reduce((s, w) => s + w.quantity, 0);
      const totalValue = wines.reduce((s, w) => s + (w.marketPrice ?? 0) * w.quantity, 0);
      const byColor = wines.reduce<Record<string, number>>((acc, w) => {
        const c = w.color ?? "autre";
        acc[c] = (acc[c] ?? 0) + w.quantity;
        return acc;
      }, {});
      return {
        content: [
          {
            type: "text",
            text: `📊 Statistiques de la cave :
• Total : ${totalBottles} bouteilles, ${wines.length} références
• Valeur estimée : ${totalValue.toFixed(2)} €
• Par couleur : ${Object.entries(byColor).map(([c, n]) => `${c}: ${n}`).join(", ")}`,
          },
        ],
      };
    }

    return { content: [{ type: "text", text: `❌ Outil inconnu : ${name}` }] };
  } catch (err) {
    return {
      content: [{ type: "text", text: `❌ Erreur : ${err instanceof Error ? err.message : String(err)}` }],
      isError: true,
    };
  }
});

// ─── Start ────────────────────────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("🍷 MCP Cave server running on stdio");
