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
                "min-h-full animate-enter", // Base styles + animation
                fullWidth ? "w-full" : "container mx-auto max-w-7xl", // Width control
                "space-y-6", // Standard vertical spacing
                className
            )}
        >
            {children}
        </div>
    )
}
