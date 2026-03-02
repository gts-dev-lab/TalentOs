'use client';

import * as React from 'react';
import { Menu } from 'lucide-react';

import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { Button, type ButtonProps } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

interface SidebarContextProps {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isMobile: boolean;
}

const SidebarContext = React.createContext<SidebarContextProps | undefined>(undefined);

export function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = React.useState(!isMobile);

  React.useEffect(() => {
    setIsOpen(!isMobile);
  }, [isMobile]);

  return (
    <SidebarContext.Provider value={{ isOpen, setIsOpen, isMobile }}>
      <TooltipProvider delayDuration={0}>{children}</TooltipProvider>
    </SidebarContext.Provider>
  );
}

export const Sidebar = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  ({ className, children, ...props }, ref) => {
    const { isOpen, isMobile, setIsOpen } = useSidebar();

    return (
      <>
        <aside
          ref={ref}
          className={cn(
            'frappe-sidebar fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-[hsl(var(--frappe-sidebar-muted)_/_0.25)] shadow-frappe-md transition-all duration-frappe-slow ease-in-out',
            isMobile ? 'w-64' : isOpen ? 'w-64' : 'w-[72px]',
            isMobile && !isOpen && '-translate-x-full',
            className
          )}
          {...props}
        >
          {children}
        </aside>
        {isMobile && isOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 animate-in fade-in duration-300"
            onClick={() => setIsOpen(false)}
            aria-label="Cerrar menú"
          />
        )}
      </>
    );
  }
);
Sidebar.displayName = 'Sidebar';

export const SidebarHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const { isOpen } = useSidebar();
    return (
      <div
        ref={ref}
        className={cn('flex h-16 items-center border-b', isOpen ? '' : 'justify-center', className)}
        {...props}
      />
    );
  }
);
SidebarHeader.displayName = 'SidebarHeader';

export const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex-1 overflow-y-auto overflow-x-hidden px-2 py-3', className)}
    {...props}
  />
));
SidebarContent.displayName = 'SidebarContent';

export const SidebarMenu = React.forwardRef<
  HTMLUListElement,
  React.HTMLAttributes<HTMLUListElement>
>(({ className, ...props }, ref) => (
  <ul ref={ref} className={cn('space-y-0.5', className)} {...props} />
));
SidebarMenu.displayName = 'SidebarMenu';

export const SidebarMenuItem = React.forwardRef<HTMLLIElement, React.HTMLAttributes<HTMLLIElement>>(
  ({ className, ...props }, ref) => <li ref={ref} className={cn(className)} {...props} />
);
SidebarMenuItem.displayName = 'SidebarMenuItem';

export const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  ButtonProps & { isActive?: boolean; tooltip?: string }
>(({ className, isActive, tooltip, children, ...props }, ref) => {
  const { isOpen } = useSidebar();

  const buttonContent = (
    <Button
      ref={ref}
      variant={isActive ? 'secondary' : 'ghost'}
      className={cn('h-12 w-full justify-start', !isOpen && 'justify-center', className)}
      {...props}
    >
      {React.Children.map(children, child => {
        if (React.isValidElement(child) && child.type === 'span') {
          return isOpen ? child : null;
        }
        return child;
      })}
    </Button>
  );

  if (isOpen || !tooltip) {
    return buttonContent;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{buttonContent}</TooltipTrigger>
      <TooltipContent side="right">{tooltip}</TooltipContent>
    </Tooltip>
  );
});
SidebarMenuButton.displayName = 'SidebarMenuButton';

export const SidebarFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('mt-auto border-t border-[hsl(var(--frappe-sidebar-muted)_/_0.25)]', className)}
      {...props}
    />
  )
);
SidebarFooter.displayName = 'SidebarFooter';

export const SidebarInset = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const { isOpen, isMobile } = useSidebar();
    return (
      <div
        ref={ref}
        className={cn(
          'transition-all duration-300 ease-in-out',
          !isMobile && (isOpen ? 'ml-64' : 'ml-[72px]'),
          className
        )}
        {...props}
      />
    );
  }
);
SidebarInset.displayName = 'SidebarInset';

export const SidebarTrigger = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, ...props }, ref) => {
    const { isOpen, setIsOpen } = useSidebar();
    return (
      <Button
        ref={ref}
        variant="ghost"
        size="icon"
        className={cn(
          'hover:bg-accent transition-transform duration-200 hover:scale-110',
          className
        )}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Cerrar menú' : 'Abrir menú'}
        {...props}
      >
        <Menu className="h-5 w-5" />
      </Button>
    );
  }
);
SidebarTrigger.displayName = 'SidebarTrigger';
