import { gql } from '@apollo/client'

export const CREATE_CHANNEL = gql`
  mutation CreateChannel($name: String!, $description: String, $type: String!, $isPrivate: Boolean!) {
    insert_nchat_channels_one(object: {
      name: $name
      description: $description
      type: $type
      is_private: $isPrivate
    }) {
      id
      name
      type
    }
  }
`

export const UPDATE_CHANNEL = gql`
  mutation UpdateChannel($channelId: uuid!, $name: String, $description: String, $topic: String) {
    update_nchat_channels_by_pk(
      pk_columns: { id: $channelId }
      _set: { name: $name, description: $description, topic: $topic }
    ) {
      id
      name
      description
      topic
    }
  }
`

export const JOIN_CHANNEL = gql`
  mutation JoinChannel($channelId: uuid!, $userId: uuid!) {
    insert_nchat_channel_members_one(object: {
      channel_id: $channelId
      user_id: $userId
      role: "member"
    }) {
      channel_id
      user_id
    }
  }
`

export const LEAVE_CHANNEL = gql`
  mutation LeaveChannel($channelId: uuid!, $userId: uuid!) {
    delete_nchat_channel_members(where: {
      channel_id: { _eq: $channelId }
      user_id: { _eq: $userId }
    }) {
      affected_rows
    }
  }
`
