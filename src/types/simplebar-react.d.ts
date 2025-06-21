declare module 'simplebar-react' {
    import { ComponentType, HTMLAttributes, ReactNode } from 'react';

    export interface SimpleBarProps extends HTMLAttributes<HTMLDivElement> {
        scrollableNodeProps?: object;
        forceVisible?: boolean | 'x' | 'y';
        autoHide?: boolean;
        direction?: 'ltr' | 'rtl';
        children?: ReactNode;
        classNames?: {
            contentEl?: string;
            contentWrapper?: string;
            offset?: string;
            mask?: string;
            wrapper?: string;
            placeholder?: string;
            scrollbar?: string;
            track?: string;
            heightAutoObserverWrapperEl?: string;
            heightAutoObserverEl?: string;
            visible?: string;
            horizontal?: string;
            vertical?: string;
            hover?: string;
            dragging?: string;
        };
    }

    const SimpleBar: ComponentType<SimpleBarProps>;

    export default SimpleBar;
}
