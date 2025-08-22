import React, { memo, useMemo } from "react";
import { FixedSizeList as List } from "react-window";
import OptimizedProductCard from "./OptimizedProductCard";

/**
 * Virtualized Product List for handling thousands of products efficiently
 */
const VirtualizedProductList = memo(
  ({
    products = [],
    onEdit,
    onArchive,
    onViewDetails,
    selectedProducts = new Set(),
    height = 600,
    itemHeight = 200,
  }) => {
    // Memoize item renderer to prevent unnecessary re-renders
    const ItemRenderer = useMemo(
      () =>
        memo(({ index, style }) => {
          const product = products[index];
          if (!product) return null;

          return (
            <div style={style} className="px-2">
              <OptimizedProductCard
                product={product}
                onEdit={onEdit}
                onArchive={onArchive}
                onViewDetails={onViewDetails}
                isSelected={selectedProducts.has(product.id)}
              />
            </div>
          );
        }),
      [products, onEdit, onArchive, onViewDetails, selectedProducts]
    );

    // Calculate grid layout for better space utilization
    const gridLayout = useMemo(() => {
      const containerWidth = window.innerWidth - 64; // Account for padding
      const cardWidth = 320; // Minimum card width
      const columns = Math.floor(containerWidth / cardWidth);
      const actualItemHeight = Math.ceil(itemHeight / columns);

      return {
        columns,
        itemHeight: actualItemHeight,
        itemCount: Math.ceil(products.length / columns),
      };
    }, [products.length, itemHeight]);

    if (products.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <div className="text-4xl mb-4">📦</div>
            <p>No products found</p>
          </div>
        </div>
      );
    }

    return (
      <div className="w-full">
        <div className="mb-4 text-sm text-gray-600">
          Showing {products.length} products
        </div>

        <List
          height={height}
          itemCount={gridLayout.itemCount}
          itemSize={gridLayout.itemHeight}
          overscanCount={5} // Render 5 extra items for smooth scrolling
          className="w-full"
        >
          {ItemRenderer}
        </List>
      </div>
    );
  }
);

VirtualizedProductList.displayName = "VirtualizedProductList";

export default VirtualizedProductList;
