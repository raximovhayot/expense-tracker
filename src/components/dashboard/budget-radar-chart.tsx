import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    ResponsiveContainer,
} from 'recharts'

interface BudgetRadarChartProps {
    items: Array<{
        category: {
            name: string
            color: string | null
        }
        planned: number
        spent: number
    }>
}

export function BudgetRadarChart({ items }: BudgetRadarChartProps) {
    // Pad items to ensure at least a triangle if fewer than 3 categories
    const paddedItems = [...items]
    if (paddedItems.length > 0 && paddedItems.length < 3) {
        while (paddedItems.length < 3) {
            paddedItems.push({
                category: { name: '', color: null },
                planned: 0,
                spent: 0,
            })
        }
    }

    const data = paddedItems.map((item) => ({
        subject: item.category.name,
        planned: item.planned,
        spent: item.spent,
    }))

    if (items.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-muted/20 rounded-[2.5rem] border-2 border-dashed border-border/30">
                <p className="text-sm text-muted-foreground">No budget data available</p>
            </div>
        )
    }

    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                    <PolarGrid strokeOpacity={0.1} />
                    <PolarAngleAxis
                        dataKey="subject"
                        tick={{ fill: 'currentColor', opacity: 0.5, fontSize: 10 }}
                    />
                    <Radar
                        name="Planned"
                        dataKey="planned"
                        stroke="var(--color-primary)"
                        fill="var(--color-primary)"
                        fillOpacity={0.1}
                    />
                    <Radar
                        name="Spent"
                        dataKey="spent"
                        stroke="var(--color-destructive)"
                        fill="var(--color-destructive)"
                        fillOpacity={0.3}
                    />
                </RadarChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-center gap-4 mt-2 text-[10px] font-bold uppercase tracking-wider opacity-60">
                <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <span>Planned</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-destructive" />
                    <span>Spent</span>
                </div>
            </div>
        </div>
    )
}
