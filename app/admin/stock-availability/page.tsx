import { getSession } from "@/lib/auth-server";
import { getProductsForUser } from "@/lib/server/home-data";
import StockAvailabilityContent from "@/components/admin/StockAvailabilityContent";

export default async function StockAvailabilityPage() {
  const user = await getSession();
  if (!user) return null;
  const initialProducts = await getProductsForUser(user.id);
  return <StockAvailabilityContent initialProducts={initialProducts} />;
}
