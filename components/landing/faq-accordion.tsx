'use client'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

interface FaqItem {
  q: string
  a: string
  defaultOpen?: boolean
}

export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const defaultIndex = items.findIndex((i) => i.defaultOpen)

  return (
    <Accordion
      type="single"
      collapsible
      defaultValue={defaultIndex >= 0 ? `faq-${defaultIndex}` : undefined}
      className="border-t border-border"
    >
      {items.map((item, i) => (
        <AccordionItem
          key={item.q}
          value={`faq-${i}`}
          className="data-[state=open]:bg-primary/5 data-[state=open]:border-l-2 data-[state=open]:border-l-primary transition-colors"
        >
          <AccordionTrigger className="px-4 font-semibold hover:no-underline data-[state=open]:text-primary">
            {item.q}
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-5 leading-relaxed text-muted-foreground">
            {item.a}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
