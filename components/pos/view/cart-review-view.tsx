import * as React from "react";
import { SectionCard } from "@/components/ui/section-card";
import { PosCartRail } from "@/components/pos/view/pos-cart-rail";

type CartReviewViewProps = React.ComponentProps<typeof PosCartRail>;

export function CartReviewView(cartRailProps: CartReviewViewProps) {
  return (
    <SectionCard className="transaction-card transaction-card--checkout pos-cart-surface">
      <PosCartRail {...cartRailProps} />
    </SectionCard>
  );
}
