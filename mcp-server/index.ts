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
      description: "Ajouter un vin à la cave. Crée une fiche Wine + son premier millésime WineVintage.",
      inputSchema: {
        type: "object",
        properties: {
          name: { type: "string", description: "Nom du vin (sans le producteur)" },
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
          notes: { type: "string", description: "Notes, commentaires" },
          drinkFrom: { type: "number", description: "Année à partir de laquelle boire" },
          drinkUntil: { type: "number", description: "Année jusqu'à laquelle boire" },
        },
        required: ["name"],
      },
    },
    {
      name: "list_wines",
      description: "Lister les vins de la cave avec leurs millésimes.",
      inputSchema: {
        type: "object",
        properties: {
          color: { type: "string", enum: ["rouge", "blanc", "rosé"], description: "Filtrer par couleur" },
          region: { type: "string", description: "Filtrer par région" },
          search: { type: "string", description: "Recherche textuelle (nom, producteur, appellation)" },
        },
      },
    },
    {
      name: "get_wine",
      description: "Obtenir les détails d'un vin par son ID (Wine.id), avec tous ses millésimes.",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string", description: "ID du vin (Wine.id)" },
        },
        required: ["id"],
      },
    },
    {
      name: "update_wine",
      description: "Mettre à jour les informations de niveau vin (nom, producteur, couleur, région, appellation, notes, imageUrl). Ne modifie pas les millésimes.",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string", description: "ID du vin (Wine.id)" },
          name: { type: "string" },
          producer: { type: "string" },
          color: { type: "string", enum: ["rouge", "blanc", "rosé"] },
          region: { type: "string" },
          appellation: { type: "string" },
          country: { type: "string" },
          grapeVarieties: { type: "string" },
          notes: { type: "string" },
        },
        required: ["id"],
      },
    },
    {
      name: "delete_wine",
      description: "Supprimer un vin et tous ses millésimes de la cave.",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string", description: "ID du vin (Wine.id)" },
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
      const { vintage, quantity, volume, purchasePrice, marketPrice, drinkFrom, drinkUntil, ...wineData } =
        AddWineSchema.parse(args);

      const wine = await prisma.wine.create({
        data: {
          ...wineData,
          vintages: {
            create: {
              vintage: vintage ?? null,
              quantity,
              volume,
              purchasePrice: purchasePrice ?? null,
              marketPrice: marketPrice ?? null,
              drinkFrom: drinkFrom ?? null,
              drinkUntil: drinkUntil ?? null,
            },
          },
        },
        include: { vintages: true },
      });

      const v = wine.vintages[0];
      return {
        content: [
          {
            type: "text",
            text: `✅ Vin ajouté !\nID: ${wine.id}\nNom: ${wine.name}\nMillésime: ${v?.vintage ?? "—"}\nQuantité: ${v?.quantity ?? 1} bouteille(s)`,
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
        include: { vintages: { orderBy: { vintage: "desc" } } },
      });

      const lines = wines.map((w) => {
        const totalQty = w.vintages.reduce((s, v) => s + v.quantity, 0);
        const vintageList = w.vintages.map((v) => `${v.vintage ?? "?"}×${v.quantity}`).join(", ");
        return `• [${w.id}] ${w.name}${w.producer ? ` / ${w.producer}` : ""} — ${totalQty} btl (${vintageList}) — ${w.color ?? "?"} — ${w.appellation ?? w.region ?? "?"}`;
      });

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
      const wine = await prisma.wine.findUnique({
        where: { id },
        include: { vintages: { orderBy: { vintage: "desc" } } },
      });
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
      const { vintage: _v, quantity: _q, volume: _vol, purchasePrice: _pp, marketPrice: _mp, drinkFrom: _df, drinkUntil: _du, ...wineData } = data as Record<string, unknown>;
      const wine = await prisma.wine.update({
        where: { id: id as string },
        data: wineData,
        include: { vintages: true },
      });
      return {
        content: [{ type: "text", text: `✅ Vin mis à jour : ${wine.name}` }],
      };
    }

    if (name === "delete_wine") {
      const { id } = args as { id: string };
      const wine = await prisma.wine.findUnique({ where: { id }, include: { vintages: true } });
      if (!wine) return { content: [{ type: "text", text: "❌ Vin non trouvé" }] };
      await prisma.wine.delete({ where: { id } });
      return {
        content: [{ type: "text", text: `🗑️ Vin supprimé : ${wine.name} (${wine.vintages.length} millésime(s))` }],
      };
    }

    if (name === "get_stats") {
      const vintages = await prisma.wineVintage.findMany({
        include: { wine: { select: { color: true, region: true } } },
      });
      const totalBottles = vintages.reduce((s, v) => s + v.quantity, 0);
      const totalValue = vintages.reduce((s, v) => s + (v.marketPrice ?? 0) * v.quantity, 0);
      const byColor = vintages.reduce<Record<string, number>>((acc, v) => {
        const c = v.wine.color ?? "autre";
        acc[c] = (acc[c] ?? 0) + v.quantity;
        return acc;
      }, {});
      const wineCount = new Set(vintages.filter((v) => v.quantity > 0).map((v) => v.wineId)).size;
      return {
        content: [
          {
            type: "text",
            text: `📊 Statistiques de la cave :
• Total : ${totalBottles} bouteilles, ${wineCount} références
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
