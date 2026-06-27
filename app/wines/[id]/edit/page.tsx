import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import EditWineForm from "./EditWineForm";

export default async function EditWinePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const wine = await prisma.wine.findUnique({ where: { id } });
  if (!wine) notFound();
  return <EditWineForm wine={wine} />;
}
