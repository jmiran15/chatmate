import { Document } from "@prisma/client";
import { Link } from "@remix-run/react";

export default function DocumentCard({ document }: { document: Document }) {
  return (
    <Link
      to={document.id}
      className="block w-full p-6 bg-white border border-gray-200 rounded-lg shadow hover:bg-slate-50 "
    >
      <h5 className="mb-2 text-xl font-bold tracking-tight text-gray-900 dark:text-white">
        {document.name}
      </h5>
    </Link>
  );
}
