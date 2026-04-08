import { error, notFound } from "@carbon/auth";
import { requirePermissions } from "@carbon/auth/auth.server";
import { flash } from "@carbon/auth/session.server";
import type { LoaderFunctionArgs } from "react-router";
import { redirect, useLoaderData } from "react-router";
import { getDocument } from "~/modules/documents";
import DocumentView from "~/modules/documents/ui/Documents/DocumentView";
import { path } from "~/utils/path";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { client, companyId } = await requirePermissions(request, {
    view: "documents"
  });

  const { documentId } = params;
  if (!documentId) throw notFound("documentId not found");

  const document = await getDocument(client, documentId);

  if (document.error) {
    throw redirect(
      path.to.documents,
      await flash(request, error(document.error, "Failed to get document"))
    );
  }

  return {
    document: document.data,
    companyId
  };
}

export default function ViewDocumentRoute() {
  const { document, companyId } = useLoaderData<typeof loader>();

  let name = document.name;
  if (name) name = name.split(".").slice(0, -1).join(".");

  // Normalize path: strip companyId prefix if present (legacy DB records)
  const normalizedDocument = document.path?.startsWith(`${companyId}/`)
    ? { ...document, path: document.path.slice(companyId.length + 1) }
    : document;

  return (
    <DocumentView
      key={document.id}
      bucket={companyId}
      document={normalizedDocument}
    />
  );
}
