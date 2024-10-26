CREATE EXTENSION IF NOT EXISTS vector;

-- Create the partitioned table
CREATE TABLE "PartitionedEmbedding" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "embedding" vector(1536) NOT NULL,
  "documentId" TEXT NOT NULL,
  "chatbotId" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "isQA" BOOLEAN DEFAULT false,
  CONSTRAINT "PartitionedEmbedding_pkey" PRIMARY KEY ("id", "chatbotId")
) PARTITION BY LIST ("chatbotId");

-- Create a function to automatically create partitions
CREATE OR REPLACE FUNCTION create_embedding_partition(chatbot_id TEXT)
RETURNS VOID AS $$
BEGIN
  EXECUTE format('CREATE TABLE IF NOT EXISTS "PartitionedEmbedding_%s" PARTITION OF "PartitionedEmbedding" FOR VALUES IN (%L)', chatbot_id, chatbot_id);
  -- We'll create the HNSW index later, after renaming
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically create partitions when a new chatbot is created
CREATE OR REPLACE FUNCTION create_embedding_partition_trigger()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_embedding_partition(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_embedding_partition_on_chatbot_insert
AFTER INSERT ON "Chatbot"
FOR EACH ROW
EXECUTE FUNCTION create_embedding_partition_trigger();

-- Create partitions for existing chatbots
DO $$
DECLARE
    chatbot_id TEXT;
BEGIN
    FOR chatbot_id IN SELECT id FROM "Chatbot" LOOP
        PERFORM create_embedding_partition(chatbot_id);
    END LOOP;
END $$;

-- Migrate existing data
INSERT INTO "PartitionedEmbedding" SELECT * FROM "Embedding";

-- Drop the old table and rename the new one
DROP TABLE "Embedding";
ALTER TABLE "PartitionedEmbedding" RENAME TO "Embedding";

-- Rename partitions to match the new table name
DO $$
DECLARE
    chatbot_id TEXT;
BEGIN
    FOR chatbot_id IN SELECT id FROM "Chatbot" LOOP
        EXECUTE format('ALTER TABLE IF EXISTS "PartitionedEmbedding_%s" RENAME TO "Embedding_%s"', chatbot_id, chatbot_id);
    END LOOP;
END $$;

-- Add foreign key constraints
ALTER TABLE "Embedding" ADD CONSTRAINT "Embedding_chatbotId_fkey" FOREIGN KEY ("chatbotId") REFERENCES "Chatbot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Embedding" ADD CONSTRAINT "Embedding_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create index
CREATE INDEX "Embedding_documentId_isQA_idx" ON "Embedding"("documentId", "isQA");

-- Create a function to create the HNSW index on a partition
CREATE OR REPLACE FUNCTION create_hnsw_index_on_partition(chatbot_id TEXT)
RETURNS VOID AS $$
BEGIN
  EXECUTE format('CREATE INDEX IF NOT EXISTS "embedding_hnsw_idx_%s" ON "Embedding_%s" USING hnsw (embedding vector_cosine_ops)', chatbot_id, chatbot_id);
END;
$$ LANGUAGE plpgsql;

-- Create HNSW indexes for all partitions
DO $$
DECLARE
    chatbot_id TEXT;
BEGIN
    FOR chatbot_id IN SELECT id FROM "Chatbot" LOOP
        PERFORM create_hnsw_index_on_partition(chatbot_id);
    END LOOP;
END $$;

-- Update the create_embedding_partition function to include HNSW index creation
CREATE OR REPLACE FUNCTION create_embedding_partition(chatbot_id TEXT)
RETURNS VOID AS $$
BEGIN
  EXECUTE format('CREATE TABLE IF NOT EXISTS "Embedding_%s" PARTITION OF "Embedding" FOR VALUES IN (%L)', chatbot_id, chatbot_id);
  PERFORM create_hnsw_index_on_partition(chatbot_id);
END;
$$ LANGUAGE plpgsql;


-- AlterTable
ALTER TABLE "Embedding" RENAME CONSTRAINT "PartitionedEmbedding_pkey" TO "Embedding_pkey";
