import { useCallback, useEffect, useRef } from "react";

export const ItemMeasurer = ({ children, measure, tagName, ...restProps }) => {
  const roRef = useRef(null);
  const elRef = useRef(null);

  const measureRef = useRef(measure);
  measureRef.current = measure;

  const refSetter = useCallback((el) => {
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
