import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'pptxtojson - PPTX转JSON',
  description: 'Office PowerPoint(.pptx) file to JSON | 将 PPTX 文件转为可读的 JSON 数据',
  keywords: 'pptx2json,pptxtojson,ppt,powerpoint,json,javascript,PPT解析,PPT转JSON',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>{children}</body>
    </html>
  )
}