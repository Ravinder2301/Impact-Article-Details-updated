// typings/jquery.d.ts

declare module 'jquery' {
    interface JQuery<TElement = HTMLElement> {
      modal(action: string): this;
    }
  }
  