/*
 * The site's icon as shapes on a 32 by 32 ground: three square tiles and a round one, the two
 * beside the corners fainter. The header draws its mark from these, and a test holds them to the
 * icon a tab shows, so the two stay one drawing.
 */

/** A tile of the icon: a rounded square at a corner, or the round one. */
export type Tile =
    | {
          readonly shape: 'rect';
          readonly x: number;
          readonly y: number;
          readonly size: number;
          readonly radius: number;
          readonly faint: boolean;
      }
    | { readonly shape: 'circle'; readonly x: number; readonly y: number; readonly radius: number };

/** How round the ground's corners are, on its 32 by 32 square. */
export const GROUND_RADIUS = 7;

/** How strongly a faint tile is drawn. */
export const FAINT = 0.55;

export const TILES: readonly Tile[] = [
    { shape: 'rect', x: 6, y: 6, size: 9, radius: 2.5, faint: false },
    { shape: 'rect', x: 17, y: 6, size: 9, radius: 2.5, faint: true },
    { shape: 'rect', x: 6, y: 17, size: 9, radius: 2.5, faint: true },
    { shape: 'circle', x: 21.5, y: 21.5, radius: 4.5 },
];
