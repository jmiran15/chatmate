import { ReactNode, useCallback, useEffect, useRef } from "react";

interface ItemMeasurerProps {
  children: ReactNode;
  measure: (element: HTMLElement | null) => void;
  tagName: keyof JSX.IntrinsicElements;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export const ItemMeasurer: React.FC<ItemMeasurerProps> = ({
  children,
  measure,
  tagName,
  ...restProps
}) => {
  const roRef = useRef<ResizeObserver | null>(null);
  const elRef = useRef<HTMLElement | null>(null);

  const measureRef = useRef(measure);
  measureRef.current = measure;

  const refSetter = useCallback((el: HTMLElement | null) => {
    const ro = roRef.current;

    if (ro !== null && elRef.current !== null) {
      ro.unobserve(elRef.current);
    }

    elRef.current = el;

    if (ro !== null && elRef.current !== null) {
      ro.observe(elRef.current);
    }
  }, []);

  // TODO - useLayoutEffect - SSR? - probably just have to depend on elRef change and return if it is null (e.g, like parentRef in useSSR...)
  useEffect(() => {
    const update = () => {
      measureRef.current(elRef.current);
    };

    // sync measure for initial render ?
    update();

    const ro = roRef.current ? roRef.current : new ResizeObserver(update);

    const el = elRef.current;
    if (el !== null) {
      ro.observe(el);
    }
    roRef.current = ro;

    return () => {
      ro.disconnect();
    };
  }, []);

  const Tag = tagName;

  return (
    <Tag ref={refSetter} {...restProps}>
      {children}
    </Tag>
  );
};
