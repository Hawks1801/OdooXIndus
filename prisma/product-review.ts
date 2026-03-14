import { prisma } from "@/prisma/client";

/**
 * Create a new product review
 */
export async function createProductReview(data: any) {
  return prisma.productReview.create({
    data: {
      productId: data.productId,
      userId: data.userId,
      orderId: data.orderId || null,
      orderItemId: data.orderItemId || null,
      productName: data.productName,
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
 * Check if a user already reviewed a specific order item
 */
export async function hasExistingReview(userId: string, orderItemId: string) {
  const existing = await prisma.productReview.findFirst({
    where: { userId, orderItemId },
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
