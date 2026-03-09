'use client'

import { useState } from 'react'
import { Plus } from '@phosphor-icons/react'
import { Button, BottomSheet } from '@spark/ui'
import { MyTablesSection } from './components/my-tables-section'
import { BrowseTablesSection } from './components/browse-tables-section'
import { CreateTableForm } from './components/create-table-form'

export default function TablesPage() {
  const [showCreate, setShowCreate] = useState(false)

  return (
    <div className="pb-24">
      {/* Page header */}
      <div className="flex items-center justify-between px-4 pb-2 pt-4">
        <h1 className="font-heading text-text-primary text-2xl font-bold">Tables</h1>
        <Button variant="like" size="sm" onClick={() => setShowCreate(true)}>
          <Plus size={16} weight="bold" />
          Host
        </Button>
      </div>

      {/* Content */}
      <div className="space-y-6 pt-2">
        <MyTablesSection />
        <BrowseTablesSection />
      </div>

      {/* Create table bottom sheet */}
      <BottomSheet open={showCreate} onClose={() => setShowCreate(false)} title="Host a Table">
        <div className="px-4 pb-6">
          <CreateTableForm
            onSuccess={() => setShowCreate(false)}
            onCancel={() => setShowCreate(false)}
          />
        </div>
      </BottomSheet>
    </div>
  )
}
