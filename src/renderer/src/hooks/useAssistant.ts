import { getDefaultTopic } from '@renderer/services/assistant'
import LocalStorage from '@renderer/services/storage'
import { useAppDispatch, useAppSelector } from '@renderer/store'
import {
  addAssistant,
  addTopic,
  removeAllTopics,
  removeAssistant,
  removeTopic,
  setModel,
  updateAssistant,
  updateAssistants,
  updateAssistantSettings,
  updateDefaultAssistant,
  updateTopic,
  updateTopics
} from '@renderer/store/assistants'
import { setDefaultModel, setTopicNamingModel, setTranslateModel } from '@renderer/store/llm'
import { Assistant, AssistantSettings, Model, Topic } from '@renderer/types'

export function useAssistants() {
  const { assistants } = useAppSelector((state) => state.assistants)
  const dispatch = useAppDispatch()

  return {
    assistants,
    updateAssistants: (assistants: Assistant[]) => dispatch(updateAssistants(assistants)),
    addAssistant: (assistant: Assistant) => dispatch(addAssistant(assistant)),
    removeAssistant: (id: string) => {
      dispatch(removeAssistant({ id }))
      const assistant = assistants.find((a) => a.id === id)
      const topics = assistant?.topics || []
      topics.forEach(({ id }) => LocalStorage.removeTopic(id))
    }
  }
}

export function useAssistant(id: string) {
  const assistant = useAppSelector((state) => state.assistants.assistants.find((a) => a.id === id) as Assistant)
  const dispatch = useAppDispatch()
  const { defaultModel } = useDefaultModel()

  return {
    assistant,
    model: assistant?.model ?? defaultModel,
    addTopic: (topic: Topic) => dispatch(addTopic({ assistantId: assistant.id, topic })),
    removeTopic: (topic: Topic) => {
      LocalStorage.removeTopic(topic.id)
      dispatch(removeTopic({ assistantId: assistant.id, topic }))
    },
    updateTopic: (topic: Topic) => dispatch(updateTopic({ assistantId: assistant.id, topic })),
    updateTopics: (topics: Topic[]) => dispatch(updateTopics({ assistantId: assistant.id, topics })),
    removeAllTopics: () => dispatch(removeAllTopics({ assistantId: assistant.id })),
    setModel: (model: Model) => dispatch(setModel({ assistantId: assistant.id, model })),
    updateAssistant: (assistant: Assistant) => dispatch(updateAssistant(assistant)),
    updateAssistantSettings: (settings: AssistantSettings) => {
      dispatch(updateAssistantSettings({ assistantId: assistant.id, settings }))
    }
  }
}

export function useDefaultAssistant() {
  const defaultAssistant = useAppSelector((state) => state.assistants.defaultAssistant)
  const dispatch = useAppDispatch()

  return {
    defaultAssistant: {
      ...defaultAssistant,
      topics: [getDefaultTopic()]
    },
    updateDefaultAssistant: (assistant: Assistant) => dispatch(updateDefaultAssistant({ assistant }))
  }
}

export function useDefaultModel() {
  const { defaultModel, topicNamingModel, translateModel } = useAppSelector((state) => state.llm)
  const dispatch = useAppDispatch()

  return {
    defaultModel,
    topicNamingModel,
    translateModel,
    setDefaultModel: (model: Model) => dispatch(setDefaultModel({ model })),
    setTopicNamingModel: (model: Model) => dispatch(setTopicNamingModel({ model })),
    setTranslateModel: (model: Model) => dispatch(setTranslateModel({ model }))
  }
}
