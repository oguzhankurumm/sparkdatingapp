'use client'

import { useEffect, useState } from 'react'
import { MapPin, NavigationArrow, SpinnerGap } from '@phosphor-icons/react'
import { Button, FormField, Input, cn } from '@spark/ui'
import type { OnboardingData } from '@/lib/stores/onboarding-store'

interface StepLocationProps {
  data: OnboardingData
  updateData: (partial: Partial<OnboardingData>) => void
  onValidChange: (valid: boolean) => void
}

type LocationStatus = 'idle' | 'loading' | 'success' | 'error' | 'manual'

export function StepLocation({ data, updateData, onValidChange }: StepLocationProps) {
  const [status, setStatus] = useState<LocationStatus>(data.city ? 'success' : 'idle')
  const [geoError, setGeoError] = useState<string | null>(null)

  const city = data.city ?? ''
  const country = data.country ?? ''

  useEffect(() => {
    const hasLocation =
      (data.latitude !== undefined && data.longitude !== undefined) ||
      (city.trim().length > 0 && country.trim().length > 0)
    onValidChange(hasLocation)
  }, [data.latitude, data.longitude, city, country, onValidChange])

  const handleRequestLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser')
      return
    }

    setStatus('loading')
    setGeoError(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        updateData({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          // In a real app, we'd reverse-geocode. For now, set placeholder.
          city: 'Detected City',
          country: 'Detected Country',
        })
        setStatus('success')
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setGeoError('Location permission denied. You can enter it manually.')
            break
          case error.POSITION_UNAVAILABLE:
            setGeoError('Location unavailable. Try entering manually.')
            break
          case error.TIMEOUT:
            setGeoError('Location request timed out. Try again or enter manually.')
            break
          default:
            setGeoError('Unable to get your location. Try entering manually.')
        }
        setStatus('error')
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    )
  }

  const showManualInput = status === 'manual' || status === 'error'

  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* Heading */}
      <div>
        <h2 className="font-heading text-text-primary text-2xl font-bold">Where are you?</h2>
        <p className="text-text-secondary mt-1 text-sm">
          Share your location to find matches nearby
        </p>
      </div>

      {/* Location illustration */}
      <div className="flex flex-col items-center gap-4 py-4">
        <div
          className={cn(
            'flex h-24 w-24 items-center justify-center rounded-full transition-all duration-300',
            status === 'success'
              ? 'bg-success/10'
              : status === 'loading'
                ? 'bg-primary-light animate-pulse'
                : 'bg-primary-light',
          )}
        >
          {status === 'loading' ? (
            <SpinnerGap size={40} weight="bold" className="text-primary animate-spin" />
          ) : status === 'success' ? (
            <MapPin size={40} weight="fill" className="text-success" />
          ) : (
            <NavigationArrow size={40} weight="fill" className="text-primary" />
          )}
        </div>

        {status === 'success' ? (
          <div className="text-center">
            <p className="text-text-primary text-lg font-semibold">
              {city}
              {country ? `, ${country}` : ''}
            </p>
            <p className="text-text-muted mt-0.5 text-xs">Location detected</p>
          </div>
        ) : null}
      </div>

      {/* Auto-detect button */}
      {status !== 'success' ? (
        <Button
          variant="primary"
          size="lg"
          onClick={handleRequestLocation}
          loading={status === 'loading'}
          className="w-full"
        >
          <NavigationArrow size={18} weight="bold" />
          Allow Location Access
        </Button>
      ) : (
        <Button variant="secondary" size="md" onClick={handleRequestLocation} className="w-full">
          Update Location
        </Button>
      )}

      {/* Error message */}
      {geoError ? (
        <p className="bg-danger/10 text-danger rounded-xl px-4 py-3 text-center text-sm">
          {geoError}
        </p>
      ) : null}

      {/* Manual entry toggle */}
      {status !== 'success' ? (
        <div className="flex items-center gap-2">
          <div className="bg-border h-px flex-1" />
          <button
            type="button"
            onClick={() => setStatus('manual')}
            className="text-text-muted hover:text-primary text-xs font-medium"
          >
            Or enter manually
          </button>
          <div className="bg-border h-px flex-1" />
        </div>
      ) : null}

      {/* Manual input fields */}
      {showManualInput ? (
        <div className="space-y-4">
          <FormField label="City" required>
            <Input
              placeholder="e.g., Istanbul"
              value={city === 'Detected City' ? '' : city}
              onChange={(e) => updateData({ city: e.target.value })}
            />
          </FormField>
          <FormField label="Country" required>
            <Input
              placeholder="e.g., Turkey"
              value={country === 'Detected Country' ? '' : country}
              onChange={(e) => updateData({ country: e.target.value })}
            />
          </FormField>
        </div>
      ) : null}
    </div>
  )
}
