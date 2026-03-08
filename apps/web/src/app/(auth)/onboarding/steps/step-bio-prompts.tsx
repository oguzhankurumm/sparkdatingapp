'use client'

import { useEffect, useState } from 'react'
import { PencilSimple, PlusCircle, Trash } from '@phosphor-icons/react'
import { Button, FormField, Input, cn } from '@spark/ui'
import type { OnboardingData } from '@/lib/stores/onboarding-store'

interface StepBioPromptsProps {
  data: OnboardingData
  updateData: (partial: Partial<OnboardingData>) => void
  onValidChange: (valid: boolean) => void
}

const PROMPT_OPTIONS = [
  'My ideal weekend looks like...',
  'A fun fact about me...',
  "I'm looking for someone who...",
  'My love language is...',
  'The way to my heart is...',
]

const MAX_BIO_LENGTH = 500
const MAX_PROMPTS = 3

export function StepBioPrompts({ data, updateData, onValidChange }: StepBioPromptsProps) {
  const bio = data.bio ?? ''
  const prompts = data.prompts ?? []
  const [editingPromptIndex, setEditingPromptIndex] = useState<number | null>(null)
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null)
  const [promptAnswer, setPromptAnswer] = useState('')

  useEffect(() => {
    const hasBio = bio.trim().length >= 10
    onValidChange(hasBio)
  }, [bio, onValidChange])

  const usedQuestions = prompts.map((p) => p.question)
  const availableQuestions = PROMPT_OPTIONS.filter((q) => !usedQuestions.includes(q))

  const handleAddPrompt = () => {
    if (availableQuestions.length > 0) {
      setSelectedQuestion(null)
      setPromptAnswer('')
      setEditingPromptIndex(prompts.length)
    }
  }

  const handleSavePrompt = () => {
    if (!selectedQuestion || promptAnswer.trim().length < 3) return

    const newPrompts = [...prompts]
    if (editingPromptIndex !== null && editingPromptIndex < prompts.length) {
      newPrompts[editingPromptIndex] = {
        question: selectedQuestion,
        answer: promptAnswer.trim(),
      }
    } else {
      newPrompts.push({
        question: selectedQuestion,
        answer: promptAnswer.trim(),
      })
    }
    updateData({ prompts: newPrompts })
    setEditingPromptIndex(null)
    setSelectedQuestion(null)
    setPromptAnswer('')
  }

  const handleDeletePrompt = (index: number) => {
    const newPrompts = prompts.filter((_, i) => i !== index)
    updateData({ prompts: newPrompts })
  }

  const handleEditPrompt = (index: number) => {
    const prompt = prompts[index]
    if (prompt) {
      setSelectedQuestion(prompt.question)
      setPromptAnswer(prompt.answer)
      setEditingPromptIndex(index)
    }
  }

  const isEditingOrAdding = editingPromptIndex !== null

  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* Heading */}
      <div>
        <h2 className="font-heading text-text-primary text-2xl font-bold">Express yourself</h2>
        <p className="text-text-secondary mt-1 text-sm">
          Write a bio and answer prompts to stand out
        </p>
      </div>

      {/* Bio */}
      <FormField
        label="Bio"
        required
        helperText={`${bio.length}/${MAX_BIO_LENGTH} characters`}
        error={
          bio.length > 0 && bio.trim().length < 10
            ? 'Bio must be at least 10 characters'
            : undefined
        }
      >
        <textarea
          placeholder="Write something interesting about yourself..."
          value={bio}
          onChange={(e) => updateData({ bio: e.target.value })}
          maxLength={MAX_BIO_LENGTH}
          rows={4}
          className={cn(
            'border-border bg-surface-elevated text-text-primary placeholder:text-text-muted focus:ring-primary/30 focus:border-primary w-full resize-none rounded-xl border px-4 py-3 text-sm transition-all duration-200 focus:outline-none focus:ring-2',
            bio.length > 0 && bio.trim().length < 10 && 'border-danger focus:ring-danger/30',
          )}
        />
      </FormField>

      {/* Prompts section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-text-primary text-sm font-medium">
            Dating Prompts
            <span className="text-text-muted ml-1 text-xs">
              ({prompts.length}/{MAX_PROMPTS})
            </span>
          </label>
        </div>

        {/* Existing prompts */}
        {prompts.map((prompt, index) => (
          <div key={index} className="border-border bg-surface-elevated rounded-xl border p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p className="text-primary text-xs font-semibold uppercase tracking-wide">
                  {prompt.question}
                </p>
                <p className="text-text-primary mt-1 text-sm">{prompt.answer}</p>
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => handleEditPrompt(index)}
                  className="text-text-muted hover:bg-surface hover:text-text-primary flex h-7 w-7 items-center justify-center rounded-full"
                  aria-label="Edit prompt"
                >
                  <PencilSimple size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeletePrompt(index)}
                  className="text-text-muted hover:bg-danger/10 hover:text-danger flex h-7 w-7 items-center justify-center rounded-full"
                  aria-label="Delete prompt"
                >
                  <Trash size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Add/Edit prompt form */}
        {isEditingOrAdding ? (
          <div className="border-primary/20 bg-primary-light/30 space-y-3 rounded-xl border-2 p-4">
            {/* Question picker */}
            <div className="space-y-2">
              <span className="text-text-secondary text-xs font-medium">Choose a prompt</span>
              <div className="flex flex-wrap gap-2">
                {PROMPT_OPTIONS.filter(
                  (q) => q === selectedQuestion || !usedQuestions.includes(q),
                ).map((question) => (
                  <button
                    key={question}
                    type="button"
                    onClick={() => setSelectedQuestion(question)}
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-xs font-medium transition-all',
                      selectedQuestion === question
                        ? 'border-primary bg-primary text-white'
                        : 'border-border bg-surface-elevated text-text-secondary hover:border-primary/30',
                    )}
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>

            {/* Answer input */}
            {selectedQuestion ? (
              <FormField label="Your answer">
                <Input
                  placeholder="Type your answer..."
                  value={promptAnswer}
                  onChange={(e) => setPromptAnswer(e.target.value)}
                  maxLength={200}
                />
              </FormField>
            ) : null}

            {/* Save / Cancel */}
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditingPromptIndex(null)
                  setSelectedQuestion(null)
                  setPromptAnswer('')
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSavePrompt}
                disabled={!selectedQuestion || promptAnswer.trim().length < 3}
              >
                Save Prompt
              </Button>
            </div>
          </div>
        ) : prompts.length < MAX_PROMPTS ? (
          <button
            type="button"
            onClick={handleAddPrompt}
            className="border-border text-text-muted hover:border-primary/30 hover:text-primary flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed py-4 text-sm font-medium transition-colors"
          >
            <PlusCircle size={20} />
            Add a Prompt
          </button>
        ) : null}
      </div>
    </div>
  )
}
