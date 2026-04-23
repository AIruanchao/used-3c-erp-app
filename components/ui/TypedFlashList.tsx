import React, { forwardRef } from 'react';
import { FlashList as FlashListOriginal, type FlashListProps } from '@shopify/flash-list';
import type { ViewToken } from '@shopify/flash-list';

/**
 * Wrapper around FlashList v2 that adds `estimatedItemSize` support.
 * FlashList v2 removed this prop from the types but it's still useful for optimization.
 */
export interface TypedFlashListProps<T> extends Omit<FlashListProps<T>, 'estimatedItemSize'> {
  estimatedItemSize?: number;
}

function FlashListWithEstimate<T>(
  props: TypedFlashListProps<T>,
  ref: React.Ref<import('@shopify/flash-list').FlashListRef<T>>,
) {
  const { estimatedItemSize, ...rest } = props;
  // FlashList v2 ignores estimatedItemSize but we pass it via overrideProps
  const enhancedProps = {
    ...rest,
    overrideProps: {
      ...(rest.overrideProps ?? {}),
      ...(estimatedItemSize ? { estimatedItemSize } : {}),
    },
  };
  return <FlashListOriginal<T> ref={ref} {...enhancedProps} />;
}

const ForwardedFlashList = forwardRef(FlashListWithEstimate) as <T>(
  props: TypedFlashListProps<T> & { ref?: React.Ref<import('@shopify/flash-list').FlashListRef<T>> },
) => React.ReactElement | null;

export { ForwardedFlashList as FlashList };
export type { FlashListProps, ViewToken };
