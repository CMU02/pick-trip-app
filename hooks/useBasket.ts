import { useCallback, useEffect, useState } from 'react';
import { EMPTY_BASKET, loadBasket, saveBasket } from '../services/basketStorage';
import type { Basket, BasketItem } from '../types/basket';
import type { CompanionType, StylePreference } from '../types/companion';
import type { Content } from '../types/content';
import type { Priority } from '../types/priority';

// 바구니는 로그인 여부와 무관하게 기기에 로컬로 저장한다.
// 로그인은 일정 저장·공유·수정 시점에만 필요하다.
export function useBasket() {
  const [basket, setBasket] = useState<Basket | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBasket().then((loaded) => {
      setBasket(loaded);
      setIsLoading(false);
    });
  }, []);

  const persist = useCallback(async (next: Basket) => {
    setBasket(next);
    await saveBasket(next);
  }, []);

  const addItem = useCallback(
    async (content: Content, priority: Priority) => {
      const current = basket ?? EMPTY_BASKET;
      if (current.items.some((item) => item.contentId === content.id)) return;
      const item: BasketItem = {
        itemId: content.id,
        contentId: content.id,
        title: content.name,
        thumbnailUrl: content.imageUrl,
        priority,
      };
      await persist({ ...current, items: [...current.items, item] });
    },
    [basket, persist],
  );

  const removeItem = useCallback(
    async (itemId: string) => {
      const current = basket ?? EMPTY_BASKET;
      await persist({ ...current, items: current.items.filter((item) => item.itemId !== itemId) });
    },
    [basket, persist],
  );

  const updateItemPriority = useCallback(
    async (itemId: string, priority: Priority) => {
      const current = basket ?? EMPTY_BASKET;
      await persist({
        ...current,
        items: current.items.map((item) => (item.itemId === itemId ? { ...item, priority } : item)),
      });
    },
    [basket, persist],
  );

  const updateConditions = useCallback(
    async (input: {
      regionId: string | null;
      travelDate: string | null;
      duration: number | null;
      companion: CompanionType | null;
      stylePrefs: StylePreference[];
    }) => {
      const current = basket ?? EMPTY_BASKET;
      await persist({
        ...current,
        conditions: {
          region: input.regionId,
          travelDate: input.travelDate,
          duration: input.duration,
          companion: input.companion,
          stylePrefs: input.stylePrefs,
        },
      });
    },
    [basket, persist],
  );

  return {
    basket,
    isLoading,
    addItem,
    removeItem,
    updateItemPriority,
    updateConditions,
  };
}
