// page-flip (StPageFlip, MIT) ships TypeScript sources but no declarations; this covers what the reader uses.
declare module "page-flip/dist/js/page-flip.module.js" {
  export interface FlipSettings {
    width: number;
    height: number;
    size?: "fixed" | "stretch";
    minWidth?: number;
    maxWidth?: number;
    minHeight?: number;
    maxHeight?: number;
    showCover?: boolean;
    usePortrait?: boolean;
    autoSize?: boolean;
    drawShadow?: boolean;
    maxShadowOpacity?: number;
    flippingTime?: number;
    mobileScrollSupport?: boolean;
    swipeDistance?: number;
    showPageCorners?: boolean;
    startPage?: number;
  }
  export class PageFlip {
    constructor(el: HTMLElement, settings: FlipSettings);
    loadFromHTML(items: NodeListOf<HTMLElement> | HTMLElement[]): void;
    on(event: "flip" | "changeOrientation" | "changeState" | "init" | "update", cb: (e: { data: unknown }) => void): this;
    flipNext(): void;
    flipPrev(): void;
    flip(page: number): void;
    turnToPage(page: number): void;
    getCurrentPageIndex(): number;
    getPageCount(): number;
    getOrientation(): "portrait" | "landscape";
    update(): void;
    destroy(): void;
  }
}
