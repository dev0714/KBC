'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export function PortalButton() {
  const [clicked, setClicked] = useState(false)

  return (
    <Button 
      onClick={() => setClicked(true)}
      asChild 
      size="lg" 
      className={clicked ? "bg-slate-500 text-white font-semibold cursor-default hover:bg-slate-500" : "bg-accent hover:bg-accent/90 text-white font-semibold"}
      disabled={clicked}
    >
      <Link href={clicked ? "#" : "/customer-portal"}>Go to Portal</Link>
    </Button>
  )
}
