import { gql } from '@apollo/client'

export const SEND_MESSAGE = gql`
  mutation SendMessage($channelId: uuid!, $content: String!, $replyToId: uuid) {
    insert_nchat_messages_one(object: {
      channel_id: $channelId
      content: $content
      reply_to_id: $replyToId
    }) {
      id
      content
      created_at
      channel_id
    }
  }
`

export const UPDATE_MESSAGE = gql`
  mutation UpdateMessage($messageId: uuid!, $content: String!) {
    update_nchat_messages_by_pk(
      pk_columns: { id: $messageId }
      _set: { content: $content, updated_at: "now()" }
    ) {
      id
      content
      updated_at
    }
  }
`

export const DELETE_MESSAGE = gql`
  mutation DeleteMessage($messageId: uuid!) {
    delete_nchat_messages_by_pk(id: $messageId) {
      id
    }
  }
`

// Re-export reaction mutations for convenience
export { ADD_REACTION, REMOVE_REACTION } from './reactions'