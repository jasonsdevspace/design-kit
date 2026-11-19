import { Progress, useProgress } from '../src/react.js';

/**
 * An import working through a file, under a `StatusProvider`, said each quarter and once at the
 * end on the screen's status line.
 */
export const Importing = ({ done, total }: { readonly done: number; readonly total: number }) => {
    const bar = useProgress();
    return (
        <Progress
            ref={bar}
            label="Importing products"
            value={done}
            max={total}
            words={`${String(done)} of ${String(total)} products`}
        />
    );
};
