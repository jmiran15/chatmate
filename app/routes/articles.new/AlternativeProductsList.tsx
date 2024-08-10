import { useState, memo, useCallback } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

type Product = {
  id: string;
  url: string;
};

const DraggableProduct = memo(
  ({
    product,
    index,
    moveProduct,
    updateProduct,
    removeProduct,
  }: {
    product: Product;
    index: number;
    moveProduct: (dragIndex: number, hoverIndex: number) => void;
    updateProduct: (index: number, url: string) => void;
    removeProduct: (index: number) => void;
  }) => {
    const [{ isDragging }, drag] = useDrag({
      type: "PRODUCT",
      item: { id: product.id, index },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    });

    const [, drop] = useDrop({
      accept: "PRODUCT",
      hover(item: { id: string; index: number }) {
        if (item.index !== index) {
          moveProduct(item.index, index);
          item.index = index;
        }
      },
    });

    return (
      <div
        ref={(node) => drag(drop(node))}
        className={`flex items-center space-x-2 p-2 border rounded ${
          isDragging ? "opacity-50" : ""
        }`}
      >
        <span className="font-semibold">{index + 1}.</span>
        <Input
          type="url"
          name="alternativeProducts"
          value={product.url}
          onChange={(e) => updateProduct(index, e.target.value)}
          placeholder="https://www.alternative-product.com"
          className="flex-grow"
        />
        <Button variant="destructive" onClick={() => removeProduct(index)}>
          Remove
        </Button>
      </div>
    );
  },
);

export const AlternativeProductsList = memo(
  ({
    products,
    setProducts,
    errors,
  }: {
    products: string[];
    setProducts: React.Dispatch<React.SetStateAction<string[]>>;
    errors?: string[];
  }) => {
    const [productList, setProductList] = useState<Product[]>(
      products.map((url, index) => ({ id: `${index}`, url })),
    );

    const addProduct = useCallback(() => {
      const nonEmptyProducts = productList.filter(
        (product) => product.url.trim() !== "",
      );
      if (nonEmptyProducts.length === productList.length) {
        setProductList([
          ...productList,
          { id: Date.now().toString(), url: "" },
        ]);
        setProducts([...products, ""]);
      }
    }, [productList, products, setProductList, setProducts]);

    const removeProduct = useCallback(
      (index: number) => {
        const newProductList = productList.filter((_, i) => i !== index);
        setProductList(newProductList);
        setProducts(newProductList.map((product) => product.url));
      },
      [productList, setProductList, setProducts],
    );

    const updateProduct = useCallback(
      (index: number, url: string) => {
        const newProductList = [...productList];
        newProductList[index].url = url;
        setProductList(newProductList);
        setProducts(newProductList.map((product) => product.url));
      },
      [productList, setProductList, setProducts],
    );

    const moveProduct = useCallback(
      (dragIndex: number, hoverIndex: number) => {
        const dragProduct = productList[dragIndex];
        const newProductList = [...productList];
        newProductList.splice(dragIndex, 1);
        newProductList.splice(hoverIndex, 0, dragProduct);
        setProductList(newProductList);
        setProducts(newProductList.map((product) => product.url));
      },
      [productList, setProductList, setProducts],
    );

    return (
      <DndProvider backend={HTML5Backend}>
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Alternative Products</h2>
          <p className="text-sm text-gray-500">
            List the alternative products. Drag and drop to reorder.
          </p>
          {productList.map((product, index) => (
            <DraggableProduct
              key={product.id}
              product={product}
              index={index}
              moveProduct={moveProduct}
              updateProduct={updateProduct}
              removeProduct={removeProduct}
            />
          ))}
          {errors &&
            errors.map((error, index) => (
              <p
                key={index}
                className="text-red-500 text-sm"
                id={`alternativeProduct-${index}-error`}
              >
                {error}
              </p>
            ))}
          <Button
            type="button"
            onClick={addProduct}
            disabled={productList[productList.length - 1].url.trim() === ""}
          >
            Add Another Product
          </Button>
        </div>
      </DndProvider>
    );
  },
);
