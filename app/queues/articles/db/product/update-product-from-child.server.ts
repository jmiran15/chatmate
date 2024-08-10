import { Queue } from "~/utils/queue.server";
import { prisma } from "~/db.server";
import type { Prisma } from "@prisma/client";
import invariant from "tiny-invariant";

export type UpdateProductFromChildrenQueueData = {
  productId: string;
};

export const updateProductFromChildrenQueue =
  Queue<UpdateProductFromChildrenQueueData>(
    "updateProductFromChildren",
    async (job) => {
      console.log(
        `🚀 [updateProductFromChildren] Starting job for product ID: ${job.data.productId}`,
      );

      invariant(
        job.data.productId,
        "Product ID is required to update a product",
      );

      console.log(`📥 [updateProductFromChildren] Fetching children values...`);
      const childrenValues = await job.getChildrenValues();

      const data = Object.values(childrenValues)[0];

      console.log(`🧪 [updateProductFromChildren] Validating data...`);
      if (!isValidPartialProduct(data)) {
        console.error(
          `❌ [updateProductFromChildren] Invalid data format for product update`,
        );
        throw new Error(
          `Invalid data format for product update: ${JSON.stringify(
            data,
            null,
            2,
          )}`,
        );
      }
      console.log(`✅ [updateProductFromChildren] Data validation passed`);

      console.log(`🔄 [updateProductFromChildren] Updating product...`);
      const updatedProduct = await prisma.product.update({
        where: { id: job.data.productId },
        data,
      });

      console.log(`🏁 [updateProductFromChildren] Job completed successfully!`);
      return updatedProduct;
    },
  );

// Add this function to check if the data is a valid partial Product
function isValidPartialProduct(
  data: unknown,
): data is Partial<Prisma.ProductUpdateInput> {
  console.log(`🔎 [isValidPartialProduct] Checking data validity...`);

  if (typeof data !== "object" || data === null) {
    console.log(`❌ [isValidPartialProduct] Data is not an object or is null`);
    return false;
  }

  const allowedKeys = Object.keys(prisma.product.fields).filter(
    (key) => !["id", "createdAt", "updatedAt"].includes(key),
  );
  console.log(`ℹ️ [isValidPartialProduct] Allowed keys:`, allowedKeys);

  const isValid = Object.keys(data).every((key) => allowedKeys.includes(key));
  console.log(
    `${isValid ? "✅" : "❌"} [isValidPartialProduct] Data ${
      isValid ? "is" : "is not"
    } valid`,
  );

  return isValid;
}
