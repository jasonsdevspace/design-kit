export function isDockerfile(path: string): boolean;
export function problemsIn(text: string, { issues }: {
    issues: boolean;
}): string[];
export function isScanned(path: string): boolean;
export function proseProblems(path: string, source: string, label?: string): string[];
export type Segment = {
    index: number;
    text: string;
};
