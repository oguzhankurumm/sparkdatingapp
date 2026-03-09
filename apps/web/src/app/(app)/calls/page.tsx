'use client'

import { useState } from 'react'
import { VideoCamera, Gear } from '@phosphor-icons/react'
import { Toggle, Slider, Typography } from '@spark/ui'
import { CALL_RATE } from '@spark/types'
import { useSetReadyForCall, useSetCallRate } from './hooks'
import { ReadyUsersSection } from './components/ready-users-section'
import { CallHistorySection } from './components/call-history-section'

export default function CallsPage() {
  const [isReady, setIsReady] = useState(false)
  const [callRate, setCallRate] = useState<number>(CALL_RATE.DEFAULT)
  const [showSettings, setShowSettings] = useState(false)

  const setReadyMutation = useSetReadyForCall()
  const setRateMutation = useSetCallRate()

  function handleToggleReady(checked: boolean) {
    setIsReady(checked)
    setReadyMutation.mutate(checked)
  }

  function handleRateChange(value: number) {
    setCallRate(value)
  }

  function handleRateCommit() {
    setRateMutation.mutate(callRate)
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <VideoCamera size={24} weight="bold" className="text-primary" />
          <Typography variant="h2">Calls</Typography>
        </div>
        <button
          type="button"
          onClick={() => setShowSettings((v) => !v)}
          className="text-text-muted hover:text-text-primary rounded-lg p-2 transition-colors"
        >
          <Gear size={22} weight="bold" />
        </button>
      </div>

      {/* Ready for Call toggle + Settings */}
      <div className="bg-surface space-y-4 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-text-primary text-sm font-semibold">Ready for Call</p>
            <p className="text-text-muted text-xs">Let others see you&apos;re available</p>
          </div>
          <Toggle
            checked={isReady}
            onChange={handleToggleReady}
            disabled={setReadyMutation.isPending}
          />
        </div>

        {/* Call rate settings (collapsible) */}
        {showSettings && (
          <div className="border-border space-y-3 border-t pt-4">
            <div className="flex items-center justify-between">
              <p className="text-text-primary text-sm font-medium">Call Rate</p>
              <span className="text-text-primary text-sm font-semibold">{callRate}t/min</span>
            </div>
            <Slider
              min={CALL_RATE.MIN}
              max={CALL_RATE.MAX}
              step={5}
              value={callRate}
              onChange={handleRateChange}
              onMouseUp={handleRateCommit}
              onTouchEnd={handleRateCommit}
            />
            <p className="text-text-muted text-xs">
              How many tokens callers pay per minute. You earn 80%.
            </p>
          </div>
        )}
      </div>

      {/* Ready Users — horizontal carousel */}
      <ReadyUsersSection />

      {/* Call History */}
      <CallHistorySection />
    </div>
  )
}
