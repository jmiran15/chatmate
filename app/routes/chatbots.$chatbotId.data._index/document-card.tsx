import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion"; // Import framer-motion
import { Clock, Database, File, FileText, Globe } from "lucide-react"; // Import additional icons
import { memo } from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { LinkCard } from "~/components/LinkCard";
import { LinkCardBody } from "~/components/LinkCardBody";
import { LinkCardHeader } from "~/components/LinkCardHeader";
import { Badge } from "../../components/ui/badge";
import { OptimisticDocument } from "./route";

const DocumentCard = memo(function DocumentCard({
  item,
}: {
  item: OptimisticDocument;
}) {
  const ariaLabel = `Document: ${item?.name}. Type: ${getFormattedType(
    item?.type,
  )}. Created ${formatDistanceToNow(new Date(item?.createdAt), {
    addSuffix: true,
  })}`;

  return (
    <LinkCard to={item?.id} aria-label={ariaLabel} className="mb-4">
      <div className="p-4 flex flex-col gap-1">
        <LinkCardHeader title={item?.name} tag={<StatusBadge item={item} />} />
        <LinkCardBody>
          <div className="relative">
            <div className="text-sm text-muted-foreground line-clamp-2 mb-4">
              {item?.preprocessingCompleted ? (
                item?.content
              ) : (
                <Skeleton count={2} />
              )}
            </div>
            <div className="absolute bottom-0 right-0 w-1/4 h-full bg-gradient-to-l from-white to-transparent"></div>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              {getDocumentTypeIcon(item?.type)}
              <span>{getFormattedType(item?.type)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>
                {formatDistanceToNow(new Date(item?.createdAt), {
                  addSuffix: true,
                })}
              </span>
            </div>
          </div>
        </LinkCardBody>
      </div>
    </LinkCard>
  );
});

// Function to get the appropriate icon based on DocumentType
function getDocumentTypeIcon(type: string) {
  switch (type) {
    case "WEBSITE":
      return <Globe className="w-5 h-5 text-gray-600" />;
    case "FILE":
      return <FileText className="w-5 h-5 text-gray-600" />;
    case "RAW":
      return <Database className="w-5 h-5 text-gray-600" />;
    default:
      return <File className="w-5 h-5 text-gray-600" />;
  }
}

// Function to format the type text
function getFormattedType(type: string) {
  return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
}

const StatusBadge = memo(function StatusBadge({
  item,
}: {
  item: OptimisticDocument;
}) {
  const isPending = item?.isPending && item?.status;
  const badgeVariant = isPending
    ? "bg-yellow-100 text-yellow-800"
    : "bg-green-100 text-green-800";

  return (
    <Badge
      className={`whitespace-nowrap ${badgeVariant} text-xs font-medium px-2.5 py-0.5 rounded flex items-center gap-2`}
    >
      {isPending && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Spinner />
        </motion.div>
      )}
      <span>{isPending ? item.status : "Processed"}</span>
    </Badge>
  );
});

const Spinner = () => (
  <svg
    className="animate-spin h-4 w-4 text-current"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    ></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
);

export { DocumentCard };
