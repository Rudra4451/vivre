"use client";

import * as React from "react";
import type { ShopItem, InventoryItemWithDetails } from "@/types";
import { purchaseCosmeticItemAction, equipCosmeticItemAction } from "@/lib/game/actions";
import { AtlasAudio } from "@/lib/game/audio";
import { AtlasAnnounce } from "@/lib/game/announcements";
import { Card, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export interface CosmeticShopProps {
  initialItems: ShopItem[];
  initialInventory: InventoryItemWithDetails[];
  initialSoftCurrency: number;
  initialRareCurrency: number;
  className?: string;
}

const CATEGORY_LABELS: Record<string, { label: string; icon: string }> = {
  all: { label: "All Items", icon: "✦" },
  sky_overlay: { label: "Sky Overlays", icon: "🌌" },
  star_color: { label: "Star Colors", icon: "⭐" },
  avatar_frame: { label: "Avatar Frames", icon: "🖼️" },
  constellation_style: { label: "Constellation Styles", icon: "✨" },
};

export function CosmeticShop({
  initialItems,
  initialInventory,
  initialSoftCurrency,
  initialRareCurrency,
  className = "",
}: CosmeticShopProps) {
  const [items] = React.useState<ShopItem[]>(initialItems);
  const [inventory, setInventory] = React.useState<InventoryItemWithDetails[]>(initialInventory);
  const [softCurrency, setSoftCurrency] = React.useState(initialSoftCurrency);
  const [rareCurrency, setRareCurrency] = React.useState(initialRareCurrency);
  const [selectedTab, setSelectedTab] = React.useState<string>("all");
  const [processingId, setProcessingId] = React.useState<string | null>(null);
  const [statusMessage, setStatusMessage] = React.useState<{ text: string; type: "error" | "success" } | null>(null);

  // Map owned items by item_id
  const ownedMap = React.useMemo(() => {
    const map = new Map<string, InventoryItemWithDetails>();
    for (const inv of inventory) {
      map.set(inv.item_id, inv);
    }
    return map;
  }, [inventory]);

  // Filter items by active tab
  const filteredItems = React.useMemo(() => {
    if (selectedTab === "all") return items;
    return items.filter((item) => item.category?.toLowerCase() === selectedTab);
  }, [items, selectedTab]);

  const handlePurchase = async (item: ShopItem) => {
    if (processingId || ownedMap.has(item.id)) return;

    // Quick client-side sanity check before network request
    const isRare = item.currency_type?.toLowerCase() === "rare";
    const balance = isRare ? rareCurrency : softCurrency;
    if (balance < (item.cost ?? 0)) {
      setStatusMessage({
        text: `Insufficient ${isRare ? "Starlight Embers" : "Star Dust"} balance. Complete quests to earn currency.`,
        type: "error",
      });
      return;
    }

    setProcessingId(item.id);
    setStatusMessage(null);

    try {
      const res = await purchaseCosmeticItemAction({
        itemId: item.id,
        idempotencyKey: crypto.randomUUID(),
      });

      if (!res.success || !res.data) {
        setStatusMessage({ text: res.error ?? "Failed to complete purchase", type: "error" });
        return;
      }

      // Update authoritative balances
      setSoftCurrency(res.data.soft_currency);
      setRareCurrency(res.data.rare_currency);

      // Add to local inventory
      const newInvItem: InventoryItemWithDetails = {
        id: res.data.inventory_id,
        user_id: "",
        item_id: item.id,
        equipped: false,
        acquired_at: res.data.purchased_at,
        item,
      };
      setInventory((prev) => [newInvItem, ...prev]);

      // Play celestial coin chime and screen reader announcement
      AtlasAudio.playPurchase();
      AtlasAnnounce.xpGained(0, `Acquired ${item.name}`);

      setStatusMessage({ text: `Unlocked ${item.name}! Added to your constellation wardrobe.`, type: "success" });
    } catch (err) {
      console.error("[CosmeticShop] Purchase error:", err);
      setStatusMessage({ text: "A network error occurred while processing purchase.", type: "error" });
    } finally {
      setProcessingId(null);
    }
  };

  const handleEquipToggle = async (invItem: InventoryItemWithDetails) => {
    if (processingId) return;
    setProcessingId(invItem.id);
    setStatusMessage(null);

    try {
      const res = await equipCosmeticItemAction({ inventoryId: invItem.id });
      if (!res.success || !res.data) {
        setStatusMessage({ text: res.error ?? "Failed to toggle equip", type: "error" });
        return;
      }

      // Authoritative equip state: un-equip other items of same slot/category
      const cat = res.data.category;
      const isEquipped = res.data.equipped;

      setInventory((prev) =>
        prev.map((i) => {
          if (i.id === invItem.id) {
            return { ...i, equipped: isEquipped };
          }
          if (i.item.category === cat && isEquipped) {
            return { ...i, equipped: false };
          }
          return i;
        })
      );

      AtlasAudio.playBonus();
      setStatusMessage({
        text: isEquipped ? `Equipped ${invItem.item.name}.` : `Unequipped ${invItem.item.name}.`,
        type: "success",
      });
    } catch (err) {
      console.error("[CosmeticShop] Equip error:", err);
      setStatusMessage({ text: "Failed to update equipped cosmetic.", type: "error" });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <Card className={`p-5 ${className}`}>
      {/* Header & Authoritative Currency Gimbals */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[var(--atlas-line)] pb-4 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[var(--atlas-reward)]">✧</span>
            <CardTitle className="font-display text-base font-bold tracking-wide text-[var(--atlas-ink)]">
              Cartographic Wardrobe & Cosmetics
            </CardTitle>
          </div>
          <CardDescription className="text-xs mt-1">
            Personalize your astrolabe with celestial star colors, sky curtains, frames, and vector links. Zero pay-to-win.
          </CardDescription>
        </div>

        {/* Currency Vault Telemetry */}
        <div className="flex items-center gap-3 font-mono text-xs">
          {/* Soft Currency (Star Dust) */}
          <div className="flex items-center gap-1.5 rounded-lg border border-[var(--atlas-line)] bg-[var(--atlas-surface-elevated)] px-3 py-1.5 shadow-xs">
            <span className="text-sm">🪙</span>
            <span className="font-bold text-[var(--atlas-ink)]">{softCurrency.toLocaleString()}</span>
            <span className="text-[10px] text-[var(--atlas-muted)] uppercase">Dust</span>
          </div>

          {/* Rare Currency (Starlight Embers) */}
          <div className="flex items-center gap-1.5 rounded-lg border border-[var(--atlas-reward)]/40 bg-[var(--atlas-reward-subtle)] px-3 py-1.5 shadow-xs">
            <span className="text-sm text-[var(--atlas-reward)]">✦</span>
            <span className="font-bold text-[var(--atlas-reward)]">{rareCurrency.toLocaleString()}</span>
            <span className="text-[10px] text-[var(--atlas-reward)] uppercase font-semibold">Embers</span>
          </div>
        </div>
      </div>

      {/* Notification Banner */}
      {statusMessage && (
        <div
          className={`mt-4 text-xs font-mono p-2.5 rounded border flex items-center justify-between ${
            statusMessage.type === "error"
              ? "bg-[var(--atlas-danger)]/10 border-[var(--atlas-danger)]/30 text-[var(--atlas-danger)]"
              : "bg-[var(--atlas-success)]/10 border-[var(--atlas-success)]/30 text-[var(--atlas-success)]"
          }`}
        >
          <span>{statusMessage.text}</span>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-[11px] underline opacity-70 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Category Tabs */}
      <div className="mt-5 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {Object.entries(CATEGORY_LABELS).map(([key, { label, icon }]) => (
          <button
            key={key}
            onClick={() => setSelectedTab(key)}
            className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-mono font-medium transition-all ${
              selectedTab === key
                ? "bg-[var(--atlas-ink)] text-[var(--atlas-bg)] font-bold shadow-xs"
                : "border border-[var(--atlas-line)] bg-[var(--atlas-surface)] text-[var(--atlas-muted)] hover:text-[var(--atlas-ink)] hover:border-[var(--atlas-muted)]"
            }`}
          >
            <span>{icon}</span>
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Cosmetics Grid */}
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => {
          const ownedInv = ownedMap.get(item.id);
          const isOwned = Boolean(ownedInv);
          const isEquipped = Boolean(ownedInv?.equipped);
          const isRare = item.currency_type?.toLowerCase() === "rare";
          const isProcessing = processingId === item.id || processingId === ownedInv?.id;

          return (
            <div
              key={item.id}
              className={`rounded-xl border p-4 flex flex-col justify-between transition-all ${
                isEquipped
                  ? "border-[var(--atlas-reward)] bg-[var(--atlas-surface-elevated)] ring-1 ring-[var(--atlas-reward)]/40 shadow-sm"
                  : isOwned
                  ? "border-[var(--atlas-line)] bg-[var(--atlas-surface-elevated)] opacity-90"
                  : "border-[var(--atlas-line)] bg-[var(--atlas-surface)] hover:border-[var(--atlas-muted)]/60 shadow-xs"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--atlas-muted)] bg-[var(--atlas-bg)] px-2 py-0.5 rounded border border-[var(--atlas-line)]">
                    {item.category?.replace("_", " ")}
                  </span>

                  {isEquipped ? (
                    <Badge variant="reward" size="sm">
                      ★ Active
                    </Badge>
                  ) : isOwned ? (
                    <Badge variant="outline" size="sm">
                      ✓ Owned
                    </Badge>
                  ) : (
                    <span
                      className={`font-mono text-xs font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${
                        isRare
                          ? "text-[var(--atlas-reward)] bg-[var(--atlas-reward-subtle)] border-[var(--atlas-reward)]/30"
                          : "text-[var(--atlas-ink)] bg-[var(--atlas-surface-elevated)] border-[var(--atlas-line)]"
                      }`}
                    >
                      <span>{isRare ? "✦" : "🪙"}</span>
                      <span>
                        {item.cost} {isRare ? "Embers" : "Dust"}
                      </span>
                    </span>
                  )}
                </div>

                <h3 className="font-display text-sm font-bold text-[var(--atlas-ink)]">
                  {item.name}
                </h3>
                <p className="mt-1 text-xs text-[var(--atlas-muted)] leading-relaxed">
                  {item.description}
                </p>
              </div>

              {/* Action Buttons: Purchase / Equip / Unequip */}
              <div className="mt-5 pt-3 border-t border-[var(--atlas-line-subtle)] flex items-center justify-between">
                <span className="text-[10px] font-mono text-[var(--atlas-muted)]">
                  {isEquipped
                    ? "Equipped to Sector"
                    : isOwned
                    ? "In Inventory"
                    : "Available for Unlock"}
                </span>

                {isOwned && ownedInv ? (
                  <Button
                    variant={isEquipped ? "outline" : "secondary"}
                    size="sm"
                    className="text-xs font-mono"
                    disabled={isProcessing}
                    onClick={() => handleEquipToggle(ownedInv)}
                  >
                    {isProcessing ? "Updating..." : isEquipped ? "Unequip" : "Equip"}
                  </Button>
                ) : (
                  <Button
                    variant={isRare ? "reward" : "primary"}
                    size="sm"
                    className="text-xs font-mono font-bold"
                    disabled={isProcessing}
                    onClick={() => handlePurchase(item)}
                  >
                    {isProcessing ? "Unlocking..." : `Unlock`}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
