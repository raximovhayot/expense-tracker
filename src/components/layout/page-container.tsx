import { cn } from '@/lib/utils'

interface PageContainerProps {
    children: React.ReactNode
    className?: string
    fullWidth?: boolean
}

export function PageContainer({
    children,
    className,
    fullWidth = true
}: PageContainerProps) {
    return (
        <div
            className={cn(
                "h-full animate-enter pb-20 md:pb-0", // Base styles + animation + mobile nav padding
                fullWidth ? "w-full" : "container mx-auto max-w-7xl", // Width control
                "p-4 md:p-8", // Standard padding
                className
            )}
        >
            {children}
        </div>
    )
}
