import { useSubscription, useMutation } from '@apollo/client'
import { USER_CHANNELS_SUBSCRIPTION, CHANNEL_DETAILS_SUBSCRIPTION } from '@/graphql/subscriptions/channels'
import { CREATE_CHANNEL, UPDATE_CHANNEL, JOIN_CHANNEL, LEAVE_CHANNEL } from '@/graphql/mutations/channels'
import { useAuth } from '@/contexts/auth-context'
import { useCallback, useMemo } from 'react'

interface Channel {
  id: string
  name: string
  description?: string
  type: string
  is_private: boolean
  created_at: string
  updated_at: string
  owner_id: string
  topic?: string
  icon?: string
  members_aggregate?: { aggregate: { count: number } }
}

interface ChannelMembership {
  channel: Channel
  role: string
  joined_at: string
  is_muted: boolean
  last_read_at?: string
}

export function useUserChannels() {
  const { user } = useAuth()

  const { data, loading, error } = useSubscription(USER_CHANNELS_SUBSCRIPTION, {
    variables: { userId: user?.id },
    skip: !user?.id,
  })

  const channels = useMemo(() => {
    return (data?.nchat_channel_members ?? []).map((m: ChannelMembership) => ({
      ...m.channel,
      userRole: m.role,
      isMuted: m.is_muted,
      lastReadAt: m.last_read_at,
    }))
  }, [data])

  return { channels, loading, error }
}

export function useChannelDetails(channelId: string | null) {
  const { data, loading, error } = useSubscription(CHANNEL_DETAILS_SUBSCRIPTION, {
    variables: { channelId },
    skip: !channelId,
  })

  return {
    channel: data?.nchat_channels_by_pk as Channel | null,
    loading,
    error,
  }
}

export function useChannelMutations() {
  const { user } = useAuth()
  const [createMutation] = useMutation(CREATE_CHANNEL)
  const [updateMutation] = useMutation(UPDATE_CHANNEL)
  const [joinMutation] = useMutation(JOIN_CHANNEL)
  const [leaveMutation] = useMutation(LEAVE_CHANNEL)

  const createChannel = useCallback(async (name: string, type: string, isPrivate: boolean, description?: string) => {
    const result = await createMutation({
      variables: { name, type, isPrivate, description },
    })
    return result.data?.insert_nchat_channels_one
  }, [createMutation])

  const updateChannel = useCallback(async (channelId: string, updates: { name?: string; description?: string; topic?: string }) => {
    const result = await updateMutation({
      variables: { channelId, ...updates },
    })
    return result.data?.update_nchat_channels_by_pk
  }, [updateMutation])

  const joinChannel = useCallback(async (channelId: string) => {
    if (!user?.id) return null
    const result = await joinMutation({
      variables: { channelId, userId: user.id },
    })
    return result.data?.insert_nchat_channel_members_one
  }, [joinMutation, user?.id])

  const leaveChannel = useCallback(async (channelId: string) => {
    if (!user?.id) return
    await leaveMutation({
      variables: { channelId, userId: user.id },
    })
  }, [leaveMutation, user?.id])

  return { createChannel, updateChannel, joinChannel, leaveChannel }
}
