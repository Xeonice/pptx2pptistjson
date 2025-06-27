"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { JsonInputs } from "./JsonInputs"

interface DiffDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DiffDialog({ open, onOpenChange }: DiffDialogProps) {
  const [leftJson, setLeftJson] = useState("")
  const [rightJson, setRightJson] = useState("")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl w-[95vw] h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-slate-50 to-gray-50">
          <DialogTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            JSON 对比工具
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-hidden p-6">
          <JsonInputs
            leftJson={leftJson}
            rightJson={rightJson}
            onLeftChange={setLeftJson}
            onRightChange={setRightJson}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}