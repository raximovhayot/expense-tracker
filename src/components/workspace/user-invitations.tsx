
import { useState, useEffect } from 'react'
import { useServerFn } from '@tanstack/react-start'
import { Check, X, Mail } from 'lucide-react'
import { toast } from 'sonner'
import {
    getUserInvitationsFn,
    respondToInvitationFn,
} from '@/server/functions/workspaces'
import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

interface UseInvitationsProps {
    onUpdate?: () => void
}

// Define the shape of an invitation based on what getUserInvitationsFn returns
interface Invitation {
    $id: string
    workspaceName: string
    role: string
    [key: string]: unknown
}

export function UserInvitations({ onUpdate }: UseInvitationsProps) {
    const [invitations, setInvitations] = useState<Invitation[]>([])
    const [loading, setLoading] = useState(true)
    const [processingId, setProcessingId] = useState<string | null>(null)

    const fetchInvitations = useServerFn(getUserInvitationsFn)
    const respondToInvitation = useServerFn(respondToInvitationFn)

    useEffect(() => {
        loadInvitations()
    }, [])

    async function loadInvitations() {
        try {
            const result = await fetchInvitations()
            // Ensure the result matches our expected type or cast it if we trust the server function
            setInvitations(result.invitations as Invitation[])
        } catch (error) {
            console.error('Failed to load invitations:', error)
        } finally {
            setLoading(false)
        }
    }

    async function handleResponse(invitationId: string, status: 'accepted' | 'rejected') {
        setProcessingId(invitationId)
        try {
            await respondToInvitation({
                data: { invitationId, status },
            })

            toast.success(
                status === 'accepted' ? 'Invitation accepted' : 'Invitation rejected'
            )

            if (status === 'accepted') {
                onUpdate?.()
            } else {
                // If rejected, just remove from list
                setInvitations((prev) => prev.filter((i) => i.$id !== invitationId))
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to process invitation';
            toast.error(message)
        } finally {
            setProcessingId(null)
        }
    }

    if (loading) {
        return (
            <div className="space-y-4 w-full max-w-md mx-auto">
                <Skeleton className="h-[120px] w-full rounded-xl" />
                <Skeleton className="h-[120px] w-full rounded-xl" />
            </div>
        )
    }

    if (invitations.length === 0) {
        return null
    }

    return (
        <div className="w-full max-w-md mx-auto space-y-4">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Pending Invitations
            </h3>
            {invitations.map((invitation) => (
                <Card key={invitation.$id}>
                    <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                            <div>
                                <CardTitle className="text-base">{invitation.workspaceName}</CardTitle>
                                <CardDescription>
                                    Invited as <Badge variant="outline">{invitation.role}</Badge>
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-3">
                            <Button
                                className="flex-1"
                                onClick={() => handleResponse(invitation.$id, 'accepted')}
                                disabled={processingId === invitation.$id}
                            >
                                {processingId === invitation.$id ? (
                                    '...'
                                ) : (
                                    <>
                                        <Check className="mr-2 h-4 w-4" /> Accept
                                    </>
                                )}
                            </Button>
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => handleResponse(invitation.$id, 'rejected')}
                                disabled={processingId === invitation.$id}
                            >
                                {processingId === invitation.$id ? (
                                    '...'
                                ) : (
                                    <>
                                        <X className="mr-2 h-4 w-4" /> Reject
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
