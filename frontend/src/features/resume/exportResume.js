import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

export async function exportResumePDF(element, filename = 'InnovX-Resume.pdf') {
  if (!element) return
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
  })
  const img = canvas.toDataURL('image/png')
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const w = pdf.internal.pageSize.getWidth()
  const h = (canvas.height * w) / canvas.width
  const pageH = pdf.internal.pageSize.getHeight()
  let y = 0
  let remaining = h
  while (remaining > 0) {
    pdf.addImage(img, 'PNG', 0, y === 0 ? 0 : -y, w, h)
    remaining -= pageH
    if (remaining > 0) {
      pdf.addPage()
      y += pageH
    }
  }
  pdf.save(filename)
}

export async function exportResumePNG(element, filename = 'InnovX-Resume.png') {
  if (!element) return
  const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#fff' })
  const link = document.createElement('a')
  link.download = filename
  link.href = canvas.toDataURL('image/png')
  link.click()
}

export function printResume(elementId) {
  const el = document.getElementById(elementId)
  if (!el) return
  const win = window.open('', '_blank')
  win.document.write(`<html><head><title>Resume</title>
    <style>@page{size:A4;margin:12mm}body{margin:0;font-family:Inter,sans-serif}</style></head><body>${el.innerHTML}</body></html>`)
  win.document.close()
  win.focus()
  setTimeout(() => { win.print(); win.close() }, 400)
}
