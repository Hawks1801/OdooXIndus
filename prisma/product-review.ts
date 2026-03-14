import { prisma } from "@/prisma/client";

/**
 * Create a new product review
 */
export async function createProductReview(data: any, userId: string) {
  return prisma.productReview.create({
    data: {
      productId: data.productId,
      userId: userId,
      orderId: data.orderId || null,
      orderItemId: data.orderItemId || null,
      productName: data.productName || "Product", // Fallback if name not provided
      productSku: data.productSku || null,
      rating: data.rating,
      comment: data.comment,
      status: "pending",
    },
  });
}

/**
 * Get all reviews (Admin view)
 */
export async function getAllProductReviews() {
  return prisma.productReview.findMany({
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Get reviews for a product owner (Admin seeing reviews of their products)
 */
export async function getProductReviewsForProductOwner(userId: string) {
  return prisma.productReview.findMany({
    where: {
      product: {
        userId: userId,
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Check if a user already reviewed a specific order/product
 */
export async function hasExistingReview(orderId: string, productId: string, userId: string) {
  const existing = await prisma.productReview.findFirst({
    where: { userId, orderId, productId },
  });
  return !!existing;
}

/**
 * Get eligible slots for review
 */
export async function getEligibleReviewSlots(userId: string, productId: string) {
  const paidOrderItems = await prisma.orderItem.findMany({
    where: {
      productId,
      order: {
        paymentStatus: "paid",
        OR: [
          { userId },
          { clientId: userId }
        ]
      }
    },
    select: {
      id: true,
      orderId: true
    }
  });

  return paidOrderItems.map(item => ({
    orderId: item.orderId,
    orderItemId: item.id
  }));
}

/**
 * Get reviews by product ID
 */
export async function getReviewsByProductId(productId: string, status: string = "approved") {
  const statusFilter = status === "all" ? {} : { status };
  return prisma.productReview.findMany({
    where: { productId, ...statusFilter },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

/**
 * Get a single product review by ID
 */
export async function getProductReviewById(reviewId: string) {
  return prisma.productReview.findUnique({
    where: { id: reviewId },
  });
}

/**
 * Update a product review
 */
export async function updateProductReview(reviewId: string, data: any) {
  return prisma.productReview.update({
    where: { id: reviewId },
    data: {
      ...(data.rating != null && { rating: data.rating }),
      ...(data.comment != null && { comment: data.comment }),
      ...(data.status != null && { status: data.status }),
      updatedAt: new Date(),
    },
  });
}

/**
 * Delete a product review
 */
export async function deleteProductReview(reviewId: string) {
  return prisma.productReview.delete({ where: { id: reviewId } });
}
